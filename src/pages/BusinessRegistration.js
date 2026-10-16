import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { Store, ArrowLeft, Upload, CheckCircle, ShieldCheck, Lock, AlertCircle, Loader, Info, Home, Package, Wrench, Building, Plus, X, ShieldAlert, MapPin, ArrowRight, Check, Search, Globe, RotateCcw } from 'lucide-react'; 

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

const TELUGU_TO_EN_MAP = {
    'కోణంకి': 'konanki', 'మార్టూరు': 'martur', 'బాపట్ల': 'bapatla',
    'తిరుపతి': 'tirupati', 'ఆంధ్రప్రదేశ్': 'andhra pradesh', 'గుంటూరు': 'guntur',
    'విజయవాడ': 'vijayawada', 'ఒంగోలు': 'ongole', 'చీరాల': 'chirala', 'ప్రకాశం': 'prakasam'
};

const normalizeLocationSearch = (text) => {
    if (!text) return '';
    let lower = text.toLowerCase();
    Object.keys(TELUGU_TO_EN_MAP).forEach(te => {
        if (lower.includes(te)) lower = lower.replace(new RegExp(te, 'g'), TELUGU_TO_EN_MAP[te]);
    });
    return lower;
};

const parseDeliveryZones = (rawAreas) => {
    if (!rawAreas || !rawAreas.trim() || rawAreas.trim().toLowerCase() === 'all') return [];
    if (rawAreas.includes('|')) {
        return rawAreas.split('|').map(z => z.trim()).filter(Boolean).map(zone => {
            const parts = zone.split(',').map(p => p.trim()).filter(Boolean);
            return { full: zone, primary: parts[0] || zone, sub: parts.slice(1, 3).join(', ') };
        });
    }
    const commaParts = rawAreas.split(',').map(p => p.trim()).filter(Boolean);
    if (commaParts.length >= 3 && (rawAreas.toLowerCase().includes('india') || rawAreas.toLowerCase().includes('andhra pradesh') || /\b\d{6}\b/.test(rawAreas))) {
        return [{ full: rawAreas.trim(), primary: commaParts[0], sub: commaParts.slice(1, 3).join(', ') }];
    }
    return commaParts.map(p => ({ full: p, primary: p, sub: '' }));
};

const STEP2_ERROR_CODES = ['NAME_TAKEN', 'NAME_RESERVED', 'NAME_BLOCKED', 'NAME_TOO_SHORT', 'NAME_TOO_LONG', 'PHONE_INVALID'];
const DRAFT_STORAGE_KEY = 'subhams_vendor_reg_draft_v2';

const readStoredUser = () => {
    try {
        const raw = localStorage.getItem('user');
        return raw && raw !== 'undefined' ? JSON.parse(raw) : {};
    } catch (e) {
        return {};
    }
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
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                canvas.toBlob((blob) => {
                    if (blob) {
                        const compressedFile = new File([blob], file.name || 'upload.jpg', { type: 'image/jpeg', lastModified: Date.now() });
                        resolve(compressedFile);
                    } else resolve(file);
                }, 'image/jpeg', 0.72); 
            };
            img.onerror = () => resolve(file);
        };
        reader.onerror = () => resolve(file);
    });
};

const fileToDataUrl = (file) => new Promise((resolve) => {
    if (!file) return resolve(null);
    const reader = new FileReader();
    reader.onload = () => resolve({ name: file.name, type: file.type, dataUrl: reader.result });
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
});

const dataUrlToFile = async (savedObj) => {
    if (!savedObj || !savedObj.dataUrl) return null;
    try {
        const res = await fetch(savedObj.dataUrl);
        const blob = await res.blob();
        return new File([blob], savedObj.name || 'restored.jpg', { type: savedObj.type || 'image/jpeg' });
    } catch (e) {
        return null;
    }
};

const translations = {
    en: {
        title: "Register Your Business",
        editTitle: "Edit Application",
        secureUpload: "Secure Admin Vault (IDs are never public)",
        errMissingIDs: "Please upload both Front and Back photos of your Gov ID.",
        errMissingShopPhoto: "A Shop Storefront Photo is mandatory for Physical Shops.",
        errMissingCert: "Please upload your Business Certificate, or tick 'I don't have one'.",
        errFillAll: "Please fill all required fields.",
        errPhoneLength: "⚠️ Please enter exactly 10 digits for your phone number.",
        processing: "Compressing & Uploading Securely... ⏳",
        success: "Application Submitted Successfully!",
        updateSuccess: "Application Updated Successfully!",
        draftRestored: "💾 Auto-saved session restored",
        clearDraft: "Reset Form",
        
        sec1Title: "1. Business & Delivery Locations",
        typeQ: "What do you offer?",
        optProducts: "Physical Products",
        optServices: "Provide Services",
        modeQ: "Where do you operate?",
        optPhysical: "Physical Shop",
        optHome: "Work from Home",
        location: "Shop Location (Map Search Only) *",
        locationSearchMsg: "Click to search & select your location...",
        deliveryAreas: "Delivery Areas (Where can customers book from?)",
        deliverySearchMsg: "Click to add village, mandal, district, or state...",
        
        sec2Title: "2. Business & Founder Details",
        bizName: "Business / Shop Name *",
        catType: "Categories (Add Multiple) *",
        catSearch: "Type category and click + (e.g. Vegetables...)",
        namePhone: "Owner Name & 10-Digit WhatsApp *",
        founderCeo: "Founder & CEO Name (Optional)",
        
        sec3Title: "3. Verifications & Evidence",
        govIdBox: "📄 Upload Government ID (Front & Back)",
        frontId: "ID Front Side *",
        backId: "ID Back Side *",
        infoShop: "Since you have a physical shop, a storefront photo is required.",
        shopPhoto: "🏪 Shop Storefront Photo *",
        bizCert: "📜 Business/FSSAI Certificate",
        noCert: "I do not have a certificate yet.",
        
        legalWarning: "By submitting, you agree to Subhams Hub Terms & Conditions. Selling illegal items, fake products, or engaging in fraud will result in permanent account suspension and legal action.",
        btnSubmit: "Submit Business for Approval 🚀",
        btnUpdate: "Update Application 🔄",
        btnNext: "Next Step",
        btnBack: "Go Back",

        actionReq: "Action Required!",
        adminMsgText: "Admin Message:",
        pendingApp: "Your store is currently pending approval.",
        
        checkingName: "⏳ Checking live availability...",
        nameAvailable: "✅ Shop name is unique & available!",
        nameTaken: "❌ Similar or identical shop name exists! Tap a distinct suggestion below:",
        nameReserved: "🚫 This name is reserved by Subhams Hub administration. Please choose a different name.",
        nameBlocked: "🚫 This name contains restricted words. Please change it.",
        nameTooShort: "⚠️ Shop name must be at least 3 characters."
    },
    te: {
        title: "మీ వ్యాపారాన్ని నమోదు చేయండి",
        editTitle: "అప్లికేషన్ సవరించండి",
        secureUpload: "సురక్షిత అడ్మిన్ వాల్ట్ (IDలు పబ్లిక్ చేయబడవు)",
        errMissingIDs: "దయచేసి మీ గుర్తింపు కార్డు యొక్క ముందు మరియు వెనుక ఫోటోలను అప్‌లోడ్ చేయండి.",
        errMissingShopPhoto: "భౌతిక దుకాణాలకు షాప్ ఫోటో తప్పనిసరి.",
        errMissingCert: "దయచేసి సర్టిఫికేట్‌ను అప్‌లోడ్ చేయండి లేదా 'నాకు లేదు' అని టిక్ చేయండి.",
        errFillAll: "దయచేసి అవసరమైన అన్ని ఫీల్డ్‌లను పూరించండి.",
        errPhoneLength: "⚠️ దయచేసి సరిగ్గా 10 అంకెల ఫోన్ నంబర్‌ను నమోదు చేయండి.",
        processing: "కంప్రెస్ చేసి సురక్షితంగా అప్‌లోడ్ చేస్తున్నాము... ⏳",
        success: "అప్లికేషన్ విజయవంతంగా సమర్పించబడింది!",
        updateSuccess: "అప్లికేషన్ విజయవంతంగా సవరించబడింది!",
        draftRestored: "💾 తాత్కాలిక డ్రాఫ్ట్ సేవ్ చేయబడింది",
        clearDraft: "రీసెట్",
        
        sec1Title: "1. వ్యాపార & డెలివరీ ప్రాంతాలు",
        typeQ: "మీరు ఏమి అందిస్తున్నారు?",
        optProducts: "భౌతిక ఉత్పత్తులు",
        optServices: "సేవలు అందిస్తాను",
        modeQ: "మీరు ఎక్కడ నుండి పని చేస్తారు?",
        optPhysical: "భౌతిక దుకాణం",
        optHome: "ఇంటి నుండి పని",
        location: "షాప్ ప్రాంతం (మ్యాప్ సెర్చ్ మాత్రమే) *",
        locationSearchMsg: "ప్రాంతాన్ని ఎంచుకోవడానికి ఇక్కడ క్లిక్ చేయండి...",
        deliveryAreas: "డెలివరీ ప్రాంతాలు (మీరు ఎక్కడ డెలివరీ చేస్తారు?)",
        deliverySearchMsg: "గ్రామం, మండలం, జిల్లా లేదా రాష్ట్రాన్ని జతచేయండి...",
        
        sec2Title: "2. వ్యాపార & వ్యవస్థాపక వివరాలు",
        bizName: "వ్యాపారం / షాప్ పేరు *",
        catType: "వర్గాలు (అనేకం జోడించండి) *",
        catSearch: "టైప్ చేసి + క్లిక్ చేయండి (ఉదా. Vegetables...)",
        namePhone: "మీ పేరు & 10-అంకెల వాట్సాప్ నంబర్ *",
        founderCeo: "ఫౌండర్ & CEO పేరు (ఐచ్ఛికం)",
        
        sec3Title: "3. ధృవీకరణలు మరియు సాక్ష్యాలు",
        govIdBox: "📄 ప్రభుత్వ గుర్తింపు కార్డు అప్‌లోడ్ (ముందు & వెనుక)",
        frontId: "ID ముందు భాగం *",
        backId: "ID వెనుక భాగం *",
        infoShop: "మీకు భౌతిక దుకాణం ఉన్నందున, దుకాణం ఫోటో తప్పనిసరి.",
        shopPhoto: "🏪 దుకాణం ఫోటో (Shop Photo) *",
        bizCert: "📜 వ్యాపార/FSSAI సర్టిఫికేట్",
        noCert: "నా వద్ద ఇంకా సర్టిఫికేట్ లేదు.",
        
        legalWarning: "సమర్పించడం ద్వారా, మీరు సుభమ్స్ నిబంధనలకు అంగీకరిస్తున్నారు. చట్టవిరుద్ధమైన వస్తువులు, నకిలీ ఉత్పత్తులు అమ్మడం లేదా మోసానికి పాల్పడితే ఖాతా శాశ్వతంగా తొలగించబడుతుంది.",
        btnSubmit: "అనుమతి కోసం సమర్పించండి 🚀",
        btnUpdate: "సవరించండి 🔄",
        btnNext: "తదుపరి దశ",
        btnBack: "వెనుకకు",

        actionReq: "చర్య అవసరం!",
        adminMsgText: "అడ్మిన్ సందేశం:",
        pendingApp: "మీ దుకాణం ప్రస్తుతం ఆమోదం కోసం వేచి ఉంది.",
        
        checkingName: "⏳ లభ్యతను తనిఖీ చేస్తోంది...",
        nameAvailable: "✅ షాప్ పేరు అందుబాటులో ఉంది!",
        nameTaken: "❌ ఈ పేరు ఇప్పటికే ఉంది! క్రింది విభిన్న పేర్లలో ఒకదానిని ఎంచుకోండి:",
        nameReserved: "🚫 ఈ పేరు ప్లాట్‌ఫామ్ కోసం రిజర్వ్ చేయబడింది. దయచేసి వేరే షాప్ పేరును ఎంచుకోండి.",
        nameBlocked: "🚫 ఈ పేరులో అనుమతించబడని పదాలు ఉన్నాయి. దయచేసి మార్చండి.",
        nameTooShort: "⚠️ షాప్ పేరు కనీసం 3 అక్షరాలు ఉండాలి."
    }
};

const BusinessRegistration = () => {
    const navigate = useNavigate();
    const { language, setLanguage } = useContext(AppContext);
    const [localLang, setLocalLang] = useState(() => language === 'te' ? 'te' : 'en');
    const lang = localLang;
    const t = translations[lang];

    const toggleLanguage = () => {
        const nextLang = localLang === 'en' ? 'te' : 'en';
        setLocalLang(nextLang);
        if (typeof setLanguage === 'function') setLanguage(nextLang);
    };

    const user = readStoredUser();

    const [viewState, setViewState] = useState('loading');
    const [currentStep, setCurrentStep] = useState(1); 
    const [formError, setFormError] = useState(null);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const [isUpdate, setIsUpdate] = useState(false);
    const [adminMessage, setAdminMessage] = useState(null);
    const [draftRestoredBanner, setDraftRestoredBanner] = useState(false);

    // 🟢 SMART NAME CHECKER STATES
    const [nameStatus, setNameStatus] = useState('idle'); 
    const [nameStatusMsg, setNameStatusMsg] = useState('');
    const [nameSuggestions, setNameSuggestions] = useState([]);

    // 🟢 LOCATION MODAL STATES
    const [showLocModal, setShowLocModal] = useState(false); // false | 'location' | 'delivery'
    const [locSearch, setLocSearch] = useState('');
    const [locResults, setLocResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const [regForm, setRegForm] = useState({
        name: user.username || '',
        phone: String(user.phone || '').replace(/\D/g, '').slice(-10),
        businessName: '',
        founder_name: '',
        ceo_name: '',
        shop_type: 'Products', 
        location: user.address || '',
        delivery_areas: '', 
        email: user.email || ''
    });

    const [catInput, setCatInput] = useState('');
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [catSuggestions, setCatSuggestions] = useState([]);

    const [workMode, setWorkMode] = useState('physical'); 
    const [hasCertificate, setHasCertificate] = useState(true);

    const [idFront, setIdFront] = useState(null);
    const [idBack, setIdBack] = useState(null);
    const [shopPhoto, setShopPhoto] = useState(null);
    const [certificate, setCertificate] = useState(null);

    const [submitting, setSubmitting] = useState(false);
    const [successModal, setSuccessModal] = useState(false);

    const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || (isLocal ? 'http://localhost:5000/api' : 'https://bhavyams-vendorhub-backend.onrender.com/api');
    const token = localStorage.getItem('token');

    // =====================================================================
    // 💾 RESTORE TEMP SESSION DRAFT (TEXT + UPLOADED FILES)
    // =====================================================================
    useEffect(() => {
        const restoreDraft = async () => {
            try {
                const rawDraft = sessionStorage.getItem(DRAFT_STORAGE_KEY);
                if (!rawDraft) return;
                const parsed = JSON.parse(rawDraft);
                if (parsed.regForm) setRegForm(prev => ({ ...prev, ...parsed.regForm }));
                if (Array.isArray(parsed.selectedCategories)) setSelectedCategories(parsed.selectedCategories);
                if (parsed.workMode) setWorkMode(parsed.workMode);
                if (typeof parsed.hasCertificate === 'boolean') setHasCertificate(parsed.hasCertificate);
                if (parsed.currentStep) setCurrentStep(parsed.currentStep);

                if (parsed.files) {
                    const [fFront, fBack, fShop, fCert] = await Promise.all([
                        dataUrlToFile(parsed.files.idFront),
                        dataUrlToFile(parsed.files.idBack),
                        dataUrlToFile(parsed.files.shopPhoto),
                        dataUrlToFile(parsed.files.certificate)
                    ]);
                    if (fFront) setIdFront(fFront);
                    if (fBack) setIdBack(fBack);
                    if (fShop) setShopPhoto(fShop);
                    if (fCert) setCertificate(fCert);
                }
                setDraftRestoredBanner(true);
            } catch (e) {}
        };
        restoreDraft();
    }, []);

    // =====================================================================
    // 💾 AUTO-SAVE DRAFT TO SESSIONSTORAGE WHEN FIELDS OR FILES CHANGE
    // =====================================================================
    useEffect(() => {
        if (viewState !== 'form') return;
        let isCancelled = false;
        const saveTimer = setTimeout(async () => {
            try {
                const [dFront, dBack, dShop, dCert] = await Promise.all([
                    fileToDataUrl(idFront),
                    fileToDataUrl(idBack),
                    fileToDataUrl(shopPhoto),
                    fileToDataUrl(certificate)
                ]);
                if (isCancelled) return;
                const payload = {
                    regForm,
                    selectedCategories,
                    workMode,
                    hasCertificate,
                    currentStep,
                    files: { idFront: dFront, idBack: dBack, shopPhoto: dShop, certificate: dCert }
                };
                sessionStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(payload));
            } catch (e) {}
        }, 400);
        return () => { isCancelled = true; clearTimeout(saveTimer); };
    }, [regForm, selectedCategories, workMode, hasCertificate, currentStep, idFront, idBack, shopPhoto, certificate, viewState]);

    const handleClearDraft = () => {
        sessionStorage.removeItem(DRAFT_STORAGE_KEY);
        setRegForm({
            name: user.username || '',
            phone: String(user.phone || '').replace(/\D/g, '').slice(-10),
            businessName: '',
            founder_name: '',
            ceo_name: '',
            shop_type: 'Products',
            location: user.address || '',
            delivery_areas: '',
            email: user.email || ''
        });
        setSelectedCategories([]);
        setIdFront(null); setIdBack(null); setShopPhoto(null); setCertificate(null);
        setCurrentStep(1);
        setDraftRestoredBanner(false);
    };

    // 🟢 STRICT ANTI-MALWARE FRONTEND SCANNER WITH INSTANT COMPRESSION
    const handleFileChange = async (e, setFileState, isDocument = false) => {
        const file = e.target.files[0];
        if (!file) return;

        const validTypes = isDocument 
            ? ['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'application/pdf']
            : ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];

        if (!file.type || !validTypes.includes(file.type)) {
            setFormError("🚨 SECURITY BLOCK: Only standard Images and PDFs are allowed.");
            e.target.value = '';
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }

        setFormError(null);
        const compressed = file.type.startsWith('image/') ? await compressImage(file) : file;
        setFileState(compressed);
    };

    // 🟢 LIVE SHOP NAME CHECKER (Checks both /shops/check-shop-name and /check-shop-name)
    useEffect(() => {
        const trimmed = regForm.businessName.trim();

        if (trimmed.length < 3) {
            setNameStatus('idle');
            setNameStatusMsg('');
            setNameSuggestions([]);
            return;
        }

        let cancelled = false;
        setNameStatus('loading');

        const timerId = setTimeout(async () => {
            try {
                const queryParams = {
                    name: trimmed,
                    location: regForm.location || 'Local',
                    category: selectedCategories[0] || regForm.shop_type || 'Store'
                };
                let res;
                try {
                    res = await axios.get(`${BACKEND_URL}/check-shop-name`, {
                        params: queryParams,
                        headers: { Authorization: `Bearer ${token}` },
                        timeout: 6000
                    });
                } catch (firstErr) {
                    res = await axios.get(`${BACKEND_URL}/shops/check-shop-name`, {
                        params: queryParams,
                        headers: { Authorization: `Bearer ${token}` },
                        timeout: 6000
                    });
                }
                if (cancelled) return;

                if (res.data.available) {
                    setNameStatus('available');
                    setNameStatusMsg('');
                    setNameSuggestions([]);
                } else if (res.data.code === 'NAME_RESERVED' || (res.data.reason && res.data.reason.toLowerCase().includes('reserved'))) {
                    setNameStatus('reserved');
                    setNameStatusMsg(res.data.message || res.data.reason || t.nameReserved);
                    setNameSuggestions([]);
                } else if (res.data.code === 'NAME_BLOCKED' || (res.data.reason && res.data.reason.toLowerCase().includes('inappropriate'))) {
                    setNameStatus('blocked');
                    setNameStatusMsg(res.data.message || res.data.reason || t.nameBlocked);
                    setNameSuggestions([]);
                } else {
                    setNameStatus('taken');
                    setNameStatusMsg(res.data.message || res.data.reason || t.nameTaken);
                    setNameSuggestions(res.data.suggestions || []);
                }
            } catch (err) {
                if (cancelled) return;
                setNameStatus('idle');
                setNameSuggestions([]);
            }
        }, 450);

        return () => {
            cancelled = true;
            clearTimeout(timerId);
        };
    }, [regForm.businessName, regForm.location, selectedCategories, BACKEND_URL, token]);

    // 🟢 DEBOUNCED MAP LOCATION SEARCH (English Canonical DB Sync)
    useEffect(() => {
        if (!showLocModal) return;

        const query = normalizeLocationSearch(locSearch.trim());
        if (query.length < 2) {
            setLocResults([]);
            setIsSearching(false);
            return;
        }

        let cancelled = false;
        setIsSearching(true);

        const timerId = setTimeout(async () => {
            try {
                const res = await axios.get('https://nominatim.openstreetmap.org/search', {
                    params: { format: 'json', addressdetails: 1, countrycodes: 'in', 'accept-language': 'en', q: query }
                });
                if (!cancelled) setLocResults(res.data || []);
            } catch (e) {
                if (!cancelled) setLocResults([]);
            } finally {
                if (!cancelled) setIsSearching(false);
            }
        }, 500);

        return () => {
            cancelled = true;
            clearTimeout(timerId);
        };
    }, [locSearch, showLocModal]);

    // 🟢 FETCH EXISTING SHOP PROFILE FOR EDITING
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
                        businessName: shop.business_name || prev.businessName,
                        founder_name: shop.founder_name || prev.founder_name,
                        ceo_name: shop.ceo_name || prev.ceo_name,
                        shop_type: shop.shop_type || 'Products',
                        location: shop.address || shop.location || prev.location, 
                        delivery_areas: shop.delivery_areas === 'All' ? '' : (shop.delivery_areas || '')
                    }));
                    if (shop.category) {
                        setSelectedCategories(shop.category.split(',').map(c => c.trim()).filter(Boolean));
                    }
                    if (shop.work_mode) setWorkMode(shop.work_mode);
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

    const handleWorkModeChange = (mode) => {
        setWorkMode(mode);
    };

    // 🟢 SAVES FULL HIERARCHY (1st Word + Sub-Address)
    const selectCustomLocation = (loc) => {
        const canonicalFull = loc.display_name;
        if (showLocModal === 'location') {
            setRegForm(prev => ({ ...prev, location: canonicalFull }));
        } else if (showLocModal === 'delivery') {
            const existingZones = parseDeliveryZones(regForm.delivery_areas).map(z => z.full);
            const primaryNew = canonicalFull.split(',')[0].trim().toLowerCase();
            const alreadyExists = existingZones.some(z => z.split(',')[0].trim().toLowerCase() === primaryNew && z.toLowerCase() === canonicalFull.toLowerCase());

            if (!alreadyExists) {
                const updatedZones = [...existingZones, canonicalFull];
                setRegForm(prev => ({ ...prev, delivery_areas: updatedZones.join(' | ') }));
            }
        }
        closeLocModal();
    };

    const closeLocModal = () => {
        setShowLocModal(false);
        setLocSearch('');
        setLocResults([]);
    };

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
        const cleanCat = cat.trim();
        if (cleanCat && !selectedCategories.includes(cleanCat)) {
            setSelectedCategories([...selectedCategories, cleanCat]);
        }
        setCatInput('');
        setCatSuggestions([]);
    };

    const removeCategory = (cat) => {
        setSelectedCategories(selectedCategories.filter(c => c !== cat));
    };

    const nameBlocked = ['taken', 'reserved', 'blocked'].includes(nameStatus);

    const handleNextStep = () => {
        setFormError(null);
        if (currentStep === 1) {
            if (!regForm.location.trim()) {
                return setFormError(t.errFillAll);
            }
        }
        if (currentStep === 2) {
            const trimmedName = regForm.businessName.trim();
            if (!regForm.name.trim() || !trimmedName || selectedCategories.length === 0) {
                return setFormError(t.errFillAll);
            }
            if (trimmedName.length < 3) {
                return setFormError(t.nameTooShort);
            }
            if (regForm.phone.length !== 10) {
                return setFormError(t.errPhoneLength);
            }
            if (nameStatus === 'loading') {
                return setFormError(t.checkingName);
            }
            if (nameStatus === 'taken') {
                return setFormError(nameStatusMsg || t.nameTaken);
            }
            if (nameStatus === 'reserved') {
                return setFormError(nameStatusMsg || t.nameReserved);
            }
            if (nameStatus === 'blocked') {
                return setFormError(nameStatusMsg || t.nameBlocked);
            }
        }
        setCurrentStep(prev => prev + 1);
        window.scrollTo(0, 0);
    };

    const handlePrevStep = () => {
        setFormError(null);
        setCurrentStep(prev => prev - 1);
        window.scrollTo(0, 0);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError(null);

        if (currentStep !== 3) return handleNextStep();

        if (!isUpdate) {
            if (!idFront || !idBack) return setFormError(t.errMissingIDs);
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
            formData.append('name', regForm.name.trim());
            formData.append('phone', regForm.phone);
            formData.append('businessName', regForm.businessName.trim());
            formData.append('founder_name', regForm.founder_name.trim());
            formData.append('ceo_name', regForm.ceo_name.trim());
            formData.append('products', finalCategories); 
            formData.append('shop_type', regForm.shop_type); 
            formData.append('work_mode', workMode); 
            formData.append('location', regForm.location);
            
            const finalDeliveryAreas = regForm.delivery_areas ? regForm.delivery_areas.trim() : 'All';
            formData.append('delivery_areas', finalDeliveryAreas); 
            formData.append('email', regForm.email);
            
            if (cIdFront) formData.append('idFront', cIdFront);
            if (cIdBack) formData.append('idBack', cIdBack);
            if (cShopPhoto) formData.append('shopPhoto', cShopPhoto);
            if (hasCertificate && cCertificate) formData.append('certificate', cCertificate);

            const endpoint = isUpdate ? `${BACKEND_URL}/update-registration` : `${BACKEND_URL}/register-interest`;
            const fallbackEndpoint = isUpdate ? `${BACKEND_URL}/shops/update-registration` : `${BACKEND_URL}/shops/register-interest`;
            const method = isUpdate ? axios.put : axios.post;

            try {
                await method(endpoint, formData, { headers: { 'Authorization': `Bearer ${token}` } });
            } catch (firstErr) {
                if (firstErr.response?.status === 404) {
                    await method(fallbackEndpoint, formData, { headers: { 'Authorization': `Bearer ${token}` } });
                } else {
                    throw firstErr;
                }
            }

            sessionStorage.removeItem(DRAFT_STORAGE_KEY);
            setSuccessModal(true);
        } catch (error) {
            const code = error.response?.data?.code;
            const errorMsg = error.response?.data?.message || error.message || 'Something went wrong.';
            setFormError(`❌ ${errorMsg}`);

            if (code === 'NAME_RESERVED') setNameStatus('reserved');
            else if (code === 'NAME_BLOCKED') setNameStatus('blocked');
            else if (code === 'NAME_TAKEN') setNameStatus('taken');

            if (STEP2_ERROR_CODES.includes(code) || /taken|unique|similar|reserved/i.test(errorMsg)) {
                setCurrentStep(2);
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        } finally {
            setSubmitting(false);
        }
    };

    const handleSuccessClose = () => {
        setSuccessModal(false);
        setIsUpdate(true);
        setAdminMessage(null);
        setIdFront(null);
        setIdBack(null);
        setShopPhoto(null);
        setCertificate(null);
        setCurrentStep(1);
        setViewState('pending');
        window.scrollTo(0, 0);
    };

    if (viewState === 'loading') {
        return <div style={{textAlign: 'center', padding: '100px', color: '#334155'}}><Loader className="spin" size={30}/></div>;
    }

    if (viewState === 'pending') {
        return (
            <div style={styles.page}>
                <div style={styles.container}>
                    <div style={styles.headerBar}>
                        <button onClick={() => navigate('/')} style={styles.backBtn}><ArrowLeft size={18} /> Home</button>
                        <button onClick={toggleLanguage} style={styles.langBtn}>
                            <Globe size={15} /> {lang === 'en' ? 'తెలుగు' : 'English'}
                        </button>
                    </div>
                    <div style={{...styles.card, textAlign: 'center', marginTop: '25px', padding: '40px 24px'}}>
                        <ShieldCheck size={60} color="#f59e0b" style={{marginBottom: '16px'}} />
                        <h2 style={{margin: '0 0 10px 0', color: '#b45309', fontSize: '22px'}}>Application Under Review</h2>
                        
                        {adminMessage ? (
                            <div style={{ background: '#fef2f2', border: '2px solid #ef4444', padding: '15px', borderRadius: '12px', marginTop: '15px', marginBottom: '15px' }}>
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
                        
                        <div style={{display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '25px', flexWrap: 'wrap'}}>
                            <button onClick={() => navigate('/')} style={{...styles.submitFormBtn, width: 'auto', padding: '12px 26px', background: '#e2e8f0', color: '#0f172a', boxShadow: 'none'}}>Home</button>
                            <button onClick={() => setViewState('form')} style={{...styles.submitFormBtn, width: 'auto', padding: '12px 26px', background: '#2563eb'}}>{t.editTitle}</button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const parsedZones = parseDeliveryZones(regForm.delivery_areas);

    return (
        <div style={styles.page}>
            <style>{`
                .spin { animation: spin 1s linear infinite; }
                @keyframes spin { 100% { transform: rotate(360deg); } }
                .pulse-error { animation: pulseError 1.5s infinite; }
                @keyframes pulseError { 0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); } 70% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); } 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); } }
                .touch-scale { transition: transform 0.15s; }
                .touch-scale:active { transform: scale(0.96); }
            `}</style>
            
            <div style={styles.container}>
                {/* HEADER WITH BILINGUAL SWITCHER */}
                <div style={styles.headerBar}>
                    {isUpdate ? (
                        <button onClick={() => setViewState('pending')} style={styles.backBtn}><X size={18} /> Cancel</button>
                    ) : (
                        <button onClick={() => currentStep === 1 ? navigate('/') : handlePrevStep()} style={styles.backBtn}>
                            <ArrowLeft size={18} /> {t.btnBack}
                        </button>
                    )}
                    <h2 style={{ margin: 0, color: '#1e3a8a', display: 'flex', alignItems: 'center', gap: '6px', fontSize: isMobile ? '15px' : '19px', fontWeight: '900' }}>
                        <Store size={18} /> {isUpdate ? t.editTitle : t.title}
                    </h2>
                    <button type="button" onClick={toggleLanguage} style={styles.langBtn}>
                        <Globe size={14} /> {lang === 'en' ? 'తెలుగు' : 'EN'}
                    </button>
                </div>

                {/* DRAFT RESTORED INDICATOR */}
                {draftRestoredBanner && !isUpdate && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '8px 12px', borderRadius: '10px', marginBottom: '12px', fontSize: '12px', color: '#166534', fontWeight: '800' }}>
                        <span>{t.draftRestored}</span>
                        <button type="button" onClick={handleClearDraft} style={{ background: 'white', border: '1px solid #86efac', color: '#15803d', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <RotateCcw size={11}/> {t.clearDraft}
                        </button>
                    </div>
                )}

                {/* STEP PROGRESS BARS */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '16px' }}>
                    {[1, 2, 3].map(stepNum => (
                        <div key={stepNum} style={{ height: '6px', width: '32%', background: currentStep >= stepNum ? '#10b981' : '#e2e8f0', borderRadius: '10px', transition: '0.3s' }}></div>
                    ))}
                </div>

                {formError && (
                    <div className="pulse-error" style={{ background: '#fef2f2', border: '1px solid #ef4444', color: '#b91c1c', padding: '14px', borderRadius: '12px', marginBottom: '16px', display: 'flex', alignItems: 'flex-start', gap: '10px', fontWeight: 'bold', fontSize: '13.5px' }}>
                        <AlertCircle size={20} color="#ef4444" style={{flexShrink: 0}} />
                        <span>{formError}</span>
                    </div>
                )}

                <div style={styles.card}>
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                        
                        {/* 🟢 STEP 1 - STRUCTURE & MAP LOCATIONS */}
                        {currentStep === 1 && (
                            <div style={styles.sectionBox}>
                                <label style={{...styles.sectionTitle, fontSize: '17px'}}>{t.sec1Title}</label>
                                
                                <label style={styles.label}>{t.typeQ}</label>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '6px' }}>
                                    <button type="button" onClick={() => setRegForm({...regForm, shop_type: 'Products'})} style={regForm.shop_type === 'Products' ? styles.optionActive : styles.optionInactive}>
                                        <Package size={18}/> {t.optProducts}
                                    </button>
                                    <button type="button" onClick={() => setRegForm({...regForm, shop_type: 'Services'})} style={regForm.shop_type === 'Services' ? styles.optionActive : styles.optionInactive}>
                                        <Wrench size={18}/> {t.optServices}
                                    </button>
                                </div>

                                <label style={{...styles.label, marginTop: '18px', display: 'block'}}>{t.modeQ}</label>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '6px' }}>
                                    <button type="button" onClick={() => handleWorkModeChange('physical')} style={workMode === 'physical' ? styles.optionActive : styles.optionInactive}>
                                        <Building size={18}/> {t.optPhysical}
                                    </button>
                                    <button type="button" onClick={() => handleWorkModeChange('home')} style={workMode === 'home' ? styles.optionActive : styles.optionInactive}>
                                        <Home size={18}/> {t.optHome}
                                    </button>
                                </div>

                                {/* 🟢 SHOP LOCATION (LOCKED TO MAP SEARCH) */}
                                <div style={{...styles.inputGroup, marginTop: '18px'}}>
                                    <label style={styles.label}>{t.location}</label>
                                    <div 
                                        onClick={() => setShowLocModal('location')} 
                                        style={{...styles.input, background: '#ffffff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', border: '1.5px solid #bfdbfe'}}
                                    >
                                        <span style={{ fontSize: '13.5px', color: regForm.location ? '#0f172a' : '#94a3b8', fontWeight: regForm.location ? '700' : '500' }}>
                                            {regForm.location || t.locationSearchMsg}
                                        </span>
                                        <MapPin size={18} color="#2563eb" style={{ flexShrink: 0 }} />
                                    </div>
                                </div>

                                {/* 🟢 DELIVERY AREAS (1st-Word + Sub-Address Chips) */}
                                <div style={{...styles.inputGroup, marginTop: '15px'}}>
                                    <label style={styles.label}>{t.deliveryAreas}</label>
                                    <div 
                                        style={{...styles.input, background: '#ffffff', cursor: 'pointer', minHeight: '52px', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '6px', border: '1.5px solid #86efac'}}
                                        onClick={() => setShowLocModal('delivery')}
                                    >
                                        {parsedZones.length > 0 ? (
                                            parsedZones.map((zone, idx) => (
                                                <span key={idx} style={{ background: '#dcfce7', color: '#166534', padding: '6px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid #86efac' }}>
                                                    <span>
                                                        {zone.primary} {zone.sub && <span style={{ fontSize: '10px', opacity: 0.85 }}>({zone.sub})</span>}
                                                    </span>
                                                    <X size={14} onClick={(e) => {
                                                        e.stopPropagation();
                                                        const remaining = parsedZones.filter((_, i) => i !== idx).map(z => z.full);
                                                        setRegForm({...regForm, delivery_areas: remaining.join(' | ')});
                                                    }} />
                                                </span>
                                            ))
                                        ) : (
                                            <span style={{color: '#64748b', fontSize: '13.5px', fontWeight: '600'}}>🚚 {t.deliverySearchMsg}</span>
                                        )}
                                    </div>
                                    <p style={{fontSize:'11px', color:'#64748b', margin:0}}>
                                        1st word is matched as priority with sub-address verification. Leave blank to deliver everywhere.
                                    </p>
                                </div>

                                <button type="button" onClick={handleNextStep} style={{...styles.submitFormBtn, marginTop: '22px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px'}}>
                                    {t.btnNext} <ArrowRight size={18} />
                                </button>
                            </div>
                        )}

                        {/* 🟢 STEP 2 - BUSINESS DETAILS & LIVE DISTINCT NAME CHECKER */}
                        {currentStep === 2 && (
                            <div style={styles.sectionBox}>
                                <label style={{...styles.sectionTitle, fontSize: '17px'}}>{t.sec2Title}</label>
                                
                                <div style={styles.inputGroup}>
                                    <label style={styles.label}>{t.bizName}</label>
                                    <input 
                                        type="text" 
                                        placeholder="e.g. Sri Lakshmi Fancy & General"
                                        style={{
                                            ...styles.input, 
                                            borderColor: nameBlocked ? '#ef4444' : nameStatus === 'available' ? '#10b981' : '#cbd5e1',
                                            boxShadow: nameBlocked ? '0 0 0 3px rgba(239, 68, 68, 0.15)' : 'none',
                                            fontWeight: '700'
                                        }} 
                                        value={regForm.businessName} 
                                        onChange={e => setRegForm({...regForm, businessName: e.target.value})} 
                                    />
                                    
                                    {nameStatus === 'loading' && <span style={{fontSize: '12px', color: '#64748b', display:'flex', alignItems: 'center', gap:'5px', marginTop:'4px'}}><Loader size={14} className="spin"/> {t.checkingName}</span>}
                                    {nameStatus === 'available' && <span style={{fontSize: '12px', color: '#10b981', fontWeight: '800', display:'flex', alignItems: 'center', gap:'5px', marginTop:'4px'}}><Check size={14}/> {t.nameAvailable}</span>}
                                    
                                    {(nameStatus === 'reserved' || nameStatus === 'blocked') && (
                                        <div style={{fontSize: '12px', color: '#dc2626', fontWeight: '800', background: '#fef2f2', padding: '10px', borderRadius: '8px', border: '1px solid #fca5a5', marginTop:'4px'}}>
                                            {nameStatusMsg || (nameStatus === 'reserved' ? t.nameReserved : t.nameBlocked)}
                                        </div>
                                    )}

                                    {nameStatus === 'taken' && (
                                        <div style={{fontSize: '12px', color: '#b91c1c', fontWeight: '800', background: '#fef2f2', padding: '12px', borderRadius: '10px', border: '1px solid #fca5a5', marginTop:'4px'}}>
                                            <div>{nameStatusMsg || t.nameTaken}</div>
                                            {nameSuggestions.length > 0 && (
                                                <div style={{display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '10px'}}>
                                                    {nameSuggestions.map((sug, i) => (
                                                        <span 
                                                            key={i} 
                                                            onClick={() => setRegForm({...regForm, businessName: sug})} 
                                                            style={{background: '#ffffff', color: '#1e3a8a', padding: '7px 12px', borderRadius: '15px', cursor: 'pointer', border: '1.5px solid #3b82f6', fontWeight: '900', fontSize: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)'}}
                                                        >
                                                            ✨ {sug}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* CATEGORIES */}
                                <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '15px' }}>
                                    <label style={styles.label}>{t.catType}</label>
                                    
                                    {selectedCategories.length > 0 && (
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '6px' }}>
                                            {selectedCategories.map((cat, idx) => (
                                                <span key={idx} style={{ background: '#dbeafe', color: '#1e3a8a', padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px' }}>
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
                                            onKeyDown={(e) => { if (e.key === 'Enter' && catInput) { e.preventDefault(); addCategory(catInput); } }}
                                        />
                                        <button type="button" onClick={() => { if (catInput) addCategory(catInput); }} style={{ background: '#2563eb', border: 'none', color: 'white', padding: '0 16px', borderRadius: '10px', cursor: 'pointer' }}><Plus size={20}/></button>
                                    </div>

                                    {catSuggestions.length > 0 && (
                                        <div style={styles.dropdown}>
                                            {catSuggestions.map((cat, idx) => (
                                                <div key={idx} onClick={() => addCategory(cat)} style={styles.dropdownItem}>{cat}</div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* OWNER NAME & PHONE */}
                                <div style={{...styles.inputGroup, marginTop: '15px'}}>
                                    <label style={styles.label}>{t.namePhone}</label>
                                    <div style={isMobile ? styles.btnGridMobile : styles.btnGridDesktop}>
                                        <input type="text" placeholder="Your Full Name" style={styles.input} value={regForm.name} onChange={e => setRegForm({...regForm, name: e.target.value})} />
                                        <input 
                                            type="tel" 
                                            maxLength={10} 
                                            style={styles.input} 
                                            placeholder="10-Digit Mobile Number"
                                            value={regForm.phone} 
                                            onChange={e => setRegForm({...regForm, phone: e.target.value.replace(/\D/g, '')})} 
                                        />
                                    </div>
                                </div>

                                {/* FOUNDER & CEO NAME */}
                                <div style={{...styles.inputGroup, marginTop: '15px'}}>
                                    <label style={styles.label}>{t.founderCeo}</label>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                        <input type="text" placeholder="Founder Name" style={styles.input} value={regForm.founder_name} onChange={e => setRegForm({...regForm, founder_name: e.target.value})} />
                                        <input type="text" placeholder="CEO Name" style={styles.input} value={regForm.ceo_name} onChange={e => setRegForm({...regForm, ceo_name: e.target.value})} />
                                    </div>
                                </div>

                                <div style={{display: 'flex', gap: '10px', marginTop: '22px'}}>
                                    <button type="button" onClick={handlePrevStep} style={{...styles.submitFormBtn, flex: 1, background: '#e2e8f0', color: '#0f172a', boxShadow: 'none'}}>
                                        {t.btnBack}
                                    </button>
                                    <button type="button" onClick={handleNextStep} style={{...styles.submitFormBtn, flex: 2, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px'}}>
                                        {t.btnNext} <ArrowRight size={18} />
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* 🟢 STEP 3 - VERIFICATIONS & EVIDENCE */}
                        {currentStep === 3 && (
                            <div style={{...styles.sectionBox, background: '#eff6ff', borderColor: '#bfdbfe'}}>
                                <label style={{...styles.sectionTitle, color: '#1e3a8a', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '17px'}}>
                                    <ShieldCheck size={20} /> {t.sec3Title}
                                </label>
                                
                                {isUpdate && <p style={{fontSize: '12px', color: '#10b981', fontWeight: 'bold', margin: '0 0 15px 0'}}>Note: Leave file uploads empty to keep your existing documents.</p>}
                                
                                <div style={{ background: 'white', padding: '16px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '14px', border: '1px solid #93c5fd' }}>
                                    <h4 style={{ margin: 0, color: '#1e40af', fontSize: '14.5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <Lock size={16}/> {t.govIdBox}
                                    </h4>
                                    <p style={{fontSize: '11.5px', color: '#64748b', margin: '-6px 0 4px 0'}}>{t.secureUpload}</p>
                                    
                                    <div style={isMobile ? styles.btnGridMobile : styles.btnGridDesktop}>
                                        <div style={{...styles.uploadBox, border: (!isUpdate && !idFront) ? '2px dashed #ef4444' : '2px solid #10b981', background: idFront ? '#f0fdf4' : '#fafafa'}}>
                                            <label style={styles.uploadLabel}><Upload size={15}/> {t.frontId}</label>
                                            <input type="file" accept="image/*,application/pdf" onChange={e => handleFileChange(e, setIdFront, true)} style={{fontSize: '12px'}} />
                                            {idFront && <span style={{fontSize: '11px', color: '#15803d', fontWeight: '800'}}>✓ Ready: {idFront.name}</span>}
                                        </div>
                                        <div style={{...styles.uploadBox, border: (!isUpdate && !idBack) ? '2px dashed #ef4444' : '2px solid #10b981', background: idBack ? '#f0fdf4' : '#fafafa'}}>
                                            <label style={styles.uploadLabel}><Upload size={15}/> {t.backId}</label>
                                            <input type="file" accept="image/*,application/pdf" onChange={e => handleFileChange(e, setIdBack, true)} style={{fontSize: '12px'}} />
                                            {idBack && <span style={{fontSize: '11px', color: '#15803d', fontWeight: '800'}}>✓ Ready: {idBack.name}</span>}
                                        </div>
                                    </div>
                                </div>

                                {workMode === 'physical' && (
                                    <div style={{ marginTop: '14px', background: 'white', padding: '16px', borderRadius: '12px', border: '1px solid #93c5fd' }}>
                                        <h4 style={{ margin: '0 0 6px 0', color: '#1e40af', fontSize: '14.5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <Store size={16}/> {t.shopPhoto}
                                        </h4>
                                        <p style={styles.infoText}><Info size={14}/> {t.infoShop}</p>
                                        <div style={{...styles.uploadBox, border: (!isUpdate && !shopPhoto) ? '2px dashed #ef4444' : '2px solid #10b981', background: shopPhoto ? '#f0fdf4' : '#fafafa'}}>
                                            <input type="file" accept="image/*" onChange={e => handleFileChange(e, setShopPhoto, false)} style={{fontSize: '12px'}} />
                                            {shopPhoto && <span style={{fontSize: '11px', color: '#15803d', fontWeight: '800'}}>✓ Ready: {shopPhoto.name}</span>}
                                        </div>
                                    </div>
                                )}

                                <div style={{ background: 'white', padding: '16px', borderRadius: '12px', border: '1px solid #93c5fd', marginTop: '14px' }}>
                                    <h4 style={{ margin: '0 0 8px 0', color: '#1e40af', fontSize: '14.5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        📜 {t.bizCert}
                                    </h4>
                                    <div style={{...styles.uploadBox, border: '2px solid #cbd5e1', opacity: !hasCertificate ? 0.4 : 1}}>
                                        <input type="file" accept="image/*,application/pdf" disabled={!hasCertificate} onChange={e => handleFileChange(e, setCertificate, true)} style={{fontSize: '12px'}} />
                                        {certificate && <span style={{fontSize: '11px', color: '#15803d', fontWeight: '800'}}>✓ Ready: {certificate.name}</span>}
                                    </div>
                                    <label style={{display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px', fontSize: '13.5px', color: '#334155', cursor: 'pointer', fontWeight: '800'}}>
                                        <input type="checkbox" checked={!hasCertificate} onChange={() => {setHasCertificate(!hasCertificate); setCertificate(null);}} style={{width: '18px', height: '18px'}} />
                                        {t.noCert}
                                    </label>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', background: '#fffbeb', border: '1px solid #fcd34d', padding: '14px', borderRadius: '12px', marginTop: '16px' }}>
                                    <ShieldAlert size={22} color="#d97706" style={{flexShrink: 0}} />
                                    <p style={{ margin: 0, fontSize: '11.5px', color: '#b45309', fontWeight: '700', lineHeight: '1.5' }}>
                                        {t.legalWarning}
                                    </p>
                                </div>

                                <div style={{display: 'flex', gap: '10px', marginTop: '20px'}}>
                                    <button type="button" onClick={handlePrevStep} style={{...styles.submitFormBtn, flex: 1, background: '#e2e8f0', color: '#0f172a', boxShadow: 'none'}}>
                                        {t.btnBack}
                                    </button>
                                    <button type="submit" disabled={submitting || nameBlocked} style={{...styles.submitFormBtn, flex: 2, background: nameBlocked ? '#94a3b8' : 'linear-gradient(135deg, #10b981, #059669)'}}>
                                        {isUpdate ? t.btnUpdate : t.btnSubmit}
                                    </button>
                                </div>
                            </div>
                        )}

                    </form>
                </div>
            </div>

            {/* 🟢 MAP SEARCH MODAL WITH QUICK STATE / ALL-INDIA PRESETS */}
            {showLocModal && (
                <div style={styles.overlay}>
                    <div className="touch-scale" style={styles.locModal}>
                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px'}}>
                            <h3 style={{margin: 0, fontSize: '17px', color: '#0f172a', fontWeight: '900'}}>
                                {showLocModal === 'location' ? '📍 Search Shop Location' : '🚚 Add Delivery Area'}
                            </h3>
                            <X size={20} style={{cursor: 'pointer', color: '#64748b'}} onClick={closeLocModal} />
                        </div>

                        {showLocModal === 'delivery' && (
                            <div style={{ display: 'flex', gap: '8px', marginBottom: '10px', flexWrap: 'wrap' }}>
                                <button type="button" onClick={() => selectCustomLocation({ display_name: 'Andhra Pradesh, India' })} style={{ background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', padding: '6px 12px', borderRadius: '16px', fontSize: '11.5px', fontWeight: '800', cursor: 'pointer' }}>
                                    + Entire Andhra Pradesh
                                </button>
                                <button type="button" onClick={() => selectCustomLocation({ display_name: 'India' })} style={{ background: '#f0fdf4', color: '#15803d', border: '1px solid #86efac', padding: '6px 12px', borderRadius: '16px', fontSize: '11.5px', fontWeight: '800', cursor: 'pointer' }}>
                                    + All India
                                </button>
                            </div>
                        )}

                        <div style={{position: 'relative', marginTop: '6px'}}>
                            <Search size={18} color="#94a3b8" style={{position: 'absolute', left: '12px', top: '14px'}} />
                            <input 
                                type="text" 
                                placeholder="Search village, mandal, district, or pincode..." 
                                style={styles.locInput} 
                                value={locSearch} 
                                onChange={(e) => setLocSearch(e.target.value)} 
                                autoFocus
                            />
                            {isSearching && <Loader size={16} className="spin" color="#2563eb" style={{position: 'absolute', right: '12px', top: '14px'}} />}
                        </div>

                        {locResults.length > 0 && (
                            <div style={styles.locResultsBox}>
                                {locResults.map((loc, i) => {
                                    const parts = loc.display_name.split(',').map(p => p.trim());
                                    const primary = parts[0];
                                    const sub = parts.slice(1).join(', ');
                                    return (
                                        <div key={i} className="touch-scale" style={styles.locItem} onClick={() => selectCustomLocation(loc)}>
                                            <MapPin size={16} color="#2563eb" style={{flexShrink: 0, marginTop: '2px'}} />
                                            <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
                                                <span style={{fontSize: '14px', fontWeight: '800', color: '#0f172a'}}>{primary}</span>
                                                <span style={{fontSize: '11.5px', color: '#64748b'}}>{sub}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {submitting && (
                <div style={styles.overlay}>
                    <div style={styles.modal}>
                        <Loader className="spin" size={50} color="#3b82f6" style={{marginBottom: '15px'}} />
                        <h2 style={{margin: '0', color: '#1e3a8a', fontSize: '18px'}}>{t.processing}</h2>
                    </div>
                </div>
            )}

            {successModal && (
                <div style={styles.overlay}>
                    <div style={{...styles.modal, background: '#f0fdf4', border: '2px solid #22c55e'}}>
                        <CheckCircle size={50} color="#16a34a" style={{marginBottom: '15px'}} />
                        <h2 style={{margin: '0 0 10px 0', color: '#166534', fontSize: '20px'}}>{isUpdate ? t.updateSuccess : t.success}</h2>
                        <button onClick={handleSuccessClose} style={{...styles.submitFormBtn, background: '#16a34a', marginTop: '15px'}}>Got it</button>
                    </div>
                </div>
            )}
        </div>
    );
};

const styles = {
    page: { background: '#f8fafc', minHeight: '100vh', padding: '12px', boxSizing: 'border-box', fontFamily: 'Inter, sans-serif' },
    container: { maxWidth: '600px', margin: '0 auto', paddingBottom: '40px' },
    headerBar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '14px' },
    backBtn: { background: 'white', border: '1px solid #cbd5e1', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: '800', color: '#0f172a', fontSize: '12.5px' },
    langBtn: { background: '#eff6ff', border: '1px solid #bfdbfe', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: '900', color: '#1d4ed8', fontSize: '12px' },
    card: { background: 'white', padding: '16px', borderRadius: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.04)', border: '1px solid #e2e8f0', boxSizing: 'border-box' },
    
    sectionBox: { background: '#f8fafc', border: '1px solid #e2e8f0', padding: '16px', borderRadius: '14px', boxSizing: 'border-box' },
    sectionTitle: { fontSize: '15px', fontWeight: '900', color: '#0f172a', display: 'block', marginBottom: '16px', borderBottom: '2px solid #e2e8f0', paddingBottom: '8px' },
    infoText: { display: 'flex', alignItems: 'flex-start', gap: '6px', fontSize: '12.5px', color: '#2563eb', marginBottom: '10px', fontWeight: '700', lineHeight: '1.4' },
    
    btnGridDesktop: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', width: '100%' },
    btnGridMobile: { display: 'grid', gridTemplateColumns: '1fr', gap: '10px', width: '100%' },
    optionActive: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', background: '#eff6ff', border: '2px solid #2563eb', color: '#1e3a8a', padding: '12px 10px', borderRadius: '10px', fontWeight: '800', cursor: 'pointer', fontSize: '13.5px' },
    optionInactive: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', background: '#ffffff', border: '1px solid #cbd5e1', color: '#64748b', padding: '12px 10px', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', fontSize: '13.5px' },

    inputGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
    label: { fontSize: '13px', fontWeight: '800', color: '#334155' },
    input: { padding: '12px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', background: '#ffffff', outline: 'none', width: '100%', boxSizing: 'border-box' },
    
    dropdown: { position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '1px solid #cbd5e1', borderRadius: '10px', marginTop: '4px', zIndex: 20, boxShadow: '0 10px 25px rgba(0,0,0,0.12)', maxHeight: '190px', overflowY: 'auto' },
    dropdownItem: { padding: '12px 15px', borderBottom: '1px solid #f1f5f9', cursor: 'pointer', fontSize: '13.5px', fontWeight: '700', color: '#0f172a' },
    
    uploadBox: { padding: '12px', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '6px' },
    uploadLabel: { fontSize: '13px', fontWeight: '800', color: '#334155', display: 'flex', alignItems: 'center', gap: '5px' },
    
    submitFormBtn: { padding: '14px', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: 'white', fontWeight: '900', fontSize: '15px', cursor: 'pointer', boxShadow: '0 4px 15px rgba(37, 99, 235, 0.25)', width: '100%' },
    
    overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15,23,42,0.7)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', zIndex: 1000 },
    modal: { background: 'white', padding: '32px 24px', borderRadius: '20px', textAlign: 'center', maxWidth: '380px', width: '100%', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', display: 'flex', flexDirection: 'column', alignItems: 'center' },
    locModal: { background: 'white', padding: '20px', borderRadius: '20px', maxWidth: '400px', width: '100%', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.15)', boxSizing: 'border-box' },
    locInput: { padding: '12px 12px 12px 38px', borderRadius: '12px', border: '2px solid #2563eb', fontSize: '14px', width: '100%', boxSizing: 'border-box', outline: 'none' },
    locResultsBox: { marginTop: '12px', maxHeight: '220px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '12px' },
    locItem: { padding: '10px 12px', borderBottom: '1px solid #f1f5f9', cursor: 'pointer', display: 'flex', alignItems: 'flex-start', gap: '10px' }
};

export default BusinessRegistration;