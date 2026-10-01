// frontend/public/sw.js

self.addEventListener('install', (event) => {
    self.skipWaiting();
    console.log("Subhams Hub Service Worker Installed!");
});

self.addEventListener('fetch', (event) => {
    // Required for PWA
});

// 🟢 RECEIVE THE URGENT PUSH AND FORCE THE HEADS-UP BANNER
self.addEventListener('push', function(event) {
    if (event.data) {
        const data = event.data.json();
        
        const options = {
            body: data.body,
            icon: '/logo192.png',
            badge: '/logo192.png',
            // Aggressive continuous vibration pattern (simulates a ringing phone)
            vibrate: [500, 250, 500, 250, 500, 250, 500, 250, 500], 
            requireInteraction: true, 
            renotify: true, // Forces Android to drop the banner again even if one is already there
            tag: 'urgent-alert', // Required for renotify to work
            actions: [
                { action: 'open', title: '🟢 View Order / Message' }
            ],
            data: { url: data.url || '/' }
        };

        event.waitUntil(
            self.registration.showNotification(data.title, options)
        );
    }
});

// 🟢 2. HANDLE THE USER TAPPING THE NOTIFICATION
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