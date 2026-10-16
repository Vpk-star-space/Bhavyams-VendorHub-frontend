import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Users, ShieldAlert, BarChart3, Activity, Link as LinkIcon, Power, Edit3, MessageSquare, CheckCircle, XCircle, Upload, Eye, Trash2, Sparkles } from 'lucide-react';
import { toast } from 'react-toastify';
import Navbar from '../components/Navbar';

// 🟢 COMPRESS PROMO BANNER IMAGE SO WEB-PUSH PAYLOAD NEVER FAILS
const compressBannerForPush = (file) => {
    return new Promise((resolve, reject) => {
        if (!file || !file.type.startsWith('image/')) return reject(new Error('Invalid image'));
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const maxW = 600;
                const scale = Math.min(1, maxW / img.width);
                canvas.width = Math.round(img.width * scale);
                canvas.height = Math.round(img.height * scale);
                const ctx = canvas.getContext('2d');
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                resolve(canvas.toDataURL('image/jpeg', 0.65));
            };
            img.onerror = reject;
        };
        reader.onerror = reject;
    });
};

const PushDashboard = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const [activeSection, setActiveSection] = useState('composer'); // composer | triggers | logs
    
    // 📊 Dashboard Data
    const [analytics, setAnalytics] = useState({ active: 0, revoked: 0, vendors: 0, customers: 0 });
    const [logs, setLogs] = useState([]);
    const [triggers, setTriggers] = useState([]);
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

    // 🖼️ COMPRESSED IMAGE UPLOADER
    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        try {
            const compressedDataUrl = await compressBannerForPush(file);
            setBcast(prev => ({ ...prev, image_url: compressedDataUrl }));
            toast.success("✅ Promo banner optimized and attached!");
        } catch (err) {
            toast.error("Failed to process banner image.");
        }
    };

    // 🎯 HANDLE MANUAL BROADCAST
    const handleSendBroadcast = async (e) => {
        e.preventDefault();
        if (!bcast.title.trim() || (!bcast.message_en.trim() && !bcast.message_te.trim())) {
            return toast.error("Title and at least one message (English or Telugu) are required.");
        }
        if (bcast.audience === 'specific' && !bcast.target_user_id) {
            return toast.error("Please select a target user from the list.");
        }

        const cleanUrl = (bcast.action_url || '/').trim();
        const combinedMessage = [bcast.message_en.trim(), bcast.message_te.trim()].filter(Boolean).join('\n');

        if (!window.confirm(`Send this Push Broadcast to ${bcast.audience.toUpperCase()}?\nDestination Link: ${cleanUrl}`)) return;

        setBroadcastLoading(true);
        try {
            const token = localStorage.getItem('token');
            const selectedUserObj = allUsersList.find(u => String(u.id) === String(bcast.target_user_id));

            // 🟢 SENDS BOTH KEY FORMATS (`action_url` + `url`, `image_url` + `image`, `target_user_id` + `target_user`)
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

            let res;
            try {
                res = await axios.post(`${BACKEND_URL}/push-admin/manual-broadcast`, payloadData, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            } catch (primaryErr) {
                // Fallback to /notifications/broadcast so it always succeeds and saves to Bell History
                res = await axios.post(`${BACKEND_URL}/notifications/broadcast`, payloadData, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            }
            
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
        } catch (err) {
            toast.error("Failed to toggle trigger.");
        }
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
        } catch (err) {
            toast.error("Failed to update template.");
        }
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

                    {/* 📊 2x2 MOBILE-COMFORTABLE STATS GRID */}
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

                    {/* 🟢 SEPARATE NAVIGATION TABS FOR MOBILE & DESKTOP CLARITY */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '18px' }}>
                        <button 
                            type="button"
                            onClick={() => setActiveSection('composer')} 
                            style={activeSection === 'composer' ? styles.tabActive : styles.tabInactive}
                        >
                            🚀 Broadcast
                        </button>
                        <button 
                            type="button"
                            onClick={() => setActiveSection('triggers')} 
                            style={activeSection === 'triggers' ? styles.tabActive : styles.tabInactive}
                        >
                            🤖 Triggers ({triggers.length})
                        </button>
                        <button 
                            type="button"
                            onClick={() => setActiveSection('logs')} 
                            style={activeSection === 'logs' ? styles.tabActive : styles.tabInactive}
                        >
                            📜 Logs ({logs.length})
                        </button>
                    </div>

                    {/* ========================================================= */}
                    {/* 🎯 TAB 1: MANUAL BROADCAST COMPOSER + LIVE PREVIEW */}
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

                                    {/* SPECIFIC USER PICKER (FIXED: passes u.id properly) */}
                                    {bcast.audience === 'specific' && (
                                        <div style={{ background: '#eff6ff', padding: '12px', borderRadius: '10px', border: '1px solid #bfdbfe', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            <label style={{...styles.label, color: '#1e3a8a'}}>Search & Select User</label>
                                            <input 
                                                type="text" 
                                                placeholder="Filter by name, phone, or email..." 
                                                style={{...styles.input, background: 'white'}} 
                                                value={userSearchTerm} 
                                                onChange={(e) => setUserSearchTerm(e.target.value)} 
                                            />
                                            <select 
                                                style={{...styles.input, background: 'white', fontWeight: '700'}} 
                                                value={bcast.target_user_id} 
                                                onChange={(e) => setBcast({...bcast, target_user_id: e.target.value})}
                                                required
                                            >
                                                <option value="">-- Tap to Choose User ({filteredUsersDropdown.length} matches) --</option>
                                                {filteredUsersDropdown.map(u => (
                                                    <option key={u.id} value={u.id}>
                                                        {u.username} ({u.role.toUpperCase()}) - {u.phone || u.email}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    )}

                                    {/* 2. TITLE */}
                                    <div style={styles.inputGroup}>
                                        <label style={styles.label}>2. Notification Title</label>
                                        <input 
                                            type="text" 
                                            placeholder="e.g., 🚀 Weekend Mega Offer on Subhams Hub!" 
                                            style={styles.input} 
                                            value={bcast.title} 
                                            onChange={(e) => setBcast({...bcast, title: e.target.value})} 
                                            required 
                                        />
                                    </div>

                                    {/* 3. BILINGUAL MESSAGES */}
                                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '10px' }}>
                                        <div style={styles.inputGroup}>
                                            <label style={styles.label}>3A. English Message</label>
                                            <textarea 
                                                placeholder="Check out new verified local shops and offers in your area..." 
                                                style={styles.textarea} 
                                                value={bcast.message_en} 
                                                onChange={(e) => setBcast({...bcast, message_en: e.target.value})} 
                                            />
                                        </div>
                                        <div style={styles.inputGroup}>
                                            <label style={styles.label}>3B. Telugu Message (Optional)</label>
                                            <textarea 
                                                placeholder="మీ ప్రాంతంలోని కొత్త వెరిఫైడ్ షాపులు మరియు ఆఫర్లను చూడండి..." 
                                                style={styles.textarea} 
                                                value={bcast.message_te} 
                                                onChange={(e) => setBcast({...bcast, message_te: e.target.value})} 
                                            />
                                        </div>
                                    </div>

                                    {/* 4. SMART DESTINATION CLICK URL */}
                                    <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '12px', border: '1px solid #cbd5e1', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        <label style={styles.label}><LinkIcon size={14} color="#2563eb"/> 4. Where should clicking the notification open?</label>
                                        <select 
                                            style={{...styles.input, background: 'white', fontWeight: '700'}} 
                                            value={urlPreset} 
                                            onChange={(e) => handlePresetChange(e.target.value)}
                                        >
                                            <option value="/">🏠 Home Screen (/)</option>
                                            <option value="/expo">🌟 Subhams Expo Feed (/expo)</option>
                                            <option value="/notifications">🔔 Notifications Inbox (/notifications)</option>
                                            <option value="/register-business">🏪 Business Registration (/register-business)</option>
                                            <option value="shop">🏬 Specific Shop Profile (Pick Shop)</option>
                                            <option value="custom">🔗 Custom URL or External Link</option>
                                        </select>

                                        {urlPreset === 'shop' && (
                                            <select 
                                                style={{...styles.input, background: 'white'}} 
                                                value={selectedShopIdForUrl} 
                                                onChange={(e) => handleShopUrlSelect(e.target.value)}
                                            >
                                                {activeShopsList.map(s => (
                                                    <option key={s.id} value={s.id}>
                                                        🏪 {s.business_name} (/shop/{s.id})
                                                    </option>
                                                ))}
                                            </select>
                                        )}

                                        <input 
                                            type="text" 
                                            placeholder="Destination URL (e.g. /expo or https://...)" 
                                            style={{...styles.input, background: 'white', fontSize: '13px', color: '#1d4ed8', fontWeight: '700'}} 
                                            value={bcast.action_url} 
                                            onChange={(e) => { setUrlPreset('custom'); setBcast({...bcast, action_url: e.target.value}); }} 
                                        />
                                    </div>

                                    {/* 5. PROMO BANNER IMAGE (FILE OR HTTPS URL) */}
                                    <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '12px', border: '1px solid #cbd5e1', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <label style={styles.label}><Upload size={14} color="#16a34a"/> 5. Promo Banner Image (Upload or Paste Image Link)</label>
                                        <input type="file" accept="image/*" style={{...styles.input, background: 'white', padding: '8px'}} onChange={handleImageUpload} />
                                        <input 
                                            type="text" 
                                            placeholder="Or paste direct HTTPS image link (https://...)" 
                                            style={{...styles.input, background: 'white', fontSize: '12.5px'}} 
                                            value={bcast.image_url && !bcast.image_url.startsWith('data:') ? bcast.image_url : ''} 
                                            onChange={(e) => setBcast({...bcast, image_url: e.target.value})} 
                                        />
                                        {bcast.image_url && (
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                                                <span style={{fontSize: '11.5px', color: '#16a34a', fontWeight: '800'}}>✅ Banner attached!</span>
                                                <button type="button" onClick={() => setBcast({...bcast, image_url: ''})} style={{ background: '#fee2e2', color: '#dc2626', border: 'none', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <Trash2 size={12}/> Remove Image
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    <button type="submit" disabled={broadcastLoading} style={{...styles.btnPrimary, opacity: broadcastLoading ? 0.7 : 1}}>
                                        {broadcastLoading ? 'Sending Broadcast...' : '🚀 LAUNCH PUSH BROADCAST'}
                                    </button>
                                </form>
                            </div>

                            {/* 📱 LIVE PHONE NOTIFICATION PREVIEW */}
                            <div style={{...styles.panel, background: '#0f172a', color: 'white', border: '1px solid #1e293b'}}>
                                <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    <Eye size={16} color="#facc15"/> Live Phone Alert Preview
                                </h3>
                                <div style={{ background: '#ffffff', color: '#0f172a', borderRadius: '14px', padding: '14px', boxShadow: '0 10px 25px rgba(0,0,0,0.4)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                        <span style={{ fontSize: '11px', fontWeight: '900', color: '#2563eb', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <Sparkles size={12}/> SUBHAMS HUB • now
                                        </span>
                                        <span style={{ fontSize: '10px', background: '#f1f5f9', color: '#475569', padding: '2px 6px', borderRadius: '6px', fontWeight: '800' }}>
                                            {bcast.audience.toUpperCase()}
                                        </span>
                                    </div>
                                    <div style={{ fontWeight: '900', fontSize: '15px', color: '#0f172a', marginBottom: '4px' }}>
                                        {bcast.title || 'Your Notification Title'}
                                    </div>
                                    <div style={{ fontSize: '13px', color: '#334155', lineHeight: '1.4', whiteSpace: 'pre-line' }}>
                                        {bcast.message_en || 'English message preview will appear here...'}
                                        {bcast.message_te ? `\n${bcast.message_te}` : ''}
                                    </div>
                                    {bcast.image_url && (
                                        <img 
                                            src={bcast.image_url} 
                                            alt="Banner Preview" 
                                            style={{ width: '100%', maxHeight: '160px', objectFit: 'cover', borderRadius: '10px', marginTop: '10px', border: '1px solid #e2e8f0' }} 
                                        />
                                    )}
                                    <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px dashed #e2e8f0', fontSize: '11px', color: '#2563eb', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <LinkIcon size={12}/> Opens: {bcast.action_url || '/'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ========================================================= */}
                    {/* 🤖 TAB 2: AUTOMATED TRIGGERS */}
                    {/* ========================================================= */}
                    {activeSection === 'triggers' && (
                        <div style={styles.panel}>
                            <h2 style={styles.panelTitle}><Power size={18} color="#16a34a"/> Automated Background Triggers</h2>
                            <p style={{fontSize: '13px', color: '#64748b', marginTop: '-10px', marginBottom: '16px'}}>
                                Toggle automated notifications or tap Edit to customize English and Telugu templates.
                            </p>

                            {editingTrigger && (
                                <form onSubmit={saveTriggerTemplate} style={{ background: '#eff6ff', padding: '16px', borderRadius: '12px', border: '1.5px solid #3b82f6', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    <h4 style={{ margin: 0, color: '#1e3a8a', fontSize: '14px' }}>
                                        ✏️ Editing: {editingTrigger.trigger_name.replace('_', ' ').toUpperCase()}
                                    </h4>
                                    <div>
                                        <label style={styles.label}>English Template</label>
                                        <textarea style={{...styles.textarea, background: 'white'}} value={editingTrigger.template_en} onChange={(e) => setEditingTrigger({...editingTrigger, template_en: e.target.value})} required />
                                    </div>
                                    <div>
                                        <label style={styles.label}>Telugu Template</label>
                                        <textarea style={{...styles.textarea, background: 'white'}} value={editingTrigger.template_te} onChange={(e) => setEditingTrigger({...editingTrigger, template_te: e.target.value})} required />
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button type="submit" style={{...styles.btnPrimary, marginTop: 0, flex: 1, background: '#16a34a'}}>Save Template</button>
                                        <button type="button" onClick={() => setEditingTrigger(null)} style={{...styles.btnPrimary, marginTop: 0, flex: 1, background: '#64748b'}}>Cancel</button>
                                    </div>
                                </form>
                            )}
                            
                            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: '12px' }}>
                                {triggers.length === 0 ? (
                                    <div style={{ padding: '30px', textAlign: 'center', color: '#64748b', gridColumn: '1 / -1' }}>No automated triggers configured.</div>
                                ) : triggers.map(t => (
                                    <div key={t.id} style={{ background: '#f8fafc', padding: '15px', borderRadius: '12px', border: `1.5px solid ${t.is_active ? '#86efac' : '#fecaca'}`, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{fontWeight: '900', color: '#0f172a', fontSize: '13.5px', display: 'flex', alignItems: 'center', gap: '6px'}}>
                                                {t.is_active ? <CheckCircle size={16} color="#16a34a"/> : <XCircle size={16} color="#dc2626"/>}
                                                {t.trigger_name.replace(/_/g, ' ').toUpperCase()}
                                            </span>
                                            <div style={{display: 'flex', gap: '6px'}}>
                                                <button onClick={() => setEditingTrigger(t)} style={styles.iconBtn} title="Edit Template"><Edit3 size={14}/></button>
                                                <button onClick={() => toggleTrigger(t.id, t.is_active)} style={{...styles.iconBtn, background: t.is_active ? '#fee2e2' : '#dcfce7', color: t.is_active ? '#dc2626' : '#16a34a'}}>
                                                    <Power size={14}/>
                                                </button>
                                            </div>
                                        </div>
                                        <div style={{background: 'white', padding: '10px', borderRadius: '8px', fontSize: '12px', color: '#334155', border: '1px solid #e2e8f0', lineHeight: '1.4'}}>
                                            <div><strong>EN:</strong> Hi [Name], {t.template_en}</div>
                                            <div style={{marginTop: '6px'}}><strong>TE:</strong> నమస్తే [Name], {t.template_te}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ========================================================= */}
                    {/* 📜 TAB 3: LIVE DELIVERY LOGS (CARDS ON MOBILE, TABLE ON DESKTOP) */}
                    {/* ========================================================= */}
                    {activeSection === 'logs' && (
                        <div style={styles.panel}>
                            <h2 style={styles.panelTitle}><MessageSquare size={18} color="#2563eb"/> Live Broadcast Delivery Logs</h2>
                            {logs.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '30px', color: '#64748b', fontWeight: 'bold' }}>No broadcasts sent yet.</div>
                            ) : isMobile ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {logs.map(log => (
                                        <div key={log.id} style={{ background: '#f8fafc', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ background: '#e0e7ff', color: '#1d4ed8', padding: '3px 8px', borderRadius: '6px', fontSize: '10.5px', fontWeight: '900' }}>
                                                    {(log.audience || 'all').toUpperCase()}
                                                </span>
                                                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>{formatTime(log.created_at)}</span>
                                            </div>
                                            <div style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a' }}>{log.title}</div>
                                            <div style={{ display: 'flex', gap: '12px', fontSize: '12px', fontWeight: '800' }}>
                                                <span style={{ color: '#16a34a' }}>✓ Delivered: {log.success_count || 0}</span>
                                                <span style={{ color: '#dc2626' }}>✕ Failed: {log.failed_count || 0}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div style={{ overflowX: 'auto' }}>
                                    <table style={styles.table}>
                                        <thead>
                                            <tr>
                                                <th style={styles.th}>Time</th>
                                                <th style={styles.th}>Audience</th>
                                                <th style={styles.th}>Message Title</th>
                                                <th style={styles.th}>Delivered</th>
                                                <th style={styles.th}>Failed/Revoked</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {logs.map(log => (
                                                <tr key={log.id} style={styles.tr}>
                                                    <td style={styles.td}>{formatTime(log.created_at)}</td>
                                                    <td style={styles.td}>
                                                        <span style={{background: '#f1f5f9', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', color: '#475569'}}>{(log.audience || 'all').toUpperCase()}</span>
                                                    </td>
                                                    <td style={styles.td}><strong>{log.title}</strong></td>
                                                    <td style={{...styles.td, color: '#16a34a', fontWeight: 'bold'}}>{log.success_count}</td>
                                                    <td style={{...styles.td, color: '#dc2626', fontWeight: 'bold'}}>{log.failed_count}</td>
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