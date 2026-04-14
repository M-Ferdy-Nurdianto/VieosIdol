const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const orderRoutes = require('./routes/orderRoutes');
const apiRoutes = require('./routes/apiRoutes');
const { getKeepAlive } = require('./controllers/orderController');
const { standardLimiter } = require('./middleware/security');

const app = express();
const PORT = process.env.PORT || 5000;

// Security Middleware
app.use(helmet()); 
app.use(cors({
    origin: process.env.FRONTEND_URL || '*', // Set this to your Vercel URL in .env
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));
app.use(standardLimiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.use('/api/orders', orderRoutes);
app.use('/api/public', apiRoutes);
app.get('/api/keep-alive', getKeepAlive);

// Global Error Handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        error: process.env.NODE_ENV === 'production' 
            ? 'Internal Server Error' 
            : err.message
    });
});

app.listen(PORT, () => {
    console.log(`Server is floating elegantly on port ${PORT}`);
});

