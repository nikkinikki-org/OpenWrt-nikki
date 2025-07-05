#!/bin/sh

# uninstall
if [ -x "/bin/opkg" ]; then
	# 移除繁體中文語言包（如果存在）
	if opkg list-installed | grep -q "luci-i18n-nikki-zh-tw"; then
		opkg remove luci-i18n-nikki-zh-tw
	fi
	# 移除簡體中文語言包
	opkg remove luci-i18n-nikki-zh-cn
	opkg remove luci-app-nikki
	opkg remove nikki
elif [ -x "/usr/bin/apk" ]; then
	# 移除繁體中文語言包（如果存在）
	if apk info -e luci-i18n-nikki-zh-tw; then
		apk del luci-i18n-nikki-zh-tw
	fi
	apk del luci-i18n-nikki-zh-cn
	apk del luci-app-nikki
	apk del nikki
fi
# remove config
rm -f /etc/config/nikki
# remove files
rm -rf /etc/nikki
# remove feed
if [ -x "/bin/opkg" ]; then
	if (grep -q nikki /etc/opkg/customfeeds.conf); then
		sed -i '/nikki/d' /etc/opkg/customfeeds.conf
	fi
	wget -O "nikki.pub" "https://nikkinikki.pages.dev/key-build.pub"
	opkg-key remove nikki.pub
	rm -f nikki.pub
elif [ -x "/usr/bin/apk" ]; then
	if (grep -q nikki /etc/apk/repositories.d/customfeeds.list); then
		sed -i '/nikki/d' /etc/apk/repositories.d/customfeeds.list
	fi
	rm -f /etc/apk/keys/nikki.pem
fi
