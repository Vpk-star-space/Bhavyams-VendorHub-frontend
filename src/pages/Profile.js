import React, { useState, useEffect, useCallback, useContext } from 'react';
import axios from 'axios';
import { User, MapPin, Phone, Save, Edit2, ArrowLeft, Globe, LogOut, Mail, Search, X, Loader } from 'lucide-react'; 
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext'; 

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

const Profile = () => {
    const navigate = useNavigate();
    const { language, setLanguage } = useContext(AppContext); 

    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    
    const [profileData, setProfileData] = useState({
        username: '',
        email: '', 
        doorStreet: '', 
        areaHierarchy: '',    
        pincode: '', 
        phone: ''
    });

    const [showLocModal, setShowLocModal] = useState(false);
    const [locSearch, setLocSearch] = useState('');
    const [locResults, setLocResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const fetchFreshData = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/welcome');
                return;
            }

            const res = await axios.get(`${getBackendUrl()}/auth/me`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const data = res.data;
            let rawAddr = data.address || '';
            let pinMatch = rawAddr.match(/\b\d{6}\b/);
            let extractedPin = pinMatch ? pinMatch[0] : '';
            let cleanAddr = rawAddr.replace(/,\s*Pincode:\s*\d{6}/i, '').trim();

            setProfileData({
                username: data.username || '',
                email: data.email || '', 
                doorStreet: '',
                areaHierarchy: cleanAddr,
                pincode: extractedPin,
                phone: data.phone || ''
            });

            localStorage.setItem('user', JSON.stringify(data));
        } catch (err) {
            if (err.response && err.response.status === 401) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                navigate('/welcome');
            }
        } finally {
            setLoading(false);
        }
    }, [navigate]);

    useEffect(() => {
        fetchFreshData();
    }, [fetchFreshData]);

    const handleLocationSearch = async (query) => {
        setLocSearch(query);
        if (query.trim().length < 2) return setLocResults([]);
        
        setIsSearching(true);
        try {
            const qNorm = normalizeQuery(query.trim());
            const res = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&countrycodes=in&accept-language=en&q=${encodeURIComponent(qNorm)}`);
            setLocResults(res.data || []);
        } catch (e) {} finally {
            setIsSearching(false);
        }
    };

    // 🟢 SAVES FULL ENGLISH HIERARCHY (So 1st-word + sub-address matching works!)
    const selectCustomLocation = (loc) => {
        const fullString = loc.display_name;
        const pincodeMatch = fullString.match(/\b\d{6}\b/);
        const pin = pincodeMatch ? pincodeMatch[0] : profileData.pincode;

        setProfileData({ 
            ...profileData, 
            areaHierarchy: fullString, 
            pincode: pin 
        });
        
        setShowLocModal(false);
        setLocSearch('');
        setLocResults([]);
    };

    const handleSave = async () => {
        if (!profileData.username.trim()) return toast.error("Name cannot be empty");
        if (!profileData.areaHierarchy.trim()) return toast.error("Please select your Area from the Map Search box.");
        
        try {
            const token = localStorage.getItem('token');
            // Keep the Map Search area FIRST so 1st-word priority matching works cleanly
            let finalAddress = profileData.areaHierarchy.trim();
            if (profileData.doorStreet.trim()) {
                finalAddress = `${finalAddress} (${profileData.doorStreet.trim()})`;
            }
            if (profileData.pincode && !finalAddress.includes(profileData.pincode)) {
                finalAddress += `, ${profileData.pincode}`;
            }

            const payload = {
                username: profileData.username.trim(),
                phone: String(profileData.phone || '').replace(/\D/g, '').slice(-10),
                address: finalAddress,
                language: language
            };

            const res = await axios.put(`${getBackendUrl()}/auth/update-profile`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data.user) {
                localStorage.setItem('user', JSON.stringify(res.data.user));
                // Sync Home explorer location too
                localStorage.setItem('custom_hub_location', JSON.stringify({ lat: 0, lng: 0, address: profileData.areaHierarchy.trim() }));
                setIsEditing(false);
                toast.success("✅ Profile & Delivery Area updated!");
                fetchFreshData(); 
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "Update failed");
        }
    };

    const handleLogout = () => {
        if (window.confirm("Are you sure you want to log out?")) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('subhams_cart');
            navigate('/welcome');
        }
    };

    if (loading) return <div style={styles.loader}>Syncing Profile...</div>;

    return (
        <div style={{...styles.container, padding: isMobile ? '15px' : '40px 20px'}}>
            <style>{`
                .touch-scale { transition: transform 0.15s; }
                .touch-scale:active { transform: scale(0.96); }
                .spin { animation: spin 1s linear infinite; }
                @keyframes spin { 100% { transform: rotate(360deg); } }
            `}</style>

            <div style={{...styles.profileCard, padding: isMobile ? '22px 18px' : '36px'}}>
                <div style={styles.topNav}>
                    <button onClick={() => navigate(-1)} style={styles.backBtn}>
                        <ArrowLeft size={18}/> Back
                    </button>
                    <button onClick={handleLogout} style={styles.logoutBtn}>
                        <LogOut size={16}/> Logout
                    </button>
                </div>

                <div style={styles.header}>
                    <h2 style={{fontSize: isMobile ? '20px' : '24px', margin: 0, color: '#0f172a', fontWeight: '900'}}>Settings & Profile</h2>
                    <button 
                        onClick={() => {
                            if (isEditing) fetchFreshData(); 
                            setIsEditing(!isEditing);
                        }} 
                        style={styles.editBtn}
                    >
                        {isEditing ? "Cancel" : <><Edit2 size={15}/> Edit Profile</>}
                    </button>
                </div>

                <div style={styles.field}>
                    <div style={styles.iconBox}><Globe size={20} color="#2563eb"/></div>
                    <div style={{flex: 1}}>
                        <label style={styles.label}>App Language / భాష</label>
                        <select 
                            value={language} 
                            onChange={(e) => {
                                setLanguage(e.target.value);
                                localStorage.setItem('appLanguage', e.target.value);
                            }} 
                            style={styles.inputActive}
                        >
                            <option value="en">English</option>
                            <option value="te">తెలుగు (Telugu)</option>
                        </select>
                    </div>
                </div>

                <div style={styles.divider}></div>

                <div style={styles.field}>
                    <div style={styles.iconBox}><Mail size={20} color="#2563eb"/></div>
                    <div style={{flex: 1}}>
                        <label style={styles.label}>Registered Google Email</label>
                        <input disabled={true} value={profileData.email} style={{ ...styles.input, color: '#64748b' }} />
                    </div>
                </div>

                <div style={styles.field}>
                    <div style={styles.iconBox}><User size={20} color="#2563eb"/></div>
                    <div style={{flex: 1}}>
                        <label style={styles.label}>Display Name</label>
                        <input 
                            disabled={!isEditing}
                            value={profileData.username}
                            onChange={(e) => setProfileData({...profileData, username: e.target.value})}
                            style={isEditing ? styles.inputActive : styles.input}
                            placeholder="Enter your name"
                        />
                    </div>
                </div>

                <div style={styles.field}>
                    <div style={styles.iconBox}><Phone size={20} color="#2563eb"/></div>
                    <div style={{flex: 1}}>
                        <label style={styles.label}>10-Digit Phone Number</label>
                        <input 
                            type="tel"
                            maxLength={10}
                            disabled={!isEditing}
                            value={profileData.phone}
                            onChange={(e) => setProfileData({...profileData, phone: e.target.value.replace(/\D/g, '')})}
                            style={isEditing ? styles.inputActive : styles.input}
                            placeholder="Add 10-digit phone number"
                        />
                    </div>
                </div>

                <div style={styles.field}>
                    <div style={styles.iconBox}><MapPin size={20} color="#2563eb"/></div>
                    <div style={{flex: 1}}>
                        <label style={styles.label}>Delivery Area (Map Search Only)</label>
                        <div 
                            onClick={() => { if (isEditing) setShowLocModal(true); }}
                            style={{
                                ...(isEditing ? styles.inputActive : styles.input),
                                cursor: isEditing ? 'pointer' : 'default',
                                marginBottom: '10px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}
                        >
                            <span style={{ fontSize: '13.5px', fontWeight: '700', color: profileData.areaHierarchy ? '#0f172a' : '#94a3b8' }}>
                                {profileData.areaHierarchy || 'Tap Edit & click here to search your village/town...'}
                            </span>
                            {isEditing && <Search size={16} color="#2563eb" />}
                        </div>

                        {isEditing && (
                            <>
                                <label style={styles.label}>Optional Landmark / Street Note</label>
                                <input 
                                    type="text"
                                    value={profileData.doorStreet}
                                    onChange={(e) => setProfileData({...profileData, doorStreet: e.target.value})}
                                    style={styles.inputActive}
                                    placeholder="Optional: Near Temple / Main Road..."
                                />
                            </>
                        )}
                    </div>
                </div>

                {isEditing && (
                    <button onClick={handleSave} style={styles.saveBtn}>
                        <Save size={18} style={{marginRight: '8px'}}/> Save Changes
                    </button>
                )}
            </div>
            
            {showLocModal && (
                <div style={styles.overlay}>
                    <div className="touch-scale" style={styles.locModal}>
                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px'}}>
                            <h3 style={{margin: 0, fontSize: '17px', color: '#0f172a', fontWeight: '900'}}>📍 Select Delivery Area</h3>
                            <X size={20} style={{cursor: 'pointer', color: '#64748b'}} onClick={() => setShowLocModal(false)} />
                        </div>
                        <div style={{position: 'relative', marginTop: '10px'}}>
                            <Search size={18} color="#94a3b8" style={{position: 'absolute', left: '12px', top: '14px'}} />
                            <input 
                                type="text" 
                                placeholder="Search village, mandal, district, or pincode..." 
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
                                            <div>
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
            <div style={{ height: '80px' }}></div>
        </div>
    );
};

const styles = {
    container: { display: 'flex', flexDirection: 'column', alignItems: 'center', background: '#f1f5f9', minHeight: '100vh', fontFamily: 'Inter, sans-serif', boxSizing: 'border-box' },
    profileCard: { background: '#fff', borderRadius: '18px', width: '100%', maxWidth: '500px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', alignSelf: 'center', marginTop: '10px', boxSizing: 'border-box' },
    topNav: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' },
    backBtn: { border: 'none', background: '#f1f5f9', padding: '7px 12px', borderRadius: '8px', color: '#0f172a', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px', fontWeight: '800' },
    logoutBtn: { border: '1px solid #fecaca', background: '#fef2f2', color: '#ef4444', borderRadius: '8px', padding: '7px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '800' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
    divider: { height: '1px', background: '#e2e8f0', margin: '18px 0 22px 0' },
    field: { display: 'flex', alignItems: 'flex-start', gap: '14px', marginBottom: '22px' },
    iconBox: { padding: '10px', background: '#eff6ff', borderRadius: '10px' },
    label: { display: 'block', fontSize: '11px', color: '#64748b', marginBottom: '6px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' },
    input: { border: '1px solid transparent', background: 'transparent', width: '100%', fontSize: '15px', color: '#0f172a', outline: 'none', padding: '5px 0', fontWeight: '700' },
    inputActive: { border: '1.5px solid #bfdbfe', borderRadius: '10px', padding: '11px 12px', width: '100%', fontSize: '14px', background: '#f8fafc', boxSizing: 'border-box', color: '#0f172a', fontWeight: '700', outline: 'none' },
    editBtn: { background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', padding: '8px 14px', borderRadius: '10px', cursor: 'pointer', fontWeight: '800', fontSize: '12.5px', display: 'flex', alignItems: 'center', gap: '5px' },
    saveBtn: { background: '#2563eb', color: '#fff', border: 'none', width: '100%', padding: '15px', borderRadius: '12px', fontWeight: '900', fontSize: '15px', cursor: 'pointer', marginTop: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)' },
    loader: { textAlign: 'center', padding: '100px', color: '#2563eb', fontWeight: 'bold' },
    overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', zIndex: 1000 },
    locModal: { background: 'white', padding: '22px', borderRadius: '20px', maxWidth: '400px', width: '100%', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.15)', boxSizing: 'border-box' },
    locInput: { padding: '12px 12px 12px 38px', borderRadius: '12px', border: '2px solid #2563eb', fontSize: '14px', width: '100%', boxSizing: 'border-box', outline: 'none' },
    locResultsBox: { marginTop: '12px', maxHeight: '210px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '12px' },
    locItem: { padding: '10px 12px', borderBottom: '1px solid #f1f5f9', cursor: 'pointer', display: 'flex', alignItems: 'flex-start', gap: '10px' }
};

export default Profile;