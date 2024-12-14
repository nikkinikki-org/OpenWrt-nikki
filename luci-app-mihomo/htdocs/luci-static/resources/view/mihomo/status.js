'use strict';
'require form';
'require view';
'require uci';
'require fs';
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
            mihomo.getAppLog(),
            mihomo.getCoreLog()
        ]);
    },
    render: function (data) {
        const appVersion = data[1];
        const coreVersion = data[2];
        const running = data[3];
        const appLog = data[4];
        const coreLog = data[5];

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

        s = m.section(form.NamedSection, 'log', 'log', _('Log'));

        s.tab('app_log', _('App Log'));

        o = s.taboption('app_log', form.Button, 'clear_app_log');
        o.inputstyle = 'negative';
        o.inputtitle = _('Clear Log');
        o.onclick = function () {
            m.lookupOption('mihomo.log._app_log')[0].getUIElement('log').setValue('');
            return mihomo.clearAppLog();
        };

        o = s.taboption('app_log', form.TextValue, '_app_log');
        o.rows = 25;
        o.wrap = false;
        o.load = function (section_id) {
            return appLog;
        };
        o.write = function (section_id, formvalue) {
            return true;
        };
        poll.add(L.bind(function () {
            const option = this;
            return L.resolveDefault(mihomo.getAppLog()).then(function (log) {
                option.getUIElement('log').setValue(log);
            });
        }, o));

        o = s.taboption('app_log', form.Button, 'scroll_app_log_to_bottom');
        o.inputtitle = _('Scroll To Bottom');
        o.onclick = function () {
            const element = m.lookupOption('mihomo.log._app_log')[0].getUIElement('log').node.firstChild;
            element.scrollTop = element.scrollHeight;
        };

        s.tab('core_log', _('Core Log'));

        o = s.taboption('core_log', form.Button, 'clear_core_log');
        o.inputstyle = 'negative';
        o.inputtitle = _('Clear Log');
        o.onclick = function () {
            m.lookupOption('mihomo.log._core_log')[0].getUIElement('log').setValue('');
            return mihomo.clearCoreLog();
        };

        o = s.taboption('core_log', form.TextValue, '_core_log');
        o.rows = 25;
        o.wrap = false;
        o.load = function (section_id) {
            return coreLog;
        };
        o.write = function (section_id, formvalue) {
            return true;
        };
        poll.add(L.bind(function () {
            const option = this;
            return L.resolveDefault(mihomo.getCoreLog()).then(function (log) {
                option.getUIElement('log').setValue(log);
            });
        }, o));

        o = s.taboption('core_log', form.Button, 'scroll_core_log_to_bottom');
        o.inputtitle = _('Scroll To Bottom');
        o.onclick = function () {
            const element = m.lookupOption('mihomo.log._core_log')[0].getUIElement('log').node.firstChild;
            element.scrollTop = element.scrollHeight;
        };

        return m.render();
    },
    handleSave: null,
    handleSaveApply: null,
    handleReset: null,
});