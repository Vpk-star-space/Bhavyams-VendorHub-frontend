import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { socket } from '../context/AppContext';
import axios from 'axios';
import { AppContext } from '../context/AppContext';
import { Phone, Share2, BadgeCheck, MapPin, ArrowLeft, Edit, X, Check, Package, Calendar, ShoppingCart, Store, Upload } from 'lucide-react';

const ShopProfile = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const {  } = useContext(AppContext);
    
    const [shopData, setShopData] = useState(null);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    // Edit Modal State
    const [showEditModal, setShowEditModal] = useState(false);
    const [imageFile, setImageFile] = useState(null); 
    const [editForm, setEditForm] = useState({ 
        business_name: '', 
        category: '', 
        shop_type: 'Products', 
        is_online: true 
    });

    const userStr = localStorage.getItem('user');
    const currentUser = userStr && userStr !== 'undefined' ? JSON.parse(userStr) : null;

    // 🟢 CHECK: Is it the Admin?
    const isMasterAdmin = currentUser && (
        String(currentUser.role).toLowerCase() === 'admin' || 
        currentUser.email === 'pavanvenkat63@gmail.com'
    );

    useEffect(() => {
        const fetchShopProfile = async () => {
            try {
                const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000/api';
                const res = await axios.get(`${BACKEND_URL}/shops/${id}`);
                setShopData(res.data.shop);
                setProducts(res.data.products);

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
        try {
            const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000/api';
            const token = localStorage.getItem('token');
            
            const formData = new FormData();
            formData.append('business_name', editForm.business_name);
            formData.append('category', editForm.category);
            formData.append('shop_type', editForm.shop_type); // Sent to backend
            formData.append('is_online', editForm.is_online);
            if (imageFile) {
                formData.append('shop_logo', imageFile);
            }

            const res = await axios.put(`${BACKEND_URL}/shops/${id}`, formData, {
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });
            
            setShopData(res.data.shop);
            setShowEditModal(false);
            setImageFile(null);
            alert("✅ Store updated successfully!");
        } catch (err) {
            alert("❌ Failed to update store details.");
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

    if (loading) return <div style={styles.loading}>Loading Store Profile...</div>;
    if (!shopData) return null;

    // 🟢 CHECK: Is it the exact owner?
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

            {/* PREMIUM BUSINESS BANNER HEADER */}
            <div style={styles.bannerBackground}></div>
            
            <div style={styles.profileContentWrapper}>
                <div style={styles.avatarRow}>
                    <div style={styles.avatarContainer}>
                        {shopData.id_front_url ? (
                            <img src={shopData.id_front_url} alt="Shop Logo" style={styles.businessLogo} />
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
                </div>

                {/* 🛠️ CONTROLS: Shown to BOTH Owner AND Master Admin */}
                {(isOwner || isMasterAdmin) && (
                    <div style={styles.adminControlPanel}>
                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px'}}>
                            <span style={{fontSize: '12px', fontWeight: 'bold', color: '#b45309'}}>
                                {isMasterAdmin ? '👑 Master Admin Mode' : '🛠️ Store Owner Tools'}
                            </span>
                        </div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button onClick={() => setShowEditModal(true)} style={styles.adminBtn}>
                                <Edit size={16}/> Edit Store Info
                            </button>
                            <button onClick={() => navigate('/add-product')} style={styles.primaryAdminBtn}>
                                <Package size={16}/> Add Catalog Item
                            </button>
                        </div>
                    </div>
                )}

                {/* 🟢 CUSTOMER-ONLY BUTTONS (Hidden from Owner and Admin) */}
                {!(isOwner || isMasterAdmin) && (
                    <div style={styles.actionButtonsRow}>
                        
                        {dbShopType === 'Services' && (
                            <button style={styles.primaryActionBtn} onClick={() => alert("Booking System Coming Soon!")}>
                                <Calendar size={18} /> Book Service
                            </button>
                        )}

                        {dbShopType === 'Products' && (
                            <button style={styles.primaryActionBtn} onClick={() => alert("Ordering System Coming Soon!")}>
                                <ShoppingCart size={18} /> Shop Now
                            </button>
                        )}

                        {dbShopType === 'Promotions' && (
                            <button style={{...styles.primaryActionBtn, background: '#f59e0b'}} onClick={() => alert("Promo Claim Coming Soon!")}>
                                📢 Claim Offer
                            </button>
                        )}

                        <button style={styles.secondaryActionBtn} onClick={() => alert("Calling coming soon!")}>
                            <Phone size={18} /> Call
                        </button>
                    </div>
                )}
            
            </div>

            {/* CATALOG SECTION */}
            <div style={styles.feedSection}>
                <div style={styles.feedTabs}>
                    <div style={styles.activeTab}>Store Catalog</div>
                </div>

                {products.length === 0 ? (
                    <div style={styles.emptyFeed}>
                        <Package size={40} color="#cbd5e1" style={{marginBottom: '10px'}} />
                        <p style={{margin: 0, fontWeight: 'bold', color: '#64748b'}}>No items available right now.</p>
                    </div>
                ) : (
                    <div style={styles.grid}>
                        {products.map(product => (
                            <div key={product.id} style={styles.gridItem}>
                                <img src={product.image_url || 'https://via.placeholder.com/150'} alt={product.name} style={styles.gridImg} />
                                <div style={styles.gridDetails}>
                                    <span style={styles.gridPrice}>₹{product.price}</span>
                                    <span style={styles.gridName}>{product.name}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ✏️ EDIT STORE INFO MODAL */}
            {showEditModal && (
                <div style={styles.overlay}>
                    <div style={styles.modal}>
                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px'}}>
                            <h3 style={{margin: 0, color: '#0f172a'}}>Edit Store Profile</h3>
                            <X size={20} style={{cursor: 'pointer'}} onClick={() => setShowEditModal(false)} />
                        </div>
                        <form onSubmit={handleUpdateSubmit} style={{display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'left'}}>
                            
                            {/* FILE UPLOAD BUTTON */}
                            <div style={styles.uploadBox}>
                                <label style={styles.uploadLabel}><Upload size={16}/> Update Store Logo / Profile Pic</label>
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

                            {/* 👑 ADMIN ONLY: Shop Type Switcher (Products / Services / Promotions) */}
                            {isMasterAdmin && (
                                <div style={{ background: '#fffbeb', padding: '10px', borderRadius: '8px', border: '1px dashed #f59e0b', marginBottom: '10px' }}>
                                    <label style={{...styles.modalLabel, color: '#b45309'}}>👑 Admin Override: Assign Store Tab</label>
                                    <select style={styles.input} value={editForm.shop_type} onChange={e => setEditForm({...editForm, shop_type: e.target.value})}>
                                        <option value="Products">🛒 Products & Retail</option>
                                        <option value="Services">🛠️ Services & Bookings</option>
                                        <option value="Promotions">📢 Promotions & Offers</option>
                                    </select>
                                    <span style={{fontSize: '10px', color: '#b45309'}}>This decides which tab they appear in on the Home Screen.</span>
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
    
    bannerBackground: { height: '140px', background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)', width: '100%' },
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
    secondaryActionBtn: { flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', background: '#e2e8f0', color: '#0f172a', border: 'none', padding: '12px', borderRadius: '10px', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer' },
    
    feedSection: { marginTop: '25px', background: 'white', borderTopLeftRadius: '20px', borderTopRightRadius: '20px', padding: '20px', minHeight: '300px', maxWidth: '800px', margin: '25px auto 0 auto', border: '1px solid #e2e8f0' },
    feedTabs: { display: 'flex', borderBottom: '2px solid #f1f5f9', marginBottom: '15px' },
    activeTab: { padding: '10px 15px', fontWeight: 'bold', borderBottom: '3px solid #0f172a', color: '#0f172a', fontSize: '15px', marginBottom: '-2px' },
    emptyFeed: { textAlign: 'center', padding: '40px 20px', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1', display: 'flex', flexDirection: 'column', alignItems: 'center' },
    
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '10px' },
    gridItem: { position: 'relative', aspectRatio: '1/1', background: '#f8fafc', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2e8f0' },
    gridImg: { width: '100%', height: '100%', objectFit: 'cover' },
    gridDetails: { position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent, rgba(0,0,0,0.9))', padding: '30px 10px 10px 10px', display: 'flex', flexDirection: 'column' },
    gridPrice: { color: '#4ade80', fontWeight: 'bold', fontSize: '13px' },
    gridName: { color: 'white', fontSize: '12px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: '500' },
    
    overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', zIndex: 1000 },
    modal: { background: 'white', padding: '25px', borderRadius: '20px', maxWidth: '400px', width: '100%', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', maxHeight: '90vh', overflowY: 'auto' },
    modalLabel: { fontSize: '12px', fontWeight: 'bold', color: '#475569', marginBottom: '4px' },
    input: { padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', width: '100%', boxSizing: 'border-box', background: '#f8fafc', marginBottom: '10px' },
    uploadBox: { background: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px dashed #cbd5e1', display: 'flex', flexDirection: 'column', marginBottom: '10px' },
    uploadLabel: { fontSize: '12px', fontWeight: 'bold', color: '#2563eb', display: 'flex', alignItems: 'center', gap: '5px' },
    saveBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', background: '#16a34a', color: 'white', border: 'none', padding: '14px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', width: '100%', marginTop: '10px', fontSize: '15px' }
};

export default ShopProfile;