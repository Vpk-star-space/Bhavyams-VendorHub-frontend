import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import { 
    ShoppingBag, PlusCircle, History, Store, LogOut,
    Shield, User, Users, ArrowLeft,  
    Star, Sparkles, Package, Home, ListOrdered, BarChart3, IndianRupee,
    AlertTriangle // 🚀 ADDED: For the Test Mode Warning
} from 'lucide-react';

import ProductList from '../components/ProductList';
import AdminUserList from '../components/AdminUserList';
import AdminProductList from '../components/AdminProductList';
import AdminPaymentList from '../components/AdminPaymentList'; 
import Profile from './Profile'; 

const OrderStatus = ({ order, role }) => {
    const [showReviewForm, setShowReviewForm] = useState(false);
    const [rating, setRating] = useState(order.existing_rating || 5);
    const [comment, setComment] = useState(order.existing_comment || "");
    const [isReviewed, setIsReviewed] = useState(!!order.existing_rating); 
    const isDelivered = order.status === 'Delivered';

    const getProductImg = (url) => {
        if (!url) return 'https://via.placeholder.com/150?text=No+Image';
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
            
            {/* 📦 UPGRADED ORDER CARD HEADER */}
            <div style={styles.orderTopStrip}>
                <div style={styles.orderIdBlock}>
                    <span style={styles.orderLabel}>ORDER ID</span>
                    <span style={styles.orderValue}>#{order.order_id || order.id}</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <span style={isDelivered ? styles.badgeSuccess : styles.badgeInfo}>
                        {order.status?.toUpperCase() || 'CONFIRMED'}
                    </span>
                </div>
            </div>

            <div style={styles.orderHeader}>
                <div style={styles.imageWrapper}>
                    <img src={getProductImg(order.image_url)} alt="product" style={styles.orderImg} />
                </div>
                <div style={{flex: 1}}>
                    <h4 style={styles.orderTitle}>{order.product_name || "Bhavyams Product"}</h4>
                    <div style={styles.orderSub}>
                        {role?.toLowerCase() === 'admin' && `Customer: ${order.customer_name}`}
                        {role?.toLowerCase() === 'vendor' && `Revenue: ₹${Number(order.total_price).toLocaleString('en-IN')}`}
                        {role?.toLowerCase() === 'customer' && `Total: ₹${Number(order.total_price).toLocaleString('en-IN')}`}
                    </div>
                </div>
            </div>

            {/* 🔵 PROGRESS BAR */}
            <div style={{ padding: '0 15px 15px 15px' }}>
                <div style={styles.progressBar}>
                    <motion.div initial={{ width: 0 }} animate={{ width: isDelivered ? '100%' : '50%' }}
                        transition={{ duration: 1.2 }} style={{ background: isDelivered ? '#26a541' : '#2874f0', height: '100%', borderRadius: '8px' }}
                    />
                </div>
                <p style={styles.progressText}>
                    {isDelivered ? 'Item has been delivered successfully.' : 'Order is confirmed and preparing for dispatch.'}
                </p>
            </div>

            {isDelivered && role?.toLowerCase() === 'customer' && (
                <div style={styles.reviewSection}>
                    <AnimatePresence mode="wait">
                        {isReviewed ? (
                            <motion.div layout style={styles.reviewedBox}>
                                <div style={styles.reviewLabelRow}><Star size={16} fill="#2874f0" color="#2874f0"/> Rating: {rating}/5</div>
                                {comment && <div style={styles.reviewText}>"{comment}"</div>}
                            </motion.div>
                        ) : !showReviewForm ? (
                            <button onClick={() => setShowReviewForm(true)} style={styles.reviewBtn}>★ RATE & REVIEW PRODUCT</button>
                        ) : (
                            <motion.div layout style={styles.reviewForm}>
                                <select value={rating} onChange={(e) => setRating(e.target.value)} style={styles.select}>
                                    {[5,4,3,2,1].map(num => <option key={num} value={num}>{num} Stars - {num === 5 ? 'Excellent' : num === 1 ? 'Poor' : 'Good'}</option>)}
                                </select>
                                <textarea placeholder="Write a review..." value={comment} onChange={(e) => setComment(e.target.value)} style={styles.textarea} />
                                <div style={{display:'flex', gap:'10px'}}>
                                    <button onClick={submitReview} style={styles.submitReviewBtn}>SUBMIT</button>
                                    <button onClick={() => setShowReviewForm(false)} style={styles.cancelBtn}>CANCEL</button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}
        </motion.div>
    );
};

const Dashboard = () => {
    const [activeTab, setActiveTab] = useState('overview');
    const [adminView, setAdminView] = useState('stats'); 
    const [currentUser, setCurrentUser] = useState(JSON.parse(localStorage.getItem('user')));
    const [ordersList, setOrdersList] = useState([]);
    const [vendorStats, setVendorStats] = useState({ revenue: 0, orders: 0, products: 0 });
    const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
    const navigate = useNavigate();

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 1024);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            const token = localStorage.getItem('token');
            if (!token) return navigate('/login');
            
            const headers = { Authorization: `Bearer ${token}` };

            try {
                const userRes = await axios.get('https://bhavyams-vendorhub-backend.onrender.com/api/auth/me', { headers });
                const user = userRes.data;
                setCurrentUser(user);

                const ordersUrl = user.role?.toLowerCase() === 'vendor' 
                    ? 'https://bhavyams-vendorhub-backend.onrender.com/api/orders/my-sales' 
                    : 'https://bhavyams-vendorhub-backend.onrender.com/api/orders/my-orders';
                
                const ordersRes = await axios.get(ordersUrl, { headers });
                setOrdersList(ordersRes.data);

                if (user.role?.toLowerCase() === 'vendor') {
                    const statsRes = await axios.get('https://bhavyams-vendorhub-backend.onrender.com/api/products/vendor/stats', { headers });
                    setVendorStats(statsRes.data);
                }
            } catch (err) { 
                console.error("Dashboard error:", err);
                if (err.response?.status === 401) {
                    localStorage.clear();
                    navigate('/login');
                }
            }
        };
        fetchData();
    }, [activeTab, navigate]);

    const handleLogout = () => { localStorage.clear(); navigate('/login'); };

    return (
        <div style={styles.dashboard}>
            {!isMobile && (
                <aside style={styles.sidebar}>
                    <div style={styles.logoSection}><h2 style={styles.logo}>Bhavyams</h2><h2 style={styles.logo}>Hub</h2></div>
                    <nav style={styles.nav}>
                        <div onClick={() => setActiveTab('overview')} style={activeTab === 'overview' ? styles.activeNavItem : styles.navItem}><Home size={20}/> Home</div>
                        <div onClick={() => setActiveTab('profile')} style={activeTab === 'profile' ? styles.activeNavItem : styles.navItem}><User size={20}/> Profile</div>
                        
                        {currentUser?.role?.toLowerCase() === 'customer' && <div onClick={() => setActiveTab('orders')} style={activeTab === 'orders' ? styles.activeNavItem : styles.navItem}><History size={20}/> My Orders</div>}
                        
                        {currentUser?.role?.toLowerCase() === 'vendor' && (
                            <>
                                <div style={styles.navSectionHeader}>VENDOR</div>
                                <div onClick={() => navigate('/add-product')} style={styles.navItem}><PlusCircle size={20}/> Add Item</div>
                                <div onClick={() => setActiveTab('orders')} style={activeTab === 'orders' ? styles.activeNavItem : styles.navItem}><ShoppingBag size={20}/> Sales</div>
                            </>
                        )}

                        {currentUser?.role?.toLowerCase() === 'admin' && (
                            <>
                                <div style={styles.navSectionHeader}>ADMIN</div>
                                <div onClick={() => setActiveTab('admin')} style={activeTab === 'admin' ? styles.activeNavItem : styles.navItem}>
                                    <Shield size={20}/> Control
                                </div>
                                <div onClick={() => setActiveTab('orders')} style={activeTab === 'orders' ? styles.activeNavItem : styles.navItem}>
                                    <ListOrdered size={20}/> Master
                                </div>
                            </>
                        )}
                    </nav>
                    <button onClick={handleLogout} style={styles.logoutBtn}><LogOut size={18}/> LOGOUT</button>
                </aside>
            )}

            {isMobile && (
                <div style={styles.mobileBottomNav}>
                    <div onClick={() => setActiveTab('overview')} style={activeTab === 'overview' ? styles.mobileActiveTab : styles.mobileTab}>
                        <Home size={22}/>
                    </div>
                    <div onClick={() => setActiveTab('orders')} style={activeTab === 'orders' ? styles.mobileActiveTab : styles.mobileTab}>
                        <ShoppingBag size={22}/>
                    </div>
                    {currentUser?.role?.toLowerCase() === 'vendor' && (
                        <div onClick={() => navigate('/add-product')} style={styles.mobileTab}>
                            <PlusCircle size={28} color="#fb641b" strokeWidth={3} />
                        </div>
                    )}
                    <div onClick={() => setActiveTab('profile')} style={activeTab === 'profile' ? styles.mobileActiveTab : styles.mobileTab}>
                        <User size={22}/>
                    </div>
                    <div onClick={handleLogout} style={styles.mobileTab}>
                        <LogOut size={22} color="#ef4444"/>
                    </div>
                </div>
            )}

            <main style={{...styles.main, marginLeft: isMobile ? 0 : '260px', paddingBottom: isMobile ? '80px' : '40px'}}>
                
                {/* 🚨 TEST MODE WARNING ALERT 🚨 */}
                <div style={styles.testModeAlert}>
                    <AlertTriangle size={20} style={{ minWidth: '20px' }} />
                    <span style={{ fontSize: '13px', fontWeight: '600' }}>
                        <strong>TEST MODE:</strong> Payments are simulated. Do NOT use real credit card details or UPI pins.
                    </span>
                </div>

                <header style={styles.header}>
                    <div>
                        <h2 style={styles.welcomeHeading}>Hi, {currentUser?.username?.split(' ')[0]}</h2>
                        <div style={styles.roleBadge}>{currentUser?.role?.toUpperCase()}</div>
                    </div>
                    <Store onClick={() => navigate('/')} size={24} color="#2874f0" style={{cursor: 'pointer'}}/>
                </header>

                <div style={styles.body}>
                    <AnimatePresence mode="wait">
                        <motion.div key={activeTab + adminView} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                            
                            {activeTab === 'overview' && (
                                currentUser?.role?.toLowerCase() === 'vendor' ? (
                                    <div style={styles.vendorStatsGrid}>
                                        <div style={styles.statCard}><IndianRupee size={20} color="#10b981"/><div style={styles.statLabel}>Revenue</div><div style={styles.statValue}>₹{vendorStats.revenue}</div></div>
                                        <div style={styles.statCard}><ShoppingBag size={20} color="#2874f0"/><div style={styles.statLabel}>Orders</div><div style={styles.statValue}>{vendorStats.orders}</div></div>
                                        <div style={styles.statCard}><Package size={20} color="#f59e0b"/><div style={styles.statLabel}>Inventory</div><div style={styles.statValue}>{vendorStats.products}</div></div>
                                        <div style={{gridColumn: isMobile ? 'span 1' : 'span 3', marginTop: '20px'}}><ProductList /></div>
                                    </div>
                                ) : currentUser?.role?.toLowerCase() === 'admin' ? (
                                    <div style={styles.adminStatsGrid}>
                                        <div style={styles.statCard} onClick={() => {setActiveTab('admin'); setAdminView('users')}}><Users size={32} color="#2874f0"/><br/>USERS</div>
                                        <div style={styles.statCard} onClick={() => {setActiveTab('admin'); setAdminView('products')}}><Package size={32} color="#10b981"/><br/>PRODUCTS</div>
                                        <div style={styles.statCard} onClick={() => {setActiveTab('admin'); setAdminView('payments')}}><BarChart3 size={32} color="#f59e0b"/><br/>PAYMENTS</div>
                                    </div>
                                ) : (
                                    // 🛍️ PREMIUM CUSTOMER BANNER
                                    <div style={styles.premiumBanner}>
                                        <div style={styles.bannerText}>
                                            <h2 style={{ margin: '0 0 10px 0', fontSize: '22px' }}>Welcome to Bhavyams Hub</h2>
                                            <p style={{ margin: '0 0 20px 0', fontSize: '14px', opacity: 0.9 }}>Get top-quality electronics and fashion delivered directly from verified vendors.</p>
                                            <button onClick={() => navigate('/')} style={styles.premiumShopBtn}>
                                                <ShoppingBag size={16} /> BROWSE STORE
                                            </button>
                                        </div>
                                        <div style={{ padding: '20px' }}>
                                            <Sparkles size={60} color="#ffe500" opacity={0.8} />
                                        </div>
                                    </div>
                                )
                            )}

                            {activeTab === 'profile' && <Profile />}
                            
                            {activeTab === 'orders' && (
                                <div style={styles.ordersGrid}>
                                    <h3 style={styles.sectionTitle}>{currentUser?.role?.toLowerCase() === 'vendor' ? 'Sales History' : 'Your Orders'}</h3>
                                    {ordersList.length === 0 ? <div style={styles.noData}>No records found.</div> : ordersList.map(o => <OrderStatus key={o.id} order={o} role={currentUser?.role} />)}
                                </div>
                            )}

                            {activeTab === 'admin' && (
                                <div>
                                    {adminView !== 'stats' && <button onClick={() => setAdminView('stats')} style={styles.backBtn}><ArrowLeft size={16}/> Back to Stats</button>}
                                    {adminView === 'users' && <AdminUserList />}
                                    {adminView === 'products' && <AdminProductList />}
                                    {adminView === 'payments' && <AdminPaymentList />}
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </main>
        </div>
    );
};

const styles = {
    dashboard: { display: 'flex', minHeight: '100vh', background: '#f1f3f6', fontFamily: 'Roboto, Arial, sans-serif' },
    
    // 🚨 TEST MODE ALERT
    testModeAlert: { background: '#fee2e2', color: '#b91c1c', padding: '10px 15px', display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid #fca5a5' },
    
    sidebar: { width: '260px', background: '#0f172a', padding: '30px 20px', position: 'fixed', height: '100vh', color: '#fff', zIndex: 100 },
    logoSection: { marginBottom: '30px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '15px' },
    logo: { fontSize: '20px', fontStyle: 'italic', fontWeight: 'bold', margin: 0, color: '#fff' },
    nav: { display: 'flex', flexDirection: 'column', gap: '8px' },
    navItem: { display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 15px', borderRadius: '8px', cursor: 'pointer', color: '#94a3b8', fontSize: '14px', fontWeight: '500' },
    activeNavItem: { display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 15px', borderRadius: '8px', cursor: 'pointer', background: '#2874f0', color: '#fff', fontWeight: '700' },
    navSectionHeader: { marginTop: '20px', fontSize: '10px', color: '#475569', letterSpacing: '1.5px', fontWeight: '800' },
    logoutBtn: { marginTop: 'auto', background: '#ef4444', border: 'none', color: '#fff', padding: '12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' },
    mobileBottomNav: { position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', height: '65px', display: 'flex', justifyContent: 'space-around', alignItems: 'center', boxShadow: '0 -2px 10px rgba(0,0,0,0.1)', zIndex: 1000 },
    mobileTab: { color: '#64748b', cursor: 'pointer' },
    mobileActiveTab: { color: '#2874f0', cursor: 'pointer' },
    main: { flex: 1, background: '#f1f3f6' },
    header: { padding: '15px 20px', background: '#fff', borderBottom: '1px solid #e0e0e0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    welcomeHeading: { margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#212121' },
    roleBadge: { background: '#e0e7ff', color: '#2874f0', padding: '3px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold', marginTop: '4px', display: 'inline-block', letterSpacing: '0.5px' },
    body: { padding: '15px' },
    
    // 🛍️ UPGRADED PREMIUM BANNER
    premiumBanner: { background: 'linear-gradient(135deg, #2874f0 0%, #1e40af 100%)', padding: '30px', borderRadius: '8px', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' },
    bannerText: { flex: 1 },
    premiumShopBtn: { background: '#fff', color: '#2874f0', border: 'none', padding: '10px 20px', borderRadius: '2px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' },
    
    vendorStatsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '15px' },
    statCard: { background: '#fff', padding: '20px', borderRadius: '8px', textAlign: 'center', border: '1px solid #e0e0e0', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' },
    statLabel: { fontSize: '11px', color: '#878787', fontWeight: 'bold', marginTop: '10px', letterSpacing: '0.5px' },
    statValue: { fontSize: '20px', fontWeight: 'bold', color: '#212121', marginTop: '5px' },
    
    // 📦 UPGRADED ORDER CARD
    statusBox: { background: '#fff', borderRadius: '4px', border: '1px solid #e0e0e0', marginBottom: '15px', overflow: 'hidden', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' },
    orderTopStrip: { background: '#f8fafc', padding: '12px 15px', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e0e0e0', fontSize: '12px' },
    orderIdBlock: { display: 'flex', flexDirection: 'column', gap: '2px' },
    orderLabel: { color: '#878787', fontWeight: '500', fontSize: '10px', letterSpacing: '0.5px' },
    orderValue: { color: '#212121', fontWeight: 'bold' },
    orderHeader: { display: 'flex', gap: '15px', alignItems: 'center', padding: '15px' },
    imageWrapper: { width: '70px', height: '70px', background: '#f1f3f6', borderRadius: '4px', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '5px' },
    orderImg: { maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' },
    orderTitle: { margin: '0 0 5px 0', fontSize: '15px', fontWeight: '500', color: '#212121' },
    orderSub: { fontSize: '13px', color: '#878787', fontWeight: '500' },
    progressBar: { background: '#f1f3f6', height: '6px', borderRadius: '10px', overflow: 'hidden' },
    progressText: { fontSize: '11px', color: '#388e3c', fontWeight: 'bold', marginTop: '8px', margin: '8px 0 0 0' },
    
    badgeSuccess: { background: '#388e3c', color: '#fff', padding: '4px 10px', borderRadius: '2px', fontSize: '10px', fontWeight: 'bold', letterSpacing: '0.5px' },
    badgeInfo: { background: '#2874f0', color: '#fff', padding: '4px 10px', borderRadius: '2px', fontSize: '10px', fontWeight: 'bold', letterSpacing: '0.5px' },
    
    reviewSection: { padding: '15px', borderTop: '1px solid #f0f0f0', background: '#fafafa' },
    reviewBtn: { background: '#fff', color: '#2874f0', border: '1px solid #2874f0', padding: '8px 15px', borderRadius: '2px', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer', width: '100%' },
    reviewForm: { background: '#fff', padding: '15px', borderRadius: '4px', border: '1px solid #e0e0e0' },
    select: { width: '100%', padding: '10px', borderRadius: '2px', border: '1px solid #e0e0e0', marginBottom: '10px', outline: 'none' },
    textarea: { width: '100%', height: '80px', padding: '10px', borderRadius: '2px', border: '1px solid #e0e0e0', marginBottom: '10px', outline: 'none', fontFamily: 'inherit' },
    submitReviewBtn: { background: '#2874f0', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: '2px', fontWeight: 'bold', cursor: 'pointer', flex: 1 },
    cancelBtn: { background: '#fff', color: '#212121', border: '1px solid #e0e0e0', padding: '8px 20px', borderRadius: '2px', cursor: 'pointer', fontWeight: 'bold' },
    sectionTitle: { fontSize: '18px', fontWeight: 'bold', margin: '10px 0 15px 0', color: '#212121', borderBottom: '2px solid #e0e0e0', paddingBottom: '10px' },
    adminStatsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '15px' },
    backBtn: { background: 'none', border: 'none', color: '#2874f0', fontWeight: 'bold', cursor: 'pointer', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '5px' },
    noData: { textAlign: 'center', padding: '40px', color: '#878787', fontSize: '14px', background: '#fff', borderRadius: '4px', border: '1px solid #e0e0e0' },
    ordersGrid: { display: 'flex', flexDirection: 'column' },
    reviewedBox: { padding: '12px', background: '#fff', border: '1px solid #e0e0e0', borderRadius: '4px' },
    reviewLabelRow: { fontSize: '13px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px', color: '#212121' },
    reviewText: { fontSize: '13px', color: '#878787', marginTop: '8px', fontStyle: 'italic' }
};

export default Dashboard;