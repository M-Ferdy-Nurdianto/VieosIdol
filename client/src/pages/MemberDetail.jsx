import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchMembers } from '../api';
import { Sparkles, ChevronRight, Cake, Users, Instagram, Heart, ArrowLeft, Search } from 'lucide-react';
import SkeletonImage from '../components/SkeletonImage';

const DEFAULT_MEMBER_IMAGE = '/logos/vieos.webp';

const desktopSlideVariants = {
    initial: (direction) => ({
        x: direction > 0 ? 56 : -56
    }),
    animate: {
        x: 0,
        transition: {
            type: 'spring',
            stiffness: 300,
            damping: 32,
            mass: 0.85
        }
    },
    exit: (direction) => ({
        x: direction > 0 ? -56 : 56,
        transition: {
            duration: 0.24,
            ease: [0.4, 0, 0.2, 1]
        }
    })
};

const mobileSlideVariants = {
    initial: (direction) => ({
        x: direction > 0 ? 26 : -26
    }),
    animate: {
        x: 0,
        transition: {
            duration: 0.22,
            ease: [0.25, 0.1, 0.25, 1]
        }
    },
    exit: (direction) => ({
        x: direction > 0 ? -26 : 26,
        transition: {
            duration: 0.18,
            ease: [0.4, 0, 0.2, 1]
        }
    })
};

const MemberDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [members, setMembers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [hoveredId, setHoveredId] = useState(null);
    const [initialLoading, setInitialLoading] = useState(true);
    const [flipDirection, setFlipDirection] = useState(1);
    const [isMobile, setIsMobile] = useState(false);
    const previousIndexRef = useRef(-1);

    const filteredMembers = useMemo(() => {
        const keyword = searchTerm.trim().toLowerCase();
        if (!keyword) return members;
        return members.filter((member) => member.nickname.toLowerCase().includes(keyword));
    }, [members, searchTerm]);

    const selectedMember = useMemo(() => {
        return members.find((member) => String(member.id) === String(id)) || null;
    }, [members, id]);

    useEffect(() => {
        let isMounted = true;

        const loadData = async () => {
            try {
                const data = await fetchMembers();
                const formattedData = data
                    .map((m) => ({
                        ...m,
                        themeColor: m.theme_color || m.themeColor
                    }))
                    .sort((a, b) => Number(a.id) - Number(b.id));

                if (!isMounted) return;
                setMembers(formattedData);
            } finally {
                if (isMounted) {
                    setInitialLoading(false);
                }
            }
        };

        loadData();

        return () => {
            isMounted = false;
        };
    }, []);

    useEffect(() => {
        const mediaQuery = window.matchMedia('(max-width: 767px)');
        const syncMobile = () => setIsMobile(mediaQuery.matches);

        syncMobile();
        mediaQuery.addEventListener('change', syncMobile);

        return () => mediaQuery.removeEventListener('change', syncMobile);
    }, []);

    useEffect(() => {
        if (!selectedMember || members.length === 0) return;

        const nextIndex = members.findIndex((member) => String(member.id) === String(selectedMember.id));
        if (nextIndex < 0) return;

        if (previousIndexRef.current >= 0 && previousIndexRef.current !== nextIndex) {
            setFlipDirection(nextIndex > previousIndexRef.current ? 1 : -1);
        }

        previousIndexRef.current = nextIndex;
    }, [selectedMember, members]);

    if (initialLoading) {
        return (
            <div className="h-screen w-screen flex items-center justify-center bg-gray-50 dark:bg-[#0A0E17]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-vibrant-pink border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-sm font-black uppercase tracking-widest text-vibrant-pink">Loading Stars...</p>
                </div>
            </div>
        );
    }

    if (!selectedMember) {
        return (
            <div className="h-screen w-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-[#0A0E17] p-6 text-center">
                <h2 className="text-4xl font-black mb-4">Member Tidak Ditemukan</h2>
                <Link to="/members" className="vibrant-button">Kembali ke Daftar</Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen w-full flex flex-col bg-gray-50 dark:bg-[#0A0E17] relative overflow-x-hidden pt-20 lg:pt-24 pb-6">
            <div className="playful-bg opacity-30" />

            <div className="w-full flex justify-center p-2 md:p-4 lg:p-6 relative z-10 transition-all">
                <div className="w-full max-w-7xl relative lg:h-[calc(100vh-9rem)]">
                    <div className="bg-white dark:bg-[#121214] w-full rounded-[1.75rem] md:rounded-[2.5rem] overflow-hidden flex flex-col md:flex-row shadow-2xl relative border border-white/10 lg:h-full">
                        <div className="hidden md:flex w-64 bg-[#f9f9f9] dark:bg-[#0A0A0B] border-r border-gray-100 dark:border-white/5 flex-col overflow-hidden shrink-0">
                            <div className="p-8 border-b border-gray-100 dark:border-white/5 pt-10">
                                <h3 className="text-sm font-black text-gray-900 dark:text-white tracking-tight uppercase">Daftar Member</h3>
                                <div className="mt-4 relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                                    <input
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        placeholder="Cari member..."
                                        className="w-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg pl-9 pr-4 py-2 text-[10px] outline-none focus:border-vibrant-pink transition-colors"
                                    />
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto overflow-x-hidden py-2 custom-scrollbar">
                                {filteredMembers.map((m) => (
                                    <button
                                        key={m.id}
                                        onMouseEnter={() => setHoveredId(m.id)}
                                        onMouseLeave={() => setHoveredId(null)}
                                        onClick={() => navigate(`/members/${m.id}`)}
                                        className={`w-full text-left px-8 py-3 text-[10px] font-black uppercase transition-all duration-300 border-l-4 flex items-center justify-between group ${
                                            selectedMember.id === m.id
                                                ? 'bg-gray-100 dark:bg-white/5'
                                                : 'text-gray-400 dark:text-white/20 border-transparent hover:bg-gray-50 dark:hover:bg-white/[0.02]'
                                        }`}
                                        style={{
                                            color: (selectedMember.id === m.id || hoveredId === m.id) ? (m.themeColor || '#ff1b8d') : '',
                                            borderLeftColor: selectedMember.id === m.id ? (selectedMember.themeColor || '#ff1b8d') : 'transparent'
                                        }}
                                    >
                                        {m.nickname}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex-1 flex flex-col bg-white dark:bg-[#121214] overflow-hidden relative">
                            <AnimatePresence mode="wait" initial={false} custom={flipDirection}>
                                <motion.div
                                    key={selectedMember.id}
                                    custom={flipDirection}
                                    variants={isMobile ? mobileSlideVariants : desktopSlideVariants}
                                    initial="initial"
                                    animate="animate"
                                    exit="exit"
                                    className="h-full overflow-y-auto flex flex-col p-4 sm:p-5 lg:p-8 pt-5 lg:pt-8 pb-5"
                                >
                                    <div className="flex flex-col items-start mb-5 md:mb-4 shrink-0">
                                        <div className="flex items-center gap-3 mb-2">
                                            <Link to="/members" className="p-2 bg-gray-100 dark:bg-white/5 text-gray-400 rounded-full hover:bg-vibrant-pink hover:text-white transition-all transform hover:scale-110">
                                                <ArrowLeft size={14} />
                                            </Link>
                                            <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.25em] md:tracking-[0.4em] text-gray-400">VIEOS PROFILE</span>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-2 text-[9px] md:text-[10px] font-bold text-gray-300 dark:text-white/20 uppercase tracking-widest leading-none">
                                            <Link to="/" className="hover:text-vibrant-pink transition-colors">Home</Link>
                                            <ChevronRight size={8} />
                                            <Link to="/members" className="hover:text-vibrant-pink transition-colors">Members</Link>
                                            <ChevronRight size={8} />
                                            <span style={{ color: selectedMember.themeColor }}>{selectedMember.nickname}</span>
                                        </div>
                                    </div>

                                    <div className="flex flex-col lg:flex-row gap-5 lg:gap-10 items-stretch">
                                        <div className="w-full max-w-[300px] sm:max-w-[340px] lg:max-w-[360px] flex flex-col items-center justify-center shrink-0 mx-auto lg:mx-0">
                                            <motion.div
                                                initial={{ scale: 0.95, opacity: 0 }}
                                                animate={{ scale: 1, opacity: 1 }}
                                                transition={{ delay: 0.2 }}
                                                className="relative p-2 rounded-[2rem] overflow-hidden shadow-2xl flex flex-col w-full aspect-[4/5]"
                                                style={{ backgroundColor: selectedMember.themeColor }}
                                            >
                                                <Sparkles className="absolute top-4 left-4 text-white opacity-80 animate-pulse" size={16} fill="white" />
                                                <Sparkles className="absolute bottom-4 right-4 text-white opacity-80 animate-pulse" size={16} fill="white" />

                                                <div className="bg-white p-1.5 rounded-2xl flex flex-col flex-1 w-full h-full min-h-0">
                                                    <div className="relative rounded-xl overflow-hidden bg-gray-100 group flex-1 w-full h-full min-h-0">
                                                        <SkeletonImage
                                                            src={selectedMember.image || selectedMember.image_url || DEFAULT_MEMBER_IMAGE}
                                                            fallbackSrc={DEFAULT_MEMBER_IMAGE}
                                                            alt={selectedMember.nickname}
                                                            wrapperClassName="absolute inset-0"
                                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                                        />
                                                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent p-8 flex flex-col justify-end translate-y-2 group-hover:translate-y-0 transition-transform">
                                                            <span className="text-[10px] font-black text-white/60 uppercase tracking-[0.3em] block mb-2">
                                                                {selectedMember.role && selectedMember.role !== 'Member'
                                                                    ? selectedMember.role
                                                                    : (selectedMember.fullname || selectedMember.name || '').includes(',')
                                                                        ? (selectedMember.fullname || selectedMember.name).split(',')[1].trim()
                                                                        : (selectedMember.gelar || 'VIEOS')}
                                                            </span>
                                                            <h4 className="text-4xl font-brand italic text-white leading-none capitalize">
                                                                {selectedMember.nickname.toLowerCase()}
                                                            </h4>
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        </div>

                                        <div className="flex-1 w-full flex flex-col gap-4 pb-2">
                                            <div className="mb-4">
                                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] block mb-1">Selection Star</span>
                                                <div className="flex flex-wrap items-baseline gap-3 mb-2">
                                                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black uppercase tracking-tighter" style={{ color: selectedMember.themeColor }}>
                                                        {selectedMember.nickname}
                                                    </h1>
                                                    <Sparkles size={20} style={{ color: selectedMember.themeColor }} className="animate-spin-slow" />
                                                </div>
                                                <div className="h-0.5 w-full bg-gradient-to-r from-gray-100 via-gray-100 to-transparent dark:from-white/5 dark:via-white/5 dark:to-transparent mb-4" />
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-3xl">
                                                <div className="bg-[#fcfcfc] dark:bg-[#1A1A1D] border border-gray-100 dark:border-white/5 p-4 rounded-[1.5rem] flex items-center gap-4 hover:border-vibrant-pink/40 transition-all group">
                                                    <div className="p-3 rounded-xl transition-all group-hover:bg-vibrant-pink group-hover:text-white shrink-0" style={{ backgroundColor: `${selectedMember.themeColor}15`, color: selectedMember.themeColor }}>
                                                        <Cake size={18} />
                                                    </div>
                                                    <div>
                                                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-0.5">Birthday</span>
                                                        <span className="text-sm font-bold text-gray-800 dark:text-white tracking-tight">{selectedMember.birth_date || '-'}</span>
                                                    </div>
                                                </div>
                                                <div className="bg-[#fcfcfc] dark:bg-[#1A1A1D] border border-gray-100 dark:border-white/5 p-4 rounded-[1.5rem] flex items-center gap-4 hover:border-vibrant-pink/40 transition-all group">
                                                    <div className="p-3 rounded-xl transition-all group-hover:bg-vibrant-pink group-hover:text-white shrink-0" style={{ backgroundColor: `${selectedMember.themeColor}15`, color: selectedMember.themeColor }}>
                                                        <Users size={18} />
                                                    </div>
                                                    <div>
                                                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-0.5">Position</span>
                                                        <span className="text-sm font-bold text-gray-800 dark:text-white tracking-tight">
                                                            {selectedMember.role && selectedMember.role !== 'Member'
                                                                ? selectedMember.role
                                                                : (selectedMember.fullname || selectedMember.name || '').includes(',')
                                                                    ? (selectedMember.fullname || selectedMember.name).split(',')[1].trim()
                                                                    : (selectedMember.gelar || 'Member')}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="bg-[#fcfcfc] dark:bg-[#1A1A1D] border border-gray-100 dark:border-white/5 p-4 rounded-[1.5rem] flex items-start gap-4 hover:border-vibrant-pink/40 transition-all group md:col-span-2">
                                                    <div className="p-3 rounded-xl transition-all group-hover:rotate-12 shrink-0" style={{ backgroundColor: `${selectedMember.themeColor}15`, color: selectedMember.themeColor }}>
                                                        <Heart size={18} />
                                                    </div>
                                                    <div className="flex-1">
                                                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Catchphrase</span>
                                                        <p className="text-sm lg:text-base font-bold text-gray-800 dark:text-white italic leading-snug">
                                                            &quot;{selectedMember.jiko || 'Halo semua! Saya member dari VIEOS.'}&quot;
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="bg-[#fcfcfc] dark:bg-[#1A1A1D] border border-gray-100 dark:border-white/5 p-4 rounded-[1.5rem] flex items-center gap-4 hover:border-vibrant-pink/40 transition-all group md:col-span-2">
                                                    <div className="p-3 rounded-xl transition-all group-hover:scale-110 shrink-0" style={{ backgroundColor: `${selectedMember.themeColor}15`, color: selectedMember.themeColor }}>
                                                        <Instagram size={18} />
                                                    </div>
                                                    <div>
                                                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-0.5">Social Media</span>
                                                        <span className="text-sm font-bold text-gray-800 dark:text-white underline decoration-vibrant-pink/30 hover:text-vibrant-pink transition-colors cursor-pointer">
                                                            {selectedMember.instagram || '@vieos_official'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div
                                        className="mt-8 md:hidden shrink-0 px-2"
                                        style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
                                    >
                                        <div className="flex gap-3 overflow-x-auto px-1 py-2 scrollbar-none">
                                            {members.map((m) => (
                                                <button
                                                    key={m.id}
                                                    onClick={() => navigate(`/members/${m.id}`)}
                                                    className={`shrink-0 flex flex-col items-center gap-1 origin-center transition-all ${selectedMember.id === m.id ? 'scale-100 opacity-100' : 'opacity-45 scale-95'}`}
                                                >
                                                    <div
                                                        className="w-14 h-14 rounded-full overflow-hidden border-2 p-0.5"
                                                        style={{ borderColor: selectedMember.id === m.id ? m.themeColor : 'transparent' }}
                                                    >
                                                        <SkeletonImage
                                                            src={m.image || DEFAULT_MEMBER_IMAGE}
                                                            fallbackSrc={DEFAULT_MEMBER_IMAGE}
                                                            alt={m.nickname}
                                                            wrapperClassName="w-full h-full rounded-full"
                                                            className="w-full h-full object-cover rounded-full"
                                                        />
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </motion.div>
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MemberDetail;
