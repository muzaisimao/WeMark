# WeMark

> 一款仿 macOS 微信界面、以「聊天」形式编辑 Markdown 的桌面编辑器。

WeMark 把 Markdown 文档当作「聊天记录」来组织——文档由一个个**内容块**（block）组成，像一条条消息一样被渲染、被点选、被原位修改。点击渲染区的任意块，它的 Markdown 源码回到底部编辑区，修改后发送即**原位更新**，而不是追加到文档末尾。

## 特性

- **聊天式编辑**：四栏布局严格仿照 macOS 微信——功能栏 / 文档列表 / 渲染区（聊天记录区）/ 编辑区（聊天输入区）。
- **块级往返编辑**：标题、段落、列表、代码块、图片、表格、引用、Mermaid 图表等每个块级元素都可单独点击、单独编辑、原位更新。
- **文档即文件**：文档以本地 `.md` 文件存储，通过 Tauri 文件系统直接读写磁盘，无数据库。
- **完整 GFM**：标题、列表、任务列表、代码高亮（Shiki）、表格、引用等；Mermaid 图表由 [pele.js](https://github.com/CatVinci-Studio/pele) 渲染，体积更小、速度更快。
- **微信式细节**：文档置顶、树级展开、搜索（文档名 + 文档内容）、草稿箱、深色 / 浅色主题、可调字号。

## 技术栈

| 层 | 技术 |
|----|------|
| 桌面壳 | [Tauri 2.0](https://tauri.app/)（Rust 后端 + 系统 WebView） |
| 前端框架 | Vue 3 + TypeScript（`<script setup>` 组合式 API） |
| 构建工具 | Vite |
| 状态管理 | Pinia |
| Markdown 解析/渲染 | unified 生态（remark + remark-gfm + remark-rehype） |
| 图表渲染 | pele.js |
| 代码高亮 | Shiki |
| 包管理器 | pnpm |

## 界面结构

从左到右的四栏布局：

1. **功能栏**：功能图标 + 设置入口。
2. **文档列表栏**：文档列表（置顶 / 树级展开）+ 顶部搜索框。
3. **渲染区（聊天记录区）**：渲染 Markdown 文档，右上角工具栏。
4. **编辑区（聊天输入区）**：编辑 Markdown，底部工具栏提供常用格式快捷操作与图片上传。

## 开发

### 环境要求

- [Node.js](https://nodejs.org/) 20+（LTS）
- [Rust](https://www.rust-lang.org/) stable（1.77+）
- [pnpm](https://pnpm.io/)（推荐）
- Tauri 平台依赖（见 [Tauri 前置要求](https://tauri.app/start/prerequisites/)）

### 安装与运行

```bash
# 安装依赖
pnpm install

# 启动开发模式（同时启动 Vite 与 Tauri 窗口）
pnpm tauri dev

# 仅前端类型检查 + 构建
pnpm build

# 打包桌面应用
pnpm tauri build
```

### 目录结构

```
we-mark/
├── src/               # Vue 前端源码
├── src-tauri/         # Tauri(Rust) 后端
├── docs/              # 需求文档（PRD 与子 PRD）
├── index.html
├── package.json
└── vite.config.ts
```

## 构建与发布

本项目通过 GitHub Actions 自动构建跨平台安装包。推送 `v*` 标签（如 `v0.1.0`）会触发构建，产物以 Release 附件形式发布到对应版本。

```bash
git tag v0.1.0
git push origin v0.1.0
```

## 许可证

[MIT](./LICENSE)
