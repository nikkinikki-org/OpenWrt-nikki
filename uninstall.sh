#!/bin/sh

# Nikki's uninstaller

# uninstall
if [ -x "/bin/opkg" ]; then
	opkg list-installed luci-i18n-nikki-* | cut -d ' ' -f 1 | xargs opkg remove
	opkg remove luci-app-nikki
	opkg remove nikki
	opkg remove mihomo-meta mihomo-alpha
elif [ -x "/usr/bin/apk" ]; then
	apk list --installed --manifest luci-i18n-nikki-* | cut -d ' ' -f 1 | xargs apk del
	apk del luci-app-nikki
	apk del nikki
	apk del mihomo-meta mihomo-alpha
fi
# remove config
rm -f /etc/config/nikki
# remove files
rm -rf /etc/nikki
# remove log
rm -rf /var/log/nikki
# remove temp
rm -rf /var/run/nikki
# remove feed
if [ -x "/bin/opkg" ]; then
	if grep -q nikki /etc/opkg/customfeeds.conf; then
		sed -i '/nikki/d' /etc/opkg/customfeeds.conf
	fi
	wget -O "nikki.pub" "https://nikkinikki.pages.dev/key-build.pub"
	opkg-key remove nikki.pub
	rm -f nikki.pub
elif [ -x "/usr/bin/apk" ]; then
	if grep -q nikki /etc/apk/repositories.d/customfeeds.list; then
		sed -i '/nikki/d' /etc/apk/repositories.d/customfeeds.list
	fi
	rm -f /etc/apk/keys/nikki.pem
fi
