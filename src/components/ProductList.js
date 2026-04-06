import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Trash2, Edit, X, Save, Star, Layers } from 'lucide-react'; 
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

            const fetchedData = Array.isArray(res.data) ? res.data : (res.data.products || []);
            setProducts(fetchedData);
        } catch (err) { 
            console.error("Fetch Error:", err); 
            toast.error("Failed to sync vendor inventory");
        }
    };

    useEffect(() => { fetchProducts(); }, []);

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
        if (!window.confirm(`Permanently remove ${name} from shop?`)) return;
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
        <div style={styles.grid}>
            {products.map((item) => {
                // ☁️ SMART IMAGE LOGIC
               // ☁️ SMART IMAGE LOGIC
                const imageUrl = item.image_url?.startsWith('http') 
                    ? item.image_url 
                    // 🚀 FIX: Point to the live Render Backend!
                    : `https://bhavyams-vendorhub-backend.onrender.com${item.image_url}`;
                // 📸 GALLERY COUNT LOGIC
                let galleryCount = 0;
                try {
                    if (item.gallery) {
                        const parsed = JSON.parse(item.gallery);
                        galleryCount = Array.isArray(parsed) ? parsed.length : 0;
                    }
                } catch (e) { galleryCount = 0; }

                return (
                    <div key={item.id} style={styles.card}>
                        {editingProduct === item.id ? (
                            <form onSubmit={handleUpdate} style={styles.editForm}>
                                <input style={styles.editInput} value={editData.name} onChange={(e) => setEditData({...editData, name: e.target.value})} />
                                <input style={styles.editInput} type="number" value={editData.price} onChange={(e) => setEditData({...editData, price: e.target.value})} />
                                <input style={styles.editInput} type="number" value={editData.stock_count} onChange={(e) => setEditData({...editData, stock_count: e.target.value})} />
                                <div style={{display: 'flex', gap: '5px'}}>
                                    <button type="submit" style={styles.saveBtn}><Save size={14}/> Save</button>
                                    <button onClick={() => setEditingProduct(null)} style={styles.cancelBtn}><X size={14}/></button>
                                </div>
                            </form>
                        ) : (
                            <>
                                <div style={styles.actions}>
                                    <button onClick={() => startEdit(item)} style={styles.editBtn}><Edit size={12}/></button>
                                    <button onClick={() => handleDelete(item.id, item.name)} style={styles.deleteBtn}><Trash2 size={12}/></button>
                                </div>

                                {/* 🖼️ IMAGE BOX WITH GALLERY OVERLAY */}
                                <div style={styles.imageBox}>
                                    <img src={imageUrl} style={styles.image} alt="product" />
                                    {galleryCount > 1 && (
                                        <div style={styles.galleryBadge}>
                                            <Layers size={10} /> {galleryCount} Photos
                                        </div>
                                    )}
                                </div>

                                <div style={styles.info}>
                                    <h4 style={styles.pName}>{item.name}</h4>
                                    
                                    <div style={styles.ratingRow}>
                                        {[...Array(5)].map((_, i) => {
                                            const ratingValue = Number(item.average_rating) || 0;
                                            return (
                                                <Star 
                                                    key={i} 
                                                    size={10} 
                                                    fill={i < Math.round(ratingValue) ? "#ffb703" : "none"} 
                                                    color={i < Math.round(ratingValue) ? "#ffb703" : "#cbd5e1"} 
                                                />
                                            );
                                        })}
                                        <span style={styles.reviewCount}>({item.total_reviews || 0})</span>
                                    </div>

                                    <p style={styles.price}>₹{item.price}</p>
                                    <div style={styles.stockStatus}>
                                        Stock: <span style={{color: item.stock_count > 0 ? '#10b981' : '#ef4444', fontWeight: 'bold'}}>{item.stock_count}</span>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

const styles = {
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' },
    card: { background: '#fff', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e2e8f0', position: 'relative', transition: '0.2s' },
    actions: { position: 'absolute', top: '8px', right: '8px', display: 'flex', gap: '4px', zIndex: 10 },
    editBtn: { background: '#2874f0', color: '#fff', border: 'none', borderRadius: '4px', padding: '4px', cursor: 'pointer' },
    deleteBtn: { background: '#ef4444', color: '#fff', border: 'none', borderRadius: '4px', padding: '4px', cursor: 'pointer' },
    imageBox: { position: 'relative', height: '140px', background: '#f8fafc' },
    image: { width: '100%', height: '100%', objectFit: 'contain' },
    galleryBadge: { position: 'absolute', bottom: '5px', left: '5px', background: 'rgba(0,0,0,0.6)', color: '#fff', padding: '2px 6px', borderRadius: '4px', fontSize: '9px', display: 'flex', alignItems: 'center', gap: '4px' },
    info: { padding: '12px' },
    pName: { margin: '0 0 4px 0', fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
    ratingRow: { display: 'flex', alignItems: 'center', gap: '1px', marginBottom: '8px' },
    reviewCount: { fontSize: '10px', color: '#94a3b8', marginLeft: '4px' },
    price: { color: '#2874f0', fontSize: '16px', fontWeight: '900', margin: '0 0 4px 0' },
    stockStatus: { fontSize: '11px', color: '#64748b' },
    editForm: { padding: '10px', display: 'flex', flexDirection: 'column', gap: '8px' },
    editInput: { padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '12px', outline: 'none' },
    saveBtn: { background: '#10b981', color: '#fff', border: 'none', padding: '6px', borderRadius: '4px', flex: 1, cursor: 'pointer', fontWeight: 'bold' },
    cancelBtn: { background: '#94a3b8', color: '#fff', border: 'none', padding: '6px', borderRadius: '4px', cursor: 'pointer' }
};

export default ProductList;