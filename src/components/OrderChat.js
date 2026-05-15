import React, { useState, useRef, useEffect } from 'react';
import { Send, X, ShieldCheck, ChevronRight, Bot } from 'lucide-react';

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

    const productName = order?.product_name || "your item";
    const price = order?.total_price || "0";
    const status = order?.status || "Processing";
    const orderId = order?.id || order?.order_id || "Unknown";

    const getCurrentTime = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 18) return 'Good Afternoon';
        return 'Good Evening';
    };

    // 🟢 INITIAL CHAT STATE: The first message contains the vertical menu
    const [messages, setMessages] = useState([
        { 
            sender: 'bot', 
            text: `👋 ${getGreeting()}!\n\nI am **Subhams Support AI**. I have pulled up your order details for the **${productName}**. Please select a query from the menu below, or type your question.`,
            time: getCurrentTime(),
            isMenu: true,
            menuDisabled: false
        }
    ]);
    
    const chatEndRef = useRef(null);

    // 🟢 FLIPKART STYLE STACKED MENU
    const quickOptions = [
        "Track Order Status",
        "Where is my Invoice?",
        "Cancel this Order",
        "Return / Replace Item",
        "Delivery is Delayed",
        "Contact Human Admin"
    ];

    // Auto-scroll logic
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => {
                chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
            }, 100);
        }
    }, [messages, isOpen, loading]);

    // 🧠 STRICT HYBRID AI ENGINE
    const generateSmartResponse = (userMessage) => {
        const msg = userMessage.toLowerCase().trim();

        if (msg === "track order status" || msg.includes("track") || msg.includes("where is my order")) {
            const isDelivered = status.toLowerCase() === 'delivered';
            return `**Live Tracking Update:**\n\n📦 Ordered  ➔  🚚 Shipped  ➔  ${isDelivered ? '✅ **Delivered**' : '⏳ **Pending**'}\n\nCurrent Status: **[${status.toUpperCase()}]**\n\nOur logistics system shows everything is on track!`;
        }
        else if (msg === "where is my invoice?" || msg.includes("invoice") || msg.includes("bill") || msg.includes("price")) {
            return `Your total payment for this order was **₹${price}**.\n\n💳 **Need the official receipt?**\nYou can securely download your GST Tax Invoice by closing this chat and clicking the blue "Download Invoice" button on the main page.`;
        }
        else if (msg === "cancel this order" || msg.includes("cancel") || msg.includes("stop order")) {
            if (status.toLowerCase() === 'delivered') {
                return `**Action Denied:**\nBecause this order is already delivered, it cannot be cancelled. \n\nHowever, you are eligible for a return! Please select the Return Policy option for the next steps.`;
            } else {
                return `**Cancellation Policy:**\nYou are eligible to cancel this order before it leaves our warehouse. If you proceed, an automated refund of **₹${price}** will be credited to your bank account within 3-5 business days.`;
            }
        }
        else if (msg === "return / replace item" || msg.includes("return") || msg.includes("refund") || msg.includes("damage")) {
            return `🛡️ **Bhavyams Assured Guarantee:**\n\nIf your item is damaged, defective, or incorrect, you can request a hassle-free return or replacement within **7 days** of delivery. \n\nYour refund of ₹${price} is fully secured by our system.`;
        }
        else if (msg === "delivery is delayed" || msg.includes("delay") || msg.includes("late")) {
            if (status.toLowerCase() === 'delivered') {
                return `Our system shows this item was already handed over to you! If you haven't received it, please verify with your security desk or neighbors immediately.`;
            } else {
                return `I apologize for the wait! 🚚💨\n\nSometimes our delivery agents face local routing delays. I have automatically escalated Order **#${orderId}** to our high-priority dispatch queue.`;
            }
        }
        else if (msg === "contact human admin" || msg.includes("admin") || msg.includes("human") || msg.includes("mail") || msg.includes("support")) {
            return `I understand you need to speak with our human support team. 🎧\n\nPlease click the button below to email our administration. **Our admin team will contact you back within a few hours!**\n\n<a href="mailto:venkatapavankumar36@gmail.com?subject=Support%20Request%20for%20Order%20%23${orderId}" style="display: block; margin: 12px 0; padding: 12px 16px; background-color: #fb641b; color: #fff; text-decoration: none; border-radius: 4px; font-weight: bold; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">✉️ CLICK TO CONTACT ADMIN</a>\n\n*(Your Order ID **#${orderId}** will automatically be included in your email)*`;
        }
        else if (msg === "hi" || msg === "hello" || msg === "help") {
            return `Hello again! How else can I assist you with Order **#${orderId}** today?`;
        }
        else {
            return `I'm sorry, I didn't quite catch that. As a Virtual Assistant, I am still learning! \n\nPlease select one of the specific options from the menu, or tap **Contact Human Admin** to email our human team.`;
        }
    };

    const handleSendMessage = (text = input) => {
        if (!text.trim() || loading) return;

        // 1. Disable all previous menus in the chat history so it locks cleanly
        setMessages(prev => prev.map(m => ({ ...m, menuDisabled: true })));

        // If they click "View Main Menu", generate a new menu message
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
        
        // 2. Add normal user message
        setMessages(prev => [...prev, { sender: 'user', text: text.trim(), time: getCurrentTime() }]);
        setInput(""); 
        setLoading(true);

        // 3. Bot responds and adds "Sub Menu" for follow-up actions
        setTimeout(() => {
            const botReply = generateSmartResponse(text);
            setMessages(prev => [...prev, { 
                sender: 'bot', 
                text: botReply, 
                time: getCurrentTime(),
                isSubMenu: true,
                menuDisabled: false
            }]);
            setLoading(false);
        }, 1500);
    };

    if (!isOpen) return (
        <div style={styles.helpContainer}>
            <span style={styles.helpText}>Need help with this order?</span>
            <button onClick={() => setIsOpen(true)} style={styles.floatBtn}>
                <ShieldCheck size={18} /> Chat with Subhams AI <ChevronRight size={16} />
            </button>
        </div>
    );

    const dynamicChatWindowStyle = isMobile ? {
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%',
        backgroundColor: '#f1f3f6', zIndex: 999999, display: 'flex', flexDirection: 'column'
    } : {
        position: 'fixed', bottom: '20px', right: '20px', width: '380px', height: '620px',
        backgroundColor: '#f1f3f6', borderRadius: '12px', boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
        display: 'flex', flexDirection: 'column', zIndex: 9999, border: '1px solid #d7d7d7', overflow: 'hidden'
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
                <X size={24} onClick={() => setIsOpen(false)} style={{cursor:'pointer', color:'#fff', padding: '4px'}} />
            </div>

            {/* ⚪ CHAT BODY (Scrollable) */}
            <div style={styles.body}>
                <div style={styles.systemNote}>
                    <ShieldCheck size={14} /> Secure Chat Environment • Order #${orderId}
                </div>
                
                {messages.map((msg, index) => (
                    <div key={index} style={{
                        ...styles.row, 
                        justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start'
                    }}>
                        {msg.sender === 'bot' && <Bot size={16} color="#878787" style={{marginTop: '10px', marginRight: '8px'}} />}
                        
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
                            
                            {/* The Chat Bubble */}
                            <div style={msg.sender === 'bot' ? styles.botBubble : styles.userBubble}>
                                <span dangerouslySetInnerHTML={{ __html: msg.text.replace(/\n/g, '<br/>').replace(/\*\*(.*?)\*\*/g, '<b>$1</b>') }} />
                            </div>

                            {/* 🟢 THE FLIPKART VERTICAL MENU (Attaches directly to the bot bubble!) */}
                            {msg.isMenu && (
                                <div style={{
                                    ...styles.botMenuCard, 
                                    opacity: msg.menuDisabled ? 0.6 : 1, 
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

                            {/* 🔵 FOLLOW-UP CHIPS (View Main Menu / Close Chat) */}
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
        padding: '12px 20px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        fontSize: '14px', fontWeight: 'bold', width: '100%', maxWidth: '300px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
        transition: 'all 0.2s ease'
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
        fontSize: '14px', lineHeight: '1.5', border: '1px solid #e0e0e0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
    },
    userBubble: {
        backgroundColor: '#2874f0', color: '#fff', padding: '12px 16px', borderRadius: '12px 0 12px 12px',
        fontSize: '14px', lineHeight: '1.5', boxShadow: '0 2px 4px rgba(40,116,240,0.2)'
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
    // 🟢 THE VERTICAL MENU CARD STYLES
    botMenuCard: {
        backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e0e0e0',
        marginTop: '8px', overflow: 'hidden', boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
        width: '100%', maxWidth: '280px', transition: 'opacity 0.3s'
    },
    menuItem: {
        padding: '14px 16px', fontSize: '13px', fontWeight: '600', color: '#212121',
        cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        backgroundColor: '#fff'
    },
    // 🔵 FOLLOW UP CHIPS STYLES
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

const styleSheet = document.createElement("style");
styleSheet.innerText = `
@keyframes blink { 0% { opacity: 0.2; } 20% { opacity: 1; } 100% { opacity: 0.2; } }
`;
document.head.appendChild(styleSheet);

export default OrderChat;