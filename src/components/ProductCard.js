import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap } from 'lucide-react'; // Added for Flipkart-style feel

const ProductCard = ({ product }) => {
    const navigate = useNavigate();

    // 🚀 FIX 1: Smart Image Logic (Connects to Render Backend)
    const imageSrc = product.image_url?.startsWith('http') 
        ? product.image_url 
        : `https://bhavyams-vendorhub-backend.onrender.com${product.image_url}`;

    // 🚀 FIX 2: Correct Naming (stock_count from DB)
    const stockAvailable = product.stock_count ?? product.stock ?? 0;
    const isOutOfStock = Number(stockAvailable) <= 0;

    return (
        <div 
            onClick={() => navigate(`/product/${product.id}`)} 
            style={styles.card}
        >
            <div style={styles.imageContainer}>
                <img 
                    src={imageSrc} 
                    alt={product.name} 
                    style={styles.image} 
                    onError={(e) => { e.target.src = 'https://via.placeholder.com/150?text=Bhavyams'; }}
                />
                {isOutOfStock && <div style={styles.soldOutOverlay}>OUT OF STOCK</div>}
            </div>

            <div style={styles.info}>
                <h3 style={styles.name}>{product.name}</h3>
                
                <div style={styles.ratingRow}>
                    <div style={styles.ratingBadge}>4.2 ★</div>
                    <span style={styles.assuredText}><Zap size={10} fill="#2874f0"/> Assured</span>
                </div>

                <div style={styles.priceRow}>
                    <span style={styles.price}>₹{Number(product.price).toLocaleString('en-IN')}</span>
                    {/* Optional: Add a fake discount to look professional */}
                    <span style={styles.originalPrice}>₹{Number(product.price * 1.2).toFixed(0)}</span>
                </div>

                <p style={{...styles.stock, color: isOutOfStock ? '#ef4444' : '#64748b'}}>
                    {isOutOfStock ? "Restocking Soon" : `Only ${stockAvailable} left`}
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
        cursor: 'pointer', 
        border: '1px solid #e2e8f0',
        transition: 'transform 0.2s ease-in-out',
        height: '100%'
    },
    imageContainer: {
        position: 'relative',
        height: '160px',
        padding: '10px',
        background: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    },
    image: { 
        maxWidth: '100%', 
        maxHeight: '100%', 
        objectFit: 'contain' 
    },
    soldOutOverlay: {
        position: 'absolute',
        inset: 0,
        background: 'rgba(255,255,255,0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#ef4444',
        fontWeight: 'bold',
        fontSize: '12px'
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
        color: '#212121', 
        margin: 0,
        height: '34px',
        overflow: 'hidden',
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical'
    },
    ratingRow: { display: 'flex', alignItems: 'center', gap: '8px', margin: '4px 0' },
    ratingBadge: { background: '#388e3c', color: '#fff', fontSize: '10px', padding: '2px 6px', borderRadius: '3px', fontWeight: 'bold' },
    assuredText: { color: '#2874f0', fontSize: '10px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '2px' },
    priceRow: { display: 'flex', alignItems: 'center', gap: '8px' },
    price: { color: '#212121', fontWeight: 'bold', fontSize: '16px' },
    originalPrice: { color: '#878787', fontSize: '12px', textDecoration: 'line-through' },
    stock: { fontSize: '11px', margin: '2px 0 0 0' }
};

export default ProductCard;