'use strict';
'require baseclass';
'require uci';
'require fs';
'require rpc';
'require request';

const callRCList = rpc.declare({
    object: 'rc',
    method: 'list',
    params: ['name'],
    expect: { '': {} }
});

const callRCInit = rpc.declare({
    object: 'rc',
    method: 'init',
    params: ['name', 'action'],
    expect: { '': {} }
});

const callFileWrite = rpc.declare({
    object: 'file',
    method: 'write',
    params: ['path', 'data', 'append', 'mode']
});

const callNikkiVersion = rpc.declare({
    object: 'luci.nikki',
    method: 'version',
    expect: { '': {} }
});

const callNikkiProfile = rpc.declare({
    object: 'luci.nikki',
    method: 'profile',
    params: ['defaults'],
    expect: { '': {} }
});

const callNikkiUpdateSubscription = rpc.declare({
    object: 'luci.nikki',
    method: 'update_subscription',
    params: ['section_id'],
    expect: { '': {} }
});

const callNikkiSubscriptionMeta = rpc.declare({
    object: 'luci.nikki',
    method: 'subscription_meta',
    expect: { '': {} }
});

const callNikkiAPI = rpc.declare({
    object: 'luci.nikki',
    method: 'api',
    params: ['method', 'path', 'query', 'body'],
    expect: { '': {} }
});

const callNikkiGetIdentifiers = rpc.declare({
    object: 'luci.nikki',
    method: 'get_identifiers',
    expect: { '': {} }
});

const callNikkiHwid = rpc.declare({
    object: 'luci.nikki',
    method: 'hwid',
    expect: { '': {} }
});

const callNikkiDebug = rpc.declare({
    object: 'luci.nikki',
    method: 'debug',
    expect: { '': {} }
});

const callNikkiHardUpdate = rpc.declare({
    object: 'luci.nikki',
    method: 'hard_update',
    expect: { '': {} }
});

const callNikkiCheckUpdate = rpc.declare({
    object: 'luci.nikki',
    method: 'check_update',
    expect: { '': {} }
});

const callNikkiUpdate = rpc.declare({
    object: 'luci.nikki',
    method: 'update',
    params: ['low_space'],
    expect: { '': {} }
});

const homeDir = '/etc/nikki';
const profilesDir = `${homeDir}/profiles`;
const subscriptionsDir = `${homeDir}/subscriptions`;
const mixinFilePath = `${homeDir}/mixin.yaml`;
const runDir = `${homeDir}/run`;
const runProfilePath = `${runDir}/config.yaml`;
const providersDir = `${runDir}/providers`;
const ruleProvidersDir = `${providersDir}/rule`;
const proxyProvidersDir = `${providersDir}/proxy`;
const logDir = `/var/log/nikki`;
const appLogPath = `${logDir}/app.log`;
const coreLogPath = `${logDir}/core.log`;
const debugLogPath = `${logDir}/debug.log`;
const updateLogPath = `${logDir}/update.log`;
const nftDir = `${homeDir}/nftables`;

return baseclass.extend({
    homeDir: homeDir,
    profilesDir: profilesDir,
    subscriptionsDir: subscriptionsDir,
    mixinFilePath: mixinFilePath,
    runDir: runDir,
    runProfilePath: runProfilePath,
    ruleProvidersDir: ruleProvidersDir,
    proxyProvidersDir: proxyProvidersDir,
    appLogPath: appLogPath,
    coreLogPath: coreLogPath,
    debugLogPath: debugLogPath,
    updateLogPath: updateLogPath,

    status: async function () {
        return (await callRCList('nikki'))?.nikki?.running;
    },

    reload: function () {
        return callRCInit('nikki', 'reload');
    },

    restart: function () {
        return callRCInit('nikki', 'restart');
    },

    writefile: function (path, data, mode) {
        data = (data != null) ? String(data) : '';
        mode = (mode != null) ? mode : 0o644;

        const encoder = new TextEncoder();
        const decoder = new TextDecoder();
        const chunkSize = 8 * 1024;

        const bytes = encoder.encode(data);

        if (bytes.length <= chunkSize) {
            return callFileWrite(path, data, false, mode);
        }

        let promise = Promise.resolve();
        for(let offset = 0; offset < bytes.length; offset += chunkSize) {
            const chunkStart = offset;
            const chunkEnd = Math.min(offset + chunkSize, bytes.length);
            const isLastChunk = chunkEnd === bytes.length;
            const chunkBytes = bytes.slice(chunkStart, chunkEnd);
            const chunk = decoder.decode(chunkBytes, { stream: !isLastChunk });
            const append = offset > 0;
            promise = promise.then(() => callFileWrite(path, chunk, append, mode));
        }

        return promise;
    },

    version: function () {
        return callNikkiVersion();
    },

    profile: function (defaults) {
        return callNikkiProfile(defaults);
    },

    updateSubscription: function (section_id) {
        return callNikkiUpdateSubscription(section_id);
    },

    // what the providers told in the headers: title, announce, support_url, logo and interval, by subscription section id
    subscriptionMeta: function () {
        return L.resolveDefault(callNikkiSubscriptionMeta(), {});
    },

    // logo of a provider, it disappears when it does not load
    providerLogo: function (src, size) {
        if (!src) {
            return '';
        }
        const img = E('img', { src: src, alt: '', referrerpolicy: 'no-referrer', loading: 'lazy', style: `width: ${size}px; height: ${size}px; object-fit: contain; border-radius: 4px; vertical-align: middle; margin-right: .5em;` });
        img.addEventListener('error', () => img.remove());
        return img;
    },

    updateDashboard: function () {
        return callNikkiAPI('POST', '/upgrade/ui');
    },

    openDashboard: async function () {
        const profile = await callNikkiProfile({
            'external-ui-name': null,
            'external-controller': null,
            'external-controller-tls': null,
            'secret': null
        });
        const uiName = profile['external-ui-name'];
        const apiListen = profile['external-controller'];
        const apiTLSListen = profile['external-controller-tls'];
        const apiSecret = profile['secret'] ?? '';
        if (!apiListen && !apiTLSListen) {
            return Promise.reject('API has not been configured');
        }

        let protocol;
        let port;
        if (apiTLSListen) {
            protocol = 'https';
            port = apiTLSListen.substring(apiTLSListen.lastIndexOf(':') + 1);
        } else {
            protocol = 'http';
            port = apiListen.substring(apiListen.lastIndexOf(':') + 1);
        }

        const params = {
            host: window.location.hostname,
            hostname: window.location.hostname,
            port: port,
            secret: apiSecret
        };
        const query = new URLSearchParams(params).toString();
        let url;
        if (uiName) {
            url = `${protocol}://${window.location.hostname}:${port}/ui/${uiName}/?${query}`;
        } else {
            url = `${protocol}://${window.location.hostname}:${port}/ui/?${query}`;
        }

        setTimeout(function () { window.open(url, '_blank') }, 0);

        return Promise.resolve();
    },

    getIdentifiers: function () {
        return callNikkiGetIdentifiers();
    },

    listProfiles: function () {
        return L.resolveDefault(fs.list(this.profilesDir), []);
    },

    listRuleProviders: function () {
        return L.resolveDefault(fs.list(this.ruleProvidersDir), []);
    },

    listProxyProviders: function () {
        return L.resolveDefault(fs.list(this.proxyProvidersDir), []);
    },

    getAppLog: function () {
        return L.resolveDefault(fs.read_direct(this.appLogPath));
    },

    getCoreLog: function () {
        return L.resolveDefault(fs.read_direct(this.coreLogPath));
    },

    clearAppLog: function () {
        return this.writefile(this.appLogPath, '');
    },

    clearCoreLog: function () {
        return this.writefile(this.coreLogPath, '');
    },

    debug: function () {
        return callNikkiDebug();
    },

    hwid: function () {
        return callNikkiHwid();
    },

    hardUpdate: function () {
        return callNikkiHardUpdate();
    },

    checkUpdate: function () {
        return callNikkiCheckUpdate();
    },

    update: function (lowSpace) {
        return callNikkiUpdate(lowSpace);
    },

    getUpdateLog: function () {
        return L.resolveDefault(fs.read_direct(this.updateLogPath), '');
    },

    // device selection on the main page is stored as lan_access_control sections:
    // exclude mode: one rule per device with proxy off, then a catch-all rule with proxy on
    // include mode: one rule per device with proxy on, then a catch-all rule with proxy off
    readLanAccessControl: function () {
        const mode = uci.get('nikki', 'proxy', 'access_mode') ?? 'exclude';
        const flag = mode === 'include' ? '1' : '0';
        const sections = uci.sections('nikki', 'lan_access_control');
        const devices = [];
        let catchAll = false;
        let custom = false;

        sections.forEach(function (section, index) {
            const identifiers = [...L.toArray(section.mac), ...L.toArray(section.ip), ...L.toArray(section.ip6)];
            const enabled = section.enabled === '1';
            const proxy = section.proxy === '1' ? '1' : '0';
            const dns = section.dns === '1' ? '1' : '0';
            if (identifiers.length > 0) {
                if (enabled && proxy === flag && dns === flag) {
                    devices.push(...identifiers);
                } else {
                    custom = true;
                }
            } else if (index === sections.length - 1 && enabled && proxy !== flag && dns !== flag) {
                catchAll = true;
            } else {
                custom = true;
            }
        });

        if (mode === 'exclude' && !catchAll) {
            custom = true;
        }

        return { mode: mode, devices: [...new Set(devices)], custom: custom };
    },

    writeLanAccessControl: function (mode, devices) {
        const flag = mode === 'include' ? '1' : '0';

        for (const section of uci.sections('nikki', 'lan_access_control')) {
            uci.remove('nikki', section['.name']);
        }

        for (const device of devices) {
            const section_id = uci.add('nikki', 'lan_access_control');
            let type;
            if (/^([0-9a-f]{2}:){5}[0-9a-f]{2}$/i.test(device)) {
                type = 'mac';
            } else if (device.includes(':')) {
                type = 'ip6';
            } else {
                type = 'ip';
            }
            uci.set('nikki', section_id, 'enabled', '1');
            uci.set('nikki', section_id, type, [device]);
            uci.set('nikki', section_id, 'dns', flag);
            uci.set('nikki', section_id, 'proxy', flag);
        }

        const section_id = uci.add('nikki', 'lan_access_control');
        uci.set('nikki', section_id, 'enabled', '1');
        uci.set('nikki', section_id, 'dns', flag === '1' ? '0' : '1');
        uci.set('nikki', section_id, 'proxy', flag === '1' ? '0' : '1');
    },
})
