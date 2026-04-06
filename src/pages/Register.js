import React, { useState } from 'react';
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
    const navigate = useNavigate();

    const handleGoogleSuccess = async (credentialResponse) => {
        try {
            const res = await axios.post('https://bhavyams-vendorhub-backend.onrender.com/api/auth/google-login', {
                idToken: credentialResponse.credential,
                role: formData.role 
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
            <div style={styles.splitCard}>
                {/* 🟦 LEFT SIDE: BRANDING */}
                <div style={styles.sidebar}>
                    <div style={styles.sidebarContent}>
                        <h2 style={styles.sideTitle}>Looks like you're new here!</h2>
                        <div style={styles.sideSub}>Sign up with your details to get started with Bhavyams VendorHub</div>
                    </div>
                    <ShoppingBag size={120} style={styles.sideIcon} />
                </div>

                {/* ⚪ RIGHT SIDE: FORM */}
                <div style={styles.formContainer}>
                    <h2 style={styles.formTitle}>{step === 1 ? "Create Account" : "Verify Email"}</h2>
                    
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
                                <div style={styles.inputBox}>
                                    <ShieldCheck size={18} color="#878787"/>
                                    <select style={styles.select} onChange={(e)=>setFormData({...formData, role: e.target.value})}>
                                        <option value="customer">I am a Customer</option>
                                        <option value="vendor">I am a Vendor</option>
                                    </select>
                                </div>
                                
                                <div style={styles.termsText}>
                                    By continuing, you agree to Bhavyams's <span>Terms of Use</span> and <span>Privacy Policy</span>.
                                </div>

                                <button type="submit" style={styles.primaryBtn} disabled={loading}>
                                    {loading ? "SENDING..." : "CONTINUE"}
                                </button>
                            </form>

                            <div style={styles.divider}><span>OR</span></div>
                            
                            <div style={styles.googleWrapper}>
                                <GoogleLogin onSuccess={handleGoogleSuccess} text="signup_with" shape="rectangular" />
                            </div>
                        </>
                    ) : (
                        <form onSubmit={handleFinalRegister} style={styles.form}>
                            <div style={styles.otpInfo}>Enter the 6-digit code sent to <br/><b>{formData.email}</b></div>
                            
                            <input 
                                placeholder="0 0 0 0 0 0" 
                                value={otp} 
                                onChange={(e)=>setOtp(e.target.value)} 
                                style={styles.otpInput} 
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
                                <ArrowLeft size={14}/> Change Registration Details
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

// 🎨 PROFESSIONAL FLIPKART DESIGN STYLES
const styles = {
    page: { background: '#f1f3f6', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Roboto, Arial, sans-serif' },
    splitCard: { background: '#fff', width: '850px', display: 'flex', borderRadius: '4px', overflow: 'hidden', boxShadow: '0 2px 4px 0 rgba(0,0,0,.2)' },
    
    // LEFT SIDE
    sidebar: { width: '35%', background: '#2874f0', padding: '40px 33px', color: '#fff', display: 'flex', flexDirection: 'column', position: 'relative' },
    sidebarContent: { flex: 1 },
    sideTitle: { fontSize: '28px', fontWeight: 'bold', margin: '0 0 15px 0' },
    sideSub: { fontSize: '18px', lineHeight: '1.5', color: '#dbdbdb' },
    sideIcon: { position: 'absolute', bottom: '40px', left: '50%', transform: 'translateX(-50%)', opacity: 0.2 },

    // RIGHT SIDE
    formContainer: { width: '65%', padding: '40px 60px', position: 'relative' },
    formTitle: { fontSize: '20px', fontWeight: 'bold', color: '#212121', marginBottom: '30px', display: 'none' }, // Title handled by steps
    form: { display: 'flex', flexDirection: 'column', gap: '20px' },
    
    inputBox: { display: 'flex', alignItems: 'center', gap: '15px', borderBottom: '1px solid #e0e0e0', padding: '10px 0' },
    input: { border: 'none', width: '100%', outline: 'none', fontSize: '16px', color: '#212121' },
    select: { border: 'none', width: '100%', outline: 'none', fontSize: '16px', color: '#2874f0', fontWeight: 'bold', cursor: 'pointer', background: '#fff' },
    
    termsText: { fontSize: '12px', color: '#878787', lineHeight: '1.4' },
    primaryBtn: { background: '#fb641b', color: '#fff', border: 'none', padding: '15px', fontWeight: 'bold', borderRadius: '2px', cursor: 'pointer', fontSize: '15px', boxShadow: '0 1px 2px 0 rgba(0,0,0,.2)' },
    successBtn: { background: '#26a541', color: '#fff', border: 'none', padding: '15px', fontWeight: 'bold', borderRadius: '2px', cursor: 'pointer', fontSize: '15px' },

    divider: { margin: '20px 0', textAlign: 'center', position: 'relative', borderBottom: '1px solid #f0f0f0', lineHeight: '0.1em' },
    googleWrapper: { display: 'flex', justifyContent: 'center' },

    otpInfo: { fontSize: '14px', color: '#212121', textAlign: 'center', marginBottom: '10px' },
    otpInput: { border: '1px solid #2874f0', padding: '15px', borderRadius: '4px', textAlign: 'center', fontSize: '24px', letterSpacing: '8px', fontWeight: 'bold', outline: 'none' },
    resendBtn: { textAlign: 'center', color: '#2874f0', fontSize: '14px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' },
    backLink: { background: 'none', border: 'none', color: '#878787', cursor: 'pointer', fontSize: '12px', marginTop: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' },

    footerLink: { marginTop: '40px', textAlign: 'center', fontSize: '14px', color: '#2874f0' },
    linkBold: { fontWeight: 'bold', textDecoration: 'none', color: '#2874f0' }
};

export default Register;