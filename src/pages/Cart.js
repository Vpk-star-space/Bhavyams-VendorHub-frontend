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
    const [,setIsMobile] = useState(window.innerWidth < 768);

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
                toast.error("Address missing!");
                navigate('/dashboard'); 
                setIsCheckingOut(false);
                return;
            }

            const { data: keyData } = await axios.get('https://bhavyams-vendorhub-backend.onrender.com/api/orders/get-razorpay-key', {
                headers: { Authorization: `Bearer ${token}` }
            });

            const { data: orderData } = await axios.post('https://bhavyams-vendorhub-backend.onrender.com/api/orders/checkout', 
                { cartItems: cart }, { headers: { Authorization: `Bearer ${token}` } }
            );

            const options = {
                key: keyData.key, 
                amount: orderData.razorpayOrder.amount,
                currency: "INR",
                name: "Bhavyams VendorHub",
                order_id: orderData.razorpayOrder.id,
                handler: async function (response) {
                    try {
                        const verifyRes = await axios.post('https://bhavyams-vendorhub-backend.onrender.com/api/orders/verify-payment', 
                            { ...response, cartItems: cart }, { headers: { Authorization: `Bearer ${token}` } }
                        );
                        if (verifyRes.data.status === 'success') {
                            clearCart();
                            setOrderPlaced(true);
                            toast.success("Order Placed!");
                        }
                    } catch (err) {
                        toast.error("Verification failed");
                    }
                },
                prefill: { name: freshUser.username, email: freshUser.email },
                theme: { color: "#2874f0" }
            };
            new window.Razorpay(options).open();
        } catch (err) { 
            toast.error("Out of stock!"); 
        } finally { 
            setIsCheckingOut(false); 
        }
    };

    if (orderPlaced) return (
        <div style={styles.successScreen}>
            <CheckCircle size={80} color="#26a541" />
            <h1>Order Placed!</h1>
            <div style={{display: 'flex', gap: '15px'}}>
                <button onClick={() => navigate('/')} style={styles.shopNowBtn}>SHOP MORE</button>
                <button onClick={() => navigate('/dashboard')} style={styles.viewOrdersBtn}>VIEW ORDERS</button>
            </div>
        </div>
    );

    return (
        <div style={styles.page}>
            <header style={styles.fkHeader}>
                <div style={styles.headerContent}>
                   <ArrowLeft size={20} onClick={() => navigate('/')} style={{cursor:'pointer'}} />
                   <h2 style={{display: 'inline', marginLeft: '10px'}}>My Cart ({totalCartItems})</h2>
                </div>
            </header>
            <div style={styles.container}>
                {cart.length === 0 ? (
                    <div style={styles.emptyCart}>
                        <ShoppingBag size={80} />
                        <h3>Empty Cart</h3>
                        <button onClick={() => navigate('/')} style={styles.shopNowBtn}>Shop Now</button>
                    </div>
                ) : (
                    <div style={styles.cartGrid}>
                        <div style={styles.itemColumn}>
                            {cart.map(item => (
                                <div key={item.id} style={styles.itemCard}>
                                    <div style={styles.details}>
                                        <div style={styles.itemName}>{item.name}</div>
                                        <div style={styles.itemPrice}>₹{item.price} x {item.quantity}</div>
                                        <button onClick={() => removeFromCart(item.id)} style={styles.removeBtn}>REMOVE</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div style={styles.priceColumn}>
                            <div style={styles.priceCard}>
                                <div style={styles.priceHeader}>PRICE DETAILS</div>
                                <div style={styles.priceRow}>
                                    <div>Total</div>
                                    <div style={{fontWeight:'bold'}}>₹{total}</div>
                                </div>
                            </div>
                            <button onClick={handleCheckout} disabled={isCheckingOut} style={styles.checkoutBtn}>
                                {isCheckingOut ? "WAIT..." : "PLACE ORDER"}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const styles = {
    page: { background: '#f1f3f6', minHeight: '100vh' },
    fkHeader: { background: '#2874f0', color: '#fff', padding: '12px' },
    headerContent: { maxWidth: '1200px', margin: '0 auto' },
    container: { maxWidth: '1200px', margin: '0 auto', padding: '10px' },
    cartGrid: { display: 'grid', gridTemplateColumns: '1fr 350px', gap: '16px' },
    itemColumn: { background: '#fff' },
    itemCard: { padding: '15px', borderBottom: '1px solid #f0f0f0' },
    checkoutBtn: { background: '#fb641b', color: '#fff', border: 'none', padding: '12px', width: '100%', fontWeight: 'bold', marginTop: '10px', cursor: 'pointer' },
    successScreen: { textAlign: 'center', padding: '100px 20px', background: '#fff', minHeight: '100vh' },
    shopNowBtn: { background: '#2874f0', color: '#fff', border: 'none', padding: '10px 30px', cursor: 'pointer' },
    viewOrdersBtn: { background: '#fff', color: '#2874f0', border: '1px solid #2874f0', padding: '10px 30px', cursor: 'pointer' },
    priceCard: { background: '#fff', padding: '15px' },
    priceHeader: { borderBottom: '1px solid #f0f0f0', paddingBottom: '10px', marginBottom: '10px' },
    priceRow: { display: 'flex', justifyContent: 'space-between' },
    emptyCart: { textAlign: 'center', padding: '50px' }
};

export default Cart;