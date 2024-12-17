'use strict';
'require form';
'require view';
'require uci';
'require poll';
'require tools.mihomo as mihomo';

function renderStatus(running) {
    return updateStatus(E('input', { id: 'core_status', style: 'border: unset; font-style: italic; font-weight: bold;', readonly: '' }), running);
}

function updateStatus(element, running) {
    if (element) {
        element.style.color = running ? 'green' : 'red';
        element.value = running ? _('Running') : _('Not Running');
    }
    return element;
}

return view.extend({
    load: function () {
        return Promise.all([
            uci.load('mihomo'),
            mihomo.appVersion(),
            mihomo.coreVersion(),
            mihomo.status(),
            mihomo.listProfiles()
        ]);
    },
    render: function (data) {
        const subscriptions = uci.sections('mihomo', 'subscription');
        const appVersion = data[1];
        const coreVersion = data[2];
        const running = data[3];
        const profiles = data[4];

        let m, s, o;

        m = new form.Map('mihomo', _('MihomoTProxy'), `${_('Transparent Proxy with Mihomo on OpenWrt.')} <a href="https://github.com/morytyann/OpenWrt-mihomo/wiki" target="_blank">${_('How To Use')}</a>`);

        s = m.section(form.NamedSection, 'status', 'status', _('Status'));

        o = s.option(form.Value, '_app_version', _('App Version'));
        o.readonly = true;
        o.load = function () {
            return appVersion.trim();
        };
        o.write = function () { };

        o = s.option(form.Value, '_core_version', _('Core Version'));
        o.readonly = true;
        o.load = function () {
            return coreVersion.trim();
        };
        o.write = function () { };

        o = s.option(form.DummyValue, '_core_status', _('Core Status'));
        o.cfgvalue = function () {
            return renderStatus(running);
        };
        poll.add(function () {
            return L.resolveDefault(mihomo.status()).then(function (running) {
                updateStatus(document.getElementById('core_status'), running);
            });
        });

        o = s.option(form.Button, 'reload', '-');
        o.inputstyle = 'action';
        o.inputtitle = _('Reload Service');
        o.onclick = function () {
            return mihomo.reload();
        };

        o = s.option(form.Button, 'restart', '-');
        o.inputstyle = 'negative';
        o.inputtitle = _('Restart Service');
        o.onclick = function () {
            return mihomo.restart();
        };

        o = s.option(form.Button, 'update_dashboard', '-');
        o.inputstyle = 'positive';
        o.inputtitle = _('Update Dashboard');
        o.onclick = function () {
            return mihomo.callMihomoAPI('POST', '/upgrade/ui');
        };

        o = s.option(form.Button, 'open_dashboard', '-');
        o.inputtitle = _('Open Dashboard');
        o.onclick = function () {
            return mihomo.openDashboard();
        };

        s = m.section(form.NamedSection, 'config', 'config', _('App Config'));

        o = s.option(form.Flag, 'enabled', _('Enable'));
        o.rmempty = false;

        o = s.option(form.ListValue, 'profile', _('Choose Profile'));
        o.optional = true;

        for (const profile of profiles) {
            o.value('file:' + profile.name, _('File:') + profile.name);
        };

        for (const subscription of subscriptions) {
            o.value('subscription:' + subscription['.name'], _('Subscription:') + subscription.name);
        };

        o = s.option(form.Value, 'start_delay', _('Start Delay'));
        o.datatype = 'uinteger';
        o.placeholder = '0';

        o = s.option(form.Flag, 'scheduled_restart', _('Scheduled Restart'));
        o.rmempty = false;

        o = s.option(form.Value, 'cron_expression', _('Cron Expression'));
        o.retain = true;
        o.rmempty = false;
        o.depends('scheduled_restart', '1');

        o = s.option(form.Flag, 'test_profile', _('Test Profile'));
        o.rmempty = false;

        o = s.option(form.Flag, 'fast_reload', _('Fast Reload'));
        o.rmempty = false;

        s = m.section(form.NamedSection, 'config', 'config', _('Core Environment Variable Config'));

        o = s.option(form.Flag, 'disable_safe_path_check', _('Disable Safe Path Check'));
        o.ucisection = 'env';
        o.rmempty = false;

        o = s.option(form.Flag, 'disable_loopback_detector', _('Disable Loopback Detector'));
        o.ucisection = 'env';
        o.rmempty = false;

        o = s.option(form.Flag, 'disable_quic_go_gso', _('Disable GSO of quic-go'));
        o.ucisection = 'env';
        o.rmempty = false;

        o = s.option(form.Flag, 'disable_quic_go_ecn', _('Disable ECN of quic-go'));
        o.ucisection = 'env';
        o.rmempty = false;

        return m.render();
    }
});
