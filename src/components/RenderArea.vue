<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue";
import AppIcon from "./AppIcon.vue";
import type { IconName } from "../icons";
import { useDocumentStore } from "../stores/document";

const doc = useDocumentStore();

interface ToolItem {
  key: string;
  label: string;
  icon: IconName;
}

const tools: ToolItem[] = [
  { key: "copy", label: "复制源码", icon: "copy" },
  { key: "download", label: "导出/保存", icon: "download" },
  { key: "more", label: "更多", icon: "more" },
];

async function handleTool(key: string) {
  if (key === "copy") {
    try {
      await navigator.clipboard.writeText(doc.source);
    } catch {
      // 剪贴板不可用时忽略
    }
  } else if (key === "download") {
    await doc.saveCurrent();
  }
}

const editingId = computed(() =>
  doc.editorState.mode === "editing" ? doc.editorState.blockId : null
);

const bodyRef = ref<HTMLElement>();

// 进入编辑某块时，若该块不在可视范围，滚动到视野内
watch(editingId, (id) => {
  if (!id) return;
  nextTick(() => {
    const container = bodyRef.value;
    const el = container?.querySelector<HTMLElement>(
      `[data-block-id="${id}"]`
    );
    if (!container || !el) return;
    const cRect = container.getBoundingClientRect();
    const eRect = el.getBoundingClientRect();
    const visible = eRect.top >= cRect.top && eRect.bottom <= cRect.bottom;
    if (!visible) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  });
});

function onBlockClick(e: MouseEvent, blockId: string) {
  const target = e.target as HTMLElement;
  // 点击链接、图片、勾选框等可交互元素时不进入编辑
  if (target.closest("a, img, input")) return;
  doc.startEdit(blockId);
}
</script>

<template>
  <section class="render">
    <header class="render__header">
      <div class="render__title">
        {{ doc.activeDoc ? `${doc.activeDoc.name}.md` : "" }}
      </div>
      <div class="render__tools">
        <button
          v-for="tool in tools"
          :key="tool.key"
          class="render__tool"
          :title="tool.label"
          type="button"
          @click="handleTool(tool.key)"
        >
          <AppIcon :name="tool.icon" :size="16" />
        </button>
      </div>
    </header>

    <div ref="bodyRef" class="render__body">
      <div v-if="doc.blocks.length === 0" class="render__empty">
        <p class="render__empty-title">开始你的 Markdown 创作</p>
        <p class="render__empty-desc">选择左侧文档，或在下方向框中输入内容后发送</p>
      </div>
      <div
        v-for="(block, index) in doc.blocks"
        :key="block.id"
        class="block-row"
        :class="{ 'block-row--editing': editingId === block.id }"
        :data-block-id="block.id"
      >
        <span class="block-row__bar"></span>
        <span class="block-row__num">{{ index + 1 }}</span>
        <article
          class="block"
          :data-type="block.type"
          @click="onBlockClick($event, block.id)"
        >
          <div v-if="block.html" v-html="block.html"></div>
          <div v-else class="block__placeholder" aria-label="空白块"></div>
        </article>
        <button
          class="block-row__insert"
          type="button"
          title="在下方插入"
          @click.stop="doc.insertBlockAfter(block.id)"
        >
          <AppIcon name="plus" :size="12" />
        </button>
      </div>
    </div>
  </section>
</template>

<style scoped>
.render {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: var(--bg);
}

.render__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 48px;
  padding: 0 16px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}

.render__title {
  font-size: 14px;
  font-weight: 500;
  color: var(--text);
}

.render__tools {
  display: flex;
  align-items: center;
  gap: 4px;
}

.render__tool {
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

.render__tool:hover {
  background: var(--hover);
  color: var(--text);
}

.render__body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 16px;
}

.render__empty {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: var(--text-tertiary);
}

.render__empty-title {
  font-size: 15px;
  margin-bottom: 6px;
}

.render__empty-desc {
  font-size: 13px;
}

.block-row {
  display: flex;
  align-items: flex-start;
  position: relative;
  padding: 0;
  margin-bottom: 0;
}

.block-row__num {
  width: 22px;
  flex-shrink: 0;
  text-align: right;
  padding-right: 8px;
  padding-top: 5px;
  font-size: 12px;
  font-weight: 600;
  line-height: 1.6;
  font-variant-numeric: tabular-nums;
  color: var(--text-tertiary);
  opacity: 0.6;
  user-select: none;
  transition: color 0.12s, opacity 0.12s;
}

/* 引导线：靠近渲染区左边框、贯穿整块高度；激活时变 accent，与引用块灰色竖线区分 */
.block-row__bar {
  width: 2px;
  align-self: stretch;
  border-radius: 2px;
  margin-left: -6px;
  margin-right: 8px;
  background: var(--border);
  transition: background 0.12s;
  flex-shrink: 0;
}

.block-row:hover .block-row__num,
.block-row--editing .block-row__num {
  color: var(--accent);
  opacity: 1;
}

.block {
  flex: 1;
  min-width: 0;
  cursor: pointer;
  padding: 4px;
  border-radius: 6px;
  border: 1px solid transparent;
  transition: background 0.12s, border-color 0.12s;
}

.block__placeholder {
  min-height: 1.6em;
  color: var(--text-tertiary);
  font-size: 14px;
  line-height: 1.6;
}

.block-row:hover .block-row__bar {
  background: var(--accent);
}

.block-row--editing .block-row__bar {
  background: var(--accent);
}

.block-row--editing .block {
  background: var(--active);
  border-color: var(--accent);
}

.block-row__insert {
  position: absolute;
  left: 50%;
  bottom: -12px;
  transform: translateX(-50%);
  width: 22px;
  height: 22px;
  border: 1px solid var(--border);
  border-radius: 50%;
  background: var(--panel);
  color: var(--text-secondary);
  display: none;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 1;
  padding: 0;
  line-height: 0;
}

.block-row:hover .block-row__insert {
  display: flex;
}

.block-row__insert:hover {
  background: var(--accent);
  border-color: var(--accent);
  color: #fff;
}

.block-row--editing .block-row__insert {
  display: none;
}
</style>
