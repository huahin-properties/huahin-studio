// ===== Huahin Studio — แอปหลัก =====
const SIZES = [
  { id: '4:5',  name: 'Facebook 4:5',  note: '1080×1350 (หลัก)', w: 1080, h: 1350 },
  { id: '9:16', name: 'แนวตั้ง 9:16',   note: '1080×1920',        w: 1080, h: 1920 },
  { id: '1:1',  name: 'จัตุรัส 1:1',     note: '1080×1080',        w: 1080, h: 1080 },
  { id: '16:9', name: 'แนวนอน 16:9',    note: '1920×1080',        w: 1920, h: 1080 },
];
const ROOMS = ['หน้าบ้าน/ภายนอก','สระว่ายน้ำ','ห้องนั่งเล่น','ครัว','ห้องนอนใหญ่','ห้องนอน','ห้องน้ำ','สวน/ระเบียง','วิวรอบๆ','อื่นๆ'];
const STEPS = ['1 ขนาด','2 รูป/คลิป','3 สี','4 สคริปต์','5 เสียง','6 มาสคอต','7 เรนเดอร์'];

const DEFAULT_TITLE = 'สวัสดีครับ ยินดีต้อนรับสู่ Huahin Properties วันนี้ผมพาทุกท่านมาชมบ้านหลังสวยที่หัวหิน';
const DEFAULT_CLOSE = 'สนใจบ้านหลังนี้ ติดต่อ Huahin Properties ได้เลยครับ [ใส่เบอร์โทรและ LINE ตรงนี้]';
const state = { step: 0, size: '4:5', items: [], color: { ...COLOR_DEFAULT }, script: { title: DEFAULT_TITLE, close: DEFAULT_CLOSE, rooms: {} } };
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
const save = () => DB.set('project', { size: state.size, color: state.color, script: state.script, items: state.items.map(({ id, blob, type, room, name }) => ({ id, blob, type, room, name })) });
async function load() {
  const p = await DB.get('project');
  if (p) { state.size = p.size; state.color = { ...COLOR_DEFAULT, ...(p.color || {}) }; state.script = { title: DEFAULT_TITLE, close: DEFAULT_CLOSE, rooms: {}, ...(p.script || {}) }; state.items = p.items; nextId = Math.max(0, ...p.items.map(i => i.id)) + 1; }
}

const $ = s => document.querySelector(s);
async function addFiles(files) {
  for (const f of files) {
    const type = f.type.startsWith('video') ? 'video' : 'image';
    state.items.push({ id: nextId++, blob: f, type, room: ROOMS[0], name: f.name });
  }
  await save();
}
let selMode = false; const picked = new Set();
let selExtra = '', selPre = '';
function selBarHtml() {
  return selMode
    ? `<button class="ib wide" data-sa="all">ทั้งหมด</button><button class="ib wide" data-sa="off">ยกเลิก</button><button class="ib wide danger" data-sa="del" ${picked.size ? '' : 'disabled'}>🗑️ ลบ (${picked.size})</button>`
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

function viewMedia() {
  selExtra = ''; selPre = '';
  const list = state.items.map((it, i) => `
    <div class="item${selMode && picked.has(it.id) ? ' picked' : ''}" data-id="${it.id}">
      ${selMode ? `<input type="checkbox" class="ck" ${picked.has(it.id) ? 'checked' : ''}>` : ''}
      ${it.type === 'video' ? `<video src="${urlOf(it)}#t=0.1" muted playsinline></video>` : `<img src="${urlOf(it)}" alt="">`}
      <div class="col">
        <span class="badge">☰ ${i + 1}. ${it.type === 'video' ? '🎬 คลิปสั้น' : '🖼️ รูป'} · กดค้างแล้วลาก</span>
        <select data-act="room">${ROOMS.map(r => `<option ${r === it.room ? 'selected' : ''}>${r}</option>`).join('')}</select>
        <div class="row"><button data-act="del">🗑️ ลบ</button></div>
      </div>
    </div>`).join('');
  $('#view').innerHTML = `
    <h2>ใส่รูปบ้านและคลิปสั้น</h2>
    <p class="hint">เลือกได้ทีละหลายไฟล์ แล้วติดแท็กห้อง · กดค้างที่การ์ดแล้วลากเพื่อสลับลำดับ</p>
    <input type="file" id="file" accept="image/*,video/*" multiple hidden>
    <button class="btn" id="add">+ เพิ่มรูป / คลิป</button>
    ${state.items.length ? '<div id="selbar" class="tools"></div>' : ''}
    <div class="items${selMode ? ' selmode' : ''}">${list || '<div class="soon">ยังไม่มีรูป กดปุ่มด้านบนเพื่อเพิ่ม</div>'}</div>
    ${state.items.some(i => i.type === 'image') ? `<h2>พรีวิวสไตล์ v3</h2><canvas id="pv"></canvas><button class="btn alt" id="play">▶ เล่นพรีวิวอีกครั้ง</button>` : ''}
    ${state.items.length ? '<button class="btn" id="toNext">ถัดไป: ขั้น 3 ปรับสี →</button>' : ''}
    `;
  $('#add').onclick = () => $('#file').click();
  $('#file').onchange = async e => { await addFiles(e.target.files); viewMedia(); };
  $('.items').onchange = e => { if (e.target.dataset.act === 'room') { const it = state.items.find(x => x.id == e.target.closest('.item').dataset.id); it.room = e.target.value; save(); } };
  if ($('#selbar')) bindSelBar($('#selbar'), () => state.items.map(x => x.id), () => viewMedia());
  $('.items').onclick = async e => {
    if (selMode) {
      const el = e.target.closest('.item');
      if (el) {
        const id = +el.dataset.id; picked.has(id) ? picked.delete(id) : picked.add(id);
        el.classList.toggle('picked', picked.has(id)); el.querySelector('.ck').checked = picked.has(id);
        $('#selbar').innerHTML = selBarHtml();
      }
      return;
    }
    const act = e.target.dataset.act, el = e.target.closest('.item');
    if (!el || act === 'room') return;
    const i = state.items.findIndex(x => x.id == el.dataset.id);
    if (act === 'del') { if (!confirm('ลบรูปนี้ใช่ไหม?')) return; removeItem(state.items[i].id); }
    await save(); viewMedia();
  };
  if ($('#toNext')) $('#toNext').onclick = () => go(2);
  enableDrag($('.items'), { itemSel: '.item', grid: false, onEnd: async els => {
    const order = els.map(c => +c.dataset.id);
    state.items = order.map(id => state.items.find(x => x.id === id));
    await save(); viewMedia();
  } });
  if ($('#pv')) { startPreview(); $('#play').onclick = startPreview; }
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
  const rooms = []; state.items.forEach(it => { if (!rooms.includes(it.room)) rooms.push(it.room); });
  const segs = [{ no: 1, key: 'title', label: 'ไตเติล', text: state.script.title }];
  rooms.forEach((r, i) => segs.push({ no: i + 2, key: 'room:' + r, label: r, room: r, text: state.script.rooms[r] || '' }));
  segs.push({ no: segs.length + 1, key: 'close', label: 'หน้าปิด (ข้อมูลติดต่อ)', text: state.script.close });
  return segs;
}
async function copyText(t) {
  try { await navigator.clipboard.writeText(t); return true; } catch (_) {}
  const ta = document.createElement('textarea'); ta.value = t; document.body.appendChild(ta); ta.select();
  let ok = false; try { ok = document.execCommand('copy'); } catch (_) {} ta.remove(); return ok;
}
function viewScript() {
  const segs = scriptSegments(), no2 = n => String(n).padStart(2, '0');
  const setText = (seg, v) => { if (seg.key === 'title') state.script.title = v; else if (seg.key === 'close') state.script.close = v; else state.script.rooms[seg.room] = v; };
  const total = () => scriptSegments().reduce((a, g) => a + secOf(g.text), 0);
  const card = g => {
    const its = g.room ? state.items.filter(i => i.room === g.room) : [];
    return `<div class="seg" data-key="${g.key}">
      <div class="seg-h"><b>${no2(g.no)} · ${g.label}</b><span class="badge" data-t="${g.key}">~${secOf(g.text)} วิ</span><button class="ib sm" data-cp="${g.key}" title="คัดลอกท่อนนี้" aria-label="คัดลอกท่อนนี้">📋</button></div>
      ${its.length ? `<div class="mini">${its.slice(0, 4).map(i => i.type === 'image' ? `<img src="${urlOf(i)}" alt="">` : '<span>🎬</span>').join('')}<small>${its.length} รูป/คลิป</small></div>` : ''}
      <textarea rows="3" data-k="${g.key}" placeholder="พิมพ์เรื่องเล่าของห้องนี้...">${g.text.replace(/</g, '&lt;')}</textarea>
    </div>`;
  };
  $('#view').innerHTML = `
    <h2>4 สคริปต์: เรื่องราว</h2>
    <div class="tools"><button class="ib" data-all title="คัดลอกสคริปต์ทั้งหมดไปวางใน Google AI Studio" aria-label="คัดลอกทั้งหมด">📋 ทั้งหมด</button></div>
    <p class="hint">เวลารวมโดยประมาณ <b id="tot">${mmss(total())}</b> (เป้าหมายประมาณ 3:00) · เลขท่อนตรงกับชื่อไฟล์เสียง 01, 02, ...</p>
    ${state.items.length ? '' : '<div class="soon">ยังไม่มีรูป กลับไปขั้น 2 เพื่อใส่รูปและติดแท็กห้องก่อน</div>'}
    <div id="segs">${segs.map(card).join('')}</div>
    <p class="hint" id="warn"></p>
    <button class="btn" id="nx">ถัดไป: 5 เสียง →</button>
    <button class="btn alt" id="bk">← ย้อนกลับ</button>`;
  const warn = () => {
    const all = scriptSegments(), msgs = [];
    const empty = all.filter(g => !g.text.trim()).map(g => no2(g.no));
    if (empty.length) msgs.push('ท่อนที่ยังว่าง: ' + empty.join(', '));
    if (all.some(g => /\[[^\]]*\]/.test(g.text))) msgs.push('⚠️ ยังมีข้อความในวงเล็บ [ ] ให้แก้เป็นข้อมูลจริงก่อนทำเสียงพากย์');
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
    $('#cap').textContent = `รูปที่ ${sel + 1} จาก ${imgs.length} · ห้อง: ${imgs[sel].room} · ปรับสี: ${c.auto ? 'อัตโนมัติ' : 'ปิด'}${(c.bright || c.contrast || c.warm) ? ' + ตั้งเอง' : ''}`;
    put($('#cb'), smalls[sel], null, 240); put($('#ca'), smalls[sel], luts && luts[sel], 240);
    document.querySelectorAll('#th canvas').forEach(cv => {
      const i = +cv.dataset.i; put(cv, smalls[i], luts && luts[i], 110); cv.classList.toggle('on', !selMode && i === sel);
      if (selMode) {
        const x = cv.getContext('2d'), on = picked.has(imgs[i].id);
        if (on) { x.fillStyle = 'rgba(122,31,43,.45)'; x.fillRect(0, 0, cv.width, cv.height); }
        x.beginPath(); x.arc(18, 18, 12, 0, 7); x.fillStyle = on ? '#fff' : 'rgba(0,0,0,.35)'; x.fill(); x.lineWidth = 2; x.strokeStyle = '#fff'; x.stroke();
        if (on) { x.fillStyle = '#7a1f2b'; x.font = 'bold 16px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('✓', 18, 19); }
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
  const imgs = state.items.filter(i => i.type === 'image'), s = sizeInfo();
  const skipped = state.items.length - imgs.length;
  $('#view').innerHTML = `
    <h2>เรนเดอร์เป็น MP4</h2>
    <p class="hint">ขนาด ${s.name} (${s.w}×${s.h}) · ${imgs.length} รูป · ยาวประมาณ ${totalDuration(imgs.length).toFixed(1)} วินาที${skipped ? ` · คลิปสั้น ${skipped} ไฟล์ยังไม่ถูกใช้ (รอบหน้า)` : ''}</p>
    <p class="hint">ปรับสี: ${isNeutral(state.color) ? 'ปิด' : (state.color.auto ? 'อัตโนมัติ' : 'ตั้งเอง')}</p>
    <p class="hint">ระหว่างเรนเดอร์ ให้เปิดหน้าจอค้างไว้ อย่าสลับแอป</p>
    <button class="btn" id="go" ${imgs.length ? '' : 'disabled'}>🎬 เริ่มเรนเดอร์</button>
    <div id="prog" class="hint"></div><div id="out"></div>
    <button class="btn alt" id="bk">← ย้อนกลับ</button>`;
  $('#bk').onclick = () => go(5);
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
    item = el; item.classList.add('dragging');
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
    clearInterval(scroller);
    document.removeEventListener('pointermove', move); document.removeEventListener('pointerup', end); document.removeEventListener('pointercancel', end);
    const els = [...box.children]; const moved = item; item = null;
    await onEnd(els, moved);
  };
  box.addEventListener('pointerdown', down);
  box.addEventListener('contextmenu', e => e.preventDefault());
  document.addEventListener('touchmove', e => { if (item) e.preventDefault(); }, { passive: false });
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
  if (state.step === 0) viewSize(); else if (state.step === 6) viewRender(); else if (state.step === 1) viewMedia(); else if (state.step === 2) viewColor(); else if (state.step === 3) viewScript(); else viewComing();
}

(async () => {
  await load(); render();
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js');
})();
