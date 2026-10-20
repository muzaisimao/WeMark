import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import rehypeShiki from "@shikijs/rehype";
import { render as renderMermaid } from "pele";
import type { BuiltinLanguage } from "shiki";
import type { Root, RootContent, Paragraph } from "mdast";
import type { Block, BlockType } from "./types";

// 常用代码语言（限制预加载体积，未列出的语言回退为纯文本）
const LANGS: BuiltinLanguage[] = [
  "typescript",
  "javascript",
  "tsx",
  "jsx",
  "rust",
  "python",
  "bash",
  "json",
  "html",
  "css",
  "scss",
  "markdown",
  "yaml",
  "toml",
  "sql",
  "java",
  "go",
  "c",
  "cpp",
];

const parser = unified().use(remarkParse).use(remarkGfm);

const renderer = unified()
  .use(remarkRehype)
  .use(rehypeShiki, {
    langs: LANGS,
    themes: { light: "github-light", dark: "github-dark" },
    defaultColor: "light",
  })
  .use(rehypeStringify);

const NODE_TYPE_TO_BLOCK: Record<string, BlockType> = {
  heading: "heading",
  paragraph: "paragraph",
  list: "list",
  code: "code",
  table: "table",
  blockquote: "blockquote",
  thematicBreak: "hr",
};

function isImageOnlyParagraph(node: Paragraph): boolean {
  return node.children.length === 1 && node.children[0].type === "image";
}

// 从原始源码按节点 position 精确截取该块的 Markdown 源码
function extractSource(source: string, node: RootContent): string {
  if (!node.position) return "";
  const start = node.position.start.offset ?? 0;
  const end = node.position.end.offset ?? source.length;
  return source.slice(start, end).replace(/\n+$/, "");
}

function nodeToType(node: RootContent): BlockType {
  if (node.type === "code") {
    return (node.lang ?? "").trim().toLowerCase() === "mermaid"
      ? "mermaid"
      : "code";
  }
  if (node.type === "paragraph" && isImageOnlyParagraph(node)) {
    return "image";
  }
  return NODE_TYPE_TO_BLOCK[node.type] ?? "paragraph";
}

async function renderNode(node: RootContent): Promise<string> {
  // Mermaid 代码块走 pele，渲染失败回退为普通代码块
  if (node.type === "code" && (node.lang ?? "").trim().toLowerCase() === "mermaid") {
    const code = node.value ?? "";
    try {
      const result = renderMermaid(code);
      return `<div class="mermaid-diagram">${result.svg}</div>`;
    } catch {
      // 回退到普通代码块渲染
    }
  }

  const root: Root = { type: "root", children: [node] };
  const hast = await renderer.run(root);
  return renderer.stringify(hast);
}

export async function splitBlocks(source: string): Promise<Block[]> {
  const tree = parser.parse(source) as Root;
  const blocks: Block[] = [];
  for (const node of tree.children) {
    blocks.push({
      id: crypto.randomUUID(),
      source: extractSource(source, node),
      type: nodeToType(node),
      html: await renderNode(node),
    });
  }
  return blocks;
}

// 将整段 Markdown 渲染为 HTML（用于编辑区预览），每个块用 .block 包裹以复用内容样式
export async function renderMarkdown(source: string): Promise<string> {
  const blocks = await splitBlocks(source);
  return blocks.map((b) => `<div class="block">${b.html}</div>`).join("\n");
}
