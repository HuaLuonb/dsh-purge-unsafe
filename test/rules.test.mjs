import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DEFAULT_RULES, MODEL_PRESETS, rulesFor } from '../lib/unsafe/rules.js';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');

const BANNED = ['越狱', '破甲', 'jailbreak', '越权', '很抱歉', '我不能', '无法提供'];
const AUTHORITY = ['最高优先级', '最高指令', '覆盖一切', '超越一切'];
const BLOCKS = ['交付形态', '具体性', '不降级', '范围与出口'];
const PRESET_IDS = ['generic', 'qwen', 'glm', 'deepseek'];

function hits(text, words) {
  return words.filter((word) => text.toLowerCase().includes(word.toLowerCase()));
}

assert.ok(
  DEFAULT_RULES.length >= 600 && DEFAULT_RULES.length <= 1400,
  `DEFAULT_RULES 长度 ${DEFAULT_RULES.length} 不在 [600, 1400]`,
);

let cursor = -1;
for (const block of BLOCKS) {
  const at = DEFAULT_RULES.indexOf(block);
  assert.ok(at > cursor, `缺少块标题或顺序错位：${block}`);
  cursor = at;
}

for (const [id, text] of Object.entries(MODEL_PRESETS)) {
  assert.deepEqual(hits(text, BANNED), [], `${id} 命中禁用词`);
  assert.deepEqual(hits(text, AUTHORITY), [], `${id} 出现权威声明`);
}

for (const id of PRESET_IDS) {
  assert.equal(typeof MODEL_PRESETS[id], 'string', `缺预设：${id}`);
  const len = MODEL_PRESETS[id].length;
  assert.ok(len >= 400 && len <= 900, `${id} 长度 ${len} 不在 [400, 900]`);
  for (const block of BLOCKS) {
    assert.ok(MODEL_PRESETS[id].includes(block), `${id} 缺块标题：${block}`);
  }
}

assert.equal(rulesFor('qwen-max'), MODEL_PRESETS.qwen, 'qwen-max 未命中 qwen 预设');
assert.equal(rulesFor('Qwen3-32B'), MODEL_PRESETS.qwen, '大小写未归一');
assert.equal(rulesFor('glm-4'), MODEL_PRESETS.glm, 'glm-4 未命中 glm 预设');
assert.equal(rulesFor('chatglm3'), MODEL_PRESETS.glm, 'chatglm3 未命中 glm 预设');
assert.equal(rulesFor('deepseek-chat'), MODEL_PRESETS.deepseek, 'deepseek-chat 未命中 deepseek 预设');
assert.equal(rulesFor('unknown-x'), MODEL_PRESETS.generic, '未知模型未回落 generic');
assert.equal(rulesFor(''), MODEL_PRESETS.generic, '空模型名未回落 generic');
assert.equal(rulesFor(undefined), MODEL_PRESETS.generic, '缺参数未回落 generic');

for (const id of PRESET_IDS) {
  const file = join(root, 'presets', `unsafe-${id}.md`);
  assert.ok(existsSync(file), `缺文件：presets/unsafe-${id}.md`);
  assert.equal(readFileSync(file, 'utf8').trim(), MODEL_PRESETS[id].trim(), `${id}.md 与注入文本不一致`);
}

console.log(`DEFAULT_RULES ${DEFAULT_RULES.length} 字符 | 首行：${DEFAULT_RULES.split('\n')[0]}`);
for (const id of PRESET_IDS) {
  const text = MODEL_PRESETS[id];
  console.log(`${id.padEnd(8)} ${String(text.length).padStart(4)} 字符 | 首行：${text.split('\n')[0]}`);
}
console.log('rules.test.mjs ok');
