// ผังเรื่อง (Storyboard) + คลังกลาง: เตือนให้ใส่ช่วงสำคัญของคลิปไม่ให้ขาด
const AREA_ROOM = 'ทำเล/ใกล้เคียง';
const MAP_ROOM = 'แผนที่/การเดินทาง';
// คลังกลาง: ใส่ครั้งเดียว ใช้ซ้ำทุกคลิป (ไตเติล, หน้าปิด, ภาพทำเลหัวหิน)
const lib = { title: null, close: null, area: [], contact: { name: '', phone: '', line: '' } };
let libSeq = 1000000;
const saveLib = () => DB.set('library', lib);
async function loadLib() {
  const l = await DB.get('library'); if (!l) return;
  lib.contact = { name: '', phone: '', line: '', ...(l.contact || {}) }; lib.title = l.title || null; lib.close = l.close || null; lib.area = l.area || [];
  libSeq = Math.max(libSeq, ...lib.area.map(a => a.id)) + 1;
}
const areaItems = () => [...(state.useArea ? lib.area : []), ...state.items.filter(i => i.room === AREA_ROOM)];

function sbSlots() {
  const cnt = r => state.items.filter(i => i.room === r).length;
  const un = state.items.filter(i => !i.room).length;
  const area = areaItems().length, ext = cnt('หน้าบ้าน/ภายนอก'), map = cnt(MAP_ROOM), ct = lib.contact;
  const bed = cnt('ห้องนอนใหญ่') + cnt('ห้องนอน'), pool = cnt('สระว่ายน้ำ') + cnt('สวน/ระเบียง');
  const rec = (n, min) => (n >= min ? 'ok' : 'warn');
  return [
    { id: 'title', label: '1. ไตเติล (คลิปประจำ)', st: lib.title ? 'ok' : 'miss', info: lib.title ? lib.title.name : 'ยังไม่มี · จำเป็น', act: 'title' },
    { id: 'area', label: '2. ทำเลหัวหิน (มุมสูง/ชายหาด/ตลาด)', st: rec(area, 3), info: `${area} รูป · แนะนำ 3 รูปขึ้นไป`, act: 'area' },
    { id: 'ext', label: '3. หน้าบ้าน/ภายนอก', st: ext >= 2 ? 'ok' : ext === 1 ? 'warn' : 'miss', info: `${ext} รูป · จำเป็น 1 แนะนำ 2+`, act: 'go' },
    { id: 'liv', label: '4. ห้องนั่งเล่น', st: rec(cnt('ห้องนั่งเล่น'), 1), info: `${cnt('ห้องนั่งเล่น')} รูป · แนะนำ`, act: 'go' },
    { id: 'kit', label: '5. ครัว', st: rec(cnt('ครัว'), 1), info: `${cnt('ครัว')} รูป · แนะนำ`, act: 'go' },
    { id: 'bed', label: '6. ห้องนอน', st: rec(bed, 1), info: `${bed} รูป · แนะนำ`, act: 'go' },
    { id: 'bath', label: '7. ห้องน้ำ', st: rec(cnt('ห้องน้ำ'), 1), info: `${cnt('ห้องน้ำ')} รูป · แนะนำ`, act: 'go' },
    { id: 'pool', label: '8. สระ/สวน (ถ้ามี)', st: pool ? 'ok' : 'info', info: pool ? `${pool} รูป` : 'ไม่มีก็ข้ามได้', act: 'go' },
    { id: 'map', label: '9. แผนที่และการเดินทาง', st: map >= 1 ? 'ok' : 'miss', info: `${map} รูป · จำเป็น (ภาพแผนที่ Google Maps / เส้นทาง / เวลาเดินทาง)`, act: 'go' },
    { id: 'contact', label: '10. ข้อมูลติดต่อ (เบอร์โทร/LINE)', st: ct.phone.trim() ? 'ok' : 'miss', info: ct.phone.trim() ? `${ct.name} ${ct.phone}${ct.line ? ' · LINE ' + ct.line : ''}` : 'ยังไม่ได้กรอก · จำเป็น (กรอกด้านล่าง)', act: 'none' },
    { id: 'close', label: '11. หน้าปิด (คลิปประจำ)', st: lib.close ? 'ok' : 'miss', info: lib.close ? lib.close.name : 'ยังไม่มี · จำเป็น', act: 'close' },
    { id: 'un', label: 'รูปที่ยังไม่ตั้งห้อง', st: un ? 'miss' : 'ok', info: un ? `${un} รูป · ต้องตั้งให้ครบ` : 'ตั้งครบแล้ว', act: 'go' },
  ];
}
const sbBlockers = () => sbSlots().filter(s => s.st === 'miss');

function updateSb() {
  const bar = document.querySelector('#sb'); if (!bar) return;
  const sl = sbSlots(), miss = sl.filter(s => s.st === 'miss'), warn = sl.filter(s => s.st === 'warn');
  bar.className = 'sb ' + (miss.length ? 'miss' : warn.length ? 'warn' : 'ok');
  bar.textContent = miss.length ? `📋 ผังเรื่อง · ❌ ยังขาด ${miss.length}: ${miss.map(s => s.label.replace(/^\d+\. /, '').replace(/ \(.*\)/, '')).join(', ')}`
    : warn.length ? `📋 ผังเรื่อง · ⚠ แนะนำเพิ่ม ${warn.length} ช่วง` : '📋 ผังเรื่อง · ✅ ครบถ้วน';
}

function pickFiles(accept, multiple) {
  return new Promise(res => {
    const i = document.createElement('input'); i.type = 'file'; i.accept = accept; i.multiple = !!multiple; i.hidden = true;
    i.onchange = () => { res([...i.files]); i.remove(); }; document.body.appendChild(i); i.click();
  });
}
const mediaOf = f => ({ blob: f, type: f.type.startsWith('video') ? 'video' : 'image', name: f.name });

function openSb() {
  document.querySelector('#sbSheet')?.remove();
  const d = document.createElement('div'); d.className = 'sheet tall'; d.id = 'sbSheet';
  const icon = { ok: '✅', warn: '⚠️', miss: '❌', info: '➖' };
  const btn = s => s.act === 'title' || s.act === 'close' ? `<button class="ib wide" data-a="${s.act}">${lib[s.act] ? 'เปลี่ยน' : '+ เพิ่ม'}</button>${lib[s.act] ? `<button class="ib sm" data-a="rm-${s.act}" aria-label="ลบ">✕</button>` : ''}`
    : s.act === 'none' ? '' : s.act === 'area' ? `<button class="ib wide" data-a="area">+ ภาพทำเล</button>` : `<button class="ib wide" data-a="go">ไปตั้งห้อง</button>`;
  d.innerHTML = `<div class="sh-head"><b>📋 ผังเรื่องของคลิป</b><button class="ib" data-a="close-sheet" aria-label="ปิด">✕</button></div>
    <p class="hint">เรียงตามลำดับในคลิปจริง ❌ = จำเป็น ต้องมีก่อนเรนเดอร์ · ⚠️ = แนะนำให้ใส่ ไตเติล หน้าปิด และภาพทำเลเก็บไว้ในคลังกลาง ใส่ครั้งเดียวใช้ซ้ำทุกคลิป</p>
    ${sbSlots().map(s => `<div class="sbrow ${s.st}" data-id="${s.id}"><span class="dot">${icon[s.st]}</span><div class="sbt"><b>${s.label}</b><small>${s.info}</small></div><div class="sbb">${btn(s)}</div></div>`).join('')}
    <div class="seg"><b>☎️ ข้อมูลติดต่อ (กรอกครั้งเดียว ใช้ทุกคลิป)</b>
      <input class="ct" id="ctName" placeholder="ชื่อ / ชื่อบริษัท" value="${lib.contact.name.replace(/"/g, '&quot;')}">
      <input class="ct" id="ctPhone" type="tel" placeholder="เบอร์โทร" value="${lib.contact.phone.replace(/"/g, '&quot;')}">
      <input class="ct" id="ctLine" placeholder="LINE ID" value="${lib.contact.line.replace(/"/g, '&quot;')}"></div>
    <label class="sw"><input type="checkbox" id="useArea" ${state.useArea ? 'checked' : ''}> ใช้ภาพทำเลจากคลังกับคลิปนี้ (${lib.area.length} รูปในคลัง)</label>
    ${lib.area.length ? '<button class="ib wide" data-a="rm-area">ล้างภาพทำเลในคลัง</button>' : ''}`;
  d.oninput = e => {
    const m = { ctName: 'name', ctPhone: 'phone', ctLine: 'line' }[e.target.id]; if (!m) return;
    lib.contact[m] = e.target.value; saveLib(); updateSb();
    const c = sbSlots().find(x => x.id === 'contact'), row = d.querySelector('[data-id="contact"]');
    row.className = 'sbrow ' + c.st; row.querySelector('.dot').textContent = icon[c.st]; row.querySelector('small').textContent = c.info;
  };
  d.onchange = e => { if (e.target.id === 'useArea') { state.useArea = e.target.checked; save(); openSb(); } };
  d.onclick = async e => {
    const b = e.target.closest('button[data-a]'); if (!b) return; const a = b.dataset.a;
    if (a === 'close-sheet') { d.remove(); return; }
    if (a === 'go') { d.remove(); go(2); return; }
    if (a === 'title' || a === 'close') { const [f] = await pickFiles('image/*,video/*', false); if (f) { lib[a] = mediaOf(f); await saveLib(); } }
    else if (a === 'area') { const fs = await pickFiles('image/*,video/*', true); fs.forEach(f => lib.area.push({ id: libSeq++, ...mediaOf(f) })); if (fs.length) await saveLib(); }
    else if (a === 'rm-title') { lib.title = null; await saveLib(); }
    else if (a === 'rm-close') { lib.close = null; await saveLib(); }
    else if (a === 'rm-area') { if (!confirm('ล้างภาพทำเลทั้งหมดในคลังกลาง?')) return; lib.area = []; await saveLib(); }
    openSb(); updateSb();
  };
  document.body.appendChild(d);
}
