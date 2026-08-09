import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { ShoppingCart } from 'lucide-react';

const ProductCard = ({ product, t }) => {
    const navigate = useNavigate();
    const { addToCart } = useCart();

    const handleCardClick = () => {
        navigate(`/product/${product.id}`);
    };

    const handleAddToCart = (e) => {
        e.stopPropagation(); // Prevents clicking the card
        addToCart(product);
    };

    const handleVendorClick = (e) => {
        e.stopPropagation(); // Prevents clicking the card
        navigate(`/shop/${product.vendor_id}`); // 🟢 Redirects to Shop Profile
    };

    return (
        <div 
            onClick={handleCardClick}
            style={{ 
                background: '#fff', 
                borderRadius: '16px', 
                overflow: 'hidden', 
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', 
                border: '1px solid #f1f5f9',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                transition: 'transform 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        >
            {/* Image */}
            <div style={{ width: '100%', height: '160px', background: '#f8fafc', position: 'relative' }}>
                <img 
                    src={product.image_url || 'https://via.placeholder.com/200'} 
                    alt={product.name} 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                />
                {product.is_service && (
                    <span style={{ position: 'absolute', top: '10px', right: '10px', background: '#8b5cf6', color: 'white', fontSize: '10px', fontWeight: 'bold', padding: '4px 8px', borderRadius: '12px' }}>
                        {t("Service")}
                    </span>
                )}
            </div>

            {/* Details */}
            <div style={{ padding: '15px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                <h4 style={{ margin: '0 0 5px 0', fontSize: '15px', color: '#0f172a', fontWeight: 'bold' }}>
                    {product.name}
                </h4>
                
                {/* 🟢 Clickable Vendor Name */}
                <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '10px' }}>
                    {t("By")}: <span 
                        onClick={handleVendorClick} 
                        style={{ color: '#2563eb', fontWeight: 'bold', textDecoration: 'underline' }}
                    >
                        {product.business_name || "Local Shop"}
                    </span>
                </div>

                <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#16a34a', fontWeight: '900', fontSize: '16px' }}>
                        ₹{product.price}
                    </span>
                    
                    <button 
                        onClick={handleAddToCart}
                        style={{
                            background: '#eff6ff',
                            color: '#2563eb',
                            border: 'none',
                            padding: '8px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <ShoppingCart size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProductCard;