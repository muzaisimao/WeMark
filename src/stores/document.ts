import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { splitBlocks } from "../markdown/parser";
import { sampleMarkdown } from "../markdown/sample";
import type { Block } from "../markdown/types";
import {
  readTextFile,
  writeTextFile,
  listMdFiles,
  pickOpenFile,
  pickSaveFile,
  pickDirectory,
  basename,
  stripExt,
} from "../fs";
import type { FsNode } from "../fs";

export type EditorState =
  | { mode: "idle" }
  | { mode: "editing"; blockId: string };

export interface Draft {
  id: string;
  source: string;
  target: { type: "new" } | { type: "block"; blockId: string };
  label: string;
  preview: string;
  createdAt: number;
}

export interface DocNode {
  id: string;
  name: string;
  type: "dir" | "file";
  path?: string;
  pinned?: boolean;
  children?: DocNode[];
  content?: string;
  updatedAt?: number;
}

const DRAFT_LIMIT = 10;

function createInitialDocs(): DocNode[] {
  const now = Date.now();
  return [
    {
      id: "d1",
      name: "产品需求文档",
      type: "file",
      pinned: true,
      content: sampleMarkdown,
      updatedAt: now - 1,
    },
    {
      id: "d2",
      name: "项目周报",
      type: "file",
      pinned: true,
      content: "# 项目周报\n\n本周完成 MVP 核心闭环。",
      updatedAt: now - 2,
    },
    {
      id: "dir1",
      name: "工作笔记",
      type: "dir",
      children: [
        {
          id: "d3",
          name: "会议纪要",
          type: "file",
          content: "# 会议纪要\n\n讨论了下季度规划。",
          updatedAt: now - 3,
        },
        {
          id: "d4",
          name: "技术调研",
          type: "file",
          content: "# 技术调研\n\nTauri 与 Vue 集成方案。",
          updatedAt: now - 4,
        },
        {
          id: "d5",
          name: "读书笔记",
          type: "file",
          content: "# 读书笔记\n\n《设计心理学》要点。",
          updatedAt: now - 5,
        },
      ],
    },
    {
      id: "d6",
      name: "个人计划",
      type: "file",
      content: "# 个人计划\n\n学习 Rust。",
      updatedAt: now - 6,
    },
  ];
}

function findFile(nodes: DocNode[], id: string): DocNode | undefined {
  for (const n of nodes) {
    if (n.id === id) return n;
    if (n.type === "dir" && n.children) {
      const found = findFile(n.children, id);
      if (found) return found;
    }
  }
  return undefined;
}

function collectFiles(nodes: DocNode[]): DocNode[] {
  const result: DocNode[] = [];
  for (const n of nodes) {
    if (n.type === "file") {
      result.push(n);
    } else if (n.children) {
      result.push(...collectFiles(n.children));
    }
  }
  return result;
}

function findFileByPath(nodes: DocNode[], path: string): DocNode | undefined {
  for (const n of nodes) {
    if (n.path === path) return n;
    if (n.type === "dir" && n.children) {
      const found = findFileByPath(n.children, path);
      if (found) return found;
    }
  }
  return undefined;
}

// 磁盘目录树（FsNode）转 DocNode：文件内容懒加载，path 作为稳定 id
function fsToDocNode(node: FsNode): DocNode {
  if (node.isDir) {
    return {
      id: node.path,
      name: node.name,
      type: "dir",
      path: node.path,
      children: node.children.map(fsToDocNode),
      updatedAt: 0,
    };
  }
  return {
    id: node.path,
    name: node.name,
    type: "file",
    path: node.path,
    content: undefined,
    updatedAt: 0,
  };
}

// 按最近编辑时间排序：目录固定在前，文件按 updatedAt 降序；目录内部递归排序
function sortNodes(nodes: DocNode[]): DocNode[] {
  const copy = nodes.map((n) =>
    n.type === "dir" && n.children
      ? { ...n, children: sortNodes(n.children) }
      : n
  );
  return copy.sort((a, b) => {
    if (a.type === "dir" && b.type === "dir") return 0;
    if (a.type === "dir") return -1;
    if (b.type === "dir") return 1;
    return (b.updatedAt ?? 0) - (a.updatedAt ?? 0);
  });
}

export const useDocumentStore = defineStore("document", () => {
  const docList = ref<DocNode[]>(createInitialDocs());
  const activeDocId = ref("d1");

  // 当前文档内容（块列表为主状态）
  const initialDoc = findFile(docList.value, "d1");
  const blocks = ref<Block[]>(splitBlocks(initialDoc?.content ?? ""));

  const editorState = ref<EditorState>({ mode: "idle" });
  const editorContent = ref("");
  const drafts = ref<Draft[]>([]);

  const expandedDirs = ref<Record<string, boolean>>({ dir1: true });
  const searchKeyword = ref("");

  const activeDoc = computed(() => findFile(docList.value, activeDocId.value));
  const source = computed(() => blocks.value.map((b) => b.source).join("\n\n"));

  const editingIndex = computed<number | null>(() => {
    const state = editorState.value;
    if (state.mode !== "editing") return null;
    const idx = blocks.value.findIndex((b) => b.id === state.blockId);
    return idx >= 0 ? idx + 1 : null;
  });

  // 排序后的文档树（供列表展示，最近编辑在前）
  const sortedDocList = computed(() => sortNodes(docList.value));

  // 置顶文档（所有 pinned 的 file，扁平，最近编辑在前）
  const pinnedDocs = computed(() =>
    collectFiles(docList.value)
      .filter((f) => f.pinned)
      .sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0))
  );

  // 搜索结果（按文档名或内容匹配）
  const searchResults = computed<DocNode[]>(() => {
    const kw = searchKeyword.value.trim().toLowerCase();
    if (!kw) return [];
    return collectFiles(docList.value).filter(
      (f) =>
        f.name.toLowerCase().includes(kw) ||
        (f.content ?? "").toLowerCase().includes(kw)
    );
  });

  const searching = computed(() => searchKeyword.value.trim() !== "");

  // 切换文档：保存当前 → 懒加载并激活新文档
  async function setActiveDoc(id: string) {
    if (id === activeDocId.value) return;
    const current = findFile(docList.value, activeDocId.value);
    if (current) {
      current.content = source.value;
      current.updatedAt = Date.now();
    }
    const next = findFile(docList.value, id);
    if (!next || next.type !== "file") return;
    if (next.content == null && next.path) {
      try {
        next.content = await readTextFile(next.path);
      } catch {
        next.content = "";
      }
    }
    activeDocId.value = id;
    blocks.value = splitBlocks(next.content ?? "");
    editorContent.value = "";
    editorState.value = { mode: "idle" };
  }

  // 新建文档：选择保存路径 → 写空文件 → 加入文档树并激活
  async function newDocument() {
    const path = await pickSaveFile("未命名.md");
    if (!path) return;
    await writeTextFile(path, "");
    const node: DocNode = {
      id: path,
      name: stripExt(basename(path)),
      type: "file",
      path,
      content: "",
      updatedAt: Date.now(),
    };
    docList.value.push(node);
    await setActiveDoc(node.id);
  }

  // 打开文档：选择文件 → 加入文档树（已存在则切换）并激活
  async function openDocument() {
    const picked = await pickOpenFile();
    if (!picked) return;
    const existing = findFileByPath(docList.value, picked.path);
    if (existing) {
      await setActiveDoc(existing.id);
      return;
    }
    const node: DocNode = {
      id: picked.path,
      name: stripExt(picked.name),
      type: "file",
      path: picked.path,
      content: picked.content,
      updatedAt: Date.now(),
    };
    docList.value.push(node);
    await setActiveDoc(node.id);
  }

  // 打开目录：选择目录 → 扫描 .md → 重建文档树
  async function openDirectory() {
    const root = await pickDirectory();
    if (!root) return;
    const nodes = await listMdFiles(root);
    docList.value = nodes.map(fsToDocNode);
    expandedDirs.value = {};
    const first = collectFiles(docList.value)[0];
    if (first) {
      await setActiveDoc(first.id);
    } else {
      activeDocId.value = "";
      blocks.value = [];
      editorContent.value = "";
      editorState.value = { mode: "idle" };
    }
  }

  // 保存当前文档到磁盘
  async function saveCurrent() {
    const current = activeDoc.value;
    if (!current || current.type !== "file") return;
    let path: string | undefined = current.path;
    if (!path) {
      const chosen = await pickSaveFile(`${current.name}.md`);
      if (!chosen) return;
      path = chosen;
      current.path = chosen;
      current.id = chosen;
    }
    current.content = source.value;
    current.updatedAt = Date.now();
    await writeTextFile(path, source.value);
  }

  function togglePin(id: string) {
    const node = findFile(docList.value, id);
    if (node) node.pinned = !node.pinned;
  }

  function toggleExpand(id: string) {
    expandedDirs.value[id] = !expandedDirs.value[id];
  }

  // 点击块 → 进入编辑
  function startEdit(blockId: string) {
    if (editorContent.value.trim()) {
      saveDraft();
    }
    const block = blocks.value.find((b) => b.id === blockId);
    if (!block) return;
    editorContent.value = block.source;
    editorState.value = { mode: "editing", blockId };
  }

  // 发送：editing 原位替换 / idle 追加到末尾
  function send() {
    const content = editorContent.value;
    if (!content.trim()) return;

    const newBlocks = splitBlocks(content);
    if (newBlocks.length === 0) return;

    const state = editorState.value;
    if (state.mode === "editing") {
      const blockId = state.blockId;
      const idx = blocks.value.findIndex((b) => b.id === blockId);
      if (idx >= 0) {
        blocks.value.splice(
          idx,
          1,
          { ...newBlocks[0], id: blockId },
          ...newBlocks.slice(1)
        );
      }
      removeDraftByTarget({ type: "block", blockId });
    } else {
      blocks.value.push(...newBlocks);
      removeDraftByTarget({ type: "new" });
    }

    editorContent.value = "";
    editorState.value = { mode: "idle" };
  }

  function cancelEdit() {
    editorContent.value = "";
    editorState.value = { mode: "idle" };
  }

  function saveDraft() {
    const content = editorContent.value;
    if (!content.trim()) return;

    const state = editorState.value;
    const target: Draft["target"] =
      state.mode === "editing"
        ? { type: "block", blockId: state.blockId }
        : { type: "new" };

    let label: string;
    if (state.mode === "editing") {
      const idx = blocks.value.findIndex((b) => b.id === state.blockId);
      label = idx >= 0 ? `第 ${idx + 1} 块` : "块";
    } else {
      label = "新内容";
    }

    const existing = drafts.value.find((d) => {
      if (target.type === "new") return d.target.type === "new";
      return d.target.type === "block" && d.target.blockId === target.blockId;
    });

    if (existing) {
      existing.source = content;
      existing.label = label;
      existing.preview = content.slice(0, 50);
      existing.createdAt = Date.now();
    } else {
      drafts.value.unshift({
        id: crypto.randomUUID(),
        source: content,
        target,
        label,
        preview: content.slice(0, 50),
        createdAt: Date.now(),
      });
      if (drafts.value.length > DRAFT_LIMIT) {
        drafts.value = drafts.value.slice(0, DRAFT_LIMIT);
      }
    }
  }

  function restoreDraft(draftId: string) {
    const draft = drafts.value.find((d) => d.id === draftId);
    if (!draft) return;

    if (editorContent.value.trim()) {
      saveDraft();
    }

    editorContent.value = draft.source;
    const target = draft.target;
    editorState.value =
      target.type === "block"
        ? { mode: "editing", blockId: target.blockId }
        : { mode: "idle" };

    removeDraft(draftId);
  }

  function removeDraft(draftId: string) {
    drafts.value = drafts.value.filter((d) => d.id !== draftId);
  }

  function removeDraftByTarget(target: Draft["target"]) {
    drafts.value = drafts.value.filter((d) => {
      if (target.type === "new") return d.target.type !== "new";
      if (d.target.type === "new") return true;
      return d.target.blockId !== target.blockId;
    });
  }

  return {
    docList,
    sortedDocList,
    activeDoc,
    activeDocId,
    blocks,
    source,
    editorState,
    editorContent,
    drafts,
    editingIndex,
    expandedDirs,
    searchKeyword,
    pinnedDocs,
    searchResults,
    searching,
    setActiveDoc,
    newDocument,
    openDocument,
    openDirectory,
    saveCurrent,
    togglePin,
    toggleExpand,
    startEdit,
    send,
    cancelEdit,
    saveDraft,
    restoreDraft,
    removeDraft,
  };
});
