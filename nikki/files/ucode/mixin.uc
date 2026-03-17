#!/usr/bin/ucode

'use strict';

import { cursor } from 'uci';
import { connect } from 'ubus';
import { uci_bool, uci_int, uci_array, trim_all } from '/etc/nikki/ucode/include.uc';

const uci = cursor();
const ubus = connect();

const config = {};

const outbound_interface = uci.get('nikki', 'mixin', 'outbound_interface');
const outbound_interface_status = ubus.call('network.interface', 'status', { 'interface': outbound_interface });
const outbound_device = outbound_interface_status?.l3_device ?? outbound_interface_status?.device ?? '';

config['log-level'] = uci.get('nikki', 'mixin', 'log_level');
config['mode'] = uci.get('nikki', 'mixin', 'mode');
config['find-process-mode'] = uci.get('nikki', 'mixin', 'match_process');
config['interface-name'] = outbound_device;
config['ipv6'] = uci_bool(uci.get('nikki', 'mixin', 'ipv6'));
config['unified-delay'] = uci_bool(uci.get('nikki', 'mixin', 'unify_delay'));
config['tcp-concurrent'] = uci_bool(uci.get('nikki', 'mixin', 'tcp_concurrent'));
config['disable-keep-alive'] = uci_bool(uci.get('nikki', 'mixin', 'disable_tcp_keep_alive'));
config['keep-alive-idle'] = uci_int(uci.get('nikki', 'mixin', 'tcp_keep_alive_idle'));
config['keep-alive-interval'] = uci_int(uci.get('nikki', 'mixin', 'tcp_keep_alive_interval'));

config['external-ui'] = uci.get('nikki', 'mixin', 'ui_path');
config['external-ui-name'] = uci.get('nikki', 'mixin', 'ui_name');
config['external-ui-url'] = uci.get('nikki', 'mixin', 'ui_url');
config['external-controller'] = uci.get('nikki', 'mixin', 'api_listen');
config['external-controller-tls'] = uci.get('nikki', 'mixin', 'api_tls_listen');
config['tls'] = {};
config['tls']['certificate'] = uci.get('nikki', 'mixin', 'api_tls_cert');
config['tls']['private-key'] = uci.get('nikki', 'mixin', 'api_tls_key');
config['tls']['ech-key'] = uci.get('nikki', 'mixin', 'api_tls_ech_key');
config['secret'] = uci.get('nikki', 'mixin', 'api_secret');

config['allow-lan'] = uci_bool(uci.get('nikki', 'mixin', 'allow_lan'));
config['port'] = uci_int(uci.get('nikki', 'mixin', 'http_port'));
config['socks-port'] = uci_int(uci.get('nikki', 'mixin', 'socks_port'));
config['mixed-port'] = uci_int(uci.get('nikki', 'mixin', 'mixed_port'));
config['redir-port'] = uci_int(uci.get('nikki', 'mixin', 'redir_port'));
config['tproxy-port'] = uci_int(uci.get('nikki', 'mixin', 'tproxy_port'));

if (uci_bool(uci.get('nikki', 'mixin', 'authentication'))) {
	config['authentication'] = [];
	uci.foreach('nikki', 'authentication', (section) => {
		if (!uci_bool(section.enabled)) {
			return;
		}
		push(config['authentication'], `${section.username}:${section.password}`);
	});
}

config['tun'] = {};
config['tun']['enable'] = uci_bool(uci.get('nikki', 'mixin', 'tun_enabled'));
config['tun']['device'] = uci.get('nikki', 'mixin', 'tun_device');
config['tun']['stack'] = uci.get('nikki', 'mixin', 'tun_stack');
config['tun']['mtu'] = uci_int(uci.get('nikki', 'mixin', 'tun_mtu'));
config['tun']['gso'] = uci_bool(uci.get('nikki', 'mixin', 'tun_gso'));
config['tun']['gso-max-size'] = uci_int(uci.get('nikki', 'mixin', 'tun_gso_max_size'));
if (uci_bool(uci.get('nikki', 'mixin', 'tun_dns_hijack'))) {
	config['tun']['dns-hijack'] = uci_array(uci.get('nikki', 'mixin', 'tun_dns_hijacks'));
}

config['dns'] = {};
config['dns']['enable'] = uci_bool(uci.get('nikki', 'mixin', 'dns_enabled'));
config['dns']['cache-algorithm'] = uci.get('nikki', 'mixin', 'dns_cache_algorithm');
config['dns']['listen'] = uci.get('nikki', 'mixin', 'dns_listen');
config['dns']['ipv6'] = uci_bool(uci.get('nikki', 'mixin', 'dns_ipv6'));
config['dns']['enhanced-mode'] = uci.get('nikki', 'mixin', 'dns_mode');
config['dns']['fake-ip-range'] = uci.get('nikki', 'mixin', 'fake_ip_range');
config['dns']['fake-ip-range6'] = uci.get('nikki', 'mixin', 'fake_ip6_range');
config['dns']['fake-ip-ttl'] = uci_int(uci.get('nikki', 'mixin', 'fake_ip_ttl'));
if (uci_bool(uci.get('nikki', 'mixin', 'fake_ip_filter'))) {
	config['dns']['fake-ip-filter'] = uci_array(uci.get('nikki', 'mixin', 'fake_ip_filters'));
}
config['dns']['fake-ip-filter-mode'] = uci.get('nikki', 'mixin', 'fake_ip_filter_mode');

config['dns']['respect-rules'] = uci_bool(uci.get('nikki', 'mixin', 'dns_respect_rules'));
config['dns']['prefer-h3'] = uci_bool(uci.get('nikki', 'mixin', 'dns_doh_prefer_http3'));
config['dns']['use-system-hosts'] = uci_bool(uci.get('nikki', 'mixin', 'dns_system_hosts'));
config['dns']['use-hosts'] = uci_bool(uci.get('nikki', 'mixin', 'dns_hosts'));
if (uci_bool(uci.get('nikki', 'mixin', 'hosts'))) {
	config['hosts'] = {};
	uci.foreach('nikki', 'hosts', (section) => {
		if (!uci_bool(section.enabled)) {
			return;
		}
		config['hosts'][section.domain_name] = uci_array(section.ip);
	});
}
if (uci_bool(uci.get('nikki', 'mixin', 'dns_nameserver'))) {
	config['dns']['default-nameserver'] = [];
	config['dns']['proxy-server-nameserver'] = [];
	config['dns']['direct-nameserver'] = [];
	config['dns']['nameserver'] = [];
	config['dns']['fallback'] = [];
	uci.foreach('nikki', 'nameserver', (section) => {
		if (!uci_bool(section.enabled)) {
			return;
		}
		push(config['dns'][section.type], ...uci_array(section.nameserver));
	})
}
if (uci_bool(uci.get('nikki', 'mixin', 'dns_proxy_server_nameserver_policy'))) {
	config['dns']['proxy-server-nameserver-policy'] = {};
	uci.foreach('nikki', 'proxy_server_nameserver_policy', (section) => {
		if (!uci_bool(section.enabled)) {
			return;
		}
		config['dns']['proxy-server-nameserver-policy'][section.matcher] = uci_array(section.nameserver);
	});
}
config['dns']['direct-nameserver-follow-policy'] = uci_bool(uci.get('nikki', 'mixin', 'dns_direct_nameserver_follow_policy'));
if (uci_bool(uci.get('nikki', 'mixin', 'dns_nameserver_policy'))) {
	config['dns']['nameserver-policy'] = {};
	uci.foreach('nikki', 'nameserver_policy', (section) => {
		if (!uci_bool(section.enabled)) {
			return;
		}
		config['dns']['nameserver-policy'][section.matcher] = uci_array(section.nameserver);
	});
}

config['sniffer'] = {};
config['sniffer']['enable'] = uci_bool(uci.get('nikki', 'mixin', 'sniffer'));
config['sniffer']['force-dns-mapping'] = uci_bool(uci.get('nikki', 'mixin', 'sniffer_sniff_dns_mapping'));
config['sniffer']['parse-pure-ip'] = uci_bool(uci.get('nikki', 'mixin', 'sniffer_sniff_pure_ip'));
if (uci_bool(uci.get('nikki', 'mixin', 'sniffer_force_domain_name'))) {
	config['sniffer']['force-domain'] = uci_array(uci.get('nikki', 'mixin', 'sniffer_force_domain_names'));
}
if (uci_bool(uci.get('nikki', 'mixin', 'sniffer_ignore_domain_name'))) {
	config['sniffer']['skip-domain'] = uci_array(uci.get('nikki', 'mixin', 'sniffer_ignore_domain_names'));
}
if (uci_bool(uci.get('nikki', 'mixin', 'sniffer_sniff'))) {
	config['sniffer']['sniff'] = {};
	config['sniffer']['sniff']['HTTP'] = {};
	config['sniffer']['sniff']['TLS'] = {};
	config['sniffer']['sniff']['QUIC'] = {};
	uci.foreach('nikki', 'sniff', (section) => {
		if (!uci_bool(section.enabled)) {
			return;
		}
		config['sniffer']['sniff'][section.protocol]['port'] = uci_array(section.port);
		config['sniffer']['sniff'][section.protocol]['override-destination'] = uci_bool(section.overwrite_destination);
	});
}

config['profile'] = {};
config['profile']['store-selected'] = uci_bool(uci.get('nikki', 'mixin', 'selection_cache'));
config['profile']['store-fake-ip'] = uci_bool(uci.get('nikki', 'mixin', 'fake_ip_cache'));

if (uci_bool(uci.get('nikki', 'mixin', 'rule_provider'))) {
	config['rule-providers'] = {};
	uci.foreach('nikki', 'rule_provider', (section) => {
		if (!uci_bool(section.enabled)) {
			return;
		}
		if (section.type == 'http') {
			config['rule-providers'][section.name] = {
				type: section.type,
				url: section.url,
				proxy: section.node,
				size_limit: section.file_size_limit,
				format: section.file_format,
				behavior: section.behavior,
				interval: section.update_interval,
			}
		} else if (section.type == 'file') {
			config['rule-providers'][section.name] = {
				type: section.type,
				path: section.file_path,
				format: section.file_format,
				behavior: section.behavior,
			}
		}
	})
}
if (uci_bool(uci.get('nikki', 'mixin', 'rule'))) {
	config['nikki-rules'] = [];
	uci.foreach('nikki', 'rule', (section) => {
		if (!uci_bool(section.enabled)) {
			return;
		}
		const rule = [ section.type, section.matcher, section.node, uci_bool(section.no_resolve) ? 'no-resolve' : null ];
		push(config['nikki-rules'], join(',', filter(rule, (item) => item != null && item != '')));
	})
}

const geoip_format = uci.get('nikki', 'mixin', 'geoip_format');
config['geodata-mode'] = geoip_format == null ? null : geoip_format == 'dat';
config['geodata-loader'] = uci.get('nikki', 'mixin', 'geodata_loader');
config['geox-url'] = {};
config['geox-url']['geosite'] = uci.get('nikki', 'mixin', 'geosite_url');
config['geox-url']['mmdb'] = uci.get('nikki', 'mixin', 'geoip_mmdb_url');
config['geox-url']['geoip'] = uci.get('nikki', 'mixin', 'geoip_dat_url');
config['geox-url']['asn'] = uci.get('nikki', 'mixin', 'geoip_asn_url');
config['geo-auto-update'] = uci_bool(uci.get('nikki', 'mixin', 'geox_auto_update'));
config['geo-update-interval'] = uci_int(uci.get('nikki', 'mixin', 'geox_update_interval'));

print(trim_all(config));