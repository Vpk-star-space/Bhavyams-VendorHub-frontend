import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client'; 
import { ShieldCheck, ExternalLink, ArrowLeft, AlertTriangle, Trash2, CheckCircle, FolderSync, PlusCircle, Eye, ImagePlus, MessageSquare, Lock, Edit, UserX, Unlock, Clock, Ban, Search, Users, Store, User, BellRing, BadgeCheck } from 'lucide-react';
import { toast } from 'react-toastify';
import Navbar from '../components/Navbar';
import { Mail } from 'lucide-react'; // Add this to your lucide-react imports
// 🟢 SMART 5-TIER BADGE RENDERER FOR ADMIN
const renderAdminBadge = (isOfficial, isVerified, accountStatus) => {
    const isVer = isVerified === true || String(isVerified).toLowerCase() === 'true';
    const baseStyle = { display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '900', whiteSpace: 'nowrap' };
    
    if (accountStatus === 'perma_banned') return <span style={{...baseStyle, background: '#0f172a', color: 'white'}}>⬛ Banned</span>;
    if (accountStatus === 'temp_block') return <span style={{...baseStyle, background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca'}}>🟥 Suspended</span>;
    if (isOfficial) return <span style={{...baseStyle, background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a'}}>🌟 Official</span>;
    if (isVer) return <span style={{...baseStyle, background: '#dcfce7', color: '#15803d', border: '1px solid #86efac'}}>✅ Verified</span>;
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
    const [securityFilter, setSecurityFilter] = useState('all'); // all | vendors | customers | restricted
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
            const interval = setInterval(() => { fetchAllUsers(); fetchVendors(); }, 15000);
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

    const handleToggleGreenBadge = async (vendor) => {
        try {
            const token = localStorage.getItem('token');
            const currentVer = vendor.is_verified === true || String(vendor.is_verified).toLowerCase() === 'true';
            const nextVer = !currentVer;
            await axios.put(
                `${BACKEND_URL}/shops/admin/vendor/${vendor.id}/verify-status`,
                { is_verified: nextVer, is_approved: vendor.is_approved },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success(nextVer ? `✅ Granted Green Badge to "${vendor.business_name}"!` : `Removed Green Badge from "${vendor.business_name}".`);
            fetchVendors();
        } catch (err) {
            toast.error("Failed to update Green Badge.");
        }
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
        } catch (err) { toast.error(err.response?.data?.message || "Failed to edit."); }
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
            toast.success(`Action "${actionType}" completed!`);
            fetchVendors();
            fetchAllUsers();
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

    const handleUserSecurity = async (userId, displayTargetName, action) => {
        let reason = '';
        let minutes = 30;

        if (action === 'warn') {
            reason = window.prompt(`⚠️ SEND WARNING TO ${displayTargetName}:\nType the warning message that will scroll on their screen and save to notifications:`);
            if (!reason) return;
        } else if (action === 'add_strike') {
            reason = window.prompt(`⚡ ISSUE STRIKE TO ${displayTargetName}:\n(3 strikes = Automatic Permanent Ban)\nEnter reason for this strike:`);
            if (!reason) return;
        } else if (action === 'temp_block') {
            reason = window.prompt(`⏳ TEMP BLOCK ${displayTargetName}:\nReason for temporary suspension (shown on their shop banner):`);
            if (!reason) return;
            const timeInput = window.prompt(`How long? Enter minutes or use h/d:\nExamples:\n"30" = 30 minutes\n"2h" = 2 hours\n"1d" = 1 day`, "60");
            if (!timeInput) return;
            const val = parseInt(timeInput, 10);
            if (isNaN(val) || val <= 0) return toast.error("Please enter a valid positive number.");
            if (timeInput.toLowerCase().includes('d')) minutes = val * 1440;
            else if (timeInput.toLowerCase().includes('h')) minutes = val * 60;
            else minutes = val;
        } else if (action === 'perma_banned') {
            reason = window.prompt(`⛔ PERMANENTLY BAN ${displayTargetName}:\nState the violation reason (shown on their black banned banner):`);
            if (!reason) return;
            if (!window.confirm(`Are you sure you want to PERMANENTLY BAN ${displayTargetName}?`)) return;
        } else if (action === 'unblock') {
            if (!window.confirm(`Restore ${displayTargetName} to Active, clear all strikes (0/3), and lift all restrictions?`)) return;
        } else if (action === 'delete') {
            if (!window.confirm(`🚨 CRITICAL: Permanently wipe ${displayTargetName} and all their shop/orders data from the database?`)) return;
        }

        try {
            const token = localStorage.getItem('token');
            if (action === 'delete') {
                await axios.delete(`${BACKEND_URL}/admin/delete-user/${userId}`, { headers: { Authorization: `Bearer ${token}` } });
                toast.success(`🗑 ${displayTargetName} deleted.`);
            } else {
                const res = await axios.put(`${BACKEND_URL}/admin/user-security/${userId}`, { action, reason, minutes }, { headers: { Authorization: `Bearer ${token}` } });
                toast.success(`✅ ${res.data.message}`);
            }
            fetchAllUsers(); 
            fetchVendors(); 
        } catch (err) { 
            toast.error(err.response?.data?.message || `🚨 Failed to apply ${action}.`); 
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
        let dStr = String(dateString);
        if (!dStr.endsWith('Z') && !dStr.includes('+')) dStr += 'Z';
        const options = { timeZone: 'Asia/Kolkata', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        return new Date(dStr).toLocaleString('en-IN', options);
    };

    // 🟢 MAP USER_ID -> SHOP OBJECT SO SECURITY TAB SHOWS VENDOR SHOP NAMES
    const shopByUserId = {};
    vendors.forEach(v => {
        if (v.user_id) shopByUserId[String(v.user_id)] = v;
    });

    const safeSearch = adminSearch.toLowerCase().trim();
    const pendingVendorsList = vendors.filter(v => v.is_approved === false);
    const activeVendorsList = vendors.filter(v => v.is_approved === true);

    const displayVendors = (activeTab === 'pending' ? pendingVendorsList : activeVendorsList).filter(v =>
        !safeSearch ||
        v.business_name?.toLowerCase().includes(safeSearch) ||
        v.username?.toLowerCase().includes(safeSearch) ||
        v.user_email?.toLowerCase().includes(safeSearch) ||
        v.category?.toLowerCase().includes(safeSearch)
    );
    
    const filteredUsers = allUsers.filter(u => {
        const userShop = shopByUserId[String(u.id)];
        const shopName = (userShop?.business_name || '').toLowerCase();
        const matchesSearch = !safeSearch ||
            u.username?.toLowerCase().includes(safeSearch) ||
            u.phone?.includes(safeSearch) ||
            u.email?.toLowerCase().includes(safeSearch) ||
            shopName.includes(safeSearch);

        if (!matchesSearch) return false;
        if (securityFilter === 'vendors') return Boolean(userShop || u.role === 'vendor');
        if (securityFilter === 'customers') return !userShop && u.role !== 'vendor';
        if (securityFilter === 'restricted') return (u.account_status && u.account_status !== 'active') || (u.strikes && u.strikes > 0);
        return true;
    });

    const TYPE_OPTIONS = ["Trending", "Products", "Services", "Expo", "Business"];
    const displayNames = { 'Products': '🛍️ Shopping', 'Services': '🧑‍🔧 Services', 'Business': '📈 Business', 'Trending': '🔥 Trending', 'Expo': '🌟 Expo' };

    let extractedVendorCategories = [];
    activeVendorsList.forEach(shop => {
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
                        <button onClick={() => navigate('/')} style={styles.backBtn}>
                            <ArrowLeft size={18} /> {isMobile ? "Home" : "Back to Home"}
                        </button>
                        <h1 style={styles.title}><ShieldCheck size={22} color="#2874f0" /> Master Admin</h1>
                    </div>

                    {errorMsg && <div style={styles.errorBox}>❌ {errorMsg}</div>}

{/* CRM PORTAL BANNER */}
<div
    style={{
        background: 'linear-gradient(135deg, #0f172a, #1e3a8a)',
        borderRadius: '12px',
        padding: isMobile ? '10px 12px' : '14px 16px',
        marginBottom: '12px',
        color: 'white',
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        justifyContent: 'space-between',
        alignItems: isMobile ? 'stretch' : 'center',
        gap: '10px',
        boxShadow: '0 5px 15px rgba(15, 23, 42, 0.15)'
    }}
>
    <div>
        <h3
            style={{
                margin: '0 0 3px 0',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: isMobile ? '13px' : '15px',
                fontWeight: '800'
            }}
        >
            <BellRing size={16} color="#facc15" />
            Push & Engagement CRM
        </h3>

        <p
            style={{
                margin: 0,
                fontSize: isMobile ? '10px' : '11px',
                color: '#cbd5e1',
                lineHeight: '1.4'
            }}
        >
            Send banner broadcasts, manage auto-triggers, and view delivery logs.
        </p>
    </div>

    <button
        onClick={() => navigate('/admin/push')}
        style={{
            background: 'linear-gradient(135deg, #facc15, #f59e0b)',
            color: '#713f12',
            border: 'none',
            padding: isMobile ? '8px 10px' : '8px 12px',
            borderRadius: '7px',
            fontWeight: '800',
            fontSize: isMobile ? '11px' : '12px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            justifyContent: 'center',
            flexShrink: 0,
            alignSelf: isMobile ? 'flex-start' : 'center'
        }}
    >
        Open Push CRM <ExternalLink size={13} />
    </button>
</div>

{/* PREMIUM EMAIL BLASTER BUTTON */}
<div
    onClick={() => navigate('/admin/email-blaster')}
    style={{
        background: 'linear-gradient(135deg, #0f172a, #1e3a8a)',
        borderRadius: '12px',
        padding: isMobile ? '10px 12px' : '12px 16px',
        marginBottom: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '10px',
        cursor: 'pointer',
        boxShadow: '0 5px 15px rgba(15, 23, 42, 0.15)'
    }}
>
    <div
        style={{
            background: 'rgba(250, 204, 21, 0.12)',
            padding: isMobile ? '7px' : '8px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
        }}
    >
        <Mail size={isMobile ? 17 : 19} color="#facc15" />
    </div>

    <div style={{ flex: 1, minWidth: 0 }}>
        <h3
            style={{
                margin: 0,
                fontSize: isMobile ? '12px' : '14px',
                fontWeight: '800',
                color: '#f8fafc'
            }}
        >
            Premium Email Blast
        </h3>

        <p
            style={{
                margin: '3px 0 0 0',
                fontSize: isMobile ? '10px' : '11px',
                color: '#cbd5e1',
                fontWeight: '600'
            }}
        >
            Multi-Brand Manual Emails
        </p>
    </div>

    <ExternalLink
        size={14}
        color="#facc15"
        style={{ flexShrink: 0 }}
    />
</div>


                    {/* 🟢 MOBILE-COMFORTABLE 2x2 STATS GRID */}
                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: '10px', marginBottom: '18px' }}>
                        <div style={{...styles.statCard, background: '#eff6ff', border: '1px solid #bfdbfe'}}>
                            <Users size={20} color="#2563eb" />
                            <div>
                                <h3 style={{margin: 0, fontSize: '18px', color: '#1e3a8a', fontWeight: '900'}}>{allUsers.length}</h3>
                                <p style={{margin: 0, fontSize: '11px', color: '#3b82f6', fontWeight: '800'}}>Total Users</p>
                            </div>
                        </div>
                        <div style={{...styles.statCard, background: '#f0fdf4', border: '1px solid #bbf7d0'}}>
                            <Store size={20} color="#16a34a" />
                            <div>
                                <h3 style={{margin: 0, fontSize: '18px', color: '#14532d', fontWeight: '900'}}>{activeVendorsList.length}</h3>
                                <p style={{margin: 0, fontSize: '11px', color: '#16a34a', fontWeight: '800'}}>Active Shops</p>
                            </div>
                        </div>
                        <div style={{...styles.statCard, background: '#fef9c3', border: '1px solid #fde047'}}>
                            <Clock size={20} color="#ca8a04" />
                            <div>
                                <h3 style={{margin: 0, fontSize: '18px', color: '#713f12', fontWeight: '900'}}>{pendingVendorsList.length}</h3>
                                <p style={{margin: 0, fontSize: '11px', color: '#b45309', fontWeight: '800'}}>Pending Review</p>
                            </div>
                        </div>
                        <div style={{...styles.statCard, background: '#fef2f2', border: '1px solid #fecaca'}}>
                            <AlertTriangle size={20} color="#dc2626" />
                            <div>
                                <h3 style={{margin: 0, fontSize: '18px', color: '#7f1d1d', fontWeight: '900'}}>
                                    {allUsers.filter(u => (u.account_status && u.account_status !== 'active') || u.strikes > 0).length}
                                </h3>
                                <p style={{margin: 0, fontSize: '11px', color: '#dc2626', fontWeight: '800'}}>Restricted / Warned</p>
                            </div>
                        </div>
                    </div>

                    {/* SEARCH BAR */}
                    <div style={{ display: 'flex', alignItems: 'center', background: 'white', padding: '12px 15px', borderRadius: '12px', border: '1.5px solid #cbd5e1', marginBottom: '16px', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
                        <Search size={18} color="#64748b" />
                        <input 
                            type="text" 
                            placeholder="Search by Shop Name, Owner Name, Phone, or Email..." 
                            value={adminSearch} 
                            onChange={(e) => setAdminSearch(e.target.value)} 
                            style={{ border: 'none', outline: 'none', width: '100%', marginLeft: '10px', fontSize: '14px', background: 'transparent', fontWeight: '600', color: '#0f172a' }} 
                        />
                        {adminSearch && (
                            <button onClick={() => setAdminSearch('')} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontWeight: 'bold' }}>✕</button>
                        )}
                    </div>

                    {/* TABS (2x2 Grid on Mobile so nothing is cut off) */}
                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: '8px', marginBottom: '18px' }}>
                        <button style={activeTab === 'pending' ? styles.activeTab : styles.inactiveTab} onClick={() => setActiveTab('pending')}>
                            ⏳ Pending ({pendingVendorsList.length})
                        </button>
                        <button style={activeTab === 'active' ? styles.activeTab : styles.inactiveTab} onClick={() => setActiveTab('active')}>
                            ✅ Active Shops ({activeVendorsList.length})
                        </button>
                        <button style={activeTab === 'categories' ? styles.activeTab : styles.inactiveTab} onClick={() => setActiveTab('categories')}>
                            📂 Folders ({categories.length})
                        </button>
                        <button style={activeTab === 'security' ? {...styles.activeTab, background: '#dc2626'} : styles.inactiveTab} onClick={() => setActiveTab('security')}>
                            🛡️ Security ({allUsers.length})
                        </button>
                    </div>

                    {/* 🛡️ SECURITY TAB (NOW SHOWS VENDOR SHOP NAMES + FIXED STRIKE BUTTONS) */}
                    {activeTab === 'security' ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            <div style={{...styles.card, background: '#fef2f2', border: '1px solid #fecaca', padding: '16px'}}>
                                <h2 style={{marginTop: 0, marginBottom: '6px', color: '#b91c1c', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '17px', fontWeight: '900'}}>
                                    <AlertTriangle size={20} /> Global Security & Vendor Control
                                </h2>
                                <p style={{color: '#991b1b', fontSize: '12.5px', margin: '0 0 12px 0', lineHeight: '1.4'}}>
                                    Every vendor account displays its linked <strong>Shop Name</strong> below. Issue Warnings, add Strikes (1/3 → 2/3 → 3/3 Auto-Ban), or set Temporary Suspensions.
                                </p>
                                {/* QUICK FILTER PILLS */}
                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                    {[
                                        { key: 'all', label: `All (${allUsers.length})` },
                                        { key: 'vendors', label: `🏪 Vendors Only` },
                                        { key: 'customers', label: `👤 Customers Only` },
                                        { key: 'restricted', label: `🚨 Warned / Banned` }
                                    ].map(f => (
                                        <button
                                            key={f.key}
                                            onClick={() => setSecurityFilter(f.key)}
                                            style={{
                                                padding: '6px 12px',
                                                borderRadius: '20px',
                                                fontSize: '11.5px',
                                                fontWeight: '800',
                                                cursor: 'pointer',
                                                border: securityFilter === f.key ? 'none' : '1px solid #fca5a5',
                                                background: securityFilter === f.key ? '#dc2626' : 'white',
                                                color: securityFilter === f.key ? 'white' : '#991b1b'
                                            }}
                                        >
                                            {f.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {filteredUsers.length === 0 ? <div style={styles.emptyBox}>No matching accounts found.</div> : filteredUsers.map(u => {
                                const chatOn = u.can_message !== false;
                                const callOn = u.can_call !== false;
                                const bookOn = u.can_book !== false;
                                const strikeCount = Number(u.strikes) || 0;
                                const status = u.account_status || 'active';
                                const isBanned = status === 'perma_banned';
                                const isTempBlocked = status === 'temp_block';
                                const hasAnyRestriction = status !== 'active' || strikeCount > 0 || !chatOn || !callOn || !bookOn;
                                const isMasterAccount = u.email === 'pavanvenkat63@gmail.com' || String(u.id) === "1";

                                // 🟢 LOOK UP THIS USER'S LINKED SHOP
                                const linkedShop = shopByUserId[String(u.id)];
                                const targetLabel = linkedShop ? `${linkedShop.business_name} (${u.username})` : u.username;

                                return (
                                    <div 
                                        key={u.id} 
                                        style={{
                                            ...styles.card, 
                                            display: 'flex', 
                                            flexDirection: 'column', 
                                            gap: '14px', 
                                            padding: isMobile ? '14px' : '18px', 
                                            borderLeft: isBanned ? '6px solid #0f172a' : isTempBlocked ? '6px solid #dc2626' : strikeCount > 0 || status === 'warned' ? '6px solid #f59e0b' : '1px solid #e2e8f0'
                                        }}
                                    >
                                        <div style={{ width: '100%' }}>
                                            {/* USER HEADER ROW */}
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', flexWrap: 'wrap' }}>
                                                <h4 style={{ margin: 0, fontSize: '16px', color: '#0f172a', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '6px', fontWeight: '900' }}>
                                                    {u.username}
                                                    <span style={{ fontSize: '10px', background: linkedShop ? '#fef3c7' : '#e2e8f0', color: linkedShop ? '#b45309' : '#475569', padding: '3px 8px', borderRadius: '6px', textTransform: 'uppercase', fontWeight: '900' }}>
                                                        {linkedShop ? '🏪 Shop Owner' : u.role}
                                                    </span>
                                                </h4>
                                                <span style={{ fontSize: '11.5px', fontWeight: '900', padding: '4px 10px', borderRadius: '8px', background: status === 'active' ? '#dcfce7' : status === 'perma_banned' ? '#0f172a' : '#fee2e2', color: status === 'active' ? '#166534' : status === 'perma_banned' ? '#ffffff' : '#991b1b' }}>
                                                    {status.replace('_', ' ').toUpperCase()}
                                                </span>
                                            </div>

                                            {/* 🟢 VENDOR SHOP NAME BANNER (SO ADMIN IMMEDIATELY SEES THEIR SHOP) */}
                                            {linkedShop && (
                                                <div 
                                                    onClick={() => window.open(`/shop/${linkedShop.id}`, '_blank')}
                                                    style={{ marginTop: '8px', background: '#eff6ff', border: '1px solid #bfdbfe', padding: '10px 12px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', cursor: 'pointer', flexWrap: 'wrap' }}
                                                >
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                                        <Store size={16} color="#2563eb" />
                                                        <span style={{ fontSize: '14px', fontWeight: '900', color: '#1e3a8a', textDecoration: 'underline' }}>
                                                            {linkedShop.business_name}
                                                        </span>
                                                        {renderAdminBadge(isMasterAccount, linkedShop.is_verified, status)}
                                                    </div>
                                                    <span style={{ fontSize: '11px', fontWeight: '800', color: '#2563eb', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                        View Shop <ExternalLink size={12} />
                                                    </span>
                                                </div>
                                            )}

                                            <p style={{margin: '8px 0 4px 0', fontSize: '12.5px', color: '#475569', wordBreak: 'break-all', fontWeight: '600'}}>
                                                📧 {u.email || 'No email'} &nbsp;|&nbsp; 📱 {u.phone || 'No phone'}
                                            </p>

                                            {isTempBlocked && u.ban_until && (
                                                <div style={{ fontSize: '12px', color: '#c2410c', background: '#fff7ed', border: '1px solid #fed7aa', padding: '6px 10px', borderRadius: '8px', marginTop: '6px', fontWeight: '800', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                                    <Clock size={14}/> Unblocks at: {formatIST(u.ban_until)}
                                                </div>
                                            )}

                                            {u.ban_reason && (
                                                <div style={{ margin: '8px 0 0 0', fontSize: '12.5px', color: '#991b1b', background: '#fef2f2', border: '1px solid #fecaca', padding: '8px 10px', borderRadius: '8px', fontWeight: '700' }}>
                                                    ⚠️ Active Reason / Note: "{u.ban_reason}"
                                                </div>
                                            )}

                                            {/* FEATURE TOGGLES & STRIKE COUNTER */}
                                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '12px' }}>
                                                <button type="button" onClick={() => !isMasterAccount && toggleUserFeature(u, 'can_message')} style={{ cursor: isMasterAccount ? 'default' : 'pointer', padding: '6px 10px', background: chatOn ? '#f0fdf4' : '#fef2f2', borderRadius: '8px', fontSize: '11.5px', fontWeight: '800', color: chatOn ? '#166534' : '#991b1b', border: `1px solid ${chatOn ? '#bbf7d0' : '#fecaca'}` }}>
                                                    💬 Chat: {chatOn ? 'ON' : 'OFF'}
                                                </button>
                                                <button type="button" onClick={() => !isMasterAccount && toggleUserFeature(u, 'can_call')} style={{ cursor: isMasterAccount ? 'default' : 'pointer', padding: '6px 10px', background: callOn ? '#f0fdf4' : '#fef2f2', borderRadius: '8px', fontSize: '11.5px', fontWeight: '800', color: callOn ? '#166534' : '#991b1b', border: `1px solid ${callOn ? '#bbf7d0' : '#fecaca'}` }}>
                                                    📞 Call: {callOn ? 'ON' : 'OFF'}
                                                </button>
                                                <button type="button" onClick={() => !isMasterAccount && toggleUserFeature(u, 'can_book')} style={{ cursor: isMasterAccount ? 'default' : 'pointer', padding: '6px 10px', background: bookOn ? '#f0fdf4' : '#fef2f2', borderRadius: '8px', fontSize: '11.5px', fontWeight: '800', color: bookOn ? '#166534' : '#991b1b', border: `1px solid ${bookOn ? '#bbf7d0' : '#fecaca'}` }}>
                                                    📅 Book: {bookOn ? 'ON' : 'OFF'}
                                                </button>
                                                <div style={{ padding: '6px 10px', background: strikeCount >= 2 ? '#fef08a' : strikeCount === 1 ? '#ffedd5' : '#f1f5f9', borderRadius: '8px', fontSize: '11.5px', fontWeight: '900', color: strikeCount >= 2 ? '#a16207' : strikeCount === 1 ? '#c2410c' : '#475569', border: '1px solid #cbd5e1' }}>
                                                    ⚡ Strikes: {strikeCount}/3
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {/* 🟢 FIXED SECURITY ACTION BUTTONS (WARN & STRIKE STAY VISIBLE EVEN AFTER 1st WARNING/STRIKE) */}
                                        {isMasterAccount ? (
                                            <div style={{ padding: '10px 15px', background: '#fef9c3', color: '#a16207', borderRadius: '10px', fontWeight: '900', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', border: '1px dashed #eab308' }}>
                                                🛡️ Master Admin Account (Protected & Immune)
                                            </div>
                                        ) : (
                                            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fit, minmax(120px, 1fr))', gap: '8px', width: '100%' }}>
                                                {hasAnyRestriction && (
                                                    <button onClick={() => handleUserSecurity(u.id, targetLabel, 'unblock')} style={{...styles.approveBtn, background: '#16a34a', justifyContent: 'center', padding: '10px'}}>
                                                        <Unlock size={14}/> Reset & Unblock
                                                    </button>
                                                )}

                                                {!isBanned && (
                                                    <>
                                                        <button onClick={() => handleUserSecurity(u.id, targetLabel, 'warn')} style={{...styles.suspendBtn, background: '#f59e0b', justifyContent: 'center', padding: '10px'}}>
                                                            <AlertTriangle size={14}/> Warn
                                                        </button>
                                                        <button onClick={() => handleUserSecurity(u.id, targetLabel, 'add_strike')} style={{...styles.suspendBtn, background: '#d97706', justifyContent: 'center', padding: '10px'}}>
                                                            <AlertTriangle size={14}/> +1 Strike ({strikeCount}/3)
                                                        </button>
                                                        <button onClick={() => handleUserSecurity(u.id, targetLabel, 'temp_block')} style={{...styles.suspendBtn, background: '#ea580c', justifyContent: 'center', padding: '10px'}}>
                                                            <Clock size={14}/> Temp Block
                                                        </button>
                                                        <button onClick={() => handleUserSecurity(u.id, targetLabel, 'perma_banned')} style={{...styles.deleteBtn, background: '#7f1d1d', justifyContent: 'center', padding: '10px'}}>
                                                            <Ban size={14}/> Perma Ban
                                                        </button>
                                                    </>
                                                )}

                                                <button onClick={() => handleUserSecurity(u.id, targetLabel, 'delete')} style={{...styles.deleteBtn, background: '#0f172a', justifyContent: 'center', padding: '10px'}}>
                                                    <UserX size={14}/> Wipe DB
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                    /* 📂 CATEGORIES TAB */
                    ) : activeTab === 'categories' ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div style={{...styles.card, border: '2px solid #f59e0b', background: '#fffbeb'}}>
                                <h2 style={{marginTop: 0, display: 'flex', alignItems: 'center', gap: '8px', color: '#b45309', fontSize: '18px'}}><Eye size={22}/> Unstyled Folders (Vendor Created)</h2>
                                <p style={{color: '#92400e', fontSize: '13px', marginBottom: '20px', lineHeight: '1.4'}}>These folders were created by vendors. Click <b>Upload HD Logo</b> to auto-fill the form below!</p>
                                
                                {unstyledFolders.length === 0 ? (
                                    <div style={{padding: '20px', textAlign: 'center', background: '#fef3c7', borderRadius: '8px', color: '#b45309', fontWeight: 'bold'}}>All vendor categories have official HD logos!</div>
                                ) : (
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px' }}>
                                        {unstyledFolders.map((catName, idx) => (
                                            <div key={idx} style={{ background: '#ffffff', padding: '15px', borderRadius: '12px', border: '1px solid #fcd34d', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                                                <h4 style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#0f172a' }}>📁 {catName}</h4>
                                                <div style={{fontSize: '12px', color: '#64748b', marginBottom: '10px'}}>
                                                    <strong>Used by:</strong><br/>
                                                    {dynamicFolders[catName].map((shop, i) => (<span key={i}>• {shop.name}<br/></span>))}
                                                </div>
                                                <button onClick={() => { setNewCatName(catName); window.scrollTo({ top: 350, behavior: 'smooth' }); }} style={{...styles.approveBtn, width: '100%', padding: '10px', fontSize: '12px', justifyContent: 'center', background: '#d97706'}}>
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
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(135px, 1fr))', gap: '12px' }}>
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
                        <div style={{...styles.card, padding: isMobile ? '12px' : '22px'}}>
                            {displayVendors.length === 0 ? (
                                <div style={styles.emptyBox}>No {activeTab} shops match your search.</div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                                    {displayVendors.map(vendor => {
                                        const currentTypes = vendor.shop_type ? vendor.shop_type.split(',').map(s => s.trim()) : ['Products'];
                                        const shopOwnerUser = allUsers.find(u => String(u.id) === String(vendor.user_id));
                                        const accountStatus = vendor.account_status || (shopOwnerUser ? shopOwnerUser.account_status : 'active');
                                        const isOfficialApp = Boolean(String(vendor.user_id) === "1" || vendor.user_email === 'pavanvenkat63@gmail.com');
                                        const isVer = vendor.is_verified === true || String(vendor.is_verified).toLowerCase() === 'true';

                                        return (
                                            <div key={vendor.id} style={{...styles.vendorBox, padding: isMobile ? '14px' : '20px'}}>
                                                <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', gap: '10px', marginBottom: '14px' }}>
                                                    
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                                        <h4 style={{ margin: 0, fontSize: '18px', color: '#2563eb', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', textDecoration: 'underline', fontWeight: '900' }} onClick={() => window.open(`/shop/${vendor.id}`, '_blank')}>
                                                            {vendor.business_name} <ExternalLink size={16}/>
                                                        </h4>
                                                        {renderAdminBadge(isOfficialApp, vendor.is_verified, accountStatus)}
                                                    </div>

                                                    <div style={{display: 'flex', gap: '8px', width: isMobile ? '100%' : 'auto', justifyContent: isMobile ? 'space-between' : 'flex-end', alignItems: 'center'}}>
                                                        <span style={{ fontSize: '11px', fontWeight: '800', padding: '6px 12px', borderRadius: '12px', background: vendor.is_approved ? '#dcfce7' : '#fef9c3', color: vendor.is_approved ? '#166534' : '#a16207' }}>
                                                            {vendor.is_approved ? 'Live in App' : 'Pending Review'}
                                                        </span>
                                                        <button onClick={() => handleAdminEdit(vendor)} style={styles.iconBtn} title="Edit Shop Name/Category"><Edit size={16}/></button>
                                                    </div>
                                                </div>

                                                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '8px', background: '#ffffff', padding: '14px', borderRadius: '10px', border: '1px solid #cbd5e1', marginBottom: '14px' }}>
                                                    <p style={styles.detailText}>👤 <strong>Owner:</strong> {vendor.username || vendor.name || 'Unknown'}</p>
                                                    <p style={styles.detailText}>📱 <strong>Phone:</strong> {vendor.user_phone || vendor.phone || 'Not Provided'}</p>
                                                    <p style={styles.detailText}>📧 <strong>Email:</strong> {vendor.user_email || vendor.email || 'Not Provided'}</p>
                                                    <p style={styles.detailText}>📍 <strong>Location:</strong> {vendor.address || vendor.location || 'Not Provided'}</p>
                                                    <p style={styles.detailText}>🚚 <strong>Delivers To:</strong> {vendor.delivery_areas || 'All Areas'}</p>
                                                    <p style={styles.detailText}>📦 <strong>Categories:</strong> {vendor.category}</p>
                                                </div>
                                                
                                                <div style={{ marginBottom: '14px', padding: '14px', background: 'white', borderRadius: '10px', border: '1px solid #cbd5e1' }}>
                                                    <p style={{ margin: '0 0 10px 0', fontSize: '12px', fontWeight: '800', color: '#475569', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                        <FolderSync size={14} /> Assign Home Screen Tabs:
                                                    </p>
                                                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(5, 1fr)', gap: '8px' }}>
                                                        {TYPE_OPTIONS.map(type => {
                                                            const isActive = currentTypes.includes(type);
                                                            return (
                                                                <button key={type} onClick={() => handleTypeToggle(vendor, type)}
                                                                    style={{
                                                                        display: 'flex', alignItems: 'center', gap: '4px', padding: '8px 10px', borderRadius: '10px', fontSize: '11.5px', fontWeight: '800', cursor: 'pointer', border: isActive ? 'none' : '1px solid #cbd5e1', transition: '0.2s', justifyContent: 'center',
                                                                        background: isActive ? '#16a34a' : '#f8fafc', color: isActive ? 'white' : '#475569'
                                                                    }}
                                                                >
                                                                    {isActive && <CheckCircle size={12} />} 
                                                                    {displayNames[type] || type}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                                
                                                <div style={styles.docBox}>
                                                    <span style={{ fontSize: '12.5px', fontWeight: '900', color: '#1e3a8a', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                                                        <Lock size={14}/> Secure Vault (60s Self-Destructing KYC Viewer)
                                                    </span>
                                                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, auto)', gap: '8px' }}>
                                                        {vendor.id_front_url && <button type="button" onClick={(e) => openSecureDocument(e, vendor.id_front_url)} style={styles.docLink}>Front ID <ExternalLink size={12} /></button>}
                                                        {vendor.id_back_url && <button type="button" onClick={(e) => openSecureDocument(e, vendor.id_back_url)} style={styles.docLink}>Back ID <ExternalLink size={12} /></button>}
                                                        {vendor.shop_image && <button type="button" onClick={(e) => openSecureDocument(e, vendor.shop_image)} style={styles.docLink}>Shop Photo <ExternalLink size={12} /></button>}
                                                        {vendor.business_certificate && <button type="button" onClick={(e) => openSecureDocument(e, vendor.business_certificate)} style={styles.docLink}>Certificate <ExternalLink size={12} /></button>}
                                                    </div>
                                                </div>

                                                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(160px, 1fr))', gap: '10px', marginTop: '6px' }}>
                                                    {activeTab === 'pending' ? (
                                                        <>
                                                            <button onClick={() => handleAction(vendor.id, vendor.business_name, 'approve')} style={{...styles.approveBtn, justifyContent: 'center'}}><CheckCircle size={16}/> Approve & Go Live</button>
                                                            <button onClick={() => handleAction(vendor.id, vendor.business_name, 'request_changes')} style={{...styles.requestBtn, justifyContent: 'center'}}><MessageSquare size={16}/> Request Changes</button>
                                                            <button onClick={() => handleAction(vendor.id, vendor.business_name, 'delete')} style={{...styles.deleteBtn, justifyContent: 'center'}}><Trash2 size={16}/> Delete Application</button>
                                                        </>
                                                    ) : (
                                                        <>
                                                            {!isOfficialApp && (
                                                                <button onClick={() => handleToggleGreenBadge(vendor)} style={{...styles.approveBtn, background: isVer ? '#0f172a' : '#16a34a', justifyContent: 'center'}}>
                                                                    <BadgeCheck size={16}/> {isVer ? 'Revoke Green Badge' : 'Grant Green Badge ✅'}
                                                                </button>
                                                            )}
                                                            <button onClick={() => handleAction(vendor.id, vendor.business_name, 'suspend')} style={{...styles.suspendBtn, justifyContent: 'center'}}><AlertTriangle size={16}/> Unlist (To Pending)</button>
                                                            <button onClick={() => handleAction(vendor.id, vendor.business_name, 'delete')} style={{...styles.deleteBtn, justifyContent: 'center'}}><Trash2 size={16}/> Delete Shop</button>
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
    page: { background: '#f8fafc', minHeight: '100vh', padding: '12px', fontFamily: 'Inter, sans-serif', boxSizing: 'border-box' },
    container: { maxWidth: '1000px', margin: '0 auto', paddingBottom: '40px' },
    loading: { textAlign: 'center', padding: '50px', fontSize: '18px', fontWeight: 'bold', color: '#334155' },
    headerBar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' },
    title: { margin: 0, color: '#1e3a8a', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '19px', fontWeight: '900' },
    backBtn: { background: 'white', border: '1px solid #cbd5e1', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '800', fontSize: '13px', color: '#0f172a' },
    errorBox: { textAlign: 'center', padding: '15px', color: '#dc2626', fontWeight: 'bold', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', marginBottom: '20px' },
    
    statCard: { padding: '14px 12px', borderRadius: '14px', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' },
    
    activeTab: { padding: '12px 10px', background: '#2563eb', color: 'white', fontWeight: '900', border: 'none', borderRadius: '12px', cursor: 'pointer', boxShadow: '0 4px 10px rgba(37,99,235,0.2)', fontSize: '12.5px', textAlign: 'center' },
    inactiveTab: { padding: '12px 10px', background: '#e2e8f0', color: '#475569', fontWeight: '800', border: 'none', borderRadius: '12px', cursor: 'pointer', fontSize: '12.5px', textAlign: 'center' },
    
    card: { background: 'white', padding: '18px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 10px rgba(0,0,0,0.02)', boxSizing: 'border-box' },
    emptyBox: { textAlign: 'center', padding: '40px 20px', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1', color: '#64748b', fontWeight: 'bold' },
    
    vendorBox: { background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '16px', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' },
    detailText: { margin: '0', fontSize: '13px', color: '#334155', padding: '4px 0', wordBreak: 'break-word', lineHeight: '1.4' },
    iconBtn: { background: '#e2e8f0', border: 'none', padding: '8px', borderRadius: '8px', cursor: 'pointer', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    
    docBox: { background: '#eff6ff', padding: '14px', borderRadius: '12px', border: '1px solid #bfdbfe', marginBottom: '12px' },
    docLink: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '12px', background: '#ffffff', color: '#2563eb', padding: '8px 10px', borderRadius: '8px', border: '1px solid #bfdbfe', cursor: 'pointer', fontWeight: '800' },
    
    approveBtn: { display: 'flex', alignItems: 'center', gap: '6px', background: '#16a34a', color: 'white', border: 'none', padding: '12px', borderRadius: '10px', fontWeight: '800', cursor: 'pointer', fontSize: '12.5px' },
    requestBtn: { display: 'flex', alignItems: 'center', gap: '6px', background: '#8b5cf6', color: 'white', border: 'none', padding: '12px', borderRadius: '10px', fontWeight: '800', cursor: 'pointer', fontSize: '12.5px' },
    suspendBtn: { display: 'flex', alignItems: 'center', gap: '6px', background: '#f59e0b', color: 'white', border: 'none', padding: '12px', borderRadius: '10px', fontWeight: '800', cursor: 'pointer', fontSize: '12.5px' },
    deleteBtn: { display: 'flex', alignItems: 'center', gap: '6px', background: '#dc2626', color: 'white', border: 'none', padding: '12px', borderRadius: '10px', fontWeight: '800', cursor: 'pointer', fontSize: '12.5px' },
    
    catLabel: { fontSize: '13px', fontWeight: '800', color: '#475569', marginBottom: '6px', display: 'block' },
    catInput: { padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', width: '100%', boxSizing: 'border-box', background: '#f8fafc', outline: 'none' }
};

export default AdminDashboard;