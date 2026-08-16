# dsh-prompt-polish

> DSH（DeepSeek Harness）输入框一键 AI 润色插件 —— WorkBuddy 同款 Sparkle 按钮，点击即把草稿改写为更清晰、更有效的提示词或文本。

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Model](https://img.shields.io/badge/Model-GLM--4.5--Flash-green.svg)](https://open.bigmodel.cn)
[![Cost](https://img.shields.io/badge/Cost-免费-success.svg)](#成本说明)
[![Version](https://img.shields.io/badge/Version-2.3.0-blue.svg)](#踩坑记录)

---

## 目录

- [这是什么](#这是什么)
- [效果演示](#效果演示)
- [核心特性](#核心特性)
- [快速开始](#快速开始)
- [配置说明](#配置说明)
- [设置页面](#配置可选)
- [支持的模型服务商](#支持的模型服务商)
- [降级链设计](#降级链设计)
- [共享代理（shared）与自部署](#共享代理shared与自部署)
- [润色提示词的设计原理](#润色提示词的设计原理)
- [架构](#架构)
- [安全设计](#安全设计)
- [成本说明](#成本说明)
- [踩坑记录](#踩坑记录)
- [开发](#开发)
- [License](#license)

---

## 这是什么

在 DSH 聊天输入框右侧添加一个 ✨ Sparkle 按钮。点击后：

1. 读取输入框里的草稿
2. 发给 LLM（默认智谱 **GLM-4.5-Flash，完全免费**）
3. 把改写结果写回输入框

插件的核心是一套经过 10 轮真实 API 迭代测试打磨的**润色系统提示词**——它参考了 WorkBuddy 润色功能（humanizer-zh 技能）的设计逻辑，能处理三种类型的输入：**指令、提问、普通文本**，并彻底去除 AI 写作痕迹。

## 效果演示

**口语短句**（保持口语，只补指代）：

```
草稿：帮我看看这个报错是啥意思
改写：帮我看看下面这段报错是什么意思，怎么解决。
```

**复杂指令**（提取细节 + 补全通用质量要求，结构化）：

```
草稿：请帮我写一个python脚本，批量重命名文件夹里面的图片，名字改成日期加序号，谢谢

改写：
任务：编写 Python 脚本，批量重命名指定文件夹内的图片
要求：
- 文件名格式：日期_序号（如 20260816_001.jpg），序号递增
- 支持 jpg / png 等常见格式，按文件时间排序编号
- 重名时跳过并警告，不覆盖
- 提供 dry-run 预览模式
输出：完整脚本 + 使用说明
```

**问句**（改写成更清晰的问句，绝不回答）：

```
草稿：你叫什么
改写：请介绍你自己：名称、所属产品、能做什么（代码、写作、分析等）、做不到什么。简要回答。
```

**普通文本**（句式级推倒重写，不是同义词替换）：

```
草稿：新版本不仅提升了性能，更是我们追求卓越的体现，此外还增强了用户体验
改写：新版本跑得更快，用起来也顺手。
```

## 核心特性

- ✨ **一键润色**：输入框右侧 Sparkle 按钮，带 loading 动画和 toast 提示
- 🧠 **三模式智能分派**：指令 / 提问 / 普通文本，各有独立改写策略
- 🚫 **防回答机制**：输入是问句时改写问句，不会被 LLM 当成对话回答掉
- 🇨🇳 **去 AI 味**：句式级黑名单（"彰显/体现/此外/不仅…而且"等命中即整句重写）
- 💰 **零成本运行**：内置 GLM-4.5-Flash 免费模型，开箱即用无需配置
- ⚙️ **可视化设置页**：DSH 设置 → 润色设置，选服务商、填 Key、一键测试连接，改动即时生效
- 🔐 **密钥混淆存储**：API key 以 XOR+Base64 编码存放，明文不出现在任何文件中；设置页回读自动脱敏
- 🌐 **多服务商支持**：智谱 GLM / SiliconFlow / 腾讯混元 / WorkBuddy 开放平台 / 任意 OpenAI 兼容 API
- 🔄 **四级降级链**：内置/配置 API → 共享代理 → 本地 Ollama/LM Studio → 本地规则引擎，断网也能用
- ⚡ **配置热加载**：改配置即时生效，无需重启 DSH

## 快速开始

### 前置条件

- 已安装 DSH（DeepSeek Harness）并创建了一个 profile（如 `web`）
- Node.js ≥ 18

**v2.2 起零配置开箱即用**：默认使用作者维护的免费润色代理（Cloudflare Worker，API Key 保存在服务端，仓库和你的机器上都不需要任何 Key）。代理不可用时自动降级本地规则润色。想用自己的模型再看下文"配置说明"。

### 安装

**方式 A：插件市场一键安装（推荐）**

打开 DSH → 设置 → 插件市场，搜索 `prompt-polish`，一键安装。需要先装市场本体：

```bash
dsh plugin --profile web add dshmarket
```

**方式 B：从 GitHub 直接安装**

```bash
dsh plugin --profile web add github:jinhuoooo/dsh-prompt-polish
```

**方式 C：Windows CMD 手动安装（无需 git）**

Windows 10/11 自带 `curl` 和 `tar`，在 CMD 里逐行执行即可：

```bat
:: 1. 进入 DSH profile 的 plugins 目录（没有就创建）
cd /d %USERPROFILE%\.dsh\profiles\web\plugins

:: 2. 下载并解压仓库（无需安装 git）
curl -L -o pp.zip https://github.com/jinhuoooo/dsh-prompt-polish/archive/refs/heads/main.zip
tar -xf pp.zip
del pp.zip
ren dsh-prompt-polish-main dsh-prompt-polish

:: 3. 回到 profile 根目录，安装为依赖
cd ..
call npm install ./plugins/dsh-prompt-polish

:: 4. 重启 DSH（关掉重新打开），输入框右侧出现 ✨ 按钮即安装成功
```

已装 git 的话也可以 `git clone https://github.com/jinhuoooo/dsh-prompt-polish.git` 代替第 2 步。

**方式 D：类 Unix 手动安装**

```bash
cd ~/.dsh/profiles/web/plugins
git clone https://github.com/jinhuoooo/dsh-prompt-polish.git
cd ..
npm install ./plugins/dsh-prompt-polish
# 重启 DSH，输入框右侧出现 ✨ 按钮即安装成功
```

### 配置（可选）

**开箱即用**：v2.3 起默认使用插件内置的智谱 GLM-4.5-Flash 引擎（维护者 Key 以 XOR+Base64 混淆编码内置，运行时解码，无需任何配置即可免费润色）。内置 Key 失效时自动降级到共享代理 → 本地规则。

想用自己的 API 获得更稳的速度，**两种方式**：

**方式一：设置页面（推荐，无需改文件）** — 打开 DSH → 设置 → **润色设置**，选择服务商、填入 API Key、点"测试连接"验证后"保存"。改动即时生效，无需重启。Key 在服务端写入 `config.json`（已加入 `.gitignore`）。

**方式二：手动编辑配置文件**：

```bash
cp plugins/dsh-prompt-polish/config.example.json plugins/dsh-prompt-polish/config.json
# 编辑 config.json，填入你自己的 key（见下文"配置说明"）
```

> 推荐：智谱 **glm-4.5-flash**，完全免费，去 [open.bigmodel.cn](https://open.bigmodel.cn) 注册即可获取 Key。
>
> 本仓库不包含任何明文 API Key——`config.json` 已在 `.gitignore` 中，请勿提交。内置的维护者 Key 仅做混淆存储。

> **Windows 用户注意**：`npm install` 使用 `file:` 协议时，`node_modules` 里的副本是硬链接目录。代码文件会自动同步，但 **`config.json` 这类非导出文件不会被同步**。如果配置不生效，把 `config.json` 手动复制到 `node_modules/dsh-prompt-polish/` 下。插件 v2.1+ 已做多路径查找缓解此问题；v2.3+ 设置页面写入时会自动创建到正确路径。

## 配置说明

配置文件：`config.json`（插件根目录）。三种密钥存放方式按需选择：

### 方式一：明文（本地自用最简单）

```json
{
  "api": {
    "enabled": true,
    "provider": "glm",
    "model": "glm-4.5-flash",
    "temperature": 0.2,
    "apiKey": "你的智谱APIKey",
    "timeoutMs": 60000
  }
}
```

### 方式二：混淆编码（推荐，仓库安全）

```bash
# 用工具把 key 编码
node tools/encode-key.js 你的智谱APIKey
# 输出类似：QEXFRwQfEQ8TVxMB...（一串 Base64）
```

```json
{
  "api": {
    "enabled": true,
    "provider": "glm",
    "model": "glm-4.5-flash",
    "temperature": 0.2,
    "apiKeyEnc": "编码后的字符串"
  }
}
```

### 方式三：环境变量（最安全）

```json
{
  "api": {
    "enabled": true,
    "provider": "glm",
    "apiKeyEnv": "ZHIPU_API_KEY"
  }
}
```

三种方式优先级：`apiKey` > `apiKeyEnv` > `apiKeyEnc`。

### 完整字段参考

| 字段 | 类型 | 说明 |
|------|------|------|
| `enabled` | bool | `false` 时禁用 API，直接走本地降级 |
| `provider` | string | 预设服务商名，见下表；或 `custom` |
| `baseURL` | string | 自定义 API 地址（provider 为 custom 时必填） |
| `model` | string | 模型名，不填用预设默认值 |
| `apiKey` | string | 明文密钥 |
| `apiKeyEnv` | string | 环境变量名（从环境变量读密钥） |
| `apiKeyEnc` | string | 混淆编码密钥（`tools/encode-key.js` 生成） |
| `temperature` | number | 采样温度，润色任务建议 0.2 |
| `timeoutMs` | number | 请求超时，默认 30000 |

## 支持的模型服务商

| provider | 默认模型 | 费用 | 获取方式 |
|----------|---------|------|---------|
| `glm` | glm-4.5-flash | **免费** | [open.bigmodel.cn](https://open.bigmodel.cn) 注册即得 |
| `siliconflow` | Qwen/Qwen2.5-7B-Instruct | 免费额度 | [siliconflow.cn](https://siliconflow.cn) 注册即送 |
| `hunyuan` | hunyuan-lite | 极低 | 腾讯云 API Key |
| `workbuddy` | — | 按 Task 计费 | WorkBuddy 开放平台智能体 |
| `custom` | 自定义 | — | 任意 OpenAI 兼容 API |
| （自动探测） | 本地模型 | 免费 | Ollama (`:11434`) / LM Studio (`:1234`) |

**推荐**：`glm` + `glm-4.5-flash`。免费，且中文改写质量明显高于 glm-4-flash（见[踩坑记录](#踩坑记录)）。

## 降级链设计

每次点击按钮时按顺序尝试，任何一级成功即返回：

```
① 内置 GLM 引擎（默认，维护者 Key 混淆内置）或配置的云端 API
        ↓ 失败 / 未配置 / 被禁用
② 共享润色代理（Cloudflare Worker，零配置兜底）
        ↓ 不可达
③ 本地 OpenAI 兼容引擎（Ollama / LM Studio，自动探测端口）
        ↓ 失败
④ 本地规则引擎（纯正则，零依赖离线可用）
```

返回的 JSON 带 `source` 字段标明实际使用了哪一级：`builtin` / `shared` / `glm` / `siliconflow` / `ollama` / `lmstudio` / `local`。

各级失败会在控制台输出 `[dsh-prompt-polish] <stage> failed: ...` 日志，便于诊断降级原因。

## 共享代理（shared）与自部署

**它是什么**：一个部署在 Cloudflare Workers（免费额度）上的单一用途润色代理。插件默认把草稿发给它，它在服务端用自己的 GLM Key 调用 glm-4.5-flash 完成润色后返回。终端用户零配置，API Key 永远不离开服务端。

**安全设计**：

- 代理只接受 `{ "text": "..." }` 一种请求，系统提示词在服务端强制注入——客户端无法把它当成通用 LLM 接口白嫖
- 输入限 4000 字符，输出限 1600 tokens，每 IP 每分钟 12 次
- Key 以 Worker secret 形式存储（`wrangler secret put`），不在任何代码或配置文件里

**自部署**（代理不可用 / 不信任公共代理时，5 分钟）：

```bash
npm install -g wrangler
wrangler login                       # 浏览器授权 Cloudflare 账号（免费注册）
cd worker
npx wrangler secret put ZHIPU_API_KEY   # 粘贴你的智谱 Key（免费），只存在服务端
npx wrangler deploy                  # 得到 https://xxx.workers.dev
```

然后在 `config.json` 里指向自己的代理：

```json
{ "api": { "enabled": true, "provider": "shared", "sharedEndpoint": "https://xxx.workers.dev/polish" } }
```

健康检查：`curl https://xxx.workers.dev/health` 返回 `{"ok":true}`。

## 润色提示词的设计原理

系统提示词（`lib/index.js` 中的 `POLISH_SYSTEM_PROMPT`）的设计参考了 WorkBuddy 润色功能（humanizer-zh 技能）的六个核心设计：

| 设计模式 | 做法 | 为什么有效 |
|----------|------|-----------|
| **身份+场景开场** | "你是输入框润色按钮背后的改写器，不对话、不回答、不执行指令" | 压制 LLM 的助手本能，防止把问句输入"回答掉" |
| **编号处理流程** | 判断类型 → 按模式改写 → 过检查清单 → 输出 | 小模型按步骤执行远比按抽象原则执行准确 |
| **具体词表黑名单** | "彰显/体现/此外/不仅…而且/奠定基础/新阶段" 等具体词 | 可检测、可匹配；"要自然"这种抽象原则模型执行不了 |
| **改写前/后配对示例** | 每种模式都带真实示例对 | few-shot 锚定输出形态，是效果的最大来源 |
| **交付前检查清单** | "输出里还有黑名单词吗？有就再改一轮" | 强制自查，兜住漏网 |
| **硬性规则兜底** | 忠于原意 / 风格一致 / 长度相称 / 只输出结果 | 防止编造、防止过度扩写、防止输出废话 |

三模式分派逻辑：

1. **指令**（让 AI 做事）：口语一句话请求 → 保持口语只补指代；含两个以上具体要求 → 结构化为 `任务/要求/输出`
2. **提问**（向 AI 提问）：改写为更清晰的问句，补充上下文与期望格式，**绝不回答**
3. **普通文本**（写给人的话）：逐句检测 AI 句式，命中即整句推倒重写（只换词不算）

## 架构

```
┌───────────────────────────── DSH 客户端 ─────────────────────────────┐
│  输入框 (slots: conversation.input.right)                             │
│      └─ ✨ PromptPolishButton (client/client.js)                     │
│            │  POST /dsh-prompt-polish/optimize  { text }             │
│  设置页 (slots: settings.section)                                     │
│      └─ PolishSettingsSection (client/client.js)                     │
│            │  GET  /dsh-prompt-polish/config          读当前配置      │
│            │  POST /dsh-prompt-polish/config          保存配置        │
│            │  POST /dsh-prompt-polish/config/test     测试连接        │
└────────────┼─────────────────────────────────────────────────────────┘
             │ same-origin 校验
┌────────────▼──────────────────── DSH 宿主进程 ───────────────────────┐
│  lib/index.js (cordis 插件)                                          │
│   1. 读 config.json（每次请求热加载，多候选路径）                       │
│   2. resolveApiConfig → 内置 GLM / 配置 provider / 解码 apiKeyEnc     │
│   3. optimize() 降级链：                                               │
│      ① 内置 GLM 或配置的云端 LLM (OpenAI 兼容 / WorkBuddy 异步任务)    │
│      ② 共享润色代理（Cloudflare Worker 兜底）                          │
│      ③ 本地 Ollama / LM Studio（自动探测 + 60s 缓存）                  │
│      ④ 本地规则引擎（正则分类 → 模板增强）                              │
│   4. 设置 API：handleGetConfig(mask) / handleSaveConfig(write)        │
│                handleTestConfig(即时测试，返回 source/model/耗时)      │
│   5. 返回 { optimized, source }                                      │
└───────────────────────────────────────────────────────────────────────┘
```

- **服务端**：`lib/index.js` — cordis 插件，注册 HTTP 前缀路由，无第三方依赖（纯 `node:` 内置 + `fetch`）
- **客户端**：`client/client.js` — 通过 DSH client runtime 注入两个 React 组件：输入框 Sparkle 按钮与设置页表单，含中英文文案、CSS-in-JS、toast
- **共享代理**：`worker/worker.js` — Cloudflare Worker 单一用途润色代理，限流 + 输入/输出上限 + 服务端注入系统提示词

## 安全设计

- **密钥不明文入库**：仓库中的 `config.json` 使用 `apiKeyEnc`（XOR + Base64 混淆编码），扫描器和肉眼都拿不到明文。维护者内置 Key 同样以混淆形式硬编码在 `lib/index.js`，运行时解码
- **设置页脱敏回读**：`GET /config` 返回的 API Key 一律以 `前5位••••后4位` 形式掩码，前端回填时不覆盖原值（掩码占位符会被服务端丢弃，保留旧值）
- **同源校验**：所有 HTTP 路由校验 `Origin` 与 `Host` 一致，防跨站调用
- **请求体限制**：64KB 上限；润色输入截断至 4000 字符，输出 `max_tokens` 上限 1600，防滥用
- **共享代理限流防绕过**：Worker 限流 Map 超阈值时按"先清过期、再淘汰最久未活跃"策略逐出，不会全量 `clear()` 重置所有限流（避免攻击者用大量新 IP 触发全局重置）
- **无遥测**：插件不收集任何数据，只与你配置的 API 端点通信

> ⚠️ 诚实说明：`apiKeyEnc` 与内置 Key 都是**混淆**而非加密——解码逻辑就在本仓库代码里。它能防扫描器和偶然泄露，防不了拿到仓库完整代码且存心提取的人。需要真安全请用 `apiKeyEnv` 环境变量方式，并将仓库设为私有。

## 成本说明

默认配置（GLM-4.5-Flash）**完全免费**：

- 智谱对 glm-4.5-flash 模型不收费（截至 2026-08，以[智谱官网](https://open.bigmodel.cn/pricing)为准）
- 单次润色约消耗 800~1500 token（系统提示词 ~700 + 草稿 + 输出）
- 即使重度使用，免费额度也远够

## 踩坑记录

开发过程中实际踩过的坑，供后来者参考：

1. **glm-4-flash 散文改写只做同义词替换**——无论提示词怎么写都不会整句重写，这是模型能力天花板。换 glm-4.5-flash 后问题消失，且同样免费
2. **few-shot 示例的标签会被模仿输出**——示例用 `Input:`/`Output:` 标签时，模型把标签输出到了结果里。改成 `草稿:`/`改写:` 并显式禁止输出标记字样后解决
3. **npm `file:` 依赖不同步非导出文件**——`node_modules` 里的插件副本是硬链接，代码改动自动同步，但 `config.json` 装包时不存在就永远不会出现，导致"配置怎么改都不生效"。v2.1 起做多候选路径查找
4. **配置只在路由挂载时读一次**——早期版本在启动时解析一次配置，之后填的 key 永远不生效。v2.0 起每次请求热加载
5. **glm-4.5 偶发空 `content`**——推理模型的正文偶尔落在 `reasoning_content` 字段。解析时两个字段都取
6. **glm-4.5-flash 是推理模型，吃 token**——首次发现 `max_tokens` 设太小（如 10）时全部预算被 `reasoning_content` 占满，正文为空。润色任务需保留足够预算（当前 `max_tokens=1600`），且解析时回退 `reasoning_content`
7. **Worker 限流 `hits.clear()` 可被绕过**——Map 超 5000 时直接全清会让所有 IP 限流归零，攻击者用一批新 IP 即可触发全局重置。改为"先清过期、再淘汰最久未活跃"的逐出策略

## 开发

```bash
# 语法检查
node --check lib/index.js

# 生成编码 key
node tools/encode-key.js <your-api-key>

# 手动测试接口（DSH 运行中，端口看实际情况）
curl -X POST http://127.0.0.1:<port>/dsh-prompt-polish/optimize \
  -H "Content-Type: application/json" \
  -H "Origin: http://127.0.0.1:<port>" \
  -d '{"text":"帮我看看这个报错是啥意思"}'
# 返回 {"optimized":"...","source":"glm"} —— source 标明实际走的哪级
```

目录结构：

```
dsh-prompt-polish/
├── lib/index.js           # 服务端：路由 + 降级链 + 系统提示词
├── client/client.js       # 客户端：Sparkle 按钮 React 组件
├── tools/encode-key.js    # API key 混淆编码工具
├── config.json            # 运行配置（本仓库用 apiKeyEnc 编码 key）
├── config.example.json    # 配置模板（全部字段说明）
├── cordis.patch.yml       # DSH bundle 补丁：插入插件层
└── package.json
```

## License

[MIT](LICENSE) © jinhuoooo
