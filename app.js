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

const state = { slot: 'title', step: 0, size: '4:5', items: [], color: { ...COLOR_DEFAULT }, useArea: true, contact: { mode: 'std', custom: { name: '', phone: '', line: '' } }, script: { area: '', rooms: {} } };
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
const save = () => (typeof updateSb === 'function' && updateSb(), DB.set('project', { v: 2, useArea: state.useArea, contact: state.contact, size: state.size, color: state.color, script: state.script, items: state.items.map(({ id, blob, type, room, name }) => ({ id, blob, type, room, name })) }));
async function load() {
  await loadLib(); const p = await DB.get('project');
  if (p) { if (!p.v) p.items.forEach(i => { if (i.room === 'หน้าบ้าน/ภายนอก') i.room = ''; }); state.size = p.size; state.color = { ...COLOR_DEFAULT, ...(p.color || {}) }; state.script = { area: '', rooms: {}, ...(p.script || {}) }; state.useArea = true; state.contact = { mode: 'std', ...(p.contact || {}), custom: { name: '', phone: '', line: '', ...((p.contact || {}).custom || {}) } }; state.items = p.items; nextId = Math.max(0, ...p.items.map(i => i.id)) + 1; }
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

// ---- ขั้น 2: เช็กลิสต์แท็บ — แตะแท็บเพื่อเพิ่มไฟล์ในป๊อปอัพ ไฟล์ที่ใส่แล้วแสดงด้านล่างหน้าเดียวกัน ----
let refreshChips = null;
const slotScript = sl => (sl.cat === 'lifestyle' ? ['life'] : sl.cat ? ['area'] : sl.kind === 'room' ? ['room', sl.room] : null);
const getSlotScript = sl => { const k = slotScript(sl); return !k ? null : k[0] === 'room' ? (state.script.rooms[k[1]] || '') : (state.script[k[0]] || ''); };
const setSlotScript = (sl, v) => { const k = slotScript(sl); if (k[0] === 'room') state.script.rooms[k[1]] = v; else state.script[k[0]] = v; save(); };
const thumbHtml = (it, del) => `<div class="th" data-id="${it.id}">${it.type === 'video' ? `<video src="${urlOf(it)}#t=0.1" muted playsinline></video>` : `<img src="${urlOf(it)}" alt="">`}${del ? `<button class="x" data-del="${it.id}" aria-label="ลบ">✕</button>` : ''}</div>`;

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
    ${sl.kind === 'contact' ? contactCardHtml() : `<button class="btn" data-a="add">${sl.max1 && items.length ? '↻ เปลี่ยนไฟล์' : '+ เพิ่มรูป / คลิป'}</button>
      ${items.length ? `<div class="sgrid" id="pgrid">${items.map(it => thumbHtml(it, true)).join('')}</div>` : ''}`}
    ${sc !== null ? `<label class="sl"><span>📝 สคริปต์ของช่วงนี้${sl.cat && sl.cat !== 'lifestyle' ? ' (ใช้ร่วมกันทั้ง 4 แท็บทำเล)' : ''}</span></label><textarea class="sct" id="slotScript" rows="3" placeholder="พิมพ์เรื่องเล่าของช่วงนี้ (ไม่ใส่ก็ได้ เขียนทีหลังได้ที่ขั้น 4)">${sc.replace(/</g, '&lt;')}</textarea>` : ''}
    <button class="btn" data-a="x">เสร็จ</button>`;
  d.onclick = async e => {
    if (e.target.closest('[data-a=x]')) { d.remove(); refreshAll(); return; }
    if (e.target.closest('[data-a=add]')) { const fs = await pickFiles('image/*,video/*', !sl.max1); if (fs.length) { await addToSlot(sl, fs); updateSb(); openSlot(id); } return; }
    const b = e.target.closest('[data-del]'); if (b && confirm('ลบไฟล์นี้ใช่ไหม?')) { await removeFromSlot(sl, +b.dataset.del); updateSb(); openSlot(id); }
  };
  d.addEventListener('input', e => { if (e.target.id === 'slotScript') setSlotScript(sl, e.target.value); });
  if (sl.kind === 'contact') bindContact(d, () => openSlot(id));
  document.body.appendChild(d);
}

let refreshAll = () => {};
function viewSlots() {
  selExtra = ''; selPre = '';
  const mark = { ok: '✓', warn: '!', miss: '●', info: '' };
  $('#view').innerHTML = `
    <h2>ใส่รูป/คลิปตามช่วงของคลิป</h2>
    <p class="hint">แตะแท็บเพื่อเพิ่มรูป/คลิป ไม่ต้องเรียงลำดับ · เขียว ✓ = ผ่านแล้ว · แดง ● = จำเป็น · ส้ม ! = แนะนำ · เส้นประ = ข้ามได้</p>
    <div class="chips" id="chips"></div>
    <div id="gallery"></div>
    <div id="doneBar"></div>`;
  const renderChips = () => {
    const el = $('#chips'); if (!el) return;
    el.innerHTML = SLOTS.map(x => `<button class="chip st-${slotStatus(x)}" data-s="${x.id}">${x.ico} ${x.short} <i>${mark[slotStatus(x)]}</i></button>`).join('');
  };
  const renderGallery = () => {
    const g = $('#gallery'); if (!g) return;
    const html = SLOTS.map(sl => {
      if (sl.kind === 'contact') { const ct = activeContact(); const ok = slotCount(sl);
        return ok ? `<div class="gsec" data-sec="${sl.id}"><div class="gh"><b>${sl.ico} ${sl.short}</b><button class="ib sm" data-open="${sl.id}">แก้ไข</button></div><p class="hint">${slotInfo(sl, ok)}</p></div>` : ''; }
      const items = slotItems(sl); if (!items.length) return '';
      return `<div class="gsec" data-sec="${sl.id}"><div class="gh"><b>${sl.ico} ${sl.label.replace(/ \(.*\)/, '')} · ${items.length}</b><button class="ib sm" data-open="${sl.id}">+ เพิ่ม</button></div>
        ${scriptBarHtml(sl)}
        <div class="sgrid" data-grid="${sl.id}">${items.map(it => thumbHtml(it, true)).join('')}</div></div>`;
    }).join('');
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
    el.innerHTML = `${miss.length ? `<p class="hint" style="color:#9b1c1c">❌ ยังขาด: ${miss.map(m => m.label.replace(/ \(.*\)/, '')).join(', ')}</p>` : '<p class="hint" style="color:#1e6b3a">✅ เช็กลิสต์ของจำเป็นครบแล้ว</p>'}
      <button class="btn" id="toColor" ${miss.length ? 'disabled' : ''}>ถัดไป: 3 สี →</button>`;
    $('#toColor').onclick = () => go(2);
  };
  refreshAll = () => { renderChips(); renderGallery(); renderDone(); };
  refreshChips = () => { if ($('#chips')) { renderChips(); renderDone(); } };
  $('#chips').onclick = e => { const b = e.target.closest('.chip'); if (b) openSlot(b.dataset.s); };
  $('#gallery').onclick = async e => {
    const o = e.target.closest('[data-open]'); if (o) { openSlot(o.dataset.open); return; }
    const x = e.target.closest('[data-del]'); if (!x) return;
    const sl = SLOTS.find(z => z.id === x.closest(".gsec").dataset.sec);
    if (confirm('ลบไฟล์นี้ใช่ไหม?')) { await removeFromSlot(sl, +x.dataset.del); updateSb(); refreshAll(); }
  };
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
function viewScript() {
  organizeItems(); save();
  const segs = scriptSegments(), no2 = n => String(n).padStart(2, '0');
  const setText = (seg, v) => { if (seg.key === 'life') state.script.life = v; else if (seg.key === 'area') state.script.area = v; else state.script.rooms[seg.room] = v; };
  const total = () => scriptSegments().reduce((a, g) => a + secOf(g.text), 0);
  const card = g => {
    const its = g.key === 'life' ? lifeItems() : g.key === 'area' ? areaItems() : state.items.filter(i => i.room === g.room);
    return `<div class="seg" data-key="${g.key}">
      <div class="seg-h"><b>${no2(g.no)} · ${g.label}</b><span class="badge" data-t="${g.key}">~${secOf(g.text)} วิ</span><button class="ib sm" data-cp="${g.key}" title="คัดลอกท่อนนี้" aria-label="คัดลอกท่อนนี้">📋</button></div>
      ${its.length ? `<div class="mini">${its.slice(0, 4).map(i => i.type === 'image' ? `<img src="${urlOf(i)}" alt="">` : '<span>🎬</span>').join('')}<small>${its.length} รูป/คลิป</small></div>` : ''}
      <textarea rows="3" data-k="${g.key}" placeholder="พิมพ์เรื่องเล่าของห้องนี้...">${g.text.replace(/</g, '&lt;')}</textarea>
    </div>`;
  };
  $('#view').innerHTML = `
    <h2>4 สคริปต์: เรื่องราว</h2>
    <div class="tools"><button class="ib" data-all title="คัดลอกสคริปต์ทั้งหมดไปวางใน Google AI Studio" aria-label="คัดลอกทั้งหมด">📋 ทั้งหมด</button></div>
    <p class="hint">เวลารวมโดยประมาณ <b id="tot">${mmss(total())}</b> (เป้าหมายประมาณ 3:00) · เลขท่อนตรงกับชื่อไฟล์เสียง 01, 02, ... · ไตเติลและหน้าปิดเป็นคลิปประจำ ไม่ต้องเขียนสคริปต์</p>
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
  warn();
  $('#segs').oninput = e => {
    const ta = e.target.closest('textarea'); if (!ta) return;
    const g = scriptSegments().find(x => x.key === ta.dataset.k); setText(g, ta.value); save();
    document.querySelector(`[data-t="${CSS.escape(g.key)}"]`).textContent = `~${secOf(ta.value)} วิ`;
    $('#tot').textContent = mmss(total()); warn();
  };
  const flash = (btn, ok) => { const o = btn.textContent; btn.textContent = ok ? '✓ คัดลอกแล้ว' : 'คัดลอกไม่ได้'; setTimeout(() => { btn.textContent = o; }, 1500); };
  $('#segs').onclick = async e => {
    const b = e.target.closest('[data-cp]'); if (!b) return;
    const g = scriptSegments().find(x => x.key === b.dataset.cp); flash(b, await copyText(g.text));
  };
  document.querySelector('[data-all]').onclick = async e => {
    const txt = scriptSegments().map(g => `[${no2(g.no)}]\n${g.text.trim()}`).join('\n\n');
    flash(e.currentTarget, await copyText(txt));
  };
  $('#nx').onclick = () => go(4); $('#bk').onclick = () => go(2);
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
    const put = (cv, bmp, lut, w) => { const h = Math.round(w * bmp.height / bmp.width); cv.width = w; cv.height = h; cv.getContext('2d').drawImage(gradeToCanvas(bmp, lut, w, h), 0, 0); };
    { const un = imgs.filter(x => !x.room).length;
      $('#prog3').innerHTML = un ? `🟧 ยังไม่ตั้งห้อง <b>${un}</b> จาก ${imgs.length} รูป · <button class="lnk" id="pickUn">เลือกที่ยังไม่ตั้งห้อง</button>` : `🟩 ตั้งห้องครบทั้ง ${imgs.length} รูปแล้ว`;
      const pu = $('#pickUn'); if (pu) pu.onclick = () => { selMode = true; picked.clear(); imgs.filter(x => !x.room).forEach(x => picked.add(x.id)); $('#selbar').innerHTML = selBarHtml(); draw(); }; }
    $('#cap').textContent = `รูปที่ ${sel + 1} จาก ${imgs.length} · ห้อง: ${imgs[sel].room || 'ยังไม่ตั้งห้อง'} · ปรับสี: ${c.auto ? 'อัตโนมัติ' : 'ปิด'}${(c.bright || c.contrast || c.warm) ? ' + ตั้งเอง' : ''}`;
    put($('#cb'), smalls[sel], null, 240); put($('#ca'), smalls[sel], luts && luts[sel], 240);
    document.querySelectorAll('#th canvas').forEach(cv => {
      const i = +cv.dataset.i; put(cv, smalls[i], luts && luts[i], 110); cv.classList.toggle('on', !selMode && i === sel);
      { const x = cv.getContext('2d'), rm = imgs[i].room;
        x.fillStyle = rm ? 'rgba(30,110,60,.92)' : 'rgba(224,138,0,.95)'; x.fillRect(0, cv.height - 18, cv.width, 18);
        x.fillStyle = '#fff'; x.font = 'bold 11px sans-serif'; x.textAlign = 'left'; x.textBaseline = 'middle';
        x.fillText(rm ? '✓ ' + rm : '⚠ ยังไม่ตั้งห้อง', 5, cv.height - 8, cv.width - 10); }
      cv.classList.toggle('ok', !!imgs[i].room); cv.classList.toggle('un', !imgs[i].room);
      if (selMode) {
        const x = cv.getContext('2d'), on = picked.has(imgs[i].id);
        if (on) { x.fillStyle = 'rgba(122,31,43,.55)'; x.fillRect(0, 0, cv.width, cv.height); x.lineWidth = 5; x.strokeStyle = '#fff'; x.strokeRect(2.5, 2.5, cv.width - 5, cv.height - 5); }
        x.beginPath(); x.arc(20, 20, 13, 0, 7);
        if (on) { x.fillStyle = '#fff'; x.fill(); x.fillStyle = '#7a1f2b'; x.font = 'bold 18px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('✓', 20, 21); }
        else { x.lineWidth = 2; x.strokeStyle = 'rgba(255,255,255,.9)'; x.stroke(); }
      }
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
  $('#view').innerHTML = `
    <h2>เรนเดอร์เป็น MP4</h2>
    <p class="hint">ขนาด ${s.name} (${s.w}×${s.h}) · ${imgs.length} รูป · ยาวประมาณ ${totalDuration(imgs.length).toFixed(1)} วินาที${skipped ? ` · คลิปสั้น ${skipped} ไฟล์ยังไม่ถูกใช้ (รอบหน้า)` : ''}</p>
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
      const blob = await renderMp4(imgs.map(i => i.blob), s.w, s.h, (p, msg) => { $('#prog').textContent = `${msg} ${Math.round(p * 100)}%`; }, luts);
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
