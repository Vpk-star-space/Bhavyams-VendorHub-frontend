import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { ShoppingCart, Search, User, Menu } from 'lucide-react'; // 🚀 ADDED: Menu icon
import { useNavigate } from 'react-router-dom';
import ProductCard from '../components/ProductCard';

const Home = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const navigate = useNavigate();

    // 🚀 AUTH CHECK: See if user is logged in
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
                
                // Bulletproof data extraction
                if (res.data && Array.isArray(res.data.products)) {
                    setProducts(res.data.products);
                } else if (Array.isArray(res.data)) {
                    setProducts(res.data);
                } else {
                    setProducts([]);
                }
            } catch (err) {
                console.error("Error fetching products:", err);
                setProducts([]);
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
    }, []);

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
                    
                    {/* 🚀 FIX: Mobile Left Side (Menu Icon + Logo) */}
                    {isMobile ? (
                        <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                            <Menu size={24} color="#fff" onClick={() => navigate('/dashboard')} style={{cursor: 'pointer'}} />
                            <h1 style={styles.mobileLogoText} onClick={() => navigate('/')}>
                                Bhavyams <span style={styles.hubText}>Hub</span>
                            </h1>
                        </div>
                    ) : (
                        <h1 style={styles.logoText} onClick={() => navigate('/')}>
                            Bhavyams <span style={styles.hubText}>Hub</span>
                        </h1>
                    )}
                    
                    <div style={isMobile ? styles.mobileSearchBar : styles.searchBar}>
                        <input 
                            type="text" 
                            placeholder={isMobile ? "Search..." : "Search products, brands"} 
                            style={styles.searchInput} 
                        />
                        {isMobile && <Search size={18} color="#2874f0" style={{position: 'absolute', right: '8px'}} />}
                    </div>

                    <div style={isMobile ? styles.mobileNavActions : styles.navActions}>
                        {/* 🚀 FIX: REMOVED LOGOUT. Added Profile/Login Logic */}
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

                        <div style={styles.cartIcon} onClick={() => navigate('/cart')}>
                            <ShoppingCart size={isMobile ? 20 : 22} />
                            {!isMobile && <span style={styles.cartText}>Cart</span>}
                        </div>
                    </div>
                </div>
            </div>

            {/* ⚪ CATEGORY STRIP */}
            <div style={styles.categoryStrip}>
                <div style={styles.catContent}>
                    <span style={{...styles.catItem, borderBottom: '2px solid #2874f0', color: '#2874f0'}}>Top Offers</span>
                    <span style={styles.catItem}>Mobiles & Tablets</span>
                    <span style={styles.catItem}>Electronics</span>
                    <span style={styles.catItem}>TVs & Appliances</span>
                    <span style={styles.catItem}>Fashion</span>
                    <span style={styles.catItem}>Beauty</span>
                </div>
            </div>

            {/* 📦 MAIN CONTENT */}
            <div style={styles.mainContainer}>
                <div style={styles.productSection}>
                    <div style={styles.sectionHeader}>
                        <h2 style={isMobile ? styles.mobileSectionTitle : styles.sectionTitle}>Best of Electronics</h2>
                        <button style={styles.viewAllBtn}>VIEW ALL</button>
                    </div>

                    {products.length === 0 ? (
                        <div style={styles.emptyState}>No products available right now.</div>
                    ) : (
                        <div style={isMobile ? styles.mobileProductGrid : styles.desktopProductGrid}>
                            {products.map(product => (
                                <ProductCard key={product.id} product={product} />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const styles = {
    page: { background: '#f1f3f6', minHeight: '100vh', fontFamily: 'Roboto, Arial, sans-serif' },
    header: { background: '#2874f0', padding: '10px 0', position: 'sticky', top: 0, zIndex: 100 },
    desktopHeaderContent: { maxWidth: '1240px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', gap: '20px' },
    mobileHeaderContent: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 10px', gap: '10px' },
    logoText: { color: '#fff', fontSize: '20px', fontStyle: 'italic', fontWeight: 'bold', margin: 0, cursor: 'pointer', display: 'flex', flexDirection: 'column', lineHeight: '1' },
    mobileLogoText: { color: '#fff', fontSize: '16px', fontStyle: 'italic', fontWeight: 'bold', margin: 0, cursor: 'pointer', display: 'flex', flexDirection: 'column', lineHeight: '1' },
    hubText: { color: '#ffe500', fontSize: '11px', letterSpacing: '1px' },
    searchBar: { flex: 1, maxWidth: '500px', display: 'flex' },
    mobileSearchBar: { flex: 1, display: 'flex', position: 'relative', alignItems: 'center' },
    searchInput: { width: '100%', padding: '8px 12px', borderRadius: '2px', border: 'none', outline: 'none', fontSize: '14px', boxShadow: '0 2px 4px 0 rgba(0,0,0,.23)' },
    navActions: { display: 'flex', alignItems: 'center', gap: '30px' },
    mobileNavActions: { display: 'flex', alignItems: 'center', gap: '10px' },
    navBtn: { background: '#fff', color: '#2874f0', border: 'none', padding: '6px 20px', fontWeight: 'bold', fontSize: '14px', borderRadius: '2px', cursor: 'pointer' },
    mobileNavBtn: { background: '#fff', color: '#2874f0', border: 'none', padding: '4px 8px', fontWeight: 'bold', fontSize: '12px', borderRadius: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    cartIcon: { color: '#fff', display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' },
    cartText: { fontSize: '15px', fontWeight: 'bold' },
    categoryStrip: { background: '#fff', borderBottom: '1px solid #f0f0f0', padding: '10px 0', boxShadow: '0 1px 1px 0 rgba(0,0,0,.16)' },
    catContent: { maxWidth: '1240px', margin: '0 auto', display: 'flex', gap: '20px', padding: '0 15px', overflowX: 'auto', whiteSpace: 'nowrap', WebkitOverflowScrolling: 'touch' },
    catItem: { fontSize: '14px', fontWeight: '500', color: '#212121', cursor: 'pointer', paddingBottom: '8px' },
    mainContainer: { maxWidth: '1240px', margin: '10px auto', padding: '0 10px' },
    productSection: { background: '#fff', padding: '15px', borderRadius: '4px', boxShadow: '0 1px 2px 0 rgba(0,0,0,.1)' },
    sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f0f0f0', paddingBottom: '15px', marginBottom: '15px' },
    sectionTitle: { margin: 0, fontSize: '22px', fontWeight: '500' },
    mobileSectionTitle: { margin: 0, fontSize: '18px', fontWeight: '500' },
    viewAllBtn: { background: '#2874f0', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '2px', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' },
    desktopProductGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '15px' },
    mobileProductGrid: { display: 'flex', flexDirection: 'column', gap: '15px' },
    emptyState: { padding: '40px', textAlign: 'center', color: '#878787', fontSize: '16px' },
    loaderContainer: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#f1f3f6' },
    spinner: { width: '40px', height: '40px', border: '4px solid #f3f3f3', borderTop: '4px solid #2874f0', borderRadius: '50%', animation: 'spin 1s linear infinite' },
    loaderText: { marginTop: '15px', fontWeight: 'bold', color: '#2874f0' }
};

export default Home;