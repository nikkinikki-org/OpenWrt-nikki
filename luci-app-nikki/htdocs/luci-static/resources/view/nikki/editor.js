'use strict';
'require form';
'require view';
'require uci';
'require fs';
'require dom';
'require ui';
'require tools.nikki as nikki';

/*
 * Dynamically load ace.js straight from a CDN (the client's browser
 * fetches it itself; the router doesn't need to store/serve anything).
 * Bump the version below whenever you want to update it.
 */
var ACE_VERSION = '1.43.3';
var ACE_CDN_BASE = 'https://cdnjs.cloudflare.com/ajax/libs/ace/' + ACE_VERSION + '/';

function loadScript(url) {
	return new Promise(function (resolve, reject) {
		if (document.querySelector('script[src="' + url + '"]')) {
			resolve();
			return;
		}
		var s = E('script', { src: url, type: 'text/javascript', crossorigin: 'anonymous' });
		s.onload = function () { resolve(); };
		s.onerror = function () { reject(new Error('Failed to load ' + url)); };
		document.head.appendChild(s);
	});
}

/*
 * Never rejects: if the CDN is unreachable (client has no internet,
 * CSP blocks it, etc.), it quietly resolves to false and the widget
 * just stays a plain textarea with no syntax highlighting.
 */
function loadAce() {
	if (window.ace)
		return Promise.resolve(true);

	return loadScript(ACE_CDN_BASE + 'ace.min.js').then(function () {
		return Promise.all([
			loadScript(ACE_CDN_BASE + 'mode-yaml.js'),
			loadScript(ACE_CDN_BASE + 'theme-tomorrow_night.js'),
		]);
	}).then(function () {
		return true;
	}).catch(function (err) {
		console.warn('[nikki] ACE editor unavailable, falling back to plain textarea:', err);
		return false;
	});
}

/*
 * CBI widget: a textarea with an ACE editor overlaid on top of it.
 * Defined locally in this file (rather than in a separate require
 * module) to avoid the form.TextValue base-class resolution issues
 * that show up when it's compiled as a standalone module.
 */
var CBIAceValue = form.TextValue.extend({
	__init__: function () {
		this.super('__init__', arguments);
		this.mode = 'ace/mode/yaml';
		this.theme = 'ace/theme/tomorrow_night';
	},

	renderWidget: function (section_id, option_index, cfgvalue) {
		var node = this.super('renderWidget', [section_id, option_index, cfgvalue]);

		// find the actual <textarea> inside the rendered node
		var textarea = (node.tagName === 'TEXTAREA') ? node : node.querySelector('textarea');
		if (!textarea)
			return node;

		var height = (this.rows ? this.rows * 20 : 500) + 'px';

		var editorContainer = E('div', {
			'id': (textarea.id || this.cbid(section_id)) + '-ace',
			'style': 'width:100%; height:' + height + ';'
		});

		textarea.style.display = 'none';

		// IMPORTANT: keep the original `node` in the tree as-is (don't move
		// the textarea out of it or discard it). LuCI binds the ui.Textarea
		// class instance to `node`, and getUIElement()/setValue() rely on
		// finding it there via its `id`. We just place the ACE container
		// next to it inside a wrapper.
		var wrapper = E('div', { 'class': 'cbi-ace-wrapper' }, [node, editorContainer]);

		var self = this;

		loadAce().then(function (available) {
			if (!available) {
				// ACE failed to load — keep the plain textarea visible
				// and drop the now-empty container.
				textarea.style.display = '';
				editorContainer.remove();
				return;
			}

			var editor = window.ace.edit(editorContainer, {
				value: textarea.value || '',
				mode: self.mode,
				theme: self.theme,
				fontSize: '13px',
				useWorker: false,
				wrap: false,
			});

			// ACE -> textarea
			editor.session.on('change', function () {
				if (textarea.value === editor.getValue())
					return;
				textarea.value = editor.getValue();
				textarea.dispatchEvent(new Event('input', { bubbles: true }));
				textarea.dispatchEvent(new Event('change', { bubbles: true }));
			});

			// keep a reference around, useful for cleanup/resize
			editorContainer._aceInstance = editor;

			// textarea.setValue(...) -> ACE
			// getUIElement(section_id).setValue(...) in LuCI resolves via
			// dom.findClassInstance(node), so that's the instance we patch.
			// The instance may be bound to the textarea itself or to the
			// wrapping `node` ui.Textarea created, depending on LuCI version,
			// so try both.
			var classInstance = dom.findClassInstance(textarea) || dom.findClassInstance(node);
			if (classInstance && typeof classInstance.setValue === 'function' && !classInstance._aceWrapped) {
				var originalSetValue = classInstance.setValue.bind(classInstance);
				classInstance.setValue = function (value) {
					originalSetValue(value);
					if (editor.getValue() !== (value || ''))
						editor.setValue(value || '', -1);
				};
				classInstance._aceWrapped = true;
			}
		});

		return wrapper;
	}
});

return view.extend({
	load: function () {
		return Promise.all([
			uci.load('nikki'),
			nikki.listProfiles(),
			nikki.listRuleProviders(),
			nikki.listProxyProviders(),
			loadAce(),
		]);
	},
	render: function (data) {
		const subscriptions = uci.sections('nikki', 'subscription');
		const profiles = data[1];
		const ruleProviders = data[2];
		const proxyProviders = data[3];

		let m, s, o;

		m = new form.Map('nikki');

		s = m.section(form.NamedSection, 'editor', 'editor', _('Editor'));

		o = s.option(form.ListValue, '_file', _('Choose File'));
		o.optional = true;

		for (const profile of profiles) {
			o.value(nikki.profilesDir + '/' + profile.name, _('File:') + profile.name);
		};

		for (const subscription of subscriptions) {
			o.value(nikki.subscriptionsDir + '/' + subscription['.name'] + '.yaml', _('Subscription:') + subscription.name);
		};

		for (const ruleProvider of ruleProviders) {
			o.value(nikki.ruleProvidersDir + '/' + ruleProvider.name, _('Rule Provider:') + ruleProvider.name);
		};

		for (const proxyProvider of proxyProviders) {
			o.value(nikki.proxyProvidersDir + '/' + proxyProvider.name, _('Proxy Provider:') + proxyProvider.name);
		};

		o.value(nikki.mixinFilePath, _('File for Mixin'));
		o.value(nikki.runProfilePath, _('Profile for Startup'));

		o.write = function (section_id, formvalue) {
			return true;
		};
		o.onchange = function (event, section_id, value) {
			return L.resolveDefault(fs.read_direct(value), '').then(function (content) {
				var uiElement = m.lookupOption('_file_content', section_id)[0].getUIElement(section_id);
				if (uiElement)
					uiElement.setValue(content);
			});
		};

		o = s.option(CBIAceValue, '_file_content',);
		o.rows = 25;
		o.wrap = false;
		o.write = function (section_id, formvalue) {
			const path = m.lookupOption('_file', section_id)[0].formvalue(section_id);
            return nikki.writefile(path, formvalue);
		};
		o.remove = function (section_id) {
			const path = m.lookupOption('_file', section_id)[0].formvalue(section_id);
            return nikki.writefile(path);
		};

		return m.render();
	},
	handleSaveApply: function (ev, mode) {
		return this.handleSave(ev).finally(function () {
			return mode === '0' ? nikki.reload() : nikki.restart();
		});
	},
	handleReset: null
});
