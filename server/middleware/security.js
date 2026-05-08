const rateLimit = require('express-rate-limit');

const parsePositiveInt = (value) => {
    const parsed = Number.parseInt(value, 10);
    if (!Number.isFinite(parsed) || parsed <= 0) return null;
    return parsed;
};

const RATE_LIMIT_WINDOW_MS = parsePositiveInt(process.env.RATE_LIMIT_WINDOW_MS) ?? (15 * 60 * 1000);
const RATE_LIMIT_MAX = parsePositiveInt(process.env.RATE_LIMIT_MAX) ?? 267;
const ORDER_RATE_LIMIT_WINDOW_MS = parsePositiveInt(process.env.ORDER_RATE_LIMIT_WINDOW_MS) ?? RATE_LIMIT_WINDOW_MS;
const ORDER_RATE_LIMIT_MAX = parsePositiveInt(process.env.ORDER_RATE_LIMIT_MAX) ?? RATE_LIMIT_MAX;

/**
 * General rate limit for most APIs
 */
const standardLimiter = rateLimit({
    windowMs: RATE_LIMIT_WINDOW_MS,
    max: RATE_LIMIT_MAX,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        error: 'Too many requests from this IP, please try again later.'
    }
});

/**
 * Stricter limit for order creation to prevent spam
 */
const orderLimiter = rateLimit({
    windowMs: ORDER_RATE_LIMIT_WINDOW_MS,
    max: ORDER_RATE_LIMIT_MAX,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        error: 'Order limit reached. Please wait before placing more orders.'
    }
});

module.exports = {
    standardLimiter,
    orderLimiter
};
