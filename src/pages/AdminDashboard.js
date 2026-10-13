import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client'; 
import { ShieldCheck, ExternalLink, ArrowLeft, AlertTriangle, Trash2, CheckCircle, FolderSync, PlusCircle, Eye, ImagePlus, MessageSquare, Lock, Edit, UserX, Unlock, Clock, Ban, Search, Users, Store, User, BellRing } from 'lucide-react';
import { toast } from 'react-toastify';
import Navbar from '../components/Navbar';

const getOptimizedImage = (url) => {
    if (!url) return null;
    if (url.includes('cloudinary.com') && !url.includes('q_auto')) {
        return url.replace('/upload/', '/upload/q_auto,f_auto,w_400/');
    }
    return url; 
};

// 🟢 SMART 5-TIER BADGE RENDERER FOR ADMIN
const renderAdminBadge = (isOfficial, isVerified, accountStatus) => {
    const baseStyle = { display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '900', whiteSpace: 'nowrap' };
    
    if (accountStatus === 'perma_banned') return <span style={{...baseStyle, background: '#0f172a', color: 'white'}}>⬛ Banned</span>;
    if (accountStatus === 'temp_block') return <span style={{...baseStyle, background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca'}}>🟥 Suspended</span>;
    if (isOfficial) return <span style={{...baseStyle, background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a'}}>🌟 Official</span>;
    if (isVerified) return <span style={{...baseStyle, background: '#dcfce7', color: '#15803d', border: '1px solid #86efac'}}>✅ Verified</span>;
    return <span style={{...baseStyle, background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe'}}>🔹 Standard</span>;
};

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [vendors, setVendors] = useState([]);
    const [categories, setCategories] = useState([]);
    const [allUsers, setAllUsers] = useState([]); 
    
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState(null);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const [activeTab, setActiveTab] = useState('pending');
    
    const [adminSearch, setAdminSearch] = useState('');
    const [newCatName, setNewCatName] = useState('');
    const [newCatSection, setNewCatSection] = useState('Products');
    const [newCatImage, setNewCatImage] = useState(null);

    const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    const BACKEND_URL = isLocal ? 'http://localhost:5000/api' : 'https://bhavyams-vendorhub-backend.onrender.com/api';
    const SOCKET_URL = isLocal ? 'http://localhost:5000' : 'https://bhavyams-vendorhub-backend.onrender.com';

    useEffect(() => {
        const localSocket = io(SOCKET_URL, { transports: ['websocket'] });
        localSocket.on('connect', () => console.log('🟢 Admin Socket Live Sync Connected'));
        
        localSocket.on('admin_refresh', () => {
            fetchVendors(); 
            fetchCategories(); 
            fetchAllUsers(); 
        });

        return () => {
            if (localSocket.connected) localSocket.disconnect();
        };
    }, [SOCKET_URL]);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const fetchVendors = async () => {
        try {
            setErrorMsg(null);
            const token = localStorage.getItem('token');
            if (!token) return navigate('/welcome');
            
            const res = await axios.get(`${BACKEND_URL}/admin/pending-vendors`, { headers: { Authorization: `Bearer ${token}` } });
            setVendors(res.data || []);
        } catch (err) { 
            if (err.response?.status === 401) {
                localStorage.removeItem('token');
                navigate('/welcome'); 
            } else {
                setErrorMsg("Failed to connect to backend server."); 
            }
        } finally { 
            setLoading(false); 
        }
    };

    const fetchCategories = async () => {
        try {
            const res = await axios.get(`${BACKEND_URL}/admin/categories`);
            setCategories(res.data || []);
        } catch (err) { }
    };

    const fetchAllUsers = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${BACKEND_URL}/admin/all-users`, { headers: { Authorization: `Bearer ${token}` } });
            setAllUsers(res.data || []);
        } catch (err) { 
            console.error("Failed to load user list:", err.message);
        }
    };

    useEffect(() => { 
        fetchVendors(); 
        fetchCategories(); 
        fetchAllUsers(); 
    }, []);

    useEffect(() => {
        if (activeTab === 'security') {
            const interval = setInterval(() => { fetchAllUsers(); }, 15000);
            return () => clearInterval(interval);
        }
    }, [activeTab]);

    const handleTypeToggle = async (shop, toggledType) => {
        try {
            const currentTypes = shop.shop_type ? shop.shop_type.split(',').map(s => s.trim()) : ['Products'];
            let newTypes = currentTypes.includes(toggledType) ? currentTypes.filter(t => t !== toggledType) : [...currentTypes, toggledType];
            if (newTypes.length === 0) newTypes = ['Products'];

            const token = localStorage.getItem('token');
            const formData = new FormData();
            formData.append('business_name', shop.business_name);
            formData.append('category', shop.category);
            formData.append('shop_type', newTypes.join(',')); 
            formData.append('is_online', shop.is_online);

            await axios.put(`${BACKEND_URL}/shops/${shop.id}`, formData, { headers: { 'Authorization': `Bearer ${token}` } });
            fetchVendors(); 
        } catch (err) { toast.error("Failed to toggle section."); }
    };

    const handleAdminEdit = async (vendor) => {
        const newBusinessName = window.prompt("Edit Business Name:", vendor.business_name);
        if (!newBusinessName) return;
        const newCategory = window.prompt("Edit Categories:", vendor.category);
        if (!newCategory) return;

        try {
            const token = localStorage.getItem('token');
            const formData = new FormData();
            formData.append('business_name', newBusinessName);
            formData.append('category', newCategory);
            formData.append('shop_type', vendor.shop_type); 

            await axios.put(`${BACKEND_URL}/shops/${vendor.id}`, formData, { headers: { 'Authorization': `Bearer ${token}` } });
            toast.success(`✅ ${newBusinessName} updated!`);
            fetchVendors(); 
        } catch (err) { toast.error("Failed to edit."); }
    };

    const handleAction = async (id, businessName, actionType) => {
        let reason = '';
        if (actionType === 'request_changes') {
            reason = window.prompt(`What needs to be fixed by "${businessName}"?`);
            if (!reason) return; 
        } else {
            const prompts = { approve: `Approve "${businessName}"?`, suspend: `Unlist "${businessName}" back to Pending?`, delete: `PERMANENTLY DELETE "${businessName}"?` };
            if (!window.confirm(prompts[actionType])) return;
        }

        try {
            const token = localStorage.getItem('token');
            if (actionType === 'approve') await axios.put(`${BACKEND_URL}/admin/approve-vendor/${id}`, {}, { headers: { Authorization: `Bearer ${token}` } });
            else if (actionType === 'suspend') await axios.put(`${BACKEND_URL}/admin/suspend-vendor/${id}`, {}, { headers: { Authorization: `Bearer ${token}` } });
            else if (actionType === 'delete') await axios.delete(`${BACKEND_URL}/admin/delete-vendor/${id}`, { headers: { Authorization: `Bearer ${token}` } });
            else if (actionType === 'request_changes') await axios.put(`${BACKEND_URL}/admin/request-changes/${id}`, { reason }, { headers: { Authorization: `Bearer ${token}` } });
            fetchVendors();
        } catch (err) { toast.error(`Failed to execute ${actionType}.`); }
    };

    const fileToBase64 = (file) => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = (error) => reject(error);
    });

    const handleCreateCategory = async (e) => {
        e.preventDefault();
        if (!newCatName || !newCatImage) return toast.error("Please provide a name and upload an HD photo.");
        try {
            const token = localStorage.getItem('token');
            const base64Image = await fileToBase64(newCatImage);
            await axios.post(`${BACKEND_URL}/admin/categories`, { name: newCatName, section: newCatSection, hd_image: base64Image }, { headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } });
            toast.success(`✅ Added ${newCatName}!`);
            setNewCatName(''); setNewCatImage(null);
            fetchCategories(); 
        } catch (err) { toast.error("Failed to upload category."); }
    };

    const handleDeleteCategory = async (id, name) => {
        if (!window.confirm(`Delete category "${name}"?`)) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${BACKEND_URL}/admin/categories/${id}`, { headers: { Authorization: `Bearer ${token}` }});
            fetchCategories();
        } catch (err) { toast.error("Failed to delete category."); }
    };

    const toggleUserFeature = async (user, featureKey) => {
        const currentValue = user[featureKey] !== false; 
        const newValue = !currentValue;
        const featureName = featureKey.replace('can_', '').toUpperCase();
        
        let reason = `Admin ${newValue ? 'enabled' : 'disabled'} ${featureName}`;
        if (!newValue) {
            reason = window.prompt(`Why are you DISABLING ${featureName} for ${user.username}?`);
            if (!reason) return;
        }

        try {
            const token = localStorage.getItem('token');
            const features = {
                can_message: user.can_message !== false,
                can_call: user.can_call !== false,
                can_book: user.can_book !== false,
                [featureKey]: newValue
            };
            
            await axios.put(`${BACKEND_URL}/admin/user-security/${user.id}`, { action: 'toggle_features', reason: reason, features }, { headers: { Authorization: `Bearer ${token}` } });
            toast.success(`✅ ${featureName} is now ${newValue ? 'ON' : 'OFF'} for ${user.username}`);
            fetchAllUsers();
        } catch (err) { 
            toast.error(err.response?.data?.message || "Failed to toggle feature."); 
        }
    };

    const handleUserSecurity = async (userId, username, action) => {
        let reason = '';
        let minutes = 30;

        if (action === 'warn') {
            reason = window.prompt(`⚠️ SEND WARNING TO ${username}:\nType the message that will scroll on their home screen:`);
            if (!reason) return;
        } else if (action === 'add_strike') {
            reason = window.prompt(`⚠️ ISSUE STRIKE TO ${username}:\nThey will be permanently banned at 3 strikes.\nReason for strike:`);
            if (!reason) return;
        } else if (action === 'temp_block') {
            reason = window.prompt(`⏳ TEMP BLOCK ${username}:\nReason for block:`);
            if (!reason) return;
            const timeInput = window.prompt(`How long? Enter minutes or use h/d:\nExamples:\n"30" = 30 minutes\n"2h" = 2 hours\n"1d" = 1 day`);
            if (!timeInput) return;
            const val = parseInt(timeInput, 10);
            if (isNaN(val) || val <= 0) return alert("Please enter a valid positive number.");
            if (timeInput.toLowerCase().includes('d')) minutes = val * 1440;
            else if (timeInput.toLowerCase().includes('h')) minutes = val * 60;
            else minutes = val;
        } else if (action === 'perma_banned') {
            reason = window.prompt(`⛔ PERMA BAN ${username}:\nState the reason for permanent ban:`);
            if (!reason) return;
            if (!window.confirm(`Are you sure you want to PERMANENTLY BAN ${username}?`)) return;
        } else if (action === 'unblock') {
            if (!window.confirm(`Remove all restrictions, strikes, and bans from ${username}?`)) return;
        } else if (action === 'delete') {
            if (!window.confirm(`🚨 CRITICAL: Permanently wipe ${username} and all their shop/orders data?`)) return;
        }

        try {
            const token = localStorage.getItem('token');
            if (action === 'delete') {
                await axios.delete(`${BACKEND_URL}/admin/delete-user/${userId}`, { headers: { Authorization: `Bearer ${token}` } });
                toast.success(`🗑 User ${username} deleted.`);
            } else {
                const res = await axios.put(`${BACKEND_URL}/admin/user-security/${userId}`, { action, reason, minutes }, { headers: { Authorization: `Bearer ${token}` } });
                toast.success(`✅ ${res.data.message}`);
            }
            fetchAllUsers(); 
            fetchVendors(); 
        } catch (err) { 
            toast.error(err.response?.data?.message || `🚨 Failed to apply ${action}. Backend error.`); 
        }
    };

    const openSecureDocument = async (e, publicId) => {
        if (e) { e.preventDefault(); e.stopPropagation(); }
        const token = localStorage.getItem('token');
        if (!token) return toast.error("Authentication required.");

        try {
            const res = await axios.get(`${BACKEND_URL}/admin/secure-doc/${encodeURIComponent(publicId)}`, { headers: { Authorization: `Bearer ${token}` } });
            if (res.data?.url) window.open(res.data.url, '_blank', 'noopener,noreferrer');
        } catch (err) { 
            toast.error(err.response?.data?.error || "Failed to generate secure document link."); 
        }
    };

    const formatIST = (dateString) => {
        if (!dateString) return '';
        const options = { timeZone: 'Asia/Kolkata', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        return new Date(dateString).toLocaleString('en-IN', options);
    };

    const safeSearch = adminSearch.toLowerCase().trim();
    const displayVendors = activeTab === 'pending' 
        ? vendors.filter(v => v.is_approved === false && (v.business_name?.toLowerCase().includes(safeSearch) || v.username?.toLowerCase().includes(safeSearch))) 
        : vendors.filter(v => v.is_approved === true && (v.business_name?.toLowerCase().includes(safeSearch) || v.username?.toLowerCase().includes(safeSearch)));
    
    const filteredUsers = allUsers.filter(u => u.username?.toLowerCase().includes(safeSearch) || u.phone?.includes(safeSearch) || u.email?.toLowerCase().includes(safeSearch));

    const TYPE_OPTIONS = ["Trending", "Products", "Services", "Expo", "Business"];
    const displayNames = { 'Products': '🛍️ Shopping', 'Services': '🧑‍🔧 Services', 'Business': '📈 Business', 'Trending': '🔥 Trending', 'Expo': '🌟 Expo' };

    const activeShops = vendors.filter(v => v.is_approved === true);
    let extractedVendorCategories = [];
    activeShops.forEach(shop => {
        if (shop.category) {
            shop.category.split(',').forEach(c => {
                const cleanCat = c.trim();
                if (cleanCat) extractedVendorCategories.push({ name: cleanCat, shopName: shop.business_name, shopId: shop.id });
            });
        }
    });

    const dynamicFolders = {};
    extractedVendorCategories.forEach(item => {
        if (!dynamicFolders[item.name]) dynamicFolders[item.name] = [];
        dynamicFolders[item.name].push({ name: item.shopName, id: item.shopId });
    });

    const adminCatNamesLower = categories.map(c => c.name.toLowerCase().trim());
    const unstyledFolders = Object.keys(dynamicFolders).filter(cat => !adminCatNamesLower.includes(cat.toLowerCase()));

    if (loading) return <div style={styles.loading}>Loading Master Control Room...</div>;

   return (
       <> 
           <Navbar /> 
        <div style={styles.page}>
            <div style={styles.container}>
                
                {/* HEADER */}
                <div style={styles.headerBar}>
                    <button onClick={() => navigate('/')} style={styles.backBtn}><ArrowLeft size={18} /> {isMobile ? "" : "Back"}</button>
                    <h1 style={styles.title}><ShieldCheck size={22} color="#2874f0" /> Master Admin</h1>
                </div>

                {errorMsg && <div style={styles.errorBox}>❌ {errorMsg}</div>}

                {/* CRM PORTAL BUTTON */}
                <div style={{ background: 'linear-gradient(135deg, #1e3a8a, #3b82f6)', borderRadius: '16px', padding: isMobile ? '20px' : '24px', marginBottom: '24px', color: 'white', display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', gap: '15px', boxShadow: '0 10px 25px rgba(37, 99, 235, 0.2)' }}>
                    <div>
                        <h3 style={{ margin: '0 0 5px 0', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '18px' }}>
                            <BellRing size={22} /> Push & Engagement CRM
                        </h3>
                        <p style={{ margin: 0, fontSize: '13px', color: '#bfdbfe', lineHeight: '1.4' }}>Manage automated triggers, broadcast manual pushes, and view live install analytics.</p>
                        <p style={{ margin: '6px 0 0 0', fontSize: '11px', color: '#60a5fa', fontWeight: 'bold' }}>⚡ Subhams Push Engine automatically delivers offline.</p>
                    </div>
                    <button onClick={() => navigate('/admin/push')} style={{ background: '#facc15', color: '#713f12', border: 'none', padding: '12px 24px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', width: isMobile ? '100%' : 'auto', justifyContent: 'center' }}>
                        Open CRM <ExternalLink size={16} />
                    </button>
                </div>

                {/* STATS */}
                <div style={styles.statsContainer}>
                    <div style={{...styles.statCard, background: '#eff6ff', border: '1px solid #bfdbfe'}}>
                        <Users size={20} color="#2563eb" />
                        <div>
                            <h3 style={{margin: 0, fontSize: '18px', color: '#1e3a8a'}}>{allUsers.length}</h3>
                            <p style={{margin: 0, fontSize: '11px', color: '#3b82f6', fontWeight: 'bold'}}>Total Users</p>
                        </div>
                    </div>
                    <div style={{...styles.statCard, background: '#f0fdf4', border: '1px solid #bbf7d0'}}>
                        <User size={20} color="#16a34a" />
                        <div>
                            <h3 style={{margin: 0, fontSize: '18px', color: '#14532d'}}>{allUsers.filter(u=>u.role==='customer').length}</h3>
                            <p style={{margin: 0, fontSize: '11px', color: '#22c55e', fontWeight: 'bold'}}>Customers</p>
                        </div>
                    </div>
                    <div style={{...styles.statCard, background: '#fef9c3', border: '1px solid #fef08a'}}>
                        <Store size={20} color="#ca8a04" />
                        <div>
                            <h3 style={{margin: 0, fontSize: '18px', color: '#713f12'}}>{allUsers.filter(u=>u.role==='vendor').length}</h3>
                            <p style={{margin: 0, fontSize: '11px', color: '#eab308', fontWeight: 'bold'}}>Vendors</p>
                        </div>
                    </div>
                </div>

                {/* SEARCH */}
                <div style={{ display: 'flex', alignItems: 'center', background: 'white', padding: '12px 15px', borderRadius: '12px', border: '1px solid #cbd5e1', marginBottom: '20px', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
                    <Search size={18} color="#64748b" />
                    <input type="text" placeholder="Search users, shops, emails..." value={adminSearch} onChange={(e) => setAdminSearch(e.target.value)} style={{ border: 'none', outline: 'none', width: '100%', marginLeft: '10px', fontSize: '14px', background: 'transparent' }} />
                </div>

                {/* TABS */}
                <div className="hide-scroll" style={styles.tabContainer}>
                    <button style={activeTab === 'pending' ? styles.activeTab : styles.inactiveTab} onClick={() => setActiveTab('pending')}>⏳ Pending</button>
                    <button style={activeTab === 'active' ? styles.activeTab : styles.inactiveTab} onClick={() => setActiveTab('active')}>✅ Active Shops</button>
                    <button style={activeTab === 'categories' ? styles.activeTab : styles.inactiveTab} onClick={() => setActiveTab('categories')}>📂 Folders</button>
                    <button style={activeTab === 'security' ? {...styles.activeTab, background: '#ef4444'} : styles.inactiveTab} onClick={() => setActiveTab('security')}>🛡 Security</button>
                </div>

                {/* 🛡️ SECURITY TAB */}
                {activeTab === 'security' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <div style={{...styles.card, background: '#fef2f2', border: '1px solid #ef4444'}}>
                            <h2 style={{marginTop: 0, color: '#b91c1c', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '18px'}}><AlertTriangle /> Global Security Center</h2>
                            <p style={{color: '#991b1b', fontSize: '13px', margin: 0, lineHeight: '1.4'}}>Manage all accounts. Toggle features individually or issue Strikes. 3 Strikes = Auto Ban.</p>
                        </div>

                        {filteredUsers.length === 0 ? <div style={styles.emptyBox}>No users found.</div> : filteredUsers.map(u => {
                            const chatOn = u.can_message !== false;
                            const callOn = u.can_call !== false;
                            const bookOn = u.can_book !== false;
                            const isWarned = u.strikes >= 2;
                            const isBanned = u.account_status === 'perma_banned';
                            const isMasterAccount = u.email === 'pavanvenkat63@gmail.com' || String(u.id) === "1";

                            return (
                            <div key={u.id} style={{...styles.card, display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', gap: '15px', padding: '15px', borderLeft: isBanned ? '5px solid #dc2626' : isWarned ? '5px solid #f59e0b' : '1px solid #e2e8f0'}}>
                                <div style={{width: '100%'}}>
                                    <h4 style={{ margin: '0 0 5px 0', fontSize: '16px', color: '#0f172a', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                                        {u.username} <span style={{fontSize: '10px', background: '#e2e8f0', padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase'}}>{u.role}</span>
                                    </h4>
                                    <p style={{margin: '0 0 4px 0', fontSize: '12px', color: '#475569', wordBreak: 'break-all'}}>📧 {u.email || 'No email'} | 📱 {u.phone || 'No phone'}</p>
                                    
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px', flexWrap: 'wrap' }}>
                                        <span style={{fontSize: '12px', fontWeight: 'bold', padding: '3px 8px', borderRadius: '6px', background: u.account_status === 'active' ? '#dcfce7' : '#fee2e2', color: u.account_status === 'active' ? '#166534' : '#991b1b'}}>
                                            Status: {(u.account_status || 'active').replace('_', ' ').toUpperCase()}
                                        </span>
                                        {u.account_status === 'temp_block' && u.ban_until && (
                                            <span style={{fontSize: '11px', color: '#b45309', display: 'flex', alignItems: 'center', gap: '4px'}}><Clock size={12}/> Unblocks: {formatIST(u.ban_until)}</span>
                                        )}
                                    </div>
                                    {u.ban_reason && <p style={{margin: '8px 0 0 0', fontSize: '12px', color: '#b91c1c', fontWeight: 'bold'}}>⚠️ Msg: {u.ban_reason}</p>}

                                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '12px' }}>
                                        <div onClick={() => !isMasterAccount && toggleUserFeature(u, 'can_message')} style={{ cursor: isMasterAccount ? 'default' : 'pointer', padding: '4px 8px', background: chatOn ? '#f0fdf4' : '#fef2f2', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', color: chatOn ? '#166534' : '#991b1b', border: `1px solid ${chatOn ? '#bbf7d0' : '#fecaca'}` }}>
                                            💬 Chat: {chatOn ? 'ON' : 'OFF'}
                                        </div>
                                        <div onClick={() => !isMasterAccount && toggleUserFeature(u, 'can_call')} style={{ cursor: isMasterAccount ? 'default' : 'pointer', padding: '4px 8px', background: callOn ? '#f0fdf4' : '#fef2f2', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', color: callOn ? '#166534' : '#991b1b', border: `1px solid ${callOn ? '#bbf7d0' : '#fecaca'}` }}>
                                            📞 Call: {callOn ? 'ON' : 'OFF'}
                                        </div>
                                        <div onClick={() => !isMasterAccount && toggleUserFeature(u, 'can_book')} style={{ cursor: isMasterAccount ? 'default' : 'pointer', padding: '4px 8px', background: bookOn ? '#f0fdf4' : '#fef2f2', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', color: bookOn ? '#166534' : '#991b1b', border: `1px solid ${bookOn ? '#bbf7d0' : '#fecaca'}` }}>
                                            📅 Book: {bookOn ? 'ON' : 'OFF'}
                                        </div>
                                        <div style={{ padding: '4px 8px', background: u.strikes >= 2 ? '#fef08a' : '#f1f5f9', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', color: u.strikes >= 2 ? '#a16207' : '#475569', border: '1px solid #cbd5e1' }}>
                                            ⚠️ Strikes: {u.strikes || 0}/3
                                        </div>
                                    </div>
                                </div>
                                
                                {isMasterAccount ? (
                                    <div style={{ padding: '12px 15px', background: '#fef9c3', color: '#a16207', borderRadius: '10px', fontWeight: '900', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', width: isMobile ? '100%' : 'auto', justifyContent: 'center', border: '1px dashed #eab308' }}>
                                        🛡️ Master Admin (Immune)
                                    </div>
                                ) : (
                                    <div style={{display: 'flex', gap: '8px', flexWrap: 'wrap', width: isMobile ? '100%' : 'auto', alignContent: 'flex-start'}}>
                                        {u.account_status !== 'active' ? (
                                            <button onClick={() => handleUserSecurity(u.id, u.username, 'unblock')} style={{...styles.approveBtn, flex: 1, background: '#16a34a', justifyContent: 'center'}}><Unlock size={14}/> Unblock All</button>
                                        ) : (
                                            <>
                                                <button onClick={() => handleUserSecurity(u.id, u.username, 'warn')} style={{...styles.suspendBtn, flex: 1, justifyContent: 'center'}}><AlertTriangle size={14}/> Warn</button>
                                                <button onClick={() => handleUserSecurity(u.id, u.username, 'add_strike')} style={{...styles.suspendBtn, background: '#d97706', flex: 1, justifyContent: 'center'}}><AlertTriangle size={14}/> Strike</button>
                                                <button onClick={() => handleUserSecurity(u.id, u.username, 'temp_block')} style={{...styles.suspendBtn, background: '#ea580c', flex: 1, justifyContent: 'center'}}><Clock size={14}/> Block Time</button>
                                            </>
                                        )}
                                        {u.account_status !== 'perma_banned' && (
                                            <button onClick={() => handleUserSecurity(u.id, u.username, 'perma_banned')} style={{...styles.deleteBtn, background: '#7f1d1d', flex: 1, justifyContent: 'center'}}><Ban size={14}/> Perma Ban</button>
                                        )}
                                        <button onClick={() => handleUserSecurity(u.id, u.username, 'delete')} style={{...styles.deleteBtn, flex: 1, background: '#0f172a', justifyContent: 'center'}}><UserX size={14}/> Wipe DB</button>
                                    </div>
                                )}
                            </div>
                        )})}
                    </div>

                /* 📂 CATEGORIES TAB */
                ) : activeTab === 'categories' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div style={{...styles.card, border: '2px solid #f59e0b', background: '#fffbeb'}}>
                            <h2 style={{marginTop: 0, display: 'flex', alignItems: 'center', gap: '8px', color: '#b45309', fontSize: '18px'}}><Eye size={22}/> Unstyled Folders (Vendor Created)</h2>
                            <p style={{color: '#92400e', fontSize: '13px', marginBottom: '20px', lineHeight: '1.4'}}>These folders were automatically created by vendors. You can either <b>Upload a Logo</b> for them, or ban the shop!</p>
                            
                            {unstyledFolders.length === 0 ? (
                                <div style={{padding: '20px', textAlign: 'center', background: '#fef3c7', borderRadius: '8px', color: '#b45309'}}>No new unstyled folders detected.</div>
                            ) : (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '15px' }}>
                                    {unstyledFolders.map((catName, idx) => (
                                        <div key={idx} style={{ background: '#ffffff', padding: '15px', borderRadius: '12px', border: '1px solid #fcd34d', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                                            <h4 style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#0f172a' }}>📁 {catName}</h4>
                                            <div style={{fontSize: '12px', color: '#64748b', marginBottom: '10px'}}>
                                                <strong>Used by:</strong><br/>
                                                {dynamicFolders[catName].map((shop, i) => (<span key={i}>{shop.name}<br/></span>))}
                                            </div>
                                            <button onClick={() => { setNewCatName(catName); window.scrollTo({ top: 0, behavior: 'smooth' }); }} style={{...styles.approveBtn, width: '100%', padding: '10px', fontSize: '12px', justifyContent: 'center', background: '#d97706'}}>
                                                <ImagePlus size={14} /> Upload HD Logo
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div style={styles.card}>
                            <h2 style={{marginTop: 0, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '18px'}}><PlusCircle size={22} color="#16a34a"/> Upload Official Folder Logo</h2>
                            <form onSubmit={handleCreateCategory} style={{ display: 'flex', flexDirection: 'column', gap: '15px', maxWidth: '500px', marginTop: '15px' }}>
                                <div>
                                    <label style={styles.catLabel}>Category Name</label>
                                    <input type="text" placeholder="e.g., Vegetables" style={styles.catInput} value={newCatName} onChange={(e) => setNewCatName(e.target.value)} required />
                                </div>
                                <div>
                                    <label style={styles.catLabel}>Assign to Section</label>
                                    <select style={styles.catInput} value={newCatSection} onChange={(e) => setNewCatSection(e.target.value)}>
                                        <option value="Products">Shopping Tab</option>
                                        <option value="Services">Services Tab</option>
                                        <option value="Business">Business Tab</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={styles.catLabel}>Upload HD Photo Banner</label>
                                    <input type="file" accept="image/*" style={styles.catInput} onChange={(e) => setNewCatImage(e.target.files[0])} required />
                                </div>
                                <button type="submit" style={{...styles.approveBtn, justifyContent: 'center', padding: '12px', fontSize: '14px'}}>Create & Upload Image</button>
                            </form>
                        </div>

                        <div style={styles.card}>
                            <h3 style={{ marginTop: 0, color: '#0f172a', fontSize: '18px' }}>Official Categories ({categories.length})</h3>
                            {categories.length === 0 ? (
                                <div style={styles.emptyBox}>No custom categories created yet.</div>
                            ) : (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '15px' }}>
                                    {categories.map((cat) => (
                                        <div key={cat.id} style={{ border: '1px solid #cbd5e1', borderRadius: '12px', padding: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', background: '#f8fafc' }}>
                                            <img src={cat.hd_image} alt={cat.name} style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #2874f0' }} />
                                            <h4 style={{ margin: '8px 0 2px 0', fontSize: '14px', color: '#0f172a', textAlign: 'center' }}>{cat.name}</h4>
                                            <span style={{ fontSize: '10px', background: '#e0e7ff', color: '#1e3a8a', padding: '2px 8px', borderRadius: '10px', fontWeight: 'bold', marginBottom: '10px' }}>{cat.section}</span>
                                            <button onClick={() => handleDeleteCategory(cat.id, cat.name)} style={{ ...styles.deleteBtn, padding: '8px 12px', fontSize: '12px', width: '100%', justifyContent: 'center' }}><Trash2 size={14} /> Delete</button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                /* 🛍️ VENDORS TAB (Pending & Active) */
                ) : (
                    <div style={{...styles.card, padding: isMobile ? '15px' : '25px'}}>
                        {displayVendors.length === 0 ? (
                            <div style={styles.emptyBox}>No {activeTab} shops match your search.</div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                {displayVendors.map(vendor => {
                                    const currentTypes = vendor.shop_type ? vendor.shop_type.split(',').map(s => s.trim()) : ['Products'];
                                    
                                    // 🟢 5-COLOR SYSTEM: Cross-reference security status from users table
                                    const shopOwnerUser = allUsers.find(u => u.id === vendor.user_id);
                                    const accountStatus = shopOwnerUser ? shopOwnerUser.account_status : 'active';
                                    const isOfficialApp = Boolean(String(vendor.user_id) === "1" || vendor.user_email === 'pavanvenkat63@gmail.com');

                                    return (
                                        <div key={vendor.id} style={{...styles.vendorBox, padding: isMobile ? '15px' : '20px'}}>
                                            <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', gap: '10px', marginBottom: '15px' }}>
                                                
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                    <h4 style={{ margin: 0, fontSize: '18px', color: '#2563eb', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => window.open(`/shop/${vendor.id}`, '_blank')} title="Click to view live shop">
                                                        {vendor.business_name} <ExternalLink size={16}/>
                                                    </h4>
                                                    {/* 🟢 RENDER THE SMART 5-COLOR BADGE ON ADMIN DASHBOARD */}
                                                    {activeTab === 'active' && renderAdminBadge(isOfficialApp, vendor.is_verified, accountStatus)}
                                                </div>

                                                <div style={{display: 'flex', gap: '8px', width: isMobile ? '100%' : 'auto', justifyContent: isMobile ? 'space-between' : 'flex-end'}}>
                                                    <span style={{ fontSize: '11px', fontWeight: 'bold', padding: '6px 12px', borderRadius: '12px', background: vendor.is_approved ? '#dcfce7' : '#fef9c3', color: vendor.is_approved ? '#166534' : '#a16207', display: 'flex', alignItems: 'center' }}>
                                                        {vendor.is_approved ? 'Live in App' : 'Pending Review'}
                                                    </span>
                                                    <button onClick={() => handleAdminEdit(vendor)} style={styles.iconBtn} title="Edit Shop Info"><Edit size={16}/></button>
                                                </div>
                                            </div>

                                            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '10px', background: '#ffffff', padding: '15px', borderRadius: '10px', border: '1px solid #cbd5e1', marginBottom: '15px' }}>
                                                <p style={styles.detailText}>👤 <strong>Owner:</strong> {vendor.username || vendor.name || 'Unknown'}</p>
                                                <p style={styles.detailText}>📱 <strong>Phone:</strong> {vendor.user_phone || vendor.phone || 'Not Provided'}</p>
                                                <p style={styles.detailText}>📧 <strong>Email:</strong> {vendor.user_email || vendor.email || 'Not Provided'}</p>
                                                <p style={styles.detailText}>📍 <strong>Location:</strong> {vendor.location || vendor.user_address || vendor.address || 'Not Provided'}</p>
                                                <p style={styles.detailText}>📦 <strong>Categories:</strong> {vendor.category}</p>
                                                <p style={styles.detailText}>🏬 <strong>Shop Type:</strong> {vendor.shop_type || 'Products'}</p>
                                            </div>
                                            
                                            <div style={{ marginBottom: '15px', padding: '15px', background: 'white', borderRadius: '10px', border: '1px solid #cbd5e1' }}>
                                                <p style={{ margin: '0 0 10px 0', fontSize: '12px', fontWeight: 'bold', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <FolderSync size={14} /> Assign Home Screen Tabs:
                                                </p>
                                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                                    {TYPE_OPTIONS.map(type => {
                                                        const isActive = currentTypes.includes(type);
                                                        return (
                                                            <button key={type} onClick={() => handleTypeToggle(vendor, type)}
                                                                style={{
                                                                    display: 'flex', alignItems: 'center', gap: '4px', padding: '8px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', border: 'none', transition: '0.2s', flex: isMobile ? 1 : 'initial', justifyContent: 'center',
                                                                    background: isActive ? '#16a34a' : '#f1f5f9', color: isActive ? 'white' : '#64748b', boxShadow: isActive ? '0 2px 5px rgba(22,163,74,0.3)' : 'none'
                                                                }}
                                                            >
                                                                {isActive && <CheckCircle size={12} />} 
                                                                {displayNames[type] || type}
                                                            </button>
                                                        )
                                                    })}
                                                </div>
                                            </div>
                                            
                                            <div style={styles.docBox}>
                                                <span style={{ fontSize: '13px', fontWeight: '900', color: '#1e3a8a', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                                                    <Lock size={14}/> Secure Vault (Evidence & IDs)
                                                </span>
                                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                                    {vendor.id_front_url && <button type="button" onClick={(e) => openSecureDocument(e, vendor.id_front_url)} style={styles.docLink}>Front ID <ExternalLink size={12} /></button>}
                                                    {vendor.id_back_url && <button type="button" onClick={(e) => openSecureDocument(e, vendor.id_back_url)} style={styles.docLink}>Back ID <ExternalLink size={12} /></button>}
                                                    {vendor.shop_image && <button type="button" onClick={(e) => openSecureDocument(e, vendor.shop_image)} style={styles.docLink}>Shop Photo <ExternalLink size={12} /></button>}
                                                    {vendor.business_certificate && <button type="button" onClick={(e) => openSecureDocument(e, vendor.business_certificate)} style={styles.docLink}>Certificate <ExternalLink size={12} /></button>}
                                                </div>
                                            </div>

                                            <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '10px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '10px' }}>
                                                {activeTab === 'pending' ? (
                                                    <>
                                                        <button onClick={() => handleAction(vendor.id, vendor.business_name, 'approve')} style={{...styles.approveBtn, flex: 1, justifyContent: 'center'}}><CheckCircle size={16}/> Approve & Go Live</button>
                                                        <button onClick={() => handleAction(vendor.id, vendor.business_name, 'request_changes')} style={{...styles.requestBtn, flex: 1, justifyContent: 'center'}}><MessageSquare size={16}/> Request Changes</button>
                                                        <button onClick={() => handleAction(vendor.id, vendor.business_name, 'delete')} style={{...styles.deleteBtn, flex: 1, justifyContent: 'center'}}><Trash2 size={16}/> Delete Application</button>
                                                    </>
                                                ) : (
                                                    <>
                                                        {/* 🟢 FIXED: Unlist sets is_approved = false. (Bans are managed in Security tab) */}
                                                        <button onClick={() => handleAction(vendor.id, vendor.business_name, 'suspend')} style={{...styles.suspendBtn, flex: 1, justifyContent: 'center'}}><AlertTriangle size={16}/> Unlist (Back to Pending)</button>
                                                        <button onClick={() => handleAction(vendor.id, vendor.business_name, 'delete')} style={{...styles.deleteBtn, flex: 1, justifyContent: 'center'}}><Trash2 size={16}/> Delete Shop</button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
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
    page: { background: '#f8fafc', minHeight: '100vh', padding: '15px', fontFamily: 'Inter, sans-serif' },
    container: { maxWidth: '1000px', margin: '0 auto', paddingBottom: '30px' },
    loading: { textAlign: 'center', padding: '50px', fontSize: '18px', fontWeight: 'bold', color: '#334155' },
    headerBar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' },
    title: { margin: 0, color: '#1e3a8a', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '20px', fontWeight: '900' },
    backBtn: { background: 'white', border: '1px solid #cbd5e1', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold', fontSize: '13px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' },
    errorBox: { textAlign: 'center', padding: '15px', color: '#dc2626', fontWeight: 'bold', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', marginBottom: '20px' },
    
    statsContainer: { display: 'flex', gap: '12px', marginBottom: '20px', overflowX: 'auto', paddingBottom: '5px', WebkitOverflowScrolling: 'touch' },
    statCard: { flex: '1 0 30%', minWidth: '130px', padding: '18px 15px', borderRadius: '14px', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' },
    
    tabContainer: { display: 'flex', gap: '8px', marginBottom: '20px', overflowX: 'auto', whiteSpace: 'nowrap', paddingBottom: '5px', WebkitOverflowScrolling: 'touch' },
    activeTab: { flex: 1, minWidth: 'max-content', padding: '12px 20px', background: '#2874f0', color: 'white', fontWeight: '800', border: 'none', borderRadius: '12px', cursor: 'pointer', boxShadow: '0 4px 10px rgba(0,0,0,0.1)', fontSize: '13px', transition: '0.2s' },
    inactiveTab: { flex: 1, minWidth: 'max-content', padding: '12px 20px', background: '#e2e8f0', color: '#475569', fontWeight: '800', border: 'none', borderRadius: '12px', cursor: 'pointer', fontSize: '13px', transition: '0.2s' },
    
    card: { background: 'white', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 10px rgba(0,0,0,0.02)' },
    emptyBox: { textAlign: 'center', padding: '40px', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1', color: '#64748b', fontWeight: 'bold' },
    
    vendorBox: { background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '16px', display: 'flex', flexDirection: 'column' },
    detailText: { margin: '0', fontSize: '13.5px', color: '#475569', padding: '6px 0', wordBreak: 'break-word', lineHeight: '1.4' },
    iconBtn: { background: '#e2e8f0', border: 'none', padding: '8px', borderRadius: '8px', cursor: 'pointer', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: '0.2s' },
    
    docBox: { background: '#eff6ff', padding: '18px', borderRadius: '12px', border: '1px solid #bfdbfe', marginBottom: '15px' },
    docLink: { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', background: '#ffffff', color: '#2563eb', padding: '8px 12px', borderRadius: '8px', border: '1px solid #bfdbfe', cursor: 'pointer', fontWeight: 'bold' },
    
    approveBtn: { display: 'flex', alignItems: 'center', gap: '6px', background: '#16a34a', color: 'white', border: 'none', padding: '12px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' },
    requestBtn: { display: 'flex', alignItems: 'center', gap: '6px', background: '#8b5cf6', color: 'white', border: 'none', padding: '12px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' },
    suspendBtn: { display: 'flex', alignItems: 'center', gap: '6px', background: '#f59e0b', color: 'white', border: 'none', padding: '12px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' },
    deleteBtn: { display: 'flex', alignItems: 'center', gap: '6px', background: '#dc2626', color: 'white', border: 'none', padding: '12px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' },
    
    catLabel: { fontSize: '13px', fontWeight: '800', color: '#475569', marginBottom: '6px', display: 'block' },
    catInput: { padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', width: '100%', boxSizing: 'border-box', background: '#f8fafc', outline: 'none' }
};

// Add global styles for scrollbars
const styleSheet = document.createElement("style");
styleSheet.innerText = `
  .hide-scroll::-webkit-scrollbar { display: none; }
  .hide-scroll { -ms-overflow-style: none; scrollbar-width: none; }
`;
document.head.appendChild(styleSheet);

export default AdminDashboard;