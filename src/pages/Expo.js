import React, { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { ArrowLeft, Heart, MessageCircle, Share2, Store, Plus, MoreVertical, MapPin, Image as ImageIcon, Video, Sparkles, X, Loader, BadgeCheck, Trash2, Tag, Clock, ShoppingBag, Search, MessageSquareOff, Reply, UserPlus, Check, Eye, Users } from 'lucide-react';
import { toast } from 'react-toastify';
import axios from 'axios';

const getBackendUrl = () => {
    return process.env.NODE_ENV === 'production' 
        ? 'https://bhavyams-vendorhub-backend.onrender.com/api' 
        : 'http://localhost:5000/api';
};

const resolveMediaUrl = (url, type = 'image') => {
    if (!url) return null;
    if (type === 'video' || url.match(/\.(mp4|webm|ogg|mov)$/i) || url.includes('video/upload')) {
        return url.startsWith('http') ? url : `${getBackendUrl().replace('/api', '')}/uploads/${url.replace(/\\/g, '/').split('uploads/').pop()}`;
    }
    if (url.includes('cloudinary.com') && !url.includes('q_auto')) {
        return url.replace('/upload/', '/upload/q_auto,f_auto,w_800/');
    }
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:') || url.startsWith('blob:')) return url;
    return `${getBackendUrl().replace('/api', '')}/${url.replace(/\\/g, '/')}`;
};

const getFallbackAvatar = (name) => {
    const safeName = name ? encodeURIComponent(name) : 'User';
    return `https://ui-avatars.com/api/?name=${safeName}&background=random&color=fff&bold=true`;
};

const timeAgo = (dateString) => {
    if (!dateString) return 'Just now';
    let safeDate = typeof dateString === 'string' && !dateString.includes('Z') && !dateString.includes('T') ? dateString.replace(' ', 'T') + 'Z' : dateString;
    const seconds = Math.floor((new Date() - new Date(safeDate)) / 1000);
    if (seconds < 60) return 'Just now';
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    return "Just now";
};

// 🟢 NEW: The 3-Tier Verified Badge Renderer
const renderBadge = (isOfficial, isVerified) => {
    if (isOfficial) {
        return (
            <span style={styles.goldBadge}>
                <BadgeCheck size={14} color="#ffffff" fill="#FFD700" style={{ filter: 'drop-shadow(0 1px 2px rgba(184, 134, 11, 0.4))' }} />
                Official
            </span>
        );
    }
    if (isVerified) {
        return <BadgeCheck size={14} color="#ffffff" fill="#10b981" title="Verified Genuine Vendor" />;
    }
    return <BadgeCheck size={14} color="#ffffff" fill="#3b82f6" title="Approved Vendor" />;
};

const Expo = () => {
    const navigate = useNavigate();
    const { language } = useContext(AppContext);
    
    const userStr = localStorage.getItem('user');
    const localUser = userStr && userStr !== 'undefined' ? JSON.parse(userStr) : null;
    const isVendor = localUser && localUser.role === 'vendor';
    const isAdmin = localUser && (localUser.role === 'admin' || localUser.email === 'pavanvenkat63@gmail.com');
    const canPost = isVendor || isAdmin;

    const [allPosts, setAllPosts] = useState([]);
    const [loading, setLoading] = useState(true); 
    const [activeDropdown, setActiveDropdown] = useState(null); 
    const [activeTab, setActiveTab] = useState('All'); 
    
    const [followingMap, setFollowingMap] = useState({});
    const [viewedPosts, setViewedPosts] = useState(new Set()); 

    const [expandedComments, setExpandedComments] = useState({}); 
    const [postComments, setPostComments] = useState({}); 
    const [newComment, setNewComment] = useState('');
    const [replyingTo, setReplyingTo] = useState(null);
    const [showLikesModal, setShowLikesModal] = useState({ isOpen: false, likes: [] });

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [postText, setPostText] = useState('');
    const [mediaFile, setMediaFile] = useState(null);
    const [mediaPreview, setMediaPreview] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [allowComments, setAllowComments] = useState(true);

    const videoRef = useRef(null);
    const [isVideoOversized, setIsVideoOversized] = useState(false); 
    const [videoDuration, setVideoDuration] = useState(0);
    const [trimStart, setTrimStart] = useState(0); 

    const [isTaggingMenuOpen, setIsTaggingMenuOpen] = useState(false);
    const [tagSearchQuery, setTagSearchQuery] = useState('');
    const [liveTagOptions, setLiveTagOptions] = useState([]);
    const [selectedTag, setSelectedTag] = useState(null); 

    useEffect(() => { 
        fetchFeed(); 
        if (localUser) fetchFollowing(); // Load Following states on mount!
    }, []);

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
            const res = await axios.get(`${getBackendUrl()}/expo/feed`);
            const validPosts = (res.data.posts || []).filter(p => p !== null && p !== undefined);
            setAllPosts(validPosts);
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
        setViewedPosts(prev => new Set(prev).add(postId));
        setAllPosts(allPosts.map(p => p.id === postId ? { ...p, views_count: (Number(p.views_count) || 0) + 1 } : p));
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
            setFollowingMap(prev => ({ ...prev, [shopId]: isFollowing }));
            toast.error("Failed to follow shop.");
        }
    };

    const handleDeletePost = async (postId) => {
        if (!window.confirm("Delete this post?")) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${getBackendUrl()}/expo/${postId}`, { headers: { Authorization: `Bearer ${token}` } });
            setAllPosts(allPosts.filter(p => p.id !== postId));
            toast.success("Post deleted.");
        } catch (err) { toast.error("Failed to delete post."); }
        setActiveDropdown(null);
    };

    const handleLike = async (postId) => {
        if (!localUser) return navigate('/welcome');
        setAllPosts(allPosts.map(post => {
            if (post && post.id === postId) return { ...post, isLikedByMe: !post.isLikedByMe, likes_count: post.isLikedByMe ? Number(post.likes_count) - 1 : Number(post.likes_count) + 1 };
            return post;
        }));
        try {
            const token = localStorage.getItem('token');
            await axios.post(`${getBackendUrl()}/expo/${postId}/like`, {}, { headers: { Authorization: `Bearer ${token}` } });
        } catch (err) {}
    };

    const fetchLikesList = async (postId) => {
        try {
            const res = await axios.get(`${getBackendUrl()}/expo/${postId}/likes`);
            setShowLikesModal({ isOpen: true, likes: res.data.likes });
        } catch (err) { toast.error("Could not fetch likes."); }
    };

    const toggleComments = async (postId) => {
        const isOpening = !expandedComments[postId];
        setExpandedComments(prev => ({ ...prev, [postId]: isOpening }));
        setReplyingTo(null);
        if (isOpening) {
            try {
                const res = await axios.get(`${getBackendUrl()}/expo/${postId}/comments`);
                setPostComments(prev => ({ ...prev, [postId]: res.data.comments }));
            } catch (err) {}
        }
    };

    const handlePostComment = async (e, postId) => {
        e.preventDefault();
        if (!newComment.trim() || !localUser) return;
        
        const commentText = newComment;
        const parentId = replyingTo?.postId === postId ? replyingTo.commentId : null;
        setNewComment('');
        setReplyingTo(null);
        
        const tempComment = { id: Date.now(), display_name: localUser.role === 'admin' ? 'Subhams Hub Official' : (localUser.business_name || localUser.username || 'You'), role: localUser.role, text: commentText, parent_comment_id: parentId, user_id: localUser.id };
        setPostComments(prev => ({ ...prev, [postId]: [...(prev[postId] || []), tempComment] }));
        setAllPosts(allPosts.map(p => p.id === postId ? { ...p, comments_count: Number(p.comments_count) + 1 } : p));

        try {
            const token = localStorage.getItem('token');
            await axios.post(`${getBackendUrl()}/expo/${postId}/comment`, { text: commentText, parent_comment_id: parentId }, { headers: { Authorization: `Bearer ${token}` } });
        } catch (err) { toast.error("Failed to save comment."); }
    };

    const handleDeleteComment = async (postId, commentId) => {
        if (!window.confirm("Delete this comment?")) return;
        setPostComments(prev => ({ ...prev, [postId]: prev[postId].filter(c => c.id !== commentId && c.parent_comment_id !== commentId) }));
        setAllPosts(allPosts.map(p => p.id === postId ? { ...p, comments_count: Number(p.comments_count) - 1 } : p));
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${getBackendUrl()}/expo/comment/${commentId}`, { headers: { Authorization: `Bearer ${token}` } });
        } catch (err) {}
    };

    const handleMediaSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setIsVideoOversized(false);
        setTrimStart(0);

        if (file.type.startsWith('video/')) {
            const video = document.createElement('video');
            video.preload = 'metadata';
            video.onloadedmetadata = function() {
                window.URL.revokeObjectURL(video.src);
                setMediaFile(file);
                setMediaPreview(URL.createObjectURL(file));
                const dur = Math.floor(video.duration);
                setVideoDuration(dur);
                if (dur > 60) setIsVideoOversized(true); 
            };
            video.src = URL.createObjectURL(file);
        } else {
            setMediaFile(file);
            setMediaPreview(URL.createObjectURL(file));
        }
    };

    const handleTrimDrag = (e) => {
        const newTime = parseInt(e.target.value);
        setTrimStart(newTime);
        if (videoRef.current) videoRef.current.currentTime = newTime;
    };

    const submitPost = async (e) => {
        e.preventDefault();
        if (!postText.trim() && !mediaFile) return toast.error("Post cannot be empty!");
        
        setIsUploading(true);
        try {
            const token = localStorage.getItem('token');
            const formData = new FormData();
            
            formData.append('content', postText);
            formData.append('allow_comments', allowComments);
            
            if (selectedTag) {
                formData.append('tagged_item_id', selectedTag.id);
                formData.append('tagged_item_type', selectedTag.type);
                formData.append('tagged_item_name', selectedTag.name);
            }
            
            if (mediaFile) {
                formData.append('media', mediaFile);
                formData.append('media_type', mediaFile.type.startsWith('video') ? 'video' : 'image');
                if (isVideoOversized) {
                    formData.append('trim_start', trimStart); 
                    formData.append('trim_end', trimStart + 60); 
                }
            } else {
                formData.append('media_type', 'text');
            }

            const res = await axios.post(`${getBackendUrl()}/expo/create`, formData, { headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } });
            
            if (res.data.post) { setAllPosts([res.data.post, ...allPosts]); } else { await fetchFeed(); }
            
            toast.success("🎉 Post published!");
            setShowCreateModal(false);
            setPostText('');
            setSelectedTag(null);
            setMediaFile(null);
            setMediaPreview(null);
            setIsVideoOversized(false);
            setAllowComments(true);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to post video.");
        } finally { setIsUploading(false); }
    };

    const displayPostsData = allPosts.filter(post => {
        if (activeTab === 'Videos') return post.media_type === 'video';
        if (activeTab === 'Photos') return post.media_type === 'image';
        if (activeTab === 'Activity') return post.isLikedByMe || String(post.owner_id) === String(localUser?.id);
        return true; 
    });

    return (
        <div style={styles.page}>
            <div style={styles.navBar}>
                <button onClick={() => navigate(-1)} style={styles.iconBtn}><ArrowLeft size={22} color="#0f172a" /></button>
                <h1 style={{ margin: 0, fontSize: '18px', color: '#0f172a', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Sparkles size={18} color="#f59e0b" /> Subhams Expo
                </h1>
                <div style={{ width: '40px' }}></div> 
            </div>

            <div style={styles.filterMenu} className="hide-scroll">
                {['All', 'Videos', 'Photos', 'Activity'].map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab)} style={{...styles.filterBtn, background: activeTab === tab ? '#0f172a' : '#f1f5f9', color: activeTab === tab ? 'white' : '#64748b'}}>
                        {tab === 'Activity' && <Clock size={14} style={{marginRight: '4px'}} />} {tab}
                    </button>
                ))}
            </div>

            <div style={styles.feedContainer}>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '80px 0', color: '#64748b' }}><Loader className="spin" size={40} style={{ margin: '0 auto 15px auto' }} color="#2563eb" /></div>
                ) : displayPostsData.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '80px 20px', color: '#94a3b8' }}>
                        <Sparkles size={60} style={{ margin: '0 auto 15px auto', opacity: 0.3 }} color="#94a3b8" />
                        <h3 style={{ margin: '0 0 10px 0', color: '#475569', fontSize: '20px' }}>No posts found.</h3>
                    </div>
                ) : (
                    displayPostsData.map(post => {
                        const isPostOwner = isAdmin || (localUser && String(post.owner_id) === String(localUser.id));
                        const isOfficialApp = (post.shop_name && post.shop_name.toLowerCase().includes('subhams')) || post.owner_id === 1;
                        const hasTag = post.tagged_item_name && post.tagged_item_type;
                        const isFollowing = followingMap[post.shop_id];

                        return (
                            <div key={post.id} style={{ ...styles.postCard, border: isOfficialApp ? '2px solid #FFD700' : '1px solid #e2e8f0', boxShadow: isOfficialApp ? '0 10px 30px rgba(255, 215, 0, 0.15)' : '0 1px 3px rgba(0,0,0,0.05)' }}>
                                
                                <div style={{...styles.postHeader, background: isOfficialApp ? 'linear-gradient(to right, #fffbeb, #ffffff)' : 'white'}}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                                        <div style={isOfficialApp ? styles.shopLogoWrapperGold : styles.shopLogoWrapper} onClick={() => navigate(`/shop/${post.shop_id}`)}>
                                            <img src={resolveMediaUrl(post.shop_logo) || getFallbackAvatar(post.shop_name)} onError={(e) => { e.target.onerror = null; e.target.src = getFallbackAvatar(post.shop_name); }} alt={post.shop_name} style={styles.shopLogo} />
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <span onClick={() => navigate(`/shop/${post.shop_id}`)} style={styles.shopName}>{post.shop_name || 'Vendor'}</span>
                                                
                                                {/* 🟢 THE 3-TIER BADGE RENDERER */}
                                                {renderBadge(isOfficialApp, post.is_verified)}
                                                
                                                {!isPostOwner && (
                                                    <button onClick={() => handleFollowToggle(post.shop_id)} style={{...styles.followBtn, background: isFollowing ? '#f1f5f9' : '#e0e7ff', color: isFollowing ? '#64748b' : '#4f46e5'}}>
                                                        {isFollowing ? <Check size={12} /> : <UserPlus size={12} />} {isFollowing ? 'Following' : 'Follow'}
                                                    </button>
                                                )}
                                            </div>
                                            <span style={styles.postMeta}>
                                                <MapPin size={10} color={isOfficialApp ? "#d97706" : "#94a3b8"}/> {post.location ? post.location.split(',')[0] : 'Local'} • {timeAgo(post.created_at)}
                                            </span>
                                        </div>
                                    </div>
                                    <div style={{ position: 'relative' }}>
                                        <button onClick={() => setActiveDropdown(activeDropdown === post.id ? null : post.id)} style={styles.moreBtn}><MoreVertical size={18} color="#64748b" /></button>
                                        {activeDropdown === post.id && (
                                            <div style={styles.dropdownMenu}>
                                                {isPostOwner ? (
                                                    <button onClick={() => handleDeletePost(post.id)} style={{...styles.dropdownItem, color: '#ef4444'}}><Trash2 size={14} /> Delete</button>
                                                ) : (
                                                    // 🟢 PREVENTS REPORTING ADMIN
                                                    !isOfficialApp && <button onClick={() => {toast.success("Reported."); setActiveDropdown(null);}} style={styles.dropdownItem}>Report Post</button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {post.media_url && (
                                    <div style={styles.mediaContainer} onDoubleClick={() => handleLike(post.id)}>
                                        {post.media_type === 'video' ? (
                                            <video src={resolveMediaUrl(post.media_url, 'video')} onPlay={() => handleView(post.id)} controls muted loop playsInline style={styles.mediaElement} />
                                        ) : (
                                            <img src={resolveMediaUrl(post.media_url, 'image')} onLoad={() => handleView(post.id)} alt="Post media" style={styles.mediaElement} loading="lazy" />
                                        )}
                                    </div>
                                )}
                                
                                {hasTag && (
                                    <div style={{ padding: '10px 15px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                        <button onClick={() => post.tagged_item_type === 'shop' ? navigate(`/shop/${post.tagged_item_id}`) : navigate(`/product/${post.tagged_item_id}`)} className="touch-scale" style={styles.visibleTagBtn}>
                                            {post.tagged_item_type === 'shop' ? <Store size={14} color="#1e293b" /> : <ShoppingBag size={14} color="#1e293b" />}
                                            <span style={{flex: 1, textAlign: 'left', fontWeight: '800', color: '#1e293b'}}>{post.tagged_item_type === 'shop' ? 'Visit Shop: ' : 'Buy Product: '} {post.tagged_item_name}</span>
                                            <ArrowLeft size={16} color="#94a3b8" style={{ transform: 'rotate(135deg)' }} />
                                        </button>
                                    </div>
                                )}

                                {post.content && <div style={{...styles.postContent, background: isOfficialApp ? '#fffbeb' : 'white'}}>{post.content}</div>}

                                <div style={{ padding: '5px 15px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#94a3b8', background: isOfficialApp ? '#fffbeb' : 'white' }}>
                                    <Eye size={12} /> {post.views_count || 0} views
                                </div>
                                <div style={{...styles.actionBar, background: isOfficialApp ? '#fffbeb' : 'white'}}>
                                    <div style={{ display: 'flex', gap: '18px', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <button onClick={() => handleLike(post.id)} style={styles.actionBtn}>
                                                <Heart size={26} color={post.isLikedByMe ? "#ef4444" : "#1e293b"} fill={post.isLikedByMe ? "#ef4444" : "transparent"} />
                                            </button>
                                            <span onClick={() => fetchLikesList(post.id)} style={{...styles.actionCount, cursor: 'pointer', textDecoration: 'underline'}}>{post.likes_count || 0}</span>
                                        </div>
                                        
                                        {post.allow_comments !== false ? (
                                            <button style={styles.actionBtn} onClick={() => toggleComments(post.id)}>
                                                <MessageCircle size={26} color="#1e293b" />
                                                <span style={styles.actionCount}>{post.comments_count || 0}</span>
                                            </button>
                                        ) : (
                                            <div style={{...styles.actionBtn, opacity: 0.5}} onClick={() => toast.info("Comments disabled.")}><MessageSquareOff size={26} color="#64748b" /></div>
                                        )}
                                        <button style={styles.actionBtn} onClick={() => {if(navigator.share) navigator.share({title:'Offer', url:window.location.href}); else toast.success("Link copied!");}}><Share2 size={24} color="#1e293b" /></button>
                                    </div>
                                    <button onClick={() => navigate(`/shop/${post.shop_id}`)} style={{...styles.visitStoreBtn, background: isOfficialApp ? 'linear-gradient(135deg, #facc15, #eab308)' : '#f1f5f9', color: isOfficialApp ? '#713f12' : '#0f172a'}}>
                                        {isOfficialApp ? 'Official Store' : 'Visit Shop'}
                                    </button>
                                </div>

                                {expandedComments[post.id] && post.allow_comments !== false && (
                                    <div style={styles.commentSection}>
                                        <div style={styles.commentList} className="hide-scroll">
                                            {(postComments[post.id] || []).filter(c => !c.parent_comment_id).map(c => (
                                                <div key={c.id}>
                                                    <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
                                                        <img src={resolveMediaUrl(c.display_avatar) || getFallbackAvatar(c.display_name)} onError={(e) => { e.target.onerror = null; e.target.src = getFallbackAvatar(c.display_name); }} alt="Avatar" style={{width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', border: '1px solid #e2e8f0'}} />
                                                        <div style={{ flex: 1 }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                                <span style={{ fontWeight: '800', fontSize: '13px', color: '#0f172a' }}>{c.display_name}</span>
                                                                {renderBadge(c.role === 'admin', false)}
                                                            </div>
                                                            <div style={{ fontSize: '13.5px', color: '#334155', marginTop: '2px', wordBreak: 'break-word' }}>{c.text}</div>
                                                            <div style={{ display: 'flex', gap: '12px', marginTop: '6px', fontSize: '11.5px', fontWeight: '600', color: '#94a3b8' }}>
                                                                <span style={{cursor: 'pointer'}} onClick={() => setReplyingTo({ commentId: c.id, name: c.display_name, postId: post.id })}>Reply</span>
                                                                {(isAdmin || String(localUser?.id) === String(c.user_id) || isPostOwner) && <span style={{cursor: 'pointer', color: '#ef4444'}} onClick={() => handleDeleteComment(post.id, c.id)}>Delete</span>}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {(postComments[post.id] || []).filter(reply => reply.parent_comment_id === c.id).map(reply => (
                                                        <div key={reply.id} style={{ display: 'flex', gap: '10px', marginBottom: '12px', marginLeft: '35px' }}>
                                                            <img src={resolveMediaUrl(reply.display_avatar) || getFallbackAvatar(reply.display_name)} onError={(e) => { e.target.onerror = null; e.target.src = getFallbackAvatar(reply.display_name); }} alt="Avatar" style={{width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover', border: '1px solid #e2e8f0'}} />
                                                            <div style={{ flex: 1 }}>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                                    <span style={{ fontWeight: '800', fontSize: '13px', color: '#0f172a' }}>{reply.display_name}</span>
                                                                    {renderBadge(reply.role === 'admin', false)}
                                                                </div>
                                                                <div style={{ fontSize: '13.5px', color: '#334155', marginTop: '2px', wordBreak: 'break-word' }}>{reply.text}</div>
                                                                <div style={{ display: 'flex', gap: '12px', marginTop: '6px', fontSize: '11.5px', fontWeight: '600', color: '#94a3b8' }}>
                                                                    {(isAdmin || String(localUser?.id) === String(reply.user_id) || isPostOwner) && <span style={{cursor: 'pointer', color: '#ef4444'}} onClick={() => handleDeleteComment(post.id, reply.id)}>Delete</span>}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ))}
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
                                                <input type="text" placeholder="Add a comment..." style={styles.commentInput} value={newComment} onChange={(e) => setNewComment(e.target.value)} />
                                                <button type="submit" disabled={!newComment.trim()} style={styles.commentPostBtn}>Post</button>
                                            </div>
                                        </form>
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>

            {canPost && <button className="touch-scale" style={styles.fabBtn} onClick={() => setShowCreateModal(true)}><Plus size={28} color="white" /></button>}

            {showCreateModal && (
                <div style={styles.overlay}>
                    <div style={styles.modal} className="hide-scroll">
                        {isTaggingMenuOpen ? (
                            <div style={{ display: 'flex', flexDirection: 'column', height: '400px' }}>
                                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px'}}>
                                    <h3 style={{margin: 0, fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px'}}><ArrowLeft size={20} style={{cursor: 'pointer'}} onClick={() => setIsTaggingMenuOpen(false)} /> Tag Item</h3>
                                </div>
                                <div style={styles.tagSearchContainer}>
                                    <Search size={16} color="#94a3b8" />
                                    <input type="text" placeholder="Search..." style={styles.tagSearchInput} value={tagSearchQuery} onChange={(e) => setTagSearchQuery(e.target.value)} autoFocus />
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
                                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', paddingBottom: '10px'}}>
                                    <h3 style={{margin: 0, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px'}}><Sparkles size={18} color="#2563eb"/> Create Post</h3>
                                    <X size={24} style={{cursor: 'pointer', color: '#64748b'}} onClick={() => { setShowCreateModal(false); setMediaFile(null); setMediaPreview(null); setIsVideoOversized(false); setSelectedTag(null); }} />
                                </div>

                                <form onSubmit={submitPost} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                    <textarea style={styles.textArea} placeholder="Write a caption..." value={postText} onChange={e => setPostText(e.target.value)} />

                                    <div style={styles.tagInputBox} onClick={() => { setIsTaggingMenuOpen(true); setTagSearchQuery(''); }}>
                                        <Tag size={16} color={selectedTag ? "#2563eb" : "#64748b"} />
                                        <span style={{ fontSize: '14px', fontWeight: '600', color: selectedTag ? '#2563eb' : '#64748b', flex: 1 }}>{selectedTag ? `Tagged: ${selectedTag.name}` : 'Tag a Shop or Product...'}</span>
                                        {selectedTag && <X size={16} color="#ef4444" onClick={(e) => { e.stopPropagation(); setSelectedTag(null); }} />}
                                    </div>

                                    {mediaPreview && (
                                        <div style={styles.previewBox}>
                                            <button type="button" onClick={() => {setMediaPreview(null); setMediaFile(null); setIsVideoOversized(false);}} style={styles.removeMediaBtn}><X size={14} color="white"/></button>
                                            {mediaFile?.type.startsWith('video') ? (
                                                <>
                                                    <video ref={videoRef} src={mediaPreview} style={styles.previewMediaElement} controls muted />
                                                    
                                                    {/* 🟢 THE INTUITIVE SLIDING WINDOW TRIMMER */}
                                                    {isVideoOversized && (
                                                        <div style={styles.trimmerUI}>
                                                            <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 'bold', color: '#fff', marginBottom: '10px'}}>
                                                                <span>Slide to select 60s</span>
                                                                <span style={{color: '#facc15'}}>{trimStart}s - {trimStart + 60}s</span>
                                                            </div>
                                                            <div style={{ position: 'relative', width: '100%', height: '36px', background: '#334155', borderRadius: '8px', overflow: 'hidden' }}>
                                                                <div style={{ position: 'absolute', left: `${(trimStart / videoDuration) * 100}%`, width: `${(60 / videoDuration) * 100}%`, height: '100%', border: '2px solid white', background: 'rgba(255,255,255,0.2)', pointerEvents: 'none', borderRadius: '6px' }}></div>
                                                                <input type="range" min="0" max={videoDuration - 60} value={trimStart} onChange={handleTrimDrag} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'grab' }} />
                                                            </div>
                                                        </div>
                                                    )}
                                                </>
                                            ) : (
                                                <img src={mediaPreview} alt="Preview" style={styles.previewMediaElement} />
                                            )}
                                        </div>
                                    )}

                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0' }}>
                                        <div style={{ display: 'flex', gap: '12px' }}>
                                            <label style={styles.uploadIconBtn}>
                                                <ImageIcon size={22} color="#10b981" />
                                                <input type="file" accept="image/*" style={{display: 'none'}} onChange={handleMediaSelect} />
                                            </label>
                                            <label style={styles.uploadIconBtn}>
                                                <Video size={22} color="#3b82f6" />
                                                <input type="file" accept="video/mp4,video/quicktime,video/webm,image/gif" style={{display: 'none'}} onChange={handleMediaSelect} />
                                            </label>
                                        </div>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '700', color: '#64748b', cursor: 'pointer' }}>
                                            <input type="checkbox" checked={allowComments} onChange={(e) => setAllowComments(e.target.checked)} style={{accentColor: '#2563eb', width: '16px', height: '16px'}} />
                                            Allow Comments
                                        </label>
                                    </div>

                                    <button type="submit" disabled={isUploading} style={styles.postBtn}>
                                        {isUploading ? <Loader size={20} className="spin" /> : 'Share to Expo'}
                                    </button>
                                </form>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* LIKES MODAL */}
            {showLikesModal.isOpen && (
                <div style={styles.overlay} onClick={() => setShowLikesModal({ isOpen: false, likes: [] })}>
                    <div style={{...styles.modal, maxHeight: '400px'}} onClick={e => e.stopPropagation()}>
                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', paddingBottom: '10px', borderBottom: '1px solid #e2e8f0'}}>
                            <h3 style={{margin: 0, fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px'}}><Users size={18} color="#2563eb"/> Likes</h3>
                            <X size={20} style={{cursor: 'pointer', color: '#64748b'}} onClick={() => setShowLikesModal({ isOpen: false, likes: [] })} />
                        </div>
                        <div style={{overflowY: 'auto', maxHeight: '300px'}} className="hide-scroll">
                            {showLikesModal.likes.length === 0 ? <p style={{textAlign: 'center', color: '#94a3b8', fontSize: '13px'}}>No likes yet.</p> : null}
                            {showLikesModal.likes.map(u => (
                                <div key={u.id} style={{display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 0', borderBottom: '1px solid #f1f5f9'}}>
                                    <img src={getFallbackAvatar(u.name)} alt="Avatar" style={{width: '32px', height: '32px', borderRadius: '50%'}} />
                                    <span style={{fontSize: '14px', fontWeight: '700', color: '#0f172a'}}>{u.name}</span>
                                    {renderBadge(u.role === 'admin', false)}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
            
            <style>{`.spin { animation: spin 1s linear infinite; } @keyframes spin { 100% { transform: rotate(360deg); } } .touch-scale { transition: transform 0.15s cubic-bezier(0.4, 0, 0.2, 1); } .touch-scale:active { transform: scale(0.95); } .hide-scroll::-webkit-scrollbar { display: none; } .hide-scroll { -ms-overflow-style: none; scrollbar-width: none; }`}</style>
        </div>
    );
};

const styles = {
    page: { background: '#f8fafc', minHeight: '100vh', fontFamily: 'Inter, system-ui, sans-serif' },
    navBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px', background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(15px)', position: 'sticky', top: 0, zIndex: 100, borderBottom: '1px solid #e2e8f0' },
    iconBtn: { width: '40px', height: '40px', borderRadius: '50%', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer' },
    filterMenu: { display: 'flex', gap: '10px', overflowX: 'auto', padding: '10px 15px', background: 'white', borderBottom: '1px solid #e2e8f0' },
    filterBtn: { border: 'none', padding: '8px 18px', borderRadius: '20px', fontSize: '13px', fontWeight: '800', cursor: 'pointer', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center' },
    feedContainer: { maxWidth: '500px', margin: '0 auto', padding: '15px 0', display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '100px' },
    postCard: { background: 'white', borderRadius: '0px', borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }, 
    postHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 15px' },
    shopLogoWrapper: { padding: '2px', background: '#e2e8f0', borderRadius: '50%', cursor: 'pointer' },
    shopLogoWrapperGold: { padding: '3px', background: 'linear-gradient(45deg, #FFD700, #FDB931)', borderRadius: '50%', cursor: 'pointer', boxShadow: '0 0 15px rgba(255, 215, 0, 0.4)' },
    shopLogo: { width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover', border: '2px solid white' },
    shopName: { fontSize: '14.5px', fontWeight: '800', color: '#0f172a', cursor: 'pointer' },
    postMeta: { fontSize: '11px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '600' },
    followBtn: { display: 'flex', alignItems: 'center', gap: '4px', border: 'none', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '800', marginLeft: '6px', cursor: 'pointer', transition: 'all 0.2s' },
    moreBtn: { background: 'none', border: 'none', cursor: 'pointer', padding: '5px' },
    dropdownMenu: { position: 'absolute', top: '30px', right: '0', background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', zIndex: 50, width: '150px', overflow: 'hidden' },
    dropdownItem: { width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 15px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold', color: '#1e293b', textAlign: 'left' },
    mediaContainer: { position: 'relative', width: '100%', maxHeight: '600px', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
    mediaElement: { width: '100%', maxHeight: '600px', objectFit: 'cover' }, 
    visibleTagBtn: { display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '12px', background: '#e2e8f0', border: 'none', borderRadius: '12px', cursor: 'pointer' },
    postContent: { padding: '15px 15px 5px 15px', fontSize: '14.5px', color: '#1e293b', lineHeight: '1.5', whiteSpace: 'pre-wrap' },
    actionBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 15px' },
    actionBtn: { display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer', padding: '5px 0' },
    actionCount: { fontSize: '14.5px', fontWeight: '800', color: '#1e293b' },
    commentSection: { padding: '15px', background: 'white', borderTop: '1px solid #f1f5f9' },
    commentList: { maxHeight: '250px', overflowY: 'auto', marginBottom: '10px', paddingRight: '5px' },
    commentInput: { flex: 1, padding: '12px 16px', borderRadius: '24px', border: '1px solid #e2e8f0', fontSize: '13.5px', outline: 'none', background: '#f8fafc' },
    commentPostBtn: { background: 'none', border: 'none', color: '#2563eb', fontWeight: '800', cursor: 'pointer', padding: '0 10px', fontSize: '14px' },
    visitStoreBtn: { display: 'flex', alignItems: 'center', gap: '6px', border: 'none', padding: '8px 16px', borderRadius: '20px', fontSize: '12.5px', fontWeight: '800', cursor: 'pointer' },
    goldBadge: { display: 'inline-flex', alignItems: 'center', gap: '3px', background: '#fffbeb', color: '#b45309', padding: '2px 8px', borderRadius: '12px', fontSize: '10px', fontWeight: '900', border: '1px solid #fde68a', marginLeft: '6px', filter: 'drop-shadow(0 2px 4px rgba(250, 204, 21, 0.2))' },
    fabBtn: { position: 'fixed', bottom: '30px', right: '20px', width: '60px', height: '60px', borderRadius: '50%', background: 'linear-gradient(135deg, #2563eb, #3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', boxShadow: '0 10px 25px rgba(37, 99, 235, 0.4)', zIndex: 150 },
    overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15,23,42,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '15px', zIndex: 1000 },
    modal: { background: 'white', padding: '24px', borderRadius: '24px', maxWidth: '450px', width: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' },
    textArea: { width: '100%', minHeight: '80px', padding: '0', border: 'none', fontSize: '16px', outline: 'none', resize: 'none', background: 'transparent' },
    tagInputBox: { display: 'flex', alignItems: 'center', gap: '10px', padding: '14px', background: '#f1f5f9', borderRadius: '12px', marginBottom: '10px', cursor: 'pointer', border: '1px solid #e2e8f0' },
    tagSearchContainer: { display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', background: '#f1f5f9', borderRadius: '12px', marginBottom: '15px' },
    tagSearchInput: { border: 'none', background: 'none', outline: 'none', width: '100%', fontSize: '14px' },
    tagListContainer: { flex: 1, overflowY: 'auto' },
    tagListItem: { display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderBottom: '1px solid #f1f5f9', cursor: 'pointer' },
    uploadIconBtn: { width: '45px', height: '45px', borderRadius: '50%', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '1px solid #e2e8f0' },
    previewBox: { position: 'relative', width: '100%', borderRadius: '16px', overflow: 'hidden', background: '#0f172a', marginBottom: '15px' },
    removeMediaBtn: { position: 'absolute', top: '12px', right: '12px', background: 'rgba(0,0,0,0.7)', border: 'none', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10 },
    previewMediaElement: { width: '100%', maxHeight: '300px', objectFit: 'cover', display: 'block' },
    trimmerUI: { position: 'absolute', bottom: '15px', left: '15px', right: '15px', background: 'rgba(0,0,0,0.85)', padding: '15px', borderRadius: '12px', backdropFilter: 'blur(8px)', display: 'flex', flexDirection: 'column' },
    postBtn: { background: '#2563eb', color: 'white', border: 'none', padding: '16px', borderRadius: '16px', fontWeight: '900', fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', marginTop: '15px', boxShadow: '0 4px 15px rgba(37, 99, 235, 0.3)' }
};

export default Expo;