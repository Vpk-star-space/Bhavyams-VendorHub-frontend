import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, PackageCheck, Check, X, Phone, MessageCircle, Clock, CheckCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import { AppContext } from '../context/AppContext';

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

// 🌐 TRANSLATIONS
const translations = {
    en: {
        title: "Manage Orders",
        tabNew: "New Requests",
        tabActive: "In Progress",
        tabHistory: "History",
        accept: "Accept",
        reject: "Reject",
        complete: "Mark Completed",
        call: "Call Customer",
        message: "Message",
        emptyNew: "No new order requests right now.",
        emptyActive: "No orders currently in progress.",
        emptyHistory: "No past orders found.",
        customer: "Customer:",
        address: "Address:",
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
        call: "కస్టమర్‌కు కాల్ చేయండి",
        message: "సందేశం",
        emptyNew: "ప్రస్తుతం కొత్త ఆర్డర్ అభ్యర్థనలు లేవు.",
        emptyActive: "ప్రస్తుతం పురోగతిలో ఆర్డర్‌లు లేవు.",
        emptyHistory: "గత ఆర్డర్‌లు ఏవీ కనుగొనబడలేదు.",
        customer: "కస్టమర్:",
        address: "చిరునామా:",
        total: "మొత్తం విలువ:",
        statusUpdated: "ఆర్డర్ స్థితి నవీకరించబడింది!"
    }
};

const VendorOrders = () => {
    const navigate = useNavigate();
    const { socket } = useContext(AppContext);
    
    const userStr = localStorage.getItem('user');
    const currentUser = userStr && userStr !== 'undefined' ? JSON.parse(userStr) : null;
    const lang = localStorage.getItem('appLanguage') || (currentUser?.language === 'te' ? 'te' : 'en');
    const t = translations[lang];

    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('new'); // new, active, history

    // 1. Fetch Initial Orders
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
            console.error("Fetch Vendor Orders Error:", err);
            toast.error("Failed to load orders.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchVendorOrders();
    }, []);

    // 2. 🟢 INSTANT REAL-TIME ORDERS VIA SOCKET.IO
    useEffect(() => {
        if (socket && currentUser) {
            const eventName = `new_order_vendor_${currentUser.id}`;
            
            const handleNewOrder = (newOrder) => {
                // Add the new order to the top of the list instantly!
                setOrders((prevOrders) => [newOrder, ...prevOrders]);
                toast.success("🔔 New Order Received!", { autoClose: false });
                // Optional: Play a sound here!
            };

            socket.on(eventName, handleNewOrder);
            return () => {
                socket.off(eventName, handleNewOrder);
            };
        }
    }, [socket, currentUser]);

    // 3. Update Order Status Logic
    const handleUpdateStatus = async (orderId, newStatus) => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.put(`${getBackendUrl()}/orders/update-status/${orderId}`, 
                { status: newStatus },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (res.data.success) {
                // Update UI instantly
                setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
                toast.success(t.statusUpdated);
            }
        } catch (err) {
            toast.error("Failed to update status.");
        }
    };

    // 4. Filter logic based on tabs
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
                
                {/* HEADER */}
                <div style={styles.header}>
                    <button onClick={() => navigate(-1)} style={styles.backBtn}>
                        <ArrowLeft size={22} color="#0f172a" />
                    </button>
                    <h2 style={styles.headerTitle}>{t.title}</h2>
                    <div style={{width: '22px'}}></div>
                </div>

                {/* TABS */}
                <div style={styles.tabsContainer}>
                    <button 
                        style={activeTab === 'new' ? styles.activeTab : styles.inactiveTab}
                        onClick={() => setActiveTab('new')}
                    >
                        {t.tabNew} {orders.filter(o => o.status === 'Pending').length > 0 && <span style={styles.badge}>{orders.filter(o => o.status === 'Pending').length}</span>}
                    </button>
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

                {/* ORDERS LIST */}
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
                                    
                                    {/* Order Header */}
                                    <div style={styles.orderHeader}>
                                        <div style={{display: 'flex', flexDirection: 'column'}}>
                                            <span style={styles.orderId}>#{order.id} • {order.order_type}</span>
                                            <span style={styles.timeText}>{orderDate}</span>
                                        </div>
                                        <div style={styles.statusBadge(order.status)}>
                                            {order.status}
                                        </div>
                                    </div>

                                    {/* Customer Details */}
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

                                    {/* Items List */}
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
                                            )
                                        })}
                                    </div>

                                    {/* Footer (Total & Actions) */}
                                    <div style={styles.footerRow}>
                                        <div style={styles.totalBox}>
                                            <span style={styles.totalLabel}>{t.total}</span>
                                            <span style={styles.totalAmount}>₹{order.total_amount}</span>
                                        </div>

                                        <div style={styles.actionGroup}>
                                            {/* PENDING ACTIONS */}
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

                                            {/* ACCEPTED ACTIONS (In Progress) */}
                                            {order.status === 'Accepted' && (
                                                <div style={{display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end'}}>
                                                    <div style={{display: 'flex', gap: '8px'}}>
                                                        <button style={styles.msgBtn} onClick={() => alert("Vendor Messaging UI opening...")}>
                                                            <MessageCircle size={14} />
                                                        </button>
                                                        <button style={styles.callBtn} onClick={() => alert("Initiating Secure Call Proxy to Customer...")}>
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
    headerTitle: { margin: 0, fontSize: '18px', fontWeight: '700', color: '#0f172a' },
    
    tabsContainer: { display: 'flex', padding: '15px 20px', gap: '10px', background: '#ffffff', borderBottom: '1px solid #e2e8f0' },
    activeTab: { flex: 1, padding: '10px', background: '#0f172a', color: '#ffffff', border: 'none', borderRadius: '8px', fontWeight: '600', fontSize: '14px', cursor: 'pointer', position: 'relative' },
    inactiveTab: { flex: 1, padding: '10px', background: '#f1f5f9', color: '#64748b', border: '1px solid #e2e8f0', borderRadius: '8px', fontWeight: '600', fontSize: '14px', cursor: 'pointer', position: 'relative' },
    badge: { position: 'absolute', top: '-5px', right: '-5px', background: '#ef4444', color: '#fff', fontSize: '10px', padding: '2px 6px', borderRadius: '10px' },

    listContainer: { padding: '15px' },
    loadingText: { textAlign: 'center', color: '#64748b', marginTop: '40px', fontWeight: '600' },
    emptyState: { textAlign: 'center', marginTop: '60px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' },
    emptyText: { color: '#64748b', fontSize: '14px', fontWeight: '500' },
    
    orderCard: { background: '#ffffff', borderRadius: '12px', padding: '16px', marginBottom: '15px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' },
    orderHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px', marginBottom: '12px' },
    orderId: { fontSize: '14px', color: '#0f172a', fontWeight: '800' },
    timeText: { fontSize: '12px', color: '#94a3b8', marginTop: '4px' },
    
    statusBadge: (status) => ({
        padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '700',
        background: status === 'Pending' ? '#fef3c7' : status === 'Accepted' ? '#eff6ff' : status === 'Completed' ? '#dcfce7' : '#fef2f2',
        color: status === 'Pending' ? '#d97706' : status === 'Accepted' ? '#2563eb' : status === 'Completed' ? '#16a34a' : '#dc2626',
    }),

    customerBox: { background: '#f8fafc', padding: '12px', borderRadius: '8px', marginBottom: '15px' },
    customerRow: { display: 'flex', gap: '8px', fontSize: '13px', marginBottom: '4px' },
    label: { color: '#64748b', fontWeight: '600', width: '70px' },
    value: { color: '#0f172a', fontWeight: '500', flex: 1 },
    
    itemsBox: { display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '15px' },
    itemRowWithImg: { display: 'flex', alignItems: 'center', gap: '12px' },
    itemImgSmall: { width: '40px', height: '40px', borderRadius: '6px', objectFit: 'cover', border: '1px solid #e2e8f0' },
    itemName: { fontSize: '13px', color: '#1e293b', fontWeight: '600' },
    itemQty: { fontSize: '12px', color: '#64748b' },
    itemPrice: { fontSize: '14px', color: '#0f172a', fontWeight: '700' },

    footerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px dashed #cbd5e1' },
    totalBox: { display: 'flex', flexDirection: 'column' },
    totalLabel: { fontSize: '11px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' },
    totalAmount: { fontSize: '18px', color: '#0f172a', fontWeight: '800' },

    actionGroup: { display: 'flex', gap: '8px' },
    rejectBtn: { display: 'flex', alignItems: 'center', gap: '6px', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', padding: '10px 16px', borderRadius: '8px', fontWeight: '600', fontSize: '13px', cursor: 'pointer' },
    acceptBtn: { display: 'flex', alignItems: 'center', gap: '6px', background: '#2563eb', color: '#ffffff', border: 'none', padding: '10px 16px', borderRadius: '8px', fontWeight: '600', fontSize: '13px', cursor: 'pointer' },
    
    msgBtn: { display: 'flex', alignItems: 'center', gap: '4px', background: '#f1f5f9', color: '#0f172a', border: '1px solid #e2e8f0', padding: '8px 12px', borderRadius: '8px', fontWeight: '600', fontSize: '12px', cursor: 'pointer' },
    callBtn: { display: 'flex', alignItems: 'center', gap: '4px', background: '#10b981', color: '#ffffff', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: '700', fontSize: '12px', cursor: 'pointer' },
    completeBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', background: '#0f172a', color: '#ffffff', border: 'none', padding: '10px 16px', borderRadius: '8px', fontWeight: '600', fontSize: '13px', cursor: 'pointer', width: '100%' }
};

export default VendorOrders;