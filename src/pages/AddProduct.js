import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Package, DollarSign, FileText, Image as ImageIcon, ArrowLeft, Clock, X } from 'lucide-react';
import confetti from 'canvas-confetti';

const AddProduct = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const [productData, setProductData] = useState({
        name: '',
        price: '',
        description: '',
        stock_count: '',
        category: 'Electronics',
        delivery_minutes: '30' 
    });

    const [images, setImages] = useState([]);
    const [previews, setPreviews] = useState([]); // 🖼️ To show photos on screen

    const handleChange = (e) => {
        setProductData({ ...productData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e) => {
        const selectedFiles = Array.from(e.target.files);
        
        if (selectedFiles.length + images.length > 5) {
            toast.error("Max 5 images allowed");
            return;
        }

        // Add new files to existing ones
        const updatedImages = [...images, ...selectedFiles];
        setImages(updatedImages);

        // Generate Previews
        const newPreviews = selectedFiles.map(file => URL.createObjectURL(file));
        setPreviews([...previews, ...newPreviews]);
    };

    const removeImage = (index) => {
        const updatedImages = images.filter((_, i) => i !== index);
        const updatedPreviews = previews.filter((_, i) => i !== index);
        setImages(updatedImages);
        setPreviews(updatedPreviews);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        if (!token) return toast.error("Session expired. Login again.");
        if (images.length === 0) return toast.error("Upload at least one image");

        const formData = new FormData();
        formData.append('name', productData.name);
        formData.append('price', productData.price);
        formData.append('description', productData.description);
        formData.append('stock_count', productData.stock_count);
        formData.append('category', productData.category);
        formData.append('delivery_minutes', productData.delivery_minutes);

        // ☁️ Backend expects 'images' key
        images.forEach((file) => {
            formData.append('images', file);
        });

        setLoading(true);
        try {
            await axios.post('https://bhavyams-vendorhub-backend.onrender.com/api/products/add', formData, {
                headers: { 
                    'Content-Type': 'multipart/form-data', 
                    'Authorization': `Bearer ${token}` 
                }
            });
            
            confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
            toast.success("All images uploaded to Cloudinary!");
            navigate('/dashboard');
        } catch (err) {
            toast.error("Cloud Upload Failed. Check Backend.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.page}>
            <div style={styles.container}>
                <button onClick={() => navigate('/dashboard')} style={styles.backBtn}>
                    <ArrowLeft size={18} /> Back
                </button>

                <h2 style={styles.title}>List Product</h2>
                <p style={styles.subtitle}>Hold <b>Ctrl</b> to select multiple photos</p>

                <form onSubmit={handleSubmit} style={styles.form}>
                    <div style={styles.inputGroup}>
                        <Package size={18} color="#64748b"/>
                        <input name="name" placeholder="Product Name" onChange={handleChange} required style={styles.input} />
                    </div>
                    
                    <div style={styles.inputGroup}>
                        <DollarSign size={18} color="#64748b"/>
                        <input name="price" type="number" placeholder="Price (₹)" onChange={handleChange} required style={styles.input} />
                    </div>

                    <div style={styles.inputGroup}>
                        <Clock size={18} color="#3b82f6"/>
                        <input name="delivery_minutes" type="number" placeholder="Minutes" value={productData.delivery_minutes} onChange={handleChange} required style={styles.input} />
                    </div>
                    
                    <div style={styles.inputGroup}>
                        <ImageIcon size={18} color="#64748b"/>
                        <input type="file" accept="image/*" multiple onChange={handleFileChange} style={styles.input} />
                    </div>

                    {/* 🖼️ PREVIEW SECTION */}
                    {previews.length > 0 && (
                        <div style={styles.previewGrid}>
                            {previews.map((url, index) => (
                                <div key={index} style={styles.previewCard}>
                                    <img src={url} alt="preview" style={styles.thumb} />
                                    <X size={14} style={styles.removeIcon} onClick={() => removeImage(index)} />
                                </div>
                            ))}
                        </div>
                    )}
                    
                    <div style={styles.inputGroup}>
                        <FileText size={18} color="#64748b"/>
                        <textarea name="description" placeholder="Description..." onChange={handleChange} required style={{...styles.input, height: '60px', paddingTop: '10px', resize: 'none'}} />
                    </div>
                    
                    <button type="submit" disabled={loading} style={loading ? styles.btnDisabled : styles.btn}>
                        {loading ? "Uploading 5 Images..." : "List Product Now"}
                    </button>
                </form>
            </div>
        </div>
    );
};

const styles = {
    page: { background: '#f8fafc', minHeight: '100vh', padding: '40px 20px' },
    container: { background: '#fff', padding: '30px', borderRadius: '20px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', maxWidth: '450px', margin: '0 auto' },
    backBtn: { display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', marginBottom: '15px' },
    title: { fontSize: '22px', fontWeight: 'bold', textAlign: 'center', margin: 0 },
    subtitle: { textAlign: 'center', color: '#3b82f6', marginBottom: '20px', fontSize: '12px', fontWeight: 'bold' },
    form: { display: 'flex', flexDirection: 'column', gap: '12px' },
    inputGroup: { display: 'flex', alignItems: 'center', gap: '12px', background: '#f8fafc', padding: '10px 15px', borderRadius: '10px', border: '1px solid #e2e8f0' },
    input: { border: 'none', background: 'transparent', width: '100%', outline: 'none', fontSize: '14px' },
    
    // Preview Styles
    previewGrid: { display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '10px' },
    previewCard: { position: 'relative', width: '60px', height: '60px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #ddd' },
    thumb: { width: '100%', height: '100%', objectFit: 'cover' },
    removeIcon: { position: 'absolute', top: '2px', right: '2px', background: 'red', color: 'white', borderRadius: '50%', cursor: 'pointer', padding: '2px' },

    btn: { background: '#3b82f6', color: '#fff', padding: '15px', borderRadius: '10px', border: 'none', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' },
    btnDisabled: { background: '#94a3b8', color: '#fff', padding: '15px', borderRadius: '10px', border: 'none', cursor: 'not-allowed' }
};

export default AddProduct;