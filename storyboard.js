// ผังเรื่อง (Storyboard) + คลังกลาง: เตือนให้ใส่ช่วงสำคัญของคลิปไม่ให้ขาด
const AREA_ROOM = 'ทำเล/ใกล้เคียง';
const MAP_ROOM = 'แผนที่/การเดินทาง';
// หมวดภาพหัวหินที่ต้องมีครบ (ใส่ครั้งเดียวในคลังกลาง ใช้ซ้ำทุกคลิป)
const AREA_CATS = [
  { id: 'city', label: 'เมืองหัวหิน / มุมสูง' },
  { id: 'market', label: 'ตลาด / ร้านอาหาร' },
  { id: 'beach', label: 'ชายหาด / ทะเล' },
  { id: 'mountain', label: 'ภูเขา / ธรรมชาติ' },
];
const lib = { title: null, close: null, area: [], contact: { name: '', phone: '', line: '' } };
let libSeq = 1000000;
const saveLib = () => DB.set('library', lib);
async function loadLib() {
  const l = await DB.get('library'); if (!l) return;
  lib.contact = { name: '', phone: '', line: '', ...(l.contact || {}) }; lib.title = l.title || null; lib.close = l.close || null; lib.area = l.area || [];
  libSeq = Math.max(libSeq, ...lib.area.map(a => a.id)) + 1;
}
const libArea = cat => lib.area.filter(x => x.cat === cat);
const areaLibOrdered = () => [...AREA_CATS.flatMap(c => libArea(c.id)), ...lib.area.filter(x => !AREA_CATS.some(c => c.id === x.cat))];
const areaItems = () => [...areaLibOrdered(), ...state.items.filter(i => i.room === AREA_ROOM)];
// ข้อมูลติดต่อที่จะใช้ในคลิปนี้ (null = ไม่แสดง)
function activeContact() { const m = state.contact.mode; return m === 'none' ? null : m === 'custom' ? state.contact.custom : lib.contact; }

function sbSlots() {
  const cnt = r => state.items.filter(i => i.room === r).length;
  const un = state.items.filter(i => !i.room).length, ext = cnt('หน้าบ้าน/ภายนอก'), map = cnt(MAP_ROOM);
  const bed = cnt('ห้องนอนใหญ่') + cnt('ห้องนอน'), pool = cnt('สระว่ายน้ำ') + cnt('สวน/ระเบียง');
  const rec = (n, min) => (n >= min ? 'ok' : 'warn');
  const ct = activeContact(), mode = state.contact.mode;
  const catSlots = AREA_CATS.map(c => { const n = libArea(c.id).length; return { id: 'cat-' + c.id, cat: c.id, label: 'ทำเล: ' + c.label, st: n ? 'ok' : 'miss', info: n ? `${n} รูป (คลังกลาง)` : 'ยังไม่มี · จำเป็น', act: 'cat' }; });
  return [
    { id: 'title', label: 'ไตเติล (คลิปประจำ)', st: lib.title ? 'ok' : 'miss', info: lib.title ? lib.title.name : 'ยังไม่มี · จำเป็น', act: 'title' },
    ...catSlots,
    { id: 'map', label: 'แผนที่เข้าโครงการ (ไม่ใส่ก็ได้)', st: map ? 'ok' : 'info', info: map ? `${map} รูป` : 'ไม่จำเป็น · ข้ามได้ถ้าไม่อยากเปิดเผยที่ตั้ง (แคป Google Maps + เส้นทาง)', act: 'go' },
    { id: 'ext', label: 'หน้าบ้าน/ภายนอก', st: ext >= 2 ? 'ok' : ext === 1 ? 'warn' : 'miss', info: `${ext} รูป · จำเป็น 1 แนะนำ 2+`, act: 'go' },
    { id: 'liv', label: 'ห้องนั่งเล่น', st: rec(cnt('ห้องนั่งเล่น'), 1), info: `${cnt('ห้องนั่งเล่น')} รูป · แนะนำ`, act: 'go' },
    { id: 'kit', label: 'ครัว', st: rec(cnt('ครัว'), 1), info: `${cnt('ครัว')} รูป · แนะนำ`, act: 'go' },
    { id: 'bed', label: 'ห้องนอน', st: rec(bed, 1), info: `${bed} รูป · แนะนำ`, act: 'go' },
    { id: 'bath', label: 'ห้องน้ำ', st: rec(cnt('ห้องน้ำ'), 1), info: `${cnt('ห้องน้ำ')} รูป · แนะนำ`, act: 'go' },
    { id: 'pool', label: 'สระ/สวน (ถ้ามี)', st: pool ? 'ok' : 'info', info: pool ? `${pool} รูป` : 'ไม่มีก็ข้ามได้', act: 'go' },
    { id: 'contact', label: 'เบอร์โทร/ข้อมูลติดต่อ', st: mode === 'none' ? 'ok' : (ct && ct.phone.trim() ? 'ok' : 'miss'),
      info: mode === 'none' ? 'ไม่แสดงเบอร์ในคลิปนี้' : (ct && ct.phone.trim() ? `${ct.name} ${ct.phone}${ct.line ? ' · LINE ' + ct.line : ''}` : 'ยังไม่ได้กรอกเบอร์ (หรือเลือก "ไม่แสดง")'), act: 'none' },
    { id: 'close', label: 'หน้าปิด (คลิปประจำ)', st: lib.close ? 'ok' : 'miss', info: lib.close ? lib.close.name : 'ยังไม่มี · จำเป็น', act: 'close' },
    { id: 'un', label: 'รูปที่ยังไม่ตั้งห้อง', st: un ? 'miss' : 'ok', info: un ? `${un} รูป · ต้องตั้งให้ครบ` : 'ตั้งครบแล้ว', act: 'go', nonum: true },
  ];
}
const sbBlockers = () => sbSlots().filter(s => s.st === 'miss');

function updateSb() {
  const bar = document.querySelector('#sb'); if (!bar) return;
  const sl = sbSlots(), miss = sl.filter(s => s.st === 'miss'), warn = sl.filter(s => s.st === 'warn');
  bar.className = 'sb ' + (miss.length ? 'miss' : warn.length ? 'warn' : 'ok');
  bar.textContent = miss.length ? `📋 ผังเรื่อง · ❌ ยังขาด ${miss.length}: ${miss.map(s => s.label.replace(/ \(.*\)/, '')).join(', ')}`
    : warn.length ? `📋 ผังเรื่อง · ⚠ แนะนำเพิ่ม ${warn.length} ช่วง` : '📋 ผังเรื่อง · ✅ ครบถ้วน';
}

function pickFiles(accept, multiple) {
  return new Promise(res => {
    const i = document.createElement('input'); i.type = 'file'; i.accept = accept; i.multiple = !!multiple; i.hidden = true;
    i.onchange = () => { res([...i.files]); i.remove(); }; document.body.appendChild(i); i.click();
  });
}
const mediaOf = f => ({ blob: f, type: f.type.startsWith('video') ? 'video' : 'image', name: f.name });
const esc = v => String(v).replace(/"/g, '&quot;');

function openSb() {
  document.querySelector('#sbSheet')?.remove();
  const d = document.createElement('div'); d.className = 'sheet tall'; d.id = 'sbSheet';
  const icon = { ok: '✅', warn: '⚠️', miss: '❌', info: '➖' };
  const btn = s => s.act === 'title' || s.act === 'close' ? `<button class="ib wide" data-a="${s.act}">${lib[s.act] ? 'เปลี่ยน' : '+ เพิ่ม'}</button>${lib[s.act] ? `<button class="ib sm" data-a="rm-${s.act}" aria-label="ลบ">✕</button>` : ''}`
    : s.act === 'cat' ? `<button class="ib wide" data-a="cat-${s.cat}">+ เพิ่ม</button>${libArea(s.cat).length ? `<button class="ib sm" data-a="clr-${s.cat}" aria-label="ล้างหมวดนี้">✕</button>` : ''}`
    : s.act === 'none' ? '' : `<button class="ib wide" data-a="go">ไปตั้งห้อง</button>`;
  let n = 0;
  const rows = sbSlots().map(s => { if (!s.nonum) n++; return `<div class="sbrow ${s.st}" data-id="${s.id}"><span class="dot">${icon[s.st]}</span><div class="sbt"><b>${s.nonum ? '' : n + '. '}${s.label}</b><small>${s.info}</small></div><div class="sbb">${btn(s)}</div></div>`; }).join('');
  const mode = state.contact.mode, tgt = mode === 'custom' ? state.contact.custom : lib.contact;
  d.innerHTML = `<div class="sh-head"><b>📋 ผังเรื่องของคลิป</b><button class="ib" data-a="close-sheet" aria-label="ปิด">✕</button></div>
    <p class="hint">เรียงตามลำดับในคลิปจริง ❌ = จำเป็น ต้องมีก่อนเรนเดอร์ · ⚠️ = แนะนำให้ใส่ · ➖ = ไม่ใส่ก็ได้<br>ไตเติล หน้าปิด และภาพหัวหิน เก็บไว้ในคลังกลาง ใส่ครั้งเดียวใช้ซ้ำทุกคลิป</p>
    ${rows}
    <div class="seg"><b>☎️ เบอร์โทรในคลิปนี้</b>
      <label class="sw"><input type="radio" name="cm" value="std" ${mode === 'std' ? 'checked' : ''}> ใช้เบอร์มาตรฐาน (ตั้งครั้งเดียว)</label>
      <label class="sw"><input type="radio" name="cm" value="custom" ${mode === 'custom' ? 'checked' : ''}> ใช้เบอร์ใหม่เฉพาะคลิปนี้</label>
      <label class="sw"><input type="radio" name="cm" value="none" ${mode === 'none' ? 'checked' : ''}> ไม่แสดงเบอร์</label>
      ${mode === 'none' ? '' : `<input class="ct" id="ctName" placeholder="ชื่อ / ชื่อบริษัท" value="${esc(tgt.name)}">
      <input class="ct" id="ctPhone" type="tel" placeholder="เบอร์โทร" value="${esc(tgt.phone)}">
      <input class="ct" id="ctLine" placeholder="LINE ID" value="${esc(tgt.line)}">`}</div>`;
  d.oninput = e => {
    const m = { ctName: 'name', ctPhone: 'phone', ctLine: 'line' }[e.target.id]; if (!m) return;
    (state.contact.mode === 'custom' ? state.contact.custom : lib.contact)[m] = e.target.value;
    state.contact.mode === 'custom' ? save() : saveLib(); updateSb();
    const c = sbSlots().find(x => x.id === 'contact'), row = d.querySelector('[data-id="contact"]');
    row.className = 'sbrow ' + c.st; row.querySelector('.dot').textContent = icon[c.st]; row.querySelector('small').textContent = c.info;
  };
  d.onchange = e => { if (e.target.name === 'cm') { state.contact.mode = e.target.value; save(); openSb(); } };
  d.onclick = async e => {
    const b = e.target.closest('button[data-a]'); if (!b) return; const a = b.dataset.a;
    if (a === 'close-sheet') { d.remove(); return; }
    if (a === 'go') { d.remove(); go(2); return; }
    if (a === 'title' || a === 'close') { const [f] = await pickFiles('image/*,video/*', false); if (f) { lib[a] = mediaOf(f); await saveLib(); } }
    else if (a.startsWith('cat-')) { const cat = a.slice(4); const fs = await pickFiles('image/*,video/*', true); fs.forEach(f => lib.area.push({ id: libSeq++, cat, ...mediaOf(f) })); if (fs.length) await saveLib(); }
    else if (a.startsWith('clr-')) { if (!confirm('ล้างภาพหมวดนี้ในคลังกลาง?')) return; lib.area = lib.area.filter(x => x.cat !== a.slice(4)); await saveLib(); }
    else if (a === 'rm-title') { lib.title = null; await saveLib(); }
    else if (a === 'rm-close') { lib.close = null; await saveLib(); }
    openSb(); updateSb();
  };
  document.body.appendChild(d);
}
