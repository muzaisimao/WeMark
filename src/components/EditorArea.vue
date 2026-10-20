<script setup lang="ts">
import { ref } from "vue";
import AppIcon from "./AppIcon.vue";
import type { IconName } from "../icons";
import { useLayoutStore } from "../stores/layout";

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

const content = ref("");
const layout = useLayoutStore();
</script>

<template>
  <footer class="editor" :style="{ height: `${layout.editorHeight}px` }">
    <textarea
      v-model="content"
      class="editor__input"
      placeholder="输入 Markdown，Enter 发送，Shift+Enter 换行"
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
        <button class="editor__tool" title="草稿箱" type="button">
          <AppIcon name="draft" :size="17" />
        </button>
        <button class="editor__send" title="发送" type="button">
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
