'use strict';
'require form';
'require view';
'require uci';
'require tools.nikki as nikki';

return view.extend({
    load: function () {
        return Promise.all([
            uci.load('nikki')
        ]);
    },
    render: function (data) {
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

        s = m.section(form.GridSection, 'subscription', _('Subscription'));
        s.addremove = true;
        s.anonymous = true;
        s.sortable = true;
        s.modaltitle = _('Edit Subscription');

        o = s.option(form.Value, 'name', _('Subscription Name'));
        o.rmempty = false;

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

        o = s.option(form.Button, 'update_subscription');
        o.editable = true;
        o.inputstyle = 'positive';
        o.inputtitle = _('Update');
        o.modalonly = false;
        o.onclick = function (_, section_id) {
            return nikki.updateSubscription(section_id);
        };

        o = s.option(form.Value, 'info_url', _('Subscription Info Url'));
        o.modalonly = true;

        o = s.option(form.Value, 'url', _('Subscription Url'));
        o.modalonly = true;
        o.rmempty = false;

        o = s.option(form.Value, 'user_agent', _('User Agent'));
        o.default = 'clash';
        o.modalonly = true;
        o.rmempty = false;
        o.value('clash');
        o.value('clash.meta');
        o.value('mihomo');

        o = s.option(form.DynamicList, 'header', _('HWID Headers'));
        o.modalonly = true;
        o.placeholder = 'x-hwid: 7Kq2mVt9XbLp4Ndc';
        o.validate = function (section_id, value) {
            if (!value) {
                return true;
            }
            if (!/^[A-Za-z0-9-]+:[\x20-\x7E]*$/.test(value)) {
                return _('Expected format: Name: value (printable ASCII only)');
            }
            const name = value.split(':')[0].toLowerCase();
            const reserved = [
                'connection', 'content-length', 'expect', 'host',
                'proxy-authorization', 'proxy-connection', 'te', 'trailer',
                'transfer-encoding', 'upgrade', 'user-agent'
            ];
            if (reserved.includes(name)) {
                return _('This header is reserved and cannot be overridden');
            }
            const values = this.formvalue(section_id) ?? [];
            let count = 0;
            for (const item of values) {
                if (item && item.split(':')[0].toLowerCase() === name) {
                    count++;
                }
            }
            if (count > 1) {
                return _('Duplicate header name');
            }
            return true;
        };

        o = s.option(form.ListValue, 'prefer', _('Prefer'));
        o.default = 'remote';
        o.modalonly = true;
        o.rmempty = false;
        o.value('remote', _('Remote'));
        o.value('local', _('Local'));

        return m.render();
    }
});
