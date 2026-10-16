import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { ShoppingCart } from 'lucide-react';
import { BACKEND_URL } from '../config/api';

const ProductCard = ({ product, t }) => {
    const navigate = useNavigate();
    const { addToCart } = useCart();
    const tr = typeof t === 'function' ? t : (s) => s;

    const getImg = (raw) => {
        if (!raw) return 'https://via.placeholder.com/200?text=Item';
        if (raw.startsWith('http') || raw.startsWith('data:')) return raw;
        return `${BACKEND_URL.replace('/api', '')}${raw.startsWith('/') ? '' : '/'}${raw}`;
    };

    const handleCardClick = () => {
        navigate(`/item/${product.id}`);
    };

    const handleAddToCart = (e) => {
        e.stopPropagation();
        addToCart(product);
    };

    const handleVendorClick = (e) => {
        e.stopPropagation();
        navigate(`/shop/${product.shop_id || product.vendor_id}`);
    };

    return (
        <div 
            onClick={handleCardClick}
            style={{ 
                background: '#fff', 
                borderRadius: '16px', 
                overflow: 'hidden', 
                boxShadow: '0 4px 10px rgba(0,0,0,0.04)', 
                border: '1px solid #e2e8f0',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                transition: 'transform 0.2s'
            }}
        >
            <div style={{ width: '100%', height: '155px', background: '#f8fafc', position: 'relative' }}>
                <img 
                    src={getImg(product.image_url)} 
                    alt={product.name} 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                />
                {product.is_service && (
                    <span style={{ position: 'absolute', top: '10px', right: '10px', background: '#8b5cf6', color: 'white', fontSize: '10px', fontWeight: 'bold', padding: '4px 8px', borderRadius: '12px' }}>
                        {tr("Service")}
                    </span>
                )}
            </div>

            <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                <h4 style={{ margin: '0 0 4px 0', fontSize: '14.5px', color: '#0f172a', fontWeight: '800', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {product.name}
                </h4>
                
                <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '10px' }}>
                    {tr("By")}: <span onClick={handleVendorClick} style={{ color: '#2563eb', fontWeight: '800', textDecoration: 'underline' }}>
                        {product.business_name || "Local Shop"}
                    </span>
                </div>

                <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#16a34a', fontWeight: '900', fontSize: '16px' }}>
                        ₹{product.price}
                    </span>
                    
                    <button 
                        onClick={handleAddToCart}
                        style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', padding: '8px', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                        <ShoppingCart size={17} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProductCard;