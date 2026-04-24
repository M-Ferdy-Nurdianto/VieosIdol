-- ==========================================
-- 02_seed_data.sql
-- Initial Data Migration from constants.js
-- ==========================================

-- 1. Insert Members
-- We use OVERRIDING SYSTEM VALUE if we want to force the inserted ID to match exactly the frontend
INSERT INTO public.members (id, name, nickname, theme_color, symbol, vibe, catchphrase, highlight)
OVERRIDING SYSTEM VALUE
VALUES 
    (1, 'Maru, Blissful Mint', 'Maru', '#AAF0D1', 'M', 'Blissful Mint', '-', false),
    (2, 'Yomi, Sunny Yellow', 'Yomi', '#FFD700', 'Y', 'Sunny Yellow', '-', false),
    (3, 'Nanda, Sparkling Magenta', 'Nanda', '#FF00FF', 'N', 'Sparkling Magenta', '-', false),
    (4, 'Nana, Lovely Pink', 'Nana', '#FF1B8D', 'N', 'Lovely Pink', '-', false),
    (5, 'Rian, Forest Green', 'Rian', '#228B22', 'R', 'Forest Green', '-', false),
    (6, 'Kanai, Devilish Black', 'Kanai', '#1A1A1D', 'K', 'Devilish Black', '-', false),
    (7, 'Celline, Crystal White', 'Celline', '#F8F9FA', 'C', 'Crystal White', '-', false),
    (8, 'Axie, Baby Blue', 'Axie', '#89CFF0', 'A', 'Baby Blue', '-', false),
    (9, 'Abel, Dazzling Purple', 'Abel', '#A020F0', 'A', 'Dazzling Purple', '-', false),
    (10, 'Lynx, Lucky Red', 'Lynx', '#FF0000', 'L', 'Lucky Red', '-', false);

-- Adjust the sequence generator so future inserts resume from 11
SELECT setval(pg_get_serial_sequence('public.members', 'id'), 10, true);

-- 2. Insert Events
INSERT INTO public.events (id, name, type, event_date, event_time, location)
OVERRIDING SYSTEM VALUE
VALUES
    (1, 'Memoire Release Party', 'special', 'FEB 14', '19:00 WIB', 'Galaxy Mall, Surabaya'),
    (2, 'Weekly Idol Show', 'regular', 'EVERY SUN', '15:00 WIB', 'Tunjungan Plaza'),
    (3, 'Fan Meet & Cheki', 'special', 'MAR 01', '16:00 WIB', 'Royal Plaza');

SELECT setval(pg_get_serial_sequence('public.events', 'id'), 3, true);

-- 3. Insert Discography
INSERT INTO public.discography (id, title, subtitle, artist_url)
VALUES
    ('memoire', 'Memoire', 'The 3rd Single (Latest Release)', 'https://open.spotify.com/embed/album/3CGS010Grxn84KWFtxyIqe?utm_source=generator'),
    ('legacy', 'Legacy Collection', 'Lagu-Lagu Sebelumnya', 'https://open.spotify.com/embed/artist/31nPW3pzHgH3ROiGUFuKJm?utm_source=generator');

-- 4. Insert Songs
INSERT INTO public.songs (id, discography_id, title, subtitle, duration, lyrics)
VALUES
    ('01', 'memoire', 'Memoire', 'VIEOS', '04:11', 'Lyrics coming soon...');

-- Note: The PRICING object from constants:
-- SPECIAL_EVENT: 35000, REGULAR_GROUP: 35000, REGULAR_SOLO: 30000
-- This can still be kept as constants or settings in a configuration table, 
-- but normally you would just calculate it based on the ordered cheki_type and event_type in the backend. 
