import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Send, X, ShieldCheck, ChevronRight, Bot, RotateCcw } from 'lucide-react';

const OrderChat = ({ order }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    
    // Listen for screen size changes
    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Extract details or fallback to Global Mode
    const productName = order?.product_name || null;
    const orderId = order?.id || order?.order_id || null;

    const getCurrentTime = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 18) return 'Good Afternoon';
        return 'Good Evening';
    };

    const [messages, setMessages] = useState([]);
    const chatEndRef = useRef(null);

    // 🟢 BUG FIX: Auto-Reset Chat when the user switches to a different order!
    useEffect(() => {
        const initialGreeting = orderId 
            ? `👋 ${getGreeting()}!\n\nI am **Subhams Support AI**. I have pulled up your order details for the **${productName}**. Please select a query from the menu below, or type your question.`
            : `👋 ${getGreeting()}!\n\nI am **Subhams Support AI**.\n\nDo you need help with a specific order? Please navigate to the **My Orders** section and click on an order to get started!`;

        setMessages([
            { 
                sender: 'bot', 
                text: initialGreeting,
                time: getCurrentTime(),
                isMenu: !!orderId, 
                menuDisabled: false
            }
        ]);
    }, [orderId, productName]); // This array ensures it resets when order changes

    // Flipkart-style Options
    const quickOptions = [
        "Track Order Status",
        "Where is my Invoice?",
        "Cancel this Order",
        "Return / Replace Item",
        "Delivery is Delayed",
        "Contact Human Admin",
        "Our Other Projects"
    ];

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => {
                chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
            }, 100);
        }
    }, [messages, isOpen, loading]);

    // 🚀 FULL-STACK API CALL 
    const handleSendMessage = async (text = input) => {
        if (!text.trim() || loading) return;

        // Lock previous menus so they can't be clicked again
        setMessages(prev => prev.map(m => ({ ...m, menuDisabled: true })));

        // If they click "View Main Menu", generate a new menu message instantly
        if (text === "View Main Menu") {
            setMessages(prev => [...prev, { sender: 'user', text: text, time: getCurrentTime() }]);
            setLoading(true);
            setTimeout(() => {
                setMessages(prev => [...prev, { 
                    sender: 'bot', text: "Here are your options:", time: getCurrentTime(), isMenu: true, menuDisabled: false 
                }]);
                setLoading(false);
            }, 600);
            return;
        }
        
        // Add User Message UI
        setMessages(prev => [...prev, { sender: 'user', text: text.trim(), time: getCurrentTime() }]);
        setInput(""); 
        setLoading(true);

        try {
            const token = localStorage.getItem('token');
            
            // 🌐 CALL YOUR SECURE BACKEND BRAIN
            const response = await axios.post('https://bhavyams-vendorhub-backend.onrender.com/api/support/chat', { 
                message: text, 
                orderId: orderId 
            }, { 
                headers: { Authorization: `Bearer ${token}` } 
            });

            // Handle the UI rendering of the backend reply
            setMessages(prev => [...prev, { 
                sender: 'bot', 
                text: response.data.reply, 
                time: getCurrentTime(),
                isSubMenu: !!orderId, // Show follow-up chips
                menuDisabled: false
            }]);

        } catch (error) {
            console.error("Chat Error:", error);
            setMessages(prev => [...prev, { 
                sender: 'bot', 
                text: "⚠️ Connection Error: I am having trouble reaching the server. Please try again or check your internet connection.", 
                time: getCurrentTime() 
            }]);
        } finally {
            setLoading(false);
        }
    };

    // 🟢 FLOATING BUTTON (With Pulse Animation)
    if (!isOpen) return (
        <div style={styles.helpContainer}>
            <span style={styles.helpText}>Need help with {orderId ? 'this order?' : 'an order?'}</span>
            <button onClick={() => setIsOpen(true)} style={styles.floatBtn}>
                <ShieldCheck size={18} /> Chat with Subhams AI <ChevronRight size={16} />
            </button>
        </div>
    );

    // 📱 DYNAMIC STYLES: Fullscreen for Mobile (100dvh fixes browser bar issues), Floating for Laptop
    const dynamicChatWindowStyle = isMobile ? {
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100dvh',
        backgroundColor: '#f1f3f6', zIndex: 999999, display: 'flex', flexDirection: 'column',
        animation: 'slideUp 0.3s ease-out forwards'
    } : {
        position: 'fixed', bottom: '20px', right: '20px', width: '380px', height: '620px',
        backgroundColor: '#f1f3f6', borderRadius: '12px', boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
        display: 'flex', flexDirection: 'column', zIndex: 9999, border: '1px solid #d7d7d7', overflow: 'hidden',
        animation: 'slideUp 0.3s ease-out forwards'
    };

    return (
        <div style={dynamicChatWindowStyle}>
            {/* 🔵 HEADER */}
            <div style={styles.header}>
                <div style={{display:'flex', alignItems:'center', gap:'12px'}}>
                    <div style={styles.avatarCircle}>
                        <Bot size={20} color="#2874f0" />
                    </div>
                    <div>
                        <div style={{fontSize:'16px', fontWeight:'bold', letterSpacing:'0.5px'}}>Subhams Assured AI</div>
                        <div style={{fontSize:'12px', color:'#e0e7ff', display: 'flex', alignItems: 'center', gap: '4px'}}>
                            <div style={styles.onlineDot} /> Online 24/7
                        </div>
                    </div>
                </div>
                <div style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
                    {/* Clear Chat Button */}
                    <RotateCcw 
                        size={18} 
                        color="#fff" 
                        style={{cursor: 'pointer', opacity: 0.8}} 
                        onClick={() => setMessages([messages[0]])} 
                        title="Restart Chat"
                    />
                    <X size={26} onClick={() => setIsOpen(false)} style={{cursor:'pointer', color:'#fff'}} />
                </div>
            </div>

            {/* ⚪ CHAT BODY */}
            <div style={styles.body}>
                <div style={styles.systemNote}>
                    <ShieldCheck size={14} /> Secure Chat Environment {orderId && `• Order #${orderId}`}
                </div>
                
                {messages.map((msg, index) => (
                    <div key={index} style={{
                        ...styles.row, 
                        justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start'
                    }}>
                        {msg.sender === 'bot' && <Bot size={16} color="#878787" style={{marginTop: '10px', marginRight: '8px', flexShrink: 0}} />}
                        
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
                            
                            <div style={msg.sender === 'bot' ? styles.botBubble : styles.userBubble}>
                                <span dangerouslySetInnerHTML={{ __html: msg.text.replace(/\n/g, '<br/>').replace(/\*\*(.*?)\*\*/g, '<b>$1</b>') }} />
                            </div>

                            {/* 🟢 THE FLIPKART VERTICAL MENU */}
                            {msg.isMenu && (
                                <div style={{
                                    ...styles.botMenuCard, 
                                    opacity: msg.menuDisabled ? 0.5 : 1, 
                                    pointerEvents: msg.menuDisabled ? 'none' : 'auto'
                                }}>
                                    {quickOptions.map((option, idx) => (
                                        <div 
                                            key={idx} 
                                            onClick={() => handleSendMessage(option)} 
                                            style={{
                                                ...styles.menuItem,
                                                borderBottom: idx === quickOptions.length - 1 ? 'none' : '1px solid #f0f0f0'
                                            }}
                                        >
                                            {option} <ChevronRight size={16} color="#2874f0" />
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* 🔵 FOLLOW-UP CHIPS */}
                            {msg.isSubMenu && !msg.menuDisabled && (
                                <div style={styles.chipsWrapper}>
                                    <button onClick={() => handleSendMessage("View Main Menu")} style={styles.chipBtn}>View Main Menu</button>
                                    <button onClick={() => setIsOpen(false)} style={styles.chipBtnOutline}>Close Chat</button>
                                </div>
                            )}

                            <div style={styles.timestamp}>
                                {msg.time} {msg.sender === 'user' && '✓✓'}
                            </div>
                        </div>
                    </div>
                ))}
                
                {loading && (
                    <div style={{...styles.row, justifyContent: 'flex-start'}}>
                        <Bot size={16} color="#878787" style={{marginTop: '10px', marginRight: '8px'}} />
                        <div style={styles.typingBubble}>
                            <span style={styles.typingDot}>.</span><span style={styles.typingDot}>.</span><span style={styles.typingDot}>.</span>
                        </div>
                    </div>
                )}

                <div ref={chatEndRef} style={{ height: '10px' }} />
            </div>

            {/* ⌨️ TEXT INPUT FOOTER */}
            <div style={styles.footer}>
                <input 
                    style={styles.input} 
                    value={input} 
                    onChange={(e) => setInput(e.target.value)} 
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage(input)}
                    placeholder="Type a message..."
                    disabled={loading}
                />
                <button 
                    onClick={() => handleSendMessage(input)} 
                    style={{...styles.sendBtn, opacity: (!input.trim() || loading) ? 0.5 : 1}} 
                    disabled={loading || !input.trim()}
                >
                    <Send size={18} />
                </button>
            </div>
        </div>
    );
};

const styles = {
    helpContainer: { marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '8px' },
    helpText: { fontSize: '13px', color: '#878787', fontWeight: '500' },
    floatBtn: {
        backgroundColor: '#fff', color: '#2874f0', border: '1px solid #e0e0e0',
        padding: '12px 20px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        fontSize: '14px', fontWeight: 'bold', width: '100%', maxWidth: '300px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
        animation: 'pulseBtn 2s infinite', transition: 'all 0.2s ease'
    },
    header: {
        padding: '16px 20px', backgroundColor: '#2874f0', color: '#fff',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
    },
    avatarCircle: {
        width: '38px', height: '38px', backgroundColor: '#fff', borderRadius: '50%',
        display: 'flex', justifyContent: 'center', alignItems: 'center'
    },
    onlineDot: {
        width: '8px', height: '8px', backgroundColor: '#00e676', borderRadius: '50%', border: '1px solid #2874f0'
    },
    body: {
        flex: 1, padding: '15px 20px', overflowY: 'auto', backgroundColor: '#f1f3f6', display: 'flex', flexDirection: 'column'
    },
    systemNote: {
        textAlign: 'center', fontSize: '12px', color: '#878787', marginBottom: '20px', backgroundColor: '#e2e8f0', 
        padding: '8px', borderRadius: '4px', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px'
    },
    row: { display: 'flex', marginBottom: '15px' },
    botBubble: {
        backgroundColor: '#fff', color: '#212121', padding: '12px 16px', borderRadius: '0 12px 12px 12px',
        fontSize: '14px', lineHeight: '1.5', border: '1px solid #e0e0e0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', wordBreak: 'break-word'
    },
    userBubble: {
        backgroundColor: '#2874f0', color: '#fff', padding: '12px 16px', borderRadius: '12px 0 12px 12px',
        fontSize: '14px', lineHeight: '1.5', boxShadow: '0 2px 4px rgba(40,116,240,0.2)', wordBreak: 'break-word'
    },
    timestamp: {
        fontSize: '11px', color: '#878787', marginTop: '6px', padding: '0 4px'
    },
    typingBubble: {
        backgroundColor: '#fff', padding: '12px 16px', borderRadius: '0 12px 12px 12px',
        border: '1px solid #e0e0e0', display: 'flex', gap: '4px', alignItems: 'center'
    },
    typingDot: {
        fontSize: '24px', lineHeight: '10px', color: '#878787', animation: 'blink 1.4s infinite both'
    },
    botMenuCard: {
        backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e0e0e0',
        marginTop: '8px', overflow: 'hidden', boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
        width: '100%', maxWidth: '280px', transition: 'all 0.3s'
    },
    menuItem: {
        padding: '14px 16px', fontSize: '13px', fontWeight: '600', color: '#212121',
        cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        backgroundColor: '#fff'
    },
    chipsWrapper: {
        display: 'flex', gap: '8px', marginTop: '10px', flexWrap: 'wrap'
    },
    chipBtn: {
        backgroundColor: '#e0e7ff', color: '#2874f0', border: '1px solid #c2e0ff', borderRadius: '20px',
        padding: '8px 16px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer'
    },
    chipBtnOutline: {
        backgroundColor: '#fff', color: '#878787', border: '1px solid #d7d7d7', borderRadius: '20px',
        padding: '8px 16px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer'
    },
    footer: {
        padding: '15px 20px', backgroundColor: '#fff', borderTop: '1px solid #e0e0e0', display: 'flex', gap: '12px', paddingBottom: '25px'
    },
    input: {
        flex: 1, padding: '14px 18px', borderRadius: '24px', border: '1px solid #e0e0e0',
        backgroundColor: '#f8fafc', color: '#212121', fontSize: '14px', outline: 'none'
    },
    sendBtn: {
        backgroundColor: '#2874f0', color: '#fff', border: 'none', borderRadius: '50%',
        width: '46px', height: '46px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center',
        boxShadow: '0 2px 6px rgba(40,116,240,0.3)', transition: 'opacity 0.2s'
    }
};

// Insert animations to Document Head securely
if (typeof document !== 'undefined') {
    const styleSheet = document.createElement("style");
    styleSheet.innerText = `
    @keyframes blink { 0% { opacity: 0.2; } 20% { opacity: 1; } 100% { opacity: 0.2; } }
    @keyframes slideUp { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    @keyframes pulseBtn { 0% { box-shadow: 0 0 0 0 rgba(40, 116, 240, 0.4); } 70% { box-shadow: 0 0 0 10px rgba(40, 116, 240, 0); } 100% { box-shadow: 0 0 0 0 rgba(40, 116, 240, 0); } }
    `;
    document.head.appendChild(styleSheet);
}

export default OrderChat;