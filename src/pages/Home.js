import React, { useEffect, useRef, useState, useContext } from 'react';
import axios from 'axios';
import { Search, User, X, MapPin, Package, Home as HomeIcon, Store, LayoutDashboard, ShieldCheck, Sparkles, Folder, ArrowLeft, Grid, ShoppingBag, Wrench, TrendingUp, ChevronRight, Globe, Edit3, Trash2, BadgeCheck, Megaphone, Bot, ExternalLink } from 'lucide-react';
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

const PLACEHOLDER = 'https://via.placeholder.com/80';

// ---------- Telugu -> English place names (for area matching) ----------
const TELUGU_TO_EN_MAP = {
    'కోణంకి': 'konanki', 'మార్టూరు': 'martur', 'బాపట్ల': 'bapatla',
    'తిరుపతి': 'tirupati', 'ఆంధ్రప్రదేశ్': 'andhra pradesh', 'గుంటూరు': 'guntur',
    'విజయవాడ': 'vijayawada', 'ఒంగోలు': 'ongole', 'చీరాల': 'chirala', 'చిరాల': 'chirala',
    'ప్రకాశం': 'prakasam', 'ఇండియా': 'india', 'భారతదేశం': 'india'
};

const normalizeLocationText = (text) => {
    if (!text) return '';
    let lower = String(text).toLowerCase();
    Object.keys(TELUGU_TO_EN_MAP).forEach(te => {
        if (lower.includes(te)) lower = lower.replace(new RegExp(te, 'g'), TELUGU_TO_EN_MAP[te]);
    });
    return lower;
};

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
    const singleHierarchy = commaParts.length >= 3 && (
        rawAreas.toLowerCase().includes('india') ||
        rawAreas.toLowerCase().includes('andhra pradesh') ||
        /\b\d{6}\b/.test(rawAreas)
    );
    if (singleHierarchy) {
        return [{ full: rawAreas.trim(), primary: commaParts[0], sub: commaParts.slice(1, 3).join(', ') }];
    }
    return commaParts.map(p => ({ full: p, primary: p, sub: '' }));
};

const doesShopDeliverToSelectedArea = (selectedAreaRaw, rawDeliveryAreas) => {
    const zones = parseDeliveryZones(rawDeliveryAreas);
    if (zones.some(z => ['all', 'india', 'all india'].includes(z.primary.toLowerCase()))) return true;
    if (!selectedAreaRaw) return true;

    const normUserFull = normalizeLocationText(selectedAreaRaw);
    const userTokens = normUserFull.split(/[,]+/).map(s => s.trim()).filter(Boolean);

    return zones.some(zone => {
        const normPrimary = normalizeLocationText(zone.primary);
        if (!normPrimary) return false;
        const hasPrimary = userTokens.some(t => t === normPrimary || t.includes(normPrimary)) || normUserFull.includes(normPrimary);
        if (!hasPrimary) return false;

        const zoneParts = normalizeLocationText(zone.full).split(',').map(s => s.trim())
            .filter(s => s && s !== 'india' && !/^\d+$/.test(s) && !s.includes('pincode'));
        if (zoneParts.length > 1 && userTokens.length > 1) {
            return zoneParts.slice(1).some(sub => normUserFull.includes(sub));
        }
        return true;
    });
};

const getDistanceTag = (shop) => {
    const s = parseDeliveryZones(shop.delivery_areas).map(z => z.primary).join(', ');
    return `🚚 ${s.length > 15 ? s.substring(0, 15) + '..' : s}`;
};

// ---------- Default content ----------
const DEFAULT_BANNERS = [
    {
        id: 'default-1',
        title_en: 'Subhams Hub Official Store',
        title_te: 'సుభమ్స్ హబ్ అధికారిక స్టోర్',
        subtitle_en: 'Verified local shopping, services & direct bookings at zero commission.',
        subtitle_te: 'వెరిఫైడ్ లోకల్ షాపింగ్, సర్వీసులు & డైరెక్ట్ బుకింగ్స్.',
        badge_text: '🌟 OFFICIAL GOLD',
        media_url: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=900&q=80',
        action_url: '/shop/1', ambient_color: '#1e1b4b', accent_color: '#facc15'
    },
    {
        id: 'default-2',
        title_en: 'Explore Subhams Expo Live Feed',
        title_te: 'సుభమ్స్ ఎక్స్‌పో లైవ్ ఫీడ్ చూడండి',
        subtitle_en: 'Watch real product videos, latest shop offers & local updates.',
        subtitle_te: 'నిజమైన ఉత్పత్తి వీడియోలు, తాజా షాప్ ఆఫర్లు & అప్‌డేట్‌లు.',
        badge_text: '🔥 LIVE EXPO',
        media_url: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=900&q=80',
        action_url: '/expo', ambient_color: '#064e3b', accent_color: '#34d399'
    },
    {
        id: 'default-3',
        title_en: 'Launch Your Digital Showroom',
        title_te: 'మీ వ్యాపారాన్ని ఆన్‌లైన్‌లో నమోదు చేయండి',
        subtitle_en: 'Get your Green Verified Badge and reach customers across your delivery zones.',
        subtitle_te: 'గ్రీన్ వెరిఫైడ్ బ్యాడ్జ్ పొందండి మరియు మీ డెలివరీ ప్రాంతాలకు చేరుకోండి.',
        badge_text: '🚀 FOR BUSINESSES',
        media_url: 'https://images.unsplash.com/photo-1556740738-b6a63e27c4df?auto=format&fit=crop&w=900&q=80',
        action_url: '/register-business', ambient_color: '#3b0764', accent_color: '#c084fc'
    }
];

const DEFAULT_SMART_PILL = {
    pill_title_en: 'Subhams Hub Official Store!',
    pill_title_te: 'సుభమ్స్ హబ్ అధికారిక స్టోర్!',
    cta_en: 'Explore',
    cta_te: 'తెరువు',
    action_url: '/expo',
    admin_note_en: 'Welcome to Subhams Hub! Tap the area button to check which verified shops deliver to your village or town.',
    admin_note_te: 'సుభమ్స్ హబ్‌కు స్వాగతం! ఏ ఊరికైనా డెలివరీ చేసే షాపులను సులభంగా చూడవచ్చు.',
    is_active: true
};

const EMPTY_BANNER_FORM = {
    title_en: '', title_te: '', subtitle_en: '', subtitle_te: '',
    badge_text: 'SPECIAL OFFER', media_url: '', action_url: '/expo',
    ambient_color: '#1e1b4b', accent_color: '#facc15'
};

const homeTranslations = {
    en: {
        searchFor: "Search shops, categories & items...",
        searchResults: "Search Results for",
        browse: "Browse", sellers: "Sellers", open: "Open", closed: "Closed",
        home: "Home", dashboard: "Dashboard", shopOrders: "Shop", orders: "Orders",
        expo: "Expo", profile: "Profile", admin: "Admin",
        officialShop: "Subhams Store", usefulApps: "Subhams Ecosystem",
        pmms: "Subhams PMMS", agent: "Subhams Agent", network: "Subhams Network",
        viewAll: "Grid View", lineView: "Auto-Line",
        checkAreaModalTitle: "🚚 Check Delivery Area",
        checkAreaModalSub: "Search any village, mandal, district, or state to discover shops delivering there.",
        manageBanners: "Banners & Ads",
        tabNames: { Expo: "Expo", Trending: "Trending", Shopping: "Shopping", Services: "Services", Business: "Business" }
    },
    te: {
        searchFor: "దుకాణాలు, వస్తువుల కోసం వెతకండి...",
        searchResults: "దీని కోసం శోధన ఫలితాలు",
        browse: "బ్రౌజ్ చేయండి", sellers: "విక్రేతలు", open: "తెరిచి ఉంది", closed: "మూసివేయబడింది",
        home: "హోమ్", dashboard: "డాష్‌బోర్డ్", shopOrders: "షాప్", orders: "ఆర్డర్‌లు",
        expo: "ఎక్స్‌పో", profile: "ప్రొఫైల్", admin: "అడ్మిన్",
        usefulApps: "సుభమ్స్ ఎకోసిస్టమ్", officialShop: "సుభమ్స్ స్టోర్",
        pmms: "సుభమ్స్ PMMS", agent: "సుభమ్స్ ఏజెంట్", network: "సుభమ్స్ నెట్‌‌వర్క్",
        viewAll: "గ్రిడ్ వ్యూ", lineView: "లైన్ వ్యూ",
        checkAreaModalTitle: "🚚 డెలివరీ ప్రాంతాన్ని తనిఖీ చేయండి",
        checkAreaModalSub: "ఏ గ్రామం, మండలం, జిల్లా లేదా రాష్ట్రానికైనా డెలివరీ చేసే షాపులను చూడటానికి ఇక్కడ వెతకండి.",
        manageBanners: "బ్యానర్లు & యాడ్స్",
        tabNames: { Expo: "ఎక్స్‌పో", Trending: "ట్రెండింగ్", Shopping: "షాపింగ్", Services: "సర్వీసులు", Business: "వ్యాపారం" }
    }
};

const categoryTranslations = {
    'Vegetables': 'కూరగాయలు', 'Fruits': 'పండ్లు', 'Groceries': 'కిరాణా', 'Electronics': 'ఎలక్ట్రానిక్స్',
    'Clothing': 'బట్టలు', 'Clothing & Fashion': 'బట్టలు & ఫ్యాషన్', 'Food': 'ఆహారం', 'Catering & Food': 'కేటరింగ్ & ఆహారం',
    'Meat': 'మాంసం', 'Fish': 'చేపలు', 'Services': 'సేవలు', 'Tailoring': 'టైలరింగ్', 'AC Repair': 'AC రిపేర్',
    'Plumbing': 'ప్లంబింగ్', 'Saloon & Beauty': 'సెలూన్ & బ్యూటీ', 'Hardware': 'హార్డ్‌వేర్', 'Mobile Repair': 'మొబైల్ రిపేర్'
};

const CANONICAL_TABS = ['Expo', 'Trending', 'Shopping', 'Services', 'Business'];
const TAB_STYLE = {
    Expo: { icon: '✨', ambient: '#4a044e' },
    Trending: { icon: '🔥', ambient: '#1e1b4b' },
    Shopping: { icon: '🛍️', ambient: '#1e3a8a' },
    Services: { icon: '🧑‍🔧', ambient: '#064e3b' },
    Business: { icon: '📈', ambient: '#78350f' }
};

const renderShopCardBadge = (shop) => {
    const isOfficial = String(shop.user_id) === "1" || shop.user_email === 'pavanvenkat63@gmail.com' || shop.email === 'pavanvenkat63@gmail.com';
    const isVer = shop.is_verified === true || String(shop.is_verified).toLowerCase() === 'true';
    const status = shop.account_status || 'active';
    if (status === 'perma_banned') return <span style={{ background: '#0f172a', color: '#fff', fontSize: 8, padding: '1px 5px', borderRadius: 6, fontWeight: 900 }}>⬛</span>;
    if (status === 'temp_block') return <span style={{ background: '#fef2f2', color: '#dc2626', fontSize: 8, padding: '1px 5px', borderRadius: 6, fontWeight: 900 }}>🟥</span>;
    const fill = isOfficial ? '#facc15' : isVer ? '#10b981' : '#3b82f6';
    return <BadgeCheck size={13} color="#ffffff" fill={fill} style={{ flexShrink: 0 }} />;
};

// Merge admin banners with default banners (adding one never deletes the others)
const mergeWithDefaultBanners = (dbBanners = []) => {
    let deleted = [];
    try { deleted = JSON.parse(localStorage.getItem('subhams_deleted_default_banners') || '[]'); } catch (e) {}
    const defaults = DEFAULT_BANNERS.filter(d => !deleted.includes(d.id) && !dbBanners.some(b => b.title_en === d.title_en));
    return [...dbBanners, ...defaults];
};

const parseUser = (s) => {
    try { return s && s !== 'undefined' ? JSON.parse(s) : null; } catch (e) { return null; }
};

// ---------- Small shared pieces ----------
const ShopCard = ({ shop, ht, tc, onClick, imgH = 84, style }) => (
    <div onClick={onClick} className="touch-scale" style={{ ...S.card, ...style }}>
        <div style={{ position: 'relative', width: '100%', height: imgH, borderRadius: 8, overflow: 'hidden', background: '#f1f5f9', marginBottom: 6 }}>
            {shop.shop_logo ? (
                <img src={getOptimizedImage(shop.shop_logo)} alt={shop.business_name} crossOrigin="anonymous" referrerPolicy="no-referrer" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Store size={26} color="#94a3b8" /></div>
            )}
            <span style={{ position: 'absolute', bottom: 4, right: 4, background: shop.is_online ? 'rgba(22,163,74,.92)' : 'rgba(220,38,38,.92)', color: '#fff', fontSize: 8, fontWeight: 900, padding: '1px 5px', borderRadius: 5 }}>
                {shop.is_online ? ht.open : ht.closed}
            </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <span style={{ ...S.chipName, flex: 1 }}>{shop.business_name}</span>
            {renderShopCardBadge(shop)}
        </div>
        <span style={S.chipCat}>{tc(shop.category)}</span>
        <span style={S.chipTag}>{getDistanceTag(shop)}</span>
    </div>
);

const AreaChip = ({ shop, tc, onClick, fill }) => (
    <div onClick={onClick} className="touch-scale" style={fill ? { ...S.areaChip, minWidth: 0, maxWidth: 'none', width: '100%', boxSizing: 'border-box' } : S.areaChip}>
        <div style={{ position: 'relative', width: 42, height: 42, flexShrink: 0 }}>
            <img src={getOptimizedImage(shop.shop_logo) || PLACEHOLDER} alt={shop.business_name} crossOrigin="anonymous" referrerPolicy="no-referrer" style={{ width: 42, height: 42, borderRadius: 10, objectFit: 'cover', border: '1px solid #e2e8f0', background: '#fff' }} />
            <span style={{ position: 'absolute', bottom: -2, right: -2, width: 10, height: 10, borderRadius: '50%', background: shop.is_online ? '#22c55e' : '#ef4444', border: '2px solid #fff' }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <span style={S.chipName}>{shop.business_name}</span>
                {renderShopCardBadge(shop)}
            </div>
            <span style={S.chipCat}>{tc(shop.category)}</span>
            <span style={S.chipTag}>{getDistanceTag(shop)}</span>
        </div>
    </div>
);

// ======================================================================
// Shops row: 1-2 shops stay fixed on screen. 3+ shops glide slowly and can be moved by touch.
const ShopRow = ({ items, renderItem }) => {
    const ref = useRef(null);
    const paused = useRef(false);
    const timer = useRef(null);
    const many = items.length >= 4;

    useEffect(() => {
        const el = ref.current;
        if (!many || !el) return undefined;
        if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
        let raf;
        let last = performance.now();
        let pos = el.scrollLeft;
        let dir = 1;
        let holdUntil = last + 1500;
        const tick = (now) => {
            const dt = Math.min(now - last, 50);
            last = now;
            const max = el.scrollWidth - el.clientWidth;
            if (paused.current) {
                pos = el.scrollLeft;
            } else if (max > 0 && now > holdUntil) {
                pos += dir * dt * 0.03;
                if (pos >= max) { pos = max; dir = -1; holdUntil = now + 1500; }
                else if (pos <= 0) { pos = 0; dir = 1; holdUntil = now + 1500; }
                el.scrollLeft = pos;
            }
            raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        return () => { cancelAnimationFrame(raf); clearTimeout(timer.current); };
    }, [many, items.length]);

    const hold = () => { paused.current = true; clearTimeout(timer.current); };
    const release = () => {
        clearTimeout(timer.current);
        timer.current = setTimeout(() => { paused.current = false; }, 2500);
    };

    if (!many) {
        return <div style={{ ...S.staticRow, gridTemplateColumns: `repeat(${Math.max(1, items.length)}, minmax(0, 1fr))` }}>{items.map(item => renderItem(item, true))}</div>;
    }
    return (
        <div ref={ref} data-noswipe="1" className="hide-scroll" style={S.hScroll}
            onTouchStart={hold} onTouchEnd={release} onTouchCancel={release}
            onMouseEnter={hold} onMouseLeave={release} onWheel={() => { hold(); release(); }}>
            {items.map(item => renderItem(item, false))}
        </div>
    );
};

const Home = () => {
    const { t, language, setLanguage, location: appLocation } = useContext(AppContext);
    const navigate = useNavigate();
    const currentRoute = useLocation().pathname;

    const [lang, setLocalLang] = useState(() => language === 'te' ? 'te' : 'en');
    useEffect(() => { if (language === 'te' || language === 'en') setLocalLang(language); }, [language]);
    const ht = homeTranslations[lang];

    const toggleLanguage = () => {
        const next = lang === 'en' ? 'te' : 'en';
        setLocalLang(next);
        if (typeof setLanguage === 'function') setLanguage(next);
    };

    const tc = (word) => {
        if (!word) return '';
        if (lang !== 'te') return word;
        return word.split(',').map(w => categoryTranslations[w.trim()] || (typeof t === 'function' ? t(w.trim()) : w.trim())).join(', ');
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
    const [showGridMode, setShowGridMode] = useState(false);

    const [localUserStr, setLocalUserStr] = useState(localStorage.getItem('user'));
    const localUser = parseUser(localUserStr);

    const [customLocation, setCustomLocation] = useState(() => {
        try { return JSON.parse(localStorage.getItem('custom_hub_location')); } catch (e) { return null; }
    });
    const [showLocModal, setShowLocModal] = useState(false);
    const [locSearch, setLocSearch] = useState('');
    const [locResults, setLocResults] = useState([]);
    const [unreadNotifs, setUnreadNotifs] = useState(0);
    const [cartCount, setCartCount] = useState(0);

    const [banners, setBanners] = useState(() => {
        try {
            const saved = JSON.parse(localStorage.getItem('subhams_home_banners'));
            return Array.isArray(saved) && saved.length > 0 ? saved : DEFAULT_BANNERS;
        } catch (e) { return DEFAULT_BANNERS; }
    });
    const [activeBannerIdx, setActiveBannerIdx] = useState(0);
    const [smartPill, setSmartPill] = useState(() => {
        try { return JSON.parse(localStorage.getItem('subhams_smart_pill')) || DEFAULT_SMART_PILL; } catch (e) { return DEFAULT_SMART_PILL; }
    });
    const [isPillExpanded, setIsPillExpanded] = useState(false);
    const [showAssistantModal, setShowAssistantModal] = useState(false);
    const [assistantQuery, setAssistantQuery] = useState('');
    const [showBannerAdminModal, setShowBannerAdminModal] = useState(false);
    const [editingBannerId, setEditingBannerId] = useState(null);
    const [bannerForm, setBannerForm] = useState(EMPTY_BANNER_FORM);
    const [tabDir, setTabDir] = useState('fwd');
    const swipeStart = useRef(null);
    const bannerStart = useRef(null);
    const stripRef = useRef(null);

    useEffect(() => {
        const checkUser = () => {
            const cur = localStorage.getItem('user');
            if (cur !== localUserStr) setLocalUserStr(cur);
        };
        window.addEventListener('storage', checkUser);
        return () => window.removeEventListener('storage', checkUser);
    }, [localUserStr]);

    useEffect(() => {
        if (!localUser?.id) return;
        const token = localStorage.getItem('token');
        if (!token) return;
        axios.get(`${getBackendUrl()}/notifications/my-notifications`, { headers: { Authorization: `Bearer ${token}` } })
            .then(res => setUnreadNotifs(res.data.unreadCount || 0)).catch(() => {});
    }, [localUser?.id]);

    const isVendor = localUser && (localUser.role === 'vendor' || activeShops.some(s => String(s.user_id) === String(localUser.id)));
    const isAdmin = localUser && ((localUser.role && localUser.role.toLowerCase() === 'admin') || localUser.email === 'pavanvenkat63@gmail.com');

    useEffect(() => {
        const updateCartCount = () => {
            let cart = [];
            try { cart = JSON.parse(localStorage.getItem('subhams_cart') || '[]'); } catch (e) {}
            setCartCount(cart.reduce((sum, i) => sum + (i.quantity || i.qty || 1), 0));
        };
        updateCartCount();
        window.addEventListener('storage', updateCartCount);
        return () => window.removeEventListener('storage', updateCartCount);
    }, []);

    useEffect(() => {
        const onResize = () => setIsMobile(window.innerWidth < 1024);
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    const fetchHomeMarketing = async () => {
        try {
            const res = await axios.get(`${getBackendUrl()}/admin/home-banners`);
            const merged = mergeWithDefaultBanners(Array.isArray(res.data?.banners) ? res.data.banners : []);
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

    useEffect(() => {
        if (banners.length <= 1) return;
        const timer = setInterval(() => setActiveBannerIdx(p => (p + 1) % banners.length), 4000);
        return () => clearInterval(timer);
    }, [banners.length]);

    useEffect(() => {
        const t1 = setTimeout(() => setIsPillExpanded(true), 2000);
        const t2 = setTimeout(() => setIsPillExpanded(false), 6500);
        const cycle = setInterval(() => {
            setIsPillExpanded(true);
            setTimeout(() => setIsPillExpanded(false), 4500);
        }, 10000);
        return () => { clearTimeout(t1); clearTimeout(t2); clearInterval(cycle); };
    }, []);

    const activeLat = customLocation?.lat || appLocation?.lat || 0;
    const activeLng = customLocation?.lng || appLocation?.lng || 0;

    useEffect(() => {
        let isMounted = true;
        const fetchLocalFeed = async () => {
            setLoading(true);
            try {
                const API = getBackendUrl();
                const [resFeed, resShops, resCats] = await Promise.allSettled([
                    axios.get(`${API}/products/feed?lat=${activeLat}&lng=${activeLng}`),
                    axios.get(`${API}/shops/active/all`),
                    axios.get(`${API}/admin/categories`)
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

    // ---------- Handlers ----------
    const handleLocationSearch = async (query) => {
        setLocSearch(query);
        if (query.trim().length < 2) return setLocResults([]);
        try {
            const q = normalizeLocationText(query.trim());
            const res = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&countrycodes=in&accept-language=en&q=${encodeURIComponent(q)}`);
            setLocResults(res.data || []);
        } catch (e) {}
    };

    const selectCustomLocation = (loc) => {
        const customLoc = { lat: loc.lat || 0, lng: loc.lon || 0, address: loc.display_name };
        localStorage.setItem('custom_hub_location', JSON.stringify(customLoc));
        setCustomLocation(customLoc);
        setShowLocModal(false);
        setLocSearch('');
        setLocResults([]);
        toast.success(`🚚 Showing shops delivering to ${loc.display_name.split(',')[0]}`);
    };

    const resetLocation = () => {
        localStorage.removeItem('custom_hub_location');
        setCustomLocation(null);
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
                const scale = Math.min(1, 1000 / img.width);
                canvas.width = Math.round(img.width * scale);
                canvas.height = Math.round(img.height * scale);
                canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
                setBannerForm(prev => ({ ...prev, media_url: canvas.toDataURL('image/jpeg', 0.84) }));
                toast.success("🖼️ Banner image ready!");
            };
        };
    };

    const markDefaultDeleted = (id) => {
        let list = [];
        try { list = JSON.parse(localStorage.getItem('subhams_deleted_default_banners') || '[]'); } catch (e) {}
        if (!list.includes(id)) {
            list.push(id);
            localStorage.setItem('subhams_deleted_default_banners', JSON.stringify(list));
        }
    };

    const handleSaveBanner = async (e) => {
        e.preventDefault();
        if (!bannerForm.title_en.trim() && !bannerForm.media_url) return toast.error("Please add a Banner Image or Title.");
        const auth = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };
        const payload = { ...bannerForm, title_en: bannerForm.title_en.trim() || 'Special Promotion' };
        const isDefault = String(editingBannerId).startsWith('default-');

        try {
            if (editingBannerId && !isDefault) {
                await axios.put(`${getBackendUrl()}/admin/home-banners/${editingBannerId}`, payload, auth);
                toast.success("✅ Banner updated!");
            } else {
                if (isDefault) markDefaultDeleted(editingBannerId);
                await axios.post(`${getBackendUrl()}/admin/home-banners`, payload, auth);
                toast.success("🎉 New banner added to carousel!");
            }
            await fetchHomeMarketing();
        } catch (err) {
            const updated = editingBannerId
                ? banners.map(b => b.id === editingBannerId ? { ...b, ...payload } : b)
                : [{ ...payload, id: Date.now() }, ...banners];
            setBanners(updated);
            localStorage.setItem('subhams_home_banners', JSON.stringify(updated));
            toast.success("✅ Banner saved!");
        }
        setEditingBannerId(null);
        setBannerForm(EMPTY_BANNER_FORM);
    };

    const handleDeleteBanner = async (bannerId) => {
        if (!window.confirm("Remove this banner slide?")) return;
        if (String(bannerId).startsWith('default-')) {
            markDefaultDeleted(bannerId);
        } else {
            try {
                await axios.delete(`${getBackendUrl()}/admin/home-banners/${bannerId}`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
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
        try {
            await axios.put(`${getBackendUrl()}/admin/home-smart-pill`, smartPill, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
        } catch (err) {}
        localStorage.setItem('subhams_smart_pill', JSON.stringify(smartPill));
        toast.success("✨ Floating Smart Pill & Greeting updated!");
    };

    const requireLogin = (msg) => {
        toast.info(`Please login to ${msg}!`);
        navigate('/welcome');
    };

    const goTo = (url) => (url.startsWith('http') ? window.open(url, '_blank') : navigate(url));

    const handleCategoryClick = (catKey) => {
        if (catKey === 'Business') {
            if (!localUser) return requireLogin('register a business');
            return navigate('/register-business');
        }
        if (catKey === 'Expo') return navigate('/expo');
        setTabDir(CANONICAL_TABS.indexOf(catKey) >= CANONICAL_TABS.indexOf(selectedCategory) ? 'fwd' : 'back');
        setSelectedCategory(catKey);
        setSelectedSubCategory(null);
        setSearchQuery('');
        setShowSuggestions(false);
    };

    const goHome = () => {
        navigate('/');
        setSelectedCategory('Trending');
        setSelectedSubCategory(null);
        setSearchQuery('');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // ---------- Swipe between tabs (Expo ‹ Trending › Shopping › Services › Business) ----------
    const anyModalOpen = showLocModal || showAssistantModal || showBannerAdminModal;
    const onSwipeStart = (e) => {
        if (anyModalOpen || searchQuery || e.touches.length !== 1 || (e.target.closest && e.target.closest('[data-noswipe]'))) {
            swipeStart.current = null;
            return;
        }
        swipeStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };
    const onSwipeEnd = (e) => {
        const s = swipeStart.current;
        swipeStart.current = null;
        if (!s) return;
        const dx = e.changedTouches[0].clientX - s.x;
        const dy = e.changedTouches[0].clientY - s.y;
        if (Math.abs(dx) < 70 || Math.abs(dx) < Math.abs(dy) * 1.6) return;
        const next = CANONICAL_TABS[CANONICAL_TABS.indexOf(selectedCategory) + (dx < 0 ? 1 : -1)];
        if (!next) return;
        if (navigator.vibrate) navigator.vibrate(8);
        handleCategoryClick(next);
    };

    // Banner: swipe left/right to change slide
    const onBannerStart = (e) => { bannerStart.current = e.touches[0].clientX; };
    const onBannerEnd = (e) => {
        if (bannerStart.current === null) return;
        const dx = e.changedTouches[0].clientX - bannerStart.current;
        bannerStart.current = null;
        if (Math.abs(dx) < 40 || banners.length < 2) return;
        setActiveBannerIdx(i => (i + (dx < 0 ? 1 : -1) + banners.length) % banners.length);
    };

    // Keep the active tab centered in the top strip
    useEffect(() => {
        const strip = stripRef.current;
        const el = strip && strip.querySelector(`[data-tab="${selectedCategory}"]`);
        if (el) strip.scrollTo({ left: el.offsetLeft - (strip.clientWidth - el.offsetWidth) / 2, behavior: 'smooth' });
    }, [selectedCategory]);

    // ---------- Derived data ----------
    const selectedExplorerArea = customLocation?.address || localUser?.address || localUser?.location || '';
    const deliverableShops = activeShops.filter(shop => !selectedExplorerArea || doesShopDeliverToSelectedArea(selectedExplorerArea, shop.delivery_areas));
    const trendingShops = activeShops.filter(shop => (shop.shop_type || '').includes('Trending'));

    const officialHubShop = activeShops.find(s =>
        String(s.user_id) === "1" ||
        s.user_email === 'pavanvenkat63@gmail.com' ||
        s.email === 'pavanvenkat63@gmail.com' ||
        (s.business_name && s.business_name.toLowerCase().includes('subhams'))
    );

    const categoryStats = adminCategories.map(cat => {
        const count = activeShops.filter(shop =>
            (shop.category || '').toLowerCase().split(',').map(c => c.trim()).includes(cat.name.toLowerCase().trim())
        ).length;
        return { ...cat, count };
    });

    const sq = searchQuery.toLowerCase();
    const searchSuggestions = searchQuery.trim() === '' ? [] : [
        ...categoryStats.filter(f => f.name.toLowerCase().includes(sq) && f.count > 0).map(f => ({ type: 'category', name: f.name, section: f.section })),
        ...activeShops.filter(s => s.business_name.toLowerCase().includes(sq) || (s.category || '').toLowerCase().includes(sq)).map(s => ({ type: 'shop', name: s.business_name, id: s.id }))
    ].slice(0, 6);

    const handleSuggestionClick = (sug) => {
        setSearchQuery('');
        setShowSuggestions(false);
        if (sug.type === 'shop') return navigate(`/shop/${sug.id}`);
        setSelectedCategory(sug.section === 'Products' ? 'Shopping' : 'Services');
        setSelectedSubCategory(sug.name);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const filteredProducts = products.filter(p => {
        const s = searchQuery.toLowerCase().trim();
        return !s || (p.name || p.title || '').toLowerCase().includes(s) || (p.category || '').toLowerCase().includes(s);
    });

    const currentTabEnglish = selectedCategory === 'Services' ? 'Services' : (selectedCategory === 'Shopping' ? 'Products' : selectedCategory);
    const activeLocationName = selectedExplorerArea ? selectedExplorerArea.split(',')[0].trim() : (lang === 'te' ? 'అన్ని ప్రాంతాలు' : 'All Areas');

    const currentBanner = banners[activeBannerIdx % Math.max(1, banners.length)] || DEFAULT_BANNERS[0];
    const ambient = selectedCategory === 'Trending' ? (currentBanner.ambient_color || '#1e1b4b') : TAB_STYLE[selectedCategory].ambient;

    const bf = (k) => ({ value: bannerForm[k] || '', onChange: e => setBannerForm({ ...bannerForm, [k]: e.target.value }), style: S.input });
    const pf = (k) => ({ value: smartPill[k] || '', onChange: e => setSmartPill({ ...smartPill, [k]: e.target.value }), style: S.input });

    const ecosystem = [
        { key: 'store', icon: '🏬', label: ht.officialShop, bg: '#fffbeb', bd: '#fde68a', go: () => navigate(officialHubShop ? `/shop/${officialHubShop.id}` : '/shop/1') },
        { key: 'pmms', icon: '💰', label: ht.pmms, bg: '#eff6ff', bd: '#e0e7ff', go: () => window.open('https://pmms.subhamsnetworks.in', '_blank') },
        { key: 'agent', icon: '🖨️', label: ht.agent, bg: '#fef3c7', bd: '#fde68a', go: () => window.open('https://agent.subhamsnetworks.in', '_blank') },
        { key: 'net', icon: '🌐', label: ht.network, bg: '#fce7f3', bd: '#fbcfe8', go: () => window.open('https://subhamsnetworks.in', '_blank') }
    ];

    const onHome = currentRoute === '/' && selectedCategory === 'Trending' && !searchQuery && !selectedSubCategory;

    return (
        <div onTouchStart={onSwipeStart} onTouchEnd={onSwipeEnd} style={{ ...S.page, background: `radial-gradient(circle at 50% 0%, ${ambient}22 0%, #f8fafc 36%, #f8fafc 100%)`, transition: 'background .8s cubic-bezier(.4,0,.2,1)' }}>
            {localUser?.id && <AppPermissions />}
            {loading && <div className="top-progress-bar"></div>}

            <style>{`
                @keyframes topProgressBarAnim { 0% { left: -35%; right: 100%; } 60% { left: 100%; right: -90%; } 100% { left: 100%; right: -90%; } }
                .top-progress-bar { position: fixed; top: 0; left: 0; width: 100%; height: 3px; background: transparent; z-index: 10000; overflow: hidden; }
                .top-progress-bar::before { content: ''; position: absolute; top: 0; bottom: 0; background: #facc15; animation: topProgressBarAnim 1.5s cubic-bezier(.65,.815,.735,.395) infinite; }
                @keyframes logo-shine { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
                .animated-logo { background: linear-gradient(to right, #facc15 20%, #ffffff 40%, #ffffff 60%, #facc15 80%); background-size: 200% auto; color: #000; background-clip: text; -webkit-background-clip: text; -webkit-text-fill-color: transparent; animation: logo-shine 3s linear infinite; }
                .touch-scale { transition: transform .16s cubic-bezier(.25,.8,.25,1); }
                .touch-scale:active { transform: scale(.96); }
                .hide-scroll::-webkit-scrollbar { display: none; }
                .hide-scroll { -ms-overflow-style: none; scrollbar-width: none; }
                @keyframes tabInFwd { from { opacity: 0; transform: translateX(18px); } to { opacity: 1; transform: none; } }
                @keyframes tabInBack { from { opacity: 0; transform: translateX(-18px); } to { opacity: 1; transform: none; } }
                .tab-fwd { animation: tabInFwd .28s cubic-bezier(.22,1,.36,1); }
                .tab-back { animation: tabInBack .28s cubic-bezier(.22,1,.36,1); }
                @media (prefers-reduced-motion: reduce) { .tab-fwd, .tab-back { animation: none; } }
            `}</style>

            {/* ================= HEADER ================= */}
            <div data-noswipe="1" style={{ ...S.headerStack, background: `linear-gradient(135deg, #090d16 0%, ${ambient} 100%)` }}>
                <div style={S.headerTop}>
                    <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => { goHome(); setSelectedSubCategory(null); }}>
                        <h1 style={{ margin: 0, display: 'flex', alignItems: 'baseline', gap: 4 }}>
                            <span className="animated-logo" style={{ fontSize: 20, fontWeight: 900, letterSpacing: '-.5px' }}>SUBHAMS</span>
                            <span style={{ fontSize: 10.5, background: 'rgba(250,204,21,.2)', color: '#facc15', padding: '2px 6px', borderRadius: 6, fontWeight: 900, letterSpacing: 1, border: '1px solid rgba(250,204,21,.35)' }}>HUB</span>
                        </h1>
                    </div>

                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        {isAdmin && (
                            <button onClick={() => setShowBannerAdminModal(true)} style={{ ...S.pillBtn, color: '#facc15', border: '1px solid rgba(250,204,21,.4)', fontSize: 11, fontWeight: 900, padding: '4px 9px' }}>
                                <Edit3 size={12} /> {isMobile ? 'Ads' : ht.manageBanners}
                            </button>
                        )}
                        <button onClick={toggleLanguage} style={S.pillBtn} title="Switch Language">
                            <Globe size={12} color="#facc15" /><span>{lang === 'en' ? 'తెలుగు' : 'EN'}</span>
                        </button>
                        <button onClick={() => navigate('/notifications')} style={S.bellBtn}>
                            🔔
                            {unreadNotifs > 0 && <span style={S.bellBadge}>{unreadNotifs > 99 ? '99+' : unreadNotifs}</span>}
                        </button>
                        {isAdmin ? (
                            <button onClick={() => navigate('/admin')} style={S.adminBtn}><ShieldCheck size={13} /> {isMobile ? '' : ht.admin}</button>
                        ) : !localUser ? (
                            <button onClick={() => navigate('/welcome')} style={S.loginBtn}><User size={13} /> Login</button>
                        ) : null}
                    </div>
                </div>

                <div style={{ padding: '4px 12px 6px', width: '100%', boxSizing: 'border-box' }}>
                    <div style={{ position: 'relative' }}>
                        <input
                            type="text"
                            placeholder={selectedSubCategory ? `Search in ${tc(selectedSubCategory)}...` : ht.searchFor}
                            style={S.search}
                            value={searchQuery}
                            onChange={(e) => { setSearchQuery(e.target.value); setShowSuggestions(true); }}
                            onFocus={() => setShowSuggestions(true)}
                            onBlur={() => setTimeout(() => setShowSuggestions(false), 250)}
                        />
                        {searchQuery ? (
                            <button onClick={() => setSearchQuery('')} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: '#f1f5f9', border: 'none', borderRadius: '50%', width: 22, height: 22, cursor: 'pointer', fontWeight: 'bold' }}>✕</button>
                        ) : (
                            <div style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: '#eff6ff', padding: 5, borderRadius: '50%', display: 'flex' }}>
                                <Search size={13} color="#2563eb" />
                            </div>
                        )}
                        {showSuggestions && searchSuggestions.length > 0 && (
                            <div style={S.sugBox}>
                                {searchSuggestions.map((sug, i) => (
                                    <div key={i} style={S.sugItem} onClick={() => handleSuggestionClick(sug)}>
                                        {sug.type === 'category' ? <Folder size={15} color="#f59e0b" style={{ flexShrink: 0 }} /> : <Store size={15} color="#4f46e5" style={{ flexShrink: 0 }} />}
                                        <span style={{ fontWeight: 900, color: '#0f172a', fontSize: 13, flex: 1 }}>{sug.type === 'category' ? `${tc(sug.name)} Category` : sug.name}</span>
                                        {sug.type === 'shop' && <span style={{ fontSize: 10, background: '#e0e7ff', color: '#4f46e5', padding: '2px 8px', borderRadius: 10, fontWeight: 'bold' }}>Visit</span>}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div ref={stripRef} style={{ width: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch', borderTop: '1px solid rgba(255,255,255,.08)' }} className="hide-scroll">
                    <div style={{ display: 'flex', gap: 8, padding: '6px 12px', width: 'max-content', margin: '0 auto', position: 'relative' }}>
                        {CANONICAL_TABS.map(key => (
                            <span key={key} data-tab={key} onClick={() => handleCategoryClick(key)} style={{ ...S.tab, ...(selectedCategory === key ? S.tabOn : S.tabOff) }}>
                                {TAB_STYLE[key].icon} {ht.tabNames[key]}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            {localUser?.account_status === 'warned' && (
                <div style={{ background: '#fef2f2', borderBottom: '2px solid #ef4444', padding: '6px 12px', textAlign: 'center' }}>
                    <span style={{ fontSize: 11.5, fontWeight: 800, color: '#b91c1c' }}>
                        🛡️ SECURITY WARNING: {localUser.ban_reason || 'Please adhere to our community guidelines.'}
                    </span>
                </div>
            )}

            {/* ================= MAIN CONTENT ================= */}
            <div key={selectedCategory} className={tabDir === 'fwd' ? 'tab-fwd' : 'tab-back'} style={{ maxWidth: 980, margin: '0 auto', padding: isMobile ? '10px' : '12px 16px', width: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {searchQuery && !showSuggestions ? (
                    <div style={{ padding: 4 }}>
                        <h2 style={{ fontSize: 16, marginBottom: 10, color: '#0f172a', fontWeight: 900 }}>{ht.searchResults} "{searchQuery}"</h2>
                        {filteredProducts.length > 0 ? (
                            <div style={S.productGrid}>
                                {filteredProducts.map(p => <ProductCard key={p.id} product={p} t={t} />)}
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', padding: 24, background: 'white', borderRadius: 14, border: '1px dashed #cbd5e1' }}>
                                <p style={{ color: '#64748b', fontWeight: 'bold', margin: 0 }}>No items found. Try a different search.</p>
                            </div>
                        )}
                    </div>
                ) : (
                    <>
                        {selectedCategory === 'Trending' && (
                            <>
                                {/* 1. HERO BANNER */}
                                <div>
                                    <div data-noswipe="1" onTouchStart={onBannerStart} onTouchEnd={onBannerEnd} style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', height: isMobile ? 138 : 156, border: '2px solid rgba(250,204,21,.65)', boxShadow: '0 8px 22px rgba(15,23,42,.14)', background: '#090d16' }}>
                                        <div style={{ display: 'flex', height: '100%', width: '100%', transform: `translateX(-${(activeBannerIdx % Math.max(1, banners.length)) * 100}%)`, transition: 'transform .5s cubic-bezier(.22,1,.36,1)' }}>
                                            {banners.map((b, idx) => {
                                                const bTitle = lang === 'te' ? (b.title_te || b.title_en) : b.title_en;
                                                const bSub = lang === 'te' ? (b.subtitle_te || b.subtitle_en) : b.subtitle_en;
                                                return (
                                                    <div key={b.id || idx} onClick={() => goTo(b.action_url || '/expo')}
                                                        style={{ minWidth: '100%', height: '100%', position: 'relative', background: `linear-gradient(115deg, ${b.ambient_color || '#1e1b4b'} 0%, #0f172a 55%, ${b.ambient_color || '#1e1b4b'} 100%)`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: isMobile ? '12px 14px' : '14px 24px', boxSizing: 'border-box', overflow: 'hidden' }}>
                                                        <div style={{ position: 'relative', zIndex: 2, flex: 1, paddingRight: 10, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 4 }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                                <span style={{ background: b.accent_color || '#facc15', color: '#0f172a', fontSize: 9.5, fontWeight: 900, padding: '2px 8px', borderRadius: 4, letterSpacing: .5, textTransform: 'uppercase' }}>{b.badge_text || 'FEATURED'}</span>
                                                                <span style={{ fontSize: 10, color: '#cbd5e1', fontWeight: 700 }}>| Subhams Verified</span>
                                                            </div>
                                                            <h2 style={{ margin: '2px 0 0', color: '#fff', fontSize: isMobile ? 16 : 21, fontWeight: 900, lineHeight: 1.15 }}>{bTitle}</h2>
                                                            {bSub && <p style={{ margin: 0, color: '#e2e8f0', fontSize: isMobile ? 11 : 12.5, fontWeight: 600, lineHeight: 1.25, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{bSub}</p>}
                                                            <div style={{ marginTop: 4, alignSelf: 'flex-start', background: 'rgba(255,255,255,.95)', color: '#0f172a', padding: '3px 10px', borderRadius: 6, fontSize: 10, fontWeight: 900, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                                                <span>⚡ {lang === 'te' ? 'ఇప్పుడే ఓపెన్ చేయండి' : 'Zero Commission • Tap to Open'}</span>
                                                                <ChevronRight size={12} color="#2563eb" />
                                                            </div>
                                                        </div>
                                                        {b.media_url && (
                                                            <div style={{ position: 'relative', zIndex: 2, width: isMobile ? 115 : 175, height: isMobile ? 112 : 130, borderRadius: 12, background: 'rgba(15,23,42,.55)', border: '1px solid rgba(255,255,255,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0, padding: 4, boxSizing: 'border-box' }}>
                                                                <img src={getOptimizedImage(b.media_url)} alt={bTitle} style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 8 }} />
                                                            </div>
                                                        )}
                                                        <span style={{ position: 'absolute', bottom: 6, right: 10, fontSize: 8.5, fontWeight: 900, color: 'rgba(255,255,255,.6)', zIndex: 3 }}>AD</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 5, marginTop: 6 }}>
                                        {banners.map((b, idx) => (
                                            <div key={b.id || idx} onClick={() => setActiveBannerIdx(idx)}
                                                style={{ height: 4, width: activeBannerIdx === idx ? 20 : 7, borderRadius: 4, background: activeBannerIdx === idx ? '#0f172a' : '#cbd5e1', cursor: 'pointer', transition: 'all .3s ease' }} />
                                        ))}
                                    </div>
                                </div>

                                {/* QUICK MENU */}
                                <div style={{ ...S.section, padding: '12px 6px' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))' }}>
                                        {[
                                            { key: 'shop', Icon: ShoppingBag, label: ht.tabNames.Shopping, c: '#2563eb', bg: '#eff6ff', go: () => handleCategoryClick('Shopping') },
                                            { key: 'svc', Icon: Wrench, label: ht.tabNames.Services, c: '#16a34a', bg: '#f0fdf4', go: () => handleCategoryClick('Services') },
                                            { key: 'biz', Icon: TrendingUp, label: ht.tabNames.Business, c: '#d97706', bg: '#fffbeb', go: () => handleCategoryClick('Business') },
                                            { key: 'ord', Icon: Package, label: ht.orders, c: '#7c3aed', bg: '#f5f3ff', go: () => (localUser ? navigate('/my-orders') : requireLogin('view your orders')) },
                                            { key: 'pro', Icon: User, label: ht.profile, c: '#475569', bg: '#f1f5f9', go: () => (localUser ? navigate('/profile') : requireLogin('view your profile')) }
                                        ].map(({ key, Icon, label, c, bg, go }) => (
                                            <div key={key} onClick={go} className="touch-scale" style={S.qItem}>
                                                <div style={{ ...S.qIcon, background: bg, color: c, border: `1px solid ${c}22` }}><Icon size={20} /></div>
                                                <span style={S.appText}>{label}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* 2. DELIVERING TO (pick any area) */}
                                <div style={S.section}>
                                    <div style={S.secHead}>
                                        <h2 style={S.secTitle}>🚚 {lang === 'te' ? 'డెలివరీ' : 'Delivering to'}</h2>
                                        <button type="button" onClick={() => setShowLocModal(true)} style={S.areaPill}>
                                            <MapPin size={13} /><span>{activeLocationName}</span><span style={{ fontSize: 10 }}>▾</span>
                                        </button>
                                    </div>
                                    <p style={S.hint}>{lang === 'te' ? 'మీ అడ్రస్ మాత్రమే కాదు, ఏ ఊరైనా చెక్ చేయవచ్చు' : 'Tap the area to check any village or town'}</p>

                                    {deliverableShops.length === 0 ? (
                                        <div style={S.emptyRow}>
                                            <span>No shops listed for <strong>{activeLocationName}</strong> yet.</span>
                                            <button type="button" onClick={resetLocation} style={{ background: '#2563eb', color: 'white', border: 'none', padding: '5px 10px', borderRadius: 8, fontSize: 11, fontWeight: 800, cursor: 'pointer', flexShrink: 0 }}>Reset</button>
                                        </div>
                                    ) : (
                                        <div>
                                            <ShopRow items={deliverableShops} renderItem={(shop, fill) => <AreaChip key={shop.id} shop={shop} tc={tc} fill={fill} onClick={() => navigate(`/shop/${shop.id}`)} />} />
                                        </div>
                                    )}
                                </div>

                                {/* 3. TRENDING SHOPS */}
                                <div>
                                    <div style={S.secHead}>
                                        <h2 style={S.secTitle}>
                                            🔥 {lang === 'te' ? 'ట్రెండింగ్ షాపులు' : 'Trending Shops'}
                                            <span style={S.countBadge}>{trendingShops.length}</span>
                                        </h2>
                                        {trendingShops.length > 4 && (
                                            <button type="button" onClick={() => setShowGridMode(!showGridMode)} style={S.linkBtn}>{showGridMode ? ht.lineView : ht.viewAll}</button>
                                        )}
                                    </div>
                                    {trendingShops.length === 0 ? (
                                        <div style={S.emptyRow}>
                                            {isAdmin ? "No shops are marked 'Trending' yet. Admin Dashboard → Edit a shop → tick '🔥 Trending'." : "Featured trending shops will appear here soon."}
                                        </div>
                                    ) : (
                                        <div style={showGridMode ? (isMobile ? S.grid2 : S.productGrid) : undefined}>
                                            {!showGridMode && <ShopRow items={trendingShops} renderItem={(shop, fill) => <ShopCard key={shop.id} shop={shop} ht={ht} tc={tc} onClick={() => navigate(`/shop/${shop.id}`)} style={fill ? { width: '100%' } : undefined} />} />}
                                            {showGridMode && trendingShops.map(shop => (
                                                <ShopCard key={shop.id} shop={shop} ht={ht} tc={tc} onClick={() => navigate(`/shop/${shop.id}`)} style={{ width: '100%' }} />
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* 4. EXPO STRIP */}
                                <div onClick={() => navigate('/expo')} className="touch-scale" style={S.expoStrip}>
                                    <span style={{ fontSize: 26 }}>🎬</span>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: 10, fontWeight: 800, color: '#64748b' }}>Subhams Expo • AD</div>
                                        <div style={{ fontSize: 13.5, fontWeight: 900, color: '#0f172a', lineHeight: 1.25 }}>
                                            {lang === 'te' ? 'మీ షాప్ వీడియోలు & ఆఫర్లు ఉచితంగా చూడండి!' : 'Watch local shop videos & offers'}
                                        </div>
                                    </div>
                                    <span style={S.expoBtn}>{lang === 'te' ? 'తెరువు' : 'Open'}</span>
                                </div>

                                {/* 5. ECOSYSTEM */}
                                <div style={S.section}>
                                    <h2 style={S.secTitle}><Grid size={14} color="#4f46e5" /> {ht.usefulApps}</h2>
                                    <div style={S.appGrid}>
                                        {ecosystem.map(app => (
                                            <div key={app.key} onClick={app.go} className="touch-scale" style={S.appItem}>
                                                <div style={{ ...S.appIcon, background: app.bg, border: `1px solid ${app.bd}` }}>{app.icon}</div>
                                                <span style={S.appText}>{app.label}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div style={{ height: 64 }} />
                            </>
                        )}

                        {/* SHOPPING & SERVICES TABS */}
                        {(selectedCategory === 'Shopping' || selectedCategory === 'Services') && (
                            <div style={S.section}>
                                {!selectedSubCategory ? (
                                    <>
                                        <h2 style={{ fontSize: 17, margin: '0 0 14px', color: '#0f172a', fontWeight: 900 }}>{ht.browse} {ht.tabNames[selectedCategory]}</h2>
                                        {(() => {
                                            const cats = adminCategories.filter(c => c.section && c.section.toLowerCase() === currentTabEnglish.toLowerCase());
                                            if (cats.length === 0) return <div style={S.emptyRow}>Categories will appear once created by the Admin.</div>;
                                            return (
                                                <div style={isMobile ? S.grid4 : { display: 'flex', gap: 16, flexWrap: 'wrap', width: '100%' }}>
                                                    {cats.map((cat, i) => (
                                                        <div key={i} className="touch-scale" onClick={() => setSelectedSubCategory(cat.name)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: isMobile ? '100%' : 95, cursor: 'pointer' }}>
                                                            <div style={{ background: '#f8fafc', padding: 5, borderRadius: 20, border: '1px solid #e2e8f0' }}>
                                                                <img src={getOptimizedImage(cat.hd_image) || `https://via.placeholder.com/150/e2e8f0/64748b?text=${cat.name.substring(0, 3)}`} alt={cat.name} crossOrigin="anonymous" referrerPolicy="no-referrer" style={{ width: isMobile ? 62 : 80, height: isMobile ? 62 : 80, borderRadius: 16, objectFit: 'cover', background: 'white' }} />
                                                            </div>
                                                            <span style={{ fontSize: isMobile ? 11 : 13, marginTop: 6, fontWeight: 800, color: '#0f172a', textAlign: 'center', lineHeight: 1.2 }}>{tc(cat.name)}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            );
                                        })()}
                                    </>
                                ) : (
                                    <>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                                            <button className="touch-scale" onClick={() => setSelectedSubCategory(null)} style={{ background: '#f8fafc', border: '1px solid #cbd5e1', padding: '7px 12px', borderRadius: 10, cursor: 'pointer', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 5, fontSize: 12.5 }}>
                                                <ArrowLeft size={15} /> Back
                                            </button>
                                            <h2 style={{ fontSize: 17, margin: 0, color: '#0f172a', fontWeight: 900 }}>{tc(selectedSubCategory)} {ht.sellers}</h2>
                                        </div>
                                        <div style={isMobile ? S.grid2 : S.productGrid}>
                                            {activeShops.filter(shop => {
                                                const matchesTab = (shop.shop_type || 'Products').toLowerCase().includes(currentTabEnglish.toLowerCase());
                                                const target = selectedSubCategory.toLowerCase().trim();
                                                const matchesCat = (shop.category || '').toLowerCase().split(',').map(c => c.trim()).some(c => c === target || c.includes(target) || target.includes(c));
                                                return matchesTab && matchesCat;
                                            }).map(shop => (
                                                <ShopCard key={shop.id} shop={shop} ht={ht} tc={tc} imgH={115} style={{ width: '100%' }} onClick={() => navigate(`/shop/${shop.id}`)} />
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* ================= FLOATING SMART PILL ================= */}
            {smartPill?.is_active !== false && (
                <div style={{ position: 'fixed', bottom: 76, right: 14, zIndex: 950, display: 'flex', justifyContent: 'flex-end' }}>
                    <div onClick={() => setShowAssistantModal(true)}
                        style={{ display: 'flex', alignItems: 'center', background: isPillExpanded ? 'linear-gradient(135deg, #facc15, #f59e0b)' : 'linear-gradient(135deg, #0f172a, #1e3a8a)', color: isPillExpanded ? '#0f172a' : '#fff', borderRadius: 40, padding: isPillExpanded ? '5px 8px 5px 14px' : 0, width: isPillExpanded ? (isMobile ? 270 : 300) : 46, height: 46, boxShadow: '0 10px 25px rgba(15,23,42,.32)', border: isPillExpanded ? '2px solid #fde047' : '2px solid #facc15', cursor: 'pointer', overflow: 'hidden', transition: 'all .45s cubic-bezier(.16,1,.3,1)', justifyContent: isPillExpanded ? 'space-between' : 'center', boxSizing: 'border-box' }}>
                        {isPillExpanded ? (
                            <>
                                <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', paddingRight: 6 }}>
                                    <span style={{ fontSize: 8.5, fontWeight: 900, color: '#78350f' }}>✨ SUBHAMS SMART HUB</span>
                                    <span style={{ fontSize: 11.5, fontWeight: 900, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {lang === 'te' ? (smartPill.pill_title_te || smartPill.pill_title_en) : smartPill.pill_title_en}
                                    </span>
                                </div>
                                <span style={{ background: '#db2777', color: '#fff', padding: '5px 10px', borderRadius: 20, fontSize: 10, fontWeight: 900, whiteSpace: 'nowrap', flexShrink: 0 }}>
                                    {lang === 'te' ? (smartPill.cta_te || 'తెరువు') : (smartPill.cta_en || 'Explore')}
                                </span>
                            </>
                        ) : (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', position: 'relative' }}>
                                <Bot size={20} color="#facc15" />
                                <span style={{ position: 'absolute', top: 6, right: 6, width: 8, height: 8, background: '#22c55e', borderRadius: '50%', border: '1.5px solid #0f172a' }}></span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ================= ASSISTANT MODAL ================= */}
            {showAssistantModal && (
                <div style={S.overlay} onClick={() => setShowAssistantModal(false)}>
                    <div style={{ ...S.modal, maxWidth: 420 }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div style={{ width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg, #0f172a, #2563eb)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Bot size={18} color="#facc15" /></div>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: 15.5, fontWeight: 900, color: '#0f172a' }}>Subhams Smart Hub</h3>
                                    <span style={{ fontSize: 10.5, color: '#16a34a', fontWeight: 800 }}>● Live Assistant & Admin Notes</span>
                                </div>
                            </div>
                            <X size={20} style={{ cursor: 'pointer', color: '#64748b' }} onClick={() => setShowAssistantModal(false)} />
                        </div>

                        <div style={{ background: 'linear-gradient(135deg, #fffbeb, #fef3c7)', border: '1px solid #fde68a', padding: 12, borderRadius: 12, marginBottom: 12 }}>
                            <div style={{ fontSize: 10, fontWeight: 900, color: '#b45309', textTransform: 'uppercase', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}><Megaphone size={12} /> Official Note & Offer</div>
                            <p style={{ margin: '0 0 8px', fontSize: 12.5, color: '#78350f', fontWeight: 700, lineHeight: 1.4 }}>
                                {lang === 'te' ? (smartPill.admin_note_te || smartPill.admin_note_en) : smartPill.admin_note_en}
                            </p>
                            <button onClick={() => { setShowAssistantModal(false); goTo(smartPill.action_url || '/expo'); }}
                                style={{ background: '#0f172a', color: '#facc15', border: 'none', padding: '7px 12px', borderRadius: 8, fontSize: 11.5, fontWeight: 900, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                                {lang === 'te' ? (smartPill.pill_title_te || smartPill.pill_title_en) : smartPill.pill_title_en} <ExternalLink size={12} />
                            </button>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                            <button onClick={() => { setShowAssistantModal(false); setShowLocModal(true); }} style={S.quickBtn}>🚚 {lang === 'te' ? 'డెలివరీ ఏరియా చెక్' : 'Check Delivery Area'}</button>
                            <button onClick={() => { setShowAssistantModal(false); navigate('/expo'); }} style={S.quickBtn}>🌟 {lang === 'te' ? 'లైవ్ ఎక్స్‌పో ఫీడ్' : 'Watch Expo Videos'}</button>
                            <button onClick={() => { setShowAssistantModal(false); navigate(officialHubShop ? `/shop/${officialHubShop.id}` : '/shop/1'); }} style={S.quickBtn}>🏬 {lang === 'te' ? 'సుభమ్స్ అధికారిక స్టోర్' : 'Official Subhams Store'}</button>
                            <button onClick={() => { setShowAssistantModal(false); localUser ? navigate('/register-business') : requireLogin('register a shop'); }} style={S.quickBtn}>📈 {lang === 'te' ? 'షాప్ రిజిస్టర్ చేయండి' : 'Register Your Shop'}</button>
                        </div>

                        <div style={{ display: 'flex', gap: 8 }}>
                            <input type="text" placeholder={lang === 'te' ? 'షాప్ లేదా వస్తువు పేరు టైప్ చేయండి...' : 'Ask or search any shop/service...'} value={assistantQuery} onChange={e => setAssistantQuery(e.target.value)} style={{ ...S.locInput, padding: '10px 12px', fontSize: 13, flex: 1 }} />
                            <button onClick={() => { if (!assistantQuery.trim()) return; setSearchQuery(assistantQuery.trim()); setShowAssistantModal(false); }} style={{ background: '#2563eb', color: 'white', border: 'none', padding: '0 14px', borderRadius: 10, fontWeight: 900, cursor: 'pointer' }}>Go</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ================= DELIVERY AREA MODAL ================= */}
            {showLocModal && (
                <div style={S.overlay} onClick={() => setShowLocModal(false)}>
                    <div style={S.modal} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                            <h3 style={{ margin: 0, fontSize: 16.5, color: '#0f172a', fontWeight: 900 }}>{ht.checkAreaModalTitle}</h3>
                            <X size={20} style={{ cursor: 'pointer', color: '#64748b' }} onClick={() => setShowLocModal(false)} />
                        </div>
                        <p style={{ margin: '0 0 10px', fontSize: 11.5, color: '#475569', lineHeight: 1.4, fontWeight: 600 }}>{ht.checkAreaModalSub}</p>

                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                            {[
                                { label: '🌍 All India', val: 'India' },
                                { label: '📍 Andhra Pradesh', val: 'Andhra Pradesh, India' },
                                { label: '📍 Konanki', val: 'Konanki, Martur, Bapatla, Andhra Pradesh, 523260, India' },
                                { label: '📍 Martur', val: 'Martur, Bapatla, Andhra Pradesh, India' },
                                { label: '📍 Bapatla', val: 'Bapatla, Andhra Pradesh, India' }
                            ].map((p, i) => (
                                <button key={i} type="button" onClick={() => selectCustomLocation({ display_name: p.val, lat: 0, lon: 0 })}
                                    style={{ background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', padding: '5px 10px', borderRadius: 14, fontSize: 11, fontWeight: 800, cursor: 'pointer' }}>{p.label}</button>
                            ))}
                        </div>

                        <input type="text" placeholder="Search any village, town, district, or pincode..." style={S.locInput} value={locSearch} onChange={e => handleLocationSearch(e.target.value)} autoFocus />

                        {locResults.length > 0 && (
                            <div style={{ marginTop: 10, maxHeight: 200, overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: 12 }}>
                                {locResults.map((loc, i) => {
                                    const parts = loc.display_name.split(',').map(p => p.trim());
                                    return (
                                        <div key={i} className="touch-scale" style={{ padding: '10px 12px', borderBottom: '1px solid #f1f5f9', cursor: 'pointer', display: 'flex', alignItems: 'flex-start', gap: 8 }} onClick={() => selectCustomLocation(loc)}>
                                            <MapPin size={15} color="#2563eb" style={{ flexShrink: 0, marginTop: 2 }} />
                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                <span style={{ fontSize: 13, fontWeight: 900, color: '#0f172a' }}>{parts[0]}</span>
                                                <span style={{ fontSize: 10.5, color: '#64748b' }}>{parts.slice(1).join(', ')}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ================= ADMIN BANNER STUDIO ================= */}
            {showBannerAdminModal && isAdmin && (
                <div style={S.overlay} onClick={() => setShowBannerAdminModal(false)}>
                    <div style={{ ...S.modal, maxWidth: 500, maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, borderBottom: '1px solid #e2e8f0', paddingBottom: 8 }}>
                            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: '#0f172a' }}>🎨 Home Banners & Smart Pill Studio</h3>
                            <X size={20} style={{ cursor: 'pointer', color: '#64748b' }} onClick={() => setShowBannerAdminModal(false)} />
                        </div>

                        <form onSubmit={handleSaveBanner} style={{ background: '#f8fafc', padding: 12, borderRadius: 14, border: '1px solid #cbd5e1', marginBottom: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <h4 style={{ margin: 0, fontSize: 13, color: '#1e3a8a', fontWeight: 900 }}>{editingBannerId ? '✏️ Edit Selected Banner Slide' : '➕ Add New Banner Slide (Keeps existing slides!)'}</h4>
                            <div style={S.twoCol}>
                                <input type="text" placeholder="English Title *" required {...bf('title_en')} />
                                <input type="text" placeholder="Telugu Title" {...bf('title_te')} />
                                <input type="text" placeholder="English Subtitle" {...bf('subtitle_en')} />
                                <input type="text" placeholder="Telugu Subtitle" {...bf('subtitle_te')} />
                                <input type="text" placeholder="Badge (e.g. MEGA OFFER)" {...bf('badge_text')} />
                                <input type="text" placeholder="Click URL (e.g. /shop/1 or /expo)" {...bf('action_url')} />
                            </div>
                            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                                {[['ambient_color', 'Ambient Color:'], ['accent_color', 'Badge Color:']].map(([k, label]) => (
                                    <label key={k} style={{ fontSize: 11.5, fontWeight: 800, color: '#334155', display: 'flex', alignItems: 'center', gap: 5 }}>
                                        {label}
                                        <input type="color" value={bannerForm[k]} onChange={e => setBannerForm({ ...bannerForm, [k]: e.target.value })} style={{ width: 32, height: 24, border: 'none', cursor: 'pointer' }} />
                                    </label>
                                ))}
                            </div>
                            <div>
                                <label style={{ fontSize: 11, fontWeight: 800, color: '#475569', display: 'block', marginBottom: 4 }}>Upload Banner Photo / GIF (or paste URL):</label>
                                <input type="file" accept="image/*,image/gif" onChange={handleBannerMediaUpload} style={{ fontSize: 11.5, marginBottom: 6, width: '100%' }} />
                                <input type="text" placeholder="Or paste Photo/GIF URL (https://...)" value={bannerForm.media_url && !bannerForm.media_url.startsWith('data:') ? bannerForm.media_url : ''} onChange={e => setBannerForm({ ...bannerForm, media_url: e.target.value })} style={S.input} />
                            </div>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <button type="submit" style={{ background: '#16a34a', color: 'white', border: 'none', padding: 9, borderRadius: 8, fontWeight: 900, fontSize: 12.5, cursor: 'pointer', flex: 1 }}>{editingBannerId ? 'Save Changes' : '➕ Add Slide to Carousel'}</button>
                                {editingBannerId && (
                                    <button type="button" onClick={() => { setEditingBannerId(null); setBannerForm(EMPTY_BANNER_FORM); }} style={{ background: '#64748b', color: 'white', border: 'none', padding: 9, borderRadius: 8, fontWeight: 800, fontSize: 12.5, cursor: 'pointer' }}>Cancel</button>
                                )}
                            </div>
                        </form>

                        <div style={{ marginBottom: 14 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                <h4 style={{ margin: 0, fontSize: 12.5, color: '#475569', fontWeight: 900 }}>Active Carousel Slides ({banners.length})</h4>
                                <button type="button" onClick={handleRestoreDefaultBanners} style={{ ...S.linkBtn, fontSize: 11, textDecoration: 'underline' }}>Restore Defaults</button>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                {banners.map((b, idx) => (
                                    <div key={b.id || idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', borderRadius: 10, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
                                            <span style={{ fontSize: 11, fontWeight: 900, color: '#64748b' }}>#{idx + 1}</span>
                                            {b.media_url && <img src={b.media_url} alt="" style={{ width: 32, height: 24, borderRadius: 4, objectFit: 'cover', flexShrink: 0 }} />}
                                            <span style={{ fontSize: 12.5, fontWeight: 800, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.title_en}</span>
                                        </div>
                                        <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
                                            <button type="button" onClick={() => { setEditingBannerId(b.id); setBannerForm(b); }} style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', padding: '4px 7px', borderRadius: 6, cursor: 'pointer' }}><Edit3 size={12} /></button>
                                            <button type="button" onClick={() => handleDeleteBanner(b.id)} style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', padding: '4px 7px', borderRadius: 6, cursor: 'pointer' }}><Trash2 size={12} /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <form onSubmit={handleSaveSmartPill} style={{ background: '#fffbeb', padding: 12, borderRadius: 14, border: '1px solid #fde68a', display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <h4 style={{ margin: 0, fontSize: 13, color: '#b45309', fontWeight: 900 }}>✨ Floating Expanding Pill & Admin Greeting</h4>
                            <div style={S.twoCol}>
                                <input type="text" placeholder="Pill Text (EN)" {...pf('pill_title_en')} />
                                <input type="text" placeholder="Pill Text (TE)" {...pf('pill_title_te')} />
                            </div>
                            <textarea placeholder="Admin Greeting / Offer Note (EN)" {...pf('admin_note_en')} style={{ ...S.input, minHeight: 48 }} />
                            <textarea placeholder="Admin Greeting / Offer Note (TE)" {...pf('admin_note_te')} style={{ ...S.input, minHeight: 48 }} />
                            <input type="text" placeholder="Pill Action URL (e.g. /shop/1 or /expo)" {...pf('action_url')} />
                            <button type="submit" style={{ background: '#d97706', color: 'white', border: 'none', padding: 9, borderRadius: 8, fontWeight: 900, fontSize: 12.5, cursor: 'pointer' }}>Save Floating Pill & Greeting</button>
                        </form>
                    </div>
                </div>
            )}

            {/* ================= BOTTOM NAV ================= */}
            <div style={S.nav}>
                <button onClick={goHome} style={navBtn(onHome)}><HomeIcon size={20} /><span>{ht.home}</span></button>
                <button onClick={() => navigate('/expo')} style={navBtn(currentRoute === '/expo')}><Sparkles size={20} /><span>{ht.expo}</span></button>
                {isVendor ? (
                    <button onClick={() => navigate('/dashboard')} style={navBtn(currentRoute === '/dashboard')}><LayoutDashboard size={20} /><span>{ht.dashboard}</span></button>
                ) : (
                    <button onClick={() => localUser ? navigate('/my-orders') : requireLogin('view your orders')} style={navBtn(currentRoute === '/my-orders')}>
                        <div style={{ position: 'relative' }}><Package size={20} />{cartCount > 0 && <span style={S.navBadge}>{cartCount}</span>}</div>
                        <span>{ht.orders}</span>
                    </button>
                )}
                {isVendor && (
                    <button onClick={() => navigate('/vendor/orders')} style={navBtn(currentRoute === '/vendor/orders', true)}><Store size={20} /><span>{ht.shopOrders}</span></button>
                )}
                <button onClick={() => localUser ? navigate('/profile') : requireLogin('view your profile')} style={navBtn(currentRoute === '/profile')}><User size={20} /><span>{ht.profile}</span></button>
            </div>
            <div style={{ height: 65 }}></div>
        </div>
    );
};

// ---------- Styles (one clean system: white cards, thin borders, yellow + blue accents) ----------
const navBtn = (active, vendor) => ({
    background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
    color: active ? (vendor ? '#dc2626' : '#2563eb') : (vendor ? '#ef4444' : '#64748b'),
    fontSize: 9.5, fontWeight: active ? 900 : 700, cursor: 'pointer', flex: 1
});

const S = {
    staticRow: { display: 'grid', gap: 10 },
    qItem: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, cursor: 'pointer', minWidth: 0 },
    qIcon: { width: 46, height: 46, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' },
    page: { minHeight: '100vh', fontFamily: 'Inter, system-ui, sans-serif' },
    headerStack: { display: 'flex', flexDirection: 'column', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 4px 14px rgba(0,0,0,.12)', transition: 'background .8s ease' },
    headerTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px 4px', width: '100%', boxSizing: 'border-box' },
    pillBtn: { background: 'rgba(255,255,255,.12)', color: '#fff', border: '1px solid rgba(255,255,255,.2)', padding: '4px 8px', borderRadius: 14, fontWeight: 800, fontSize: 10.5, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 },
    bellBtn: { position: 'relative', background: 'rgba(255,255,255,.12)', border: '1px solid rgba(255,255,255,.2)', padding: 5, borderRadius: '50%', cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center' },
    bellBadge: { position: 'absolute', top: -4, right: -4, background: '#ef4444', color: 'white', fontSize: 9, fontWeight: 900, padding: '1px 4px', borderRadius: 10, border: '1.5px solid #0f172a' },
    adminBtn: { background: 'linear-gradient(135deg, #facc15, #f59e0b)', color: '#713f12', border: 'none', padding: '4px 10px', borderRadius: 14, fontWeight: 900, fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 },
    loginBtn: { background: '#fff', color: '#0f172a', border: 'none', padding: '4px 11px', borderRadius: 14, fontWeight: 900, fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 },
    search: { width: '100%', padding: '8px 34px 8px 12px', borderRadius: 10, border: 'none', outline: 'none', fontSize: 12.5, background: '#fff', fontWeight: 700, boxShadow: '0 2px 8px rgba(0,0,0,.1)', boxSizing: 'border-box' },
    sugBox: { position: 'absolute', top: '106%', left: 0, right: 0, background: 'white', borderRadius: 12, boxShadow: '0 15px 30px rgba(0,0,0,.2)', border: '1px solid #cbd5e1', zIndex: 150, overflow: 'hidden' },
    sugItem: { padding: '9px 12px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid #f1f5f9', cursor: 'pointer', background: 'white' },
    tab: { flexShrink: 0, fontSize: 11.5, cursor: 'pointer', padding: '5px 12px', borderRadius: 16, transition: 'all .2s ease' },
    tabOn: { background: '#facc15', color: '#0f172a', fontWeight: 900, boxShadow: '0 2px 8px rgba(250,204,21,.35)' },
    tabOff: { background: 'rgba(255,255,255,.12)', color: '#e2e8f0', fontWeight: 700 },

    section: { background: '#fff', borderRadius: 16, padding: 12, border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(15,23,42,.04)' },
    secHead: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 10 },
    secTitle: { margin: 0, fontSize: 15, fontWeight: 900, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 6 },
    countBadge: { background: '#fef3c7', color: '#b45309', fontSize: 10, fontWeight: 900, padding: '2px 8px', borderRadius: 12 },
    areaPill: { background: '#eff6ff', color: '#1d4ed8', border: '1.5px solid #3b82f6', padding: '4px 12px', borderRadius: 16, fontSize: 12, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 },
    linkBtn: { background: 'none', border: 'none', color: '#2563eb', fontSize: 12, fontWeight: 900, cursor: 'pointer' },
    hint: { margin: '-4px 0 10px', fontSize: 11, color: '#64748b', fontWeight: 700 },
    hScroll: { display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4, WebkitOverflowScrolling: 'touch' },
    areaChip: { display: 'flex', alignItems: 'center', gap: 8, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '6px 10px', minWidth: 180, maxWidth: 210, flexShrink: 0, cursor: 'pointer' },
    chipName: { fontSize: 12, fontWeight: 900, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
    chipCat: { fontSize: 10.5, color: '#16a34a', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
    chipTag: { fontSize: 9.5, color: '#64748b', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
    card: { width: 132, flexShrink: 0, background: '#fff', borderRadius: 12, padding: 7, border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(15,23,42,.06)', display: 'flex', flexDirection: 'column', cursor: 'pointer', boxSizing: 'border-box', position: 'relative' },
    emptyRow: { background: '#f8fafc', borderRadius: 10, padding: '10px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, border: '1px dashed #cbd5e1', fontSize: 12, color: '#64748b', fontWeight: 700 },
    expoStrip: { display: 'flex', alignItems: 'center', gap: 10, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: '10px 12px', cursor: 'pointer', boxShadow: '0 2px 10px rgba(15,23,42,.04)' },
    expoBtn: { background: '#facc15', color: '#0f172a', padding: '6px 14px', borderRadius: 16, fontSize: 11.5, fontWeight: 900, flexShrink: 0 },
    appGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginTop: 10, justifyItems: 'center' },
    appItem: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, cursor: 'pointer', width: '100%' },
    appIcon: { width: 42, height: 42, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 },
    appText: { fontSize: 10, fontWeight: 800, color: '#334155', textAlign: 'center', lineHeight: 1.15 },

    grid2: { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10, width: '100%' },
    grid4: { display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 8, width: '100%' },
    productGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(175px, 1fr))', gap: 12, width: '100%' },
    twoCol: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 },

    overlay: { position: 'fixed', inset: 0, background: 'rgba(15,23,42,.7)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 14, zIndex: 1100 },
    modal: { background: 'white', padding: 18, borderRadius: 20, maxWidth: 390, width: '100%', boxShadow: '0 25px 50px -12px rgba(0,0,0,.25)', boxSizing: 'border-box' },
    locInput: { padding: '11px 14px', borderRadius: 12, border: '2px solid #2563eb', fontSize: 13.5, width: '100%', boxSizing: 'border-box', outline: 'none', fontWeight: 700 },
    input: { padding: '8px 10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 12.5, width: '100%', boxSizing: 'border-box', outline: 'none', background: 'white' },
    quickBtn: { background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 10, padding: 9, fontSize: 11.5, fontWeight: 800, color: '#0f172a', cursor: 'pointer', textAlign: 'left' },

    nav: { position: 'fixed', bottom: 0, left: 0, right: 0, background: 'rgba(255,255,255,.96)', backdropFilter: 'blur(12px)', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 12px', paddingBottom: 'max(6px, env(safe-area-inset-bottom))', zIndex: 1000 },
    navBadge: { position: 'absolute', top: -4, right: -8, background: '#ef4444', color: '#fff', fontSize: 8.5, fontWeight: 'bold', padding: '1px 4px', borderRadius: 10 }
};

export default Home;
