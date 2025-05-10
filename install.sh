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
	# download ipks
	eval $(curl -s -L $feed_url/index.json | jsonfilter -e 'version=@["packages"]["nikki"]' -e 'app_version=@["packages"]["luci-app-nikki"]' -e 'i18n_version=@["packages"]["luci-i18n-nikki-zh-cn"]')
	curl -s -L -J -O $feed_url/nikki_${version}_${arch}.ipk
	curl -s -L -J -O $feed_url/luci-app-nikki_${app_version}_all.ipk
	curl -s -L -J -O $feed_url/luci-i18n-nikki-zh-cn_${i18n_version}_all.ipk
	# update feeds
	echo "update feeds"
	opkg update
	# install ipks
	echo "install ipks"
	opkg install nikki_*.ipk luci-app-nikki_*.ipk luci-i18n-nikki-zh-cn_*.ipk
	rm -f -- *nikki*.ipk
elif [ -x "/usr/bin/apk" ]; then
	# add key
	echo "add key"
	curl -s -L -o "/etc/apk/keys/nikki.pem" "$repository_url/public-key.pem"
	# install apks from remote repository
	echo "install apks from remote repository"
	apk add --repository $feed_url/packages.adb nikki luci-app-nikki luci-i18n-nikki-zh-cn
	# remove key
	echo "remove key"
	rm -f /etc/apk/keys/nikki.pem
fi

echo "success"
