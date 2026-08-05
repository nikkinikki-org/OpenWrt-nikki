include $(TOPDIR)/rules.mk

PKG_NAME:=mihomo-alpha
PKG_VERSION:=2026.08.05~e9f6297

PKG_SOURCE:=$(PKG_NAME)-$(PKG_VERSION).tar.gz
PKG_SOURCE_SUBDIR:=$(PKG_NAME)-$(PKG_VERSION)
PKG_SOURCE_PROTO:=git
PKG_SOURCE_URL:=https://github.com/MetaCubeX/mihomo.git
PKG_SOURCE_VERSION:=e9f62979ffb1543d3c8f02b94055c03d8f1d5771
PKG_MIRROR_HASH:=600e699812ad5b14bd71fb98c9780b644020bf3937028c00b1a47f5006f081e2

PKG_BUILD_VERSION:=alpha-e9f6297

include $(CURDIR)/../common.mk

define Package/mihomo-alpha
  $(call Package/mihomo/Default)
  TITLE+= (Alpha)
  VARIANT:=alpha
  ALTERNATIVES:=\
    300:/usr/bin/mihomo:/usr/libexec/mihomo-alpha
endef

define Package/mihomo-alpha/description
  $(call Package/mihomo/description/Default)
endef

define Package/mihomo-alpha/install
	$(call Package/mihomo/install/Default,$(1))
endef

$(eval $(call GoBinPackage,mihomo-alpha))
$(eval $(call BuildPackage,mihomo-alpha))
