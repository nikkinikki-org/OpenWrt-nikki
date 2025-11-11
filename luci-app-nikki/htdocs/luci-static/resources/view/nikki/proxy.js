'use strict';
'require form';
'require view';
'require uci';
'require network';
'require tools.widgets as widgets';
'require tools.nikki as nikki';

return view.extend({
    load: function () {
        return Promise.all([
            uci.load('nikki'),
            network.getHostHints(),
            network.getNetworks(),
            nikki.getIdentifiers(),
        ]);
    },
    render: function (data) {
        const hosts = data[1].hosts;
        const networks = data[2];
        const users = data[3]?.users ?? [];
        const groups = data[3]?.groups ?? [];
        const cgroups = data[3]?.cgroups ?? [];

        let m, s, o, so;

        m = new form.Map('nikki');

        s = m.section(form.NamedSection, 'proxy', 'proxy', _('Proxy Config'));

        s.tab('proxy', _('Proxy Config'));

        o = s.taboption('proxy', form.Flag, 'enabled', _('Enable'));
        o.rmempty = false;

        o = s.taboption('proxy', form.ListValue, 'tcp_mode', _('TCP Mode'));
        o.optional = true;
        o.placeholder = _('Disable');
        o.value('redirect', _('Redirect Mode'));
        o.value('tproxy', _('TPROXY Mode'));
        o.value('tun', _('TUN Mode'));

        o = s.taboption('proxy', form.ListValue, 'udp_mode', _('UDP Mode'));
        o.optional = true;
        o.placeholder = _('Disable');
        o.value('tproxy', _('TPROXY Mode'));
        o.value('tun', _('TUN Mode'));

        o = s.taboption('proxy', form.Flag, 'ipv4_dns_hijack', _('IPv4 DNS Hijack'));
        o.rmempty = false;

        o = s.taboption('proxy', form.Flag, 'ipv6_dns_hijack', _('IPv6 DNS Hijack'));
        o.rmempty = false;

        o = s.taboption('proxy', form.Flag, 'as_dnsmasq_upstream', _('As Dnsmasq Upstream'));
        o.rmempty = false;

        o = s.taboption('proxy', form.Flag, 'ipv4_proxy', _('IPv4 Proxy'));
        o.rmempty = false;

        o = s.taboption('proxy', form.Flag, 'ipv6_proxy', _('IPv6 Proxy'));
        o.rmempty = false;

        o = s.taboption('proxy', form.Flag, 'fake_ip_ping_hijack', _('Fake-IP Ping Hijack'));
        o.rmempty = false;

        s.tab('router', _('Router Proxy'));

        o = s.taboption('router', form.Flag, 'router_proxy', _('Enable'));
        o.rmempty = false;

        o = s.taboption('router', form.SectionValue, '_router_access_control', form.TableSection, 'router_access_control', _('Access Control'));
        o.retain = true;
        o.depends('router_proxy', '1');

        o.subsection.addremove = true;
        o.subsection.anonymous = true;
        o.subsection.sortable = true;

        so = o.subsection.option(form.Flag, 'enabled', _('Enable'));
        so.default = '1';
        so.rmempty = false;

        so = o.subsection.option(form.DynamicList, 'user', _('User'));

        for (const user of users) {
            so.value(user);
        };

        so = o.subsection.option(form.DynamicList, 'group', _('Group'));

        for (const group of groups) {
            so.value(group);
        };

        so = o.subsection.option(form.DynamicList, 'cgroup', _('CGroup'));

        for (const cgroup of cgroups) {
            so.value(cgroup);
        };

        so = o.subsection.option(form.Flag, 'dns', _('DNS'));
        so.rmempty = false;

        so = o.subsection.option(form.Flag, 'proxy', _('Proxy'));
        so.rmempty = false;

        s.tab('lan', _('LAN Proxy'));

        o = s.taboption('lan', form.Flag, 'lan_proxy', _('Enable'));
        o.rmempty = false;

        o = s.taboption('lan', form.DynamicList, 'lan_inbound_interface', _('Inbound Interface'));
        o.retain = true;
        o.rmempty = false;
        o.depends('lan_proxy', '1');

        for (const network of networks) {
            if (network.getName() === 'loopback') {
                continue;
            }
            o.value(network.getName());
        }

        o = s.taboption('lan', form.SectionValue, '_lan_access_control', form.TableSection, 'lan_access_control', _('Access Control'));
        o.retain = true;
        o.depends('lan_proxy', '1');

        o.subsection.addremove = true;
        o.subsection.anonymous = true;
        o.subsection.sortable = true;

        so = o.subsection.option(form.Flag, 'enabled', _('Enable'));
        so.default = '1';
        so.rmempty = false;

        so = o.subsection.option(form.DynamicList, 'ip', 'IP');
        so.datatype = 'ip4addr';

        for (const mac in hosts) {
            const host = hosts[mac];
            for (const ip of host.ipaddrs) {
                const hint = host.name ?? mac;
                so.value(ip, hint ? '%s (%s)'.format(ip, hint) : ip);
            };
        };

        so = o.subsection.option(form.DynamicList, 'ip6', 'IP6');
        so.datatype = 'ip6addr';

        for (const mac in hosts) {
            const host = hosts[mac];
            for (const ip of host.ip6addrs) {
                const hint = host.name ?? mac;
                so.value(ip, hint ? '%s (%s)'.format(ip, hint) : ip);
            };
        };

        so = o.subsection.option(form.DynamicList, 'mac', 'MAC');
        so.datatype = 'macaddr';

        for (const mac in hosts) {
            const host = hosts[mac];
            const hint = host.name ?? host.ipaddrs[0];
            so.value(mac, hint ? '%s (%s)'.format(mac, hint) : mac);
        };

        so = o.subsection.option(form.Flag, 'dns', _('DNS'));
        so.rmempty = false;

        so = o.subsection.option(form.Flag, 'proxy', _('Proxy'));
        so.rmempty = false;

        s.tab('bypass', _('Bypass'));

        o = s.taboption('bypass', form.Flag, 'bypass_china_mainland_ip', _('Bypass China Mainland IP'));
        o.rmempty = false;

        o = s.taboption('bypass', form.Flag, 'bypass_china_mainland_ip6', _('Bypass China Mainland IP6'));
        o.rmempty = false;

        o = s.taboption('bypass', form.Value, 'proxy_tcp_dport', _('Destination TCP Port to Proxy'));
        o.rmempty = false;
        o.value('0-65535', _('All Port'));
        o.value('21 22 80 110 143 194 443 465 853 993 995 8080 8443', _('Commonly Used Port'));

        o = s.taboption('bypass', form.Value, 'proxy_udp_dport', _('Destination UDP Port to Proxy'));
        o.rmempty = false;
        o.value('0-65535', _('All Port'));
        o.value('123 443 8443', _('Commonly Used Port'));

        o = s.taboption('bypass', form.DynamicList, 'bypass_dscp', _('Bypass DSCP'));
        o.datatype = 'range(0, 63)';

        return m.render();
    }
});
