import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Share2, Heart, ShoppingCart, Calendar, Store, Star, MessageCircle, Send, BadgeCheck, AlertTriangle, Trash2, Clock } from 'lucide-react';
import { AppContext } from '../context/AppContext';
import { useCart } from '../context/CartContext'; // 🟢 FIXED: Added Cart Context

const getBackendUrl = () => {
    return process.env.NODE_ENV === 'production' 
        ? 'https://bhavyams-vendorhub-backend.onrender.com/api' 
        : 'http://localhost:5000/api';
};

// 🌐 TRANSLATIONS (Grammar Fixed)
const translations = {
    en: {
        soldBy: "Sold & Managed by",
        viewStore: "View Store",
        productDetails: "Product Details",
        noDesc: "No description provided by the vendor.",
        qa: "Community Q&A",
        askPlaceholder: "Ask a question about this item...",
        noQuestions: "No questions yet. Be the first to ask!",
        quantity: "Quantity / Unit",
        availability: "Availability",
        inStock: "In Stock",
        outOfStock: "Out of Stock",
        fewLeft: "Few left - Order soon",
        only: "Only",
        left: "left in stock!",
        bookService: "Book Service",
        addToCart: "Add Item",
        inclusiveTaxes: "Inclusive of all taxes",
        
        // RED Disclaimer Strings
        disclaimerTitle: "Important: Verify Before Payment",
        disclaimer1: "Direct from Vendors: Bookings are fulfilled directly by local partners.",
        disclaimer2: "Call to Verify: Confirm quality, exact pricing, and delivery details.",
        disclaimer3: "Privacy Protected: Your phone number is safely hidden.",
        
        // 1 Hour Rule & Total Price
        callNotice: "Note: The vendor will call you after booking. Your phone number remains safely hidden.",
        totalPrice: "Total Price"
    },
    te: {
        soldBy: "విక్రేత",
        viewStore: "స్టోర్ చూడండి",
        productDetails: "ఉత్పత్తి వివరాలు",
        noDesc: "విక్రేత వివరణ ఇవ్వలేదు.",
        qa: "ప్రశ్నలు & సమాధానాలు",
        askPlaceholder: "ఈ వస్తువు గురించి ప్రశ్న అడగండి...",
        noQuestions: "ఇంకా ప్రశ్నలు లేవు. మీరే మొదట అడగండి!",
        quantity: "పరిమాణం / యూనిట్",
        availability: "లభ్యత",
        inStock: "స్టాక్ లో ఉంది",
        outOfStock: "స్టాక్ లేదు",
        fewLeft: "కొన్ని మాత్రమే ఉన్నాయి - త్వరగా ఆర్డర్ చేయండి",
        only: "కేవలం",
        left: "మాత్రమే మిగిలి ఉన్నాయి!",
        bookService: "సేవను బుక్ చేయండి",
        addToCart: "వస్తువును జోడించండి",
        inclusiveTaxes: "అన్ని పన్నులతో కలిపి",

        // RED Disclaimer Strings
        disclaimerTitle: "ముఖ్య గమనిక: చెల్లింపునకు ముందు నిర్ధారించుకోండి",
        disclaimer1: "నేరుగా విక్రేతల నుండి: బుకింగ్‌లు స్థానిక వ్యాపారుల ద్వారా నిర్వహించబడతాయి.",
        disclaimer2: "ధృవీకరించడానికి కాల్ చేయండి: నాణ్యత, ఖచ్చితమైన ధర మరియు డెలివరీ వివరాలను నిర్ధారించుకోండి.",
        disclaimer3: "గోప్యత రక్షించబడింది: మీ ఫోన్ నంబర్ సురక్షితంగా దాచబడుతుంది.",
        
        // 1 Hour Rule & Total Price
        callNotice: "గమనిక: బుకింగ్ తర్వాత విక్రేత మీకు కాల్ చేస్తారు. మీ ఫోన్ నంబర్ గోప్యంగా ఉంచబడుతుంది.",
        totalPrice: "మొత్తం ధర"
    }
};

const ItemDetail = () => {
    const { itemId } = useParams();
    const navigate = useNavigate();
    
    // 🟢 GLOBAL CONTEXTS
    const { language } = useContext(AppContext);
    const { addToCart } = useCart(); // 🟢 FIXED: Grab the addToCart function

    const lang = language === 'te' ? 'te' : 'en';
    const t = translations[lang];

    // Auth & Permissions
    const userStr = localStorage.getItem('user');
    const currentUser = userStr && userStr !== 'undefined' ? JSON.parse(userStr) : null;
    
    const [item, setItem] = useState(null);
    const [loading, setLoading] = useState(true);
    
    const [activeImage, setActiveImage] = useState('');
    const [gallery, setGallery] = useState([]);
    const [isLiked, setIsLiked] = useState(false);
    const [quantity, setQuantity] = useState(1);

    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [isPlacingOrder, setIsPlacingOrder] = useState(false);

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
                    parsedGallery = [productData.image_url]; 
                }
                
                if (parsedGallery.length === 0 && productData.image_url) {
                    parsedGallery = [productData.image_url];
                }

                setGallery(parsedGallery);
                setActiveImage(parsedGallery[0] || 'https://via.placeholder.com/400');

            } catch (err) {
                console.error("Error fetching item details:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchItemDetail();
    }, [itemId]);

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: item?.name,
                    text: `Check out ${item?.name} on Subhams Hub!`,
                    url: window.location.href
                });
            } catch (err) { console.log('Share canceled', err); }
        } else {
            navigator.clipboard.writeText(window.location.href);
            alert("Link copied to clipboard!");
        }
    };

    const handleAddComment = (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;
        
        const commentObj = {
            id: Date.now(),
            user: currentUser ? currentUser.name : "Guest User", 
            text: newComment,
            time: "Just now"
        };
        
        setComments([commentObj, ...comments]);
        setNewComment('');
    };

    const handleDeleteComment = (commentId) => {
        if (window.confirm("Delete this comment?")) {
            setComments(comments.filter(c => c.id !== commentId));
        }
    };

    if (loading) return <div style={styles.loading}>Loading item details...</div>;
    if (!item) return <div style={styles.loading}>Item not found.</div>;

    const isOwner = currentUser && (String(currentUser.id) === String(item.vendor_id) || currentUser.role === 'admin');

    const sellPrice = Number(item.price) || 0;
    const mrp = Number(item.mrp) || 0;
    const discount = mrp > sellPrice ? Math.round(((mrp - sellPrice) / mrp) * 100) : 0;
    
    const totalPrice = sellPrice * quantity;
    const isService = item.unit_type === 'Service' || item.unit_type === 'Hour';
    const stockCount = Number(item.stock_count) || 0;

    let stockDisplay = "";
    let stockColor = "";
    if (stockCount > 10) {
        stockDisplay = t.inStock;
        stockColor = "#16a34a"; 
    } else if (stockCount <= 10 && stockCount > 5) {
        stockDisplay = t.fewLeft;
        stockColor = "#f59e0b"; 
    } else if (stockCount <= 5 && stockCount > 0) {
        stockDisplay = `${t.only} ${stockCount} ${t.left}`;
        stockColor = "#ef4444"; 
    } else {
        stockDisplay = t.outOfStock;
        stockColor = "#ef4444"; 
    }

    const handleQuantity = (type) => {
        if (type === 'minus' && quantity > 1) setQuantity(quantity - 1);
        if (type === 'plus' && quantity < stockCount) setQuantity(quantity + 1);
    };

// 🟢 FIXED: Add To Cart Logic (Prevents React Context Crashes)
    const handleAddToCart = (orderType) => {
        if (!currentUser) {
            alert("Please log in to add items.");
            return;
        }

        setIsPlacingOrder(true);

        const newItem = {
            id: item.id,
            name: item.name,
            price: sellPrice,
            quantity: quantity, // 🟢 FORCE EXACT QUANTITY
            qty: quantity,      // 🟢 Backup variable
            image: activeImage || item.image_url,
            vendor_id: item.vendor_id,
            shop_id: item.shop_id || item.vendor_id,
            order_type: orderType,
            total_price: totalPrice
        };

        // 1. Force save to LocalStorage immediately
        let currentCart = JSON.parse(localStorage.getItem('subhams_cart') || '[]');
        currentCart = currentCart.filter(c => c.id !== item.id); // Remove duplicate if exists
        currentCart.push(newItem);
        localStorage.setItem('subhams_cart', JSON.stringify(currentCart));

        // 2. Safely update context without crashing React
        setTimeout(() => {
            if(addToCart) addToCart(newItem);
        }, 0);

        // 3. Navigate to Orders and FORCE the 'list' tab
        setTimeout(() => {
            navigate('/my-orders', { state: { forceTab: 'list' } });
        }, 300);
    };

    return (
        <div style={styles.page}>
            <div style={styles.appContainer}>
                
                {/* TOP NAVIGATION */}
                <div style={styles.navBar}>
                    <button onClick={() => navigate(-1)} style={styles.iconBtn}>
                        <ArrowLeft size={22} color="#0f172a" />
                    </button>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <button onClick={() => setIsLiked(!isLiked)} style={styles.iconBtn}>
                            <Heart size={22} color={isLiked ? "#ef4444" : "#0f172a"} fill={isLiked ? "#ef4444" : "transparent"} />
                        </button>
                        <button onClick={handleShare} style={styles.iconBtn}>
                            <Share2 size={22} color="#0f172a" />
                        </button>
                    </div>
                </div>

                {/* IMAGE GALLERY */}
                <div style={styles.galleryContainer}>
                    <div style={styles.mainImageWrapper}>
                        <img src={activeImage} alt={item.name} style={styles.mainImage} />
                    </div>
                    {gallery.length > 1 && (
                        <div style={styles.thumbnailRow}>
                            {gallery.map((imgUrl, index) => (
                                <div key={index} onClick={() => setActiveImage(imgUrl)}
                                    style={{...styles.thumbnailWrapper, borderColor: activeImage === imgUrl ? '#2874f0' : '#e2e8f0'}}>
                                    <img src={imgUrl} alt={`thumb-${index}`} style={styles.thumbnail} />
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* CORE INFO */}
                <div style={styles.detailsContainer}>
                    <h1 style={styles.itemName}>{item.name}</h1>
                    
                    <div style={styles.ratingRow}>
                        <div style={styles.emptyRatingBadge}>
                            <Star size={12} fill="#94a3b8" color="#94a3b8" /> New
                        </div>
                    </div>

                    <div style={styles.pricingBlock}>
                        {discount > 0 && <span style={styles.discountHighlight}>-{discount}%</span>}
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                            <span style={styles.currencySymbol}>₹</span>
                            <span style={styles.sellPrice}>{sellPrice}</span>
                        </div>
                        {mrp > sellPrice && (
                            <div style={styles.mrpRow}>
                                <span style={styles.mrpLabel}>M.R.P.:</span>
                                <span style={styles.mrpPrice}>₹{mrp}</span>
                            </div>
                        )}
                        <p style={styles.taxText}>{t.inclusiveTaxes}</p>
                    </div>

                    <div style={styles.specsRow}>
                        <div style={styles.specBox}>
                            <span style={styles.specLabel}>{t.quantity}</span>
                            <span style={styles.specValue}>{item.unit_value || 1} {item.unit_type || 'Piece'}</span>
                        </div>
                        <div style={styles.specBox}>
                            <span style={styles.specLabel}>{t.availability}</span>
                            <span style={{ fontSize: '14px', fontWeight: '700', color: stockColor }}>
                                {stockDisplay}
                            </span>
                        </div>
                    </div>

                    {/* STRICT RED DISCLAIMER BOX */}
                    <div style={styles.disclaimerBox}>
                        <h4 style={styles.disclaimerTitle}>
                            <AlertTriangle size={18} color="#dc2626" /> {t.disclaimerTitle}
                        </h4>
                        <ul style={styles.disclaimerList}>
                            <li>{t.disclaimer1}</li>
                            <li style={{ color: '#dc2626', fontWeight: 'bold' }}>{t.disclaimer2}</li>
                            <li>{t.disclaimer3}</li>
                        </ul>
                    </div>

                    <div style={styles.divider} />

                    <div style={styles.vendorCard} onClick={() => navigate(`/shop/${item.shop_id || item.vendor_id}`)}>
                        <div style={styles.vendorIconArea}>
                            <Store size={24} color="#2874f0" />
                        </div>
                        <div style={{ flex: 1 }}>
                            <span style={styles.vendorLabel}>{t.soldBy}</span>
                            <h4 style={styles.vendorName}>{item.business_name || 'Local Vendor'} <BadgeCheck size={14} color="#2563eb" /></h4>
                        </div>
                        <span style={{fontSize: '12px', color: '#2874f0', fontWeight: 'bold'}}>{t.viewStore}</span>
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

                {/* BOTTOM ACTION BAR */}
                <div style={styles.bottomActionBar}>
                    <div style={styles.callNoticeBox}>
                        <Clock size={14} />
                        <span>{t.callNotice}</span>
                    </div>
                    
                    <div style={styles.actionButtonsRow}>
                        <div style={styles.bottomPriceBox}>
                            <span style={styles.bottomPriceLabel}>{t.totalPrice}</span>
                            <span style={styles.bottomPriceValue}>₹{totalPrice}</span>
                        </div>

                        <div style={{ display: 'flex', gap: '10px', flex: 1, justifyContent: 'flex-end' }}>
                            {isService ? (
                                <button 
                                    style={{...styles.bookBtn, opacity: isPlacingOrder ? 0.7 : 1}} 
                                    onClick={() => handleAddToCart('Service')}
                                    disabled={isPlacingOrder}
                                >
                                    <Calendar size={18} /> {isPlacingOrder ? "Wait..." : t.bookService}
                                </button>
                            ) : (
                                <>
                                    <div style={styles.qtyBox}>
                                        <button onClick={() => handleQuantity('minus')} style={styles.qtyBtn}>-</button>
                                        <span style={styles.qtyText}>{quantity}</span>
                                        <button onClick={() => handleQuantity('plus')} style={styles.qtyBtn} disabled={quantity >= stockCount}>+</button>
                                    </div>
                                    <button 
                                        style={{...styles.addToCartBtn, opacity: (stockCount === 0 || isPlacingOrder) ? 0.7 : 1}} 
                                        onClick={() => handleAddToCart('Product')} 
                                        disabled={stockCount === 0 || isPlacingOrder}
                                    >
                                        <ShoppingCart size={18} /> {isPlacingOrder ? "Wait..." : t.addToCart}
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
    appContainer: { maxWidth: '800px', margin: '0 auto', background: '#ffffff', minHeight: '100vh', position: 'relative', paddingBottom: '140px', boxShadow: '0 0 20px rgba(0,0,0,0.05)' },
    loading: { textAlign: 'center', padding: '80px 20px', fontWeight: 'bold', color: '#64748b' },
    
    navBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 20px', position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 },
    iconBtn: { width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e2e8f0', cursor: 'pointer', boxShadow: '0 2px 5px rgba(0,0,0,0.08)' },
    
    galleryContainer: { background: '#ffffff', width: '100%' },
    mainImageWrapper: { width: '100%', height: '400px', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    mainImage: { width: '100%', height: '100%', objectFit: 'contain' },
    thumbnailRow: { display: 'flex', gap: '12px', padding: '15px 20px', overflowX: 'auto', borderBottom: '1px solid #f1f5f9' },
    thumbnailWrapper: { width: '56px', height: '56px', borderRadius: '8px', border: '2px solid', padding: '2px', cursor: 'pointer' },
    thumbnail: { width: '100%', height: '100%', borderRadius: '4px', objectFit: 'cover' },
    
    detailsContainer: { padding: '20px', background: '#ffffff' },
    itemName: { margin: '0 0 10px 0', fontSize: '20px', fontWeight: '500', color: '#0f172a', lineHeight: '1.4' },
    ratingRow: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px' },
    emptyRatingBadge: { display: 'flex', alignItems: 'center', gap: '4px', background: '#f1f5f9', color: '#64748b', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' },
    
    pricingBlock: { marginBottom: '20px' },
    discountHighlight: { fontSize: '24px', color: '#cc0c39', fontWeight: '300', marginRight: '10px' },
    currencySymbol: { fontSize: '16px', fontWeight: '600', color: '#0f172a' },
    sellPrice: { fontSize: '32px', fontWeight: '600', color: '#0f172a' },
    mrpRow: { display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' },
    mrpLabel: { fontSize: '13px', color: '#475569' },
    mrpPrice: { fontSize: '13px', color: '#475569', textDecoration: 'line-through' },
    taxText: { fontSize: '12px', color: '#475569', marginTop: '4px' },
    
    specsRow: { display: 'flex', gap: '15px', marginBottom: '20px' },
    specBox: { flex: 1, background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #f1f5f9' },
    specLabel: { display: 'block', fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: '700', marginBottom: '6px' },
    specValue: { fontSize: '14px', color: '#0f172a', fontWeight: '600' },
    
    divider: { height: '6px', background: '#f1f5f9', margin: '0 -20px 20px -20px' },
    
    vendorCard: { display: 'flex', alignItems: 'center', gap: '15px', padding: '5px 0', cursor: 'pointer', marginBottom: '20px' },
    vendorIconArea: { width: '48px', height: '48px', background: '#eff6ff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    vendorLabel: { fontSize: '12px', color: '#64748b', marginBottom: '2px' },
    vendorName: { margin: 0, fontSize: '15px', color: '#0f172a', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' },
    
    section: { marginBottom: '25px' },
    sectionTitle: { margin: '0 0 15px 0', fontSize: '18px', fontWeight: '700', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' },
    description: { fontSize: '14px', color: '#334155', lineHeight: '1.6', margin: 0, whiteSpace: 'pre-wrap' },
    
    disclaimerBox: { background: '#fef2f2', border: '1px solid #fca5a5', padding: '16px', borderRadius: '12px', marginBottom: '25px' },
    disclaimerTitle: { margin: '0 0 10px 0', fontSize: '15px', color: '#dc2626', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' },
    disclaimerList: { margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#b91c1c', lineHeight: '1.6' },
    
    commentForm: { display: 'flex', gap: '10px', marginBottom: '20px' },
    commentInput: { flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', background: '#f8fafc', outline: 'none' },
    sendBtn: { background: '#2874f0', border: 'none', borderRadius: '10px', width: '45px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },
    
    commentsList: { display: 'flex', flexDirection: 'column', gap: '12px' },
    commentCard: { background: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' },
    commentHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' },
    commentUser: { fontSize: '13px', fontWeight: 'bold', color: '#0f172a', display: 'block' },
    commentTime: { fontSize: '11px', color: '#94a3b8' },
    commentText: { margin: 0, fontSize: '13px', color: '#475569', lineHeight: '1.4' },
    deleteCommentBtn: { background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px' },
    
    bottomActionBar: { position: 'fixed', bottom: 0, left: 0, right: 0, maxWidth: '800px', margin: '0 auto', background: '#ffffff', borderTop: '1px solid #e2e8f0', zIndex: 100, boxShadow: '0 -4px 12px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column' },
    callNoticeBox: { background: '#fef2f2', color: '#dc2626', fontSize: '12px', fontWeight: '700', padding: '8px 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', borderBottom: '1px solid #fee2e2' },
    actionButtonsRow: { padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    
    bottomPriceBox: { display: 'flex', flexDirection: 'column', minWidth: '100px' },
    bottomPriceLabel: { fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' },
    bottomPriceValue: { fontSize: '20px', fontWeight: '900', color: '#0f172a' },
    
    qtyBox: { display: 'flex', alignItems: 'center', border: '1px solid #cbd5e1', borderRadius: '8px', background: '#f8fafc', overflow: 'hidden', height: '44px' },
    qtyBtn: { background: 'transparent', border: 'none', padding: '0 12px', fontSize: '18px', fontWeight: 'bold', color: '#0f172a', cursor: 'pointer', height: '100%' },
    qtyText: { fontSize: '15px', fontWeight: 'bold', width: '25px', textAlign: 'center' },
    
    addToCartBtn: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: '#ff9f00', color: '#ffffff', border: 'none', padding: '0 20px', height: '44px', borderRadius: '8px', fontWeight: '700', fontSize: '15px', cursor: 'pointer' },
    bookBtn: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: '#2874f0', color: '#ffffff', border: 'none', padding: '0 20px', height: '44px', borderRadius: '8px', fontWeight: '700', fontSize: '15px', cursor: 'pointer' }
};

export default ItemDetail;