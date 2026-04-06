import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Trash2, ShieldCheck, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'react-toastify';

const AdminUserList = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
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

    // 🛡️ Helper to apply the right badge style based on role
    const getRoleBadgeStyle = (role) => {
        if (!role) return styles.userBadge;
        switch (role.toLowerCase()) {
            case 'admin': return styles.adminBadge;
            case 'vendor': return styles.vendorBadge;
            default: return styles.userBadge;
        }
    };

    if (loading) return <p style={{textAlign: 'center', padding: '20px', color: '#64748b'}}>Loading platform users...</p>;

    return (
        <div style={styles.container}>
            <h4 style={{marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px'}}>
                <ShieldCheck size={20} color="#3b82f6"/> Platform Users
            </h4>
            <div style={{overflowX: 'auto'}}>
                <table style={styles.table}>
                    <thead>
                        <tr style={styles.headerRow}>
                            <th style={styles.th}>ID</th>
                            <th style={styles.th}>Username</th>
                            <th style={styles.th}>Email</th>
                            <th style={styles.th}>Role</th>
                            <th style={styles.th}>Status</th> 
                            <th style={styles.th}>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(u => (
                            <tr key={u.id} style={styles.tr}>
                                <td style={styles.td}>
                                    <span style={{color: '#94a3b8', fontSize: '12px'}}>#{u.id}</span>
                                </td>
                                <td style={styles.td}>
                                    <div style={{fontWeight: '600', color: '#0f172a'}}>{u.username}</div>
                                </td>
                                <td style={styles.td}>{u.email}</td>
                                <td style={styles.td}>
                                    <span style={getRoleBadgeStyle(u.role)}>
                                        {u.role?.toUpperCase() || 'USER'}
                                    </span>
                                </td>
                                <td style={styles.td}>
                                    {u.is_verified ? (
                                        <div style={{display:'flex', alignItems:'center', gap:'4px', color:'#10b981', fontSize:'12px', fontWeight:'600'}}>
                                            <CheckCircle size={14}/> Verified
                                        </div>
                                    ) : (
                                        <div style={{display:'flex', alignItems:'center', gap:'4px', color:'#f59e0b', fontSize:'12px', fontWeight:'600'}}>
                                            <XCircle size={14}/> Pending
                                        </div>
                                    )}
                                </td>
                                <td style={styles.td}>
                                    <button onClick={() => deleteUser(u.id)} style={styles.delBtn} title="Delete User">
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
    container: { marginTop: '20px', background: '#fff', padding: '25px', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' },
    table: { width: '100%', borderCollapse: 'collapse' },
    headerRow: { textAlign: 'left', borderBottom: '2px solid #f1f5f9' },
    th: { padding: '15px 10px', color: '#64748b', fontSize: '13px', fontWeight: '600' },
    td: { padding: '15px 10px', fontSize: '14px', color: '#1e293b', verticalAlign: 'middle' },
    tr: { borderBottom: '1px solid #f1f5f9', transition: '0.2s' },
    
    // Role Badges
    adminBadge: { background: '#fef3c7', color: '#92400e', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold' },
    vendorBadge: { background: '#f3e8ff', color: '#1e40af', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold' }, // Added Vendor styling
    userBadge: { background: '#e0f2fe', color: '#0369a1', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold' },
    
    delBtn: { border: 'none', background: '#fee2e2', color: '#ef4444', cursor: 'pointer', padding: '6px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: '0.3s' }
};

export default AdminUserList;