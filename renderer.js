// เครื่องวาดภาพ: ใช้ทั้งพรีวิวและตอนเรนเดอร์ MP4 (โค้ดชุดเดียวกัน ภาพจึงตรงกัน 100%)
// สไตล์ v3: ภาพเต็มจอ + Ken Burns ซูม 8% + ภาพละ 2 วินาที + ครอสเฟด
const STYLE = { secPerImage: 2, fade: 0.5, zoom: 0.08 };

function totalDuration(n) { return n > 0 ? n * STYLE.secPerImage + STYLE.fade : 0; }

function drawCover(ctx, img, W, H, scale) {
  const iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height;
  const base = Math.max(W / iw, H / ih) * scale;
  const w = iw * base, h = ih * base;
  ctx.drawImage(img, (W - w) / 2, (H - h) / 2, w, h);
}

// images = อาร์เรย์ของ ImageBitmap/HTMLImageElement ตามลำดับ, t = วินาที
function drawFrame(ctx, W, H, images, t) {
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  const D = STYLE.secPerImage, F = STYLE.fade;
  images.forEach((img, i) => {
    const start = i * D, end = (i + 1) * D + F;
    if (t < start || t > end) return;
    const alpha = i === 0 ? 1 : Math.min(1, (t - start) / F);
    const k = (t - start) / (end - start);
    ctx.globalAlpha = alpha;
    drawCover(ctx, img, W, H, 1 + STYLE.zoom * k);
  });
  ctx.globalAlpha = 1;
}
