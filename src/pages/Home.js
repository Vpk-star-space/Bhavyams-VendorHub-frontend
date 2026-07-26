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
    const [regBusiness, setRegBusiness] = useState('vegetables');
    const [showDemoBanner, setShowDemoBanner] = useState(true);

    const [loadingMsgIndex, setLoadingMsgIndex] = useState(0);
    const loadingPhrases = [
        "Handpicking the best products for you...",
        "Unpacking the latest deals...",
        "Arranging the store shelves...",
        "Good things take a little time! Preparing Bhavyams Hub..."
    ];
    
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');

    const navigate = useNavigate();
    
    const { cart } = useCart();
    const totalCartItems = cart ? cart.reduce((total, item) => total + (item.quantity || 1), 0) : 0;

    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    const user = userStr && userStr !== 'undefined' ? JSON.parse(userStr) : null;

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
            // Prepare the data to send
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

            // Show success message
            alert(`Thanks ${regName}! We have recorded your interest. Our team will contact you at ${regPhone} very soon.`);
            
            // Clear the form
            setRegName('');
            setRegPhone('');
            setRegBusinessName('');
            setRegProducts('');
            setRegLocation('');
            setRegEmail('');
            
        } catch (error) {
            console.error("Registration error full details:", error);
            if (error.response) {
                console.error("Server responded with:", error.response.data);
                alert(`Error: ${error.response.data.message || "Failed to register"}`);
            } else if (error.request) {
                console.error("Network Error: Is the backend running?");
                alert("Network error: Make sure your backend is running and accessible!");
            } else {
                alert("Oops! Something went wrong. Please try again.");
            }
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
            {/* 🔴 DEMO WARNING BANNER (Top) */}
            {showDemoBanner && (
                <div style={styles.demoBanner}>
                    <div style={{ flex: 1, paddingRight: '20px' }}>
                        <strong>DEMO MODE:</strong> Products shown are for testing. You can place test orders, but <strong>no real money will be deducted</strong>. <br/>
                        <span style={{ fontSize: '13px', opacity: 0.9 }}>గమనిక: ఇక్కడ ఉన్నవి కేవలం టెస్టింగ్ కోసం మాత్రమే. ఎటువంటి డబ్బు కట్ అవ్వదు.</span>
                    </div>
                    <X size={20} style={{ cursor: 'pointer', flexShrink: 0 }} onClick={() => setShowDemoBanner(false)} />
                </div>
            )}

            {/* 🔵 BLUE HEADER */}
            <div style={styles.header}>
                <div style={isMobile ? styles.mobileHeaderContent : styles.desktopHeaderContent}>
                    
                    {isMobile ? (
                        <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                            <Menu size={24} color="#fff" onClick={() => navigate('/dashboard')} style={{cursor: 'pointer', flexShrink: 0}} />
                            <h1 style={styles.mobileLogoText} onClick={() => navigate('/')}>
                                Bhavyams <span style={styles.hubText}>Hub</span>
                            </h1>
                        </div>
                    ) : (
                        <div style={{display: 'flex', alignItems: 'center', gap: '15px', minWidth: '150px'}}>
                            <Menu size={28} color="#fff" onClick={() => navigate('/dashboard')} style={{cursor: 'pointer', flexShrink: 0}} />
                            <h1 style={styles.logoText} onClick={() => navigate('/')}>
                                Bhavyams <span style={styles.hubText}>Hub</span>
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

                {/* RIGHT SIDE: Liquid Glass Sidebar for Registration */}
                <div style={styles.sidebarArea}>
                    <div style={styles.glassContainer}>
                        <div style={styles.glassHeader}>
                            🚀 Bhavyams Local Market
                            <span style={styles.glassSubtext}>Launching Soon!</span>
                        </div>
                        
                        <div style={styles.glassBody}>
                          <p style={styles.regSub}>
                                <strong>Start Your Local Online Business!</strong><br />
                                Want to operate a business right from your own place? Whether you are selling products, using your skills to start a small business, or promoting your services to neighbors—register now!
                            </p>
                            <p style={{ ...styles.regSub, fontFamily: 'sans-serif', marginTop: '-10px', color: '#64748b' }}>
                                మీ స్వంత స్థలం నుండే ఆన్‌లైన్ బిజినెస్ ప్రారంభించాలనుకుంటున్నారా? మీరు వస్తువులను అమ్మాలన్నా, మీ నైపుణ్యాలతో (skills) చిన్న వ్యాపారం మొదలుపెట్టాలన్నా, లేదా మీ సర్వీసులను చుట్టుపక్కల వారికి ప్రమోట్ చేయాలన్నా ఇప్పుడే రిజిస్టర్ చేసుకోండి!
                            </p>
                            
                           <form onSubmit={handleRegisterSubmit} style={styles.formGrid}>
                                <input 
                                    type="text" 
                                    placeholder="Your Name" 
                                    style={styles.glassInput} 
                                    value={regName}
                                    onChange={(e) => setRegName(e.target.value)}
                                    required
                                />
                                <input 
                                    type="tel" 
                                    placeholder="Phone Number (WhatsApp)" 
                                    style={styles.glassInput} 
                                    value={regPhone}
                                    onChange={(e) => setRegPhone(e.target.value)}
                                    required
                                />
                                <input 
                                    type="text" 
                                    placeholder="Business Name" 
                                    style={styles.glassInput} 
                                    value={regBusinessName}
                                    onChange={(e) => setRegBusinessName(e.target.value)}
                                    required
                                />
                                <input 
                                    type="text" 
                                    placeholder="Products or Services (e.g. Vegetables, Catering)" 
                                    style={styles.glassInput} 
                                    value={regProducts}
                                    onChange={(e) => setRegProducts(e.target.value)}
                                    required
                                />
                                <input 
                                    type="text" 
                                    placeholder="Location" 
                                    style={styles.glassInput} 
                                    value={regLocation}
                                    onChange={(e) => setRegLocation(e.target.value)}
                                    required
                                />
                                <input 
                                    type="email" 
                                    placeholder="Email (Optional)" 
                                    style={styles.glassInput} 
                                    value={regEmail}
                                    onChange={(e) => setRegEmail(e.target.value)}
                                />
                                <button type="submit" style={styles.glassSubmitBtn}>Register Interest</button>
                            </form>
                        </div>
                    </div>
                </div>

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
    
    // NEW: Demo Banner at the top
    demoBanner: {
        backgroundColor: '#fff3cd',
        color: '#856404',
        padding: '10px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid #ffeeba',
        fontSize: '14px',
        zIndex: 101,
        position: 'relative'
    },

    header: { background: '#2874f0', padding: '10px 0', position: 'sticky', top: 0, zIndex: 100 },
    desktopHeaderContent: { maxWidth: '1240px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', gap: '20px' },
    mobileHeaderContent: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 10px', gap: '10px' },
    logoText: { color: '#fff', fontSize: '20px', fontStyle: 'italic', fontWeight: 'bold', margin: 0, cursor: 'pointer', display: 'flex', flexDirection: 'column', lineHeight: '1' },
    mobileLogoText: { color: '#fff', fontSize: '16px', fontStyle: 'italic', fontWeight: 'bold', margin: 0, cursor: 'pointer', display: 'flex', flexDirection: 'column', lineHeight: '1' },
    hubText: { color: '#ffe500', fontSize: '11px', letterSpacing: '1px' },
    
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

    /* 🌟 LIQUID GLASS SIDEBAR 🌟 */
    glassContainer: {
        background: 'rgba(255, 255, 255, 0.4)', // Very transparent white
        backdropFilter: 'blur(16px)', // Strong blur
        WebkitBackdropFilter: 'blur(16px)', 
        borderRadius: '16px',
        border: '1px solid rgba(255, 255, 255, 0.8)', // Sharp white border
        boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.15)', // Deep soft shadow
        overflow: 'hidden',
        position: 'sticky', // Makes it stick as user scrolls
        top: '80px'
    },
    glassHeader: {
        background: 'linear-gradient(135deg, rgba(40, 116, 240, 0.8) 0%, rgba(168, 85, 247, 0.8) 100%)',
        color: 'white',
        padding: '20px',
        fontSize: '18px',
        fontWeight: 'bold',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column'
    },
    glassSubtext: {
        fontSize: '12px',
        fontWeight: 'normal',
        opacity: 0.9,
        marginTop: '4px'
    },
    glassBody: {
        padding: '20px',
    },
    regSub: {
        margin: '0 0 20px 0',
        fontSize: '14px',
        color: '#475569',
        lineHeight: '1.5'
    },
    formGrid: {
        display: 'flex',
        flexDirection: 'column',
        gap: '15px'
    },
    glassInput: {
        padding: '12px 15px',
        borderRadius: '8px',
        border: '1px solid rgba(255, 255, 255, 0.5)',
        background: 'rgba(255, 255, 255, 0.7)',
        outline: 'none',
        fontSize: '14px',
        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)',
        transition: 'all 0.3s ease'
    },
    glassSelect: {
        padding: '12px 15px',
        borderRadius: '8px',
        border: '1px solid rgba(255, 255, 255, 0.5)',
        background: 'rgba(255, 255, 255, 0.7)',
        outline: 'none',
        fontSize: '14px',
        cursor: 'pointer',
        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)',
    },
    glassSubmitBtn: {
        padding: '14px',
        borderRadius: '8px',
        border: 'none',
        background: '#2874f0',
        color: 'white',
        fontWeight: 'bold',
        fontSize: '15px',
        cursor: 'pointer',
        boxShadow: '0 4px 15px rgba(40, 116, 240, 0.4)',
        marginTop: '10px'
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

// Add CSS animation for spinner
const styleSheet = document.createElement("style");
styleSheet.innerText = `
@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
`;
document.head.appendChild(styleSheet);

export default Home;