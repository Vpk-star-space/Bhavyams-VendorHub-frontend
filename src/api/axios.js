import axios from 'axios';

// 🚀 MASTER URL: Change it here once, and it updates everywhere!
const API = axios.create({
    baseURL: 'https://bhavyams-vendorhub-backend.onrender.com'
});

export default API;