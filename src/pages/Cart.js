import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, ShoppingBag, ArrowLeft } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { toast } from 'react-toastify';
import axios from 'axios';

const Cart= () => {
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
            // 🛡️ Ensure we have the latest user data before opening Razorpay
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
                    try {
                        const verifyRes = await axios.post('https://bhavyams-vendorhub-backend.onrender.com/api/orders/verify-payment', 
                            { ...response, cartItems: cart }, { headers: { 'Authorization': `Bearer ${token}` } }
                        );
                        
                        if (verifyRes.data.status === 'success') {
                            // 🚀 FIX: Clear cart immediately and update local storage to prevent duplicate orders
                            clearCart();
                            setOrderPlaced(true);
                            toast.success("Payment Received! Order Placed.");

                            // Refresh user data again so dashboard reflects new order/stats
                            const { data: finalUser } = await axios.get('https://bhavyams-vendorhub-backend.onrender.com/api/auth/me', {
                                headers: { Authorization: `Bearer ${token}` }
                            });
                            localStorage.setItem('user', JSON.stringify(finalUser));
                        }
                    } catch (err) {
                        toast.error(err.response?.data?.message || "Payment verification failed.");
                    }
                },
                prefill: { name: freshUser.username, email: freshUser.email },
                theme: { color: "#2874f0" },
                modal: {
                    ondismiss: function() {
                        setIsCheckingOut(false);
                    }
                }
            };
            new window.Razorpay(options).open();
        } catch (err) { 
            toast.error(err.response?.data?.message || "Checkout failed. Item might be out of stock."); 
        } finally { 
            setIsCheckingOut(false); 
        }
    };

    if (orderPlaced) return (
        <div style={styles.successScreen}>
            <CheckCircle size={80} color="#26a541" />
            <h1 style={{fontSize: '28px', margin: '20px 0', color: '#212121'}}>Order Placed Successfully!</h1>
            <p style={{color: '#64748b', marginBottom: '30px'}}>Your vendor has been notified and is preparing your items.</p>
            <div style={{display: 'flex', gap: '15px', justifyContent: 'center'}}>
                <button onClick={() => navigate('/')} style={styles.shopNowBtn}>CONTINUE SHOPPING</button>
                <button onClick={() => navigate('/dashboard')} style={styles.viewOrdersBtn}>VIEW MY ORDERS</button>
            </div>
        </div>
    );

    // ... (Keep the rest of your return JSX and styles exactly as they were)
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

// ... (Add these specific buttons to your styles object)
const styles = {
    // ... all your existing styles ...
    viewOrdersBtn: { background: '#fff', color: '#2874f0', border: '1px solid #e0e0e0', padding: '12px 30px', fontWeight: 'bold', borderRadius: '2px', cursor: 'pointer' },
    shopNowBtn: { background: '#2874f0', color: '#fff', border: 'none', padding: '12px 30px', fontWeight: 'bold', borderRadius: '2px', cursor: 'pointer' },
    // Ensure successScreen is well padded
    successScreen: { textAlign: 'center', padding: '100px 20px', background: '#fff', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }
};
export default Cart;