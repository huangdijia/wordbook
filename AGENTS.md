# AGENTS.md

## 项目概览

这是一个纯静态 PWA 英文单词本，用于小学生按教材年级、册别和单元背单词。项目不依赖后端、数据库、构建工具或前端框架，核心运行时由浏览器直接加载静态文件完成。

- 入口页面：`index.html`
- 交互逻辑：`assets/js/app.js`
- 样式：`assets/css/style.css`
- 应用配置：`data/config.json`
- 词库数据：`data/words/*.json`
- PWA 配置：`manifest.webmanifest`、`sw.js`
- 产品与拆分文档：`docs/prd.md`、`docs/spec-plan.md`
- 部署 workflow：`.github/workflows/deploy-vercel.yml`

当前 `data/config.json` 覆盖沪教版（深圳）一至六年级、上下册、140 个单元；词库按册次拆在 `data/words/grade_<n><a|b>.json`。

## 工作原则

- 优先保持纯静态架构；不要主动引入框架、打包器、服务端、数据库或账号体系。
- 只改与当前任务直接相关的文件；不要顺手重构相邻代码、重排大段 JSON 或替换现有视觉风格。
- 面向儿童使用场景，交互要直观、按钮可点击区域要充足、错误提示要清楚。
- 变更前先确认 `docs/prd.md` 和 `docs/spec-plan.md` 是否已有约束；不要把后续版本能力提前做进 V1。
- 本仓库没有 `package.json` 或构建步骤。除部署 workflow 外，不要新增 Node 工具链配置，除非任务明确要求。

## 数据约定

`data/config.json` 负责应用配置、年级、册别、单元和练习模式：

- `app.defaultGrade`、`app.defaultVolume`、`app.defaultMode` 是默认入口配置。
- `grades[].volumes[].wordsFile` 指向当前册次的词库文件。
- `grades[].volumes[].units[].key` 与词库中的 `unitKey` 必须一致。
- `modes[].key` 当前只应使用已有的 `sequence` 和 `random`，除非任务明确要求扩展模式。

`data/words/` 下的按册次词库文件是词库数组，例如 `grade_1a.json` 表示一年级上册，`grade_1b.json` 表示一年级下册。命名规则中 `a` 表示上册，`b` 表示下册。每个单词必须包含：

```json
{
  "id": "g1-upper-u01-001",
  "unitKey": "unit1",
  "chinese": "喂，你好",
  "english": "hello",
  "sort": 1
}
```

维护词库时优先追加或修正具体册次文件中的条目，避免无关文件格式化造成巨大 diff。`sort` 控制顺序模式展示顺序，同一单元内应从 1 开始递增。

`phonetic` 是可选字段；存在时会显示在英文下方，不存在时前端会隐藏音标区域。

## 前端实现约定

- `assets/js/app.js` 使用原生 JavaScript 和全局状态对象；新增逻辑时保持简单函数拆分，不引入状态管理库。
- 选择器联动顺序是年级 -> 册别 -> 单元 -> 模式，切换范围后应重置当前单词和翻转状态。
- 用户选择通过 cookie `wordbookPracticeConfig` 保存；不要改成 `localStorage`，除非任务明确要求。
- 卡片正面展示中文，翻转后展示英文；切换单词、单元、册别、年级或模式后恢复正面。
- Service Worker 使用 `sw.js` 缓存应用壳。修改缓存文件或数据后，如需强制刷新线上缓存，应同步调整 `CACHE_NAME`。
- `sw.js` 的 `APP_SHELL` 目前显式列出所有预缓存静态资源和 12 个册次词库。新增词库文件或改动缓存范围时，要同步维护 `APP_SHELL`。
- 页面通过 `fetch` 加载 JSON，不保证 `file://` 方式可用。

## 样式约定

- 保持现有儿童友好的暖色、薄荷绿、圆角卡片和响应式单列体验。
- 继续使用 `assets/css/style.css` 中的 CSS 变量，不为小改动引入新的主题系统。
- 移动端优先保证按钮高度、卡片可读性和弹窗可操作性。
- 尊重 `prefers-reduced-motion`，新增动画时要有低动效 fallback。

## 验证方式

优先使用现有静态方式验证。至少先检查 diff 空白问题：

```bash
git diff --check
```

再启动本地静态服务：

```bash
python3 -m http.server 8080
```

然后访问 `http://localhost:8080` 做 smoke test，至少检查：

- 页面能正常加载标题、配置和词库。
- 年级、册别、单元、模式可以联动切换。
- 卡片点击可在中文和英文之间翻转。
- 上一个 / 下一个、完成弹窗和下一单元跳转可用。
- 当前单元无词或 JSON 加载失败时有明确提示。

数据变更后至少运行一次 JSON 解析检查：

```bash
python3 -m json.tool data/config.json >/dev/null
for f in data/words/*.json; do python3 -m json.tool "$f" >/dev/null; done
```

如果改动部署流程，同时检查 `.github/workflows/deploy-vercel.yml`。该项目当前通过 GitHub Actions 安装 Vercel CLI 并部署到 Vercel。
