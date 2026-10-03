'use strict';
'require form';
'require view';
'require uci';
'require ui';
'require tools.nikki as nikki';

// how often a subscription is downloaded: set by hand, from the provider (profile-update-interval) or every hour
function intervalText(meta, section_id) {
    const interval = uci.get('nikki', section_id, 'update_interval');
    const hours = interval != null && interval !== '' ? +interval : (meta[section_id]?.interval ?? 1);
    return hours === 0 ? _('by hand') : _('every %d h').format(hours);
}

return view.extend({
    load: function () {
        return Promise.all([
            uci.load('nikki'),
            nikki.subscriptionMeta()
        ]);
    },
    render: function (data) {
        const meta = data[1];

        let m, s, o, so;

        m = new form.Map('nikki');

        s = m.section(form.NamedSection, 'config', 'config', _('Profile'));

        o = s.option(form.FileUpload, '_upload_profile', _('Upload Profile'));
        o.browser = true;
        o.enable_download = true;
        o.root_directory = nikki.profilesDir;
        o.write = function (section_id, formvalue) {
            return true;
        };

        o = s.option(form.Button, '_hard_update', _('Hard Update'), _('Remove everything downloaded from providers of the current profile (proxy and rule providers), download the subscription again and restart. Files of local providers are kept.'));
        o.inputstyle = 'negative';
        o.inputtitle = _('Hard Update');
        o.onclick = function () {
            if (!confirm(_('The proxy will be restarted and all providers will be downloaded again. Continue?'))) {
                return;
            }
            return nikki.hardUpdate().then(function () {
                ui.addNotification(null, E('p', _('Hard update started, see the Log page for progress.')), 'info');
            });
        };

        s = m.section(form.GridSection, 'subscription', _('Subscription'));
        s.addremove = true;
        s.anonymous = true;
        s.sortable = true;
        // descriptions are for the edit dialog, not for the table
        s.nodescriptions = true;
        s.modaltitle = _('Edit Subscription');

        o = s.option(form.Value, 'name', _('Subscription Name'), _('Replaced with the title of the provider when it sends one.'));
        o.rmempty = false;
        o.textvalue = function (section_id) {
            return E('span', {}, [nikki.providerLogo(meta[section_id]?.logo, 24), this.cfgvalue(section_id) ?? '']);
        };

        o = s.option(form.Value, 'used', _('Used'));
        o.modalonly = false;
        o.optional = true;
        o.readonly = true;

        o = s.option(form.Value, 'total', _('Total'));
        o.modalonly = false;
        o.optional = true;
        o.readonly = true;

        o = s.option(form.Value, 'expire', _('Expire At'));
        o.modalonly = false;
        o.optional = true;
        o.readonly = true;

        o = s.option(form.Value, 'update', _('Update At'));
        o.modalonly = false;
        o.optional = true;
        o.readonly = true;
        o.textvalue = function (section_id) {
            // the info of the last successful update stays when an update fails
            const failed = uci.get('nikki', section_id, 'success') === '0';
            return E('div', {}, [
                this.cfgvalue(section_id) ?? '-',
                failed ? E('div', { style: 'color: red' }, [_('Update failed')]) : '',
                E('div', { style: 'opacity: .7' }, [intervalText(meta, section_id)])
            ]);
        };

        o = s.option(form.Button, 'update_subscription');
        o.editable = true;
        o.inputstyle = 'positive';
        o.inputtitle = _('Update');
        o.modalonly = false;
        o.onclick = function (ev, section_id) {
            return nikki.updateSubscription(section_id).then(function (result) {
                if (!result.success) {
                    ui.addNotification(null, E('p', _('Subscription update failed, see the Log page.')), 'error');
                    return;
                }
                // the name, the info and the logo come from the provider
                location.reload();
            });
        };

        o = s.option(form.Value, 'info_url', _('Subscription Info Url'));
        o.modalonly = true;

        o = s.option(form.Value, 'url', _('Subscription Url'));
        o.modalonly = true;
        o.rmempty = false;

        o = s.option(form.Value, 'user_agent', _('User Agent'), _('{version} is replaced with the installed app version.'));
        o.default = 'Mihomo/Exodus v{version}';
        o.modalonly = true;
        o.rmempty = false;
        o.value('Mihomo/Exodus v{version}');
        o.value('clash');
        o.value('clash.meta');
        o.value('mihomo');

        o = s.option(form.Flag, 'send_hwid', _('Send HWID'), _('Send x-hwid, x-device-os, x-ver-os and x-device-model headers, required by panels with HWID device limit.'));
        o.default = '1';
        o.modalonly = true;
        o.rmempty = false;

        o = s.option(form.Value, 'update_interval', _('Update Interval'), _('In hours. Empty: the interval of the provider (profile-update-interval), otherwise every hour. 0: only by the Update button. A changed subscription in use is applied by reloading the service.'));
        o.datatype = 'uinteger';
        o.modalonly = true;
        o.renderWidget = function (section_id) {
            const interval = meta[section_id]?.interval;
            this.placeholder = interval ? _('Automatically: every %d h, as the provider says').format(interval) : _('Automatically: as the provider says, otherwise every hour');
            return form.Value.prototype.renderWidget.apply(this, arguments);
        };

        return m.render();
    }
});
