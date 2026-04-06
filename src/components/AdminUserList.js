import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Trash2, ShieldCheck, CheckCircle, XCircle,  Mail, } from 'lucide-react';
import { toast } from 'react-toastify';

const AdminUserList = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        
        const fetchUsers = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get('https://bhavyams-vendorhub-backend.onrender.com/api/auth/all-users', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setUsers(res.data);
            } catch (err) {
                toast.error("Failed to load users");
            } finally {
                setLoading(false);
            }
        };
        fetchUsers();
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const deleteUser = async (id) => {
        if (window.confirm("Are you sure? All user data will be deleted.")) {
            try {
                const token = localStorage.getItem('token');
                await axios.delete(`https://bhavyams-vendorhub-backend.onrender.com/api/auth/delete-user/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setUsers(users.filter(u => u.id !== id));
                toast.success("User deleted successfully");
            } catch (err) {
                toast.error(err.response?.data?.message || "Error deleting user");
            }
        }
    };

    const getRoleBadgeStyle = (role) => {
        const base = styles.badgeBase;
        switch (role?.toLowerCase()) {
            case 'admin': return { ...base, background: '#fef3c7', color: '#92400e' };
            case 'vendor': return { ...base, background: '#f3e8ff', color: '#6b21a8' };
            default: return { ...base, background: '#e0f2fe', color: '#0369a1' };
        }
    };

    if (loading) return <div style={styles.loader}>Loading platform users...</div>;

    return (
        <div style={isMobile ? styles.mobileContainer : styles.container}>
            <h4 style={styles.title}>
                <ShieldCheck size={22} color="#3b82f6"/> Platform Management
            </h4>

            {isMobile ? (
                /* 📱 MOBILE VIEW: CARDS */
                <div style={styles.cardGrid}>
                    {users.map(u => (
                        <div key={u.id} style={styles.userCard}>
                            <div style={styles.cardHeader}>
                                <div style={styles.userInfo}>
                                    <div style={styles.avatar}>{u.username.charAt(0).toUpperCase()}</div>
                                    <div>
                                        <div style={styles.cardName}>{u.username}</div>
                                        <div style={styles.cardId}>ID: #{u.id}</div>
                                    </div>
                                </div>
                                <button onClick={() => deleteUser(u.id)} style={styles.delBtnMobile}>
                                    <Trash2 size={18}/>
                                </button>
                            </div>
                            
                            <div style={styles.cardBody}>
                                <div style={styles.cardRow}><Mail size={14}/> {u.email}</div>
                                <div style={styles.cardRow}>
                                    <span style={getRoleBadgeStyle(u.role)}>{u.role?.toUpperCase()}</span>
                                    {u.is_verified ? (
                                        <span style={styles.verified}><CheckCircle size={14}/> Verified</span>
                                    ) : (
                                        <span style={styles.pending}><XCircle size={14}/> Pending</span>
                                    )}
                                </div>
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
                                <th style={styles.th}>User Details</th>
                                <th style={styles.th}>Email Address</th>
                                <th style={styles.th}>Role</th>
                                <th style={styles.th}>Status</th>
                                <th style={styles.th}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(u => (
                                <tr key={u.id} style={styles.tr}>
                                    <td style={styles.td}>
                                        <div style={{fontWeight: '700'}}>{u.username}</div>
                                        <div style={{fontSize: '11px', color: '#94a3b8'}}>#{u.id}</div>
                                    </td>
                                    <td style={styles.td}>{u.email}</td>
                                    <td style={styles.td}>
                                        <span style={getRoleBadgeStyle(u.role)}>{u.role?.toUpperCase()}</span>
                                    </td>
                                    <td style={styles.td}>
                                        {u.is_verified ? 
                                            <span style={{color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px'}}><CheckCircle size={14}/> Verified</span> : 
                                            <span style={{color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '4px'}}><XCircle size={14}/> Pending</span>
                                        }
                                    </td>
                                    <td style={styles.td}>
                                        <button onClick={() => deleteUser(u.id)} style={styles.delBtn}><Trash2 size={16}/></button>
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
    container: { marginTop: '20px', background: '#fff', padding: '30px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' },
    mobileContainer: { padding: '10px 0' },
    title: { marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '18px', fontWeight: '800' },
    loader: { textAlign: 'center', padding: '50px', color: '#64748b', fontWeight: 'bold' },
    
    // Desktop Styles
    table: { width: '100%', borderCollapse: 'collapse' },
    headerRow: { textAlign: 'left', borderBottom: '2px solid #f1f5f9' },
    th: { padding: '15px 10px', color: '#64748b', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' },
    td: { padding: '15px 10px', fontSize: '14px', color: '#1e293b' },
    tr: { borderBottom: '1px solid #f1f5f9' },
    badgeBase: { padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '900' },
    delBtn: { border: 'none', background: '#fee2e2', color: '#ef4444', cursor: 'pointer', padding: '8px', borderRadius: '8px' },

    // 📱 Mobile Card Styles
    cardGrid: { display: 'flex', flexDirection: 'column', gap: '15px' },
    userCard: { background: '#fff', borderRadius: '12px', padding: '15px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' },
    cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' },
    userInfo: { display: 'flex', gap: '12px', alignItems: 'center' },
    avatar: { width: '40px', height: '40px', borderRadius: '50%', background: '#2874f0', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '18px' },
    cardName: { fontWeight: '800', fontSize: '16px', color: '#0f172a' },
    cardId: { fontSize: '11px', color: '#94a3b8' },
    cardBody: { display: 'flex', flexDirection: 'column', gap: '8px' },
    cardRow: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#475569' },
    delBtnMobile: { background: '#ef4444', color: '#fff', border: 'none', padding: '8px', borderRadius: '8px' },
    verified: { color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: '700' },
    pending: { color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: '700' }
};

export default AdminUserList;