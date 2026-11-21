// เครื่องวาดภาพ: ใช้ทั้งพรีวิวและตอนเรนเดอร์ MP4 (โค้ดชุดเดียวกัน ภาพจึงตรงกัน 100%)
// สไตล์ v3: ภาพเต็มจอ + Ken Burns ซูม 8% + ภาพละ 2 วินาที + ครอสเฟด
// รายการในไทม์ไลน์ = รูป (ImageBitmap/canvas) หรือ "ฉาก" ที่มี { dur, draw(ctx,W,H,tวินาทีในฉาก) }
const STYLE = { secPerImage: 2, fade: 0.5, zoom: 0.08, trans: 'auto' };

const itemDur = it => (it && it.dur != null ? it.dur : STYLE.secPerImage); // รูปอาจมี .dur ของตัวเอง (ยืดตามสคริปต์/เสียง)
function totalDuration(arg) {
  if (typeof arg === 'number') return arg > 0 ? arg * STYLE.secPerImage + STYLE.fade : 0;
  return arg.length ? arg.reduce((a, it) => a + itemDur(it), 0) + STYLE.fade : 0;
}

function drawCover(ctx, img, W, H, scale) {
  const iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height;
  const base = Math.max(W / iw, H / ih) * scale;
  const w = iw * base, h = ih * base;
  ctx.drawImage(img, (W - w) / 2, (H - h) / 2, w, h);
}

const easeIO = x => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
// ลูกเล่นเปลี่ยนภาพ: เลือกอัตโนมัติสลับกันไป (ไม่ซ้ำติดกัน) · ฉากไตเติล/เครดิตใช้เฟดนุ่มๆ
const TRANS = ['fade', 'slideL', 'zoom', 'wipe', 'slideU', 'flash', 'circle', 'slideR'];
const transFor = (i, a, b) => (STYLE.trans === 'fade' || (a && a.draw) || (b && b.draw) ? 'fade' : TRANS[(i * 3) % TRANS.length]);
function drawItem(ctx, img, W, H, t, start, end) {
  if (img.draw) { ctx.save(); img.draw(ctx, W, H, t - start, start); ctx.restore(); }
  else drawCover(ctx, img, W, H, 1 + STYLE.zoom * Math.min(1, (t - start) / (end - start)));
}
function drawFrame(ctx, W, H, images, t) {
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
  const F = STYLE.fade; let start = 0;
  images.forEach((img, i) => {
    const d = itemDur(img), end = start + d + F;
    if (t >= start && t <= end) {
      const inT = i > 0 && t - start < F ? (t - start) / F : -1, ty = inT >= 0 ? transFor(i, images[i - 1], img) : '';
      const nx = images[i + 1], outT = nx && t > start + d ? (t - start - d) / F : -1, oty = outT >= 0 ? transFor(i + 1, img, nx) : '';
      const e = inT >= 0 ? easeIO(inT) : 1, eo = outT >= 0 ? easeIO(outT) : 0;
      ctx.save();
      if (outT >= 0) { // ภาพที่กำลังออก
        if (oty === 'slideL') ctx.translate(-W * 0.3 * eo, 0); else if (oty === 'slideR') ctx.translate(W * 0.3 * eo, 0); else if (oty === 'slideU') ctx.translate(0, -H * 0.3 * eo);
        else if (oty === 'zoom') { ctx.translate(W / 2, H / 2); ctx.scale(1 - 0.06 * eo, 1 - 0.06 * eo); ctx.translate(-W / 2, -H / 2); }
      }
      if (inT >= 0) { // ภาพที่กำลังเข้า
        if (ty === 'fade' || ty === 'flash') ctx.globalAlpha = e;
        else if (ty === 'slideL') ctx.translate(W * (1 - e), 0);
        else if (ty === 'slideR') ctx.translate(-W * (1 - e), 0);
        else if (ty === 'slideU') ctx.translate(0, H * (1 - e));
        else if (ty === 'zoom') { ctx.globalAlpha = e; const z = 1.25 - 0.25 * e; ctx.translate(W / 2, H / 2); ctx.scale(z, z); ctx.translate(-W / 2, -H / 2); }
        else if (ty === 'wipe') { ctx.beginPath(); ctx.rect(0, 0, W * e, H); ctx.clip(); }
        else if (ty === 'circle') { ctx.beginPath(); ctx.arc(W / 2, H / 2, Math.hypot(W, H) / 2 * e, 0, 7); ctx.clip(); }
      }
      drawItem(ctx, img, W, H, t, start, end);
      ctx.restore();
      if (inT >= 0 && ty === 'flash') { ctx.fillStyle = `rgba(255,248,235,${0.55 * Math.sin(Math.PI * inT)})`; ctx.fillRect(0, 0, W, H); }
    }
    start += d;
  });
  ctx.globalAlpha = 1;
  if (typeof PRESENTER !== 'undefined' && PRESENTER.on) PRESENTER.draw(ctx, W, H, t);
  if (typeof OVERLAY !== 'undefined' && OVERLAY.on) OVERLAY.draw(ctx, W, H, t);
}

// ช็อตซูม/แพนจากรูปเดียว (ใช้เมื่อรูปน้อยแต่ต้องแสดงนาน: ภาพเดียวกันแต่เปลี่ยนมุมกล้องทุกช็อต)
const KB_VARIANTS = [[1, 1.12, 0, 0], [1.15, 1.15, -1, 0], [1.16, 1.0, 0, 0], [1.15, 1.15, 1, 0], [1.0, 1.14, 0, -1], [1.14, 1.14, 0, 1]];
function kbShot(bmp, dur, j) {
  const [z0, z1, px, py] = KB_VARIANTS[j % KB_VARIANTS.length];
  return {
    dur, close() { if (bmp.close) bmp.close(); },
    draw(ctx, W, H, t) {
      const k = Math.min(1, t / dur), z = z0 + (z1 - z0) * k, iw = bmp.naturalWidth || bmp.width, ih = bmp.naturalHeight || bmp.height;
      const base = Math.max(W / iw, H / ih) * z, w = iw * base, h = ih * base, ox = (w - W) / 2, oy = (h - H) / 2, m = (k * 2 - 1) * 0.9;
      ctx.drawImage(bmp, (W - w) / 2 + px * m * ox, (H - h) / 2 + py * m * oy, w, h);
    },
  };
}
