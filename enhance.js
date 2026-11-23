// ===== แต่งภาพอัตโนมัติให้ดูสว่างแบบมืออาชีพ + ลบสิ่งรบกวน (สายไฟ ฯลฯ) ด้วยพู่กัน =====
// proEnhance: ปรับโทนเหมือนแต่งภาพจากกล้องโปร: ขยายช่วงโทน, เปิดเงามืด, กดไฮไลต์ไม่ให้จ้า, เพิ่มความคมชัดเฉพาะจุด (clarity), สีสดแบบ vibrance
// ไม่ได้สร้างภาพใหม่ด้วย AI: แก้เฉพาะแสง/สี/คอนทราสต์ของภาพเดิม (ภาพที่มืดหรือเบลอมากแก้ได้จำกัด)
const ENHANCE_LEVELS = { off: null, soft: { stretch: 0.6, shadow: 0.30, high: 0.22, clarity: 0.18, vib: 0.14, gain: 1.03 }, pro: { stretch: 0.85, shadow: 0.50, high: 0.35, clarity: 0.32, vib: 0.24, gain: 1.07 }, strong: { stretch: 1, shadow: 0.70, high: 0.5, clarity: 0.48, vib: 0.36, gain: 1.11 } };
const ENHANCE_LABELS = { off: 'ปิด', soft: 'เบา', pro: 'มืออาชีพ (แนะนำ)', strong: 'แรง' };
function proEnhance(cv, levelName) {
  const L = ENHANCE_LEVELS[levelName]; if (!L) return cv;
  const w = cv.width, h = cv.height, x = cv.getContext('2d', { willReadFrequently: true }), img = x.getImageData(0, 0, w, h), d = img.data, n = w * h;
  // 1) ช่วงโทน: หาจุดดำ/ขาวจากเปอร์เซ็นไทล์ 0.5% / 99.5% ของความสว่าง
  const hist = new Uint32Array(256);
  for (let i = 0; i < d.length; i += 16) hist[(0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]) | 0]++;
  const tot = hist.reduce((a, b) => a + b, 0); let lo = 0, hi = 255, acc = 0;
  for (let v = 0; v < 256; v++) { acc += hist[v]; if (acc >= tot * 0.005) { lo = v; break; } }
  acc = 0; for (let v = 255; v >= 0; v--) { acc += hist[v]; if (acc >= tot * 0.005) { hi = v; break; } }
  lo = Math.min(lo, 40) * L.stretch; hi = 255 - (255 - Math.max(hi, 215)) * L.stretch;
  const span = Math.max(60, hi - lo);
  // 2) เส้นโค้งโทน (LUT) รวม: stretch + เปิดเงามืด + กดไฮไลต์ + gain
  const tone = new Float32Array(256);
  for (let v = 0; v < 256; v++) {
    let t = Math.min(1, Math.max(0, (v - lo) / span));
    t = Math.min(1, t * L.gain);
    t += L.shadow * 1.6 * t * (1 - t) * (1 - t); // เปิดเงามืด
    t -= L.high * 1.2 * t * t * t * (1 - t); // ไฮไลต์ไม่จ้า
    // S-curve เบา ๆ ให้มีมิติ
    t = t + (t - 0.5) * (1 - Math.abs(2 * t - 1)) * 0.18 * L.stretch;
    tone[v] = Math.min(1, Math.max(0, t)) * 255;
  }
  // 3) ความสว่างพื้นถิ่น (ภาพเบลอใหญ่) สำหรับ clarity: ย่อภาพเล็กลงแล้วขยายกลับ ให้ผลเหมือนเบลอรัศมีใหญ่
  const sw = Math.max(8, Math.round(w / 24)), sh2 = Math.max(8, Math.round(h / 24));
  const sm = document.createElement('canvas'); sm.width = sw; sm.height = sh2; const sx = sm.getContext('2d', { willReadFrequently: true }); sx.imageSmoothingQuality = 'high'; sx.drawImage(cv, 0, 0, sw, sh2);
  const big = document.createElement('canvas'); big.width = w; big.height = h; const bx = big.getContext('2d', { willReadFrequently: true }); bx.imageSmoothingQuality = 'high'; bx.drawImage(sm, 0, 0, w, h);
  const bd = bx.getImageData(0, 0, w, h).data;
  for (let i = 0; i < d.length; i += 4) {
    let r = d[i], g = d[i + 1], b = d[i + 2];
    const y0 = 0.299 * r + 0.587 * g + 0.114 * b, y1 = tone[y0 | 0] + 0, ratio = y0 > 1 ? y1 / y0 : 1;
    r *= ratio; g *= ratio; b *= ratio; // คงสีเดิม ปรับเฉพาะความสว่าง
    const yb = 0.299 * bd[i] + 0.587 * bd[i + 1] + 0.114 * bd[i + 2], yBlurT = tone[yb | 0], y = 0.299 * r + 0.587 * g + 0.114 * b;
    const cl = (y - yBlurT) * L.clarity * (1 - Math.abs(y / 255 - 0.5) * 0.9); // เพิ่มคอนทราสต์เฉพาะจุด ลดที่ขอบมืด/ขาว
    r += cl; g += cl; b += cl;
    // vibrance: เพิ่มความสดให้สีที่ยังจางมากกว่าสีที่จัดอยู่แล้ว
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), sat = mx > 1 ? (mx - mn) / mx : 0, k = 1 + L.vib * (1 - sat), yy = 0.299 * r + 0.587 * g + 0.114 * b;
    r = yy + (r - yy) * k; g = yy + (g - yy) * k; b = yy + (b - yy) * k;
    d[i] = r < 0 ? 0 : r > 255 ? 255 : r; d[i + 1] = g < 0 ? 0 : g > 255 ? 255 : g; d[i + 2] = b < 0 ? 0 : b > 255 ? 255 : b;
  }
  x.putImageData(img, 0, 0); return cv;
}

// ---- ลบสิ่งรบกวน (สายไฟ ป้าย ฯลฯ): ผู้ใช้ระบายทับด้วยนิ้ว แอปเติมพื้นที่นั้นจากพิกเซลรอบๆ (ไม่ใช่ AI สร้างภาพ) ----
// ทำงานดีกับเส้นบางบนท้องฟ้า/ผนังเรียบ · พื้นที่ใหญ่หรือลายซับซ้อนจะเห็นรอยเบลอ
function inpaintCanvas(cv, maskData, w, h) {
  const x = cv.getContext('2d', { willReadFrequently: true }), img = x.getImageData(0, 0, w, h), d = img.data;
  const known = new Uint8Array(w * h); let todo = [];
  for (let p = 0; p < w * h; p++) { if (maskData[p]) todo.push(p); else known[p] = 1; }
  const R = 4; let guard = 0;
  while (todo.length && guard++ < 80) {
    const fills = [], next = [];
    for (const p of todo) {
      const px = p % w, py = (p / w) | 0; let sr = 0, sg = 0, sb = 0, sw = 0;
      for (let dy = -R; dy <= R; dy++) { const yy = py + dy; if (yy < 0 || yy >= h) continue; for (let dx = -R; dx <= R; dx++) { const xx = px + dx; if (xx < 0 || xx >= w) continue; const q = yy * w + xx; if (!known[q]) continue; const wt = 1 / (1 + dx * dx + dy * dy); sr += d[q * 4] * wt; sg += d[q * 4 + 1] * wt; sb += d[q * 4 + 2] * wt; sw += wt; } }
      if (sw > 0) fills.push([p, sr / sw, sg / sw, sb / sw]); else next.push(p);
    }
    if (!fills.length) break;
    for (const [p, r, g, b] of fills) { d[p * 4] = r; d[p * 4 + 1] = g; d[p * 4 + 2] = b; known[p] = 1; }
    todo = next;
  }
  // เติมเกรนเล็กน้อยให้กลืนกับภาพรอบๆ ไม่ให้เป็นปื้นเรียบ
  for (let p = 0; p < w * h; p++) if (maskData[p]) { const nz = (Math.random() - 0.5) * 3.2; d[p * 4] += nz; d[p * 4 + 1] += nz; d[p * 4 + 2] += nz; }
  x.putImageData(img, 0, 0); return cv;
}

// หน้าต่างลบสิ่งรบกวน: ระบายสีแดงทับสายไฟ/สิ่งที่ไม่ต้องการ → กด "ลบส่วนที่ระบาย" → บันทึกแทนรูปเดิม (เก็บรูปเดิมไว้กู้คืนได้)
function openRetouch(item, done) {
  document.querySelector('#retSheet')?.remove();
  const d = document.createElement('div'); d.className = 'sheet tall'; d.id = 'retSheet';
  d.innerHTML = `<div class="sh-head"><b>🧹 ลบสายไฟ / สิ่งรบกวน</b><button class="ib" data-a="x" aria-label="ปิด">✕</button></div>
    <p class="hint">ใช้นิ้วระบายสีแดง <b>ทับสายไฟหรือสิ่งที่ไม่ต้องการ</b> (เส้นบางให้ใช้พู่กันเล็ก ระบายเป็นเส้นตามแนวสาย ไล่ทีละเส้น) แล้วกด "ลบส่วนที่ระบาย" แอปเติมพื้นที่นั้นจากสีรอบๆ · <b>ทำงานดีกับเส้นบางบนท้องฟ้า/ผนังเรียบ</b> ถ้าอยู่บนต้นไม้หรือลายซับซ้อนอาจเห็นเป็นรอยเบลอ ลองแล้วไม่ถูกใจกด "↩ ย้อนกลับ"</p>
    <div id="retWrap" style="position:relative;touch-action:none;background:#000;border-radius:10px;overflow:hidden"><canvas id="retImg" style="width:100%;display:block"></canvas><canvas id="retMask" style="position:absolute;left:0;top:0;width:100%;height:100%"></canvas></div>
    <label class="sl"><span>ขนาดพู่กัน <b id="brV">14</b></span><input type="range" id="brush" min="4" max="48" value="14"></label>
    <div class="tools"><button class="ib wide" id="retGo">🧹 ลบส่วนที่ระบาย</button><button class="ib wide" id="retClr">ล้างที่ระบาย</button></div>
    <div class="tools"><button class="ib wide" id="retUndo" disabled>↩ ย้อนกลับ 1 ครั้ง</button><button class="ib wide" id="retOrig" ${item.orig ? '' : 'disabled'}>⟲ กลับเป็นภาพเดิมทั้งหมด</button></div>
    <button class="btn" id="retSave">✓ บันทึกรูปนี้</button><button class="btn alt" data-a="x">ปิดโดยไม่บันทึก</button>`;
  document.body.appendChild(d);
  const img = d.querySelector('#retImg'), mk = d.querySelector('#retMask'), ix = img.getContext('2d', { willReadFrequently: true });
  let work = null, hist = [], dirty = false, mask = null;
  const load = async blob => { const b = await createImageBitmap(blob), k = Math.min(1, 2000 / Math.max(b.width, b.height)); img.width = Math.round(b.width * k); img.height = Math.round(b.height * k); ix.drawImage(b, 0, 0, img.width, img.height); b.close && b.close(); mk.width = img.width; mk.height = img.height; mask = mk.getContext('2d'); mask.clearRect(0, 0, mk.width, mk.height); };
  let drawing = false, last = null;
  const pos = e => { const r = mk.getBoundingClientRect(); return { x: (e.clientX - r.left) * mk.width / r.width, y: (e.clientY - r.top) * mk.height / r.height }; };
  const size = () => +d.querySelector('#brush').value * mk.width / 420;
  mk.onpointerdown = e => { drawing = true; last = pos(e); mk.setPointerCapture(e.pointerId); stroke(last, last); };
  mk.onpointermove = e => { if (!drawing) return; const p = pos(e); stroke(last, p); last = p; };
  mk.onpointerup = mk.onpointercancel = () => { drawing = false; };
  const stroke = (a, b) => { mask.strokeStyle = 'rgba(255,40,40,.65)'; mask.lineCap = mask.lineJoin = 'round'; mask.lineWidth = size(); mask.beginPath(); mask.moveTo(a.x, a.y); mask.lineTo(b.x, b.y); mask.stroke(); };
  d.querySelector('#brush').oninput = e => { d.querySelector('#brV').textContent = e.target.value; };
  d.querySelector('#retClr').onclick = () => mask.clearRect(0, 0, mk.width, mk.height);
  d.querySelector('#retGo').onclick = () => {
    const w = img.width, h = img.height, md = mask.getImageData(0, 0, w, h).data, m = new Uint8Array(w * h); let any = 0;
    for (let p = 0; p < w * h; p++) if (md[p * 4 + 3] > 20) { m[p] = 1; any++; }
    if (!any) { alert('ยังไม่ได้ระบายทับส่วนที่ต้องการลบ'); return; }
    // ขยายขอบที่ระบาย 2 พิกเซลให้คลุมขอบเส้นที่ซีด
    const m2 = m.slice(); for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) { const p = y * w + x; if (!m[p] && (m[p - 1] || m[p + 1] || m[p - w] || m[p + w])) m2[p] = 1; }
    hist.push(ix.getImageData(0, 0, w, h)); d.querySelector('#retUndo').disabled = false;
    d.querySelector('#retGo').textContent = 'กำลังลบ...'; setTimeout(() => { inpaintCanvas(img, m2, w, h); mask.clearRect(0, 0, mk.width, mk.height); dirty = true; d.querySelector('#retGo').textContent = '🧹 ลบส่วนที่ระบาย'; }, 30);
  };
  d.querySelector('#retUndo').onclick = () => { const s = hist.pop(); if (s) ix.putImageData(s, 0, 0); d.querySelector('#retUndo').disabled = !hist.length; dirty = hist.length > 0 || dirty; };
  d.querySelector('#retOrig').onclick = async () => { if (!confirm('กลับเป็นภาพเดิมก่อนแก้ทั้งหมด?')) return; item.blob = item.orig; item.orig = null; dropItemCaches(item.id); if (item.cat) await saveLib(); else await save(); d.remove(); if (done) done(); };
  d.querySelector('#retSave').onclick = async () => {
    if (!dirty) { d.remove(); return; }
    const blob = await new Promise(r => img.toBlob(r, 'image/jpeg', 0.93));
    if (!item.orig) item.orig = item.blob; item.blob = blob; dropItemCaches(item.id);
    if (item.cat) await saveLib(); else await save(); if (typeof metaNow === 'function') metaNow(); d.remove(); if (done) done();
  };
  d.onclick = e => { if (e.target.closest('[data-a=x]')) d.remove(); };
  load(item.blob);
}
function dropItemCaches(id) { try { if (urlCache.has(id)) { URL.revokeObjectURL(urlCache.get(id)); urlCache.delete(id); } if (smallCache.has(id)) { smallCache.get(id).close && smallCache.get(id).close(); smallCache.delete(id); } statCache.delete(id); } catch (e) {} }
