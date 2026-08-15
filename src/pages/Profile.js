import React, { useState, useEffect, useCallback, useContext } from 'react';
import axios from 'axios';
import { User, MapPin, Phone, Save, Edit2, ArrowLeft, Globe, LogOut, Mail } from 'lucide-react'; // 🟢 Added Mail icon
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
        email: '', // 🟢 Added email state
        address: '',
        area: '',
        pincode: '',
        phone: ''
    });

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
                email: data.email || '', // 🟢 Pull email from database
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

    const handleSave = async () => {
        if (!profileData.username.trim()) return toast.error("Name cannot be empty");
        
        try {
            const token = localStorage.getItem('token');
            
            let finalAddress = profileData.address;
            if (profileData.area) finalAddress += `, ${profileData.area}`;
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

                {/* APP LANGUAGE SETTINGS */}
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

                {/* 🟢 EMAIL FIELD (STRICTLY NON-EDITABLE) */}
                <div style={styles.field}>
                    <div style={styles.iconBox}><Mail size={20} color="#2874f0"/></div>
                    <div style={{flex: 1}}>
                        <label style={styles.label}>Registered Google Email</label>
                        <input 
                            disabled={true} // Strictly locked
                            value={profileData.email}
                            style={{ ...styles.input, color: '#64748b' }} // Grey text to indicate it's locked
                            placeholder="Loading email..."
                        />
                        {isEditing && (
                            <p style={{margin: '4px 0 0 0', fontSize: '11px', color: '#94a3b8', fontWeight: '500'}}>
                                Linked to your Google account. Cannot be changed.
                            </p>
                        )}
                    </div>
                </div>

                {/* NAME FIELD */}
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

                {/* PHONE FIELD */}
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

                {/* ADDRESS FIELDS */}
                <div style={styles.field}>
                    <div style={styles.iconBox}><MapPin size={20} color="#2874f0"/></div>
                    <div style={{flex: 1}}>
                        <label style={styles.label}>Location / Area</label>
                        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                            <input 
                                disabled={!isEditing}
                                type="text" 
                                placeholder="Area" 
                                style={isEditing ? {...styles.inputActive, flex: 2} : {...styles.input, flex: 2}} 
                                value={profileData.area} 
                                onChange={e => setProfileData({...profileData, area: e.target.value})} 
                            />
                            <input 
                                disabled={!isEditing}
                                type="text" 
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
                            placeholder="Enter full address details"
                        />
                    </div>
                </div>

                {isEditing && (
                    <button onClick={handleSave} style={styles.saveBtn}>
                        <Save size={18} style={{marginRight: '8px'}}/> Save Changes
                    </button>
                )}
            </div>
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
    loader: { textAlign: 'center', padding: '100px', color: '#2563eb', fontWeight: 'bold' }
};

export default Profile;