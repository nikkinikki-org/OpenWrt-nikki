#!/bin/sh

echo \
"
# Nikki Debug Info
## system
\`\`\`shell
$(cat /etc/openwrt_release)
\`\`\`
## kernel
\`\`\`
$(uname -a)
\`\`\`
## application
\`\`\`
`
if [ -x "/bin/opkg" ]; then
	opkg list-installed "nikki"
	opkg list-installed "luci-app-nikki"
elif [ -x "/usr/bin/apk" ]; then
	apk list -I "nikki"
	apk list -I "luci-app-nikki"
fi
`
\`\`\`
## config
\`\`\`
$(uci show nikki)
\`\`\`
## profile
\`\`\`yaml
$(cat /etc/nikki/run/config.yaml)
\`\`\`
## ip rule
\`\`\`
$(ip rule list)
\`\`\`
## ip route
\`\`\`
TPROXY: 
$(ip route list table 80)

TUN: 
$(ip route list table 81)
\`\`\`
## ip6 rule
\`\`\`
$(ip -6 rule list)
\`\`\`
## ip6 route
\`\`\`
TPROXY: 
$(ip -6 route list table 80)
TUN: 
$(ip -6 route list table 81)
\`\`\`
## nftables
\`\`\`
$(nft list ruleset)
\`\`\`
## service
\`\`\`json
$(service nikki info)
\`\`\`
## process
\`\`\`
$(ps | grep mihomo)
\`\`\`
## netstat
\`\`\`
$(netstat -nalp | grep mihomo)
\`\`\`
"
