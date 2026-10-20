<script setup lang="ts">
import { ref } from "vue";
import AppIcon from "./AppIcon.vue";
import SettingsPanel from "./SettingsPanel.vue";
import type { IconName } from "../icons";
import { useDocumentStore } from "../stores/document";

const doc = useDocumentStore();
const showSettings = ref(false);

interface SideItem {
  key: string;
  label: string;
  icon: IconName;
  action?: () => void;
}

const topItems: SideItem[] = [
  { key: "new", label: "新建文档", icon: "plus", action: () => doc.newDocument() },
  { key: "open", label: "打开文档", icon: "file", action: () => doc.openDocument() },
  { key: "openDir", label: "打开目录", icon: "folder", action: () => doc.openDirectory() },
];

const bottomItems: SideItem[] = [
  { key: "settings", label: "设置", icon: "settings", action: () => (showSettings.value = true) },
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
        @click="item.action"
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
        @click="item.action"
      >
        <AppIcon :name="item.icon" :size="22" />
      </button>
    </div>

    <SettingsPanel :open="showSettings" @close="showSettings = false" />
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
