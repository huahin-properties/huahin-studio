// ผังเรื่อง (Storyboard) = แท็บเช็กลิสต์ของขั้น 2 + คลังกลาง (ไตเติล/หน้าปิด/ภาพหัวหินใส่ครั้งเดียวใช้ซ้ำ)
const AREA_ROOM = 'ทำเล/ใกล้เคียง';
const MAP_ROOM = 'แผนที่/การเดินทาง';
const AREA_CATS = [
  { id: 'city', label: 'เมืองหัวหิน / มุมสูง' },
  { id: 'market', label: 'ตลาด / ร้านอาหาร' },
  { id: 'beach', label: 'ชายหาด / ทะเล' },
  { id: 'mountain', label: 'ภูเขา / ธรรมชาติ' },
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
  { id: 'contact', ico: '☎️', short: 'ติดต่อ', label: 'เบอร์โทร / ข้อมูลติดต่อ', kind: 'contact', min: 1, rec: 1, hint: 'เลือกใช้เบอร์มาตรฐาน พิมพ์เบอร์ใหม่ หรือไม่แสดงเบอร์' },
  { id: 'close', ico: '🏁', short: 'เครดิตปิด', label: 'เครดิตปิดท้าย (คลิปประจำ)', kind: 'lib', min: 1, rec: 1, max1: true, hint: 'คลิปเครดิต/ข้อมูลติดต่อปิดท้าย · 1 ไฟล์ · ใส่ครั้งเดียวใช้ซ้ำทุกคลิป' },
];
const lib = { title: null, close: null, area: [], contact: { name: '', phone: '', line: '' } };
let libSeq = 1000000;
const saveLib = () => DB.set('library', lib);
async function loadLib() {
  const l = await DB.get('library'); if (!l) return;
  lib.contact = { name: '', phone: '', line: '', ...(l.contact || {}) }; lib.title = l.title || null; lib.close = l.close || null; lib.area = l.area || [];
  libSeq = Math.max(libSeq, ...lib.area.map(a => a.id || 0), (lib.title && lib.title.id) || 0, (lib.close && lib.close.id) || 0) + 1;
}
const libArea = cat => lib.area.filter(x => x.cat === cat);
const areaLibOrdered = () => [...AREA_CATS.flatMap(c => libArea(c.id)), ...lib.area.filter(x => !AREA_CATS.some(c => c.id === x.cat))];
const areaItems = () => [...areaLibOrdered(), ...state.items.filter(i => i.room === AREA_ROOM)];
function activeContact() { const m = state.contact.mode; return m === 'none' ? null : m === 'custom' ? state.contact.custom : lib.contact; }
const mediaOf = f => ({ blob: f, type: f.type.startsWith('video') ? 'video' : 'image', name: f.name });

// ไฟล์ของแท็บนั้น
function slotItems(s) {
  if (s.kind === 'lib') {
    if (s.cat) return libArea(s.cat);
    const x = lib[s.id]; if (!x) return []; if (!x.id) x.id = libSeq++; return [x];
  }
  return s.kind === 'room' ? state.items.filter(i => s.rooms.includes(i.room)) : [];
}
async function addToSlot(s, files) {
  if (s.kind === 'lib') {
    if (s.cat) files.forEach(f => lib.area.push({ id: libSeq++, cat: s.cat, ...mediaOf(f) }));
    else if (files[0]) lib[s.id] = { id: libSeq++, ...mediaOf(files[0]) };
    await saveLib(); return;
  }
  files.forEach(f => state.items.push({ id: nextId++, ...mediaOf(f), room: s.room }));
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
  if (s.kind === 'contact') { const ct = activeContact(); return state.contact.mode === 'none' || (ct && ct.phone.trim()) ? 1 : 0; }
  return slotItems(s).length;
}
function slotStatus(s, n = slotCount(s)) {
  if (n < s.min) return 'miss';
  if (s.min === 0 && s.rec === 0) return n ? 'ok' : 'info';
  return n >= s.rec ? 'ok' : 'warn';
}
function slotInfo(s, n) {
  if (s.kind === 'contact') { const ct = activeContact(); return state.contact.mode === 'none' ? 'ไม่แสดงเบอร์ในคลิปนี้' : n ? `${ct.name} ${ct.phone}${ct.line ? ' · LINE ' + ct.line : ''}` : 'ยังไม่ได้กรอกเบอร์ (หรือเลือก "ไม่แสดง")'; }
  if (s.min === 0 && s.rec === 0) return n ? `${n} รูป/คลิป` : 'ไม่จำเป็น · ข้ามได้';
  if (n === 0) return s.min ? 'ยังไม่มี · จำเป็น' : 'ยังไม่มี · แนะนำให้ใส่';
  return `${n} รูป/คลิป${n < s.rec ? ` · แนะนำ ${s.rec}+` : ''}`;
}
function sbSlots() {
  const un = state.items.filter(i => !i.room || !SLOTS.some(s => s.rooms && s.rooms.includes(i.room)) && i.room !== AREA_ROOM).length;
  return [...SLOTS.map(s => { const n = slotCount(s); return { id: s.id, label: s.label, st: slotStatus(s, n), info: slotInfo(s, n), act: 'go' }; }),
    ...(un ? [{ id: 'un', label: 'รูปเดิมที่ยังไม่จัดเข้าแท็บ', st: 'miss', info: `${un} รูป · ไปขั้น 3 เพื่อย้ายเข้าห้อง หรือลบ`, act: 'un', nonum: true }] : [])];
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
    ${mode === 'none' ? '' : `<input class="ct" id="ctName" placeholder="ชื่อ / ชื่อบริษัท" value="${esc(tgt.name)}">
    <input class="ct" id="ctPhone" type="tel" placeholder="เบอร์โทร" value="${esc(tgt.phone)}">
    <input class="ct" id="ctLine" placeholder="LINE ID" value="${esc(tgt.line)}">`}</div>`;
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
