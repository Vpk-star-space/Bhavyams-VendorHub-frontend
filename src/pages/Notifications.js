import React, { useEffect, useState, useContext, useCallback } from 'react';
import axios from 'axios';
import { ArrowLeft, Bell, Clock, CheckCircle2, Trash2, ShieldAlert, Store, Megaphone, Sparkles, ExternalLink, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { AppContext, socket } from '../context/AppContext';

const notifTranslations = {
    en: {
        title: "Notifications",
        markAllRead: "Mark all read",
        clearAll: "Clear All",
        allTab: "All",
        unreadTab: "Unread",
        importantTab: "Important",
        loading: "Loading your alerts...",
        emptyTitle: "You're all caught up!",
        emptySub: "New shop updates, delivery requests, and security alerts will appear here.",
        confirmClear: "Are you sure you want to clear your entire notification history?",
        openAction: "Open",
        newBadge: "NEW"
    },
    te: {
        title: "నోటిఫికేషన్లు",
        markAllRead: "అన్నీ చదివినట్లు గుర్తించు",
        clearAll: "అన్నీ తొలగించు",
        allTab: "అన్నీ",
        unreadTab: "చదవనివి",
        importantTab: "ముఖ్యమైనవి",
        loading: "మీ అలర్ట్‌లను లోడ్ చేస్తోంది...",
        emptyTitle: "ప్రస్తుతానికి కొత్త నోటిఫికేషన్లు లేవు!",
        emptySub: "షాప్ అప్‌డేట్‌లు, డెలివరీ అభ్యర్థనలు మరియు సెక్యూరిటీ అలర్ట్‌లు ఇక్కడ కనిపిస్తాయి.",
        confirmClear: "మీరు ఖచ్చితంగా మొత్తం నోటిఫికేషన్ చరిత్రను తొలగించాలనుకుంటున్నారా?",
        openAction: "తెరువు",
        newBadge: "కొత్తది"
    }
};

const Notifications = () => {
    const [notifs, setNotifs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState('all'); // all | unread | important
    const navigate = useNavigate();

    const { language } = useContext(AppContext);
    const lang = language === 'te' ? 'te' : 'en';
    const nt = notifTranslations[lang];

    const userStr = localStorage.getItem('user');
    const currentUser = userStr && userStr !== 'undefined' ? JSON.parse(userStr) : null;
    const isAdmin = Boolean(currentUser && (currentUser.role === 'admin' || currentUser.email === 'pavanvenkat63@gmail.com'));

    const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    const BACKEND_URL = isLocal ? 'http://localhost:5000/api' : 'https://bhavyams-vendorhub-backend.onrender.com/api';

    const fetchNotifications = useCallback((silent = false) => {
        const token = localStorage.getItem('token');
        if (!token) return navigate('/welcome');

        if (!silent) setLoading(true);
        axios.get(`${BACKEND_URL}/notifications/my-notifications`, {
            headers: { Authorization: `Bearer ${token}` }
        })
        .then(res => setNotifs(res.data.notifications || []))
        .catch(() => {})
        .finally(() => setLoading(false));
    }, [BACKEND_URL, navigate]);

    useEffect(() => {
        fetchNotifications(false);

        // 🟢 LIVE REAL-TIME SOCKET REFRESH WHEN NEW ALERTS ARRIVE
        const handleRealtimeUpdate = () => fetchNotifications(true);

        socket.on('user_realtime_alert', handleRealtimeUpdate);
        socket.on('admin_realtime_alert', handleRealtimeUpdate);
        socket.on('broadcast_realtime_alert', handleRealtimeUpdate);

        return () => {
            socket.off('user_realtime_alert', handleRealtimeUpdate);
            socket.off('admin_realtime_alert', handleRealtimeUpdate);
            socket.off('broadcast_realtime_alert', handleRealtimeUpdate);
        };
    }, [fetchNotifications]);

    const markAsRead = async (id) => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(`${BACKEND_URL}/notifications/mark-read/${id}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotifs(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
        } catch (e) {}
    };

    const markAllRead = async () => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(`${BACKEND_URL}/notifications/mark-all-read`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotifs(prev => prev.map(n => ({ ...n, is_read: true })));
            toast.success("All notifications marked as read.");
        } catch (e) {}
    };

    const deleteNotification = async (e, id) => {
        e.stopPropagation();
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${BACKEND_URL}/notifications/delete/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotifs(prev => prev.filter(n => n.id !== id));
        } catch (err) {
            toast.error("Failed to delete notification.");
        }
    };

    const clearAllNotifications = async () => {
        if (!window.confirm(nt.confirmClear)) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${BACKEND_URL}/notifications/delete-all`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotifs([]);
            toast.success("Notification history cleared.");
        } catch (err) {
            toast.error("Failed to clear notifications.");
        }
    };

    // 🟢 SMART ROUTE DETECTOR FOR NOTIFICATION CARDS
    const getSmartDestination = (n) => {
        const titleLower = (n.title || '').toLowerCase();
        const msgLower = (n.message || '').toLowerCase();

        if (titleLower.includes('verification request') || titleLower.includes('shop application')) {
            return isAdmin ? { path: '/admin', label: 'Review in Admin' } : null;
        }
        if (titleLower.includes('action required')) {
            return { path: '/register-business', label: 'Edit Application' };
        }
        if (titleLower.includes('shop approved') || titleLower.includes('green badge') || titleLower.includes('area demand')) {
            return { path: '/dashboard', label: 'Open Dashboard' };
        }
        if (n.type === 'broadcast' || msgLower.includes('expo')) {
            return { path: '/expo', label: 'Explore Expo' };
        }
        return null;
    };

    // 🟢 VISUAL THEME BY NOTIFICATION TYPE
    const getTypeTheme = (n) => {
        const type = (n.type || 'system').toLowerCase();
        const titleLower = (n.title || '').toLowerCase();

        if (type === 'security' || titleLower.includes('warning') || titleLower.includes('strike') || titleLower.includes('suspended') || titleLower.includes('banned')) {
            return {
                accent: '#dc2626',
                bgUnread: '#fef2f2',
                badgeBg: '#fee2e2',
                badgeColor: '#991b1b',
                icon: <ShieldAlert size={18} color="#dc2626" />
            };
        }
        if (type === 'shop_update' || titleLower.includes('approved') || titleLower.includes('green badge')) {
            return {
                accent: '#16a34a',
                bgUnread: '#f0fdf4',
                badgeBg: '#dcfce7',
                badgeColor: '#166534',
                icon: <Store size={18} color="#16a34a" />
            };
        }
        if (type === 'broadcast') {
            return {
                accent: '#d97706',
                bgUnread: '#fffbeb',
                badgeBg: '#fef3c7',
                badgeColor: '#92400e',
                icon: <Megaphone size={18} color="#d97706" />
            };
        }
        return {
            accent: '#2563eb',
            bgUnread: '#eff6ff',
            badgeBg: '#dbeafe',
            badgeColor: '#1e40af',
            icon: <Sparkles size={18} color="#2563eb" />
        };
    };

    const formatTimestamp = (dateStr) => {
        if (!dateStr) return '';
        let safeStr = String(dateStr);
        if (!safeStr.endsWith('Z') && !safeStr.includes('+')) safeStr += 'Z';
        const d = new Date(safeStr);
        if (isNaN(d.getTime())) return '';
        return d.toLocaleString('en-IN', {
            timeZone: 'Asia/Kolkata',
            hour: '2-digit',
            minute: '2-digit',
            day: '2-digit',
            month: 'short'
        });
    };

    const unreadCount = notifs.filter(n => !n.is_read).length;

    const filteredNotifs = notifs.filter(n => {
        if (activeFilter === 'unread') return !n.is_read;
        if (activeFilter === 'important') {
            const tLower = (n.title || '').toLowerCase();
            return n.type === 'security' || n.type === 'shop_update' || tLower.includes('verification') || tLower.includes('demand');
        }
        return true;
    });

    return (
        <div style={styles.page}>
            <style>{`
                .touch-card { transition: transform 0.15s ease, box-shadow 0.15s ease; }
                .touch-card:active { transform: scale(0.985); }
            `}</style>

            <div style={styles.container}>
                
                {/* STICKY MOBILE-COMFORTABLE HEADER */}
                <div style={styles.headerCard}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <button onClick={() => navigate(-1)} style={styles.backIconBtn} aria-label="Back">
                            <ArrowLeft size={20} color="#0f172a" />
                        </button>
                        <div>
                            <h2 style={styles.headerTitle}>
                                <Bell size={20} color="#2563eb" /> {nt.title}
                                {unreadCount > 0 && (
                                    <span style={styles.unreadCountPill}>{unreadCount}</span>
                                )}
                            </h2>
                        </div>
                    </div>

                    <button onClick={() => fetchNotifications(false)} style={styles.refreshBtn} title="Refresh">
                        <RefreshCw size={16} color="#475569" />
                    </button>
                </div>

                {/* FILTER TABS & BULK ACTIONS */}
                {notifs.length > 0 && (
                    <div style={styles.controlsWrapper}>
                        <div style={styles.filterRow}>
                            {[
                                { id: 'all', label: `${nt.allTab} (${notifs.length})` },
                                { id: 'unread', label: `${nt.unreadTab} (${unreadCount})` },
                                { id: 'important', label: `🛡️ ${nt.importantTab}` }
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveFilter(tab.id)}
                                    style={activeFilter === tab.id ? styles.filterPillActive : styles.filterPillInactive}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        <div style={styles.bulkActionsRow}>
                            <button onClick={markAllRead} style={styles.markReadBtn}>
                                <CheckCircle2 size={15} /> {nt.markAllRead}
                            </button>
                            <button onClick={clearAllNotifications} style={styles.clearAllBtn}>
                                <Trash2 size={15} /> {nt.clearAll}
                            </button>
                        </div>
                    </div>
                )}

                {/* NOTIFICATION CARDS LIST */}
                {loading ? (
                    <div style={styles.emptyCard}>
                        <p style={{ margin: 0, color: '#64748b', fontWeight: '700' }}>{nt.loading}</p>
                    </div>
                ) : filteredNotifs.length === 0 ? (
                    <div style={styles.emptyCard}>
                        <Bell size={44} color="#cbd5e1" style={{ marginBottom: '10px' }} />
                        <h3 style={{ margin: '0 0 6px 0', color: '#334155', fontSize: '16px', fontWeight: '900' }}>{nt.emptyTitle}</h3>
                        <p style={{ margin: 0, color: '#94a3b8', fontSize: '13px', lineHeight: '1.4' }}>{nt.emptySub}</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {filteredNotifs.map(n => {
                            const theme = getTypeTheme(n);
                            const smartDest = getSmartDestination(n);

                            return (
                                <div
                                    key={n.id}
                                    className="touch-card"
                                    onClick={() => { if (!n.is_read) markAsRead(n.id); }}
                                    style={{
                                        ...styles.notifCard,
                                        background: n.is_read ? '#ffffff' : theme.bgUnread,
                                        borderLeft: `5px solid ${n.is_read ? '#cbd5e1' : theme.accent}`
                                    }}
                                >
                                    <div style={styles.cardTopRow}>
                                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', flex: 1 }}>
                                            <div style={{ marginTop: '2px', flexShrink: 0 }}>
                                                {theme.icon}
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                                    <h4 style={styles.cardTitle}>{n.title}</h4>
                                                    {!n.is_read && (
                                                        <span style={styles.newTag}>{nt.newBadge}</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* LARGE TOUCH TARGET DELETE BUTTON */}
                                        <button
                                            onClick={(e) => deleteNotification(e, n.id)}
                                            style={styles.deleteIconBtn}
                                            title="Delete Notification"
                                            aria-label="Delete Notification"
                                        >
                                            <Trash2 size={16} color="#64748b" />
                                        </button>
                                    </div>

                                    <p style={{
                                        ...styles.cardMessage,
                                        color: n.is_read ? '#475569' : '#0f172a',
                                        fontWeight: n.is_read ? '500' : '700'
                                    }}>
                                        {n.message}
                                    </p>

                                    <div style={styles.cardFooter}>
                                        <span style={styles.timeText}>
                                            <Clock size={12} /> {formatTimestamp(n.created_at)}
                                        </span>

                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            {n.type && (
                                                <span style={{
                                                    ...styles.typeBadge,
                                                    background: theme.badgeBg,
                                                    color: theme.badgeColor
                                                }}>
                                                    {n.type.replace('_', ' ')}
                                                </span>
                                            )}

                                            {smartDest && (
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (!n.is_read) markAsRead(n.id);
                                                        navigate(smartDest.path);
                                                    }}
                                                    style={styles.smartActionBtn}
                                                >
                                                    {smartDest.label} <ExternalLink size={12} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

const styles = {
    page: { background: '#f8fafc', minHeight: '100vh', padding: '12px', fontFamily: 'Inter, system-ui, sans-serif', boxSizing: 'border-box' },
    container: { maxWidth: '620px', margin: '0 auto', paddingBottom: '40px' },

    headerCard: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '14px',
        background: '#ffffff',
        padding: '12px 14px',
        borderRadius: '14px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
        position: 'sticky',
        top: '8px',
        zIndex: 50
    },
    backIconBtn: {
        width: '38px',
        height: '38px',
        borderRadius: '10px',
        background: '#f1f5f9',
        border: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer'
    },
    refreshBtn: {
        width: '38px',
        height: '38px',
        borderRadius: '10px',
        background: '#f8fafc',
        border: '1px solid #cbd5e1',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer'
    },
    headerTitle: {
        margin: 0,
        fontSize: '18px',
        fontWeight: '900',
        color: '#0f172a',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
    },
    unreadCountPill: {
        background: '#ef4444',
        color: '#ffffff',
        fontSize: '11px',
        fontWeight: '900',
        padding: '2px 8px',
        borderRadius: '12px'
    },

    controlsWrapper: {
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        marginBottom: '14px'
    },
    filterRow: {
        display: 'flex',
        gap: '8px',
        overflowX: 'auto',
        paddingBottom: '2px'
    },
    filterPillActive: {
        padding: '8px 14px',
        borderRadius: '20px',
        background: '#0f172a',
        color: '#ffffff',
        border: 'none',
        fontSize: '12px',
        fontWeight: '800',
        cursor: 'pointer',
        whiteSpace: 'nowrap'
    },
    filterPillInactive: {
        padding: '8px 14px',
        borderRadius: '20px',
        background: '#e2e8f0',
        color: '#475569',
        border: 'none',
        fontSize: '12px',
        fontWeight: '700',
        cursor: 'pointer',
        whiteSpace: 'nowrap'
    },
    bulkActionsRow: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '10px'
    },
    markReadBtn: {
        background: '#eff6ff',
        border: '1px solid #bfdbfe',
        color: '#1d4ed8',
        padding: '8px 12px',
        borderRadius: '10px',
        fontWeight: '800',
        fontSize: '12px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '6px'
    },
    clearAllBtn: {
        background: '#fef2f2',
        border: '1px solid #fecaca',
        color: '#dc2626',
        padding: '8px 12px',
        borderRadius: '10px',
        fontWeight: '800',
        fontSize: '12px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '6px'
    },

    emptyCard: {
        textAlign: 'center',
        padding: '50px 20px',
        background: '#ffffff',
        borderRadius: '16px',
        border: '1px dashed #cbd5e1',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
    },

    notifCard: {
        padding: '14px 15px',
        borderRadius: '14px',
        borderTop: '1px solid #e2e8f0',
        borderRight: '1px solid #e2e8f0',
        borderBottom: '1px solid #e2e8f0',
        cursor: 'pointer',
        boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
    },
    cardTopRow: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: '8px',
        marginBottom: '6px'
    },
    cardTitle: {
        margin: 0,
        color: '#0f172a',
        fontSize: '15px',
        fontWeight: '900',
        lineHeight: '1.3'
    },
    newTag: {
        background: '#2563eb',
        color: '#ffffff',
        fontSize: '9.5px',
        fontWeight: '900',
        padding: '2px 6px',
        borderRadius: '6px',
        letterSpacing: '0.5px'
    },
    deleteIconBtn: {
        width: '34px',
        height: '34px',
        borderRadius: '8px',
        background: '#f8fafc',
        border: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        flexShrink: 0
    },
    cardMessage: {
        margin: '0 0 12px 28px',
        fontSize: '13.5px',
        lineHeight: '1.45',
        wordBreak: 'break-word'
    },
    cardFooter: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '8px',
        marginLeft: '28px'
    },
    timeText: {
        fontSize: '11px',
        color: '#64748b',
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        fontWeight: '700'
    },
    typeBadge: {
        fontSize: '9.5px',
        padding: '3px 8px',
        borderRadius: '8px',
        textTransform: 'uppercase',
        fontWeight: '900',
        letterSpacing: '0.4px'
    },
    smartActionBtn: {
        background: '#0f172a',
        color: '#ffffff',
        border: 'none',
        padding: '5px 10px',
        borderRadius: '8px',
        fontSize: '11px',
        fontWeight: '800',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '4px'
    }
};

export default Notifications;