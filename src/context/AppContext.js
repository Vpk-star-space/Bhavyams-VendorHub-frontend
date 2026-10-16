import React, { createContext, useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { SOCKET_URL } from '../config/api';

// 🟢 Global Socket Definition - Uses Single Source of Truth from config/api.js
export const socket = io(SOCKET_URL, {
    transports: ['websocket', 'polling'], 
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000
});

export const AppContext = createContext();

const translations = {
    "Trending": "ట్రెండింగ్",
    "Products": "ఉత్పత్తులు",
    "Shopping": "షాపింగ్",
    "Services": "సేవలు",
    "Expo": "ఎక్స్‌పో",
    "Promotions": "ప్రమోషన్లు",
    "Business": "వ్యాపారం",
    "Service": "సేవ",
    "By": "విక్రేత",
    "Search for products or shops...": "ఉత్పత్తులు లేదా దుకాణాల కోసం వెతకండి...",
    "Subhams Hub": "సుభమ్స్ హబ్",
    "The Ultimate Local Marketplace.": "అంతిమ స్థానిక మార్కెట్‌ప్లేస్.",
    "OUR ECOSYSTEM": "మా ఎకోసిస్టమ్",
    "Track finances securely.": "మీ ఆర్థిక లావాదేవీలను సురక్షితంగా ట్రాక్ చేయండి.",
    "Cloud Printing Network.": "క్లౌడ్ ప్రింటింగ్ నెట్‌వర్క్.",
    "Active Local Shops": "సక్రియ స్థానిక దుకాణాలు",
    "No local shops are active in your specific area right now.": "ప్రస్తుతం మీ ప్రాంతంలో స్థానిక దుకాణాలు ఏవీ సక్రియంగా లేవు.",
    "Nearby": "దగ్గరలో",
    "km away": "కి.మీ దూరంలో"
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
        localStorage.setItem('appLanguage', language);
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
                () => {
                    setLocation(prev => ({ ...prev, error: "Please enable location for local shops." }));
                }
            );
        }
    }, []);

    return (
        <AppContext.Provider value={{ language, setLanguage, t, location, socket }}>
            {children}
        </AppContext.Provider>
    );
};