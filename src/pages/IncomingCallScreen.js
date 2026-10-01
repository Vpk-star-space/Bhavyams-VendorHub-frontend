import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Phone, PhoneOff, User } from 'lucide-react';
import { socket } from '../context/AppContext';

const IncomingCallScreen = () => {
    const navigate = useNavigate();
    const location = useLocation();
    
    // Extract caller info from the URL (passed by the Service Worker)
    const queryParams = new URLSearchParams(location.search);
    const callerName = queryParams.get('callerName') || 'Incoming Call...';
    const conversationId = queryParams.get('roomId');
    const type = queryParams.get('type') || 'message'; // 'call' or 'message'

    const [isRinging, setIsRinging] = useState(true);

    useEffect(() => {
        // Play loud ringtone continuously
        const ringtone = new Audio('/ringtone.mp3'); // We need to add this file to public folder
        ringtone.loop = true;
        
        // Attempt to play (browsers require user interaction first usually, 
        // but it works better in installed PWAs)
        ringtone.play().catch(e => console.log("Auto-play blocked by browser."));

        // If the caller hangs up before we answer, close the screen
        const handleCancel = () => {
            setIsRinging(false);
            ringtone.pause();
            navigate('/');
        };
        
        socket.on('call_cancelled', handleCancel);

        // Auto-reject after 30 seconds
        const timeout = setTimeout(() => {
            handleDecline();
        }, 30000);

        return () => {
            ringtone.pause();
            socket.off('call_cancelled', handleCancel);
            clearTimeout(timeout);
        };
    }, [navigate]);

    const handleAnswer = () => {
        setIsRinging(false);
        // Navigate to the actual chat or call room
        if (type === 'message' && conversationId) {
            navigate(`/chat/${conversationId}`);
        } else {
            // For future voice calls
            navigate(`/call/${conversationId}`);
        }
    };

    const handleDecline = () => {
        setIsRinging(false);
        // Tell backend we declined
        socket.emit('call_declined', { roomId: conversationId });
        // Close window if it was opened by Service worker, or go home
        if (window.history.length > 1) {
            navigate(-1);
        } else {
            window.close();
            navigate('/');
        }
    };

    return (
        <div style={styles.fullscreen}>
            <style>{`
                @keyframes pulse-ring {
                    0% { transform: scale(0.8); opacity: 0.5; }
                    50% { transform: scale(1.2); opacity: 0; }
                    100% { transform: scale(0.8); opacity: 0.5; }
                }
                .pulse-bg {
                    position: absolute;
                    width: 150px; height: 150px;
                    background: #2563eb;
                    border-radius: 50%;
                    z-index: 0;
                    animation: pulse-ring 1.5s infinite ease-out;
                }
            `}</style>
            
            <div style={styles.topSection}>
                <h2 style={styles.title}>{type === 'call' ? 'Incoming Voice Call' : 'Urgent Shop Alert'}</h2>
            </div>

            <div style={styles.avatarSection}>
                <div className="pulse-bg"></div>
                <div style={styles.avatarCircle}>
                    <User size={60} color="white" />
                </div>
                <h1 style={styles.callerName}>{callerName}</h1>
                <p style={styles.statusText}>{isRinging ? 'Ringing...' : 'Connecting...'}</p>
            </div>

            <div style={styles.actionButtons}>
                <button onClick={handleDecline} style={{...styles.btn, background: '#ef4444'}}>
                    <PhoneOff size={32} color="white" />
                </button>
                
                <button onClick={handleAnswer} style={{...styles.btn, background: '#22c55e', animation: 'bounce 1s infinite'}}>
                    <Phone size={32} color="white" style={{ animation: 'shake 0.5s infinite' }} />
                </button>
            </div>
        </div>
    );
};

const styles = {
    fullscreen: { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', zIndex: 999999, color: 'white' },
    topSection: { padding: '40px 20px', textAlign: 'center' },
    title: { fontSize: '18px', fontWeight: '500', color: '#94a3b8', margin: 0, letterSpacing: '1px', textTransform: 'uppercase' },
    avatarSection: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative' },
    avatarCircle: { width: '120px', height: '120px', background: '#3b82f6', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1, boxShadow: '0 10px 25px rgba(0,0,0,0.5)' },
    callerName: { fontSize: '32px', fontWeight: 'bold', margin: '20px 0 5px 0', zIndex: 1, textShadow: '0 2px 4px rgba(0,0,0,0.5)' },
    statusText: { fontSize: '16px', color: '#94a3b8', zIndex: 1 },
    actionButtons: { display: 'flex', justifyContent: 'space-around', padding: '40px 20px', paddingBottom: 'max(40px, env(safe-area-inset-bottom))' },
    btn: { width: '70px', height: '70px', borderRadius: '50%', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 10px 20px rgba(0,0,0,0.3)', transition: 'transform 0.1s' }
};

export default IncomingCallScreen;