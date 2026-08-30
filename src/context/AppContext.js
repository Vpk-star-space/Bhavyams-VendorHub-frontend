import React, { createContext, useState, useEffect } from 'react';
import { io } from 'socket.io-client';

const RAW_BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000/api';
const SOCKET_URL = RAW_BACKEND_URL.replace('/api', '');

// 🟢 Global Socket Definition - Safe from React renders!
export const socket = io(SOCKET_URL, {
    transports: ['polling', 'websocket'], 
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000
});

export const AppContext = createContext();

const translations = {
    "Trending": "ట్రెండింగ్",
    "Products": "ఉత్పత్తులు",
    "Services": "సేవలు",
    "Promotions": "ప్రమోషన్లు",
    "Business": "వ్యాపారం",
    "Search for products or shops...": "ఉత్పత్తులు లేదా దుకాణాల కోసం వెతకండి...",
    "Subhams Hub": "సుభమ్స్ హబ్",
    "The Ultimate Local Marketplace.": "అంతిమ స్థానిక మార్కెట్‌ప్లేస్.",
    "OUR ECOSYSTEM": "మా ఎకోసిస్టమ్",
    "Track finances securely.": "మీ ఆర్థిక లావాదేవీలను సురక్షితంగా ట్రాక్ చేయండి.",
    "Cloud Printing Network.": "క్లౌడ్ ప్రింటింగ్ నెట్‌వర్క్.",
    "Active Local Shops": "సక్రియ స్థానిక దుకాణాలు",
    "No local shops are active in your specific area right now.": "ప్రస్తుతం మీ ప్రాంతంలో స్థానిక దుకాణాలు ఏవీ సక్రియంగా లేవు.",
    "Nearby": "దగ్గరలో",
    "km away": "కి.మీ దూరంలో",
    "Register Your Business": "మీ వ్యాపారాన్ని నమోదు చేయండి",
    "Join Subhams Hub to get discovered by local customers instantly.": "స్థానిక కస్టమర్ల ద్వారా తక్షణమే కనుగొనబడటానికి సుభమ్స్ హబ్‌లో చేరండి.",
    "Your Name": "మీ పేరు",
    "Phone Number (WhatsApp)": "ఫోన్ నంబర్ (వాట్సాప్)",
    "Business Name": "వ్యాపారం పేరు",
    "Products or Services": "ఉత్పత్తులు లేదా సేవలు",
    "Exact Location / Pincode": "ఖచ్చితమైన స్థానం / పిన్‌కోడ్",
    "Email (Optional)": "ఇమెయిల్ (ఐచ్ఛికం)",
    "Submit Shop for Approval 🚀": "ఆమోదం కోసం దుకాణాన్ని సమర్పించండి 🚀",
    "Search Results for": "దీని కోసం శోధన ఫలితాలు",
    "Local Products Near You": "మీకు సమీపంలో ఉన్న స్థానిక ఉత్పత్తులు",
    "Local Services Near You": "మీకు సమీపంలో ఉన్న స్థానిక సేవలు",
    "No items found!": "ఏ వస్తువులు కనుగొనబడలేదు!",
    "Try expanding your search or selecting a different category.": "మీ శోధనను విస్తరించడానికి లేదా వేరొక వర్గాన్ని ఎంచుకోవడానికి ప్రయత్నించండి.",
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
    const [language, setLanguage] = useState(localStorage.getItem('hub_lang') || 'en');
    const [location, setLocation] = useState({ lat: null, lng: null, error: null });

    const t = (englishString) => {
        if (language === 'en') return englishString;
        return translations[englishString] || englishString; 
    };

    useEffect(() => {
        localStorage.setItem('hub_lang', language);
    }, [language]);

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

    // 🟢 CRITICAL FIX: Removed the duplicate Socket code here that was crashing the app!

    return (
        <AppContext.Provider value={{ language, setLanguage, t, location, socket }}>
            {children}
        </AppContext.Provider>
    );
};