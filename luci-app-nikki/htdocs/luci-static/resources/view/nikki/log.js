'use strict';
'require form';
'require view';
'require uci';
'require fs';
'require poll';
'require tools.nikki as nikki';

return view.extend({
    load: function () {
        return Promise.all([
            uci.load('nikki'),
            nikki.getAppLog(),
            nikki.getCoreLog()
        ]);
    },
    render: function (data) {
        const appLog = data[1];
        const coreLog = data[2];

        let m, s, o;

        m = new form.Map('nikki');

        s = m.section(form.NamedSection, 'log', 'log', _('Log'));

        s.tab('app_log', _('App Log'));

        o = s.taboption('app_log', form.Button, 'clear_app_log');
        o.inputstyle = 'negative';
        o.inputtitle = _('Clear Log');
        o.onclick = function () {
            m.lookupOption('nikki.log._app_log')[0].getUIElement('log').setValue('');
            return nikki.clearAppLog();
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
            return L.resolveDefault(nikki.getAppLog()).then(function (log) {
                option.getUIElement('log').setValue(log);
            });
        }, o));

        o = s.taboption('app_log', form.Button, 'scroll_app_log_to_bottom');
        o.inputtitle = _('Scroll To Bottom');
        o.onclick = function () {
            const element = m.lookupOption('nikki.log._app_log')[0].getUIElement('log').node.firstChild;
            element.scrollTop = element.scrollHeight;
        };

        s.tab('core_log', _('Core Log'));

        o = s.taboption('core_log', form.Button, 'clear_core_log');
        o.inputstyle = 'negative';
        o.inputtitle = _('Clear Log');
        o.onclick = function () {
            m.lookupOption('nikki.log._core_log')[0].getUIElement('log').setValue('');
            return nikki.clearCoreLog();
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
            return L.resolveDefault(nikki.getCoreLog()).then(function (log) {
                option.getUIElement('log').setValue(log);
            });
        }, o));

        o = s.taboption('core_log', form.Button, 'scroll_core_log_to_bottom');
        o.inputtitle = _('Scroll To Bottom');
        o.onclick = function () {
            const element = m.lookupOption('nikki.log._core_log')[0].getUIElement('log').node.firstChild;
            element.scrollTop = element.scrollHeight;
        };

        s.tab('debug_log', _('Debug Log'));

        o = s.taboption('debug_log', form.Button, '_generate_download_debug_log');
        o.inputstyle = 'negative';
        o.inputtitle = _('Generate & Download');
        o.onclick = function () {
            return nikki.debug().then(function () {
                fs.read_direct('/var/run/nikki/debug.md', 'blob').then(function (data) {
                    // create url
                    const url = window.URL.createObjectURL(data, { type: 'text/markdown' });
                    // create link
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = 'nikki_debug.md';
                    document.body.appendChild(link);
                    // download
                    link.click();
                    // clean up
                    document.body.removeChild(link);
                    window.URL.revokeObjectURL(url);
                });
            });
        };

        return m.render();
    },
    handleSaveApply: null,
    handleSave: null,
    handleReset: null
});