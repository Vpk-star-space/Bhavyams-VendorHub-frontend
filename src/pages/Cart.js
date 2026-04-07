import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, ShoppingBag, ArrowLeft } from 'lucide-react';
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

    const totalCartItems = cart.reduce((total, item) => total + (item.quantity || 1), 0);
    const subtotal = cart.reduce((total, item) => total + (Number(item.price) * item.quantity), 0);
    const discount = Math.round(subtotal * 0.1); 
    const delivery = subtotal > 500 ? 0 : 40; 
    const total = subtotal - discount + delivery;

    const handleCheckout = async () => {
        const token = localStorage.getItem('token');
        if (!token) return navigate('/login');
        setIsCheckingOut(true);
        try {
            const { data: freshUser } = await axios.get('https://bhavyams-vendorhub-backend.onrender.com/api/auth/me', {
                headers: { Authorization: `Bearer ${token}` }
            });
            localStorage.setItem('user', JSON.stringify(freshUser));
            if (!freshUser.address || freshUser.address.length < 5) {
                toast.error("❌ Address missing! Add it in 'My Profile'.");
                navigate('/dashboard'); 
                setIsCheckingOut(false);
                return;
            }
            const { data: keyData } = await axios.get('https://bhavyams-vendorhub-backend.onrender.com/api/orders/get-razorpay-key', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const { data: orderData } = await axios.post('https://bhavyams-vendorhub-backend.onrender.com/api/orders/checkout', 
                { cartItems: cart }, { headers: { 'Authorization': `Bearer ${token}` } }
            );
            const options = {
                key: keyData.key, 
                amount: orderData.razorpayOrder.amount,
                currency: "INR",
                name: "Bhavyams VendorHub",
                description: "Secure Payment",
                order_id: orderData.razorpayOrder.id,
                handler: async function (response) {
                    const verifyRes = await axios.post('https://bhavyams-vendorhub-backend.onrender.com/api/orders/verify-payment', 
                        { ...response, cartItems: cart }, { headers: { 'Authorization': `Bearer ${token}` } }
                    );
                    if (verifyRes.data.status === 'success') {
                        setOrderPlaced(true);
                        clearCart();
                        toast.success("Payment Received! Order Placed.");
                    }
                },
                prefill: { name: freshUser.username, email: freshUser.email },
                theme: { color: "#2874f0" }
            };
            new window.Razorpay(options).open();
        } catch (err) { 
            toast.error("Checkout failed. Check connection."); 
        } finally { 
            setIsCheckingOut(false); 
        }
    };

    if (orderPlaced) return (
        <div style={styles.successScreen}>
            <CheckCircle size={80} color="#26a541" />
            <h1 style={{fontSize: '24px', margin: '20px 0'}}>Order Placed Successfully!</h1>
            <button onClick={() => navigate('/dashboard')} style={styles.checkoutBtn}>VIEW MY ORDERS</button>
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
                {cart.length === 0 ? (
                    <div style={styles.emptyCart}>
                        <ShoppingBag size={80} color="#2874f0" />
                        <h3>Your cart is empty!</h3>
                        <button onClick={() => navigate('/')} style={styles.shopNowBtn}>Shop Now</button>
                    </div>
                ) : (
                    <div style={isMobile ? styles.mobileCartGrid : styles.cartGrid}>
                        <div style={styles.itemColumn}>
                            <div style={styles.addressBar}>
                                <div>Deliver to: <b>{JSON.parse(localStorage.getItem('user'))?.username || 'Customer'}</b></div>
                                <button onClick={() => navigate('/dashboard')} style={styles.changeBtn}>Change</button>
                            </div>

                            {cart.map(item => {
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
                                            <div style={styles.itemPrice}>₹{item.price} <span style={{fontSize:'12px', color:'#878787'}}>x {item.quantity}</span></div>
                                            <div style={styles.sellerText}>Seller: Bhavyams Vendor</div>
                                            <button onClick={() => removeFromCart(item.id)} style={styles.removeBtn}>REMOVE</button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div style={styles.priceColumn}>
                            <div style={styles.priceCard}>
                                <div style={styles.priceHeader}>PRICE DETAILS</div>
                                <div style={styles.priceRow}>
                                    <div>Price ({totalCartItems} items)</div>
                                    <div>₹{subtotal}</div>
                                </div>
                                <div style={styles.priceRow}>
                                    <div>Discount</div>
                                    <div style={{color: '#26a541'}}>- ₹{discount}</div>
                                </div>
                                <div style={styles.priceRow}>
                                    <div>Delivery Charges</div>
                                    <div style={{color: '#26a541'}}>{delivery === 0 ? 'FREE' : `₹${delivery}`}</div>
                                </div>
                                <div style={styles.totalRow}>
                                    <div>Total Amount</div>
                                    <div>₹{total}</div>
                                </div>
                                <div style={styles.savingsText}>You will save ₹{discount} on this order</div>
                            </div>
                            
                            {!isMobile && (
                                <div style={styles.placeOrderRow}>
                                    <button onClick={handleCheckout} disabled={isCheckingOut} style={styles.checkoutBtn}>
                                        {isCheckingOut ? "PROCESSING..." : "PLACE ORDER"}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {isMobile && cart.length > 0 && (
                <div style={styles.mobileStickyFooter}>
                    <div style={styles.mobilePriceTotal}>
                        <div style={{fontSize:'12px', color:'#878787', textDecoration:'line-through'}}>₹{subtotal + delivery}</div>
                        <div style={{fontSize:'18px', fontWeight:'bold'}}>₹{total}</div>
                    </div>
                    <button onClick={handleCheckout} disabled={isCheckingOut} style={styles.mobileCheckoutBtn}>
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
    itemColumn: { background: '#fff', boxShadow: '0 1px 2px 0 rgba(0,0,0,.1)' },
    addressBar: { padding: '15px', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f0f0f0', fontSize: '13px' },
    changeBtn: { border: '1px solid #e0e0e0', background: '#fff', color: '#2874f0', padding: '5px 12px', fontWeight: 'bold', fontSize: '12px' },
    itemCard: { padding: '15px', display: 'flex', borderBottom: '1px solid #f0f0f0' },
    img: { width: '80px', height: '80px', objectFit: 'contain' },
    details: { paddingLeft: '15px', flex: 1 },
    itemName: { fontSize: '14px', color: '#212121', marginBottom: '5px' },
    itemPrice: { fontSize: '16px', fontWeight: 'bold' },
    sellerText: { fontSize: '12px', color: '#878787', margin: '5px 0' },
    removeBtn: { border: 'none', background: 'none', fontWeight: 'bold', color: '#212121', fontSize: '13px', padding: '10px 0 0' },
    placeOrderRow: { padding: '15px', background: '#fff', textAlign: 'right', marginTop: '10px' },
    checkoutBtn: { background: '#fb641b', color: '#fff', border: 'none', padding: '12px 40px', fontWeight: 'bold', borderRadius: '2px', cursor: 'pointer' },
    priceColumn: { position: 'sticky', top: '70px' },
    priceCard: { background: '#fff', boxShadow: '0 1px 2px 0 rgba(0,0,0,.1)' },
    priceHeader: { padding: '12px 15px', borderBottom: '1px solid #f0f0f0', color: '#878787', fontWeight: 'bold', fontSize: '14px' },
    priceRow: { padding: '12px 15px', display: 'flex', justifyContent: 'space-between', fontSize: '14px' },
    totalRow: { padding: '15px', display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: 'bold', borderTop: '1px dashed #e0e0e0' },
    savingsText: { padding: '12px 15px', color: '#26a541', fontWeight: 'bold', fontSize: '14px' },
    mobileStickyFooter: { position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', padding: '10px 15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 -2px 10px rgba(0,0,0,0.1)', zIndex: 1000 },
    mobilePriceTotal: { display: 'flex', flexDirection: 'column' },
    mobileCheckoutBtn: { background: '#fb641b', color: '#fff', border: 'none', padding: '12px 30px', fontWeight: 'bold', borderRadius: '2px' },
    emptyCart: { background: '#fff', padding: '40px 20px', textAlign: 'center' },
    shopNowBtn: { background: '#2874f0', color: '#fff', border: 'none', padding: '10px 30px', marginTop: '15px', fontWeight: 'bold' },
    successScreen: { textAlign: 'center', padding: '80px 20px', background: '#fff', minHeight: '100vh' }
};

export default Cart;