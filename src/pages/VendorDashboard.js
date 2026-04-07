import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { DollarSign, Package, ShoppingBag, TrendingUp, Edit3, Save, X } from 'lucide-react';
import { toast } from 'react-toastify';

const VendorDashboard = () => {
    const [stats, setStats] = useState({ revenue: 0, orders: 0, products: 0 });
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState(null);
    const [editStock, setEditStock] = useState("");

    const token = localStorage.getItem('token');

    const fetchData = useCallback(async () => {
        if (!token) return;
        try {
            const statsRes = await axios.get('https://bhavyams-vendorhub-backend.onrender.com/api/products/vendor/stats', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStats({
                revenue: statsRes.data.revenue || 0,
                orders: statsRes.data.orders || 0,
                products: statsRes.data.products || 0
            });

            const productsRes = await axios.get('https://bhavyams-vendorhub-backend.onrender.com/api/products/vendor/my-products', {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            // 🛡️ CRASH PROTECTION: Ensure it's an array
            const fetchedProducts = Array.isArray(productsRes.data) ? productsRes.data : [];
            setProducts(fetchedProducts);
            
        } catch (err) {
            console.error("Dashboard Stats Error:", err);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleUpdateStock = async (product) => {
        try {
            await axios.put(
                `https://bhavyams-vendorhub-backend.onrender.com/api/products/update/${product.id}`,
                { 
                    name: product.name,
                    price: product.price,
                    description: product.description || "Product details", 
                    category: product.category || "General",
                    stock_count: Number(editStock) 
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success("Stock updated successfully!");
            setEditingId(null);
            fetchData(); 
        } catch (err) {
            toast.error("Failed to update stock");
        }
    };

    if (loading) return <div style={styles.loader}>Fetching your business stats...</div>;

    return (
        <div style={styles.container}>
            <div style={styles.headerRow}>
                <h2 style={styles.title}>Business Overview</h2>
                <div style={styles.liveBadge}><TrendingUp size={14}/> LIVE STATS</div>
            </div>
            
            <div style={styles.grid}>
                <div style={{ ...styles.card, borderLeft: '5px solid #10b981' }}>
                    <div style={styles.iconCircle}><DollarSign color="#10b981" size={20}/></div>
                    <p style={styles.label}>Revenue</p>
                    <h3 style={styles.value}>₹{Number(stats.revenue).toLocaleString('en-IN')}</h3>
                </div>
                <div style={{ ...styles.card, borderLeft: '5px solid #3b82f6' }}>
                    <div style={styles.iconCircle}><ShoppingBag color="#3b82f6" size={20}/></div>
                    <p style={styles.label}>Orders</p>
                    <h3 style={styles.value}>{stats.orders}</h3>
                </div>
                <div style={{ ...styles.card, borderLeft: '5px solid #8b5cf6' }}>
                    <div style={styles.iconCircle}><Package color="#8b5cf6" size={20}/></div>
                    <p style={styles.label}>Total Items</p>
                    <h3 style={styles.value}>{stats.products}</h3>
                </div>
            </div>

            <div style={styles.inventorySection}>
                <h3 style={styles.subTitle}>Manage Inventory</h3>
                {/* 🚀 CRITICAL FIX: Changed overflow to 'auto' so it scrolls horizontally on mobile! */}
                <div style={styles.tableWrapper}>
                    <table style={styles.table}>
                        <thead>
                            <tr style={styles.thr}>
                                <th style={styles.th}>Image</th>
                                <th style={styles.th}>Product</th>
                                <th style={styles.th}>Current Stock</th>
                                <th style={styles.th}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.length === 0 ? (
                                <tr><td colSpan="4" style={{textAlign:'center', padding:'20px'}}>No products found.</td></tr>
                            ) : (
                                products.map(prod => {
                                    const currentStock = prod.stock_count ?? prod.stock ?? 0;
                                    
                                    // 🖼️ FIX: Safe Image Loading
                                    const rawUrl = prod.image_url || '';
                                    const cleanUrl = rawUrl.replace(/["\\]/g, ''); 
                                    const imageSrc = cleanUrl 
                                        ? (cleanUrl.startsWith('http') ? cleanUrl : `https://bhavyams-vendorhub-backend.onrender.com${cleanUrl.startsWith('/') ? '' : '/'}${cleanUrl}`)
                                        : 'https://via.placeholder.com/80?text=No+Image';

                                    return (
                                        <tr key={prod.id} style={styles.tr}>
                                            <td style={styles.td}>
                                                <img src={imageSrc} alt="product" style={{width: '40px', height: '40px', objectFit: 'contain', borderRadius: '4px'}} onError={(e) => { e.target.src = 'https://via.placeholder.com/40?text=Img'; }} />
                                            </td>
                                            <td style={styles.td}>
                                                <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '150px' }}>
                                                    {prod.name}
                                                </div>
                                            </td>
                                            <td style={styles.td}>
                                                {editingId === prod.id ? (
                                                    <input 
                                                        type="number" 
                                                        value={editStock} 
                                                        onChange={(e) => setEditStock(e.target.value)}
                                                        style={styles.stockInput}
                                                        autoFocus
                                                    />
                                                ) : (
                                                    <span style={{color: currentStock < 5 ? 'red' : 'inherit', fontWeight: 'bold'}}>
                                                        {currentStock}
                                                    </span>
                                                )}
                                            </td>
                                            <td style={styles.td}>
                                                {editingId === prod.id ? (
                                                    <div style={{display:'flex', gap:'5px'}}>
                                                        <button onClick={() => handleUpdateStock(prod)} style={styles.saveBtn}><Save size={14}/></button>
                                                        <button onClick={() => setEditingId(null)} style={styles.cancelBtn}><X size={14}/></button>
                                                    </div>
                                                ) : (
                                                    <button onClick={() => { setEditingId(prod.id); setEditStock(currentStock); }} style={styles.editBtn}>
                                                        <Edit3 size={14}/> Edit
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const styles = {
    container: { padding: '15px', background: '#f8fafc', minHeight: '100vh' },
    headerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
    title: { fontSize: '20px', fontWeight: '900', color: '#0f172a', margin: 0 },
    subTitle: { fontSize: '18px', fontWeight: '800', margin: '30px 0 15px' },
    liveBadge: { background: '#dcfce7', color: '#166534', padding: '4px 10px', borderRadius: '20px', fontSize: '10px', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '5px' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '15px' },
    card: { background: '#fff', padding: '20px', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', alignItems: 'center' },
    iconCircle: { background: '#f8fafc', padding: '10px', borderRadius: '50%', marginBottom: '10px' },
    label: { fontSize: '11px', fontWeight: '800', color: '#64748b', margin: '0 0 5px', textTransform: 'uppercase' },
    value: { fontSize: '22px', fontWeight: '900', color: '#1e293b' },
    inventorySection: { marginTop: '20px' },
    // 🚀 CRITICAL FIX: overflowX 'auto' allows horizontal scrolling on mobile!
    tableWrapper: { background: '#fff', borderRadius: '12px', overflowX: 'auto', border: '1px solid #f1f5f9', WebkitOverflowScrolling: 'touch' },
    table: { width: '100%', borderCollapse: 'collapse', fontSize: '14px', minWidth: '400px' },
    thr: { background: '#f8fafc' },
    th: { textAlign: 'left', padding: '12px', color: '#64748b', whiteSpace: 'nowrap' },
    td: { padding: '12px', borderTop: '1px solid #f1f5f9', verticalAlign: 'middle' },
    stockInput: { width: '60px', padding: '4px', border: '1px solid #cbd5e1', borderRadius: '4px' },
    editBtn: { background: '#f1f5f9', border: 'none', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 'bold' },
    saveBtn: { background: '#10b981', color: '#fff', border: 'none', padding: '6px', borderRadius: '4px', cursor: 'pointer' },
    cancelBtn: { background: '#ef4444', color: '#fff', border: 'none', padding: '6px', borderRadius: '4px', cursor: 'pointer' },
    loader: { textAlign: 'center', padding: '40px', fontWeight: 'bold' }
};

export default VendorDashboard;