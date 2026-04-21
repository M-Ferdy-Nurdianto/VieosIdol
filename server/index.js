const express = require('express');
const fs = require('fs');
const path = require('path');
const logFile = path.join(__dirname, 'debug.log');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const orderRoutes = require('./routes/orderRoutes');
const apiRoutes = require('./routes/apiRoutes');
const { getKeepAlive } = require('./controllers/orderController');
const { standardLimiter } = require('./middleware/security');

const app = express();
const PORT = process.env.PORT || 5001;

const allowedOrigins = [
    process.env.FRONTEND_URL,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
    process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : null,
    'https://vieos-website.vercel.app',
    'https://vieos-idol.vercel.app',
    'http://localhost:5173',
    'http://127.0.0.1:5173'
].filter(Boolean);

const isAllowedVercelPreviewOrigin = (origin) => {
    return /^https:\/\/vieos-idol(?:-[a-z0-9-]+)?\.vercel\.app$/i.test(origin);
};

// Security Middleware
app.use(helmet({
    // Explicitly define a clean policy to prevent browser warnings about unrecognized experimental features.
    permissionsPolicy: {
        features: {
            camera: ["'none'"],
            microphone: ["'none'"],
            geolocation: ["'none'"],
        },
    },
}));
app.use(cors({
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin) || isAllowedVercelPreviewOrigin(origin)) {
            return callback(null, true);
        }
        return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true
}));
app.use(standardLimiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
app.use((req, res, next) => {
    res.on('finish', () => {
        fs.appendFileSync(logFile, `[${new Date().toISOString()}] ${req.method} ${req.url} -> ${res.statusCode} (Origin: ${req.headers.origin})\x0a`);
    });
    next();
});

// Routes
app.use('/api/orders', orderRoutes);
app.use('/api/public', apiRoutes);
app.get('/api/keep-alive', getKeepAlive);

// Global Error Handler
app.use((err, req, res, next) => {
    fs.appendFileSync(logFile, `[${new Date().toISOString()}] ERROR: ${err.stack || err}\x0a`);
    console.error(err.stack);
    const isCorsError = typeof err.message === 'string' && err.message.startsWith('CORS blocked for origin:');
    const statusCode = isCorsError ? 403 : 500;
    const publicMessage = isCorsError ? 'CORS origin not allowed' : 'Internal Server Error';

    res.status(statusCode).json({
        error: process.env.NODE_ENV === 'production' 
            ? publicMessage
            : err.message
    });
});

if (!process.env.VERCEL) {
    app.listen(PORT, '127.0.0.1', () => {
        console.log(`Server is floating elegantly on 127.0.0.1:${PORT}`);
    });
}

module.exports = app;

