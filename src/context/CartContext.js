import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {

    // 1. Figure out EXACTLY who is logged in right now
    const getCurrentUser = () => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                return user.email || user.username || 'guest';
            } catch (e) {
                return 'guest';
            }
        }
        return 'guest';
    };

    const [currentUser, setCurrentUser] = useState(getCurrentUser());
    const [cart, setCart] = useState([]);

    // 2. The background watcher: Detects Login/Logout instantly
    useEffect(() => {
        const interval = setInterval(() => {
            const activeUser = getCurrentUser();
            if (activeUser !== currentUser) {
                setCurrentUser(activeUser); // User just logged in or logged out!
            }
        }, 500);
        return () => clearInterval(interval);
    }, [currentUser]);

    // 3. Load the correct cart whenever the user changes
    useEffect(() => {
        // We use ONE master file to hold everyone's carts safely
        const masterCartDb = JSON.parse(localStorage.getItem('bhavyams_master_cart_db')) || {};
        const userCart = masterCartDb[currentUser] || [];
        setCart(userCart);
    }, [currentUser]);

    // 4. The un-deletable Save function
    const saveToMasterCart = (newCartArray) => {
        const masterCartDb = JSON.parse(localStorage.getItem('bhavyams_master_cart_db')) || {};
        
        // Save their items safely under their specific name
        masterCartDb[currentUser] = newCartArray; 
        
        // Lock the master file back into the browser
        localStorage.setItem('bhavyams_master_cart_db', JSON.stringify(masterCartDb));
        
        // Update the screen
        setCart(newCartArray);
    };

    const addToCart = async (product) => {
        const existingItem = cart.find(item => item.id === product.id);
        let updatedCart;

        if (existingItem) {
            toast.info(`Increased quantity of ${product.name}`);
            updatedCart = cart.map(item => 
                item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
            );
        } else {
            toast.success(`${product.name} added to cart!`);
            updatedCart = [...cart, { ...product, quantity: 1 }];
        }

        // Save immediately to the Master DB
        saveToMasterCart(updatedCart);

        // Sync with Neon DB if logged in
        const token = localStorage.getItem('token');
        if (token) {
             try {
                 await axios.post('https://bhavyams-vendorhub-backend.onrender.com/api/cart/add', 
                    { productId: product.id, quantity: 1 }, 
                    { headers: { Authorization: `Bearer ${token}` } }
                 );
             } catch (err) {
                 console.error("Failed to sync cart to database");
             }
        }
    };

    const removeFromCart = (productId) => {
        const updatedCart = cart.filter(item => item.id !== productId);
        saveToMasterCart(updatedCart);
    };

    const clearCart = () => {
        saveToMasterCart([]); // Only empties the current user's cart, completely safe!
    };

    return (
        <CartContext.Provider value={{ cart, addToCart, removeFromCart, clearCart }}>
            {children}
        </CartContext.Provider>
    );
};