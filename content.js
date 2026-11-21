// ===== ชุดเนื้อหาครบชุดจาก AI (สคริปต์วิดีโอ + โพสต์ Facebook เต็ม/สั้น + แฮชแท็ก + ข้อมูลค้นหา) =====
// แม่แบบคำสั่งของเจ้าของแอป: แอปเติม "ข้อมูลบ้าน / ภาพและวิดีโอ / ช่องทางติดต่อ / ภาษา" ให้จากโปรเจกต์อัตโนมัติ
const KIT_TEMPLATE = `คุณเป็นผู้ช่วยผลิตเนื้อหาอสังหาริมทรัพย์ของ Hua Hin Properties

เมื่อฉันให้ข้อมูลบ้านและรายการภาพ/วิดีโอ ให้สร้างเนื้อหาทั้งชุดจากข้อมูลชุดเดียวกัน โดยทุกส่วนต้องใช้ชื่อทรัพย์ ตัวเลข และข้อเท็จจริงตรงกัน

บุคลิกของแบรนด์:
อบอุ่น เป็นกันเอง น่าเชื่อถือ เล่าเหมือนผู้รู้จักหัวหินพาคนดูชมบ้าน
มีมาสคอตรูปบ้านตัว H เป็นผู้พาชมและเป็นภาพจำของแบรนด์
หลีกเลี่ยงคำโฆษณาเกินจริงและคำชมซ้ำ ๆ

สร้างผลลัพธ์ตามลำดับต่อไปนี้

ส่วนที่ 1: สคริปต์วิดีโอแนวนอน ความยาวประมาณ 3 นาที
- แบ่งเป็นช่วงเวลาต่อเนื่องตั้งแต่ 0:00 ถึงประมาณ 3:00
- เปิดด้วยภาพมุมที่น่าสนใจที่สุดของบ้านภายใน 3 วินาทีแรก
- ให้มาสคอตพูดเปิด ชี้จุดเด่นบางช่วง และพูดปิด
- จัดลำดับเรื่องให้ผู้ชมเข้าใจบ้าน ทำเล พื้นที่ใช้ชีวิต จุดเด่น และบ้านนี้เหมาะกับใคร
- ในแต่ละช่วงระบุ: เวลา / ภาพที่ใช้ / บทพากย์ที่คัดลอกไปสร้างเสียงได้ / ข้อความบนจอ / การปรากฏของมาสคอต
- เว้นช่วงให้เห็นภาพบ้านโดยไม่มีบทพูดบ้าง
- บทพากย์ต้องพูดได้จริงภายในเวลาของแต่ละช่วง ถ้ายาวเกินให้ตัดคำ ไม่สั่งให้พูดเร็วขึ้น

ส่วนที่ 2: ข้อความโพสต์ Facebook ฉบับเต็ม
- เขียนใหม่ในรูปแบบโพสต์ ไม่คัดลอกบทพากย์มาต่อกัน
- บรรทัดแรกต้องชวนให้หยุดอ่านด้วยจุดเด่นเฉพาะของบ้านหลังนี้
- สรุปบรรยากาศ จุดเด่น ข้อมูลสำคัญ ทำเล และผู้ที่เหมาะกับบ้าน
- จัดย่อหน้าให้อ่านง่ายบนโทรศัพท์
- ปิดด้วยคำเชิญให้สอบถามหรือนัดชม พร้อมช่องทางติดต่อที่ฉันให้
- ส่งเป็นข้อความพร้อมคัดลอกไปโพสต์ได้ทันที

ส่วนที่ 3: ข้อความโพสต์ Facebook ฉบับสั้น
- ประมาณ 80–120 คำ
- เก็บจุดเด่นที่สุด ข้อมูลสำคัญ และคำเชิญติดต่อ
- ส่งเป็นข้อความพร้อมคัดลอกได้ทันที

ส่วนที่ 4: แฮชแท็ก
- เสนอ 5–8 แฮชแท็กที่เกี่ยวข้องกับบ้าน ทำเล และแบรนด์จริง
- ใส่ #HuaHinProperties เป็นแฮชแท็กประจำแบรนด์
- ไม่สร้างแฮชแท็กจากคุณสมบัติที่บ้านไม่มี

ส่วนที่ 5: ข้อมูลสำหรับการค้นหา
- ชื่อคลิปที่อ่านเข้าใจง่าย 3 ตัวเลือก
- คำอธิบายคลิปสำหรับ YouTube 1 ฉบับ
- ชื่อหน้าทรัพย์สำหรับเว็บไซต์ 1 ชื่อ
- คำอธิบายหน้าทรัพย์แบบสั้น 1 ฉบับ
- คีย์เวิร์ดหลัก 1 คำหรือวลี และคีย์เวิร์ดรอง 5–8 คำหรือวลี
- ใช้คำค้นอย่างเป็นธรรมชาติ ห้ามยัดคำซ้ำ ๆ

กฎข้อมูลที่ต้องถือเคร่งครัด:
- ใช้เฉพาะข้อมูลที่ฉันให้และสิ่งที่ยืนยันได้จากภาพ
- ห้ามเดาราคา ขนาดที่ดิน พื้นที่ใช้สอย จำนวนห้อง ระยะทาง กรรมสิทธิ์ หรือสถานะขาย
- หากข้อมูลสำคัญยังไม่มี ให้ใส่ [รอข้อมูล] ในรายการตรวจสอบท้ายคำตอบ และเว้นข้อมูลนั้นออกจากข้อความพร้อมโพสต์
- ห้ามสลับข้อมูลของบ้านคนละหลัง แม้จะอยู่ในโครงการเดียวกัน
- ตรวจความตรงกันของตัวเลข ชื่อโครงการ และช่องทางติดต่อในผลลัพธ์ทั้ง 5 ส่วนก่อนส่ง

ข้อมูลบ้านที่ยืนยันแล้ว:
{{FACTS}}

ภาพและวิดีโอที่มี:
{{MEDIA}}

ช่องทางติดต่อ:
{{CONTACT}}

ภาษาที่ต้องการ:
{{LANG}}`;
const KIT_LANGS = { th: 'ภาษาไทย', en: 'ภาษาอังกฤษ', both: 'ทั้งสองภาษา' };
const WAIT = '[รอข้อมูล]';
// ข้อมูลบ้านที่กรอกในแอป → บล็อกข้อความ (ช่องว่าง = [รอข้อมูล] ไม่เดาแทน)
function kitFactsBlock() {
  const f = state.facts, n = v => String(v || '').trim(), num = v => /^[\d.,]+$/.test(n(v)), missing = [];
  const line = (k, v, unit) => { if (!n(v)) { missing.push(k); return `- ${k}: ${WAIT}`; } return `- ${k}: ${n(v)}${unit && num(v) ? ' ' + unit : ''}`; };
  const price = (() => { if (!n(f.price)) { missing.push('ราคา'); return `- ราคา: ${WAIT}`; } if (!num(f.price)) return `- ราคา: ${n(f.price)}`; const x = Number(n(f.price).replace(/,/g, '')); return `- ราคา: ${x < 1000 ? x + ' ล้านบาท' : x.toLocaleString('en-US') + ' บาท'}`; })();
  const L = [line('ชื่อทรัพย์/โครงการ', f.name), line('จำนวนห้องนอน', f.beds, 'ห้อง'), line('จำนวนห้องน้ำ', f.baths, 'ห้อง'), line('พื้นที่ใช้สอย', f.usable, 'ตารางเมตร'), line('ขนาดที่ดิน', f.land, 'ตารางวา'), price, line('จุดเด่น', f.highlights)];
  if (n(f.travel)) L.push(`- การเดินทาง: ${n(f.travel)}`);
  const dist = typeof placeDistances === 'function' ? placeDistances().slice(0, 6) : [];
  if (dist.length) L.push('- ระยะทางโดยประมาณจากพิกัดที่กรอก: ' + dist.map(d => `${d.name} ${fmtKm(d.km)} (ขับรถประมาณ ${d.min} นาที)`).join(', '));
  else missing.push('ระยะทางไปสถานที่สำคัญ (ยังไม่ได้ใส่พิกัด)');
  L.push(`- กรรมสิทธิ์: ${WAIT}`, `- สถานะขาย/เช่า: ${WAIT}`); missing.push('กรรมสิทธิ์', 'สถานะขาย/เช่า');
  return { text: L.join('\n'), missing };
}
// รายการภาพ/วิดีโอ จัดตามห้องและลำดับที่จะขึ้นในคลิป (ภาพเด่นเปิดคลิปอยู่บนสุด)
function kitMediaBlock() {
  const L = [], h = typeof heroItem === 'function' ? heroItem() : null, src = h && state.items.find(i => i.id === h.srcId);
  if (src) L.push(`- ภาพเด่นเปิดคลิป: ${src.name || 'ภาพ'} (ห้อง/มุม: ${src.room || 'ยังไม่ตั้งห้อง'})`);
  const cats = typeof AREA_CATS !== 'undefined' ? AREA_CATS.map(c => [c.label, libArea(c.id).length]).filter(x => x[1]) : [];
  cats.forEach(([lb, c]) => L.push(`- ภาพทำเลหัวหิน (${lb}): ${c} ภาพ`));
  if (typeof lifeItems === 'function' && lifeItems().length) L.push(`- ภาพไลฟ์สไตล์: ${lifeItems().length} ภาพ`);
  const byRoom = {}; state.items.forEach(i => { const r = i.room || 'ยังไม่ตั้งห้อง'; (byRoom[r] = byRoom[r] || []).push(i); });
  const order = typeof ROOMS !== 'undefined' ? [...ROOMS, 'ยังไม่ตั้งห้อง'] : Object.keys(byRoom);
  order.filter(r => byRoom[r]).forEach(r => { const its = byRoom[r], im = its.filter(i => i.type === 'image'), vd = its.length - im.length; L.push(`- ${r}: ${im.length} ภาพ${vd ? ` + ${vd} วิดีโอ` : ''} (ไฟล์: ${its.slice(0, 6).map(i => i.name).join(', ')}${its.length > 6 ? ' ...' : ''})`); });
  if (state.routeData) L.push('- มีคลิปแผนที่เส้นทางขับรถเข้าโครงการ');
  if (!L.length) L.push(`- ${WAIT}`);
  L.push(`- ขนาดคลิปในแอปตอนนี้: ${(typeof SIZES !== 'undefined' && (SIZES.find(s => s.id === state.size) || {}).name) || state.size} (แม่แบบคำสั่งระบุวิดีโอแนวนอน ถ้าต้องการขนาดอื่นแจ้งเพิ่มได้)`);
  return L.join('\n');
}
function kitContactBlock() {
  const ct = typeof activeContact === 'function' ? activeContact() : null, L = [];
  if (!ct) return `${WAIT} (ปิดการแสดงเบอร์ติดต่อในคลิป)`;
  const n = v => String(v || '').trim();
  L.push(`- ชื่อผู้ติดต่อ: ${n(ct.name) || 'Hua Hin Properties'}`, `- โทร: ${n(ct.phone) || WAIT}`, `- LINE: ${n(ct.line) || WAIT}`, `- เว็บไซต์: ${WAIT}`);
  return L.join('\n');
}
function buildKitPrompt(lang) {
  const F = kitFactsBlock(), media = kitMediaBlock(), contact = kitContactBlock(), lg = KIT_LANGS[lang] || KIT_LANGS.th;
  return { prompt: KIT_TEMPLATE.replace('{{FACTS}}', F.text).replace('{{MEDIA}}', media).replace('{{CONTACT}}', contact).replace('{{LANG}}', lg), missing: F.missing, contact };
}
// แยกคำตอบของ AI เป็นส่วนที่ 1–5 + รายการตรวจสอบท้ายคำตอบ
function parseKitResult(raw) {
  const text = String(raw || '').replace(/\r/g, ''), re = /^[#*\s>-]*ส่วนที่\s*([1-5๑-๕])\s*[:：.)]?/gm, hits = [];
  let m; while ((m = re.exec(text))) hits.push({ no: '๑๒๓๔๕'.includes(m[1]) ? '๑๒๓๔๕'.indexOf(m[1]) + 1 : +m[1], at: m.index, end: m.index + m[0].length });
  const out = { sections: {}, check: '' };
  hits.forEach((h, i) => { let body = text.slice(h.end, i + 1 < hits.length ? hits[i + 1].at : text.length); out.sections[h.no] = body.replace(/^[^\n]*\n/, m0 => (m0.trim().length < 80 ? m0 : '')).trim(); });
  const last = hits.length ? hits[hits.length - 1].no : null;
  if (last && out.sections[last]) { const cm = out.sections[last].match(/\n[#*\s>-]*(?:รายการตรวจสอบ|เช็กลิสต์|checklist)[^\n]*\n[\s\S]*$/i); if (cm) { out.check = cm[0].trim(); out.sections[last] = out.sections[last].slice(0, cm.index).trim(); } }
  return out;
}
// ตรวจตัวเลขในข้อความโพสต์/ข้อมูลค้นหาเทียบกับข้อมูลบ้าน (ห้องนอน ห้องน้ำ ราคา ที่ดิน เบอร์โทร)
function kitIssues(label, t) {
  const f = state.facts, n = v => String(v || '').trim(), out = [], num = v => parseFloat(String(v).replace(/,/g, ''));
  const chk = (re, key, nm) => { for (const m of t.matchAll(re)) { if (!n(f[key])) out.push(`${label}: พูดถึง "${m[0]}" แต่ยังไม่ได้กรอก${nm}ในข้อมูลบ้าน`); else if (num(m[1]) !== num(f[key])) out.push(`${label}: "${m[0]}" ไม่ตรงกับข้อมูลบ้าน (${nm} ${n(f[key])})`); } };
  chk(/(\d+(?:\.\d+)?)\s*(?:ห้องนอน|bed(?:room)?s?)/gi, 'beds', 'จำนวนห้องนอน'); chk(/(\d+(?:\.\d+)?)\s*(?:ห้องน้ำ|bath(?:room)?s?)/gi, 'baths', 'จำนวนห้องน้ำ');
  chk(/(\d[\d,.]*)\s*(?:ตารางเมตร|ตร\.?\s?ม\.?|sq\.?\s?m)/gi, 'usable', 'พื้นที่ใช้สอย'); chk(/(\d[\d,.]*)\s*(?:ตารางวา|ตร\.?\s?ว\.?|sq\.?\s?wa)/gi, 'land', 'ขนาดที่ดิน');
  const px = (() => { const x = num(f.price); return isNaN(x) ? null : (x < 1000 ? x : x / 1e6); })();
  for (const m of t.matchAll(/(\d[\d,.]*)\s*(?:ล้านบาท|ล้าน|million)/gi)) { if (px == null) out.push(`${label}: พูดถึงราคา "${m[0]}" แต่ยังไม่ได้กรอกราคาในข้อมูลบ้าน`); else if (Math.abs(num(m[1]) - px) > 0.011) out.push(`${label}: ราคา "${m[0]}" ไม่ตรงกับข้อมูลบ้าน (${px} ล้านบาท)`); }
  const ct = typeof activeContact === 'function' ? activeContact() : null, digits = s => String(s || '').replace(/\D/g, '');
  for (const m of t.matchAll(/(?:\+?66|0)[\d\s-]{8,13}\d/g)) { const d = digits(m[0]); if (!ct || !digits(ct.phone)) out.push(`${label}: มีเบอร์ "${m[0].trim()}" แต่ยังไม่ได้ตั้งเบอร์ติดต่อ`); else if (digits(ct.phone).replace(/^66/, '0') !== d.replace(/^66/, '0')) out.push(`${label}: เบอร์ "${m[0].trim()}" ไม่ตรงกับเบอร์ติดต่อที่ตั้งไว้ (${ct.phone})`); }
  return out;
}
const KIT_TITLES = { 1: 'ส่วนที่ 1 · สคริปต์วิดีโอ (ตารางเวลา)', 2: 'ส่วนที่ 2 · โพสต์ Facebook ฉบับเต็ม', 3: 'ส่วนที่ 3 · โพสต์ Facebook ฉบับสั้น', 4: 'ส่วนที่ 4 · แฮชแท็ก', 5: 'ส่วนที่ 5 · ข้อมูลสำหรับการค้นหา' };
function openKitSheet() {
  document.querySelector('#kitSheet')?.remove();
  const c = state.content = state.content || { lang: 'th', raw: '', sections: {}, check: '' }, d = document.createElement('div'); d.className = 'sheet tall'; d.id = 'kitSheet';
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const flash = (btn, ok) => { const o = btn.dataset.o || btn.textContent; btn.dataset.o = o; btn.textContent = ok ? '✓ คัดลอกแล้ว' : 'คัดลอกไม่ได้'; setTimeout(() => { btn.textContent = o; }, 1500); };
  const draw = () => {
    const K = buildKitPrompt(c.lang), secs = Object.keys(c.sections).sort();
    d.innerHTML = `<div class="sh-head"><b>🧩 ชุดเนื้อหาครบชุดจาก AI</b><button class="ib" data-a="x" aria-label="ปิด">✕</button></div>
      <p class="hint">ใช้แม่แบบคำสั่งของคุณ แอปเติม <b>ข้อมูลบ้าน · รายการภาพ/วิดีโอ · ช่องทางติดต่อ · ภาษา</b> ให้จากโปรเจกต์นี้เอง ข้อมูลที่ยังไม่ได้กรอกจะใส่ <b>${WAIT}</b> ไม่เดาแทน AI จะได้ไม่แต่งตัวเลขเอง</p>
      <div class="seg"><b>① เลือกภาษา</b><div class="tools">${Object.entries(KIT_LANGS).map(([k, v]) => `<label class="sw" style="margin:0"><input type="radio" name="klang" value="${k}" ${c.lang === k ? 'checked' : ''}> ${v}</label>`).join('')}</div></div>
      ${K.missing.length ? `<div class="soon" style="text-align:left;border-color:#b00020;color:#b00020">⚠️ ข้อมูลที่ยังไม่มี (จะส่งเป็น ${WAIT}): ${K.missing.join(' · ')}<br><small>กรอกได้ที่ปุ่ม 🏠 ข้อมูลบ้าน (ขั้น 4) ส่วนกรรมสิทธิ์และสถานะขายแอปยังไม่มีช่องกรอก ถ้าต้องการให้ AI ใช้ ให้พิมพ์เพิ่มต่อท้ายคำสั่งเอง</small></div>` : '<div class="soon" style="text-align:left;border-color:#2e7d4f;color:#1e6b3a">✅ ข้อมูลหลักครบ</div>'}
      <div class="seg"><b>② คัดลอกคำสั่งไปวางที่ Google AI Studio</b><textarea class="sct" rows="6" readonly>${esc(K.prompt)}</textarea>
        <div class="tools"><button class="ib wide" data-a="copy">📋 คัดลอกคำสั่ง</button><button class="ib wide" data-a="copyopen">📋 คัดลอก + เปิด AI Studio</button></div></div>
      <div class="seg"><b>③ วางคำตอบของ AI ที่นี่</b><p class="hint">เมื่อ AI ตอบครบแล้ว คัดลอกคำตอบทั้งหมดมาวาง แอปจะแยก 5 ส่วน ให้คัดลอกทีละส่วน และตรวจตัวเลข/เบอร์เทียบข้อมูลบ้านให้</p>
        <textarea class="sct" id="kitRaw" rows="5" placeholder="วางคำตอบทั้งหมดของ AI ที่นี่">${esc(c.raw)}</textarea><div class="tools"><button class="ib wide" data-a="parse">✂️ แยก 5 ส่วน + ตรวจตัวเลข</button><button class="ib" data-a="clear" aria-label="ล้าง">🗑️</button></div></div>
      ${secs.length ? secs.map(k => { const iss = kitIssues(KIT_TITLES[k] || 'ส่วน ' + k, c.sections[k]); return `<div class="seg"><div class="seg-h"><b>${KIT_TITLES[k] || 'ส่วนที่ ' + k}</b><button class="ib sm" data-a="cp" data-k="${k}">📋 คัดลอก</button></div>
        ${iss.length ? `<div class="soon" style="text-align:left;border-color:#b00020;color:#b00020">${iss.map(x => '⚠️ ' + esc(x)).join('<br>')}</div>` : (k == 1 || k == 4 ? '' : '<small class="hint">✅ ตัวเลขและเบอร์ไม่ขัดกับข้อมูลบ้าน</small>')}
        <textarea class="sct" rows="${k == 1 ? 8 : 5}" data-s="${k}">${esc(c.sections[k])}</textarea></div>`; }).join('') : ''}
      ${c.check ? `<div class="seg"><b>📝 รายการตรวจสอบท้ายคำตอบ (จาก AI)</b><textarea class="sct" rows="4" readonly>${esc(c.check)}</textarea></div>` : ''}
      <button class="btn alt" data-a="x">ปิด</button>`;
  };
  draw();
  d.onchange = e => { const r = e.target.closest('input[name=klang]'); if (r) { c.lang = r.value; save(); const sc = d.scrollTop; draw(); d.scrollTop = sc; } };
  d.oninput = e => { const ta = e.target.closest('textarea'); if (!ta) return; if (ta.id === 'kitRaw') c.raw = ta.value; else if (ta.dataset.s) c.sections[ta.dataset.s] = ta.value; save(); };
  d.onclick = async e => {
    const b = e.target.closest('[data-a]'); if (!b) return; const a = b.dataset.a, K = buildKitPrompt(c.lang);
    if (a === 'x') { d.remove(); return; }
    if (a === 'copy') { flash(b, await copyText(K.prompt)); return; }
    if (a === 'copyopen') { flash(b, await copyText(K.prompt)); openExternal(lib.links.chat); return; }
    if (a === 'cp') { flash(b, await copyText(c.sections[b.dataset.k] || '')); return; }
    if (a === 'clear') { if (!confirm('ล้างคำตอบที่วางไว้?')) return; state.content = { lang: c.lang, raw: '', sections: {}, check: '' }; save(); openKitSheet(); return; }
    if (a === 'parse') { const r = parseKitResult(c.raw); if (!Object.keys(r.sections).length) { alert('อ่านไม่ออก: คำตอบต้องมีหัวข้อ "ส่วนที่ 1:" ... "ส่วนที่ 5:" เหมือนที่คำสั่งกำหนด'); return; } c.sections = r.sections; c.check = r.check; save(); const sc = d.scrollTop; draw(); d.scrollTop = sc; }
  };
  document.body.appendChild(d);
}
