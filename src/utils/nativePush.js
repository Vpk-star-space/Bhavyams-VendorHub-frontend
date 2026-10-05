// frontend/src/utils/nativePush.js
// Replaces the old file. Same export names, so App.js does NOT need to change.
import { PushNotifications } from '@capacitor/push-notifications';
import { registerPlugin } from '@capacitor/core';
import axios from 'axios';

// Native Java plugin (BannerPlugin.java). Registering twice only prints a harmless warning.
const TruecallerBanner = registerPlugin('TruecallerBanner');

const API_URL = process.env.NODE_ENV === 'production'
    ? 'https://bhavyams-vendorhub-backend.onrender.com/api'
    : 'http://localhost:5000/api';

let listenersReady = false;
let syncTimerStarted = false;
let lastSent = '';

// ---------------------------------------------------------------
// 1. Save this phone's FCM token on the server (table fcm_tokens)
//    FIX: before, the token was never sent, so the server could not push to the phone.
// ---------------------------------------------------------------
export const syncFcmToken = async () => {
    try {
        const jwt = localStorage.getItem('token');
        const fcmToken = localStorage.getItem('fcm_token');
        if (!jwt || !fcmToken) return;                 // not logged in yet, or no token yet

        const key = `${jwt.slice(-12)}|${fcmToken}`;
        if (key === lastSent) return;                  // already saved, do nothing

        await axios.post(
            `${API_URL}/notifications/register-fcm`,
            { fcmToken },
            { headers: { Authorization: `Bearer ${jwt}` } }
        );
        lastSent = key;
        console.log('✅ FCM token saved on server');
    } catch (e) {
        // Render free server may be asleep. We simply try again in 10 seconds.
        console.log('FCM token save failed, will retry:', e?.response?.status || e.message);
    }
};

// ---------------------------------------------------------------
// 2. Open the call screen when the user taps the banner
// ---------------------------------------------------------------
const openCallScreen = (call) => {
    if (!call) return;
    if (window.location.pathname === '/incoming-call') return;

    const type = call.type === 'voice_call' ? 'call' : (call.type || 'message');
    window.location.href =
        '/incoming-call' +
        `?callerName=${encodeURIComponent(call.callerName || 'Subhams Hub')}` +
        `&roomId=${encodeURIComponent(call.roomId || '')}` +
        `&type=${encodeURIComponent(type)}`;
};

// ---------------------------------------------------------------
// 3. Start everything (App.js already calls this on app start and on login)
// ---------------------------------------------------------------
export const initNativePush = async (userId) => {
    if (!window.Capacitor?.isNativePlatform()) return;

    try {
        if (!listenersReady) {
            listenersReady = true;

            await PushNotifications.addListener('registration', (token) => {
                localStorage.setItem('fcm_token', token.value);
                syncFcmToken();
            });

            await PushNotifications.addListener('registrationError', (err) => {
                console.error('❌ Push registration error:', JSON.stringify(err));
            });

            // App was already running in background and the banner was tapped
            TruecallerBanner.addListener('incomingCall', openCallScreen);
        }

        let permStatus = await PushNotifications.checkPermissions();
        if (permStatus.receive === 'prompt') {
            permStatus = await PushNotifications.requestPermissions();
        }
        if (permStatus.receive !== 'granted') {
            console.log('Notification permission not allowed');
            return;
        }

        await PushNotifications.register();   // gives the token to the 'registration' listener
        syncFcmToken();

        // App was CLOSED and the banner was tapped to open it
        try {
            const pending = await TruecallerBanner.getPendingCall();
            if (pending && pending.hasCall) openCallScreen(pending);
        } catch (e) {
            console.log('getPendingCall not available:', e.message);
        }

        // Safety net: if the user logs in later, or the server was asleep, save the token then.
        if (!syncTimerStarted) {
            syncTimerStarted = true;
            setInterval(syncFcmToken, 10000);
        }
    } catch (e) {
        console.error('initNativePush failed:', e);
    }
};

// The channel is now created by the native Java code (CallNotifier.java),
// so the old JS channel ('subhams-urgent-alerts') is no longer needed.
// Kept as an empty function so App.js still works.
export const initTruecallerNotificationChannel = async () => {};