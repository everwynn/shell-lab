// 词法：把一行命令切成「管道段」，每段带可选重定向。
// v1 不做转义与变量；引号只保证内部内容整体成词。
export function tokenize(line) {
  const input = String(line ?? '');
  const commands = [];
  let words = [];
  let quoted = false; // 当前词是否由引号产生（允许空串成词）
  let word = '';
  let quote = null;
  let pending = null; // 待接收目标的重定向类型

  let currentRedirect = null;
  const flushWord = () => {
    if (!word && !quoted) return;
    if (pending) {
      pending = null;
      currentRedirect = { type: currentRedirect.type, target: word };
    } else {
      words.push(word);
    }
    word = '';
    quoted = false;
  };

  const flushCommand = () => {
    if (pending) throw new Error('重定向缺少目标文件');
    if (!words.length) throw new Error('空命令');
    commands.push({ words, redirect: currentRedirect });
    words = [];
    currentRedirect = null;
  };

  try {
    for (let index = 0; index < input.length; index += 1) {
      const ch = input[index];
      if (quote) {
        if (ch === quote) quote = null;
        else word += ch;
        continue;
      }
      if (ch === '"' || ch === "'") {
        quote = ch;
        quoted = true;
        continue;
      }
      if (ch === ' ' || ch === '\t') {
        flushWord();
        continue;
      }
      if (ch === '|') {
        flushWord();
        flushCommand();
        continue;
      }
      if (ch === '>') {
        flushWord();
        if (pending || currentRedirect) throw new Error('重复重定向');
        const type = input[index + 1] === '>' ? '>>' : '>';
        if (type === '>>') index += 1;
        pending = type;
        currentRedirect = { type, target: '' };
        continue;
      }
      word += ch;
    }
    if (quote) throw new Error('引号未闭合');
    flushWord();
    // 整行只有空白时返回空命令表；否则收尾最后一段（空段仍报错）。
    if (words.length || currentRedirect || pending || commands.length) flushCommand();
  } catch (error) {
    return { error: error.message };
  }
  return { commands };
}
