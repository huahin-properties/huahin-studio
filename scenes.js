// ฉันไตเติลและเครดิตปิดของแอป: มาสคอตโผล่มาโบกมือ + ชื่อแบรนด์ + สโลแกน (วาดด้วยโค้ดชุดเดียวกับพรีวิวและเรนเดอร์ MP4)
const TITLE_DUR = 6, CLOSE_DUR = 7;
const BRAND_DEFAULT = { greeting: 'สวัสดีครับ', tagline: 'YOUR HOME IS OUR PRIORITY', subtitle: '', thanks: 'ขอบคุณที่รับชมครับ', invite: 'สนใจติดต่อ' };
// ข้อความแบรนด์ตั้งครั้งเดียวในคลังกลาง (lib.brand) ใช้ซ้ำทุกคลิป · ช่องว่าง = ใช้ค่ามาตรฐาน
const BR = () => { const b = (typeof lib !== 'undefined' && lib.brand) || {}, o = {}; for (const k in BRAND_DEFAULT) o[k] = (k === 'subtitle' ? (b[k] || '') : ((b[k] || '').trim() || BRAND_DEFAULT[k])); return o; };
const BRAND_TAGLINE = 'YOUR HOME IS OUR PRIORITY';
const MASCOT_FILES = ['wave', 'hello', 'celebrate', 'yourhome', 'greeting', 'handover'];
async function loadMascots() { await loadPoses(); const m = {}; for (const n of Object.keys(POSES)) m[n] = n; return m; }
const _c = (v, a, b) => Math.min(b, Math.max(a, v));
const easeOutBounce = x => { const n = 7.5625, d = 2.75; if (x < 1 / d) return n * x * x; if (x < 2 / d) return n * (x -= 1.5 / d) * x + 0.75; if (x < 2.5 / d) return n * (x -= 2.25 / d) * x + 0.9375; return n * (x -= 2.625 / d) * x + 0.984375; };
const easeOut = x => 1 - (1 - x) ** 3;

function sceneBackground(ctx, W, H, t) {
  const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#f7efe3'); g.addColorStop(1, '#ead9bf'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  const u = Math.min(W, H) / 1080;
  // วงกลมทองแบบเหรียญโลโก้ (ลอยเบาๆ)
  ctx.save(); ctx.strokeStyle = 'rgba(196,150,60,.35)'; ctx.lineWidth = 3 * u;
  [0.42, 0.56, 0.7].forEach((r, i) => { ctx.beginPath(); ctx.arc(W / 2, H * 0.36, Math.min(W, H) * r + Math.sin(t * 0.8 + i) * 6 * u, 0, 7); ctx.stroke(); });
  ctx.restore();
  // กรอบทองบางๆ
  ctx.strokeStyle = 'rgba(122,31,43,.55)'; ctx.lineWidth = 4 * u; ctx.strokeRect(28 * u, 28 * u, W - 56 * u, H - 56 * u);
  ctx.strokeStyle = 'rgba(196,150,60,.8)'; ctx.lineWidth = 2 * u; ctx.strokeRect(44 * u, 44 * u, W - 88 * u, H - 88 * u);
}
function sparkle(ctx, x, y, r, a) { ctx.save(); ctx.globalAlpha *= a; ctx.fillStyle = '#d9a63a'; ctx.beginPath(); for (let i = 0; i < 8; i++) { const ang = i * Math.PI / 4, rr = i % 2 ? r * 0.28 : r; ctx.lineTo(x + Math.cos(ang) * rr, y + Math.sin(ang) * rr); } ctx.closePath(); ctx.fill(); ctx.restore(); }
function fitFont(ctx, text, weight, family, size, maxW) { let s = size; ctx.font = `${weight} ${s}px ${family}`; while (ctx.measureText(text).width > maxW && s > 12) { s -= 2; ctx.font = `${weight} ${s}px ${family}`; } return s; }
function drawText(ctx, text, x, y, o) {
  const a = _c((o.t - o.at) / 0.6, 0, 1); if (a <= 0) return; const e = easeOut(a);
  ctx.save(); ctx.globalAlpha *= e; ctx.translate(0, (1 - e) * 24); ctx.textAlign = o.align || 'center'; ctx.textBaseline = 'middle';
  if (o.spacing) ctx.letterSpacing = o.spacing;
  fitFont(ctx, text, o.weight || 'bold', o.family, o.size, o.maxW);
  if (o.shadow) { ctx.shadowColor = 'rgba(255,255,255,.8)'; ctx.shadowBlur = 8; }
  ctx.fillStyle = o.color; ctx.fillText(text, x, y); ctx.restore();
}
const SERIF = 'Georgia, "Playfair Display", "Times New Roman", serif', SANS = '"Noto Sans Thai", "Sarabun", system-ui, sans-serif';
function brandLine(ctx, cx, y, size, t, at, maxW) {
  const a = _c((t - at) / 0.6, 0, 1); if (a <= 0) return; const e = easeOut(a);
  ctx.save(); ctx.globalAlpha *= e; ctx.translate(0, (1 - e) * 24); ctx.textBaseline = 'middle';
  const parts = [['huahin', '#7a1f2b'], [' . ', '#c4963c'], ['properties', '#7a1f2b']]; const s = fitFont(ctx, 'huahin . properties', 'bold', SERIF, size, maxW);
  const ws = parts.map(p => ctx.measureText(p[0]).width), tot = ws.reduce((x, y) => x + y, 0); let x = cx - tot / 2; ctx.textAlign = 'left';
  parts.forEach((p, i) => { ctx.fillStyle = p[1]; ctx.fillText(p[0], x, y); x += ws[i]; }); ctx.restore();
}
let SCENE_T = 0; // เวลาจริงในคลิป (วินาที) ของเฟรมที่กำลังวาด ใช้ดึงค่าขยับปากจากเสียง
function drawMascot(ctx, pose, cx, bottom, h, yoff = 0, rot = 0) {
  const img = MASCOT_IMG[pose], w = img.width * h / img.height;
  ctx.save(); ctx.fillStyle = 'rgba(80,40,20,.18)'; ctx.beginPath(); ctx.ellipse(cx, bottom + 6, w * 0.34, h * 0.03, 0, 0, 7); ctx.fill(); ctx.restore();
  const mo = mouthAt(SCENE_T); drawMascotTalking(ctx, pose, cx, bottom, h, { yoff, rot, mouth: mo.m, wf: mo.wf, blink: blinkAt(SCENE_T) });
}
function layoutFor(W, H) { return W > H * 1.2 ? 'land' : 'port'; }

async function titleScene() {
  const M = await loadMascots();
  return {
    dur: typeof titleDur === 'function' ? titleDur() : TITLE_DUR,
    draw(ctx, W, H, t, abs = 0) {
      SCENE_T = abs + t; const u = Math.min(W, H) / 1080, land = layoutFor(W, H) === 'land'; sceneBackground(ctx, W, H, t);
      const mh = land ? H * 0.74 : H * 0.42, cx = land ? W * 0.27 : W / 2, bottom = land ? H * 0.86 : H * 0.55;
      let yoff = 0, pose = M.hello, rot = 0;
      if (t < 0.9) { yoff = -(1 - easeOutBounce(_c(t / 0.9, 0, 1))) * H * 0.6; }
      else if (t < 4.2) { yoff = Math.sin((t - 0.9) * 3) * -6 * u; pose = Math.floor((t - 0.9) / 0.4) % 2 ? M.hello : M.wave; rot = Math.sin((t - 0.9) * 6) * 0.02; }
      else { pose = M.celebrate; yoff = -Math.abs(Math.sin((t - 4.2) * 4)) * 40 * u; }
      drawMascot(ctx, pose, cx, bottom, mh, yoff, rot);
      if (t > 4.2) for (let i = 0; i < 6; i++) sparkle(ctx, cx + Math.cos(i * 1.1 + t) * mh * 0.42, bottom - mh * 0.55 + Math.sin(i * 1.7 + t * 2) * mh * 0.4, (14 + (i % 3) * 7) * u, (Math.sin(t * 6 + i) + 1) / 2);
      const tx = land ? W * 0.68 : W / 2, mw = land ? W * 0.55 : W * 0.82, y0 = land ? H * 0.32 : H * 0.65, B = BR(), sub = (B.subtitle || '').trim() || (state.facts && state.facts.name || '').trim() || 'บ้านพักตากอากาศ หัวหิน';
      drawText(ctx, B.greeting, tx, y0, { t, at: 1.0, size: 120 * u, color: '#7a1f2b', family: SANS, maxW: mw, shadow: true });
      brandLine(ctx, tx, y0 + 120 * u, 78 * u, t, 1.7, mw);
      drawText(ctx, B.tagline, tx, y0 + 195 * u, { t, at: 2.3, size: 32 * u, color: '#b8862d', family: SANS, maxW: mw, spacing: `${5 * u}px`, weight: '600' });
      drawText(ctx, sub, tx, y0 + 270 * u, { t, at: 3.0, size: 46 * u, color: '#2e2220', family: SANS, maxW: mw, weight: '600' });
    },
  };
}
async function closeScene() {
  const M = await loadMascots(), ct = typeof activeContact === 'function' ? activeContact() : null;
  return {
    dur: typeof closeDur === 'function' ? closeDur() : CLOSE_DUR,
    draw(ctx, W, H, t, abs = 0) {
      SCENE_T = abs + t; const u = Math.min(W, H) / 1080, land = layoutFor(W, H) === 'land'; sceneBackground(ctx, W, H, t);
      const mh = land ? H * 0.74 : H * 0.38, cx = land ? W * 0.27 : W / 2, bottom = land ? H * 0.86 : H * 0.5;
      let yoff = 0; if (t < 0.8) yoff = -(1 - easeOutBounce(_c(t / 0.8, 0, 1))) * H * 0.5; else yoff = Math.sin((t - 0.8) * 3) * -6 * u;
      const pose = t < 1.0 ? M.greeting : (Math.floor((t - 1.0) / 1.2) % 2 ? M.greeting : M.yourhome);
      drawMascot(ctx, pose, cx, bottom, mh, yoff);
      const tx = land ? W * 0.68 : W / 2, mw = land ? W * 0.55 : W * 0.84, y0 = land ? H * 0.22 : H * 0.55;
      drawText(ctx, BR().thanks, tx, y0, { t, at: 1.0, size: 78 * u, color: '#7a1f2b', family: SANS, maxW: mw });
      let y = y0 + 95 * u;
      if (ct && (ct.phone || '').trim()) {
        drawText(ctx, BR().invite, tx, y, { t, at: 1.6, size: 40 * u, color: '#2e2220', family: SANS, maxW: mw, weight: '600' }); y += 80 * u;
        if ((ct.name || '').trim()) { drawText(ctx, ct.name.trim(), tx, y, { t, at: 2.0, size: 52 * u, color: '#7a1f2b', family: SERIF, maxW: mw }); y += 82 * u; }
        drawText(ctx, '📞 ' + ct.phone.trim(), tx, y, { t, at: 2.4, size: 92 * u, color: '#2e2220', family: SANS, maxW: mw }); y += 100 * u;
        if ((ct.line || '').trim()) { drawText(ctx, 'LINE: ' + ct.line.trim(), tx, y, { t, at: 2.8, size: 58 * u, color: '#2e7d4f', family: SANS, maxW: mw }); y += 90 * u; }
      } else { drawText(ctx, 'ติดต่อสอบถามได้ที่', tx, y, { t, at: 1.6, size: 44 * u, color: '#2e2220', family: SANS, maxW: mw, weight: '600' }); y += 90 * u; }
      brandLine(ctx, tx, y + 10 * u, 74 * u, t, 3.2, mw);
      drawText(ctx, BR().tagline, tx, y + 85 * u, { t, at: 3.6, size: 30 * u, color: '#b8862d', family: SANS, maxW: mw, spacing: `${5 * u}px`, weight: '600' });
    },
  };
}
const sceneMaker = id => (id === 'title' ? titleScene : closeScene);
// วาดภาพเล่นวนในแคนวาส (พรีวิว) / วาดเฟรมนิ่ง
function previewScene(cv, which) {
  const cx = cv.getContext('2d'); sceneMaker(which)().then(sc => { const t0 = performance.now(); const tick = () => { if (!cv.isConnected) return; const t = ((performance.now() - t0) / 1000) % (sc.dur + 1); cx.save(); sc.draw(cx, cv.width, cv.height, Math.min(t, sc.dur)); cx.restore(); requestAnimationFrame(tick); }; tick(); });
}
function paintSceneFrame(cv, which, t) { sceneMaker(which)().then(sc => { const cx = cv.getContext('2d'); cx.save(); sc.draw(cx, cv.width, cv.height, t); cx.restore(); }); }
