// public/sw.js
self.addEventListener('install', (event) => {
    self.skipWaiting();
    console.log("Subhams Hub Service Worker Installed!");
});

self.addEventListener('fetch', (event) => {
    // Chrome requires a fetch listener to show the Install Prompt.
    // We leave this empty so it doesn't mess with your fast Render API calls!
});

// 🟢 NEW: High-Priority "Call Style" Background Notifications
self.addEventListener('push', function(event) {
    if (event.data) {
        const data = event.data.json();
        
        const options = {
            body: data.body,
            icon: '/logo192.png', 
            badge: '/logo192.png',
            // Massive ringing vibration pattern
            vibrate: [500, 250, 500, 250, 500, 250, 500, 250, 500, 250, 500], 
            requireInteraction: true, // Forces it to stay on screen
            renotify: true, // If multiple messages come, it rings again
            tag: data.tag || 'subhams-alert', // Groups notifications
            actions: [
                { action: 'answer', title: '🟢 Open / Answer' },
                { action: 'decline', title: '🔴 Decline' }
            ],
            data: { url: data.url || '/' }
        };

        event.waitUntil(
            self.registration.showNotification(data.title, options)
        );
    }
});

// 🟢 NEW: Handle Button Clicks (Answer vs Decline)
self.addEventListener('notificationclick', function(event) {
    event.notification.close();
    
    // If they clicked decline, do nothing
    if (event.action === 'decline') return;

    // If they clicked Answer or the main body, open the app
    if (event.notification.data && event.notification.data.url) {
        event.waitUntil(
            clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
                for (var i = 0; i < windowClients.length; i++) {
                    var client = windowClients[i];
                    if (client.url.includes(self.registration.scope) && 'focus' in client) {
                        client.navigate(event.notification.data.url);
                        return client.focus();
                    }
                }
                if (clients.openWindow) {
                    return clients.openWindow(event.notification.data.url);
                }
            })
        );
    }
});