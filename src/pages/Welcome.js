import React, { useState, useContext } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { Search, MapPin, X, Loader } from 'lucide-react'; 
import { toast } from 'react-toastify';

const getBackendUrl = () => {
    const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    return isLocal ? 'http://localhost:5000/api' : 'https://bhavyams-vendorhub-backend.onrender.com/api';
};

const TELUGU_TO_EN_MAP = {
    'కోణంకి': 'konanki', 'మార్టూరు': 'martur', 'బాపట్ల': 'bapatla',
    'తిరుపతి': 'tirupati', 'ఆంధ్రప్రదేశ్': 'andhra pradesh', 'గుంటూరు': 'guntur',
    'విజయవాడ': 'vijayawada', 'ఒంగోలు': 'ongole', 'చీరాల': 'chirala', 'ప్రకాశం': 'prakasam'
};

const normalizeQuery = (q) => {
    if (!q) return '';
    let lower = q.toLowerCase();
    Object.keys(TELUGU_TO_EN_MAP).forEach(te => {
        if (lower.includes(te)) lower = lower.replace(new RegExp(te, 'g'), TELUGU_TO_EN_MAP[te]);
    });
    return lower;
};

const Welcome = () => {
    const navigate = useNavigate();
    const { language, setLanguage, location } = useContext(AppContext);

    const [step, setStep] = useState(1);
    const [phone, setPhone] = useState('');
    const [name, setName] = useState(''); 
    
    const [areaHierarchy, setAreaHierarchy] = useState('');
    const [doorStreet, setDoorStreet] = useState('');
    const [pincode, setPincode] = useState('');
    const [isFetchingAddress, setIsFetchingAddress] = useState(false);
    
    const [showLocModal, setShowLocModal] = useState(false);
    const [locSearch, setLocSearch] = useState('');
    const [locResults, setLocResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [searchTimeout, setSearchTimeout] = useState(null);

    const handleLanguageSelect = (lang) => {
        setLanguage(lang);
        localStorage.setItem('appLanguage', lang);
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

            if (user.phone && user.phone.length === 10 && user.phone !== "0000000000" && user.address) {
                navigate('/'); 
            } else {
                setName(user.username || '');
                setPhone(user.phone || '');
                setAreaHierarchy(user.address || '');
                setStep(3); 
            }
        } catch (error) {
            console.error("Google Auth Failed", error);
            toast.error("Login Failed. Please try again.");
        }
    };

    const handleLocationSearch = (query) => {
        setLocSearch(query);
        if (query.trim().length < 2) {
            setLocResults([]);
            return;
        }
        setIsSearching(true);
        if (searchTimeout) clearTimeout(searchTimeout);

        const timeoutId = setTimeout(async () => {
            try {
                const qNorm = normalizeQuery(query.trim());
                const res = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&countrycodes=in&accept-language=en&q=${encodeURIComponent(qNorm)}`);
                setLocResults(res.data || []);
            } catch (e) {} finally {
                setIsSearching(false);
            }
        }, 450);

        setSearchTimeout(timeoutId);
    };

    // 🟢 SAVES STANDARDIZED ENGLISH HIERARCHY FOR 1ST-WORD + SUB-ADDRESS MATCHING
    const selectCustomLocation = (loc) => {
        const fullString = loc.display_name;
        const pincodeMatch = fullString.match(/\b\d{6}\b/);
        const pin = pincodeMatch ? pincodeMatch[0] : '';

        setAreaHierarchy(fullString);
        setPincode(pin);
        setShowLocModal(false);
        setLocSearch('');
        setLocResults([]);
    };

    const fetchAddressFromGPS = () => {
        if (!location?.lat || !location?.lng) {
            toast.info(language === 'en' ? "Please enable GPS permissions or use the Map Search box." : "దయచేసి GPS ఆన్ చేయండి లేదా పైన ఉన్న సెర్చ్ బాక్స్ వాడండి.");
            return;
        }
        
        setIsFetchingAddress(true);
        axios.get(`https://nominatim.openstreetmap.org/reverse?format=json&accept-language=en&lat=${location.lat}&lon=${location.lng}`)
            .then(res => {
                if (res.data && res.data.display_name) {
                    const fullString = res.data.display_name;
                    const pin = res.data.address?.postcode || '';
                    setAreaHierarchy(fullString);
                    setPincode(pin);
                } else {
                    toast.warning("Could not detect address. Please search manually.");
                }
            })
            .catch(() => {})
            .finally(() => setIsFetchingAddress(false));
    };

    const handleDetailsSubmit = async (e) => {
        e.preventDefault();

        const cleanPhone = phone.replace(/\D/g, '');
        if (cleanPhone.length !== 10) {
            toast.error(language === 'en' ? "⚠️ Please enter a valid 10-digit phone number." : "⚠️ దయచేసి 10 అంకెల ఫోన్ నంబర్‌ను నమోదు చేయండి.");
            return;
        }

        if (!areaHierarchy) {
            toast.error(language === 'en' ? "⚠️ Please select your area from the search box." : "⚠️ దయచేసి మీ ప్రాంతాన్ని ఎంచుకోండి.");
            return;
        }

        try {
            const BACKEND_URL = getBackendUrl();
            const token = localStorage.getItem('token');
            
            let finalAddress = areaHierarchy.trim();
            if (doorStreet.trim()) {
                finalAddress = `${finalAddress} (${doorStreet.trim()})`;
            }
            if (pincode && !finalAddress.includes(pincode)) {
                finalAddress += `, ${pincode}`;
            }
            
            const res = await axios.put(`${BACKEND_URL}/auth/update-profile`, {
                username: name.trim(),
                phone: cleanPhone,
                address: finalAddress,
                language: language 
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const updatedUser = res.data?.user || { username: name, phone: cleanPhone, address: finalAddress, language };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            localStorage.setItem('custom_hub_location', JSON.stringify({ lat: 0, lng: 0, address: areaHierarchy.trim() }));
            
            window.location.href = '/'; 
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to save details.");
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
                    <span style={{color: '#2563eb'}}>Subhams</span> <span style={{color: '#0f172a'}}>Hub</span>
                </h1>

                {step === 1 && (
                    <div style={styles.stepBox}>
                        <h2 style={{color: '#334155', margin: '0 0 6px 0'}}>Choose Your Language</h2>
                        <h3 style={{color: '#64748b', marginTop: 0}}>భాషను ఎంచుకోండి</h3>
                        <div style={{display: 'flex', gap: '15px', marginTop: '20px', width: '100%'}}>
                            <button style={styles.langButton} onClick={() => handleLanguageSelect('te')}>తెలుగు</button>
                            <button style={styles.langButton} onClick={() => handleLanguageSelect('en')}>English</button>
                        </div>
                        <div style={{ textAlign: 'center', marginTop: '18px', fontSize: '12px', color: '#64748b' }}>
                            By continuing, you agree to the Subhams Networks <br/>
                            <a href="https://subhamsnetworks.in/legal" target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 'bold' }}>
                                Privacy Policy & Terms of Service
                            </a>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div style={styles.stepBox}>
                        <h2 style={{color: '#334155', marginBottom: '10px'}}>{language === 'en' ? 'Welcome to Subhams Hub' : 'సుభమ్స్ హబ్ కి స్వాగతం'}</h2>
                        <p style={{color: '#64748b', marginBottom: '20px', fontSize: '14px'}}>
                            {language === 'en' ? 'Sign in securely with Google to continue.' : 'కొనసాగించడానికి Google తో సురక్షితంగా సైన్ ఇన్ చేయండి.'}
                        </p>
                        <GoogleLogin onSuccess={handleGoogleSuccess} onError={() => toast.error("Google Login Failed")} />
                    </div>
                )}

                {step === 3 && (
                    <div style={styles.stepBox}>
                        <h2 style={{color: '#334155', margin: '0 0 8px 0', fontSize: '20px'}}>{language === 'en' ? 'Complete Your Profile' : 'మీ ప్రొఫైల్‌ను పూర్తి చేయండి'}</h2>
                        <p style={{color: '#64748b', marginBottom: '16px', fontSize: '13px', lineHeight: '1.4'}}>
                            {language === 'en' ? 'Select your village/town to discover shops delivering to you.' : 'మీ ప్రాంతానికి డెలివరీ చేసే షాపులను చూడటానికి వివరాలను అందించండి.'}
                        </p>
                        
                        <form onSubmit={handleDetailsSubmit} style={{display: 'flex', flexDirection: 'column', gap: '12px', width: '100%'}}>
                            <input 
                                style={styles.input} 
                                placeholder={language === 'en' ? 'Full Name *' : 'పూర్తి పేరు *'} 
                                value={name} 
                                onChange={e => setName(e.target.value)} 
                                required 
                            />
                            
                            <input 
                                style={styles.input} 
                                type="tel" 
                                placeholder={language === 'en' ? '10-Digit Mobile Number *' : '10 అంకెల ఫోన్ నంబర్ *'} 
                                value={phone} 
                                maxLength={10}
                                onChange={e => setPhone(e.target.value.replace(/\D/g, ''))} 
                                required 
                            />
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', background: '#f8fafc', padding: '12px', borderRadius: '12px', border: '1px dashed #94a3b8', textAlign: 'left' }}>
                                <div 
                                    onClick={() => setShowLocModal(true)}
                                    style={{...styles.input, background: 'white', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1.5px solid #2563eb'}}
                                >
                                    <span style={{ fontSize: '13px', fontWeight: '700', color: areaHierarchy ? '#0f172a' : '#64748b' }}>
                                        {areaHierarchy || (language === 'en' ? "🔍 Click to Search Village / Town *" : "🔍 గ్రామం / పట్టణాన్ని ఎంచుకోండి *")}
                                    </span>
                                    <MapPin size={18} color="#2563eb" style={{ flexShrink: 0 }} />
                                </div>

                                <button type="button" onClick={fetchAddressFromGPS} style={styles.gpsBtn} disabled={isFetchingAddress}>
                                    {isFetchingAddress ? '📍 Locating...' : (language === 'en' ? '📍 Auto-Detect GPS Location' : '📍 నా GPS స్థానాన్ని గుర్తించు')}
                                </button>
                                
                                <input 
                                    style={{...styles.input, background: 'white', fontSize: '13.5px'}} 
                                    placeholder={language === 'en' ? 'Optional: Door No / Street / Landmark...' : 'ఐచ్ఛికం: ఇంటి నంబర్ / వీధి...'}
                                    value={doorStreet} 
                                    onChange={e => setDoorStreet(e.target.value)} 
                                />
                            </div>

                            <button type="submit" style={styles.submitBtn}>
                                {language === 'en' ? 'Save & Open Subhams Hub 🚀' : 'సేవ్ చేసి కొనసాగించండి 🚀'}
                            </button>
                        </form>
                    </div>
                )}
            </div>

            {showLocModal && (
                <div style={styles.overlay}>
                    <div className="touch-scale" style={styles.locModal}>
                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px'}}>
                            <h3 style={{margin: 0, fontSize: '17px', color: '#0f172a', fontWeight: '900'}}>📍 Select Your Village / Town</h3>
                            <X size={20} style={{cursor: 'pointer', color: '#64748b'}} onClick={() => setShowLocModal(false)} />
                        </div>

                        <div style={{position: 'relative', marginTop: '10px'}}>
                            <Search size={18} color="#94a3b8" style={{position: 'absolute', left: '12px', top: '14px'}} />
                            <input 
                                type="text" 
                                placeholder="Type village, town, or pincode (e.g. Konanki)..." 
                                style={styles.locInput} 
                                value={locSearch} 
                                onChange={(e) => handleLocationSearch(e.target.value)} 
                                autoFocus
                            />
                            {isSearching && <Loader size={16} className="spin" color="#2563eb" style={{position: 'absolute', right: '12px', top: '14px'}} />}
                        </div>

                        {locResults.length > 0 && (
                            <div style={styles.locResultsBox}>
                                {locResults.map((loc, i) => {
                                    const parts = loc.display_name.split(',').map(p => p.trim());
                                    return (
                                        <div key={i} className="touch-scale" style={styles.locItem} onClick={() => selectCustomLocation(loc)}>
                                            <MapPin size={16} color="#2563eb" style={{flexShrink: 0, marginTop: '2px'}} />
                                            <div style={{ textAlign: 'left' }}>
                                                <div style={{fontSize: '13.5px', fontWeight: '800', color: '#0f172a'}}>{parts[0]}</div>
                                                <div style={{fontSize: '11px', color: '#64748b'}}>{parts.slice(1).join(', ')}</div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

const styles = {
    container: { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)', padding: '16px', boxSizing: 'border-box' },
    card: { background: 'white', padding: '32px 24px', borderRadius: '24px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', width: '100%', maxWidth: '410px', display: 'flex', flexDirection: 'column', alignItems: 'center', border: '1px solid #f1f5f9', boxSizing: 'border-box' },
    logo: { fontSize: '30px', fontWeight: '900', margin: '0 0 24px 0', letterSpacing: '-0.5px' },
    stepBox: { display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', textAlign: 'center' },
    langButton: { flex: 1, padding: '14px 0', fontSize: '16px', fontWeight: 'bold', color: 'white', background: 'linear-gradient(90deg, #2563eb 0%, #3b82f6 100%)', border: 'none', borderRadius: '12px', cursor: 'pointer', boxShadow: '0 4px 10px rgba(37,99,235,0.25)' },
    input: { padding: '13px 14px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '14.5px', width: '100%', boxSizing: 'border-box', outline: 'none', color: '#0f172a', fontWeight: '600' },
    gpsBtn: { padding: '10px', borderRadius: '8px', border: '1px solid #bfdbfe', background: '#eff6ff', color: '#2563eb', fontWeight: '800', fontSize: '12.5px', cursor: 'pointer' },
    submitBtn: { padding: '15px', borderRadius: '12px', border: 'none', background: 'linear-gradient(90deg, #10b981 0%, #059669 100%)', color: 'white', fontWeight: '900', fontSize: '15.5px', cursor: 'pointer', boxShadow: '0 4px 10px rgba(16,185,129,0.3)', marginTop: '6px', width: '100%' },
    overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', zIndex: 1000 },
    locModal: { background: 'white', padding: '22px', borderRadius: '20px', maxWidth: '400px', width: '100%', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.15)', boxSizing: 'border-box' },
    locInput: { padding: '12px 12px 12px 38px', borderRadius: '12px', border: '2px solid #2563eb', fontSize: '14px', width: '100%', boxSizing: 'border-box', outline: 'none' },
    locResultsBox: { marginTop: '12px', maxHeight: '210px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '12px' },
    locItem: { padding: '10px 12px', borderBottom: '1px solid #f1f5f9', cursor: 'pointer', display: 'flex', alignItems: 'flex-start', gap: '10px' }
};

export default Welcome;