<script setup lang="ts">
import { computed } from "vue";
import AppIcon from "./AppIcon.vue";
import type { IconName } from "../icons";
import { splitBlocks } from "../markdown/parser";
import { sampleMarkdown } from "../markdown/sample";

interface ToolItem {
  key: string;
  label: string;
  icon: IconName;
}

const tools: ToolItem[] = [
  { key: "copy", label: "复制", icon: "copy" },
  { key: "download", label: "导出", icon: "download" },
  { key: "more", label: "更多", icon: "more" },
];

// T3 阶段使用示例文档，后续 T6/T8 接入真实文件
const blocks = computed(() => splitBlocks(sampleMarkdown));
</script>

<template>
  <section class="render">
    <header class="render__header">
      <div class="render__title">产品需求文档.md</div>
      <div class="render__tools">
        <button
          v-for="tool in tools"
          :key="tool.key"
          class="render__tool"
          :title="tool.label"
          type="button"
        >
          <AppIcon :name="tool.icon" :size="16" />
        </button>
      </div>
    </header>

    <div class="render__body">
      <div v-if="blocks.length === 0" class="render__empty">
        <p class="render__empty-title">开始你的 Markdown 创作</p>
        <p class="render__empty-desc">选择左侧文档，或在下方向框中输入内容后发送</p>
      </div>
      <article
        v-for="block in blocks"
        :key="block.id"
        class="block"
        :data-type="block.type"
        v-html="block.html"
      />
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
</style>
