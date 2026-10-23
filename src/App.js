import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import { GoogleOAuthProvider } from '@react-oauth/google';
import axios from 'axios';
import 'react-toastify/dist/ReactToastify.css';

import { AppProvider, socket } from './context/AppContext'; 
import { CartProvider } from './context/CartContext'; 
import { BACKEND_URL as API_BASE_URL } from './config/api';

import Home from './pages/Home'; 
import Welcome from './pages/Welcome';
import AdminDashboard from './pages/AdminDashboard';
import BusinessRegistration from './pages/BusinessRegistration';
import VendorDashboard from './pages/VendorDashboard';

import ProtectedRoute from './components/ProtectedRoute';
import ProductDetails from './pages/ProductDetails';
import Profile from './pages/Profile';
import ShopProfile from './pages/ShopProfile';
import ManageCatalog from './pages/ManageCatalog';
import ItemDetail from './pages/ItemDetail';
import UserOrders from './pages/UserOrders';
import VendorOrders from './pages/VendorOrders';
import Expo from './pages/Expo';
import Chat from './pages/Chat';
import PushDashboard from './pages/PushDashboard';
import Notifications from './pages/Notifications';
import PremiumEmailBlaster from './pages/PremiumEmailBlaster'; // Adjust path if it's in components

const AdminRoute = ({ children }) => {
    const userStr = localStorage.getItem('user');
    const user = userStr && userStr !== 'undefined' ? JSON.parse(userStr) : {};
    const isAdmin = (user.role && user.role.toLowerCase() === 'admin') || user.email === 'pavanvenkat63@gmail.com';
    return isAdmin ? children : <Navigate to="/" replace />;
};

const isMaintenanceMode = false; 

function ScrollToTop() {
    const { pathname } = useLocation();
    useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
    return null;
}

const PremiumLoader = ({ onComplete }) => {
    const [fadeOut, setFadeOut] = useState(false);
    useEffect(() => {
        const timer = setTimeout(() => {
            setFadeOut(true);
            const exitTimer = setTimeout(() => { onComplete(); }, 300); 
            return () => clearTimeout(exitTimer);
        }, 400);
        return () => clearTimeout(timer);
    }, [onComplete]);

    return (
        <div style={{...sStyles.wrapper, opacity: fadeOut ? 0 : 1, visibility: fadeOut ? 'hidden' : 'visible'}}>
            <style>
                {`
                    @keyframes brand-reveal { 0% { transform: scale(0.9); opacity: 0; filter: blur(10px); } 50% { transform: scale(1.05); opacity: 1; filter: blur(0px); } 100% { transform: scale(1); opacity: 1; filter: blur(0px); } }
                    @keyframes shine-bar { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
                    @keyframes float-subtle { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-6px); } }
                `}
            </style>
            <div style={sStyles.container}>
                <div style={sStyles.iconBox}><span style={{ fontSize: '42px', animation: 'float-subtle 2s ease-in-out infinite' }}>🏪</span></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', animation: 'brand-reveal 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}>
                    <h1 style={sStyles.brandName}>SUBHAMS</h1><span style={sStyles.hubBadge}>HUB</span>
                </div>
                <p style={sStyles.statusText}>Your Local Marketplace</p>
                <div style={sStyles.loadingBarContainer}><div style={sStyles.loadingBarFill}></div></div>
            </div>
        </div>
    );
};

function App() {
    const googleClientId = process.env.REACT_APP_GOOGLE_CLIENT_ID || "465013694995-fv7d53lqv69oh3305hkc7icijqhgpg4v.apps.googleusercontent.com";
    
    const [isAppReady, setIsAppReady] = useState(false);
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [isInstallable, setIsInstallable] = useState(false);
    const [timeLeft, setTimeLeft] = useState(''); 
    const [targetDateString, setTargetDateString] = useState('');

    const [currentUser, setCurrentUser] = useState(() => {
        try {
            const str = localStorage.getItem('user');
            return str && str !== 'undefined' ? JSON.parse(str) : null;
        } catch (e) { return null; }
    });

    const isMasterAdminImmune = currentUser?.email === 'pavanvenkat63@gmail.com' || String(currentUser?.id) === "1";

    useEffect(() => {
        const syncStatus = async () => {
            const token = localStorage.getItem('token');
            if (token && currentUser?.id) {
                try {
                    const res = await axios.get(`${API_BASE_URL}/admin/my-security-status`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    
                    const updatedUser = { 
                        ...JSON.parse(localStorage.getItem('user') || '{}'), 
                        account_status: res.data.account_status, 
                        ban_reason: res.data.ban_reason, 
                        ban_until: res.data.ban_until,
                        can_message: res.data.can_message,
                        can_call: res.data.can_call,
                        can_book: res.data.can_book
                    };
                    
                    setCurrentUser(updatedUser);
                    localStorage.setItem('user', JSON.stringify(updatedUser));
                } catch (err) {}
            }
        };
        syncStatus();
    }, [currentUser?.id]); 

    // 🟢 REGISTER SOCKET & LISTEN FOR ALL REAL-TIME ALERTS (ADMIN + USER + BROADCAST)
    useEffect(() => {
        if (!currentUser) return;

        socket.emit('register_user', currentUser.id);

        const handleAdminAlert = (data) => {
            if (currentUser.role === 'admin' || currentUser.email === 'pavanvenkat63@gmail.com') {
                toast.info(`🔔 ${data.title}: ${data.message}`, { autoClose: 7000 });
            }
        };

        const handleUserAlert = (data) => {
            if (String(data.userId) === String(currentUser.id)) {
                toast.info(`🔔 ${data.title}: ${data.message}`, { autoClose: 6000 });
            }
        };

        const handleBroadcastAlert = (data) => {
            toast.info(`📢 ${data.title}: ${data.message}`, { autoClose: 7000 });
        };

        const handleForceLogout = (data) => {
            if (String(data.userId) === String(currentUser.id)) {
                if (data.action !== 'unblock' && (currentUser.email === 'pavanvenkat63@gmail.com' || String(currentUser.id) === "1")) {
                    return;
                }

                const updatedUser = { ...currentUser };
                if (data.action === 'warn' || data.action === 'add_strike') {
                    updatedUser.account_status = 'warned';
                    updatedUser.ban_reason = data.reason;
                } else if (data.action === 'temp_block') {
                    updatedUser.account_status = 'temp_block';
                    updatedUser.ban_reason = data.reason;
                    if (data.ban_until) updatedUser.ban_until = data.ban_until;
                } else if (data.action === 'perma_banned') {
                    updatedUser.account_status = 'perma_banned';
                    updatedUser.ban_reason = data.reason;
                } else if (data.action === 'unblock') {
                    updatedUser.account_status = 'active';
                    updatedUser.ban_reason = null;
                    updatedUser.ban_until = null;
                } else if (data.action === 'toggle_features' && data.features) {
                    updatedUser.can_message = data.features.can_message;
                    updatedUser.can_call = data.features.can_call;
                    updatedUser.can_book = data.features.can_book;
                } else if (data.action === 'delete') {
                    localStorage.clear();
                    window.location.href = '/welcome';
                    return;
                }
                setCurrentUser(updatedUser);
                localStorage.setItem('user', JSON.stringify(updatedUser));
            }
        };

        socket.on('admin_realtime_alert', handleAdminAlert);
        socket.on('user_realtime_alert', handleUserAlert);
        socket.on('broadcast_realtime_alert', handleBroadcastAlert);
        socket.on('force_logout', handleForceLogout);

        return () => {
            socket.off('admin_realtime_alert', handleAdminAlert);
            socket.off('user_realtime_alert', handleUserAlert);
            socket.off('broadcast_realtime_alert', handleBroadcastAlert);
            socket.off('force_logout', handleForceLogout);
        };
    }, [currentUser]);

    useEffect(() => {
        if (currentUser?.account_status === 'temp_block' && currentUser?.ban_until) {
            const runTimer = () => {
                let dateStr = String(currentUser.ban_until);
                if (!dateStr.endsWith('Z') && !dateStr.includes('+')) dateStr += 'Z'; 
                
                const unblockTime = new Date(dateStr);
                const now = new Date();
                const diff = unblockTime.getTime() - now.getTime();

                if (isNaN(unblockTime.getTime())) {
                    setTimeLeft('Admin Lock Active');
                    return;
                }

                const formattedTarget = unblockTime.toLocaleString('en-IN', {
                    timeZone: 'Asia/Kolkata',
                    hour: 'numeric', minute: '2-digit', hour12: true,
                    day: '2-digit', month: '2-digit', year: 'numeric'
                });
                setTargetDateString(formattedTarget);

                if (diff <= 0) {
                    setTimeLeft('Unblocking...');
                    const activeUser = { ...currentUser, account_status: 'active', ban_reason: null, ban_until: null };
                    setCurrentUser(activeUser);
                    localStorage.setItem('user', JSON.stringify(activeUser));
                    
                    axios.get(`${API_BASE_URL}/admin/my-security-status`, { 
                        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } 
                    }).catch(() => {});
                } else {
                    const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                    const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                    const s = Math.floor((diff % (1000 * 60)) / 1000);
                    setTimeLeft(`${h > 0 ? h + 'h ' : ''}${m}m ${s}s`);
                }
            };

            runTimer(); 
            const interval = setInterval(runTimer, 1000);
            return () => clearInterval(interval);
        }
    }, [currentUser]); 

    useEffect(() => {
        axios.get(`${API_BASE_URL}/auth/google-client-id`).catch(() => {});

        const handleBeforeInstallPrompt = (e) => {
            e.preventDefault(); 
            setDeferredPrompt(e); 
            setIsInstallable(true); 
        };
        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    }, []); 

    const handleAppReady = useCallback(() => { setIsAppReady(true); }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt(); 
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') { setIsInstallable(false); setDeferredPrompt(null); }
    };

    if (isMaintenanceMode) {
        return (
            <div style={maintenanceStyles.page}>
                <div style={maintenanceStyles.card}>
                    <div style={maintenanceStyles.iconWrapper}><div style={{ fontSize: '50px' }}>⚙️</div></div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '5px' }}>
                        <h1 style={maintenanceStyles.title}>SUBHAMS</h1><span style={maintenanceStyles.hubBadge}>HUB</span>
                    </div>
                    <h2 style={maintenanceStyles.subtitle}>System Maintenance</h2>
                </div>
            </div>
        );
    }

    if (!isAppReady) {
        return <PremiumLoader onComplete={handleAppReady} />;
    }

    if (currentUser && currentUser.account_status && !isMasterAdminImmune) {
        if (currentUser.account_status === 'temp_block') {
            return (
                <div style={lockStyles.page}>
                    <div style={{...lockStyles.card, border: '2px solid #ea580c'}}>
                        <div style={{...lockStyles.brandHeader, background: 'linear-gradient(135deg, #1e3a8a, #2563eb)'}}>
                            <h2 style={{margin: '0', fontSize: '18px', color: '#ffffff', fontWeight: '900', letterSpacing: '1px'}}>SUBHAMS HUB</h2>
                            <p style={{margin: '2px 0 0 0', fontSize: '10px', color: '#93c5fd', fontWeight: '700', textTransform: 'uppercase'}}>Official Security Gateway</p>
                        </div>
                        <h1 style={{ color: '#ea580c', ...lockStyles.title }}>⏳ Temporary Restriction Active</h1>
                        <p style={lockStyles.subtitle}>Your account access is temporarily paused by Subhams Hub administration.</p>
                        
                        <div style={{ background: '#fef3c7', border: '1px solid #fde68a', padding: '15px', borderRadius: '12px', margin: '0 20px 15px 20px', textAlign: 'left' }}>
                            <p style={{ margin: '0 0 4px 0', fontSize: '11px', fontWeight: 'bold', color: '#b45309' }}>REASON:</p>
                            <p style={{ margin: 0, fontSize: '13px', fontWeight: '600', color: '#78350f' }}>{currentUser.ban_reason || 'Policy alignment check.'}</p>
                        </div>

                        <div style={{...lockStyles.reasonBox, background: '#fff7ed', border: '1px solid #ffedd5'}}>
                            <p style={{...lockStyles.reasonTitle, color: '#c2410c'}}>Scheduled Unlock Notice:</p>
                            <p style={{ margin: '4px 0 0 0', fontSize: '13px', fontWeight: '700', color: '#9a3412', lineHeight: '1.4' }}>
                                Full access will automatically restore at <strong>{targetDateString || 'Scheduled Time'}</strong>.
                            </p>
                        </div>

                        <div style={{...lockStyles.reasonBox, background: '#f8fafc', marginTop: '10px', border: '1px solid #e2e8f0'}}>
                            <p style={{...lockStyles.reasonTitle, color: '#475569'}}>Time Remaining:</p>
                            <p style={{ margin: 0, fontSize: '24px', color: '#0f172a', fontWeight: '900', letterSpacing: '1px', textAlign: 'center' }}>
                                {timeLeft}
                            </p>
                        </div>
                    </div>
                </div>
            );
        }

        if (currentUser.account_status === 'perma_banned') {
            return (
                <div style={{...lockStyles.page, background: '#fef2f2'}}>
                    <div style={{...lockStyles.card, border: '2px solid #dc2626'}}>
                        <div style={{...lockStyles.brandHeader, background: '#7f1d1d'}}>
                            <h2 style={{margin: '0', fontSize: '18px', color: '#ffffff', fontWeight: '900', letterSpacing: '1px'}}>SUBHAMS HUB</h2>
                            <p style={{margin: '2px 0 0 0', fontSize: '10px', color: '#fca5a5', fontWeight: '700', textTransform: 'uppercase'}}>Security & Privacy Network</p>
                        </div>
                        <h1 style={{ color: '#dc2626', ...lockStyles.title }}>⛔ Permanently Banned</h1>
                        <p style={lockStyles.subtitle}>This account has been permanently disabled due to severe policy violations.</p>
                        <div style={{...lockStyles.reasonBox, background: '#fee2e2'}}>
                            <p style={{...lockStyles.reasonTitle, color: '#b91c1c'}}>Reason for Ban:</p>
                            <p style={{...lockStyles.reasonText, color: '#991b1b'}}>{currentUser.ban_reason || 'Severe violation of guidelines.'}</p>
                        </div>
                    </div>
                </div>
            );
        }
    }

    return (
        <GoogleOAuthProvider clientId={googleClientId}>
            <AppProvider>
                <CartProvider>
                    <Router>
                        <ScrollToTop />
                        <ToastContainer theme="colored" position="top-center" autoClose={2000} hideProgressBar={true} />
                        <div style={{ minHeight: '100vh', background: '#f8fafc', position: 'relative' }}>
                            
                            {isInstallable && (
                                <div style={{
                                    background: 'linear-gradient(90deg, #0f172a, #2563eb)', color: 'white', padding: '12px 15px',
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky',
                                    top: 0, zIndex: 999, boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <span style={{ fontSize: '28px' }}>📲</span>
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span style={{ fontSize: '15px', fontWeight: '900' }}>Install Subhams Hub</span>
                                            <span style={{ fontSize: '11px', color: '#bfdbfe', fontWeight: '600' }}>Fast access • No browser needed</span>
                                        </div>
                                    </div>
                                    <button onClick={handleInstallClick} style={{ background: 'linear-gradient(135deg, #facc15, #f59e0b)', color: '#713f12', border: 'none', padding: '8px 18px', borderRadius: '20px', fontWeight: '900', fontSize: '12px', cursor: 'pointer' }}>
                                        INSTALL NOW
                                    </button>
                                </div>
                            )}
                            
                            <Routes>
                                {/* PUBLIC ROUTES */}
                                <Route path="/" element={<Home />} />
                                <Route path="/expo" element={<Expo />} />
                                <Route path="/shop/:id" element={<ShopProfile />} />
                                <Route path="/product/:id" element={<ProductDetails />} /> 
                                <Route path="/item/:itemId" element={<ItemDetail />} />
                                <Route path="/welcome" element={<Welcome />} />
                                <Route path="/login" element={<Navigate to="/welcome" replace />} />
                                <Route path="/cart" element={<Navigate to="/my-orders" replace />} />

                                {/* SECURED USER/VENDOR ROUTES */}
                                <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
                                <Route path="/chat/:conversationId" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
                                <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                                <Route path="/dashboard" element={<ProtectedRoute><VendorDashboard /></ProtectedRoute>} />
                                <Route path="/vendor-dashboard" element={<ProtectedRoute><VendorDashboard /></ProtectedRoute>} />
                                <Route path="/register-business" element={<ProtectedRoute><BusinessRegistration /></ProtectedRoute>} />
                                <Route path="/manage-catalog/:id" element={<ProtectedRoute><ManageCatalog /></ProtectedRoute>} />
                                <Route path="/my-orders" element={<ProtectedRoute><UserOrders /></ProtectedRoute>} />
                                <Route path="/vendor/orders" element={<ProtectedRoute><VendorOrders /></ProtectedRoute>} />
                                
                                {/* MASTER ADMIN ROUTES */}
                                <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
                                <Route path="/admin/push" element={<AdminRoute><PushDashboard /></AdminRoute>} />
                                <Route 
    path="/admin/email-blaster" 
    element={<PremiumEmailBlaster />} 
/>
                                <Route path="*" element={<Navigate to="/" replace />} />
                            </Routes>
                        </div>
                    </Router>
                </CartProvider>
            </AppProvider>
        </GoogleOAuthProvider>
    );
}

const maintenanceStyles = {
    page: { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#0f172a', padding: '20px', fontFamily: 'Inter, sans-serif' },
    card: { background: 'white', padding: '30px 20px', borderRadius: '24px', boxShadow: '0 20px 50px rgba(0,0,0,0.5)', width: '100%', maxWidth: '420px', textAlign: 'center', boxSizing: 'border-box' },
    iconWrapper: { background: 'linear-gradient(135deg, #e2e8f0, #f1f5f9)', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px auto' },
    title: { margin: 0, fontSize: '24px', fontWeight: '900', color: '#0f172a', letterSpacing: '1px' },
    hubBadge: { fontSize: '11px', background: 'linear-gradient(135deg, #facc15, #f59e0b)', color: '#713f12', padding: '4px 8px', borderRadius: '6px', fontWeight: '900', letterSpacing: '2px' },
    subtitle: { color: '#2563eb', fontSize: '18px', fontWeight: '800', margin: '0 0 20px 0' }
};

const lockStyles = {
    page: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#f8fafc', padding: '20px', fontFamily: 'Inter, sans-serif' },
    card: { background: 'white', padding: '0px 0px 30px 0px', borderRadius: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', width: '100%', maxWidth: '420px', textAlign: 'center', boxSizing: 'border-box', overflow: 'hidden' },
    brandHeader: { padding: '18px', marginBottom: '20px', borderBottom: '1px solid rgba(0,0,0,0.05)' },
    title: { margin: '0 0 10px 0', fontSize: '20px', fontWeight: '900', padding: '0 20px' },
    subtitle: { color: '#475569', fontSize: '13px', margin: '0 0 20px 0', lineHeight: '1.5', padding: '0 20px' },
    reasonBox: { padding: '15px', borderRadius: '12px', textAlign: 'left', margin: '0 20px' },
    reasonTitle: { margin: '0 0 5px 0', fontSize: '12px', fontWeight: '900', textTransform: 'uppercase' },
    reasonText: { margin: 0, fontSize: '13px', fontWeight: '600' }
};

const sStyles = {
    wrapper: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100vh', backgroundColor: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, fontFamily: "'Inter', sans-serif", transition: 'opacity 0.5s ease-in-out' },
    container: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '30px', borderRadius: '24px', background: 'rgba(30, 41, 59, 0.5)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255, 255, 255, 0.1)', boxShadow: '0 20px 40px rgba(0,0,0,0.4)', width: '280px' },
    iconBox: { width: '75px', height: '75px', borderRadius: '50%', background: 'linear-gradient(135deg, #2563eb, #1e40af)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px auto', boxShadow: '0 10px 20px rgba(37, 99, 235, 0.3)' },
    brandName: { fontSize: '28px', color: '#ffffff', fontWeight: '900', margin: 0, letterSpacing: '1px' },
    hubBadge: { fontSize: '13px', background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#fff', padding: '3px 8px', borderRadius: '6px', fontWeight: '900', letterSpacing: '2px' },
    statusText: { color: '#94a3b8', fontSize: '13px', fontWeight: '500', marginTop: '10px', marginBottom: '20px' },
    loadingBarContainer: { width: '100%', height: '4px', background: '#334155', borderRadius: '4px', overflow: 'hidden' },
    loadingBarFill: { width: '100%', height: '100%', background: 'linear-gradient(90deg, transparent, #3b82f6, #facc15, transparent)', backgroundSize: '200% 100%', animation: 'shine-bar 1.2s infinite linear' }
};

export default App;