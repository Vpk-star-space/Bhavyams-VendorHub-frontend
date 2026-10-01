// frontend/public/sw.js

self.addEventListener('install', (event) => {
    self.skipWaiting();
    console.log("Subhams Hub Service Worker Installed!");
});

self.addEventListener('fetch', (event) => {});

// 🟢 UNIVERSAL HANDLER FOR ALL NOTIFICATIONS
self.addEventListener('push', function(event) {
    if (event.data) {
        const data = event.data.json();
        
        const options = {
            body: data.body,
            icon: '/logo192.png',
            badge: '/logo192.png',
            vibrate: [400, 200, 400, 200, 400], // Strong vibration for mobile attention
            requireInteraction: true, // Stays on screen until touched
            renotify: true, 
            tag: 'subhams-hub-alert', 
            actions: [
                { action: 'open', title: '🟢 View Now' }
            ],
            data: { url: data.url || '/' }
        };

        event.waitUntil(
            self.registration.showNotification(data.title, options)
        );
    }
});

self.addEventListener('notificationclick', function(event) {
    event.notification.close(); 
    
    const urlToOpen = event.notification.data.url;

    if (urlToOpen) {
        event.waitUntil(
            clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
                for (var i = 0; i < windowClients.length; i++) {
                    var client = windowClients[i];
                    if (client.url.includes(self.registration.scope) && 'focus' in client) {
                        client.navigate(urlToOpen);
                        return client.focus();
                    }
                }
                if (clients.openWindow) {
                    return clients.openWindow(urlToOpen);
                }
            })
        );
    }
});