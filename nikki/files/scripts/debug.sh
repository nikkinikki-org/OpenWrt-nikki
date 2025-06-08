#!/bin/sh

. "$IPKG_INSTROOT/etc/nikki/scripts/include.sh"

enabled=`uci get nikki.config.enabled`

if [ "$enabled" == "0" ]; then
	uci set nikki.config.enabled=1
	uci commit nikki
	/etc/init.d/nikki restart
fi

echo \
"
# Nikki Debug Info
## system
\`\`\`shell
`
cat /etc/openwrt_release
`
\`\`\`
## kernel
\`\`\`
`
uname -a
`
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
\`\`\`json
`
ucode -S -e '
import { cursor } from "uci";

const uci = cursor();

const config = uci.get_all("nikki");
const result = {};

for (let section_id in config) {
    const section = config[section_id];
    const section_type = section[".type"];
	if (result[section_type] == null) {
		result[section_type] = [];
	}
	push(result[section_type], section);
}
for (let section_type in result) {
	for (let section in result[section_type]) {
		delete section[".anonymous"];
		delete section[".type"];
		delete section[".name"];
		delete section[".index"];
	}
}
if (exists(result, "mixin")) {
	for (let x in result["mixin"]) {
		if (exists(x, "api_secret")) {
			x["api_secret"] = "*";
		}
	}
}
if (exists(result, "authentication")) {
	for (let x in result["authentication"]) {
		if (exists(x, "password")) {
			x["password"] = "*";
		}
	}
}
if (exists(result, "subscription")) {
	for (let x in result["subscription"]) {
		if (exists(x, "url")) {
			x["url"] = "*";
		}
	}
}
if (exists(result, "lan_access_control")) {
	for (let x in result["lan_access_control"]) {
		if (exists(x, "ip")) {
			for (let i = 0; i < length(x["ip"]); i++) {
				x["ip"][i] = "*";
			}
		}
		if (exists(x, "ip6")) {
			for (let i = 0; i < length(x["ip6"]); i++) {
				x["ip6"][i] = "*";
			}
		}
		if (exists(x, "mac")) {
			for (let i = 0; i < length(x["mac"]); i++) {
				x["mac"][i] = "*";
			}
		}
	}
}
delete result["status"];
delete result["editor"];
delete result["log"];
print(result);
'
`
\`\`\`
## profile
\`\`\`json
`
ucode -S -e '
import { popen } from "fs";

function desensitize_proxies(proxies) {
	for (let x in proxies) {
		if (exists(x, "server")) {
			x["server"] = "*";
		}
		if (exists(x, "servername")) {
			x["servername"] = "*";
		}
		if (exists(x, "sni")) {
			x["sni"] = "*";
		}
		if (exists(x, "port")) {
			x["port"] = "*";
		}
		if (exists(x, "ports")) {
			x["ports"] = "*";
		}
		if (exists(x, "port-range")) {
			x["port-range"] = "*";
		}
		if (exists(x, "uuid")) {
			x["uuid"] = "*";
		}
		if (exists(x, "private-key")) {
			x["private-key"] = "*";
		}
		if (exists(x, "public-key")) {
			x["public-key"] = "*";
		}
		if (exists(x, "token")) {
			x["token"] = "*";
		}
		if (exists(x, "username")) {
			x["username"] = "*";
		}
		if (exists(x, "password")) {
			x["password"] = "*";
		}
	}
}

function desensitize_profile() {
	let profile = {};
	const process = popen("yq -p yaml -o json /etc/nikki/run/config.yaml");
	if (process) {
		profile = json(process);
		if (exists(profile, "secret")) {
			profile["secret"] = "*";
		}
		if (exists(profile, "authentication")) {
			profile["authentication"] = [];
		}
		if (exists(profile, "proxy-providers")) {
			for (let x in profile["proxy-providers"]) {
				if (exists(profile["proxy-providers"][x], "url")) {
					profile["proxy-providers"][x]["url"] = "*";
				}
				if (exists(profile["proxy-providers"][x], "payload")) {
					desensitize_proxies(profile["proxy-providers"][x]["payload"]);
				}
			}
		}
		if (exists(profile, "proxies")) {
			desensitize_proxies(profile["proxies"]);
		}
		process.close();
	}
	return profile;
}

print(desensitize_profile());
'
`
\`\`\`
## ip rule
\`\`\`
`
ip rule list
`
\`\`\`
## ip route
\`\`\`
TPROXY: 
`
ip route list table "$TPROXY_ROUTE_TABLE"
`

TUN: 
`
ip route list table "$TUN_ROUTE_TABLE"
`
\`\`\`
## ip6 rule
\`\`\`
`
ip -6 rule list
`
\`\`\`
## ip6 route
\`\`\`
TPROXY: 
`
ip -6 route list table "$TPROXY_ROUTE_TABLE"
`

TUN: 
`
ip -6 route list table "$TUN_ROUTE_TABLE"
`
\`\`\`
## nftables
\`\`\`
`
nft list table inet nikki
`
\`\`\`
## service
\`\`\`json
`
/etc/init.d/nikki info
`
\`\`\`
"

if [ "$enabled" == "0" ]; then
	uci set nikki.config.enabled=0
	uci commit nikki
	/etc/init.d/nikki restart
fi
