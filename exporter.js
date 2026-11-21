// เรนเดอร์ MP4 ในเบราว์เซอร์ (WebCodecs + mp4-muxer) ใช้ drawFrame ชุดเดียวกับพรีวิว
const FPS = 30;
const sleep0 = () => new Promise(r => setTimeout(r, 0));

// โหลดรูปแล้วย่อให้พอดีขนาดคลิป กันมือถือหน่วยความจำเต็มเมื่อมีรูปเยอะ
// ย่อรูปให้ใหญ่กว่าคลิป 20% (ซูม Ken Burns แล้วไม่ต้องขยายภาพ → คมกว่า) แล้วเพิ่มความคมนิดๆ
function sharpen(c, amt) {
  const x = c.getContext('2d', { willReadFrequently: true }), w = c.width, h = c.height, src = x.getImageData(0, 0, w, h), s = src.data, out = x.createImageData(w, h), d = out.data, k = amt;
  for (let y = 0; y < h; y++) for (let xx = 0; xx < w; xx++) {
    const i = (y * w + xx) * 4;
    if (y === 0 || xx === 0 || y === h - 1 || xx === w - 1) { d[i] = s[i]; d[i + 1] = s[i + 1]; d[i + 2] = s[i + 2]; d[i + 3] = 255; continue; }
    for (let ch = 0; ch < 3; ch++) { const v = s[i + ch] * (1 + 4 * k) - k * (s[i - 4 + ch] + s[i + 4 + ch] + s[i - w * 4 + ch] + s[i + w * 4 + ch]); d[i + ch] = v < 0 ? 0 : v > 255 ? 255 : v; }
    d[i + 3] = 255;
  }
  x.putImageData(out, 0, 0); return c;
}
async function loadScaled(blob, W, H) {
  const full = await createImageBitmap(blob);
  const k = Math.min(1, Math.max(W / full.width, H / full.height) * 1.2);
  const tw = Math.round(full.width * k), th = Math.round(full.height * k);
  const scaled = await createImageBitmap(full, { resizeWidth: tw, resizeHeight: th, resizeQuality: 'high' });
  full.close();
  const c = document.createElement('canvas'); c.width = tw; c.height = th; c.getContext('2d').drawImage(scaled, 0, 0); scaled.close();
  sharpen(c, 0.28);
  const bmp = await createImageBitmap(c); c.width = c.height = 0;
  return bmp;
}

async function pickCodec(W, H) {
  for (const codec of ['avc1.64002A', 'avc1.4D002A', 'avc1.42002A']) {
    const cfg = { codec, width: W, height: H, bitrate: Math.round(Math.min(24e6, Math.max(8e6, W * H * FPS * 0.16))), framerate: FPS, latencyMode: 'quality' };
    try { const r = await VideoEncoder.isConfigSupported(cfg); if (r.supported) return cfg; } catch (e) {}
  }
  return null;
}

async function renderMp4(blobs, W, H, onProgress, luts, sceneOpt, durs, audio) {
  if (!('VideoEncoder' in window)) throw new Error('เบราว์เซอร์นี้ยังไม่รองรับการเรนเดอร์ ให้ใช้ Chrome บนมือถือ Android');
  const cfg = await pickCodec(W, H);
  if (!cfg) throw new Error('มือถือเครื่องนี้ไม่รองรับการเข้ารหัสวิดีโอขนาดนี้ ลองเลือกขนาดเล็กลง');

  const images = [];
  for (let i = 0; i < blobs.length; i++) { { const bmp = await loadScaled(blobs[i], W, H); images.push(luts ? gradeToCanvas(bmp, luts[i]) : bmp); if (luts) bmp.close(); } onProgress(0.1 * (i + 1) / blobs.length, 'กำลังเตรียมรูป'); }

  let starts = null;
  if (durs) { // durs[i] = { dur, shots } · รูปที่ต้องแสดงนานจะถูกแตกเป็นหลายช็อตคนละมุมกล้อง
    const out = []; starts = [];
    images.forEach((im, i) => { starts.push(out.length); const pl = durs[i]; if (pl.shots > 1) for (let j = 0; j < pl.shots; j++) out.push(kbShot(im, pl.dur / pl.shots, j + (i % 2))); else { im.dur = pl.dur; out.push(im); } });
    starts.push(out.length); images.length = 0; out.forEach(o => images.push(o));
  }
  if (sceneOpt && sceneOpt.length) sceneOpt.forEach(o => images.splice(starts ? starts[Math.min(o.at, starts.length - 1)] : Math.min(o.at, images.length), 0, o.scene)); // เรียงจากท้ายไปต้น ดัชนีจึงไม่เลื่อน
  let acfg = null, acodec = null;
  if (audio) {
    if (!('AudioEncoder' in window)) throw new Error('เบราว์เซอร์นี้ยังเข้ารหัสเสียงไม่ได้ ให้ใช้ Chrome บนมือถือ Android');
    for (const [c, mc] of [['mp4a.40.2', 'aac'], ['opus', 'opus']]) {
      const cfg = { codec: c, sampleRate: audio.sampleRate, numberOfChannels: 1, bitrate: 128000 };
      try { if ((await AudioEncoder.isConfigSupported(cfg)).supported) { acfg = cfg; acodec = mc; break; } } catch (e) {}
    }
    if (!acfg) throw new Error('มือถือเครื่องนี้เข้ารหัสเสียงไม่ได้ ลองปิดเสียงแล้วเรนเดอร์ หรือใช้ Chrome เวอร์ชันล่าสุด');
  }
  const muxer = new Mp4Muxer.Muxer({ target: new Mp4Muxer.ArrayBufferTarget(), video: { codec: 'avc', width: W, height: H }, ...(audio ? { audio: { codec: acodec, numberOfChannels: 1, sampleRate: audio.sampleRate } } : {}), fastStart: 'in-memory' });
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
  await enc.flush(); enc.close();
  if (audio) {
    onProgress(0.97, 'กำลังใส่เสียง');
    let aerr = null; const aenc = new AudioEncoder({ output: (c, m) => muxer.addAudioChunk(c, m), error: e => { aerr = e; } });
    aenc.configure(acfg);
    const N = 4096, data = audio.data;
    for (let o = 0; o < data.length; o += N) {
      if (aerr) throw aerr;
      const n = Math.min(N, data.length - o), ad = new AudioData({ format: 'f32-planar', sampleRate: audio.sampleRate, numberOfFrames: n, numberOfChannels: 1, timestamp: Math.round(o * 1e6 / audio.sampleRate), data: data.subarray(o, o + n) });
      aenc.encode(ad); ad.close();
      while (aenc.encodeQueueSize > 8) await sleep0();
      if ((o / N) % 40 === 0) await sleep0();
    }
    await aenc.flush(); aenc.close();
  }
  muxer.finalize();
  images.forEach(b => b.close && b.close());
  onProgress(1, 'เสร็จแล้ว');
  return new Blob([muxer.target.buffer], { type: 'video/mp4' });
}
