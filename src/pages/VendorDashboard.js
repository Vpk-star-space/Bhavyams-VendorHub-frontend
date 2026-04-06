import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { DollarSign, Package, ShoppingBag, TrendingUp } from 'lucide-react';

const VendorDashboard = () => {
    const [stats, setStats] = useState({ revenue: 0, orders: 0, products: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get('https://bhavyams-vendorhub-backend.onrender.com/api/products/vendor/stats', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                
                // 🛡️ FIX: Map backend names (total_revenue) to frontend names (revenue)
                const data = res.data;
                setStats({
                    revenue: data.revenue || data.revenue_count|| 0,
                    orders: data.orders || data.total_orders || 0,
                    products: data.products || data.product_count || 0
                });
            } catch (err) {
                console.error("Dashboard Stats Error:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) return <div style={styles.loader}>Fetching your business stats...</div>;

    return (
        <div style={styles.container}>
            <div style={styles.headerRow}>
                <h2 style={styles.title}>Business Overview</h2>
                <div style={styles.liveBadge}><TrendingUp size={14}/> LIVE STATS</div>
            </div>
            
            <div style={styles.grid}>
                {/* REVENUE CARD */}
                <div style={{ ...styles.card, borderLeft: '5px solid #10b981' }}>
                    <div style={styles.iconCircle}><DollarSign color="#10b981" size={20}/></div>
                    <p style={styles.label}>Revenue</p>
                    <h3 style={styles.value}>₹{Number(stats.revenue).toLocaleString('en-IN')}</h3>
                </div>

                {/* ORDERS CARD */}
                <div style={{ ...styles.card, borderLeft: '5px solid #3b82f6' }}>
                    <div style={styles.iconCircle}><ShoppingBag color="#3b82f6" size={20}/></div>
                    <p style={styles.label}>Orders</p>
                    <h3 style={styles.value}>{stats.orders}</h3>
                </div>

                {/* PRODUCTS CARD */}
                <div style={{ ...styles.card, borderLeft: '5px solid #8b5cf6' }}>
                    <div style={styles.iconCircle}><Package color="#8b5cf6" size={20}/></div>
                    <p style={styles.label}>Inventory</p>
                    <h3 style={styles.value}>{stats.products}</h3>
                </div>
            </div>
        </div>
    );
};

const styles = {
    container: { padding: '15px' },
    headerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
    title: { fontSize: '20px', fontWeight: '900', color: '#0f172a', margin: 0 },
    liveBadge: { background: '#dcfce7', color: '#166534', padding: '4px 10px', borderRadius: '20px', fontSize: '10px', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '5px' },
    
    // Grid: Auto-stack on mobile, side-by-side on Laptop
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '15px' },
    
    card: { background: '#fff', padding: '20px', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', alignItems: 'center' },
    iconCircle: { background: '#f8fafc', padding: '10px', borderRadius: '50%', marginBottom: '10px' },
    label: { fontSize: '11px', fontWeight: '800', color: '#64748b', margin: '0 0 5px', textTransform: 'uppercase', letterSpacing: '0.5px' },
    value: { fontSize: '22px', fontWeight: '900', color: '#1e293b', margin: 0 },
    loader: { textAlign: 'center', padding: '40px', color: '#64748b', fontWeight: 'bold', fontSize: '14px' }
};

export default VendorDashboard;