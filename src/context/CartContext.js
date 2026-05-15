import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
    const [cart, setCart] = useState([]);
    
    // Keep track of who is currently logged in via their token
    const [currentToken, setCurrentToken] = useState(localStorage.getItem('token'));

    // 1. FETCH FROM NEON DB
    const fetchCartFromDB = useCallback(async (tokenToUse) => {
        if (!tokenToUse) {
            setCart([]); // If no token, wipe the screen!
            return;
        }
        try {
            const res = await axios.get('https://bhavyams-vendorhub-backend.onrender.com/api/cart', {
                headers: { Authorization: `Bearer ${tokenToUse}` }
            });
            setCart(res.data || []);
        } catch (err) {
            console.error("Failed to fetch cart from Neon DB", err);
        }
    }, []);

    // 2. 🟢 THE FIX: AUTOMATIC LOGIN/LOGOUT WATCHER
    // This constantly checks if the account has changed without refreshing the page
    useEffect(() => {
        const interval = setInterval(() => {
            const newToken = localStorage.getItem('token');
            // If the token changed (User logged in OR logged out)
            if (newToken !== currentToken) {
                setCurrentToken(newToken);
                fetchCartFromDB(newToken); // Instantly pull the new database data!
            }
        }, 500); 

        return () => clearInterval(interval);
    }, [currentToken, fetchCartFromDB]);

    // Fetch once when the app first loads
    useEffect(() => {
        fetchCartFromDB(currentToken);
    }, [fetchCartFromDB, currentToken]);


    // 3. ADD TO NEON DB
    const addToCart = async (product) => {
        const token = localStorage.getItem('token');
        if (!token) {
            toast.error("Please log in to add items to your cart!");
            return;
        }

        try {
            // Save to Neon DB first
            await axios.post('https://bhavyams-vendorhub-backend.onrender.com/api/cart/add', 
                { productId: product.id, quantity: 1 }, 
                { headers: { Authorization: `Bearer ${token}` } }
            );

            // Update the screen instantly
            setCart((prevCart) => {
                const existingItem = prevCart.find(item => item.id === product.id);
                if (existingItem) {
                    toast.info(`Increased quantity of ${product.name}`);
                    return prevCart.map(item => 
                        item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
                    );
                }
                toast.success(`${product.name} added to cart!`);
                return [...prevCart, { ...product, quantity: 1 }];
            });
        } catch (err) {
            toast.error("Server error: Could not save to database.");
        }
    };

    // 4. REMOVE FROM NEON DB
    const removeFromCart = async (productId) => {
        const token = localStorage.getItem('token');
        try {
            await axios.delete(`https://bhavyams-vendorhub-backend.onrender.com/api/cart/remove/${productId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setCart(cart.filter(item => item.id !== productId));
        } catch (err) {
            toast.error("Failed to remove item from database.");
        }
    };

    const clearCart = () => {
        setCart([]); 
    };

    return (
        <CartContext.Provider value={{ cart, fetchCartFromDB, addToCart, removeFromCart, clearCart }}>
            {children}
        </CartContext.Provider>
    );
};