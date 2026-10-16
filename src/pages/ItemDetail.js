import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Share2, Heart, ShoppingCart, Calendar, Store, Star, MessageCircle, Send, BadgeCheck, Trash2, Clock, MapPinOff, ShieldCheck, AlertCircle, MapPin } from 'lucide-react';
import { AppContext } from '../context/AppContext';
import { useCart } from '../context/CartContext'; 
import { toast } from 'react-toastify';

const getBackendUrl = () => {
    const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    return isLocal ? 'http://localhost:5000/api' : 'https://bhavyams-vendorhub-backend.onrender.com/api';
};

const getOptimizedImage = (url) => {
    if (!url) return 'https://via.placeholder.com/400?text=No+Image';
    let clean = String(url).replace(/["\\]/g, '');
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

// 🟢 PARSE DELIVERY ZONES (Supports ' | ' hierarchy strings and legacy commas)
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
    const looksLikeSingleHierarchy = commaParts.length >= 3 && (
        rawAreas.toLowerCase().includes('india') ||
        rawAreas.toLowerCase().includes('andhra pradesh') ||
        /\b\d{6}\b/.test(rawAreas)
    );
    if (looksLikeSingleHierarchy) {
        return [{ full: rawAreas.trim(), primary: commaParts[0], sub: commaParts.slice(1, 3).join(', ') }];
    }
    return commaParts.map(p => ({ full: p, primary: p, sub: '' }));
};

// 🟢 1ST-WORD PRIORITY + SUB-ADDRESS DELIVERY MATCHER
const checkIsDeliverableToUser = (userAddressRaw, rawDeliveryAreas) => {
    const zones = parseDeliveryZones(rawDeliveryAreas);
    if (zones.some(z => ['all', 'india', 'all india'].includes(z.primary.toLowerCase()))) {
        return true;
    }
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
            const subParts = zoneParts.slice(1);
            return subParts.some(sub => normUserFull.includes(sub));
        }
        return true;
    });
};

const getBasicAreaName = (fullAddress) => {
    if (!fullAddress) return 'your area';
    const parts = fullAddress.split(',').map(p => p.trim()).filter(Boolean);
    if (parts.length === 1) return parts[0];
    const firstPart = parts[0].toLowerCase();
    const looksLikeDoorNo = /^\d/.test(firstPart) || firstPart.includes('door') || firstPart.includes('flat') || firstPart.includes('plot') || firstPart.includes('d.no');
    return (looksLikeDoorNo && parts.length > 1) ? parts[1] : parts[0];
};

const translations = {
    en: {
        soldBy: "Sold & Managed by",
        viewStore: "Visit Store →",
        productDetails: "Item Description & Details",
        noDesc: "No extra description provided by the vendor.",
        qa: "Customer Questions & Notes",
        askPlaceholder: "Ask a question about this item...",
        noQuestions: "No questions yet. Be the first to ask!",
        quantity: "Unit / Measurement",
        availability: "Current Status",
        inStock: "Available",
        outOfStock: "Currently Unavailable",
        fewLeft: "Limited Availability",
        only: "Only",
        left: "left!",
        bookService: "Send Booking Request",
        addToCart: "Add to Booking List",
        inclusiveTaxes: "Direct local vendor price • Pay on Delivery",
        callNotice: "Privacy Protected: Your phone number stays hidden. You can message or web-call the vendor directly.",
        totalPrice: "Estimated Total"
    },
    te: {
        soldBy: "విక్రేత & నిర్వహణ",
        viewStore: "స్టోర్ చూడండి →",
        productDetails: "ఉత్పత్తి వివరాలు",
        noDesc: "విక్రేత అదనపు వివరణ ఇవ్వలేదు.",
        qa: "ప్రశ్నలు & సమాధానాలు",
        askPlaceholder: "ఈ వస్తువు గురించి ప్రశ్న అడగండి...",
        noQuestions: "ఇంకా ప్రశ్నలు లేవు. మీరే మొదట అడగండి!",
        quantity: "పరిమాణం / యూనిట్",
        availability: "లభ్యత",
        inStock: "అందుబాటులో ఉంది",
        outOfStock: "స్టాక్ లేదు",
        fewLeft: "కొన్ని మాత్రమే ఉన్నాయి",
        only: "కేవలం",
        left: "మాత్రమే మిగిలి ఉన్నాయి!",
        bookService: "సేవను బుక్ చేయండి",
        addToCart: "బుకింగ్ జాబితాకు జోడించండి",
        inclusiveTaxes: "లోకల్ షాప్ ధర • డెలివరీ తర్వాత చెల్లింపు",
        callNotice: "గోప్యత రక్షణ: మీ ఫోన్ నంబర్ కనిపించదు. మీరు యాప్ ద్వారా నేరుగా మెసేజ్ లేదా కాల్ చేయవచ్చు.",
        totalPrice: "మొత్తం ధర"
    }
};

const ItemDetail = () => {
    const { itemId } = useParams();
    const navigate = useNavigate();
    
    const { language } = useContext(AppContext);
    const { addToCart } = useCart(); 

    const lang = language === 'te' ? 'te' : 'en';
    const t = translations[lang];

    const userStr = localStorage.getItem('user');
    const currentUser = userStr && userStr !== 'undefined' ? JSON.parse(userStr) : null;
    const customLocStr = localStorage.getItem('custom_hub_location');
    const customLocation = customLocStr && customLocStr !== 'undefined' ? JSON.parse(customLocStr) : null;
    const isMasterAdmin = Boolean(currentUser && (currentUser.email === 'pavanvenkat63@gmail.com' || currentUser.role === 'admin'));

    const [item, setItem] = useState(null);
    const [shopInfo, setShopInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    
    const [activeImage, setActiveImage] = useState('');
    const [gallery, setGallery] = useState([]);
    const [isLiked, setIsLiked] = useState(false);
    const [quantity, setQuantity] = useState(1);

    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [isPlacingOrder, setIsPlacingOrder] = useState(false);

    const [rawDeliveryAreas, setRawDeliveryAreas] = useState('All');
    const [trueShopId, setTrueShopId] = useState(null);
    const [hasRequested, setHasRequested] = useState(false);

    useEffect(() => {
        const fetchItemDetail = async () => {
            try {
                const BACKEND_URL = getBackendUrl();
                const res = await axios.get(`${BACKEND_URL}/products/detail/${itemId}`);
                
                const productData = res.data;
                setItem(productData);
                
                let parsedGallery = [];
                try {
                    parsedGallery = productData.gallery ? JSON.parse(productData.gallery) : [];
                } catch (e) {
                    parsedGallery = productData.image_url ? [productData.image_url] : []; 
                }
                if (!Array.isArray(parsedGallery) || parsedGallery.length === 0) {
                    parsedGallery = productData.image_url ? [productData.image_url] : [];
                }
                const cleanGallery = parsedGallery.filter(Boolean).map(getOptimizedImage);

                setGallery(cleanGallery);
                setActiveImage(cleanGallery[0] || 'https://via.placeholder.com/400?text=No+Image');

                const shopIdToFetch = productData.shop_id || productData.vendor_id;
                if (shopIdToFetch) {
                    try {
                        const shopRes = await axios.get(`${BACKEND_URL}/shops/${shopIdToFetch}`);
                        const sData = shopRes.data.shop;
                        setShopInfo(sData);
                        setTrueShopId(sData.id); 
                        setRawDeliveryAreas(sData.delivery_areas || 'All');
                    } catch (e) {
                        setRawDeliveryAreas(productData.delivery_areas || 'All');
                    }
                }
            } catch (err) {
                console.error("Error fetching item details:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchItemDetail();
    }, [itemId]);

    const isOfficialApp = Boolean(shopInfo && (
        String(shopInfo.user_id) === "1" || 
        shopInfo.user_email === 'pavanvenkat63@gmail.com' || 
        shopInfo.email === 'pavanvenkat63@gmail.com'
    ));
    const isVerified = Boolean(shopInfo && (shopInfo.is_verified === true || String(shopInfo.is_verified).toLowerCase() === 'true'));
    const shopAccountStatus = shopInfo?.account_status || item?.account_status || 'active';
    const isShopSuspended = shopAccountStatus === 'temp_block' || shopAccountStatus === 'perma_banned';

    const renderBadge = () => {
        if (shopAccountStatus === 'perma_banned') return <span style={{ background: '#0f172a', color: 'white', padding: '2px 8px', borderRadius: '10px', fontSize: '10px', fontWeight: '900', marginLeft: '6px' }}>⬛ Banned</span>;
        if (shopAccountStatus === 'temp_block') return <span style={{ background: '#fef2f2', color: '#dc2626', padding: '2px 8px', borderRadius: '10px', fontSize: '10px', fontWeight: '900', border: '1px solid #fecaca', marginLeft: '6px' }}>🟥 Suspended</span>;
        if (isOfficialApp) return <BadgeCheck size={17} color="#ffffff" fill="#FFD700" style={{ marginLeft: '4px' }} />;
        if (isVerified) return <BadgeCheck size={17} color="#ffffff" fill="#10b981" style={{ marginLeft: '4px' }} />;
        return <BadgeCheck size={17} color="#ffffff" fill="#3b82f6" style={{ marginLeft: '4px' }} />;
    };

    // 🟢 CHECK DELIVERY ELIGIBILITY AGAINST USER'S SELECTED MAP AREA OR PROFILE ADDRESS
    const activeUserAddress = customLocation?.address || currentUser?.address || '';
    const isDeliverable = isMasterAdmin ? true : checkIsDeliverableToUser(activeUserAddress, rawDeliveryAreas);
    const shortDisplayArea = getBasicAreaName(activeUserAddress);

    const parsedZones = parseDeliveryZones(rawDeliveryAreas);
    const formattedDeliveryLabel = parsedZones.map(z => z.sub ? `${z.primary} (${z.sub})` : z.primary).join(' • ');

    const handleRequestDelivery = async () => {
        if (!currentUser) {
            toast.info("Please login to request delivery!");
            navigate('/welcome');
            return;
        }
        const targetShop = trueShopId || item?.shop_id;
        if (!targetShop) return toast.error("Error linking to shop.");
        
        try {
            const token = localStorage.getItem('token');
            const basicUserAddress = activeUserAddress || 'Unknown Location'; 
            await axios.post(`${getBackendUrl()}/shops/${targetShop}/request-delivery`, { area_name: basicUserAddress }, { headers: { Authorization: `Bearer ${token}` } });
            toast.success(`🚀 Request for ${shortDisplayArea} sent to the shop owner!`);
            setHasRequested(true);
        } catch (err) { toast.error("Failed to send request."); }
    };

    const handleWhatsAppShare = () => {
        const text = `🛍️ Check out *${item?.name}* (₹${item?.price}) from *${item?.business_name || 'Subhams Hub'}*:\n${window.location.href}`;
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    };

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({ title: item?.name, text: `Check out ${item?.name} on Subhams Hub!`, url: window.location.href });
            } catch (err) {}
        } else {
            navigator.clipboard.writeText(window.location.href);
            toast.success("Link copied to clipboard!");
        }
    };

    const handleAddComment = (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;
        const commentObj = { id: Date.now(), user: currentUser ? (currentUser.username || currentUser.name) : "Guest User", text: newComment, time: "Just now" };
        setComments([commentObj, ...comments]);
        setNewComment('');
    };

    const handleDeleteComment = (commentId) => {
        if (window.confirm("Delete this question?")) {
            setComments(comments.filter(c => c.id !== commentId));
        }
    };

    if (loading) return <div style={styles.loading}>Loading item details...</div>;
    if (!item) return <div style={styles.loading}>Item not found.</div>;

    const isOwner = currentUser && (String(currentUser.id) === String(item.vendor_id) || isMasterAdmin);

    const sellPrice = Number(item.price) || 0;
    const mrp = Number(item.mrp) || 0;
    const discount = mrp > sellPrice ? Math.round(((mrp - sellPrice) / mrp) * 100) : 0;
    
    const totalPrice = sellPrice * quantity;
    const isService = item.unit_type === 'Service' || item.unit_type === 'Hour';
    const stockCount = Number(item.stock_count) || 0;

    let stockDisplay = ""; let stockColor = "";
    if (isShopSuspended) { stockDisplay = "Shop Suspended"; stockColor = "#dc2626"; }
    else if (stockCount > 10) { stockDisplay = t.inStock; stockColor = "#16a34a"; } 
    else if (stockCount <= 10 && stockCount > 5) { stockDisplay = t.fewLeft; stockColor = "#f59e0b"; } 
    else if (stockCount <= 5 && stockCount > 0) { stockDisplay = `${t.only} ${stockCount} ${t.left}`; stockColor = "#ef4444"; } 
    else { stockDisplay = t.outOfStock; stockColor = "#ef4444"; }

    const handleQuantity = (type) => {
        if (type === 'minus' && quantity > 1) setQuantity(quantity - 1);
        if (type === 'plus' && quantity < stockCount) setQuantity(quantity + 1);
    };

    const handleAddToCart = (orderType) => {
        if (isShopSuspended) {
            return toast.error("This shop is currently suspended. Bookings are disabled.");
        }
        if (!currentUser) {
            toast.info("Please log in to book items."); 
            navigate('/welcome'); 
            return;
        }
        if (!isDeliverable) {
            handleRequestDelivery();
            return;
        }

        setIsPlacingOrder(true);
        const newItem = {
            id: item.id,
            name: item.name,
            price: sellPrice,
            quantity: quantity,
            qty: quantity,
            image: activeImage || item.image_url,
            vendor_id: item.vendor_id,
            shop_id: trueShopId || item.shop_id || item.vendor_id,
            order_type: orderType,
            total_price: totalPrice
        };

        let currentCart = JSON.parse(localStorage.getItem('subhams_cart') || '[]');
        currentCart = currentCart.filter(c => c.id !== item.id); 
        currentCart.push(newItem);
        localStorage.setItem('subhams_cart', JSON.stringify(currentCart));

        setTimeout(() => { if (addToCart) addToCart(newItem); }, 0);
        setTimeout(() => { navigate('/my-orders', { state: { forceTab: 'list' } }); }, 250);
    };

    const renderTrustBox = () => {
        if (isShopSuspended) {
            return (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '12px 15px', borderRadius: '12px', marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                    <AlertCircle size={22} color="#dc2626" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div>
                        <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#991b1b', fontWeight: '900' }}>Shop Restricted by Subhams Hub Admin</p>
                        <p style={{ margin: 0, fontSize: '11.5px', color: '#dc2626', fontWeight: '700' }}>New bookings for this shop are currently paused.</p>
                    </div>
                </div>
            );
        }
        if (isOfficialApp) {
            return (
                <div style={{ background: '#fffbeb', border: '1px solid #fde68a', padding: '12px 15px', borderRadius: '12px', marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                    <ShieldCheck size={24} color="#d97706" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div>
                        <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#b45309', fontWeight: '900' }}>🌟 100% Trust: Official Subhams Hub Store</p>
                        <p style={{ margin: 0, fontSize: '11.5px', color: '#d97706', fontWeight: '700', lineHeight: '1.4' }}>
                            Managed directly by Subhams Hub. Guaranteed quality & support.<br/> 
                            అధికారిక సుభమ్స్ హబ్ స్టోర్. మీరు ఇక్కడ సురక్షితంగా బుక్ చేయవచ్చు.
                        </p>
                    </div>
                </div>
            );
        }
        if (isVerified) {
            return (
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '12px 15px', borderRadius: '12px', marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                    <BadgeCheck size={24} color="#15803d" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div>
                        <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#15803d', fontWeight: '900' }}>✅ Verified Local Business (Hosted on Subhams Hub)</p>
                        <p style={{ margin: 0, fontSize: '11.5px', color: '#16a34a', fontWeight: '700', lineHeight: '1.4' }}>
                            Identity verified by Admin. Book for ₹0 online and pay upon delivery.<br/>
                            ధృవీకరించబడిన లోకల్ షాప్. ఆన్‌లైన్‌లో ₹0 తో బుక్ చేసి, డెలివరీ సమయంలో చెల్లించండి.
                        </p>
                    </div>
                </div>
            );
        }
        return (
            <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', padding: '12px 15px', borderRadius: '12px', marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                <AlertCircle size={24} color="#1d4ed8" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                    <p style={{ margin: '0 0 4px 0', fontSize: '12.5px', color: '#1e3a8a', fontWeight: '900' }}>🔹 Independent Local Shop (Standard Tier)</p>
                    <p style={{ margin: 0, fontSize: '11.5px', color: '#2563eb', fontWeight: '600', lineHeight: '1.4' }}>
                        Do not pay money in advance. Inspect the item and use Cash/UPI on Delivery.<br/>
                        ముందుగా డబ్బు చెల్లించవద్దు. వస్తువును చూసిన తర్వాతే చెల్లించండి (COD).
                    </p>
                </div>
            </div>
        );
    };

    return (
        <div style={styles.page}>
            <div style={styles.appContainer}>
                
                {/* TOP NAVIGATION */}
                <div style={styles.navBar}>
                    <button onClick={() => navigate(-1)} style={styles.iconBtn}>
                        <ArrowLeft size={20} color="#0f172a" />
                    </button>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <button onClick={handleWhatsAppShare} style={{ background: '#dcfce7', color: '#15803d', border: '1px solid #86efac', padding: '7px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '900', cursor: 'pointer' }}>
                            📲 WhatsApp
                        </button>
                        <button onClick={() => setIsLiked(!isLiked)} style={styles.iconBtn}>
                            <Heart size={20} color={isLiked ? "#ef4444" : "#0f172a"} fill={isLiked ? "#ef4444" : "transparent"} />
                        </button>
                        <button onClick={handleShare} style={styles.iconBtn}>
                            <Share2 size={20} color="#0f172a" />
                        </button>
                    </div>
                </div>

                {/* 🎨 AMBIENT IMAGE GALLERY */}
                <div style={styles.galleryContainer}>
                    <div style={styles.mainImageWrapper}>
                        <img src={activeImage} alt="" aria-hidden="true" style={styles.ambientImageGlow} />
                        <img src={activeImage} alt={item.name} style={styles.mainImage} crossOrigin="anonymous" referrerPolicy="no-referrer" />
                    </div>
                    {gallery.length > 1 && (
                        <div style={styles.thumbnailRow}>
                            {gallery.map((imgUrl, index) => (
                                <div key={index} onClick={() => setActiveImage(imgUrl)}
                                    style={{...styles.thumbnailWrapper, borderColor: activeImage === imgUrl ? '#2563eb' : '#cbd5e1'}}>
                                    <img src={imgUrl} alt={`thumb-${index}`} style={styles.thumbnail} crossOrigin="anonymous" referrerPolicy="no-referrer" />
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* CORE INFO */}
                <div style={styles.detailsContainer}>
                    
                    {!isDeliverable && !isMasterAdmin && (
                        <div style={{ background: '#fffbeb', border: '1px solid #fcd34d', padding: '12px 14px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', marginBottom: '15px', flexWrap: 'wrap' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#b45309', fontSize: '12.5px', fontWeight: '800' }}>
                                <MapPinOff size={16} color="#d97706" style={{flexShrink: 0}} />
                                <span>Out of delivery zone for <strong>{shortDisplayArea}</strong></span>
                            </div>
                            <button onClick={handleRequestDelivery} disabled={hasRequested} style={{ background: hasRequested ? '#cbd5e1' : '#d97706', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '8px', fontSize: '11.5px', fontWeight: '800', cursor: 'pointer' }}>
                                {hasRequested ? 'Requested ✓' : 'Request Delivery'}
                            </button>
                        </div>
                    )}

                    <h1 style={styles.itemName}>{item.name}</h1>

                    <div style={styles.pricingBlock}>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', flexWrap: 'wrap' }}>
                            <span style={styles.sellPrice}>₹{sellPrice}</span>
                            {mrp > sellPrice && (
                                <span style={styles.mrpPrice}>M.R.P: ₹{mrp}</span>
                            )}
                            {discount > 0 && <span style={styles.discountPill}>{discount}% OFF</span>}
                        </div>
                        <p style={styles.taxText}>{t.inclusiveTaxes}</p>
                    </div>

                    <div style={styles.specsRow}>
                        <div style={styles.specBox}>
                            <span style={styles.specLabel}>{t.quantity}</span>
                            <span style={styles.specValue}>{item.unit_value || 1} {item.unit_type || 'Piece'}</span>
                        </div>
                        <div style={styles.specBox}>
                            <span style={styles.specLabel}>{t.availability}</span>
                            <span style={{ fontSize: '14px', fontWeight: '800', color: stockColor }}>
                                {stockDisplay}
                            </span>
                        </div>
                    </div>

                    {/* 🚚 PUBLIC SHOP DELIVERY ZONES */}
                    <div style={{ margin: '0 0 18px 0', padding: '12px 14px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                        <MapPin size={18} color="#16a34a" style={{ marginTop: '2px', flexShrink: 0 }} />
                        <div>
                            <span style={{ fontSize: '10.5px', color: '#64748b', fontWeight: '900', display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>
                                🚚 Shop Delivery Zones:
                            </span>
                            <span style={{ fontSize: '13.5px', color: '#0f172a', fontWeight: '800', lineHeight: '1.4' }}>
                                {formattedDeliveryLabel}
                            </span>
                        </div>
                    </div>

                    {renderTrustBox()}

                    <div style={styles.divider} />

                    {/* VENDOR CARD */}
                    <div style={styles.vendorCard} onClick={() => navigate(`/shop/${trueShopId || item.shop_id || item.vendor_id}`)}>
                        <div style={styles.vendorIconArea}>
                            <Store size={22} color="#2563eb" />
                        </div>
                        <div style={{ flex: 1 }}>
                            <span style={styles.vendorLabel}>{t.soldBy}</span>
                            <h4 style={styles.vendorName}>
                                {item.business_name || shopInfo?.business_name || 'Local Vendor'} 
                                {renderBadge()}
                            </h4>
                        </div>
                        <span style={{fontSize: '12.5px', color: '#2563eb', fontWeight: '900'}}>{t.viewStore}</span>
                    </div>

                    <div style={styles.divider} />

                    <div style={styles.section}>
                        <h3 style={styles.sectionTitle}>{t.productDetails}</h3>
                        <p style={styles.description}>
                            {item.description || t.noDesc}
                        </p>
                    </div>

                    <div style={styles.section}>
                        <h3 style={styles.sectionTitle}><MessageCircle size={18} /> {t.qa}</h3>
                        <form onSubmit={handleAddComment} style={styles.commentForm}>
                            <input type="text" placeholder={t.askPlaceholder} style={styles.commentInput} value={newComment} onChange={(e) => setNewComment(e.target.value)} />
                            <button type="submit" style={styles.sendBtn} disabled={!newComment.trim()}>
                                <Send size={16} color="white" />
                            </button>
                        </form>

                        <div style={styles.commentsList}>
                            {comments.length === 0 ? (
                                <p style={{ color: '#94a3b8', fontSize: '13px', textAlign: 'center' }}>{t.noQuestions}</p>
                            ) : (
                                comments.map(comment => (
                                    <div key={comment.id} style={styles.commentCard}>
                                        <div style={styles.commentHeader}>
                                            <div>
                                                <span style={styles.commentUser}>{comment.user}</span>
                                                <span style={styles.commentTime}>{comment.time}</span>
                                            </div>
                                            {isOwner && (
                                                <button onClick={() => handleDeleteComment(comment.id)} style={styles.deleteCommentBtn}>
                                                    <Trash2 size={14} color="#ef4444" />
                                                </button>
                                            )}
                                        </div>
                                        <p style={styles.commentText}>{comment.text}</p>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* STICKY BOTTOM ACTION BAR */}
                <div style={styles.bottomActionBar}>
                    <div style={styles.callNoticeBox}>
                        <Clock size={13} style={{ flexShrink: 0 }} />
                        <span>{t.callNotice}</span>
                    </div>
                    
                    <div style={styles.actionButtonsRow}>
                        <div style={styles.bottomPriceBox}>
                            <span style={styles.bottomPriceLabel}>{t.totalPrice}</span>
                            <span style={styles.bottomPriceValue}>₹{totalPrice}</span>
                        </div>

                        <div style={{ display: 'flex', gap: '10px', flex: 1, justifyContent: 'flex-end' }}>
                            {!isDeliverable && !isMasterAdmin ? (
                                <button 
                                    onClick={handleRequestDelivery}
                                    disabled={hasRequested}
                                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: hasRequested ? '#cbd5e1' : '#d97706', color: 'white', border: 'none', padding: '0 18px', height: '46px', borderRadius: '12px', fontWeight: '800', fontSize: '13.5px', cursor: hasRequested ? 'default' : 'pointer' }}
                                >
                                    <MapPinOff size={16} /> {hasRequested ? 'Request Sent ✓' : `Request in ${shortDisplayArea}`}
                                </button>
                            ) : isService ? (
                                <button 
                                    style={{...styles.bookBtn, opacity: (isPlacingOrder || isShopSuspended) ? 0.6 : 1}} 
                                    onClick={() => handleAddToCart('Service')}
                                    disabled={isPlacingOrder || isShopSuspended}
                                >
                                    <Calendar size={18} /> {isPlacingOrder ? "Opening..." : t.bookService}
                                </button>
                            ) : (
                                <>
                                    <div style={styles.qtyBox}>
                                        <button onClick={() => handleQuantity('minus')} style={styles.qtyBtn}>-</button>
                                        <span style={styles.qtyText}>{quantity}</span>
                                        <button onClick={() => handleQuantity('plus')} style={styles.qtyBtn} disabled={quantity >= stockCount}>+</button>
                                    </div>
                                    <button 
                                        style={{...styles.addToCartBtn, opacity: (stockCount === 0 || isPlacingOrder || isShopSuspended) ? 0.6 : 1}} 
                                        onClick={() => handleAddToCart('Product')} 
                                        disabled={stockCount === 0 || isPlacingOrder || isShopSuspended}
                                    >
                                        <ShoppingCart size={18} /> {isPlacingOrder ? "Adding..." : t.addToCart}
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const styles = {
    page: { background: '#f1f5f9', minHeight: '100vh', fontFamily: 'Inter, system-ui, sans-serif' },
    appContainer: { maxWidth: '800px', margin: '0 auto', background: '#ffffff', minHeight: '100vh', position: 'relative', paddingBottom: '150px', boxShadow: '0 0 25px rgba(0,0,0,0.05)' },
    loading: { textAlign: 'center', padding: '80px 20px', fontWeight: 'bold', color: '#64748b' },
    
    navBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', position: 'sticky', top: 0, zIndex: 30, background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #f1f5f9' },
    iconBtn: { width: '38px', height: '38px', borderRadius: '50%', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e2e8f0', cursor: 'pointer' },
    
    galleryContainer: { background: '#ffffff', width: '100%' },
    mainImageWrapper: { position: 'relative', width: '100%', height: '360px', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: '16px', boxSizing: 'border-box' },
    ambientImageGlow: { position: 'absolute', inset: '-20px', width: '120%', height: '120%', objectFit: 'cover', filter: 'blur(32px) saturate(180%) brightness(0.7)', opacity: 0.7, pointerEvents: 'none' },
    mainImage: { position: 'relative', zIndex: 2, maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: '14px', boxShadow: '0 12px 30px rgba(0,0,0,0.35)' },
    thumbnailRow: { display: 'flex', gap: '10px', padding: '12px 16px', overflowX: 'auto', borderBottom: '1px solid #f1f5f9', background: '#fff' },
    thumbnailWrapper: { width: '56px', height: '56px', borderRadius: '10px', border: '2px solid', padding: '2px', cursor: 'pointer', flexShrink: 0 },
    thumbnail: { width: '100%', height: '100%', borderRadius: '6px', objectFit: 'cover' },
    
    detailsContainer: { padding: '20px 16px', background: '#ffffff' },
    itemName: { margin: '0 0 10px 0', fontSize: '21px', fontWeight: '900', color: '#0f172a', lineHeight: '1.35' },
    
    pricingBlock: { marginBottom: '18px', background: '#f8fafc', padding: '12px 14px', borderRadius: '14px', border: '1px solid #e2e8f0' },
    sellPrice: { fontSize: '28px', fontWeight: '900', color: '#0f172a' },
    mrpPrice: { fontSize: '14px', color: '#64748b', textDecoration: 'line-through', fontWeight: '600' },
    discountPill: { background: '#dcfce7', color: '#15803d', fontSize: '12px', fontWeight: '900', padding: '3px 8px', borderRadius: '8px' },
    taxText: { fontSize: '12px', color: '#16a34a', fontWeight: '700', margin: '4px 0 0 0' },
    
    specsRow: { display: 'flex', gap: '12px', marginBottom: '16px' },
    specBox: { flex: 1, background: '#f8fafc', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0' },
    specLabel: { display: 'block', fontSize: '10.5px', color: '#64748b', textTransform: 'uppercase', fontWeight: '800', marginBottom: '4px' },
    specValue: { fontSize: '14px', color: '#0f172a', fontWeight: '800' },
    
    divider: { height: '6px', background: '#f1f5f9', margin: '0 -16px 18px -16px' },
    
    vendorCard: { display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', background: '#f8fafc', borderRadius: '14px', border: '1px solid #e2e8f0', cursor: 'pointer', marginBottom: '18px' },
    vendorIconArea: { width: '44px', height: '44px', background: '#eff6ff', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    vendorLabel: { fontSize: '11px', color: '#64748b', fontWeight: '700' },
    vendorName: { margin: 0, fontSize: '15px', color: '#0f172a', fontWeight: '900', display: 'flex', alignItems: 'center', flexWrap: 'wrap' },
    
    section: { marginBottom: '22px' },
    sectionTitle: { margin: '0 0 10px 0', fontSize: '16px', fontWeight: '900', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' },
    description: { fontSize: '14px', color: '#334155', lineHeight: '1.6', margin: 0, whiteSpace: 'pre-wrap' },
    
    commentForm: { display: 'flex', gap: '8px', marginBottom: '16px' },
    commentInput: { flex: 1, padding: '12px 14px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '14px', background: '#f8fafc', outline: 'none' },
    sendBtn: { background: '#2563eb', border: 'none', borderRadius: '12px', width: '46px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },
    
    commentsList: { display: 'flex', flexDirection: 'column', gap: '10px' },
    commentCard: { background: '#f8fafc', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0' },
    commentHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' },
    commentUser: { fontSize: '13px', fontWeight: '800', color: '#0f172a', display: 'block' },
    commentTime: { fontSize: '11px', color: '#94a3b8' },
    commentText: { margin: 0, fontSize: '13px', color: '#334155', lineHeight: '1.4' },
    deleteCommentBtn: { background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px' },
    
    bottomActionBar: { position: 'fixed', bottom: 0, left: 0, right: 0, maxWidth: '800px', margin: '0 auto', background: '#ffffff', borderTop: '1px solid #e2e8f0', zIndex: 100, boxShadow: '0 -8px 20px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column' },
    callNoticeBox: { background: '#eff6ff', color: '#1e3a8a', fontSize: '11px', fontWeight: '800', padding: '7px 14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', borderBottom: '1px solid #bfdbfe', textAlign: 'center' },
    actionButtonsRow: { padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' },
    
    bottomPriceBox: { display: 'flex', flexDirection: 'column', minWidth: '85px' },
    bottomPriceLabel: { fontSize: '10px', color: '#64748b', fontWeight: '800', textTransform: 'uppercase' },
    bottomPriceValue: { fontSize: '20px', fontWeight: '900', color: '#0f172a' },
    
    qtyBox: { display: 'flex', alignItems: 'center', border: '1.5px solid #cbd5e1', borderRadius: '10px', background: '#f8fafc', overflow: 'hidden', height: '46px' },
    qtyBtn: { background: 'transparent', border: 'none', padding: '0 12px', fontSize: '18px', fontWeight: '900', color: '#0f172a', cursor: 'pointer', height: '100%' },
    qtyText: { fontSize: '15px', fontWeight: '900', width: '26px', textAlign: 'center' },
    
    addToCartBtn: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#ffffff', border: 'none', padding: '0 18px', height: '46px', borderRadius: '12px', fontWeight: '900', fontSize: '14px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(217, 119, 6, 0.25)' },
    bookBtn: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: '#ffffff', border: 'none', padding: '0 18px', height: '46px', borderRadius: '12px', fontWeight: '900', fontSize: '14px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)' }
};

export default ItemDetail;