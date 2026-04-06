import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, MapPin, ShieldCheck, ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { toast } from 'react-toastify';
import axios from 'axios';

const Cart = () => {
    const { cart, removeFromCart, clearCart } = useCart();
    const navigate = useNavigate();
    const [isCheckingOut, setIsCheckingOut] = useState(false);
    const [orderPlaced, setOrderPlaced] = useState(false);

    // 🛡️ FIX 1: Calculate the true total quantity of items in the cart
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
            <CheckCircle size={100} color="#26a541" />
            <h1 style={{fontSize: '32px', margin: '20px 0'}}>Order Placed Successfully!</h1>
            <div style={{color: '#666', marginBottom: '30px'}}>Your items are being prepared for shipping.</div>
            <button onClick={() => navigate('/dashboard')} style={styles.checkoutBtn}>VIEW MY ORDERS</button>
        </div>
    );

    return (
        <div style={styles.page}>
            <header style={styles.fkHeader}>
                <div style={styles.headerContent}>
                    <h2 style={{margin: 0, fontSize: '20px', cursor: 'pointer'}} onClick={() => navigate('/')}>Bhavyams Hub</h2>
                </div>
            </header>

            <div style={styles.container}>
                {cart.length === 0 ? (
                    <div style={styles.emptyCart}>
                        <ShoppingBag size={80} color="#2874f0" />
                        <h3>Your cart is empty!</h3>
                        <div style={{marginBottom: '20px', color: '#878787'}}>Add items to it now.</div>
                        <button onClick={() => navigate('/')} style={styles.shopNowBtn}>Shop Now</button>
                    </div>
                ) : (
                    <div style={styles.cartGrid}>
                        <div style={styles.itemColumn}>
                            <div style={styles.addressBar}>
                                <div style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
                                    <MapPin size={18} color="#2874f0" />
                                    <div>Deliver to: <b>{JSON.parse(localStorage.getItem('user'))?.username}</b></div>
                                </div>
                                <button onClick={() => navigate('/dashboard')} style={styles.changeBtn}>Change</button>
                            </div>

                            {cart.map(item => {
                                const imageSrc = item.image_url?.startsWith('http') 
                                    ? item.image_url 
                                    // 🚀 FIX: Point to the live Render Backend!
                                    : `https://bhavyams-vendorhub-backend.onrender.com${item.image_url}`;
                                return (
                                    <div key={item.id} style={styles.itemCard}>
                                        <img src={imageSrc} alt={item.name} style={styles.img} />
                                        <div style={styles.details}>
                                            <div style={styles.itemName}>{item.name}</div>
                                            <div style={styles.itemPrice}>
                                                ₹{item.price} 
                                                {/* 🛡️ FIX 2: Show the quantity multiplier clearly to the customer */}
                                                <span style={{fontSize: '14px', color: '#878787', fontWeight: '500', marginLeft: '8px'}}>
                                                    x {item.quantity || 1}
                                                </span>
                                                <span style={styles.discountBadge}>10% Off</span>
                                            </div>
                                            <div style={styles.sellerText}>Seller: Bhavyams Vendor</div>
                                            <button onClick={() => removeFromCart(item.id)} style={styles.removeBtn}>REMOVE</button>
                                        </div>
                                        <div style={styles.deliveryDate}>Delivery by Today | <span style={{color: '#26a541'}}>Free</span></div>
                                    </div>
                                );
                            })}
                            
                            <div style={styles.placeOrderRow}>
                                <button onClick={handleCheckout} disabled={isCheckingOut} style={styles.checkoutBtn}>
                                    {isCheckingOut ? "PROCESSING..." : "PLACE ORDER"}
                                </button>
                            </div>
                        </div>

                        <div style={styles.priceColumn}>
                            <div style={styles.priceCard}>
                                <div style={styles.priceHeader}>PRICE DETAILS</div>
                                <div style={styles.priceRow}>
                                    {/* 🛡️ FIX 3: Display true totalCartItems instead of cart.length */}
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
                            <div style={styles.safeStrip}>
                                <ShieldCheck size={18} color="#878787" />
                                <span>Safe and Secure Payments. 100% Authentic products.</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const styles = {
    page: { background: '#f1f3f6', minHeight: '100vh', fontFamily: 'Roboto, Arial, sans-serif' },
    fkHeader: { background: '#2874f0', color: '#fff', padding: '12px 0', marginBottom: '20px' },
    headerContent: { maxWidth: '1200px', margin: '0 auto', padding: '0 20px' },
    container: { maxWidth: '1200px', margin: '0 auto', padding: '0 10px' },
    cartGrid: { display: 'grid', gridTemplateColumns: '1fr 380px', gap: '16px', alignItems: 'start' },
    itemColumn: { background: '#fff', boxShadow: '0 1px 2px 0 rgba(0,0,0,.1)' },
    addressBar: { padding: '15px 25px', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f0f0f0', fontSize: '14px' },
    changeBtn: { border: '1px solid #e0e0e0', background: '#fff', color: '#2874f0', padding: '8px 15px', fontWeight: 'bold', cursor: 'pointer', borderRadius: '2px' },
    itemCard: { padding: '24px', display: 'flex', borderBottom: '1px solid #f0f0f0', position: 'relative' },
    img: { width: '110px', height: '110px', objectFit: 'contain' },
    details: { paddingLeft: '24px', flex: 1 },
    itemName: { fontSize: '18px', color: '#212121', marginBottom: '10px' },
    itemPrice: { fontSize: '18px', fontWeight: 'bold', color: '#212121', marginBottom: '5px' },
    discountBadge: { fontSize: '14px', color: '#388e3c', marginLeft: '10px' },
    sellerText: { fontSize: '14px', color: '#878787', marginBottom: '20px' },
    removeBtn: { border: 'none', background: 'none', fontWeight: 'bold', color: '#212121', cursor: 'pointer', fontSize: '14px', padding: 0 },
    deliveryDate: { position: 'absolute', right: '24px', top: '24px', fontSize: '14px', color: '#212121' },
    placeOrderRow: { padding: '16px 22px', display: 'flex', justifyContent: 'flex-end', boxShadow: '0 -2px 10px 0 rgba(0,0,0,.1)', background: '#fff' },
    checkoutBtn: { background: '#fb641b', color: '#fff', border: 'none', padding: '16px 60px', fontWeight: 'bold', borderRadius: '2px', cursor: 'pointer', fontSize: '16px' },
    priceColumn: { position: 'sticky', top: '80px' },
    priceCard: { background: '#fff', boxShadow: '0 1px 2px 0 rgba(0,0,0,.1)' },
    priceHeader: { padding: '15px 24px', borderBottom: '1px solid #f0f0f0', color: '#878787', fontWeight: 'bold', fontSize: '16px' },
    priceRow: { padding: '15px 24px', display: 'flex', justifyContent: 'space-between', fontSize: '16px', color: '#212121' },
    totalRow: { padding: '24px', display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: 'bold', borderTop: '1px dotted #f0f0f0', borderBottom: '1px dotted #f0f0f0', margin: '10px 0' },
    savingsText: { padding: '15px 24px', color: '#388e3c', fontWeight: 'bold', fontSize: '16px' },
    safeStrip: { display: 'flex', gap: '10px', padding: '15px', color: '#878787', fontSize: '12px', fontWeight: 'bold', alignItems: 'center' },
    emptyCart: { background: '#fff', padding: '50px', textAlign: 'center', boxShadow: '0 1px 2px 0 rgba(0,0,0,.1)' },
    shopNowBtn: { background: '#2874f0', color: '#fff', border: 'none', padding: '12px 50px', fontWeight: 'bold', cursor: 'pointer', borderRadius: '2px' },
    successScreen: { textAlign: 'center', padding: '100px 20px', background: '#fff', minHeight: '100vh' }
};

export default Cart;