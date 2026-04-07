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

    // 🚀 Wrapped in useCallback so it doesn't cause loops
    const fetchData = useCallback(async () => {
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
            setProducts(productsRes.data);
        } catch (err) {
            console.error("Dashboard Error:", err);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchData();
    }, [fetchData]); // ✅ Fixed: Added proper dependency

    const handleUpdateStock = async (product) => {
        try {
            await axios.put(
                `https://bhavyams-vendorhub-backend.onrender.com/api/products/update/${product.id}`,
                { 
                    ...product, 
                    stock_count: Number(editStock) 
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success("Stock updated!");
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
                <div style={styles.tableWrapper}>
                    <table style={styles.table}>
                        <thead>
                            <tr style={styles.thr}>
                                <th style={styles.th}>Product</th>
                                <th style={styles.th}>Current Stock</th>
                                <th style={styles.th}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.map(prod => (
                                <tr key={prod.id} style={styles.tr}>
                                    <td style={styles.td}>{prod.name}</td>
                                    <td style={styles.td}>
                                        {editingId === prod.id ? (
                                            <input 
                                                type="number" 
                                                value={editStock} 
                                                onChange={(e) => setEditStock(e.target.value)}
                                                style={styles.stockInput}
                                            />
                                        ) : (
                                            <span style={{color: prod.stock_count < 5 ? 'red' : 'inherit', fontWeight: 'bold'}}>
                                                {prod.stock_count}
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
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const styles = {
    container: { padding: '15px' },
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
    tableWrapper: { background: '#fff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' },
    table: { width: '100%', borderCollapse: 'collapse', fontSize: '14px' },
    th: { textAlign: 'left', padding: '12px', background: '#f8fafc', color: '#64748b' },
    td: { padding: '12px', borderTop: '1px solid #f1f5f9' },
    stockInput: { width: '60px', padding: '4px', border: '1px solid #cbd5e1' },
    editBtn: { background: '#f1f5f9', border: 'none', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer' },
    saveBtn: { background: '#10b981', color: '#fff', border: 'none', padding: '6px', borderRadius: '4px' },
    cancelBtn: { background: '#ef4444', color: '#fff', border: 'none', padding: '6px', borderRadius: '4px' },
    loader: { textAlign: 'center', padding: '40px' }
};

export default VendorDashboard;