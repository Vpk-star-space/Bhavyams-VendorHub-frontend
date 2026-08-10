import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { Store, ArrowLeft, Upload, CheckCircle, ShieldCheck } from 'lucide-react';

const BusinessRegistration = () => {
    const navigate = useNavigate();
    const {  } = useContext(AppContext);

    const userStr = localStorage.getItem('user');
    const user = userStr && userStr !== 'undefined' ? JSON.parse(userStr) : {};

    const [viewState, setViewState] = useState('loading');
    
    // 🟢 Registration Form State (Now includes shop_type!)
    const [regForm, setRegForm] = useState({
        name: user.username || '',
        phone: user.phone || '',
        businessName: '',
        category: '',
        shop_type: 'Products', // Default selection
        location: user.address || '',
        email: user.email || ''
    });
    
    const [idFront, setIdFront] = useState(null);
    const [idBack, setIdBack] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [successModal, setSuccessModal] = useState(false);

    const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000/api';
    const token = localStorage.getItem('token');

    useEffect(() => {
        const checkShopStatus = async () => {
            try {
                const res = await axios.get(`${BACKEND_URL}/shops/my-shop`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                
                if (res.data.hasShop === false) {
                    setViewState('form');
                    return;
                }

                const { shop } = res.data;
                
                if (shop.is_approved) {
                    // Redirect approved vendors directly to their live profile!
                    navigate(`/shop/${shop.id}`, { replace: true });
                } else {
                    setViewState('pending');
                }
            } catch (err) {
                console.error("Failed to check shop status", err);
                setViewState('form');
            }
        };

        if (token) {
            checkShopStatus();
        } else {
            setViewState('form');
        }
    }, [BACKEND_URL, token, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!idFront || !idBack) return alert("Please upload both Front and Back photos of your ID proof.");

        setSubmitting(true);
        try {
            const formData = new FormData();
            formData.append('name', regForm.name);
            formData.append('phone', regForm.phone);
            formData.append('businessName', regForm.businessName);
            formData.append('products', regForm.category); // Send as products/category depending on your backend
            formData.append('shop_type', regForm.shop_type); // 🟢 Send the selected type to backend
            formData.append('location', regForm.location);
            formData.append('email', regForm.email);
            formData.append('idFront', idFront);
            formData.append('idBack', idBack);

            await axios.post(`${BACKEND_URL}/register-interest`, formData, {
                headers: { 'Authorization': `Bearer ${token}` },
                timeout: 60000 
            });

            setSuccessModal(true);
        } catch (error) {
            let errorMsg = error.response?.data?.message || error.message;
            alert(`❌ REGISTRATION FAILED:\n${errorMsg}`);
        } finally {
            setSubmitting(false);
        }
    };

    if (viewState === 'loading') {
        return <div style={{textAlign: 'center', padding: '100px', fontSize: '18px', fontWeight: 'bold', color: '#334155'}}>Loading Store...</div>;
    }

    if (viewState === 'pending') {
        return (
            <div style={styles.page}>
                <div style={styles.container}>
                    <button onClick={() => navigate('/')} style={styles.backBtn}><ArrowLeft size={18} /> Back to Hub</button>
                    <div style={{...styles.card, textAlign: 'center', marginTop: '40px', padding: '50px 30px'}}>
                        <ShieldCheck size={60} color="#f59e0b" style={{marginBottom: '20px'}} />
                        <h2 style={{margin: '0 0 10px 0', color: '#b45309', fontSize: '24px'}}>Application Under Review</h2>
                        <p style={{color: '#475569', fontSize: '15px', lineHeight: '1.6'}}>
                            Your store is currently pending Master Admin approval. Once approved, your store page will go live automatically!
                        </p>
                        <button onClick={() => navigate('/')} style={{...styles.submitFormBtn, marginTop: '25px', width: 'auto', padding: '12px 30px'}}>Return Home</button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div style={styles.page}>
            <div style={styles.container}>
                <div style={styles.headerBar}>
                    <button onClick={() => navigate('/')} style={styles.backBtn}><ArrowLeft size={18} /> Back to Hub</button>
                    <h2 style={{ margin: 0, color: '#1e3a8a', display: 'flex', alignItems: 'center', gap: '8px' }}><Store size={24} /> Register Your Business</h2>
                </div>

                <div style={styles.card}>
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                        
                        {/* 🟢 SMART BUSINESS TYPE SELECTOR */}
                        <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', padding: '15px', borderRadius: '12px' }}>
                            <label style={{...styles.label, color: '#2563eb', fontSize: '15px', marginBottom: '10px', display: 'block'}}>What type of business are you?</label>
                            <select 
                                style={{...styles.input, border: '2px solid #2563eb', fontWeight: 'bold'}} 
                                value={regForm.shop_type} 
                                onChange={e => setRegForm({...regForm, shop_type: e.target.value})}
                            >
                                <option value="Products">🛒 I Sell Physical Products (Groceries, Clothes, Items)</option>
                                <option value="Services">🛠️ I Provide Services (Catering, Mechanic, Plumbing)</option>
                                <option value="Promotions">📢 I Want to Run Promotions / Advertisements</option>
                            </select>
                        </div>

                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Your Full Name</label>
                            <input type="text" style={styles.input} value={regForm.name} onChange={e => setRegForm({...regForm, name: e.target.value})} required />
                        </div>
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Phone Number (WhatsApp)</label>
                            <input type="tel" style={styles.input} value={regForm.phone} onChange={e => setRegForm({...regForm, phone: e.target.value})} required />
                        </div>
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Business / Shop Name</label>
                            <input type="text" style={styles.input} placeholder="e.g. Sri Subbayamma Caterers" value={regForm.businessName} onChange={e => setRegForm({...regForm, businessName: e.target.value})} required />
                        </div>
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Specific Category (e.g. AC Repair, Vegetables)</label>
                            <input type="text" style={styles.input} placeholder="Type your exact category..." value={regForm.category} onChange={e => setRegForm({...regForm, category: e.target.value})} required />
                        </div>
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Exact Location / Pincode / Area</label>
                            <input type="text" style={styles.input} placeholder="e.g. Konanki, 523260" value={regForm.location} onChange={e => setRegForm({...regForm, location: e.target.value})} required />
                        </div>

                        <div style={styles.uploadGrid}>
                            <div style={styles.uploadBox}>
                                <label style={styles.uploadLabel}><Upload size={16}/> ID Proof (Front)</label>
                                <input type="file" accept="image/*" onChange={e => setIdFront(e.target.files[0])} required style={{fontSize: '12px'}} />
                            </div>
                            <div style={styles.uploadBox}>
                                <label style={styles.uploadLabel}><Upload size={16}/> ID Proof (Back)</label>
                                <input type="file" accept="image/*" onChange={e => setIdBack(e.target.files[0])} required style={{fontSize: '12px'}} />
                            </div>
                        </div>

                        <button type="submit" disabled={submitting} style={styles.submitFormBtn}>
                            {submitting ? "Submitting Securely... ⏳" : "Submit Business for Approval 🚀"}
                        </button>
                    </form>
                </div>
            </div>

            {successModal && (
                <div style={styles.overlay}>
                    <div style={styles.modal}>
                        <CheckCircle size={50} color="#16a34a" style={{marginBottom: '15px'}} />
                        <h2 style={{margin: '0 0 10px 0', color: '#166534'}}>Registration Submitted!</h2>
                        <button onClick={() => window.location.reload()} style={styles.submitFormBtn}>Okay</button>
                    </div>
                </div>
            )}
        </div>
    );
};

const styles = {
    page: { background: '#f8fafc', minHeight: '100vh', padding: '20px', boxSizing: 'border-box', fontFamily: 'Inter, sans-serif' },
    container: { maxWidth: '600px', margin: '0 auto' },
    headerBar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' },
    backBtn: { background: 'white', border: '1px solid #cbd5e1', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold', color: '#475569' },
    card: { background: 'white', padding: '30px', borderRadius: '20px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' },
    inputGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
    label: { fontSize: '13px', fontWeight: 'bold', color: '#334155' },
    input: { padding: '12px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', background: '#ffffff', outline: 'none', width: '100%', boxSizing: 'border-box' },
    uploadGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' },
    uploadBox: { background: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px dashed #cbd5e1', display: 'flex', flexDirection: 'column', gap: '8px' },
    uploadLabel: { fontSize: '12px', fontWeight: 'bold', color: '#475569', display: 'flex', alignItems: 'center', gap: '5px' },
    submitFormBtn: { padding: '14px', borderRadius: '10px', border: 'none', background: '#2874f0', color: 'white', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer', boxShadow: '0 4px 10px rgba(40,116,240,0.3)', width: '100%' },
    overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', zIndex: 1000 },
    modal: { background: 'white', padding: '30px', borderRadius: '20px', textAlign: 'center', maxWidth: '400px', width: '100%', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }
};

export default BusinessRegistration;