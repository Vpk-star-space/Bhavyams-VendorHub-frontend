import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Mail, Lock, Users, ShoppingBag } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [selectedRole, setSelectedRole] = useState('customer'); 
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const navigate = useNavigate();

    // Responsive listener for mobile design
    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await axios.post('https://bhavyams-vendorhub-backend.onrender.com/api/auth/login', { email, password });
            localStorage.setItem('token', res.data.accessToken);
            localStorage.setItem('user', JSON.stringify(res.data.user));
            toast.success("Welcome back to Bhavyams!");
            navigate('/dashboard');
        } catch (err) {
            toast.error(err.response?.data?.message || "Login failed");
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSuccess = async (credentialResponse) => {
        try {
            const res = await axios.post('https://bhavyams-vendorhub-backend.onrender.com/api/auth/google-login', {
                idToken: credentialResponse.credential,
                role: selectedRole 
            });
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('user', JSON.stringify(res.data.user));
            toast.success(`Logged in as ${res.data.user.role}`);
            navigate('/dashboard');
        } catch (err) {
            toast.error("Google Login Failed");
        }
    };

    return (
        <div style={styles.page}>
            <div style={{...styles.splitCard, width: isMobile ? '95%' : '850px', flexDirection: isMobile ? 'column' : 'row'}}>
                
                {/* 🟦 LEFT SIDE: BRANDING (Hidden on Mobile) */}
                {!isMobile && (
                    <div style={styles.sidebar}>
                        <div style={styles.sidebarContent}>
                            <h2 style={styles.sideTitle}>Login</h2>
                            <div style={styles.sideSub}>Get access to your Orders, Wishlist and Recommendations</div>
                        </div>
                        <ShoppingBag size={120} style={styles.sideIcon} />
                    </div>
                )}

                {/* ⚪ RIGHT SIDE: FORM */}
                <div style={{...styles.formContainer, width: isMobile ? '100%' : '65%', padding: isMobile ? '30px 20px' : '50px 60px'}}>
                    <h2 style={{...styles.formTitle, display: isMobile ? 'block' : 'none'}}>Login to Bhavyams</h2>
                    
                    <form onSubmit={handleLogin} style={styles.form}>
                        <div style={styles.inputBox}>
                            <Mail size={18} color="#878787"/>
                            <input 
                                type="email" 
                                placeholder="Enter Email" 
                                style={styles.input} 
                                onChange={(e) => setEmail(e.target.value)} 
                                required 
                            />
                        </div>

                        <div style={styles.inputBox}>
                            <Lock size={18} color="#878787"/>
                            <input 
                                type="password" 
                                placeholder="Enter Password" 
                                style={styles.input} 
                                onChange={(e) => setPassword(e.target.value)} 
                                required 
                            />
                        </div>

                        <div style={{textAlign: 'right', marginTop: '-10px'}}>
                            <Link to="/forgot-password" style={styles.smallLink}>Forgot Password?</Link>
                        </div>

                        {/* IMPROVED ROLE SELECTOR */}
                        <div style={{...styles.roleGroup, border: '1px solid #2874f0'}}>
                            <Users size={16} color="#2874f0"/>
                            <select 
                                value={selectedRole} 
                                onChange={(e) => setSelectedRole(e.target.value)} 
                                style={styles.select}
                            >
                                <option value="customer">Login as Customer</option>
                                <option value="vendor">Login as Vendor (Seller)</option>
                            </select>
                        </div>

                        <div style={styles.termsText}>
                            By continuing, you agree to Bhavyams's <span>Terms of Use</span> and <span>Privacy Policy</span>.
                        </div>

                        <button type="submit" style={styles.primaryBtn} disabled={loading}>
                            {loading ? "AUTHENTICATING..." : "LOGIN"}
                        </button>
                    </form>

                    <div style={styles.divider}><span>OR</span></div>

                    <div style={styles.googleWrapper}>
                        <GoogleLogin 
                            onSuccess={handleGoogleSuccess} 
                            onError={() => toast.error("Google Login Failed")}
                            text="signin_with"
                            shape="rectangular"
                            width={isMobile ? "280px" : "320px"}
                        />
                    </div>

                    <div style={styles.footerLink}>
                        New to Bhavyams? <Link to="/register" style={styles.linkBold}>Create an account</Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

const styles = {
    page: { background: '#f1f3f6', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px' },
    splitCard: { background: '#fff', display: 'flex', borderRadius: '4px', overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', minHeight: '500px' },
    
    sidebar: { width: '35%', background: '#2874f0', padding: '40px 33px', color: '#fff', display: 'flex', flexDirection: 'column', position: 'relative' },
    sidebarContent: { zIndex: 2 },
    sideTitle: { fontSize: '28px', fontWeight: 'bold', margin: '0 0 15px 0' },
    sideSub: { fontSize: '18px', lineHeight: '1.5', color: '#dbdbdb' },
    sideIcon: { position: 'absolute', bottom: '40px', left: '50%', transform: 'translateX(-50%)', opacity: 0.2 },

    formContainer: { position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'center' },
    formTitle: { fontSize: '20px', fontWeight: 'bold', color: '#212121', marginBottom: '25px', textAlign: 'center' },
    form: { display: 'flex', flexDirection: 'column', gap: '22px' },
    
    inputBox: { display: 'flex', alignItems: 'center', gap: '15px', borderBottom: '1px solid #e0e0e0', padding: '10px 0' },
    input: { border: 'none', width: '100%', outline: 'none', fontSize: '16px', color: '#212121', background: 'transparent' },
    
    roleGroup: { display: 'flex', alignItems: 'center', gap: '10px', background: '#f5faff', padding: '10px 12px', borderRadius: '4px' },
    select: { border: 'none', width: '100%', outline: 'none', fontSize: '14px', color: '#2874f0', fontWeight: 'bold', cursor: 'pointer', background: 'transparent' },
    
    smallLink: { fontSize: '12px', color: '#2874f0', textDecoration: 'none', fontWeight: '500' },
    termsText: { fontSize: '11px', color: '#878787', lineHeight: '1.4' },
    primaryBtn: { background: '#fb641b', color: '#fff', border: 'none', padding: '15px', fontWeight: 'bold', borderRadius: '2px', cursor: 'pointer', fontSize: '15px' },

    divider: { margin: '20px 0', textAlign: 'center', borderBottom: '1px solid #f0f0f0', lineHeight: '0.1em' },
    googleWrapper: { display: 'flex', justifyContent: 'center' },

    footerLink: { marginTop: '40px', textAlign: 'center', fontSize: '14px', color: '#2874f0' },
    linkBold: { fontWeight: 'bold', textDecoration: 'none', color: '#2874f0' }
};

export default Login;