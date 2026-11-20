// 进度只存 localStorage；storage 可注入，浏览器与测试共用。
export const PROGRESS_KEY = 'shell-lab:progress:v1';

export function loadProgress(storage) {
  try {
    const raw = storage?.getItem(PROGRESS_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data.filter((item) => typeof item === 'string') : [];
  } catch {
    return [];
  }
}

export function saveProgress(storage, done) {
  try {
    storage?.setItem(PROGRESS_KEY, JSON.stringify([...new Set(done)]));
    return true;
  } catch {
    return false;
  }
}

export function markDone(storage, id) {
  const done = loadProgress(storage);
  if (!done.includes(id)) done.push(id);
  saveProgress(storage, done);
  return done;
}

export function clearProgress(storage) {
  try {
    storage?.removeItem(PROGRESS_KEY);
  } catch {
    // 隐私模式下 localStorage 可能不可写，忽略。
  }
}
