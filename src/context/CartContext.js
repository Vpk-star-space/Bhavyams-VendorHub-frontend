import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'react-toastify';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
    // 🟢 LAZY INITIALIZATION: Reads from localStorage ONLY ONCE during initial load
    const [cart, setCart] = useState(() => {
        try {
            const savedCart = localStorage.getItem('subhams_cart');
            return savedCart ? JSON.parse(savedCart) : [];
        } catch (error) {
            return [];
        }
    });

    // 🟢 SAFE SYNC: Updates localStorage ONLY when the cart state actually changes
    useEffect(() => {
        localStorage.setItem('subhams_cart', JSON.stringify(cart));
    }, [cart]);

    const addToCart = (product) => {
        const token = localStorage.getItem('token');
        if (!token) {
            toast.error("Please log in to add items to your cart!");
            return;
        }

        setCart((prevCart) => {
            const existingItemIndex = prevCart.findIndex(item => item.id === product.id);
            
            if (existingItemIndex >= 0) {
                // Item exists: update quantity
                const newCart = [...prevCart];
                newCart[existingItemIndex] = {
                    ...newCart[existingItemIndex],
                    quantity: newCart[existingItemIndex].quantity + (product.quantity || 1)
                };
                toast.info(`Increased quantity of ${product.name}`);
                return newCart;
            } else {
                // New item: add to cart
                toast.success(`${product.name} added to cart!`);
                return [...prevCart, { ...product, quantity: product.quantity || 1 }];
            }
        });
    };

    const removeFromCart = (productId) => {
        setCart((prevCart) => prevCart.filter(item => item.id !== productId));
    };

    const clearCart = () => {
        setCart([]); 
    };

    // We keep a dummy fetchCartFromDB function so older components don't crash
    const fetchCartFromDB = () => {
        // No-op: Cart is managed purely via localStorage now
    };

    return (
        <CartContext.Provider value={{ cart, fetchCartFromDB, addToCart, removeFromCart, clearCart }}>
            {children}
        </CartContext.Provider>
    );
};