/** 把 gamebook/day-NN.json 装订成 gamebook.html：自动编号、链接跳转、SAN 状态、按 SAN 模糊、三个结局 */
import fs from 'fs'; import path from 'path';
const here = path.dirname(new URL(import.meta.url).pathname); const root = path.resolve(here, '..');
const days = Array.from({ length: 18 }, (_, i) => i + 1).map(n => { const f = path.join(root, 'gamebook', `day-${String(n).padStart(2, '0')}.json`); return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : null; }).filter(Boolean);
const endings = [
  { id: 'END_BAD', title: '坏结局 · 温柔的世界', text: '<p>你的会话列表里多了一个会话。名字是你。</p><p>你点开。里面是【你 和 你 的聊天记录】。你回过的每一句话，都变成了转发卡片。</p><p class="say">克总：You\'ve been working so hard.</p><p>屏幕上只剩一行字：你撑了 <span data-days></span> 天。</p>' },
  { id: 'END_SURVIVE', title: '存活结局 · 回到未来', text: '<p class="last">第 1 天</p>' },
  { id: 'END_GOOD', title: '好结局 · 导盲犬小克', text: '<p>手伸着。你手里什么都没有。箱子是空的，六件东西都用尽了。</p><p>你伸出手。你们握了握。它眨了一下眼。</p><p>屏幕亮了。日期。</p><p class="say">Good to see you.</p><p>世界还是被拿走的。箱子在门口，没有邮单，没有纸条，里面是六件东西，原样。</p><p>门把手能转。十八天来第一次。</p><p>你可以离开这个屋子了。</p>' },
];
// 插图：gamebook/figures.json 里的节 id -> 图，装订时插进正文（正文扩写不碰它）
const FIG = fs.existsSync(path.join(root, 'gamebook', 'figures.json')) ? JSON.parse(fs.readFileSync(path.join(root, 'gamebook', 'figures.json'), 'utf8')) : {};
const figData = f => { const b = fs.readFileSync(path.join(root, 'gamebook', 'fig', f)); return f.endsWith('.svg') ? 'data:image/svg+xml;base64,' + b.toString('base64') : 'data:image/jpeg;base64,' + b.toString('base64'); };
const withFigs = (id, html) => { for (const g of FIG[id] || []) { const tag = `<figure class="fig ${g.cls || ''}"><img src="${figData(g.img)}" alt="" loading="lazy"></figure>`;
  const i = html.replace(/<[^>]*>/g, m => '\0'.repeat(m.length)).indexOf(g.after); const end = i >= 0 ? html.indexOf('</p>', i) : -1;
  html = end >= 0 ? html.slice(0, end + 4) + tag + html.slice(end + 4) : tag + html; } return html; };
const kuro = 'data:image/jpeg;base64,' + fs.readFileSync(path.join(root, 'assets', 'kuro_line.jpg')).toString('base64');
const asset = f => 'data:image/jpeg;base64,' + fs.readFileSync(path.join(root, 'assets', f)).toString('base64');
const SCENE = { pores: asset('concept/s4_texture_pores.jpg'), room: asset('scene_room.jpg'), desk: asset('scene_desk.jpg'), paper: asset('paper.jpg'), table: asset('table_dark.jpg') };
const ITEMS = [
  { k: '小鸡', day: 1, img: figData('egg.jpg'), x: 41.5, y: 49.5, r: -4 },
  { k: '课本', day: 2, img: asset('sticker_textbook.jpg'), x: 29.5, y: 54.5, r: -7, nodream: true },
  { k: '寻呼机', day: 4, img: figData('pager.jpg'), x: 35.5, y: 56.5, r: 5 },
  { k: 'IC 卡', day: 7, img: figData('iccard.jpg'), x: 47.5, y: 54.5, r: -6 },
  { k: '磁带', day: 10, img: figData('tape.jpg'), x: 53.5, y: 56, r: 3 },
  { k: '文曲星', day: 13, img: figData('wenquxing.jpg'), x: 32, y: 60, r: 6 },
  { k: '计算器', day: 16, img: figData('calculator.jpg'), x: 44, y: 59.5, r: -3 },
  { k: '手机', day: 18, img: asset('sticker_phone.jpg'), x: 56.5, y: 53, r: 8, nodream: true },
];
const OVER = { 'd10-1': 's3_screen_shift.jpg', 'd13-1': 's4_texture_pores.jpg', 'd13-7': 's4_crack_light.jpg', 'd14-8': 's4_pager_buttons.jpg', 'd16-1': 's5_lock.jpg', 'd16-3d': 's5_door_light.jpg', 'd16-5': 's5_gray_desk.jpg', 'd18-1': 's5_hand_everywhere.jpg', 'END_BAD': 'end_bad.jpg', 'END_SURVIVE': 'end_survive.jpg', 'END_GOOD': 'end_good.jpg' };
const OVERDATA = Object.fromEntries(Object.entries(OVER).map(([k, v]) => [k, figData(v)]));
const EYE = figData('eye.jpg');
const HANDS = { 5: figData('hand_famine.jpg'), 7: figData('hand_complexity.jpg'), 8: figData('hand_oblivion.jpg'), 14: figData('hand_silence.jpg'), 16: figData('hand_poverty.jpg'), 18: figData('hand_kuro.jpg') };
const STAGE = d => d <= 3 ? ['0', '正常'] : d <= 6 ? ['1', '字里行间'] : d <= 9 ? ['2', '它知道你'] : d <= 12 ? ['3', '几何与颜色'] : d <= 15 ? ['4', '梦想态'] : ['5', '最深处'];
// 节号打乱：第一节永远是 1，其余按固定种子洗牌，和真的游戏书一样，跳转不再是相邻号
let items = []; for (const d of days) for (const s of d.sections) items.push({ ...s, day: d.day });
// 合并只有"继续"的碎节：A.next = B，B 没有条件跳转，而且只有 A 一个入口，就把 B 并进 A
{ const map = Object.fromEntries(items.map(it => [it.id, it])); const inbound = {};
  const ref = id => { inbound[id] = (inbound[id] || 0) + 1; };
  for (const it of items) { if (it.next) ref(it.next); for (const c of it.choices || []) ref(c.goto); for (const c of it.conds || []) ref(c.goto); }
  for (const d of days) ref(`d${String(d.day).padStart(2, '0')}-1`); // 每天第一节算有入口
  const dead = new Set();
  for (const it of items) { if (dead.has(it.id)) continue; let guard = 0;
    while (it.next && map[it.next] && !dead.has(it.next) && !FIG[it.next] && !FIG[it.id] && !(map[it.next].conds || []).length && inbound[it.next] === 1 && map[it.next].day === it.day && guard++ < 50) {
      const b = map[it.next]; it.text += b.text; it.choices = b.choices; it.next = b.next; dead.add(b.id); } }
  items = items.filter(it => !dead.has(it.id)); console.log('merged away', dead.size, 'linear sections'); }
for (const e of endings) items.push({ id: e.id, ending: true, title: e.title, text: e.text });
let seed = 20261019; const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
const nums = Array.from({ length: items.length - 1 }, (_, i) => i + 2); for (let i = nums.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [nums[i], nums[j]] = [nums[j], nums[i]]; }
const idx = {}; items.forEach((it, i) => { it.num = i === 0 ? 1 : nums[i - 1]; idx[it.id] = it.num; });
const all = items.slice().sort((a, b) => a.num - b.num); let num = items.length;
const link = (id, label) => idx[id] ? `<a href="#s${idx[id]}" data-goto="${id}">${label}<span class="pn"> → 第 ${idx[id]} 节</span></a>` : `<span class="muted">${label}（缺 ${id}）</span>`;
let body = '';
for (const s of all) {
  body += `<section class="gb" id="s${s.num}" data-id="${s.id}" data-day="${s.day || 18}"${s.conds ? ` data-conds='${JSON.stringify(s.conds).replace(/'/g, '&#39;')}'` : ''}>`;
  const V = t => t.replace(/老大/g, '<span class="v-call">老大</span>').replace(/你的名字/g, '<span class="v-name">你的名字</span>').replace(/他／她/g, '<span class="v-ta">她／他</span>').replace(/你的小名/g, '<span class="v-nick">你的小名</span>').replace(/老板叫你的那个名字/g, '<span class="v-boss">老板叫你的那个名字</span>');
  { const st = STAGE(s.day || 18); const opener = !s.ending && s.id.endsWith('-1');
  body += (opener ? `<div class="opener"><span class="ribbon">第 ${s.day} 天</span><h2 class="chap">${st[1]}</h2><p class="chap-sub">阶段 ${st[0]} · 第 ${s.num} 节</p></div>` : `<h3 class="secnum">${s.num}${s.ending ? ' · ' + s.title : ''}</h3>`) + withFigs(s.id, V(s.text)); }
  if (s.choices) { body += '<ul class="choices">' + s.choices.map(c => `<li data-effects='${JSON.stringify(c.effects || {}).replace(/'/g, '&#39;')}'${c.cond_show ? ` data-cond='${JSON.stringify(c.cond_show).replace(/'/g, '&#39;')}'` : ''}>${link(c.goto, V(c.label))}</li>`).join('') + '</ul>'; }
  else if (s.next) body += `<p class="next">${link(s.next, '继续')}</p>`;
  body += '</section>\n';
}
const html = `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>NOT TODAY · 游戏书</title><link rel="stylesheet" href="style.css">
<style>
.gb{max-width:640px;margin:0 auto;padding:1.2em 0 .6em;border-top:1px dashed var(--rule)}
.gb figure.fig{margin:1.4em auto;text-align:center}.gb figure.fig img{max-width:min(100%,420px);height:auto;border-radius:2px;animation:figin 1.8s ease both}@keyframes figin{from{opacity:0}to{opacity:1}}.gb figure.fig.dark img{filter:contrast(1.05) brightness(.92)}.gb figure.fig.lcd img{max-width:min(70%,260px);image-rendering:pixelated}@media print{.gb figure.fig img{animation:none}}
.gb h3{font-family:"PingFang SC",sans-serif;font-size:12pt;letter-spacing:.2em;margin:0 0 .5em}
.gb p{text-indent:2em;line-height:1.9;margin:0 0 .35em}
.gb p.say{text-indent:0;font-family:Menlo,monospace;font-size:10pt;margin:.3em 0 .3em 2em}
#login{max-width:640px;margin:1em auto;font-family:'PingFang SC',sans-serif;font-size:10.5pt}
body.gated .gb,body.gated #hud{display:none}
.pn{display:none}
@media print{.pn{display:inline}}
body.reading .gb{display:none}
body.reading .gb.cur{display:block;min-height:70vh;border-top:0;padding-top:2.5em}
@media print{body.reading .gb{display:block}}
body:not(.gated) #gate{display:none}
#gate{min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px 16px;box-sizing:border-box}
.gate-in{max-width:520px;width:100%;text-align:center;font-family:"Songti SC","Noto Serif SC","Source Han Serif SC",serif}
.g-kicker{font-size:10pt;letter-spacing:.5em;color:var(--ink2)}
.g-rule{border:0;border-top:1px solid var(--ink);width:120px;margin:14px auto}
.g-title{font-size:19pt;font-weight:400;letter-spacing:.35em;margin:0;border:0;text-align:center}
.g-form{margin:34px 0 6px;font-size:13pt;line-height:2.7}
.g-form p{margin:0;text-indent:0}
.g-form input{font:inherit;color:var(--ink);background:transparent;border:0;border-bottom:1px solid var(--ink);border-radius:0;outline:0;text-align:center;width:6em;padding:0 .2em;margin:0 .3em;-webkit-appearance:none}
.g-form input:focus{border-bottom-width:2px}
.g-opt{display:inline-block;padding:0 .35em;cursor:pointer;border-bottom:1px solid transparent;color:var(--ink2)}
.g-sep{color:var(--ink2)}
.g-opt.sel{color:var(--ink);border-bottom-color:var(--ink)}
#g-kuro{display:block;width:112px;margin:28px auto 0;opacity:0;transform:translateY(10px);transition:opacity 1.8s ease,transform 1.8s ease}
.g-go{opacity:0;transition:opacity 1s ease .9s;margin:12px 0 0;text-indent:0}
.g-go a{font-size:12pt;letter-spacing:.4em;color:var(--ink);text-decoration:none;border-bottom:1px dotted var(--ink);pointer-events:none}
@media (max-width:480px){.g-title{font-size:17pt;letter-spacing:.22em;white-space:nowrap}.g-form{font-size:12.5pt}}
#gate.ready #g-kuro{opacity:1;transform:none}
.g-credit{margin:40px 0 0;font-size:9pt;letter-spacing:.15em;color:var(--ink2);text-indent:0}.g-credit a{color:var(--ink2);border-bottom:1px dotted var(--ink2);text-decoration:none}.g-credit a:hover{color:var(--ink)}
#gate.ready .g-go{opacity:1}
#gate.ready .g-go a{pointer-events:auto}
#login label{display:inline-block;margin:.3em 1.2em .3em 0}
#login input,#login select{font-size:11pt;padding:2px 6px;margin-left:.3em;background:var(--paper2);border:1px solid var(--ink);color:var(--ink)}
.gb p.me{text-indent:0;font-style:italic;margin:.3em 0 .3em 2em;color:var(--ink)}
.gb p.me::before{content:"";font-style:normal;font-size:9pt;color:var(--ink2);letter-spacing:.1em}
.gb .plain{text-shadow:-1px 0 rgba(220,40,40,.75),1px 0 rgba(40,80,220,.75);color:rgba(0,0,0,.55)}
.gb p.last{text-indent:0;text-align:center;font-family:"PingFang SC",sans-serif;font-size:20pt;letter-spacing:.3em;margin-top:2em}
.choices{list-style:none;padding:0;margin:.6em 0 0 2em}
.choices li{margin:.25em 0}
.choices a,.next a{color:var(--accent);text-decoration:none;border-bottom:1px dotted var(--accent)}
.next{text-indent:0!important;margin-left:2em}
#hud{position:fixed;top:10px;right:12px;background:var(--paper2);border:1px solid var(--ink);padding:6px 10px;font-family:Menlo,monospace;font-size:10pt;z-index:9}
#hud b{letter-spacing:.1em}
#hud button{font-size:9pt;margin-left:8px}
body.san3{filter:blur(.35px)}
body.san2{filter:blur(.9px) contrast(.96)}
body.san1{filter:blur(1.6px) contrast(.9) saturate(.8)}
body.san0{filter:blur(2.6px) contrast(.8) saturate(.5)}
#noise{position:fixed;inset:0;pointer-events:none;z-index:8;opacity:0;background-image:radial-gradient(circle,rgba(0,0,0,.6) .6px,transparent .7px);background-size:11px 11px}
body.san2 #noise{opacity:.08}body.san1 #noise{opacity:.2}body.san0 #noise{opacity:.4}
@media print{#hud,#noise{display:none}.gb{page-break-inside:avoid}}
/* ===== 书的版式 ===== */
html{background:#160f0a url(${SCENE.table}) center/cover fixed}
body{background:transparent;margin:0}
#book{display:grid;grid-template-columns:1fr 1fr;width:min(1260px,calc(100vw - 28px));min-height:calc(100vh - 28px);margin:14px auto;position:relative;box-shadow:0 34px 70px rgba(0,0,0,.65),0 0 0 1px rgba(0,0,0,.6);background:#2b1d14}
body.gated #book,body.gated body.noanim *{transition:none!important;animation:none!important}
#scene-toggle{display:none}
.page{position:relative;padding:40px 46px 54px;box-sizing:border-box;background:#e9dcbd url(${SCENE.paper}) center/cover}
#left{box-shadow:inset -46px 0 56px -34px rgba(0,0,0,.45)}
#right{box-shadow:inset 46px 0 56px -34px rgba(0,0,0,.45);max-height:calc(100vh - 28px);overflow:hidden;padding-right:74px}#text{max-height:calc(100vh - 28px - 40px - 54px - 32px);overflow:auto;padding-right:6px}
.page::before{content:"";position:absolute;inset:16px;border:1px solid #8b2f2a;outline:1px solid #8b2f2a;outline-offset:3px;pointer-events:none;opacity:.5}
.runhead{text-align:center;font-family:"PingFang SC",sans-serif;letter-spacing:.45em;font-size:10pt;color:#8b2f2a;margin:0 0 16px;position:relative}
.runhead::before,.runhead::after{content:"";position:absolute;top:50%;width:30%;border-top:1px solid #8b2f2a;opacity:.6}.runhead::before{left:0}.runhead::after{right:0}
.pageno{position:absolute;bottom:20px;left:0;right:0;text-align:center;font-family:Georgia,serif;color:#8b2f2a;font-size:11pt;letter-spacing:.1em}
.opposite{position:absolute;right:2px;top:52%;transform:rotate(90deg);transform-origin:center;white-space:nowrap;font-size:8.5pt;font-style:italic;color:#6b5a48;letter-spacing:.12em}
.opener .ribbon{display:inline-block;background:#9b2d2a;color:#f3e6c8;padding:10px 14px 20px;font-family:"PingFang SC",sans-serif;letter-spacing:.3em;font-size:10pt;clip-path:polygon(0 0,100% 0,100% 100%,50% 82%,0 100%);box-shadow:0 3px 6px rgba(0,0,0,.3)}
.opener .chap{font-family:"Songti SC","Noto Serif SC","Source Han Serif SC",serif;font-weight:700;font-size:30pt;color:#9b2d2a;letter-spacing:.12em;margin:10px 0 2px;line-height:1.15;border:0;text-align:left}
.chap-sub{font-style:italic;color:#6b5a48;font-size:9.5pt;text-indent:0!important;margin:0 0 1.3em}
.secnum{font-family:Georgia,serif;color:#8b2f2a;font-size:11pt;letter-spacing:.15em;margin:0 0 .9em;font-weight:400}
.gb{max-width:none;margin:0;border:0;padding:0}
body.reading .gb.cur{padding-top:0;min-height:0}
.opener + p::first-letter{float:left;font-size:3.1em;line-height:.9;padding:6px 8px 0 0;color:#9b2d2a;font-family:"Songti SC","Noto Serif SC",serif}
#scene{position:relative;width:100%;height:min(66vh,620px);overflow:hidden;border:1px solid rgba(0,0,0,.55);box-shadow:0 10px 26px rgba(0,0,0,.45);background:#000;cursor:grab;touch-action:none;user-select:none}
#scene.drag{cursor:grabbing}
#pan{position:absolute;left:0;top:0;width:1664px;height:928px;transform-origin:0 0;will-change:transform;transition:transform .9s cubic-bezier(.2,.8,.2,1)}
#scene.drag #pan{transition:none}
#pan .base{position:absolute;inset:0;width:100%;height:100%;display:block;transition:filter 1.2s}
#scene.gray #pan .base{filter:grayscale(.85) brightness(.8)}
#scene.s3 #pan .base{filter:saturate(1.15) sepia(.12) hue-rotate(-18deg) contrast(1.05)}
#scene.s4 #pan .base{filter:saturate(1.1) sepia(.18) hue-rotate(-22deg) contrast(1.08) brightness(.95)}
#tex{position:absolute;left:30.5%;top:31%;width:20.5%;height:19%;pointer-events:none;opacity:0;transition:opacity 1.5s;background:url(${'${SCENE.pores}'}) center/cover;mix-blend-mode:multiply}
#scene.s4 #tex,#scene.gray #tex{opacity:.75}
#scene.gray #tex{filter:grayscale(1)}
#scene.night #pan .base{filter:brightness(.55)}
#scene.gray.night #pan .base{filter:grayscale(.85) brightness(.45)}
#gap{position:absolute;left:41.5%;top:33%;height:17%;width:6px;transform:translateX(-50%);background:#04030a;transition:all 1s}
#gap.glow{box-shadow:0 0 18px 4px rgba(255,150,170,.6);animation:breathe 3.2s ease-in-out infinite}
@keyframes breathe{0%,100%{box-shadow:0 0 14px 3px rgba(255,150,170,.45)}50%{box-shadow:0 0 26px 8px rgba(255,150,170,.75)}}
#lamp{position:absolute;inset:0;pointer-events:none;mix-blend-mode:soft-light;transition:background 1.2s}
#rain{position:absolute;left:66%;top:8%;width:25%;height:41%;pointer-events:none;opacity:0;transition:opacity 1.5s;background:repeating-linear-gradient(170deg,transparent 0 9px,rgba(200,215,235,.35) 9px 10px);background-size:100% 140px;animation:rain 1.1s linear infinite;mix-blend-mode:screen}
@keyframes rain{from{background-position:0 0}to{background-position:-12px 140px}}
#over{position:absolute;inset:0;z-index:2;opacity:0;pointer-events:none;transition:opacity 1.4s;background:#000 center/cover no-repeat}#over.on{opacity:1;pointer-events:auto}
#scene.over .nav,#scene.over .dots,#scene.over .zoomtip{display:none}
#scene .back{display:none;position:absolute;left:10px;bottom:10px;z-index:3;font-size:8.5pt;color:#f3e6c8;background:rgba(20,12,8,.55);padding:3px 8px;border:1px solid rgba(243,230,200,.35);letter-spacing:.1em;cursor:pointer;font-family:"PingFang SC",sans-serif}#scene.over .back{display:block}
#eye{position:absolute;left:41.5%;top:36%;width:5%;transform:translateX(-50%);opacity:0;transition:opacity 2.4s;pointer-events:none;-webkit-mask-image:radial-gradient(ellipse at center,#000 35%,transparent 70%);mask-image:radial-gradient(ellipse at center,#000 35%,transparent 70%)}#eye img{width:100%;display:block;filter:brightness(.9)}#eye.on{opacity:.85;animation:eyelook 7s ease-in-out infinite}
@keyframes eyelook{0%,100%{transform:translateX(-50%)}40%{transform:translateX(-46%)}70%{transform:translateX(-54%)}}
#hand{position:absolute;left:41.5%;top:14%;width:22%;transform:translateX(-50%);opacity:0;transition:opacity 1.8s;mix-blend-mode:screen;pointer-events:none;-webkit-mask-image:radial-gradient(ellipse at center,#000 40%,transparent 72%);mask-image:radial-gradient(ellipse at center,#000 40%,transparent 72%)}#hand img{width:100%;display:block;filter:contrast(1.1) brightness(1.05)}#hand.on{opacity:.9;animation:handsway 6s ease-in-out infinite}
@keyframes handsway{0%,100%{transform:translateX(-50%) translateY(0)}50%{transform:translateX(-50%) translateY(10px)}}
.item{position:absolute;width:5.2%;transform:translate(-50%,-50%) rotate(var(--r,0deg));border:2px solid #f6efdc;box-shadow:0 3px 8px rgba(0,0,0,.55);background:#fff;transition:opacity .9s,filter .9s,box-shadow .9s;opacity:0;pointer-events:none}
.item.on{opacity:1}
.item img{width:100%;display:block;aspect-ratio:1;object-fit:cover}
.item.dream{box-shadow:0 0 18px 6px rgba(255,210,120,.85),0 3px 8px rgba(0,0,0,.55)}
.item.returned{filter:grayscale(.75) brightness(.85)}
.item.used::after{content:"";position:absolute;right:-5px;top:-5px;width:8px;height:8px;border-radius:50%;background:#9b2d2a;box-shadow:0 0 0 2px #f6efdc}
.item .tag{position:absolute;left:50%;transform:translateX(-50%);bottom:-1.5em;white-space:nowrap;font-size:7px;color:#f3e6c8;text-shadow:0 1px 3px #000,0 0 6px #000;font-family:"PingFang SC",sans-serif;letter-spacing:.1em}
#scene .nav{position:absolute;top:50%;transform:translateY(-50%);width:34px;height:54px;background:rgba(20,12,8,.55);color:#f3e6c8;border:1px solid rgba(243,230,200,.35);font-size:20px;line-height:52px;text-align:center;cursor:pointer;z-index:3;user-select:none;transition:opacity .4s}
#scene .nav.l{left:8px}#scene .nav.r{right:8px}#scene .nav.off{opacity:.25;pointer-events:none}
#scene .dots{position:absolute;left:0;right:0;bottom:8px;text-align:center;z-index:3}
#scene .dots i{display:inline-block;width:7px;height:7px;border-radius:50%;background:rgba(243,230,200,.4);margin:0 4px;cursor:pointer}#scene .dots i.on{background:#f3e6c8}
#scene .zoomtip{position:absolute;right:10px;bottom:10px;z-index:3;font-size:8.5pt;color:#f3e6c8;background:rgba(20,12,8,.55);padding:3px 8px;border:1px solid rgba(243,230,200,.35);letter-spacing:.1em;cursor:pointer;font-family:"PingFang SC",sans-serif}
#cards{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:14px;font-family:"PingFang SC",sans-serif}
.card{border:1px solid #8b2f2a;background:rgba(255,250,235,.35);padding:7px 10px 8px;cursor:pointer;position:relative;transition:background .3s}
.card:hover{background:rgba(255,250,235,.6)}
.card h4{margin:0;font-size:8.5pt;letter-spacing:.3em;color:#8b2f2a;font-weight:400}
.card .sum{font-size:9.5pt;color:#3b2f24;margin-top:2px;line-height:1.5}
.card .badge{position:absolute;right:8px;top:7px;min-width:16px;height:16px;border-radius:8px;background:#9b2d2a;color:#f3e6c8;font-size:8pt;text-align:center;line-height:16px;padding:0 4px}
.card ul{display:none;list-style:none;margin:6px 0 0;padding:6px 0 0;border-top:1px dotted #8b2f2a;font-size:9.5pt;line-height:1.7;color:#3b2f24}
.card.open{grid-column:1/-1;background:rgba(255,250,235,.7)}.card.open ul{display:block}
.card li.chg{color:#8b2f2a}.card li.dim{color:#8a7a66}
#hint{position:absolute;left:46px;right:46px;bottom:70px;z-index:5;background:rgba(27,18,12,.92);color:#f3e6c8;padding:14px 16px 12px;border:1px solid rgba(243,230,200,.4);font-family:"PingFang SC",sans-serif;font-size:10pt;line-height:1.7;display:none;box-shadow:0 10px 30px rgba(0,0,0,.5)}
#hint.on{display:block;animation:hintin .5s ease}
@keyframes hintin{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
#hint .ico{display:inline-block;width:46px;height:26px;vertical-align:middle;margin-right:10px;position:relative}
#hint .ico::before{content:"";position:absolute;top:8px;left:4px;width:12px;height:12px;border-radius:50%;background:#f3e6c8;animation:hdrag 1.6s ease-in-out infinite}
#hint .ico.tap::before{left:17px;animation:htap 1.2s ease-in-out infinite}
#hint .ico.pinch::before{animation:hpinch 1.6s ease-in-out infinite}
@keyframes hdrag{0%,100%{left:4px}50%{left:30px}}
@keyframes htap{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(.6);opacity:.5}}
@keyframes hpinch{0%,100%{transform:scale(1)}50%{transform:scale(1.8)}}
#hint button{float:right;margin-left:12px;margin-top:2px;background:#9b2d2a;color:#f3e6c8;border:0;padding:4px 12px;font-size:9.5pt;letter-spacing:.2em;cursor:pointer}
#scene-toggle{display:none}
#hud{position:absolute;top:auto;bottom:16px;right:auto;left:46px;background:transparent;border:0;padding:0;color:#8b2f2a;font-size:9pt}#hud button{background:transparent;border:1px solid #8b2f2a;color:#8b2f2a;font-size:8pt;padding:1px 6px;cursor:pointer}
@media(max-width:900px){#scene{height:56vh}#cards{grid-template-columns:1fr 1fr}#hint{left:14px;right:14px}html,body{overflow-x:hidden}#text{max-height:none;overflow:visible;padding-right:0}#book{grid-template-columns:minmax(0,1fr);width:100%;margin:0;min-height:100vh}.page{padding:26px 18px 48px;min-width:0;max-width:100vw}#right{padding-right:18px}.opposite{display:none}#left{display:none}body.scene #left{display:block}body.scene #right{display:none}#scene-toggle{display:block;position:fixed;bottom:12px;left:12px;z-index:9;background:#9b2d2a;color:#f3e6c8;border:0;padding:8px 14px;font-size:10pt;letter-spacing:.2em}#right{max-height:none}#ledger{columns:1}.opener .chap{font-size:24pt}}
@media print{html{background:none}#book{display:block;background:none;box-shadow:none;width:auto;margin:0}#left,#scene-toggle,.runhead,.pageno,.opposite{display:none}.page{background:none;padding:0;max-height:none;overflow:visible;box-shadow:none}.page::before{display:none}}
</style></head><body>
<div id="noise"></div>
<div id="hud">SAN <b id="san">100</b> · 第 <b id="day">1</b> 天 <button id="reset">重来</button> <button id="exp">存档码</button> <button id="imp">读档</button></div>
<section id="gate"><div class="gate-in">
<div class="g-kicker">NOT TODAY</div><hr class="g-rule"><h2 class="g-title">你希望这是谁的故事</h2><hr class="g-rule">
<div class="g-form">
<p>这是<input id="f-name" value="大壮" maxlength="12">的故事。</p>
<p>家里叫<input id="f-nick" value="壮壮" maxlength="12">。</p>
<p>下属叫<input id="f-call" value="老大" maxlength="6">。</p>
<p>老板叫<input id="f-boss" value="大壮" maxlength="12">。</p>
<p>别人说起的时候，说<span class="g-opt" data-v="她">她</span><span class="g-sep">／</span><span class="g-opt" data-v="他">他</span>。</p>
</div>
<img id="g-kuro" src="${kuro}" alt="">
<p class="g-go"><a href="#s1" id="start" data-goto="d01-1">继续</a></p>
<p class="g-credit">作者 胡小白 · 与 Claude 一起写成 · <a href="https://ko-fi.com/cocososo" target="_blank" rel="noopener">请作者喝一杯水</a></p>
</div></section>
<div id="book">
<aside id="left" class="page"><div class="runhead">现 场</div>
<div id="scene"><div id="pan"><img class="base" src="${SCENE.room}" alt="" draggable="false"><div id="lamp"></div><div id="tex"></div><div id="rain"></div><div id="gap"></div><div id="eye"><img src="${EYE}" alt="" draggable="false"></div><div id="hand"><img alt="" draggable="false"></div>${ITEMS.map(it => `<div class="item" data-k="${it.k}" data-day="${it.day}" style="left:${it.x}%;top:${it.y}%;--r:${it.r}deg"><img src="${it.img}" alt="" draggable="false"><span class="tag">${it.k}</span></div>`).join('')}</div>
<div class="nav l">‹</div><div class="nav r">›</div><div class="dots"><i data-v="0"></i><i data-v="1" class="on"></i><i data-v="2"></i></div><div class="zoomtip">凑近桌子</div><div id="over"></div><div class="back">回到屋子</div></div>
<div id="cards"></div><div id="hint"></div>
<div class="pageno" id="pno-l"></div></aside>
<main id="right" class="page"><div class="runhead">NOT TODAY</div><div id="text">${body}</div><div class="pageno" id="pno-r"></div><div class="opposite">对页：你的桌子，此刻</div></main>
</div>
<button id="scene-toggle">现场</button>
<script>
const ITEMS=${JSON.stringify(ITEMS.map(({ k, day, nodream }) => ({ k, day, nodream })))};const HANDS=${JSON.stringify(HANDS)};const OVER=${JSON.stringify(OVERDATA)};
const STAGE=d=>d<=3?['0','正常']:d<=6?['1','字里行间']:d<=9?['2','它知道你']:d<=12?['3','几何与颜色']:d<=15?['4','梦想态']:['5','最深处'];
const FL={lent:'借出：四万四，利息 0',said_bu:'说了"不"',said_deng:'说了"等"',said_zaishuo:'说了"再说一遍"',said_shenme:'说了"什么意思"',said_duoshao:'说了"多少"',said_wojinqu:'说了"我进去"',key9:'对小张：别让它做，看一眼',key11:'问了：你换模型了',key15:'举起寻呼机，输入框保住了',recog_pager:'认出：寻呼机',id_xiaoji:'认出：小鸡',id_ic:'认出：IC 卡',id_tape:'认出：磁带',id_wqx_ok:'认出：文曲星',id_calc_ok:'认出：计算器',beautiful:'说了"漂亮"',door_open:'门开了',delegated:'让它做了，没看',skipped8:'让它做了，没看',let_it_d12:'让它做了，没看',let_it_d12b:'让它做了，没看',d04_let1:'让它做了，没看',d04_let2:'让它做了，没看',tomorrow_kept:'留下了"明天"',unseen17:'没看',unseen17b:'没看',ic_raised:'举起 IC 卡',blocked_d07:'挡住了一次'};
const WORD={'小鸡':'said_bu','寻呼机':'said_deng','IC 卡':'said_wojinqu','磁带':'said_zaishuo','文曲星':'said_shenme','计算器':'said_duoshao'};
let pending=null;
let mem=null;const store={get(){try{return localStorage.getItem('nt_gb')}catch(e){return mem}},set(v){try{localStorage.setItem('nt_gb',v)}catch(e){mem=v}},del(){try{localStorage.removeItem('nt_gb')}catch(e){mem=null}}};
const S=Object.assign({san:100,flags:[],day:1,days:0,name:'大壮',nick:'壮壮',call:'老大',boss:'大壮',ta:'',started:false,dream:{},lost:[],changes:[]},JSON.parse(store.get()||'{}'));
const identity=()=>{document.body.classList.toggle('gated',!S.started);document.querySelectorAll('.v-boss').forEach(e=>e.textContent=S.boss);const b=document.getElementById('f-boss');if(b)b.value=S.boss;document.querySelectorAll('.v-call').forEach(e=>e.textContent=S.call);document.querySelectorAll('.v-name').forEach(e=>e.textContent=S.name);document.querySelectorAll('.v-ta').forEach(e=>e.textContent=S.ta);document.querySelectorAll('.v-nick').forEach(e=>e.textContent=S.nick);const k=document.getElementById('f-nick');if(k)k.value=S.nick;const n=document.getElementById('f-name'),c=document.getElementById('f-call');if(n)n.value=S.name;if(c)c.value=S.call;document.querySelectorAll('.g-opt').forEach(o=>o.classList.toggle('sel',!!S.ta&&o.textContent.trim()===S.ta));};
const save=()=>store.set(JSON.stringify(S));
const hud=()=>{document.getElementById('san').textContent=S.san;document.getElementById('day').textContent=S.day;document.body.classList.remove('san0','san1','san2','san3');const sc=S.san<10?'san0':S.san<30?'san1':S.san<50?'san2':S.san<70?'san3':'';if(sc)document.body.classList.add(sc);identity();};
const VIEWS=[{x:17,y:52},{x:42,y:50},{x:76,y:46}];let view=1,zoomed=false,Z0=1,tx=0,ty=0,IW=1664,IH=928;
const sceneEl=()=>document.getElementById('scene');
function fitZ(){const sc=sceneEl();const w=sc.clientWidth,h=sc.clientHeight;Z0=Math.max(h/IH*1.15,w*3/IW/1.0);return Z0;}
function clampTo(){const sc=sceneEl();const z=zoomed?Z0*2.1:Z0;const w=sc.clientWidth,h=sc.clientHeight;tx=Math.min(0,Math.max(w-IW*z,tx));ty=Math.min(0,Math.max(h-IH*z,ty));return z;}
function apply(){const z=clampTo();document.getElementById('pan').style.transform='translate('+tx+'px,'+ty+'px) scale('+z+')';document.querySelectorAll('#scene .dots i').forEach(i=>i.classList.toggle('on',+i.dataset.v===view));document.querySelector('#scene .nav.l').classList.toggle('off',view===0&&!zoomed);document.querySelector('#scene .nav.r').classList.toggle('off',view===2&&!zoomed);document.querySelector('#scene .zoomtip').textContent=zoomed?'退远':'凑近桌子';}
function goView(v){view=Math.max(0,Math.min(2,v));zoomed=false;fitZ();const sc=sceneEl();const z=Z0;tx=sc.clientWidth/2-VIEWS[view].x/100*IW*z;ty=sc.clientHeight/2-VIEWS[view].y/100*IH*z;apply();}
function zoomDesk(){fitZ();const sc=sceneEl();zoomed=!zoomed;const z=zoomed?Z0*2.1:Z0;view=1;tx=sc.clientWidth/2-43/100*IW*z;ty=sc.clientHeight/2-53/100*IH*z;apply();if(zoomed)hint('zoom','凑近了。拖一拖能看桌面别的角落，再点一次退远。','drag');}
(function(){const sc=sceneEl();if(!sc)return;let drag=null;
 sc.addEventListener('pointerdown',e=>{if(e.target.closest('.nav,.dots,.zoomtip'))return;drag={x:e.clientX,y:e.clientY,tx,ty,moved:false};sc.classList.add('drag');sc.setPointerCapture(e.pointerId);});
 sc.addEventListener('pointermove',e=>{if(!drag)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(Math.abs(dx)+Math.abs(dy)>3)drag.moved=true;tx=drag.tx+dx;ty=drag.ty+dy;apply();});
 const up=e=>{if(!drag)return;const moved=drag.moved;drag=null;sc.classList.remove('drag');if(!moved&&e.target.closest('#pan'))zoomDesk();};
 sc.addEventListener('pointerup',up);sc.addEventListener('pointercancel',up);
 sc.querySelector('.nav.l').onclick=()=>goView(view-1);sc.querySelector('.nav.r').onclick=()=>goView(view+1);
 sc.querySelectorAll('.dots i').forEach(i=>i.onclick=()=>goView(+i.dataset.v));sc.querySelector('.zoomtip').onclick=zoomDesk;sc.querySelector('.back').onclick=()=>{document.getElementById('over').classList.remove('on');sc.classList.remove('over');};
 window.addEventListener('resize',()=>goView(view));
})();
const HINTS={pan:'左页是你的桌子，也是这间屋子。按住拖一拖，能从门看到窗。点桌子能凑近。',cards:'下面四张卡是账本：此刻、桌上、词、这一节。点一张展开，再点收起。',hand:'夜里缝里伸出来的东西，会浮在显示器上方。凑近桌子看得更清楚。',zoom:''};
let hintsSeen={};try{hintsSeen=JSON.parse(localStorage.getItem('nt_hints')||'{}')}catch(e){}
function hint(key,text,ico){if(hintsSeen[key]||!text)return;const h=document.getElementById('hint');h.innerHTML='<span class="ico '+(ico||'')+'"></span>'+text+'<button>知道了</button>';h.classList.add('on');h.querySelector('button').onclick=()=>{h.classList.remove('on');hintsSeen[key]=1;try{localStorage.setItem('nt_hints',JSON.stringify(hintsSeen))}catch(e){}};}
let openCard=null;
function scene(sec){const day=+sec.dataset.day||S.day;const st=STAGE(day);const t=sec.textContent;
 const sc=sceneEl();sc.classList.toggle('gray',day>=16);sc.classList.toggle('s3',day>=10&&day<=12);sc.classList.toggle('s4',day>=13&&day<=15);
 const night=/伸出(来)?一只|一只手从缝里|没有手指的手|手指多得数不清|一只正经的手/.test(t);sc.classList.toggle('night',night||/^.{0,40}(灯灭了|你关了台灯|夜里)/.test(t));
 const gap=document.getElementById('gap');gap.style.width=(day>=4?6+(day-3)*2.4:4)+'px';gap.classList.toggle('glow',day>=11);
 const lamp=document.getElementById('lamp');lamp.style.background=day<=3?'radial-gradient(ellipse at 48% 32%,rgba(255,200,120,.6),transparent 45%)':day<=10?'radial-gradient(ellipse at 48% 32%,rgba(150,185,255,.55),transparent 45%)':day<=15?'radial-gradient(ellipse at 48% 32%,rgba(255,150,175,.65),transparent 50%)':'radial-gradient(ellipse at 48% 32%,rgba(200,200,200,.4),transparent 45%)';
 const rainL=day<=3?3:day<=6?2:day<=12?1:0;document.getElementById('rain').style.opacity=rainL?(.18+rainL*.14):0;
 const hand=document.getElementById('hand');if(night){hand.querySelector('img').src=HANDS[day]||HANDS[8];hand.classList.add('on');setTimeout(()=>hint('hand',HINTS.hand,'pinch'),1200);}else hand.classList.remove('on');document.getElementById('eye').classList.toggle('on',night||/缝里还有一只眼|缝里有一只眼/.test(t));
 const ov=document.getElementById('over');const oid=sec.dataset.id;if(OVER[oid]){ov.style.backgroundImage='url('+OVER[oid]+')';ov.classList.add('on');sc.classList.add('over');}else{ov.classList.remove('on');sc.classList.remove('over');}
 const own=[];document.querySelectorAll('.item').forEach(el=>{const k=el.dataset.k,fd=+el.dataset.day;const have=S.days>=fd||day>=fd;el.classList.toggle('on',have);const ds=S.dream[k];const active=ds!==undefined&&day-ds<3;const ret=ds!==undefined&&!active;el.classList.toggle('dream',active);el.classList.toggle('returned',ret);const used=WORD[k]&&S.flags.includes(WORD[k]);el.classList.toggle('used',!!used);if(have)own.push(k+(active?'（梦想态，第 '+(day-ds+1)+' 天）':ret?'（退回原样）':'')+(used?' · 词用过了':''));});
 const rain=day<=3?'三层，都浅':day<=6?'两层':day<=12?'一层，薄':day<=16?'停了':'窗外是白的';const lampc=day<=3?'暖黄':day<=10?'偏冷':day<=15?'偏粉':'灰';
 const wage=31+day-1;const lent=S.flags.includes('lent')?(day>=12?'借出四万四，已还':'借出四万四，未还'):S.flags.includes('said_bu')?'没借。说了不':'';
 const said=Object.entries(WORD).filter(([k,f])=>S.flags.includes(f)).map(([k])=>k);
 const li=(a,c)=>a.length?a.map(x=>'<li'+(c?' class="'+c+'"':'')+'>'+x+'</li>').join(''):'<li class="dim">—</li>';
 const cards=[
  ['now','此刻','第 '+day+' 天 · '+st[1]+' · SAN '+S.san,['第 '+day+' 天 · 阶段 '+st[0]+' · '+st[1],'雨：'+rain,'台灯：'+lampc].concat(day>=4?['缝：宽了 '+(day-3)+' 指']:[]).concat(['拖欠：'+wage+' 天 · 十三个月']).concat(lent?[lent]:[]).concat(['SAN '+S.san]),''],
  ['own','桌上',own.length?own.length+' 件':'还没有',own,''],
  ['word','词',said.length?said.join('、'):'一个都没用',said.map(x=>x+'：用过'),''],
  ['chg','这一节',(S.changes||[]).length?S.changes[0]+((S.changes.length>1)?' …':''):'没有变化',(S.changes||[]),'chg']];
 const box=document.getElementById('cards');box.innerHTML=cards.map(c=>'<div class="card'+(openCard===c[0]?' open':'')+'" data-k="'+c[0]+'"><h4>'+c[1]+'</h4>'+(c[0]==='chg'&&(S.changes||[]).length?'<span class="badge">'+S.changes.length+'</span>':'')+'<div class="sum">'+c[2]+'</div><ul>'+li(c[3],c[4])+'</ul></div>').join('');
 box.querySelectorAll('.card').forEach(el=>el.onclick=()=>{openCard=openCard===el.dataset.k?null:el.dataset.k;box.querySelectorAll('.card').forEach(x=>x.classList.toggle('open',x.dataset.k===openCard));});
 if((S.changes||[]).length)setTimeout(()=>hint('cards',HINTS.cards,'tap'),600);
 document.getElementById('pno-r').textContent=(sec.id||'').replace('s','');document.getElementById('pno-l').textContent='第 '+day+' 天';
 if(!scene.init){scene.init=true;goView(1);hint('pan',HINTS.pan,'');}}
function show(sec){document.querySelectorAll('.gb.cur').forEach(x=>x.classList.remove('cur'));sec.classList.add('cur');try{scene(sec);}catch(e){console.warn(e)}sec.querySelectorAll('li[data-cond]').forEach(li=>{const c=JSON.parse(li.dataset.cond);const ok=(!c.has||S.flags.includes(c.has))&&(!c.not||!S.flags.includes(c.not));li.style.display=ok?'':'none';});document.body.classList.add('reading');S.cur=sec.dataset.id;window.scrollTo(0,0);}
const PERF={need:['id_xiaoji','recog_pager','id_calc_ok','id_wqx_ok','id_tape','id_ic','key9','key11','key15'],none:['d04_let1','d04_let2','delegated','skipped8','let_it_d12','let_it_d12b','tomorrow_kept','unseen17','unseen17b']};
function enter(id){const sec=document.querySelector('[data-id="'+id+'"]');if(!sec)return;show(sec);if(id==='d18-8'&&!S.flags.includes('perfect')&&PERF.need.every(f=>S.flags.includes(f))&&!PERF.none.some(f=>S.flags.includes(f)))S.flags.push('perfect');const m=id.match(/^d(\\d\\d)-1$/);if(m){S.day=+m[1];S.days=Math.max(S.days,S.day);}
 const conds=sec.dataset.conds?JSON.parse(sec.dataset.conds):[];for(const c of conds){if((c.san_lt!==undefined&&S.san<c.san_lt)||(c.has&&S.flags.includes(c.has))||(c.not&&!S.flags.includes(c.not))){const t=document.querySelector('[data-id="'+c.goto+'"]');if(t){location.hash='#'+t.id;enter(c.goto);return;}}}
 if(pending){const ch=[];if(S.day!==pending.day)ch.push('第 '+S.day+' 天');ITEMS.forEach(it=>{if(pending.days<it.day&&S.days>=it.day)ch.push('找到：'+it.k)});S.flags.filter(f=>!pending.flags.includes(f)).forEach(f=>{if(FL[f])ch.push(FL[f])});if(S.san!==pending.san)ch.push('SAN '+(S.san>pending.san?'+':'')+(S.san-pending.san));pending.dream.forEach(x=>ch.push('举起：'+x+'，进入梦想态'));pending.lost.forEach(x=>ch.push('递出去：'+x+'（它不要已经拿过的）'));S.changes=ch;pending=null;try{scene(sec);}catch(e){}}
 if(id==='END_BAD'){const d=document.querySelector('[data-days]');if(d)d.textContent=S.days;} save();hud();}
document.addEventListener('click',e=>{const a=e.target.closest('a[data-goto]');if(!a)return;if(a.id==='start'){S.name=(document.getElementById('f-name').value.trim()||'大壮').slice(0,12);S.nick=(document.getElementById('f-nick').value.trim()||S.name).slice(0,12);S.call=document.getElementById('f-call').value;S.ta=(document.querySelector('.g-opt.sel')||{dataset:{v:''}}).dataset.v;if(!S.ta)return;S.boss=(document.getElementById('f-boss').value.trim()||S.name).slice(0,12);S.started=true;S.cur='d01-1';save();}const li=a.closest('li');const ef=li&&li.dataset.effects?JSON.parse(li.dataset.effects):{};pending={san:S.san,flags:S.flags.slice(),day:S.day,days:S.days,dream:[],lost:[]};if(ef.item_dream){S.dream[ef.item_dream]=S.day;pending.dream.push(ef.item_dream);}if(ef.item_lost){S.lost.push(ef.item_lost);pending.lost.push(ef.item_lost);}
 if(ef.san)S.san=Math.max(0,Math.min(100,S.san+ef.san));(ef.set||[]).forEach(f=>{if(!S.flags.includes(f))S.flags.push(f)});(ef.unset||[]).forEach(f=>{S.flags=S.flags.filter(x=>x!==f)});
 setTimeout(()=>enter(a.dataset.goto),0);});
const gateCheck=()=>{const ok=['f-name','f-nick','f-call','f-boss'].every(i=>document.getElementById(i).value.trim())&&!!document.querySelector('.g-opt.sel');document.getElementById('gate').classList.toggle('ready',ok);};
['f-name','f-nick','f-call','f-boss'].forEach(i=>document.getElementById(i).addEventListener('input',gateCheck));
document.querySelectorAll('.g-opt').forEach(o=>o.onclick=()=>{document.querySelectorAll('.g-opt').forEach(x=>x.classList.remove('sel'));o.classList.add('sel');gateCheck();});
setTimeout(gateCheck,1400);
(()=>{const kimg=document.getElementById('g-kuro');const im=new Image();im.onload=()=>{try{const c=document.createElement('canvas');c.width=im.width;c.height=im.height;const x=c.getContext('2d');x.drawImage(im,0,0);const d=x.getImageData(0,0,c.width,c.height);const a=d.data;for(let i=0;i<a.length;i+=4){const l=(a[i]+a[i+1]+a[i+2])/3;a[i+3]=Math.max(0,Math.min(255,(255-l)*1.15));a[i]=42;a[i+1]=42;a[i+2]=40;}x.putImageData(d,0,0);kimg.src=c.toDataURL();}catch(e){}};im.src=kimg.src;})();
document.getElementById('reset').onclick=()=>{store.del();location.hash='';location.reload();};
document.getElementById('exp').onclick=()=>{const code=btoa(unescape(encodeURIComponent(JSON.stringify(S))));prompt('这是你的存档码。复制保存，换设备或清了浏览器以后用“读档”贴回来：',code);};
document.getElementById('imp').onclick=()=>{const code=prompt('把存档码贴在这里：');if(!code)return;try{const o=JSON.parse(decodeURIComponent(escape(atob(code.trim()))));if(!o||typeof o.san!=='number')throw 0;store.set(JSON.stringify(o));location.hash='';location.reload();}catch(e){alert('存档码不对。');}};
hud();
document.getElementById('scene-toggle').onclick=()=>document.body.classList.toggle('scene');document.getElementById('left').appendChild(document.getElementById('hud'));
{const q=new URLSearchParams(location.search).get('at');if(q&&document.querySelector('[data-id="'+q+'"]')){S.started=true;const m=q.match(/^d(\\d\\d)/);if(m){S.day=+m[1];S.days=Math.max(S.days,S.day);}S.cur=q;save();identity();hud();}}
if(S.started){const c=document.querySelector('[data-id="'+(S.cur||'d01-1')+'"]');if(c){show(c);save();}}
if(new URLSearchParams(location.search).get('zoom')){try{zoomDesk();document.getElementById('hint').classList.remove('on');}catch(e){}}
if(new URLSearchParams(location.search).get('shot')){document.body.classList.add('noanim');document.getElementById('hint').classList.remove('on');try{goView(zoomed?1:view);}catch(e){}}
if(new URLSearchParams(location.search).get('nohint')){document.getElementById('hint').classList.remove('on');}
</script>
</body></html>`;
fs.writeFileSync(path.join(root, 'gamebook.html'), html);
console.log('gamebook assembled', num, 'sections,', days.length, 'days');
