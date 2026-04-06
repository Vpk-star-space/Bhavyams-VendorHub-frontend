import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { TrendingUp, PackageOpen, Clock, MapPin, Package, CheckCircle } from 'lucide-react';

const VendorOrders = () => {
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSales = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get('https://bhavyams-vendorhub-backend.onrender.com/api/orders/my-sales', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                setSales(res.data);
            } catch (err) {
                console.error("Failed to fetch sales", err);
            } finally {
                setLoading(false);
            }
        };
        fetchSales();
    }, []);

    const totalRevenue = sales.reduce((sum, order) => sum + Number(order.total_price), 0);

    if (loading) return <p style={{ color: '#64748b', textAlign: 'center', padding: '50px' }}>Loading sales analytics...</p>;

    // 🌐 SMART IMAGE LOGIC
   // 🌐 SMART IMAGE LOGIC
    const getProductImg = (url) => {
        if (!url) return 'https://via.placeholder.com/150?text=No+Image';
        // 🚀 FIX: Point to the live Render Backend!
        return url.startsWith('http') ? url : `https://bhavyams-vendorhub-backend.onrender.com${url}`;
    };
    return (
        <div>
            {/* 💰 VENDOR REVENUE CARD */}
            <div style={styles.revenueCard}>
                <div>
                    <h3 style={{ margin: '0 0 5px 0', color: '#1e293b', fontWeight: '900' }}>Earnings Overview</h3>
                    <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>Net revenue from Bhavyams Marketplace</p>
                </div>
                <div style={styles.revenueAmount}>
                    <TrendingUp size={28} color="#10b981" />
                    <span style={{ fontSize: '32px', fontWeight: '900', color: '#10b981' }}>₹{totalRevenue.toLocaleString('en-IN')}</span>
                </div>
            </div>

            <h3 style={{ marginBottom: '20px', color: '#0f172a', fontWeight: '900' }}>Order Fulfillment & Tracking</h3>
            
            {sales.length === 0 ? (
                <div style={styles.emptyState}>
                    <PackageOpen size={48} color="#cbd5e1" style={{ marginBottom: '15px' }} />
                    <p style={{ color: '#64748b', fontSize: '16px', margin: 0 }}>No sales recorded yet. Your listed items will appear here once paid.</p>
                </div>
            ) : (
                <div style={{display: 'flex', flexDirection: 'column', gap: '20px'}}>
                    {sales.map((order) => {
                        const isDelivered = order.status === 'Delivered';
                        const orderDate = new Date(order.created_at).toLocaleDateString('en-IN', {
                            day: 'numeric', month: 'short', year: 'numeric'
                        });

                        return (
                            <div key={order.order_id || order.id} style={styles.card}>
                                {/* 📦 TOP ROW: Product Info & Image */}
                                <div style={styles.productHeader}>
                                    <img 
                                        src={getProductImg(order.image_url)} 
                                        alt={order.product_name} 
                                        style={styles.orderImg}
                                        onError={(e) => { e.target.src = 'https://via.placeholder.com/150?text=Error'; }}
                                    />
                                    <div style={{flex: 1}}>
                                        <h4 style={styles.pName}>{order.product_name || "Bhavyams Product"}</h4>
                                        <div style={styles.orderIdText}>Order ID: #{order.order_id || order.id} • {orderDate}</div>
                                    </div>
                                    <div style={{textAlign: 'right'}}>
                                        <div style={{color: '#16a34a', fontWeight: '900', fontSize: '18px', marginBottom: '5px'}}>+ ₹{order.total_price}</div>
                                        <span style={isDelivered ? styles.statusGreen : styles.statusBlue}>
                                            {order.status?.toUpperCase() || 'CONFIRMED'}
                                        </span>
                                    </div>
                                </div>

                                {/* 🔵 PROGRESS BAR */}
                                <div style={styles.progressBar}>
                                    <div style={{ 
                                        background: isDelivered ? '#10b981' : '#2874f0', 
                                        width: isDelivered ? '100%' : '50%', 
                                        height: '100%', 
                                        borderRadius: '8px',
                                        transition: 'width 1s ease-in-out'
                                    }} />
                                </div>

                                {/* 🚚 TRACKING AREA */}
                                <div style={styles.trackingArea}>
                                    <div style={styles.trackStep}>
                                        <Package size={16} color="#3b82f6" />
                                        <span><b>Dispatch:</b> Your Local Hub</span>
                                    </div>

                                    <div style={styles.line}>
                                        <Clock size={14} color="#94a3b8" /> 
                                        <span>{isDelivered ? 'Arrived at Customer' : `Transit Time Remaining: ~${order.delivery_minutes || 6} mins`}</span>
                                    </div>

                                    <div style={styles.trackStep}>
                                        <MapPin size={16} color="#10b981" />
                                        <span><b>Deliver to:</b> Customer Address</span>
                                    </div>
                                </div>

                                {isDelivered && (
                                    <div style={{fontSize: '14px', color: '#10b981', fontWeight: '700', marginTop: '15px', display:'flex', alignItems:'center'}}>
                                        <CheckCircle size={16} style={{marginRight: '8px'}}/> Fulfillment Complete. Funds added to your revenue.
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

const styles = {
    revenueCard: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', padding: '30px', borderRadius: '15px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', marginBottom: '30px', borderLeft: '5px solid #10b981' },
    revenueAmount: { display: 'flex', alignItems: 'center', gap: '15px' },
    emptyState: { textAlign: 'center', padding: '80px 20px', background: '#fff', borderRadius: '15px', border: '1px dashed #cbd5e1' },
    
    // NEW TRACKING STYLES
    card: { background: '#fff', padding: '25px', borderRadius: '15px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' },
    productHeader: { display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' },
    orderImg: { width: '60px', height: '60px', borderRadius: '10px', objectFit: 'cover', background: '#f1f5f9', border: '1px solid #f0f0f0' },
    pName: { margin: 0, fontSize: '16px', fontWeight: '900', color: '#1e293b' },
    orderIdText: { fontSize: '12px', color: '#64748b', marginTop: '4px' },
    progressBar: { background: '#f1f5f9', height: '8px', borderRadius: '10px', marginBottom: '20px', overflow: 'hidden' },
    trackingArea: { background: '#f8fafc', padding: '15px', borderRadius: '12px', borderLeft: '4px solid #3b82f6' },
    trackStep: { display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px', margin: '5px 0' },
    line: { margin: '5px 30px', fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '10px', borderLeft: '2px dashed #cbd5e1', paddingLeft: '20px' },
    statusGreen: { color: '#166534', background: '#dcfce7', padding: '4px 12px', borderRadius: '20px', fontSize: '10px', fontWeight: '900', display: 'inline-block' },
    statusBlue: { color: '#1e40af', background: '#dbeafe', padding: '4px 12px', borderRadius: '20px', fontSize: '10px', fontWeight: '900', display: 'inline-block' }
};

export default VendorOrders;