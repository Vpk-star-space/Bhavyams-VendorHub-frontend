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

// 🛠️ ==========================================
// 🛠️ MAINTENANCE MODE SETTINGS (MASTER CONTROL)
// 🛠️ ==========================================

// 🛑 1. MASTER SWITCH: Turn Maintenance Mode ON or OFF
const isMaintenanceMode = true; // 🟢 Change to 'false' to open your app!

// 🎯 2. TARGET TIME: Tell users when you will be back online
const targetRestoreTime = "null"; 


// 🚀 Helper: Always start at the top of the page on route change
function ScrollToTop() {
    const { pathname } = useLocation();
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [pathname]);
    return null;
}

// 🛡️ Compact & Professional Maintenance Component
const MaintenanceScreen = () => {
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const liveTimeString = currentTime.toLocaleTimeString('en-US', { 
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true 
    });

    return (
        <div style={mStyles.container}>
            <style>{`
                @keyframes dataFlow {
                    0% { width: 0%; }
                    100% { width: 100%; }
                }
                @keyframes slideIn {
                    0% { transform: translateY(20px); opacity: 0; }
                    100% { transform: translateY(0); opacity: 1; }
                }
                .clock-text {
                    font-variant-numeric: tabular-nums;
                }
            `}</style>

            <div style={mStyles.card}>
                
                {/* 1. BRAND & HEADER */}
                <h1 style={mStyles.brandTitle}>Bhavyams <span style={{color: '#ffe500'}}>Hub</span></h1>
                <div style={mStyles.techBadge}>MAINTENANCE MODE / నిర్వహణ మోడ్</div>
                
                {/* 2. SIMPLE MESSAGE */}
                <p style={mStyles.subtitle}>
                    <strong>Our server is currently in maintenance mode.</strong><br/>
                    <span style={{color: '#8c98a9', fontSize: '15px'}}>మా సర్వర్ ప్రస్తుతం నిర్వహణ మోడ్‌లో ఉంది.</span>
                </p>

                {/* 3. TIME PANELS (Side by Side) */}
                <div style={mStyles.timePanelContainer}>
                    <div style={mStyles.liveTimeBox}>
                        <div style={mStyles.timeLabel}>            MAINTENANCE / నిర్వహణ సమయం</div>
                        <div className="clock-text" style={mStyles.liveTimeValue}>
                            {liveTimeString}
                        </div>
                    </div>

                    <div style={mStyles.restorePanel}>
                        <div style={mStyles.timeLabel}>TARGET RESTORE TIME / లక్ష్యం</div>
                        <div style={mStyles.restoreTime}>{targetRestoreTime}</div>
                    </div>
                </div>

                {/* 4. PROGRESS BAR */}
                <div style={mStyles.progressContainer}>
                    <div style={mStyles.progressLabel}>
                        <span>Server Upgrading (సర్వర్ అప్‌గ్రేడ్)</span>
                        <span style={{color: '#ffe500'}}>In Progress...</span>
                    </div>
                    <div style={mStyles.progressBarBg}>
                        <div style={mStyles.progressBarFill}></div>
                    </div>
                </div>

                {/* 5. FOOTER */}
                <p style={mStyles.footerText}>
                    Thank you for your patience. <span style={{fontSize: '13px'}}>(మీ ఓపికకు ధన్యవాదాలు)</span><br/><br/>
                    <strong>- Venkata Pavan Kumar</strong>
                </p>
            </div>
        </div>
    );
};

function App() {
    const [googleClientId, setGoogleClientId] = useState(null);
    const [loadingText, setLoadingText] = useState("Initializing Secure System...");

    useEffect(() => {
        let isMounted = true;

        if (isMaintenanceMode) return; 

        const timeoutId = setTimeout(() => {
            if (isMounted) setLoadingText("Waking up secure server. This can take up to a minute...");
        }, 5000);

        const fetchGoogleId = async () => {
            try {
                if (!isMounted || isMaintenanceMode) return;
                const res = await axios.get('https://bhavyams-vendorhub-backend.onrender.com/api/auth/google-client-id');
                if (isMounted) setGoogleClientId(res.data.clientId);
            } catch (err) {
                console.error("Google ID fetch failed. Retrying...", err);
                if (isMounted && !isMaintenanceMode) {
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

    if (isMaintenanceMode) {
        return <MaintenanceScreen />;
    }

    if (!googleClientId) {
        return (
            <div style={lStyles.loadingScreen}>
                <style>{`
                    @keyframes loadingAnim { 0% { transform: translateX(-100%); } 100% { transform: translateX(200%); } }
                `}</style>
                <div style={lStyles.loadingContent}>
                    <div style={lStyles.brandName}>Bhavyams <span style={lStyles.hubText}>Hub</span></div>
                    <div style={lStyles.loaderBar}>
                        <div style={lStyles.loaderProgress}></div>
                    </div>
                    <div style={lStyles.loadingText}>{loadingText}</div>
                </div>
            </div>
        );
    }

    return (
        <GoogleOAuthProvider clientId={googleClientId}>
            <CartProvider>
                <Router>
                    <ScrollToTop />
                    <ToastContainer 
                        theme="colored" 
                        position="top-center"
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

// ==========================================
// 🎨 STYLES
// ==========================================

const lStyles = {
    loadingScreen: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#fff', fontFamily: "'Segoe UI', Roboto, sans-serif" },
    loadingContent: { textAlign: 'center', minWidth: '300px' },
    brandName: { fontSize: '32px', fontWeight: '900', color: '#2874f0', letterSpacing: '-1px' },
    hubText: { color: '#ffe500', fontSize: '18px', fontWeight: 'bold' },
    loadingText: { marginTop: '20px', color: '#666', fontSize: '15px', fontWeight: '500', maxWidth: '300px', margin: '20px auto 0' },
    loaderBar: { width: '250px', height: '5px', background: '#e0e0e0', borderRadius: '10px', margin: '25px auto 0', overflow: 'hidden' },
    loaderProgress: { width: '50%', height: '100%', background: '#2874f0', borderRadius: '10px', animation: 'loadingAnim 1.5s infinite ease-in-out' }
};

const mStyles = {
    container: {
        minHeight: '100vh',
        width: '100%',
        backgroundColor: '#0a0f1e', 
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        boxSizing: 'border-box',
        fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
    },
    card: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        backgroundColor: '#151b2e',
        borderRadius: '16px',
        padding: '40px',
        maxWidth: '550px',
        width: '100%',
        boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.5)',
        border: '1px solid #2a344a',
        animation: 'slideIn 0.4s ease-out'
    },
    brandTitle: {
        margin: '0 0 15px 0',
        fontSize: '38px',
        color: '#ffffff',
        fontWeight: '900',
        letterSpacing: '-1px'
    },
    techBadge: {
        display: 'inline-block',
        backgroundColor: 'rgba(255, 68, 68, 0.15)',
        color: '#ff4444',
        padding: '6px 14px',
        borderRadius: '50px',
        fontSize: '12px',
        fontWeight: '700',
        letterSpacing: '1px',
        border: '1px solid rgba(255, 68, 68, 0.3)',
        marginBottom: '25px'
    },
    subtitle: {
        color: '#a3b1c6',
        fontSize: '16px',
        lineHeight: '1.6',
        margin: '0 0 30px 0'
    },
    timePanelContainer: {
        display: 'flex',
        flexDirection: window.innerWidth < 500 ? 'column' : 'row',
        width: '100%',
        gap: '15px',
        marginBottom: '30px'
    },
    liveTimeBox: {
        flex: 1,
        backgroundColor: '#0d1222',
        border: '1px solid #2a344a',
        borderRadius: '10px',
        padding: '15px',
        borderTop: '4px solid #4dabf7' 
    },
    restorePanel: {
        flex: 1,
        backgroundColor: '#0d1222',
        border: '1px solid #2a344a',
        borderRadius: '10px',
        padding: '15px',
        borderTop: '4px solid #22c55e' 
    },
    timeLabel: {
        color: '#8c98a9',
        fontSize: '11px',
        fontWeight: '700',
        letterSpacing: '1px',
        marginBottom: '8px'
    },
    liveTimeValue: {
        color: '#4dabf7', 
        fontSize: '20px',
        fontWeight: '900',
        letterSpacing: '1px'
    },
    restoreTime: {
        color: '#22c55e', 
        fontSize: '20px',
        fontWeight: '900',
        letterSpacing: '0.5px'
    },
    progressContainer: {
        width: '100%',
        marginBottom: '30px'
    },
    progressLabel: {
        display: 'flex',
        justifyContent: 'space-between',
        color: '#cbd5e1',
        fontSize: '13px',
        fontWeight: '700',
        marginBottom: '10px'
    },
    progressBarBg: {
        width: '100%',
        height: '6px',
        backgroundColor: '#2a344a',
        borderRadius: '10px',
        overflow: 'hidden'
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: '#ffe500', 
        animation: 'dataFlow 2s infinite linear',
        boxShadow: '0 0 10px #ffe500'
    },
    footerText: {
        color: '#7f8ea3',
        fontSize: '14px',
        lineHeight: '1.6',
        margin: '0'
    }
};

export default App;