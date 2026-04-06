import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { 
    Search, ShoppingCart, Zap, Menu, X, User, 
    ShoppingBag, Heart, LogOut, Filter, Layers, Mail, ExternalLink, 
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
    
    const categories = ['All', 'Electronics', 'Food', 'Fashion', 'Home', 'Others'];
    const navigate = useNavigate();
    
    // 🛒 Cart Context and TOTAL ITEM COUNT FIX
    const { cart, addToCart } = useCart();
    const totalCartItems = cart.reduce((total, item) => total + (item.quantity || 1), 0);
    
    const user = JSON.parse(localStorage.getItem('user'));

    useEffect(() => {
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
    }, []);

    useEffect(() => {
        const results = products.filter(product => {
            const name = (product.name || "").toLowerCase();
            const desc = (product.description || "").toLowerCase();
            const category = product.category || "Others";
            const matchesSearch = name.includes(searchTerm.toLowerCase()) || desc.includes(searchTerm.toLowerCase());
            
            const pPrice = Number(product.price) || 0;
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
        toast.dismiss();
        addToCart(item);
        setTimeout(() => {
            toast.dismiss(); 
            toast.success(`🛒 Added ${item.name} to Cart!`, { position: "bottom-center", autoClose: 1500 });
            confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, zIndex: 9999 });
        }, 10);
    };

    return (
        <div style={styles.page}>
            {/* ☰ SLIDING SIDEBAR (DRAWER) */}
            <div style={{...styles.drawerOverlay, display: isDrawerOpen ? 'block' : 'none'}} onClick={() => setIsDrawerOpen(false)} />
            <div style={{...styles.drawer, left: isDrawerOpen ? '0' : '-300px'}}>
                <div style={styles.drawerHeader}>
                    <User size={20} color="#fff" />
                    <span>Hello, {user ? user.username.split(' ')[0] : 'Guest'}</span>
                    <X size={24} style={styles.closeIcon} onClick={() => setIsDrawerOpen(false)} />
                </div>
                <div style={styles.drawerContent}>
                    {user ? (
                        <>
                            <div style={styles.drawerItem} onClick={() => navigate('/profile')}><User size={18}/> My Profile</div>
                            <div style={styles.drawerItem} onClick={() => navigate('/dashboard')}><ShoppingBag size={18}/> My Orders</div>
                            <div style={styles.drawerItem} onClick={() => toast.info("Wishlist coming soon")}><Heart size={18}/> My Wishlist</div>
                            <div style={{...styles.drawerItem, color: '#ef4444'}} onClick={handleLogout}><LogOut size={18}/> Logout</div>
                        </>
                    ) : (
                        <div style={styles.drawerItem} onClick={() => navigate('/login')}><User size={18}/> Login / Register</div>
                    )}
                    <div style={styles.drawerDivider} />
                    <div style={styles.drawerLabel}>CATEGORIES</div>
                    {categories.map(cat => (
                        <div key={cat} style={styles.drawerItem} onClick={() => { setActiveCategory(cat); setIsDrawerOpen(false); }}>
                            {cat}
                        </div>
                    ))}
                </div>
            </div>

            {/* 🟦 NAVBAR */}
            <nav style={styles.navbar}>
                <div style={styles.navContent}>
                    <div style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
                        <Menu size={24} color="#fff" style={{cursor: 'pointer'}} onClick={() => setIsDrawerOpen(true)} />
                        <h1 style={styles.brand} onClick={() => navigate('/')}>
                            Bhavyams <span style={{color: '#ffe500'}}>VendorHub</span>
                        </h1>
                    </div>
                    
                    <div style={styles.searchBar}>
                        <input 
                            type="text" placeholder="Search products..." style={styles.searchInput} 
                            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <Search size={20} color="#2874f0" />
                    </div>

                    <div style={styles.navLinks}>
                        <button onClick={() => navigate(user ? '/dashboard' : '/login')} style={styles.loginBtn}>
                            {user ? 'Dashboard' : 'Login'}
                        </button>
                        <div style={styles.cartBtn} onClick={() => navigate('/cart')}>
                            <ShoppingCart size={22} color="#fff" />
                            {/* 🛡️ CART FIX: Using totalCartItems instead of cart.length */}
                            {totalCartItems > 0 && <span style={styles.cartBadge}>{totalCartItems}</span>}
                        </div>
                    </div>
                </div>
            </nav>

            {/* ⚪ CATEGORY & FILTER STRIP */}
            <div style={styles.categoryHeader}>
                <div style={styles.categoryList}>
                    {categories.map(cat => (
                        <div key={cat} onClick={() => setActiveCategory(cat)} 
                             style={activeCategory === cat ? styles.activeCatItem : styles.catItem}>
                            {cat}
                        </div>
                    ))}
                    <div style={styles.priceFilterUI}>
                        <Filter size={14} />
                        <span>Under: ₹{maxPrice}</span>
                        <input 
                            type="range" min="500" max="100000" step="500"
                            value={maxPrice} onChange={(e) => setMaxPrice(Number(e.target.value))}
                        />
                    </div>
                </div>
            </div>

            {/* 📦 MAIN CONTENT */}
            <div style={styles.container}>
                {loading ? (
                    <div style={styles.loader}>Updating Marketplace...</div>
                ) : (
                    <div style={styles.grid}>
                        {filteredProducts.map((item) => {
                            const isAvailable = Number(item.stock_count) > 0;
                            const imageSrc = item.image_url?.startsWith('http') 
                                ? item.image_url 
                                // 🚀 FIX: Point to the live Render Backend!
                                : `https://bhavyams-vendorhub-backend.onrender.com${item.image_url}`;

                            let picCount = 1;
                            try { if(item.gallery) picCount = JSON.parse(item.gallery).length; } catch(e){}

                            return (
                                <div key={item.id} style={styles.card} onClick={() => navigate(`/product/${item.id}`)}>
                                    <div style={styles.imageBox}>
                                        <img src={imageSrc} alt={item.name} style={styles.image} />
                                        {!isAvailable && <div style={styles.soldOut}>OUT OF STOCK</div>}
                                        {picCount > 1 && (
                                            <div style={styles.picBadge}><Layers size={10}/> {picCount} Pics</div>
                                        )}
                                    </div>
                                    <div style={styles.info}>
                                        <div style={styles.productName}>{item.name}</div>
                                        <div style={styles.ratingRow}>
                                            <div style={styles.ratingBadge}>4.2 ★</div>
                                            <Zap size={14} fill="#2874f0" color="#2874f0" style={{marginLeft: 'auto'}} />
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

            {/* 👨‍💻 DEVELOPER INFO ADDED BELOW MAIN CONTAINER */}
            <div style={{ textAlign: 'center', padding: '40px 20px 20px', background: '#f1f3f6', color: '#64748b', fontSize: '13px', borderTop: '1px solid #e2e8f0', marginTop: '40px' }}>
                <p style={{ margin: '0 0 10px 0' }}>
                    
                    <strong style={{ color: '#0f172a' }}>System Engineer</strong> 
                </p>
                <p style={{ margin: '0 0 10px 0' }}>
                    
                     <strong style={{ color: '#0f172a' }}>Venkata Pavan Kumar</strong>  
                </p>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '15px' }}>
                    <a href="mailto:pavanvenkat63@gmail.com" style={{ color: '#2874f0', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Mail size={14} /> pavanvenkat63@gmail.com
                    </a>
                    <span>|</span>
                    <a href="https://subhams-vpk.vercel.app/" target="_blank" rel="noopener noreferrer" style={{ color: '#2874f0', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <ExternalLink size={14} /> Subhams 
                    </a>
                </div>
            </div>

        </div>
    );
};

const styles = {
    page: { background: '#f1f3f6', minHeight: '100vh', fontFamily: 'Roboto, Arial, sans-serif' },
    drawerOverlay: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', zIndex: 2000 },
    drawer: { position: 'fixed', top: 0, width: '280px', height: '100%', background: '#fff', zIndex: 2001, transition: '0.3s ease', boxShadow: '2px 0 10px rgba(0,0,0,0.2)' },
    drawerHeader: { background: '#2874f0', padding: '20px', color: '#fff', display: 'flex', alignItems: 'center', gap: '15px', fontWeight: 'bold' },
    closeIcon: { marginLeft: 'auto', cursor: 'pointer' },
    drawerContent: { padding: '10px 0' },
    drawerItem: { padding: '15px 20px', display: 'flex', alignItems: 'center', gap: '15px', cursor: 'pointer', fontSize: '14px', color: '#212121', borderBottom: '1px solid #f0f0f0' },
    drawerLabel: { padding: '15px 20px 5px', fontSize: '12px', fontWeight: 'bold', color: '#878787' },
    drawerDivider: { height: '8px', background: '#f1f3f6', margin: '10px 0' },
    navbar: { background: '#2874f0', padding: '12px 0', position: 'sticky', top: 0, zIndex: 1000 },
    navContent: { maxWidth: '1240px', margin: '0 auto', display: 'flex', alignItems: 'center', padding: '0 20px', gap: '20px' },
    brand: { color: '#fff', fontSize: '18px', fontWeight: 'bold', fontStyle: 'italic', cursor: 'pointer', margin: 0 },
    searchBar: { background: '#fff', flex: 1, display: 'flex', alignItems: 'center', padding: '0 15px', borderRadius: '2px', height: '36px' },
    searchInput: { border: 'none', width: '100%', outline: 'none', fontSize: '14px' },
    navLinks: { display: 'flex', alignItems: 'center', gap: '30px' },
    loginBtn: { background: '#fff', color: '#2874f0', border: 'none', padding: '6px 30px', fontWeight: 'bold', borderRadius: '2px', cursor: 'pointer' },
    cartBtn: { position: 'relative', cursor: 'pointer' },
    cartBadge: { position: 'absolute', top: '-10px', right: '-12px', background: '#ff6161', border: '1px solid #fff', borderRadius: '50%', padding: '2px 5px', fontSize: '10px', color: '#fff' },
    categoryHeader: { background: '#fff', boxShadow: '0 1px 1px 0 rgba(0,0,0,.16)', padding: '10px 0', marginBottom: '15px' },
    categoryList: { maxWidth: '1240px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '30px' },
    catItem: { fontSize: '14px', fontWeight: 'bold', color: '#212121', cursor: 'pointer' },
    activeCatItem: { fontSize: '14px', fontWeight: 'bold', color: '#2874f0', cursor: 'pointer' },
    priceFilterUI: { display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', borderLeft: '1px solid #ddd', paddingLeft: '20px' },
    container: { maxWidth: '1240px', margin: '0 auto', padding: '0 10px' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: '10px' },
    card: { background: '#fff', borderRadius: '2px', overflow: 'hidden', cursor: 'pointer', display: 'flex', flexDirection: 'column', border: '1px solid transparent' },
    imageBox: { height: '200px', padding: '15px', textAlign: 'center', position: 'relative' },
    image: { maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' },
    soldOut: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444', fontWeight: 'bold' },
    picBadge: { position: 'absolute', bottom: '10px', left: '10px', background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: '10px', padding: '2px 6px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px' },
    info: { padding: '15px', flex: 1, display: 'flex', flexDirection: 'column' },
    productName: { fontSize: '14px', color: '#212121', marginBottom: '8px' },
    ratingRow: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' },
    ratingBadge: { background: '#388e3c', color: '#fff', padding: '2px 6px', borderRadius: '3px', fontSize: '12px', fontWeight: 'bold' },
    priceRow: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px' },
    currPrice: { fontSize: '16px', fontWeight: 'bold', color: '#212121' },
    offText: { fontSize: '12px', color: '#2874f0', fontWeight: 'bold', border: '1px solid #2874f0', padding: '1px 4px', borderRadius: '2px' },
    addBtn: { background: '#ff9f00', color: '#fff', border: 'none', padding: '10px', fontWeight: 'bold', borderRadius: '2px', cursor: 'pointer' },
    loader: { textAlign: 'center', padding: '100px', fontWeight: 'bold', color: '#2874f0' }
};

export default Home;