import React, { useEffect, useState, useCallback, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { DollarSign, Package, ShoppingBag, TrendingUp, ArrowLeft, FileText, Store } from 'lucide-react';
import ProductList from '../components/ProductList'; 
import { AppContext } from '../context/AppContext';

const getBackendUrl = () => {
    const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    return isLocal ? 'http://localhost:5000/api' : 'https://bhavyams-vendorhub-backend.onrender.com/api';
};

const dashboardTranslations = {
    en: {
        title: "Revenue & Inventory",
        live: "LIVE",
        rev: "COMPLETED REVENUE",
        ord: "TOTAL ORDERS",
        inv: "LIVE INVENTORY",
        manageCat: "Manage Your Catalog",
        subText: "View, edit, or delete your products and services below.",
        revHist: "Revenue History",
        emptyRev: "No completed orders yet. Complete an order to see revenue!",
        viewMyShop: "Open My Public Shop"
    },
    te: {
        title: "ఆదాయం & జాబితా",
        live: "లైవ్",
        rev: "పూర్తయిన ఆదాయం",
        ord: "మొత్తం ఆర్డర్‌లు",
        inv: "లైవ్ ఇన్వెంటరీ",
        manageCat: "మీ కేటలాగ్‌ను నిర్వహించండి",
        subText: "దిగువ మీ ఉత్పత్తులు మరియు సేవలను వీక్షించండి, సవరించండి లేదా తొలగించండి.",
        revHist: "ఆదాయ చరిత్ర",
        emptyRev: "ఇంకా పూర్తి చేసిన ఆర్డర్‌లు లేవు. ఆదాయాన్ని చూడటానికి ఆర్డర్‌ను పూర్తి చేయండి!",
        viewMyShop: "నా షాప్ ప్రొఫైల్ తెరవండి"
    }
};

const VendorDashboard = () => {
    const navigate = useNavigate();
    const { language } = useContext(AppContext);
    const lang = language === 'te' ? 'te' : 'en';
    const t = dashboardTranslations[lang];

    const [stats, setStats] = useState({ revenue: 0, orders: 0, products: 0 });
    const [myShopId, setMyShopId] = useState(null);
    const [completedOrders, setCompletedOrders] = useState([]); 
    const [loading, setLoading] = useState(true);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 1024);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const fetchData = useCallback(async () => {
        const token = localStorage.getItem('token');
        if (!token) return;
        try {
            const [statsRes, ordersRes, shopRes] = await Promise.allSettled([
                axios.get(`${getBackendUrl()}/orders/my-sales`, { headers: { Authorization: `Bearer ${token}` } }),
                axios.get(`${getBackendUrl()}/orders/vendor-orders`, { headers: { Authorization: `Bearer ${token}` } }),
                axios.get(`${getBackendUrl()}/shops/my-shop`, { headers: { Authorization: `Bearer ${token}` } })
            ]);

            if (statsRes.status === 'fulfilled' && statsRes.value.data.success) {
                setStats({
                    revenue: statsRes.value.data.revenue || 0,
                    orders: statsRes.value.data.orders || 0,
                    products: statsRes.value.data.products || 0
                });
            }

            if (ordersRes.status === 'fulfilled' && ordersRes.value.data.success) {
                const completed = ordersRes.value.data.orders.filter(o => o.status === 'Completed');
                setCompletedOrders(completed);
            }

            if (shopRes.status === 'fulfilled' && shopRes.value.data?.shop?.id) {
                setMyShopId(shopRes.value.data.shop.id);
            }
        } catch (err) {
            console.error("Dashboard error:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    if (loading) return <div style={styles.loader}>Loading...</div>;

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <button onClick={() => navigate('/')} style={styles.backBtn}>
                    <ArrowLeft size={22} color="#0f172a" />
                </button>
                <h2 style={styles.title}>{t.title}</h2>
                <div style={styles.liveBadge}><TrendingUp size={14}/> {t.live}</div>
            </div>

            {myShopId && (
                <div style={{ padding: '0 15px', marginBottom: '14px' }}>
                    <button onClick={() => navigate(`/shop/${myShopId}`)} style={{ width: '100%', background: 'linear-gradient(135deg, #0f172a, #1e3a8a)', color: '#facc15', border: 'none', padding: '12px', borderRadius: '12px', fontWeight: '900', fontSize: '13.5px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        <Store size={17} /> {t.viewMyShop}
                    </button>
                </div>
            )}

            <div style={styles.grid}>
                <div style={styles.statCard}>
                    <DollarSign color="#10b981" size={22} style={{marginBottom: '5px'}}/>
                    <p style={styles.statLabel}>{t.rev}</p>
                    <h3 style={styles.statValue}>₹{Number(stats.revenue).toLocaleString('en-IN')}</h3>
                </div>
                <div style={styles.statCard} onClick={() => navigate('/vendor/orders')}>
                    <ShoppingBag color="#3b82f6" size={22} style={{marginBottom: '5px'}}/>
                    <p style={styles.statLabel}>{t.ord}</p>
                    <h3 style={styles.statValue}>{stats.orders}</h3>
                </div>
                <div style={styles.statCard}>
                    <Package color="#f59e0b" size={22} style={{marginBottom: '5px'}}/>
                    <p style={styles.statLabel}>{t.inv}</p>
                    <h3 style={styles.statValue}>{stats.products}</h3>
                </div>
            </div>

            <div style={isMobile ? styles.contentStack : styles.contentSplit}>
                <div style={styles.leftCol}>
                    <h3 style={styles.sectionTitle}><Package size={18} /> {t.manageCat}</h3>
                    <p style={styles.subText}>{t.subText}</p>
                    <ProductList /> 
                </div>

                <div style={styles.rightCol}>
                    <h3 style={styles.sectionTitle}><FileText size={18} /> {t.revHist}</h3>
                    <div style={styles.revenueBox}>
                        {completedOrders.length === 0 ? (
                            <p style={styles.emptyText}>{t.emptyRev}</p>
                        ) : (
                            completedOrders.map((order, idx) => {
                                const date = new Date(order.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
                                return (
                                    <div key={order.id} style={{
                                        ...styles.revenueRow, 
                                        borderBottom: idx === completedOrders.length - 1 ? 'none' : '1px solid #e2e8f0'
                                    }}>
                                        <div style={{display: 'flex', flexDirection: 'column', gap: '2px'}}>
                                            <div style={styles.revenueOrderId}>Order #{order.id}</div>
                                            <div style={styles.revenueDate}>{date} • {order.customer_name}</div>
                                        </div>
                                        <div style={styles.revenueAmount}>+ ₹{order.total_amount}</div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>
            
            <div style={{height: '80px'}}></div> 
        </div>
    );
};

const styles = {
    container: { background: '#f8fafc', minHeight: '100vh', fontFamily: 'Inter, sans-serif', paddingBottom: '90px' },
    header: { background: '#ffffff', padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', marginBottom: '15px', position: 'sticky', top: 0, zIndex: 10 },
    backBtn: { background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0 },
    title: { fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: 0, flex: 1, textAlign: 'center' },
    liveBadge: { background: '#dcfce7', color: '#166534', padding: '4px 8px', borderRadius: '8px', fontSize: '10px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '4px' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', padding: '0 15px', marginBottom: '20px' },
    statCard: { background: '#fff', padding: '15px 8px', borderRadius: '14px', display: 'flex', flexDirection: 'column', alignItems: 'center', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', cursor: 'pointer' },
    statLabel: { fontSize: '9.5px', fontWeight: '800', color: '#64748b', margin: '5px 0', textAlign: 'center' },
    statValue: { fontSize: '16px', fontWeight: '900', color: '#0f172a', margin: 0 },
    contentSplit: { display: 'flex', gap: '20px', padding: '0 15px', alignItems: 'flex-start' },
    contentStack: { display: 'flex', flexDirection: 'column', gap: '20px', padding: '0 15px' },
    leftCol: { flex: 2, background: '#ffffff', padding: '20px', borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' },
    rightCol: { flex: 1, background: '#ffffff', padding: '20px', borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', position: 'sticky', top: '75px' },
    sectionTitle: { fontSize: '16px', color: '#0f172a', margin: '0 0 5px 0', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '900' },
    subText: { fontSize: '13px', color: '#64748b', margin: '0 0 15px 0' },
    revenueBox: { marginTop: '15px' },
    revenueRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0' },
    revenueOrderId: { fontSize: '14px', fontWeight: '800', color: '#0f172a' },
    revenueDate: { fontSize: '12px', color: '#64748b', fontWeight: '600' },
    revenueAmount: { fontSize: '15px', fontWeight: '900', color: '#10b981' },
    emptyText: { fontSize: '13px', color: '#64748b', textAlign: 'center', padding: '15px 0', margin: 0 },
    loader: { textAlign: 'center', padding: '40px', fontWeight: 'bold', color: '#64748b' }
};

export default VendorDashboard;