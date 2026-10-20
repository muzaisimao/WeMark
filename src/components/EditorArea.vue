<script setup lang="ts">
import { ref } from "vue";
import AppIcon from "./AppIcon.vue";
import type { IconName } from "../icons";
import { useLayoutStore } from "../stores/layout";
import { useDocumentStore } from "../stores/document";

const layout = useLayoutStore();
const doc = useDocumentStore();

interface ToolItem {
  key: string;
  label: string;
  icon: IconName;
}

const formatTools: ToolItem[] = [
  { key: "bold", label: "加粗", icon: "bold" },
  { key: "italic", label: "斜体", icon: "italic" },
  { key: "heading", label: "标题", icon: "heading" },
  { key: "list", label: "列表", icon: "list" },
  { key: "code", label: "代码", icon: "code" },
  { key: "quote", label: "引用", icon: "quote" },
  { key: "link", label: "链接", icon: "link" },
  { key: "image", label: "图片", icon: "image" },
];

const showDrafts = ref(false);

function onKeydown(e: KeyboardEvent) {
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
  <footer class="editor" :style="{ height: `${layout.editorHeight}px` }">
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

    <textarea
      v-model="doc.editorContent"
      class="editor__input"
      placeholder="输入 Markdown，Enter 发送，Shift+Enter 换行"
      @keydown="onKeydown"
    ></textarea>

    <div class="editor__toolbar">
      <div class="editor__formats">
        <button
          v-for="tool in formatTools"
          :key="tool.key"
          class="editor__tool"
          :title="tool.label"
          type="button"
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
          class="editor__send"
          title="发送"
          type="button"
          @click="doc.send()"
        >
          <AppIcon name="send" :size="18" />
        </button>
      </div>
    </div>
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

.editor__input {
  flex: 1;
  min-height: 0;
  padding: 12px 16px;
  border: none;
  outline: none;
  resize: none;
  background: transparent;
  font-size: 14px;
  line-height: 1.6;
  color: var(--text);
}

.editor__input::placeholder {
  color: var(--text-tertiary);
}

.editor__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
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
</style>
