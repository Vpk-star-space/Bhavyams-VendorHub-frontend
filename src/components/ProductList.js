import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Trash2, Edit, X, Save, Star, Layers, Package } from 'lucide-react'; 
import { toast } from 'react-toastify';

const ProductList = () => {
    const [products, setProducts] = useState([]);
    const [editingProduct, setEditingProduct] = useState(null);
    const [editData, setEditData] = useState({});
    const [ setIsMobile] = useState(window.innerWidth < 640);

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
        <div style={styles.container}>
            {products.length === 0 ? (
                <div style={styles.emptyState}>
                    <Package size={48} color="#cbd5e1" />
                    <p>No products listed yet.</p>
                </div>
            ) : (
                <div style={styles.grid}>
                    {products.map((item) => {
                        const imageUrl = item.image_url?.startsWith('http') 
                            ? item.image_url 
                            : `https://bhavyams-vendorhub-backend.onrender.com${item.image_url}`;
                        
                        let galleryCount = 0;
                        try {
                            if (item.gallery) {
                                const parsed = typeof item.gallery === 'string' ? JSON.parse(item.gallery) : item.gallery;
                                galleryCount = Array.isArray(parsed) ? parsed.length : 0;
                            }
                        } catch (e) { galleryCount = 0; }

                        return (
                            <div key={item.id} style={styles.card}>
                                {editingProduct === item.id ? (
                                    <form onSubmit={handleUpdate} style={styles.editForm}>
                                        <label style={styles.editLabel}>Product Name</label>
                                        <input style={styles.editInput} value={editData.name} onChange={(e) => setEditData({...editData, name: e.target.value})} />
                                        <label style={styles.editLabel}>Price (₹)</label>
                                        <input style={styles.editInput} type="number" value={editData.price} onChange={(e) => setEditData({...editData, price: e.target.value})} />
                                        <label style={styles.editLabel}>Stock Count</label>
                                        <input style={styles.editInput} type="number" value={editData.stock_count} onChange={(e) => setEditData({...editData, stock_count: e.target.value})} />
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
                                                src={imageUrl} 
                                                style={styles.image} 
                                                alt="product" 
                                                onError={(e) => { e.target.src = 'https://via.placeholder.com/150?text=Bhavyams'; }}
                                            />
                                            {galleryCount > 1 && (
                                                <div style={styles.galleryBadge}>
                                                    <Layers size={10} /> {galleryCount}
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
                                                            size={12} 
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
            )}
        </div>
    );
};

const styles = {
    container: { width: '100%' },
    emptyState: { textAlign: 'center', padding: '50px 20px', color: '#64748b' },
    grid: { 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', 
        gap: '12px',
        '@media (min-width: 640px)': {
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
            gap: '16px'
        }
    },
    card: { background: '#fff', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2e8f0', position: 'relative', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' },
    actions: { position: 'absolute', top: '8px', right: '8px', display: 'flex', gap: '6px', zIndex: 10 },
    editBtn: { background: 'rgba(40, 116, 240, 0.9)', color: '#fff', border: 'none', borderRadius: '6px', padding: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    deleteBtn: { background: 'rgba(239, 68, 68, 0.9)', color: '#fff', border: 'none', borderRadius: '6px', padding: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    imageBox: { position: 'relative', height: '150px', background: '#f8fafc', padding: '10px' },
    image: { width: '100%', height: '100%', objectFit: 'contain' },
    galleryBadge: { position: 'absolute', bottom: '8px', left: '8px', background: 'rgba(15, 23, 42, 0.75)', color: '#fff', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', display: 'flex', alignItems: 'center', gap: '4px' },
    info: { padding: '12px' },
    pName: { margin: '0 0 6px 0', fontSize: '14px', fontWeight: '600', color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
    ratingRow: { display: 'flex', alignItems: 'center', gap: '2px', marginBottom: '8px' },
    reviewCount: { fontSize: '11px', color: '#94a3b8', marginLeft: '4px' },
    price: { color: '#2874f0', fontSize: '16px', fontWeight: '800', margin: '0 0 6px 0' },
    stockStatus: { fontSize: '12px', color: '#64748b' },
    editForm: { padding: '15px', display: 'flex', flexDirection: 'column', gap: '6px' },
    editLabel: { fontSize: '10px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase' },
    editInput: { padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none', width: '100%', boxSizing: 'border-box' },
    saveBtn: { background: '#10b981', color: '#fff', border: 'none', padding: '10px', borderRadius: '6px', flex: 1, cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' },
    cancelBtn: { background: '#94a3b8', color: '#fff', border: 'none', padding: '10px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }
};

export default ProductList;