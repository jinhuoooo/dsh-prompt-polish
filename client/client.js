window.__ModuleLoader__.load({ id: "dsh-prompt-polish", factory: (require) => {

	var module = { exports: {} };
	var exports = module.exports;
	Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
	var react = require("react");
	var react_jsx_runtime = require("react/jsx-runtime");

	//#region locales
	var zh = {
		button: "\u6da6\u8272",
		tooltip: "\u8c03\u7528 AI \u4f18\u5316\u63d0\u793a\u8bcd\uff0c\u8ba9\u8868\u8fbe\u66f4\u6e05\u6670",
		loading: "\u6da6\u8272\u4e2d\u2026",
		empty: "\u8bf7\u5148\u8f93\u5165\u5185\u5bb9",
		error: "\u6da6\u8272\u5931\u8d25\uff0c\u8bf7\u91cd\u8bd5",
		done: "\u5df2\u6da6\u8272",
		settingsNav: "\u6da6\u8272\u8bbe\u7f6e",
		setTitle: "\u63d0\u793a\u8bcd\u6da6\u8272",
		setSubtitle: "\u914d\u7f6e\u6da6\u8272\u529f\u80fd\u4f7f\u7528\u7684\u6a21\u578b API\u3002\u9ed8\u8ba4\u5f00\u7bb1\u5373\u7528\uff0c\u65e0\u9700\u914d\u7f6e\u3002",
		setEnabled: "\u542f\u7528 AI \u6da6\u8272",
		setProvider: "\u670d\u52a1\u5546",
		setApiKey: "API Key",
		setApiKeyPh: "\u672a\u8bbe\u7f6e\uff08\u4f7f\u7528\u5185\u7f6e\u9ed8\u8ba4\u914d\u7f6e\uff09",
		setModel: "\u6a21\u578b",
		setBaseURL: "\u63a5\u5165\u70b9 Base URL",
		setTemp: "\u521b\u9009\u6027\u6e29\u5ea6",
		setTimeout: "\u8d85\u65f6\uff08\u6beb\u79d2\uff09",
		setSharedEndpoint: "\u5171\u4eab\u4ee3\u7406\u5730\u5740",
		setWbAccess: "WB Access Key",
		setWbSecret: "WB Secret Key",
		setWbAgent: "\u667a\u80fd\u4f53 ID",
		setSave: "\u4fdd\u5b58",
		setSaving: "\u4fdd\u5b58\u4e2d\u2026",
		setSaved: "\u2713 \u5df2\u4fdd\u5b58\uff0c\u6539\u52a8\u5373\u65f6\u751f\u6548",
		setTest: "\u6d4b\u8bd5\u8fde\u63a5",
		setTesting: "\u6d4b\u8bd5\u4e2d\u2026",
		setTestOk: "\u6d4b\u8bd5\u901a\u8fc7",
		setLoadFail: "\u914d\u7f6e\u52a0\u8f7d\u5931\u8d25\uff0c\u8bf7\u5237\u65b0\u91cd\u8bd5",
		setSaveFail: "\u4fdd\u5b58\u5931\u8d25",
		prov_builtin: "\u5185\u7f6e\u9ed8\u8ba4\uff08\u667a\u8c31 GLM \u514d\u8d39\uff09",
		prov_shared: "\u5171\u4eab\u4ee3\u7406\uff08\u96f6\u914d\u7f6e\uff09",
		prov_workbuddy: "WorkBuddy \u5f00\u653e\u5e73\u53f0",
		prov_glm: "\u667a\u8c31 GLM\uff08\u514d\u8d39\uff09",
		prov_siliconflow: "SiliconFlow\uff08\u514d\u8d39\u989d\u5ea6\uff09",
		prov_hunyuan: "\u817e\u8baf\u6df7\u5143",
		prov_moonshot: "Moonshot",
		prov_zhipu: "\u667a\u8c31 GLM\uff08\u5176\u4ed6\uff09",
		prov_openai: "OpenAI",
		prov_custom: "\u81ea\u5b9a\u4e49\uff08OpenAI \u517c\u5bb9\uff09"
	};
	var en = {
		button: "Polish",
		tooltip: "Polish your prompt with AI",
		loading: "Polishing\u2026",
		empty: "Type something first",
		error: "Polish failed, please retry",
		done: "Polished",
		settingsNav: "Polish",
		setTitle: "Prompt Polish",
		setSubtitle: "Configure the model API used by the polish button. Works out of the box — no setup required.",
		setEnabled: "Enable AI polish",
		setProvider: "Provider",
		setApiKey: "API Key",
		setApiKeyPh: "Not set (using built-in default)",
		setModel: "Model",
		setBaseURL: "Base URL",
		setTemp: "Temperature",
		setTimeout: "Timeout (ms)",
		setSharedEndpoint: "Shared proxy endpoint",
		setWbAccess: "WB Access Key",
		setWbSecret: "WB Secret Key",
		setWbAgent: "Agent ID",
		setSave: "Save",
		setSaving: "Saving\u2026",
		setSaved: "\u2713 Saved, changes take effect immediately",
		setTest: "Test connection",
		setTesting: "Testing\u2026",
		setTestOk: "Test passed",
		setLoadFail: "Failed to load config, please refresh",
		setSaveFail: "Save failed",
		prov_builtin: "Built-in default (Zhipu GLM, free)",
		prov_shared: "Shared proxy (zero-config)",
		prov_workbuddy: "WorkBuddy Open Platform",
		prov_glm: "Zhipu GLM (free)",
		prov_siliconflow: "SiliconFlow (free tier)",
		prov_hunyuan: "Tencent Hunyuan",
		prov_moonshot: "Moonshot",
		prov_zhipu: "Zhipu GLM (other)",
		prov_openai: "OpenAI",
		prov_custom: "Custom (OpenAI-compatible)"
	};
	//#endregion

	//#region css
	var cssText = ".dpp-wrap{position:relative;display:grid;place-items:center}.dpp-btn{background:0 0;border:none;border-radius:999px;width:28px;height:28px;color:var(--dsw-alias-label-secondary);cursor:pointer;place-items:center;display:grid;flex:none;transition:background-color .15s,color .15s,opacity .15s}.dpp-btn:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover-solid);color:var(--dsw-alias-label-primary)}.dpp-btn:disabled{opacity:.4;cursor:default}.dpp-btn[data-loading=true]{opacity:.7;cursor:progress}.dpp-spin{animation:dpp-rot .6s linear infinite;transform-origin:center}@keyframes dpp-rot{to{transform:rotate(360deg)}}.dpp-toast{position:fixed;bottom:80px;left:50%;background:var(--dsw-alias-interactive-bg-hover-solid);color:var(--dsw-alias-label-primary);border-radius:8px;padding:6px 14px;font-size:13px;line-height:20px;pointer-events:none;z-index:9999;white-space:nowrap;animation:dpp-fade .15s ease-out;transform:translate(-50%,0)}@keyframes dpp-fade{from{opacity:0;transform:translate(-50%,4px)}to{opacity:1;transform:translate(-50%,0)}}.dpp-set{max-width:560px;display:flex;flex-direction:column;gap:18px}.dpp-set-head h3{margin:0;font-size:16px;font-weight:600;color:var(--dsw-alias-label-primary)}.dpp-set-head p{margin:4px 0 0;font-size:13px;line-height:20px;color:var(--dsw-alias-label-secondary)}.dpp-set-row{display:flex;flex-direction:column;gap:6px}.dpp-set-row>label{font-size:13px;font-weight:500;color:var(--dsw-alias-label-primary)}.dpp-set input,.dpp-set select{background:var(--dsw-alias-fill-input);border:1px solid var(--dsw-alias-separator);border-radius:8px;padding:7px 10px;font-size:13px;color:var(--dsw-alias-label-primary);outline:none;transition:border-color .15s}.dpp-set input:focus,.dpp-set select:focus{border-color:var(--dsw-alias-fill-primary)}.dpp-set input::placeholder{color:var(--dsw-alias-label-tertiary)}.dpp-set-check{display:flex;align-items:center;gap:8px;font-size:13px;color:var(--dsw-alias-label-primary)}.dpp-set-check input{width:auto}.dpp-set-actions{display:flex;gap:10px;align-items:center;padding-top:4px}.dpp-set-btn{border:none;border-radius:8px;padding:7px 16px;font-size:13px;font-weight:500;cursor:pointer;transition:opacity .15s}.dpp-set-btn:disabled{opacity:.5;cursor:default}.dpp-set-btn[data-kind=primary]{background:var(--dsw-alias-fill-primary);color:var(--dsw-alias-label-on-fill)}.dpp-set-btn[data-kind=plain]{background:var(--dsw-alias-interactive-bg-hover-solid);color:var(--dsw-alias-label-primary)}.dpp-set-msg{font-size:13px;line-height:20px;border-radius:8px;padding:8px 12px}.dpp-set-msg[data-ok=true]{background:rgba(52,199,89,.12);color:#248a3d}.dpp-set-msg[data-ok=false]{background:rgba(255,69,58,.1);color:#d70015}.dpp-set-msg code{font-family:ui-monospace,monospace;font-size:12px;word-break:break-all}.dpp-set-sample{margin:6px 0 0;font-size:12px;color:var(--dsw-alias-label-secondary);word-break:break-all}";
	var cssTag = "dsh-prompt-polish/client.css";
	if (typeof document !== "undefined" && !document.querySelector("style[data-plugin-css=" + JSON.stringify(cssTag) + "]")) {
		var s = document.createElement("style");
		s.dataset.plugin = "dsh-prompt-polish";
		s.dataset.pluginCss = cssTag;
		s.textContent = cssText;
		document.head.appendChild(s);
	}
	//#endregion

	//#region icons
	function IconSparkle() {
		return react_jsx_runtime.jsx("svg", {
			viewBox: "0 0 16 16",
			width: "15",
			height: "15",
			fill: "none",
			"aria-hidden": true,
			children: react_jsx_runtime.jsx("path", {
				d: "M8 1.2c.3 0 .56.18.67.46l1.5 3.9 3.9 1.5a.72.72 0 0 1 0 1.34l-3.9 1.5-1.5 3.9a.72.72 0 0 1-1.34 0l-1.5-3.9-3.9-1.5a.72.72 0 0 1 0-1.34l3.9-1.5 1.5-3.9A.72.72 0 0 1 8 1.2ZM12.5 9c.2 0 .37.12.44.31l.65 1.65 1.65.65a.48.48 0 0 1 0 .88l-1.65.65-.65 1.65a.48.48 0 0 1-.88 0l-.65-1.65-1.65-.65a.48.48 0 0 1 0-.88l1.65-.65.65-1.65A.48.48 0 0 1 12.5 9Z",
				fill: "currentColor"
			})
		});
	}
	function SpinnerIcon() {
		return react_jsx_runtime.jsx("svg", {
			viewBox: "0 0 16 16",
			width: "15",
			height: "15",
			fill: "none",
			"aria-hidden": true,
			className: "dpp-spin",
			children: react_jsx_runtime.jsx("path", {
				d: "M8 2.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11Zm0 1.5a4 4 0 1 1 0 8 4 4 0 0 1 0-8Z",
				fill: "currentColor",
				opacity: "0.2"
			})
		});
	}
	//#endregion

	//#region PromptPolishButton — one-click AI polish
	function PromptPolishButton(props) {
		var getDraft = props.getDraft;
		var setDraft = props.setDraft;
		var t = props.t;

		var loadingState = react.useState(false);
		var loading = loadingState[0];
		var setLoading = loadingState[1];

		var toastState = react.useState(null);
		var toast = toastState[0];
		var setToast = toastState[1];

		var toastTimer = react.useRef(0);

		var showToast = react.useCallback(function (text) {
			setToast(text);
			window.clearTimeout(toastTimer.current);
			toastTimer.current = window.setTimeout(function () {
				setToast(null);
			}, 2000);
		}, []);

		react.useEffect(function () {
			return function () {
				window.clearTimeout(toastTimer.current);
			};
		}, []);

		var handleClick = react.useCallback(function () {
			if (loading) return;
			var draft = typeof getDraft === "function" ? getDraft() : "";
			if (!draft || !draft.trim()) {
				showToast(t("empty"));
				return;
			}
			setLoading(true);
			fetch("/dsh-prompt-polish/optimize", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ text: draft })
			}).then(function (res) {
				if (!res.ok) throw new Error("HTTP " + res.status);
				return res.json();
			}).then(function (data) {
				if (data.optimized && typeof setDraft === "function") {
					setDraft(data.optimized);
					showToast(t("done"));
				} else if (data.error) {
					throw new Error(data.error);
				}
			}).catch(function () {
				showToast(t("error"));
			}).finally(function () {
				setLoading(false);
			});
		}, [loading, getDraft, setDraft, t, showToast]);

		var children = [
			react_jsx_runtime.jsx("button", {
				type: "button",
				className: "dpp-btn",
				"data-loading": loading ? "true" : "false",
				disabled: loading,
				"aria-label": t("button"),
				title: t("tooltip"),
				onClick: handleClick,
				children: loading ? react_jsx_runtime.jsx(SpinnerIcon, {}) : react_jsx_runtime.jsx(IconSparkle, {})
			}, "btn")
		];
		if (toast) {
			children.push(
				react_jsx_runtime.jsx("div", {
					className: "dpp-toast",
					children: toast
				}, "toast")
			);
		}
		return react_jsx_runtime.jsx(react.Fragment, { children: children });
	}
	//#endregion

	//#region PolishSettingsSection — settings page for model API config
	var PROVIDER_ORDER = ["builtin", "shared", "workbuddy", "glm", "siliconflow", "hunyuan", "moonshot", "zhipu", "openai", "custom"];

	function PolishSettingsSection(props) {
		var t = props.t;

		var loadedState = react.useState(false);
		var loaded = loadedState[0];
		var setLoaded = loadedState[1];

		var formState = react.useState({
			enabled: true,
			provider: "builtin",
			apiKey: "",
			model: "",
			baseURL: "",
			sharedEndpoint: "",
			temperature: "",
			timeoutMs: "",
			wbAccessKey: "",
			wbSecretKey: "",
			wbAgentId: ""
		});
		var form = formState[0];
		var setForm = formState[1];

		var msgState = react.useState(null);
		var msg = msgState[0];
		var setMsg = msgState[1];

		var busyState = react.useState(""); // "" | "save" | "test"
		var busy = busyState[0];
		var setBusy = busyState[1];

		var update = react.useCallback(function (field, value) {
			setForm(function (prev) {
				var next = {};
				for (var k in prev) next[k] = prev[k];
				next[field] = value;
				return next;
			});
			setMsg(null);
		}, []);

		react.useEffect(function () {
			fetch("/dsh-prompt-polish/config").then(function (res) {
				if (!res.ok) throw new Error("HTTP " + res.status);
				return res.json();
			}).then(function (data) {
				var api = (data && data.config && data.config.api) || {};
				var builtinModel = (data && data.builtin && data.builtin.model) || "";
				setForm(function (prev) {
					var next = {};
					for (var k in prev) next[k] = prev[k];
					next.enabled = api.enabled !== false;
					next.provider = api.provider || "builtin";
					next.apiKey = typeof api.apiKey === "string" ? api.apiKey : "";
					next.model = api.model || builtinModel;
					next.baseURL = api.baseURL || "";
					next.sharedEndpoint = api.sharedEndpoint || "";
					next.temperature = api.temperature !== undefined ? String(api.temperature) : "";
					next.timeoutMs = api.timeoutMs !== undefined ? String(api.timeoutMs) : "";
					next.wbAccessKey = api.wbAccessKey || "";
					next.wbSecretKey = api.wbSecretKey || "";
					next.wbAgentId = api.wbAgentId || "";
					return next;
				});
				setLoaded(true);
			}).catch(function () {
				setMsg({ ok: false, text: t("setLoadFail") });
				setLoaded(true);
			});
		}, [t]);

		var buildPayload = react.useCallback(function () {
			var api = { enabled: form.enabled, provider: form.provider === "builtin" ? "" : form.provider };
			if (form.apiKey) api.apiKey = form.apiKey;
			if (form.model) api.model = form.model;
			if (form.baseURL) api.baseURL = form.baseURL;
			if (form.sharedEndpoint) api.sharedEndpoint = form.sharedEndpoint;
			if (form.temperature !== "") api.temperature = Number(form.temperature);
			if (form.timeoutMs !== "") api.timeoutMs = Number(form.timeoutMs);
			if (form.wbAccessKey) api.wbAccessKey = form.wbAccessKey;
			if (form.wbSecretKey) api.wbSecretKey = form.wbSecretKey;
			if (form.wbAgentId) api.wbAgentId = form.wbAgentId;
			return { api: api };
		}, [form]);

		var handleSave = react.useCallback(function () {
			if (busy) return;
			setBusy("save");
			fetch("/dsh-prompt-polish/config", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(buildPayload())
			}).then(function (res) {
				if (!res.ok) return res.json().then(function (d) { throw new Error(d.error || ("HTTP " + res.status)); });
				return res.json();
			}).then(function () {
				setMsg({ ok: true, text: t("setSaved") });
			}).catch(function (e) {
				setMsg({ ok: false, text: t("setSaveFail") + (e && e.message ? ": " + e.message : "") });
			}).finally(function () {
				setBusy("");
			});
		}, [busy, buildPayload, t]);

		var handleTest = react.useCallback(function () {
			if (busy) return;
			setBusy("test");
			setMsg(null);
			fetch("/dsh-prompt-polish/config/test", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(buildPayload())
			}).then(function (res) {
				if (!res.ok) throw new Error("HTTP " + res.status);
				return res.json();
			}).then(function (data) {
				if (data && data.ok) {
					setMsg({
						ok: true,
						text: t("setTestOk") + " \u2014 " + (data.source || "") + (data.model ? " / " + data.model : "") + (data.elapsedMs ? " (" + data.elapsedMs + "ms)" : ""),
						sample: data.sample || ""
					});
				} else {
					setMsg({ ok: false, text: (data && data.error) || "test failed" });
				}
			}).catch(function (e) {
				setMsg({ ok: false, text: (e && e.message) || "test failed" });
			}).finally(function () {
				setBusy("");
			});
		}, [busy, buildPayload, t]);

		if (!loaded) {
			return react_jsx_runtime.jsx("div", { className: "dpp-set" });
		}

		var isWb = form.provider === "workbuddy";
		var isShared = form.provider === "shared";
		var isCustom = form.provider === "custom";
		var needsKey = form.provider === "glm" || form.provider === "siliconflow" || form.provider === "hunyuan" || form.provider === "moonshot" || form.provider === "zhipu" || form.provider === "openai" || form.provider === "custom";

		var children = [
			react_jsx_runtime.jsx("div", {
				className: "dpp-set-head",
				key: "head",
				children: react_jsx_runtime.jsxs(react.Fragment, { children: [
					react_jsx_runtime.jsx("h3", { children: t("setTitle") }),
					react_jsx_runtime.jsx("p", { children: t("setSubtitle") })
				] })
			}),
			react_jsx_runtime.jsx("div", {
				className: "dpp-set-row",
				key: "enabled",
				children: react_jsx_runtime.jsxs("label", { className: "dpp-set-check", children: [
					react_jsx_runtime.jsx("input", {
						type: "checkbox",
						checked: form.enabled,
						onChange: function (e) { update("enabled", e.target.checked); }
					}),
					t("setEnabled")
				] })
			}),
			react_jsx_runtime.jsx("div", {
				className: "dpp-set-row",
				key: "provider",
				children: react_jsx_runtime.jsxs("label", { children: [
					t("setProvider"),
					react_jsx_runtime.jsx("select", {
						value: form.provider,
						onChange: function (e) { update("provider", e.target.value); },
						children: PROVIDER_ORDER.map(function (id) {
							return react_jsx_runtime.jsx("option", { value: id, children: t("prov_" + id) }, id);
						})
					})
				] })
			})
		];

		if (needsKey) {
			children.push(react_jsx_runtime.jsx("div", {
				className: "dpp-set-row",
				key: "apiKey",
				children: react_jsx_runtime.jsxs("label", { children: [
					t("setApiKey"),
					react_jsx_runtime.jsx("input", {
						type: "password",
						value: form.apiKey,
						placeholder: form.apiKey && form.apiKey.indexOf("\u2022\u2022") >= 0 ? form.apiKey : t("setApiKeyPh"),
						onChange: function (e) { update("apiKey", e.target.value); }
					})
				] })
			}));
		}
		if (needsKey || isShared) {
			children.push(react_jsx_runtime.jsx("div", {
				className: "dpp-set-row",
				key: "model",
				children: react_jsx_runtime.jsxs("label", { children: [
					t("setModel"),
					react_jsx_runtime.jsx("input", {
						type: "text",
						value: form.model,
						onChange: function (e) { update("model", e.target.value); }
					})
				] })
			}));
		}
		if (isCustom) {
			children.push(react_jsx_runtime.jsx("div", {
				className: "dpp-set-row",
				key: "baseURL",
				children: react_jsx_runtime.jsxs("label", { children: [
					t("setBaseURL"),
					react_jsx_runtime.jsx("input", {
						type: "text",
						value: form.baseURL,
						placeholder: "https://your-api.com/v1",
						onChange: function (e) { update("baseURL", e.target.value); }
					})
				] })
			}));
		}
		if (isShared) {
			children.push(react_jsx_runtime.jsx("div", {
				className: "dpp-set-row",
				key: "sharedEndpoint",
				children: react_jsx_runtime.jsxs("label", { children: [
					t("setSharedEndpoint"),
					react_jsx_runtime.jsx("input", {
						type: "text",
						value: form.sharedEndpoint,
						onChange: function (e) { update("sharedEndpoint", e.target.value); }
					})
				] })
			}));
		}
		if (isWb) {
			children.push(react_jsx_runtime.jsxs("div", {
				className: "dpp-set-wb",
				key: "wb",
				style: { display: "contents" },
				children: [
					react_jsx_runtime.jsx("div", {
						className: "dpp-set-row",
						children: react_jsx_runtime.jsxs("label", { children: [t("setWbAccess"), react_jsx_runtime.jsx("input", {
							type: "password", value: form.wbAccessKey,
							onChange: function (e) { update("wbAccessKey", e.target.value); }
						})] })
					}),
					react_jsx_runtime.jsx("div", {
						className: "dpp-set-row",
						children: react_jsx_runtime.jsxs("label", { children: [t("setWbSecret"), react_jsx_runtime.jsx("input", {
							type: "password", value: form.wbSecretKey,
							onChange: function (e) { update("wbSecretKey", e.target.value); }
						})] })
					}),
					react_jsx_runtime.jsx("div", {
						className: "dpp-set-row",
						children: react_jsx_runtime.jsxs("label", { children: [t("setWbAgent"), react_jsx_runtime.jsx("input", {
							type: "text", value: form.wbAgentId,
							onChange: function (e) { update("wbAgentId", e.target.value); }
						})] })
					})
				]
			}));
		}
		if (needsKey || isShared || isCustom) {
			children.push(react_jsx_runtime.jsxs("div", {
				key: "tuning",
				style: { display: "contents" },
				children: [
					react_jsx_runtime.jsx("div", {
						className: "dpp-set-row",
						children: react_jsx_runtime.jsxs("label", { children: [t("setTemp"), react_jsx_runtime.jsx("input", {
							type: "number", min: "0", max: "2", step: "0.1", value: form.temperature,
							onChange: function (e) { update("temperature", e.target.value); }
						})] })
					}),
					react_jsx_runtime.jsx("div", {
						className: "dpp-set-row",
						children: react_jsx_runtime.jsxs("label", { children: [t("setTimeout"), react_jsx_runtime.jsx("input", {
							type: "number", min: "5000", max: "120000", step: "1000", value: form.timeoutMs,
							onChange: function (e) { update("timeoutMs", e.target.value); }
						})] })
					})
				]
			}));
		}

		children.push(react_jsx_runtime.jsxs("div", {
			className: "dpp-set-actions",
			key: "actions",
			children: [
				react_jsx_runtime.jsx("button", {
					type: "button",
					className: "dpp-set-btn",
					"data-kind": "primary",
					disabled: busy !== "",
					onClick: handleSave,
					children: busy === "save" ? t("setSaving") : t("setSave")
				}),
				react_jsx_runtime.jsx("button", {
					type: "button",
					className: "dpp-set-btn",
					"data-kind": "plain",
					disabled: busy !== "",
					onClick: handleTest,
					children: busy === "test" ? t("setTesting") : t("setTest")
				})
			]
		}));

		if (msg) {
			children.push(react_jsx_runtime.jsxs("div", {
				className: "dpp-set-msg",
				"data-ok": msg.ok ? "true" : "false",
				key: "msg",
				children: [
					react_jsx_runtime.jsx("span", { children: msg.text }),
					msg.sample ? react_jsx_runtime.jsx("div", { className: "dpp-set-sample", children: msg.sample }) : null
				]
			}));
		}

		return react_jsx_runtime.jsx("div", { className: "dpp-set", children: children });
	}
	//#endregion

	//#region apply
	var NS = "prompt-polish";
	var inject = ["slots", "locale", "sessions"];

	function apply(ctx) {
		ctx.effect(function () {
			return ctx.locale.register(NS, { zh: zh, en: en });
		}, "prompt-polish: dictionaries");

		var t = ctx.locale.bind(NS);

		ctx.slots.inject("conversation.input.right", function () {
			return ctx.slots.register({
				name: "conversation.input.right",
				id: "prompt-polish",
				order: 0,
				locale: NS,
				inject: function (sessionId) {
					if (sessionId === void 0) return { t: t };
					try {
						var actx = ctx.sessions.scope(sessionId);
						if (actx === void 0) return { t: t };
						var conversation = actx.get("conversation");
						if (conversation === void 0) return { t: t };
						var shell = conversation.input.for(actx);
						if (shell === void 0) return { t: t };
						return {
							t: t,
							getDraft: function () {
								return shell.snapshot.draft;
							},
							setDraft: function (text) {
								shell.setDraft(text);
							}
						};
					} catch (e) {
						return { t: t };
					}
				}
			}, PromptPolishButton);
		});

		ctx.slots.inject("settings.section", function () {
			return ctx.slots.register({
				name: "settings.section",
				id: "polish",
				order: 50,
				label: function () { return t("settingsNav"); },
				locale: NS,
				inject: function () { return { t: t }; }
			}, PolishSettingsSection);
		});
	}

	exports.apply = apply;
	exports.inject = inject;
	return module.exports;
}});
