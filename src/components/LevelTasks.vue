<script setup>
import { ref } from 'vue';

defineProps({
  goals: { type: Array, default: () => [] },
  passed: { type: Array, default: () => [] },
  hints: { type: Array, default: () => [] },
  allPassed: { type: Boolean, default: false },
});
const emit = defineEmits(['demo']);
const hintOpen = ref(false);
const hintStep = ref(0);
</script>

<template>
  <section class="rounded-lg border border-line bg-surface p-4">
    <h2 class="text-sm font-semibold">任务目标</h2>
    <ul class="mt-2 space-y-1 text-[13px]">
      <li v-for="(goal, index) in goals" :key="goal" class="flex items-start gap-2">
        <span :class="passed[index] ? 'text-ok' : 'text-muted'">{{ passed[index] ? '✓' : '○' }}</span>
        <span :class="passed[index] ? 'text-muted line-through' : ''">{{ goal }}</span>
      </li>
    </ul>
    <p v-if="allPassed" class="mt-3 rounded border border-ok/40 bg-ok/10 px-3 py-2 text-[13px] text-ok">
      全部目标完成！可以进入下一关。
    </p>
    <div class="mt-3 flex flex-wrap gap-4 text-[12px]">
      <button type="button" class="text-muted hover:text-ink hover:underline underline-offset-2" @click="hintOpen = !hintOpen">
        {{ hintOpen ? '收起提示' : '提示' }}
      </button>
      <button type="button" class="text-muted hover:text-ink hover:underline underline-offset-2" @click="emit('demo')">看演示</button>
    </div>
    <div v-if="hintOpen" class="mt-2 space-y-2 text-[12px] leading-relaxed text-muted">
      <p>{{ hints[0] }}</p>
      <p v-if="hintStep > 0">{{ hints[1] }}</p>
      <button
        v-else
        type="button"
        class="hover:text-ink hover:underline underline-offset-2"
        @click="hintStep = 1"
      >再提示一点</button>
    </div>
  </section>
</template>
