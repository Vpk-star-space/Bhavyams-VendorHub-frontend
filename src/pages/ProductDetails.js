import React, { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Share2, ShoppingCart, ArrowLeft, Truck, ShieldCheck, Star, Zap, User, Store, BadgeCheck, MapPin, MapPinOff, Clock } from 'lucide-react';
import { toast } from 'react-toastify';
import { useCart } from '../context/CartContext';
import { AppContext } from '../context/AppContext';
import confetti from 'canvas-confetti';

const getBackendUrl = () => {
    const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    return isLocal ? 'http://localhost:5000/api' : 'https://bhavyams-vendorhub-backend.onrender.com/api';
};

const getOptimizedImage = (url) => {
    if (!url) return 'https://via.placeholder.com/400?text=No+Image';
    const clean = String(url).replace(/["\\]/g, '');
    if (clean.includes('cloudinary.com') && !clean.includes('q_auto')) {
        return clean.replace('/upload/', '/upload/q_auto,f_auto,w_800/');
    }
    if (clean.startsWith('http') || clean.startsWith('data:')) return clean;
    return `${getBackendUrl().replace('/api', '')}${clean.startsWith('/') ? '' : '/'}${clean}`;
};

// 🟢 BILINGUAL TELUGU-TO-ENGLISH CANONICAL MAPPER
const TELUGU_TO_EN_MAP = {
    'కోణంకి': 'konanki', 'మార్టూరు': 'martur', 'బాపట్ల': 'bapatla',
    'తిరుపతి': 'tirupati', 'ఆంధ్రప్రదేశ్': 'andhra pradesh', 'గుంటూరు': 'guntur',
    'విజయవాడ': 'vijayawada', 'ఒంగోలు': 'ongole', 'చీరాల': 'chirala', 'ప్రకాశం': 'prakasam'
};

const normalizeLocationText = (text) => {
    if (!text) return '';
    let lower = String(text).toLowerCase();
    Object.keys(TELUGU_TO_EN_MAP).forEach(teWord => {
        if (lower.includes(teWord)) lower = lower.replace(new RegExp(teWord, 'g'), TELUGU_TO_EN_MAP[teWord]);
    });
    return lower;
};

const parseDeliveryZones = (rawAreas) => {
    if (!rawAreas || rawAreas.trim() === '' || rawAreas.trim().toLowerCase() === 'all') {
        return [{ full: 'All India', primary: 'All', sub: '' }];
    }
    if (rawAreas.includes('|')) {
        return rawAreas.split('|').map(z => z.trim()).filter(Boolean).map(zone => {
            const parts = zone.split(',').map(p => p.trim()).filter(Boolean);
            return { full: zone, primary: parts[0] || zone, sub: parts.slice(1, 3).join(', ') };
        });
    }
    const commaParts = rawAreas.split(',').map(p => p.trim()).filter(Boolean);
    if (commaParts.length >= 3 && (rawAreas.toLowerCase().includes('india') || rawAreas.toLowerCase().includes('andhra pradesh') || /\b\d{6}\b/.test(rawAreas))) {
        return [{ full: rawAreas.trim(), primary: commaParts[0], sub: commaParts.slice(1, 3).join(', ') }];
    }
    return commaParts.map(p => ({ full: p, primary: p, sub: '' }));
};

const checkIsDeliverableToUser = (userAddressRaw, rawDeliveryAreas) => {
    const zones = parseDeliveryZones(rawDeliveryAreas);
    if (zones.some(z => ['all', 'india', 'all india'].includes(z.primary.toLowerCase()))) return true;
    if (!userAddressRaw) return true;

    const normUserFull = normalizeLocationText(userAddressRaw);
    const userTokens = normUserFull.split(/[,]+/).map(s => s.trim()).filter(Boolean);

    return zones.some(zone => {
        const normPrimary = normalizeLocationText(zone.primary);
        if (!normPrimary) return false;
        const hasPrimaryMatch = userTokens.some(t => t === normPrimary || t.includes(normPrimary)) || normUserFull.includes(normPrimary);
        if (!hasPrimaryMatch) return false;

        const zoneParts = normalizeLocationText(zone.full)
            .split(',')
            .map(s => s.trim())
            .filter(s => s && s !== 'india' && !/^\d+$/.test(s) && !s.includes('pincode'));

        if (zoneParts.length > 1 && userTokens.length > 1) {
            return zoneParts.slice(1).some(sub => normUserFull.includes(sub));
        }
        return true;
    });
};

const ProductDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { cart, addToCart } = useCart(); 
    const { language } = useContext(AppContext);
    const lang = language === 'te' ? 'te' : 'en';

    const [product, setProduct] = useState(null);
    const [shopInfo, setShopInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [mainImage, setMainImage] = useState('');
    const [gallery, setGallery] = useState([]);
    const [quantity, setQuantity] = useState(1);
    const [hasRequested, setHasRequested] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    const userStr = localStorage.getItem('user');
    const currentUser = userStr && userStr !== 'undefined' ? JSON.parse(userStr) : null;
    const customLocStr = localStorage.getItem('custom_hub_location');
    const customLocation = customLocStr && customLocStr !== 'undefined' ? JSON.parse(customLocStr) : null;
    const isMasterAdmin = Boolean(currentUser && (currentUser.email === 'pavanvenkat63@gmail.com' || currentUser.role === 'admin'));

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);

        const fetchProduct = async () => {
            try {
                const BACKEND_URL = getBackendUrl();
                const res = await axios.get(`${BACKEND_URL}/products/detail/${id}`);
                const data = res.data;
                setProduct(data);

                const initialImg = getOptimizedImage(data.image_url);
                setMainImage(initialImg);

                if (data.gallery) {
                    try {
                        const cleanGalleryStr = typeof data.gallery === 'string' ? data.gallery.replace(/\\"/g, '"') : JSON.stringify(data.gallery);
                        const parsed = JSON.parse(cleanGalleryStr);
                        const cleanGallery = Array.isArray(parsed) && parsed.length > 0
                            ? parsed.filter(Boolean).map(getOptimizedImage)
                            : [initialImg];
                        setGallery(cleanGallery);
                    } catch (e) {
                        setGallery([initialImg]);
                    }
                } else {
                    setGallery([initialImg]);
                }

                const shopIdToFetch = data.shop_id || data.vendor_id;
                if (shopIdToFetch) {
                    axios.get(`${BACKEND_URL}/shops/${shopIdToFetch}`)
                        .then(sRes => setShopInfo(sRes.data?.shop || null))
                        .catch(() => {});
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
        try {
            const count = 160;
            const defaults = { origin: { y: 0.7 }, zIndex: 9999 };
            const fire = (particleRatio, opts) => {
                confetti({ ...defaults, ...opts, particleCount: Math.floor(count * particleRatio) });
            };
            fire(0.25, { spread: 26, startVelocity: 55 });
            fire(0.2, { spread: 60 });
            fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
        } catch (e) {}
    };

    if (loading) return <div style={styles.loader}>Loading Subhams Hub Item...</div>;
    if (!product) return null;

    const rawDeliveryAreas = shopInfo?.delivery_areas || product.delivery_areas || 'All';
    const activeUserAddress = customLocation?.address || currentUser?.address || '';
    const isDeliverable = isMasterAdmin ? true : checkIsDeliverableToUser(activeUserAddress, rawDeliveryAreas);
    const shortAreaName = activeUserAddress ? activeUserAddress.split(',')[0].trim() : 'your area';
    const parsedZones = parseDeliveryZones(rawDeliveryAreas);
    const formattedZonesLabel = parsedZones.map(z => z.sub ? `${z.primary} (${z.sub})` : z.primary).join(' • ');

    const shopStatus = shopInfo?.account_status || product.account_status || 'active';
    const isShopSuspended = shopStatus === 'temp_block' || shopStatus === 'perma_banned';
    const isOfficial = Boolean(shopInfo && (String(shopInfo.user_id) === "1" || shopInfo.user_email === 'pavanvenkat63@gmail.com'));
    const isVerified = Boolean((shopInfo?.is_verified ?? product.is_verified) === true || String(shopInfo?.is_verified ?? product.is_verified).toLowerCase() === 'true');

    const stockCount = Number(product.stock_count ?? product.stock ?? 0);
    const isService = product.unit_type === 'Service' || product.unit_type === 'Hour';
    const isAvailable = !isShopSuspended && (isService || stockCount > 0);
    const isLowStock = !isService && stockCount > 0 && stockCount <= 5;

    const sellPrice = Number(product.price) || 0;
    const mrp = Number(product.mrp) || Math.round(sellPrice * 1.2);
    const discount = mrp > sellPrice ? Math.round(((mrp - sellPrice) / mrp) * 100) : 0;

    const itemInCart = cart.find(item => String(item.id) === String(product.id));
    const quantityInCart = itemInCart ? (itemInCart.quantity || 1) : 0;
    const maxReached = !isService && quantityInCart >= stockCount;

    const handleRequestDelivery = async () => {
        if (!currentUser) {
            toast.info("Please login to request delivery to your area!");
            return navigate('/welcome');
        }
        const targetShopId = shopInfo?.id || product.shop_id || product.vendor_id;
        try {
            const token = localStorage.getItem('token');
            await axios.post(`${getBackendUrl()}/shops/${targetShopId}/request-delivery`, {
                area_name: activeUserAddress || 'Local Area'
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setHasRequested(true);
            toast.success(`🚀 Delivery request for ${shortAreaName} sent to the shop owner!`);
        } catch (err) {
            toast.error("Failed to send delivery request.");
        }
    };

    const handleAction = (type) => {
        if (isShopSuspended) {
            return toast.error("This shop is currently suspended. Bookings are disabled.");
        }
        if (!currentUser) {
            toast.info("Please login to book or add items!");
            navigate('/welcome');
            return;
        }
        if (!isDeliverable) {
            handleRequestDelivery();
            return;
        }
        if (!isAvailable) {
            toast.error("🛑 Sorry, this item is currently out of stock!");
            return;
        }
        if (maxReached && type !== 'buy') {
            toast.warning(`You already have all available stock (${stockCount}) in your booking list!`);
            return;
        }

        const cartItem = {
            id: product.id,
            name: product.name,
            price: sellPrice,
            quantity: quantity,
            qty: quantity,
            image: mainImage || product.image_url,
            vendor_id: product.vendor_id,
            shop_id: shopInfo?.id || product.shop_id || product.vendor_id,
            order_type: isService ? 'Service' : 'Product',
            total_price: sellPrice * quantity
        };

        let currentCart = JSON.parse(localStorage.getItem('subhams_cart') || '[]');
        currentCart = currentCart.filter(c => String(c.id) !== String(product.id));
        currentCart.push(cartItem);
        localStorage.setItem('subhams_cart', JSON.stringify(currentCart));

        if (addToCart) addToCart(cartItem);
        fireCelebration();

        if (type === 'buy') {
            toast.success("🎊 Moving to your Booking List...");
            setTimeout(() => navigate('/my-orders', { state: { forceTab: 'list' } }), 600);
        }
    };

    const handleWhatsAppShare = () => {
        const text = `🛍️ *${product.name}* (₹${sellPrice}) on Subhams Hub:\n${window.location.href}`;
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    };

    return (
        <div style={styles.page}>
            {/* STICKY NAVBAR */}
            <div style={styles.navBar}>
                <button onClick={() => navigate(-1)} style={styles.backBtn}>
                    <ArrowLeft size={20} /> Back
                </button>
                <div style={{display: 'flex', gap: '8px', alignItems: 'center'}}>
                    {!currentUser && (
                        <button onClick={() => navigate('/welcome')} style={styles.loginBtnSmall}>
                            <User size={14} /> Login
                        </button>
                    )}
                    <button onClick={handleWhatsAppShare} style={{ background: '#dcfce7', color: '#15803d', border: '1px solid #86efac', padding: '6px 12px', borderRadius: '8px', fontWeight: '900', fontSize: '12px', cursor: 'pointer' }}>
                        📲 WhatsApp
                    </button>
                    <button onClick={() => { navigator.clipboard.writeText(window.location.href); toast.info("Link copied!"); }} style={styles.shareIconBtn}>
                        <Share2 size={16} /> Share
                    </button>
                </div>
            </div>

            <div style={styles.container}>
                <div style={isMobile ? styles.mobileLayout : styles.mainGrid}>
                    
                    {/* LEFT: AMBIENT IMAGE GALLERY */}
                    <div style={styles.imageColumn}>
                        <div style={isMobile ? {} : styles.stickyWrapper}>
                            <div style={isMobile ? styles.mobileGallery : styles.galleryWrapper}>
                                {gallery.length > 1 && (
                                    <div style={isMobile ? styles.mobileThumbStrip : styles.thumbStrip}>
                                        {gallery.map((img, index) => (
                                            <div 
                                                key={index} 
                                                style={{
                                                    ...styles.thumbBox, 
                                                    border: mainImage === img ? '2px solid #2563eb' : '1px solid #cbd5e1',
                                                    opacity: isAvailable ? 1 : 0.6
                                                }}
                                                onClick={() => setMainImage(img)}
                                                onMouseEnter={() => !isMobile && setMainImage(img)}
                                            >
                                                <img src={img} alt="thumb" crossOrigin="anonymous" referrerPolicy="no-referrer" style={styles.thumbImg} />
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div style={{
                                    ...(isMobile ? styles.mobileImageCard : styles.imageCard),
                                    filter: isAvailable ? 'none' : 'grayscale(0.8)'
                                }}>
                                    <img src={mainImage} alt="" aria-hidden="true" style={styles.ambientGlowImg} />
                                    <img src={mainImage} alt={product.name} crossOrigin="anonymous" referrerPolicy="no-referrer" style={styles.image} />
                                    {!isAvailable && <div style={styles.soldOutBadge}>{isShopSuspended ? 'SHOP SUSPENDED' : 'OUT OF STOCK'}</div>}
                                </div>
                            </div>

                            {!isMobile && (
                                <div style={styles.actionRow}>
                                    {!isDeliverable ? (
                                        <button onClick={handleRequestDelivery} disabled={hasRequested} style={{...styles.buyNowBtn, background: hasRequested ? '#94a3b8' : '#d97706'}}>
                                            <MapPinOff size={18} /> {hasRequested ? 'DELIVERY REQUEST SENT ✓' : `REQUEST DELIVERY IN ${shortAreaName.toUpperCase()}`}
                                        </button>
                                    ) : (
                                        <>
                                            <button 
                                                style={(isAvailable && !maxReached) ? styles.addToCartBtn : styles.disabledBtn} 
                                                disabled={!isAvailable || maxReached} 
                                                onClick={() => handleAction('cart')}
                                            >
                                                <ShoppingCart size={20} /> 
                                                {!isAvailable ? "UNAVAILABLE" : (maxReached ? "MAX IN LIST" : "ADD TO BOOKING LIST")}
                                            </button>
                                            <button 
                                                style={isAvailable ? styles.buyNowBtn : styles.disabledBtn} 
                                                disabled={!isAvailable} 
                                                onClick={() => handleAction('buy')}
                                            >
                                                <Zap size={20} /> {isAvailable ? (isService ? "BOOK SERVICE NOW" : "BOOK NOW") : "NOT AVAILABLE"}
                                            </button>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* RIGHT: ITEM DETAILS & SHOP TRUST */}
                    <div style={styles.detailsColumn}>
                        <div style={styles.breadcrumb}>Subhams Hub {'>'} {product.business_name || 'Local Store'} {'>'} {product.name}</div>
                        <h1 style={styles.titleText}>{product.name}</h1>
                        
                        <div style={styles.ratingRow}>
                            <div style={styles.ratingBadge}>
                                <Star size={12} fill="#fff" /> {product.unit_value || 1} {product.unit_type || 'Piece'}
                            </div>
                            <span style={styles.reviewsText}>Direct Local Booking • ₹0 Advance</span>
                        </div>

                        <div style={{ margin: '10px 0' }}>
                            {isAvailable ? (
                                <span style={{ color: isLowStock ? '#ea580c' : '#16a34a', fontWeight: '800', fontSize: '14px' }}>
                                    {isLowStock ? `🔥 Hurry, only ${stockCount} left in stock!` : '✓ Available for Local Booking'}
                                </span>
                            ) : (
                                <span style={{ color: '#dc2626', fontWeight: '800', fontSize: '14px' }}>
                                    ✕ {isShopSuspended ? 'Shop is currently restricted by Admin' : 'Currently Out of Stock'}
                                </span>
                            )}
                        </div>

                        <div style={styles.priceSection}>
                            <div style={styles.priceRow}>
                                <span style={styles.mainPrice}>₹{sellPrice * quantity}</span>
                                {mrp > sellPrice && <span style={styles.mrpText}>₹{mrp * quantity}</span>}
                                {discount > 0 && <span style={styles.discountText}>{discount}% off</span>}
                            </div>
                        </div>

                        {/* QUANTITY SELECTOR FOR PRODUCTS */}
                        {!isService && isAvailable && isDeliverable && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '14px 0' }}>
                                <span style={{ fontSize: '13px', fontWeight: '800', color: '#475569' }}>Quantity:</span>
                                <div style={{ display: 'flex', alignItems: 'center', border: '1.5px solid #cbd5e1', borderRadius: '10px', overflow: 'hidden', background: '#f8fafc' }}>
                                    <button onClick={() => setQuantity(q => Math.max(1, q - 1))} style={{ border: 'none', background: 'transparent', padding: '6px 12px', fontWeight: '900', fontSize: '16px', cursor: 'pointer' }}>-</button>
                                    <span style={{ padding: '0 12px', fontWeight: '900', fontSize: '14px' }}>{quantity}</span>
                                    <button onClick={() => setQuantity(q => Math.min(stockCount || 99, q + 1))} style={{ border: 'none', background: 'transparent', padding: '6px 12px', fontWeight: '900', fontSize: '16px', cursor: 'pointer' }}>+</button>
                                </div>
                            </div>
                        )}

                        {/* DELIVERY AREAS WIDGET */}
                        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '12px 14px', margin: '14px 0', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                            <MapPin size={18} color="#16a34a" style={{ marginTop: '2px', flexShrink: 0 }} />
                            <div>
                                <div style={{ fontSize: '11px', fontWeight: '900', color: '#64748b', textTransform: 'uppercase' }}>🚚 Shop Delivers To:</div>
                                <div style={{ fontSize: '13.5px', fontWeight: '800', color: '#0f172a', marginTop: '2px' }}>{formattedZonesLabel}</div>
                            </div>
                        </div>

                        {/* CLICKABLE VENDOR SHOP CARD */}
                        <div 
                            onClick={() => navigate(`/shop/${shopInfo?.id || product.shop_id || product.vendor_id}`)}
                            style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#eff6ff', border: '1px solid #bfdbfe', padding: '12px 14px', borderRadius: '14px', cursor: 'pointer', margin: '14px 0' }}
                        >
                            <Store size={22} color="#2563eb" />
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '11px', color: '#475569', fontWeight: '700' }}>Sold & Managed by</div>
                                <div style={{ fontSize: '15px', fontWeight: '900', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    {product.business_name || shopInfo?.business_name || 'Local Vendor'}
                                    <BadgeCheck size={16} color="#fff" fill={isOfficial ? "#facc15" : isVerified ? "#10b981" : "#3b82f6"} />
                                </div>
                            </div>
                            <span style={{ fontSize: '12px', fontWeight: '900', color: '#2563eb' }}>Visit Shop →</span>
                        </div>

                        <div style={styles.descBox}>
                            <div style={styles.sectionHeading}>Description & Details</div>
                            <div style={styles.descriptionText}>{product.description || (lang === 'te' ? 'విక్రేత అదనపు వివరణ ఇవ్వలేదు.' : 'Quality local item hosted on Subhams Hub.')}</div>
                        </div>

                        <div style={styles.trustBox}>
                            <div style={styles.trustItem}><Truck size={18} color="#2563eb" /> <span><strong>Open-Box Pay on Delivery:</strong> Book for ₹0 online, inspect item & pay directly.</span></div>
                            <div style={styles.trustItem}><Clock size={18} color="#16a34a" /> <span><strong>Privacy Protected:</strong> Your phone number stays hidden during web calls.</span></div>
                        </div>

                        {isMobile && <div style={{height: '80px'}} />}
                    </div>
                </div>
            </div>

            {/* MOBILE STICKY FOOTER */}
            {isMobile && (
                <div style={styles.mobileStickyFooter}>
                    {!isDeliverable ? (
                        <button onClick={handleRequestDelivery} disabled={hasRequested} style={{...styles.mobileBuyNow, background: hasRequested ? '#94a3b8' : '#d97706'}}>
                            {hasRequested ? "REQUEST SENT ✓" : `REQUEST DELIVERY IN ${shortAreaName.toUpperCase()}`}
                        </button>
                    ) : (
                        <>
                            <button 
                                style={(isAvailable && !maxReached) ? styles.mobileAddToCart : styles.disabledBtn} 
                                disabled={!isAvailable || maxReached} 
                                onClick={() => handleAction('cart')}
                            >
                                {!isAvailable ? "UNAVAILABLE" : (maxReached ? "MAX IN LIST" : "ADD TO LIST")}
                            </button>
                            <button 
                                style={isAvailable ? styles.mobileBuyNow : styles.disabledBtn} 
                                disabled={!isAvailable}  
                                onClick={() => handleAction('buy')}
                            >
                                {isAvailable ? (isService ? "BOOK SERVICE" : `BOOK NOW (₹${sellPrice * quantity})`) : "UNAVAILABLE"}
                            </button>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

const styles = {
    page: { background: '#fff', minHeight: '100vh', paddingBottom: '50px', fontFamily: 'Inter, system-ui, sans-serif' },
    container: { maxWidth: '1140px', margin: '0 auto', padding: '0 14px' },
    loader: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh', color: '#2563eb', fontWeight: 'bold' },
    
    navBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 18px', background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0, zIndex: 100, marginBottom: '15px' },
    backBtn: { display: 'flex', alignItems: 'center', gap: '6px', background: '#f8fafc', border: '1px solid #cbd5e1', padding: '7px 12px', borderRadius: '10px', cursor: 'pointer', color: '#0f172a', fontWeight: '800', fontSize: '13.5px' },
    loginBtnSmall: { display: 'flex', alignItems: 'center', gap: '4px', background: '#2563eb', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '12.5px' },
    shareIconBtn: { display: 'flex', alignItems: 'center', gap: '6px', background: '#f1f5f9', border: '1px solid #cbd5e1', cursor: 'pointer', color: '#0f172a', fontWeight: '800', fontSize: '12.5px', padding: '6px 12px', borderRadius: '8px' },

    mainGrid: { display: 'grid', gridTemplateColumns: '44% 56%', gap: '28px' },
    mobileLayout: { display: 'flex', flexDirection: 'column', gap: '15px' },
    imageColumn: { width: '100%' },
    stickyWrapper: { position: 'sticky', top: '80px' },
    galleryWrapper: { display: 'flex', gap: '12px' },
    mobileGallery: { display: 'flex', flexDirection: 'column-reverse', gap: '10px' },
    thumbStrip: { display: 'flex', flexDirection: 'column', gap: '8px' },
    mobileThumbStrip: { display: 'flex', flexDirection: 'row', gap: '8px', overflowX: 'auto', paddingBottom: '5px' },
    thumbBox: { width: '56px', height: '56px', padding: '2px', cursor: 'pointer', borderRadius: '8px', flexShrink: 0 },
    thumbImg: { width: '100%', height: '100%', objectFit: 'cover', borderRadius: '6px' },
    imageCard: { flex: 1, background: '#0f172a', borderRadius: '18px', position: 'relative', height: '420px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: '16px', boxSizing: 'border-box' },
    mobileImageCard: { width: '100%', height: '320px', background: '#0f172a', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', padding: '14px', boxSizing: 'border-box' },
    ambientGlowImg: { position: 'absolute', inset: '-20px', width: '120%', height: '120%', objectFit: 'cover', filter: 'blur(30px) saturate(180%) brightness(0.7)', opacity: 0.7, pointerEvents: 'none' },
    image: { position: 'relative', zIndex: 2, maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.4)' },
    actionRow: { display: 'flex', gap: '12px', marginTop: '16px' },
    addToCartBtn: { flex: 1, padding: '15px', background: '#f59e0b', color: '#fff', border: 'none', fontWeight: '900', borderRadius: '12px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', fontSize: '14px' },
    buyNowBtn: { flex: 1, padding: '15px', background: '#2563eb', color: '#fff', border: 'none', fontWeight: '900', borderRadius: '12px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', fontSize: '14px' },
    mobileStickyFooter: { position: 'fixed', bottom: 0, left: 0, right: 0, height: '62px', display: 'flex', background: '#fff', boxShadow: '0 -4px 15px rgba(0,0,0,0.08)', zIndex: 1000, padding: '8px 12px', gap: '10px', boxSizing: 'border-box', borderTop: '1px solid #e2e8f0' },
    mobileAddToCart: { flex: 1, background: '#f1f5f9', color: '#0f172a', border: '1px solid #cbd5e1', borderRadius: '10px', fontWeight: '900', fontSize: '13px', cursor: 'pointer' },
    mobileBuyNow: { flex: 1.3, background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: '900', fontSize: '13.5px', cursor: 'pointer' },
    disabledBtn: { flex: 1, background: '#f1f5f9', color: '#94a3b8', border: '1px solid #e2e8f0', borderRadius: '10px', fontWeight: '900', cursor: 'not-allowed', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', padding: '14px' },
    detailsColumn: { padding: '0 4px' },
    breadcrumb: { fontSize: '11.5px', color: '#64748b', marginBottom: '6px', fontWeight: '600' },
    titleText: { fontSize: '22px', color: '#0f172a', margin: '0 0 10px 0', fontWeight: '900', lineHeight: '1.3' },
    ratingRow: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' },
    ratingBadge: { background: '#16a34a', color: '#fff', padding: '4px 8px', borderRadius: '6px', fontSize: '11.5px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '4px' },
    reviewsText: { fontSize: '12px', color: '#475569', fontWeight: '700' },
    priceSection: { background: '#f8fafc', padding: '12px 14px', borderRadius: '12px', border: '1px solid #e2e8f0' },
    priceRow: { display: 'flex', alignItems: 'baseline', gap: '10px' },
    mainPrice: { fontSize: '28px', fontWeight: '900', color: '#0f172a' },
    mrpText: { fontSize: '14px', color: '#64748b', textDecoration: 'line-through', fontWeight: '600' },
    discountText: { fontSize: '13px', color: '#15803d', background: '#dcfce7', padding: '2px 8px', borderRadius: '6px', fontWeight: '900' },
    descBox: { margin: '18px 0', borderTop: '1px solid #f1f5f9', paddingTop: '14px' },
    sectionHeading: { fontSize: '15px', fontWeight: '900', color: '#0f172a', marginBottom: '8px' },
    descriptionText: { fontSize: '14px', color: '#334155', lineHeight: '1.6', whiteSpace: 'pre-wrap' },
    trustBox: { background: '#f8fafc', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '10px' },
    trustItem: { display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12.5px', color: '#334155' },
    soldOutBadge: { position: 'absolute', zIndex: 5, background: '#dc2626', color: '#fff', padding: '8px 20px', fontWeight: '900', borderRadius: '8px' }
};

export default ProductDetails;