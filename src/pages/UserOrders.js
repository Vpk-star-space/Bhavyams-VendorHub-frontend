import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Package, Clock, CheckCircle, XCircle, Phone, Store, MessageCircle, ShoppingCart, Trash2, Lock } from 'lucide-react';
import { toast } from 'react-toastify';

const getBackendUrl = () => {
    return process.env.NODE_ENV === 'production' 
        ? 'https://bhavyams-vendorhub-backend.onrender.com/api' 
        : 'http://localhost:5000/api';
};

const getImageSrc = (imgStr) => {
    if (!imgStr) return 'https://via.placeholder.com/80?text=No+Photo';
    let cleanUrl = imgStr.replace(/["\\]/g, '');
    if (cleanUrl.startsWith('http')) return cleanUrl;
    const baseUrl = getBackendUrl().replace('/api', '');
    return `${baseUrl}${cleanUrl.startsWith('/') ? '' : '/'}${cleanUrl}`;
};

const translations = {
    en: {
        title: "My Orders",
        tabList: "To Book",
        tabActive: "Active",
        tabHistory: "History",
        orderId: "Order ID",
        statusPending: "Pending Approval",
        statusAccepted: "Accepted",
        statusCompleted: "Completed",
        statusCancelled: "Cancelled",
        total: "Total",
        callVendor: "Call",
        messageVendor: "Message",
        unlocksIn: "Unlocks in",
        noOrders: "No active orders.",
        emptyList: "Your booking list is empty.",
        confirmBooking: "Confirm Booking",
        remove: "Remove",
        placing: "Booking...",
        qty: "Qty:"
    },
    te: {
        title: "నా ఆర్డర్‌లు",
        tabList: "బుక్ చేయవలసినవి",
        tabActive: "సక్రియ",
        tabHistory: "చరిత్ర",
        orderId: "ఆర్డర్ ID",
        statusPending: "ఆమోదం కోసం వేచి ఉంది",
        statusAccepted: "ఆమోదించబడింది",
        statusCompleted: "పూర్తయింది",
        statusCancelled: "రద్దు చేయబడింది",
        total: "మొత్తం",
        callVendor: "కాల్ చేయండి",
        messageVendor: "సందేశం",
        unlocksIn: "దీనిలో అన్‌లాక్ అవుతుంది",
        noOrders: "సక్రియ ఆర్డర్‌లు లేవు.",
        emptyList: "మీ బుకింగ్ జాబితా ఖాళీగా ఉంది.",
        confirmBooking: "బుకింగ్‌ను నిర్ధారించండి",
        remove: "తొలగించు",
        placing: "బుక్ అవుతోంది...",
        qty: "పరిమాణం:"
    }
};

const UserOrders = () => {
    const navigate = useNavigate();
    const location = useLocation();
    
    const userStr = localStorage.getItem('user');
    const currentUser = userStr && userStr !== 'undefined' ? JSON.parse(userStr) : null;
    const lang = localStorage.getItem('appLanguage') || (currentUser?.language === 'te' ? 'te' : 'en');
    const t = translations[lang];

    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isBooking, setIsBooking] = useState(false);
    
    // 🟢 ISOLATED CART STATE: Reads exactly what was saved, avoiding context bugs
    const [listItems, setListItems] = useState(() => JSON.parse(localStorage.getItem('subhams_cart') || '[]'));

    const defaultTab = location.state?.forceTab || (listItems.length > 0 ? 'list' : 'active');
    const [activeTab, setActiveTab] = useState(defaultTab);

    // 🟢 LIVE TIMER STATE (Ticks every 1 second)
    const [currentTime, setCurrentTime] = useState(Date.now());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(Date.now()), 1000); 
        return () => clearInterval(timer);
    }, []);

    const fetchMyOrders = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const res = await axios.get(`${getBackendUrl()}/orders/my-orders`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                setOrders(res.data.orders);
            }
        } catch (err) {
            console.error("Error fetching orders:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMyOrders();
    }, []);

    const handleConfirmBooking = async () => {
        const token = localStorage.getItem('token');
        if (!token) return navigate('/welcome');

        setIsBooking(true);
        try {
            const ordersByVendor = {};
            listItems.forEach(item => {
                const vId = item.vendor_id || item.shop_id;
                if (!ordersByVendor[vId]) ordersByVendor[vId] = [];
                ordersByVendor[vId].push(item);
            });

            for (const vendorId in ordersByVendor) {
                const vendorItems = ordersByVendor[vendorId];
                const vendorSubtotal = vendorItems.reduce((sum, i) => sum + (Number(i.price) * (i.quantity || i.qty || 1)), 0);

                const payload = {
                    vendor_id: vendorId,
                    items: vendorItems,
                    total_amount: vendorSubtotal,
                    order_type: vendorItems.some(i => i.order_type === 'Service') ? 'Service' : 'Product',
                    customer_name: currentUser.username || currentUser.name || "Customer",
                    customer_phone: currentUser.phone || "",
                    customer_address: currentUser.address || currentUser.pincode || "Location pending"
                };

                await axios.post(`${getBackendUrl()}/orders/place`, payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            }

            // Successfully booked! Clear local state
            localStorage.setItem('subhams_cart', '[]');
            setListItems([]);
            
            toast.success("Booking Confirmed!");
            setActiveTab('active');
            fetchMyOrders(); 

        } catch (err) {
            toast.error(err.response?.data?.message || "Error placing booking.");
        } finally {
            setIsBooking(false);
        }
    };

    const handleRemoveItem = (id) => {
        const newCart = listItems.filter(c => c.id !== id);
        setListItems(newCart);
        localStorage.setItem('subhams_cart', JSON.stringify(newCart));
        if (newCart.length === 0) setActiveTab('active');
    };

    const filteredOrders = orders.filter(order => {
        if (activeTab === 'active') return ['Pending', 'Accepted'].includes(order.status);
        if (activeTab === 'history') return ['Completed', 'Cancelled'].includes(order.status);
        return false;
    });

    const getStatusUI = (status) => {
        switch(status) {
            case 'Pending': return { color: '#f59e0b', bg: '#fef3c7', icon: <Clock size={14} />, text: t.statusPending };
            case 'Accepted': return { color: '#2563eb', bg: '#eff6ff', icon: <Package size={14} />, text: t.statusAccepted };
            case 'Completed': return { color: '#16a34a', bg: '#dcfce7', icon: <CheckCircle size={14} />, text: t.statusCompleted };
            case 'Cancelled': return { color: '#dc2626', bg: '#fef2f2', icon: <XCircle size={14} />, text: t.statusCancelled };
            default: return { color: '#64748b', bg: '#f1f5f9', icon: <Clock size={14} />, text: status };
        }
    };

    return (
        <div style={styles.page}>
            <div style={styles.appContainer}>
                
                <div style={styles.header}>
                    <button onClick={() => navigate(-1)} style={styles.backBtn}>
                        <ArrowLeft size={22} color="#0f172a" />
                    </button>
                    <h2 style={styles.headerTitle}>{t.title}</h2>
                    <div style={{width: '22px'}}></div>
                </div>

                <div style={styles.tabsContainer}>
                    {listItems.length > 0 && (
                        <button 
                            style={activeTab === 'list' ? styles.activeTab : styles.inactiveTab}
                            onClick={() => setActiveTab('list')}
                        >
                            {t.tabList} ({listItems.length})
                        </button>
                    )}
                    <button 
                        style={activeTab === 'active' ? styles.activeTab : styles.inactiveTab}
                        onClick={() => setActiveTab('active')}
                    >
                        {t.tabActive}
                    </button>
                    <button 
                        style={activeTab === 'history' ? styles.activeTab : styles.inactiveTab}
                        onClick={() => setActiveTab('history')}
                    >
                        {t.tabHistory}
                    </button>
                </div>

                <div style={styles.listContainer}>
                    
                    {/* 🟢 VIEW 1: UNBOOKED LIST */}
                    {activeTab === 'list' && (
                        <div>
                            {listItems.length === 0 ? (
                                <div style={styles.emptyState}>
                                    <ShoppingCart size={48} color="#cbd5e1" />
                                    <p style={styles.emptyText}>{t.emptyList}</p>
                                </div>
                            ) : (
                                <>
                                    {listItems.map(item => {
                                        const exactQty = item.quantity || item.qty || 1;
                                        return (
                                            <div key={item.id} style={styles.orderCard}>
                                                <div style={styles.itemRowWithImg}>
                                                    <img src={getImageSrc(item.image)} alt={item.name} style={styles.itemImg} />
                                                    <div style={{flex: 1}}>
                                                        <div style={styles.itemName}>{item.name}</div>
                                                        <div style={styles.itemQty}>{t.qty} {exactQty}</div>
                                                    </div>
                                                    <div style={styles.itemPrice}>₹{(item.price * exactQty)}</div>
                                                </div>
                                                <div style={styles.footerRow}>
                                                    <button onClick={() => handleRemoveItem(item.id)} style={styles.removeBtn}>
                                                        <Trash2 size={14} /> {t.remove}
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}

                                    <button onClick={handleConfirmBooking} disabled={isBooking} style={styles.confirmBookBtn}>
                                        {isBooking ? t.placing : t.confirmBooking}
                                    </button>
                                </>
                            )}
                        </div>
                    )}

                    {/* 🟢 VIEW 2: DB ORDERS */}
                    {activeTab !== 'list' && (
                        <>
                            {loading ? (
                                <p style={styles.loadingText}>Loading...</p>
                            ) : filteredOrders.length === 0 ? (
                                <div style={styles.emptyState}>
                                    <Package size={48} color="#cbd5e1" />
                                    <p style={styles.emptyText}>{t.noOrders}</p>
                                </div>
                            ) : (
                                filteredOrders.map(order => {
                                    const statusUI = getStatusUI(order.status);
                                    let items = [];
                                    try { items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items; } 
                                    catch (e) { items = []; }

                                    // 🟢 BULLETPROOF TIMEZONE FIX 
                                    // Forces the Javascript Date to treat the database time as UTC
                                    let dbDateStr = order.created_at;
                                    if (!dbDateStr.endsWith('Z')) {
                                        dbDateStr = dbDateStr.replace(' ', 'T') + 'Z'; 
                                    }
                                    
                                    const orderTime = new Date(dbDateStr).getTime();
                                    const timeDiffMs = currentTime - orderTime;
                                    const oneHourMs = 60 * 60 * 1000;
                                    
                                    const isCallUnlocked = timeDiffMs >= oneHourMs;
                                    const timeLeftMs = Math.max(0, oneHourMs - timeDiffMs);
                                    
                                    const minutesLeft = Math.floor(timeLeftMs / 60000);
                                    const secondsLeft = Math.floor((timeLeftMs % 60000) / 1000);

                                    return (
                                        <div key={order.id} style={styles.orderCard}>
                                            <div style={styles.orderHeader}>
                                                <span style={styles.orderId}>{t.orderId}: #{order.id}</span>
                                                <div style={{...styles.statusBadge, color: statusUI.color, background: statusUI.bg}}>
                                                    {statusUI.icon} {statusUI.text}
                                                </div>
                                            </div>

                                            <div style={styles.vendorRow} onClick={() => navigate(`/shop/${order.vendor_id}`)}>
                                                <Store size={18} color="#64748b" />
                                                <span style={styles.vendorName}>{order.vendor_name || 'Local Vendor'}</span>
                                            </div>

                                            <div style={styles.itemsBox}>
                                                {items.map((item, idx) => {
                                                    const exactQty = item.quantity || item.qty || 1;
                                                    return (
                                                        <div key={idx} style={styles.itemRowWithImg}>
                                                            <img src={getImageSrc(item.image)} alt={item.name} style={styles.itemImgSmall} />
                                                            <div style={{flex: 1}}>
                                                                <div style={styles.itemName}>{item.name}</div>
                                                                <div style={styles.itemQty}>{t.qty} {exactQty}</div>
                                                            </div>
                                                            <div style={styles.itemPrice}>₹{(item.price * exactQty)}</div>
                                                        </div>
                                                    )
                                                })}
                                            </div>

                                            <div style={styles.footerRow}>
                                                <div style={styles.totalBox}>
                                                    <span style={styles.totalLabel}>{t.total}:</span>
                                                    <span style={styles.totalAmount}>₹{order.total_amount}</span>
                                                </div>
                                                
                                                {activeTab === 'active' && (
                                                    <div style={styles.actionGroup}>
                                                        <button style={styles.msgBtn} onClick={() => alert("Secure messaging system opening...")}>
                                                            <MessageCircle size={14} /> {t.messageVendor}
                                                        </button>

                                                        {isCallUnlocked ? (
                                                            <button style={styles.callBtn} onClick={() => alert("Initiating Secure Call Proxy...")}>
                                                                <Phone size={14} fill="currentColor" /> {t.callVendor}
                                                            </button>
                                                        ) : (
                                                            <button style={styles.callBtnLocked} disabled>
                                                                <Lock size={12} /> {minutesLeft}m {secondsLeft}s
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

const styles = {
    page: { background: '#f1f5f9', minHeight: '100vh', fontFamily: 'Inter, system-ui, sans-serif' },
    appContainer: { maxWidth: '800px', margin: '0 auto', background: '#f8fafc', minHeight: '100vh', paddingBottom: '90px' },
    
    header: { background: '#ffffff', padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 10, borderBottom: '1px solid #e2e8f0' },
    backBtn: { background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0 },
    headerTitle: { margin: 0, fontSize: '18px', fontWeight: '700', color: '#0f172a' },
    
    tabsContainer: { display: 'flex', padding: '15px 20px', gap: '10px', background: '#ffffff', borderBottom: '1px solid #e2e8f0' },
    activeTab: { flex: 1, padding: '10px', background: '#0f172a', color: '#ffffff', border: 'none', borderRadius: '8px', fontWeight: '600', fontSize: '14px', cursor: 'pointer' },
    inactiveTab: { flex: 1, padding: '10px', background: '#f1f5f9', color: '#64748b', border: '1px solid #e2e8f0', borderRadius: '8px', fontWeight: '600', fontSize: '14px', cursor: 'pointer' },
    
    listContainer: { padding: '15px' },
    loadingText: { textAlign: 'center', color: '#64748b', marginTop: '40px', fontWeight: '600' },
    emptyState: { textAlign: 'center', marginTop: '60px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' },
    emptyText: { color: '#64748b', fontSize: '14px', fontWeight: '500' },
    
    orderCard: { background: '#ffffff', borderRadius: '12px', padding: '16px', marginBottom: '15px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' },
    orderHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' },
    orderId: { fontSize: '12px', color: '#64748b', fontWeight: '700' },
    statusBadge: { display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '700' },
    
    vendorRow: { display: 'flex', alignItems: 'center', gap: '8px', paddingBottom: '12px', borderBottom: '1px dashed #e2e8f0', marginBottom: '12px', cursor: 'pointer' },
    vendorName: { fontSize: '14px', fontWeight: '700', color: '#0f172a' },
    
    itemsBox: { display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '15px' },
    
    itemRowWithImg: { display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px', marginBottom: '10px' },
    itemImg: { width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover', border: '1px solid #e2e8f0' },
    itemImgSmall: { width: '45px', height: '45px', borderRadius: '6px', objectFit: 'cover', border: '1px solid #e2e8f0' },
    itemName: { fontSize: '14px', color: '#1e293b', fontWeight: '600', marginBottom: '4px' },
    itemQty: { fontSize: '12px', color: '#64748b', fontWeight: '500' },
    itemPrice: { fontSize: '15px', color: '#0f172a', fontWeight: '700' },
    
    footerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: '10px' },
    totalBox: { display: 'flex', flexDirection: 'column' },
    totalLabel: { fontSize: '11px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' },
    totalAmount: { fontSize: '18px', color: '#0f172a', fontWeight: '800' },
    
    removeBtn: { display: 'flex', alignItems: 'center', gap: '4px', background: '#fef2f2', color: '#ef4444', border: 'none', padding: '6px 12px', borderRadius: '6px', fontWeight: '600', fontSize: '12px', cursor: 'pointer' },
    confirmBookBtn: { width: '100%', background: '#2563eb', color: '#fff', border: 'none', padding: '14px', borderRadius: '8px', fontWeight: '700', fontSize: '15px', marginTop: '10px', cursor: 'pointer', boxShadow: '0 4px 6px rgba(37,99,235,0.2)' },
    
    actionGroup: { display: 'flex', gap: '8px' },
    msgBtn: { display: 'flex', alignItems: 'center', gap: '4px', background: '#f1f5f9', color: '#0f172a', border: '1px solid #e2e8f0', padding: '8px 12px', borderRadius: '8px', fontWeight: '600', fontSize: '12px', cursor: 'pointer' },
    callBtn: { display: 'flex', alignItems: 'center', gap: '4px', background: '#16a34a', color: '#ffffff', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: '700', fontSize: '12px', cursor: 'pointer' },
    callBtnLocked: { display: 'flex', alignItems: 'center', gap: '4px', background: '#f1f5f9', color: '#94a3b8', border: '1px solid #e2e8f0', padding: '8px 16px', borderRadius: '8px', fontWeight: '700', fontSize: '12px', cursor: 'not-allowed', width: '80px', justifyContent: 'center' }
};

export default UserOrders;