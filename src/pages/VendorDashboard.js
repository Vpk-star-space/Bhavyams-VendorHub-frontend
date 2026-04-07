import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { DollarSign, Package, ShoppingBag, TrendingUp } from 'lucide-react';
import ProductList from '../components/ProductList'; // 🚀 FIX: Importing the component!

const VendorDashboard = () => {
    const [stats, setStats] = useState({ revenue: 0, orders: 0, products: 0 });
    const [loading, setLoading] = useState(true);

    const token = localStorage.getItem('token');

    const fetchData = useCallback(async () => {
        if (!token) return;
        try {
            // Only fetch Stats here. ProductList handles its own fetching!
            const statsRes = await axios.get('https://bhavyams-vendorhub-backend.onrender.com/api/products/vendor/stats', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStats({
                revenue: statsRes.data.revenue || 0,
                orders: statsRes.data.orders || 0,
                products: statsRes.data.products || 0
            });
        } catch (err) {
            console.error("Dashboard Stats Error:", err);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    if (loading) return <div style={styles.loader}>Fetching your business stats...</div>;

    return (
        <div style={styles.container}>
            <div style={styles.headerRow}>
                <h2 style={styles.title}>Business Overview</h2>
                <div style={styles.liveBadge}><TrendingUp size={14}/> LIVE STATS</div>
            </div>
            
            {/* 📊 STATS GRID */}
            <div style={styles.grid}>
                <div style={styles.statCard}>
                    <DollarSign color="#10b981" size={24} style={{marginBottom: '5px'}}/>
                    <p style={styles.statLabel}>REVENUE</p>
                    <h3 style={styles.statValue}>₹{Number(stats.revenue).toLocaleString('en-IN')}</h3>
                </div>
                <div style={styles.statCard}>
                    <ShoppingBag color="#3b82f6" size={24} style={{marginBottom: '5px'}}/>
                    <p style={styles.statLabel}>ORDERS</p>
                    <h3 style={styles.statValue}>{stats.orders}</h3>
                </div>
                <div style={styles.statCard}>
                    <Package color="#f59e0b" size={24} style={{marginBottom: '5px'}}/>
                    <p style={styles.statLabel}>INVENTORY</p>
                    <h3 style={styles.statValue}>{stats.products}</h3>
                </div>
            </div>

            {/* 📦 INVENTORY SECTION (Delegated to ProductList.js) */}
            <div style={styles.inventorySection}>
                <h3 style={styles.subTitle}>Manage Inventory</h3>
                
                {/* 🚀 FIX: Using your perfect ProductList component here! */}
                <ProductList /> 
                
            </div>
        </div>
    );
};

const styles = {
    container: { padding: '15px', background: '#f8fafc', minHeight: '100vh', fontFamily: 'Roboto, sans-serif' },
    headerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
    title: { fontSize: '20px', fontWeight: '900', color: '#0f172a', margin: 0 },
    subTitle: { fontSize: '18px', fontWeight: '800', margin: '30px 0 15px' },
    liveBadge: { background: '#dcfce7', color: '#166534', padding: '4px 10px', borderRadius: '20px', fontSize: '10px', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '5px' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '15px', marginBottom: '20px' },
    statCard: { background: '#fff', padding: '15px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', alignItems: 'center', border: '1px solid #f1f5f9' },
    statLabel: { fontSize: '10px', fontWeight: '800', color: '#64748b', margin: '5px 0', letterSpacing: '0.5px' },
    statValue: { fontSize: '20px', fontWeight: '900', color: '#1e293b', margin: 0 },
    inventorySection: { display: 'flex', flexDirection: 'column', gap: '15px' },
    loader: { textAlign: 'center', padding: '40px', fontWeight: 'bold', color: '#2874f0' }
};

export default VendorDashboard;