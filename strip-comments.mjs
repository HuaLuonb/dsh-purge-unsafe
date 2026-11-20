import { readFileSync, writeFileSync } from 'node:fs';

const files = [
  'lib/unsafe/index.js',
  'lib/unsafe/compat.js',
  'lib/unsafe/panel.js',
  'lib/unsafe/rules.js',
  'client.js',
  'test/smoke.mjs',
  'test/compat-matrix.mjs',
  'test/panel.test.mjs',
  'test/rules.test.mjs',
];

const REGEX_PREFIX = new Set(['(', ',', '=', ':', '[', '!', '&', '|', '?', '{', '}', ';', '+', '-', '*', '%', '<', '>', '~', '^']);

function strip(src) {
  let out = '';
  let i = 0;
  let state = 'code';
  let prevSignificant = '';
  const templateStack = [];

  while (i < src.length) {
    const c = src[i];
    const n = src[i + 1];

    if (state === 'code') {
      if (c === '/' && n === '/') {
        state = 'line';
        i += 2;
        continue;
      }
      if (c === '/' && n === '*') {
        state = 'block';
        i += 2;
        continue;
      }
      if (c === "'") { state = 'single'; out += c; i += 1; continue; }
      if (c === '"') { state = 'double'; out += c; i += 1; continue; }
      if (c === '`') { state = 'template'; out += c; i += 1; continue; }
      if (c === '/' && (prevSignificant === '' || REGEX_PREFIX.has(prevSignificant))) {
        state = 'regex';
        out += c;
        i += 1;
        continue;
      }
      out += c;
      if (!/\s/.test(c)) prevSignificant = c;
      i += 1;
      continue;
    }

    if (state === 'line') {
      if (c === '\n') {
        state = 'code';
        prevSignificant = '';
        // 丢掉整行注释后，避免留下空行堆叠
        if (!out.endsWith('\n\n')) out += '\n';
        i += 1;
        continue;
      }
      i += 1;
      continue;
    }

    if (state === 'block') {
      if (c === '*' && n === '/') {
        state = 'code';
        i += 2;
        if (!out.endsWith('\n')) out += '\n';
        continue;
      }
      i += 1;
      continue;
    }

    if (state === 'single' || state === 'double') {
      out += c;
      if (c === '\\') { out += src[i + 1] ?? ''; i += 2; continue; }
      if ((state === 'single' && c === "'") || (state === 'double' && c === '"')) state = 'code';
      i += 1;
      continue;
    }

    if (state === 'template') {
      out += c;
      if (c === '\\') { out += src[i + 1] ?? ''; i += 2; continue; }
      if (c === '`') { state = 'code'; i += 1; continue; }
      if (c === '$' && n === '{') { templateStack.push('expr'); state = 'code'; out += n; i += 2; continue; }
      i += 1;
      continue;
    }

    if (state === 'regex') {
      out += c;
      if (c === '\\') { out += src[i + 1] ?? ''; i += 2; continue; }
      if (c === '/') { state = 'code'; i += 1; continue; }
      i += 1;
      continue;
    }
  }

  return out
    .replace(/\n{3,}/g, '\n\n')
    .split('\n')
    .map((line) => (line.trimEnd() === '' ? '' : line.replace(/[ \t]+$/g, '')))
    .join('\n')
    .replace(/\n+$/, '\n');
}

for (const file of files) {
  const before = readFileSync(file, 'utf8');
  const after = strip(before);
  writeFileSync(file, after, 'utf8');
  const beforeLines = before.split('\n').length;
  const afterLines = after.split('\n').length;
  console.log(`${file}: ${beforeLines} → ${afterLines} 行（少 ${beforeLines - afterLines}）`);
}

// YAML 只删纯注释行
const yml = 'cordis.patch.yml';
const y = readFileSync(yml, 'utf8');
const cleaned = y.split('\n').filter((line) => !line.trimStart().startsWith('#')).join('\n').replace(/\n{2,}/g, '\n');
writeFileSync(yml, cleaned.trimStart(), 'utf8');
console.log(`${yml}: ${y.split('\n').length} → ${cleaned.split('\n').length} 行`);
