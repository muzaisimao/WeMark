<script setup lang="ts">
import AppIcon from "./AppIcon.vue";
import type { IconName } from "../icons";

interface SideItem {
  key: string;
  label: string;
  icon: IconName;
}

const topItems: SideItem[] = [
  { key: "new", label: "新建文档", icon: "plus" },
  { key: "open", label: "打开", icon: "folder" },
  { key: "search", label: "搜索", icon: "search" },
];

const bottomItems: SideItem[] = [
  { key: "settings", label: "设置", icon: "settings" },
];
</script>

<template>
  <aside class="sidebar">
    <div class="sidebar__top">
      <button
        v-for="item in topItems"
        :key="item.key"
        class="sidebar__btn"
        :title="item.label"
        type="button"
      >
        <AppIcon :name="item.icon" :size="22" />
      </button>
    </div>
    <div class="sidebar__bottom">
      <button
        v-for="item in bottomItems"
        :key="item.key"
        class="sidebar__btn"
        :title="item.label"
        type="button"
      >
        <AppIcon :name="item.icon" :size="22" />
      </button>
    </div>
  </aside>
</template>

<style scoped>
.sidebar {
  width: var(--sidebar-width);
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0;
  background: var(--panel);
  border-right: 1px solid var(--border);
}

.sidebar__top,
.sidebar__bottom {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.sidebar__btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: var(--text-secondary);
  transition: background 0.15s, color 0.15s;
}

.sidebar__btn:hover {
  background: var(--hover);
  color: var(--text);
}

.sidebar__btn:active {
  background: var(--active);
}
</style>
