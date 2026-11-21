// ป้ายข้อความประจำช่วง (เช่น "3 ห้องนอน / BEDROOMS") โผล่เป็นระยะระหว่างคลิป · ใช้ทั้งพรีวิวและตอนเรนเดอร์
const OVERLAY = { on: false, events: [], draw(ctx, W, H, t) {
  const ev = this.events.find(e => t >= e.a && t < e.b); if (!ev) return;
  const k = t - ev.a, d = ev.b - ev.a, IN = 0.45, OUT = 0.4;
  const p = k < IN ? easeOut(k / IN) : 1, o = k > d - OUT ? Math.max(0, (d - k) / OUT) : 1, u = Math.min(W, H) / 1080;
  const s1 = 68 * u, s2 = 32 * u, padX = 36 * u, padY = 24 * u, bar = 8 * u;
  ctx.save();
  ctx.font = `700 ${s1}px ${SANS}`; let w1 = ctx.measureText(ev.l1).width;
  ctx.font = `600 ${s2}px ${SANS}`; const w2 = ev.l2 ? ctx.measureText(ev.l2).width + ev.l2.length * 4 * u : 0;
  const w = Math.min(W * 0.86, Math.max(w1, w2) + padX * 2 + bar), h = padY * 2 + s1 * 1.15 + (ev.l2 ? s2 * 1.3 : 0);
  const x = W * 0.045 - (1 - p) * w * 0.6, y = H * 0.075;
  ctx.globalAlpha = o * p;
  ctx.shadowColor = 'rgba(0,0,0,.35)'; ctx.shadowBlur = 18 * u; ctx.shadowOffsetY = 4 * u;
  ctx.fillStyle = 'rgba(32,18,16,.72)'; ctx.beginPath(); ctx.roundRect(x, y, w, h, 14 * u); ctx.fill();
  ctx.shadowColor = 'transparent'; ctx.fillStyle = '#b8862d'; ctx.beginPath(); ctx.roundRect(x, y, bar, h, [14 * u, 0, 0, 14 * u]); ctx.fill();
  ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left'; ctx.fillStyle = '#fff';
  const mw = w - padX * 2 - bar, f1 = fitFont(ctx, ev.l1, '700', SANS, s1, mw);
  ctx.fillText(ev.l1, x + bar + padX, y + padY + f1 * 0.95);
  if (ev.l2) { ctx.fillStyle = '#e8c97a'; ctx.font = `600 ${s2}px ${SANS}`; if (ctx.letterSpacing !== undefined) ctx.letterSpacing = `${3 * u}px`; ctx.fillText(ev.l2, x + bar + padX, y + padY + f1 * 0.95 + s2 * 1.35); }
  ctx.restore();
} };

const ROOM_EN = { 'หน้าบ้าน/ภายนอก': 'EXTERIOR', 'ที่จอดรถ': 'PARKING', 'ห้องนั่งเล่น': 'LIVING ROOM', 'ห้องทานอาหาร': 'DINING ROOM', 'ครัว': 'KITCHEN', 'ห้องนอนใหญ่': 'MASTER BEDROOM', 'ห้องนอน': 'BEDROOM', 'ห้องน้ำ': 'BATHROOM', 'สระว่ายน้ำ': 'SWIMMING POOL', 'สวน/ระเบียง': 'GARDEN & TERRACE' };
// รายการป้ายของแต่ละช่วง (เรียงตามลำดับที่จะโผล่) — ใช้เฉพาะข้อมูลที่กรอกไว้ ไม่แต่งข้อมูล
function overlayLabels(key, f) {
  const n = v => String(v || '').trim(), num = v => /^[\d.,]+$/.test(n(v));
  const out = [];
  if (key === 'area') { out.push({ l1: 'หัวหิน · ปราณบุรี · ชะอำ', l2: 'HUA HIN LIVING' }); if (n(f.travel)) out.push({ l1: n(f.travel), l2: 'LOCATION' }); return out; }
  if (key === 'life') return [{ l1: 'ไลฟ์สไตล์ริมทะเล', l2: 'LIFESTYLE' }];
  if (!key || !key.startsWith('room:')) return out;
  const room = key.slice(5), en = ROOM_EN[room] || '';
  if (room === 'ห้องนอน' || room === 'ห้องนอนใหญ่') { if (num(f.beds)) out.push({ l1: `${n(f.beds)} ห้องนอน`, l2: `${n(f.beds)} ${Number(n(f.beds)) === 1 ? 'BEDROOM' : 'BEDROOMS'}` }); }
  else if (room === 'ห้องน้ำ') { if (num(f.baths)) out.push({ l1: `${n(f.baths)} ห้องน้ำ`, l2: `${n(f.baths)} ${Number(n(f.baths)) === 1 ? 'BATHROOM' : 'BATHROOMS'}` }); }
  else if (room === 'หน้าบ้าน/ภายนอก') { if (n(f.name)) out.push({ l1: n(f.name), l2: 'HUA HIN PROPERTIES' }); if (num(f.land)) out.push({ l1: `ที่ดิน ${n(f.land)} ตารางวา`, l2: 'LAND SIZE' }); }
  else if (room === 'ห้องนั่งเล่น') { if (num(f.usable)) out.push({ l1: `พื้นที่ใช้สอย ${n(f.usable)} ตร.ม.`, l2: 'LIVING AREA' }); }
  out.push({ l1: room, l2: en });
  if (room === 'หน้าบ้าน/ภายนอก' && n(f.price)) out.push({ l1: num(f.price) ? (Number(n(f.price).replace(/,/g, '')) < 1000 ? `${n(f.price)} ล้านบาท` : `฿${Number(n(f.price).replace(/,/g, '')).toLocaleString('en-US')}`) : n(f.price), l2: 'PRICE' });
  return out;
}
// entries = รายการเวลา [{key, dur}] ตามที่ตัวเรนเดอร์ประกอบ → ป้ายแรกโผล่ที่ 0.8 วิหลังเริ่มช่วง และซ้ำทุก ~9 วิถ้าช่วงยาว (ไม่เกิน 3 ป้ายต่อช่วง)
function buildOverlayEvents(entries, f) {
  const spans = []; let tt = 0, cur = null;
  entries.forEach(e => { if (e.key && e.key !== 'open' && e.key !== 'close' && e.key !== 'hook') { if (cur && cur.key === e.key) cur.b = tt + e.dur; else { cur = { key: e.key, a: tt, b: tt + e.dur }; spans.push(cur); } } else cur = null; tt += e.dur; });
  const events = [];
  spans.forEach(sp => {
    const labs = overlayLabels(sp.key, f); if (!labs.length) return;
    const len = sp.b - sp.a; let t = sp.a + 0.8, i = 0;
    while (i < Math.min(3, Math.max(labs.length, 1)) && t + 2.4 <= sp.b) { const L = labs[i % labs.length]; events.push({ a: t, b: Math.min(t + 3.4, sp.b - 0.2), l1: L.l1, l2: L.l2 }); t += 9; i++; if (len < 12) break; }
  });
  return events.sort((x, y) => x.a - y.a);
}
