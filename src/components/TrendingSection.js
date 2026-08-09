import React, { useEffect, useState } from 'react';
import { Store } from 'lucide-react';

// 🟢 Added 'navigate' to the props here
const TrendingSection = ({ vendors, navigate, t }) => {
    const [current, setCurrent] = useState(0);

    const otherApps = [
        { title: "Subhams PMMS", desc: t("Track finances securely."), bg: "linear-gradient(135deg, #064e3b 0%, #10b981 100%)", icon: "💰", link: "https://pmms.subhamsnetworks.in/" },
        { title: "Secure Agent", desc: t("Cloud Printing Network."), bg: "linear-gradient(135deg, #4c1d95 0%, #8b5cf6 100%)", icon: "🖨️", link: "https://agent.subhamsnetworks.in/" }
    ];

    useEffect(() => {
        const timer = setInterval(() => setCurrent(p => (p + 1) % otherApps.length), 4000);
        return () => clearInterval(timer);
    }, [otherApps.length]);

    const isMobile = window.innerWidth < 768;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '30px' }}>
            
            {/* 🥇 1st BANNER: Subhams Hub */}
            <div style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)', borderRadius: '16px', padding: '25px', color: 'white', display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: 'center', justifyContent: 'space-between', gap: '20px', boxShadow: '0 4px 15px rgba(37,99,235,0.2)' }}>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                    <div style={{ fontSize: '50px', marginRight: '15px' }}>🏪</div>
                    <div>
                        <h2 style={{ margin: '0 0 5px 0', fontSize: '26px', fontWeight: '900' }}>{t("Subhams Hub")}</h2>
                        <p style={{ margin: 0, fontSize: '14px', opacity: 0.9 }}>{t("The Ultimate Local Marketplace.")}</p>
                    </div>
                </div>
            </div>

            {/* 🥈 2nd BANNER: Ecosystem Slider */}
            <div style={{ position: 'relative', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 10px rgba(0,0,0,0.1)', height: '110px' }}>
                <div style={{ display: 'flex', height: '100%', transition: 'transform 0.6s ease', transform: `translateX(-${current * 100}%)` }}>
                    {otherApps.map((b, idx) => (
                        <div key={idx} onClick={() => window.open(b.link, '_blank')} 
                             style={{ minWidth: '100%', height: '100%', background: b.bg, padding: '20px', color: 'white', display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                            <div style={{ fontSize: '40px', marginRight: '20px' }}>{b.icon}</div>
                            <div>
                                <p style={{ margin: '0 0 2px 0', fontSize: '10px', fontWeight: 'bold', letterSpacing: '1px', opacity: 0.8 }}>{t("OUR ECOSYSTEM")}</p>
                                <h3 style={{ margin: '0 0 4px 0', fontSize: '20px', fontWeight: 'bold' }}>{b.title}</h3>
                                <p style={{ margin: 0, fontSize: '13px', opacity: 0.9 }}>{b.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* 🏪 LOCAL BUSINESSES */}
            <div style={{ marginTop: '10px' }}>
                <h3 style={{ margin: '0 0 15px 0', color: '#1e293b', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Store size={20} color="#2874f0" /> {t("Active Local Shops")}
                </h3>
                {vendors.length === 0 ? (
                    <div style={{ padding: '20px', textAlign: 'center', background: '#fff', borderRadius: '12px', border: '1px dashed #cbd5e1', fontSize: '14px', color: '#64748b' }}>
                        {t("No local shops are active in your specific area right now.")}
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '15px' }}>
                        {vendors.map(vendor => (
                            <div 
                                key={vendor.id} 
                                // 🟢 CLICK TO OPEN SHOP PROFILE
                                onClick={() => navigate(`/shop/${vendor.id}`)} 
                                style={{ background: '#fff', padding: '15px', borderRadius: '12px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '15px', border: '1px solid #e2e8f0', cursor: 'pointer', transition: 'transform 0.2s' }}
                                onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                                onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                            >
                                <div style={{ fontSize: '30px', background: '#f8fafc', padding: '10px', borderRadius: '12px' }}>🏪</div>
                                <div>
                                    <h4 style={{ margin: '0 0 4px 0', color: '#0f172a', fontSize: '15px' }}>{vendor.business_name}</h4>
                                    <span style={{ fontSize: '11px', background: '#eff6ff', color: '#2563eb', padding: '3px 8px', borderRadius: '4px', fontWeight: 'bold' }}>
                                        {vendor.distance ? `${vendor.distance.toFixed(1)} ${t("km away")}` : t("Nearby")}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default TrendingSection;