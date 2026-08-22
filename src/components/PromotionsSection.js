import React from 'react';
import { Sparkles, ShieldCheck, Printer, ArrowRight } from 'lucide-react';

const PromotionsSection = () => (
    <div style={{ padding: '10px 0 30px 0' }}>
        
        {/* PREMIUM EXPO HEADER */}
        <div style={{ textAlign: 'center', marginBottom: '30px', padding: '20px', background: 'linear-gradient(135deg, #0f172a, #1e293b)', borderRadius: '16px', border: '1px solid #334155', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
            <Sparkles size={32} color="#facc15" style={{ marginBottom: '10px' }} />
            <h2 style={{ color: '#ffffff', margin: '0 0 10px 0', fontSize: '24px', letterSpacing: '1px' }}>
                Subhams <span style={{ color: '#facc15' }}>Expo</span>
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '14px', margin: 0 }}>Discover our premium suite of smart applications.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            
            {/* 🟢 PMMS - PREMIUM CARD */}
            <div style={{...styles.card, background: 'linear-gradient(145deg, #f0fdf4, #dcfce7)', border: '1px solid #86efac'}}>
                <div style={styles.iconWrapperGreen}>
                    <ShieldCheck size={32} color="#16a34a" />
                </div>
                <h3 style={{ color: '#166534', margin: '15px 0 5px 0', fontSize: '20px', fontWeight: '900' }}>Subhams PMMS</h3>
                <p style={{ color: '#15803d', fontSize: '13px', marginBottom: '25px', fontWeight: '500' }}>
                    Next-generation Personal Money Management System. Track, secure, and grow your wealth.
                </p>
                <a href="https://pmms.subhamsnetworks.in/" target="_blank" rel="noopener noreferrer" style={styles.btnGreen}>
                    Launch PMMS <ArrowRight size={16} />
                </a>
            </div>

            {/* 🟣 AGENT - PREMIUM CARD */}
            <div style={{...styles.card, background: 'linear-gradient(145deg, #f5f3ff, #e0e7ff)', border: '1px solid #c4b5fd'}}>
                <div style={styles.iconWrapperPurple}>
                    <Printer size={32} color="#7c3aed" />
                </div>
                <h3 style={{ color: '#4c1d95', margin: '15px 0 5px 0', fontSize: '20px', fontWeight: '900' }}>Subhams Agent</h3>
                <p style={{ color: '#6b21a8', fontSize: '13px', marginBottom: '25px', fontWeight: '500' }}>
                    Enterprise-grade Secure Cloud Printing Network. Connect and print from anywhere.
                </p>
                <a href="https://agent.subhamsnetworks.in/" target="_blank" rel="noopener noreferrer" style={styles.btnPurple}>
                    Launch Agent <ArrowRight size={16} />
                </a>
            </div>

        </div>
    </div>
);

const styles = {
    card: { 
        padding: '30px 20px', 
        borderRadius: '20px', 
        textAlign: 'center', 
        boxShadow: '0 10px 25px rgba(0,0,0,0.05)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        transition: 'transform 0.2s, box-shadow 0.2s'
    },
    iconWrapperGreen: {
        background: '#ffffff', padding: '15px', borderRadius: '50%', boxShadow: '0 8px 15px rgba(22, 163, 74, 0.2)', marginBottom: '10px'
    },
    iconWrapperPurple: {
        background: '#ffffff', padding: '15px', borderRadius: '50%', boxShadow: '0 8px 15px rgba(124, 58, 237, 0.2)', marginBottom: '10px'
    },
    btnGreen: { 
        display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', 
        background: '#16a34a', color: 'white', padding: '12px 25px', borderRadius: '12px', 
        textDecoration: 'none', fontWeight: '800', width: '100%', boxSizing: 'border-box',
        boxShadow: '0 4px 10px rgba(22, 163, 74, 0.3)'
    },
    btnPurple: { 
        display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', 
        background: '#7c3aed', color: 'white', padding: '12px 25px', borderRadius: '12px', 
        textDecoration: 'none', fontWeight: '800', width: '100%', boxSizing: 'border-box',
        boxShadow: '0 4px 10px rgba(124, 58, 237, 0.3)'
    }
};

export default PromotionsSection;