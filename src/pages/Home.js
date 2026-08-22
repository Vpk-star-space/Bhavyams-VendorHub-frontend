import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { Search, User, X, MapPin, Package, Home as HomeIcon, Store, LayoutDashboard, ShieldCheck, Sparkles } from 'lucide-react'; 
import { useNavigate, useLocation } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { AppContext } from '../context/AppContext'; 

import TrendingSection from '../components/TrendingSection';
import PromotionsSection from '../components/PromotionsSection'; 

const getBackendUrl = () => {
    return process.env.NODE_ENV === 'production' 
        ? 'https://bhavyams-vendorhub-backend.onrender.com/api' 
        : 'http://localhost:5000/api';
};

// 🟢 DEEP TRANSLATION DICTIONARY FOR HOME PAGE
const homeTranslations = {
    en: {
        syncing: "Syncing Market...",
        searchFor: "Search for products or shops...",
        searchResults: "Search Results for",
        topTrending: "🔥 Top Trending Shops",
        subhamsExpo: "🌟 Subhams Expo",
        browse: "Browse",
        sellers: "Sellers",
        open: "Open",
        closed: "Closed",
        localArea: "Local Area",
        home: "Home",
        dashboard: "Dashboard",
        shopOrders: "Shop",
        orders: "Orders",
        expo: "Expo",
        profile: "Profile",
        admin: "Admin"
    },
    te: {
        syncing: "మార్కెట్‌ను సింక్ చేస్తోంది...",
        searchFor: "ఉత్పత్తులు లేదా దుకాణాల కోసం వెతకండి...",
        searchResults: "దీని కోసం శోధన ఫలితాలు",
        topTrending: "🔥 టాప్ ట్రెండింగ్ షాపులు",
        subhamsExpo: "🌟 సుభమ్స్ ఎక్స్‌పో",
        browse: "బ్రౌజ్ చేయండి",
        sellers: "విక్రేతలు",
        open: "తెరిచి ఉంది",
        closed: "మూసివేయబడింది",
        localArea: "స్థానిక ప్రాంతం",
        home: "హోమ్",
        dashboard: "డాష్‌బోర్డ్",
        shopOrders: "షాప్",
        orders: "ఆర్డర్‌లు",
        expo: "ఎక్స్‌పో",
        profile: "ప్రొఫైల్",
        admin: "అడ్మిన్"
    }
};

const Home = () => {
    const { t, language, location: appLocation } = useContext(AppContext);
    const navigate = useNavigate();
    const currentRoute = useLocation().pathname;

    const lang = language === 'te' ? 'te' : 'en';
    const ht = homeTranslations[lang];

    const CATEGORIES = [t('Expo') || 'Expo', t('Trending') || 'Trending', t('Products') || 'Products', t('Services') || 'Services', t('Business') || 'Business'];

    const [products, setProducts] = useState([]);
    const [activeShops, setActiveShops] = useState([]); 
    const [adminCategories, setAdminCategories] = useState([]);
    const [selectedSubCategory, setSelectedSubCategory] = useState(null);

    const [loading, setLoading] = useState(true);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 1024); 
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[1]); // Default to Trending

    const userStr = localStorage.getItem('user');
    const user = userStr && userStr !== 'undefined' ? JSON.parse(userStr) : null;
    
    const isVendor = user && (user.role === 'vendor' || activeShops.some(shop => String(shop.user_id) === String(user.id)));
    const isAdmin = user && ((user.role && user.role.toLowerCase() === 'admin') || user.email === 'pavanvenkat63@gmail.com');

    const [cartCount, setCartCount] = useState(0);

    // =========================================================
    // ⚙️ SYSTEM LOGIC & EFFECTS
    // =========================================================
    useEffect(() => {
        const updateCartCount = () => {
            const localCart = JSON.parse(localStorage.getItem('subhams_cart') || '[]');
            const total = localCart.reduce((sum, item) => sum + (item.quantity || item.qty || 1), 0);
            setCartCount(total);
        };
        updateCartCount(); 
        window.addEventListener('storage', updateCartCount);
        const interval = setInterval(updateCartCount, 1000); 
        return () => {
            window.removeEventListener('storage', updateCartCount);
            clearInterval(interval);
        };
    }, []);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 1024);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const fetchLocalFeed = async () => {
            try {
                const lat = appLocation?.lat || 0;
                const lng = appLocation?.lng || 0;
                const BACKEND_URL = getBackendUrl();
                
                const res = await axios.get(`${BACKEND_URL}/products/feed?lat=${lat}&lng=${lng}`);
                setProducts(res.data.products || []);

                const shopRes = await axios.get(`${BACKEND_URL}/shops/active/all`);
                setActiveShops(shopRes.data.shops || []);

                try {
                    const catRes = await axios.get(`${BACKEND_URL}/admin/categories`);
                    setAdminCategories(catRes.data || []);
                } catch (catErr) { }

            } catch (err) {
                console.error("Error fetching data:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchLocalFeed(); 
    }, [appLocation?.lat, appLocation?.lng]);

    const handleCategoryClick = (cat) => {
        if (cat === t('Business')) {
            navigate('/register-business');
            return;
        }
        setSelectedCategory(cat);
        setSelectedSubCategory(null);
        setSearchQuery('');
    };

    const filteredProducts = products.filter(product => {
        const safeSearch = searchQuery ? searchQuery.toLowerCase().trim() : '';
        const pName = (product.name || product.title || '').toLowerCase();
        const pCategory = (product.category || '').toLowerCase();
        return !safeSearch || pName.includes(safeSearch) || pCategory.includes(safeSearch);
    });

    const currentTabEnglish = selectedCategory === (t('Services') || 'Services') ? 'Services' : (selectedCategory === (t('Products') || 'Products') ? 'Products' : selectedCategory);

    return (
        <div style={styles.page}>
            <style>
                {`
                    @keyframes gold-shimmer {
                        0% { background-position: -200% center; }
                        100% { background-position: 200% center; }
                    }
                    .premium-logo {
                        background: linear-gradient(to right, #ffffff 20%, #facc15 40%, #facc15 60%, #ffffff 80%);
                        background-size: 200% auto;
                        color: #000;
                        background-clip: text;
                        -webkit-background-clip: text;
                        -webkit-text-fill-color: transparent;
                        animation: gold-shimmer 3s linear infinite;
                    }
                    @keyframes pulse-glow {
                        0% { text-shadow: 0 0 10px rgba(250, 204, 21, 0.4); }
                        100% { text-shadow: 0 0 25px rgba(250, 204, 21, 0.8); }
                    }
                `}
            </style>

            {/* ========================================================= */}
            {/* 🟦 1. HEADER & SEARCH SECTION */}
            {/* ========================================================= */}
            <div style={styles.header}>
                <div style={isMobile ? styles.mobileHeaderContent : styles.desktopHeaderContent}>
                    
                    {/* PREMIUM ANIMATED BRANDING */}
                    <div style={{display: 'flex', alignItems: 'center', gap: '15px', cursor: 'pointer'}} onClick={() => {setSearchQuery(''); setSelectedCategory(CATEGORIES[1]); setSelectedSubCategory(null); window.scrollTo(0,0);}}>
                        <h1 style={{ margin: 0, display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
                            <span className="premium-logo" style={{ fontSize: '24px', fontWeight: '900', letterSpacing: '1px', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>SUBHAMS</span>
                            <span style={{ fontSize: '11px', color: '#facc15', fontWeight: '900', letterSpacing: '3px', textTransform: 'uppercase' }}>HUB</span>
                        </h1>
                    </div>
                    
                    {/* TRANSLATED UNIVERSAL SEARCH BAR */}
                    <div style={{ flex: 1, maxWidth: '600px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={styles.searchBar}>
                            <input 
                                type="text" 
                                placeholder={ht.searchFor} 
                                style={styles.searchInput} 
                                value={searchQuery}
                                onChange={(e) => { setSearchQuery(e.target.value); }}
                            />
                            <Search size={18} color="#2874f0" style={styles.searchIcon} />
                        </div>
                    </div>

                    {/* 🛡️ ADMIN BUTTON */}
                    {isAdmin && (
                        <button onClick={() => navigate('/admin')} style={styles.adminBtn}>
                            <ShieldCheck size={18} />
                            {isMobile ? "" : ht.admin}
                        </button>
                    )}
                </div>
            </div>

            {/* ========================================================= */}
            {/* 🟨 2. CATEGORIES STRIP SECTION */}
            {/* ========================================================= */}
            <div style={styles.categoryStrip}>
                <div style={styles.catContent}>
                    {CATEGORIES.map(cat => (
                        <span key={cat} onClick={() => handleCategoryClick(cat)}
                            style={{ ...styles.catItem, ...(selectedCategory === cat ? { borderBottom: '3px solid #2874f0', color: '#2874f0', fontWeight: 'bold' } : {}) }}>
                            {cat === CATEGORIES[1] ? '🔥 ' : ''}
                            {cat === CATEGORIES[0] ? '🌟 ' : ''}
                            {cat}
                        </span>
                    ))}
                </div>
            </div>

            {/* ========================================================= */}
            {/* 🟩 3. MAIN CONTENT (PRODUCTS & SHOPS) */}
            {/* ========================================================= */}
            <div style={{ maxWidth: '1000px', margin: '20px auto', padding: '0 15px', width: '100%', boxSizing: 'border-box' }}>
                
                {loading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0', animation: 'pulse-glow 2s infinite alternate' }}>
                        <h1 style={{ margin: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1 }}>
                            <span className="premium-logo" style={{ fontSize: '32px', fontWeight: '900', letterSpacing: '2px' }}>SUBHAMS</span>
                            <span style={{ fontSize: '14px', color: '#facc15', fontWeight: '900', letterSpacing: '4px' }}>HUB</span>
                        </h1>
                        <p style={{marginTop: '15px', color: '#94a3b8', fontWeight: 'bold', fontSize: '13px', letterSpacing: '1px', textTransform: 'uppercase'}}>{ht.syncing}</p>
                    </div>
                ) : (
                    <>
                        {searchQuery ? (
                            <div>
                                <h2 style={{ fontSize: '22px', marginBottom: '20px', color: '#1e293b' }}>{ht.searchResults} "{searchQuery}"</h2>
                                {filteredProducts.length > 0 && (
                                    <div style={isMobile ? styles.mobileProductGrid : styles.desktopProductGrid}>
                                        {filteredProducts.map(product => <ProductCard key={product.id} product={product} t={t} />)}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <>
                                {selectedCategory === CATEGORIES[1] && <TrendingSection vendors={activeShops} navigate={navigate} t={t} />}
                                {selectedCategory === CATEGORIES[0] && <PromotionsSection />}

                                {/* 🏪 SHOPS LIST (TRENDING & EXPO) */}
                                {(selectedCategory === CATEGORIES[0] || selectedCategory === CATEGORIES[1]) && (
                                    <div>
                                        <h2 style={{ fontSize: '22px', marginBottom: '20px', color: '#1e293b' }}>
                                            {selectedCategory === CATEGORIES[1] ? ht.topTrending : ht.subhamsExpo}
                                        </h2>
                                        
                                        <div style={isMobile ? styles.mobileProductGrid : styles.desktopProductGrid}>
                                            {activeShops
                                                .filter(shop => {
                                                    const dbType = shop.shop_type || 'Products'; 
                                                    if (selectedCategory === CATEGORIES[0]) return dbType.includes('Expo') || dbType.includes('Promotions');
                                                    if (selectedCategory === CATEGORIES[1]) return dbType.includes('Trending');
                                                    return false;
                                                })
                                                .map(shop => (
                                                    <div 
                                                        key={shop.id} 
                                                        onClick={() => navigate(`/shop/${shop.id}`)}
                                                        style={{ width: '240px', flexShrink: 0, background: 'white', borderRadius: '12px', padding: '16px', border: '1px solid #e2e8f0', cursor: 'pointer', boxShadow: '0 4px 6px rgba(0,0,0,0.02)', position: 'relative' }}
                                                    >
                                                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px'}}>
                                                            <h4 style={{ margin: '0', color: '#0f172a', fontSize: '16px', fontWeight: 'bold' }}>{shop.business_name}</h4>
                                                            {shop.is_online ? (
                                                                <span style={{ background: '#dcfce7', color: '#16a34a', fontSize: '10px', padding: '4px 8px', borderRadius: '12px', fontWeight: 'bold' }}>{ht.open}</span>
                                                            ) : (
                                                                <span style={{ background: '#fef2f2', color: '#dc2626', fontSize: '10px', padding: '4px 8px', borderRadius: '12px', fontWeight: 'bold' }}>{ht.closed}</span>
                                                            )}
                                                        </div>
                                                        
                                                        {shop.shop_image && (
                                                            <img src={shop.shop_image} alt={shop.business_name} style={{width: '100%', height: '120px', objectFit: 'cover', borderRadius: '8px', marginBottom: '12px'}} />
                                                        )}

                                                        <p style={{ margin: '0 0 8px 0', color: '#2874f0', fontSize: '13px', fontWeight: 'bold' }}>{shop.category}</p>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#64748b' }}>
                                                            <MapPin size={14} /> {shop.address || ht.localArea}
                                                        </div>
                                                    </div>
                                                ))}
                                        </div>
                                    </div>
                                )}

                                {/* 📁 DYNAMIC FOLDER VIEW FOR PRODUCTS & SERVICES */}
                                {(selectedCategory === CATEGORIES[2] || selectedCategory === CATEGORIES[3]) && (
                                    <div>
                                        {!selectedSubCategory ? (
                                            <>
                                                <h2 style={{ fontSize: '22px', marginBottom: '20px', color: '#1e293b' }}>
                                                    {ht.browse} {selectedCategory}
                                                </h2>
                                                
                                                {(() => {
                                                    const shopsInTab = activeShops.filter(shop => {
                                                        const dbType = shop.shop_type || 'Products'; 
                                                        return dbType.toLowerCase().includes(currentTabEnglish.toLowerCase());
                                                    });

                                                    let extractedCategories = [];
                                                    shopsInTab.forEach(shop => {
                                                        if (shop.category) {
                                                            shop.category.split(',').forEach(c => {
                                                                const cleanCat = c.trim();
                                                                if (cleanCat) extractedCategories.push(cleanCat);
                                                            });
                                                        }
                                                    });
                                                    
                                                    const registeredCategories = [...new Set(extractedCategories)];
                                                    const adminCatForTab = adminCategories.filter(c => c.section && c.section.toLowerCase() === currentTabEnglish.toLowerCase());
                                                    const adminNamesLower = adminCatForTab.map(c => c.name.toLowerCase().trim());
                                                    const extraRegistered = registeredCategories.filter(cat => !adminNamesLower.includes(cat.toLowerCase().trim()));

                                                    const allCategoryNames = [...adminCatForTab.map(c => c.name), ...extraRegistered];

                                                    if (allCategoryNames.length === 0) return null;

                                                    return (
                                                        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', justifyContent: 'flex-start' }}>
                                                            {allCategoryNames.map((catName, index) => {
                                                                const adminCat = adminCatForTab.find(c => c.name.toLowerCase() === catName.toLowerCase());
                                                                const imgSrc = adminCat ? adminCat.hd_image : 'https://via.placeholder.com/150/e2e8f0/64748b?text=' + catName.substring(0, 3);

                                                                return (
                                                                    <div 
                                                                        key={index} 
                                                                        onClick={() => setSelectedSubCategory(catName)}
                                                                        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '85px', cursor: 'pointer' }}
                                                                    >
                                                                        <img 
                                                                            src={imgSrc} 
                                                                            alt={catName} 
                                                                            style={{ width: '75px', height: '75px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #e2e8f0', boxShadow: '0 4px 6px rgba(0,0,0,0.05)'}} 
                                                                        />
                                                                        <span style={{ fontSize: '13px', marginTop: '8px', fontWeight: '600', color: '#334155', textAlign: 'center', lineHeight: '1.2' }}>
                                                                            {catName}
                                                                        </span>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    );
                                                })()}
                                            </>
                                        ) : (
                                            <>
                                                {/* 📁 INNER FOLDER VIEW */}
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
                                                    <button 
                                                        onClick={() => setSelectedSubCategory(null)} 
                                                        style={{ background: '#e2e8f0', border: 'none', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', color: '#475569', display: 'flex', alignItems: 'center', gap: '4px' }}
                                                    >
                                                        <X size={16} /> Back
                                                    </button>
                                                    <h2 style={{ fontSize: '22px', margin: 0, color: '#1e293b' }}>
                                                        {selectedSubCategory} {ht.sellers}
                                                    </h2>
                                                </div>

                                                <div style={isMobile ? styles.mobileProductGrid : styles.desktopProductGrid}>
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
                                                            <div 
                                                                key={shop.id} 
                                                                onClick={() => navigate(`/shop/${shop.id}`)}
                                                                style={{ width: '240px', flexShrink: 0, background: 'white', borderRadius: '12px', padding: '16px', border: '1px solid #e2e8f0', cursor: 'pointer', boxShadow: '0 4px 6px rgba(0,0,0,0.02)', position: 'relative' }}
                                                            >
                                                                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px'}}>
                                                                    <h4 style={{ margin: '0', color: '#0f172a', fontSize: '16px', fontWeight: 'bold' }}>{shop.business_name}</h4>
                                                                    {shop.is_online ? (
                                                                        <span style={{ background: '#dcfce7', color: '#16a34a', fontSize: '10px', padding: '4px 8px', borderRadius: '12px', fontWeight: 'bold' }}>{ht.open}</span>
                                                                    ) : (
                                                                        <span style={{ background: '#fef2f2', color: '#dc2626', fontSize: '10px', padding: '4px 8px', borderRadius: '12px', fontWeight: 'bold' }}>{ht.closed}</span>
                                                                    )}
                                                                </div>
                                                                
                                                                {shop.shop_image && (
                                                                    <img src={shop.shop_image} alt={shop.business_name} style={{width: '100%', height: '120px', objectFit: 'cover', borderRadius: '8px', marginBottom: '12px'}} />
                                                                )}

                                                                <p style={{ margin: '0 0 8px 0', color: '#2874f0', fontSize: '13px', fontWeight: 'bold' }}>{shop.category}</p>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#64748b' }}>
                                                                    <MapPin size={14} /> {shop.address || ht.localArea}
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

            {/* ========================================================= */}
            {/* 🟥 4. BOTTOM NAVIGATION BAR (FIXED SIZING & EXACT ORDER) */}
            {/* ========================================================= */}
            <div style={styles.bottomNavContainer}>
                
                {/* 1. HOME (Forces app back to Trending Feed) */}
                <button 
                    onClick={() => {
                        navigate('/');
                        setSelectedCategory(CATEGORIES[1]); // Set to Trending
                        setSelectedSubCategory(null);
                        setSearchQuery('');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                    }} 
                    style={currentRoute === '/' && selectedCategory === CATEGORIES[1] && !searchQuery && !selectedSubCategory ? styles.bottomNavBtnActive : styles.bottomNavBtn}
                >
                    <HomeIcon size={24} />
                    <span>{ht.home}</span>
                </button>

                {/* 2. EXPO */}
                <button 
                    onClick={() => {
                        navigate('/');
                        setSelectedCategory(CATEGORIES[0]); // Set to Expo
                        setSelectedSubCategory(null);
                        setSearchQuery('');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                    }} 
                    style={currentRoute === '/' && selectedCategory === CATEGORIES[0] ? styles.bottomNavBtnActive : styles.bottomNavBtn}
                >
                    <Sparkles size={24} />
                    <span>{ht.expo}</span>
                </button>

                {/* 3. DASHBOARD (Vendor) / ORDERS (User) */}
                {isVendor ? (
                    <button onClick={() => navigate('/dashboard')} style={currentRoute === '/dashboard' ? styles.bottomNavBtnActive : styles.bottomNavBtn}>
                        <LayoutDashboard size={24} />
                        <span>{ht.dashboard}</span>
                    </button>
                ) : (
                    <button onClick={() => navigate('/my-orders')} style={currentRoute === '/my-orders' ? styles.bottomNavBtnActive : styles.bottomNavBtn}>
                        <div style={{ position: 'relative' }}>
                            <Package size={24} />
                            {cartCount > 0 && <span style={styles.bottomNavBadge}>{cartCount}</span>}
                        </div>
                        <span>{ht.orders}</span>
                    </button>
                )}

                {/* 4. SHOP ORDERS (Vendor Only) */}
                {isVendor && (
                    <button onClick={() => navigate('/vendor/orders')} style={currentRoute === '/vendor/orders' ? styles.vendorNavBtnActive : styles.vendorNavBtn}>
                        <Store size={24} />
                        <span>{ht.shopOrders}</span>
                    </button>
                )}

                {/* 5. PROFILE */}
                <button onClick={() => navigate('/profile')} style={currentRoute === '/profile' ? styles.bottomNavBtnActive : styles.bottomNavBtn}>
                    <User size={24} />
                    <span>{ht.profile}</span>
                </button>

            </div>
            
            <div style={{ height: '70px' }}></div>
        </div>
    );
};

// =========================================================
// 🎨 STYLES
// =========================================================
const styles = {
    page: { background: '#f8fafc', minHeight: '100vh', fontFamily: 'Inter, sans-serif' },
    header: { background: '#2874f0', padding: '15px 0', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 2px 10px rgba(0,0,0,0.15)' },
    desktopHeaderContent: { maxWidth: '1240px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', gap: '20px' },
    mobileHeaderContent: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 15px', gap: '15px' },
    
    adminBtn: { background: 'linear-gradient(135deg, #facc15, #f59e0b)', color: '#713f12', border: 'none', padding: '8px 16px', borderRadius: '20px', fontWeight: '900', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 4px 10px rgba(245, 158, 11, 0.4)', transition: 'transform 0.2s' },

    searchBar: { width: '100%', display: 'flex', position: 'relative', alignItems: 'center' },
    searchInput: { width: '100%', padding: '12px 40px 12px 15px', borderRadius: '10px', border: 'none', outline: 'none', fontSize: '14px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', transition: 'all 0.2s', fontWeight: '500' },
    searchIcon: { position: 'absolute', right: '12px', cursor: 'pointer' },
    
    categoryStrip: { background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '12px 0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' },
    catContent: { maxWidth: '1240px', margin: '0 auto', display: 'flex', gap: '25px', padding: '0 20px', overflowX: 'auto', whiteSpace: 'nowrap', scrollbarWidth: 'none' },
    catItem: { fontSize: '15px', color: '#475569', cursor: 'pointer', paddingBottom: '8px', transition: 'all 0.2s' },
    
    desktopProductGrid: { display: 'flex', flexWrap: 'wrap', gap: '20px', justifyContent: 'flex-start' },
    mobileProductGrid: { display: 'flex', flexWrap: 'wrap', gap: '15px', justifyContent: 'flex-start' },
    
    // Bottom Nav (Clean layout without empty gaps)
    bottomNavContainer: { position: 'fixed', bottom: 0, left: 0, right: 0, background: '#ffffff', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 10px', paddingBottom: 'max(10px, env(safe-area-inset-bottom))', zIndex: 1000, boxShadow: '0 -4px 10px rgba(0,0,0,0.05)' },
    bottomNavBtn: { background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', color: '#64748b', fontSize: '10px', fontWeight: '600', cursor: 'pointer', flex: 1 },
    bottomNavBtnActive: { background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', color: '#2874f0', fontSize: '10px', fontWeight: '800', cursor: 'pointer', flex: 1 },
    vendorNavBtn: { background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', color: '#ef4444', fontSize: '10px', fontWeight: '700', cursor: 'pointer', flex: 1 },
    vendorNavBtnActive: { background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', color: '#dc2626', fontSize: '10px', fontWeight: '900', cursor: 'pointer', flex: 1 },
    bottomNavBadge: { position: 'absolute', top: '-4px', right: '-8px', background: '#ef4444', color: '#fff', fontSize: '9px', fontWeight: 'bold', padding: '2px 5px', borderRadius: '10px' }
};

export default Home;