![GitHub License](https://img.shields.io/github/license/prettyleaf/openwrt-exodus?style=for-the-badge&logo=github) ![GitHub Tag](https://img.shields.io/github/v/release/prettyleaf/openwrt-exodus?style=for-the-badge&logo=github) ![GitHub Downloads (all assets, all releases)](https://img.shields.io/github/downloads/prettyleaf/openwrt-exodus/total?style=for-the-badge&logo=github)

中文 | [English](README.md)
[Wiki](https://github.com/prettyleaf/OpenWrt-exodus/wiki)

# Exodus

在 OpenWrt 上使用 Mihomo 进行透明代理。[OpenWrt-nikki](https://github.com/nikkinikki-org/OpenWrt-nikki) 的分支。

## 环境要求

- OpenWrt >= 24.10
- Linux Kernel >= 5.13
- firewall4

## 功能

- 透明代理 (Redirect/TPROXY/TUN, IPv4 和/或 IPv6)，默认 TCP Redirect + UDP TPROXY
- 官方 Mihomo 内核：`mihomo-meta` 打包 [MetaCubeX 发行版](https://github.com/MetaCubeX/mihomo/releases) 中的预编译二进制文件，并校验 sha256
- 安装时选择内核：稳定版 Mihomo Meta、Mihomo Alpha 或 [Prizrak-Core](https://github.com/legiz-ru/Prizrak-Core)
- 运营商屏蔽 GitHub 时，可通过自建的 [gh-proxy](https://github.com/prettyleaf/gh-proxy) 安装
- 按设备选择代理：代理除所选设备外的所有设备，或仅代理所选设备
- 订阅 HWID 请求头，默认启用
- 订阅提供商的响应头：`profile-title` 作为订阅名称，`announce` 和 `support-url` 显示在状态页，`profile-logo` 显示在订阅旁
- 按提供商的 `profile-update-interval` 或自定义间隔自动更新订阅，正在使用的订阅通过重载服务生效
- 配置文件混入
- 配置文件编辑器
- 定时重启

## 安装和更新

软件包为 `exodus`、`luci-app-exodus` 和 `luci-i18n-exodus-*`。如果已安装 `nikki` / `luci-app-nikki`，安装脚本会替换它们并保留配置、配置文件和订阅（两者共用，配置仍位于 `/etc/config/nikki`）。

```shell
wget -O - https://raw.githubusercontent.com/prettyleaf/openwrt-exodus/main/install.sh | ash
```

安装脚本首先检查路由器能否从 GitHub 下载，然后询问要安装哪个[内核](https://github.com/prettyleaf/OpenWrt-exodus/wiki#core)。运行参数[可以](https://github.com/prettyleaf/OpenWrt-exodus/wiki#install--update)以环境变量的形式写在 `ash` 之前。

```shell
wget -O - https://raw.githubusercontent.com/prettyleaf/openwrt-exodus/main/install.sh | VERSION=v1.26.1 CORE=alpha ash
```

已安装的软件包也可以在 LuCI 中更新：`服务 → Exodus → 更新`。该页面使用上次选择的内核和 gh-proxy 运行同一个安装脚本。闪存空间较小的路由器请在该页面启用低空间模式，它会在安装新内核之前删除当前内核。

## 卸载并重置

```shell
wget -O - https://raw.githubusercontent.com/prettyleaf/openwrt-exodus/main/uninstall.sh | ash
```

## 如何使用

1. 在 LuCI 中打开 `服务 → Exodus → 配置文件` 并添加订阅。
2. 在 `服务 → Exodus → 应用配置` 中选择订阅、启用应用，并选择哪些设备走代理。
3. 其他设置都在 `高级` 页面中，如果不清楚其作用请不要修改。

服务运行时，主页面上 `重启服务` 旁边的 `打开面板` 按钮可以打开面板。内核会在首次启动时下载面板（默认为 [Zashboard](https://github.com/Zephyruso/zashboard)，见 `高级 → 外部控制配置`）。

## 如何工作

1. 混入并更新配置文件。
2. 启动 Mihomo。
3. 设置定时重启。
4. 配置 IP 规则/路由。
5. 生成防火墙配置并应用。

注意上述步骤可能因配置而变动。

## 编译

```shell
# 添加源
echo "src-git exodus https://github.com/prettyleaf/openwrt-exodus.git;main" >> "feeds.conf.default"
# 更新并安装源
./scripts/feeds update -a
./scripts/feeds install -a
# 编译
make package/luci-app-exodus/compile
```

编译结果可以在`bin/packages/your_architecture/exodus`内找到。

## 依赖

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

## 特别感谢

- [OpenWrt-nikki](https://github.com/nikkinikki-org/OpenWrt-nikki) 及其[贡献者](https://github.com/nikkinikki-org/OpenWrt-nikki/graphs/contributors)
- [Prizrak-core](https://github.com/legiz-ru/Prizrak-Core/releases) 及其[贡献者](https://github.com/legiz-ru/Prizrak-Core/graphs/contributors)
- [@ApoisL](https://github.com/apoiston)
- [@xishang0128](https://github.com/xishang0128)
