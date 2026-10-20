<script setup lang="ts">
import { icons, type IconName } from "../icons";

const props = defineProps<{
  name: IconName;
  size?: number;
}>();
</script>

<template>
  <span
    class="app-icon"
    :style="{ width: `${props.size ?? 18}px`, height: `${props.size ?? 18}px` }"
    v-html="icons[props.name]"
  />
</template>

<style scoped>
.app-icon {
  display: inline-flex;
  flex-shrink: 0;
  line-height: 0;
}

.app-icon :deep(svg) {
  width: 100%;
  height: 100%;
}
</style>
