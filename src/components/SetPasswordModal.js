import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Lock, ShieldCheck } from 'lucide-react';

const SetPasswordModal = ({ user, onClose }) => {
    const [newPassword, setNewPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSetPassword = async () => {
        if (newPassword.length < 6) {
            return toast.warning("Password must be at least 6 characters");
        }

        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            await axios.post('https://bhavyams-vendorhub-backend.onrender.com/api/auth/set-initial-password', 
                { password: newPassword },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            
            // 🛡️ Update local storage so it doesn't pop up again
            const updatedUser = { ...user, needsPassword: false };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            
            toast.success("Security updated! Your password is set.");
            onClose(); // Close the modal
        } catch (err) {
            toast.error("Failed to set password. Try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.modalOverlay}>
            <div style={styles.modalCard}>
                <div style={styles.iconBox}><ShieldCheck size={40} color="#3b82f6"/></div>
                <h3 style={styles.title}>Secure Your Account</h3>
                <p style={styles.text}>Since you joined via Google, please set a login password for Bhavyams Hub.</p>
                
                <div style={styles.inputGroup}>
                    <Lock size={18} color="#64748b"/>
                    <input 
                        type="password" 
                        placeholder="Create new password" 
                        onChange={(e) => setNewPassword(e.target.value)}
                        style={styles.input}
                    />
                </div>

                <button 
                    onClick={handleSetPassword} 
                    style={styles.btn} 
                    disabled={loading}
                >
                    {loading ? "Saving..." : "Set Password"}
                </button>
            </div>
        </div>
    );
};

const styles = {
    modalOverlay: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(15, 23, 42, 0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000, backdropFilter: 'blur(4px)' },
    modalCard: { background: '#fff', padding: '40px', borderRadius: '24px', width: '100%', maxWidth: '400px', textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' },
    iconBox: { marginBottom: '20px' },
    title: { fontSize: '22px', fontWeight: 'bold', color: '#1e293b', marginBottom: '10px' },
    text: { color: '#64748b', fontSize: '14px', marginBottom: '25px', lineHeight: '1.5' },
    inputGroup: { display: 'flex', alignItems: 'center', gap: '12px', background: '#f8fafc', padding: '12px 16px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '20px' },
    input: { border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '15px' },
    btn: { width: '100%', background: '#3b82f6', color: '#fff', border: 'none', padding: '14px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', transition: '0.3s' }
};

export default SetPasswordModal;