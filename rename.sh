#!/bin/sh

# Rename from MihomoTProxy to Nikki

# if mihomo is installed, uninstall it
# if nikki is not installed, install it
# if config and files exists, migrate it
# if mihomo feed is configured, remove it and add nikki feed

migrate() {
	if [ -f "/etc/config/mihomo" ]; then
		cp -f /etc/config/mihomo /etc/config/nikki
		rm -f /etc/config/mihomo
	fi
	if [ -d "/etc/mihomo" ]; then
		mkdir -p /etc/nikki
		cp -r /etc/mihomo/. /etc/nikki
		rm -rf /etc/mihomo
	fi
	service nikki restart
}

if [ -x "/bin/opkg" ]; then
	if (opkg list-installed | grep -q mihomo); then
		opkg remove luci-i18n-mihomo-zh-cn
		opkg remove luci-app-mihomo
		opkg remove mihomo
	fi
	if (! opkg list-installed | grep -q nikki); then
		curl -s -L https://github.com/antifragile0/OpenWrt-nikki-Mod/raw/refs/heads/main/install.sh | ash
	fi
	migrate
	if (grep -q mihomo /etc/opkg/customfeeds.conf); then
		sed -i '/mihomo/d' /etc/opkg/customfeeds.conf
		curl -s -L https://github.com/antifragile0/OpenWrt-nikki-Mod/raw/refs/heads/main/feed.sh | ash
	fi
elif [ -x "/usr/bin/apk" ]; then
	if (apk list -I | grep -q mihomo); then
		apk del luci-i18n-mihomo-zh-cn
		apk del luci-app-mihomo
		apk del mihomo
	fi
	if (apk list -I | grep -q nikki); then
		curl -s -L https://github.com/antifragile0/OpenWrt-nikki-Mod/raw/refs/heads/main/install.sh | ash
	fi
	migrate
	if (grep -q mihomo /etc/apk/repositories.d/customfeeds.list); then
		sed -i '/mihomo/d' /etc/apk/repositories.d/customfeeds.list
		curl -s -L https://github.com/antifragile0/OpenWrt-nikki-Mod/raw/refs/heads/main/feed.sh | ash
	fi
fi
