import MarkdownIt from "markdown-it";
import type { Token } from "markdown-it";
import taskLists from "markdown-it-task-lists";
import hljs from "highlight.js";
import { render as renderMermaid } from "pele";
import type { Block, BlockType } from "./types";

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const md = new MarkdownIt({
  html: false,
  linkify: true,
  highlight: (str, lang): string => {
    if (lang && hljs.getLanguage(lang)) {
      try {
        const highlighted = hljs.highlight(str, {
          language: lang,
          ignoreIllegals: true,
        }).value;
        return `<pre class="hljs"><code class="language-${escapeHtml(
          lang
        )}">${highlighted}</code></pre>`;
      } catch {
        // 高亮失败则回退到转义文本
      }
    }
    return `<pre class="hljs"><code>${escapeHtml(str)}</code></pre>`;
  },
});

md.use(taskLists, { enabled: true, label: true });

const TOKEN_TO_TYPE: Record<string, BlockType> = {
  heading_open: "heading",
  paragraph_open: "paragraph",
  bullet_list_open: "list",
  ordered_list_open: "list",
  fence: "code",
  blockquote_open: "blockquote",
  table_open: "table",
  hr: "hr",
};

const IMAGE_ONLY = /^!\[[^\]]*\]\([^)]*\)\s*$/;

function extractSource(source: string, map: [number, number] | null): string {
  if (!map) return "";
  const lines = source.split("\n");
  return lines.slice(map[0], map[1]).join("\n").replace(/\n+$/, "");
}

export function splitBlocks(source: string): Block[] {
  const tokens = md.parse(source, {});
  const rawBlocks: Token[][] = [];
  let current: Token[] = [];

  for (const token of tokens) {
    const isBlockStart =
      token.level === 0 && token.type !== "inline" && token.nesting !== -1;
    if (isBlockStart) {
      if (current.length > 0) rawBlocks.push(current);
      current = [token];
    } else {
      current.push(token);
    }
  }
  if (current.length > 0) rawBlocks.push(current);

  return rawBlocks.map((blockTokens) => {
    const first = blockTokens[0];
    const blockSource = extractSource(source, first.map ?? null);
    let type: BlockType = TOKEN_TO_TYPE[first.type] ?? "paragraph";

    // Mermaid 代码块识别（渲染在 T4 接入 pele.js）
    if (first.type === "fence") {
      const info = (first.info ?? "").trim().toLowerCase();
      if (info === "mermaid") {
        type = "mermaid";
      }
    }

    // 纯图片段落识别
    if (type === "paragraph" && IMAGE_ONLY.test(blockSource.trim())) {
      type = "image";
    }

    let html = md.renderer.render(blockTokens, md.options, {});

    // Mermaid 图表：用 pele.js 渲染为主题化 SVG
    if (type === "mermaid") {
      const mermaidCode = blockTokens[0].content ?? "";
      try {
        const result = renderMermaid(mermaidCode);
        html = `<div class="mermaid-diagram">${result.svg}</div>`;
      } catch {
        // 渲染失败时回退为普通代码块
        html = `<pre class="hljs"><code>${escapeHtml(mermaidCode)}</code></pre>`;
      }
    }

    return {
      id: crypto.randomUUID(),
      source: blockSource,
      type,
      html,
    };
  });
}
