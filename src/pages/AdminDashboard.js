import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client'; 
import { ShieldCheck, ExternalLink, ArrowLeft, AlertTriangle, Trash2, CheckCircle, FolderSync, PlusCircle, Eye, ImagePlus, MessageSquare, Lock, Edit, UserX, Unlock, Clock, Ban, Search, Users, Store, User } from 'lucide-react';

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

    const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000/api';
    const SOCKET_URL = window.location.hostname === 'localhost' ? 'http://localhost:5000' : 'https://bhavyams-vendorhub-backend.onrender.com';

    useEffect(() => {
        const socket = io(SOCKET_URL, { transports: ['websocket', 'polling'] });
        socket.on('connect', () => console.log('🟢 Admin Live Sync Connected'));
        
        socket.on('admin_refresh', () => {
            fetchVendors(); fetchCategories(); fetchAllUsers(); 
        });
        return () => socket.disconnect(); 
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
            const res = await axios.get(`${BACKEND_URL}/admin/pending-vendors`, { headers: { Authorization: `Bearer ${token}` } });
            setVendors(res.data || []);
        } catch (err) { setErrorMsg("Failed to load data."); } finally { setLoading(false); }
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
        } catch (err) { }
    };

    useEffect(() => { fetchVendors(); fetchCategories(); fetchAllUsers(); }, []);

    // 🟢 SILENT POLLER FIX
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
        } catch (err) { alert("Failed to toggle section."); }
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
            alert(`✅ ${newBusinessName} updated!`);
            fetchVendors(); 
        } catch (err) { alert("Failed to edit."); }
    };

    const handleAction = async (id, businessName, actionType) => {
        let reason = '';
        if (actionType === 'request_changes') {
            reason = window.prompt(`What needs to be fixed by "${businessName}"?`);
            if (!reason) return; 
        } else {
            const prompts = { approve: `Approve "${businessName}"?`, suspend: `Suspend "${businessName}"?`, delete: `PERMANENTLY DELETE "${businessName}"?` };
            if (!window.confirm(prompts[actionType])) return;
        }

        try {
            const token = localStorage.getItem('token');
            if (actionType === 'approve') await axios.put(`${BACKEND_URL}/admin/approve-vendor/${id}`, {}, { headers: { Authorization: `Bearer ${token}` } });
            else if (actionType === 'suspend') await axios.put(`${BACKEND_URL}/admin/suspend-vendor/${id}`, {}, { headers: { Authorization: `Bearer ${token}` } });
            else if (actionType === 'delete') await axios.delete(`${BACKEND_URL}/admin/delete-vendor/${id}`, { headers: { Authorization: `Bearer ${token}` } });
            else if (actionType === 'request_changes') await axios.put(`${BACKEND_URL}/admin/request-changes/${id}`, { reason }, { headers: { Authorization: `Bearer ${token}` } });
            fetchVendors();
        } catch (err) { alert(`Failed to execute ${actionType}.`); }
    };

    const fileToBase64 = (file) => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = (error) => reject(error);
    });

    const handleCreateCategory = async (e) => {
        e.preventDefault();
        if (!newCatName || !newCatImage) return alert("Please provide a name and upload an HD photo.");
        try {
            const token = localStorage.getItem('token');
            const base64Image = await fileToBase64(newCatImage);
            await axios.post(`${BACKEND_URL}/admin/categories`, { name: newCatName, section: newCatSection, hd_image: base64Image }, { headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } });
            alert(`✅ Added ${newCatName}!`);
            setNewCatName(''); setNewCatImage(null);
            fetchCategories(); 
        } catch (err) { alert("Failed to upload category."); }
    };

    const handleDeleteCategory = async (id, name) => {
        if (!window.confirm(`Delete category "${name}"?`)) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${BACKEND_URL}/admin/categories/${id}`, { headers: { Authorization: `Bearer ${token}` }});
            fetchCategories();
        } catch (err) { alert("Failed to delete category."); }
    };

    const handleUserSecurity = async (userId, username, action) => {
        let reason = '';
        let minutes = 0;

        if (action === 'warn') {
            reason = window.prompt(`⚠️ SEND WARNING TO ${username}:\nType the message that will scroll on their home screen:`);
            if (!reason) return;
        } else if (action === 'temp_block') {
            reason = window.prompt(`⏳ TEMP BLOCK ${username}:\nReason for block:`);
            if (!reason) return;
            const timeInput = window.prompt(`How long? Type number followed by m, h, or d.\nExamples:\n"30m" = 30 minutes\n"5h" = 5 hours\n"2d" = 2 days`);
            if (!timeInput) return;
            const val = parseInt(timeInput);
            if (isNaN(val)) return alert("Invalid time format.");
            if (timeInput.toLowerCase().includes('d')) minutes = val * 1440;
            else if (timeInput.toLowerCase().includes('h')) minutes = val * 60;
            else minutes = val;
        } else if (action === 'perma_banned') {
            reason = window.prompt(`⛔ PERMA BAN ${username}:\nState the reason for permanent ban:`);
            if (!reason) return;
            if (!window.confirm(`Are you absolutely sure you want to PERMANENTLY BAN ${username}? They will never be able to access the app again.`)) return;
        } else if (action === 'unblock') {
            if (!window.confirm(`Remove all restrictions from ${username} and make them Active?`)) return;
        } else if (action === 'delete') {
            if (!window.confirm(`🚨 CRITICAL WARNING 🚨\nAre you sure you want to PERMANENTLY WIPE ${username} and ALL their data (shop, cart, products) from the database?`)) return;
        }

        try {
            const token = localStorage.getItem('token');
            if (action === 'delete') {
                await axios.delete(`${BACKEND_URL}/admin/delete-user/${userId}`, { headers: { Authorization: `Bearer ${token}` } });
                alert(`🗑️ User ${username} completely deleted.`);
            } else {
                await axios.put(`${BACKEND_URL}/admin/user-security/${userId}`, { action, reason, minutes }, { headers: { Authorization: `Bearer ${token}` } });
                alert(`✅ Applied ${action} to ${username}.`);
            }
            fetchAllUsers(); fetchVendors(); 
        } catch (err) { alert("Failed to update security status."); }
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

    // 🟢 UPDATED EMOJIS FOR TABS
    const TYPE_OPTIONS = ["Trending", "Products", "Services", "Expo", "Business"];
    const displayNames = {
        'Products': '🛍️ Shopping',
        'Services': '🧑‍🔧 Services',
        'Business': '📈 Business',
        'Trending': '🔥 Trending',
        'Expo': '🌟 Expo'
    };

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
        <div style={styles.page}>
            <div style={styles.container}>
                <div style={styles.headerBar}>
                    <button onClick={() => navigate('/')} style={styles.backBtn}><ArrowLeft size={18} /> {isMobile ? "" : "Back"}</button>
                    <h1 style={styles.title}><ShieldCheck size={22} color="#2874f0" /> Master Admin</h1>
                </div>

                {errorMsg && <div style={styles.errorBox}>❌ {errorMsg}</div>}

                <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', overflowX: 'auto', paddingBottom: '5px' }}>
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

                <div style={{ display: 'flex', alignItems: 'center', background: 'white', padding: '12px 15px', borderRadius: '12px', border: '1px solid #cbd5e1', marginBottom: '20px', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
                    <Search size={18} color="#64748b" />
                    <input type="text" placeholder="Search users, shops, emails, or phone numbers..." value={adminSearch} onChange={(e) => setAdminSearch(e.target.value)} style={{ border: 'none', outline: 'none', width: '100%', marginLeft: '10px', fontSize: '14px', background: 'transparent' }} />
                </div>

                <div style={styles.tabContainer}>
                    <button style={activeTab === 'pending' ? styles.activeTab : styles.inactiveTab} onClick={() => setActiveTab('pending')}>⏳ Pending</button>
                    <button style={activeTab === 'active' ? styles.activeTab : styles.inactiveTab} onClick={() => setActiveTab('active')}>✅ Active Shops</button>
                    <button style={activeTab === 'categories' ? styles.activeTab : styles.inactiveTab} onClick={() => setActiveTab('categories')}>📂 Folders</button>
                    <button style={activeTab === 'security' ? {...styles.activeTab, background: '#ef4444'} : styles.inactiveTab} onClick={() => setActiveTab('security')}>🛡️ Security</button>
                </div>

                {activeTab === 'security' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <div style={{...styles.card, background: '#fef2f2', border: '1px solid #ef4444'}}>
                            <h2 style={{marginTop: 0, color: '#b91c1c', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '18px'}}><AlertTriangle /> Global Security Center</h2>
                            <p style={{color: '#991b1b', fontSize: '13px', margin: 0}}>Manage all accounts. <b>Temp Blocks</b> auto-expire via IST. <b>Perma Ban</b> locks them forever. <b>Wipe</b> deletes their data.</p>
                        </div>

                        {filteredUsers.length === 0 ? <div style={styles.emptyBox}>No users found.</div> : filteredUsers.map(u => (
                            <div key={u.id} style={{...styles.card, display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', gap: '15px', padding: '15px', borderLeft: u.account_status !== 'active' ? '5px solid #dc2626' : '1px solid #e2e8f0'}}>
                                <div>
                                    <h4 style={{ margin: '0 0 5px 0', fontSize: '16px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        {u.username} <span style={{fontSize: '10px', background: '#e2e8f0', padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase'}}>{u.role}</span>
                                    </h4>
                                    <p style={{margin: '0 0 4px 0', fontSize: '12px', color: '#475569'}}>📧 {u.email || 'No email'} | 📱 {u.phone || 'No phone'}</p>
                                    
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px', flexWrap: 'wrap' }}>
                                        <span style={{fontSize: '12px', fontWeight: 'bold', padding: '3px 8px', borderRadius: '6px', background: u.account_status === 'active' ? '#dcfce7' : '#fee2e2', color: u.account_status === 'active' ? '#166534' : '#991b1b'}}>
                                            Status: {u.account_status.replace('_', ' ').toUpperCase()}
                                        </span>
                                        {u.account_status === 'temp_block' && u.ban_until && (
                                            <span style={{fontSize: '11px', color: '#b45309', display: 'flex', alignItems: 'center', gap: '4px'}}><Clock size={12}/> Unblocks: {formatIST(u.ban_until)}</span>
                                        )}
                                    </div>
                                    {u.ban_reason && <p style={{margin: '8px 0 0 0', fontSize: '12px', color: '#b91c1c', fontWeight: 'bold'}}>⚠️ Msg: {u.ban_reason}</p>}
                                </div>
                                
                                <div style={{display: 'flex', gap: '8px', flexWrap: 'wrap', width: isMobile ? '100%' : 'auto'}}>
                                    {u.account_status !== 'active' ? (
                                        <button onClick={() => handleUserSecurity(u.id, u.username, 'unblock')} style={{...styles.approveBtn, flex: isMobile ? 1 : 'auto', background: '#16a34a'}}><Unlock size={14}/> Unblock</button>
                                    ) : (
                                        <>
                                            <button onClick={() => handleUserSecurity(u.id, u.username, 'warn')} style={{...styles.suspendBtn, flex: isMobile ? 1 : 'auto'}}><AlertTriangle size={14}/> Warn</button>
                                            <button onClick={() => handleUserSecurity(u.id, u.username, 'temp_block')} style={{...styles.suspendBtn, background: '#ea580c', flex: isMobile ? 1 : 'auto'}}><Clock size={14}/> Block Time</button>
                                        </>
                                    )}
                                    {u.account_status !== 'perma_banned' && (
                                        <button onClick={() => handleUserSecurity(u.id, u.username, 'perma_banned')} style={{...styles.deleteBtn, background: '#7f1d1d', flex: isMobile ? 1 : 'auto'}}><Ban size={14}/> Perma Ban</button>
                                    )}
                                    <button onClick={() => handleUserSecurity(u.id, u.username, 'delete')} style={{...styles.deleteBtn, flex: isMobile ? 1 : 'auto', background: '#0f172a'}}><UserX size={14}/> Wipe DB</button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : activeTab === 'categories' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div style={{...styles.card, border: '2px solid #f59e0b', background: '#fffbeb'}}>
                            <h2 style={{marginTop: 0, display: 'flex', alignItems: 'center', gap: '8px', color: '#b45309', fontSize: '18px'}}><Eye size={22}/> Unstyled Folders (Vendor Created)</h2>
                            <p style={{color: '#92400e', fontSize: '13px', marginBottom: '20px'}}>These folders were automatically created by vendors. You can either <b>Upload a Logo</b> for them, or ban the shop!</p>
                            
                            {unstyledFolders.length === 0 ? (
                                <div style={{padding: '20px', textAlign: 'center', background: '#fef3c7', borderRadius: '8px', color: '#b45309'}}>No new unstyled folders detected.</div>
                            ) : (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '15px' }}>
                                    {unstyledFolders.map((catName, idx) => (
                                        <div key={idx} style={{ background: '#ffffff', padding: '15px', borderRadius: '12px', border: '1px solid #fcd34d', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                                            <h4 style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#0f172a' }}>📁 {catName}</h4>
                                            <div style={{fontSize: '12px', color: '#64748b', marginBottom: '10px'}}>
                                                <strong>Used by:</strong><br/>
                                                {dynamicFolders[catName].map((shop, i) => (<span key={i}>• {shop.name}<br/></span>))}
                                            </div>
                                            <button onClick={() => { setNewCatName(catName); window.scrollTo({ top: 0, behavior: 'smooth' }); }} style={{...styles.approveBtn, width: '100%', padding: '8px', fontSize: '12px', justifyContent: 'center', background: '#d97706'}}>
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
                                <button type="submit" style={styles.approveBtn}>Create & Upload Image</button>
                            </form>
                        </div>

                        <div style={styles.card}>
                            <h3 style={{ marginTop: 0, color: '#0f172a', fontSize: '18px' }}>Official Categories with Logos ({categories.length})</h3>
                            {categories.length === 0 ? (
                                <div style={styles.emptyBox}>No custom categories created yet.</div>
                            ) : (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '15px' }}>
                                    {categories.map((cat) => (
                                        <div key={cat.id} style={{ border: '1px solid #cbd5e1', borderRadius: '12px', padding: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', background: '#f8fafc' }}>
                                            <img src={cat.hd_image} alt={cat.name} style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #2874f0' }} />
                                            <h4 style={{ margin: '8px 0 2px 0', fontSize: '14px', color: '#0f172a', textAlign: 'center' }}>{cat.name}</h4>
                                            <span style={{ fontSize: '10px', background: '#e0e7ff', color: '#1e3a8a', padding: '2px 8px', borderRadius: '10px', fontWeight: 'bold', marginBottom: '10px' }}>{cat.section}</span>
                                            <button onClick={() => handleDeleteCategory(cat.id, cat.name)} style={{ ...styles.deleteBtn, padding: '6px 12px', fontSize: '12px', width: '100%', justifyContent: 'center' }}><Trash2 size={14} /> Delete</button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div style={{...styles.card, padding: isMobile ? '15px' : '30px'}}>
                        {displayVendors.length === 0 ? (
                            <div style={styles.emptyBox}>No {activeTab} shops match your search.</div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                {displayVendors.map(vendor => {
                                    const currentTypes = vendor.shop_type ? vendor.shop_type.split(',').map(s => s.trim()) : ['Products'];
                                    return (
                                        <div key={vendor.id} style={isMobile ? styles.vendorBoxMobile : styles.vendorBoxDesktop}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                
                                                {/* 🟢 CLICKABLE SHOP NAME FOR ADMIN TO VIEW IT LIVE */}
                                                <h4 style={{ margin: '0 0 10px 0', fontSize: '20px', color: '#2563eb', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => window.open(`/shop/${vendor.id}`, '_blank')} title="Click to view live shop">
                                                    {vendor.business_name} <ExternalLink size={18}/>
                                                </h4>

                                                <div style={{display: 'flex', gap: '8px'}}>
                                                    <button onClick={() => handleAdminEdit(vendor)} style={styles.iconBtn} title="Edit Shop Info"><Edit size={16}/></button>
                                                    <span style={{ fontSize: '11px', fontWeight: 'bold', padding: '4px 8px', borderRadius: '12px', background: vendor.is_approved ? '#dcfce7' : '#fef9c3', color: vendor.is_approved ? '#166534' : '#a16207' }}>
                                                        {vendor.is_approved ? 'Live' : 'Pending'}
                                                    </span>
                                                </div>
                                            </div>

                                            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '10px', background: '#ffffff', padding: '15px', borderRadius: '10px', border: '1px solid #cbd5e1', marginBottom: '15px' }}>
                                                <p style={styles.detailText}>👤 <strong>Owner Name:</strong> {vendor.username || vendor.name || 'Unknown'}</p>
                                                <p style={styles.detailText}>📱 <strong>Phone:</strong> {vendor.user_phone || vendor.phone || 'Not Provided'}</p>
                                                <p style={styles.detailText}>📧 <strong>Email:</strong> {vendor.user_email || vendor.email || 'Not Provided'}</p>
                                                <p style={styles.detailText}>📍 <strong>Location:</strong> {vendor.location || vendor.user_address || vendor.address || 'Not Provided'}</p>
                                                <p style={styles.detailText}>📦 <strong>Categories:</strong> {vendor.category}</p>
                                                <p style={styles.detailText}>🏬 <strong>Shop Type:</strong> {vendor.shop_type || 'Products'}</p>
                                            </div>
                                            
                                            <div style={{ marginBottom: '15px', padding: '10px', background: 'white', borderRadius: '10px', border: '1px solid #cbd5e1' }}>
                                                <p style={{ margin: '0 0 8px 0', fontSize: '11px', fontWeight: 'bold', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <FolderSync size={12} /> Assign Home Screen Tabs:
                                                </p>
                                                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                                    {TYPE_OPTIONS.map(type => {
                                                        const isActive = currentTypes.includes(type);
                                                        return (
                                                            <button key={type} onClick={() => handleTypeToggle(vendor, type)}
                                                                style={{
                                                                    display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', border: 'none', transition: '0.2s',
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

                                            {/* 🟢 SECURE VAULT - DOCUMENTS ARE FULLY VISIBLE HERE */}
                                            <div style={styles.docBox}>
                                                <span style={{ fontSize: '13px', fontWeight: '900', color: '#1e3a8a', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '10px' }}>
                                                    <Lock size={14}/> Secure Vault (ID Proofs & Evidence)
                                                </span>
                                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                                    {vendor.id_front_url && <a href={vendor.id_front_url} target="_blank" rel="noopener noreferrer" style={styles.docLink}>Front ID <ExternalLink size={12} /></a>}
                                                    {vendor.id_back_url && <a href={vendor.id_back_url} target="_blank" rel="noopener noreferrer" style={styles.docLink}>Back ID <ExternalLink size={12} /></a>}
                                                    {vendor.shop_image && <a href={vendor.shop_image} target="_blank" rel="noopener noreferrer" style={styles.docLink}>Shop Photo <ExternalLink size={12} /></a>}
                                                    {vendor.business_certificate && <a href={vendor.business_certificate} target="_blank" rel="noopener noreferrer" style={styles.docLink}>Certificate <ExternalLink size={12} /></a>}
                                                </div>
                                            </div>

                                            <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '10px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '10px' }}>
                                                {activeTab === 'pending' ? (
                                                    <>
                                                        <button onClick={() => handleAction(vendor.id, vendor.business_name, 'approve')} style={{...styles.approveBtn, flex: 1, justifyContent: 'center'}}><CheckCircle size={16}/> Approve Live</button>
                                                        <button onClick={() => handleAction(vendor.id, vendor.business_name, 'request_changes')} style={{...styles.requestBtn, flex: 1, justifyContent: 'center'}}><MessageSquare size={16}/> Request Changes</button>
                                                        <button onClick={() => handleAction(vendor.id, vendor.business_name, 'delete')} style={{...styles.deleteBtn, flex: 1, justifyContent: 'center'}}><Trash2 size={16}/> Delete Application</button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <button onClick={() => handleAction(vendor.id, vendor.business_name, 'suspend')} style={{...styles.suspendBtn, flex: 1, justifyContent: 'center'}}><AlertTriangle size={16}/> Suspend</button>
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
    );
};

const styles = {
    page: { background: '#f8fafc', minHeight: '100vh', padding: '15px', fontFamily: 'Inter, sans-serif' },
    container: { maxWidth: '1000px', margin: '0 auto', paddingBottom: '30px' },
    loading: { textAlign: 'center', padding: '50px', fontSize: '18px', fontWeight: 'bold', color: '#334155' },
    headerBar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' },
    title: { margin: 0, color: '#1e3a8a', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '20px' },
    backBtn: { background: 'white', border: '1px solid #cbd5e1', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold', fontSize: '13px' },
    errorBox: { textAlign: 'center', padding: '15px', color: '#dc2626', fontWeight: 'bold', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', marginBottom: '20px' },
    statCard: { flex: 1, minWidth: '100px', padding: '15px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' },
    tabContainer: { display: 'flex', gap: '8px', marginBottom: '20px', overflowX: 'auto', whiteSpace: 'nowrap', paddingBottom: '5px' },
    activeTab: { flex: 1, minWidth: '100px', padding: '12px', background: '#2874f0', color: 'white', fontWeight: 'bold', border: 'none', borderRadius: '10px', cursor: 'pointer', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', fontSize: '12px' },
    inactiveTab: { flex: 1, minWidth: '100px', padding: '12px', background: '#e2e8f0', color: '#475569', fontWeight: 'bold', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '12px' },
    card: { background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0' },
    emptyBox: { textAlign: 'center', padding: '40px', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1', color: '#64748b', fontWeight: 'bold' },
    vendorBoxDesktop: { background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '14px', padding: '20px', display: 'flex', flexDirection: 'column' },
    vendorBoxMobile: { background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '14px', padding: '15px', display: 'flex', flexDirection: 'column' },
    detailText: { margin: '0', fontSize: '13px', color: '#475569', padding: '5px 0' },
    iconBtn: { background: '#e2e8f0', border: 'none', padding: '6px', borderRadius: '6px', cursor: 'pointer', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: '0.2s' },
    docBox: { background: '#eff6ff', padding: '15px', borderRadius: '12px', border: '1px solid #bfdbfe', marginBottom: '15px' },
    docLink: { display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', background: '#ffffff', color: '#2563eb', padding: '6px 10px', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold', border: '1px solid #bfdbfe' },
    approveBtn: { display: 'flex', alignItems: 'center', gap: '4px', background: '#16a34a', color: 'white', border: 'none', padding: '8px 12px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' },
    requestBtn: { display: 'flex', alignItems: 'center', gap: '4px', background: '#8b5cf6', color: 'white', border: 'none', padding: '8px 12px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' },
    suspendBtn: { display: 'flex', alignItems: 'center', gap: '4px', background: '#f59e0b', color: 'white', border: 'none', padding: '8px 12px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' },
    deleteBtn: { display: 'flex', alignItems: 'center', gap: '4px', background: '#dc2626', color: 'white', border: 'none', padding: '8px 12px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' }
};

export default AdminDashboard;