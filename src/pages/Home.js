import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { ShoppingCart, Search, User, X, MapPin, Globe, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { useCart } from '../context/CartContext'; 
import { AppContext } from '../context/AppContext'; 

import TrendingSection from '../components/TrendingSection';
import PromotionsSection from '../components/PromotionsSection';

// 🟢 SMART ICON GENERATOR: Adds visuals based on category
const getCategoryIcon = (category) => {
    const cat = (category || '').toLowerCase();
    if (cat.includes('cater') || cat.includes('food') || cat.includes('meal')) return '🍃'; 
    if (cat.includes('mechanic') || cat.includes('repair') || cat.includes('ac')) return '🔧';
    if (cat.includes('cloth') || cat.includes('saree') || cat.includes('tailor')) return '👗';
    if (cat.includes('grocer') || cat.includes('veg') || cat.includes('fruit')) return '🛒';
    if (cat.includes('beauty') || cat.includes('makeup') || cat.includes('salon')) return '✨';
    if (cat.includes('plumb')) return '🚰';
    if (cat.includes('electric')) return '⚡';
    return '🏪'; 
};

const Home = () => {
    const { language, setLanguage, t, location } = useContext(AppContext);

    const CATEGORIES = [t('Promotions'), t('Trending'), t('Products'), t('Services'), t('Business')];

    const [products, setProducts] = useState([]);
    const [activeShops, setActiveShops] = useState([]); 
    const [loading, setLoading] = useState(true);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 1024); 
    
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState(t('Trending')); 
    const [showSettings, setShowSettings] = useState(false);

    const userStr = localStorage.getItem('user');
    const user = userStr && userStr !== 'undefined' ? JSON.parse(userStr) : null;
    
    const [settingsData, setSettingsData] = useState({ 
        name: user?.username || '', phone: user?.phone || '', address: user?.address || '', pincode: '', area: ''
    });

    const navigate = useNavigate();
    const { cart } = useCart();
    const totalCartItems = cart ? cart.reduce((total, item) => total + (item.quantity || 1), 0) : 0;
    const [popupConfig, setPopupConfig] = useState({ show: false, type: '', title: '', message: '' });

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 1024);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const fetchLocalFeed = async () => {
            try {
                const lat = location?.lat || 0;
                const lng = location?.lng || 0;
                const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000/api';
                
                const res = await axios.get(`${BACKEND_URL}/products/feed?lat=${lat}&lng=${lng}`);
                const fetchedProducts = res.data.products || [];
                setProducts(fetchedProducts);

                const shopRes = await axios.get(`${BACKEND_URL}/shops/active/all`);
                setActiveShops(shopRes.data.shops || []);

            } catch (err) {
                console.error("Error fetching data:", err);
            } finally {
                setLoading(false);
            }
        };
        if (location.lat !== null || location.error !== null) fetchLocalFeed();
    }, [location]);

    const handleCategoryClick = (cat) => {
        if (cat === t('Business')) {
            navigate('/register-business');
            return;
        }
        setSelectedCategory(cat);
        setSearchQuery('');
    };

    const handleSettingsSave = async () => {
        try {
            const token = localStorage.getItem('token'); 
            const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000/api';
            const fullPreciseAddress = settingsData.pincode ? `${settingsData.address}, ${settingsData.area}, Pincode: ${settingsData.pincode}` : settingsData.address;

            const res = await axios.put(`${BACKEND_URL}/auth/update-profile`, {
                username: settingsData.name,
                phone: settingsData.phone,
                address: fullPreciseAddress
            }, {
                headers: { Authorization: `Bearer ${token}` } 
            });

            localStorage.setItem('user', JSON.stringify(res.data.user));
            setShowSettings(false);
            setPopupConfig({ show: true, type: 'success', title: '✅ Details Updated!', message: "Your profile and exact location are saved." });
        } catch (err) {
            alert("Failed to save settings. Please ensure you are logged in.");
        }
    };

    const filteredProducts = products.filter(product => {
        const safeSearch = searchQuery ? searchQuery.toLowerCase().trim() : '';
        const pName = (product.name || product.title || '').toLowerCase();
        const pCategory = (product.category || '').toLowerCase();
        return !safeSearch || pName.includes(safeSearch) || pCategory.includes(safeSearch);
    });

    if (loading) {
        return (
            <div style={styles.loaderContainer}>
                <div style={styles.spinner}></div>
            </div>
        );
    }

    return (
        <div style={styles.page}>
            {/* 🔵 BLUE HEADER */}
            <div style={styles.header}>
                <div style={isMobile ? styles.mobileHeaderContent : styles.desktopHeaderContent}>
                    <div style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
                        <h1 style={styles.mobileLogoText} onClick={() => {setSearchQuery(''); setSelectedCategory(t('Trending'));}}>
                            <span className="glowing-green-logo">Subhams</span>
                            <span style={styles.hubText}>Hub</span>
                        </h1>
                    </div>
                    
                    <div style={{ flex: 1, maxWidth: '500px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
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
                        <div style={{display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#e0e7ff', marginLeft: '4px'}}>
                            <MapPin size={12} color={location?.error ? '#ef4444' : '#4ade80'} />
                            <span>{settingsData.area ? `${t("Searching in:")} ${settingsData.area}` : (location?.error ? t("Location Error - Update Settings") : t("Showing Local Area"))}</span>
                        </div>
                    </div>

                    <div style={styles.navActions}>
                        {((user?.role && user.role.toLowerCase() === 'admin') || user?.email === 'pavanvenkat63@gmail.com') && (
                            <button onClick={() => navigate('/admin')} style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '8px', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', boxShadow: '0 2px 5px rgba(0,0,0,0.2)' }}>
                                🛡️ Admin
                            </button>
                        )}
                        <button onClick={() => setShowSettings(true)} style={{background: 'transparent', border: 'none', cursor: 'pointer', color: 'white'}}>
                            <Settings size={22} />
                        </button>
                        <div style={styles.cartIconWrapper} onClick={() => navigate('/cart')}>
                            <div style={{ position: 'relative' }}>
                                <ShoppingCart size={22} />
                                {totalCartItems > 0 && <span style={styles.cartBadge}>{totalCartItems}</span>}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ⚪ CATEGORY STRIP */}
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

            {/* 📦 MAIN CONTENT AREA */}
            <div style={{ maxWidth: '1000px', margin: '20px auto', padding: '0 15px', width: '100%', boxSizing: 'border-box' }}>
                
                {/* GLOBAL SEARCH OVERRIDE */}
                {searchQuery ? (
                    <div>
                        <h2 style={{ fontSize: '22px', marginBottom: '20px', color: '#1e293b' }}>Search Results for "{searchQuery}"</h2>
                        {filteredProducts.length === 0 ? (
                            <div style={styles.emptyBox}>No items found matching your search.</div>
                        ) : (
                            <div style={isMobile ? styles.mobileProductGrid : styles.desktopProductGrid}>
                                {filteredProducts.map(product => <ProductCard key={product.id} product={product} t={t} />)}
                            </div>
                        )}
                    </div>
                ) : (
                    <>
                        {selectedCategory === t('Trending') && <TrendingSection vendors={[]} navigate={navigate} t={t} />}
                        {selectedCategory === t('Promotions') && <PromotionsSection />}

                        {/* 🟢 SMART DYNAMIC TAB RENDERING FOR SHOPS */}
                        {(selectedCategory === t('Products') || selectedCategory === t('Services') || selectedCategory === t('Promotions') || selectedCategory === t('Trending')) && (
                            <div>
                                <h2 style={{ fontSize: '22px', marginBottom: '20px', color: '#1e293b' }}>
                                    {selectedCategory === t('Trending') ? '🔥 Top Trending Shops' : `${selectedCategory} Near You`}
                                </h2>
                                
                                <div style={isMobile ? styles.mobileProductGrid : styles.desktopProductGrid}>
                                    {activeShops
                                        .filter(shop => {
                                            const dbType = shop.shop_type || 'Products'; 
                                            if (selectedCategory === t('Products')) return dbType.includes('Products');
                                            if (selectedCategory === t('Services')) return dbType.includes('Services');
                                            if (selectedCategory === t('Promotions')) return dbType.includes('Promotions');
                                            if (selectedCategory === t('Trending')) return dbType.includes('Trending');
                                            return false;
                                        })
                                        .map(shop => (
                                            <div 
                                                key={shop.id} 
                                                onClick={() => navigate(`/shop/${shop.id}`)}
                                                style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2e8f0', cursor: 'pointer', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}
                                            >
                                                <div style={{ position: 'relative', height: '140px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    
                                                    {/* SMART AVATAR LOGIC: Prioritize Custom Image, fallback to Smart Emoji */}
                                                    {shop.id_front_url ? (
                                                        <img src={shop.id_front_url} alt={shop.business_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    ) : (
                                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                                                            <span style={{ fontSize: '48px', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}>
                                                                {getCategoryIcon(shop.category)}
                                                            </span>
                                                        </div>
                                                    )}

                                                    {shop.is_online ? (
                                                        <span style={{ position: 'absolute', top: '10px', right: '10px', background: '#22c55e', color: 'white', fontSize: '10px', padding: '4px 8px', borderRadius: '12px', fontWeight: 'bold' }}>Open</span>
                                                    ) : (
                                                        <span style={{ position: 'absolute', top: '10px', right: '10px', background: '#ef4444', color: 'white', fontSize: '10px', padding: '4px 8px', borderRadius: '12px', fontWeight: 'bold' }}>Closed</span>
                                                    )}
                                                </div>
                                                <div style={{ padding: '15px' }}>
                                                    <h4 style={{ margin: '0 0 4px 0', color: '#0f172a', fontSize: '15px' }}>{shop.business_name}</h4>
                                                    <p style={{ margin: '0 0 8px 0', color: '#64748b', fontSize: '12px', fontWeight: 'bold' }}>{shop.category}</p>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#94a3b8' }}>
                                                        <MapPin size={12} /> {shop.address || 'Local Area'}
                                                    </div>
                                                </div>
                                            </div>
                                    ))}
                                    
                                    {/* Empty State */}
                                    {activeShops.filter(shop => {
                                        const dbType = shop.shop_type || 'Products';
                                        if (selectedCategory === t('Products')) return dbType.includes('Products');
                                        if (selectedCategory === t('Services')) return dbType.includes('Services');
                                        if (selectedCategory === t('Promotions')) return dbType.includes('Promotions');
                                        if (selectedCategory === t('Trending')) return dbType.includes('Trending');
                                        return false;
                                    }).length === 0 && (
                                        <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', background: 'white', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
                                            <h3 style={{color: '#64748b', margin: 0}}>No {selectedCategory} found in your area yet!</h3>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* SETTINGS MODAL */}
            {showSettings && (
                <div style={styles.popupOverlay}>
                    <div style={{...styles.popupContent, textAlign: 'left', maxWidth: '450px'}}>
                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
                            <h2 style={{ margin: 0, color: '#1e293b' }}>{t("App Settings")}</h2>
                            <X size={24} color="#64748b" style={{cursor: 'pointer'}} onClick={() => setShowSettings(false)} />
                        </div>
                        <label style={styles.modalLabel}><Globe size={16}/> {t("App Language")}</label>
                        <select value={language} onChange={(e) => setLanguage(e.target.value)} style={{...styles.glassInput, marginBottom: '20px'}}>
                            <option value="en">English</option>
                            <option value="te">తెలుగు (Telugu)</option>
                        </select>
                        <label style={styles.modalLabel}><User size={16}/> {t("Your Name")}</label>
                        <input type="text" style={{...styles.glassInput, marginBottom: '20px'}} value={settingsData.name} onChange={e => setSettingsData({...settingsData, name: e.target.value})} />
                        <label style={styles.modalLabel}><MapPin size={16}/> {t("Change Location (Area/City)")}</label>
                        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                            <input type="text" placeholder="Pincode" style={{...styles.glassInput, flex: 1}} value={settingsData.pincode} onChange={e => setSettingsData({...settingsData, pincode: e.target.value})} />
                            <input type="text" placeholder="Area" style={{...styles.glassInput, flex: 2}} value={settingsData.area} onChange={e => setSettingsData({...settingsData, area: e.target.value})} />
                        </div>
                        <label style={styles.modalLabel}>{t("Phone & Full Address")}</label>
                        <input type="tel" style={{...styles.glassInput, marginBottom: '10px'}} value={settingsData.phone} onChange={e => setSettingsData({...settingsData, phone: e.target.value})} />
                        <textarea style={{...styles.glassInput, height: '60px', resize: 'none'}} value={settingsData.address} onChange={e => setSettingsData({...settingsData, address: e.target.value})} />
                        <button onClick={handleSettingsSave} style={{...styles.glassSubmitBtn, width: '100%', marginTop: '20px'}}>{t("Save Settings")}</button>
                    </div>
                </div>
            )}
            {popupConfig.show && (
                <div style={styles.popupOverlay}>
                    <div style={{...styles.popupContent, textAlign: 'center'}}>
                        <h2 style={{ marginTop: 0, color: popupConfig.type === 'success' ? '#16a34a' : '#dc2626', fontSize: '22px' }}>{popupConfig.title}</h2>
                        <p style={{ fontSize: '15px', color: '#475569', lineHeight: '1.6' }}>{popupConfig.message}</p>
                        <button onClick={() => setPopupConfig({ show: false, type: '', title: '', message: '' })} style={{...styles.glassSubmitBtn, width: '100%'}}>Okay</button>
                    </div>
                </div>
            )}
        </div>
    );
};

const styles = {
    page: { background: '#f8fafc', minHeight: '100vh', fontFamily: 'Inter, sans-serif' },
    header: { background: '#2874f0', padding: '12px 0', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 2px 10px rgba(0,0,0,0.1)' },
    desktopHeaderContent: { maxWidth: '1240px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', gap: '20px' },
    mobileHeaderContent: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 15px', gap: '10px' },
    mobileLogoText: { margin: 0, cursor: 'pointer', display: 'flex', flexDirection: 'column', lineHeight: '1', fontSize: '24px' },
    hubText: { color: '#ffffff', fontSize: '11px', letterSpacing: '2px', fontWeight: 'bold', marginTop: '2px' },
    searchBar: { width: '100%', display: 'flex', position: 'relative', alignItems: 'center' },
    searchInput: { width: '100%', padding: '10px 40px 10px 15px', borderRadius: '8px', border: 'none', outline: 'none', fontSize: '14px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' },
    searchIcon: { position: 'absolute', right: '12px', cursor: 'pointer' },
    navActions: { display: 'flex', alignItems: 'center', gap: '15px' },
    cartIconWrapper: { color: '#fff', cursor: 'pointer' },
    cartBadge: { position: 'absolute', top: '-6px', right: '-8px', background: '#f59e0b', color: '#fff', fontSize: '10px', fontWeight: 'bold', padding: '2px 6px', borderRadius: '10px' },
    categoryStrip: { background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '12px 0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' },
    catContent: { maxWidth: '1240px', margin: '0 auto', display: 'flex', gap: '25px', padding: '0 20px', overflowX: 'auto', whiteSpace: 'nowrap', scrollbarWidth: 'none' },
    catItem: { fontSize: '15px', color: '#475569', cursor: 'pointer', paddingBottom: '8px', transition: 'all 0.2s' },
    desktopProductGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px' },
    mobileProductGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' },
    loaderContainer: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#f8fafc' },
    spinner: { width: '45px', height: '45px', border: '4px solid #e2e8f0', borderTop: '4px solid #2874f0', borderRadius: '50%', animation: 'spin 1s linear infinite' },
    emptyBox: { textAlign: 'center', padding: '40px', background: 'white', borderRadius: '12px', color: '#64748b' },
    popupOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' },
    popupContent: { background: '#ffffff', padding: '30px', borderRadius: '20px', width: '100%', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', maxHeight: '90vh', overflowY: 'auto' },
    modalLabel: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 'bold', color: '#475569', marginBottom: '8px' },
    glassInput: { width: '100%', padding: '14px 16px', borderRadius: '12px', border: '1px solid #cbd5e1', background: '#f8fafc', outline: 'none', fontSize: '15px', color: '#1e293b', boxSizing: 'border-box' },
    glassSubmitBtn: { padding: '16px', borderRadius: '12px', border: 'none', background: '#2874f0', color: 'white', fontWeight: '900', fontSize: '16px', cursor: 'pointer', boxShadow: '0 4px 10px rgba(40,116,240,0.3)' }
};

export default Home;