'use strict';
'require form';
'require view';
'require uci';
'require fs';
'require tools.mihomo as mihomo'

return view.extend({
    load: function () {
        return Promise.all([
            uci.load('mihomo'),
            mihomo.listProfiles()
        ]);
    },
    render: function (data) {
        const subscriptions = uci.sections('mihomo', 'subscription');
        const profiles = data[1];

        let m, s, o;

        m = new form.Map('mihomo');

        s = m.section(form.NamedSection, 'editor', 'editor', _('Editor'));

        o = s.option(form.ListValue, '_file', _('Choose File'));
        o.optional = true;

        for (const profile of profiles) {
            o.value(mihomo.profilesDir + '/' + profile.name, _('File:') + profile.name);
        };

        for (const subscription of subscriptions) {
            o.value(mihomo.subscriptionsDir + '/' + subscription['.name'] + '.yaml', _('Subscription:') + subscription.name);
        };

        o.value(mihomo.mixinFilePath, _('File for Mixin'));
        o.value(mihomo.runProfilePath, _('Profile for Startup'));
        o.value(mihomo.reservedIPNFT, _('File for Reserved IP'));
        o.value(mihomo.reservedIP6NFT, _('File for Reserved IP6'));

        o.write = function (section_id, formvalue) {
            return true;
        };
        o.onchange = function (event, section_id, value) {
            return L.resolveDefault(fs.read_direct(value), '').then(function (content) {
                m.lookupOption('mihomo.editor._file_content')[0].getUIElement('editor').setValue(content);
            });
        };

        o = s.option(form.TextValue, '_file_content',);
        o.rows = 25;
        o.wrap = false;
        o.write = function (section_id, formvalue) {
            const path = m.lookupOption('mihomo.editor._file')[0].formvalue('editor');
            return fs.write(path, formvalue);
        };
        o.remove = function (section_id) {
            const path = m.lookupOption('mihomo.editor._file')[0].formvalue('editor');
            return fs.write(path);
        };

        return m.render();
    },
    handleSaveApply: function (ev, mode) {
        return this.handleSave(ev).finally(function () {
            return mode === '0' ? mihomo.reload() : mihomo.restart();
        });
    },
    handleReset: null
});
