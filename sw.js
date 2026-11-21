// Service worker: ทำให้แอปเปิดได้แม้ไม่มีเน็ต (เปลี่ยนเลขเวอร์ชันทุกครั้งที่แก้ไฟล์)
const VER = 'studio-v17';
const FILES = ['./', 'index.html', 'style.css', 'app.js', 'renderer.js', 'color.js', 'storyboard.js', 'exporter.js', 'lib/mp4-muxer.js', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(VER).then(c => c.addAll(FILES))); self.skipWaiting(); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VER).map(k => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', e => {
  e.respondWith(fetch(e.request, { cache: 'no-store' }).catch(() => caches.match(e.request, { ignoreSearch: true })));
});
