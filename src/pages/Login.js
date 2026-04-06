import React, { useState } from 'react';
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
    const navigate = useNavigate();

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
            <div style={styles.splitCard}>
                {/* 🟦 LEFT SIDE: BRANDING */}
                <div style={styles.sidebar}>
                    <div style={styles.sidebarContent}>
                        <h2 style={styles.sideTitle}>Login</h2>
                        <div style={styles.sideSub}>Get access to your Orders, Wishlist and Recommendations</div>
                    </div>
                    <ShoppingBag size={120} style={styles.sideIcon} />
                </div>

                {/* ⚪ RIGHT SIDE: FORM */}
                <div style={styles.formContainer}>
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

                        {/* ROLE SELECTOR */}
                        <div style={styles.roleGroup}>
                            <Users size={16} color="#2874f0"/>
                            <select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)} style={styles.select}>
                                <option value="customer">Login as Customer</option>
                                <option value="vendor">Login as Vendor</option>
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
    formContainer: { width: '65%', padding: '50px 60px', position: 'relative' },
    form: { display: 'flex', flexDirection: 'column', gap: '25px' },
    
    inputBox: { display: 'flex', alignItems: 'center', gap: '15px', borderBottom: '1px solid #e0e0e0', padding: '10px 0' },
    input: { border: 'none', width: '100%', outline: 'none', fontSize: '16px', color: '#212121' },
    
    roleGroup: { display: 'flex', alignItems: 'center', gap: '10px', background: '#f5faff', padding: '10px 15px', borderRadius: '4px', border: '1px solid #e0e0e0' },
    select: { border: 'none', width: '100%', outline: 'none', fontSize: '14px', color: '#2874f0', fontWeight: 'bold', cursor: 'pointer', background: 'transparent' },
    
    smallLink: { fontSize: '12px', color: '#2874f0', textDecoration: 'none', fontWeight: '500' },
    termsText: { fontSize: '12px', color: '#878787', lineHeight: '1.4' },
    
    primaryBtn: { background: '#fb641b', color: '#fff', border: 'none', padding: '15px', fontWeight: 'bold', borderRadius: '2px', cursor: 'pointer', fontSize: '15px', boxShadow: '0 1px 2px 0 rgba(0,0,0,.2)' },

    divider: { margin: '25px 0', textAlign: 'center', position: 'relative', borderBottom: '1px solid #f0f0f0', lineHeight: '0.1em' },
    googleWrapper: { display: 'flex', justifyContent: 'center' },

    footerLink: { marginTop: '50px', textAlign: 'center', fontSize: '14px', color: '#2874f0', fontWeight: '500' },
    linkBold: { fontWeight: 'bold', textDecoration: 'none', color: '#2874f0' }
};

export default Login;