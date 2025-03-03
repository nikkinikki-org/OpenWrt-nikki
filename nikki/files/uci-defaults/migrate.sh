#!/bin/sh

. "$IPKG_INSTROOT/etc/nikki/scripts/include.sh"

# since v1.18.0

mixin_rule=$(uci -q get nikki.mixin.rule); [ -z "$mixin_rule" ] && uci set nikki.mixin.rule=0

mixin_rule_provider=$(uci -q get nikki.mixin.rule_provider); [ -z "$mixin_rule_provider" ] && uci set nikki.mixin.rule_provider=0

# since v1.19.0

mixin_ui_path=$(uci -q get nikki.mixin.ui_path); [ -z "$mixin_ui_path" ] && uci set nikki.mixin.ui_path=ui

uci show nikki | grep -E 'nikki.@rule\[[[:digit:]]+\].match=' | sed 's/nikki.@rule\[\([[:digit:]]\+\)\].match=.*/rename nikki.@rule[\1].match=matcher/' | uci batch

# since v1.19.1

proxy_fake_ip_ping_hijack=$(uci -q get nikki.proxy.fake_ip_ping_hijack); [ -z "$proxy_fake_ip_ping_hijack" ] && uci set nikki.proxy.fake_ip_ping_hijack=0

# since v1.20.0

mixin=$(uci -q get nikki.config.mixin); [ -n "$mixin" ] && {
	uci del nikki.config.mixin
	[ "$mixin" == "0" ] && {
		uci del nikki.mixin.unify_delay
		uci del nikki.mixin.tcp_concurrent
		uci del nikki.mixin.tcp_keep_alive_idle
		uci del nikki.mixin.tcp_keep_alive_interval
		uci set nikki.mixin.fake_ip_filter=0
		uci del nikki.mixin.fake_ip_filter_mode
		uci del nikki.mixin.dns_respect_rules
		uci del nikki.mixin.dns_doh_prefer_http3
		uci del nikki.mixin.dns_system_hosts
		uci del nikki.mixin.dns_hosts
		uci set nikki.mixin.hosts=0
		uci set nikki.mixin.dns_nameserver=0
		uci set nikki.mixin.dns_nameserver_policy=0
		uci del nikki.mixin.sniffer
		uci del nikki.mixin.sniffer_sniff_dns_mapping
		uci del nikki.mixin.sniffer_sniff_pure_ip
		uci set nikki.mixin.sniffer_force_domain_name=0
		uci set nikki.mixin.sniffer_ignore_domain_name=0
		uci set nikki.mixin.sniffer_sniff=0
		uci del nikki.mixin.geoip_format
		uci del nikki.mixin.geodata_loader
		uci del nikki.mixin.geosite_url
		uci del nikki.mixin.geoip_mmdb_url
		uci del nikki.mixin.geoip_dat_url
		uci del nikki.mixin.geoip_asn_url
		uci del nikki.mixin.geox_auto_update
		uci del nikki.mixin.geox_update_interval
	}
}

mixin_api_port=$(uci -q get nikki.mixin.api_port); [ -n "$mixin_api_port" ] && {
	uci del nikki.mixin.api_port
	uci set nikki.mixin.api_listen=[::]:$mixin_api_port
}

mixin_dns_port=$(uci -q get nikki.mixin.dns_port); [ -n "$mixin_dns_port" ] && {
	uci del nikki.mixin.dns_port
	uci set nikki.mixin.dns_listen=[::]:$mixin_dns_port
}

# commit
uci commit nikki

# exit with 0
exit 0
