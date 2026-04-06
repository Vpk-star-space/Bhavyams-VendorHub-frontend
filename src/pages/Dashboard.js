import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import { 
    ShoppingBag, PlusCircle, History, Store, LogOut, 
    Shield, User, Users, ArrowLeft, CheckCircle, 
    Clock, Star, Sparkles, Package, Home, ListOrdered
} from 'lucide-react';

import ProductList from '../components/ProductList';
import AdminUserList from '../components/AdminUserList';
import AdminProductList from '../components/AdminProductList';
import Profile from './Profile'; 

// 🕒 TRACKING & REVIEW COMPONENT (Used by Customer, Vendor, & Admin)
const OrderStatus = ({ order, role }) => {
    const [showReviewForm, setShowReviewForm] = useState(false);
    const [rating, setRating] = useState(order.existing_rating || 5);
    const [comment, setComment] = useState(order.existing_comment || "");
    const [isReviewed, setIsReviewed] = useState(!!order.existing_rating); 
    const isDelivered = order.status === 'Delivered';

   const getProductImg = (url) => {
        if (!url) return 'https://via.placeholder.com/150?text=No+Image';
        // 🚀 FIX: Point to the live Render Backend!
        return url.startsWith('http') ? url : `https://bhavyams-vendorhub-backend.onrender.com${url}`;
    };

    const submitReview = async () => {
        const pId = order.product_id || order.productId || order.p_id;
        const oId = order.id || order.order_id;
        if (!pId) return toast.error("Error: Product ID missing");
        try {
            const token = localStorage.getItem('token');
            await axios.post('https://bhavyams-vendorhub-backend.onrender.com/api/orders/add-review', {
                orderId: oId, productId: pId, rating: parseInt(rating), comment: comment
            }, { headers: { Authorization: `Bearer ${token}` } });
            toast.success("Review submitted!");
            setShowReviewForm(false);
            setIsReviewed(true); 
        } catch (err) { toast.error("Failed to post review"); }
    };
    
    return (
        <motion.div layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={styles.statusBox}>
            <div style={{display:'flex', gap: '15px', alignItems: 'center', marginBottom: '15px'}}>
                <img src={getProductImg(order.image_url)} alt="product" style={{width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover'}} />
                <div style={{flex: 1}}>
                    <h4 style={{margin:0, fontSize: '16px', color: '#0f172a', fontWeight: '900'}}>Order #{order.order_id || order.id}</h4>
                    <div style={{fontSize: '12px', color: '#64748b'}}>
                        {order.product_name || "Bhavyams Product"}
                        {role === 'admin' && ` | Customer: ${order.customer_name}`}
                        {role === 'vendor' && ` | Revenue: ₹${order.total_price}`}
                    </div>
                </div>
                <span style={isDelivered ? styles.badgeSuccess : styles.badgeInfo}>
                    {order.status?.toUpperCase() || 'CONFIRMED'}
                </span>
            </div>

            <div style={styles.progressBar}>
                <motion.div 
                    initial={{ width: 0 }} animate={{ width: isDelivered ? '100%' : '50%' }}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                    style={{ background: isDelivered ? '#10b981' : '#2874f0', height: '100%', borderRadius: '8px' }}
                />
            </div>

            {!isDelivered ? (
                <div style={{fontSize: '13px', color: '#64748b', marginTop: '15px', display: 'flex', alignItems: 'center', gap: '8px'}}>
                    <Clock size={16} color="#2874f0"/> Order is On the Way ...
                </div>
            ) : (
                <div style={{marginTop: '15px'}}>
                    <div style={{fontSize: '14px', color: '#10b981', fontWeight: '700', marginBottom: '10px', display:'flex', alignItems:'center'}}>
                        <CheckCircle size={16} style={{marginRight: '8px'}}/> 
                        {role === 'customer' ? `Delivered to: ${order.delivery_address}` : 'Delivery Completed'}
                    </div>
                    
                    {/* Only show reviews to customers */}
                    {role === 'customer' && (
                        <AnimatePresence mode="wait">
                            {isReviewed ? (
                                <motion.div layout initial={{ opacity: 0 }} style={styles.reviewedBox}>
                                    <div style={{color: '#2874f0', fontSize: '15px', fontWeight: '800', display: 'flex', alignItems: 'center'}}>
                                        <Star size={18} fill="#2874f0" style={{marginRight: '6px'}}/> Your Feedback: {rating}/5
                                    </div>
                                    {comment && <div style={{ fontSize: '14px', color: '#1e293b', marginTop: '8px', fontWeight: '500' }}>"{comment}"</div>}
                                </motion.div>
                            ) : !showReviewForm ? (
                                <button onClick={() => setShowReviewForm(true)} style={styles.reviewBtn}>
                                    <Star size={14} style={{marginRight: '8px'}}/> RATE PRODUCT
                                </button>
                            ) : (
                                <motion.div layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={styles.reviewForm}>
                                    <div style={{marginBottom: '15px'}}>
                                        <label style={styles.reviewLabel}>Choose Rating</label>
                                        <select value={rating} onChange={(e) => setRating(e.target.value)} style={styles.select}>
                                            <option value="5">⭐⭐⭐⭐⭐ 5 Stars</option>
                                            <option value="4">⭐⭐⭐⭐ 4 Stars</option>
                                            <option value="3">⭐⭐⭐ 3 Stars</option>
                                            <option value="2">⭐⭐ 2 Stars</option>
                                            <option value="1">⭐ 1 Star</option>
                                        </select>
                                    </div>
                                    <div style={{marginBottom: '20px'}}>
                                        <label style={styles.reviewLabel}>Share your feedback</label>
                                        <textarea placeholder="What did you like or dislike?" value={comment} onChange={(e) => setComment(e.target.value)} style={styles.textarea} />
                                    </div>
                                    <div style={{display:'flex', gap:'12px'}}>
                                        <button onClick={submitReview} style={styles.submitReviewBtn}>SUBMIT REVIEW</button>
                                        <button onClick={() => setShowReviewForm(false)} style={styles.cancelBtn}>CANCEL</button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    )}
                </div>
            )}
        </motion.div>
    );
};

const Dashboard = () => {
    const [activeTab, setActiveTab] = useState('overview');
    const [adminView, setAdminView] = useState('stats'); 
    const [currentUser, setCurrentUser] = useState(JSON.parse(localStorage.getItem('user')));
    
    // Unified state for orders
    const [ordersList, setOrdersList] = useState([]);
    
    const navigate = useNavigate();

    useEffect(() => {
        const syncData = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) return navigate('/login');
                const userRes = await axios.get('https://bhavyams-vendorhub-backend.onrender.com/api/auth/me', { headers: { Authorization: `Bearer ${token}` } });
                localStorage.setItem('user', JSON.stringify(userRes.data));
                setCurrentUser(userRes.data);
                
                // Fetch Logic Based on Role & Tab
                if (activeTab === 'orders' && userRes.data.role === 'customer') {
                    const res = await axios.get('https://bhavyams-vendorhub-backend.onrender.com/api/orders/my-orders', { headers: { Authorization: `Bearer ${token}` } });
                    setOrdersList(res.data);
                }
                if (activeTab === 'orders' && userRes.data.role === 'vendor') {
                    const res = await axios.get('https://bhavyams-vendorhub-backend.onrender.com/api/orders/my-sales', { headers: { Authorization: `Bearer ${token}` } });
                    setOrdersList(res.data);
                }
                if (activeTab === 'orders' && userRes.data.role === 'admin') {
                    const res = await axios.get('https://bhavyams-vendorhub-backend.onrender.com/api/orders/admin-all', { headers: { Authorization: `Bearer ${token}` } });
                    setOrdersList(res.data);
                }
            } catch (err) { console.error("Sync error:", err); }
        };
        syncData();
    }, [activeTab, navigate]);

    const handleLogout = () => { localStorage.clear(); navigate('/login'); };

    const renderNavItem = (id, icon, label, adminAction = null) => {
        const isActive = activeTab === id;
        return (
            <div onClick={() => { setActiveTab(id); if(adminAction) setAdminView(adminAction); }} style={isActive ? styles.activeNavItem : styles.navItem}>
                {icon} <span>{label}</span>
            </div>
        );
    };

    return (
        <div style={styles.dashboard}>
            <aside style={styles.sidebar}>
                <div style={styles.logoSection}>
                    <h2 style={styles.logo}>Bhavyams</h2> <h2 style={styles.logo}>VendorHub</h2>
                </div>
                
                <nav style={styles.nav}>
                    {renderNavItem('overview', <Home size={20} />, 'Home', 'stats')}
                    {renderNavItem('profile', <User size={20} />, 'My Profile')}

                    {currentUser?.role?.toLowerCase() === 'customer' && renderNavItem('orders', <History size={20} />, 'My Orders')}

                    {currentUser?.role?.toLowerCase() === 'vendor' && (
                        <>
                            <div style={styles.navSectionHeader}>MANAGEMENT</div>
                            <div onClick={() => navigate('/add-product')} style={styles.navItem}><PlusCircle size={20} /> <span>List Product</span></div>
                            {renderNavItem('orders', <ShoppingBag size={20} />, 'My Sales')}
                        </>
                    )}

                    {currentUser?.role?.toLowerCase() === 'admin' && (
                        <>
                            <div style={styles.navSectionHeader}>SYSTEM</div>
                            {renderNavItem('admin', <Shield size={20} />, 'Control Panel')}
                            {renderNavItem('orders', <ListOrdered size={20} />, 'Master Orders')}
                        </>
                    )}

                    <div style={styles.navSectionHeader}>RETAIL</div>
                    <div onClick={() => navigate('/')} style={styles.navItem}><Store size={20} /> <span>Storefront</span></div>
                </nav>
                <button onClick={handleLogout} style={styles.logoutBtn}><LogOut size={18} /> <span>LOGOUT</span></button>
            </aside>

            <main style={styles.main}>
                <header style={styles.header}>
                    <div>
                        <h2 style={styles.welcomeHeading}>Welcome, {currentUser?.username}</h2>
                        <div style={{display: 'flex', alignItems: 'center', gap: '8px', marginTop: '5px'}}>
                            <div style={styles.roleBadge}>{currentUser?.role?.toUpperCase()}</div>
                            {currentUser?.is_verified && <CheckCircle size={16} color="#10b981" />}
                        </div>
                    </div>
                    <div style={styles.userInfo}><User size={16} /> <span>{currentUser?.email}</span></div>
                </header>

                <div style={styles.body}>
                    <AnimatePresence mode="wait">
                        <motion.div key={activeTab + adminView} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            {activeTab === 'overview' && (
                                currentUser?.role?.toLowerCase() === 'vendor' ? <ProductList /> : (
                                    <div style={styles.premiumBanner}>
                                        <Sparkles size={40} color="#fff" style={{marginBottom: '15px'}} />
                                        <h3 style={{fontSize: '32px', margin: '0 0 10px 0'}}>Premium Marketplace</h3>
                                        <button onClick={() => navigate('/')} style={styles.premiumShopBtn}>EXPLORE STORE</button>
                                    </div>
                                )
                            )}
                            {activeTab === 'profile' && <Profile />}
                            
                            {activeTab === 'orders' && (
                                <div style={styles.ordersGrid}>
                                    <h3 style={{fontSize: '24px', fontWeight: '900', marginBottom: '20px'}}>
                                        {currentUser?.role === 'vendor' ? 'Sales History' : currentUser?.role === 'admin' ? 'System Master Orders' : 'Orders & Tracking'}
                                    </h3>
                                    {ordersList.length === 0 ? <div style={styles.noData}>No data available.</div> : ordersList.map(o => <OrderStatus key={o.id || o.order_id} order={o} role={currentUser?.role} />)}
                                </div>
                            )}

                            {activeTab === 'admin' && (
                                <div style={styles.adminGrid}>
                                    {adminView === 'stats' ? (
                                        <>
                                            <div style={styles.statCard} onClick={() => setAdminView('users')}><Users size={40} color="#4f46e5"/><div style={{marginTop: '10px', fontWeight: '800'}}>USERS</div></div>
                                            <div style={styles.statCard} onClick={() => setAdminView('products')}><Package size={40} color="#10b981"/><div style={{marginTop: '10px', fontWeight: '800'}}>PRODUCTS</div></div>
                                        </>
                                    ) : (
                                        <div style={{width: '100%'}}>
                                            <button onClick={() => setAdminView('stats')} style={styles.backBtn}><ArrowLeft size={16}/> BACK</button>
                                            {adminView === 'users' && <AdminUserList />}
                                            {adminView === 'products' && <AdminProductList />}
                                        </div>
                                    )}
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </main>
        </div>
    );
};

// ... ALL STYLES REMAIN EXACTLY THE SAME AS YOUR PREVIOUS FILE ...
const styles = {
    dashboard: { display: 'flex', minHeight: '100vh', background: '#f1f5f9', fontFamily: "'Inter', sans-serif" },
    sidebar: { width: '260px', background: '#0f172a', padding: '30px 20px', position: 'fixed', height: '100vh', display: 'flex', flexDirection: 'column', color: '#fff', boxSizing: 'border-box' },
    logoSection: { marginBottom: '30px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '20px' },
    logo: { fontSize: '24px', fontWeight: '900', margin: 0 },
    nav: { display: 'flex', flexDirection: 'column', gap: '5px' },
    navItem: { display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 15px', borderRadius: '8px', cursor: 'pointer', color: '#94a3b8', transition: '0.2s' },
    activeNavItem: { display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 15px', borderRadius: '8px', cursor: 'pointer', background: '#2874f0', color: '#fff', fontWeight: '700' },
    navSectionHeader: { marginTop: '20px', marginBottom: '10px', fontSize: '10px', fontWeight: '800', color: '#475569', letterSpacing: '1px' },
    logoutBtn: { marginTop: 'auto', background: '#e11d48', border: 'none', color: '#fff', padding: '12px', borderRadius: '8px', fontWeight: '800', cursor: 'pointer', fontSize: '12px' },
    main: { flex: 1, marginLeft: '260px', background: '#f8fafc' },
    header: { padding: '20px 40px', background: '#fff', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    welcomeHeading: { margin: 0, fontSize: '22px', fontWeight: '900', color: '#0f172a' },
    roleBadge: { background: '#f1f5f9', color: '#2874f0', padding: '4px 10px', borderRadius: '4px', fontSize: '10px', fontWeight: '900', border: '1px solid #e2e8f0', display: 'inline-block' },
    userInfo: { display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#64748b', fontWeight: '600' },
    body: { padding: '40px' },
    premiumBanner: { background: 'linear-gradient(135deg, #2874f0 0%, #7c3aed 100%)', padding: '60px 40px', borderRadius: '16px', color: '#fff', textAlign: 'center' },
    premiumShopBtn: { background: '#fff', color: '#2874f0', border: 'none', padding: '12px 30px', borderRadius: '8px', fontWeight: '900', cursor: 'pointer', fontSize: '14px' },
    statusBox: { background: '#fff', padding: '25px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '20px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' },
    progressBar: { background: '#f1f5f9', height: '10px', borderRadius: '10px', marginTop: '15px', overflow: 'hidden' },
    badgeSuccess: { background: '#dcfce7', color: '#166534', padding: '4px 12px', borderRadius: '20px', fontSize: '10px', fontWeight: '800' },
    badgeInfo: { background: '#e0e7ff', color: '#2874f0', padding: '4px 12px', borderRadius: '20px', fontSize: '10px', fontWeight: '800' },
    reviewBtn: { background: '#2874f0', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '6px', fontWeight: '800', cursor: 'pointer', fontSize: '11px', marginTop: '10px' },
    reviewedBox: { marginTop: '15px', padding: '15px', background: '#f0f9ff', borderRadius: '8px', border: '1px solid #bae6fd' },
    reviewForm: { marginTop: '20px', background: '#eff6ff', padding: '25px', borderRadius: '12px', border: '2px solid #bfdbfe' },
    reviewLabel: { fontSize: '13px', fontWeight: '800', color: '#1e3a8a', marginBottom: '10px', display: 'block' },
    select: { width: '100%', padding: '12px', borderRadius: '8px', border: '2px solid #93c5fd', marginBottom: '20px', color: '#1e293b', background: '#ffffff', fontSize: '14px', fontWeight: '600', outline: 'none' },
    textarea: { width: '100%', height: '100px', padding: '12px', borderRadius: '8px', border: '2px solid #93c5fd', marginBottom: '20px', resize: 'none', color: '#1e293b', background: '#ffffff', fontSize: '14px', fontWeight: '500', outline: 'none' },
    submitReviewBtn: { background: '#26a541', color: '#fff', border: 'none', padding: '12px 25px', borderRadius: '8px', fontWeight: '900', cursor: 'pointer', fontSize: '13px' },
    cancelBtn: { background: '#94a3b8', color: '#fff', border: 'none', padding: '12px 25px', borderRadius: '8px', fontWeight: '800', cursor: 'pointer', marginLeft: '10px', fontSize: '13px' },
    adminGrid: { display: 'flex', gap: '20px' },
    statCard: { flex: 1, background: '#fff', padding: '40px', borderRadius: '16px', textAlign: 'center', cursor: 'pointer', border: '1px solid #e2e8f0' },
    backBtn: { background: 'none', border: 'none', color: '#2874f0', fontWeight: '900', cursor: 'pointer', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '5px' },
    noData: { textAlign: 'center', padding: '40px', color: '#64748b', fontWeight: 'bold' },
    ordersGrid: { display: 'flex', flexDirection: 'column', gap: '10px' }
};

export default Dashboard;