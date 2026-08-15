import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { Search, User, X, MapPin, Package, Home as HomeIcon, Store, LayoutDashboard, ShieldCheck } from 'lucide-react'; 
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

const getFallbackImage = (category) => {
    const cat = (category || '').toLowerCase();
    if (cat.includes('veg')) return 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=500&q=80';
    if (cat.includes('grocer')) return 'https://images.unsplash.com/photo-1583258292688-d0213dc5a3a8?auto=format&fit=crop&w=500&q=80';
    if (cat.includes('cater') || cat.includes('food') || cat.includes('meal')) return 'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=500&q=80';
    if (cat.includes('ac ') || cat.includes('mechanic') || cat.includes('repair')) return 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=500&q=80';
    if (cat.includes('cloth') || cat.includes('men')) return 'https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&w=500&q=80';
    if (cat.includes('saree') || cat.includes('women')) return 'https://images.unsplash.com/photo-1610030469983-98e550d61dc0?auto=format&fit=crop&w=500&q=80';
    return 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=500&q=80'; 
};

const Home = () => {
    const { t, location: appLocation } = useContext(AppContext);
    const navigate = useNavigate();
    const currentRoute = useLocation().pathname;

    const CATEGORIES = [t('Promotions'), t('Trending'), t('Products'), t('Services'), t('Business')];

    const [products, setProducts] = useState([]);
    const [activeShops, setActiveShops] = useState([]); 
    const [adminCategories, setAdminCategories] = useState([]);
    const [selectedSubCategory, setSelectedSubCategory] = useState(null);

    const [loading, setLoading] = useState(true);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 1024); 
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState(t('Trending')); 

    const userStr = localStorage.getItem('user');
    const user = userStr && userStr !== 'undefined' ? JSON.parse(userStr) : null;
    
    // 🟢 SMART ROLE DETECTION
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

    const currentTabEnglish = selectedCategory === t('Services') ? 'Services' : (selectedCategory === t('Products') ? 'Products' : selectedCategory);

    return (
        <div style={styles.page}>
            
            {/* ========================================================= */}
            {/* 🟦 1. HEADER & SEARCH SECTION */}
            {/* ========================================================= */}
            <div style={styles.header}>
                <div style={isMobile ? styles.mobileHeaderContent : styles.desktopHeaderContent}>
                    
                    {/* PREMIUM BRANDING */}
                    <div style={{display: 'flex', alignItems: 'center', gap: '15px', cursor: 'pointer'}} onClick={() => {setSearchQuery(''); setSelectedCategory(t('Trending')); setSelectedSubCategory(null);}}>
                        <h1 style={{ margin: 0, display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
                            <span style={{ fontSize: '24px', fontWeight: '900', color: '#ffffff', letterSpacing: '1px', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>SUBHAMS</span>
                            <span style={{ fontSize: '11px', color: '#facc15', fontWeight: '900', letterSpacing: '3px', textTransform: 'uppercase' }}>HUB</span>
                        </h1>
                    </div>
                    
                    {/* UNIVERSAL SEARCH BAR */}
                    <div style={{ flex: 1, maxWidth: '600px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={styles.searchBar}>
                            <input 
                                type="text" 
                                placeholder={t("Search for products or shops...")} 
                                style={styles.searchInput} 
                                value={searchQuery}
                                onChange={(e) => { setSearchQuery(e.target.value); }}
                            />
                            <Search size={18} color="#2874f0" style={styles.searchIcon} />
                        </div>
                    </div>

                    {/* 🛡️ ADMIN BUTTON (ONLY VISIBLE TO YOU) */}
                    {isAdmin && (
                        <button onClick={() => navigate('/admin')} style={styles.adminBtn}>
                            <ShieldCheck size={18} />
                            {isMobile ? "" : "Admin"}
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
                            {cat === t('Trending') ? '🔥 ' : ''}{cat}
                        </span>
                    ))}
                </div>
            </div>

            {/* ========================================================= */}
            {/* 🟩 3. MAIN CONTENT (PRODUCTS & SHOPS) */}
            {/* ========================================================= */}
            <div style={{ maxWidth: '1000px', margin: '20px auto', padding: '0 15px', width: '100%', boxSizing: 'border-box' }}>
                
                {loading ? (
                    <div style={styles.loaderContainer}>
                        <div style={styles.spinner}></div>
                        <p style={{marginTop: '10px', color: '#64748b', fontWeight: 'bold'}}>Loading local market...</p>
                    </div>
                ) : (
                    <>
                        {searchQuery ? (
                            <div>
                                <h2 style={{ fontSize: '22px', marginBottom: '20px', color: '#1e293b' }}>Search Results for "{searchQuery}"</h2>
                                {filteredProducts.length > 0 && (
                                    <div style={isMobile ? styles.mobileProductGrid : styles.desktopProductGrid}>
                                        {filteredProducts.map(product => <ProductCard key={product.id} product={product} t={t} />)}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <>
                                {selectedCategory === t('Trending') && <TrendingSection vendors={activeShops} navigate={navigate} t={t} />}
                                {selectedCategory === t('Promotions') && <PromotionsSection />}

                                {/* 🏪 SHOPS LIST (TRENDING & PROMOTIONS) */}
                                {(selectedCategory === t('Promotions') || selectedCategory === t('Trending')) && (
                                    <div>
                                        <h2 style={{ fontSize: '22px', marginBottom: '20px', color: '#1e293b' }}>
                                            {selectedCategory === t('Trending') ? '🔥 Top Trending Shops' : `${selectedCategory} Near You`}
                                        </h2>
                                        
                                        <div style={isMobile ? styles.mobileProductGrid : styles.desktopProductGrid}>
                                            {activeShops
                                                .filter(shop => {
                                                    const dbType = shop.shop_type || 'Products'; 
                                                    if (selectedCategory === t('Promotions')) return dbType.includes('Promotions');
                                                    if (selectedCategory === t('Trending')) return dbType.includes('Trending');
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
                                                                <span style={{ background: '#dcfce7', color: '#16a34a', fontSize: '10px', padding: '4px 8px', borderRadius: '12px', fontWeight: 'bold' }}>Open</span>
                                                            ) : (
                                                                <span style={{ background: '#fef2f2', color: '#dc2626', fontSize: '10px', padding: '4px 8px', borderRadius: '12px', fontWeight: 'bold' }}>Closed</span>
                                                            )}
                                                        </div>
                                                        
                                                        {shop.shop_image && (
                                                            <img src={shop.shop_image} alt={shop.business_name} style={{width: '100%', height: '120px', objectFit: 'cover', borderRadius: '8px', marginBottom: '12px'}} />
                                                        )}

                                                        <p style={{ margin: '0 0 8px 0', color: '#2874f0', fontSize: '13px', fontWeight: 'bold' }}>{shop.category}</p>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#64748b' }}>
                                                            <MapPin size={14} /> {shop.address || 'Local Area'}
                                                        </div>
                                                    </div>
                                                ))}
                                        </div>
                                    </div>
                                )}

                                {/* 📁 DYNAMIC FOLDER VIEW FOR PRODUCTS & SERVICES */}
                                {(selectedCategory === t('Products') || selectedCategory === t('Services')) && (
                                    <div>
                                        {!selectedSubCategory ? (
                                            <>
                                                <h2 style={{ fontSize: '22px', marginBottom: '20px', color: '#1e293b' }}>
                                                    Browse {selectedCategory}
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
                                                {/* 📁 INNER FOLDER VIEW (SHOW SHOPS INSIDE THE FOLDER) */}
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
                                                    <button 
                                                        onClick={() => setSelectedSubCategory(null)} 
                                                        style={{ background: '#e2e8f0', border: 'none', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', color: '#475569', display: 'flex', alignItems: 'center', gap: '4px' }}
                                                    >
                                                        <X size={16} /> Back
                                                    </button>
                                                    <h2 style={{ fontSize: '22px', margin: 0, color: '#1e293b' }}>
                                                        {selectedSubCategory} Sellers
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
                                                                        <span style={{ background: '#dcfce7', color: '#16a34a', fontSize: '10px', padding: '4px 8px', borderRadius: '12px', fontWeight: 'bold' }}>Open</span>
                                                                    ) : (
                                                                        <span style={{ background: '#fef2f2', color: '#dc2626', fontSize: '10px', padding: '4px 8px', borderRadius: '12px', fontWeight: 'bold' }}>Closed</span>
                                                                    )}
                                                                </div>
                                                                
                                                                {shop.shop_image && (
                                                                    <img src={shop.shop_image} alt={shop.business_name} style={{width: '100%', height: '120px', objectFit: 'cover', borderRadius: '8px', marginBottom: '12px'}} />
                                                                )}

                                                                <p style={{ margin: '0 0 8px 0', color: '#2874f0', fontSize: '13px', fontWeight: 'bold' }}>{shop.category}</p>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#64748b' }}>
                                                                    <MapPin size={14} /> {shop.address || 'Local Area'}
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
            {/* 🟥 4. BOTTOM NAVIGATION BAR (VENDOR VS CUSTOMER LOGIC) */}
            {/* ========================================================= */}
            <div style={styles.bottomNavContainer}>
                <button onClick={() => navigate('/')} style={currentRoute === '/' ? styles.bottomNavBtnActive : styles.bottomNavBtn}>
                    <HomeIcon size={24} />
                    <span>Home</span>
                </button>

                {isVendor ? (
                    <>
                        <button onClick={() => navigate('/dashboard')} style={currentRoute === '/dashboard' ? styles.bottomNavBtnActive : styles.bottomNavBtn}>
                            <LayoutDashboard size={24} />
                            <span>Dashboard</span>
                        </button>

                        <button onClick={() => navigate('/vendor/orders')} style={currentRoute === '/vendor/orders' ? styles.vendorNavBtnActive : styles.vendorNavBtn}>
                            <Store size={24} />
                            <span>Shop Orders</span>
                        </button>
                    </>
                ) : (
                    <button onClick={() => navigate('/my-orders')} style={currentRoute === '/my-orders' ? styles.bottomNavBtnActive : styles.bottomNavBtn}>
                        <div style={{ position: 'relative' }}>
                            <Package size={24} />
                            {cartCount > 0 && <span style={styles.bottomNavBadge}>{cartCount}</span>}
                        </div>
                        <span>My Orders</span>
                    </button>
                )}

                <button onClick={() => navigate('/profile')} style={currentRoute === '/profile' ? styles.bottomNavBtnActive : styles.bottomNavBtn}>
                    <User size={24} />
                    <span>Profile</span>
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
    
    // Header
    header: { background: '#2874f0', padding: '15px 0', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 2px 10px rgba(0,0,0,0.15)' },
    desktopHeaderContent: { maxWidth: '1240px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', gap: '20px' },
    mobileHeaderContent: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 15px', gap: '15px' },
    
    // Admin Button
    adminBtn: { background: 'linear-gradient(135deg, #facc15, #f59e0b)', color: '#713f12', border: 'none', padding: '8px 16px', borderRadius: '20px', fontWeight: '900', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 4px 10px rgba(245, 158, 11, 0.4)', transition: 'transform 0.2s' },

    // Search
    searchBar: { width: '100%', display: 'flex', position: 'relative', alignItems: 'center' },
    searchInput: { width: '100%', padding: '12px 40px 12px 15px', borderRadius: '10px', border: 'none', outline: 'none', fontSize: '14px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', transition: 'all 0.2s', fontWeight: '500' },
    searchIcon: { position: 'absolute', right: '12px', cursor: 'pointer' },
    
    // Category Strip
    categoryStrip: { background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '12px 0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' },
    catContent: { maxWidth: '1240px', margin: '0 auto', display: 'flex', gap: '25px', padding: '0 20px', overflowX: 'auto', whiteSpace: 'nowrap', scrollbarWidth: 'none' },
    catItem: { fontSize: '15px', color: '#475569', cursor: 'pointer', paddingBottom: '8px', transition: 'all 0.2s' },
    
    // Grids
    desktopProductGrid: { display: 'flex', flexWrap: 'wrap', gap: '20px', justifyContent: 'flex-start' },
    mobileProductGrid: { display: 'flex', flexWrap: 'wrap', gap: '15px', justifyContent: 'flex-start' },
    
    // Loader
    loaderContainer: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 0' },
    spinner: { width: '40px', height: '40px', border: '4px solid #e2e8f0', borderTop: '4px solid #2874f0', borderRadius: '50%', animation: 'spin 1s linear infinite' },
    
    // Bottom Nav
    bottomNavContainer: { position: 'fixed', bottom: 0, left: 0, right: 0, background: '#ffffff', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-around', alignItems: 'center', padding: '10px 5px', paddingBottom: 'max(10px, env(safe-area-inset-bottom))', zIndex: 1000, boxShadow: '0 -4px 10px rgba(0,0,0,0.05)' },
    bottomNavBtn: { background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', color: '#64748b', fontSize: '10px', fontWeight: '600', cursor: 'pointer', flex: 1 },
    bottomNavBtnActive: { background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', color: '#2874f0', fontSize: '10px', fontWeight: '800', cursor: 'pointer', flex: 1 },
    vendorNavBtn: { background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', color: '#ef4444', fontSize: '10px', fontWeight: '700', cursor: 'pointer', flex: 1 },
    vendorNavBtnActive: { background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', color: '#dc2626', fontSize: '10px', fontWeight: '900', cursor: 'pointer', flex: 1 },
    bottomNavBadge: { position: 'absolute', top: '-4px', right: '-8px', background: '#ef4444', color: '#fff', fontSize: '9px', fontWeight: 'bold', padding: '2px 5px', borderRadius: '10px' }
};

export default Home;