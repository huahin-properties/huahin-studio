// ===== Huahin Studio — แอปหลัก =====
const SIZES = [
  { id: '4:5',  name: 'Facebook 4:5',  note: '1080×1350 (หลัก)', w: 1080, h: 1350 },
  { id: '9:16', name: 'แนวตั้ง 9:16',   note: '1080×1920',        w: 1080, h: 1920 },
  { id: '1:1',  name: 'จัตุรัส 1:1',     note: '1080×1080',        w: 1080, h: 1080 },
  { id: '16:9', name: 'แนวนอน 16:9',    note: '1920×1080',        w: 1920, h: 1080 },
];
const ROOMS = ['หน้าบ้าน/ภายนอก','สระว่ายน้ำ','ห้องนั่งเล่น','ครัว','ห้องนอนใหญ่','ห้องนอน','ห้องน้ำ','สวน/ระเบียง','วิวรอบๆ','อื่นๆ'];
const STEPS = ['1 ขนาด','2 รูป/คลิป','3 สี','4 สคริปต์','5 เสียง','6 มาสคอต','7 เรนเดอร์'];

const state = { step: 0, size: '4:5', items: [], color: { ...COLOR_DEFAULT } };
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
const save = () => DB.set('project', { size: state.size, color: state.color, items: state.items.map(({ id, blob, type, room, name }) => ({ id, blob, type, room, name })) });
async function load() {
  const p = await DB.get('project');
  if (p) { state.size = p.size; state.color = { ...COLOR_DEFAULT, ...(p.color || {}) }; state.items = p.items; nextId = Math.max(0, ...p.items.map(i => i.id)) + 1; }
}

const $ = s => document.querySelector(s);
async function addFiles(files) {
  for (const f of files) {
    const type = f.type.startsWith('video') ? 'video' : 'image';
    state.items.push({ id: nextId++, blob: f, type, room: ROOMS[0], name: f.name });
  }
  await save();
}
function removeItem(id) {
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
  const list = state.items.map((it, i) => `
    <div class="item" data-id="${it.id}">
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
    <div class="items">${list || '<div class="soon">ยังไม่มีรูป กดปุ่มด้านบนเพื่อเพิ่ม</div>'}</div>
    ${state.items.some(i => i.type === 'image') ? `<h2>พรีวิวสไตล์ v3</h2><canvas id="pv"></canvas><button class="btn alt" id="play">▶ เล่นพรีวิวอีกครั้ง</button>` : ''}
    ${state.items.length ? '<button class="btn" id="toNext">ถัดไป: ขั้น 3 ปรับสี →</button>' : ''}
    `;
  $('#add').onclick = () => $('#file').click();
  $('#file').onchange = async e => { await addFiles(e.target.files); viewMedia(); };
  $('.items').onchange = e => { if (e.target.dataset.act === 'room') { const it = state.items.find(x => x.id == e.target.closest('.item').dataset.id); it.room = e.target.value; save(); } };
  $('.items').onclick = async e => {
    const act = e.target.dataset.act, el = e.target.closest('.item');
    if (!el || act === 'room') return;
    const i = state.items.findIndex(x => x.id == el.dataset.id);
    if (act === 'del') { if (!confirm('ลบรูปนี้ใช่ไหม?')) return; removeItem(state.items[i].id); }
    await save(); viewMedia();
  };
  if ($('#toNext')) $('#toNext').onclick = () => go(2);
  enableDrag($('.items'));
  if ($('#pv')) { startPreview(); $('#play').onclick = startPreview; }
}

function go(n) { state.step = n; render(); window.scrollTo(0, 0); }

const COMING = {
  3: ['สคริปต์เรื่องราว', 'พิมพ์เรื่องราวเล่าตามแต่ละห้อง'],
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

// ---- ขั้น 3: ปรับสี ----
const smallCache = new Map(), statCache = new Map();
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
  const c = state.color; let sel = 0;
  $('#view').innerHTML = `<h2>3 สี: ปรับสีให้เข้ากัน</h2><p class="hint">กำลังอ่านรูป...</p>`;
  const smalls = [];
  for (const it of imgs) { smalls.push(await getSmall(it)); if (!statCache.has(it.id)) statCache.set(it.id, imageStats(smalls.at(-1))); }
  const stats = imgs.map(i => statCache.get(i.id));
  const slider = (k, label, lo, hi) => `<label class="sl"><span>${label} <b id="v_${k}">${c[k]}</b></span><input type="range" data-k="${k}" min="${lo}" max="${hi}" step="1" value="${c[k]}"></label>`;
  $('#view').innerHTML = `
    <h2>3 สี: ปรับสีให้เข้ากัน</h2>
    <p class="hint">ปรับแค่ความสว่าง คอนทราสต์ และ white balance แบบนุ่มนวลให้ทุกภาพดูเป็นโทนเดียวกัน ภาพที่เห็นตรงกับตอนเรนเดอร์</p>
    <label class="sw"><input type="checkbox" id="auto" ${c.auto ? 'checked' : ''}> ปรับสีให้เข้ากันอัตโนมัติ</label>
    ${slider('bright', 'ความสว่าง', -30, 30)}${slider('contrast', 'คอนทราสต์', -30, 30)}${slider('warm', 'โทนสี (เย็น ← → อุ่น)', -30, 30)}
    <button class="btn alt" id="reset">รีเซ็ตเป็นค่าเริ่มต้น</button>
    <div class="ba"><div><canvas id="cb"></canvas><small>ก่อน</small></div><div><canvas id="ca"></canvas><small>หลัง</small></div></div>
    <p class="hint" id="cap"></p>
    <input type="file" id="file3" accept="image/*,video/*" multiple hidden>
    <div class="row2"><button class="btn alt" id="del3">🗑️ ลบรูปนี้</button><button class="btn alt" id="add3">+ เพิ่มรูป</button></div>
    <p class="hint">แตะรูปเล็กเพื่อเลือกรูปที่จะดูเทียบ ก่อน/หลัง</p>
    <div class="thumbs" id="th">${imgs.map((_, i) => `<canvas data-i="${i}"></canvas>`).join('')}</div>
    <button class="btn" id="nx">ถัดไป: 4 สคริปต์ →</button>
    <button class="btn alt" id="bk">← ย้อนกลับ</button>`;
  const draw = () => {
    const luts = isNeutral(c) ? null : makeLuts(stats, c);
    const put = (cv, bmp, lut, w) => { const h = Math.round(w * bmp.height / bmp.width); cv.width = w; cv.height = h; cv.getContext('2d').drawImage(gradeToCanvas(bmp, lut, w, h), 0, 0); };
    $('#cap').textContent = `รูปที่ ${sel + 1} จาก ${imgs.length} · ห้อง: ${imgs[sel].room}`;
    put($('#cb'), smalls[sel], null, 240); put($('#ca'), smalls[sel], luts && luts[sel], 240);
    document.querySelectorAll('#th canvas').forEach(cv => { const i = +cv.dataset.i; put(cv, smalls[i], luts && luts[i], 110); cv.classList.toggle('on', i === sel); });
  };
  draw();
  let raf = 0; const redraw = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(draw); };
  $('#auto').onchange = e => { c.auto = e.target.checked; save(); redraw(); };
  document.querySelectorAll('input[type=range]').forEach(r => r.oninput = () => { c[r.dataset.k] = +r.value; $('#v_' + r.dataset.k).textContent = r.value; save(); redraw(); });
  $('#reset').onclick = () => { Object.assign(c, COLOR_DEFAULT); save(); viewColor(); };
  $('#th').onclick = e => { const cv = e.target.closest('canvas'); if (cv) { sel = +cv.dataset.i; redraw(); } };
  $('#del3').onclick = async () => { if (!confirm('ลบรูปที่ ' + (sel + 1) + ' ใช่ไหม?')) return; removeItem(imgs[sel].id); await save(); viewColor(); };
  $('#add3').onclick = () => $('#file3').click();
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

// กดค้างที่การ์ด ~0.35 วินาที แล้วลากขึ้น/ลงเพื่อสลับลำดับ
function enableDrag(box) {
  let timer = null, item = null, grab = 0, lastY = 0, scroller = null;
  const down = e => {
    const el = e.target.closest('.item');
    if (!el || e.target.closest('select,button')) return;
    const x0 = e.clientX, y0 = e.clientY; lastY = y0;
    const cancel = ev => { if (Math.hypot(ev.clientX - x0, ev.clientY - y0) > 10) clear(); };
    const clear = () => { clearTimeout(timer); document.removeEventListener('pointermove', cancel); };
    document.addEventListener('pointermove', cancel);
    timer = setTimeout(() => { clear(); begin(el, e); }, 350);
    const upEarly = () => { clear(); document.removeEventListener('pointerup', upEarly); };
    document.addEventListener('pointerup', upEarly);
  };
  const place = () => {
    item.style.transform = '';
    const natural = item.getBoundingClientRect().top;
    item.style.transform = `translateY(${lastY - grab - natural}px)`;
  };
  const begin = (el, e) => {
    item = el; item.classList.add('dragging');
    grab = e.clientY - item.getBoundingClientRect().top; lastY = e.clientY;
    if (navigator.vibrate) navigator.vibrate(30);
    try { item.setPointerCapture(e.pointerId); } catch (_) {}
    item.addEventListener('pointermove', move); item.addEventListener('pointerup', end); item.addEventListener('pointercancel', end);
    scroller = setInterval(() => { if (lastY < 130) scrollBy(0, -12); else if (lastY > innerHeight - 130) scrollBy(0, 12); place(); }, 16);
  };
  const move = e => {
    lastY = e.clientY;
    const others = [...box.children].filter(c => c !== item);
    const after = others.find(c => { const r = c.getBoundingClientRect(); return lastY < r.top + r.height / 2; });
    if (after) { if (item.nextSibling !== after) box.insertBefore(item, after); } else if (box.lastChild !== item) box.appendChild(item);
    place();
  };
  const end = async () => {
    clearInterval(scroller);
    const order = [...box.children].map(c => +c.dataset.id);
    state.items = order.map(id => state.items.find(x => x.id === id));
    item = null; await save(); viewMedia();
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
  if (state.step === 0) viewSize(); else if (state.step === 6) viewRender(); else if (state.step === 1) viewMedia(); else if (state.step === 2) viewColor(); else viewComing();
}

(async () => {
  await load(); render();
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js');
})();
