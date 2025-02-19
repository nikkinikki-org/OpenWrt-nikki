'use strict';
'require form';
'require view';
'require uci';
'require fs';
'require tools.nikki as nikki'

return view.extend({
    load: function () {
        return Promise.all([
            uci.load('nikki'),
            nikki.listProfiles(),
            nikki.listRuleProviders(),
            nikki.listProxyProviders(),
        ]);
    },
    render: function (data) {
        const subscriptions = uci.sections('nikki', 'subscription');
        const profiles = data[1];
        const ruleProviders = data[2];
        const proxyProviders = data[3];

        let m, s, o;

        m = new form.Map('nikki');

        s = m.section(form.NamedSection, 'editor', 'editor', _('Editor'));

        o = s.option(form.ListValue, '_file', _('Choose File'));
        o.optional = true;

        for (const profile of profiles) {
            o.value(nikki.profilesDir + '/' + profile.name, _('File:') + profile.name);
        };

        for (const subscription of subscriptions) {
            o.value(nikki.subscriptionsDir + '/' + subscription['.name'] + '.yaml', _('Subscription:') + subscription.name);
        };

        for (const ruleProvider of ruleProviders) {
            o.value(nikki.ruleProvidersDir + '/' + ruleProvider.name, _('Rule Provider:') + ruleProvider.name);
        };

        for (const proxyProvider of proxyProviders) {
            o.value(nikki.proxyProvidersDir + '/' + proxyProvider.name, _('Proxy Provider:') + proxyProvider.name);
        };

        o.value(nikki.mixinFilePath, _('File for Mixin'));
        o.value(nikki.runProfilePath, _('Profile for Startup'));
        o.value(nikki.reservedIPNFT, _('File for Reserved IP'));
        o.value(nikki.reservedIP6NFT, _('File for Reserved IP6'));

        o.write = function (section_id, formvalue) {
            return true;
        };
        o.onchange = function (event, section_id, value) {
            return L.resolveDefault(fs.read_direct(value), '').then(function (content) {
                m.lookupOption('nikki.editor._file_content')[0].getUIElement('editor').setValue(content);
            });
        };

        o = s.option(form.TextValue, '_file_content',);
        o.rows = 25;
        o.wrap = false;
        o.write = function (section_id, formvalue) {
            const path = m.lookupOption('nikki.editor._file')[0].formvalue('editor');
            return fs.write(path, formvalue);
        };
        o.remove = function (section_id) {
            const path = m.lookupOption('nikki.editor._file')[0].formvalue('editor');
            return fs.write(path);
        };

        return m.render();
    },
    handleSaveApply: function (ev, mode) {
        return this.handleSave(ev).finally(function () {
            return mode === '0' ? nikki.reload() : nikki.restart();
        });
    },
    handleReset: null
});
