import React, { useState, useEffect } from 'react';
import { BellRing, Mic, ShieldCheck } from 'lucide-react';
import axios from 'axios';

const AppPermissions = ({ onComplete }) => {
    // 🟢 FIX 1: Read from browser memory on load
    const [pushGranted, setPushGranted] = useState(Notification.permission === 'granted');
    const [micGranted, setMicGranted] = useState(localStorage.getItem('subhams_mic_granted') === 'true');

    // 🟢 FIX 2: Double check actual hardware permission in the background
    useEffect(() => {
        if (navigator.permissions && navigator.permissions.query) {
            navigator.permissions.query({ name: 'microphone' }).then((result) => {
                if (result.state === 'granted') {
                    setMicGranted(true);
                    localStorage.setItem('subhams_mic_granted', 'true');
                }
            }).catch(() => {}); // Catch for older browsers
        }
    }, []);

    // Helper for VAPID key
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

    const requestPush = async () => {
        const perm = await Notification.requestPermission();
        if (perm === 'granted') {
            setPushGranted(true);
            try {
                const registration = await navigator.serviceWorker.ready;
                const publicKey = process.env.REACT_APP_VAPID_PUBLIC_KEY;
                const sub = await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: urlBase64ToUint8Array(publicKey)
                });
                const token = localStorage.getItem('token');
                const isLocal = typeof window !== 'undefined' && window.location.hostname === 'localhost';
                const url = isLocal ? 'http://localhost:5000/api' : 'https://bhavyams-vendorhub-backend.onrender.com/api';
                await axios.post(`${url}/notifications/subscribe`, sub, { headers: { Authorization: `Bearer ${token}` }});
            } catch (e) { console.error("Push setup failed", e); }
        }
    };

    const requestMic = async () => {
        try {
            await navigator.mediaDevices.getUserMedia({ audio: true });
            setMicGranted(true);
            localStorage.setItem('subhams_mic_granted', 'true'); // 🟢 FIX 3: Save choice permanently
        } catch (e) {
            alert("Microphone access is required for Subhams Hub live calls.");
        }
    };

    // 🟢 Hide screen instantly if everything is granted
    if (pushGranted && micGranted) {
        if (onComplete) onComplete();
        return null; 
    }

    return (
        <div style={styles.overlay}>
            <div style={styles.modal}>
                <div style={styles.iconBox}>
                    <ShieldCheck size={40} color="#2563eb" />
                </div>
                <h2 style={styles.title}>Welcome to Subhams Hub</h2>
                <p style={styles.subtitle}>To provide a seamless app experience, we need a few permissions to keep you connected.</p>

                <div style={styles.permRow}>
                    <div style={styles.permIcon}><BellRing size={24} color={pushGranted ? "#10b981" : "#475569"} /></div>
                    <div style={styles.permText}>
                        <h4 style={styles.permTitle}>Push Alerts {pushGranted && "✅"}</h4>
                        <p style={styles.permDesc}>Required for order updates and incoming messages.</p>
                    </div>
                    {!pushGranted && <button onClick={requestPush} style={styles.allowBtn}>Allow</button>}
                </div>

                <div style={styles.permRow}>
                    <div style={styles.permIcon}><Mic size={24} color={micGranted ? "#10b981" : "#475569"} /></div>
                    <div style={styles.permText}>
                        <h4 style={styles.permTitle}>Microphone {micGranted && "✅"}</h4>
                        <p style={styles.permDesc}>Required for answering live Truecaller-style audio calls.</p>
                    </div>
                    {!micGranted && <button onClick={requestMic} style={styles.allowBtn}>Allow</button>}
                </div>

                <button 
                    onClick={onComplete} 
                    style={{...styles.continueBtn, opacity: (pushGranted && micGranted) ? 1 : 0.5}}
                >
                    Continue to App
                </button>
            </div>
        </div>
    );
};

const styles = {
    overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.9)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' },
    modal: { background: 'white', borderRadius: '24px', padding: '30px', maxWidth: '400px', width: '100%', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', textAlign: 'center' },
    iconBox: { width: '80px', height: '80px', background: '#eff6ff', borderRadius: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' },
    title: { margin: '0 0 10px', fontSize: '24px', color: '#0f172a' },
    subtitle: { margin: '0 0 30px', color: '#64748b', fontSize: '15px', lineHeight: '1.5' },
    permRow: { display: 'flex', alignItems: 'center', textAlign: 'left', background: '#f8fafc', padding: '15px', borderRadius: '16px', marginBottom: '15px', border: '1px solid #e2e8f0' },
    permIcon: { marginRight: '15px' },
    permText: { flex: 1 },
    permTitle: { margin: '0 0 4px', fontSize: '16px', color: '#1e293b' },
    permDesc: { margin: 0, fontSize: '12px', color: '#64748b' },
    allowBtn: { background: '#2563eb', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '20px', fontWeight: 'bold', cursor: 'pointer' },
    continueBtn: { width: '100%', background: '#0f172a', color: '#fff', border: 'none', padding: '16px', borderRadius: '16px', fontSize: '16px', fontWeight: 'bold', marginTop: '10px', cursor: 'pointer' }
};

export default AppPermissions;