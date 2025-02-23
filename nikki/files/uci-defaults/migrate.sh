#!/bin/sh

. "$IPKG_INSTROOT/etc/nikki/scripts/include.sh"

# since v1.18.0

mixin_rule=$(uci -q get nikki.mixin.rule); [ -z "$mixin_rule" ] && uci set nikki.mixin.rule=0

mixin_rule_provider=$(uci -q get nikki.mixin.rule_provider); [ -z "$mixin_rule_provider" ] && uci set nikki.mixin.rule_provider=0

# since v1.19.0

mixin_ui_path=$(uci -q get nikki.mixin.ui_path); [ -z "$mixin_ui_path" ] && uci set nikki.mixin.ui_path=ui

uci show nikki | grep -E 'nikki.@rule\[[[:digit:]]+\]=rule' | sed 's/nikki.@rule\[\([[:digit:]]\+\)\]=rule/rename nikki.@rule[\1].match=matcher/' | uci batch

# commit
uci commit nikki

# exit with 0
exit 0
