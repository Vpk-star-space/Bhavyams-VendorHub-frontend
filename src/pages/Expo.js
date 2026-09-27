import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { ArrowLeft, Heart, MessageCircle, Share2, Store, Plus, MoreVertical, MapPin, Image as ImageIcon, Video, Sparkles, X, Loader, BadgeCheck, Trash2, Edit, Tag, Clock, ShoppingBag } from 'lucide-react';
import { toast } from 'react-toastify';
import axios from 'axios';

const getBackendUrl = () => {
    return process.env.NODE_ENV === 'production' 
        ? 'https://bhavyams-vendorhub-backend.onrender.com/api' 
        : 'http://localhost:5000/api';
};

const getOptimizedImage = (url) => {
    if (!url) return null;
    if (url.includes('cloudinary.com') && !url.includes('q_auto')) {
        return url.replace('/upload/', '/upload/q_auto,f_auto,w_600/');
    }
    return url; 
};

// 🟢 BULLETPROOF MEDIA URL RESOLVER
const resolveMediaUrl = (url) => {
    if (!url) return null;
    // If it's already a full web URL (Cloudinary, AWS, Unsplash)
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:') || url.startsWith('blob:')) {
        return getOptimizedImage(url);
    }
    // If it's a local multer upload file path
    const baseUrl = getBackendUrl().replace('/api', '');
    const cleanPath = url.replace(/\\/g, '/');
    return `${baseUrl}/${cleanPath.startsWith('uploads/') ? cleanPath : 'uploads/' + cleanPath}`;
};

// 🟢 SMART TIMEZONE FIXER
const timeAgo = (dateString) => {
    if (!dateString) return 'Just now';
    
    let safeDate = dateString;
    // Fix Postgres UTC vs Local timezone issue
    if (typeof dateString === 'string' && !dateString.includes('Z') && !dateString.includes('T')) {
        safeDate = dateString.replace(' ', 'T') + 'Z';
    }
    
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

const Expo = () => {
    const navigate = useNavigate();
    const { language } = useContext(AppContext);
    
    // 🟢 AUTH & PERMISSIONS
    const userStr = localStorage.getItem('user');
    const localUser = userStr && userStr !== 'undefined' ? JSON.parse(userStr) : null;
    const isVendor = localUser && localUser.role === 'vendor';
    const isAdmin = localUser && (localUser.role === 'admin' || localUser.email === 'pavanvenkat63@gmail.com');
    const canPost = isVendor || isAdmin;

    // 🟢 FEED STATES
    const [allPosts, setAllPosts] = useState([]);
    const [loading, setLoading] = useState(true); 
    const [activeDropdown, setActiveDropdown] = useState(null); 
    const [activeTab, setActiveTab] = useState('All'); // Top Menu: All | Videos | Photos | Activity
    const [expandedComments, setExpandedComments] = useState({}); 
    const [newComment, setNewComment] = useState('');

    // 🟢 CREATE POST STATES
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [postText, setPostText] = useState('');
    const [mediaFile, setMediaFile] = useState(null);
    const [mediaPreview, setMediaPreview] = useState(null);
    const [taggedProduct, setTaggedProduct] = useState(''); // NEW: Tagging feature
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        fetchFeed();
    }, []);

    const fetchFeed = async () => {
        try {
            const res = await axios.get(`${getBackendUrl()}/expo/feed`);
            const validPosts = (res.data.posts || []).filter(p => p !== null && p !== undefined);
            setAllPosts(validPosts);
        } catch (err) {
            console.error("Backend fetch failed", err);
            toast.error("Failed to connect to backend Database!");
        } finally {
            setLoading(false);
        }
    };

    // 🟢 FILTER POSTS BASED ON TOP MENU
    const displayPosts = allPosts.filter(post => {
        if (activeTab === 'Videos') return post.media_type === 'video';
        if (activeTab === 'Photos') return post.media_type === 'image';
        if (activeTab === 'Activity') return post.isLikedByMe || String(post.owner_id) === String(localUser?.id);
        return true; 
    });

    const handleDeletePost = async (postId) => {
        if (!window.confirm("Are you sure you want to delete this post?")) return;
        
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${getBackendUrl()}/expo/${postId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setAllPosts(allPosts.filter(p => p.id !== postId));
            toast.success("Post deleted successfully.");
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to delete post.");
        }
        setActiveDropdown(null);
    };

    const handleLike = async (postId) => {
        if (!localUser) return navigate('/welcome');

        setAllPosts(allPosts.map(post => {
            if (post && post.id === postId) {
                return { 
                    ...post, 
                    isLikedByMe: !post.isLikedByMe, 
                    likes_count: post.isLikedByMe ? Number(post.likes_count) - 1 : Number(post.likes_count) + 1 
                };
            }
            return post;
        }));

        try {
            const token = localStorage.getItem('token');
            await axios.post(`${getBackendUrl()}/expo/${postId}/like`, {}, { headers: { Authorization: `Bearer ${token}` } });
        } catch (err) {
            toast.error("Failed to sync like.");
        }
    };

    const toggleComments = (postId) => {
        setExpandedComments(prev => ({ ...prev, [postId]: !prev[postId] }));
    };

    const handlePostComment = (e, postId) => {
        e.preventDefault();
        if (!newComment.trim()) return;
        toast.success("Comment added! (Backend sync pending)");
        setNewComment('');
        toggleComments(postId);
    };

    const handleShare = async (post) => {
        if (navigator.share) {
            try {
                await navigator.share({ title: `Offer from ${post.shop_name}`, text: post.content, url: window.location.href });
            } catch (err) {}
        } else {
            toast.success("Link copied to share!");
        }
    };

    const handleMediaSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.type.startsWith('video/')) {
            const video = document.createElement('video');
            video.preload = 'metadata';
            video.onloadedmetadata = function() {
                window.URL.revokeObjectURL(video.src);
                if (video.duration > 60) {
                    toast.error("Video must be 60 seconds or less!");
                    setMediaFile(null);
                    setMediaPreview(null);
                } else {
                    setMediaFile(file);
                    setMediaPreview(URL.createObjectURL(file));
                }
            };
            video.src = URL.createObjectURL(file);
        } else {
            setMediaFile(file);
            setMediaPreview(URL.createObjectURL(file));
        }
    };

    const submitPost = async (e) => {
        e.preventDefault();
        if (!postText.trim() && !mediaFile) return toast.error("Post cannot be empty!");
        
        setIsUploading(true);
        try {
            const token = localStorage.getItem('token');
            const formData = new FormData();
            
            // Encode product tag into the content for now
            const finalContent = taggedProduct ? `${postText}\n\n[Tagged Product: ${taggedProduct}]` : postText;
            formData.append('content', finalContent);
            
            if (mediaFile) {
                formData.append('media', mediaFile);
                formData.append('media_type', mediaFile.type.startsWith('video') ? 'video' : 'image');
            } else {
                formData.append('media_type', 'text');
            }

            const res = await axios.post(`${getBackendUrl()}/expo/create`, formData, {
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
            });
            
            if (res.data.post) setAllPosts([res.data.post, ...allPosts]);
            else await fetchFeed(); 
            
            toast.success("🎉 Post published successfully!");
            setShowCreateModal(false);
            setPostText('');
            setTaggedProduct('');
            setMediaFile(null);
            setMediaPreview(null);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to post to backend.");
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div style={styles.page}>
            {/* 🟢 NAVBAR */}
            <div style={styles.navBar}>
                <button onClick={() => navigate(-1)} style={styles.iconBtn}>
                    <ArrowLeft size={22} color="#0f172a" />
                </button>
                <h1 style={{ margin: 0, fontSize: '18px', color: '#0f172a', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Sparkles size={18} color="#f59e0b" /> Subhams Expo
                </h1>
                <div style={{ width: '40px' }}></div> 
            </div>

            {/* 🟢 NEW: TOP FILTER MENU */}
            <div style={styles.filterMenu} className="hide-scroll">
                {['All', 'Videos', 'Photos', 'Activity'].map(tab => (
                    <button 
                        key={tab} 
                        onClick={() => setActiveTab(tab)}
                        style={{...styles.filterBtn, background: activeTab === tab ? '#0f172a' : '#f1f5f9', color: activeTab === tab ? 'white' : '#64748b'}}
                    >
                        {tab === 'Activity' && <Clock size={14} style={{marginRight: '4px'}} />}
                        {tab}
                    </button>
                ))}
            </div>

            {/* 🟢 FEED CONTAINER */}
            <div style={styles.feedContainer}>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '80px 0', color: '#64748b' }}>
                        <Loader className="spin" size={40} style={{ margin: '0 auto 15px auto' }} color="#2563eb" />
                        <h3 style={{ margin: 0, color: '#1e293b' }}>Syncing the latest offers...</h3>
                    </div>
                ) : displayPosts.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '80px 20px', color: '#94a3b8' }}>
                        <Sparkles size={60} style={{ margin: '0 auto 15px auto', opacity: 0.3 }} color="#94a3b8" />
                        <h3 style={{ margin: '0 0 10px 0', color: '#475569', fontSize: '20px' }}>No posts found in {activeTab}!</h3>
                        <p style={{ margin: 0, fontSize: '14px' }}>Check back soon for the latest vendor offers.</p>
                    </div>
                ) : (
                    displayPosts.map(post => {
                        const isPostOwner = isAdmin || (localUser && String(post.owner_id) === String(localUser.id));
                        // 🟢 OFFICIAL APP DETECTION
                        const isOfficialApp = (post.shop_name && post.shop_name.toLowerCase().includes('subhams')) || post.owner_id === 1;

                        // 🟢 EXTRACT PRODUCT TAG FROM CONTENT
                        const tagMatch = post.content ? post.content.match(/\[Tagged Product: (.*?)\]/) : null;
                        const cleanContent = post.content ? post.content.replace(/\[Tagged Product: .*?\]/, '') : '';
                        const taggedItemName = tagMatch ? tagMatch[1] : null;

                        return (
                            <div key={post.id} style={{ ...styles.postCard, border: isOfficialApp ? '2px solid #facc15' : '1px solid #e2e8f0', boxShadow: isOfficialApp ? '0 10px 25px rgba(250, 204, 21, 0.18)' : '0 2px 10px rgba(0,0,0,0.02)' }}>
                                
                                {/* 1. Post Header (With Gold Badge Logic) */}
                                <div style={{...styles.postHeader, background: isOfficialApp ? '#fffbeb' : 'white', borderBottom: isOfficialApp ? '1px solid #fef3c7' : 'none'}}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }} onClick={() => navigate(`/shop/${post.shop_id}`)}>
                                        <img src={getOptimizedImage(post.shop_logo) || 'https://via.placeholder.com/150/e2e8f0/64748b?text=SHOP'} alt={post.shop_name} style={styles.shopLogo} />
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <span style={styles.shopName}>{post.shop_name || 'Vendor'}</span>
                                                {isOfficialApp ? (
                                                    <span style={styles.goldBadge}><BadgeCheck size={13} color="#713f12" fill="#facc15" />Verified</span>
                                                ) : <BadgeCheck size={14} color="#2563eb" style={{marginLeft:'2px'}}/>}
                                            </div>
                                            <span style={{...styles.postMeta, color: isOfficialApp ? '#b45309' : '#64748b'}}>
                                                <MapPin size={10} color={isOfficialApp ? "#d97706" : "#64748b"}/> {post.location ? post.location.split(',')[0] : 'Local Area'} • {timeAgo(post.created_at)}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <div style={{ position: 'relative' }}>
                                        <button onClick={() => setActiveDropdown(activeDropdown === post.id ? null : post.id)} style={styles.moreBtn}>
                                            <MoreVertical size={18} color={isOfficialApp ? "#b45309" : "#64748b"} />
                                        </button>
                                        
                                        {activeDropdown === post.id && (
                                            <div style={styles.dropdownMenu}>
                                                {isPostOwner ? (
                                                    <>
                                                        <button onClick={() => {toast.info("Edit coming soon!"); setActiveDropdown(null);}} style={styles.dropdownItem}><Edit size={14} /> Edit</button>
                                                        <button onClick={() => handleDeletePost(post.id)} style={{...styles.dropdownItem, color: '#dc2626', borderTop: '1px solid #f1f5f9'}}><Trash2 size={14} /> Delete</button>
                                                    </>
                                                ) : (
                                                    <button onClick={() => {toast.success("Shop reported."); setActiveDropdown(null);}} style={styles.dropdownItem}>Report Post</button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* 2. Post Content */}
                                {cleanContent && (
                                    <div style={{...styles.postContent, background: isOfficialApp ? '#fffbeb' : 'white'}}>
                                        {cleanContent}
                                    </div>
                                )}

                                {/* 3. Edge-to-Edge Media with Product Tag Overlay */}
                                {post.media_url && (
                                    <div style={styles.mediaContainer} onDoubleClick={() => handleLike(post.id)}>
                                        {post.media_type === 'video' ? (
                                            <video src={resolveMediaUrl(post.media_url)} controls muted loop playsInline style={styles.mediaElement} />
                                        ) : (
                                            <img src={resolveMediaUrl(post.media_url)} alt="Post media" style={styles.mediaElement} />
                                        )}

                                        {/* 🟢 SHOPPING TAG OVERLAY */}
                                        {taggedItemName && (
                                            <div onClick={() => navigate(`/shop/${post.shop_id}`)} className="touch-scale" style={styles.productTagOverlay}>
                                                <ShoppingBag size={14} color="white" />
                                                Buy {taggedItemName}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* 4. Action Bar */}
                                <div style={styles.actionBar}>
                                    <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                                        <button onClick={() => handleLike(post.id)} style={styles.actionBtn}>
                                            <Heart size={24} color={post.isLikedByMe ? "#ef4444" : "#475569"} fill={post.isLikedByMe ? "#ef4444" : "transparent"} />
                                            <span style={{...styles.actionCount, color: post.isLikedByMe ? "#ef4444" : "#475569"}}>{post.likes_count || 0}</span>
                                        </button>
                                        
                                        <button style={styles.actionBtn} onClick={() => toggleComments(post.id)}>
                                            <MessageCircle size={24} color="#475569" />
                                            <span style={styles.actionCount}>{post.comments_count || 0}</span>
                                        </button>

                                        <button style={styles.actionBtn} onClick={() => handleShare(post)}>
                                            <Share2 size={22} color="#475569" />
                                        </button>
                                    </div>

                                    {/* 🟢 DYNAMIC VISIT BUTTON */}
                                    <button onClick={() => navigate(`/shop/${post.shop_id}`)} style={{...styles.visitStoreBtn, background: isOfficialApp ? 'linear-gradient(135deg, #facc15, #eab308)' : '#0f172a', color: isOfficialApp ? '#713f12' : 'white'}}>
                                        {isOfficialApp ? <Sparkles size={14} color="#713f12" /> : <Store size={14} color="white" />}
                                        <span>{isOfficialApp ? 'Official Store' : 'Visit Shop'}</span>
                                    </button>
                                </div>

                                {/* 🟢 5. INLINE COMMENTS SECTION */}
                                {expandedComments[post.id] && (
                                    <div style={styles.commentSection}>
                                        <form onSubmit={(e) => handlePostComment(e, post.id)} style={{ display: 'flex', gap: '10px' }}>
                                            <input 
                                                type="text" 
                                                placeholder="Add a comment..." 
                                                style={styles.commentInput} 
                                                value={newComment}
                                                onChange={(e) => setNewComment(e.target.value)}
                                            />
                                            <button type="submit" disabled={!newComment.trim()} style={{ background: 'none', border: 'none', color: '#2563eb', fontWeight: 'bold', cursor: 'pointer' }}>Post</button>
                                        </form>
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>

            {/* 🟢 FLOATING ACTION BUTTON */}
            {canPost && (
                <button className="touch-scale" style={styles.fabBtn} onClick={() => setShowCreateModal(true)}>
                    <Plus size={28} color="white" />
                </button>
            )}

            {/* 🟢 CREATE POST MODAL (With Product Tagging) */}
            {showCreateModal && (
                <div style={styles.overlay}>
                    <div style={styles.modal}>
                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', borderBottom: '1px solid #e2e8f0', paddingBottom: '15px'}}>
                            <h3 style={{margin: 0, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px'}}><Sparkles size={18} color="#2563eb"/> Create Expo Post</h3>
                            <X size={20} style={{cursor: 'pointer', color: '#64748b'}} onClick={() => { setShowCreateModal(false); setMediaFile(null); setMediaPreview(null); setPostText(''); }} />
                        </div>

                        <form onSubmit={submitPost} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <textarea 
                                style={styles.textArea} 
                                placeholder="What's your latest offer or update? (e.g. Flash Sale!)"
                                value={postText}
                                onChange={e => setPostText(e.target.value)}
                            />

                            {/* 🟢 PRODUCT TAG INPUT */}
                            <div style={styles.tagInputBox}>
                                <Tag size={16} color="#64748b" />
                                <input 
                                    type="text" 
                                    placeholder="Tag a product (e.g. Organic Tomatoes)" 
                                    style={{ border: 'none', background: 'none', outline: 'none', width: '100%', fontSize: '13px', color: '#0f172a', fontWeight: '600' }}
                                    value={taggedProduct}
                                    onChange={e => setTaggedProduct(e.target.value)}
                                />
                            </div>

                            {mediaPreview && (
                                <div style={styles.previewBox}>
                                    <button type="button" onClick={() => {setMediaPreview(null); setMediaFile(null);}} style={styles.removeMediaBtn}><X size={14} color="white"/></button>
                                    {mediaFile?.type.startsWith('video') ? (
                                        <video src={mediaPreview} style={{width: '100%', maxHeight: '250px', borderRadius: '8px', background: 'black'}} controls muted />
                                    ) : (
                                        <img src={mediaPreview} alt="Preview" style={{width: '100%', maxHeight: '250px', objectFit: 'cover', borderRadius: '8px'}} />
                                    )}
                                </div>
                            )}

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <label style={styles.uploadIconBtn}>
                                        <ImageIcon size={20} color="#2563eb" />
                                        <input type="file" accept="image/*" style={{display: 'none'}} onChange={handleMediaSelect} />
                                    </label>
                                    <label style={styles.uploadIconBtn}>
                                        <Video size={20} color="#f59e0b" />
                                        <input type="file" accept="video/mp4,video/quicktime" style={{display: 'none'}} onChange={handleMediaSelect} />
                                    </label>
                                </div>
                                <span style={{fontSize: '11px', color: '#94a3b8', fontWeight: 'bold'}}>Video limit: 60s</span>
                            </div>

                            <button type="submit" disabled={isUploading} style={styles.postBtn}>
                                {isUploading ? <><Loader size={18} className="spin" /> Posting...</> : 'Post to Expo 🚀'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
            
            <style>{`
                .spin { animation: spin 1s linear infinite; }
                @keyframes spin { 100% { transform: rotate(360deg); } }
                .touch-scale { transition: transform 0.15s; }
                .touch-scale:active { transform: scale(0.96); }
                .hide-scroll::-webkit-scrollbar { display: none; }
                .hide-scroll { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </div>
    );
};

const styles = {
    page: { background: '#f8fafc', minHeight: '100vh', fontFamily: 'Inter, system-ui, sans-serif' },
    navBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px', background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 100, borderBottom: '1px solid rgba(226, 232, 240, 0.8)' },
    iconBtn: { width: '40px', height: '40px', borderRadius: '50%', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer' },
    
    filterMenu: { display: 'flex', gap: '8px', overflowX: 'auto', padding: '10px 15px', background: 'white', borderBottom: '1px solid #e2e8f0' },
    filterBtn: { border: 'none', padding: '8px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: '800', cursor: 'pointer', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center' },

    feedContainer: { maxWidth: '500px', margin: '0 auto', padding: '10px 0', display: 'flex', flexDirection: 'column', gap: '15px', paddingBottom: '100px' },
    postCard: { background: 'white', borderRadius: '16px', overflow: 'hidden', margin: '0 5px' },
    postHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 15px' },
    shopLogo: { width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover', border: '1px solid #e2e8f0' },
    shopName: { fontSize: '15px', fontWeight: '800', color: '#0f172a' },
    postMeta: { fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px', fontWeight: '600' },
    moreBtn: { background: 'none', border: 'none', cursor: 'pointer', padding: '5px' },
    
    dropdownMenu: { position: 'absolute', top: '30px', right: '0', background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', zIndex: 50, width: '140px', overflow: 'hidden' },
    dropdownItem: { width: '100%', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 15px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold', color: '#334155', textAlign: 'left' },
    
    postContent: { padding: '0 15px 12px 15px', fontSize: '14px', color: '#0f172a', lineHeight: '1.5', fontWeight: '500', whiteSpace: 'pre-wrap' },
    
    mediaContainer: { position: 'relative', width: '100%', maxHeight: '550px', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    mediaElement: { width: '100%', maxHeight: '550px', objectFit: 'contain' },
    
    productTagOverlay: { position: 'absolute', bottom: '15px', left: '15px', background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(8px)', color: 'white', padding: '8px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.2)', boxShadow: '0 4px 10px rgba(0,0,0,0.3)' },

    actionBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 15px', marginTop: '5px' },
    actionBtn: { display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer', padding: '5px 0' },
    actionCount: { fontSize: '14px', fontWeight: '700' },
    
    commentSection: { padding: '10px 15px', background: '#f8fafc', borderTop: '1px solid #f1f5f9' },
    commentInput: { flex: 1, padding: '10px', borderRadius: '20px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none', background: 'white' },

    visitStoreBtn: { display: 'flex', alignItems: 'center', gap: '6px', border: 'none', padding: '8px 16px', borderRadius: '20px', fontSize: '12px', cursor: 'pointer', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', fontWeight: '900' },
    goldBadge: { display: 'inline-flex', alignItems: 'center', gap: '3px', background: 'linear-gradient(135deg, #fef08a, #facc15, #eab308)', color: '#713f12', padding: '2px 8px', borderRadius: '12px', fontSize: '10px', fontWeight: '900', boxShadow: '0 2px 8px rgba(234, 179, 8, 0.45)', border: '1px solid #facc15', marginLeft: '4px' },
    
    fabBtn: { position: 'fixed', bottom: '30px', right: '20px', width: '56px', height: '56px', borderRadius: '50%', background: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', boxShadow: '0 10px 25px rgba(37, 99, 235, 0.4)', zIndex: 150 },
    
    overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15,23,42,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', zIndex: 1000 },
    modal: { background: 'white', padding: '20px', borderRadius: '20px', maxWidth: '500px', width: '100%', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' },
    textArea: { width: '100%', minHeight: '80px', padding: '12px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', resize: 'none', fontFamily: 'inherit', boxSizing: 'border-box', background: '#f8fafc' },
    tagInputBox: { display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '10px' },
    uploadIconBtn: { width: '40px', height: '40px', borderRadius: '50%', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '1px solid #bfdbfe' },
    previewBox: { position: 'relative', width: '100%', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '4px', boxSizing: 'border-box' },
    removeMediaBtn: { position: 'absolute', top: '10px', right: '10px', background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10 },
    postBtn: { background: '#2563eb', color: 'white', border: 'none', padding: '14px', borderRadius: '12px', fontWeight: '900', fontSize: '15px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', marginTop: '5px', boxShadow: '0 4px 10px rgba(37, 99, 235, 0.2)' }
};

export default Expo;