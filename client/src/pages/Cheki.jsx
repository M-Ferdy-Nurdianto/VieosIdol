import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { fetchMembers, fetchEvents, fetchSettings, API_URL } from '../api';
import { Plus, Sparkles, LayoutGrid, Users, CheckCircle2, ChevronRight, Tag, Calendar, MapPin, Clock } from 'lucide-react';
import Toast from '../components/Toast';
import SkeletonImage from '../components/SkeletonImage';
import { getMemberChekiImageSrc, getMemberFallbackImage, DEFAULT_MEMBER_IMAGE } from '../utils/memberImages';

const isLightColor = (hex) => {
    const color = hex || '#FFFFFF';
    if (color.length < 6) return false;
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    return (r * 0.299 + g * 0.587 + b * 0.114) > 186;
};

const getLineupMemberImage = (name) => {
    const key = name.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    const map = {
        maru: '/photo/cheki/Maru.webp', yomi: '/photo/cheki/Yomi.webp',
        nanda: '/photo/cheki/Nanda.webp', nana: '/photo/cheki/Nana.webp',
        rian: '/photo/cheki/Rian.webp', kanai: '/photo/cheki/Kanai.webp',
        celline: '/photo/cheki/Celline.webp', celin: '/photo/cheki/Celline.webp',
        axie: '/photo/cheki/Axie.webp', abel: '/photo/cheki/Abel.webp',
        abell: '/photo/cheki/Abel.webp', lynx: '/photo/cheki/Lynx.webp',
        group: '/photo/hero/hero.webp',
    };
    return map[key] || DEFAULT_MEMBER_IMAGE;
};

const Cheki = () => {
  const [liveEvents, setLiveEvents] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [globalSettings, setGlobalSettings] = useState(() => ({ prices: { regular_cheki_solo: 30000, regular_cheki_group: 35000 } }));
  const [toastConfig, setToastConfig] = useState(null);
  const [selectedEventId, setSelectedEventId] = useState('all');
  const showToastMsg = (msg, type = 'error') => { setToastConfig(msg ? { message: msg, type } : null); };
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem('vieos_cart');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [eventsData, settingsData, membersData] = await Promise.all([
          fetchEvents(), fetchSettings(), fetchMembers()
        ]);
        setLiveEvents(eventsData);
        if (settingsData?.prices) setGlobalSettings(settingsData);
        setMembers(membersData.map(m => ({ ...m, themeColor: m.theme_color || m.themeColor })));
      } catch (err) {
        console.error("Failed to load Cheki page data:", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Active events only for filter
  const activeEvents = useMemo(() => liveEvents.filter(ev => ev.status !== 'done'), [liveEvents]);

  // Selected event object
  const selectedEvent = useMemo(() => {
    if (selectedEventId === 'all') return null;
    return liveEvents.find(ev => String(ev.id) === String(selectedEventId)) || null;
  }, [selectedEventId, liveEvents]);

  // Lineup names for selected event
  // available_members = member yang dipilih di admin panel
  // lineup bisa default ['GROUP'], jadi prioritas available_members
  const lineupNames = useMemo(() => {
    if (!selectedEvent) return [];
    const avail = Array.isArray(selectedEvent.available_members) ? selectedEvent.available_members : [];
    const lineup = Array.isArray(selectedEvent.lineup) ? selectedEvent.lineup : [];
    // Gabung keduanya, dedupe, filter GROUP
    const combined = [...new Set([...avail, ...lineup])];
    const filtered = combined.filter(n => n && n.toUpperCase() !== 'GROUP');
    // Jika available_members punya non-GROUP entries, pakai itu sebagai sumber utama
    const availFiltered = avail.filter(n => n && n.toUpperCase() !== 'GROUP');
    return availFiltered.length > 0 ? availFiltered : filtered;
  }, [selectedEvent]);

  // Filter visible solo members by lineup
  const visibleMembers = useMemo(() => {
    if (!selectedEvent || lineupNames.length === 0) return members;
    return members.filter(m => {
      const nick = (m.nickname || '').toLowerCase();
      return lineupNames.some(ln => {
        const l = ln.toLowerCase();
        return nick === l || nick.startsWith(l) || l.startsWith(nick);
      });
    });
  }, [members, selectedEvent, lineupNames]);

  // Current active prices (Event specific or Global)
  const currentPrices = useMemo(() => {
    if (selectedEvent && selectedEvent.special_prices) {
      return {
        solo: selectedEvent.special_prices.solo || globalSettings.prices.regular_cheki_solo,
        group: selectedEvent.special_prices.group || globalSettings.prices.regular_cheki_group
      };
    }
    return {
      solo: globalSettings.prices.regular_cheki_solo,
      group: globalSettings.prices.regular_cheki_group
    };
  }, [selectedEvent, globalSettings]);

  const addToCart = (item) => {
    const hasActiveEvents = liveEvents.some(ev => ev.status !== 'done');
    if (liveEvents.length === 0 || !hasActiveEvents) {
      showToastMsg("Maaf, saat ini pre-order sedang ditutup karena belum ada event mendatang.");
      return;
    }
    const newCart = [...cart, { ...item, cartId: Math.random(), event_id: selectedEvent?.id }];
    setCart(newCart);
    localStorage.setItem('vieos_cart', JSON.stringify(newCart));
    showToastMsg(`${item.name} Berhasil Ditambah!`, 'success');
  };

  const removeFromCart = (cartId) => {
    const newCart = cart.filter(item => item.cartId !== cartId);
    setCart(newCart);
    localStorage.setItem('vieos_cart', JSON.stringify(newCart));
  };

  const total = cart.reduce((acc, item) => acc + item.price, 0);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen relative pt-28 pb-12 md:py-48 px-4 md:px-12 overflow-hidden transition-colors duration-500">
      <div className="playful-bg" />
      <div className="grain-overlay" />
      <div className="absolute top-[20%] left-[-25%] md:left-[-15%] w-[300px] md:w-[800px] h-[300px] md:h-[800px] bg-vibrant-pink/10 rounded-full blur-[80px] md:blur-[160px] -z-0 pointer-events-none" style={{ contain: 'strict', transform: 'translateZ(0)' }} />
      <div className="absolute bottom-[30%] right-[-10%] md:right-[-5%] w-[300px] md:w-[700px] h-[300px] md:h-[700px] bg-vibrant-blue/10 rounded-full blur-[80px] md:blur-[140px] -z-0 pointer-events-none" style={{ contain: 'strict', transform: 'translateZ(0)' }} />

      <div className="max-w-7xl mx-auto relative z-10">

        {/* Header */}
        <div className="mb-12 md:mb-20 text-center md:text-left">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-center md:justify-start gap-4 mb-4 md:mb-6">
            <Tag className="text-vibrant-pink w-6 h-6 animate-bounce" />
            <span className="text-[10px] font-black tracking-[0.5em] uppercase text-vibrant-pink/60">Reservasi Eksklusif</span>
          </motion.div>
          <motion.h1 initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="text-5xl md:text-7xl font-black tracking-tighter uppercase mb-2" style={{ color: 'var(--text-main)' }}>
            Amankan<br/>
            <span className="text-gradient font-brand italic text-4xl md:text-6xl lowercase block mt-2">Slot Cheki-mu!</span>
          </motion.h1>
          <div className="flex flex-col md:flex-row items-center gap-4 mt-8">
            <div className="h-1.5 w-24 bg-vibrant-pink rounded-full" />
            <p className="text-lg font-bold italic tracking-widest opacity-60" style={{ color: 'var(--text-muted)' }}>Amankan slot cheki-mu sekarang. Jangan sampe kehabisan momen bareng oshi, Wots! ✨</p>
          </div>
        </div>

        {/* ── EVENT FILTER ── */}
        {!loading && activeEvents.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-10 md:mb-16">
            <p className="text-[10px] font-black tracking-[0.4em] uppercase text-vibrant-pink/50 mb-4 text-center md:text-left">Pilih Event</p>
            <div className="flex flex-wrap gap-3 justify-center md:justify-start">
              <button
                onClick={() => setSelectedEventId('all')}
                className={`px-5 py-2.5 rounded-full text-[11px] font-black uppercase tracking-widest border transition-all duration-300 ${selectedEventId === 'all' ? 'bg-vibrant-pink text-white border-vibrant-pink shadow-[0_8px_24px_rgba(255,27,141,0.35)]' : 'border-white/10 text-white/40 hover:border-vibrant-pink/40 hover:text-white/70'}`}
              >
                Semua Event
              </button>
              {activeEvents.map(ev => (
                <button
                  key={ev.id}
                  onClick={() => setSelectedEventId(String(ev.id))}
                  className={`px-5 py-2.5 rounded-full text-[11px] font-black uppercase tracking-widest border transition-all duration-300 ${String(selectedEventId) === String(ev.id) ? 'bg-vibrant-pink text-white border-vibrant-pink shadow-[0_8px_24px_rgba(255,27,141,0.35)]' : 'border-white/10 text-white/40 hover:border-vibrant-pink/40 hover:text-white/70'}`}
                >
                  {ev.name}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── EVENT LINEUP CHART ── */}
        <AnimatePresence mode="wait">
          {!loading && selectedEvent && (
            <motion.div
              key={selectedEvent.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.35 }}
              className="mb-16 md:mb-24"
            >
              {/* Event Info Card */}
              <div className="rounded-2xl md:rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-sm overflow-hidden">
                {/* Header strip */}
                <div className="bg-vibrant-pink/10 border-b border-vibrant-pink/20 px-6 md:px-10 py-4 md:py-6 flex flex-col md:flex-row md:items-center gap-4 md:gap-8">
                  <div className="flex-1">
                    <p className="text-[9px] font-black tracking-[0.5em] uppercase text-vibrant-pink/60 mb-1">Line Up</p>
                    <h3 className="text-xl md:text-3xl font-black tracking-tight" style={{ color: 'var(--text-main)' }}>{selectedEvent.name}</h3>
                  </div>
                  <div className="flex flex-wrap gap-4 text-[10px] font-bold uppercase tracking-widest text-white/40">
                    {selectedEvent.event_date && (
                      <span className="flex items-center gap-1.5">
                        <Calendar size={12} className="text-vibrant-pink" />
                        {new Date(selectedEvent.event_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </span>
                    )}
                    {selectedEvent.event_time && (
                      <span className="flex items-center gap-1.5">
                        <Clock size={12} className="text-vibrant-pink" />
                        {selectedEvent.event_time}
                      </span>
                    )}
                    {selectedEvent.location && (
                      <span className="flex items-center gap-1.5">
                        <MapPin size={12} className="text-vibrant-pink" />
                        {selectedEvent.location}
                      </span>
                    )}
                  </div>
                </div>

                {/* Lineup grid */}
                <div className="px-6 md:px-10 py-6 md:py-8">
                  {lineupNames.length === 0 ? (
                    <p className="text-white/30 text-sm text-center py-4">Lineup belum ditentukan untuk event ini.</p>
                  ) : (
                    <div className="flex flex-wrap gap-4 md:gap-6">
                      {lineupNames.map((name, idx) => {
                        const matchedMember = members.find(m => {
                          const nick = (m.nickname || '').toLowerCase();
                          const l = name.toLowerCase();
                          return nick === l || nick.startsWith(l) || l.startsWith(nick);
                        });
                        const imgSrc = matchedMember ? getMemberChekiImageSrc(matchedMember) : getLineupMemberImage(name);
                        const themeColor = matchedMember?.themeColor || '#FF1B8D';
                        return (
                          <motion.div
                            key={name}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: idx * 0.06 }}
                            className="flex flex-col items-center gap-2"
                          >
                            <div className="relative w-16 h-16 md:w-20 md:h-20 rounded-2xl overflow-hidden border-2 shadow-lg"
                                 style={{ borderColor: themeColor + '60' }}>
                              <img src={imgSrc} alt={name} className="w-full h-full object-cover" onError={e => { e.target.src = DEFAULT_MEMBER_IMAGE; }} />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: themeColor }}>{name}</span>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Group Cheki */}
        <div className="mb-16 md:mb-48 relative px-2 md:px-4 flex justify-center">
          {loading ? (
            <div className="w-full max-w-5xl aspect-[21/10] md:aspect-[21/8] bg-[#1E2132] rounded-[1.5rem] md:rounded-[2.5rem] animate-pulse border border-white/5 overflow-hidden flex flex-col md:flex-row shadow-2xl">
              <div className="flex-grow bg-white/5 relative"><div className="absolute top-6 left-6 space-y-3"><div className="w-20 h-4 bg-white/10 rounded-full" /><div className="w-48 h-10 bg-white/10 rounded-xl" /></div></div>
              <div className="w-full md:w-[380px] bg-black/20 p-8 flex flex-col justify-center items-center gap-6"><div className="w-32 h-12 bg-white/5 rounded-2xl" /><div className="w-full h-14 bg-white/5 rounded-2xl" /></div>
            </div>
          ) : (
            <motion.div initial={{ y: 30, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }} viewport={{ once: true }} className="relative w-full max-w-5xl md:aspect-[21/8] group">
              <div className="relative md:absolute md:inset-0 bg-[#1E2132] rounded-[1.5rem] md:rounded-[2.5rem] shadow-[0_20px_60px_-10px_rgba(0,0,0,0.4)] md:shadow-[0_40px_100px_-20px_rgba(0,0,0,0.6)] overflow-hidden border border-white/10 flex flex-col md:flex-row items-stretch">
                <div className="absolute inset-0 grayscale group-hover:grayscale-0 transition-all duration-700 pointer-events-none" style={{ backgroundImage: "url('/photo/hero/hero.webp')", backgroundSize: '152%', backgroundPosition: '49% 0%', backgroundRepeat: 'no-repeat', opacity: 0.8 }} aria-hidden="true" />
                <div className="relative flex-grow overflow-hidden h-[180px] sm:h-[240px] md:h-auto z-10">
                  <div className="absolute inset-0 bg-gradient-to-r from-[#1E2132]/60 via-transparent to-[#1E2132]/90 hidden md:block" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1E2132] via-transparent to-transparent md:hidden" />
                  <div className="absolute top-4 md:top-10 left-4 md:left-10 z-10 w-[80%]">
                    <div className="bg-vibrant-pink text-white px-2 md:px-4 py-1 md:py-1.5 text-[8px] md:text-[10px] font-black uppercase tracking-[0.4em] mb-2 md:mb-4 shadow-[0_10px_20px_rgba(255,27,141,0.3)] inline-block">Super Group</div>
                    <h2 className="text-3xl md:text-7xl font-black text-white uppercase tracking-tighter leading-none filter drop-shadow-2xl">Group<br/><span className="text-vibrant-yellow font-brand italic lowercase text-2xl md:text-6xl block mt-1 md:mt-2">Cheki</span></h2>
                  </div>
                </div>
                <div className="relative z-20 w-full md:w-[380px] bg-[#1E2132] p-4 sm:p-6 md:p-10 flex flex-col justify-start md:justify-center items-center text-center border-t border-white/5 md:border-t-0 md:border-l shrink-0">
                  <div className="mb-3 md:mb-10 w-full">
                    <p className="text-[8px] md:text-[10px] font-bold text-white/20 uppercase tracking-[0.4em] mb-2">Starting From</p>
                    <div className="inline-block bg-white/5 backdrop-blur-md px-4 md:px-6 py-2 md:py-4 rounded-xl md:rounded-3xl border border-white/10 mx-auto">
                      <p className="text-lg md:text-3xl font-black text-vibrant-pink tracking-tighter">IDR {(currentPrices.group || 35000).toLocaleString('id-ID')}</p>
                    </div>
                  </div>
                  <button onClick={() => addToCart({ name: 'Group Cheki', price: currentPrices.group || 35000, type: 'group' })} className="vibrant-button w-full py-3.5 md:py-6 text-[9px] md:text-[10px] relative group/btn shadow-[0_20px_50px_rgba(255,27,141,0.4)]">
                    <span className="relative z-10 tracking-[0.3em] font-black">AMANKAN SLOT</span>
                  </button>
                  <p className="mt-3 md:mt-8 text-[8px] font-medium text-white/30 uppercase tracking-widest leading-relaxed">Satu tiket buat foto eksklusif bareng <br className="md:hidden"/>semua member yang perform hari ini.</p>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Solo Member Grid */}
        <div className="mb-12 md:mb-24 text-center">
          <h2 className="text-xl md:text-3xl font-black tracking-[0.4em] uppercase opacity-30 pointer-events-none" style={{ color: 'var(--text-muted)' }}>
            {selectedEvent && lineupNames.length > 0 ? `${selectedEvent.name} — Member Cheki` : 'Member Cheki'}
          </h2>
        </div>

        <div className="max-w-7xl mx-auto relative z-10 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-y-10 md:gap-y-16 gap-x-4 md:gap-x-8 px-2 md:px-4 mb-48">
          {loading ? (
            Array(10).fill(0).map((_, idx) => (
              <div key={idx} className="relative h-full rounded-xl md:rounded-2xl bg-white p-2 pb-3 md:p-3 md:pb-4 shadow-lg animate-pulse">
                <div className="aspect-[4/5] w-full bg-gray-200 rounded-lg" />
                <div className="mt-4 space-y-3"><div className="h-6 w-2/3 bg-gray-100 rounded mx-auto" /><div className="h-10 w-full bg-gray-100 rounded-xl" /></div>
              </div>
            ))
          ) : (
            <AnimatePresence mode="popLayout">
              {visibleMembers.map((member, idx) => (
                <motion.div
                  key={member.id}
                  layout
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.05 }}
                  whileHover={{ y: -10 }}
                  className="cursor-pointer relative group w-full h-full"
                >
                  <div className="relative h-full rounded-xl md:rounded-2xl overflow-hidden bg-white p-2 pb-3 md:p-3 md:pb-4 shadow-[0_15px_40px_rgba(0,0,0,0.12)] md:shadow-[0_20px_50px_rgba(0,0,0,0.15)] transition-all duration-500 group-hover:rotate-2 group-hover:scale-[1.05] group-hover:shadow-[0_40px_100px_rgba(0,0,0,0.25)] flex flex-col">
                    <div className="relative aspect-[4/5] w-full bg-[#121212] rounded-lg overflow-hidden border border-black/5">
                      <SkeletonImage src={getMemberChekiImageSrc(member)} fallbackSrc={getMemberFallbackImage(member)} alt={member.nickname} wrapperClassName="w-full h-full" className="w-full h-full object-cover grayscale-[10%] group-hover:grayscale-0 transition-all duration-700" />
                      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent opacity-60 pointer-events-none" />
                      <div className="absolute inset-0 bg-black/5 mix-blend-multiply pointer-events-none" />
                    </div>
                    <div className="flex-grow pt-3 md:pt-5 pb-1 md:pb-2 px-1 md:px-2 flex flex-col justify-between">
                      <div className="text-center mb-2 md:mb-4">
                        <span className="handwritten text-xl sm:text-2xl md:text-5xl tracking-tight leading-none rotate-[-4deg] inline-block opacity-95 transition-transform group-hover:scale-110"
                              style={{ color: member.themeColor, textShadow: member.themeColor.toUpperCase() === '#F8F9FA' ? '0 2px 4px rgba(0,0,0,0.15)' : 'none', WebkitTextStroke: member.themeColor.toUpperCase() === '#F8F9FA' ? '0.8px rgba(26,26,29,0.4)' : 'none' }}>
                          {member.nickname}
                        </span>
                      </div>
                      <div className="space-y-3 md:space-y-4">
                        <div className="flex justify-between items-center px-1">
                          <div className="flex flex-col">
                            <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-black/30">Member Cheki</span>
                            <span className="text-[7px] md:text-[8px] font-bold text-black/20 uppercase tracking-widest leading-none mt-0.5 md:mt-1">{member.nickname}</span>
                          </div>
                          <span className="text-base md:text-xl font-black text-vibrant-pink leading-none">{Math.floor((currentPrices.solo || 30000) / 1000)}K</span>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); addToCart({ name: `${member.nickname} Member Cheki`, price: currentPrices.solo || 30000, type: 'solo', member }); }}
                          className="w-full py-3.5 md:py-5 text-[8px] md:text-[10px] font-black uppercase tracking-[0.3em] rounded-xl md:rounded-2xl shadow-lg active:scale-95 transition-all hover:brightness-95"
                          style={{ backgroundColor: member.themeColor, color: isLightColor(member.themeColor) ? '#1A1A1D' : 'white', border: isLightColor(member.themeColor) ? '1px solid rgba(0,0,0,0.1)' : 'none' }}
                        >
                          ADD TO SLIP
                        </button>
                      </div>
                    </div>
                    <div className="absolute top-4 right-4 text-[8px] font-black opacity-10 uppercase tracking-tighter select-none">VIEOS-PRNT</div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* Floating Cart */}
      <AnimatePresence>
        {cart.length > 0 && (
          <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }} className="fixed bottom-6 right-6 md:bottom-10 md:right-10 z-[100]">
            <button onClick={() => navigate('/checkout')} className="bg-[#1E2132] text-white pl-5 md:pl-8 pr-3 md:pr-6 py-3.5 md:py-5 rounded-full shadow-[0_20px_50px_-10px_rgba(0,0,0,0.5)] flex items-center gap-3 md:gap-6 hover:scale-105 transition-all group overflow-hidden border border-white/10">
              <div className="flex flex-col items-start border-r border-white/10 pr-3 md:pr-6">
                <span className="text-[6px] md:text-[8px] font-black uppercase tracking-widest opacity-40 leading-none mb-1">Checkout</span>
                <span className="text-base md:text-xl font-black tracking-tighter">IDR {(total / 1000)}K</span>
              </div>
              <div className="bg-vibrant-pink w-7 h-7 md:w-10 md:h-10 rounded-full flex items-center justify-center group-hover:translate-x-1 transition-transform shadow-lg shadow-vibrant-pink/30">
                <ChevronRight size={14} strokeWidth={4} />
              </div>
              <div className="absolute top-0.5 right-0.5 md:top-2 md:right-2 w-4 h-4 md:w-6 md:h-6 bg-vibrant-yellow text-vibrant-pink rounded-full flex items-center justify-center font-black shadow-xl text-[7px] md:text-[10px] animate-pulse">{cart.length}</div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toastConfig && (
          <Toast message={toastConfig.message} type={toastConfig.type} onClose={() => showToastMsg(null)} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Cheki;
