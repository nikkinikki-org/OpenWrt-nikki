#!/bin/sh

# MihomoTProxy's feed

# check env
if [[ ! -x "/bin/opkg" || ! -x "/sbin/fw4" ]]; then
	echo "only supports OpenWrt build with firewall4!"
	exit 1
fi

# include openwrt_release
. /etc/openwrt_release

# add key
echo "add key"
key_build_pub_file="key-build.pub"
curl -s -L -o "$key_build_pub_file" "https://mirror.ghproxy.com/https://github.com/morytyann/OpenWrt-mihomo/raw/refs/heads/main/key-build.pub"
opkg-key add "$key_build_pub_file"
rm -f "$key_build_pub_file"

# add feed
echo "add feed"
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
echo "src/gz mihomo https://morytyann.github.io/OpenWrt-mihomo/$branch/$arch/mihomo" >> "/etc/opkg/customfeeds.conf"

# update feeds
echo "update feeds"
opkg update

echo "success"
