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
import VendorDashboard from './pages/VendorDashboard';

import AddProduct from './pages/AddProduct';
import ProtectedRoute from './components/ProtectedRoute';
import ProductDetails from './pages/ProductDetails';
import Profile from './pages/Profile';
import ShopProfile from './pages/ShopProfile';
import ManageCatalog from './pages/ManageCatalog';
import ItemDetail from './pages/ItemDetail';
import UserOrders from './pages/UserOrders';
import VendorOrders from './pages/VendorOrders';

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

// 🛍️ LIGHTNING FAST BRANDED LOADER (Non-blocking & smooth)
const PremiumLoader = ({ onComplete }) => {
    const [fadeOut, setFadeOut] = useState(false);

    useEffect(() => {
        // Fast, smooth entry animation timer (1.2 seconds max)
        const timer = setTimeout(() => {
            setFadeOut(true);
            const exitTimer = setTimeout(() => {
                onComplete();
            }, 500); // fade out duration
            return () => clearTimeout(exitTimer);
        }, 1200);

        return () => clearTimeout(timer);
    }, [onComplete]);

    return (
        <div style={{...sStyles.wrapper, opacity: fadeOut ? 0 : 1, visibility: fadeOut ? 'hidden' : 'visible'}}>
            <style>
                {`
                    @keyframes brand-reveal {
                        0% { transform: scale(0.9); opacity: 0; filter: blur(10px); }
                        50% { transform: scale(1.05); opacity: 1; filter: blur(0px); }
                        100% { transform: scale(1); opacity: 1; filter: blur(0px); }
                    }
                    @keyframes shine-bar {
                        0% { background-position: -200% 0; }
                        100% { background-position: 200% 0; }
                    }
                    @keyframes float-subtle {
                        0%, 100% { transform: translateY(0px); }
                        50% { transform: translateY(-6px); }
                    }
                `}
            </style>

            <div style={sStyles.container}>
                <div style={sStyles.iconBox}>
                    <span style={{ fontSize: '42px', animation: 'float-subtle 2s ease-in-out infinite' }}>🏪</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', animation: 'brand-reveal 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}>
                    <h1 style={sStyles.brandName}>SUBHAMS</h1>
                    <span style={sStyles.hubBadge}>HUB</span>
                </div>
                
                <p style={sStyles.statusText}>Your Local Marketplace</p>
                
                <div style={sStyles.loadingBarContainer}>
                    <div style={sStyles.loadingBarFill}></div>
                </div>
            </div>
        </div>
    );
};

function App() {
    const googleClientId = process.env.REACT_APP_GOOGLE_CLIENT_ID || "465013694995-fv7d53lqv69oh3305hkc7icijqhgpg4v.apps.googleusercontent.com";
    
    // 🟢 Fast initialization state
    const [isAppReady, setIsAppReady] = useState(false);
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [isInstallable, setIsInstallable] = useState(false);

    useEffect(() => {
        let isMounted = true;

        // Background ping to wake backend silently without blocking user
        axios.get('https://bhavyams-vendorhub-backend.onrender.com/api/auth/google-client-id').catch(() => {});

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

    // 🟢 Fast Loader Component Trigger
    if (!isAppReady) {
        return <PremiumLoader onComplete={handleAppReady} />;
    }

    return (
        <GoogleOAuthProvider clientId={googleClientId}>
            <AppProvider>
                <CartProvider>
                    <Router>
                        <ScrollToTop />
                        <ToastContainer theme="colored" position="top-center" autoClose={1500} hideProgressBar={true} />
                        <div style={{ minHeight: '100vh', background: '#f8fafc', position: 'relative' }}>
                            
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
                                            
                                            if (token && user.phone && user.phone.length > 3) {
                                                return <Home />;
                                            } else {
                                                return <Navigate to="/welcome" replace />;
                                            }
                                        })()
                                    } 
                                />
                                
                                <Route path="/welcome" element={<Welcome />} />
                                
                                <Route path="/admin" element={
                                    <AdminRoute>
                                        <AdminDashboard />
                                    </AdminRoute>
                                } />

                                <Route path="/shop/:id" element={<ShopProfile />} />
                                <Route path="/product/:id" element={<ProtectedRoute><ProductDetails /></ProtectedRoute>} />
                               
                                <Route path="/dashboard" element={<ProtectedRoute><VendorDashboard /></ProtectedRoute>} />
                                <Route path="/vendor-dashboard" element={<ProtectedRoute><VendorDashboard /></ProtectedRoute>} />
                                
                                <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                                <Route path="/register-business" element={<ProtectedRoute><BusinessRegistration /></ProtectedRoute>} />
                                <Route path="/add-product" element={<ProtectedRoute><AddProduct /></ProtectedRoute>} />
                                <Route path="/manage-catalog/:id" element={<ManageCatalog />} />
                                <Route path="*" element={<Navigate to="/" replace />} />
                                <Route path="/item/:itemId" element={<ItemDetail />} />
                                <Route path="/my-orders" element={<ProtectedRoute><UserOrders /></ProtectedRoute>} />
                                <Route path="/vendor/orders" element={<ProtectedRoute><VendorOrders /></ProtectedRoute>} />
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
        zIndex: 99999, fontFamily: "'Inter', sans-serif",
        transition: 'opacity 0.5s ease-in-out'
    },
    container: {
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        padding: '30px', borderRadius: '24px',
        background: 'rgba(30, 41, 59, 0.5)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
        width: '280px'
    },
    iconBox: {
        width: '75px', height: '75px', borderRadius: '50%',
        background: 'linear-gradient(135deg, #2563eb, #1e40af)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: '20px',
        boxShadow: '0 10px 20px rgba(37, 99, 235, 0.3)'
    },
    brandName: { 
        fontSize: '28px', 
        color: '#ffffff', 
        fontWeight: '900', 
        margin: 0,
        letterSpacing: '1px'
    },
    hubBadge: { 
        fontSize: '13px', 
        background: 'linear-gradient(135deg, #f59e0b, #d97706)', 
        color: '#fff', 
        padding: '3px 8px', 
        borderRadius: '6px',
        fontWeight: '900', 
        letterSpacing: '2px'
    },
    statusText: {
        color: '#94a3b8',
        fontSize: '13px',
        fontWeight: '500',
        marginTop: '10px',
        marginBottom: '20px'
    },
    loadingBarContainer: {
        width: '100%', height: '4px', background: '#334155', borderRadius: '4px', overflow: 'hidden'
    },
    loadingBarFill: {
        width: '100%', height: '100%',
        background: 'linear-gradient(90deg, transparent, #3b82f6, #facc15, transparent)',
        backgroundSize: '200% 100%',
        animation: 'shine-bar 1.2s infinite linear'
    }
};

export default App;