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

    // 🚀 Wrapped in useCallback to prevent infinite refresh loops
    const fetchData = useCallback(async () => {
        if (!token) return;
        try {
            // 1. Get Stats (Revenue, Orders, total products)
            const statsRes = await axios.get('https://bhavyams-vendorhub-backend.onrender.com/api/products/vendor/stats', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStats({
                revenue: statsRes.data.revenue || 0,
                orders: statsRes.data.orders || 0,
                products: statsRes.data.products || 0
            });

            // 2. Get Product List for this vendor
            const productsRes = await axios.get('https://bhavyams-vendorhub-backend.onrender.com/api/products/vendor/my-products', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setProducts(productsRes.data);

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
            // Sends update to: /api/products/update/:id
            await axios.put(
                `https://bhavyams-vendorhub-backend.onrender.com/api/products/update/${product.id}`,
                { 
                    ...product, 
                    stock_count: Number(editStock) 
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success("Inventory Updated!");
            setEditingId(null);
            fetchData(); // 🔄 Refresh everything
        } catch (err) {
            toast.error("Stock update failed");
        }
    };

    if (loading) return <div style={styles.loader}>Fetching your business stats...</div>;

    return (
        <div style={styles.container}>
            <div style={styles.headerRow}>
                <h2 style={styles.title}>Business Overview</h2>
                <div style={styles.liveBadge}><TrendingUp size={14}/> LIVE STATS</div>
            </div>
            
            {/* 📦 STATS SECTION */}
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
                    <p style={styles.label}>Inventory Items</p>
                    <h3 style={styles.value}>{stats.products}</h3>
                </div>
            </div>

            {/* 🛠️ MANAGE PRODUCTS SECTION */}
            <div style={styles.inventorySection}>
                <h3 style={styles.subTitle}>Manage Stock Levels</h3>
                <div style={styles.tableWrapper}>
                    <table style={styles.table}>
                        <thead>
                            <tr style={styles.thr}>
                                <th style={styles.th}>Product Name</th>
                                <th style={styles.th}>Stock Count</th>
                                <th style={styles.th}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.length === 0 ? (
                                <tr><td colSpan="3" style={{textAlign:'center', padding:'20px'}}>No products found.</td></tr>
                            ) : (
                                products.map(prod => (
                                    <tr key={prod.id} style={styles.tr}>
                                        <td style={styles.td}>{prod.name}</td>
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
                                                <span style={{
                                                    color: Number(prod.stock_count) <= 0 ? '#ef4444' : 'inherit', 
                                                    fontWeight: 'bold'
                                                }}>
                                                    {prod.stock_count} {Number(prod.stock_count) <= 0 && "(Out of Stock)"}
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
                                                <button onClick={() => { setEditingId(prod.id); setEditStock(prod.stock_count); }} style={styles.editBtn}>
                                                    <Edit3 size={14}/> Edit Stock
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
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
    title: { fontSize: '22px', fontWeight: '900', color: '#0f172a', margin: 0 },
    subTitle: { fontSize: '18px', fontWeight: '800', margin: '35px 0 15px', color: '#1e293b' },
    liveBadge: { background: '#dcfce7', color: '#166534', padding: '4px 10px', borderRadius: '20px', fontSize: '10px', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '5px' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' },
    card: { background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', alignItems: 'center' },
    iconCircle: { background: '#f1f5f9', padding: '10px', borderRadius: '50%', marginBottom: '10px' },
    label: { fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: '5px' },
    value: { fontSize: '24px', fontWeight: '900', color: '#0f172a', margin: 0 },
    inventorySection: { marginTop: '10px' },
    tableWrapper: { background: '#fff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' },
    table: { width: '100%', borderCollapse: 'collapse', fontSize: '14px' },
    thr: { background: '#f8fafc' },
    th: { textAlign: 'left', padding: '15px', color: '#475569', fontWeight: '700', borderBottom: '2px solid #f1f5f9' },
    td: { padding: '15px', borderBottom: '1px solid #f1f5f9', verticalAlign: 'middle' },
    stockInput: { width: '70px', padding: '6px', borderRadius: '4px', border: '2px solid #2874f0', textAlign: 'center', fontWeight: 'bold' },
    editBtn: { background: '#f1f5f9', border: 'none', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 'bold', color: '#475569' },
    saveBtn: { background: '#10b981', color: '#fff', border: 'none', padding: '8px', borderRadius: '6px', cursor: 'pointer' },
    cancelBtn: { background: '#ef4444', color: '#fff', border: 'none', padding: '8px', borderRadius: '6px', cursor: 'pointer' },
    loader: { textAlign: 'center', padding: '100px', color: '#64748b', fontWeight: 'bold' }
};

export default VendorDashboard;