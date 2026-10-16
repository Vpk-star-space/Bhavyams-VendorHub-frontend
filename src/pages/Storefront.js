import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Star, ShoppingCart, Zap } from 'lucide-react'; 
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const getBackendUrl = () => {
    const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    return isLocal ? 'http://localhost:5000/api' : 'https://bhavyams-vendorhub-backend.onrender.com/api';
};

const getImageUrl = (raw) => {
    if (!raw) return 'https://via.placeholder.com/200?text=Subhams+Hub';
    if (raw.startsWith('http') || raw.startsWith('data:')) return raw;
    return `${getBackendUrl().replace('/api', '')}${raw.startsWith('/') ? '' : '/'}${raw}`;
};

const Storefront = () => {
    const [products, setProducts] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const res = await axios.get(`${getBackendUrl()}/products/feed`);
                setProducts(res.data?.products || []);
            } catch (err) {
                console.error("Storefront error:", err);
                toast.error("Failed to load products");
            }
        };
        fetchProducts();
    }, []);

    const containerVariants = {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.08 } }
    };

    const cardVariants = {
        hidden: { opacity: 0, y: 24 },
        show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
    };

    return (
        <div style={styles.pageContainer}>
            <div style={styles.headerWrapper}>
                <motion.h2 initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} style={styles.title}>
                    Welcome to <span style={styles.brandHighlight}>Subhams Hub</span>
                </motion.h2>
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} style={styles.subtitle}>
                    Discover verified local products & services.
                </motion.p>
            </div>

            <motion.div variants={containerVariants} initial="hidden" animate="show" style={styles.productGrid}>
                {products.map((product) => (
                    <motion.div 
                        variants={cardVariants}
                        whileHover={{ y: -6 }}
                        key={product.id} 
                        style={styles.card}
                        onClick={() => navigate(`/item/${product.id}`)}
                    >
                        <div style={styles.imageWrapper}>
                            {product.is_verified && (
                                <div style={styles.badge}><Zap size={12} style={{marginRight: '2px'}}/> Verified</div>
                            )}
                            <img src={getImageUrl(product.image_url)} alt={product.name} style={styles.image} />
                        </div>

                        <div style={styles.info}>
                            <h3 style={styles.productName}>{product.name}</h3>
                            <div style={styles.ratingRow}>
                                <Star size={14} fill="#fbbf24" color="#fbbf24" />
                                <span style={styles.reviewCount}>{product.business_name || 'Local Shop'}</span>
                            </div>

                            <div style={styles.actionRow}>
                                <p style={styles.price}>₹{product.price}</p>
                                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} style={styles.addBtn}>
                                    <ShoppingCart size={16} style={{marginRight:'6px'}}/> View
                                </motion.button>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </motion.div>
        </div>
    );
};

const styles = {
    pageContainer: { padding: '40px 5%', background: 'linear-gradient(to bottom right, #f8fafc, #f1f5f9)', minHeight: '100vh', fontFamily: "'Inter', sans-serif" },
    headerWrapper: { textAlign: 'center', marginBottom: '36px' },
    title: { fontSize: '30px', fontWeight: '900', color: '#0f172a', margin: '0 0 8px 0' },
    brandHighlight: { color: '#2563eb' },
    subtitle: { fontSize: '15px', color: '#64748b', margin: 0 },
    productGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '24px', maxWidth: '1200px', margin: '0 auto' },
    card: { background: '#ffffff', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', border: '1px solid #f1f5f9', cursor: 'pointer' },
    imageWrapper: { position: 'relative', width: '100%', height: '200px', background: '#f8fafc', overflow: 'hidden' },
    badge: { position: 'absolute', top: '12px', left: '12px', background: '#10b981', color: 'white', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 'bold', display: 'flex', alignItems: 'center', zIndex: 2 },
    image: { width: '100%', height: '100%', objectFit: 'cover' },
    info: { padding: '18px', display: 'flex', flexDirection: 'column', flex: 1 },
    productName: { fontSize: '16px', fontWeight: '800', margin: '0 0 8px 0', color: '#0f172a' },
    ratingRow: { display: 'flex', alignItems: 'center', marginBottom: '16px' },
    reviewCount: { fontSize: '12.5px', color: '#475569', marginLeft: '6px', fontWeight: '700' },
    actionRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' },
    price: { fontSize: '20px', fontWeight: '900', color: '#0f172a', margin: 0 },
    addBtn: { background: '#2563eb', color: '#ffffff', border: 'none', padding: '9px 14px', borderRadius: '10px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold', fontSize: '13px' }
};

export default Storefront;