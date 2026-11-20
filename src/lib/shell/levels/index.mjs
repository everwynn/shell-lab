import filesLevels from './files.mjs';
import textLevels from './text.mjs';
import permsLevels from './perms.mjs';

export const CHAPTERS = [
  { id: 'files', title: '文件与目录', description: 'pwd、ls、cd、mkdir、cp、mv、rm 与通配符' },
  { id: 'text', title: '文本与管道', description: 'cat、echo、grep、head、tail、wc 与 | > >>' },
  { id: 'perms', title: '权限与用户', description: 'chmod、chown 与 644/755/775 这些数字' },
];

export const LEVELS = [...filesLevels, ...textLevels, ...permsLevels];

export function chapterLevels(chapterId) {
  return LEVELS.filter((level) => level.chapter === chapterId);
}

export function getLevel(id) {
  return LEVELS.find((level) => level.id === id) ?? null;
}

export function nextLevel(id) {
  const index = LEVELS.findIndex((level) => level.id === id);
  return index >= 0 ? LEVELS[index + 1] ?? null : null;
}

export function prevLevel(id) {
  const index = LEVELS.findIndex((level) => level.id === id);
  return index > 0 ? LEVELS[index - 1] : null;
}
