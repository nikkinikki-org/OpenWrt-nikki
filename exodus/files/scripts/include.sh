#!/bin/sh

# paths
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

# temp
TEMP_DIR="/var/run/nikki"
PID_FILE_PATH="$TEMP_DIR/nikki.pid"
STARTED_FLAG_PATH="$TEMP_DIR/started.flag"
BRIDGE_NF_CALL_IPTABLES_FLAG_PATH="$TEMP_DIR/bridge_nf_call_iptables.flag"
BRIDGE_NF_CALL_IP6TABLES_FLAG_PATH="$TEMP_DIR/bridge_nf_call_ip6tables.flag"

# ucode
UCODE_DIR="$HOME_DIR/ucode"
INCLUDE_UC="$UCODE_DIR/include.uc"
MIXIN_UC="$UCODE_DIR/mixin.uc"
HIJACK_UT="$UCODE_DIR/hijack.ut"
PROVIDER_UC="$UCODE_DIR/provider.uc"

# scripts
SH_DIR="$HOME_DIR/scripts"
INCLUDE_SH="$SH_DIR/include.sh"
FIREWALL_INCLUDE_SH="$SH_DIR/firewall_include.sh"

# nftables
NFT_DIR="$HOME_DIR/nftables"
GEOIP_CN_NFT="$NFT_DIR/geoip_cn.nft"
GEOIP6_CN_NFT="$NFT_DIR/geoip6_cn.nft"

# functions
format_filesize() {
	local b; b=1
	local kb; kb=$((b * 1024))
	local mb; mb=$((kb * 1024))
	local gb; gb=$((mb * 1024))
	local tb; tb=$((gb * 1024))
	local pb; pb=$((tb * 1024))
	local size; size="$1"
	if [ -n "$size" ]; then
		if [ "$size" -lt "$kb" ]; then
			echo "$(awk "BEGIN {print $size / $b}") B"
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
	if [ ! -d "$TEMP_DIR" ]; then
		mkdir -p "$TEMP_DIR"
	fi
}

log() {
	echo "[$(date "+%Y-%m-%d %H:%M:%S")] [$1] $2" >> "$APP_LOG_PATH"
}

get_package_version() {
	# print the installed version of package $1 without the release suffix
	local version
	if [ -x "/bin/opkg" ]; then
		version=$(opkg list-installed "$1" | cut -d ' ' -f 3)
	elif [ -x "/usr/bin/apk" ]; then
		version=$(apk list -I "$1" 2>/dev/null | cut -d ' ' -f 1)
		version=${version#"$1"-}
	fi
	echo "${version%-r*}"
}

get_app_version() {
	local version; version=$(get_package_version luci-app-exodus)
	if [ -z "$version" ]; then
		version=$(get_package_version exodus)
	fi
	echo "$version"
}

generate_hwid() {
	# derive from board name and the mac of the first physical interface, so reinstall or config reset keeps the same hwid
	local board_name mac dev
	board_name=$(cat /tmp/sysinfo/board_name 2>/dev/null)
	for dev in /sys/class/net/*; do
		if [ -e "$dev/device" ]; then
			mac=$(cat "$dev/address" 2>/dev/null)
			[ -n "$mac" ] && [ "$mac" != "00:00:00:00:00:00" ] && break
			mac=
		fi
	done
	if [ -n "$mac" ]; then
		echo -n "$board_name$mac" | md5sum | cut -d ' ' -f 1
	else
		cat /proc/sys/kernel/random/uuid | tr -d '-'
	fi
}

hwid_headers() {
	# headers for subscriptions with a hwid device limit (remnawave), one "name: value" per line, the advanced page shows them too
	local hwid; hwid=$(uci -q get nikki.config.hwid)
	if [ -z "$hwid" ]; then
		hwid=$(generate_hwid)
	fi
	echo "x-hwid: $hwid"
	echo "x-device-os: OpenWrt"
	echo "x-ver-os: $(. /etc/openwrt_release && echo "$DISTRIB_RELEASE")"
	echo "x-device-model: $(cat /tmp/sysinfo/model 2>/dev/null)"
}
