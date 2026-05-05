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
// 🛠️ MAINTENANCE MODE SETTINGS (MASTER SWITCH)
// 🛠️ ==========================================
const isMaintenanceMode = true; // 🟢 Change to 'false' to open the app normally!
const maintenanceEndTime = "10:00 PM IST"; // 🟢 Set a time (e.g., "10:00 PM"), or set to null for "shortly"

// 🚀 Helper: Always start at the top of the page on route change
function ScrollToTop() {
    const { pathname } = useLocation();
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [pathname]);
    return null;
}

// 🛡️ High-Tech Maintenance Component
const MaintenanceScreen = () => {
    return (
        <div style={mStyles.container}>
            {/* Inline CSS for High-Tech Animations */}
            <style>{`
                @keyframes pulseGlow {
                    0% { box-shadow: 0 0 15px rgba(40, 116, 240, 0.2); }
                    50% { box-shadow: 0 0 30px rgba(40, 116, 240, 0.6); }
                    100% { box-shadow: 0 0 15px rgba(40, 116, 240, 0.2); }
                }
                @keyframes scanLine {
                    0% { top: 0%; opacity: 0; }
                    10% { opacity: 1; }
                    90% { opacity: 1; }
                    100% { top: 100%; opacity: 0; }
                }
                @keyframes dataFlow {
                    0% { width: 0%; }
                    100% { width: 100%; }
                }
            `}</style>

            <div style={mStyles.card}>
                {/* LEFT SIDE: Happy Family Shopping Image with High-Tech Scanner */}
                <div style={mStyles.imageSection}>
                    <div style={mStyles.imageWrapper}>
                        {/* Beautiful Unsplash Image of a Family Shopping Online */}
                        <img 
                            src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=800&q=80" 
                            alt="Happy Family Shopping" 
                            style={mStyles.image}
                        />
                        {/* High Tech Scanning Line Overlay */}
                        <div style={mStyles.scanner}></div>
                    </div>
                </div>

                {/* RIGHT SIDE: High-Tech Data Panel */}
                <div style={mStyles.textSection}>
                    <div style={mStyles.badge}>SYSTEM UPGRADE IN PROGRESS</div>
                    <h1 style={mStyles.title}>Bhavyams <span style={{color: '#ffe500'}}>Hub</span></h1>
                    
                    <p style={mStyles.subtitle}>
                        We are currently upgrading our secure servers to bring your family an even faster, safer, and happier shopping experience.
                    </p>

                    {/* Dynamic Time Logic */}
                    <div style={mStyles.timeBox}>
                        <div style={mStyles.timeLabel}>ESTIMATED SYSTEM RESTORE:</div>
                        <div style={mStyles.timeValue}>
                            {maintenanceEndTime ? `TODAY BY ${maintenanceEndTime}` : "VERY SHORTLY"}
                        </div>
                    </div>

                    {/* High Tech Animated Progress Bar */}
                    <div style={mStyles.progressContainer}>
                        <div style={mStyles.progressLabel}>
                            <span>Server Optimization</span>
                            <span style={{color: '#2874f0'}}>Working...</span>
                        </div>
                        <div style={mStyles.progressBarBg}>
                            <div style={mStyles.progressBarFill}></div>
                        </div>
                    </div>

                    <p style={mStyles.footerText}>
                        Thank you for your patience. Great things are coming! <br/>
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

        // If maintenance mode is ON, don't even bother waking up the backend.
        if (isMaintenanceMode) return; 

        // 🚀 UX FIX: Tell the user if the Render server is taking a long time to wake up
        const timeoutId = setTimeout(() => {
            if (isMounted) setLoadingText("Waking up secure server. This can take up to a minute...");
        }, 5000);

        const fetchGoogleId = async () => {
            try {
                const res = await axios.get('https://bhavyams-vendorhub-backend.onrender.com/api/auth/google-client-id');
                if (isMounted) {
                    setGoogleClientId(res.data.clientId);
                }
            } catch (err) {
                console.error("Google ID fetch failed. Retrying...", err);
                if (isMounted) {
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
    if (isMaintenanceMode) {
        return <MaintenanceScreen />;
    }

    // ⏳ 2. INITIAL LOADING SCREEN (Waking up Render Database)
    if (!googleClientId) {
        return (
            <div style={styles.loadingScreen}>
                <style>{`
                    @keyframes loadingAnim { 0% { transform: translateX(-100%); } 100% { transform: translateX(200%); } }
                `}</style>
                <div style={styles.loadingContent}>
                    <div style={styles.brandName}>Bhavyams VendorHub</div>
                    <div style={styles.loaderBar}>
                        <div style={styles.loaderProgress}></div>
                    </div>
                    <div style={styles.loadingText}>{loadingText}</div>
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

// Styles for the standard App Loader
const styles = {
    loadingScreen: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#fff', fontFamily: "'Roboto', sans-serif" },
    loadingContent: { textAlign: 'center' },
    brandName: { fontSize: '28px', fontWeight: '900', color: '#2874f0', letterSpacing: '-0.5px' },
    loadingText: { marginTop: '15px', color: '#666', fontSize: '14px', fontWeight: '500', maxWidth: '250px', margin: '15px auto 0' },
    loaderBar: { width: '200px', height: '4px', background: '#e0e0e0', borderRadius: '10px', margin: '20px auto 0', overflow: 'hidden' },
    loaderProgress: { width: '50%', height: '100%', background: '#2874f0', borderRadius: '10px', animation: 'loadingAnim 1.5s infinite ease-in-out' }
};

// Styles for the High-Tech Maintenance Screen
const mStyles = {
    container: {
        minHeight: '100vh',
        width: '100%',
        backgroundColor: '#0f172a', // Deep high-tech blue
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
        backgroundColor: '#1e293b',
        borderRadius: '20px',
        overflow: 'hidden',
        maxWidth: '1000px',
        width: '100%',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        border: '1px solid #334155'
    },
    imageSection: {
        flex: 1,
        padding: '30px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0f172a'
    },
    imageWrapper: {
        position: 'relative',
        width: '100%',
        height: '100%',
        minHeight: '300px',
        borderRadius: '16px',
        overflow: 'hidden',
        animation: 'pulseGlow 3s infinite',
        border: '2px solid #2874f0'
    },
    image: {
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        opacity: 0.85
    },
    scanner: {
        position: 'absolute',
        left: 0,
        right: 0,
        height: '4px',
        backgroundColor: '#ffe500',
        boxShadow: '0 0 10px #ffe500, 0 0 20px #ffe500',
        animation: 'scanLine 3s infinite linear'
    },
    textSection: {
        flex: 1,
        padding: '50px 40px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center'
    },
    badge: {
        backgroundColor: 'rgba(40, 116, 240, 0.1)',
        color: '#3b82f6',
        padding: '6px 12px',
        borderRadius: '50px',
        fontSize: '12px',
        fontWeight: 'bold',
        letterSpacing: '1px',
        alignSelf: 'flex-start',
        border: '1px solid rgba(40, 116, 240, 0.3)',
        marginBottom: '20px'
    },
    title: {
        margin: '0 0 15px 0',
        fontSize: '36px',
        color: '#ffffff',
        fontWeight: '900',
        letterSpacing: '-1px'
    },
    subtitle: {
        color: '#94a3b8',
        fontSize: '16px',
        lineHeight: '1.6',
        margin: '0 0 30px 0'
    },
    timeBox: {
        backgroundColor: '#0f172a',
        border: '1px solid #334155',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '30px',
        borderLeft: '4px solid #ffe500'
    },
    timeLabel: {
        color: '#64748b',
        fontSize: '12px',
        fontWeight: 'bold',
        letterSpacing: '1px',
        marginBottom: '5px'
    },
    timeValue: {
        color: '#10b981', // Neon Green success color
        fontSize: '22px',
        fontWeight: '900',
        letterSpacing: '0.5px'
    },
    progressContainer: {
        marginBottom: '30px'
    },
    progressLabel: {
        display: 'flex',
        justifyContent: 'space-between',
        color: '#cbd5e1',
        fontSize: '14px',
        fontWeight: 'bold',
        marginBottom: '10px'
    },
    progressBarBg: {
        height: '6px',
        backgroundColor: '#334155',
        borderRadius: '10px',
        overflow: 'hidden'
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: '#2874f0',
        animation: 'dataFlow 2s infinite ease-in-out',
        boxShadow: '0 0 10px #2874f0'
    },
    footerText: {
        color: '#64748b',
        fontSize: '14px',
        lineHeight: '1.5',
        margin: 0
    }
};

export default App;