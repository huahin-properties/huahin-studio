// ผังเรื่อง (Storyboard) = แท็บเช็กลิสต์ของขั้น 2 + คลังกลาง (ไตเติล/หน้าปิด/ภาพหัวหินใส่ครั้งเดียวใช้ซ้ำ)
const AREA_ROOM = 'ทำเล/ใกล้เคียง';
const MAP_ROOM = 'แผนที่/การเดินทาง';
const AREA_CATS = [
  { id: 'city', label: 'เมืองหัวหิน / มุมสูง' },
  { id: 'market', label: 'ตลาด / ร้านอาหาร' },
  { id: 'beach', label: 'ชายหาด / ทะเล' },
  { id: 'mountain', label: 'ภูเขา / ธรรมชาติ' },
  { id: 'landmark', label: 'สถานที่สำคัญ / แลนด์มาร์ก' },
  { id: 'hospital', label: 'โรงพยาบาล' },
  { id: 'mall', label: 'ห้างสรรพสินค้า / ช้อปปิ้ง' },
  { id: 'water', label: 'สวนน้ำ / Black Mountain' },
  { id: 'golf', label: 'สนามกอล์ฟ' },
];
// min = ต้องมีอย่างน้อย (ไม่ถึง = ❌ เรนเดอร์ไม่ได้) · rec = แนะนำ (ไม่ถึง = ⚠️)
const SLOTS = [
  { id: 'title', ico: '🎬', short: 'ไตเติล', label: 'ไตเติล (คลิปประจำ)', kind: 'lib', min: 1, rec: 1, max1: true, hint: 'คลิปไตเติลที่ทำไว้ "สวัสดีครับ" · 1 ไฟล์ · ใส่ครั้งเดียวใช้ซ้ำทุกคลิป' },
  { id: 'cat-city', ico: '🏙️', short: 'เมือง', label: 'ทำเล: เมืองหัวหิน / มุมสูง', kind: 'lib', cat: 'city', min: 1, rec: 1, hint: 'ภาพมุมสูง/ภาพกว้างเมืองหัวหิน 1–4 ภาพ · ใส่ครั้งเดียวใช้ซ้ำทุกคลิป' },
  { id: 'cat-market', ico: '🛒', short: 'ตลาด', label: 'ทำเล: ตลาด / ร้านอาหาร', kind: 'lib', cat: 'market', min: 1, rec: 1, hint: 'ตลาด ร้านอาหาร ชีวิตผู้คน 1–4 ภาพ · ใส่ครั้งเดียวใช้ซ้ำ' },
  { id: 'cat-beach', ico: '🏖️', short: 'หาด', label: 'ทำเล: ชายหาด / ทะเล', kind: 'lib', cat: 'beach', min: 1, rec: 1, hint: 'หาดหัวหิน ทะเล พระอาทิตย์ตก 1–4 ภาพ · ใส่ครั้งเดียวใช้ซ้ำ' },
  { id: 'cat-mountain', ico: '⛰️', short: 'ภูเขา', label: 'ทำเล: ภูเขา / ธรรมชาติ', kind: 'lib', cat: 'mountain', min: 1, rec: 1, hint: 'ภูเขา ธรรมชาติรอบหัวหิน 1–4 ภาพ · ใส่ครั้งเดียวใช้ซ้ำ' },
  { id: 'map', ico: '🗺️', short: 'แผนที่', label: 'แผนที่เข้าโครงการ (ไม่ใส่ก็ได้)', kind: 'room', rooms: [MAP_ROOM], room: MAP_ROOM, min: 0, rec: 0, hint: 'แคปหน้า Google Maps พร้อมเส้นทางเข้าโครงการ 1–4 ภาพ · ไม่อยากเปิดเผยที่ตั้งก็ข้ามได้' },
  { id: 'ext', ico: '🏡', short: 'หน้าบ้าน', label: 'หน้าบ้าน / ภายนอก', kind: 'room', rooms: ['หน้าบ้าน/ภายนอก'], room: 'หน้าบ้าน/ภายนอก', min: 1, rec: 2, hint: 'หน้าบ้านมุมกว้าง ยืนหน้าประตูรั้ว 1–4 ภาพ' },
  { id: 'park', ico: '🚗', short: 'จอดรถ', label: 'ที่จอดรถ', kind: 'room', rooms: ['ที่จอดรถ'], room: 'ที่จอดรถ', min: 0, rec: 0, hint: 'โรงจอดรถ/ที่จอดรถ 1–2 ภาพ · ไม่มีก็ข้ามได้' },
  { id: 'liv', ico: '🛋️', short: 'นั่งเล่น', label: 'ห้องนั่งเล่น', kind: 'room', rooms: ['ห้องนั่งเล่น'], room: 'ห้องนั่งเล่น', min: 0, rec: 1, hint: 'ห้องนั่งเล่นมุมกว้าง เปิดไฟให้สว่าง 1–4 ภาพ' },
  { id: 'dine', ico: '🍽️', short: 'ทานอาหาร', label: 'ห้องทานอาหาร', kind: 'room', rooms: ['ห้องทานอาหาร'], room: 'ห้องทานอาหาร', min: 0, rec: 0, hint: 'โต๊ะอาหาร 1–2 ภาพ · ไม่มีก็ข้ามได้' },
  { id: 'kit', ico: '🍳', short: 'ครัว', label: 'ครัว', kind: 'room', rooms: ['ครัว'], room: 'ครัว', min: 0, rec: 1, hint: 'ครัว เคาน์เตอร์ เครื่องใช้ไฟฟ้า 1–4 ภาพ' },
  { id: 'bed', ico: '🛏️', short: 'ห้องนอน', label: 'ห้องนอน', kind: 'room', rooms: ['ห้องนอนใหญ่', 'ห้องนอน'], room: 'ห้องนอน', min: 0, rec: 1, hint: 'ห้องนอนหลัก/ห้องนอนอื่น 1–4 ภาพ' },
  { id: 'bath', ico: '🚿', short: 'ห้องน้ำ', label: 'ห้องน้ำ', kind: 'room', rooms: ['ห้องน้ำ'], room: 'ห้องน้ำ', min: 0, rec: 1, hint: 'ห้องน้ำ 1–3 ภาพ' },
  { id: 'pool', ico: '🏊', short: 'สระ', label: 'สระว่ายน้ำ (ถ้ามี)', kind: 'room', rooms: ['สระว่ายน้ำ'], room: 'สระว่ายน้ำ', min: 0, rec: 0, hint: 'สระว่ายน้ำ 1–4 ภาพ · ไม่มีก็ข้ามได้' },
  { id: 'garden', ico: '🌴', short: 'สวน', label: 'สวน / ระเบียง (ถ้ามี)', kind: 'room', rooms: ['สวน/ระเบียง'], room: 'สวน/ระเบียง', min: 0, rec: 0, hint: 'สวน ระเบียง มุมพักผ่อน 1–3 ภาพ · ไม่มีก็ข้ามได้' },
  { id: 'cat-lifestyle', ico: '👨‍👩‍👧', short: 'ไลฟ์สไตล์', label: 'ไลฟ์สไตล์ (ครอบครัว / ออกกำลังกาย / ไปตลาด)', kind: 'lib', cat: 'lifestyle', min: 0, rec: 1, hint: 'ภาพหรือคลิปครอบครัวอยู่ด้วยกัน ออกกำลังกาย ไปตลาด 1–4 ภาพ · ใส่ครั้งเดียวใช้ซ้ำทุกคลิป' },
  { id: 'contact', ico: '☎️', short: 'ติดต่อ', label: 'เบอร์โทร / ข้อมูลติดต่อ', kind: 'contact', min: 1, rec: 1, hint: 'เลือกใช้เบอร์มาตรฐาน พิมพ์เบอร์ใหม่ หรือไม่แสดงเบอร์' },
  { id: 'close', ico: '🏁', short: 'เครดิตปิด', label: 'เครดิตปิดท้าย (คลิปประจำ)', kind: 'lib', min: 1, rec: 1, max1: true, hint: 'คลิปเครดิต/ข้อมูลติดต่อปิดท้าย · 1 ไฟล์ · ใส่ครั้งเดียวใช้ซ้ำทุกคลิป' },
];
const DEFAULT_PLACES = ['หาดหัวหิน', 'ตลาดโต้รุ่งหัวหิน', 'สถานีรถไฟหัวหิน', 'สนามบินหัวหิน', 'เขาตะเกียบ', 'ซีคาด้า มาร์เก็ต', 'มาร์เก็ต วิลเลจ'];
const DEFAULT_LINKS = { chat: 'https://aistudio.google.com/prompts/new_chat', tts: 'https://aistudio.google.com/generate-speech', gpt: 'https://chatgpt.com/' };
const VOICE_STYLES = {
  doc_en: { label: 'สารคดี (English)', text: 'Narrate in the style of a premium travel and lifestyle documentary: calm, warm and confident, like a nature-documentary narrator. Medium-slow pace, clear and natural Thai pronunciation, a gentle smile in the voice, never rushed. Pause for about one second at the end of each paragraph. Keep exactly the same voice, pace and energy from the first line to the last.' },
  doc_th: { label: 'สารคดี (ภาษาไทย)', text: 'บรรยายสไตล์สารคดีท่องเที่ยวระดับพรีเมียม น้ำเสียงนุ่มลึก สงบ อบอุ่น น่าเชื่อถือ เหมือนผู้บรรยายสารคดี จังหวะช้าถึงปานกลาง ออกเสียงภาษาไทยชัดเจนเป็นธรรมชาติ ไม่เร่งรีบ หยุดเว้นจังหวะประมาณ 1 วินาทีเมื่อจบแต่ละย่อหน้า รักษาน้ำเสียง จังหวะ และอารมณ์ให้คงที่ตั้งแต่บรรทัดแรกถึงบรรทัดสุดท้าย' },
  warm_en: { label: 'อบอุ่นเป็นกันเอง (English)', text: 'Speak like a friendly, trustworthy property host walking guests through a beautiful home: warm, relaxed, smiling, medium pace, clear natural Thai pronunciation. Pause about one second between paragraphs. Keep the same voice, pace and energy from start to finish.' },
};
const lib = { voiceStyle: VOICE_STYLES.doc_en.text, links: { ...DEFAULT_LINKS }, brand: { greeting: '', tagline: '', subtitle: '', thanks: '', invite: '' }, titleBuiltin: true, closeBuiltin: true, myPoses: {}, usage: {}, title: null, close: null, area: [], contact: { name: '', phone: '', line: '' }, places: DEFAULT_PLACES.map((name, i) => ({ id: i + 1, name, coord: '' })) };
let libSeq = 1000000;
const saveLib = () => DB.set('library', lib);
async function loadLib() {
  const l = await DB.get('library'); if (!l) return;
  lib.contact = { name: '', phone: '', line: '', ...(l.contact || {}) }; lib.brand = { ...lib.brand, ...(l.brand || {}) }; lib.links = { ...DEFAULT_LINKS, ...(l.links || {}) }; if (l.voiceStyle) lib.voiceStyle = l.voiceStyle; lib.titleBuiltin = l.titleBuiltin !== false; lib.closeBuiltin = l.closeBuiltin !== false; lib.title = l.title || null; lib.close = l.close || null; lib.area = l.area || []; lib.titleBgs = l.titleBgs || []; lib.titleBgSel = l.titleBgSel == null ? null : l.titleBgSel; lib.myPoses = l.myPoses || {}; lib.usage = l.usage || {}; if (l.mp) lib.mp = l.mp; if (l.places && l.places.length) lib.places = l.places;
  libSeq = Math.max(libSeq, ...lib.area.map(a => a.id || 0), ...(lib.titleBgs || []).map(a => a.id || 0), (lib.title && lib.title.id) || 0, (lib.close && lib.close.id) || 0) + 1;
}
const libArea = cat => lib.area.filter(x => x.cat === cat);
// ===== สต็อกภาพทำเล: ใส่ไว้เยอะๆ ในคลังกลาง แอปเลือกใช้ในแต่ละคลิปตามเวลา · ไม่ซ้ำกับคลิปอื่นเท่าที่สต็อกมี =====
// state.stock = { mode: 'auto' | 'manual' | 'all', ids: [เลขรูปในคลังที่ใช้ในคลิปนี้], counted: [รูปที่นับเป็น "เคยใช้" แล้ว] } · คลิปเก่าก่อนมีระบบนี้ = 'all' (ใช้ทุกรูปเหมือนเดิม)
let stockBusy = false;
const stockOn = () => !!(state.stock && state.stock.mode && state.stock.mode !== 'all') && !stockBusy;
function stockSel(it) { if (!stockOn()) return true; if (state.stock.mode === 'auto' && !state.stock.ids) autoPickStock(); return (state.stock.ids || []).includes(it.id); }
function autoPickStock(reroll) {
  let T = {}; stockBusy = true; try { T = segTargets(); } finally { stockBusy = false; }
  lib.usage = lib.usage || {}; const prev = (state.stock && state.stock.ids) || [];
  ((state.stock && state.stock.counted) || []).forEach(id => { if (lib.usage[id] > 0) lib.usage[id]--; });
  const PER = 3.2; // วินาทีต่อรูปโดยประมาณ
  const wOf = it => (it.type === 'video' ? vidDur(it) / PER : 1); // คลิปนับเป็นหลายรูปตามความยาว
  const pickCats = (cats, sec) => {
    const pools = cats.map(c => libArea(c).filter(isMedia).map(it => ({ it, s: (lib.usage[it.id] || 0) * 10 + (reroll && prev.includes(it.id) ? 100 : 0) + Math.random() })).sort((a, b) => a.s - b.s)).filter(p => p.length); if (!pools.length) return [];
    const budget = Math.max(pools.length, (sec || 24) / PER), out = [], idx = pools.map(() => 0); let used = 0, guard = 0;
    while (used < budget && guard++ < 10000) { let any = false;
      for (let k = 0; k < pools.length && used < budget; k++) { if (idx[k] >= pools[k].length) continue; any = true; const it = pools[k][idx[k]].it; idx[k]++; const w = wOf(it); if (used + w <= budget + 0.6 || !out.some(id => pools[k].some(x => x.it.id === id))) { out.push(it.id); used += w; } }
      if (!any) break; }
    const order = new Set(out); return cats.flatMap(c => libArea(c).filter(it => order.has(it.id)).map(it => it.id));
  };
  const ids = [...pickCats(AREA_CATS.map(c => c.id), T.area), ...pickCats(['lifestyle'], T.life)];
  ids.forEach(id => { lib.usage[id] = (lib.usage[id] || 0) + 1; });
  state.stock = { mode: 'auto', ids, counted: ids.slice() };
  saveLib(); save();
}
const stockCounts = () => { const raw = AREA_CATS.map(c => [c, libArea(c.id).filter(isMedia)]), life = libArea('lifestyle').filter(isMedia); return { raw, life, total: raw.reduce((a, r) => a + r[1].length, 0) + life.length }; };
const areaLibOrdered = () => [...AREA_CATS.flatMap(c => libArea(c.id)).filter(stockSel), ...lib.area.filter(x => !AREA_CATS.some(c => c.id === x.cat) && x.cat !== 'lifestyle')];
const lifeItems = () => libArea('lifestyle').filter(stockSel);
const areaItems = () => [...areaLibOrdered(), ...state.items.filter(i => i.room === AREA_ROOM)];
function activeContact() { const m = state.contact.mode; return m === 'none' ? null : m === 'custom' ? state.contact.custom : lib.contact; }
// คลิปวิดีโอ: อ่านความยาวตอนเพิ่มไฟล์ (it.dur วินาที) · ในคลิปใช้ได้ท่อนละไม่เกิน 8 วินาที ตัดเสียงของคลิปทิ้ง ใช้เสียงพากย์แทน
const isMedia = i => i && (i.type === 'image' || i.type === 'video');
const VIDEO_MAX = 8, vidDur = it => Math.min(VIDEO_MAX, Math.max(2, +it.dur || 5));
function probeVideo(blob) {
  return new Promise(res => { const v = document.createElement('video'), u = URL.createObjectURL(blob); let done = false; const fin = d => { if (done) return; done = true; URL.revokeObjectURL(u); res(d); };
    v.preload = 'metadata'; v.muted = true; v.onloadedmetadata = () => fin(isFinite(v.duration) ? v.duration : 0); v.onerror = () => fin(0); setTimeout(() => fin(0), 8000); v.src = u; });
}
async function probeItems(items) { for (const it of items) if (it.type === 'video' && !it.dur) { const d = await probeVideo(it.blob); if (d) it.dur = Math.round(d * 10) / 10; } }
const mediaOf = f => ({ blob: f, type: f.type.startsWith('video') ? 'video' : 'image', name: f.name });

// ไฟล์ของแท็บนั้น
function slotItems(s) {
  if (s.kind === 'lib') {
    if ((s.id === 'title' || s.id === 'close') && lib[s.id + 'Builtin']) return [];
    if (s.cat) return libArea(s.cat);
    const x = lib[s.id]; if (!x) return []; if (!x.id) x.id = libSeq++; return [x];
  }
  return s.kind === 'room' ? state.items.filter(i => s.rooms.includes(i.room)) : [];
}
async function addToSlot(s, files) {
  if (s.kind === 'lib') {
    if (s.cat) { const add = files.map(f => ({ id: libSeq++, cat: s.cat, ...mediaOf(f) })); lib.area.push(...add); await probeItems(add); }
    else if (files[0]) { lib[s.id] = { id: libSeq++, ...mediaOf(files[0]) }; await probeItems([lib[s.id]]); }
    await saveLib(); return;
  }
  const add = files.map(f => ({ id: nextId++, ...mediaOf(f), room: s.room })); state.items.push(...add); await probeItems(add);
  await save();
}
async function removeFromSlot(s, id) {
  if (s.kind === 'lib') {
    if (s.cat) lib.area = lib.area.filter(x => x.id !== id); else lib[s.id] = null;
    await saveLib(); return;
  }
  removeItem(id); await save();
}
function slotCount(s) {
  if ((s.id === 'title' || s.id === 'close') && lib[s.id + 'Builtin']) return 1;
  if (s.kind === 'contact') { const ct = activeContact(); return state.contact.mode === 'none' || (ct && ct.phone.trim()) ? 1 : 0; }
  return slotItems(s).length + (s.id === 'map' && state.routeData ? 1 : 0);
}
function slotStatus(s, n = slotCount(s)) {
  if (n < s.min) return 'miss';
  if (s.min === 0 && s.rec === 0) return n ? 'ok' : 'info';
  return n >= s.rec ? 'ok' : 'warn';
}
function slotInfo(s, n) {
  if ((s.id === 'title' || s.id === 'close') && lib[s.id + 'Builtin']) return s.id === 'title' ? 'ไตเติลของแอป (มาสคอต)' : 'เครดิตปิดของแอป (มาสคอต)';
  if (s.id === 'map' && !n && state.skipMap) return 'ข้ามแผนที่ในคลิปนี้';
  if (s.kind === 'contact') { const ct = activeContact(); return state.contact.mode === 'none' ? 'ไม่แสดงเบอร์ในคลิปนี้' : n ? `${ct.name} ${ct.phone}${ct.line ? ' · LINE ' + ct.line : ''}` : 'ยังไม่ได้กรอกเบอร์ (หรือเลือก "ไม่แสดง")'; }
  if (s.min === 0 && s.rec === 0) return n ? `${n} รูป/คลิป` : 'ไม่จำเป็น · ข้ามได้';
  if (n === 0) return s.min ? 'ยังไม่มี · จำเป็น' : 'ยังไม่มี · แนะนำให้ใส่';
  return `${n} รูป/คลิป${n < s.rec ? ` · แนะนำ ${s.rec}+` : ''}`;
}
const orphanItems = () => state.items.filter(i => !i.room || (!SLOTS.some(s => s.rooms && s.rooms.includes(i.room)) && i.room !== AREA_ROOM));
function sbSlots() {
  const un = orphanItems().length;
  return [...SLOTS.map(s => { const n = slotCount(s); return { id: s.id, label: s.label, st: slotStatus(s, n), info: slotInfo(s, n), act: 'go' }; }),
    ...(un ? [{ id: 'un', label: 'รูปเดิมที่ยังไม่จัดเข้าแท็บ', st: 'miss', info: `${un} รูป · ย้ายเข้าแท็บหรือลบ`, act: 'un', nonum: true }] : [])];
}
const sbBlockers = () => sbSlots().filter(s => s.st === 'miss');

function updateSb() {
  const bar = document.querySelector('#sb'); if (!bar) return;
  const sl = sbSlots(), miss = sl.filter(s => s.st === 'miss'), warn = sl.filter(s => s.st === 'warn');
  bar.className = 'sb ' + (miss.length ? 'miss' : warn.length ? 'warn' : 'ok');
  bar.textContent = miss.length ? `📋 ผังเรื่อง · ❌ ยังขาด ${miss.length}: ${miss.map(s => s.label.replace(/ \(.*\)/, '')).join(', ')}`
    : warn.length ? `📋 ผังเรื่อง · ⚠ แนะนำเพิ่ม ${warn.length} ช่วง` : '📋 ผังเรื่อง · ✅ ครบถ้วน';
  if (typeof refreshChips === 'function') refreshChips();
}

function pickFiles(accept, multiple) {
  return new Promise(res => {
    const i = document.createElement('input'); i.type = 'file'; i.accept = accept; i.multiple = !!multiple; i.hidden = true;
    i.onchange = () => { res([...i.files]); i.remove(); }; document.body.appendChild(i); i.click();
  });
}
const esc = v => String(v).replace(/"/g, '&quot;');

// กล่องเบอร์โทร (ใช้ทั้งในแท็บ "ติดต่อ")
function contactCardHtml() {
  const mode = state.contact.mode, tgt = mode === 'custom' ? state.contact.custom : lib.contact;
  return `<div class="seg"><b>☎️ เบอร์โทรในคลิปนี้</b>
    <label class="sw"><input type="radio" name="cm" value="std" ${mode === 'std' ? 'checked' : ''}> ใช้เบอร์มาตรฐาน (ตั้งครั้งเดียว)</label>
    <label class="sw"><input type="radio" name="cm" value="custom" ${mode === 'custom' ? 'checked' : ''}> ใช้เบอร์ใหม่เฉพาะคลิปนี้</label>
    <label class="sw"><input type="radio" name="cm" value="none" ${mode === 'none' ? 'checked' : ''}> ไม่แสดงเบอร์</label>
    ${mode === 'none' ? '' : `<label class="fl"><span>ชื่อ / ชื่อบริษัท</span><input class="ct" id="ctName" placeholder="เช่น Huahin Properties" value="${esc(tgt.name)}"></label>
    <label class="fl"><span>เบอร์โทร</span><input class="ct" id="ctPhone" type="tel" placeholder="เช่น 081-234-5678" value="${esc(tgt.phone)}"></label>
    <label class="fl"><span>LINE ID</span><input class="ct" id="ctLine" placeholder="เช่น @huahin" value="${esc(tgt.line)}"></label>`}</div>`;
}
function bindContact(root, rerender) {
  root.oninput = e => {
    const m = { ctName: 'name', ctPhone: 'phone', ctLine: 'line' }[e.target.id]; if (!m) return;
    (state.contact.mode === 'custom' ? state.contact.custom : lib.contact)[m] = e.target.value;
    state.contact.mode === 'custom' ? save() : saveLib(); updateSb();
  };
  root.onchange = e => { if (e.target.name === 'cm') { state.contact.mode = e.target.value; save(); rerender(); } };
}

// แผงภาพรวมผังเรื่อง (แตะแถบสีใต้เมนู)
function openSb() {
  document.querySelector('#sbSheet')?.remove();
  const d = document.createElement('div'); d.className = 'sheet tall'; d.id = 'sbSheet';
  const icon = { ok: '✅', warn: '⚠️', miss: '❌', info: '➖' };
  let n = 0;
  d.innerHTML = `<div class="sh-head"><b>📋 ผังเรื่องของคลิป</b><button class="ib" data-a="close-sheet" aria-label="ปิด">✕</button></div>
    <p class="hint">เรียงตามลำดับในคลิปจริง ❌ = จำเป็น ต้องมีก่อนเรนเดอร์ · ⚠️ = แนะนำ · ➖ = ไม่ใส่ก็ได้ · แตะแถวเพื่อไปที่แท็บนั้น</p>
    ${sbSlots().map(s => { if (!s.nonum) n++; return `<div class="sbrow ${s.st}" data-id="${s.id}" data-a="open"><span class="dot">${icon[s.st]}</span><div class="sbt"><b>${s.nonum ? '' : n + '. '}${s.label}</b><small>${s.info}</small></div><div class="sbb">›</div></div>`; }).join('')}`;
  d.onclick = e => {
    if (e.target.closest('[data-a=close-sheet]')) { d.remove(); return; }
    const r = e.target.closest('[data-a=open]'); if (!r) return; d.remove();
    if (r.dataset.id === 'un') { go(2); return; }
    state.slot = r.dataset.id; go(1);
  };
  document.body.appendChild(d);
}

// ---- ระยะทางจากพิกัด (ประมาณการ: ระยะเส้นตรง ×1.3 ขับที่ความเร็วเฉลี่ย 40 กม./ชม.) ----
function parseCoord(t) {
  const m = String(t || '').match(/(-?\d{1,3}(?:\.\d+)?)\s*[,\s]\s*(-?\d{1,3}(?:\.\d+)?)/); if (!m) return null;
  const la = +m[1], lo = +m[2]; return la >= -90 && la <= 90 && lo >= -180 && lo <= 180 ? { la, lo } : null;
}
function haversineKm(a, b) {
  const R = 6371, r = d => d * Math.PI / 180, dLa = r(b.la - a.la), dLo = r(b.lo - a.lo);
  const h = Math.sin(dLa / 2) ** 2 + Math.cos(r(a.la)) * Math.cos(r(b.la)) * Math.sin(dLo / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
function placeDistances() {
  const home = parseCoord(state.facts.coord); if (!home) return [];
  return lib.places.map(p => ({ p, c: parseCoord(p.coord) })).filter(x => x.c).map(({ p, c }) => {
    const km = haversineKm(home, c), road = km * 1.3;
    return { id: p.id, name: p.name, km, min: Math.max(2, Math.round(road / 40 * 60)) };
  }).sort((a, b) => a.km - b.km);
}
// สถานที่ที่ใช้ในคลิปนี้ = สถานที่ที่มีรูป/คลิปถูกเลือกใช้ (ถ้ามีไม่ถึง 2 แห่ง เติมสถานที่ที่มีพิกัดและใกล้บ้านที่สุดให้ครบ 3 แห่ง)
function placesInClip() {
  const dist = new Map(placeDistances().map(d => [d.id, d])), used = lib.places.filter(p => placePhotos(p).some(stockSel));
  const pool = used.length >= 2 ? used : [...used, ...lib.places.filter(p => !used.includes(p) && dist.has(p.id)).sort((a, b) => dist.get(a.id).km - dist.get(b.id).km)].slice(0, 3);
  return pool.map(p => ({ p, d: dist.get(p.id) || null, cat: (AREA_CATS.find(c => c.id === placeCat(p)) || {}).label || '', n: placePhotos(p).length })).sort((a, b) => (a.d ? a.d.km : 1e9) - (b.d ? b.d.km : 1e9));
}
const spN = n => (/[A-Za-z0-9]/.test(n) ? ` ${n} ` : n); // ชื่อที่มีอังกฤษ/ตัวเลข เว้นวรรคให้อ่านออกเสียงถูก
const placeSentence = x => (x.d ? `บ้านหลังนี้ห่างจาก${spN(x.p.name)}ประมาณ ${fmtKm(x.d.km)} ขับรถราว ${x.d.min} นาที` : `ใกล้บ้านมี${spN(x.p.name)}`).replace(/\s+/g,' ').trim();
const fmtKm = km => (km < 1 ? `${Math.max(100, Math.round(km * 10) * 100)} เมตร` : `${km < 10 ? km.toFixed(1) : Math.round(km)} กิโลเมตร`);
function mapScriptText(max = 4) {
  const near = placeDistances().slice(0, max); if (!near.length) return '';
  return 'บ้านหลังนี้ ' + near.map(x => `ห่างจาก${spN(x.name)}ประมาณ ${fmtKm(x.km)} ขับรถราว ${x.min} นาที`).join(' ').replace(/\s+/g, ' ');
}

// ===== สถานที่สำคัญ: ชื่อ + หมวด + พิกัด + รูป อยู่ที่เดียว (ใส่ครั้งเดียว ใช้ซ้ำทุกคลิป) =====
// รูปของสถานที่เก็บในสต็อกภาพทำเล (lib.area) โดยมี placeId/cat/title ผูกกับสถานที่ จึงเข้าระบบเลือกรูปอัตโนมัติ ป้ายชื่อบนภาพ และระยะทางจากบ้านเอง
const PLACE_GUESS = [[/โรงพยาบาล|รพ\./, 'hospital'], [/ห้าง|เซ็นทรัล|บลูพอร์ต|มาร์เก็ต|market|แมคโคร|โลตัส|บิ๊กซี|ซีคาด้า/i, 'mall'], [/สวนน้ำ|black mountain|แบล็ค/i, 'water'], [/กอล์ฟ|golf/i, 'golf'], [/หาด|ทะเล|beach/i, 'beach'], [/ตลาด/, 'market'], [/เขา|ภูเขา|น้ำตก|อุทยาน/, 'mountain']];
const placeCat = p => p.cat || (PLACE_GUESS.find(([re]) => re.test(p.name)) || [0, 'landmark'])[1];
const placePhotos = p => lib.area.filter(x => x.placeId === p.id);
function syncPlace(p) { placePhotos(p).forEach(x => { x.title = p.name; x.cat = placeCat(p); }); }
function openPlaces(after) {
  document.querySelector('#placesSheet')?.remove();
  const d = document.createElement('div'); d.className = 'sheet tall'; d.id = 'placesSheet';
  const home = parseCoord(state.facts && state.facts.coord);
  const coordSt = p => { if (!String(p.coord || '').trim()) return ''; const c = parseCoord(p.coord); if (!c) return '⚠️ อ่านพิกัดไม่ออก (ต้องเป็นตัวเลข เช่น 12.5698,99.9577)'; if (!home) return '✅ พิกัดถูกต้อง · ใส่พิกัดบ้านใน 🏠 ข้อมูลบ้านเพื่อดูระยะทาง'; const km = haversineKm(home, c); return `✅ ห่างจากบ้านนี้ ${fmtKm(km)} · ขับประมาณ ${Math.max(2, Math.round(km * 1.3 / 40 * 60))} นาที`; };
  const card = p => { const ph = placePhotos(p), cat = placeCat(p);
    return `<div class="seg pcardx" data-id="${p.id}"><div class="tools"><input class="ct" data-pn="${p.id}" maxlength="60" placeholder="ชื่อสถานที่" value="${esc(p.name)}" style="flex:1"><button class="ib sm danger" data-rm="${p.id}" aria-label="ลบสถานที่">🗑️</button></div>
      <label class="fl"><span>หมวด (รูปจะไปอยู่ในแท็บหมวดนี้)</span><select class="ct" data-pc="${p.id}">${AREA_CATS.map(c => `<option value="${c.id}" ${c.id === cat ? 'selected' : ''}>${c.label}</option>`).join('')}</select></label>
      <label class="fl"><span>พิกัด (วางเลขจาก Google Maps)</span><input class="ct" data-c="${p.id}" inputmode="decimal" placeholder="เช่น 12.5698,99.9577" value="${esc(p.coord || '')}"></label>
      <small class="hint" data-st="${p.id}">${coordSt(p)}</small>
      <div class="pph">${ph.map(x => `<div class="pphi">${x.type === 'video' ? `<video src="${urlOf(x)}#t=0.1" muted playsinline></video><span class="vb">🎬 ${Math.round(x.dur || 0) || ''}</span>` : `<img src="${urlOf(x)}" alt="">`}<button class="x" data-pdel="${x.id}" aria-label="ลบ">✕</button></div>`).join('')}<button class="ib wide" data-ph="${p.id}">📷 ${ph.length ? 'เพิ่มรูป/คลิป' : 'ใส่รูป/คลิปสถานที่นี้'}</button></div>${ph.length ? `<small class="hint">สต็อกสถานที่นี้: ${ph.filter(x => x.type !== 'video').length} รูป · ${ph.filter(x => x.type === 'video').length} คลิป (ใส่ได้ไม่จำกัด แอปเลือกใช้ให้ต่อคลิป)</small>` : ''}</div>`; };
  const orphans = () => lib.area.filter(x => !x.placeId && ['landmark', 'hospital', 'mall', 'water', 'golf'].includes(x.cat));
  const orphanHtml = () => orphans().length ? `<div class="seg"><b>รูปเดิมที่ยังไม่ผูกกับสถานที่ (${orphans().length})</b><p class="hint">รูปที่เคยใส่ไว้ในหมวดโดยตรง ลบออกหรือเพิ่มสถานที่แล้วใส่รูปใหม่ได้</p><div class="pph">${orphans().map(x => `<div class="pphi">${x.type === 'video' ? `<video src="${urlOf(x)}#t=0.1" muted playsinline></video>` : `<img src="${urlOf(x)}" alt="">`}<button class="x" data-pdel="${x.id}" aria-label="ลบ">✕</button></div>`).join('')}</div></div>` : '';
  const draw = () => { const sc = d.scrollTop; d.querySelector('#prows').innerHTML = orphanHtml() + (lib.places.length ? lib.places.map(card).join('') : '<div class="soon">ยังไม่มีสถานที่ กด "+ เพิ่มสถานที่ใหม่"</div>'); d.scrollTop = sc; };
  d.innerHTML = `<div class="sh-head"><b>📍 สถานที่สำคัญ</b><button class="ib" data-a="x" aria-label="ปิด">✕</button></div>
    <p class="hint">ใส่ <b>ชื่อ + พิกัด + รูป</b> ของแต่ละสถานที่ไว้ที่นี่ที่เดียว ใช้ซ้ำทุกคลิป · พิกัด: เปิด Google Maps กดค้างที่จุดนั้นแล้วแตะตัวเลขพิกัดด้านบนเพื่อคัดลอก · ที่ไม่ใส่พิกัดจะไม่ถูกใช้คำนวณระยะทาง · รูปที่ใส่ที่นี่จะเข้าสต็อกภาพทำเลตามหมวด ชื่อและระยะทางใช้ดึงไปเขียนสคริปต์/พากย์ <b>ไม่ขึ้นป้ายบนภาพ</b></p>
    <button class="btn alt" data-a="add">+ เพิ่มสถานที่ใหม่</button>
    <div id="prows"></div>
    <button class="btn alt" data-a="add">+ เพิ่มสถานที่ใหม่</button><button class="btn" data-a="x">เสร็จ</button>`;
  d.addEventListener('input', e => {
    const t = e.target, id = +(t.dataset.pn || t.dataset.c); if (!id) return; const p = lib.places.find(x => x.id === id); if (!p) return;
    if (t.dataset.pn) { p.name = t.value; syncPlace(p); } else { p.coord = t.value; d.querySelector(`[data-st="${id}"]`).textContent = coordSt(p); }
    saveLib();
  });
  d.addEventListener('change', e => { const id = +e.target.dataset.pc; if (!id) return; const p = lib.places.find(x => x.id === id); if (p) { p.cat = e.target.value; syncPlace(p); saveLib(); } });
  d.onclick = async e => {
    const rm = e.target.closest('[data-rm]');
    if (rm) { const p = lib.places.find(x => x.id === +rm.dataset.rm), n = placePhotos(p).length; if (!confirm(`ลบสถานที่ "${p.name}"${n ? ` และรูป ${n} รูปของสถานที่นี้` : ''} ?`)) return; lib.area = lib.area.filter(x => x.placeId !== p.id); lib.places = lib.places.filter(x => x.id !== p.id); await saveLib(); draw(); return; }
    const pd = e.target.closest('[data-pdel]'); if (pd) { if (confirm('ลบรูปนี้?')) { lib.area = lib.area.filter(x => x.id !== +pd.dataset.pdel); await saveLib(); draw(); } return; }
    const ph = e.target.closest('[data-ph]'); if (ph) { const p = lib.places.find(x => x.id === +ph.dataset.ph), fs = await pickFiles('image/*,video/*', true); if (fs.length) { p.cat = placeCat(p); const add = fs.map(f => ({ id: libSeq++, cat: p.cat, placeId: p.id, title: p.name, ...mediaOf(f) })); lib.area.push(...add); const b0 = ph; b0.textContent = 'กำลังอ่านไฟล์...'; await probeItems(add); await saveLib(); draw(); } return; }
    const a = e.target.closest('[data-a]')?.dataset.a; if (!a) return;
    if (a === 'add') { const name = prompt('ชื่อสถานที่ เช่น โรงพยาบาลหัวหินบำรุงราษฎร์'); if (name && name.trim()) { const p = { id: Date.now(), name: name.trim(), coord: '' }; p.cat = placeCat(p); lib.places.unshift(p); await saveLib(); draw(); d.scrollTop = 0; } return; }
    d.remove(); if (after) after();
  };
  document.body.appendChild(d); draw();
}

// ---- สร้างรูปแผนที่จากพิกัดบ้าน (แผนที่ OpenStreetMap โหลดตอนสร้าง ต้องต่อเน็ต · ไม่ใช้รหัส API) ----
const TILE_URL = 'https://tile.openstreetmap.org';
const lonToX = (lon, z) => (lon + 180) / 360 * 2 ** z;
const latToY = (lat, z) => { const r = lat * Math.PI / 180; return (1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2 * 2 ** z; };
const tileCache = new Map();
async function loadTile(z, x, y) {
  const n = 2 ** z; x = ((x % n) + n) % n; const k = `${z}/${x}/${y}`;
  if (!tileCache.has(k)) tileCache.set(k, fetch(`${TILE_URL}/${k}.png`, { mode: 'cors' }).then(async r => { if (!r.ok) throw new Error('tile ' + r.status); return createImageBitmap(await r.blob()); }));
  return tileCache.get(k);
}
async function renderMap(W, H, pts, zoomFixed) {
  let z = zoomFixed;
  if (!z) for (z = 17; z > 9; z--) {
    const xs = pts.map(p => lonToX(p.lo, z) * 256), ys = pts.map(p => latToY(p.la, z) * 256);
    if (Math.max(...xs) - Math.min(...xs) <= W * 0.62 && Math.max(...ys) - Math.min(...ys) <= H * 0.62) break;
  }
  const px = pts.map(p => lonToX(p.lo, z) * 256), py = pts.map(p => latToY(p.la, z) * 256);
  const left = (Math.min(...px) + Math.max(...px)) / 2 - W / 2, top = (Math.min(...py) + Math.max(...py)) / 2 - H / 2;
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const x = cv.getContext('2d');
  x.fillStyle = '#e8e0d0'; x.fillRect(0, 0, W, H);
  const jobs = [], n = 2 ** z;
  for (let tx = Math.floor(left / 256); tx <= Math.floor((left + W) / 256); tx++) for (let ty = Math.floor(top / 256); ty <= Math.floor((top + H) / 256); ty++) if (ty >= 0 && ty < n) jobs.push([tx, ty]);
  for (let i = 0; i < jobs.length; i += 6) await Promise.all(jobs.slice(i, i + 6).map(async ([tx, ty]) => { const b = await loadTile(z, tx, ty); x.drawImage(b, tx * 256 - left, ty * 256 - top); }));
  const at = (p, i) => ({ X: px[i] - left, Y: py[i] - top });
  const fs = Math.round(W / 30), label = (t, X, Y, bg, fg) => { x.font = `bold ${fs}px sans-serif`; const w = x.measureText(t).width + fs; x.fillStyle = bg; x.beginPath(); x.roundRect(X - w / 2, Y - fs * 0.85, w, fs * 1.5, fs * 0.4); x.fill(); x.fillStyle = fg; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(t, X, Y - fs * 0.1); };
  const home = pts.findIndex(p => p.home), h = at(pts[home], home);
  let k = 0;
  pts.forEach((p, i) => { if (i === home) return; const a = at(p, i), idx = k++;
    x.strokeStyle = '#7a1f2b'; x.lineWidth = Math.max(4, W / 220); x.setLineDash([W / 45, W / 70]); x.beginPath(); x.moveTo(a.X, a.Y); x.lineTo(h.X, h.Y); x.stroke(); x.setLineDash([]);
    x.fillStyle = '#1f6fb5'; x.beginPath(); x.arc(a.X, a.Y, W / 70, 0, 7); x.fill(); x.lineWidth = 4; x.strokeStyle = '#fff'; x.stroke();
    label(p.label, a.X, a.Y + (idx % 2 ? W / 16 : -W / 22), 'rgba(255,255,255,.92)', '#2e2220');
    if (p.km != null) { const t = [0.5, 0.3, 0.7][idx % 3]; label(`~${fmtKm(p.km)}`, h.X + (a.X - h.X) * t, h.Y + (a.Y - h.Y) * t + (idx % 2 ? W / 18 : 0), 'rgba(122,31,43,.92)', '#fff'); } });
  x.fillStyle = '#7a1f2b'; x.beginPath(); x.arc(h.X, h.Y, W / 28, 0, 7); x.fill(); x.lineWidth = 6; x.strokeStyle = '#fff'; x.stroke();
  x.font = `${Math.round(W / 22)}px sans-serif`; x.fillStyle = '#fff'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('🏠', h.X, h.Y + 2);
  label(pts[home].label, h.X, h.Y + W / 14, '#7a1f2b', '#fff');
  x.fillStyle = 'rgba(255,255,255,.85)'; x.fillRect(0, H - fs * 1.4, W, fs * 1.4); x.fillStyle = '#444'; x.font = `${Math.round(fs * 0.7)}px sans-serif`; x.textAlign = 'right'; x.fillText('© OpenStreetMap contributors', W - 12, H - fs * 0.7);
  return new Promise(r => cv.toBlob(r, 'image/png'));
}
async function generateMapImages(statusEl) {
  const home = parseCoord(state.facts.coord);
  if (!home) { alert('ยังไม่มีพิกัดบ้าน: กด 🏠 ข้อมูลบ้าน แล้ววางพิกัดบ้านก่อน'); return false; }
  const sz = sizeInfo();
  const near = lib.places.map(p => ({ p, c: parseCoord(p.coord) })).filter(o => o.c).map(({ p, c }) => ({ la: c.la, lo: c.lo, label: p.name, km: haversineKm(home, c) })).sort((a, b) => a.km - b.km).slice(0, 3);
  try {
    statusEl.textContent = 'กำลังโหลดแผนที่... (ต้องต่อเน็ต)';
    const blobs = [];
    if (near.length) blobs.push(await renderMap(sz.w, sz.h, [{ ...home, home: true, label: 'บ้านหลังนี้' }, ...near]));
    blobs.push(await renderMap(sz.w, sz.h, [{ ...home, home: true, label: 'บ้านหลังนี้' }], 16));
    state.items.filter(i => i.name && i.name.startsWith('map-auto-')).map(i => i.id).forEach(removeItem);
    const names = near.length ? ['map-auto-overview.png', 'map-auto-zoom.png'] : ['map-auto-zoom.png'];
    blobs.forEach((b, i) => state.items.push({ id: nextId++, blob: b, type: 'image', room: MAP_ROOM, name: names[i] }));
    await save(); state.skipMap = false; return blobs.length;
  } catch (e) { statusEl.textContent = '❌ โหลดแผนที่ไม่สำเร็จ (ต่อเน็ตอยู่ไหม?) ' + (e.message || e) + ' · หรือแคปหน้า Google Maps แล้วเพิ่มรูปเองแทนได้'; return false; }
}

// ---- คลิปรถวิ่งตามถนนจริงเข้าบ้าน (เส้นทางจาก OSRM · แผนที่ OpenStreetMap · ไม่ใช้รหัส API) ----
const OSRM = 'https://router.project-osrm.org/route/v1/driving';
const ROUTE_DUR = 9;
async function fetchRoute(a, b) {
  const r = await fetch(`${OSRM}/${a.lo},${a.la};${b.lo},${b.la}?overview=full&geometries=geojson`);
  if (!r.ok) throw new Error('route ' + r.status);
  const j = await r.json(); if (!j.routes || !j.routes[0]) throw new Error('ไม่พบเส้นทาง');
  const rt = j.routes[0];
  return { pts: rt.geometry.coordinates.map(([lo, la]) => ({ la, lo })), meters: rt.distance, secs: rt.duration };
}
async function buildRouteData(statusEl) {
  const home = parseCoord(state.facts.coord);
  if (!home) { alert('ยังไม่มีพิกัดบ้าน: กด 🏠 ข้อมูลบ้าน แล้ววางพิกัดบ้านก่อน'); return null; }
  let start = parseCoord(state.facts.routeStart);
  if (!start) {
    const t = prompt('วางพิกัดจุดเริ่มต้นของรถ (เช่น ทางเข้าซอยที่ถนนเพชรเกษม)\\nวิธีคัดลอก: เปิด Google Maps กดค้างที่จุดนั้น แล้วแตะตัวเลขพิกัด');
    start = parseCoord(t); if (!start) { if (t) alert('อ่านพิกัดไม่ออก ลองวางแบบ 12.558940,99.909039'); return null; }
    state.facts.routeStart = t.trim();
  }
  if (!state.facts.routeLabel) state.facts.routeLabel = prompt('ชื่อจุดเริ่มต้นที่จะแสดงบนแผนที่', 'ถนนเพชรเกษม') || 'ถนนเพชรเกษม';
  const sz = sizeInfo(), W = sz.w, H = sz.h;
  statusEl.textContent = 'กำลังหาเส้นทางถนนจริง... (ต้องต่อเน็ต)';
  let route, real = true;
  try { route = await fetchRoute(start, home); }
  catch (e) { real = false; route = { pts: [start, home], meters: haversineKm(start, home) * 1000 * 1.3, secs: 0 }; statusEl.textContent = '⚠️ หาเส้นทางถนนจริงไม่ได้ ใช้เส้นตรงแทน · '; }
  // เลือกซูมให้เห็นทั้งเส้นทาง
  let z = 18;
  for (; z > 10; z--) {
    const xs = route.pts.map(p => lonToX(p.lo, z) * 256), ys = route.pts.map(p => latToY(p.la, z) * 256);
    if (Math.max(...xs) - Math.min(...xs) <= W * 0.74 && Math.max(...ys) - Math.min(...ys) <= H * 0.66) break;
  }
  const px = route.pts.map(p => lonToX(p.lo, z) * 256), py = route.pts.map(p => latToY(p.la, z) * 256);
  const left = (Math.min(...px) + Math.max(...px)) / 2 - W / 2, top = (Math.min(...py) + Math.max(...py)) / 2 - H / 2;
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const x = cv.getContext('2d');
  x.fillStyle = '#e8e0d0'; x.fillRect(0, 0, W, H);
  statusEl.textContent += 'กำลังโหลดแผนที่...';
  const jobs = [], n = 2 ** z;
  for (let tx = Math.floor(left / 256); tx <= Math.floor((left + W) / 256); tx++) for (let ty = Math.floor(top / 256); ty <= Math.floor((top + H) / 256); ty++) if (ty >= 0 && ty < n) jobs.push([tx, ty]);
  for (let i = 0; i < jobs.length; i += 6) await Promise.all(jobs.slice(i, i + 6).map(async ([tx, ty]) => { const b = await loadTile(z, tx, ty); x.drawImage(b, tx * 256 - left, ty * 256 - top); }));
  const step = Math.max(1, Math.ceil(route.pts.length / 500));
  const pts = route.pts.map((p, i) => [px[i] - left, py[i] - top]).filter((_, i, a) => i % step === 0 || i === a.length - 1);
  const blob = await new Promise(r => cv.toBlob(r, 'image/png'));
  return { size: state.size, W, H, blob, pts, startLabel: state.facts.routeLabel, meters: route.meters, secs: route.secs, real };
}
async function routeScene(rd) {
  const base = await createImageBitmap(rd.blob), P = rd.pts, cum = [0];
  for (let i = 1; i < P.length; i++) cum.push(cum[i - 1] + Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]));
  const total = cum[cum.length - 1] || 1;
  const posAt = d => {
    let i = 1; while (i < cum.length - 1 && cum[i] < d) i++;
    const seg = cum[i] - cum[i - 1] || 1, f = Math.min(1, Math.max(0, (d - cum[i - 1]) / seg));
    const a = P[i - 1], b = P[i]; return { x: a[0] + (b[0] - a[0]) * f, y: a[1] + (b[1] - a[1]) * f, ang: Math.atan2(b[1] - a[1], b[0] - a[0]) };
  };
  const ease = u => (u < 0.5 ? 4 * u ** 3 : 1 - (-2 * u + 2) ** 3 / 2), clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const km = rd.meters / 1000, mins = rd.secs ? Math.max(1, Math.round(rd.secs / 60)) : 0;
  return {
    dur: ROUTE_DUR, base,
    draw(ctx, W, H, t) {
      const s = W / rd.W; ctx.scale(s, s); const w = rd.W, h = rd.H;
      ctx.drawImage(base, 0, 0, w, h);
      const p = ease(clamp((t - 0.8) / 6.4, 0, 1)), d = total * p, lw = Math.max(6, w / 120);
      const path = (to) => { ctx.beginPath(); ctx.moveTo(P[0][0], P[0][1]); for (let i = 1; i < P.length && cum[i] <= to; i++) ctx.lineTo(P[i][0], P[i][1]); const q = posAt(to); ctx.lineTo(q.x, q.y); };
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      path(total); ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = lw * 1.9; ctx.stroke();
      path(total); ctx.strokeStyle = 'rgba(122,31,43,.35)'; ctx.lineWidth = lw; ctx.stroke();
      path(d); ctx.strokeStyle = '#7a1f2b'; ctx.lineWidth = lw * 1.25; ctx.stroke();
      const fs = Math.round(w / 26), tag = (txt, X, Y, bg, fg) => { ctx.font = `bold ${fs}px sans-serif`; const tw = ctx.measureText(txt).width + fs; ctx.fillStyle = bg; ctx.beginPath(); ctx.roundRect(X - tw / 2, Y - fs * 0.85, tw, fs * 1.6, fs * 0.4); ctx.fill(); ctx.fillStyle = fg; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(txt, X, Y - fs * 0.05); };
      // จุดเริ่ม
      ctx.fillStyle = '#1f6fb5'; ctx.beginPath(); ctx.arc(P[0][0], P[0][1], w / 60, 0, 7); ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = '#fff'; ctx.stroke();
      tag(rd.startLabel || 'จุดเริ่มต้น', P[0][0], P[0][1] + w / 14, 'rgba(255,255,255,.95)', '#2e2220');
      // บ้าน (เด้งเบาๆ ตอนรถถึง)
      const E = P[P.length - 1], pulse = p >= 1 ? (Math.sin((t - 7.2) * 5) + 1) / 2 : 0;
      ctx.fillStyle = `rgba(122,31,43,${0.25 * pulse})`; ctx.beginPath(); ctx.arc(E[0], E[1], w / 20 + pulse * w / 30, 0, 7); ctx.fill();
      ctx.fillStyle = '#7a1f2b'; ctx.beginPath(); ctx.arc(E[0], E[1], w / 28, 0, 7); ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = '#fff'; ctx.stroke();
      ctx.font = `${Math.round(w / 22)}px sans-serif`; ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('🏠', E[0], E[1] + 2);
      tag('บ้านหลังนี้', E[0], E[1] - w / 14, '#7a1f2b', '#fff');
      // รถ
      const q = posAt(d), L = w / 17, Wd = L * 0.52;
      ctx.save(); ctx.translate(q.x, q.y); ctx.rotate(q.ang);
      ctx.shadowColor = 'rgba(0,0,0,.35)'; ctx.shadowBlur = 8; ctx.fillStyle = '#c0392b'; ctx.beginPath(); ctx.roundRect(-L / 2, -Wd / 2, L, Wd, Wd * 0.3); ctx.fill(); ctx.shadowBlur = 0;
      ctx.lineWidth = 3; ctx.strokeStyle = '#fff'; ctx.stroke();
      ctx.fillStyle = '#cfe8ff'; ctx.beginPath(); ctx.roundRect(L * 0.06, -Wd * 0.36, L * 0.26, Wd * 0.72, Wd * 0.12); ctx.fill();
      ctx.fillStyle = '#a8c8e8'; ctx.fillRect(-L * 0.32, -Wd * 0.32, L * 0.2, Wd * 0.64);
      ctx.fillStyle = '#fff3a0'; ctx.fillRect(L * 0.44, -Wd * 0.38, L * 0.06, Wd * 0.2); ctx.fillRect(L * 0.44, Wd * 0.18, L * 0.06, Wd * 0.2);
      ctx.restore();
      // แถบหัวเรื่อง
      const ta = clamp(t / 0.6, 0, 1);
      ctx.globalAlpha *= ta; ctx.fillStyle = 'rgba(122,31,43,.94)'; ctx.fillRect(0, 0, w, fs * 3.1); ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = `bold ${Math.round(fs * 1.2)}px sans-serif`; ctx.fillText('เส้นทางสู่บ้าน', w / 2, fs * 1.15);
      ctx.font = `${Math.round(fs * 0.85)}px sans-serif`; ctx.fillText(`ประมาณ ${km < 1 ? Math.round(km * 1000) + ' เมตร' : km.toFixed(1) + ' กิโลเมตร'}${mins ? ` · ขับ ~${mins} นาที` : ''}`, w / 2, fs * 2.3);
      ctx.globalAlpha = 1; ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.fillRect(0, h - fs * 1.2, w, fs * 1.2); ctx.fillStyle = '#444'; ctx.font = `${Math.round(fs * 0.6)}px sans-serif`; ctx.textAlign = 'right'; ctx.textBaseline = 'middle'; ctx.fillText('© OpenStreetMap contributors · เส้นทาง OSRM', w - 12, h - fs * 0.6);
    },
  };
}
