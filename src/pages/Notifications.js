import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { ArrowLeft, Bell, Clock, CheckCircle2, Trash2, Trash } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Notifications = () => {
    const [notifs, setNotifs] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    const BACKEND_URL = isLocal ? 'http://localhost:5000/api' : 'https://bhavyams-vendorhub-backend.onrender.com/api';

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) return navigate('/welcome');

        fetchNotifications(token);
    }, [navigate, BACKEND_URL]);

    const fetchNotifications = (token) => {
        setLoading(true);
        axios.get(`${BACKEND_URL}/notifications/my-notifications`, { headers: { Authorization: `Bearer ${token}` } })
        .then(res => setNotifs(res.data.notifications || []))
        .catch(err => console.error("Error fetching notifications"))
        .finally(() => setLoading(false));
    };

    const markAsRead = async (id) => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(`${BACKEND_URL}/notifications/mark-read/${id}`, {}, { headers: { Authorization: `Bearer ${token}` } });
            setNotifs(notifs.map(n => n.id === id ? { ...n, is_read: true } : n));
        } catch (e) {}
    };

    const markAllRead = async () => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(`${BACKEND_URL}/notifications/mark-all-read`, {}, { headers: { Authorization: `Bearer ${token}` } });
            setNotifs(notifs.map(n => ({ ...n, is_read: true })));
        } catch (e) {}
    };

    // 🟢 NEW: DELETE SINGLE NOTIFICATION
    const deleteNotification = async (e, id) => {
        e.stopPropagation(); // Prevents clicking the card and triggering 'markAsRead'
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${BACKEND_URL}/notifications/delete/${id}`, { headers: { Authorization: `Bearer ${token}` } });
            setNotifs(notifs.filter(n => n.id !== id));
        } catch (err) {
            console.error("Failed to delete");
        }
    };

    // 🟢 NEW: CLEAR ALL NOTIFICATIONS
    const clearAllNotifications = async () => {
        if (!window.confirm("Are you sure you want to clear your entire notification history?")) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${BACKEND_URL}/notifications/delete-all`, { headers: { Authorization: `Bearer ${token}` } });
            setNotifs([]);
        } catch (err) {
            console.error("Failed to clear all");
        }
    };

    return (
       <div style={{ background: '#f8fafc', minHeight: '100vh', padding: '15px', fontFamily: 'Inter' }}>
           <div style={{ maxWidth: '600px', margin: '0 auto' }}>
               
               {/* HEADER */}
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', background: 'white', padding: '15px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                       <ArrowLeft size={20} cursor="pointer" onClick={() => navigate(-1)} />
                       <h2 style={{ margin: 0, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                           <Bell color="#2563eb" /> Notifications
                       </h2>
                   </div>
               </div>
               
               {/* ACTION BAR */}
               {notifs.length > 0 && (
                   <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 5px', marginBottom: '15px' }}>
                       <button onClick={markAllRead} style={{ background: 'transparent', border: 'none', color: '#2563eb', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                           <CheckCircle2 size={14} /> Mark all read
                       </button>
                       <button onClick={clearAllNotifications} style={{ background: 'transparent', border: 'none', color: '#dc2626', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                           <Trash size={14} /> Clear All
                       </button>
                   </div>
               )}
               
               {/* NOTIFICATION LIST */}
               {loading ? <p style={{textAlign: 'center', color: '#64748b'}}>Loading your alerts...</p> : notifs.length === 0 ? (
                   <div style={{ textAlign: 'center', padding: '40px', background: 'white', borderRadius: '12px', color: '#94a3b8', border: '1px dashed #cbd5e1' }}>
                       <Bell size={40} style={{ opacity: 0.2, marginBottom: '10px' }} />
                       <br/>You're all caught up!
                   </div>
               ) : (
                   notifs.map(n => (
                       <div key={n.id} onClick={() => !n.is_read && markAsRead(n.id)} style={{ padding: '15px', background: n.is_read ? 'white' : '#eff6ff', marginBottom: '10px', borderRadius: '12px', borderLeft: n.is_read ? '4px solid #cbd5e1' : '4px solid #2563eb', cursor: 'pointer', transition: 'background 0.3s', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                               <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                   <h4 style={{ margin: '0 0 5px 0', color: '#0f172a', fontSize: '15px', fontWeight: '900' }}>{n.title}</h4>
                                   {n.is_read && <CheckCircle2 size={14} color="#94a3b8" style={{ marginBottom: '5px' }} />}
                               </div>
                               
                               {/* 🟢 DELETE BUTTON ON EVERY CARD */}
                               <button 
                                   onClick={(e) => deleteNotification(e, n.id)} 
                                   style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '2px' }}
                                   title="Delete Notification"
                               >
                                   <Trash2 size={16} />
                               </button>
                           </div>
                           
                           {/* 🟢 CLEAR DETAILS DISPLAY */}
                           <p style={{ margin: '0 0 10px 0', color: n.is_read ? '#475569' : '#1e3a8a', fontSize: '13px', lineHeight: '1.4' }}>
                               {n.message}
                           </p>
                           
                           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                               <span style={{ fontSize: '10.5px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 'bold' }}>
                                   <Clock size={10}/> {new Date(n.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })}
                               </span>
                               
                               {n.type && (
                                   <span style={{ fontSize: '9px', background: '#f1f5f9', color: '#64748b', padding: '3px 8px', borderRadius: '10px', textTransform: 'uppercase', fontWeight: '900', letterSpacing: '0.5px' }}>
                                       {n.type.replace('_', ' ')}
                                   </span>
                               )}
                           </div>
                       </div>
                   ))
               )}
           </div>
       </div>
    );
};

export default Notifications;