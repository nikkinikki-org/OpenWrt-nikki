#!/bin/sh

# MihomoTProxy's installer

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
if [[ "$DISTRIB_RELEASE" == *"23.05"* ]]; then
	branch="openwrt-23.05"
elif [[ "$DISTRIB_RELEASE" == *"24.10"* ]]; then
	branch="openwrt-24.10"
elif [[ "$DISTRIB_RELEASE" == "SNAPSHOT" ]]; then
	branch="SNAPSHOT"
else
	echo "unsupported release: $DISTRIB_RELEASE"
	exit 1
fi

# download tarball
echo "download tarball"
tarball="mihomo_$arch-$branch.tar.gz"
curl -s -L -o "$tarball" "https://github.com/morytyann/OpenWrt-mihomo/releases/latest/download/$tarball"

# extract tarball
echo "extract tarball"
tar -x -z -f "$tarball"
rm -f "$tarball"

if [ -x "/bin/opkg" ]; then
	# update feeds
	echo "update feeds"
	opkg update
	# install ipks
	echo "install ipks"
	opkg install mihomo_*.ipk
	opkg install luci-app-mihomo_*.ipk
	opkg install luci-i18n-mihomo-zh-cn_*.ipk
	rm -f -- *mihomo*.ipk
elif [ -x "/usr/bin/apk" ]; then
	# update feeds
	echo "update feeds"
	apk update
	# install apks
	echo "install apks"
	apk add --allow-untrusted mihomo-*.apk
	apk add --allow-untrusted luci-app-mihomo-*.apk
	apk add --allow-untrusted luci-i18n-mihomo-zh-cn-*.apk
	rm -f -- *mihomo*.apk
fi

echo "success"
