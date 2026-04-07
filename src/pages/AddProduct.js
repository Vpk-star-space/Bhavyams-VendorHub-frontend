import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Package, DollarSign, FileText, Image as ImageIcon, ArrowLeft, Clock, X, Layers } from 'lucide-react';
import confetti from 'canvas-confetti';

const AddProduct = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    const [productData, setProductData] = useState({
        name: '',
        price: '',
        description: '',
        stock_count: '',
        category: '',
        delivery_minutes: '', 
    });

    const [images, setImages] = useState([]);
    const [previews, setPreviews] = useState([]);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleChange = (e) => {
        setProductData({ ...productData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e) => {
        const selectedFiles = Array.from(e.target.files);
        if (selectedFiles.length + images.length > 5) {
            return toast.error("Max 5 images allowed");
        }
        const updatedImages = [...images, ...selectedFiles];
        setImages(updatedImages);

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
        if (!token) return navigate('/login');
        if (images.length === 0) return toast.error("Please upload at least one image");

        const formData = new FormData();
        Object.keys(productData).forEach(key => formData.append(key, productData[key]));
        images.forEach((file) => formData.append('images', file));

        setLoading(true);
        try {
            await axios.post('https://bhavyams-vendorhub-backend.onrender.com/api/products/add', formData, {
                headers: { 
                    'Content-Type': 'multipart/form-data', 
                    'Authorization': `Bearer ${token}` 
                }
            });
            
            confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
            toast.success("Product listed successfully!");
            navigate('/dashboard');
        } catch (err) {
            toast.error("Upload failed. Check connection.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.page}>
            <div style={{...styles.container, width: isMobile ? '100%' : '450px', padding: isMobile ? '20px' : '30px'}}>
                <button onClick={() => navigate('/dashboard')} style={styles.backBtn}>
                    <ArrowLeft size={18} /> Back
                </button>

                <h2 style={styles.title}>List New Product</h2>
                <p style={styles.subtitle}>Upload up to 5 clear photos</p>

                <form onSubmit={handleSubmit} style={styles.form}>
                    <div style={styles.inputGroup}>
                        <Package size={18} color="#2874f0"/>
                        <input name="name" placeholder="Product Name" onChange={handleChange} required style={styles.input} />
                    </div>
                    
                    <div style={{display: 'flex', gap: '10px'}}>
                        <div style={{...styles.inputGroup, flex: 1}}>
                            <DollarSign size={18} color="#10b981"/>
                            <input name="price" type="number" placeholder="Price" onChange={handleChange} required style={styles.input} />
                        </div>
                        <div style={{...styles.inputGroup, flex: 1}}>
                            <Layers size={18} color="#f59e0b"/>
                            <input name="stock_count" type="number" placeholder="Stock" onChange={handleChange} required style={styles.input} />
                        </div>
                    </div>

                    <div style={styles.inputGroup}>
                        <Clock size={18} color="#64748b"/>
                        <select name="delivery_minutes" onChange={handleChange} style={styles.select}>
                            <option value="">6 Mins Delivery</option>
                           
                        </select>
                    </div>

                    <div style={styles.inputGroup}>
                        <ImageIcon size={18} color="#2874f0"/>
                        <label style={{fontSize: '13px', color: '#64748b', cursor: 'pointer', flex: 1}}>
                            {images.length > 0 ? `${images.length} images selected` : "Select Product Images"}
                            <input type="file" accept="image/*" multiple onChange={handleFileChange} style={{display: 'none'}} />
                        </label>
                    </div>

                    {/* 🖼️ RESPONSIVE PREVIEW GRID */}
                    {previews.length > 0 && (
                        <div style={styles.previewGrid}>
                            {previews.map((url, index) => (
                                <div key={index} style={styles.previewCard}>
                                    <img src={url} alt="preview" style={styles.thumb} />
                                    <div style={styles.removeBadge} onClick={() => removeImage(index)}><X size={10}/></div>
                                </div>
                            ))}
                        </div>
                    )}
                    
                    <div style={{...styles.inputGroup, alignItems: 'flex-start'}}>
                        <FileText size={18} color="#64748b" style={{marginTop: '10px'}}/>
                        <textarea name="description" placeholder="Describe your product..." onChange={handleChange} required style={styles.textarea} />
                    </div>
                    
                    <button type="submit" disabled={loading} style={loading ? styles.btnDisabled : styles.btn}>
                        {loading ? "UPLOADING TO CLOUD..." : "CONFIRM & LIST PRODUCT"}
                    </button>
                </form>
            </div>
        </div>
    );
};

const styles = {
    page: { background: '#f1f3f6', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' },
    container: { background: '#fff', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.08)', boxSizing: 'border-box' },
    backBtn: { display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', marginBottom: '10px', fontSize: '14px', fontWeight: '600' },
    title: { fontSize: '22px', fontWeight: '900', color: '#0f172a', margin: '0 0 5px 0' },
    subtitle: { color: '#2874f0', marginBottom: '25px', fontSize: '13px', fontWeight: '700' },
    form: { display: 'flex', flexDirection: 'column', gap: '15px' },
    inputGroup: { display: 'flex', alignItems: 'center', gap: '12px', background: '#f8fafc', padding: '12px 15px', borderRadius: '10px', border: '1px solid #e2e8f0' },
    input: { border: 'none', background: 'transparent', width: '100%', outline: 'none', fontSize: '14px', color: '#1e293b' },
    select: { border: 'none', background: 'transparent', width: '100%', outline: 'none', fontSize: '14px', color: '#1e293b', cursor: 'pointer' },
    textarea: { border: 'none', background: 'transparent', width: '100%', outline: 'none', fontSize: '14px', height: '80px', resize: 'none', fontFamily: 'inherit', color: '#1e293b' },
    
    previewGrid: { display: 'flex', gap: '10px', flexWrap: 'wrap', padding: '5px' },
    previewCard: { position: 'relative', width: '60px', height: '60px', borderRadius: '8px', overflow: 'hidden', border: '2px solid #2874f0' },
    thumb: { width: '100%', height: '100%', objectFit: 'cover' },
    removeBadge: { position: 'absolute', top: 0, right: 0, background: '#ef4444', color: '#fff', borderRadius: '0 0 0 8px', padding: '3px', cursor: 'pointer' },

    btn: { background: '#2874f0', color: '#fff', padding: '16px', borderRadius: '10px', border: 'none', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px', marginTop: '10px', boxShadow: '0 4px 12px rgba(40, 116, 240, 0.2)' },
    btnDisabled: { background: '#cbd5e1', color: '#64748b', padding: '16px', borderRadius: '10px', border: 'none', cursor: 'not-allowed', marginTop: '10px' }
};

export default AddProduct;