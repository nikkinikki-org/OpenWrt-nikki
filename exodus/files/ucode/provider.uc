#!/usr/bin/ucode

'use strict';

import { readfile } from 'fs';

// what the provider tells about the profile in the headers, as json: title, announce, support link, logo and the update interval in hours
// ARGV: the headers of the subscription, the headers of the info url, the hash of the source the file was downloaded from
// the subscription headers win, the info url may carry them instead; base64: values are decoded, links are http(s) or tg

// value of a header in a curl -D dump, the last response wins after redirects, name is in lower case
function header_value(path, name) {
	let value = '';
	for (let line in split(readfile(path) ?? '', '\n')) {
		line = rtrim(line, '\r');
		if (index(line, 'HTTP/') == 0) {
			value = '';
			continue;
		}
		const i = index(line, ':');
		if (i > 0 && lc(substr(line, 0, i)) == name) {
			value = ltrim(substr(line, i + 1), ' \t');
		}
	}
	return value;
}

function pick(name) {
	const value = header_value(ARGV[0], name);
	return value != '' ? value : header_value(ARGV[1], name);
}

function decode(value) {
	return index(value, 'base64:') == 0 ? (b64dec(substr(value, 7)) ?? '') : value;
}

// control characters are dropped, the announce keeps line breaks
function text(value, newlines) {
	return join('', filter(split(value, ''), (c) => ord(c) >= 32 || (newlines && c == '\n')));
}

// the first n characters of utf-8, a character is not cut in half
function cut(value, n) {
	let chars = 0;
	for (let i = 0; i < length(value); i++) {
		if ((ord(value, i) & 0xC0) != 0x80 && ++chars > n) {
			return substr(value, 0, i);
		}
	}
	return value;
}

function safe_url(value, schemes) {
	for (let scheme in schemes) {
		if (index(value, scheme) == 0) {
			return value;
		}
	}
	return '';
}

const hours = pick('profile-update-interval');

const meta = {
	title: cut(text(decode(pick('profile-title')), false), 128),
	announce: cut(text(decode(pick('announce')), true), 2000),
	support_url: safe_url(text(decode(pick('support-url')), false), ['https://', 'http://', 'tg://']),
	logo: safe_url(text(decode(pick('profile-logo')), false), ['https://', 'http://', 'data:image/']),
	interval: match(hours, /^[0-9]+$/) && int(hours) > 0 ? int(hours) : null,
	source: ARGV[2] ?? ''
};

for (let key in keys(meta)) {
	if (meta[key] == null || meta[key] == '') {
		delete meta[key];
	}
}

printf('%J\n', meta);
