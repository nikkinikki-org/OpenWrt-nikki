#!/bin/sh

. "$IPKG_INSTROOT/etc/mihomo/scripts/constants.sh"

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

# commit
uci commit mihomo

# exit with 0
exit 0
