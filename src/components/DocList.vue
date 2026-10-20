<script setup lang="ts">
import { computed } from "vue";
import AppIcon from "./AppIcon.vue";
import { useLayoutStore } from "../stores/layout";
import { useDocumentStore } from "../stores/document";
import type { DocNode } from "../stores/document";

const layout = useLayoutStore();
const doc = useDocumentStore();

interface DisplayItem {
  node: DocNode;
  depth: number;
}

// 树形展示列表：置顶文件单独归入「置顶」分组，其余按目录递归展开
const treeItems = computed<DisplayItem[]>(() => {
  const result: DisplayItem[] = [];
  const walk = (nodes: DocNode[], depth: number) => {
    for (const n of nodes) {
      if (n.type === "file" && n.pinned) continue;
      result.push({ node: n, depth });
      if (n.type === "dir" && doc.expandedDirs[n.id] && n.children) {
        walk(n.children, depth + 1);
      }
    }
  };
  walk(doc.docList, 0);
  return result;
});

function indent(depth: number): string {
  return `${16 + depth * 28}px`;
}
</script>

<template>
  <aside class="doclist" :style="{ width: `${layout.doclistWidth}px` }">
    <div class="doclist__search">
      <AppIcon name="search" :size="14" class="doclist__search-icon" />
      <input
        v-model="doc.searchKeyword"
        class="doclist__input"
        type="text"
        placeholder="搜索文档或内容"
      />
    </div>

    <div class="doclist__scroll">
      <template v-if="doc.searching">
        <div class="doclist__group-label">搜索结果</div>
        <div v-if="doc.searchResults.length === 0" class="doclist__empty">
          无匹配文档
        </div>
        <div
          v-for="item in doc.searchResults"
          :key="item.id"
          class="doclist__item"
          :class="{ 'doclist__item--active': doc.activeDocId === item.id }"
          @click="doc.setActiveDoc(item.id)"
        >
          <AppIcon name="file" :size="16" />
          <span class="doclist__name">{{ item.name }}</span>
        </div>
      </template>

      <template v-else>
        <template v-if="doc.pinnedDocs.length">
          <div class="doclist__group-label">置顶</div>
          <div
            v-for="item in doc.pinnedDocs"
            :key="item.id"
            class="doclist__item"
            :class="{ 'doclist__item--active': doc.activeDocId === item.id }"
            @click="doc.setActiveDoc(item.id)"
          >
            <AppIcon name="file" :size="16" />
            <span class="doclist__name">{{ item.name }}</span>
            <button
              class="doclist__pin doclist__pin--active"
              type="button"
              title="取消置顶"
              @click.stop="doc.togglePin(item.id)"
            >
              <AppIcon name="pin" :size="13" />
            </button>
          </div>
        </template>

        <div class="doclist__group-label">文档</div>

        <template v-for="item in treeItems" :key="item.node.id">
          <div
            v-if="item.node.type === 'dir'"
            class="doclist__item doclist__item--dir"
            :style="{ paddingLeft: indent(item.depth) }"
            @click="doc.toggleExpand(item.node.id)"
          >
            <AppIcon
              name="chevron"
              :size="14"
              class="doclist__chevron"
              :class="{
                'doclist__chevron--open': doc.expandedDirs[item.node.id],
              }"
            />
            <AppIcon name="folder" :size="16" />
            <span class="doclist__name">{{ item.node.name }}</span>
          </div>
          <div
            v-else
            class="doclist__item"
            :class="{
              'doclist__item--active': doc.activeDocId === item.node.id,
            }"
            :style="{ paddingLeft: indent(item.depth) }"
            @click="doc.setActiveDoc(item.node.id)"
          >
            <AppIcon name="file" :size="16" />
            <span class="doclist__name">{{ item.node.name }}</span>
            <button
              class="doclist__pin"
              :class="{ 'doclist__pin--active': item.node.pinned }"
              type="button"
              :title="item.node.pinned ? '取消置顶' : '置顶'"
              @click.stop="doc.togglePin(item.node.id)"
            >
              <AppIcon name="pin" :size="13" />
            </button>
          </div>
        </template>
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

.doclist__empty {
  padding: 16px;
  text-align: center;
  font-size: 13px;
  color: var(--text-tertiary);
}

.doclist__pin {
  display: none;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--text-tertiary);
  cursor: pointer;
  flex-shrink: 0;
}

.doclist__item:hover .doclist__pin {
  display: inline-flex;
}

.doclist__pin--active {
  display: inline-flex;
  color: var(--accent);
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
