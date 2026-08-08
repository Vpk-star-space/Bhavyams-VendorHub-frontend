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

// 🛍️ DIGITAL MARKETPLACE SMART LOADER (Customized for Subhams Hub)
const PremiumLoader = ({ isDataReady, onComplete }) => {
    const [fadeOut, setFadeOut] = useState(false);
    const [statusText, setStatusText] = useState("Connecting Local Markets...");

    useEffect(() => {
        // Smart UX: If backend takes more than 3 seconds (asleep), change the text
        const slowServerTimer = setTimeout(() => {
            if (!isDataReady) {
                setStatusText("Waking up the Marketplace... (Please wait a moment)");
            }
        }, 3000);
        return () => clearTimeout(slowServerTimer);
    }, [isDataReady]);

    useEffect(() => {
        // Perfect Exit: As soon as data is ready, fade out immediately.
        if (isDataReady) {
            setFadeOut(true);
            const exitTimer = setTimeout(() => {
                onComplete(); 
            }, 600); // 600ms smooth fade transition
            return () => clearTimeout(exitTimer);
        }
    }, [isDataReady, onComplete]);

    return (
        <div style={{...sStyles.wrapper, opacity: fadeOut ? 0 : 1, visibility: fadeOut ? 'hidden' : 'visible'}}>
            <style>
                {`
                    @keyframes broadcast-pulse { 
                        0% { transform: scale(0.8); opacity: 0.8; border-width: 4px; } 
                        100% { transform: scale(2.5); opacity: 0; border-width: 1px; } 
                    }
                    @keyframes float-icon { 
                        0%, 100% { transform: translateY(0px); filter: drop-shadow(0 4px 8px rgba(0,0,0,0.3)); } 
                        50% { transform: translateY(-8px); filter: drop-shadow(0 15px 15px rgba(37,99,235,0.4)); } 
                    }
                    @keyframes pulse-glow { 
                        0%, 100% { text-shadow: 0 0 10px rgba(37,99,235,0.3); } 
                        50% { text-shadow: 0 0 25px rgba(37,99,235,0.8); } 
                    }
                    @keyframes gradient-shift { 
                        0% { background-position: 0% 50%; } 
                        50% { background-position: 100% 50%; } 
                        100% { background-position: 0% 50%; } 
                    }
                    @keyframes text-blink { 
                        0%, 100% { opacity: 0.6; } 
                        50% { opacity: 1; } 
                    }
                `}
            </style>

            <div style={sStyles.container}>
                {/* 🌟 Local Business Digital Radar Animation */}
                <div style={{ position: 'relative', width: '100px', height: '100px', marginBottom: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={sStyles.pulseRing1}></div>
                    <div style={sStyles.pulseRing2}></div>
                    <div style={{ fontSize: '45px', zIndex: 10, animation: 'float-icon 2.5s ease-in-out infinite' }}>🏪</div>
                </div>

                {/* 🌟 High-End Branding */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
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
    
    // 🟢 The Ref that fixes the Vercel ESLint strict rules
    const hasRespondedRef = useRef(false);

    useEffect(() => {
        let isMounted = true;
        
        // 🌐 Fetch Google ID & Wake Up Backend
        const fetchGoogleId = async () => {
            try {
                const res = await axios.get('https://bhavyams-vendorhub-backend.onrender.com/api/auth/google-client-id');
                if (isMounted) {
                    hasRespondedRef.current = true;
                    setGoogleClientId(res.data.clientId);
                    setServerResponded(true); 
                }
            } catch (err) {
                console.error("Failed to connect to backend.");
                if (isMounted) {
                    hasRespondedRef.current = true;
                    setGoogleClientId("offline-mode.apps.googleusercontent.com");
                    setServerResponded(true); 
                }
            }
        };
        fetchGoogleId();

        // 🟢 SAFETY NET: If Render takes an absurdly long time
        const safetyTimeout = setTimeout(() => {
            if (isMounted && !hasRespondedRef.current) {
                hasRespondedRef.current = true;
                setGoogleClientId("timeout-mode.apps.googleusercontent.com");
                setServerResponded(true);
            }
        }, 45000);

        return () => { 
            isMounted = false; 
            clearTimeout(safetyTimeout);
        };
    }, []); // Empty array ensures zero Vercel warnings.

    const handleAppReady = useCallback(() => {
        setIsAppReady(true);
    }, []);

    if (isMaintenanceMode) return <div style={{textAlign: 'center', marginTop: '20%', fontSize: '24px', fontWeight: 'bold'}}>Maintenance Mode Active</div>;

    if (!isAppReady) {
        return <PremiumLoader isDataReady={serverResponded} onComplete={handleAppReady} />;
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
// 🎨 HUB-SPECIFIC LOADER STYLES
// ==========================================
const sStyles = {
    wrapper: {
        position: 'fixed', top: 0, left: 0, width: '100%', height: '100vh',
        backgroundColor: '#0f172a', // Clean, professional dark blue for e-commerce
        display: 'flex', alignItems: 'center', justifyContent: 'center', 
        zIndex: 99999, fontFamily: "'Roboto', 'Inter', sans-serif",
        transition: 'opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
    },
    container: {
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        padding: '40px', borderRadius: '24px',
        background: 'radial-gradient(circle at center, rgba(30,41,59,0.7) 0%, rgba(15,23,42,0) 70%)'
    },
    pulseRing1: {
        position: 'absolute', width: '80px', height: '80px',
        border: 'solid #3b82f6', borderRadius: '50%',
        animation: 'broadcast-pulse 2s cubic-bezier(0.16, 1, 0.3, 1) infinite'
    },
    pulseRing2: {
        position: 'absolute', width: '80px', height: '80px',
        border: 'solid #60a5fa', borderRadius: '50%',
        animation: 'broadcast-pulse 2s cubic-bezier(0.16, 1, 0.3, 1) infinite 1s'
    },
    brandName: { 
        fontSize: 'clamp(32px, 6vw, 45px)', 
        color: '#ffffff', 
        fontWeight: '900', 
        margin: 0,
        letterSpacing: '1px',
        animation: 'pulse-glow 3s infinite ease-in-out'
    },
    hubBadge: { 
        fontSize: 'clamp(14px, 3vw, 18px)', 
        background: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)', // E-commerce trustworthy blue
        color: '#fff', 
        padding: '4px 12px', 
        borderRadius: '8px',
        fontWeight: '900', 
        letterSpacing: '2px',
        boxShadow: '0 4px 10px rgba(37,99,235,0.3)'
    },
    statusText: {
        color: '#94a3b8',
        fontSize: '14.5px',
        fontWeight: '500',
        marginTop: '25px',
        marginBottom: '15px',
        animation: 'text-blink 2s infinite ease-in-out'
    },
    loadingBarContainer: {
        width: '200px', height: '4px', background: '#1e293b', borderRadius: '4px', overflow: 'hidden'
    },
    loadingBarFill: {
        width: '50%', height: '100%',
        background: 'linear-gradient(90deg, #3b82f6, #60a5fa, #facc15, #3b82f6)',
        backgroundSize: '300% 100%',
        borderRadius: '4px',
        animation: 'gradient-shift 2s infinite linear'
    }
};

export default App;