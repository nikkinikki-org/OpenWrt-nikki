include $(TOPDIR)/rules.mk

PKG_NAME:=mihomo
PKG_RELEASE:=1

PKG_SOURCE_PROTO:=git
PKG_SOURCE_URL:=https://github.com/MetaCubeX/mihomo.git
PKG_SOURCE_DATE:=2025-01-07
PKG_SOURCE_VERSION:=c7661d7765fb62acbc6571e76f2922083b0b2b04
PKG_MIRROR_HASH:=1a306482c459557995dabbef2fa1007d00324095bc59165d939a97074e731c42

PKG_LICENSE:=MIT
PKG_MAINTAINER:=Joseph Mory <morytyann@gmail.com>

PKG_BUILD_DEPENDS:=golang/host
PKG_BUILD_PARALLEL:=1
PKG_BUILD_FLAGS:=no-mips16

PKG_BUILD_VERSION:=alpha-c7661d7
PKG_BUILD_TIME:=$(shell date -u -Iseconds)

GO_PKG:=github.com/metacubex/mihomo
GO_PKG_LDFLAGS_X:=$(GO_PKG)/constant.Version=$(PKG_BUILD_VERSION) $(GO_PKG)/constant.BuildTime=$(PKG_BUILD_TIME)
GO_PKG_TAGS:=with_gvisor

include $(INCLUDE_DIR)/package.mk
include $(TOPDIR)/feeds/packages/lang/golang/golang-package.mk

define Package/mihomo
  SECTION:=net
  CATEGORY:=Network
  TITLE:=A rule based proxy in Go.
  URL:=https://wiki.metacubex.one
  DEPENDS:=$(GO_ARCH_DEPENDS) +ca-bundle +curl +yq firewall4 +ip-full +kmod-inet-diag +kmod-nft-tproxy +kmod-tun
  USERID:=root:mihomo=7890
endef

define Package/mihomo/description
  A rule based proxy in Go.
endef

define Package/mihomo/conffiles
/etc/config/mihomo
/etc/mihomo/mixin.yaml
/etc/mihomo/nftables/reserved_ip.nft
/etc/mihomo/nftables/reserved_ip6.nft
endef

define Package/mihomo/install
	$(call GoPackage/Package/Install/Bin,$(1))

	$(INSTALL_DIR) $(1)/etc/mihomo
	$(INSTALL_DIR) $(1)/etc/mihomo/scripts
	$(INSTALL_DIR) $(1)/etc/mihomo/nftables
	$(INSTALL_DIR) $(1)/etc/mihomo/profiles
	$(INSTALL_DIR) $(1)/etc/mihomo/subscriptions
	$(INSTALL_DIR) $(1)/etc/mihomo/run
	$(INSTALL_DIR) $(1)/etc/mihomo/run/ui

	$(INSTALL_DATA) $(CURDIR)/files/mixin.yaml $(1)/etc/mihomo/mixin.yaml

	$(INSTALL_BIN) $(CURDIR)/files/scripts/include.sh $(1)/etc/mihomo/scripts/include.sh
	$(INSTALL_BIN) $(CURDIR)/files/scripts/firewall_include.sh $(1)/etc/mihomo/scripts/firewall_include.sh

	$(INSTALL_BIN) $(CURDIR)/files/nftables/hijack.nft $(1)/etc/mihomo/nftables/hijack.nft
	$(INSTALL_BIN) $(CURDIR)/files/nftables/reserved_ip.nft $(1)/etc/mihomo/nftables/reserved_ip.nft
	$(INSTALL_BIN) $(CURDIR)/files/nftables/reserved_ip6.nft $(1)/etc/mihomo/nftables/reserved_ip6.nft
	$(INSTALL_BIN) $(CURDIR)/files/nftables/geoip_cn.nft $(1)/etc/mihomo/nftables/geoip_cn.nft
	$(INSTALL_BIN) $(CURDIR)/files/nftables/geoip6_cn.nft $(1)/etc/mihomo/nftables/geoip6_cn.nft

	$(INSTALL_DIR) $(1)/etc/config
	$(INSTALL_CONF) $(CURDIR)/files/mihomo.conf $(1)/etc/config/mihomo

	$(INSTALL_DIR) $(1)/etc/init.d
	$(INSTALL_BIN) $(CURDIR)/files/mihomo.init $(1)/etc/init.d/mihomo

	$(INSTALL_DIR) $(1)/etc/uci-defaults
	$(INSTALL_BIN) $(CURDIR)/files/uci-defaults/firewall.sh $(1)/etc/uci-defaults/99_firewall_mihomo
	$(INSTALL_BIN) $(CURDIR)/files/uci-defaults/init.sh $(1)/etc/uci-defaults/99_init_mihomo
	$(INSTALL_BIN) $(CURDIR)/files/uci-defaults/migrate.sh $(1)/etc/uci-defaults/99_migrate_mihomo

	$(INSTALL_DIR) $(1)/lib/upgrade/keep.d
	$(INSTALL_DATA) $(CURDIR)/files/mihomo.upgrade $(1)/lib/upgrade/keep.d/mihomo
endef

define Package/mihomo/postrm
#!/bin/sh
if [ -z $${IPKG_INSTROOT} ]; then
	uci -q batch <<-EOF > /dev/null
		del firewall.mihomo
		commit firewall
	EOF
fi
endef

define Build/Prepare
	$(Build/Prepare/Default)
	$(RM) -r $(PKG_BUILD_DIR)/rules/logic_test
endef

$(eval $(call GoBinPackage,mihomo))
$(eval $(call BuildPackage,mihomo))
