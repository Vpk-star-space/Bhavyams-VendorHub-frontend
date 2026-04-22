import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { ShoppingCart, Search, User, Menu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { useCart } from '../context/CartContext'; 

// 🟢 Categories list
const CATEGORIES = ['All', 'Top Offers', 'Mobiles & Tablets', 'Electronics', 'TVs & Appliances', 'Fashion', 'Beauty'];

// 🚀 NEW FEATURE: Auto-Sliding Banner Component
const BannerSlider = () => {
    // Standard e-commerce placeholder banners (you can replace these URLs with your own later)
    const banners = [
        "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=1200&h=300&q=80",
        "https://images.unsplash.com/photo-1607082349566-187342175e2f?auto=format&fit=crop&w=1200&h=300&q=80",
        "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&h=300&q=80"
    ];
    const [current, setCurrent] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrent((prev) => (prev + 1) % banners.length);
        }, 3000); // Slides every 3 seconds
        return () => clearInterval(timer);
    }, [banners.length]);

    return (
        <div style={{ position: 'relative', width: '100%', maxWidth: '1240px', margin: '10px auto', height: '220px', overflow: 'hidden', borderRadius: '4px', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', transition: 'transform 0.5s ease-in-out', transform: `translateX(-${current * 100}%)`, height: '100%' }}>
                {banners.map((img, idx) => (
                    <img key={idx} src={img} alt={`Banner ${idx}`} style={{ minWidth: '100%', height: '100%', objectFit: 'cover' }} />
                ))}
            </div>
            {/* Sliding Dots */}
            <div style={{ position: 'absolute', bottom: '10px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '8px' }}>
                {banners.map((_, idx) => (
                    <div key={idx} style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: current === idx ? '#fff' : 'rgba(255,255,255,0.5)', transition: '0.3s' }} />
                ))}
            </div>
        </div>
    );
};

const Home = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');

    const navigate = useNavigate();
    
    const { cart } = useCart();
    const totalCartItems = cart ? cart.reduce((total, item) => total + (item.quantity || 1), 0) : 0;

    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    const user = userStr && userStr !== 'undefined' ? JSON.parse(userStr) : null;

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const res = await axios.get('https://bhavyams-vendorhub-backend.onrender.com/api/products/all');
                
                // 🟢 BULLETPROOF FETCHING: Catches data no matter how the backend sends it
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

    // 🟢 SUPER SAFE FILTERING LOGIC
    const filteredProducts = products.filter(product => {
        const safeSearch = searchQuery ? searchQuery.toLowerCase().trim() : '';
        const pName = (product.name || product.title || '').toLowerCase();
        const pBrand = (product.brand || '').toLowerCase();
        const pCategory = (product.category || '').toLowerCase();

        const matchesSearch = !safeSearch || 
                              pName.includes(safeSearch) || 
                              pBrand.includes(safeSearch) || 
                              pCategory.includes(safeSearch);

        // Smart Category Match (Fixes the issue if DB says "mobile" but button says "Mobiles & Tablets")
        const catButtonText = selectedCategory.toLowerCase();
        const matchesCategory = selectedCategory === 'All' || 
                                pCategory === catButtonText || 
                                catButtonText.includes(pCategory.split(' ')[0]) || 
                                pCategory.includes(catButtonText.split(' ')[0]);

        return matchesSearch && matchesCategory;
    });

    if (loading) {
        return (
            <div style={styles.loaderContainer}>
                <div style={styles.spinner}></div>
                <div style={styles.loaderText}>Loading Products...</div>
            </div>
        );
    }

    return (
        <div style={styles.page}>
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
                        // 🟢 FIXED LAPTOP MENU: Added flexShrink: 0 so it never hides!
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

            {/* 🚀 THE NEW SLIDER COMPONENT */}
            {!searchQuery && selectedCategory === 'All' && <BannerSlider />}

            {/* 📦 MAIN CONTENT */}
            <div style={styles.mainContainer}>
                <div style={styles.productSection}>
                    <div style={styles.sectionHeader}>
                        <h2 style={isMobile ? styles.mobileSectionTitle : styles.sectionTitle}>
                            {searchQuery 
                                ? `Searching for "${searchQuery}"` 
                                : (selectedCategory === 'All' ? 'All Products' : `Best of ${selectedCategory}`)}
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

            <footer style={styles.footer}>
                <p style={styles.footerText}>System Engineered by <strong>Venkata Pavan Kumar</strong></p>
                <p style={styles.footerContact}>
                    Contact: <a href="mailto:pavanvenkat63@gmail.com" style={styles.footerLink}>pavanvenkat63@gmail.com</a>
                </p>
                <p style={styles.footerContact}>
                    Check out our other app: <a href="https://subhams-vpk.vercel.app/" target="_blank" rel="noopener noreferrer" style={styles.footerLink}>Subhams </a>
                </p>
            </footer>
        </div>
    );
};

const styles = {
    page: { background: '#f1f3f6', minHeight: '100vh', fontFamily: 'Roboto, Arial, sans-serif', display: 'flex', flexDirection: 'column' },
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
    
    mainContainer: { maxWidth: '1240px', margin: '10px auto', padding: '0 10px', flex: 1, width: '100%', boxSizing: 'border-box' },
    productSection: { background: '#fff', padding: '15px', borderRadius: '4px', boxShadow: '0 1px 2px 0 rgba(0,0,0,.1)' },
    sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f0f0f0', paddingBottom: '15px', marginBottom: '15px' },
    sectionTitle: { margin: 0, fontSize: '22px', fontWeight: '500' },
    mobileSectionTitle: { margin: 0, fontSize: '18px', fontWeight: '500' },
    viewAllBtn: { background: '#2874f0', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '2px', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' },
    desktopProductGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '15px' },
    mobileProductGrid: { display: 'flex', flexDirection: 'column', gap: '15px' },
    emptyState: { padding: '40px', textAlign: 'center', color: '#212121', fontSize: '16px' },
    loaderContainer: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#f1f3f6' },
    spinner: { width: '40px', height: '40px', border: '4px solid #f3f3f3', borderTop: '4px solid #2874f0', borderRadius: '50%', animation: 'spin 1s linear infinite' },
    loaderText: { marginTop: '15px', fontWeight: 'bold', color: '#2874f0' },

    footer: { background: '#ffffff', padding: '25px 20px', textAlign: 'center', borderTop: '1px solid #e0e0e0', marginTop: '40px', boxShadow: '0 -1px 3px rgba(0,0,0,0.05)' },
    footerText: { margin: '0 0 8px 0', fontSize: '15px', color: '#212121' },
    footerContact: { margin: '0 0 8px 0', fontSize: '14px', color: '#64748b' },
    footerLink: { color: '#2874f0', textDecoration: 'none', fontWeight: 'bold' }
};

export default Home;