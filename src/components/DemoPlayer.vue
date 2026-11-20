<script setup>
import { computed, onBeforeUnmount, ref } from 'vue';
import { HOME, createFsFromSetup } from '../lib/shell/vfs.mjs';
import { runLine } from '../lib/shell/execute.mjs';

const props = defineProps({ level: { type: Object, required: true } });
const emit = defineEmits(['close']);

// 在 setup 副本上把整段 demo 预计算完，练习会话不会被污染。
const steps = computed(() => {
  const fs = createFsFromSetup(props.level.setup);
  let cwd = props.level.setup?.cwd ?? HOME;
  return props.level.demo.map((line) => {
    const result = runLine({ fs, cwd, user: 'me', line });
    cwd = result.cwd;
    return { line, stdout: result.stdout, stderr: result.stderr };
  });
});

const index = ref(0);
const playing = ref(false);
let timer = null;

function goto(next) {
  index.value = Math.min(Math.max(next, 0), steps.value.length - 1);
}

function stop() {
  playing.value = false;
  if (timer) { window.clearInterval(timer); timer = null; }
}

function togglePlay() {
  if (playing.value) { stop(); return; }
  playing.value = true;
  timer = window.setInterval(() => {
    if (index.value >= steps.value.length - 1) { stop(); return; }
    index.value += 1;
  }, 1000);
}

function close() {
  stop();
  emit('close');
}

onBeforeUnmount(stop);
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-label="演示回放">
    <div class="w-full max-w-xl rounded-lg border border-line bg-surface shadow-xl">
      <header class="flex items-center justify-between border-b border-line px-4 py-3">
        <h2 class="text-sm font-semibold">演示回放（不会影响你的练习）</h2>
        <button type="button" class="text-[12px] text-muted hover:text-ink" @click="close">关闭</button>
      </header>
      <div class="max-h-80 overflow-y-auto bg-zinc-950 px-4 py-3 font-mono text-[12px] leading-relaxed">
        <template v-for="(step, stepIndex) in steps.slice(0, index + 1)" :key="stepIndex">
          <p class="text-emerald-300">~ $ {{ step.line }}</p>
          <p v-if="step.stdout" class="whitespace-pre-wrap text-zinc-200">{{ step.stdout.replace(/\n$/, '') }}</p>
          <p v-if="step.stderr" class="whitespace-pre-wrap text-red-400">{{ step.stderr }}</p>
        </template>
      </div>
      <footer class="flex items-center justify-between border-t border-line px-4 py-3 text-[12px]">
        <span class="text-muted">第 {{ index + 1 }} / {{ steps.length }} 步</span>
        <div class="flex gap-3">
          <button type="button" class="text-muted hover:text-ink disabled:opacity-40" :disabled="index === 0" @click="goto(index - 1)">上一步</button>
          <button type="button" class="text-muted hover:text-ink disabled:opacity-40" :disabled="index >= steps.length - 1" @click="goto(index + 1)">下一步</button>
          <button type="button" class="text-ink" @click="togglePlay">{{ playing ? '暂停' : '自动播放' }}</button>
        </div>
      </footer>
    </div>
  </div>
</template>
