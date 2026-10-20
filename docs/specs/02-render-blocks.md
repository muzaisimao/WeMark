# 子 PRD · M2 Markdown 渲染与块级切分

> 所属整体 PRD：`docs/PRD.md` 第 6 节
> 对应任务：T3、T4
> 状态：设计中

## 1. 背景与目标

渲染区需要把 Markdown 文档渲染成一组**内容块**，每个 Markdown 块级元素（标题/段落/列表/代码块/图片/表格/引用/Mermaid 图表）都是独立块，可单独点击、单独编辑。这是块级往返编辑（M3）的基础。

## 2. 需求详述

### 2.1 解析与渲染管线

- 选型：**unified 生态**（`remark-parse` → `remark-gfm` → `remark-rehype` → `rehype-*`）得到 HTML；再按块级节点切分为 `Block`。
- 备选：markdown-it（token 流切块）。**搭建阶段定案**，需满足「按块级元素切分且 `source` 可回填」的需求。

### 2.2 块级切分

- 切分粒度：**每个块级元素**一个 Block（见 `docs/PRD.md` 第 3 节）。
- 每个 Block 生成唯一 `id`（如 `nanoid`），并保留 `source`（原始源码）与 `type`。
- 切分须保证 `source` ↔ 渲染结果一一对应：编辑后由 `source` 重新解析，原位替换。

```ts
type BlockType =
  | 'heading' | 'paragraph' | 'list' | 'code'
  | 'image' | 'table' | 'blockquote' | 'mermaid' | 'hr';
```

### 2.3 GFM 支持

标题（1–6 级）、段落、有序/无序列表、任务列表、代码块（带语言标注）、行内代码、图片、表格、引用、链接、删除线、分隔线。

### 2.4 代码高亮

- 选型 Shiki 或 highlight.js（搭建阶段定案），对代码块按语言高亮。

### 2.5 Mermaid 图表（pele.js）

- 识别 `` ```mermaid `` 代码块。
- 用 pele.js 的 `render()` 将 Mermaid 语法转为主题化 SVG 并内联渲染。
- 图表作为独立 Block（`type='mermaid'`），可点击回填源码编辑（与 M3 打通）。

## 3. 验收标准

- [ ] 完整 GFM 语法正确渲染。
- [ ] 每个块级元素被正确切分为独立 Block，且 `source` 可回填。
- [ ] `` ```mermaid `` 代码块由 pele.js 渲染为 SVG。
- [ ] 代码块按语言高亮。

## 4. 涉及任务

- T3：接入 Markdown 解析管线（GFM）并按块级元素切分。
- T4：接入 pele.js 渲染 Mermaid 图表（依赖 T3）。

## 5. 变更记录

| 日期 | 说明 |
|------|------|
| 2026-10-20 | 初稿：解析管线、块级切分、GFM、代码高亮、pele.js |
