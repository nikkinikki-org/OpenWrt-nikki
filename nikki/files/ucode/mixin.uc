#!/usr/bin/ucode

'use strict';

import { cursor } from 'uci';
import { connect } from 'ubus';
import { ensure_array } from '/etc/nikki/ucode/include.uc';

const uci = cursor();
const ubus = connect();

const config = {};

const mixin = uci.get('nikki', 'config', 'mixin') == '1';

config['log-level'] = uci.get('nikki', 'mixin', 'log_level') || 'info';
config['mode'] = uci.get('nikki', 'mixin', 'mode') || 'rule';
config['find-process-mode'] = uci.get('nikki', 'mixin', 'match_process') || 'off';
config['interface-name'] = ubus.call('network.interface', 'status', {'interface': uci.get('nikki', 'mixin', 'outbound_interface')})?.l3_device || '';
config['ipv6'] = uci.get('nikki', 'mixin', 'ipv6') == '1';
if (mixin) {
	config['unified-delay'] = uci.get('nikki', 'mixin', 'unify_delay') == '1';
	config['tcp-concurrent'] = uci.get('nikki', 'mixin', 'tcp_concurrent') == '1';
	config['keep-alive-idle'] = int(uci.get('nikki', 'mixin', 'tcp_keep_alive_idle') || '600');
	config['keep-alive-interval'] = int(uci.get('nikki', 'mixin', 'tcp_keep_alive_interval') || '15');
}

config['external-ui'] = uci.get('nikki', 'mixin', 'ui_path') || 'ui';
config['external-ui-name'] = uci.get('nikki', 'mixin', 'ui_name') || '';
config['external-ui-url'] = uci.get('nikki', 'mixin', 'ui_url');
config['external-controller'] = '0.0.0.0' + ':' + (uci.get('nikki', 'mixin', 'api_port') || '9090');
config['secret'] = uci.get('nikki', 'mixin', 'api_secret') || '666666';
config['profile'] = {};
config['profile']['store-selected'] = uci.get('nikki', 'mixin', 'selection_cache') == '1';
config['profile']['store-fake-ip'] = uci.get('nikki', 'mixin', 'fake_ip_cache') == '1';

config['allow-lan'] = uci.get('nikki', 'mixin', 'allow_lan') == '1';
config['port'] = int(uci.get('nikki', 'mixin', 'http_port') || '8080');
config['socks-port'] = int(uci.get('nikki', 'mixin', 'socks_port') || '1080');
config['mixed-port'] = int(uci.get('nikki', 'mixin', 'mixed_port') || '7890');
config['redir-port'] = int(uci.get('nikki', 'mixin', 'redir_port') || '7891');
config['tproxy-port'] = int(uci.get('nikki', 'mixin', 'tproxy_port') || '7892');

if (uci.get('nikki', 'mixin', 'authentication') == '1') {
	config['authentication'] = [];
	uci.foreach('nikki', 'authentication', (section) => {
		if (section.enabled == '1') {
			push(config['authentication'], `${section.username}:${section.password}`);
		}
	});
}

config['tun'] = {};
if (uci.get('nikki', 'proxy', 'tcp_transparent_proxy_mode') == 'tun' || uci.get('nikki', 'proxy', 'udp_transparent_proxy_mode') == 'tun') {
	config['tun']['enable'] = true;
	config['tun']['device'] = uci.get('nikki', 'mixin', 'tun_device') || 'nikki';
	config['tun']['stack'] = uci.get('nikki', 'mixin', 'tun_stack') || 'system';
	config['tun']['mtu'] = int(uci.get('nikki', 'mixin', 'tun_mtu') || '9000');
	config['tun']['gso'] = uci.get('nikki', 'mixin', 'tun_gso') == '1';
	config['tun']['gso-max-size'] = int(uci.get('nikki', 'mixin', 'tun_gso_max_size') || '65536');
	config['tun']['endpoint-independent-nat'] = uci.get('nikki', 'mixin', 'tun_endpoint_independent_nat') == '1';
	config['tun']['auto-route'] = false;
	config['tun']['auto-redirect'] = false;
	config['tun']['auto-detect-interface'] = false;
	if (uci.get('nikki', 'mixin', 'tun_dns_hijack') == '1') {
		config['tun']['dns-hijack'] = ensure_array(uci.get('nikki', 'mixin', 'tun_dns_hijacks'));
	}
} else {
	config['tun']['enable'] = false;
}

config['dns'] = {};
config['dns']['listen'] = '0.0.0.0' + ':' + (uci.get('nikki', 'mixin', 'dns_port') || '1053');
config['dns']['enhanced-mode'] = uci.get('nikki', 'mixin', 'dns_mode') || 'redir-host';
config['dns']['fake-ip-range'] = uci.get('nikki', 'mixin', 'fake_ip_range') || '198.18.0.1/16';
if (uci.get('nikki', 'mixin', 'fake_ip_filter') == '1') {
	config['dns']['fake-ip-filter'] = ensure_array(uci.get('nikki', 'mixin', 'fake_ip_filters'));
	config['dns']['fake-ip-filter-mode'] = uci.get('nikki', 'mixin', 'fake_ip_filter_mode') || 'blacklist';
}
if (mixin) {
	config['dns']['respect-rules'] = uci.get('nikki', 'mixin', 'dns_respect_rules') == '1';
	config['dns']['prefer-h3'] = uci.get('nikki', 'mixin', 'dns_doh_prefer_http3') == '1';
	config['dns']['ipv6'] = uci.get('nikki', 'mixin', 'dns_ipv6') == '1';
	config['dns']['use-system-hosts'] = uci.get('nikki', 'mixin', 'dns_system_hosts') == '1';
	config['dns']['use-hosts'] = uci.get('nikki', 'mixin', 'dns_hosts') == '1';
	if (uci.get('nikki', 'mixin', 'hosts') == '1') {
		config['hosts'] = {};
		uci.foreach('nikki', 'hosts', (section) => {
			if (section.enabled == '1') {
				config['hosts'][section.domain_name] = ensure_array(section.ip);
			}
		});
	}
	if (uci.get('nikki', 'mixin', 'dns_nameserver') == '1') {
		config['dns']['default-nameserver'] = [];
		config['dns']['proxy-server-nameserver'] = [];
		config['dns']['direct-nameserver'] = [];
		config['dns']['nameserver'] = [];
		config['dns']['fallback'] = [];
		uci.foreach('nikki', 'nameserver', (section) => {
			push(config['dns'][section.type], ...ensure_array(section.nameserver));
		})
	}
	if (uci.get('nikki', 'mixin', 'dns_nameserver_policy') == '1') {
		config['dns']['nameserver-policy'] = {};
		uci.foreach('nikki', 'nameserver_policy', (section) => {
			if (section.enabled == '1') {
				config['dns']['nameserver-policy'][section.matcher] = ensure_array(section.nameserver);
			}
		});
	}
}

if (mixin) {
	config['sniffer'] = {};
	config['sniffer']['enable'] = uci.get('nikki', 'mixin', 'sniffer') == '1';
	config['sniffer']['force-dns-mapping'] = uci.get('nikki', 'mixin', 'sniffer_sniff_dns_mapping') == '1';
	config['sniffer']['parse-pure-ip'] = uci.get('nikki', 'mixin', 'sniffer_sniff_pure_ip') == '1';
	config['sniffer']['override-destination'] = uci.get('nikki', 'mixin', 'sniffer_overwrite_destination') == '1';
	if (uci.get('nikki', 'mixin', 'sniffer_force_domain_name') == '1') {
		config['sniffer']['force-domain'] = uci.get('nikki', 'mixin', 'sniffer_force_domain_names');
	}
	if (uci.get('nikki', 'mixin', 'sniffer_ignore_domain_name') == '1') {
		config['sniffer']['skip-domain'] = uci.get('nikki', 'mixin', 'sniffer_ignore_domain_names');
	}
	if (uci.get('nikki', 'mixin', 'sniffer_sniff') == '1') {
		config['sniffer']['sniff'] = {};
		config['sniffer']['sniff']['HTTP'] = {};
		config['sniffer']['sniff']['TLS'] = {};
		config['sniffer']['sniff']['QUIC'] = {};
		uci.foreach('nikki', 'sniff', (section) => {
			if (section.enabled == '1') {
				config['sniffer']['sniff'][section.protocol]['port'] = ensure_array(section.port);
				config['sniffer']['sniff'][section.protocol]['override-destination'] = section.overwrite_destination == '1';
			}
		});
	}
}

if (uci.get('nikki', 'mixin', 'rule_provider') == '1') {
	config['rule-providers'] = {};
	uci.foreach('nikki', 'rule_provider', (section) => {
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
if (uci.get('nikki', 'mixin', 'rule') == '1') {
	config['nikki-rules'] = [];
	uci.foreach('nikki', 'rule', (section) => {
		let rule;
		if (section.type == null || section.type == '') {
			rule = `${section.matcher},${section.node}`;
		} else {
			rule = `${section.type},${section.matcher},${section.node}`;
		}
		if (section.no_resolve == '1') {
			rule += ',no_resolve';
		}
		push(config['nikki-rules'], rule);
	})
}

if (mixin) {
	config['geodata-mode'] = (uci.get('nikki', 'mixin', 'geoip_format') || 'mmdb') == 'dat';
	config['geodata-loader'] = uci.get('nikki', 'mixin', 'geodata_loader') || 'memconservative';
	config['geox-url'] = {};
	config['geox-url']['geosite'] = uci.get('nikki', 'mixin', 'geosite_url');
	config['geox-url']['mmdb'] = uci.get('nikki', 'mixin', 'geoip_mmdb_url');
	config['geox-url']['geoip'] = uci.get('nikki', 'mixin', 'geoip_dat_url');
	config['geox-url']['asn'] = uci.get('nikki', 'mixin', 'geoip_asn_url');
	config['geo-auto-update'] = uci.get('nikki', 'mixin', 'geox_auto_update') == '1';
	config['geo-update-interval'] = int(uci.get('nikki', 'mixin', 'geox_update_interval') || '24');
}

print(config);