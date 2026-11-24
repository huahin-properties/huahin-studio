// ===== มาสเตอร์พรอมต์: หน้าเก็บคำสั่งสำหรับ Google AI Studio (ชื่อผู้เล่า · สไตล์ · พรอมต์หลัก · โปรโมชั่น · รายละเอียดบ้าน) + ปุ่มคัดลอกไทย/อังกฤษ =====
// เก็บในคลังกลาง (lib.mp) ใช้ซ้ำทุกคลิป · ภาษาอังกฤษแปลจากไทยอัตโนมัติ (แก้เองได้) เก็บคำแปลไว้ ไม่แปลซ้ำถ้าข้อความไทยไม่เปลี่ยน
const MP_FIELDS = [
  { k: 'prompt', th: 'พรอมต์หลัก (คำสั่งให้ AI เรียบเรียงและอ่าน)', en: '', rows: 12 },
  { k: 'name', th: 'ชื่อผู้เล่าเรื่อง', en: 'Narrator name', rows: 1 },
  { k: 'style', th: 'สไตล์การพูด', en: 'Speaking style', rows: 2 },
  { k: 'promo', th: 'โปรโมชั่นของบ้านหลังนี้', en: 'Promotions for this property', rows: 4 },
  { k: 'details', th: 'รายละเอียดตัวบ้าน (ห้องนอน ห้องน้ำ ฯลฯ)', en: 'Property details', rows: 6 },
];
const mpData = () => { const M = (lib.mp = lib.mp || { name: '', style: '', prompt: '', promo: '', details: '', en: {}, enSrc: {}, withNameStyle: true }); M.contact = M.contact || { name: '', phone: '', line: '', web: '' }; return M; };
// คำสั่งบังคับภาษาผลลัพธ์ (ใส่ต้นและท้ายข้อความเมื่อกด Copy English) · แก้ได้ในกล่อง "ดู/แก้คำแปล"
const MP_EN_DIRECTIVE = 'IMPORTANT - OUTPUT LANGUAGE: Write your entire final answer (the voiceover script / copy) in natural, fluent English only. Even if any instruction below mentions Thai or asks for a Thai script, produce the final result in English. Do not answer in Thai.';
const MP_EN_REMINDER = 'Reminder: the final output must be written entirely in English.';
const mpHash = t => { let h = 0; const s = String(t || ''); for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return h + ':' + s.length; };
function mpCompose(lang) {
  const M = mpData(), get = k => (lang === 'en' ? (M.en[k] || '') : (M[k] || '')).trim(), H = { th: { name: 'ชื่อผู้เล่าเรื่อง', style: 'สไตล์การพูด', promo: 'โปรโมชั่นของบ้านหลังนี้', details: 'รายละเอียดของตัวบ้าน' }, en: { name: 'Narrator name', style: 'Speaking style', promo: 'Promotions for this property', details: 'Property details' } }[lang === 'en' ? 'en' : 'th'];
  const parts = [];
  if (get('prompt')) parts.push(get('prompt'));
  if (M.withNameStyle !== false) { if (get('name')) parts.push(`${H.name}: ${get('name')}`); if (get('style')) parts.push(`${H.style}: ${get('style')}`); }
  if (get('promo')) parts.push(`${H.promo}:\n${get('promo')}`);
  if (get('details')) parts.push(`${H.details}:\n${get('details')}`);
  const C = M.contact, cl = [[lang === 'en' ? 'Name' : 'ชื่อ', C.name], [lang === 'en' ? 'Phone' : 'โทร', C.phone], ['LINE', C.line], [lang === 'en' ? 'Website / Facebook' : 'เว็บไซต์ / Facebook', C.web]].filter(x => String(x[1] || '').trim()).map(x => `${x[0]}: ${String(x[1]).trim()}`);
  if (cl.length) parts.push(`${lang === 'en' ? 'Contact' : 'ข้อมูลติดต่อ'}:\n${cl.join('\n')}`); // ข้อมูลติดต่อไม่แปล (เบอร์/ชื่อ/ลิงก์ต้องตรงตัว)
  if (lang === 'en' && parts.length) { const dir = (M.enDirective != null ? M.enDirective : MP_EN_DIRECTIVE).trim(); if (dir) { parts.unshift(dir); parts.push(MP_EN_REMINDER); } }
  return parts.join('\n\n');
}
// แปลเฉพาะช่องที่ข้อความไทยเปลี่ยนจากที่เคยแปลไว้ (ใช้ translateTh2En ตัวเดียวกับขั้น 4)
async function mpTranslateAll(onProgress) {
  const M = mpData(); let done = 0; const todo = MP_FIELDS.filter(f => (M[f.k] || '').trim() && M.enSrc[f.k] !== mpHash(M[f.k]));
  for (const f of todo) { onProgress && onProgress(`กำลังแปล ${++done}/${todo.length} · ${f.th.split(' (')[0]}`); M.en[f.k] = await translateTh2En(M[f.k]); M.enSrc[f.k] = mpHash(M[f.k]); }
  MP_FIELDS.forEach(f => { if (!(M[f.k] || '').trim()) { M.en[f.k] = ''; M.enSrc[f.k] = mpHash(''); } });
  await saveLib(); return todo.length;
}
async function mpFactsText() { // ดึงข้อมูลบ้านจากคลิปล่าสุด/คลิปที่เปิดอยู่ เป็นข้อความไทย
  let f = (state.pid && state.facts) || null;
  if (!f) { await loadIdx(); const m = [...PROJ.idx].sort((a, b) => b.updated - a.updated)[0]; const p = m && await DB.get('project:' + m.id); f = p && p.facts; }
  if (!f) return '';
  const n = v => String(v || '').trim(), num = v => /^[\d.,]+$/.test(n(v)), L = [];
  if (n(f.name)) L.push(`ชื่อทรัพย์: ${n(f.name)}`); if (n(f.beds)) L.push(`ห้องนอน: ${n(f.beds)} ห้อง`); if (n(f.baths)) L.push(`ห้องน้ำ: ${n(f.baths)} ห้อง`);
  if (n(f.usable)) L.push(`พื้นที่ใช้สอย: ${n(f.usable)}${num(f.usable) ? ' ตารางเมตร' : ''}`); if (n(f.land)) L.push(`ที่ดิน: ${n(f.land)}${num(f.land) ? ' ตารางวา' : ''}`);
  if (n(f.price)) L.push(`ราคา: ${num(f.price) ? (Number(n(f.price).replace(/,/g, '')) < 1000 ? n(f.price) + ' ล้านบาท' : Number(n(f.price).replace(/,/g, '')).toLocaleString('en-US') + ' บาท') : n(f.price)}`);
  if (n(f.highlights)) L.push(`จุดเด่น: ${n(f.highlights)}`); if (n(f.travel)) L.push(`การเดินทาง: ${n(f.travel)}`);
  return L.join('\n');
}
function openPromptPage() {
  document.querySelector('#promptPage')?.remove();
  const M = mpData(), esc = s => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;'), d = document.createElement('div'); d.id = 'promptPage';
  const flash = (btn, t) => { const o = btn.dataset.o || btn.innerHTML; btn.dataset.o = o; btn.innerHTML = t; setTimeout(() => { btn.innerHTML = o; }, 1800); };
  d.innerHTML = `<div class="pp-top"><div><b>มาสเตอร์พรอมต์</b><small>เก็บคำสั่งไว้ใช้ซ้ำทุกคลิป</small></div><button class="ib" id="ppBack">← กลับ</button></div>
    <button class="pp-go" id="ppAi"><span class="pp-ico">🎙️</span><span class="pp-txt"><b>เปิด Google AI Studio · หน้าสร้างเสียง</b><small>aistudio.google.com/generate-speech<br>หน้าที่วางข้อความ · เลือกชื่อผู้พูด (Speaker) · ใส่สไตล์การพูด (Style) · กด Run</small></span><span class="pp-arrow">↗</span></button>
    <div class="pp-row"><label class="fl"><span>① ชื่อผู้เล่าเรื่อง (จดไว้ดู)</span><input class="ct" id="mp_name" maxlength="80" placeholder="เช่น น้องฮัวหิน / พี่ต้น" value="${esc(M.name)}"></label>
      <label class="fl"><span>② สไตล์การพูด (จดไว้ดู)</span><input class="ct" id="mp_style" maxlength="200" placeholder="เช่น อบอุ่น เป็นกันเอง" value="${esc(M.style)}"></label></div>
    <label class="fl"><span>③ พรอมต์หลัก (วางคำสั่งที่เตรียมไว้ ใช้ซ้ำได้ทุกบ้าน)</span><textarea class="sct pp-big" id="mp_prompt" rows="12" placeholder="วางพรอมต์หลักที่นี่">${esc(M.prompt)}</textarea></label>
    <label class="fl"><span>④ โปรโมชั่นของบ้านหลังนี้</span><textarea class="sct" id="mp_promo" rows="4" placeholder="เช่น ฟรีเฟอร์นิเจอร์ ฟรีค่าโอน ผ่อน 0%">${esc(M.promo)}</textarea></label>
    <label class="fl"><span>⑤ รายละเอียดตัวบ้าน (ห้องนอน ห้องน้ำ ที่ดิน ราคา ฯลฯ)</span><textarea class="sct" id="mp_details" rows="6" placeholder="วางรายละเอียดบ้าน หรือกดดึงจากข้อมูลบ้านด้านล่าง">${esc(M.details)}</textarea></label>
    <div class="seg"><b>⑥ ข้อมูลการติดต่อ (ใส่ท้ายข้อความที่คัดลอก ไม่แปล)</b>
      <div class="pp-row"><label class="fl"><span>ชื่อ / บริษัท</span><input class="ct" id="mc_name" maxlength="80" placeholder="เช่น Huahin Properties" value="${esc(M.contact.name)}"></label><label class="fl"><span>เบอร์โทร</span><input class="ct" id="mc_phone" type="tel" maxlength="40" placeholder="เช่น 081-234-5678" value="${esc(M.contact.phone)}"></label></div>
      <div class="pp-row"><label class="fl"><span>LINE</span><input class="ct" id="mc_line" maxlength="60" placeholder="เช่น @huahin" value="${esc(M.contact.line)}"></label><label class="fl"><span>เว็บไซต์ / Facebook</span><input class="ct" id="mc_web" maxlength="200" placeholder="เช่น facebook.com/huahinproperties" value="${esc(M.contact.web)}"></label></div>
      <div class="tools"><button class="ib wide" id="ppContact">📇 ดึงจากเบอร์ติดต่อของแอป</button></div></div>
    <div class="tools"><button class="ib wide" id="ppFacts">🏠 ดึงจากข้อมูลบ้านของคลิปล่าสุด</button><button class="ib wide" id="ppClear">🧹 ล้างช่อง ④ ⑤ (เริ่มบ้านหลังใหม่)</button></div>
    <label class="sw"><input type="checkbox" id="mp_wns" ${M.withNameStyle !== false ? 'checked' : ''}> รวมชื่อผู้เล่าและสไตล์ในข้อความที่คัดลอกด้วย</label>
    <p class="hint" id="ppSave">💾 บันทึกอัตโนมัติ ใช้ซ้ำได้ทุกคลิป</p>
    <div class="pp-btns"><button class="btn" id="ppTh">📋 คัดลอก ภาษาไทย</button><button class="btn alt" id="ppEn">📋 Copy English</button></div>
    <p class="hint" id="ppMsg"></p>
    <div class="pp-gptrow"><button class="pp-ai" id="ppGpt" title="เปิดแชท ChatGPT" aria-label="เปิดแชท ChatGPT">💬</button><b>⑦ ChatGPT</b></div>
    <details id="ppEnBox"><summary>👁 ดู/แก้คำแปลภาษาอังกฤษ (แปลแล้วเก็บไว้ แก้เองได้)</summary><label class="fl"><span>คำสั่งบังคับให้ผลลัพธ์เป็นภาษาอังกฤษ (ใส่ต้นข้อความ + ท้ายข้อความ ตอนกด Copy English)</span><textarea class="sct" id="mp_dir" rows="4">${esc(M.enDirective != null ? M.enDirective : MP_EN_DIRECTIVE)}</textarea></label><div id="ppEnFields"></div></details>`;
  document.body.appendChild(d);
  const $$ = s => d.querySelector(s);
  let t = null;
  const stamp = () => { $$('#ppSave').textContent = '💾 บันทึกแล้ว ' + new Date().toLocaleTimeString('th-TH'); };
  const queue = () => { clearTimeout(t); t = setTimeout(async () => { await saveLib(); stamp(); }, 500); };
  ['name', 'style', 'prompt', 'promo', 'details'].forEach(k => { $$('#mp_' + k).oninput = e => { M[k] = e.target.value; queue(); }; });
  $$('#mp_wns').onchange = e => { M.withNameStyle = e.target.checked; saveLib(); };
  const drawEn = () => { $$('#ppEnFields').innerHTML = MP_FIELDS.map(f => `<label class="fl"><span>${f.en || 'Master prompt'}${M.enSrc[f.k] === mpHash(M[f.k]) ? '' : ' · ยังไม่ได้แปลใหม่'}</span><textarea class="sct" data-en="${f.k}" rows="${Math.min(f.rows, 8)}">${esc(M.en[f.k] || '')}</textarea></label>`).join(''); };
  $$('#mp_dir').oninput = e => { M.enDirective = e.target.value; queue(); };
  drawEn(); $$('#ppEnFields').oninput = e => { const k = e.target.dataset.en; if (k) { M.en[k] = e.target.value; M.enSrc[k] = mpHash(M[k]); queue(); } };
  $$('#ppAi').onclick = () => openExternal(lib.links.tts || 'https://aistudio.google.com/generate-speech');
  [['name', 'mc_name'], ['phone', 'mc_phone'], ['line', 'mc_line'], ['web', 'mc_web']].forEach(([k, id]) => { $$('#' + id).oninput = e => { M.contact[k] = e.target.value; queue(); }; });
  $$('#ppContact').onclick = e => { const c = lib.contact || {}; if (!(c.name || c.phone || c.line)) { alert('ยังไม่ได้ตั้งเบอร์ติดต่อมาตรฐานของแอป (ตั้งที่แท็บ ☎️ ติดต่อ ในขั้น 2)'); return; } M.contact.name = c.name || M.contact.name; M.contact.phone = c.phone || M.contact.phone; M.contact.line = c.line || M.contact.line; ['name', 'phone', 'line'].forEach(k => { $$('#mc_' + k).value = M.contact[k]; }); saveLib(); stamp(); flash(e.currentTarget, '✓ ดึงแล้ว'); };
  $$('#ppGpt').onclick = () => openExternal(lib.links.gpt || 'https://chatgpt.com/');
  $$('#ppBack').onclick = () => d.remove();
  $$('#ppFacts').onclick = async e => { const btn0 = e.currentTarget, t0 = await mpFactsText(); if (!t0) { alert('ยังไม่มีข้อมูลบ้านในคลิปไหนเลย กรอกที่ขั้น 4 ปุ่ม 🏠 ข้อมูลบ้าน ก่อน'); return; } if (M.details.trim() && !confirm('แทนที่ข้อความในช่อง ⑤ ด้วยข้อมูลบ้านของคลิปล่าสุด?')) return; M.details = t0; $$('#mp_details').value = t0; await saveLib(); stamp(); flash(btn0, '✓ ดึงแล้ว'); };
  $$('#ppClear').onclick = async () => { if (!confirm('ล้างช่อง ④ โปรโมชั่น และ ⑤ รายละเอียดบ้าน? (พรอมต์หลัก ชื่อ และสไตล์ยังอยู่)')) return; M.promo = ''; M.details = ''; M.en.promo = ''; M.en.details = ''; $$('#mp_promo').value = ''; $$('#mp_details').value = ''; await saveLib(); drawEn(); stamp(); };
  $$('#ppTh').onclick = async e => { const txt = mpCompose('th'); if (!txt.trim()) { alert('ยังไม่มีข้อความให้คัดลอก'); return; } flash(e.currentTarget, (await copyText(txt)) ? `✓ คัดลอกแล้ว (${txt.length} ตัวอักษร)` : 'คัดลอกไม่ได้'); };
  $$('#ppEn').onclick = async e => {
    const btn = e.currentTarget; btn.disabled = true; const msg = $$('#ppMsg');
    try {
      const n = await mpTranslateAll(s => { msg.textContent = s; }); drawEn();
      const txt = mpCompose('en'); if (!txt.trim()) { alert('ยังไม่มีข้อความให้คัดลอก'); msg.textContent = ''; btn.disabled = false; return; }
      const ok = await copyText(txt); msg.textContent = `${n ? 'แปลใหม่ ' + n + ' ช่อง · ' : 'ใช้คำแปลเดิม · '}คัดลอกภาษาอังกฤษแล้ว (${txt.length} ตัวอักษร) · มีคำสั่งบังคับให้ผลลัพธ์เป็นภาษาอังกฤษ · ตรวจ/แก้คำแปลได้ที่ "ดู/แก้คำแปลภาษาอังกฤษ" ด้านล่าง`; flash(btn, ok ? '✓ Copied' : 'คัดลอกไม่ได้');
    } catch (err) { msg.textContent = '❌ แปลไม่สำเร็จ (ต่ออินเทอร์เน็ตอยู่ไหม?) ' + (err.message || err); }
    btn.disabled = false;
  };
}
