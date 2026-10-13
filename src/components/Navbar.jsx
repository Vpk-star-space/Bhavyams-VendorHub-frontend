import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import axios from 'axios';
import NotificationDropdown from './NotificationDropdown';

// Helper for VAPID key conversion
function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

const Navbar = () => {
    const [showNotifications, setShowNotifications] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    const isLocal = typeof window !== 'undefined' && 
        (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    const BACKEND_URL = isLocal ? 'http://localhost:5000/api' : 'https://bhavyams-vendorhub-backend.onrender.com/api';

    useEffect(() => {
        const setupPushSubscription = async () => {
            if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

            try {
                const token = localStorage.getItem('token');
                if (!token) return;

                const permission = await Notification.requestPermission();
                if (permission !== 'granted') return;

                const registration = await navigator.serviceWorker.ready;
                
                // Read public VAPID key from frontend environment variable
                const publicVapidKey = process.env.REACT_APP_VAPID_PUBLIC_KEY;
                if (!publicVapidKey) return;

                const convertedVapidKey = urlBase64ToUint8Array(publicVapidKey);

                let subscription = await registration.pushManager.getSubscription();
                if (!subscription) {
                    subscription = await registration.pushManager.subscribe({
                        userVisibleOnly: true,
                        applicationServerKey: convertedVapidKey
                    });
                }

                await axios.post(`${BACKEND_URL}/notifications/subscribe`, subscription, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            } catch (err) {
                console.warn('Push registration skipped or failed:', err.message);
            }
        };

       
    }, [BACKEND_URL]);

    // Add this new click handler right above your return (...) statement in Navbar.jsx
const handleBellClick = async () => {
    // 1. Open the dropdown menu
    setShowNotifications(!showNotifications);

    // 2. Check and request notification permissions on click
    if ('Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window) {
        let permission = Notification.permission;
        
        if (permission === 'default') {
            permission = await Notification.requestPermission();
        }

        // 3. If granted, generate the subscription and send to backend
        if (permission === 'granted') {
            try {
                const token = localStorage.getItem('token');
                if (!token) return;

                const registration = await navigator.serviceWorker.ready;
                
                const publicVapidKey = process.env.REACT_APP_VAPID_PUBLIC_KEY;
                if (!publicVapidKey) {
                    console.error("VAPID Key missing in .env");
                    return;
                }

                const convertedVapidKey = urlBase64ToUint8Array(publicVapidKey);

                let subscription = await registration.pushManager.getSubscription();
                if (!subscription) {
                    subscription = await registration.pushManager.subscribe({
                        userVisibleOnly: true,
                        applicationServerKey: convertedVapidKey
                    });
                }

                const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
                const BACKEND_URL = isLocal ? 'http://localhost:5000/api' : 'https://bhavyams-vendorhub-backend.onrender.com/api';

                await axios.post(`${BACKEND_URL}/notifications/subscribe`, subscription, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                
            } catch (err) {
                console.warn('Push registration failed:', err.message);
            }
        }
    }
};
    return (
        <nav style={styles.navbar}>
            {/* Left: Subhams Hub Brand with App Logo */}
            <div style={styles.brand}>
                <div style={styles.brandIconBox}>
                    <span style={{ fontSize: '18px' }}>🏪</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                    <span style={styles.brandText}>SUBHAMS</span>
                    <span style={styles.hubBadge}>HUB</span>
                </div>
            </div>

            {/* Right: Notifications & Admin Tag */}
            <div style={styles.rightSection}>
                <div style={{ position: 'relative' }}>
                <button 
    onClick={handleBellClick} 
    style={styles.bellButton}
    aria-label="Notifications"
>
                        <Bell size={22} color="#334155" />
                        {unreadCount > 0 && (
                            <span style={styles.redDot}>
                                {unreadCount > 99 ? '99+' : unreadCount}
                            </span>
                        )}
                    </button>

                    {showNotifications && (
                        <NotificationDropdown 
                            onClose={() => setShowNotifications(false)} 
                            unreadCount={unreadCount} 
                            setUnreadCount={setUnreadCount} 
                        />
                    )}
                </div>

<button 
    onClick={async () => {
        console.log("1. Button Clicked");
        if (!('Notification' in window)) {
            alert("❌ Your browser does NOT support push notifications.");
            return;
        }
        
        console.log("2. Current Permission Status:", Notification.permission);
        if (Notification.permission === 'denied') {
            alert("❌ Notifications are BLOCKED. Click the padlock icon next to your URL bar, reset permissions, and refresh.");
            return;
        }

        try {
            console.log("3. Asking for permission...");
            const perm = await Notification.requestPermission();
            console.log("4. User responded:", perm);
            alert("Permission result: " + perm);
        } catch (e) {
            console.error("🚨 Permission Crash:", e);
            alert("Error asking permission: " + e.message);
        }
    }}
    style={{ background: 'red', color: 'white', padding: '10px', margin: '10px' }}
>
    TEST PERMISSIONS
</button>
                <div style={styles.avatar}>Admin</div>
            </div>
        </nav>
    );
};

const styles = {
    navbar: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 24px',
        background: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
        position: 'sticky',
        top: 0,
        zIndex: 900
    },
    brand: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        cursor: 'pointer'
    },
    brandIconBox: {
        width: '32px',
        height: '32px',
        borderRadius: '8px',
        background: 'linear-gradient(135deg, #2563eb, #1e40af)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 2px 6px rgba(37,99,235,0.25)'
    },
    brandText: {
        fontSize: '18px',
        color: '#0f172a',
        fontWeight: '900',
        letterSpacing: '0.5px'
    },
    hubBadge: {
        fontSize: '10px',
        background: 'linear-gradient(135deg, #f59e0b, #d97706)',
        color: '#ffffff',
        padding: '2px 5px',
        borderRadius: '4px',
        fontWeight: '900',
        letterSpacing: '1px'
    },
    rightSection: {
        display: 'flex',
        alignItems: 'center',
        gap: '16px'
    },
    bellButton: {
        background: '#f8fafc',
        border: '1px solid #e2e8f0',
        cursor: 'pointer',
        position: 'relative',
        padding: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '50%',
        transition: 'background 0.2s'
    },
    redDot: {
        position: 'absolute',
        top: '-2px',
        right: '-2px',
        background: '#ef4444',
        color: 'white',
        fontSize: '10px',
        fontWeight: 'bold',
        minWidth: '16px',
        height: '16px',
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '2px solid white',
        padding: '0 3px'
    },
    avatar: {
        padding: '4px 10px',
        borderRadius: '20px',
        background: '#eff6ff',
        border: '1px solid #bfdbfe',
        color: '#1e40af',
        fontWeight: 'bold',
        fontSize: '12px'
    }
};

export default Navbar;