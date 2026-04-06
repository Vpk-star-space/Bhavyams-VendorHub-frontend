import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { CreditCard, CheckCircle, Calendar, Hash } from 'lucide-react';
import { toast } from 'react-toastify';

const AdminPaymentList = () => {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);

        const fetchPayments = async () => {
            try {
                const token = localStorage.getItem('token');
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
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const formatDate = (dateString) => {
        if (!dateString) return "Date Unknown";
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: 'numeric', month: 'short', year: 'numeric'
        });
    };

    if (loading) return <div style={styles.loader}>Fetching transaction logs...</div>;

    return (
        <div style={isMobile ? styles.mobileContainer : styles.container}>
            <h4 style={styles.title}>
                <CreditCard size={22} color="#f59e0b"/> Razorpay Transactions
            </h4>

            {payments.length === 0 ? (
                <div style={styles.noData}>No successful payments found yet.</div>
            ) : (
                isMobile ? (
                    /* 📱 MOBILE VIEW: PAYMENT CARDS */
                    <div style={styles.cardGrid}>
                        {payments.map(pay => (
                            <div key={pay.id} style={styles.paymentCard}>
                                <div style={styles.cardTop}>
                                    <div style={styles.txnIdBox}>
                                        <Hash size={12} /> {pay.payment_id || `SYS-${pay.id}`}
                                    </div>
                                    <div style={styles.paidBadge}><CheckCircle size={12}/> PAID</div>
                                </div>
                                <div style={styles.cardMain}>
                                    <div style={styles.amountText}>₹{pay.total_price || pay.amount || '0'}</div>
                                    <div style={styles.dateText}><Calendar size={12}/> {formatDate(pay.created_at)}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    /* 💻 DESKTOP VIEW: TABLE */
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
                                        <td style={styles.td}>
                                            <span style={styles.txnBadge}>{pay.payment_id || `SYS-${pay.id}`}</span>
                                        </td> 
                                        <td style={styles.td}>
                                            <span style={{fontWeight: '800', color: '#0f172a'}}>₹{pay.total_price || pay.amount || '0'}</span>
                                        </td>
                                        <td style={styles.td}>{formatDate(pay.created_at)}</td>
                                        <td style={styles.td}>
                                            <div style={styles.statusRow}><CheckCircle size={14}/> Paid</div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )
            )}
        </div>
    );
};

const styles = {
    container: { background: '#fff', padding: '30px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' },
    mobileContainer: { padding: '5px 0' },
    title: { marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '18px', fontWeight: '900' },
    loader: { textAlign: 'center', padding: '50px', color: '#64748b', fontWeight: 'bold' },
    noData: { textAlign: 'center', color: '#94a3b8', padding: '40px', background: '#fff', borderRadius: '12px' },
    
    // Desktop Styles
    table: { width: '100%', borderCollapse: 'collapse' },
    headerRow: { textAlign: 'left', borderBottom: '2px solid #f1f5f9' },
    th: { padding: '15px 12px', color: '#64748b', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' },
    td: { padding: '15px 12px', fontSize: '14px', color: '#1e293b' },
    tr: { borderBottom: '1px solid #f8fafc' },
    txnBadge: { background: '#f1f5f9', padding: '5px 10px', borderRadius: '6px', fontSize: '12px', fontFamily: 'monospace', fontWeight: '600' },
    statusRow: { display: 'flex', alignItems: 'center', gap: '5px', color: '#10b981', fontWeight: 'bold', fontSize: '13px' },

    // 📱 Mobile Styles
    cardGrid: { display: 'flex', flexDirection: 'column', gap: '12px' },
    paymentCard: { background: '#fff', padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' },
    cardTop: { display: 'flex', justifyContent: 'space-between', marginBottom: '10px' },
    txnIdBox: { fontSize: '11px', color: '#64748b', fontFamily: 'monospace', background: '#f8fafc', padding: '2px 8px', borderRadius: '4px' },
    paidBadge: { color: '#10b981', fontSize: '10px', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '3px' },
    cardMain: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    amountText: { fontSize: '20px', fontWeight: '900', color: '#0f172a' },
    dateText: { fontSize: '12px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }
};

export default AdminPaymentList;