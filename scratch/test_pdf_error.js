const { exportToPdf } = require('../server/controllers/orderController');

async function testExport() {
    console.log('Testing exportToPdf...');
    const req = {
        params: { eventId: '9' }
    };
    const res = {
        setHeader: (k, v) => console.log(`Header: ${k} = ${v}`),
        status: (code) => {
            console.log(`Status: ${code}`);
            return { json: (data) => console.log('JSON Output:', data) };
        },
        send: (data) => console.log('✅ Send called. Data length:', data.length),
        end: () => console.log('End called')
    };

    try {
        await exportToPdf(req, res);
    } catch (e) {
        console.error('❌ Export failed with catch:', e.message);
    }
}

testExport();
