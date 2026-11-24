// ===== มาสเตอร์พรอมต์: หน้าเก็บคำสั่งสำหรับ Google AI Studio (ชื่อผู้เล่า · สไตล์ · พรอมต์หลัก · โปรโมชั่น · รายละเอียดบ้าน) + ปุ่มคัดลอกไทย/อังกฤษ =====
// เก็บในคลังกลาง (lib.mp) ใช้ซ้ำทุกคลิป · ภาษาอังกฤษแปลจากไทยอัตโนมัติ (แก้เองได้) เก็บคำแปลไว้ ไม่แปลซ้ำถ้าข้อความไทยไม่เปลี่ยน
const MP_FIELDS = [
  { k: 'prompt', th: 'พรอมต์หลัก (คำสั่งให้ AI เรียบเรียงและอ่าน)', en: '', rows: 12 },
  { k: 'name', th: 'ชื่อผู้เล่าเรื่อง', en: 'Narrator name', rows: 1 },
  { k: 'style', th: 'สไตล์การพูด', en: 'Speaking style', rows: 2 },
  { k: 'promo', th: 'โปรโมชั่นของบ้านหลังนี้', en: 'Promotions for this property', rows: 4 },
  { k: 'details', th: 'รายละเอียดตัวบ้าน (ห้องนอน ห้องน้ำ ฯลฯ)', en: 'Property details', rows: 6 },
];
// ลำดับเรื่องรายห้อง: ผู้ใช้กรอกรายละเอียดจริงตอนไปถึงหน้างาน (เช่น สีผ้าปู) · ช่องที่ว่างถูกข้าม · ปิดท้ายด้วยข้อมูลติดต่ออัตโนมัติ
const MP_SECS = [
  { k: 's1', th: 'เปิดคลิป: ทักทาย + ดึงโปรโมชั่น + จั่วหัวว่าหัวหินน่าเที่ยว/น่าอยู่อย่างไร', en: 'Opening: greeting, promotion hook, why Hua Hin is a great place', ph: '', fixed: { th: 'เริ่มด้วยคำทักทายตามที่ระบุในพรอมต์หลักด้านบน (เช่น สวัสดีครับ/ค่ะ) แล้วดึงโปรโมชั่นเด่นจากหัวข้อ "โปรโมชั่นของบ้านหลังนี้" มาพูดให้น่าสนใจ จากนั้นเกริ่นสั้น ๆ ว่าหัวหินน่าเที่ยวและน่าอยู่อย่างไร (ทะเล ตลาด ร้านอาหาร สนามกอล์ฟ โรงพยาบาล ความสงบแบบรีสอร์ท)', en: 'Open with the greeting set in the main prompt above, then pitch the key promotion from "Promotions for this property" in an engaging way, then briefly say why Hua Hin is a great place to visit and live (sea, markets, restaurants, golf, hospitals, calm resort feel).' } },
  { k: 's2', th: 'นำเข้าสู่ตัวบ้าน: บรรยากาศภายนอก หน้าบ้าน ที่จอดรถ', en: 'Arriving at the house: exterior, front of the house, parking', ph: 'ไกด์กันลืม: เส้นทางเดินทางเข้า · ระบบรักษาความปลอดภัยของโครงการ · ที่จอดรถ · บรรยากาศรอบด้าน' },
  { k: 's3', th: 'ห้องโถง / ห้องนั่งเล่น และห้องครัว', en: 'Hall / living area and kitchen', ph: 'เช่น เพดานสูง โซฟาสีเทา ครัวเปิดเคาน์เตอร์หินอ่อน เครื่องดูดควัน' },
  { k: 's4', th: 'ห้องนอนมาสเตอร์', en: 'Master bedroom', ph: 'เช่น ผ้าปูสีชมพู หัวเตียงสีเทา ตู้เสื้อผ้าบิวท์อิน โต๊ะเครื่องแป้ง ห้องน้ำในตัว' },
  { k: 's5', th: 'ห้องนอนที่ 2', en: 'Bedroom 2', ph: 'เช่น ผ้าปูสีแดง เตียงคู่ ระเบียงเล็ก' },
  { k: 's6', th: 'ห้องนอนที่ 3', en: 'Bedroom 3', ph: 'เช่น ผ้าปูสีขาว มีโต๊ะทำงาน' },
  { k: 's7', th: 'ห้องนอนที่ 4 / ห้องพิเศษอื่น ๆ (ถ้ามี)', en: 'Bedroom 4 / other special rooms (if any)', ph: 'เช่น ห้องนอนที่ 4 หรือห้องกรีนเฮาส์ ห้องทำงาน ห้องเก็บของ' },
  { k: 's8', th: 'ห้องน้ำ', en: 'Bathrooms', ph: 'เช่น กระเบื้องหินอ่อน ฝักบัวเรนชาวเวอร์ ห้องกระจกกั้น' },
  { k: 's9', th: 'มุมนั่งเล่น / สระว่ายน้ำ', en: 'Sitting corner / swimming pool', ph: 'เช่น สระส่วนตัวกว้าง 3x8 เมตร ศาลานั่งเล่น เก้าอี้อาบแดด' },
  { k: 's10', th: 'สวน / ระเบียง', en: 'Garden / terrace', ph: 'เช่น สวนหย่อมปลูกต้นปาล์ม สนามหญ้า ที่นั่งชมวิวภูเขา' },
];
MP_SECS.filter(s => !s.fixed).forEach(s => MP_FIELDS.push({ k: s.k, th: s.th, en: s.en, rows: 3 }));
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
  const secs = MP_SECS.map((s, i) => [i + 1, s, s.fixed ? s.fixed[lang === 'en' ? 'en' : 'th'] : get(s.k)]).filter(x => x[2]);
  if (secs.length) parts.push((lang === 'en' ? 'Video story order (write the script in THIS order; skip any section that is not listed; finish with a short closing and the contact details below):' : 'ลำดับเรื่องของคลิป (ให้เขียนสคริปต์ตามลำดับนี้ ช่องที่ไม่ได้ระบุให้ข้ามไป และปิดท้ายด้วยการสรุปสั้น ๆ พร้อมข้อมูลติดต่อด้านล่าง):') + '\n' + secs.map(([n, s, t]) => `${n}) ${lang === 'en' ? s.en : s.th.split(' (')[0]}: ${t}`).join('\n'));
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
    <div class="seg" id="ppSecs"><b>🎬 ลำดับเรื่องรายห้อง (ช่อง 1–10) <span class="pp-cnt" id="ppCnt"></span></b>
      <p class="hint">กรอกรายละเอียดจริงของแต่ละห้องตอนไปถึงหน้างาน เช่น สีผ้าปู ของตกแต่ง · ช่อง 1 ตั้งไว้ให้เองแล้ว · ช่อง 2–10 ช่องไหนไม่มีก็เว้นว่าง แอปให้ AI ข้ามไป · ช่องที่กรอกแล้วขึ้นเครื่องหมายเขียว ✓ · สคริปต์เขียนตามลำดับ 1 → 10 แล้วปิดท้ายด้วยข้อมูลติดต่อ</p>
      ${MP_SECS.map((s, i) => `<div class="pp-sec" data-sec="${s.k}"><div class="pp-sech"><span class="pp-dot" id="dot_${s.k}">○</span><b>ช่อง ${i + 1} · ${s.th}</b></div>${s.fixed ? `<div class="hint" style="margin:0 0 0 34px">✓ ตั้งไว้ให้อัตโนมัติ ไม่ต้องกรอก: ทักทายตามพรอมต์หลัก + โปรโมชั่นจากช่อง ④ + เกริ่นว่าหัวหินน่าอยู่</div>` : `<textarea class="sct" id="ms_${s.k}" rows="3" placeholder="${esc(s.ph)}">${esc(M[s.k])}</textarea>`}</div>`).join('')}
    </div>
    <div class="seg"><b>⑥ ข้อมูลการติดต่อ (ใส่ท้ายข้อความที่คัดลอก ไม่แปล)</b>
      <div class="pp-row"><label class="fl"><span>ชื่อ / บริษัท</span><input class="ct" id="mc_name" maxlength="80" placeholder="เช่น Huahin Properties" value="${esc(M.contact.name)}"></label><label class="fl"><span>เบอร์โทร</span><input class="ct" id="mc_phone" type="tel" maxlength="40" placeholder="เช่น 081-234-5678" value="${esc(M.contact.phone)}"></label></div>
      <div class="pp-row"><label class="fl"><span>LINE</span><input class="ct" id="mc_line" maxlength="60" placeholder="เช่น @huahin" value="${esc(M.contact.line)}"></label><label class="fl"><span>เว็บไซต์ / Facebook</span><input class="ct" id="mc_web" maxlength="200" placeholder="เช่น facebook.com/huahinproperties" value="${esc(M.contact.web)}"></label></div>
      <div class="tools"><button class="ib wide" id="ppContact">📇 ดึงจากเบอร์ติดต่อของแอป</button></div></div>
    <div class="tools"><button class="ib wide" id="ppFacts">🏠 ดึงจากข้อมูลบ้านของคลิปล่าสุด</button><button class="ib wide" id="ppClear">🧹 ล้างช่อง ④ ⑤ และช่อง 1–10 (เริ่มบ้านหลังใหม่)</button></div>
    <label class="sw"><input type="checkbox" id="mp_wns" ${M.withNameStyle !== false ? 'checked' : ''}> รวมชื่อผู้เล่าและสไตล์ในข้อความที่คัดลอกด้วย</label>
    <p class="hint" id="ppSave">💾 บันทึกอัตโนมัติ ใช้ซ้ำได้ทุกคลิป</p>
    <div class="pp-btns"><button class="btn" id="ppTh"><span class="pp-b1">💬 สคริปต์ ภาษาไทย</span><small>คัดลอก แล้วเปิด ChatGPT</small></button><button class="btn alt" id="ppEn"><span class="pp-b1">💬 สคริปต์ English</span><small>คัดลอก แล้วเปิด ChatGPT</small></button></div>
    <p class="hint" id="ppMsg"></p>
    <p class="hint">คัดลอกอย่างเดียว (ไม่เปิด ChatGPT): <button class="lnk" id="ppCpTh">ไทย</button> · <button class="lnk" id="ppCpEn">English</button></p>
    <details id="ppEnBox"><summary>👁 ดู/แก้คำแปลภาษาอังกฤษ (แปลแล้วเก็บไว้ แก้เองได้)</summary><label class="fl"><span>คำสั่งบังคับให้ผลลัพธ์เป็นภาษาอังกฤษ (ใส่ต้นข้อความ + ท้ายข้อความ ตอนกด Copy English)</span><textarea class="sct" id="mp_dir" rows="4">${esc(M.enDirective != null ? M.enDirective : MP_EN_DIRECTIVE)}</textarea></label><div id="ppEnFields"></div></details>`;
  document.body.appendChild(d);
  const $$ = s => d.querySelector(s);
  let t = null;
  const stamp = () => { $$('#ppSave').textContent = '💾 บันทึกแล้ว ' + new Date().toLocaleTimeString('th-TH'); };
  const queue = () => { clearTimeout(t); t = setTimeout(async () => { await saveLib(); stamp(); }, 500); };
  ['name', 'style', 'prompt', 'promo', 'details'].forEach(k => { $$('#mp_' + k).oninput = e => { M[k] = e.target.value; queue(); }; });
  const dots = () => { let n = 0; MP_SECS.forEach(s => { const on = s.fixed ? true : !!(M[s.k] || '').trim(); if (on) n++; const d1 = $$('#dot_' + s.k); d1.textContent = on ? '✓' : '○'; d1.classList.toggle('ok', on); }); $$('#ppCnt').textContent = `· กรอกแล้ว ${n}/10`; };
  MP_SECS.filter(s => !s.fixed).forEach(s => { $$('#ms_' + s.k).oninput = e => { M[s.k] = e.target.value; dots(); queue(); }; });
  dots();
  $$('#mp_wns').onchange = e => { M.withNameStyle = e.target.checked; saveLib(); };
  const drawEn = () => { $$('#ppEnFields').innerHTML = MP_FIELDS.map(f => `<label class="fl"><span>${f.en || 'Master prompt'}${M.enSrc[f.k] === mpHash(M[f.k]) ? '' : ' · ยังไม่ได้แปลใหม่'}</span><textarea class="sct" data-en="${f.k}" rows="${Math.min(f.rows, 8)}">${esc(M.en[f.k] || '')}</textarea></label>`).join(''); };
  $$('#mp_dir').oninput = e => { M.enDirective = e.target.value; queue(); };
  drawEn(); $$('#ppEnFields').oninput = e => { const k = e.target.dataset.en; if (k) { M.en[k] = e.target.value; M.enSrc[k] = mpHash(M[k]); queue(); } };
  $$('#ppAi').onclick = () => openExternal(lib.links.tts || 'https://aistudio.google.com/generate-speech');
  [['name', 'mc_name'], ['phone', 'mc_phone'], ['line', 'mc_line'], ['web', 'mc_web']].forEach(([k, id]) => { $$('#' + id).oninput = e => { M.contact[k] = e.target.value; queue(); }; });
  $$('#ppContact').onclick = e => { const c = lib.contact || {}; if (!(c.name || c.phone || c.line)) { alert('ยังไม่ได้ตั้งเบอร์ติดต่อมาตรฐานของแอป (ตั้งที่แท็บ ☎️ ติดต่อ ในขั้น 2)'); return; } M.contact.name = c.name || M.contact.name; M.contact.phone = c.phone || M.contact.phone; M.contact.line = c.line || M.contact.line; ['name', 'phone', 'line'].forEach(k => { $$('#mc_' + k).value = M.contact[k]; }); saveLib(); stamp(); flash(e.currentTarget, '✓ ดึงแล้ว'); };
  $$('#ppBack').onclick = () => d.remove();
  $$('#ppFacts').onclick = async e => { const btn0 = e.currentTarget, t0 = await mpFactsText(); if (!t0) { alert('ยังไม่มีข้อมูลบ้านในคลิปไหนเลย กรอกที่ขั้น 4 ปุ่ม 🏠 ข้อมูลบ้าน ก่อน'); return; } if (M.details.trim() && !confirm('แทนที่ข้อความในช่อง ⑤ ด้วยข้อมูลบ้านของคลิปล่าสุด?')) return; M.details = t0; $$('#mp_details').value = t0; await saveLib(); stamp(); flash(btn0, '✓ ดึงแล้ว'); };
  $$('#ppClear').onclick = async () => { if (!confirm('ล้างช่อง ④ โปรโมชั่น ⑤ รายละเอียดบ้าน และช่องรายห้อง 1–10? (พรอมต์หลัก ชื่อ สไตล์ และข้อมูลติดต่อยังอยู่)')) return; M.promo = ''; M.details = ''; M.en.promo = ''; M.en.details = ''; MP_SECS.filter(s => !s.fixed).forEach(s => { M[s.k] = ''; M.en[s.k] = ''; $$('#ms_' + s.k).value = ''; }); $$('#mp_promo').value = ''; $$('#mp_details').value = ''; await saveLib(); drawEn(); dots(); stamp(); };
  const GPT = () => lib.links.gpt || 'https://chatgpt.com/';
  const prepThai = async () => { const txt = mpCompose('th'); if (!txt.trim()) { alert('ยังไม่มีข้อความให้คัดลอก'); return null; } return (await copyText(txt)) ? txt : null; };
  // ภาษาอังกฤษ: แปลเฉพาะช่องที่เปลี่ยน (ใช้ cache) แล้วคัดลอก · คืนค่า { txt, n, slow }
  const prepEn = async () => {
    const msg = $$('#ppMsg'), t0 = performance.now();
    const n = await mpTranslateAll(s => { msg.textContent = s; }); drawEn();
    const txt = mpCompose('en'); if (!txt.trim()) { alert('ยังไม่มีข้อความให้คัดลอก'); return null; }
    const ok = await copyText(txt); if (!ok) return null;
    return { txt, n, slow: performance.now() - t0 > 3500 };
  };
  $$('#ppTh').onclick = async e => {
    const b0 = e.currentTarget; b0.disabled = true; const txt = await prepThai(); b0.disabled = false; if (!txt) return;
    $$('#ppMsg').textContent = `คัดลอกสคริปต์ภาษาไทยแล้ว (${txt.length} ตัวอักษร) · เปิด ChatGPT แล้ววางในช่องแชท กดส่ง`; openExternal(GPT());
  };
  let enReady = false;
  $$('#ppEn').onclick = async e => {
    const b0 = e.currentTarget, msg = $$('#ppMsg'); b0.disabled = true;
    try {
      const r = await prepEn(); if (!r) { b0.disabled = false; return; }
      const label = b0.querySelector('small');
      if (r.slow && !enReady) { enReady = true; msg.textContent = '✓ แปลและคัดลอกแล้ว · แตะ "สคริปต์ English" อีกครั้ง เพื่อเปิด ChatGPT'; label.textContent = 'แปลเสร็จแล้ว แตะอีกครั้งเพื่อเปิด ChatGPT'; b0.disabled = false; return; }
      enReady = false; label.textContent = 'คัดลอก แล้วเปิด ChatGPT';
      msg.textContent = `${r.n ? 'แปลใหม่ ' + r.n + ' ช่อง · ' : 'ใช้คำแปลเดิม · '}คัดลอกสคริปต์ English แล้ว (${r.txt.length} ตัวอักษร) · เปิด ChatGPT แล้ววางในช่องแชท กดส่ง · ผลลัพธ์จะเป็นภาษาอังกฤษ`; openExternal(GPT());
    } catch (err) { msg.textContent = '❌ แปลไม่สำเร็จ (ต่ออินเทอร์เน็ตอยู่ไหม?) ' + (err.message || err); }
    b0.disabled = false;
  };
  $$('#ppCpTh').onclick = async e => { const b0 = e.currentTarget, txt = await prepThai(); if (txt) flash(b0, '✓ คัดลอกแล้ว'); };
  $$('#ppCpEn').onclick = async e => { const b0 = e.currentTarget; b0.disabled = true; try { const r = await prepEn(); if (r) flash(b0, '✓ คัดลอกแล้ว'); } catch (err) { $$('#ppMsg').textContent = '❌ แปลไม่สำเร็จ ' + (err.message || err); } b0.disabled = false; };
}
