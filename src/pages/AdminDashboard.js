import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, ExternalLink, ArrowLeft, AlertTriangle, Trash2, CheckCircle, FolderSync, PlusCircle } from 'lucide-react';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [vendors, setVendors] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState(null);
    
    const [activeTab, setActiveTab] = useState('pending');

    const [newCatName, setNewCatName] = useState('');
    const [newCatSection, setNewCatSection] = useState('Products');
    const [newCatImage, setNewCatImage] = useState(null);

    const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000/api';

    const fetchVendors = async () => {
        try {
            setLoading(true);
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
            console.error("Type Change Error:", err);
            alert("Failed to toggle store section.");
        }
    };

    const handleAction = async (id, businessName, actionType) => {
        const prompts = {
            approve: `Approve "${businessName}" and make them live?`,
            suspend: `Suspend "${businessName}"? Their shop will be hidden from the app.`,
            delete: `PERMANENTLY DELETE "${businessName}"? This cannot be undone.`
        };

        if (!window.confirm(prompts[actionType])) return;

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
                alert(`🗑️ ${businessName} has been permanently deleted.`);
            }
            
            fetchVendors();
        } catch (err) {
            console.error("Action Error:", err);
            alert(`Failed to ${actionType} vendor.`);
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
                name: newCatName,
                section: newCatSection,
                hd_image: base64Image
            }, {
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json' 
                }
            });

            alert(`✅ Added ${newCatName} to ${newCatSection}!`);
            setNewCatName('');
            setNewCatImage(null);
            fetchCategories(); // Refresh category list
        } catch (err) {
            console.error(err);
            alert("Failed to upload category. Ensure backend routes and payload limit are configured.");
        }
    };

    const handleDeleteCategory = async (id, name) => {
        if (!window.confirm(`Delete category "${name}"?`)) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${BACKEND_URL}/admin/categories/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert(`🗑️ Category "${name}" deleted.`);
            fetchCategories();
        } catch (err) {
            console.error(err);
            alert("Failed to delete category.");
        }
    };

    const displayVendors = activeTab === 'pending' 
        ? vendors.filter(v => v.is_approved === false) 
        : vendors.filter(v => v.is_approved === true);

    const TYPE_OPTIONS = ["Trending", "Products", "Services", "Promotions"];

    if (loading) return <div style={styles.loading}>Loading Master Control Room...</div>;

    return (
        <div style={styles.page}>
            <div style={styles.container}>
                <div style={styles.headerBar}>
                    <button onClick={() => navigate('/')} style={styles.backBtn}><ArrowLeft size={18} /> Back to Hub</button>
                    <h1 style={styles.title}><ShieldCheck size={26} color="#2874f0" /> Master Admin Panel</h1>
                </div>

                {errorMsg && <div style={styles.errorBox}>❌ {errorMsg}</div>}

                <div style={styles.tabContainer}>
                    <button 
                        style={activeTab === 'pending' ? styles.activeTab : styles.inactiveTab} 
                        onClick={() => setActiveTab('pending')}
                    >
                        ⏳ Pending Approvals
                    </button>
                    <button 
                        style={activeTab === 'active' ? styles.activeTab : styles.inactiveTab} 
                        onClick={() => setActiveTab('active')}
                    >
                        ✅ Active & Live Shops
                    </button>
                    <button 
                        style={activeTab === 'categories' ? styles.activeTab : styles.inactiveTab} 
                        onClick={() => setActiveTab('categories')}
                    >
                        📂 Manage Categories
                    </button>
                </div>

                {activeTab === 'categories' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {/* CREATE CATEGORY FORM */}
                        <div style={styles.card}>
                            <h2 style={{marginTop: 0, display: 'flex', alignItems: 'center', gap: '8px'}}><PlusCircle size={22} color="#16a34a"/> Create App Category</h2>
                            <p style={{color: '#64748b', fontSize: '14px', marginBottom: '20px'}}>Upload HD photos and create folders for the home screen (e.g., Vegetables, AC Mechanic).</p>
                            
                            <form onSubmit={handleCreateCategory} style={{ display: 'flex', flexDirection: 'column', gap: '15px', maxWidth: '500px' }}>
                                <div>
                                    <label style={styles.catLabel}>Category Name</label>
                                    <input 
                                        type="text" 
                                        placeholder="e.g., Vegetables" 
                                        style={styles.catInput}
                                        value={newCatName}
                                        onChange={(e) => setNewCatName(e.target.value)}
                                        required
                                    />
                                </div>
                                <div>
                                    <label style={styles.catLabel}>Assign to Section</label>
                                    <select 
                                        style={styles.catInput} 
                                        value={newCatSection} 
                                        onChange={(e) => setNewCatSection(e.target.value)}
                                    >
                                        <option value="Products">Products Tab</option>
                                        <option value="Services">Services Tab</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={styles.catLabel}>Upload HD Photo Banner</label>
                                    <input 
                                        type="file" 
                                        accept="image/*"
                                        style={styles.catInput}
                                        onChange={(e) => setNewCatImage(e.target.files[0])}
                                        required
                                    />
                                </div>
                                <button type="submit" style={styles.approveBtn}>Create & Upload</button>
                            </form>
                        </div>

                        {/* LIST EXISTING CATEGORIES */}
                        <div style={styles.card}>
                            <h3 style={{ marginTop: 0, color: '#0f172a' }}>Existing Categories ({categories.length})</h3>
                            {categories.length === 0 ? (
                                <div style={styles.emptyBox}>No custom categories created yet.</div>
                            ) : (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '15px' }}>
                                    {categories.map((cat) => (
                                        <div key={cat.id} style={{ border: '1px solid #cbd5e1', borderRadius: '12px', padding: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', background: '#f8fafc' }}>
                                            <img 
                                                src={cat.hd_image} 
                                                alt={cat.name} 
                                                style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #2874f0' }} 
                                            />
                                            <h4 style={{ margin: '8px 0 2px 0', fontSize: '15px', color: '#0f172a' }}>{cat.name}</h4>
                                            <span style={{ fontSize: '11px', background: '#e0e7ff', color: '#1e3a8a', padding: '2px 8px', borderRadius: '10px', fontWeight: 'bold', marginBottom: '10px' }}>
                                                {cat.section}
                                            </span>
                                            <button 
                                                onClick={() => handleDeleteCategory(cat.id, cat.name)}
                                                style={{ ...styles.deleteBtn, padding: '6px 12px', fontSize: '12px', width: '100%', justifyContent: 'center' }}
                                            >
                                                <Trash2 size={14} /> Delete
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div style={styles.card}>
                        {displayVendors.length === 0 ? (
                            <div style={styles.emptyBox}>No {activeTab} shops right now.</div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                {displayVendors.map(vendor => {
                                    const currentTypes = vendor.shop_type ? vendor.shop_type.split(',').map(s => s.trim()) : ['Products'];

                                    return (
                                    <div key={vendor.id} style={styles.vendorBox}>
                                        <div style={styles.vendorInfo}>
                                            <h4 style={{ margin: '0 0 6px 0', fontSize: '18px', color: '#0f172a' }}>{vendor.business_name}</h4>
                                            <p style={styles.metaText}>👤 <strong>Owner:</strong> {vendor.username}</p>
                                            <p style={styles.metaText}>📱 <strong>Phone:</strong> {vendor.user_phone}</p>
                                            <p style={styles.metaText}>📦 <strong>Category:</strong> {vendor.category}</p>
                                            <p style={{...styles.metaText, color: '#94a3b8', fontSize: '11px', marginTop: '5px'}}>
                                                📅 Status: {vendor.is_approved ? 'Approved & Live' : 'Awaiting Review'}
                                            </p>
                                            
                                            <div style={{ marginTop: '15px', padding: '10px', background: 'white', borderRadius: '10px', border: '1px solid #cbd5e1' }}>
                                                <p style={{ margin: '0 0 8px 0', fontSize: '11px', fontWeight: 'bold', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <FolderSync size={12} /> Assign Home Screen Tabs (Multi-Select):
                                                </p>
                                                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                                    {TYPE_OPTIONS.map(type => {
                                                        const isActive = currentTypes.includes(type);
                                                        return (
                                                            <button 
                                                                key={type}
                                                                onClick={() => handleTypeToggle(vendor, type)}
                                                                style={{
                                                                    display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', border: 'none', transition: '0.2s',
                                                                    background: isActive ? '#16a34a' : '#f1f5f9',
                                                                    color: isActive ? 'white' : '#64748b',
                                                                    boxShadow: isActive ? '0 2px 5px rgba(22,163,74,0.3)' : 'none'
                                                                }}
                                                            >
                                                                {isActive && <CheckCircle size={14} />} {type === 'Trending' && !isActive && '🔥'} {type}
                                                            </button>
                                                        )
                                                    })}
                                                </div>
                                            </div>

                                            {vendor.is_approved && (
                                                <button 
                                                    onClick={() => navigate(`/shop/${vendor.id}`)}
                                                    style={{ marginTop: '10px', background: '#3b82f6', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', width: 'fit-content' }}
                                                >
                                                    <ExternalLink size={14} /> Visit Public Shop
                                                </button>
                                            )}
                                        </div>

                                        <div style={styles.docBox}>
                                            <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '8px' }}>🔐 ID Proofs:</span>
                                            <div style={{ display: 'flex', gap: '10px' }}>
                                                {vendor.id_front_url && (
                                                    <a href={vendor.id_front_url} target="_blank" rel="noopener noreferrer" style={styles.docLink}>Front ID <ExternalLink size={14} /></a>
                                                )}
                                                {vendor.id_back_url && (
                                                    <a href={vendor.id_back_url} target="_blank" rel="noopener noreferrer" style={styles.docLink}>Back ID <ExternalLink size={14} /></a>
                                                )}
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', justifyContent: 'center' }}>
                                            {activeTab === 'pending' ? (
                                                <button onClick={() => handleAction(vendor.id, vendor.business_name, 'approve')} style={styles.approveBtn}>
                                                    <CheckCircle size={16}/> Approve Live
                                                </button>
                                            ) : (
                                                <>
                                                    <button onClick={() => handleAction(vendor.id, vendor.business_name, 'suspend')} style={styles.suspendBtn}>
                                                        <AlertTriangle size={16}/> Suspend
                                                    </button>
                                                    <button onClick={() => handleAction(vendor.id, vendor.business_name, 'delete')} style={styles.deleteBtn}>
                                                        <Trash2 size={16}/> Remove
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
    page: { background: '#f8fafc', minHeight: '100vh', padding: '20px', fontFamily: 'Inter, sans-serif' },
    container: { maxWidth: '1000px', margin: '0 auto' },
    loading: { textAlign: 'center', padding: '50px', fontSize: '18px', fontWeight: 'bold', color: '#334155' },
    headerBar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' },
    title: { margin: 0, color: '#1e3a8a', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '22px' },
    backBtn: { background: 'white', border: '1px solid #cbd5e1', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold' },
    errorBox: { textAlign: 'center', padding: '15px', color: '#dc2626', fontWeight: 'bold', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', marginBottom: '20px' },
    tabContainer: { display: 'flex', gap: '10px', marginBottom: '20px', overflowX: 'auto', whiteSpace: 'nowrap' },
    activeTab: { flex: 1, padding: '12px', background: '#2874f0', color: 'white', fontWeight: 'bold', border: 'none', borderRadius: '10px', cursor: 'pointer', boxShadow: '0 4px 6px rgba(40,116,240,0.3)' },
    inactiveTab: { flex: 1, padding: '12px', background: '#e2e8f0', color: '#475569', fontWeight: 'bold', border: 'none', borderRadius: '10px', cursor: 'pointer' },
    card: { background: 'white', padding: '30px', borderRadius: '20px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' },
    emptyBox: { textAlign: 'center', padding: '40px', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1', color: '#64748b', fontWeight: 'bold' },
    vendorBox: { background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '20px', display: 'grid', gridTemplateColumns: '1.5fr 1fr auto', gap: '20px' },
    vendorInfo: { display: 'flex', flexDirection: 'column', gap: '4px' },
    metaText: { margin: 0, fontSize: '13px', color: '#475569' },
    docBox: { background: '#ffffff', padding: '10px', borderRadius: '10px', border: '1px solid #e2e8f0' },
    docLink: { display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', background: '#eff6ff', color: '#2563eb', padding: '6px 10px', borderRadius: '6px', textDecoration: 'none', fontWeight: 'bold' },
    approveBtn: { display: 'flex', alignItems: 'center', gap: '6px', background: '#16a34a', color: 'white', border: 'none', padding: '12px 20px', borderRadius: '8px', fontWeight: '900', cursor: 'pointer' },
    suspendBtn: { display: 'flex', alignItems: 'center', gap: '6px', background: '#f59e0b', color: 'white', border: 'none', padding: '10px 15px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' },
    deleteBtn: { display: 'flex', alignItems: 'center', gap: '6px', background: '#dc2626', color: 'white', border: 'none', padding: '10px 15px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' },
    catLabel: { fontWeight: 'bold', fontSize: '13px', color: '#475569', display: 'block', marginBottom: '6px' },
    catInput: { width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none' }
};

export default AdminDashboard;