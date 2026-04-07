const CACHE_NAME = 'mindful-breath-v2';
const ASSETS = [
  '/',
  '/index.html',
  '/bg-zen.png',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE_NAME)
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Chiến lược Stale-While-Revalidate cho toàn bộ yêu cầu
self.addEventListener('fetch', (event) => {
  // Bỏ qua các yêu cầu không phải GET hoặc chrome-extension
  if (event.request.method !== 'GET' || event.request.url.startsWith('chrome-extension')) {
    return;
  }

  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(event.request).then((cachedResponse) => {
        const fetchPromise = fetch(event.request).then((networkResponse) => {
          // Lưu bản mới vào cache nếu fetch thành công
          if (networkResponse && networkResponse.status === 200) {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        }).catch(() => {
          // Nếu mất mạng, trả về bản cached nếu có
          return cachedResponse;
        });

        // Trả về bản cached ngay lập tức nếu có, nếu không thì chờ mạng
        return cachedResponse || fetchPromise;
      });
    })
  );
});

// Lắng nghe sự kiện để cập nhật ngay lập tức khi được yêu cầu từ App.tsx
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
