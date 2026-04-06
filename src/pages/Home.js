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

    // 🛡️ Fixed Filter Logic (Ensures Price is treated as a Number)
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
                        <div key={cat} style={styles.drawerItem} onClick={() => { setActiveCategory(cat); setIsDrawerOpen(false); }}>{cat}</div>
                    ))}
                </div>
            </div>

            {/* 🟦 NAVBAR */}
            <nav style={styles.navbar}>
                <div style={styles.navContent}>
                    <div style={styles.navTopRow}>
                        <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                            <Menu size={24} color="#fff" onClick={() => setIsDrawerOpen(true)} />
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
                    <div style={styles.searchBar}>
                        <input 
                            type="text" placeholder="Search for products..." style={styles.searchInput} 
                            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <Search size={18} color="#2874f0" />
                    </div>
                </div>
            </nav>

            {/* ⚪ CATEGORY & PRICE STRIP */}
            <div style={styles.categoryHeader}>
                <div style={styles.categoryList}>
                    {categories.map(cat => (
                        <div key={cat} onClick={() => setActiveCategory(cat)} 
                             style={activeCategory === cat ? styles.activeCatItem : styles.catItem}>
                            {cat}
                        </div>
                    ))}
                    {/* 💰 PRICE FILTER UI */}
                    <div style={styles.priceFilterUI}>
                        <Filter size={14} color="#2874f0" />
                        <span style={{fontSize: '11px', fontWeight: 'bold'}}>Under: ₹{maxPrice.toLocaleString('en-IN')}</span>
                        <input 
                            type="range" min="500" max="100000" step="500"
                            value={maxPrice} onChange={(e) => setMaxPrice(Number(e.target.value))}
                            style={{width: '80px', accentColor: '#2874f0'}}
                        />
                    </div>
                </div>
            </div>

            {/* 📦 MAIN CONTENT */}
            <div style={styles.container}>
                {loading ? (
                    <div style={styles.loader}>Loading Shop...</div>
                ) : (
                    <div style={styles.grid}>
                        {filteredProducts.length === 0 ? (
                            <div style={{gridColumn: '1/-1', textAlign: 'center', padding: '40px', color: '#878787'}}>No products match your filters.</div>
                        ) : filteredProducts.map((item) => {
                            const isAvailable = Number(item.stock_count) > 0;
                            const imageSrc = item.image_url?.startsWith('http') 
                                ? item.image_url 
                                : `https://bhavyams-vendorhub-backend.onrender.com${item.image_url}`;

                            return (
                                <div key={item.id} style={styles.card} onClick={() => navigate(`/product/${item.id}`)}>
                                    <div style={styles.imageBox}>
                                        <img src={imageSrc} alt={item.name} style={styles.image} />
                                        {!isAvailable && <div style={styles.soldOut}>OUT OF STOCK</div>}
                                    </div>
                                    <div style={styles.info}>
                                        <div style={styles.productName}>{item.name}</div>
                                        <div style={styles.ratingRow}>
                                            <div style={styles.ratingBadge}>4.2 ★</div>
                                            <Zap size={14} fill="#2874f0" color="#2874f0" />
                                        </div>
                                        <div style={styles.priceRow}>
                                            <span style={styles.currPrice}>₹{item.price}</span>
                                            <span style={styles.offText}>Assured</span>
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
            </div>

            {/* 👨‍💻 DEVELOPER FOOTER */}
            <footer style={styles.footer}>
                <p><strong>System Engineer:</strong> Venkata Pavan Kumar</p>
                <div style={styles.footerLinks}>
                    <a href="mailto:pavanvenkat63@gmail.com"><Mail size={14} /> Email</a>
                    <a href="https://subhams-vpk.vercel.app/" target="_blank" rel="noreferrer"><ExternalLink size={14} /> Subhams</a>
                </div>
            </footer>
        </div>
    );
};

const styles = {
    page: { background: '#f1f3f6', minHeight: '100vh', fontFamily: 'Roboto, sans-serif' },
    drawerOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 2000 },
    drawer: { position: 'fixed', top: 0, width: '280px', height: '100%', background: '#fff', zIndex: 2001, transition: '0.3s ease' },
    drawerHeader: { background: '#2874f0', padding: '20px', color: '#fff', display: 'flex', alignItems: 'center', gap: '15px', fontWeight: 'bold' },
    closeIcon: { marginLeft: 'auto' },
    drawerContent: { padding: '10px 0' },
    drawerItem: { padding: '15px 20px', display: 'flex', alignItems: 'center', gap: '15px', borderBottom: '1px solid #f0f0f0' },
    drawerLabel: { padding: '15px 20px 5px', fontSize: '12px', color: '#878787', fontWeight: 'bold' },
    drawerDivider: { height: '8px', background: '#f1f3f6' },
    
    navbar: { background: '#2874f0', padding: '10px 0', position: 'sticky', top: 0, zIndex: 1000 },
    navContent: { maxWidth: '1240px', margin: '0 auto', padding: '0 15px' },
    navTopRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' },
    brand: { color: '#fff', fontSize: '20px', fontWeight: 'bold', fontStyle: 'italic' },
    navIcons: { display: 'flex', alignItems: 'center', gap: '20px' },
    searchBar: { background: '#fff', display: 'flex', alignItems: 'center', padding: '0 12px', borderRadius: '4px', height: '40px' },
    searchInput: { border: 'none', width: '100%', outline: 'none', fontSize: '14px' },
    loginBtn: { background: '#fff', color: '#2874f0', border: 'none', padding: '5px 15px', fontWeight: 'bold', borderRadius: '2px' },
    cartBtn: { position: 'relative' },
    cartBadge: { position: 'absolute', top: '-8px', right: '-10px', background: '#ff6161', color: '#fff', fontSize: '10px', padding: '2px 5px', borderRadius: '50%', border: '1px solid #fff' },

    categoryHeader: { background: '#fff', boxShadow: '0 1px 2px rgba(0,0,0,0.1)', overflowX: 'auto', whiteSpace: 'nowrap' },
    categoryList: { display: 'flex', padding: '12px 15px', gap: '25px', alignItems: 'center' },
    catItem: { fontSize: '13px', fontWeight: 'bold', color: '#212121' },
    activeCatItem: { fontSize: '13px', fontWeight: 'bold', color: '#2874f0' },
    priceFilterUI: { display: 'flex', alignItems: 'center', gap: '8px', paddingLeft: '15px', borderLeft: '1px solid #e0e0e0' },

    container: { maxWidth: '1240px', margin: '0 auto', padding: '15px 10px' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '8px' },
    card: { background: '#fff', borderRadius: '4px', overflow: 'hidden', display: 'flex', flexDirection: 'column' },
    imageBox: { height: '160px', padding: '10px', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    image: { maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' },
    soldOut: { position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444', fontWeight: 'bold', fontSize: '12px' },
    info: { padding: '10px', flex: 1, display: 'flex', flexDirection: 'column', gap: '5px' },
    productName: { fontSize: '13px', color: '#212121', height: '32px', overflow: 'hidden' },
    ratingRow: { display: 'flex', alignItems: 'center', gap: '5px' },
    ratingBadge: { background: '#388e3c', color: '#fff', padding: '2px 6px', borderRadius: '3px', fontSize: '11px', fontWeight: 'bold' },
    priceRow: { display: 'flex', alignItems: 'center', gap: '5px' },
    currPrice: { fontSize: '15px', fontWeight: 'bold' },
    offText: { fontSize: '10px', color: '#2874f0', fontWeight: 'bold', border: '1px solid #2874f0', padding: '0 4px' },
    addBtn: { background: '#ff9f00', color: '#fff', border: 'none', padding: '8px', fontWeight: 'bold', borderRadius: '2px', marginTop: '5px', fontSize: '12px' },
    loader: { textAlign: 'center', padding: '50px', color: '#2874f0', fontWeight: 'bold' },
    footer: { textAlign: 'center', padding: '30px 20px', background: '#fff', marginTop: '20px', fontSize: '13px', borderTop: '1px solid #e2e8f0' },
    footerLinks: { display: 'flex', justifyContent: 'center', gap: '15px', marginTop: '10px', color: '#2874f0' }
};

export default Home;