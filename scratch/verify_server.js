try {
    const controller = require('./server/controllers/orderController');
    console.log('✅ orderController loaded successfully');
} catch (e) {
    console.error('❌ Error loading orderController:', e);
    process.exit(1);
}
