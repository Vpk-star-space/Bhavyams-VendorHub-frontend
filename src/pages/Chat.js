import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircleOff, ArrowLeft } from 'lucide-react';

const Chat = () => {
const navigate = useNavigate();

return (
    <div style={styles.page}>
        <div style={styles.card}>
            <div style={styles.iconWrapper}>
                <MessageCircleOff size={34} strokeWidth={1.6} />
            </div>

            <div style={styles.badge}>
                <span style={styles.dot} />
                TEMPORARILY UNAVAILABLE
            </div>

            <h1 style={styles.title}>
                Messaging &amp; Calling
            </h1>

            <p style={styles.description}>
                Messaging and calling are temporarily unavailable
                on Subhams Hub. Thank you for your patience and
                understanding.
            </p>

            <div style={styles.divider} />

            <p style={styles.brand}>
                <span style={styles.brandName}>SUBHAMS HUB</span>
                <span style={styles.brandTagline}>
                    Transforming Ideas into Intelligent Solutions
                </span>
            </p>

            <button
                type="button"
                onClick={() => navigate(-1)}
                style={styles.backButton}
            >
                <ArrowLeft size={18} />
                <span>Go Back</span>
            </button>
        </div>
    </div>
);

};

const styles = {
page: {
minHeight: '100vh',
minHeight: '100dvh',
boxSizing: 'border-box',
display: 'flex',
alignItems: 'center',
justifyContent: 'center',
padding: '24px',
background: '#f8fafc',
fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
},

card: {
    width: '100%',
    maxWidth: '400px',
    boxSizing: 'border-box',
    padding: '36px 26px 28px',
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '22px',
    boxShadow: '0 12px 40px rgba(15, 23, 42, 0.07)',
    textAlign: 'center'
},

iconWrapper: {
    width: '76px',
    height: '76px',
    margin: '0 auto 22px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '22px',
    background: '#fff7ed',
    color: '#c2410c',
    border: '1px solid #fed7aa'
},

badge: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '7px',
    padding: '7px 11px',
    borderRadius: '20px',
    background: '#fff7ed',
    color: '#9a3412',
    fontSize: '10px',
    fontWeight: '700',
    letterSpacing: '0.7px'
},

dot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    background: '#ea580c',
    flexShrink: 0
},

title: {
    margin: '22px 0 12px',
    color: '#0f172a',
    fontSize: '24px',
    lineHeight: '1.3',
    fontWeight: '750',
    letterSpacing: '-0.6px'
},

description: {
    margin: '0',
    color: '#64748b',
    fontSize: '14px',
    lineHeight: '1.8'
},

divider: {
    height: '1px',
    background: '#e2e8f0',
    margin: '26px 0 20px'
},

brand: {
    display: 'flex',
    flexDirection: 'column',
    gap: '7px',
    margin: '0 0 24px'
},

brandName: {
    color: '#1e293b',
    fontSize: '12px',
    fontWeight: '800',
    letterSpacing: '2px'
},

brandTagline: {
    color: '#94a3b8',
    fontSize: '11px',
    lineHeight: '1.6'
},

backButton: {
    width: '100%',
    minHeight: '46px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '9px',
    padding: '12px 20px',
    background: '#0f172a',
    color: '#ffffff',
    border: 'none',
    borderRadius: '12px',
    fontSize: '14px',
    fontWeight: '650',
    cursor: 'pointer'
}

};

export default Chat;