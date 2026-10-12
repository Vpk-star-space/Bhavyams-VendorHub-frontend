import React, { useState } from 'react';
import { Bell, ShieldCheck } from 'lucide-react';
import NotificationDropdown from './NotificationDropdown'; // Make sure this path is correct

const Navbar = () => {
    const [showNotifications, setShowNotifications] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    return (
        <nav style={styles.navbar}>
            {/* Left Side: Brand Logo */}
            <div style={styles.brand}>
                <ShieldCheck size={28} color="#2563eb" />
                <h2 style={styles.brandText}>Subhams Hub Admin</h2>
            </div>

            {/* Right Side: Notification Bell & Profile */}
            <div style={styles.rightSection}>
                
                {/* 🔔 The Notification Bell */}
                <div style={{ position: 'relative' }}>
                    <button 
                        onClick={() => setShowNotifications(!showNotifications)}
                        style={styles.bellButton}
                    >
                        <Bell size={24} color="#334155" />
                        
                        {/* Red Dot Unread Counter */}
                        {unreadCount > 0 && (
                            <span style={styles.redDot}>
                                {unreadCount > 99 ? '99+' : unreadCount}
                            </span>
                        )}
                    </button>

                    {/* The Dropdown Menu */}
                    {showNotifications && (
                        <NotificationDropdown 
                            onClose={() => setShowNotifications(false)} 
                            unreadCount={unreadCount} 
                            setUnreadCount={setUnreadCount} 
                        />
                    )}
                </div>

                {/* Dummy Profile Avatar for looks */}
                <div style={styles.avatar}>Admin</div>
            </div>
        </nav>
    );
};

const styles = {
    navbar: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '15px 30px',
        background: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
        position: 'sticky',
        top: 0,
        zIndex: 900
    },
    brand: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
    },
    brandText: {
        margin: 0,
        fontSize: '20px',
        color: '#0f172a',
        fontWeight: 'bold'
    },
    rightSection: {
        display: 'flex',
        alignItems: 'center',
        gap: '20px'
    },
    bellButton: {
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        position: 'relative',
        padding: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '50%',
        transition: 'background 0.2s'
    },
    redDot: {
        position: 'absolute',
        top: '2px',
        right: '2px',
        background: '#ef4444',
        color: 'white',
        fontSize: '10px',
        fontWeight: 'bold',
        width: '18px',
        height: '18px',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '2px solid white'
    },
    avatar: {
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        background: '#1e3a8a',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 'bold',
        fontSize: '12px'
    }
};

export default Navbar;