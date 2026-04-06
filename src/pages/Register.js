import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { User, Mail, Lock, ShieldCheck, RotateCcw, ArrowLeft, ShoppingBag } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';

const Register = () => {
    const [formData, setFormData] = useState({ username: '', email: '', password: '', role: 'customer' });
    const [otp, setOtp] = useState('');
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const navigate = useNavigate();

    // Responsive listener
    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleGoogleSuccess = async (credentialResponse) => {
        try {
            const res = await axios.post('https://bhavyams-vendorhub-backend.onrender.com/api/auth/google-login', {
                idToken: credentialResponse.credential,
                role: formData.role // Pass the selected role to Google login
            });
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('user', JSON.stringify(res.data.user));
            toast.success("Welcome to Bhavyams Hub!");
            navigate('/dashboard'); 
        } catch (err) {
            toast.error("Google Registration Failed");
        }
    };

    const handleSendOTP = async (e) => {
        if(e) e.preventDefault();
        setLoading(true);
        try {
            await axios.post('https://bhavyams-vendorhub-backend.onrender.com/api/auth/send-otp', { email: formData.email });
            toast.success("OTP Sent successfully!");
            setStep(2);
        } catch (err) {
            toast.error("Failed to send OTP. Check your email.");
        } finally {
            setLoading(false);
        }
    };

    const handleFinalRegister = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await axios.post('https://bhavyams-vendorhub-backend.onrender.com/api/auth/register-with-otp', { ...formData, otp });
            toast.success("Registration Successful! Please Login.");
            navigate('/login');
        } catch (err) {
            toast.error(err.response?.data?.message || "Invalid OTP");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.page}>
            <div style={{...styles.splitCard, width: isMobile ? '95%' : '850px', flexDirection: isMobile ? 'column' : 'row'}}>
                
                {/* 🟦 LEFT SIDE: BRANDING (Hidden on very small mobile if needed, or shrunk) */}
                {!isMobile && (
                    <div style={styles.sidebar}>
                        <div style={styles.sidebarContent}>
                            <h2 style={styles.sideTitle}>Looks like you're new here!</h2>
                            <div style={styles.sideSub}>Sign up with your details to get started with Bhavyams VendorHub</div>
                        </div>
                        <ShoppingBag size={100} style={styles.sideIcon} />
                    </div>
                )}

                {/* ⚪ RIGHT SIDE: FORM */}
                <div style={{...styles.formContainer, width: isMobile ? '100%' : '65%', padding: isMobile ? '30px 20px' : '40px 60px'}}>
                    <h2 style={{...styles.formTitle, display: 'block'}}>{step === 1 ? "Create Account" : "Verify Email"}</h2>
                    
                    {step === 1 ? (
                        <>
                            <form onSubmit={handleSendOTP} style={styles.form}>
                                <div style={styles.inputBox}>
                                    <User size={18} color="#878787"/>
                                    <input placeholder="Enter Username" style={styles.input} onChange={(e)=>setFormData({...formData, username: e.target.value})} required />
                                </div>
                                <div style={styles.inputBox}>
                                    <Mail size={18} color="#878787"/>
                                    <input type="email" placeholder="Enter Email Address" style={styles.input} onChange={(e)=>setFormData({...formData, email: e.target.value})} required />
                                </div>
                                <div style={styles.inputBox}>
                                    <Lock size={18} color="#878787"/>
                                    <input type="password" placeholder="Set Password" style={styles.input} onChange={(e)=>setFormData({...formData, password: e.target.value})} required />
                                </div>
                                
                              {/* ROLE SELECTION BOX */}
<div style={{...styles.inputBox, border: '1px solid #2874f0', borderRadius: '4px', padding: '10px'}}>
    <ShieldCheck size={18} color="#2874f0"/>
    <select 
        style={styles.select} 
        value={formData.role} // 🚀 Ensure this matches state
        name="role"
        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
    >
        <option value="customer">Register as Customer</option>
        <option value="vendor">Register as Vendor (Seller)</option>
    </select>
</div>
                                <div style={styles.termsText}>
                                    By continuing, you agree to Bhavyams's <span>Terms of Use</span> and <span>Privacy Policy</span>.
                                </div>

                                <button type="submit" style={styles.primaryBtn} disabled={loading}>
                                    {loading ? "SENDING CODE..." : "CONTINUE"}
                                </button>
                            </form>

                            <div style={styles.divider}><span>OR</span></div>
                            
                            <div style={styles.googleWrapper}>
                                <GoogleLogin 
                                    onSuccess={handleGoogleSuccess} 
                                    text="signup_with" 
                                    shape="rectangular" 
                                    width={isMobile ? "280px" : "300px"}
                                />
                            </div>
                        </>
                    ) : (
                        <form onSubmit={handleFinalRegister} style={styles.form}>
                            <div style={styles.otpInfo}>Enter the 6-digit code sent to <br/><b>{formData.email}</b></div>
                            
                            <input 
                                placeholder="0 0 0 0 0 0" 
                                value={otp} 
                                onChange={(e)=>setOtp(e.target.value)} 
                                style={{...styles.otpInput, fontSize: isMobile ? '18px' : '24px'}} 
                                maxLength="6" 
                                required 
                            />
                            
                            <button type="submit" style={styles.successBtn} disabled={loading}>
                                {loading ? "VERIFYING..." : "VERIFY & REGISTER"}
                            </button>

                            <div onClick={handleSendOTP} style={styles.resendBtn}>
                                <RotateCcw size={14}/> Resend Code
                            </div>
                            
                            <button type="button" onClick={()=>setStep(1)} style={styles.backLink}>
                                <ArrowLeft size={14}/> Change Details
                            </button>
                        </form>
                    )}

                    <div style={styles.footerLink}>
                        Existing User? <Link to="/login" style={styles.linkBold}>Log in</Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

const styles = {
    page: { background: '#f1f3f6', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px' },
    splitCard: { background: '#fff', display: 'flex', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', minHeight: '550px' },
    
    sidebar: { width: '35%', background: '#2874f0', padding: '40px 30px', color: '#fff', display: 'flex', flexDirection: 'column', position: 'relative' },
    sidebarContent: { zIndex: 2 },
    sideTitle: { fontSize: '24px', fontWeight: 'bold', marginBottom: '15px' },
    sideSub: { fontSize: '16px', lineHeight: '1.5', color: '#dbdbdb' },
    sideIcon: { position: 'absolute', bottom: '20px', right: '10px', opacity: 0.15 },

    formContainer: { position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'center' },
    formTitle: { fontSize: '22px', fontWeight: 'bold', color: '#212121', marginBottom: '25px' },
    form: { display: 'flex', flexDirection: 'column', gap: '18px' },
    
    inputBox: { display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid #e0e0e0', padding: '8px 0' },
    input: { border: 'none', width: '100%', outline: 'none', fontSize: '15px', background: 'transparent' },
    select: { border: 'none', width: '100%', outline: 'none', fontSize: '14px', color: '#2874f0', fontWeight: 'bold', background: 'transparent' },
    
    termsText: { fontSize: '11px', color: '#878787' },
    primaryBtn: { background: '#fb641b', color: '#fff', border: 'none', padding: '14px', fontWeight: 'bold', borderRadius: '4px', cursor: 'pointer', fontSize: '14px' },
    successBtn: { background: '#26a541', color: '#fff', border: 'none', padding: '14px', fontWeight: 'bold', borderRadius: '4px', cursor: 'pointer' },

    divider: { margin: '15px 0', textAlign: 'center', borderBottom: '1px solid #f0f0f0', lineHeight: '0.1em' },
    googleWrapper: { display: 'flex', justifyContent: 'center' },

    otpInput: { border: '1px solid #2874f0', padding: '12px', borderRadius: '4px', textAlign: 'center', letterSpacing: '6px', fontWeight: 'bold', outline: 'none' },
    resendBtn: { textAlign: 'center', color: '#2874f0', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' },
    backLink: { background: 'none', border: 'none', color: '#878787', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', marginTop: '10px' },

    footerLink: { marginTop: '30px', textAlign: 'center', fontSize: '14px' },
    linkBold: { color: '#2874f0', fontWeight: 'bold', textDecoration: 'none' }
};

export default Register;