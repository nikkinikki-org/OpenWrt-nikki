include $(TOPDIR)/rules.mk

PKG_NAME:=mihomo-alpha
PKG_VERSION:=2026.04.10

PKG_SOURCE:=$(PKG_NAME)-$(PKG_VERSION).tar.gz
PKG_SOURCE_SUBDIR:=$(PKG_NAME)-$(PKG_VERSION)
PKG_SOURCE_PROTO:=git
PKG_SOURCE_URL:=https://github.com/MetaCubeX/mihomo.git
PKG_SOURCE_VERSION:=fa081fb16c010d535656f467d0cd9b8000eb14af
PKG_MIRROR_HASH:=9e50c5aa65860732fa12577f552843373bec7a76e32a6034e6f0edb47f4d6249

PKG_LICENSE:=GPL3.0+
PKG_MAINTAINER:=Joseph Mory <morytyann@gmail.com>

PKG_BUILD_DEPENDS:=golang/host
PKG_BUILD_PARALLEL:=1
PKG_BUILD_FLAGS:=no-mips16

PKG_BUILD_VERSION:=alpha-fa081fb1
PKG_BUILD_TIME:=$(shell date -u -Iseconds)

GO_PKG:=github.com/metacubex/mihomo
GO_PKG_LDFLAGS_X:=$(GO_PKG)/constant.Version=$(PKG_BUILD_VERSION) $(GO_PKG)/constant.BuildTime=$(PKG_BUILD_TIME)
GO_PKG_TAGS:=with_gvisor
GO_PKG_INSTALL_BIN_PATH:=/usr/libexec

include $(INCLUDE_DIR)/package.mk
include $(TOPDIR)/feeds/packages/lang/golang/golang-package.mk

define Package/mihomo-alpha
  SECTION:=net
  CATEGORY:=Network
  TITLE:=A rule based proxy in Go.
  URL:=https://wiki.metacubex.one
  DEPENDS:=$(GO_ARCH_DEPENDS) +ca-bundle +ip-full +kmod-inet-diag +kmod-tun
  PROVIDES:=mihomo
  CONFLICTS:=mihomo-meta
  VARIANT:=alpha
  ALTERNATIVES:=\
    300:/usr/bin/mihomo:/usr/libexec/mihomo
endef

define Package/mihomo-alpha/description
  A rule based proxy in Go.
endef

define Package/mihomo-alpha/install
	$(call GoPackage/Package/Install/Bin,$(1))
endef

define Build/Prepare
	$(Build/Prepare/Default)
	$(RM) -r $(PKG_BUILD_DIR)/rules/logic_test
endef

$(eval $(call GoBinPackage,mihomo-alpha))
$(eval $(call BuildPackage,mihomo-alpha))
