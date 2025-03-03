![GitHub License](https://img.shields.io/github/license/morytyann/OpenWrt-nikki?style=for-the-badge&logo=github) 
![GitHub Tag](https://img.shields.io/github/v/release/antifragile0/OpenWrt-nikki-Mod?style=for-the-badge&logo=github) 
![GitHub Downloads (all assets, all releases)](https://img.shields.io/github/downloads/antifragile0/OpenWrt-nikki-Mod/total?style=for-the-badge&logo=github) 
![GitHub Repo stars](https://img.shields.io/github/stars/antifragile0/OpenWrt-nikki-Mod?style=for-the-badge&logo=github) 
[![Telegram](https://img.shields.io/badge/Contact-Telegram-26A5E4?style=for-the-badge&logo=telegram)](https://t.me/RizkiKotet)

# Nikki (formerly MihomoTProxy) Mod

Transparent Proxy with Mihomo on OpenWrt.

## Prerequisites

- OpenWrt >= 23.05
- Linux Kernel >= 5.10
- firewall4

## Feature

- Transparent Proxy (TPROXY/TUN, IPv4 and/or IPv6)
- Access Control
- Profile Mixin
- Profile Editor
- Scheduled Restart

## Install & Update

### A. Install From Feed (Recommended)

1. Add Feed

```shell
# only needs to be run once
curl -s -L https://github.com/antifragile0/OpenWrt-nikki-Mod/raw/refs/heads/main/feed.sh | ash
```

2. Install

```shell
# you can install from shell or `Software` menu in LuCI
# for opkg
opkg install nikki
opkg install luci-app-nikki
opkg install luci-i18n-nikki-zh-cn
# for apk
apk add --allow-untrusted nikki
apk add --allow-untrusted luci-app-nikki
apk add --allow-untrusted luci-i18n-nikki-zh-cn
```

### B. Install From Release

```shell
bash -c "$(curl -fsSL 'https://github.com/antifragile0/OpenWrt-nikki-Mod/raw/refs/heads/main/install.sh')"
```

## How To Use

See [Wiki](https://github.com/antifragile0/OpenWrt-nikki/wiki)

## How does it work

1. Mixin and Update profile.
2. Run mihomo.
3. Run hijack prepare script.
4. Set router hijack.
5. Set lan hijack with access control.
6. Set scheduled restart.

Note that the steps above may change base on config.

## Compilation

```shell
# add feed
echo "src-git nikki https://github.com/antifragile0/OpenWrt-nikki-Mod.git;main" >> "feeds.conf.default"
# update & install feeds
./scripts/feeds update -a
./scripts/feeds install -a
# make package
make package/luci-app-nikki/compile
```

The ipk/apk file will be found under `bin/packages/your_architecture/nikki`.

## Dependencies

- ca-bundle
- curl
- yq
- firewall4
- ip-full
- kmod-inet-diag
- kmod-nft-tproxy
- kmod-tun

## Contributors

[![Contributors](https://contrib.rocks/image?repo=nikkinikki-org/OpenWrt-nikki)](https://github.com/nikkinikki-org/OpenWrt-nikki/graphs/contributors)

## Special Thanks

- [@ApoisL](https://github.com/apoiston)
- [@xishang0128](https://github.com/xishang0128)
