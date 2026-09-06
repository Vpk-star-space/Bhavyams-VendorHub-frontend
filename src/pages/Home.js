import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { Search, User, X, MapPin, Package, Home as HomeIcon, Store, LayoutDashboard, ShieldCheck, Sparkles, Folder } from 'lucide-react'; 
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify'; 
import ProductCard from '../components/ProductCard';
import { AppContext } from '../context/AppContext'; 

import PromotionsSection from '../components/PromotionsSection'; 

const getBackendUrl = () => {
    return process.env.NODE_ENV === 'production' 
        ? 'https://bhavyams-vendorhub-backend.onrender.com/api' 
        : 'http://localhost:5000/api';
};

const getOptimizedImage = (url) => {
    if (!url) return null;
    if (url.includes('cloudinary.com') && !url.includes('q_auto')) {
        return url.replace('/upload/', '/upload/q_auto,f_auto,w_600/');
    }
    return url; 
};

// 🟢 REAL GPS MATH (Haversine Formula) - Checks Exact 25km Radius
const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const l1 = parseFloat(lat1), ln1 = parseFloat(lon1);
    const l2 = parseFloat(lat2), ln2 = parseFloat(lon2);
    if (isNaN(l1) || isNaN(ln1) || isNaN(l2) || isNaN(ln2)) return null;

    const R = 6371; 
    const dLat = (l2 - l1) * (Math.PI / 180);
    const dLon = (ln2 - ln1) * (Math.PI / 180);
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(l1 * (Math.PI / 180)) * Math.cos(l2 * (Math.PI / 180)) * 
        Math.sin(dLon/2) * Math.sin(dLon/2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    return (R * c).toFixed(1); 
};

const homeTranslations = {
    en: { syncing: "Syncing Market...", searchFor: "Search across all shops, categories & items...", searchResults: "Search Results for", topTrending: "🔥 Top Trending Shops", subhamsExpo: "🌟 Subhams Expo", browse: "Browse", sellers: "Sellers", open: "Open", closed: "Closed", localArea: "Local Area", home: "Home", dashboard: "Dashboard", shopOrders: "Shop", orders: "Orders", expo: "Expo", profile: "Profile", admin: "Admin" },
    te: { syncing: "మార్కెట్‌ను సింక్ చేస్తోంది...", searchFor: "అన్ని దుకాణాలు, వర్గాలు & వస్తువుల కోసం వెతకండి...", searchResults: "దీని కోసం శోధన ఫలితాలు", topTrending: "🔥 టాప్ ట్రెండింగ్ షాపులు", subhamsExpo: "🌟 సుభమ్స్ ఎక్స్‌పో", browse: "బ్రౌజ్ చేయండి", sellers: "విక్రేతలు", open: "తెరిచి ఉంది", closed: "మూసివేయబడింది", localArea: "స్థానిక ప్రాంతం", home: "హోమ్", dashboard: "డాష్‌బోర్డ్", shopOrders: "షాప్", orders: "ఆర్డర్‌లు", expo: "ఎక్స్‌పో", profile: "ప్రొఫైల్", admin: "అడ్మిన్" }
};

const categoryTranslations = {
    'Vegetables': 'కూరగాయలు',
    'Fruits': 'పండ్లు',
    'Groceries': 'కిరాణా',
    'Electronics': 'ఎలక్ట్రానిక్స్',
    'Clothing': 'బట్టలు',
    'Food': 'ఆహారం',
    'Meat': 'మాంసం',
    'Fish': 'చేపలు',
    'Services': 'సేవలు'
};

const Home = () => {
    const { t, language, location: appLocation } = useContext(AppContext);
    const navigate = useNavigate();
    const currentRoute = useLocation().pathname;

    const lang = language === 'te' ? 'te' : 'en';
    const ht = homeTranslations[lang];

    const CATEGORIES = [t('Expo') || 'Expo', t('Trending') || 'Trending', t('Shopping') || 'Shopping', t('Services') || 'Services', t('Business') || 'Business'];

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
    
    useEffect(() => {
        const checkUser = () => {
            const currentStr = localStorage.getItem('user');
            if (currentStr !== localUserStr) {
                setLocalUserStr(currentStr); 
            }
        };
        window.addEventListener('storage', checkUser);
        const interval = setInterval(checkUser, 1000); 
        return () => { window.removeEventListener('storage', checkUser); clearInterval(interval); };
    }, [localUserStr]);

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
        const interval = setInterval(updateCartCount, 1000); 
        return () => { window.removeEventListener('storage', updateCartCount); clearInterval(interval); };
    }, []);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 1024);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const fetchLocalFeed = async () => {
            setLoading(true);
            const lat = appLocation?.lat || 0;
            const lng = appLocation?.lng || 0;
            const BACKEND_URL = getBackendUrl();
            
            try {
                const results = await Promise.allSettled([
                    axios.get(`${BACKEND_URL}/products/feed?lat=${lat}&lng=${lng}`),
                    axios.get(`${BACKEND_URL}/shops/active/all`),
                    axios.get(`${BACKEND_URL}/admin/categories`)
                ]);

                if (results[0].status === 'fulfilled') setProducts(results[0].value.data.products || []);
                if (results[1].status === 'fulfilled') setActiveShops(results[1].value.data.shops || []);
                if (results[2].status === 'fulfilled') setAdminCategories(results[2].value.data || []);
                
            } catch (err) {
                console.error("Critical Feed Error:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchLocalFeed(); 
    }, [appLocation?.lat, appLocation?.lng]);

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
        setSelectedCategory(cat); setSelectedSubCategory(null); setSearchQuery(''); setShowSuggestions(false);
    };

    const getDistanceTag = (shop) => {
        if (appLocation?.lat && appLocation?.lng && shop.lat && shop.lng) {
            const dist = calculateDistance(appLocation.lat, appLocation.lng, shop.lat, shop.lng);
            if (dist !== null) return `📍 ~${dist} km`;
        }
        if (localUser && localUser.address && shop.address) {
            const uCity = localUser.address.split(',')[0].toLowerCase().trim();
            const sAddr = shop.address.toLowerCase();
            if (sAddr.includes(uCity)) return `📍 Near ${localUser.address.split(',')[0]}`;
        }
        if (!localUser && !appLocation?.lat) return "📍 Login for distance";
        if (localUser && !appLocation?.lat) return "📍 Turn on GPS";
        if (shop.address) return `📍 ${shop.address.split(',')[0]}`;
        
        return "📍 Nearby"; 
    };

    const nearbyShops = activeShops.filter(shop => {
        if (appLocation?.lat && appLocation?.lng && shop.lat && shop.lng) {
            const dist = calculateDistance(appLocation.lat, appLocation.lng, shop.lat, shop.lng);
            if (dist !== null && dist <= 25.0) return true; 
        }
        const uAddr = (localUser?.address || localUser?.location || '').toLowerCase();
        const sAddr = (shop.address || shop.location || '').toLowerCase();
        
        if (uAddr && sAddr) {
            const uParts = uAddr.split(/[\s,]+/); 
            if (uParts.some(part => part.length > 3 && sAddr.includes(part))) return true;
        }
        return false;
    });

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

    return (
        <div style={styles.page}>
            <style>
                {`
                    /* 🟢 NEW: Golden Shine Animation for Main Logo */
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

                    @keyframes scroll-left { 0% { transform: translateX(100%); } 100% { transform: translateX(-100%); } }
                    @keyframes pulse-logo { 0% { transform: scale(0.95); opacity: 0.8; } 50% { transform: scale(1.05); opacity: 1; } 100% { transform: scale(0.95); opacity: 0.8; } }
                    
                    /* 🟢 FIX: Perfect running text that stays inside its box */
                    @keyframes running-text {
                        0%   { transform: translateX(100%); }
                        100% { transform: translateX(-120%); }
                    }
                    .scroll-container {
                        width: 100%;
                        overflow: hidden;
                        white-space: nowrap;
                        box-sizing: border-box;
                    }
                    .scroll-text {
                        display: inline-block;
                        animation: running-text 5s linear infinite;
                    }

                    .warning-text { display: inline-block; white-space: nowrap; animation: scroll-left 15s linear infinite; color: #b91c1c; font-weight: 900; font-size: 15px; letter-spacing: 1px; }
                    .hide-scroll::-webkit-scrollbar { display: none; }
                    .hide-scroll { -ms-overflow-style: none; scrollbar-width: none; }
                `}
            </style>

            <div style={styles.headerStack}>
                <div style={styles.headerTopRow}>
                    <div style={{display: 'flex', alignItems: 'center', gap: '15px', cursor: 'pointer'}} onClick={() => {setSearchQuery(''); setSelectedCategory(CATEGORIES[1]); setSelectedSubCategory(null); window.scrollTo(0,0);}}>
                        <h1 style={{ margin: 0, display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                            {/* 🟢 Animated Premium Logo */}
                            <span className="animated-logo" style={{ fontSize: '26px', fontWeight: '900', letterSpacing: '-0.5px' }}>SUBHAMS</span>
                            <span style={{ fontSize: '14px', color: '#ffffff', fontWeight: '800', letterSpacing: '2px' }}>HUB</span>
                        </h1>
                    </div>
                    
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

                <div style={styles.headerSearchRow}>
                    <div style={styles.searchBarWrapper}>
                        <div style={styles.searchBar}>
                            <input 
                                type="text" 
                                placeholder={selectedSubCategory ? `Search in ${tc(selectedSubCategory)}...` : ht.searchFor} 
                                style={styles.searchInput} 
                                value={searchQuery} 
                                onChange={(e) => { setSearchQuery(e.target.value); setShowSuggestions(true); }}
                                onFocus={() => setShowSuggestions(true)}
                                onBlur={() => setTimeout(() => setShowSuggestions(false), 250)}
                            />
                            <Search size={18} color="#2874f0" style={styles.searchIcon} />
                        </div>

                        {showSuggestions && searchSuggestions.length > 0 && (
                            <div style={styles.suggestionsBox}>
                                {searchSuggestions.map((sug, i) => (
                                    <div key={i} style={styles.suggestionItem} onClick={() => handleSuggestionClick(sug)}>
                                        {sug.type === 'category' ? (
                                            <>
                                                <Folder size={18} color="#f59e0b" style={{flexShrink: 0}}/>
                                                <div style={{flex: 1, display: 'flex', flexDirection: 'column'}}>
                                                    <span style={{fontWeight: '900', color: '#0f172a', fontSize: '15px'}}>{tc(sug.name)} Category</span>
                                                    <span style={{fontSize: '11px', color: '#64748b'}}>Found in {sug.section === 'Products' ? 'Shopping' : 'Services'}</span>
                                                </div>
                                                <span style={{fontSize: '11px', background: '#eff6ff', color: '#2563eb', padding: '4px 10px', borderRadius: '12px', fontWeight: 'bold'}}>{sug.count} Shops Inside</span>
                                            </>
                                        ) : (
                                            <>
                                                <Store size={18} color="#2874f0" style={{flexShrink: 0}}/>
                                                <div style={{flex: 1, display: 'flex', flexDirection: 'column'}}>
                                                    <span style={{fontWeight: '900', color: '#0f172a', fontSize: '15px'}}>{sug.name}</span>
                                                    <span style={{fontSize: '11px', color: '#16a34a', fontWeight: 'bold'}}>{getDistanceTag(sug)}</span>
                                                </div>
                                                <span style={{fontSize: '11px', background: '#f0fdf4', color: '#16a34a', padding: '4px 10px', borderRadius: '12px', fontWeight: 'bold'}}>Visit Shop</span>
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
                        {CATEGORIES.map(cat => (
                            <span key={cat} onClick={() => handleCategoryClick(cat)}
                                style={{ 
                                    ...styles.catItem, 
                                    ...(selectedCategory === cat 
                                        ? { borderBottom: '3px solid #2874f0', color: '#2874f0', fontWeight: '900' } 
                                        : { color: '#475569', fontWeight: '700' }) 
                                }}>
                                {cat === CATEGORIES[1] ? '🔥 ' : ''}
                                {cat === CATEGORIES[0] ? '🌟 ' : ''}
                                {cat === CATEGORIES[2] ? '🛍️ ' : ''}
                                {cat === CATEGORIES[3] ? '🧑‍🔧 ' : ''}
                                {cat === CATEGORIES[4] ? '📈 ' : ''}
                                {cat}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            {localUser?.account_status === 'warned' && (
                <div style={{ background: '#fef2f2', borderBottom: '2px solid #ef4444', padding: '10px 0', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', position: 'sticky', top: '150px', zIndex: 99, overflow: 'hidden' }}>
                    <div className="warning-text">
                        ⚠️ OFFICIAL WARNING: {localUser.ban_reason || 'Please adhere to our community guidelines.'}
                    </div>
                </div>
            )}

            <div style={{ maxWidth: '1000px', margin: '15px auto', padding: '0 10px', width: '100%', boxSizing: 'border-box' }}>
                
                {loading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0' }}>
                        <div style={{ animation: 'pulse-logo 1.5s ease-in-out infinite', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <h1 style={{ margin: 0, display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                                <span style={{ fontSize: '36px', fontWeight: '900', letterSpacing: '-1px', color: '#0f172a' }}>SUBHAMS</span>
                                <span style={{ fontSize: '16px', color: '#facc15', fontWeight: '900', letterSpacing: '3px' }}>HUB</span>
                            </h1>
                            <p style={{marginTop: '10px', color: '#64748b', fontWeight: 'bold', fontSize: '12px', letterSpacing: '2px', textTransform: 'uppercase'}}>{ht.syncing}</p>
                        </div>
                    </div>
                ) : (
                    <>
                        {searchQuery && !showSuggestions ? (
                            <div style={{padding: '0 5px'}}>
                                <h2 style={{ fontSize: '20px', marginBottom: '15px', color: '#1e293b' }}>{ht.searchResults} "{searchQuery}"</h2>
                                {filteredProducts.length > 0 ? (
                                    <div style={styles.desktopProductGrid}>
                                        {filteredProducts.map(product => <ProductCard key={product.id} product={product} t={t} />)}
                                    </div>
                                ) : (
                                    <p style={{color: '#64748b', fontWeight: 'bold'}}>No items found. Try clicking a shop or category in the dropdown!</p>
                                )}
                            </div>
                        ) : (
                            <>
                                {/* 🟢 LOCATION-LOCKED NEARBY SHOPS */}
                                {selectedCategory === CATEGORIES[1] && (
                                    <div style={{ marginBottom: '25px', padding: '0 5px' }}>
                                        <h2 style={{ fontSize: '16px', marginBottom: '12px', color: '#0f172a', fontWeight: '900' }}>📍 Nearby Active Shops</h2>
                                        
                                        {(!appLocation?.lat && !localUser) ? (
                                            <div style={{ padding: '12px 15px', background: '#eff6ff', borderRadius: '10px', color: '#1e3a8a', fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', border: '1px solid #bfdbfe' }} onClick={() => navigate('/welcome')}>
                                                <MapPin size={16} color="#2563eb"/> Login or Turn on GPS to see shops near you!
                                            </div>
                                        ) : nearbyShops.length > 0 ? (
                                            <div style={{ display: 'flex', gap: '15px', overflowX: 'auto', paddingBottom: '10px', WebkitOverflowScrolling: 'touch' }} className="hide-scroll">
                                                {nearbyShops.map(shop => (
                                                    <div key={shop.id} onClick={() => navigate(`/shop/${shop.id}`)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '65px', flexShrink: 0, cursor: 'pointer' }}>
                                                        <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'linear-gradient(45deg, #2874f0, #facc15)', padding: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                                                            <img src={getOptimizedImage(shop.shop_logo) || 'https://via.placeholder.com/150'} alt={shop.business_name} crossOrigin="anonymous" referrerPolicy="no-referrer" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', border: '2px solid white' }} />
                                                        </div>
                                                        
                                                        <div className="scroll-container" style={{ marginTop: '6px' }}>
                                                            <span className={shop.business_name.length > 10 ? "scroll-text" : ""} style={{ fontSize: '10px', fontWeight: 'bold', color: '#1e293b' }}>
                                                                {shop.business_name}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p style={{fontSize: '12px', color: '#64748b', margin: 0, padding: '10px', background: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1'}}>No active shops found within 25km of your location.</p>
                                        )}
                                    </div>
                                )}

                                {selectedCategory === CATEGORIES[0] && <PromotionsSection />}

                                {/* 🏪 MAIN SHOPS LIST (🟢 STRICT 3-COLUMN GRID FIX: minmax(0,1fr)) */}
                                {(selectedCategory === CATEGORIES[0] || selectedCategory === CATEGORIES[1]) && (
                                    <div style={{padding: '0 5px'}}>
                                        <h2 style={{ fontSize: '18px', marginBottom: '15px', color: '#0f172a', fontWeight: '900' }}>
                                            {selectedCategory === CATEGORIES[1] ? ht.topTrending : ht.subhamsExpo}
                                        </h2>
                                        
                                        <div style={isMobile ? styles.mobileGrid3 : styles.desktopProductGrid}>
                                            {activeShops
                                                .filter(shop => {
                                                    const dbType = shop.shop_type || 'Products'; 
                                                    if (selectedCategory === CATEGORIES[0]) return dbType.includes('Expo') || dbType.includes('Promotions');
                                                    if (selectedCategory === CATEGORIES[1]) return dbType.includes('Trending');
                                                    return false;
                                                })
                                                .map(shop => (
                                                    <div key={shop.id} onClick={() => navigate(`/shop/${shop.id}`)} style={isMobile ? styles.shopCardMobile : styles.shopCardDesktop}>
                                                        <span style={{ position: 'absolute', top: '6px', right: '6px', background: shop.is_online ? '#dcfce7' : '#fef2f2', color: shop.is_online ? '#16a34a' : '#dc2626', fontSize: '8px', padding: '2px 5px', borderRadius: '6px', fontWeight: 'bold', zIndex: 5 }}>
                                                            {shop.is_online ? ht.open : ht.closed}
                                                        </span>

                                                        {shop.shop_logo ? (
                                                            <img src={getOptimizedImage(shop.shop_logo)} alt={shop.business_name} crossOrigin="anonymous" referrerPolicy="no-referrer" style={isMobile ? styles.shopImageMobile : styles.shopImageDesktop} />
                                                        ) : (
                                                            <div style={{...(isMobile ? styles.shopImageMobile : styles.shopImageDesktop), background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                                                                <Store size={isMobile ? 20 : 30} color="#cbd5e1"/>
                                                            </div>
                                                        )}
                                                        
                                                        {/* 🟢 PERFECT RUNNING TEXT THAT DOES NOT STRETCH THE BOX */}
                                                        <div className="scroll-container" style={{ margin: '0 0 2px 0' }}>
                                                            <h4 className={shop.business_name.length > 11 && isMobile ? "scroll-text" : ""} style={{ margin: 0, color: '#0f172a', fontSize: isMobile ? '11px' : '16px', fontWeight: '900' }}>
                                                                {shop.business_name}
                                                            </h4>
                                                        </div>

                                                        <p style={{ margin: '0 0 4px 0', color: '#2874f0', fontSize: isMobile ? '9px' : '13px', fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>
                                                            {tc(shop.category)}
                                                        </p>
                                                        
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '2px', fontSize: isMobile ? '8px' : '12px', color: '#64748b', fontWeight: '700', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                            <MapPin size={isMobile ? 10 : 14} color="#ef4444" /> {getDistanceTag(shop)}
                                                        </div>
                                                    </div>
                                                ))}
                                        </div>
                                    </div>
                                )}

                                {/* 📁 CATEGORIES & SHOPS VIEW (4-COLUMN CATEGORIES, 3-COLUMN SHOPS) */}
                                {(selectedCategory === CATEGORIES[2] || selectedCategory === CATEGORIES[3]) && (
                                    <div style={{padding: '0 5px'}}>
                                        {!selectedSubCategory ? (
                                            <>
                                                <h2 style={{ fontSize: '18px', marginBottom: '15px', color: '#0f172a', fontWeight: '900' }}>
                                                    {ht.browse} {selectedCategory}
                                                </h2>
                                                
                                                {(() => {
                                                    const adminCatForTab = adminCategories.filter(c => c.section && c.section.toLowerCase() === currentTabEnglish.toLowerCase());
                                                    const allCategoryNames = [...adminCatForTab.map(c => c.name)];

                                                    if (allCategoryNames.length === 0) return <div style={{padding: '20px', color: '#64748b'}}>Categories will appear once created by the Admin.</div>;

                                                    return (
                                                        <div style={isMobile ? styles.mobileGrid4 : styles.desktopFolderGrid}>
                                                            {allCategoryNames.map((catName, index) => {
                                                                const adminCat = adminCatForTab.find(c => c.name.toLowerCase() === catName.toLowerCase());
                                                                const imgSrc = adminCat ? adminCat.hd_image : 'https://via.placeholder.com/150/e2e8f0/64748b?text=' + catName.substring(0, 3);

                                                                return (
                                                                    <div key={index} onClick={() => setSelectedSubCategory(catName)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: isMobile ? '100%' : '90px', cursor: 'pointer' }}>
                                                                        <img src={getOptimizedImage(imgSrc)} alt={catName} crossOrigin="anonymous" referrerPolicy="no-referrer" style={{ width: isMobile ? '55px' : '75px', height: isMobile ? '55px' : '75px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #e2e8f0', boxShadow: '0 4px 6px rgba(0,0,0,0.05)'}} />
                                                                        <span style={{ fontSize: isMobile ? '10px' : '13px', marginTop: '6px', fontWeight: '800', color: '#1e293b', textAlign: 'center', lineHeight: '1.2' }}>{tc(catName)}</span>
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
                                                    <button onClick={() => setSelectedSubCategory(null)} style={{ background: '#e2e8f0', border: 'none', padding: '6px 10px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', color: '#475569', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
                                                        <X size={14} /> Back
                                                    </button>
                                                    <h2 style={{ fontSize: '18px', margin: 0, color: '#1e293b', fontWeight: '900' }}>
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
                                                        .map(shop => (
                                                            <div key={shop.id} onClick={() => navigate(`/shop/${shop.id}`)} style={isMobile ? styles.shopCardMobile : styles.shopCardDesktop}>
                                                                <span style={{ position: 'absolute', top: '6px', right: '6px', background: shop.is_online ? '#dcfce7' : '#fef2f2', color: shop.is_online ? '#16a34a' : '#dc2626', fontSize: '8px', padding: '2px 5px', borderRadius: '6px', fontWeight: 'bold', zIndex: 5 }}>
                                                                    {shop.is_online ? ht.open : ht.closed}
                                                                </span>

                                                                {shop.shop_logo ? (
                                                                    <img src={getOptimizedImage(shop.shop_logo)} alt={shop.business_name} crossOrigin="anonymous" referrerPolicy="no-referrer" style={isMobile ? styles.shopImageMobile : styles.shopImageDesktop} />
                                                                ) : (
                                                                    <div style={{...(isMobile ? styles.shopImageMobile : styles.shopImageDesktop), background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                                                                        <Store size={isMobile ? 20 : 30} color="#cbd5e1"/>
                                                                    </div>
                                                                )}

                                                                <div className="scroll-container" style={{ margin: '0 0 2px 0' }}>
                                                                    <h4 className={shop.business_name.length > 11 && isMobile ? "scroll-text" : ""} style={{ margin: 0, color: '#0f172a', fontSize: isMobile ? '11px' : '16px', fontWeight: '900' }}>
                                                                        {shop.business_name}
                                                                    </h4>
                                                                </div>

                                                                <p style={{ margin: '0 0 4px 0', color: '#2874f0', fontSize: isMobile ? '9px' : '13px', fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>
                                                                    {tc(shop.category)}
                                                                </p>
                                                                
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '2px', fontSize: isMobile ? '8px' : '12px', color: '#64748b', fontWeight: '700', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                                    <MapPin size={isMobile ? 10 : 14} color="#ef4444" /> {getDistanceTag(shop)}
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
                    </>
                )}
            </div>

            <div style={styles.bottomNavContainer}>
                <button onClick={() => { navigate('/'); setSelectedCategory(CATEGORIES[1]); setSelectedSubCategory(null); setSearchQuery(''); window.scrollTo({ top: 0, behavior: 'smooth' }); }} style={currentRoute === '/' && selectedCategory === CATEGORIES[1] && !searchQuery && !selectedSubCategory ? styles.bottomNavBtnActive : styles.bottomNavBtn}>
                    <HomeIcon size={24} /><span>{ht.home}</span>
                </button>
                <button onClick={() => { navigate('/'); setSelectedCategory(CATEGORIES[0]); setSelectedSubCategory(null); setSearchQuery(''); window.scrollTo({ top: 0, behavior: 'smooth' }); }} style={currentRoute === '/' && selectedCategory === CATEGORIES[0] ? styles.bottomNavBtnActive : styles.bottomNavBtn}>
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
    page: { background: '#f8fafc', minHeight: '100vh', fontFamily: 'Inter, sans-serif' },
    
    headerStack: { display: 'flex', flexDirection: 'column', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 4px 15px rgba(0,0,0,0.05)' },
    headerTopRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 20px', background: '#2874f0', width: '100%', boxSizing: 'border-box' },
    headerSearchRow: { padding: '0 20px 15px 20px', background: '#2874f0', width: '100%', boxSizing: 'border-box' },
    headerCatStrip: { background: '#ffffff', borderBottom: '1px solid #e2e8f0', width: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch', padding: '0 10px' },

    adminBtn: { background: 'linear-gradient(135deg, #facc15, #f59e0b)', color: '#713f12', border: 'none', padding: '6px 14px', borderRadius: '20px', fontWeight: '900', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 4px 10px rgba(245, 158, 11, 0.4)' },
    loginHeaderBtn: { background: '#ffffff', color: '#2874f0', border: 'none', padding: '8px 16px', borderRadius: '20px', fontWeight: '900', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 4px 10px rgba(0, 0, 0, 0.15)' },
    
    searchBarWrapper: { position: 'relative', maxWidth: '800px', margin: '0 auto' },
    searchBar: { width: '100%', display: 'flex', position: 'relative', alignItems: 'center' },
    searchInput: { width: '100%', padding: '14px 45px 14px 15px', borderRadius: '12px', border: 'none', outline: 'none', fontSize: '15px', background: '#ffffff', fontWeight: '600', transition: '0.2s', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' },
    searchIcon: { position: 'absolute', right: '15px', cursor: 'pointer' },
    
    suggestionsBox: { position: 'absolute', top: '110%', left: 0, right: 0, background: 'white', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.15)', border: '1px solid #cbd5e1', zIndex: 150, overflow: 'hidden' },
    suggestionItem: { padding: '14px 15px', display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid #f1f5f9', cursor: 'pointer', transition: '0.2s', background: 'white' },

    catContent: { display: 'flex', gap: '22px', padding: '14px 20px', width: 'max-content', margin: '0 auto' },
    catItem: { flexShrink: 0, fontSize: '14px', cursor: 'pointer', paddingBottom: '6px', transition: 'all 0.2s' },
    
    // 🟢 STRICT CSS GRID: minmax(0, 1fr) violently forces the boxes to stay equal size and prevents overflow stretching
    mobileGrid3: { display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '8px', width: '100%' },
    mobileGrid4: { display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '8px', width: '100%' },
    desktopProductGrid: { display: 'flex', flexWrap: 'wrap', gap: '20px', justifyContent: 'flex-start' },
    desktopFolderGrid: { display: 'flex', flexDirection: 'row', gap: '20px', flexWrap: 'wrap', justifyContent: 'flex-start', width: '100%' },

    // 🟢 SHOP CARDS: Overflow hidden locks the stretching
    shopCardMobile: { background: 'white', borderRadius: '8px', padding: '6px', border: '1px solid #e2e8f0', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', position: 'relative', width: '100%', boxSizing: 'border-box', overflow: 'hidden' },
    shopImageMobile: { width: '100%', height: '80px', objectFit: 'cover', borderRadius: '4px', marginBottom: '6px' },

    shopCardDesktop: { width: '240px', background: 'white', borderRadius: '16px', padding: '16px', border: '1px solid #e2e8f0', cursor: 'pointer', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' },
    shopImageDesktop: { width: '100%', height: '140px', objectFit: 'cover', borderRadius: '10px', marginBottom: '12px' },
    
    bottomNavContainer: { position: 'fixed', bottom: 0, left: 0, right: 0, background: '#ffffff', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 10px', paddingBottom: 'max(10px, env(safe-area-inset-bottom))', zIndex: 1000, boxShadow: '0 -4px 10px rgba(0,0,0,0.05)' },
    bottomNavBtn: { background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', color: '#64748b', fontSize: '10px', fontWeight: '600', cursor: 'pointer', flex: 1 },
    bottomNavBtnActive: { background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', color: '#2874f0', fontSize: '10px', fontWeight: '800', cursor: 'pointer', flex: 1 },
    vendorNavBtn: { background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', color: '#ef4444', fontSize: '10px', fontWeight: '700', cursor: 'pointer', flex: 1 },
    vendorNavBtnActive: { background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', color: '#dc2626', fontSize: '10px', fontWeight: '900', cursor: 'pointer', flex: 1 },
    bottomNavBadge: { position: 'absolute', top: '-4px', right: '-8px', background: '#ef4444', color: '#fff', fontSize: '9px', fontWeight: 'bold', padding: '2px 5px', borderRadius: '10px' }
};

export default Home;