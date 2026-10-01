import React, { useState, useEffect, useRef, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { socket, AppContext } from '../context/AppContext';
import { ArrowLeft, Send, ShieldAlert, Loader } from 'lucide-react';
import { toast } from 'react-toastify';

const getBackendUrl = () => {
    return process.env.NODE_ENV === 'production' 
        ? 'https://bhavyams-vendorhub-backend.onrender.com/api' 
        : 'http://localhost:5000/api';
};

const Chat = () => {
    const { conversationId } = useParams();
    const navigate = useNavigate();
    
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(true);
    
    const messagesEndRef = useRef(null);
    const userStr = localStorage.getItem('user');
    const currentUser = userStr && userStr !== 'undefined' ? JSON.parse(userStr) : null;
    const isMasterAdmin = currentUser?.email === 'pavanvenkat63@gmail.com';

    // Scroll to bottom whenever a new message arrives
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (!currentUser) return navigate('/welcome');

        const fetchMessages = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get(`${getBackendUrl()}/chats/${conversationId}/messages`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setMessages(res.data);
                setTimeout(scrollToBottom, 100);
            } catch (err) {
                toast.error("Failed to load messages.");
            } finally {
                setLoading(false);
            }
        };

        fetchMessages();

        // 🟢 JOIN THE SOCKET ROOM FOR THIS SPECIFIC CONVERSATION
        socket.emit('join_chat', conversationId);

        // 🟢 LISTEN FOR INCOMING LIVE MESSAGES
        const handleReceiveMessage = (newMessage) => {
            setMessages((prev) => [...prev, newMessage]);
            setTimeout(scrollToBottom, 100);
        };

        socket.on('receive_message', handleReceiveMessage);

        return () => {
            socket.off('receive_message', handleReceiveMessage);
            socket.emit('leave_chat', conversationId);
        };
    }, [conversationId, navigate, currentUser?.id]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!inputText.trim()) return;

        // Immediately show the message locally for a fast feel (Optimistic UI)
        const tempMsg = {
            id: Date.now(),
            sender_id: currentUser.id,
            message_text: inputText,
            created_at: new Date().toISOString()
        };
        setMessages((prev) => [...prev, tempMsg]);
        setInputText('');
        setTimeout(scrollToBottom, 100);

        // Send to backend via Socket
        socket.emit('send_message', {
            conversation_id: conversationId,
            sender_id: currentUser.id,
            message_text: tempMsg.message_text
        });
    };

    if (loading) return <div style={styles.loadingBox}><Loader className="spin" /> Loading secure chat...</div>;

    return (
        <div style={styles.page}>
            <style>{`.spin { animation: spin 1s linear infinite; } @keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
            
            {/* HEADER */}
            <div style={styles.header}>
                <button onClick={() => navigate(-1)} style={styles.backBtn}><ArrowLeft size={20} /></button>
                <div style={styles.headerInfo}>
                    <h3 style={{ margin: 0, fontSize: '16px', color: '#0f172a' }}>Secure Chat</h3>
                    {isMasterAdmin ? (
                        <span style={{ fontSize: '11px', color: '#b91c1c', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}><ShieldAlert size={12}/> Admin Moderation Mode</span>
                    ) : (
                        <span style={{ fontSize: '11px', color: '#64748b' }}>End-to-End Encrypted</span>
                    )}
                </div>
            </div>

            {/* CHAT WINDOW */}
            <div style={styles.chatWindow}>
                <div style={styles.securityWarning}>
                    <ShieldAlert size={16} color="#b45309" />
                    <span>For your safety, never share your UPI PIN or passwords. Admins monitor this chat for fraud.</span>
                </div>

                {messages.length === 0 ? (
                    <div style={styles.emptyState}>Start the conversation securely.</div>
                ) : (
                    messages.map((msg, idx) => {
                        const isMe = String(msg.sender_id) === String(currentUser.id);
                        return (
                            <div key={idx} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', marginBottom: '10px' }}>
                                <div style={{
                                    maxWidth: '75%', padding: '10px 14px', borderRadius: '16px', fontSize: '14px', lineHeight: '1.4',
                                    background: isMe ? '#2874f0' : '#ffffff',
                                    color: isMe ? 'white' : '#0f172a',
                                    border: isMe ? 'none' : '1px solid #e2e8f0',
                                    borderBottomRightRadius: isMe ? '4px' : '16px',
                                    borderBottomLeftRadius: isMe ? '16px' : '4px',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                                }}>
                                    {msg.message_text}
                                    <div style={{ fontSize: '9px', opacity: 0.7, textAlign: 'right', marginTop: '4px' }}>
                                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* MESSAGE INPUT BOX */}
            <div style={styles.inputArea}>
                <form onSubmit={handleSendMessage} style={{ display: 'flex', width: '100%', gap: '10px', alignItems: 'center' }}>
                    <input 
                        type="text" 
                        placeholder={currentUser.can_message === false ? "Messaging suspended..." : "Type your message..."}
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        disabled={currentUser.can_message === false}
                        style={styles.textInput}
                    />
                    <button type="submit" disabled={!inputText.trim() || currentUser.can_message === false} style={styles.sendBtn}>
                        <Send size={18} />
                    </button>
                </form>
            </div>
        </div>
    );
};

const styles = {
    page: { display: 'flex', flexDirection: 'column', height: '100vh', background: '#f8fafc', fontFamily: 'Inter, sans-serif' },
    loadingBox: { height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontWeight: 'bold', gap: '10px' },
    header: { display: 'flex', alignItems: 'center', gap: '15px', padding: '15px', background: 'white', borderBottom: '1px solid #e2e8f0', zIndex: 10, position: 'sticky', top: 0 },
    backBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#0f172a', display: 'flex', alignItems: 'center', padding: 0 },
    headerInfo: { display: 'flex', flexDirection: 'column' },
    chatWindow: { flex: 1, overflowY: 'auto', padding: '15px', display: 'flex', flexDirection: 'column' },
    securityWarning: { background: '#fffbeb', border: '1px solid #fde68a', color: '#92400e', fontSize: '11px', padding: '10px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', fontWeight: 'bold' },
    emptyState: { textAlign: 'center', color: '#94a3b8', fontSize: '13px', marginTop: '20px', fontWeight: 'bold' },
    inputArea: { padding: '10px 15px', background: 'white', borderTop: '1px solid #e2e8f0', paddingBottom: 'max(15px, env(safe-area-inset-bottom))' },
    textInput: { flex: 1, padding: '12px 15px', borderRadius: '24px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '14px', background: '#f1f5f9', color: '#0f172a' },
    sendBtn: { background: '#2874f0', color: 'white', border: 'none', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }
};

export default Chat;