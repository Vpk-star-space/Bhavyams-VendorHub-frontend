import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Users, ShieldAlert, BarChart3, Activity, Link as LinkIcon, Power, Edit3, MessageSquare, CheckCircle, XCircle, Image as ImageIcon, Eye, Sparkles } from 'lucide-react';
import { toast } from 'react-toastify';
import Navbar from '../components/Navbar';

const PushDashboard = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const [activeSection, setActiveSection] = useState('composer'); // composer | triggers | logs | revoked
    
    // 📊 Dashboard Data
    const [analytics, setAnalytics] = useState({ active: 0, revoked: 0, vendors: 0, customers: 0 });
    const [logs, setLogs] = useState([]);
    const [triggers, setTriggers] = useState([]);
    const [revokedUsers, setRevokedUsers] = useState([]);
    const [allUsersList, setAllUsersList] = useState([]);
    const [activeShopsList, setActiveShopsList] = useState([]);

    // 🎯 Manual Broadcast State
    const [broadcastLoading, setBroadcastLoading] = useState(false);
    const [urlPreset, setUrlPreset] = useState('/');
    const [selectedShopIdForUrl, setSelectedShopIdForUrl] = useState('');
    const [bcast, setBcast] = useState({
        title: '',
        message_en: '',
        message_te: '',
        audience: 'all',
        target_user_id: '',
        image_url: '',
        action_url: '/'
    });

    const [userSearchTerm, setUserSearchTerm] = useState('');
    const [editingTrigger, setEditingTrigger] = useState(null);

    const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    const BACKEND_URL = isLocal ? 'http://localhost:5000/api' : 'https://bhavyams-vendorhub-backend.onrender.com/api';

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const fetchDashboardData = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return navigate('/welcome');
            
            const [crmRes, usersRes, shopsRes] = await Promise.allSettled([
                axios.get(`${BACKEND_URL}/push-admin/dashboard-data`, { headers: { Authorization: `Bearer ${token}` } }),
                axios.get(`${BACKEND_URL}/admin/all-users`, { headers: { Authorization: `Bearer ${token}` } }),
                axios.get(`${BACKEND_URL}/shops/active/all`)
            ]);

            if (crmRes.status === 'fulfilled' && crmRes.value.data) {
                setAnalytics(crmRes.value.data.analytics || { active: 0, revoked: 0, vendors: 0, customers: 0 });
                setLogs(crmRes.value.data.logs || []);
                setTriggers(crmRes.value.data.triggers || []);
                setRevokedUsers(crmRes.value.data.revoked_users || []);
            }
            if (usersRes.status === 'fulfilled') {
                setAllUsersList(usersRes.value.data || []);
            }
            if (shopsRes.status === 'fulfilled') {
                setActiveShopsList(shopsRes.value.data?.shops || []);
            }
        } catch (err) {
            toast.error("Failed to load CRM data.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, []);

    // Sync Smart Action URL Preset
    const handlePresetChange = (presetVal) => {
        setUrlPreset(presetVal);
        if (presetVal === 'shop') {
            const firstShopId = activeShopsList[0]?.id || '1';
            setSelectedShopIdForUrl(firstShopId);
            setBcast(prev => ({ ...prev, action_url: `/shop/${firstShopId}` }));
        } else if (presetVal !== 'custom') {
            setBcast(prev => ({ ...prev, action_url: presetVal }));
        }
    };

    const handleShopUrlSelect = (shopId) => {
        setSelectedShopIdForUrl(shopId);
        setBcast(prev => ({ ...prev, action_url: `/shop/${shopId}` }));
    };

    // 🎯 HANDLE MANUAL BROADCAST
    const handleSendBroadcast = async (e) => {
        e.preventDefault();
        if (!bcast.title.trim() || (!bcast.message_en.trim() && !bcast.message_te.trim())) {
            return toast.error("Title and at least one message are required.");
        }
        if (bcast.audience === 'specific' && !bcast.target_user_id) {
            return toast.error("Please select a target user from the list.");
        }

        const cleanUrl = (bcast.action_url || '/').trim();
        const combinedMessage = [bcast.message_en.trim(), bcast.message_te.trim()].filter(Boolean).join('\n');

        if (!window.confirm(`Send this Push Broadcast to ${bcast.audience.toUpperCase()}?\nLink: ${cleanUrl}`)) return;

        setBroadcastLoading(true);
        try {
            const token = localStorage.getItem('token');
            const selectedUserObj = allUsersList.find(u => String(u.id) === String(bcast.target_user_id));

            const payloadData = {
                ...bcast,
                message: combinedMessage,
                url: cleanUrl,
                action_url: cleanUrl,
                image: bcast.image_url || null,
                image_url: bcast.image_url || null,
                target_user_id: bcast.target_user_id,
                target_user: selectedUserObj ? selectedUserObj.username : bcast.target_user_id
            };

            const res = await axios.post(`${BACKEND_URL}/push-admin/manual-broadcast`, payloadData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            toast.success(res.data.message || "🚀 Broadcast sent!");
            setBcast({ title: '', message_en: '', message_te: '', audience: 'all', target_user_id: '', image_url: '', action_url: '/' });
            setUrlPreset('/');
            setUserSearchTerm('');
            fetchDashboardData(); 
        } catch (err) {
            toast.error(err.response?.data?.message || err.response?.data?.error || "Broadcast failed.");
        } finally {
            setBroadcastLoading(false);
        }
    };

    const toggleTrigger = async (id, currentStatus) => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(`${BACKEND_URL}/push-admin/triggers/toggle/${id}`, 
                { isActive: !currentStatus }, 
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success(`Trigger ${!currentStatus ? 'Enabled' : 'Disabled'}`);
            fetchDashboardData();
        } catch (err) { toast.error("Failed to toggle trigger."); }
    };

    const saveTriggerTemplate = async (e) => {
        e.preventDefault();
        if (!editingTrigger) return;
        try {
            const token = localStorage.getItem('token');
            await axios.put(`${BACKEND_URL}/push-admin/triggers/edit/${editingTrigger.id}`, 
                { template_en: editingTrigger.template_en, template_te: editingTrigger.template_te }, 
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success("Template updated successfully!");
            setEditingTrigger(null);
            fetchDashboardData();
        } catch (err) { toast.error("Failed to update template."); }
    };

    const formatTime = (dateString) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    const filteredUsersDropdown = allUsersList.filter(u => 
        u.username?.toLowerCase().includes(userSearchTerm.toLowerCase()) || 
        u.email?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
        u.phone?.includes(userSearchTerm)
    );

    if (loading) return <div style={styles.loading}>Loading CRM Dashboard...</div>;

    return (
        <>
            <Navbar />
            <div style={styles.page}>
                <div style={styles.container}>
                    
                    {/* HEADER */}
                    <div style={styles.headerBar}>
                        <button onClick={() => navigate('/admin')} style={styles.backBtn}>
                            <ArrowLeft size={18} /> Back to Admin
                        </button>
                        <h1 style={styles.title}><Activity size={22} color="#2563eb" /> Push Engagement CRM</h1>
                    </div>

                    {/* 📊 STATS GRID */}
                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: '10px', marginBottom: '18px' }}>
                        <div style={{...styles.statCard, background: '#eff6ff', borderColor: '#bfdbfe'}}>
                            <div style={{color: '#1e3a8a', fontSize: '12px', fontWeight: '800'}}>Active Devices</div>
                            <div style={{fontSize: '24px', fontWeight: '900', color: '#2563eb', margin: '4px 0'}}>{analytics.active}</div>
                            <div style={{color: '#3b82f6', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '700'}}><BarChart3 size={12}/> Subscribed</div>
                        </div>
                        <div style={{...styles.statCard, background: '#fef2f2', borderColor: '#fecaca'}}>
                            <div style={{color: '#7f1d1d', fontSize: '12px', fontWeight: '800'}}>Revoked</div>
                            <div style={{fontSize: '24px', fontWeight: '900', color: '#dc2626', margin: '4px 0'}}>{analytics.revoked}</div>
                            <div style={{color: '#ef4444', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '700'}}><ShieldAlert size={12}/> Uninstalled</div>
                        </div>
                        <div style={{...styles.statCard, background: '#fef9c3', borderColor: '#fef08a'}}>
                            <div style={{color: '#713f12', fontSize: '12px', fontWeight: '800'}}>Vendor Reach</div>
                            <div style={{fontSize: '24px', fontWeight: '900', color: '#d97706', margin: '4px 0'}}>{analytics.vendors}</div>
                            <div style={{color: '#ca8a04', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '700'}}><Users size={12}/> Shops</div>
                        </div>
                        <div style={{...styles.statCard, background: '#f0fdf4', borderColor: '#bbf7d0'}}>
                            <div style={{color: '#14532d', fontSize: '12px', fontWeight: '800'}}>Customer Reach</div>
                            <div style={{fontSize: '24px', fontWeight: '900', color: '#16a34a', margin: '4px 0'}}>{analytics.customers}</div>
                            <div style={{color: '#15803d', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '700'}}><Users size={12}/> Buyers</div>
                        </div>
                    </div>

                    {/* 🟢 TABS NAV */}
                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: '8px', marginBottom: '18px' }}>
                        <button onClick={() => setActiveSection('composer')} style={activeSection === 'composer' ? styles.tabActive : styles.tabInactive}>🚀 Broadcast</button>
                        <button onClick={() => setActiveSection('triggers')} style={activeSection === 'triggers' ? styles.tabActive : styles.tabInactive}>🤖 Triggers ({triggers.length})</button>
                        <button onClick={() => setActiveSection('logs')} style={activeSection === 'logs' ? styles.tabActive : styles.tabInactive}>📜 Logs ({logs.length})</button>
                        <button onClick={() => setActiveSection('revoked')} style={{...(activeSection === 'revoked' ? styles.tabActive : styles.tabInactive), background: activeSection === 'revoked' ? '#dc2626' : '#fee2e2', color: activeSection === 'revoked' ? 'white' : '#991b1b'}}>🚫 Uninstalled ({revokedUsers.length})</button>
                    </div>

                    {/* ========================================================= */}
                    {/* 🎯 TAB 1: COMPOSER */}
                    {/* ========================================================= */}
                    {activeSection === 'composer' && (
                        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.3fr 1fr', gap: '18px', alignItems: 'start' }}>
                            <div style={styles.panel}>
                                <h2 style={styles.panelTitle}><Send size={18} color="#2563eb"/> Smart Broadcast Composer</h2>
                                <form onSubmit={handleSendBroadcast} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                    
                                    {/* 1. AUDIENCE */}
                                    <div style={styles.inputGroup}>
                                        <label style={styles.label}>1. Select Target Audience</label>
                                        <select style={styles.input} value={bcast.audience} onChange={(e) => setBcast({...bcast, audience: e.target.value})}>
                                            <option value="all">🌍 All Active Users (Customers + Vendors)</option>
                                            <option value="customers">👤 Only Customers</option>
                                            <option value="vendors">🏪 Only Vendors</option>
                                            <option value="specific">🎯 Specific User (Select from Database)</option>
                                        </select>
                                    </div>

                                    {bcast.audience === 'specific' && (
                                        <div style={{ background: '#eff6ff', padding: '12px', borderRadius: '10px', border: '1px solid #bfdbfe', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            <label style={{...styles.label, color: '#1e3a8a'}}>Search & Select User</label>
                                            <input type="text" placeholder="Filter by name, phone..." style={{...styles.input, background: 'white'}} value={userSearchTerm} onChange={(e) => setUserSearchTerm(e.target.value)} />
                                            <select style={{...styles.input, background: 'white', fontWeight: '700'}} value={bcast.target_user_id} onChange={(e) => setBcast({...bcast, target_user_id: e.target.value})} required>
                                                <option value="">-- Tap to Choose User ({filteredUsersDropdown.length} matches) --</option>
                                                {filteredUsersDropdown.map(u => (
                                                    <option key={u.id} value={u.id}>{u.username} ({u.role.toUpperCase()}) - {u.phone || u.email}</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}

                                    {/* 2. TITLE */}
                                    <div style={styles.inputGroup}>
                                        <label style={styles.label}>2. Notification Title (Use Emojis for Color! 🔴🚀)</label>
                                        <input type="text" placeholder="e.g., 🚀 Weekend Mega Offer!" style={styles.input} value={bcast.title} onChange={(e) => setBcast({...bcast, title: e.target.value})} required />
                                    </div>

                                    {/* 3. MESSAGES */}
                                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '10px' }}>
                                        <div style={styles.inputGroup}>
                                            <label style={styles.label}>3A. English Message</label>
                                            <textarea placeholder="Message here..." style={styles.textarea} value={bcast.message_en} onChange={(e) => setBcast({...bcast, message_en: e.target.value})} />
                                        </div>
                                        <div style={styles.inputGroup}>
                                            <label style={styles.label}>3B. Telugu Message</label>
                                            <textarea placeholder="తెలుగు మెసేజ్..." style={styles.textarea} value={bcast.message_te} onChange={(e) => setBcast({...bcast, message_te: e.target.value})} />
                                        </div>
                                    </div>

                                    {/* 4. SMART DESTINATION */}
                                    <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '12px', border: '1px solid #cbd5e1', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        <label style={styles.label}><LinkIcon size={14} color="#2563eb"/> 4. Where should clicking open?</label>
                                        <select style={{...styles.input, background: 'white', fontWeight: '700'}} value={urlPreset} onChange={(e) => handlePresetChange(e.target.value)}>
                                            <option value="/">🏠 Home Screen (/)</option>
                                            <option value="/expo">🌟 Subhams Expo Feed (/expo)</option>
                                            <option value="/notifications">🔔 Notifications Inbox (/notifications)</option>
                                            <option value="shop">🏬 Specific Shop Profile</option>
                                            <option value="custom">🔗 Custom Link</option>
                                        </select>

                                        {urlPreset === 'shop' && (
                                            <select style={{...styles.input, background: 'white'}} value={selectedShopIdForUrl} onChange={(e) => handleShopUrlSelect(e.target.value)}>
                                                {activeShopsList.map(s => <option key={s.id} value={s.id}>🏪 {s.business_name}</option>)}
                                            </select>
                                        )}

                                        <input type="text" placeholder="URL Destination" style={{...styles.input, background: 'white', color: '#1d4ed8', fontWeight: '700'}} value={bcast.action_url} onChange={(e) => { setUrlPreset('custom'); setBcast({...bcast, action_url: e.target.value}); }} />
                                    </div>

                                    {/* 5. IMAGE PASTE FIELD (UPLOAD REMOVED) */}
                                    <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '12px', border: '1px solid #cbd5e1', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <label style={styles.label}><ImageIcon size={14} color="#16a34a"/> 5. Promo Image (Direct HTTPS URL)</label>
                                        <div style={{ fontSize: '11.5px', color: '#64748b', marginBottom: '4px', lineHeight: '1.4' }}>
                                            * Base64 uploads crash Web Push servers. You must paste a direct image link ending in .jpg or .png (e.g. from an Expo post).
                                        </div>
                                        <input 
                                            type="text" 
                                            placeholder="https://hub.subhamsnetworks.in/uploads/photo.jpg" 
                                            style={{...styles.input, background: 'white'}} 
                                            value={bcast.image_url} 
                                            onChange={(e) => setBcast({...bcast, image_url: e.target.value})} 
                                        />
                                    </div>

                                    <button type="submit" disabled={broadcastLoading} style={{...styles.btnPrimary, opacity: broadcastLoading ? 0.7 : 1}}>
                                        {broadcastLoading ? 'Sending...' : '🚀 LAUNCH PUSH BROADCAST'}
                                    </button>
                                </form>
                            </div>

                            {/* PREVIEW */}
                            <div style={{...styles.panel, background: '#0f172a', color: 'white', border: '1px solid #1e293b'}}>
                                <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px' }}><Eye size={16} color="#facc15"/> Preview</h3>
                                <div style={{ background: '#ffffff', color: '#0f172a', borderRadius: '14px', padding: '14px' }}>
                                    <div style={{ fontWeight: '900', fontSize: '15px', marginBottom: '4px' }}>{bcast.title || 'Notification Title'}</div>
                                    <div style={{ fontSize: '13px', color: '#334155', whiteSpace: 'pre-line' }}>{bcast.message_en || 'Message preview...'}{bcast.message_te ? `\n${bcast.message_te}` : ''}</div>
                                    {bcast.image_url && <img src={bcast.image_url} alt="Preview" style={{ width: '100%', maxHeight: '160px', objectFit: 'cover', borderRadius: '10px', marginTop: '10px' }} />}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ========================================================= */}
                    {/* 🤖 TAB 2: TRIGGERS */}
                    {/* ========================================================= */}
                    {activeSection === 'triggers' && (
                        <div style={styles.panel}>
                            <h2 style={styles.panelTitle}><Power size={18} color="#16a34a"/> Background Triggers</h2>
                            {editingTrigger && (
                                <form onSubmit={saveTriggerTemplate} style={{ background: '#eff6ff', padding: '16px', borderRadius: '12px', border: '1.5px solid #3b82f6', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    <h4 style={{ margin: 0, color: '#1e3a8a' }}>✏️ Editing: {editingTrigger.trigger_name.replace('_', ' ').toUpperCase()}</h4>
                                    <div><label style={styles.label}>English</label><textarea style={styles.textarea} value={editingTrigger.template_en} onChange={(e) => setEditingTrigger({...editingTrigger, template_en: e.target.value})} required /></div>
                                    <div><label style={styles.label}>Telugu</label><textarea style={styles.textarea} value={editingTrigger.template_te} onChange={(e) => setEditingTrigger({...editingTrigger, template_te: e.target.value})} required /></div>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button type="submit" style={{...styles.btnPrimary, background: '#16a34a', flex: 1}}>Save</button>
                                        <button type="button" onClick={() => setEditingTrigger(null)} style={{...styles.btnPrimary, background: '#64748b', flex: 1}}>Cancel</button>
                                    </div>
                                </form>
                            )}
                            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: '12px' }}>
                                {triggers.map(t => (
                                    <div key={t.id} style={{ background: '#f8fafc', padding: '15px', borderRadius: '12px', border: `1.5px solid ${t.is_active ? '#86efac' : '#fecaca'}`, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{fontWeight: '900', fontSize: '13.5px'}}>{t.trigger_name.replace(/_/g, ' ').toUpperCase()}</span>
                                            <div style={{display: 'flex', gap: '6px'}}>
                                                <button onClick={() => setEditingTrigger(t)} style={styles.iconBtn}><Edit3 size={14}/></button>
                                                <button onClick={() => toggleTrigger(t.id, t.is_active)} style={{...styles.iconBtn, background: t.is_active ? '#fee2e2' : '#dcfce7', color: t.is_active ? '#dc2626' : '#16a34a'}}><Power size={14}/></button>
                                            </div>
                                        </div>
                                        <div style={{background: 'white', padding: '10px', borderRadius: '8px', fontSize: '12px'}}>
                                            <div><strong>EN:</strong> {t.template_en}</div>
                                            <div style={{marginTop: '6px'}}><strong>TE:</strong> {t.template_te}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ========================================================= */}
                    {/* 📜 TAB 3: LOGS */}
                    {/* ========================================================= */}
                    {activeSection === 'logs' && (
                        <div style={styles.panel}>
                            <h2 style={styles.panelTitle}><MessageSquare size={18} color="#2563eb"/> Broadcast Logs</h2>
                            <div style={{ overflowX: 'auto' }}>
                                <table style={styles.table}>
                                    <thead>
                                        <tr>
                                            <th style={styles.th}>Time</th>
                                            <th style={styles.th}>Audience</th>
                                            <th style={styles.th}>Message Title</th>
                                            <th style={styles.th}>Delivered</th>
                                            <th style={styles.th}>Failed</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {logs.map(log => (
                                            <tr key={log.id} style={styles.tr}>
                                                <td style={styles.td}>{formatTime(log.created_at)}</td>
                                                <td style={styles.td}><span style={{background: '#f1f5f9', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold'}}>{(log.audience || 'all').toUpperCase()}</span></td>
                                                <td style={styles.td}><strong>{log.title}</strong></td>
                                                <td style={{...styles.td, color: '#16a34a', fontWeight: 'bold'}}>{log.success_count}</td>
                                                <td style={{...styles.td, color: '#dc2626', fontWeight: 'bold'}}>{log.failed_count}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* ========================================================= */}
                    {/* 🚫 TAB 4: REVOKED USERS LIST */}
                    {/* ========================================================= */}
                    {activeSection === 'revoked' && (
                        <div style={styles.panel}>
                            <h2 style={{...styles.panelTitle, color: '#dc2626'}}><ShieldAlert size={18}/> Users Who Uninstalled or Blocked Push</h2>
                            <p style={{fontSize: '13px', color: '#64748b', marginTop: '-10px', marginBottom: '16px'}}>
                                These users deleted the app or blocked browser notifications. The backend automatically cleared their tokens to protect your server limits.
                            </p>
                            {revokedUsers.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '30px', color: '#16a34a', fontWeight: 'bold' }}>All users are actively subscribed!</div>
                            ) : (
                                <div style={{ overflowX: 'auto' }}>
                                    <table style={styles.table}>
                                        <thead>
                                            <tr>
                                                <th style={styles.th}>Date Uninstalled</th>
                                                <th style={styles.th}>User Role</th>
                                                <th style={styles.th}>Username</th>
                                                <th style={styles.th}>Phone</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {revokedUsers.map((user, index) => (
                                                <tr key={index} style={styles.tr}>
                                                    <td style={styles.td}>{formatTime(user.created_at)}</td>
                                                    <td style={styles.td}>
                                                        <span style={{background: user.role === 'vendor' ? '#fef9c3' : '#e0e7ff', color: user.role === 'vendor' ? '#a16207' : '#4338ca', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold'}}>
                                                            {user.role.toUpperCase()}
                                                        </span>
                                                    </td>
                                                    <td style={{...styles.td, fontWeight: 'bold'}}>{user.username || 'Unknown'}</td>
                                                    <td style={styles.td}>{user.phone || 'N/A'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}

                </div>
            </div>
        </>
    );
};

const styles = {
    page: { background: '#f8fafc', minHeight: '100vh', padding: '12px', fontFamily: 'Inter, sans-serif', boxSizing: 'border-box' },
    container: { maxWidth: '1100px', margin: '0 auto', paddingBottom: '40px' },
    loading: { textAlign: 'center', padding: '50px', fontSize: '18px', fontWeight: 'bold', color: '#334155' },
    headerBar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' },
    title: { margin: 0, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '19px', fontWeight: '900' },
    backBtn: { background: 'white', border: '1px solid #cbd5e1', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '800', fontSize: '13px', color: '#0f172a' },
    statCard: { padding: '14px', borderRadius: '14px', border: '1px solid', display: 'flex', flexDirection: 'column', justifyContent: 'center' },
    tabActive: { padding: '12px 10px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '900', fontSize: '12.5px', cursor: 'pointer', boxShadow: '0 4px 10px rgba(37,99,235,0.2)' },
    tabInactive: { padding: '12px 10px', background: '#e2e8f0', color: '#475569', border: 'none', borderRadius: '12px', fontWeight: '800', fontSize: '12.5px', cursor: 'pointer' },
    panel: { background: 'white', padding: '18px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px rgba(0,0,0,0.02)', boxSizing: 'border-box' },
    panelTitle: { margin: '0 0 16px 0', fontSize: '17px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '900' },
    inputGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
    label: { fontSize: '12.5px', fontWeight: '800', color: '#334155', display: 'flex', alignItems: 'center', gap: '6px' },
    input: { padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', background: '#f8fafc', outline: 'none', width: '100%', boxSizing: 'border-box' },
    textarea: { padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', background: '#f8fafc', outline: 'none', minHeight: '75px', resize: 'vertical', width: '100%', boxSizing: 'border-box' },
    btnPrimary: { background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: 'white', border: 'none', padding: '14px', borderRadius: '10px', fontWeight: '900', cursor: 'pointer', fontSize: '14px', marginTop: '6px', width: '100%' },
    iconBtn: { background: '#e2e8f0', border: 'none', padding: '8px', borderRadius: '8px', cursor: 'pointer', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' },
    th: { padding: '12px 15px', background: '#f1f5f9', color: '#475569', fontWeight: 'bold', borderBottom: '2px solid #e2e8f0' },
    td: { padding: '12px 15px', borderBottom: '1px solid #e2e8f0', color: '#334155' },
    tr: { transition: '0.2s' }
};

export default PushDashboard;