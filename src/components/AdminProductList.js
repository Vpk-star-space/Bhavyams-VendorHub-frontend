import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Trash2, Package, Tag, User, } from 'lucide-react';
import { toast } from 'react-toastify';

const AdminProductList = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);

        const fetchProducts = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get('https://bhavyams-vendorhub-backend.onrender.com/api/auth/admin/all-products', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setProducts(res.data);
            } catch (err) {
                toast.error("Failed to load products");
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const getProductImg = (url) => {
        if (!url) return 'https://via.placeholder.com/150?text=No+Image';
        return url.startsWith('http') ? url : `https://bhavyams-vendorhub-backend.onrender.com${url}`;
    };

    const deleteProduct = async (id) => {
        if (window.confirm("Delete this product from the marketplace?")) {
            try {
                const token = localStorage.getItem('token');
                await axios.delete(`https://bhavyams-vendorhub-backend.onrender.com/api/auth/admin/delete-product/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setProducts(products.filter(p => p.id !== id));
                toast.success("Product removed");
            } catch (err) {
                toast.error("Error deleting product");
            }
        }
    };

    if (loading) return <div style={styles.loader}>Loading Global Inventory...</div>;

    return (
        <div style={isMobile ? styles.mobileContainer : styles.container}>
            <h4 style={styles.title}>
                <Package size={22} color="#10b981"/> Global Inventory ({products.length})
            </h4>

            {isMobile ? (
                /* 📱 MOBILE VIEW: PRODUCT LIST CARDS */
                <div style={styles.cardGrid}>
                    {products.map(p => (
                        <div key={p.id} style={styles.productCard}>
                            <img 
                                src={getProductImg(p.image_url)} 
                                alt={p.name} 
                                style={styles.mobileThumb} 
                                onError={(e) => { e.target.src = 'https://via.placeholder.com/100?text=No+Img'; }}
                            />
                            <div style={styles.cardInfo}>
                                <div style={styles.cardHeader}>
                                    <span style={styles.cardName}>{p.name}</span>
                                    <button onClick={() => deleteProduct(p.id)} style={styles.delBtnMobile}>
                                        <Trash2 size={16}/>
                                    </button>
                                </div>
                                <div style={styles.cardMeta}>
                                    <div style={styles.metaItem}><Tag size={12}/> {p.category}</div>
                                    <div style={styles.metaItem}><User size={12}/> {p.vendor_name}</div>
                                </div>
                                <div style={styles.cardPrice}>₹{p.price}</div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                /* 💻 DESKTOP VIEW: PROFESSIONAL TABLE */
                <div style={{overflowX: 'auto'}}>
                    <table style={styles.table}>
                        <thead>
                            <tr style={styles.headerRow}>
                                <th style={styles.th}>Preview</th>
                                <th style={styles.th}>Product Details</th>
                                <th style={styles.th}>Category</th>
                                <th style={styles.th}>Price</th>
                                <th style={styles.th}>Vendor</th>
                                <th style={styles.th}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.map(p => (
                                <tr key={p.id} style={styles.tr}>
                                    <td style={styles.td}>
                                        <img src={getProductImg(p.image_url)} alt="" style={styles.thumbnail} />
                                    </td>
                                    <td style={styles.td}>
                                        <div style={{fontWeight: '700', color: '#0f172a'}}>{p.name}</div>
                                        <div style={{fontSize: '11px', color: '#94a3b8'}}>PID: #{p.id}</div>
                                    </td>
                                    <td style={styles.td}><span style={styles.catBadge}>{p.category}</span></td>
                                    <td style={styles.td}><span style={styles.priceText}>₹{p.price}</span></td>
                                    <td style={styles.td}><span style={styles.vendorText}>{p.vendor_name}</span></td>
                                    <td style={styles.td}>
                                        <button onClick={() => deleteProduct(p.id)} style={styles.delBtn}>
                                            <Trash2 size={16}/>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

const styles = {
    container: { background: '#fff', padding: '30px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' },
    mobileContainer: { padding: '5px 0' },
    title: { marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '18px', fontWeight: '900' },
    loader: { textAlign: 'center', padding: '50px', color: '#64748b', fontWeight: 'bold' },

    // Desktop Table
    table: { width: '100%', borderCollapse: 'collapse' },
    headerRow: { textAlign: 'left', borderBottom: '2px solid #f1f5f9' },
    th: { padding: '15px', color: '#64748b', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' },
    td: { padding: '15px', fontSize: '14px', verticalAlign: 'middle' },
    tr: { borderBottom: '1px solid #f8fafc' },
    thumbnail: { width: '50px', height: '50px', borderRadius: '8px', objectFit: 'cover', border: '1px solid #e2e8f0' },
    catBadge: { background: '#f1f5f9', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', color: '#475569', fontWeight: '800' },
    priceText: { fontWeight: '900', color: '#16a34a', fontSize: '15px' },
    vendorText: { color: '#64748b', fontWeight: '600' },
    delBtn: { border: 'none', background: '#fee2e2', color: '#ef4444', cursor: 'pointer', padding: '8px', borderRadius: '8px' },

    // 📱 Mobile Card Styles
    cardGrid: { display: 'flex', flexDirection: 'column', gap: '12px' },
    productCard: { background: '#fff', borderRadius: '12px', padding: '12px', display: 'flex', gap: '15px', border: '1px solid #e2e8f0', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' },
    mobileThumb: { width: '80px', height: '80px', borderRadius: '10px', objectFit: 'cover', background: '#f8fafc' },
    cardInfo: { flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' },
    cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
    cardName: { fontWeight: '800', fontSize: '15px', color: '#0f172a', lineHeight: '1.2' },
    cardMeta: { display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '5px' },
    metaItem: { display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: '#64748b' },
    cardPrice: { fontSize: '16px', fontWeight: '900', color: '#10b981', marginTop: '5px' },
    delBtnMobile: { background: '#fee2e2', color: '#ef4444', border: 'none', padding: '6px', borderRadius: '6px' }
};

export default AdminProductList;