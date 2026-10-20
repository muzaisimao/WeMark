export type BlockType =
  | "heading"
  | "paragraph"
  | "list"
  | "code"
  | "image"
  | "table"
  | "blockquote"
  | "mermaid"
  | "hr";

export interface Block {
  id: string;
  source: string; // 该块的 Markdown 源码（可回填编辑）
  type: BlockType;
  html: string; // 渲染后的 HTML
}
