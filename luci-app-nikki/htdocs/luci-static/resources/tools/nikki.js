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

const callNikkiVersion = rpc.declare({
    object: 'luci.nikki',
    method: 'version',
    expect: { '': {} }
});

const callNikkiProfile = rpc.declare({
    object: 'luci.nikki',
    method: 'profile',
    expect: { '': {} }
});

const callNikkiUpdateSubscription = rpc.declare({
    object: 'luci.nikki',
    method: 'update_subscription',
    params: ['section_id'],
    expect: { '': {} }
});

const callNikkiDebug = rpc.declare({
    object: 'luci.nikki',
    method: 'debug',
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
const nftDir = `${homeDir}/nftables`;
const reservedIPNFT = `${nftDir}/reserved_ip.nft`;
const reservedIP6NFT = `${nftDir}/reserved_ip6.nft`;

return baseclass.extend({
    homeDir: homeDir,
    profilesDir: profilesDir,
    subscriptionsDir: subscriptionsDir,
    ruleProvidersDir: ruleProvidersDir,
    proxyProvidersDir: proxyProvidersDir,
    mixinFilePath: mixinFilePath,
    runDir: runDir,
    appLogPath: appLogPath,
    coreLogPath: coreLogPath,
    runProfilePath: runProfilePath,
    reservedIPNFT: reservedIPNFT,
    reservedIP6NFT: reservedIP6NFT,

    status: async function () {
        return (await callRCList('nikki'))?.nikki?.running;
    },

    reload: function () {
        return callRCInit('nikki', 'reload');
    },

    restart: function () {
        return callRCInit('nikki', 'restart');
    },

    version: function () {
        return callNikkiVersion();
    },

    profile: function () {
        return callNikkiProfile();
    },

    updateSubscription: function (section_id) {
        return callNikkiUpdateSubscription(section_id);
    },

    api: async function (method, path, query, body) {
        const apiListen = uci.get('nikki', 'mixin', 'api_listen');
        const apiSecret = uci.get('nikki', 'mixin', 'api_secret') ?? '';
        const apiPort = apiListen.substring(apiListen.lastIndexOf(':') + 1);
        const url = `http://${window.location.hostname}:${apiPort}${path}`;
        return request.request(url, {
            method: method,
            headers: { 'Authorization': `Bearer ${apiSecret}` },
            query: query,
            content: body
        })
    },

    openDashboard: async function () {
        const uiName = uci.get('nikki', 'mixin', 'ui_name');
        const apiListen = uci.get('nikki', 'mixin', 'api_listen');
        const apiSecret = encodeURIComponent(uci.get('nikki', 'mixin', 'api_secret') ?? '');
        const apiPort = apiListen.substring(apiListen.lastIndexOf(':') + 1);
        const params = {
            host: window.location.hostname,
            hostname: window.location.hostname,
            port: apiPort,
            secret: apiSecret
        };
        const query = new URLSearchParams(params).toString();
        let url;
        if (uiName) {
            url = `http://${window.location.hostname}:${apiPort}/ui/${uiName}/?${query}`;
        } else {
            url = `http://${window.location.hostname}:${apiPort}/ui/?${query}`;
        }
        setTimeout(function () { window.open(url, '_blank') }, 0);
    },

    updateDashboard: function () {
        return this.api('POST', '/upgrade/ui');
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
        return fs.write(this.appLogPath);
    },

    clearCoreLog: function () {
        return fs.write(this.coreLogPath);
    },

    debug: function () {
        return callNikkiDebug();
    },

    getUsers: function () {
        return fs.lines('/etc/passwd').then(function (lines) {
            return lines.map(function (line) { return line.split(/:/)[0] }).filter(function (user) { return user !== 'root' && user !== 'nikki' });
        });
    },

    getGroups: function () {
        return fs.lines('/etc/group').then(function (lines) {
            return lines.map(function (line) { return line.split(/:/)[0] }).filter(function (group) { return group !== 'root' && group !== 'nikki' });
        });
    },
})
