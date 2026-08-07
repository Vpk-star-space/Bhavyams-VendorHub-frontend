import React, { useState, useEffect, useRef, useCallback } from 'react';
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

// 🛡️ ULTRA-PREMIUM, SMART SERVER-AWARE LOADING SCREEN
const PremiumLoader = ({ isDataReady, forceSplash, onComplete }) => {
    const [fadeOut, setFadeOut] = useState(false);
    const [minTimeMet, setMinTimeMet] = useState(!forceSplash);
    const [statusText, setStatusText] = useState("Establishing Secure Connection...");
    const wakeLockRef = useRef(null);

    useEffect(() => {
        // Keep mobile screens awake while waiting for server
        const requestWakeLock = async () => {
            try {
                if ('wakeLock' in navigator) wakeLockRef.current = await navigator.wakeLock.request('screen');
            } catch (err) {}
        };
        requestWakeLock();
    }, []);

    useEffect(() => {
        // 1. THE BUG FIX: Safely enforce minimum splash screen without deadlocking
        if (forceSplash) {
            const minTimer = setTimeout(() => setMinTimeMet(true), 2500);
            return () => clearTimeout(minTimer);
        } else {
            setMinTimeMet(true); // Ensure it unlocks immediately if skipped
        }
    }, [forceSplash]);

    useEffect(() => {
        // 2. Smart UX: If the backend takes more than 4 seconds
        const slowServerTimer = setTimeout(() => {
            if (!isDataReady) {
                setStatusText("Waking Cloud Servers... (Please wait a moment)");
            }
        }, 4000);
        return () => clearTimeout(slowServerTimer);
    }, [isDataReady]);

    useEffect(() => {
        // 3. Perfect Exit: Only fade out when BOTH the minimum time is met AND the server sent data
        if (isDataReady && minTimeMet) {
            setFadeOut(true);
            const exitTimer = setTimeout(() => {
                if (wakeLockRef.current) wakeLockRef.current.release();
                onComplete(); 
            }, 600); // 600ms smooth fade transition
            return () => clearTimeout(exitTimer);
        }
    }, [isDataReady, minTimeMet, onComplete]);

    return (
        <div style={{...sStyles.wrapper, opacity: fadeOut ? 0 : 1, visibility: fadeOut ? 'hidden' : 'visible'}}>
            <style>
                {`
                    @keyframes spin-slow { 100% { transform: rotate(360deg); } }
                    @keyframes spin-fast { 100% { transform: rotate(-360deg); } }
                    @keyframes pulse-glow { 0%, 100% { text-shadow: 0 0 15px rgba(59,130,246,0.5); } 50% { text-shadow: 0 0 30px rgba(59,130,246,0.9); } }
                    @keyframes gradient-shift { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
                    @keyframes text-blink { 0%, 100% { opacity: 0.6; } 50% { opacity: 1; } }
                `}
            </style>

            <div style={sStyles.container}>
                {/* 🌟 Premium Double-Ring Vault Animation */}
                <div style={{ position: 'relative', width: '100px', height: '100px', marginBottom: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={sStyles.outerRing}></div>
                    <div style={sStyles.innerRing}></div>
                    <div style={{ fontSize: '28px', zIndex: 10 }}>🚀</div>
                </div>

                {/* 🌟 High-End Branding */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '15px' }}>
                    <h1 style={sStyles.brandName}>SUBHAMS</h1>
                    <span style={sStyles.hubBadge}>HUB</span>
                </div>
                
                {/* 🌟 Smart Dynamic Status Text */}
                <p style={sStyles.statusText}>{statusText}</p>
                
                {/* 🌟 Animated Loading Bar */}
                <div style={sStyles.loadingBarContainer}>
                    <div style={sStyles.loadingBarFill}></div>
                </div>
            </div>
        </div>
    );
};

function App() {
    const [googleClientId, setGoogleClientId] = useState(null);
    const [isAppReady, setIsAppReady] = useState(false);
    const [serverResponded, setServerResponded] = useState(false); 

    // 🟢 THE BUG FIX: Calculate the 1-minute rule SYNCHRONOUSLY before the app even renders
    const [forceSplash, setForceSplash] = useState(() => {
        const lastVisit = localStorage.getItem('lastVisitTime');
        const now = Date.now();
        if (lastVisit && (now - parseInt(lastVisit)) < 60000) {
            return false; // Less than 1 minute ago, skip splash
        }
        return true;
    });

    useEffect(() => {
        let isMounted = true;
        
        // 🌐 Fetch Google ID & Wake Up Backend
        const fetchGoogleId = async () => {
            try {
                const res = await axios.get('https://bhavyams-vendorhub-backend.onrender.com/api/auth/google-client-id');
                if (isMounted) {
                    setGoogleClientId(res.data.clientId);
                    setServerResponded(true); 
                }
            } catch (err) {
                console.error("Failed to fetch Google ID - Server might be offline.");
                if (isMounted) {
                    setGoogleClientId("offline-mode.apps.googleusercontent.com");
                    setServerResponded(true); 
                }
            }
        };
        fetchGoogleId();

        // 🟢 SAFETY NET: 10-second absolute override
        const safetyTimeout = setTimeout(() => {
            if (isMounted && !serverResponded) {
                setGoogleClientId("timeout-mode.apps.googleusercontent.com");
                setServerResponded(true);
            }
        }, 10000);

        return () => { 
            isMounted = false; 
            clearTimeout(safetyTimeout);
        };
    }, [serverResponded]);

    // 🟢 THE BUG FIX: useCallback prevents the loader from constantly re-rendering and resetting its timers
    const handleAppReady = useCallback(() => {
        localStorage.setItem('lastVisitTime', Date.now().toString());
        setIsAppReady(true);
    }, []);

    if (isMaintenanceMode) return <div style={{textAlign: 'center', marginTop: '20%', fontSize: '24px', fontWeight: 'bold'}}>Maintenance Mode Active</div>;

    if (!isAppReady) {
        return (
            <PremiumLoader 
                isDataReady={serverResponded} 
                forceSplash={forceSplash} 
                onComplete={handleAppReady} 
            />
        );
    }

    return (
        <GoogleOAuthProvider clientId={googleClientId}>
            <CartProvider>
                <Router>
                    <ScrollToTop />
                    <ToastContainer theme="colored" position="top-center" autoClose={1500} hideProgressBar={true} />
                    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
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
// 🎨 ULTRA-PREMIUM LOADER STYLES
// ==========================================
const sStyles = {
    wrapper: {
        position: 'fixed', top: 0, left: 0, width: '100%', height: '100vh',
        backgroundColor: '#020617', // Pitch dark premium slate
        display: 'flex', alignItems: 'center', justifyContent: 'center', 
        zIndex: 99999, fontFamily: "'Inter', 'Segoe UI', sans-serif",
        transition: 'opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
    },
    container: {
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        padding: '40px', borderRadius: '24px',
        background: 'radial-gradient(circle at center, rgba(30,41,59,0.5) 0%, rgba(2,6,23,0) 70%)'
    },
    outerRing: {
        position: 'absolute', width: '100px', height: '100px',
        border: '3px solid transparent', borderTop: '3px solid #3b82f6', borderBottom: '3px solid #8b5cf6',
        borderRadius: '50%', animation: 'spin-slow 2s linear infinite'
    },
    innerRing: {
        position: 'absolute', width: '75px', height: '75px',
        border: '3px solid transparent', borderLeft: '3px solid #facc15', borderRight: '3px solid #f59e0b',
        borderRadius: '50%', animation: 'spin-fast 1.5s linear infinite'
    },
    brandName: { 
        fontSize: 'clamp(32px, 6vw, 48px)', 
        color: '#ffffff', 
        fontWeight: '900', 
        margin: 0,
        letterSpacing: '2px',
        animation: 'pulse-glow 3s infinite ease-in-out'
    },
    hubBadge: { 
        fontSize: 'clamp(14px, 3vw, 18px)', 
        background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
        color: '#fff', 
        padding: '4px 12px', 
        borderRadius: '8px',
        fontWeight: '900', 
        letterSpacing: '2px',
        boxShadow: '0 4px 10px rgba(245,158,11,0.3)'
    },
    statusText: {
        color: '#94a3b8',
        fontSize: '14px',
        fontWeight: '600',
        marginTop: '25px',
        marginBottom: '15px',
        animation: 'text-blink 2s infinite ease-in-out'
    },
    loadingBarContainer: {
        width: '180px', height: '4px', background: '#1e293b', borderRadius: '4px', overflow: 'hidden'
    },
    loadingBarFill: {
        width: '50%', height: '100%',
        background: 'linear-gradient(90deg, #3b82f6, #8b5cf6, #f59e0b, #3b82f6)',
        backgroundSize: '300% 100%',
        borderRadius: '4px',
        animation: 'gradient-shift 2s infinite linear'
    }
};

export default App;