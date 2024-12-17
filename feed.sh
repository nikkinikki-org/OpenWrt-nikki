#!/bin/sh

# MihomoTProxy's feed

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

if [ -x "/bin/opkg" ]; then
	# add key
	echo "add key"
	key_build_pub_file="key-build.pub"
	curl -s -L -o "$key_build_pub_file" "https://github.com/morytyann/OpenWrt-mihomo/raw/refs/heads/main/key-build.pub"
	opkg-key add "$key_build_pub_file"
	rm -f "$key_build_pub_file"
	# add feed
	echo "add feed"
	if (grep -q mihomo /etc/opkg/customfeeds.conf); then
		sed -i '/mihomo/d' /etc/opkg/customfeeds.conf
	fi
	echo "src/gz mihomo https://morytyann.github.io/OpenWrt-mihomo/$branch/$arch/mihomo" >> /etc/opkg/customfeeds.conf
	# update feeds
	echo "update feeds"
	opkg update
elif [ -x "/usr/bin/apk" ]; then
	# add key
	# todo: implement add key for apk
	# add feed
	echo "add feed"
	if (grep -q mihomo /etc/apk/repositories.d/customfeeds.list); then
		sed -i '/mihomo/d' /etc/apk/repositories.d/customfeeds.list
	fi
	echo "https://morytyann.github.io/OpenWrt-mihomo/$branch/$arch/mihomo/packages.adb" >> /etc/apk/repositories.d/customfeeds.list
	# update feeds
	echo "update feeds"
	apk update
fi

echo "success"
