import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Star, ShoppingCart, Zap } from 'lucide-react'; 
import { toast } from 'react-toastify';
import { motion } from 'framer-motion'; // 🌟 Added Framer Motion for beautiful animations

const Storefront = () => {
    const [products, setProducts] = useState([]);

    // 🛡️ LOGIC IS UNTOUCHED
    const fetchProducts = async () => {
        try {
            const res = await axios.get('https://bhavyams-vendorhub-backend.onrender.com/api/products/with-ratings');
            setProducts(res.data);
        } catch (err) {
            console.error("Storefront error:", err);
            toast.error("Failed to load products");
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    // 🌟 ANIMATION CONFIGURATIONS
    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.1 } // Makes cards pop in one after another
        }
    };

    const cardVariants = {
        hidden: { opacity: 0, y: 30 },
        show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
    };

    return (
        <div style={styles.pageContainer}>
            {/* 🌟 Beautiful Header Header */}
            <div style={styles.headerWrapper}>
                <motion.h2 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    style={styles.title}
                >
                    Welcome to <span style={styles.brandHighlight}>Bhavyams Hub</span>
                </motion.h2>
                <motion.p 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
                    style={styles.subtitle}
                >
                    Discover premium products from top vendors.
                </motion.p>
            </div>

            {/* 🌟 Animated Grid */}
            <motion.div 
                variants={containerVariants} 
                initial="hidden" 
                animate="show" 
                style={styles.productGrid}
            >
                {products.map((product) => (
                    <motion.div 
                        variants={cardVariants}
                        whileHover={{ y: -8 }} // 🌟 Card floats up slightly when you hover over it
                        key={product.id} 
                        style={styles.card}
                    >
                        {/* Image Wrapper */}
                        <div style={styles.imageWrapper}>
                            {product.average_rating >= 4.5 && (
                                <div style={styles.badge}><Zap size={12} style={{marginRight: '2px'}}/> Top Rated</div>
                            )}
                          <img 
                                // 🚀 FIX: Point to the live Render Backend!
                                src={product.image_url ? `https://bhavyams-vendorhub-backend.onrender.com${product.image_url}` : 'https://via.placeholder.com/150'} 
                                alt={product.name} 
                                style={styles.image} 
                            />
                        </div>

                        {/* Product Info */}
                        <div style={styles.info}>
                            <h3 style={styles.productName}>{product.name}</h3>
                            
                            {/* ⭐ RATING UI */}
                            <div style={styles.ratingRow}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                                    {[...Array(5)].map((_, i) => {
                                        const ratingValue = Number(product.average_rating) || 0;
                                        return (
                                            <Star 
                                                key={i} 
                                                size={14} 
                                                fill={i < Math.round(ratingValue) ? "#fbbf24" : "none"} 
                                                color={i < Math.round(ratingValue) ? "#fbbf24" : "#cbd5e1"} 
                                            />
                                        );
                                    })}
                                </div>
                                <span style={styles.reviewCount}>
                                    {product.average_rating > 0 ? Number(product.average_rating).toFixed(1) : "New"} 
                                    <span style={{color: '#94a3b8', fontSize: '11px', marginLeft:'4px'}}>({product.total_reviews || 0})</span>
                                </span>
                            </div>

                            {/* Price & Action */}
                            <div style={styles.actionRow}>
                                <p style={styles.price}>₹{product.price}</p>
                                <motion.button 
                                    whileHover={{ scale: 1.05 }} 
                                    whileTap={{ scale: 0.95 }} 
                                    style={styles.addBtn}
                                >
                                    <ShoppingCart size={16} style={{marginRight:'6px'}}/> Add
                                </motion.button>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </motion.div>
        </div>
    );
};

// 🎨 PREMIUM STYLES DICTIONARY
const styles = {
    pageContainer: { 
        padding: '60px 5%', 
        background: 'linear-gradient(to bottom right, #f8fafc, #f1f5f9)', 
        minHeight: '100vh',
        fontFamily: "'Inter', sans-serif"
    },
    headerWrapper: {
        textAlign: 'center',
        marginBottom: '50px'
    },
    title: { 
        fontSize: '36px', 
        fontWeight: '900', 
        color: '#0f172a',
        margin: '0 0 10px 0',
        letterSpacing: '-0.5px'
    },
    brandHighlight: {
        color: '#3b82f6', // Premium Blue
    },
    subtitle: {
        fontSize: '16px',
        color: '#64748b',
        margin: 0
    },
    productGrid: { 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', 
        gap: '30px',
        maxWidth: '1200px',
        margin: '0 auto'
    },
    card: { 
        background: '#ffffff', 
        borderRadius: '20px', 
        overflow: 'hidden', 
        boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05), 0 4px 6px -4px rgba(0,0,0,0.02)', // Soft premium shadow
        display: 'flex',
        flexDirection: 'column',
        border: '1px solid #f1f5f9'
    },
    imageWrapper: {
        position: 'relative',
        width: '100%',
        height: '220px',
        background: '#f8fafc',
        overflow: 'hidden'
    },
    badge: {
        position: 'absolute',
        top: '12px',
        left: '12px',
        background: '#10b981',
        color: 'white',
        padding: '4px 10px',
        borderRadius: '20px',
        fontSize: '11px',
        fontWeight: 'bold',
        display: 'flex',
        alignItems: 'center',
        boxShadow: '0 4px 6px rgba(16, 185, 129, 0.3)',
        zIndex: 2
    },
    image: { 
        width: '100%', 
        height: '100%', 
        objectFit: 'cover',
        transition: 'transform 0.5s ease'
    },
    info: { 
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        flex: 1
    },
    productName: { 
        fontSize: '17px', 
        fontWeight: '700',
        margin: '0 0 10px 0', 
        color: '#1e293b',
        lineHeight: '1.4'
    },
    ratingRow: { 
        display: 'flex', 
        alignItems: 'center', 
        marginBottom: '20px' 
    },
    reviewCount: { 
        fontSize: '13px', 
        color: '#475569', 
        marginLeft: '8px',
        fontWeight: '600'
    },
    actionRow: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 'auto' // Pushes this to the bottom of the card
    },
    price: { 
        fontSize: '22px', 
        fontWeight: '900', 
        color: '#0f172a', 
        margin: 0 
    },
    addBtn: { 
        background: '#3b82f6', 
        color: '#ffffff', 
        border: 'none', 
        padding: '10px 16px', 
        borderRadius: '12px', 
        cursor: 'pointer', 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        fontWeight: 'bold',
        fontSize: '14px',
        boxShadow: '0 4px 6px rgba(59, 130, 246, 0.25)'
    }
};

export default Storefront;