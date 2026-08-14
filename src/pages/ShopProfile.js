import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { socket } from '../context/AppContext';
import axios from 'axios';
import { AppContext } from '../context/AppContext';

import { Phone, Share2, BadgeCheck, MapPin, ArrowLeft, Edit, X, Check, Package, Calendar, ShoppingCart, Store, Upload, Search, Users, BellRing, BellOff, Bell, Megaphone } from 'lucide-react';

const getBackendUrl = () => {
    return process.env.NODE_ENV === 'production' 
        ? 'https://bhavyams-vendorhub-backend.onrender.com/api' 
        : 'http://localhost:5000/api';
};

const ShopProfile = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { } = useContext(AppContext);
    
    const [shopData, setShopData] = useState(null);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    const [shopSearch, setShopSearch] = useState('');
    const [isFollowing, setIsFollowing] = useState(false);
    const [notifMenuOpen, setNotifMenuOpen] = useState(false);
    const [notifLevel, setNotifLevel] = useState('All');

    const [showEditModal, setShowEditModal] = useState(false);
    const [imageFile, setImageFile] = useState(null); 
    const [uploadError, setUploadError] = useState('');
    
    const [editForm, setEditForm] = useState({ 
        business_name: '', 
        category: '', 
        shop_type: 'Products', 
        is_online: true 
    });

    const userStr = localStorage.getItem('user');
    const currentUser = userStr && userStr !== 'undefined' ? JSON.parse(userStr) : null;

    const isMasterAdmin = currentUser && (
        String(currentUser.role).toLowerCase() === 'admin' || 
        currentUser.email === 'pavanvenkat63@gmail.com'
    );

    useEffect(() => {
        const fetchShopProfile = async () => {
            try {
                const BACKEND_URL = getBackendUrl();
                const res = await axios.get(`${BACKEND_URL}/shops/${id}`);
                setShopData(res.data.shop);
                setProducts(res.data.products || []);

                setEditForm({
                    business_name: res.data.shop.business_name,
                    category: res.data.shop.category,
                    shop_type: res.data.shop.shop_type || 'Products', 
                    is_online: res.data.shop.is_online
                });
            } catch (err) {
                console.error("Frontend fetch error:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchShopProfile();

        socket.on('shop_updated', (updatedShop) => {
            if (String(updatedShop.id) === String(id)) {
                setShopData(prev => ({ ...prev, ...updatedShop }));
            }
        });

        return () => socket.off('shop_updated');
    }, [id]);

 const handleUpdateSubmit = async (e) => {
        e.preventDefault();
        setUploadError('');

        try {
            const BACKEND_URL = getBackendUrl();
            const token = localStorage.getItem('token');
            
            // 🟢 MUST use FormData to match your backend's Multer setup
            const formData = new FormData();
            formData.append('business_name', editForm.business_name);
            formData.append('category', editForm.category);
            formData.append('shop_type', editForm.shop_type);
            formData.append('is_online', editForm.is_online);
            
            // 🟢 Your backend looks for 'shop_logo' inside upload.single()
            if (imageFile) {
                formData.append('shop_logo', imageFile);
            }

            const res = await axios.put(`${BACKEND_URL}/shops/${id}`, formData, {
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data' // <-- CRITICAL for Multer
                }
            });
            
            setShopData(res.data.shop);
            setShowEditModal(false);
            setImageFile(null);
            alert("✅ Store updated successfully!");
        } catch (err) {
            console.error(err);
            setUploadError("❌ Update failed! Ensure your backend 'uploads' folder exists.");
        }
    };
    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: shopData.business_name,
                    text: `Check out ${shopData.business_name} on Subhams Hub!`,
                    url: window.location.href
                });
            } catch (err) { console.log('Share canceled', err); }
        } else {
            alert("Share not supported. Copy URL from browser.");
        }
    };

    const handleNotificationChange = (level) => {
        setNotifLevel(level);
        setNotifMenuOpen(false);
    };

    const filteredCatalog = products.filter(item => 
        (item.name || '').toLowerCase().includes(shopSearch.toLowerCase())
    );

    if (loading) return <div style={styles.loading}>Loading Store Profile...</div>;
    if (!shopData) return null;

    const isOwner = currentUser && shopData && (String(currentUser.id) === String(shopData.user_id));
    const dbShopType = shopData.shop_type || 'Products'; 

    return (
        <div style={styles.page}>
            {/* FIXED TOP NAVIGATION */}
            <div style={styles.navBar}>
                <button onClick={() => navigate(-1)} style={styles.backBtn}>
                    <ArrowLeft size={20} /> Back
                </button>
                <button onClick={handleShare} style={styles.shareIconBtn}>
                    <Share2 size={18} /> Share
                </button>
            </div>

            {/* 🟢 FIXED: REMOVED DUPLICATE BANNER AND ALIGNED TEXT */}
            <div style={styles.bannerBackground}>
                <div style={styles.bannerTextContainer}>
                    <span style={styles.bannerCategoryText}>{shopData.category || 'Local Business'}</span>
                    <h1 style={styles.bannerTitleText}>{shopData.business_name}</h1>
                </div>
            </div>
            
            <div style={styles.profileContentWrapper}>
                <div style={styles.avatarRow}>
               <div style={styles.avatarContainer}>
    {/* 👇 It now checks for your NEW upload first, then falls back to the old one */}
    {(shopData.shop_logo || shopData.id_front_url) ? (
        <img src={shopData.shop_logo || shopData.id_front_url} alt="Shop Logo" style={styles.businessLogo} />
    ) : (
                            <div style={{...styles.businessLogo, background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                                <Store size={40} color="#94a3b8" />
                            </div>
                        )}
                        {shopData.is_online && <div style={styles.onlineBadge}></div>}
                    </div>
                    
                    <div style={styles.realMetricsBox}>
                        <Package size={20} color="#2874f0" />
                        <div style={{display: 'flex', flexDirection: 'column'}}>
                            <span style={styles.metricNumber}>{products.length}</span>
                            <span style={styles.metricLabel}>Live Items</span>
                        </div>
                    </div>
                </div>

                <div style={styles.bioSection}>
                    <h2 style={styles.shopName}>
                        {shopData.business_name} <BadgeCheck size={20} color="#2563eb" />
                    </h2>
                    <span style={styles.categoryTag}>{shopData.category}</span>
                    <p style={styles.address}><MapPin size={14} /> {shopData.address || 'Local Business'}</p>
                    
                    <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px', color: '#475569', fontWeight: 'bold' }}>
                        <Users size={14} /> {shopData.followers_count || 0} Followers
                    </div>
                </div>

                {(isOwner || isMasterAdmin) && (
                    <div style={styles.adminControlPanel}>
                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px'}}>
                            <span style={{fontSize: '12px', fontWeight: 'bold', color: '#b45309'}}>
                                {isMasterAdmin ? '👑 Master Admin Mode' : '🛠️ Store Owner Tools'}
                            </span>
                        </div>
                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                            <button onClick={() => { setShowEditModal(true); setUploadError(''); }} style={styles.adminBtn}>
                                <Edit size={16}/> Edit Store Info
                            </button>
                            <button onClick={() => navigate(`/manage-catalog/${id}`)} style={styles.primaryAdminBtn}>
                                <Package size={16}/> Manage Catalog
                            </button>
                            <button onClick={() => alert("Promotion request sent to Admin Panel!")} style={{...styles.primaryAdminBtn, background: '#f59e0b'}}>
                                <Megaphone size={16}/> Promote Shop
                            </button>
                        </div>
                    </div>
                )}

                {!(isOwner || isMasterAdmin) && (
                    <div style={styles.actionButtonsRow}>
                        
                        <button 
                            style={isFollowing ? styles.followingBtn : styles.primaryActionBtn} 
                            onClick={() => setIsFollowing(!isFollowing)}
                        >
                            {isFollowing ? <Check size={18} /> : <Users size={18} />} 
                            {isFollowing ? 'Following' : 'Follow'}
                        </button>

                        {isFollowing && (
                            <div style={{ position: 'relative' }}>
                                <button style={styles.secondaryActionBtn} onClick={() => setNotifMenuOpen(!notifMenuOpen)}>
                                    {notifLevel === 'All' && <BellRing size={18} color="#2563eb" />}
                                    {notifLevel === 'Silent' && <Bell size={18} color="#f59e0b" />}
                                    {notifLevel === 'Off' && <BellOff size={18} color="#94a3b8" />}
                                </button>
                                {notifMenuOpen && (
                                    <div style={styles.notifMenu}>
                                        <div style={styles.notifItem} onClick={() => handleNotificationChange('All')}><BellRing size={14}/> All Alerts</div>
                                        <div style={styles.notifItem} onClick={() => handleNotificationChange('Silent')}><Bell size={14}/> Silent</div>
                                        <div style={styles.notifItem} onClick={() => handleNotificationChange('Off')}><BellOff size={14}/> Off</div>
                                    </div>
                                )}
                            </div>
                        )}

                        <button style={styles.secondaryActionBtn} onClick={() => alert("Calling coming soon!")}>
                            <Phone size={18} /> Call
                        </button>
                    </div>
                )}
            </div>

            {/* CATALOG SECTION WITH SEARCH */}
            <div style={styles.feedSection}>
                <div style={styles.feedTabs}>
                    <div style={styles.activeTab}>Store Catalog</div>
                </div>

                <div style={styles.localSearchBox}>
                    <Search size={16} color="#94a3b8" />
                    <input 
                        type="text" 
                        placeholder="Search products in this store..." 
                        value={shopSearch}
                        onChange={(e) => setShopSearch(e.target.value)}
                        style={styles.localSearchInput}
                    />
                </div>

                {filteredCatalog.length === 0 ? (
                    <div style={styles.emptyFeed}>
                        <Package size={40} color="#cbd5e1" style={{marginBottom: '10px'}} />
                        <p style={{margin: 0, fontWeight: 'bold', color: '#64748b'}}>
                            {shopSearch ? 'No items match your search.' : 'No items available right now.'}
                        </p>
                    </div>
                ) : (
                    <div style={styles.listView}>
                 {filteredCatalog.map(product => {
    const sellPrice = Number(product.price) || 0;
    const mrp = Number(product.mrp) || (sellPrice ? Math.round(sellPrice * 1.15) : 0);
    const discount = mrp > sellPrice ? Math.round(((mrp - sellPrice) / mrp) * 100) : 0;

    return (
        <div key={product.id} style={styles.listItem}>
            {/* 🟢 NEW: Added onClick here to open the new Item Detail page */}
            <div 
                style={{ display: 'flex', gap: '15px', alignItems: 'center', cursor: 'pointer', flex: 1 }} 
                onClick={() => navigate(`/item/${product.id}`)}
            >
                <img src={product.image_url || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=200&q=80'} alt={product.name} style={styles.listImg} />
                
                <div style={styles.listDetails}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <h4 style={styles.listTitle}>{product.name}</h4>
                            <span style={styles.unitText}>{product.unit_value || '1'} {product.unit_type || 'Piece'}</span>
                        </div>
                        <span style={styles.stockBadge}>In Stock</span>
                    </div>
                    
                    <p style={styles.listDesc}>{product.description || 'Premium quality item.'}</p>
                    
                    <div style={styles.priceRow}>
                        <span style={styles.sellPrice}>₹{sellPrice}</span>
                        {mrp > sellPrice && <span style={styles.mrpPrice}>₹{mrp}</span>}
                        {discount > 0 && <span style={styles.discountBadge}>{discount}% OFF</span>}
                    </div>
                </div>
            </div>
            
            {/* Action Box stays on the right side */}
            {!(isOwner || isMasterAdmin) && (
                <div style={styles.listActionBox}>
                    <button style={styles.addBtn} onClick={() => alert("Added to cart/booking!")}>
                        {dbShopType.includes('Services') ? 'Book' : 'Add +'}
                    </button>
                </div>
            )}
        </div>
    );
})}
                    </div>
                )}
            </div>

            {/* EDIT STORE INFO MODAL */}
            {showEditModal && (
                <div style={styles.overlay}>
                    <div style={styles.modal}>
                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px'}}>
                            <h3 style={{margin: 0, color: '#0f172a'}}>Edit Store Profile</h3>
                            <X size={20} style={{cursor: 'pointer'}} onClick={() => setShowEditModal(false)} />
                        </div>

                        {uploadError && (
                            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '10px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', marginBottom: '15px' }}>
                                {uploadError}
                            </div>
                        )}

                        <form onSubmit={handleUpdateSubmit} style={{display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'left'}}>
                            
                            <div style={styles.uploadBox}>
                                <label style={styles.uploadLabel}><Upload size={16}/> Update Brand Logo / Profile Pic</label>
                                <input type="file" accept="image/*" onChange={e => setImageFile(e.target.files[0])} style={{fontSize: '12px', marginTop: '5px'}} />
                            </div>

                            <div>
                                <label style={styles.modalLabel}>Business Name</label>
                                <input style={styles.input} value={editForm.business_name} onChange={e => setEditForm({...editForm, business_name: e.target.value})} required />
                            </div>

                            <div>
                                <label style={styles.modalLabel}>Category / Industry</label>
                                <input style={styles.input} value={editForm.category} onChange={e => setEditForm({...editForm, category: e.target.value})} required />
                            </div>

                            {isMasterAdmin && (
                                <div style={{ background: '#fffbeb', padding: '10px', borderRadius: '8px', border: '1px dashed #f59e0b', marginBottom: '10px' }}>
                                    <label style={{...styles.modalLabel, color: '#b45309'}}>👑 Admin Override: Assign Store Tab</label>
                                    <select style={styles.input} value={editForm.shop_type} onChange={e => setEditForm({...editForm, shop_type: e.target.value})}>
                                        <option value="Products">🛒 Products & Retail</option>
                                        <option value="Services">🛠️ Services & Bookings</option>
                                        <option value="Promotions">📢 Promotions & Offers</option>
                                    </select>
                                </div>
                            )}

                            <div>
                                <label style={styles.modalLabel}>Store Status</label>
                                <select style={styles.input} value={editForm.is_online ? 'true' : 'false'} onChange={e => setEditForm({...editForm, is_online: e.target.value === 'true'})}>
                                    <option value="true">🟢 Accepting Orders / Bookings</option>
                                    <option value="false">🔴 Currently Closed</option>
                                </select>
                            </div>

                            <button type="submit" style={styles.saveBtn}><Check size={16} /> Save Changes</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

const styles = {
    page: { background: '#f8fafc', minHeight: '100vh', fontFamily: 'Inter, sans-serif', paddingBottom: '50px' },
    loading: { textAlign: 'center', padding: '50px', fontWeight: 'bold', color: '#64748b' },
    
    navBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 20px', background: 'white', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 2px 10px rgba(0,0,0,0.05)' },
    backBtn: { display: 'flex', alignItems: 'center', gap: '6px', background: 'transparent', border: 'none', cursor: 'pointer', color: '#0f172a', fontWeight: 'bold', fontSize: '15px', padding: 0 },
    shareIconBtn: { display: 'flex', alignItems: 'center', gap: '6px', background: '#f1f5f9', border: '1px solid #cbd5e1', cursor: 'pointer', color: '#0f172a', fontWeight: 'bold', fontSize: '13px', padding: '6px 12px', borderRadius: '8px' },
    
    bannerBackground: { 
        height: '160px', 
        background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)', 
        width: '100%', 
        display: 'flex', 
        alignItems: 'center', 
        boxSizing: 'border-box' 
    },
    // 🟢 FIXED: Adjusted margin to perfectly align the text above the avatar
    bannerTextContainer: { 
        display: 'flex', 
        flexDirection: 'column', 
        width: '100%',
        maxWidth: '800px',
        margin: '0 auto',
        padding: '0 20px',
        marginBottom: '20px'
    },
    bannerCategoryText: { 
        fontSize: '12px', 
        fontWeight: 'bold', 
        color: '#93c5fd', 
        textTransform: 'uppercase', 
        letterSpacing: '1px' 
    },
    bannerTitleText: { 
        margin: '2px 0 0 0', 
        fontSize: '28px', 
        fontWeight: '900', 
        color: 'white', 
        textShadow: '0 2px 4px rgba(0,0,0,0.2)' 
    },

    profileContentWrapper: { padding: '0 20px', marginTop: '-45px', position: 'relative', zIndex: 2, maxWidth: '800px', margin: '-45px auto 0 auto' },
    avatarRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' },
    avatarContainer: { position: 'relative' },
    businessLogo: { width: '90px', height: '90px', borderRadius: '16px', objectFit: 'cover', border: '4px solid white', backgroundColor: 'white', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' },
    onlineBadge: { position: 'absolute', bottom: '-4px', right: '-4px', width: '18px', height: '18px', background: '#22c55e', border: '3px solid white', borderRadius: '50%' },
    
    realMetricsBox: { background: 'white', padding: '10px 15px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', marginBottom: '10px' },
    metricNumber: { fontSize: '16px', fontWeight: '900', color: '#0f172a', lineHeight: '1' },
    metricLabel: { fontSize: '11px', color: '#64748b', fontWeight: 'bold' },
    
    bioSection: { marginTop: '15px' },
    shopName: { margin: '0 0 5px 0', fontSize: '22px', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '6px', color: '#0f172a' },
    categoryTag: { display: 'inline-block', background: '#e0e7ff', color: '#1d4ed8', padding: '4px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', marginBottom: '8px' },
    address: { margin: 0, color: '#475569', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '500' },
    
    adminControlPanel: { marginTop: '20px', background: '#fffbeb', border: '1px dashed #f59e0b', padding: '15px', borderRadius: '12px' },
    adminBtn: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px', background: 'white', border: '1px solid #cbd5e1', color: '#0f172a', borderRadius: '8px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer' },
    primaryAdminBtn: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px', background: '#16a34a', border: 'none', color: 'white', borderRadius: '8px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer' },
    
    actionButtonsRow: { display: 'flex', gap: '10px', marginTop: '20px' },
    primaryActionBtn: { flex: 2, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', background: '#2874f0', color: 'white', border: 'none', padding: '12px', borderRadius: '10px', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer', boxShadow: '0 4px 10px rgba(40,116,240,0.3)' },
    followingBtn: { flex: 2, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', background: '#f1f5f9', color: '#0f172a', border: '1px solid #cbd5e1', padding: '12px', borderRadius: '10px', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer' },
    secondaryActionBtn: { flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', background: '#e2e8f0', color: '#0f172a', border: 'none', padding: '12px', borderRadius: '10px', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer' },
    
    notifMenu: { position: 'absolute', top: '55px', right: 0, background: 'white', border: '1px solid #e2e8f0', borderRadius: '10px', boxShadow: '0 10px 15px rgba(0,0,0,0.1)', zIndex: 50, width: '130px', overflow: 'hidden' },
    notifItem: { padding: '10px 15px', fontSize: '13px', fontWeight: 'bold', color: '#334155', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #f1f5f9' },

    feedSection: { marginTop: '25px', background: 'white', borderTopLeftRadius: '20px', borderTopRightRadius: '20px', padding: '20px', minHeight: '300px', maxWidth: '800px', margin: '25px auto 0 auto', border: '1px solid #e2e8f0' },
    feedTabs: { display: 'flex', borderBottom: '2px solid #f1f5f9', marginBottom: '15px' },
    activeTab: { padding: '10px 15px', fontWeight: 'bold', borderBottom: '3px solid #0f172a', color: '#0f172a', fontSize: '15px', marginBottom: '-2px' },
    
    localSearchBox: { display: 'flex', alignItems: 'center', background: '#f1f5f9', padding: '10px 15px', borderRadius: '10px', gap: '8px', marginBottom: '20px' },
    localSearchInput: { border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '14px', color: '#334155' },
    
    emptyFeed: { textAlign: 'center', padding: '40px 20px', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1', display: 'flex', flexDirection: 'column', alignItems: 'center' },
    
    listView: { display: 'flex', flexDirection: 'column', gap: '15px' },
    listItem: { display: 'flex', gap: '15px', paddingBottom: '15px', borderBottom: '1px solid #f1f5f9', alignItems: 'center' },
    listImg: { width: '80px', height: '80px', borderRadius: '12px', objectFit: 'cover', background: '#f8fafc' },
    listDetails: { flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' },
    listTitle: { margin: '0 0 4px 0', fontSize: '15px', color: '#0f172a', fontWeight: 'bold' },
    listDesc: { margin: '0 0 8px 0', fontSize: '12px', color: '#64748b', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' },
    priceRow: { display: 'flex', alignItems: 'center', gap: '8px' },
    sellPrice: { fontSize: '15px', fontWeight: '900', color: '#16a34a' },
    mrpPrice: { fontSize: '12px', color: '#94a3b8', textDecoration: 'line-through', fontWeight: '500' },
    discountBadge: { fontSize: '10px', background: '#dcfce7', color: '#16a34a', padding: '2px 6px', borderRadius: '6px', fontWeight: 'bold' },
    stockBadge: { fontSize: '10px', color: '#0f172a', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' },
    
    listActionBox: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center' },
    addBtn: { background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', padding: '6px 16px', borderRadius: '8px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer' },

    overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', zIndex: 1000 },
    modal: { background: 'white', padding: '25px', borderRadius: '20px', maxWidth: '400px', width: '100%', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', maxHeight: '90vh', overflowY: 'auto' },
    modalLabel: { fontSize: '12px', fontWeight: 'bold', color: '#475569', marginBottom: '4px' },
    input: { padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', width: '100%', boxSizing: 'border-box', background: '#f8fafc', marginBottom: '10px' },
    uploadBox: { background: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px dashed #cbd5e1', display: 'flex', flexDirection: 'column', marginBottom: '10px' },
    uploadLabel: { fontSize: '12px', fontWeight: 'bold', color: '#2563eb', display: 'flex', alignItems: 'center', gap: '5px' },
    saveBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', background: '#16a34a', color: 'white', border: 'none', padding: '14px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', width: '100%', marginTop: '10px', fontSize: '15px' }
};

export default ShopProfile;