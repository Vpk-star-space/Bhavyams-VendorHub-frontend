import React from 'react';
import { Clock, MapPin, Package, CheckCircle } from 'lucide-react';

const CustomerOrders = ({ orders }) => {
    if (!orders || orders.length === 0) return <p style={{textAlign: 'center', color: '#64748b', padding: '20px'}}>No orders yet.</p>;

    // 🌐 SMART IMAGE LOGIC (Fixed Slashes)
    const getProductImg = (item) => {
        const rawUrl = item.image_url || item.product_image || ''; 
        if (!rawUrl) return 'https://via.placeholder.com/150?text=No+Image';
        
        const cleanUrl = rawUrl.replace(/["\\]/g, ''); 
        if (cleanUrl.startsWith('http')) return cleanUrl;
        return `https://bhavyams-vendorhub-backend.onrender.com${cleanUrl.startsWith('/') ? '' : '/'}${cleanUrl}`;
    };

    return (
        <div style={{display: 'flex', flexDirection: 'column', gap: '20px'}}>
            {orders.map((order) => {
                const isDelivered = order.status === 'Delivered';
                
                return (
                    <div key={order.id} style={styles.card}>
                        {/* 📦 TOP ROW: Product Info & Image */}
                        <div style={styles.productHeader}>
                            <img 
                                src={getProductImg(order)} 
                                alt={order.product_name} 
                                style={styles.orderImg}
                                onError={(e) => { e.target.src = 'https://via.placeholder.com/150?text=Error'; }}
                            />
                            <div style={{flex: 1}}>
                                <h4 style={styles.pName}>{order.product_name || "Product Name Loading..."}</h4>
                                <div style={styles.orderIdText}>Order ID: #{order.id} | ₹{order.total_price}</div>
                            </div>
                            <span style={isDelivered ? styles.statusGreen : styles.statusBlue}>
                                {order.status?.toUpperCase()}
                            </span>
                        </div>

                        {/* 🚚 TRACKING AREA */}
                        <div style={styles.trackingArea}>
                            <div style={styles.trackStep}>
                                <Package size={16} color="#3b82f6" />
                                <span><b>Dispatch:</b> Vendor Local Hub</span>
                            </div>

                            <div style={styles.line}>
                                <Clock size={14} color="#94a3b8" /> 
                                <span>{isDelivered ? 'Arrived at Destination' : `ETA: ${order.delivery_minutes || 6} mins`}</span>
                            </div>

                            <div style={styles.trackStep}>
                                <MapPin size={16} color="#10b981" />
                                <span><b>Deliver to:</b> {order.delivery_address || 'Registered Address'}</span>
                            </div>
                        </div>

                        {order.status === 'Confirmed' && (
                            <p style={styles.msg}>🚚 Live Status: Your order is confirmed and moving toward Konanki.</p>
                        )}
                        {isDelivered && (
                            <p style={{...styles.msg, color: '#10b981'}}>
                                <CheckCircle size={14} style={{display: 'inline', marginRight: '5px', verticalAlign: 'middle'}}/> 
                                Delivered Successfully.
                            </p>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

const styles = {
    card: { background: '#fff', padding: '20px', borderRadius: '15px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' },
    productHeader: { display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' },
    orderImg: { width: '70px', height: '70px', borderRadius: '12px', objectFit: 'contain', background: '#f1f5f9', border: '1px solid #f0f0f0', padding: '5px' },
    pName: { margin: 0, fontSize: '16px', fontWeight: '800', color: '#1e293b' },
    orderIdText: { fontSize: '12px', color: '#64748b', marginTop: '2px' },
    trackingArea: { background: '#f8fafc', padding: '15px', borderRadius: '12px', borderLeft: '4px solid #3b82f6' },
    trackStep: { display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px', margin: '5px 0' },
    line: { margin: '5px 30px', fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '10px', borderLeft: '2px dashed #cbd5e1', paddingLeft: '20px' },
    statusGreen: { color: '#166534', background: '#dcfce7', padding: '4px 12px', borderRadius: '20px', fontSize: '10px', fontWeight: '900' },
    statusBlue: { color: '#1e40af', background: '#dbeafe', padding: '4px 12px', borderRadius: '20px', fontSize: '10px', fontWeight: '900' },
    msg: { marginTop: '15px', fontSize: '12px', color: '#2874f0', fontWeight: '600', fontStyle: 'italic' }
};

export default CustomerOrders;