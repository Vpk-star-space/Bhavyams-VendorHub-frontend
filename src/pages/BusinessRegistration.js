import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { Store, ArrowLeft, Upload, CheckCircle, ShieldCheck, Lock, AlertCircle, Loader, Info, Home, Package, Wrench, Building, ChevronDown, ChevronUp, Plus, X, ShieldAlert } from 'lucide-react';

const SMART_CATEGORIES = [
    "Vegetables", "Groceries", "AC Repair", "Tailoring", "Plumbing", 
    "Electronics", "Clothing & Fashion", "Catering & Food", "Saloon & Beauty", 
    "Hardware", "Mobile Repair", "Photography", "Home Cleaning", "Tuition & Education"
];

const spellCheckMap = {
    "vegitable": "Vegetables", "vegitables": "Vegetables", "veg": "Vegetables",
    "grosery": "Groceries", "grosaries": "Groceries", "kirana": "Groceries",
    "taylor": "Tailoring", "tailer": "Tailoring",
    "pluming": "Plumbing", "plumber": "Plumbing",
    "salon": "Saloon & Beauty", "parlour": "Saloon & Beauty", "makeup": "Saloon & Beauty",
    "electrician": "Electronics", "repair": "Mobile Repair"
};

const compressImage = (file) => {
    return new Promise((resolve) => {
        if (!file || !file.type || !file.type.startsWith('image/')) return resolve(file); 
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const maxWidth = 1200; 
                const scaleSize = maxWidth / Math.max(img.width, img.height, maxWidth);
                canvas.width = img.width * (scaleSize < 1 ? scaleSize : 1);
                canvas.height = img.height * (scaleSize < 1 ? scaleSize : 1);

                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                canvas.toBlob((blob) => {
                    if (blob) {
                        const compressedFile = new File([blob], file.name, { type: 'image/jpeg', lastModified: Date.now() });
                        resolve(compressedFile);
                    } else resolve(file);
                }, 'image/jpeg', 0.72); 
            };
            img.onerror = () => resolve(file);
        };
        reader.onerror = () => resolve(file);
    });
};

const translations = {
    en: {
        title: "Register Your Business",
        editTitle: "Edit Application",
        secureUpload: "Secure Admin Vault (IDs are never public)",
        errMissingIDs: "Please upload both Front and Back photos of your Gov ID.",
        errMissingShopPhoto: "A Shop Photo is mandatory for Physical Shops.",
        errMissingCert: "Please upload your Business Certificate, or tick 'I don't have one'.",
        errFillAll: "Please fill all required text fields and select at least one category.",
        processing: "Compressing & Uploading Securely... ⏳",
        success: "Application Submitted Successfully!",
        updateSuccess: "Application Updated Successfully!",
        
        sec1Title: "1. Business Structure",
        typeQ: "What do you offer?",
        optProducts: "Physical Products",
        optServices: "Provide Services",
        modeQ: "Where do you operate?",
        optPhysical: "Physical Shop",
        optHome: "Work from Home",
        
        sec2Title: "2. Business Details",
        bizName: "Business / Shop Name",
        catType: "Categories (Add Multiple)",
        catSearch: "Type category and click Add (e.g. Veg...)",
        namePhone: "Your Name & WhatsApp",
        location: "Exact Area / Pincode",
        
        sec3Title: "3. Verifications & Evidence",
        govIdBox: "Upload Aadhaar / Gov ID",
        frontId: "Front Side *",
        backId: "Back Side *",
        infoShop: "Since you have a shop, a storefront photo is required.",
        shopPhoto: "Shop Storefront Photo *",
        bizCert: "Business/FSSAI Certificate",
        noCert: "I do not have a certificate yet.",
        
        legalWarning: "By submitting, you agree to Subhams Hub Terms & Conditions. Selling illegal items, fake products, or engaging in fraud will result in permanent account suspension and legal action.",
        btnSubmit: "Submit Business for Approval 🚀",
        btnUpdate: "Update Application 🔄",

        // 🟢 NEW TRANSLATIONS FOR ADMIN MESSAGES
        actionReq: "Action Required!",
        adminMsgText: "Admin Message:",
        pendingApp: "Your store is currently pending approval."
    },
    te: {
        title: "మీ వ్యాపారాన్ని నమోదు చేయండి",
        editTitle: "అప్లికేషన్ సవరించండి",
        secureUpload: "సురక్షిత అడ్మిన్ వాల్ట్ (IDలు పబ్లిక్ చేయబడవు)",
        errMissingIDs: "దయచేసి మీ Gov ID యొక్క ముందు మరియు వెనుక ఫోటోలను అప్‌లోడ్ చేయండి.",
        errMissingShopPhoto: "భౌతిక దుకాణాలకు షాప్ ఫోటో తప్పనిసరి.",
        errMissingCert: "దయచేసి సర్టిఫికేట్‌ను అప్‌లోడ్ చేయండి లేదా 'నాకు లేదు' అని టిక్ చేయండి.",
        errFillAll: "దయచేసి అవసరమైన అన్ని ఫీల్డ్‌లను పూరించండి మరియు కనీసం ఒక వర్గాన్ని ఎంచుకోండి.",
        processing: "కంప్రెస్ చేసి సురక్షితంగా అప్‌లోడ్ చేస్తున్నాము... ⏳",
        success: "అప్లికేషన్ విజయవంతంగా సమర్పించబడింది!",
        updateSuccess: "అప్లికేషన్ విజయవంతంగా సవరించబడింది!",
        
        sec1Title: "1. వ్యాపార నిర్మాణం",
        typeQ: "మీరు ఏమి అందిస్తున్నారు?",
        optProducts: "భౌతిక ఉత్పత్తులు",
        optServices: "సేవలు అందిస్తాను",
        modeQ: "మీరు ఎక్కడ నుండి పని చేస్తారు?",
        optPhysical: "భౌతిక దుకాణం",
        optHome: "ఇంటి నుండి పని",
        
        sec2Title: "2. వ్యాపార వివరాలు",
        bizName: "వ్యాపారం / షాప్ పేరు",
        catType: "వర్గాలు (అనేకం జోడించండి)",
        catSearch: "టైప్ చేసి జోడించండి (ఉదా. Veg...)",
        namePhone: "మీ పేరు & వాట్సాప్",
        location: "ఖచ్చితమైన ప్రాంతం / పిన్‌కోడ్",
        
        sec3Title: "3. ధృవీకరణలు మరియు సాక్ష్యాలు",
        govIdBox: "ఆధార్ / Gov ID అప్‌లోడ్ చేయండి",
        frontId: "ముందు భాగం *",
        backId: "వెనుక భాగం *",
        infoShop: "మీకు దుకాణం ఉన్నందున, దుకాణం ఫోటో తప్పనిసరి.",
        shopPhoto: "దుకాణం ఫోటో (Shop Photo) *",
        bizCert: "వ్యాపార/FSSAI సర్టిఫికేట్",
        noCert: "నా వద్ద ఇంకా సర్టిఫికేట్ లేదు.",
        
        legalWarning: "సమర్పించడం ద్వారా, మీరు సుభమ్స్ నిబంధనలకు అంగీకరిస్తున్నారు. చట్టవిరుద్ధమైన వస్తువులు, నకిలీ ఉత్పత్తులు అమ్మడం లేదా మోసానికి పాల్పడితే ఖాతా శాశ్వతంగా తొలగించబడుతుంది.",
        btnSubmit: "అనుమతి కోసం సమర్పించండి 🚀",
        btnUpdate: "సవరించండి 🔄",

        actionReq: "చర్య అవసరం!",
        adminMsgText: "అడ్మిన్ సందేశం:",
        pendingApp: "మీ దుకాణం ప్రస్తుతం ఆమోదం కోసం వేచి ఉంది."
    }
};

const BusinessRegistration = () => {
    const navigate = useNavigate();
    const { language } = useContext(AppContext);
    const lang = language === 'te' ? 'te' : 'en';
    const t = translations[lang];

    const userStr = localStorage.getItem('user');
    const user = userStr && userStr !== 'undefined' ? JSON.parse(userStr) : {};

    const [viewState, setViewState] = useState('loading');
    const [formError, setFormError] = useState(null);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const [isUpdate, setIsUpdate] = useState(false);
    
    // 🟢 ADMIN MESSAGE STATE
    const [adminMessage, setAdminMessage] = useState(null);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const [regForm, setRegForm] = useState({
        name: user.username || '',
        phone: user.phone || '',
        businessName: '',
        shop_type: 'Products', 
        location: user.address || '',
        email: user.email || ''
    });

    const [catInput, setCatInput] = useState('');
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [catSuggestions, setCatSuggestions] = useState([]);

    const [workMode, setWorkMode] = useState('physical'); 
    const [hasCertificate, setHasCertificate] = useState(true);
    const [isIdOpen, setIsIdOpen] = useState(false);

    const [idFront, setIdFront] = useState(null);
    const [idBack, setIdBack] = useState(null);
    const [shopPhoto, setShopPhoto] = useState(null);
    const [certificate, setCertificate] = useState(null);

    const [submitting, setSubmitting] = useState(false);
    const [successModal, setSuccessModal] = useState(false);

    const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000/api';
    const token = localStorage.getItem('token');

    useEffect(() => {
        const checkShopStatus = async () => {
            try {
                const res = await axios.get(`${BACKEND_URL}/shops/my-shop`, { headers: { Authorization: `Bearer ${token}` } });
                if (res.data.hasShop === false) {
                    setViewState('form');
                    return;
                }
                const { shop } = res.data;
                if (shop.is_approved) {
                    navigate(`/shop/${shop.id}`, { replace: true });
                } else {
                    setRegForm(prev => ({
                        ...prev,
                        businessName: shop.business_name || '',
                        shop_type: shop.shop_type || 'Products',
                        location: shop.location || prev.location 
                    }));
                    if (shop.category) {
                        setSelectedCategories(shop.category.split(',').map(c => c.trim()).filter(Boolean));
                    }
                    if (shop.work_mode) setWorkMode(shop.work_mode);
                    
                    // 🟢 PULL ADMIN MESSAGE FROM DATABASE
                    if (shop.status_note) setAdminMessage(shop.status_note);

                    setIsUpdate(true);
                    setViewState('pending');
                }
            } catch (err) {
                setViewState('form');
            }
        };

        if (token) checkShopStatus();
        else setViewState('form');
    }, [BACKEND_URL, token, navigate]);

    const handleCategoryChange = (e) => {
        const val = e.target.value;
        setCatInput(val);
        if (val.length > 0) {
            let matched = SMART_CATEGORIES.filter(c => c.toLowerCase().includes(val.toLowerCase()));
            const lowerVal = val.toLowerCase();
            if (spellCheckMap[lowerVal] && !matched.includes(spellCheckMap[lowerVal])) {
                matched.push(spellCheckMap[lowerVal]);
            }
            setCatSuggestions(matched);
        } else {
            setCatSuggestions([]);
        }
    };

    const addCategory = (cat) => {
        if (!selectedCategories.includes(cat)) setSelectedCategories([...selectedCategories, cat]);
        setCatInput('');
        setCatSuggestions([]);
    };

    const removeCategory = (cat) => {
        setSelectedCategories(selectedCategories.filter(c => c !== cat));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError(null);

        if (!regForm.name || !regForm.businessName || !regForm.location || selectedCategories.length === 0) {
            return setFormError(t.errFillAll);
        }

        if (!isUpdate) {
            if (!idFront || !idBack) {
                setIsIdOpen(true);
                return setFormError(t.errMissingIDs);
            }
            if (workMode === 'physical' && !shopPhoto) return setFormError(t.errMissingShopPhoto);
            if (hasCertificate && !certificate) return setFormError(t.errMissingCert);
        }

        setSubmitting(true);
        try {
            const finalCategories = selectedCategories.join(', ');

            const [cIdFront, cIdBack, cShopPhoto, cCertificate] = await Promise.all([
                compressImage(idFront), compressImage(idBack), compressImage(shopPhoto), compressImage(certificate)
            ]);

            const formData = new FormData();
            formData.append('name', regForm.name);
            formData.append('phone', regForm.phone);
            formData.append('businessName', regForm.businessName);
            formData.append('products', finalCategories); 
            formData.append('shop_type', regForm.shop_type); 
            formData.append('work_mode', workMode); 
            formData.append('location', regForm.location);
            formData.append('email', regForm.email);
            
            if (cIdFront) formData.append('idFront', cIdFront);
            if (cIdBack) formData.append('idBack', cIdBack);
            if (cShopPhoto) formData.append('shopPhoto', cShopPhoto);
            if (hasCertificate && cCertificate) formData.append('certificate', cCertificate);

            const endpoint = isUpdate ? `${BACKEND_URL}/shops/update-registration` : `${BACKEND_URL}/register-interest`;
            const method = isUpdate ? axios.put : axios.post;

            await method(endpoint, formData, { headers: { 'Authorization': `Bearer ${token}` } });

            setSuccessModal(true);
        } catch (error) {
            let errorMsg = error.response?.data?.message || error.message;
            setFormError(`❌ Server Error: ${errorMsg}`);
        } finally {
            setSubmitting(false);
        }
    };

    if (viewState === 'loading') {
        return <div style={{textAlign: 'center', padding: '100px', color: '#334155'}}><Loader className="spin" size={30}/></div>;
    }

    if (viewState === 'pending') {
        return (
            <div style={styles.page}>
                <div style={styles.container}>
                    <button onClick={() => navigate('/')} style={styles.backBtn}><ArrowLeft size={18} /> Back</button>
                    <div style={{...styles.card, textAlign: 'center', marginTop: '40px', padding: '50px 30px'}}>
                        <ShieldCheck size={60} color="#f59e0b" style={{marginBottom: '20px'}} />
                        <h2 style={{margin: '0 0 10px 0', color: '#b45309', fontSize: '24px'}}>Application Under Review</h2>
                        
                        {/* 🟢 THE ADMIN MESSAGE DISPLAY UI */}
                        {adminMessage ? (
                            <div style={{ background: '#fef2f2', border: '2px solid #ef4444', padding: '15px', borderRadius: '10px', marginTop: '15px', marginBottom: '15px' }}>
                                <h3 style={{ color: '#b91c1c', margin: '0 0 5px 0', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                                    <AlertCircle size={18} /> {t.actionReq}
                                </h3>
                                <p style={{ color: '#991b1b', fontSize: '14px', margin: 0, fontWeight: 'bold' }}>
                                    {t.adminMsgText} "{adminMessage}"
                                </p>
                            </div>
                        ) : (
                            <p style={{color: '#475569', fontSize: '15px', lineHeight: '1.6'}}>{t.pendingApp}</p>
                        )}
                        
                        <div style={{display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '25px'}}>
                            <button onClick={() => navigate('/')} style={{...styles.submitFormBtn, width: 'auto', padding: '12px 30px', background: '#e2e8f0', color: '#475569', border: 'none'}}>Home</button>
                            <button onClick={() => setViewState('form')} style={{...styles.submitFormBtn, width: 'auto', padding: '12px 30px', background: '#3b82f6'}}>Edit Application</button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div style={styles.page}>
            <style>{`
                .spin { animation: spin 1s linear infinite; }
                @keyframes spin { 100% { transform: rotate(360deg); } }
                .pulse-error { animation: pulseError 1.5s infinite; }
                @keyframes pulseError { 0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); } 70% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); } 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); } }
            `}</style>
            
            <div style={styles.container}>
                <div style={styles.headerBar}>
                    {isUpdate ? (
                        <button onClick={() => setViewState('pending')} style={styles.backBtn}><X size={18} /> Cancel Edit</button>
                    ) : (
                        <button onClick={() => navigate('/')} style={styles.backBtn}><ArrowLeft size={18} /> Back</button>
                    )}
                    <h2 style={{ margin: 0, color: '#1e3a8a', display: 'flex', alignItems: 'center', gap: '8px', fontSize: isMobile ? '18px' : '22px' }}>
                        <Store size={22} /> {isUpdate ? t.editTitle : t.title}
                    </h2>
                </div>

                {formError && (
                    <div className="pulse-error" style={{ background: '#fef2f2', border: '1px solid #ef4444', color: '#b91c1c', padding: '15px', borderRadius: '12px', marginBottom: '20px', display: 'flex', alignItems: 'flex-start', gap: '10px', fontWeight: 'bold', fontSize: '14px' }}>
                        <AlertCircle size={20} color="#ef4444" style={{flexShrink: 0}} />
                        <span>{formError}</span>
                    </div>
                )}

                <div style={styles.card}>
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        
                        <div style={styles.sectionBox}>
                            <label style={styles.sectionTitle}>{t.sec1Title}</label>
                            <label style={styles.label}>{t.typeQ}</label>
                            <div style={isMobile ? styles.btnGridMobile : styles.btnGridDesktop}>
                                <button type="button" onClick={() => setRegForm({...regForm, shop_type: 'Products'})} style={regForm.shop_type === 'Products' ? styles.optionActive : styles.optionInactive}>
                                    <Package size={20}/> {t.optProducts}
                                </button>
                                <button type="button" onClick={() => setRegForm({...regForm, shop_type: 'Services'})} style={regForm.shop_type === 'Services' ? styles.optionActive : styles.optionInactive}>
                                    <Wrench size={20}/> {t.optServices}
                                </button>
                            </div>

                            <label style={{...styles.label, marginTop: '20px'}}>{t.modeQ}</label>
                            <div style={isMobile ? styles.btnGridMobile : styles.btnGridDesktop}>
                                <button type="button" onClick={() => setWorkMode('physical')} style={workMode === 'physical' ? styles.optionActive : styles.optionInactive}>
                                    <Building size={20}/> {t.optPhysical}
                                </button>
                                <button type="button" onClick={() => setWorkMode('home')} style={workMode === 'home' ? styles.optionActive : styles.optionInactive}>
                                    <Home size={20}/> {t.optHome}
                                </button>
                            </div>
                        </div>

                        <div style={styles.sectionBox}>
                            <label style={styles.sectionTitle}>{t.sec2Title}</label>
                            <div style={styles.inputGroup}>
                                <label style={styles.label}>{t.bizName}</label>
                                <input type="text" style={styles.input} value={regForm.businessName} onChange={e => setRegForm({...regForm, businessName: e.target.value})} />
                            </div>

                            <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '10px' }}>
                                <label style={styles.label}>{t.catType}</label>
                                
                                {selectedCategories.length > 0 && (
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
                                        {selectedCategories.map((cat, idx) => (
                                            <span key={idx} style={{ background: '#dbeafe', color: '#1e3a8a', padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                {cat} <X size={14} style={{cursor: 'pointer'}} onClick={() => removeCategory(cat)} />
                                            </span>
                                        ))}
                                    </div>
                                )}

                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <input 
                                        type="text" 
                                        style={{...styles.input, flex: 1}} 
                                        placeholder={t.catSearch} 
                                        value={catInput} 
                                        onChange={handleCategoryChange} 
                                        onFocus={() => setCatSuggestions(SMART_CATEGORIES.filter(c => !selectedCategories.includes(c)))} 
                                        onKeyDown={(e) => { if(e.key === 'Enter' && catInput) { e.preventDefault(); addCategory(catInput); } }}
                                    />
                                    <button type="button" onClick={() => { if(catInput) addCategory(catInput) }} style={{ background: '#3b82f6', border: 'none', color: 'white', padding: '0 15px', borderRadius: '10px', cursor: 'pointer' }}><Plus size={20}/></button>
                                </div>

                                {catSuggestions.length > 0 && (
                                    <div style={styles.dropdown}>
                                        {catSuggestions.map((cat, idx) => (
                                            <div key={idx} onClick={() => addCategory(cat)} style={styles.dropdownItem}>{cat}</div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div style={{...styles.inputGroup, marginTop: '10px'}}>
                                <label style={styles.label}>{t.namePhone}</label>
                                <div style={isMobile ? styles.btnGridMobile : styles.btnGridDesktop}>
                                    <input type="text" style={styles.input} value={regForm.name} onChange={e => setRegForm({...regForm, name: e.target.value})} />
                                    <input type="tel" style={styles.input} value={regForm.phone} onChange={e => setRegForm({...regForm, phone: e.target.value})} />
                                </div>
                            </div>

                            <div style={{...styles.inputGroup, marginTop: '10px'}}>
                                <label style={styles.label}>{t.location}</label>
                                <input type="text" style={styles.input} value={regForm.location} onChange={e => setRegForm({...regForm, location: e.target.value})} />
                            </div>
                        </div>

                        <div style={{...styles.sectionBox, background: '#eff6ff', borderColor: '#bfdbfe'}}>
                            <label style={{...styles.sectionTitle, color: '#1e3a8a', display: 'flex', alignItems: 'center', gap: '6px'}}>
                                <ShieldCheck size={18} /> {t.sec3Title}
                            </label>
                            {isUpdate && <p style={{fontSize: '12px', color: '#10b981', fontWeight: 'bold', margin: '0 0 10px 0'}}>Note: Leave file uploads empty to keep your existing documents.</p>}
                            
                            <div style={{ marginBottom: '15px' }}>
                                <button 
                                    type="button"
                                    onClick={() => setIsIdOpen(!isIdOpen)}
                                    style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#3b82f6', color: 'white', padding: '14px', borderRadius: '10px', border: 'none', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 6px rgba(59,130,246,0.3)' }}
                                >
                                    <span style={{display: 'flex', alignItems: 'center', gap: '8px'}}><Lock size={16}/> {t.govIdBox}</span>
                                    {isIdOpen ? <ChevronUp size={20}/> : <ChevronDown size={20}/>}
                                </button>
                                
                                {isIdOpen && (
                                    <div style={{ padding: '15px', background: 'white', borderRadius: '0 0 10px 10px', border: '1px solid #bfdbfe', borderTop: 'none', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                        <p style={{fontSize: '12px', color: '#64748b', margin: 0, fontWeight: 'bold'}}>{t.secureUpload}</p>
                                        <div style={isMobile ? styles.btnGridMobile : styles.btnGridDesktop}>
                                            <div style={{...styles.uploadBox, border: (!isUpdate && !idFront) ? '1px dashed #ef4444' : '1px solid #10b981', background: idFront ? '#f0fdf4' : '#fafafa'}}>
                                                <label style={styles.uploadLabel}><Upload size={14}/> {t.frontId}</label>
                                                <input type="file" accept="image/*" onChange={e => setIdFront(e.target.files[0])} style={{fontSize: '11px'}} />
                                            </div>
                                            <div style={{...styles.uploadBox, border: (!isUpdate && !idBack) ? '1px dashed #ef4444' : '1px solid #10b981', background: idBack ? '#f0fdf4' : '#fafafa'}}>
                                                <label style={styles.uploadLabel}><Upload size={14}/> {t.backId}</label>
                                                <input type="file" accept="image/*" onChange={e => setIdBack(e.target.files[0])} style={{fontSize: '11px'}} />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {workMode === 'physical' && (
                                <div style={{ marginBottom: '15px', background: 'white', padding: '15px', borderRadius: '10px', border: '1px solid #bfdbfe' }}>
                                    <p style={styles.infoText}><Info size={14}/> {t.infoShop}</p>
                                    <div style={{...styles.uploadBox, border: (!isUpdate && !shopPhoto) ? '1px dashed #ef4444' : '1px solid #10b981', background: shopPhoto ? '#f0fdf4' : '#fafafa'}}>
                                        <label style={styles.uploadLabel}><Store size={16}/> {t.shopPhoto}</label>
                                        <input type="file" accept="image/*" onChange={e => setShopPhoto(e.target.files[0])} style={{fontSize: '11px'}} />
                                    </div>
                                </div>
                            )}

                            <div style={{ background: 'white', padding: '15px', borderRadius: '10px', border: '1px solid #bfdbfe' }}>
                                <div style={{...styles.uploadBox, opacity: !hasCertificate ? 0.4 : 1}}>
                                    <label style={styles.uploadLabel}>📜 {t.bizCert}</label>
                                    <input type="file" accept="image/*,.pdf" disabled={!hasCertificate} onChange={e => setCertificate(e.target.files[0])} style={{fontSize: '11px'}} />
                                </div>
                                <label style={{display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px', fontSize: '13px', color: '#475569', cursor: 'pointer'}}>
                                    <input type="checkbox" checked={!hasCertificate} onChange={() => {setHasCertificate(!hasCertificate); setCertificate(null);}} style={{width: '16px', height: '16px'}} />
                                    {t.noCert}
                                </label>
                            </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', background: '#fffbeb', border: '1px solid #fcd34d', padding: '15px', borderRadius: '12px' }}>
                            <ShieldAlert size={24} color="#d97706" style={{flexShrink: 0}} />
                            <p style={{ margin: 0, fontSize: '12px', color: '#b45309', fontWeight: '600', lineHeight: '1.5' }}>
                                {t.legalWarning}
                            </p>
                        </div>

                        <button type="submit" disabled={submitting} style={styles.submitFormBtn}>
                            {isUpdate ? t.btnUpdate : t.btnSubmit}
                        </button>
                    </form>
                </div>
            </div>

            {submitting && (
                <div style={styles.overlay}>
                    <div style={styles.modal}>
                        <Loader className="spin" size={50} color="#3b82f6" style={{marginBottom: '15px'}} />
                        <h2 style={{margin: '0', color: '#1e3a8a'}}>{t.processing}</h2>
                    </div>
                </div>
            )}

            {successModal && (
                <div style={styles.overlay}>
                    <div style={{...styles.modal, background: '#f0fdf4', border: '2px solid #22c55e'}}>
                        <CheckCircle size={50} color="#16a34a" style={{marginBottom: '15px'}} />
                        <h2 style={{margin: '0 0 10px 0', color: '#166534'}}>{isUpdate ? t.updateSuccess : t.success}</h2>
                        <button onClick={() => {setSuccessModal(false); setViewState('pending'); window.scrollTo(0,0);}} style={{...styles.submitFormBtn, background: '#16a34a', marginTop: '15px'}}>Got it</button>
                    </div>
                </div>
            )}
        </div>
    );
};

const styles = {
    page: { background: '#f8fafc', minHeight: '100vh', padding: '15px', boxSizing: 'border-box', fontFamily: 'Inter, sans-serif' },
    container: { maxWidth: '600px', margin: '0 auto', paddingBottom: '30px' },
    headerBar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' },
    backBtn: { background: 'white', border: '1px solid #cbd5e1', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold', color: '#475569', fontSize: '13px' },
    card: { background: 'white', padding: '20px', borderRadius: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' },
    
    sectionBox: { background: '#f8fafc', border: '1px solid #e2e8f0', padding: '15px', borderRadius: '12px' },
    sectionTitle: { fontSize: '15px', fontWeight: '900', color: '#334155', display: 'block', marginBottom: '15px', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' },
    infoText: { display: 'flex', alignItems: 'flex-start', gap: '6px', fontSize: '12px', color: '#3b82f6', marginBottom: '12px', fontWeight: '600', lineHeight: '1.4' },
    
    btnGridDesktop: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', width: '100%' },
    btnGridMobile: { display: 'grid', gridTemplateColumns: '1fr', gap: '10px', width: '100%' },
    optionActive: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: '#eff6ff', border: '2px solid #3b82f6', color: '#1e3a8a', padding: '12px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', transition: '0.2s' },
    optionInactive: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: '#ffffff', border: '1px solid #cbd5e1', color: '#64748b', padding: '12px', borderRadius: '10px', fontWeight: '600', cursor: 'pointer', transition: '0.2s' },

    inputGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
    label: { fontSize: '13px', fontWeight: 'bold', color: '#475569' },
    input: { padding: '12px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', background: '#ffffff', outline: 'none', width: '100%', boxSizing: 'border-box', transition: '0.2s' },
    
    dropdown: { position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '1px solid #cbd5e1', borderRadius: '8px', marginTop: '4px', zIndex: 10, boxShadow: '0 4px 15px rgba(0,0,0,0.1)', maxHeight: '200px', overflowY: 'auto' },
    dropdownItem: { padding: '12px 15px', borderBottom: '1px solid #f1f5f9', cursor: 'pointer', fontSize: '14px', fontWeight: '500', color: '#334155' },
    
    uploadBox: { padding: '12px', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '8px', transition: '0.2s' },
    uploadLabel: { fontSize: '12px', fontWeight: 'bold', color: '#475569', display: 'flex', alignItems: 'center', gap: '5px' },
    
    submitFormBtn: { padding: '15px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: 'white', fontWeight: '900', fontSize: '15px', cursor: 'pointer', boxShadow: '0 4px 10px rgba(37, 99, 235, 0.3)', width: '100%', transition: '0.2s' },
    
    overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15,23,42,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', zIndex: 1000 },
    modal: { background: 'white', padding: '40px 30px', borderRadius: '24px', textAlign: 'center', maxWidth: '400px', width: '100%', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', display: 'flex', flexDirection: 'column', alignItems: 'center' }
};

export default BusinessRegistration;