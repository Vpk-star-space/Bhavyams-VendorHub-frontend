import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { socket } from '../context/AppContext';
import { BellRing, X, MessageCircle } from 'lucide-react';

const GlobalAlert = () => {
    const [alertData, setAlertData] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        // Listen for urgent messages or calls from the server
        const handleUrgentAlert = (data) => {
            // Play a ringing sound if you have one
            // const audio = new Audio('/ringtone.mp3'); 
            // audio.play().catch(e => console.log(e));

            setAlertData(data);
        };

        socket.on('urgent_popup', handleUrgentAlert);

        return () => {
            socket.off('urgent_popup', handleUrgentAlert);
        };
    }, []);

    if (!alertData) return null;

    return (
        <div style={styles.overlay}>
            <div style={styles.popupCard}>
                <div style={styles.iconRing}>
                    <BellRing size={32} color="#16a34a" />
                </div>
                <h2 style={{ margin: '15px 0 5px 0', color: '#0f172a' }}>{alertData.title}</h2>
                <p style={{ margin: '0 0 20px 0', color: '#475569', fontSize: '14px' }}>{alertData.body}</p>
                
                <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
                    <button 
                        style={{ ...styles.btn, background: '#e2e8f0', color: '#0f172a' }} 
                        onClick={() => setAlertData(null)}
                    >
                        <X size={18} /> Ignore
                    </button>
                    <button 
                        style={{ ...styles.btn, background: '#16a34a', color: 'white' }} 
                        onClick={() => {
                            setAlertData(null);
                            if (alertData.url) navigate(alertData.url);
                        }}
                    >
                        <MessageCircle size={18} /> View Now
                    </button>
                </div>
            </div>
        </div>
    );
};

const styles = {
    overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, padding: '20px' },
    popupCard: { background: 'white', padding: '30px 20px', borderRadius: '24px', width: '100%', maxWidth: '350px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', animation: 'popIn 0.3s ease-out' },
    iconRing: { background: '#dcfce7', padding: '20px', borderRadius: '50%', animation: 'pulseRing 1.5s infinite' },
    btn: { flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', padding: '14px', border: 'none', borderRadius: '12px', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer' }
};

export default GlobalAlert;