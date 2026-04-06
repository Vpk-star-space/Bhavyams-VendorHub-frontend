import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { Mail,  Lock, ArrowLeft, RotateCcw } from 'lucide-react';

const ForgotPassword = () => {
    const [step, setStep] = useState(1); // 1: Email, 2: OTP & New Password
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    // 📧 Step 1: Send OTP to Gmail
    const handleSendOTP = async () => {
        if (!email) return toast.warning("Please enter your email");
        setLoading(true);
        try {
            await axios.post('https://bhavyams-vendorhub-backend.onrender.com/api/auth/forgot-password', { email });
            toast.success("OTP sent to your email!");
            setStep(2); // Move to OTP entry screen
        } catch (err) {
            toast.error(err.response?.data?.message || "User not found");
        } finally {
            setLoading(false);
        }
    };

    // 🔐 Step 2: Verify OTP and Update Password
    const handleReset = async () => {
        if (!otp || !newPassword) return toast.warning("Please fill in both fields");
        setLoading(true);
        try {
            await axios.post('https://bhavyams-vendorhub-backend.onrender.com/api/auth/reset-password', { 
                email, 
                otp, 
                newPassword 
            });
            toast.success("Password updated! Redirecting to login...");
            setTimeout(() => navigate('/login'), 2000);
        } catch (err) {
            toast.error(err.response?.data?.message || "Invalid OTP or expired");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                {/* Visual Icon */}
                <div style={styles.iconCircle}>
                    {step === 1 ? <Mail size={28} color="#3b82f6"/> : <Lock size={28} color="#3b82f6"/>}
                </div>
                
                <h2 style={styles.title}>{step === 1 ? "Forgot Password" : "Reset Password"}</h2>
                <p style={styles.subtitle}>
                    {step === 1 
                        ? "Enter your registered email to receive an OTP code." 
                        : `Enter the 6-digit code sent to ${email}`}
                </p>

                {step === 1 ? (
                    /* --- STEP 1: EMAIL ENTRY --- */
                    <div style={styles.inputGroup}>
                        <input 
                            type="email" 
                            placeholder="Email Address" 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)} 
                            style={styles.input}
                        />
                        <button onClick={handleSendOTP} style={styles.btn} disabled={loading}>
                            {loading ? "Sending..." : "Send OTP"}
                        </button>
                    </div>
                ) : (
                    /* --- STEP 2: OTP & NEW PASSWORD --- */
                    <div style={styles.inputGroup}>
                        <input 
                            type="text" 
                            placeholder="Enter 6-Digit OTP" 
                            value={otp} // 🛡️ Fixed: This box will be for the code
                            onChange={(e) => setOtp(e.target.value)} 
                            style={styles.input}
                            maxLength={6}
                        />
                        <input 
                            type="password" 
                            placeholder="Enter New Password" 
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)} 
                            style={styles.input}
                        />
                        <button onClick={handleReset} style={styles.btn} disabled={loading}>
                            {loading ? "Updating..." : "Update Password"}
                        </button>

                        {/* 🔄 RESEND OTP */}
                        <div onClick={handleSendOTP} style={styles.resendArea}>
                            <RotateCcw size={14} />
                            <span>Didn't get the code? Resend OTP</span>
                        </div>
                    </div>
                )}

                <div onClick={() => navigate('/login')} style={styles.backBtn}>
                    <ArrowLeft size={16} /> Back to Login
                </div>
            </div>
        </div>
    );
};

const styles = {
    container: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f8fafc', padding: '20px' },
    card: { background: '#fff', padding: '40px', borderRadius: '24px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', width: '100%', maxWidth: '400px', textAlign: 'center' },
    iconCircle: { background: '#eff6ff', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '0 auto 20px' },
    title: { fontSize: '24px', fontWeight: 'bold', color: '#1e293b', marginBottom: '10px' },
    subtitle: { fontSize: '14px', color: '#64748b', marginBottom: '25px', lineHeight: '1.5' },
    inputGroup: { display: 'flex', flexDirection: 'column', gap: '12px' },
    input: { width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '15px', outline: 'none', boxSizing: 'border-box' },
    btn: { width: '100%', padding: '14px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', marginTop: '5px' },
    resendArea: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#3b82f6', fontSize: '13px', cursor: 'pointer', marginTop: '15px', fontWeight: '600' },
    backBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#64748b', fontSize: '14px', cursor: 'pointer', marginTop: '25px' }
};

export default ForgotPassword;