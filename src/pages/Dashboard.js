import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import { 
    ShoppingBag, PlusCircle, History, Store,
    Shield, User, Users, ArrowLeft, 
    Star, Sparkles, Package, Home, ListOrdered, BarChart3, IndianRupee
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
            <div style={styles.orderHeader}>
                <img src={getProductImg(order.image_url)} alt="product" style={styles.orderImg} />
                <div style={{flex: 1}}>
                    <h4 style={styles.orderTitle}>Order #{order.order_id || order.id}</h4>
                    <div style={styles.orderSub}>
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
                <motion.div initial={{ width: 0 }} animate={{ width: isDelivered ? '100%' : '50%' }}
                    transition={{ duration: 1.2 }} style={{ background: isDelivered ? '#10b981' : '#2874f0', height: '100%', borderRadius: '8px' }}
                />
            </div>
            {isDelivered && role === 'customer' && (
                <div style={{marginTop: '15px'}}>
                    <AnimatePresence mode="wait">
                        {isReviewed ? (
                            <motion.div layout style={styles.reviewedBox}>
                                <div style={styles.reviewLabelRow}><Star size={16} fill="#2874f0"/> Rating: {rating}/5</div>
                                {comment && <div style={styles.reviewText}>"{comment}"</div>}
                            </motion.div>
                        ) : !showReviewForm ? (
                            <button onClick={() => setShowReviewForm(true)} style={styles.reviewBtn}>RATE PRODUCT</button>
                        ) : (
                            <motion.div layout style={styles.reviewForm}>
                                <select value={rating} onChange={(e) => setRating(e.target.value)} style={styles.select}>
                                    {[5,4,3,2,1].map(num => <option key={num} value={num}>{num} Stars</option>)}
                                </select>
                                <textarea placeholder="Feedback..." value={comment} onChange={(e) => setComment(e.target.value)} style={styles.textarea} />
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
            try {
                const userRes = await axios.get('https://bhavyams-vendorhub-backend.onrender.com/api/auth/me', { headers: { Authorization: `Bearer ${token}` } });
                setCurrentUser(userRes.data);

                if (activeTab === 'overview' && userRes.data.role === 'vendor') {
                    const statsRes = await axios.get('https://bhavyams-vendorhub-backend.onrender.com/api/products/vendor/stats', { headers: { Authorization: `Bearer ${token}` } });
                    setVendorStats(statsRes.data);
                }

                if (activeTab === 'orders') {
                    let url = userRes.data.role === 'customer' ? '/api/orders/my-orders' : 
                              userRes.data.role === 'vendor' ? '/api/orders/my-sales' : '/api/orders/admin-all';
                    const res = await axios.get(`https://bhavyams-vendorhub-backend.onrender.com${url}`, { headers: { Authorization: `Bearer ${token}` } });
                    setOrdersList(res.data);
                }
            } catch (err) { console.error(err); }
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
                        {currentUser?.role === 'customer' && <div onClick={() => setActiveTab('orders')} style={activeTab === 'orders' ? styles.activeNavItem : styles.navItem}><History size={20}/> Orders</div>}
                        {currentUser?.role === 'vendor' && (
                            <>
                                <div style={styles.navSectionHeader}>VENDOR</div>
                                <div onClick={() => navigate('/add-product')} style={styles.navItem}><PlusCircle size={20}/> Add Item</div>
                                <div onClick={() => setActiveTab('orders')} style={activeTab === 'orders' ? styles.activeNavItem : styles.navItem}><ShoppingBag size={20}/> Sales</div>
                            </>
                        )}
                        {currentUser?.role === 'admin' && (
                            <>
                                <div style={styles.navSectionHeader}>ADMIN</div>
                                <div onClick={() => setActiveTab('admin')} style={activeTab === 'admin' ? styles.activeNavItem : styles.navItem}><Shield size={20}/> Control</div>
                                <div onClick={() => setActiveTab('orders')} style={activeTab === 'orders' ? styles.activeNavItem : styles.navItem}><ListOrdered size={20}/> Master</div>
                            </>
                        )}
                    </nav>
                    <button onClick={handleLogout} style={styles.logoutBtn}>LOGOUT</button>
                </aside>
            )}

            {isMobile && (
                <div style={styles.mobileBottomNav}>
                    <div onClick={() => setActiveTab('overview')} style={activeTab === 'overview' ? styles.mobileActiveTab : styles.mobileTab}><Home size={22}/></div>
                    <div onClick={() => setActiveTab('orders')} style={activeTab === 'orders' ? styles.mobileActiveTab : styles.mobileTab}><ShoppingBag size={22}/></div>
                    <div onClick={() => setActiveTab('profile')} style={activeTab === 'profile' ? styles.mobileActiveTab : styles.mobileTab}><User size={22}/></div>
                </div>
            )}

            <main style={{...styles.main, marginLeft: isMobile ? 0 : '260px', paddingBottom: isMobile ? '80px' : '40px'}}>
                <header style={styles.header}>
                    <div>
                        <h2 style={styles.welcomeHeading}>Hi, {currentUser?.username.split(' ')[0]}</h2>
                        <div style={styles.roleBadge}>{currentUser?.role?.toUpperCase()}</div>
                    </div>
                    <Store onClick={() => navigate('/')} size={24} color="#2874f0" style={{cursor: 'pointer'}}/>
                </header>

                <div style={styles.body}>
                    <AnimatePresence mode="wait">
                        <motion.div key={activeTab + adminView} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                            {activeTab === 'overview' && (
                                currentUser?.role === 'vendor' ? (
                                    <div style={styles.vendorStatsGrid}>
                                        <div style={styles.statCard}><IndianRupee size={20}/><div style={styles.statLabel}>Revenue</div><div style={styles.statValue}>₹{vendorStats.revenue}</div></div>
                                        <div style={styles.statCard}><ShoppingBag size={20}/><div style={styles.statLabel}>Orders</div><div style={styles.statValue}>{vendorStats.orders}</div></div>
                                        <div style={styles.statCard}><Package size={20}/><div style={styles.statLabel}>Items</div><div style={styles.statValue}>{vendorStats.products}</div></div>
                                        <div style={{gridColumn: isMobile ? 'span 1' : 'span 3'}}><ProductList /></div>
                                    </div>
                                ) : currentUser?.role === 'admin' ? (
                                    <div style={styles.adminStatsGrid}>
                                        <div style={styles.statCard} onClick={() => {setActiveTab('admin'); setAdminView('users')}}><Users size={32}/> USERS</div>
                                        <div style={styles.statCard} onClick={() => {setActiveTab('admin'); setAdminView('products')}}><Package size={32}/> PRODUCTS</div>
                                        <div style={styles.statCard} onClick={() => {setActiveTab('admin'); setAdminView('payments')}}><BarChart3 size={32}/> PAYMENTS</div>
                                    </div>
                                ) : (
                                    <div style={styles.premiumBanner}>
                                        <Sparkles size={32} /><h3 style={{margin: '15px 0'}}>Premium Goods</h3>
                                        <button onClick={() => navigate('/')} style={styles.premiumShopBtn}>GO TO STORE</button>
                                    </div>
                                )
                            )}

                            {activeTab === 'profile' && <Profile />}
                            
                            {activeTab === 'orders' && (
                                <div style={styles.ordersGrid}>
                                    <h3 style={styles.sectionTitle}>History</h3>
                                    {ordersList.length === 0 ? <div style={styles.noData}>Empty</div> : ordersList.map(o => <OrderStatus key={o.id} order={o} role={currentUser?.role} />)}
                                </div>
                            )}

                            {activeTab === 'admin' && (
                                <div>
                                    {adminView !== 'stats' && <button onClick={() => setAdminView('stats')} style={styles.backBtn}><ArrowLeft size={16}/> Back</button>}
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
    dashboard: { display: 'flex', minHeight: '100vh', background: '#f8fafc' },
    sidebar: { width: '260px', background: '#0f172a', padding: '30px 20px', position: 'fixed', height: '100vh', color: '#fff', zIndex: 100 },
    logoSection: { marginBottom: '30px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '15px' },
    logo: { fontSize: '20px', fontWeight: '900', margin: 0, color: '#fff' },
    nav: { display: 'flex', flexDirection: 'column', gap: '8px' },
    navItem: { display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 15px', borderRadius: '8px', cursor: 'pointer', color: '#94a3b8', fontSize: '14px' },
    activeNavItem: { display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 15px', borderRadius: '8px', cursor: 'pointer', background: '#2874f0', color: '#fff', fontWeight: '700' },
    navSectionHeader: { marginTop: '20px', fontSize: '10px', color: '#475569', letterSpacing: '1.5px' },
    logoutBtn: { marginTop: 'auto', background: '#e11d48', border: 'none', color: '#fff', padding: '12px', borderRadius: '8px', cursor: 'pointer' },
    mobileBottomNav: { position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', height: '65px', display: 'flex', justifyContent: 'space-around', alignItems: 'center', boxShadow: '0 -2px 10px rgba(0,0,0,0.1)', zIndex: 1000 },
    mobileTab: { color: '#64748b' },
    mobileActiveTab: { color: '#2874f0' },
    main: { flex: 1, background: '#f8fafc' },
    header: { padding: '15px 25px', background: '#fff', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    welcomeHeading: { margin: 0, fontSize: '18px', fontWeight: '900' },
    roleBadge: { background: '#f1f5f9', color: '#2874f0', padding: '3px 8px', borderRadius: '4px', fontSize: '9px', fontWeight: '900', marginTop: '4px', display: 'inline-block' },
    body: { padding: '20px' },
    premiumBanner: { background: 'linear-gradient(135deg, #2874f0 0%, #7c3aed 100%)', padding: '40px 20px', borderRadius: '16px', color: '#fff', textAlign: 'center' },
    premiumShopBtn: { background: '#fff', color: '#2874f0', border: 'none', padding: '10px 25px', borderRadius: '6px', fontWeight: '900' },
    vendorStatsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '15px' },
    statCard: { background: '#fff', padding: '20px', borderRadius: '12px', textAlign: 'center', border: '1px solid #e2e8f0', cursor: 'pointer' },
    statLabel: { fontSize: '11px', color: '#64748b', fontWeight: '700', marginTop: '10px' },
    statValue: { fontSize: '18px', fontWeight: '900', color: '#0f172a' },
    statusBox: { background: '#fff', padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '15px' },
    orderHeader: { display: 'flex', gap: '12px', alignItems: 'center' },
    orderImg: { width: '50px', height: '50px', borderRadius: '6px', objectFit: 'cover' },
    orderTitle: { margin: 0, fontSize: '14px', fontWeight: '800' },
    orderSub: { fontSize: '11px', color: '#64748b' },
    progressBar: { background: '#f1f5f9', height: '6px', borderRadius: '10px', marginTop: '12px', overflow: 'hidden' },
    badgeSuccess: { background: '#dcfce7', color: '#166534', padding: '3px 10px', borderRadius: '10px', fontSize: '9px', fontWeight: '800' },
    badgeInfo: { background: '#e0e7ff', color: '#2874f0', padding: '3px 10px', borderRadius: '10px', fontSize: '9px', fontWeight: '800' },
    reviewBtn: { background: '#2874f0', color: '#fff', border: 'none', padding: '8px 15px', borderRadius: '5px', fontWeight: '800', fontSize: '10px' },
    reviewForm: { background: '#eff6ff', padding: '15px', borderRadius: '8px', marginTop: '10px' },
    select: { width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #bfdbfe', marginBottom: '10px' },
    textarea: { width: '100%', height: '80px', padding: '10px', borderRadius: '6px', border: '1px solid #bfdbfe', marginBottom: '10px' },
    submitReviewBtn: { background: '#26a541', color: '#fff', border: 'none', padding: '8px 15px', borderRadius: '5px', fontWeight: '800' },
    cancelBtn: { background: '#94a3b8', color: '#fff', border: 'none', padding: '8px 15px', borderRadius: '5px' },
    sectionTitle: { fontSize: '18px', fontWeight: '900', margin: '20px 0 15px 0' },
    adminStatsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '15px' },
    backBtn: { background: 'none', border: 'none', color: '#2874f0', fontWeight: '800', cursor: 'pointer', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '5px' },
    noData: { textAlign: 'center', padding: '30px', color: '#64748b', fontSize: '13px' },
    ordersGrid: { display: 'flex', flexDirection: 'column' },
    reviewedBox: { marginTop: '10px', padding: '10px', background: '#f8fafc', borderRadius: '8px' },
    reviewLabelRow: { fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' },
    reviewText: { fontSize: '12px', color: '#475569', marginTop: '5px', fontStyle: 'italic' }
};

export default Dashboard;