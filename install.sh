#!/bin/sh

# MihomoTProxy's installer

# check env
if [[ ! -x "/bin/opkg" || ! -x "/sbin/fw4" ]]; then
	echo "only supports OpenWrt build with firewall4!"
	exit 1
fi

# include openwrt_release
. /etc/openwrt_release

# update feeds
echo "update feeds"
opkg update

# download tarball
echo "download tarball"
arch="$DISTRIB_ARCH"
branch=
if [[ "$DISTRIB_RELEASE" == *"22.03"* ]]; then
	branch="openwrt-22.03"
elif [[ "$DISTRIB_RELEASE" == *"23.05"* ]]; then
	branch="openwrt-23.05"
elif [[ "$DISTRIB_RELEASE" == *"24.10"* ]]; then
	branch="openwrt-24.10"
elif [[ "$DISTRIB_RELEASE" == "SNAPSHOT" ]]; then
	branch="SNAPSHOT"
else
	echo "unknown release: $DISTRIB_RELEASE"
	exit 1
fi
tarball="mihomo_$arch-$branch.tar.gz"
curl -s -L -o "$tarball" "https://mirror.ghproxy.com/https://github.com/morytyann/OpenWrt-mihomo/releases/latest/download/$tarball"

# extract tarball
echo "extract tarball"
tar -x -z -f "$tarball"
rm -f "$tarball"

# install ipks
echo "install ipks"
opkg install mihomo_*.ipk
opkg install luci-app-mihomo_*.ipk
opkg install luci-i18n-mihomo-zh-cn_*.ipk
rm -f *mihomo*.ipk

echo "success"
