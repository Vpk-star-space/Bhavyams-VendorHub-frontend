import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client'; 
import { ShieldCheck, ExternalLink, ArrowLeft, AlertTriangle, Trash2, CheckCircle, FolderSync, PlusCircle, Eye, ImagePlus, MessageSquare, Lock, Edit } from 'lucide-react';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [vendors, setVendors] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState(null);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    
    const [activeTab, setActiveTab] = useState('pending');

    const [newCatName, setNewCatName] = useState('');
    const [newCatSection, setNewCatSection] = useState('Products');
    const [newCatImage, setNewCatImage] = useState(null);

    const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000/api';
    const SOCKET_URL = BACKEND_URL.replace('/api', ''); 

    // 🟢 1. LIVE WEBSOCKET CONNECTION (Fixed for Render Production)
    useEffect(() => {
        // Added transports: ['websocket', 'polling'] to prevent Render from blocking the connection!
        const socket = io(SOCKET_URL, { transports: ['websocket', 'polling'] });
        
        socket.on('connect', () => console.log('🟢 Admin Live Sync Connected'));
        
        socket.on('admin_refresh', () => {
            console.log('🔄 Live Update Received! Syncing dashboard...');
            fetchVendors();
            fetchCategories();
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
            const res = await axios.get(`${BACKEND_URL}/admin/pending-vendors`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setVendors(res.data || []);
        } catch (err) {
            console.error("Error fetching admin data:", err);
            setErrorMsg(err.response?.data?.message || "Failed to load shops. Ensure you are logged in as admin.");
        } finally {
            setLoading(false); 
        }
    };

    const fetchCategories = async () => {
        try {
            const res = await axios.get(`${BACKEND_URL}/admin/categories`);
            setCategories(res.data || []);
        } catch (err) {
            console.error("Error fetching categories:", err);
        }
    };

    useEffect(() => {
        fetchVendors();
        fetchCategories();
    }, []);

    const handleTypeToggle = async (shop, toggledType) => {
        try {
            const currentTypes = shop.shop_type ? shop.shop_type.split(',').map(s => s.trim()) : ['Products'];
            let newTypes;

            if (currentTypes.includes(toggledType)) {
                newTypes = currentTypes.filter(t => t !== toggledType);
                if (newTypes.length === 0) newTypes = ['Products'];
            } else {
                newTypes = [...currentTypes, toggledType];
            }

            const newTypeString = newTypes.join(',');
            const token = localStorage.getItem('token');
            
            const formData = new FormData();
            formData.append('business_name', shop.business_name);
            formData.append('category', shop.category);
            formData.append('shop_type', newTypeString); 
            formData.append('is_online', shop.is_online);

            await axios.put(`${BACKEND_URL}/shops/${shop.id}`, formData, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            fetchVendors(); 
        } catch (err) {
            alert("Failed to toggle store section.");
        }
    };

    const handleAdminEdit = async (vendor) => {
        const newBusinessName = window.prompt("Edit Business Name:", vendor.business_name);
        if (!newBusinessName) return;

        const newCategory = window.prompt("Edit Categories (comma separated):", vendor.category);
        if (!newCategory) return;

        try {
            const token = localStorage.getItem('token');
            const formData = new FormData();
            formData.append('business_name', newBusinessName);
            formData.append('category', newCategory);
            formData.append('shop_type', vendor.shop_type); 

            await axios.put(`${BACKEND_URL}/shops/${vendor.id}`, formData, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            alert(`✅ ${newBusinessName} updated successfully!`);
            fetchVendors(); 
        } catch (err) {
            alert("Failed to edit shop details.");
        }
    };

    const handleAction = async (id, businessName, actionType) => {
        let reason = '';
        
        if (actionType === 'request_changes') {
            reason = window.prompt(`What needs to be fixed by "${businessName}"? (This message will be sent to the vendor's dashboard)`);
            if (!reason) return; 
        } else {
            const prompts = {
                approve: `Approve "${businessName}" and make their shop live?`,
                suspend: `Suspend "${businessName}"? Their shop will be hidden from users instantly.`,
                delete: `PERMANENTLY DELETE "${businessName}"? This wipes their entire account.`
            };
            if (!window.confirm(prompts[actionType])) return;
        }

        try {
            const token = localStorage.getItem('token');
            
            if (actionType === 'approve') {
                await axios.put(`${BACKEND_URL}/admin/approve-vendor/${id}`, {}, { headers: { Authorization: `Bearer ${token}` } });
                alert(`🎉 ${businessName} is now live.`);
            } else if (actionType === 'suspend') {
                await axios.put(`${BACKEND_URL}/admin/suspend-vendor/${id}`, {}, { headers: { Authorization: `Bearer ${token}` } });
                alert(`⏸️ ${businessName} has been suspended.`); 
            } else if (actionType === 'delete') {
                await axios.delete(`${BACKEND_URL}/admin/delete-vendor/${id}`, { headers: { Authorization: `Bearer ${token}` } });
                alert(`🗑️ ${businessName} has been deleted.`);
            } else if (actionType === 'request_changes') {
                await axios.put(`${BACKEND_URL}/admin/request-changes/${id}`, { reason }, { headers: { Authorization: `Bearer ${token}` } });
                alert(`✉️ Message sent successfully to the vendor!`);
            }
            
            fetchVendors();
        } catch (err) {
            console.error(err);
            alert(`Failed to execute ${actionType}.`);
        }
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

            await axios.post(`${BACKEND_URL}/admin/categories`, {
                name: newCatName, section: newCatSection, hd_image: base64Image
            }, {
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
            });

            alert(`✅ Added ${newCatName}!`);
            setNewCatName(''); setNewCatImage(null);
            fetchCategories(); 
        } catch (err) {
            alert("Failed to upload category.");
        }
    };

    const handleDeleteCategory = async (id, name) => {
        if (!window.confirm(`Delete category "${name}"?`)) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${BACKEND_URL}/admin/categories/${id}`, { headers: { Authorization: `Bearer ${token}` }});
            fetchCategories();
        } catch (err) {
            alert("Failed to delete category.");
        }
    };

    const displayVendors = activeTab === 'pending' ? vendors.filter(v => v.is_approved === false) : vendors.filter(v => v.is_approved === true);
    const TYPE_OPTIONS = ["Trending", "Products", "Services", "Expo"];

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
                    <button onClick={() => navigate('/')} style={styles.backBtn}><ArrowLeft size={18} /> {isMobile ? "" : "Back to Hub"}</button>
                    <h1 style={styles.title}><ShieldCheck size={isMobile ? 22 : 26} color="#2874f0" /> Master Admin Panel</h1>
                </div>

                {errorMsg && <div style={styles.errorBox}>❌ {errorMsg}</div>}

                <div style={styles.tabContainer}>
                    <button style={activeTab === 'pending' ? styles.activeTab : styles.inactiveTab} onClick={() => setActiveTab('pending')}>⏳ Pending Approvals</button>
                    <button style={activeTab === 'active' ? styles.activeTab : styles.inactiveTab} onClick={() => setActiveTab('active')}>✅ Active Shops</button>
                    <button style={activeTab === 'categories' ? styles.activeTab : styles.inactiveTab} onClick={() => setActiveTab('categories')}>📂 Manage Folders</button>
                </div>

                {activeTab === 'categories' ? (
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
                                        <option value="Products">Products Tab</option>
                                        <option value="Services">Services Tab</option>
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
                            <div style={styles.emptyBox}>No {activeTab} shops right now.</div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                {displayVendors.map(vendor => {
                                    const currentTypes = vendor.shop_type ? vendor.shop_type.split(',').map(s => s.trim()) : ['Products'];

                                    return (
                                    <div key={vendor.id} style={isMobile ? styles.vendorBoxMobile : styles.vendorBoxDesktop}>
                                        
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <h4 style={{ margin: '0 0 10px 0', fontSize: '20px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                {vendor.business_name} 
                                                <button onClick={() => handleAdminEdit(vendor)} style={styles.iconBtn} title="Edit Shop Info"><Edit size={16}/></button>
                                            </h4>
                                            <span style={{ fontSize: '11px', fontWeight: 'bold', padding: '4px 8px', borderRadius: '12px', background: vendor.is_approved ? '#dcfce7' : '#fef9c3', color: vendor.is_approved ? '#166534' : '#a16207' }}>
                                                {vendor.is_approved ? 'Live' : 'Pending'}
                                            </span>
                                        </div>

                                        {/* 🟢 FIXED MISSING LOCATION & EMAIL WITH STRONG FALLBACKS */}
                                        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '10px', background: '#ffffff', padding: '15px', borderRadius: '10px', border: '1px solid #cbd5e1', marginBottom: '15px' }}>
                                            <p style={styles.detailText}>👤 <strong>Owner Name:</strong> {vendor.username || vendor.name || 'Unknown'}</p>
                                            <p style={styles.detailText}>📱 <strong>Phone:</strong> {vendor.user_phone || vendor.phone || 'Not Provided'}</p>
                                            <p style={styles.detailText}>📧 <strong>Email:</strong> {vendor.user_email || vendor.email || 'Not Provided'}</p>
                                            <p style={styles.detailText}>📍 <strong>Location:</strong> {vendor.location || vendor.user_address || vendor.address || 'Not Provided'}</p>
                                            <p style={styles.detailText}>📦 <strong>Categories:</strong> {vendor.category}</p>
                                            <p style={styles.detailText}>🏬 <strong>Shop Type:</strong> {vendor.shop_type || 'Products'}</p>
                                            <p style={styles.detailText}>🏠 <strong>Work Mode:</strong> {vendor.work_mode === 'home' ? 'Home Business' : 'Physical Shop'}</p>
                                        </div>
                                            
                                        <div style={{ marginBottom: '15px', padding: '10px', background: 'white', borderRadius: '10px', border: '1px solid #cbd5e1' }}>
                                            <p style={{ margin: '0 0 8px 0', fontSize: '11px', fontWeight: 'bold', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <FolderSync size={12} /> Assign Home Screen Tabs (Multi-Select):
                                            </p>
                                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                                {TYPE_OPTIONS.map(type => {
                                                    const isActive = currentTypes.includes(type);
                                                    return (
                                                        <button 
                                                            key={type} onClick={() => handleTypeToggle(vendor, type)}
                                                            style={{
                                                                display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', border: 'none', transition: '0.2s',
                                                                background: isActive ? '#16a34a' : '#f1f5f9', color: isActive ? 'white' : '#64748b', boxShadow: isActive ? '0 2px 5px rgba(22,163,74,0.3)' : 'none'
                                                            }}
                                                        >
                                                            {isActive && <CheckCircle size={12} />} {type === 'Trending' && !isActive && '🔥'} {type}
                                                        </button>
                                                    )
                                                })}
                                            </div>
                                        </div>

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
                                                    <button onClick={() => handleAction(vendor.id, vendor.business_name, 'approve')} style={{...styles.approveBtn, flex: 1, justifyContent: 'center'}}>
                                                        <CheckCircle size={16}/> Approve Live
                                                    </button>
                                                    <button onClick={() => handleAction(vendor.id, vendor.business_name, 'request_changes')} style={{...styles.requestBtn, flex: 1, justifyContent: 'center'}}>
                                                        <MessageSquare size={16}/> Request Changes
                                                    </button>
                                                    <button onClick={() => handleAction(vendor.id, vendor.business_name, 'delete')} style={{...styles.deleteBtn, flex: 1, justifyContent: 'center'}}>
                                                        <Trash2 size={16}/> Delete Application
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <button onClick={() => handleAction(vendor.id, vendor.business_name, 'suspend')} style={{...styles.suspendBtn, flex: 1, justifyContent: 'center'}}>
                                                        <AlertTriangle size={16}/> Suspend
                                                    </button>
                                                    <button onClick={() => handleAction(vendor.id, vendor.business_name, 'delete')} style={{...styles.deleteBtn, flex: 1, justifyContent: 'center'}}>
                                                        <Trash2 size={16}/> Delete Shop
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                )})}
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
    
    tabContainer: { display: 'flex', gap: '10px', marginBottom: '20px', overflowX: 'auto', whiteSpace: 'nowrap', paddingBottom: '5px' },
    activeTab: { flex: 1, minWidth: '130px', padding: '12px', background: '#2874f0', color: 'white', fontWeight: 'bold', border: 'none', borderRadius: '10px', cursor: 'pointer', boxShadow: '0 4px 6px rgba(40,116,240,0.3)', fontSize: '13px' },
    inactiveTab: { flex: 1, minWidth: '130px', padding: '12px', background: '#e2e8f0', color: '#475569', fontWeight: 'bold', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '13px' },
    
    card: { background: 'white', borderRadius: '20px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' },
    emptyBox: { textAlign: 'center', padding: '40px', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1', color: '#64748b', fontWeight: 'bold' },
    
    vendorBoxDesktop: { background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '14px', padding: '20px', display: 'flex', flexDirection: 'column' },
    vendorBoxMobile: { background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '14px', padding: '15px', display: 'flex', flexDirection: 'column' },
    
    detailText: { margin: '0', fontSize: '13px', color: '#475569', padding: '5px 0' },
    
    docBox: { background: '#eff6ff', padding: '15px', borderRadius: '12px', border: '1px solid #bfdbfe' },
    docLink: { display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', background: '#ffffff', color: '#2563eb', padding: '6px 10px', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold', border: '1px solid #bfdbfe' },
    
    iconBtn: { background: '#e2e8f0', border: 'none', padding: '6px', borderRadius: '6px', cursor: 'pointer', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    
    approveBtn: { display: 'flex', alignItems: 'center', gap: '6px', background: '#16a34a', color: 'white', border: 'none', padding: '10px 15px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' },
    requestBtn: { display: 'flex', alignItems: 'center', gap: '6px', background: '#8b5cf6', color: 'white', border: 'none', padding: '10px 15px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' },
    suspendBtn: { display: 'flex', alignItems: 'center', gap: '6px', background: '#f59e0b', color: 'white', border: 'none', padding: '10px 15px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' },
    deleteBtn: { display: 'flex', alignItems: 'center', gap: '6px', background: '#dc2626', color: 'white', border: 'none', padding: '10px 15px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' },
    
    catLabel: { fontWeight: 'bold', fontSize: '13px', color: '#475569', display: 'block', marginBottom: '6px' },
    catInput: { width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }
};

export default AdminDashboard;