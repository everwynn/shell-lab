<script setup>
import { nextTick, ref, watch } from 'vue';
import { COMMANDS } from '../lib/shell/commands.mjs';

const props = defineProps({
  lines: { type: Array, default: () => [] },
  prompt: { type: String, default: '~' },
  history: { type: Array, default: () => [] },
  chapter: { type: String, default: 'files' },
});
const emit = defineEmits(['submit']);
const input = defineModel({ type: String, default: '' });

const outputEl = ref(null);
const inputEl = ref(null);
let cursor = -1;

const QUICK = {
  files: ['ls', 'cd', 'pwd', 'mkdir', 'cp', 'mv', 'rm', '|', '>', '~'],
  text: ['cat', 'grep', 'wc', 'head', 'tail', '|', '>', '>>', '~'],
  perms: ['ls -l', 'chmod', 'chown', '600', '644', '700', '755', '775', '~'],
};

function insert(text) {
  const el = inputEl.value;
  if (!el) { input.value += text; return; }
  const start = el.selectionStart ?? input.value.length;
  const end = el.selectionEnd ?? input.value.length;
  input.value = input.value.slice(0, start) + text + input.value.slice(end);
  nextTick(() => {
    el.focus();
    el.setSelectionRange(start + text.length, start + text.length);
  });
}

// 点击终端窗口任意处聚焦输入；拖选文本时不抢焦点，方便复制输出
function focusInput(event) {
  if (event?.target instanceof HTMLInputElement) return;
  const selection = window.getSelection?.();
  if (selection && !selection.isCollapsed) return;
  inputEl.value?.focus();
}

function submitLine() {
  if (!input.value.trim()) return;
  const line = input.value;
  input.value = '';
  emit('submit', line);
  cursor = -1;
}

function onKey(event) {
  if (event.key === 'Enter') { event.preventDefault(); submitLine(); return; }
  if (event.key === 'ArrowUp') {
    event.preventDefault();
    if (!props.history.length) return;
    cursor = cursor < 0 ? props.history.length - 1 : Math.max(0, cursor - 1);
    input.value = props.history[cursor];
    return;
  }
  if (event.key === 'ArrowDown') {
    event.preventDefault();
    if (cursor < 0) return;
    cursor += 1;
    if (cursor >= props.history.length) { cursor = -1; input.value = ''; }
    else input.value = props.history[cursor];
    return;
  }
  if (event.key === 'Tab') {
    event.preventDefault();
    const prefix = input.value.trim();
    if (!prefix || prefix.includes(' ')) return;
    const matches = Object.keys(COMMANDS).filter((name) => name.startsWith(prefix));
    if (matches.length === 1) input.value = `${matches[0]} `;
  }
}

watch(() => props.lines.length, async () => {
  await nextTick();
  outputEl.value?.scrollTo({ top: outputEl.value.scrollHeight });
});
</script>

<template>
  <section class="overflow-hidden rounded-lg border border-line bg-surface">
    <!-- 终端窗口：输出区在上滚动，输入行钉在窗口内底部（同真实终端） -->
    <div class="flex h-80 flex-col bg-zinc-950 sm:h-96" @click="focusInput">
      <div ref="outputEl" class="min-h-0 flex-1 overflow-y-auto px-4 py-3 font-mono text-[12px] leading-relaxed text-zinc-200">
        <p class="text-zinc-500">Shell Lab 模拟终端 · 输入 help 查看支持的命令</p>
        <div
          v-for="(line, index) in lines"
          :key="index"
          class="whitespace-pre-wrap"
          :class="line.kind === 'err' ? 'text-red-400' : line.kind === 'cmd' ? 'text-emerald-300' : 'text-zinc-200'"
        >{{ line.text }}</div>
      </div>
      <div class="flex items-center gap-2 border-t border-zinc-800 px-4 py-2 font-mono text-[12px]">
        <span class="shrink-0 text-zinc-500">{{ prompt }} $</span>
        <input
          ref="inputEl"
          v-model="input"
          id="shell-command-input"
          class="min-w-0 flex-1 bg-transparent text-zinc-200 caret-zinc-100 outline-none"
          autocomplete="off"
          autocapitalize="off"
          spellcheck="false"
          aria-label="命令输入"
          @keydown="onKey"
        />
      </div>
    </div>
    <!-- 移动端快捷条（桌面 hidden，<sm 显示；无脚本控制的显隐，避开 hidden 属性冲突） -->
    <div class="flex flex-wrap gap-1.5 border-t border-line px-3 py-2 sm:hidden">
      <button
        v-for="key in QUICK[chapter] ?? QUICK.files"
        :key="key"
        type="button"
        class="rounded border border-line px-2 py-0.5 font-mono text-[11px] text-muted"
        @click="insert(key)"
      >{{ key }}</button>
    </div>
  </section>
</template>
