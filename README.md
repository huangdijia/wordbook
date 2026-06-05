# 英文单词本

一个面向小学生的纯静态英文单词卡片 PWA。页面按年级、册别和单元组织词库，默认显示中文释义，点击卡片后翻转显示英文，适合家长维护词库、孩子日常背诵。

## 功能特性

- 支持沪教版（深圳）一至六年级、上下册、单元化词库。
- 支持顺序模式和随机模式。
- 支持中文 / 英文卡片翻转、上一个 / 下一个和进度展示。
- 支持练习完成后跳转到下一单元。
- 使用 cookie 记住上次选择的年级、册别、单元和模式。
- 支持 PWA 安装和离线缓存。
- 无需后端、数据库或构建工具，可直接静态部署。

## 项目结构

```text
.
├── index.html                 # 页面入口
├── assets/
│   ├── css/style.css          # 页面样式
│   ├── js/app.js              # 前端交互逻辑
│   └── icons/                 # PWA 图标
├── data/
│   ├── config.json            # 应用、年级、册别、单元和模式配置
│   └── words/                 # 按册次拆分的单词数据
│       ├── grade_1a.json      # 一年级上册
│       └── grade_1b.json      # 一年级下册
├── docs/
│   ├── prd.md                 # 产品需求文档
│   └── spec-plan.md           # Spec 拆分计划
├── manifest.webmanifest       # PWA manifest
└── sw.js                      # Service Worker
```

## 本地预览

由于页面通过 `fetch` 读取 JSON 文件，不建议直接用 `file://` 打开。请在项目根目录启动静态服务：

```bash
python3 -m http.server 8080
```

然后访问：

```text
http://localhost:8080
```

## 维护词库

### 修改年级、册别和单元

编辑 `data/config.json`：

- `app.title` 和 `app.subtitle` 控制页面标题和副标题。
- `app.defaultGrade`、`app.defaultVolume`、`app.defaultMode` 控制默认练习范围。
- `grades[].volumes[].wordsFile` 声明当前册别对应的词库文件。
- `grades[].volumes[].units[]` 控制年级、册别和单元选项。
- `modes[]` 当前包含 `sequence`（顺序模式）和 `random`（随机模式）。

### 修改单词

编辑 `data/words/` 下对应册次的 JSON 文件，例如一年级上册为 `data/words/grade_1a.json`，一年级下册为 `data/words/grade_1b.json`。每个单词包含以下字段：

```json
{
  "id": "g1-upper-u01-001",
  "unitKey": "unit1",
  "chinese": "喂，你好",
  "english": "hello",
  "phonetic": "/həˈləʊ/",
  "sort": 1
}
```

字段说明：

| 字段 | 说明 |
| --- | --- |
| `id` | 单词唯一 ID |
| `unitKey` | 所属单元，对应 `config.json` 中的单元 `key` |
| `chinese` | 卡片正面显示的中文释义 |
| `english` | 卡片翻转后显示的英文 |
| `phonetic` | 可选，英文下方显示的音标 |
| `sort` | 顺序模式下的排序值 |

修改数据后可运行：

```bash
python3 -m json.tool data/config.json >/dev/null
for f in data/words/*.json; do python3 -m json.tool "$f" >/dev/null; done
```

## 开发约定

- 保持纯静态实现，不主动引入框架、打包器、后端或数据库。
- 词库和配置变更尽量保持小 diff，避免无意义全文件格式化。
- 修改缓存资源后，如需让线上用户尽快更新离线缓存，请同步调整 `sw.js` 中的 `CACHE_NAME`。
- 更详细的协作约定见 `AGENTS.md`。
