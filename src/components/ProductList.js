import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { Trash2, Edit, Package, X, Save } from 'lucide-react'; 
import { toast } from 'react-toastify';
import { AppContext } from '../context/AppContext';
import { BACKEND_URL } from '../config/api';

const translations = {
    en: {
        empty: "No products listed yet.",
        stock: "Stock:",
        outOfStock: "(Out of stock)",
        editTitle: "Edit Product",
        nameLabel: "Product Name",
        priceLabel: "Price (₹)",
        stockLabel: "Stock Count",
        saveBtn: "Save Changes",
        cancelBtn: "Cancel",
        deleteConfirm: "Permanently remove this item?"
    },
    te: {
        empty: "ఇంకా ఉత్పత్తులు జాబితా చేయబడలేదు.",
        stock: "స్టాక్:",
        outOfStock: "(స్టాక్ లేదు)",
        editTitle: "ఉత్పత్తిని సవరించండి",
        nameLabel: "ఉత్పత్తి పేరు",
        priceLabel: "ధర (₹)",
        stockLabel: "స్టాక్ కౌంట్",
        saveBtn: "సేవ్ చేయండి",
        cancelBtn: "రద్దు చేయండి",
        deleteConfirm: "ఈ వస్తువును శాశ్వతంగా తొలగించాలా?"
    }
};

const ProductList = () => {
    const { language } = useContext(AppContext);
    const lang = language === 'te' ? 'te' : 'en';
    const t = translations[lang];

    const [products, setProducts] = useState([]);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editData, setEditData] = useState({});

    const fetchProducts = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${BACKEND_URL}/products/my-products`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setProducts(res.data || []);
        } catch (err) { 
            console.error("Fetch Error:", err); 
        }
    };

    useEffect(() => { 
        fetchProducts(); 
    }, []);

    const openEditModal = (product) => {
        setEditData({
            ...product,
            stock_count: product.stock_count ?? product.stock ?? 0 
        });
        setIsEditModalOpen(true);
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const payload = {
                name: editData.name,
                price: Number(editData.price),
                stock: Number(editData.stock_count),
                stock_count: Number(editData.stock_count),
                description: editData.description || "",
                mrp: editData.mrp || null,
                unit_value: editData.unit_value || '1',
                unit_type: editData.unit_type || 'Piece'
            };

            await axios.put(`${BACKEND_URL}/products/update/${editData.id}`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success("✅ Updated Successfully!");
            setIsEditModalOpen(false);
            fetchProducts();
        } catch (err) {
            toast.error("Update failed");
        }
    };

    const handleDelete = async (id, name) => {
        if (!window.confirm(`${t.deleteConfirm}\n\n${name}`)) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${BACKEND_URL}/products/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success("🗑️ Item deleted!");
            fetchProducts();
        } catch (err) { toast.error("Delete failed"); }
    };

    return (
        <div style={styles.container}>
            {products.length === 0 ? (
                <div style={styles.emptyState}>
                    <Package size={48} color="#cbd5e1" />
                    <p>{t.empty}</p>
                </div>
            ) : (
                <div style={styles.grid}>
                    {products.map((item) => {
                        let rawUrl = item.image_url || '';
                        let cleanUrl = rawUrl.replace(/["\\]/g, ''); 
                        let imageUrl = cleanUrl 
                            ? (cleanUrl.startsWith('http') ? cleanUrl : `${BACKEND_URL.replace('/api', '')}${cleanUrl.startsWith('/') ? '' : '/'}${cleanUrl}`)
                            : 'https://via.placeholder.com/150?text=No+Image';
                        
                        const currentStock = item.stock_count ?? item.stock ?? 0;

                        return (
                            <div key={item.id} style={styles.card}>
                                <div style={styles.actions}>
                                    <button onClick={() => openEditModal(item)} style={styles.editBtn}><Edit size={15}/></button>
                                    <button onClick={() => handleDelete(item.id, item.name)} style={styles.deleteBtn}><Trash2 size={15}/></button>
                                </div>
                                
                                <div style={styles.imageBox}>
                                    <img 
                                        src={imageUrl} 
                                        style={styles.image} 
                                        alt={item.name} 
                                        onError={(e) => { e.target.src = 'https://via.placeholder.com/150?text=No+Image'; }}
                                    />
                                </div>
                                <div style={styles.info}>
                                    <h4 style={styles.pName}>{item.name}</h4>
                                    <p style={styles.price}>₹{Number(item.price).toLocaleString('en-IN')}</p>
                                    <div style={styles.stockStatus}>
                                        {t.stock} <span style={{fontWeight: 'bold', color: currentStock > 0 ? '#10b981' : '#ef4444'}}>{currentStock}</span>
                                        {currentStock <= 0 && <span style={{marginLeft: '5px', fontSize: '10px', color: '#ef4444'}}>{t.outOfStock}</span>}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {isEditModalOpen && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modalContent}>
                        <div style={styles.modalHeader}>
                            <h3 style={{margin: 0, color: '#0f172a'}}>{t.editTitle}</h3>
                            <button onClick={() => setIsEditModalOpen(false)} style={styles.closeModalBtn}><X size={20}/></button>
                        </div>
                        
                        <form onSubmit={handleUpdate} style={styles.editForm}>
                            <label style={styles.editLabel}>{t.nameLabel}</label>
                            <input style={styles.editInput} value={editData.name} onChange={(e) => setEditData({...editData, name: e.target.value})} required/>
                            
                            <label style={styles.editLabel}>{t.priceLabel}</label>
                            <input style={styles.editInput} type="number" value={editData.price} onChange={(e) => setEditData({...editData, price: e.target.value})} required/>
                            
                            <label style={styles.editLabel}>{t.stockLabel}</label>
                            <input style={styles.editInput} type="number" value={editData.stock_count} onChange={(e) => setEditData({...editData, stock_count: e.target.value})} required/>
                            
                            <div style={{display: 'flex', gap: '10px', marginTop: '15px'}}>
                                <button type="button" onClick={() => setIsEditModalOpen(false)} style={styles.cancelBtn}>{t.cancelBtn}</button>
                                <button type="submit" style={styles.saveBtn}><Save size={16}/> {t.saveBtn}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

const styles = {
    container: { width: '100%' },
    emptyState: { textAlign: 'center', padding: '40px 20px', color: '#64748b' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '12px' },
    card: { background: '#fff', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2e8f0', position: 'relative', boxShadow: '0 2px 4px rgba(0,0,0,0.03)' },
    actions: { position: 'absolute', top: '8px', right: '8px', display: 'flex', gap: '6px', zIndex: 10 },
    editBtn: { background: '#2563eb', color: '#fff', border: 'none', borderRadius: '50%', padding: '7px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    deleteBtn: { background: '#ef4444', color: '#fff', border: 'none', borderRadius: '50%', padding: '7px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    imageBox: { height: '140px', background: '#f8fafc', padding: '12px', borderBottom: '1px solid #f1f5f9' },
    image: { width: '100%', height: '100%', objectFit: 'contain' },
    info: { padding: '12px' },
    pName: { margin: '0 0 4px 0', fontSize: '13.5px', fontWeight: '800', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
    price: { color: '#16a34a', fontSize: '15px', fontWeight: '900', margin: '0 0 4px 0' },
    stockStatus: { fontSize: '11.5px', color: '#64748b' },
    modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' },
    modalContent: { background: '#ffffff', width: '100%', maxWidth: '380px', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15)' },
    modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' },
    closeModalBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex' },
    editForm: { padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' },
    editLabel: { fontSize: '11.5px', fontWeight: '800', color: '#475569', textTransform: 'uppercase' },
    editInput: { padding: '11px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', background: '#f8fafc' },
    saveBtn: { background: '#10b981', color: '#fff', border: 'none', padding: '12px', borderRadius: '8px', flex: 1, cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' },
    cancelBtn: { background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', padding: '12px', borderRadius: '8px', flex: 1, cursor: 'pointer', fontWeight: 'bold' }
};

export default ProductList;