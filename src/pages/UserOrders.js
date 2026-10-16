import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Package, Clock, CheckCircle, XCircle, Phone, Store, MessageCircle, ShoppingCart, Trash2, Lock } from 'lucide-react';
import { toast } from 'react-toastify';
import { AppContext, socket } from '../context/AppContext';

const getBackendUrl = () => {
    const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    return isLocal ? 'http://localhost:5000/api' : 'https://bhavyams-vendorhub-backend.onrender.com/api';
};

const getImageSrc = (imgStr) => {
    if (!imgStr) return 'https://via.placeholder.com/80?text=No+Photo';
    let cleanUrl = String(imgStr).replace(/["\\]/g, '');
    if (cleanUrl.startsWith('http') || cleanUrl.startsWith('data:')) return cleanUrl;
    const baseUrl = getBackendUrl().replace('/api', '');
    return `${baseUrl}${cleanUrl.startsWith('/') ? '' : '/'}${cleanUrl}`;
};

const translations = {
    en: {
        title: "My Bookings & Orders",
        tabList: "To Book",
        tabActive: "Active",
        tabHistory: "History",
        orderId: "Booking ID",
        statusPending: "Waiting for Shop",
        statusAccepted: "Accepted",
        statusCompleted: "Completed",
        statusCancelled: "Cancelled",
        total: "Estimated Total",
        callVendor: "Web Call",
        messageVendor: "Message",
        noOrders: "No active bookings right now.",
        emptyList: "Your booking list is empty.",
        confirmBooking: "Send Booking Request to Shop 🚀",
        remove: "Remove",
        placing: "Sending Request...",
        qty: "Qty:"
    },
    te: {
        title: "నా బుకింగ్స్ & ఆర్డర్‌లు",
        tabList: "బుక్ చేయవలసినవి",
        tabActive: "సక్రియ",
        tabHistory: "చరిత్ర",
        orderId: "బుకింగ్ ID",
        statusPending: "షాప్ ఆమోదం కోసం",
        statusAccepted: "ఆమోదించబడింది",
        statusCompleted: "పూర్తయింది",
        statusCancelled: "రద్దు చేయబడింది",
        total: "మొత్తం",
        callVendor: "వెబ్ కాల్",
        messageVendor: "సందేశం",
        noOrders: "ప్రస్తుతం సక్రియ ఆర్డర్‌లు లేవు.",
        emptyList: "మీ బుకింగ్ జాబితా ఖాళీగా ఉంది.",
        confirmBooking: "బుకింగ్ అభ్యర్థన పంపండి 🚀",
        remove: "తొలగించు",
        placing: "పంపుతోంది...",
        qty: "పరిమాణం:"
    }
};

const UserOrders = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { language } = useContext(AppContext);
    
    const userStr = localStorage.getItem('user');
    const currentUser = userStr && userStr !== 'undefined' ? JSON.parse(userStr) : null;
    const lang = language === 'te' ? 'te' : 'en';
    const t = translations[lang];

    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isBooking, setIsBooking] = useState(false);
    
    const [listItems, setListItems] = useState(() => JSON.parse(localStorage.getItem('subhams_cart') || '[]'));

    const defaultTab = location.state?.forceTab || (listItems.length > 0 ? 'list' : 'active');
    const [activeTab, setActiveTab] = useState(defaultTab);
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
        if (!token || !currentUser) return navigate('/welcome');
        if (currentUser.can_book === false) {
            return toast.error("⚠️ Your booking privileges have been restricted by Admin.");
        }

        setIsBooking(true);
        try {
            const ordersByShop = {};
            listItems.forEach(item => {
                const sId = item.shop_id || item.vendor_id;
                if (!ordersByShop[sId]) ordersByShop[sId] = [];
                ordersByShop[sId].push(item);
            });

            for (const shopIdKey in ordersByShop) {
                const shopItems = ordersByShop[shopIdKey];
                const shopSubtotal = shopItems.reduce((sum, i) => sum + (Number(i.price) * (i.quantity || i.qty || 1)), 0);

                const payload = {
                    vendor_id: shopItems[0].vendor_id, 
                    shop_id: shopItems[0].shop_id || shopItems[0].vendor_id, 
                    items: shopItems,
                    total_amount: shopSubtotal,
                    order_type: shopItems.some(i => i.order_type === 'Service') ? 'Service' : 'Product',
                    customer_name: currentUser.username || currentUser.name || "Customer",
                    customer_phone: currentUser.phone || "",
                    customer_address: currentUser.address || "Local Area"
                };

                await axios.post(`${getBackendUrl()}/orders/place`, payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            }

            toast.success("🎉 Booking request sent to the shop!");
            await fetchMyOrders(); 
            localStorage.setItem('subhams_cart', '[]');
            setListItems([]);
            setActiveTab('active');
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

    // 🟢 INITIATE SECURE CHAT OR WEB CALL WITH SHOP
    const handleInitiateChat = async (order, autoCall = false) => {
        if (!currentUser) return navigate('/welcome');
        if (currentUser.can_message === false) {
            return toast.error("⚠️ Your messaging privileges have been suspended by Admin.");
        }
        if (autoCall && currentUser.can_call === false) {
            return toast.error("⚠️ Your calling privileges have been suspended by Admin.");
        }

        try {
            const token = localStorage.getItem('token');
            const shopId = order.shop_id || order.vendor_id;
            const res = await axios.post(`${getBackendUrl()}/chats/initiate/${shopId}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const convoId = res.data.conversation_id;

            if (autoCall && socket) {
                socket.emit('initiate_call', {
                    callerId: currentUser.id,
                    receiverId: order.vendor_id,
                    bookingId: convoId,
                    callerName: currentUser.username || 'Customer'
                });
                toast.info("📞 Ringing shop via Subhams Web-Call Proxy...");
            }

            navigate(`/chat/${convoId}${autoCall ? '?call=true' : ''}`);
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to connect with shop.");
        }
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
                    <button onClick={() => navigate('/')} style={styles.backBtn}>
                        <ArrowLeft size={22} color="#0f172a" />
                    </button>
                    <h2 style={styles.headerTitle}>{t.title}</h2>
                    <div style={{width: '22px'}}></div>
                </div>

                <div style={styles.tabsContainer}>
                    {listItems.length > 0 && (
                        <button style={activeTab === 'list' ? styles.activeTab : styles.inactiveTab} onClick={() => setActiveTab('list')}>
                            {t.tabList} ({listItems.length})
                        </button>
                    )}
                    <button style={activeTab === 'active' ? styles.activeTab : styles.inactiveTab} onClick={() => setActiveTab('active')}>
                        {t.tabActive}
                    </button>
                    <button style={activeTab === 'history' ? styles.activeTab : styles.inactiveTab} onClick={() => setActiveTab('history')}>
                        {t.tabHistory}
                    </button>
                </div>

                <div style={styles.listContainer}>
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
                                                    <img src={getImageSrc(item.image)} alt={item.name} style={styles.itemImg} crossOrigin="anonymous" referrerPolicy="no-referrer" />
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

                                    let dbDateStr = String(order.created_at || '');
                                    if (dbDateStr && !dbDateStr.endsWith('Z') && !dbDateStr.includes('+')) {
                                        dbDateStr = dbDateStr.replace(' ', 'T') + 'Z'; 
                                    }
                                    
                                    const orderTime = new Date(dbDateStr).getTime();
                                    const timeDiffMs = currentTime - orderTime;
                                    const oneHourMs = 60 * 60 * 1000;
                                    
                                    // Unlocks immediately if Vendor Accepted, or after 1 hour if still Pending
                                    const isCallUnlocked = order.status === 'Accepted' || timeDiffMs >= oneHourMs;
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

                                            <div style={styles.vendorRow} onClick={() => navigate(`/shop/${order.shop_id || order.vendor_id}`)}>
                                                <Store size={18} color="#2563eb" />
                                                <span style={styles.vendorName}>{order.vendor_name || 'Local Shop'}</span>
                                            </div>

                                            <div style={styles.itemsBox}>
                                                {items.map((item, idx) => {
                                                    const exactQty = item.quantity || item.qty || 1;
                                                    return (
                                                        <div key={idx} style={styles.itemRowWithImg}>
                                                            <img src={getImageSrc(item.image)} alt={item.name} style={styles.itemImgSmall} crossOrigin="anonymous" referrerPolicy="no-referrer" />
                                                            <div style={{flex: 1}}>
                                                                <div style={styles.itemName}>{item.name}</div>
                                                                <div style={styles.itemQty}>{t.qty} {exactQty}</div>
                                                            </div>
                                                            <div style={styles.itemPrice}>₹{(item.price * exactQty)}</div>
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            <div style={styles.footerRow}>
                                                <div style={styles.totalBox}>
                                                    <span style={styles.totalLabel}>{t.total}:</span>
                                                    <span style={styles.totalAmount}>₹{order.total_amount}</span>
                                                </div>
                                                
                                                {activeTab === 'active' && (
                                                    <div style={styles.actionGroup}>
                                                        <button style={styles.msgBtn} onClick={() => handleInitiateChat(order, false)}>
                                                            <MessageCircle size={14} /> {t.messageVendor}
                                                        </button>

                                                        {isCallUnlocked ? (
                                                            <button style={styles.callBtn} onClick={() => handleInitiateChat(order, true)}>
                                                                <Phone size={14} fill="currentColor" /> {t.callVendor}
                                                            </button>
                                                        ) : (
                                                            <button style={styles.callBtnLocked} disabled title="Web Call unlocks once accepted or after 1 hour">
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
    headerTitle: { margin: 0, fontSize: '18px', fontWeight: '800', color: '#0f172a' },
    tabsContainer: { display: 'flex', padding: '12px 16px', gap: '10px', background: '#ffffff', borderBottom: '1px solid #e2e8f0' },
    activeTab: { flex: 1, padding: '10px', background: '#0f172a', color: '#facc15', border: 'none', borderRadius: '10px', fontWeight: '800', fontSize: '13.5px', cursor: 'pointer' },
    inactiveTab: { flex: 1, padding: '10px', background: '#f1f5f9', color: '#64748b', border: '1px solid #e2e8f0', borderRadius: '10px', fontWeight: '700', fontSize: '13.5px', cursor: 'pointer' },
    listContainer: { padding: '15px' },
    loadingText: { textAlign: 'center', color: '#64748b', marginTop: '40px', fontWeight: '600' },
    emptyState: { textAlign: 'center', marginTop: '60px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' },
    emptyText: { color: '#64748b', fontSize: '14px', fontWeight: '600' },
    orderCard: { background: '#ffffff', borderRadius: '14px', padding: '16px', marginBottom: '15px', border: '1px solid #e2e8f0', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' },
    orderHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' },
    orderId: { fontSize: '12.5px', color: '#64748b', fontWeight: '800' },
    statusBadge: { display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '8px', fontSize: '11.5px', fontWeight: '800' },
    vendorRow: { display: 'flex', alignItems: 'center', gap: '8px', paddingBottom: '12px', borderBottom: '1px dashed #e2e8f0', marginBottom: '12px', cursor: 'pointer' },
    vendorName: { fontSize: '14.5px', fontWeight: '800', color: '#2563eb', textDecoration: 'underline' },
    itemsBox: { display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '12px' },
    itemRowWithImg: { display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' },
    itemImg: { width: '58px', height: '58px', borderRadius: '10px', objectFit: 'cover', border: '1px solid #e2e8f0' },
    itemImgSmall: { width: '44px', height: '44px', borderRadius: '8px', objectFit: 'cover', border: '1px solid #e2e8f0' },
    itemName: { fontSize: '14px', color: '#0f172a', fontWeight: '800', marginBottom: '2px' },
    itemQty: { fontSize: '12px', color: '#64748b', fontWeight: '600' },
    itemPrice: { fontSize: '15px', color: '#0f172a', fontWeight: '900' },
    footerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', flexWrap: 'wrap', gap: '10px' },
    totalBox: { display: 'flex', flexDirection: 'column' },
    totalLabel: { fontSize: '10.5px', color: '#64748b', fontWeight: '800', textTransform: 'uppercase' },
    totalAmount: { fontSize: '18px', color: '#0f172a', fontWeight: '900' },
    removeBtn: { display: 'flex', alignItems: 'center', gap: '4px', background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca', padding: '6px 12px', borderRadius: '8px', fontWeight: '800', fontSize: '12px', cursor: 'pointer' },
    confirmBookBtn: { width: '100%', background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: '#fff', border: 'none', padding: '15px', borderRadius: '12px', fontWeight: '900', fontSize: '15px', marginTop: '10px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(37,99,235,0.25)' },
    actionGroup: { display: 'flex', gap: '8px' },
    msgBtn: { display: 'flex', alignItems: 'center', gap: '5px', background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', padding: '8px 12px', borderRadius: '10px', fontWeight: '800', fontSize: '12px', cursor: 'pointer' },
    callBtn: { display: 'flex', alignItems: 'center', gap: '5px', background: '#16a34a', color: '#ffffff', border: 'none', padding: '8px 14px', borderRadius: '10px', fontWeight: '800', fontSize: '12px', cursor: 'pointer' },
    callBtnLocked: { display: 'flex', alignItems: 'center', gap: '4px', background: '#f1f5f9', color: '#94a3b8', border: '1px solid #e2e8f0', padding: '8px 12px', borderRadius: '10px', fontWeight: '800', fontSize: '11.5px', cursor: 'not-allowed' }
};

export default UserOrders;