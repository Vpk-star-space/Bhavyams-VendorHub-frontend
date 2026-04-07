import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ProductCard from '../components/ProductCard'; 
import { Loader2, PackageX } from 'lucide-react';

const Home = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const res = await axios.get('https://bhavyams-vendorhub-backend.onrender.com/api/products');
                
                // 🔍 DEBUG LOG: Look at your browser console (F12) to see what the backend sends!
                console.log("Raw Backend Data:", res.data);

                // 🛡️ FLEXIBLE DATA SETTER
                // This checks if the products are directly in res.data OR inside res.data.products
                const fetchedProducts = Array.isArray(res.data) 
                    ? res.data 
                    : (res.data.products || res.data.data || []);
                
                setProducts(fetchedProducts);
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
                <Loader2 size={40} color="#2874f0" className="animate-spin" />
                <h3 style={styles.loaderText}>Loading Bhavyams Hub...</h3>
            </div>
        );
    }

    return (
        <div style={styles.page}>
            {/* 🌟 BANNER SECTION */}
            <div style={styles.banner}>
                <div style={styles.bannerContent}>
                    <h1 style={styles.bannerTitle}>Welcome to Bhavyams Hub</h1>
                    <p style={styles.bannerSub}>Top quality products directly from verified vendors.</p>
                </div>
            </div>

            {/* 🛍️ PRODUCT GRID SECTION */}
            <div style={styles.container}>
                <div style={styles.headerRow}>
                    <h2 style={styles.sectionHeading}>Featured Products</h2>
                    <span style={styles.countBadge}>{products.length} Items Found</span>
                </div>
                
                {products.length === 0 ? (
                    <div style={styles.emptyState}>
                        <PackageX size={64} color="#cbd5e1" />
                        <h3 style={{ marginTop: '15px', color: '#475569' }}>No products available.</h3>
                        <p style={{ color: '#878787', fontSize: '14px' }}>Check back soon for new inventory!</p>
                    </div>
                ) : (
                    <div style={styles.grid}>
                        {products.map(product => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

const styles = {
    page: { background: '#f1f3f6', minHeight: '100vh', fontFamily: 'Roboto, Arial, sans-serif', paddingBottom: '40px' },
    banner: { background: 'linear-gradient(90deg, #2874f0 0%, #0053c0 100%)', color: '#fff', padding: '40px 20px', textAlign: 'center', marginBottom: '20px' },
    bannerContent: { maxWidth: '1200px', margin: '0 auto' },
    bannerTitle: { margin: '0 0 10px 0', fontSize: '28px', fontWeight: 'bold' },
    bannerSub: { margin: 0, fontSize: '16px', opacity: 0.9 },
    container: { maxWidth: '1240px', margin: '0 auto', padding: '0 15px' },
    headerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '2px solid #e0e0e0', paddingBottom: '10px' },
    sectionHeading: { fontSize: '20px', fontWeight: 'bold', color: '#212121', margin: 0 },
    countBadge: { background: '#fff', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', color: '#2874f0', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' },
    loaderContainer: { display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '80vh', background: '#f1f3f6' },
    loaderText: { marginTop: '15px', color: '#2874f0', fontWeight: 'bold' },
    emptyState: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#fff', padding: '60px 20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }
};

export default Home;