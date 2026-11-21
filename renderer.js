// เครื่องวาดภาพ: ใช้ทั้งพรีวิวและตอนเรนเดอร์ MP4 (โค้ดชุดเดียวกัน ภาพจึงตรงกัน 100%)
// สไตล์ v3: ภาพเต็มจอ + Ken Burns ซูม 8% + ภาพละ 2 วินาที + ครอสเฟด
// รายการในไทม์ไลน์ = รูป (ImageBitmap/canvas) หรือ "ฉาก" ที่มี { dur, draw(ctx,W,H,tวินาทีในฉาก) }
const STYLE = { secPerImage: 2, fade: 0.5, zoom: 0.08 };

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

function drawFrame(ctx, W, H, images, t) {
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  const F = STYLE.fade; let start = 0;
  images.forEach((img, i) => {
    const d = itemDur(img), end = start + d + F;
    if (t >= start && t <= end) {
      const alpha = i === 0 ? 1 : Math.min(1, (t - start) / F);
      ctx.globalAlpha = alpha;
      if (img.draw) { ctx.save(); img.draw(ctx, W, H, t - start, start); ctx.restore(); }
      else drawCover(ctx, img, W, H, 1 + STYLE.zoom * ((t - start) / (end - start)));
    }
    start += d;
  });
  ctx.globalAlpha = 1;
  if (typeof PRESENTER !== 'undefined' && PRESENTER.on) PRESENTER.draw(ctx, W, H, t);
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
