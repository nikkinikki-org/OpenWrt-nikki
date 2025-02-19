'use strict';
'require baseclass';
'require uci';
'require fs';
'require rpc';

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

    callServiceList: rpc.declare({
        object: 'service',
        method: 'list',
        params: ['name'],
        expect: { '': {} }
    }),

    getAppLog: function () {
        return L.resolveDefault(fs.read_direct(this.appLogPath));
    },

    getCoreLog: function () {
        return L.resolveDefault(fs.read_direct(this.coreLogPath));
    },

    clearAppLog: function () {
        return fs.exec_direct('/usr/libexec/nikki-call', ['clear_log', 'app']);
    },

    clearCoreLog: function () {
        return fs.exec_direct('/usr/libexec/nikki-call', ['clear_log', 'core']);
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

    updateSubscription: function (section_id) {
        return fs.exec_direct('/usr/libexec/nikki-call', ['subscription', 'update', section_id]);
    },

    status: async function () {
        try {
            return (await this.callServiceList('nikki'))['nikki']['instances']['nikki']['running'];
        } catch (ignored) {
            return false;
        }
    },

    reload: function () {
        return fs.exec_direct('/usr/libexec/nikki-call', ['service', 'reload']);
    },

    restart: function () {
        return fs.exec_direct('/usr/libexec/nikki-call', ['service', 'restart']);
    },

    appVersion: function () {
        return L.resolveDefault(fs.exec_direct('/usr/libexec/nikki-call', ['version', 'app']), _('Unknown'));
    },

    coreVersion: function () {
        return L.resolveDefault(fs.exec_direct('/usr/libexec/nikki-call', ['version', 'core']), _('Unknown'));
    },

    callMihomoAPI: async function (method, path, params, body) {
        const running = await this.status();
        if (running) {
            const apiPort = uci.get('nikki', 'mixin', 'api_port');
            const apiSecret = uci.get('nikki', 'mixin', 'api_secret');
            const query = new URLSearchParams(params).toString();
            const url = `http://${window.location.hostname}:${apiPort}${path}?${query}`;
            await fetch(url, {
                method: method,
                headers: { 'Authorization': `Bearer ${apiSecret}` },
                body: JSON.stringify(body)
            })
        } else {
            alert(_('Service is not running.'));
        }
    },

    openDashboard: async function () {
        const running = await this.status();
        if (running) {
            const uiName = uci.get('nikki', 'mixin', 'ui_name');
            const apiPort = uci.get('nikki', 'mixin', 'api_port');
            const apiSecret = encodeURIComponent(uci.get('nikki', 'mixin', 'api_secret'));
            let url;
            if (uiName) {
                url = `http://${window.location.hostname}:${apiPort}/ui/${uiName}/?host=${window.location.hostname}&hostname=${window.location.hostname}&port=${apiPort}&secret=${apiSecret}`;
            } else {
                url = `http://${window.location.hostname}:${apiPort}/ui/?host=${window.location.hostname}&hostname=${window.location.hostname}&port=${apiPort}&secret=${apiSecret}`;
            }
            setTimeout(function () { window.open(url, '_blank') }, 0);
        } else {
            alert(_('Service is not running.'));
        }
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
