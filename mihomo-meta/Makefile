include $(TOPDIR)/rules.mk

PKG_NAME:=mihomo-meta
PKG_VERSION:=1.19.29

PKG_SOURCE:=$(PKG_NAME)-$(PKG_VERSION).tar.gz
PKG_SOURCE_SUBDIR:=$(PKG_NAME)-$(PKG_VERSION)
PKG_SOURCE_PROTO:=git
PKG_SOURCE_URL:=https://github.com/MetaCubeX/mihomo.git
PKG_SOURCE_VERSION:=v1.19.29
PKG_MIRROR_HASH:=0066917d743a48751f4d3bae7af9ad4729595869401fe1544f22bdd88ee9de21

PKG_BUILD_VERSION:=v1.19.29

include $(CURDIR)/../common.mk

define Package/mihomo-meta
  $(call Package/mihomo/Default)
  VARIANT:=meta
  DEFAULT_VARIANT:=1
  ALTERNATIVES:=\
    200:/usr/bin/mihomo:/usr/libexec/mihomo-meta
endef

define Package/mihomo-meta/description
  $(call Package/mihomo/description/Default)
endef

define Package/mihomo-meta/install
	$(call Package/mihomo/install/Default,$(1))
endef

$(eval $(call GoBinPackage,mihomo-meta))
$(eval $(call BuildPackage,mihomo-meta))
