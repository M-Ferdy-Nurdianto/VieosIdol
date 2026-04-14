import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import SpotifyEmbed from '../components/SpotifyEmbed';
import { Play, Music as MusicIcon, Star } from 'lucide-react';

const Music = () => {
    // Using the artist embed as the primary player to show all songs
    const artistEmbedUrl = "https://open.spotify.com/embed/artist/31nPW3pzHgH3ROiGUFuKJm?utm_source=generator";
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const mediaQuery = window.matchMedia('(max-width: 768px)');
        const updateIsMobile = () => setIsMobile(mediaQuery.matches);
        updateIsMobile();
        mediaQuery.addEventListener('change', updateIsMobile);
        return () => mediaQuery.removeEventListener('change', updateIsMobile);
    }, []);

    return (
        <div className="min-h-screen relative pt-24 md:pt-32 pb-24 md:pb-64 overflow-x-clip">
            {/* Background Effects */}
            <div className="playful-bg" />
            {!isMobile && <div className="grain-overlay" />}

            {/* Global Glows for consistency */}
            <div className="absolute top-[5%] right-[-10%] w-[260px] h-[260px] md:w-[600px] md:h-[600px] bg-vibrant-pink/10 rounded-full blur-[90px] md:blur-[160px] -z-0 pointer-events-none" />
            <div className="absolute bottom-[10%] left-[-15%] w-[280px] h-[280px] md:w-[800px] md:h-[800px] bg-vibrant-blue/10 rounded-full blur-[90px] md:blur-[140px] -z-0 pointer-events-none" />

            <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 md:px-8 relative z-10 overflow-x-clip">
                {/* Unified Header */}
                <div className="text-center mb-12 md:mb-16">
                    <motion.div 
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="inline-flex max-w-full items-center gap-2 md:gap-3 px-3 md:px-4 py-1.5 text-[9px] md:text-[10px] font-black tracking-[0.22em] md:tracking-[0.4em] uppercase mb-8 rounded-full border"
                        style={{ 
                            backgroundColor: 'var(--accent-soft)', 
                            borderColor: 'var(--border-main)',
                            color: 'var(--vibrant-pink)'
                        }}
                    >
                        <Star size={12} className="fill-current" />
                        Official Discography
                        <Star size={12} className="fill-current" />
                    </motion.div>
                    <motion.h1 
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="text-5xl md:text-8xl font-black mb-4 tracking-tighter uppercase"
                        style={{ color: 'var(--text-main)' }}
                    >
                        Music<br/>
                        <span className="text-gradient font-brand italic text-4xl md:text-7xl lowercase block">Universe.</span>
                    </motion.h1>
                </div>

                {/* Primary Universal Player (Spotify Artist) */}
                <motion.div 
                    initial={{ scale: 0.98, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="mb-16 md:mb-32 rounded-3xl overflow-hidden shadow-2xl border"
                    style={{ 
                        boxShadow: 'var(--shadow-lg)', 
                        backgroundColor: 'var(--bg-main)',
                        borderColor: 'var(--border-main)'
                    }}
                >
                    <SpotifyEmbed url={artistEmbedUrl} height={isMobile ? "360" : "450"} />
                </motion.div>

                {/* Bottom CTA */}
                <div className="flex w-full flex-col sm:flex-row justify-center items-center gap-4 md:gap-6">
                    <a 
                        href="https://open.spotify.com/artist/31nPW3pzHgH3ROiGUFuKJm?si=ogolGHJcTSyQGg-x0tWJuQ" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="vibrant-button w-full sm:w-auto inline-flex items-center gap-3 px-8 md:px-12 py-5 md:py-6 group shadow-2xl"
                        style={{ 
                            boxShadow: '0 20px 40px -10px rgba(255, 27, 141, 0.3)' 
                        }}
                    >
                        <MusicIcon className="w-5 h-5" />
                        <span className="relative z-10 font-black tracking-widest text-[10px]">LISTEN ON SPOTIFY</span>
                    </a>
                    
                    <a 
                        href="https://www.youtube.com/@VIEOS.official/videos" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="vibrant-button w-full sm:w-auto !bg-red-600 hover:!bg-red-700 inline-flex items-center gap-3 px-8 md:px-12 py-5 md:py-6 group shadow-2xl"
                        style={{ 
                            boxShadow: '0 20px 40px -10px rgba(220, 38, 38, 0.3)' 
                        }}
                    >
                        <Play className="w-5 h-5 fill-current" />
                        <span className="relative z-10 font-black tracking-widest text-[10px]">WATCH ON YOUTUBE</span>
                    </a>
                </div>

                <p className="text-center text-[11px] font-bold tracking-wide mt-8 opacity-70" style={{ color: 'var(--text-muted)' }}>
                    Kalau player tidak muncul di HP, pakai tombol LISTEN ON SPOTIFY untuk buka langsung di aplikasi.
                </p>
            </div>
        </div>
    );
};

export default Music;
