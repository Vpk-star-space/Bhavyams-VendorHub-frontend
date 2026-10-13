import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Users, ShieldAlert, BarChart3, Activity, Image as ImageIcon, Link as LinkIcon, Power, Edit3, MessageSquare, CheckCircle, XCircle, Upload } from 'lucide-react';
import { toast } from 'react-toastify';
import Navbar from '../components/Navbar';

const PushDashboard = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    
    // 📊 Dashboard Data
    const [analytics, setAnalytics] = useState({ active: 0, revoked: 0, vendors: 0, customers: 0 });
    const [logs, setLogs] = useState([]);
    const [triggers, setTriggers] = useState([]);
    const [allUsersList, setAllUsersList] = useState([]); // 🟢 For interactive search dropdown

    // 🎯 Manual Broadcast State
    const [broadcastLoading, setBroadcastLoading] = useState(false);
    const [bcast, setBcast] = useState({
        title: '',
        message_en: '',
        message_te: '',
        audience: 'all',
        target_user_id: '', // 🟢 Storing specific user ID
        image_url: '',
        action_url: '/'
    });

    const [userSearchTerm, setUserSearchTerm] = useState(''); // 🟢 Search box for specific user

    const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    const BACKEND_URL = isLocal ? 'http://localhost:5000/api' : 'https://bhavyams-vendorhub-backend.onrender.com/api';

    const fetchDashboardData = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return navigate('/login');
            
            const res = await axios.get(`${BACKEND_URL}/push-admin/dashboard-data`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            setAnalytics(res.data.analytics);
            setLogs(res.data.logs);
            setTriggers(res.data.triggers);

            // Fetch all users for targeted selection dropdown
            const usersRes = await axios.get(`${BACKEND_URL}/admin/all-users`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setAllUsersList(usersRes.data || []);
        } catch (err) {
            toast.error("Failed to load CRM data.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, []);

    // ==========================================
    // 🖼️ FILE UPLOADER HELPER (Direct Device Upload)
    // ==========================================
    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            setBcast({ ...bcast, image_url: reader.result }); // Converts to safe Base64 string for push payload
            toast.success("✅ Image loaded successfully!");
        };
        reader.onerror = () => {
            toast.error("Failed to read image file.");
        };
    };

    // ==========================================
    // 🎯 HANDLE MANUAL BROADCAST
    // ==========================================
    const handleSendBroadcast = async (e) => {
        e.preventDefault();
        if (!bcast.title || (!bcast.message_en && !bcast.message_te)) {
            return toast.error("Title and at least one message language are required.");
        }
        if (bcast.audience === 'specific' && !bcast.target_user_id) {
            return toast.error("Please select a specific user from the dropdown list.");
        }

        if (!window.confirm(`Are you sure you want to push this to ${bcast.audience.toUpperCase()}?`)) return;

        setBroadcastLoading(true);
        try {
            const token = localStorage.getItem('token');
            const payloadData = {
                ...bcast,
                target_user: bcast.target_user_id // Pass ID to backend
            };

            const res = await axios.post(`${BACKEND_URL}/push-admin/manual-broadcast`, payloadData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            toast.success(res.data.message);
            setBcast({ ...bcast, title: '', message_en: '', message_te: '', target_user_id: '', image_url: '', action_url: '/' });
            setUserSearchTerm('');
            fetchDashboardData(); 
        } catch (err) {
            toast.error(err.response?.data?.message || err.response?.data?.error || "Broadcast failed.");
        } finally {
            setBroadcastLoading(false);
        }
    };

    // ==========================================
    // 🔴 HANDLE AUTOMATED TRIGGERS
    // ==========================================
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

    const editTriggerTemplate = async (trigger) => {
        const newEn = window.prompt("Edit English Template:", trigger.template_en);
        if (newEn === null) return;
        const newTe = window.prompt("Edit Telugu Template:", trigger.template_te);
        if (newTe === null) return;

        try {
            const token = localStorage.getItem('token');
            await axios.put(`${BACKEND_URL}/push-admin/triggers/edit/${trigger.id}`, 
                { template_en: newEn, template_te: newTe }, 
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success("Template updated successfully!");
            fetchDashboardData();
        } catch (err) {
            toast.error("Failed to update template.");
        }
    };

    const formatTime = (dateString) => {
        return new Date(dateString).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    // Filter users for interactive dropdown search
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
                        <button onClick={() => navigate('/admin')} style={styles.backBtn}><ArrowLeft size={18} /> Back to Master</button>
                        <h1 style={styles.title}><Activity size={24} color="#2563eb" /> Push Engagement CRM</h1>
                    </div>

                    {/* 📊 SECTION 1: LIVE ANALYTICS */}
                    <div style={styles.statsGrid}>
                        <div style={{...styles.statCard, background: '#eff6ff', borderColor: '#bfdbfe'}}>
                            <div style={{color: '#1e3a8a', fontSize: '13px', fontWeight: 'bold'}}>Active Subscriptions</div>
                            <div style={{fontSize: '28px', fontWeight: '900', color: '#2563eb', margin: '5px 0'}}>{analytics.active}</div>
                            <div style={{color: '#60a5fa', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px'}}><BarChart3 size={12}/> Live Devices</div>
                        </div>
                        <div style={{...styles.statCard, background: '#fef2f2', borderColor: '#fecaca'}}>
                            <div style={{color: '#7f1d1d', fontSize: '13px', fontWeight: 'bold'}}>Revoked / Uninstalled</div>
                            <div style={{fontSize: '28px', fontWeight: '900', color: '#dc2626', margin: '5px 0'}}>{analytics.revoked}</div>
                            <div style={{color: '#f87171', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px'}}><ShieldAlert size={12}/> Blocked Pushes</div>
                        </div>
                        <div style={{...styles.statCard, background: '#fef9c3', borderColor: '#fef08a'}}>
                            <div style={{color: '#713f12', fontSize: '13px', fontWeight: 'bold'}}>Vendor Reach</div>
                            <div style={{fontSize: '28px', fontWeight: '900', color: '#d97706', margin: '5px 0'}}>{analytics.vendors}</div>
                            <div style={{color: '#fbbf24', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px'}}><Users size={12}/> Connected Shops</div>
                        </div>
                        <div style={{...styles.statCard, background: '#f0fdf4', borderColor: '#bbf7d0'}}>
                            <div style={{color: '#14532d', fontSize: '13px', fontWeight: 'bold'}}>Customer Reach</div>
                            <div style={{fontSize: '28px', fontWeight: '900', color: '#16a34a', margin: '5px 0'}}>{analytics.customers}</div>
                            <div style={{color: '#4ade80', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px'}}><Users size={12}/> Connected Users</div>
                        </div>
                    </div>

                    <div style={styles.gridLayout}>
                        {/* 🎯 SECTION 2: MANUAL COMPOSER */}
                        <div style={styles.panel}>
                            <h2 style={styles.panelTitle}><Send size={18}/> Manual Broadcast Composer</h2>
                            <form onSubmit={handleSendBroadcast} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                
                                <div style={styles.inputGroup}>
                                    <label style={styles.label}>1. Select Target Audience</label>
                                    <select style={styles.input} value={bcast.audience} onChange={(e) => setBcast({...bcast, audience: e.target.value})}>
                                        <option value="all">🌍 All Active Users</option>
                                        <option value="customers">👤 Only Customers</option>
                                        <option value="vendors">🏪 Only Vendors</option>
                                        <option value="specific">🎯 Specific User (Database Search)</option>
                                    </select>
                                </div>

                                {/* 🟢 INTERACTIVE USER SEARCH DROPDOWN */}
                                {bcast.audience === 'specific' && (
                                    <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1' }}>
                                        <label style={styles.label}>Search User (Name, Phone, or Email)</label>
                                        <input 
                                            type="text" 
                                            placeholder="Type to filter users..." 
                                            style={{...styles.input, marginBottom: '8px'}} 
                                            value={userSearchTerm} 
                                            onChange={(e) => setUserSearchTerm(e.target.value)} 
                                        />
                                        <select 
                                            style={styles.input} 
                                            value={bcast.target_user_id} 
                                            onChange={(e) => setBcast({...bcast, target_user_id: e.target.value})}
                                            required
                                        >
                                            <option value="">-- Choose User from Database --</option>
                                            {filteredUsersDropdown.map(u => (
                                                <option key={u.id} value={u.username}>
                                                    {u.username} ({u.role.toUpperCase()}) - {u.phone || u.email}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                <div style={styles.inputGroup}>
                                    <label style={styles.label}>2. Notification Title (Header)</label>
                                    <input type="text" placeholder="e.g., 🚀 Massive Weekend Sale!" style={styles.input} value={bcast.title} onChange={(e) => setBcast({...bcast, title: e.target.value})} required />
                                </div>

                                <div style={{display: 'flex', gap: '10px', flexDirection: window.innerWidth < 768 ? 'column' : 'row'}}>
                                    <div style={{...styles.inputGroup, flex: 1}}>
                                        <label style={styles.label}>English Message</label>
                                        <textarea placeholder="Get 50% off on all fresh vegetables today..." style={styles.textarea} value={bcast.message_en} onChange={(e) => setBcast({...bcast, message_en: e.target.value})} />
                                    </div>
                                    <div style={{...styles.inputGroup, flex: 1}}>
                                        <label style={styles.label}>Telugu Message</label>
                                        <textarea placeholder="ఈరోజు అన్ని తాజా కూరగాయలపై 50% తగ్గింపు పొందండి..." style={styles.textarea} value={bcast.message_te} onChange={(e) => setBcast({...bcast, message_te: e.target.value})} />
                                    </div>
                                </div>

                                <div style={{display: 'flex', gap: '10px', flexDirection: window.innerWidth < 768 ? 'column' : 'row'}}>
                                    {/* 🟢 DIRECT FILE UPLOADER INSTEAD OF RAW URL */}
                                    <div style={{...styles.inputGroup, flex: 1}}>
                                        <label style={styles.label}><Upload size={14}/> Upload Promo Banner Image</label>
                                        <input type="file" accept="image/*" style={styles.input} onChange={handleImageUpload} />
                                        {bcast.image_url && <span style={{fontSize: '10px', color: '#16a34a', fontWeight: 'bold'}}>Image loaded and ready to attach!</span>}
                                    </div>
                                    
                                    <div style={{...styles.inputGroup, flex: 1}}>
                                        <label style={styles.label}><LinkIcon size={14}/> Action Click URL</label>
                                        <input type="text" placeholder="e.g., /expo or /shop/5" style={styles.input} value={bcast.action_url} onChange={(e) => setBcast({...bcast, action_url: e.target.value})} />
                                    </div>
                                </div>

                                <button type="submit" disabled={broadcastLoading} style={{...styles.btnPrimary, opacity: broadcastLoading ? 0.7 : 1}}>
                                    {broadcastLoading ? 'Initiating Launch...' : '🚀 SEND PUSH BROADCAST'}
                                </button>
                            </form>
                        </div>

                        {/* 🤖 SECTION 3: AUTOMATED TRIGGERS */}
                        <div style={{...styles.panel, background: '#f8fafc'}}>
                            <h2 style={styles.panelTitle}><Power size={18}/> Automated Triggers (The Brain)</h2>
                            <p style={{fontSize: '12px', color: '#64748b', marginBottom: '15px'}}>Control the background engine. Turn off specific triggers or edit their bilingual templates.</p>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {triggers.map(t => (
                                    <div key={t.id} style={{ background: 'white', padding: '15px', borderRadius: '12px', border: `1px solid ${t.is_active ? '#bbf7d0' : '#fecaca'}`, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{fontWeight: 'bold', color: '#0f172a', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px'}}>
                                                {t.is_active ? <CheckCircle size={16} color="#16a34a"/> : <XCircle size={16} color="#dc2626"/>}
                                                {t.trigger_name.replace('_', ' ').toUpperCase()}
                                            </span>
                                            <div style={{display: 'flex', gap: '6px'}}>
                                                <button onClick={() => editTriggerTemplate(t)} style={styles.iconBtn}><Edit3 size={14}/></button>
                                                <button onClick={() => toggleTrigger(t.id, t.is_active)} style={{...styles.iconBtn, background: t.is_active ? '#fee2e2' : '#dcfce7', color: t.is_active ? '#dc2626' : '#16a34a'}}>
                                                    <Power size={14}/>
                                                </button>
                                            </div>
                                        </div>
                                        <div style={{background: '#f1f5f9', padding: '10px', borderRadius: '8px', fontSize: '12px', color: '#475569'}}>
                                            <strong>EN:</strong> Hi [Name], {t.template_en}<br/>
                                            <strong style={{marginTop: '4px', display: 'block'}}>TE:</strong> నమస్తే [Name], {t.template_te}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* 📜 SECTION 4: DELIVERY LOGS */}
                    <div style={{...styles.panel, marginTop: '20px'}}>
                        <h2 style={styles.panelTitle}><MessageSquare size={18}/> Live Delivery Logs</h2>
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
                                    {logs.length === 0 ? (
                                        <tr><td colSpan="5" style={{textAlign: 'center', padding: '20px', color: '#64748b'}}>No broadcasts sent yet.</td></tr>
                                    ) : logs.map(log => (
                                        <tr key={log.id} style={styles.tr}>
                                            <td style={styles.td}>{formatTime(log.created_at)}</td>
                                            <td style={styles.td}>
                                                <span style={{background: '#f1f5f9', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', color: '#475569'}}>{log.audience.toUpperCase()}</span>
                                            </td>
                                            <td style={styles.td}><strong>{log.title}</strong></td>
                                            <td style={{...styles.td, color: '#16a34a', fontWeight: 'bold'}}>{log.success_count}</td>
                                            <td style={{...styles.td, color: '#dc2626', fontWeight: 'bold'}}>{log.failed_count}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                </div>
            </div>
        </>
    );
};

const styles = {
    page: { background: '#f8fafc', minHeight: '100vh', padding: '15px', fontFamily: 'Inter, sans-serif' },
    container: { maxWidth: '1200px', margin: '0 auto', paddingBottom: '30px' },
    loading: { textAlign: 'center', padding: '50px', fontSize: '18px', fontWeight: 'bold', color: '#334155' },
    headerBar: { display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '25px', flexWrap: 'wrap' },
    title: { margin: 0, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '22px', fontWeight: '900' },
    backBtn: { background: 'white', border: '1px solid #cbd5e1', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold', fontSize: '13px', color: '#475569' },
    
    statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '25px' },
    statCard: { padding: '20px', borderRadius: '16px', border: '1px solid', display: 'flex', flexDirection: 'column', justifyContent: 'center' },
    
    gridLayout: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '20px' },
    panel: { background: 'white', padding: '25px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' },
    panelTitle: { margin: '0 0 20px 0', fontSize: '18px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '800' },
    
    inputGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
    label: { fontSize: '13px', fontWeight: 'bold', color: '#475569', display: 'flex', alignItems: 'center', gap: '6px' },
    input: { padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', background: '#f8fafc', outline: 'none', width: '100%', boxSizing: 'border-box' },
    textarea: { padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', background: '#f8fafc', outline: 'none', minHeight: '80px', resize: 'vertical' },
    
    btnPrimary: { background: '#2563eb', color: 'white', border: 'none', padding: '14px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px', marginTop: '10px' },
    iconBtn: { background: '#e2e8f0', border: 'none', padding: '8px', borderRadius: '8px', cursor: 'pointer', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: '0.2s' },

    table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' },
    th: { padding: '12px 15px', background: '#f1f5f9', color: '#475569', fontWeight: 'bold', borderBottom: '2px solid #e2e8f0' },
    td: { padding: '12px 15px', borderBottom: '1px solid #e2e8f0', color: '#334155' },
    tr: { transition: '0.2s', ':hover': { background: '#f8fafc' } }
};

export default PushDashboard;