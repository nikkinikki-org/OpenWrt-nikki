#!/bin/sh

. "$IPKG_INSTROOT/etc/mihomo/scripts/include.sh"

# since v1.8.4

dns_doh_prefer_http3=$(uci -q get mihomo.mixin.dns_doh_prefer_http3); [ -z "$dns_doh_prefer_http3" ] && uci set mihomo.mixin.dns_doh_prefer_http3=0

# since v1.8.7

mixin_file_content=$(uci -q get mihomo.mixin.mixin_file_content); [ -z "$mixin_file_content" ] && uci set mihomo.mixin.mixin_file_content=$(uci -q get mihomo.config.mixin)

# since v1.9.3

start_delay=$(uci -q get mihomo.config.start_delay); [ -z "$start_delay" ] && uci set mihomo.config.start_delay=0

# since v1.11.0

acl_tcp_dport=$(uci -q get mihomo.proxy.acl_tcp_dport); [ -n "$acl_tcp_dport" ] && uci rename mihomo.proxy.acl_tcp_dport=proxy_tcp_dport

acl_udp_dport=$(uci -q get mihomo.proxy.acl_udp_dport); [ -n "$acl_udp_dport" ] && uci rename mihomo.proxy.acl_udp_dport=proxy_udp_dport

bypass_user=$(uci -q get mihomo.proxy.bypass_user); [ -z "$bypass_user" ] && {
	uci add_list mihomo.proxy.bypass_user=aria2
	uci add_list mihomo.proxy.bypass_user=dnsmasq
	uci add_list mihomo.proxy.bypass_user=ftp
	uci add_list mihomo.proxy.bypass_user=logd
	uci add_list mihomo.proxy.bypass_user=nobody
	uci add_list mihomo.proxy.bypass_user=ntp
	uci add_list mihomo.proxy.bypass_user=ubus
}

bypass_group=$(uci -q get mihomo.proxy.bypass_group); [ -z "$bypass_group" ] && {
	uci add_list mihomo.proxy.bypass_group=aria2
	uci add_list mihomo.proxy.bypass_group=dnsmasq
	uci add_list mihomo.proxy.bypass_group=ftp
	uci add_list mihomo.proxy.bypass_group=logd
	uci add_list mihomo.proxy.bypass_group=nogroup
	uci add_list mihomo.proxy.bypass_group=ntp
	uci add_list mihomo.proxy.bypass_group=ubus
}

# since v1.12.0

env=$(uci -q get mihomo.env); [ -z "$env" ] && {
	uci set mihomo.env=env
	uci set mihomo.env.disable_safe_path_check=0
	uci set mihomo.env.disable_loopback_detector=0
	uci set mihomo.env.disable_quic_go_gso=0
	uci set mihomo.env.disable_quic_go_ecn=0
}

# since v1.15.0

tun_device=$(uci -q get mihomo.mixin.tun_device); [ -z "$tun_device" ] && uci set mihomo.mixin.tun_device=mihomo

# since v1.16.0

unify_delay=$(uci -q get mihomo.mixin.unify_delay); [ -z "$unify_delay" ] && uci set mihomo.mixin.unify_delay=1

tcp_concurrent=$(uci -q get mihomo.mixin.tcp_concurrent); [ -z "$tcp_concurrent" ] && uci set mihomo.mixin.tcp_concurrent=1

sniffer=$(uci -q get mihomo.mixin.sniffer); [ -z "$sniffer" ] && {
	uci set mihomo.mixin.sniffer=0
	uci set mihomo.mixin.sniffer_sniff_dns_mapping=1
	uci set mihomo.mixin.sniffer_sniff_pure_ip=1
	uci set mihomo.mixin.sniffer_overwrite_destination=0
	uci set mihomo.mixin.sniffer_force_domain_name=0
	uci set mihomo.mixin.sniffer_ignore_domain_name=0
	uci set mihomo.mixin.sniffer_sniff=0

	uci add mihomo sniff
	uci set mihomo.@sniff[-1].enabled=1
	uci set mihomo.@sniff[-1].protocol=HTTP
	uci add_list mihomo.@sniff[-1].port=80
	uci add_list mihomo.@sniff[-1].port=8080
	uci set mihomo.@sniff[-1].overwrite_destination=1

	uci add mihomo sniff
	uci set mihomo.@sniff[-1].enabled=1
	uci set mihomo.@sniff[-1].protocol=TLS
	uci add_list mihomo.@sniff[-1].port=443
	uci add_list mihomo.@sniff[-1].port=8443
	uci set mihomo.@sniff[-1].overwrite_destination=1

	uci add mihomo sniff
	uci set mihomo.@sniff[-1].enabled=1
	uci set mihomo.@sniff[-1].protocol=QUIC
	uci add_list mihomo.@sniff[-1].port=443
	uci add_list mihomo.@sniff[-1].port=8443
	uci set mihomo.@sniff[-1].overwrite_destination=1
}

uci show mihomo | grep -E 'mihomo.@host\[[[:digit:]]+\]=host' | sed 's/mihomo.@host\[\([[:digit:]]\+\)\]=host/set mihomo.@host[\1]=hosts/' | uci batch

# commit
uci commit mihomo

# exit with 0
exit 0
