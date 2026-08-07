import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { ShoppingCart, Search, User, Menu, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { useCart } from '../context/CartContext'; 



// 🟢 Categories list
const CATEGORIES = ['All', 'Top Offers', 'Mobiles & Tablets', 'Electronics', 'TVs & Appliances', 'Fashion', 'Beauty'];

// 🚀 NEW FEATURE: Dynamic Product Auto-Slider
const ProductBannerSlider = ({ products, navigate }) => {
    const [current, setCurrent] = useState(0);

    const displayProducts = useMemo(() => {
        if (!products || products.length === 0) return [];
        return [...products].sort(() => 0.5 - Math.random()).slice(0, 5);
    }, [products]);

    useEffect(() => {
        if (displayProducts.length <= 1) return;
        const timer = setInterval(() => {
            setCurrent((prev) => (prev + 1) % displayProducts.length);
        }, 3000); 
        return () => clearInterval(timer);
    }, [displayProducts.length]);

    const getImageUrl = (prod) => {
        try {
            const prodString = JSON.stringify(prod);
            const imageMatch = prodString.match(/https?:\/\/[^"'\s}\\]+\.(?:jpg|jpeg|gif|png|webp)/i);
            if (imageMatch) return imageMatch[0];
            const anyLinkMatch = prodString.match(/https?:\/\/[^"'\s}\\]+/i);
            if (anyLinkMatch) return anyLinkMatch[0];
        } catch (error) {
            console.error("Scanner failed:", error);
        }
        return "https://placehold.co/400x400/f8fafc/2874f0?text=No+Image";
    };

    const getSafeId = (prod) => {
        return prod.id || prod._id || prod.productId || prod.product_id;
    };

    if (displayProducts.length === 0) return null;

    return (
        <div style={{ position: 'relative', width: '100%', height: '220px', overflow: 'hidden', borderRadius: '4px', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', transition: 'transform 0.5s ease-in-out', transform: `translateX(-${current * 100}%)`, height: '100%' }}>
                {displayProducts.map((prod, idx) => {
                    const prodId = getSafeId(prod); 
                    return (
                        <div key={idx} onClick={() => { if (prodId) navigate(`/product/${prodId}`); }} style={{ minWidth: '100%', height: '100%', display: 'flex', backgroundColor: '#fff', cursor: 'pointer' }}>
                            <div style={{ flex: 1, padding: '20px 30px', display: 'flex', flexDirection: 'column', justifyContent: 'center', background: 'linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%)' }}>
                                <p style={{ margin: '0 0 5px 0', color: '#878787', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase' }}>FEATURED PRODUCT</p>
                                <h3 style={{ margin: '0 0 10px 0', fontSize: '20px', color: '#212121', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{prod.name || prod.title}</h3>
                                <p style={{ margin: '0 0 15px 0', color: '#388e3c', fontWeight: 'bold', fontSize: '22px' }}>₹{prod.price}</p>
                                <div><span style={{ backgroundColor: '#2874f0', color: '#fff', padding: '8px 16px', borderRadius: '2px', fontSize: '13px', fontWeight: 'bold' }}>Shop Now</span></div>
                            </div>
                            <div style={{ flex: 1, padding: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' }}>
                                <img src={getImageUrl(prod)} alt={prod.name || prod.title || "Product"} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} onError={(e) => { e.target.src = "https://placehold.co/400x400/f8fafc/2874f0?text=Image+Error" }} />
                            </div>
                        </div>
                    );
                })}
            </div>
            <div style={{ position: 'absolute', bottom: '10px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '8px' }}>
                {displayProducts.map((_, idx) => (
                    <div key={idx} style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: current === idx ? '#2874f0' : '#c2c2c2', transition: '0.3s' }} />
                ))}
            </div>
        </div>
    );
};

const Home = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 1024); // Adjusted for sidebar layout
    
// Sidebar/Registration State
    const [regName, setRegName] = useState('');
    const [regPhone, setRegPhone] = useState('');
    const [regBusinessName, setRegBusinessName] = useState('');
    const [regProducts, setRegProducts] = useState('');
    const [regLocation, setRegLocation] = useState('');
    const [regEmail, setRegEmail] = useState('');

    const [showDemoBanner, setShowDemoBanner] = useState(true);

    const [loadingMsgIndex, setLoadingMsgIndex] = useState(0);
    const loadingPhrases = [
        "Handpicking the best products for you...",
        "Unpacking the latest deals...",
        "Arranging the store shelves...",
        "Good things take a little time! Preparing Subhams-Hub..."
    ];
    
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');

    const navigate = useNavigate();
    
    const { cart } = useCart();
    const totalCartItems = cart ? cart.reduce((total, item) => total + (item.quantity || 1), 0) : 0;

    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    const user = userStr && userStr !== 'undefined' ? JSON.parse(userStr) : null;
    // Popup State
    const [popupConfig, setPopupConfig] = useState({ show: false, type: '', title: '', message: '' });

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 1024);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        if (!loading) return;
        const interval = setInterval(() => {
            setLoadingMsgIndex((prevIndex) => 
                prevIndex + 1 < loadingPhrases.length ? prevIndex + 1 : prevIndex
            );
        }, 4000); 
        return () => clearInterval(interval);
    }, [loading, loadingPhrases.length]);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const res = await axios.get('https://bhavyams-vendorhub-backend.onrender.com/api/products/all');
                let fetchedData = [];
                if (Array.isArray(res.data)) fetchedData = res.data;
                else if (res.data && Array.isArray(res.data.products)) fetchedData = res.data.products;
                else if (res.data && Array.isArray(res.data.data)) fetchedData = res.data.data;
                setProducts(fetchedData);
            } catch (err) {
                console.error("Error fetching products:", err);
                setProducts([]);
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
    }, []);
const handleRegisterSubmit = async (e) => {
        e.preventDefault();
        
        try {
            const formData = {
                name: regName,
                phone: regPhone,
                businessName: regBusinessName,
                products: regProducts,
                location: regLocation,
                email: regEmail
            };

            // 🌐 LIVE RENDER URL
            await axios.post('https://bhavyams-vendorhub-backend.onrender.com/api/register-interest', formData);

            // Construct contact string (Handles case if email is empty)
            const contactMethod = regEmail ? `${regEmail} OR ${regPhone}` : regPhone;

            // Show Beautiful Success Message
            setPopupConfig({
                show: true,
                type: 'success',
                title: '🎉 Registration Successful!',
                message: `Thanks ${regName}! We have recorded your interest in ${regProducts}. Our team will contact you at ${contactMethod} very soon.`
            });
            
            // Clear the form
            setRegName('');
            setRegPhone('');
            setRegBusinessName('');
            setRegProducts('');
            setRegLocation('');
            setRegEmail('');
            
        } catch (error) {
            console.error("Registration error full details:", error);
            
            let errorMsg = "Oops! Something went wrong. Please try again.";
            if (error.response) {
                errorMsg = `Error: ${error.response.data.message || "Failed to register"}`;
            } else if (error.request) {
                errorMsg = "Network error: Make sure your backend is running and accessible!";
            }

            // Show Beautiful Error Message
            setPopupConfig({
                show: true,
                type: 'error',
                title: '❌ Registration Failed',
                message: errorMsg
            });
        }
    };

    const filteredProducts = products.filter(product => {
        const safeSearch = searchQuery ? searchQuery.toLowerCase().trim() : '';
        const pName = (product.name || product.title || '').toLowerCase();
        const pBrand = (product.brand || '').toLowerCase();
        const pCategory = (product.category || '').toLowerCase();

        const matchesSearch = !safeSearch || pName.includes(safeSearch) || pBrand.includes(safeSearch) || pCategory.includes(safeSearch);
        const catButtonText = selectedCategory.toLowerCase();
        const matchesCategory = selectedCategory === 'All' || pCategory === catButtonText || catButtonText.includes(pCategory.split(' ')[0]) || pCategory.includes(catButtonText.split(' ')[0]);

        return matchesSearch && matchesCategory;
    });

    if (loading) {
        return (
            <div style={styles.loaderContainer}>
                <div style={styles.spinner}></div>
                <div style={styles.loaderText}>{loadingPhrases[loadingMsgIndex]}</div>
            </div>
        );
    }

  return (
        <div style={styles.page}>
            {/* 🌟 PREMIUM DEMO WARNING BANNER */}
            {showDemoBanner && (
                <div style={styles.demoBanner}>
                    <div style={styles.demoIcon}>⚠️</div>
                    <div style={styles.demoTextContainer}>
                        <p style={styles.demoTitle}>DEMO MODE ACTIVE</p>
                        <p style={styles.demoDesc}>Products shown are for testing. <strong>No real money will be deducted.</strong></p>
                        <p style={styles.demoDescTel}>గమనిక: ఇక్కడ ఉన్నవి కేవలం టెస్టింగ్ కోసం మాత్రమే. ఎటువంటి డబ్బు కట్ అవ్వదు.</p>
                    </div>
                    <X size={22} style={styles.demoCloseBtn} onClick={() => setShowDemoBanner(false)} />
                </div>
            )}

            {/* 🔵 BLUE HEADER */}
            <div style={styles.header}>
                <div style={isMobile ? styles.mobileHeaderContent : styles.desktopHeaderContent}>
                    
                    {isMobile ? (
                        <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                            <Menu size={24} color="#fff" onClick={() => navigate('/dashboard')} style={{cursor: 'pointer', flexShrink: 0}} />
                          <h1 style={styles.mobileLogoText} onClick={() => navigate('/')}>
                                <span className="glowing-green-logo">Subhams</span>
                                <span style={styles.hubText}>Hub</span>
                            </h1>
                        </div>
                    ) : (
                        <div style={{display: 'flex', alignItems: 'center', gap: '15px', minWidth: '150px'}}>
                            <Menu size={28} color="#fff" onClick={() => navigate('/dashboard')} style={{cursor: 'pointer', flexShrink: 0}} />
                          <h1 style={styles.mobileLogoText} onClick={() => navigate('/')}>
                                <span className="glowing-green-logo">Subhams</span>
                                <span style={styles.hubText}>Hub</span>
                            </h1>
                        </div>
                    )}
                    
                    <div style={isMobile ? styles.mobileSearchBar : styles.searchBar}>
                        <input 
                            type="text" 
                            placeholder={isMobile ? "Search..." : "Search products, brands"} 
                            style={styles.searchInput} 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <Search size={18} color="#2874f0" style={styles.searchIcon} />
                    </div>

                    <div style={isMobile ? styles.mobileNavActions : styles.navActions}>
                        {token ? (
                            <button 
                                style={isMobile ? styles.mobileNavBtn : styles.navBtn} 
                                onClick={() => navigate(user?.role === 'vendor' ? '/dashboard' : '/profile')}
                            >
                                {isMobile ? <User size={16}/> : (user?.username || 'Profile')}
                            </button>
                        ) : (
                            <button style={isMobile ? styles.mobileNavBtn : styles.navBtn} onClick={() => navigate('/login')}>
                                Login
                            </button>
                        )}

                        <div style={styles.cartIconWrapper} onClick={() => navigate('/cart')}>
                            <div style={{ position: 'relative' }}>
                                <ShoppingCart size={isMobile ? 20 : 22} />
                                {totalCartItems > 0 && (
                                    <span style={styles.cartBadge}>{totalCartItems}</span>
                                )}
                            </div>
                            {!isMobile && <span style={styles.cartText}>Cart</span>}
                        </div>
                    </div>
                </div>
            </div>

            {/* ⚪ CATEGORY STRIP */}
            <div style={styles.categoryStrip}>
                <div style={styles.catContent}>
                    {CATEGORIES.map(cat => (
                        <span 
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            style={{
                                ...styles.catItem, 
                                ...(selectedCategory === cat ? { borderBottom: '2px solid #2874f0', color: '#2874f0' } : {})
                            }}
                        >
                            {cat}
                        </span>
                    ))}
                </div>
            </div>

            {/* 📦 CONTENT WRAPPER (Splits Main Content and Sidebar) */}
            <div style={styles.layoutWrapper}>
                
                {/* LEFT SIDE: Main App Content (Undisturbed) */}
                <div style={styles.mainContentArea}>
                    {!searchQuery && selectedCategory === 'All' && <ProductBannerSlider products={products} navigate={navigate} />}

                    <div style={styles.productSection}>
                        <div style={styles.sectionHeader}>
                            <h2 style={isMobile ? styles.mobileSectionTitle : styles.sectionTitle}>
                                {searchQuery 
                                    ? `Searching for "${searchQuery}"` 
                                    : (selectedCategory === 'All' ? 'Demo Products' : `Best of ${selectedCategory}`)}
                            </h2>
                            <button 
                                style={styles.viewAllBtn} 
                                onClick={() => { setSearchQuery(''); setSelectedCategory('All'); }}
                            >
                                VIEW ALL
                            </button>
                        </div>

                        {filteredProducts.length === 0 ? (
                            <div style={styles.emptyState}>
                                <h3>No products found!</h3>
                                <p style={{color: '#878787', fontSize: '14px'}}>Try clearing your search or category filter.</p>
                            </div>
                        ) : (
                            <div style={isMobile ? styles.mobileProductGrid : styles.desktopProductGrid}>
                                {filteredProducts.map(product => (
                                    <ProductCard key={product.id || product._id} product={product} />
                                ))}
                            </div>
                        )}
                    </div>
                </div>

          {/* 🌟 PREMIUM LIQUID GLASS SIDEBAR 🌟 */}
                <div style={styles.sidebarArea}>
                    <div style={styles.glassContainer}>
                        <div style={styles.glassHeader}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '22px' }}>🏪</span>
                                <span>Subhams-Hub</span>
                            </div>
                            <div style={styles.glassBadge}>
                                <span style={styles.pulseDot}></span>
                                Launching Soon
                            </div>
                        </div>
                        
                        <div style={styles.glassBody}>
                            <div style={styles.promoBox}>
                                <h3 style={styles.promoTitle}>✨ Start Your Online Business!</h3>
                                <p style={styles.promoTextEng}>
                                    Want to operate a business right from your own place? Whether you are selling products, using your skills, or promoting your services to neighbors—register now!
                                </p>
                                <div style={styles.promoDivider}></div>
                                <p style={styles.promoTextTel}>
                                    మీ స్వంత స్థలం నుండే ఆన్‌లైన్ బిజినెస్ ప్రారంభించాలనుకుంటున్నారా? మీరు వస్తువులను అమ్మాలన్నా, మీ నైపుణ్యాలతో (skills) చిన్న వ్యాపారం మొదలుపెట్టాలన్నా ఇప్పుడే రిజిస్టర్ చేసుకోండి!
                                </p>
                            </div>
                            
                            <form onSubmit={handleRegisterSubmit} style={styles.formGrid}>
                                <input 
                                    type="text" 
                                    placeholder="👤 Your Name" 
                                    style={styles.glassInput} 
                                    value={regName}
                                    onChange={(e) => setRegName(e.target.value)}
                                    required
                                />
                                <input 
                                    type="tel" 
                                    placeholder="📱 Phone Number (WhatsApp)" 
                                    style={styles.glassInput} 
                                    value={regPhone}
                                    onChange={(e) => setRegPhone(e.target.value)}
                                    required
                                />
                                <input 
                                    type="text" 
                                    placeholder="🏪 Business Name" 
                                    style={styles.glassInput} 
                                    value={regBusinessName}
                                    onChange={(e) => setRegBusinessName(e.target.value)}
                                    required
                                />
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                    <input 
                                        type="text" 
                                        placeholder="📦 Products or Services" 
                                        style={styles.glassInput} 
                                        value={regProducts}
                                        onChange={(e) => setRegProducts(e.target.value)}
                                        required
                                    />
                                    <span style={styles.inputHelperText}>
                                         Vegetables, Sarees / Home Foods, Electronics, Mechanics, Promotions etc.
                                    </span>
                                </div>
                                <input 
                                    type="text" 
                                    placeholder="📍 Location " 
                                    style={styles.glassInput} 
                                    value={regLocation}
                                    onChange={(e) => setRegLocation(e.target.value)}
                                    required
                                />
                                <input 
                                    type="email" 
                                    placeholder="✉️ Email (Optional)" 
                                    style={styles.glassInput} 
                                    value={regEmail}
                                    onChange={(e) => setRegEmail(e.target.value)}
                                />
                                <button type="submit" style={styles.glassSubmitBtn}>
                                    Register My Business 🚀
                                </button>
                            </form>
                        </div>
                    </div>
                </div>

{/* 🌟 BEAUTIFUL POPUP MODAL 🌟 */}
            {popupConfig.show && (
                <div style={styles.popupOverlay}>
                    <div style={styles.popupContent}>
                        <h2 style={{ 
                            marginTop: 0, 
                            color: popupConfig.type === 'success' ? '#16a34a' : '#dc2626',
                            fontSize: '22px'
                        }}>
                            {popupConfig.title}
                        </h2>
                        <p style={{ fontSize: '15px', color: '#475569', lineHeight: '1.6' }}>
                            {popupConfig.message}
                        </p>
                        <button 
                            onClick={() => setPopupConfig({ show: false, type: '', title: '', message: '' })} 
                            style={styles.closePopupBtn}
                        >
                            Okay, Got it!
                        </button>
                    </div>
                </div>
            )}
            </div>

          <footer style={styles.footer}>
                <p style={styles.footerText}>System Engineered by <strong>Venkata Pavan Kumar</strong></p>
                <p style={styles.footerContact}>
                    Contact: <a href="mailto:pavanvenkat63@gmail.com" style={styles.footerLink}>pavanvenkat63@gmail.com</a>
                </p>
                
                {/* Apps Side-by-Side Container */}
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', marginTop: '8px' }}>
                    <span style={{ fontSize: '14px', color: '#64748b' }}>Check out our other apps:</span>
                    <a href="https://pmms.subhamsnetworks.in/" target="_blank" rel="noopener noreferrer" style={styles.footerLink}>PMMS App</a>
                    <span style={{ color: '#cbd5e1', fontSize: '14px' }}>|</span>
                    <a href="https://agent.subhamsnetworks.in/" target="_blank" rel="noopener noreferrer" style={styles.footerLink}>Agent App</a>
                </div>
            </footer>
            {/* 🟢 ULTRA-PREMIUM ANIMATED FOOTER */}
            <div style={{ textAlign: 'center', marginTop: '10px', paddingBottom: '25px', position: 'relative' }}>
                <style>
                    {`
                    @keyframes premium-shine {
                        0% { background-position: -200% center; }
                        100% { background-position: 200% center; }
                    }
                    @keyframes float-sparkle {
                        0%, 100% { transform: translateY(0px) scale(0.8); opacity: 0.4; }
                        50% { transform: translateY(-4px) scale(1.2); opacity: 1; filter: drop-shadow(0 0 6px #fbbf24); }
                    }
                    @keyframes line-breathe {
                        0%, 100% { width: 30px; opacity: 0.3; }
                        50% { width: 60px; opacity: 0.8; box-shadow: 0 0 10px #3b82f6; }
                    }
                    .subhams-brand-text {
                        background: linear-gradient(90deg, #3b82f6, #a855f7, #ec4899, #3b82f6);
                        background-size: 200% auto;
                        color: transparent;
                        -webkit-background-clip: text;
                        background-clip: text;
                        animation: premium-shine 3.5s linear infinite;
                        font-weight: 900;
                        font-size: 14px;
                        letter-spacing: 2px;
                    }
                    `}
                </style>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <span style={{ animation: 'float-sparkle 2s ease-in-out infinite', fontSize: '13px' }}>✨</span>
                    <p style={{ fontSize: '10px', color: '#64748b', fontWeight: '800', margin: 0, letterSpacing: '1.5px' }}>
                        POWERED BY <span className="subhams-brand-text">SUBHAMS</span>
                    </p>
                    <span style={{ animation: 'float-sparkle 2s ease-in-out infinite 1s', fontSize: '13px' }}>✨</span>
                </div>
                <div style={{ height: '3px', background: 'linear-gradient(90deg, transparent, #3b82f6, #a855f7, transparent)', margin: '8px auto 0 auto', borderRadius: '10px', animation: 'line-breathe 3s ease-in-out infinite' }}></div>
            </div>
        </div>
    );
};

const styles = {
    page: { background: '#f1f3f6', minHeight: '100vh', fontFamily: 'Roboto, Arial, sans-serif', display: 'flex', flexDirection: 'column' },
    
 /* 🌟 PREMIUM DEMO BANNER STYLES 🌟 */
    demoBanner: {
        background: 'linear-gradient(90deg, #fffbeb 0%, #fef3c7 50%, #fffbeb 100%)', // Soft gold gradient
        padding: '12px 20px',
        display: 'flex',
        alignItems: 'center',
        borderBottom: '2px solid #fbbf24',
        boxShadow: '0 4px 15px rgba(245, 158, 11, 0.15)', // Amber glow
        zIndex: 101,
        position: 'relative'
    },
    demoIcon: {
        fontSize: '26px',
        marginRight: '15px',
        animation: 'pulse 2s infinite' // Reuses your existing pulse animation!
    },
    demoTextContainer: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: '4px'
    },
    demoTitle: {
        margin: 0,
        fontSize: '13px',
        fontWeight: '900',
        color: '#b45309', // Deep amber
        letterSpacing: '1px'
    },
    demoDesc: { margin: 0, fontSize: '14px', color: '#92400e' },
    demoDescTel: { margin: 0, fontSize: '12px', color: '#d97706', fontFamily: 'sans-serif' },
    demoCloseBtn: {
        cursor: 'pointer',
        flexShrink: 0,
        color: '#b45309',
        padding: '4px',
        background: 'rgba(217, 119, 6, 0.1)',
        borderRadius: '50%',
        transition: 'background 0.2s ease'
    },

    /* 🌟 LOGO STYLES 🌟 */
    header: { background: '#2874f0', padding: '10px 0', position: 'sticky', top: 0, zIndex: 100 },
    desktopHeaderContent: { maxWidth: '1240px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', gap: '20px' },
    mobileHeaderContent: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 10px', gap: '10px' },
    
    // We remove color from here because the CSS class handles the gold gradient!
    logoText: { margin: 0, cursor: 'pointer', display: 'flex', flexDirection: 'column', lineHeight: '1', fontSize: '26px' },
    mobileLogoText: { margin: 0, cursor: 'pointer', display: 'flex', flexDirection: 'column', lineHeight: '1', fontSize: '22px' },
    
    // Made 'Hub' clean white so the gold 'Subhams' pops even more
    hubText: { color: '#ffffff', fontSize: '11px', letterSpacing: '2px', fontWeight: 'bold', marginTop: '2px' },
    
    searchBar: { flex: 1, maxWidth: '500px', display: 'flex', position: 'relative', alignItems: 'center' },
    mobileSearchBar: { flex: 1, display: 'flex', position: 'relative', alignItems: 'center' },
    
    searchInput: { width: '100%', padding: '8px 35px 8px 12px', borderRadius: '2px', border: 'none', outline: 'none', fontSize: '14px', boxShadow: '0 2px 4px 0 rgba(0,0,0,.23)' },
    searchIcon: { position: 'absolute', right: '10px', cursor: 'pointer' },
    
    navActions: { display: 'flex', alignItems: 'center', gap: '30px' },
    mobileNavActions: { display: 'flex', alignItems: 'center', gap: '10px' },
    navBtn: { background: '#fff', color: '#2874f0', border: 'none', padding: '6px 20px', fontWeight: 'bold', fontSize: '14px', borderRadius: '2px', cursor: 'pointer', whiteSpace: 'nowrap' },
    mobileNavBtn: { background: '#fff', color: '#2874f0', border: 'none', padding: '4px 8px', fontWeight: 'bold', fontSize: '12px', borderRadius: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    
    cartIconWrapper: { color: '#fff', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', whiteSpace: 'nowrap' },
    cartBadge: { position: 'absolute', top: '-8px', right: '-10px', background: '#ff9f00', color: '#fff', fontSize: '10px', fontWeight: 'bold', padding: '2px 6px', borderRadius: '10px', border: '1px solid #2874f0' },
    cartText: { fontSize: '15px', fontWeight: 'bold' },
    
    categoryStrip: { background: '#fff', borderBottom: '1px solid #f0f0f0', padding: '10px 0', boxShadow: '0 1px 1px 0 rgba(0,0,0,.16)' },
    catContent: { maxWidth: '1240px', margin: '0 auto', display: 'flex', gap: '20px', padding: '0 15px', overflowX: 'auto', whiteSpace: 'nowrap', WebkitOverflowScrolling: 'touch' },
    catItem: { fontSize: '14px', fontWeight: '500', color: '#212121', cursor: 'pointer', paddingBottom: '8px', transition: '0.2s' },
    
    // NEW: Layout Wrapper for side-by-side content
    layoutWrapper: { 
        display: 'flex', 
        flexDirection: window.innerWidth < 1024 ? 'column' : 'row', 
        maxWidth: '1240px', 
        margin: '10px auto', 
        padding: '0 10px', 
        gap: '20px', 
        width: '100%', 
        boxSizing: 'border-box' 
    },
    
    // Left side (Main App)
    mainContentArea: {
        flex: '1 1 auto',
        minWidth: 0 // Prevents flexbox overflowing
    },

    // Right side (Sidebar)
    sidebarArea: {
        flex: '0 0 350px', // Fixed width for sidebar on desktop
        width: window.innerWidth < 1024 ? '100%' : '350px',
    },

 /* 🌟 ULTRA-PREMIUM LIQUID GLASS SIDEBAR 🌟 */
    glassContainer: {
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(255, 255, 255, 0.4) 100%)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)', 
        borderRadius: '24px', // Modern, rounded corners
        border: '1px solid rgba(255, 255, 255, 0.9)', // Sharp glossy edge
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.08), inset 0 2px 10px rgba(255, 255, 255, 0.5)', // Deep 3D shadow
        overflow: 'hidden',
        position: 'sticky',
        top: '80px'
    },
    glassHeader: {
        background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #8b5cf6 100%)', // Rich gradient
        color: 'white',
        padding: '24px 20px',
        fontSize: '20px',
        fontWeight: '900',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
    },
    glassBadge: {
        marginTop: '10px',
        background: 'rgba(255, 255, 255, 0.2)',
        padding: '4px 12px',
        borderRadius: '20px',
        fontSize: '12px',
        fontWeight: 'bold',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        border: '1px solid rgba(255, 255, 255, 0.3)'
    },
    pulseDot: {
        width: '8px',
        height: '8px',
        backgroundColor: '#4ade80', // Bright green
        borderRadius: '50%',
        boxShadow: '0 0 8px #4ade80',
        animation: 'pulse 1.5s infinite' // Requires CSS animation below
    },
    glassBody: {
        padding: '24px',
    },
    promoBox: {
        background: 'rgba(255, 255, 255, 0.6)',
        borderRadius: '16px',
        padding: '15px',
        marginBottom: '20px',
        border: '1px solid rgba(255, 255, 255, 0.8)',
        boxShadow: 'inset 0 2px 5px rgba(255, 255, 255, 0.5)'
    },
    promoTitle: {
        margin: '0 0 8px 0',
        fontSize: '16px',
        color: '#1e3a8a',
        fontWeight: '800'
    },
    promoTextEng: {
        margin: '0',
        fontSize: '13px',
        color: '#334155',
        lineHeight: '1.5'
    },
    promoDivider: {
        height: '1px',
        background: 'linear-gradient(90deg, transparent, rgba(0,0,0,0.1), transparent)',
        margin: '10px 0'
    },
    promoTextTel: {
        margin: '0',
        fontSize: '12px',
        color: '#475569',
        lineHeight: '1.5',
        fontFamily: 'sans-serif'
    },
    formGrid: {
        display: 'flex',
        flexDirection: 'column',
        gap: '14px'
    },
    glassInput: {
        padding: '14px 16px',
        borderRadius: '12px',
        border: '1px solid rgba(255, 255, 255, 0.8)',
        background: 'rgba(255, 255, 255, 0.6)',
        outline: 'none',
        fontSize: '14px',
        color: '#1e293b',
        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.03)',
        transition: 'all 0.3s ease'
    },
    inputHelperText: { 
        fontSize: '11px', 
        color: '#64748b', 
        paddingLeft: '6px', 
        fontStyle: 'italic',
        lineHeight: '1.4'
    },
    glassSubmitBtn: {
        padding: '16px',
        borderRadius: '12px',
        border: 'none',
        background: 'linear-gradient(90deg, #2874f0 0%, #8b5cf6 100%)', // Vibrant Call-to-action
        color: 'white',
        fontWeight: '900',
        fontSize: '16px',
        cursor: 'pointer',
        boxShadow: '0 8px 20px rgba(139, 92, 246, 0.4)', // Colored glowing shadow
        marginTop: '10px',
        textTransform: 'uppercase',
        letterSpacing: '0.5px'
    },
    /* 🌟 POPUP STYLES 🌟 */
    popupOverlay: {
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        backdropFilter: 'blur(4px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
    },
    popupContent: {
        background: '#ffffff',
        padding: '30px',
        borderRadius: '16px',
        maxWidth: '400px',
        width: '100%',
        textAlign: 'center',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        border: '1px solid rgba(255, 255, 255, 0.8)',
        animation: 'popIn 0.3s ease-out'
    },
    closePopupBtn: {
        marginTop: '20px',
        padding: '10px 24px',
        backgroundColor: '#2874f0',
        color: '#ffffff',
        border: 'none',
        borderRadius: '8px',
        fontSize: '15px',
        fontWeight: 'bold',
        cursor: 'pointer',
        boxShadow: '0 4px 6px rgba(40, 116, 240, 0.2)'
    },
    /* -------------------------------- */

    productSection: { background: '#fff', padding: '15px', borderRadius: '4px', boxShadow: '0 1px 2px 0 rgba(0,0,0,.1)', marginTop: '10px' },
    sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f0f0f0', paddingBottom: '15px', marginBottom: '15px' },
    sectionTitle: { margin: 0, fontSize: '22px', fontWeight: '500' },
    mobileSectionTitle: { margin: 0, fontSize: '18px', fontWeight: '500' },
    viewAllBtn: { background: '#2874f0', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '2px', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' },
    desktopProductGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '15px' },
    mobileProductGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' },
    emptyState: { padding: '40px', textAlign: 'center', color: '#212121', fontSize: '16px' },
    loaderContainer: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#f1f3f6', textAlign: 'center', padding: '0 20px' },
    spinner: { width: '40px', height: '40px', border: '4px solid #e0e0e0', borderTop: '4px solid #2874f0', borderRadius: '50%', animation: 'spin 1s linear infinite' },
    loaderText: { marginTop: '15px', fontWeight: 'bold', color: '#2874f0', fontSize: '16px', transition: 'opacity 0.5s ease' },

    footer: { background: '#ffffff', padding: '25px 20px', textAlign: 'center', borderTop: '1px solid #e0e0e0', marginTop: '40px', boxShadow: '0 -1px 3px rgba(0,0,0,0.05)' },
    footerText: { margin: '0 0 8px 0', fontSize: '15px', color: '#212121' },
    footerContact: { margin: '0 0 8px 0', fontSize: '14px', color: '#64748b' },
    footerLink: { color: '#2874f0', textDecoration: 'none', fontWeight: 'bold' }
};

// Add CSS animations
const styleSheet = document.createElement("style");
styleSheet.innerText = `
@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
@keyframes popIn { 0% { transform: scale(0.9); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
@keyframes pulse { 0% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(1.2); } 100% { opacity: 1; transform: scale(1); } }

/* 🌟 GREEN GLOWING LOGO CSS 🌟 */
@keyframes green-shine {
    0% { background-position: -200% center; }
    100% { background-position: 200% center; }
}
.glowing-green-logo {
    /* Vibrant green gradient: emerald and light green */
    background: linear-gradient(90deg, #4ade80, #22c55e, #86efac, #4ade80);
    background-size: 200% auto;
    color: transparent;
    -webkit-background-clip: text;
    background-clip: text;
    animation: green-shine 3.5s linear infinite;
    filter: drop-shadow(0 0 8px rgba(34, 197, 94, 0.5)); /* Green glowing shadow */
    font-weight: 900;
    font-style: italic;
}
`;
document.head.appendChild(styleSheet);

export default Home;