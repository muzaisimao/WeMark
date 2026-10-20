import { invoke } from "@tauri-apps/api/core";
import { open, save } from "@tauri-apps/plugin-dialog";

export interface FsNode {
  name: string;
  path: string;
  isDir: boolean;
  children: FsNode[];
}

export interface PickedFile {
  path: string;
  name: string; // 含扩展名的文件名
  content: string;
}

/** 是否运行在 Tauri 环境（区别于纯浏览器 dev） */
export function isTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

export function basename(path: string): string {
  return path.split(/[\\/]/).pop() ?? path;
}

export function stripExt(name: string): string {
  return name.replace(/\.[^.]+$/, "");
}

// 浏览器降级用内存缓存（path -> content）
const browserStore = new Map<string, string>();

export async function readTextFile(path: string): Promise<string> {
  if (isTauri()) {
    return invoke<string>("read_text_file", { path });
  }
  return browserStore.get(path) ?? "";
}

export async function writeTextFile(path: string, content: string): Promise<void> {
  if (isTauri()) {
    await invoke("write_text_file", { path, content });
    return;
  }
  browserStore.set(path, content);
  // 浏览器环境下以下载文件方式「保存」
  const blob = new Blob([content], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = basename(path);
  a.click();
  URL.revokeObjectURL(url);
}

export async function listMdFiles(root: string): Promise<FsNode[]> {
  if (isTauri()) {
    return invoke<FsNode[]>("list_md_files", { root });
  }
  return [];
}

export async function pickOpenFile(): Promise<PickedFile | null> {
  if (isTauri()) {
    const path = await open({
      multiple: false,
      directory: false,
      filters: [{ name: "Markdown", extensions: ["md"] }],
    });
    if (!path || Array.isArray(path)) return null;
    const content = await readTextFile(path);
    return { path, name: basename(path), content };
  }
  return pickFileViaInput();
}

function pickFileViaInput(): Promise<PickedFile | null> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".md,.markdown,text/markdown,text/plain";
    let settled = false;
    const done = (result: PickedFile | null) => {
      if (!settled) {
        settled = true;
        resolve(result);
      }
    };
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return done(null);
      const content = await file.text();
      const path = `browser://${file.name}`;
      browserStore.set(path, content);
      done({ path, name: file.name, content });
    };
    input.oncancel = () => done(null);
    input.click();
  });
}

export async function pickSaveFile(defaultName?: string): Promise<string | null> {
  if (isTauri()) {
    const path = await save({
      defaultPath: defaultName,
      filters: [{ name: "Markdown", extensions: ["md"] }],
    });
    return path ?? null;
  }
  const name = defaultName?.endsWith(".md")
    ? defaultName
    : `${defaultName || "untitled"}.md`;
  return `browser://${name}`;
}

export async function pickDirectory(): Promise<string | null> {
  if (isTauri()) {
    const path = await open({ directory: true, multiple: false });
    if (!path || Array.isArray(path)) return null;
    return path;
  }
  return null;
}
