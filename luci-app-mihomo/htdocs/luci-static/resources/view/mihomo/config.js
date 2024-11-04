'use strict';
'require form';
'require view';
'require uci';
'require fs';
'require network';
'require rpc';
'require poll';
'require tools.widgets as widgets';
'require tools.mihomo as mihomo';

function renderStatus(running) {
    return updateStatus(E('input', { id: 'core_status', style: 'border: unset; font-style: italic; font-weight: bold;', readonly: '' }), running);
}

function updateStatus(element, running) {
    if (element) {
        element.style.color = running ? 'green' : 'red';
        element.value = running ? _('Running') : _('Not Running');
    }
    return element;
}

return view.extend({
    load: function () {
        return Promise.all([
            uci.load('mihomo'),
            mihomo.listProfiles(),
            mihomo.appVersion(),
            mihomo.coreVersion(),
            mihomo.status(),
            network.getHostHints(),
        ]);
    },
    render: function (data) {
        const subscriptions = uci.sections('mihomo', 'subscription');
        const profiles = data[1];
        const appVersion = data[2];
        const coreVersion = data[3];
        const running = data[4];
        const hosts = data[5].hosts;

        let m, s, o, so;

        m = new form.Map('mihomo', _('MihomoTProxy'), `${_('Transparent Proxy with Mihomo on OpenWrt.')} <a href="https://github.com/morytyann/OpenWrt-mihomo/wiki" target="_blank">${_('How To Use')}</a>`);

        s = m.section(form.NamedSection, 'status', 'status', _('Status'));

        o = s.option(form.Value, '_app_version', _('App Version'));
        o.readonly = true;
        o.load = function (section_id) {
            return appVersion.trim();
        };
        o.write = function () { };

        o = s.option(form.Value, '_core_version', _('Core Version'));
        o.readonly = true;
        o.load = function (section_id) {
            return coreVersion.trim();
        };
        o.write = function () { };

        o = s.option(form.DummyValue, '_core_status', _('Core Status'));
        o.cfgvalue = function (section_id) {
            return renderStatus(running);
        };
        poll.add(function () {
            return L.resolveDefault(mihomo.status()).then(function (running) {
                updateStatus(document.getElementById('core_status'), running);
            });
        });

        o = s.option(form.Button, 'reload', '-');
        o.inputstyle = 'action';
        o.inputtitle = _('Reload Service');
        o.onclick = function () {
            return mihomo.reload();
        };

        o = s.option(form.Button, 'restart', '-');
        o.inputstyle = 'negative';
        o.inputtitle = _('Restart Service');
        o.onclick = function () {
            return mihomo.restart();
        };

        o = s.option(form.Button, 'update_dashboard', '-');
        o.inputstyle = 'positive';
        o.inputtitle = _('Update Dashboard');
        o.onclick = function () {
            return mihomo.callMihomoAPI('POST', '/upgrade/ui');
        };

        o = s.option(form.Button, 'open_dashboard', '-');
        o.inputtitle = _('Open Dashboard');
        o.onclick = function () {
            return mihomo.openDashboard();
        };

        s = m.section(form.NamedSection, 'config', 'config', _('Basic Config'));

        o = s.option(form.Flag, 'enabled', _('Enable'));
        o.rmempty = false;

        o = s.option(form.Value, 'start_delay', _('Start Delay'));
        o.datatype = 'uinteger';
        o.placeholder = '0';

        o = s.option(form.Flag, 'scheduled_restart', _('Scheduled Restart'));
        o.rmempty = false;

        o = s.option(form.Value, 'cron_expression', _('Cron Expression'));
        o.retain = true;
        o.rmempty = false;
        o.depends('scheduled_restart', '1');

        o = s.option(form.ListValue, 'profile', _('Choose Profile'));
        o.optional = true;

        for (const profile of profiles) {
            o.value('file:' + profile.name, _('File:') + profile.name);
        }

        for (const subscription of subscriptions) {
            o.value('subscription:' + subscription['.name'], _('Subscription:') + subscription.name);
        }

        o = s.option(form.FileUpload, 'upload_profile', _('Upload Profile'));
        o.root_directory = mihomo.profilesDir;

        o = s.option(form.Flag, 'mixin', _('Mixin'));
        o.rmempty = false;

        o = s.option(form.Flag, 'test_profile', _('Test Profile'));
        o.rmempty = false;

        o = s.option(form.Flag, 'fast_reload', _('Fast Reload'));
        o.rmempty = false;

        s = m.section(form.NamedSection, 'proxy', 'proxy', _('Proxy Config'));

        s.tab('transparent_proxy', _('Transparent Proxy'));

        o = s.taboption('transparent_proxy', form.Flag, 'transparent_proxy', _('Enable'));
        o.rmempty = false;

        o = s.taboption('transparent_proxy', form.ListValue, 'tcp_transparent_proxy_mode', _('TCP Proxy Mode'));
        o.value('redirect', _('Redirect Mode'));
        o.value('tproxy', _('TPROXY Mode'));
        o.value('tun', _('TUN Mode'));

        o = s.taboption('transparent_proxy', form.ListValue, 'udp_transparent_proxy_mode', _('UDP Proxy Mode'));
        o.value('tproxy', _('TPROXY Mode'));
        o.value('tun', _('TUN Mode'));

        o = s.taboption('transparent_proxy', form.Flag, 'ipv4_dns_hijack', _('IPv4 DNS Hijack'));
        o.rmempty = false;

        o = s.taboption('transparent_proxy', form.Flag, 'ipv6_dns_hijack', _('IPv6 DNS Hijack'));
        o.rmempty = false;

        o = s.taboption('transparent_proxy', form.Flag, 'ipv4_proxy', _('IPv4 Proxy'));
        o.rmempty = false;

        o = s.taboption('transparent_proxy', form.Flag, 'ipv6_proxy', _('IPv6 Proxy'));
        o.rmempty = false;

        o = s.taboption('transparent_proxy', form.Flag, 'router_proxy', _('Router Proxy'));
        o.rmempty = false;

        o = s.taboption('transparent_proxy', form.Flag, 'lan_proxy', _('Lan Proxy'));
        o.rmempty = false;

        s.tab('access_control', _('Access Control'));

        o = s.taboption('access_control', form.ListValue, 'access_control_mode', _('Mode'));
        o.value('all', _('All Mode'));
        o.value('allow', _('Allow Mode'));
        o.value('block', _('Block Mode'));

        o = s.taboption('access_control', form.DynamicList, 'acl_ip', 'IP');
        o.datatype = 'ipmask4';
        o.retain = true;
        o.depends('access_control_mode', 'allow');
        o.depends('access_control_mode', 'block');

        for (const mac in hosts) {
            const host = hosts[mac];
            for (const ip of host.ipaddrs) {
                const hint = host.name || mac;
                o.value(ip, hint ? '%s (%s)'.format(ip, hint) : ip);
            }
        }

        o = s.taboption('access_control', form.DynamicList, 'acl_ip6', 'IP6');
        o.datatype = 'ipmask6';
        o.retain = true;
        o.depends('access_control_mode', 'allow');
        o.depends('access_control_mode', 'block');

        for (const mac in hosts) {
            const host = hosts[mac];
            for (const ip of host.ip6addrs) {
                const hint = host.name || mac;
                o.value(ip, hint ? '%s (%s)'.format(ip, hint) : ip);
            }
        }

        o = s.taboption('access_control', form.DynamicList, 'acl_mac', 'MAC');
        o.datatype = 'macaddr';
        o.retain = true;
        o.depends('access_control_mode', 'allow');
        o.depends('access_control_mode', 'block');

        for (const mac in hosts) {
            const host = hosts[mac];
            const hint = host.name || host.ipaddrs[0];
            o.value(mac, hint ? '%s (%s)'.format(mac, hint) : mac);
        }

        s.tab('bypass', _('Bypass'));

        o = s.taboption('bypass', form.Flag, 'bypass_china_mainland_ip', _('Bypass China Mainland IP'));
        o.rmempty = false;

        o = s.taboption('bypass', form.Value, 'acl_tcp_dport', _('Destination TCP Port to Proxy'));
        o.rmempty = false;
        o.value('0-65535', _('All Port'));
        o.value('21 22 80 110 143 194 443 465 853 993 995 8080 8443', _('Commonly Used Port'));

        o = s.taboption('bypass', form.Value, 'acl_udp_dport', _('Destination UDP Port to Proxy'));
        o.rmempty = false;
        o.value('0-65535', _('All Port'));
        o.value('123 443 8443', _('Commonly Used Port'));

        s = m.section(form.TableSection, 'subscription', _('Subscription Config'));
        s.addremove = true;
        s.anonymous = true;
        s.sortable = true;

        o = s.option(form.Value, 'name', _('Subscription Name'));
        o.rmempty = false;
        o.width = '15%';

        o = s.option(form.Value, 'url', _('Subscription Url'));
        o.rmempty = false;

        o = s.option(form.Value, 'user_agent', _('User Agent'));
        o.default = 'clash';
        o.rmempty = false;
        o.width = '15%';
        o.value('mihomo');
        o.value('clash.meta');
        o.value('clash');

        s = m.section(form.NamedSection, 'mixin', 'mixin', _('Mixin Config'));
    
        s.tab('general', _('General Config'));

        o = s.taboption('general', form.ListValue, 'log_level', '*' + ' ' + _('Log Level'));
        o.value('silent');
        o.value('error');
        o.value('warning');
        o.value('info');
        o.value('debug');

        o = s.taboption('general', form.ListValue, 'mode', _('Mode'));
        o.value('global', _('Global Mode'));
        o.value('rule', _('Rule Mode'));
        o.value('direct', _('Direct Mode'));

        o = s.taboption('general', form.ListValue, 'match_process', _('Match Process'));
        o.value('strict', _('Auto'));
        o.value('always', _('Enable'));
        o.value('off', _('Disable'));

        o = s.taboption('general', widgets.NetworkSelect, 'outbound_interface', '*' + ' ' + _('Outbound Interface'));
        o.optional = true;

        o = s.taboption('general', form.Flag, 'ipv6', '*' + ' ' + _('IPv6'));
        o.rmempty = false;

        o = s.taboption('general', form.Value, 'tcp_keep_alive_idle', _('TCP Keep Alive Idle'));
        o.datatype = 'uinteger';
        o.placeholder = '600';

        o = s.taboption('general', form.Value, 'tcp_keep_alive_interval', _('TCP Keep Alive Interval'));
        o.datatype = 'uinteger';
        o.placeholder = '15';

        s.tab('external_control', _('External Control Config'));

        o = s.taboption('external_control', form.Value, 'ui_name', '*' + ' ' + _('UI Name'));
        o.rmempty = false;

        o = s.taboption('external_control', form.Value, 'ui_url', '*' + ' ' + _('UI Url'));
        o.rmempty = false;
        o.value('https://mirror.ghproxy.com/https://github.com/MetaCubeX/metacubexd/archive/refs/heads/gh-pages.zip', 'MetaCubeXD')
        o.value('https://mirror.ghproxy.com/https://github.com/MetaCubeX/Yacd-meta/archive/refs/heads/gh-pages.zip', 'YACD')
        o.value('https://mirror.ghproxy.com/https://github.com/MetaCubeX/Razord-meta/archive/refs/heads/gh-pages.zip', 'Razord')

        o = s.taboption('external_control', form.Value, 'api_port', '*' + ' ' + _('API Port'));
        o.datatype = 'port';
        o.placeholder = '9090';

        o = s.taboption('external_control', form.Value, 'api_secret', '*' + ' ' + _('API Secret'));
        o.rmempty = false;

        o = s.taboption('external_control', form.Flag, 'selection_cache', _('Save Proxy Selection'));
        o.rmempty = false;

        s.tab('inbound', _('Inbound Config'));

        o = s.taboption('inbound', form.Flag, 'allow_lan', '*' + ' ' + _('Allow Lan'));
        o.rmempty = false;

        o = s.taboption('inbound', form.Value, 'http_port', '*' + ' ' + _('HTTP Port'));
        o.datatype = 'port';
        o.placeholder = '8080';

        o = s.taboption('inbound', form.Value, 'socks_port', '*' + ' ' + _('SOCKS Port'));
        o.datatype = 'port';
        o.placeholder = '1080';

        o = s.taboption('inbound', form.Value, 'mixed_port', '*' + ' ' + _('Mixed Port'));
        o.datatype = 'port';
        o.placeholder = '7890';

        o = s.taboption('inbound', form.Value, 'redir_port', '*' + ' ' + _('Redirect Port'));
        o.datatype = 'port';
        o.placeholder = '7891';

        o = s.taboption('inbound', form.Value, 'tproxy_port', '*' + ' ' + _('TPROXY Port'));
        o.datatype = 'port';
        o.placeholder = '7892';

        o = s.taboption('inbound', form.Flag, 'authentication', '*' + ' ' + _('Overwrite Authentication'));
        o.rmempty = false;

        o = s.taboption('inbound', form.SectionValue, '_authentications', form.TableSection, 'authentication', _('Edit Authentications'));
        o.retain = true;
        o.depends('authentication', '1');

        o.subsection.addremove = true;
        o.subsection.anonymous = true;
        o.subsection.sortable = true;

        so = o.subsection.option(form.Flag, 'enabled', _('Enable'));
        so.rmempty = false;

        so = o.subsection.option(form.Value, 'username', _('Username'));
        so.rmempty = false;

        so = o.subsection.option(form.Value, 'password', _('Password'));
        so.rmempty = false;

        s.tab('tun', _('TUN Config'));

        o = s.taboption('tun', form.ListValue, 'tun_stack', '*' + ' ' + _('Stack'));
        o.value('system', 'System');
        o.value('gvisor', 'gVisor');
        o.value('mixed', 'Mixed');

        o = s.taboption('tun', form.Value, 'tun_mtu', '*' + ' ' + _('MTU'));
        o.datatype = 'uinteger';
        o.placeholder = '9000';

        o = s.taboption('tun', form.Flag, 'tun_gso', '*' + ' ' + _('GSO'));
        o.rmempty = false;

        o = s.taboption('tun', form.Value, 'tun_gso_max_size', '*' + ' ' + _('GSO Max Size'));
        o.datatype = 'uinteger';
        o.placeholder = '65536';
        o.retain = true;
        o.depends('tun_gso', '1');

        o = s.taboption('tun', form.Flag, 'tun_endpoint_independent_nat', '*' + ' ' + _('Endpoint Independent NAT'));
        o.rmempty = false;

        s.tab('dns', _('DNS Config'));

        o = s.taboption('dns', form.Value, 'dns_port', '*' + ' ' + _('DNS Port'));
        o.datatype = 'port';
        o.placeholder = '1053';

        o = s.taboption('dns', form.ListValue, 'dns_mode', '*' + ' ' + _('DNS Mode'));
        o.value('normal', 'Normal');
        o.value('fake-ip', 'Fake-IP');
        o.value('redir-host', 'Redir-Host');

        o = s.taboption('dns', form.Value, 'fake_ip_range', '*' + ' ' + _('Fake-IP Range'));
        o.datatype = 'cidr4';
        o.placeholder = '198.18.0.1/16';
        o.retain = true;
        o.depends('dns_mode', 'fake-ip');

        o = s.taboption('dns', form.Flag, 'fake_ip_filter', _('Overwrite Fake-IP Filter'));
        o.retain = true;
        o.rmempty = false;
        o.depends('dns_mode', 'fake-ip');

        o = s.taboption('dns', form.DynamicList, 'fake_ip_filters', _('Edit Fake-IP Filters'));
        o.retain = true;
        o.depends({ 'dns_mode': 'fake-ip', 'fake_ip_filter': '1' });

        o = s.taboption('dns', form.ListValue, 'fake_ip_filter_mode', _('Fake-IP Filter Mode'))
        o.retain = true;
        o.value('blacklist', _('Block Mode'));
        o.value('whitelist', _('Allow Mode'));
        o.depends({ 'dns_mode': 'fake-ip', 'fake_ip_filter': '1' });

        o = s.taboption('dns', form.Flag, 'fake_ip_cache', _('Fake-IP Cache'));
        o.retain = true;
        o.rmempty = false;
        o.depends('dns_mode', 'fake-ip');

        o = s.taboption('dns', form.Flag, 'dns_respect_rules', _('Respect Rules'));
        o.rmempty = false;

        o = s.taboption('dns', form.Flag, 'dns_doh_prefer_http3', _('DoH Prefer HTTP/3'));
        o.rmempty = false;

        o = s.taboption('dns', form.Flag, 'dns_ipv6', _('IPv6'));
        o.rmempty = false;

        o = s.taboption('dns', form.Flag, 'dns_system_hosts', _('Use System Hosts'));
        o.rmempty = false;

        o = s.taboption('dns', form.Flag, 'dns_hosts', _('Use Hosts'));
        o.rmempty = false;

        o = s.taboption('dns', form.Flag, 'hosts', _('Overwrite Hosts'));
        o.rmempty = false;

        o = s.taboption('dns', form.SectionValue, '_hosts', form.TableSection, 'host', _('Edit Hosts'));
        o.retain = true;
        o.depends('hosts', '1');

        o.subsection.addremove = true;
        o.subsection.anonymous = true;
        o.subsection.sortable = true;

        so = o.subsection.option(form.Flag, 'enabled', _('Enable'));
        so.rmempty = false;

        so = o.subsection.option(form.Value, 'domain_name', _('Domain Name'));
        so.rmempty = false;

        so = o.subsection.option(form.DynamicList, 'ip', _('IP'));

        o = s.taboption('dns', form.Flag, 'dns_nameserver', _('Overwrite Nameserver'));
        o.rmempty = false;

        o = s.taboption('dns', form.SectionValue, '_dns_nameserver', form.TableSection, 'nameserver', _('Edit Nameservers'));
        o.retain = true;
        o.depends('dns_nameserver', '1');

        o.subsection.addremove = true;
        o.subsection.anonymous = true;
        o.subsection.sortable = true;

        so = o.subsection.option(form.Flag, 'enabled', _('Enable'));
        so.rmempty = false;

        so = o.subsection.option(form.ListValue, 'type', _('Type'));
        so.value('default-nameserver');
        so.value('proxy-server-nameserver');
        so.value('direct-nameserver');
        so.value('nameserver');
        so.value('fallback');

        so = o.subsection.option(form.DynamicList, 'nameserver', _('Nameserver'));

        o = s.taboption('dns', form.Flag, 'dns_nameserver_policy', _('Overwrite Nameserver Policy'));
        o.rmempty = false;

        o = s.taboption('dns', form.SectionValue, '_dns_nameserver_policies', form.TableSection, 'nameserver_policy', _('Edit Nameserver Policies'));
        o.retain = true;
        o.depends('dns_nameserver_policy', '1');

        o.subsection.addremove = true;
        o.subsection.anonymous = true;
        o.subsection.sortable = true;

        so = o.subsection.option(form.Flag, 'enabled', _('Enable'));
        so.rmempty = false;

        so = o.subsection.option(form.Value, 'matcher', _('Matcher'));
        so.rmempty = false;

        so = o.subsection.option(form.DynamicList, 'nameserver', _('Nameserver'));

        s.tab('geox', _('GeoX Config'));

        o = s.taboption('geox', form.ListValue, 'geoip_format', _('GeoIP Format'));
        o.value('dat', 'DAT');
        o.value('mmdb', 'MMDB');

        o = s.taboption('geox', form.ListValue, 'geodata_loader', _('GeoData Loader'));
        o.value('standard', _('Standard Loader'));
        o.value('memconservative', _('Memory Conservative Loader'));

        o = s.taboption('geox', form.Value, 'geosite_url', _('GeoSite Url'));
        o.rmempty = false;

        o = s.taboption('geox', form.Value, 'geoip_mmdb_url', _('GeoIP(MMDB) Url'));
        o.rmempty = false;

        o = s.taboption('geox', form.Value, 'geoip_dat_url', _('GeoIP(DAT) Url'));
        o.rmempty = false;

        o = s.taboption('geox', form.Value, 'geoip_asn_url', _('GeoIP(ASN) Url'));
        o.rmempty = false;

        o = s.taboption('geox', form.Flag, 'geox_auto_update', _('GeoX Auto Update'));
        o.rmempty = false;

        o = s.taboption('geox', form.Value, 'geox_update_interval', _('GeoX Update Interval'));
        o.datatype = 'uinteger';
        o.placeholder = '24';
        o.retain = true;
        o.depends('geox_auto_update', '1');

        s.tab('mixin_file_content', _('Mixin File Content'));

        o = s.taboption('mixin_file_content', form.Flag, 'mixin_file_content', '*' + ' ' + _('Enable'), _('Please go to the editor tab to edit the file for mixin'));

        return m.render();
    }
});
