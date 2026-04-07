import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { DollarSign, Package, ShoppingBag, Edit3, Trash2, Save, X } from 'lucide-react';
import { toast } from 'react-toastify';

const VendorDashboard = () => {
    const [stats, setStats] = useState({ revenue: 0, orders: 0, products: 0 });
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // State for the edit form
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({ name: "", price: "", stock_count: "" });

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
            setProducts(Array.isArray(productsRes.data) ? productsRes.data : []);
        } catch (err) {
            console.error("Dashboard Stats Error:", err);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleEditClick = (prod) => {
        setEditingId(prod.id);
        setEditForm({
            name: prod.name,
            price: prod.price,
            stock_count: prod.stock_count ?? prod.stock ?? 0
        });
    };

    const handleUpdateProduct = async (product) => {
        try {
            await axios.put(
                `https://bhavyams-vendorhub-backend.onrender.com/api/products/update/${product.id}`,
                { 
                    name: editForm.name,
                    price: Number(editForm.price),
                    description: product.description || "Product details", 
                    category: product.category || "General",
                    stock_count: Number(editForm.stock_count) 
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success("Product updated successfully!");
            setEditingId(null);
            fetchData(); 
        } catch (err) {
            toast.error("Failed to update product");
        }
    };

    const handleDeleteProduct = async (id) => {
        if (!window.confirm("Are you sure you want to delete this product?")) return;
        try {
            await axios.delete(`https://bhavyams-vendorhub-backend.onrender.com/api/products/delete/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success("Product deleted!");
            fetchData();
        } catch (err) {
            toast.error("Failed to delete product");
        }
    };

    if (loading) return <div style={styles.loader}>Fetching your business stats...</div>;

    return (
        <div style={styles.container}>
            
            {/* 📦 STATS GRID (Matches your left side / top view) */}
            <div style={styles.grid}>
                <div style={styles.statCard}>
                    <DollarSign color="#10b981" size={24} style={{marginBottom: '5px'}}/>
                    <p style={styles.statLabel}>REVENUE</p>
                    <h3 style={styles.statValue}>₹{Number(stats.revenue).toLocaleString('en-IN')}</h3>
                </div>
                <div style={styles.statCard}>
                    <ShoppingBag color="#3b82f6" size={24} style={{marginBottom: '5px'}}/>
                    <p style={styles.statLabel}>ORDERS</p>
                    <h3 style={styles.statValue}>{stats.orders}</h3>
                </div>
                <div style={styles.statCard}>
                    <Package color="#f59e0b" size={24} style={{marginBottom: '5px'}}/>
                    <p style={styles.statLabel}>INVENTORY</p>
                    <h3 style={styles.statValue}>{stats.products}</h3>
                </div>
            </div>

            {/* 🛠️ PRODUCT CARDS (Matches your screenshot exactly) */}
            <div style={styles.inventorySection}>
                {products.length === 0 ? (
                    <div style={styles.emptyState}>No products found. Add some!</div>
                ) : (
                    <div style={styles.cardList}>
                        {products.map(prod => {
                            const isEditing = editingId === prod.id;
                            const currentStock = prod.stock_count ?? prod.stock ?? 0;
                            
                            // Safe Image logic
                            const rawUrl = prod.image_url || '';
                            const cleanUrl = rawUrl.replace(/["\\]/g, ''); 
                            const imageSrc = cleanUrl.startsWith('http') ? cleanUrl : `https://bhavyams-vendorhub-backend.onrender.com${cleanUrl.startsWith('/') ? '' : '/'}${cleanUrl}`;

                            // 🟢 EDIT MODE UI
                            if (isEditing) {
                                return (
                                    <div key={prod.id} style={styles.productCard}>
                                        <div style={styles.formGroup}>
                                            <label style={styles.label}>Name</label>
                                            <input 
                                                value={editForm.name} 
                                                onChange={(e) => setEditForm({...editForm, name: e.target.value})} 
                                                style={styles.input}
                                            />
                                        </div>
                                        <div style={styles.formGroup}>
                                            <label style={styles.label}>Price</label>
                                            <input 
                                                type="number"
                                                value={editForm.price} 
                                                onChange={(e) => setEditForm({...editForm, price: e.target.value})} 
                                                style={styles.input}
                                            />
                                        </div>
                                        <div style={styles.formGroup}>
                                            <label style={styles.label}>Stock</label>
                                            <input 
                                                type="number"
                                                value={editForm.stock_count} 
                                                onChange={(e) => setEditForm({...editForm, stock_count: e.target.value})} 
                                                style={styles.input}
                                            />
                                        </div>
                                        <div style={styles.actionButtons}>
                                            <button onClick={() => handleUpdateProduct(prod)} style={styles.saveBtn}>
                                                <Save size={16}/> Save
                                            </button>
                                            <button onClick={() => setEditingId(null)} style={styles.cancelBtn}>
                                                <X size={16}/>
                                            </button>
                                        </div>
                                    </div>
                                );
                            }

                            // 🔴 NORMAL VIEW UI (Matches your Screenshot!)
                            return (
                                <div key={prod.id} style={styles.productCard}>
                                    <div style={styles.cardActions}>
                                        <button onClick={() => handleEditClick(prod)} style={styles.blueBtn}><Edit3 size={16}/></button>
                                        <button onClick={() => handleDeleteProduct(prod.id)} style={styles.redBtn}><Trash2 size={16}/></button>
                                    </div>
                                    
                                    <img src={imageSrc} alt={prod.name} style={styles.cardImage} onError={(e) => { e.target.src = 'https://via.placeholder.com/150?text=No+Image'; }} />
                                    
                                    <div style={styles.cardDetails}>
                                        <h4 style={styles.cardTitle}>{prod.name}</h4>
                                        <p style={styles.cardPrice}>₹{Number(prod.price).toLocaleString('en-IN')}</p>
                                        <p style={{ fontSize: '12px', color: '#64748b', margin: '5px 0' }}>
                                            Stock: <span style={{fontWeight: 'bold', color: currentStock <= 0 ? '#ef4444' : '#10b981'}}>{currentStock}</span>
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

const styles = {
    container: { padding: '15px', background: '#f8fafc', minHeight: '100vh', fontFamily: 'Roboto, sans-serif' },
    
    // Stats Grid
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '15px', marginBottom: '20px' },
    statCard: { background: '#fff', padding: '15px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', alignItems: 'center', border: '1px solid #f1f5f9' },
    statLabel: { fontSize: '10px', fontWeight: '800', color: '#64748b', margin: '5px 0', letterSpacing: '0.5px' },
    statValue: { fontSize: '20px', fontWeight: '900', color: '#1e293b', margin: 0 },
    
    // Product List Area
    inventorySection: { display: 'flex', flexDirection: 'column', gap: '15px' },
    cardList: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '15px' },
    
    // Individual Product Card (Matching Screenshot)
    productCard: { background: '#fff', borderRadius: '12px', padding: '15px', position: 'relative', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' },
    cardActions: { position: 'absolute', top: '15px', right: '15px', display: 'flex', gap: '8px' },
    blueBtn: { background: '#2874f0', color: '#fff', border: 'none', padding: '8px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center' },
    redBtn: { background: '#ef4444', color: '#fff', border: 'none', padding: '8px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center' },
    
    cardImage: { width: '100%', height: '140px', objectFit: 'contain', marginBottom: '15px', marginTop: '30px' },
    cardDetails: { borderTop: '1px solid #f1f5f9', paddingTop: '10px' },
    cardTitle: { margin: '0 0 5px 0', fontSize: '16px', color: '#1e293b' },
    cardPrice: { margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#2874f0' },

    // Edit Form Styles
    formGroup: { marginBottom: '12px' },
    label: { display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#64748b', marginBottom: '4px' },
    input: { width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none' },
    actionButtons: { display: 'flex', gap: '10px', marginTop: '15px' },
    saveBtn: { flex: 1, background: '#10b981', color: '#fff', border: 'none', padding: '10px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' },
    cancelBtn: { background: '#94a3b8', color: '#fff', border: 'none', padding: '10px 15px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center' },
    
    emptyState: { textAlign: 'center', padding: '40px', color: '#94a3b8', fontWeight: 'bold' },
    loader: { textAlign: 'center', padding: '50px', fontWeight: 'bold', color: '#2874f0' }
};

export default VendorDashboard;