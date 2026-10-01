// frontend/public/sw.js

self.addEventListener('install', (event) => {
    self.skipWaiting();
    console.log("Subhams Hub Service Worker Installed!");
});

self.addEventListener('fetch', (event) => {});
self.addEventListener('push', function(event) {
    if (event.data) {
        const data = event.data.json();
        
        // 1. Build the URL for the Full-Screen Call Page
        const callUrl = `/incoming-call?callerName=${encodeURIComponent(data.title)}&roomId=${data.roomId}&type=${data.type || 'message'}`;
        
        // 2. We STILL show a high-priority notification as a fallback in case the OS blocks auto-opening
        const options = {
            body: data.body,
            icon: '/logo192.png',
            vibrate: [500, 250, 500, 250, 500, 250, 500],
            requireInteraction: true,
            data: { url: callUrl },
            actions: [
                { action: 'answer', title: '🟢 Answer' }
            ]
        };

        const notificationPromise = self.registration.showNotification(data.title, options);

        // 3. 🟢 THE MAGIC TRICK: Force open the Web App instantly!
        const openWindowPromise = clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then(windowClients => {
                // If app is already open, just redirect the active window to the call screen
                for (let i = 0; i < windowClients.length; i++) {
                    let client = windowClients[i];
                    if (client.url.includes(self.registration.scope) && 'focus' in client) {
                        client.navigate(callUrl);
                        return client.focus();
                    }
                }
                // If app is closed, FORCE OPEN it (Works best when PWA is installed)
                if (clients.openWindow) {
                    return clients.openWindow(callUrl);
                }
            });

        // Wait for both to execute
        event.waitUntil(Promise.all([notificationPromise, openWindowPromise]));
    }
});

self.addEventListener('notificationclick', function(event) {
    event.notification.close();
    if (event.notification.data && event.notification.data.url) {
        event.waitUntil(
            clients.matchAll({ type: 'window' }).then(windowClients => {
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