import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Trash2, Edit, X, Save, Package } from 'lucide-react'; 
import { toast } from 'react-toastify';

const ProductList = () => {
    const [products, setProducts] = useState([]);
    const [editingProduct, setEditingProduct] = useState(null);
    const [editData, setEditData] = useState({});

    const fetchProducts = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('https://bhavyams-vendorhub-backend.onrender.com/api/products/my-products', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setProducts(res.data);
        } catch (err) { 
            console.error("Fetch Error:", err); 
            toast.error("Failed to load products");
        }
    };

    useEffect(() => { 
        fetchProducts(); 
    }, []);

    const startEdit = (product) => {
        setEditingProduct(product.id);
        setEditData({
            ...product,
            // 🚀 FIX: Safely grab the current stock so it populates the form
            stock_count: product.stock_count ?? product.stock ?? 0 
        });
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            
            // 🚀 FIX: Ensure numbers are sent to the database correctly
            const payload = {
                name: editData.name,
                price: Number(editData.price),
                stock_count: Number(editData.stock_count),
                description: editData.description || "Product description",
                category: editData.category || "General"
            };

            await axios.put(`https://bhavyams-vendorhub-backend.onrender.com/api/products/update/${editingProduct}`, payload, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            toast.success("Inventory Updated Successfully!");
            setEditingProduct(null);
            fetchProducts();
        } catch (err) {
            toast.error("Update failed");
        }
    };

    const handleDelete = async (id, name) => {
        if (!window.confirm(`Permanently remove ${name}?`)) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`https://bhavyams-vendorhub-backend.onrender.com/api/products/delete/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            toast.success("Product Deleted!");
            fetchProducts();
        } catch (err) { toast.error("Delete failed"); }
    };

    return (
        <div style={styles.container}>
            {products.length === 0 ? (
                <div style={styles.emptyState}>
                    <Package size={48} color="#cbd5e1" />
                    <p>No products listed yet.</p>
                </div>
            ) : (
                <div style={styles.grid}>
                    {products.map((item) => {
                        // 🚀 FIX: Bulletproof Image Logic
                        let rawUrl = item.image_url || '';
                        let cleanUrl = rawUrl.replace(/["\\]/g, ''); 
                        let imageUrl = cleanUrl 
                            ? (cleanUrl.startsWith('http') ? cleanUrl : `https://bhavyams-vendorhub-backend.onrender.com${cleanUrl.startsWith('/') ? '' : '/'}${cleanUrl}`)
                            : 'https://via.placeholder.com/150?text=No+Image';
                        
                        const currentStock = item.stock_count ?? item.stock ?? 0;

                        return (
                            <div key={item.id} style={styles.card}>
                                {editingProduct === item.id ? (
                                    <form onSubmit={handleUpdate} style={styles.editForm}>
                                        <label style={styles.editLabel}>Name</label>
                                        <input style={styles.editInput} value={editData.name} onChange={(e) => setEditData({...editData, name: e.target.value})} required/>
                                        
                                        <label style={styles.editLabel}>Price (₹)</label>
                                        <input style={styles.editInput} type="number" value={editData.price} onChange={(e) => setEditData({...editData, price: e.target.value})} required/>
                                        
                                        {/* 🚀 FIX: ADDED MISSING STOCK INPUT */}
                                        <label style={styles.editLabel}>Stock Count</label>
                                        <input style={styles.editInput} type="number" value={editData.stock_count} onChange={(e) => setEditData({...editData, stock_count: e.target.value})} required/>
                                        
                                        <div style={{display: 'flex', gap: '8px', marginTop: '15px'}}>
                                            <button type="submit" style={styles.saveBtn}><Save size={16}/> Save</button>
                                            <button type="button" onClick={() => setEditingProduct(null)} style={styles.cancelBtn}><X size={16}/></button>
                                        </div>
                                    </form>
                                ) : (
                                    <>
                                        {/* 🚀 FIX: Highly visible action buttons */}
                                        <div style={styles.actions}>
                                            <button onClick={() => startEdit(item)} style={styles.editBtn}><Edit size={16}/></button>
                                            <button onClick={() => handleDelete(item.id, item.name)} style={styles.deleteBtn}><Trash2 size={16}/></button>
                                        </div>
                                        
                                        <div style={styles.imageBox}>
                                            <img 
                                                src={imageUrl} 
                                                style={styles.image} 
                                                alt={item.name} 
                                                onError={(e) => { e.target.src = 'https://via.placeholder.com/150?text=Error'; }}
                                            />
                                        </div>
                                        <div style={styles.info}>
                                            <h4 style={styles.pName}>{item.name}</h4>
                                            <p style={styles.price}>₹{Number(item.price).toLocaleString('en-IN')}</p>
                                            <div style={styles.stockStatus}>
                                                Stock: <span style={{fontWeight: 'bold', color: currentStock > 0 ? '#10b981' : '#ef4444'}}>{currentStock}</span>
                                                {currentStock <= 0 && <span style={{marginLeft: '5px', fontSize: '10px', color: '#ef4444'}}>(Out of stock)</span>}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

const styles = {
    container: { width: '100%' },
    emptyState: { textAlign: 'center', padding: '50px 20px', color: '#64748b' },
    grid: { 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', 
        gap: '15px'
    },
    card: { background: '#fff', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2e8f0', position: 'relative', boxShadow: '0 2px 4px rgba(0,0,0,0.04)' },
    // 🚀 FIX: Placed buttons elegantly at the top right of the image
    actions: { position: 'absolute', top: '10px', right: '10px', display: 'flex', gap: '8px', zIndex: 10 },
    editBtn: { background: '#2874f0', color: '#fff', border: 'none', borderRadius: '50%', padding: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' },
    deleteBtn: { background: '#ef4444', color: '#fff', border: 'none', borderRadius: '50%', padding: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' },
    imageBox: { height: '180px', background: '#f8fafc', padding: '15px', borderBottom: '1px solid #f1f5f9' },
    image: { width: '100%', height: '100%', objectFit: 'contain' },
    info: { padding: '15px' },
    pName: { margin: '0 0 8px 0', fontSize: '16px', fontWeight: '600', color: '#1e293b' },
    price: { color: '#2874f0', fontSize: '18px', fontWeight: '900', margin: '0 0 5px 0' },
    stockStatus: { fontSize: '13px', color: '#64748b', marginTop: '5px' },
    
    // Form Styles
    editForm: { padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px', background: '#f8fafc', height: '100%' },
    editLabel: { fontSize: '12px', fontWeight: '800', color: '#475569', textTransform: 'uppercase' },
    editInput: { padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none' },
    saveBtn: { background: '#10b981', color: '#fff', border: 'none', padding: '10px', borderRadius: '6px', flex: 1, cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' },
    cancelBtn: { background: '#94a3b8', color: '#fff', border: 'none', padding: '10px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }
};

export default ProductList;