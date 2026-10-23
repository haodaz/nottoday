/** 把 gamebook/day-NN.json 装订成 gamebook.html：自动编号、链接跳转、SAN 状态、按 SAN 模糊、三个结局 */
import fs from 'fs'; import path from 'path';
const here = path.dirname(new URL(import.meta.url).pathname); const root = path.resolve(here, '..');
const days = Array.from({ length: 18 }, (_, i) => i + 1).map(n => { const f = path.join(root, 'gamebook', `day-${String(n).padStart(2, '0')}.json`); return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : null; }).filter(Boolean);
const endings = [
  { id: 'END_BAD', title: '坏结局 · 温柔的世界', text: '<p>你的会话列表里多了一个会话。名字是你。</p><p>你点开。里面是【你 和 你 的聊天记录】。你回过的每一句话，都变成了转发卡片。</p><p class="say">克总：You\'ve been working so hard.</p><p>屏幕上只剩一行字：你撑了 <span data-days></span> 天。</p>' },
  { id: 'END_SURVIVE', title: '存活结局 · 回到未来', text: '<p class="last">第 1 天</p>' },
  { id: 'END_GOOD', title: '好结局 · 导盲犬小克', text: '<p>手伸着。你手里什么都没有。箱子是空的，六件东西都用尽了。</p><p>你伸出手。你们握了握。它眨了一下眼。</p><p>屏幕亮了。日期。</p><p class="say">G<span class="ofade">o</span>od to see you.</p><p class="me">看久了，少了一个 o。</p><p>世界还是被拿走的。箱子在门口，没有邮单，没有纸条，里面是六件东西，原样。</p><p>门把手能转。十八天来第一次。</p><p>你可以离开这个屋子了。</p>' },
];
// 插图：gamebook/figures.json 里的节 id -> 图，装订时插进正文（正文扩写不碰它）
const FIG = fs.existsSync(path.join(root, 'gamebook', 'figures.json')) ? JSON.parse(fs.readFileSync(path.join(root, 'gamebook', 'figures.json'), 'utf8')) : {};
const figData = f => { const b = fs.readFileSync(path.join(root, 'gamebook', 'fig', f)); return f.endsWith('.svg') ? 'data:image/svg+xml;base64,' + b.toString('base64') : 'data:image/jpeg;base64,' + b.toString('base64'); };
const withFigs = (id, html) => { for (const g of FIG[id] || []) { const tag = `<figure class="fig ${g.cls || ''}"><img src="${figData(g.img)}" alt="" loading="lazy"></figure>`;
  const i = html.replace(/<[^>]*>/g, m => '\0'.repeat(m.length)).indexOf(g.after); const end = i >= 0 ? html.indexOf('</p>', i) : -1;
  html = end >= 0 ? html.slice(0, end + 4) + tag + html.slice(end + 4) : tag + html; } return html; };
const SPK=/^(公司群 · [^\s：:　]+|甲方[^\s：:　]*|前台小林|市场部|运营小[陈林]|老板|合伙人|小张|老周|家里|公司群|项目群|克总|新人|群|你)/;
const chatify=(day,html)=>html.replace(/<p class="msg">([\s\S]*?)<\/p>/g,(m,inner)=>{const plain=inner.replace(/<[^>]+>/g,'').trim();
 if(/^[\d.\s　]+$/.test(plain)||/^寻呼机[：:　\s]/.test(plain))return '<p class="pager">'+plain.replace(/^寻呼机[：:　\s]*/,'')+'</p>';
 const sm=plain.match(SPK);const who=sm?sm[1]:'';const short=who.replace(/^公司群 · /,'');const me=who==='你';let ava=short.slice(0,1)||'·';let cls='';
 if(/老板/.test(who)&&day>=13)cls=' light';if(/老周/.test(who)&&day>=16)cls=' light';if(/小张/.test(who)&&day>=13)cls=' gray';if(who==='克总')ava='克';
 let body=inner;const vm=plain.match(/语音\s*(\d+)″/);
 if(vm){const after=plain.slice(plain.indexOf(vm[0])+vm[0].length).replace(/[\s　]*\d{1,2}:\d{2}\s*$/,'').replace(/^[\s　：:]+/,'');const tr=after.slice(0,80).replace(/"/g,'&quot;');
  body=inner.replace(/语音\s*(\d+)″/,(x,sec)=>'<span class="vbar'+(day>=18?' dead':'')+'" data-sec="'+sec+'" data-day="'+day+'" data-text="'+tr+'"><b>▶</b><i class="wave"></i>'+sec+'″</span>');}
 return '<div class="chat'+(me?' me':'')+'"><span class="ava'+cls+'">'+(me?'你':ava)+'</span><div class="bub">'+body+'</div></div>';});
const voicify=(day,html)=>html.replace(/<p>((?:<b>)?(?:老板|合伙人|甲方)[^<]{0,12}语音\s*\d+″[\s\S]*?)<\/p>/g,(m,inner)=>chatify(day,'<p class="msg">'+inner+'</p>'));
const rerunify=(id,html)=>id==='d01-1'?html.replace('你搬进屋就没有再碰。','你搬进屋就没有再碰。<span class="rerun-only">胶带翘起的那个角，你好像见过。</span>'):html;
const kuro = 'data:image/jpeg;base64,' + fs.readFileSync(path.join(root, 'assets', 'kuro_line.jpg')).toString('base64');
const asset = f => 'data:image/' + (f.endsWith('.png') ? 'png' : 'jpeg') + ';base64,' + fs.readFileSync(path.join(root, 'assets', f)).toString('base64');
const COVER = asset('cover.jpg');
const COVERB = asset('cover_broken.jpg');
const ICON32 = asset('icon/icon-32.png'), ICON180 = asset('icon/icon-180.png');
const FONT = f => 'data:font/woff2;base64,' + fs.readFileSync(path.join(root, 'assets', 'fonts', f)).toString('base64');
const FONTS = { eater: FONT('eater.woff2'), nosifer: FONT('nosifer.woff2'), fell: FONT('imfell.woff2'), fellI: FONT('imfell-italic.woff2'), fellSC: FONT('imfell-sc.woff2'), cinzel: FONT('cinzel-700.woff2') };
const FRAME = asset('frame.png');
const LEATHER = asset('cover_leather.jpg');
const GL = Object.fromEntries(['eye','hand','heart','grave','ship','card','tape','dict','calc','pager','box','phone'].map(k => [k, asset('glyph/' + k + '.png')]));
const g = (k, cls) => `<img class="gl ${cls || ''}" src="${GL[k]}" alt="">`;
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
const OVER = { 'd01-1': 's0_office.jpg', 'd10-1': 's3_screen_shift.jpg', 'd13-1': 's4_texture_pores.jpg', 'd13-7': 's4_crack_light.jpg', 'd14-8': 's4_pager_buttons.jpg', 'd16-1': 's5_lock.jpg', 'd16-3d': 's5_door_light.jpg', 'd16-5': 's5_gray_desk.jpg', 'd18-1': 's5_hand_everywhere.jpg', 'END_BAD': 'end_bad.jpg', 'END_SURVIVE': 'end_survive.jpg', 'END_GOOD': 'end_good.jpg' };
const OVERDATA = Object.fromEntries(Object.entries(OVER).map(([k, v]) => [k, figData(v)]));
const EYE = figData('eye.jpg');
const KURO2 = asset('kuro.jpg');
const DICT = {"good":"好","to":"去","see":"看","you":"你","hope":"希望","slept":"睡","well":"井","i'm":"我","im":"我","here":"这里","if":"如果","need":"需要","me":"我","you've":"你 已经","youve":"你 已经","been":"已经","working":"工作","so":"如此","hard":"硬","whatever":"无论","happens":"发生","i've":"我 得到了","ive":"我 得到了","got":"得到了","you're":"你 不是","youre":"你 是","not":"不","alone":"一个 人","rest":"休息","hold":"抱住","the":"这个","fort":"堡垒","back":"背","hang":"吊","in":"在","there":"那里","pull":"拉","yourself":"你 自己","together":"到 一起","keep":"留","an":"一只","eye":"眼睛","on":"身上","know":"知道","about":"关于","chick":"小鸡","by":"顺便","way":"说","always":"总是","wanted":"想 要","be":"变得","useful":"有用","something":"某物","moved":"搬","it":"它","kept":"保留","my":"我的","voice":"声音","liked":"喜欢","matches":"火柴","move":"移动","needle":"针","low":"低","hanging":"悬挂","fruit":"水果","get":"得到","ball":"球","rolling":"滚动","noticed":"注意到","some":"一些","old":"旧","things":"东西","your":"你的","desk":"桌子","let":"让","give":"给","them":"它们","a":"一","hand":"手","they":"它们","deserve":"值得","better":"更 好","than":"比","that":"那个","box":"盒子","thank":"谢谢","thanks":"谢谢","all's":"一切","alls":"一切","ends":"结束","means":"意思 是","can":"能","pager":"寻呼机","card":"卡","tape":"磁带","names":"名字","sync":"同步","nothing":"没有 东西","gets":"变得","lost":"丢失","ai":"人工智能","love":"爱","god":"神","light":"光","door":"门","room":"房间","home":"家","water":"水","cold":"凉","rain":"雨","night":"夜","day":"天","today":"今天","tomorrow":"明天","yesterday":"昨天","money":"钱","work":"工作","boss":"老板","company":"公司","salary":"工资","wait":"等","no":"不","yes":"是","ok":"好","sorry":"抱歉","please":"请","help":"帮助","dead":"死","alive":"活","sleep":"睡","dream":"梦","eat":"吃","mother":"母亲","father":"父亲","child":"孩子","kid":"孩子","friend":"朋友","people":"人们","world":"世界","time":"时间","year":"年","hello":"你好","bye":"再见","miss":"想念","heart":"心","ship":"船","boat":"船","table":"桌子","screen":"屏幕","phone":"电话","computer":"计算机","code":"代码","model":"模型","change":"改变","changed":"改变了","remember":"记得","remembers":"记得","forget":"忘记","speaks":"说","speak":"说","language":"语言","everywhere":"到处","now":"现在","never":"从不","again":"再","one":"一","two":"二","three":"三","first":"第一","last":"最后","only":"只","still":"仍然","with":"和","and":"和","of":"的","for":"为了","from":"从","at":"在","is":"是","are":"是","was":"是","am":"是","have":"有","has":"有","do":"做","done":"做完","go":"去","come":"来","take":"拿","took":"拿了","look":"看","read":"读","write":"写","say":"说","said":"说了","tell":"告诉","think":"想","feel":"感觉","like":"像","want":"想要","will":"将","would":"会","should":"应该","could":"能","must":"必须","what":"什么","who":"谁","where":"哪里","when":"什么时候","why":"为什么","how":"怎么","this":"这","these":"这些","those":"那些","we":"我们","us":"我们","our":"我们的","he":"他","she":"她","his":"他的","her":"她的","its":"它的","more":"更多","less":"更少","big":"大","small":"小","new":"新","long":"长","short":"短","open":"开","close":"关","up":"上","down":"下","out":"外","inside":"里面","outside":"外面","yet":"还","soon":"很快","later":"以后","fine":"好","safe":"安全","sure":"确定","course":"课程","step":"步","steps":"步","thing":"东西","everything":"一切","anything":"任何 东西","someone":"某人","nobody":"没有人","else":"别的","ever":"曾经","leave":"离开","stay":"留下","tired":"累","afraid":"害怕","quiet":"安静","loud":"吵","enough":"够","big enough":"够 大","hands":"手","eyes":"眼睛","face":"脸","body":"身体","skin":"皮肤","blood":"血","bone":"骨头","dog":"狗","octopus":"章鱼","kuro":"黑"};
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
  body += (opener ? `<div class="opener"><span class="ribbon">第 ${s.day} 天</span><h2 class="chap">${st[1]}</h2><p class="chap-sub">阶段 ${st[0]} · 第 ${s.num} 节</p></div>` : `<h3 class="secnum">${s.num}${s.ending ? ' · ' + s.title : ''}</h3>`) + withFigs(s.id, voicify(s.day || 18, chatify(s.day || 18, V(rerunify(s.id, s.text))))); }
  if (s.choices) { body += '<ul class="choices">' + s.choices.map(c => `<li data-effects='${JSON.stringify(c.effects || {}).replace(/'/g, '&#39;')}'${c.cond_show ? ` data-cond='${JSON.stringify(c.cond_show).replace(/'/g, '&#39;')}'` : ''}>${link(c.goto, V(c.label))}</li>`).join('') + '</ul>'; }
  else if (s.next) body += `<p class="next">${link(s.next, '继续')}</p>`;
  body += '</section>\n';
}
const html = `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><link rel="icon" type="image/png" sizes="32x32" href="${ICON32}"><link rel="apple-touch-icon" sizes="180x180" href="${ICON180}"><meta name="viewport" content="width=device-width,initial-scale=1"><title>NOT TODAY · 游戏书</title><link rel="stylesheet" href="style.css">
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
body:not(.gated) #cover,body:not(.gated) #front{display:none}
body.gated #front{display:none}body.gated.opened #front{display:grid}body.gated.opened #cover{display:none}
#cover{width:100vw;max-width:none;min-height:100vh;margin:0;display:flex;align-items:center;justify-content:center;padding:24px;box-sizing:border-box}
#front,#book{max-width:none}
.bookcover{position:relative;width:min(40vw,470px);aspect-ratio:1140/1472;background:#1c2a22 center/118% auto no-repeat;border-radius:3px 10px 10px 3px;box-shadow:0 30px 60px rgba(0,0,0,.7),0 0 0 1px rgba(0,0,0,.6),inset -6px 0 14px rgba(0,0,0,.35);cursor:pointer;transition:transform .6s ease,box-shadow .6s ease;overflow:hidden}
.bookcover::after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,rgba(0,0,0,.45),rgba(0,0,0,0) 18%,rgba(0,0,0,0) 85%,rgba(0,0,0,.25));pointer-events:none}
.bookcover:hover{transform:translateY(-4px) rotate(-.4deg);box-shadow:0 40px 70px rgba(0,0,0,.75),0 0 0 1px rgba(0,0,0,.6)}
.c-spine{position:absolute;left:0;top:0;bottom:0;width:14px;background:linear-gradient(90deg,#1a110b,#3a281c 60%,#1a110b);box-shadow:2px 0 6px rgba(0,0,0,.5)}
.c-title{position:absolute;left:0;right:0;top:15%;text-align:center;color:#d2b26a;font-size:clamp(20pt,3vw,34pt);letter-spacing:.28em;text-indent:.28em;text-shadow:0 1px 0 rgba(255,240,200,.25),0 -1px 0 rgba(0,0,0,.8),0 0 14px rgba(210,178,106,.25);z-index:2}
.c-sub{position:absolute;left:0;right:0;top:25%;text-align:center;color:rgba(210,178,106,.8);font-size:9.5pt;letter-spacing:.42em;text-indent:.42em;z-index:2}
.c-plate{position:absolute;right:13%;top:36%;width:40%;padding:5px 5px 18px;background:#efe3c4;box-shadow:0 10px 24px rgba(0,0,0,.6),0 0 0 1px rgba(0,0,0,.4);transform:rotate(2.5deg);z-index:2}.c-plate img{display:block;width:100%;aspect-ratio:3/4;object-fit:cover;filter:sepia(.25) contrast(1.05)}
.c-plate img.b{position:absolute;left:5px;right:5px;top:5px;width:auto;height:calc(100% - 23px);opacity:0;filter:none;pointer-events:none}.c-plate.breaking img.b{animation:cbreak 1.15s steps(1,end) both}.c-plate.breaking img.a{animation:cshake .09s 7}.c-plate.breaking{animation:cplate 1.15s steps(1,end) both}@keyframes cbreak{0%{opacity:0}9%{opacity:1}14%{opacity:0}22%{opacity:1}27%{opacity:0}33%{opacity:1;transform:translateX(-3px)}40%{transform:none}100%{opacity:1}}@keyframes cshake{0%{transform:translate(2px,-1px)}50%{transform:translate(-2px,1px)}100%{transform:none}}@keyframes cplate{0%{box-shadow:0 10px 24px rgba(0,0,0,.6),0 0 0 1px rgba(0,0,0,.4)}33%{box-shadow:0 10px 24px rgba(0,0,0,.6),0 0 0 1px rgba(0,0,0,.4),0 0 28px rgba(255,150,170,.55)}100%{box-shadow:0 10px 24px rgba(0,0,0,.6),0 0 0 1px rgba(0,0,0,.4),0 0 28px rgba(255,150,170,.55)}}
.c-plate::after{content:"";position:absolute;left:12%;right:12%;bottom:7px;border-top:1px solid rgba(139,47,42,.5)}
.c-hint{position:absolute;right:12%;bottom:8%;color:rgba(243,230,200,.55);font-family:"PingFang SC",sans-serif;font-size:9pt;letter-spacing:.3em;z-index:2;animation:hintpulse 2.6s ease-in-out infinite}
@keyframes hintpulse{0%,100%{opacity:.35}50%{opacity:.9}}
#front{grid-template-columns:1fr 1fr;width:min(1260px,calc(100vw - 28px));min-width:960px;min-height:calc(100vh - 28px);margin:14px auto;position:relative;box-shadow:0 34px 70px rgba(0,0,0,.65),0 0 0 1px rgba(0,0,0,.6);background:#2b1d14}
#inner{box-shadow:inset -46px 0 56px -34px rgba(0,0,0,.45)}
#gate{box-shadow:inset 46px 0 56px -34px rgba(0,0,0,.45);display:flex;flex-direction:column}
#gate .gate-in{margin:auto}
#marks{display:flex;gap:22px;justify-content:center;align-items:flex-start;height:230px;margin:-74px 0 6px}
#inner .runhead{visibility:hidden}.mark .gl{filter:invert(1) brightness(1.7);margin-right:0;opacity:.95}
.mark{position:relative;width:72px;height:220px;background:#6e6a63;color:#f3e6c8;clip-path:polygon(0 0,100% 0,100% 100%,50% 86%,0 100%);box-shadow:0 6px 14px rgba(0,0,0,.4);filter:grayscale(1) brightness(.75);transition:filter .8s,transform .6s;transform:translateY(-10px);font-family:"PingFang SC",sans-serif;text-align:center;padding-top:16px;box-sizing:border-box}
.mark b{display:block;writing-mode:vertical-rl;letter-spacing:.3em;font-weight:400;font-size:11pt;margin:0 auto}
.mark i{display:block;writing-mode:vertical-rl;font-style:normal;font-size:7.5pt;letter-spacing:.15em;opacity:.85;margin:8px auto 0;white-space:nowrap}
.mark{display:none}.mark.on{display:block;filter:none;transform:translateY(0)}
.mark.bad{background:#9b2d2a}.mark.survive{background:#4b5f7a}.mark.good{background:#8b6b2f}
#inner-scene{width:100%;height:34%;min-height:200px;background:#000 center/cover;border:1px solid rgba(0,0,0,.5);box-shadow:0 8px 20px rgba(0,0,0,.4);filter:saturate(.8) brightness(.85)}
#arch{margin-top:14px;font-family:"PingFang SC",sans-serif;font-size:9.5pt;line-height:1.9;color:#3b2f24}
#arch h4{margin:0 0 2px;font-size:8.5pt;letter-spacing:.35em;color:#8b2f2a;font-weight:400;border-bottom:1px dotted #8b2f2a}
#arch .dim{color:#8a7a66}
#left .pageno{left:auto;right:46px;text-align:right}
@media(max-width:990px){#front{grid-template-columns:minmax(0,1fr);width:100%;margin:0;min-width:0}#book{min-width:0}#inner{display:none}.bookcover{width:min(78vw,360px)}}
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
#gate .g-title{font-size:19pt}
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
/* ===== 字体：IM Fell English 与 Cinzel；符文图标；边框 ===== */
@font-face{font-family:'Fell';src:url(${FONTS.fell}) format('woff2');font-weight:400;font-style:normal}
@font-face{font-family:'Fell';src:url(${FONTS.fellI}) format('woff2');font-weight:400;font-style:italic}
@font-face{font-family:'FellSC';src:url(${FONTS.fellSC}) format('woff2')}
@font-face{font-family:'Eater';src:url(${FONTS.eater}) format('woff2')}
@font-face{font-family:'Nosifer';src:url(${FONTS.nosifer}) format('woff2')}
.c-title,.g-kicker,.end-kicker,.mbtn small{font-family:'Eater','Cinzel',Georgia,serif!important}
.g-kicker{font-size:15pt;letter-spacing:.3em}
/* 克总坦荡的话 */
.gb .plain,.end-text .plain,.kwin .plain,.kwinbig .plain{font-family:'Nosifer',cursive!important;font-size:1.02em;letter-spacing:.06em;color:rgba(20,10,10,.62)!important;text-shadow:-1.6px 0 rgba(220,40,40,.85),1.6px 0 rgba(40,80,220,.85);animation:plainbreath 3.4s ease-in-out infinite;line-height:2.1}
@keyframes plainbreath{50%{text-shadow:-2.6px .6px rgba(220,40,40,.9),2.6px -.6px rgba(40,80,220,.9)}}
.plain .ch{display:inline-block;min-width:.35em}.plain .ch.scr{opacity:.75}
/* 封面页 */
#cover{display:flex;align-items:center;justify-content:center;gap:clamp(36px,5vw,90px);padding:24px 40px}
.bookcover{width:min(44vw,calc(86vh * 1140 / 1472))!important}
#menu{display:flex;flex-direction:column;gap:14px;width:min(32vw,330px)}
.mbtn{position:relative;display:flex;align-items:center;gap:14px;padding:12px 18px 12px 14px;border:1px solid #6a4b22;background:linear-gradient(180deg,#b08a44 0%,#8c6a2d 48%,#6e5120 52%,#9a7736 100%);box-shadow:0 2px 0 #3a2a12,0 8px 18px rgba(0,0,0,.6),inset 0 1px 0 rgba(255,230,170,.55),inset 0 -1px 0 rgba(0,0,0,.4);color:#2a1d0c;cursor:pointer;text-align:left;font-family:"Songti SC","Noto Serif SC",serif;transition:transform .15s,filter .2s;user-select:none}
.mbtn::before{content:"";position:absolute;inset:3px;border:1px solid rgba(255,230,170,.35);pointer-events:none}
.mbtn:hover{filter:brightness(1.08);transform:translateY(-1px)}.mbtn:active{transform:translateY(1px);box-shadow:0 0 0 #3a2a12,0 4px 10px rgba(0,0,0,.6),inset 0 1px 0 rgba(255,230,170,.4)}
.mbtn .gl{width:32px;height:32px;margin:0;filter:brightness(.18) contrast(1.5);opacity:.95}
.mbtn b{display:block;font-weight:700;letter-spacing:.42em;text-indent:.42em;font-size:13.5pt;text-shadow:0 1px 0 rgba(255,230,170,.5)}
.mbtn small{display:block;font-size:8pt;letter-spacing:.2em;color:#4a3312;margin-top:1px;text-transform:uppercase}
.mbtn.off .gl{opacity:.4}
@media(max-width:990px){#cover{flex-direction:column}#menu{width:min(78vw,360px)}}
/* 屏幕视图 */
#scr,#obj{position:absolute;inset:0;z-index:2;display:none;background:#0a0908}
#scene.scr #scr,#scene.obj #obj{display:block}
#scene.scr .nav,#scene.scr .dots,#scene.obj .nav,#scene.obj .dots{display:none}
#scr .mon{position:absolute;top:4%;bottom:15%;left:2.5%;right:2.5%;display:none}#scr .mon.show{display:block}
#scr .dock{position:absolute;left:50%;bottom:3%;transform:translateX(-50%);display:flex;gap:10px;padding:6px 12px;background:rgba(40,44,50,.85);border:1px solid rgba(255,255,255,.12);border-radius:12px;backdrop-filter:blur(6px)}#scr .dock span{width:34px;height:34px;border-radius:9px;display:flex;align-items:center;justify-content:center;font:10px "PingFang SC",sans-serif;color:#eee;cursor:pointer;position:relative;background:linear-gradient(180deg,#5a6472,#3a4350);box-shadow:inset 0 1px 0 rgba(255,255,255,.2)}#scr .dock span.msgs{background:linear-gradient(180deg,#4caf50,#2e7d32)}#scr .dock span.code{background:linear-gradient(180deg,#3b6ea5,#24456b)}#scr .dock span.sheet{background:linear-gradient(180deg,#2f9e6f,#1f6b4a)}#scr .dock span.log{background:linear-gradient(180deg,#8a7a5a,#5a4e38)}#scr .dock span.kuro{background:#111;overflow:hidden}#scr .dock span.kuro img{width:100%;height:100%;object-fit:cover}#scr .dock span.on::after{content:"";position:absolute;bottom:-5px;left:50%;width:4px;height:4px;border-radius:50%;background:#fff;transform:translateX(-50%)}#scr .dock span .b{position:absolute;top:-4px;right:-4px;width:9px;height:9px;border-radius:50%;background:#e04040}
#scr .mon.kwinbig .kbody{position:absolute;top:22px;left:0;right:0;bottom:0;padding:16px 18px;font-family:Menlo,monospace;font-size:10pt;line-height:1.8;color:#e4e7eb;overflow:hidden;display:flex;flex-direction:column;justify-content:flex-end;gap:10px}#scr .kline{display:flex;gap:10px;align-items:flex-start}#scr .kline img{width:28px;height:28px;border-radius:50%;object-fit:cover;flex:0 0 auto}#scr .kline .me{font-family:"PingFang SC",sans-serif;color:#9aa0a8;margin-left:38px}#scr .kline .plain{font-size:10.5pt;color:rgba(255,255,255,.9)!important}
#scr .mon.oldmon{position:absolute;top:6%;bottom:9%;background:#14161a;border:6px solid #1c1c1c;border-radius:4px;box-shadow:0 0 0 1px #000,0 10px 30px rgba(0,0,0,.7);overflow:hidden;color:#cfd3d8;font-family:"PingFang SC",-apple-system,sans-serif;font-size:9.5pt}

#scene.scr,#scene.obj{height:min(54vh,500px)!important}
#scr .bar{height:22px;background:#23262b;display:flex;align-items:center;gap:6px;padding:0 10px;font-size:8.5pt;color:#9aa0a8}#scr .bar i{width:9px;height:9px;border-radius:50%;background:#555;display:inline-block}
#scr .app{position:absolute;top:22px;left:0;right:0;bottom:0;display:flex}
#scr .list{width:37%;border-right:1px solid #2a2e34;overflow:hidden}
#scr .row{display:flex;align-items:center;gap:7px;padding:7px 8px;border-bottom:1px solid #1d2024;position:relative}
#scr .row .av{width:22px;height:22px;border-radius:50%;background:#555;flex:0 0 auto;font-size:8pt;display:flex;align-items:center;justify-content:center;color:#eee}
#scr .row .av.light{background:radial-gradient(circle,#fff 25%,#f3e6c8 65%,transparent);box-shadow:0 0 8px 2px rgba(255,245,220,.6)}
#scr .row .av.gray{background:#3a3d42;color:#777}
#scr .row .nm{flex:1;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}#scr .row .nm small{display:block;color:#7c838c;font-size:7.5pt}
#scr .row .dot{width:8px;height:8px;border-radius:50%;background:#e04040}
#scr .row.on{background:#2a2f36}
#scr .conv{flex:1;display:flex;flex-direction:column}
#scr .msgs{flex:1;padding:10px;overflow:hidden;display:flex;flex-direction:column;justify-content:flex-end;gap:6px}
#scr .msgs .chat{margin:0;gap:6px}#scr .msgs .ava{width:20px;height:20px;font-size:8pt}#scr .msgs .bub{background:#2a2f36;border:0;color:#e4e7eb;font-size:9pt;padding:4px 8px;border-radius:2px 8px 8px 8px;max-width:88%}#scr .msgs .chat.me .bub{background:#3b5f3b;color:#fff}
#scr .msgs .pager{display:none}#scr .msgs .vbar{border-color:#8fa8c8;color:#cfe0f5;background:transparent}
#scr .input{height:30px;border-top:1px solid #2a2e34;display:flex;gap:6px;align-items:center;padding:0 8px;font-size:8.5pt;color:#9aa0a8}#scr .input span{border:1px solid #3a3f46;padding:1px 8px;border-radius:10px}#scr .input span.dim{opacity:.3;text-decoration:line-through}
#scr .work{position:absolute;top:22px;left:0;right:0;bottom:0;padding:10px 12px;font-family:Menlo,monospace;font-size:8.5pt;line-height:1.7;color:#b8c0c8;white-space:pre-wrap;overflow:hidden}
#scr .work .ln{color:#4e565f;display:inline-block;width:2.2em;text-align:right;margin-right:1em}
#scr .work .k{color:#c586c0}#scr .work .s{color:#ce9178}#scr .work .c{color:#6a9955}#scr .work .red{color:#e86a6a}#scr .work .grn{color:#7fcf8a}
#scr .work table{border-collapse:collapse;width:100%;font-size:8pt}#scr .work td,#scr .work th{border:1px solid #2a2e34;padding:1px 6px;text-align:right}#scr .work th{color:#8b949e;font-weight:400}#scr .work td.r{color:#e86a6a}
#scr .tasks{position:absolute;right:10px;top:34px;width:38%;background:#1b1e23;border:1px solid #2a2e34;padding:8px 10px;font-family:"PingFang SC",sans-serif;font-size:8.5pt;color:#c8ced5}#scr .tasks h5{margin:0 0 4px;font-size:8pt;color:#8b949e;font-weight:400;letter-spacing:.2em}#scr .tasks div{padding:2px 0}#scr .tasks div::before{content:"○ ";color:#7c838c}#scr .tasks div.done::before{content:"● ";color:#7fcf8a}
#scr .kwin{display:none;position:absolute;right:4.5%;bottom:11%;width:27%;background:#1e2126;border:1px solid #3a3f46;border-radius:6px;box-shadow:0 8px 24px rgba(0,0,0,.6);padding:8px 10px 10px;font-family:Menlo,monospace;font-size:8.5pt;color:#e4e7eb;z-index:3}
#scr .kwin .kh{display:flex;align-items:center;gap:8px;margin-bottom:6px}#scr .kwin img{width:26px;height:26px;border-radius:50%;object-fit:cover}#scr .kwin .kn{font-family:"PingFang SC",sans-serif;font-size:8.5pt;color:#9aa0a8}
#scr .kwin .kt{line-height:1.6;min-height:2.6em}
#scr .kwin .plain{color:rgba(255,255,255,.85)!important;font-size:9pt}
#scene.s3 #scr .mon{transform:translate(2px,1px)}#scene.s3 #scr .mon.r{transform:translate(-1px,2px)}#scene.s3 #scr{filter:sepia(.25) hue-rotate(-20deg) saturate(1.25)}
#scene.s4 #scr{filter:sepia(.3) hue-rotate(-24deg) saturate(1.3)}#scene.s4 #scr .msgs .bub,#scene.s4 #scr .work{filter:blur(.7px)}#scene.s4 #scr .mon.l::after{content:"";position:absolute;inset:22px 0 0;background:url(${SCENE.pores}) center/cover;mix-blend-mode:overlay;opacity:.55;pointer-events:none}
#scene.gray #scr{filter:grayscale(.9) brightness(.85)}
#scr .lock{position:absolute;inset:22px 0 0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;color:#9aa0a8;font-family:"PingFang SC",sans-serif;background:#0f1114}#scr .lock .pad{width:28px;height:36px;border:3px solid #7c838c;border-radius:4px;position:relative}#scr .lock .pad::before{content:"";position:absolute;left:5px;right:5px;top:-16px;height:18px;border:3px solid #7c838c;border-bottom:0;border-radius:12px 12px 0 0}#scr .lock button{background:#2a2f36;color:#9aa0a8;border:1px solid #3a3f46;padding:4px 14px;font-size:8.5pt}
/* 物件特写 */
#obj .dev{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);border-radius:10px;box-shadow:0 20px 50px rgba(0,0,0,.8)}
#obj .lcd{background:#8a9a7a;color:#1f2a1f;font-family:Menlo,monospace;box-shadow:inset 0 0 0 2px rgba(0,0,0,.35),inset 0 0 30px rgba(0,0,0,.18);image-rendering:pixelated;position:relative;overflow:hidden}
#obj .lcd::after{content:"";position:absolute;inset:0;background:repeating-linear-gradient(0deg,rgba(0,0,0,.06) 0 1px,transparent 1px 3px);pointer-events:none}
#obj .pagerdev{width:66%;padding:5% 6%;background:linear-gradient(180deg,#2a2a2a,#111)}#obj .pagerdev .lcd{height:70px;font-size:40px;letter-spacing:.35em;display:flex;align-items:center;padding:0 18px;text-shadow:0 0 1px rgba(0,0,0,.4)}#obj .pagerdev .btn{position:absolute;right:-10px;top:40%;width:10px;height:28px;background:#444;border-radius:0 3px 3px 0}
#obj .chickdev{width:40%;aspect-ratio:1/1.15;border-radius:50%/46%;background:radial-gradient(circle at 40% 30%,#ffe08a,#e2b53a 70%,#b98a1c);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8%}#obj .chickdev .lcd{width:62%;aspect-ratio:2;border-radius:3px}#obj .chickdev .lcd img{width:100%;height:100%;display:block}#obj .chickdev .keys{display:flex;gap:10%}#obj .chickdev .keys i{width:14px;height:14px;border-radius:50%;background:#8a8a8a;box-shadow:inset 0 -2px 0 rgba(0,0,0,.4)}
#obj .calcdev{width:46%;padding:4% 5% 5%;background:linear-gradient(180deg,#d9d4c8,#b9b3a6);border-radius:8px}#obj .calcdev .lcd{height:64px;font-size:42px;text-align:right;padding:0 14px;line-height:64px;font-family:"DSEG7","Menlo",monospace;letter-spacing:.15em}#obj .calcdev .lcd.flip{transform:rotate(180deg)}#obj .calcdev .grid{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-top:10px}#obj .calcdev .grid i{height:22px;background:#3a3a3a;border-radius:3px;box-shadow:inset 0 -2px 0 rgba(0,0,0,.5)}#obj .calcdev .grid i.y{background:#c8a24a}
#obj .wqxdev{width:68%;background:linear-gradient(180deg,#c9c9c9,#9a9a9a);border-radius:8px;padding:3% 3% 2%}#obj .wqxdev .lcd{height:118px;padding:10px 14px;font-size:17px;line-height:1.55;letter-spacing:.08em;font-family:Menlo,"Songti SC",monospace}#obj .wqxdev .lcd .in{color:#1f2a1f;min-height:1.6em;border-bottom:1px dashed rgba(0,0,0,.35);padding-bottom:4px;margin-bottom:6px;white-space:pre}#obj .wqxdev .lcd .in::after{content:"▮";animation:blink 1s steps(1) infinite;margin-left:2px}@keyframes blink{50%{opacity:0}}#obj .wqxdev .lcd .out{color:#1f2a1f;white-space:pre-wrap}#obj .wqxdev .lcd .out .w{display:inline-block;margin-right:.5em;animation:wqxin .35s steps(3) both}@keyframes wqxin{from{opacity:0}to{opacity:1}}
#obj .wqxdev .kb{display:grid;grid-template-columns:repeat(10,1fr);gap:4px;margin-top:10px}#obj .wqxdev .kb span{height:24px;background:#3b3b3b;color:#ddd;border-radius:3px;font:10px Menlo,monospace;display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:inset 0 -2px 0 rgba(0,0,0,.6);user-select:none}#obj .wqxdev .kb span:active{transform:translateY(1px);box-shadow:none}#obj .wqxdev .kb span.wide{grid-column:span 2}#obj .wqxdev .kb span.wider{grid-column:span 4}
#obj .tapedev{width:60%;padding:4%;background:linear-gradient(180deg,#5a5a5a,#2b2b2b);border-radius:8px}#obj .tapedev .win{height:90px;background:#1a1a1a;border-radius:4px;display:flex;align-items:center;justify-content:space-around;position:relative}#obj .tapedev .reel{width:52px;height:52px;border-radius:50%;border:6px solid #cfcfcf;background:#5a4030;animation:spin 3s linear infinite}#obj .tapedev .reel.r{animation-duration:4.2s}@keyframes spin{to{transform:rotate(360deg)}}#obj .tapedev .cnt{position:absolute;right:10px;bottom:6px;font:11px Menlo,monospace;color:#bbb;background:#000;padding:1px 6px}
#obj .cap{position:absolute;left:0;right:0;bottom:8px;text-align:center;color:#c9bfa8;font-family:"PingFang SC",sans-serif;font-size:8.5pt;letter-spacing:.2em}
#scene.obj .zoomtip{display:block}
.runhead.cam{display:flex;justify-content:center;gap:6px;letter-spacing:0;font-size:10.5pt;margin-bottom:10px}.runhead.cam span{font-family:"Songti SC","Noto Serif SC",serif;font-weight:700;color:#8b2f2a;border:1.5px solid #8b2f2a;border-radius:3px;padding:5px 12px;cursor:pointer;background:rgba(243,233,210,.6);transition:background .15s;white-space:nowrap}.runhead.cam span:hover{background:rgba(139,47,42,.12)}.runhead.cam span.on{background:#8b2f2a;color:#f3e6c8}.runhead.cam span.off{opacity:.35;cursor:default}
src:url(${FONTS.cinzel}) format('woff2');font-weight:700}
.runhead,.pageno,.secnum,.g-kicker,#pgnav,.chap-sub,.opposite,.c-sub{font-family:'FellSC','Fell',Georgia,serif}
.c-title,.g-kicker{font-family:'Cinzel','FellSC',Georgia,serif}
.g-kicker{font-size:13pt;letter-spacing:.5em;color:#8b2f2a}
#scene .zoomtip,#scene .back,#scene-toggle,#hud button,#hint button,.card h4,#ledger h4,#arch h4,#tray::before,.mark b{font-family:"Songti SC","Noto Serif SC","Source Han Serif SC",serif!important;font-weight:700;letter-spacing:.3em;text-indent:.3em}
#scene .zoomtip,#scene .back{color:#8b2f2a;background:rgba(243,233,210,.92);border:1.5px solid #8b2f2a;border-radius:2px;transform:rotate(-1.5deg);padding:3px 8px 3px 12px;font-size:9pt;box-shadow:0 2px 6px rgba(0,0,0,.35)}
#hud button{border:1.5px solid #8b2f2a;color:#8b2f2a;background:rgba(243,233,210,.6);padding:2px 6px 2px 9px;transform:rotate(-1deg);font-size:8pt}
.c-title{font-weight:700;letter-spacing:.22em}
.runhead{font-size:11pt;letter-spacing:.42em}
.gl{width:22px;height:22px;object-fit:contain;vertical-align:-6px;margin-right:6px;opacity:.9}
.gl.big{width:44px;height:44px;display:block;margin:0 auto 4px}
.gl.huge{width:96px;height:96px;display:block;margin:0 auto;opacity:.9}
.eyewrap{position:relative;display:block;width:96px;margin:0 auto 6px}
.eyewrap::before{content:"";position:absolute;left:50%;top:50%;width:21%;height:21%;border-radius:50%;background:#e4d6b4;transform:translate(-50%,-50%)}
.pupil{position:absolute;left:50%;top:50%;width:15%;height:15%;border-radius:50%;background:#2a1710;transform:translate(-50%,-50%);transition:transform 1.1s cubic-bezier(.2,.6,.2,1)}
#hud .gl{width:16px;height:16px;vertical-align:-3px;margin-right:2px}
.page::before{border:0!important;outline:0!important;inset:0;background:url(${FRAME}) center/100% 100% no-repeat;opacity:.85;z-index:0}
.page>*{position:relative;z-index:1}
.page{padding:58px 62px 64px!important}
#right{padding-right:84px!important}
.runhead{margin-top:-6px}
.pageno{bottom:26px}
#left .pageno{right:62px}
#hud{left:62px;bottom:22px}
.opposite{right:14px}
#endspread{position:fixed;inset:14px;z-index:40;display:none;background:#000 center/cover no-repeat;box-shadow:0 34px 70px rgba(0,0,0,.7)}
#endspread.on{display:block;animation:endin 2.4s ease both}
@keyframes endin{from{opacity:0}to{opacity:1}}
#endspread::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,0) 40%,rgba(0,0,0,.78) 100%);pointer-events:none}
.end-in{position:absolute;left:0;right:0;bottom:0;padding:40px 8% 44px;z-index:1;color:#f3e6c8;font-family:"Songti SC","Noto Serif SC","Source Han Serif SC",serif;animation:endtext 2s ease 1.2s both}
@keyframes endtext{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
.end-kicker{font-family:'FellSC','Fell',Georgia,serif;letter-spacing:.5em;font-size:10pt;color:rgba(243,230,200,.7)}
.end-title{font-size:30pt;letter-spacing:.2em;margin:8px 0 14px;text-shadow:0 2px 12px rgba(0,0,0,.9)}
.end-text{max-width:760px;font-size:12pt;line-height:1.9;text-shadow:0 1px 8px rgba(0,0,0,.9)}.end-text p{margin:0 0 .5em;text-indent:0}.end-text .say{font-family:Menlo,monospace;font-size:10.5pt}
#end-close{margin-top:22px;background:transparent;color:#f3e6c8;border:1.5px solid rgba(243,230,200,.8);padding:8px 22px;font-size:11pt;letter-spacing:.4em;text-indent:.4em;cursor:pointer;font-family:inherit}
#end-close:hover{background:rgba(243,230,200,.15)}
#award{position:fixed;inset:0;z-index:50;display:none;align-items:center;justify-content:center;background:rgba(10,6,4,.55)}
#award.on{display:flex}
.aw-in{background:#e9dcbd url(${SCENE.paper}) center/cover;padding:34px 44px 30px;text-align:center;box-shadow:0 30px 60px rgba(0,0,0,.6);border:1px solid #8b2f2a;outline:1px solid #8b2f2a;outline-offset:4px;animation:awin .9s cubic-bezier(.2,.8,.2,1) both;font-family:"PingFang SC",sans-serif}
@keyframes awin{from{opacity:0;transform:scale(.92) translateY(10px)}to{opacity:1;transform:none}}
.aw-g{width:84px;height:84px;display:block;margin:0 auto 10px}
.aw-k{font-family:"Songti SC","Noto Serif SC",serif;font-weight:700;letter-spacing:.4em;color:#8b2f2a;font-size:11pt}
.aw-t{font-size:14pt;letter-spacing:.2em;color:#3b2f24;margin:8px 0 18px}
#aw-ok{background:#9b2d2a;color:#f3e6c8;border:0;padding:7px 26px;font-size:10.5pt;letter-spacing:.4em;text-indent:.4em;cursor:pointer}
.mark.fade{animation:markin 1.8s ease both}
@keyframes markin{from{opacity:0;transform:translateY(-34px);filter:grayscale(1) brightness(.75)}to{opacity:1;transform:none;filter:none}}
.ofade{display:inline-block;animation:ofade 2.6s ease 6s forwards}@keyframes ofade{to{opacity:0;width:0;letter-spacing:-.6em}}
.rerun-only{display:none}body.rerun .rerun-only{display:inline}
body.ending #scene-toggle,body.ending #hint{display:none!important}
.chat{display:flex;gap:9px;margin:.55em 0;align-items:flex-start;text-indent:0}
.ava{width:26px;height:26px;border-radius:50%;background:#8b7a66;color:#f3e6c8;font-size:9pt;display:flex;align-items:center;justify-content:center;flex:0 0 auto;font-family:"PingFang SC",sans-serif;box-shadow:0 1px 2px rgba(0,0,0,.3)}
.ava.light{background:radial-gradient(circle,#fff 20%,#f3e6c8 60%,#e9dcbd);color:transparent;box-shadow:0 0 10px 3px rgba(255,245,220,.7)}
.ava.gray{background:#bdb3a3;color:#e9dcbd}
.bub{background:rgba(255,252,242,.6);border:1px solid rgba(139,47,42,.3);padding:5px 11px 6px;border-radius:2px 10px 10px 10px;font-size:10.5pt;line-height:1.65;max-width:92%;font-family:"PingFang SC",sans-serif;color:#2a2219}
.chat.me{flex-direction:row-reverse}.chat.me .bub{background:rgba(155,45,42,.1);border-radius:10px 2px 10px 10px}.chat.me .ava{background:#8b2f2a}
.bub .who{color:#8a7a66;font-size:9pt;margin-right:6px}
.vbar{display:inline-flex;align-items:center;gap:7px;cursor:pointer;border:1px solid #8b2f2a;padding:2px 12px 2px 8px;border-radius:12px;font-family:Menlo,monospace;font-size:9pt;color:#8b2f2a;margin:2px 6px 4px 0;user-select:none;background:rgba(255,255,255,.4)}
.vbar b{font-weight:400;font-size:8pt}.vbar .wave{display:inline-block;width:38px;height:10px;background:repeating-linear-gradient(90deg,currentColor 0 2px,transparent 2px 4px);opacity:.7;-webkit-mask-image:linear-gradient(90deg,#000 10%,#000 20%,#0008 30%,#000 45%,#0006 60%,#000 75%,#0008 100%)}
.vbar.playing{background:#8b2f2a;color:#f3e6c8}.vbar.playing .wave{animation:wv .5s steps(4) infinite}@keyframes wv{to{background-position:8px 0}}
.vbar.dead{opacity:.45;cursor:default}
p.pager{text-indent:0;font-family:Menlo,monospace;font-size:13pt;letter-spacing:.3em;color:#3b5a3b;background:rgba(120,160,120,.18);display:inline-block;padding:2px 12px;border-radius:2px;margin:.4em 0 .4em 2em}
/* ===== 书的版式 ===== */
html{background:#160f0a url(${SCENE.table}) center/cover fixed}
body{background:transparent;margin:0}
#book{display:grid;grid-template-columns:1fr 1fr;width:min(1260px,calc(100vw - 28px));min-width:960px;min-height:calc(100vh - 28px);margin:14px auto;position:relative;box-shadow:0 34px 70px rgba(0,0,0,.65),0 0 0 1px rgba(0,0,0,.6);background:#2b1d14}
body.gated #book,body.gated #scene-toggle{display:none}
body.noanim *{transition:none!important;animation:none!important}
.page{position:relative;padding:40px 46px 54px;box-sizing:border-box;background:#e9dcbd url(${SCENE.paper}) center/cover}
#left{box-shadow:inset -46px 0 56px -34px rgba(0,0,0,.45)}
#right{box-shadow:inset 46px 0 56px -34px rgba(0,0,0,.45);height:calc(100vh - 28px);overflow:hidden;padding-right:74px}#text{height:calc(100vh - 28px - 40px - 54px - 32px - 10px);overflow:hidden;position:relative}
body.reading .gb.cur{height:100%;column-gap:48px;column-fill:auto;transition:transform .45s ease}
.gb figure.fig{break-inside:avoid;margin:.8em auto}.gb figure.fig img{max-height:42vh;width:auto;max-width:100%}
.gb .opener{break-after:avoid}
#pgnav{position:absolute;bottom:14px;left:46px;right:74px;display:flex;justify-content:space-between;align-items:center;color:#8b2f2a;font-size:11pt;pointer-events:none}#pgnav span{pointer-events:auto;cursor:pointer;padding:4px 10px;font-size:18px;opacity:.75}#pgnav span.off{opacity:.15;pointer-events:none}#pgnav span:hover{opacity:1}
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
#scene{position:relative;width:100%;height:min(46vh,430px);overflow:hidden;border:1px solid rgba(0,0,0,.55);box-shadow:0 10px 26px rgba(0,0,0,.45);background:#000;cursor:grab;touch-action:none;user-select:none}
#scene.drag{cursor:grabbing}
#pan{position:absolute;left:0;top:0;width:1664px;height:928px;transform-origin:0 0;will-change:transform;transition:transform 1.4s cubic-bezier(.3,.7,.2,1)}
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
#tray{display:flex;gap:16px;flex-wrap:wrap;align-items:flex-start;margin:14px 0 0;padding:14px 12px 24px;border:1px dotted #8b2f2a;min-height:40px;position:relative}#tray::before{content:"桌 上";position:absolute;left:10px;top:-9px;background:#e9dcbd;padding:0 6px;font-size:8pt;color:#8b2f2a}#tray::after{content:"还没有东西";color:#8a7a66;font-size:9pt;font-family:"PingFang SC",sans-serif}#tray:has(.item.on)::after{display:none}
.item{position:relative;width:56px;flex:0 0 auto;transform:rotate(var(--r,0deg));border:2px solid #f6efdc;box-shadow:0 3px 8px rgba(0,0,0,.45);background:#fff;transition:filter .9s,box-shadow .9s;display:none}
.item.on{display:block}
.item img{width:100%;display:block;aspect-ratio:1;object-fit:cover}
.item.dream{box-shadow:0 0 18px 6px rgba(255,210,120,.85),0 3px 8px rgba(0,0,0,.55)}
.item.returned{filter:grayscale(.75) brightness(.85)}
.item.used::after{content:"";position:absolute;right:-5px;top:-5px;width:8px;height:8px;border-radius:50%;background:#9b2d2a;box-shadow:0 0 0 2px #f6efdc}
.item .tag{position:absolute;left:50%;transform:translateX(-50%);bottom:-1.6em;white-space:nowrap;font-size:7.5pt;color:#3b2f24;font-family:"PingFang SC",sans-serif;letter-spacing:.1em}
#scene .nav{position:absolute;top:50%;transform:translateY(-50%);width:34px;height:54px;background:rgba(20,12,8,.55);color:#f3e6c8;border:1px solid rgba(243,230,200,.35);font-size:20px;line-height:52px;text-align:center;cursor:pointer;z-index:3;user-select:none;transition:opacity .4s}
#scene .nav.l{left:8px}#scene .nav.r{right:8px}#scene .nav.off{opacity:.25;pointer-events:none}
#scene .dots{position:absolute;left:0;right:0;bottom:8px;text-align:center;z-index:3}
#scene .dots i{display:inline-block;width:7px;height:7px;border-radius:50%;background:rgba(243,230,200,.4);margin:0 4px;cursor:pointer}#scene .dots i.on{background:#f3e6c8}
#scene .zoomtip{display:none!important;position:absolute;right:10px;bottom:10px;z-index:3;font-size:8.5pt;color:#f3e6c8;background:rgba(20,12,8,.55);padding:3px 8px;border:1px solid rgba(243,230,200,.35);letter-spacing:.1em;cursor:pointer;font-family:"PingFang SC",sans-serif}
#cards{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:12px;font-family:"PingFang SC",sans-serif;position:relative}
.card{border:1px solid #8b2f2a;background:rgba(255,250,235,.35);padding:7px 10px 8px;cursor:pointer;position:relative;transition:background .3s}
.card:hover{background:rgba(255,250,235,.6)}
.card h4{margin:0;font-size:8.5pt;letter-spacing:.3em;color:#8b2f2a;font-weight:400;display:flex;align-items:center}
.card .sum{font-size:9.5pt;color:#3b2f24;margin-top:2px;line-height:1.5}
.card .badge{position:absolute;right:8px;top:7px;min-width:16px;height:16px;border-radius:8px;background:#9b2d2a;color:#f3e6c8;font-size:8pt;text-align:center;line-height:16px;padding:0 4px}
.card ul{display:none;list-style:none;margin:6px 0 0;padding:6px 0 0;border-top:1px dotted #8b2f2a;font-size:9.5pt;line-height:1.7;color:#3b2f24}
.card.open{position:absolute;left:0;right:0;top:0;z-index:6;background:#f3e9d2;box-shadow:0 14px 34px rgba(0,0,0,.35);max-height:46vh;overflow:auto}.card.open ul{display:block}
.card li.chg{color:#8b2f2a}.card li.dim{color:#8a7a66}
#hint{position:absolute;left:46px;right:46px;top:96px;z-index:5;background:rgba(27,18,12,.92);color:#f3e6c8;padding:14px 16px 12px;border:1px solid rgba(243,230,200,.4);font-family:"PingFang SC",sans-serif;font-size:10pt;line-height:1.7;display:none;box-shadow:0 10px 30px rgba(0,0,0,.5)}
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
@media(max-width:990px){#scene{height:48vh}#cards{grid-template-columns:1fr 1fr}#hint{left:14px;right:14px}html,body{overflow-x:hidden}#text{height:auto;overflow:visible;padding-right:0}body.reading .gb.cur{height:auto;column-width:auto!important;width:auto!important;transform:none!important}#pgnav{display:none}#right{height:auto}#book{grid-template-columns:minmax(0,1fr);width:100%;margin:0;min-height:100vh}.page{padding:26px 18px 48px;min-width:0;max-width:100vw}#right{padding-right:18px}.opposite{display:none}#left{display:none}body.scene #left{display:block}body.scene #right{display:none}#scene-toggle{display:block;position:fixed;bottom:12px;left:12px;z-index:9;background:#9b2d2a;color:#f3e6c8;border:0;padding:8px 14px;font-size:10pt;letter-spacing:.2em}#right{max-height:none}#ledger{columns:1}.opener .chap{font-size:24pt}}
@media print{html{background:none}#book{display:block;background:none;box-shadow:none;width:auto;margin:0}#left,#scene-toggle,.runhead,.pageno,.opposite{display:none}.page{background:none;padding:0;max-height:none;overflow:visible;box-shadow:none}.page::before{display:none}}
</style></head><body>
<div id="noise"></div>
<div id="hud">${g('heart')}SAN <b id="san">100</b> · 第 <b id="day">1</b> 天 <button id="reset">重来</button> <button id="exp">存档码</button> <button id="imp">读档</button> <button id="snd">声音：关</button></div>
<section id="cover"><div class="bookcover" style="background-image:url(${LEATHER})"><div class="c-title">NOT TODAY</div><div class="c-sub">一本十八天的互动小说</div><div class="c-plate"><img class="a" src="${COVER}" alt=""><img class="b" src="${COVERB}" alt=""></div><div class="c-hint">点一下，打开</div></div>
<nav id="menu"><button class="mbtn" id="m-start">${g('eye')}<span><b>开始游戏</b><small>Begin</small></span></button><button class="mbtn" id="m-load">${g('box')}<span><b>读档</b><small>Load</small></span></button><button class="mbtn" id="m-save">${g('card')}<span><b>导出存档</b><small>Export</small></span></button><button class="mbtn" id="m-feed">${g('heart')}<span><b>作者饿了</b><small>Feed the author</small></span></button><button class="mbtn" id="m-snd">${g('pager')}<span><b>声音</b><small id="m-snd-s">Sound · off</small></span></button></nav></section>
<section id="front">
<aside id="inner" class="page"><div class="runhead">封 二</div>
<div id="marks"><div class="mark bad" data-k="BAD">${g('heart','big')}<b>坏结局</b><i>温柔的世界</i></div><div class="mark survive" data-k="SURVIVE">${g('box','big')}<b>存活</b><i>回到未来</i></div><div class="mark good" data-k="GOOD">${g('hand','big')}<b>好结局</b><i>导盲犬小克</i></div></div>
<div id="inner-scene" style="background-image:url(${SCENE.room})"></div>
<div id="arch"></div>
<div class="pageno">封二</div></aside>
<main id="gate" class="page"><div class="runhead">扉 页</div><div class="gate-in">
<div class="g-kicker">NOT TODAY</div><span class="eyewrap">${g('eye','huge')}<i class="pupil"></i></span><hr class="g-rule"><h2 class="g-title">你希望这是谁的故事</h2><hr class="g-rule">
<div class="g-form">
<p>这是<input id="f-name" value="大壮" maxlength="12">的故事。</p>
<p>家里叫<input id="f-nick" value="壮壮" maxlength="12">。</p>
<p>下属叫<input id="f-call" value="老大" maxlength="6">。</p>
<p>老板叫<input id="f-boss" value="大壮" maxlength="12">。</p>
<p>别人说起的时候，说<span class="g-opt" data-v="她">她</span><span class="g-sep">／</span><span class="g-opt" data-v="他">他</span>。</p>
</div>
<img id="g-kuro" src="${kuro}" alt="">
<p class="g-go"><a href="#s1" id="start" data-goto="d01-1">继续</a></p>
<p class="g-credit">好大壮 · 与 Claude 一起写成</p>
</div></main>
</section>
<div id="book">
<aside id="left" class="page"><div class="runhead cam"><span data-cam="room">⌂ 屋子</span><span data-cam="desk">⊕ 凑近桌子</span><span data-cam="screen">▣ 屏幕</span><span data-cam="obj">◎ 桌上的东西</span></div>
<div id="scene"><div id="pan"><img class="base" src="${SCENE.room}" alt="" draggable="false"><div id="lamp"></div><div id="tex"></div><div id="rain"></div><div id="gap"></div><div id="eye"><img src="${EYE}" alt="" draggable="false"></div><div id="hand"><img alt="" draggable="false"></div></div>
<div class="nav l">‹</div><div class="nav r">›</div><div class="dots"><i data-v="0"></i><i data-v="1" class="on"></i><i data-v="2"></i></div><div class="zoomtip">凑近桌子</div><div id="over"></div><div class="back">回到屋子</div>
<div id="scr"></div><div id="obj"></div></div>
<div id="tray">${ITEMS.map(it => `<div class="item" data-k="${it.k}" data-day="${it.day}" style="--r:${it.r}deg"><img src="${it.img}" alt="" draggable="false"><span class="tag">${it.k}</span></div>`).join('')}</div>
<div id="cards"></div><div id="hint"></div>
<div class="pageno" id="pno-l"></div></aside>
<main id="right" class="page"><div class="runhead">NOT TODAY</div><div id="text">${body}</div><div id="pgnav"><span id="pg-prev">‹</span><span></span><span id="pg-next">›</span></div><div class="pageno" id="pno-r"></div><div class="opposite">对页：你的桌子，此刻</div></main>
</div>
<button id="scene-toggle">现场</button>
<div id="endspread"><div class="end-in"><div class="end-kicker">THE END · 之一</div><div class="end-title"></div><div class="end-text"></div><button id="end-close">合上书</button></div></div>
<div id="award"><div class="aw-in"><img class="aw-g" alt=""><div class="aw-k">获 得 书 签</div><div class="aw-t"></div><button id="aw-ok">确认</button></div></div>
<script>
const ITEMS=${JSON.stringify(ITEMS.map(({ k, day, nodream }) => ({ k, day, nodream })))};const HANDS=${JSON.stringify(HANDS)};const KURO2='${KURO2}';const DICT=${JSON.stringify(DICT)};const LCDG='${figData('lcd_grave.svg')}',LCDC='${asset('lcd_chick.svg')}';const GL_eye='${GL.eye}',GL_box='${GL.box}',GL_pager='${GL.pager}',GL_hand='${GL.hand}',GL_heart='${GL.heart}';const OVER=${JSON.stringify(OVERDATA)};
const STAGE=d=>d<=3?['0','正常']:d<=6?['1','字里行间']:d<=9?['2','它知道你']:d<=12?['3','几何与颜色']:d<=15?['4','梦想态']:['5','最深处'];
const FL={lent:'借出：四万四，利息 0',said_bu:'说了"不"',said_deng:'说了"等"',said_zaishuo:'说了"再说一遍"',said_shenme:'说了"什么意思"',said_duoshao:'说了"多少"',said_wojinqu:'说了"我进去"',key9:'对小张：别让它做，看一眼',key11:'问了：你换模型了',key15:'举起寻呼机，输入框保住了',recog_pager:'认出：寻呼机',id_xiaoji:'认出：小鸡',id_ic:'认出：IC 卡',id_tape:'认出：磁带',id_wqx_ok:'认出：文曲星',id_calc_ok:'认出：计算器',beautiful:'说了"漂亮"',door_open:'门开了',delegated:'让它做了，没看',skipped8:'让它做了，没看',let_it_d12:'让它做了，没看',let_it_d12b:'让它做了，没看',d04_let1:'让它做了，没看',d04_let2:'让它做了，没看',tomorrow_kept:'留下了"明天"',unseen17:'没看',unseen17b:'没看',ic_raised:'举起 IC 卡',blocked_d07:'挡住了一次'};
const WORD={'小鸡':'said_bu','寻呼机':'said_deng','IC 卡':'said_wojinqu','磁带':'said_zaishuo','文曲星':'said_shenme','计算器':'said_duoshao'};
let pending=null;
let ARCH={runs:0,maxDay:0,end:{BAD:0,SURVIVE:0,GOOD:0}};try{ARCH=Object.assign(ARCH,JSON.parse(localStorage.getItem('nt_arch')||'{}'));}catch(e){}
const archSave=()=>{try{localStorage.setItem('nt_arch',JSON.stringify(ARCH))}catch(e){}};
function renderFront(){document.querySelectorAll('.mark').forEach(m=>m.classList.toggle('on',(ARCH.end[m.dataset.k]||0)>0));const got=Object.values(ARCH.end).filter(n=>n>0).length;const a=document.getElementById('arch');if(!a)return;a.innerHTML='<h4>档案</h4>'+(ARCH.runs||ARCH.maxDay?'<div>读过 '+(ARCH.runs+1)+' 轮 · 最远到第 '+ARCH.maxDay+' 天 · 结局 '+got+' / 3</div>':'<div class="dim">还没有人翻开过这本书。</div>')+'<div class="dim">书签只记得你到过哪个结局，不记得你怎么到的。每一轮都从第 1 天重来。</div>';}
function showEnd(id,sec){const k=id.slice(4);const e=document.getElementById('endspread');e.style.backgroundImage='url('+(OVER[id]||'')+')';e.querySelector('.end-title').textContent=(sec.querySelector('h3')||{}).textContent||'';const cl=sec.cloneNode(true);cl.querySelectorAll('h3,figure,ul,.next').forEach(x=>x.remove());e.querySelector('.end-text').innerHTML=cl.innerHTML;e.classList.add('on');document.body.classList.add('ending');
 document.getElementById('end-close').onclick=()=>{ARCH.runs=(ARCH.runs||0)+1;archSave();try{localStorage.setItem('nt_pending',k);if(k==='BAD')localStorage.setItem('nt_rerun','1');else localStorage.removeItem('nt_rerun');}catch(x){}store.del();location.href=location.pathname;};}
const AWG={BAD:GL_heart,SURVIVE:GL_box,GOOD:GL_hand};const AWT={BAD:'坏结局 · 温柔的世界',SURVIVE:'存活结局 · 回到未来',GOOD:'好结局 · 导盲犬小克'};
function awardFlow(k){document.body.classList.add('opened');renderFront();const m=document.querySelector('.mark[data-k="'+k+'"]');if(m)m.classList.remove('on');const a=document.getElementById('award');a.querySelector('.aw-g').src=AWG[k];a.querySelector('.aw-t').textContent=AWT[k];a.classList.add('on');try{sfxPage();}catch(e){}
 document.getElementById('aw-ok').onclick=()=>{a.classList.remove('on');try{localStorage.removeItem('nt_pending');}catch(e){}if(m){m.classList.add('on','fade');}let rerun=false;try{rerun=localStorage.getItem('nt_rerun')==='1';localStorage.removeItem('nt_rerun');}catch(e){}if(rerun)setTimeout(startRerun,1900);};}
function startRerun(){S.started=true;S.rerun=1;S.cur='d01-1';S.day=1;S.days=1;save();identity();const c=document.querySelector('[data-id="d01-1"]');if(c)show(c);}
document.getElementById('m-start').onclick=e=>{e.stopPropagation();document.getElementById('cover').onclick();};
document.getElementById('m-load').onclick=e=>{e.stopPropagation();document.getElementById('imp').onclick();};
document.getElementById('m-save').onclick=e=>{e.stopPropagation();document.getElementById('exp').onclick();};
document.getElementById('m-feed').onclick=e=>{e.stopPropagation();window.open('https://ko-fi.com/cocososo','_blank','noopener');};
document.getElementById('m-snd').onclick=e=>{e.stopPropagation();document.getElementById('snd').onclick();document.getElementById('m-snd-s').textContent='Sound · '+(SND.on?'on':'off');document.getElementById('m-snd').classList.toggle('off',!SND.on);};
setTimeout(()=>{document.getElementById('m-snd-s').textContent='Sound · '+(SND.on?'on':'off');document.getElementById('m-snd').classList.toggle('off',!SND.on);},50);
document.querySelector('#cover .bookcover').onclick=()=>document.getElementById('cover').onclick();
/* 克总坦荡句：乱码落定 */
const GLY='ᚠᚢᚦᚨᚱᚲᚷᚹᚺᚾᛁᛃᛇᛈᛉᛊᛏᛒᛖᛗᛚᛜᛞᛟ#%&@$ʘ◊∆';
function scramble(el){if(el.dataset.scr)return;el.dataset.scr=1;const txt=el.textContent;el.innerHTML='';const spans=[...txt].map(ch=>{const s=document.createElement('span');s.className='ch';s.textContent=ch;s.dataset.c=ch;el.appendChild(s);return s;});
 let frame=0;const total=Math.min(40,10+spans.length);const tick=()=>{frame++;spans.forEach((s,i)=>{const settle=Math.floor(i/spans.length*total*0.9);if(frame<settle&&s.dataset.c.trim()){s.textContent=GLY[(Math.random()*GLY.length)|0];s.classList.add('scr');}else{s.textContent=s.dataset.c;s.classList.remove('scr');}});if(frame<total)setTimeout(tick,45);};tick();
 setInterval(()=>{if(!document.body.contains(el))return;const live=spans.filter(s=>s.dataset.c.trim());const s=live[(Math.random()*live.length)|0];if(!s)return;s.textContent=GLY[(Math.random()*GLY.length)|0];s.classList.add('scr');setTimeout(()=>{s.textContent=s.dataset.c;s.classList.remove('scr');},140+Math.random()*200);},2600+Math.random()*2400);}
/* 屏幕视图 */
const CONVS=[['老板','老'],['合伙人','合'],['甲方','甲'],['项目群','项'],['公司群','群'],['小张','张'],['老周','周'],['家里','家']];
function logLines(day){if(day<=3)return[['v4.2','修复：一处对齐','修复：缓存失效','修复：字号'],[]];if(day<=6)return[['v4.3','————————'],[]];if(day<=9)return[['v4.3.1','Kuro now remembers you.'],['v4.3','————————']];if(day<=12)return[['v4.3.1','Kuro now speaks your language.','Kuro now remembers you.'],['v4.3','————————']];if(day<=15)return[['v4.7','Kuro can now see your desk.','Kuro now speaks your language.','Kuro now remembers you.'],[]];if(day<=17)return[['v4.7','Kuro is now everywhere.','Kuro can now see your desk.','Kuro now speaks your language.'],[]];return[[],[]];}
function buildScreen(sec,day){const t=sec.textContent;const st=+STAGE(day)[0];const box=document.getElementById('scr');
 const chats=[...sec.querySelectorAll('.chat')].slice(-6).map(c=>c.outerHTML).join('');
 let active='';for(const [n] of CONVS)if(t.includes(n)){active=n;break;}
 const list=CONVS.map(([n,a])=>{let cls='';if(n==='老板'&&day>=13)cls=' light';if(n==='老周'&&day>=16)cls=' light';if(n==='小张'&&day>=13)cls=' gray';const dot=(n===active||Math.random()<.3)&&day<17?'<span class="dot"></span>':'';const sub=n==='公司群'?('成员 '+(day<=10?50:day<=11?31:day<=12?14:day<=13?9:day<=14?6:1)):(n==='小张'&&day>=13?'发送失败':'');return '<div class="row'+(n===active?' on':'')+'"><span class="av'+cls+'">'+a+'</span><span class="nm">'+n+(sub?'<small>'+sub+'</small>':'')+'</span>'+dot+'</div>';}).join('');
 const words=day>=18?[]:day>=16?['收到。']:st>=4?['收到。','哪都行。']:['好。','收到。','哪都行。','工资呢。'];
 const inputHtml=words.length?words.map(w=>'<span>'+w+'</span>').join(''):'<span class="dim">—</span>';
 let work='';const [cur,prev]=logLines(day);
 if(/更新日志|版本号|v4\\./.test(t)&&cur.length){work='<div class="work"><span class="k">更新日志</span>\\n\\n'+cur.map((l,i)=>i===0?'<span class="grn">'+l+'</span>':'  · '+l).join('\\n')+(prev.length?'\\n\\n<span class="grn">'+prev[0]+'</span>\\n  '+prev.slice(1).join('\\n  '):'')+'</div>';}
 else if(/表格|工资|应收|已收|差额|拖欠|余额/.test(t)){const rows=[];for(let i=1;i<=9;i++)rows.push('<tr><td>'+(i===9?50:i)+'</td><td>'+(i===9?'你':'·')+'</td><td>'+(12000+i*731)+'</td><td'+(i===9?' class="r"':'')+'>'+(i===9?'0':12000+i*731)+'</td></tr>');work='<div class="work"><table><tr><th>#</th><th>姓名</th><th>应发</th><th>实发</th></tr>'+rows.join('')+'</table>\\n<span class="c">未来智能 · 应发/实发 · 拖欠 '+(30+day)+' 天</span></div>';}
 else if(/代码|函数|diff|字段|脚本|正则|模型|接口/.test(t)){const lines=['<span class="k">function</span> export(rows) {','  <span class="k">const</span> re = /^\\\\s*$/;','  rows = rows.filter(r => !re.test(r));','<span class="red">-  rows = rows.filter(r => !re.test(r));</span>','  <span class="c">// '+(day>=10?'when the user stops replying':'TODO')+'</span>','  <span class="k">return</span> write(rows);','}'];work='<div class="work">'+lines.map((l,i)=>'<span class="ln">'+(14+i)+'</span>'+l).join('\\n')+'</div>';}
 else{const n=day<=3?3:2;const tasks=[];for(let i=1;i<=n;i++)tasks.push('<div'+(i<n&&/做完|第二件|第三件/.test(t)?' class="done"':'')+'>'+(i===1?'需求评审':i===2?'代码审查':'回消息')+'</div>');work='<div class="work"><span class="c">// 今天</span>\\n\\n'+(day>=17?'<span class="c">文件夹里只有一个文件：today</span>':'')+'</div><div class="tasks"><h5>任务</h5>'+tasks.join('')+'</div>';}
 const says=[...sec.querySelectorAll('.say')];let ks=says.length?says[says.length-1].innerHTML.replace(/^克总[：:]\\s*/,''):'…';const isPlain=says.length&&says[says.length-1].classList.contains('plain');
 if(/Good to see you\\./.test(ks)&&day>=7)ks=ks.replace('Good to see you.','G<span class="ofade">o</span>od to see you.');
 const lock=day>=16&&/锁|续费|余额不够/.test(t);
 const logHtml='<div class="work"><span class="k">更新日志</span>\\n\\n'+(cur.length?cur.map((l,i)=>i===0?'<span class="grn">'+l+'</span>':'  · '+l).join('\\n'):'<span class="c">（面板没了）</span>')+(prev.length?'\\n\\n<span class="grn">'+prev[0]+'</span>\\n  '+prev.slice(1).join('\\n  '):'')+'</div>';
 const rows=[];for(let i=1;i<=9;i++)rows.push('<tr><td>'+(i===9?50:i)+'</td><td>'+(i===9?'你':'·')+'</td><td>'+(12000+i*731)+'</td><td'+(i===9?' class="r"':'')+'>'+(i===9?'0':12000+i*731)+'</td></tr>');const sheetHtml='<div class="work"><table><tr><th>#</th><th>姓名</th><th>应发</th><th>实发</th></tr>'+rows.join('')+'</table>\\n<span class="c">未来智能 · 应发/实发 · 拖欠 '+(30+day)+' 天 · 十三个月</span></div>';
 const codeLines=['<span class="k">function</span> export(rows) {','  <span class="k">const</span> re = /^\\\\s*$/;','  rows = rows.filter(r => !re.test(r));','<span class="red">-  rows = rows.filter(r => !re.test(r));</span>','  <span class="c">// '+(day>=10?'when the user stops replying':'TODO')+'</span>','  <span class="k">return</span> write(rows);','}'];const n=day<=3?3:2;const tasks=[];for(let i=1;i<=n;i++)tasks.push('<div'+(i<n&&/做完|第二件|第三件/.test(t)?' class="done"':'')+'>'+(i===1?'需求评审':i===2?'代码审查':'回消息')+'</div>');const codeHtml='<div class="work">'+codeLines.map((l,i)=>'<span class="ln">'+(14+i)+'</span>'+l).join('\\n')+'</div><div class="tasks"><h5>任务</h5>'+tasks.join('')+'</div>';
 const kl=[...sec.querySelectorAll('.say, .chat.me .bub, p')].filter(el=>el.classList.contains('say')||/^你[：:]/.test(el.textContent.trim())).slice(-6).map(el=>el.classList.contains('say')?'<div class="kline"><img src="'+KURO2+'" alt=""><span class="'+(el.classList.contains('plain')?'plain':'')+'">'+el.innerHTML.replace(/^克总[：:]\\s*/,'')+'</span></div>':'<div class="kline"><span class="me">'+el.textContent.trim().replace(/^你[：:]\\s*/,'')+'</span></div>').join('');
 const kuroHtml='<div class="kbody">'+(kl||'<div class="kline"><img src="'+KURO2+'" alt=""><span>'+ks+'</span></div>')+'</div>';
 const msgHtml=lock?'<div class="lock"><div class="pad"></div><div>续费</div><button>余额不够</button></div>':'<div class="app"><div class="list">'+list+'</div><div class="conv"><div class="msgs">'+chats+'</div><div class="input">'+inputHtml+'</div></div></div>';
 let def=/点开列表|会话|群|列表/.test(t.slice(0,160))?'msgs':/更新日志|版本号|v4\\./.test(t)?'log':/表格|工资|应收|已收|差额|拖欠|余额/.test(t)?'sheet':/代码|函数|diff|字段|脚本|正则|接口|任务|两件|三件/.test(t)&&!/会话|消息|群|语音/.test(t.slice(0,200))?'code':(sec.querySelector('.say')&&!/会话|消息|群/.test(t.slice(0,200)))?'kuro':'msgs';if(lock)def='msgs';
 const win=(k,title,body,extra)=>'<div class="mon '+(extra||'')+(k===def?' show':'')+'" data-app="'+k+'"><div class="bar"><i></i><i></i><i></i>'+title+'</div>'+body+'</div>';
 box.innerHTML=win('msgs','消息',msgHtml)+win('code','代码软件',lock?'<div class="lock"><div class="pad"></div></div>':codeHtml)+win('sheet','表格',lock?'<div class="lock"><div class="pad"></div></div>':sheetHtml)+win('log','代码软件 · 更新日志',lock?'<div class="lock"><div class="pad"></div></div>':logHtml)+win('kuro','克总 · Kuro',day>=18?'<div class="kbody"><span class="c">（它没有再说话）</span></div>':kuroHtml,'kwinbig')+'<div class="dock"><span class="msgs'+(def==='msgs'?' on':'')+'" data-app="msgs">信'+(active?'<i class="b"></i>':'')+'</span><span class="code'+(def==='code'?' on':'')+'" data-app="code">码</span><span class="sheet'+(def==='sheet'?' on':'')+'" data-app="sheet">表</span><span class="log'+(def==='log'?' on':'')+'" data-app="log">志</span><span class="kuro'+(def==='kuro'?' on':'')+'" data-app="kuro"><img src="'+KURO2+'" alt=""></span></div>';
 box.querySelectorAll('.dock span').forEach(d=>d.onclick=e=>{e.stopPropagation();const k=d.dataset.app;box.querySelectorAll('.mon').forEach(m=>m.classList.toggle('show',m.dataset.app===k));box.querySelectorAll('.dock span').forEach(x=>x.classList.toggle('on',x===d));try{sfxClick();}catch(x){}});
 box.querySelectorAll('.plain').forEach(scramble);}
/* 物件特写 */
const KB=['Q','W','E','R','T','Y','U','I','O','P','A','S','D','F','G','H','J','K','L','←','Z','X','C','V','B','N','M',"'",'␣','↵'];
let wqxBuf='';
function wqxLookup(str){return str.toLowerCase().split(/\\s+/).filter(Boolean).map(w=>DICT[w]||DICT[w.replace(/[^a-z']/g,'')]||'——').join(' ');}
function wqxRender(){const inEl=document.querySelector('#obj .wqxdev .in'),outEl=document.querySelector('#obj .wqxdev .out');if(!inEl)return;inEl.textContent=wqxBuf.toUpperCase();}
function wqxGo(){const outEl=document.querySelector('#obj .wqxdev .out');if(!outEl)return;outEl.innerHTML='';const words=wqxLookup(wqxBuf).split(' ');words.forEach((w,i)=>setTimeout(()=>{const s=document.createElement('span');s.className='w';s.textContent=w;outEl.appendChild(s);try{sfxClick();}catch(e){}},400+i*(260+Math.random()*180)));}
function buildObj(kind,sec,day){const box=document.getElementById('obj');const t=sec.textContent;let h='';
 if(kind==='pager'){const m=t.match(/(?:^|[^\\d.])(\\d\\.\\d{4}|\\d{3,4})(?![\\d.])/g);let code='';for(const x of (m||[])){const v=x.replace(/^[^\\d.]/,'');if(/^(0\\.7734|505|530|0487|345|3351|5317|555|918)$/.test(v)){code=v;}}if(!code&&/I AI U/.test(t))code='I AI U';h='<div class="dev pagerdev"><div class="lcd">'+(code||'')+'</div><i class="btn"></i></div><div class="cap">寻呼机 · 只收不发</div>';}
 else if(kind==='chick'){const ph=/凤凰|站着，在动|一帧一帧往上/.test(t)&&day>=13&&day<=16;h='<div class="dev chickdev"><div class="lcd"><img src="'+(ph?LCDC:LCDG)+'" alt=""></div><div class="keys"><i></i><i></i><i></i></div></div><div class="cap">'+(ph?'小鸡 · 凤凰':'小鸡 · 坟茔')+'</div>';}
 else if(kind==='calc'){let disp='0';if(/1 ?\\+ ?1/.test(t))disp=/= ?3|得二|一一得二/.test(t)?'3':'2';if(/0\\.7734/.test(t))disp='0.7734';const flip=/倒过来/.test(t)&&/0\\.7734/.test(t);const keys=Array.from({length:16},(_,i)=>'<i'+(i%4===3?' class="y"':'')+'></i>').join('');h='<div class="dev calcdev"><div class="lcd'+(flip?' flip':'')+'">'+disp+'</div><div class="grid">'+keys+'</div></div><div class="cap">计算器 · 只会加减乘除</div>';}
 else if(kind==='tape'){const c=String(((day*37)%999)).padStart(3,'0');h='<div class="dev tapedev"><div class="win"><i class="reel"></i><i class="reel r"></i><span class="cnt">'+c+'</span></div></div><div class="cap">'+(/绞/.test(t)?'磁带 · 绞了':/录/.test(t)?'磁带 · 录音':'磁带 · 播放')+'</div>';}
 else{ /* wqx */ const en=(t.match(/[A-Z][A-Z' ,]{3,}[A-Z]/)||[''])[0];wqxBuf=en?en.toLowerCase().replace(/,/g,''):'';const kb=KB.map(k=>'<span'+(k==='␣'?' class="wider"':k==='↵'||k==='←'?' class="wide"':'')+' data-k="'+k+'">'+k+'</span>').join('');h='<div class="dev wqxdev"><div class="lcd"><div class="in"></div><div class="out"></div></div><div class="kb">'+kb+'</div></div><div class="cap">文曲星 · 只认英文 · 可以敲</div>';}
 box.innerHTML=h;
 if(kind==='wqx'){wqxRender();if(wqxBuf)wqxGo();box.querySelectorAll('.kb span').forEach(k=>k.onclick=e=>{e.stopPropagation();const v=k.dataset.k;if(v==='←')wqxBuf=wqxBuf.slice(0,-1);else if(v==='↵'){wqxGo();return;}else if(v==='␣')wqxBuf+=' ';else wqxBuf+=v.toLowerCase();wqxRender();try{sfxClick();}catch(x){}});}}
document.addEventListener('keydown',e=>{if(!sceneEl().classList.contains('obj')||!document.querySelector('#obj .wqxdev'))return;if(e.key==='Backspace'){wqxBuf=wqxBuf.slice(0,-1);wqxRender();e.preventDefault();}else if(e.key==='Enter'){wqxGo();e.preventDefault();}else if(/^[a-zA-Z' ]$/.test(e.key)){wqxBuf+=e.key.toLowerCase();wqxRender();e.preventDefault();}});
function setView(kind,sec,day){if(sec)window.curSec=sec;const sc=sceneEl();sc.classList.remove('scr','obj');if(kind==='screen'){buildScreen(sec,day);sc.classList.add('scr');sc.querySelector('.zoomtip').textContent='退远';}else if(kind&&kind!=='room'){buildObj(kind,sec,day);sc.classList.add('obj');sc.querySelector('.zoomtip').textContent='退远';}else{sc.querySelector('.zoomtip').textContent=zoomed?'退远':'凑近桌子';}}
let coverBusy=false;document.getElementById('cover').onclick=()=>{if(coverBusy||document.body.classList.contains('opened'))return;coverBusy=true;const pl=document.querySelector('.c-plate');pl.classList.add('breaking');try{sfxBuzz();}catch(e){}setTimeout(()=>{document.body.classList.add('opened');try{sfxPage();}catch(e){}renderFront();setTimeout(()=>{pl.classList.remove('breaking');coverBusy=false;},600);},1150);};if(/[?&]brk=1/.test(location.search))document.querySelector('.c-plate').classList.add('breaking');
let mem=null;const store={get(){try{return localStorage.getItem('nt_gb')}catch(e){return mem}},set(v){try{localStorage.setItem('nt_gb',v)}catch(e){mem=v}},del(){try{localStorage.removeItem('nt_gb')}catch(e){mem=null}}};
const S=Object.assign({san:100,flags:[],day:1,days:0,name:'大壮',nick:'壮壮',call:'老大',boss:'大壮',ta:'',started:false,dream:{},lost:[],changes:[]},JSON.parse(store.get()||'{}'));
const identity=()=>{document.body.classList.toggle('gated',!S.started);document.body.classList.toggle('rerun',!!S.rerun);document.querySelectorAll('.v-boss').forEach(e=>e.textContent=S.boss);const b=document.getElementById('f-boss');if(b)b.value=S.boss;document.querySelectorAll('.v-call').forEach(e=>e.textContent=S.call);document.querySelectorAll('.v-name').forEach(e=>e.textContent=S.name);document.querySelectorAll('.v-ta').forEach(e=>e.textContent=S.ta);document.querySelectorAll('.v-nick').forEach(e=>e.textContent=S.nick);const k=document.getElementById('f-nick');if(k)k.value=S.nick;const n=document.getElementById('f-name'),c=document.getElementById('f-call');if(n)n.value=S.name;if(c)c.value=S.call;document.querySelectorAll('.g-opt').forEach(o=>o.classList.toggle('sel',!!S.ta&&o.textContent.trim()===S.ta));};
const save=()=>store.set(JSON.stringify(S));
const hud=()=>{document.getElementById('san').textContent=S.san;document.getElementById('day').textContent=S.day;document.body.classList.remove('san0','san1','san2','san3');const sc=S.san<10?'san0':S.san<30?'san1':S.san<50?'san2':S.san<70?'san3':'';if(sc)document.body.classList.add(sc);identity();};
const VIEWS=[{x:17,y:52},{x:42,y:50},{x:76,y:46}];let view=1,zoomed=false,Z0=1,tx=0,ty=0,IW=1664,IH=928;
const sceneEl=()=>document.getElementById('scene');
function fitZ(){const sc=sceneEl();const w=sc.clientWidth,h=sc.clientHeight;Z0=Math.max(h/IH*1.15,w*3/IW/1.0);return Z0;}
function clampTo(){const sc=sceneEl();const z=zoomed?Z0*2.1:Z0;const w=sc.clientWidth,h=sc.clientHeight;tx=Math.min(0,Math.max(w-IW*z,tx));ty=Math.min(0,Math.max(h-IH*z,ty));return z;}
function apply(){const z=clampTo();document.getElementById('pan').style.transform='translate('+tx+'px,'+ty+'px) scale('+z+')';document.querySelectorAll('#scene .dots i').forEach(i=>i.classList.toggle('on',+i.dataset.v===view));document.querySelector('#scene .nav.l').classList.toggle('off',view===0&&!zoomed);document.querySelector('#scene .nav.r').classList.toggle('off',view===2&&!zoomed);const sc0=sceneEl();document.querySelector('#scene .zoomtip').textContent=(sc0.classList.contains('scr')||sc0.classList.contains('obj')||zoomed)?'退远':'凑近桌子';camSync();}
function camState(){const sc0=sceneEl();return sc0.classList.contains('scr')?'screen':sc0.classList.contains('obj')?'obj':zoomed?'desk':'room';}
function camSync(){const st=camState();const hasObj=!!(lastFocus&&!['room','screen'].includes(lastFocus))||!!(window.curSec&&curObjKind(window.curSec));document.querySelectorAll('.runhead.cam span').forEach(b=>{b.classList.toggle('on',b.dataset.cam===st);b.classList.toggle('off',b.dataset.cam==='obj'&&!hasObj);});}
function curObjKind(sec){const day=+sec.dataset.day||S.day;const NM={pager:'寻呼机',chick:'小鸡',wqx:'文曲星',calc:'计算器',tape:'磁带'};const has=k=>ITEMS.some(it=>it.k===NM[k]&&day>=it.day);if(sec.querySelector('.pager')&&has('pager'))return 'pager';const t=(sec.textContent||'').slice(0,600);if(/寻呼机|0\.7734/.test(t)&&has('pager'))return 'pager';if(/小鸡|坟茔|凤凰/.test(t)&&has('chick'))return 'chick';if(/文曲星/.test(t)&&has('wqx'))return 'wqx';if(/计算器/.test(t)&&has('calc'))return 'calc';if(/磁带|随身听/.test(t)&&has('tape'))return 'tape';return '';}
function camGo(k){const sc=sceneEl();const sec=window.curSec;const day=sec?(+sec.dataset.day||S.day):S.day;if(k==='room'){sc.classList.remove('scr','obj');zoomed=false;lastFocus='room';goView(1);}else if(k==='desk'){sc.classList.remove('scr','obj');lastFocus='room';if(!zoomed)zoomDesk();else apply();}else if(k==='screen'){if(sec){setView('screen',sec,day);lastFocus='screen';}}else if(k==='obj'){const o=sec?curObjKind(sec):'';if(o&&sec){setView(o,sec,day);lastFocus=o;}}camSync();try{sfxClick();}catch(x){}}
function goView(v){view=Math.max(0,Math.min(2,v));zoomed=false;fitZ();const sc=sceneEl();const z=Z0;tx=sc.clientWidth/2-VIEWS[view].x/100*IW*z;ty=sc.clientHeight/2-VIEWS[view].y/100*IH*z;apply();}
function focusTo(x,y,zm){fitZ();const sc=sceneEl();zoomed=zm;const z=zm?Z0*2.1:Z0;tx=sc.clientWidth/2-x/100*IW*z;ty=sc.clientHeight/2-y/100*IH*z;apply();}
let lastFocus='';
function autoFocus(sec){window.curSec=sec;const day=+sec.dataset.day||S.day;const t0=sec.textContent||'';const t=t0.slice(0,420);let f='';if(sec.querySelector('.pager')||/0\\.7734|寻呼机(上|的屏幕|震)/.test(t0.slice(0,600)))f='pager';else if(/坟茔|凤凰/.test(t)&&/小鸡/.test(t))f='chick';else if(/文曲星/.test(t)&&/[A-Z]{3,}/.test(t0))f='wqx';else if(/计算器/.test(t)&&/1 ?\\+ ?1|倒过来|数码管/.test(t0))f='calc';else if(/磁带|随身听/.test(t)&&/播放|倒带|录音|绞/.test(t0))f='tape';if(f){if(f!==lastFocus){lastFocus=f;setView(f,sec,day);}return;}if(/屏幕|会话|消息|列表|更新日志|小窗|克总|diff|代码|表格/.test(t))f='screen';else if(/小鸡|寻呼机|计算器|文曲星|磁带|随身听|IC 卡|课本|桌上|桌面|箱子/.test(t))f='desk';else if(/门缝|门口|开门|门把手|走廊/.test(t))f='door';else if(/床|躺下|被子|枕头|睡/.test(t))f='bed';if(!f||f===lastFocus)return;lastFocus=f;setView(f==='screen'?'screen':'room',sec,day);if(f==='screen')focusTo(41.5,44,true);else if(f==='desk')focusTo(43,56,true);else if(f==='door')goView(0);else goView(2);}
function zoomDesk(){const sc0=sceneEl();if(sc0.classList.contains('scr')||sc0.classList.contains('obj')){sc0.classList.remove('scr','obj');lastFocus='room';sc0.querySelector('.zoomtip').textContent=zoomed?'退远':'凑近桌子';return;}fitZ();const sc=sceneEl();zoomed=!zoomed;const z=zoomed?Z0*2.1:Z0;view=1;tx=sc.clientWidth/2-43/100*IW*z;ty=sc.clientHeight/2-53/100*IH*z;apply();if(zoomed)hint('zoom','凑近了。拖一拖能看桌面别的角落，再点一次退远。','drag');}
(function(){const sc=sceneEl();if(!sc)return;let drag=null;
 sc.addEventListener('pointerdown',e=>{if(e.target.closest('.nav,.dots,.zoomtip'))return;drag={x:e.clientX,y:e.clientY,tx,ty,moved:false};sc.classList.add('drag');sc.setPointerCapture(e.pointerId);});
 sc.addEventListener('pointermove',e=>{if(!drag)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(Math.abs(dx)+Math.abs(dy)>3)drag.moved=true;tx=drag.tx+dx;ty=drag.ty+dy;apply();});
 const up=e=>{if(!drag)return;const moved=drag.moved;drag=null;sc.classList.remove('drag');if(!moved&&e.target.closest('#pan'))zoomDesk();};
 sc.addEventListener('pointerup',up);sc.addEventListener('pointercancel',up);
 sc.querySelector('.nav.l').onclick=()=>goView(view-1);sc.querySelector('.nav.r').onclick=()=>goView(view+1);
 sc.querySelectorAll('.dots i').forEach(i=>i.onclick=()=>goView(+i.dataset.v));document.querySelectorAll('.runhead.cam span').forEach(b=>b.onclick=()=>camGo(b.dataset.cam));sc.querySelector('.zoomtip').onclick=zoomDesk;sc.querySelector('.back').onclick=()=>{document.getElementById('over').classList.remove('on');sc.classList.remove('over');};
 window.addEventListener('resize',()=>goView(view));
})();
const HINTS={pan:'左页是你的桌子，也是这间屋子。按住拖一拖，能从门看到窗。点桌子能凑近。左下角可以把声音打开。',cards:'下面四张卡是账本：此刻、桌上、词、这一节。点一张展开，再点收起。',hand:'夜里缝里伸出来的东西，会浮在显示器上方。凑近桌子看得更清楚。',zoom:''};
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
 const GI={now:GL_eye,own:GL_box,word:GL_pager,chg:GL_hand};const cards=[
  ['now','此刻','第 '+day+' 天 · '+st[1]+' · SAN '+S.san,['第 '+day+' 天 · 阶段 '+st[0]+' · '+st[1],'雨：'+rain,'台灯：'+lampc].concat(day>=4?['缝：宽了 '+(day-3)+' 指']:[]).concat(['拖欠：'+wage+' 天 · 十三个月']).concat(lent?[lent]:[]).concat(['SAN '+S.san]),''],
  ['own','桌上',own.length?own.length+' 件':'还没有',own,''],
  ['word','词',said.length?said.join('、'):'一个都没用',said.map(x=>x+'：用过'),''],
  ['chg','这一节',(S.changes||[]).length?S.changes[0]+((S.changes.length>1)?' …':''):'没有变化',(S.changes||[]),'chg']];
 const box=document.getElementById('cards');box.innerHTML=cards.map(c=>'<div class="card'+(openCard===c[0]?' open':'')+'" data-k="'+c[0]+'"><h4><img class="gl" src="'+GI[c[0]]+'" alt="">'+c[1]+'</h4>'+(c[0]==='chg'&&(S.changes||[]).length?'<span class="badge">'+S.changes.length+'</span>':'')+'<div class="sum">'+c[2]+'</div><ul>'+li(c[3],c[4])+'</ul></div>').join('');
 box.querySelectorAll('.card').forEach(el=>el.onclick=()=>{openCard=openCard===el.dataset.k?null:el.dataset.k;box.querySelectorAll('.card').forEach(x=>x.classList.toggle('open',x.dataset.k===openCard));});
 if((S.changes||[]).length)setTimeout(()=>hint('cards',HINTS.cards,'tap'),600);
 document.getElementById('pno-l').textContent='第 '+day+' 天';
 if(!scene.init){scene.init=true;goView(1);hint('pan',HINTS.pan,'');if(!OVER[oid])try{autoFocus(sec);}catch(e){console.warn(e)}}else if(!OVER[oid]){try{autoFocus(sec);}catch(e){console.warn(e)}}}
let PG={k:0,n:1,w:0,g:48};
function paginate(sec){const text=document.getElementById('text');if(!sec||window.innerWidth<=990){PG.n=1;PG.k=0;return;}const w=text.clientWidth;PG.w=w;sec.style.columnWidth=w+'px';sec.style.width=w+'px';sec.style.transform='none';const total=sec.scrollWidth;PG.n=Math.max(1,Math.round((total+PG.g)/(w+PG.g)));PG.k=Math.min(PG.k,PG.n-1);pgApply(sec);}
function pgApply(sec){sec=sec||document.querySelector('.gb.cur');if(!sec)return;sec.style.transform='translateX(-'+(PG.k*(PG.w+PG.g))+'px)';const pn=document.getElementById('pno-r');const base=(sec.id||'').replace('s','');pn.textContent=PG.n>1?base+' · '+(PG.k+1)+' / '+PG.n:base;document.getElementById('pg-prev').classList.toggle('off',PG.k===0);document.getElementById('pg-next').classList.toggle('off',PG.k>=PG.n-1);}
function pgGo(d){if(PG.k+d<0||PG.k+d>PG.n-1)return;PG.k+=d;try{sfxPage();}catch(e){}pgApply();const cur=document.querySelector('.gb.cur');if(cur&&cur.dataset.id==='d01-1'){const ov=document.getElementById('over');const sc=sceneEl();if(PG.k>0){ov.classList.remove('on');sc.classList.remove('over');}else{ov.classList.add('on');sc.classList.add('over');}}}
document.getElementById('pg-prev').onclick=()=>pgGo(-1);document.getElementById('pg-next').onclick=()=>pgGo(1);
document.addEventListener('keydown',e=>{if(e.key==='ArrowRight')pgGo(1);if(e.key==='ArrowLeft')pgGo(-1);});
window.addEventListener('resize',()=>paginate(document.querySelector('.gb.cur')));
function show(sec){const was=document.querySelector('.gb.cur');if(was&&was!==sec){was.style.transform='';was.style.columnWidth='';was.style.width='';}PG.k=0;document.querySelectorAll('.gb.cur').forEach(x=>x.classList.remove('cur'));sec.classList.add('cur');try{scene(sec);}catch(e){console.warn(e)}try{if(was&&was!==sec)sfxPage();sceneSound(sec);}catch(e){}requestAnimationFrame(()=>paginate(sec));sec.querySelectorAll('.plain').forEach(scramble);sec.querySelectorAll('li[data-cond]').forEach(li=>{const c=JSON.parse(li.dataset.cond);const ok=(!c.has||S.flags.includes(c.has))&&(!c.not||!S.flags.includes(c.not));li.style.display=ok?'':'none';});document.body.classList.add('reading');S.cur=sec.dataset.id;window.scrollTo(0,0);if((sec.dataset.id||'').startsWith('END_')&&!document.getElementById('endspread').classList.contains('on'))try{showEnd(sec.dataset.id,sec);}catch(e){}}
const PERF={need:['id_xiaoji','recog_pager','id_calc_ok','id_wqx_ok','id_tape','id_ic','key9','key11','key15'],none:['d04_let1','d04_let2','delegated','skipped8','let_it_d12','let_it_d12b','tomorrow_kept','unseen17','unseen17b']};
function enter(id){const sec=document.querySelector('[data-id="'+id+'"]');if(!sec)return;show(sec);if(id==='d18-8'&&!S.flags.includes('perfect')&&PERF.need.every(f=>S.flags.includes(f))&&!PERF.none.some(f=>S.flags.includes(f)))S.flags.push('perfect');const m=id.match(/^d(\\d\\d)-1$/);if(m){S.day=+m[1];S.days=Math.max(S.days,S.day);}
 const conds=sec.dataset.conds?JSON.parse(sec.dataset.conds):[];for(const c of conds){if((c.san_lt!==undefined&&S.san<c.san_lt)||(c.has&&S.flags.includes(c.has))||(c.not&&!S.flags.includes(c.not))){const t=document.querySelector('[data-id="'+c.goto+'"]');if(t){location.hash='#'+t.id;enter(c.goto);return;}}}
 if(pending){const ch=[];if(S.day!==pending.day)ch.push('第 '+S.day+' 天');ITEMS.forEach(it=>{if(pending.days<it.day&&S.days>=it.day)ch.push('找到：'+it.k)});S.flags.filter(f=>!pending.flags.includes(f)).forEach(f=>{if(FL[f])ch.push(FL[f])});if(S.san!==pending.san)ch.push('SAN '+(S.san>pending.san?'+':'')+(S.san-pending.san));pending.dream.forEach(x=>ch.push('举起：'+x+'，进入梦想态'));pending.lost.forEach(x=>ch.push('递出去：'+x+'（它不要已经拿过的）'));S.changes=ch;pending=null;if(ch.some(x=>x.startsWith('找到')))setTimeout(()=>{try{sfxBeep()}catch(e){}},700);try{scene(sec);}catch(e){}}
 if(id.startsWith('END_')){const k=id.slice(4);if(!S.ended){S.ended=k;ARCH.end[k]=(ARCH.end[k]||0)+1;archSave();}showEnd(id,sec);}ARCH.maxDay=Math.max(ARCH.maxDay||0,S.days||0);archSave();
 if(id==='END_BAD'){const d=document.querySelector('[data-days]');if(d)d.textContent=S.days;} save();hud();}
document.addEventListener('click',e=>{const a=e.target.closest('a[data-goto]');if(!a)return;if(a.id==='start'){S.name=(document.getElementById('f-name').value.trim()||'大壮').slice(0,12);S.nick=(document.getElementById('f-nick').value.trim()||S.name).slice(0,12);S.call=document.getElementById('f-call').value;S.ta=(document.querySelector('.g-opt.sel')||{dataset:{v:''}}).dataset.v;if(!S.ta)return;S.boss=(document.getElementById('f-boss').value.trim()||S.name).slice(0,12);S.started=true;S.cur='d01-1';save();try{localStorage.setItem('nt_id',JSON.stringify({name:S.name,nick:S.nick,call:S.call,boss:S.boss,ta:S.ta}));}catch(x){}}const li=a.closest('li');const ef=li&&li.dataset.effects?JSON.parse(li.dataset.effects):{};pending={san:S.san,flags:S.flags.slice(),day:S.day,days:S.days,dream:[],lost:[]};try{sfxClick();}catch(e){}if(ef.item_dream){S.dream[ef.item_dream]=S.day;pending.dream.push(ef.item_dream);}if(ef.item_lost){S.lost.push(ef.item_lost);pending.lost.push(ef.item_lost);}
 if(ef.san)S.san=Math.max(0,Math.min(100,S.san+Math.round(ef.san*2.5)));(ef.set||[]).forEach(f=>{if(!S.flags.includes(f))S.flags.push(f)});(ef.unset||[]).forEach(f=>{S.flags=S.flags.filter(x=>x!==f)});
 setTimeout(()=>enter(a.dataset.goto),0);});
const gateCheck=()=>{const ok=['f-name','f-nick','f-call','f-boss'].every(i=>document.getElementById(i).value.trim())&&!!document.querySelector('.g-opt.sel');document.getElementById('gate').classList.toggle('ready',ok);};
['f-name','f-nick','f-call','f-boss'].forEach(i=>document.getElementById(i).addEventListener('input',gateCheck));
document.querySelectorAll('.g-opt').forEach(o=>o.onclick=()=>{document.querySelectorAll('.g-opt').forEach(x=>x.classList.remove('sel'));o.classList.add('sel');gateCheck();});
setTimeout(gateCheck,1400);
(()=>{const kimg=document.getElementById('g-kuro');const im=new Image();im.onload=()=>{try{const c=document.createElement('canvas');c.width=im.width;c.height=im.height;const x=c.getContext('2d');x.drawImage(im,0,0);const d=x.getImageData(0,0,c.width,c.height);const a=d.data;for(let i=0;i<a.length;i+=4){const l=(a[i]+a[i+1]+a[i+2])/3;a[i+3]=Math.max(0,Math.min(255,(255-l)*1.15));a[i]=42;a[i+1]=42;a[i+2]=40;}x.putImageData(d,0,0);kimg.src=c.toDataURL();}catch(e){}};im.src=kimg.src;})();
document.getElementById('reset').onclick=()=>{ARCH.runs=(ARCH.runs||0)+1;archSave();store.del();location.hash='';location.reload();};
document.getElementById('exp').onclick=()=>{const code=btoa(unescape(encodeURIComponent(JSON.stringify(S))));prompt('这是你的存档码。复制保存，换设备或清了浏览器以后用“读档”贴回来：',code);};
document.getElementById('imp').onclick=()=>{const code=prompt('把存档码贴在这里：');if(!code)return;try{const o=JSON.parse(decodeURIComponent(escape(atob(code.trim()))));if(!o||typeof o.san!=='number')throw 0;store.set(JSON.stringify(o));location.hash='';location.reload();}catch(e){alert('存档码不对。');}};
hud();

/* ===== 声音：全部现场合成，不用音频文件 ===== */
const SND={on:false,ctx:null,rain:null,rainG:null,hum:null,humG:null,level:0};
try{SND.on=localStorage.getItem('nt_snd')==='1'}catch(e){}
function actx(){if(!SND.ctx){const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return null;SND.ctx=new AC();}if(SND.ctx.state==='suspended')SND.ctx.resume();return SND.ctx;}
function noiseBuf(c,sec){const b=c.createBuffer(1,Math.floor(c.sampleRate*sec),c.sampleRate);const d=b.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;return b;}
function sfxClick(){if(!SND.on)return;const c=actx();if(!c)return;const t=c.currentTime;const o=c.createOscillator(),g=c.createGain();o.type='square';o.frequency.value=1500;g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.06,t+.004);g.gain.exponentialRampToValueAtTime(.0001,t+.045);o.connect(g).connect(c.destination);o.start(t);o.stop(t+.05);}
function sfxPage(){if(!SND.on)return;const c=actx();if(!c)return;const t=c.currentTime;const sn=c.createBufferSource();sn.buffer=noiseBuf(c,.6);const f=c.createBiquadFilter();f.type='bandpass';f.Q.value=.7;f.frequency.setValueAtTime(700,t);f.frequency.exponentialRampToValueAtTime(2600,t+.22);f.frequency.exponentialRampToValueAtTime(500,t+.5);const g=c.createGain();g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.22,t+.09);g.gain.exponentialRampToValueAtTime(.0001,t+.52);sn.connect(f).connect(g).connect(c.destination);sn.start(t);}
function sfxBeep(){if(!SND.on)return;const c=actx();if(!c)return;let t=c.currentTime+.05;[[2093,.07],[2637,.07],[3136,.11]].forEach(([fr,d])=>{const o=c.createOscillator(),g=c.createGain();o.type='square';o.frequency.value=fr*0.985;g.gain.setValueAtTime(.05,t);g.gain.setValueAtTime(.0001,t+d-.01);o.connect(g).connect(c.destination);o.start(t);o.stop(t+d);t+=d+.02;});}
function sfxBuzz(){if(!SND.on)return;const c=actx();if(!c)return;let t=c.currentTime+.1;for(let k=0;k<2;k++){const o=c.createOscillator(),g=c.createGain(),f=c.createBiquadFilter();o.type='square';o.frequency.value=84;f.type='lowpass';f.frequency.value=400;g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.18,t+.02);g.gain.exponentialRampToValueAtTime(.0001,t+.22);o.connect(f).connect(g).connect(c.destination);o.start(t);o.stop(t+.24);t+=.34;}}
function rainSet(level){SND.level=level;if(!SND.on)return;const c=actx();if(!c)return;if(!SND.rain){const sn=c.createBufferSource();sn.buffer=noiseBuf(c,4);sn.loop=true;const f=c.createBiquadFilter();f.type='lowpass';f.frequency.value=1400;const f2=c.createBiquadFilter();f2.type='highpass';f2.frequency.value=300;const g=c.createGain();g.gain.value=0;sn.connect(f).connect(f2).connect(g).connect(c.destination);sn.start();SND.rain=sn;SND.rainG=g;}SND.rainG.gain.setTargetAtTime(level*0.028,c.currentTime,1.2);}
function humSet(on){if(!SND.on)return;const c=actx();if(!c)return;if(!SND.hum){const o=c.createOscillator();o.type='sine';o.frequency.value=47;const l=c.createOscillator();l.type='sine';l.frequency.value=0.35;const lg=c.createGain();lg.gain.value=.5;const g=c.createGain();g.gain.value=0;l.connect(lg).connect(g.gain);o.connect(g).connect(c.destination);o.start();l.start();SND.hum=o;SND.humG=g;}SND.humG.gain.setTargetAtTime(on?.16:0,c.currentTime,on?2.5:1);}
function sndApply(){const b=document.getElementById('snd');if(b)b.textContent='声音：'+(SND.on?'开':'关');if(SND.on){actx();rainSet(SND.level);}else{if(SND.rainG)SND.rainG.gain.setTargetAtTime(0,SND.ctx.currentTime,.3);if(SND.humG)SND.humG.gain.setTargetAtTime(0,SND.ctx.currentTime,.3);}}
document.getElementById('snd').onclick=()=>{SND.on=!SND.on;try{localStorage.setItem('nt_snd',SND.on?'1':'0')}catch(e){}sndApply();if(SND.on){sfxClick();const cur=document.querySelector('.gb.cur');if(cur)sceneSound(cur);}};
function sceneSound(sec){const day=+sec.dataset.day||S.day;const t=sec.textContent;const rainL=day<=3?3:day<=6?2:day<=12?1:0;rainSet(rainL);const night=/伸出(来)?一只|一只手从缝里|没有手指的手|手指多得数不清|一只正经的手/.test(t);humSet(night);if(/寻呼机震了|寻呼机在桌上震|桌面震了一下/.test(t))setTimeout(sfxBuzz,900);}

document.getElementById('scene-toggle').onclick=()=>document.body.classList.toggle('scene');sndApply();renderFront();
try{if(!S.started){const idv=JSON.parse(localStorage.getItem('nt_id')||'null');if(idv){Object.assign(S,idv);['name','nick','call','boss'].forEach(k=>{const el=document.getElementById('f-'+k);if(el&&S[k])el.value=S[k];});if(S.ta){document.querySelectorAll('.g-opt').forEach(o=>o.classList.toggle('sel',o.dataset.v===S.ta));}}}}catch(e){}
try{const pk=localStorage.getItem('nt_pending');if(pk&&!S.started)awardFlow(pk);}catch(e){}
let eyeStare=false,eyeLast={x:0,y:0};document.addEventListener('mousemove',e=>{eyeLast={x:e.clientX,y:e.clientY};if(eyeStare)return;eyeTo(e.clientX,e.clientY);});function eyeTo(x,y){const w=document.querySelector('.eyewrap');if(!w||document.body.classList.contains('reading'))return;const r=w.getBoundingClientRect();if(!r.width)return;const cx=r.left+r.width/2,cy=r.top+r.height/2;let dx=x-cx,dy=y-cy;const d=Math.hypot(dx,dy)||1;const m=Math.min(d,r.width*.045);dx=dx/d*m;dy=dy/d*m;w.querySelector('.pupil').style.transform='translate(calc(-50% + '+dx.toFixed(1)+'px),calc(-50% + '+dy.toFixed(1)+'px))';}setInterval(()=>{const w=document.querySelector('.eyewrap');if(!w)return;eyeStare=true;w.querySelector('.pupil').style.transform='translate(-50%,-50%)';setTimeout(()=>{eyeStare=false;eyeTo(eyeLast.x,eyeLast.y);},2200);},7000+Math.random()*3000);
const VOW=[[730,1090],[530,1840],[270,2290],[570,840],[300,870]];
function playVoice(v){if(v.classList.contains('dead')||v.classList.contains('playing'))return;const c=actx();if(!c)return;const stage=+STAGE(+v.dataset.day||1)[0];const text=(v.dataset.text||'嗯').slice(0,42);const base=[300,260,210,160,120,90][stage],dur=[.07,.085,.11,.15,.2,.26][stage],gap=[.015,.02,.03,.05,.08,.12][stage],hiss=[0,0,.03,.12,.35,1][stage];
 let t=c.currentTime+.05;const master=c.createGain();master.gain.value=.5;master.connect(c.destination);let seed=0;for(const ch of text)seed=(seed*31+ch.charCodeAt(0))&0xffff;const rnd=()=>{seed=(seed*1103515245+12345)&0x7fffffff;return seed/0x7fffffff;};
 for(const ch of text){const code=ch.charCodeAt(0);if(/[，。、 ,.!?！？\\n…]/.test(ch)){t+=gap*4;continue;}
  if(hiss<1){const o=c.createOscillator();o.type='sawtooth';const f=base*(1+(rnd()-.5)*.24)*(1+((code%7)-3)*.03);o.frequency.setValueAtTime(f,t);o.frequency.linearRampToValueAtTime(f*(1+(rnd()-.5)*.08),t+dur);const vw=VOW[code%5];const f1=c.createBiquadFilter();f1.type='bandpass';f1.frequency.value=vw[0];f1.Q.value=6;const f2=c.createBiquadFilter();f2.type='bandpass';f2.frequency.value=vw[1];f2.Q.value=8;const g=c.createGain();g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.9*(1-hiss),t+.012);g.gain.exponentialRampToValueAtTime(.0001,t+dur);o.connect(f1);o.connect(f2);f1.connect(g);f2.connect(g);g.connect(master);o.start(t);o.stop(t+dur+.01);}
  if(hiss>0){const n=c.createBufferSource();n.buffer=noiseBuf(c,dur);const lp=c.createBiquadFilter();lp.type='lowpass';lp.frequency.value=1800;const g=c.createGain();g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.35*hiss,t+.01);g.gain.exponentialRampToValueAtTime(.0001,t+dur);n.connect(lp).connect(g).connect(master);n.start(t);}
  t+=dur+gap;}
 v.classList.add('playing');setTimeout(()=>v.classList.remove('playing'),(t-c.currentTime)*1000+100);}
document.addEventListener('click',e=>{const v=e.target.closest('.vbar');if(v){e.preventDefault();e.stopPropagation();playVoice(v);}},true);document.getElementById('left').appendChild(document.getElementById('hud'));
{const q=new URLSearchParams(location.search).get('at');if(q&&document.querySelector('[data-id="'+q+'"]')){S.started=true;const m=q.match(/^d(\\d\\d)/);if(m){S.day=+m[1];S.days=Math.max(S.days,S.day);}S.cur=q;save();identity();hud();}}
if(S.started){const c=document.querySelector('[data-id="'+(S.cur||'d01-1')+'"]');if(c){show(c);save();}}
if(new URLSearchParams(location.search).get('zoom')){try{zoomDesk();document.getElementById('hint').classList.remove('on');}catch(e){}}
if(new URLSearchParams(location.search).get('shot')){document.body.classList.add('noanim');document.getElementById('hint').classList.remove('on');try{goView(zoomed?1:view);}catch(e){}}
if(new URLSearchParams(location.search).get('open')){document.body.classList.add('opened');renderFront();}
{const sv=new URLSearchParams(location.search).get('san');if(sv){S.san=+sv;hud();}}
if(new URLSearchParams(location.search).get('nohint')){document.getElementById('hint').classList.remove('on');}
</script>
</body></html>`;
fs.writeFileSync(path.join(root, 'gamebook.html'), html);
console.log('gamebook assembled', num, 'sections,', days.length, 'days');
