import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { socket } from '../context/AppContext';
import axios from 'axios';
import { Share2, BadgeCheck, MapPin, ArrowLeft, Edit, X, Check, Package, Store, Upload, Search, Users, BellRing, Bell, UserPlus, Trash2, Loader, Play, Heart, Video, MessageCircle, Download, AlertTriangle, ShieldAlert } from 'lucide-react';
import { toast } from 'react-toastify';
import html2canvas from 'html2canvas';

const getBackendUrl = () => process.env.NODE_ENV === 'production' ? 'https://bhavyams-vendorhub-backend.onrender.com/api' : 'http://localhost:5000/api';

const getOptimizedImage = (url) => {
    if (!url) return null;
    if (url.includes('cloudinary.com') && !url.includes('q_auto')) return url.replace('/upload/', '/upload/q_auto,f_auto,w_600/');
    return url; 
};

const resolveMediaUrl = (url, type = 'image') => {
    if (!url) return null;
    if (type === 'video' || url.match(/\.(mp4|webm|ogg|mov)$/i) || url.includes('video/upload')) {
        return url.startsWith('http') ? url : `${getBackendUrl().replace('/api', '')}/uploads/${url.replace(/\\/g, '/').split('uploads/').pop()}`;
    }
    if (url.includes('cloudinary.com') && !url.includes('q_auto')) return url.replace('/upload/', '/upload/q_auto,f_auto,w_400/');
    if (url.startsWith('http')) return url;
    return `${getBackendUrl().replace('/api', '')}/${url.replace(/\\/g, '/')}`;
};

const getVideoThumbnail = (url) => {
    if (!url) return null;
    if (url.includes('cloudinary.com')) return url.replace(/\.(mp4|mov|webm|ogg)$/i, '.jpg'); 
    return `${resolveMediaUrl(url, 'video')}#t=0.001`; 
};

const getFallbackAvatar = (name) => `https://ui-avatars.com/api/?name=${name ? encodeURIComponent(name) : 'User'}&background=random&color=fff&bold=true`;

// 🟢 BILINGUAL TELUGU-TO-ENGLISH CANONICAL MAPPER (Ensures Telugu & English DB sync)
const TELUGU_TO_EN_MAP = {
    'కోణంకి': 'konanki',
    'మార్టూరు': 'martur',
    'బాపట్ల': 'bapatla',
    'తిరుపతి': 'tirupati',
    'ఆంధ్రప్రదేశ్': 'andhra pradesh',
    'గుంటూరు': 'guntur',
    'విజయవాడ': 'vijayawada',
    'ఒంగోలు': 'ongole',
    'చిరాల': 'chirala',
    'చీరాల': 'chirala',
    'ప్రకాశం': 'prakasam'
};

const normalizeLocationText = (text) => {
    if (!text) return '';
    let lower = text.toLowerCase();
    Object.keys(TELUGU_TO_EN_MAP).forEach(teWord => {
        if (lower.includes(teWord)) {
            lower = lower.replace(new RegExp(teWord, 'g'), TELUGU_TO_EN_MAP[teWord]);
        }
    });
    return lower;
};

// 🟢 PARSE DELIVERY ZONES (Supports full hierarchical strings separated by ' | ' or legacy commas)
const parseDeliveryZones = (rawAreas) => {
    if (!rawAreas || rawAreas.trim() === '' || rawAreas.trim().toLowerCase() === 'all') {
        return [{ full: 'All', primary: 'All', sub: '' }];
    }
    if (rawAreas.includes('|')) {
        return rawAreas.split('|').map(z => z.trim()).filter(Boolean).map(zone => {
            const parts = zone.split(',').map(p => p.trim()).filter(Boolean);
            return {
                full: zone,
                primary: parts[0] || zone,
                sub: parts.slice(1, 3).join(', ')
            };
        });
    }
    // Check if it's a single full Nominatim hierarchy string (e.g. "Konanki, Martur, Bapatla, Andhra Pradesh, India")
    const commaParts = rawAreas.split(',').map(p => p.trim()).filter(Boolean);
    const looksLikeSingleHierarchy = commaParts.length >= 3 && (
        rawAreas.toLowerCase().includes('india') || 
        rawAreas.toLowerCase().includes('andhra pradesh') || 
        /\b\d{6}\b/.test(rawAreas)
    );
    if (looksLikeSingleHierarchy) {
        return [{
            full: rawAreas.trim(),
            primary: commaParts[0],
            sub: commaParts.slice(1, 3).join(', ')
        }];
    }
    // Legacy comma-separated short names
    return commaParts.map(p => ({ full: p, primary: p, sub: '' }));
};

// 🟢 1ST-WORD PRIORITY + SUB-ADDRESS VERIFICATION ENGINE
const checkIsDeliverableToUser = (userAddressRaw, rawDeliveryAreas) => {
    const zones = parseDeliveryZones(rawDeliveryAreas);
    if (zones.some(z => z.primary.toLowerCase() === 'all' || z.primary.toLowerCase() === 'india' || z.primary.toLowerCase() === 'all india')) {
        return true;
    }
    if (!userAddressRaw) return false;

    const normUserFull = normalizeLocationText(userAddressRaw);
    const userTokens = normUserFull.split(/[,]+/).map(s => s.trim()).filter(Boolean);

    return zones.some(zone => {
        const normPrimary = normalizeLocationText(zone.primary);
        if (!normPrimary) return false;

        // 1. PRIORITY 1: The User's address hierarchy MUST contain the Shop's 1st-word target!
        // - If shop selected "Konanki, Martur, Bapatla...", normPrimary is "konanki".
        //   A user in "Martur, Bapatla" does NOT have "konanki" -> FALSE!
        // - If shop selected "Andhra Pradesh, India", normPrimary is "andhra pradesh".
        //   A user in "Konanki, Martur, Bapatla, Andhra Pradesh" DOES have "andhra pradesh" -> TRUE!
        const hasPrimaryMatch = userTokens.some(t => t === normPrimary || t.includes(normPrimary)) || normUserFull.includes(normPrimary);
        if (!hasPrimaryMatch) return false;

        // 2. PRIORITY 2: Sub-Address Verification (Prevents duplicate village names across different districts)
        const zoneParts = normalizeLocationText(zone.full)
            .split(',')
            .map(s => s.trim())
            .filter(s => s && s !== 'india' && !/^\d+$/.test(s));

        // If Both Shop Zone and User Address have sub-address context, verify they share at least one sub-region (Mandal/District/State)
        if (zoneParts.length > 1 && userTokens.length > 1) {
            const subParts = zoneParts.slice(1);
            const hasSubContextMatch = subParts.some(sub => normUserFull.includes(sub));
            return hasSubContextMatch;
        }

        return true;
    });
};

// 🟢 SMART 5-TIER BADGE SYSTEM
const renderBadge = (isOfficial, isVerified, accountStatus, hasShop = true) => {
    const isVer = isVerified === true || String(isVerified).toLowerCase() === 'true';
    if (accountStatus === 'perma_banned') return <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#0f172a', color: 'white', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '900', border: '1px solid #334155' }}>⬛ Banned</span>;
    if (accountStatus === 'temp_block') return <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#fef2f2', color: '#dc2626', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '900', border: '1px solid #fecaca' }}>🟥 Suspended</span>;
    if (isOfficial) return <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#fef3c7', color: '#b45309', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '900', border: '1px solid #fde68a' }}><BadgeCheck size={16} color="#ffffff" fill="#FFD700" style={{ filter: 'drop-shadow(0 1px 2px rgba(184, 134, 11, 0.4))' }} /> Official</span>;
    if (isVer) return <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#dcfce7', color: '#15803d', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '900', border: '1px solid #86efac' }}><BadgeCheck size={16} color="#ffffff" fill="#10b981" /> Verified</span>;
    if (hasShop) return <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#eff6ff', color: '#1d4ed8', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '800', border: '1px solid #bfdbfe' }}><BadgeCheck size={16} color="#ffffff" fill="#3b82f6" /> Standard</span>;
    return null;
};

const ShopProfile = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    
    const [shopData, setShopData] = useState(null);
    const [products, setProducts] = useState([]);
    const [expoPosts, setExpoPosts] = useState([]); 
    const [loading, setLoading] = useState(true);

    const [activeProfileTab, setActiveProfileTab] = useState('Catalog'); 
    const [shopSearch, setShopSearch] = useState('');
    
    const [isFollowing, setIsFollowing] = useState(false);
    const [isFollowLoading, setIsFollowLoading] = useState(false);
    const [notifMenuOpen, setNotifMenuOpen] = useState(false);
    const [notifLevel, setNotifLevel] = useState('All');

    const [adminCategories, setAdminCategories] = useState([]);
    const [showEditModal, setShowEditModal] = useState(false);
    const [imageFile, setImageFile] = useState(null); 
    const [uploadError, setUploadError] = useState('');
    
    const [showTeamModal, setShowTeamModal] = useState(false);
    const [staffList, setStaffList] = useState([]);
    const [newStaffEmail, setNewStaffEmail] = useState('');
    const [otpMode, setOtpMode] = useState(false);
    const [staffOtp, setStaffOtp] = useState('');
    
    const [deliveryRequests, setDeliveryRequests] = useState([]);
    const [hasRequested, setHasRequested] = useState(false);
    const [showRequestsList, setShowRequestsList] = useState(false);

    const [showLocModal, setShowLocModal] = useState(false); 
    const [locSearch, setLocSearch] = useState('');
    const [locResults, setLocResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    
    const [showFollowersModal, setShowFollowersModal] = useState(false);
    const [followersList, setFollowersList] = useState([]);

    const [editForm, setEditForm] = useState({ 
        business_name: '', category: '', shop_type: 'Products', is_online: true, address: '', delivery_areas: '', founder_name: '', ceo_name: '' 
    });

    const userStr = localStorage.getItem('user');
    const currentUser = userStr && userStr !== 'undefined' ? JSON.parse(userStr) : null;
    const customLocStr = localStorage.getItem('custom_hub_location');
    const customLocation = customLocStr && customLocStr !== 'undefined' ? JSON.parse(customLocStr) : null;
    const isMasterAdmin = Boolean(currentUser && currentUser.email === 'pavanvenkat63@gmail.com');

    useEffect(() => {
        let isMounted = true;
        
        const fetchShopProfile = async () => {
            try {
                const BACKEND_URL = getBackendUrl();
                const token = localStorage.getItem('token');
                
                const shopRes = await axios.get(`${BACKEND_URL}/shops/${id}`);
                if (!isMounted) return;
                
                const shopInfo = shopRes.data.shop;
                setShopData(shopInfo);
                setProducts(shopRes.data.products || []);
                setExpoPosts(shopRes.data.expo_posts || []); 
                setDeliveryRequests(shopRes.data.delivery_requests || []);

                setEditForm({
                    business_name: shopInfo.business_name || '',
                    category: shopInfo.category || '',
                    shop_type: shopInfo.shop_type || 'Products', 
                    is_online: shopInfo.is_online,
                    address: shopInfo.address || '',
                    delivery_areas: shopInfo.delivery_areas === 'All' ? '' : (shopInfo.delivery_areas || ''),
                    founder_name: shopInfo.founder_name || '',
                    ceo_name: shopInfo.ceo_name || ''
                });

                axios.get(`${BACKEND_URL}/admin/categories`).then(catRes => {
                    if (isMounted) setAdminCategories(catRes.data || []);
                }).catch(() => {});

                if (currentUser && token) {
                    axios.get(`${BACKEND_URL}/expo/following`, { headers: { Authorization: `Bearer ${token}` } }).then(followRes => {
                        if (isMounted && followRes.data.following && followRes.data.following[id]) {
                            setIsFollowing(true);
                        }
                    }).catch(() => {});
                }
            } catch (err) {
                if (isMounted) toast.error("Failed to load shop.");
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchShopProfile();

        const handleShopUpdate = (updatedShop) => {
            if (String(updatedShop.id) === String(id)) {
                setShopData(prev => ({ ...prev, ...updatedShop }));
            }
        };

        socket.on('shop_updated', handleShopUpdate);
        return () => {
            isMounted = false;
            socket.off('shop_updated', handleShopUpdate);
        };
    }, [id, currentUser?.id]);

    const handleToggleVerified = async () => {
        try {
            const token = localStorage.getItem('token');
            const newStatus = !(shopData.is_verified === true || String(shopData.is_verified).toLowerCase() === 'true');
            await axios.put(`${getBackendUrl()}/shops/admin/vendor/${id}/verify-status`,
                { is_verified: newStatus, is_approved: shopData.is_approved },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setShopData(prev => ({ ...prev, is_verified: newStatus }));
            toast.success(newStatus ? "Vendor verified with Green Badge!" : "Verification removed.");
        } catch (err) { toast.error("Failed to update verification status."); }
    };

    const handleRequestVerification = async () => {
        try {
            const token = localStorage.getItem('token');
            await axios.post(`${getBackendUrl()}/shops/${id}/request-verification`, {}, { headers: { Authorization: `Bearer ${token}` }});
            toast.success("🛡️ Request sent! Admin has been notified.");
        } catch (err) {
            toast.error("Failed to send verification request.");
        }
    };

    const handleFollowToggle = async () => {
        if (!currentUser) {
            toast.info("Please login to follow this shop!");
            return navigate('/welcome');
        }
        if (isFollowLoading) return;

        setIsFollowLoading(true);
        const nextState = !isFollowing;
        setIsFollowing(nextState);
        
        setShopData(prev => ({
            ...prev,
            followers_count: nextState ? (Number(prev.followers_count) || 0) + 1 : Math.max(0, (Number(prev.followers_count) || 0) - 1)
        }));
        
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(`${getBackendUrl()}/follow/${id}`, {}, { headers: { Authorization: `Bearer ${token}` } });
            
            if (res.data.isFollowing !== nextState) {
                setIsFollowing(res.data.isFollowing);
                setShopData(prev => ({ ...prev, followers_count: res.data.isFollowing ? (Number(prev.followers_count) || 0) + 1 : Math.max(0, (Number(prev.followers_count) || 0) - 1) }));
            }
            toast.success(res.data.isFollowing ? "Following! Push alerts enabled." : "Unfollowed.");
        } catch (err) {
            setIsFollowing(!nextState);
            setShopData(prev => ({ ...prev, followers_count: !nextState ? (Number(prev.followers_count) || 0) + 1 : Math.max(0, (Number(prev.followers_count) || 0) - 1) }));
            toast.error("Failed to update follow status.");
        } finally {
            setIsFollowLoading(false);
        }
    };

    const fetchFollowersList = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${getBackendUrl()}/shops/${id}/followers`, { headers: { Authorization: `Bearer ${token}` } });
            setFollowersList(res.data.followers || []);
            setShowFollowersModal(true);
        } catch (err) { toast.error("Failed to load followers list."); }
    };

    // 🟢 ACTIVE USER HIERARCHY ADDRESS (Checks custom map location first, then user profile address)
    const activeUserFullAddress = customLocation?.address || currentUser?.address || currentUser?.location || '';
    const isDeliverable = checkIsDeliverableToUser(activeUserFullAddress, shopData?.delivery_areas);

    const handleRequestDelivery = async () => {
        if (!currentUser) {
            toast.info("Please login to request delivery to your area!");
            return navigate('/welcome');
        }
        try {
            const token = localStorage.getItem('token');
            const basicUserAddress = activeUserFullAddress || 'Unknown Location';
            await axios.post(`${getBackendUrl()}/shops/${id}/request-delivery`, { area_name: basicUserAddress }, { headers: { Authorization: `Bearer ${token}` }});
            toast.success(`🚀 Delivery request for ${basicUserAddress.split(',')[0]} sent to shop owner!`);
            setHasRequested(true);
        } catch (err) { toast.error("Failed to send request."); }
    };

    const fetchStaff = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${getBackendUrl()}/shops/${id}/staff`, { headers: { Authorization: `Bearer ${token}` }});
            setStaffList(res.data.staff);
        } catch (err) {}
    };

    const handleRequestStaffOtp = async (e) => {
        e.preventDefault();
        if (!newStaffEmail) return;
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(`${getBackendUrl()}/shops/${id}/staff/request-otp`, { staff_email: newStaffEmail }, { headers: { Authorization: `Bearer ${token}` }});
            toast.success(res.data.message);
            setOtpMode(true);
        } catch (err) { toast.error(err.response?.data?.message || "Failed to send OTP."); }
    };

    const handleVerifyStaff = async (e) => {
        e.preventDefault();
        if (!staffOtp) return;
        try {
            const token = localStorage.getItem('token');
            await axios.post(`${getBackendUrl()}/shops/${id}/staff/verify-otp`, { staff_email: newStaffEmail, otp: staffOtp, role: 'Staff' }, { headers: { Authorization: `Bearer ${token}` }});
            toast.success("Team member verified and added securely!");
            setNewStaffEmail(''); setStaffOtp(''); setOtpMode(false); fetchStaff();
        } catch (err) { toast.error(err.response?.data?.message || "Invalid or expired OTP."); }
    };

    const handleRemoveStaff = async (email) => {
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${getBackendUrl()}/shops/${id}/staff/${email}`, { headers: { Authorization: `Bearer ${token}` }});
            toast.success("Access removed.");
            fetchStaff();
        } catch (err) {}
    };

    const openTeamModal = () => { setShowTeamModal(true); setOtpMode(false); fetchStaff(); };

    // 🟢 MAP SEARCH (Forces English canonical names from Nominatim even if user types in Telugu)
    const handleLocationSearch = async (query) => {
        setLocSearch(query);
        if (query.length < 2) return setLocResults([]);
        
        setIsSearching(true);
        try {
            const searchQ = normalizeLocationText(query);
            const res = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&countrycodes=in&accept-language=en&q=${encodeURIComponent(searchQ)}`);
            setLocResults(res.data || []);
        } catch (e) {} finally { setIsSearching(false); }
    };

    // 🟢 SAVES FULL HIERARCHY (1st Word + Sub-Address Context)
    const selectCustomLocation = (loc) => {
        const canonicalFull = loc.display_name;
        if (showLocModal === 'location') {
            setEditForm({ ...editForm, address: canonicalFull });
        } else if (showLocModal === 'delivery') {
            const existingZones = parseDeliveryZones(editForm.delivery_areas)
                .filter(z => z.primary.toLowerCase() !== 'all')
                .map(z => z.full);

            const primaryNew = canonicalFull.split(',')[0].trim().toLowerCase();
            const alreadyExists = existingZones.some(z => z.split(',')[0].trim().toLowerCase() === primaryNew && z.toLowerCase() === canonicalFull.toLowerCase());

            if (!alreadyExists) {
                const updatedZones = [...existingZones, canonicalFull];
                setEditForm({ ...editForm, delivery_areas: updatedZones.join(' | ') });
            }
        }
        setShowLocModal(false);
        setLocSearch('');
        setLocResults([]);
    };

    const handleUpdateSubmit = async (e) => {
        e.preventDefault();
        setUploadError('');

        if (!editForm.address) {
            return toast.error("Please select your Shop Location from the search bar.");
        }

        try {
            const BACKEND_URL = getBackendUrl();
            const token = localStorage.getItem('token');
            
            const formData = new FormData();
            formData.append('business_name', editForm.business_name);
            formData.append('category', editForm.category);
            formData.append('shop_type', editForm.shop_type);
            formData.append('is_online', editForm.is_online);
            formData.append('address', editForm.address);
            formData.append('founder_name', editForm.founder_name);
            formData.append('ceo_name', editForm.ceo_name);
            
            const finalDeliveryAreas = editForm.delivery_areas ? editForm.delivery_areas.trim() : 'All';
            formData.append('delivery_areas', finalDeliveryAreas); 
            
            if (imageFile) formData.append('shop_logo', imageFile);

            const res = await axios.put(`${BACKEND_URL}/shops/${id}`, formData, {
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
            });
            
            setShopData(prev => ({ ...prev, ...res.data.shop }));
            setShowEditModal(false);
            setImageFile(null);
            toast.success("✅ Store location & delivery zones updated!");
        } catch (err) { 
            const backendMsg = err.response?.data?.message || "❌ Update failed! Please check your connection.";
            setUploadError(backendMsg); 
            toast.error(backendMsg);
        }
    };

    const handleDownloadCard = async () => {
        const element = document.getElementById('shop-card-export');
        if (!element) return;
        try {
            toast.info("Generating shareable image...");
            const canvas = await html2canvas(element, { scale: 2, useCORS: true });
            const data = canvas.toDataURL('image/jpeg');
            const link = document.createElement('a');
            link.href = data;
            link.download = `${shopData.business_name}_SubhamsHub.jpg`;
            link.click();
            toast.success("Image saved! You can now share it on WhatsApp.");
        } catch (err) { toast.error("Failed to generate image. Try again."); }
    };

    const handleShare = async () => {
        if (navigator.share) {
            try { await navigator.share({ title: shopData.business_name, text: `Check out ${shopData.business_name} on Subhams Hub!`, url: window.location.href });
            } catch (err) {}
        } else { toast.info("Share link copied!"); navigator.clipboard.writeText(window.location.href); }
    };

    const handleNotificationChange = (level) => { setNotifLevel(level); setNotifMenuOpen(false); };

    const filteredCatalog = products.filter(item => (item.name || '').toLowerCase().includes(shopSearch.toLowerCase()));

    const renderLeadership = () => {
        const founder = shopData.founder_name;
        const ceo = shopData.ceo_name;
        if (!founder && !ceo) return null;
        
        let label = ""; let name = "";
        if (founder && ceo && founder.toLowerCase() === ceo.toLowerCase()) {
            label = "Founder & CEO"; name = founder;
        } else if (founder && ceo) {
            label = "Leadership"; name = `Founder: ${founder} | CEO: ${ceo}`;
        } else if (founder) {
            label = "Founder"; name = founder;
        } else {
            label = "CEO"; name = ceo;
        }

        return (
            <div style={{ marginTop: '10px', background: '#f8fafc', border: '1px dashed #cbd5e1', padding: '8px 12px', borderRadius: '8px', display: 'inline-block' }}>
                <span style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', fontWeight: 'bold', display: 'block' }}>{label}</span>
                <span style={{ fontSize: '13px', color: '#0f172a', fontWeight: 'bold' }}>{name}</span>
            </div>
        );
    };

    const handleInitiateChat = async () => {
        if (!currentUser) return navigate('/welcome');
        if (currentUser.can_message === false) return toast.error("⚠️ Your messaging privileges have been suspended by Admin.");

        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(`${getBackendUrl()}/chats/initiate/${id}`, {}, { headers: { Authorization: `Bearer ${token}` } });
            navigate(`/chat/${res.data.conversation_id}`);
        } catch (err) { toast.error(err.response?.data?.message || "Failed to start chat."); }
    };

    if (loading) return (
        <div style={{...styles.page, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
            <Loader className="spin" size={40} color="#2874f0" style={{marginBottom: '10px'}} />
            <h3 style={{color: '#64748b'}}>Loading Store Profile...</h3>
        </div>
    );
    if (!shopData) return (
        <div style={{...styles.page, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '20px'}}>
            <Store size={60} color="#cbd5e1" style={{marginBottom: '10px'}} />
            <h2 style={{color: '#0f172a'}}>Store Not Found</h2>
            <p style={{color: '#64748b'}}>This shop may have been removed or the link is invalid.</p>
            <button onClick={() => navigate('/')} style={styles.primaryActionBtn}>Return Home</button>
        </div>
    );

    const isOwner = Boolean(currentUser?.id && shopData?.user_id && String(currentUser.id) === String(shopData.user_id));
    const isOfficialApp = Boolean(String(shopData?.user_id) === "1" || shopData?.user_email === 'pavanvenkat63@gmail.com' || shopData?.email === 'pavanvenkat63@gmail.com');
    const isShopSuspended = shopData?.account_status === 'temp_block' || shopData?.account_status === 'perma_banned';
    const isVer = shopData?.is_verified === true || String(shopData?.is_verified).toLowerCase() === 'true';

    // FORMAT UNLOCK TIME
    let unlockTimeStr = '';
    if (shopData?.account_status === 'temp_block' && shopData?.ban_until) {
        let dStr = String(shopData.ban_until);
        if (!dStr.endsWith('Z') && !dStr.includes('+')) dStr += 'Z';
        const date = new Date(dStr);
        if (!isNaN(date.getTime())) {
            unlockTimeStr = date.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true });
        }
    }

    const getBannerBackground = () => {
        if (shopData?.account_status === 'perma_banned') return 'linear-gradient(135deg, #090d16 0%, #1e293b 100%)'; 
        if (shopData?.account_status === 'temp_block') return 'linear-gradient(135deg, #7f1d1d 0%, #dc2626 100%)'; 
        if (isOfficialApp) return 'linear-gradient(135deg, #b45309 0%, #facc15 100%)'; 
        if (isVer) return 'linear-gradient(135deg, #14532d 0%, #16a34a 100%)'; 
        return 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)'; 
    };

    const getLogoStyle = () => {
        if (shopData?.account_status === 'perma_banned') return { ...styles.businessLogo, border: '4px solid #0f172a', boxShadow: '0 4px 15px rgba(0,0,0,0.6)' };
        if (shopData?.account_status === 'temp_block') return { ...styles.businessLogo, border: '4px solid #dc2626', boxShadow: '0 4px 15px rgba(220,38,38,0.4)' };
        if (isOfficialApp) return styles.businessLogoGold;
        if (isVer) return { ...styles.businessLogo, border: '4px solid #16a34a', boxShadow: '0 4px 15px rgba(22,163,74,0.4)' };
        return { ...styles.businessLogo, border: '4px solid #3b82f6', boxShadow: '0 4px 15px rgba(59,130,246,0.3)' };
    };

    const parsedShopZones = parseDeliveryZones(shopData.delivery_areas);
    const formattedDeliveryLabel = parsedShopZones.map(z => z.sub ? `${z.primary} (${z.sub})` : z.primary).join(' • ');

    const dbShopType = shopData.shop_type || 'Products'; 
    const shopImageSrc = getOptimizedImage(shopData.shop_logo);
    const totalRequests = deliveryRequests.reduce((sum, req) => sum + Number(req.count), 0);

    return (
        <div style={styles.page}>
            <style>{`
                .touch-scale { transition: transform 0.15s; }
                .touch-scale:active { transform: scale(0.96); }
                .spin { animation: spin 1s linear infinite; }
                @keyframes spin { 100% { transform: rotate(360deg); } }
                .hide-scroll::-webkit-scrollbar { display: none; }
                .hide-scroll { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
            
            <div style={styles.navBar}>
                <button onClick={() => navigate(-1)} style={styles.backBtn}><ArrowLeft size={20} /> Back</button>
                <div style={{display: 'flex', gap: '8px', alignItems: 'center'}}>
                    <button onClick={handleDownloadCard} style={styles.downloadIconBtn}><Download size={16} /> Save JPG</button>
                    <button onClick={handleShare} style={styles.shareIconBtn}><Share2 size={16} /> Share</button>
                </div>
            </div>

            {/* 🟢 SUSPENSION WARNING BANNER */}
            {isShopSuspended && (
                <div style={{ background: shopData.account_status === 'perma_banned' ? '#0f172a' : '#fef2f2', color: shopData.account_status === 'perma_banned' ? '#f8fafc' : '#dc2626', padding: '16px 20px', textAlign: 'center', borderBottom: `2px solid ${shopData.account_status === 'perma_banned' ? '#334155' : '#ef4444'}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px', fontWeight: '900' }}>
                        <AlertTriangle size={18} color={shopData.account_status === 'perma_banned' ? '#facc15' : '#dc2626'} /> 
                        {shopData.account_status === 'perma_banned' ? 'THIS SHOP IS PERMANENTLY DISABLED' : 'THIS SHOP IS TEMPORARILY SUSPENDED'}
                    </div>
                    
                    <div style={{ background: shopData.account_status === 'perma_banned' ? '#1e293b' : '#fee2e2', color: shopData.account_status === 'perma_banned' ? '#cbd5e1' : '#991b1b', padding: '8px 15px', borderRadius: '8px', fontSize: '12.5px', fontWeight: 'bold', maxWidth: '600px', width: '100%', border: `1px solid ${shopData.account_status === 'perma_banned' ? '#334155' : '#fecaca'}` }}>
                        Admin Reason: {shopData.ban_reason || 'Violation of Subhams Hub marketplace policy guidelines.'}
                    </div>

                    {shopData.account_status === 'temp_block' && unlockTimeStr && (
                        <div style={{ fontSize: '13px', color: '#b91c1c', fontWeight: '800', marginTop: '4px', background: '#fecaca', padding: '4px 10px', borderRadius: '12px' }}>
                            ⏳ Unblocks at: {unlockTimeStr}
                        </div>
                    )}

                    <span style={{ fontSize: '11px', color: shopData.account_status === 'perma_banned' ? '#94a3b8' : '#b91c1c', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '4px' }}>
                        Ordering, messaging, and Expo feeds are completely disabled for this shop.
                    </span>

                    <a href="https://subhamsnetworks.in/#contact" target="_blank" rel="noreferrer" style={{ marginTop: '4px', fontSize: '12px', color: shopData.account_status === 'perma_banned' ? '#60a5fa' : '#dc2626', fontWeight: '800', textDecoration: 'underline' }}>
                        Need help? Contact Subhams Hub Support →
                    </a>
                </div>
            )}

            <div id="shop-card-export" style={{ background: '#f8fafc', paddingBottom: '20px', opacity: isShopSuspended ? 0.75 : 1, pointerEvents: isShopSuspended ? 'none' : 'auto' }}>
                <div style={{...styles.bannerBackground, background: getBannerBackground()}}>
                    <div style={styles.bannerTextContainer}>
                        <span style={styles.bannerCategoryText}>{shopData.category || 'Local Business'}</span>
                        <h1 style={styles.bannerTitleText}>{shopData.business_name}</h1>
                    </div>
                </div>
                
                <div style={styles.profileContentWrapper}>
                    <div style={styles.avatarRow}>
                        <div style={styles.avatarContainer}>
                            {shopImageSrc ? (
                                <img src={shopImageSrc} alt="Shop Logo" crossOrigin="anonymous" referrerPolicy="no-referrer" style={getLogoStyle()} />
                            ) : (
                                <div style={{...getLogoStyle(), background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                                    <Store size={40} color="#94a3b8" />
                                </div>
                            )}
                            {shopData.is_online && !isShopSuspended && <div style={styles.onlineBadge}></div>}
                        </div>
                        
                        <div style={styles.realMetricsBox}>
                            <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                                <Package size={20} color={isOfficialApp ? "#d97706" : isVer ? "#16a34a" : "#2874f0"} />
                                <div style={{display: 'flex', flexDirection: 'column'}}>
                                    <span style={styles.metricNumber}>{products.length}</span>
                                    <span style={styles.metricLabel}>Live Items</span>
                                </div>
                            </div>
                            <div style={{width: '1px', height: '35px', background: '#e2e8f0', margin: '0 8px'}}></div>
                            
                            <div style={{display: 'flex', alignItems: 'center', gap: '10px', cursor: (isOwner || isMasterAdmin) ? 'pointer' : 'default'}} onClick={() => { if ((isOwner || isMasterAdmin) && !isShopSuspended) fetchFollowersList(); }}>
                                <Users size={20} color={isOfficialApp ? "#d97706" : isVer ? "#16a34a" : "#2874f0"} />
                                <div style={{display: 'flex', flexDirection: 'column'}}>
                                    <span style={styles.metricNumber}>{shopData.followers_count || 0}</span>
                                    <span style={styles.metricLabel}>Followers</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div style={styles.bioSection}>
                        <h2 style={styles.shopName}>
                            {shopData.business_name} 
                            {renderBadge(isOfficialApp, shopData.is_verified, shopData.account_status)}
                        </h2>
                        <span style={{...styles.categoryTag, background: isOfficialApp ? '#fef3c7' : isVer ? '#dcfce7' : '#eff6ff', color: isOfficialApp ? '#b45309' : isVer ? '#15803d' : '#1d4ed8'}}>{shopData.category}</span>
                        
                        {/* 🟢 ONLY SHOWS PUBLIC SHOP LOCATION SELECTED FROM MAP SEARCH */}
                        {shopData.address && (
                            <p style={styles.address}>
                                <MapPin size={14} color="#2563eb" /> 
                                <span>Shop Location: <strong>{shopData.address.split(',').slice(0, 3).join(', ')}</strong></span>
                            </p>
                        )}
                        
                        <p style={{ margin: '6px 0 0 0', color: '#16a34a', fontSize: '13px', display: 'flex', alignItems: 'flex-start', gap: '5px', fontWeight: '700', lineHeight: '1.4' }}>
                            <span>🚚 Delivers to: {formattedDeliveryLabel || 'All Areas'}</span>
                        </p>

                        {renderLeadership()}
                    </div>
                </div>
            </div>

            <div style={{ padding: '0 20px', maxWidth: '800px', margin: '0 auto' }}>
                {isOwner && !isOfficialApp && !isVer && !isShopSuspended && (
                    <div style={{ background: '#eff6ff', padding: '15px', borderRadius: '12px', border: '1px dashed #3b82f6', marginBottom: '15px', textAlign: 'center' }}>
                        <p style={{ margin: '0 0 8px 0', fontSize: '13px', fontWeight: 'bold', color: '#1e3a8a', lineHeight: '1.4' }}>
                            Standard shops can only post text updates on Expo. Get verified to post photos & videos! 📸<br/>
                            <span style={{fontSize: '11.5px', color: '#3b82f6'}}>ప్రామాణిక షాపులు కేవలం టెక్స్ట్ మాత్రమే పోస్ట్ చేయగలవు. ఫోటోలు & వీడియోలు పోస్ట్ చేయడానికి వెరిఫై చేసుకోండి!</span>
                        </p>
                        <button onClick={handleRequestVerification} style={{ background: '#16a34a', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer', marginTop: '5px' }}>
                            <ShieldAlert size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} /> Request Green Badge Verification
                        </button>
                    </div>
                )}

                {(isOwner || isMasterAdmin) && !isShopSuspended && (
                    <div style={{...styles.adminControlPanel, border: isOfficialApp ? '1px dashed #f59e0b' : '1px dashed #94a3b8', background: isOfficialApp ? '#fffbeb' : '#f8fafc'}}>
                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px'}}>
                            <span style={{fontSize: '12px', fontWeight: 'bold', color: isMasterAdmin ? '#b45309' : '#475569'}}>
                                {isMasterAdmin ? '👑 Master Admin Mode' : '🛠 Store Owner Tools'}
                            </span>
                        </div>
                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                            <button onClick={() => { setShowEditModal(true); setUploadError(''); }} style={styles.adminBtn}><Edit size={16}/> Edit Store Info</button>
                            <button onClick={() => navigate(`/manage-catalog/${id}`)} style={{...styles.primaryAdminBtn, background: isOfficialApp ? '#d97706' : '#16a34a'}}><Package size={16}/> Manage Catalog</button>
                            <button onClick={openTeamModal} style={{...styles.primaryAdminBtn, background: '#3b82f6'}}><UserPlus size={16}/> Manage Team</button>
                            
                            {isMasterAdmin && !isOfficialApp && (
                                <button onClick={handleToggleVerified} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px', flex: 1, justifyContent: 'center', background: isVer ? '#dcfce7' : '#f1f5f9', border: `1px solid ${isVer ? '#86efac' : '#cbd5e1'}`, color: isVer ? '#15803d' : '#475569', borderRadius: '8px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer' }}>
                                    <BadgeCheck size={16} fill={isVer ? "#10b981" : "#94a3b8"} color={isVer ? "white" : "#cbd5e1"} />
                                    {isVer ? "Revoke Verification" : "Grant Green Badge"}
                                </button>
                            )}
                        </div>

                        {deliveryRequests.length > 0 && (
                            <div style={{ marginTop: '15px', background: 'white', border: '1px solid #fcd34d', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
                                <div onClick={() => setShowRequestsList(!showRequestsList)} className="touch-scale" style={{ padding: '12px 15px', background: '#fffbeb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#b45309', fontWeight: '900', fontSize: '14px' }}>
                                        <MapPin size={16} color="#d97706" /> Delivery Requests: {totalRequests}
                                    </div>
                                    <span style={{ fontSize: '12px', color: '#d97706', fontWeight: 'bold' }}>{showRequestsList ? 'Hide ▴' : 'View Areas ▾'}</span>
                                </div>
                                {showRequestsList && (
                                    <div style={{ padding: '15px', display: 'flex', flexDirection: 'column', gap: '8px', background: 'white' }}>
                                        <p style={{ margin: '0 0 5px 0', fontSize: '11px', color: '#64748b', fontWeight: '600' }}>Customers requested delivery to these areas.</p>
                                        {deliveryRequests.map((req, i) => {
                                            const basicArea = req.area ? req.area.split(',').slice(0, 2).join(', ').trim() : 'Unknown Area';
                                            return (
                                                <div key={i} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '10px 12px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#334155', display: 'flex', alignItems: 'center', gap: '6px' }}><MapPin size={14} color="#64748b" /> {basicArea}</span>
                                                    <span style={{ background: '#ef4444', color: 'white', padding: '4px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }}>{req.count} {Number(req.count) === 1 ? 'Person' : 'People'}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* 🟢 OUT-OF-AREA DELIVERY REQUEST BANNER FOR CUSTOMERS */}
                {!isOwner && !isShopSuspended && !isDeliverable && (
                    <div style={{ marginTop: '15px', background: '#fffbeb', border: '1px solid #fde68a', padding: '12px 15px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                        <div style={{ fontSize: '12.5px', color: '#92400e', fontWeight: '700' }}>
                            📍 This store delivers only to selected areas. Want delivery in <strong>{activeUserFullAddress ? activeUserFullAddress.split(',')[0] : 'your area'}</strong>?
                        </div>
                        <button onClick={handleRequestDelivery} disabled={hasRequested} style={{ background: hasRequested ? '#cbd5e1' : '#d97706', color: 'white', border: 'none', padding: '8px 14px', borderRadius: '8px', fontWeight: '800', fontSize: '12px', cursor: hasRequested ? 'default' : 'pointer' }}>
                            {hasRequested ? '✓ Request Sent' : 'Request Delivery'}
                        </button>
                    </div>
                )}

                {!isOwner && (
                    <div style={{ display: 'flex', gap: '10px', marginTop: '20px', width: '100%' }}>
                        <button 
                            disabled={isShopSuspended} 
                            style={{...isFollowing ? styles.followingBtn : styles.primaryActionBtn, flex: 1, opacity: isShopSuspended ? 0.4 : 1, cursor: isShopSuspended ? 'not-allowed' : 'pointer', background: isFollowing ? '#f1f5f9' : (isOfficialApp ? 'linear-gradient(135deg, #facc15, #d97706)' : '#2874f0')}} 
                            onClick={handleFollowToggle}
                        >
                            {isFollowing ? <Check size={18} color="#0f172a" /> : <Users size={18} color="white" />} 
                            <span style={{color: isFollowing ? '#0f172a' : 'white'}}>{isFollowing ? 'Following' : 'Follow Store'}</span>
                        </button>
                        
                        {isOfficialApp && (
                            <button 
                                disabled={isShopSuspended}
                                onClick={handleInitiateChat} 
                                style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', background: '#16a34a', color: 'white', border: 'none', padding: '12px', borderRadius: '10px', fontWeight: 'bold', fontSize: '15px', cursor: isShopSuspended ? 'not-allowed' : 'pointer', opacity: isShopSuspended ? 0.4 : 1, flex: 1, boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}
                            >
                                <MessageCircle size={18} color="white" /> Contact Subhams Hub
                            </button>
                        )}

                        {isFollowing && !isShopSuspended && (
                            <div style={{ position: 'relative' }}>
                                <button style={{...styles.secondaryActionBtn, padding: '12px 15px'}} onClick={() => setNotifMenuOpen(!notifMenuOpen)}>
                                    {notifLevel === 'All' && <BellRing size={18} color={isOfficialApp ? "#d97706" : "#2563eb"} />}
                                    {notifLevel === 'Silent' && <Bell size={18} color="#f59e0b" />}
                                </button>
                                {notifMenuOpen && (
                                    <div style={styles.notifMenu}>
                                        <div style={styles.notifItem} onClick={() => handleNotificationChange('All')}><BellRing size={14}/> Loud (All Alerts)</div>
                                        <div style={styles.notifItem} onClick={() => handleNotificationChange('Silent')}><Bell size={14}/> Silent Mode</div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div style={styles.feedSection}>
                <div style={styles.feedTabs}>
                    <div onClick={() => setActiveProfileTab('Catalog')} style={activeProfileTab === 'Catalog' ? styles.activeTab : styles.inactiveTab}>Store Catalog</div>
                    <div onClick={() => setActiveProfileTab('Expo')} style={activeProfileTab === 'Expo' ? styles.activeTab : styles.inactiveTab}>
                        Expo Feed {!isShopSuspended && expoPosts.length > 0 && <span style={styles.tabCount}>{expoPosts.length}</span>}
                    </div>
                </div>

                {activeProfileTab === 'Catalog' ? (
                    <>
                        <div style={styles.localSearchBox}>
                            <Search size={16} color="#94a3b8" />
                            <input type="text" placeholder="Search products in this store..." value={shopSearch} onChange={(e) => setShopSearch(e.target.value)} style={styles.localSearchInput} />
                        </div>

                        {filteredCatalog.length === 0 ? (
                            <div style={styles.emptyFeed}>
                                <Package size={40} color="#cbd5e1" style={{marginBottom: '10px'}} />
                                <p style={{margin: 0, fontWeight: 'bold', color: '#64748b'}}>{shopSearch ? 'No items match your search.' : 'No items available right now.'}</p>
                            </div>
                        ) : (
                            <div style={styles.listView}>
                                {filteredCatalog.map(product => {
                                    const sellPrice = Number(product.price) || 0;
                                    const mrp = Number(product.mrp) || (sellPrice ? Math.round(sellPrice * 1.15) : 0);
                                    const discount = mrp > sellPrice ? Math.round(((mrp - sellPrice) / mrp) * 100) : 0;
                                    const prodImg = getOptimizedImage(product.image_url) || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=200&q=80';

                                    return (
                                        <div key={product.id} style={{...styles.listItem, opacity: isShopSuspended ? 0.5 : 1}}>
                                            <div style={{ display: 'flex', gap: '15px', alignItems: 'center', cursor: isShopSuspended ? 'default' : 'pointer', flex: 1 }} onClick={() => { if (!isShopSuspended) navigate(`/item/${product.id}`) }}>
                                                <img src={prodImg} alt={product.name} crossOrigin="anonymous" referrerPolicy="no-referrer" style={styles.listImg} />
                                                <div style={styles.listDetails}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                        <div>
                                                            <h4 style={styles.listTitle}>{product.name}</h4>
                                                            <span style={styles.unitText}>{product.unit_value || '1'} {product.unit_type || 'Piece'}</span>
                                                        </div>
                                                        <span style={styles.stockBadge}>{isShopSuspended ? 'Unavailable' : 'In Stock'}</span>
                                                    </div>
                                                    <p style={styles.listDesc}>{product.description || 'Premium quality item.'}</p>
                                                    <div style={styles.priceRow}>
                                                        <span style={styles.sellPrice}>₹{sellPrice}</span>
                                                        {mrp > sellPrice && <span style={styles.mrpPrice}>₹{mrp}</span>}
                                                        {discount > 0 && <span style={styles.discountBadge}>{discount}% OFF</span>}
                                                    </div>
                                                </div>
                                            </div>
                                            {!isOwner && (
                                                <div style={styles.listActionBox}>
                                                    <button 
                                                        disabled={isShopSuspended} 
                                                        style={{
                                                            ...styles.addBtn, 
                                                            cursor: isShopSuspended ? 'not-allowed' : 'pointer', 
                                                            background: isShopSuspended ? '#f1f5f9' : (!isDeliverable ? '#fffbeb' : '#eff6ff'), 
                                                            color: isShopSuspended ? '#94a3b8' : (!isDeliverable ? '#d97706' : '#2563eb'), 
                                                            border: isShopSuspended ? '1px solid #cbd5e1' : (!isDeliverable ? '1px solid #fde68a' : '1px solid #bfdbfe')
                                                        }} 
                                                        onClick={() => {
                                                            if (isShopSuspended) return toast.error("This shop is suspended. Orders are disabled.");
                                                            if (!currentUser) return navigate('/welcome');
                                                            if (!isDeliverable) { 
                                                                handleRequestDelivery(); 
                                                                return; 
                                                            }
                                                            navigate(`/item/${product.id}`);
                                                        }}
                                                    >
                                                        {!isDeliverable ? 'Request' : (dbShopType.includes('Services') ? 'Book' : 'Add +')}
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </>
                ) : (
                    <>
                        {isShopSuspended ? (
                            <div style={{ textAlign: 'center', padding: '40px 20px', background: '#fef2f2', borderRadius: '16px', border: '1px dashed #fecaca' }}>
                                <AlertTriangle size={36} color="#dc2626" style={{ marginBottom: '10px' }} />
                                <h4 style={{ margin: '0 0 5px 0', color: '#991b1b', fontSize: '15px' }}>Expo Content Hidden</h4>
                                <p style={{ margin: 0, fontSize: '13px', color: '#b91c1c' }}>This store's Expo posts, likes, and comment interactions have been paused due to active account restrictions.</p>
                            </div>
                        ) : expoPosts.length === 0 ? (
                            <div style={styles.emptyFeed}>
                                <Video size={40} color="#cbd5e1" style={{marginBottom: '10px'}} />
                                <p style={{margin: 0, fontWeight: 'bold', color: '#64748b'}}>{shopData.business_name} hasn't posted to Expo yet.</p>
                            </div>
                        ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '3px', borderRadius: '12px', overflow: 'hidden' }}>
                                {expoPosts.map(post => {
                                    const isVideo = post.media_type === 'video';
                                    const isTextOnly = !post.media_url || post.media_type === 'text';

                                    return (
                                        <div key={post.id} onClick={() => navigate(`/expo?postId=${post.id}`)} style={{ aspectRatio: '1', position: 'relative', background: '#000', cursor: 'pointer', overflow: 'hidden' }}>
                                            {isTextOnly ? (
                                                <div style={{ padding: '10px', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', background: 'linear-gradient(135deg, #2563eb, #8b5cf6)', boxSizing: 'border-box' }}>
                                                    <MessageCircle size={14} color="white" style={{ opacity: 0.8, marginBottom: '4px' }} />
                                                    <span style={{ color: 'white', fontSize: '11px', fontWeight: 'bold', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', textShadow: '0 1px 2px rgba(0,0,0,0.3)', lineHeight: '1.3' }}>
                                                        {post.content || "New Update"}
                                                    </span>
                                                </div>
                                            ) : isVideo ? (
                                                <>
                                                    <video src={`${resolveMediaUrl(post.media_url, 'video')}#t=0.001`} poster={getVideoThumbnail(post.media_url)} preload="metadata" muted playsInline style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                                                    <div style={{position: 'absolute', top: '5px', right: '5px', background: 'rgba(0,0,0,0.5)', borderRadius: '50%', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center'}}><Play size={10} color="white" fill="white" /></div>
                                                </>
                                            ) : (
                                                <img src={resolveMediaUrl(post.media_url, 'image')} alt="Expo" loading="lazy" style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                                            )}
                                            <div style={{position: 'absolute', bottom: '6px', left: '6px', display: 'flex', alignItems: 'center', gap: '4px', color: 'white', fontSize: '11px', fontWeight: 'bold', textShadow: '0 1px 2px rgba(0,0,0,0.8)'}}>
                                                <Heart size={10} fill="white" /> {post.likes_count || 0}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* MODALS */}
            {showTeamModal && (
                <div style={styles.overlay}>
                    <div style={styles.modal}>
                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px'}}>
                            <h3 style={{margin: 0, color: '#0f172a'}}>👥 Manage Shop Team</h3>
                            <X size={20} style={{cursor: 'pointer'}} onClick={() => setShowTeamModal(false)} />
                        </div>
                        <div style={{ background: '#eff6ff', padding: '10px', borderRadius: '8px', border: '1px solid #bfdbfe', marginBottom: '15px', fontSize: '11px', color: '#1e3a8a', fontWeight: 'bold' }}>
                            Free Tier: Link 1 extra Google Account to manage this shop.
                        </div>
                        {!otpMode ? (
                            <form onSubmit={handleRequestStaffOtp} style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                                <input type="email" placeholder="Staff Google Email..." style={{...styles.input, marginBottom: 0, flex: 1}} value={newStaffEmail} onChange={e => setNewStaffEmail(e.target.value)} required />
                                <button type="submit" style={{ background: '#2874f0', color: 'white', border: 'none', borderRadius: '10px', padding: '0 15px', fontWeight: 'bold', cursor: 'pointer' }}>Verify</button>
                            </form>
                        ) : (
                            <form onSubmit={handleVerifyStaff} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px', background: '#f8fafc', padding: '15px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                                <p style={{ margin: 0, fontSize: '12px', fontWeight: 'bold', color: '#0f172a' }}>Enter the 6-digit code sent to {newStaffEmail}</p>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <input type="text" placeholder="000000" maxLength="6" style={{...styles.input, marginBottom: 0, flex: 1, letterSpacing: '4px', fontWeight: 'bold', textAlign: 'center'}} value={staffOtp} onChange={e => setStaffOtp(e.target.value)} required />
                                    <button type="submit" style={{ background: '#16a34a', color: 'white', border: 'none', borderRadius: '10px', padding: '0 15px', fontWeight: 'bold', cursor: 'pointer' }}>Add Staff</button>
                                </div>
                                <span onClick={() => setOtpMode(false)} style={{ fontSize: '11px', color: '#64748b', cursor: 'pointer', textAlign: 'center', textDecoration: 'underline' }}>Cancel</span>
                            </form>
                        )}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {staffList.length === 0 ? (
                                <p style={{ fontSize: '12px', color: '#64748b', textAlign: 'center' }}>No extra team members yet.</p>
                            ) : (
                                staffList.map((staff, i) => (
                                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                        <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#334155' }}>{staff.staff_email}</span>
                                        <button onClick={() => handleRemoveStaff(staff.staff_email)} style={{ background: '#fef2f2', color: '#dc2626', border: 'none', padding: '5px 8px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}><Trash2 size={14} /></button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            {showEditModal && (
                <div style={styles.overlay}>
                    <div style={styles.modal}>
                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px'}}>
                            <h3 style={{margin: 0, color: '#0f172a'}}>Edit Store Profile</h3>
                            <X size={20} style={{cursor: 'pointer'}} onClick={() => setShowEditModal(false)} />
                        </div>
                        {uploadError && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '10px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', marginBottom: '15px' }}>{uploadError}</div>}
                        <form onSubmit={handleUpdateSubmit} style={{display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'left'}}>
                            <div style={styles.uploadBox}>
                                <label style={styles.uploadLabel}><Upload size={16}/> Update Brand Logo</label>
                                <input type="file" accept="image/*" onChange={e => setImageFile(e.target.files[0])} style={{fontSize: '12px', marginTop: '5px'}} />
                            </div>
                          <div>
                                <label style={styles.modalLabel}>
                                    Business Name {!isMasterAdmin && <span style={{ color: '#dc2626', fontSize: '10px' }}>(🔒 Permanent - Admin Only)</span>}
                                </label>
                                <input 
                                    style={{
                                        ...styles.input, 
                                        background: isMasterAdmin ? '#f8fafc' : '#e2e8f0', 
                                        color: isMasterAdmin ? '#0f172a' : '#64748b',
                                        cursor: isMasterAdmin ? 'text' : 'not-allowed',
                                        fontWeight: '700'
                                    }} 
                                    value={editForm.business_name} 
                                    onChange={e => { if (isMasterAdmin) setEditForm({...editForm, business_name: e.target.value}); }} 
                                    readOnly={!isMasterAdmin}
                                    required 
                                />
                            </div>
                            
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={styles.modalLabel}>Founder Name</label>
                                    <input style={styles.input} value={editForm.founder_name} onChange={e => setEditForm({...editForm, founder_name: e.target.value})} placeholder="e.g. Venkata Pavan Kumar" />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={styles.modalLabel}>CEO Name</label>
                                    <input style={styles.input} value={editForm.ceo_name} onChange={e => setEditForm({...editForm, ceo_name: e.target.value})} placeholder="Leave blank if same" />
                                </div>
                            </div>

                            {/* 🟢 LOCKED TO MAP SEARCH ONLY (NO MANUAL TYPING) */}
                            <div>
                                <label style={styles.modalLabel}>Shop Public Location (Search & Select Only)</label>
                                <div 
                                    onClick={() => setShowLocModal('location')} 
                                    style={{...styles.input, background: '#ffffff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', border: '1.5px solid #bfdbfe'}}
                                >
                                    <span style={{ fontSize: '13px', color: editForm.address ? '#0f172a' : '#94a3b8', fontWeight: editForm.address ? '700' : '500' }}>
                                        {editForm.address || 'Click to search & select shop location...'}
                                    </span>
                                    <MapPin size={18} color="#2563eb" style={{ flexShrink: 0 }} />
                                </div>
                            </div>

                            {/* 🟢 DELIVERY ZONES (1st-Word + Sub-Address Chips) */}
                            <div>
                                <label style={styles.modalLabel}>Delivery Areas (Search Village, Mandal, District, State, or India)</label>
                                <div 
                                    style={{...styles.input, background: '#ffffff', cursor: 'pointer', minHeight: '52px', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '6px', border: '1.5px solid #86efac'}} 
                                    onClick={() => setShowLocModal('delivery')}
                                >
                                    {editForm.delivery_areas ? parseDeliveryZones(editForm.delivery_areas).map((zone, idx) => (
                                        <span key={idx} style={{ background: '#dcfce7', color: '#166534', padding: '6px 10px', borderRadius: '12px', fontSize: '11.5px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid #86efac' }}>
                                            <span>
                                                {zone.primary} {zone.sub && <span style={{ fontSize: '10px', opacity: 0.8, fontWeight: '600' }}>({zone.sub})</span>}
                                            </span>
                                            <X size={14} onClick={(e) => { 
                                                e.stopPropagation(); 
                                                const remaining = parseDeliveryZones(editForm.delivery_areas)
                                                    .filter((_, i) => i !== idx)
                                                    .map(z => z.full);
                                                setEditForm({...editForm, delivery_areas: remaining.join(' | ')}); 
                                            }} />
                                        </span>
                                    )) : <span style={{color: '#64748b', fontSize: '13px', fontWeight: '600'}}>🚚 Click to search & add delivery areas (Default: All India)</span>}
                                </div>
                            </div>

                            <div>
                                <label style={styles.modalLabel}>Category / Industry</label>
                                <input list="category-suggestions" style={styles.input} value={editForm.category} onChange={e => setEditForm({...editForm, category: e.target.value})} required placeholder="Click to select, or type..." />
                                <datalist id="category-suggestions">{adminCategories.map(cat => <option key={cat.id} value={cat.name} />)}</datalist>
                            </div>
                            {isMasterAdmin && (
                                <div style={{ background: '#fffbeb', padding: '10px', borderRadius: '8px', border: '1px dashed #f59e0b', marginBottom: '10px' }}>
                                    <label style={{...styles.modalLabel, color: '#b45309'}}>👑 Admin Override: Assign Store Tab</label>
                                    <select style={styles.input} value={editForm.shop_type} onChange={e => setEditForm({...editForm, shop_type: e.target.value})}>
                                        <option value="Products">🛍 Shopping & Retail</option><option value="Services">🧑‍🔧 Services & Bookings</option><option value="Business">📈 Business & Enterprise</option><option value="Promotions">📢 Promotions & Offers</option>
                                    </select>
                                </div>
                            )}
                            <div>
                                <label style={styles.modalLabel}>Store Status</label>
                                <select style={styles.input} value={editForm.is_online ? 'true' : 'false'} onChange={e => setEditForm({...editForm, is_online: e.target.value === 'true'})}>
                                    <option value="true">🟢 Accepting Orders / Bookings</option><option value="false">🔴 Currently Closed</option>
                                </select>
                            </div>
                            <button type="submit" style={styles.saveBtn}><Check size={16} /> Save Changes</button>
                        </form>
                    </div>
                </div>
            )}

            {/* 🟢 MAP SEARCH MODAL WITH QUICK STATE/INDIA PRESETS */}
            {showLocModal && (
                <div style={styles.overlay}>
                    <div className="touch-scale" style={styles.locModal}>
                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px'}}>
                            <h3 style={{margin: 0, fontSize: '17px', color: '#0f172a', fontWeight: '900'}}>
                                {showLocModal === 'location' ? '📍 Select Shop Location' : '🚚 Add Delivery Area'}
                            </h3>
                            <X size={20} style={{cursor: 'pointer', color: '#64748b'}} onClick={() => { setShowLocModal(false); setLocSearch(''); setLocResults([]); }} />
                        </div>

                        {showLocModal === 'delivery' && (
                            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
                                <button type="button" onClick={() => selectCustomLocation({ display_name: 'Andhra Pradesh, India' })} style={{ background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', padding: '6px 12px', borderRadius: '16px', fontSize: '11.5px', fontWeight: '800', cursor: 'pointer' }}>
                                    + Entire Andhra Pradesh
                                </button>
                                <button type="button" onClick={() => selectCustomLocation({ display_name: 'India' })} style={{ background: '#f0fdf4', color: '#15803d', border: '1px solid #86efac', padding: '6px 12px', borderRadius: '16px', fontSize: '11.5px', fontWeight: '800', cursor: 'pointer' }}>
                                    + All India
                                </button>
                            </div>
                        )}

                        <div style={{position: 'relative', marginTop: '8px'}}>
                            <Search size={18} color="#94a3b8" style={{position: 'absolute', left: '12px', top: '14px'}} />
                            <input 
                                type="text" 
                                placeholder="Search village, mandal, district, or pincode..." 
                                style={styles.locInput} 
                                value={locSearch} 
                                onChange={(e) => handleLocationSearch(e.target.value)} 
                                autoFocus 
                            />
                            {isSearching && <Loader size={16} className="spin" color="#2563eb" style={{position: 'absolute', right: '12px', top: '14px'}} />}
                        </div>
                        {locResults.length > 0 && (
                            <div style={styles.locResultsBox}>
                                {locResults.map((loc, i) => {
                                    const parts = loc.display_name.split(',').map(p => p.trim());
                                    const primary = parts[0];
                                    const sub = parts.slice(1).join(', ');
                                    return (
                                        <div key={i} className="touch-scale" style={styles.locItem} onClick={() => selectCustomLocation(loc)}>
                                            <MapPin size={16} color="#2563eb" style={{flexShrink: 0, marginTop: '2px'}} />
                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                <span style={{fontSize: '14px', fontWeight: '800', color: '#0f172a'}}>{primary}</span>
                                                <span style={{fontSize: '11.5px', color: '#64748b'}}>{sub}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {showFollowersModal && (
                <div style={styles.overlay} onClick={() => setShowFollowersModal(false)}>
                    <div style={{...styles.modal, maxHeight: '400px'}} onClick={e => e.stopPropagation()}>
                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', paddingBottom: '10px', borderBottom: '1px solid #e2e8f0'}}>
                            <h3 style={{margin: 0, fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px'}}>
                                <Users size={18} color="#2563eb"/> Followers ({followersList.length})
                            </h3>
                            <X size={20} style={{cursor: 'pointer', color: '#64748b'}} onClick={() => setShowFollowersModal(false)} />
                        </div>
                        <div style={{overflowY: 'auto', maxHeight: '300px'}} className="hide-scroll">
                            {followersList.length === 0 ? <p style={{textAlign: 'center', color: '#94a3b8', fontSize: '13px'}}>No followers yet.</p> : null}
                            {followersList.map(u => {
                                const isUserOfficial = u.role === 'admin' || u.id === 1;
                                const isUserVerified = u.is_verified;
                                const isUserShop = u.shop_id && String(u.shop_id) !== 'null' && String(u.shop_id) !== 'undefined';
                                const displayName = u.business_name || u.username || 'User';

                                return (
                                    <div key={u.id} style={{display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 0', borderBottom: '1px solid #f1f5f9'}}>
                                        <img src={getFallbackAvatar(displayName)} alt="Avatar" style={{width: '32px', height: '32px', borderRadius: '50%'}} />
                                        <span style={{fontSize: '14px', fontWeight: '700', color: '#0f172a'}}>{displayName}</span>
                                        {renderBadge(isUserOfficial, isUserVerified, 'active', isUserShop)}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const styles = {
    page: { background: '#f8fafc', minHeight: '100vh', fontFamily: 'Inter, sans-serif', paddingBottom: '50px' },
    loading: { textAlign: 'center', padding: '50px', fontWeight: 'bold', color: '#64748b' },
    navBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 20px', background: 'white', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 2px 10px rgba(0,0,0,0.05)' },
    backBtn: { display: 'flex', alignItems: 'center', gap: '6px', background: 'transparent', border: 'none', cursor: 'pointer', color: '#0f172a', fontWeight: 'bold', fontSize: '15px', padding: 0 },
    downloadIconBtn: { display: 'flex', alignItems: 'center', gap: '6px', background: '#dcfce7', border: '1px solid #86efac', cursor: 'pointer', color: '#166534', fontWeight: 'bold', fontSize: '12px', padding: '6px 12px', borderRadius: '8px' },
    shareIconBtn: { display: 'flex', alignItems: 'center', gap: '6px', background: '#f1f5f9', border: '1px solid #cbd5e1', cursor: 'pointer', color: '#0f172a', fontWeight: 'bold', fontSize: '12px', padding: '6px 12px', borderRadius: '8px' },
    bannerBackground: { height: '160px', width: '100%', display: 'flex', alignItems: 'center', boxSizing: 'border-box' },
    bannerTextContainer: { display: 'flex', flexDirection: 'column', width: '100%', maxWidth: '800px', margin: '0 auto', padding: '0 20px', marginBottom: '20px' },
    bannerCategoryText: { fontSize: '12px', fontWeight: 'bold', color: 'white', opacity: 0.9, textTransform: 'uppercase', letterSpacing: '1px' },
    bannerTitleText: { margin: '2px 0 0 0', fontSize: '28px', fontWeight: '900', color: 'white', textShadow: '0 2px 4px rgba(0,0,0,0.2)' },
    profileContentWrapper: { padding: '0 20px', marginTop: '-45px', position: 'relative', zIndex: 2, maxWidth: '800px', margin: '-45px auto 0 auto' },
    avatarRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' },
    avatarContainer: { position: 'relative' },
    businessLogo: { width: '90px', height: '90px', borderRadius: '16px', objectFit: 'cover', backgroundColor: 'white' },
    businessLogoGold: { width: '90px', height: '90px', borderRadius: '16px', objectFit: 'cover', border: '4px solid #facc15', backgroundColor: 'white', boxShadow: '0 4px 15px rgba(250, 204, 21, 0.4)' },
    onlineBadge: { position: 'absolute', bottom: '-4px', right: '-4px', width: '18px', height: '18px', background: '#22c55e', border: '3px solid white', borderRadius: '50%' },
    realMetricsBox: { background: 'white', padding: '10px 15px', borderRadius: '12px', display: 'flex', alignItems: 'center', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', marginBottom: '10px' },
    metricNumber: { fontSize: '16px', fontWeight: '900', color: '#0f172a', lineHeight: '1' },
    metricLabel: { fontSize: '11px', color: '#64748b', fontWeight: 'bold' },
    bioSection: { marginTop: '15px' },
    shopName: { margin: '0 0 5px 0', fontSize: '22px', fontWeight: '900', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '6px', color: '#0f172a' },
    categoryTag: { display: 'inline-block', padding: '4px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', marginBottom: '8px' },
    address: { margin: 0, color: '#475569', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '500' },
    adminControlPanel: { marginTop: '20px', padding: '15px', borderRadius: '12px' },
    adminBtn: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px', background: 'white', border: '1px solid #cbd5e1', color: '#0f172a', borderRadius: '8px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer' },
    primaryAdminBtn: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px', border: 'none', color: 'white', borderRadius: '8px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer' },
    actionButtonsRow: { display: 'flex', gap: '10px', marginTop: '20px' },
    primaryActionBtn: { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', border: 'none', padding: '12px', borderRadius: '10px', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' },
    followingBtn: { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', border: '1px solid #cbd5e1', padding: '12px', borderRadius: '10px', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer' },
    secondaryActionBtn: { flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', background: '#e2e8f0', color: '#0f172a', border: 'none', padding: '12px', borderRadius: '10px', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer' },
    notifMenu: { position: 'absolute', top: '55px', right: 0, background: 'white', border: '1px solid #e2e8f0', borderRadius: '10px', boxShadow: '0 10px 15px rgba(0,0,0,0.1)', zIndex: 50, width: '130px', overflow: 'hidden' },
    notifItem: { padding: '10px 15px', fontSize: '13px', fontWeight: 'bold', color: '#334155', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #f1f5f9' },
    feedSection: { marginTop: '20px', background: 'white', borderTopLeftRadius: '20px', borderTopRightRadius: '20px', padding: '20px', minHeight: '300px', maxWidth: '800px', margin: '0 auto', border: '1px solid #e2e8f0' },
    feedTabs: { display: 'flex', borderBottom: '2px solid #f1f5f9', marginBottom: '15px', gap: '20px' },
    activeTab: { padding: '10px 0', fontWeight: 'bold', borderBottom: '3px solid #0f172a', color: '#0f172a', fontSize: '15px', marginBottom: '-2px', cursor: 'pointer', display: 'flex', alignItems: 'center' },
    inactiveTab: { padding: '10px 0', fontWeight: 'bold', color: '#94a3b8', fontSize: '15px', cursor: 'pointer', display: 'flex', alignItems: 'center' },
    tabCount: { background: '#e2e8f0', color: '#0f172a', padding: '2px 6px', borderRadius: '10px', fontSize: '11px', marginLeft: '6px' },
    localSearchBox: { display: 'flex', alignItems: 'center', background: '#f1f5f9', padding: '10px 15px', borderRadius: '10px', gap: '8px', marginBottom: '20px' },
    localSearchInput: { border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '14px', color: '#334155' },
    emptyFeed: { textAlign: 'center', padding: '40px 20px', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1', display: 'flex', flexDirection: 'column', alignItems: 'center' },
    listView: { display: 'flex', flexDirection: 'column', gap: '15px' },
    listItem: { display: 'flex', gap: '15px', paddingBottom: '15px', borderBottom: '1px solid #f1f5f9', alignItems: 'center' },
    listImg: { width: '80px', height: '80px', borderRadius: '12px', objectFit: 'cover', background: '#f8fafc' },
    listDetails: { flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' },
    listTitle: { margin: '0 0 4px 0', fontSize: '15px', color: '#0f172a', fontWeight: 'bold' },
    unitText: { fontSize: '12px', color: '#64748b' },
    listDesc: { margin: '0 0 8px 0', fontSize: '12px', color: '#64748b', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' },
    priceRow: { display: 'flex', alignItems: 'center', gap: '8px' },
    sellPrice: { fontSize: '15px', fontWeight: '900', color: '#16a34a' },
    mrpPrice: { fontSize: '12px', color: '#94a3b8', textDecoration: 'line-through', fontWeight: '500' },
    discountBadge: { fontSize: '10px', background: '#dcfce7', color: '#16a34a', padding: '2px 6px', borderRadius: '6px', fontWeight: 'bold' },
    stockBadge: { fontSize: '10px', color: '#0f172a', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' },
    listActionBox: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center' },
    addBtn: { background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', padding: '6px 16px', borderRadius: '8px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer' },
    overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', zIndex: 1000 },
    modal: { background: 'white', padding: '25px', borderRadius: '20px', maxWidth: '400px', width: '100%', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', maxHeight: '90vh', overflowY: 'auto' },
    modalLabel: { fontSize: '12px', fontWeight: 'bold', color: '#475569', marginBottom: '4px', display: 'block' },
    input: { padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', width: '100%', boxSizing: 'border-box', background: '#f8fafc', marginBottom: '10px', outline: 'none' },
    uploadBox: { background: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px dashed #cbd5e1', display: 'flex', flexDirection: 'column', marginBottom: '10px' },
    uploadLabel: { fontSize: '12px', fontWeight: 'bold', color: '#2563eb', display: 'flex', alignItems: 'center', gap: '5px' },
    saveBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', background: '#16a34a', color: 'white', border: 'none', padding: '14px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', width: '100%', marginTop: '10px', fontSize: '15px' },
    locModal: { background: 'white', padding: '25px', borderRadius: '20px', maxWidth: '400px', width: '100%', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' },
    locInput: { padding: '14px 14px 14px 40px', borderRadius: '12px', border: '2px solid #2563eb', fontSize: '14px', width: '100%', boxSizing: 'border-box', outline: 'none' },
    locResultsBox: { marginTop: '15px', maxHeight: '220px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '12px' },
    locItem: { padding: '12px', borderBottom: '1px solid #f1f5f9', cursor: 'pointer', display: 'flex', alignItems: 'flex-start', gap: '10px' }
};

export default ShopProfile;