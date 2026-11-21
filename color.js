// ปรับสีอัตโนมัติ: ความสว่าง คอนทราสต์ white balance (แบบนุ่มนวล ให้ดูเป็นธรรมชาติ)
const COLOR_DEFAULT = { auto: true, bright: 0, contrast: 0, warm: 0 };
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

// อ่านค่าเฉลี่ยสี/ความสว่าง/คอนทราสต์ของรูป (ย่อเหลือ 64×64 เพื่อให้เร็ว)
function imageStats(bmp) {
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(bmp, 0, 0, 64, 64);
  const d = x.getImageData(0, 0, 64, 64).data, n = 64 * 64;
  let r = 0, g = 0, b = 0, l = 0, l2 = 0;
  for (let i = 0; i < d.length; i += 4) {
    r += d[i]; g += d[i + 1]; b += d[i + 2];
    const y = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]; l += y; l2 += y * y;
  }
  const lum = l / n;
  return { r: r / n, g: g / n, b: b / n, lum, std: Math.sqrt(Math.max(0, l2 / n - lum * lum)) };
}

// สร้างตารางแปลงสี 3 ช่อง (R,G,B) ของรูปแต่ละรูป ให้ทุกรูปเข้าหาค่ากลางร่วมกัน
function makeLuts(all, color) {
  const mean = f => all.reduce((s, a) => s + f(a), 0) / all.length;
  const targetL = clamp(mean(a => a.lum), 100, 145), targetStd = clamp(mean(a => a.std), 40, 75);
  return all.map(s => {
    let bGain = 1, cFac = 1, gr = 1, gg = 1, gb = 1;
    if (color.auto) {
      bGain = 1 + (clamp(targetL / s.lum, 0.85, 1.2) - 1) * 0.7;
      cFac = 1 + (clamp(targetStd / s.std, 0.92, 1.12) - 1) * 0.6;
      const avg = (s.r + s.g + s.b) / 3, wb = ch => 1 + (clamp(avg / ch, 0.92, 1.08) - 1) * 0.6;
      gr = wb(s.r); gg = wb(s.g); gb = wb(s.b);
    }
    bGain *= 1 + color.bright / 100;
    cFac *= 1 + color.contrast / 100;
    gr *= 1 + color.warm / 200; gb *= 1 - color.warm / 200;
    return [gr, gg, gb].map(gc => {
      const lut = new Uint8ClampedArray(256);
      for (let v = 0; v < 256; v++) lut[v] = (v * gc * bGain - 128) * cFac + 128;
      return lut;
    });
  });
}

function isNeutral(color) { return !color.auto && !color.bright && !color.contrast && !color.warm; }

// วาดรูปลง canvas ใหม่พร้อมปรับสี (ถ้า luts เป็น null จะวาดเฉยๆ)
function gradeToCanvas(src, luts, w, h) {
  const c = document.createElement('canvas');
  c.width = w || src.width; c.height = h || src.height;
  const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(src, 0, 0, c.width, c.height);
  if (!luts) return c;
  const img = x.getImageData(0, 0, c.width, c.height), d = img.data;
  const [R, G, B] = luts;
  for (let i = 0; i < d.length; i += 4) { d[i] = R[d[i]]; d[i + 1] = G[d[i + 1]]; d[i + 2] = B[d[i + 2]]; }
  x.putImageData(img, 0, 0);
  return c;
}

// ย่อรูปให้ด้านยาวไม่เกิน max (ใช้ทำภาพตัวอย่าง)
async function smallBitmap(blob, max) {
  const full = await createImageBitmap(blob);
  const k = Math.min(1, max / Math.max(full.width, full.height));
  const s = await createImageBitmap(full, { resizeWidth: Math.round(full.width * k), resizeHeight: Math.round(full.height * k), resizeQuality: 'medium' });
  full.close(); return s;
}
