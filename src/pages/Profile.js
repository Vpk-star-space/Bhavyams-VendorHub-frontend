import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { User, MapPin, Phone, Save, Edit2, ArrowLeft } from 'lucide-react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
    const navigate = useNavigate();
    
    // 1. Initial State is empty (don't trust localStorage yet)
    const [isEditing, setIsEditing] = useState(false);
    const [profileData, setProfileData] = useState({
        username: '',
        address: '',
        phone: ''
    });

    // 2. 🛡️ THE TRUTH FETCH: Get data directly from Database
    const fetchFreshData = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return navigate('/login');

            const res = await axios.get('https://bhavyams-vendorhub-backend.onrender.com/api/auth/me', {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Set the data from PostgreSQL directly into the inputs
            setProfileData({
                username: res.data.username || '',
                address: res.data.address || '',
                phone: res.data.phone || ''
            });

            // Update LocalStorage so the rest of the app knows the truth
            localStorage.setItem('user', JSON.stringify(res.data));
            console.log("✅ Profile Synced with DB:", res.data);
        } catch (err) {
            console.error("Sync Error:", err);
            toast.error("Failed to load data from Server");
        }
    }, [navigate]);

    // Run fetch on page load
    useEffect(() => {
        fetchFreshData();
    }, [fetchFreshData]);

    // 3. 💾 THE SAVE LOGIC
    const handleSave = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.put('https://bhavyams-vendorhub-backend.onrender.com/api/auth/update-profile', profileData, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data.user) {
                // Force Update LocalStorage
                localStorage.setItem('user', JSON.stringify(res.data.user));
                
                // Refresh local inputs
                setProfileData({
                    username: res.data.user.username,
                    address: res.data.user.address || '',
                    phone: res.data.user.phone || ''
                });

                setIsEditing(false);
                toast.success("Saved Successfully!");
                
                // 🔄 FINAL SECURE STEP: Re-fetch just to be sure
                fetchFreshData();
            }
        } catch (err) {
            console.error("Save Error:", err);
            toast.error("Update failed on Server");
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.profileCard}>
                <button onClick={() => navigate(-1)} style={styles.backBtn}><ArrowLeft size={18}/> Back</button>
                <div style={styles.header}>
                    <h2 style={{margin: 0}}>Profile Settings</h2>
                    <button onClick={() => setIsEditing(!isEditing)} style={styles.editBtn}>
                        {isEditing ? "Cancel" : <><Edit2 size={16}/> Edit</>}
                    </button>
                </div>

                <div style={styles.field}>
                    <User size={20} color="#64748b"/>
                    <div style={{flex: 1}}>
                        <label style={styles.label}>Name</label>
                        <input 
                            disabled={!isEditing}
                            value={profileData.username}
                            onChange={(e) => setProfileData({...profileData, username: e.target.value})}
                            style={isEditing ? styles.inputActive : styles.input}
                        />
                    </div>
                </div>

                <div style={styles.field}>
                    <MapPin size={20} color="#64748b"/>
                    <div style={{flex: 1}}>
                        <label style={styles.label}>Address</label>
                        <textarea 
                            disabled={!isEditing}
                            placeholder="Enter Address"
                            value={profileData.address}
                            onChange={(e) => setProfileData({...profileData, address: e.target.value})}
                            style={isEditing ? { ...styles.inputActive, height: '80px' } : styles.input}
                        />
                    </div>
                </div>

                <div style={styles.field}>
                    <Phone size={20} color="#64748b"/>
                    <div style={{flex: 1}}>
                        <label style={styles.label}>Phone</label>
                        <input 
                            disabled={!isEditing}
                            value={profileData.phone}
                            onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                            style={isEditing ? styles.inputActive : styles.input}
                        />
                    </div>
                </div>

                {isEditing && (
                    <button onClick={handleSave} style={styles.saveBtn}>
                        <Save size={18} style={{marginRight: '8px'}}/> Save Changes
                    </button>
                )}
            </div>
        </div>
    );
};

const styles = {
    container: { padding: '40px 20px', display: 'flex', justifyContent: 'center', background: '#f8fafc', minHeight: '100vh' },
    profileCard: { background: '#fff', padding: '40px', borderRadius: '24px', width: '100%', maxWidth: '500px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' },
    backBtn: { border: 'none', background: 'none', color: '#64748b', cursor: 'pointer', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '5px' },
    field: { display: 'flex', alignItems: 'flex-start', gap: '15px', marginBottom: '25px' },
    label: { display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '5px', fontWeight: 'bold' },
    input: { border: 'none', background: 'none', width: '100%', fontSize: '16px', color: '#1e293b', outline: 'none' },
    inputActive: { border: '1px solid #3b82f6', borderRadius: '8px', padding: '10px', width: '100%', fontSize: '16px', background: '#f8fafc' },
    editBtn: { background: '#eff6ff', color: '#3b82f6', border: 'none', padding: '8px 16px', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' },
    saveBtn: { background: '#3b82f6', color: '#fff', border: 'none', width: '100%', padding: '14px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center' }
};

export default Profile;