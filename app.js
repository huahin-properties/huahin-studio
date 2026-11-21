// ===== Huahin Studio — แอปหลัก =====
const SIZES = [
  { id: '4:5',  name: 'Facebook 4:5',  note: '1080×1350 (หลัก)', w: 1080, h: 1350 },
  { id: '9:16', name: 'แนวตั้ง 9:16',   note: '1080×1920',        w: 1080, h: 1920 },
  { id: '1:1',  name: 'จัตุรัส 1:1',     note: '1080×1080',        w: 1080, h: 1080 },
  { id: '16:9', name: 'แนวนอน 16:9',    note: '1920×1080',        w: 1920, h: 1080 },
];
// ลำดับห้องตามการเล่าเรื่อง: ภายนอก -> ในบ้าน -> สระ/สวน (ระบบเรียงรูปตามลำดับนี้เอง)
const ROOMS = [AREA_ROOM, MAP_ROOM, 'หน้าบ้าน/ภายนอก','ที่จอดรถ','ห้องนั่งเล่น','ห้องทานอาหาร','ครัว','ห้องนอนใหญ่','ห้องนอน','ห้องน้ำ','สระว่ายน้ำ','สวน/ระเบียง','วิวรอบๆ','อื่นๆ'];
const STEPS = ['1 ขนาด','2 ใส่รูป/คลิป','3 สี','4 สคริปต์','5 เสียง','6 มาสคอต','7 เรนเดอร์'];

const state = { targetSec: 150, routeData: null, skipMap: false, facts: { name: '', beds: '', baths: '', usable: '', land: '', price: '', travel: '', coord: '', routeStart: '', routeLabel: '', highlights: '' }, slot: 'title', step: 0, size: '4:5', items: [], color: { ...COLOR_DEFAULT }, useArea: true, contact: { mode: 'std', custom: { name: '', phone: '', line: '' } }, script: { area: '', rooms: {}, en: {}, enSrc: {} } };
let nextId = 1;

// ---- เก็บงานไว้ในเครื่อง (IndexedDB) ปิดแอปแล้วงานไม่หาย ----
const DB = {
  open() { return new Promise((res, rej) => {
    const r = indexedDB.open('huahin-studio', 1);
    r.onupgradeneeded = () => r.result.createObjectStore('kv');
    r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
  }); },
  async get(k) { const db = await this.open(); return new Promise(res => { const q = db.transaction('kv').objectStore('kv').get(k); q.onsuccess = () => res(q.result); }); },
  async set(k, v) { const db = await this.open(); return new Promise(res => { const tx = db.transaction('kv', 'readwrite'); tx.objectStore('kv').put(v, k); tx.oncomplete = res; }); },
};
const save = () => (typeof updateSb === 'function' && updateSb(), DB.set('project', { v: 2, targetSec: state.targetSec, routeData: state.routeData, skipMap: state.skipMap, facts: state.facts, useArea: state.useArea, contact: state.contact, size: state.size, color: state.color, script: state.script, items: state.items.map(({ id, blob, type, room, name }) => ({ id, blob, type, room, name })) }));
async function load() {
  await loadLib(); const p = await DB.get('project');
  if (p) { if (!p.v) p.items.forEach(i => { if (i.room === 'หน้าบ้าน/ภายนอก') i.room = ''; }); state.size = p.size; state.color = { ...COLOR_DEFAULT, ...(p.color || {}) }; state.script = { area: '', rooms: {}, en: {}, enSrc: {}, ...(p.script || {}) }; state.skipMap = !!p.skipMap; state.targetSec = p.targetSec || 150; state.routeData = p.routeData || null; state.facts = { ...state.facts, ...(p.facts || {}) }; state.useArea = true; state.contact = { mode: 'std', ...(p.contact || {}), custom: { name: '', phone: '', line: '', ...((p.contact || {}).custom || {}) } }; state.items = p.items; nextId = Math.max(0, ...p.items.map(i => i.id)) + 1; }
}

const $ = s => document.querySelector(s);
async function addFiles(files) {
  for (const f of files) {
    const type = f.type.startsWith('video') ? 'video' : 'image';
    state.items.push({ id: nextId++, blob: f, type, room: '', name: f.name });
  }
  await save();
}
// เรียงรูป: ยังไม่ตั้งห้องอยู่บนสุด -> ตั้งห้องแล้วเรียงตามลำดับเล่าเรื่อง (ในห้องเดียวกันคงลำดับเดิม)
function organizeItems() {
  const rank = r => (r ? (ROOMS.indexOf(r) >= 0 ? ROOMS.indexOf(r) : 99) : -1);
  state.items = state.items.map((it, i) => [it, i]).sort((a, b) => rank(a[0].room) - rank(b[0].room) || a[1] - b[1]).map(x => x[0]);
}
let selMode = false; const picked = new Set();
let selExtra = '', selPre = '';
// หน้าต่างเลือกห้อง (ใช้ตั้งห้องให้รูปที่ติ๊กไว้ทีละหลายรูป)
function chooseRoom(n) {
  return new Promise(res => {
    const d = document.createElement('div'); d.className = 'sheet';
    d.innerHTML = `<div class="sh-head"><b>🏷️ ตั้งห้องให้ ${n} รูปที่เลือก</b><button class="ib" data-r="" aria-label="ปิด">✕</button></div><div class="rooms">${ROOMS.map(r => `<button class="btn alt" data-r="${r}">${r}</button>`).join('')}</div>`;
    d.onclick = e => { const b = e.target.closest('button'); if (!b) return; d.remove(); res(b.dataset.r || null); };
    document.body.appendChild(d);
  });
}
function selBarHtml() {
  return selMode
    ? `<button class="ib wide" data-sa="all">ทั้งหมด</button><button class="ib wide" data-sa="off">ยกเลิก</button><button class="ib wide" data-sa="room" ${picked.size ? '' : 'disabled'}>🏷️ ห้อง</button><button class="ib wide danger" data-sa="del" ${picked.size ? '' : 'disabled'}>🗑️ ลบ (${picked.size})</button>`
    : `${selPre}<button class="ib" data-sa="on" title="เลือกหลายรูปเพื่อลบ" aria-label="เลือกหลายรูปเพื่อลบ">☑</button>${selExtra}`;
}
function bindSelBar(bar, allIds, refresh, opt = {}) {
  bar.innerHTML = selBarHtml();
  bar.onclick = async e => {
    const b = e.target.closest('button'); if (!b || b.disabled) return; const a = b.dataset.sa;
    if (a === 'one') { await opt.delOne(); return; }
    if (a === 'add') { opt.add(); return; }
    if (a === 'tune') { opt.tune(); return; }
    if (a === 'reset') { opt.reset(); return; }
    if (a === 'on') { selMode = true; picked.clear(); }
    else if (a === 'off') { selMode = false; picked.clear(); }
    else if (a === 'all') allIds().forEach(id => picked.add(id));
    else if (a === 'room') {
      const r = await chooseRoom(picked.size); if (!r) return;
      state.items.forEach(it => { if (picked.has(it.id)) it.room = r; });
      picked.clear(); selMode = false; await save(); refresh(true); return;
    }
    else if (a === 'del') {
      if (!picked.size || !confirm(`ลบ ${picked.size} รูปที่เลือกใช่ไหม?`)) return;
      [...picked].forEach(removeItem); picked.clear(); selMode = false; await save(); refresh(true); return;
    }
    bar.innerHTML = selBarHtml(); refresh(false);
  };
}
function removeItem(id) {
  picked.delete(id);
  const i = state.items.findIndex(x => x.id === id); if (i < 0) return;
  if (urlCache.has(id)) { URL.revokeObjectURL(urlCache.get(id)); urlCache.delete(id); }
  if (typeof smallCache !== 'undefined') { smallCache.get(id)?.close?.(); smallCache.delete(id); statCache.delete(id); }
  state.items.splice(i, 1);
}
const sizeInfo = () => SIZES.find(s => s.id === state.size);
const urlCache = new Map();
const urlOf = it => { if (!urlCache.has(it.id)) urlCache.set(it.id, URL.createObjectURL(it.blob)); return urlCache.get(it.id); };
let previewTimer = null;

function renderSteps() {
  updateSb(); if (!$('#sb').onclick) $('#sb').onclick = openSb;
  $('#steps').innerHTML = STEPS.map((s, i) => `<button data-i="${i}" class="${i === state.step ? 'on' : ''}" >${s}</button>`).join('');
  const on = $('#steps .on'); if (on) on.scrollIntoView({ inline: 'center', block: 'nearest' });
  $('#steps').onclick = e => { const b = e.target.closest('button'); if (b && !b.disabled) { state.step = +b.dataset.i; render(); } };
}

function viewSize() {
  const box = s => { const k = 40 / Math.max(s.w, s.h); return `width:${s.w * k}px;height:${s.h * k}px`; };
  $('#view').innerHTML = `
    <h2>เลือกขนาดคลิป</h2><p class="hint">แนะนำ Facebook 4:5 เพราะแสดงใหญ่สุดบนมือถือ</p>
    <div class="sizes">${SIZES.map(s => `<button class="size ${s.id === state.size ? 'on' : ''}" data-id="${s.id}"><i style="${box(s)}"></i><b>${s.name}</b><span>${s.note}</span></button>`).join('')}</div>
    <button class="btn" id="next">ถัดไป: ใส่รูปบ้าน →</button>`;
  $('.sizes').onclick = e => { const b = e.target.closest('.size'); if (b) { state.size = b.dataset.id; save(); viewSize(); } };
  $('#next').onclick = () => go(1);
}

// ---- ร่างสคริปต์อัตโนมัติ: ใช้ข้อความประจำห้อง + ข้อมูลบ้านที่กรอก (เติมเฉพาะท่อนที่ยังว่าง ไม่ทับของเดิม) ----
// คลังประโยคประจำช่วง (ใช้ข้อมูลบ้านที่กรอก ไม่แต่งข้อมูลที่ไม่มี) · เรียงตามลำดับการเล่า
function bankFor(id) {
  const f = state.facts, n = v => String(v || '').trim();
  const num = v => /^[\d.,]+$/.test(n(v));
  const area = v => (num(v) ? `${n(v)} ตารางเมตร` : n(v)), wah = v => (num(v) ? `${n(v)} ตารางวา` : n(v));
  const price = v => { if (!num(v)) return n(v); const x = Number(n(v).replace(/,/g, '')); return x < 1000 ? `${n(v)} ล้านบาท` : `${x.toLocaleString('th-TH')} บาท`; };
  const intro = n(f.name) ? `บ้านหลังนี้อยู่ใน ${n(f.name)}` : 'บ้านหลังนี้';
  const bits = [n(f.beds) && `${n(f.beds)} ห้องนอน`, n(f.baths) && `${n(f.baths)} ห้องน้ำ`, n(f.usable) && `พื้นที่ใช้สอย ${area(f.usable)}`, n(f.land) && `บนที่ดิน ${wah(f.land)}`].filter(Boolean);
  const B = {
    'cat': ['หัวหินคือเมืองริมทะเลที่ใครๆ ก็รัก ทั้งความสงบ ความสะดวก และบรรยากาศที่ผ่อนคลาย',
      'ชายหาดทรายทอดยาว เหมาะกับการเดินเล่นยามเช้า และชมพระอาทิตย์ตกยามเย็น',
      'ตลาดและร้านอาหารหลากหลาย ตั้งแต่อาหารทะเลสดๆ ไปจนถึงร้านคาเฟ่น่านั่ง',
      'ชีวิตประจำวันสะดวกสบาย มีทั้งห้างสรรพสินค้า โรงพยาบาล และสถานที่ท่องเที่ยวให้เลือกมากมาย',
      'ธรรมชาติรอบเมืองก็สวยงาม ทั้งภูเขา น้ำตก และทุ่งกว้าง ให้ได้พักใจอยู่ใกล้ๆ',
      'จากกรุงเทพฯ เดินทางมาไม่ไกล จึงเหมาะทั้งเป็นบ้านพักผ่อนสุดสัปดาห์ และบ้านอยู่อาศัยจริง',
      'นี่คือเหตุผลที่หัวหินเป็นเมืองที่น่าอยู่ และน่าลงทุนตลอดทั้งปี'],
    'map': [mapScriptText(), 'ทำเลเข้าถึงสะดวก เส้นทางเข้าโครงการชัดเจน', 'ไม่ว่าจะมาจากกรุงเทพฯ หรือจากตัวเมืองหัวหิน ก็มาถึงได้ไม่ยาก', 'ใกล้ความเจริญ แต่ยังคงความเงียบสงบเป็นส่วนตัว'],
    'ext': [`${intro} หน้าบ้านกว้างขวาง ดูโปร่งสบาย${bits.length ? ' ' + bits.join(' ') : ''}`,
      'เมื่อมาถึง คุณจะสัมผัสได้ถึงความเป็นส่วนตัวตั้งแต่หน้าบ้าน',
      'ดีไซน์ภายนอกทันสมัย ดูอบอุ่นและโปร่งสบาย',
      'พื้นที่หน้าบ้านกว้างขวาง ต้อนรับทั้งครอบครัวและแขกที่มาเยือน',
      n(f.highlights) ? `จุดเด่นของบ้านหลังนี้ คือ ${n(f.highlights)}` : '',
      'บ้านที่ออกแบบมาเพื่อการอยู่อาศัยจริง ทั้งสวยงามและใช้งานได้สะดวก',
      n(f.price) ? `ราคาเพียง ${price(f.price)}` : ''],
    'park': ['ที่จอดรถสะดวก จอดได้สบาย', 'เข้าออกง่าย ไม่ต้องกังวลเรื่องที่จอดรถทั้งของครอบครัวและแขก', 'อยู่ในรั้วบ้านของคุณเอง อุ่นใจในทุกวัน'],
    'liv': ['ก้าวเข้ามาในบ้าน จะพบกับห้องนั่งเล่นโปร่งโล่ง', 'แสงธรรมชาติส่องถึง ทำให้บรรยากาศอบอุ่นและน่าอยู่', 'เป็นพื้นที่ที่คุณจะได้ใช้เวลากับครอบครัว ดูหนัง พูดคุย และพักผ่อนหลังวันที่เหนื่อยล้า', 'วางเฟอร์นิเจอร์ได้ตามสไตล์ที่คุณชอบ เพื่อให้เป็นมุมโปรดของทุกคน'],
    'dine': ['ใกล้กันคือพื้นที่ทานอาหาร กว้างขวาง', 'ทานข้าวด้วยกันได้ทั้งครอบครัว หรือเลี้ยงรับรองแขกได้สบายๆ', 'บรรยากาศเปิดโล่ง เชื่อมต่อกับพื้นที่ใช้สอยอื่นๆ ได้อย่างลงตัว'],
    'kit': ['ห้องครัวทันสมัย พื้นที่ใช้งานกว้างขวาง', 'เคาน์เตอร์และพื้นที่เตรียมอาหารเพียงพอ ทำอาหารได้สะดวกทุกมื้อ', 'วางเครื่องใช้ไฟฟ้าได้ครบ ไม่อึดอัด', 'เป็นมุมโปรดของคนรักการทำอาหาร และเป็นศูนย์กลางของครอบครัว'],
    'bed': ['มาถึงห้องนอน พื้นที่เงียบสงบ เหมาะกับการพักผ่อนอย่างแท้จริง', n(f.beds) ? `บ้านหลังนี้มี ${n(f.beds)} ห้องนอน เหมาะกับครอบครัวและแขกที่มาพัก` : '', 'แสงสว่างเพียงพอ ระบายอากาศดี หลับสบายทุกคืน', 'จัดวางเตียงและเฟอร์นิเจอร์ได้ตามต้องการ'],
    'bath': ['ห้องน้ำสะอาด ทันสมัย', n(f.baths) ? `มีทั้งหมด ${n(f.baths)} ห้องน้ำ สะดวกสำหรับทุกคนในบ้าน` : '', 'พื้นที่ใช้งานสะดวกสบาย เหมาะกับทุกคนในครอบครัว'],
    'pool': ['และไฮไลต์ของบ้านหลังนี้ คือสระว่ายน้ำส่วนตัว', 'ผ่อนคลายได้ทุกวัน ไม่ต้องไปไหนไกล', 'เหมาะกับการว่ายน้ำออกกำลังกายตอนเช้า หรือนั่งริมสระรับลมยามเย็น', 'เด็กๆ เล่นน้ำได้อย่างสนุก เป็นความสุขของทั้งครอบครัว'],
    'garden': ['พื้นที่สวนและระเบียงสำหรับนั่งพักผ่อน รับลมสบายๆ', 'จิบกาแฟยามเช้า หรือจัดปาร์ตี้เล็กๆ กับคนที่คุณรัก', 'เติมความเขียวขจีให้บ้าน และช่วยให้ใจสงบ'],
    'life': ['ใช้ชีวิตแบบที่คุณชอบ อยู่กับครอบครัว ออกกำลังกายตอนเช้า ไปตลาดใกล้บ้าน ทุกวันสะดวกสบาย', 'เช้าๆ ตื่นมาออกกำลังกาย รับอากาศดีๆ', 'บ่ายๆ พาครอบครัวไปทะเล', 'เย็นๆ ซื้อของสดจากตลาด กลับมาทำอาหารทานด้วยกันที่บ้าน', 'นี่คือชีวิตที่หัวหินมอบให้ และบ้านหลังนี้ คือจุดเริ่มต้น'],
  };
  const key = id === 'cat-lifestyle' ? 'life' : id.startsWith('cat-') ? 'cat' : id;
  return (B[key] || []).filter(Boolean);
}
const SEG_WEIGHT = { 'cat-city': 14, map: 7, ext: 12, park: 3, liv: 9, dine: 4, kit: 10, bed: 10, bath: 5, pool: 9, garden: 4, 'cat-lifestyle': 9 };
function segSlot(g) {
  if (g.key === 'life') return SLOTS.find(x => x.cat === 'lifestyle');
  if (g.key === 'area') return SLOTS.find(x => x.cat === 'city');
  return SLOTS.find(x => x.kind === 'room' && x.rooms.includes(g.room));
}
// เวลาเป้าหมาย (วินาที) ของแต่ละท่อน แบ่งตามน้ำหนักของช่วง
function segTargets() {
  const segs = scriptSegments(), w = g => (SEG_WEIGHT[(segSlot(g) || {}).id] || 6), sum = segs.reduce((a, g) => a + w(g), 0) || 1;
  const m = {}; segs.forEach(g => { m[g.key] = Math.round(state.targetSec * w(g) / sum); }); return m;
}
// เติมประโยคจากคลังให้ถึงเป้า (ไม่ลบ/ทับข้อความที่มีอยู่)
function expandAll() {
  const T = segTargets(); let changed = 0;
  scriptSegments().forEach(g => {
    const sl = segSlot(g); if (!sl) return;
    let cur = (g.text || '').trim(), added = 0;
    for (const sent of bankFor(sl.id)) {
      if (secOf(cur) >= T[g.key]) break;
      if (cur.includes(sent.slice(0, 20))) continue;
      cur = cur ? cur + ' ' + sent : sent; added++;
    }
    if (added) { setSlotScript(sl, cur); changed++; }
  });
  return changed;
}
const draftAll = expandAll;
const totalSecNow = () => scriptSegments().reduce((a, g) => a + secOf(g.text), 0);
function expandMsg(n) {
  const tot = totalSecNow(), tgt = state.targetSec, short = tot < tgt * 0.9;
  return (n ? `เติมสคริปต์ให้ ${n} ช่วง · รวมตอนนี้ ~${mmss(tot)} จากเป้า ${mmss(tgt)}` : `ไม่มีช่วงที่เติมได้เพิ่ม · รวมตอนนี้ ~${mmss(tot)} จากเป้า ${mmss(tgt)}`)
    + (short ? '\n\nยังไม่ถึงเป้า วิธีเพิ่มเนื้อหา: (1) ใส่รูปห้องเพิ่มและกรอก 🏠 ข้อมูลบ้านให้ครบ (2) เขียนเพิ่มเอง (3) กด 🤖 คัดลอกคำสั่งให้ AI ใน Google AI Studio เขียนให้ยาวและละเอียดขึ้น แล้วกด 📥 วางสคริปต์จาก AI' : '');
}
// คำสั่งสำหรับ AI (Google AI Studio) เขียนสคริปต์ยาวตามเป้า
function buildAiPrompt() {
  const f = state.facts, T = segTargets(), lines = [];
  [['ชื่อโครงการ', f.name], ['ห้องนอน', f.beds], ['ห้องน้ำ', f.baths], ['พื้นที่ใช้สอย (ตร.ม.)', f.usable], ['ที่ดิน (ตร.ว.)', f.land], ['ราคา (ล้านบาท)', f.price], ['จุดเด่น', f.highlights]].forEach(([k, v]) => { if (String(v || '').trim()) lines.push(`- ${k}: ${v}`); });
  const near = typeof mapScriptText === 'function' ? mapScriptText(4) : ''; if (near) lines.push('- ระยะทาง (ประมาณการ): ' + near);
  const segs = scriptSegments().map((g, i) => `[${String(g.no).padStart(2, '0')}] ${g.label} · เป้าหมาย ${T[g.key]} วินาที (ประมาณ ${T[g.key] * SPEAK_CPS} ตัวอักษร)${g.text.trim() ? ' · ร่างเดิม: ' + g.text.trim() : ''}`);
  return `คุณคือผู้เขียนสคริปต์พากย์คลิปแนะนำบ้านพักตากอากาศระดับพรีเมียมที่หัวหิน สไตล์ luxury editorial อบอุ่น เป็นกันเอง เล่าเหมือนพาเดินชมบ้านจริง ใช้ภาษาไทยที่พูดแล้วลื่นไหลและน่าฟัง

ข้อมูลบ้าน (ใช้เฉพาะข้อมูลนี้ ห้ามแต่งตัวเลข ราคา หรือสิ่งอำนวยความสะดวกที่ไม่ได้ให้ไว้):
${lines.join('\n') || '- (ไม่มีข้อมูลเพิ่มเติม)'}

ให้เขียนสคริปต์พากย์ทีละท่อนตามรายการนี้ ความยาวรวมประมาณ ${state.targetSec} วินาที โดยแต่ละท่อนให้ยาวตามเป้าหมายที่ระบุ:
${segs.join('\n')}

กติกาการตอบ:
- ตอบเป็นภาษาไทย แต่ละท่อนขึ้นต้นด้วยเลขท่อนในวงเล็บเหลี่ยม เช่น [01] แล้วขึ้นบรรทัดใหม่ตามด้วยข้อความ เว้นบรรทัดระหว่างท่อน
- ห้ามใส่หัวข้อ เครื่องหมาย markdown หรือคำอธิบายอื่นนอกจากเลขท่อนและข้อความพากย์
- ไม่ต้องกล่าวสวัสดีหรือปิดท้าย เพราะมีคลิปไตเติลและเครดิตปิดแยกอยู่แล้ว`;
}
// วางสคริปต์จาก AI: แยกตาม [01] [02] ... แล้วใส่เข้าท่อนที่ตรงกัน
function applyAiScript(text) {
  const parts = [...text.matchAll(/\[(\d{1,2})\]\s*([\s\S]*?)(?=\n\s*\[\d{1,2}\]|$)/g)]; let n = 0;
  const segs = scriptSegments();
  parts.forEach(m => { const g = segs.find(x => x.no === +m[1]); const t = m[2].trim(); const sl = g && segSlot(g); if (g && sl && t) { setSlotScript(sl, t); n++; } });
  return n;
}

function openFacts(after) {
  document.querySelector('#factsSheet')?.remove();
  const f = state.facts, d = document.createElement('div'); d.className = 'sheet tall'; d.id = 'factsSheet';
  const F = [['name', 'ชื่อโครงการ / ชื่อบ้าน', 'เช่น Coco Hua Hin Luxury 88', ''], ['beds', 'จำนวนห้องนอน (ห้อง)', 'เช่น 3', 'tel'], ['baths', 'จำนวนห้องน้ำ (ห้อง)', 'เช่น 3', 'tel'], ['usable', 'พื้นที่ใช้สอย (ตารางเมตร)', 'เช่น 159', ''], ['land', 'ขนาดที่ดิน (ตารางวา)', 'เช่น 80', ''], ['price', 'ราคา (ล้านบาท)', 'เช่น 4.5', ''], ['coord', 'พิกัดบ้าน (วางจาก Google Maps)', 'เช่น 12.558940,99.909039', ''], ['routeStart', 'จุดเริ่มต้นรถวิ่ง: พิกัดปากซอย/ถนนเพชรเกษม', 'เช่น 12.5400,99.9500', ''], ['routeLabel', 'ชื่อจุดเริ่มต้นที่แสดงบนแผนที่', 'เช่น ถนนเพชรเกษม', ''], ['highlights', 'จุดเด่น 2–3 ข้อ', 'เช่น สระส่วนตัว ใกล้ตลาด', '']];
  d.innerHTML = `<div class="sh-head"><b>🏠 ข้อมูลบ้าน</b><button class="ib" data-a="x" aria-label="ปิด">✕</button></div>
    <p class="hint">กรอกเท่าที่มี ไม่กรอกช่องไหนก็ได้ แอปจะใช้ร่างสคริปต์ให้ (ข้อมูลนี้อยู่ในเครื่องคุณเท่านั้น)</p>
    ${F.map(([k, lab, ph, t]) => `<label class="fl"><span>${lab}</span><input class="ct" data-k="${k}" ${t ? `type="${t}" ` : ''}placeholder="${ph}" value="${String(f[k] || '').replace(/"/g, '&quot;')}"></label>`).join('')}
    <div class="hint" id="distPrev"></div>
    <button class="btn alt" data-a="places">📍 ตั้งสถานที่สำคัญ (วางพิกัดครั้งเดียว ใช้ซ้ำทุกบ้าน)</button>
    <button class="btn alt" data-a="dist">🗺️ สร้างสคริปต์ระยะทาง (แทนท่อนแผนที่)</button>
    <button class="btn" data-a="draft">✨ บันทึกและร่างสคริปต์อัตโนมัติ</button><button class="btn alt" data-a="x">บันทึกเฉยๆ</button>`;
  const prev = () => { const dd = placeDistances(), el = d.querySelector('#distPrev'); el.textContent = !parseCoord(f.coord) ? (f.coord ? '⚠️ อ่านพิกัดบ้านไม่ออก ลองวางแบบ 12.558940,99.909039' : '') : dd.length ? '📏 ' + dd.slice(0, 5).map(x => `${x.name} ~${fmtKm(x.km)} (ขับ ~${x.min} นาที)`).join(' · ') + ' — ประมาณการ ไม่ใช่เวลาจริงจาก Google Maps' : 'ยังไม่มีสถานที่ที่ใส่พิกัด กด 📍 ตั้งสถานที่สำคัญ';
  };
  setTimeout(prev, 0);
  d.addEventListener('input', e => { if (e.target.dataset.k) { f[e.target.dataset.k] = e.target.value; save(); prev(); } });
  d.onclick = e => {
    const a = e.target.closest('[data-a]')?.dataset.a; if (!a) return;
    if (a === 'places') { openPlaces(prev); return; }
    if (a === 'dist') { const t = mapScriptText(); if (!t) { alert('ยังสร้างไม่ได้: ต้องวางพิกัดบ้าน และพิกัดสถานที่สำคัญอย่างน้อย 1 แห่ง'); return; } const cur = state.script.rooms[MAP_ROOM]; if (cur && cur.trim() && !confirm('มีสคริปต์ท่อนแผนที่อยู่แล้ว ต้องการแทนที่ใช่ไหม?')) return; state.script.rooms[MAP_ROOM] = t; save(); alert('สร้างสคริปต์ระยะทางแล้ว (ใช้กับท่อน แผนที่/การเดินทาง)\n\n' + t); return; }
    d.remove();
    if (a === 'draft') { alert(expandMsg(draftAll())); }
    if (after) after();
  };
  document.body.appendChild(d);
}

// ---- ขั้น 2: เช็กลิสต์แท็บ — แตะแท็บเพื่อเพิ่มไฟล์ในป๊อปอัพ ไฟล์ที่ใส่แล้วแสดงด้านล่างหน้าเดียวกัน ----
let refreshChips = null;
const slotScript = sl => (sl.cat === 'lifestyle' ? ['life'] : sl.cat ? ['area'] : sl.kind === 'room' ? ['room', sl.room] : null);
const getSlotScript = sl => { const k = slotScript(sl); return !k ? null : k[0] === 'room' ? (state.script.rooms[k[1]] || '') : (state.script[k[0]] || ''); };
const setSlotScript = (sl, v) => { const k = slotScript(sl); if (k[0] === 'room') state.script.rooms[k[1]] = v; else state.script[k[0]] = v; save(); };
function itemCap(it) {
  const n = it.name || ''; if (!n.startsWith('map-auto-')) return '';
  const hasTwo = state.items.some(x => (x.name || '') === 'map-auto-2.png');
  const kind = n.includes('overview') ? 'o' : n.includes('zoom') ? 'z' : (n === 'map-auto-1.png' && hasTwo ? 'o' : 'z');
  return kind === 'o' ? '🗺️ ภาพรวม + ระยะทาง' : '📍 ซูมที่บ้าน';
}
const thumbHtml = (it, del) => `<div class="th" data-id="${it.id}">${it.type === 'video' ? `<video src="${urlOf(it)}#t=0.1" muted playsinline></video>` : `<img src="${urlOf(it)}" alt="">`}${itemCap(it) ? `<span class="cap">${itemCap(it)}</span>` : ''}${del ? `<button class="x" data-del="${it.id}" aria-label="ลบ">✕</button>` : ''}</div>`;

// เส้นสถานะสคริปต์ใต้หัวข้อกลุ่ม: เขียว+ยาวตามความยาวสคริปต์ = เขียนแล้ว · ส้มเต็มเส้น = ยังไม่เขียน
function scriptBarHtml(sl) {
  const t = getSlotScript(sl); if (t === null) return '';
  const sec = secOf(t), has = sec > 0, pct = Math.min(100, Math.round(sec / 15 * 100));
  return `<div class="sbar ${has ? 'ok' : 'no'}"><i style="width:${has ? Math.max(pct, 8) : 100}%"></i></div><small class="sbl ${has ? 'ok' : 'no'}">📝 ${has ? `เขียนสคริปต์แล้ว ~${sec} วิ${sl.cat && sl.cat !== 'lifestyle' ? ' (ใช้ร่วมกันทั้งทำเล)' : ''}` : 'ยังไม่ได้เขียนสคริปต์'}</small>`;
}

function openSlot(id) {
  document.querySelector('#slotSheet')?.remove();
  const sl = SLOTS.find(x => x.id === id); if (!sl) return;
  const items = slotItems(sl), n = slotCount(sl), st = slotStatus(sl, n);
  const stTxt = { ok: '✅ ผ่านแล้ว', warn: '⚠️ ' + slotInfo(sl, n), miss: '❌ ' + slotInfo(sl, n), info: '➖ ไม่จำเป็น · ข้ามได้' }[st];
  const d = document.createElement('div'); d.className = 'sheet tall'; d.id = 'slotSheet';
  const sc = getSlotScript(sl);
  d.innerHTML = `<div class="sh-head"><b>${sl.ico} ${sl.label}</b><button class="ib" data-a="x" aria-label="ปิด">✕</button></div>
    <p class="hint">${sl.hint}</p><p class="stline st-${st}">${stTxt}</p>
    ${sl.id === 'map' ? `<button class="btn alt" data-a="genmap">🗺️ สร้างแผนที่จากพิกัดบ้านอัตโนมัติ</button><p class="hint" id="genStat">สร้างให้ 2 ภาพ: 🗺️ ภาพรวม + ระยะทาง และ 📍 ซูมที่บ้าน (ต้องมีพิกัดบ้านและต่อเน็ต) · แยกจากคลิปรถวิ่ง 🚗 ที่อยู่ด้านล่าง</p><button class="btn" data-a="genroute">🚗 สร้างคลิปรถวิ่งเข้าบ้านอัตโนมัติ</button><p class="hint" id="routeStat">${state.routeData ? (state.routeData.size === state.size ? `✅ มีคลิปเส้นทางแล้ว (~${(state.routeData.meters / 1000).toFixed(1)} กม.${state.routeData.real ? '' : ' · เส้นตรง'}) ต่อเข้า MP4 ให้อัตโนมัติ` : '⚠️ คลิปเส้นทางสร้างไว้สำหรับขนาดคลิปอื่น กดสร้างใหม่') : 'รถวิ่งตามถนนจริงจากถนนเพชรเกษม/ปากซอยเข้าบ้าน ต้องมีพิกัดบ้าน และต่อเน็ตตอนสร้าง'}</p>
      ${state.routeData ? '<canvas id="routePrev" class="rprev"></canvas><button class="btn alt" data-a="rmroute">🗑️ ลบคลิปเส้นทาง</button>' : ''}
      <label class="sw"><input type="checkbox" id="skipMap" ${state.skipMap ? 'checked' : ''}> คลิปนี้ไม่ใช้แผนที่ (ข้าม)</label>` : ''}
    ${sl.kind === 'contact' ? contactCardHtml() : `<button class="btn" data-a="add">${sl.max1 && items.length ? '↻ เปลี่ยนไฟล์' : '+ เพิ่มรูป / คลิป'}</button>
      ${items.length ? `<div class="sgrid" id="pgrid">${items.map(it => thumbHtml(it, true)).join('')}</div>` : ''}`}
    ${sc !== null ? `<label class="sl"><span>📝 สคริปต์ของช่วงนี้${sl.cat && sl.cat !== 'lifestyle' ? ' (ใช้ร่วมกันทั้ง 4 แท็บทำเล)' : ''}</span></label><textarea class="sct" id="slotScript" rows="3" placeholder="พิมพ์เรื่องเล่าของช่วงนี้ (ไม่ใส่ก็ได้ เขียนทีหลังได้ที่ขั้น 4)">${sc.replace(/</g, '&lt;')}</textarea>` : ''}
    <button class="btn" data-a="x">เสร็จ</button>`;
  d.onclick = async e => {
    if (e.target.closest('[data-a=x]')) { d.remove(); refreshAll(); return; }
    if (e.target.closest('[data-a=rmroute]')) { if (confirm('ลบคลิปเส้นทางรถวิ่ง?')) { state.routeData = null; await save(); updateSb(); openSlot(id); } return; }
    if (e.target.closest('[data-a=genroute]')) { const st = d.querySelector('#routeStat'), btn = e.target.closest('[data-a=genroute]'); btn.disabled = true; try { const rd = await buildRouteData(st); if (rd) { state.routeData = rd; state.skipMap = false; await save(); updateSb(); openSlot(id); } } catch (err) { st.textContent = '❌ สร้างไม่สำเร็จ (ต่อเน็ตอยู่ไหม?) ' + (err.message || err); } btn.disabled = false; return; }
    if (e.target.closest('[data-a=genmap]')) { const st = d.querySelector('#genStat'), btn = e.target.closest('[data-a=genmap]'); btn.disabled = true; const n = await generateMapImages(st); btn.disabled = false; if (n) { updateSb(); openSlot(id); } return; }
    if (e.target.closest('[data-a=add]')) { const fs = await pickFiles('image/*,video/*', !sl.max1); if (fs.length) { await addToSlot(sl, fs); updateSb(); openSlot(id); } return; }
    const b = e.target.closest('[data-del]'); if (b && confirm('ลบไฟล์นี้ใช่ไหม?')) { await removeFromSlot(sl, +b.dataset.del); updateSb(); openSlot(id); }
  };
  d.addEventListener('input', e => { if (e.target.id === 'slotScript') setSlotScript(sl, e.target.value); });
  d.addEventListener('change', e => { if (e.target.id === 'skipMap') { state.skipMap = e.target.checked; save(); updateSb(); } });
  if (sl.kind === 'contact') bindContact(d, () => openSlot(id));
  document.body.appendChild(d);
  const rp = d.querySelector('#routePrev');
  if (rp && state.routeData && state.routeData.size === state.size) {
    const rd = state.routeData; rp.width = rd.W / 3; rp.height = rd.H / 3; const cx = rp.getContext('2d');
    routeScene(rd).then(sc => { const t0 = performance.now(); const tick = () => { if (!rp.isConnected) return; const t = ((performance.now() - t0) / 1000) % (sc.dur + 1); cx.save(); sc.draw(cx, rp.width, rp.height, Math.min(t, sc.dur)); cx.restore(); requestAnimationFrame(tick); }; tick(); });
  }
}

let refreshAll = () => {};
function viewSlots() {
  selExtra = ''; selPre = '';
  const mark = { ok: '✓', warn: '!', miss: '●', info: '' };
  $('#view').innerHTML = `
    <h2>ใส่รูป/คลิปตามช่วงของคลิป</h2>
    <p class="hint">แตะแท็บเพื่อเพิ่มรูป/คลิป ไม่ต้องเรียงลำดับ · เขียว ✓ = ผ่านแล้ว · แดง ● = จำเป็น · ส้ม ! = แนะนำ · เส้นประ = ข้ามได้</p>
    <div class="chips" id="chips"></div>
    <div class="tools"><button class="ib wide" id="btnFacts">🏠 ข้อมูลบ้าน</button><button class="ib wide danger" id="btnDraft">✨ ร่างสคริปต์ให้</button></div>
    <div id="gallery"></div>
    <div id="doneBar"></div>`;
  const renderChips = () => {
    const el = $('#chips'); if (!el) return;
    el.innerHTML = SLOTS.map(x => `<button class="chip st-${slotStatus(x)}" data-s="${x.id}">${x.ico} ${x.short} <i>${x.id === 'map' && state.skipMap && !slotCount(x) ? '⏭ ข้าม' : mark[slotStatus(x)]}</i></button>`).join('');
  };
  const renderGallery = () => {
    const g = $('#gallery'); if (!g) return;
    // แยกเป็น "ยังไม่เรียบร้อย" (ขึ้นบน) กับ "เรียบร้อยแล้ว" (ลงล่าง) ภายในแต่ละส่วนเรียงตามลำดับในคลิป
    const todo = [], done = [];
    SLOTS.forEach(sl => {
            if (sl.kind === 'contact') {
        const ok = slotCount(sl);
        if (ok) done.push(`<div class="gsec" data-sec="${sl.id}"><div class="gh"><b>${sl.ico} ${sl.short}</b><button class="ib sm" data-open="${sl.id}">แก้ไข</button></div><p class="hint">${slotInfo(sl, ok)}</p></div>`);
        return;
      }
      const items = slotItems(sl);
      if (!items.length) return;
      const sc = getSlotScript(sl), noScript = sc !== null && secOf(sc) === 0;
      (noScript ? todo : done).push(`<div class="gsec${noScript ? ' gmiss' : ''}" data-sec="${sl.id}"><div class="gh"><b>${sl.ico} ${sl.label.replace(/ \(.*\)/, '')} · ${items.length}</b><button class="ib sm" data-open="${sl.id}">+ เพิ่ม</button></div>
        ${scriptBarHtml(sl)}
        <div class="sgrid" data-grid="${sl.id}">${items.map(it => thumbHtml(it, true)).join('')}</div></div>`);
    });
    { const orp = orphanItems(); if (orp.length) {
      const opts = SLOTS.filter(x => x.kind === 'room').map(x => `<option value="${x.room}">${x.ico} ${x.short}</option>`).join('');
      todo.unshift(`<div class="gsec gmiss" data-sec="orphan"><div class="gh"><b>⚠️ รูปที่ยังไม่ได้จัดเข้าแท็บ · ${orp.length}</b></div><p class="hint">รูปเหล่านี้ใส่ไว้ก่อนมีแท็บ เลือกว่าเป็นของแท็บไหน หรือกด ✕ ลบ (ต้องจัดให้ครบก่อนไปขั้นต่อไป)</p>
        <div class="sgrid">${orp.map(it => `<div class="th orp" data-id="${it.id}">${it.type === 'video' ? `<video src="${urlOf(it)}#t=0.1" muted playsinline></video>` : `<img src="${urlOf(it)}" alt="">`}<button class="x" data-del="${it.id}" aria-label="ลบ">✕</button><select class="mv" data-mv="${it.id}"><option value="">ย้ายไป…</option>${opts}</select></div>`).join('')}</div></div>`); } }
    if (state.routeData) done.push(`<div class="gsec" data-sec="route"><div class="gh"><b>🚗 คลิปเส้นทางรถวิ่งเข้าบ้าน</b><button class="ib sm" data-open="map">จัดการ</button></div><p class="hint">${state.routeData.size === state.size ? `ต่อเข้า MP4 อัตโนมัติ (~${ROUTE_DUR} วินาที) หลังภาพแผนที่` : '⚠️ สร้างไว้สำหรับขนาดคลิปอื่น กด จัดการ เพื่อสร้างใหม่'}</p></div>`);
    const html = (todo.length ? `<h3 class="gtitle todo">⏳ ยังไม่เรียบร้อย (${todo.length})</h3>${todo.join('')}` : '')
      + (done.length ? `<h3 class="gtitle done">✅ เรียบร้อยแล้ว (${done.length})</h3>${done.join('')}` : '');
    g.innerHTML = html || '<div class="soon">ยังไม่มีไฟล์ แตะแท็บด้านบนเพื่อเริ่มเพิ่มรูป/คลิป</div>';
    SLOTS.filter(sl => sl.kind === 'room').forEach(sl => { const grid = g.querySelector(`[data-grid="${sl.id}"]`); if (!grid) return;
      enableDrag(grid, { itemSel: '.th', grid: true, onEnd: async els => {
        const ids = els.map(c => +c.dataset.id), slots = [];
        state.items.forEach((x, k) => { if (sl.rooms.includes(x.room)) slots.push(k); });
        const byId = new Map(state.items.map(x => [x.id, x])), next = state.items.slice();
        slots.forEach((k, i) => { next[k] = byId.get(ids[i]); });
        state.items = next; await save(); renderGallery();
      } }); });
  };
  const renderDone = () => {
    const miss = sbBlockers(), el = $('#doneBar'); if (!el) return;
    const hidden = miss.filter(m => m.id === 'un');
    el.innerHTML = `${hidden.length ? `<p class="hint" style="color:#9b1c1c">❌ ปุ่มยังกดไม่ได้: ${hidden[0].info} (ดูการ์ด ⚠️ ด้านบน)</p>` : miss.length ? '' : '<p class="hint" style="color:#1e6b3a">✅ เช็กลิสต์ของจำเป็นครบแล้ว</p>'}
      <button class="btn" id="toColor" ${miss.length ? 'disabled' : ''}>ถัดไป: 3 สี →</button>`;
    $('#toColor').onclick = () => go(2);
  };
  refreshAll = () => { renderChips(); renderGallery(); renderDone(); };
  refreshChips = () => { if ($('#chips')) { renderChips(); renderDone(); } };
  $('#chips').onclick = e => { const b = e.target.closest('.chip'); if (b) openSlot(b.dataset.s); };
  $('#gallery').onchange = async e => {
    const m = e.target.closest('[data-mv]'); if (!m || !m.value) return;
    const it = state.items.find(x => x.id === +m.dataset.mv); if (it) { it.room = m.value; await save(); updateSb(); refreshAll(); }
  };
  $('#gallery').onclick = async e => {
    const o = e.target.closest('[data-open]'); if (o) { openSlot(o.dataset.open); return; }
    const x = e.target.closest('[data-del]'); if (!x) return;
    if (x.closest('.gsec').dataset.sec === 'orphan') { if (confirm('ลบรูปนี้ใช่ไหม?')) { removeItem(+x.dataset.del); await save(); updateSb(); refreshAll(); } return; }
    const sl = SLOTS.find(z => z.id === x.closest('.gsec').dataset.sec);
    if (confirm('ลบไฟล์นี้ใช่ไหม?')) { await removeFromSlot(sl, +x.dataset.del); updateSb(); refreshAll(); }
  };
  $('#btnFacts').onclick = () => openFacts(() => refreshAll());
  $('#btnDraft').onclick = () => { alert(expandMsg(draftAll())); refreshAll(); };
  refreshAll();
}

function go(n) { selMode = false; picked.clear(); state.step = n; render(); window.scrollTo(0, 0); }

const COMING = {
  4: ['เสียงพากย์และเพลงประกอบ', 'อัปโหลดไฟล์เสียงพากย์ทีละไฟล์ (01, 02, ...) และเพลง mp3'],
  5: ['มาสคอต', 'ปากขยับตามเสียงพูด กะพริบตา โบกมือ กระโดด เดินสั้นๆ'],
};
function viewComing() {
  const [t, d] = COMING[state.step];
  $('#view').innerHTML = `
    <h2>${STEPS[state.step]}: ${t}</h2>
    <div class="soon">🚧 ขั้นนี้ยังไม่เปิดใช้งาน<br><br>${d}<br><br>ตอนนี้กดถัดไปเพื่อข้ามได้</div>
    <button class="btn" id="nx">ถัดไป: ${STEPS[state.step + 1]} →</button>
    <button class="btn alt" id="bk">← ย้อนกลับ</button>`;
  $('#nx').onclick = () => go(state.step + 1);
  $('#bk').onclick = () => go(state.step - 1);
}

// ---- ขั้น 4: สคริปต์เรื่องราว ----
const SPEAK_CPS = 12; // ตัวอักษรไทยต่อวินาที (ประมาณ)
const cleanLen = t => (t || '').replace(/\s+/g, '').length;
const secOf = t => Math.round(cleanLen(t) / SPEAK_CPS);
const mmss = n => `${Math.floor(n / 60)}:${String(n % 60).padStart(2, '0')}`;
function scriptSegments() {
  const rooms = []; state.items.forEach(it => { if (it.room && it.room !== AREA_ROOM && !rooms.includes(it.room)) rooms.push(it.room); });
  const segs = [];
  if (areaItems().length) segs.push({ no: 1, key: 'area', label: 'ทำเล หัวหิน', text: state.script.area || '' });
  rooms.forEach(r => segs.push({ no: segs.length + 1, key: 'room:' + r, label: r, room: r, text: state.script.rooms[r] || '' }));
  if (lifeItems().length) segs.push({ no: segs.length + 1, key: 'life', label: 'ไลฟ์สไตล์', text: state.script.life || '' });
  return segs;
}
async function copyText(t) {
  try { await navigator.clipboard.writeText(t); return true; } catch (_) {}
  const ta = document.createElement('textarea'); ta.value = t; document.body.appendChild(ta); ta.select();
  let ok = false; try { ok = document.execCommand('copy'); } catch (_) {} ta.remove(); return ok;
}
// ---- แปลไทย -> อังกฤษ (MyMemory ฟรี ไม่ใช้รหัส · ต้องต่อเน็ต · ข้อความสคริปต์ถูกส่งไปแปลที่บริการนี้) ----
function chunkText(t, max = 400) {
  const out = []; let cur = '';
  for (const w of t.split(/(\s+)/)) { if ((cur + w).length > max && cur) { out.push(cur); cur = ''; } cur += w; while (cur.length > max) { out.push(cur.slice(0, max)); cur = cur.slice(max); } }
  if (cur.trim()) out.push(cur); return out;
}
const decodeHtml = h => { const t = document.createElement('textarea'); t.innerHTML = h; return t.value; };
async function translateTh2En(text) {
  const out = [];
  for (const c of chunkText(text.trim())) {
    const r = await fetch('https://api.mymemory.translated.net/get?q=' + encodeURIComponent(c) + '&langpair=th|en');
    if (!r.ok) throw new Error('บริการแปลตอบ ' + r.status);
    const j = await r.json();
    if (String(j.responseStatus) !== '200') throw new Error(j.responseDetails || 'แปลไม่สำเร็จ');
    out.push(decodeHtml(j.responseData.translatedText));
  }
  return out.join(' ').replace(/\s+/g, ' ').trim();
}

function viewScript() {
  organizeItems(); save();
  const segs = scriptSegments(), no2 = n => String(n).padStart(2, '0');
  let segT = segTargets();
  const sc = state.script; sc.en = sc.en || {}; sc.enSrc = sc.enSrc || {};
  const setText = (seg, v) => { if (seg.key === 'life') sc.life = v; else if (seg.key === 'area') sc.area = v; else sc.rooms[seg.room] = v; };
  const total = () => scriptSegments().reduce((a, g) => a + secOf(g.text), 0);
  const stale = g => !!(sc.en[g.key] && g.text.trim() && sc.enSrc[g.key] !== g.text);
  const staleTxt = g => (stale(g) ? '⚠️ แก้ไทยหลังแปลแล้ว กด 🌐 แปลใหม่' : '');
  const card = g => {
    const its = g.key === 'life' ? lifeItems() : g.key === 'area' ? areaItems() : state.items.filter(i => i.room === g.room);
    return `<div class="seg" data-key="${g.key}">
      <div class="seg-h"><b>${no2(g.no)} · ${g.label}</b><span class="badge" data-t="${g.key}">~${secOf(g.text)} / เป้า ${segT[g.key]} วิ</span></div>
      ${its.length ? `<div class="mini">${its.slice(0, 4).map(i => i.type === 'image' ? `<img src="${urlOf(i)}" alt="">` : '<span>🎬</span>').join('')}<small>${its.length} รูป/คลิป</small></div>` : ''}
      <div class="lang"><span>🇹🇭 ไทย</span><button class="ib sm" data-cp="th:${g.key}">📋 ไทย</button></div>
      <textarea rows="3" data-k="${g.key}" placeholder="พิมพ์เรื่องเล่าของห้องนี้...">${g.text.replace(/</g, '&lt;')}</textarea>
      <div class="lang"><span>🇬🇧 English</span><button class="ib sm" data-tr="${g.key}">🌐 แปล</button><button class="ib sm" data-cp="en:${g.key}">📋 EN</button></div>
      <textarea rows="3" data-e="${g.key}" placeholder="กด 🌐 แปล เพื่อแปลจากไทย (แก้ไขเองได้)">${(sc.en[g.key] || '').replace(/</g, '&lt;')}</textarea>
      <small class="stale" data-w="${g.key}">${staleTxt(g)}</small>
    </div>`;
  };
  $('#view').innerHTML = `
    <h2>4 สคริปต์: เรื่องราว</h2>
    <div class="seg"><b>🎯 เป้าหมายเสียงพากย์ทั้งคลิป</b>
      <div class="tgt"><input class="ct" id="tgt" type="number" inputmode="numeric" min="30" max="600" value="${state.targetSec}"><span>วินาที (<b id="tgtTxt">${mmss(state.targetSec)}</b>) · ไตเติล/เครดิตปิดแยกต่างหาก</span></div>
      <div class="sbar ok" id="totBar" style="height:10px"><i style="width:0%"></i></div><small class="sbl" id="totTxt"></small>
      <div class="tools"><button class="ib wide danger" id="s4Draft">✨ เติมให้ครบเวลา</button><button class="ib wide" id="s4Facts">🏠 ข้อมูลบ้าน</button></div>
      <div class="tools"><button class="ib wide" id="aiCopy">🤖 คัดลอกคำสั่งให้ AI เขียน</button><button class="ib wide" id="aiPaste">📥 วางสคริปต์จาก AI</button></div></div>
    <div class="tools"><button class="ib wide" id="trAll">🌐 แปลทั้งหมด</button><button class="ib wide" data-all="th">📋 ไทยทั้งหมด</button><button class="ib wide" data-all="en">📋 EN ทั้งหมด</button></div>
    <p class="hint" id="saved">💾 บันทึกอัตโนมัติทุกครั้งที่พิมพ์</p>
    <p class="hint">เวลารวมโดยประมาณ <b id="tot">${mmss(total())}</b> (เป้าหมายประมาณ 3:00) · ไตเติลและหน้าปิดเป็นคลิปประจำ ไม่ต้องเขียนสคริปต์</p>
    <div class="soon" style="text-align:left">📋 <b>ปุ่มคัดลอกใช้ทำอะไร:</b> กด 📋 ไทย หรือ 📋 EN ที่ท่อนไหน แล้วนำไปวางใน <b>Google AI Studio</b> เพื่อสร้างเสียงพากย์ จากนั้นตั้งชื่อไฟล์เสียงตามเลขท่อน (01, 02, ...) แล้วนำมาอัปโหลดในขั้น 5 · ปุ่มทั้งหมดจะมี [01] [02] คั่นไว้ให้อ่านง่าย (ถ้าจะสร้างเสียงให้ใช้ปุ่มของแต่ละท่อน)<br>🌐 การแปลใช้บริการแปลฟรีออนไลน์ ต้องต่อเน็ต คุณภาพพื้นฐาน อ่านและแก้ก่อนใช้ทุกครั้ง</div>
    ${state.items.length ? '' : '<div class="soon">ยังไม่มีรูป กลับไปขั้น 2 เพื่อใส่รูปและติดแท็กห้องก่อน</div>'}
    <div id="segs">${segs.map(card).join('')}</div>
    <p class="hint" id="warn"></p>
    <button class="btn" id="nx">ถัดไป: 5 เสียง →</button>
    <button class="btn alt" id="bk">← ย้อนกลับ</button>`;
  const warn = () => {
    const all = scriptSegments(), msgs = [];
    const empty = all.filter(g => !g.text.trim()).map(g => no2(g.no));
    const noRoom = state.items.filter(i => !i.room).length;
    if (noRoom) msgs.push(`⚠️ มี ${noRoom} รูปที่ยังไม่ตั้งห้อง (ย้อนกลับไปขั้น 3 เพื่อตั้งห้อง)`);
    if (empty.length) msgs.push('ท่อนที่ยังว่าง: ' + empty.join(', '));
    $('#warn').innerHTML = msgs.join('<br>');
  };
  const updTot = () => { const tot = totalSecNow(), pct = Math.min(100, Math.round(tot / state.targetSec * 100)); const bar = $('#totBar'); bar.querySelector('i').style.width = pct + '%'; bar.className = 'sbar ' + (tot >= state.targetSec * 0.9 ? 'ok' : 'no'); $('#totTxt').textContent = `รวมตอนนี้ ~${mmss(tot)} จากเป้า ${mmss(state.targetSec)} (${pct}%)${tot < state.targetSec * 0.9 ? ' · ยังสั้นกว่าเป้า' : ' · ถึงเป้าแล้ว'}`; $('#totTxt').className = 'sbl ' + (tot >= state.targetSec * 0.9 ? 'ok' : 'no'); };
  updTot(); warn();
  const stamp = () => { const d = new Date(); $('#saved').textContent = `💾 บันทึกแล้ว ${d.toLocaleTimeString('th-TH')}`; };
  $('#segs').oninput = e => {
    const ta = e.target.closest('textarea'); if (!ta) return;
    if (ta.dataset.e) { sc.en[ta.dataset.e] = ta.value; sc.enSrc[ta.dataset.e] = (scriptSegments().find(x => x.key === ta.dataset.e) || {}).text; save(); stamp(); return; }
    const g = scriptSegments().find(x => x.key === ta.dataset.k); setText(g, ta.value); save(); stamp();
    document.querySelector(`[data-t="${CSS.escape(g.key)}"]`).textContent = `~${secOf(ta.value)} / เป้า ${segT[g.key]} วิ`;
    document.querySelector(`[data-w="${CSS.escape(g.key)}"]`).textContent = staleTxt({ key: g.key, text: ta.value });
    $('#tot').textContent = mmss(total()); updTot(); warn();
  };
  const flash = (btn, ok) => { const o = btn.dataset.o || btn.textContent; btn.dataset.o = o; btn.textContent = ok ? '✓ คัดลอกแล้ว' : 'คัดลอกไม่ได้'; setTimeout(() => { btn.textContent = o; }, 1500); };
  const doTranslate = async g => {
    if (!g.text.trim()) return false;
    const t = await translateTh2En(g.text); sc.en[g.key] = t; sc.enSrc[g.key] = g.text; save();
    const ta = document.querySelector(`[data-e="${CSS.escape(g.key)}"]`); ta.value = t;
    document.querySelector(`[data-w="${CSS.escape(g.key)}"]`).textContent = ''; return true;
  };
  $('#segs').onclick = async e => {
    const cp = e.target.closest('[data-cp]');
    if (cp) { const [lang, key] = [cp.dataset.cp.split(':')[0], cp.dataset.cp.slice(cp.dataset.cp.indexOf(':') + 1)]; const g = scriptSegments().find(x => x.key === key); const txt = lang === 'en' ? (sc.en[key] || '') : g.text; if (!txt.trim()) { alert(lang === 'en' ? 'ยังไม่มีข้อความอังกฤษ กด 🌐 แปล ก่อน' : 'ยังไม่มีข้อความ'); return; } flash(cp, await copyText(txt.trim())); return; }
    const tr = e.target.closest('[data-tr]');
    if (tr) { const g = scriptSegments().find(x => x.key === tr.dataset.tr); if (!g.text.trim()) { alert('ยังไม่มีข้อความไทยให้แปล'); return; } tr.disabled = true; tr.textContent = 'กำลังแปล...'; try { await doTranslate(g); stamp(); } catch (err) { alert('แปลไม่สำเร็จ (ต่อเน็ตอยู่ไหม?) ' + (err.message || err)); } tr.disabled = false; tr.textContent = '🌐 แปล'; }
  };
  $('#trAll').onclick = async e => {
    const b = e.currentTarget, list = scriptSegments().filter(g => g.text.trim()); if (!list.length) { alert('ยังไม่มีข้อความไทยให้แปล'); return; }
    b.disabled = true; let n = 0;
    try { for (const g of list) { b.textContent = `กำลังแปล ${++n}/${list.length}`; await doTranslate(g); } stamp(); b.textContent = '✓ แปลครบแล้ว'; setTimeout(() => { b.textContent = '🌐 แปลทั้งหมด'; }, 2000); }
    catch (err) { alert(`แปลไม่สำเร็จที่ท่อนที่ ${n} (ต่อเน็ตอยู่ไหม?) ` + (err.message || err)); b.textContent = '🌐 แปลทั้งหมด'; }
    b.disabled = false;
  };
  document.querySelectorAll('[data-all]').forEach(btn => btn.onclick = async e => {
    const lang = btn.dataset.all;
    const txt = scriptSegments().map(g => [`[${no2(g.no)}]`, (lang === 'en' ? (sc.en[g.key] || '') : g.text).trim()]).filter(x => x[1]).map(x => x.join('\n')).join('\n\n');
    if (!txt) { alert(lang === 'en' ? 'ยังไม่มีข้อความอังกฤษ กด 🌐 แปลทั้งหมด ก่อน' : 'ยังไม่มีข้อความ'); return; }
    flash(btn, await copyText(txt));
  });
  $('#nx').onclick = () => go(4); $('#bk').onclick = () => go(2);
  $('#s4Facts').onclick = () => openFacts(() => viewScript());
  $('#tgt').oninput = e => { const v = Math.max(30, Math.min(600, +e.target.value || 150)); state.targetSec = v; $('#tgtTxt').textContent = mmss(v); save(); segT = segTargets(); document.querySelectorAll('[data-t]').forEach(b => { const g = scriptSegments().find(x => x.key === b.dataset.t); if (g) b.textContent = `~${secOf(g.text)} / เป้า ${segT[g.key]} วิ`; }); updTot(); };
  $('#s4Draft').onclick = () => { const n = draftAll(); alert(expandMsg(n)); viewScript(); };
  $('#aiCopy').onclick = async e => { flash(e.currentTarget, await copyText(buildAiPrompt())); };
  $('#aiPaste').onclick = () => {
    const d = document.createElement('div'); d.className = 'sheet tall'; d.id = 'pasteSheet';
    d.innerHTML = `<div class="sh-head"><b>📥 วางสคริปต์จาก AI</b><button class="ib" data-a="x" aria-label="ปิด">✕</button></div>
      <p class="hint">วางข้อความที่ AI เขียนให้ รูปแบบ [01] ข้อความ [02] ข้อความ ... ท่อนที่ตรงเลขจะถูกแทนที่ด้วยข้อความใหม่ (ไทย) · แปลอังกฤษใหม่ทีหลังได้</p>
      <textarea class="sct" id="pasteBox" rows="10" placeholder="[01]\nข้อความท่อนที่ 1...\n\n[02]\nข้อความท่อนที่ 2..."></textarea>
      <button class="btn" data-a="ok">✓ ใส่สคริปต์</button><button class="btn alt" data-a="x">ยกเลิก</button>`;
    d.onclick = e => { const a = e.target.closest('[data-a]')?.dataset.a; if (!a) return;
      if (a === 'ok') { const n = applyAiScript(d.querySelector('#pasteBox').value); if (!n) { alert('อ่านไม่ออก: ต้องมี [01] [02] ... นำหน้าแต่ละท่อน'); return; } d.remove(); alert(`ใส่สคริปต์ให้ ${n} ท่อนแล้ว`); viewScript(); return; }
      d.remove(); };
    document.body.appendChild(d);
  };
}

// ---- ขั้น 3: ปรับสี ----
const smallCache = new Map(), statCache = new Map(); let colorSel = 0;
async function getSmall(it) {
  if (!smallCache.has(it.id)) smallCache.set(it.id, await smallBitmap(it.blob, 480));
  return smallCache.get(it.id);
}
async function viewColor() {
  organizeItems(); save();
  const imgs = state.items.filter(i => i.type === 'image');
  if (!imgs.length) {
    $('#view').innerHTML = `<h2>3 สี: ปรับสีให้เข้ากัน</h2><div class="soon">ยังไม่มีรูป กลับไปขั้น 2 เพื่อใส่รูปก่อน</div><button class="btn" id="b2">← กลับไปใส่รูป</button>`;
    $('#b2').onclick = () => go(1); return;
  }
  const c = state.color; let sel = Math.min(colorSel, imgs.length - 1); colorSel = 0;
  $('#view').innerHTML = `<h2>3 สี: ปรับสีให้เข้ากัน</h2><p class="hint">กำลังอ่านรูป...</p>`;
  const smalls = [];
  for (const it of imgs) { smalls.push(await getSmall(it)); if (!statCache.has(it.id)) statCache.set(it.id, imageStats(smalls.at(-1))); }
  const stats = imgs.map(i => statCache.get(i.id));
  const slider = (k, label, lo, hi) => `<label class="sl"><span>${label} <b id="v_${k}">${c[k]}</b></span><input type="range" data-k="${k}" min="${lo}" max="${hi}" step="1" value="${c[k]}"></label>`;
  $('#view').innerHTML = `
    <h2>3 สี: ปรับสีให้เข้ากัน</h2>
    <div id="selbar" class="tools"></div>
    <div class="ba"><div><canvas id="cb"></canvas><small>ก่อน</small></div><div><canvas id="ca"></canvas><small>หลัง</small></div></div>
    <p class="hint" id="cap"></p>
    <input type="file" id="file3" accept="image/*,video/*" multiple hidden>
    <p class="hint" id="prog3"></p>
    <p class="hint">แตะรูปเล็กเพื่อเลือกดูเทียบ ก่อน/หลัง · กดค้างแล้วลากเพื่อสลับตำแหน่ง</p>
    <div class="thumbs" id="th">${imgs.map((_, i) => `<canvas data-i="${i}" data-id="${imgs[i].id}"></canvas>`).join('')}</div>
    <button class="btn" id="nx">ถัดไป: 4 สคริปต์ →</button>
    <button class="btn alt" id="bk">← ย้อนกลับ</button>
    <div class="sheet" id="sheet" hidden>
      <div class="sh-head"><b>🎚️ ปรับสี</b><button class="ib" id="shX" aria-label="ปิด">✕</button></div>
      <p class="hint">ปรับแค่ความสว่าง คอนทราสต์ และ white balance ภาพด้านบนเปลี่ยนให้ดูทันที</p>
      <label class="sw"><input type="checkbox" id="auto" ${c.auto ? 'checked' : ''}> ปรับสีให้เข้ากันอัตโนมัติ</label>
      ${slider('bright', 'ความสว่าง', -30, 30)}${slider('contrast', 'คอนทราสต์', -30, 30)}${slider('warm', 'โทนสี (เย็น ← → อุ่น)', -30, 30)}
      <button class="btn" id="shOk">เสร็จ</button>
    </div>`;
  const draw = () => {
    const luts = isNeutral(c) ? null : makeLuts(stats, c);
    // แสดงตามกรอบคลิปที่เลือก (ภาพเต็มกรอบ ตัดส่วนเกิน) ให้ตรงกับที่จะออกในคลิปจริง
    const put = (cv, bmp, lut, w) => { const z = sizeInfo(), h = Math.round(w * z.h / z.w), t = document.createElement('canvas'); t.width = w; t.height = h; drawCover(t.getContext('2d'), bmp, w, h, 1); cv.width = w; cv.height = h; cv.getContext('2d').drawImage(gradeToCanvas(t, lut), 0, 0); };
    { const un = imgs.filter(x => !x.room).length;
      $('#prog3').innerHTML = un ? `🟧 ยังไม่ตั้งห้อง <b>${un}</b> จาก ${imgs.length} รูป · <button class="lnk" id="pickUn">เลือกที่ยังไม่ตั้งห้อง</button>` : `🟩 ตั้งห้องครบทั้ง ${imgs.length} รูปแล้ว`;
      const pu = $('#pickUn'); if (pu) pu.onclick = () => { selMode = true; picked.clear(); imgs.filter(x => !x.room).forEach(x => picked.add(x.id)); $('#selbar').innerHTML = selBarHtml(); draw(); }; }
    $('#cap').textContent = `รูปที่ ${sel + 1} จาก ${imgs.length} · ห้อง: ${imgs[sel].room || 'ยังไม่ตั้งห้อง'} · ปรับสี: ${c.auto ? 'อัตโนมัติ' : 'ปิด'}${(c.bright || c.contrast || c.warm) ? ' + ตั้งเอง' : ''}`;
    put($('#cb'), smalls[sel], null, 240); put($('#ca'), smalls[sel], luts && luts[sel], 240);
    document.querySelectorAll('#th canvas').forEach(cv => {
      const i = +cv.dataset.i; put(cv, smalls[i], luts && luts[i], 220); cv.classList.toggle('on', !selMode && i === sel);
      const kk = cv.width / 110, cw = 110, ch = cv.height / kk; cv.getContext('2d').save(); cv.getContext('2d').scale(kk, kk);
      { const x = cv.getContext('2d'), rm = imgs[i].room;
        x.fillStyle = rm ? 'rgba(30,110,60,.92)' : 'rgba(224,138,0,.95)'; x.fillRect(0, ch - 18, cw, 18);
        x.fillStyle = '#fff'; x.font = 'bold 11px sans-serif'; x.textAlign = 'left'; x.textBaseline = 'middle';
        x.fillText(rm ? '✓ ' + rm : '⚠ ยังไม่ตั้งห้อง', 5, ch - 8, cw - 10); }
      cv.classList.toggle('ok', !!imgs[i].room); cv.classList.toggle('un', !imgs[i].room);
      if (selMode) {
        const x = cv.getContext('2d'), on = picked.has(imgs[i].id);
        if (on) { x.fillStyle = 'rgba(122,31,43,.55)'; x.fillRect(0, 0, cw, ch); x.lineWidth = 5; x.strokeStyle = '#fff'; x.strokeRect(2.5, 2.5, cw - 5, ch - 5); }
        x.beginPath(); x.arc(20, 20, 13, 0, 7);
        if (on) { x.fillStyle = '#fff'; x.fill(); x.fillStyle = '#7a1f2b'; x.font = 'bold 18px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('✓', 20, 21); }
        else { x.lineWidth = 2; x.strokeStyle = 'rgba(255,255,255,.9)'; x.stroke(); }
      }
      cv.getContext('2d').restore();
    });
  };
  draw();
  let raf = 0; const redraw = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(draw); };
  $('#auto').onchange = e => { c.auto = e.target.checked; save(); redraw(); };
  document.querySelectorAll('input[type=range]').forEach(r => r.oninput = () => { c[r.dataset.k] = +r.value; $('#v_' + r.dataset.k).textContent = r.value; save(); redraw(); });
  enableDrag($('#th'), { itemSel: 'canvas', grid: true, onEnd: async (els, moved) => {
    const ids = els.map(c => +c.dataset.id), slots = [];
    state.items.forEach((x, k) => { if (x.type === 'image') slots.push(k); });
    const byId = new Map(state.items.map(x => [x.id, x])), next = state.items.slice();
    slots.forEach((k, n) => { next[k] = byId.get(ids[n]); });
    state.items = next; colorSel = ids.indexOf(+moved.dataset.id);
    await save(); viewColor();
  } });
  $('#th').onclick = e => {
    const cv = e.target.closest('canvas'); if (!cv) return;
    sel = +cv.dataset.i;
    if (selMode) { const id = imgs[sel].id; picked.has(id) ? picked.delete(id) : picked.add(id); $('#selbar').innerHTML = selBarHtml(); }
    redraw();
  };
  selPre = '<button class="ib" data-sa="tune" title="ปรับสี" aria-label="ปรับสี">🎚️</button><button class="ib" data-sa="reset" title="รีเซ็ตสี" aria-label="รีเซ็ตสี">↺</button>';
  selExtra = '<button class="ib" data-sa="one" title="ลบรูปที่เลือกอยู่" aria-label="ลบรูปที่เลือกอยู่">🗑️</button><button class="ib" data-sa="add" title="เพิ่มรูป" aria-label="เพิ่มรูป">＋</button>';
  bindSelBar($('#selbar'), () => imgs.map(x => x.id), full => full ? viewColor() : redraw(), {
    delOne: async () => { if (!confirm('ลบรูปที่ ' + (sel + 1) + ' ใช่ไหม?')) return; removeItem(imgs[sel].id); await save(); viewColor(); },
    add: () => $('#file3').click(),
    tune: () => { $('#sheet').hidden = !$('#sheet').hidden; },
    reset: () => {
      Object.assign(c, COLOR_DEFAULT); save();
      $('#auto').checked = c.auto;
      document.querySelectorAll('input[type=range]').forEach(r => { r.value = c[r.dataset.k]; $('#v_' + r.dataset.k).textContent = c[r.dataset.k]; });
      redraw();
    },
  });
  $('#shX').onclick = $('#shOk').onclick = () => { $('#sheet').hidden = true; };
  $('#file3').onchange = async e => { await addFiles(e.target.files); viewColor(); };
  $('#nx').onclick = () => go(3); $('#bk').onclick = () => go(1);
}

function viewRender() {
  organizeItems(); save();
  const imgs = [...areaLibOrdered().filter(i => i.type === 'image'), ...state.items.filter(i => i.type === 'image'), ...lifeItems().filter(i => i.type === 'image')], s = sizeInfo();
  const blockers = sbBlockers();
  const skipped = state.items.length - imgs.length;
  const routeOk = !!(state.routeData && state.routeData.size === state.size);
  const routeAt = areaLibOrdered().filter(i => i.type === 'image').length + state.items.filter(i => i.type === 'image' && (i.room === AREA_ROOM || i.room === MAP_ROOM)).length;
  $('#view').innerHTML = `
    <h2>เรนเดอร์เป็น MP4</h2>
    <p class="hint">ขนาด ${s.name} (${s.w}×${s.h}) · ${imgs.length} รูป · ยาวประมาณ ${(totalDuration(imgs.length) + (routeOk ? ROUTE_DUR : 0)).toFixed(1)} วินาที${routeOk ? ' (รวมคลิปรถวิ่งเข้าบ้าน)' : ''}${skipped ? ` · คลิปสั้น ${skipped} ไฟล์ยังไม่ถูกใช้ (รอบหน้า)` : ''}</p>
    ${blockers.length ? `<div class="soon" style="border-color:#b00020;color:#b00020;text-align:left">❌ ยังเรนเดอร์ไม่ได้ เพราะผังเรื่องยังขาด:<br>${blockers.map(b => '• ' + b.label.replace(/^\d+\. /, '') + ' — ' + b.info).join('<br>')}<br><br><button class="btn alt" id="openSb">📋 เปิดผังเรื่อง</button></div>` : ''}
    <p class="hint">หมายเหตุ: ไตเติลและหน้าปิดจากคลังกลางจะถูกต่อเข้าไฟล์ MP4 ในรอบถัดไป (ตอนนี้เรนเดอร์ภาพทำเลและรูปบ้าน)</p>
    <p class="hint">ปรับสี: ${isNeutral(state.color) ? 'ปิด' : (state.color.auto ? 'อัตโนมัติ' : 'ตั้งเอง')}</p>
    <p class="hint">ระหว่างเรนเดอร์ ให้เปิดหน้าจอค้างไว้ อย่าสลับแอป</p>
    <button class="btn" id="go" ${imgs.length && !blockers.length ? '' : 'disabled'}>🎬 เริ่มเรนเดอร์</button>
    <div id="prog" class="hint"></div><div id="out"></div>
    <button class="btn alt" id="bk">← ย้อนกลับ</button>`;
  $('#bk').onclick = () => go(5);
  if ($('#openSb')) $('#openSb').onclick = openSb;
  $('#go').onclick = async () => {
    $('#go').disabled = true; $('#out').innerHTML = '';
    const t0 = performance.now();
    try {
      let luts = null;
      if (!isNeutral(state.color)) {
        const stats = [];
        for (const it of imgs) { if (!statCache.has(it.id)) statCache.set(it.id, imageStats(await getSmall(it))); stats.push(statCache.get(it.id)); }
        luts = makeLuts(stats, state.color);
      }
      const blob = await renderMp4(imgs.map(i => i.blob), s.w, s.h, (p, msg) => { $('#prog').textContent = `${msg} ${Math.round(p * 100)}%`; }, luts, routeOk ? { at: routeAt, scene: await routeScene(state.routeData) } : null);
      const url = URL.createObjectURL(blob);
      $('#prog').textContent = `เสร็จใน ${((performance.now() - t0) / 1000).toFixed(0)} วินาที · ขนาดไฟล์ ${(blob.size / 1048576).toFixed(1)} MB`;
      $('#out').innerHTML = `<video src="${url}" controls playsinline style="width:100%;max-height:60vh;background:#000;border-radius:12px"></video><a class="btn" download="huahin-clip.mp4" href="${url}" style="text-decoration:none;text-align:center">⬇ บันทึกไฟล์ MP4</a>`;
    } catch (e) { $('#prog').textContent = '❌ ' + (e.message || e); }
    $('#go').disabled = false;
  };
}

let dragging = false;
document.addEventListener('touchmove', e => { if (dragging) e.preventDefault(); }, { passive: false });
// กดค้าง ~0.35 วินาที แล้วลากเพื่อสลับลำดับ (ใช้ได้ทั้งรายการแนวตั้งและตารางรูปเล็ก)
function enableDrag(box, opt) {
  const { itemSel, grid, onEnd } = opt;
  let timer = null, item = null, gx = 0, gy = 0, lx = 0, ly = 0, scroller = null;
  const down = e => {
    const el = e.target.closest(itemSel);
    if (selMode || !el || e.target.closest('select,button')) return;
    const x0 = e.clientX, y0 = e.clientY;
    const clear = () => { clearTimeout(timer); document.removeEventListener('pointermove', cancel); document.removeEventListener('pointerup', clear); };
    const cancel = ev => { if (Math.hypot(ev.clientX - x0, ev.clientY - y0) > 10) clear(); };
    document.addEventListener('pointermove', cancel); document.addEventListener('pointerup', clear);
    timer = setTimeout(() => { clear(); begin(el, e); }, 350);
  };
  const place = () => {
    item.style.transform = '';
    const r = item.getBoundingClientRect();
    item.style.transform = `translate(${grid ? lx - gx - r.left : 0}px, ${ly - gy - r.top}px)`;
  };
  const begin = (el, e) => {
    item = el; dragging = true; item.classList.add('dragging');
    const r = item.getBoundingClientRect(); gx = e.clientX - r.left; gy = e.clientY - r.top; lx = e.clientX; ly = e.clientY;
    if (navigator.vibrate) navigator.vibrate(30);
    document.addEventListener('pointermove', move); document.addEventListener('pointerup', end); document.addEventListener('pointercancel', end);
    scroller = setInterval(() => { if (ly < 130) scrollBy(0, -12); else if (ly > innerHeight - 130) scrollBy(0, 12); place(); }, 16);
  };
  const move = e => {
    lx = e.clientX; ly = e.clientY;
    item.style.transform = '';
    const own = item.getBoundingClientRect();
    if (lx >= own.left && lx <= own.right && ly >= own.top && ly <= own.bottom) { place(); return; }
    const others = [...box.children].filter(c => c !== item);
    let before = null;
    if (grid) {
      let best = Infinity, tgt = null, tb = true;
      for (const c of others) {
        const r = c.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
        const inside = lx >= r.left && lx <= r.right && ly >= r.top && ly <= r.bottom;
        const d = inside ? -1 : Math.hypot(lx - cx, ly - cy);
        if (d < best) { best = d; tgt = c; tb = (inside || Math.abs(ly - cy) < r.height / 2) ? lx < cx : ly < cy; }
      }
      if (tgt) before = tb ? tgt : tgt.nextElementSibling === item ? tgt.nextElementSibling.nextElementSibling : tgt.nextElementSibling;
    } else {
      before = others.find(c => { const r = c.getBoundingClientRect(); return ly < r.top + r.height / 2; }) || null;
    }
    if (before !== item && item.nextElementSibling !== before) box.insertBefore(item, before);
    place();
  };
  const end = async () => {
    clearInterval(scroller); dragging = false;
    document.removeEventListener('pointermove', move); document.removeEventListener('pointerup', end); document.removeEventListener('pointercancel', end);
    const els = [...box.children]; const moved = item; item = null;
    await onEnd(els, moved);
  };
  box.addEventListener('pointerdown', down);
  box.addEventListener('contextmenu', e => e.preventDefault());
}

async function startPreview() {
  clearInterval(previewTimer);
  const cv = $('#pv'); if (!cv) return;
  const s = sizeInfo();
  // พรีวิวใช้ความละเอียดครึ่งหนึ่งให้ลื่นบนมือถือ
  cv.width = s.w / 2; cv.height = s.h / 2;
  const ctx = cv.getContext('2d');
  const imgs = await Promise.all(state.items.filter(i => i.type === 'image').map(i => createImageBitmap(i.blob)));
  const total = totalDuration(imgs.length), t0 = performance.now();
  const tick = () => {
    let t = (performance.now() - t0) / 1000;
    if (t > total) { t = total; clearInterval(previewTimer); }
    drawFrame(ctx, cv.width, cv.height, imgs, t);
  };
  previewTimer = setInterval(tick, 1000 / 30);
}

function render() {
  clearInterval(previewTimer);
  renderSteps();
  if (state.step === 0) viewSize(); else if (state.step === 6) viewRender(); else if (state.step === 1) viewSlots(); else if (state.step === 2) viewColor(); else if (state.step === 3) viewScript(); else viewComing();
}

(async () => {
  await load(); render();
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js');
})();
