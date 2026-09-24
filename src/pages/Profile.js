import React, { useState, useEffect, useCallback, useContext } from 'react';
import axios from 'axios';
import { User, MapPin, Phone, Save, Edit2, ArrowLeft, Globe, LogOut, Mail, Search, X, Loader } from 'lucide-react'; 
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext'; 

const Profile = () => {
    const navigate = useNavigate();
    const { language, setLanguage } = useContext(AppContext); 

    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    
    const [profileData, setProfileData] = useState({
        username: '',
        email: '', 
        address: '', // Strictly for manual Street/Door No.
        area: '',    // Auto-filled by search
        pincode: '', // Auto-filled by search or manual
        phone: ''
    });

    // 🟢 LOCATION SEARCH MODAL STATE
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
            if (!token) return navigate('/welcome');

            const res = await axios.get('https://bhavyams-vendorhub-backend.onrender.com/api/auth/me', {
                headers: { Authorization: `Bearer ${token}` }
            });

            const data = res.data;
            
            let parsedAddress = data.address || '';
            let parsedArea = '';
            let parsedPincode = '';

            // Simple parsing to keep Street, Area, and Pincode separate in the UI
            if (parsedAddress.includes('Pincode:')) {
                const parts = parsedAddress.split(', Pincode:');
                parsedPincode = parts[1] ? parts[1].trim() : '';
                
                const addrParts = parts[0].split(',');
                if (addrParts.length > 1) {
                    parsedArea = addrParts.pop().trim();
                    parsedAddress = addrParts.join(',').trim();
                } else {
                    parsedAddress = parts[0].trim();
                }
            }

            setProfileData({
                username: data.username || '',
                email: data.email || '', 
                address: parsedAddress,
                area: parsedArea,
                pincode: parsedPincode,
                phone: data.phone || ''
            });

            localStorage.setItem('user', JSON.stringify(data));
        } catch (err) {
            console.error("Sync Error:", err);
        } finally {
            setLoading(false);
        }
    }, [navigate]);

    useEffect(() => {
        fetchFreshData();
    }, [fetchFreshData]);

    // 🟢 HANDLE LOCATION SEARCH
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

        // 🟢 FIX: We ONLY update Area and Pincode. We leave "address" completely alone!
        setProfileData({ 
            ...profileData, 
            area: areaName, 
            pincode: pin 
        });
        
        setShowLocModal(false);
        setLocSearch('');
        setLocResults([]);
    };

    const handleSave = async () => {
        if (!profileData.username.trim()) return toast.error("Name cannot be empty");
        
        try {
            const token = localStorage.getItem('token');
            
            // Combine them neatly for the database
            let finalAddress = profileData.address ? profileData.address.trim() : '';
            if (profileData.area) finalAddress += (finalAddress ? `, ${profileData.area}` : profileData.area);
            if (profileData.pincode) finalAddress += `, Pincode: ${profileData.pincode}`;

            const payload = {
                username: profileData.username,
                phone: profileData.phone,
                address: finalAddress
            };

            const res = await axios.put('https://bhavyams-vendorhub-backend.onrender.com/api/auth/update-profile', payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data.user) {
                localStorage.setItem('user', JSON.stringify(res.data.user));
                setIsEditing(false);
                toast.success("Profile & Settings updated successfully!");
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

            <div style={{...styles.profileCard, padding: isMobile ? '25px 20px' : '40px'}}>
                
                <div style={styles.topNav}>
                    <button onClick={() => navigate(-1)} style={styles.backBtn}>
                        <ArrowLeft size={18}/> {isMobile ? "" : "Back"}
                    </button>
                    <button onClick={handleLogout} style={styles.logoutBtn}>
                        <LogOut size={16}/> Logout
                    </button>
                </div>

                <div style={styles.header}>
                    <h2 style={{fontSize: isMobile ? '20px' : '24px', margin: 0, color: '#0f172a'}}>Settings & Profile</h2>
                    <button 
                        onClick={() => {
                            if(isEditing) fetchFreshData(); 
                            setIsEditing(!isEditing);
                        }} 
                        style={styles.editBtn}
                    >
                        {isEditing ? "Cancel" : <><Edit2 size={16}/> Edit</>}
                    </button>
                </div>

                <div style={styles.field}>
                    <div style={styles.iconBox}><Globe size={20} color="#2874f0"/></div>
                    <div style={{flex: 1}}>
                        <label style={styles.label}>App Language</label>
                        <select 
                            value={language} 
                            onChange={(e) => setLanguage(e.target.value)} 
                            style={styles.inputActive}
                        >
                            <option value="en">English</option>
                            <option value="te">తెలుగు (Telugu)</option>
                        </select>
                        <p style={{margin: '4px 0 0 0', fontSize: '11px', color: '#64748b'}}>Changes instantly.</p>
                    </div>
                </div>

                <div style={styles.divider}></div>

                <div style={styles.field}>
                    <div style={styles.iconBox}><Mail size={20} color="#2874f0"/></div>
                    <div style={{flex: 1}}>
                        <label style={styles.label}>Registered Google Email</label>
                        <input 
                            disabled={true} 
                            value={profileData.email}
                            style={{ ...styles.input, color: '#64748b' }} 
                            placeholder="Loading email..."
                        />
                        {isEditing && (
                            <p style={{margin: '4px 0 0 0', fontSize: '11px', color: '#94a3b8', fontWeight: '500'}}>
                                Linked to your Google account. Cannot be changed.
                            </p>
                        )}
                    </div>
                </div>

                <div style={styles.field}>
                    <div style={styles.iconBox}><User size={20} color="#2874f0"/></div>
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
                    <div style={styles.iconBox}><Phone size={20} color="#2874f0"/></div>
                    <div style={{flex: 1}}>
                        <label style={styles.label}>Phone Number</label>
                        <input 
                            type="tel"
                            disabled={!isEditing}
                            value={profileData.phone}
                            onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                            style={isEditing ? styles.inputActive : styles.input}
                            placeholder="Add phone number"
                        />
                    </div>
                </div>

                {/* 🟢 LOCATION / ADDRESS FIELDS */}
                <div style={styles.field}>
                    <div style={styles.iconBox}><MapPin size={20} color="#2874f0"/></div>
                    <div style={{flex: 1}}>
                        <label style={styles.label}>Location / Area</label>
                        
                        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                            <input 
                                disabled={!isEditing}
                                type="text"
                                readOnly 
                                placeholder="Click to Search Area" 
                                style={isEditing ? {...styles.inputActive, flex: 2, cursor: 'pointer'} : {...styles.input, flex: 2}} 
                                value={profileData.area} 
                                onClick={() => { if(isEditing) setShowLocModal(true); }}
                            />
                            <input 
                                disabled={!isEditing}
                                type="text"
                                maxLength="6"
                                placeholder="Pincode" 
                                style={isEditing ? {...styles.inputActive, flex: 1} : {...styles.input, flex: 1}} 
                                value={profileData.pincode} 
                                onChange={e => setProfileData({...profileData, pincode: e.target.value})} 
                            />
                        </div>

                        <label style={styles.label}>Full Street Address</label>
                        <textarea 
                            disabled={!isEditing}
                            value={profileData.address}
                            onChange={(e) => setProfileData({...profileData, address: e.target.value})}
                            style={isEditing ? { ...styles.inputActive, height: '80px', resize: 'none' } : styles.input}
                            placeholder="Type your Door No. & Street manually here..."
                        />
                    </div>
                </div>

                {isEditing && (
                    <button onClick={handleSave} style={styles.saveBtn}>
                        <Save size={18} style={{marginRight: '8px'}}/> Save Changes
                    </button>
                )}
            </div>
            
            {/* 🟢 EXACT LOCATION MODAL POPUP */}
            {showLocModal && (
                <div style={styles.overlay}>
                    <div className="touch-scale" style={styles.locModal}>
                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px'}}>
                            <h3 style={{margin: 0, fontSize: '18px', color: '#0f172a'}}>Search Location / Pincode</h3>
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

            <div style={{ height: '80px' }}></div>
        </div>
    );
};

const styles = {
    container: { display: 'flex', flexDirection: 'column', alignItems: 'center', background: '#f1f5f9', minHeight: '100vh', fontFamily: 'Inter, sans-serif' },
    profileCard: { background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '500px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', alignSelf: 'center', marginTop: '20px' },
    topNav: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' },
    backBtn: { border: 'none', background: 'none', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '14px', fontWeight: '600' },
    logoutBtn: { border: '1px solid #fecaca', background: '#fef2f2', color: '#ef4444', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '700' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' },
    divider: { height: '1px', background: '#e2e8f0', margin: '20px 0 25px 0' },
    field: { display: 'flex', alignItems: 'flex-start', gap: '15px', marginBottom: '25px' },
    iconBox: { padding: '10px', background: '#eff6ff', borderRadius: '10px' },
    label: { display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '6px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' },
    input: { border: '1px solid transparent', background: 'transparent', width: '100%', fontSize: '15px', color: '#1e293b', outline: 'none', padding: '5px 0', fontWeight: '500' },
    inputActive: { border: '1px solid #bfdbfe', borderRadius: '8px', padding: '12px', width: '100%', fontSize: '14px', background: '#f8fafc', boxSizing: 'border-box', color: '#0f172a', fontWeight: '500', outline: 'none' },
    editBtn: { background: '#eff6ff', color: '#2563eb', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '13px' },
    saveBtn: { background: '#2563eb', color: '#fff', border: 'none', width: '100%', padding: '16px', borderRadius: '12px', fontWeight: '800', cursor: 'pointer', marginTop: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center', boxShadow: '0 4px 10px rgba(37, 99, 235, 0.2)' },
    loader: { textAlign: 'center', padding: '100px', color: '#2563eb', fontWeight: 'bold' },
    
    overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', zIndex: 1000 },
    locModal: { background: 'white', padding: '25px', borderRadius: '20px', maxWidth: '400px', width: '100%', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' },
    locInput: { padding: '14px 14px 14px 40px', borderRadius: '12px', border: '2px solid #2563eb', fontSize: '14px', width: '100%', boxSizing: 'border-box', outline: 'none' },
    locResultsBox: { marginTop: '15px', maxHeight: '200px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '12px' },
    locItem: { padding: '12px', borderBottom: '1px solid #f1f5f9', cursor: 'pointer', display: 'flex', alignItems: 'flex-start', gap: '10px' }
};

export default Profile;