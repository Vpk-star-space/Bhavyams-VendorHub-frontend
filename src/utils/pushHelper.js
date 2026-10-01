// frontend/src/utils/pushHelper.js
import axios from 'axios';

const getBackendUrl = () => {
    return process.env.NODE_ENV === 'production' 
        ? 'https://bhavyams-vendorhub-backend.onrender.com/api' 
        : 'http://localhost:5000/api';
};

// Converts the VAPID key securely for the browser
const urlBase64ToUint8Array = (base64String) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
};

export const subscribeUserToPush = async () => {
    // Check if browser supports Service Workers and Push
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

    try {
        const token = localStorage.getItem('token');
        if (!token) return; // Must be logged in

        const registration = await navigator.serviceWorker.ready;

        // 1. Ask user for permission (Native Browser Popup)
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
            console.log('Push permission denied.');
            return;
        }

        // 2. Fetch the Public Key from our backend
        const { data } = await axios.get(`${getBackendUrl()}/notifications/vapid-key`);
        
        // 3. Create the secure subscription with Google/Apple
        const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(data.publicKey)
        });

        // 4. Send this device's subscription to our Node.js Backend
        await axios.post(`${getBackendUrl()}/notifications/subscribe`, subscription, {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log('✅ Device successfully registered for Mobile Popups!');
    } catch (err) {
        console.error('Push Subscription Failed:', err);
    }
};