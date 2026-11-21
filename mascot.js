// มาสคอตพูดได้: วาดท่าจากภาพสติกเกอร์ แล้วทับปาก/ตาด้วยภาพวาดที่ขยับตามเสียงและกะพริบตา
// หัวของมาสคอตทุกท่าเป็นแบบเดียวกัน จึงใช้ตำแหน่งหัวของแต่ละท่า (x0, y0, เส้นผ่านศูนย์กลาง W) คำนวณตำแหน่งปากและตา
const POSE_HEAD = {"celebrate":[65,10,437],"cheers":[112,9,441],"cleaning":[10,10,440],"dance":[121,10,432],"furnished":[117,10,440],"great":[10,10,440],"greeting":[9,9,441],"handover":[41,10,439],"happy":[59,10,431],"hello":[81,10,432],"idea":[9,10,440],"love":[10,10,431],"newhome":[9,61,402],"ok":[10,10,433],"ready":[76,10,441],"thanks":[10,10,440],"thisway":[10,10,434],"wave":[9,10,441],"welcome":[105,61,401],"yourhome":[10,10,433]};
// ท่าที่ใช้ได้ (ตัดท่าที่มีตัวหนังสือติดมากับภาพออก) · blink=false คือท่าที่หลับตายิ้มอยู่แล้ว
const POSES = {
  hello: { label: 'ยกมือสองข้าง (ทักทาย)', blink: true }, wave: { label: 'โบกมือ', blink: true }, celebrate: { label: 'กระโดดดีใจ', blink: false },
  greeting: { label: 'ไหว้', blink: true }, yourhome: { label: 'ชี้มือ + ถือกุญแจ', blink: true }, handover: { label: 'ส่งกุญแจ', blink: true },
  great: { label: 'ยกนิ้วโป้ง', blink: true }, thisway: { label: 'ชี้ทาง', blink: true }, idea: { label: 'ไอเดีย (หลอดไฟ)', blink: true },
  love: { label: 'ส่งหัวใจ', blink: false }, cheers: { label: 'ชนแก้ว', blink: true }, dance: { label: 'เต้น', blink: true },
  cleaning: { label: 'กวาดบ้าน (ไม้กวาด)', blink: true }, furnished: { label: 'กางแขน (เฟอร์นิเจอร์ครบ)', blink: true }, ready: { label: 'พร้อมเข้าอยู่ (กระเป๋า+กุญแจ)', blink: true },
};
const POSE_BY_SEG = { open: 'hello', area: 'great', 'room:แผนที่/การเดินทาง': 'thisway', 'room:หน้าบ้าน/ภายนอก': 'yourhome', 'room:ที่จอดรถ': 'ready', 'room:ห้องนั่งเล่น': 'furnished', 'room:ห้องทานอาหาร': 'furnished', 'room:ครัว': 'idea', 'room:ห้องนอนใหญ่': 'love', 'room:ห้องนอน': 'love', 'room:ห้องน้ำ': 'cleaning', 'room:สระว่ายน้ำ': 'cheers', 'room:สวน/ระเบียง': 'wave', life: 'dance', close: 'greeting' };
const poseForSeg = key => ((state.script.poses || {})[key]) || POSE_BY_SEG[key] || 'wave';

const MASCOT_IMG = {}, FACE_COL = {};
async function loadPoses(names) {
  const list = names || Object.keys(POSES);
  await Promise.all(list.map(async n => {
    if (MASCOT_IMG[n]) return;
    const bmp = await fetch(`assets/${n}.png`).then(r => { if (!r.ok) throw new Error('assets/' + n); return r.blob(); }).then(createImageBitmap);
    MASCOT_IMG[n] = bmp;
    // สีหน้าเหนือปาก (บน) และใต้ปาก (ล่าง) ใช้ไล่สีทับปากเดิมให้กลืนกับหน้า
    const [x0, y0, W] = POSE_HEAD[n], samp = fy => { const c = document.createElement('canvas'); c.width = Math.round(W * 0.16); c.height = Math.round(W * 0.04);
      const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(bmp, x0 + W * 0.42, y0 + W * fy, c.width, c.height, 0, 0, c.width, c.height);
      const d = x.getImageData(0, 0, c.width, c.height).data; let r = 0, g = 0, bb = 0, k = 0;
      for (let i = 0; i < d.length; i += 4) if (d[i + 3] > 200) { r += d[i]; g += d[i + 1]; bb += d[i + 2]; k++; }
      return k ? [Math.round(r / k), Math.round(g / k), Math.round(bb / k)] : [110, 30, 36]; };
    const t = samp(0.605), bt0 = samp(0.885), bt = t.map((v, i) => Math.round(v * 0.55 + bt0[i] * 0.45)); FACE_COL[n] = { top: `rgb(${t})`, bot: `rgb(${bt})` };
  }));
}

// ----- ปาก: m = เปิดปาก 0..1 · wf = ความกว้าง (0.8 แคบ ~ 1.2 กว้าง) -----
function drawMouth(ctx, cx, cy, W, m, wf, face) {
  ctx.save();
  // ทับปากเดิมด้วยสีหน้าไล่ระดับ (ขอบเบลอเล็กน้อยให้กลืน)
  const g = ctx.createLinearGradient(0, cy - W * 0.13, 0, cy + W * 0.13); g.addColorStop(0, face.top); g.addColorStop(1, face.bot);
  ctx.filter = `blur(${Math.max(1, W * 0.012)}px)`; ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(cx, cy, W * 0.19, W * 0.115, 0, 0, 7); ctx.fill(); ctx.filter = 'none';
  const wd = W * 0.245 * wf, lw = Math.max(2, W * 0.0105);
  ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = '#2b0a0d'; ctx.lineWidth = lw;
  if (m < 0.06) { // ปิดปาก = ยิ้มบางๆ
    ctx.beginPath(); ctx.moveTo(cx - wd * 0.46, cy - W * 0.005); ctx.quadraticCurveTo(cx, cy + W * 0.058, cx + wd * 0.46, cy - W * 0.005); ctx.stroke();
  } else {
    const h = W * (0.035 + 0.19 * m), top = cy - h * 0.3, P = new Path2D();
    P.moveTo(cx - wd / 2, top); P.quadraticCurveTo(cx, top - h * 0.2, cx + wd / 2, top); P.bezierCurveTo(cx + wd * 0.44, top + h * 1.2, cx - wd * 0.44, top + h * 1.2, cx - wd / 2, top); P.closePath();
    ctx.fillStyle = '#5b0f1a'; ctx.fill(P);
    ctx.save(); ctx.clip(P);
    ctx.fillStyle = '#e8657f'; ctx.beginPath(); ctx.ellipse(cx, top + h * 1.0, wd * 0.34, h * 0.4, 0, 0, 7); ctx.fill();   // ลิ้น
    if (m > 0.3) { ctx.fillStyle = '#fbf6ee'; ctx.fillRect(cx - wd / 2, top - 2, wd, h * 0.22 + 2); }                       // ฟันบน
    ctx.restore(); ctx.stroke(P);
  }
  ctx.restore();
}
// ----- ตา: กะพริบ (b = 0 ลืมตา .. 1 หลับ) -----
function drawBlink(ctx, cx, cy, W, b, face) {
  if (b < 0.12) return;
  ctx.save(); ctx.fillStyle = face.top; ctx.strokeStyle = '#2b0a0d'; ctx.lineWidth = Math.max(2, W * 0.011); ctx.lineCap = 'round';
  [cx - W * 0.145, cx + W * 0.145].forEach(ex => {
    ctx.beginPath(); ctx.ellipse(ex, cy, W * 0.082, W * 0.095 * Math.min(1, b * 1.3), 0, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.arc(ex, cy - W * 0.012, W * 0.062, Math.PI * 0.12, Math.PI * 0.88); ctx.stroke();
  });
  ctx.restore();
}
const blinkAt = (t, seed = 0) => { const p = (t + seed * 0.7) % 3.4; return p < 0.17 ? Math.sin(Math.PI * p / 0.17) : 0; };

// ----- วาดมาสคอตทั้งตัว: cx = กึ่งกลางแนวนอน, bottom = เท้า, h = ความสูง -----
function drawMascotTalking(ctx, pose, cx, bottom, h, o = {}) {
  const img = MASCOT_IMG[pose]; if (!img) return;
  const s = h / img.height, w = img.width * s, [hx0, hy0, W] = POSE_HEAD[pose], rot = o.rot || 0, yoff = o.yoff || 0;
  ctx.save(); ctx.translate(cx, bottom + yoff); ctx.rotate(rot); ctx.translate(-w / 2, -h); ctx.scale(s, s);
  ctx.drawImage(img, 0, 0);
  const face = FACE_COL[pose] || { top: '#6e1e24', bot: '#5a1820' };
  if (POSES[pose].blink) drawBlink(ctx, hx0 + W * 0.4975, hy0 + W * 0.54, W, o.blink || 0, face);
  if (o.talk !== false) drawMouth(ctx, hx0 + W * 0.5, hy0 + W * 0.745, W, o.mouth || 0, o.wf || 1, face);
  ctx.restore();
}

// ----- ปากตามเสียง: MOUTH.env = ค่าความดังต่อเฟรม (30 เฟรม/วิ) จากแทร็กเสียงพากย์ -----
const MOUTH = { fps: 30, env: null, wid: null, babble: true };
function mouthAt(t) {
  if (MOUTH.env) { const f = Math.max(0, Math.min(MOUTH.env.length - 1, Math.round(t * MOUTH.fps))); return { m: MOUTH.env[f], wf: MOUTH.wid ? MOUTH.wid[f] : 1 }; }
  if (MOUTH.babble) { const v = Math.max(0, Math.sin(t * 11) * 0.5 + Math.sin(t * 17.3 + 1) * 0.35 + Math.sin(t * 5.1) * 0.25); return { m: Math.min(1, v), wf: 1 + Math.sin(t * 7) * 0.12 }; }
  return { m: 0, wf: 1 };
}
// สร้างค่าขยับปากจากแทร็กเสียงพากย์ (mono): ความดัง → เปิดปาก, ความถี่สูง (ZCR) → ปากกว้าง
function computeMouthEnv(voice, sr, fps = 30) {
  const hop = Math.floor(sr / fps), n = Math.ceil(voice.length / hop), rms = new Float32Array(n), zcr = new Float32Array(n);
  for (let f = 0; f < n; f++) {
    let s = 0, z = 0, prev = 0; const a = f * hop, e = Math.min(voice.length, a + hop * 2);
    for (let i = a; i < e; i++) { const v = voice[i]; s += v * v; if ((v >= 0) !== (prev >= 0)) z++; prev = v; }
    rms[f] = Math.sqrt(s / Math.max(1, e - a)); zcr[f] = z / Math.max(1, e - a);
  }
  const sorted = Array.from(rms).filter(v => v > 1e-4).sort((a, b) => a - b), ref = sorted.length ? sorted[Math.floor(sorted.length * 0.95)] : 1;
  const env = new Float32Array(n), wid = new Float32Array(n); let cur = 0;
  for (let f = 0; f < n; f++) {
    let v = Math.min(1, rms[f] / (ref || 1)); v = v < 0.07 ? 0 : Math.pow(v, 0.6);
    cur = v > cur ? cur + (v - cur) * 0.7 : cur + (v - cur) * 0.5; env[f] = cur;
    wid[f] = 0.92 + Math.min(0.3, zcr[f] * 6);
  }
  return { env, wid };
}

// ----- มาสคอตนำเสนอ (มุมจอระหว่างเล่าเรื่อง): เปิดใช้ตอนเรนเดอร์เท่านั้น -----
// ----- มาสคอตนำเสนอ: เดินข้ามจอ ยืน นั่งที่ขอบจอ นอน เดินกลับ (ใช้รูปท่าเดิม ขยับด้วยการเคลื่อน/เอียง/กระโดดเบาๆ) -----
const _e = x => (x < 0 ? 0 : x > 1 ? 1 : x * x * (3 - 2 * x)), _r = (t, a, d) => _e((t - a) / d); // ค่าไล่ 0→1
const MOVES = ['cross', 'sit', 'return', 'lie'];
const PRESENTER = { on: false, spans: [], size: 0.28, side: 'left', move: true, prep() {
  let cur = this.side === 'left' ? 0 : 1; // 0 = ซ้าย, 1 = ขวา
  this.spans.forEach((sp, i) => { const L = sp.end - sp.start; sp.from = cur; sp.mv = L < 6 ? 'stand' : MOVES[i % MOVES.length]; if (sp.mv === 'cross' || (sp.mv === 'sit' && L > 9)) cur = 1 - cur; sp.to = cur; });
  this._prep = this.spans.length;
},
draw(ctx, W, H, t) {
  const sp = this.spans.find(s => t >= s.start && t < s.end); if (!sp || !MASCOT_IMG[sp.pose]) return;
  if (this._prep !== this.spans.length) this.prep();
  const k = t - sp.start, L = sp.end - sp.start, h = H * this.size, img = MASCOT_IMG[sp.pose], w = img.width * h / img.height, mg = W * 0.015;
  const xl = w * 0.55 + mg, xr = W - w * 0.55 - mg, X = f => xl + (xr - xl) * f;
  let f = sp.from, walk = 0, dir = 0, sit = 0, lie = 0;
  if (!this.move) { f = this.side === 'left' ? 0 : 1; }
  else {
    const WD = 2.4, go = (a, from, to) => { const p = _r(k, a, WD); if (p > 0 && p < 1) { walk = 1; dir = to > from ? 1 : -1; } return from + (to - from) * p; };
    if (sp.mv === 'cross') f = go(Math.min(2.2, L * 0.25), sp.from, sp.to);
    else if (sp.mv === 'return') { const a = Math.min(2, L * 0.2), b2 = L * 0.62, o = 1 - sp.from; f = k < b2 ? go(a, sp.from, o) : go(b2, o, sp.from); }
    else if (sp.mv === 'sit') { const a = L * 0.18, b2 = L - (sp.to !== sp.from ? WD + 0.6 : 1.2); sit = _r(k, a, 0.8) * (1 - _r(k, b2 - 0.8, 0.8)); if (sp.to !== sp.from) f = go(b2 + 0.4, sp.from, sp.to); }
    else if (sp.mv === 'lie') { const a = L * 0.3, b2 = a + Math.min(4.5, L * 0.35); lie = _r(k, a, 0.9) * (1 - _r(k, b2, 0.9)); }
  }
  let cx = X(f), step = walk ? Math.abs(Math.sin(k * Math.PI * 2.3)) : 0, hop = k < 0.4 ? (1 - k / 0.4) * H * 0.07 : 0;
  const bob = Math.sin(t * 2.6) * H * 0.004 * (1 - lie), flip = f > 0.5 && !walk ? 1 : walk && dir < 0 ? 1 : 0;
  let yoff = -hop - step * H * 0.022 + bob + sit * h * 0.34 - lie * w * 0.46, rot = walk ? Math.sin(k * Math.PI * 2.3) * 0.06 : sit ? Math.sin(t * 2) * 0.02 * sit : 0;
  if (lie) { rot = -lie * 1.5; cx = Math.max(cx, h * 0.98 + mg); cx = Math.min(cx, W - mg - w * 0.1); }
  const mo = mouthAt(t), bottom = H - H * 0.015;
  ctx.save();
  if (flip && !lie) { ctx.translate(cx, 0); ctx.scale(-1, 1); ctx.translate(-cx, 0); }
  if (sit > 0) { ctx.beginPath(); ctx.rect(0, 0, W, bottom + H * 0.015 - 1); ctx.clip(); } // ขาห้อยพ้นขอบจอ = นั่งที่ขอบ
  drawMascotTalking(ctx, sp.pose, cx, bottom, h, { mouth: mo.m, wf: mo.wf, blink: lie > 0.6 ? 1 : blinkAt(t, sp.seed || 0), yoff, rot });
  ctx.restore();
  if (lie > 0.85) { ctx.save(); ctx.fillStyle = 'rgba(255,255,255,.9)'; ctx.strokeStyle = 'rgba(90,24,32,.8)'; ctx.lineWidth = H * 0.003; ctx.textAlign = 'left'; ['z', 'Z', 'Z'].forEach((c, i) => { const q = ((t * 0.6 + i * 0.33) % 1), fs = H * (0.022 + i * 0.01); ctx.globalAlpha = Math.sin(Math.PI * q) * lie; ctx.font = `700 ${fs}px sans-serif`; const px = cx - h * 1.0 + q * H * 0.05 + i * H * 0.02, py = H - H * 0.015 - w * 0.9 - q * H * 0.07; ctx.strokeText(c, px, py); ctx.fillText(c, px, py); }); ctx.restore(); }
} };
