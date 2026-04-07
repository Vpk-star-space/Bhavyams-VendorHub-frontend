import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, ShoppingBag, ArrowLeft, Trash2 } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { toast } from 'react-toastify';
import axios from 'axios';

const Cart = () => {
    const { cart, removeFromCart, clearCart } = useCart();
    const navigate = useNavigate();
    const [isCheckingOut, setIsCheckingOut] = useState(false);
    const [orderPlaced, setOrderPlaced] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // 💰 Price Calculations
    const totalCartItems = cart.reduce((total, item) => total + (item.quantity || 1), 0);
    const subtotal = cart.reduce((total, item) => total + (Number(item.price) * (item.quantity || 1)), 0);
    const discount = Math.round(subtotal * 0.1); 
    const delivery = subtotal > 500 ? 0 : 40; 
    const total = subtotal - discount + delivery;

    const handleCheckout = async () => {
        const token = localStorage.getItem('token');
        if (!token) return navigate('/login');
        
        setIsCheckingOut(true);
        try {
            // 1. Fetch Fresh User Data (Address check)
            const { data: freshUser } = await axios.get('https://bhavyams-vendorhub-backend.onrender.com/api/auth/me', {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (!freshUser.address || freshUser.address.length < 5) {
                toast.error("❌ Add your address in 'My Profile' first!");
                navigate('/dashboard'); 
                return;
            }

            // 2. Fetch Razorpay Key
            const { data: keyData } = await axios.get('https://bhavyams-vendorhub-backend.onrender.com/api/orders/get-razorpay-key', {
                headers: { Authorization: `Bearer ${token}` }
            });

            // 3. Create Razorpay Order (Backend checks stock here)
            const { data: orderData } = await axios.post('https://bhavyams-vendorhub-backend.onrender.com/api/orders/checkout', 
                { cartItems: cart }, { headers: { Authorization: `Bearer ${token}` } }
            );

            const options = {
                key: keyData.key, 
                amount: orderData.razorpayOrder.amount,
                currency: "INR",
                name: "Bhavyams Hub",
                description: "Order Payment",
                order_id: orderData.razorpayOrder.id,
                handler: async function (response) {
                    try {
                        const verifyRes = await axios.post('https://bhavyams-vendorhub-backend.onrender.com/api/orders/verify-payment', 
                            { ...response, cartItems: cart }, { headers: { Authorization: `Bearer ${token}` } }
                        );
                        if (verifyRes.data.status === 'success') {
                            clearCart();
                            setOrderPlaced(true);
                            toast.success("🚀 Order Placed Successfully!");
                        }
                    } catch (err) {
                        toast.error(err.response?.data?.message || "Payment Verification Failed");
                    }
                },
                prefill: { name: freshUser.username, email: freshUser.email },
                theme: { color: "#2874f0" },
                modal: { ondismiss: () => setIsCheckingOut(false) }
            };
            const rzp = new window.Razorpay(options);
            rzp.open();
        } catch (err) { 
            toast.error(err.response?.data?.message || "Item is out of stock or error occurred."); 
        } finally { 
            setIsCheckingOut(false); 
        }
    };

    if (orderPlaced) return (
        <div style={styles.successScreen}>
            <CheckCircle size={80} color="#26a541" />
            <h1 style={{margin: '20px 0', fontSize: '28px'}}>Success!</h1>
            <p style={{color: '#666', marginBottom: '30px'}}>Your order has been placed. Check your email for confirmation.</p>
            <div style={{display: 'flex', gap: '15px'}}>
                <button onClick={() => navigate('/')} style={styles.shopNowBtn}>SHOP MORE</button>
                <button onClick={() => navigate('/dashboard')} style={styles.viewOrdersBtn}>MY ORDERS</button>
            </div>
        </div>
    );

    return (
        <div style={styles.page}>
            <header style={styles.fkHeader}>
                <div style={styles.headerContent}>
                   <ArrowLeft size={20} onClick={() => navigate('/')} style={{cursor:'pointer'}} />
                   <span style={{marginLeft: '15px', fontWeight: 'bold', fontSize: '18px'}}>My Cart ({totalCartItems})</span>
                </div>
            </header>

            <div style={styles.container}>
                {cart.length === 0 ? (
                    <div style={styles.emptyCart}>
                        <ShoppingBag size={80} color="#cbd5e1" />
                        <h3 style={{marginTop: '15px'}}>Your cart is empty!</h3>
                        <button onClick={() => navigate('/')} style={styles.shopNowBtn}>Shop Now</button>
                    </div>
                ) : (
                    <div style={isMobile ? styles.mobileCartGrid : styles.cartGrid}>
                        <div style={styles.itemColumn}>
                            {cart.map(item => {
                                // 🖼️ FIXED IMAGE LOGIC
                                const rawUrl = item.image_url || '';
                                const cleanUrl = rawUrl.replace(/["\\]/g, ''); 
                                const imageSrc = cleanUrl.startsWith('http') 
                                    ? cleanUrl 
                                    : `https://bhavyams-vendorhub-backend.onrender.com${cleanUrl}`;

                                return (
                                    <div key={item.id} style={styles.itemCard}>
                                        <img src={imageSrc} alt={item.name} style={styles.img} />
                                        <div style={styles.details}>
                                            <div style={styles.itemName}>{item.name}</div>
                                            <div style={styles.itemPrice}>₹{item.price} <span style={{fontSize: '12px', color: '#878787'}}>x {item.quantity}</span></div>
                                            <button onClick={() => removeFromCart(item.id)} style={styles.removeBtn}>
                                                <Trash2 size={14} /> REMOVE
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div style={styles.priceColumn}>
                            <div style={styles.priceCard}>
                                <div style={styles.priceHeader}>PRICE DETAILS</div>
                                <div style={styles.priceRow}>
                                    <span>Price ({totalCartItems} items)</span>
                                    <span>₹{subtotal}</span>
                                </div>
                                <div style={styles.priceRow}>
                                    <span>Discount (10%)</span>
                                    <span style={{color: '#26a541'}}>-₹{discount}</span>
                                </div>
                                <div style={styles.priceRow}>
                                    <span>Delivery Charges</span>
                                    <span style={{color: '#26a541'}}>{delivery === 0 ? 'FREE' : `₹${delivery}`}</span>
                                </div>
                                <div style={styles.totalRow}>
                                    <span>Total Amount</span>
                                    <span>₹{total}</span>
                                </div>
                            </div>
                            <button onClick={handleCheckout} disabled={isCheckingOut} style={styles.checkoutBtn}>
                                {isCheckingOut ? "PROCESSING..." : "PLACE ORDER"}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const styles = {
    page: { background: '#f1f3f6', minHeight: '100vh', fontFamily: 'Roboto, sans-serif' },
    fkHeader: { background: '#2874f0', color: '#fff', padding: '15px 0', position: 'sticky', top: 0, zIndex: 100 },
    headerContent: { maxWidth: '1200px', margin: '0 auto', padding: '0 15px', display: 'flex', alignItems: 'center' },
    container: { maxWidth: '1200px', margin: '0 auto', padding: '15px' },
    cartGrid: { display: 'grid', gridTemplateColumns: '1fr 380px', gap: '16px', alignItems: 'start' },
    mobileCartGrid: { display: 'flex', flexDirection: 'column', gap: '15px' },
    itemColumn: { background: '#fff', boxShadow: '0 1px 2px 0 rgba(0,0,0,.1)', borderRadius: '2px' },
    itemCard: { padding: '20px', display: 'flex', borderBottom: '1px solid #f0f0f0', gap: '20px' },
    img: { width: '80px', height: '80px', objectFit: 'contain' },
    details: { flex: 1 },
    itemName: { fontSize: '16px', color: '#212121', marginBottom: '8px', fontWeight: '500' },
    itemPrice: { fontSize: '18px', fontWeight: 'bold', marginBottom: '15px' },
    removeBtn: { border: 'none', background: 'none', fontWeight: 'bold', color: '#212121', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px' },
    priceColumn: { position: 'sticky', top: '80px' },
    priceCard: { background: '#fff', boxShadow: '0 1px 2px 0 rgba(0,0,0,.1)', borderRadius: '2px', padding: '15px' },
    priceHeader: { borderBottom: '1px solid #f0f0f0', paddingBottom: '10px', marginBottom: '15px', color: '#878787', fontWeight: 'bold', fontSize: '14px' },
    priceRow: { display: 'flex', justifyContent: 'space-between', marginBottom: '15px', fontSize: '15px' },
    totalRow: { display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: 'bold', borderTop: '1px dashed #e0e0e0', paddingTop: '15px', marginTop: '10px' },
    checkoutBtn: { background: '#fb641b', color: '#fff', border: 'none', padding: '15px', width: '100%', fontWeight: 'bold', fontSize: '16px', borderRadius: '2px', cursor: 'pointer', marginTop: '15px', boxShadow: '0 1px 2px 0 rgba(0,0,0,.2)' },
    successScreen: { textAlign: 'center', padding: '100px 20px', background: '#fff', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' },
    shopNowBtn: { background: '#2874f0', color: '#fff', border: 'none', padding: '12px 30px', fontWeight: 'bold', cursor: 'pointer', borderRadius: '2px' },
    viewOrdersBtn: { background: '#fff', color: '#2874f0', border: '1px solid #e0e0e0', padding: '12px 30px', fontWeight: 'bold', cursor: 'pointer', borderRadius: '2px' },
    emptyCart: { background: '#fff', padding: '60px 20px', textAlign: 'center', borderRadius: '2px' }
};

export default Cart;