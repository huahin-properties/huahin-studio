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
  { id: 'cat-lifestyle', ico: '👨‍👩‍👧', short: 'ไลฟ์สไตล์', label: 'ไลฟ์สไตล์ (ครอบครัว / ออกกำลังกาย / ไปตลาด)', kind: 'lib', cat: 'lifestyle', min: 0, rec: 1, hint: 'ภาพหรือคลิปครอบครัวอยู่ด้วยกัน ออกกำลังกาย ไปตลาด 1–4 ภาพ · ใส่ครั้งเดียวใช้ซ้ำทุกคลิป' },
  { id: 'contact', ico: '☎️', short: 'ติดต่อ', label: 'เบอร์โทร / ข้อมูลติดต่อ', kind: 'contact', min: 1, rec: 1, hint: 'เลือกใช้เบอร์มาตรฐาน พิมพ์เบอร์ใหม่ หรือไม่แสดงเบอร์' },
  { id: 'close', ico: '🏁', short: 'เครดิตปิด', label: 'เครดิตปิดท้าย (คลิปประจำ)', kind: 'lib', min: 1, rec: 1, max1: true, hint: 'คลิปเครดิต/ข้อมูลติดต่อปิดท้าย · 1 ไฟล์ · ใส่ครั้งเดียวใช้ซ้ำทุกคลิป' },
];
const DEFAULT_PLACES = ['หาดหัวหิน', 'ตลาดโต้รุ่งหัวหิน', 'สถานีรถไฟหัวหิน', 'สนามบินหัวหิน', 'เขาตะเกียบ', 'ซีคาด้า มาร์เก็ต', 'มาร์เก็ต วิลเลจ'];
const lib = { title: null, close: null, area: [], contact: { name: '', phone: '', line: '' }, places: DEFAULT_PLACES.map((name, i) => ({ id: i + 1, name, coord: '' })) };
let libSeq = 1000000;
const saveLib = () => DB.set('library', lib);
async function loadLib() {
  const l = await DB.get('library'); if (!l) return;
  lib.contact = { name: '', phone: '', line: '', ...(l.contact || {}) }; lib.title = l.title || null; lib.close = l.close || null; lib.area = l.area || []; if (l.places && l.places.length) lib.places = l.places;
  libSeq = Math.max(libSeq, ...lib.area.map(a => a.id || 0), (lib.title && lib.title.id) || 0, (lib.close && lib.close.id) || 0) + 1;
}
const libArea = cat => lib.area.filter(x => x.cat === cat);
const areaLibOrdered = () => [...AREA_CATS.flatMap(c => libArea(c.id)), ...lib.area.filter(x => !AREA_CATS.some(c => c.id === x.cat) && x.cat !== 'lifestyle')];
const lifeItems = () => libArea('lifestyle');
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
  if (s.id === 'map' && !n && state.skipMap) return 'ข้ามแผนที่ในคลิปนี้';
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
    return { name: p.name, km, min: Math.max(2, Math.round(road / 40 * 60)) };
  }).sort((a, b) => a.km - b.km);
}
const fmtKm = km => (km < 1 ? `${Math.max(100, Math.round(km * 10) * 100)} เมตร` : `${km < 10 ? km.toFixed(1) : Math.round(km)} กิโลเมตร`);
function mapScriptText(max = 4) {
  const near = placeDistances().slice(0, max); if (!near.length) return '';
  return 'บ้านหลังนี้ ' + near.map(x => `ห่างจาก${x.name}ประมาณ ${fmtKm(x.km)} ขับรถราว ${x.min} นาที`).join(' ');
}

// หน้าต่างตั้งสถานที่สำคัญ (วางพิกัดครั้งเดียว ใช้ซ้ำทุกบ้าน)
function openPlaces(after) {
  document.querySelector('#placesSheet')?.remove();
  const d = document.createElement('div'); d.className = 'sheet tall'; d.id = 'placesSheet';
  const rows = () => lib.places.map(p => `<div class="prow" data-id="${p.id}"><b>${p.name}</b><input class="ct" data-c="${p.id}" inputmode="decimal" placeholder="วางพิกัด เช่น 12.5698,99.9577" value="${esc(p.coord)}"><span class="pst">${p.coord ? (parseCoord(p.coord) ? '✅' : '⚠️ อ่านพิกัดไม่ออก') : ''}</span><button class="ib sm" data-rm="${p.id}" aria-label="ลบ">✕</button></div>`).join('');
  d.innerHTML = `<div class="sh-head"><b>📍 สถานที่สำคัญ</b><button class="ib" data-a="x" aria-label="ปิด">✕</button></div>
    <p class="hint">วางพิกัดของแต่ละที่ <b>ครั้งเดียว</b> ใช้ซ้ำทุกบ้าน · วิธีคัดลอก: เปิด Google Maps กดค้างที่จุดนั้น แล้วแตะตัวเลขพิกัดด้านบนเพื่อคัดลอก · ที่ไม่ใส่พิกัดจะไม่ถูกนำมาคำนวณ</p>
    <div id="prows">${rows()}</div>
    <button class="btn alt" data-a="add">+ เพิ่มสถานที่</button><button class="btn" data-a="x">เสร็จ</button>`;
  d.addEventListener('input', e => { const id = +e.target.dataset.c; if (!id) return; const p = lib.places.find(x => x.id === id); p.coord = e.target.value; saveLib(); e.target.closest('.prow').querySelector('.pst').textContent = p.coord ? (parseCoord(p.coord) ? '✅' : '⚠️ อ่านพิกัดไม่ออก') : ''; });
  d.onclick = async e => {
    const rm = e.target.closest('[data-rm]'); if (rm) { lib.places = lib.places.filter(x => x.id !== +rm.dataset.rm); await saveLib(); d.querySelector('#prows').innerHTML = rows(); return; }
    const a = e.target.closest('[data-a]')?.dataset.a; if (!a) return;
    if (a === 'add') { const name = prompt('ชื่อสถานที่ เช่น โรงพยาบาลหัวหิน'); if (name && name.trim()) { lib.places.push({ id: Date.now(), name: name.trim(), coord: '' }); await saveLib(); d.querySelector('#prows').innerHTML = rows(); } return; }
    d.remove(); if (after) after();
  };
  document.body.appendChild(d);
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
    blobs.forEach((b, i) => state.items.push({ id: nextId++, blob: b, type: 'image', room: MAP_ROOM, name: `map-auto-${i + 1}.png` }));
    await save(); state.skipMap = false; return blobs.length;
  } catch (e) { statusEl.textContent = '❌ โหลดแผนที่ไม่สำเร็จ (ต่อเน็ตอยู่ไหม?) ' + (e.message || e) + ' · หรือแคปหน้า Google Maps แล้วเพิ่มรูปเองแทนได้'; return false; }
}
