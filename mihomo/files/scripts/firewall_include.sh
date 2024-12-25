#!/bin/sh

. "$IPKG_INSTROOT/lib/functions.sh"
. "$IPKG_INSTROOT/etc/mihomo/scripts/include.sh"

config_load mihomo
config_get enabled "config" "enabled" 0
config_get tcp_transparent_proxy_mode "proxy" "tcp_transparent_proxy_mode"
config_get udp_transparent_proxy_mode "proxy" "udp_transparent_proxy_mode"
config_get tun_device "mixin" "tun_device"

if [ "$enabled" == 1 ] && [[ "$tcp_transparent_proxy_mode" == "tun" || "$udp_transparent_proxy_mode" == "tun" ]]; then
	nft insert rule inet fw4 input iifname "$tun_device" counter accept comment "mihomo"
	nft insert rule inet fw4 forward oifname "$tun_device" counter accept comment "mihomo"
	nft insert rule inet fw4 forward iifname "$tun_device" counter accept comment "mihomo"
fi

exit 0
