import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { User, MapPin, Phone, Save, Edit2, ArrowLeft } from 'lucide-react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
    const navigate = useNavigate();
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const [profileData, setProfileData] = useState({
        username: '',
        address: '',
        phone: ''
    });

    // Handle screen resize
    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // 🛡️ THE TRUTH FETCH
    const fetchFreshData = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return navigate('/login');

            const res = await axios.get('https://bhavyams-vendorhub-backend.onrender.com/api/auth/me', {
                headers: { Authorization: `Bearer ${token}` }
            });

            // 🚀 FIX: Prevent null values from breaking inputs
            const data = res.data;
            setProfileData({
                username: data.username || '',
                address: data.address || '',
                phone: data.phone || ''
            });

            localStorage.setItem('user', JSON.stringify(data));
        } catch (err) {
            console.error("Sync Error:", err);
            toast.error("Failed to sync profile");
        } finally {
            setLoading(false);
        }
    }, [navigate]);

    useEffect(() => {
        fetchFreshData();
    }, [fetchFreshData]);

    // 💾 THE SAVE LOGIC
    const handleSave = async () => {
        // Simple Validation
        if (!profileData.username.trim()) return toast.error("Name cannot be empty");
        
        try {
            const token = localStorage.getItem('token');
            const res = await axios.put('https://bhavyams-vendorhub-backend.onrender.com/api/auth/update-profile', profileData, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data.user) {
                localStorage.setItem('user', JSON.stringify(res.data.user));
                setProfileData({
                    username: res.data.user.username || '',
                    address: res.data.user.address || '',
                    phone: res.data.user.phone || ''
                });
                setIsEditing(false);
                toast.success("Profile updated successfully!");
            }
        } catch (err) {
            console.error("Save Error:", err);
            toast.error(err.response?.data?.message || "Update failed");
        }
    };

    if (loading) return <div style={styles.loader}>Syncing Profile...</div>;

    return (
        <div style={{...styles.container, padding: isMobile ? '15px' : '40px 20px'}}>
            <div style={{...styles.profileCard, padding: isMobile ? '25px 20px' : '40px'}}>
                <button onClick={() => navigate(-1)} style={styles.backBtn}>
                    <ArrowLeft size={18}/> {isMobile ? "" : "Back"}
                </button>

                <div style={styles.header}>
                    <h2 style={{fontSize: isMobile ? '20px' : '24px', margin: 0}}>My Account</h2>
                    <button 
                        onClick={() => {
                            if(isEditing) fetchFreshData(); // Revert on cancel
                            setIsEditing(!isEditing);
                        }} 
                        style={styles.editBtn}
                    >
                        {isEditing ? "Cancel" : <><Edit2 size={16}/> Edit</>}
                    </button>
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

                {/* ADDRESS FIELD */}
                <div style={styles.field}>
                    <div style={styles.iconBox}><MapPin size={20} color="#2874f0"/></div>
                    <div style={{flex: 1}}>
                        <label style={styles.label}>Shipping Address</label>
                        <textarea 
                            disabled={!isEditing}
                            value={profileData.address}
                            onChange={(e) => setProfileData({...profileData, address: e.target.value})}
                            style={isEditing ? { ...styles.inputActive, height: '100px', resize: 'none' } : styles.input}
                            placeholder="Enter full address"
                        />
                    </div>
                </div>

                {isEditing && (
                    <button onClick={handleSave} style={styles.saveBtn}>
                        <Save size={18} style={{marginRight: '8px'}}/> Save Profile
                    </button>
                )}
            </div>
        </div>
    );
};

const styles = {
    container: { display: 'flex', justifyContent: 'center', background: '#f1f3f6', minHeight: '100vh' },
    profileCard: { background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '500px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', alignSelf: 'flex-start', marginTop: '20px' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '35px' },
    backBtn: { border: 'none', background: 'none', color: '#64748b', cursor: 'pointer', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '14px', fontWeight: '600' },
    field: { display: 'flex', alignItems: 'flex-start', gap: '15px', marginBottom: '25px' },
    iconBox: { padding: '10px', background: '#f0f7ff', borderRadius: '10px' },
    label: { display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '4px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' },
    input: { border: 'none', background: 'none', width: '100%', fontSize: '16px', color: '#1e293b', outline: 'none', padding: '5px 0' },
    inputActive: { border: '1px solid #2874f0', borderRadius: '8px', padding: '12px', width: '100%', fontSize: '15px', background: '#f8fafc', boxSizing: 'border-box' },
    editBtn: { background: '#f0f7ff', color: '#2874f0', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' },
    saveBtn: { background: '#2874f0', color: '#fff', border: 'none', width: '100%', padding: '15px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center', boxShadow: '0 4px 10px rgba(40, 116, 240, 0.3)' },
    loader: { textAlign: 'center', padding: '100px', color: '#2874f0', fontWeight: 'bold' }
};

export default Profile;