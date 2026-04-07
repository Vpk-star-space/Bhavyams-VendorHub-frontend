import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { 
    Search, ShoppingCart, Zap, Menu, X, User, 
    ShoppingBag, LogOut, Mail, ExternalLink, Filter 
} from 'lucide-react'; 
import { useCart } from '../context/CartContext';
import { toast } from 'react-toastify';
import confetti from 'canvas-confetti';

const Home = () => {
    const [products, setProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [maxPrice, setMaxPrice] = useState(100000); 
    const [activeCategory, setActiveCategory] = useState('All');
    const [isDrawerOpen, setIsDrawerOpen] = useState(false); 
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    
    const categories = ['All', 'Electronics', 'Food', 'Fashion', 'Home', 'Others'];
    const navigate = useNavigate();
    const { cart, addToCart } = useCart();
    const totalCartItems = cart.reduce((total, item) => total + (item.quantity || 1), 0);
    const user = JSON.parse(localStorage.getItem('user'));

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        
        const fetchAll = async () => {
            try {
                const res = await axios.get('https://bhavyams-vendorhub-backend.onrender.com/api/products/all');
                const items = res.data.products || res.data || [];
                setProducts(items);
                setFilteredProducts(items);
            } catch (err) {
                console.error("Fetch Error:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchAll();
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const results = products.filter(product => {
            const name = (product.name || "").toLowerCase();
            const desc = (product.description || "").toLowerCase();
            const category = product.category || "Others";
            const pPrice = Number(product.price) || 0;

            const matchesSearch = name.includes(searchTerm.toLowerCase()) || desc.includes(searchTerm.toLowerCase());
            const matchesPrice = pPrice <= maxPrice;
            const matchesCategory = activeCategory === 'All' || category === activeCategory;
            
            return matchesSearch && matchesPrice && matchesCategory;
        });
        setFilteredProducts(results);
    }, [searchTerm, maxPrice, activeCategory, products]);

    const handleLogout = () => {
        localStorage.clear();
        window.location.reload();
    };

    const handleAddToCart = (e, item) => {
        e.stopPropagation();
        addToCart(item);
        toast.success(`🛒 Added ${item.name}!`, { position: "bottom-center", autoClose: 1000 });
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.8 } });
    };

    return (
        <div style={styles.page}>
            {/* ☰ SLIDING SIDEBAR */}
            {isDrawerOpen && <div style={styles.drawerOverlay} onClick={() => setIsDrawerOpen(false)} />}
            <div style={{...styles.drawer, left: isDrawerOpen ? '0' : '-300px'}}>
                <div style={styles.drawerHeader}>
                    <User size={20} />
                    <span>Hello, {user ? user.username.split(' ')[0] : 'Guest'}</span>
                    <X size={24} style={styles.closeIcon} onClick={() => setIsDrawerOpen(false)} />
                </div>
                <div style={styles.drawerContent}>
                    {user ? (
                        <>
                            <div style={styles.drawerItem} onClick={() => navigate('/profile')}><User size={18}/> My Profile</div>
                            <div style={styles.drawerItem} onClick={() => navigate('/dashboard')}><ShoppingBag size={18}/> My Orders</div>
                            <div style={{...styles.drawerItem, color: '#ef4444'}} onClick={handleLogout}><LogOut size={18}/> Logout</div>
                        </>
                    ) : (
                        <div style={styles.drawerItem} onClick={() => navigate('/login')}><User size={18}/> Login / Register</div>
                    )}
                    <div style={styles.drawerDivider} />
                    <div style={styles.drawerLabel}>CATEGORIES</div>
                    {categories.map(cat => (
                        <div key={cat} style={{...styles.drawerItem, fontWeight: activeCategory === cat ? 'bold' : 'normal', color: activeCategory === cat ? '#2874f0' : '#212121'}} 
                             onClick={() => { setActiveCategory(cat); setIsDrawerOpen(false); }}>{cat}</div>
                    ))}
                </div>
            </div>

            {/* 🟦 HEADER SECTION */}
            <header style={styles.navbar}>
                <div style={styles.navContent}>
                    <div style={styles.navTopRow}>
                        <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                            <Menu size={24} color="#fff" onClick={() => setIsDrawerOpen(true)} style={{cursor: 'pointer'}} />
                            <h1 style={styles.brand} onClick={() => navigate('/')}>Bhavyams</h1>
                        </div>
                        <div style={styles.navIcons}>
                            {!isMobile && (
                                <button onClick={() => navigate(user ? '/dashboard' : '/login')} style={styles.loginBtn}>
                                    {user ? 'Dashboard' : 'Login'}
                                </button>
                            )}
                            <div style={styles.cartBtn} onClick={() => navigate('/cart')}>
                                <ShoppingCart size={24} color="#fff" />
                                {totalCartItems > 0 && <span style={styles.cartBadge}>{totalCartItems}</span>}
                            </div>
                        </div>
                    </div>
                    {/* 🔍 SEARCH BAR */}
                    <div style={styles.searchContainer}>
                        <div style={styles.searchBar}>
                            <Search size={18} color="#999" />
                            <input 
                                type="text" placeholder="Search for products, brands and more" style={styles.searchInput} 
                                value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
            </header>

            {/* ⚪ SMOOTH CATEGORY STRIP */}
            <div style={styles.categoryHeader}>
                <div style={styles.categoryList}>
                    {categories.map(cat => (
                        <div key={cat} onClick={() => setActiveCategory(cat)} 
                             style={activeCategory === cat ? styles.activeCatItem : styles.catItem}>
                            {cat}
                        </div>
                    ))}
                    <div style={styles.priceFilterUI}>
                        <Filter size={14} color="#2874f0" />
                        <span style={{fontSize: '11px', fontWeight: '800'}}>₹{maxPrice/1000}k</span>
                        <input 
                            type="range" min="500" max="100000" step="500"
                            value={maxPrice} onChange={(e) => setMaxPrice(Number(e.target.value))}
                            style={styles.rangeInput}
                        />
                    </div>
                </div>
            </div>

            {/* 📦 PRODUCT GRID */}
            <main style={styles.container}>
                {loading ? (
                    <div style={styles.loader}>
                        <div className="spinner"></div>
                        <p>Loading Bhavyams Shop...</p>
                    </div>
                ) : (
                    <div style={styles.grid}>
                        {filteredProducts.length === 0 ? (
                            <div style={styles.noResults}>No products match your filters.</div>
                        ) : filteredProducts.map((item) => {
                            const isAvailable = Number(item.stock_count) > 0;
                            // Clean URL Logic
                            const rawUrl = item.image_url || '';
                            const cleanUrl = rawUrl.replace(/["\\]/g, ''); 
                            const imageSrc = cleanUrl.startsWith('http') 
                                ? cleanUrl 
                                : `https://bhavyams-vendorhub-backend.onrender.com${cleanUrl}`;

                            return (
                                <div key={item.id} style={styles.card} onClick={() => navigate(`/product/${item.id}`)}>
                                    <div style={styles.imageBox}>
                                        <img src={imageSrc} alt={item.name} style={styles.image} loading="lazy" />
                                        {!isAvailable && <div style={styles.soldOut}>OUT OF STOCK</div>}
                                    </div>
                                    <div style={styles.info}>
                                        <div style={styles.productName}>{item.name}</div>
                                        <div style={styles.ratingRow}>
                                            <div style={styles.ratingBadge}>4.2 ★</div>
                                            <Zap size={14} fill="#2874f0" color="#2874f0" />
                                            <span style={styles.assuredText}>Assured</span>
                                        </div>
                                        <div style={styles.priceRow}>
                                            <span style={styles.currPrice}>₹{item.price}</span>
                                            <span style={styles.mrpText}>₹{Math.round(item.price * 1.2)}</span>
                                        </div>
                                        {isAvailable && (
                                            <button style={styles.addBtn} onClick={(e) => handleAddToCart(e, item)}>ADD TO CART</button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>

            <footer style={styles.footer}>
                <p style={{margin:0, fontWeight: '900', color: '#212121'}}>BHAVYAMS VENDOR HUB</p>
                <p style={{fontSize: '11px', color: '#878787', marginTop: '5px'}}>System Engineered by Venkata Pavan Kumar</p>
                <div style={styles.footerLinks}>
                    <a href="mailto:pavanvenkat63@gmail.com" style={styles.footLink}><Mail size={14} /> Email</a>
                    <a href="https://subhams-vpk.vercel.app/" target="_blank" rel="noreferrer" style={styles.footLink}><ExternalLink size={14} /> Subhams</a>
                </div>
            </footer>
        </div>
    );
};

const styles = {
    page: { background: '#f1f3f6', minHeight: '100vh', fontFamily: "'Roboto', sans-serif" },
    drawerOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 2000 },
    drawer: { position: 'fixed', top: 0, width: '280px', height: '100%', background: '#fff', zIndex: 2001, transition: '0.3s cubic-bezier(0.4, 0, 0.2, 1)', boxShadow: '5px 0 15px rgba(0,0,0,0.1)' },
    drawerHeader: { background: '#2874f0', padding: '20px', color: '#fff', display: 'flex', alignItems: 'center', gap: '15px', fontWeight: 'bold' },
    closeIcon: { marginLeft: 'auto', cursor: 'pointer' },
    drawerContent: { padding: '10px 0' },
    drawerItem: { padding: '15px 20px', display: 'flex', alignItems: 'center', gap: '15px', borderBottom: '1px solid #f0f0f0', cursor: 'pointer', fontSize: '14px' },
    drawerLabel: { padding: '15px 20px 5px', fontSize: '11px', color: '#878787', fontWeight: '800', letterSpacing: '0.5px' },
    drawerDivider: { height: '8px', background: '#f1f3f6' },
    
    navbar: { background: '#2874f0', padding: '8px 0 12px', position: 'sticky', top: 0, zIndex: 1000, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' },
    navContent: { maxWidth: '1240px', margin: '0 auto', padding: '0 12px' },
    navTopRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' },
    brand: { color: '#fff', fontSize: '18px', fontWeight: '900', fontStyle: 'italic', cursor: 'pointer', letterSpacing: '0.5px' },
    navIcons: { display: 'flex', alignItems: 'center', gap: '18px' },
    searchContainer: { width: '100%' },
    searchBar: { background: '#fff', display: 'flex', alignItems: 'center', padding: '0 12px', borderRadius: '2px', height: '36px', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' },
    searchInput: { border: 'none', width: '100%', outline: 'none', fontSize: '13px', marginLeft: '8px', color: '#212121' },
    loginBtn: { background: '#fff', color: '#2874f0', border: 'none', padding: '4px 18px', fontWeight: 'bold', borderRadius: '2px', fontSize: '13px' },
    cartBtn: { position: 'relative', cursor: 'pointer' },
    cartBadge: { position: 'absolute', top: '-8px', right: '-10px', background: '#ff6161', color: '#fff', fontSize: '9px', fontWeight: 'bold', width: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', border: '1px solid #2874f0' },

    categoryHeader: { background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', overflowX: 'auto', position: 'sticky', top: '92px', zIndex: 900 },
    categoryList: { display: 'flex', padding: '10px 15px', gap: '20px', alignItems: 'center', minWidth: 'max-content' },
    catItem: { fontSize: '12px', fontWeight: '500', color: '#212121', cursor: 'pointer' },
    activeCatItem: { fontSize: '12px', fontWeight: 'bold', color: '#2874f0', cursor: 'pointer', borderBottom: '2px solid #2874f0', paddingBottom: '2px' },
    priceFilterUI: { display: 'flex', alignItems: 'center', gap: '6px', paddingLeft: '15px', borderLeft: '1px solid #e0e0e0' },
    rangeInput: { width: '60px', accentColor: '#2874f0', cursor: 'pointer' },

    container: { maxWidth: '1240px', margin: '0 auto', padding: '10px 8px' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }, // 🚀 2 per row on mobile
    card: { background: '#fff', borderRadius: '2px', overflow: 'hidden', display: 'flex', flexDirection: 'column', cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' },
    imageBox: { height: '150px', padding: '8px', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff' },
    image: { maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' },
    soldOut: { position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444', fontWeight: '900', fontSize: '10px', textTransform: 'uppercase' },
    info: { padding: '8px 10px', flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' },
    productName: { fontSize: '12px', color: '#212121', height: '32px', overflow: 'hidden', lineHeight: '1.3' },
    ratingRow: { display: 'flex', alignItems: 'center', gap: '5px', marginTop: '2px' },
    ratingBadge: { background: '#388e3c', color: '#fff', padding: '1px 5px', borderRadius: '2px', fontSize: '10px', fontWeight: 'bold' },
    assuredText: { fontSize: '10px', color: '#878787', fontWeight: 'bold' },
    priceRow: { display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' },
    currPrice: { fontSize: '14px', fontWeight: 'bold', color: '#212121' },
    mrpText: { fontSize: '11px', color: '#878787', textDecoration: 'line-through' },
    addBtn: { background: '#ff9f00', color: '#fff', border: 'none', padding: '7px', fontWeight: 'bold', borderRadius: '2px', marginTop: '6px', fontSize: '11px', width: '100%' },
    
    loader: { textAlign: 'center', padding: '100px 20px', color: '#2874f0', fontWeight: 'bold' },
    noResults: { gridColumn: '1/-1', textAlign: 'center', padding: '60px 20px', color: '#878787', fontSize: '14px' },
    footer: { textAlign: 'center', padding: '40px 20px', background: '#fff', marginTop: '40px', borderTop: '1px solid #e2e8f0' },
    footerLinks: { display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '15px' },
    footLink: { color: '#2874f0', textDecoration: 'none', fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' }
};

export default Home;