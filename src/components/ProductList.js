import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Trash2, Edit, X, Save,  Package } from 'lucide-react'; 
import { toast } from 'react-toastify';

const ProductList = () => {
    const [products, setProducts] = useState([]);
    const [editingProduct, setEditingProduct] = useState(null);
    const [editData, setEditData] = useState({});
    // 🚀 FIXED: Corrected state declaration
    const [setIsMobile] = useState(window.innerWidth < 640);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 640);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, );

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

    useEffect(() => { fetchProducts(); }, []);

    // ... (startEdit, handleUpdate, handleDelete stay the same) ...
    const startEdit = (product) => {
        setEditingProduct(product.id);
        setEditData(product);
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            await axios.put(`https://bhavyams-vendorhub-backend.onrender.com/api/products/update/${editingProduct}`, editData, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            toast.success("Inventory Updated!");
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
                        // 🚀 CLEAN IMAGE LOGIC
                        let imageUrl = item.image_url;
                        if (imageUrl && !imageUrl.startsWith('http')) {
                            imageUrl = `https://bhavyams-vendorhub-backend.onrender.com${imageUrl}`;
                        }
                        
                        return (
                            <div key={item.id} style={styles.card}>
                                {editingProduct === item.id ? (
                                    <form onSubmit={handleUpdate} style={styles.editForm}>
                                        <label style={styles.editLabel}>Name</label>
                                        <input style={styles.editInput} value={editData.name} onChange={(e) => setEditData({...editData, name: e.target.value})} />
                                        <label style={styles.editLabel}>Price</label>
                                        <input style={styles.editInput} type="number" value={editData.price} onChange={(e) => setEditData({...editData, price: e.target.value})} />
                                        <div style={{display: 'flex', gap: '8px', marginTop: '10px'}}>
                                            <button type="submit" style={styles.saveBtn}><Save size={14}/> Save</button>
                                            <button type="button" onClick={() => setEditingProduct(null)} style={styles.cancelBtn}><X size={14}/></button>
                                        </div>
                                    </form>
                                ) : (
                                    <>
                                        <div style={styles.actions}>
                                            <button onClick={() => startEdit(item)} style={styles.editBtn}><Edit size={14}/></button>
                                            <button onClick={() => handleDelete(item.id, item.name)} style={styles.deleteBtn}><Trash2 size={14}/></button>
                                        </div>
                                        <div style={styles.imageBox}>
                                            <img 
                                                src={imageUrl || 'https://via.placeholder.com/150?text=No+Image'} 
                                                style={styles.image} 
                                                alt={item.name} 
                                                onError={(e) => { e.target.src = 'https://via.placeholder.com/150?text=Error+Loading'; }}
                                            />
                                        </div>
                                        <div style={styles.info}>
                                            <h4 style={styles.pName}>{item.name}</h4>
                                            <p style={styles.price}>₹{item.price}</p>
                                            <div style={styles.stockStatus}>
                                                Stock: <span style={{color: item.stock_count > 0 ? '#10b981' : '#ef4444'}}>{item.stock_count}</span>
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

// ... styles stay exactly the same ...
const styles = {
    container: { width: '100%' },
    emptyState: { textAlign: 'center', padding: '50px 20px', color: '#64748b' },
    grid: { 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', 
        gap: '12px'
    },
    card: { background: '#fff', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2e8f0', position: 'relative' },
    actions: { position: 'absolute', top: '8px', right: '8px', display: 'flex', gap: '6px', zIndex: 10 },
    editBtn: { background: 'rgba(40, 116, 240, 0.9)', color: '#fff', border: 'none', borderRadius: '6px', padding: '6px', cursor: 'pointer' },
    deleteBtn: { background: 'rgba(239, 68, 68, 0.9)', color: '#fff', border: 'none', borderRadius: '6px', padding: '6px', cursor: 'pointer' },
    imageBox: { height: '150px', background: '#f8fafc', padding: '10px' },
    image: { width: '100%', height: '100%', objectFit: 'contain' },
    info: { padding: '12px' },
    pName: { margin: '0 0 6px 0', fontSize: '14px', fontWeight: '600' },
    price: { color: '#2874f0', fontSize: '16px', fontWeight: '800', margin: '0' },
    stockStatus: { fontSize: '12px', color: '#64748b' },
    editForm: { padding: '15px', display: 'flex', flexDirection: 'column', gap: '6px' },
    editLabel: { fontSize: '10px', fontWeight: 'bold' },
    editInput: { padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1' },
    saveBtn: { background: '#10b981', color: '#fff', border: 'none', padding: '8px', borderRadius: '4px', flex: 1, cursor: 'pointer' },
    cancelBtn: { background: '#94a3b8', color: '#fff', border: 'none', padding: '8px', borderRadius: '4px', cursor: 'pointer' }
};

export default ProductList;