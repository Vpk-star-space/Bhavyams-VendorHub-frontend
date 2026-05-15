import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, ShoppingBag, ArrowLeft, Shield, Plus, Minus, Award } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { toast } from 'react-toastify';
import axios from 'axios';

const Cart = () => {
    const { cart, addToCart, removeFromCart, clearCart } = useCart();
    const navigate = useNavigate();
    
    // 🔄 STATES
    const [isCheckingOut, setIsCheckingOut] = useState(false);
    const [orderPlaced, setOrderPlaced] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    
    // 🟢 OPTIMISTIC UI STATE: This stops the screen from flashing!
    const [liveCart, setLiveCart] = useState([]);
    const [isInitialLoad, setIsInitialLoad] = useState(true);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // 🟢 Sync liveCart with the database cart, but mask the initial loading delay
    useEffect(() => {
        setLiveCart(cart);
        if (cart.length > 0) setIsInitialLoad(false);
        
        // Failsafe: if cart is actually empty, stop showing loading after 1 second
        const timer = setTimeout(() => setIsInitialLoad(false), 1000);
        return () => clearTimeout(timer);
    }, [cart]);

    const currentUser = JSON.parse(localStorage.getItem('user')) || {};

    // 💰 DYNAMIC PRICE CALCULATIONS (Now using liveCart for instant updates)
    const totalCartItems = liveCart.reduce((total, item) => total + (item.quantity || 1), 0);
    const subtotal = liveCart.reduce((total, item) => total + (Number(item.price) * (item.quantity || 1)), 0);
    const discount = Math.round(subtotal * 0.1); 
    
    // 🚚 FREE DELIVERY PROGRESS LOGIC
    const deliveryThreshold = 1000;
    const delivery = subtotal >= deliveryThreshold ? 0 : 40; 

    
    // FINAL TOTAL
    const total = subtotal - discount + delivery;

    const hasOutofStock = liveCart.some(item => {
        const stock = item.stock_count ?? item.stock ?? 0;
        return item.quantity > stock;
    });

    const getDeliveryDate = () => {
        const d = new Date();
        d.setDate(d.getDate() + 3);
        return d.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' });
    };

    // 🟢 INSTANT UI ACTIONS (No Flashing)
    const handleIncrease = (item) => {
        // 1. Update screen instantly
        setLiveCart(prev => prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i));
        // 2. Tell DB in background
        addToCart(item); 
    };

    const handleDecrease = async (item) => {
        if (item.quantity <= 1) {
            handleRemove(item.id);
            return;
        }
        // 1. Update screen instantly
        setLiveCart(prev => prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity - 1 } : i));
        
        // 2. Tell DB in background
        try {
            const token = localStorage.getItem('token');
            await axios.post('https://bhavyams-vendorhub-backend.onrender.com/api/cart/add', 
                { productId: item.id, quantity: -1 }, 
                { headers: { Authorization: `Bearer ${token}` } }
            );
        } catch (err) {
            toast.error("Failed to decrease quantity.");
            setLiveCart(cart); // Revert if backend fails
        }
    };

    const handleRemove = (id) => {
        // 1. Remove from screen instantly
        setLiveCart(prev => prev.filter(i => i.id !== id));
        // 2. Tell DB in background
        removeFromCart(id);
    };

    const handleCheckout = async () => {
    const token = localStorage.getItem('token');
    if (!token) return navigate('/login');
    
    if (hasOutofStock) return toast.error("Please remove Out of Stock items before checking out!");

    setIsCheckingOut(true);
    try {
        const { data: freshUser } = await axios.get('https://bhavyams-vendorhub-backend.onrender.com/api/auth/me', {
            headers: { Authorization: `Bearer ${token}` }
        });
        localStorage.setItem('user', JSON.stringify(freshUser));
        
        if (!freshUser.address || freshUser.address.length < 5) {
            toast.error("❌ Add your address in 'My Profile' first!");
            navigate('/dashboard'); 
            setIsCheckingOut(false);
            return;
        }

        const { data: keyData } = await axios.get('https://bhavyams-vendorhub-backend.onrender.com/api/orders/get-razorpay-key', {
            headers: { Authorization: `Bearer ${token}` }
        });

        const { data: orderData } = await axios.post('https://bhavyams-vendorhub-backend.onrender.com/api/orders/checkout', 
            { cartItems: liveCart, finalTotal: total }, { headers: { Authorization: `Bearer ${token}` } }
        );

        const options = {
            key: keyData.key, 
            amount: orderData.razorpayOrder.amount, 
            currency: "INR",
            name: "Bhavyams VendorHub",
            description: "Secure Payment",
            order_id: orderData.razorpayOrder.id,
            handler: async function (response) {
                try {
                    // 🚀 FIXED: Pass 'finalTotal: total' inside the request payload body!
                    const verifyRes = await axios.post('https://bhavyams-vendorhub-backend.onrender.com/api/orders/verify-payment', 
                        { 
                            ...response, 
                            cartItems: liveCart,
                            finalTotal: total // 👈 This maps your local total summary state to the backend route
                        }, 
                        { headers: { Authorization: `Bearer ${token}` } }
                    );
                    if (verifyRes.data.status === 'success') {
                        clearCart();
                        setOrderPlaced(true);
                    }
                } catch (err) {
                    toast.error(err.response?.data?.message || "Payment Verification Failed");
                }
            },
            prefill: { name: freshUser.username, email: freshUser.email },
            theme: { color: "#2874f0" },
            modal: { ondismiss: () => setIsCheckingOut(false) }
        };
        new window.Razorpay(options).open();
    } catch (err) { 
        toast.error(err.response?.data?.message || "Item is out of stock or error occurred."); 
    } finally { 
        setIsCheckingOut(false); 
    }
};


    // 🟢 PROFESSIONAL SUCCESS SCREEN
    if (orderPlaced) return (
        <div style={styles.successScreen}>
            <CheckCircle size={84} color="#26a541" style={{marginBottom: '15px'}} />
            <h1 style={{fontSize: '26px', margin: '0 0 10px 0', color: '#212121'}}>Order Placed Successfully!</h1>
            <p style={{fontSize: '15px', color: '#878787', marginBottom: '30px'}}>Thank you for shopping with Bhavyams Vendor Hub.</p>
            <div style={{display: 'flex', gap: '15px', justifyContent: 'center', flexDirection: isMobile ? 'column' : 'row'}}>
                <button onClick={() => navigate('/')} style={styles.successShopBtn}>CONTINUE SHOPPING</button>
                <button 
                    onClick={() => {
                        localStorage.setItem('dashboardTargetTab', 'orders'); 
                        navigate('/dashboard', { state: { activeTab: 'orders' } }); 
                    }} 
                    style={styles.successOrderBtn}>
                    VIEW MY ORDERS
                </button>
            </div>
        </div>
    );

    return (
        <div style={styles.page}>
            <header style={styles.fkHeader}>
                <div style={styles.headerContent}>
                   <div style={{display:'flex', alignItems:'center', gap:'15px'}}>
                       <ArrowLeft size={20} onClick={() => navigate('/')} style={{cursor:'pointer'}} />
                       <h2 style={{margin: 0, fontSize: '18px'}}>My Cart ({totalCartItems})</h2>
                   </div>
                </div>
            </header>

            <div style={styles.container}>
                {isInitialLoad ? (
                    // 🟢 MASK THE FLASHING EMPTY SCREEN
                    <div style={{textAlign: 'center', padding: '80px 20px', color: '#878787'}}>
                        <ShoppingBag size={40} color="#e0e0e0" style={{marginBottom: '10px'}} />
                        <p>Loading your cart...</p>
                    </div>
                ) : liveCart.length === 0 ? (
                    <div style={styles.emptyCart}>
                        <ShoppingBag size={80} color="#2874f0" />
                        <h3>Your cart is empty!</h3>
                        <button onClick={() => navigate('/')} style={styles.shopNowBtn}>Shop Now</button>
                    </div>
                ) : (
                    <div style={isMobile ? styles.mobileCartGrid : styles.cartGrid}>
                        
                        {/* 👈 LEFT COLUMN: ITEMS */}
                        <div style={{display: 'flex', flexDirection: 'column', gap: '15px'}}>
                            <div style={styles.itemColumn}>
                                
                                <div style={styles.addressBar}>
                                    <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                                        <span style={{color: '#878787'}}>Deliver to:</span> 
                                        <b>{currentUser.username || 'Customer'}</b> 
                                        {currentUser.pincode && (
                                            <span style={{background: '#f0f0f0', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold'}}>
                                                {currentUser.pincode}
                                            </span>
                                        )}
                                    </div>
                                    <button onClick={() => navigate('/dashboard')} style={styles.changeBtn}>Change</button>
                                </div>

                                {/* 🚚 SIMPLE FREE DELIVERY MESSAGE */}
                                <div style={{padding: '16px 24px', background: delivery === 0 ? '#f0faf1' : '#f5faff', borderBottom: '1px solid #f0f0f0'}}>
                                    <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                                        <div style={{
                                            background: delivery === 0 ? '#26a541' : '#2874f0', 
                                            color: '#fff', 
                                            borderRadius: '50%', 
                                            width: '24px', 
                                            height: '24px', 
                                            display: 'flex', 
                                            justifyContent: 'center', 
                                            alignItems: 'center', 
                                            fontSize: '12px'
                                        }}>
                                            {delivery === 0 ? '✓' : '🚚'}
                                        </div>
                                        <div style={{fontSize: '14px', color: '#212121'}}>
                                            {delivery === 0 ? (
                                                <span><b>Congratulations!</b> You've unlocked <b style={{color: '#26a541'}}>Free Delivery</b></span>
                                            ) : (
                                                <span>Add items worth <b style={{color: '#2874f0'}}>₹{deliveryThreshold - subtotal}</b> more to get <b>Free Delivery</b></span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {liveCart.map(item => {
                                    const rawUrl = item.image_url || '';
                                    const imageSrc = rawUrl.replace(/["\\]/g, '').startsWith('http') 
                                        ? rawUrl.replace(/["\\]/g, '') 
                                        : `https://bhavyams-vendorhub-backend.onrender.com${rawUrl.replace(/["\\]/g, '').startsWith('/') ? '' : '/'}${rawUrl.replace(/["\\]/g, '')}`;

                                    const currentStock = item.stock_count ?? item.stock ?? 0;
                                    const isLowStock = currentStock > 0 && currentStock <= 5;
                                    const isOutOfStock = currentStock === 0 || item.quantity > currentStock;

                                    return (
                                        <div key={item.id} style={styles.itemCard}>
                                            <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px'}}>
                                                <img src={imageSrc} alt={item.name} style={styles.img} onError={(e) => { e.target.src = 'https://via.placeholder.com/80?text=No+Image'; }} />
                                                
                                                <div style={styles.qtyContainer}>
                                                    <button onClick={() => handleDecrease(item)} style={styles.qtyBtn}><Minus size={12} /></button>
                                                    <div style={styles.qtyBox}>{item.quantity || 1}</div>
                                                    <button onClick={() => handleIncrease(item)} style={styles.qtyBtn}><Plus size={12} /></button>
                                                </div>
                                            </div>

                                            <div style={styles.details}>
                                                <div style={styles.itemName}>{item.name}</div>
                                                <div style={styles.sellerText}>Seller: Bhavyams Vendor Hub</div>
                                                
                                                <div style={{display: 'flex', alignItems: 'center', gap: '5px', marginTop: '6px'}}>
                                                    <Award size={14} color="#2874f0" />
                                                    <span style={{fontSize: '11px', fontWeight: 'bold', fontStyle: 'italic', color: '#2874f0'}}>Bhavyams Assured</span>
                                                </div>

                                                <div style={{display: 'flex', alignItems: 'center', gap: '10px', margin: '12px 0'}}>
                                                    <span style={{fontSize: '14px', color: '#878787', textDecoration: 'line-through'}}>₹{Math.round(item.price * 1.15)}</span>
                                                    <span style={styles.itemPrice}>₹{item.price}</span>
                                                    <span style={{fontSize: '12px', color: '#388e3c', fontWeight: 'bold'}}>15% Off</span>
                                                </div>
                                                
                                                <div style={{fontSize: '12px', color: '#212121', marginBottom: '10px'}}>
                                                    Delivery by {getDeliveryDate()} | <span style={{color: delivery === 0 ? '#388e3c' : '#878787'}}>{delivery === 0 ? 'Free' : `₹${delivery}`}</span>
                                                </div>

                                                <div style={{fontSize: '13px', fontWeight: 'bold', color: isOutOfStock || isLowStock ? '#ef4444' : '#388e3c', marginBottom: '15px'}}>
                                                    {isOutOfStock ? 'Out of Stock!' : (isLowStock ? `Hurry, only ${currentStock} left in stock!` : `In Stock (${currentStock} available)`)}
                                                </div>
                                                
                                                <div style={{display: 'flex', gap: '20px', borderTop: '1px solid #f0f0f0', paddingTop: '15px'}}>
                                                    <button onClick={() => handleRemove(item.id)} style={styles.actionTextBtn}>REMOVE</button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* 👉 RIGHT COLUMN: PRICE & OFFERS */}
                        <div style={styles.priceColumn}>
                            
                            <div style={styles.priceCard}>
                                <div style={styles.priceHeader}>PRICE DETAILS</div>
                                <div style={styles.priceRow}>
                                    <div>Price ({totalCartItems} items)</div>
                                    <div>₹{subtotal}</div>
                                </div>
                                <div style={styles.priceRow}>
                                    <div>Discount</div>
                                    <div style={{color: '#388e3c'}}>- ₹{discount}</div>
                                </div>
                                
                                <div style={styles.priceRow}>
                                    <div>Delivery Charges</div>
                                    <div style={{color: '#388e3c'}}>{delivery === 0 ? 'Free' : `₹${delivery}`}</div>
                                </div>

                                <div style={styles.totalRow}>
                                    <div>Total Amount</div>
                                    <div>₹{total}</div>
                                </div>
                                
                                <div style={styles.savingsBox}>
                                    You will save ₹{discount} on this order
                                </div>
                            </div>

                            <div style={styles.trustBadgeContainer}>
                                <Shield size={28} color="#878787" />
                                <div style={styles.trustBadgeText}>
                                    Safe and Secure Payments. Easy returns. 100% Authentic products.
                                </div>
                            </div>
                            
                            {!isMobile && (
                                <div style={styles.placeOrderRow}>
                                    <button onClick={handleCheckout} disabled={isCheckingOut || hasOutofStock} style={styles.checkoutBtn}>
                                        {isCheckingOut ? "PROCESSING..." : (hasOutofStock ? "OUT OF STOCK" : `PLACE ORDER (₹${total})`)}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {isMobile && liveCart.length > 0 && !isInitialLoad && (
                <div style={styles.mobileStickyFooter}>
                    <div style={styles.mobilePriceTotal}>
                        <div style={{fontSize:'12px', color:'#878787', textDecoration:'line-through'}}>₹{subtotal + delivery}</div>
                        <div style={{fontSize:'18px', fontWeight:'bold'}}>₹{total}</div>
                    </div>
                    <button onClick={handleCheckout} disabled={isCheckingOut || hasOutofStock} style={styles.mobileCheckoutBtn}>
                        {isCheckingOut ? "WAIT..." : "PLACE ORDER"}
                    </button>
                </div>
            )}
        </div>
    );
};

const styles = {
    page: { background: '#f1f3f6', minHeight: '100vh', fontFamily: 'Roboto, sans-serif' },
    fkHeader: { background: '#2874f0', color: '#fff', padding: '12px 0', position: 'sticky', top: 0, zIndex: 100 },
    headerContent: { maxWidth: '1200px', margin: '0 auto', padding: '0 15px' },
    container: { maxWidth: '1200px', margin: '0 auto', padding: '10px 0' },
    cartGrid: { display: 'grid', gridTemplateColumns: '1fr 380px', gap: '16px', alignItems: 'start' },
    mobileCartGrid: { display: 'flex', flexDirection: 'column', gap: '10px', paddingBottom: '80px' },
    itemColumn: { background: '#fff', boxShadow: '0 1px 2px 0 rgba(0,0,0,.1)', borderRadius: '2px' },
    addressBar: { padding: '15px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f0f0f0', fontSize: '14px' },
    changeBtn: { border: '1px solid #e0e0e0', background: '#fff', color: '#2874f0', padding: '6px 16px', fontWeight: '500', fontSize: '13px', borderRadius: '4px', cursor: 'pointer' },
    itemCard: { padding: '24px', display: 'flex', borderBottom: '1px solid #f0f0f0' },
    img: { width: '112px', height: '112px', objectFit: 'contain' },
    details: { paddingLeft: '24px', flex: 1 },
    itemName: { fontSize: '16px', color: '#212121', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' },
    itemPrice: { fontSize: '18px', fontWeight: 'bold', color: '#212121' },
    sellerText: { fontSize: '12px', color: '#878787', marginTop: '4px' },
    qtyContainer: { display: 'flex', alignItems: 'center', gap: '10px' },
    qtyBtn: { width: '28px', height: '28px', borderRadius: '50%', border: '1px solid #c2c2c2', background: '#fff', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', color: '#212121' },
    qtyBox: { border: '1px solid #c2c2c2', padding: '2px 16px', borderRadius: '2px', fontSize: '14px', fontWeight: '500', color: '#212121' },
    actionTextBtn: { border: 'none', background: 'none', fontWeight: '600', color: '#212121', fontSize: '14px', cursor: 'pointer', transition: 'color 0.2s', '&:hover': { color: '#2874f0' } },
    priceColumn: { position: 'sticky', top: '70px', display: 'flex', flexDirection: 'column' },
    priceCard: { background: '#fff', boxShadow: '0 1px 2px 0 rgba(0,0,0,.1)', borderRadius: '2px' },
    priceHeader: { padding: '15px 24px', borderBottom: '1px solid #f0f0f0', color: '#878787', fontWeight: '600', fontSize: '15px' },
    priceRow: { padding: '15px 24px', display: 'flex', justifyContent: 'space-between', fontSize: '15px', color: '#212121' },
    totalRow: { padding: '20px 24px', display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: 'bold', borderTop: '1px dashed #e0e0e0', borderBottom: '1px dashed #e0e0e0' },
    savingsBox: { margin: '15px 24px', padding: '12px', background: '#e0fae4', color: '#388e3c', fontWeight: '600', fontSize: '14px', borderRadius: '4px', textAlign: 'center', border: '1px dashed #388e3c' },
    trustBadgeContainer: { display: 'flex', alignItems: 'center', gap: '15px', padding: '20px 0', color: '#878787' },
    trustBadgeText: { fontSize: '13px', lineHeight: '1.4', fontWeight: '500' },
    placeOrderRow: { padding: '15px 0', textAlign: 'right' },
    checkoutBtn: { background: '#fb641b', color: '#fff', border: 'none', padding: '16px 30px', fontWeight: 'bold', fontSize: '16px', borderRadius: '2px', cursor: 'pointer', width: '100%', boxShadow: '0 1px 2px 0 rgba(0,0,0,.2)' },
    mobileStickyFooter: { position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', padding: '10px 15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 -2px 10px rgba(0,0,0,0.1)', zIndex: 1000 },
    mobilePriceTotal: { display: 'flex', flexDirection: 'column' },
    mobileCheckoutBtn: { background: '#fb641b', color: '#fff', border: 'none', padding: '12px 30px', fontWeight: 'bold', borderRadius: '2px' },
    emptyCart: { background: '#fff', padding: '40px 20px', textAlign: 'center', boxShadow: '0 1px 2px 0 rgba(0,0,0,.1)' },
    shopNowBtn: { background: '#2874f0', color: '#fff', border: 'none', padding: '10px 30px', marginTop: '15px', fontWeight: 'bold', cursor: 'pointer', borderRadius: '2px' },
    
    successScreen: { textAlign: 'center', padding: '80px 20px', background: '#fff', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center' },
    successShopBtn: { background: '#fff', color: '#212121', border: '1px solid #d7d7d7', padding: '14px 32px', fontWeight: '600', fontSize: '14px', borderRadius: '2px', cursor: 'pointer', boxShadow: '0 1px 2px 0 rgba(0,0,0,.1)' },
    successOrderBtn: { background: '#2874f0', color: '#fff', border: '1px solid #2874f0', padding: '14px 32px', fontWeight: '600', fontSize: '14px', borderRadius: '2px', cursor: 'pointer', boxShadow: '0 1px 2px 0 rgba(0,0,0,.2)' }
};

export default Cart;