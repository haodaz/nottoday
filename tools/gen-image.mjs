/**
 * NOT TODAY 素材出图：阿里云百炼 DashScope，qwen-image 系列（同步接口）。
 * 密钥从 ../../../companydata/.env.local 读取（DASHSCOPE_API_KEY），不复制到本仓库。
 *   node gen-image.mjs <输出文件> "<提示词>" [--size=1664*928] [--model=qwen-image-2.1-turbo]
 */
import fs from 'fs';
import path from 'path';
const here = path.dirname(new URL(import.meta.url).pathname);
const envFile = path.resolve(here, '../../../companydata/.env.local');
const env = {};
for (const l of fs.readFileSync(envFile, 'utf8').split('\n').filter(l => l.includes('=') && !l.startsWith('#'))) {
  const i = l.indexOf('='); env[l.slice(0, i).trim()] = l.slice(i + 1).trim().replace(/^["']|["']$/g, '');
}
const KEY = env.DASHSCOPE_API_KEY;
if (!KEY) { console.error('缺少 DASHSCOPE_API_KEY'); process.exit(1); }
const args = process.argv.slice(2);
const flags = Object.fromEntries(args.filter(a => a.startsWith('--')).map(a => { const [k, v = '1'] = a.slice(2).split('='); return [k, v]; }));
const [out, prompt] = args.filter(a => !a.startsWith('--'));
if (!out || !prompt) { console.error('用法：node gen-image.mjs <输出文件> "<提示词>"'); process.exit(1); }
const MODEL = flags.model || 'qwen-image-2.1-turbo';
const SIZE = flags.size || '1664*928';
const NEG = flags.negative || '文字, 字母, 数字, 水印, logo, 低清, 噪点, 畸变, 杂乱, 真人照片, 现代扁平插画, 3D渲染, 血腥';
const res = await fetch('https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation', {
  method: 'POST',
  headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    model: MODEL,
    input: { messages: [{ role: 'user', content: [{ text: prompt }] }] },
    parameters: { size: SIZE, n: 1, prompt_extend: true, watermark: false, negative_prompt: NEG },
  }),
});
const j = await res.json();
const url = j?.output?.choices?.[0]?.message?.content?.find?.(c => c.image)?.image;
if (!res.ok || !url) { console.error('失败：', JSON.stringify(j).slice(0, 600)); process.exit(1); }
fs.mkdirSync(path.dirname(out), { recursive: true });
const buf = Buffer.from(await (await fetch(url)).arrayBuffer());
fs.writeFileSync(out, buf);
console.log(`OK ${out} ${(buf.length / 1024).toFixed(0)}KB usage=${JSON.stringify(j.usage || {})}`);
