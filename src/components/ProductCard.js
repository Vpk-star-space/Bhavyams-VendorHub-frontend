import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap } from 'lucide-react';

const ProductCard = ({ product }) => {
    const navigate = useNavigate();

    // 🚀 FIX 1: Smart Image Logic
    const imageSrc = product.image_url?.startsWith('http') 
        ? product.image_url 
        : `https://bhavyams-vendorhub-backend.onrender.com${product.image_url}`;

    // 🚀 FIX 2: Correct Naming & Out of Stock Logic
    const stockAvailable = Number(product.stock_count ?? product.stock ?? 0);
    const isOutOfStock = stockAvailable <= 0;

    return (
        <div 
            onClick={() => !isOutOfStock && navigate(`/product/${product.id}`)} 
            style={{
                ...styles.card,
                cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                filter: isOutOfStock ? 'grayscale(0.8)' : 'none', // 🌑 Makes it look unavailable
                opacity: isOutOfStock ? 0.8 : 1
            }}
        >
            <div style={styles.imageContainer}>
                <img 
                    src={imageSrc} 
                    alt={product.name} 
                    style={styles.image} 
                    onError={(e) => { e.target.src = 'https://via.placeholder.com/150?text=Bhavyams'; }}
                />
                
                {/* 🔴 RED OVERLAY FOR OUT OF STOCK */}
                {isOutOfStock && (
                    <div style={styles.soldOutOverlay}>
                        <span style={styles.soldOutText}>OUT OF STOCK</span>
                    </div>
                )}
            </div>

            <div style={styles.info}>
                <h3 style={{
                    ...styles.name, 
                    color: isOutOfStock ? '#878787' : '#212121'
                }}>{product.name}</h3>
                
                <div style={styles.ratingRow}>
                    <div style={{
                        ...styles.ratingBadge, 
                        background: isOutOfStock ? '#9e9e9e' : '#388e3c'
                    }}>4.2 ★</div>
                    {!isOutOfStock && (
                        <span style={styles.assuredText}><Zap size={10} fill="#2874f0"/> Assured</span>
                    )}
                </div>

                <div style={styles.priceRow}>
                    <span style={{
                        ...styles.price, 
                        color: isOutOfStock ? '#878787' : '#212121'
                    }}>₹{Number(product.price).toLocaleString('en-IN')}</span>
                    <span style={styles.originalPrice}>₹{Number(product.price * 1.2).toFixed(0)}</span>
                </div>

                {/* 📊 DYNAMIC STOCK TEXT */}
                <p style={{
                    ...styles.stock, 
                    color: isOutOfStock ? '#ef4444' : (stockAvailable < 5 ? '#ff9f00' : '#388e3c'),
                    fontWeight: stockAvailable < 5 ? 'bold' : 'normal'
                }}>
                    {isOutOfStock 
                        ? "Temporarily Unavailable" 
                        : (stockAvailable < 10 ? `Hurry, only ${stockAvailable} left!` : "In Stock")
                    }
                </p>
            </div>
        </div>
    );
};

const styles = {
    card: { 
        background: '#fff', 
        borderRadius: '8px', 
        overflow: 'hidden',
        display: 'flex', 
        flexDirection: 'column',
        border: '1px solid #e2e8f0',
        transition: 'all 0.2s ease-in-out',
        height: '100%',
        position: 'relative'
    },
    imageContainer: {
        position: 'relative',
        height: '160px',
        padding: '10px',
        background: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden'
    },
    image: { 
        maxWidth: '100%', 
        maxHeight: '100%', 
        objectFit: 'contain' 
    },
    soldOutOverlay: {
        position: 'absolute',
        inset: 0,
        background: 'rgba(255, 255, 255, 0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2
    },
    soldOutText: {
        background: '#ef4444',
        color: '#fff',
        padding: '4px 12px',
        fontSize: '11px',
        fontWeight: 'bold',
        borderRadius: '2px',
        letterSpacing: '0.5px'
    },
    info: { 
        padding: '12px', 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '4px',
        borderTop: '1px solid #f1f5f9'
    },
    name: { 
        fontSize: '14px', 
        fontWeight: '500', 
        margin: 0,
        height: '34px',
        overflow: 'hidden',
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical'
    },
    ratingRow: { display: 'flex', alignItems: 'center', gap: '8px', margin: '4px 0' },
    ratingBadge: { color: '#fff', fontSize: '10px', padding: '2px 6px', borderRadius: '3px', fontWeight: 'bold' },
    assuredText: { color: '#2874f0', fontSize: '10px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '2px' },
    priceRow: { display: 'flex', alignItems: 'center', gap: '8px' },
    price: { fontWeight: 'bold', fontSize: '16px' },
    originalPrice: { color: '#878787', fontSize: '12px', textDecoration: 'line-through' },
    stock: { fontSize: '11px', margin: '2px 0 0 0' }
};

export default ProductCard;