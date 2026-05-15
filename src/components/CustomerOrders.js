import React, { useState, useEffect } from 'react';
import { Search, Star, Download, ChevronRight,  } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import axios from 'axios';
import { toast } from 'react-toastify';

const CustomerOrders = ({ orders }) => {
    // 👤 Get current user's REAL details from local storage
    const currentUser = JSON.parse(localStorage.getItem('user')) || {};
    const customerName = currentUser.username || currentUser.name || 'Customer';
    const customerPhone = currentUser.phone || currentUser.mobile || 'Not Provided';

    // 🔄 STATE
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    
    // 🔍 SEARCH & FILTER STATE
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilters, setActiveFilters] = useState([]);

    // ⭐ REVIEW STATE
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState("");
    const [showReviewForm, setShowReviewForm] = useState(false);
    const [newlyReviewed, setNewlyReviewed] = useState({}); // Tracks reviews made in this session

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Reset review form when switching orders
    useEffect(() => {
        if (selectedOrder) {
            setRating(selectedOrder.existing_rating || 5);
            setComment(selectedOrder.existing_comment || "");
            setShowReviewForm(false);
        }
    }, [selectedOrder]);

    if (!orders || orders.length === 0) {
        return <div style={{textAlign: 'center', padding: '50px', background: '#fff', marginTop: '20px'}}>
            <img src="https://static-assets-web.flixcart.com/fk-p-linchpin-web/batman-returns/images/empty-orders-5677f2.png" alt="Empty" style={{width: '250px'}} />
            <h3 style={{marginTop: '20px'}}>You have no orders</h3>
            <button style={styles.shopNowBtn} onClick={() => window.location.href = '/'}>Start Shopping</button>
        </div>;
    }

    const getProductImg = (item) => {
        const rawUrl = item.image_url || item.product_image || ''; 
        if (!rawUrl) return 'https://via.placeholder.com/150?text=No+Image';
        const cleanUrl = rawUrl.replace(/["\\]/g, ''); 
        return cleanUrl.startsWith('http') ? cleanUrl : `https://bhavyams-vendorhub-backend.onrender.com${cleanUrl.startsWith('/') ? '' : '/'}${cleanUrl}`;
    };

    const getTrackingStatus = (status) => {
        const safeStatus = (status || '').toLowerCase();
        if (safeStatus.includes('deliver')) return 3; 
        if (safeStatus.includes('out') || safeStatus.includes('transit')) return 2; 
        if (safeStatus.includes('ship') || safeStatus.includes('dispatch') || safeStatus.includes('confirm')) return 1; 
        return 0; 
    };

    // 🟢 WORKING FILTER LOGIC
    const handleFilterChange = (status) => {
        setActiveFilters(prev => 
            prev.includes(status) ? prev.filter(f => f !== status) : [...prev, status]
        );
    };

    const displayedOrders = orders.filter(order => {
        const matchesSearch = (order.product_name || '').toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = activeFilters.length === 0 || activeFilters.includes(order.status);
        return matchesSearch && matchesFilter;
    });

    // ⭐ WORKING REVIEW LOGIC
    const submitReview = async () => {
        const pId = selectedOrder.product_id || selectedOrder.productId || selectedOrder.p_id;
        const oId = selectedOrder.id || selectedOrder.order_id;
        if (!pId) return toast.error("Error: Product ID missing");
        try {
            const token = localStorage.getItem('token');
            await axios.post('https://bhavyams-vendorhub-backend.onrender.com/api/orders/add-review', {
                orderId: oId, productId: pId, rating: parseInt(rating), comment: comment
            }, { headers: { Authorization: `Bearer ${token}` } });
            toast.success("Review submitted successfully!");
            setShowReviewForm(false);
            setNewlyReviewed(prev => ({...prev, [oId]: true}));
        } catch (err) { 
            toast.error(err.response?.data?.message || "Failed to post review"); 
        }
    };

    // 📄 DYNAMIC INVOICE GENERATOR
    const handleDownloadInvoice = (order) => {
        const doc = new jsPDF();
        
        doc.setFontSize(22);
        doc.setTextColor(40, 116, 240); 
        doc.text("Bhavyams Vendor Hub", 14, 22);
        
        doc.setFontSize(16);
        doc.setTextColor(33, 33, 33);
        doc.text("Tax Invoice", 14, 32);
        
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text(`Order ID: OD${order.id}426100`, 14, 42);
        doc.text(`Invoice Date: ${new Date().toLocaleDateString()}`, 14, 48);
        
        doc.setTextColor(33, 33, 33);
        doc.setFontSize(11);
        doc.text("Billed To:", 14, 60);
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        // 🟢 REAL USER DATA
        doc.text(customerName, 14, 66); 
        doc.text(`Phone: ${customerPhone}`, 14, 72);
        
        const splitAddress = doc.splitTextToSize(order.delivery_address || currentUser.address || 'Address not provided', 80);
        doc.text(splitAddress, 14, 78);

        autoTable(doc, {
            startY: 105,
            head: [['Product Description', 'Qty', 'Unit Price', 'Total Amount']],
            body: [
                [order.product_name || 'Bhavyams Product', '1', `Rs. ${order.total_price}`, `Rs. ${order.total_price}`]
            ],
            theme: 'grid',
            headStyles: { fillColor: [40, 116, 240], textColor: [255, 255, 255] },
            styles: { fontSize: 10 }
        });

        const finalY = doc.lastAutoTable.finalY || 130;
        doc.setFontSize(12);
        doc.setTextColor(33, 33, 33);
        doc.text(`Grand Total: Rs. ${order.total_price}`, 14, finalY + 15);
        
        doc.save(`Invoice_OD${order.id}.pdf`);
    };

    // ==========================================
    // 📄 VIEW 1: THE MAIN ORDER LIST
    // ==========================================
    if (!selectedOrder) {
        return (
            <div style={{ display: 'flex', gap: '15px', alignItems: 'flex-start' }}>
                
                {/* 👈 LEFT SIDEBAR FILTERS */}
                {!isMobile && (
                    <div style={styles.filterSidebar}>
                        <h2 style={{ fontSize: '16px', fontWeight: '500', padding: '15px', borderBottom: '1px solid #f0f0f0', margin: 0 }}>Filters</h2>
                        
                        <div style={{ padding: '15px' }}>
                            <div style={styles.filterSectionTitle}>ORDER STATUS</div>
                            <label style={styles.checkboxLabel}>
                                <input type="checkbox" onChange={() => handleFilterChange('Confirmed')} style={{marginRight: '10px'}}/> On the way
                            </label>
                            <label style={styles.checkboxLabel}>
                                <input type="checkbox" onChange={() => handleFilterChange('Delivered')} style={{marginRight: '10px'}}/> Delivered
                            </label>
                            <label style={styles.checkboxLabel}>
                                <input type="checkbox" onChange={() => handleFilterChange('Cancelled')} style={{marginRight: '10px'}}/> Cancelled
                            </label>
                        </div>
                    </div>
                )}

                {/* 👉 RIGHT MAIN CONTENT */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    
                    {/* 🟢 REAL SEARCH BAR */}
                    <div style={styles.searchContainer}>
                        <input 
                            type="text" 
                            placeholder="Search your orders here" 
                            style={styles.searchInput} 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <button style={styles.searchBtn}>
                            <Search size={18} color="#fff" style={{marginRight: '5px'}}/> Search Orders
                        </button>
                    </div>

                    {displayedOrders.length === 0 ? (
                        <div style={{textAlign: 'center', padding: '40px', background: '#fff', color: '#878787'}}>No matching orders found.</div>
                    ) : (
                        displayedOrders.map((order) => {
                            const isDelivered = order.status === 'Delivered';
                            return (
                                <div key={order.id} style={styles.listCard} onClick={() => setSelectedOrder(order)}>
                                    <div style={{ display: 'flex', alignItems: 'center', width: '100%', gap: '15px', flexDirection: isMobile ? 'column' : 'row' }}>
                                        <div style={{ display: 'flex', gap: '20px', flex: 2, alignItems: 'center', width: '100%' }}>
                                            <img src={getProductImg(order)} alt={order.product_name} style={styles.listImg} />
                                            <div>
                                                <div style={styles.listTitle}>{order.product_name || "Product Item"}</div>
                                                <div style={styles.listSubtitle}>Color: Default</div>
                                            </div>
                                        </div>
                                        <div style={{ flex: 1, fontSize: '16px', fontWeight: 'bold', width: '100%' }}>
                                            ₹{order.total_price}
                                        </div>
                                        <div style={{ flex: 2, width: '100%' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '600', color: '#212121' }}>
                                                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: isDelivered ? '#26a541' : '#2874f0' }} />
                                                {isDelivered ? 'Delivered successfully' : (order.status || 'Ordered')}
                                            </div>
                                            <div style={{ fontSize: '12px', color: '#212121', marginTop: '5px' }}>
                                                {isDelivered ? 'Your item has been delivered' : 'Your item is on the way'}
                                            </div>
                                            {isDelivered && (
                                                <div style={{ color: '#2874f0', fontSize: '14px', fontWeight: '500', marginTop: '12px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                    <Star size={16} fill="#2874f0" /> Rate & Review Product
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
        );
    }

    // ==========================================
    // 🔍 VIEW 2: THE ORDER DETAILS PAGE
    // ==========================================
    const isDelivered = selectedOrder.status === 'Delivered';
    const currentStepIndex = getTrackingStatus(selectedOrder.status);
    const trackingSteps = ['Ordered', 'Packed', 'Shipped', 'Delivered'];
    
    const listingPrice = Math.round(Number(selectedOrder.total_price) * 1.15); 
    const discount = listingPrice - Number(selectedOrder.total_price);

    const hasReviewed = !!selectedOrder.existing_rating || newlyReviewed[selectedOrder.id];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            
            <div style={styles.breadcrumbs}>
                <span style={{cursor: 'pointer'}} onClick={() => setSelectedOrder(null)}>Home</span> <ChevronRight size={14} />
                <span style={{cursor: 'pointer'}} onClick={() => setSelectedOrder(null)}>My Account</span> <ChevronRight size={14} />
                <span style={{cursor: 'pointer', color: '#2874f0', fontWeight: '500'}} onClick={() => setSelectedOrder(null)}>My Orders</span> <ChevronRight size={14} />
                <span style={{color: '#878787'}}>OD{selectedOrder.id}426100</span>
            </div>

            <div style={{ display: 'flex', gap: '15px', flexDirection: isMobile ? 'column' : 'row', alignItems: 'flex-start' }}>
                <div style={{ flex: 2, width: '100%', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <div style={styles.detailsMainCard}>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f0f0f0', paddingBottom: '20px' }}>
                            <div>
                                <h2 style={{ margin: '0 0 10px 0', fontSize: '18px', color: '#212121', fontWeight: '500' }}>{selectedOrder.product_name}</h2>
                                <div style={{ fontSize: '12px', color: '#878787', marginBottom: '10px' }}>Seller: Bhavyams Vendor Hub</div>
                                <div style={{ fontSize: '24px', fontWeight: '500', color: '#212121' }}>₹{selectedOrder.total_price}</div>
                            </div>
                            <img src={getProductImg(selectedOrder)} alt="Product" style={{ width: '100px', height: '100px', objectFit: 'contain' }} />
                        </div>

                        <div style={{ padding: '30px 20px' }}>
                            {trackingSteps.map((step, index) => {
                                const isCompleted = index <= currentStepIndex;
                                const isLast = index === trackingSteps.length - 1;
                                return (
                                    <div key={step} style={{ display: 'flex', gap: '20px', height: isLast ? 'auto' : '60px' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '16px' }}>
                                            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: isCompleted ? '#26a541' : '#e0e0e0', zIndex: 2 }} />
                                            {!isLast && <div style={{ width: '2px', height: '100%', background: index < currentStepIndex ? '#26a541' : '#e0e0e0', marginTop: '-2px', marginBottom: '-2px' }} />}
                                        </div>
                                        <div style={{ marginTop: '-2px' }}>
                                            <div style={{ fontSize: '14px', fontWeight: isCompleted ? '500' : 'normal', color: isCompleted ? '#212121' : '#878787' }}>
                                                {step} {isCompleted && (index === 0 ? 'Confirmed' : '')}
                                            </div>
                                            {isCompleted && index === 3 && <div style={{ fontSize: '12px', color: '#878787', marginTop: '4px' }}>Your item has been delivered</div>}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* 🟢 REAL REVIEW LOGIC */}
                    {isDelivered && (
                        <div style={styles.detailsMainCard}>
                            <h3 style={{ fontSize: '16px', margin: '0 0 15px 0' }}>Rate your experience</h3>
                            
                            {hasReviewed ? (
                                <div style={{ padding: '15px', background: '#f5faff', borderRadius: '4px', border: '1px solid #c2e0ff' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 'bold', color: '#2874f0' }}>
                                        <Star size={16} fill="#2874f0" /> You rated this product {rating}/5
                                    </div>
                                    {comment && <div style={{ marginTop: '10px', fontSize: '14px', color: '#64748b', fontStyle: 'italic' }}>"{comment}"</div>}
                                </div>
                            ) : showReviewForm ? (
                                <div style={{ background: '#fff' }}>
                                    <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                                        {[1,2,3,4,5].map(star => (
                                            <Star key={star} size={28} onClick={() => setRating(star)} color={rating >= star ? "#2874f0" : "#e0e0e0"} fill={rating >= star ? "#2874f0" : "none"} style={{cursor: 'pointer'}} />
                                        ))}
                                    </div>
                                    <textarea placeholder="Write a review..." value={comment} onChange={(e) => setComment(e.target.value)} style={styles.textarea} />
                                    <div style={{display:'flex', gap:'10px'}}>
                                        <button onClick={submitReview} style={styles.submitReviewBtn}>SUBMIT REVIEW</button>
                                        <button onClick={() => setShowReviewForm(false)} style={styles.cancelBtn}>CANCEL</button>
                                    </div>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ color: '#878787', fontSize: '14px' }}>Rate the product</span>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        {[1,2,3,4,5].map(star => <Star key={star} size={28} color="#e0e0e0" style={{cursor: 'pointer'}} onClick={() => {setRating(star); setShowReviewForm(true);}} />)}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* 👉 RIGHT COLUMN: Delivery & Price Details */}
                <div style={{ flex: 1, width: '100%', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    
                    <div style={styles.sideCard}>
                        <h3 style={{ fontSize: '16px', borderBottom: '1px solid #f0f0f0', paddingBottom: '15px', margin: '0 0 15px 0' }}>Delivery details</h3>
                        {/* 🟢 DYNAMIC PROFILE DATA */}
                        <div style={{ fontSize: '14px', color: '#212121', fontWeight: '500', marginBottom: '8px' }}>{customerName}</div>
                        <div style={{ fontSize: '14px', color: '#212121', lineHeight: '1.5', marginBottom: '15px' }}>
                            {selectedOrder.delivery_address || currentUser.address || 'Address not provided'}
                        </div>
                        <div style={{ fontSize: '14px', color: '#212121' }}><span style={{color: '#878787'}}>Phone number: </span> {customerPhone}</div>
                    </div>

                    <div style={styles.sideCard}>
                        <h3 style={{ fontSize: '16px', borderBottom: '1px solid #f0f0f0', paddingBottom: '15px', margin: '0 0 15px 0' }}>Price details</h3>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '14px' }}>
                            <span>Listing price</span>
                            <span>₹{listingPrice}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '14px' }}>
                            <span>Selling price</span>
                            <span>₹{selectedOrder.total_price}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', fontSize: '14px', color: '#388e3c' }}>
                            <span>Discount</span>
                            <span>- ₹{discount}</span>
                        </div>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '15px 0', borderTop: '1px dashed #e0e0e0', borderBottom: '1px dashed #e0e0e0', fontWeight: 'bold', fontSize: '16px' }}>
                            <span>Total amount</span>
                            <span>₹{selectedOrder.total_price}</span>
                        </div>

                        {/* 🟢 ALWAYS SHOW BUTTON, HANDLE LOGIC IN ONCLICK */}
                        <button 
                            style={{
                                ...styles.invoiceBtn, 
                                opacity: isDelivered ? 1 : 0.7, // Slightly fade the button if it's not delivered yet
                                cursor: 'pointer'
                            }} 
                            onClick={() => {
                                if (isDelivered) {
                                    handleDownloadInvoice(selectedOrder);
                                } else {
                                    toast.info("Invoice will be available to download once the order is delivered.");
                                }
                            }}
                        >
                            <Download size={16} /> Download Invoice
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const styles = {
    shopNowBtn: { background: '#2874f0', color: '#fff', border: 'none', padding: '12px 30px', fontWeight: 'bold', borderRadius: '2px', cursor: 'pointer' },
    searchContainer: { display: 'flex', width: '100%', background: '#fff', border: '1px solid #e0e0e0', borderRadius: '4px', overflow: 'hidden' },
    searchInput: { flex: 1, border: 'none', padding: '12px 20px', outline: 'none', fontSize: '14px' },
    searchBtn: { background: '#2874f0', color: '#fff', border: 'none', padding: '0 25px', display: 'flex', alignItems: 'center', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' },
    invoiceBtn: { width: '100%', background: '#fff', border: '1px solid #e0e0e0', padding: '12px', marginTop: '15px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', fontWeight: 'bold', color: '#2874f0', transition: '0.2s', '&:hover': { background: '#f5faff' } },
    filterSidebar: { width: '250px', background: '#fff', border: '1px solid #e0e0e0', borderRadius: '2px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' },
    filterSectionTitle: { fontSize: '12px', fontWeight: 'bold', color: '#878787', marginBottom: '15px', letterSpacing: '0.5px' },
    checkboxLabel: { display: 'flex', alignItems: 'center', fontSize: '14px', color: '#212121', marginBottom: '12px', cursor: 'pointer' },
    listCard: { background: '#fff', border: '1px solid #e0e0e0', borderRadius: '4px', padding: '20px', cursor: 'pointer', transition: 'box-shadow 0.2s', '&:hover': { boxShadow: '0 3px 6px rgba(0,0,0,0.1)' } },
    listImg: { width: '80px', height: '80px', objectFit: 'contain' },
    listTitle: { fontSize: '14px', fontWeight: '500', color: '#212121', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' },
    listSubtitle: { fontSize: '12px', color: '#878787', marginTop: '8px' },
    breadcrumbs: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#878787', padding: '10px 0' },
    detailsMainCard: { background: '#fff', border: '1px solid #e0e0e0', borderRadius: '4px', padding: '25px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' },
    sideCard: { background: '#fff', border: '1px solid #e0e0e0', borderRadius: '4px', padding: '25px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' },
    textarea: { width: '100%', height: '80px', padding: '10px', borderRadius: '4px', border: '1px solid #e0e0e0', marginBottom: '10px', outline: 'none', fontFamily: 'inherit' },
    submitReviewBtn: { background: '#2874f0', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '2px', fontWeight: 'bold', cursor: 'pointer', flex: 1 },
    cancelBtn: { background: '#fff', color: '#212121', border: '1px solid #e0e0e0', padding: '10px 20px', borderRadius: '2px', cursor: 'pointer', fontWeight: 'bold' }
};

export default CustomerOrders;