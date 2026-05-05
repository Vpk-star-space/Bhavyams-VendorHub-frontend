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
const targetRestoreTime = "Today at 10:00 AM"; 


// 🚀 Helper: Always start at the top of the page on route change
function ScrollToTop() {
    const { pathname } = useLocation();
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [pathname]);
    return null;
}

// 🛡️ High-Tech Maintenance Component with LIVE TICKING CLOCK (Bilingual)
const MaintenanceScreen = () => {
    // State to hold the live running time
    const [currentTime, setCurrentTime] = useState(new Date());

    // Effect to update the clock every single second
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    // Format the live time to look like "10:45:30 AM"
    const liveTimeString = currentTime.toLocaleTimeString('en-US', { 
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true 
    });

    return (
        <div style={mStyles.container}>
            <style>{`
                @keyframes pulseGlow {
                    0% { box-shadow: 0 0 15px rgba(40, 116, 240, 0.2); border-color: #2874f0; }
                    50% { box-shadow: 0 0 35px rgba(40, 116, 240, 0.6); border-color: #4dabf7; }
                    100% { box-shadow: 0 0 15px rgba(40, 116, 240, 0.2); border-color: #2874f0; }
                }
                @keyframes dataFlow {
                    0% { width: 0%; }
                    100% { width: 100%; }
                }
                @keyframes slideIn {
                    0% { transform: translateY(20px); opacity: 0; }
                    100% { transform: translateY(0); opacity: 1; }
                }
                .clock-text {
                    font-variant-numeric: tabular-nums; /* Keeps numbers from shifting */
                }
            `}</style>

            <div style={mStyles.card}>
                {/* LEFT SIDE: Animated Server Maintenance GIF */}
                <div style={mStyles.imageSection}>
                    <div style={mStyles.imageWrapper}>
                        <img 
                            // Highly reliable animated GIF of server gears
                            src="https://i.pinimg.com/originals/a0/a1/b6/a0a1b65d5690dfab06e78864703a1158.gif" 
                            alt="Server Maintenance Animation" 
                            style={mStyles.image}
                            onError={(e) => { 
                                // Fallback image just in case the internet blocks GIFs
                                e.target.src = "https://cdn-icons-png.flaticon.com/512/5113/5113264.png" 
                            }}
                        />
                    </div>
                </div>

                {/* RIGHT SIDE: High-Tech Status Panel (BILINGUAL & LIVE CLOCK) */}
                <div style={mStyles.textSection}>
                    <div style={mStyles.headerGroup}>
                        <div style={mStyles.techBadge}>MAINTENANCE MODE / నిర్వహణ మోడ్</div>
                        <h1 style={mStyles.brandTitle}>Bhavyams <span style={{color: '#ffe500'}}>Hub</span></h1>
                    </div>
                    
                    <p style={mStyles.subtitle}>
                        <strong>Our server is currently in maintenance mode.</strong><br/>
                        <span style={{color: '#8c98a9', fontSize: '15px'}}>
                            మా సర్వర్ ప్రస్తుతం నిర్వహణ (మెయింటెనెన్స్) మోడ్‌లో ఉంది.
                        </span>
                        <br/><br/>
                        We are upgrading our systems to serve you better.<br/>
                        <span style={{color: '#8c98a9', fontSize: '15px'}}>
                            మీకు మెరుగైన సేవలు అందించడానికి మేము మా సిస్టమ్‌లను అప్‌గ్రేడ్ చేస్తున్నాము.
                        </span>
                    </p>

                    {/* LIVE TICKING CLOCK & TARGET TIME PANEL */}
                    <div style={mStyles.timePanelContainer}>
                        {/* Current Live Time Box */}
                        <div style={mStyles.liveTimeBox}>
                            <div style={mStyles.timeLabel}>PRESENT TIME / ప్రస్తుత సమయం:</div>
                            <div className="clock-text" style={mStyles.liveTimeValue}>
                                {liveTimeString}
                            </div>
                        </div>

                        {/* Target Restore Time Box */}
                        <div style={mStyles.restorePanel}>
                            <div style={mStyles.timeLabel}>TARGET RESTORE TIME / పునరుద్ధరణ లక్ష్యం:</div>
                            <div style={mStyles.restoreTime}>{targetRestoreTime}</div>
                        </div>
                    </div>

                    <div style={mStyles.progressContainer}>
                        <div style={mStyles.progressLabel}>
                            <span>Server Upgrading (సర్వర్ అప్‌గ్రేడ్)</span>
                            <span style={{color: '#ffe500'}}>In Progress... (జరుగుతోంది...)</span>
                        </div>
                        <div style={mStyles.progressBarBg}>
                            <div style={mStyles.progressBarFill}></div>
                        </div>
                    </div>

                    <p style={mStyles.footerText}>
                        Thank you for your patience. <span style={{fontSize: '13px'}}>(మీ ఓపికకు ధన్యవాదాలు)</span><br/>
                        <strong>- Venkata Pavan Kumar</strong>
                    </p>
                </div>
            </div>
        </div>
    );
};

function App() {
    const [googleClientId, setGoogleClientId] = useState(null);
    const [loadingText, setLoadingText] = useState("Initializing Secure System...");

    useEffect(() => {
        let isMounted = true;

        // If maintenance is ON, instantly stop trying to connect to the backend
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

    // 🛑 1. SHOW MAINTENANCE SCREEN IF MASTER SWITCH IS TRUE
    if (isMaintenanceMode) {
        return <MaintenanceScreen />;
    }

    // ⏳ 2. INITIAL LOADING SCREEN (Waking up Render Database)
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

    // ✅ 3. MAIN APPLICATION RUNS NORMALLY
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
        flexDirection: window.innerWidth < 768 ? 'column' : 'row',
        backgroundColor: '#151b2e',
        borderRadius: '24px',
        overflow: 'hidden',
        maxWidth: '1050px',
        width: '100%',
        boxShadow: '0 30px 60px -15px rgba(0, 0, 0, 0.6)',
        border: '1px solid #2a344a',
        animation: 'slideIn 0.5s ease-out'
    },
    imageSection: {
        flex: 1, 
        padding: '30px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0d1222' 
    },
    imageWrapper: {
        width: '100%',
        height: '100%',
        minHeight: '300px',
        maxHeight: '400px',
        borderRadius: '20px',
        overflow: 'hidden',
        border: '3px solid #2874f0',
        animation: 'pulseGlow 4s infinite',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#ffffff'
    },
    image: {
        width: '100%',
        height: '100%',
        objectFit: 'contain',
        padding: '20px'
    },
    textSection: {
        flex: 1.2,
        padding: '50px 45px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center'
    },
    headerGroup: {
        marginBottom: '20px'
    },
    techBadge: {
        display: 'inline-block',
        backgroundColor: 'rgba(255, 68, 68, 0.15)',
        color: '#ff4444',
        padding: '7px 15px',
        borderRadius: '50px',
        fontSize: '13px',
        fontWeight: '700',
        letterSpacing: '1px',
        border: '1px solid rgba(255, 68, 68, 0.3)',
        marginBottom: '15px'
    },
    brandTitle: {
        margin: '0',
        fontSize: '42px',
        color: '#ffffff',
        fontWeight: '900',
        letterSpacing: '-1px',
        lineHeight: '1.1'
    },
    subtitle: {
        color: '#a3b1c6',
        fontSize: '16px',
        lineHeight: '1.6',
        margin: '0 0 25px 0'
    },
    timePanelContainer: {
        display: 'flex',
        flexDirection: 'column',
        gap: '15px',
        marginBottom: '35px'
    },
    liveTimeBox: {
        backgroundColor: '#0d1222',
        border: '1px solid #2a344a',
        borderRadius: '12px',
        padding: '18px 25px',
        borderLeft: '5px solid #4dabf7' // Blue accent for current time
    },
    restorePanel: {
        backgroundColor: '#0d1222',
        border: '1px solid #2a344a',
        borderRadius: '12px',
        padding: '18px 25px',
        borderLeft: '5px solid #22c55e' // Green accent for target time
    },
    timeLabel: {
        color: '#8c98a9',
        fontSize: '12px',
        fontWeight: '700',
        letterSpacing: '1px',
        marginBottom: '5px'
    },
    liveTimeValue: {
        color: '#4dabf7', // High-tech blue
        fontSize: '24px',
        fontWeight: '900',
        letterSpacing: '2px'
    },
    restoreTime: {
        color: '#22c55e', // Neon green
        fontSize: '22px',
        fontWeight: '900',
        letterSpacing: '0.5px'
    },
    progressContainer: {
        marginBottom: '35px'
    },
    progressLabel: {
        display: 'flex',
        justifyContent: 'space-between',
        color: '#cbd5e1',
        fontSize: '15px',
        fontWeight: '700',
        marginBottom: '12px'
    },
    progressBarBg: {
        height: '8px',
        backgroundColor: '#2a344a',
        borderRadius: '10px',
        overflow: 'hidden'
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: '#ffe500', // Yellow caution color for maintenance
        animation: 'dataFlow 2.5s infinite linear',
        boxShadow: '0 0 12px #ffe500'
    },
    footerText: {
        color: '#7f8ea3',
        fontSize: '15px',
        lineHeight: '1.5',
        margin: '0'
    }
};

export default App;