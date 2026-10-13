import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { Search, User, X, MapPin, Package, Home as HomeIcon, Store, LayoutDashboard, ShieldCheck, Sparkles, Folder, ArrowLeft,Grid, ChevronRight } from 'lucide-react'; 
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify'; 
import ProductCard from '../components/ProductCard';
import { AppContext } from '../context/AppContext'; 
import AppPermissions from '../components/AppPermissions';

const getBackendUrl = () => {
    const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    return isLocal ? 'http://localhost:5000/api' : 'https://bhavyams-vendorhub-backend.onrender.com/api';
};

const getOptimizedImage = (url) => {
    if (!url) return null;
    if (url.includes('cloudinary.com') && !url.includes('q_auto')) {
        return url.replace('/upload/', '/upload/q_auto,f_auto,w_600/');
    }
    return url; 
};

const homeTranslations = {
    en: { 
        syncing: "Syncing Market...", searchFor: "Search shops & items...", searchResults: "Search Results for", 
        topTrending: "🔥 Top Trending Shops", subhamsExpo: "🌟 Subhams Expo", browse: "Browse", 
        sellers: "Sellers", open: "Open", closed: "Closed", localArea: "Shops In Your Area", 
        home: "Home", dashboard: "Dashboard", shopOrders: "Shop", orders: "Orders", 
        expo: "Expo", profile: "Profile", admin: "Admin", explore: "Explore Subhams Hub",
        officialShop: "Subhams Store", usefulApps: "Subhams Ecosystem", pmms: "Subhams PMMS", 
        agent: "Subhams Agent", network: "Subhams Network" 
    },
    te: { 
        syncing: "మార్కెట్‌ను సింక్ చేస్తోంది...", searchFor: "దుకాణాలు, వస్తువుల కోసం వెతకండి...", searchResults: "దీని కోసం శోధన ఫలితాలు", 
        topTrending: "🔥 టాప్ ట్రెండింగ్ షాపులు", subhamsExpo: "🌟 సుభమ్స్ ఎక్స్‌‌పో", browse: "బ్రౌజ్ చేయండి", 
        sellers: "విక్రేతలు", open: "తెరిచి ఉంది", closed: "మూసివేయబడింది", localArea: "మీ ప్రాంతంలోని షాపులు", 
        home: "హోమ్", dashboard: "డాష్‌బోర్డ్", shopOrders: "షాప్", orders: "ఆర్డర్‌లు", 
        expo: "ఎక్స్‌పో", profile: "ప్రొఫైల్", admin: "అడ్మిన్", explore: "సుభమ్స్ హబ్ అన్వేషించండి", 
        usefulApps: "సుభమ్స్ హబ్ ఎకోసిస్టమ్", officialShop: "సుభమ్స్ స్టోర్", pmms: "సుభమ్స్ PMMS", 
        agent: "సుభమ్స్ ఏజెంట్", network: "సుభమ్స్ నెట్‌‌వర్క్" 
    }
};

const categoryTranslations = {
    'Vegetables': 'కూరగాయలు', 'Fruits': 'పండ్లు', 'Groceries': 'కిరాణా', 'Electronics': 'ఎలక్ట్రానిక్స్',
    'Clothing': 'బట్టలు', 'Food': 'ఆహారం', 'Meat': 'మాంసం', 'Fish': 'చేపలు', 'Services': 'సేవలు'
};

const locationAliases = {
    'konanki': ['konanki', 'కోణంకి', 'kona'], 'martur': ['martur', 'మార్టూరు'],
    'bapatla': ['bapatla', 'బాపట్ల'], 'tirupati': ['tirupati', 'తిరుపతి']
};

const Home = () => {
    const { t, language, location: appLocation } = useContext(AppContext);
    const navigate = useNavigate();
    const currentRoute = useLocation().pathname;

    const lang = language === 'te' ? 'te' : 'en';
    const ht = homeTranslations[lang];

    const CATEGORIES = [t('Expo') || 'Expo', t('Trending') || 'Trending', t('Shopping') || 'Shopping', t('Services') || 'Services', t('Business') || 'Business'];

    const getCatIcon = (cat) => {
        if (cat === (t('Expo') || 'Expo')) return { icon: '✨', bg: '#fce7f3', color: '#db2777' };
        if (cat === (t('Trending') || 'Trending')) return { icon: '🔥', bg: '#fef2f2', color: '#dc2626' };
        if (cat === (t('Shopping') || 'Shopping')) return { icon: '🛍️', bg: '#eff6ff', color: '#2563eb' };
        if (cat === (t('Services') || 'Services')) return { icon: '🧑‍🔧', bg: '#f0fdf4', color: '#16a34a' };
        if (cat === (t('Business') || 'Business')) return { icon: '📈', bg: '#fef3c7', color: '#d97706' };
        return { icon: '🏪', bg: '#f1f5f9', color: '#64748b' };
    };

    const tc = (word) => {
        if (!word) return '';
        if (lang === 'te') {
            return word.split(',').map(w => categoryTranslations[w.trim()] || t(w.trim())).join(', ');
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
    const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[1]); 

    const [localUserStr, setLocalUserStr] = useState(localStorage.getItem('user'));
    const localUser = localUserStr && localUserStr !== 'undefined' ? JSON.parse(localUserStr) : null;
    
    const [customLocation, setCustomLocation] = useState(() => JSON.parse(localStorage.getItem('custom_hub_location')));
    const [showLocModal, setShowLocModal] = useState(false);
    const [locSearch, setLocSearch] = useState('');
    const [locResults, setLocResults] = useState([]);

    const [unreadNotifs, setUnreadNotifs] = useState(0); 

    useEffect(() => {
        const checkUser = () => {
            const currentStr = localStorage.getItem('user');
            if (currentStr !== localUserStr) setLocalUserStr(currentStr); 
        };
        window.addEventListener('storage', checkUser);
        return () => window.removeEventListener('storage', checkUser);
    }, [localUserStr]);

    // 🟢 FETCH UNREAD NOTIFICATIONS COUNT
    useEffect(() => {
        if (localUser?.id) {
            const token = localStorage.getItem('token');
            if (token) {
                axios.get(`${getBackendUrl()}/notifications/my-notifications`, { headers: { Authorization: `Bearer ${token}` } })
                .then(res => {
                    const count = res.data.unreadCount || 0;
                    setUnreadNotifs(count);
                }).catch(() => {});
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

    const activeLat = customLocation?.lat || appLocation?.lat || 0;
    const activeLng = customLocation?.lng || appLocation?.lng || 0;

    useEffect(() => {
        let isMounted = true;
        const fetchLocalFeed = async () => {
            setLoading(true);
            try {
                const BACKEND_URL = getBackendUrl();
                const [resFeed, resShops, resCats] = await Promise.all([
                    axios.get(`${BACKEND_URL}/products/feed?lat=${activeLat}&lng=${activeLng}`),
                    axios.get(`${BACKEND_URL}/shops/active/all`),
                    axios.get(`${BACKEND_URL}/admin/categories`)
                ]);

                if (!isMounted) return;

                setProducts(resFeed.data.products || []);
                setActiveShops(resShops.data.shops || []);
                setAdminCategories(resCats.data || []);
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
        if (query.length < 3) return setLocResults([]);
        try {
            const res = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&countrycodes=in&accept-language=en&q=${query}`);
            setLocResults(res.data);
        } catch (e) { console.log(e); }
    };

    const selectCustomLocation = (loc) => {
        const customLoc = { lat: loc.lat, lng: loc.lon, address: loc.display_name };
        localStorage.setItem('custom_hub_location', JSON.stringify(customLoc));
        setCustomLocation(customLoc);
        setShowLocModal(false);
        toast.success(`Location set to ${loc.display_name.split(',')[0]}`);
    };

    const [touchStart, setTouchStart] = useState(null);
    const [touchStartY, setTouchStartY] = useState(null);
    
    const onTouchStart = (e) => {
        setTouchStart(e.targetTouches[0].clientX);
        setTouchStartY(e.targetTouches[0].clientY);
    };

    const onTouchEnd = (e) => {
        if (!touchStart || !touchStartY) return;
        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;
        const distanceX = touchStart - touchEndX;
        const distanceY = Math.abs(touchStartY - touchEndY);
        
        if (Math.abs(distanceX) > 60 && Math.abs(distanceX) > distanceY * 1.5) {
            const currentIndex = CATEGORIES.indexOf(selectedCategory);
            if (distanceX > 0 && currentIndex < CATEGORIES.length - 1) {
                handleCategoryClick(CATEGORIES[currentIndex + 1]);
            } else if (distanceX < 0 && currentIndex > 0) {
                handleCategoryClick(CATEGORIES[currentIndex - 1]);
            }
        }
        setTouchStart(null);
        setTouchStartY(null);
    };

    const requireLogin = (actionMsg) => {
        toast.info(`Please login to ${actionMsg}!`);
        navigate('/welcome');
    };

    const handleCategoryClick = (cat) => {
        if (cat === (t('Business') || 'Business')) { 
            if (!localUser) return requireLogin('register a business');
            navigate('/register-business'); 
            return; 
        }
        if (cat === (t('Expo') || 'Expo')) {
            navigate('/expo');
            return;
        }

        setSelectedCategory(cat); 
        setSelectedSubCategory(null); 
        setSearchQuery(''); 
        setShowSuggestions(false);
    };

    // 🟢 LOCATION PRIVACY: Only show 'delivery_areas'. Do not leak raw 'shop.address' to the public feed!
    const getDistanceTag = (shop) => {
        const areas = shop.delivery_areas || 'All Areas';
        return `🚚 Delivers: ${areas.length > 15 ? areas.substring(0, 15) + '...' : areas}`; 
    };

    // 🟢 FIXED: Delivery Areas Logic -> Shops only show if they deliver to the selected area
    const nearbyShops = activeShops.filter(shop => {
        if (isAdmin) return true; 
        
        const searchAddrRaw = (customLocation?.address || localUser?.address || localUser?.location || '').toLowerCase();
        const deliveryAreas = (shop.delivery_areas || 'all').toLowerCase();
        
        if (deliveryAreas.includes('all')) return true;

        if (searchAddrRaw && deliveryAreas) {
            const uParts = searchAddrRaw.split(/[\s,]+/); 
            if (uParts.some(part => part.length >= 4 && deliveryAreas.includes(part))) return true;
            
            let isMatch = false;
            Object.keys(locationAliases).forEach(key => {
                const aliases = locationAliases[key];
                const searchHasAlias = aliases.some(alias => searchAddrRaw.includes(alias));
                const shopDeliversToAlias = aliases.some(alias => deliveryAreas.includes(alias));
                if (searchHasAlias && shopDeliversToAlias) isMatch = true;
            });
            if (isMatch) return true;
        }
        return false;
    });

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
            type: 'shop', name: s.business_name, id: s.id, img: s.shop_logo || s.shop_image, lat: s.lat, lng: s.lng
        }))
    ].slice(0, 6);

    const handleSuggestionClick = (suggestion) => {
        setSearchQuery('');
        setShowSuggestions(false);
        if (suggestion.type === 'shop') {
            navigate(`/shop/${suggestion.id}`);
        } else if (suggestion.type === 'category') {
            const uiCategory = suggestion.section === 'Products' ? CATEGORIES[2] : CATEGORIES[3];
            setSelectedCategory(uiCategory);
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

    const currentTabEnglish = selectedCategory === (t('Services') || 'Services') ? 'Services' : (selectedCategory === (t('Shopping') || 'Shopping') ? 'Products' : selectedCategory);
    const activeLocationName = customLocation ? customLocation.address.split(',')[0] : (localUser?.address ? localUser.address.split(',')[0] : "Set Loc");

    return (
        <div style={styles.page}>
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
                        position: fixed;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 3px;
                        background: transparent;
                        z-index: 10000;
                        overflow: hidden;
                    }
                    .top-progress-bar::before {
                        content: '';
                        position: absolute;
                        top: 0;
                        bottom: 0;
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
                    @keyframes running-text {
                        0%   { transform: translateX(0%); }
                        100% { transform: translateX(-100%); }
                    }
                    .scroll-container {
                        width: 100%;
                        overflow: hidden;
                        white-space: nowrap;
                        box-sizing: border-box;
                        position: relative;
                    }
                    .scroll-text {
                        display: inline-block;
                        padding-left: 100%;
                        animation: running-text 8s linear infinite;
                    }
                    .touch-scale {
                        transition: transform 0.15s cubic-bezier(0.25, 0.8, 0.25, 1);
                    }
                    @media (hover: hover) {
                        .touch-scale:hover {
                            transform: scale(1.03) translateY(-2px);
                            box-shadow: 0 10px 20px rgba(0,0,0,0.08);
                            z-index: 10;
                        }
                    }
                    .touch-scale:active {
                        transform: scale(0.96);
                    }
                    .hide-scroll::-webkit-scrollbar { display: none; }
                    .hide-scroll { -ms-overflow-style: none; scrollbar-width: none; }
                    .swipe-content { transition: transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1); }
                    
                    @keyframes fadeUp {
                        from { opacity: 0; transform: translateY(15px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                    .fade-up-card {
                        animation: fadeUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                    }
                `}
            </style>

            <div style={styles.headerStack}>
                <div style={styles.headerTopRow}>
                    <div style={{display: 'flex', alignItems: 'center', gap: '15px', cursor: 'pointer'}} onClick={() => {setSearchQuery(''); setSelectedCategory(CATEGORIES[1]); setSelectedSubCategory(null); window.scrollTo(0,0);}}>
                        <h1 style={{ margin: 0, display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                            <span className="animated-logo" style={{ fontSize: '24px', fontWeight: '900', letterSpacing: '-0.5px' }}>SUBHAMS</span>
                            <span style={{ fontSize: '13px', color: '#ffffff', fontWeight: '800', letterSpacing: '1px' }}>HUB</span>
                        </h1>
                    </div>
                    
                    <div style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
                        <button onClick={() => navigate('/notifications')} style={{...styles.bellBtn, position: 'relative'}}>
                            🔔
                            {unreadNotifs > 0 && <span style={styles.topBellBadge}>{unreadNotifs > 99 ? '99+' : unreadNotifs}</span>}
                        </button>

                        {isAdmin ? (
                            <button onClick={() => navigate('/admin')} style={styles.adminBtn}>
                                <ShieldCheck size={18} /> {isMobile ? "" : ht.admin}
                            </button>
                        ) : !localUser ? (
                            <button onClick={() => navigate('/welcome')} style={styles.loginHeaderBtn}>
                                <User size={16} /> Login
                            </button>
                        ) : null}
                    </div>
                </div>
                
                <div style={styles.locationSearchRow}>
                    <div className="touch-scale" style={styles.locationPill} onClick={() => setShowLocModal(true)}>
                        <MapPin size={14} color="#facc15" style={{flexShrink: 0}} />
                        <span style={{maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>{activeLocationName}</span>
                        <span style={{opacity: 0.7, fontSize: '10px'}}>▾</span>
                    </div>

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
                        <div style={{ position: 'absolute', right: '6px', top: '50%', transform: 'translateY(-50%)', background: '#f8fafc', padding: '6px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Search size={14} color="#0f172a" />
                        </div>
                        
                        {showSuggestions && searchSuggestions.length > 0 && (
                            <div style={styles.suggestionsBox}>
                                {searchSuggestions.map((sug, i) => (
                                    <div key={i} style={styles.suggestionItem} onClick={() => handleSuggestionClick(sug)}>
                                        {sug.type === 'category' ? (
                                            <>
                                                <Folder size={16} color="#f59e0b" style={{flexShrink: 0}}/>
                                                <div style={{flex: 1, display: 'flex', flexDirection: 'column'}}>
                                                    <span style={{fontWeight: '900', color: '#0f172a', fontSize: '14px'}}>{tc(sug.name)} Category</span>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <Store size={16} color="#4f46e5" style={{flexShrink: 0}}/>
                                                <div style={{flex: 1, display: 'flex', flexDirection: 'column'}}>
                                                    <span style={{fontWeight: '900', color: '#0f172a', fontSize: '14px'}}>{sug.name}</span>
                                                </div>
                                                <span style={{fontSize: '10px', background: '#e0e7ff', color: '#4f46e5', padding: '4px 10px', borderRadius: '12px', fontWeight: 'bold'}}>Visit</span>
                                            </>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div style={styles.headerCatStrip} className="hide-scroll">
                    <div style={styles.catContent}>
                        {CATEGORIES.map(cat => {
                            const isActive = selectedCategory === cat;
                            return (
                                <span key={cat} onClick={() => handleCategoryClick(cat)}
                                    style={{ 
                                        ...styles.catItem, 
                                        ...(isActive ? styles.catItemActive : styles.catItemInactive)
                                    }}>
                                    {cat === CATEGORIES[1] ? '🔥 ' : ''}
                                    {cat === CATEGORIES[0] ? '🌟 ' : ''}
                                    {cat === CATEGORIES[2] ? '🛍️ ' : ''}
                                    {cat === CATEGORIES[3] ? '🧑‍🔧 ' : ''}
                                    {cat === CATEGORIES[4] ? '📈 ' : ''}
                                    {cat}
                                </span>
                            );
                        })}
                    </div>
                </div>
            </div>

            {localUser?.account_status === 'warned' && (
                <div style={{ background: '#fef2f2', borderBottom: '2px solid #ef4444', padding: '10px 0', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', position: 'sticky', top: '150px', zIndex: 99, overflow: 'hidden' }}>
                    <div className="warning-text" style={{ fontSize: '13px', fontWeight: 'bold', color: '#b91c1c', textAlign: 'center', padding: '0 15px' }}>
                        🛡️ SUBHAMS HUB SECURITY WARNING: {localUser.ban_reason || 'Please adhere to our community guidelines.'}
                    </div>
                </div>
            )}

            {showLocModal && (
                <div style={styles.overlay}>
                    <div className="touch-scale" style={styles.locModal}>
                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px'}}>
                            <h3 style={{margin: 0, fontSize: '18px', color: '#0f172a'}}>Search Delivery Area</h3>
                            <X size={20} style={{cursor: 'pointer', color: '#64748b'}} onClick={() => setShowLocModal(false)} />
                        </div>

                        <div style={{position: 'relative', marginTop: '15px'}}>
                            <input 
                                type="text" 
                                placeholder="Type your area, city, or pincode (e.g. konanki)..." 
                                style={styles.locInput} 
                                value={locSearch} 
                                onChange={(e) => handleLocationSearch(e.target.value)} 
                                autoFocus
                            />
                        </div>

                        {locResults.length > 0 && (
                            <div style={styles.locResultsBox}>
                                {locResults.map((loc, i) => (
                                    <div key={i} className="touch-scale" style={styles.locItem} onClick={() => selectCustomLocation(loc)}>
                                        <MapPin size={16} color="#4f46e5" style={{flexShrink: 0}} />
                                        <span style={{fontSize: '13px', color: '#334155'}}>{loc.display_name}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            <div 
                onTouchStart={onTouchStart} 
                onTouchEnd={onTouchEnd} 
                className="swipe-content"
                style={{ maxWidth: '1000px', margin: '0 auto', padding: '15px 10px', width: '100%', boxSizing: 'border-box', minHeight: '70vh' }}
            >
                {searchQuery && !showSuggestions ? (
                    <div style={{padding: '10px 5px'}}>
                        <h2 style={{ fontSize: '20px', marginBottom: '15px', color: '#1e293b' }}>{ht.searchResults} "{searchQuery}"</h2>
                        {filteredProducts.length > 0 ? (
                            <div style={styles.desktopProductGrid}>
                                {filteredProducts.map((product, i) => (
                                    <div key={product.id} className="fade-up-card" style={{ animationDelay: `${i * 0.05}s` }}>
                                        <ProductCard product={product} t={t} />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '40px', background: 'white', borderRadius: '16px', border: '1px dashed #cbd5e1' }}>
                                <p style={{color: '#64748b', fontWeight: 'bold', margin: 0}}>No items found. Try a different search.</p>
                            </div>
                        )}
                    </div>
                ) : (
                    <>
                        {selectedCategory === CATEGORIES[1] && (
                            <>
                                <div style={styles.sectionBlock}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', padding: '0 5px' }}>
                                        <h2 style={{ fontSize: '18px', margin: 0, color: '#0f172a', fontWeight: '900', letterSpacing: '-0.5px' }}>📍 {ht.localArea}</h2>
                                    </div>
                                    
                                    {!customLocation && !localUser?.address ? (
                                        <div className="touch-scale" style={{ padding: '16px 20px', background: 'linear-gradient(135deg, #e0e7ff, #eff6ff)', borderRadius: '16px', color: '#1e3a8a', fontSize: '13px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', border: '1px solid #bfdbfe', margin: '0 5px' }} onClick={() => setShowLocModal(true)}>
                                            <MapPin size={20} color="#4f46e5"/> <span>Set Location to discover shops delivering to you!</span> <ChevronRight size={18} style={{ marginLeft: 'auto' }} />
                                        </div>
                                    ) : nearbyShops.length > 0 ? (
                                        <div style={{ display: 'flex', flexWrap: 'nowrap', gap: '15px', overflowX: 'auto', paddingBottom: '10px', paddingLeft: '5px', paddingRight: '5px', WebkitOverflowScrolling: 'touch' }} className="hide-scroll">
                                            {nearbyShops.map((shop, i) => (
                                                <div key={shop.id} className="touch-scale fade-up-card" onClick={() => navigate(`/shop/${shop.id}`)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '80px', flexShrink: 0, cursor: 'pointer', animationDelay: `${i * 0.05}s` }}>
                                                    <div style={{ filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.1))', marginBottom: '10px' }}>
                                                        <div style={{ position: 'relative', width: '70px', height: '70px', margin: '0 auto' }}>
                                                            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(135deg, #4f46e5, #0f172a)', borderRadius: '24px', transform: 'rotate(10deg)' }}></div>
                                                            <img src={getOptimizedImage(shop.shop_logo) || 'https://via.placeholder.com/150'} alt={shop.business_name} crossOrigin="anonymous" referrerPolicy="no-referrer" style={{ position: 'absolute', top: '2px', left: '2px', width: '66px', height: '66px', objectFit: 'cover', borderRadius: '20px', background: 'white' }} />
                                                        </div>
                                                    </div>
                                                    <div className="scroll-container">
                                                        <span className={shop.business_name.length > 10 ? "scroll-text" : ""} style={{ fontSize: '11px', fontWeight: '900', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '2px' }}>
                                                            {shop.business_name}
                                                            {shop.is_verified && <ShieldCheck size={12} color="#10b981" />}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div style={{ padding: '20px', background: 'white', borderRadius: '16px', border: '1px dashed #cbd5e1', textAlign: 'center', margin: '0 5px' }}>
                                            <p style={{fontSize: '13px', color: '#64748b', margin: 0, fontWeight: '600'}}>No shops currently deliver to {activeLocationName}.</p>
                                        </div>
                                    )}
                                </div>

                                <div style={styles.sectionBlock}>
                                    <h2 style={styles.sectionTitle}>{ht.explore}</h2>
                                    <div style={styles.upiGrid}>
                                        <div 
                                            onClick={() => {
                                                if (officialHubShop) navigate(`/shop/${officialHubShop.id}`);
                                                else navigate('/shop/1');
                                            }} 
                                            className="touch-scale" 
                                            style={styles.miniAppItem}
                                        >
                                            <div style={{...styles.miniAppIconBox, background: 'linear-gradient(135deg, #fffbeb, #fef3c7)', color: '#d97706', border: '1px solid #fde68a'}}>
                                                🏬
                                            </div>
                                            <span style={styles.miniAppText}>{ht.officialShop}</span>
                                        </div>

                                        {CATEGORIES.filter(c => c !== CATEGORIES[1]).map(cat => {
                                            const { icon, bg, color } = getCatIcon(cat);
                                            return (
                                                <div key={cat} onClick={() => handleCategoryClick(cat)} className="touch-scale" style={styles.miniAppItem}>
                                                    <div style={{...styles.miniAppIconBox, background: bg, color: color, border: '1px solid #e2e8f0'}}>
                                                        {icon}
                                                    </div>
                                                    <span style={styles.miniAppText}>{cat}</span>
                                                </div>
                                            );
                                        })}
                                        <div onClick={() => localUser ? navigate('/my-orders') : requireLogin('view your orders')} className="touch-scale" style={styles.miniAppItem}>
                                            <div style={{...styles.miniAppIconBox, background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0'}}>
                                                <Package size={24} />
                                            </div>
                                            <span style={styles.miniAppText}>{ht.orders}</span>
                                        </div>

                                        <div onClick={() => localUser ? navigate('/profile') : requireLogin('view your profile')} className="touch-scale" style={styles.miniAppItem}>
                                            <div style={{...styles.miniAppIconBox, background: '#f8fafc', color: '#475569', border: '1px solid #cbd5e1'}}>
                                                <User size={24} />
                                            </div>
                                            <span style={styles.miniAppText}>{ht.profile}</span>
                                        </div>
                                    </div>
                                </div>

                                <div style={styles.sectionBlock}>
                                    <h2 style={{...styles.sectionTitle, display: 'flex', alignItems: 'center', gap: '6px'}}>
                                        <Grid size={18} color="#4f46e5" /> {ht.usefulApps}
                                    </h2>
                                    <div style={styles.upiGrid}>
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

                                <div style={{padding: '0 5px'}}>
                                    <h2 style={{ fontSize: '20px', marginBottom: '15px', color: '#0f172a', fontWeight: '900', letterSpacing: '-0.5px' }}>
                                        {ht.topTrending}
                                    </h2>
                                    
                                    <div style={isMobile ? styles.mobileGrid3 : styles.desktopProductGrid}>
                                        {activeShops
                                            .filter(shop => (shop.shop_type || 'Products').includes('Trending'))
                                            .map((shop, i) => (
                                                <div key={shop.id} className="touch-scale fade-up-card" onClick={() => navigate(`/shop/${shop.id}`)} style={{...(isMobile ? styles.shopCardMobile : styles.shopCardDesktop), animationDelay: `${i * 0.05}s`}}>
                                                    <span style={{ position: 'absolute', top: '8px', right: '8px', background: shop.is_online ? 'rgba(22, 163, 74, 0.9)' : 'rgba(220, 38, 38, 0.9)', color: 'white', fontSize: '9px', padding: '3px 8px', borderRadius: '12px', fontWeight: '900', zIndex: 5, backdropFilter: 'blur(4px)' }}>
                                                        {shop.is_online ? ht.open : ht.closed}
                                                    </span>

                                                    <div style={{ position: 'relative', width: '100%', paddingTop: '100%', overflow: 'hidden', borderRadius: '12px', marginBottom: '10px', background: '#f1f5f9' }}>
                                                        {shop.shop_logo ? (
                                                            <img src={getOptimizedImage(shop.shop_logo)} alt={shop.business_name} crossOrigin="anonymous" referrerPolicy="no-referrer" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                                                        ) : (
                                                            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                <Store size={isMobile ? 24 : 36} color="#cbd5e1"/>
                                                            </div>
                                                        )}
                                                        <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '40%', background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)' }}></div>
                                                    </div>
                                                    
                                                    <div className="scroll-container" style={{ margin: '0 0 4px 0' }}>
                                                        <h4 className={shop.business_name.length > 11 && isMobile ? "scroll-text" : ""} style={{ margin: 0, color: '#0f172a', fontSize: isMobile ? '13px' : '16px', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                            {shop.business_name}
                                                            {shop.is_verified && <ShieldCheck size={14} color="#10b981" />}
                                                        </h4>
                                                    </div>

                                                    <p style={{ margin: '0 0 6px 0', color: '#4f46e5', fontSize: isMobile ? '10px' : '13px', fontWeight: '800', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>
                                                        {tc(shop.category)}
                                                    </p>
                                                    
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: isMobile ? '9px' : '12px', color: '#64748b', fontWeight: '700', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', background: '#f1f5f9', padding: '4px 8px', borderRadius: '8px' }}>
                                                        <MapPin size={isMobile ? 12 : 14} color="#ef4444" /> {getDistanceTag(shop)}
                                                    </div>
                                                </div>
                                            ))}
                                    </div>
                                </div>
                            </>
                        )}

                        {selectedCategory === CATEGORIES[0] && (
                            <>
                                <div style={{padding: '0 5px'}}>
                                    <h2 style={{ fontSize: '20px', marginBottom: '15px', color: '#0f172a', fontWeight: '900', letterSpacing: '-0.5px' }}>
                                        {ht.subhamsExpo}
                                    </h2>
                                    
                                    <div style={isMobile ? styles.mobileGrid3 : styles.desktopProductGrid}>
                                        {activeShops
                                            .filter(shop => {
                                                const dbType = shop.shop_type || 'Products'; 
                                                return dbType.includes('Expo') || dbType.includes('Promotions');
                                            })
                                            .map((shop, i) => (
                                                <div key={shop.id} className="touch-scale fade-up-card" onClick={() => navigate(`/shop/${shop.id}`)} style={{...(isMobile ? styles.shopCardMobile : styles.shopCardDesktop), animationDelay: `${i * 0.05}s`}}>
                                                    <span style={{ position: 'absolute', top: '8px', right: '8px', background: shop.is_online ? 'rgba(22, 163, 74, 0.9)' : 'rgba(220, 38, 38, 0.9)', color: 'white', fontSize: '9px', padding: '3px 8px', borderRadius: '12px', fontWeight: '900', zIndex: 5, backdropFilter: 'blur(4px)' }}>
                                                        {shop.is_online ? ht.open : ht.closed}
                                                    </span>

                                                    <div style={{ position: 'relative', width: '100%', paddingTop: '100%', overflow: 'hidden', borderRadius: '12px', marginBottom: '10px', background: '#f1f5f9' }}>
                                                        {shop.shop_logo ? (
                                                            <img src={getOptimizedImage(shop.shop_logo)} alt={shop.business_name} crossOrigin="anonymous" referrerPolicy="no-referrer" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                                                        ) : (
                                                            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                <Store size={isMobile ? 24 : 36} color="#cbd5e1"/>
                                                            </div>
                                                        )}
                                                        <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '40%', background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)' }}></div>
                                                    </div>
                                                    
                                                    <div className="scroll-container" style={{ margin: '0 0 4px 0' }}>
                                                        <h4 className={shop.business_name.length > 11 && isMobile ? "scroll-text" : ""} style={{ margin: 0, color: '#0f172a', fontSize: isMobile ? '13px' : '16px', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                            {shop.business_name}
                                                            {shop.is_verified && <ShieldCheck size={14} color="#10b981" />}
                                                        </h4>
                                                    </div>

                                                    <p style={{ margin: '0 0 6px 0', color: '#4f46e5', fontSize: isMobile ? '10px' : '13px', fontWeight: '800', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>
                                                        {tc(shop.category)}
                                                    </p>
                                                    
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: isMobile ? '9px' : '12px', color: '#64748b', fontWeight: '700', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', background: '#f1f5f9', padding: '4px 8px', borderRadius: '8px' }}>
                                                        <MapPin size={isMobile ? 12 : 14} color="#ef4444" /> {getDistanceTag(shop)}
                                                    </div>
                                                </div>
                                            ))}
                                    </div>
                                </div>
                            </>
                        )}

                        {(selectedCategory === CATEGORIES[2] || selectedCategory === CATEGORIES[3]) && (
                            <div style={{padding: '0 5px'}}>
                                {!selectedSubCategory ? (
                                    <>
                                        <h2 style={{ fontSize: '20px', marginBottom: '15px', color: '#0f172a', fontWeight: '900', letterSpacing: '-0.5px' }}>
                                            {ht.browse} {selectedCategory}
                                        </h2>
                                        
                                        {(() => {
                                            const adminCatForTab = adminCategories.filter(c => c.section && c.section.toLowerCase() === currentTabEnglish.toLowerCase());
                                            const allCategoryNames = [...adminCatForTab.map(c => c.name)];

                                            if (allCategoryNames.length === 0) return <div style={{padding: '20px', background: 'white', borderRadius: '16px', border: '1px dashed #cbd5e1', textAlign: 'center', color: '#64748b', fontWeight: '600'}}>Categories will appear once created by the Admin.</div>;

                                            return (
                                                <div style={isMobile ? styles.mobileGrid4 : styles.desktopFolderGrid}>
                                                    {allCategoryNames.map((catName, index) => {
                                                        const adminCat = adminCatForTab.find(c => c.name.toLowerCase() === catName.toLowerCase());
                                                        const imgSrc = adminCat ? adminCat.hd_image : 'https://via.placeholder.com/150/e2e8f0/64748b?text=' + catName.substring(0, 3);

                                                        return (
                                                            <div key={index} className="touch-scale fade-up-card" onClick={() => setSelectedSubCategory(catName)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: isMobile ? '100%' : '100px', cursor: 'pointer', animationDelay: `${index * 0.05}s` }}>
                                                                <div style={{ background: 'white', padding: '6px', borderRadius: '24px', boxShadow: '0 4px 10px rgba(0,0,0,0.06)' }}>
                                                                    <img src={getOptimizedImage(imgSrc)} alt={catName} crossOrigin="anonymous" referrerPolicy="no-referrer" style={{ width: isMobile ? '65px' : '85px', height: isMobile ? '65px' : '85px', borderRadius: '20px', objectFit: 'cover', background: '#f8fafc' }} />
                                                                </div>
                                                                <span style={{ fontSize: isMobile ? '11px' : '14px', marginTop: '8px', fontWeight: '800', color: '#1e293b', textAlign: 'center', lineHeight: '1.2' }}>{tc(catName)}</span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            );
                                        })()}
                                    </>
                                ) : (
                                    <>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
                                            <button className="touch-scale" onClick={() => setSelectedSubCategory(null)} style={{ background: 'white', border: '1px solid #cbd5e1', padding: '8px 14px', borderRadius: '12px', cursor: 'pointer', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                                                <ArrowLeft size={16} /> Back
                                            </button>
                                            <h2 style={{ fontSize: '20px', margin: 0, color: '#1e293b', fontWeight: '900', letterSpacing: '-0.5px' }}>
                                                {tc(selectedSubCategory)} {ht.sellers}
                                            </h2>
                                        </div>

                                        <div style={isMobile ? styles.mobileGrid3 : styles.desktopProductGrid}>
                                            {activeShops
                                                .filter(shop => {
                                                    const dbType = shop.shop_type || 'Products'; 
                                                    const matchesTab = dbType.toLowerCase().includes(currentTabEnglish.toLowerCase());
                                                    const targetCat = selectedSubCategory.toLowerCase().trim();
                                                    const shopCats = (shop.category || '').toLowerCase().split(',').map(c => c.trim());
                                                    const matchesCategory = shopCats.some(c => c === targetCat || c.includes(targetCat) || targetCat.includes(c));

                                                    return matchesTab && matchesCategory;
                                                })
                                                .map((shop, i) => (
                                                    <div key={shop.id} className="touch-scale fade-up-card" onClick={() => navigate(`/shop/${shop.id}`)} style={{...(isMobile ? styles.shopCardMobile : styles.shopCardDesktop), animationDelay: `${i * 0.05}s`}}>
                                                        <span style={{ position: 'absolute', top: '8px', right: '8px', background: shop.is_online ? 'rgba(22, 163, 74, 0.9)' : 'rgba(220, 38, 38, 0.9)', color: 'white', fontSize: '9px', padding: '3px 8px', borderRadius: '12px', fontWeight: '900', zIndex: 5, backdropFilter: 'blur(4px)' }}>
                                                            {shop.is_online ? ht.open : ht.closed}
                                                        </span>

                                                        <div style={{ position: 'relative', width: '100%', paddingTop: '100%', overflow: 'hidden', borderRadius: '12px', marginBottom: '10px', background: '#f1f5f9' }}>
                                                            {shop.shop_logo ? (
                                                                <img src={getOptimizedImage(shop.shop_logo)} alt={shop.business_name} crossOrigin="anonymous" referrerPolicy="no-referrer" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                                                            ) : (
                                                                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                    <Store size={isMobile ? 24 : 36} color="#cbd5e1"/>
                                                                </div>
                                                            )}
                                                            <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '40%', background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)' }}></div>
                                                        </div>
                                                        
                                                        <div className="scroll-container" style={{ margin: '0 0 4px 0' }}>
                                                            <h4 className={shop.business_name.length > 11 && isMobile ? "scroll-text" : ""} style={{ margin: 0, color: '#0f172a', fontSize: isMobile ? '13px' : '16px', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                                {shop.business_name}
                                                                {shop.is_verified && <ShieldCheck size={14} color="#10b981" />}
                                                            </h4>
                                                        </div>

                                                        <p style={{ margin: '0 0 6px 0', color: '#4f46e5', fontSize: isMobile ? '10px' : '13px', fontWeight: '800', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>
                                                            {tc(shop.category)}
                                                        </p>
                                                        
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: isMobile ? '9px' : '12px', color: '#64748b', fontWeight: '700', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', background: '#f1f5f9', padding: '4px 8px', borderRadius: '8px' }}>
                                                            <MapPin size={isMobile ? 12 : 14} color="#ef4444" /> {getDistanceTag(shop)}
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

            <div style={styles.bottomNavContainer}>
                <button onClick={() => { navigate('/'); setSelectedCategory(CATEGORIES[1]); setSelectedSubCategory(null); setSearchQuery(''); window.scrollTo({ top: 0, behavior: 'smooth' }); }} style={currentRoute === '/' && selectedCategory === CATEGORIES[1] && !searchQuery && !selectedSubCategory ? styles.bottomNavBtnActive : styles.bottomNavBtn}>
                    <HomeIcon size={24} /><span>{ht.home}</span>
                </button>
                <button onClick={() => navigate('/expo')} style={currentRoute === '/expo' ? styles.bottomNavBtnActive : styles.bottomNavBtn}>
                    <Sparkles size={24} /><span>{ht.expo}</span>
                </button>
                {isVendor ? (
                    <button onClick={() => navigate('/dashboard')} style={currentRoute === '/dashboard' ? styles.bottomNavBtnActive : styles.bottomNavBtn}>
                        <LayoutDashboard size={24} /><span>{ht.dashboard}</span>
                    </button>
                ) : (
                    <button onClick={() => localUser ? navigate('/my-orders') : requireLogin('view your orders')} style={currentRoute === '/my-orders' ? styles.bottomNavBtnActive : styles.bottomNavBtn}>
                        <div style={{ position: 'relative' }}><Package size={24} />{cartCount > 0 && <span style={styles.bottomNavBadge}>{cartCount}</span>}</div>
                        <span>{ht.orders}</span>
                    </button>
                )}
                {isVendor && (
                    <button onClick={() => navigate('/vendor/orders')} style={currentRoute === '/vendor/orders' ? styles.vendorNavBtnActive : styles.vendorNavBtn}>
                        <Store size={24} /><span>{ht.shopOrders}</span>
                    </button>
                )}
                <button onClick={() => localUser ? navigate('/profile') : requireLogin('view your profile')} style={currentRoute === '/profile' ? styles.bottomNavBtnActive : styles.bottomNavBtn}>
                    <User size={24} /><span>{ht.profile}</span>
                </button>
            </div>
            <div style={{ height: '70px' }}></div>
        </div>
    );
};

const styles = {
    page: { background: '#f8fafc', minHeight: '100vh', fontFamily: 'Inter, system-ui, sans-serif' },
    
    // 🟢 PREMIUM NIGHT-MODE TOP HEADER
    headerStack: { display: 'flex', flexDirection: 'column', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' },
    headerTopRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 15px 10px 15px', background: 'linear-gradient(135deg, #0f172a, #1e1b4b)', width: '100%', boxSizing: 'border-box' },
    locationSearchRow: { display: 'flex', alignItems: 'center', gap: '10px', padding: '0 15px 15px 15px', background: 'linear-gradient(135deg, #0f172a, #1e1b4b)', width: '100%', boxSizing: 'border-box' },
    
    adminBtn: { background: 'linear-gradient(135deg, #facc15, #f59e0b)', color: '#713f12', border: 'none', padding: '6px 14px', borderRadius: '20px', fontWeight: '900', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', boxShadow: '0 4px 10px rgba(245, 158, 11, 0.4)' },
    loginHeaderBtn: { background: '#ffffff', color: '#0f172a', border: 'none', padding: '6px 14px', borderRadius: '20px', fontWeight: '900', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', boxShadow: '0 4px 10px rgba(0, 0, 0, 0.2)' },
    locationPill: { display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.1)', padding: '10px 14px', borderRadius: '12px', color: 'white', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)' },
    searchInputCompact: { width: '100%', padding: '12px 40px 12px 15px', borderRadius: '12px', border: 'none', outline: 'none', fontSize: '14px', background: '#ffffff', fontWeight: '700', transition: '0.2s', boxShadow: '0 4px 15px rgba(0,0,0,0.15)' },
    
    suggestionsBox: { position: 'absolute', top: '110%', left: 0, right: 0, background: 'white', borderRadius: '16px', boxShadow: '0 15px 35px rgba(0,0,0,0.2)', border: '1px solid #cbd5e1', zIndex: 150, overflow: 'hidden' },
    suggestionItem: { padding: '14px 15px', display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid #f1f5f9', cursor: 'pointer', transition: '0.2s', background: 'white' },
    
    // 🟢 PREMIUM PILL CATEGORIES
    headerCatStrip: { background: '#ffffff', borderBottom: '1px solid #e2e8f0', width: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch', padding: '0 5px' },
    catContent: { display: 'flex', gap: '12px', padding: '12px 15px', width: 'max-content', margin: '0 auto' },
    catItem: { flexShrink: 0, fontSize: '13px', cursor: 'pointer', padding: '8px 16px', borderRadius: '24px', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', border: '1px solid transparent' },
    catItemActive: { background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a', fontWeight: '900', boxShadow: '0 4px 10px rgba(253, 230, 138, 0.5)' },
    catItemInactive: { background: '#f1f5f9', color: '#64748b', fontWeight: '700', border: '1px solid #e2e8f0' },
    
    overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15,23,42,0.7)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', zIndex: 1000 },
    locModal: { background: 'white', padding: '25px', borderRadius: '24px', maxWidth: '400px', width: '100%', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' },
    locInput: { padding: '16px', borderRadius: '16px', border: '2px solid #e2e8f0', fontSize: '15px', width: '100%', boxSizing: 'border-box', outline: 'none', fontWeight: '600' },
    locResultsBox: { marginTop: '15px', maxHeight: '200px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '16px' },
    locItem: { padding: '15px', borderBottom: '1px solid #f1f5f9', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', fontWeight: '600' },
    
    sectionBlock: { padding: '20px 10px', background: 'white', margin: '0 5px 20px 5px', borderRadius: '20px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' },
    sectionTitle: { fontSize: '16px', marginBottom: '15px', color: '#0f172a', fontWeight: '900', paddingLeft: '5px' },
    
    upiGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', rowGap: '20px', columnGap: '8px', padding: '5px', justifyItems: 'center' },
    miniAppItem: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer', width: '100%' },
    miniAppIconBox: { width: '58px', height: '58px', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' },
    miniAppText: { fontSize: '11px', fontWeight: '800', color: '#334155', textAlign: 'center', lineHeight: '1.2' },
    
    mobileGrid3: { display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '10px', width: '100%' },
    mobileGrid4: { display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '10px', width: '100%' },
    desktopProductGrid: { display: 'flex', flexWrap: 'wrap', gap: '20px', justifyContent: 'flex-start' },
    desktopFolderGrid: { display: 'flex', flexDirection: 'row', gap: '20px', flexWrap: 'wrap', justifyContent: 'flex-start', width: '100%' },
    
    // 🟢 PREMIUM SHOP CARDS
    shopCardMobile: { background: 'white', borderRadius: '16px', padding: '8px', border: '1px solid #e2e8f0', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', position: 'relative', width: '100%', boxSizing: 'border-box' },
    shopCardDesktop: { width: '240px', background: 'white', borderRadius: '20px', padding: '16px', border: '1px solid #e2e8f0', cursor: 'pointer', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', position: 'relative' },
    
    bottomNavContainer: { position: 'fixed', bottom: 0, left: 0, right: 0, background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 15px', paddingBottom: 'max(10px, env(safe-area-inset-bottom))', zIndex: 1000, boxShadow: '0 -10px 25px rgba(0,0,0,0.05)' },
    bottomNavBtn: { background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', color: '#64748b', fontSize: '10px', fontWeight: '700', cursor: 'pointer', flex: 1 },
    bottomNavBtnActive: { background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', color: '#4f46e5', fontSize: '10px', fontWeight: '900', cursor: 'pointer', flex: 1 },
    vendorNavBtn: { background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', color: '#ef4444', fontSize: '10px', fontWeight: '700', cursor: 'pointer', flex: 1 },
    vendorNavBtnActive: { background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', color: '#dc2626', fontSize: '10px', fontWeight: '900', cursor: 'pointer', flex: 1 },
    
    bellBtn: { background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', padding: '8px', borderRadius: '50%', cursor: 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    bottomNavBadge: { position: 'absolute', top: '-4px', right: '-8px', background: '#ef4444', color: '#fff', fontSize: '9px', fontWeight: 'bold', padding: '2px 5px', borderRadius: '10px' },
    topBellBadge: { position: 'absolute', top: '-4px', right: '-4px', background: '#ef4444', color: 'white', fontSize: '10px', fontWeight: '900', padding: '2px 6px', borderRadius: '12px', border: '2px solid #0f172a' }
};

export default Home;