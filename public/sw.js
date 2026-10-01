// public/sw.js
self.addEventListener('install', (event) => {
    self.skipWaiting();
    console.log("Subhams Hub Service Worker Installed!");
});

self.addEventListener('fetch', (event) => {
    // Chrome requires a fetch listener to show the Install Prompt.
    // We leave this empty so it doesn't mess with your fast Render API calls!
});

// 🟢 NEW: Listen for Background Notifications
self.addEventListener('push', function(event) {
    if (event.data) {
        const data = event.data.json();
        
        const options = {
            body: data.body,
            icon: '/logo192.png', // Uses your app's icon
            badge: '/logo192.png',
            vibrate: [200, 100, 200, 100, 200, 100, 200], // Strong WhatsApp-style vibration
            requireInteraction: true, // 🟢 Forces popup to stay on screen until clicked/dismissed
            data: { url: data.url || '/' },
            actions: data.actions || [] // Ready for "Answer / Decline" buttons later
        };

        event.waitUntil(
            self.registration.showNotification(data.title, options)
        );
    }
});

// 🟢 NEW: Handle Notification Clicks
self.addEventListener('notificationclick', function(event) {
    event.notification.close();
    
    if (event.notification.data && event.notification.data.url) {
        event.waitUntil(
            clients.matchAll({ type: 'window' }).then(windowClients => {
                // If app is open in background, bring it to front
                for (var i = 0; i < windowClients.length; i++) {
                    var client = windowClients[i];
                    if (client.url.includes(self.registration.scope) && 'focus' in client) {
                        client.navigate(event.notification.data.url);
                        return client.focus();
                    }
                }
                // If app is fully closed, open it
                if (clients.openWindow) {
                    return clients.openWindow(event.notification.data.url);
                }
            })
        );
    }
});