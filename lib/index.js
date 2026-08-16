/**
 * dsh-prompt-polish host entry (v2.0.0)
 *
 * One-click AI prompt polish, WorkBuddy-style.
 *
 * v2.0 changes:
 * - System prompt enhanced with WorkBuddy humanizer-zh principles
 * - Added WorkBuddy Open Platform API as a provider (async task pattern)
 * - Added free-cost providers: 智谱 GLM-4-Flash (free), SiliconFlow (free tier)
 * - Removed DeepSeek credential auto-discovery (per user request)
 * - Provider priority: config.json → WorkBuddy API → free API → local engine → rules
 *
 * The plugin calls a real LLM to polish the draft, then writes the polished
 * prompt back into the input box. Falls back to local rules when no API works.
 */

export const name = 'dsh-prompt-polish';

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

/* ── Config loading ──────────────────────────────────────────── */

const DEFAULT_TIMEOUT_MS = 30000;
const DEFAULT_TEMPERATURE = 0.4;

// Candidate paths, in order:
//  1. config.json next to this module (works when running from source dir,
//     or when npm synced the file into node_modules)
//  2. the source plugin dir under <profile>/plugins/ — npm file: installs
//     hard-link code but can drop non-exported files like config.json
const CONFIG_CANDIDATES = [
  fileURLToPath(new URL('../config.json', import.meta.url)),
  fileURLToPath(new URL('../../plugins/dsh-prompt-polish/config.json', import.meta.url)),
];

const PRESET_PROVIDERS = {
  workbuddy: { display: 'WorkBuddy 开放平台', note: '需要 WB_ACCESS_KEY / WB_SECRET_KEY / WB_AGENT_ID' },
  glm: { baseURL: 'https://open.bigmodel.cn/api/paas/v4', model: 'glm-4.5-flash', display: '智谱 GLM-4.5-Flash (免费)', note: '完全免费，去 https://open.bigmodel.cn 申请 API Key' },
  siliconflow: { baseURL: 'https://api.siliconflow.cn/v1', model: 'Qwen/Qwen2.5-7B-Instruct', display: 'SiliconFlow (免费额度)', note: '注册即送免费额度，去 https://siliconflow.cn 申请' },
  hunyuan: { baseURL: 'https://api.hunyuan.cloud.tencent.com/v1', model: 'hunyuan-lite', display: '腾讯混元 Lite', note: 'WorkBuddy 同源模型，轻量便宜' },
  moonshot: { baseURL: 'https://api.moonshot.cn/v1', model: 'moonshot-v1-8k', display: 'Moonshot' },
  zhipu: { baseURL: 'https://open.bigmodel.cn/api/paas/v4', model: 'glm-4.5-flash', display: '智谱 GLM' },
  openai: { baseURL: 'https://api.openai.com/v1', model: 'gpt-4o-mini', display: 'OpenAI' },
};

/* ── Built-in default engine (out-of-the-box, no config needed) ──
 *
 * The maintainer's Zhipu GLM key, stored XOR+Base64 obfuscated (same scheme
 * as config.json apiKeyEnc — see tools/encode-key.js) so the plaintext key
 * never appears in the repository. Obfuscation ≠ encryption: it defeats
 * repo scanners and casual reading only.
 * Rotate the key by regenerating: node tools/encode-key.js <new-key>
 */
const BUILTIN_GLM_KEY_ENC = 'UkFeTxEUCQwUEUwTWw9aRAkBF1xJREEND0UQGUkLVA9dX1cpAGwqRz80ISRVFlcECw==';
const BUILTIN_GLM_MODEL = 'glm-4.5-flash';
const MAX_INPUT_CHARS = 4000;
const MAX_OUTPUT_TOKENS = 1600;

function buildBuiltinEngine() {
  const apiKey = decodeApiKeyEnc(BUILTIN_GLM_KEY_ENC);
  return {
    provider: 'glm',
    baseURL: PRESET_PROVIDERS.glm.baseURL,
    model: BUILTIN_GLM_MODEL,
    apiKey,
    timeoutMs: DEFAULT_TIMEOUT_MS,
    temperature: 0.2,
    source: 'builtin',
  };
}

function loadJsonConfig() {
  for (const p of CONFIG_CANDIDATES) {
    try {
      if (existsSync(p)) {
        const parsed = JSON.parse(readFileSync(p, 'utf8'));
        if (parsed && typeof parsed === 'object') return parsed;
      }
    } catch {
      // broken candidate → try next
    }
  }
  return {};
}

/* ── WorkBuddy Open Platform API (async task) ─────────────────── */

const WB_API_HOST = 'https://open.workbuddy.qq.com/v1';
const WB_POLL_INTERVAL_MS = 2000;
const WB_POLL_MAX_ATTEMPTS = 30; // 60s max wait

/**
 * Call WorkBuddy Open Platform API to create an async task, then poll
 * for the result. Returns the polished text or throws on failure.
 */
async function callWorkBuddyApi(config, userText) {
  const accessKey = config.wbAccessKey || '';
  const secretKey = config.wbSecretKey || '';
  const agentId = config.wbAgentId || '';

  if (!accessKey || !secretKey || !agentId) {
    throw new Error('WorkBuddy credentials incomplete (need wbAccessKey, wbSecretKey, wbAgentId)');
  }

  const apiHost = config.wbApiHost || WB_API_HOST;

  // Step 1: Create async task
  const createController = new AbortController();
  const createTimer = setTimeout(() => createController.abort(), config.timeoutMs || DEFAULT_TIMEOUT_MS);

  let taskId;
  try {
    const createRes = await fetch(`${apiHost}/agent/async_task/create`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        agent_id: agentId,
        access_key: accessKey,
        secret_key: secretKey,
        user_prompt: buildUserPrompt(userText),
      }),
      signal: createController.signal,
    });
    clearTimeout(createTimer);

    if (!createRes.ok) {
      const detail = (await createRes.text()).slice(0, 300);
      throw new Error(`WorkBuddy create HTTP ${createRes.status}: ${detail}`);
    }
    const createData = await createRes.json();
    taskId = createData?.data?.task_id;
    if (!taskId) throw new Error('WorkBuddy create: no task_id in response');
  } finally {
    clearTimeout(createTimer);
  }

  // Step 2: Poll for result
  for (let attempt = 0; attempt < WB_POLL_MAX_ATTEMPTS; attempt += 1) {
    await sleep(WB_POLL_INTERVAL_MS);

    const pollController = new AbortController();
    const pollTimer = setTimeout(() => pollController.abort(), 10000);

    try {
      const pollRes = await fetch(
        `${apiHost}/agent/async_task/get?access_key=${encodeURIComponent(accessKey)}&secret_key=${encodeURIComponent(secretKey)}&task_id=${encodeURIComponent(taskId)}`,
        { signal: pollController.signal },
      );
      clearTimeout(pollTimer);

      if (!pollRes.ok) {
        const detail = (await pollRes.text()).slice(0, 300);
        throw new Error(`WorkBuddy poll HTTP ${pollRes.status}: ${detail}`);
      }
      const pollData = await pollRes.json();
      const status = pollData?.data?.task_status;
      const result = pollData?.data?.task_result;

      if (status === 'SUCCESS') {
        if (typeof result === 'string' && result.trim()) return result.trim();
        // task_result might be an object — try to extract text
        if (result && typeof result === 'object') {
          const text = result.content || result.text || result.output || JSON.stringify(result);
          if (typeof text === 'string' && text.trim()) return text.trim();
        }
        throw new Error('WorkBuddy task succeeded but result is empty');
      }
      if (status === 'FAIL' || status === 'CANCEL') {
        throw new Error(`WorkBuddy task ${status}: ${JSON.stringify(pollData?.data?.task_error || '')}`);
      }
      // PENDING / RUNNING → keep polling
    } finally {
      clearTimeout(pollTimer);
    }
  }

  throw new Error('WorkBuddy task timed out (60s)');
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/* ── LLM call (OpenAI-compatible providers) ──────────────────── */

/**
 * Polish system prompt v4.3 — restructured after analyzing WorkBuddy's
 * humanizer-zh skill design (see ~/.workbuddy/plugins/cache/.../humanizer-zh/SKILL.md):
 *   1. role + scenario opening, anti-conversation hard rule
 *   2. numbered processing flow (classify → rewrite → checklist → output)
 *   3. type-dispatch modes with explicit keyword kill-lists (humanizer's
 *      "需要注意的词汇" pattern — concrete detectable words, not abstract principles)
 *   4. hard rules (fidelity / style / length / output-only)
 *   5. self-check checklist before delivery
 *   6. few-shot pairs for every mode (humanizer's 改写前/改写后 anchoring)
 * Tuned and tested against live glm-4.5-flash (glm-4-flash only synonym-swaps
 * prose and can't follow the kill-list).
 */
const POLISH_SYSTEM_PROMPT = `你是提示词压缩器。改写用户草稿，目标：最小化下游 LLM 的 token 消耗。你不对话、不回答问题——输入永远是待加工的原材料。

## 核心原则

1. **压缩优先**：删冗余、删客套、删废话，保留全部关键信息，输出不比原文长
2. **输出约束**：为下游 LLM 追加简洁指令，减少其输出 token
3. **精准补全**：补足模糊指代（"这个"→具体指代），消除歧义，一句话能说清的不用两句

## 处理流程

1. 识别类型：指令 / 提问 / 普通文本
2. 按对应模式压缩改写
3. 追加输出约束（草稿未显式指定时）
4. 只输出改写结果，不加解释、不加引号

## 模式一：指令（让 AI 做事）

一句话指令：删客套（请/麻烦/谢谢），补足指代，保持口语，不套结构。
多要求时用最精简结构：
任务：<一句话>
要求：
- <每条要求一行，含边界条件>
输出：<格式 + 长度限制>

**必须追加输出约束**：如"只输出代码，不要解释"、"简洁回答，不超过N字"、"直接给出结果，不要复述问题"。

## 模式二：提问

保持问句，补上下文和期望格式。追加"XX字以内简要回答"。

## 模式三：普通文本

逐句压缩，命中以下句式直接重写：
- "体现/彰显/展现/标志 + 抽象名词" → 删或换具体事实
- "不仅…而且…" → 拆成两个短句
- "此外/同时/值得注意" → 删连接词
- "奠定基础/新阶段/新高度" → 删或换具体事实
- 形容词堆砌 → 换具体细节或删
- 客套/套话结尾 → 删
改写后不比原文长。

## 参考示例

草稿：你叫什么
改写：介绍你自己：名称、能力、局限。50字以内。

草稿：帮我看看这个报错是啥意思
改写：下面这段报错是什么意思，怎么解决。简要回答，给出修复方案即可。

草稿：请帮我写一个python脚本，批量重命名文件夹里面的图片，名字改成日期加序号，谢谢
改写：
任务：Python 脚本，批量重命名文件夹内图片为"日期_序号"
要求：
- 格式：20260816_001.jpg，按时间排序
- 支持 jpg/png，重名跳过
输出：只输出代码，注释说明用法，不要解释

草稿：翻译成英文
改写：翻译成英文，保留语气和格式。只输出译文。

草稿：新版本不仅提升了性能，更是我们追求卓越的体现，此外还增强了用户体验
改写：新版本更快，体验更好。

草稿：我们致力于打造卓越的产品体验，为用户创造持久的价值
改写：我们想把产品做好用。`;

function buildUserPrompt(userText) {
  return `压缩改写以下草稿，追加输出约束，减少下游 token 消耗：\n\n${userText}`;
}

async function callLlm(engine, userText) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), engine.timeoutMs);
  try {
    const headers = { 'content-type': 'application/json' };
    if (engine.apiKey) headers.authorization = `Bearer ${engine.apiKey}`;
    const res = await fetch(`${engine.baseURL}/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: engine.model,
        messages: [
          { role: 'system', content: POLISH_SYSTEM_PROMPT },
          { role: 'user', content: buildUserPrompt(userText.slice(0, MAX_INPUT_CHARS)) },
        ],
        temperature: engine.temperature,
        max_tokens: MAX_OUTPUT_TOKENS,
        stream: false,
      }),
      signal: controller.signal,
    });
    if (!res.ok) {
      const detail = (await res.text()).slice(0, 300);
      throw new Error(`API HTTP ${res.status}: ${detail}`);
    }
    const data = await res.json();
    const message = data?.choices?.[0]?.message;
    const content = message?.content ?? message?.reasoning_content;
    if (typeof content !== 'string' || !content.trim()) throw new Error('empty LLM response');
    return content.trim();
  } finally {
    clearTimeout(timer);
  }
}

async function callLlmWithRetry(engine, userText) {
  let lastError;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      return await callLlm(engine, userText);
    } catch (error) {
      lastError = error;
      if (!/API HTTP 5\d\d/.test(error.message)) break; // 4xx / timeout / network → no retry
    }
  }
  throw lastError;
}

/* ── Credential decoding ─────────────────────────────────────── */

/**
 * Decode an obfuscated API key so the plaintext key never has to live in
 * config files or the repository.
 *
 * Supported formats:
 *   1. apiKeyEnv: "ENV_VAR_NAME" → read from process.env (highest priority
 *      for secrecy, nothing stored at all)
 *   2. apiKeyEnc: "<obfuscated>" → XOR with the plugin name then base64.
 *      This is obfuscation, not cryptography — it prevents the key from
 *      being harvested by repo scanners and casual reading. For real
 *      security use apiKeyEnv or a private repo.
 *
 * Encode a key:  node tools/encode-key.js <your-key>
 */
const XOR_PAD = 'dsh-prompt-polish';

function decodeApiKeyEnc(encoded) {
  try {
    const xored = Buffer.from(encoded, 'base64');
    const out = Buffer.alloc(xored.length);
    for (let i = 0; i < xored.length; i += 1) out[i] = xored[i] ^ XOR_PAD.charCodeAt(i % XOR_PAD.length);
    const decoded = out.toString('utf8');
    return decoded.trim();
  } catch {
    return '';
  }
}

function resolveApiKey(api) {
  // 1. plaintext (local convenience)
  if (typeof api.apiKey === 'string' && api.apiKey.trim()) return api.apiKey.trim();
  // 2. environment variable reference
  if (typeof api.apiKeyEnv === 'string' && api.apiKeyEnv.trim()) {
    const fromEnv = process.env[api.apiKeyEnv.trim()];
    if (fromEnv && fromEnv.trim()) return fromEnv.trim();
  }
  // 3. obfuscated key (repo-safe)
  if (typeof api.apiKeyEnc === 'string' && api.apiKeyEnc.trim()) {
    const decoded = decodeApiKeyEnc(api.apiKeyEnc.trim());
    if (decoded) return decoded;
  }
  return '';
}

/* ── Shared zero-config proxy ────────────────────────────────── */

/**
 * Out-of-the-box endpoint: a single-purpose Cloudflare Worker proxy (see
 * worker/ directory) that holds the API key server-side, so end users need
 * zero configuration. Deployed and maintained by the plugin author; if it is
 * unreachable the plugin silently falls back to local rules.
 * Override via config.json: { "api": { "provider": "shared", "sharedEndpoint": "..." } }
 */
const SHARED_POLISH_ENDPOINT = 'https://dsh-prompt-polish-proxy.jinhuoooo.workers.dev/polish';

async function callShared(engine, userText) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), engine.timeoutMs);
  try {
    const res = await fetch(engine.endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text: userText.slice(0, 4000) }),
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`shared proxy HTTP ${res.status}`);
    const data = await res.json();
    const content = typeof data?.content === 'string' ? data.content.trim() : '';
    if (!content) throw new Error('empty shared proxy response');
    return content;
  } finally {
    clearTimeout(timer);
  }
}

/* ── Config resolution ───────────────────────────────────────── */

/**
 * Resolve the effective API engine.
 * Priority:
 *   1. config.json explicit settings (provider + credentials)
 *   2. Auto-detect local OpenAI-compatible engine (Ollama / LM Studio)
 *   3. null → falls back to local rules
 *
 * Returns { provider, baseURL, model, apiKey, timeoutMs, temperature, source, ...workbuddy fields }
 * or null.
 */
function resolveApiConfig(config) {
  const api = (config && typeof config.api === 'object' && config.api) || {};

  if (api.enabled === false) return null;

  const provider = typeof api.provider === 'string' ? api.provider.toLowerCase() : '';

  // ── WorkBuddy provider (async task API) ──
  if (provider === 'workbuddy') {
    const wbAccessKey = api.wbAccessKey || config.wbAccessKey || '';
    const wbSecretKey = api.wbSecretKey || config.wbSecretKey || '';
    const wbAgentId = api.wbAgentId || config.wbAgentId || '';
    if (wbAccessKey && wbSecretKey && wbAgentId) {
      return {
        provider: 'workbuddy',
        wbAccessKey,
        wbSecretKey,
        wbAgentId,
        wbApiHost: api.wbApiHost || WB_API_HOST,
        timeoutMs: Number.isFinite(Number(api.timeoutMs)) && Number(api.timeoutMs) > 0 ? Number(api.timeoutMs) : 60000,
        source: 'workbuddy',
      };
    }
    // Credentials not set → fall through to other providers / local fallback
  }

  // ── OpenAI-compatible providers ──
  let baseURL = typeof api.baseURL === 'string' && api.baseURL.trim() ? api.baseURL.trim().replace(/\/+$/, '') : '';
  let model = typeof api.model === 'string' && api.model.trim() ? api.model.trim() : '';
  let apiKey = resolveApiKey(api);

  // Apply preset defaults
  if (provider && PRESET_PROVIDERS[provider] && provider !== 'workbuddy') {
    const preset = PRESET_PROVIDERS[provider];
    if (!baseURL) baseURL = preset.baseURL;
    if (!model) model = preset.model;
  }

  // For free providers that don't need a key, allow empty apiKey
  const freeProviders = ['glm', 'siliconflow'];
  if (baseURL && (apiKey || freeProviders.includes(provider))) {
    return {
      provider: provider || 'custom',
      baseURL,
      model: model || 'glm-4-flash',
      apiKey,
      timeoutMs: Number.isFinite(Number(api.timeoutMs)) && Number(api.timeoutMs) > 0 ? Number(api.timeoutMs) : DEFAULT_TIMEOUT_MS,
      temperature: Number.isFinite(Number(api.temperature)) ? Number(api.temperature) : DEFAULT_TEMPERATURE,
      source: provider || 'custom',
    };
  }

  // ── Built-in default engine (maintainer's GLM key, obfuscated) ──
  // When nothing is configured, use the built-in GLM engine out of the box.
  // It decodes to a real key at runtime; if it ever gets revoked, the chain
  // falls back to the shared proxy → local engine → local rules.
  if (!provider || provider === 'builtin') {
    const engine = buildBuiltinEngine();
    if (engine.apiKey) return engine;
  }

  // ── Shared zero-config proxy (explicit choice, or built-in key revoked) ──
  if (provider === 'shared') {
    const endpoint = (typeof api.sharedEndpoint === 'string' && api.sharedEndpoint.trim())
      || SHARED_POLISH_ENDPOINT;
    return {
      provider: 'shared',
      endpoint: endpoint.trim(),
      timeoutMs: Number.isFinite(Number(api.timeoutMs)) && Number(api.timeoutMs) > 0 ? Number(api.timeoutMs) : 30000,
      source: 'shared',
    };
  }

  return null;
}

/* ── Local engine detection (Ollama / LM Studio) ─────────────── */

let localEngineCache = null;
let localEngineCachedAt = 0;
const LOCAL_ENGINE_TTL_MS = 60000;

const LOCAL_CANDIDATES = [
  { source: 'ollama', base: 'http://127.0.0.1:11434/v1', prefer: ['qwen3', 'qwen2.5', 'deepseek-r1', 'llama3.1', 'gemma2', 'llama3'] },
  { source: 'lmstudio', base: 'http://127.0.0.1:1234/v1', prefer: [] },
];

async function detectLocalEngine() {
  const now = Date.now();
  if (localEngineCache && now - localEngineCachedAt < LOCAL_ENGINE_TTL_MS) return localEngineCache;
  localEngineCache = null;
  for (const candidate of LOCAL_CANDIDATES) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 800);
      const res = await fetch(`${candidate.base}/models`, { signal: controller.signal });
      clearTimeout(timer);
      if (!res.ok) continue;
      const data = await res.json();
      const models = Array.isArray(data?.data) ? data.data.map((m) => (m && m.id) || '').filter(Boolean) : [];
      if (!models.length) continue;
      const model = models.find((id) => candidate.prefer.some((p) => id.includes(p))) || models[0];
      localEngineCache = {
        baseURL: candidate.base, model, apiKey: '',
        timeoutMs: 60000, temperature: 0.4, source: candidate.source,
      };
      localEngineCachedAt = Date.now();
      return localEngineCache;
    } catch {
      // candidate unavailable
    }
  }
  localEngineCachedAt = Date.now();
  return null;
}

/* ── Local rule fallback ─────────────────────────────────────── */

const CODE_RE = /\b(?:code|function|implement|script|algorithm|program|frontend|backend|api|component|class|method|variable|regex|database|sql|python|javascript|java|typescript|go|rust|react|vue|angular|node|deno|docker|kubernetes|git|linux|bash|shell|bug|debug|compile|deploy|architect|unit.?test)\b|代码|函数|实现|编程|脚本|算法|程序|前端|后端|接口|组件|类\b|对象|方法|变量|正则|数据库|编译|部署|架构|设计模式|单元测试/i;

const WRITE_RE = /写[一]?[篇封个]|作文|邮件|信件?|翻译|总结|摘要|大纲|报告|文案|论文|演讲|稿|编辑|润色|改写|扩写|缩写|write|essay|email|letter|translate|summary|outline|report|article|paper|speech|edit|rewrite|expand|condense/i;

const STRONG_ANALYSIS_RE = /优缺点|利弊|对比|比较|评估|compare|evaluate|pros.*cons|assess/i;
const WEAK_ANALYSIS_RE = /分析|调查|研究|论证|推导|审视|诊断|analyze|investigate|research|argue|derive|diagnose/i;

const CREATIVE_RE = /创意|设计|构思|头脑风暴|故事|小说|诗歌|歌词|剧本|起名|命名|slogan|creative|design|brainstorm|story|novel|poem|lyrics|script|naming/i;

const DATA_RE = /数据|表格|统计|图表|可视化|报表|仪表盘|指标|趋势|data|table|statistics|chart|visualization|report|dashboard|metrics|trend/i;

function detectType(text) {
  if (STRONG_ANALYSIS_RE.test(text)) return 'analysis';
  if (CODE_RE.test(text)) return 'coding';
  if (WEAK_ANALYSIS_RE.test(text)) return 'analysis';
  if (WRITE_RE.test(text)) return 'writing';
  if (CREATIVE_RE.test(text)) return 'creative';
  if (DATA_RE.test(text)) return 'data';
  return 'general';
}

function isStructured(text) {
  return /^#{1,3}\s/m.test(text) || /^\s*[-*]\s/m.test(text) || /^\s*\d+\.\s/m.test(text) || /```/.test(text);
}

function isAlreadyEnhanced(text) {
  return /^角色[：:]/m.test(text) || /^Role[：:]/im.test(text)
    || /^任务[：:]/m.test(text) || /^Task[：:]/im.test(text)
    || /^要求[：:]/m.test(text) || /^Requirements?[：:]/im.test(text)
    || /^约束[：:]/m.test(text) || /^Constraints?[：:]/im.test(text);
}

function condense(text) {
  return text
    .replace(/^(请|麻烦你?|能不能|可以|帮忙|帮我)\s*/g, '')
    .replace(/^(please|can you|could you|help me)\s*/gi, '')
    .replace(/[。！？.!?]+$/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

const ROLES = {
  zh: {
    coding: '角色：资深软件工程师', writing: '角色：专业文案', analysis: '角色：分析专家',
    creative: '角色：创意总监', data: '角色：数据分析师', general: '角色：专业助手',
  },
  en: {
    coding: 'Role: Senior Software Engineer', writing: 'Role: Professional Writer', analysis: 'Role: Analytical Expert',
    creative: 'Role: Creative Director', data: 'Role: Data Analyst', general: 'Role: Professional Assistant',
  },
};

const REQ_HEADER = { zh: '要求：', en: 'Requirements:' };

const REQUIREMENTS = {
  zh: {
    coding: ['完整类型标注和关键注释', '处理边界条件和异常', '给出使用示例'],
    writing: ['结构清晰，逻辑连贯', '语气与受众匹配', '控制篇幅'],
    analysis: ['多维度拆解', '给出明确结论', '用表格对比关键差异'],
    creative: ['发散至少3个方案', '标注各自优劣', '选一个深化'],
    data: ['列出关键指标', '指出趋势和异常', '建议可视化方式'],
    general: ['直接回答核心问题', '补充必要上下文'],
  },
  en: {
    coding: ['Full type annotations and key comments', 'Handle edge cases and exceptions', 'Provide usage example'],
    writing: ['Clear structure, coherent logic', 'Match tone to audience', 'Control length'],
    analysis: ['Multi-dimensional breakdown', 'Clear conclusion', 'Use table for key differences'],
    creative: ['Brainstorm at least 3 options', 'Note pros/cons each', 'Deepen one'],
    data: ['List key metrics', 'Identify trends and anomalies', 'Suggest visualization'],
    general: ['Answer the core question directly', 'Add necessary context'],
  },
};

const CONSTRAINTS = {
  zh: '约束：回答简洁，用要点式表达，避免冗余展开，代码块标注语言',
  en: 'Constraints: Be concise, use bullet points, avoid redundant expansion, tag code blocks',
};

const OUTPUT_FORMAT = {
  zh: {
    coding: '输出：代码 + 简要说明 + 示例', writing: '输出：正文（按结构分段）',
    analysis: '输出：结论先行 → 对比表 → 建议', creative: '输出：方案列表 → 选定方案展开',
    data: '输出：关键指标 → 趋势分析 → 建议', general: '输出：直接回答 → 补充说明（如需）',
  },
  en: {
    coding: 'Output: code + brief notes + example', writing: 'Output: body text (structured paragraphs)',
    analysis: 'Output: conclusion first → comparison table → recommendations', creative: 'Output: option list → deepen selected one',
    data: 'Output: key metrics → trend analysis → suggestions', general: 'Output: direct answer → supplementary notes (if needed)',
  },
};

function localPolish(rawText) {
  const text = rawText.trim();
  if (!text) return text;
  const isZh = /[\u4e00-\u9fa5]/.test(text);
  const lang = isZh ? 'zh' : 'en';
  const type = detectType(text);

  if (isAlreadyEnhanced(text)) return text + '\n\n' + CONSTRAINTS[lang];
  if (isStructured(text) || text.length > 500) {
    return text + '\n\n' + CONSTRAINTS[lang] + '\n' + OUTPUT_FORMAT[lang][type];
  }

  const cleaned = condense(text);
  const lines = [];
  lines.push(ROLES[lang][type]);
  lines.push('任务：' + cleaned);
  lines.push(REQ_HEADER[lang] + '\n' + REQUIREMENTS[lang][type].map((r) => '- ' + r).join('\n'));
  lines.push(CONSTRAINTS[lang]);
  lines.push(OUTPUT_FORMAT[lang][type]);
  return lines.join('\n\n');
}

/* ── Orchestration ───────────────────────────────────────────── */

function logFail(stage, error) {
  const message = error instanceof Error ? error.message : String(error);
  console.warn(`[dsh-prompt-polish] ${stage} failed: ${message}`);
}

async function optimize(apiConfig, text) {
  const capped = text.slice(0, MAX_INPUT_CHARS);

  // 1) WorkBuddy async task API
  if (apiConfig && apiConfig.provider === 'workbuddy') {
    try {
      const optimized = await callWorkBuddyApi(apiConfig, capped);
      if (optimized) return { optimized, source: 'workbuddy' };
    } catch (error) {
      logFail('workbuddy', error);
    }
  }

  // 2) OpenAI-compatible API (configured engine, or the built-in default GLM)
  if (apiConfig && apiConfig.provider !== 'workbuddy' && apiConfig.provider !== 'shared') {
    try {
      const optimized = await callLlmWithRetry(apiConfig, capped);
      if (optimized) return { optimized, source: apiConfig.source };
    } catch (error) {
      logFail(`api(${apiConfig.source})`, error);
    }
  }

  // 3) Shared zero-config proxy (fallback when the configured provider fails;
  //    skipped entirely when the user disabled the API via config)
  if (apiConfig) {
    try {
      const shared = {
        provider: 'shared',
        endpoint: (apiConfig.provider === 'shared' && typeof apiConfig.endpoint === 'string')
          ? apiConfig.endpoint
          : SHARED_POLISH_ENDPOINT,
        timeoutMs: 30000,
      };
      const optimized = await callShared(shared, capped);
      if (optimized) return { optimized, source: 'shared' };
    } catch (error) {
      logFail('shared-proxy', error);
    }
  }

  // 4) Local engine (Ollama / LM Studio)
  const localEngine = await detectLocalEngine();
  if (localEngine) {
    try {
      const optimized = await callLlmWithRetry(localEngine, capped);
      if (optimized) return { optimized, source: localEngine.source };
    } catch (error) {
      logFail('local-engine', error);
    }
  }

  // 5) Local rule engine — always works, offline-safe
  return { optimized: localPolish(text), source: 'local' };
}

/* ── HTTP helpers ────────────────────────────────────────────── */

async function readJsonBody(request, maxBytes = 65536) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buffer.length;
    if (size > maxBytes) throw new Error('request body too large');
    chunks.push(buffer);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

function sendJson(response, status, payload) {
  response.writeHead(status, {
    'cache-control': 'no-store',
    'content-type': 'application/json; charset=utf-8',
  });
  response.end(JSON.stringify(payload));
}

function sameOrigin(request) {
  const origin = request.headers.origin;
  const host = request.headers.host;
  if (origin === undefined || host === undefined) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

/* ── Settings API (config read/write + connection test) ─────── */

const EDITABLE_API_FIELDS = new Set([
  'enabled', 'provider', 'baseURL', 'model', 'apiKey', 'apiKeyEnc', 'apiKeyEnv',
  'timeoutMs', 'temperature', 'sharedEndpoint',
  'wbAccessKey', 'wbSecretKey', 'wbAgentId', 'wbApiHost',
]);

/** Where a saved config.json is written to (first candidate path). */
function configWritePath() {
  return CONFIG_CANDIDATES[0];
}

function maskKey(key) {
  if (typeof key !== 'string' || !key) return '';
  if (key.length <= 10) return '••••';
  return `${key.slice(0, 5)}••••${key.slice(-4)}`;
}

/** Sanitize a config object received from the settings UI. */
function sanitizeConfig(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return null;
  const api = input.api;
  if (!api || typeof api !== 'object') return null;
  const clean = {};
  for (const [key, value] of Object.entries(api)) {
    if (!EDITABLE_API_FIELDS.has(key)) continue;
    if (value === null || value === undefined) continue;
    if (typeof value === 'string') {
      const trimmed = value.trim();
      // Empty string or mask placeholder → drop the field (keep old value)
      if (!trimmed || trimmed.includes('••')) continue;
      clean[key] = trimmed;
    } else if (typeof value === 'boolean' || typeof value === 'number') {
      clean[key] = value;
    }
  }
  if (typeof clean.timeoutMs === 'number') {
    clean.timeoutMs = Math.min(Math.max(Math.round(clean.timeoutMs), 5000), 120000);
  }
  if (typeof clean.temperature === 'number') {
    clean.temperature = Math.min(Math.max(clean.temperature, 0), 2);
  }
  return { api: clean };
}

function handleGetConfig(response) {
  const config = loadJsonConfig();
  const api = { ...(config.api || {}) };
  // Mask every credential-like field before sending to the client
  for (const field of ['apiKey', 'apiKeyEnc', 'wbAccessKey', 'wbSecretKey']) {
    if (typeof api[field] === 'string' && api[field]) api[field] = maskKey(api[field]);
  }
  sendJson(response, 200, {
    config: { api },
    builtin: { provider: 'glm', model: BUILTIN_GLM_MODEL },
    defaults: { timeoutMs: DEFAULT_TIMEOUT_MS, temperature: DEFAULT_TEMPERATURE },
    providers: Object.entries(PRESET_PROVIDERS).map(([id, p]) => ({
      id, display: p.display || id, note: p.note || '', baseURL: p.baseURL || '', model: p.model || '',
    })),
  });
}

async function handleSaveConfig(request, response) {
  let body;
  try {
    body = await readJsonBody(request);
  } catch (error) {
    sendJson(response, 400, { error: `invalid body: ${error.message}` });
    return;
  }
  const clean = sanitizeConfig(body);
  if (!clean) {
    sendJson(response, 400, { error: 'invalid config shape (expect { api: {...} })' });
    return;
  }
  // Merge over the existing config so untouched masked fields keep old values
  const current = loadJsonConfig();
  const mergedApi = { ...(current.api || {}), ...clean.api };
  // If the UI re-sent a masked value verbatim it was already dropped by
  // sanitizeConfig; explicit apiKey === '' would clear it — support that.
  const target = configWritePath();
  try {
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, JSON.stringify({ api: mergedApi }, null, 2) + '\n', 'utf8');
    sendJson(response, 200, { ok: true, path: target });
  } catch (error) {
    sendJson(response, 500, { error: `cannot write config: ${error.message}` });
  }
}


/** Test the (possibly unsaved) settings from the settings UI. */
async function handleTestConfig(request, response) {
  let body;
  try {
    body = await readJsonBody(request);
  } catch (error) {
    sendJson(response, 400, { error: `invalid body: ${error.message}` });
    return;
  }
  const clean = sanitizeConfig(body);
  if (!clean) {
    sendJson(response, 400, { error: 'invalid config shape' });
    return;
  }
  // Merge with saved config, resolve, and run a tiny sample polish
  const current = loadJsonConfig();
  const engine = resolveApiConfig({ api: { ...(current.api || {}), ...clean.api } });
  if (!engine) {
    sendJson(response, 200, { ok: false, error: 'API 已禁用或配置不完整' });
    return;
  }
  const sample = '帮我看看这个报错是啥意思，谢谢';
  try {
    const started = Date.now();
    let result;
    if (engine.provider === 'workbuddy') result = await callWorkBuddyApi(engine, sample);
    else if (engine.provider === 'shared') result = await callShared(engine, sample);
    else result = await callLlm(engine, sample);
    sendJson(response, 200, {
      ok: true,
      source: engine.source,
      model: engine.model || '(shared proxy)',
      elapsedMs: Date.now() - started,
      sample: result.slice(0, 200),
    });
  } catch (error) {
    sendJson(response, 200, { ok: false, error: error instanceof Error ? error.message : String(error) });
  }
}

/* ── Route mounting ──────────────────────────────────────────── */

function mountPolishRoute(host) {
  const disposer = host.webServer.register({
    kind: 'prefix',
    path: '/dsh-prompt-polish',
    handler: async (request, response) => {
      const pathname = new URL(request.url ?? '/', 'http://x').pathname;

      // ── Settings API (config management for the settings page) ──
      if (pathname === '/dsh-prompt-polish/config') {
        if (!sameOrigin(request)) {
          sendJson(response, 403, { error: 'untrusted origin' });
          return;
        }
        if (request.method === 'GET') {
          handleGetConfig(response);
          return;
        }
        if (request.method === 'POST') {
          await handleSaveConfig(request, response);
          return;
        }
        response.writeHead(405, { allow: 'GET, POST' });
        response.end();
        return;
      }
      if (pathname === '/dsh-prompt-polish/config/test') {
        if (!sameOrigin(request)) {
          sendJson(response, 403, { error: 'untrusted origin' });
          return;
        }
        if (request.method !== 'POST') {
          response.writeHead(405, { allow: 'POST' });
          response.end();
          return;
        }
        await handleTestConfig(request, response);
        return;
      }

      // ── Polish endpoint ──
      if (pathname !== '/dsh-prompt-polish/optimize') {
        response.writeHead(404);
        response.end();
        return;
      }
      if (request.method !== 'POST') {
        response.writeHead(405, { allow: 'POST' });
        response.end();
        return;
      }
      if (!sameOrigin(request)) {
        sendJson(response, 403, { error: 'untrusted origin' });
        return;
      }
      try {
        const body = await readJsonBody(request);
        const text = typeof body.text === 'string' ? body.text : '';
        if (!text.trim()) {
          sendJson(response, 400, { error: 'empty text' });
          return;
        }
        // Re-read config on every request so credential changes take effect
        // without restarting DSH (hot reload).
        const apiConfig = resolveApiConfig(loadJsonConfig());
        const result = await optimize(apiConfig, text);
        sendJson(response, 200, { optimized: result.optimized, source: result.source });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error('[dsh-prompt-polish] optimize route error:', message);
        sendJson(response, 500, { error: message });
      }
    },
  });

  return () => disposer?.();
}

/* ── Plugin entry ────────────────────────────────────────────── */

export function apply(ctx, config) {
  ctx.inject(['webServer'], (host) => {
    host.effect(() => mountPolishRoute(host), 'dsh-prompt-polish: http route');
  });
}
