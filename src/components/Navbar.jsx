import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import NotificationDropdown from './NotificationDropdown';
import { BACKEND_URL } from '../config/api';
import { socket } from '../context/AppContext';

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
    const navigate = useNavigate();
    const [showNotifications, setShowNotifications] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchUnread = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;
            const res = await axios.get(`${BACKEND_URL}/notifications/my-notifications`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUnreadCount(res.data?.unreadCount || 0);
        } catch (e) {}
    };

    useEffect(() => {
        fetchUnread();
        socket.on('admin_realtime_alert', fetchUnread);
        socket.on('user_realtime_alert', fetchUnread);
        return () => {
            socket.off('admin_realtime_alert', fetchUnread);
            socket.off('user_realtime_alert', fetchUnread);
        };
    }, []);

    const handleBellClick = async () => {
        setShowNotifications(!showNotifications);

        if ('Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window) {
            let permission = Notification.permission;
            if (permission === 'default') {
                permission = await Notification.requestPermission();
            }
            if (permission === 'granted') {
                try {
                    const token = localStorage.getItem('token');
                    const publicVapidKey = process.env.REACT_APP_VAPID_PUBLIC_KEY;
                    if (!token || !publicVapidKey) return;

                    const registration = await navigator.serviceWorker.ready;
                    let subscription = await registration.pushManager.getSubscription();
                    if (!subscription) {
                        subscription = await registration.pushManager.subscribe({
                            userVisibleOnly: true,
                            applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
                        });
                    }
                    await axios.post(`${BACKEND_URL}/notifications/subscribe`, subscription, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                } catch (err) {}
            }
        }
    };

    return (
        <nav style={styles.navbar}>
            <div style={styles.brand} onClick={() => navigate('/')}>
                <div style={styles.brandIconBox}>
                    <span style={{ fontSize: '18px' }}>🏪</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                    <span style={styles.brandText}>SUBHAMS</span>
                    <span style={styles.hubBadge}>HUB</span>
                </div>
            </div>

            <div style={styles.rightSection}>
                <div style={{ position: 'relative' }}>
                    <button onClick={handleBellClick} style={styles.bellButton} aria-label="Notifications">
                        <Bell size={20} color="#0f172a" />
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
                <div style={styles.avatar}>👑 Admin</div>
            </div>
        </nav>
    );
};

const styles = {
    navbar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 18px', background: '#ffffff', borderBottom: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.02)', position: 'sticky', top: 0, zIndex: 900 },
    brand: { display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' },
    brandIconBox: { width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg, #2563eb, #1e40af)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    brandText: { fontSize: '18px', color: '#0f172a', fontWeight: '900', letterSpacing: '0.5px' },
    hubBadge: { fontSize: '10px', background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#ffffff', padding: '2px 5px', borderRadius: '4px', fontWeight: '900', letterSpacing: '1px' },
    rightSection: { display: 'flex', alignItems: 'center', gap: '12px' },
    bellButton: { background: '#f8fafc', border: '1px solid #e2e8f0', cursor: 'pointer', position: 'relative', padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' },
    redDot: { position: 'absolute', top: '-3px', right: '-3px', background: '#ef4444', color: 'white', fontSize: '10px', fontWeight: 'bold', minWidth: '16px', height: '16px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid white', padding: '0 3px' },
    avatar: { padding: '5px 10px', borderRadius: '20px', background: '#fef3c7', border: '1px solid #fde68a', color: '#b45309', fontWeight: '900', fontSize: '11.5px' }
};

export default Navbar;