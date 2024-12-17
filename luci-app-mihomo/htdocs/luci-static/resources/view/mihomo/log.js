'use strict';
'require form';
'require view';
'require uci';
'require poll';
'require tools.mihomo as mihomo';

return view.extend({
    load: function () {
        return Promise.all([
            uci.load('mihomo'),
            mihomo.getAppLog(),
            mihomo.getCoreLog()
        ]);
    },
    render: function (data) {
        const appLog = data[1];
        const coreLog = data[2];

        let m, s, o;

        m = new form.Map('mihomo');

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
    handleSaveApply: null,
    handleSave: null,
    handleReset: null
});