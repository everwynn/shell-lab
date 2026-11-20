<script setup>
import { computed, ref } from 'vue';
import { HOME, createFsFromSetup } from '../lib/shell/vfs.mjs';
import { runLine } from '../lib/shell/execute.mjs';
import { describeGoal, evaluate } from '../lib/shell/assertions.mjs';
import { markDone } from '../lib/progress.mjs';
import TerminalPanel from './TerminalPanel.vue';
import LevelTasks from './LevelTasks.vue';
import DemoPlayer from './DemoPlayer.vue';

const props = defineProps({ level: { type: Object, required: true } });

const fs = createFsFromSetup(props.level.setup);
const cwd = ref(props.level.setup?.cwd ?? HOME);
const lines = ref([]);
const input = ref('');
const history = ref([]);
const passed = ref(props.level.goals.map(() => false));
const passedOnce = ref(false);

const allPassed = computed(() => passed.value.every(Boolean));
const prompt = computed(() => {
  if (cwd.value === HOME) return '~';
  return cwd.value.startsWith(`${HOME}/`) ? `~${cwd.value.slice(HOME.length)}` : cwd.value;
});
const goalTexts = props.level.goals.map(describeGoal);
const demoOpen = ref(false);

function submit(line) {
  const text = String(line).trim();
  if (!text) return;
  history.value.push(text);
  lines.value.push({ kind: 'cmd', text: `${prompt.value} $ ${text}` });
  const result = runLine({ fs, cwd: cwd.value, user: 'me', line: text });
  cwd.value = result.cwd;
  if (result.clear) lines.value = [];
  else {
    if (result.stdout) lines.value.push({ kind: 'out', text: result.stdout.replace(/\n$/, '') });
    if (result.stderr) lines.value.push({ kind: 'err', text: result.stderr });
  }
  const outcome = evaluate(fs, cwd.value, props.level.goals, { lastOutput: result.stdout });
  passed.value = outcome.passed;
  if (outcome.allPassed && !passedOnce.value) {
    passedOnce.value = true;
    markDone(window.localStorage, props.level.id);
  }
}
</script>

<template>
  <div class="space-y-4">
    <LevelTasks
      :goals="goalTexts"
      :passed="passed"
      :hints="level.hints"
      :all-passed="allPassed"
      @demo="demoOpen = true"
    />
    <TerminalPanel
      v-model="input"
      :lines="lines"
      :prompt="prompt"
      :history="history"
      :chapter="level.chapter"
      @submit="submit"
    />
    <DemoPlayer v-if="demoOpen" :level="level" @close="demoOpen = false" />
  </div>
</template>
