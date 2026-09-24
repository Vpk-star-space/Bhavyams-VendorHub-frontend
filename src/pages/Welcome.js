import React, { useState, useContext } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { Search, MapPin, X, Loader } from 'lucide-react'; // 🟢 Added Icons

const getBackendUrl = () => {
    return process.env.NODE_ENV === 'production' 
        ? 'https://bhavyams-vendorhub-backend.onrender.com/api' 
        : 'http://localhost:5000/api';
};

const Welcome = () => {
    const navigate = useNavigate();
    const { language, setLanguage, location } = useContext(AppContext);

    const [step, setStep] = useState(1);
    const [phone, setPhone] = useState('');
    const [name, setName] = useState(''); 
    
    // 🟢 LOCATION STATES
    const [address, setAddress] = useState('');
    const [area, setArea] = useState('');
    const [pincode, setPincode] = useState('');
    
    const [isFetchingAddress, setIsFetchingAddress] = useState(false);
    
    // 🟢 MODAL STATES
    const [showLocModal, setShowLocModal] = useState(false);
    const [locSearch, setLocSearch] = useState('');
    const [locResults, setLocResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);

    const handleLanguageSelect = (lang) => {
        setLanguage(lang);
        setStep(2); 
    };

    const handleGoogleSuccess = async (credentialResponse) => {
        try {
            const BACKEND_URL = getBackendUrl();
            
            const res = await axios.post(`${BACKEND_URL}/auth/google-login`, {
                idToken: credentialResponse.credential,
                lat: location?.lat || 0,
                lng: location?.lng || 0,
                language: language,
                role: 'customer'
            });

            const { token, user } = res.data;
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

            // Check if phone is valid and not the default filler
            if (user.phone && user.phone.length === 10 && user.phone !== "0000000000") {
                navigate('/'); 
            } else {
                setName(user.username || '');
                setStep(3); 
            }
        } catch (error) {
            console.error("Google Auth Failed", error);
            alert("Login Failed. Please try again.");
        }
    };

    // 🟢 SMART LOCATION SEARCH
    const handleLocationSearch = async (query) => {
        setLocSearch(query);
        if (query.length < 3) return setLocResults([]);
        
        setIsSearching(true);
        try {
            const res = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&countrycodes=in&q=${query}`);
            setLocResults(res.data);
        } catch (e) {
            console.error("Location search failed", e);
        } finally {
            setIsSearching(false);
        }
    };

    // 🟢 WHEN USER SELECTS A LOCATION FROM MODAL
    const selectCustomLocation = (loc) => {
        const fullString = loc.display_name;
        const areaName = fullString.split(',')[0].trim();
        
        const pincodeMatch = fullString.match(/\b\d{6}\b/);
        const pin = pincodeMatch ? pincodeMatch[0] : '';

        setArea(areaName);
        setPincode(pin);
        setAddress(fullString); // Fills the full address so user can just add Door No
        
        setShowLocModal(false);
        setLocSearch('');
        setLocResults([]);
    };

    // 🟢 SMART ADDRESS CLEANER (GPS)
    const fetchAddressFromGPS = () => {
        if (!location?.lat || !location?.lng) {
            alert(language === 'en' ? "Please enable GPS permissions first." : "దయచేసి ముందుగా GPS అనుమతులను ఆన్ చేయండి.");
            return;
        }
        
        setIsFetchingAddress(true);
        axios.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${location.lat}&lon=${location.lng}`)
            .then(res => {
                if (res.data && res.data.address) {
                    const fullString = res.data.display_name;
                    const a = res.data.address;
                    
                    const pin = a.postcode || '';
                    const detectedArea = a.neighbourhood || a.suburb || a.village || a.town || '';
                    
                    setArea(detectedArea);
                    setPincode(pin);
                    setAddress(fullString);
                } else {
                    alert(language === 'en' ? "Could not detect address. Please search manually." : "చిరునామా కనుగొనబడలేదు. దయచేసి వెతకండి.");
                }
            })
            .catch(err => console.warn("Could not fetch address", err))
            .finally(() => setIsFetchingAddress(false));
    };

    const handleDetailsSubmit = async (e) => {
        e.preventDefault();

        const cleanPhone = phone.replace(/\D/g, '');
        if (cleanPhone.length !== 10) {
            alert(language === 'en' ? "⚠️ Please enter exactly 10 digits for your phone number." : "⚠️ దయచేసి సరిగ్గా 10 అంకెల ఫోన్ నంబర్‌ను నమోదు చేయండి.");
            return;
        }

        if (!area || !address) {
            alert(language === 'en' ? "⚠️ Please set your delivery area." : "⚠️ దయచేసి మీ ప్రాంతాన్ని సెట్ చేయండి.");
            return;
        }

        try {
            const BACKEND_URL = getBackendUrl();
            const token = localStorage.getItem('token');
            
            // Format final address neatly
            let finalAddress = address.trim();
            if (pincode && !finalAddress.includes(pincode)) {
                finalAddress += `, Pincode: ${pincode}`;
            }
            
            await axios.put(`${BACKEND_URL}/auth/update-profile`, {
                username: name,
                phone: cleanPhone,
                address: finalAddress,
                language: language 
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const userStr = localStorage.getItem('user');
            let userObj = userStr && userStr !== 'undefined' ? JSON.parse(userStr) : {};
            userObj.username = name;
            userObj.phone = cleanPhone;
            userObj.address = finalAddress;
            userObj.language = language;
            localStorage.setItem('user', JSON.stringify(userObj));
            
            window.location.href = '/'; 

        } catch (error) {
            console.error(error);
            alert("Failed to save details. Please check your network connection.");
        }
    };

    return (
        <div style={styles.container}>
            
            <style>{`
                .touch-scale { transition: transform 0.15s; }
                .touch-scale:active { transform: scale(0.96); }
                .spin { animation: spin 1s linear infinite; }
                @keyframes spin { 100% { transform: rotate(360deg); } }
            `}</style>

            <div style={styles.card}>
                <h1 style={styles.logo}>
                    <span className="glowing-green-logo">Subhams</span> <span style={{color: '#0f172a'}}>Hub</span>
                </h1>

                {step === 1 && (
                    <div style={styles.stepBox}>
                        <h2 style={{color: '#334155'}}>Choose Your Language</h2>
                        <h3 style={{color: '#64748b', marginTop: 0}}>భాషను ఎంచుకోండి</h3>
                        <div style={{display: 'flex', gap: '15px', marginTop: '20px', width: '100%'}}>
                            <button style={styles.langButton} onClick={() => handleLanguageSelect('te')}>తెలుగు</button>
                            <button style={styles.langButton} onClick={() => handleLanguageSelect('en')}>English</button>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div style={styles.stepBox}>
                        <h2 style={{color: '#334155', marginBottom: '10px'}}>{language === 'en' ? 'Welcome to Subhams Hub' : 'సుభమ్స్ హబ్ కి స్వాగతం'}</h2>
                        <p style={{color: '#64748b', marginBottom: '20px', fontSize: '14px'}}>
                            {language === 'en' ? 'Sign in securely with Google to continue.' : 'కొనసాగించడానికి Google తో సురక్షితంగా సైన్ ఇన్ చేయండి.'}
                        </p>
                        <GoogleLogin onSuccess={handleGoogleSuccess} onError={() => alert("Google Login Failed")} />
                    </div>
                )}

                {step === 3 && (
                    <div style={styles.stepBox}>
                        <h2 style={{color: '#334155', margin: '0 0 10px 0'}}>{language === 'en' ? 'Complete Your Profile' : 'మీ ప్రొఫైల్‌ను పూర్తి చేయండి'}</h2>
                        <p style={{color: '#64748b', marginBottom: '20px', fontSize: '13px', lineHeight: '1.4'}}>
                            {language === 'en' ? 'Provide details for local delivery.' : 'స్థానిక డెలివరీ కోసం వివరాలను అందించండి.'}
                        </p>
                        
                        <form onSubmit={handleDetailsSubmit} style={{display: 'flex', flexDirection: 'column', gap: '15px', width: '100%'}}>
                            <input 
                                style={styles.input} 
                                placeholder={language === 'en' ? 'Full Name' : 'పూర్తి పేరు'} 
                                value={name} 
                                onChange={e => setName(e.target.value)} 
                                required 
                            />
                            
                            <input 
                                style={styles.input} 
                                type="tel" 
                                placeholder={language === 'en' ? '10-Digit WhatsApp Number' : '10 అంకెల ఫోన్ నంబర్'} 
                                value={phone} 
                                maxLength={10}
                                onChange={e => setPhone(e.target.value.replace(/\D/g, ''))} 
                                required 
                            />
                            
                            {/* 🟢 LOCATION & ADDRESS AREA */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', background: '#f8fafc', padding: '15px', borderRadius: '12px', border: '1px dashed #94a3b8' }}>
                                
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <input 
                                        type="text"
                                        readOnly 
                                        placeholder={language === 'en' ? "Click to Search Area" : "ప్రాంతాన్ని వెతకండి"}
                                        style={{...styles.input, flex: 2, cursor: 'pointer', background: 'white'}} 
                                        value={area} 
                                        onClick={() => setShowLocModal(true)}
                                    />
                                    <input 
                                        type="text"
                                        maxLength="6"
                                        placeholder={language === 'en' ? "Pincode" : "పిన్‌కోడ్"}
                                        style={{...styles.input, flex: 1, background: 'white'}} 
                                        value={pincode} 
                                        onChange={e => setPincode(e.target.value.replace(/\D/g, ''))} 
                                    />
                                </div>

                                <button type="button" onClick={fetchAddressFromGPS} style={styles.gpsBtn} disabled={isFetchingAddress}>
                                    {isFetchingAddress ? '📍 Locating...' : (language === 'en' ? '📍 Auto-Detect GPS Location' : '📍 నా GPS స్థానాన్ని గుర్తించు')}
                                </button>
                                
                                <textarea 
                                    style={{...styles.input, height: '70px', resize: 'none', width: '100%', boxSizing: 'border-box', background: 'white'}} 
                                    placeholder={language === 'en' ? 'Type Door No. & Street manually...' : 'ఇంటి నంబర్, వీధి...'}
                                    value={address} 
                                    onChange={e => setAddress(e.target.value)} 
                                    required 
                                />
                            </div>

                            <button type="submit" style={styles.submitBtn}>
                                {language === 'en' ? 'Save & Open App 🚀' : 'సేవ్ చేసి కొనసాగించండి 🚀'}
                            </button>
                        </form>
                    </div>
                )}
            </div>

            {/* 🟢 EXACT LOCATION MODAL POPUP */}
            {showLocModal && (
                <div style={styles.overlay}>
                    <div className="touch-scale" style={styles.locModal}>
                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px'}}>
                            <h3 style={{margin: 0, fontSize: '18px', color: '#0f172a'}}>Search Location</h3>
                            <X size={20} style={{cursor: 'pointer', color: '#64748b'}} onClick={() => setShowLocModal(false)} />
                        </div>

                        <div style={{position: 'relative', marginTop: '15px'}}>
                            <Search size={18} color="#94a3b8" style={{position: 'absolute', left: '12px', top: '14px'}} />
                            <input 
                                type="text" 
                                placeholder="Type area, city, or pincode..." 
                                style={styles.locInput} 
                                value={locSearch} 
                                onChange={(e) => handleLocationSearch(e.target.value)} 
                                autoFocus
                            />
                            {isSearching && <Loader size={16} className="spin" color="#2563eb" style={{position: 'absolute', right: '12px', top: '14px'}} />}
                        </div>

                        {locResults.length > 0 && (
                            <div style={styles.locResultsBox}>
                                {locResults.map((loc, i) => (
                                    <div key={i} className="touch-scale" style={styles.locItem} onClick={() => selectCustomLocation(loc)}>
                                        <MapPin size={16} color="#2563eb" style={{flexShrink: 0}} />
                                        <span style={{fontSize: '13px', color: '#334155'}}>{loc.display_name}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

        </div>
    );
};

const styles = {
    container: { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)', padding: '20px' },
    card: { background: 'white', padding: '40px 30px', borderRadius: '24px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center', border: '1px solid #f1f5f9', zIndex: 1 },
    logo: { fontSize: '32px', fontWeight: '900', margin: '0 0 30px 0', letterSpacing: '-0.5px' },
    stepBox: { display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', textAlign: 'center', animation: 'fadeIn 0.4s ease' },
    langButton: { flex: 1, padding: '15px 0', fontSize: '16px', fontWeight: 'bold', color: 'white', background: 'linear-gradient(90deg, #2874f0 0%, #3b82f6 100%)', border: 'none', borderRadius: '12px', cursor: 'pointer', boxShadow: '0 4px 10px rgba(40,116,240,0.3)' },
    input: { padding: '15px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '15px', width: '100%', boxSizing: 'border-box', outline: 'none', color: '#0f172a' },
    gpsBtn: { padding: '12px', borderRadius: '8px', border: '1px solid #bfdbfe', background: '#eff6ff', color: '#2563eb', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer', transition: '0.2s' },
    submitBtn: { padding: '16px', borderRadius: '12px', border: 'none', background: 'linear-gradient(90deg, #10b981 0%, #059669 100%)', color: 'white', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer', boxShadow: '0 4px 10px rgba(16,185,129,0.3)', marginTop: '10px' },

    // Modal Styles
    overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', zIndex: 1000 },
    locModal: { background: 'white', padding: '25px', borderRadius: '20px', maxWidth: '400px', width: '100%', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' },
    locInput: { padding: '14px 14px 14px 40px', borderRadius: '12px', border: '2px solid #2563eb', fontSize: '14px', width: '100%', boxSizing: 'border-box', outline: 'none' },
    locResultsBox: { marginTop: '15px', maxHeight: '200px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '12px' },
    locItem: { padding: '12px', borderBottom: '1px solid #f1f5f9', cursor: 'pointer', display: 'flex', alignItems: 'flex-start', gap: '10px' }
};

export default Welcome;