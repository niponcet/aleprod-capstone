// Service Worker para PWA y Web Push Notifications - Alejandra Producciones
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Interceptor de mensajes Web Push en segundo plano
self.addEventListener('push', (event) => {
  let title = '¡Montaje Iniciado!';
  let options = {
    body: 'El Coordinador ha iniciado un nuevo montaje en terreno.',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    data: {},
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      title = payload.title || payload.notification?.title || title;
      options.body = payload.body || payload.notification?.body || options.body;
      options.data = payload.data || {};
    } catch {
      options.body = event.data.text();
    }
  }

  event.waitUntil(self.registration.showNotification(title, options));
});

// Manejo de pulsación (Tap) sobre la notificación web
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const eventData = event.notification.data || {};

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          client.postMessage({
            type: 'NOTIFICATION_CLICK',
            data: eventData,
          });
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow('/');
      }
    })
  );
});

