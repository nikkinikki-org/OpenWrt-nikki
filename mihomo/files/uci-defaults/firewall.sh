#!/bin/sh

. "$IPKG_INSTROOT/etc/mihomo/scripts/include.sh"

uci -q batch <<-EOF > /dev/null
	del firewall.mihomo
	set firewall.mihomo=include
	set firewall.mihomo.type=script
	set firewall.mihomo.path=$FIREWALL_INCLUDE_SH
	set firewall.mihomo.fw4_compatible=1
	commit firewall
EOF
