'use strict';
'require form';
'require view';
'require uci';
'require fs';
'require poll';
'require tools.widgets as widgets';
'require tools.mihomo as mihomo';

return view.extend({
    load: function () {
        return Promise.all([
            uci.load('mihomo')
        ]);
    },
    render: function (data) {
        let m, s, o, so;

        m = new form.Map('mihomo');

        s = m.section(form.NamedSection, 'config', 'config', _('Mixin Config'));

        o = s.option(form.Flag, 'mixin', _('Enable'));
        o.rmempty = false;

        s = m.section(form.NamedSection, 'mixin', 'mixin', _('Mixin Option'));

        s.tab('general', _('General Config'));

        o = s.taboption('general', form.ListValue, 'log_level', '*' + ' ' + _('Log Level'));
        o.value('silent');
        o.value('error');
        o.value('warning');
        o.value('info');
        o.value('debug');

        o = s.taboption('general', form.ListValue, 'mode', '*' + ' ' + _('Mode'));
        o.value('global', _('Global Mode'));
        o.value('rule', _('Rule Mode'));
        o.value('direct', _('Direct Mode'));

        o = s.taboption('general', form.ListValue, 'match_process', '*' + ' ' + _('Match Process'));
        o.value('strict', _('Auto'));
        o.value('always', _('Enable'));
        o.value('off', _('Disable'));

        o = s.taboption('general', widgets.NetworkSelect, 'outbound_interface', '*' + ' ' + _('Outbound Interface'));
        o.optional = true;

        o = s.taboption('general', form.Flag, 'ipv6', '*' + ' ' + _('IPv6'));
        o.rmempty = false;

        o = s.taboption('general', form.Flag, 'unify_delay', _('Unify Delay'));
        o.rmempty = false;

        o = s.taboption('general', form.Flag, 'tcp_concurrent', _('TCP Concurrent'));
        o.rmempty = false;

        o = s.taboption('general', form.Value, 'tcp_keep_alive_idle', _('TCP Keep Alive Idle'));
        o.datatype = 'uinteger';
        o.placeholder = '600';

        o = s.taboption('general', form.Value, 'tcp_keep_alive_interval', _('TCP Keep Alive Interval'));
        o.datatype = 'uinteger';
        o.placeholder = '15';

        s.tab('external_control', _('External Control Config'));

        o = s.taboption('external_control', form.Value, 'ui_name', '*' + ' ' + _('UI Name'));

        o = s.taboption('external_control', form.Value, 'ui_url', '*' + ' ' + _('UI Url'));
        o.rmempty = false;
        o.value('https://github.com/Zephyruso/zashboard/archive/refs/heads/gh-pages.zip', 'Zashboard');
        o.value('https://github.com/MetaCubeX/metacubexd/archive/refs/heads/gh-pages.zip', 'MetaCubeXD');
        o.value('https://github.com/MetaCubeX/Yacd-meta/archive/refs/heads/gh-pages.zip', 'YACD');
        o.value('https://github.com/MetaCubeX/Razord-meta/archive/refs/heads/gh-pages.zip', 'Razord');

        o = s.taboption('external_control', form.Value, 'api_port', '*' + ' ' + _('API Port'));
        o.datatype = 'port';
        o.placeholder = '9090';

        o = s.taboption('external_control', form.Value, 'api_secret', '*' + ' ' + _('API Secret'));
        o.password = true;
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
        so.password = true;
        so.rmempty = false;

        s.tab('tun', _('TUN Config'));

        o = s.taboption('tun', form.Value, 'tun_device', '*' + ' ' + _('Device'));
        o.rmempty = false;

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

        o = s.taboption('dns', form.ListValue, 'fake_ip_filter_mode', _('Fake-IP Filter Mode'));
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

        o = s.taboption('dns', form.SectionValue, '_hosts', form.TableSection, 'hosts', _('Edit Hosts'));
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

        o = s.taboption('dns', form.SectionValue, '_dns_nameservers', form.TableSection, 'nameserver', _('Edit Nameservers'));
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

        s.tab('sniffer', _('Sniffer Config'));

        o = s.taboption('sniffer', form.Flag, 'sniffer', _('Enable'));
        o.rmempty = false;

        o = s.taboption('sniffer', form.Flag, 'sniffer_sniff_dns_mapping', _('Sniff Redir-Host'));
        o.rmempty = false;

        o = s.taboption('sniffer', form.Flag, 'sniffer_sniff_pure_ip', _('Sniff Pure IP'));
        o.rmempty = false;

        o = s.taboption('sniffer', form.Flag, 'sniffer_overwrite_destination', _('Overwrite Destination'));
        o.rmempty = false;

        o = s.taboption('sniffer', form.Flag, 'sniffer_force_domain_name', _('Overwrite Force Sniff Domain Name'));
        o.rmempty = false;

        o = s.taboption('sniffer', form.DynamicList, 'sniffer_force_domain_names', _('Force Sniff Domain Name'));
        o.depends('sniffer_force_domain_name', '1');

        o = s.taboption('sniffer', form.Flag, 'sniffer_ignore_domain_name', _('Overwrite Ignore Sniff Domain Name'));
        o.rmempty = false;

        o = s.taboption('sniffer', form.DynamicList, 'sniffer_ignore_domain_names', _('Ignore Sniff Domain Name'));
        o.depends('sniffer_ignore_domain_name', '1');

        o = s.taboption('sniffer', form.Flag, 'sniffer_sniff', _('Overwrite Sniff By Protocol'));
        o.rmempty = false;

        o = s.taboption('sniffer', form.SectionValue, '_sniffer_sniffs', form.TableSection, 'sniff', _('Sniff By Protocol'));
        o.subsection.anonymous = true;
        o.subsection.addremove = false;
        o.depends('sniffer_sniff', '1');

        so = o.subsection.option(form.Flag, 'enabled', _('Enable'));
        so.rmempty = false;

        so = o.subsection.option(form.ListValue, 'protocol', _('Protocol'));
        so.value('HTTP');
        so.value('TLS');
        so.value('QUIC');
        so.readonly = true;

        so = o.subsection.option(form.DynamicList, 'port', _('Port'));
        so.datatype = 'portrange';

        so = o.subsection.option(form.Flag, 'overwrite_destination', _('Overwrite Destination'));
        so.rmempty = false;

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
        o.rmempty = false;

        return m.render();
    }
});