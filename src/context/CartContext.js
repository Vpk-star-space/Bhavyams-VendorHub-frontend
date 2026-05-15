import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
    
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
    
    const [cart, setCart] = useState(() => {
        const savedCart = localStorage.getItem(getCartKey());
        return savedCart ? JSON.parse(savedCart) : [];
    });

    // 1. SAFELY LISTEN FOR LOGIN/LOGOUT (No auto-saving here!)
    useEffect(() => {
        const checkUserInterval = setInterval(() => {
            const currentKey = getCartKey();
            if (currentKey !== cartKey) {
                setCartKey(currentKey); // Switch bucket
                const savedCart = localStorage.getItem(currentKey); // Load their items
                setCart(savedCart ? JSON.parse(savedCart) : []); 
            }
        }, 500); 
        
        return () => clearInterval(checkUserInterval);
    }, [cartKey, getCartKey]);

    // 🟢 THE FIX: A manual save function that prevents accidental overwriting
    const saveToLocal = (newCart) => {
        localStorage.setItem(getCartKey(), JSON.stringify(newCart));
    };

    // 2. ACTIONS
    const addToCart = async (product) => {
        setCart((prevCart) => {
            let updatedCart;
            const existingItem = prevCart.find(item => item.id === product.id);
            
            if (existingItem) {
                toast.info(`Increased quantity of ${product.name}`);
                updatedCart = prevCart.map(item => 
                    item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
                );
            } else {
                toast.success(`${product.name} added to cart!`);
                updatedCart = [...prevCart, { ...product, quantity: 1 }];
            }

            // ONLY save to memory when a user actually clicks "Add"
            saveToLocal(updatedCart);
            return updatedCart;
        });

        // Sync to Neon DB in the background
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
        setCart((prevCart) => {
            const updatedCart = prevCart.filter(item => item.id !== productId);
            
            // ONLY save to memory when a user actually clicks "Remove"
            saveToLocal(updatedCart);
            return updatedCart;
        });
    };

    const clearCart = () => {
        setCart([]);
        localStorage.removeItem(getCartKey());
    };

    return (
        <CartContext.Provider value={{ cart, setCart, addToCart, removeFromCart, clearCart }}>
            {children}
        </CartContext.Provider>
    );
};