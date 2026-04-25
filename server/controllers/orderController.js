const ExcelJS = require('exceljs');
const { jsPDF } = require('jspdf');
require('jspdf-autotable');
const fs = require('fs');
const path = require('path');
const supabase = require('../supabaseClient');

const PDF_LOGO_CACHE = { dataUri: null, format: null };

const getPdfLogo = () => {
    if (PDF_LOGO_CACHE.dataUri) return PDF_LOGO_CACHE;

    const candidates = [
        { filePath: path.join(__dirname, '../../client/public/logos/vieos-transparent.png'), format: 'PNG' },
        { filePath: path.join(__dirname, '../../client/public/logos/vieos.png'), format: 'PNG' },
        { filePath: path.join(__dirname, '../../client/public/logos/vieos.webp'), format: 'WEBP' }
    ];

    for (const candidate of candidates) {
        if (!fs.existsSync(candidate.filePath)) continue;
        const raw = fs.readFileSync(candidate.filePath);
        PDF_LOGO_CACHE.dataUri = `data:image/${candidate.format.toLowerCase()};base64,${raw.toString('base64')}`;
        PDF_LOGO_CACHE.format = candidate.format;
        return PDF_LOGO_CACHE;
    }

    return null;
};

// =============================================
// Internal pricing logic
// =============================================
/** Maps UI values (member, solo, group) ke kunci harga & enum DB (solo | group). */
const normalizePricingKind = (chekiType) => {
    const u = (chekiType || 'solo').toString().toLowerCase();
    if (u === 'group') return 'group';
    return 'solo';
};

/** Nilai yang valid untuk kolom enum public.cheki_type di Postgres. */
const toDbChekiType = (chekiType) => {
    return normalizePricingKind(chekiType) === 'group' ? 'group' : 'solo';
};

const calculateInternalPrice = async (eventId, chekiType, memberId = null) => {
    const kind = normalizePricingKind(chekiType);

    // 1. Try event-specific pricing
    const { data: event } = await supabase
        .from('events')
        .select('special_prices')
        .eq('id', eventId)
        .single();

    if (event && event.special_prices) {
        if (memberId && event.special_prices[memberId]) {
            return event.special_prices[memberId];
        }
        if (event.special_prices[kind]) {
            return event.special_prices[kind];
        }
    }

    // 2. Fall back to global settings (kunci dari Admin: regular_cheki_solo / regular_cheki_group)
    const { data: settings } = await supabase
        .from('settings')
        .select('prices')
        .eq('id', 1)
        .single();

    const p = settings?.prices || {};
    if (kind === 'group') {
        return p.regular_cheki_group ?? p.group ?? 35000;
    }
    return p.regular_cheki_solo ?? p.solo ?? p.member ?? 30000;
};

/** 6 digit angka stabil dari id (UUID / bigint) untuk kode publik. */
const uniqueNumericFromId = (id) => {
    const s = String(id).replace(/-/g, '');
    if (/^\d+$/.test(s)) {
        return s.slice(-6).padStart(6, '0');
    }
    let h = 0;
    for (let i = 0; i < s.length; i += 1) {
        h = ((h << 5) - h + s.charCodeAt(i)) | 0;
    }
    return String(Math.abs(h) % 1000000).padStart(6, '0');
};

/** Kode tampilan: VPO (pre-order online) atau VOTS (booth) + 6 digit + DDMMYY waktu WIB. */
const buildPublicOrderCode = (mode, createdAt, id) => {
    const prefix = mode === 'ots' ? 'VOTS' : 'VPO';
    const d = new Date(createdAt || Date.now());
    let dd = '00';
    let mm = '00';
    let yy = '00';
    if (!Number.isNaN(d.getTime())) {
        const formatter = new Intl.DateTimeFormat('en-GB', {
            timeZone: 'Asia/Jakarta',
            day: '2-digit',
            month: '2-digit',
            year: '2-digit'
        });
        const parts = formatter.formatToParts(d);
        const M = Object.fromEntries(parts.filter((p) => p.type !== 'literal').map((p) => [p.type, p.value]));
        dd = M.day;
        mm = M.month;
        yy = M.year;
    }
    const uniq = uniqueNumericFromId(id);
    return `${prefix}${uniq}${dd}${mm}${yy}`;
};

/** Satukan bentuk baris order (skema baru vs lama) untuk API & export. */
const normalizeOrderRow = (row) => {
    if (!row) return row;
    const nickname = row.nickname ?? row.customer_name ?? '';
    const contact = row.contact ?? row.whatsapp_number ?? '';
    const total_price = row.total_price ?? row.total_amount ?? 0;
    let qty = row.qty ?? 1;
    let items = Array.isArray(row.items) ? row.items : [];
    let note = row.note ?? '';
    let mode = row.mode ?? 'online';
    let payment_method = row.payment_method ?? 'transfer';

    if (items.length === 0 && row.customer_email && typeof row.customer_email === 'string' && row.customer_email.startsWith('{')) {
        try {
            const packed = JSON.parse(row.customer_email);
            if (packed.vieos_truncated) {
                if (packed.vieos_qty != null) qty = packed.vieos_qty;
                if (packed.vieos_mode) mode = packed.vieos_mode;
                if (packed.vieos_payment) payment_method = packed.vieos_payment;
                if (packed.vieos_note) note = packed.vieos_note;
            } else if (Array.isArray(packed.vieos_items)) {
                items = packed.vieos_items;
                if (packed.vieos_note) note = packed.vieos_note;
                if (packed.vieos_qty != null) qty = packed.vieos_qty;
                if (packed.vieos_mode) mode = packed.vieos_mode;
                if (packed.vieos_payment) payment_method = packed.vieos_payment;
            }
        } catch (_) { /* bukan JSON vieos */ }
    }

    const member_id = row.member_id ?? (items.length
        ? items.map((i) => `${i.member_id} x${i.qty}`).join(', ')
        : '');

    const public_code = buildPublicOrderCode(mode, row.created_at, row.id);

    return {
        ...row,
        nickname,
        contact,
        total_price,
        qty,
        items,
        member_id,
        mode,
        note,
        payment_method,
        public_code
    };
};

const isOrdersColumnSchemaError = (err) => {
    const msg = err?.message || err?.details || '';
    return /Could not find the '[^']+' column of 'orders'/i.test(msg)
        || /column .*orders.* does not exist/i.test(msg);
};

// =============================================
// ORDERS
// =============================================
exports.createOrder = async (req, res) => {
    try {
        const { event_id, member_id, items, cheki_type, qty, mode, payment_proof_url, nickname, contact, payment_method, note } = req.body;

        let final_member_id = member_id;
        let final_qty = qty;
        let total_price = 0;

        if (items && Array.isArray(items) && items.length > 0) {
            let sum = 0;
            for (const item of items) {
                const itemPrice = await calculateInternalPrice(event_id, item.cheki_type || cheki_type, item.member_id);
                sum += itemPrice * item.qty;
            }
            total_price = sum;
            final_member_id = items.map(i => `${i.member_id} x${i.qty}`).join(', ');
            final_qty = items.reduce((acc, i) => acc + i.qty, 0);
        } else {
            const price = await calculateInternalPrice(event_id, cheki_type);
            total_price = price * qty;
        }

        const primaryCheki = items?.length ? (items[0].cheki_type || cheki_type) : cheki_type;
        const dbChekiType = toDbChekiType(primaryCheki);

        const modernRow = {
            nickname,
            contact,
            event_id,
            member_id: final_member_id,
            items: items || [],
            cheki_type: dbChekiType,
            qty: final_qty,
            total_price,
            mode,
            payment_method: payment_method || 'cash',
            payment_proof_url: mode === 'ots' ? null : payment_proof_url,
            status: mode === 'ots' ? 'paid' : 'pending',
            note
        };

        let { data, error } = await supabase
            .from('orders')
            .insert(modernRow)
            .select()
            .single();

        if (error && isOrdersColumnSchemaError(error)) {
            const itemsNote = (items && items.length > 0)
                ? JSON.stringify({ vieos_items: items, vieos_note: note || '', vieos_qty: final_qty, vieos_mode: mode || 'online', vieos_payment: payment_method || 'cash' })
                : (note || '');
            let customer_email = itemsNote.length <= 255 ? itemsNote : null;
            if (itemsNote.length > 255) {
                console.warn('[orders] Detail item terlalu panjang untuk kolom customer_email (max 255). Total & kontak tetap tersimpan; jalankan db/02_migrate_orders_to_app.sql untuk menyimpan semua item.');
                customer_email = JSON.stringify({
                    vieos_truncated: true,
                    vieos_qty: final_qty,
                    vieos_mode: mode || 'online',
                    vieos_payment: payment_method || 'cash',
                    vieos_note: (note || '').slice(0, 120)
                });
            }
            const legacyRow = {
                customer_name: nickname,
                whatsapp_number: contact,
                event_id,
                cheki_type: dbChekiType,
                total_amount: total_price,
                payment_proof_url: mode === 'ots' ? null : payment_proof_url,
                status: mode === 'ots' ? 'paid' : 'pending',
                customer_email
            };
            console.warn('[orders] Insert skema baru gagal; memakai kolom lama (customer_name/whatsapp_number/total_amount). Jalankan db/02_migrate_orders_to_app.sql di Supabase untuk skema lengkap.');
            ({ data, error } = await supabase
                .from('orders')
                .insert(legacyRow)
                .select()
                .single());
        }

        if (error) throw error;
        let payload = normalizeOrderRow(data);
        if (event_id != null && event_id !== '') {
            const { data: evData } = await supabase
                .from('events')
                .select('name')
                .eq('id', event_id)
                .maybeSingle();
            if (evData?.name) {
                payload = { ...payload, event_name: evData.name };
            }
        }
        res.status(201).json(payload);
    } catch (error) {
        console.error('createOrder error:', error);
        const hint = isOrdersColumnSchemaError(error)
            ? ' Jalankan migrasi SQL: db/02_migrate_orders_to_app.sql di Supabase → SQL Editor.'
            : '';
        res.status(500).json({ error: `${error.message || error}${hint}` });
    }
};

exports.getAllOrders = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('orders')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.status(200).json((data || []).map(normalizeOrderRow));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        let { status } = req.body;

        // Map UI 'done' to database 'verified' enum
        if (status === 'done') status = 'verified';

        const { data, error } = await supabase
            .from('orders')
            .update({ status })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        res.status(200).json(normalizeOrderRow(data));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateOrderDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const { nickname, contact, items, payment_method, note, event_id } = req.body;

        let total_price = 0;
        let final_member_id = '';
        let final_qty = 0;

        if (items && Array.isArray(items) && items.length > 0) {
            let sum = 0;
            for (const item of items) {
                const itemPrice = await calculateInternalPrice(event_id, item.cheki_type || 'solo', item.member_id);
                sum += itemPrice * item.qty;
            }
            total_price = sum;
            final_member_id = items.map(i => `${i.member_id} x${i.qty}`).join(', ');
            final_qty = items.reduce((acc, i) => acc + i.qty, 0);
        }

        const { data, error } = await supabase
            .from('orders')
            .update({
                nickname,
                contact,
                items,
                member_id: final_member_id,
                qty: final_qty,
                total_price,
                payment_method,
                note
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        res.status(200).json(normalizeOrderRow(data));
    } catch (error) {
        console.error('updateOrderDetails error:', error);
        res.status(500).json({ error: error.message });
    }
};

// =============================================
// IMAGE UPLOAD (Payment Proof)
// =============================================
exports.uploadProof = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const fileName = `proof_${Date.now()}_${req.file.originalname}`;
        const { data, error } = await supabase.storage
            .from('payment-proofs')
            .upload(fileName, req.file.buffer, {
                contentType: req.file.mimetype,
                upsert: false
            });

        if (error) throw error;

        const { data: urlData } = supabase.storage
            .from('payment-proofs')
            .getPublicUrl(fileName);

        res.status(200).json({ url: urlData.publicUrl });
    } catch (error) {
        console.error('uploadProof error:', error);
        res.status(500).json({ error: error.message });
    }
};

// =============================================
// EVENTS
// =============================================
exports.getAllEvents = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('events')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Auto-mark past events as done
        const now = new Date();
        const updatedEvents = data.map(ev => {
            if (ev.po_deadline && new Date(ev.po_deadline) < now && ev.status !== 'done') {
                return { ...ev, status: 'done' };
            }
            return ev;
        });

        res.status(200).json(updatedEvents);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.addEvent = async (req, res) => {
    try {
        const payload = {
            name: req.body.name,
            type: req.body.type === 'standard' ? 'regular' : 'special',
            event_date: req.body.date,
            event_time: req.body.time || '',
            location: req.body.location || '',
            // Additional fields (you will need to run an ALTER TABLE to add these if they don't exist, see chat)
            status: req.body.status || 'ongoing',
            po_deadline: req.body.po_deadline || null,
            theme: req.body.theme || '',
            lineup: req.body.lineup || ['GROUP'],
            available_members: req.body.available_members || ['GROUP'],
            special_prices: {
                "solo": parseInt(req.body.special_solo_price) || 30000,
                "group": parseInt(req.body.special_group_price) || 35000
            }
        };

        const { data, error } = await supabase
            .from('events')
            .insert(payload)
            .select()
            .single();

        if (error) throw error;
        res.status(201).json(data);
    } catch (error) {
        console.error('addEvent error:', error);
        res.status(500).json({ error: error.message });
    }
};

exports.updateEvent = async (req, res) => {
    try {
        const { id } = req.params;
        const payload = {
            name: req.body.name,
            type: req.body.type === 'standard' ? 'regular' : 'special',
            event_date: req.body.date,
            event_time: req.body.time || '',
            location: req.body.location || '',
            status: req.body.status || 'ongoing',
            po_deadline: req.body.po_deadline || null,
            theme: req.body.theme || '',
            lineup: req.body.lineup || ['GROUP'],
            available_members: req.body.available_members || ['GROUP'],
            special_prices: {
                "solo": parseInt(req.body.special_solo_price) || 30000,
                "group": parseInt(req.body.special_group_price) || 35000
            }
        };

        const { data, error } = await supabase
            .from('events')
            .update(payload)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.deleteEvent = async (req, res) => {
    try {
        const { id } = req.params;

        // 1. Ambil semua order terkait event ini untuk mendapatkan gambar struk
        const { data: orders, error: fetchError } = await supabase
            .from('orders')
            .select('payment_proof_url')
            .eq('event_id', id);

        if (fetchError) throw fetchError;

        // 2. Hapus gambar struk dari bucket storage (payment-proofs) jika ada
        if (orders && orders.length > 0) {
            const filesToDelete = orders
                .filter(order => order.payment_proof_url)
                .map(order => {
                    const parts = order.payment_proof_url.split('/');
                    return parts[parts.length - 1]; // Mengambil nama file dari URL
                });

            if (filesToDelete.length > 0) {
                const { error: storageError } = await supabase
                    .storage
                    .from('payment-proofs')
                    .remove(filesToDelete);

                if (storageError) {
                    console.error('Gagal menghapus gambar dari storage:', storageError);
                }
            }
        }

        // 3. Hapus semua order yang terhubung dengan event ini
        const { error: deleteOrdersError } = await supabase
            .from('orders')
            .delete()
            .eq('event_id', id);
            
        if (deleteOrdersError) throw deleteOrdersError;

        // 4. Hapus event itu sendiri
        const { error: deleteEventError } = await supabase
            .from('events')
            .delete()
            .eq('id', id);

        if (deleteEventError) throw deleteEventError;

        res.status(200).json({ message: 'Event dan order terkait berhasil dihapus.' });
    } catch (error) {
        console.error('Error saat menghapus event:', error);
        res.status(500).json({ error: error.message });
    }
};

// =============================================
// SETTINGS
// =============================================
exports.getSettings = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('settings')
            .select('*')
            .eq('id', 1)
            .single();

        // Even if error (e.g. table doesn't exist yet), return default values instead of throwing 500
        res.status(200).json(data || { 
            prices: { 
                regular_cheki_solo: 30000, 
                regular_cheki_group: 35000 
            } 
        });
    } catch (error) {
        // Fallback if something critically fails
        res.status(200).json({ prices: { member: 30000, group: 35000 } });
    }
};

exports.updateSettings = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('settings')
            .update(req.body)
            .eq('id', 1)
            .select()
            .single();

        if (error) throw error;
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// =============================================
// KEEP ALIVE
// =============================================
exports.getKeepAlive = (req, res) => {
    res.status(200).send('Alive and connected to Supabase.');
};

// =============================================
// EXPORT: EXCEL
// =============================================
exports.exportToExcel = async (req, res) => {
    try {
        const { eventId } = req.params;

        // Get event info
        let event = null;
        if (eventId !== 'all') {
            const { data } = await supabase.from('events').select('*').eq('id', eventId).single();
            event = data;
        }

        // Get orders
        let query = supabase.from('orders').select('*');
        if (eventId !== 'all') query = query.eq('event_id', eventId);
        const { data: eventOrdersRaw, error } = await query;
        if (error) throw error;
        const eventOrders = (eventOrdersRaw || []).map(normalizeOrderRow);

        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'VIEOS';

        const reportSheet = workbook.addWorksheet('VIEOS Report', {
            views: [{ showGridLines: true }]
        });

        const theme = {
            dark: 'FF121214',
            pink: 'FFFF1B8D',
            blue: 'FF4169E1',
            purple: 'FF7C3AED',
            soft: 'FFF7F7FA',
            line: 'FFE6E2E8',
            text: 'FF1E2132',
            muted: 'FF6B7280',
            zebra: 'FFF3F1F8'
        };

        const fillRange = (startRow, startCol, endRow, endCol, fill) => {
            for (let r = startRow; r <= endRow; r += 1) {
                for (let c = startCol; c <= endCol; c += 1) {
                    reportSheet.getCell(r, c).fill = fill;
                }
            }
        };

        const setBorder = (startRow, startCol, endRow, endCol) => {
            const border = {
                top: { style: 'thin', color: { argb: theme.line } },
                left: { style: 'thin', color: { argb: theme.line } },
                bottom: { style: 'thin', color: { argb: theme.line } },
                right: { style: 'thin', color: { argb: theme.line } }
            };
            for (let r = startRow; r <= endRow; r += 1) {
                for (let c = startCol; c <= endCol; c += 1) {
                    reportSheet.getCell(r, c).border = border;
                }
            }
        };

        const columns = [18, 18, 18, 22, 18, 10, 16, 12, 20];
        columns.forEach((width, idx) => {
            reportSheet.getColumn(idx + 1).width = width;
        });

        reportSheet.mergeCells('A1:H2');
        reportSheet.mergeCells('A3:H3');
        fillRange(1, 1, 3, 8, { type: 'pattern', pattern: 'solid', fgColor: { argb: theme.dark } });

        const titleCell = reportSheet.getCell('A1');
        titleCell.value = {
            richText: [
                { text: 'VIEOS ', font: { name: 'Plus Jakarta Sans', size: 24, bold: true, color: { argb: 'FFFFFFFF' } } },
                { text: '.REPORT', font: { name: 'Plus Jakarta Sans', size: 24, bold: true, color: { argb: theme.pink } } }
            ]
        };
        titleCell.alignment = { vertical: 'middle', horizontal: 'left' };

        const subtitleCell = reportSheet.getCell('A3');
        subtitleCell.value = `OFFICIAL SALES SUMMARY | ${new Date().toLocaleDateString('id-ID')}`;
        subtitleCell.font = { name: 'Plus Jakarta Sans', size: 10, color: { argb: 'FFB0B4BE' }, bold: false };
        subtitleCell.alignment = { vertical: 'middle', horizontal: 'left' };

        reportSheet.getRow(1).height = 26;
        reportSheet.getRow(2).height = 26;
        reportSheet.getRow(3).height = 18;
        reportSheet.getRow(5).height = 16;
        reportSheet.getRow(6).height = 20;
        reportSheet.getRow(7).height = 18;
        reportSheet.getRow(9).height = 16;
        reportSheet.getRow(10).height = 20;
        reportSheet.getRow(11).height = 20;

        const eventName = event ? event.name : 'ALL EVENTS';
        const eventDate = event?.event_date ? new Date(event.event_date) : null;
        const eventDateText = eventDate && !Number.isNaN(eventDate.getTime()) ? eventDate.toLocaleDateString('id-ID') : '-';
        const eventTimeText = event?.event_time ? event.event_time : '-';
        const eventLocationText = event?.location ? event.location : '-';
        const eventStatusText = event?.status ? String(event.status).toUpperCase() : '-';

        reportSheet.mergeCells('A5:H5');
        reportSheet.mergeCells('A6:H6');
        reportSheet.mergeCells('A7:H7');

        const eventLabelCell = reportSheet.getCell('A5');
        eventLabelCell.value = 'EVENT';
        eventLabelCell.font = { name: 'Plus Jakarta Sans', size: 9, bold: true, color: { argb: theme.muted } };
        eventLabelCell.alignment = { vertical: 'middle', horizontal: 'left' };

        const eventNameCell = reportSheet.getCell('A6');
        eventNameCell.value = eventName;
        eventNameCell.font = { name: 'Plus Jakarta Sans', size: 14, bold: true, color: { argb: theme.text } };
        eventNameCell.alignment = { vertical: 'middle', horizontal: 'left' };

        const eventMetaCell = reportSheet.getCell('A7');
        eventMetaCell.value = `TGL: ${eventDateText} | WAKTU: ${eventTimeText} | LOKASI: ${eventLocationText} | STATUS: ${eventStatusText}`;
        eventMetaCell.font = { name: 'Plus Jakarta Sans', size: 9, color: { argb: theme.muted } };
        eventMetaCell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };

        const totalSales = eventOrders.reduce((acc, o) => acc + o.total_price, 0);
        const totalQty = eventOrders.reduce((acc, o) => acc + o.qty, 0);
        const otsCount = eventOrders.filter(o => o.mode === 'ots').length;
        const poCount = eventOrders.filter(o => o.mode !== 'ots').length;

        const drawCard = (startCol, label, value, accent) => {
            reportSheet.mergeCells(9, startCol, 9, startCol + 1);
            reportSheet.mergeCells(10, startCol, 11, startCol + 1);
            fillRange(9, startCol, 11, startCol + 1, { type: 'pattern', pattern: 'solid', fgColor: { argb: theme.soft } });
            setBorder(9, startCol, 11, startCol + 1);

            const labelCell = reportSheet.getCell(9, startCol);
            labelCell.value = label;
            labelCell.font = { name: 'Plus Jakarta Sans', size: 9, bold: true, color: { argb: theme.muted } };
            labelCell.alignment = { vertical: 'middle', horizontal: 'left' };

            const valueCell = reportSheet.getCell(10, startCol);
            valueCell.value = value;
            valueCell.font = { name: 'Plus Jakarta Sans', size: 14, bold: true, color: { argb: accent } };
            valueCell.alignment = { vertical: 'middle', horizontal: 'left' };
        };

        drawCard(1, 'KEUNTUNGAN', `Rp ${totalSales.toLocaleString('id-ID')}`, theme.pink);
        drawCard(3, 'TOTAL POLAROID', `${totalQty} units`, theme.blue);
        drawCard(5, 'OTS ORDERS', `${otsCount} orders`, theme.blue);
        drawCard(7, 'PO ORDERS', `${poCount} orders`, theme.pink);

        reportSheet.mergeCells('A13:H13');
        const memberHeaderCell = reportSheet.getCell('A13');
        memberHeaderCell.value = 'MEMBER PERFORMANCE (A-Z)';
        memberHeaderCell.font = { name: 'Plus Jakarta Sans', size: 11, bold: true, color: { argb: theme.text } };
        memberHeaderCell.alignment = { vertical: 'middle', horizontal: 'left' };

        const memberStats = {};
        const normalizeMemberName = (name) => {
            const n = name.trim();
            const lower = n.toLowerCase();
            if (lower === 'group cheki' || lower === 'group') return 'GROUP';
            if (lower === 'abell') return 'Abel';
            return n;
        };

        for (const o of eventOrders) {
            const members = (o.member_id || '').split(', ').map(s => s.trim()).filter(Boolean);
            for (const mStr of members) {
                const parts = mStr.split(' x');
                const rawName = (parts[0] || '').trim();
                if (!rawName) continue;
                
                const name = normalizeMemberName(rawName);
                const qty = parts[1] ? parseInt(parts[1], 10) : o.qty;
                
                if (!memberStats[name]) memberStats[name] = { qty: 0, revenue: 0 };
                memberStats[name].qty += qty;
                
                const price = await calculateInternalPrice(o.event_id, o.cheki_type, rawName);
                memberStats[name].revenue += (price * qty);
            }
        }

        const memberHeaderRow = 14;
        reportSheet.mergeCells(`C${memberHeaderRow}:D${memberHeaderRow}`);
        reportSheet.getCell(`A${memberHeaderRow}`).value = 'Member / Lineup';
        reportSheet.getCell(`B${memberHeaderRow}`).value = 'Qty';
        reportSheet.getCell(`C${memberHeaderRow}`).value = 'Revenue';

        for (const cellRef of [`A${memberHeaderRow}`, `B${memberHeaderRow}`, `C${memberHeaderRow}`, `D${memberHeaderRow}`]) {
            const cell = reportSheet.getCell(cellRef);
            cell.font = { name: 'Plus Jakarta Sans', size: 9, bold: true, color: { argb: 'FFFFFFFF' } };
            cell.alignment = { vertical: 'middle', horizontal: 'left' };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: theme.pink } };
        }

        let memberRow = memberHeaderRow + 1;
        const memberNames = Object.keys(memberStats)
            .sort((a, b) => a.localeCompare(b, 'id', { sensitivity: 'base' }))
            ;

        memberNames.forEach((name, index) => {
            const stats = memberStats[name];
            reportSheet.mergeCells(`C${memberRow}:D${memberRow}`);
            reportSheet.getCell(`A${memberRow}`).value = name;
            reportSheet.getCell(`B${memberRow}`).value = stats.qty;
            reportSheet.getCell(`C${memberRow}`).value = stats.revenue;
            reportSheet.getCell(`C${memberRow}`).numFmt = '"Rp "#,##0';
            reportSheet.getCell(`A${memberRow}`).font = { name: 'Plus Jakarta Sans', size: 9, color: { argb: theme.text } };
            reportSheet.getCell(`B${memberRow}`).font = { name: 'Plus Jakarta Sans', size: 9, color: { argb: theme.text } };
            reportSheet.getCell(`C${memberRow}`).font = { name: 'Plus Jakarta Sans', size: 9, bold: true, color: { argb: theme.pink } };

            if (index % 2 === 0) {
                fillRange(memberRow, 1, memberRow, 4, { type: 'pattern', pattern: 'solid', fgColor: { argb: theme.zebra } });
            }

            memberRow += 1;
        });

        setBorder(memberHeaderRow, 1, memberRow - 1, 4);

        const detailHeaderRow = memberRow + 2;
        reportSheet.mergeCells(`A${detailHeaderRow}:I${detailHeaderRow}`);
        const detailTitleCell = reportSheet.getCell(`A${detailHeaderRow}`);
        detailTitleCell.value = 'TRANSACTION DETAILS';
        detailTitleCell.font = { name: 'Plus Jakarta Sans', size: 11, bold: true, color: { argb: theme.text } };
        detailTitleCell.alignment = { vertical: 'middle', horizontal: 'left' };

        const detailHeaders = ['Kode', 'Customer', 'Contact', 'Type', 'Items', 'Qty', 'Amount', 'Status', 'Date'];
        const otsOrders = eventOrders.filter(o => o.mode === 'ots');
        const poOrders = eventOrders.filter(o => o.mode !== 'ots');

        const addDetailSection = (title, color, orders, startRow) => {
            reportSheet.mergeCells(`A${startRow}:I${startRow}`);
            const sectionCell = reportSheet.getCell(`A${startRow}`);
            sectionCell.value = title;
            sectionCell.font = { name: 'Plus Jakarta Sans', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
            sectionCell.alignment = { vertical: 'middle', horizontal: 'left' };
            sectionCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: color } };

            const headRow = startRow + 1;
            detailHeaders.forEach((label, idx) => {
                const cell = reportSheet.getCell(headRow, idx + 1);
                cell.value = label;
                cell.font = { name: 'Plus Jakarta Sans', size: 9, bold: true, color: { argb: 'FFFFFFFF' } };
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: theme.dark } };
                cell.alignment = { vertical: 'middle', horizontal: 'left' };
            });

            let rowCursor = headRow + 1;
            orders.forEach((order, index) => {
                const code = order.public_code || buildPublicOrderCode(order.mode, order.created_at, order.id);
                const typeLabel = order.mode === 'ots' ? 'OTS' : 'PO';

                reportSheet.getCell(rowCursor, 1).value = code;
                reportSheet.getCell(rowCursor, 2).value = order.nickname || '-';
                reportSheet.getCell(rowCursor, 3).value = order.contact || '-';
                reportSheet.getCell(rowCursor, 4).value = typeLabel;
                reportSheet.getCell(rowCursor, 5).value = order.member_id || '-';
                reportSheet.getCell(rowCursor, 6).value = order.qty;
                reportSheet.getCell(rowCursor, 7).value = order.total_price || 0;
                reportSheet.getCell(rowCursor, 8).value = (order.status || '').toUpperCase();
                reportSheet.getCell(rowCursor, 9).value = new Date(order.created_at).toLocaleString('id-ID');

                reportSheet.getCell(rowCursor, 4).font = { name: 'Plus Jakarta Sans', size: 9, bold: true, color: { argb: color } };
                reportSheet.getCell(rowCursor, 7).numFmt = '"Rp "#,##0';
                reportSheet.getCell(rowCursor, 7).font = { name: 'Plus Jakarta Sans', size: 9, bold: true, color: { argb: theme.pink } };

                if (index % 2 === 0) {
                    fillRange(rowCursor, 1, rowCursor, 9, { type: 'pattern', pattern: 'solid', fgColor: { argb: theme.zebra } });
                }

                rowCursor += 1;
            });

            setBorder(headRow, 1, rowCursor - 1, 9);
            return rowCursor + 1;
        };

        let detailRowCursor = detailHeaderRow + 1;
        detailRowCursor = addDetailSection('OTS ORDERS', theme.purple, otsOrders, detailRowCursor);
        addDetailSection('PO ORDERS', theme.pink, poOrders, detailRowCursor);

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=VIEOS_Report_${event ? event.name.replace(/\s+/g, '_') : 'All'}.xlsx`);

        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error('exportToExcel error:', error);
        res.status(500).json({ error: error.message });
    }
};

// =============================================
// EXPORT: PDF
// =============================================
exports.exportToPdf = async (req, res) => {
    try {
        const { eventId } = req.params;

        let event = null;
        if (eventId !== 'all') {
            const { data } = await supabase.from('events').select('*').eq('id', eventId).single();
            event = data;
        }

        let query = supabase.from('orders').select('*').neq('status', 'pending');
        if (eventId !== 'all') query = query.eq('event_id', eventId);
        const { data: eventOrdersRaw, error } = await query;
        if (error) throw error;
        const eventOrders = (eventOrdersRaw || []).map(normalizeOrderRow);

        const doc = new jsPDF();
        const pink = [255, 41, 117];
        const blue = [65, 105, 225];
        const dark = [18, 18, 20];

        const eventDate = event?.event_date ? new Date(event.event_date) : null;
        const eventDateText = eventDate && !Number.isNaN(eventDate.getTime()) ? eventDate.toLocaleDateString('id-ID') : '-';

        // Header Section
        doc.setFillColor(...dark);
        doc.rect(0, 0, 210, 45, 'F');

        const logo = getPdfLogo();
        if (logo) {
            try {
                doc.addImage(logo.dataUri, logo.format, 170, 9, 26, 26);
            } catch (logoError) {
                console.warn('PDF logo skipped:', logoError.message);
            }
        }

        doc.setFontSize(28);
        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.text("VIEOS", 14, 25);
        doc.setTextColor(...pink);
        doc.text(".REPORT", 48, 25);

        const headerEventName = (event ? event.name : 'ALL EVENTS').toUpperCase();
        const recapDate = eventDateText !== '-' ? eventDateText : new Date().toLocaleDateString('id-ID');

        doc.setFontSize(12);
        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.text(headerEventName, 14, 35);

        doc.setFontSize(9);
        doc.setTextColor(150, 150, 150);
        doc.setFont("helvetica", "normal");
        doc.text(`OFFICIAL RECAP - ${recapDate}`, 14, 41);

        // Analytics
        const totalSales = eventOrders.reduce((acc, o) => acc + o.total_price, 0);
        const totalQty = eventOrders.reduce((acc, o) => acc + o.qty, 0);
        const readyToCollect = eventOrders.filter(o => o.status === 'paid').length;
        const doneCount = eventOrders.filter(o => o.status === 'verified' || o.status === 'done').length;

        doc.setFontSize(12);
        doc.setTextColor(0);
        doc.text("SALES OVERVIEW", 14, 60);
        doc.setDrawColor(...pink);
        doc.setLineWidth(1);
        doc.line(14, 62, 30, 62);

        const drawCard = (x, y, label, value, accent) => {
            doc.setFillColor(250, 250, 250);
            doc.roundedRect(x, y, 45, 25, 2, 2, 'F');
            doc.setTextColor(100);
            doc.setFontSize(8);
            doc.setFont("helvetica", "normal");
            doc.text(label, x + 5, y + 8);
            doc.setTextColor(...accent);
            doc.setFontSize(12);
            doc.setFont("helvetica", "bold");
            doc.text(value, x + 5, y + 18);
        };

        drawCard(14, 68, "REVENUE (PAID)", `Rp ${totalSales.toLocaleString()}`, pink);
        drawCard(63, 68, "PAID & READY", `${readyToCollect} orders`, blue);
        drawCard(112, 68, "COMPLETED", `${doneCount} orders`, blue);
        drawCard(161, 68, "TOTAL ITEMS", `${totalQty} units`, pink);

        // Member Performance
        doc.setFontSize(12);
        doc.setTextColor(0);
        doc.text("MEMBER PERFORMANCE (A-Z)", 14, 110);

        const memberStats = {};
        const normalizeMemberName = (name) => {
            const n = name.trim();
            const lower = n.toLowerCase();
            if (lower === 'group cheki' || lower === 'group') return 'GROUP';
            if (lower === 'abell') return 'Abel';
            // Return original if no mapping found, but capitalized consistently if desired
            return n;
        };

        for (const o of eventOrders) {
            const membersList = (o.member_id || '').split(', ').map(s => s.trim()).filter(Boolean);
            for (const mStr of membersList) {
                const parts = mStr.split(' x');
                const rawName = (parts[0] || '').trim();
                if (!rawName) continue;
                
                const name = normalizeMemberName(rawName);
                const qty = parts[1] ? parseInt(parts[1], 10) : o.qty;
                
                if (!memberStats[name]) memberStats[name] = { qty: 0, revenue: 0 };
                memberStats[name].qty += qty;
                
                const price = await calculateInternalPrice(o.event_id, o.cheki_type, rawName);
                memberStats[name].revenue += (price * qty);
            }
        }

        const summaryData = Object.entries(memberStats)
            .sort(([a], [b]) => a.localeCompare(b, 'id', { sensitivity: 'base' }))
            .map(([name, stats]) => [
                name, stats.qty, `Rp ${stats.revenue.toLocaleString()}`
            ]);

        doc.autoTable({
            head: [['Member / Lineup', 'Qty Sold', 'Revenue']],
            body: summaryData,
            startY: 115,
            theme: 'grid',
            headStyles: { fillColor: pink, textColor: [255, 255, 255], fontStyle: 'bold' },
            styles: { fontSize: 9, cellPadding: 4 },
            columnStyles: { 2: { halign: 'right', fontStyle: 'bold' } }
        });

        // Transaction Details
        doc.addPage();
        doc.setFillColor(...dark);
        doc.rect(0, 0, 210, 20, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(12);
        doc.text("TRANSACTION DETAILS ARCHIVE", 14, 13);

        const renderOrderSection = (title, color, orders, startY) => {
            const pageHeight = doc.internal.pageSize.getHeight();
            let cursorY = startY;

            if (cursorY > pageHeight - 40) {
                doc.addPage();
                cursorY = 25;
            }

            doc.setFontSize(10);
            doc.setTextColor(...color);
            doc.setFont("helvetica", "bold");
            doc.text(title, 14, cursorY);

            const tableBody = orders.map((o) => [
                o.public_code || buildPublicOrderCode(o.mode, o.created_at, o.id),
                o.nickname || '-',
                o.contact || '-',
                o.member_id || '-',
                `Rp ${o.total_price.toLocaleString()}`,
                o.status.toUpperCase() === 'PAID' ? 'CHEKE' : o.status.toUpperCase() === 'PENDING' ? 'UNCEK' : 'DONE'
            ]);

            doc.autoTable({
                head: [['Kode', 'Customer', 'Contact', 'Items', 'Amount', 'Status']],
                body: tableBody,
                startY: cursorY + 4,
                styles: { fontSize: 8 },
                headStyles: { fillColor: [60, 60, 60], textColor: [255, 255, 255] },
                columnStyles: { 4: { halign: 'right', fontStyle: 'bold', textColor: pink } }
            });

            return (doc.lastAutoTable?.finalY || cursorY + 12) + 6;
        };

        const otsOrders = eventOrders.filter(o => o.mode === 'ots');
        const poOrders = eventOrders.filter(o => o.mode !== 'ots');

        let detailCursor = 25;
        detailCursor = renderOrderSection('OTS ORDERS', blue, otsOrders, detailCursor);
        renderOrderSection('PO ORDERS', pink, poOrders, detailCursor);

        // Footer
        const pageCount = doc.internal.getNumberOfPages();
        doc.setFontSize(8);
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setTextColor(150);
            doc.text(`Page ${i} of ${pageCount} \u2022 VIEOS Official Admin System`, 14, 285);
        }

        const pdfOutput = doc.output();
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=VIEOS_Report_${event ? event.name.replace(/\s+/g, '_') : 'All'}.pdf`);
        res.send(Buffer.from(pdfOutput, 'binary'));
    } catch (error) {
        console.error('exportToPdf error:', error);
        res.status(500).json({ error: error.message });
    }
};
