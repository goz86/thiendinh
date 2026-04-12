const CACHE_NAME = 'mindful-breath-v3';
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


self.addEventListener('push', (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch {
      data = { title: 'Mindful Breath', body: event.data.text() };
    }
  }

  const title = data.title || 'Đã đến giờ hít thở chánh niệm 🌿';
  const options = {
    body: data.body || 'Mở ứng dụng để bắt đầu một buổi thiền ngắn, nuôi dưỡng sự bình an trong bạn.',
    icon: '/icon512_maskable.png',
    badge: '/icon512_maskable.png',
    vibrate: [200, 100, 200],
    data: {
      url: data.url || '/'
    }
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});
