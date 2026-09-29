import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
    const [cart, setCart] = useState([]);
    
    // 🟢 1. STRICT DYNAMIC URL (Fixes the Localhost vs Render confusion)
    const getBackendUrl = () => {
        return process.env.NODE_ENV === 'production' 
            ? 'https://bhavyams-vendorhub-backend.onrender.com/api' 
            : 'http://localhost:5000/api';
    };

    // 2. SAFE FETCH FROM NEON DB
    const fetchCartFromDB = useCallback(async () => {
        const tokenToUse = localStorage.getItem('token');
        if (!tokenToUse) {
            setCart([]); // Wipe the screen if no token exists
            return;
        }
        
        try {
            const res = await axios.get(`${getBackendUrl()}/cart`, {
                headers: { Authorization: `Bearer ${tokenToUse}` }
            });
            setCart(res.data || []);
        } catch (err) {
            // 🟢 3. SELF-HEALING: If the token is from the dead database, wipe it out automatically!
            if (err.response && err.response.status === 401) {
                console.warn("Dead token detected. Auto-clearing session...");
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                setCart([]);
            } else {
                console.error("Cart fetch error:", err.message);
            }
        }
    }, []);

    // 4. THE EVENT LISTENER (Zero Infinite Loops)
    useEffect(() => {
        fetchCartFromDB(); // Fetch once on initial load

        const handleStorageChange = (e) => {
            if (e.key === 'token') {
                fetchCartFromDB(); // Fetch instantly only when the token actually changes
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [fetchCartFromDB]);


    // 5. ADD TO NEON DB
    const addToCart = async (product) => {
        const token = localStorage.getItem('token');
        if (!token) {
            toast.error("Please log in to add items to your cart!");
            return;
        }

        try {
            await axios.post(`${getBackendUrl()}/cart/add`, 
                { productId: product.id, quantity: 1 }, 
                { headers: { Authorization: `Bearer ${token}` } }
            );

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

    // 6. REMOVE FROM NEON DB
    const removeFromCart = async (productId) => {
        const token = localStorage.getItem('token');
        try {
            await axios.delete(`${getBackendUrl()}/cart/remove/${productId}`, {
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