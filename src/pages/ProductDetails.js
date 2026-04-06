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
    const { addToCart } = useCart();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    
    // 📸 GALLERY STATES
    const [mainImage, setMainImage] = useState('');
    const [gallery, setGallery] = useState([]);

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const res = await axios.get(`https://bhavyams-vendorhub-backend.onrender.com/api/products/${id}`);
                const data = res.data;
                setProduct(data);

                // 🌐 Set initial main image (Smart Cloud Logic)
                // 🌐 Set initial main image (Smart Cloud Logic)
                const initialImg = data.image_url?.startsWith('http') 
                    ? data.image_url 
                    // 🚀 FIX: Point to the live Render Backend!
                    : `https://bhavyams-vendorhub-backend.onrender.com${data.image_url}`;

                // ☁️ Parse Gallery JSON from Database
                if (data.gallery) {
                    try {
                        const parsed = JSON.parse(data.gallery);
                        setGallery(Array.isArray(parsed) ? parsed : [initialImg]);
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
        toast.dismiss();
        addToCart(product); 
        setTimeout(() => {
            toast.dismiss();
            if (type === 'buy') {
                toast.success("🎊 Perfect! Moving to Checkout...");
                fireCelebration();
                setTimeout(() => navigate('/cart'), 1500);
            } else {
                toast.success("🛒 Added to Bhavyams Cart!");
                fireCelebration();
            }
        }, 10);
    };

    const handleShare = () => {
        navigator.clipboard.writeText(window.location.href);
        toast.info("Link copied!");
    };

    if (loading) return <div style={styles.loader}>Loading Hub...</div>;
    if (!product) return null;

    const isAvailable = Number(product.stock_count) > 0;

    return (
        <div style={styles.page}>
            <div style={styles.container}>
                <button onClick={() => navigate(-1)} style={styles.backBtn}>
                    <ArrowLeft size={18}/> <span>Back to Store</span>
                </button>
                
                <div style={styles.mainGrid}>
                    {/* 🖼️ LEFT COLUMN: IMAGE GALLERY */}
                    <div style={styles.imageColumn}>
                        <div style={styles.stickyWrapper}>
                            <div style={styles.galleryWrapper}>
                                {/* THUMBNAIL STRIP */}
                                <div style={styles.thumbStrip}>
                                    {gallery.map((img, index) => (
                                        <div 
                                            key={index} 
                                            style={{
                                                ...styles.thumbBox, 
                                                border: mainImage === img ? '2px solid #2874f0' : '1px solid #e0e0e0'
                                            }}
                                            onMouseEnter={() => setMainImage(img)} // Change on hover like Flipkart
                                        >
                                            <img src={img} alt="thumb" style={styles.thumbImg} />
                                        </div>
                                    ))}
                                </div>

                                {/* MAIN BIG IMAGE */}
                                <div style={styles.imageCard}>
                                    <img src={mainImage} alt={product.name} style={styles.image} />
                                    {!isAvailable && <div style={styles.soldOutBadge}>OUT OF STOCK</div>}
                                </div>
                            </div>

                            <div style={styles.actionRow}>
                                <button 
                                    style={isAvailable ? styles.addToCartBtn : styles.disabledBtn}
                                    disabled={!isAvailable}
                                    onClick={() => handleAction('cart')}
                                >
                                    <ShoppingCart size={20} /> ADD TO CART
                                </button>
                                <button 
                                    style={isAvailable ? styles.buyNowBtn : styles.disabledBtn}
                                    disabled={!isAvailable}
                                    onClick={() => handleAction('buy')}
                                >
                                    <Zap size={20} /> BUY NOW
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* 📝 RIGHT COLUMN: DETAILS */}
                    <div style={styles.detailsColumn}>
                        <div style={styles.breadcrumb}>Home {'>'} Products {'>'} {product.name}</div>
                        <h1 style={styles.titleText}>{product.name}</h1>
                        <div style={styles.ratingRow}>
                            <div style={styles.ratingBadge}>4.2 <Star size={12} fill="#fff" /></div>
                            <span style={styles.reviewsText}>Assured Quality</span>
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
                        <button onClick={handleShare} style={styles.shareBtn}><Share2 size={16} /> SHARE</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const styles = {
    page: { background: '#fff', minHeight: '100vh', padding: '20px 0', fontFamily: 'Roboto, Arial, sans-serif' },
    container: { maxWidth: '1240px', margin: '0 auto', padding: '0 15px' },
    loader: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh', color: '#2874f0', fontWeight: 'bold' },
    backBtn: { display: 'flex', alignItems: 'center', gap: '8px', border: 'none', background: 'none', cursor: 'pointer', color: '#878787', marginBottom: '20px', fontSize: '14px', fontWeight: 'bold' },
    
    mainGrid: { display: 'grid', gridTemplateColumns: '45% 55%', gap: '20px' },
    
    // GALLERY STYLES
    imageColumn: { display: 'flex', flexDirection: 'column' },
    stickyWrapper: { position: 'sticky', top: '90px' },
    galleryWrapper: { display: 'flex', gap: '10px' },
    thumbStrip: { display: 'flex', flexDirection: 'column', gap: '8px' },
    thumbBox: { width: '60px', height: '60px', padding: '2px', cursor: 'pointer', borderRadius: '2px', overflow: 'hidden' },
    thumbImg: { width: '100%', height: '100%', objectFit: 'contain' },
    imageCard: { flex: 1, border: '1px solid #f0f0f0', padding: '20px', textAlign: 'center', position: 'relative', height: '450px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    image: { maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' },
    
    soldOutBadge: { position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: 'rgba(0,0,0,0.7)', color: '#fff', padding: '10px 20px', fontWeight: 'bold', fontSize: '18px' },
    actionRow: { display: 'flex', gap: '10px', marginTop: '20px', marginLeft: '70px' }, // Aligned with the big image
    
    addToCartBtn: { flex: 1, padding: '18px', background: '#ff9f00', color: '#fff', border: 'none', fontWeight: '900', borderRadius: '2px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', fontSize: '16px' },
    buyNowBtn: { flex: 1, padding: '18px', background: '#fb641b', color: '#fff', border: 'none', fontWeight: '900', borderRadius: '2px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', fontSize: '16px' },
    disabledBtn: { flex: 1, padding: '18px', background: '#e0e0e0', color: '#9e9e9e', border: 'none', fontWeight: '900', borderRadius: '2px', cursor: 'not-allowed' },

    detailsColumn: { padding: '0 20px' },
    breadcrumb: { fontSize: '12px', color: '#878787', marginBottom: '10px' },
    titleText: { fontSize: '22px', color: '#212121', margin: '0 0 10px 0', fontWeight: '400' },
    ratingRow: { display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' },
    ratingBadge: { background: '#388e3c', color: '#fff', padding: '2px 8px', borderRadius: '3px', fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' },
    reviewsText: { fontSize: '14px', color: '#878787', fontWeight: 'bold' },
    priceSection: { marginBottom: '20px' },
    priceRow: { display: 'flex', alignItems: 'baseline', gap: '12px' },
    mainPrice: { fontSize: '28px', fontWeight: 'bold', color: '#212121' },
    mrpText: { fontSize: '16px', color: '#878787', textDecoration: 'line-through' },
    discountText: { fontSize: '16px', color: '#388e3c', fontWeight: 'bold' },
    descBox: { marginBottom: '25px' },
    sectionHeading: { fontSize: '16px', fontWeight: 'bold', color: '#212121', marginBottom: '10px' },
    descriptionText: { fontSize: '14px', color: '#212121', lineHeight: '1.6' },
    trustBox: { background: '#f9f9f9', padding: '15px', borderRadius: '4px', marginBottom: '25px', display: 'flex', flexDirection: 'column', gap: '10px' },
    trustItem: { display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', fontWeight: '500' },
    shareBtn: { background: '#fff', border: '1px solid #e0e0e0', padding: '10px 20px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', color: '#2874f0', display: 'flex', alignItems: 'center', gap: '8px' }
};

export default ProductDetails;