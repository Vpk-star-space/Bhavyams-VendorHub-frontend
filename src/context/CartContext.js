import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
    // We only store the cart in React Memory (RAM), never in Local Storage!
    const [cart, setCart] = useState([]);

    // 1. FETCH FROM NEON DB WHEN USER LOGS IN OR APP LOADS
    const fetchCartFromDB = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            setCart([]); // If no token, show empty cart
            return;
        }

        try {
            // Ask the backend for this specific user's cart
            // NOTE: You must have a GET route in your backend for this! (e.g., router.get('/'))
            const res = await axios.get('https://bhavyams-vendorhub-backend.onrender.com/api/cart', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setCart(res.data || []);
        } catch (err) {
            console.error("Failed to fetch cart from Neon DB", err);
        }
    };

    // Run this fetch whenever the app starts up
    useEffect(() => {
        fetchCartFromDB();
    }, []);

    // 2. ADD TO NEON DB
    const addToCart = async (product) => {
        const token = localStorage.getItem('token');
        if (!token) {
            toast.error("Please log in to add items to your cart!");
            return;
        }

        try {
            // 🚀 Tell the backend to save it in Neon DB FIRST
            await axios.post('https://bhavyams-vendorhub-backend.onrender.com/api/cart/add', 
                { productId: product.id, quantity: 1 }, 
                { headers: { Authorization: `Bearer ${token}` } }
            );

            // If the database succeeds, update the screen
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

    // 3. REMOVE FROM NEON DB
    const removeFromCart = async (productId) => {
        const token = localStorage.getItem('token');
        try {
            // Tell backend to delete from Neon DB
            // NOTE: You must have a DELETE route in your backend!
            await axios.delete(`https://bhavyams-vendorhub-backend.onrender.com/api/cart/remove/${productId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Update the screen
            setCart(cart.filter(item => item.id !== productId));
        } catch (err) {
            toast.error("Failed to remove item from database.");
        }
    };

    // 4. LOGOUT OR CHECKOUT (Clears the screen, DOES NOT delete from DB)
    const clearCart = () => {
        // This just empties the React screen. 
        // It does NOT send a delete request to the database!
        setCart([]); 
    };

    return (
        <CartContext.Provider value={{ cart, fetchCartFromDB, addToCart, removeFromCart, clearCart }}>
            {children}
        </CartContext.Provider>
    );
};