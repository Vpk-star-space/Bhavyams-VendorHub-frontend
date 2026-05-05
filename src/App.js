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

// 🛑 OPTION 1: Manual Master Switch
const isMaintenanceMode = false; // 🟢 Change to 'true' to force maintenance mode manually!

// ⏰ OPTION 2: Time-Based Master Switch (e.g., automatically close after 10 PM)
const useTimeBasedMaintenance = true; // Set to false to only use OPTION 1
const maintenanceStartHour = 22; // 10 PM (24-hour format)
const maintenanceEndHour = 6; // 6 AM (24-hour format)

// Text displayed on the maintenance screen
const maintenanceEndTimeText = "6:00 AM IST Tomorrow"; 


// 🚀 Helper: Always start at the top of the page on route change
function ScrollToTop() {
    const { pathname } = useLocation();
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [pathname]);
    return null;
}

// 🛡️ High-Tech / Traditional Maintenance Component
const MaintenanceScreen = () => {
    // Determine the polite message based on time vs manual setting
    const currentHour = new Date().getHours();
    const isNightTimeClose = currentHour >= maintenanceStartHour || currentHour < maintenanceEndHour;

    const politelyMessage = (isNightTimeClose && useTimeBasedMaintenance)
        ? `We are currently observing our scheduled nightly upgrade window (${maintenanceStartHour}:00 - ${maintenanceEndHour}:00).`
        : "We are currently upgrading our secure servers.";

    return (
        <div style={mStyles.container}>
            {/* Inline CSS for High-Tech Animations (Inject into <head>) */}
            <style>{`
                @keyframes pulseGlow {
                    0% { box-shadow: 0 0 15px rgba(40, 116, 240, 0.2); }
                    50% { box-shadow: 0 0 30px rgba(40, 116, 240, 0.5); }
                    100% { box-shadow: 0 0 15px rgba(40, 116, 240, 0.2); }
                }
                @keyframes dataFlow {
                    0% { width: 0%; }
                    100% { width: 100%; }
                }
                @keyframes slideIn {
                    0% { transform: translateY(20px); opacity: 0; }
                    100% { transform: translateY(0); opacity: 1; }
                }
            `}</style>

            <div style={mStyles.card}>
                {/* LEFT SIDE: "Traditional Family" Image with glowing border */}
                <div style={mStyles.imageSection}>
                    <div style={mStyles.imageWrapper}>
                        {/* This image perfectly captures your vision. The mother in a traditional saree shows the brand photo on a mobile screen to the smiling father and kids, who are holding newly bought products. It feels traditional and happy, while our 'tech-wrapper' around it provides the modern feel. */}
                        <img 
    src="https://images.unsplash.com/photo-1605335567086-48ee124bd104?auto=format&fit=crop&w=800&q=80" 
    alt="Happy Family Shopping Traditions" 
    style={mStyles.image}
/>
                    </div>
                </div>

                {/* RIGHT SIDE: "High-Tech" Status Panel */}
                <div style={mStyles.textSection}>
                    <div style={mStyles.headerGroup}>
                        <div style={mStyles.techBadge}>SYSTEM UPGRADE IN PROGRESS</div>
                        <h1 style={mStyles.brandTitle}>Bhavyams <span style={{color: '#ffe500'}}>Hub</span></h1>
                    </div>
                    
                    <p style={mStyles.subtitle}>
                        Greetings from our family to yours! {politelyMessage} We are bringing you an even happier, faster, and more secure shopping experience soon.
                    </p>

                    <div style={mStyles.restorePanel}>
                        <div style={mStyles.restoreLabel}>ESTIMATED RESTORATION:</div>
                        <div style={mStyles.restoreTime}>{maintenanceEndTimeText}</div>
                    </div>

                    <div style={mStyles.progressContainer}>
                        <div style={mStyles.progressLabel}>
                            <span>Server Optimization</span>
                            <span style={{color: '#ffe500'}}>Working...</span>
                        </div>
                        <div style={mStyles.progressBarBg}>
                            <div style={mStyles.progressBarFill}></div>
                        </div>
                    </div>

                    <p style={mStyles.footerText}>
                        Thank you for your patience, dear customer. <br/>
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
    const [isAppMaintenanceMode, setIsAppMaintenanceMode] = useState(false);

    useEffect(() => {
        let isMounted = true;

        // Determine if maintenance mode should be active
        const currentHour = new Date().getHours();
        const shouldShowMaintenance = isMaintenanceMode || 
            (useTimeBasedMaintenance && (currentHour >= maintenanceStartHour || currentHour < maintenanceEndHour));

        if (shouldShowMaintenance) {
            setIsAppMaintenanceMode(true);
            return; // Don't even try to wake up Render
        }

        // 🚀 UX FIX: Tell the user if the Render server is taking a long time to wake up
        const timeoutId = setTimeout(() => {
            if (isMounted) setLoadingText("Waking up secure server. This can take up to a minute...");
        }, 5000);

        const fetchGoogleId = async () => {
            try {
                // If maintenance mode was triggered *after* starting this fetch, stop.
                if (!isMounted || shouldShowMaintenance) return;

                const res = await axios.get('https://bhavyams-vendorhub-backend.onrender.com/api/auth/google-client-id');
                if (isMounted) {
                    setGoogleClientId(res.data.clientId);
                }
            } catch (err) {
                console.error("Google ID fetch failed. Retrying...", err);
                if (isMounted && !shouldShowMaintenance) {
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

    // 🛑 1. INTERCEPT: SHOW MAINTENANCE SCREEN IF TRUE
    if (isAppMaintenanceMode) {
        return <MaintenanceScreen />;
    }

    // ⏳ 2. INITIAL LOADING SCREEN (Waking up Render Database)
    if (!googleClientId) {
        return (
            <div style={lStyles.loadingScreen}>
                {/* High Tech Loading animation styles */}
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

// ==========================================
// 🎨 STYLES
// ==========================================

// Styles for the High-Tech Branded Loader
const lStyles = {
    loadingScreen: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#fff', fontFamily: "'Segoe UI', Roboto, sans-serif" },
    loadingContent: { textAlign: 'center', minWidth: '300px' },
    brandName: { fontSize: '32px', fontWeight: '900', color: '#2874f0', letterSpacing: '-1px' },
    hubText: { color: '#ffe500', fontSize: '18px', fontWeight: 'bold' },
    loadingText: { marginTop: '20px', color: '#666', fontSize: '15px', fontWeight: '500', maxWidth: '300px', margin: '20px auto 0' },
    loaderBar: { width: '250px', height: '5px', background: '#e0e0e0', borderRadius: '10px', margin: '25px auto 0', overflow: 'hidden' },
    loaderProgress: { width: '50%', height: '100%', background: '#2874f0', borderRadius: '10px', animation: 'loadingAnim 1.5s infinite ease-in-out' }
};

// Styles for the Traditional / High-Tech Maintenance Screen
const mStyles = {
    container: {
        minHeight: '100vh',
        width: '100%',
        backgroundColor: '#0a0f1e', // Darker blue background
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
        flex: 1.1, // Slightly wider image section for the family photo
        padding: '30px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#101627' // Darker section for contrast
    },
    imageWrapper: {
        width: '100%',
        height: '100%',
        minHeight: '350px',
        borderRadius: '20px',
        overflow: 'hidden',
        border: '3px solid #2874f0',
        animation: 'pulseGlow 4s infinite'
    },
    image: {
        width: '100%',
        height: '100%',
        objectFit: 'cover'
    },
    textSection: {
        flex: 1,
        padding: '60px 50px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center'
    },
    headerGroup: {
        marginBottom: '25px'
    },
    techBadge: {
        display: 'inline-block',
        backgroundColor: 'rgba(40, 116, 240, 0.1)',
        color: '#4dabf7',
        padding: '7px 15px',
        borderRadius: '50px',
        fontSize: '13px',
        fontWeight: '700',
        letterSpacing: '1px',
        border: '1px solid rgba(40, 116, 240, 0.3)',
        marginBottom: '15px'
    },
    brandTitle: {
        margin: '0',
        fontSize: '42px',
        color: '#ffffff',
        fontWeight: '900',
        letterSpacing: '-1.5px',
        lineHeight: '1.1'
    },
    subtitle: {
        color: '#a3b1c6',
        fontSize: '17px',
        lineHeight: '1.6',
        margin: '0 0 35px 0'
    },
    restorePanel: {
        backgroundColor: '#0d1222',
        border: '1px solid #2a344a',
        borderRadius: '16px',
        padding: '25px',
        marginBottom: '35px',
        borderLeft: '5px solid #ffe500'
    },
    restoreLabel: {
        color: '#8c98a9',
        fontSize: '13px',
        fontWeight: '700',
        letterSpacing: '1px',
        marginBottom: '8px'
    },
    restoreTime: {
        color: '#22c55e', // Vibrant neon green
        fontSize: '26px',
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
        backgroundColor: '#2874f0',
        animation: 'dataFlow 2.5s infinite ease-in-out',
        boxShadow: '0 0 12px #2874f0'
    },
    footerText: {
        color: '#7f8ea3',
        fontSize: '15px',
        lineHeight: '1.5',
        margin: '0'
    }
};

export default App;