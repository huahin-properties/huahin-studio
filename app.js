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

const state = { capOn: true, hookOn: true, hero: null, content: null, stock: { mode: 'auto', ids: null, counted: [] }, trans: 'auto', overlay: true, mascot: { presenter: true, size: 0.28, side: 'left' }, audio: { mode: 'single', single: null, chunks: {}, beatAud: {}, music: null, musicVol: 15, duck: true, duckBoost: 2.5, sfx: true }, stretch: true, clipSec: 180, routeData: null, skipMap: false, facts: { name: '', beds: '', baths: '', usable: '', land: '', price: '', travel: '', coord: '', routeStart: '', routeLabel: '', highlights: '' }, slot: 'title', step: 0, size: '4:5', items: [], color: { ...COLOR_DEFAULT }, useArea: true, contact: { mode: 'std', custom: { name: '', phone: '', line: '' } }, script: { area: '', rooms: {}, en: {}, enSrc: {} } };
const STATE0 = structuredClone(state);
let nextId = 1;

// ---- เก็บงานไว้ในเครื่อง (IndexedDB) ปิดแอปแล้วงานไม่หาย ----
const DB = {
  open() { return new Promise((res, rej) => {
    const r = indexedDB.open('huahin-studio', 1);
    r.onupgradeneeded = () => r.result.createObjectStore('kv');
    r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
  }); },
  async get(k) { const db = await this.open(); return new Promise(res => { const q = db.transaction('kv').objectStore('kv').get(k); q.onsuccess = () => res(q.result); }); },
  async set(k, v) { const db = await this.open(); return new Promise((res, rej) => { const tx = db.transaction('kv', 'readwrite'); tx.objectStore('kv').put(v, k); tx.oncomplete = res; tx.onerror = tx.onabort = () => rej(tx.error || new Error('บันทึกไม่ได้ (พื้นที่เต็ม?)')); }); },
  async del(k) { const db = await this.open(); return new Promise((res, rej) => { const tx = db.transaction('kv', 'readwrite'); tx.objectStore('kv').delete(k); tx.oncomplete = res; tx.onerror = tx.onabort = () => rej(tx.error); }); },
};
const projData = () => ({ v: 2, hookOn: state.hookOn, hero: state.hero, content: state.content, stock: state.stock, capOn: state.capOn, trans: state.trans, overlay: state.overlay, mascot: state.mascot, audio: state.audio, stretch: state.stretch, clipSec: state.clipSec, routeData: state.routeData, skipMap: state.skipMap, facts: state.facts, useArea: state.useArea, contact: state.contact, size: state.size, color: state.color, script: state.script, items: state.items.map(({ id, blob, type, room, name, title }) => ({ id, blob, type, room, name, title })) });
const save = () => { if (typeof updateSb === 'function') updateSb(); if (!state.pid) return Promise.resolve(); if (typeof schedMeta === 'function') schedMeta(); return DB.set('project:' + state.pid, projData()).catch(() => {}); };
function applyProject(p) {
  if (p) { if (!p.v) p.items.forEach(i => { if (i.room === 'หน้าบ้าน/ภายนอก') i.room = ''; }); state.size = p.size; state.hookOn = p.hookOn !== false; state.hero = p.hero || null; state.content = p.content || null; state.capOn = p.capOn !== false; state.stock = p.stock || { mode: 'all', ids: null, counted: [] }; state.trans = p.trans || 'auto'; state.overlay = p.overlay !== false; state.color = { ...COLOR_DEFAULT, ...(p.color || {}) }; state.script = { area: '', rooms: {}, en: {}, enSrc: {}, ...(p.script || {}) }; state.skipMap = !!p.skipMap; state.clipSec = p.clipSec || 180; state.audio = { mode: 'single', single: null, chunks: {}, beatAud: {}, music: null, musicVol: 15, duck: true, duckBoost: 2.5, sfx: true, ...(p.audio || {}) }; state.mascot = { presenter: true, size: 0.28, side: 'left', ...(p.mascot || {}) }; state.stretch = p.stretch !== false; state.routeData = p.routeData || null; state.facts = { ...state.facts, ...(p.facts || {}) }; state.useArea = true; state.contact = { mode: 'std', ...(p.contact || {}), custom: { name: '', phone: '', line: '', ...((p.contact || {}).custom || {}) } }; state.items = p.items; nextId = Math.max(0, ...p.items.map(i => i.id)) + 1; }
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
  $('#steps').style.display = state.home ? 'none' : ''; $('#sb').style.display = state.home ? 'none' : '';
  if (state.home) { $('#steps').innerHTML = ''; return; }
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
    'cat': [...(() => { const pl = placesInClip(), sent = pl.slice(0, 5).map(placeSentence), onlyNamed = [...new Set(areaLibOrdered().filter(i => !i.placeId).map(i => String(i.title || '').trim()).filter(Boolean))].slice(0, 3); return [...sent, ...(onlyNamed.length ? [`ในละแวกใกล้เคียงมี ${onlyNamed.join(' ')} ให้ไปใช้บริการได้สะดวก`] : [])]; })(), 'หัวหินคือเมืองริมทะเลที่ใครๆ ก็รัก ทั้งความสงบ ความสะดวก และบรรยากาศที่ผ่อนคลาย',
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
// ความยาวคลิปรวม (ค่าเริ่มต้น 3:00) − ฉากคงที่ (ไตเติล/เครดิต/รถวิ่ง) = เวลาที่ช่วงเล่าเรื่องต้องมี
const routeOkNow = () => !!(state.routeData && state.routeData.size === state.size);
const fixedSec = () => (heroItem() ? hookDur() : 0) + (lib.titleBuiltin ? titleDur() : 0) + (lib.closeBuiltin ? closeDur() : 0) + (routeOkNow() ? ROUTE_DUR : 0) + STYLE.fade;
const narrTarget = () => Math.max(30, state.clipSec - fixedSec());
const SEG_WEIGHT = { 'cat-city': 14, map: 7, ext: 12, park: 3, liv: 9, dine: 4, kit: 10, bed: 10, bath: 5, pool: 9, garden: 4, 'cat-lifestyle': 9 };
function segSlot(g) {
  if (g.key === 'life') return SLOTS.find(x => x.cat === 'lifestyle');
  if (g.key === 'area') return SLOTS.find(x => x.cat === 'city');
  return SLOTS.find(x => x.kind === 'room' && x.rooms.includes(g.room));
}
// เวลาเป้าหมาย (วินาที) ของแต่ละท่อน แบ่งตามน้ำหนักของช่วง
function segTargets() {
  const segs = scriptSegments(), w = g => (SEG_WEIGHT[(segSlot(g) || {}).id] || 6), sum = segs.reduce((a, g) => a + w(g), 0) || 1;
  const m = {}; segs.forEach(g => { m[g.key] = Math.round(narrTarget() * w(g) / sum); }); return m;
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
  const tot = totalSecNow(), tgt = narrTarget(), short = tot < tgt * 0.9;
  return (n ? `เติมสคริปต์ให้ ${n} ช่วง · รวมตอนนี้ ~${mmss(tot)} จากเป้า ${mmss(tgt)}` : `ไม่มีช่วงที่เติมได้เพิ่ม · รวมตอนนี้ ~${mmss(tot)} จากเป้า ${mmss(tgt)}`)
    + (short ? '\n\nยังไม่ถึงเป้า วิธีเพิ่มเนื้อหา: (1) ใส่รูปห้องเพิ่มและกรอก 🏠 ข้อมูลบ้านให้ครบ (2) เขียนเพิ่มเอง (3) กด 🤖 คัดลอกคำสั่งให้ AI ใน Google AI Studio เขียนให้ยาวและละเอียดขึ้น แล้วกด 📥 วางสคริปต์จาก AI' : '');
}
// ตรวจตัวเลขในสคริปต์เทียบกับ 🏠 ข้อมูลบ้านและระยะทางที่คำนวณจากพิกัด (จับข้อมูลที่ AI อาจแต่งเอง)
const numOf = v => parseFloat(String(v).replace(/,/g, ''));
function checkScriptFacts() {
  const f = state.facts, fv = k => String(f[k] || '').trim(), issues = [], seen = [];
  const priceM = (() => { const x = numOf(fv('price')); return isNaN(x) ? null : (x < 1000 ? x : x / 1e6); })();
  const dist = typeof placeDistances === 'function' ? placeDistances() : [];
  scriptSegments().forEach(g => {
    const t = g.text || '', tag = `ท่อน ${String(g.no).padStart(2, '0')} ${g.label}`;
    const chk = (m, key, label) => { seen.push(m[0]); if (!fv(key)) issues.push(`${tag}: พูดถึง "${m[0]}" แต่ไม่ได้กรอก${label}ใน 🏠 ข้อมูลบ้าน (อาจเป็นข้อมูลที่ AI แต่งเอง)`); else if (numOf(m[1]) !== numOf(fv(key))) issues.push(`${tag}: "${m[0]}" ไม่ตรงกับข้อมูลบ้าน (${label} = ${fv(key)})`); };
    for (const m of t.matchAll(/(\d+(?:\.\d+)?)\s*ห้องนอน/g)) chk(m, 'beds', 'จำนวนห้องนอน');
    for (const m of t.matchAll(/(\d+(?:\.\d+)?)\s*ห้องน้ำ/g)) chk(m, 'baths', 'จำนวนห้องน้ำ');
    for (const m of t.matchAll(/(\d[\d,.]*)\s*(?:ตารางเมตร|ตร\.?\s?ม\.?)/g)) chk(m, 'usable', 'พื้นที่ใช้สอย');
    for (const m of t.matchAll(/(\d[\d,.]*)\s*(?:ตารางวา|ตร\.?\s?ว\.?)/g)) chk(m, 'land', 'ขนาดที่ดิน');
    const price = (m, v) => { seen.push(m[0]); if (priceM == null) issues.push(`${tag}: พูดถึงราคา "${m[0]}" แต่ไม่ได้กรอกราคาใน 🏠 ข้อมูลบ้าน (อาจเป็นข้อมูลที่ AI แต่งเอง)`); else if (Math.abs(v - priceM) > 0.011) issues.push(`${tag}: ราคา "${m[0]}" ไม่ตรงกับข้อมูลบ้าน (${priceM} ล้านบาท)`); };
    for (const m of t.matchAll(/(\d[\d,.]*)\s*ล้าน(?:บาท)?/g)) price(m, numOf(m[1]));
    for (const m of t.matchAll(/(\d[\d,]{4,})\s*บาท/g)) price(m, numOf(m[1]) / 1e6);
    for (const m of t.matchAll(/(\d+(?:\.\d+)?)\s*กิโลเมตร/g)) { seen.push(m[0]); if (!dist.some(d => Math.abs(d.km - numOf(m[1])) <= 0.3)) issues.push(`${tag}: ระยะ "${m[0]}" ไม่ตรงกับระยะที่คำนวณจากพิกัด ตรวจเองจาก Google Maps`); }
    for (const m of t.matchAll(/(\d+)\s*นาที/g)) { seen.push(m[0]); if (!dist.some(d => Math.abs(d.min - numOf(m[1])) <= 2)) issues.push(`${tag}: เวลาเดินทาง "${m[0]}" ไม่ตรงกับที่คำนวณจากพิกัด ตรวจเอง`); }
  });
  return { issues, seen };
}
// ตรวจว่าเนื้อเรื่องที่พากย์เข้ากับภาพของท่อนนั้นไหม (อิงป้ายห้องที่ติดรูปไว้ + คำสำคัญในสคริปต์ · แอปมองเนื้อหาในรูปจริงๆ ไม่ได้)
const ROOM_KW = { 'ห้องนอน': ['ห้องนอน', 'เตียงนอน'], 'ห้องนอนใหญ่': ['ห้องนอน', 'เตียงนอน'], 'ห้องน้ำ': ['ห้องน้ำ', 'อ่างอาบน้ำ', 'ฝักบัว'], 'ครัว': ['ครัว', 'เคาน์เตอร์ครัว'], 'ห้องนั่งเล่น': ['ห้องนั่งเล่น', 'โซฟา'], 'ห้องทานอาหาร': ['ห้องทานอาหาร', 'โต๊ะอาหาร'], 'สระว่ายน้ำ': ['สระ', 'ว่ายน้ำ'], 'สวน/ระเบียง': ['สวน', 'ระเบียง', 'ลานหญ้า'], 'ที่จอดรถ': ['จอดรถ', 'โรงจอดรถ', 'โรงรถ'], 'หน้าบ้าน/ภายนอก': ['หน้าบ้าน', 'ภายนอก'] };
const AREA_KW = { hospital: ['โรงพยาบาล'], mall: ['ห้างสรรพสินค้า', 'ศูนย์การค้า'], water: ['สวนน้ำ', 'แบล็คเมาน์เทน', 'Black Mountain'], golf: ['กอล์ฟ'], beach: ['ทะเล', 'ชายหาด', 'หาดทราย', 'พระอาทิตย์ตก'], market: ['ตลาด', 'ร้านอาหาร', 'อาหารทะเล'], mountain: ['ภูเขา', 'น้ำตก', 'ธรรมชาติ'], city: ['ห้างสรรพสินค้า', 'ตัวเมือง', 'โรงพยาบาล'] };
const countKw = (t, kws) => kws.reduce((n, k) => n + (t.split(k).length - 1), 0);
function checkNarrationVsPhotos() {
  const issues = [], hints = [], have = new Set(state.items.filter(i => isMedia(i) && i.room).map(i => i.room));
  scriptSegments().forEach(g => {
    const t = g.text || '', tag = `ท่อน ${String(g.no).padStart(2, '0')} ${g.label}`; if (!t.trim()) return;
    if (g.key === 'area') {
      Object.keys(AREA_KW).forEach(c => { const n = countKw(t, AREA_KW[c]), cat = AREA_CATS.find(x => x.id === c); if (n >= 1 && !libArea(c).length && !state.items.some(i => i.room === AREA_ROOM)) issues.push(`${tag}: พูดถึง "${AREA_KW[c][0]}" ${n} ครั้ง แต่ยังไม่มีรูปหมวด "${cat.label}" ในคลังทำเล → ภาพที่เห็นอาจไม่ตรงกับคำพูด`); });
      return;
    }
    if (!g.room) return;
    const own = ROOM_KW[g.room] || [g.room], nOwn = countKw(t, own);
    Object.keys(ROOM_KW).forEach(r => {
      if (r === g.room || (own.some(k => ROOM_KW[r].includes(k)))) return;
      const n = countKw(t, ROOM_KW[r]);
      if (n >= 2 && n > nOwn) issues.push(`${tag}: ภาพในท่อนนี้เป็น "${g.room}" แต่เนื้อเรื่องพูดถึง "${r}" ${n} ครั้ง (พูดถึง${g.room} ${nOwn} ครั้ง) → คำพูดกับภาพอาจไม่ตรงกัน ย้ายประโยคไปท่อน "${r}" หรือแก้เนื้อเรื่อง`);
    });
    if (t.replace(/\s/g, '').length > 60 && nOwn === 0) hints.push(`${tag}: เนื้อเรื่องไม่มีคำที่บอกว่ากำลังพูดถึง "${g.room}" เลย ลองอ่านเทียบกับภาพ`);
  });
  // พูดถึงห้อง/พื้นที่ที่ไม่มีรูปเลยทั้งคลิป
  const all = scriptSegments().map(g => g.text || '').join(' ');
  Object.keys(ROOM_KW).forEach(r => { if (r === 'ห้องนอนใหญ่' || have.has(r) || (r === 'ห้องนอน' && have.has('ห้องนอนใหญ่'))) return; const n = countKw(all, ROOM_KW[r]); if (n >= 2) issues.push(`เนื้อเรื่องพูดถึง "${r}" ${n} ครั้ง แต่ไม่มีรูปที่ติดป้าย "${r}" เลย → ผู้ชมจะไม่เห็นภาพตรงกับคำพูด เพิ่มรูปหรือตัดประโยคออก`); });
  return { issues, hints };
}
function openFactCheck() {
  const nv = checkNarrationVsPhotos(), { issues, seen } = checkScriptFacts(), d = document.createElement('div'); d.className = 'sheet tall'; d.id = 'checkSheet';
  d.innerHTML = `<div class="sh-head"><b>🔍 ตรวจสคริปต์: ตัวเลข + เรื่องกับภาพ</b><button class="ib" data-a="x" aria-label="ปิด">✕</button></div>
    <p class="hint">ตรวจตัวเลข (ห้องนอน ห้องน้ำ พื้นที่ ที่ดิน ราคา ระยะทาง เวลาเดินทาง) เทียบกับ 🏠 ข้อมูลบ้านและพิกัดที่คุณกรอก · พบตัวเลข ${seen.length} จุด</p>
    <p class="hint"><b>เนื้อเรื่องเข้ากับภาพไหม</b> (เทียบคำในสคริปต์กับป้ายห้องที่ติดรูปไว้)</p>
    ${nv.issues.length ? `<div class="soon" style="text-align:left;border-color:#b00020">${nv.issues.map(x => '⚠️ ' + x).join('<br><br>')}</div>` : '<div class="soon" style="text-align:left;border-color:#2e7d4f;color:#1e6b3a">✅ ไม่พบจุดที่เนื้อเรื่องขัดกับป้ายห้องของภาพ</div>'}
    ${nv.hints.length ? `<div class="soon" style="text-align:left">💡 ${nv.hints.join('<br><br>💡 ')}</div>` : ''}
    <p class="hint"><b>ข้อจำกัด:</b> แอปมองเนื้อหาในรูปจริงไม่ได้ ตรวจได้เฉพาะจาก <b>ป้ายห้องที่คุณติดรูปไว้</b> ถ้าติดป้ายผิด (เช่น รูปครัวติดป้ายห้องนอน) แอปจะไม่รู้ ให้ดูรูปย่อในขั้น 2 อีกรอบ</p>
    <p class="hint"><b>ตัวเลขในสคริปต์</b></p>
    ${issues.length ? `<div class="soon" style="text-align:left;border-color:#b00020">${issues.map(x => '⚠️ ' + x).join('<br><br>')}</div>` : '<div class="soon" style="text-align:left;border-color:#2e7d4f;color:#1e6b3a">✅ ไม่พบตัวเลขที่ขัดกับข้อมูลบ้านที่กรอกไว้</div>'}
    <p class="hint"><b>สิ่งที่ปุ่มนี้ตรวจไม่ได้ ต้องอ่านตรวจเอง:</b> ชื่อสถานที่ จุดเด่นหรือสิ่งอำนวยความสะดวกที่ไม่มีตัวเลข (เช่น "สระส่วนตัว" "วิวภูเขา") ตัวเลขที่เขียนเป็นคำ (เช่น "สามห้องนอน") และข้อความโฆษณาเกินจริง</p>
    <button class="btn" data-a="x">ปิด</button>`;
  d.onclick = e => { if (e.target.closest('[data-a=x]')) d.remove(); };
  document.body.appendChild(d);
}

// คำสั่งสำหรับ AI (Google AI Studio) เขียนสคริปต์ยาวตามเป้า
function buildAiPrompt() {
  const f = state.facts, T = segTargets(), lines = [];
  [['ชื่อโครงการ', f.name], ['ห้องนอน', f.beds], ['ห้องน้ำ', f.baths], ['พื้นที่ใช้สอย (ตร.ม.)', f.usable], ['ที่ดิน (ตร.ว.)', f.land], ['ราคา (ล้านบาท)', f.price], ['จุดเด่น', f.highlights]].forEach(([k, v]) => { if (String(v || '').trim()) lines.push(`- ${k}: ${v}`); });
  const near = typeof mapScriptText === 'function' ? mapScriptText(4) : ''; if (near) lines.push('- ระยะทาง (ประมาณการ): ' + near);
  { const pl = placesInClip(); if (pl.length) lines.push('- สถานที่ใกล้บ้านที่มีภาพในคลิปนี้ (จากหน้า "สถานที่ + พิกัด + รูป" ใช้ชื่อและระยะทางตามนี้เท่านั้น ไม่แต่งเพิ่ม): ' + pl.map(x => `${x.p.name} (${x.cat}${x.d ? ` · ห่างจากบ้าน ${fmtKm(x.d.km)} ขับ ~${x.d.min} นาที` : ' · ยังไม่มีพิกัด จึงไม่ระบุระยะทาง'})`).join('; '));
    const named = [...areaLibOrdered(), ...lifeItems(), ...state.items].filter(i => !i.placeId && (i.title || '').trim()).map(i => `${i.title.trim()} (${catLabelOf(i)})`); if (named.length) lines.push('- ภาพอื่นที่ตั้งชื่อไว้ (ใช้ชื่อตามนี้): ' + [...new Set(named)].join(', ')); }
  const segs = scriptSegments().map((g, i) => { const nImg = Math.max(1, segItems(g).length); return `[${String(g.no).padStart(2, '0')}] ${g.label} · เป้าหมาย ${T[g.key]} วินาที (ประมาณ ${T[g.key] * SPEAK_CPS} ตัวอักษร) · มี ${nImg} รูป: เขียนเป็นประโยคสั้นๆ ${nImg} ประโยค ประโยคละ 1 รูป (ประมาณ ${Math.max(2, Math.round(T[g.key] / nImg))} วินาทีต่อประโยค)${g.text.trim() ? ' · ร่างเดิม: ' + g.text.trim() : ''}`; });
  return `คุณคือผู้เขียนสคริปต์พากย์คลิปแนะนำบ้านพักตากอากาศระดับพรีเมียมที่หัวหิน สไตล์ luxury editorial อบอุ่น เป็นกันเอง เล่าเหมือนพาเดินชมบ้านจริง ใช้ภาษาไทยที่พูดแล้วลื่นไหลและน่าฟัง

ข้อมูลบ้าน (ใช้เฉพาะข้อมูลนี้ ห้ามแต่งตัวเลข ราคา หรือสิ่งอำนวยความสะดวกที่ไม่ได้ให้ไว้):
${lines.join('\n') || '- (ไม่มีข้อมูลเพิ่มเติม)'}

ให้เขียนสคริปต์พากย์ทีละท่อนตามรายการนี้ ความยาวรวมประมาณ ${narrTarget()} วินาที โดยแต่ละท่อนให้ยาวตามเป้าหมายที่ระบุ:
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

// ---- สต็อกภาพทำเล: แผงตั้งค่า + เลือก/เอาออกรายรูป ----
const selectedStockIds = () => [...AREA_CATS.flatMap(c => libArea(c.id)), ...libArea('lifestyle')].filter(stockSel).map(i => i.id);
function toggleStock(id) { const cur = new Set(selectedStockIds()); if (cur.has(id)) cur.delete(id); else cur.add(id); state.stock = { mode: 'manual', ids: [...cur], counted: (state.stock && state.stock.counted) || [] }; save(); }
function stockPanelHtml() {
  const C = stockCounts(); if (!C.total) return '';
  const m = (state.stock && state.stock.mode) || 'all', sel = selectedStockIds().length;
  let T = {}; stockBusy = true; try { T = segTargets(); } catch (e) {} stockBusy = false;
  const sec = Math.round((T.area || 0) + (T.life || 0));
  const parts = [...C.raw.filter(r => r[1].length).map(r => `${r[0].label.split(' ')[0]} ${r[1].length}`), ...(C.life.length ? [`ไลฟ์สไตล์ ${C.life.length}`] : [])].join(' · ');
  const used = usedCount => usedCount;
  return `<div class="seg" id="stockPanel"><b>🗂️ สต็อกภาพทำเล (ใช้ร่วมทุกคลิป)</b>
    <p class="hint">ใส่รูปทำเลไว้เยอะๆ ได้ แตะแท็บทำเลสีเขียวเพื่อเพิ่ม/ลบรูป แอปจะเลือกใช้ในแต่ละคลิปตามเวลาที่พอดี และพยายามไม่ใช้รูปซ้ำกับคลิปอื่น</p>
    <label class="sw"><input type="radio" name="stk" value="auto" ${m === 'auto' ? 'checked' : ''}> 🤖 อัตโนมัติ (แนะนำ): แอปเลือกให้พอดีเวลา ไม่ซ้ำคลิปอื่นเท่าที่สต็อกมี</label>
    <label class="sw"><input type="radio" name="stk" value="manual" ${m === 'manual' ? 'checked' : ''}> ✋ เลือกเอง: แตะรูปเพื่อเลือก/เอาออกจากคลิปนี้</label>
    <label class="sw"><input type="radio" name="stk" value="all" ${m === 'all' ? 'checked' : ''}> ใช้ทุกรูปในสต็อก (แบบเดิม)</label>
    <p class="hint">📦 สต็อก ${C.total} รูป (${parts}) → <b>คลิปนี้ใช้ ${m === 'all' ? C.total : sel} รูป</b>${sec ? ` · เวลาช่วงทำเลประมาณ ${sec} วินาที` : ''}</p>
    ${m === 'all' ? '' : '<div class="tools"><button class="ib wide" data-stk="roll">🔄 สุ่มรูปใหม่ให้คลิปนี้</button></div>'}</div>`;
}
// จัดการเหตุการณ์ของแผงสต็อก/รูปในสต็อก คืนค่า true ถ้าจัดการแล้ว
function stockEvent(e) {
  const r = e.type === 'change' && e.target.closest('input[name=stk]');
  if (r) { const cur = selectedStockIds(), keep = (state.stock && state.stock.counted) || [];
    if (r.value === 'auto') autoPickStock(); else if (r.value === 'manual') { state.stock = { mode: 'manual', ids: cur, counted: keep }; save(); } else { state.stock = { mode: 'all', ids: null, counted: keep }; save(); }
    return true; }
  if (e.type === 'click') {
    const b = e.target.closest('[data-stk=roll]'); if (b) { autoPickStock(true); return true; }
    const th = e.target.closest('.th[data-lib]'); if (th && !e.target.closest('[data-del]')) { toggleStock(+th.dataset.id); return true; }
  }
  return false;
}
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
const findItemById = id => [...lib.area, ...state.items].find(x => x.id === id);
const placeSubOf = it => { if (!it.placeId) return ''; const dd = placeDistances().find(x => x.id === it.placeId); return dd ? `ห่างจากบ้าน ${fmtKm(dd.km)} · ขับ ~${dd.min} นาที` : ''; };
const catLabelOf = it => it.cat ? (AREA_CATS.find(c => c.id === it.cat) || {}).label || '' : (it.room || '');
const stockThumbOf = it => !!it.cat && typeof stockOn === 'function' && stockOn();
const thumbHtml = (it, del) => `<div class="th${stockThumbOf(it) && !stockSel(it) ? ' off' : ''}" data-id="${it.id}"${it.cat ? ' data-lib="1"' : ''}>${stockThumbOf(it) ? (stockSel(it) ? '<span class="tick">✓</span>' : '') : ''}${(it.title || '').trim() ? `<span class="ttl">${String(it.title).replace(/</g, '&lt;')}</span>` : ''}${it.type === 'video' ? `<video src="${urlOf(it)}#t=0.1" muted playsinline></video><span class="vb">🎬 ${Math.round(+it.dur || 0) || ''}${it.dur ? ' วิ' : ''}</span>` : `<img src="${urlOf(it)}" alt="">`}${itemCap(it) ? `<span class="cap">${itemCap(it)}</span>` : ''}${del ? `<button class="x" data-del="${it.id}" aria-label="ลบ">✕</button>` : ''}</div>`;

// เส้นสถานะสคริปต์ใต้หัวข้อกลุ่ม: เขียว+ยาวตามความยาวสคริปต์ = เขียนแล้ว · ส้มเต็มเส้น = ยังไม่เขียน
function scriptBarHtml(sl) {
  const t = getSlotScript(sl); if (t === null) return '';
  const sec = secOf(t), has = sec > 0, pct = Math.min(100, Math.round(sec / 15 * 100));
  return `<div class="sbar ${has ? 'ok' : 'no'}"><i style="width:${has ? Math.max(pct, 8) : 100}%"></i></div><small class="sbl ${has ? 'ok' : 'no'}">📝 ${has ? `เขียนสคริปต์แล้ว ~${sec} วิ${sl.cat && sl.cat !== 'lifestyle' ? ' (ใช้ร่วมกันทั้งทำเล)' : ''}` : 'ยังไม่ได้เขียนสคริปต์'}</small>`;
}

const sceneModeHtml = sl => `<label class="sw"><input type="radio" name="tmode" value="builtin" ${lib[sl.id + 'Builtin'] ? 'checked' : ''}> 🎬 ใช้${sl.id === 'title' ? 'ไตเติล' : 'เครดิตปิด'}ของแอป (มาสคอต Huahin Properties)</label>
  <label class="sw"><input type="radio" name="tmode" value="custom" ${lib[sl.id + 'Builtin'] ? '' : 'checked'}> ใช้ไฟล์ของฉันเอง</label>
  ${lib[sl.id + 'Builtin'] ? `<canvas id="scenePrev" class="rprev"></canvas><p class="hint">${sl.id === 'title' ? 'มาสคอตโผล่มาโบกมือ พร้อมชื่อแบรนด์ สโลแกน และชื่อโครงการ (จาก 🏠 ข้อมูลบ้าน)' : 'มาสคอตส่งกุญแจบ้าน พร้อมเบอร์โทร/LINE ตามที่ตั้งในแท็บ ☎️ ติดต่อ'} · ต่อเข้า MP4 ให้อัตโนมัติ</p>
    <div class="seg"><b>✏️ แก้ข้อความ (ตั้งครั้งเดียว ใช้กับทุกคลิป)</b>
      ${(sl.id === 'title' ? [['greeting', 'คำทักทาย', BRAND_DEFAULT.greeting], ['tagline', 'สโลแกน', BRAND_DEFAULT.tagline], ['subtitle', 'บรรทัดล่าง (เว้นว่าง = ใช้ชื่อโครงการของแต่ละบ้านอัตโนมัติ)', 'เช่น บ้านพักตากอากาศ หัวหิน']] : [['thanks', 'ข้อความขอบคุณ', BRAND_DEFAULT.thanks], ['invite', 'ข้อความเชิญติดต่อ', BRAND_DEFAULT.invite], ['tagline', 'สโลแกน', BRAND_DEFAULT.tagline]]).map(([k, lab, ph]) => `<label class="fl"><span>${lab}</span><input class="ct" data-b="${k}" placeholder="${ph}" value="${esc((lib.brand || {})[k] || '')}"></label>`).join('')}
      <p class="hint">เว้นว่าง = ใช้ข้อความมาตรฐาน · เบอร์โทร/LINE ตั้งที่แท็บ ☎️ ติดต่อ (ตั้งครั้งเดียวเช่นกัน)</p></div>` : '<p class="hint">ไฟล์รูปจะถูกต่อเข้า MP4 (คลิปวิดีโอยังไม่รองรับ)</p>'}`;

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
    ${sl.id === 'title' || sl.id === 'close' ? sceneModeHtml(sl) : ''}
    ${sl.cat ? `<button class="btn alt" data-a="places">📍 จัดการสถานที่ (ชื่อ + พิกัด + รูป)</button>${stockPanelHtml()}` : ''}
    ${sl.kind === 'contact' ? contactCardHtml() : ((sl.id === 'title' || sl.id === 'close') && lib[sl.id + 'Builtin']) ? '' : `<button class="btn" data-a="add">${sl.max1 && items.length ? '↻ เปลี่ยนไฟล์' : '+ เพิ่มรูป / คลิป'}</button>
      ${items.length ? `${sl.kind !== 'contact' && !sl.max1 ? '<p class="hint">✏️ พิมพ์ชื่อใต้รูปได้ (ชื่อรูปทำเล/สถานที่ ใช้ดึงไปเขียนสคริปต์และพากย์เท่านั้น ไม่ขึ้นป้ายบนภาพ · ชื่อรูปของตัวบ้านขึ้นป้ายบนภาพได้)</p>' : ''}<div class="sgrid" id="pgrid">${items.map(it => sl.max1 ? thumbHtml(it, true) : `<div class="thn">${thumbHtml(it, true)}<input class="ct nm" data-nm="${it.id}" maxlength="60" placeholder="${(sl.ph || 'ตั้งชื่อรูป').replace(/"/g, '')}" value="${esc(it.title || '')}"></div>`).join('')}</div>` : ''}`}
    ${sc !== null ? `<label class="sl"><span>📝 สคริปต์ของช่วงนี้${sl.cat && sl.cat !== 'lifestyle' ? ' (ใช้ร่วมกันทั้ง 4 แท็บทำเล)' : ''}</span></label><textarea class="sct" id="slotScript" rows="3" placeholder="พิมพ์เรื่องเล่าของช่วงนี้ (ไม่ใส่ก็ได้ เขียนทีหลังได้ที่ขั้น 4)">${sc.replace(/</g, '&lt;')}</textarea>` : ''}
    <button class="btn" data-a="x">เสร็จ</button>`;
  d.onclick = async e => {
    if (sl.cat && stockEvent(e)) { updateSb(); openSlot(id); return; }
    if (e.target.closest('[data-a=places]')) { openPlaces(() => { updateSb(); openSlot(id); }); return; }
    if (e.target.closest('[data-a=x]')) { d.remove(); refreshAll(); return; }
    if (e.target.closest('[data-a=rmroute]')) { if (confirm('ลบคลิปเส้นทางรถวิ่ง?')) { state.routeData = null; await save(); updateSb(); openSlot(id); } return; }
    if (e.target.closest('[data-a=genroute]')) { const st = d.querySelector('#routeStat'), btn = e.target.closest('[data-a=genroute]'); btn.disabled = true; try { const rd = await buildRouteData(st); if (rd) { state.routeData = rd; state.skipMap = false; await save(); updateSb(); openSlot(id); } } catch (err) { st.textContent = '❌ สร้างไม่สำเร็จ (ต่อเน็ตอยู่ไหม?) ' + (err.message || err); } btn.disabled = false; return; }
    if (e.target.closest('[data-a=genmap]')) { const st = d.querySelector('#genStat'), btn = e.target.closest('[data-a=genmap]'); btn.disabled = true; const n = await generateMapImages(st); btn.disabled = false; if (n) { updateSb(); openSlot(id); } return; }
    if (e.target.closest('[data-a=add]')) { const fs = await pickFiles('image/*,video/*', !sl.max1); if (fs.length) { await addToSlot(sl, fs); updateSb(); openSlot(id); } return; }
    const b = e.target.closest('[data-del]'); if (b && confirm('ลบไฟล์นี้ใช่ไหม?')) { await removeFromSlot(sl, +b.dataset.del); updateSb(); openSlot(id); }
  };
  d.addEventListener('input', e => { if (e.target.dataset && e.target.dataset.nm) { const it = findItemById(+e.target.dataset.nm); if (it) { it.title = e.target.value; if (it.placeId) { const pl = lib.places.find(p => p.id === it.placeId); if (pl) { pl.name = e.target.value; placePhotos(pl).forEach(x => { x.title = e.target.value; }); } } if (it.cat) saveLib(); else save(); } return; } if (e.target.id === 'slotScript') setSlotScript(sl, e.target.value); if (e.target.dataset.b) { lib.brand[e.target.dataset.b] = e.target.value; saveLib(); } });
  d.addEventListener('change', async e => { if (sl.cat && stockEvent(e)) { updateSb(); openSlot(id); return; } if (e.target.name === 'tmode') { lib[id + 'Builtin'] = e.target.value === 'builtin'; await saveLib(); updateSb(); openSlot(id); return; } if (e.target.id === 'skipMap') { state.skipMap = e.target.checked; save(); updateSb(); } });
  if (sl.kind === 'contact') bindContact(d, () => openSlot(id));
  document.body.appendChild(d);
  const sp = d.querySelector('#scenePrev'); if (sp) { const z = sizeInfo(); sp.width = Math.round(z.w / 3); sp.height = Math.round(z.h / 3); previewScene(sp, id); }
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
    <p class="hint">แตะแท็บเพื่อเพิ่มรูป/คลิป ไม่ต้องเรียงลำดับ · ชุดบน (เขียว ✓) = มีข้อมูลแล้ว เพิ่ม/แก้ได้ · ชุดล่าง: แดง ● = จำเป็น · ส้ม ! = แนะนำ · เส้นประ = ข้ามได้</p>
    <div class="chips" id="chips"></div>
    <div class="tools"><button class="ib wide" id="btnFacts">🏠 ข้อมูลบ้าน</button><button class="ib wide danger" id="btnDraft">✨ ร่างสคริปต์ให้</button></div>
    <div id="gallery"></div>
    <div id="doneBar"></div>`;
  const renderChips = () => {
    const el = $('#chips'); if (!el) return;
    const chip = x => `<button class="chip st-${slotStatus(x)}" data-s="${x.id}">${x.ico} ${x.short} <i>${x.id === 'map' && state.skipMap && !slotCount(x) ? '⏭ ข้าม' : mark[slotStatus(x)]}</i></button>`;
    const stk = SLOTS.filter(x => x.kind === 'lib' && x.cat), stkChip = x => { const n = slotCount(x), st = slotStatus(x); return `<button class="chip ${st === 'info' ? 'stk-empty' : 'st-' + st}" data-s="${x.id}">${x.ico} ${x.short} <i>${n ? (st === 'ok' ? '✓ ' + n : mark[st] + ' ' + n) : (st === 'miss' ? '●' : '＋')}</i></button>`; };
    const rank = { miss: 0, warn: 1, info: 2, ok: 3 }, others = SLOTS.filter(x => !stk.includes(x)), have = others.filter(x => slotStatus(x) === 'ok'), rest = others.filter(x => slotStatus(x) !== 'ok').sort((p, q) => rank[slotStatus(p)] - rank[slotStatus(q)]);
    el.className = 'chips2';
    el.innerHTML = `<div class="chgt">🗂️ สต็อกภาพทำเล (ใช้ร่วมทุกคลิป) · สถานที่สำคัญ โรงพยาบาล ห้าง สวนน้ำ กอล์ฟ ฯลฯ ใส่ที่ปุ่ม 📍 ท้ายแถว (ชื่อ + พิกัด + รูป/คลิป)</div><div class="chrow">${stk.map(stkChip).join('')}<button class="chip stk-empty" data-places="1">📍 สถานที่ + พิกัด + รูป (${lib.places.length} แห่ง · ${lib.area.filter(x => x.placeId).length} รูป/คลิป)</button></div>
      ${have.length ? `<div class="chgt">✅ มีข้อมูลแล้ว (${have.length}) · แตะเพื่อเพิ่ม/แก้ไข</div><div class="chrow">${have.map(chip).join('')}</div>` : ''}${rest.length ? `<div class="chgt">📭 ยังไม่มีข้อมูล (${rest.length}) · แตะเพื่อใส่</div><div class="chrow">${rest.map(chip).join('')}</div>` : ''}`;
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
      if ((sl.id === 'title' || sl.id === 'close') && lib[sl.id + 'Builtin']) {
        done.push(`<div class="gsec" data-sec="${sl.id}"><div class="gh"><b>${sl.ico} ${sl.id === 'title' ? 'ไตเติลของแอป (มาสคอต)' : 'เครดิตปิดของแอป (มาสคอต)'}</b><button class="ib sm" data-open="${sl.id}">จัดการ</button></div><canvas class="sprev" data-scene="${sl.id}"></canvas></div>`); return;
      }
      const items = slotItems(sl);
      if (!items.length) return;
      const sc = getSlotScript(sl), noScript = sc !== null && secOf(sc) === 0;
      (noScript ? todo : done).push(`<div class="gsec${noScript ? ' gmiss' : ''}" data-sec="${sl.id}"><div class="gh"><b>${sl.ico} ${sl.label.replace(/ \(.*\)/, '')} · ${items.length}</b><button class="ib sm" data-open="${sl.id}">+ เพิ่ม</button></div>
        ${scriptBarHtml(sl)}
        ${fitMeterHtml(sl)}
        <div class="sgrid" data-grid="${sl.id}">${items.map(it => thumbHtml(it, true)).join('')}</div></div>`);
    });
    { const orp = orphanItems(); if (orp.length) {
      const opts = SLOTS.filter(x => x.kind === 'room').map(x => `<option value="${x.room}">${x.ico} ${x.short}</option>`).join('');
      todo.unshift(`<div class="gsec gmiss" data-sec="orphan"><div class="gh"><b>⚠️ รูปที่ยังไม่ได้จัดเข้าแท็บ · ${orp.length}</b></div><p class="hint">รูปเหล่านี้ใส่ไว้ก่อนมีแท็บ เลือกว่าเป็นของแท็บไหน หรือกด ✕ ลบ (ต้องจัดให้ครบก่อนไปขั้นต่อไป)</p>
        <div class="sgrid">${orp.map(it => `<div class="th orp" data-id="${it.id}">${it.type === 'video' ? `<video src="${urlOf(it)}#t=0.1" muted playsinline></video>` : `<img src="${urlOf(it)}" alt="">`}<button class="x" data-del="${it.id}" aria-label="ลบ">✕</button><select class="mv" data-mv="${it.id}"><option value="">ย้ายไป…</option>${opts}</select></div>`).join('')}</div></div>`); } }
    if (state.routeData) done.push(`<div class="gsec" data-sec="route"><div class="gh"><b>🚗 คลิปเส้นทางรถวิ่งเข้าบ้าน</b><button class="ib sm" data-open="map">จัดการ</button></div><p class="hint">${state.routeData.size === state.size ? `ต่อเข้า MP4 อัตโนมัติ (~${ROUTE_DUR} วินาที) หลังภาพแผนที่` : '⚠️ สร้างไว้สำหรับขนาดคลิปอื่น กด จัดการ เพื่อสร้างใหม่'}</p></div>`);
    const html = stockPanelHtml() + (todo.length ? `<h3 class="gtitle todo">⏳ ยังไม่เรียบร้อย (${todo.length})</h3>${todo.join('')}` : '')
      + (done.length ? `<h3 class="gtitle done">✅ เรียบร้อยแล้ว (${done.length})</h3>${done.join('')}` : '');
    g.innerHTML = html || '<div class="soon">ยังไม่มีไฟล์ แตะแท็บด้านบนเพื่อเริ่มเพิ่มรูป/คลิป</div>';
    g.querySelectorAll('[data-scene]').forEach(cv => { const z = sizeInfo(); cv.width = Math.round(z.w / 5); cv.height = Math.round(z.h / 5); paintSceneFrame(cv, cv.dataset.scene, cv.dataset.scene === 'title' ? 3.5 : 4); });
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
      <p class="hint">⏱ ความยาวคลิปโดยประมาณ <b>${mmss(Math.round(predictedTotal()))}</b> จากเป้า ${mmss(state.clipSec)}${state.stretch ? '' : ' · (ปิดการยืดเวลา)'}</p>
      <button class="btn" id="toColor" ${miss.length ? 'disabled' : ''}>ถัดไป: 3 สี →</button>`;
    $('#toColor').onclick = () => go(2);
  };
  refreshAll = () => { renderChips(); renderGallery(); renderDone(); };
  refreshChips = () => { if ($('#chips')) { renderChips(); renderDone(); } };
  $('#chips').onclick = e => { const b = e.target.closest('.chip'); if (!b) return; if (b.dataset.places) { openPlaces(() => { updateSb(); refreshAll(); }); return; } openSlot(b.dataset.s); };
  $('#gallery').onchange = async e => {
    if (stockEvent(e)) { updateSb(); refreshAll(); return; }
    const m = e.target.closest('[data-mv]'); if (!m || !m.value) return;
    const it = state.items.find(x => x.id === +m.dataset.mv); if (it) { it.room = m.value; await save(); updateSb(); refreshAll(); }
  };
  $('#gallery').onclick = async e => {
    if (stockEvent(e)) { updateSb(); refreshAll(); return; }
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
// ท่อนเปิดคลิป (ฉากไตเติล) และท่อนปิดท้าย/ติดต่อ (ฉากเครดิต) — พูดด้วยเสียงเหมือนท่ออื่น แก้ข้อความเองได้
const spokenPhone = ph => String(ph || '').replace(/\D/g, '').split('').join(' ');
function openDefault() {
  const B = BR(), nm = (state.facts.name || '').trim();
  return `${B.greeting} ยินดีต้อนรับสู่ Huahin Properties วันนี้ผมจะพาไปชมบ้านพักตากอากาศที่หัวหิน${nm ? ' ' + nm : ''}`;
}
function closeDefault() {
  const B = BR(), ct = activeContact();
  if (!ct || !(ct.phone || '').trim()) return `${B.thanks} ติดต่อสอบถามข้อมูลเพิ่มเติมได้ที่ Huahin Properties`;
  return `${B.thanks} ${B.invite}${(ct.name || '').trim() ? ' ' + ct.name.trim() : ' Huahin Properties'} โทร ${spokenPhone(ct.phone)}${(ct.line || '').trim() ? ' หรือแอดไลน์ ' + ct.line.trim() : ''}`;
}
// ---- ฮุกเปิดคลิป: ภาพบ้านที่เด่นที่สุด + เสียงบอกจุดเด่นทันที ใน 5–10 วินาทีแรก ก่อนไตเติลและพาไปดูทำเล ----
const isHeroId = id => typeof id === 'string' && id.startsWith('hero:');
function heroItem() {
  if (state.hookOn === false) return null;
  const imgs = state.items.filter(i => i.type === 'image'); if (!imgs.length) return null;
  const pick = (state.hero && imgs.find(i => i.id === state.hero.id)) || imgs.find(i => i.room === 'หน้าบ้าน/ภายนอก') || imgs.find(i => i.room === 'สระว่ายน้ำ') || imgs[0];
  return { id: 'hero:' + pick.id, srcId: pick.id, blob: pick.blob, type: 'image', room: '', name: pick.name, title: pick.title };
}
function hookDefault() {
  const f = state.facts, n = v => String(v || '').trim(), num = v => /^[\d.,]+$/.test(n(v)), bits = [];
  if (n(f.beds)) bits.push(`${n(f.beds)} ห้องนอน`); if (n(f.baths)) bits.push(`${n(f.baths)} ห้องน้ำ`);
  const x = num(f.price) ? Number(n(f.price).replace(/,/g, '')) : null, price = x == null ? n(f.price) : (x < 1000 ? `${x} ล้านบาท` : `${x.toLocaleString('th-TH')} บาท`);
  return `${n(f.name) ? 'นี่คือ ' + n(f.name) : 'นี่คือบ้านพักตากอากาศที่หัวหิน'} ${bits.join(' ')}${n(f.highlights) ? ' ' + n(f.highlights) : ''}${price ? ' ราคา ' + price : ''}`.replace(/\s+/g, ' ').trim();
}
const hookDur = () => { const au = segAudioSec().hook; if (au != null) return Math.min(12, Math.max(5, au + 0.35)); const g = scriptSegmentsAll().find(x => x.key === 'hook'); return g ? Math.min(10, Math.max(5, secOf(g.text) + 0.8)) : 5; };

// ---- บทเสียงแบ่งช่วงตามภาพ (Beat sheet): 1 ช่วง = ข้อความสั้นๆ + รูปที่แสดงตอนพูดช่วงนั้น + เวลา · ใช้สร้างเสียงทีละช่วงที่ AI Studio แล้วแก้เฉพาะช่วงได้ ----
function cutText(t, m) {
  t = String(t || '').trim().replace(/\s+/g, ' '); if (m <= 1) return [t];
  const parts = []; let rest = t;
  for (let k = m; k > 1; k--) {
    const target = Math.round(rest.length / k); let best = -1, bd = 1e9;
    for (let i = 1; i < rest.length - 1; i++) if (rest[i] === ' ') { const d = Math.abs(i - target); if (d < bd) { bd = d; best = i; } }
    if (best < 0) break; parts.push(rest.slice(0, best).trim()); rest = rest.slice(best + 1);
  }
  parts.push(rest.trim()); return parts.filter(Boolean);
}
const segItems = g => (g.key === 'life' ? lifeItems() : g.key === 'area' ? areaItems() : state.items.filter(i => i.room === g.room)).filter(isMedia);
function beatsList() {
  const out = [], sc = state.script;
  scriptSegmentsAll().forEach(g => {
    const t = (g.text || '').trim(); if (!t) return;
    if (g.edge) { out.push({ id: g.key, segKey: g.key, no: g.key === 'open' ? 'เปิด' : g.key === 'hook' ? 'ฮุก' : 'ปิด', label: g.label, text: t, imgs: [], share: 1, edge: true }); return; }
    const its = segItems(g), n = Math.max(1, its.length), norm = t.replace(/\s+/g, ' ');
    const stored = sc.beats && sc.beats[g.key], parts = stored && stored.join(' ') === norm ? stored.slice() : cutText(norm, Math.min(n, Math.max(1, Math.floor(norm.length / 25))));
    const m = parts.length, tot = parts.reduce((x, p) => x + p.length, 0) || 1;
    parts.forEach((p, i) => { const a0 = Math.floor(i * its.length / m), b0 = Math.max(a0 + 1, Math.floor((i + 1) * its.length / m)); out.push({ id: `${g.key}#${i + 1}`, segKey: g.key, no: `${String(g.no).padStart(2, '0')}.${i + 1}`, label: g.label, text: p, imgs: its.slice(a0, b0), share: p.length / tot, edge: false, idx: i }); });
  });
  return out;
}
function beatMap() { const m = new Map(); beatsList().forEach(b => b.imgs.forEach(i => m.set(i.id, b))); return m; }
const audStore = () => (state.audio.mode === 'beats' ? (state.audio.beatAud = state.audio.beatAud || {}) : state.audio.chunks);
const audKey = (i, c) => (state.audio.mode === 'beats' ? c.keys[0] : i + 1);
function beatAudioSec(id) { const A = state.audio, a = (A.beatAud || {})[id]; return a && a.dur ? a.dur : null; }
function setSegText(key, v) { const sc = state.script; if (key === 'hook') sc.hook = v; else if (key === 'open') sc.open = v; else if (key === 'close') sc.close = v; else if (key === 'life') sc.life = v; else if (key === 'area') sc.area = v; else sc.rooms[key.slice(5)] = v; }
function scriptSegmentsAll() {
  const mid = scriptSegments(), out = [];
  if (lib.titleBuiltin) out.push({ no: 0, key: 'open', label: 'เปิดคลิป (ฉากไตเติล)', text: state.script.open != null ? state.script.open : openDefault(), edge: true });
  if (heroItem()) out.push({ no: -1, key: 'hook', label: 'ภาพเด่น + จุดเด่น (ฮุกต่อจากไตเติล)', text: state.script.hook != null ? state.script.hook : hookDefault(), edge: true });
  out.push(...mid);
  if (lib.closeBuiltin) out.push({ no: mid.length + 1, key: 'close', label: 'ปิดท้าย + ติดต่อ (ฉากเครดิต)', text: state.script.close != null ? state.script.close : closeDefault(), edge: true });
  return out;
}
// แบ่งสคริปต์เป็นช่วงสำหรับสร้างเสียง: ท่อนเปิด/ปิดแยกเป็นช่วงของตัวเอง ท่อนกลางรวมกันไม่เกิน ~700 ตัวอักษร (ลำดับช่วง = ชื่อไฟล์เสียง 01, 02, ...)
function ttsChunks() {
  if (state.audio && state.audio.mode === 'beats') return beatsList().map(b => ({ keys: [b.id], nos: [b.no], texts: [b.text], len: b.text.length, edge: !!b.edge, beat: b }));
  const chunks = []; let cur = null;
  scriptSegmentsAll().filter(g => g.text.trim()).forEach(g => {
    const t = g.text.trim();
    if (g.edge || !cur || cur.edge || cur.len + t.length > 700) { cur = { keys: [], nos: [], texts: [], len: 0, edge: !!g.edge }; chunks.push(cur); }
    cur.keys.push(g.key); cur.nos.push(g.edge ? (g.key === 'open' ? 'เปิด' : g.key === 'hook' ? 'ฮุก' : 'ปิด') : String(g.no).padStart(2, '0')); cur.texts.push(t); cur.len += t.length;
  });
  return chunks;
}
const chunkSig = c => { let h = 0; const t = c.texts.join('|'); for (let i = 0; i < t.length; i++) h = (h * 31 + t.charCodeAt(i)) | 0; return h; };
// วิเคราะห์ไฟล์เสียงยาว: หาจุดเริ่ม-จบของเสียงพูด และ "ช่วงเงียบ" ระหว่างย่อหน้า (ใช้ตัดแบ่งท่อน)
function analyzeAudio(buf) {
  const sr = buf.sampleRate, ch = []; for (let c = 0; c < buf.numberOfChannels; c++) ch.push(buf.getChannelData(c));
  const hop = Math.round(sr * 0.01), n = Math.floor(buf.length / hop), rms = new Float32Array(n);
  for (let f = 0; f < n; f++) { let sum = 0; const a = f * hop, e = Math.min(buf.length, a + hop * 2); for (let i = a; i < e; i += 2) { let v = 0; for (let c = 0; c < ch.length; c++) v += ch[c][i]; v /= ch.length; sum += v * v; } rms[f] = Math.sqrt(sum / ((e - a) / 2)); }
  const sorted = Array.from(rms).sort((x, y) => x - y), ref = sorted[Math.floor(n * 0.95)] || 0.01, thr = Math.max(ref * 0.05, 0.0015);
  const silent = f => rms[f] < thr; let first = 0, last = n - 1; while (first < n && silent(first)) first++; while (last > first && silent(last)) last--;
  const pauses = []; let f = first;
  while (f <= last) { if (silent(f)) { let g = f; while (g <= last && silent(g)) g++; const dur = (g - f) * 0.01; if (dur >= 0.2) pauses.push({ t: (f + g) / 2 * 0.01, dur }); f = g; } else f++; }
  return { dur: buf.duration, start: first * 0.01, end: (last + 1) * 0.01, pauses };
}
// แบ่งไฟล์เสียงเดียวเป็นท่อน: เลือก "ช่วงเงียบ" ที่ใกล้ตำแหน่งที่คาดไว้ (ตามความยาวข้อความ) และยาวที่สุด ด้วย DP
function alignSegments(lengths, an, adj, keys) {
  const N = lengths.length, total = lengths.reduce((a, b) => a + b, 0) || 1, L = Math.max(0.5, an.end - an.start);
  const cum = []; let c = 0; lengths.forEach(l => { c += l; cum.push(c); });
  const exp = k => an.start + L * cum[k - 1] / total; // ตำแหน่งขอบก่อนท่อน k (k=1..N-1)
  const cand = an.pauses.filter(p => p.t > an.start + 0.3 && p.t < an.end - 0.3);
  const opts = []; for (let k = 1; k < N; k++) opts[k] = [...cand.map(p => ({ t: p.t, dur: p.dur, fb: false })), { t: exp(k), dur: 0, fb: true }];
  const cost = (k, o) => Math.abs(o.t - exp(k)) / L * 8 + (o.fb ? 1.0 : -Math.min(o.dur, 1.5) * 2.0); // ช่วงเงียบยาว = น่าจะเป็นรอยต่อย่อหน้า
  const best = [], back = [];
  for (let k = 1; k < N; k++) {
    best[k] = []; back[k] = [];
    opts[k].forEach((o, i) => {
      let bv = Infinity, bj = -1;
      if (k === 1) { if (o.t > an.start + 0.2) { bv = cost(k, o); bj = -2; } }
      else opts[k - 1].forEach((p, j) => { if (best[k - 1][j] < Infinity && o.t > p.t + 0.4) { const v = best[k - 1][j] + cost(k, o); if (v < bv) { bv = v; bj = j; } } });
      best[k][i] = bv; back[k][i] = bj;
    });
  }
  const chosen = []; if (N > 1) {
    let bi = -1, bv = Infinity; best[N - 1].forEach((v, i) => { if (v < bv) { bv = v; bi = i; } });
    if (bi < 0) { for (let k = 1; k < N; k++) chosen[k] = { t: exp(k), fb: true }; }
    else for (let k = N - 1; k >= 1; k--) { chosen[k] = opts[k][bi]; bi = back[k][bi]; }
  }
  const b = [Math.max(0, an.start - 0.08)]; for (let k = 1; k < N; k++) b.push(chosen[k].t + ((adj || {})[keys[k]] || 0)); b.push(Math.min(an.dur, an.end + 0.15));
  return keys.map((key, i) => ({ key, a0: b[i], a1: Math.max(b[i] + 0.3, b[i + 1]), found: i === 0 ? true : !chosen[i].fb }));
}
function singleAlign() {
  const S = state.audio.single; if (!S || !S.an) return null;
  const segs = scriptSegmentsAll().filter(g => g.text.trim()); if (!segs.length) return null;
  return alignSegments(segs.map(g => g.text.trim().length), S.an, S.adj || {}, segs.map(g => g.key));
}
// ความยาวเสียงจริงของแต่ละท่อน: ไฟล์เดียว = ตามช่วงเงียบที่จับได้ · แยกช่วง = แบ่งตามสัดส่วนความยาวข้อความ
function segAudioSec() {
  const out = {}, A = state.audio || {};
  if (A.mode === 'single') { const al = A.single && singleAlign(); if (al) al.forEach(x => { out[x.key] = x.a1 - x.a0; }); return out; }
  ttsChunks().forEach((c, i) => { const a = audStore()[audKey(i, c)]; if (!a || !a.dur) return; c.keys.forEach((k, j) => { out[k] = a.dur * c.texts[j].length / c.len; }); });
  if (A.mode === 'beats') { const by = {}; beatsList().forEach(b => { if (!b.edge) (by[b.segKey] = by[b.segKey] || []).push(b); }); Object.entries(by).forEach(([k, bs]) => { if (bs.every(b => out[b.id] != null)) out[k] = bs.reduce((s, b) => s + out[b.id] + 0.25, 0) - 0.25; }); }
  return out;
}
// ความยาวฉากเปิด/ปิด ปรับตามความยาวเสียงพูด (อย่างน้อยเท่าค่ามาตรฐาน)
const titleDur = () => { const au = segAudioSec().open; if (au != null) return Math.max(TITLE_DUR, au + 0.3); const g = scriptSegmentsAll().find(x => x.key === 'open'); return g ? Math.max(TITLE_DUR, secOf(g.text) + 1.5) : TITLE_DUR; };
const closeDur = () => { const au = segAudioSec().close; if (au != null) return Math.max(CLOSE_DUR, au + 1.5); const g = scriptSegmentsAll().find(x => x.key === 'close'); return g ? Math.max(CLOSE_DUR, secOf(g.text) + 2) : CLOSE_DUR; };

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


function openBeatSheet() {
  document.querySelector('#beatSheet')?.remove();
  const beats = beatsList(), A = state.audio; if (!beats.length) { alert('ยังไม่มีสคริปต์ให้แบ่งช่วง'); return; }
  let TL = {}; try { TL = computeTimeline().starts; } catch (e) {}
  const est = b => { const au = beatAudioSec(b.id); return au != null ? au : Math.max(2, b.text.length / SPEAK_CPS); };
  const row = (b, i) => `<div class="seg" data-bi="${i}"><div class="seg-h"><b>${b.no} · ${b.label}</b><span class="badge" data-bt="${i}">เริ่ม ${fmtSec(TL[b.id] != null ? TL[b.id] : (TL[b.segKey] || 0))} · ~${est(b).toFixed(1)} วิ</span></div>
    ${b.imgs.length ? `<div class="mini">${b.imgs.slice(0, 3).map(im => `<img src="${urlOf(im)}" alt="">`).join('')}<small>${b.imgs.length} รูป</small></div>` : ''}
    <textarea rows="2" data-b="${i}">${b.text.replace(/</g, '&lt;')}</textarea>
    <div class="tools"><button class="ib wide" data-bc="${i}">📋 คัดลอกช่วงนี้</button><small class="hint" data-bs="${i}">${beatAudioSec(b.id) != null ? '✅ มีเสียงแล้ว ' + beatAudioSec(b.id).toFixed(1) + ' วิ' : '⬜ ยังไม่มีเสียง'}</small></div></div>`;
  const d = document.createElement('div'); d.className = 'sheet tall'; d.id = 'beatSheet';
  d.innerHTML = `<div class="sh-head"><b>🎙️ บทเสียงแบ่งช่วงตามภาพ</b><button class="ib" data-a="x" aria-label="ปิด">✕</button></div>
    <p class="hint">แต่ละช่วงคือ <b>ข้อความสั้นๆ ที่พูดตอนภาพนั้นขึ้น</b> พร้อมเวลาโดยประมาณ ใช้เป็นผังก่อนไปสร้างเสียงที่ Google AI Studio: คัดลอกทีละช่วง → สร้างเสียงช่วงละไฟล์ → ที่ขั้น 5 เลือก "แยกตามภาพ" แล้วใส่ไฟล์ แอปจะตั้งเวลาแต่ละภาพตามเสียงจริง ช่วงไหนจังหวะไม่ลงตัว แก้ข้อความที่นี่ สร้างเสียงใหม่เฉพาะช่วงนั้นแล้วกด "↻ เปลี่ยนไฟล์" ช่วงอื่นไม่ต้องทำใหม่ (แก้ข้อความที่นี่ = แก้สคริปต์ท่อนนั้นด้วย)</p>
    <p class="hint">${beats.length} ช่วง · เสียงโดยประมาณรวม ~${Math.round(beats.reduce((s, b) => s + est(b), 0))} วินาที · เวลา "เริ่ม" คำนวณจากผังเวลาตอนนี้</p>
    <div class="tools"><button class="ib wide" id="bAll">📋 คัดลอกตารางทั้งหมด (ข้อความ + วินาที)</button><button class="ib wide" id="bMode">🎞️ ใช้โหมด "แยกตามภาพ" (ขั้น 5)</button></div>
    ${beats.map(row).join('')}<button class="btn alt" data-a="x">ปิด</button>`;
  const flash = (btn, ok) => { const o = btn.dataset.o || btn.textContent; btn.dataset.o = o; btn.textContent = ok ? '✓ คัดลอกแล้ว' : 'คัดลอกไม่ได้'; setTimeout(() => { btn.textContent = o; }, 1500); };
  d.oninput = e => {
    const ta = e.target.closest('textarea[data-b]'); if (!ta) return; const i = +ta.dataset.b, b = beats[i]; b.text = ta.value;
    if (b.edge) setSegText(b.segKey, ta.value);
    else { const same = beats.filter(x => x.segKey === b.segKey), parts = same.map(x => x.text.trim().replace(/\s+/g, ' ')).filter(Boolean); state.script.beats = state.script.beats || {}; state.script.beats[b.segKey] = parts; setSegText(b.segKey, parts.join(' ')); }
    save(); const bt = d.querySelector(`[data-bt="${i}"]`); if (bt) bt.textContent = `เริ่ม ${fmtSec(TL[b.id] != null ? TL[b.id] : (TL[b.segKey] || 0))} · ~${Math.max(2, b.text.length / SPEAK_CPS).toFixed(1)} วิ`;
  };
  d.onclick = async e => {
    if (e.target.closest('[data-a=x]')) { d.remove(); if (state.step === 3) viewScript(); return; }
    const c = e.target.closest('[data-bc]'); if (c) { flash(c, await copyText(beats[+c.dataset.bc].text)); return; }
    if (e.target.closest('#bAll')) { flash(e.target.closest('#bAll'), await copyText(beats.map(b => `[${b.no}] (${b.imgs.length ? b.imgs.length + ' รูป · ' : ''}≈${est(b).toFixed(1)} วิ) ${b.text}`).join('\n\n'))); return; }
    if (e.target.closest('#bMode')) { A.mode = 'beats'; await save(); d.remove(); go(4); }
  };
  document.body.appendChild(d);
}
function viewScript() {
  organizeItems(); save();
  const segs = scriptSegmentsAll(), no2 = n => String(n).padStart(2, '0');
  let segT = segTargets();
  const sc = state.script; sc.en = sc.en || {}; sc.enSrc = sc.enSrc || {};
  const setText = (seg, v) => { if (seg.key === 'hook') sc.hook = v; else if (seg.key === 'open') sc.open = v; else if (seg.key === 'close') sc.close = v; else if (seg.key === 'life') sc.life = v; else if (seg.key === 'area') sc.area = v; else sc.rooms[seg.room] = v; };
  const total = () => scriptSegments().reduce((a, g) => a + secOf(g.text), 0);
  const stale = g => !!(sc.en[g.key] && g.text.trim() && sc.enSrc[g.key] !== g.text);
  const staleTxt = g => (stale(g) ? '⚠️ แก้ไทยหลังแปลแล้ว กด 🌐 แปลใหม่' : '');
  const card = g => {
    const its = g.edge ? [] : g.key === 'life' ? lifeItems() : g.key === 'area' ? areaItems() : state.items.filter(i => i.room === g.room);
    return `<div class="seg" data-key="${g.key}">
      <div class="seg-h"><b>${g.edge ? (g.key === 'open' ? 'เริ่ม' : g.key === 'hook' ? 'ฮุก' : 'จบ') : no2(g.no)} · ${g.label}</b><span class="badge" data-t="${g.key}">~${secOf(g.text)}${g.edge ? ' วิ' : ' / เป้า ' + segT[g.key] + ' วิ'}</span></div>
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
    <div class="seg"><b>🎯 ความยาวคลิปทั้งหมด</b>
      <div class="tgt"><input class="ct" id="tgt" type="number" inputmode="numeric" min="60" max="900" value="${state.clipSec}"><span>วินาที (<b id="tgtTxt">${mmss(state.clipSec)}</b>) · เสียงพากย์ที่ต้องมี ~<b id="narrTxt">${narrTarget()}</b> วิ (หักไตเติล/เครดิต/รถวิ่งแล้ว)</span></div>
      <div class="sbar ok" id="totBar" style="height:10px"><i style="width:0%"></i></div><small class="sbl" id="totTxt"></small>
      <div class="tools"><button class="ib wide danger" id="s4Draft">✨ เติมให้ครบเวลา</button><button class="ib wide" id="s4Facts">🏠 ข้อมูลบ้าน</button></div>
      <div class="tools"><button class="ib wide" id="aiCopy">🤖 คัดลอก + เปิด AI Studio (เขียนสคริปต์)</button><button class="ib wide" id="aiPaste">📥 วางสคริปต์จาก AI</button></div>
      <div class="tools"><button class="ib wide" id="chk">🔍 ตรวจข้อมูลในสคริปต์</button><button class="ib wide" id="beatBtn">🎙️ บทเสียงแบ่งช่วง (ตาราง ภาพ+ข้อความ+วินาที)</button></div>
      <div class="tools"><button class="ib wide" id="kitBtn">🧩 ชุดเนื้อหาครบชุด (สคริปต์ + โพสต์ Facebook + แฮชแท็ก + SEO)</button></div>
      <div class="tools"><button class="ib wide" id="ttsOpen">🔊 สร้างเสียง (คัดลอกทีละช่วง + เปิดหน้าสร้างเสียง)</button><button class="ib" id="linkEdit" title="แก้ลิงก์" aria-label="แก้ลิงก์">⚙️</button></div></div>
    <div class="tools"><button class="ib wide" id="trAll">🌐 แปลทั้งหมด</button><button class="ib wide" data-all="th">📋 ไทยทั้งหมด</button><button class="ib wide" data-all="en">📋 EN ทั้งหมด</button></div>
    <p class="hint" id="saved">💾 บันทึกอัตโนมัติทุกครั้งที่พิมพ์</p>
    <p class="hint">เวลารวมโดยประมาณ <b id="tot">${mmss(total())}</b> (เป้าหมายประมาณ 3:00) · ไตเติลและหน้าปิดเป็นคลิปประจำ ไม่ต้องเขียนสคริปต์</p>
    <div class="soon" style="text-align:left">📋 <b>ปุ่มคัดลอกใช้ทำอะไร:</b> กด 📋 ไทย หรือ 📋 EN ที่ท่อนไหน แล้วนำไปวางใน <b>Google AI Studio</b> เพื่อสร้างเสียงพากย์ จากนั้นตั้งชื่อไฟล์เสียงตามเลขท่อน (01, 02, ...) แล้วนำมาอัปโหลดในขั้น 5 · ปุ่ม 📋 ไทยทั้งหมด / EN ทั้งหมด คัดลอกข้อความล้วนทุกท่อนต่อกัน (ไม่มี [01] [02]) เว้นบรรทัดระหว่างท่อน พร้อมวางสร้างเสียงทีเดียวได้<br>🌐 การแปลใช้บริการแปลฟรีออนไลน์ ต้องต่อเน็ต คุณภาพพื้นฐาน อ่านและแก้ก่อนใช้ทุกครั้ง</div>
    ${state.items.length ? '' : '<div class="soon">ยังไม่มีรูป กลับไปขั้น 2 เพื่อใส่รูปและติดแท็กห้องก่อน</div>'}
    ${(() => { const h = heroItem(), srcIt = h && state.items.find(i => i.id === h.srcId), hasI = state.items.some(i => i.type === 'image');
      return `<div class="seg"><div class="seg-h"><b>🌟 ฮุกหลังไตเติล: ภาพบ้านเด่นที่สุด + เสียงบอกจุดเด่นทันที</b><span class="badge">${h ? '~' + Math.round(hookDur()) + ' วิ' : 'ปิดอยู่'}</span></div>
      <p class="hint">คลิปเริ่มที่ <b>ไตเติลมาสคอตทักทาย</b> แล้วต่อด้วย <b>ภาพบ้านที่เด่นที่สุด</b> พร้อมเสียงบอกจุดเด่นทันที (ข้อความแก้ได้ที่ท่อน "ฮุก" ด้านล่าง) จากนั้นจึงพาไปดูทำเล → รายละเอียดห้องต่างๆ</p>
      ${srcIt ? `<div class="mini"><img src="${urlOf(srcIt)}" alt=""><small>ภาพเด่นที่ใช้: ${(srcIt.room || 'ยังไม่ตั้งห้อง')}${state.hero && state.hero.id === srcIt.id ? '' : ' (เลือกให้อัตโนมัติ)'}</small></div>` : ''}
      <div class="tools"><button class="ib wide" id="heroPick" ${hasI ? '' : 'disabled'}>🖼️ เปลี่ยนภาพเด่น</button><button class="ib wide" id="hookTog" ${hasI ? '' : 'disabled'}>${state.hookOn === false ? '▶ เปิดฮุก' : '⏹ ปิดฮุก'}</button></div></div>`; })()}
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
  const updTot = () => { const nt = narrTarget(), tot = totalSecNow(), pct = Math.min(100, Math.round(tot / nt * 100)); const bar = $('#totBar'); bar.querySelector('i').style.width = pct + '%'; bar.className = 'sbar ' + (tot >= nt * 0.9 ? 'ok' : 'no'); $('#totTxt').textContent = `สคริปต์ตอนนี้ ~${mmss(tot)} จากเป้าเสียงพากย์ ${mmss(nt)} (${pct}%)${tot < nt * 0.9 ? ' · สั้นกว่าเป้า (ตอนเรนเดอร์ระบบยืดเวลาช่วงนั้นให้ครบ แต่ควรเขียนเพิ่ม)' : ' · ถึงเป้าแล้ว'}`; $('#totTxt').className = 'sbl ' + (tot >= nt * 0.9 ? 'ok' : 'no'); };
  updTot(); warn();
  if ($('#beatBtn')) $('#beatBtn').onclick = openBeatSheet;
  if ($('#kitBtn')) $('#kitBtn').onclick = openKitSheet;
  if ($('#hookTog')) $('#hookTog').onclick = () => { state.hookOn = state.hookOn === false; save(); viewScript(); };
  if ($('#heroPick')) $('#heroPick').onclick = () => {
    const d = document.createElement('div'); d.className = 'sheet tall'; d.id = 'heroSheet';
    d.innerHTML = `<div class="sh-head"><b>🌟 เลือกภาพเด่นเปิดคลิป</b><button class="ib" data-a="x" aria-label="ปิด">✕</button></div><p class="hint">เลือกภาพบ้านที่สวยและเด่นที่สุด (ภาพนี้จะขึ้นก่อนใครในคลิป)</p><div class="pgrid">${state.items.filter(i => i.type === 'image').map(i => `<button class="pcell" data-h="${i.id}"><img src="${urlOf(i)}" alt="" style="width:100%;height:92px;object-fit:cover;border-radius:8px"><span>${i.room || 'ยังไม่ตั้งห้อง'}</span></button>`).join('')}</div><button class="btn alt" data-a="x">ปิด</button>`;
    d.onclick = e => { if (e.target.closest('[data-a=x]')) { d.remove(); return; } const b = e.target.closest('[data-h]'); if (b) { state.hero = { id: +b.dataset.h }; save(); d.remove(); viewScript(); } };
    document.body.appendChild(d);
  };
  const stamp = () => { const d = new Date(); $('#saved').textContent = `💾 บันทึกแล้ว ${d.toLocaleTimeString('th-TH')}`; };
  $('#segs').oninput = e => {
    const ta = e.target.closest('textarea'); if (!ta) return;
    if (ta.dataset.e) { sc.en[ta.dataset.e] = ta.value; sc.enSrc[ta.dataset.e] = (scriptSegmentsAll().find(x => x.key === ta.dataset.e) || {}).text; save(); stamp(); return; }
    const g = scriptSegmentsAll().find(x => x.key === ta.dataset.k); setText(g, ta.value); save(); stamp();
    document.querySelector(`[data-t="${CSS.escape(g.key)}"]`).textContent = g.edge ? `~${secOf(ta.value)} วิ` : `~${secOf(ta.value)} / เป้า ${segT[g.key]} วิ`;
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
    if (cp) { const [lang, key] = [cp.dataset.cp.split(':')[0], cp.dataset.cp.slice(cp.dataset.cp.indexOf(':') + 1)]; const g = scriptSegmentsAll().find(x => x.key === key); const txt = lang === 'en' ? (sc.en[key] || '') : g.text; if (!txt.trim()) { alert(lang === 'en' ? 'ยังไม่มีข้อความอังกฤษ กด 🌐 แปล ก่อน' : 'ยังไม่มีข้อความ'); return; } flash(cp, await copyText(txt.trim())); return; }
    const tr = e.target.closest('[data-tr]');
    if (tr) { const g = scriptSegmentsAll().find(x => x.key === tr.dataset.tr); if (!g.text.trim()) { alert('ยังไม่มีข้อความไทยให้แปล'); return; } tr.disabled = true; tr.textContent = 'กำลังแปล...'; try { await doTranslate(g); stamp(); } catch (err) { alert('แปลไม่สำเร็จ (ต่อเน็ตอยู่ไหม?) ' + (err.message || err)); } tr.disabled = false; tr.textContent = '🌐 แปล'; }
  };
  $('#trAll').onclick = async e => {
    const b = e.currentTarget, list = scriptSegmentsAll().filter(g => g.text.trim()); if (!list.length) { alert('ยังไม่มีข้อความไทยให้แปล'); return; }
    b.disabled = true; let n = 0;
    try { for (const g of list) { b.textContent = `กำลังแปล ${++n}/${list.length}`; await doTranslate(g); } stamp(); b.textContent = '✓ แปลครบแล้ว'; setTimeout(() => { b.textContent = '🌐 แปลทั้งหมด'; }, 2000); }
    catch (err) { alert(`แปลไม่สำเร็จที่ท่อนที่ ${n} (ต่อเน็ตอยู่ไหม?) ` + (err.message || err)); b.textContent = '🌐 แปลทั้งหมด'; }
    b.disabled = false;
  };
  document.querySelectorAll('[data-all]').forEach(btn => btn.onclick = async e => {
    const lang = btn.dataset.all;
    const txt = scriptSegmentsAll().map(g => (lang === 'en' ? (sc.en[g.key] || '') : g.text).trim()).filter(Boolean).join('\n\n'); // ข้อความล้วน ไม่มีเลขท่อน (สำหรับสร้างเสียง)
    if (!txt) { alert(lang === 'en' ? 'ยังไม่มีข้อความอังกฤษ กด 🌐 แปลทั้งหมด ก่อน' : 'ยังไม่มีข้อความ'); return; }
    flash(btn, await copyText(txt));
  });
  $('#nx').onclick = () => go(4); $('#bk').onclick = () => go(2);
  $('#s4Facts').onclick = () => openFacts(() => viewScript());
  $('#tgt').oninput = e => { const v = Math.max(60, Math.min(900, +e.target.value || 180)); state.clipSec = v; $('#tgtTxt').textContent = mmss(v); $('#narrTxt').textContent = narrTarget(); save(); segT = segTargets(); document.querySelectorAll('[data-t]').forEach(b => { const g = scriptSegmentsAll().find(x => x.key === b.dataset.t); if (g && !g.edge) b.textContent = `~${secOf(g.text)} / เป้า ${segT[g.key]} วิ`; }); updTot(); };
  $('#s4Draft').onclick = () => { const n = draftAll(); alert(expandMsg(n)); viewScript(); };
  $('#chk').onclick = openFactCheck;
  // คัดลอกข้อความ แล้วเปิดหน้า Google AI Studio ในแท็บใหม่ (กดปุ่มเดียว)
  const openLink = openExternal;
  $('#aiCopy').onclick = async e => { const btn = e.currentTarget, ok = await copyText(buildAiPrompt()); flash(btn, ok); openLink(lib.links.chat); };
  // แบ่งสคริปต์เป็นช่วง (ไม่เกิน ~700 ตัวอักษรต่อช่วง) แสดงต้นข้อความ ให้คัดลอกทีละช่วงและตรวจก่อนวาง
  $('#ttsOpen').onclick = () => {
    const chunks = ttsChunks(); if (!chunks.length) { alert('ยังไม่มีสคริปต์ให้คัดลอก'); return; }
    const d = document.createElement('div'); d.className = 'sheet tall'; d.id = 'ttsSheet';
    d.innerHTML = `<div class="sh-head"><b>🔊 สร้างเสียง</b><button class="ib" data-a="x" aria-label="ปิด">✕</button></div>
      <p class="hint"><b>ลำดับที่ถูกต้อง:</b> ① คัดลอกสไตล์ → วางช่อง Style ② คัดลอกสคริปต์ → วางช่องข้อความ ③ เลือกผู้พูดคนเดียวตลอด ④ Run ⑤ ดาวน์โหลดไฟล์เสียง</p>
      ${styleCardHtml()}
      <p class="hint"><b>หรือแยกทำทีละช่วง</b> ตามลำดับ: กด <b>คัดลอก</b> → กด <b>เปิดหน้าสร้างเสียง</b> → ในช่องข้อความ <b>ลบของเก่าให้ว่างก่อน</b> แล้ววาง → ตรวจว่าบรรทัดแรกตรงกับ "ขึ้นต้นว่า" ด้านล่าง → สร้างเสียง → ตั้งชื่อไฟล์ตามเลขช่วง (เช่น ช่วง 1 = <b>01</b>) แล้วทำช่วงต่อไป</p>
      ${chunks.map((c, i) => `<div class="seg"><div class="seg-h"><b>ช่วง ${String(i + 1).padStart(2, '0')} · ท่อน ${c.nos[0]}${c.nos.length > 1 ? '–' + c.nos[c.nos.length - 1] : ''}</b><span class="badge">${c.len} ตัวอักษร · ~${secOf(c.texts.join(''))} วิ</span></div>
        <p class="hint">ขึ้นต้นว่า: <b>"${c.texts[0].slice(0, 32).replace(/</g, '&lt;')}…"</b></p>
        <div class="tools"><button class="ib wide" data-cc="${i}">📋 คัดลอกช่วง ${i + 1}</button></div></div>`).join('')}
      <div class="seg"><b>🎙️ ไฟล์เดียวทั้งคลิป (แนะนำ เสียงเป็นเนื้อเดียวกัน)</b><p class="hint">คัดลอกสคริปต์ทุกท่อนต่อกัน เว้นบรรทัดระหว่างท่อน แล้วสร้างเสียงครั้งเดียว · แอปแบ่งท่อนจากช่วงเงียบระหว่างย่อหน้า ดังนั้น <b>อย่าตัดบรรทัดว่างทิ้ง</b></p><div class="tools"><button class="ib wide" data-all-one="1">📋 คัดลอกทั้งคลิป (ไฟล์เดียว)</button></div></div>
      <button class="btn" data-a="open">🔊 เปิดหน้าสร้างเสียง</button><button class="btn alt" data-a="x">ปิด</button>`;
    d.onclick = async e => {
      if (e.target.closest('[data-a=x]')) { d.remove(); return; }
      if (e.target.closest('[data-a=open]')) { openLink(lib.links.tts); return; }
      const one = e.target.closest('[data-all-one]'); if (one) { flash(one, await copyText(chunks.flatMap(c => c.texts).join('\n\n'))); return; }
      const b = e.target.closest('[data-cc]'); if (!b) return;
      const ok = await copyText(chunks[+b.dataset.cc].texts.join('\n\n')); flash(b, ok);
    };
    document.body.appendChild(d); bindStyleCard(d);
  };
  $('#linkEdit').onclick = async () => {
    const c = prompt('ลิงก์หน้าเขียนสคริปต์ (AI Studio แชต) · เว้นว่าง = ค่ามาตรฐาน', lib.links.chat); if (c === null) return;
    const t = prompt('ลิงก์หน้าสร้างเสียง (AI Studio) · เปิดหน้านั้นในเบราว์เซอร์แล้วคัดลอกที่อยู่เว็บจากแถบด้านบนมาวาง · เว้นว่าง = ค่ามาตรฐาน', lib.links.tts); if (t === null) return;
    lib.links.chat = c.trim() || DEFAULT_LINKS.chat; lib.links.tts = t.trim() || DEFAULT_LINKS.tts; await saveLib(); alert('บันทึกลิงก์แล้ว');
  };
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

// ---- แผนเวลา: แต่ละช่วง = max(ความยาวสคริปต์, เวลาที่ได้ตามเป้า) แบ่งให้รูปของช่วงนั้น (รูปละ ≥2 วิ)
// ถ้ารูปละนานเกิน 8 วิ แตกเป็นหลายช็อตซูม/แพนคนละมุม · ผลรวมทั้งคลิป ≥ ความยาวเป้าหมาย (3:00) เสมอ
const MAXSHOT = 8;
function segKeyOfSlot(sl) { return sl.cat === 'lifestyle' ? 'life' : sl.cat ? 'area' : 'room:' + sl.room; }
function segPlan() {
  const segs = scriptSegments(), T = segTargets(), plan = {}, AUD = segAudioSec();
  segs.forEach(g => {
    const list = g.key === 'life' ? lifeItems() : g.key === 'area' ? areaItems() : state.items.filter(i => i.room === g.room);
    plan[g.key] = { sec: AUD[g.key] != null ? AUD[g.key] + 0.25 : Math.max(secOf(g.text), T[g.key] || 0), imgs: list.filter(isMedia) };
  });
  return plan;
}
// เวลาแสดงรูปนิ่งที่เหลือหลังหักเวลาคลิปวิดีโอ (คลิปใช้ความยาวของตัวเองไม่เกิน 8 วินาที)
const stillShare = (items, totalSec) => { const vids = items.filter(i => i.type === 'video'), stills = items.length - vids.length; if (!stills) return STYLE.secPerImage; return Math.max(STYLE.secPerImage, (totalSec - vids.reduce((s, v) => s + vidDur(v), 0)) / stills); };
function imageDurations(imgs) {
  const plan = segPlan(), idToKey = new Map();
  Object.entries(plan).forEach(([k, P]) => P.imgs.forEach(i => idToKey.set(i.id, k)));
  const BM = state.audio && state.audio.mode === 'beats' ? beatMap() : null;
  return imgs.map(i => {
    if (isHeroId(i.id)) { const d = hookDur(); return { dur: d, shots: d > MAXSHOT ? Math.ceil(d / MAXSHOT) : 1 }; }
    if (i.type === 'video') return { dur: vidDur(i), shots: 1 };
    const k = idToKey.get(i.id); if (!k || !state.stretch) return { dur: STYLE.secPerImage, shots: 1 };
    const bt = BM && BM.get(i.id); if (bt) { const au = beatAudioSec(bt.id), P0 = plan[k], sec = au != null ? au + 0.25 : P0.sec * bt.share, d0 = stillShare(bt.imgs, sec); return { dur: d0, shots: d0 > MAXSHOT ? Math.ceil(d0 / MAXSHOT) : 1 }; }
    const P = plan[k], d = stillShare(P.imgs, P.sec);
    return { dur: d, shots: d > MAXSHOT ? Math.ceil(d / MAXSHOT) : 1 };
  });
}
function timelineImages() {
  const titleImg = (!lib.titleBuiltin && lib.title && lib.title.type === 'image') ? lib.title : null, closeImg = (!lib.closeBuiltin && lib.close && lib.close.type === 'image') ? lib.close : null;
  const pre = titleImg ? [titleImg] : [], post = closeImg ? [closeImg] : [], hero = heroItem();
  return { pre, hero, imgs: [...(hero ? [hero] : []), ...pre, ...areaLibOrdered().filter(isMedia), ...state.items.filter(isMedia), ...lifeItems().filter(isMedia), ...post] };
}
const predictedTotal = () => imageDurations(timelineImages().imgs).reduce((a, p) => a + p.dur, 0) + fixedSec();
// ขีดวัด: จำนวนรูปเทียบกับเวลาของช่วงนั้น (ส้ม=น้อยไป เขียว=พอดี แดง=เยอะไป)
function fitMeterHtml(sl) {
  if (!state.stretch || getSlotScript(sl) === null) return '';
  const k = segKeyOfSlot(sl), P = segPlan()[k]; if (!P || !P.sec) return '';
  const n = P.imgs.length, sec = Math.round(P.sec), lo = Math.max(1, Math.ceil(sec / MAXSHOT)), hi = Math.max(lo, Math.floor(sec / 2.5)), S = hi + Math.max(2, Math.round(hi * 0.4));
  const pos = Math.min(S, n) / S * 100, o = (lo - 0.5) / S * 100, g = (hi - lo + 1) / S * 100;
  const bad = n < lo || n > hi, verdict = n < lo ? `⚠️ น้อยไป ภาพจะซูมหลายมุมซ้ำ แนะนำเพิ่มอีก ${lo - n} รูป` : n > hi ? `⚠️ เยอะไป เกินเวลาช่วงนี้ ลดเหลือไม่เกิน ${hi} รูป หรือเพิ่มสคริปต์` : '✅ จำนวนรูปพอดีกับเวลา';
  return `<div class="fit"><b style="width:${o}%"></b><b class="g" style="width:${g}%"></b><b class="r"></b><i style="left:${pos}%"></i></div><small class="fitl ${bad ? 'w' : 'ok'}">🎞️ ช่วงนี้ ~${sec} วิ · รูปที่เหมาะ ${lo}–${hi} รูป · ตอนนี้ ${n} รูป${k === 'area' ? ' (รวมทั้งทำเล)' : ''} — ${verdict}</small>`;
}

function viewRender() {
  organizeItems(); save();
  const { pre, imgs } = timelineImages(), s = sizeInfo();
  const blockers = sbBlockers();
  const skipped = state.items.length - imgs.filter(i => !isHeroId(i.id)).length;
  const routeOk = !!(state.routeData && state.routeData.size === state.size);
  const routeAt = pre.length + areaLibOrdered().filter(isMedia).length + state.items.filter(i => isMedia(i) && (i.room === AREA_ROOM || i.room === MAP_ROOM)).length;
  $('#view').innerHTML = `
    <h2>เรนเดอร์เป็น MP4</h2>
    <p class="hint">ขนาด ${s.name} (${s.w}×${s.h}) · ${imgs.length} รูป/คลิป · ยาวประมาณ ${predictedTotal().toFixed(1)} วินาที (รวมฉากมาสคอต/คลิปรถวิ่งที่เปิดใช้)${skipped ? ` · คลิปสั้น ${skipped} ไฟล์ยังไม่ถูกใช้ (รอบหน้า)` : ''}</p>
    ${blockers.length ? `<div class="soon" style="border-color:#b00020;color:#b00020;text-align:left">❌ ยังเรนเดอร์ไม่ได้ เพราะผังเรื่องยังขาด:<br>${blockers.map(b => '• ' + b.label.replace(/^\d+\. /, '') + ' — ' + b.info).join('<br>')}<br><br><button class="btn alt" id="openSb">📋 เปิดผังเรื่อง</button></div>` : ''}
 <label class="sw"><input type="checkbox" id="capOn" ${state.capOn !== false ? 'checked' : ''}> ป้ายชื่อรูปของตัวบ้าน บนภาพ (เฉพาะรูปห้อง/ตัวบ้านที่คุณตั้งชื่อ · ชื่อสถานที่ทำเลไม่ขึ้นป้าย ใช้พากย์อย่างเดียว)</label>
    <label class="sw"><input type="checkbox" id="ovl" ${state.overlay ? 'checked' : ''}> ป้ายข้อความระหว่างคลิป เช่น "3 ห้องนอน" "พื้นที่ใช้สอย ..." โผล่เป็นระยะ (ใช้ข้อมูลบ้านที่กรอกไว้)</label>
    <label class="sw">การเปลี่ยนภาพ: <select id="trs"><option value="auto" ${state.trans === 'auto' ? 'selected' : ''}>หลากหลายอัตโนมัติ (สไลด์ ซูม เปิดวงกลม แฟลช)</option><option value="fade" ${state.trans === 'fade' ? 'selected' : ''}>เฟดนุ่มๆ อย่างเดียว</option></select></label>
    <label class="sw"><input type="checkbox" id="stretch" ${state.stretch ? 'checked' : ''}> ยืดเวลาให้ครบความยาวเป้าหมาย (ช่วงที่มีรูปน้อยจะซูม/แพนหลายมุม · ปิด = รูปละ 2 วินาทีตามสไตล์เดิม)</label>
    ${(() => { try { const n = checkNarrationVsPhotos().issues.length; return n ? `<div class="soon" style="text-align:left;border-color:#b00020;color:#b00020">⚠️ พบ ${n} จุดที่เนื้อเรื่องอาจไม่ตรงกับภาพ <button class="ib" id="chk2">ดูรายละเอียด</button></div>` : '<p class="hint">✅ เนื้อเรื่องไม่ขัดกับป้ายห้องของภาพ <button class="ib" id="chk2">ตรวจอีกครั้ง</button></p>'; } catch (e) { return ''; } })()}
    <p class="hint">ปรับสี: ${isNeutral(state.color) ? 'ปิด' : (state.color.auto ? 'อัตโนมัติ' : 'ตั้งเอง')}</p>
    <p class="hint">ระหว่างเรนเดอร์ ให้เปิดหน้าจอค้างไว้ อย่าสลับแอป</p>
    <button class="btn" id="go" ${imgs.length && !blockers.length ? '' : 'disabled'}>🎬 เริ่มเรนเดอร์</button>
    <div id="saved"></div><div id="prog" class="hint"></div><div id="out"></div>
    <button class="btn alt" id="bk">← ย้อนกลับ</button>`;
  $('#ovl').onchange = e => { state.overlay = e.target.checked; save(); };
  $('#capOn').onchange = e => { state.capOn = e.target.checked; save(); };
  $('#trs').onchange = e => { state.trans = e.target.value; save(); };
  $('#stretch').onchange = e => { state.stretch = e.target.checked; save(); viewRender(); };
  $('#bk').onclick = () => go(5);
  if ($('#chk2')) $('#chk2').onclick = openFactCheck;
  if ($('#openSb')) $('#openSb').onclick = openSb;
  fillSaved();
  $('#go').onclick = async () => {
    const pid0 = state.pid;
    $('#go').disabled = true; $('#out').innerHTML = '';
    const t0 = performance.now();
    try {
      await probeItems([...state.items, ...lib.area]); // อ่านความยาวคลิปวิดีโอที่ยังไม่รู้
      const PL = makePlan(), { imgs: gimgs, durs, entries, starts, sceneAt, total } = PL;
      let luts = null;
      if (!isNeutral(state.color)) {
        const stats = [], idx = [];
        for (let k = 0; k < gimgs.length; k++) { const it = gimgs[k]; if (it.type === 'video') continue; if (!statCache.has(it.id)) statCache.set(it.id, imageStats(await getSmall(it))); stats.push(statCache.get(it.id)); idx.push(k); }
        const L = makeLuts(stats, state.color); luts = new Array(gimgs.length).fill(null); idx.forEach((k, j) => { luts[k] = L[j]; });
      }
      const sceneList = [];
      if (lib.closeBuiltin) sceneList.push({ at: gimgs.length, scene: await closeScene() });
      if (PL.routeOk) sceneList.push({ at: PL.routeAt, scene: await routeScene(state.routeData) });
      if (lib.titleBuiltin) sceneList.push({ at: 0, scene: await titleScene() });
      const hasAudio = (state.audio.mode === 'single' ? state.audio.single : Object.keys(audStore()).length) || state.audio.music || state.audio.sfx;
      let audioMix = null;
      if (hasAudio) { $('#prog').textContent = 'กำลังผสมเสียง...'; audioMix = await buildMix(starts, total, sceneAt); }
      // มาสคอต: ปากขยับตามแทร็กเสียงพากย์ล้วน · มาสคอตนำเสนอ (ตามช่วงของแต่ละท่อน)
      await loadPoses(); await loadMyPoses(); MOUTH.babble = false;
      if (audioMix && audioMix.voice) { const me = computeMouthEnv(audioMix.voice, audioMix.sampleRate, MOUTH.fps); MOUTH.env = me.env; MOUTH.wid = me.wid; } else { MOUTH.env = null; MOUTH.wid = null; }
      STYLE.trans = state.trans; OVERLAY.on = !!(state.overlay || state.capOn); OVERLAY.events = buildOverlayEvents(entries, state.facts, { labels: !!state.overlay, caps: state.capOn !== false }); PRESENTER.on = !!state.mascot.presenter; PRESENTER.size = state.mascot.size; PRESENTER.move = state.mascot.move !== false; PRESENTER.random = state.mascot.random !== false; PRESENTER.fidget = state.mascot.fidget !== false; PRESENTER._prep = -1; PRESENTER.side = state.mascot.side; PRESENTER.spans = [];
      { let tt = 0; const seen = {}, smart = (state.mascot.cadence || 'smart') === 'smart';
        entries.forEach(e => { if (e.key && e.key !== 'open' && e.key !== 'close' && e.key !== 'hook') { const sp = seen[e.key] || (seen[e.key] = { key: e.key, start: tt, end: tt, pose: poseForSeg(e.key), seed: Object.keys(seen).length }); sp.end = tt + e.dur; } tt += e.dur; });
        let spans = Object.values(seen);
        if (smart) { // เด่นตอนทักทาย (ฉากไตเติล) · ชี้จุดขาย · ปิดคลิป (ฉากเครดิต) · ช่วงชมบ้านโผล่แวบสั้นๆ ไม่แย่งความสนใจจากภาพบ้าน
          const out = [];
          spans.forEach(sp => { const L = sp.end - sp.start, role = (state.script.mrole || {})[sp.key] || (MASCOT_SELL.includes(sp.key) ? 'sell' : 'tour');
            if (role === 'hide') return;
            if (role === 'sell') out.push({ ...sp, start: sp.start + 0.4, end: sp.start + Math.min(Math.max(L - 0.3, 2.5), 7), big: true });
            else if (L >= 4.5) out.push({ ...sp, start: sp.start + 0.6, end: sp.start + 3.1, small: true }); });
          spans = out;
        }
        PRESENTER.spans = spans; }
      const blob = await renderMp4(gimgs.map(i => (i.type === 'video' ? { video: i.blob, dur: vidDur(i) } : i.blob)), s.w, s.h, (p, msg) => { $('#prog').textContent = `${msg} ${Math.round(p * 100)}%`; }, luts, sceneList, durs, audioMix);
      const url = URL.createObjectURL(blob), kept = await storeVideo(pid0, blob); await markRendered(pid0, blob, kept);
      $('#prog').textContent = `${kept ? '💾 เก็บไว้ในหน้า "คลิปของฉัน" แล้ว · ' : '⚠️ พื้นที่เก็บในเครื่องไม่พอจะเก็บวิดีโอไว้ในแอป (โหลดลงเครื่องเลย) · '}เสร็จใน ${((performance.now() - t0) / 1000).toFixed(0)} วินาที · ขนาดไฟล์ ${(blob.size / 1048576).toFixed(1)} MB`;
      $('#out').innerHTML = `<video src="${url}" controls playsinline style="width:100%;max-height:60vh;background:#000;border-radius:12px"></video><a class="btn" id="dl" download="${clipName(metaOf(pid0) || {})}.mp4" href="${url}" style="text-decoration:none;text-align:center">⬇ บันทึกไฟล์ MP4</a>`;
      $('#dl').onclick = () => markDownloaded(pid0); $('#saved').innerHTML = '';
    } catch (e) { $('#prog').textContent = '❌ ' + (e.message || e); }
    PRESENTER.on = false; OVERLAY.on = false; MOUTH.env = null; MOUTH.wid = null; MOUTH.babble = true;
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
  STYLE.trans = state.trans; const total = totalDuration(imgs.length), t0 = performance.now();
  const tick = () => {
    let t = (performance.now() - t0) / 1000;
    if (t > total) { t = total; clearInterval(previewTimer); }
    drawFrame(ctx, cv.width, cv.height, imgs, t);
  };
  previewTimer = setInterval(tick, 1000 / 30);
}

// เปิดลิงก์ภายนอกในแอป Chrome จริง (หน้าต่างแยก) แอปนี้ค้างอยู่ด้านหลัง สลับกลับมาได้ · บน Android ที่ติดตั้งแอปไว้ ลิงก์ปกติจะเปิดเป็นหน้าต่างเล็กในแอปแล้วหายเมื่อกลับมา
function externalUrl(url) {
  const standalone = window.matchMedia && matchMedia('(display-mode: standalone)').matches || navigator.standalone;
  if (/Android/i.test(navigator.userAgent) && standalone) { const u = new URL(url); return `intent://${u.host}${u.pathname}${u.search}#Intent;scheme=${u.protocol.replace(':', '')};package=com.android.chrome;S.browser_fallback_url=${encodeURIComponent(url)};end`; }
  return null;
}
function openExternal(url) {
  const x = externalUrl(url);
  if (x) { window.location.href = x; return; }
  const a = document.createElement('a'); a.href = url; a.target = '_blank'; a.rel = 'noopener noreferrer'; document.body.appendChild(a); a.click(); a.remove();
}

// ---- การ์ดสไตล์เสียง (ตั้งครั้งเดียว ใช้ทุกคลิป): คัดลอกไปวางในช่อง Style ของ AI Studio ----
function styleCardHtml() {
  return `<div class="seg"><b>🎬 สไตล์เสียง (วางในช่อง "Style" ของ AI Studio)</b>
    <label class="fl"><span>เลือกแบบสำเร็จรูป</span><select class="ct" id="styPreset"><option value="">— แก้เอง —</option>${Object.entries(VOICE_STYLES).map(([k, v]) => `<option value="${k}" ${lib.voiceStyle === v.text ? 'selected' : ''}>${v.label}</option>`).join('')}</select></label>
    <textarea class="sct" id="styText" rows="5">${lib.voiceStyle.replace(/</g, '&lt;')}</textarea>
    <div class="tools"><button class="ib wide" id="styCopy">📋 คัดลอกสไตล์</button></div>
    <p class="hint">วางในช่อง <b>Style</b> (ปุ่ม Style เหนือช่องข้อความในหน้าสร้างเสียง) <b>ไม่ใช่</b>ในช่องข้อความ ไม่เช่นนั้นเสียงอาจอ่านคำสั่งออกมา · แอปใส่ให้อัตโนมัติไม่ได้ เพราะเป็นเว็บของ Google · ตั้งไว้ครั้งเดียว ใช้กับทุกคลิป</p></div>`;
}
function bindStyleCard(root) {
  const t = root.querySelector('#styText'), pr = root.querySelector('#styPreset'), cp = root.querySelector('#styCopy');
  pr.onchange = () => { if (pr.value) { lib.voiceStyle = VOICE_STYLES[pr.value].text; t.value = lib.voiceStyle; saveLib(); } };
  t.oninput = () => { lib.voiceStyle = t.value; const m = Object.entries(VOICE_STYLES).find(([, v]) => v.text === t.value); pr.value = m ? m[0] : ''; saveLib(); };
  cp.onclick = async () => { const o = cp.dataset.o || cp.textContent; cp.dataset.o = o; const ok = await copyText(lib.voiceStyle); cp.textContent = ok ? '✓ คัดลอกสไตล์แล้ว' : 'คัดลอกไม่ได้'; setTimeout(() => { cp.textContent = o; }, 1500); };
}

// ---- เพลงสำเร็จรูป (CC0 จาก OpenGameArt.org · รายละเอียดใบอนุญาต: assets/music/LICENSES.md) ----
const MUSIC_CATALOG = [
  { id: 'bossa-shop', name: 'Bossa Shop Theme', style: 'บอสซาโนวา เบาสบาย เสียงแผ่นเสียงวินเทจ', dur: 96, src: 'https://opengameart.org/content/bossa-shop-theme-in-low-fi-and-hd', by: 'SpringySpringo', lic: 'CC-BY 3.0 หรือ CC0 (เลือกใช้แบบ CC0)', chk: '21 พ.ย. 2569' },
  { id: 'bossa-town', name: 'Bossa Town', style: 'บอสซาโนวา บรรยากาศชายหาด อบอุ่น', dur: 100, src: 'https://opengameart.org/content/bossa-town', by: 'KarateStudios', lic: 'CC0', chk: '21 พ.ย. 2569' },
  { id: 'buy-something', name: 'Buy Something!', style: 'บอสซาโนวา/แจสเบาๆ แบบเพลงในห้างหรู', dur: 88, src: 'https://opengameart.org/content/shop-theme', by: 'CleytonKauffman', lic: 'CC0', chk: '21 พ.ย. 2569' },
  { id: 'ladada-guitar', name: 'LaDaDa Guitar', style: 'แจสกีตาร์ สงบ', dur: 154, src: 'https://opengameart.org/content/ladada-guitar', by: 'Pro Sensory', lic: 'CC0', chk: '21 พ.ย. 2569' },
  { id: 'just-you-and-me', name: 'Just You and Me', style: 'กีตาร์แจสป๊อป อบอุ่น', dur: 99, src: 'https://opengameart.org/content/just-you-and-me-guitar', by: 'Pro Sensory', lic: 'CC0', chk: '21 พ.ย. 2569' },
  { id: 'jazz-slower', name: 'Jazz Slower', style: 'แจสบรรเลง จังหวะช้า', dur: 177, src: 'https://opengameart.org/content/jazz-slower', by: 'Pro Sensory', lic: 'CC0', chk: '21 พ.ย. 2569' },
  { id: 'taken-lightly', name: 'Taken Lightly', style: 'แจสเบาๆ ผ่อนคลาย', dur: 145, src: 'https://opengameart.org/content/taken-lightly', by: 'Pro Sensory', lic: 'CC0', chk: '21 พ.ย. 2569' },
  { id: 'jazz-relaxing', name: 'Relaxing Jazz', style: 'แจสรีแลกซ์ สบายๆ', dur: 133, src: 'https://opengameart.org/content/jazz-aug-4-2021', by: 'Pro Sensory', lic: 'CC0', chk: '21 พ.ย. 2569' },
  { id: 'slow-stride', name: 'Slow Stride', style: 'เปียโนช้า นุ่ม ชิลล์', dur: 131, src: 'https://opengameart.org/content/slow-stride', by: 'isaiah658', lic: 'CC0', chk: '21 พ.ย. 2569' },
  { id: 'calm-piano', name: 'Calm Piano', style: 'เปียโนสงบ ผสมแพดนุ่มๆ', dur: 165, src: 'https://opengameart.org/content/calm-piano-1-vaporware', by: 'cynicmusic', lic: 'CC0', chk: '21 พ.ย. 2569' },
  { id: 'all-into-harmony', name: 'All into Harmony', style: 'แจสชิลล์ ผ่อนคลาย', dur: 102, src: 'https://opengameart.org/content/all-into-harmony', by: 'Pro Sensory', lic: 'CC0', chk: '21 พ.ย. 2569' },
  { id: 'dream-2', name: 'Dream 2 (Guitar)', style: 'กีตาร์แจสฝัน ๆ ผ่อนคลาย', dur: 401, src: 'https://opengameart.org/content/dream-2', by: 'Pro Sensory', lic: 'CC0', chk: '21 พ.ย. 2569' },
  { id: 'two-left-socks', name: 'Two Left Socks', style: 'บอสซาโนวาแบบเพลงในลิฟต์/ห้าง', dur: 200, src: 'https://opengameart.org/content/two-left-socks', by: 'congusbongus', lic: 'CC0', chk: '21 พ.ย. 2569' },
  { id: 'which-brand-of-mustard-shall-i-buy', name: 'Which Brand Of Mustard', style: 'บอสซาโนวาเบา ๆ', dur: 130, src: 'https://opengameart.org/content/which-brand-of-mustard-shall-i-buy', by: 'congusbongus', lic: 'CC0', chk: '21 พ.ย. 2569' },
  { id: 'honey-bear', name: 'Honey Bear', style: 'นุ่ม นิ่ม สงบ', dur: 80, src: 'https://opengameart.org/content/honey-bear', by: 'TinyWorlds', lic: 'CC0', chk: '21 พ.ย. 2569' },
  { id: 'jazz-1', name: 'Jazz (Piano Swing)', style: 'เปียโนสวิงสั้น ๆ เรียบง่าย', dur: 72, src: 'https://opengameart.org/content/jazz-1', by: 'Spring Spring', lic: 'CC0', chk: '21 พ.ย. 2569' },
  { id: 'cozy-puzzle-in-game-1', name: 'Cozy Puzzle 1', style: 'อบอุ่น ซาก ฟลูต มาลเลต', dur: 130, src: 'https://opengameart.org/content/cozy-puzzle-in-game-1', by: 'MintoDog', lic: 'CC0', chk: '21 พ.ย. 2569' },
  { id: 'piano-emotional-solo-139', name: 'Piano Solo 139', style: 'เปียโนเดี่ยว นุ่ม สงบ', dur: 205, src: 'https://opengameart.org/content/piano-emotional-solo-139', by: 'Tozan', lic: 'CC0', chk: '21 พ.ย. 2569' },
  { id: 'revelation', name: 'Revelation', style: 'กีตาร์อะคูสติก สงบ สดใส', dur: 85, src: 'https://opengameart.org/content/revelation', by: 'Indieteur', lic: 'CC0', chk: '21 พ.ย. 2569' },
  { id: 'growing-village', name: 'Growing Village', style: 'เปียโนแนวลาติน', dur: 92, src: 'https://opengameart.org/content/growing-village', by: 'earlbeat', lic: 'CC0', chk: '21 พ.ย. 2569' },
];

// ---- ขั้น 5: เสียง ----
const audioCtxClass = () => window.OfflineAudioContext || window.webkitOfflineAudioContext;
async function decodeBlob(blob, sr = 44100) { const ctx = new (audioCtxClass())(1, 1, sr); return ctx.decodeAudioData(await blob.arrayBuffer()); }
const fmtSec = n => `${Math.floor(n / 60)}:${String(Math.round(n % 60)).padStart(2, '0')}`;
async function setChunkAudio(idx, file) {
  const ch = ttsChunks()[idx - 1]; if (!ch) return false;
  const buf = await decodeBlob(file);
  audStore()[audKey(idx - 1, ch)] = { blob: file, name: file.name, dur: buf.duration, sig: chunkSig(ch) };
  return true;
}
function viewAudio() {
  const A = state.audio, chunks = ttsChunks(), single = A.mode === 'single', beatsM = A.mode === 'beats';
  const urls = viewAudio._u || (viewAudio._u = {});
  const urlFor = (k, blob) => { if (!urls[k] || urls[k].blob !== blob) { if (urls[k]) URL.revokeObjectURL(urls[k].url); urls[k] = { blob, url: URL.createObjectURL(blob) }; } return urls[k].url; };
  const have = chunks.filter((c, i) => audStore()[audKey(i, c)]).length;
  const totalVoice = chunks.reduce((a, c, i) => a + ((audStore()[audKey(i, c)] || {}).dur || 0), 0);
  const segsAll = scriptSegmentsAll().filter(g => g.text.trim()), align = single ? singleAlign() : null, clipLen = (() => { try { return computeTimeline().total; } catch (e) { return 180; } })();
  const label = g => g.edge ? (g.key === 'open' ? 'เปิดคลิป' : g.key === 'hook' ? 'ฮุก (ภาพเด่น)' : 'ปิดท้าย/ติดต่อ') : `ท่อน ${String(g.no).padStart(2, '0')} ${g.label}`;
  const singleHtml = () => {
    const S = A.single;
    if (!S) return `<div class="seg"><b>🎙️ ไฟล์เสียงพากย์ทั้งคลิป (ไฟล์เดียว)</b><p class="hint">สร้างเสียงจากสคริปต์ทั้งหมดในครั้งเดียวที่ AI Studio (ที่ขั้น 4 กด 🔊 สร้างเสียง → 📋 คัดลอกทั้งคลิป) แล้วนำไฟล์มาใส่ที่นี่ แอปจะหา "ช่วงเงียบ" ระหว่างย่อหน้าเพื่อแบ่งท่อนให้ตรงกับภาพ</p><div class="tools"><button class="ib wide" id="pickSingle">+ เลือกไฟล์เสียงทั้งคลิป</button></div></div>`;
    const stale = S.sig !== fullSig();
    const rows = (align || []).map((x, i) => { const g = segsAll[i]; return `<div class="alrow"><div class="alt"><b>${label(g)}</b><small>${fmtSec(x.a0)}–${fmtSec(x.a1)} · ${(x.a1 - x.a0).toFixed(1)} วิ · ${i === 0 ? 'จุดเริ่มเสียง' : (x.found ? '✓ พบช่วงเงียบตรงรอยต่อ' : '⚠️ ไม่พบช่วงเงียบ (ประมาณตามข้อความ)')}</small></div>
      ${i ? `<div class="alb"><button class="ib sm" data-nudge="${x.key}|-0.2" aria-label="เลื่อนขอบเข้าก่อน">◀</button><button class="ib sm" data-listen="${x.a0}" aria-label="ฟังรอยต่อ">▶</button><button class="ib sm" data-nudge="${x.key}|0.2" aria-label="เลื่อนขอบถัดไป">▶▶</button></div>` : ''}</div>`; }).join('');
    return `<div class="seg"><div class="seg-h"><b>🎙️ ไฟล์เสียงทั้งคลิป</b><span class="badge">✅ ${fmtSec(S.dur)}</span></div><p class="hint">📄 ${S.name.replace(/</g, '&lt;')}</p>
      <audio id="singleAud" controls preload="metadata" src="${urlFor('s', S.blob)}" style="width:100%"></audio>
      ${stale ? '<p class="stale">⚠️ สคริปต์ถูกแก้หลังอัปโหลดเสียง การแบ่งท่ออาจเพี้ยน และเสียงอาจไม่ตรงข้อความ</p>' : ''}
      <p class="hint"><b>การแบ่งท่อนจากเสียง</b> (ตรวจรอยต่อแต่ละท่อน: กด ▶ ฟังตรงรอยต่อ ถ้าไม่ตรงกด ◀ ▶▶ เลื่อนครั้งละ 0.2 วินาที)</p>${rows}
      <div class="tools"><button class="ib wide" id="pickSingle">↻ เปลี่ยนไฟล์</button><button class="ib" id="rmSingle" aria-label="ลบ">🗑️</button></div></div>`;
  };
  const chunkHtml = () => chunks.length ? `<button class="btn" id="multi">📂 เลือกไฟล์เสียงหลายไฟล์พร้อมกัน (จับคู่ตามเลขในชื่อไฟล์)</button>
    <p class="hint" id="audMsg">${have}/${chunks.length} ช่วงมีไฟล์เสียงแล้ว${have ? ` · เสียงพากย์รวม ${fmtSec(totalVoice)}` : ''}</p>
    ${chunks.map((c, i) => { const a = audStore()[audKey(i, c)], est = secOf(c.texts.join('')), bad = a && a.sig !== chunkSig(c), off = a && Math.abs(a.dur - est) > Math.max(6, est * 0.5);
      return `<div class="seg" data-ci="${i + 1}"><div class="seg-h"><b>ช่วง ${String(i + 1).padStart(2, '0')} · ท่อน ${c.nos[0]}${c.nos.length > 1 ? '–' + c.nos[c.nos.length - 1] : ''}</b><span class="badge">${a ? '✅ ' + fmtSec(a.dur) : 'ยังไม่มีไฟล์ · ประมาณ ' + est + ' วิ'}</span></div>
      <p class="hint">${beatsM ? `🎞️ ${c.beat.imgs.length ? c.beat.imgs.length + ' รูป · ' : ''}พูดว่า: "${c.texts[0].slice(0, 60).replace(/</g, '&lt;')}${c.texts[0].length > 60 ? '…' : ''}" · เป้า ~${Math.max(2, Math.round(c.len / SPEAK_CPS))} วิ` : `ขึ้นต้นว่า: "${c.texts[0].slice(0, 30).replace(/</g, '&lt;')}…"`}</p>
      ${a ? `<p class="hint">📄 ${a.name.replace(/</g, '&lt;')}</p><audio controls preload="none" src="${urlFor('c' + i, a.blob)}" style="width:100%"></audio>${bad ? '<p class="stale">⚠️ สคริปต์ช่วงนี้ถูกแก้หลังอัปโหลดเสียง เสียงอาจไม่ตรงข้อความ</p>' : ''}${off ? `<p class="stale">⚠️ ความยาวเสียง (${fmtSec(a.dur)}) ต่างจากที่คาดไว้ (~${est} วิ) มาก ตรวจว่าไฟล์ตรงกับช่วงนี้</p>` : ''}` : ''}
      <div class="tools"><button class="ib wide" data-pick="${i + 1}">${a ? '↻ เปลี่ยนไฟล์' : '+ เลือกไฟล์เสียง'}</button>${a ? `<button class="ib" data-rm="${i + 1}" aria-label="ลบ">🗑️</button>` : ''}</div></div>`; }).join('')}` : '<div class="soon">ยังไม่มีสคริปต์ กลับไปขั้น 4 ก่อน</div>';
  $('#view').innerHTML = `
    <h2>5 เสียง: เสียงพากย์และเพลง</h2>
    ${checklistHtml()}
    ${styleCardHtml()}
    <p class="hint">ใส่เสียงที่สร้างจาก Google AI Studio แอปจะวัดความยาวเสียงจริง ปรับเวลาแสดงรูปของแต่ละท่อนให้ตรงกับเสียง ให้มาสคอตขยับปากตามความดังของเสียง และใส่เสียงเข้าไฟล์ MP4 · ยังไม่มีเสียง กลับไป <button class="lnk" id="goScript">ขั้น 4 สคริปต์</button></p>
    <label class="sw"><input type="radio" name="amode" value="single" ${single ? 'checked' : ''}> ไฟล์เดียวทั้งคลิป (แนะนำ เสียงเป็นเนื้อเดียวกัน)</label>
    <label class="sw"><input type="radio" name="amode" value="chunks" ${A.mode === 'chunks' ? 'checked' : ''}> แยกเป็นหลายช่วง (ช่วงละหลายท่อน)</label>
    <label class="sw"><input type="radio" name="amode" value="beats" ${A.mode === 'beats' ? 'checked' : ''}> 🎞️ แยกตามภาพ (ช่วงสั้นช่วงละ 1 ภาพ ตรงจังหวะที่สุด · แก้เฉพาะช่วงได้) <b>แนะนำถ้าเสียงยังไม่ตรงภาพ</b></label>
    ${beatsM ? `<div class="soon" style="text-align:left">🎞️ <b>โหมดแยกตามภาพ:</b> สคริปต์ถูกแบ่งเป็นช่วงสั้นตามรูป ช่วงละ 1 ไฟล์เสียง (ดูตารางข้อความ+วินาทีที่ขั้น 4 ปุ่ม "🎙️ บทเสียงแบ่งช่วง") ใส่เสียงครบ แอปจะตั้งเวลาแสดงแต่ละรูปตามความยาวเสียงของช่วงนั้นพอดี ช่วงไหนจังหวะไม่ลงตัว แก้ข้อความหรือสร้างเสียงใหม่เฉพาะช่วงนั้นแล้วกด "↻ เปลี่ยนไฟล์"</div>` : ''}
    ${single ? singleHtml() : chunkHtml()}
    <div class="seg"><b>🎵 เพลงประกอบ</b>
      <p class="hint">เลือกเพลงสำเร็จรูป (ฟรี ใบอนุญาต CC0 ไม่ต้องใส่เครดิต) แล้วกดฟังก่อนเลือก หรือใช้ไฟล์ของคุณเอง · เพลงสั้นกว่าคลิป แอปต่อวนให้จนจบคลิปอัตโนมัติ (ต่อเนียนด้วยครอสเฟด) · เพลงยาวกว่าคลิป แอปตัดที่จบคลิป · ท้ายคลิปเพลงค่อยๆ เฟดเอาต์เสมอ · ความยาวคลิปตอนนี้ <b>${fmtSec(clipLen)}</b></p>
      <div id="catalog">${MUSIC_CATALOG.map(t => { const on = A.music && A.music.cat === t.id, fit = t.dur >= clipLen ? `ตัดที่จบคลิป + เฟดเอาต์` : `ต่อวน ${Math.ceil((clipLen - 2.5) / (t.dur - 2.5))} รอบ + เฟดเอาต์`;
        return `<div class="trk${on ? ' on' : ''}"><div class="alt"><b>${t.name}</b> <span class="badge">${fmtSec(t.dur)}</span><small>${t.style}<br>ผู้สร้าง: ${t.by} · ใบอนุญาต: ${t.lic} · ตรวจจากหน้าต้นทาง ${t.chk}<br>ในคลิปนี้: ${fit}</small></div>
          <audio controls preload="none" src="assets/music/${t.id}.mp3" style="width:100%"></audio>
          <div class="tools"><a class="lnk" href="${t.src}" target="_blank" rel="noopener">หน้าต้นทาง/ใบอนุญาต</a><button class="ib wide" data-use="${t.id}">${on ? '✅ ใช้อยู่' : '✓ ใช้เพลงนี้'}</button></div></div>`; }).join('')}</div>
      <p class="hint" id="catMsg"></p>
      ${A.music && !A.music.cat ? `<p class="hint">📄 ไฟล์ของคุณ: ${A.music.name.replace(/</g, '&lt;')} · ${fmtSec(A.music.dur || 0)}</p><audio id="musicAud" controls preload="none" src="${urlFor('m', A.music.blob)}" style="width:100%"></audio>` : ''}
      <div class="tools"><button class="ib wide" id="pickMusic">+ ใช้ไฟล์เพลงของฉัน</button>${A.music ? '<button class="ib" id="rmMusic" aria-label="ไม่ใช้เพลง">🗑️</button>' : ''}</div>
      <label class="sl"><span>ความดังเพลง ตอนมีเสียงพูด <b id="mvTxt">${A.musicVol}%</b> (เสียงพากย์ = 100%)</span><input type="range" id="mv" min="0" max="50" step="1" value="${A.musicVol}"></label>
      <label class="sw"><input type="checkbox" id="duck" ${A.duck ? 'checked' : ''}> 🎚️ ให้เพลงดังขึ้นเองตอนเสียงพูดเงียบ (เหมือนดีเจ)</label>
      <label class="fl"><span>เพลงดังขึ้นมากแค่ไหนตอนเงียบ</span><select class="ct" id="duckBoost"><option value="1.6" ${A.duckBoost == 1.6 ? 'selected' : ''}>เล็กน้อย (×1.6)</option><option value="2.5" ${A.duckBoost == 2.5 ? 'selected' : ''}>ปานกลาง (×2.5)</option><option value="4" ${A.duckBoost == 4 ? 'selected' : ''}>มาก (×4)</option></select></label>
      <div class="tools"><button class="ib wide" id="mixPrev">🎧 ฟังตัวอย่างเสียงผสม</button></div>
      <p class="hint" id="mixMsg"></p><audio id="mixAud" controls style="width:100%;display:none"></audio></div>
    <label class="sw"><input type="checkbox" id="sfx" ${A.sfx ? 'checked' : ''}> เสียงเอฟเฟกต์ที่แอปสร้างให้ (ตอนมาสคอตกระโดดลงมาและตอนดีใจ ในไตเติลและเครดิต)</label>
    <button class="btn" id="nx">ถัดไป: 6 มาสคอต →</button><button class="btn alt" id="bk">← ย้อนกลับ</button>`;
  bindStyleCard($('#view'));
  const rerender = () => viewAudio();
  const msg = t => { const m = $('#audMsg'); if (m) m.textContent = t; };
  const pickNum = f => { const m = f.name.replace(/\.[^.]+$/, '').match(/(\d{1,2})/); return m ? +m[1] : null; };
  const AUD = 'audio/*,.mp3,.wav,.m4a,.aac,.ogg';
  document.querySelectorAll('input[name=amode]').forEach(r => r.onchange = async () => { A.mode = r.value; await save(); rerender(); });
  if ($('#pickSingle')) $('#pickSingle').onclick = async () => {
    const [f] = await pickFiles(AUD, false); if (!f) return;
    try { const buf = await decodeBlob(f); A.single = { blob: f, name: f.name, dur: buf.duration, an: analyzeAudio(buf), adj: {}, sig: fullSig() }; await save(); }
    catch (e) { alert('อ่านไฟล์เสียงไม่ได้ ลองไฟล์ wav หรือ mp3'); } rerender();
  };
  if ($('#rmSingle')) $('#rmSingle').onclick = async () => { if (!confirm('ลบไฟล์เสียงทั้งคลิป?')) return; A.single = null; await save(); rerender(); };
  document.querySelectorAll('[data-nudge]').forEach(b => b.onclick = async () => { const [k, d] = b.dataset.nudge.split('|'); A.single.adj = A.single.adj || {}; A.single.adj[k] = Math.round(((A.single.adj[k] || 0) + +d) * 100) / 100; await save(); rerender(); });
  document.querySelectorAll('[data-listen]').forEach(b => b.onclick = () => { const au = $('#singleAud'); au.currentTime = Math.max(0, +b.dataset.listen - 1.2); au.play(); setTimeout(() => au.pause(), 3000); });
  if ($('#multi')) $('#multi').onclick = async () => {
    const fs = await pickFiles(AUD, true); if (!fs.length) return;
    const used = new Set(), todo = []; const sorted = fs.slice().sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
    sorted.forEach(f => { const n = pickNum(f); if (n && n <= chunks.length && !used.has(n)) { used.add(n); todo.push([n, f]); } else todo.push([null, f]); });
    let next = 1; todo.forEach(t => { if (t[0] == null) { while (used.has(next)) next++; if (next <= chunks.length) { t[0] = next; used.add(next); } } });
    let ok = 0, skip = [];
    for (const [n, f] of todo) { if (n == null) { skip.push(f.name); continue; } msg(`กำลังอ่านไฟล์ ${f.name}...`); try { if (await setChunkAudio(n, f)) ok++; } catch (e) { skip.push(f.name + ' (อ่านไม่ได้)'); } }
    await save(); if (skip.length) alert('ใส่เสียงให้ ' + ok + ' ช่วง\nข้ามไฟล์: ' + skip.join(', ')); rerender();
  };
  document.querySelectorAll('[data-pick]').forEach(b => b.onclick = async () => { const [f] = await pickFiles(AUD, false); if (!f) return; try { await setChunkAudio(+b.dataset.pick, f); await save(); } catch (e) { alert('อ่านไฟล์เสียงไม่ได้ ลองไฟล์ mp3 หรือ wav'); } rerender(); });
  document.querySelectorAll('[data-rm]').forEach(b => b.onclick = async () => { if (!confirm('ลบไฟล์เสียงช่วงนี้?')) return; { const ix = +b.dataset.rm - 1; delete audStore()[audKey(ix, ttsChunks()[ix])]; } await save(); rerender(); });
  document.querySelectorAll('[data-use]').forEach(b => b.onclick = async () => {
    const t = MUSIC_CATALOG.find(x => x.id === b.dataset.use), m = $('#catMsg'); b.disabled = true; m.textContent = `กำลังโหลดเพลง ${t.name}... (ต้องต่อเน็ตครั้งแรก)`;
    try { const r = await fetch(`assets/music/${t.id}.mp3`); if (!r.ok) throw new Error('โหลดไม่ได้ (' + r.status + ')'); const blob = await r.blob(); const buf = await decodeBlob(blob); A.music = { blob, name: t.name + '.mp3', dur: buf.duration, cat: t.id }; await save(); rerender(); }
    catch (e) { m.textContent = '❌ ' + (e.message || e) + ' · ตรวจอินเทอร์เน็ตแล้วลองใหม่'; b.disabled = false; }
  });
  $('#pickMusic').onclick = async () => { const [f] = await pickFiles('audio/*,.mp3,.wav,.m4a', false); if (!f) return; try { const buf = await decodeBlob(f); A.music = { blob: f, name: f.name, dur: buf.duration }; await save(); } catch (e) { alert('อ่านไฟล์เพลงไม่ได้ ลองไฟล์ mp3'); } rerender(); };
  if ($('#rmMusic')) $('#rmMusic').onclick = async () => { A.music = null; await save(); rerender(); };
  const mAud = $('#musicAud'); if (mAud) mAud.volume = Math.min(1, A.musicVol / 50);
  $('#mv').oninput = e => { A.musicVol = +e.target.value; $('#mvTxt').textContent = A.musicVol + '%'; if ($('#musicAud')) $('#musicAud').volume = Math.min(1, A.musicVol / 50); save(); };
  $('#duck').onchange = e => { A.duck = e.target.checked; save(); }; $('#duckBoost').onchange = e => { A.duckBoost = +e.target.value; save(); };
  $('#mixPrev').onclick = async e => {
    const btn = e.currentTarget, msg = $('#mixMsg'); btn.disabled = true; msg.textContent = 'กำลังผสมเสียง... (คลิป 3 นาทีใช้เวลาสักครู่)';
    try {
      const T = computeTimeline(), mix = await buildMix(T.starts, T.total, T.sceneAt);
      if (!mix) { msg.textContent = 'ยังไม่มีเสียงให้ผสม (ใส่ไฟล์เสียงหรือเพลงก่อน)'; }
      else { const au = $('#mixAud'); if (au.dataset.u) URL.revokeObjectURL(au.dataset.u); const url = URL.createObjectURL(wavBlob(mix.data, mix.sampleRate)); au.dataset.u = url; au.src = url; au.style.display = 'block'; msg.textContent = `ตัวอย่างเสียงผสมทั้งคลิป ยาว ${fmtSec(T.total)} · เสียงนี้ตรงกับที่จะอยู่ในไฟล์ MP4`; au.play(); }
    } catch (err) { msg.textContent = '❌ ผสมเสียงไม่สำเร็จ: ' + (err.message || err); }
    btn.disabled = false;
  };
  $('#sfx').onchange = e => { A.sfx = e.target.checked; save(); };
  $('#goScript').onclick = () => go(3); $('#nx').onclick = () => go(5); $('#bk').onclick = () => go(3);
}
function checklistHtml() {
  const A = state.audio, segs = scriptSegmentsAll(), withText = segs.filter(g => g.text.trim()), allText = segs.length > 0 && withText.length === segs.length;
  const voice = A.mode === 'single' ? !!A.single : Object.keys(audStore()).length > 0, al = A.mode === 'single' && A.single ? singleAlign() : null;
  const seams = al ? al.slice(1) : [], found = seams.filter(x => x.found).length, stale = A.mode === 'single' && A.single && A.single.sig !== fullSig();
  const row = (ok, t, sub) => `<div class="ckrow ${ok === true ? 'ok' : ok === false ? 'no' : ''}"><span>${ok === true ? '✅' : ok === false ? '⬜' : '➖'}</span><div><b>${t}</b>${sub ? `<small>${sub}</small>` : ''}</div></div>`;
  return `<div class="seg"><b>📋 ขั้นตอนทำเสียงให้เรียบร้อย</b>
    ${row(allText, '1) สคริปต์ครบทุกท่อน (เปิดคลิป → ห้องต่างๆ → ปิดท้าย) และตรวจข้อมูลแล้ว', allText ? '' : 'ยังมีท่อนว่าง กลับไปขั้น 4')}
    ${row(null, '2) นอกแอป: คัดลอกสไตล์ → ช่อง Style · คัดลอกทั้งคลิป → ช่องข้อความ · เลือกผู้พูดคนเดียว → Run → ดาวน์โหลด', 'ขั้น 4 กด 🔊 สร้างเสียง')}
    ${row(voice, '3) ใส่ไฟล์เสียงในแอป', voice ? '' : 'กดปุ่มด้านล่าง')}
    ${row(A.mode === 'single' ? (al ? (found === seams.length && !stale) : false) : null, '4) รอยต่อแต่ละท่อนตรงกับเสียง', A.mode === 'single' ? (al ? `${found}/${seams.length} รอยต่อพบช่วงเงียบ${stale ? ' · สคริปต์ถูกแก้หลังอัปโหลดเสียง' : ''} · กด ▶ ฟังตรวจแต่ละรอยต่อ` : 'ยังไม่มีไฟล์เสียง') : (A.mode === 'beats' ? 'โหมดแยกตามภาพ: เวลาแสดงแต่ละรูปตั้งตามความยาวเสียงของช่วงนั้นพอดี' : 'โหมดแยกช่วง: เวลาในช่วงเดียวกันแบ่งตามความยาวข้อความ'))}
    ${row(false, '5) ขั้น 6 ตรวจท่ามาสคอต แล้ว ขั้น 7 เรนเดอร์', '')}
  </div>`;
}
const fullSig = () => chunkSig({ texts: scriptSegmentsAll().filter(g => g.text.trim()).map(g => g.text.trim()) });

// ---- ผสมเสียงทั้งคลิป (เสียงพากย์ + เพลง + เอฟเฟกต์) เป็นแทร็กเดียว และเก็บแทร็กเสียงพากย์ล้วนไว้คำนวณการขยับปาก ----
const MIX_SR = 44100;
// เตรียมเพลงให้ยาวเท่าคลิป: ตัดความเงียบต้น-ท้าย → ถ้าสั้นกว่า ต่อวนด้วยครอสเฟด (equal-power) · ถ้ายาวกว่า ตัดที่จบคลิป
function fitMusic(buf, seconds, sr) {
  const ch = []; for (let c = 0; c < buf.numberOfChannels; c++) ch.push(buf.getChannelData(c));
  const len0 = buf.length, mono = new Float32Array(len0); let peak = 0;
  for (let i = 0; i < len0; i++) { let v = 0; for (let c = 0; c < ch.length; c++) v += ch[c][i]; mono[i] = v / ch.length; const a = Math.abs(mono[i]); if (a > peak) peak = a; }
  // ตัดความเงียบต้นเพลง และ "ท้ายเพลงที่กำลังเบาลง" (เฟดเอาต์เดิมของเพลง) ทิ้ง เพื่อให้รอยต่อตอนวนเพลงไม่เงียบ
  const w = Math.floor(sr * 0.1), nw = Math.floor(len0 / w), env = new Float32Array(nw);
  for (let k = 0; k < nw; k++) { let q = 0; for (let i = k * w; i < (k + 1) * w; i += 2) q += mono[i] * mono[i]; env[k] = Math.sqrt(q / (w / 2)); }
  const mid = Array.from(env.subarray(Math.floor(nw * 0.1), Math.max(Math.floor(nw * 0.1) + 1, Math.floor(nw * 0.9)))).sort((x, y) => x - y), med = mid[Math.floor(mid.length / 2)] || peak;
  let k0 = 0, k1 = nw - 1; while (k0 < nw && env[k0] < med * 0.2) k0++; while (k1 > k0 && env[k1] < med * 0.55) k1--;
  const a0 = Math.max(0, k0 * w), a1 = Math.min(len0 - 1, (k1 + 1) * w - 1);
  const seg = mono.subarray(a0, a1 + 1), L = seg.length, n = Math.ceil(seconds * sr), out = new Float32Array(n);
  if (L >= n) { out.set(seg.subarray(0, n)); return { data: out, loops: 0, L, X: 0 }; }
  const X = Math.min(Math.floor(sr * 2.5), Math.floor(L * 0.25)); let pos = 0, loops = 0;
  while (pos < n) {
    for (let i = 0; i < L && pos + i < n; i++) {
      let g = 1; if (pos > 0 && i < X) g = Math.sin(Math.PI / 2 * i / X); if (i > L - X) g *= Math.cos(Math.PI / 2 * (i - (L - X)) / X);
      out[pos + i] += seg[i] * g;
    }
    loops++; pos += L - X;
  }
  return { data: out, loops, L, X };
}
function wavBlob(data, sr) {
  const n = data.length, buf = new ArrayBuffer(44 + n * 2), v = new DataView(buf), w = (o, t) => { for (let i = 0; i < t.length; i++) v.setUint8(o + i, t.charCodeAt(i)); };
  w(0, 'RIFF'); v.setUint32(4, 36 + n * 2, true); w(8, 'WAVE'); w(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true); v.setUint32(24, sr, true); v.setUint32(28, sr * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true); w(36, 'data'); v.setUint32(40, n * 2, true);
  for (let i = 0; i < n; i++) v.setInt16(44 + i * 2, Math.max(-1, Math.min(1, data[i])) * 32767, true);
  return new Blob([buf], { type: 'audio/wav' });
}
// แผนเวลาทั้งคลิป (ใช้ตอนฟังตัวอย่างเสียงผสม): ฉากไตเติล → รูป (ฉากรถวิ่งแทรก) → ฉากเครดิต
// แผนเวลาของคลิปทั้งหมด (ต้องตรงกับที่ตัวเรนเดอร์ประกอบ): ฮุก(ภาพเด่น) → ฉากไตเติล → รูป (ฉากรถวิ่งแทรกตามตำแหน่ง) → ฉากเครดิต
const MASCOT_SELL = ['room:หน้าบ้าน/ภายนอก', 'room:สระว่ายน้ำ', 'room:สวน/ระเบียง', 'life'];
function makePlan() {
  const { pre, hero, imgs } = timelineImages(), routeOk = routeOkNow(), nH = hero ? 1 : 0;
  const routeAt = nH + pre.length + areaLibOrdered().filter(isMedia).length + state.items.filter(i => isMedia(i) && (i.room === AREA_ROOM || i.room === MAP_ROOM)).length;
  const durs = imageDurations(imgs), idKey = new Map(), idBeat = new Map();
  Object.entries(segPlan()).forEach(([k, P]) => P.imgs.forEach(i => idKey.set(i.id, k)));
  if (state.audio.mode === 'beats') beatsList().forEach(b => b.imgs.forEach(i => idBeat.set(i.id, b.id)));
  const entries = [];
  if (lib.titleBuiltin) entries.push({ key: 'open', dur: titleDur(), title: true });
  if (hero) entries.push({ key: 'hook', dur: hookDur(), cap: (hero.title || '').trim() || null, sub: catLabelOf(state.items.find(i => i.id === hero.srcId) || {}) });
  imgs.forEach((im, i) => { if (isHeroId(im.id)) return; if (routeOk && i === routeAt) entries.push({ key: null, dur: ROUTE_DUR }); entries.push({ key: idKey.get(im.id) || null, bkey: idBeat.get(im.id) || null, dur: durs[i].dur, cap: (!im.cat && (im.title || '').trim()) || null, sub: catLabelOf(im) }); });
  if (routeOk && routeAt >= imgs.length) entries.push({ key: null, dur: ROUTE_DUR });
  if (lib.closeBuiltin) entries.push({ key: 'close', dur: closeDur(), close: true });
  const starts = {}, sceneAt = {}; let acc = 0;
  entries.forEach(e => { if (e.key && starts[e.key] == null) starts[e.key] = acc; if (e.bkey && starts[e.bkey] == null) starts[e.bkey] = acc; if (e.title) sceneAt.title = acc; if (e.close) sceneAt.close = acc; acc += e.dur; });
  return { imgs, pre, hero, durs, entries, starts, sceneAt, routeOk, routeAt, total: acc + STYLE.fade };
}
function computeTimeline() { const P = makePlan(); return { starts: P.starts, sceneAt: P.sceneAt, total: P.total }; }
async function buildMix(starts, total, sceneAt) {
  const A = state.audio, sr = MIX_SR, n = Math.ceil(total * sr), voice = new Float32Array(n), ctx = new (audioCtxClass())(1, n, sr);
  let any = false, hasVoice = false;
  const put = (buf, a0, a1, dst) => {
    const chs = []; for (let c = 0; c < buf.numberOfChannels; c++) chs.push(buf.getChannelData(c));
    const s0 = Math.floor(a0 * buf.sampleRate), s1 = Math.min(buf.length, Math.floor(a1 * buf.sampleRate)), d0 = Math.floor(dst * sr), ramp = Math.floor(sr * 0.01);
    for (let i = s0; i < s1; i++) {
      const di = d0 + (i - s0); if (di < 0) continue; if (di >= n) break;
      let v = 0; for (let c = 0; c < chs.length; c++) v += chs[c][i]; v /= chs.length;
      const e = Math.min(i - s0, s1 - 1 - i); if (e < ramp) v *= e / ramp; voice[di] += v;
    }
    hasVoice = true;
  };
  if (A.mode === 'single') {
    const al = A.single && singleAlign();
    if (al) { const buf = await decodeBlob(A.single.blob); al.forEach(x => { const st = starts[x.key]; if (st != null) put(buf, x.a0, x.a1, st); }); }
  } else {
    const chunks = ttsChunks();
    for (let i = 0; i < chunks.length; i++) { const a = audStore()[audKey(i, chunks[i])]; if (!a) continue; const st = starts[chunks[i].keys[0]]; if (st == null) continue; put(await decodeBlob(a.blob), 0, a.dur, st); }
  }
  if (hasVoice) { const vb = ctx.createBuffer(1, n, sr); vb.copyToChannel(voice, 0); const src = ctx.createBufferSource(); src.buffer = vb; src.connect(ctx.destination); src.start(0); any = true; }
  if (A.music && A.musicVol > 0) {
    const mdec = await ctx.decodeAudioData(await A.music.blob.arrayBuffer()), fit = fitMusic(mdec, total, sr), mb = ctx.createBuffer(1, fit.data.length, sr); mb.copyToChannel(fit.data, 0);
    const src = ctx.createBufferSource(); src.buffer = mb;
    const v = A.musicVol / 100, boost = A.duck && hasVoice ? (A.duckBoost || 2.5) : 1, hopS = 0.05, hop = Math.floor(sr * hopS), m = Math.ceil(n / hop) + 1;
    // ตรวจว่าตอนไหนมีคนพูด (เสียงพากย์) → หรี่เพลงก่อนเริ่มพูด 0.15 วิ และค่อยๆ ดันกลับหลังพูดจบ (~0.7 วิ)
    const act = new Float32Array(m);
    if (boost > 1) {
      const r = new Float32Array(m); for (let i = 0; i < m; i++) { let sum = 0, c = 0; const a = i * hop, e = Math.min(n, a + hop * 2); for (let j = a; j < e; j += 4) { sum += voice[j] * voice[j]; c++; } r[i] = c ? Math.sqrt(sum / c) : 0; }
      const sorted = Array.from(r).filter(x => x > 1e-4).sort((x, y) => x - y), ref = sorted.length ? sorted[Math.floor(sorted.length * 0.95)] : 1, sp = new Uint8Array(m);
      for (let i = 0; i < m; i++) sp[i] = r[i] > ref * 0.07 ? 1 : 0;
      let prev = 0; for (let i = 0; i < m; i++) { let t = 0; for (let k = i; k < Math.min(m, i + 3); k++) if (sp[k]) { t = 1; break; } prev = Math.max(t, prev - hopS / 0.7); act[i] = prev; }
    }
    const curve = new Float32Array(m);
    for (let i = 0; i < m; i++) { const t = i * hopS; let g = v * (1 + (boost - 1) * (1 - act[i])); g *= Math.min(1, t / 1.5) * Math.min(1, Math.max(0, (total - t) / 3)); curve[i] = Math.min(0.85, g); }
    const g = ctx.createGain(); g.gain.setValueCurveAtTime(curve, 0, (m - 1) * hopS);
    src.connect(g).connect(ctx.destination); src.start(0); any = true;
  }
  if (A.sfx) {
    const pop = t => { const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(520, t); o.frequency.exponentialRampToValueAtTime(140, t + 0.2); g.gain.setValueAtTime(0.35, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.25); o.connect(g).connect(ctx.destination); o.start(t); o.stop(t + 0.3); };
    const chime = t => [1568, 2093, 2637].forEach((f, i) => { const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'sine'; o.frequency.value = f; g.gain.setValueAtTime(0.0001, t + i * 0.09); g.gain.linearRampToValueAtTime(0.16, t + i * 0.09 + 0.02); g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.09 + 1.1); o.connect(g).connect(ctx.destination); o.start(t + i * 0.09); o.stop(t + i * 0.09 + 1.2); });
    if (sceneAt.title != null) { pop(sceneAt.title + 0.9); chime(sceneAt.title + 4.2); }
    if (sceneAt.close != null) pop(sceneAt.close + 0.8);
    any = true;
  }
  if (!any) return null;
  const buf = await ctx.startRendering(); return { data: buf.getChannelData(0), sampleRate: sr, voice: hasVoice ? voice : null };
}

// ---- ขั้น 6: มาสคอต ----
async function viewMascot() {
  const M = state.mascot, segs = scriptSegments();
  $('#view').innerHTML = `<h2>6 มาสคอต</h2><p class="hint">กำลังโหลดมาสคอต...</p>`;
  await loadPoses(); await loadMyPoses();
  state.script.poses = state.script.poses || {};
  $('#view').innerHTML = `
    <h2>6 มาสคอต</h2>
    <p class="hint">มาสคอตปรากฏเต็มตัวในฉากไตเติลและเครดิตปิดเสมอ ขยับปากตามเสียงพากย์ และกะพริบตา · ที่นี่ตั้งค่า <b>มาสคอตนำเสนอ</b> ที่ยืนมุมจอระหว่างเล่าเรื่องแต่ละห้อง เปลี่ยนท่าตามเนื้อหา</p>
    <label class="sw"><input type="checkbox" id="mpres" ${M.presenter ? 'checked' : ''}> แสดงมาสคอตนำเสนอระหว่างเล่าเรื่อง</label>
    <label class="sw"><input type="checkbox" id="mfid" ${M.fidget !== false ? 'checked' : ''}> ให้มาสคอตดุกดิก (หายใจ โยกตัว ตัวเด้งตามเสียงพูด สั่นตัว กระโดดเล็ก เอียงหัว ทั้งตอนยืน เดิน นั่ง นอน)</label>
    <label class="sw"><input type="checkbox" id="mrnd" ${M.random !== false ? 'checked' : ''}> สุ่มอิริยาบถ (เรนเดอร์แต่ละครั้งได้ลำดับท่า ท่านั่ง นอน พิงขอบ ไม่เหมือนกัน)</label>
    <div class="seg"><b>🎭 จังหวะการโผล่ของมาสคอต</b>
      <label class="sw"><input type="radio" name="mcad" value="smart" ${M.cadence !== 'always' ? 'checked' : ''}> ฉลาด (แนะนำ): เด่นตอนทักทาย (ฉากไตเติล) · โผล่ใหญ่ตอนชี้จุดขาย (หน้าบ้าน สระ สวน) · ช่วงชมห้องต่างๆ โผล่แวบสั้นๆ แล้วหายไป ให้ภาพบ้านเป็นหลัก · เด่นตอนปิดคลิป (ฉากเครดิต)</label>
      <label class="sw"><input type="radio" name="mcad" value="always" ${M.cadence === 'always' ? 'checked' : ''}> โผล่ตลอดทุกท่อน (แบบเดิม)</label></div>
    <label class="sw"><input type="checkbox" id="mmove" ${M.move !== false ? 'checked' : ''}> ให้มาสคอตเคลื่อนไหว (เดินข้ามจอบ้าง นั่งยอง นอน เดินกลับ สลับไปแต่ละท่อน)</label>
    <div class="seg"><div class="tgt"><label class="fl" style="flex:1"><span>ขนาด</span><select class="ct" id="msize"><option value="0.2" ${M.size === 0.2 ? 'selected' : ''}>เล็ก</option><option value="0.28" ${M.size === 0.28 ? 'selected' : ''}>กลาง</option><option value="0.36" ${M.size === 0.36 ? 'selected' : ''}>ใหญ่</option></select></label>
      <label class="fl" style="flex:1"><span>ตำแหน่ง</span><select class="ct" id="mside"><option value="left" ${M.side === 'left' ? 'selected' : ''}>มุมซ้ายล่าง</option><option value="right" ${M.side === 'right' ? 'selected' : ''}>มุมขวาล่าง</option></select></label></div></div>
    <p class="hint"><b>ท่าพิเศษของฉัน (ใส่เพิ่มเองได้)</b> · แอปมีท่านั่ง นอน และยืนพิงขอบจอ 24 ท่าให้ใช้อัตโนมัติแล้ว ช่องด้านล่างไว้ใส่ท่าของคุณเองเพิ่ม (ถ้าใส่ แอปจะใช้ท่าของคุณก่อน) รวมถึงท่า <b>นอนเท้าคาง</b> 6 ท่าด้วย</p>
    ${MY_POSES.map(d => { const has = !!(lib.myPoses || {})[d.id]; return `<div class="seg"><div class="seg-h"><b>${d.label}</b></div><div class="mrow"><canvas class="mth myth" data-my="${d.id}" width="90" height="130"></canvas><div style="flex:1"><div class="hint" style="margin:0 0 6px">${has ? '✅ ใส่รูปแล้ว' : 'ยังไม่มีรูป'} · ${d.hint}</div><div class="tools"><label class="ib wide" style="cursor:pointer">📷 ${has ? 'เปลี่ยนรูป' : 'เลือกรูป'}<input type="file" accept="image/*" data-up="${d.id}" hidden></label><button class="ib wide" data-cp="${d.id}">📋 คัดลอกคำสั่งสร้างรูป</button>${has ? `<button class="ib wide" data-rm="${d.id}">🗑 ลบ</button>` : ''}</div></div></div></div>`; }).join('')}
    <p class="hint">วิธีสร้างรูป: กด "คัดลอกคำสั่งสร้างรูป" → เปิดแอป AI สร้างรูปที่ใช้อยู่ (เช่น Gemini หรือ ChatGPT) → แนบรูปมาสคอตเดิม 1 รูปเป็นต้นแบบ → วางคำสั่ง → โหลดรูปที่ได้ แล้วกด "เลือกรูป" ที่นี่ แอปจะลบพื้นหลังเรียบๆ (สีขาว) ให้เอง</p>
    <p class="hint"><b>ท่าของแต่ละท่อน</b> (แอปเลือกให้ตามเนื้อหา แตะเพื่อเลือกจากรูป)</p>
    ${segs.map(g => { const cur = poseForSeg(g.key); return `<div class="seg"><div class="seg-h"><b>${String(g.no).padStart(2, '0')} · ${g.label}</b></div><div class="mrow"><canvas class="mth" data-pk="${g.key}" width="90" height="130"></canvas><button class="btn alt pickp" data-pose="${g.key}">${POSES[cur].label} ▾<small>แตะเพื่อเลือกจากรูป</small></button></div><label class="fl" style="margin-top:6px"><span>การโผล่ในท่อนนี้</span><select class="ct" data-role="${g.key}">${[['', 'อัตโนมัติ (' + (MASCOT_SELL.includes(g.key) ? 'เด่น ชี้จุดขาย' : 'แวบสั้นๆ') + ')'], ['sell', 'เด่น (ชี้จุดขาย ~7 วิ)'], ['tour', 'แวบสั้นๆ (~3 วิ)'], ['hide', 'ไม่โผล่ (ภาพบ้านล้วน)']].map(([v, t]) => `<option value="${v}" ${((state.script.mrole || {})[g.key] || '') === v ? 'selected' : ''}>${t}</option>`).join('')}</select></label></div>`; }).join('') || '<div class="soon">ยังไม่มีท่อนเล่าเรื่อง</div>'}
    <p class="hint">ปากขยับตามความดังของเสียงพากย์จริง ตอนเรนเดอร์ (ถ้ายังไม่ใส่เสียง ปากจะปิด) · มาสคอตกระโดดเข้าจอทุกครั้งที่เริ่มท่อนใหม่ · มาสคอตเดินข้ามจอ นั่ง นอน สลับไปในแต่ละท่อน</p>
    <button class="btn" id="nx">ถัดไป: 7 เรนเดอร์ →</button><button class="btn alt" id="bk">← ย้อนกลับ</button>`;
  const thumb = (cv, pose) => { const x = cv.getContext('2d'), img = MASCOT_IMG[pose]; x.clearRect(0, 0, cv.width, cv.height); if (!img) return; const cw = cv.width, ch = cv.height; if (POSES[pose] && POSES[pose].custom) { const s = Math.min(124 * (typeof ARTF !== 'undefined' && ARTF[pose] || 1) / img.height, (cw - 4) / img.width); x.drawImage(img, (cw - img.width * s) / 2, ch - 3 - img.height * s, img.width * s, img.height * s); } else drawMascotTalking(x, pose, cw / 2, ch - 3, ch - 6, { mouth: 0.45, wf: 1, blink: 0 }); };
  const paint = cv => thumb(cv, poseForSeg(cv.dataset.pk));
  document.querySelectorAll('.mth[data-pk]').forEach(paint);
  document.querySelectorAll('.myth').forEach(cv => thumb(cv, cv.dataset.my));
  document.querySelectorAll('[data-pose]').forEach(btn => btn.onclick = async () => {
    const key = btn.dataset.pose, d = document.createElement('div'); d.className = 'sheet tall'; d.id = 'poseSheet';
    d.innerHTML = '<div class="sh-head"><b>เลือกท่ามาสคอต</b><button class="ib" id="pcl">✕</button></div><p class="hint">กำลังโหลดรูปท่าทั้งหมด...</p>'; document.body.appendChild(d);
    d.querySelector('#pcl').onclick = () => d.remove();
    await loadPoses(Object.keys(POSES));
    const cells = ks => ks.map(k => `<button class="pcell ${k === poseForSeg(key) ? 'on' : ''}" data-k="${k}"><canvas width="${POSES[k].custom ? 150 : 90}" height="${POSES[k].custom ? Math.max(130, Math.round(124 * (ARTF[k] || 1)) + 8) : 130}" class="${POSES[k].custom ? 'wide' : ''}"></canvas><span>${POSES[k].label}</span></button>`).join('');
    const std = Object.keys(POSES).filter(k => !POSES[k].custom), mine = Object.keys(POSES).filter(k => POSES[k].custom && !POSES[k].sticker && !POSES[k].art), art = Object.keys(POSES).filter(k => POSES[k].art), stk = Object.keys(POSES).filter(k => POSES[k].sticker);
    d.innerHTML = `<div class="sh-head"><b>เลือกท่ามาสคอต</b><button class="ib" id="pcl">✕</button></div>
      <p class="hint"><b>ท่าปากขยับตามเสียง</b></p><div class="pgrid">${cells(std)}</div>
      ${mine.length ? `<p class="hint"><b>ท่าพิเศษของฉัน</b> (ปากไม่ขยับ)</p><div class="pgrid">${cells(mine)}</div>` : ''}
      <p class="hint"><b>ท่านั่ง / นอน / ยืนพิงขอบจอ</b> (ปากไม่ขยับ · มาสคอตใช้ท่าเหล่านี้เองตอนนั่ง นอน พิงที่มุมจอ)</p><div class="pgrid">${cells(art)}</div>
      <p class="hint"><b>สติกเกอร์พร้อมข้อความ</b> (ปากไม่ขยับ ใช้ภาพต้นฉบับ)</p><div class="pgrid">${cells(stk)}</div>`;
    d.querySelectorAll('.pcell').forEach(c => { thumb(c.querySelector('canvas'), c.dataset.k); c.onclick = () => { state.script.poses[key] = c.dataset.k; save(); d.remove(); viewMascot(); }; });
    d.querySelector('#pcl').onclick = () => d.remove();
  });
  document.querySelectorAll('[data-up]').forEach(inp => inp.onchange = async () => {
    const f = inp.files[0]; if (!f) return; try { lib.myPoses[inp.dataset.up] = await removePlainBg(f); await saveLib(); await loadMyPoses(); } catch (e) { alert('ใช้รูปนี้ไม่ได้: ' + (e.message || e)); } viewMascot();
  });
  document.querySelectorAll('[data-rm]').forEach(b => b.onclick = async () => { if (!confirm('ลบรูปท่านี้?')) return; delete lib.myPoses[b.dataset.rm]; await saveLib(); await loadMyPoses(); viewMascot(); });
  document.querySelectorAll('[data-cp]').forEach(b => b.onclick = async () => { const d = MY_POSES.find(x => x.id === b.dataset.cp); try { await navigator.clipboard.writeText(d.prompt); b.textContent = '✅ คัดลอกแล้ว'; } catch (e) { prompt('คัดลอกคำสั่งนี้เอง', d.prompt); } });
  $('#mpres').onchange = e => { M.presenter = e.target.checked; save(); };
  $('#mmove').onchange = e => { M.move = e.target.checked; save(); };
  document.querySelectorAll('input[name=mcad]').forEach(r => r.onchange = () => { M.cadence = r.value; save(); });
  document.querySelectorAll('[data-role]').forEach(s => s.onchange = () => { state.script.mrole = state.script.mrole || {}; if (s.value) state.script.mrole[s.dataset.role] = s.value; else delete state.script.mrole[s.dataset.role]; save(); });
  $('#mrnd').onchange = e => { M.random = e.target.checked; save(); };
  $('#mfid').onchange = e => { M.fidget = e.target.checked; save(); };
  $('#msize').onchange = e => { M.size = +e.target.value; save(); }; $('#mside').onchange = e => { M.side = e.target.value; save(); };
  $('#nx').onclick = () => go(6); $('#bk').onclick = () => go(4);
}

function render() {
  clearInterval(previewTimer);
  renderSteps();
  if (state.home) return viewHome();
  if (state.step === 0) viewSize(); else if (state.step === 6) viewRender(); else if (state.step === 1) viewSlots(); else if (state.step === 2) viewColor(); else if (state.step === 3) viewScript(); else if (state.step === 4) viewAudio(); else if (state.step === 5) viewMascot(); else viewComing();
}

(async () => {
  await loadLib(); await migrateProjects(); state.home = true; render();
  try { navigator.storage && navigator.storage.persist && navigator.storage.persist(); } catch (e) {}
  $('#homeBtn').onclick = goHome;
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js');
})();

// ลบพื้นหลังเรียบๆ (เช่นสีขาว) ของรูปที่อัปโหลด: ไล่จากขอบรูปเข้ามาตามสีใกล้เคียงพื้น แล้วตัดขอบให้พอดีตัวมาสคอต · รูปที่โปร่งใสอยู่แล้วจะไม่แตะ
async function removePlainBg(file) {
  const bmp = await createImageBitmap(file), k = Math.min(1, 1000 / Math.max(bmp.width, bmp.height)), w = Math.round(bmp.width * k), h = Math.round(bmp.height * k);
  const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(bmp, 0, 0, w, h);
  const img = x.getImageData(0, 0, w, h), d = img.data, at = (px, py) => (py * w + px) * 4;
  let transparent = 0; for (let i = 3; i < d.length; i += 4 * 97) if (d[i] < 250) transparent++;
  if (transparent < 5) { // มีพื้นหลังทึบ → ลบ
    const cs = [[0, 0], [w - 1, 0], [0, h - 1], [w - 1, h - 1]].map(([px, py]) => { const i = at(px, py); return [d[i], d[i + 1], d[i + 2]]; }), bg = [0, 1, 2].map(j => Math.round(cs.reduce((s, q) => s + q[j], 0) / 4));
    const near = i => Math.hypot(d[i] - bg[0], d[i + 1] - bg[1], d[i + 2] - bg[2]) < 48, seen = new Uint8Array(w * h), st = [];
    const push = (px, py) => { const p = py * w + px; if (!seen[p] && near(p * 4)) { seen[p] = 1; st.push(p); } };
    for (let i = 0; i < w; i++) { push(i, 0); push(i, h - 1); } for (let j = 0; j < h; j++) { push(0, j); push(w - 1, j); }
    while (st.length) { const p = st.pop(), px = p % w, py = (p / w) | 0; if (px > 0) push(px - 1, py); if (px < w - 1) push(px + 1, py); if (py > 0) push(px, py - 1); if (py < h - 1) push(px, py + 1); }
    for (let p = 0; p < w * h; p++) if (seen[p]) d[p * 4 + 3] = 0;
    for (let py = 1; py < h - 1; py++) for (let px = 1; px < w - 1; px++) { const p = py * w + px; if (!seen[p] && (seen[p - 1] || seen[p + 1] || seen[p - w] || seen[p + w])) d[p * 4 + 3] = 150; } // ขอบนุ่ม
    x.putImageData(img, 0, 0);
  }
  const im2 = x.getImageData(0, 0, w, h).data; let x0 = w, y0 = h, x1 = 0, y1 = 0;
  for (let py = 0; py < h; py++) for (let px = 0; px < w; px++) if (im2[(py * w + px) * 4 + 3] > 20) { if (px < x0) x0 = px; if (px > x1) x1 = px; if (py < y0) y0 = py; if (py > y1) y1 = py; }
  if (x1 <= x0 || y1 <= y0) throw new Error('ไม่พบตัวมาสคอตในรูป (พื้นหลังอาจไม่เรียบ)');
  const o = document.createElement('canvas'); o.width = x1 - x0 + 1; o.height = y1 - y0 + 1; o.getContext('2d').drawImage(c, x0, y0, o.width, o.height, 0, 0, o.width, o.height);
  return new Promise(r => o.toBlob(r, 'image/png'));
}

// คลิปที่เรนเดอร์แล้วและเก็บไว้ในแอป: ดูซ้ำ/ดาวน์โหลด/ลบไฟล์ได้ที่ขั้น 7
async function fillSaved() {
  const pid = state.pid, m = pid && metaOf(pid), box = $('#saved'); if (!box || !m || !m.rendered || !m.rendered.saved) return;
  const v = await DB.get('video:' + pid); if (!v || state.pid !== pid || !$('#saved')) return;
  const u = URL.createObjectURL(v);
  box.innerHTML = `<div class="soon" style="text-align:left"><b>🎬 คลิปที่เรนเดอร์ไว้แล้ว</b> · ${fmtDate(m.rendered.at)} · ${mb(m.rendered.size)} · ${m.rendered.downloaded ? '✅ ดาวน์โหลดแล้ว' : '⬇ ยังไม่ได้ดาวน์โหลด'}
    <video src="${u}" controls playsinline style="width:100%;max-height:50vh;background:#000;border-radius:12px;margin-top:8px"></video>
    <a class="btn" id="dl0" download="${clipName(m)}.mp4" href="${u}" style="text-decoration:none;text-align:center">⬇ บันทึกไฟล์ MP4</a>
    <button class="btn alt" id="rmv">🗑 ลบวิดีโอที่เก็บไว้ในแอป (ประหยัดพื้นที่)</button>
    <p class="hint">กด "เริ่มเรนเดอร์" ด้านล่างเพื่อทำใหม่ (วิดีโอใหม่จะแทนอันนี้)</p></div>`;
  $('#dl0').onclick = () => markDownloaded(pid);
  $('#rmv').onclick = async () => { if (confirm('ลบวิดีโอที่เก็บไว้ในแอป? (รูปและสคริปต์ยังอยู่ เรนเดอร์ใหม่ได้)')) { await removeVideo(pid); box.innerHTML = ''; } };
}
