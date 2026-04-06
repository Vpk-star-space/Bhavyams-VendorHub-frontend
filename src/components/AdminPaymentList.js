import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { CreditCard, CheckCircle } from 'lucide-react';
import { toast } from 'react-toastify';

const AdminPaymentList = () => {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPayments = async () => {
            try {
                const token = localStorage.getItem('token');
                // 🛡️ Ensure this endpoint matches your backend exactly
                const res = await axios.get('https://bhavyams-vendorhub-backend.onrender.com/api/auth/admin/all-payments', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setPayments(res.data);
            } catch (err) {
                toast.error("Failed to load payment logs");
            } finally {
                setLoading(false);
            }
        };
        fetchPayments();
    }, []);

    if (loading) return <p style={{textAlign: 'center', padding: '20px', color: '#64748b'}}>Fetching transaction logs...</p>;

    return (
        <div style={styles.container}>
            <h4 style={{marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px'}}>
                <CreditCard size={20} color="#f59e0b"/> Razorpay Transactions
            </h4>
            {payments.length === 0 ? (
                <p style={{textAlign:'center', color:'#94a3b8', padding: '20px'}}>No successful payments found yet.</p>
            ) : (
                <div style={{overflowX: 'auto'}}>
                    <table style={styles.table}>
                        <thead>
                            <tr style={styles.headerRow}>
                                <th style={styles.th}>Transaction ID</th>
                                <th style={styles.th}>Amount</th>
                                <th style={styles.th}>Date</th>
                                <th style={styles.th}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {payments.map(pay => (
                                <tr key={pay.id} style={styles.tr}>
                                    {/* 🛡️ SYSTEM FIX: Mapped to actual DB columns */}
                                    <td style={styles.td}>
                                        <span style={{background: '#f1f5f9', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontFamily: 'monospace'}}>
                                            {pay.payment_id || `SYS-${pay.id}`}
                                        </span>
                                    </td> 
                                    
                                    <td style={styles.td}>
                                        <span style={{fontWeight: 'bold', color: '#0f172a'}}>
                                            ₹{pay.total_price || pay.amount || '0'}
                                        </span>
                                    </td>
                                    
                                    <td style={styles.td}>
                                        {new Date(pay.created_at).toLocaleDateString('en-IN', {
                                            day: 'numeric', month: 'short', year: 'numeric'
                                        })}
                                    </td>
                                    
                                    <td style={styles.td}>
                                        <div style={{display: 'flex', alignItems: 'center', gap: '5px', color: '#10b981', fontWeight: 'bold', fontSize: '13px'}}>
                                            <CheckCircle size={14}/> Paid
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

const styles = {
    container: { background: '#fff', padding: '25px', borderRadius: '16px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' },
    table: { width: '100%', borderCollapse: 'collapse' },
    headerRow: { textAlign: 'left', borderBottom: '1px solid #f1f5f9' },
    th: { padding: '15px 12px', color: '#64748b', fontSize: '13px', fontWeight: '600' },
    td: { padding: '15px 12px', fontSize: '14px', color: '#1e293b' },
    tr: { borderBottom: '1px solid #f8fafc' }
};

export default AdminPaymentList;