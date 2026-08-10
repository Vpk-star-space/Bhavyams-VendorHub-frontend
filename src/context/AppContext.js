import React, { createContext, useState, useEffect } from 'react';
import { io } from 'socket.io-client';

// 🟢 FIX: Strip '/api' from the URL so Socket.io connects to the root server perfectly!
const RAW_BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000/api';
const SOCKET_URL = RAW_BACKEND_URL.replace('/api', '');

export const socket = io(SOCKET_URL, {
    transports: ['polling', 'websocket'], // Polling first prevents immediate disconnects
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000
});

export const AppContext = createContext();
// ... rest of your AppContext code remains the same

// 🌐 THE MASTER DICTIONARY (Update all Telugu words here in ONE place)
const translations = {
    // Categories & Navigation
    "Trending": "ట్రెండింగ్",
    "Products": "ఉత్పత్తులు",
    "Services": "సేవలు",
    "Promotions": "ప్రమోషన్లు",
    "Business": "వ్యాపారం",
    "Search for products or shops...": "ఉత్పత్తులు లేదా దుకాణాల కోసం వెతకండి...",
    
    // Banners & Headings
    "Subhams Hub": "సుభమ్స్ హబ్",
    "The Ultimate Local Marketplace.": "అంతిమ స్థానిక మార్కెట్‌ప్లేస్.",
    "OUR ECOSYSTEM": "మా ఎకోసిస్టమ్",
    "Track finances securely.": "మీ ఆర్థిక లావాదేవీలను సురక్షితంగా ట్రాక్ చేయండి.",
    "Cloud Printing Network.": "క్లౌడ్ ప్రింటింగ్ నెట్‌వర్క్.",
    
    // Vendor Section
    "Active Local Shops": "సక్రియ స్థానిక దుకాణాలు",
    "No local shops are active in your specific area right now.": "ప్రస్తుతం మీ ప్రాంతంలో స్థానిక దుకాణాలు ఏవీ సక్రియంగా లేవు.",
    "Nearby": "దగ్గరలో",
    "km away": "కి.మీ దూరంలో",

    // Business Registration
    "Register Your Business": "మీ వ్యాపారాన్ని నమోదు చేయండి",
    "Join Subhams Hub to get discovered by local customers instantly.": "స్థానిక కస్టమర్ల ద్వారా తక్షణమే కనుగొనబడటానికి సుభమ్స్ హబ్‌లో చేరండి.",
    "Your Name": "మీ పేరు",
    "Phone Number (WhatsApp)": "ఫోన్ నంబర్ (వాట్సాప్)",
    "Business Name": "వ్యాపారం పేరు",
    "Products or Services": "ఉత్పత్తులు లేదా సేవలు",
    "Exact Location / Pincode": "ఖచ్చితమైన స్థానం / పిన్‌కోడ్",
    "Email (Optional)": "ఇమెయిల్ (ఐచ్ఛికం)",
    "Submit Shop for Approval 🚀": "ఆమోదం కోసం దుకాణాన్ని సమర్పించండి 🚀",

    // Search Results
    "Search Results for": "దీని కోసం శోధన ఫలితాలు",
    "Local Products Near You": "మీకు సమీపంలో ఉన్న స్థానిక ఉత్పత్తులు",
    "Local Services Near You": "మీకు సమీపంలో ఉన్న స్థానిక సేవలు",
    "No items found!": "ఏ వస్తువులు కనుగొనబడలేదు!",
    "Try expanding your search or selecting a different category.": "మీ శోధనను విస్తరించడానికి లేదా వేరొక వర్గాన్ని ఎంచుకోవడానికి ప్రయత్నించండి.",

    // Settings & GPS
    "App Settings": "యాప్ సెట్టింగ్‌లు",
    "App Language": "యాప్ భాష",
   
    "Change Location (Area/City)": "స్థానాన్ని మార్చండి (ప్రాంతం/నగరం)",
    "Phone & Full Address": "ఫోన్ & పూర్తి చిరునామా",
    "Save Settings": "సెట్టింగ్‌లను సేవ్ చేయండి",
    "Location Error - Update Settings": "స్థాన లోపం - సెట్టింగ్‌లను నవీకరించండి",
    "Showing Local Area": "స్థానిక ప్రాంతాన్ని చూపుతోంది",
    "Searching in:": "ఇందులో వెతుకుతోంది:"
};

export const AppProvider = ({ children }) => {
    // 1. GLOBAL LANGUAGE STATE (Defaults to Telugu if you prefer, or English)
    const [language, setLanguage] = useState(localStorage.getItem('hub_lang') || 'en');
    
    // 2. GLOBAL LOCATION STATE
    const [location, setLocation] = useState({ lat: null, lng: null, error: null });

    // 3. GLOBAL SOCKET STATE
    const [socket, setSocket] = useState(null);

    // --- 🟢 THE SMART TRANSLATION ENGINE ---
    // If the language is English, it returns the exact word.
    // If Telugu, it checks the dictionary. If the word isn't in the dictionary yet, it safely falls back to English!
    const t = (englishString) => {
        if (language === 'en') return englishString;
        return translations[englishString] || englishString; 
    };

    // --- EFFECT: Handle Language Changes ---
    useEffect(() => {
        localStorage.setItem('hub_lang', language);
    }, [language]);

    // --- EFFECT: Fetch GPS Location ---
    useEffect(() => {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setLocation({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                        error: null
                    });
                },
                (error) => {
                    setLocation(prev => ({ ...prev, error: "Please enable location for local shops." }));
                }
            );
        } else {
            setLocation(prev => ({ ...prev, error: "Geolocation not supported by this browser." }));
        }
    }, []);

    // --- EFFECT: Connect WebRTC Socket ---
    useEffect(() => {
        const SOCKET_URL = process.env.REACT_APP_BACKEND_URL ? process.env.REACT_APP_BACKEND_URL.replace('/api', '') : 'http://localhost:5000';
        const newSocket = io(SOCKET_URL, { transports: ['websocket', 'polling'] });
        setSocket(newSocket);
        return () => newSocket.disconnect();
    }, []);

    return (
        <AppContext.Provider value={{ language, setLanguage, t, location, socket }}>
            {children}
        </AppContext.Provider>
    );
};