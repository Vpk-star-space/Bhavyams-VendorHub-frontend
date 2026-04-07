import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { ShoppingCart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ProductCard from '../components/ProductCard';

const Home = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const res = await axios.get('https://bhavyams-vendorhub-backend.onrender.com/api/products');
                
                // 🛡️ CRITICAL FIX: Safely parse the backend data
                let fetchedData = res.data;
                if (res.data && res.data.products) {
                    fetchedData = res.data.products;
                } else if (res.data && res.data.data) {
                    fetchedData = res.data.data;
                }
                
                // Ensure it is an array before setting
                setProducts(Array.isArray(fetchedData) ? fetchedData : []);
                
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
            {/* FLIPKART STYLE BLUE HEADER */}
            <div style={styles.header}>
                <div style={styles.headerContent}>
                    <h1 style={styles.logoText} onClick={() => navigate('/')}>Bhavyams <span style={styles.hubText}>Hub</span></h1>
                    <div style={styles.searchBar}>
                        <input type="text" placeholder="Search for products, brands and more" style={styles.searchInput} />
                    </div>
                    <div style={styles.navActions}>
                        <button style={styles.navBtn} onClick={() => navigate('/login')}>Login</button>
                        <div style={styles.cartIcon} onClick={() => navigate('/cart')}>
                            <ShoppingCart size={22} />
                            <span style={styles.cartText}>Cart</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* WHITE CATEGORY STRIP */}
            <div style={styles.categoryStrip}>
                <div style={styles.catContent}>
                    <span style={styles.catItem}>Top Offers</span>
                    <span style={styles.catItem}>Mobiles & Tablets</span>
                    <span style={styles.catItem}>Electronics</span>
                    <span style={styles.catItem}>TVs & Appliances</span>
                    <span style={styles.catItem}>Fashion</span>
                    <span style={styles.catItem}>Beauty</span>
                </div>
            </div>

            {/* MAIN CONTENT AREA */}
            <div style={styles.mainContainer}>
                <div style={styles.productSection}>
                    <div style={styles.sectionHeader}>
                        <h2 style={styles.sectionTitle}>Best of Electronics</h2>
                        <button style={styles.viewAllBtn}>VIEW ALL</button>
                    </div>

                    {products.length === 0 ? (
                        <div style={styles.emptyState}>No products available.</div>
                    ) : (
                        <div style={styles.productGrid}>
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
    
    // Header Styles
    header: { background: '#2874f0', padding: '12px 0', position: 'sticky', top: 0, zIndex: 100 },
    headerContent: { maxWidth: '1240px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', gap: '20px' },
    logoText: { color: '#fff', fontSize: '20px', fontStyle: 'italic', fontWeight: 'bold', margin: 0, cursor: 'pointer', display: 'flex', flexDirection: 'column', lineHeight: '1' },
    hubText: { color: '#ffe500', fontSize: '12px', letterSpacing: '1px' },
    
    // Search Bar
    searchBar: { flex: 1, maxWidth: '500px', display: 'flex' },
    searchInput: { width: '100%', padding: '10px 15px', borderRadius: '2px', border: 'none', outline: 'none', fontSize: '14px', boxShadow: '0 2px 4px 0 rgba(0,0,0,.23)' },
    
    // Nav Actions
    navActions: { display: 'flex', alignItems: 'center', gap: '30px' },
    navBtn: { background: '#fff', color: '#2874f0', border: 'none', padding: '5px 40px', fontWeight: 'bold', fontSize: '15px', borderRadius: '2px', cursor: 'pointer' },
    cartIcon: { color: '#fff', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 'bold' },
    cartText: { fontSize: '15px' },

    // Category Strip
    categoryStrip: { background: '#fff', borderBottom: '1px solid #f0f0f0', padding: '10px 0', boxShadow: '0 1px 1px 0 rgba(0,0,0,.16)' },
    catContent: { maxWidth: '1240px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', padding: '0 20px', overflowX: 'auto', whiteSpace: 'nowrap' },
    catItem: { fontSize: '14px', fontWeight: '500', color: '#212121', cursor: 'pointer', margin: '0 15px' },

    // Main Content
    mainContainer: { maxWidth: '1240px', margin: '15px auto', padding: '0 10px' },
    productSection: { background: '#fff', padding: '15px', borderRadius: '2px', boxShadow: '0 2px 4px 0 rgba(0,0,0,.08)' },
    sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f0f0f0', paddingBottom: '15px', marginBottom: '15px' },
    sectionTitle: { margin: 0, fontSize: '22px', fontWeight: '500' },
    viewAllBtn: { background: '#2874f0', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '2px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 2px 4px 0 rgba(0,0,0,.2)' },

    // Grid
    productGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '15px' },
    
    // States
    emptyState: { padding: '40px', textAlign: 'center', color: '#878787', fontSize: '16px' },
    loaderContainer: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#f1f3f6' },
    spinner: { width: '40px', height: '40px', border: '4px solid #f3f3f3', borderTop: '4px solid #2874f0', borderRadius: '50%', animation: 'spin 1s linear infinite' },
    loaderText: { marginTop: '15px', fontWeight: 'bold', color: '#2874f0' }
};

export default Home;