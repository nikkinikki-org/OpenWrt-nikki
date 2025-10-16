'use strict';
'require form';
'require view';
'require fs';
'require uci';

return view.extend({
    tinyFmConfigs: [
        { 
            path: '/www/tinyfilemanager', 
            url: '/tinyfilemanager/tinyfilemanager.php?p=etc%2Fnikki'
        },
        { 
            path: '/www/tinyfilemanager', 
            url: '/tinyfilemanager/index.php?p=etc%2Fnikki'
        },
        { 
            path: '/www/tinyfm', 
            url: '/tinyfm/tinyfm.php?p=etc%2Fnikki'
        },
        { 
            path: '/www/tinyfm', 
            url: '/tinyfm/index.php?p=etc%2Fnikki'
        }
    ],

    findValidFileManager: async function() {
        for (const config of this.tinyFmConfigs) {
            try {
                const stat = await fs.stat(config.path);
                if (stat.type !== 'directory') continue;
                
                const isAvailable = await this.testUrl(config.url);
                if (isAvailable) return config.url;
            } catch (e) {
                continue;
            }
        }
        return null;
    },

    testUrl: function(url) {
        return new Promise((resolve) => {
            const testUrl = url + '&_=' + Date.now();
            
            fetch(testUrl, {
                method: 'HEAD',
                cache: 'no-store',
                credentials: 'same-origin'
            })
            .then(response => resolve(response.ok))
            .catch(() => resolve(false));
        });
    },

    load: function() {
        return this.findValidFileManager();
    },

    render: function(iframePath) {
        return iframePath ? this.renderIframe(iframePath) : this.renderErrorMessage();
    },

    renderIframe: function(iframePath) {
        const host = window.location.hostname;
        const iframeUrl = `http://${host}${iframePath}`;

        return E('div', { class: 'cbi-section' }, [
            E('iframe', {
                src: iframeUrl,
                style: 'width: 100%; height: 80vh; border: none;',
                onerror: `
                    this.style.display = 'none';
                    this.parentNode.appendChild(
                        E('div', {
                            style: 'color: red; padding: 20px;'
                        }, 'Failed to load TinyFileManager. Please check installation or permissions.')
                    );
                `,
                onload: `
                    try {
                        const doc = this.contentDocument || this.contentWindow.document;
                        if (!doc || doc.body.innerHTML.trim() === '') {
                            throw new Error('Empty content');
                        }
                    } catch (error) {
                        this.style.display = 'none';
                        this.parentNode.appendChild(
                            E('div', {
                                style: 'color: red; padding: 20px;'
                            }, 'Unable to load TinyFileManager content. Possible cross-origin issue or access restrictions.')
                        );
                    }
                `
            }, _('Your browser does not support iframes.'))
        ]);
    },

    renderErrorMessage: function() {
        const m = new form.Map('nikki', _('Advanced Editor | ERROR'),
            `${_('Transparent Proxy with Nikki on OpenWrt.')} <a href="https://github.com/rizkikotet-dev/OpenWrt-nikki-Mod" target="_blank">${_('How To Use')}</a>`
        );
        m.disableResetButtons = true;
        m.disableSaveButtons = true;

        const s = m.section(form.NamedSection, 'error', 'error', _('Error'));
        s.anonymous = true;
        s.render = () => this.createErrorContent();

        return m.render();
    },

    createErrorContent: function() {
        return E('div', { 
            class: 'error-container', 
            style: 'padding: 20px; background: #fff; border: 1px solid #ccc; border-radius: 8px;' 
        }, [
            E('h4', { style: 'color: #d9534f;' }, 
                _('Advanced Editor requires TinyFileManager which is not installed.')
            ),
            E('p', {}, _('Please install TinyFileManager using one of these methods:')),
            E('ul', { style: 'padding-left: 20px;' }, [
                E('li', {}, [
                    E('strong', {}, _('Option 1: ')), 
                    _('Install via Software Menu: '), 
                    E('code', {}, 'luci-app-tinyfilemanager')
                ]),
                E('li', {}, [
                    E('strong', {}, _('Option 2: ')), 
                    _('Manual installation: '),
                    E('a', { 
                        href: 'https://github.com/rizkikotet-dev/OpenWrt-nikki-Mod', 
                        target: '_blank' 
                    }, _('Download TinyFileManager')),
                    _(', then upload via System → Software → Update Lists → Upload Package...')
                ])
            ])
        ]);
    }
});
