import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { GoogleOAuthProvider } from '@react-oauth/google';
import axios from 'axios';
import 'react-toastify/dist/ReactToastify.css';

import { CartProvider } from './context/CartContext'; 
import Home from './pages/Home'; 
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Cart from './pages/Cart'; 
import AddProduct from './pages/AddProduct';
import ProtectedRoute from './components/ProtectedRoute';
import ForgotPassword from './pages/ForgotPassword';
import VendorDashboard from './pages/VendorDashboard';
import ProductDetails from './pages/ProductDetails';
import Profile from './pages/Profile';

// 🚀 Helper: Always start at the top of the page on route change
function ScrollToTop() {
    const { pathname } = useLocation();
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [pathname]);
    return null;
}

function App() {
    const [googleClientId, setGoogleClientId] = useState(null);
    const [loadingText, setLoadingText] = useState("Initializing Secure System...");

    useEffect(() => {
        let isMounted = true;

        // 🚀 UX FIX: Tell the user if the Render server is taking a long time to wake up
        const timeoutId = setTimeout(() => {
            if (isMounted) setLoadingText("Waking up secure server. This can take up to 60 seconds...");
        }, 5000);

        const fetchGoogleId = async () => {
            try {
                const res = await axios.get('https://bhavyams-vendorhub-backend.onrender.com/api/auth/google-client-id');
                if (isMounted) {
                    setGoogleClientId(res.data.clientId);
                }
            } catch (err) {
                console.error("Google ID fetch failed. Retrying...", err);
                if (isMounted) {
                    // 🚀 THE MAGIC FIX: If Render is asleep, retry every 5 seconds until it wakes up!
                    setTimeout(fetchGoogleId, 5000);
                }
            }
        };
        fetchGoogleId();

        return () => {
            isMounted = false;
            clearTimeout(timeoutId);
        };
    }, []);

    // 🎨 Improved Branding for the Loading Screen
    if (!googleClientId) {
        return (
            <div style={styles.loadingScreen}>
                <div style={styles.loadingContent}>
                    <div style={styles.brandName}>Bhavyams VendorHub</div>
                    <div style={styles.loaderBar}>
                        <div style={styles.loaderProgress}></div>
                    </div>
                    <div style={styles.loadingText}>{loadingText}</div>
                </div>
            </div>
        );
    }

    return (
        <GoogleOAuthProvider clientId={googleClientId}>
            <CartProvider>
                <Router>
                    <ScrollToTop /> {/* 🚀 Ensures pro navigation */}
                    <ToastContainer 
                        theme="colored" 
                        position="top-center" // Better for Mobile
                        autoClose={1500} 
                        hideProgressBar={true}
                    />
                    <div style={{ minHeight: '100vh', background: '#f1f3f6' }}>
                        <Routes>
                            <Route path="/" element={<Home />} />
                            <Route path="/product/:id" element={<ProductDetails />} />
                            <Route path="/cart" element={<Cart />} />
                            <Route path="/login" element={<Login />} />
                            <Route path="/register" element={<Register />} />
                            <Route path="/forgot-password" element={<ForgotPassword />} />
                            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                            <Route path="/profile" element={<Profile />} />
                            <Route path="/vendor-dashboard" element={<VendorDashboard />} />
                            <Route path="/add-product" element={<ProtectedRoute><AddProduct /></ProtectedRoute>} />
                            <Route path="*" element={<Home />} />
                        </Routes>
                    </div>
                </Router>
            </CartProvider>
        </GoogleOAuthProvider>
    );
}

const styles = {
    loadingScreen: {
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh', 
        background: '#fff',
        fontFamily: "'Roboto', sans-serif"
    },
    loadingContent: { textAlign: 'center' },
    brandName: { fontSize: '28px', fontWeight: '900', color: '#2874f0', letterSpacing: '-0.5px' },
    loadingText: { marginTop: '15px', color: '#666', fontSize: '14px', fontWeight: '500', maxWidth: '250px', margin: '15px auto 0' },
    loaderBar: {
        width: '200px',
        height: '4px',
        background: '#e0e0e0',
        borderRadius: '10px',
        margin: '20px auto 0',
        overflow: 'hidden'
    },
    loaderProgress: {
        width: '50%',
        height: '100%',
        background: '#2874f0',
        borderRadius: '10px',
        animation: 'loadingAnim 1.5s infinite ease-in-out'
    }
};

// Add this to your App.css later for the animation:
// @keyframes loadingAnim { 0% { transform: translateX(-100%); } 100% { transform: translateX(200%); } }

export default App;