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

const allowedOrigins = [
    process.env.FRONTEND_URL,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
    'http://localhost:5173',
    'http://127.0.0.1:5173'
].filter(Boolean);

// Security Middleware
app.use(helmet({
    // Some browsers/extensions warn on experimental Permissions-Policy directives.
    permissionsPolicy: false
}));
app.use(cors({
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
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

if (!process.env.VERCEL) {
    app.listen(PORT, () => {
        console.log(`Server is floating elegantly on port ${PORT}`);
    });
}

module.exports = app;

