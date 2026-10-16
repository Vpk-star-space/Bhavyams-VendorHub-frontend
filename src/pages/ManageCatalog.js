import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, PackagePlus, List, Upload, Trash2, CheckCircle, Search, X, Edit } from 'lucide-react';
import { toast } from 'react-toastify';

const getBackendUrl = () => {
    const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    return isLocal ? 'http://localhost:5000/api' : 'https://bhavyams-vendorhub-backend.onrender.com/api';
};

const ManageCatalog = () => {
    const { id } = useParams(); 
    const navigate = useNavigate();
    
    const [activeTab, setActiveTab] = useState('list'); 
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    const [itemImages, setItemImages] = useState([]);
    const [existingImagePreview, setExistingImagePreview] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editId, setEditId] = useState(null);
    
    const [form, setForm] = useState({
        name: '',
        description: '',
        mrp: '',          
        price: '',        
        stock: '',        
        unit_value: '1',  
        unit_type: 'Piece', 
    });

    const UNIT_OPTIONS = ["Piece", "Kg", "Grams", "Liters", "ml", "Pack", "Plate", "Service", "Hour"];

    useEffect(() => {
        fetchProducts();
    }, [id]);

    const fetchProducts = async () => {
        try {
            const BACKEND_URL = getBackendUrl();
            const res = await axios.get(`${BACKEND_URL}/shops/${id}`);
            setProducts(res.data.products || []);
        } catch (err) {
            console.error("Error fetching products:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);
        if (itemImages.length + files.length > 5) {
            toast.warning("You can upload a maximum of 5 photos per item.");
            return;
        }
        const validFiles = files.filter(file => file.size <= 10 * 1024 * 1024);
        if (validFiles.length < files.length) {
            toast.warning("Some files were over 10MB and skipped.");
        }
        setItemImages([...itemImages, ...validFiles]);
    };

    const removeImage = (indexToRemove) => {
        setItemImages(itemImages.filter((_, index) => index !== indexToRemove));
    };

    const handleEditClick = (product) => {
        setForm({
            name: product.name || '',
            description: product.description || '',
            mrp: product.mrp || '',
            price: product.price || '',
            stock: product.stock_count ?? product.stock ?? '10',
            unit_value: product.unit_value || '1',
            unit_type: product.unit_type || 'Piece'
        });
        setEditId(product.id);
        setExistingImagePreview(product.image_url || null);
        setItemImages([]);
        setActiveTab('add');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.name.trim() || !form.price) {
            return toast.error("Item name and selling price are required.");
        }
        setIsSubmitting(true);

        try {
            const BACKEND_URL = getBackendUrl();
            const token = localStorage.getItem('token');
            
            const formData = new FormData();
            formData.append('vendor_id', id);
            formData.append('name', form.name.trim());
            formData.append('description', form.description.trim());
            formData.append('mrp', form.mrp);
            formData.append('price', form.price);
            formData.append('stock', form.stock || 0);
            formData.append('unit_value', form.unit_value || '1');
            formData.append('unit_type', form.unit_type || 'Piece');
            
            itemImages.forEach(file => {
                formData.append('item_images', file);
            });

            if (editId) {
                await axios.put(`${BACKEND_URL}/products/update/${editId}`, formData, {
                    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
                });
                toast.success("✅ Item updated successfully!");
            } else {
                await axios.post(`${BACKEND_URL}/products/add`, formData, {
                    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
                });
                toast.success("🎉 Item added to your catalog!");
            }
            
            setForm({ name: '', description: '', mrp: '', price: '', stock: '', unit_value: '1', unit_type: 'Piece' });
            setItemImages([]);
            setExistingImagePreview(null);
            setEditId(null);
            setActiveTab('list');
            fetchProducts();

        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || "❌ Failed to save item.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteItem = async (productId) => {
        if (!window.confirm("Delete this item permanently from your catalog?")) return;
        try {
            const BACKEND_URL = getBackendUrl();
            const token = localStorage.getItem('token');
            await axios.delete(`${BACKEND_URL}/products/${productId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.info("🗑️ Item removed from catalog.");
            fetchProducts();
        } catch (err) {
            toast.error("Failed to delete item.");
        }
    };

    const filteredProducts = products.filter(p => 
        (p.name || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div style={styles.page}>
            <div style={styles.header}>
                <button onClick={() => navigate(`/shop/${id}`)} style={styles.backBtn}>
                    <ArrowLeft size={20} /> Back to Shop
                </button>
                <h2 style={styles.title}>Inventory & Catalog Manager</h2>
            </div>

            <div style={styles.container}>
                <div style={styles.tabs}>
                    <button style={activeTab === 'list' ? styles.activeTab : styles.inactiveTab} onClick={() => {setActiveTab('list'); setEditId(null); setExistingImagePreview(null);}}>
                        <List size={18} /> Live Catalog ({products.length})
                    </button>
                    <button style={activeTab === 'add' ? styles.activeTab : styles.inactiveTab} onClick={() => {setActiveTab('add'); setForm({ name: '', description: '', mrp: '', price: '', stock: '20', unit_value: '1', unit_type: 'Piece' }); setEditId(null); setExistingImagePreview(null);}}>
                        <PackagePlus size={18} /> {editId ? '✏️ Editing Item' : '➕ Add New Item'}
                    </button>
                </div>

                {activeTab === 'add' && (
                    <div style={styles.card}>
                        <form onSubmit={handleSubmit} style={styles.form}>
                            <div style={styles.inputGroup}>
                                <label style={styles.label}>Item / Service Name *</label>
                                <input style={styles.input} placeholder="e.g. Fresh Tomatoes, AC Servicing, Bridal Makeup" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
                            </div>

                            <div style={styles.inputGroup}>
                                <label style={styles.label}>Item Info (Description)</label>
                                <textarea style={{...styles.input, height: '80px', resize: 'none'}} placeholder="Describe quality, brand, or service details..." value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
                            </div>

                            <div style={styles.inputGroup}>
                                <label style={styles.label}>
                                    {editId ? 'Update Photos (Leave empty to keep current photo)' : 'Upload Photos (Up to 5)'}
                                </label>
                                <div style={styles.photoGrid}>
                                    {existingImagePreview && itemImages.length === 0 && (
                                        <div style={styles.imagePreviewWrapper}>
                                            <img src={existingImagePreview} alt="current" style={styles.imagePreview} />
                                            <span style={{ position: 'absolute', bottom: 2, left: 2, right: 2, background: 'rgba(15,23,42,0.8)', color: 'white', fontSize: '9px', textAlign: 'center', borderRadius: '4px', padding: '1px 0' }}>Current</span>
                                        </div>
                                    )}
                                    {itemImages.map((file, index) => (
                                        <div key={index} style={styles.imagePreviewWrapper}>
                                            <img src={URL.createObjectURL(file)} alt="preview" style={styles.imagePreview} />
                                            <button type="button" onClick={() => removeImage(index)} style={styles.removeImageBtn}>
                                                <X size={12} color="white" />
                                            </button>
                                        </div>
                                    ))}
                                    {itemImages.length < 5 && (
                                        <label style={styles.uploadBox}>
                                            <Upload size={20} color="#2563eb" />
                                            <span style={{fontSize: '11px', color: '#2563eb', marginTop: '4px', fontWeight: '800'}}>Add Photo</span>
                                            <input type="file" accept="image/*" multiple onChange={handleImageChange} style={{ display: 'none' }} />
                                        </label>
                                    )}
                                </div>
                            </div>

                            <div style={styles.row}>
                                <div style={{flex: 1, minWidth: '130px'}}>
                                    <label style={styles.label}>MRP (Without Discount) ₹</label>
                                    <input style={styles.input} type="number" placeholder="e.g. 150" value={form.mrp} onChange={e => setForm({...form, mrp: e.target.value})} />
                                </div>
                                <div style={{flex: 1, minWidth: '130px'}}>
                                    <label style={styles.label}>Selling Price ₹ *</label>
                                    <input style={styles.input} type="number" placeholder="e.g. 120" value={form.price} onChange={e => setForm({...form, price: e.target.value})} required />
                                </div>
                            </div>

                            <div style={styles.row}>
                                <div style={{flex: 1, minWidth: '120px'}}>
                                    <label style={styles.label}>Available Stock *</label>
                                    <input style={styles.input} type="number" placeholder="e.g. 50" value={form.stock} onChange={e => setForm({...form, stock: e.target.value})} required />
                                </div>
                                <div style={{flex: 1, display: 'flex', gap: '8px', minWidth: '160px'}}>
                                    <div style={{flex: 1}}>
                                        <label style={styles.label}>Qty / Unit</label>
                                        <input style={styles.input} type="number" placeholder="1" value={form.unit_value} onChange={e => setForm({...form, unit_value: e.target.value})} required />
                                    </div>
                                    <div style={{flex: 1.2}}>
                                        <label style={styles.label}>Unit Type</label>
                                        <select style={styles.input} value={form.unit_type} onChange={e => setForm({...form, unit_type: e.target.value})}>
                                            {UNIT_OPTIONS.map(unit => <option key={unit} value={unit}>{unit}</option>)}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                                {editId && (
                                    <button type="button" onClick={() => { setEditId(null); setActiveTab('list'); }} style={{...styles.submitBtn, background: '#e2e8f0', color: '#0f172a', flex: 1}}>
                                        Cancel
                                    </button>
                                )}
                                <button type="submit" disabled={isSubmitting} style={{...styles.submitBtn, flex: 2}}>
                                    {isSubmitting ? 'Saving...' : <><CheckCircle size={18} /> {editId ? 'Save Changes' : 'Add to Catalog'}</>}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {activeTab === 'list' && (
                    <div style={styles.card}>
                        <div style={styles.searchBar}>
                            <Search size={18} color="#94a3b8" />
                            <input type="text" placeholder="Search your catalog items..." style={styles.searchInput} value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                        </div>

                        {loading ? <p style={{textAlign:'center', color:'#64748b'}}>Loading items...</p> : null}
                        
                        {filteredProducts.length === 0 && !loading ? (
                            <div style={styles.emptyBox}>No items found. Tap "Add New Item" above to list your products or services!</div>
                        ) : (
                            <div style={styles.list}>
                                {filteredProducts.map(product => (
                                    <div key={product.id} style={styles.listItem}>
                                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flex: 1, minWidth: 0 }}>
                                            <img src={product.image_url || 'https://via.placeholder.com/60'} alt={product.name} style={styles.itemImg} />
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <h4 style={styles.itemName}>{product.name}</h4>
                                                <span style={styles.unitBadge}>Stock: {product.stock_count ?? 0} • {product.unit_value || 1} {product.unit_type || 'Piece'}</span>
                                                <div style={styles.priceRow}>
                                                    <span style={styles.priceText}>₹{product.price}</span>
                                                    {Number(product.mrp) > Number(product.price) && <span style={styles.mrpText}>₹{product.mrp}</span>}
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                                            <button onClick={() => handleEditClick(product)} style={styles.editBtn} title="Edit Item">
                                                <Edit size={16} />
                                            </button>
                                            <button onClick={() => handleDeleteItem(product.id)} style={styles.deleteBtn} title="Delete Item">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

const styles = {
    page: { background: '#f8fafc', minHeight: '100vh', fontFamily: 'Inter, sans-serif', paddingBottom: '50px' },
    header: { background: 'white', padding: '14px 18px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10 },
    backBtn: { display: 'flex', alignItems: 'center', gap: '6px', background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '7px 12px', borderRadius: '8px', cursor: 'pointer', fontWeight: '800', color: '#0f172a', fontSize: '13px' },
    title: { margin: 0, fontSize: '17px', fontWeight: '900', color: '#0f172a' },
    
    container: { maxWidth: '800px', margin: '18px auto', padding: '0 12px' },
    tabs: { display: 'flex', gap: '10px', marginBottom: '16px' },
    activeTab: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', background: '#0f172a', color: '#facc15', border: 'none', borderRadius: '12px', fontWeight: '900', fontSize: '13.5px', cursor: 'pointer' },
    inactiveTab: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', background: 'white', color: '#64748b', border: '1px solid #cbd5e1', borderRadius: '12px', fontWeight: '800', fontSize: '13.5px', cursor: 'pointer' },
    
    card: { background: 'white', padding: '18px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' },
    
    form: { display: 'flex', flexDirection: 'column', gap: '14px' },
    row: { display: 'flex', gap: '12px', flexWrap: 'wrap' }, 
    inputGroup: { display: 'flex', flexDirection: 'column' },
    label: { fontSize: '12.5px', fontWeight: '800', color: '#334155', marginBottom: '6px' },
    input: { padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', background: '#f8fafc', outline: 'none', width: '100%', boxSizing: 'border-box', fontWeight: '600' },
    
    photoGrid: { display: 'flex', gap: '10px', flexWrap: 'wrap' },
    imagePreviewWrapper: { position: 'relative', width: '74px', height: '74px' },
    imagePreview: { width: '100%', height: '100%', borderRadius: '10px', objectFit: 'cover', border: '1px solid #cbd5e1' },
    removeImageBtn: { position: 'absolute', top: '-5px', right: '-5px', background: '#ef4444', border: 'none', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },
    uploadBox: { width: '74px', height: '74px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '1.5px dashed #2563eb', borderRadius: '10px', background: '#eff6ff', cursor: 'pointer' },
    
    submitBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '14px', background: '#16a34a', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '900', fontSize: '15px', cursor: 'pointer' },
    
    searchBar: { display: 'flex', alignItems: 'center', gap: '10px', background: '#f1f5f9', padding: '11px 14px', borderRadius: '10px', marginBottom: '16px' },
    searchInput: { border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '14px', fontWeight: '600' },
    emptyBox: { textAlign: 'center', padding: '40px 20px', color: '#64748b', fontSize: '13.5px', fontWeight: '700' },
    list: { display: 'flex', flexDirection: 'column', gap: '10px' },
    listItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', padding: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px' },
    itemImg: { width: '54px', height: '54px', borderRadius: '10px', objectFit: 'cover', background: 'white', border: '1px solid #cbd5e1', flexShrink: 0 },
    itemName: { margin: '0 0 3px 0', fontSize: '14.5px', fontWeight: '800', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
    unitBadge: { fontSize: '11.5px', color: '#475569', fontWeight: '700' },
    priceRow: { display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px' },
    priceText: { fontSize: '14.5px', fontWeight: '900', color: '#16a34a' },
    mrpText: { fontSize: '11.5px', color: '#94a3b8', textDecoration: 'line-through' },
    
    editBtn: { background: '#eff6ff', border: '1px solid #bfdbfe', color: '#2563eb', padding: '9px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    deleteBtn: { background: '#fef2f2', border: '1px solid #fecaca', color: '#ef4444', padding: '9px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }
};

export default ManageCatalog;