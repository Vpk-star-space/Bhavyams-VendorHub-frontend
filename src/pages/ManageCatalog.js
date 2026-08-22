import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, PackagePlus, List, Upload, Trash2, CheckCircle, Search, X, Edit } from 'lucide-react';

const getBackendUrl = () => {
    return process.env.NODE_ENV === 'production' 
        ? 'https://bhavyams-vendorhub-backend.onrender.com/api' 
        : 'http://localhost:5000/api';
};

const ManageCatalog = () => {
    const { id } = useParams(); 
    const navigate = useNavigate();
    
    const [activeTab, setActiveTab] = useState('list'); 
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // Multi-Image & Edit State
    const [itemImages, setItemImages] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editId, setEditId] = useState(null); // 🟢 NEW: Tracks if we are editing
    
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
            alert("You can only upload a maximum of 5 photos.");
            return;
        }
        const validFiles = files.filter(file => file.size <= 5 * 1024 * 1024);
        setItemImages([...itemImages, ...validFiles]);
    };

    const removeImage = (indexToRemove) => {
        setItemImages(itemImages.filter((_, index) => index !== indexToRemove));
    };

    // 🟢 NEW: Handle clicking the Edit Button
    const handleEditClick = (product) => {
        setForm({
            name: product.name || '',
            description: product.description || '',
            mrp: product.mrp || '',
            price: product.price || '',
            stock: product.stock_count || '',
            unit_value: product.unit_value || '1',
            unit_type: product.unit_type || 'Piece'
        });
        setEditId(product.id);
        setItemImages([]); // Clear preview images for the new edit
        setActiveTab('add'); // Switch to the form tab
    };

    // 🟢 UPDATED: Handles BOTH Adding and Editing
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const BACKEND_URL = getBackendUrl();
            const token = localStorage.getItem('token');
            
            const formData = new FormData();
            formData.append('vendor_id', id);
            formData.append('name', form.name);
            formData.append('description', form.description);
            formData.append('mrp', form.mrp);
            formData.append('price', form.price);
            formData.append('stock', form.stock);
            formData.append('unit_value', form.unit_value);
            formData.append('unit_type', form.unit_type);
            
            itemImages.forEach(file => {
                formData.append('item_images', file);
            });

            if (editId) {
                // ✏️ UPDATE EXISTING ITEM
                await axios.put(`${BACKEND_URL}/products/update/${editId}`, formData, {
                    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
                });
                alert("✅ Item updated successfully!");
            } else {
                // ➕ ADD NEW ITEM
                await axios.post(`${BACKEND_URL}/products/add`, formData, {
                    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
                });
                alert("✅ Item added successfully!");
            }
            
            // Reset Form cleanly
            setForm({ name: '', description: '', mrp: '', price: '', stock: '', unit_value: '1', unit_type: 'Piece' });
            setItemImages([]);
            setEditId(null);
            setActiveTab('list');
            fetchProducts();

        } catch (err) {
            console.error(err);
            alert("❌ Failed to save item.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteItem = async (productId) => {
        if (!window.confirm("Delete this item permanently?")) return;
        try {
            const BACKEND_URL = getBackendUrl();
            const token = localStorage.getItem('token');
           // ✅ CORRECT REST PATH
await axios.delete(`${BACKEND_URL}/products/${productId}`, {
    headers: { Authorization: `Bearer ${token}` }
});
            fetchProducts();
        } catch (err) {
            console.error(err);
            alert("Failed to delete item.");
        }
    };

    const filteredProducts = products.filter(p => 
        (p.name || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div style={styles.page}>
            <div style={styles.header}>
                <button onClick={() => navigate(-1)} style={styles.backBtn}>
                    <ArrowLeft size={20} /> Back
                </button>
                <h2 style={styles.title}>Inventory Manager</h2>
            </div>

            <div style={styles.container}>
                <div style={styles.tabs}>
                    <button style={activeTab === 'list' ? styles.activeTab : styles.inactiveTab} onClick={() => {setActiveTab('list'); setEditId(null);}}>
                        <List size={18} /> Catalog ({products.length})
                    </button>
                    <button style={activeTab === 'add' ? styles.activeTab : styles.inactiveTab} onClick={() => {setActiveTab('add'); setForm({ name: '', description: '', mrp: '', price: '', stock: '', unit_value: '1', unit_type: 'Piece' }); setEditId(null);}}>
                        <PackagePlus size={18} /> {editId ? 'Edit Item' : 'Add Item'}
                    </button>
                </div>

                {activeTab === 'add' && (
                    <div style={styles.card}>
                        <form onSubmit={handleSubmit} style={styles.form}>
                            <div style={styles.inputGroup}>
                                <label style={styles.label}>Item Name</label>
                                <input style={styles.input} placeholder="e.g. Tomatoes, Engine Oil, Haircut" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
                            </div>

                            <div style={styles.inputGroup}>
                                <label style={styles.label}>Item Info (Description)</label>
                                <textarea style={{...styles.input, height: '80px', resize: 'none'}} placeholder="e.g. Fresh local tomatoes / Full synthetic oil..." value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
                            </div>

                            <div style={styles.inputGroup}>
                                <label style={styles.label}>Upload Photos (Max 3 to 5)</label>
                                <div style={styles.photoGrid}>
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
                                            <Upload size={20} color="#3b82f6" />
                                            <span style={{fontSize: '11px', color: '#3b82f6', marginTop: '4px'}}>Add Photo</span>
                                            <input type="file" accept="image/*" multiple onChange={handleImageChange} style={{ display: 'none' }} />
                                        </label>
                                    )}
                                </div>
                            </div>

                            <div style={styles.row}>
                                <div style={{flex: 1}}>
                                    <label style={styles.label}>Without Discount Price (MRP) ₹</label>
                                    <input style={styles.input} type="number" placeholder="e.g. 150" value={form.mrp} onChange={e => setForm({...form, mrp: e.target.value})} />
                                </div>
                                <div style={{flex: 1}}>
                                    <label style={styles.label}>With Discount Selling Price ₹</label>
                                    <input style={styles.input} type="number" placeholder="e.g. 120" value={form.price} onChange={e => setForm({...form, price: e.target.value})} required />
                                </div>
                            </div>

                            <div style={styles.row}>
                                <div style={{flex: 1}}>
                                    <label style={styles.label}>Available Stock</label>
                                    <input style={styles.input} type="number" placeholder="e.g. 50" value={form.stock} onChange={e => setForm({...form, stock: e.target.value})} required />
                                </div>
                                <div style={{flex: 1, display: 'flex', gap: '5px'}}>
                                    <div style={{flex: 1}}>
                                        <label style={styles.label}>Measurement</label>
                                        <input style={styles.input} type="number" placeholder="1" value={form.unit_value} onChange={e => setForm({...form, unit_value: e.target.value})} required />
                                    </div>
                                    <div style={{flex: 1}}>
                                        <label style={styles.label}>Unit</label>
                                        <select style={styles.input} value={form.unit_type} onChange={e => setForm({...form, unit_type: e.target.value})}>
                                            {UNIT_OPTIONS.map(unit => <option key={unit} value={unit}>{unit}</option>)}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <button type="submit" disabled={isSubmitting} style={styles.submitBtn}>
                                {isSubmitting ? 'Saving...' : <><CheckCircle size={18} /> {editId ? 'Save Changes' : 'Add to Catalog'}</>}
                            </button>
                        </form>
                    </div>
                )}

                {/* LIST VIEW WITH EDIT & DELETE BUTTONS */}
                {activeTab === 'list' && (
                    <div style={styles.card}>
                        <div style={styles.searchBar}>
                            <Search size={18} color="#94a3b8" />
                            <input type="text" placeholder="Search your items..." style={styles.searchInput} value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                        </div>

                        {loading ? <p style={{textAlign:'center', color:'#64748b'}}>Loading items...</p> : null}
                        
                        {filteredProducts.length === 0 && !loading ? (
                            <div style={styles.emptyBox}>No items added yet.</div>
                        ) : (
                            <div style={styles.list}>
                                {filteredProducts.map(product => (
                                    <div key={product.id} style={styles.listItem}>
                                        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                                            <img src={product.image_url || 'https://via.placeholder.com/60'} alt={product.name} style={styles.itemImg} />
                                            <div>
                                                <h4 style={styles.itemName}>{product.name}</h4>
                                                <span style={styles.unitBadge}>Stock: {product.stock_count || 0} | {product.unit_value || 1} {product.unit_type || 'Piece'}</span>
                                                <div style={styles.priceRow}>
                                                    <span style={styles.priceText}>₹{product.price}</span>
                                                    {product.mrp > product.price && <span style={styles.mrpText}>₹{product.mrp}</span>}
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {/* 🟢 NEW: Edit & Delete Button Group */}
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button onClick={() => handleEditClick(product)} style={styles.editBtn}>
                                                <Edit size={16} />
                                            </button>
                                            <button onClick={() => handleDeleteItem(product.id)} style={styles.deleteBtn}>
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
    page: { background: '#f8fafc', minHeight: '100vh', fontFamily: 'Inter, sans-serif' },
    header: { background: 'white', padding: '15px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '15px', position: 'sticky', top: 0, zIndex: 10 },
    backBtn: { display: 'flex', alignItems: 'center', gap: '6px', background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 'bold', color: '#475569', fontSize: '14px', padding: 0 },
    title: { margin: 0, fontSize: '18px', color: '#0f172a' },
    
    container: { maxWidth: '800px', margin: '20px auto', padding: '0 15px' },
    tabs: { display: 'flex', gap: '10px', marginBottom: '20px' },
    activeTab: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer' },
    inactiveTab: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', background: 'white', color: '#64748b', border: '1px solid #cbd5e1', borderRadius: '10px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer' },
    
    card: { background: 'white', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' },
    
    form: { display: 'flex', flexDirection: 'column', gap: '15px' },
    row: { display: 'flex', gap: '15px', flexWrap: 'wrap' }, 
    inputGroup: { display: 'flex', flexDirection: 'column' },
    label: { fontSize: '13px', fontWeight: 'bold', color: '#334155', marginBottom: '6px' },
    input: { padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', background: '#f8fafc', outline: 'none', width: '100%', boxSizing: 'border-box' },
    
    photoGrid: { display: 'flex', gap: '10px', flexWrap: 'wrap' },
    imagePreviewWrapper: { position: 'relative', width: '70px', height: '70px' },
    imagePreview: { width: '100%', height: '100%', borderRadius: '8px', objectFit: 'cover', border: '1px solid #cbd5e1' },
    removeImageBtn: { position: 'absolute', top: '-4px', right: '-4px', background: '#ef4444', border: 'none', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },
    uploadBox: { width: '70px', height: '70px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '1px dashed #3b82f6', borderRadius: '8px', background: '#eff6ff', cursor: 'pointer' },
    
    submitBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '14px', background: '#16a34a', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer', marginTop: '10px' },
    
    searchBar: { display: 'flex', alignItems: 'center', gap: '10px', background: '#f1f5f9', padding: '12px 15px', borderRadius: '8px', marginBottom: '20px' },
    searchInput: { border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '14px' },
    emptyBox: { textAlign: 'center', padding: '40px', color: '#64748b', fontSize: '14px' },
    list: { display: 'flex', flexDirection: 'column', gap: '10px' },
    listItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px' },
    itemImg: { width: '50px', height: '50px', borderRadius: '8px', objectFit: 'cover', background: 'white', border: '1px solid #cbd5e1' },
    itemName: { margin: '0 0 4px 0', fontSize: '14px', color: '#0f172a' },
    unitBadge: { fontSize: '11px', color: '#475569', fontWeight: 'bold' },
    priceRow: { display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' },
    priceText: { fontSize: '14px', fontWeight: 'bold', color: '#16a34a' },
    mrpText: { fontSize: '11px', color: '#94a3b8', textDecoration: 'line-through' },
    
    // 🟢 NEW: Added specific styles for the Edit button
    editBtn: { background: '#eff6ff', border: 'none', color: '#2563eb', padding: '8px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    deleteBtn: { background: '#fee2e2', border: 'none', color: '#ef4444', padding: '8px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }
};

export default ManageCatalog;