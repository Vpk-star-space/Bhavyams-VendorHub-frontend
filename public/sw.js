// public/sw.js
self.addEventListener('install', (event) => {
    self.skipWaiting();
    console.log("Subhams Hub Service Worker Installed!");
});

self.addEventListener('fetch', (event) => {
    // Chrome requires a fetch listener to show the Install Prompt.
    // We leave this empty so it doesn't mess with your fast Render API calls!
});