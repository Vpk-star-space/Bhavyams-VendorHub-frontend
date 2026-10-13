// frontend/public/sw.js

self.addEventListener('install', (event) => {
    self.skipWaiting();
    console.log("Subhams Hub Service Worker Installed!");
});

self.addEventListener('activate', (event) => {
    event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {});

self.addEventListener('push', function(event) {
    if (!event.data) return;

    let data = {};
    try {
        data = event.data.json();
    } catch (e) {
        data = { title: "Subhams Hub", body: event.data.text() };
    }

    const targetUrl = data.url || data.link || (data.roomId 
        ? `/incoming-call?callerName=${encodeURIComponent(data.title)}&roomId=${data.roomId}&type=${data.type || 'message'}`
        : '/');

    // 🟢 FIXED: Added 'image: data.image' so Chrome renders your HD push banners safely!
    const options = {
        body: data.body || "New update from Subhams Hub",
        icon: data.icon || '/logo192.png',
        badge: '/favicon.ico',
        image: data.image || null, 
        vibrate: [200, 100, 200],
        requireInteraction: Boolean(data.requireInteraction),
        data: { url: targetUrl },
        actions: data.roomId 
            ? [{ action: 'answer', title: '🟢 Open Call' }] 
            : [{ action: 'open', title: 'View' }]
    };

    const notificationPromise = self.registration.showNotification(
        data.title || "Subhams Hub Alert", 
        options
    );

    event.waitUntil(notificationPromise);
});

// 🟢 FIXED: Smooth client focus and targeted routing to prevent refresh loops
self.addEventListener('notificationclick', function(event) {
    event.notification.close();
    const destination = (event.notification.data && event.notification.data.url) 
        ? event.notification.data.url 
        : '/';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
            // Check if app is already open in a tab
            for (let i = 0; i < windowClients.length; i++) {
                let client = windowClients[i];
                if ('focus' in client) {
                    client.focus();
                    client.postMessage({ type: 'NAVIGATE_TO', url: destination });
                    return;
                }
            }
            // Otherwise open a fresh window pointing directly to the link
            if (clients.openWindow) {
                return clients.openWindow(destination);
            }
        })
    );
});