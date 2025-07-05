#!/bin/sh

# Nikki's installer

# check env
if [[ ! -x "/bin/opkg" && ! -x "/usr/bin/apk" || ! -x "/sbin/fw4" ]]; then
	echo "only supports OpenWrt build with firewall4!"
	exit 1
fi

# include openwrt_release
. /etc/openwrt_release

# get branch/arch
arch="$DISTRIB_ARCH"
branch=
case "$DISTRIB_RELEASE" in
	*"23.05"*)
		branch="openwrt-23.05"
		;;
	*"24.10"*)
		branch="openwrt-24.10"
		;;
	"SNAPSHOT")
		branch="SNAPSHOT"
		;;
	*)
		echo "unsupported release: $DISTRIB_RELEASE"
		exit 1
		;;
esac

# feed url
repository_url="https://nikkinikki.pages.dev"
feed_url="$repository_url/$branch/$arch/nikki"

if [ -x "/bin/opkg" ]; then
	# update feeds
	echo "update feeds"
	opkg update
	# install ipks
	echo "install ipks"
	eval "$(wget -O - $feed_url/index.json | jsonfilter -e 'nikki_version=@["packages"]["nikki"]' -e 'luci_app_nikki_version=@["packages"]["luci-app-nikki"]' -e 'luci_i18n_nikki_zh_cn_version=@["packages"]["luci-i18n-nikki-zh-cn"]' -e 'luci_i18n_nikki_zh_tw_version=@["packages"]["luci-i18n-nikki-zh-tw"]')"
	opkg install "$feed_url/nikki_${nikki_version}_${arch}.ipk"
	opkg install "$feed_url/luci-app-nikki_${luci_app_nikki_version}_all.ipk"
	opkg install "$feed_url/luci-i18n-nikki-zh-cn_${luci_i18n_nikki_zh_cn_version}_all.ipk"
	
	# 安裝繁體中文語言包（如果存在）
	if [ ! -z "$luci_i18n_nikki_zh_tw_version" ]; then
		opkg install "$feed_url/luci-i18n-nikki-zh-tw_${luci_i18n_nikki_zh_tw_version}_all.ipk"
	else
		echo "繁體中文語言包不存在，僅安裝簡體中文版本"
	fi
	
	rm -f -- *nikki*.ipk
elif [ -x "/usr/bin/apk" ]; then
	# update feeds
	echo "update feeds"
	apk update
	# install apks from remote repository
	echo "install apks from remote repository"
	apk add --allow-untrusted -X $feed_url/packages.adb nikki luci-app-nikki luci-i18n-nikki-zh-cn luci-i18n-nikki-zh-tw
fi

echo "success" 
