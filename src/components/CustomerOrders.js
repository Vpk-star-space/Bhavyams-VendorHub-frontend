import React from 'react';
import { MapPin, CheckCircle, ChevronRight } from 'lucide-react';

const CustomerOrders = ({ orders }) => {
    if (!orders || orders.length === 0) return <p style={{textAlign: 'center', color: '#64748b', padding: '40px'}}>No orders yet. Start shopping!</p>;

    // 🌐 SMART IMAGE LOGIC
    const getProductImg = (item) => {
        const rawUrl = item.image_url || item.product_image || ''; 
        if (!rawUrl) return 'https://via.placeholder.com/150?text=No+Image';
        
        const cleanUrl = rawUrl.replace(/["\\]/g, ''); 
        if (cleanUrl.startsWith('http')) return cleanUrl;
        return `https://bhavyams-vendorhub-backend.onrender.com${cleanUrl.startsWith('/') ? '' : '/'}${cleanUrl}`;
    };

    // 🎯 FLIPKART TRACKING LOGIC
    const getTrackingStatus = (status) => {
        const safeStatus = (status || 'Ordered').toLowerCase();
        
        if (safeStatus.includes('deliver')) return 3; // Step 4: Delivered
        if (safeStatus.includes('out') || safeStatus.includes('transit')) return 2; // Step 3: Out for Delivery
        if (safeStatus.includes('ship') || safeStatus.includes('dispatch')) return 1; // Step 2: Shipped
        return 0; // Step 1: Ordered / Confirmed
    };

    const trackingSteps = ['Ordered', 'Shipped', 'Out for Delivery', 'Delivered'];

    return (
        <div style={{display: 'flex', flexDirection: 'column', gap: '20px'}}>
            {orders.map((order) => {
                const isDelivered = order.status === 'Delivered';
                const currentStepIndex = getTrackingStatus(order.status);
                
                return (
                    <div key={order.id} style={styles.card}>
                        
                        {/* 📦 TOP ROW: Product Info */}
                        <div style={styles.productHeader}>
                            <img 
                                src={getProductImg(order)} 
                                alt={order.product_name} 
                                style={styles.orderImg}
                                onError={(e) => { e.target.src = 'https://via.placeholder.com/150?text=Error'; }}
                            />
                            <div style={{flex: 1}}>
                                <h4 style={styles.pName}>{order.product_name || "Product Name Loading..."}</h4>
                                <div style={styles.sellerText}>Seller: Bhavyams Vendor</div>
                                <div style={styles.priceText}>₹{order.total_price}</div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '12px', color: '#878787' }}>Order ID</div>
                                <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#212121' }}>#{order.id}</div>
                            </div>
                        </div>

                        {/* 🛤️ FLIPKART-STYLE VISUAL TRACKING TIMELINE */}
                        <div style={styles.timelineContainer}>
                            {trackingSteps.map((step, index) => {
                                const isCompleted = index <= currentStepIndex;
                                const isLast = index === trackingSteps.length - 1;

                                return (
                                    <React.Fragment key={step}>
                                        {/* The Dot & Label */}
                                        <div style={styles.stepWrapper}>
                                            <div style={{
                                                ...styles.dot, 
                                                backgroundColor: isCompleted ? '#26a541' : '#e0e0e0',
                                                border: isCompleted ? '2px solid #26a541' : '2px solid #e0e0e0'
                                            }} />
                                            <span style={{
                                                ...styles.stepLabel, 
                                                color: isCompleted ? '#212121' : '#878787',
                                                fontWeight: isCompleted ? '600' : 'normal'
                                            }}>
                                                {step}
                                            </span>
                                        </div>
                                        
                                        {/* The Connecting Line */}
                                        {!isLast && (
                                            <div style={{
                                                ...styles.connectorLine, 
                                                backgroundColor: index < currentStepIndex ? '#26a541' : '#e0e0e0'
                                            }} />
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </div>

                        <hr style={styles.divider} />

                        {/* 🚚 DELIVERY FOOTER */}
                        <div style={styles.deliveryFooter}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {isDelivered ? (
                                    <CheckCircle size={18} color="#26a541" />
                                ) : (
                                    <MapPin size={18} color="#2874f0" />
                                )}
                                <div>
                                    <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#212121' }}>
                                        {isDelivered ? 'Delivered Successfully' : `Delivery to ${order.delivery_address || 'Registered Address'}`}
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#878787', marginTop: '2px' }}>
                                        {isDelivered 
                                            ? 'Package handed to resident' 
                                            : (currentStepIndex === 0 ? 'Your order is confirmed and moving toward Konanki.' : `ETA: ${order.delivery_minutes || 6} mins`)
                                        }
                                    </div>
                                </div>
                            </div>
                            
                            {!isDelivered && (
                                <button style={styles.trackBtn}>
                                    Track <ChevronRight size={14} />
                                </button>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

const styles = {
    card: { background: '#fff', borderRadius: '4px', border: '1px solid #e0e0e0', boxShadow: '0 1px 2px rgba(0,0,0,0.1)', overflow: 'hidden' },
    productHeader: { display: 'flex', alignItems: 'center', gap: '15px', padding: '20px', borderBottom: '1px solid #f0f0f0' },
    orderImg: { width: '80px', height: '80px', objectFit: 'contain' },
    pName: { margin: 0, fontSize: '15px', fontWeight: '600', color: '#212121', marginBottom: '4px' },
    sellerText: { fontSize: '12px', color: '#878787', marginBottom: '6px' },
    priceText: { fontSize: '16px', fontWeight: 'bold', color: '#212121' },
    
    timelineContainer: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '30px 40px 10px 40px' },
    stepWrapper: { display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', zIndex: 2, width: '60px' },
    dot: { width: '12px', height: '12px', borderRadius: '50%', background: '#fff', zIndex: 2 },
    stepLabel: { fontSize: '11px', marginTop: '8px', textAlign: 'center', width: '80px' },
    connectorLine: { flex: 1, height: '3px', marginTop: '5px', marginLeft: '-20px', marginRight: '-20px', zIndex: 1 },
    
    divider: { border: 'none', borderTop: '1px solid #f0f0f0', margin: '15px 0 0 0' },
    deliveryFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 20px', background: '#fafafa' },
    trackBtn: { background: 'transparent', border: 'none', color: '#2874f0', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '2px' }
};

export default CustomerOrders;