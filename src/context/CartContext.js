import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'react-toastify';

// 1. Create the Context
const CartContext = createContext();

// 2. Custom Hook to use the cart easily
export const useCart = () => useContext(CartContext);

// 3. The Provider Component
export const CartProvider = ({ children }) => {
    
    // 🟢 FLIPKART FIX: Get a unique cart name for Account A vs Account B
    const getCartKey = () => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                // Creates a unique bucket: e.g., "bhavyams_cart_pavan"
                return `bhavyams_cart_${user.username || user.email || user._id}`;
            } catch (e) {
                return 'bhavyams_cart_guest';
            }
        }
        return 'bhavyams_cart_guest';
    };

    const [cartKey, setCartKey] = useState(getCartKey());

    // Load the correct cart for whoever is currently logged in
    const [cart, setCart] = useState(() => {
        const savedCart = localStorage.getItem(getCartKey());
        return savedCart ? JSON.parse(savedCart) : [];
    });

    // 🟢 FLIPKART FIX: Automatically watch for Login / Logout
    // If Account A logs out and Account B logs in, this instantly swaps the cart memory!
    useEffect(() => {
        const checkUserInterval = setInterval(() => {
            const currentKey = getCartKey();
            if (currentKey !== cartKey) {
                setCartKey(currentKey); // Switch to the new user's bucket
                const savedCart = localStorage.getItem(currentKey);
                setCart(savedCart ? JSON.parse(savedCart) : []); // Load their specific items
            }
        }, 1000); // Checks every 1 second silently in the background
        
        return () => clearInterval(checkUserInterval);
    }, [cartKey]);

    // Automatically save to the SPECIFIC USER'S bucket whenever they add/remove an item
    useEffect(() => {
        localStorage.setItem(cartKey, JSON.stringify(cart));
    }, [cart, cartKey]);

    const addToCart = (product) => {
        setCart((prevCart) => {
            const existingItem = prevCart.find(item => item.id === product.id);
            
            // If item is already in cart, just increase the quantity
            if (existingItem) {
                toast.info(`Increased quantity of ${product.name}`);
                return prevCart.map(item => 
                    item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
                );
            }
            
            // If new item, add it with quantity 1
            toast.success(`${product.name} added to cart!`);
            return [...prevCart, { ...product, quantity: 1 }];
        });
    };

    const removeFromCart = (productId) => {
        setCart(cart.filter(item => item.id !== productId));
    };

    // This is now only used AFTER successful payment to empty their current cart
    const clearCart = () => {
        setCart([]);
        localStorage.removeItem(cartKey);
    };

    return (
        <CartContext.Provider value={{ cart, addToCart, removeFromCart, clearCart }}>
            {children}
        </CartContext.Provider>
    );
};