![GitHub License](https://img.shields.io/github/license/prettyleaf/openwrt-exodus?style=for-the-badge&logo=github) ![GitHub Tag](https://img.shields.io/github/v/release/prettyleaf/openwrt-exodus?style=for-the-badge&logo=github) ![GitHub Downloads (all assets, all releases)](https://img.shields.io/github/downloads/prettyleaf/openwrt-exodus/total?style=for-the-badge&logo=github)

English | [中文](README.zh.md)
[Wiki](https://github.com/prettyleaf/OpenWrt-exodus/wiki)

# Exodus

Transparent Proxy with Mihomo on OpenWrt. Fork of [OpenWrt-nikki](https://github.com/nikkinikki-org/OpenWrt-nikki).

## Prerequisites

- OpenWrt >= 24.10
- Linux Kernel >= 5.13
- firewall4

## Feature

- Transparent Proxy (Redirect/TPROXY/TUN, IPv4 and/or IPv6), TCP Redirect + UDP TPROXY by default
- Official Mihomo core: `mihomo-meta` packages the prebuilt binary from [MetaCubeX releases](https://github.com/MetaCubeX/mihomo/releases), verified by sha256
- Choice of the core in the installer: stable Mihomo Meta, Mihomo Alpha or [Prizrak-Core](https://github.com/legiz-ru/Prizrak-Core)
- Installation through your own [gh-proxy](https://github.com/prettyleaf/gh-proxy) when GitHub is blocked by the provider
- Per-device proxy selection: proxy everyone except the selected devices, or only the selected devices
- HWID headers for subscriptions, enabled by default
- Provider headers of subscriptions: `profile-title` names the subscription, `announce` and `support-url` are shown on the status page, `profile-logo` next to the subscription
- Subscription auto update by `profile-update-interval` of the provider or your own interval, the subscription in use is applied with a service reload
- Profile Mixin
- Profile Editor
- Scheduled Restart

## Install & Update

The packages are `exodus`, `luci-app-exodus` and `luci-i18n-exodus-*`. If `nikki` / `luci-app-nikki` are installed, the installer replaces them and keeps the config, profiles and subscriptions (they are shared, the config stays at `/etc/config/nikki`).

```shell
wget -O - https://raw.githubusercontent.com/prettyleaf/openwrt-exodus/main/install.sh | ash
```

The installer first checks that the router can download from GitHub, then asks which [core](https://github.com/prettyleaf/OpenWrt-exodus/wiki#core) to install. Settings for a run [can be](https://github.com/prettyleaf/OpenWrt-exodus/wiki#install--update) passed as environment variables before `ash`.

```shell
wget -O - https://raw.githubusercontent.com/prettyleaf/openwrt-exodus/main/install.sh | VERSION=v1.26.1 CORE=alpha ash
```

Installed packages can also be updated from LuCI: `Services → Exodus → Update`. It runs the same installer with the core and the gh-proxy chosen last time. On routers with little free flash enable the low flash space mode there, it removes the current core before installing the new one.

## Uninstall & Reset

```shell
wget -O - https://raw.githubusercontent.com/prettyleaf/openwrt-exodus/main/uninstall.sh | ash
```

## How To Use

1. Open `Services → Exodus → Profile` in LuCI and add your subscription.
2. On `Services → Exodus → App Config` choose the subscription, enable the app and choose which devices go through the proxy.
3. Everything else is on the `Advanced` page. Do not change it unless you know what you are doing.

When the service is running, `Open Dashboard` next to `Restart Service` on the main page opens the dashboard. The core downloads it on the first start ([Zashboard](https://github.com/Zephyruso/zashboard) by default, see `Advanced → External Control Config`).

## How does it work

1. Mixin and Update profile.
2. Run mihomo.
3. Set scheduled restart.
4. Set ip rule/route
5. Generate nftables and apply it.

Note that the steps above may change base on config.

## Compilation

```shell
# add feed
echo "src-git exodus https://github.com/prettyleaf/openwrt-exodus.git;main" >> "feeds.conf.default"
# update & install feeds
./scripts/feeds update -a
./scripts/feeds install -a
# make package
make package/luci-app-exodus/compile
```

The package files will be found under `bin/packages/your_architecture/exodus`.

## Dependencies

- ca-bundle
- curl
- yq
- firewall4
- ip-full
- kmod-inet-diag
- kmod-nft-socket
- kmod-nft-tproxy
- kmod-tun
- kmod-dummy

## Special Thanks

- [OpenWrt-nikki](https://github.com/nikkinikki-org/OpenWrt-nikki) and its [contributors](https://github.com/nikkinikki-org/OpenWrt-nikki/graphs/contributors)
- [Prizrak-core](https://github.com/legiz-ru/Prizrak-Core/releases) and its [contributors](https://github.com/legiz-ru/Prizrak-Core/graphs/contributors)
- [@ApoisL](https://github.com/apoiston)
- [@xishang0128](https://github.com/xishang0128)
