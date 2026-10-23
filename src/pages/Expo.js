import React, { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { ArrowLeft, Home, Heart, MessageCircle, Share2, Store, Plus, MoreVertical, MapPin, Image as ImageIcon, Video, Search, Sparkles, X, Loader, BadgeCheck, Trash2, Tag, Clock, ShoppingBag, MessageSquareOff, Reply, UserPlus, Check, Eye, Users, ShieldAlert, Flag, Scissors, ChevronRight, Globe, Music } from 'lucide-react';
import { toast } from 'react-toastify';
import axios from 'axios';

const getBackendUrl = () => process.env.NODE_ENV === 'production' ? 'https://bhavyams-vendorhub-backend.onrender.com/api' : 'http://localhost:5000/api';

const resolveMediaUrl = (url, type = 'image') => {
    if (!url) return null;
    if (type === 'video' || url.match(/\.(mp4|webm|ogg|mov)$/i) || url.includes('video/upload')) return url.startsWith('http') ? url : `${getBackendUrl().replace('/api', '')}/uploads/${url.replace(/\\/g, '/').split('uploads/').pop()}`;
    if (url.includes('cloudinary.com') && !url.includes('q_auto') && !url.endsWith('.gif')) return url.replace('/upload/', '/upload/q_auto,f_auto,w_800/');
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:') || url.startsWith('blob:')) return url;
    return `${getBackendUrl().replace('/api', '')}/${url.replace(/\\/g, '/')}`;
};

const getFallbackAvatar = (name) => `https://ui-avatars.com/api/?name=${name ? encodeURIComponent(name) : 'User'}&background=random&color=fff&bold=true`;

const timeAgo = (dateString) => {
    if (!dateString) return 'Just now';
    let safeDate = typeof dateString === 'string' && !dateString.includes('Z') && !dateString.includes('T') ? dateString.replace(' ', 'T') + 'Z' : dateString;
    const seconds = Math.floor((new Date() - new Date(safeDate)) / 1000);
    if (seconds < 60) return 'Just now';
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + "y ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + "mo ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + "d ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "h ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "m ago";
    return "Just now";
};

const formatSec = (s) => {
    const secNum = Math.max(0, Math.floor(Number(s) || 0));
    const m = Math.floor(secNum / 60);
    const rem = secNum % 60;
    return `${m}:${rem < 10 ? '0' : ''}${rem}`;
};

const FRONTEND_BAD_WORDS = [
    'fuck', 'shit', 'bitch', 'bastard', 'asshole', 'dick', 'pussy', 'porn', 'xxx', 'nude', 'sex',
    'scam', 'fraud', 'betting', 'casino', 'matka', 'ganja',
    'lanja', 'dengey', 'dengu', 'modda', 'gudda', 'puka', 'puku', 'bokka', 'erripuka', 'kojja',
    'లంజ', 'దెంగు', 'మొడ్డ', 'పూకు'
];

const hasVulgarText = (text) => {
    if (!text) return false;
    const lower = String(text).toLowerCase();
    const compact = lower.replace(/[\s\-_.*@!$]/g, '');
    return FRONTEND_BAD_WORDS.some(w => new RegExp(`\\b${w}\\b`, 'i').test(lower) || (w.length >= 4 && compact.includes(w)));
};

const renderBadge = (isOfficial, isVerified, accountStatus, hasShop = true) => {
    const isVer = isVerified === true || String(isVerified).toLowerCase() === 'true';
    if (accountStatus === 'perma_banned') return <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', background: '#0f172a', color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '10px', fontWeight: '900', border: '1px solid #334155', marginLeft: '4px' }}>⬛ Banned</span>;
    if (accountStatus === 'temp_block') return <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', background: '#fef2f2', color: '#dc2626', padding: '2px 8px', borderRadius: '12px', fontSize: '10px', fontWeight: '900', border: '1px solid #fecaca', marginLeft: '4px' }}>🟥 Suspended</span>;
    if (isOfficial) return <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', background: '#fef3c7', color: '#b45309', padding: '2px 8px', borderRadius: '12px', fontSize: '10px', fontWeight: '900', border: '1px solid #fde68a', marginLeft: '4px' }}><BadgeCheck size={12} color="#ffffff" fill="#FFD700" /> Official</span>;
    if (isVer) return <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', background: '#dcfce7', color: '#15803d', padding: '2px 8px', borderRadius: '12px', fontSize: '10px', fontWeight: '900', border: '1px solid #86efac', marginLeft: '4px' }}><BadgeCheck size={12} color="#ffffff" fill="#10b981" /> Verified</span>;
    if (hasShop) return <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', background: '#eff6ff', color: '#1d4ed8', padding: '2px 8px', borderRadius: '12px', fontSize: '10px', fontWeight: '800', border: '1px solid #bfdbfe', marginLeft: '4px' }}><BadgeCheck size={12} color="#ffffff" fill="#3b82f6" /> Standard</span>;
    return null; 
};

const Expo = () => {
    const navigate = useNavigate();
    const { language, setLanguage } = useContext(AppContext);
    const [localLang, setLocalLang] = useState(() => language === 'te' ? 'te' : 'en');
    const lang = localLang;

    const toggleLanguage = () => {
        const next = lang === 'en' ? 'te' : 'en';
        setLocalLang(next);
        if (typeof setLanguage === 'function') setLanguage(next);
    };
    
    const userStr = localStorage.getItem('user');
    const localUser = userStr && userStr !== 'undefined' ? JSON.parse(userStr) : null;
    const isAdmin = Boolean(localUser && (localUser.role === 'admin' || localUser.email === 'pavanvenkat63@gmail.com'));
    const isVendor = localUser?.role === 'vendor';
    
    const [allPosts, setAllPosts] = useState([]);
    const [expoBanners, setExpoBanners] = useState([]);
    const [loading, setLoading] = useState(true); 
    const [activeDropdown, setActiveDropdown] = useState(null); 
    const [activeTab, setActiveTab] = useState('All'); 
    
    const [followingMap, setFollowingMap] = useState({});
    const [viewedPosts, setViewedPosts] = useState(() => {
        try { return new Set(JSON.parse(sessionStorage.getItem('subhams_viewed_posts')) || []); } 
        catch (e) { return new Set(); }
    });

    const [expandedComments, setExpandedComments] = useState({}); 
    const [postComments, setPostComments] = useState({}); 
    const [newComment, setNewComment] = useState('');
    const [replyingTo, setReplyingTo] = useState(null);
    const [showLikesModal, setShowLikesModal] = useState({ isOpen: false, likes: [] });

    const [reportingPost, setReportingPost] = useState(null);
    const [reportReason, setReportReason] = useState('Fake product or misleading offer');

    const [showBannerModal, setShowBannerModal] = useState(false);
    const [newBanner, setNewBanner] = useState({ title: '', subtitle: '', badge_text: 'Sponsored', media_url: '', action_url: '/', ambient_color: '#0f172a' });

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [postText, setPostText] = useState('');
    const [mediaFile, setMediaFile] = useState(null);
    const [mediaPreview, setMediaPreview] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [allowComments, setAllowComments] = useState(true);
    const [selectedAmbientColor, setSelectedAmbientColor] = useState('#1e293b');

    const videoRef = useRef(null);
    const [videoDuration, setVideoDuration] = useState(0);
    const [trimStart, setTrimStart] = useState(0); 
    const [clipLength, setClipLength] = useState(60);

    const [isTaggingMenuOpen, setIsTaggingMenuOpen] = useState(false);
    const [tagSearchQuery, setTagSearchQuery] = useState('');
    const [liveTagOptions, setLiveTagOptions] = useState([]);
    const [selectedTag, setSelectedTag] = useState(null); 

    const [myShopStatus, setMyShopStatus] = useState({ is_verified: false, is_official: false, id: null });

    useEffect(() => {
        window.history.pushState({ page: 'expo' }, 'Expo', window.location.href);
        const handlePopState = (e) => {
            e.preventDefault();
            navigate('/');
        };
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [navigate]);

    useEffect(() => { 
        fetchFeed(); 
        if (localUser) {
            fetchFollowing();
            const token = localStorage.getItem('token');
            if (token) {
                axios.get(`${getBackendUrl()}/shops/my-shop`, { headers: { Authorization: `Bearer ${token}` } })
                .then(res => {
                    if (res.data?.hasShop && res.data?.shop) {
                        setMyShopStatus({
                            is_verified: res.data.shop.is_verified === true || String(res.data.shop.is_verified).toLowerCase() === 'true',
                            is_official: String(res.data.shop.user_id) === "1" || res.data.shop.user_email === 'pavanvenkat63@gmail.com',
                            id: res.data.shop.id
                        });
                    }
                }).catch(() => {});
            }
        }
    }, [localUser?.id]);

    useEffect(() => {
        const queryParams = new URLSearchParams(window.location.search);
        const postIdToOpen = queryParams.get('postId');
        if (postIdToOpen && allPosts.length > 0) {
            setTimeout(() => {
                const element = document.getElementById(`post-${postIdToOpen}`);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    element.style.boxShadow = '0 0 25px rgba(79, 70, 229, 0.5)';
                    setTimeout(() => { element.style.boxShadow = ''; }, 3500);
                }
            }, 300);
        }
    }, [allPosts.length]);

    useEffect(() => {
        if (!isTaggingMenuOpen) return;
        const fetchLiveTags = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get(`${getBackendUrl()}/expo/tags?q=${tagSearchQuery}`, { headers: { Authorization: `Bearer ${token}` } });
                setLiveTagOptions(res.data.tags || []);
            } catch (err) {}
        };
        const delayDebounce = setTimeout(() => fetchLiveTags(), 300);
        return () => clearTimeout(delayDebounce);
    }, [tagSearchQuery, isTaggingMenuOpen]);

    const fetchFeed = async () => {
        try {
            const token = localStorage.getItem('token');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            const res = await axios.get(`${getBackendUrl()}/expo/feed`, { headers });
            const validPosts = (res.data.posts || []).filter(p => p !== null && p !== undefined);
            setAllPosts(validPosts);
            if (res.data.banners) setExpoBanners(res.data.banners);
        } catch (err) { toast.error("Failed to fetch feed!"); } finally { setLoading(false); }
    };

    const fetchFollowing = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${getBackendUrl()}/expo/following`, { headers: { Authorization: `Bearer ${token}` } });
            setFollowingMap(res.data.following || {});
        } catch (err) {}
    };

    const handleView = async (postId) => {
        if (viewedPosts.has(postId)) return;
        const newSet = new Set(viewedPosts).add(postId);
        setViewedPosts(newSet);
        sessionStorage.setItem('subhams_viewed_posts', JSON.stringify([...newSet]));
        setAllPosts(prevPosts => prevPosts.map(p => p.id === postId ? { ...p, views_count: (Number(p.views_count) || 0) + 1 } : p));
        try { await axios.post(`${getBackendUrl()}/expo/${postId}/view`); } catch (err) {}
    };

    const handleFollowToggle = async (shopId) => {
        if (!localUser) return navigate('/welcome');
        const isFollowing = followingMap[shopId];
        setFollowingMap(prev => ({ ...prev, [shopId]: !isFollowing }));
        try {
            const token = localStorage.getItem('token');
            await axios.post(`${getBackendUrl()}/expo/follow/${shopId}`, {}, { headers: { Authorization: `Bearer ${token}` } });
        } catch (err) {
            try {
                const token = localStorage.getItem('token');
                await axios.post(`${getBackendUrl()}/follow/${shopId}`, {}, { headers: { Authorization: `Bearer ${token}` } });
            } catch (e2) {
                setFollowingMap(prev => ({ ...prev, [shopId]: isFollowing }));
                toast.error("Failed to follow shop.");
            }
        }
    };

    const handleDeletePost = async (postId) => {
        if (!window.confirm("Delete this post permanently?")) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${getBackendUrl()}/expo/${postId}`, { headers: { Authorization: `Bearer ${token}` } });
            setAllPosts(allPosts.filter(p => p.id !== postId));
            toast.success("Post deleted.");
        } catch (err) { toast.error("Failed to delete post."); }
        setActiveDropdown(null);
    };

    const handleReportSubmit = async (e) => {
        e.preventDefault();
        if (!reportingPost) return;
        if (!localUser) return navigate('/welcome');
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(
                `${getBackendUrl()}/expo/${reportingPost.id}/report`,
                { reason: reportReason },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success(res.data.message || "🛡️ Report sent to Admin!");
            setReportingPost(null);
        } catch (err) {
            toast.error("Failed to send report.");
        }
    };

    const handleLike = async (postId) => {
        if (!localUser) return navigate('/welcome');
        setAllPosts(allPosts.map(post => {
            if (post && post.id === postId) {
                const currentlyLiked = post.isLikedByMe === true || String(post.isLikedByMe) === 'true';
                return { ...post, isLikedByMe: !currentlyLiked, likes_count: currentlyLiked ? Math.max(0, Number(post.likes_count) - 1) : Number(post.likes_count) + 1 };
            }
            return post;
        }));
        try {
            const token = localStorage.getItem('token');
            await axios.post(`${getBackendUrl()}/expo/${postId}/like`, {}, { headers: { Authorization: `Bearer ${token}` } });
        } catch (err) { fetchFeed(); }
    };

    const fetchLikesList = async (postId) => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${getBackendUrl()}/expo/${postId}/likes`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
            const likesArray = res.data.likes || (Array.isArray(res.data) ? res.data : []);
            setShowLikesModal({ isOpen: true, likes: likesArray });
        } catch (err) { toast.error("Could not fetch likes."); }
    };

    const toggleComments = async (postId) => {
        const isOpening = !expandedComments[postId];
        setExpandedComments(prev => ({ ...prev, [postId]: isOpening }));
        setReplyingTo(null);
        if (isOpening) {
            try {
                const res = await axios.get(`${getBackendUrl()}/expo/${postId}/comments`);
                setPostComments(prev => ({ ...prev, [postId]: res.data.comments || [] }));
            } catch (err) {}
        }
    };

    const handlePostComment = async (e, postId) => {
        e.preventDefault();
        if (!newComment.trim() || !localUser) return;

        if (hasVulgarText(newComment)) {
            return toast.error("🚫 Security Scanner: Vulgar or abusive words are blocked!");
        }
        
        const commentText = newComment;
        const parentId = replyingTo?.postId === postId ? replyingTo.commentId : null;
        setNewComment('');
        setReplyingTo(null);
        
        const isMaster = localUser.role === 'admin' || localUser.email === 'pavanvenkat63@gmail.com';
        const tempComment = { id: Date.now(), display_name: isMaster ? 'Subhams Hub Official' : (localUser.business_name || localUser.username || 'You'), role: localUser.role, user_email: localUser.email, text: commentText, parent_comment_id: parentId, user_id: localUser.id };
        
        setPostComments(prev => ({ ...prev, [postId]: [...(prev[postId] || []), tempComment] }));
        setAllPosts(allPosts.map(p => p.id === postId ? { ...p, comments_count: Number(p.comments_count) + 1 } : p));

        try {
            const token = localStorage.getItem('token');
            await axios.post(`${getBackendUrl()}/expo/${postId}/comment`, { text: commentText, parent_comment_id: parentId }, { headers: { Authorization: `Bearer ${token}` } });
        } catch (err) { toast.error(err.response?.data?.message || "Failed to save comment."); }
    };

    const handleDeleteComment = async (postId, commentId) => {
        if (!window.confirm("Delete this comment?")) return;
        setPostComments(prev => ({ ...prev, [postId]: prev[postId].filter(c => c.id !== commentId && c.parent_comment_id !== commentId) }));
        setAllPosts(allPosts.map(p => p.id === postId ? { ...p, comments_count: Math.max(0, Number(p.comments_count) - 1) } : p));
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${getBackendUrl()}/expo/comment/${commentId}`, { headers: { Authorization: `Bearer ${token}` } });
        } catch (err) {}
    };

    const handleMediaSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (hasVulgarText(file.name)) {
            e.target.value = '';
            return toast.error("🚫 Security Scanner: File name contains restricted words.");
        }

        setTrimStart(0);

        if (file.type.startsWith('video/')) {
            const video = document.createElement('video');
            video.preload = 'metadata';
            video.onloadedmetadata = function() {
                window.URL.revokeObjectURL(video.src);
                const dur = Math.max(1, Math.floor(video.duration));
                setVideoDuration(dur);
                setClipLength(Math.min(60, dur));
                setMediaFile(file);
                setMediaPreview(URL.createObjectURL(file));
                if (dur > 60) {
                    toast.info(`✂️ Video is ${formatSec(dur)} long! Drag the timeline slider below to pick any 60-second highlight.`);
                }
            };
            video.src = URL.createObjectURL(file);
        } else {
            setVideoDuration(0);
            setMediaFile(file);
            setMediaPreview(URL.createObjectURL(file));
        }
    };

    const handleTrimStartChange = (e) => {
        const newStart = parseInt(e.target.value, 10) || 0;
        setTrimStart(newStart);
        if (videoRef.current) {
            videoRef.current.currentTime = newStart;
            videoRef.current.play().catch(() => {});
        }
    };

    const handleClipLengthChange = (e) => {
        const newLen = Math.min(60, Math.max(5, parseInt(e.target.value, 10) || 60));
        setClipLength(newLen);
        if (trimStart + newLen > videoDuration) {
            setTrimStart(Math.max(0, videoDuration - newLen));
        }
    };

    const handleRequestVerification = async () => {
        if (!myShopStatus.id) return toast.info("Shop profile not loaded yet.");
        try {
            const token = localStorage.getItem('token');
            await axios.post(`${getBackendUrl()}/shops/${myShopStatus.id}/request-verification`, {}, { headers: { Authorization: `Bearer ${token}` }});
            toast.success("🛡️ Request sent! Admin will review your shop.");
        } catch (err) {
            toast.error("Failed to send verification request.");
        }
    };

    const handleBannerFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (ev) => {
            setNewBanner(prev => ({ ...prev, media_url: ev.target.result }));
            toast.success("🎞️ Ad image ready!");
        };
    };

    const handleCreateExpoBanner = async (e) => {
        e.preventDefault();
        if (!newBanner.title || !newBanner.media_url) return toast.error("Title and Banner Image are required.");
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(`${getBackendUrl()}/expo/banners`, newBanner, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setExpoBanners([res.data.banner, ...expoBanners]);
            setNewBanner({ title: '', subtitle: '', badge_text: 'Sponsored', media_url: '', action_url: '/', ambient_color: '#0f172a' });
            toast.success("🎉 Ad Banner added!");
        } catch (err) {
            toast.error("Failed to save banner.");
        }
    };

    const handleDeleteExpoBanner = async (id) => {
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${getBackendUrl()}/expo/banners/${id}`, { headers: { Authorization: `Bearer ${token}` } });
            setExpoBanners(expoBanners.filter(b => b.id !== id));
            toast.info("Banner removed.");
        } catch (err) {}
    };

    const submitPost = async (e) => {
        e.preventDefault();
        if (!postText.trim() && !mediaFile) return toast.error("Post cannot be empty!");

        if (hasVulgarText(postText)) {
            return toast.error("🚫 Security Scanner: Vulgar or prohibited words detected in your post!");
        }
        
        setIsUploading(true);
        try {
            const token = localStorage.getItem('token');
            const formData = new FormData();
            
            formData.append('content', postText);
            formData.append('allow_comments', allowComments);
            formData.append('bg_music', 'none'); 
            formData.append('bg_music_title', '');
            formData.append('bg_music_url', '');
            formData.append('ambient_color', selectedAmbientColor);
            
            if (selectedTag) {
                formData.append('tagged_item_id', selectedTag.id);
                formData.append('tagged_item_type', selectedTag.type);
                formData.append('tagged_item_name', selectedTag.name);
            }
            
            if (mediaFile) {
                formData.append('media', mediaFile);
                formData.append('media_type', mediaFile.type.startsWith('video') ? 'video' : 'image');
                if (mediaFile.type.startsWith('video')) {
                    formData.append('trim_start', trimStart); 
                    formData.append('trim_end', Math.min(videoDuration || 60, trimStart + clipLength)); 
                }
            } else {
                formData.append('media_type', 'text');
            }

            const res = await axios.post(`${getBackendUrl()}/expo/create`, formData, { headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } });
            if (res.data.post) { setAllPosts([res.data.post, ...allPosts]); } else { await fetchFeed(); }
            
            toast.success("🎉 Post published to Subhams Expo!");
            setShowCreateModal(false);
            setPostText('');
            setSelectedTag(null);
            setMediaFile(null);
            setMediaPreview(null);
            setAllowComments(true);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (err) { toast.error(err.response?.data?.message || "Failed to post."); } finally { setIsUploading(false); }
    };

    const handleWhatsAppShare = (post) => {
        const postUrl = `${window.location.origin}/expo?postId=${post.id}`;
        const shareText = `🌟 *${post.shop_name}* on Subhams Expo:\n${post.content ? `"${post.content}"\n` : ''}👉 Watch here: ${postUrl}`;
        window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank');
    };

    // Helper to render individual Ad Banners gracefully in the feed
    const renderPromoBanner = (banner, uniqueKey) => {
        if (!banner) return null;
        return (
            <div 
                key={`ad-banner-${uniqueKey}-${banner.id}`}
                onClick={() => {
                    if (banner.action_url?.startsWith('http')) window.open(banner.action_url, '_blank');
                    else navigate(banner.action_url || '/');
                }}
                className="touch-scale"
                style={{ ...styles.postCard, border: '2px solid #facc15', cursor: 'pointer', marginBottom: '20px' }}
            >
                <div style={{...styles.postHeader, background: '#fffbeb'}}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                        <div style={styles.shopLogoWrapperGold}>
                            <img src={banner.media_url} alt="Promo" style={styles.shopLogo} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
                                <span style={styles.shopName}>{banner.title}</span>
                                <BadgeCheck size={12} color="#ffffff" fill="#f59e0b" />
                            </div>
                            <span style={styles.postMeta}>
                                <Sparkles size={10} color="#d97706"/> 
                                <span style={{color: '#d97706', fontWeight: '800'}}>{banner.badge_text || 'Sponsored'}</span>
                            </span>
                        </div>
                    </div>
                    <button style={{ background: '#facc15', color: '#713f12', border: 'none', borderRadius: '16px', padding: '6px 14px', fontWeight: '900', fontSize: '11.5px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        Open <ChevronRight size={14} style={{strokeWidth: 3}}/>
                    </button>
                </div>
                {banner.subtitle && (
                    <div style={{...styles.postContent, background: '#fffbeb', paddingBottom: '12px'}}>
                        {banner.subtitle}
                    </div>
                )}
                <div style={{
                    ...styles.mediaContainer,
                    background: `radial-gradient(circle at center, ${banner.ambient_color || '#b45309'} 0%, #090d16 100%)`
                }}>
                    <img src={banner.media_url} alt="" aria-hidden="true" style={styles.ambientBackdropMedia} />
                    <img src={banner.media_url} alt="Promo Banner" style={styles.mediaElement} loading="lazy" />
                </div>
            </div>
        );
    };

    const displayPostsData = allPosts.filter(post => {
        const isLiked = post.isLikedByMe === true || String(post.isLikedByMe) === 'true';
        if (activeTab === 'Videos') return post.media_type === 'video';
        if (activeTab === 'Photos') return post.media_type === 'image';
        if (activeTab === 'Activity') return isLiked || String(post.owner_id) === String(localUser?.id);
        return true; 
    });

    const isOwnerOrVendor = Boolean(myShopStatus.id || isVendor);
    const canPost = (isOwnerOrVendor || isAdmin) && localUser?.account_status !== 'temp_block' && localUser?.account_status !== 'perma_banned';
    const isVerifiedOrOfficial = myShopStatus.is_verified || myShopStatus.is_official || isAdmin;

    return (
        <div style={styles.page}>
            {/* STICKY TOP NAVBAR */}
            <div style={styles.navBar}>
                <button onClick={() => navigate('/')} style={styles.backPillBtn}>
                    <Home size={16} color="#0f172a" />
                    <span>{lang === 'te' ? 'హోమ్' : 'Home'}</span>
                </button>
                <h1 style={{ margin: 0, fontSize: '17px', color: '#0f172a', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Sparkles size={17} color="#f59e0b" /> Subhams Expo
                </h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    {isAdmin && (
                        <button onClick={() => setShowBannerModal(true)} style={{ background: '#0f172a', color: '#facc15', border: 'none', padding: '6px 9px', borderRadius: '14px', fontSize: '10.5px', fontWeight: '900', cursor: 'pointer' }}>
                            + Ad Banner
                        </button>
                    )}
                    <button onClick={toggleLanguage} style={{ background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', padding: '6px 9px', borderRadius: '14px', fontSize: '10.5px', fontWeight: '900', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <Globe size={12} /> {lang === 'en' ? 'తెలుగు' : 'EN'}
                    </button>
                </div>
            </div>

            {/* FILTER TABS */}
            <div style={styles.filterMenu} className="hide-scroll">
                {['All', 'Videos', 'Photos', 'Activity'].map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab)} style={{...styles.filterBtn, background: activeTab === tab ? '#0f172a' : '#f1f5f9', color: activeTab === tab ? '#facc15' : '#64748b'}}>
                        {tab === 'Activity' && <Clock size={14} style={{marginRight: '4px'}} />} {tab}
                    </button>
                ))}
            </div>

            <div style={styles.feedContainer}>
                
                {/* 1. TOP NATIVE AD BANNER (If available) */}
                {expoBanners.length > 0 && renderPromoBanner(expoBanners[0], 'top')}

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '80px 0', color: '#64748b' }}><Loader className="spin" size={40} style={{ margin: '0 auto 15px auto' }} color="#2563eb" /></div>
                ) : displayPostsData.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '80px 20px', color: '#94a3b8' }}>
                        <Sparkles size={60} style={{ margin: '0 auto 15px auto', opacity: 0.3 }} color="#94a3b8" />
                        <h3 style={{ margin: '0 0 10px 0', color: '#475569', fontSize: '20px' }}>No posts found.</h3>
                    </div>
                ) : (
                    displayPostsData.map((post, index) => {
                        const isPostOwner = isAdmin || (localUser && String(post.owner_id) === String(localUser.id));
                        const isOfficialApp = String(post.owner_id) === "1" || (post.shop_email && post.shop_email === 'pavanvenkat63@gmail.com') || (post.owner_email === 'pavanvenkat63@gmail.com');
                        const hasTag = post.tagged_item_name && post.tagged_item_type;
                        const isFollowing = followingMap[post.shop_id];
                        const isLiked = post.isLikedByMe === true || String(post.isLikedByMe) === 'true'; 

                        const mediaSrc = resolveMediaUrl(post.media_url, post.media_type);
                        const postAmbient = post.ambient_color || (isOfficialApp ? '#b45309' : '#1e293b');

                        // 2. INJECT ADS INTO THE FEED (Every 3 posts, cycle through available ads)
                        const showInFeedAd = (index + 1) % 3 === 0;
                        const inlineBannerIndex = Math.floor((index + 1) / 3) % Math.max(1, expoBanners.length);
                        const inlineBanner = expoBanners[inlineBannerIndex];

                        return (
                            <React.Fragment key={post.id}>
                                <div id={`post-${post.id}`} style={{ ...styles.postCard, border: isOfficialApp ? '1px solid #fde68a' : '1px solid #f1f5f9', marginBottom: '20px' }}>
                                    
                                    {/* POST HEADER */}
                                    <div style={{...styles.postHeader, background: isOfficialApp ? '#fffbeb' : 'white'}}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                                            <div style={isOfficialApp ? styles.shopLogoWrapperGold : styles.shopLogoWrapper} onClick={() => navigate(`/shop/${post.shop_id}`)}>
                                                <img src={resolveMediaUrl(post.shop_logo) || getFallbackAvatar(post.shop_name)} onError={(e) => { e.target.onerror = null; e.target.src = getFallbackAvatar(post.shop_name); }} alt={post.shop_name} style={styles.shopLogo} />
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
                                                    <span onClick={() => navigate(`/shop/${post.shop_id}`)} style={styles.shopName}>{post.shop_name || 'Vendor'}</span>
                                                    {renderBadge(isOfficialApp, post.is_verified, post.account_status, true)}
                                                    
                                                    {!isPostOwner && (
                                                        <button onClick={() => handleFollowToggle(post.shop_id)} style={{...styles.followBtn, background: isFollowing ? '#f1f5f9' : '#e0e7ff', color: isFollowing ? '#64748b' : '#4f46e5'}}>
                                                            {isFollowing ? <Check size={12} /> : <UserPlus size={12} />} {isFollowing ? 'Following' : 'Follow'}
                                                        </button>
                                                    )}
                                                </div>
                                                <span style={styles.postMeta}>
                                                    <MapPin size={10} color={isOfficialApp ? "#d97706" : "#94a3b8"}/> 
                                                    <span>{post.location ? post.location.split(',')[0] : 'Local'}</span>
                                                    <span>•</span>
                                                    <span>{timeAgo(post.created_at)}</span>
                                                </span>
                                            </div>
                                        </div>

                                        <div style={{ position: 'relative' }}>
                                            <button onClick={() => setActiveDropdown(activeDropdown === post.id ? null : post.id)} style={styles.moreBtn}><MoreVertical size={18} color="#64748b" /></button>
                                            {activeDropdown === post.id && (
                                                <div style={styles.dropdownMenu}>
                                                    {isPostOwner && (
                                                        <button onClick={() => handleDeletePost(post.id)} style={{...styles.dropdownItem, color: '#ef4444'}}>
                                                            <Trash2 size={14} /> Delete Post
                                                        </button>
                                                    )}
                                                    {!isOfficialApp && (
                                                        <button onClick={() => { setReportingPost(post); setActiveDropdown(null); }} style={{...styles.dropdownItem, color: '#d97706'}}>
                                                            <Flag size={14} /> Report / Copyright
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* POST TEXT CONTENT */}
                                    {post.content && (
                                        <div style={{...styles.postContent, background: isOfficialApp ? '#fffbeb' : 'white'}} onMouseEnter={() => handleView(post.id)} onTouchStart={() => handleView(post.id)} onClick={() => handleView(post.id)}>
                                            {post.content}
                                        </div>
                                    )}

                                    {/* 🎨 AMBIENT MODE PHOTO / VIDEO CONTAINER */}
                                    {post.media_url && post.media_type !== 'text' && (
                                        <div 
                                            style={{
                                                ...styles.mediaContainer,
                                                background: `radial-gradient(circle at center, ${postAmbient} 0%, #090d16 100%)`
                                            }} 
                                            onDoubleClick={() => handleLike(post.id)}
                                        >
                                            {post.media_type === 'image' ? (
                                                <img src={mediaSrc} alt="" aria-hidden="true" style={styles.ambientBackdropMedia} />
                                            ) : (
                                                <div style={{...styles.ambientBackdropSolid, background: postAmbient}} />
                                            )}

                                            {post.media_type === 'video' ? (
                                                <video 
                                                    src={mediaSrc} 
                                                    onLoadedMetadata={(e) => {
                                                        if (post.trim_start > 0) e.currentTarget.currentTime = Number(post.trim_start);
                                                    }}
                                                    onTimeUpdate={(e) => {
                                                        const tStart = Number(post.trim_start) || 0;
                                                        const tEnd = Number(post.trim_end) || 60;
                                                        if (tEnd > tStart && e.currentTarget.currentTime >= tEnd) {
                                                            e.currentTarget.currentTime = tStart;
                                                        }
                                                    }}
                                                    onPlay={() => handleView(post.id)} 
                                                    controls 
                                                    playsInline 
                                                    style={styles.mediaElement} 
                                                />
                                            ) : (
                                                <img src={mediaSrc} onLoad={() => handleView(post.id)} alt="Post media" style={styles.mediaElement} loading="lazy" />
                                            )}
                                        </div>
                                    )}
                                    
                                    {hasTag && (
                                        <div style={{ padding: '10px 15px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', borderTop: '1px solid #f1f5f9' }}>
                                            <button onClick={() => post.tagged_item_type === 'shop' ? navigate(`/shop/${post.tagged_item_id}`) : navigate(`/item/${post.tagged_item_id}`)} className="touch-scale" style={styles.visibleTagBtn}>
                                                {post.tagged_item_type === 'shop' ? <Store size={15} color="#1e293b" /> : <ShoppingBag size={15} color="#1e293b" />}
                                                <span style={{flex: 1, textAlign: 'left', fontWeight: '800', color: '#1e293b', fontSize: '13px'}}>{post.tagged_item_type === 'shop' ? 'Visit Shop: ' : 'View Item: '} {post.tagged_item_name}</span>
                                                <ChevronRight size={16} color="#64748b" />
                                            </button>
                                        </div>
                                    )}

                                    <div style={{ padding: '6px 15px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11.5px', color: '#64748b', background: isOfficialApp ? '#fffbeb' : 'white', borderTop: '1px solid #f1f5f9', fontWeight: '700' }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Eye size={13} /> {post.views_count || 0} views</span>
                                        {post.media_type === 'video' && (
                                            <span style={{ fontSize: '10.5px', color: '#94a3b8' }}>Clip: {formatSec(post.trim_start || 0)} - {formatSec(post.trim_end || 60)}</span>
                                        )}
                                    </div>

                                    <div style={{...styles.actionBar, background: isOfficialApp ? '#fffbeb' : 'white'}}>
                                        <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <button onClick={() => handleLike(post.id)} style={styles.actionBtn}>
                                                    <Heart size={25} color={isLiked ? "#ef4444" : "#1e293b"} fill={isLiked ? "#ef4444" : "transparent"} />
                                                </button>
                                                <span onClick={() => fetchLikesList(post.id)} style={{...styles.actionCount, cursor: 'pointer', textDecoration: 'underline'}}>{post.likes_count || 0}</span>
                                            </div>
                                            
                                            {post.allow_comments !== false ? (
                                                <button style={styles.actionBtn} onClick={() => toggleComments(post.id)}>
                                                    <MessageCircle size={24} color="#1e293b" />
                                                    <span style={styles.actionCount}>{post.comments_count || 0}</span>
                                                </button>
                                            ) : (
                                                <div style={{...styles.actionBtn, opacity: 0.5}} onClick={() => toast.info("Comments disabled.")}><MessageSquareOff size={22} color="#64748b" /></div>
                                            )}

                                            <button 
                                                onClick={() => handleWhatsAppShare(post)} 
                                                style={{ background: '#dcfce7', color: '#15803d', border: '1px solid #86efac', borderRadius: '20px', padding: '5px 10px', fontSize: '11.5px', fontWeight: '900', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                                            >
                                                <span>📲 WhatsApp</span>
                                            </button>
                                            
                                            <button style={styles.actionBtn} onClick={() => {
                                                const postUrl = `${window.location.origin}/expo?postId=${post.id}`;
                                                if (navigator.share) {
                                                    navigator.share({ title: `${post.shop_name} on Subhams Expo`, text: post.content || 'Check out this post!', url: postUrl });
                                                } else {
                                                    navigator.clipboard.writeText(postUrl);
                                                    toast.success("Unique post link copied!");
                                                }
                                            }}>
                                                <Share2 size={21} color="#1e293b" />
                                            </button>
                                        </div>

                                        <button onClick={() => navigate(`/shop/${post.shop_id}`)} style={{...styles.visitStoreBtn, background: isOfficialApp ? '#facc15' : '#0f172a', color: isOfficialApp ? '#713f12' : '#ffffff'}}>
                                            {isOfficialApp ? 'Official Store' : 'Visit Shop'}
                                        </button>
                                    </div>

                                    {expandedComments[post.id] && post.allow_comments !== false && (
                                        <div style={styles.commentSection}>
                                            <div style={styles.commentList} className="hide-scroll">
                                                {(postComments[post.id] || []).filter(c => !c.parent_comment_id).map(c => {
                                                    const isCommOfficial = c.role === 'admin' || c.user_email === 'pavanvenkat63@gmail.com' || c.user_id === 1;
                                                    const isCommVerified = c.is_verified;
                                                    const isCommShop = Boolean(c.shop_id || c.role === 'vendor');

                                                    return (
                                                        <div key={c.id}>
                                                            <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
                                                                <img src={resolveMediaUrl(c.display_avatar) || getFallbackAvatar(c.display_name)} onError={(e) => { e.target.onerror = null; e.target.src = getFallbackAvatar(c.display_name); }} alt="Avatar" style={{width: '34px', height: '34px', borderRadius: '50%', objectFit: 'cover', border: '1px solid #e2e8f0'}} />
                                                                <div style={{ flex: 1 }}>
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
                                                                        <span style={{ fontWeight: '800', fontSize: '13px', color: '#0f172a' }}>{c.display_name}</span>
                                                                        {renderBadge(isCommOfficial, isCommVerified, 'active', isCommShop)}
                                                                    </div>
                                                                    <div style={{ fontSize: '13.5px', color: '#334155', marginTop: '2px', wordBreak: 'break-word' }}>{c.text}</div>
                                                                    <div style={{ display: 'flex', gap: '12px', marginTop: '6px', fontSize: '11.5px', fontWeight: '600', color: '#94a3b8' }}>
                                                                        <span style={{cursor: 'pointer'}} onClick={() => setReplyingTo({ commentId: c.id, name: c.display_name, postId: post.id })}>Reply</span>
                                                                        {(isAdmin || String(localUser?.id) === String(c.user_id) || isPostOwner) && <span style={{cursor: 'pointer', color: '#ef4444'}} onClick={() => handleDeleteComment(post.id, c.id)}>Delete</span>}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            {(postComments[post.id] || []).filter(reply => reply.parent_comment_id === c.id).map(reply => {
                                                                const isRepOfficial = reply.role === 'admin' || reply.user_email === 'pavanvenkat63@gmail.com' || reply.user_id === 1;
                                                                const isRepVerified = reply.is_verified;
                                                                const isRepShop = Boolean(reply.shop_id || reply.role === 'vendor');

                                                                return (
                                                                    <div key={reply.id} style={{ display: 'flex', gap: '10px', marginBottom: '12px', marginLeft: '35px' }}>
                                                                        <img src={resolveMediaUrl(reply.display_avatar) || getFallbackAvatar(reply.display_name)} onError={(e) => { e.target.onerror = null; e.target.src = getFallbackAvatar(reply.display_name); }} alt="Avatar" style={{width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover', border: '1px solid #e2e8f0'}} />
                                                                        <div style={{ flex: 1 }}>
                                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
                                                                                <span style={{ fontWeight: '800', fontSize: '13px', color: '#0f172a' }}>{reply.display_name}</span>
                                                                                {renderBadge(isRepOfficial, isRepVerified, 'active', isRepShop)}
                                                                            </div>
                                                                            <div style={{ fontSize: '13.5px', color: '#334155', marginTop: '2px', wordBreak: 'break-word' }}>{reply.text}</div>
                                                                            <div style={{ display: 'flex', gap: '12px', marginTop: '6px', fontSize: '11.5px', fontWeight: '600', color: '#94a3b8' }}>
                                                                                {(isAdmin || String(localUser?.id) === String(reply.user_id) || isPostOwner) && <span style={{cursor: 'pointer', color: '#ef4444'}} onClick={() => handleDeleteComment(post.id, reply.id)}>Delete</span>}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    );
                                                })}
                                                {(postComments[post.id] || []).length === 0 && <div style={{textAlign: 'center', color: '#94a3b8', fontSize: '13px'}}>No comments yet.</div>}
                                            </div>
                                            
                                            <form onSubmit={(e) => handlePostComment(e, post.id)} style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
                                                {replyingTo?.postId === post.id && (
                                                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', background:'#f1f5f9', padding:'6px 12px', borderRadius:'12px', fontSize:'11px', fontWeight:'700', color:'#475569'}}>
                                                        <span style={{display:'flex', alignItems:'center', gap:'4px'}}><Reply size={12}/> Replying to {replyingTo.name}</span>
                                                        <X size={14} style={{cursor:'pointer'}} onClick={() => setReplyingTo(null)} />
                                                    </div>
                                                )}
                                                <div style={{ display: 'flex', gap: '10px' }}>
                                                    <input type="text" placeholder="Add a clean, respectful comment..." style={styles.commentInput} value={newComment} onChange={(e) => setNewComment(e.target.value)} />
                                                    <button type="submit" disabled={!newComment.trim()} style={styles.commentPostBtn}>Post</button>
                                                </div>
                                            </form>
                                        </div>
                                    )}
                                </div>
                                
                                {/* INTERLEAVED AD BANNER IN THE FEED */}
                                {showInFeedAd && renderPromoBanner(inlineBanner, `mid-${index}`)}
                            </React.Fragment>
                        );
                    })
                )}

                {/* 3. ALWAYS SHOW AN AD AT THE VERY BOTTOM (If we have multiple ads) */}
                {!loading && displayPostsData.length > 0 && expoBanners.length > 1 && renderPromoBanner(expoBanners[expoBanners.length - 1], 'bottom')}

            </div>

            {canPost && (
                <button className="touch-scale" style={styles.fabBtn} onClick={() => setShowCreateModal(true)}>
                    <Plus size={28} color="#facc15" />
                </button>
            )}

            {/* ===================================================================== */}
            {/* ➕ CREATE POST MODAL */}
            {/* ===================================================================== */}
            {showCreateModal && (
                <div style={styles.overlay}>
                    <div style={styles.modal} className="hide-scroll">
                        {isTaggingMenuOpen ? (
                            <div style={{ display: 'flex', flexDirection: 'column', height: '380px' }}>
                                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px'}}>
                                    <h3 style={{margin: 0, fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px'}}><ArrowLeft size={20} style={{cursor: 'pointer'}} onClick={() => setIsTaggingMenuOpen(false)} /> Tag Shop or Product</h3>
                                </div>
                                <div style={styles.tagSearchContainer}>
                                    <Search size={16} color="#94a3b8" />
                                    <input type="text" placeholder="Search item or shop..." style={styles.tagSearchInput} value={tagSearchQuery} onChange={(e) => setTagSearchQuery(e.target.value)} autoFocus />
                                </div>
                                <div style={styles.tagListContainer} className="hide-scroll">
                                    {liveTagOptions.map(item => (
                                        <div key={item.id} style={styles.tagListItem} onClick={() => { setSelectedTag(item); setIsTaggingMenuOpen(false); }}>
                                            <img src={resolveMediaUrl(item.image) || getFallbackAvatar(item.name)} alt={item.name} style={{width: '36px', height: '36px', borderRadius: '8px', objectFit: 'cover'}} />
                                            <div style={{display: 'flex', flexDirection: 'column'}}>
                                                <span style={{fontSize: '14px', fontWeight: '700', color: '#0f172a'}}>{item.name}</span>
                                                <span style={{fontSize: '11px', color: '#64748b', textTransform: 'capitalize'}}>{item.type}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <>
                                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid #f1f5f9'}}>
                                    <h3 style={{margin: 0, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '17px', fontWeight: '900'}}><Sparkles size={18} color="#2563eb"/> Create Expo Post</h3>
                                    <X size={22} style={{cursor: 'pointer', color: '#64748b'}} onClick={() => { setShowCreateModal(false); setMediaFile(null); setMediaPreview(null); setSelectedTag(null); }} />
                                </div>

                                <form onSubmit={submitPost} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    <textarea style={styles.textArea} placeholder="Share an offer, new arrival, or shop update..." value={postText} onChange={e => setPostText(e.target.value)} />

                                    <div style={styles.tagInputBox} onClick={() => { setIsTaggingMenuOpen(true); setTagSearchQuery(''); }}>
                                        <Tag size={16} color={selectedTag ? "#2563eb" : "#64748b"} />
                                        <span style={{ fontSize: '13px', fontWeight: '700', color: selectedTag ? '#2563eb' : '#64748b', flex: 1 }}>{selectedTag ? `Tagged: ${selectedTag.name}` : 'Tag a Shop or Product...'}</span>
                                        {selectedTag && <X size={16} color="#ef4444" onClick={(e) => { e.stopPropagation(); setSelectedTag(null); }} />}
                                    </div>

                                    {/* 🎵 BACKGROUND MUSIC (AVAILABLE SOON) */}
                                    <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '6px', opacity: 0.7 }}>
                                        <label style={{ fontSize: '11.5px', fontWeight: '900', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <Music size={14} /> Background Music (Available Soon)
                                        </label>
                                        <div style={{ fontSize: '11.5px', color: '#94a3b8', fontStyle: 'italic', fontWeight: '600' }}>Viral Phonk & Custom MP3 features are coming in the next update!</div>
                                    </div>

                                    {/* ✂️ PREVIEW + 60s VIDEO TRIMMER */}
                                    {mediaPreview && (
                                        <div style={{...styles.previewBox, background: selectedAmbientColor}}>
                                            <button type="button" onClick={() => {setMediaPreview(null); setMediaFile(null);}} style={styles.removeMediaBtn}><X size={14} color="white"/></button>
                                            {mediaFile?.type.startsWith('video') ? (
                                                <>
                                                    <video 
                                                        ref={videoRef} 
                                                        src={mediaPreview} 
                                                        style={styles.previewMediaElement} 
                                                        controls 
                                                        muted 
                                                        onTimeUpdate={(e) => {
                                                            if (e.currentTarget.currentTime >= trimStart + clipLength) {
                                                                e.currentTarget.currentTime = trimStart;
                                                            }
                                                        }}
                                                    />
                                                    
                                                    <div style={styles.trimmerUI}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11.5px', fontWeight: '900', color: '#fff', marginBottom: '6px' }}>
                                                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                                <Scissors size={13} color="#facc15" /> 
                                                                {videoDuration > 60 ? 'Long Video: Drag to pick your 60s clip' : 'Select Video Trim Window'}
                                                            </span>
                                                            <span style={{ color: '#facc15', background: 'rgba(250,204,21,0.18)', padding: '2px 8px', borderRadius: '10px' }}>
                                                                {formatSec(trimStart)} — {formatSec(Math.min(videoDuration, trimStart + clipLength))} ({Math.min(clipLength, videoDuration - trimStart)}s)
                                                            </span>
                                                        </div>

                                                        <div style={{ position: 'relative', width: '100%', height: '34px', background: '#1e293b', borderRadius: '8px', overflow: 'hidden', border: '1px solid #475569', marginBottom: '8px' }}>
                                                            <div style={{
                                                                position: 'absolute',
                                                                left: `${videoDuration > 0 ? (trimStart / videoDuration) * 100 : 0}%`,
                                                                width: `${videoDuration > 0 ? Math.min(100, (clipLength / videoDuration) * 100) : 100}%`,
                                                                height: '100%',
                                                                border: '2px solid #facc15',
                                                                background: 'rgba(250, 204, 21, 0.28)',
                                                                borderRadius: '6px',
                                                                pointerEvents: 'none',
                                                                boxSizing: 'border-box'
                                                            }} />
                                                            <input 
                                                                type="range" 
                                                                min="0" 
                                                                max={Math.max(0, videoDuration - 5)} 
                                                                value={trimStart} 
                                                                onChange={handleTrimStartChange} 
                                                                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0, cursor: 'ew-resize' }} 
                                                            />
                                                        </div>

                                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', fontSize: '11px', color: '#cbd5e1', fontWeight: '700' }}>
                                                            <span>Clip Length (Max 60s): <strong>{clipLength}s</strong></span>
                                                            <input 
                                                                type="range" 
                                                                min="5" 
                                                                max={Math.min(60, Math.max(5, videoDuration))} 
                                                                value={clipLength} 
                                                                onChange={handleClipLengthChange}
                                                                style={{ width: '110px', accentColor: '#facc15' }}
                                                            />
                                                        </div>
                                                    </div>
                                                </>
                                            ) : (
                                                <img src={mediaPreview} alt="Preview" style={styles.previewMediaElement} />
                                            )}
                                        </div>
                                    )}

                                    {isVerifiedOrOfficial ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '8px 12px', borderRadius: '10px', fontSize: '11.5px', color: '#166534', fontWeight: '800' }}>
                                                📹 <strong>Video Rule:</strong> Max 60 seconds per post. If your video is longer than 60s, use the drag slider to select any 60s highlight!
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', flexWrap: 'wrap', gap: '10px' }}>
                                                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                                    <label style={styles.uploadIconBtn} title="Upload Photo or GIF">
                                                        <ImageIcon size={20} color="#10b981" />
                                                        <input type="file" accept="image/*,image/gif" style={{display: 'none'}} onChange={handleMediaSelect} />
                                                    </label>
                                                    <label style={styles.uploadIconBtn} title="Upload Video (60s Clip)">
                                                        <Video size={20} color="#3b82f6" />
                                                        <input type="file" accept="video/mp4,video/quicktime,video/webm" style={{display: 'none'}} onChange={handleMediaSelect} />
                                                    </label>
                                                    <label style={{ fontSize: '11.5px', fontWeight: '800', color: '#475569', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                        Ambient:
                                                        <input type="color" value={selectedAmbientColor} onChange={e => setSelectedAmbientColor(e.target.value)} style={{ width: '26px', height: '26px', border: 'none', borderRadius: '6px', cursor: 'pointer' }} />
                                                    </label>
                                                </div>
                                                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '800', color: '#475569', cursor: 'pointer' }}>
                                                    <input type="checkbox" checked={allowComments} onChange={(e) => setAllowComments(e.target.checked)} style={{accentColor: '#2563eb', width: '16px', height: '16px'}} />
                                                    Allow Comments
                                                </label>
                                            </div>
                                        </div>
                                    ) : (
                                        <div style={{ background: '#eff6ff', padding: '14px', borderRadius: '12px', border: '1px dashed #3b82f6', textAlign: 'center' }}>
                                            <p style={{ margin: '0 0 6px 0', fontSize: '12.5px', fontWeight: '800', color: '#1e3a8a', lineHeight: '1.4' }}>
                                                Standard shops can only post text updates. Get verified to post photos & 60s videos! 📸<br/>
                                                <span style={{fontSize: '11px', color: '#3b82f6'}}>ప్రామాణిక షాపులు కేవలం టెక్స్ట్ మాత్రమే పోస్ట్ చేయగలవు. ఫోటోలు & 60s వీడియోలు కోసం వెరిఫై చేసుకోండి!</span>
                                            </p>
                                            <button type="button" onClick={handleRequestVerification} style={{ background: '#16a34a', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: '800', fontSize: '12px', cursor: 'pointer', marginTop: '6px' }}>
                                                <ShieldAlert size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }}/> Request Green Badge
                                            </button>
                                        </div>
                                    )}

                                    <button type="submit" disabled={isUploading} style={styles.postBtn}>
                                        {isUploading ? <Loader size={20} className="spin" /> : '🚀 Publish to Subhams Expo'}
                                    </button>
                                </form>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* 🚨 REPORT POST MODAL */}
            {reportingPost && (
                <div style={styles.overlay} onClick={() => setReportingPost(null)}>
                    <div style={{...styles.modal, maxWidth: '380px'}} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                            <h3 style={{ margin: '0 0 16px', color: '#dc2626', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '900' }}>
                                <Flag size={18} /> Report Post to Admin
                            </h3>
                            <X size={20} style={{ cursor: 'pointer', color: '#64748b' }} onClick={() => setReportingPost(null)} />
                        </div>
                        <form onSubmit={handleReportSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <label style={{ fontSize: '12.5px', fontWeight: '800', color: '#334155' }}>Select violation reason:</label>
                            {[
                                'Fake product or misleading offer',
                                'Vulgar, abusive, or inappropriate media',
                                'Copyright / Brand Infringement',
                                'Scam or suspicious payment request'
                            ].map((r, i) => (
                                <label key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', borderRadius: '10px', border: '1px solid #e2e8f0', background: reportReason === r ? '#fef2f2' : '#f8fafc', fontSize: '12.5px', fontWeight: '700', cursor: 'pointer' }}>
                                    <input type="radio" name="reportReason" checked={reportReason === r} onChange={() => setReportReason(r)} />
                                    <span>{r}</span>
                                </label>
                            ))}
                            <button type="submit" style={{...styles.postBtn, background: '#dc2626', color: 'white', marginTop: '6px', padding: '12px'}}>
                                Send Alert to Master Admin
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* 🎨 ADMIN GIF BANNER MANAGER MODAL */}
            {showBannerModal && isAdmin && (
                <div style={styles.overlay} onClick={() => setShowBannerModal(false)}>
                    <div style={{...styles.modal, maxWidth: '420px'}} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                            <h3 style={{ margin: '0 0 16px', fontWeight: '900' }}>🎞️ Ad Banner Studio</h3>
                            <X size={20} style={{ cursor: 'pointer' }} onClick={() => setShowBannerModal(false)} />
                        </div>
                        <form onSubmit={handleCreateExpoBanner} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '15px' }}>
                            <input type="text" placeholder="Banner Title *" value={newBanner.title} onChange={e => setNewBanner({...newBanner, title: e.target.value})} style={styles.commentInput} required />
                            <input type="text" placeholder="Subtitle (Optional)" value={newBanner.subtitle} onChange={e => setNewBanner({...newBanner, subtitle: e.target.value})} style={styles.commentInput} />
                            <input type="text" placeholder="Click URL (e.g. /shop/1)" value={newBanner.action_url} onChange={e => setNewBanner({...newBanner, action_url: e.target.value})} style={styles.commentInput} />
                            <input type="text" placeholder="Badge Text (e.g. Sponsored)" value={newBanner.badge_text} onChange={e => setNewBanner({...newBanner, badge_text: e.target.value})} style={styles.commentInput} />
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                <label style={{ fontSize: '12px', fontWeight: '800', color: '#475569', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    Gradient Color: 
                                    <input type="color" value={newBanner.ambient_color} onChange={e => setNewBanner({...newBanner, ambient_color: e.target.value})} style={{ width: '26px', height: '26px', border: 'none', borderRadius: '6px', cursor: 'pointer' }} />
                                </label>
                            </div>
                            <input type="file" accept="image/gif,image/*" onChange={handleBannerFileUpload} style={{ fontSize: '12px' }} />
                            <input type="text" placeholder="Or paste Image URL (https://...)" value={newBanner.media_url && !newBanner.media_url.startsWith('data:') ? newBanner.media_url : ''} onChange={e => setNewBanner({...newBanner, media_url: e.target.value})} style={styles.commentInput} />
                            <button type="submit" style={{...styles.postBtn, marginTop: 0, padding: '12px', background: '#2563eb', color: 'white'}}>Add Ad Banner</button>
                        </form>
                        {expoBanners.map(b => (
                            <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px', borderBottom: '1px solid #f1f5f9', fontSize: '12.5px', fontWeight: '800' }}>
                                <span>{b.title}</span>
                                <button onClick={() => handleDeleteExpoBanner(b.id)} style={{ background: '#fee2e2', color: '#dc2626', border: 'none', padding: '4px 8px', borderRadius: '6px', cursor: 'pointer' }}>Delete</button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* LIKES MODAL */}
            {showLikesModal.isOpen && (
                <div style={styles.overlay} onClick={() => setShowLikesModal({ isOpen: false, likes: [] })}>
                    <div style={{...styles.modal, maxHeight: '400px'}} onClick={e => e.stopPropagation()}>
                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', paddingBottom: '10px', borderBottom: '1px solid #e2e8f0'}}>
                            <h3 style={{margin: 0, fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px'}}><Users size={18} color="#2563eb"/> Likes ({showLikesModal.likes.length})</h3>
                            <X size={20} style={{cursor: 'pointer', color: '#64748b'}} onClick={() => setShowLikesModal({ isOpen: false, likes: [] })} />
                        </div>
                        <div style={{overflowY: 'auto', maxHeight: '300px'}} className="hide-scroll">
                            {showLikesModal.likes.length === 0 ? <p style={{textAlign: 'center', color: '#94a3b8', fontSize: '13px'}}>No likes yet.</p> : null}
                            {showLikesModal.likes.map(u => {
                                const isUserOfficial = u.role === 'admin' || u.email === 'pavanvenkat63@gmail.com' || u.id === 1;
                                const isUserVerified = u.is_verified;
                                const isUserShop = Boolean(u.shop_id || u.role === 'vendor');
                                const displayName = u.name || u.username || 'User';

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
            
            <style>{`.spin { animation: spin 1.2s linear infinite; } @keyframes spin { 100% { transform: rotate(360deg); } } .touch-scale { transition: transform 0.15s cubic-bezier(0.4, 0, 0.2, 1); } .touch-scale:active { transform: scale(0.95); } .hide-scroll::-webkit-scrollbar { display: none; } .hide-scroll { -ms-overflow-style: none; scrollbar-width: none; }`}</style>
        </div>
    );
};

const styles = {
    page: { background: '#f8fafc', minHeight: '100vh', fontFamily: 'Inter, system-ui, sans-serif' },
    navBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(15px)', position: 'sticky', top: 0, zIndex: 100, borderBottom: '1px solid #e2e8f0', gap: '6px' },
    backPillBtn: { display: 'flex', alignItems: 'center', gap: '6px', background: '#f1f5f9', border: '1px solid #e2e8f0', padding: '7px 12px', borderRadius: '20px', fontWeight: '900', fontSize: '12px', color: '#0f172a', cursor: 'pointer', flexShrink: 0 },
    filterMenu: { display: 'flex', gap: '8px', overflowX: 'auto', padding: '10px 14px', background: 'white', borderBottom: '1px solid #e2e8f0' },
    filterBtn: { border: 'none', padding: '8px 18px', borderRadius: '20px', fontSize: '13px', fontWeight: '900', cursor: 'pointer', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center' },
    feedContainer: { maxWidth: '520px', margin: '0 auto', padding: '14px 0', display: 'flex', flexDirection: 'column', gap: '0', paddingBottom: '100px' },
    
    postCard: { background: 'white', borderRadius: '24px', overflow: 'hidden', margin: '0 8px', boxShadow: '0 8px 30px rgba(0, 0, 0, 0.04)' }, 
    postHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px' },
    shopLogoWrapper: { padding: '2px', background: '#e2e8f0', borderRadius: '50%', cursor: 'pointer', flexShrink: 0 },
    shopLogoWrapperGold: { padding: '3px', background: 'linear-gradient(45deg, #FFD700, #FDB931)', borderRadius: '50%', cursor: 'pointer', boxShadow: '0 0 15px rgba(255, 215, 0, 0.4)', flexShrink: 0 },
    shopLogo: { width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '2px solid white', display: 'block' },
    shopName: { fontSize: '14.5px', fontWeight: '900', color: '#0f172a', cursor: 'pointer' },
    postMeta: { fontSize: '11px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '700', marginTop: '2px' },
    followBtn: { display: 'flex', alignItems: 'center', gap: '4px', border: 'none', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '800', marginLeft: '4px', cursor: 'pointer' },
    moreBtn: { background: 'none', border: 'none', cursor: 'pointer', padding: '6px' },
    dropdownMenu: { position: 'absolute', top: '32px', right: '0', background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.12)', zIndex: 50, width: '165px', overflow: 'hidden' },
    dropdownItem: { width: '100%', display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 14px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '12.5px', fontWeight: '800', color: '#1e293b', textAlign: 'left' },
    
    postContent: { padding: '2px 15px 12px 15px', fontSize: '15px', color: '#0f172a', lineHeight: '1.5', whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontWeight: '500' },
    
    mediaContainer: { position: 'relative', width: '100%', maxHeight: '580px', minHeight: '260px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderTop: '1px solid rgba(255,255,255,0.08)', padding: '12px', boxSizing: 'border-box' },
    ambientBackdropMedia: { position: 'absolute', inset: '-25px', width: '120%', height: '120%', objectFit: 'cover', filter: 'blur(32px) saturate(190%) brightness(0.75)', opacity: 0.75, pointerEvents: 'none', zIndex: 1 },
    ambientBackdropSolid: { position: 'absolute', inset: 0, filter: 'blur(35px)', opacity: 0.65, pointerEvents: 'none', zIndex: 1 },
    mediaElement: { position: 'relative', zIndex: 2, width: '100%', maxHeight: '540px', objectFit: 'contain', borderRadius: '16px', boxShadow: '0 12px 32px rgba(0,0,0,0.45)' }, 
    
    visibleTagBtn: { display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '10px 12px', background: '#e2e8f0', border: 'none', borderRadius: '12px', cursor: 'pointer' },
    actionBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', flexWrap: 'wrap', gap: '8px' },
    actionBtn: { display: 'flex', alignItems: 'center', gap: '5px', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0' },
    actionCount: { fontSize: '14px', fontWeight: '900', color: '#1e293b' },
    commentSection: { padding: '14px', background: 'white', borderTop: '1px solid #f1f5f9' },
    commentList: { maxHeight: '250px', overflowY: 'auto', marginBottom: '10px', paddingRight: '5px' },
    commentInput: { flex: 1, padding: '11px 14px', borderRadius: '20px', border: '1px solid #cbd5e1', fontSize: '13.5px', outline: 'none', background: '#f8fafc', width: '100%', boxSizing: 'border-box' },
    commentPostBtn: { background: 'none', border: 'none', color: '#2563eb', fontWeight: '900', cursor: 'pointer', padding: '0 10px', fontSize: '14px' },
    visitStoreBtn: { display: 'flex', alignItems: 'center', gap: '6px', border: 'none', padding: '8px 14px', borderRadius: '18px', fontSize: '12px', fontWeight: '900', cursor: 'pointer' },
    fabBtn: { position: 'fixed', bottom: '26px', right: '18px', width: '58px', height: '58px', borderRadius: '50%', background: 'linear-gradient(135deg, #0f172a, #1e3a8a)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #facc15', cursor: 'pointer', boxShadow: '0 10px 25px rgba(15, 23, 42, 0.45)', zIndex: 150 },
    overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15,23,42,0.82)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '14px', zIndex: 1000 },
    modal: { background: 'white', padding: '20px', borderRadius: '24px', maxWidth: '450px', width: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)', boxSizing: 'border-box' },
    textArea: { width: '100%', minHeight: '70px', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '15px', outline: 'none', resize: 'none', background: '#f8fafc', color: '#0f172a', boxSizing: 'border-box' },
    tagInputBox: { display: 'flex', alignItems: 'center', gap: '10px', padding: '11px 12px', background: '#f1f5f9', borderRadius: '12px', cursor: 'pointer', border: '1px solid #e2e8f0' },
    tagSearchContainer: { display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', background: '#f1f5f9', borderRadius: '12px', marginBottom: '12px' },
    tagSearchInput: { border: 'none', background: 'none', outline: 'none', width: '100%', fontSize: '14px' },
    tagListContainer: { flex: 1, overflowY: 'auto' },
    tagListItem: { display: 'flex', alignItems: 'center', gap: '12px', padding: '10px', borderBottom: '1px solid #f1f5f9', cursor: 'pointer' },
    uploadIconBtn: { width: '42px', height: '42px', borderRadius: '12px', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '1px solid #cbd5e1' },
    previewBox: { position: 'relative', width: '100%', borderRadius: '16px', overflow: 'hidden', padding: '10px', boxSizing: 'border-box' },
    removeMediaBtn: { position: 'absolute', top: '14px', right: '14px', background: 'rgba(0,0,0,0.75)', border: 'none', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10 },
    previewMediaElement: { width: '100%', maxHeight: '260px', objectFit: 'contain', display: 'block', borderRadius: '10px' },
    trimmerUI: { marginTop: '10px', background: 'rgba(15, 23, 42, 0.92)', padding: '12px', borderRadius: '12px', display: 'flex', flexDirection: 'column', border: '1px solid rgba(250, 204, 21, 0.35)' },
    postBtn: { background: 'linear-gradient(135deg, #0f172a, #1e3a8a)', color: '#facc15', border: 'none', padding: '14px', borderRadius: '16px', fontWeight: '900', fontSize: '15px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', marginTop: '6px', boxShadow: '0 4px 15px rgba(15, 23, 42, 0.3)' }
};

export default Expo;