# 子 PRD · M6 文件系统集成

> 所属整体 PRD：`docs/PRD.md` 第 6 节
> 对应任务：T8
> 状态：已完成

## 1. 背景与目标

文档以本地 `.md` 文件存储，通过 Tauri 文件系统直接读写磁盘，实现「文档即文件」。本模块负责新建/打开/保存文档，以及文档树与磁盘目录的同步，替代当前 `src/stores/document.ts` 中的内存 mock 数据源。

## 2. 需求详述

### 2.1 核心能力

- **新建文档**：通过「另存为」对话框选择路径，创建新的 `.md` 文件（初始为空内容），加入文档树并激活。
- **打开文档**：通过文件选择器打开已有 `.md` 文件，读取内容 → 解析为块 → 渲染。
- **保存文档**：将当前文档的块序列化回 Markdown 源码，写回磁盘（Ctrl/Cmd+S 或工具栏「导出」按钮）。
- **打开目录/工作区**：选择目录作为文档树根，递归扫描其中 `.md` 文件，构建目录树展示。

### 2.2 数据流

```
磁盘 .md 文件 ──读──► 解析 ──► Block[] ──► 渲染
                                    ▲
                                    │ 编辑
Block[] ──序列化──► Markdown 源码 ──写──► 磁盘 .md 文件
```

- 文档加载：读文件 → 解析为块 → 渲染。
- 文档保存：块 → 序列化为源码 → 写文件。

### 2.3 数据模型

`DocNode` 新增 `path` 字段（磁盘绝对路径），仅文件节点需要；目录节点通过 `children` 递归组织：

```ts
interface DocNode {
  id: string;
  name: string;          // 展示名（不含 .md 扩展名）
  type: "dir" | "file";
  path?: string;         // 文件/目录磁盘绝对路径
  pinned?: boolean;
  children?: DocNode[];
  content?: string;      // 已加载的 Markdown 源码（懒加载）
  updatedAt?: number;
}
```

Rust 侧目录扫描返回的 `FsNode` 与之一一对应：

```rust
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct FsNode {
  name: String,      // 不含 .md 扩展名
  path: String,
  is_dir: bool,
  children: Vec<FsNode>,
}
```

### 2.4 Tauri 实现

- **文件对话框**：使用官方 `tauri-plugin-dialog`（前端调用 `open` / `save` 获取路径）。
- **文件读写与目录扫描**：自写 Rust 命令，直接使用 `std::fs`，避免 `plugin-fs` 的路径级权限复杂度：
  - `read_text_file(path: String) -> Result<String, String>`
  - `write_text_file(path: String, content: String) -> Result<(), String>`
  - `list_md_files(root: String) -> Result<Vec<FsNode>, String>`（递归扫描，仅收集 `.md`，忽略隐藏目录）
- **权限**：在 `capabilities/default.json` 增加 `dialog:default`。

### 2.5 环境降级（浏览器 dev）

`tauri dev` 环境走 Tauri 正路；纯浏览器 `pnpm dev`（无 Tauri 运行时）通过 `isTauri()` 检测降级：

- 打开文件 → `<input type="file">` + `FileReader` 读内容。
- 保存 → 内存缓存 + `Blob` 下载。
- 目录扫描 → 返回空（浏览器无文件系统遍历能力）。

### 2.6 交互与状态

| 入口 | 动作 | 说明 |
|------|------|------|
| 功能栏「新建」 | `pickSaveFile` → 写入空文件 → 加入文档树并激活 | 新建后进入 `idle`，输入内容发送即可 |
| 功能栏「打开」 | `pickOpenFile` → 读文件 → 加入文档树并激活 | 已存在则直接切换 |
| 功能栏「打开目录」 | `pickDirectory` → `list_md_files` → 重建文档树 | 文档树与磁盘目录同步 |
| 渲染区「导出」 | 写回当前文档到磁盘 | 等价于保存 |
| `Cmd/Ctrl+S` | 保存当前文档 | 全局快捷键 |

## 3. 验收标准

- [x] 能新建、打开、保存 `.md` 文件。
- [x] 保存后磁盘文件内容正确（块序列化无损）。
- [x] 文档树正确反映磁盘目录结构。
- [x] 权限配置齐全，无权限报错。

## 4. 涉及任务

- T8：实现 Tauri 文件系统读写（新建/打开/保存）。

## 5. 变更记录

| 日期 | 说明 |
|------|------|
| 2026-10-20 | 初稿：文件读写、数据流、Tauri 命令与权限 |
| 2026-10-20 | 细化：数据模型（DocNode.path / FsNode）、命令签名、环境降级、交互入口 |
| 2026-10-20 | 完成：Rust 命令 + dialog 插件 + fs 服务层 + store 接入 + UI 接线，cargo check 与 vue-tsc 通过 |
