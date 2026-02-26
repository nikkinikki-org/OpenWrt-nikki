#!/bin/sh

. "$IPKG_INSTROOT/lib/functions.sh"
. "$IPKG_INSTROOT/etc/nikki/scripts/include.sh"

config_load nikki
config_get_bool enabled "config" "enabled" 0
config_get_bool core_only "config" "core_only" 0
config_get tun_listener_name "core" "tun_listener_name"
config_get_bool proxy_enabled "proxy" "enabled" 0 
config_get tcp_mode "proxy" "tcp_mode"
config_get udp_mode "proxy" "udp_mode"

if [ "$enabled" = 1 ] && [ "$core_only" = 0 ] && [ "$proxy_enabled" = 1 ]; then
	if [ "$tcp_mode" = "tun" ] || [ "$udp_mode" = "tun" ]; then
		tun_device=
		if yq -M -e 'has("tun") and (.tun | .enabled) and (.tun | has("device"))' "$RUN_PROFILE_PATH" > /dev/null 2>&1; then
			tun_device=$(yq -M '.tun.device' "$RUN_PROFILE_PATH")
		else
			tun_device=$(yq -M ".listeners[] | select(.name == \"$tun_listener_name\" and .type == \"tun\") | .device" "$RUN_PROFILE_PATH")
		fi
		if [ -n "$tun_device" ]; then
			nft insert rule inet fw4 input iifname "$tun_device" counter accept comment "nikki"
			nft insert rule inet fw4 forward oifname "$tun_device" counter accept comment "nikki"
			nft insert rule inet fw4 forward iifname "$tun_device" counter accept comment "nikki"
		fi
	fi
fi

exit 0
