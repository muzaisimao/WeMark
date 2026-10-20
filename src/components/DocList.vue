<script setup lang="ts">
import { computed, ref } from "vue";
import AppIcon from "./AppIcon.vue";
import { useLayoutStore } from "../stores/layout";

const layout = useLayoutStore();

interface DocNode {
  id: string;
  name: string;
  type: "dir" | "file";
  pinned?: boolean;
  children?: DocNode[];
}

// T2 阶段使用 mock 数据，T6 接入真实文档树
const docs = ref<DocNode[]>([
  { id: "d1", name: "产品需求文档", type: "file", pinned: true },
  { id: "d2", name: "项目周报", type: "file", pinned: true },
  {
    id: "dir1",
    name: "工作笔记",
    type: "dir",
    children: [
      { id: "d3", name: "会议纪要", type: "file" },
      { id: "d4", name: "技术调研", type: "file" },
      { id: "d5", name: "读书笔记", type: "file" },
    ],
  },
  { id: "d6", name: "个人计划", type: "file" },
]);

const keyword = ref("");
const activeId = ref("d1");
const expanded = ref<Record<string, boolean>>({ dir1: true });

const pinnedDocs = computed(() => docs.value.filter((d) => d.pinned));
const normalDocs = computed(() => docs.value.filter((d) => !d.pinned));

function toggle(id: string) {
  expanded.value[id] = !expanded.value[id];
}
</script>

<template>
  <aside class="doclist" :style="{ width: `${layout.doclistWidth}px` }">
    <div class="doclist__search">
      <AppIcon name="search" :size="14" class="doclist__search-icon" />
      <input
        v-model="keyword"
        class="doclist__input"
        type="text"
        placeholder="搜索文档或内容"
      />
    </div>

    <div class="doclist__scroll">
      <template v-if="pinnedDocs.length">
        <div class="doclist__group-label">置顶</div>
        <div
          v-for="doc in pinnedDocs"
          :key="doc.id"
          class="doclist__item"
          :class="{ 'doclist__item--active': activeId === doc.id }"
          @click="activeId = doc.id"
        >
          <AppIcon name="file" :size="16" />
          <span class="doclist__name">{{ doc.name }}</span>
        </div>
      </template>

      <div class="doclist__group-label">文档</div>

      <template v-for="doc in normalDocs" :key="doc.id">
        <div
          v-if="doc.type === 'dir'"
          class="doclist__item doclist__item--dir"
          @click="toggle(doc.id)"
        >
          <AppIcon
            name="chevron"
            :size="14"
            class="doclist__chevron"
            :class="{ 'doclist__chevron--open': expanded[doc.id] }"
          />
          <AppIcon name="folder" :size="16" />
          <span class="doclist__name">{{ doc.name }}</span>
        </div>
        <template v-if="doc.type === 'dir' && expanded[doc.id]">
          <div
            v-for="child in doc.children ?? []"
            :key="child.id"
            class="doclist__item doclist__item--child"
            :class="{ 'doclist__item--active': activeId === child.id }"
            @click="activeId = child.id"
          >
            <AppIcon name="file" :size="16" />
            <span class="doclist__name">{{ child.name }}</span>
          </div>
        </template>
        <div
          v-else
          class="doclist__item"
          :class="{ 'doclist__item--active': activeId === doc.id }"
          @click="activeId = doc.id"
        >
          <AppIcon name="file" :size="16" />
          <span class="doclist__name">{{ doc.name }}</span>
        </div>
      </template>
    </div>
  </aside>
</template>

<style scoped>
.doclist {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  background: var(--panel);
  border-right: 1px solid var(--border);
}

.doclist__search {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 12px;
  padding: 6px 10px;
  background: var(--panel-2);
  border-radius: var(--radius);
  color: var(--text-tertiary);
}

.doclist__input {
  flex: 1;
  min-width: 0;
  border: none;
  outline: none;
  background: transparent;
  font-size: 13px;
  color: var(--text);
}

.doclist__input::placeholder {
  color: var(--text-tertiary);
}

.doclist__scroll {
  flex: 1;
  overflow-y: auto;
  padding-bottom: 12px;
}

.doclist__group-label {
  padding: 8px 16px 4px;
  font-size: 12px;
  color: var(--text-tertiary);
}

.doclist__item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 9px 16px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: background 0.12s;
}

.doclist__item:hover {
  background: var(--hover);
}

.doclist__item--active {
  background: var(--active);
  color: var(--text);
}

.doclist__item--child {
  padding-left: 44px;
}

.doclist__chevron {
  transition: transform 0.15s;
}

.doclist__chevron--open {
  transform: rotate(90deg);
}

.doclist__name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
