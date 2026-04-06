import React from 'react';
import { useNavigate } from 'react-router-dom';

const ProductCard = ({ product }) => {
    const navigate = useNavigate();

    return (
        <div 
            onClick={() => navigate(`/product/${product.id}`)} 
            style={styles.card}
        >
            <img src={product.image_url} alt={product.name} style={styles.image} />
            <div style={styles.info}>
                <h3 style={styles.name}>{product.name}</h3>
                <p style={styles.price}>₹{product.price}</p>
                <p style={styles.stock}>Stock: {product.stock}</p>
                {product.stock <= 0 && <span style={styles.soldOut}>Sold Out</span>}
            </div>
        </div>
    );
};

const styles = {
    card: { background: '#fff', borderRadius: '15px', padding: '15px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', cursor: 'pointer', textAlign: 'center', transition: '0.3s' },
    image: { width: '100%', height: '150px', objectFit: 'contain', marginBottom: '10px' },
    name: { fontSize: '16px', fontWeight: 'bold', margin: '5px 0', color: '#1e293b' },
    price: { color: '#3b82f6', fontWeight: 'bold', fontSize: '18px' },
    stock: { fontSize: '12px', color: '#64748b' },
    soldOut: { color: 'red', fontSize: '12px', fontWeight: 'bold' }
};

export default ProductCard;