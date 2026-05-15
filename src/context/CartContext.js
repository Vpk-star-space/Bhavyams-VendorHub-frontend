import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
    const [cart, setCart] = useState([]);
    
    // Function to figure out the local storage key based on who is logged in
    const getCartKey = useCallback(() => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                return `bhavyams_cart_${user.username || user.email || user._id}`;
            } catch (e) {
                return 'bhavyams_cart_guest';
            }
        }
        return 'bhavyams_cart_guest';
    }, []);

    const [cartKey, setCartKey] = useState(getCartKey());

    // 1. INITIAL LOAD & USER SWITCH LISTENER
    useEffect(() => {
        const checkUserInterval = setInterval(() => {
            const currentKey = getCartKey();
            
            // If the user changed (e.g., Logged out, or Account B logged in)
            if (currentKey !== cartKey) {
                setCartKey(currentKey); 
                
                // Load the new user's specific saved cart from local storage
                const savedCart = localStorage.getItem(currentKey);
                setCart(savedCart ? JSON.parse(savedCart) : []); 
            }
        }, 500); // Check frequently
        
        return () => clearInterval(checkUserInterval);
    }, [cartKey, getCartKey]);

    // 2. SAVE TO LOCAL STORAGE ON EVERY CHANGE
    useEffect(() => {
        // Only save if we actually have a cart initialized, to prevent overwriting with empties on first render
        if (cart !== undefined) {
             localStorage.setItem(cartKey, JSON.stringify(cart));
        }
    }, [cart, cartKey]);


    // 3. ACTIONS
    const addToCart = async (product) => {
        // Update Frontend State Immediately
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

        // 🟢 If user is logged in, ALSO save to Neon DB
        const token = localStorage.getItem('token');
        if (token) {
             try {
                 await axios.post('https://bhavyams-vendorhub-backend.onrender.com/api/cart/add', 
                    { productId: product.id, quantity: 1 }, 
                    { headers: { Authorization: `Bearer ${token}` } }
                 );
             } catch (err) {
                 console.error("Failed to sync cart to database", err);
             }
        }
    };

    const removeFromCart = (productId) => {
        setCart(cart.filter(item => item.id !== productId));
        // Note: You should also add an axios.delete call here to remove from Neon DB
    };

    // ONLY call this after a successful order!
    const clearCart = () => {
        setCart([]);
        localStorage.removeItem(cartKey);
    };

    return (
        <CartContext.Provider value={{ cart, setCart, addToCart, removeFromCart, clearCart }}>
            {children}
        </CartContext.Provider>
    );
};