#!/bin/sh

# permission
NIKKI_USER="root"
NIKKI_GROUP="nikki"

# routing
TPROXY_FW_MARK="0x80"
TUN_FW_MARK="0x81"
TPROXY_RULE_PREF="1024"
TUN_RULE_PREF="1025"
TPROXY_ROUTE_TABLE="80"
TUN_ROUTE_TABLE="81"

# paths
PROG="/usr/bin/mihomo"
HOME_DIR="/etc/nikki"
PROFILES_DIR="$HOME_DIR/profiles"
SUBSCRIPTIONS_DIR="$HOME_DIR/subscriptions"
MIXIN_FILE_PATH="$HOME_DIR/mixin.yaml"
RUN_DIR="$HOME_DIR/run"
RUN_PROFILE_PATH="$RUN_DIR/config.yaml"
PROVIDERS_DIR="$RUN_DIR/providers"
RULE_PROVIDERS_DIR="$PROVIDERS_DIR/rule"
PROXY_PROVIDERS_DIR="$PROVIDERS_DIR/proxy"

# log
LOG_DIR="/var/log/nikki"
APP_LOG_PATH="$LOG_DIR/app.log"
CORE_LOG_PATH="$LOG_DIR/core.log"

# flag
FLAG_DIR="/var/run/nikki"
STARTED_FLAG="$FLAG_DIR/started.flag"
BRIDGE_NF_CALL_IPTABLES_FLAG="$FLAG_DIR/bridge_nf_call_iptables.flag"
BRIDGE_NF_CALL_IP6TABLES_FLAG="$FLAG_DIR/bridge_nf_call_ip6tables.flag"

# ucode
UCODE_DIR="$HOME_DIR/ucode"
INCLUDE_UCODE="$UCODE_DIR/include.uc"
MIXIN_UC="$UCODE_DIR/mixin.uc"
HIJACK_UT="$UCODE_DIR/hijack.ut"

# scripts
SH_DIR="$HOME_DIR/scripts"
INCLUDE_SH="$SH_DIR/include.sh"
FIREWALL_INCLUDE_SH="$SH_DIR/firewall_include.sh"

# nftables
NFT_DIR="$HOME_DIR/nftables"
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

prepare_files() {
	if [ ! -d "$LOG_DIR" ]; then
		mkdir -p "$LOG_DIR"
	fi
	if [ ! -f "$APP_LOG_PATH" ]; then
		touch "$APP_LOG_PATH"
	fi
	if [ ! -f "$CORE_LOG_PATH" ]; then
		touch "$CORE_LOG_PATH"
	fi
	if [ ! -d "$FLAG_DIR" ]; then
		mkdir -p "$FLAG_DIR"
	fi
}

clear_log() {
	echo -n > "$APP_LOG_PATH"
	echo -n > "$CORE_LOG_PATH"
}

log() {
	echo "[$(date "+%Y-%m-%d %H:%M:%S")] [$1] $2" >> "$APP_LOG_PATH"
}
