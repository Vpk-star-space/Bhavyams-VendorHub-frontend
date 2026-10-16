import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, PackageCheck, Check, X, Phone, MessageCircle, CheckCircle } from 'lucide-react';
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
        title: "Manage Shop Orders",
        tabNew: "New Requests",
        tabActive: "In Progress",
        tabHistory: "History",
        accept: "Accept",
        reject: "Reject",
        complete: "Mark Completed",
        call: "Web Call",
        message: "Chat",
        emptyNew: "No new order requests right now.",
        emptyActive: "No orders currently in progress.",
        emptyHistory: "No past orders found.",
        customer: "Customer:",
        address: "Area / Address:",
        total: "Total Value:",
        statusUpdated: "Order status updated!"
    },
    te: {
        title: "ఆర్డర్‌లను నిర్వహించండి",
        tabNew: "కొత్త అభ్యర్థనలు",
        tabActive: "పురోగతిలో ఉన్నాయి",
        tabHistory: "చరిత్ర",
        accept: "ఆమోదించు",
        reject: "తిరస్కరించు",
        complete: "పూర్తయింది",
        call: "వెబ్ కాల్",
        message: "చాట్",
        emptyNew: "ప్రస్తుతం కొత్త ఆర్డర్ అభ్యర్థనలు లేవు.",
        emptyActive: "ప్రస్తుతం పురోగతిలో ఆర్డర్‌లు లేవు.",
        emptyHistory: "గత ఆర్డర్‌లు ఏవీ కనుగొనబడలేదు.",
        customer: "కస్టమర్:",
        address: "ప్రాంతం / చిరునామా:",
        total: "మొత్తం విలువ:",
        statusUpdated: "ఆర్డర్ స్థితి నవీకరించబడింది!"
    }
};

const VendorOrders = () => {
    const navigate = useNavigate();
    const { language } = useContext(AppContext);
    
    const userStr = localStorage.getItem('user');
    const currentUser = userStr && userStr !== 'undefined' ? JSON.parse(userStr) : null;
    const lang = language === 'te' ? 'te' : 'en';
    const t = translations[lang];

    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('new');

    const fetchVendorOrders = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const res = await axios.get(`${getBackendUrl()}/orders/vendor-orders`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                setOrders(res.data.orders);
            }
        } catch (err) {
            toast.error("Failed to load orders.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchVendorOrders();
    }, []);

    useEffect(() => {
        if (socket && currentUser) {
            const eventName = `new_order_vendor_${currentUser.id}`;
            const handleNewOrder = (newOrder) => {
                setOrders((prevOrders) => [newOrder, ...prevOrders]);
                toast.success("🔔 New Order Request Received!", { autoClose: false });
            };
            socket.on(eventName, handleNewOrder);
            return () => socket.off(eventName, handleNewOrder);
        }
    }, [currentUser?.id]);

    const handleUpdateStatus = async (orderId, newStatus) => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.put(`${getBackendUrl()}/orders/update-status/${orderId}`, 
                { status: newStatus },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (res.data.success) {
                setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
                toast.success(t.statusUpdated);
            }
        } catch (err) {
            toast.error("Failed to update status.");
        }
    };

    // 🟢 OPEN CUSTOMER CHAT OR INITIATE WEB-CALL
    const handleContactCustomer = async (order, triggerCall = false) => {
        try {
            const token = localStorage.getItem('token');
            const shopId = order.shop_id || order.vendor_id;
            const res = await axios.post(`${getBackendUrl()}/chats/initiate/${shopId}`, {
                customer_id: order.customer_id
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const convoId = res.data.conversation_id;

            if (triggerCall && socket) {
                socket.emit('initiate_call', {
                    callerId: currentUser?.id,
                    receiverId: order.customer_id,
                    bookingId: convoId,
                    callerName: `Shop Order #${order.id}`
                });
                toast.info(`📞 Calling ${order.customer_name || 'Customer'} via Subhams Web Call...`);
            }
            navigate(`/chat/${convoId}${triggerCall ? '?call=true' : ''}`);
        } catch (err) {
            toast.error("Could not open customer chat room.");
        }
    };

    const filteredOrders = orders.filter(order => {
        if (activeTab === 'new') return order.status === 'Pending';
        if (activeTab === 'active') return order.status === 'Accepted';
        if (activeTab === 'history') return ['Completed', 'Cancelled'].includes(order.status);
        return false;
    });

    const getEmptyText = () => {
        if (activeTab === 'new') return t.emptyNew;
        if (activeTab === 'active') return t.emptyActive;
        return t.emptyHistory;
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
                    <button style={activeTab === 'new' ? styles.activeTab : styles.inactiveTab} onClick={() => setActiveTab('new')}>
                        {t.tabNew} {orders.filter(o => o.status === 'Pending').length > 0 && <span style={styles.badge}>{orders.filter(o => o.status === 'Pending').length}</span>}
                    </button>
                    <button style={activeTab === 'active' ? styles.activeTab : styles.inactiveTab} onClick={() => setActiveTab('active')}>
                        {t.tabActive}
                    </button>
                    <button style={activeTab === 'history' ? styles.activeTab : styles.inactiveTab} onClick={() => setActiveTab('history')}>
                        {t.tabHistory}
                    </button>
                </div>

                <div style={styles.listContainer}>
                    {loading ? (
                        <p style={styles.loadingText}>Loading...</p>
                    ) : filteredOrders.length === 0 ? (
                        <div style={styles.emptyState}>
                            <PackageCheck size={48} color="#cbd5e1" />
                            <p style={styles.emptyText}>{getEmptyText()}</p>
                        </div>
                    ) : (
                        filteredOrders.map(order => {
                            let items = [];
                            try { items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items; } 
                            catch (e) { items = []; }

                            const orderDate = new Date(order.created_at).toLocaleString('en-IN', {
                                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                            });

                            return (
                                <div key={order.id} style={styles.orderCard}>
                                    <div style={styles.orderHeader}>
                                        <div style={{display: 'flex', flexDirection: 'column'}}>
                                            <span style={styles.orderId}>#{order.id} • {order.order_type || 'Order'}</span>
                                            <span style={styles.timeText}>{orderDate}</span>
                                        </div>
                                        <div style={styles.statusBadge(order.status)}>
                                            {order.status}
                                        </div>
                                    </div>

                                    <div style={styles.customerBox}>
                                        <div style={styles.customerRow}>
                                            <span style={styles.label}>{t.customer}</span>
                                            <span style={styles.value}>{order.customer_name}</span>
                                        </div>
                                        <div style={styles.customerRow}>
                                            <span style={styles.label}>{t.address}</span>
                                            <span style={styles.value}>{order.customer_address}</span>
                                        </div>
                                    </div>

                                    <div style={styles.itemsBox}>
                                        {items.map((item, idx) => {
                                            const exactQty = item.quantity || item.qty || 1;
                                            return (
                                                <div key={idx} style={styles.itemRowWithImg}>
                                                    <img src={getImageSrc(item.image)} alt={item.name} style={styles.itemImgSmall} />
                                                    <div style={{flex: 1}}>
                                                        <div style={styles.itemName}>{item.name}</div>
                                                        <div style={styles.itemQty}>Qty: {exactQty}</div>
                                                    </div>
                                                    <div style={styles.itemPrice}>₹{(item.price * exactQty)}</div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    <div style={styles.footerRow}>
                                        <div style={styles.totalBox}>
                                            <span style={styles.totalLabel}>{t.total}</span>
                                            <span style={styles.totalAmount}>₹{order.total_amount}</span>
                                        </div>

                                        <div style={styles.actionGroup}>
                                            {order.status === 'Pending' && (
                                                <>
                                                    <button style={styles.rejectBtn} onClick={() => handleUpdateStatus(order.id, 'Cancelled')}>
                                                        <X size={16} /> {t.reject}
                                                    </button>
                                                    <button style={styles.acceptBtn} onClick={() => handleUpdateStatus(order.id, 'Accepted')}>
                                                        <Check size={16} /> {t.accept}
                                                    </button>
                                                </>
                                            )}

                                            {order.status === 'Accepted' && (
                                                <div style={{display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end'}}>
                                                    <div style={{display: 'flex', gap: '8px'}}>
                                                        <button style={styles.msgBtn} onClick={() => handleContactCustomer(order, false)}>
                                                            <MessageCircle size={14} /> {t.message}
                                                        </button>
                                                        <button style={styles.callBtn} onClick={() => handleContactCustomer(order, true)}>
                                                            <Phone size={14} /> {t.call}
                                                        </button>
                                                    </div>
                                                    <button style={styles.completeBtn} onClick={() => handleUpdateStatus(order.id, 'Completed')}>
                                                        <CheckCircle size={14} /> {t.complete}
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
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
    activeTab: { flex: 1, padding: '10px', background: '#0f172a', color: '#facc15', border: 'none', borderRadius: '10px', fontWeight: '800', fontSize: '13.5px', cursor: 'pointer', position: 'relative' },
    inactiveTab: { flex: 1, padding: '10px', background: '#f1f5f9', color: '#64748b', border: '1px solid #e2e8f0', borderRadius: '10px', fontWeight: '700', fontSize: '13.5px', cursor: 'pointer', position: 'relative' },
    badge: { position: 'absolute', top: '-5px', right: '-5px', background: '#ef4444', color: '#fff', fontSize: '10px', padding: '2px 6px', borderRadius: '10px' },
    listContainer: { padding: '15px' },
    loadingText: { textAlign: 'center', color: '#64748b', marginTop: '40px', fontWeight: '600' },
    emptyState: { textAlign: 'center', marginTop: '60px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' },
    emptyText: { color: '#64748b', fontSize: '14px', fontWeight: '600' },
    orderCard: { background: '#ffffff', borderRadius: '14px', padding: '16px', marginBottom: '15px', border: '1px solid #e2e8f0', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' },
    orderHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px', marginBottom: '12px' },
    orderId: { fontSize: '14.5px', color: '#0f172a', fontWeight: '900' },
    timeText: { fontSize: '12px', color: '#94a3b8', marginTop: '4px', fontWeight: '600' },
    statusBadge: (status) => ({
        padding: '5px 10px', borderRadius: '8px', fontSize: '11.5px', fontWeight: '800',
        background: status === 'Pending' ? '#fef3c7' : status === 'Accepted' ? '#eff6ff' : status === 'Completed' ? '#dcfce7' : '#fef2f2',
        color: status === 'Pending' ? '#d97706' : status === 'Accepted' ? '#2563eb' : status === 'Completed' ? '#16a34a' : '#dc2626',
    }),
    customerBox: { background: '#f8fafc', padding: '12px', borderRadius: '10px', marginBottom: '14px', border: '1px solid #e2e8f0' },
    customerRow: { display: 'flex', gap: '8px', fontSize: '13px', marginBottom: '4px' },
    label: { color: '#64748b', fontWeight: '700', width: '95px', flexShrink: 0 },
    value: { color: '#0f172a', fontWeight: '700', flex: 1 },
    itemsBox: { display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '15px' },
    itemRowWithImg: { display: 'flex', alignItems: 'center', gap: '12px' },
    itemImgSmall: { width: '44px', height: '44px', borderRadius: '8px', objectFit: 'cover', border: '1px solid #e2e8f0' },
    itemName: { fontSize: '13.5px', color: '#0f172a', fontWeight: '800' },
    itemQty: { fontSize: '12px', color: '#64748b', fontWeight: '600' },
    itemPrice: { fontSize: '14.5px', color: '#0f172a', fontWeight: '900' },
    footerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px dashed #cbd5e1', flexWrap: 'wrap', gap: '10px' },
    totalBox: { display: 'flex', flexDirection: 'column' },
    totalLabel: { fontSize: '10.5px', color: '#64748b', fontWeight: '800', textTransform: 'uppercase' },
    totalAmount: { fontSize: '18px', color: '#0f172a', fontWeight: '900' },
    actionGroup: { display: 'flex', gap: '8px' },
    rejectBtn: { display: 'flex', alignItems: 'center', gap: '6px', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', padding: '10px 14px', borderRadius: '10px', fontWeight: '800', fontSize: '13px', cursor: 'pointer' },
    acceptBtn: { display: 'flex', alignItems: 'center', gap: '6px', background: '#2563eb', color: '#ffffff', border: 'none', padding: '10px 16px', borderRadius: '10px', fontWeight: '800', fontSize: '13px', cursor: 'pointer' },
    msgBtn: { display: 'flex', alignItems: 'center', gap: '5px', background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', padding: '8px 12px', borderRadius: '8px', fontWeight: '800', fontSize: '12px', cursor: 'pointer' },
    callBtn: { display: 'flex', alignItems: 'center', gap: '5px', background: '#16a34a', color: '#ffffff', border: 'none', padding: '8px 14px', borderRadius: '8px', fontWeight: '800', fontSize: '12px', cursor: 'pointer' },
    completeBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', background: '#0f172a', color: '#facc15', border: 'none', padding: '10px 16px', borderRadius: '8px', fontWeight: '800', fontSize: '12.5px', cursor: 'pointer', width: '100%' }
};

export default VendorOrders;