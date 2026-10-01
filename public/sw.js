// frontend/public/sw.js

self.addEventListener('install', (event) => {
    self.skipWaiting();
    console.log("Subhams Hub Service Worker Installed!");
});

self.addEventListener('fetch', (event) => {
    // Required for PWA
});

// 🟢 1. RECEIVE THE URGENT PUSH AND STICK IT TO THE SCREEN
self.addEventListener('push', function(event) {
    if (event.data) {
        const data = event.data.json();
        
        const options = {
            body: data.body,
            icon: '/logo192.png',
            badge: '/logo192.png',
            vibrate: [300, 100, 300, 100, 300], // Strong vibration helps trigger Android's top-popup
            requireInteraction: true, // 🟢 THIS IS THE SECRET: It STAYS on screen until the user swipes it away or clicks it!
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