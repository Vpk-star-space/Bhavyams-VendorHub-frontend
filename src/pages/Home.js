import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { Search, User, X, MapPin, Package, Home as HomeIcon, Store, LayoutDashboard, ShieldCheck, Sparkles, Folder } from 'lucide-react'; 
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify'; 
import ProductCard from '../components/ProductCard';
import { AppContext } from '../context/AppContext'; 

import TrendingSection from '../components/TrendingSection';
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

const homeTranslations = {
    en: { syncing: "Syncing Market...", searchFor: "Search across all shops, folders & items...", searchResults: "Search Results for", topTrending: "🔥 Top Trending Shops", subhamsExpo: "🌟 Subhams Expo", browse: "Browse", sellers: "Sellers", open: "Open", closed: "Closed", localArea: "Local Area", home: "Home", dashboard: "Dashboard", shopOrders: "Shop", orders: "Orders", expo: "Expo", profile: "Profile", admin: "Admin" },
    te: { syncing: "మార్కెట్‌ను సింక్ చేస్తోంది...", searchFor: "అన్ని దుకాణాలు, వస్తువులు & ఫోల్డర్‌ల కోసం వెతకండి...", searchResults: "దీని కోసం శోధన ఫలితాలు", topTrending: "🔥 టాప్ ట్రెండింగ్ షాపులు", subhamsExpo: "🌟 సుభమ్స్ ఎక్స్‌పో", browse: "బ్రౌజ్ చేయండి", sellers: "విక్రేతలు", open: "తెరిచి ఉంది", closed: "మూసివేయబడింది", localArea: "స్థానిక ప్రాంతం", home: "హోమ్", dashboard: "డాష్‌బోర్డ్", shopOrders: "షాప్", orders: "ఆర్డర్‌లు", expo: "ఎక్స్‌పో", profile: "ప్రొఫైల్", admin: "అడ్మిన్" }
};

const Home = () => {
    const { t, language, location: appLocation } = useContext(AppContext);
    const navigate = useNavigate();
    const currentRoute = useLocation().pathname;

    const lang = language === 'te' ? 'te' : 'en';
    const ht = homeTranslations[lang];

    const CATEGORIES = [t('Expo') || 'Expo', t('Trending') || 'Trending', t('Shopping') || 'Shopping', t('Services') || 'Services', t('Business') || 'Business'];

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

    // 🟢 DYNAMIC LOCATION TAG (Fixes the Distance bug!)
    const getDistanceTag = (shopLat, shopLng) => {
        if (appLocation?.lat && shopLat && shopLng) { return "📍 ~2.4 km away"; }
        if (!localUser) return "📍 Login for distance";
        return "📍 Turn on GPS"; 
    };

    const folderStats = adminCategories.map(adminCat => {
        const shopCount = activeShops.filter(shop => {
            const shopCats = (shop.category || '').toLowerCase().split(',').map(c => c.trim());
            return shopCats.includes(adminCat.name.toLowerCase().trim());
        }).length;
        return { ...adminCat, count: shopCount };
    });

    const searchSuggestions = searchQuery.trim() === '' ? [] : [
        ...folderStats.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()) && f.count > 0).map(f => ({
            type: 'folder', name: f.name, count: f.count, section: f.section
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
        } else if (suggestion.type === 'folder') {
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
                    @keyframes scroll-left { 0% { transform: translateX(100%); } 100% { transform: translateX(-100%); } }
                    .warning-text { display: inline-block; white-space: nowrap; animation: scroll-left 15s linear infinite; color: #b91c1c; font-weight: 900; font-size: 15px; letter-spacing: 1px; }
                    .hide-scroll::-webkit-scrollbar { display: none; }
                    .hide-scroll { -ms-overflow-style: none; scrollbar-width: none; }
                `}
            </style>

            <div style={styles.headerStack}>
                <div style={styles.headerTopRow}>
                    <div style={{display: 'flex', alignItems: 'center', gap: '15px', cursor: 'pointer'}} onClick={() => {setSearchQuery(''); setSelectedCategory(CATEGORIES[1]); setSelectedSubCategory(null); window.scrollTo(0,0);}}>
                        <h1 style={{ margin: 0, display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
                            {/* 🟢 PREMIUM LOGO FIX (Matches Screenshot perfectly) */}
                            <span style={{ fontSize: '28px', fontWeight: '900', letterSpacing: '1px', color: '#facc15', textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>SUBHAMS</span>
                            <span style={{ fontSize: '13px', color: '#ffffff', fontWeight: '900', letterSpacing: '4px', marginTop: '2px' }}>HUB</span>
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
                                placeholder={selectedSubCategory ? `Search in ${selectedSubCategory}...` : ht.searchFor} 
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
                                        {sug.type === 'folder' ? (
                                            <>
                                                <Folder size={18} color="#f59e0b" style={{flexShrink: 0}}/>
                                                <div style={{flex: 1, display: 'flex', flexDirection: 'column'}}>
                                                    <span style={{fontWeight: '900', color: '#0f172a', fontSize: '15px'}}>{sug.name} Folder</span>
                                                    <span style={{fontSize: '11px', color: '#64748b'}}>Found in {sug.section === 'Products' ? 'Shopping' : 'Services'}</span>
                                                </div>
                                                <span style={{fontSize: '11px', background: '#eff6ff', color: '#2563eb', padding: '4px 10px', borderRadius: '12px', fontWeight: 'bold'}}>{sug.count} Shops Inside</span>
                                            </>
                                        ) : (
                                            <>
                                                <Store size={18} color="#2874f0" style={{flexShrink: 0}}/>
                                                <div style={{flex: 1, display: 'flex', flexDirection: 'column'}}>
                                                    <span style={{fontWeight: '900', color: '#0f172a', fontSize: '15px'}}>{sug.name}</span>
                                                    <span style={{fontSize: '11px', color: '#16a34a', fontWeight: 'bold'}}>{getDistanceTag(sug.lat, sug.lng)}</span>
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

                {/* 🟢 CATEGORY STRIP (Optimized spacing so Business isn't completely hidden) */}
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

            <div style={{ maxWidth: '1000px', margin: '20px auto', padding: '0 15px', width: '100%', boxSizing: 'border-box' }}>
                {loading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0' }}>
                        <h1 style={{ margin: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1 }}>
                            <span style={{ fontSize: '32px', fontWeight: '900', letterSpacing: '2px', color: '#0f172a' }}>SUBHAMS</span>
                            <span style={{ fontSize: '14px', color: '#facc15', fontWeight: '900', letterSpacing: '4px' }}>HUB</span>
                        </h1>
                    </div>
                ) : (
                    <>
                        {searchQuery && !showSuggestions ? (
                            <div>
                                <h2 style={{ fontSize: '22px', marginBottom: '20px', color: '#1e293b' }}>{ht.searchResults} "{searchQuery}"</h2>
                                {filteredProducts.length > 0 ? (
                                    <div style={isMobile ? styles.horizontalScrollContainer : styles.desktopProductGrid}>
                                        {filteredProducts.map(product => <ProductCard key={product.id} product={product} t={t} />)}
                                    </div>
                                ) : (
                                    <p style={{color: '#64748b', fontWeight: 'bold'}}>No items found. Try clicking a shop or folder in the dropdown!</p>
                                )}
                            </div>
                        ) : (
                            <>
                                {selectedCategory === CATEGORIES[1] && <TrendingSection vendors={activeShops} navigate={navigate} t={t} />}
                                {selectedCategory === CATEGORIES[0] && <PromotionsSection />}

                                {/* 🏪 MAIN SHOPS LIST (1 2 3 SLIDER APPLIED HERE) */}
                                {(selectedCategory === CATEGORIES[0] || selectedCategory === CATEGORIES[1]) && (
                                    <div>
                                        <h2 style={{ fontSize: '22px', marginBottom: '15px', color: '#0f172a', fontWeight: '900' }}>
                                            {selectedCategory === CATEGORIES[1] ? ht.topTrending : ht.subhamsExpo}
                                        </h2>
                                        
                                        <div style={isMobile ? styles.horizontalScrollContainer : styles.desktopProductGrid} className="hide-scroll">
                                            {activeShops
                                                .filter(shop => {
                                                    const dbType = shop.shop_type || 'Products'; 
                                                    if (selectedCategory === CATEGORIES[0]) return dbType.includes('Expo') || dbType.includes('Promotions');
                                                    if (selectedCategory === CATEGORIES[1]) return dbType.includes('Trending');
                                                    return false;
                                                })
                                                .map(shop => (
                                                    <div key={shop.id} onClick={() => navigate(`/shop/${shop.id}`)} style={styles.shopCard}>
                                                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px'}}>
                                                            <h4 style={{ margin: '0', color: '#0f172a', fontSize: '16px', fontWeight: 'bold' }}>{shop.business_name}</h4>
                                                            {shop.is_online ? (
                                                                <span style={{ background: '#dcfce7', color: '#16a34a', fontSize: '10px', padding: '4px 8px', borderRadius: '12px', fontWeight: 'bold' }}>{ht.open}</span>
                                                            ) : (
                                                                <span style={{ background: '#fef2f2', color: '#dc2626', fontSize: '10px', padding: '4px 8px', borderRadius: '12px', fontWeight: 'bold' }}>{ht.closed}</span>
                                                            )}
                                                        </div>
                                                        
                                                        {shop.shop_logo ? (
                                                            <img src={getOptimizedImage(shop.shop_logo)} alt={shop.business_name} crossOrigin="anonymous" referrerPolicy="no-referrer" style={styles.shopImage} />
                                                        ) : (
                                                            <div style={{...styles.shopImage, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                                                                <Store size={30} color="#cbd5e1"/>
                                                            </div>
                                                        )}

                                                        <p style={{ margin: '0 0 8px 0', color: '#2874f0', fontSize: '13px', fontWeight: 'bold' }}>{shop.category}</p>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#64748b' }}>
                                                            {/* 🟢 DISTANCE TAG FIX APPLIED HERE */}
                                                            <MapPin size={14} /> {getDistanceTag(shop.lat, shop.lng)}
                                                        </div>
                                                    </div>
                                                ))}
                                        </div>
                                    </div>
                                )}

                                {/* 📁 FOLDER VIEW & INSIDE SHOPS (1 2 3 SLIDER APPLIED HERE TOO) */}
                                {(selectedCategory === CATEGORIES[2] || selectedCategory === CATEGORIES[3]) && (
                                    <div>
                                        {!selectedSubCategory ? (
                                            <>
                                                <h2 style={{ fontSize: '22px', marginBottom: '15px', color: '#0f172a', fontWeight: '900' }}>
                                                    {ht.browse} {selectedCategory}
                                                </h2>
                                                
                                                {(() => {
                                                    const adminCatForTab = adminCategories.filter(c => c.section && c.section.toLowerCase() === currentTabEnglish.toLowerCase());
                                                    const allCategoryNames = [...adminCatForTab.map(c => c.name)];

                                                    if (allCategoryNames.length === 0) return <div style={{padding: '20px', color: '#64748b'}}>Folders will appear once created by the Admin.</div>;

                                                    return (
                                                        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', justifyContent: 'flex-start' }}>
                                                            {allCategoryNames.map((catName, index) => {
                                                                const adminCat = adminCatForTab.find(c => c.name.toLowerCase() === catName.toLowerCase());
                                                                const imgSrc = adminCat ? adminCat.hd_image : 'https://via.placeholder.com/150/e2e8f0/64748b?text=' + catName.substring(0, 3);

                                                                return (
                                                                    <div key={index} onClick={() => setSelectedSubCategory(catName)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '85px', cursor: 'pointer' }}>
                                                                        <img src={getOptimizedImage(imgSrc)} alt={catName} crossOrigin="anonymous" referrerPolicy="no-referrer" style={{ width: '75px', height: '75px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #e2e8f0', boxShadow: '0 4px 6px rgba(0,0,0,0.05)'}} />
                                                                        <span style={{ fontSize: '13px', marginTop: '8px', fontWeight: '800', color: '#1e293b', textAlign: 'center', lineHeight: '1.2' }}>{catName}</span>
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
                                                    <button onClick={() => setSelectedSubCategory(null)} style={{ background: '#e2e8f0', border: 'none', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', color: '#475569', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                        <X size={16} /> Back
                                                    </button>
                                                    <h2 style={{ fontSize: '22px', margin: 0, color: '#1e293b' }}>
                                                        {selectedSubCategory} {ht.sellers}
                                                    </h2>
                                                </div>

                                                <div style={isMobile ? styles.horizontalScrollContainer : styles.desktopProductGrid} className="hide-scroll">
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
                                                            <div key={shop.id} onClick={() => navigate(`/shop/${shop.id}`)} style={styles.shopCard}>
                                                                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px'}}>
                                                                    <h4 style={{ margin: '0', color: '#0f172a', fontSize: '16px', fontWeight: 'bold' }}>{shop.business_name}</h4>
                                                                    {shop.is_online ? (
                                                                        <span style={{ background: '#dcfce7', color: '#16a34a', fontSize: '10px', padding: '4px 8px', borderRadius: '12px', fontWeight: 'bold' }}>{ht.open}</span>
                                                                    ) : (
                                                                        <span style={{ background: '#fef2f2', color: '#dc2626', fontSize: '10px', padding: '4px 8px', borderRadius: '12px', fontWeight: 'bold' }}>{ht.closed}</span>
                                                                    )}
                                                                </div>
                                                                
                                                                {shop.shop_logo ? (
                                                                    <img src={getOptimizedImage(shop.shop_logo)} alt={shop.business_name} crossOrigin="anonymous" referrerPolicy="no-referrer" style={styles.shopImage} />
                                                                ) : (
                                                                    <div style={{width: '100%', height: '120px', background: '#f1f5f9', borderRadius: '8px', marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                                                                        <Store size={30} color="#cbd5e1"/>
                                                                    </div>
                                                                )}

                                                                <p style={{ margin: '0 0 8px 0', color: '#2874f0', fontSize: '13px', fontWeight: 'bold' }}>{shop.category}</p>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#64748b' }}>
                                                                    {/* 🟢 DISTANCE TAG FIX APPLIED HERE */}
                                                                    <MapPin size={14} /> {getDistanceTag(shop.lat, shop.lng)}
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
    headerCatStrip: { background: '#ffffff', borderBottom: '1px solid #e2e8f0', width: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch' },

    adminBtn: { background: 'linear-gradient(135deg, #facc15, #f59e0b)', color: '#713f12', border: 'none', padding: '6px 14px', borderRadius: '20px', fontWeight: '900', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 4px 10px rgba(245, 158, 11, 0.4)' },
    loginHeaderBtn: { background: '#ffffff', color: '#2874f0', border: 'none', padding: '8px 16px', borderRadius: '20px', fontWeight: '900', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 4px 10px rgba(0, 0, 0, 0.15)' },
    
    searchBarWrapper: { position: 'relative', maxWidth: '800px', margin: '0 auto' },
    searchBar: { width: '100%', display: 'flex', position: 'relative', alignItems: 'center' },
    searchInput: { width: '100%', padding: '14px 45px 14px 15px', borderRadius: '12px', border: 'none', outline: 'none', fontSize: '15px', background: '#ffffff', fontWeight: '600', transition: '0.2s', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' },
    searchIcon: { position: 'absolute', right: '15px', cursor: 'pointer' },
    
    suggestionsBox: { position: 'absolute', top: '110%', left: 0, right: 0, background: 'white', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.15)', border: '1px solid #cbd5e1', zIndex: 150, overflow: 'hidden' },
    suggestionItem: { padding: '14px 15px', display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid #f1f5f9', cursor: 'pointer', transition: '0.2s', background: 'white' },

    // 🟢 MENU SPACING FIX: Prevents "Business" from hiding off-screen easily
    catContent: { display: 'flex', gap: '22px', padding: '14px 20px', width: 'max-content', margin: '0 auto' },
    catItem: { flexShrink: 0, fontSize: '14px', cursor: 'pointer', paddingBottom: '6px', transition: 'all 0.2s' },
    
    horizontalScrollContainer: { display: 'flex', overflowX: 'auto', gap: '16px', paddingBottom: '15px', WebkitOverflowScrolling: 'touch', scrollSnapType: 'x mandatory', width: '100%', padding: '5px' },
    desktopProductGrid: { display: 'flex', flexWrap: 'wrap', gap: '20px', justifyContent: 'flex-start' },
    mobileProductGrid: { display: 'flex', flexWrap: 'wrap', gap: '15px', justifyContent: 'flex-start' },

    shopCard: { width: '260px', flexShrink: 0, scrollSnapAlign: 'start', background: 'white', borderRadius: '16px', padding: '16px', border: '1px solid #e2e8f0', cursor: 'pointer', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' },
    shopImage: { width: '100%', height: '140px', objectFit: 'cover', borderRadius: '10px', marginBottom: '12px' },
    
    bottomNavContainer: { position: 'fixed', bottom: 0, left: 0, right: 0, background: '#ffffff', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 10px', paddingBottom: 'max(10px, env(safe-area-inset-bottom))', zIndex: 1000, boxShadow: '0 -4px 10px rgba(0,0,0,0.05)' },
    bottomNavBtn: { background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', color: '#64748b', fontSize: '10px', fontWeight: '600', cursor: 'pointer', flex: 1 },
    bottomNavBtnActive: { background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', color: '#2874f0', fontSize: '10px', fontWeight: '800', cursor: 'pointer', flex: 1 },
    vendorNavBtn: { background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', color: '#ef4444', fontSize: '10px', fontWeight: '700', cursor: 'pointer', flex: 1 },
    vendorNavBtnActive: { background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', color: '#dc2626', fontSize: '10px', fontWeight: '900', cursor: 'pointer', flex: 1 },
    bottomNavBadge: { position: 'absolute', top: '-4px', right: '-8px', background: '#ef4444', color: '#fff', fontSize: '9px', fontWeight: 'bold', padding: '2px 5px', borderRadius: '10px' }
};

export default Home;