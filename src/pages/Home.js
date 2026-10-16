import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { Search, User, X, MapPin, Package, Home as HomeIcon, Store, LayoutDashboard, ShieldCheck, Sparkles, Folder, ArrowLeft, Grid, ChevronRight, Globe, Edit3, Trash2, BadgeCheck, Megaphone, Bot, ExternalLink } from 'lucide-react'; 
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify'; 
import ProductCard from '../components/ProductCard';
import { AppContext, socket } from '../context/AppContext'; 
import AppPermissions from '../components/AppPermissions';

const getBackendUrl = () => {
    const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    return isLocal ? 'http://localhost:5000/api' : 'https://bhavyams-vendorhub-backend.onrender.com/api';
};

const getOptimizedImage = (url) => {
    if (!url) return null;
    if (url.includes('cloudinary.com') && !url.includes('q_auto') && !url.endsWith('.gif')) {
        return url.replace('/upload/', '/upload/q_auto,f_auto,w_700/');
    }
    return url; 
};

// 🟢 BILINGUAL TELUGU-TO-ENGLISH CANONICAL MAPPER
const TELUGU_TO_EN_MAP = {
    'కోణంకి': 'konanki', 'మార్టూరు': 'martur', 'బాపట్ల': 'bapatla',
    'తిరుపతి': 'tirupati', 'ఆంధ్రప్రదేశ్': 'andhra pradesh', 'గుంటూరు': 'guntur',
    'విజయవాడ': 'vijayawada', 'ఒంగోలు': 'ongole', 'చీరాల': 'chirala', 'చిరాల': 'chirala',
    'ప్రకాశం': 'prakasam', 'ఇండియా': 'india', 'భారతదేశం': 'india'
};

const normalizeLocationText = (text) => {
    if (!text) return '';
    let lower = String(text).toLowerCase();
    Object.keys(TELUGU_TO_EN_MAP).forEach(teWord => {
        if (lower.includes(teWord)) {
            lower = lower.replace(new RegExp(teWord, 'g'), TELUGU_TO_EN_MAP[teWord]);
        }
    });
    return lower;
};

// 🟢 PARSE DELIVERY ZONES
const parseDeliveryZones = (rawAreas) => {
    if (!rawAreas || rawAreas.trim() === '' || rawAreas.trim().toLowerCase() === 'all') {
        return [{ full: 'All India', primary: 'All', sub: '' }];
    }
    if (rawAreas.includes('|')) {
        return rawAreas.split('|').map(z => z.trim()).filter(Boolean).map(zone => {
            const parts = zone.split(',').map(p => p.trim()).filter(Boolean);
            return { full: zone, primary: parts[0] || zone, sub: parts.slice(1, 3).join(', ') };
        });
    }
    const commaParts = rawAreas.split(',').map(p => p.trim()).filter(Boolean);
    const looksLikeSingleHierarchy = commaParts.length >= 3 && (
        rawAreas.toLowerCase().includes('india') ||
        rawAreas.toLowerCase().includes('andhra pradesh') ||
        /\b\d{6}\b/.test(rawAreas)
    );
    if (looksLikeSingleHierarchy) {
        return [{ full: rawAreas.trim(), primary: commaParts[0], sub: commaParts.slice(1, 3).join(', ') }];
    }
    return commaParts.map(p => ({ full: p, primary: p, sub: '' }));
};

// 🟢 1ST-WORD PRIORITY + SUB-ADDRESS DELIVERY MATCHER
const doesShopDeliverToSelectedArea = (selectedAreaRaw, rawDeliveryAreas) => {
    const zones = parseDeliveryZones(rawDeliveryAreas);
    if (zones.some(z => ['all', 'india', 'all india'].includes(z.primary.toLowerCase()))) {
        return true;
    }
    if (!selectedAreaRaw) return true;

    const normUserFull = normalizeLocationText(selectedAreaRaw);
    const userTokens = normUserFull.split(/[,]+/).map(s => s.trim()).filter(Boolean);

    return zones.some(zone => {
        const normPrimary = normalizeLocationText(zone.primary);
        if (!normPrimary) return false;

        const hasPrimaryMatch = userTokens.some(t => t === normPrimary || t.includes(normPrimary)) || normUserFull.includes(normPrimary);
        if (!hasPrimaryMatch) return false;

        const zoneParts = normalizeLocationText(zone.full)
            .split(',')
            .map(s => s.trim())
            .filter(s => s && s !== 'india' && !/^\d+$/.test(s) && !s.includes('pincode'));

        if (zoneParts.length > 1 && userTokens.length > 1) {
            const subParts = zoneParts.slice(1);
            return subParts.some(sub => normUserFull.includes(sub));
        }
        return true;
    });
};

// 🟢 DEFAULT FLIPKART-STYLE BANNERS (Preserved alongside Admin banners)
const DEFAULT_BANNERS = [
    {
        id: 'default-1',
        title_en: 'Subhams Hub Official Store',
        title_te: 'సుభమ్స్ హబ్ అధికారిక స్టోర్',
        subtitle_en: 'Verified local shopping, services & direct bookings at zero commission.',
        subtitle_te: 'వెరిఫైడ్ లోకల్ షాపింగ్, సర్వీసులు & డైరెక్ట్ బుకింగ్స్.',
        badge_text: '🌟 OFFICIAL GOLD',
        media_url: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=900&q=80',
        action_url: '/shop/1',
        ambient_color: '#1e1b4b',
        accent_color: '#facc15'
    },
    {
        id: 'default-2',
        title_en: 'Explore Subhams Expo Live Feed',
        title_te: 'సుభమ్స్ ఎక్స్‌పో లైవ్ ఫీడ్ చూడండి',
        subtitle_en: 'Watch real product videos, latest shop offers & local updates.',
        subtitle_te: 'నిజమైన ఉత్పత్తి వీడియోలు, తాజా షాప్ ఆఫర్లు & అప్‌డేట్‌లు.',
        badge_text: '🔥 LIVE EXPO',
        media_url: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=900&q=80',
        action_url: '/expo',
        ambient_color: '#064e3b',
        accent_color: '#34d399'
    },
    {
        id: 'default-3',
        title_en: 'Launch Your Digital Showroom',
        title_te: 'మీ వ్యాపారాన్ని ఆన్‌లైన్‌లో నమోదు చేయండి',
        subtitle_en: 'Get your Green Verified Badge and reach customers across your delivery zones.',
        subtitle_te: 'గ్రీన్ వెరిఫైడ్ బ్యాడ్జ్ పొందండి మరియు మీ డెలివరీ ప్రాంతాలకు చేరుకోండి.',
        badge_text: '🚀 FOR BUSINESSES',
        media_url: 'https://images.unsplash.com/photo-1556740738-b6a63e27c4df?auto=format&fit=crop&w=900&q=80',
        action_url: '/register-business',
        ambient_color: '#3b0764',
        accent_color: '#c084fc'
    }
];

const DEFAULT_SMART_PILL = {
    pill_title_en: 'Subhams Hub Official Store!',
    pill_title_te: 'సుభమ్స్ హబ్ అధికారిక స్టోర్!',
    cta_en: 'Explore',
    cta_te: 'తెరువు',
    action_url: '/expo',
    admin_note_en: 'Welcome to Subhams Hub! Use the Area button inside the purple showcase box to check which verified shops deliver to your village or town.',
    admin_note_te: 'సుభమ్స్ హబ్‌కు స్వాగతం! ఏ ఊరికైనా డెలివరీ చేసే షాపులను సులభంగా చూడవచ్చు.',
    is_active: true
};

const homeTranslations = {
    en: { 
        searchFor: "Search shops, categories & items...",
        searchResults: "Search Results for", 
        topTrending: "Top Trending & Local Deals",
        browse: "Browse", 
        sellers: "Sellers",
        open: "Open",
        closed: "Closed",
        localArea: "Delivering to:",
        allTrendingTab: "All Trending",
        home: "Home",
        dashboard: "Dashboard",
        shopOrders: "Shop",
        orders: "Orders", 
        expo: "Expo",
        profile: "Profile",
        admin: "Admin",
        explore: "Quick Explore",
        officialShop: "Subhams Store",
        usefulApps: "Subhams Ecosystem",
        pmms: "Subhams PMMS", 
        agent: "Subhams Agent",
        network: "Subhams Network",
        viewAll: "Grid View",
        lineView: "Auto-Line",
        checkAreaModalTitle: "🚚 Check Delivery Area",
        checkAreaModalSub: "Search any village, mandal, district, or state to discover shops delivering there.",
        manageBanners: "Banners & Ads",
        tabNames: {
            Expo: "Expo",
            Trending: "Trending",
            Shopping: "Shopping",
            Services: "Services",
            Business: "Business"
        }
    },
    te: { 
        searchFor: "దుకాణాలు, వస్తువుల కోసం వెతకండి...",
        searchResults: "దీని కోసం శోధన ఫలితాలు", 
        topTrending: "టాప్ ట్రెండింగ్ & లోకల్ షాపులు",
        browse: "బ్రౌజ్ చేయండి", 
        sellers: "విక్రేతలు",
        open: "తెరిచి ఉంది",
        closed: "మూసివేయబడింది",
        localArea: "డెలివరీ ఏరియా:",
        allTrendingTab: "అన్ని ట్రెండింగ్",
        home: "హోమ్",
        dashboard: "డాష్‌బోర్డ్",
        shopOrders: "షాప్",
        orders: "ఆర్డర్‌లు", 
        expo: "ఎక్స్‌పో",
        profile: "ప్రొఫైల్",
        admin: "అడ్మిన్",
        explore: "త్వరిత అన్వేషణ", 
        usefulApps: "సుభమ్స్ ఎకోసిస్టమ్",
        officialShop: "సుభమ్స్ స్టోర్",
        pmms: "సుభమ్స్ PMMS", 
        agent: "సుభమ్స్ ఏజెంట్",
        network: "సుభమ్స్ నెట్‌‌వర్క్",
        viewAll: "గ్రిడ్ వ్యూ",
        lineView: "లైన్ వ్యూ",
        checkAreaModalTitle: "🚚 డెలివరీ ప్రాంతాన్ని తనిఖీ చేయండి",
        checkAreaModalSub: "ఏ గ్రామం, మండలం, జిల్లా లేదా రాష్ట్రానికైనా డెలివరీ చేసే షాపులను చూడటానికి ఇక్కడ వెతకండి.",
        manageBanners: "బ్యానర్లు & యాడ్స్",
        tabNames: {
            Expo: "ఎక్స్‌పో",
            Trending: "ట్రెండింగ్",
            Shopping: "షాపింగ్",
            Services: "సర్వీసులు",
            Business: "వ్యాపారం"
        }
    }
};

const categoryTranslations = {
    'Vegetables': 'కూరగాయలు', 'Fruits': 'పండ్లు', 'Groceries': 'కిరాణా', 'Electronics': 'ఎలక్ట్రానిక్స్',
    'Clothing': 'బట్టలు', 'Clothing & Fashion': 'బట్టలు & ఫ్యాషన్', 'Food': 'ఆహారం', 'Catering & Food': 'కేటరింగ్ & ఆహారం',
    'Meat': 'మాంసం', 'Fish': 'చేపలు', 'Services': 'సేవలు', 'Tailoring': 'టైలరింగ్', 'AC Repair': 'AC రిపేర్',
    'Plumbing': 'ప్లంబింగ్', 'Saloon & Beauty': 'సెలూన్ & బ్యూటీ', 'Hardware': 'హార్డ్‌వేర్', 'Mobile Repair': 'మొబైల్ రిపేర్'
};

const CANONICAL_TABS = ['Expo', 'Trending', 'Shopping', 'Services', 'Business'];

const renderShopCardBadge = (shop) => {
    const isOfficial = String(shop.user_id) === "1" || shop.user_email === 'pavanvenkat63@gmail.com' || shop.email === 'pavanvenkat63@gmail.com';
    const isVer = shop.is_verified === true || String(shop.is_verified).toLowerCase() === 'true';
    const status = shop.account_status || 'active';

    if (status === 'perma_banned') return <span style={{ background: '#0f172a', color: '#fff', fontSize: '8px', padding: '1px 5px', borderRadius: '6px', fontWeight: '900' }}>⬛</span>;
    if (status === 'temp_block') return <span style={{ background: '#fef2f2', color: '#dc2626', fontSize: '8px', padding: '1px 5px', borderRadius: '6px', fontWeight: '900' }}>🟥</span>;
    if (isOfficial) return <BadgeCheck size={13} color="#ffffff" fill="#facc15" style={{ flexShrink: 0 }} />;
    if (isVer) return <BadgeCheck size={13} color="#ffffff" fill="#10b981" style={{ flexShrink: 0 }} />;
    return <BadgeCheck size={13} color="#ffffff" fill="#3b82f6" style={{ flexShrink: 0 }} />;
};

// 🟢 MERGE DB BANNERS WITH DEFAULT BANNERS (So adding 1 banner NEVER deletes the other 2!)
const mergeWithDefaultBanners = (dbBanners = []) => {
    let deletedDefaultIds = [];
    try {
        deletedDefaultIds = JSON.parse(localStorage.getItem('subhams_deleted_default_banners') || '[]');
    } catch (e) {}

    const activeDefaults = DEFAULT_BANNERS.filter(
        def => !deletedDefaultIds.includes(def.id) && !dbBanners.some(db => db.title_en === def.title_en)
    );
    return [...dbBanners, ...activeDefaults];
};

const Home = () => {
    const { t, language, setLanguage, location: appLocation } = useContext(AppContext);
    const navigate = useNavigate();
    const currentRoute = useLocation().pathname;

    const [localLang, setLocalLang] = useState(() => language === 'te' ? 'te' : 'en');
    useEffect(() => {
        if (language === 'te' || language === 'en') setLocalLang(language);
    }, [language]);

    const lang = localLang;
    const ht = homeTranslations[lang];

    const toggleLanguage = () => {
        const next = lang === 'en' ? 'te' : 'en';
        setLocalLang(next);
        if (typeof setLanguage === 'function') setLanguage(next);
    };

    const getCatIcon = (catKey) => {
        if (catKey === 'Expo') return { icon: '✨', bg: '#fce7f3', color: '#db2777', ambient: '#4a044e' };
        if (catKey === 'Trending') return { icon: '🔥', bg: '#fef2f2', color: '#dc2626', ambient: '#1e1b4b' };
        if (catKey === 'Shopping') return { icon: '🛍️', bg: '#eff6ff', color: '#2563eb', ambient: '#1e3a8a' };
        if (catKey === 'Services') return { icon: '🧑‍🔧', bg: '#f0fdf4', color: '#16a34a', ambient: '#064e3b' };
        if (catKey === 'Business') return { icon: '📈', bg: '#fef3c7', color: '#d97706', ambient: '#78350f' };
        return { icon: '🏪', bg: '#f1f5f9', color: '#64748b', ambient: '#0f172a' };
    };

    const tc = (word) => {
        if (!word) return '';
        if (lang === 'te') {
            return word.split(',').map(w => categoryTranslations[w.trim()] || (typeof t === 'function' ? t(w.trim()) : w.trim())).join(', ');
        }
        return word;
    };

    const [products, setProducts] = useState([]);
    const [activeShops, setActiveShops] = useState([]); 
    const [adminCategories, setAdminCategories] = useState([]);
    const [selectedSubCategory, setSelectedSubCategory] = useState(null);

    const [loading, setLoading] = useState(true);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 1024); 
    const [searchQuery, setSearchQuery] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);

    const [selectedCategory, setSelectedCategory] = useState('Trending'); 
    const [showcaseFilter, setShowcaseFilter] = useState('trending'); // 'trending' or 'area'
    const [showGridMode, setShowGridMode] = useState(false);

    const [localUserStr, setLocalUserStr] = useState(localStorage.getItem('user'));
    const localUser = localUserStr && localUserStr !== 'undefined' ? JSON.parse(localUserStr) : null;
    
    const [customLocation, setCustomLocation] = useState(() => {
        try { return JSON.parse(localStorage.getItem('custom_hub_location')); } catch (e) { return null; }
    });
    const [showLocModal, setShowLocModal] = useState(false);
    const [locSearch, setLocSearch] = useState('');
    const [locResults, setLocResults] = useState([]);

    const [unreadNotifs, setUnreadNotifs] = useState(0); 

    const [banners, setBanners] = useState(() => {
        try {
            const saved = JSON.parse(localStorage.getItem('subhams_home_banners'));
            return Array.isArray(saved) && saved.length > 0 ? saved : DEFAULT_BANNERS;
        } catch (e) { return DEFAULT_BANNERS; }
    });
    const [activeBannerIdx, setActiveBannerIdx] = useState(0);
    const [smartPill, setSmartPill] = useState(() => {
        try {
            const saved = JSON.parse(localStorage.getItem('subhams_smart_pill'));
            return saved || DEFAULT_SMART_PILL;
        } catch (e) { return DEFAULT_SMART_PILL; }
    });

    const [isPillExpanded, setIsPillExpanded] = useState(false);
    const [showAssistantModal, setShowAssistantModal] = useState(false);
    const [assistantQuery, setAssistantQuery] = useState('');

    const [showBannerAdminModal, setShowBannerAdminModal] = useState(false);
    const [editingBannerId, setEditingBannerId] = useState(null);
    const [bannerForm, setBannerForm] = useState({
        title_en: '', title_te: '', subtitle_en: '', subtitle_te: '',
        badge_text: 'SPECIAL OFFER', media_url: '', action_url: '/expo',
        ambient_color: '#1e1b4b', accent_color: '#facc15'
    });

    useEffect(() => {
        const checkUser = () => {
            const currentStr = localStorage.getItem('user');
            if (currentStr !== localUserStr) setLocalUserStr(currentStr); 
        };
        window.addEventListener('storage', checkUser);
        return () => window.removeEventListener('storage', checkUser);
    }, [localUserStr]);

    useEffect(() => {
        if (localUser?.id) {
            const token = localStorage.getItem('token');
            if (token) {
                axios.get(`${getBackendUrl()}/notifications/my-notifications`, { headers: { Authorization: `Bearer ${token}` } })
                .then(res => setUnreadNotifs(res.data.unreadCount || 0)).catch(() => {});
            }
        }
    }, [localUser?.id]);

    const isVendor = localUser && (localUser.role === 'vendor' || activeShops.some(shop => String(shop.user_id) === String(localUser.id)));
    const isAdmin = localUser && ((localUser.role && localUser.role.toLowerCase() === 'admin') || localUser.email === 'pavanvenkat63@gmail.com');

    const [cartCount, setCartCount] = useState(0);

    useEffect(() => {
        const updateCartCount = () => {
            const localCart = JSON.parse(localStorage.getItem('subhams_cart') || '[]');
            const total = localCart.reduce((sum, item) => sum + (item.quantity || item.qty || 1), 0);
            setCartCount(total);
        };
        updateCartCount(); 
        window.addEventListener('storage', updateCartCount);
        return () => window.removeEventListener('storage', updateCartCount);
    }, []);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 1024);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // 🟢 FETCH BANNERS & MERGE WITH DEFAULTS SO REMAINING BANNERS NEVER DISAPPEAR
    const fetchHomeMarketing = async () => {
        try {
            const res = await axios.get(`${getBackendUrl()}/admin/home-banners`);
            const dbList = Array.isArray(res.data?.banners) ? res.data.banners : [];
            const merged = mergeWithDefaultBanners(dbList);
            setBanners(merged);
            localStorage.setItem('subhams_home_banners', JSON.stringify(merged));

            if (res.data?.smartPill) {
                setSmartPill(res.data.smartPill);
                localStorage.setItem('subhams_smart_pill', JSON.stringify(res.data.smartPill));
            }
        } catch (e) {}
    };

    useEffect(() => {
        fetchHomeMarketing();
        socket.on('home_marketing_updated', fetchHomeMarketing);
        return () => socket.off('home_marketing_updated', fetchHomeMarketing);
    }, []);

    // Auto-slide Top Banner every 4 seconds
    useEffect(() => {
        if (banners.length <= 1) return;
        const timer = setInterval(() => {
            setActiveBannerIdx(prev => (prev + 1) % banners.length);
        }, 4000);
        return () => clearInterval(timer);
    }, [banners.length]);

    // Auto-expand & collapse floating smart pill
    useEffect(() => {
        const initialTimer = setTimeout(() => setIsPillExpanded(true), 2000);
        const collapseTimer = setTimeout(() => setIsPillExpanded(false), 6500);

        const cycleInterval = setInterval(() => {
            setIsPillExpanded(true);
            setTimeout(() => setIsPillExpanded(false), 4500);
        }, 10000);

        return () => {
            clearTimeout(initialTimer);
            clearTimeout(collapseTimer);
            clearInterval(cycleInterval);
        };
    }, []);

    const activeLat = customLocation?.lat || appLocation?.lat || 0;
    const activeLng = customLocation?.lng || appLocation?.lng || 0;

    useEffect(() => {
        let isMounted = true;
        const fetchLocalFeed = async () => {
            setLoading(true);
            try {
                const BACKEND_URL = getBackendUrl();
                const [resFeed, resShops, resCats] = await Promise.allSettled([
                    axios.get(`${BACKEND_URL}/products/feed?lat=${activeLat}&lng=${activeLng}`),
                    axios.get(`${BACKEND_URL}/shops/active/all`),
                    axios.get(`${BACKEND_URL}/admin/categories`)
                ]);

                if (!isMounted) return;

                if (resFeed.status === 'fulfilled') setProducts(resFeed.value.data?.products || []);
                if (resShops.status === 'fulfilled') setActiveShops(resShops.value.data?.shops || []);
                if (resCats.status === 'fulfilled') setAdminCategories(resCats.value.data || []);
            } catch (err) {
                console.error("Feed Error:", err);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchLocalFeed(); 
        return () => { isMounted = false; };
    }, [activeLat, activeLng]);

    const handleLocationSearch = async (query) => {
        setLocSearch(query);
        if (query.trim().length < 2) return setLocResults([]);
        try {
            const normalizedQ = normalizeLocationText(query.trim());
            const res = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&countrycodes=in&accept-language=en&q=${encodeURIComponent(normalizedQ)}`);
            setLocResults(res.data || []);
        } catch (e) {}
    };

    const selectCustomLocation = (loc) => {
        const customLoc = { lat: loc.lat || 0, lng: loc.lon || 0, address: loc.display_name };
        localStorage.setItem('custom_hub_location', JSON.stringify(customLoc));
        setCustomLocation(customLoc);
        setShowcaseFilter('area');
        setShowLocModal(false);
        setLocSearch('');
        setLocResults([]);
        toast.success(`🚚 Showing shops delivering to ${loc.display_name.split(',')[0]}`);
    };

    const handleBannerMediaUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (ev) => {
            if (file.type === 'image/gif') {
                setBannerForm(prev => ({ ...prev, media_url: ev.target.result }));
                toast.success("🎞️ Animated GIF attached!");
                return;
            }
            const img = new Image();
            img.src = ev.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const maxW = 1000;
                const scale = Math.min(1, maxW / img.width);
                canvas.width = Math.round(img.width * scale);
                canvas.height = Math.round(img.height * scale);
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                setBannerForm(prev => ({ ...prev, media_url: canvas.toDataURL('image/jpeg', 0.84) }));
                toast.success("🖼️ Banner image ready!");
            };
        };
    };

    const handleSaveBanner = async (e) => {
        e.preventDefault();
        if (!bannerForm.title_en.trim() && !bannerForm.media_url) {
            return toast.error("Please add a Banner Image or Title.");
        }
        const token = localStorage.getItem('token');
        const payload = {
            ...bannerForm,
            title_en: bannerForm.title_en.trim() || 'Special Promotion'
        };

        try {
            if (editingBannerId && !String(editingBannerId).startsWith('default-')) {
                await axios.put(`${getBackendUrl()}/admin/home-banners/${editingBannerId}`, payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                toast.success("✅ Banner updated!");
            } else {
                if (String(editingBannerId).startsWith('default-')) {
                    const delList = JSON.parse(localStorage.getItem('subhams_deleted_default_banners') || '[]');
                    if (!delList.includes(editingBannerId)) {
                        delList.push(editingBannerId);
                        localStorage.setItem('subhams_deleted_default_banners', JSON.stringify(delList));
                    }
                }
                await axios.post(`${getBackendUrl()}/admin/home-banners`, payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                toast.success("🎉 New banner added to carousel!");
            }
            await fetchHomeMarketing();
        } catch (err) {
            let updated;
            if (editingBannerId) {
                updated = banners.map(b => b.id === editingBannerId ? { ...b, ...payload } : b);
            } else {
                updated = [{ ...payload, id: Date.now() }, ...banners];
            }
            setBanners(updated);
            localStorage.setItem('subhams_home_banners', JSON.stringify(updated));
            toast.success("✅ Banner saved!");
        }
        setEditingBannerId(null);
        setBannerForm({ title_en: '', title_te: '', subtitle_en: '', subtitle_te: '', badge_text: 'SPECIAL OFFER', media_url: '', action_url: '/expo', ambient_color: '#1e1b4b', accent_color: '#facc15' });
    };

    const handleDeleteBanner = async (bannerId) => {
        if (!window.confirm("Remove this banner slide?")) return;
        const token = localStorage.getItem('token');

        if (String(bannerId).startsWith('default-')) {
            const delList = JSON.parse(localStorage.getItem('subhams_deleted_default_banners') || '[]');
            if (!delList.includes(bannerId)) {
                delList.push(bannerId);
                localStorage.setItem('subhams_deleted_default_banners', JSON.stringify(delList));
            }
        } else {
            try {
                await axios.delete(`${getBackendUrl()}/admin/home-banners/${bannerId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            } catch (e) {}
        }

        const remaining = banners.filter(b => b.id !== bannerId);
        const finalBanners = remaining.length > 0 ? remaining : DEFAULT_BANNERS;
        setBanners(finalBanners);
        setActiveBannerIdx(0);
        localStorage.setItem('subhams_home_banners', JSON.stringify(finalBanners));
        toast.info("🗑️ Banner slide removed.");
    };

    const handleRestoreDefaultBanners = () => {
        localStorage.removeItem('subhams_deleted_default_banners');
        fetchHomeMarketing();
        toast.success("🔄 Default banners restored alongside your custom banners!");
    };

    const handleSaveSmartPill = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        try {
            await axios.put(`${getBackendUrl()}/admin/home-smart-pill`, smartPill, {
                headers: { Authorization: `Bearer ${token}` }
            });
        } catch (e) {}
        localStorage.setItem('subhams_smart_pill', JSON.stringify(smartPill));
        toast.success("✨ Floating Smart Pill & Greeting updated!");
    };

    const requireLogin = (actionMsg) => {
        toast.info(`Please login to ${actionMsg}!`);
        navigate('/welcome');
    };

    const handleCategoryClick = (catKey) => {
        if (catKey === 'Business') { 
            if (!localUser) return requireLogin('register a business');
            navigate('/register-business'); 
            return; 
        }
        if (catKey === 'Expo') {
            navigate('/expo');
            return;
        }
        setSelectedCategory(catKey); 
        setSelectedSubCategory(null); 
        setSearchQuery(''); 
        setShowSuggestions(false);
    };

    const getDistanceTag = (shop) => {
        const zones = parseDeliveryZones(shop.delivery_areas);
        const shortList = zones.map(z => z.primary).join(', ');
        return `🚚 ${shortList.length > 15 ? shortList.substring(0, 15) + '..' : shortList}`; 
    };

    const selectedExplorerArea = customLocation?.address || localUser?.address || localUser?.location || '';
    const deliverableShops = activeShops.filter(shop => {
        if (!selectedExplorerArea) return true;
        return doesShopDeliverToSelectedArea(selectedExplorerArea, shop.delivery_areas);
    });

    // 🔥 STRICT ADMIN TRENDING ONLY: Only shops you explicitly tagged as 'Trending' in Admin!
    const trendingShops = activeShops.filter(shop => (shop.shop_type || '').includes('Trending'));

    const officialHubShop = activeShops.find(s => 
        String(s.user_id) === "1" || 
        s.user_email === 'pavanvenkat63@gmail.com' || 
        s.email === 'pavanvenkat63@gmail.com' ||
        (s.business_name && s.business_name.toLowerCase().includes('subhams'))
    );

    const categoryStats = adminCategories.map(adminCat => {
        const shopCount = activeShops.filter(shop => {
            const shopCats = (shop.category || '').toLowerCase().split(',').map(c => c.trim());
            return shopCats.includes(adminCat.name.toLowerCase().trim());
        }).length;
        return { ...adminCat, count: shopCount };
    });

    const searchSuggestions = searchQuery.trim() === '' ? [] : [
        ...categoryStats.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()) && f.count > 0).map(f => ({
            type: 'category', name: f.name, count: f.count, section: f.section
        })),
        ...activeShops.filter(s => s.business_name.toLowerCase().includes(searchQuery.toLowerCase()) || (s.category || '').toLowerCase().includes(searchQuery.toLowerCase())).map(s => ({
            type: 'shop', name: s.business_name, id: s.id, img: s.shop_logo || s.shop_image
        }))
    ].slice(0, 6);

    const handleSuggestionClick = (suggestion) => {
        setSearchQuery('');
        setShowSuggestions(false);
        if (suggestion.type === 'shop') {
            navigate(`/shop/${suggestion.id}`);
        } else if (suggestion.type === 'category') {
            const targetTab = suggestion.section === 'Products' ? 'Shopping' : 'Services';
            setSelectedCategory(targetTab);
            setSelectedSubCategory(suggestion.name);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const filteredProducts = products.filter(product => {
        const safeSearch = searchQuery ? searchQuery.toLowerCase().trim() : '';
        const pName = (product.name || product.title || '').toLowerCase();
        const pCategory = (product.category || '').toLowerCase();
        return !safeSearch || pName.includes(safeSearch) || pCategory.includes(safeSearch);
    });

    const currentTabEnglish = selectedCategory === 'Services' ? 'Services' : (selectedCategory === 'Shopping' ? 'Products' : selectedCategory);
    const activeLocationName = selectedExplorerArea ? selectedExplorerArea.split(',')[0].trim() : (lang === 'te' ? 'అన్ని ప్రాంతాలు' : 'All Areas');

    const currentBanner = banners[activeBannerIdx % Math.max(1, banners.length)] || DEFAULT_BANNERS[0];
    const activeAmbientColor = selectedCategory === 'Trending'
        ? (currentBanner.ambient_color || '#1e1b4b')
        : getCatIcon(selectedCategory).ambient;
    const activeAccentColor = currentBanner.accent_color || '#facc15';

    return (
        <div style={{
            ...styles.page,
            background: `radial-gradient(circle at 50% 0%, ${activeAmbientColor}22 0%, #f8fafc 36%, #f8fafc 100%)`,
            transition: 'background 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
        }}>
            {localUser?.id && <AppPermissions/>}
            {loading && <div className="top-progress-bar"></div>}

        <style>
                {`
                    @keyframes topProgressBarAnim {
                        0% { left: -35%; right: 100%; }
                        60% { left: 100%; right: -90%; }
                        100% { left: 100%; right: -90%; }
                    }
                    .top-progress-bar {
                        position: fixed; top: 0; left: 0; width: 100%; height: 3px;
                        background: transparent; z-index: 10000; overflow: hidden;
                    }
                    .top-progress-bar::before {
                        content: ''; position: absolute; top: 0; bottom: 0;
                        background: #facc15;
                        animation: topProgressBarAnim 1.5s cubic-bezier(0.65, 0.815, 0.735, 0.395) infinite;
                    }
                    @keyframes logo-shine {
                        0% { background-position: -200% center; }
                        100% { background-position: 200% center; }
                    }
                    .animated-logo {
                        background: linear-gradient(to right, #facc15 20%, #ffffff 40%, #ffffff 60%, #facc15 80%);
                        background-size: 200% auto;
                        color: #000;
                        background-clip: text;
                        -webkit-background-clip: text;
                        -webkit-text-fill-color: transparent;
                        animation: logo-shine 3s linear infinite;
                    }
                    .touch-scale {
                        transition: transform 0.16s cubic-bezier(0.25, 0.8, 0.25, 1);
                    }
                    .touch-scale:active { transform: scale(0.96); }
                    .hide-scroll::-webkit-scrollbar { display: none; }
                    .hide-scroll { -ms-overflow-style: none; scrollbar-width: none; }

                    /* 🟢 CONTINUOUS SIDE-BY-SIDE AUTO-GLIDING TRACK FOR BOTH SECTIONS */
                    @keyframes smoothMarquee {
                        0% { transform: translateX(0); }
                        100% { transform: translateX(-50%); }
                    }
                    .auto-glide-track {
                        display: flex;
                        width: max-content;
                        gap: 12px;
                        animation: smoothMarquee 26s linear infinite;
                    }
                    .auto-glide-track:hover,
                    .auto-glide-track:active {
                        animation-play-state: paused;
                    }
                `}
            </style>

            {/* 🎨 UNIFIED FLIPKART-STYLE AMBIENT HEADER (Brand + Search + Category Tabs in 1 Sleek Block) */}
            <div style={{
                ...styles.headerStack,
                background: `linear-gradient(135deg, #090d16 0%, ${activeAmbientColor} 100%)`,
                transition: 'background 0.8s ease'
            }}>
                <div style={styles.headerTopRow}>
                    <div style={{display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer'}} onClick={() => {setSearchQuery(''); setSelectedCategory('Trending'); setSelectedSubCategory(null); window.scrollTo(0,0);}}>
                        <h1 style={{ margin: 0, display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                            <span className="animated-logo" style={{ fontSize: '20px', fontWeight: '900', letterSpacing: '-0.5px' }}>SUBHAMS</span>
                            <span style={{ fontSize: '10.5px', background: 'rgba(250, 204, 21, 0.2)', color: '#facc15', padding: '2px 6px', borderRadius: '6px', fontWeight: '900', letterSpacing: '1px', border: '1px solid rgba(250,204,21,0.35)' }}>HUB</span>
                        </h1>
                    </div>
                    
                    <div style={{display: 'flex', gap: '6px', alignItems: 'center'}}>
                        {isAdmin && (
                            <button onClick={() => setShowBannerAdminModal(true)} style={{ background: 'rgba(255,255,255,0.14)', color: '#facc15', border: '1px solid rgba(250,204,21,0.4)', padding: '4px 9px', borderRadius: '14px', fontSize: '11px', fontWeight: '900', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Edit3 size={12} /> {isMobile ? "Ads" : ht.manageBanners}
                            </button>
                        )}

                        <button onClick={toggleLanguage} style={styles.langToggleBtn} title="Switch Language">
                            <Globe size={12} color="#facc15" />
                            <span>{lang === 'en' ? 'తెలుగు' : 'EN'}</span>
                        </button>

                        <button onClick={() => navigate('/notifications')} style={{...styles.bellBtn, position: 'relative'}}>
                            🔔
                            {unreadNotifs > 0 && <span style={styles.topBellBadge}>{unreadNotifs > 99 ? '99+' : unreadNotifs}</span>}
                        </button>

                        {isAdmin ? (
                            <button onClick={() => navigate('/admin')} style={styles.adminBtn}>
                                <ShieldCheck size={13} /> {isMobile ? "" : ht.admin}
                            </button>
                        ) : !localUser ? (
                            <button onClick={() => navigate('/welcome')} style={styles.loginHeaderBtn}>
                                <User size={13} /> Login
                            </button>
                        ) : null}
                    </div>
                </div>
                
                {/* 🔍 SLEEK FULL-WIDTH SEARCH BAR */}
                <div style={styles.locationSearchRow}>
                    <div style={{ flex: 1, position: 'relative' }}>
                        <input 
                            type="text" 
                            placeholder={selectedSubCategory ? `Search in ${tc(selectedSubCategory)}...` : ht.searchFor} 
                            style={styles.searchInputCompact} 
                            value={searchQuery} 
                            onChange={(e) => { setSearchQuery(e.target.value); setShowSuggestions(true); }}
                            onFocus={() => setShowSuggestions(true)}
                            onBlur={() => setTimeout(() => setShowSuggestions(false), 250)}
                        />
                        {searchQuery ? (
                            <button onClick={() => setSearchQuery('')} style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '22px', height: '22px', cursor: 'pointer', fontWeight: 'bold' }}>✕</button>
                        ) : (
                            <div style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: '#eff6ff', padding: '5px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Search size={13} color="#2563eb" />
                            </div>
                        )}
                        
                        {showSuggestions && searchSuggestions.length > 0 && (
                            <div style={styles.suggestionsBox}>
                                {searchSuggestions.map((sug, i) => (
                                    <div key={i} style={styles.suggestionItem} onClick={() => handleSuggestionClick(sug)}>
                                        {sug.type === 'category' ? (
                                            <>
                                                <Folder size={15} color="#f59e0b" style={{flexShrink: 0}}/>
                                                <span style={{fontWeight: '900', color: '#0f172a', fontSize: '13px', flex: 1}}>{tc(sug.name)} Category</span>
                                            </>
                                        ) : (
                                            <>
                                                <Store size={15} color="#4f46e5" style={{flexShrink: 0}}/>
                                                <span style={{fontWeight: '900', color: '#0f172a', fontSize: '13px', flex: 1}}>{sug.name}</span>
                                                <span style={{fontSize: '10px', background: '#e0e7ff', color: '#4f46e5', padding: '2px 8px', borderRadius: '10px', fontWeight: 'bold'}}>Visit</span>
                                            </>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* FLIPKART-STYLE INTEGRATED CATEGORY BAR */}
                <div style={styles.headerCatStrip} className="hide-scroll">
                    <div style={styles.catContent}>
                        {CANONICAL_TABS.map(catKey => {
                            const isActive = selectedCategory === catKey;
                            const { icon } = getCatIcon(catKey);
                            return (
                                <span key={catKey} onClick={() => handleCategoryClick(catKey)}
                                    style={{ 
                                        ...styles.catItem, 
                                        ...(isActive ? styles.catItemActive : styles.catItemInactive)
                                    }}>
                                    {icon} {ht.tabNames[catKey]}
                                </span>
                            );
                        })}
                    </div>
                </div>
            </div>

            {localUser?.account_status === 'warned' && (
                <div style={{ background: '#fef2f2', borderBottom: '2px solid #ef4444', padding: '6px 12px', textAlign: 'center' }}>
                    <span style={{ fontSize: '11.5px', fontWeight: '800', color: '#b91c1c' }}>
                        🛡️ SECURITY WARNING: {localUser.ban_reason || 'Please adhere to our community guidelines.'}
                    </span>
                </div>
            )}

            {/* MAIN CONTENT CONTAINER */}
            <div style={{ maxWidth: '980px', margin: '0 auto', padding: isMobile ? '10px 10px' : '12px 16px', width: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {searchQuery && !showSuggestions ? (
                    <div style={{padding: '4px'}}>
                        <h2 style={{ fontSize: '16px', marginBottom: '10px', color: '#0f172a', fontWeight: '900' }}>{ht.searchResults} "{searchQuery}"</h2>
                        {filteredProducts.length > 0 ? (
                            <div style={styles.desktopProductGrid}>
                                {filteredProducts.map((product) => (
                                    <ProductCard key={product.id} product={product} t={t} />
                                ))}
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '24px', background: 'white', borderRadius: '14px', border: '1px dashed #cbd5e1' }}>
                                <p style={{color: '#64748b', fontWeight: 'bold', margin: 0}}>No items found. Try a different search.</p>
                            </div>
                        )}
                    </div>
                ) : (
                    <>
                        {selectedCategory === 'Trending' && (
                            <>
                                {/* ========================================================= */}
                                {/* 🖼️ 1. FLIPKART-STYLE HERO BANNER + EXTERNAL DOTS BELOW */}
                                {/* ========================================================= */}
                                <div>
                                    <div style={{
                                        position: 'relative',
                                        borderRadius: '16px',
                                        overflow: 'hidden',
                                        height: isMobile ? '138px' : '156px',
                                        border: '2px solid rgba(250, 204, 21, 0.65)',
                                        boxShadow: '0 8px 22px rgba(15, 23, 42, 0.14)',
                                        background: '#090d16'
                                    }}>
                                        <div style={{
                                            display: 'flex',
                                            height: '100%',
                                            width: '100%',
                                            transform: `translateX(-${(activeBannerIdx % Math.max(1, banners.length)) * 100}%)`,
                                            transition: 'transform 0.5s cubic-bezier(0.22, 1, 0.36, 1)'
                                        }}>
                                            {banners.map((b, idx) => {
                                                const bTitle = lang === 'te' ? (b.title_te || b.title_en) : b.title_en;
                                                const bSub = lang === 'te' ? (b.subtitle_te || b.subtitle_en) : b.subtitle_en;
                                                return (
                                                    <div
                                                        key={b.id || idx}
                                                        onClick={() => {
                                                            const url = b.action_url || '/expo';
                                                            if (url.startsWith('http')) window.open(url, '_blank');
                                                            else navigate(url);
                                                        }}
                                                        style={{
                                                            minWidth: '100%',
                                                            height: '100%',
                                                            position: 'relative',
                                                            background: `linear-gradient(115deg, ${b.ambient_color || '#1e1b4b'} 0%, #0f172a 55%, ${b.ambient_color || '#1e1b4b'} 100%)`,
                                                            cursor: 'pointer',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'space-between',
                                                            padding: isMobile ? '12px 14px' : '14px 24px',
                                                            boxSizing: 'border-box',
                                                            overflow: 'hidden'
                                                        }}
                                                    >
                                                        {/* Soft Ambient Image Glow in Background */}
                                                        {b.media_url && (
                                                            <img
                                                                src={getOptimizedImage(b.media_url)}
                                                                alt=""
                                                                aria-hidden="true"
                                                                style={{
                                                                    position: 'absolute',
                                                                    right: '-5%',
                                                                    top: '-10%',
                                                                    width: '55%',
                                                                    height: '120%',
                                                                    objectFit: 'cover',
                                                                    filter: 'blur(24px) brightness(0.65)',
                                                                    opacity: 0.55,
                                                                    pointerEvents: 'none',
                                                                    zIndex: 1
                                                                }}
                                                            />
                                                        )}

                                                        {/* Left Text Block (Flipkart Vivo Banner Layout) */}
                                                        <div style={{ position: 'relative', zIndex: 2, flex: 1, paddingRight: '10px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '4px' }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                                <span style={{
                                                                    background: b.accent_color || '#facc15',
                                                                    color: '#0f172a',
                                                                    fontSize: '9.5px',
                                                                    fontWeight: '900',
                                                                    padding: '2px 8px',
                                                                    borderRadius: '4px',
                                                                    letterSpacing: '0.5px',
                                                                    textTransform: 'uppercase'
                                                                }}>
                                                                    {b.badge_text || 'FEATURED'}
                                                                </span>
                                                                <span style={{ fontSize: '10px', color: '#cbd5e1', fontWeight: '700' }}>
                                                                    | Subhams Verified
                                                                </span>
                                                            </div>

                                                            <h2 style={{ margin: '2px 0 0 0', color: '#ffffff', fontSize: isMobile ? '16px' : '21px', fontWeight: '900', lineHeight: 1.15 }}>
                                                                {bTitle}
                                                            </h2>

                                                            {bSub && (
                                                                <p style={{ margin: 0, color: '#e2e8f0', fontSize: isMobile ? '11px' : '12.5px', fontWeight: '600', lineHeight: 1.25, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                                                    {bSub}
                                                                </p>
                                                            )}

                                                            {/* Bottom White Offer Strip (Just like Flipkart's Bank/Offer strip!) */}
                                                            <div style={{ marginTop: '4px', alignSelf: 'flex-start', background: 'rgba(255,255,255,0.95)', color: '#0f172a', padding: '3px 10px', borderRadius: '6px', fontSize: '10px', fontWeight: '900', display: 'inline-flex', alignItems: 'center', gap: '4px', boxShadow: '0 2px 6px rgba(0,0,0,0.2)' }}>
                                                                <span>⚡ {lang === 'te' ? 'ఇప్పుడే ఓపెన్ చేయండి' : 'Zero Commission • Tap to Open'}</span>
                                                                <ChevronRight size={12} color="#2563eb" />
                                                            </div>
                                                        </div>

                                                        {/* Right Crisp Uncropped Image Showcase (Never cuts off logos or products!) */}
                                                        {b.media_url && (
                                                            <div style={{
                                                                position: 'relative',
                                                                zIndex: 2,
                                                                width: isMobile ? '115px' : '175px',
                                                                height: isMobile ? '112px' : '130px',
                                                                borderRadius: '12px',
                                                                background: 'rgba(15, 23, 42, 0.55)',
                                                                border: '1px solid rgba(255,255,255,0.2)',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                overflow: 'hidden',
                                                                flexShrink: 0,
                                                                padding: '4px',
                                                                boxSizing: 'border-box'
                                                            }}>
                                                                <img
                                                                    src={getOptimizedImage(b.media_url)}
                                                                    alt={bTitle}
                                                                    style={{
                                                                        width: '100%',
                                                                        height: '100%',
                                                                        objectFit: 'contain',
                                                                        borderRadius: '8px'
                                                                    }}
                                                                />
                                                            </div>
                                                        )}

                                                        <span style={{ position: 'absolute', bottom: '6px', right: '10px', fontSize: '8.5px', fontWeight: '900', color: 'rgba(255,255,255,0.6)', zIndex: 3 }}>
                                                            AD
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* 🟢 FLIPKART-STYLE PAGINATION DOTS OUTSIDE & BELOW BANNER (`- - ▬ - -`) */}
                                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '5px', marginTop: '6px' }}>
                                        {banners.map((b, idx) => (
                                            <div
                                                key={b.id || idx}
                                                onClick={() => setActiveBannerIdx(idx)}
                                                style={{
                                                    height: '4px',
                                                    width: activeBannerIdx === idx ? '20px' : '7px',
                                                    borderRadius: '4px',
                                                    background: activeBannerIdx === idx ? '#0f172a' : '#cbd5e1',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.3s ease'
                                                }}
                                            />
                                        ))}
                                    </div>
                                </div>
{/* ========================================================= */}
                                {/* 🚚 SECTION 2A: SEARCH ANY AREA DELIVERY EXPLORER (SEPARATE!) */}
                                {/* ========================================================= */}
                                <div style={{
                                    background: '#ffffff',
                                    borderRadius: '16px',
                                    padding: '10px 14px',
                                    border: '1.5px solid #bfdbfe',
                                    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.06)'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                            <span style={{ fontSize: '13.5px', fontWeight: '900', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                🚚 {lang === 'te' ? 'ఏ ఊరికైనా డెలివరీ షాపులు చూడండి:' : 'Shops Delivering to:'}
                                            </span>

                                            <button
                                                type="button"
                                                onClick={() => setShowLocModal(true)}
                                                style={{
                                                    background: '#eff6ff',
                                                    color: '#1d4ed8',
                                                    border: '1.5px solid #3b82f6',
                                                    padding: '4px 12px',
                                                    borderRadius: '16px',
                                                    fontSize: '12px',
                                                    fontWeight: '900',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '5px'
                                                }}
                                            >
                                                <MapPin size={13} color="#2563eb" />
                                                <span>{activeLocationName}</span>
                                                <span style={{ fontSize: '10px', color: '#2563eb', fontWeight: '800' }}>
                                                    ({lang === 'te' ? 'ఏ ఊరైనా వెతకండి ▾' : 'Search Any Area ▾'})
                                                </span>
                                            </button>
                                        </div>

                                        <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700' }}>
                                            {lang === 'te' ? 'మీ అడ్రస్ మాత్రమే కాదు, ఏ ఊరైనా చెక్ చేయవచ్చు' : 'Check any village or town — not just your address'}
                                        </span>
                                    </div>

                                    {deliverableShops.length === 0 ? (
                                        <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '10px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px dashed #cbd5e1' }}>
                                            <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '700' }}>
                                                No shops listed for <strong>{activeLocationName}</strong> yet.
                                            </span>
                                            <button
                                                onClick={() => { localStorage.removeItem('custom_hub_location'); setCustomLocation(null); }}
                                                style={{ background: '#2563eb', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: '800', cursor: 'pointer' }}
                                            >
                                                Reset to All Areas
                                            </button>
                                        </div>
                                    ) : (
                                        <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '4px', WebkitOverflowScrolling: 'touch' }} className="hide-scroll">
                                            {deliverableShops.map((shop, idx) => (
                                                <div
                                                    key={shop.id}
                                                    onClick={() => navigate(`/shop/${shop.id}`)}
                                                    className="touch-scale"
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '8px',
                                                        background: '#f8fafc',
                                                        border: '1px solid #e2e8f0',
                                                        borderRadius: '12px',
                                                        padding: '6px 10px',
                                                        minWidth: '175px',
                                                        maxWidth: '200px',
                                                        flexShrink: 0,
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    <div style={{ position: 'relative', width: '44px', height: '44px', flexShrink: 0 }}>
                                                        <img
                                                            src={getOptimizedImage(shop.shop_logo) || 'https://via.placeholder.com/80'}
                                                            alt={shop.business_name}
                                                            crossOrigin="anonymous"
                                                            referrerPolicy="no-referrer"
                                                            style={{ width: '44px', height: '44px', borderRadius: '10px', objectFit: 'cover', border: '1px solid #cbd5e1', background: '#fff' }}
                                                        />
                                                        <span style={{ position: 'absolute', top: '-4px', left: '-4px', background: '#2563eb', color: '#fff', fontSize: '8.5px', fontWeight: '900', padding: '1px 4px', borderRadius: '5px' }}>
                                                            {idx + 1}
                                                        </span>
                                                    </div>
                                                    <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                                                            <span style={{ fontSize: '12px', fontWeight: '900', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                                {shop.business_name}
                                                            </span>
                                                            {renderShopCardBadge(shop)}
                                                        </div>
                                                        <span style={{ fontSize: '10px', color: '#16a34a', fontWeight: '800', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                            {tc(shop.category)}
                                                        </span>
                                                        <span style={{ fontSize: '9px', color: '#64748b', fontWeight: '700', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                            {getDistanceTag(shop)}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* ========================================================= */}
                                {/* 💜 SECTION 2B: FLIPKART PURPLE BOX (STRICT ADMIN TRENDING ONLY!) */}
                                {/* ========================================================= */}
                                <div style={{
                                    background: 'linear-gradient(135deg, #6d28d9 0%, #4c1d95 55%, #1e1b4b 100%)',
                                    borderRadius: '18px',
                                    padding: isMobile ? '12px 12px' : '14px 16px',
                                    boxShadow: '0 10px 24px rgba(109, 40, 217, 0.22)',
                                    border: '1.5px solid rgba(250, 204, 21, 0.45)',
                                    overflow: 'hidden'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', gap: '8px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <h2 style={{ margin: 0, color: '#ffffff', fontSize: isMobile ? '14.5px' : '16px', fontWeight: '900' }}>
                                                🔥 {lang === 'te' ? 'టాప్ ట్రెండింగ్ షాపులు (Featured)' : 'Top Trending Shops (Admin Featured)'}
                                            </h2>
                                            <span style={{ background: '#facc15', color: '#0f172a', fontSize: '10px', fontWeight: '900', padding: '2px 8px', borderRadius: '12px' }}>
                                                {trendingShops.length}
                                            </span>
                                        </div>

                                        {trendingShops.length > 4 && (
                                            <button
                                                type="button"
                                                onClick={() => setShowGridMode(!showGridMode)}
                                                style={{
                                                    background: '#ffffff',
                                                    color: '#0f172a',
                                                    border: 'none',
                                                    padding: '4px 10px',
                                                    borderRadius: '14px',
                                                    fontSize: '11px',
                                                    fontWeight: '900',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                {showGridMode ? ht.lineView : ht.viewAll}
                                            </button>
                                        )}
                                    </div>

                                    {trendingShops.length === 0 ? (
                                        <div style={{ background: 'rgba(255,255,255,0.12)', borderRadius: '12px', padding: '14px', textAlign: 'center', color: '#e2e8f0', fontSize: '12px', fontWeight: '700' }}>
                                            {isAdmin
                                                ? "No shops are marked as 'Trending' yet. Go to Admin Dashboard → Edit any Shop → Check '🔥 Trending' to feature it here!"
                                                : "Featured trending shops will appear here soon."}
                                        </div>
                                    ) : (
                                        <div
                                            style={showGridMode
                                                ? (isMobile ? styles.mobileGrid2 : styles.desktopProductGrid)
                                                : { display: 'flex', flexWrap: 'nowrap', gap: '10px', overflowX: 'auto', paddingBottom: '4px', WebkitOverflowScrolling: 'touch' }
                                            }
                                            className="hide-scroll"
                                        >
                                            {trendingShops.map((shop, idx) => (
                                                <div
                                                    key={shop.id}
                                                    onClick={() => navigate(`/shop/${shop.id}`)}
                                                    className="touch-scale"
                                                    style={showGridMode ? styles.flipkartWhiteCardGrid : styles.flipkartWhiteCard}
                                                >
                                                    <div style={{ position: 'relative', width: '100%', height: '84px', borderRadius: '8px', overflow: 'hidden', background: '#f1f5f9', marginBottom: '6px' }}>
                                                        {shop.shop_logo ? (
                                                            <img src={getOptimizedImage(shop.shop_logo)} alt={shop.business_name} crossOrigin="anonymous" referrerPolicy="no-referrer" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                        ) : (
                                                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                <Store size={24} color="#94a3b8" />
                                                            </div>
                                                        )}
                                                        <span style={{ position: 'absolute', top: '4px', left: '4px', background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#ffffff', fontSize: '9px', fontWeight: '900', padding: '2px 6px', borderRadius: '6px' }}>
                                                            🔥 #{idx + 1}
                                                        </span>
                                                        <span style={{ position: 'absolute', bottom: '4px', right: '4px', background: shop.is_online ? 'rgba(22,163,74,0.92)' : 'rgba(220,38,38,0.92)', color: '#fff', fontSize: '8px', fontWeight: '900', padding: '1px 5px', borderRadius: '5px' }}>
                                                            {shop.is_online ? ht.open : ht.closed}
                                                        </span>
                                                    </div>

                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '3px', marginBottom: '1px' }}>
                                                        <span style={{ fontSize: '12px', fontWeight: '900', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>
                                                            {shop.business_name}
                                                        </span>
                                                        {renderShopCardBadge(shop)}
                                                    </div>

                                                    <span style={{ fontSize: '10.5px', color: '#16a34a', fontWeight: '800', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                        {tc(shop.category)}
                                                    </span>

                                                    <span style={{ fontSize: '9px', color: '#64748b', fontWeight: '700', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '2px' }}>
                                                        {getDistanceTag(shop)}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                    
                                    
                                

                                {/* ========================================================= */}
                                {/* 📢 3. FLIPKART-STYLE HORIZONTAL AD BANNER (LIKE OPPO K14x 5G) */}
                                {/* ========================================================= */}
                                <div 
                                    onClick={() => navigate('/expo')}
                                    className="touch-scale"
                                    style={{
                                        position: 'relative',
                                        background: 'linear-gradient(90deg, #ffffff 0%, #f1f5f9 42%, #0f172a 100%)',
                                        borderRadius: '14px',
                                        padding: '10px 16px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        gap: '10px',
                                        cursor: 'pointer',
                                        border: '1px solid #cbd5e1',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.04)'
                                    }}
                                >
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                        <span style={{ fontSize: '11px', fontWeight: '800', color: '#475569', letterSpacing: '0.3px' }}>
                                            SUBHAMS EXPO • LIVE VIDEO REELS
                                        </span>
                                        <span style={{ fontSize: isMobile ? '14px' : '16px', fontWeight: '900', color: '#0f172a' }}>
                                            {lang === 'te' ? 'మీ షాప్ వీడియోలు & ఆఫర్లు ఉచితంగా చూడండి!' : 'Watch Local Shop Videos & Viral Offers'}
                                        </span>
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ background: '#facc15', color: '#0f172a', padding: '5px 12px', borderRadius: '16px', fontSize: '11px', fontWeight: '900' }}>
                                            Open Expo →
                                        </span>
                                    </div>

                                    <span style={{ position: 'absolute', top: '5px', right: '8px', fontSize: '8.5px', fontWeight: '900', color: '#94a3b8' }}>
                                        AD
                                    </span>
                                </div>

                                {/* ========================================================= */}
                                {/* 🧭 4. COMPACT QUICK EXPLORE & SUBHAMS ECOSYSTEM */}
                                {/* ========================================================= */}
                                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.4fr 1fr', gap: '10px' }}>
                                    <div style={{...styles.compactSectionBlock, margin: 0}}>
                                        <h2 style={styles.sectionTitle}>{ht.explore}</h2>
                                        <div style={styles.upiGrid}>
                                            <div onClick={() => navigate(officialHubShop ? `/shop/${officialHubShop.id}` : '/shop/1')} className="touch-scale" style={styles.miniAppItem}>
                                                <div style={{...styles.miniAppIconBox, background: 'linear-gradient(135deg, #fffbeb, #fef3c7)', color: '#d97706', border: '1px solid #fde68a'}}>🏬</div>
                                                <span style={styles.miniAppText}>{ht.officialShop}</span>
                                            </div>

                                            {CANONICAL_TABS.filter(c => c !== 'Trending').map(catKey => {
                                                const { icon, bg, color } = getCatIcon(catKey);
                                                return (
                                                    <div key={catKey} onClick={() => handleCategoryClick(catKey)} className="touch-scale" style={styles.miniAppItem}>
                                                        <div style={{...styles.miniAppIconBox, background: bg, color: color, border: '1px solid #e2e8f0'}}>{icon}</div>
                                                        <span style={styles.miniAppText}>{ht.tabNames[catKey]}</span>
                                                    </div>
                                                );
                                            })}

                                            <div onClick={() => localUser ? navigate('/my-orders') : requireLogin('view your orders')} className="touch-scale" style={styles.miniAppItem}>
                                                <div style={{...styles.miniAppIconBox, background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0'}}><Package size={18} /></div>
                                                <span style={styles.miniAppText}>{ht.orders}</span>
                                            </div>

                                            <div onClick={() => localUser ? navigate('/profile') : requireLogin('view your profile')} className="touch-scale" style={styles.miniAppItem}>
                                                <div style={{...styles.miniAppIconBox, background: '#f8fafc', color: '#475569', border: '1px solid #cbd5e1'}}><User size={18} /></div>
                                                <span style={styles.miniAppText}>{ht.profile}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{...styles.compactSectionBlock, margin: 0}}>
                                        <h2 style={{...styles.sectionTitle, display: 'flex', alignItems: 'center', gap: '6px'}}>
                                            <Grid size={14} color="#4f46e5" /> {ht.usefulApps}
                                        </h2>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                                            <div onClick={() => window.open('https://pmms.subhamsnetworks.in', '_blank')} className="touch-scale" style={styles.miniAppItem}>
                                                <div style={{...styles.miniAppIconBox, background: '#eff6ff', color: '#4f46e5', border: '1px solid #e0e7ff'}}>💰</div>
                                                <span style={styles.miniAppText}>{ht.pmms}</span>
                                            </div>
                                            <div onClick={() => window.open('https://agent.subhamsnetworks.in', '_blank')} className="touch-scale" style={styles.miniAppItem}>
                                                <div style={{...styles.miniAppIconBox, background: '#fef3c7', color: '#d97706', border: '1px solid #fde68a'}}>🖨️</div>
                                                <span style={styles.miniAppText}>{ht.agent}</span>
                                            </div>
                                            <div onClick={() => window.open('https://subhamsnetworks.in', '_blank')} className="touch-scale" style={styles.miniAppItem}>
                                                <div style={{...styles.miniAppIconBox, background: '#fce7f3', color: '#db2777', border: '1px solid #fbcfe8'}}>🌐</div>
                                                <span style={styles.miniAppText}>{ht.network}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* 🛍️ SHOPPING & 🧑‍🔧 SERVICES TABS */}
                        {(selectedCategory === 'Shopping' || selectedCategory === 'Services') && (
                            <div style={styles.compactSectionBlock}>
                                {!selectedSubCategory ? (
                                    <>
                                        <h2 style={{ fontSize: '17px', marginBottom: '14px', color: '#0f172a', fontWeight: '900' }}>
                                            {ht.browse} {ht.tabNames[selectedCategory]}
                                        </h2>
                                        
                                        {(() => {
                                            const adminCatForTab = adminCategories.filter(c => c.section && c.section.toLowerCase() === currentTabEnglish.toLowerCase());
                                            const allCategoryNames = [...adminCatForTab.map(c => c.name)];

                                            if (allCategoryNames.length === 0) return <div style={{padding: '24px', background: '#f8fafc', borderRadius: '14px', border: '1px dashed #cbd5e1', textAlign: 'center', color: '#64748b', fontWeight: '700'}}>Categories will appear once created by the Admin.</div>;

                                            return (
                                                <div style={isMobile ? styles.mobileGrid4 : styles.desktopFolderGrid}>
                                                    {allCategoryNames.map((catName, index) => {
                                                        const adminCat = adminCatForTab.find(c => c.name.toLowerCase() === catName.toLowerCase());
                                                        const imgSrc = adminCat ? adminCat.hd_image : 'https://via.placeholder.com/150/e2e8f0/64748b?text=' + catName.substring(0, 3);

                                                        return (
                                                            <div key={index} className="touch-scale" onClick={() => setSelectedSubCategory(catName)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: isMobile ? '100%' : '95px', cursor: 'pointer' }}>
                                                                <div style={{ background: '#f8fafc', padding: '5px', borderRadius: '20px', border: '1px solid #e2e8f0' }}>
                                                                    <img src={getOptimizedImage(imgSrc)} alt={catName} crossOrigin="anonymous" referrerPolicy="no-referrer" style={{ width: isMobile ? '62px' : '80px', height: isMobile ? '62px' : '80px', borderRadius: '16px', objectFit: 'cover', background: 'white' }} />
                                                                </div>
                                                                <span style={{ fontSize: isMobile ? '11px' : '13px', marginTop: '6px', fontWeight: '800', color: '#0f172a', textAlign: 'center', lineHeight: '1.2' }}>{tc(catName)}</span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            );
                                        })()}
                                    </>
                                ) : (
                                    <>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                                            <button className="touch-scale" onClick={() => setSelectedSubCategory(null)} style={{ background: '#f8fafc', border: '1px solid #cbd5e1', padding: '7px 12px', borderRadius: '10px', cursor: 'pointer', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12.5px' }}>
                                                <ArrowLeft size={15} /> Back
                                            </button>
                                            <h2 style={{ fontSize: '17px', margin: 0, color: '#0f172a', fontWeight: '900' }}>
                                                {tc(selectedSubCategory)} {ht.sellers}
                                            </h2>
                                        </div>

                                        <div style={isMobile ? styles.mobileGrid2 : styles.desktopProductGrid}>
                                            {activeShops
                                                .filter(shop => {
                                                    const dbType = shop.shop_type || 'Products'; 
                                                    const matchesTab = dbType.toLowerCase().includes(currentTabEnglish.toLowerCase());
                                                    const targetCat = selectedSubCategory.toLowerCase().trim();
                                                    const shopCats = (shop.category || '').toLowerCase().split(',').map(c => c.trim());
                                                    const matchesCategory = shopCats.some(c => c === targetCat || c.includes(targetCat) || targetCat.includes(c));
                                                    return matchesTab && matchesCategory;
                                                })
                                                .map((shop) => (
                                                    <div key={shop.id} className="touch-scale" onClick={() => navigate(`/shop/${shop.id}`)} style={styles.shopCardMobile}>
                                                        <span style={{ position: 'absolute', top: '8px', right: '8px', background: shop.is_online ? 'rgba(22, 163, 74, 0.9)' : 'rgba(220, 38, 38, 0.9)', color: 'white', fontSize: '9px', padding: '2px 7px', borderRadius: '10px', fontWeight: '900', zIndex: 5 }}>
                                                            {shop.is_online ? ht.open : ht.closed}
                                                        </span>

                                                        <div style={{ position: 'relative', width: '100%', height: '115px', overflow: 'hidden', borderRadius: '12px', marginBottom: '8px', background: '#f1f5f9' }}>
                                                            {shop.shop_logo ? (
                                                                <img src={getOptimizedImage(shop.shop_logo)} alt={shop.business_name} crossOrigin="anonymous" referrerPolicy="no-referrer" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                            ) : (
                                                                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                    <Store size={30} color="#cbd5e1"/>
                                                                </div>
                                                            )}
                                                        </div>
                                                        
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '3px' }}>
                                                            <h4 style={{ margin: 0, color: '#0f172a', fontSize: '13.5px', fontWeight: '900', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>
                                                                {shop.business_name}
                                                            </h4>
                                                            {renderShopCardBadge(shop)}
                                                        </div>

                                                        <p style={{ margin: '0 0 6px 0', color: '#2563eb', fontSize: '11px', fontWeight: '800', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                            {tc(shop.category)}
                                                        </p>
                                                        
                                                        <div style={{ fontSize: '10px', color: '#475569', fontWeight: '700', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', background: '#f8fafc', padding: '4px 7px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                                                            {getDistanceTag(shop)}
                                                        </div>
                                                    </div>
                                                ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* ✨ FLOATING SMART PILL (BOTTOM RIGHT) */}
            {smartPill?.is_active !== false && (
                <div style={{ position: 'fixed', bottom: '76px', right: '14px', zIndex: 950, display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                    <div
                        onClick={() => setShowAssistantModal(true)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            background: isPillExpanded ? 'linear-gradient(135deg, #facc15 0%, #f59e0b 100%)' : 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)',
                            color: isPillExpanded ? '#0f172a' : '#ffffff',
                            borderRadius: '40px',
                            padding: isPillExpanded ? '5px 8px 5px 14px' : '0px',
                            width: isPillExpanded ? (isMobile ? '270px' : '300px') : '46px',
                            height: '46px',
                            boxShadow: '0 10px 25px rgba(15, 23, 42, 0.32)',
                            border: isPillExpanded ? '2px solid #fde047' : '2px solid #facc15',
                            cursor: 'pointer',
                            overflow: 'hidden',
                            transition: 'all 0.45s cubic-bezier(0.16, 1, 0.3, 1)',
                            justifyContent: isPillExpanded ? 'space-between' : 'center',
                            boxSizing: 'border-box'
                        }}
                    >
                        {isPillExpanded ? (
                            <>
                                <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', paddingRight: '6px' }}>
                                    <span style={{ fontSize: '8.5px', fontWeight: '900', color: '#78350f', textTransform: 'uppercase' }}>
                                        ✨ SUBHAMS SMART HUB
                                    </span>
                                    <span style={{ fontSize: '11.5px', fontWeight: '900', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {lang === 'te' ? (smartPill.pill_title_te || smartPill.pill_title_en) : smartPill.pill_title_en}
                                    </span>
                                </div>
                                <span style={{ background: '#db2777', color: '#ffffff', padding: '5px 10px', borderRadius: '20px', fontSize: '10px', fontWeight: '900', whiteSpace: 'nowrap', flexShrink: 0 }}>
                                    {lang === 'te' ? (smartPill.cta_te || 'తెరువు') : (smartPill.cta_en || 'Explore')}
                                </span>
                            </>
                        ) : (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', position: 'relative' }}>
                                <Bot size={20} color="#facc15" />
                                <span style={{ position: 'absolute', top: '6px', right: '6px', width: '8px', height: '8px', background: '#22c55e', borderRadius: '50%', border: '1.5px solid #0f172a' }}></span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* 🤖 SMART HUB ASSISTANT MODAL */}
            {showAssistantModal && (
                <div style={styles.overlay} onClick={() => setShowAssistantModal(false)}>
                    <div style={{...styles.locModal, maxWidth: '420px'}} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: 'linear-gradient(135deg, #0f172a, #2563eb)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Bot size={18} color="#facc15" />
                                </div>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '15.5px', fontWeight: '900', color: '#0f172a' }}>Subhams Smart Hub</h3>
                                    <span style={{ fontSize: '10.5px', color: '#16a34a', fontWeight: '800' }}>● Live Assistant & Admin Notes</span>
                                </div>
                            </div>
                            <X size={20} style={{ cursor: 'pointer', color: '#64748b' }} onClick={() => setShowAssistantModal(false)} />
                        </div>

                        <div style={{ background: 'linear-gradient(135deg, #fffbeb, #fef3c7)', border: '1px solid #fde68a', padding: '12px', borderRadius: '12px', marginBottom: '12px' }}>
                            <div style={{ fontSize: '10px', fontWeight: '900', color: '#b45309', textTransform: 'uppercase', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Megaphone size={12} /> Official Note & Offer
                            </div>
                            <p style={{ margin: '0 0 8px 0', fontSize: '12.5px', color: '#78350f', fontWeight: '700', lineHeight: 1.4 }}>
                                {lang === 'te' ? (smartPill.admin_note_te || smartPill.admin_note_en) : smartPill.admin_note_en}
                            </p>
                            <button 
                                onClick={() => {
                                    setShowAssistantModal(false);
                                    const target = smartPill.action_url || '/expo';
                                    if (target.startsWith('http')) window.open(target, '_blank');
                                    else navigate(target);
                                }}
                                style={{ background: '#0f172a', color: '#facc15', border: 'none', padding: '7px 12px', borderRadius: '8px', fontSize: '11.5px', fontWeight: '900', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                            >
                                {lang === 'te' ? (smartPill.pill_title_te || smartPill.pill_title_en) : smartPill.pill_title_en} <ExternalLink size={12} />
                            </button>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
                            <button onClick={() => { setShowAssistantModal(false); setShowLocModal(true); }} style={styles.assistantQuickBtn}>
                                🚚 {lang === 'te' ? 'డెలివరీ ఏరియా చెక్' : 'Check Delivery Area'}
                            </button>
                            <button onClick={() => { setShowAssistantModal(false); navigate('/expo'); }} style={styles.assistantQuickBtn}>
                                🌟 {lang === 'te' ? 'లైవ్ ఎక్స్‌పో ఫీడ్' : 'Watch Expo Videos'}
                            </button>
                            <button onClick={() => { setShowAssistantModal(false); navigate(officialHubShop ? `/shop/${officialHubShop.id}` : '/shop/1'); }} style={styles.assistantQuickBtn}>
                                🏬 {lang === 'te' ? 'సుభమ్స్ అధికారిక స్టోర్' : 'Official Subhams Store'}
                            </button>
                            <button onClick={() => { setShowAssistantModal(false); localUser ? navigate('/register-business') : requireLogin('register a shop'); }} style={styles.assistantQuickBtn}>
                                📈 {lang === 'te' ? 'షాప్ రిజిస్టర్ చేయండి' : 'Register Your Shop'}
                            </button>
                        </div>

                        <div style={{ display: 'flex', gap: '8px' }}>
                            <input 
                                type="text" 
                                placeholder={lang === 'te' ? 'షాప్ లేదా వస్తువు పేరు టైప్ చేయండి...' : 'Ask or search any shop/service...'}
                                value={assistantQuery}
                                onChange={e => setAssistantQuery(e.target.value)}
                                style={{...styles.locInput, padding: '10px 12px', fontSize: '13px', flex: 1}}
                            />
                            <button 
                                onClick={() => {
                                    if (!assistantQuery.trim()) return;
                                    setSearchQuery(assistantQuery.trim());
                                    setShowAssistantModal(false);
                                }}
                                style={{ background: '#2563eb', color: 'white', border: 'none', padding: '0 14px', borderRadius: '10px', fontWeight: '900', cursor: 'pointer' }}
                            >
                                Go
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 🚚 DELIVERY AREA EXPLORER MODAL */}
            {showLocModal && (
                <div style={styles.overlay} onClick={() => setShowLocModal(false)}>
                    <div className="touch-scale" style={styles.locModal} onClick={e => e.stopPropagation()}>
                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px'}}>
                            <h3 style={{margin: 0, fontSize: '16.5px', color: '#0f172a', fontWeight: '900'}}>{ht.checkAreaModalTitle}</h3>
                            <X size={20} style={{cursor: 'pointer', color: '#64748b'}} onClick={() => setShowLocModal(false)} />
                        </div>
                        <p style={{ margin: '0 0 10px 0', fontSize: '11.5px', color: '#475569', lineHeight: 1.4, fontWeight: '600' }}>
                            {ht.checkAreaModalSub}
                        </p>

                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
                            {[
                                { label: '🌍 All India', val: 'India' },
                                { label: '📍 Andhra Pradesh', val: 'Andhra Pradesh, India' },
                                { label: '📍 Konanki', val: 'Konanki, Martur, Bapatla, Andhra Pradesh, 523260, India' },
                                { label: '📍 Martur', val: 'Martur, Bapatla, Andhra Pradesh, India' },
                                { label: '📍 Bapatla', val: 'Bapatla, Andhra Pradesh, India' }
                            ].map((preset, idx) => (
                                <button 
                                    key={idx}
                                    type="button"
                                    onClick={() => selectCustomLocation({ display_name: preset.val, lat: 0, lon: 0 })}
                                    style={{ background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', padding: '5px 10px', borderRadius: '14px', fontSize: '11px', fontWeight: '800', cursor: 'pointer' }}
                                >
                                    {preset.label}
                                </button>
                            ))}
                        </div>

                        <input 
                            type="text" 
                            placeholder="Search any village, town, district, or pincode..." 
                            style={styles.locInput} 
                            value={locSearch} 
                            onChange={(e) => handleLocationSearch(e.target.value)} 
                            autoFocus
                        />

                        {locResults.length > 0 && (
                            <div style={styles.locResultsBox}>
                                {locResults.map((loc, i) => {
                                    const parts = loc.display_name.split(',').map(p => p.trim());
                                    return (
                                        <div key={i} className="touch-scale" style={styles.locItem} onClick={() => selectCustomLocation(loc)}>
                                            <MapPin size={15} color="#2563eb" style={{flexShrink: 0, marginTop: '2px'}} />
                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                <span style={{fontSize: '13px', fontWeight: '900', color: '#0f172a'}}>{parts[0]}</span>
                                                <span style={{fontSize: '10.5px', color: '#64748b'}}>{parts.slice(1).join(', ')}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* 🎨 MASTER ADMIN BANNER & SMART PILL STUDIO MODAL */}
            {showBannerAdminModal && isAdmin && (
                <div style={styles.overlay} onClick={() => setShowBannerAdminModal(false)}>
                    <div style={{...styles.locModal, maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto'}} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '900', color: '#0f172a' }}>🎨 Home Banners & Smart Pill Studio</h3>
                            <X size={20} style={{ cursor: 'pointer', color: '#64748b' }} onClick={() => setShowBannerAdminModal(false)} />
                        </div>

                        <form onSubmit={handleSaveBanner} style={{ background: '#f8fafc', padding: '12px', borderRadius: '14px', border: '1px solid #cbd5e1', marginBottom: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <h4 style={{ margin: 0, fontSize: '13px', color: '#1e3a8a', fontWeight: '900' }}>
                                {editingBannerId ? '✏️ Edit Selected Banner Slide' : '➕ Add New Banner Slide (Keeps existing slides!)'}
                            </h4>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                <input type="text" placeholder="English Title *" value={bannerForm.title_en} onChange={e => setBannerForm({...bannerForm, title_en: e.target.value})} style={styles.studioInput} required />
                                <input type="text" placeholder="Telugu Title" value={bannerForm.title_te} onChange={e => setBannerForm({...bannerForm, title_te: e.target.value})} style={styles.studioInput} />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                <input type="text" placeholder="English Subtitle" value={bannerForm.subtitle_en} onChange={e => setBannerForm({...bannerForm, subtitle_en: e.target.value})} style={styles.studioInput} />
                                <input type="text" placeholder="Telugu Subtitle" value={bannerForm.subtitle_te} onChange={e => setBannerForm({...bannerForm, subtitle_te: e.target.value})} style={styles.studioInput} />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                <input type="text" placeholder="Badge (e.g. MEGA OFFER)" value={bannerForm.badge_text} onChange={e => setBannerForm({...bannerForm, badge_text: e.target.value})} style={styles.studioInput} />
                                <input type="text" placeholder="Click URL (e.g. /shop/1 or /expo)" value={bannerForm.action_url} onChange={e => setBannerForm({...bannerForm, action_url: e.target.value})} style={styles.studioInput} />
                            </div>
                            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                <label style={{ fontSize: '11.5px', fontWeight: '800', color: '#334155', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                    Ambient Color:
                                    <input type="color" value={bannerForm.ambient_color} onChange={e => setBannerForm({...bannerForm, ambient_color: e.target.value})} style={{ width: '32px', height: '24px', border: 'none', cursor: 'pointer' }} />
                                </label>
                                <label style={{ fontSize: '11.5px', fontWeight: '800', color: '#334155', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                    Badge Color:
                                    <input type="color" value={bannerForm.accent_color} onChange={e => setBannerForm({...bannerForm, accent_color: e.target.value})} style={{ width: '32px', height: '24px', border: 'none', cursor: 'pointer' }} />
                                </label>
                            </div>
                            <div>
                                <label style={{ fontSize: '11px', fontWeight: '800', color: '#475569', display: 'block', marginBottom: '4px' }}>Upload Banner Photo / GIF (or paste URL):</label>
                                <input type="file" accept="image/*,image/gif" onChange={handleBannerMediaUpload} style={{ fontSize: '11.5px', marginBottom: '6px', width: '100%' }} />
                                <input type="text" placeholder="Or paste Photo/GIF URL (https://...)" value={bannerForm.media_url && !bannerForm.media_url.startsWith('data:') ? bannerForm.media_url : ''} onChange={e => setBannerForm({...bannerForm, media_url: e.target.value})} style={styles.studioInput} />
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button type="submit" style={{ background: '#16a34a', color: 'white', border: 'none', padding: '9px', borderRadius: '8px', fontWeight: '900', fontSize: '12.5px', cursor: 'pointer', flex: 1 }}>
                                    {editingBannerId ? 'Save Changes' : '➕ Add Slide to Carousel'}
                                </button>
                                {editingBannerId && (
                                    <button type="button" onClick={() => { setEditingBannerId(null); setBannerForm({ title_en: '', title_te: '', subtitle_en: '', subtitle_te: '', badge_text: 'SPECIAL OFFER', media_url: '', action_url: '/expo', ambient_color: '#1e1b4b', accent_color: '#facc15' }); }} style={{ background: '#64748b', color: 'white', border: 'none', padding: '9px', borderRadius: '8px', fontWeight: '800', fontSize: '12.5px', cursor: 'pointer' }}>
                                        Cancel
                                    </button>
                                )}
                            </div>
                        </form>

                        <div style={{ marginBottom: '14px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                <h4 style={{ margin: 0, fontSize: '12.5px', color: '#475569', fontWeight: '900' }}>Active Carousel Slides ({banners.length})</h4>
                                <button type="button" onClick={handleRestoreDefaultBanners} style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: '11px', fontWeight: '800', cursor: 'pointer', textDecoration: 'underline' }}>
                                    Restore Defaults
                                </button>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                {banners.map((b, idx) => (
                                    <div key={b.id || idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', borderRadius: '10px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                                            <span style={{ fontSize: '11px', fontWeight: '900', color: '#64748b' }}>#{idx + 1}</span>
                                            {b.media_url && <img src={b.media_url} alt="" style={{ width: '32px', height: '24px', borderRadius: '4px', objectFit: 'cover', flexShrink: 0 }} />}
                                            <span style={{ fontSize: '12.5px', fontWeight: '800', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.title_en}</span>
                                        </div>
                                        <div style={{ display: 'flex', gap: '5px', flexShrink: 0 }}>
                                            <button type="button" onClick={() => { setEditingBannerId(b.id); setBannerForm(b); }} style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', padding: '4px 7px', borderRadius: '6px', cursor: 'pointer' }}><Edit3 size={12}/></button>
                                            <button type="button" onClick={() => handleDeleteBanner(b.id)} style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', padding: '4px 7px', borderRadius: '6px', cursor: 'pointer' }}><Trash2 size={12}/></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <form onSubmit={handleSaveSmartPill} style={{ background: '#fffbeb', padding: '12px', borderRadius: '14px', border: '1px solid #fde68a', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <h4 style={{ margin: 0, fontSize: '13px', color: '#b45309', fontWeight: '900' }}>✨ Floating Expanding Pill & Admin Greeting</h4>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                <input type="text" placeholder="Pill Text (EN)" value={smartPill.pill_title_en || ''} onChange={e => setSmartPill({...smartPill, pill_title_en: e.target.value})} style={styles.studioInput} />
                                <input type="text" placeholder="Pill Text (TE)" value={smartPill.pill_title_te || ''} onChange={e => setSmartPill({...smartPill, pill_title_te: e.target.value})} style={styles.studioInput} />
                            </div>
                            <textarea placeholder="Admin Greeting / Offer Note (EN)" value={smartPill.admin_note_en || ''} onChange={e => setSmartPill({...smartPill, admin_note_en: e.target.value})} style={{...styles.studioInput, minHeight: '48px'}} />
                            <textarea placeholder="Admin Greeting / Offer Note (TE)" value={smartPill.admin_note_te || ''} onChange={e => setSmartPill({...smartPill, admin_note_te: e.target.value})} style={{...styles.studioInput, minHeight: '48px'}} />
                            <input type="text" placeholder="Pill Action URL (e.g. /shop/1 or /expo)" value={smartPill.action_url || ''} onChange={e => setSmartPill({...smartPill, action_url: e.target.value})} style={styles.studioInput} />
                            <button type="submit" style={{ background: '#d97706', color: 'white', border: 'none', padding: '9px', borderRadius: '8px', fontWeight: '900', fontSize: '12.5px', cursor: 'pointer' }}>
                                Save Floating Pill & Greeting
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* BOTTOM NAVIGATION */}
            <div style={styles.bottomNavContainer}>
                <button onClick={() => { navigate('/'); setSelectedCategory('Trending'); setSelectedSubCategory(null); setSearchQuery(''); window.scrollTo({ top: 0, behavior: 'smooth' }); }} style={currentRoute === '/' && selectedCategory === 'Trending' && !searchQuery && !selectedSubCategory ? styles.bottomNavBtnActive : styles.bottomNavBtn}>
                    <HomeIcon size={20} /><span>{ht.home}</span>
                </button>
                <button onClick={() => navigate('/expo')} style={currentRoute === '/expo' ? styles.bottomNavBtnActive : styles.bottomNavBtn}>
                    <Sparkles size={20} /><span>{ht.expo}</span>
                </button>
                {isVendor ? (
                    <button onClick={() => navigate('/dashboard')} style={currentRoute === '/dashboard' ? styles.bottomNavBtnActive : styles.bottomNavBtn}>
                        <LayoutDashboard size={20} /><span>{ht.dashboard}</span>
                    </button>
                ) : (
                    <button onClick={() => localUser ? navigate('/my-orders') : requireLogin('view your orders')} style={currentRoute === '/my-orders' ? styles.bottomNavBtnActive : styles.bottomNavBtn}>
                        <div style={{ position: 'relative' }}><Package size={20} />{cartCount > 0 && <span style={styles.bottomNavBadge}>{cartCount}</span>}</div>
                        <span>{ht.orders}</span>
                    </button>
                )}
                {isVendor && (
                    <button onClick={() => navigate('/vendor/orders')} style={currentRoute === '/vendor/orders' ? styles.vendorNavBtnActive : styles.vendorNavBtn}>
                        <Store size={20} /><span>{ht.shopOrders}</span>
                    </button>
                )}
                <button onClick={() => localUser ? navigate('/profile') : requireLogin('view your profile')} style={currentRoute === '/profile' ? styles.bottomNavBtnActive : styles.bottomNavBtn}>
                    <User size={20} /><span>{ht.profile}</span>
                </button>
            </div>
            <div style={{ height: '65px' }}></div>
        </div>
    );
};

const styles = {
    page: { minHeight: '100vh', fontFamily: 'Inter, system-ui, sans-serif' },
    headerStack: { display: 'flex', flexDirection: 'column', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 4px 14px rgba(0,0,0,0.12)' },
    headerTopRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px 4px 12px', width: '100%', boxSizing: 'border-box' },
    locationSearchRow: { display: 'flex', alignItems: 'center', padding: '4px 12px 6px 12px', width: '100%', boxSizing: 'border-box' },
    langToggleBtn: { background: 'rgba(255,255,255,0.12)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.2)', padding: '4px 8px', borderRadius: '14px', fontWeight: '800', fontSize: '10.5px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' },
    adminBtn: { background: 'linear-gradient(135deg, #facc15, #f59e0b)', color: '#713f12', border: 'none', padding: '4px 10px', borderRadius: '14px', fontWeight: '900', fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' },
    loginHeaderBtn: { background: '#ffffff', color: '#0f172a', border: 'none', padding: '4px 11px', borderRadius: '14px', fontWeight: '900', fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' },
    searchInputCompact: { width: '100%', padding: '8px 34px 8px 12px', borderRadius: '10px', border: 'none', outline: 'none', fontSize: '12.5px', background: '#ffffff', fontWeight: '700', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', boxSizing: 'border-box' },
    suggestionsBox: { position: 'absolute', top: '106%', left: 0, right: 0, background: 'white', borderRadius: '12px', boxShadow: '0 15px 30px rgba(0,0,0,0.2)', border: '1px solid #cbd5e1', zIndex: 150, overflow: 'hidden' },
    suggestionItem: { padding: '9px 12px', display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid #f1f5f9', cursor: 'pointer', background: 'white' },
    headerCatStrip: { width: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch', borderTop: '1px solid rgba(255,255,255,0.08)' },
    catContent: { display: 'flex', gap: '8px', padding: '6px 12px', width: 'max-content', margin: '0 auto' },
    catItem: { flexShrink: 0, fontSize: '11.5px', cursor: 'pointer', padding: '5px 12px', borderRadius: '16px', transition: 'all 0.2s ease' },
    catItemActive: { background: '#facc15', color: '#0f172a', fontWeight: '900', boxShadow: '0 2px 8px rgba(250,204,21,0.35)' },
    catItemInactive: { background: 'rgba(255,255,255,0.12)', color: '#e2e8f0', fontWeight: '700' },
    overlay: { position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.7)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '14px', zIndex: 1100 },
    locModal: { background: 'white', padding: '18px', borderRadius: '20px', maxWidth: '390px', width: '100%', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', boxSizing: 'border-box' },
    locInput: { padding: '11px 14px', borderRadius: '12px', border: '2px solid #2563eb', fontSize: '13.5px', width: '100%', boxSizing: 'border-box', outline: 'none', fontWeight: '700' },
    locResultsBox: { marginTop: '10px', maxHeight: '200px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '12px' },
    locItem: { padding: '10px 12px', borderBottom: '1px solid #f1f5f9', cursor: 'pointer', display: 'flex', alignItems: 'flex-start', gap: '8px' },
    compactSectionBlock: { padding: '10px 12px', background: 'rgba(255, 255, 255, 0.96)', borderRadius: '16px', boxShadow: '0 4px 12px rgba(15, 23, 42, 0.03)', border: '1px solid #e2e8f0' },
    sectionTitle: { fontSize: '13.5px', marginTop: 0, marginBottom: '8px', color: '#0f172a', fontWeight: '900' },
    upiGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', rowGap: '10px', columnGap: '6px', justifyItems: 'center' },
    miniAppItem: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: 'pointer', width: '100%' },
    miniAppIconBox: { width: '42px', height: '42px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' },
    miniAppText: { fontSize: '10px', fontWeight: '800', color: '#334155', textAlign: 'center', lineHeight: '1.15' },
    mobileGrid2: { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '10px', width: '100%' },
    mobileGrid4: { display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '8px', width: '100%' },
    desktopProductGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(175px, 1fr))', gap: '12px', width: '100%' },
    desktopFolderGrid: { display: 'flex', flexDirection: 'row', gap: '16px', flexWrap: 'wrap', justifyContent: 'flex-start', width: '100%' },
    flipkartWhiteCard: { width: '132px', background: '#ffffff', borderRadius: '12px', padding: '7px', cursor: 'pointer', boxShadow: '0 4px 10px rgba(0,0,0,0.12)', display: 'flex', flexDirection: 'column', position: 'relative', boxSizing: 'border-box', flexShrink: 0 },
    flipkartWhiteCardGrid: { background: '#ffffff', borderRadius: '12px', padding: '8px', cursor: 'pointer', boxShadow: '0 4px 10px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', position: 'relative', boxSizing: 'border-box', width: '100%' },
    shopCardMobile: { background: 'white', borderRadius: '14px', padding: '9px', border: '1px solid #e2e8f0', cursor: 'pointer', boxShadow: '0 3px 10px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', position: 'relative', width: '100%', boxSizing: 'border-box' },
    assistantQuickBtn: { background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '9px', fontSize: '11.5px', fontWeight: '800', color: '#0f172a', cursor: 'pointer', textAlign: 'left' },
    studioInput: { padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12.5px', width: '100%', boxSizing: 'border-box', outline: 'none', background: 'white' },
    bottomNavContainer: { position: 'fixed', bottom: 0, left: 0, right: 0, background: 'rgba(255,255,255,0.96)', backdropFilter: 'blur(12px)', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 12px', paddingBottom: 'max(6px, env(safe-area-inset-bottom))', zIndex: 1000 },
    bottomNavBtn: { background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', color: '#64748b', fontSize: '9.5px', fontWeight: '700', cursor: 'pointer', flex: 1 },
    bottomNavBtnActive: { background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', color: '#2563eb', fontSize: '9.5px', fontWeight: '900', cursor: 'pointer', flex: 1 },
    vendorNavBtn: { background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', color: '#ef4444', fontSize: '9.5px', fontWeight: '700', cursor: 'pointer', flex: 1 },
    vendorNavBtnActive: { background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', color: '#dc2626', fontSize: '9.5px', fontWeight: '900', cursor: 'pointer', flex: 1 },
    bellBtn: { background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', padding: '5px', borderRadius: '50%', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    bottomNavBadge: { position: 'absolute', top: '-4px', right: '-8px', background: '#ef4444', color: '#fff', fontSize: '8.5px', fontWeight: 'bold', padding: '1px 4px', borderRadius: '10px' },
    topBellBadge: { position: 'absolute', top: '-4px', right: '-4px', background: '#ef4444', color: 'white', fontSize: '9px', fontWeight: '900', padding: '1px 4px', borderRadius: '10px', border: '1.5px solid #0f172a' }
};

export default Home;