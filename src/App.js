import React, { useState, useEffect, useRef } from 'react';
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

const isMaintenanceMode = false; 

function ScrollToTop() {
    const { pathname } = useLocation();
    useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
    return null;
}

// 🛡️ STABLE, PROFESSIONAL LOADING SCREEN
const StableLoader = ({ onComplete }) => {
    const [fadeOut, setFadeOut] = useState(false);
    const wakeLockRef = useRef(null);

    useEffect(() => {
        let isMounted = true;

        // 1. Official WakeLock API (Standard, safe way to keep screen awake)
        const requestWakeLock = async () => {
            try {
                if ('wakeLock' in navigator) {
                    wakeLockRef.current = await navigator.wakeLock.request('screen');
                    console.log("Screen locked awake.");
                }
            } catch (err) {
                console.log("WakeLock API blocked or unsupported by this browser.");
            }
        };
        requestWakeLock();

        // 2. Simple, fast 3-second loading timeline
        const timer1 = setTimeout(() => {
            if (isMounted) setFadeOut(true); // Start fade to black
        }, 2500);

        const timer2 = setTimeout(() => {
            if (isMounted) {
                // Release screen lock when entering the app to save battery
                if (wakeLockRef.current) wakeLockRef.current.release();
                onComplete(); 
            }
        }, 3000); // Enter app at 3 seconds

        return () => {
            isMounted = false;
            clearTimeout(timer1);
            clearTimeout(timer2);
            if (wakeLockRef.current) wakeLockRef.current.release();
        };
    }, [onComplete]);

    return (
        <div style={{...sStyles.wrapper, opacity: fadeOut ? 0 : 1}}>
            <div style={sStyles.container}>
                {/* Premium Brand Display */}
                <h1 style={sStyles.brandName}>Subhams</h1>
                <h2 style={sStyles.hubText}>HUB</h2>
                
                {/* Clean Loading Spinner */}
                <div className="stable-spinner" style={sStyles.spinnerBox}></div>
            </div>
        </div>
    );
};

function App() {
    const [googleClientId, setGoogleClientId] = useState(null);
    const [showSplash, setShowSplash] = useState(false);
    const [isAppReady, setIsAppReady] = useState(false);

    // ⏱️ THE 1-MINUTE TESTING LOGIC REMAINS INTACT
    useEffect(() => {
        let isMounted = true;
        
        const lastVisit = localStorage.getItem('lastVisitTime');
        const now = Date.now();
        const ONE_MINUTE = 1 * 60 * 1000; 

        if (!lastVisit || (now - parseInt(lastVisit)) > ONE_MINUTE) {
            setShowSplash(true); 
        } else {
            setIsAppReady(true); 
        }

        const fetchGoogleId = async () => {
            try {
                const res = await axios.get('https://bhavyams-vendorhub-backend.onrender.com/api/auth/google-client-id');
                if (isMounted) setGoogleClientId(res.data.clientId);
            } catch (err) {
                console.error("Failed to fetch Google ID");
            }
        };
        fetchGoogleId();

        return () => { isMounted = false; };
    }, []);

    const handleIntroComplete = () => {
        setShowSplash(false);
        setIsAppReady(true);
        localStorage.setItem('lastVisitTime', Date.now().toString());
    };

    if (isMaintenanceMode) return <div style={{textAlign: 'center', marginTop: '20%'}}>Maintenance Mode Active</div>;

    // Show the stable loading screen
    if (showSplash) {
        return <StableLoader onComplete={handleIntroComplete} />;
    }

    if (!isAppReady || !googleClientId) return null; 

    return (
        <GoogleOAuthProvider clientId={googleClientId}>
            <CartProvider>
                <Router>
                    <ScrollToTop />
                    <ToastContainer theme="colored" position="top-center" autoClose={1500} hideProgressBar={true} />
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

// ==========================================
// 🎨 STABLE, CLEAN STYLES
// ==========================================
const sStyles = {
    wrapper: {
        position: 'fixed', top: 0, left: 0, width: '100%', height: '100vh',
        backgroundColor: '#020617', // Very dark, professional blue/black
        display: 'flex', alignItems: 'center', justifyContent: 'center', 
        zIndex: 99999, fontFamily: "'Inter', 'Segoe UI', sans-serif",
        transition: 'opacity 0.5s ease-in-out'
    },
    container: {
        display: 'flex', flexDirection: 'column', alignItems: 'center'
    },
    brandName: { 
        fontSize: 'clamp(40px, 8vw, 80px)', 
        color: '#ffffff', 
        fontStyle: 'italic', 
        fontWeight: '900', 
        margin: 0,
        textShadow: '0 0 20px rgba(59,130,246,0.5)'
    },
    hubText: { 
        fontSize: 'clamp(24px, 5vw, 40px)', 
        color: '#fbbf24', // Premium Gold
        letterSpacing: '10px', 
        fontWeight: '800', 
        textTransform: 'uppercase', 
        margin: '5px 0 30px 0' 
    },
    spinnerBox: {
        width: '40px',
        height: '40px',
        border: '4px solid rgba(255, 255, 255, 0.1)',
        borderTop: '4px solid #3b82f6', // Blue accent
        borderRadius: '50%',
    }
};

// 🌍 GLOBAL CSS FOR SPINNER
if (typeof document !== 'undefined') {
    const style = document.createElement('style');
    style.innerHTML = `
        .stable-spinner {
            animation: spinFast 1s linear infinite;
        }
        @keyframes spinFast {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    `;
    document.head.appendChild(style);
}

export default App;