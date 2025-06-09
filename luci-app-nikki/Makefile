include $(TOPDIR)/rules.mk

PKG_VERSION:=1.22.4

LUCI_TITLE:=LuCI Support for nikki
LUCI_DEPENDS:=+luci-base +nikki

define Package/$(PKG_NAME)/install
	$(INSTALL_DIR) $(1)/etc/nikki/run
	$(CP) ./root/etc/nikki/run/* $(1)/etc/nikki/run/
endef

include $(TOPDIR)/feeds/luci/luci.mk

# call BuildPackage - OpenWrt buildroot signature