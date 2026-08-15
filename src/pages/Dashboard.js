import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { DollarSign, Package, ShoppingBag, TrendingUp, ArrowLeft } from 'lucide-react';
import ProductList from '../components/ProductList'; 

const getBackendUrl = () => {
    return process.env.NODE_ENV === 'production' 
        ? 'https://bhavyams-vendorhub-backend.onrender.com/api' 
        : 'http://localhost:5000/api';
};

const VendorDashboard = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState({ revenue: 0, orders: 0, products: 0 });
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        const token = localStorage.getItem('token');
        if (!token) return;
        try {
            // 🟢 HITS THE NEW BACKEND ROUTE WE JUST BUILT
            const res = await axios.get(`${getBackendUrl()}/orders/my-sales`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                setStats({
                    revenue: res.data.revenue || 0,
                    orders: res.data.orders || 0,
                    products: res.data.products || 0
                });
            }
        } catch (err) {
            console.error("Dashboard error:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    if (loading) return <div style={styles.loader}>Loading Business Data...</div>;

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <button onClick={() => navigate(-1)} style={styles.backBtn}>
                    <ArrowLeft size={22} color="#0f172a" />
                </button>
                <h2 style={styles.title}>Revenue & Inventory</h2>
                <div style={styles.liveBadge}><TrendingUp size={14}/> LIVE</div>
            </div>

            {/* 📊 STATS GRID */}
            <div style={styles.grid}>
                <div style={styles.statCard}>
                    <DollarSign color="#10b981" size={24} style={{marginBottom: '5px'}}/>
                    <p style={styles.statLabel}>COMPLETED REVENUE</p>
                    <h3 style={styles.statValue}>₹{Number(stats.revenue).toLocaleString('en-IN')}</h3>
                </div>
                <div style={styles.statCard}>
                    <ShoppingBag color="#3b82f6" size={24} style={{marginBottom: '5px'}}/>
                    <p style={styles.statLabel}>TOTAL ORDERS</p>
                    <h3 style={styles.statValue}>{stats.orders}</h3>
                </div>
                <div style={styles.statCard}>
                    <Package color="#f59e0b" size={24} style={{marginBottom: '5px'}}/>
                    <p style={styles.statLabel}>LIVE INVENTORY</p>
                    <h3 style={styles.statValue}>{stats.products}</h3>
                </div>
            </div>

            {/* 📦 INVENTORY SECTION */}
            <div style={styles.inventorySection}>
                <h3 style={{fontSize: '16px', color: '#0f172a'}}>Manage Your Catalog</h3>
                <ProductList /> 
            </div>
        </div>
    );
};

const styles = {
    container: { background: '#f8fafc', minHeight: '100vh', paddingBottom: '90px' },
    header: { background: '#ffffff', padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', marginBottom: '15px' },
    backBtn: { background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0 },
    title: { fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: 0, flex: 1, textAlign: 'center' },
    liveBadge: { background: '#dcfce7', color: '#166534', padding: '4px 8px', borderRadius: '8px', fontSize: '10px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '4px' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', padding: '0 15px', marginBottom: '20px' },
    statCard: { background: '#fff', padding: '15px 10px', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' },
    statLabel: { fontSize: '9px', fontWeight: '800', color: '#64748b', margin: '5px 0', textAlign: 'center' },
    statValue: { fontSize: '16px', fontWeight: '900', color: '#1e293b', margin: 0 },
    inventorySection: { padding: '0 15px' },
    loader: { textAlign: 'center', padding: '40px', fontWeight: 'bold', color: '#64748b' }
};

export default VendorDashboard;