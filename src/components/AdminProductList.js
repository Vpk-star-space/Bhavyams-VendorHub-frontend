import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Trash2, Package } from 'lucide-react';
import { toast } from 'react-toastify';

const AdminProductList = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

// 🌐 SMART IMAGE LOGIC
    const getProductImg = (url) => {
        if (!url) return 'https://via.placeholder.com/150?text=No+Image';
        // 🚀 FIX: Point to the live Render Backend!
        return url.startsWith('http') ? url : `https://bhavyams-vendorhub-backend.onrender.com${url}`;
    };

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get('https://bhavyams-vendorhub-backend.onrender.com/api/auth/admin/all-products', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setProducts(res.data);
            } catch (err) {
                toast.error("Failed to load products");
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
    }, []);

    const deleteProduct = async (id) => {
        if (window.confirm("Delete this product from the marketplace?")) {
            try {
                const token = localStorage.getItem('token');
                await axios.delete(`https://bhavyams-vendorhub-backend.onrender.com/api/auth/admin/delete-product/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setProducts(products.filter(p => p.id !== id));
                toast.success("Product removed");
            } catch (err) {
                toast.error("Error deleting product");
            }
        }
    };

    if (loading) return <p style={{textAlign: 'center', color: '#64748b', padding: '20px'}}>Loading Marketplace Items...</p>;

    return (
        <div style={styles.container}>
            <h4 style={{marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px'}}>
                <Package size={20} color="#10b981"/> Global Inventory
            </h4>
            <div style={{overflowX: 'auto'}}>
                <table style={styles.table}>
                    <thead>
                        <tr style={styles.headerRow}>
                            <th style={styles.th}>Image</th>
                            <th style={styles.th}>Product</th>
                            <th style={styles.th}>Category</th>
                            <th style={styles.th}>Price</th>
                            <th style={styles.th}>Vendor</th>
                            <th style={styles.th}>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.map(p => (
                            <tr key={p.id} style={styles.tr}>
                                {/* 🖼️ ADDED IMAGE COLUMN */}
                                <td style={styles.td}>
                                    <img 
                                        src={getProductImg(p.image_url)} 
                                        alt={p.name} 
                                        style={styles.thumbnail} 
                                        onError={(e) => { e.target.src = 'https://via.placeholder.com/50?text=Err'; }}
                                    />
                                </td>
                                <td style={styles.td}>
                                    <div style={{fontWeight: '600', color: '#0f172a'}}>{p.name}</div>
                                    <div style={{fontSize: '11px', color: '#64748b'}}>ID: #{p.id}</div>
                                </td>
                                <td style={styles.td}><span style={styles.catBadge}>{p.category}</span></td>
                                <td style={styles.td}><span style={{fontWeight: 'bold', color: '#16a34a'}}>₹{p.price}</span></td>
                                <td style={styles.td}><span style={{color:'#64748b', fontWeight: '500'}}>{p.vendor_name}</span></td>
                                <td style={styles.td}>
                                    <button onClick={() => deleteProduct(p.id)} style={styles.delBtn}>
                                        <Trash2 size={16}/>
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const styles = {
    container: { background: '#fff', padding: '25px', borderRadius: '16px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' },
    table: { width: '100%', borderCollapse: 'collapse' },
    headerRow: { textAlign: 'left', borderBottom: '1px solid #f1f5f9' },
    th: { padding: '15px 12px', color: '#64748b', fontSize: '13px', fontWeight: '600' },
    td: { padding: '15px 12px', fontSize: '14px', verticalAlign: 'middle' },
    tr: { borderBottom: '1px solid #f8fafc', transition: '0.2s' },
    thumbnail: { width: '45px', height: '45px', borderRadius: '8px', objectFit: 'cover', background: '#f1f5f9', border: '1px solid #e2e8f0' },
    catBadge: { background: '#f1f5f9', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', color: '#475569', fontWeight: 'bold' },
    delBtn: { border: 'none', background: '#fee2e2', color: '#ef4444', cursor: 'pointer', padding: '8px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: '0.2s' }
};

export default AdminProductList;