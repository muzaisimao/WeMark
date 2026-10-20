<script setup lang="ts">
import SideBar from "./components/SideBar.vue";
import DocList from "./components/DocList.vue";
import RenderArea from "./components/RenderArea.vue";
import EditorArea from "./components/EditorArea.vue";
import { useLayoutStore } from "./stores/layout";

const layout = useLayoutStore();

function startVDrag(e: MouseEvent) {
  e.preventDefault();
  const startX = e.clientX;
  const startWidth = layout.doclistWidth;
  document.body.style.cursor = "col-resize";
  document.body.style.userSelect = "none";

  const onMove = (ev: MouseEvent) => {
    ev.preventDefault();
    layout.setDoclistWidth(startWidth + (ev.clientX - startX));
  };
  const onUp = () => {
    document.removeEventListener("mousemove", onMove);
    document.removeEventListener("mouseup", onUp);
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
  };
  document.addEventListener("mousemove", onMove);
  document.addEventListener("mouseup", onUp);
}

function startHDrag(e: MouseEvent) {
  e.preventDefault();
  const startY = e.clientY;
  const startHeight = layout.editorHeight;
  document.body.style.cursor = "row-resize";
  document.body.style.userSelect = "none";

  const onMove = (ev: MouseEvent) => {
    ev.preventDefault();
    // 向上拖（clientY 减小）→ 编辑区增高
    layout.setEditorHeight(startHeight - (ev.clientY - startY));
  };
  const onUp = () => {
    document.removeEventListener("mousemove", onMove);
    document.removeEventListener("mouseup", onUp);
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
  };
  document.addEventListener("mousemove", onMove);
  document.addEventListener("mouseup", onUp);
}
</script>

<template>
  <div class="app">
    <SideBar />
    <DocList />
    <div class="app__v-resizer" @mousedown="startVDrag" />
    <main class="app__main">
      <RenderArea />
      <div class="app__h-resizer" @mousedown="startHDrag" />
      <EditorArea />
    </main>
  </div>
</template>

<style scoped>
.app {
  display: flex;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
}

.app__main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.app__v-resizer {
  width: 4px;
  flex-shrink: 0;
  cursor: col-resize;
  background: transparent;
  transition: background 0.12s;
}

.app__v-resizer:hover,
.app__v-resizer:active {
  background: var(--accent);
}

.app__h-resizer {
  height: 4px;
  flex-shrink: 0;
  cursor: row-resize;
  background: transparent;
  transition: background 0.12s;
}

.app__h-resizer:hover,
.app__h-resizer:active {
  background: var(--accent);
}
</style>
