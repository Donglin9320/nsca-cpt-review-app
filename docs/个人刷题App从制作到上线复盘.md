# 个人刷题 App：从制作、修复到上线

> 项目：NSCA-CPT 中文复习 App
> 整理日期：2026-10-11
> 当前部署代码：桌面 `NSCA资料/nsca-cpt-review-pages/`，GitHub 仓库 `Donglin9320/nsca-cpt-review-app`。
> 目的：记录实际做过的设计、配置、故障排查和验收方式，供下一款学习 App 复用。文中“已实现”以仓库代码为依据；第三方服务能否在此刻正常工作，仍须按末尾清单实测。

## 1. 成品与技术选型

正式入口：[Vercel 主站](https://nsca-cpt-review-app.vercel.app/)；代码：[GitHub 仓库](https://github.com/Donglin9320/nsca-cpt-review-app)。仓库 README 也列有 GitHub Pages 备用地址；备用静态站没有 Vercel 的 `/api/kimi` 函数，因此不能把它当成内嵌 AI 的等价入口。

| 层 | 使用的语言、平台和文件 | 职责 |
| --- | --- | --- |
| 页面 | HTML、CSS、原生 JavaScript；`index.html`、`styles.css`、`ui.css`、`app.js` | 刷题、反馈、错题本、重点页、手机布局 |
| 题库 | JSON 源数据；部署包 `data.js`、`study-guides.js` | 1,438 题、7 个学习单元、考点和配图 |
| 本机保存 | 浏览器 `localStorage`；`quiz-session.js` | 离线进度、错题、当前题、答题顺序 |
| 账号与云端 | Supabase Auth、PostgreSQL、SQL/RLS；`cloud-sync.js`、`supabase/migrations/001_study_progress.sql` | Google 登录与按用户隔离的进度 |
| AI | Node.js JavaScript；Vercel Serverless `api/kimi.js`；NVIDIA 托管推理 | 登录验证后代发模型请求，密钥留在服务端 |
| 离线与发布 | `manifest.webmanifest`、`sw.js`、`vercel.json`；GitHub + Vercel | PWA、缓存、HTTPS 与部署 |
| 可选邮件自动化 | n8n JSON 工作流、Node.js/SQL；`n8n/` | 每日提醒、每周错题总结；目前只是待启用配置 |

这里的“开源模型”指可获取开放权重的模型通过 NVIDIA 托管接口运行；模型并未安装在用户电脑或 Vercel 服务器上。历史上曾接 Dify 本地知识库，也试过 Moonshot/Kimi 与 GLM。当前 `api/kimi.js` 的默认模型是 `moonshotai/kimi-k3`，但 Vercel 的 `NVIDIA_MODEL` 环境变量可以覆盖它。路由名 `/api/kimi` 是历史名称，不能用它判断当时实际调用哪个模型。

## 2. 制作过程：下一款 App 可按此顺序复刻

1. **明确学习任务。** 定义单元、题型、每日目标、错题处理和反馈。此项目采用 7 个学习单元、每天 150 次作答的目标；这些单元不是 NSCA 官方考试的 7 个领域。
2. **清点源文件。** 记录每份教材/题库的格式、版本、页数、能否抽取文字、来源和许可。早期使用 Python 与 PyMuPDF (`fitz`) 抽取题库 PDF，脚本位于邻近的早期素材目录 `nsca-cpt-review-app/scripts/build_data.py`。部分教材是扫描件，部分视频只是下载占位文件，不能把它们描述成已完整阅读。
3. **先定题目数据结构。** 每题至少有稳定 `id`、`unit`、`question`、`choices`、`answer`、`explanations`；图片可作为附加字段。稳定 ID 很重要：改 ID 会让已保存的作答、错题和队列无法匹配原题。
4. **对题库做两种审核。** 早期目录的 `scripts/audit_data.mjs` 可查重 ID、缺选项、答案标签、解析字段、文字空格和图片引用；人工还须逐题核对知识事实、教材出处、错误选项的真实作用和中文表达。字段齐全绝不等于解析正确。别直接重跑旧版 `build_data.py` 覆盖当前部署的 `data.js`；先在副本生成、比对题目 ID 和内容，再审查合并。
5. **先实现核心闭环。** 原生 HTML/CSS/JS 做题目、四选项、提交后正确/错误状态、解析、下一题、错题本。每次答错立即写本地存储；手机上题目和下一题优先可操作。
6. **加入学习反馈。** XP、连答、里程碑和 150 题进度在答题后立即更新；错误也给予学习反馈，同时进错题本。视觉颜色之外保留“答对了/答错了”等文字，减少动效偏好下仍能读到状态。
7. **先让静态版稳定运行。** `data.js` 预置题库，避免每次加载都依赖远程抓取；`sw.js` 缓存页面、脚本和必要图片。静态本地版可刷题，但 Google OAuth 和同源 `/api/kimi` 必须在合适的 HTTP/HTTPS 环境使用。
8. **再接账号与数据库。** 运行 `supabase/migrations/001_study_progress.sql`，启用 RLS；创建 Google Web OAuth 客户端，把 Google 回调配进 Supabase，把正式网址配进 Supabase 重定向。登录后按 Supabase 用户 UUID 绑定本地缓存和云端进度。
9. **最后接内嵌 AI。** 将 `NVIDIA_API_KEY` 等服务端变量配在 Vercel；前端只向同源 `/api/kimi` 发当前题目提示和 Supabase access token。服务端先验证用户，再请求 NVIDIA。外部 AI 菜单只作备用追问入口。
10. **部署并做真实验收。** GitHub `main` 推送触发 Vercel；测试新浏览器首次打开、Google 登录、答题同步、刷新恢复、错题重做、AI 成功与失败、手机尺寸、离线缓存。部署成功状态只证明构建发布完成。

## 3. 进度与账号如何工作

`study_progress` 表以 `user_id` 为主键，`progress jsonb` 保存作答、错题、游戏进度和答题会话。迁移 SQL 为 SELECT、INSERT、UPDATE、DELETE 设置 `auth.uid() = user_id` 的 RLS 策略；前端可持有 Supabase publishable key，数据库密码与 `service_role` 密钥不能进入浏览器或 GitHub。

作答时先写 `localStorage`，再异步同步云端。`cloud-sync.js` 在选择账号后加载对应缓存，序列化上传，按 `_ownerId` 阻止 A 账号的快照上传到 B 账号；同页并发 token 刷新只发一次。`quiz-session.js` 保存题目 ID 顺序、当前位置、模式和当前选择，使刷新后不重新 shuffle。换单元或模式时重新建队列是预期行为；旧记录若从未保存队列，无法还原当时随机顺序。

同步仍采用“比较更新时间，选择较新的整份快照”，不是跨设备逐题合并。因此两个设备同时离线作答可能产生覆盖；退出账号时会先尝试上传最新进度，上传失败则保持登录并提示重试。游客浏览器数据不会自动归给某个 Google 账号。

## 4. 我们碰到的 Bug 与修复记录

下面的“验证”主要指仓库回归测试及当时的本地/部署检查；不是 2026-10-11 对每项线上服务的重新实测。尤其是“已显示登录，但同步失败”，表中的空响应解析与写入竞态是代码中找到并修复的失败路径，不能据此断言用户当时每次失败都只有这一种原因。

| 症状 | 查明的原因或定位方法 | 修复 / 在新项目中怎么避免 | 可复查的证据 |
| --- | --- | --- | --- |
| `localhost:4173` 打不开或显示 `Failed to fetch` | 临时本地服务器退出，或题库 JSON 未按当前入口正确加载 | 使用可运行的本地 HTTP 服务并确认进程仍在；发布包包含 `data.js`，先检查 Network 中丢失的是哪个资源 | `app.js` 的 `loadData()` / `loadEmbeddedData()`；`data.js` |
| 离线首次刷新报 `Unexpected token '<'` | Service Worker 把 `index.html` 当成丢失 JS 请求的兜底响应 | 把所有入口脚本列入 App Shell；仅对导航请求回退到 HTML；更新缓存版本 | `sw.js`；提交 `bcfb71d` |
| Google 登录返回 `Unsupported provider: provider is not enabled` | Supabase Google provider 未真正完成配置；只打开开关、Client ID/Secret 仍空不能完成 OAuth | Google Cloud 建 Web OAuth 客户端；将 Supabase 显示的 callback URI 填入 Google 授权重定向，再把客户端 ID/Secret 填入 Supabase 并保存；测试账号如处于 Testing 模式需加入测试用户 | `cloud-sync.js` 的 `signInWithGoogle()`；[Supabase 指南](https://supabase.com/docs/guides/auth/social-login/auth-google) |
| Google 回调出现 `redirect_to=file://...` | 直接双击本地 HTML 启动了 OAuth，文件 URL 不是合适的网页登录回调 | 用正式 HTTPS 网站登录；在 Supabase URL Configuration 配好 Site URL 和允许的 Redirect URL；代码阻止 `file://` 登录并显示说明 | `cloud-sync.js`；`tests/auth.test.cjs` |
| Supabase 首页显示 `No repository connected` | 这是项目没有连接 Git 仓库的仪表盘提示，与 Auth provider 或 RLS 不是同一个设置 | 排查登录时看 Authentication > Providers、URL Configuration 和浏览器请求；排查同步时看 `study_progress` 和 RLS | Supabase 控制台设置；对应的 Auth/REST 请求 |
| 已显示登录，但答题后“同步失败” | 旧代码把 `return=minimal` 的成功写入当成仍有 JSON body，或多次写入/账号切换发生竞态 | 成功的空响应不再强制 `response.json()`；按顺序上传、对账号校验、失败保留本地快照并显示错误 | `cloud-sync.js`；`tests/auth.test.cjs`；提交 `ff1d09d`、`73c59ed` |
| 刷新或重新登录后题目又随机排列 | 只保存了错题和答题次数，没保存队列顺序、当前题与模式 | 将会话快照一起写入当前账号的 `progress`，恢复时以题目 ID 重建队列 | `quiz-session.js`；`tests/quiz-session.test.cjs` |
| 内嵌 AI 显示 `410 ... model ... end of life` | 当时调用的 `z-ai/glm-5.2` 在 NVIDIA 端点下线；模型 ID 会随服务改变 | 检查提供商的当前可用模型和本账号权限；修改默认值或 Vercel `NVIDIA_MODEL`，重新部署后以真实请求验证 | `api/kimi.js`；提交 `ff1d09d` |
| 切换 Kimi 后收到 `400: top_p ... must be 0.95, got 1` | Kimi K3 在该托管端点要求固定 `top_p`，旧请求沿用 GLM 参数 | 针对模型设置兼容参数；Kimi K3 用 `top_p: 0.95`、`reasoning_effort: low`；增加请求体回归测试 | `api/kimi.js`；`tests/ai.test.cjs`；提交 `6806864` |
| AI 有时转很久、空白或超时 | 第三方模型延迟、响应体卡住、超出输出上限、Auth 或网关出错都可能造成相似表象 | 服务端模型请求 45 秒上限，浏览器包括读取 body 在内 55 秒上限；`finish_reason=length` 不当完整答案；显示可重试的错误 | `api/kimi.js`、`app.js`；`tests/ai-ui.test.cjs` |
| 重复问同题慢且浪费调用 | 每次点击都走第三方模型，同页可能并发重复请求 | 每账号按完整提示词缓存成功答案 24 小时，最多 50 条；同页同题共享进行中的请求；网络或明确的 502/503 最多重试一次，超时/401/配额错误不盲目重试 | `app.js` 的 `AI_CACHE_VERSION`；`tests/ai-resilience.test.cjs`；提交 `3670f90` |
| 解析只有“与本题考点不符” | 批量生成模板满足字段存在，但没有说明误选项的真实作用 | 要求每个选项说明概念、作用、题干条件及与正确项的差别；人工抽样和高风险题逐项审校；AI 追问要能指出题库答案可能有歧义 | 早期 `scripts/audit_data.mjs` 只能做结构检查；现有解析质量仍需继续人工复核 |
| 重点页把心电图和图中示意当成必考规律 | 旧学习重点与图解存在过度概括，用户供图含不通用的力臂结论 | 按官方 4 个领域重排 7 个学习单元；心电图波形降为补充；三张原图前写清力臂/平面/卧推的限制 | `study-guides.js`、`STUDY_CONTENT_AUDIT.md`；提交 `ad9a954` |
| 手机上文字层级乱、状态边框太浅 | 正文、提示、警告权重相近，正确/错误状态不醒目 | `ui.css` 统一排版、对比度、圆角和有限阴影；正确/错误选项保持清楚颜色与边框；减少动效时仍保留静态反馈 | `ui.css`、`tests/ui.test.cjs`；提交 `56d9ee6` |

**排查顺序：**先记录具体网址、账号状态、题号、操作和时间；再看浏览器 Network 的请求 URL、状态码、响应正文；如果是登录/同步，分别查 Supabase Auth 与 `study_progress`；如果是 AI，查 Vercel `/api/kimi` 日志和提供商响应。模型 401/403、410/404、429、504 含义不同，应结合返回正文判断。不要把 Supabase 的 Git 连接提示当成登录错误，也不要因 Vercel 显示 Ready 就判定第三方模型可用。

## 5. 当前 AI 请求路径与稳定性

```text
用户点击“询问 AI 助教”
    -> 浏览器取得当前 Supabase access token
    -> POST /api/kimi（只发送当前题目提示）
    -> Vercel 函数向 Supabase /auth/v1/user 验证用户
    -> Vercel 使用 NVIDIA_API_KEY 调用托管模型
    -> 返回可显示的最终答案；浏览器按账号缓存成功回答
```

当前服务端配置在 `api/kimi.js`：`SUPABASE_URL`、`SUPABASE_PUBLISHABLE_KEY`、`NVIDIA_API_KEY` 必需；`NVIDIA_MODEL` 可选，默认 `moonshotai/kimi-k3`。这几个值中只有 publishable key 和 URL 可放前端；NVIDIA Key 不可。服务端验证 Supabase 用户最多 8 秒，模型请求最多 45 秒，Vercel 函数上限 60 秒；浏览器总等待上限 55 秒。重试只针对有限的瞬时失败，并共享总时限。加缓存可明显缩短**重复问题**的体感时间，但不会保证第一次生成的速度或提供商始终在线。

服务端写入不含提示词、邮箱、token 的 `ai_request` 结构化日志，包含失败阶段、状态码和耗时。导出 JSONL 后可运行 `node scripts/summarize-ai-logs.cjs < ai-events.jsonl` 统计请求成功率、超时和耗时；请先脱敏，日志也不代表缓存命中次数。

## 6. Google、Supabase 与 Vercel 的配置模板

1. 在 Supabase 建项目，运行 `supabase/migrations/001_study_progress.sql`，确认表与 RLS 策略存在。
2. Google Cloud 配好 OAuth consent screen，创建类型为 **Web application** 的 OAuth Client。授权重定向 URI 填 **Supabase 控制台该 provider 显示的 callback URL**，不是 Vercel 首页，也不是本机文件路径。
3. Supabase Authentication > Providers > Google 填该 Client ID 与 Client Secret，打开开关并保存。Secret 只留在 Supabase。
4. Supabase Authentication > URL Configuration 中，Site URL 和允许的 redirect URL 填正式 HTTPS 站点；测试环境只添加实际使用的精确 URL。
5. 前端 `cloud-config.js` 放该 Supabase 项目 URL 和 publishable key；Vercel Production 环境变量放同一个项目的 URL/public key，以及 NVIDIA Key。修改 Vercel 环境变量后重新部署。
6. Vercel 导入 GitHub 仓库：Root Directory 使用仓库根目录，静态站无额外构建命令，`vercel.json` 配置两个函数的 60 秒上限及 `sw.js` 缓存头。
7. 登录后以用户 UUID 检查数据库；答一题并等待“已同步”，刷新或换设备登录同一账号，确认题序、当前位置和错题都恢复。

不要把真实 API Key、OAuth Secret、数据库密码写进 Markdown、截图、网页源码或提交记录。Google 登录解决身份识别；它不自动让两个浏览器的 `localStorage` 合并，云同步仍要正常完成。

## 7. PWA、本地版本和手机体验

`sw.js` 的 App Shell 包含页面、CSS、JS、题库和必要图片。新资产加入后要更新缓存版本，并在全新浏览器测试“首次联网打开，随后断网刷新”；如果 JS 请求收到了 HTML，优先查 Service Worker 的导航回退条件。离线答题保存在本机；重新联网并完成认证后才可能同步到 Supabase。

用 Android Chrome 打开正式 HTTPS 主站，可从菜单选择“安装应用/添加到主屏幕”。Android Studio 不是网页/PWA 的必备环节。临时 `localhost` 服务或免费隧道适合开发，不适合长期分享；直接双击 `index.html` 可查看部分静态内容，但 `file://` 不能承载当前的 OAuth 和 Vercel 同源 AI 路由。

UI 复用准则：题目、选项和下一题在窄屏上最重要；页面标题、分组标题、正文、警告分级；警告保持足够对比度；不要整页加粗。小范围使用圆角与阴影 token；减少动效时停掉非必要动画但保留答题和加载状态文字。题目的正确/错误边框和文字应同时传达结果。320、390、768、1024、1440 px 等视口只是回归样本，仍须在真实手机检查长题干、图片和键盘导航。

## 8. 内容质量与配图

当前 `data.js` 有 1,438 道题。数据层保留每个选项的解析，答题界面主要显示正确答案理由与用户误选理由；是否每项解释都准确，不能靠字段存在或 42 项自动测试证明。要用于新学科，先建立“概念、作用、适用条件、来源”的审校表，再检查每个错误选项到底错在哪里。遇到“铁 vs 钾”之类选项，应分别说明氧运输与神经肌肉功能，再解释题干为什么指向其中一项。避免“不是本题答案”这种空泛句。

本项目的 `study-guides.js` 依据 [NSCA 详细大纲](https://www.nsca.com/globalassets/certification/certification-pdfs/nsca-certified-personal-trainer-job-task-analysis-summary-2025)整理七个学习单元；官方考试只有四个领域，不能保证某一题“必考”。用户提供的三张力臂、运动平面和卧推图片保留原貌；图片前有纠正说明，因为其中“手臂伸直外力臂最大”“卧推从上往下必然越来越难”等示意不具普遍性。移植到新 App 时，图片来源、授权和科学准确度仍要另查。

## 9. n8n 与其他服务目前的位置

用户选择登录邮箱接收提醒，温哥华时间每天 20:00 提醒 150 题目标、每周日 18:00 发错题总结。仓库 `n8n/daily.json`、`weekly.json`、`notifications.sql` 和 `api/study-notifications.js` 已准备，但 `n8n/README.md` 明确写着：没有 n8n 实例、SMTP、迁移和真实邮件验收，工作流未激活。新项目只有在取得接收同意、邮件通道和实例后，才能按该 README 完成配置与发送测试。

Trigger.dev 曾作为长时间后台生成任务的备选方案，DigitalOcean 曾作为自托管 n8n 的备选服务器；两者不是当前刷题主路径，也没有证据表明已部署。Dify 早期在 Mac 本地试过知识库/Chatflow，当前内嵌助教通过 Vercel 和 NVIDIA 调用；本机 Dify 地址不能直接供异地手机访问。

## 10. 下次发布前的验收清单

在部署仓库根目录运行（先确保 Node.js 的 `node` 已在 `PATH`；本机这次使用 Codex 自带的 Node 可执行文件完成测试）：

```sh
node --test tests/*.test.cjs
git diff --check
```

然后在一个**新的浏览器会话**执行以下端到端流程：

1. 确认 Vercel 的 Production 部署指向预期 Git 提交，页面实际加载该版本的 JS 和 Service Worker。
2. 以 Google 登录；检查回跳网址正确，不含 `file://`，并确认 Supabase 当前用户 UUID。
3. 切随机模式做题、答错一题、看正确/错误边框和解析；刷新后检查题序、当前题与错题本。
4. 等待“已同步”；在另一设备用**同一账号**登录，核对该题进度。再切换不同账号，确认没有串数据。
5. 提问 AI 一次，确认最终答案可见；重复同题检查缓存，再用不同题确认首次调用；测试无登录、模型错误、限流、超时的用户提示。
6. 手机上检查长题干、配图放大、正文/警告、底部导航；切换系统减少动效。PWA 首次打开后断网刷新，重新联网再同步。
7. 若启用 n8n，先用单个明确同意的账号测试收件、去重、发送日志和停用流程，再启用定时计划。

本文件更新时核对了当前代码、SQL、n8n README、提交历史与现有测试；没有在本轮重新操作真实 Google 账号、Supabase 数据库、Vercel 密钥、NVIDIA 模型或发送邮件。下一款 App 可以复用架构和检查方法，不能复用旧模型的可用性结论或将 NSCA 题目审核结果当作新学科的事实保证。

## 11. 可直接交给下一位开发者的任务说明

```text
请参考这份复盘，为我制作一款新的个人学习 App。先盘点我提供的资料，标明无法读取或尚未验证的文件，再建立稳定的题目 ID 和逐选项解析的数据结构。先完成本地刷题、自动错题本、进度恢复和手机界面；如需跨设备，再用 Google OAuth、Supabase RLS 和按账号隔离的同步。如需内嵌 AI，用服务端函数保存密钥，明确模型 ID、参数、超时与错误提示。按本文第 10 节逐项验收，并区分代码测试与真实服务测试。请列出新项目特有的教材来源、权限和内容审核方法。
```
