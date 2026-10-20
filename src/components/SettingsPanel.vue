<script setup lang="ts">
import { onMounted, onUnmounted } from "vue";
import AppIcon from "./AppIcon.vue";
import { useSettingsStore } from "../stores/settings";
import type { ThemeMode } from "../stores/settings";

const props = defineProps<{ open: boolean }>();
const emit = defineEmits<{ (e: "close"): void }>();

const settings = useSettingsStore();

const themeOptions: { value: ThemeMode; label: string }[] = [
  { value: "dark", label: "深色" },
  { value: "light", label: "浅色" },
  { value: "system", label: "跟随系统" },
];

function onEditorFont(e: Event) {
  settings.setEditorFontSize(Number((e.target as HTMLInputElement).value));
}

function onCodeFont(e: Event) {
  settings.setCodeFontSize(Number((e.target as HTMLInputElement).value));
}

function onRenderFont(e: Event) {
  settings.setRenderFontSize(Number((e.target as HTMLInputElement).value));
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === "Escape" && props.open) {
    emit("close");
  }
}

onMounted(() => window.addEventListener("keydown", onKeydown));
onUnmounted(() => window.removeEventListener("keydown", onKeydown));
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="settings-mask" @click.self="emit('close')">
      <div class="settings">
        <header class="settings__head">
          <span class="settings__title">设置</span>
          <button
            class="settings__close"
            type="button"
            title="关闭"
            @click="emit('close')"
          >
            <AppIcon name="more" :size="16" />
          </button>
        </header>

        <div class="settings__body">
          <section class="settings__group">
            <div class="settings__label">主题</div>
            <div class="settings__theme">
              <button
                v-for="opt in themeOptions"
                :key="opt.value"
                class="settings__theme-btn"
                :class="{ 'settings__theme-btn--active': settings.theme === opt.value }"
                type="button"
                @click="settings.setTheme(opt.value)"
              >
                {{ opt.label }}
              </button>
            </div>
          </section>

          <section class="settings__group">
            <div class="settings__label">编辑器字号</div>
            <div class="settings__row">
              <input
                class="settings__number"
                type="number"
                min="12"
                max="24"
                :value="settings.editorFontSize"
                @input="onEditorFont"
              />
              <span class="settings__unit">px</span>
            </div>
          </section>

          <section class="settings__group">
            <div class="settings__label">代码字号</div>
            <div class="settings__row">
              <input
                class="settings__number"
                type="number"
                min="11"
                max="20"
                :value="settings.codeFontSize"
                @input="onCodeFont"
              />
              <span class="settings__unit">px</span>
            </div>
          </section>

          <section class="settings__group">
            <div class="settings__label">渲染区字号</div>
            <div class="settings__row">
              <input
                class="settings__number"
                type="number"
                min="12"
                max="24"
                :value="settings.renderFontSize"
                @input="onRenderFont"
              />
              <span class="settings__unit">px</span>
            </div>
          </section>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.settings-mask {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.45);
}

.settings {
  width: 360px;
  max-width: calc(100vw - 48px);
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: 12px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.35);
  overflow: hidden;
}

.settings__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 1px solid var(--border);
}

.settings__title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text);
}

.settings__close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--text-secondary);
  transition: background 0.12s, color 0.12s;
}

.settings__close:hover {
  background: var(--hover);
  color: var(--text);
}

.settings__body {
  padding: 8px 16px 16px;
}

.settings__group {
  padding: 10px 0;
  border-bottom: 1px solid var(--border);
}

.settings__group:last-child {
  border-bottom: none;
}

.settings__label {
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 8px;
}

.settings__theme {
  display: flex;
  gap: 6px;
}

.settings__theme-btn {
  flex: 1;
  padding: 7px 0;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: transparent;
  color: var(--text-secondary);
  font-size: 13px;
  transition: background 0.12s, color 0.12s, border-color 0.12s;
}

.settings__theme-btn:hover {
  background: var(--hover);
}

.settings__theme-btn--active {
  background: var(--active);
  border-color: var(--accent);
  color: var(--accent);
}

.settings__row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.settings__number {
  width: 80px;
  padding: 6px 10px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--panel-2);
  color: var(--text);
  font-size: 13px;
  outline: none;
}

.settings__number:focus {
  border-color: var(--accent);
}

.settings__unit {
  font-size: 13px;
  color: var(--text-tertiary);
}
</style>
