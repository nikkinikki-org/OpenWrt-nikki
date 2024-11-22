#!/bin/sh

# permission
MIHOMO_USER="root"
MIHOMO_GROUP="mihomo"

# routing
FW_TABLE="mihomo"
FW_MARK="0x80"
FW_MARK_MASK="0xFF"
TCP_RULE_PREF="1024"
UDP_RULE_PREF="1025"
TPROXY_ROUTE_TABLE="80"
TUN_ROUTE_TABLE="81"
TUN_DEVICE="mihomo"

# paths
PROG="/usr/bin/mihomo"
HOME_DIR="/etc/mihomo"
PROFILES_DIR="$HOME_DIR/profiles"
SUBSCRIPTIONS_DIR="$HOME_DIR/subscriptions"
MIXIN_FILE_PATH="$HOME_DIR/mixin.yaml"
RUN_DIR="$HOME_DIR/run"
RUN_PROFILE_PATH="$RUN_DIR/config.yaml"
RUN_UI_DIR="$RUN_DIR/ui"
LOG_DIR="/var/log/mihomo"
APP_LOG_PATH="$LOG_DIR/app.log"
CORE_LOG_PATH="$LOG_DIR/core.log"

# scripts
SH_DIR="$HOME_DIR/scripts"
INCLUDE_SH="$SH_DIR/include.sh"
FIREWALL_INCLUDE_SH="$SH_DIR/firewall_include.sh"

# nftables
NFT_DIR="$HOME_DIR/nftables"
HIJACK_NFT="$NFT_DIR/hijack.nft"
RESERVED_IP_NFT="$NFT_DIR/reserved_ip.nft"
RESERVED_IP6_NFT="$NFT_DIR/reserved_ip6.nft"
GEOIP_CN_NFT="$NFT_DIR/geoip_cn.nft"
GEOIP6_CN_NFT="$NFT_DIR/geoip6_cn.nft"

# functions
format_filesize() {
	local kb; kb=1024
	local mb; mb=$((kb * 1024))
	local gb; gb=$((mb * 1024))
	local tb; tb=$((gb * 1024))
	local pb; pb=$((tb * 1024))
	local size; size="$1"
	if [ -z "$size" ]; then
		echo ""
	elif [ "$size" -lt "$kb" ]; then
		echo "$size B"
	elif [ "$size" -lt "$mb" ]; then
		echo "$(awk "BEGIN {print $size / $kb}") KB"
	elif [ "$size" -lt "$gb" ]; then
		echo "$(awk "BEGIN {print $size / $mb}") MB"
	elif [ "$size" -lt "$tb" ]; then
		echo "$(awk "BEGIN {print $size / $gb}") GB"
	elif [ "$size" -lt "$pb" ]; then
		echo "$(awk "BEGIN {print $size / $tb}") TB"
	else
		echo "$(awk "BEGIN {print $size / $pb}") PB"
	fi
}
