import React, { useState, useContext } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';

const Welcome = () => {
    const navigate = useNavigate();
    const { language, setLanguage,  location } = useContext(AppContext);

    const [step, setStep] = useState(1);
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [name, setName] = useState(''); 
    const [isFetchingAddress, setIsFetchingAddress] = useState(false);

    const handleLanguageSelect = (lang) => {
        setLanguage(lang);
        setStep(2); 
    };

    const handleGoogleSuccess = async (credentialResponse) => {
        try {
            const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000/api';
            
            const res = await axios.post(`${BACKEND_URL}/auth/google-login`, {
                idToken: credentialResponse.credential,
                lat: location?.lat || 0,
                lng: location?.lng || 0,
                language: language,
                role: 'customer'
            });

            const { token, user } = res.data;
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

            if (user.phone && user.phone !== "0000000000") {
                navigate('/'); 
            } else {
                setName(user.username || '');
                setStep(3); 
            }
        } catch (error) {
            console.error("Google Auth Failed", error);
            alert("Login Failed. Please try again.");
        }
    };

    // 🟢 SMART ADDRESS CLEANER
    const fetchAddressFromGPS = () => {
        if (!location?.lat || !location?.lng) {
            alert(language === 'en' ? "Please enable GPS permissions first." : "దయచేసి ముందుగా GPS అనుమతులను ఆన్ చేయండి.");
            return;
        }
        
        setIsFetchingAddress(true);
        axios.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${location.lat}&lon=${location.lng}`)
            .then(res => {
                if (res.data && res.data.address) {
                    // Filter out weird road codes (like MDR047) and build a clean, short address
                    const a = res.data.address;
                    const cleanParts = [];
                    
                    if (a.neighbourhood || a.suburb || a.village) cleanParts.push(a.neighbourhood || a.suburb || a.village);
                    if (a.city || a.town || a.county) cleanParts.push(a.city || a.town || a.county);
                    if (a.state_district) cleanParts.push(a.state_district);
                    if (a.postcode) cleanParts.push(a.postcode);

                    // If it built a clean address, use it. Otherwise fallback to the display name.
                    const finalAddress = cleanParts.length > 0 ? cleanParts.join(', ') : res.data.display_name;
                    setAddress(finalAddress); 
                } else {
                    alert(language === 'en' ? "Could not detect address. Please type it manually." : "చిరునామా కనుగొనబడలేదు. దయచేసి టైప్ చేయండి.");
                }
            })
            .catch(err => console.warn("Could not fetch address", err))
            .finally(() => setIsFetchingAddress(false));
    };

const handleDetailsSubmit = async (e) => {
        e.preventDefault();
        try {
            const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000/api';
            const token = localStorage.getItem('token');
            
            // 1. Send data to your backend sync route
            await axios.put(`${BACKEND_URL}/auth/update-profile`, {
                username: name,
                phone: phone,
                address: address,
                language: language 
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // 2. Manually force the local storage to update instantly
            const userStr = localStorage.getItem('user');
            let userObj = userStr && userStr !== 'undefined' ? JSON.parse(userStr) : {};
            userObj.username = name;
            userObj.phone = phone;
            userObj.address = address;
            userObj.language = language;
            localStorage.setItem('user', JSON.stringify(userObj));
            
            // 3. 🟢 HARD REDIRECT: This instantly breaks the loop and loads Home.js
            window.location.href = '/'; 

        } catch (error) {
            console.error(error);
            alert("Failed to save details. Please check your backend.");
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <h1 style={styles.logo}>
                    <span className="glowing-green-logo">Subhams</span> <span style={{color: '#0f172a'}}>Hub</span>
                </h1>

                {step === 1 && (
                    <div style={styles.stepBox}>
                        <h2 style={{color: '#334155'}}>Choose Your Language</h2>
                        <h3 style={{color: '#64748b', marginTop: 0}}>భాషను ఎంచుకోండి</h3>
                        <div style={{display: 'flex', gap: '15px', marginTop: '20px', width: '100%'}}>
                            <button style={styles.langButton} onClick={() => handleLanguageSelect('te')}>తెలుగు</button>
                            <button style={styles.langButton} onClick={() => handleLanguageSelect('en')}>English</button>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div style={styles.stepBox}>
                        <h2 style={{color: '#334155', marginBottom: '10px'}}>{language === 'en' ? 'Welcome to Subhams Hub' : 'సుభమ్స్ హబ్ కి స్వాగతం'}</h2>
                        <p style={{color: '#64748b', marginBottom: '20px', fontSize: '14px'}}>
                            {language === 'en' ? 'Sign in securely with Google to continue.' : 'కొనసాగించడానికి Google తో సురక్షితంగా సైన్ ఇన్ చేయండి.'}
                        </p>
                        <GoogleLogin onSuccess={handleGoogleSuccess} onError={() => alert("Google Login Failed")} />
                    </div>
                )}

                {step === 3 && (
                    <div style={styles.stepBox}>
                        <h2 style={{color: '#334155', margin: '0 0 10px 0'}}>{language === 'en' ? 'Complete Your Profile' : 'మీ ప్రొఫైల్‌ను పూర్తి చేయండి'}</h2>
                        <p style={{color: '#64748b', marginBottom: '20px', fontSize: '13px', lineHeight: '1.4'}}>
                            {language === 'en' ? 'Provide details for local delivery.' : 'స్థానిక డెలివరీ కోసం వివరాలను అందించండి.'}
                        </p>
                        
                        <form onSubmit={handleDetailsSubmit} style={{display: 'flex', flexDirection: 'column', gap: '15px', width: '100%'}}>
                            <input style={styles.input} placeholder={language === 'en' ? 'Full Name' : 'పూర్తి పేరు'} value={name} onChange={e => setName(e.target.value)} required />
                            
                            <input style={styles.input} type="tel" placeholder={language === 'en' ? 'Phone Number (WhatsApp)' : 'ఫోన్ నంబర్'} value={phone} onChange={e => setPhone(e.target.value)} required />
                            
                            {/* 🟢 SMART ADDRESS BOX WITH USER PROMPT */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', background: '#f8fafc', padding: '15px', borderRadius: '12px', border: '1px dashed #94a3b8' }}>
                                <button type="button" onClick={fetchAddressFromGPS} style={styles.gpsBtn} disabled={isFetchingAddress}>
                                    {isFetchingAddress ? '📍 Locating...' : (language === 'en' ? '📍 Auto-Detect My Location' : '📍 నా స్థానాన్ని గుర్తించు')}
                                </button>
                                
                                {address && (
                                    <p style={{fontSize: '12px', color: '#059669', fontWeight: 'bold', margin: '5px 0 0 0', textAlign: 'left'}}>
                                        {language === 'en' ? '✨ Is this correct? If not, edit it below to be exact:' : '✨ ఇది సరైనదేనా? కాకపోతే, క్రింద సరిదిద్దండి:'}
                                    </p>
                                )}

                                <textarea 
                                    style={{...styles.input, height: '80px', resize: 'none', width: '100%', boxSizing: 'border-box', border: '1px solid #cbd5e1', background: 'white'}} 
                                    placeholder={language === 'en' ? 'e.g., Door No, Street, Village, Pincode' : 'ఉదా: ఇంటి నంబర్, వీధి, గ్రామం, పిన్‌కోడ్'}
                                    value={address} 
                                    onChange={e => setAddress(e.target.value)} 
                                    required 
                                />
                            </div>

                            <button type="submit" style={styles.submitBtn}>
                                {language === 'en' ? 'Save & Open App 🚀' : 'సేవ్ చేసి కొనసాగించండి 🚀'}
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
};

const styles = {
    container: { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)', padding: '20px' },
    card: { background: 'white', padding: '40px 30px', borderRadius: '24px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center', border: '1px solid #f1f5f9' },
    logo: { fontSize: '32px', fontWeight: '900', margin: '0 0 30px 0', letterSpacing: '-0.5px' },
    stepBox: { display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', textAlign: 'center', animation: 'fadeIn 0.4s ease' },
    langButton: { flex: 1, padding: '15px 0', fontSize: '16px', fontWeight: 'bold', color: 'white', background: 'linear-gradient(90deg, #2874f0 0%, #3b82f6 100%)', border: 'none', borderRadius: '12px', cursor: 'pointer', boxShadow: '0 4px 10px rgba(40,116,240,0.3)' },
    input: { padding: '15px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '15px', width: '100%', boxSizing: 'border-box', outline: 'none' },
    gpsBtn: { padding: '12px', borderRadius: '8px', border: '1px solid #bfdbfe', background: '#eff6ff', color: '#2563eb', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', transition: '0.2s' },
    submitBtn: { padding: '16px', borderRadius: '12px', border: 'none', background: 'linear-gradient(90deg, #10b981 0%, #059669 100%)', color: 'white', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer', boxShadow: '0 4px 10px rgba(16,185,129,0.3)', marginTop: '10px' }
};

export default Welcome;