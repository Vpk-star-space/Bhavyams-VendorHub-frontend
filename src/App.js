import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { GoogleOAuthProvider } from '@react-oauth/google';
import axios from 'axios';
import 'react-toastify/dist/ReactToastify.css';

// 🟢 Global State Providers
import { AppProvider } from './context/AppContext'; 
import { CartProvider } from './context/CartContext'; 

import Home from './pages/Home'; 
import Welcome from './pages/Welcome';
import AdminDashboard from './pages/AdminDashboard';
import BusinessRegistration from './pages/BusinessRegistration';
import Dashboard from './pages/Dashboard';
import Cart from './pages/Cart'; 
import AddProduct from './pages/AddProduct';
import ProtectedRoute from './components/ProtectedRoute';
import VendorDashboard from './pages/VendorDashboard';
import ProductDetails from './pages/ProductDetails';
import Profile from './pages/Profile';
import ShopProfile from './pages/ShopProfile';

const isMaintenanceMode = false; 

function ScrollToTop() {
    const { pathname } = useLocation();
    useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
    return null;
}

// 🛡️ ULTRA-SECURE ADMIN GATEKEEPER
const AdminRoute = ({ children }) => {
    const userStr = localStorage.getItem('user');
    const user = userStr && userStr !== 'undefined' ? JSON.parse(userStr) : {};
    
    const isAdmin = (user.role && user.role.toLowerCase() === 'admin') || user.email === 'pavanvenkat63@gmail.com';

    return isAdmin ? children : <Navigate to="/" replace />;
};

// 🛍️ DIGITAL MARKETPLACE SMART LOADER
const PremiumLoader = ({ isDataReady, onComplete }) => {
    const [fadeOut, setFadeOut] = useState(false);
    const [statusText, setStatusText] = useState("Connecting Local Markets...");

    useEffect(() => {
        const slowServerTimer = setTimeout(() => {
            if (!isDataReady) {
                setStatusText("Waking up the Marketplace... (Please wait a moment)");
            }
        }, 3000);
        return () => clearTimeout(slowServerTimer);
    }, [isDataReady]);

    useEffect(() => {
        if (isDataReady) {
            setFadeOut(true);
            const exitTimer = setTimeout(() => {
                onComplete(); 
            }, 600); 
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
                <div style={{ position: 'relative', width: '100px', height: '100px', marginBottom: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={sStyles.pulseRing1}></div>
                    <div style={sStyles.pulseRing2}></div>
                    <div style={{ fontSize: '45px', zIndex: 10, animation: 'float-icon 2.5s ease-in-out infinite' }}>🏪</div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                    <h1 style={sStyles.brandName}>SUBHAMS</h1>
                    <span style={sStyles.hubBadge}>HUB</span>
                </div>
                
                <p style={sStyles.statusText}>{statusText}</p>
                
                <div style={sStyles.loadingBarContainer}>
                    <div style={sStyles.loadingBarFill}></div>
                </div>
            </div>
        </div>
    );
};

function App() {
    // 🟢 BUG FIX: Hardcode Client ID so it never fails on mobile/slow connection
    const googleClientId = process.env.REACT_APP_GOOGLE_CLIENT_ID || "465013694995-fv7d53lqv69oh3305hkc7icijqhgpg4v.apps.googleusercontent.com";
    
    const [isAppReady, setIsAppReady] = useState(false);
    const [serverResponded, setServerResponded] = useState(false); 

    // PWA INSTALLATION STATE
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [isInstallable, setIsInstallable] = useState(false);

    useEffect(() => {
        let isMounted = true;

        // Wake up Render backend, but don't crash if it's asleep
        axios.get('https://bhavyams-vendorhub-backend.onrender.com/api/auth/google-client-id')
            .then(() => { if(isMounted) setServerResponded(true); })
            .catch(() => { if(isMounted) setServerResponded(true); });

        const handleBeforeInstallPrompt = (e) => {
            e.preventDefault(); 
            setDeferredPrompt(e); 
            setIsInstallable(true); 
        };
        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        return () => { 
            isMounted = false; 
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []); 

    const handleAppReady = useCallback(() => {
        setIsAppReady(true);
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt(); 
        
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            setIsInstallable(false); 
            setDeferredPrompt(null);
        }
    };

    if (isMaintenanceMode) return <div style={{textAlign: 'center', marginTop: '20%', fontSize: '24px', fontWeight: 'bold'}}>Maintenance Mode Active</div>;

    if (!isAppReady) {
        return <PremiumLoader isDataReady={serverResponded} onComplete={handleAppReady} />;
    }

    return (
        <GoogleOAuthProvider clientId={googleClientId}>
            <AppProvider>
                <CartProvider>
                    <Router>
                        <ScrollToTop />
                        <ToastContainer theme="colored" position="top-center" autoClose={1500} hideProgressBar={true} />
                        <div style={{ minHeight: '100vh', background: '#f8fafc', position: 'relative' }}>
                            
                            {/* PREMIUM INSTALL BANNER */}
                            {isInstallable && (
                                <div style={{
                                    background: 'linear-gradient(90deg, #0f172a, #2563eb)',
                                    color: 'white',
                                    padding: '12px 15px',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    position: 'sticky',
                                    top: 0,
                                    zIndex: 999, 
                                    boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <span style={{ fontSize: '28px', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }}>📲</span>
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span style={{ fontSize: '15px', fontWeight: '900', letterSpacing: '0.5px' }}>Install Subhams Hub</span>
                                            <span style={{ fontSize: '11px', color: '#bfdbfe', fontWeight: '600' }}>Fast access • No browser needed</span>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={handleInstallClick}
                                        style={{
                                            background: 'linear-gradient(135deg, #facc15, #f59e0b)',
                                            color: '#713f12',
                                            border: 'none',
                                            padding: '8px 18px',
                                            borderRadius: '20px',
                                            fontWeight: '900',
                                            fontSize: '12px',
                                            cursor: 'pointer',
                                            boxShadow: '0 4px 10px rgba(245, 158, 11, 0.4)',
                                            transition: 'transform 0.2s'
                                        }}
                                        onMouseOver={(e) => e.target.style.transform = 'scale(1.05)'}
                                        onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
                                    >
                                        INSTALL NOW
                                    </button>
                                </div>
                            )}
                            <Routes>
                                <Route 
                                    path="/" 
                                    element={
                                        (() => {
                                            const token = localStorage.getItem('token');
                                            const userStr = localStorage.getItem('user');
                                            const user = userStr && userStr !== 'undefined' ? JSON.parse(userStr) : {};
                                            
                                            // 🟢 If they have a token AND their phone number is saved in DB, let them straight in!
                                            if (token && user.phone && user.phone.length > 3) {
                                                return <Home />;
                                            } else {
                                                return <Navigate to="/welcome" replace />;
                                            }
                                        })()
                                    } 
                                />
                                
                                <Route path="/welcome" element={<Welcome />} />
                                
                                {/* 🔒 SECURE MASTER ADMIN PANEL ROUTE */}
                                <Route path="/admin" element={
                                    <AdminRoute>
                                        <AdminDashboard />
                                    </AdminRoute>
                                } />

                                {/* 🌍 NEW: THE PUBLIC INSTAGRAM-STYLE SHOP PROFILE */}
                                <Route path="/shop/:id" element={<ShopProfile />} />

                                <Route path="/product/:id" element={<ProtectedRoute><ProductDetails /></ProtectedRoute>} />
                                <Route path="/cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
                                <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                                
                                <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                                <Route path="/register-business" element={<ProtectedRoute><BusinessRegistration /></ProtectedRoute>} />
                                <Route path="/vendor-dashboard" element={<ProtectedRoute><VendorDashboard /></ProtectedRoute>} />
                                <Route path="/add-product" element={<ProtectedRoute><AddProduct /></ProtectedRoute>} />
                                
                                <Route path="*" element={<Navigate to="/" replace />} />
                                
                            </Routes>
                        </div>
                    </Router>
                </CartProvider>
            </AppProvider>
        </GoogleOAuthProvider>
    );
}

const sStyles = {
    wrapper: {
        position: 'fixed', top: 0, left: 0, width: '100%', height: '100vh',
        backgroundColor: '#0f172a', 
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
        background: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)', 
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