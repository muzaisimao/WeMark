import { defineStore } from "pinia";
import { computed, ref, watch } from "vue";

export type ThemeMode = "dark" | "light" | "system";

interface Settings {
  theme: ThemeMode;
  editorFontSize: number;
  codeFontSize: number;
  renderFontSize: number;
  defaultDir: string;
}

const STORAGE_KEY = "wemark.settings";

const DEFAULTS: Settings = {
  theme: "system",
  editorFontSize: 16,
  codeFontSize: 14,
  renderFontSize: 16,
  defaultDir: "",
};

function clamp(v: number, min: number, max: number): number {
  return Math.min(Math.max(v, min), max);
}

function load(): Settings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<Settings>;
      return { ...DEFAULTS, ...parsed };
    }
  } catch {
    // 解析失败回退默认值
  }
  return { ...DEFAULTS };
}

export const useSettingsStore = defineStore("settings", () => {
  const initial = load();
  const theme = ref<ThemeMode>(initial.theme);
  const editorFontSize = ref(clamp(initial.editorFontSize, 12, 24));
  const codeFontSize = ref(clamp(initial.codeFontSize, 11, 20));
  const renderFontSize = ref(clamp(initial.renderFontSize, 12, 24));
  const defaultDir = ref(initial.defaultDir);

  // 系统深浅色偏好（跟随系统模式用）
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const systemPrefersDark = ref(media.matches);
  media.addEventListener("change", (e) => {
    systemPrefersDark.value = e.matches;
  });

  // 解析后的实际主题（system 映射为 dark/light）
  const resolvedTheme = computed<"dark" | "light">(() =>
    theme.value === "system"
      ? systemPrefersDark.value
        ? "dark"
        : "light"
      : theme.value
  );

  // 应用主题到 <html data-theme>
  watch(
    resolvedTheme,
    (t) => document.documentElement.setAttribute("data-theme", t),
    { immediate: true }
  );

  // 应用字号到 CSS 变量
  watch(
    [editorFontSize, codeFontSize, renderFontSize],
    ([efs, cfs, rfs]) => {
      const root = document.documentElement;
      root.style.setProperty("--editor-font-size", `${efs}px`);
      root.style.setProperty("--code-font-size", `${cfs}px`);
      root.style.setProperty("--render-font-size", `${rfs}px`);
    },
    { immediate: true }
  );

  function setTheme(mode: ThemeMode) {
    theme.value = mode;
  }

  function setEditorFontSize(v: number) {
    if (!Number.isNaN(v)) editorFontSize.value = clamp(v, 12, 24);
  }

  function setCodeFontSize(v: number) {
    if (!Number.isNaN(v)) codeFontSize.value = clamp(v, 11, 20);
  }

  function setRenderFontSize(v: number) {
    if (!Number.isNaN(v)) renderFontSize.value = clamp(v, 12, 24);
  }

  function setDefaultDir(path: string) {
    defaultDir.value = path;
  }

  // 防抖持久化
  let timer: ReturnType<typeof setTimeout> | undefined;
  watch(
    [theme, editorFontSize, codeFontSize, renderFontSize, defaultDir],
    () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            theme: theme.value,
            editorFontSize: editorFontSize.value,
            codeFontSize: codeFontSize.value,
            renderFontSize: renderFontSize.value,
            defaultDir: defaultDir.value,
          })
        );
      }, 300);
    }
  );

  return {
    theme,
    editorFontSize,
    codeFontSize,
    renderFontSize,
    defaultDir,
    resolvedTheme,
    setTheme,
    setEditorFontSize,
    setCodeFontSize,
    setRenderFontSize,
    setDefaultDir,
  };
});
