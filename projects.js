// ===== คลิปของฉัน: เก็บหลายโปรเจกต์ + หน้าแรกเป็นการ์ด (แก้ไข / ดู / ดาวน์โหลด / สำเนา / ลบ / เพิ่มคลิปใหม่) =====
const PROJ = { idx: [], urls: [], timer: null };
const newPid = () => 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
async function loadIdx() { PROJ.idx = (await DB.get('projects')) || []; return PROJ.idx; }
const saveIdx = () => DB.set('projects', PROJ.idx).catch(() => {});
// ภาพหน้าปกของคลิป: ที่เลือกไว้ → ภาพเด่นเปิดคลิป → รูปแรก (ใช้ที่การ์ด 'คลิปของฉัน' และดาวน์โหลดเป็นไฟล์ได้ที่ขั้น 7)
function coverItem() { const imgs = state.items.filter(i => i.type === 'image'); if (!imgs.length) return null; return (state.cover && imgs.find(i => i.id === state.cover.id)) || (state.hero && imgs.find(i => i.id === state.hero.id)) || imgs.find(i => i.room === 'หน้าบ้าน/ภายนอก') || imgs[0]; }
const metaOf = id => PROJ.idx.find(m => m.id === id);
// ย้ายงานเดิม (ก่อนมีหลายคลิป) มาเป็นคลิปแรกอัตโนมัติ
async function migrateProjects() {
  await loadIdx(); if (PROJ.idx.length) return;
  const old = await DB.get('project'); if (!old) return;
  const id = newPid(); await DB.set('project:' + id, old);
  PROJ.idx.push({ id, created: Date.now(), updated: Date.now(), name: '', fname: (old.facts && old.facts.name) || '', size: old.size || '4:5', n: (old.items || []).filter(i => i.type === 'image').length });
  await saveIdx();
}
// ล้างแคชที่อ้างตามเลขรูป (ทุกคลิปเริ่มนับรูปจาก 1 ใหม่ จึงต้องล้างเมื่อสลับคลิป)
function clearProjectCaches() {
  try { urlCache.forEach(u => URL.revokeObjectURL(u)); urlCache.clear(); smallCache.forEach(b => b && b.close && b.close()); smallCache.clear(); statCache.clear(); if (typeof tileCache !== 'undefined') tileCache.clear(); } catch (e) {}
  document.querySelectorAll('.sheet').forEach(s => s.remove());
}
function resetState() { Object.keys(state).forEach(k => delete state[k]); Object.assign(state, structuredClone(STATE0)); nextId = 1; }
async function makeThumb(blob) {
  try { const b = await createImageBitmap(blob, { resizeWidth: 240, resizeQuality: 'medium' }), c = document.createElement('canvas'); c.width = b.width; c.height = b.height; c.getContext('2d').drawImage(b, 0, 0); b.close && b.close(); return await new Promise(r => c.toBlob(r, 'image/jpeg', 0.7)); } catch (e) { return null; }
}
// อัปเดตการ์ดของคลิปที่กำลังทำ (ชื่อบ้าน ขนาด จำนวนรูป เวลาแก้ล่าสุด รูปหน้าปก)
async function metaNow() {
  const m = state.pid && metaOf(state.pid); if (!m) return;
  const imgs = state.items.filter(i => i.type === 'image'), first = coverItem() || imgs[0];
  m.fname = (state.facts && state.facts.name) || ''; m.size = state.size; m.n = imgs.length; m.updated = Date.now();
  if (!first) { m.thumb = null; m.thumbId = null; } else if (m.thumbId !== first.id || !m.thumb) { m.thumb = await makeThumb(first.blob); m.thumbId = first.id; }
  await saveIdx();
}
function schedMeta() { clearTimeout(PROJ.timer); PROJ.timer = setTimeout(metaNow, 1500); }
async function persistNow() { if (!state.pid) return; clearTimeout(PROJ.timer); await save(); await metaNow(); }

async function openProject(id, step) {
  await persistNow(); clearProjectCaches();
  const p = await DB.get('project:' + id); resetState(); applyProject(p); state.pid = id; state.home = false; state.step = step == null ? (state.items.length ? 1 : 0) : step;
  render(); window.scrollTo(0, 0);
}
async function createProject() {
  await persistNow(); clearProjectCaches(); await loadIdx();
  const id = newPid(); PROJ.idx.push({ id, created: Date.now(), updated: Date.now(), name: '', fname: '', size: '4:5', n: 0 }); await saveIdx();
  resetState(); state.pid = id; state.home = false; state.step = 0; await save(); render(); window.scrollTo(0, 0);
}
async function goHome() { await persistNow(); state.pid = null; state.home = true; render(); window.scrollTo(0, 0); }
async function markRendered(pid, blob, saved) {
  await loadIdx(); const m = metaOf(pid); if (!m) return;
  m.rendered = { at: Date.now(), size: blob.size, saved, downloaded: false }; await saveIdx();
}
async function markDownloaded(pid) { await loadIdx(); const m = metaOf(pid); if (m && m.rendered) { m.rendered.downloaded = true; await saveIdx(); } }
async function storeVideo(pid, blob) { try { await DB.set('video:' + pid, blob); return true; } catch (e) { return false; } }
async function removeVideo(pid) { await DB.del('video:' + pid).catch(() => {}); await loadIdx(); const m = metaOf(pid); if (m && m.rendered) { m.rendered.saved = false; await saveIdx(); } }
const clipName = m => ((m.name || m.fname || 'คลิป').trim() || 'คลิป').replace(/[\\/:*?"<>|]/g, '_');
const fmtDate = t => new Date(t).toLocaleString('th-TH', { day: 'numeric', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit' });
const mb = n => (n / 1048576).toFixed(0) + ' MB';

async function viewHome() {
  await loadIdx(); PROJ.urls.forEach(u => URL.revokeObjectURL(u)); PROJ.urls = [];
  const list = [...PROJ.idx].sort((a, b) => b.updated - a.updated), sz = id => SIZES.find(s => s.id === id) || SIZES[0];
  const card = m => {
    const s = sz(m.size), url = m.thumb ? URL.createObjectURL(m.thumb) : ''; if (url) PROJ.urls.push(url);
    const r = m.rendered, title = m.name || m.fname || 'คลิปยังไม่มีชื่อ';
    const st = !r ? '📝 ร่าง · ยังไม่ได้เรนเดอร์' : `🎬 ${r.saved ? '💾 ' + mb(r.size) : '⚠️ ไม่ได้เก็บไฟล์'} · ${r.downloaded ? '✅ โหลดแล้ว' : '⬇ ยังไม่โหลด'}`;
    return `<div class="pcard" data-id="${m.id}">
      <div class="pthumb">${url ? `<img src="${url}" alt="">` : '<span>🎬</span>'}<em class="pbadge ${r ? 'ok' : ''}">${r ? '🎬' : 'ร่าง'}</em></div>
      <div class="pinfo"><b>${title.replace(/</g, '&lt;')}</b><small>${s.id} · ${m.n || 0} รูป · ${fmtDate(m.updated)}</small><small class="pst">${st}</small></div>
      <div class="pact"><button class="ib ic" data-a="edit" title="แก้ไข" aria-label="แก้ไข">✏️</button>${r && r.saved ? '<button class="ib ic" data-a="view" title="ดู" aria-label="ดู">▶</button><button class="ib ic" data-a="dl" title="ดาวน์โหลด" aria-label="ดาวน์โหลด">⬇</button>' : ''}<button class="ib ic" data-a="ren" title="เปลี่ยนชื่อ" aria-label="เปลี่ยนชื่อ">✎</button><button class="ib ic" data-a="dup" title="สำเนา" aria-label="สำเนา">⧉</button><button class="ib ic danger" data-a="del" title="ลบ" aria-label="ลบ">🗑</button></div></div>`;
  };
  $('#view').innerHTML = `<h2>คลิปของฉัน</h2>
    <p class="hint">${list.length ? 'แตะ "แก้ไข" เพื่อกลับไปทำต่อ · คลิปที่เรนเดอร์แล้วดูและดาวน์โหลดซ้ำได้จากการ์ด' : 'ยังไม่มีคลิป กด "เพิ่มคลิปใหม่" เพื่อเริ่มทำคลิปแรก'}</p>
    <button class="btn" id="newClip">＋ เพิ่มคลิปใหม่</button>
    <div class="pcards">${list.map(card).join('')}</div>
    <p class="hint" id="stor"></p>`;
  $('#newClip').onclick = createProject;
  try { const e = await navigator.storage.estimate(); $('#stor').textContent = `พื้นที่เก็บงานในเครื่องใช้ไป ${mb(e.usage)} จาก ${mb(e.quota)} · ถ้าพื้นที่ใกล้เต็ม ให้ลบคลิปเก่า (วิดีโอที่เก็บไว้แต่ละคลิปใช้พื้นที่มาก)`; } catch (e) {}
  $('.pcards').onclick = async e => {
    const b = e.target.closest('[data-a]'), c = e.target.closest('.pcard'); if (!c) return; const id = c.dataset.id, m = metaOf(id), a = b ? b.dataset.a : 'edit';
    if (a === 'edit') return openProject(id);
    if (a === 'view') return openProject(id, 6);
    if (a === 'ren') { const n = prompt('ตั้งชื่อคลิปนี้', m.name || m.fname || ''); if (n != null) { m.name = n.trim(); await saveIdx(); viewHome(); } return; }
    if (a === 'dup') { const p = await DB.get('project:' + id), nid = newPid(); await DB.set('project:' + nid, p); PROJ.idx.push({ ...m, id: nid, name: (m.name || m.fname || 'คลิป') + ' (สำเนา)', created: Date.now(), updated: Date.now(), rendered: undefined }); await saveIdx(); return viewHome(); }
    if (a === 'del') { if (!confirm(`ลบคลิป "${m.name || m.fname || 'ไม่มีชื่อ'}" ถาวร?\n(รูป สคริปต์ และวิดีโอที่เก็บไว้ จะหายทั้งหมด ลบแล้วกู้คืนไม่ได้)`)) return; await DB.del('project:' + id).catch(() => {}); await DB.del('video:' + id).catch(() => {}); PROJ.idx = PROJ.idx.filter(x => x.id !== id); await saveIdx(); return viewHome(); }
    if (a === 'dl') { const v = await DB.get('video:' + id); if (!v) { alert('ไม่พบไฟล์วิดีโอที่เก็บไว้'); return; } const u = URL.createObjectURL(v), l = document.createElement('a'); l.href = u; l.download = clipName(m) + '.mp4'; document.body.appendChild(l); l.click(); l.remove(); setTimeout(() => URL.revokeObjectURL(u), 60000); await markDownloaded(id); return viewHome(); }
  };
}
