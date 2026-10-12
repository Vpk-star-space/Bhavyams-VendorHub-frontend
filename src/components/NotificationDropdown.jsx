import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Bell, CheckCircle, Trash2, ShieldAlert, Store, Tag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const NotificationDropdown = ({ onClose, unreadCount, setUnreadCount }) => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    
    // We reuse the same logic to determine localhost vs live
    const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    const BACKEND_URL = isLocal ? 'http://localhost:5000/api' : 'https://bhavyams-vendorhub-backend.onrender.com/api';

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const res = await axios.get(`${BACKEND_URL}/notifications/my-notifications`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            setNotifications(res.data.notifications);
            setUnreadCount(res.data.unreadCount);
        } catch (err) {
            console.error("Failed to fetch notifications");
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (id, link) => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(`${BACKEND_URL}/notifications/mark-read/${id}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            // Update local state to feel instant
            setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));

            // If the notification has a link (e.g., to a shop), navigate there
            if (link) {
                navigate(link);
                onClose(); // close the dropdown
            }
        } catch (err) {
            console.error("Failed to mark as read");
        }
    };

    const markAllAsRead = async () => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(`${BACKEND_URL}/notifications/mark-all-read`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotifications(notifications.map(n => ({ ...n, is_read: true })));
            setUnreadCount(0);
        } catch (err) {}
    };

    // Helper to pick the right icon based on notification type
    const getIcon = (type) => {
        switch(type) {
            case 'security': return <ShieldAlert size={18} color="#ef4444" />;
            case 'shop_update': return <Store size={18} color="#2563eb" />;
            case 'promo': return <Tag size={18} color="#f59e0b" />;
            default: return <Bell size={18} color="#64748b" />;
        }
    };

    return (
        <div style={styles.dropdown}>
            <div style={styles.header}>
                <h3 style={styles.title}>Notifications</h3>
                {unreadCount > 0 && (
                    <button onClick={markAllAsRead} style={styles.markAllBtn}>
                        <CheckCircle size={14} /> Mark all read
                    </button>
                )}
            </div>

            <div style={styles.list}>
                {loading ? (
                    <div style={styles.empty}>Loading...</div>
                ) : notifications.length === 0 ? (
                    <div style={styles.empty}>You're all caught up!</div>
                ) : (
                    notifications.map(notif => (
                        <div 
                            key={notif.id} 
                            onClick={() => markAsRead(notif.id, notif.link)}
                            style={{
                                ...styles.item, 
                                background: notif.is_read ? 'white' : '#eff6ff',
                                borderLeft: notif.is_read ? '3px solid transparent' : '3px solid #2563eb'
                            }}
                        >
                            <div style={styles.iconBox}>{getIcon(notif.type)}</div>
                            <div style={styles.content}>
                                <h4 style={{ ...styles.notifTitle, color: notif.is_read ? '#475569' : '#0f172a' }}>
                                    {notif.title}
                                </h4>
                                <p style={styles.notifMsg}>{notif.message}</p>
                                <span style={styles.time}>{new Date(notif.created_at).toLocaleString()}</span>
                            </div>
                            {!notif.is_read && <div style={styles.unreadDot}></div>}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

const styles = {
    dropdown: {
        position: 'absolute',
        top: '60px',
        right: '20px',
        width: '350px',
        maxHeight: '480px',
        background: 'white',
        borderRadius: '12px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
        border: '1px solid #e2e8f0',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 1000,
        overflow: 'hidden'
    },
    header: {
        padding: '15px 20px',
        borderBottom: '1px solid #e2e8f0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: '#f8fafc'
    },
    title: { margin: 0, fontSize: '16px', color: '#0f172a', fontWeight: 'bold' },
    markAllBtn: { 
        background: 'none', border: 'none', color: '#2563eb', fontSize: '12px', 
        fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' 
    },
    list: {
        overflowY: 'auto',
        maxHeight: '400px',
        display: 'flex',
        flexDirection: 'column'
    },
    empty: { padding: '30px', textAlign: 'center', color: '#64748b', fontSize: '14px' },
    item: {
        padding: '15px 20px',
        borderBottom: '1px solid #f1f5f9',
        display: 'flex',
        gap: '12px',
        cursor: 'pointer',
        transition: 'background 0.2s'
    },
    iconBox: {
        width: '36px', height: '36px', borderRadius: '50%', background: '#f1f5f9',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
    },
    content: { flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' },
    notifTitle: { margin: 0, fontSize: '14px', fontWeight: 'bold' },
    notifMsg: { margin: 0, fontSize: '12px', color: '#64748b', lineHeight: '1.4' },
    time: { fontSize: '10px', color: '#94a3b8', marginTop: '4px' },
    unreadDot: { width: '8px', height: '8px', borderRadius: '50%', background: '#2563eb', marginTop: '4px', flexShrink: 0 }
};

export default NotificationDropdown;