// ===== Huahin Studio — แอปหลัก =====
const SIZES = [
  { id: '4:5',  name: 'Facebook 4:5',  note: '1080×1350 (หลัก)', w: 1080, h: 1350 },
  { id: '9:16', name: 'แนวตั้ง 9:16',   note: '1080×1920',        w: 1080, h: 1920 },
  { id: '1:1',  name: 'จัตุรัส 1:1',     note: '1080×1080',        w: 1080, h: 1080 },
  { id: '16:9', name: 'แนวนอน 16:9',    note: '1920×1080',        w: 1920, h: 1080 },
];
const ROOMS = ['หน้าบ้าน/ภายนอก','สระว่ายน้ำ','ห้องนั่งเล่น','ครัว','ห้องนอนใหญ่','ห้องนอน','ห้องน้ำ','สวน/ระเบียง','วิวรอบๆ','อื่นๆ'];
const STEPS = ['1 ขนาด','2 รูป/คลิป','3 สี','4 สคริปต์','5 เสียง','6 มาสคอต','7 เรนเดอร์'];

const state = { step: 0, size: '4:5', items: [] };
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
const save = () => DB.set('project', { size: state.size, items: state.items.map(({ id, blob, type, room, name }) => ({ id, blob, type, room, name })) });
async function load() {
  const p = await DB.get('project');
  if (p) { state.size = p.size; state.items = p.items; nextId = Math.max(0, ...p.items.map(i => i.id)) + 1; }
}

const $ = s => document.querySelector(s);
const sizeInfo = () => SIZES.find(s => s.id === state.size);
const urlCache = new Map();
const urlOf = it => { if (!urlCache.has(it.id)) urlCache.set(it.id, URL.createObjectURL(it.blob)); return urlCache.get(it.id); };
let previewTimer = null;

function renderSteps() {
  $('#steps').innerHTML = STEPS.map((s, i) => `<button data-i="${i}" class="${i === state.step ? 'on' : ''}" ${i > 1 ? 'disabled' : ''}>${s}</button>`).join('');
  $('#steps').onclick = e => { const b = e.target.closest('button'); if (b && !b.disabled) { state.step = +b.dataset.i; render(); } };
}

function viewSize() {
  const box = s => { const k = 40 / Math.max(s.w, s.h); return `width:${s.w * k}px;height:${s.h * k}px`; };
  $('#view').innerHTML = `
    <h2>เลือกขนาดคลิป</h2><p class="hint">แนะนำ Facebook 4:5 เพราะแสดงใหญ่สุดบนมือถือ</p>
    <div class="sizes">${SIZES.map(s => `<button class="size ${s.id === state.size ? 'on' : ''}" data-id="${s.id}"><i style="${box(s)}"></i><b>${s.name}</b><span>${s.note}</span></button>`).join('')}</div>
    <button class="btn" id="next">ถัดไป: ใส่รูปบ้าน →</button>`;
  $('.sizes').onclick = e => { const b = e.target.closest('.size'); if (b) { state.size = b.dataset.id; save(); viewSize(); } };
  $('#next').onclick = () => { state.step = 1; render(); };
}

function viewMedia() {
  const list = state.items.map((it, i) => `
    <div class="item" data-id="${it.id}">
      ${it.type === 'video' ? `<video src="${urlOf(it)}#t=0.1" muted playsinline></video>` : `<img src="${urlOf(it)}" alt="">`}
      <div class="col">
        <span class="badge">${i + 1}. ${it.type === 'video' ? '🎬 คลิปสั้น' : '🖼️ รูป'}</span>
        <select data-act="room">${ROOMS.map(r => `<option ${r === it.room ? 'selected' : ''}>${r}</option>`).join('')}</select>
        <div class="row"><button data-act="up">↑</button><button data-act="down">↓</button><button data-act="del">🗑️ ลบ</button></div>
      </div>
    </div>`).join('');
  $('#view').innerHTML = `
    <h2>ใส่รูปบ้านและคลิปสั้น</h2>
    <p class="hint">เลือกได้ทีละหลายไฟล์ แล้วติดแท็กห้อง ใช้ลูกศรสลับลำดับ</p>
    <input type="file" id="file" accept="image/*,video/*" multiple hidden>
    <button class="btn" id="add">+ เพิ่มรูป / คลิป</button>
    <div class="items">${list || '<div class="soon">ยังไม่มีรูป กดปุ่มด้านบนเพื่อเพิ่ม</div>'}</div>
    ${state.items.some(i => i.type === 'image') ? `<h2>พรีวิวสไตล์ v3</h2><canvas id="pv"></canvas><button class="btn alt" id="play">▶ เล่นพรีวิวอีกครั้ง</button>` : ''}
    <p class="hint">ขั้น 3–7 (ปรับสี สคริปต์ เสียง มาสคอต เรนเดอร์) จะทำต่อในรอบถัดไป</p>`;
  $('#add').onclick = () => $('#file').click();
  $('#file').onchange = async e => {
    for (const f of e.target.files) {
      const type = f.type.startsWith('video') ? 'video' : 'image';
      state.items.push({ id: nextId++, blob: f, type, room: ROOMS[0], name: f.name });
    }
    await save(); viewMedia();
  };
  $('.items').onchange = e => { if (e.target.dataset.act === 'room') { const it = state.items.find(x => x.id == e.target.closest('.item').dataset.id); it.room = e.target.value; save(); } };
  $('.items').onclick = async e => {
    const act = e.target.dataset.act, el = e.target.closest('.item');
    if (!el || act === 'room') return;
    const i = state.items.findIndex(x => x.id == el.dataset.id);
    if (act === 'del') { URL.revokeObjectURL(urlCache.get(state.items[i].id)); urlCache.delete(state.items[i].id); state.items.splice(i, 1); }
    if (act === 'up' && i > 0) [state.items[i - 1], state.items[i]] = [state.items[i], state.items[i - 1]];
    if (act === 'down' && i < state.items.length - 1) [state.items[i + 1], state.items[i]] = [state.items[i], state.items[i + 1]];
    await save(); viewMedia();
  };
  if ($('#pv')) { startPreview(); $('#play').onclick = startPreview; }
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
  if (state.step === 0) viewSize(); else viewMedia();
}

(async () => {
  await load(); render();
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js');
})();
