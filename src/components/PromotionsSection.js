import React from 'react';

const PromotionsSection = () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <div style={{ background: '#f0fdf4', border: '2px solid #16a34a', padding: '30px', borderRadius: '16px', textAlign: 'center' }}>
            <span style={{ fontSize: '50px' }}>💰</span>
            <h2 style={{ color: '#166534', margin: '15px 0 10px 0' }}>Subhams PMMS</h2>
            <p style={{ color: '#15803d', fontSize: '14px', marginBottom: '20px' }}>Personal Money Management System.</p>
            <a href="https://pmms.subhamsnetworks.in/" target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', background: '#16a34a', color: 'white', padding: '12px 25px', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold' }}>Open App</a>
        </div>
        <div style={{ background: '#f5f3ff', border: '2px solid #9333ea', padding: '30px', borderRadius: '16px', textAlign: 'center' }}>
            <span style={{ fontSize: '50px' }}>🖨️</span>
            <h2 style={{ color: '#5b21b6', margin: '15px 0 10px 0' }}>Subhams Agent</h2>
            <p style={{ color: '#6b21a8', fontSize: '14px', marginBottom: '20px' }}>Secure Cloud Printing Network.</p>
            <a href="https://agent.subhamsnetworks.in/" target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', background: '#9333ea', color: 'white', padding: '12px 25px', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold' }}>Open App</a>
        </div>
    </div>
);

export default PromotionsSection;