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
// สติกเกอร์พร้อมข้อความ (ตัดจากชีตที่เจ้าของส่งมา) · ใช้เป็นท่าของมาสคอตนำเสนอได้ แต่ปากไม่ขยับตามเสียง (ใช้ภาพต้นฉบับ)
const STICKERS = [['224885ee_1','ยินดีต้อนรับ (โบกมือ)'],['224885ee_2','ยอดเยี่ยม Great!'],['224885ee_3','ฉลอง Celebrate'],['224885ee_4','ถือป้ายยินดีต้อนรับ'],['224885ee_5','ชี้ทาง This way'],['224885ee_6','ส่งหัวใจ Love'],['d73801cf_1','ไอเดีย Idea'],['d73801cf_2','ขอบคุณ Thank you'],['d73801cf_3','ถ่ายรูป Snap!'],['d73801cf_4','วิ่งมาแล้ว On my way'],['d73801cf_5','โอเค OK!'],['d73801cf_6','หัวเราะ Haha'],['d9ae68f2_1','กอดหัวใจ Love'],['d9ae68f2_2','ชนแก้ว Cheers!'],['d9ae68f2_3','ไหว้ Greeting'],['d9ae68f2_4','เต้น Dance'],['d9ae68f2_5','บ้านของคุณ Your Home'],['d9ae68f2_6','ฮัลโหล Hello!'],['9bc64e2a_1','พร้อมเข้าอยู่ Ready to Move'],['9bc64e2a_2','เฟอร์ฯ ครบครัน'],['9bc64e2a_3','จองเลย Book Now'],['9bc64e2a_4','เปิดประตูต้อนรับ'],['9bc64e2a_5','แถมฟรี Free Gift'],['9bc64e2a_6','ราคาเบาๆ Good Price'],['f97a4cb3_2','โปรโมชัน Promotion'],['f97a4cb3_3','พาชมบ้าน Open House'],['f97a4cb3_4','ปิดการขาย Deal'],['f97a4cb3_5','ปรึกษาฟรี Consult'],['f97a4cb3_6','ราคาพิเศษ Special Price'],['258b6b4b_1','มอบกุญแจ Handover'],['258b6b4b_2','ทำความสะอาด Cleaning'],['258b6b4b_3','เซ็นสัญญา Contract'],['258b6b4b_4','โฉนดที่ดิน Deed'],['258b6b4b_5','ทาสี Renovate'],['258b6b4b_6','บ้านใหม่ New Home'],['6b2cc827_1','ยินดีให้บริการครับ!'],['6b2cc827_2','รับฝากขาย-เช่า'],['6b2cc827_3','ขอบคุณที่ไว้วางใจ'],['6b2cc827_4','ยินดีต้อนรับสู่ครอบครัว'],['aee45653_1','ทักมาได้เลยครับ!'],['aee45653_2','อยากได้แบบไหน'],['aee45653_3','หาบ้านเช่า'],['aee45653_4','ยินดีต้อนรับทุกท่าน'],['dad2a4c5_2','ฝากเราทำตลาด'],['dad2a4c5_3','ฝากขายบ้าน'],['dad2a4c5_4','พร้อมดูแล'],['32615200_1','เรื่องขายบ้าน'],['32615200_2','ดันยอดขายให้ปัง!'],['32615200_3','ทำตลาดครบวงจร'],['32615200_4','ยินดีดูแลทุกเคส']];
STICKERS.forEach(([id, label]) => { POSES['stk_' + id] = { label, custom: true, sticker: true, src: `assets/stk/${id}.png` }; });
// ท่านั่ง/ยืนพิงขอบจอ (ตัดจากชีตที่เจ้าของส่งมา) · ใช้อัตโนมัติตอนมาสคอตนั่ง/พิงที่มุมซ้าย-ขวา และเลือกเป็นท่าประจำท่อนได้ (ปากไม่ขยับ)
const POSE_ART = [['e1','lie','L','นอนเท้าคาง: หลับตายิ้ม',0.809],['e2','lie','L','นอนเท้าคาง: โบกมือ',0.822],['e4','lie','R','นอนตะแคง: ขยิบตา',0.782],['f1','lie','R','นอนเท้าคาง: โบกมือ (หัวขวา)',0.825],['f2','lie','R','นอนเท้าคาง: หลับตายิ้ม (หัวขวา)',0.812],['f3','lie','L','นอนตะแคง: ขยิบตา (หัวซ้าย)',0.784],['e3','sit','L','นั่งเท้าแก้ม: ยกนิ้วโป้ง',0.928],['f4','sit','L','นั่งเท้าแก้ม: ยกนิ้วโป้ง 2',0.934],['a1','sit','L','นั่งพิงขอบซ้าย: ยิ้มวางมือบนเข่า',0.935],['a2','sit','L','นั่งพิงขอบซ้าย: โบกมือ',0.933],['a3','sit','L','นั่งพิงขอบซ้าย: ยกนิ้วโป้ง',0.944],['a4','sit','L','นั่งพิงขอบซ้าย: ทำหัวใจ',0.943],['c3','sit','L','นั่งพิงขอบซ้าย: หลับตายิ้ม',0.946],['c4','sit','L','นั่งพิงขอบซ้าย: ขยิบตาทำหัวใจ',0.945],['d1','sit','R','นั่งพิงขอบขวา: โบกมือ',0.941],['d2','sit','R','นั่งพิงขอบขวา: หลับตายิ้ม',0.941],['d3','sit','R','นั่งพิงขอบขวา: ขยิบตาทำหัวใจ',0.946],['d4','sit','R','นั่งพิงขอบขวา: ยกนิ้วโป้ง',0.948],['b3','sit','R','นั่งพิงขอบขวา: ขยิบตาทำหัวใจ 2',0.943],['b4','sit','R','นั่งพิงขอบขวา: หลับตายิ้ม 2',0.944],['c1','lean','L','ยืนพิงขอบซ้าย: เท้าเอว',1.013],['c2','lean','L','ยืนพิงขอบซ้าย: โบกมือ',1.013],['b1','lean','R','ยืนพิงขอบขวา: โบกมือ',1.012],['b2','lean','R','ยืนพิงขอบขวา: เท้าเอว',1.017]];
const SITS = { L: [], R: [] }, LEANS = { L: [], R: [] }, LIES = [], ART_IDS = [];
const ARTF = {};
POSE_ART.forEach(([id, kind, side, label, fh]) => { ARTF['art_' + id] = fh; const k = 'art_' + id; POSES[k] = { label, custom: true, art: true, src: `assets/pose/${id}.png` }; (kind === 'lie' ? LIES : (kind === 'sit' ? SITS : LEANS)[side]).push(k); ART_IDS.push(k); });
// ท่าพิเศษที่อัปโหลดเอง (รูปมาสคอตที่สร้างจาก AI) · ไม่มีตำแหน่งหัว จึงไม่ทับปาก/ตา (ใช้ภาพยิ้มตามต้นฉบับ)
const MY_POSES = [
  { id: 'my_sitL', label: 'นั่งพิงขอบซ้าย', hint: 'ใช้ตอนมาสคอตนั่งที่มุมซ้ายของจอ',
    prompt: 'Using the attached image as the exact character reference (same round maroon head with house-roof logo, same face, same maroon "H" tag body, white gloves, orange shoes, same flat cartoon sticker style with a white outline), draw ONE cute full-body pose: the character sits on the floor with its back and left shoulder leaning against a wall on the LEFT side of the picture, knees bent and squeezed together, relaxed and cozy. Very happy smiling face, big cheerful open eyes. Plain solid pure white background, no text, no shadow, whole body inside the frame.' },
  { id: 'my_sitR', label: 'นั่งพิงขอบขวา (ยืดเข่า ยกขา)', hint: 'ใช้ตอนมาสคอตนั่งที่มุมขวาของจอ',
    prompt: 'Using the attached image as the exact character reference (same round maroon head with house-roof logo, same face, same maroon "H" tag body, white gloves, orange shoes, same flat cartoon sticker style with a white outline), draw ONE cute full-body pose: the character sits on the floor with its back leaning against a wall on the RIGHT side of the picture, knees stretched forward, one leg lifted playfully, relaxed and carefree. Very happy smiling face, big cheerful open eyes. Plain solid pure white background, no text, no shadow, whole body inside the frame.' },
  { id: 'my_lie', label: 'นอนเอามือเท้าหัว', hint: 'ใช้ตอนมาสคอตนอนพักระหว่างท่อน',
    prompt: 'Using the attached image as the exact character reference (same round maroon head with house-roof logo, same face, same maroon "H" tag body, white gloves, orange shoes, same flat cartoon sticker style with a white outline), draw ONE cute full-body pose: the character lies relaxed on its side on the floor, one hand propped under its head, legs crossed, comfortable and calm. Very happy smiling face, big cheerful open eyes. Plain solid pure white background, no text, no shadow, whole body inside the frame, horizontal composition.' },
];
async function loadMyPoses() {
  for (const d of MY_POSES) {
    const b = (typeof lib !== 'undefined' && lib.myPoses || {})[d.id];
    if (b && !MASCOT_IMG[d.id]) { try { MASCOT_IMG[d.id] = await createImageBitmap(b); } catch (e) {} }
    if (b && MASCOT_IMG[d.id]) POSES[d.id] = { label: d.label, custom: true }; else { delete POSES[d.id]; delete MASCOT_IMG[d.id]; }
  }
}
const POSE_BY_SEG = { open: 'hello', area: 'great', 'room:แผนที่/การเดินทาง': 'thisway', 'room:หน้าบ้าน/ภายนอก': 'yourhome', 'room:ที่จอดรถ': 'ready', 'room:ห้องนั่งเล่น': 'furnished', 'room:ห้องทานอาหาร': 'furnished', 'room:ครัว': 'idea', 'room:ห้องนอนใหญ่': 'love', 'room:ห้องนอน': 'love', 'room:ห้องน้ำ': 'cleaning', 'room:สระว่ายน้ำ': 'cheers', 'room:สวน/ระเบียง': 'wave', life: 'dance', close: 'greeting' };
const poseForSeg = key => ((state.script.poses || {})[key]) || POSE_BY_SEG[key] || 'wave';

const MASCOT_IMG = {}, FACE_COL = {};
// ท่าที่ต้องใช้จริง = ท่ามาตรฐาน (ปากขยับ) + สติกเกอร์ที่ถูกเลือกไว้ในแต่ละท่อน (สติกเกอร์อื่นโหลดตอนเปิดหน้าเลือกท่า)
const neededPoses = () => [...new Set([...Object.keys(POSES).filter(k => !POSES[k].custom), ...Object.values((typeof state !== 'undefined' && state.script && state.script.poses) || {}).filter(k => POSES[k] && (POSES[k].sticker || POSES[k].art)), ...(typeof state !== 'undefined' && state.mascot && state.mascot.move !== false ? ART_IDS : [])])];
async function loadPoses(names) {
  const list = (names || neededPoses()).filter(n => POSES[n] && (!POSES[n].custom || POSES[n].src));
  await Promise.all(list.map(async n => {
    if (MASCOT_IMG[n]) return;
    const bmp = await fetch(POSES[n].src || `assets/${n}.png`).then(r => { if (!r.ok) throw new Error('assets/' + n); return r.blob(); }).then(createImageBitmap);
    MASCOT_IMG[n] = bmp; if (POSES[n].custom) return;
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
  const s = h / img.height, w = img.width * s, [hx0, hy0, W] = POSE_HEAD[pose] || [0, 0, 0], rot = o.rot || 0, yoff = o.yoff || 0;
  ctx.save(); ctx.translate(cx, bottom + yoff); ctx.rotate(rot); ctx.translate(-w / 2, -h); ctx.scale(s, s);
  ctx.drawImage(img, 0, 0);
  if (!POSE_HEAD[pose]) { ctx.restore(); return; }
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
// วงจร 6 ท่อน: เดิน 4 ครั้งใน 6 ท่อน (≈67% ของเดิมที่เดินทุกท่อน) ที่เหลือ นั่งยอง/นอน/ยืนเฉยๆ
// ดุกดิก: หายใจ โยกตัวเบาๆ ตัวเด้งตามจังหวะพูด และมีช่วง "ขยับพิเศษ" สลับกัน (สั่นตัว / กระโดดเล็ก / เอียงหัว) ทุก ~4 วินาที · amp = ความแรง (เดิน/นอนเบาลง)
function idleAt(t, seed, talk, amp) {
  const ph = t * 1.9 + seed * 1.3, br = Math.sin(ph) * 0.012 * amp, P = 4.2 + (seed % 3) * 0.7, u = t + seed * 1.7, k = Math.floor(u / P), q = (u % P) / 0.9, kind = (k + seed) % 3;
  let rot = Math.sin(t * 0.9 + seed * 2) * 0.012 * amp, dy = -talk * 0.006 * amp, sx = 1 - br * 0.5, sy = 1 + br;
  if (q < 1) { const e = 1 - q; if (kind === 0) rot += Math.sin(q * Math.PI * 8) * 0.05 * e * amp; else if (kind === 1) { dy -= Math.abs(Math.sin(q * Math.PI * 2)) * 0.014 * amp; sy += Math.sin(q * Math.PI * 2) * 0.02 * amp; } else rot += Math.sin(q * Math.PI) * 0.06 * amp; }
  return { dy, rot, sx, sy };
}
const MOVES = ['cross', 'sit', 'lie', 'return', 'lean', 'cross'];
const PRESENTER = { on: false, spans: [], size: 0.28, side: 'left', move: true, random: true, fidget: true, prep() {
  let cur = 0; // 0 = มุมบ้านเดิม, 1 = ปลายทางเดิน (ห่างจากมุมเดิม 70% ของความกว้างจอ)
  // สุ่มอิริยาบถ: ถ่วงน้ำหนักให้เดิน ~2 ใน 3 ท่อน · ไม่ซ้ำท่าเดิมติดกัน · แต่ละครั้งที่เรนเดอร์ไม่เหมือนกัน (ปิดสุ่ม = วงจรตายตัวเดิม)
  const W8 = [['cross', 0.34], ['return', 0.15], ['sit', 0.18], ['lie', 0.13], ['lean', 0.14], ['stand', 0.06]];
  const pick = prev => { for (let t = 0; t < 20; t++) { let r = Math.random(), a = 0; for (const [k, w] of W8) { a += w; if (r < a) { if (k !== prev) return k; break; } } } return 'cross'; };
  let prev = '';
  this.spans.forEach((sp, i) => { const L = sp.end - sp.start; sp.from = cur; sp.mv = L < 6 ? 'stand' : this.random ? pick(prev) : MOVES[i % MOVES.length]; prev = sp.mv; sp.r = this.random ? [Math.random(), Math.random(), Math.random()] : [0.5, 0.5, 0.5]; if (sp.mv === 'cross') cur = 1 - cur; sp.to = cur; });
  this._prep = this.spans.length;
},
draw(ctx, W, H, t) {
  const sp = this.spans.find(s => t >= s.start && t < s.end); if (!sp || !MASCOT_IMG[sp.pose]) return;
  if (this._prep !== this.spans.length) this.prep();
  const k = t - sp.start, L = sp.end - sp.start, h = H * this.size, img = MASCOT_IMG[sp.pose], w = img.width * h / img.height, mg = W * 0.015;
  const xl = w * 0.55 + mg, xr = W - w * 0.55 - mg, TRAVEL = 1, X = f => (this.side === 'left' ? xl + (xr - xl) * TRAVEL * f : xr - (xr - xl) * TRAVEL * f);
  let f = sp.from, walk = 0, dir = 0, sit = 0, lie = 0, lean = 0;
  if (!this.move) { f = 0; }
  else {
    const WD = 2.4, go = (a, from, to) => { const p = _r(k, a, WD); if (p > 0 && p < 1) { walk = 1; dir = X(to) > X(from) ? 1 : -1; } return from + (to - from) * p; };
    const R = sp.r || [0.5, 0.5, 0.5];
    if (sp.mv === 'cross') f = go(Math.min(2.2, L * 0.25) * (0.6 + 0.8 * R[1]), sp.from, sp.to);
    else if (sp.mv === 'return') { const a = Math.min(2, L * 0.2) * (0.6 + 0.8 * R[1]), b2 = L * (0.5 + 0.25 * R[2]), o = 1 - sp.from; f = k < b2 ? go(a, sp.from, o) : go(b2, o, sp.from); }
    else if (sp.mv === 'sit') { const a = L * (0.12 + 0.18 * R[1]), b2 = L - 1.2; sit = _r(k, a, 0.8) * (1 - _r(k, b2 - 0.8, 0.8)); if (sp.to !== sp.from) f = go(b2 + 0.4, sp.from, sp.to); }
    else if (sp.mv === 'lean') { lean = _r(k, L * 0.15, 0.7) * (1 - _r(k, L * 0.85 - 0.7, 0.7)); }
    else if (sp.mv === 'lie') { const a = L * (0.2 + 0.2 * R[1]), b2 = a + Math.min(4.5, L * 0.35); lie = _r(k, a, 0.9) * (1 - _r(k, b2, 0.9)); }
  }
  const sideL = X(f) < W / 2, pkk = (arr, ex) => (arr.length ? (this.random && sp.r ? arr[Math.floor(sp.r[ex] * arr.length) % arr.length] : arr[(((sp.seed || 0) * 3 + ex) % arr.length)]) : null);
  const mySit = sideL ? MASCOT_IMG.my_sitL : MASCOT_IMG.my_sitR, csK = mySit ? null : pkk(sideL ? SITS.L : SITS.R, 0), clK = MASCOT_IMG.my_lie ? null : pkk(LIES, 2), lnK = lean > 0 ? pkk(sideL ? LEANS.L : LEANS.R, 1) : null;
  const csImg = mySit || (csK && MASCOT_IMG[csK]), clImg = MASCOT_IMG.my_lie || (clK && MASCOT_IMG[clK]), lnImg = lnK && MASCOT_IMG[lnK]; let cA = 0, cI = '';
  if (sit > 0 && csImg) { cA = sit; cI = 'sit'; sit = 0; } else if (lie > 0 && clImg) { cA = lie; cI = 'lie'; lie = 0; } else if (lean > 0 && lnImg) { cA = lean; cI = 'lean'; } // มีรูปท่านั่ง/นอนที่อัปโหลดไว้ → ใช้รูปนั้นแทนการย่อ/หมุนตัว
  let cx = X(f), step = walk ? Math.abs(Math.sin(k * Math.PI * 2.3)) : 0, hop = k < 0.4 ? (1 - k / 0.4) * H * 0.07 : 0;
  const bob = Math.sin(t * 2.6) * H * 0.004 * (1 - lie), flip = walk ? (dir < 0 ? 1 : 0) : (cx > W / 2 ? 1 : 0);
  let yoff = -hop - step * H * 0.022 + bob - lie * w * 0.46, rot = walk ? Math.sin(k * Math.PI * 2.3) * 0.06 : sit ? Math.sin(t * 2) * 0.02 * sit : 0;
  if (lie) { rot = -lie * 1.5; cx = Math.max(cx, h * 0.98 + mg); cx = Math.min(cx, W - mg - w * 0.1); }
  const mo = mouthAt(t), bottom = H - H * 0.015, idl = this.fidget === false ? { dy: 0, rot: 0, sx: 1, sy: 1 } : idleAt(t, sp.seed || 0, mo.m, (walk ? 0.4 : 1) * (lie ? 0.5 : 1));
  yoff += idl.dy * H; rot += idl.rot;
  ctx.save();
  if (cA > 0) ctx.globalAlpha = 1 - cA;
  if (flip && !lie) { ctx.translate(cx, 0); ctx.scale(-1, 1); ctx.translate(-cx, 0); }
  if (sit > 0) { ctx.translate(cx, bottom); ctx.scale(1 + 0.07 * sit, 1 - 0.17 * sit); ctx.translate(-cx, -bottom); } // นั่งยอง: ตัวเตี้ยลง แต่ยังอยู่ในจอครบตัว
  ctx.translate(cx, bottom); ctx.scale(idl.sx, idl.sy); ctx.translate(-cx, -bottom);
  drawMascotTalking(ctx, sp.pose, cx, bottom, h, { mouth: mo.m, wf: mo.wf, blink: lie > 0.6 ? 1 : blinkAt(t, sp.seed || 0), yoff, rot });
  ctx.restore();
  if (cA > 0) { const im = cI === 'sit' ? csImg : cI === 'lean' ? lnImg : clImg, hh = h * (cI === 'sit' ? (csK ? ARTF[csK] : 0.8) : cI === 'lean' ? (lnK ? ARTF[lnK] : 0.86) : (clK ? ARTF[clK] : 0.72)), ww = im.width * hh / im.height, x = cI !== 'lie' ? (sideL ? ww / 2 : W - ww / 2) : Math.min(W - ww / 2 - mg, Math.max(ww / 2 + mg, X(f)));
    ctx.save(); ctx.globalAlpha = cA; const ia = cI === 'lie' ? 0.6 : 1; ctx.translate(x, bottom); ctx.rotate(idl.rot * (cI === 'lie' ? 0.5 : 1)); ctx.scale(idl.sx, idl.sy); ctx.translate(-x, -bottom + idl.dy * H * ia); ctx.drawImage(im, x - ww / 2, bottom - hh, ww, hh); ctx.restore(); }
  if (lie > 0.85) { ctx.save(); ctx.fillStyle = 'rgba(255,255,255,.9)'; ctx.strokeStyle = 'rgba(90,24,32,.8)'; ctx.lineWidth = H * 0.003; ctx.textAlign = 'left'; ['z', 'Z', 'Z'].forEach((c, i) => { const q = ((t * 0.6 + i * 0.33) % 1), fs = H * (0.022 + i * 0.01); ctx.globalAlpha = Math.sin(Math.PI * q) * lie; ctx.font = `700 ${fs}px sans-serif`; const px = cx - h * 1.0 + q * H * 0.05 + i * H * 0.02, py = H - H * 0.015 - w * 0.9 - q * H * 0.07; ctx.strokeText(c, px, py); ctx.fillText(c, px, py); }); ctx.restore(); }
} };
