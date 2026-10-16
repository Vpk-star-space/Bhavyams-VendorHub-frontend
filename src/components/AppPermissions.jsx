import React, { useState, useEffect } from 'react';
import { BellRing, Mic, ShieldCheck, Sparkles, CheckCircle2 } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { BACKEND_URL } from '../config/api';

const AppPermissions = ({ onComplete }) => {
    const [pushGranted, setPushGranted] = useState(
        typeof Notification !== 'undefined' && Notification.permission === 'granted'
    );
    const [micGranted, setMicGranted] = useState(
        localStorage.getItem('subhams_mic_granted') === 'true'
    );
    const [dismissed, setDismissed] = useState(
        sessionStorage.getItem('subhams_perm_dismissed') === 'true'
    );
    const [subscribing, setSubscribing] = useState(false);

    useEffect(() => {
        if (navigator.permissions && navigator.permissions.query) {
            navigator.permissions.query({ name: 'microphone' }).then((result) => {
                if (result.state === 'granted') {
                    setMicGranted(true);
                    localStorage.setItem('subhams_mic_granted', 'true');
                }
            }).catch(() => {});
        }
    }, []);

    const urlBase64ToUint8Array = (base64String) => {
        const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
        const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    };

    // 🔔 PRIORITY 1: REQUEST & REGISTER WEB-PUSH ALERTS
    const requestPriorityPush = async () => {
        if (!('Notification' in window)) {
            toast.info("Notifications are not supported on this browser.");
            setPushGranted(true);
            return;
        }

        setSubscribing(true);
        try {
            const perm = await Notification.requestPermission();
            if (perm === 'granted') {
                setPushGranted(true);
                toast.success("🔔 Priority Order & Offer Alerts Enabled!");

                if ('serviceWorker' in navigator && 'PushManager' in window) {
                    const registration = await navigator.serviceWorker.ready;
                    const publicKey = process.env.REACT_APP_VAPID_PUBLIC_KEY;
                    if (publicKey) {
                        let sub = await registration.pushManager.getSubscription();
                        if (!sub) {
                            sub = await registration.pushManager.subscribe({
                                userVisibleOnly: true,
                                applicationServerKey: urlBase64ToUint8Array(publicKey)
                            });
                        }
                        const token = localStorage.getItem('token');
                        if (token) {
                            await axios.post(`${BACKEND_URL}/notifications/subscribe`, sub, {
                                headers: { Authorization: `Bearer ${token}` }
                            });
                        }
                    }
                }
            } else if (perm === 'denied') {
                toast.warning("Notifications are blocked in your browser settings. Click the lock icon in the address bar to allow them.");
            }
        } catch (e) {
            console.warn("Push subscription note:", e.message);
        } finally {
            setSubscribing(false);
        }
    };

    // 🎙️ PRIORITY 2: OPTIONAL MICROPHONE FOR WEB CALLS
    const requestMic = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            stream.getTracks().forEach(track => track.stop()); // Immediately release mic after permission grant
            setMicGranted(true);
            localStorage.setItem('subhams_mic_granted', 'true');
            toast.success("🎙️ Microphone ready for Web Calls!");
        } catch (e) {
            toast.warning("Microphone access skipped. You can enable it later when making a call.");
        }
    };

    const handleClose = () => {
        sessionStorage.setItem('subhams_perm_dismissed', 'true');
        setDismissed(true);
        if (typeof onComplete === 'function') onComplete();
    };

    // Hide automatically once Push is granted (or if already dismissed this session)
    if (dismissed || (pushGranted && micGranted)) {
        return null; 
    }

    return (
        <div style={styles.overlay}>
            <div style={styles.modal}>
                <div style={styles.iconBox}>
                    <ShieldCheck size={38} color="#2563eb" />
                </div>
                <h2 style={styles.title}>Enable Priority Alerts</h2>
                <p style={styles.subtitle}>
                    Stay updated with instant order confirmations, delivery updates, and incoming shop calls.
                </p>

                {/* 🔔 PRIORITY #1: PUSH NOTIFICATIONS (HIGHLIGHTED CARD) */}
                <div style={{
                    ...styles.permRow,
                    background: pushGranted ? '#f0fdf4' : 'linear-gradient(135deg, #eff6ff, #dbeafe)',
                    border: pushGranted ? '1.5px solid #86efac' : '2px solid #2563eb',
                    boxShadow: pushGranted ? 'none' : '0 8px 20px rgba(37, 99, 235, 0.15)'
                }}>
                    <div style={styles.permIcon}>
                        <BellRing size={26} color={pushGranted ? "#16a34a" : "#2563eb"} />
                    </div>
                    <div style={styles.permText}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ background: '#facc15', color: '#0f172a', fontSize: '9.5px', fontWeight: '900', padding: '2px 6px', borderRadius: '6px' }}>
                                PRIORITY
                            </span>
                            <h4 style={styles.permTitle}>Instant Push Alerts</h4>
                        </div>
                        <p style={styles.permDesc}>
                            Get live order status, customer bookings & local offers even when your screen is off.
                        </p>
                    </div>
                    {pushGranted ? (
                        <CheckCircle2 size={24} color="#16a34a" />
                    ) : (
                        <button onClick={requestPriorityPush} disabled={subscribing} style={styles.priorityAllowBtn}>
                            <Sparkles size={13} /> {subscribing ? '...' : 'Enable'}
                        </button>
                    )}
                </div>

                {/* 🎙️ SECONDARY: MICROPHONE FOR WEB CALLS */}
                <div style={styles.permRow}>
                    <div style={styles.permIcon}>
                        <Mic size={22} color={micGranted ? "#16a34a" : "#64748b"} />
                    </div>
                    <div style={styles.permText}>
                        <h4 style={styles.permTitle}>Web-Call Microphone {micGranted && "✅"}</h4>
                        <p style={styles.permDesc}>For privacy-protected audio calls with shops (Number stays hidden).</p>
                    </div>
                    {!micGranted && (
                        <button onClick={requestMic} style={styles.secondaryAllowBtn}>Allow</button>
                    )}
                </div>

                <button onClick={handleClose} style={styles.continueBtn}>
                    {pushGranted ? 'Continue to Subhams Hub 🚀' : 'Skip for Now'}
                </button>
            </div>
        </div>
    );
};

const styles = {
    overlay: { position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(6px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '18px' },
    modal: { background: 'white', borderRadius: '24px', padding: '26px 22px', maxWidth: '400px', width: '100%', boxShadow: '0 25px 50px rgba(0,0,0,0.3)', textAlign: 'center', boxSizing: 'border-box' },
    iconBox: { width: '68px', height: '68px', background: '#eff6ff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' },
    title: { margin: '0 0 6px', fontSize: '21px', fontWeight: '900', color: '#0f172a' },
    subtitle: { margin: '0 0 20px', color: '#64748b', fontSize: '13.5px', lineHeight: '1.45', fontWeight: '500' },
    permRow: { display: 'flex', alignItems: 'center', textAlign: 'left', background: '#f8fafc', padding: '14px', borderRadius: '16px', marginBottom: '12px', border: '1px solid #e2e8f0', gap: '12px' },
    permIcon: { flexShrink: 0 },
    permText: { flex: 1 },
    permTitle: { margin: '2px 0', fontSize: '14.5px', fontWeight: '900', color: '#0f172a' },
    permDesc: { margin: 0, fontSize: '11.5px', color: '#475569', lineHeight: '1.35', fontWeight: '600' },
    priorityAllowBtn: { background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: '#fff', border: 'none', padding: '9px 14px', borderRadius: '14px', fontWeight: '900', fontSize: '12.5px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0, boxShadow: '0 4px 10px rgba(37, 99, 235, 0.3)' },
    secondaryAllowBtn: { background: '#e2e8f0', color: '#0f172a', border: 'none', padding: '8px 14px', borderRadius: '14px', fontWeight: '800', fontSize: '12px', cursor: 'pointer', flexShrink: 0 },
    continueBtn: { width: '100%', background: '#0f172a', color: '#facc15', border: 'none', padding: '14px', borderRadius: '14px', fontSize: '14.5px', fontWeight: '900', marginTop: '6px', cursor: 'pointer' }
};

export default AppPermissions;