import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'react-toastify';

// 1. Create the Context
const CartContext = createContext();

// 2. Custom Hook to use the cart easily
export const useCart = () => useContext(CartContext);

// 3. The Provider Component
export const CartProvider = ({ children }) => {
    // Load cart from local storage when the app starts
    const [cart, setCart] = useState(() => {
        const savedCart = localStorage.getItem('bhavyams_cart');
        return savedCart ? JSON.parse(savedCart) : [];
    });

    // Automatically save to local storage whenever the cart changes
    useEffect(() => {
        localStorage.setItem('bhavyams_cart', JSON.stringify(cart));
    }, [cart]);

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

    const clearCart = () => {
        setCart([]);
        localStorage.removeItem('bhavyams_cart');
    };

    return (
        <CartContext.Provider value={{ cart, addToCart, removeFromCart, clearCart }}>
            {children}
        </CartContext.Provider>
    );
};