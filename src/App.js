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
    // 🔙 REVERTED TO YOUR ORIGINAL LOGIC
    const [googleClientId, setGoogleClientId] = useState(null);

    useEffect(() => {
        const fetchGoogleId = async () => {
            try {
                // 🔙 Removed the bad timeout. It will now wait for your Render server safely!
                const res = await axios.get('https://bhavyams-vendorhub-backend.onrender.com/api/auth/google-client-id');
                setGoogleClientId(res.data.clientId);
            } catch (err) {
                console.error("Google ID fetch failed.", err);
            }
        };
        fetchGoogleId();
    }, []);

    // 🎨 Improved Branding for the Loading Screen
    if (!googleClientId) {
        return (
            <div style={styles.loadingScreen}>
                <div style={styles.loadingContent}>
                    <div style={styles.brandName}>Bhavyams VendorHub</div>
                    <div style={styles.loaderBar}>
                        {/* Safe CSS so it doesn't crash to a white screen */}
                        <div style={{...styles.loaderProgress, width: '100%', transition: 'width 2s ease-in-out'}}></div>
                    </div>
                    <div style={styles.loadingText}>Initializing Secure System...</div>
                </div>
            </div>
        );
    }

    return (
        // 🔙 REVERTED: Now uses your real Google ID, fixing the 401 error!
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
    loadingText: { marginTop: '15px', color: '#666', fontSize: '14px', fontWeight: '500' },
    loaderBar: {
        width: '200px',
        height: '4px',
        background: '#e0e0e0',
        borderRadius: '10px',
        margin: '20px auto 0',
        overflow: 'hidden'
    },
    loaderProgress: {
        height: '100%',
        background: '#2874f0',
        borderRadius: '10px'
    }
};

export default App;