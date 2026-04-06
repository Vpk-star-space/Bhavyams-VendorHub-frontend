import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { DollarSign, Package, ShoppingBag } from 'lucide-react';

const VendorDashboard = () => {
    const [stats, setStats] = useState({ revenue: 0, orders: 0, products: 0 });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const token = localStorage.getItem('token');
                // 🛡️ Ensure this matches your cleaned route: router.get('/vendor/stats', ...)
                const res = await axios.get('https://bhavyams-vendorhub-backend.onrender.com/api/products/vendor/stats', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setStats(res.data);
            } catch (err) {
                console.error("Dashboard Stats Error:", err);
            }
        };
        fetchStats();
    }, []);

    return (
        <div style={{ padding: '20px' }}>
            <h2 style={{ marginBottom: '20px', fontWeight: '900', color: '#0f172a' }}>Vendor Overview</h2>
            
            <div style={styles.grid}>
                <div style={{ ...styles.card, borderLeft: '5px solid #10b981' }}>
                    <DollarSign color="#10b981" />
                    <p style={styles.label}>Total Revenue</p>
                    <h3 style={styles.value}>₹{Number(stats.revenue).toLocaleString('en-IN')}</h3>
                </div>

                <div style={{ ...styles.card, borderLeft: '5px solid #3b82f6' }}>
                    <ShoppingBag color="#3b82f6" />
                    <p style={styles.label}>Total Orders</p>
                    <h3 style={styles.value}>{stats.orders}</h3>
                </div>

                <div style={{ ...styles.card, borderLeft: '5px solid #8b5cf6' }}>
                    <Package color="#8b5cf6" />
                    <p style={styles.label}>My Products</p>
                    <h3 style={styles.value}>{stats.products}</h3>
                </div>
            </div>
        </div>
    );
};

const styles = {
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' },
    card: { background: '#fff', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', textAlign: 'center' },
    label: { fontSize: '12px', fontWeight: '800', color: '#64748b', margin: '10px 0 5px', textTransform: 'uppercase' },
    value: { fontSize: '28px', fontWeight: '900', color: '#1e293b', margin: 0 }
};

export default VendorDashboard;