# 子 PRD · M8 渲染器迁移

> 所属整体 PRD：`docs/PRD.md` 第 6 节（V1.1）
> 对应任务：T12
> 状态：设计中

## 1. 背景与目标

当前渲染/分块基于 `markdown-it`：`src/markdown/parser.ts` 通过手写 token 状态机做块级切分，`highlight.js` 做代码高亮。该方案的痛点：

- **块级切分脆弱**：markdown-it 的 token 是扁平列表（含嵌套），块边界靠手写 open/close 栈判断，遇到**列表嵌套代码块、表格、引用嵌套**等复杂结构容易切错。
- **代码高亮质感一般**：highlight.js 输出样式较单一。

目标：迁移到 **unified + remark 生态**，用 **mdast 树**做结构化分块，用 **Shiki** 做高质感代码高亮，同时**保持对外接口不变**（`splitBlocks(content): Block[]`），上层 store 与组件无感。

## 2. 需求详述

### 2.1 技术方案

| 环节 | 方案 |
|------|------|
| 解析 | `remark-parse`（产出 mdast） |
| GFM | `remark-gfm`（表格、任务列表、删除线、自动链接） |
| 分块 | mdast `root.children` 的每个节点 = 一个 Block，**天然结构化，无需手写栈** |
| 渲染 | `remark-rehype` + `rehype-stringify` |
| 代码高亮 | `@shikijs/rehype`（Shiki，主题化、token 级高亮） |
| Mermaid | 沿用 `pele`（Mermaid 语法 → SVG） |
| 数学（预留） | 不纳入 T12，后续按需 |

### 2.2 数据模型（不变）

`Block` 结构保持不变，`splitBlocks` 签名不变：

```ts
interface Block {
  id: string;
  source: string;   // 该块 Markdown 源码（由 mdast 节点 position 截取）
  type: BlockType;  // heading/paragraph/list/code/image/table/blockquote/mermaid/hr
  html: string;     // 单块渲染后的 HTML
}
```

### 2.3 分块规则

- `root.children` 依次遍历，每个块级节点切为一个 Block。
- `source` 用节点 `position.start.offset` ~ `position.end.offset` 从原文精确截取。
- `type` 映射：`heading`→heading、`paragraph`→paragraph、`list`→list、`code`→code（`lang === "mermaid"` 时→mermaid）、`table`→table、`blockquote`→blockquote、`thematicBreak`→hr。
- 纯图片段落（段落仅含一个 image 且无其他文本）→ image（沿用现有行为）。

### 2.4 渲染规则

- 单块 mdast 节点 → `remark-rehype` → `rehype-stringify` → HTML。
- 代码块经 `@shikijs/rehype` 高亮；行号（V1.1 暂不引入，见 `09-block-interactions.md` 预留）。
- Mermaid 块走 pele，渲染失败回退为普通代码块（沿用现有行为）。
- 输出 HTML 需保持现有 CSS 可渲染（`src/styles/theme.css` 中的 `.block` 选择器兼容）。

### 2.5 迁移策略

1. 新增 `src/markdown/` 下的 unified 管线（`splitBlocks` 重写为 mdast 实现）。
2. 保留 `Block` / `BlockType` 类型不变。
3. 移除 `markdown-it`、`markdown-it-task-lists`、`highlight.js` 依赖（替换为 remark/rehype/shiki）。
4. 全量回归：现有文档内容（`sampleMarkdown` 覆盖标题/列表/任务/代码/表格/引用/图片/mermaid/hr）逐块对比渲染结果，确保无回退。

## 3. 验收标准

- [ ] `splitBlocks` 接口与 `Block` 结构不变，上层无感知。
- [ ] 复杂嵌套（列表嵌代码块、表格、引用嵌套）分块准确，不切错、不丢块。
- [ ] 代码高亮由 Shiki 输出，主题跟随当前深浅色。
- [ ] GFM（表格/任务列表/删除线/自动链接）渲染正确。
- [ ] Mermaid 图表仍由 pele 渲染，失败回退正常。
- [ ] `sampleMarkdown` 各块渲染结果与迁移前一致（或仅高亮质感提升）。

## 4. 涉及任务

- T12：渲染器迁移到 unified/remark + rehype-shiki。

## 5. 变更记录

| 日期 | 说明 |
|------|------|
| 2026-10-21 | 初稿：unified/remark 分块 + rehype-shiki 渲染，替代 markdown-it |
