import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { GoogleOAuthProvider } from '@react-oauth/google';
import axios from 'axios';
import 'react-toastify/dist/ReactToastify.css';

import { CartProvider } from './context/CartContext'; 
import Home from './pages/Home'; 
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Cart from './pages/Cart'; 
import AddProduct from './pages/AddProduct';
import ProtectedRoute from './components/ProtectedRoute';
import ForgotPassword from './pages/ForgotPassword';
import VendorDashboard from './pages/VendorDashboard';
import ProductDetails from './pages/ProductDetails';
import Profile from './pages/Profile';

function App() {
    const [googleClientId, setGoogleClientId] = useState(null);

    useEffect(() => {
        const fetchGoogleId = async () => {
            try {
                // ✅ URL UPDATED TO RENDER LINK BELOW
                const res = await axios.get('https://bhavyams-vendorhub-backend.onrender.com/api/auth/google-client-id');
                setGoogleClientId(res.data.clientId);
            } catch (err) {
                console.error("Google ID fetch failed. Check Backend .env", err);
            }
        };
        fetchGoogleId();
    }, []);

    if (!googleClientId) {
        return (
            <div style={{display:'flex', justifyContent:'center', alignItems:'center', height:'100vh', fontFamily: 'sans-serif'}}>
                <div style={{textAlign: 'center'}}>
                    <div style={{fontSize: '24px', fontWeight: 'bold', color: '#2874f0'}}>Bhavyams VendorHub</div>
                    <div style={{marginTop: '10px', color: '#666'}}>Initializing Secure System...</div>
                </div>
            </div>
        );
    }

    return (
        <GoogleOAuthProvider clientId={googleClientId}>
            <CartProvider>
                <Router>
                    <ToastContainer theme="colored" position="top-right" autoClose={2000} />
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/product/:id" element={<ProductDetails />} />
                        <Route path="/cart" element={<Cart />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                        <Route path="/forgot-password" element={<ForgotPassword />} />
                        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                        <Route path="/profile" element={<Profile />} />
                        <Route path="/vendor-dashboard" element={<VendorDashboard />} />
                        <Route path="/add-product" element={<ProtectedRoute><AddProduct /></ProtectedRoute>} />
                        <Route path="*" element={<Home />} />
                    </Routes>
                </Router>
            </CartProvider>
        </GoogleOAuthProvider>
    );
}

export default App;