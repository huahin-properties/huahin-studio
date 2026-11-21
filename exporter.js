// เรนเดอร์ MP4 ในเบราว์เซอร์ (WebCodecs + mp4-muxer) ใช้ drawFrame ชุดเดียวกับพรีวิว
const FPS = 30;
const sleep0 = () => new Promise(r => setTimeout(r, 0));

// โหลดรูปแล้วย่อให้พอดีขนาดคลิป กันมือถือหน่วยความจำเต็มเมื่อมีรูปเยอะ
async function loadScaled(blob, W, H) {
  const full = await createImageBitmap(blob);
  const k = Math.max(W / full.width, H / full.height);
  const scaled = await createImageBitmap(full, { resizeWidth: Math.round(full.width * k), resizeHeight: Math.round(full.height * k), resizeQuality: 'high' });
  full.close();
  return scaled;
}

async function pickCodec(W, H) {
  for (const codec of ['avc1.64002A', 'avc1.4D002A', 'avc1.42002A']) {
    const cfg = { codec, width: W, height: H, bitrate: 8_000_000, framerate: FPS };
    try { const r = await VideoEncoder.isConfigSupported(cfg); if (r.supported) return cfg; } catch (e) {}
  }
  return null;
}

async function renderMp4(blobs, W, H, onProgress, luts, sceneOpt) {
  if (!('VideoEncoder' in window)) throw new Error('เบราว์เซอร์นี้ยังไม่รองรับการเรนเดอร์ ให้ใช้ Chrome บนมือถือ Android');
  const cfg = await pickCodec(W, H);
  if (!cfg) throw new Error('มือถือเครื่องนี้ไม่รองรับการเข้ารหัสวิดีโอขนาดนี้ ลองเลือกขนาดเล็กลง');

  const images = [];
  for (let i = 0; i < blobs.length; i++) { { const bmp = await loadScaled(blobs[i], W, H); images.push(luts ? gradeToCanvas(bmp, luts[i]) : bmp); if (luts) bmp.close(); } onProgress(0.1 * (i + 1) / blobs.length, 'กำลังเตรียมรูป'); }

  if (sceneOpt && sceneOpt.length) sceneOpt.forEach(o => images.splice(Math.min(o.at, images.length), 0, o.scene)); // เรียงจากท้ายไปต้น ดัชนีจึงไม่เลื่อน
  const muxer = new Mp4Muxer.Muxer({ target: new Mp4Muxer.ArrayBufferTarget(), video: { codec: 'avc', width: W, height: H }, fastStart: 'in-memory' });
  let encErr = null;
  const enc = new VideoEncoder({ output: (c, m) => muxer.addVideoChunk(c, m), error: e => { encErr = e; } });
  enc.configure(cfg);

  const canvas = document.createElement('canvas'); canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');
  const frames = Math.round(totalDuration(images) * FPS);
  for (let f = 0; f < frames; f++) {
    if (encErr) throw encErr;
    drawFrame(ctx, W, H, images, f / FPS);
    const vf = new VideoFrame(canvas, { timestamp: Math.round(f * 1e6 / FPS), duration: Math.round(1e6 / FPS) });
    enc.encode(vf, { keyFrame: f % 60 === 0 });
    vf.close();
    while (enc.encodeQueueSize > 4) await sleep0();
    if (f % 5 === 0) { onProgress(0.1 + 0.9 * f / frames, 'กำลังเรนเดอร์'); await sleep0(); }
  }
  await enc.flush(); enc.close(); muxer.finalize();
  images.forEach(b => b.close && b.close());
  onProgress(1, 'เสร็จแล้ว');
  return new Blob([muxer.target.buffer], { type: 'video/mp4' });
}
