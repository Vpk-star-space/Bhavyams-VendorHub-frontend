import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Share2, ShoppingCart, ArrowLeft, Truck, ShieldCheck, Star, Zap } from 'lucide-react';
import { toast } from 'react-toastify';
import { useCart } from '../context/CartContext';
import confetti from 'canvas-confetti';

const ProductDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { cart, addToCart } = useCart(); 
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [mainImage, setMainImage] = useState('');
    const [gallery, setGallery] = useState([]);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);

        const fetchProduct = async () => {
            try {
                const res = await axios.get(`https://bhavyams-vendorhub-backend.onrender.com/api/products/${id}`);
                const data = res.data;
                setProduct(data);

                const rawUrl = data.image_url || '';
                const cleanUrl = rawUrl.replace(/["\\]/g, ''); 
                const initialImg = cleanUrl.startsWith('http') 
                    ? cleanUrl 
                    : `https://bhavyams-vendorhub-backend.onrender.com${cleanUrl}`;

                setMainImage(initialImg);

                if (data.gallery) {
                    try {
                        const cleanGalleryStr = data.gallery.replace(/\\"/g, '"');
                        const parsed = JSON.parse(cleanGalleryStr);
                        const cleanGallery = Array.isArray(parsed) 
                            ? parsed.map(url => {
                                const cUrl = url.replace(/["\\]/g, '');
                                return cUrl.startsWith('http') ? cUrl : `https://bhavyams-vendorhub-backend.onrender.com${cUrl}`;
                            })
                            : [initialImg];
                        setGallery(cleanGallery);
                    } catch (e) {
                        setGallery([initialImg]);
                    }
                } else {
                    setGallery([initialImg]);
                }
            } catch (err) {
                toast.error("Product not found");
                navigate('/');
            } finally {
                setLoading(false);
            }
        };
        fetchProduct();
        return () => window.removeEventListener('resize', handleResize);
    }, [id, navigate]);

    const fireCelebration = () => {
        const count = 200;
        const defaults = { origin: { y: 0.7 }, zIndex: 9999 };
        function fire(particleRatio, opts) {
            confetti({ ...defaults, ...opts, particleCount: Math.floor(count * particleRatio) });
        }
        fire(0.25, { spread: 26, startVelocity: 55 });
        fire(0.2, { spread: 60 });
        fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
        fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
        fire(0.1, { spread: 120, startVelocity: 45 });
    };

    const handleAction = (type) => {
        if (!product) return;
        
        const stockCount = Number(product.stock_count ?? product.stock ?? 0);
        
        // 🚀 FIX: Convert both IDs to Strings so JavaScript never misses the match!
        const itemInCart = cart.find(item => String(item.id) === String(product.id));
        
        // 🚀 FIX: Safely fallback to 1 if quantity is undefined
        const quantityInCart = itemInCart ? (itemInCart.quantity || 1) : 0;

        if (stockCount <= 0) {
            toast.error("🛑 Sorry, this product is currently out of stock!");
            return;
        }

        // 🚀 FIX: Block adding if cart quantity reaches stock limit
        if (quantityInCart >= stockCount) {
            toast.warning(`You already have all available stock (${stockCount}) in your cart!`);
            if (type === 'buy') navigate('/cart');
            return;
        }

        addToCart(product); 
        setTimeout(() => {
            if (type === 'buy') {
                toast.success("🎊 Perfect! Moving to Checkout...");
                fireCelebration();
                setTimeout(() => navigate('/cart'), 1200);
            } else {
                toast.success("🛒 Added to Bhavyams Cart!");
                fireCelebration();
            }
        }, 10);
    };

    if (loading) return <div style={styles.loader}>Loading Hub...</div>;
    if (!product) return null;

    const stockCount = Number(product.stock_count ?? product.stock ?? 0);
    const isAvailable = stockCount > 0;
    const isLowStock = stockCount > 0 && stockCount <= 5;

    // 🚀 FIX: Calculate maxReached safely for the UI rendering
    const itemInCart = cart.find(item => String(item.id) === String(product.id));
    const quantityInCart = itemInCart ? (itemInCart.quantity || 1) : 0;
    const maxReached = quantityInCart >= stockCount;

    return (
        <div style={styles.page}>
            <div style={styles.container}>
                <button onClick={() => navigate(-1)} style={styles.backBtn}>
                    <ArrowLeft size={18}/> <span>Back to Store</span>
                </button>
                
                <div style={isMobile ? styles.mobileLayout : styles.mainGrid}>
                    <div style={styles.imageColumn}>
                        <div style={isMobile ? {} : styles.stickyWrapper}>
                            <div style={isMobile ? styles.mobileGallery : styles.galleryWrapper}>
                                <div style={isMobile ? styles.mobileThumbStrip : styles.thumbStrip}>
                                    {gallery.map((img, index) => (
                                        <div 
                                            key={index} 
                                            style={{
                                                ...styles.thumbBox, 
                                                border: mainImage === img ? '2px solid #2874f0' : '1px solid #e0e0e0',
                                                opacity: isAvailable ? 1 : 0.6
                                            }}
                                            onClick={() => setMainImage(img)}
                                            onMouseEnter={() => !isMobile && setMainImage(img)}
                                        >
                                            <img src={img} alt="thumb" style={styles.thumbImg} />
                                        </div>
                                    ))}
                                </div>

                                <div style={{
                                    ...(isMobile ? styles.mobileImageCard : styles.imageCard),
                                    filter: isAvailable ? 'none' : 'grayscale(1)'
                                }}>
                                    <img src={mainImage} alt={product.name} style={styles.image} />
                                    {!isAvailable && <div style={styles.soldOutBadge}>OUT OF STOCK</div>}
                                </div>
                            </div>

                            {!isMobile && (
                                <div style={styles.actionRow}>
                                    <button 
                                        style={(isAvailable && !maxReached) ? styles.addToCartBtn : styles.disabledBtn} 
                                        disabled={!isAvailable || maxReached} 
                                        onClick={() => handleAction('cart')}
                                    >
                                        <ShoppingCart size={20} /> 
                                        {!isAvailable ? "SOLD OUT" : (maxReached ? "MAX IN CART" : "ADD TO CART")}
                                    </button>
                                    <button 
                                        style={isAvailable ? styles.buyNowBtn : styles.disabledBtn} 
                                        disabled={!isAvailable} 
                                        onClick={() => handleAction('buy')}
                                    >
                                        <Zap size={20} /> {isAvailable ? "BUY NOW" : "NOT AVAILABLE"}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div style={styles.detailsColumn}>
                        <div style={styles.breadcrumb}>Home {'>'} Products {'>'} {product.name}</div>
                        <h1 style={styles.titleText}>{product.name}</h1>
                        
                        <div style={styles.ratingRow}>
                            <div style={styles.ratingBadge}>4.2 <Star size={12} fill="#fff" /></div>
                            <span style={styles.reviewsText}>Assured Quality</span>
                        </div>

                        <div style={{ margin: '10px 0' }}>
                            {isAvailable ? (
                                <span style={{ color: isLowStock ? '#fb641b' : '#388e3c', fontWeight: 'bold', fontSize: '14px' }}>
                                    {isLowStock ? `🔥 Hurry, only ${stockCount} left in stock!` : '✓ Item in Stock'}
                                </span>
                            ) : (
                                <span style={{ color: '#ef4444', fontWeight: 'bold', fontSize: '14px' }}>
                                    ✕ Currently Out of Stock
                                </span>
                            )}
                        </div>

                        <div style={styles.priceSection}>
                            <div style={styles.priceRow}>
                                <span style={styles.mainPrice}>₹{product.price}</span>
                                <span style={styles.mrpText}>₹{Math.round(product.price * 1.2)}</span>
                                <span style={styles.discountText}>20% off</span>
                            </div>
                        </div>

                        <div style={styles.descBox}>
                            <div style={styles.sectionHeading}>Description</div>
                            <div style={styles.descriptionText}>{product.description}</div>
                        </div>

                        <div style={styles.trustBox}>
                            <div style={styles.trustItem}><Truck size={18} color="#2874f0" /> <span>Free Delivery</span></div>
                            <div style={styles.trustItem}><ShieldCheck size={18} color="#26a541" /> <span>Secure Payment</span></div>
                        </div>

                        <button onClick={() => {navigator.clipboard.writeText(window.location.href); toast.info("Link copied!");}} style={styles.shareBtn}>
                            <Share2 size={16} /> SHARE PRODUCT
                        </button>

                        {isMobile && <div style={{height: '80px'}} />}
                    </div>
                </div>
            </div>

            {/* 📱 MOBILE STICKY FOOTER */}
            {isMobile && (
                <div style={styles.mobileStickyFooter}>
                    <button 
                        style={(isAvailable && !maxReached) ? styles.mobileAddToCart : styles.disabledBtn} 
                        disabled={!isAvailable || maxReached} 
                        onClick={() => handleAction('cart')}
                    >
                        {!isAvailable ? "SOLD OUT" : (maxReached ? "MAX IN CART" : "ADD TO CART")}
                    </button>
                    <button 
                        style={isAvailable ? styles.mobileBuyNow : styles.disabledBtn} 
                        disabled={!isAvailable}  // 🚀 FIX: Removed the empty space here!
                        onClick={() => handleAction('buy')}
                    >
                        {isAvailable ? "BUY NOW" : "NOT AVAILABLE"}
                    </button>
                </div>
            )}
        </div>
    );
};

const styles = {
    page: { background: '#fff', minHeight: '100vh', padding: '10px 0', fontFamily: 'Roboto, Arial, sans-serif' },
    container: { maxWidth: '1240px', margin: '0 auto', padding: '0 10px' },
    loader: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh', color: '#2874f0', fontWeight: 'bold' },
    backBtn: { display: 'flex', alignItems: 'center', gap: '8px', border: 'none', background: 'none', cursor: 'pointer', color: '#878787', marginBottom: '15px', fontSize: '12px', fontWeight: 'bold' },
    mainGrid: { display: 'grid', gridTemplateColumns: '42% 58%', gap: '30px' },
    mobileLayout: { display: 'flex', flexDirection: 'column', gap: '15px' },
    imageColumn: { width: '100%' },
    stickyWrapper: { position: 'sticky', top: '20px' },
    galleryWrapper: { display: 'flex', gap: '12px' },
    mobileGallery: { display: 'flex', flexDirection: 'column-reverse', gap: '10px' },
    thumbStrip: { display: 'flex', flexDirection: 'column', gap: '8px' },
    mobileThumbStrip: { display: 'flex', flexDirection: 'row', gap: '8px', overflowX: 'auto', paddingBottom: '5px' },
    thumbBox: { width: '56px', height: '56px', padding: '2px', cursor: 'pointer', borderRadius: '4px', flexShrink: 0 },
    thumbImg: { width: '100%', height: '100%', objectFit: 'contain' },
    imageCard: { flex: 1, border: '1px solid #f0f0f0', position: 'relative', height: '450px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    mobileImageCard: { width: '100%', height: '320px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #f0f0f0' },
    image: { maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' },
    actionRow: { display: 'flex', gap: '10px', marginTop: '15px' },
    addToCartBtn: { flex: 1, padding: '16px', background: '#ff9f00', color: '#fff', border: 'none', fontWeight: '900', borderRadius: '2px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' },
    buyNowBtn: { flex: 1, padding: '16px', background: '#fb641b', color: '#fff', border: 'none', fontWeight: '900', borderRadius: '2px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' },
    mobileStickyFooter: { position: 'fixed', bottom: 0, left: 0, right: 0, height: '60px', display: 'flex', background: '#fff', boxShadow: '0 -2px 10px rgba(0,0,0,0.1)', zIndex: 1000 },
    mobileAddToCart: { flex: 1, background: '#fff', color: '#212121', border: 'none', fontWeight: '900', fontSize: '14px', cursor: 'pointer' },
    mobileBuyNow: { flex: 1, background: '#fb641b', color: '#fff', border: 'none', fontWeight: '900', fontSize: '14px', cursor: 'pointer' },
    disabledBtn: { flex: 1, background: '#f1f3f6', color: '#878787', border: '1px solid #e0e0e0', fontWeight: '900', cursor: 'not-allowed', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', padding: '16px' },
    detailsColumn: { padding: '0 10px' },
    breadcrumb: { fontSize: '11px', color: '#878787', marginBottom: '8px' },
    titleText: { fontSize: '18px', color: '#212121', margin: '0 0 8px 0', fontWeight: '400', lineHeight: '1.4' },
    ratingRow: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' },
    ratingBadge: { background: '#388e3c', color: '#fff', padding: '2px 6px', borderRadius: '3px', fontSize: '11px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' },
    reviewsText: { fontSize: '12px', color: '#878787', fontWeight: 'bold' },
    mainPrice: { fontSize: '24px', fontWeight: 'bold', marginRight: '10px' },
    mrpText: { fontSize: '14px', color: '#878787', textDecoration: 'line-through', marginRight: '10px' },
    discountText: { fontSize: '14px', color: '#388e3c', fontWeight: 'bold' },
    descBox: { margin: '20px 0', borderTop: '1px solid #f0f0f0', paddingTop: '15px' },
    sectionHeading: { fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' },
    descriptionText: { fontSize: '13px', color: '#212121', lineHeight: '1.6' },
    trustBox: { background: '#f9f9f9', padding: '12px', borderRadius: '4px', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '8px' },
    trustItem: { display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px' },
    shareBtn: { background: '#fff', border: '1px solid #e0e0e0', padding: '8px 15px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold', color: '#2874f0', display: 'flex', alignItems: 'center', gap: '8px', borderRadius: '2px' },
    soldOutBadge: { position: 'absolute', background: '#ef4444', color: '#fff', padding: '8px 20px', fontWeight: 'bold', borderRadius: '3px', zIndex: 10 }
};

export default ProductDetails;