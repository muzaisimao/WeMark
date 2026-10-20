<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue";
import AppIcon from "./AppIcon.vue";
import type { IconName } from "../icons";
import { useLayoutStore } from "../stores/layout";
import { useDocumentStore } from "../stores/document";
import { renderMarkdown } from "../markdown/parser";

const layout = useLayoutStore();
const doc = useDocumentStore();

// 预览模式展开高度
const PREVIEW_HEIGHT = 360;

interface FormatDef {
  key: string;
  label: string;
  icon: IconName;
  prefix: string;
  suffix: string;
  placeholder: string;
  block?: boolean;
}

const formatTools: FormatDef[] = [
  { key: "bold", label: "加粗", icon: "bold", prefix: "**", suffix: "**", placeholder: "加粗文本" },
  { key: "italic", label: "斜体", icon: "italic", prefix: "*", suffix: "*", placeholder: "斜体文本" },
  { key: "strike", label: "删除线", icon: "strikethrough", prefix: "~~", suffix: "~~", placeholder: "删除线文本" },
  { key: "heading", label: "标题", icon: "heading", prefix: "## ", suffix: "", placeholder: "标题", block: true },
  { key: "list", label: "无序列表", icon: "list", prefix: "- ", suffix: "", placeholder: "列表项", block: true },
  { key: "task", label: "任务列表", icon: "task", prefix: "- [ ] ", suffix: "", placeholder: "待办项", block: true },
  { key: "code", label: "行内代码", icon: "code", prefix: "`", suffix: "`", placeholder: "code" },
  { key: "quote", label: "引用", icon: "quote", prefix: "> ", suffix: "", placeholder: "引用内容", block: true },
  { key: "link", label: "链接", icon: "link", prefix: "[", suffix: "](url)", placeholder: "链接文字" },
  { key: "table", label: "表格", icon: "table", prefix: "", suffix: "", placeholder: "" },
  { key: "image", label: "图片", icon: "image", prefix: "", suffix: "", placeholder: "" },
];

const showDrafts = ref(false);
const previewMode = ref(false);
const previewHtml = ref("");
const inputRef = ref<HTMLTextAreaElement>();
const fileInputRef = ref<HTMLInputElement>();

// 预览模式下编辑区临时展开
const footerHeight = computed(() =>
  previewMode.value ? PREVIEW_HEIGHT : layout.editorHeight
);

// ---- 文本操作 ----

function setContentAndFocus(content: string, selStart: number, selEnd: number) {
  doc.editorContent = content;
  nextTick(() => {
    const el = inputRef.value;
    if (!el) return;
    el.focus();
    el.setSelectionRange(selStart, selEnd);
    autoResize();
  });
}

// 行内格式：包裹选中文本（无选中则插入占位符）
function applyInline(prefix: string, suffix: string, placeholder: string) {
  const el = inputRef.value;
  if (!el) return;
  const start = el.selectionStart;
  const end = el.selectionEnd;
  const selected = doc.editorContent.slice(start, end);
  const text = selected || placeholder;
  const insert = prefix + text + suffix;
  const content =
    doc.editorContent.slice(0, start) + insert + doc.editorContent.slice(end);
  setContentAndFocus(content, start + prefix.length, start + prefix.length + text.length);
}

// 块级格式：对光标所在行整行加前缀
function applyBlock(prefix: string, placeholder: string) {
  const el = inputRef.value;
  if (!el) return;
  const start = el.selectionStart;
  const content = doc.editorContent;
  const lineStart = content.lastIndexOf("\n", start - 1) + 1;
  let lineEnd = content.indexOf("\n", start);
  if (lineEnd === -1) lineEnd = content.length;
  const line = content.slice(lineStart, lineEnd);
  const text = line.trim() || placeholder;
  const newLine = prefix + text;
  const newContent = content.slice(0, lineStart) + newLine + content.slice(lineEnd);
  setContentAndFocus(newContent, lineStart + newLine.length, lineStart + newLine.length);
}

// 在光标处插入文本
function insertAtCursor(text: string) {
  const el = inputRef.value;
  if (!el) return;
  const start = el.selectionStart;
  const end = el.selectionEnd;
  const content =
    doc.editorContent.slice(0, start) + text + doc.editorContent.slice(end);
  const pos = start + text.length;
  setContentAndFocus(content, pos, pos);
}

function applyFormat(tool: FormatDef) {
  if (tool.key === "image") {
    fileInputRef.value?.click();
    return;
  }
  if (tool.key === "table") {
    insertAtCursor("\n| 列1 | 列2 |\n| --- | --- |\n| 内容 | 内容 |\n");
    return;
  }
  if (tool.block) applyBlock(tool.prefix, tool.placeholder);
  else applyInline(tool.prefix, tool.suffix, tool.placeholder);
}

function onImageChange(e: Event) {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  const name = file.name.replace(/\.[^.]+$/, "");
  insertAtCursor(`![${name}](${file.name})`);
  input.value = "";
}

// ---- 高度自适应（随内容增长，不超过编辑区可用高度） ----

function autoResize() {
  if (previewMode.value) return; // 预览模式下由 flex 分栏控制高度
  const el = inputRef.value;
  if (!el) return;
  const footer = el.closest(".editor") as HTMLElement | null;
  const toolbar = footer?.querySelector(".editor__toolbar") as HTMLElement | null;
  const hint = footer?.querySelector(".editor__hint") as HTMLElement | null;
  const used = (toolbar?.offsetHeight ?? 0) + (hint?.offsetHeight ?? 0);
  const maxHeight = (footer?.clientHeight ?? 0) - used;
  el.style.height = "auto";
  el.style.height = `${Math.min(el.scrollHeight, maxHeight)}px`;
}

watch(
  () => doc.editorContent,
  () => nextTick(autoResize)
);

// ---- 预览模式 ----

let previewTimer: ReturnType<typeof setTimeout> | undefined;

async function renderPreviewNow() {
  previewHtml.value = await renderMarkdown(doc.editorContent);
}

function schedulePreview() {
  if (previewTimer) clearTimeout(previewTimer);
  previewTimer = setTimeout(renderPreviewNow, 200);
}

function togglePreview() {
  previewMode.value = !previewMode.value;
  if (previewMode.value) {
    previewHtml.value = "";
    schedulePreview();
  }
}

watch(
  () => doc.editorContent,
  () => {
    if (previewMode.value) schedulePreview();
  }
);

// 进入编辑态（点击块 / 插入块）时聚焦输入框
watch(
  () => doc.editorState,
  (state) => {
    if (state.mode === "editing") {
      nextTick(() => inputRef.value?.focus());
    }
  }
);

// ---- 键盘 ----

function onKeydown(e: KeyboardEvent) {
  const mod = e.metaKey || e.ctrlKey;
  if (mod && e.key.toLowerCase() === "b") {
    e.preventDefault();
    applyInline("**", "**", "加粗文本");
    return;
  }
  if (mod && e.key.toLowerCase() === "i") {
    e.preventDefault();
    applyInline("*", "*", "斜体文本");
    return;
  }
  if (mod && e.key.toLowerCase() === "k") {
    e.preventDefault();
    applyInline("[", "](url)", "链接文字");
    return;
  }

  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    doc.send();
  } else if (e.key === "Escape") {
    e.preventDefault();
    if (showDrafts.value) {
      showDrafts.value = false;
    } else {
      doc.cancelEdit();
    }
  }
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
</script>

<template>
  <footer class="editor" :style="{ height: `${footerHeight}px` }">
    <div v-if="doc.editorState.mode === 'editing'" class="editor__hint">
      <span>正在编辑：第 {{ doc.editingIndex }} 块</span>
      <button
        class="editor__hint-cancel"
        type="button"
        @click="doc.cancelEdit()"
      >
        取消
      </button>
    </div>

    <div class="editor__body" :class="{ 'editor__body--preview': previewMode }">
      <textarea
        ref="inputRef"
        v-model="doc.editorContent"
        class="editor__input"
        placeholder="输入 Markdown，Enter 发送，Shift+Enter 换行"
        @keydown="onKeydown"
        @input="autoResize"
      ></textarea>
      <div v-if="previewMode" class="editor__preview" v-html="previewHtml"></div>
    </div>

    <div class="editor__toolbar">
      <div class="editor__formats">
        <button
          v-for="tool in formatTools"
          :key="tool.key"
          class="editor__tool"
          :title="tool.label"
          type="button"
          @click="applyFormat(tool)"
        >
          <AppIcon :name="tool.icon" :size="17" />
        </button>
      </div>

      <div class="editor__actions">
        <div class="editor__draft">
          <button
            class="editor__tool"
            :class="{ 'editor__tool--active': showDrafts }"
            title="草稿箱"
            type="button"
            @click="showDrafts = !showDrafts"
          >
            <AppIcon name="draft" :size="17" />
          </button>

          <div v-if="showDrafts" class="editor__draft-menu">
            <div v-if="doc.drafts.length === 0" class="editor__draft-empty">
              无未发送内容
            </div>
            <div
              v-for="draft in doc.drafts"
              :key="draft.id"
              class="editor__draft-item"
              @click="doc.restoreDraft(draft.id)"
            >
              <div class="editor__draft-head">
                <span class="editor__draft-label">{{ draft.label }}</span>
                <span class="editor__draft-time">{{
                  formatTime(draft.createdAt)
                }}</span>
              </div>
              <div class="editor__draft-preview">{{ draft.preview }}</div>
              <button
                class="editor__draft-del"
                type="button"
                title="删除草稿"
                @click.stop="doc.removeDraft(draft.id)"
              >
                ✕
              </button>
            </div>
          </div>
        </div>

        <button
          class="editor__tool"
          :class="{ 'editor__tool--active': previewMode }"
          :title="previewMode ? '回到编辑' : '预览'"
          type="button"
          @click="togglePreview"
        >
          <AppIcon :name="previewMode ? 'code' : 'eye'" :size="17" />
        </button>

        <button
          class="editor__send"
          title="发送"
          type="button"
          @click="doc.send()"
        >
          <AppIcon name="send" :size="18" />
        </button>
      </div>
    </div>

    <input
      ref="fileInputRef"
      type="file"
      accept="image/*"
      class="editor__file-input"
      @change="onImageChange"
    />
  </footer>
</template>

<style scoped>
.editor {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  border-top: 1px solid var(--border);
  background: var(--panel);
}

.editor__hint {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 16px;
  font-size: 12px;
  color: var(--text-secondary);
  background: var(--panel-2);
  border-bottom: 1px solid var(--border);
}

.editor__hint-cancel {
  border: none;
  background: transparent;
  color: var(--accent);
  cursor: pointer;
  font-size: 12px;
}

.editor__body {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}

.editor__body--preview {
  flex-direction: row;
}

.editor__input {
  flex: none;
  min-height: 60px;
  overflow-y: auto;
  padding: 12px 16px;
  border: none;
  outline: none;
  resize: none;
  background: transparent;
  font-size: var(--editor-font-size);
  line-height: 1.6;
  color: var(--text);
}

.editor__body--preview .editor__input {
  flex: 1;
  min-height: 0;
}

.editor__input::placeholder {
  color: var(--text-tertiary);
}

.editor__preview {
  flex: 1;
  min-width: 0;
  overflow-y: auto;
  padding: 12px 16px;
  border-left: 1px solid var(--border);
  font-size: var(--editor-font-size);
  line-height: 1.6;
  color: var(--text);
}

.editor__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: auto;
  padding: 6px 12px;
  border-top: 1px solid var(--border);
}

.editor__formats {
  display: flex;
  align-items: center;
  gap: 2px;
}

.editor__actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.editor__tool {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border: none;
  border-radius: var(--radius);
  background: transparent;
  color: var(--text-secondary);
  transition: background 0.12s, color 0.12s;
}

.editor__tool:hover {
  background: var(--hover);
  color: var(--text);
}

.editor__tool--active {
  background: var(--active);
  color: var(--text);
}

.editor__draft {
  position: relative;
}

.editor__draft-menu {
  position: absolute;
  bottom: 40px;
  right: 0;
  width: 260px;
  max-height: 320px;
  overflow-y: auto;
  background: var(--panel-2);
  border: 1px solid var(--border);
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
  z-index: 10;
}

.editor__draft-empty {
  padding: 16px;
  text-align: center;
  font-size: 13px;
  color: var(--text-tertiary);
}

.editor__draft-item {
  position: relative;
  padding: 8px 12px;
  cursor: pointer;
  border-bottom: 1px solid var(--border);
}

.editor__draft-item:last-child {
  border-bottom: none;
}

.editor__draft-item:hover {
  background: var(--hover);
}

.editor__draft-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
}

.editor__draft-label {
  font-size: 12px;
  color: var(--accent);
}

.editor__draft-time {
  font-size: 11px;
  color: var(--text-tertiary);
}

.editor__draft-preview {
  font-size: 12px;
  color: var(--text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  padding-right: 20px;
}

.editor__draft-del {
  position: absolute;
  top: 8px;
  right: 8px;
  border: none;
  background: transparent;
  color: var(--text-tertiary);
  cursor: pointer;
  font-size: 12px;
}

.editor__draft-del:hover {
  color: var(--danger);
}

.editor__send {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border: none;
  border-radius: 8px;
  background: var(--accent);
  color: #fff;
  transition: background 0.12s;
}

.editor__send:hover {
  background: var(--accent-hover);
}

.editor__file-input {
  display: none;
}
</style>
