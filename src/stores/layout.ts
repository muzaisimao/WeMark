import { defineStore } from "pinia";
import { ref, watch } from "vue";

const STORAGE_KEY = "wemark.layout";

export const DOCLIST_MIN = 180;
export const DOCLIST_MAX = 400;
export const DOCLIST_DEFAULT = 260;
export const EDITOR_MIN = 80;
export const EDITOR_MAX = 400;
export const EDITOR_DEFAULT = 160;

interface PersistedLayout {
  doclistWidth?: number;
  editorHeight?: number;
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(Math.max(v, min), max);
}

function load(): { doclistWidth: number; editorHeight: number } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as PersistedLayout;
      return {
        doclistWidth: clamp(
          parsed.doclistWidth ?? DOCLIST_DEFAULT,
          DOCLIST_MIN,
          DOCLIST_MAX
        ),
        editorHeight: clamp(
          parsed.editorHeight ?? EDITOR_DEFAULT,
          EDITOR_MIN,
          EDITOR_MAX
        ),
      };
    }
  } catch {
    // 忽略解析错误，回退到默认值
  }
  return { doclistWidth: DOCLIST_DEFAULT, editorHeight: EDITOR_DEFAULT };
}

export const useLayoutStore = defineStore("layout", () => {
  const initial = load();
  const doclistWidth = ref(initial.doclistWidth);
  const editorHeight = ref(initial.editorHeight);

  function setDoclistWidth(width: number) {
    doclistWidth.value = clamp(width, DOCLIST_MIN, DOCLIST_MAX);
  }

  function setEditorHeight(height: number) {
    editorHeight.value = clamp(height, EDITOR_MIN, EDITOR_MAX);
  }

  // 防抖持久化：拖拽停止 300ms 后写入 localStorage
  let timer: ReturnType<typeof setTimeout> | undefined;
  watch([doclistWidth, editorHeight], () => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          doclistWidth: doclistWidth.value,
          editorHeight: editorHeight.value,
        })
      );
    }, 300);
  });

  return { doclistWidth, editorHeight, setDoclistWidth, setEditorHeight };
});
