import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { fetchMembers, fetchEvents, fetchSettings, API_URL } from '../api';
import { Plus, Sparkles, LayoutGrid, Users, CheckCircle2, ChevronRight, Tag } from 'lucide-react';
import Toast from '../components/Toast';
import SkeletonImage from '../components/SkeletonImage';
import { getMemberImageSrc, getMemberFallbackImage } from '../utils/memberImages';

const Cheki = () => {
  const [liveEvents, setLiveEvents] = useState([]);
  const [members, setMembers] = useState([]);
  const [globalSettings, setGlobalSettings] = useState(() => ({ prices: { regular_cheki_solo: 30000, regular_cheki_group: 35000 } }));
  const [toastConfig, setToastConfig] = useState(null);
  const showToastMsg = (msg, type = 'error') => { setToastConfig(msg ? { message: msg, type } : null); };
  const [cart, setCart] = useState(() => {
    const savedCart = localStorage.getItem('vieos_cart');
    return savedCart ? JSON.parse(savedCart) : [];
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [eventsData, settingsData, membersData] = await Promise.all([
          fetchEvents(),
          fetchSettings(),
          fetchMembers()
        ]);

        setLiveEvents(eventsData);
        
        if (settingsData && settingsData.prices) {
            setGlobalSettings(settingsData);
        }

        setMembers(membersData.map(m => ({
            ...m,
            themeColor: m.theme_color || m.themeColor
        })));
      } catch (err) {
        console.error("Failed to load Cheki page data:", err);
      }
    };
    loadData();
  }, []);

  const addToCart = (item) => {
    const newCart = [...cart, { ...item, cartId: Math.random() }];
    setCart(newCart);
    localStorage.setItem('vieos_cart', JSON.stringify(newCart));
    showToastMsg(`${item.name} Berhasil Ditambah!`);
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
      {/* Background Effects */}
      <div className="playful-bg" />
      <div className="grain-overlay" />

      {/* Global Glows for consistency */}
      <div className="absolute top-[20%] left-[-25%] md:left-[-15%] w-[300px] md:w-[800px] h-[300px] md:h-[800px] bg-vibrant-pink/10 rounded-full blur-[80px] md:blur-[160px] -z-0 pointer-events-none" />
      <div className="absolute bottom-[30%] right-[-10%] md:right-[-5%] w-[300px] md:w-[700px] h-[300px] md:h-[700px] bg-vibrant-blue/10 rounded-full blur-[80px] md:blur-[140px] -z-0 pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* Human Header */}
        <div className="mb-16 md:mb-32 text-center md:text-left">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center md:justify-start gap-4 mb-4 md:mb-6"
          >
             <Tag className="text-vibrant-pink w-6 h-6 animate-bounce" />
             <span className="text-[10px] font-black tracking-[0.5em] uppercase text-vibrant-pink/60">Reservasi Eksklusif</span>
          </motion.div>
          <motion.h1 
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="text-5xl md:text-7xl font-black tracking-tighter uppercase mb-2"
            style={{ color: 'var(--text-main)' }}
          >
            Amankan<br/>
            <span className="text-gradient font-brand italic text-4xl md:text-6xl lowercase block mt-2">Slot Cheki-mu!</span>
          </motion.h1>
          <div className="flex flex-col md:flex-row items-center gap-4 mt-8">
            <div className="h-1.5 w-24 bg-vibrant-pink rounded-full" />
            <p className="text-lg font-bold italic tracking-widest opacity-60" style={{ color: 'var(--text-muted)' }}>Amankan slot cheki-mu sekarang. Jangan sampe kehabisan momen bareng oshi, Wots! ✨</p>
          </div>
        </div>

        {/* Group Cheki - Premium Landscape Design */}
        <div className="mb-16 md:mb-48 relative px-2 md:px-4 flex justify-center">
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            className="relative w-full max-w-5xl md:aspect-[21/8] group"
          >
            <div className="relative md:absolute md:inset-0 bg-[#1E2132] rounded-[1.5rem] md:rounded-[2.5rem] shadow-[0_20px_60px_-10px_rgba(0,0,0,0.4)] md:shadow-[0_40px_100px_-20px_rgba(0,0,0,0.6)] overflow-hidden border border-white/10 flex flex-col md:flex-row items-stretch">
                {/* Left: Visual/Promo Area */}
                <div className="relative flex-grow overflow-hidden h-[180px] sm:h-[220px] md:h-auto">
                    <div className="absolute inset-0 opacity-80 md:opacity-40 grayscale group-hover:grayscale-0 transition-all duration-1000 scale-110 group-hover:scale-100">
                      <SkeletonImage
                        src="/photo/hero/hero.png"
                        alt="Group Cheki"
                        wrapperClassName="absolute inset-0"
                        className="w-full h-full object-cover object-top"
                      />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-[#1E2132]/90 hidden md:block" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#1E2132] via-transparent to-transparent md:hidden" />
                    
                    <div className="absolute top-4 md:top-10 left-4 md:left-10 z-10 w-[80%]">
                        <div className="bg-vibrant-pink text-white px-2 md:px-4 py-1 md:py-1.5 text-[8px] md:text-[10px] font-black uppercase tracking-[0.4em] mb-2 md:mb-4 shadow-[0_10px_20px_rgba(255,27,141,0.3)] inline-block">
                           Super Group
                        </div>
                        <h2 className="text-3xl md:text-7xl font-black text-white uppercase tracking-tighter leading-none filter drop-shadow-2xl">
                          Group<br/>
                          <span className="text-vibrant-yellow font-brand italic lowercase text-2xl md:text-6xl block mt-1 md:mt-2">Cheki</span>
                        </h2>
                    </div>
                </div>

                {/* Right: Booking Panel */}
                <div className="relative z-20 w-full md:w-[380px] bg-[#1E2132] p-5 sm:p-6 md:p-10 flex flex-col justify-start md:justify-center items-center text-center border-t border-white/5 md:border-t-0 md:border-l shrink-0">
                    <div className="mb-4 md:mb-10 w-full">
                        <p className="text-[8px] md:text-[10px] font-bold text-white/20 uppercase tracking-[0.4em] mb-2">Starting From</p>
                        <div className="inline-block bg-white/5 backdrop-blur-md px-4 md:px-6 py-2 md:py-4 rounded-xl md:rounded-3xl border border-white/10 mx-auto">
                             <p className="text-lg md:text-3xl font-black text-vibrant-pink tracking-tighter">IDR {(globalSettings.prices.regular_cheki_group || 35000).toLocaleString('id-ID')}</p>
                          </div>
                      </div>

                      <button 
                        onClick={() => addToCart({ name: 'Group Cheki', price: globalSettings.prices.regular_cheki_group || 35000, type: 'group' })}
                      className="vibrant-button w-full py-4 md:py-6 text-[9px] md:text-[10px] relative group/btn shadow-[0_20px_50px_rgba(255,27,141,0.4)]"
                    >
                      <span className="relative z-10 tracking-[0.3em] font-black">AMANKAN SLOT</span>
                    </button>
                    
                    <p className="mt-4 md:mt-8 text-[8px] font-medium text-white/30 uppercase tracking-widest leading-relaxed">Satu tiket buat foto eksklusif bareng<br className="md:hidden"/>semua member yang perform hari ini.</p>
                </div>
            </div>
          </motion.div>
        </div>

        {/* Solo Member Grid - Innovative & Staggered */}
        <div className="mb-12 md:mb-24 text-center">
          <h2 className="text-xl md:text-3xl font-black tracking-[0.4em] uppercase opacity-30 pointer-events-none" style={{ color: 'var(--text-muted)' }}>
            Member Cheki
          </h2>
        </div>

        <div className="max-w-7xl mx-auto relative z-10 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-y-10 md:gap-y-16 gap-x-4 md:gap-x-8 px-2 md:px-4 mb-48">
          {members.map((member, idx) => (
            <motion.div
              key={member.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.05 }}
              whileHover={{ y: -10 }}
              className="cursor-pointer relative group w-full h-full"
            >
              {/* The Polaroid - Now Larger & Directly on Background */}
              <div className="relative h-full rounded-xl md:rounded-2xl overflow-hidden bg-white p-2 pb-3 md:p-3 md:pb-4 shadow-[0_15px_40px_rgba(0,0,0,0.12)] md:shadow-[0_20px_50px_rgba(0,0,0,0.15)] transition-all duration-500 group-hover:rotate-2 group-hover:scale-[1.05] group-hover:shadow-[0_40px_100px_rgba(0,0,0,0.25)] flex flex-col">
                  
                  {/* The Actual Member Photo Area */}
                  <div className="relative aspect-[4/5] w-full bg-[#121212] rounded-lg overflow-hidden border border-black/5">
                    <SkeletonImage
                      src={getMemberImageSrc(member)}
                      fallbackSrc={getMemberFallbackImage(member)}
                      alt={member.nickname}
                      wrapperClassName="w-full h-full"
                      className="w-full h-full object-cover grayscale-[10%] group-hover:grayscale-0 transition-all duration-700"
                    />
                    
                    {/* Film & Flash Effects */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent opacity-60 pointer-events-none" />
                    <div className="absolute inset-0 bg-black/5 mix-blend-multiply pointer-events-none" />
                  </div>

                  {/* Polaroid Bottom Margin - Info & Action Area */}
                  <div className="flex-grow pt-3 md:pt-5 pb-1 md:pb-2 px-1 md:px-2 flex flex-col justify-between">
                      <div className="text-center mb-2 md:mb-4">
                          <span className="handwritten text-xl sm:text-2xl md:text-5xl tracking-tight leading-none rotate-[-4deg] inline-block opacity-95 transition-transform group-hover:scale-110" 
                                style={{ 
                                  color: member.themeColor,
                                  textShadow: member.themeColor.toUpperCase() === '#F8F9FA' ? '0 2px 4px rgba(0,0,0,0.15), 0 0 10px rgba(0,0,0,0.05)' : 'none',
                                  WebkitTextStroke: member.themeColor.toUpperCase() === '#F8F9FA' ? '0.8px rgba(26, 26, 29, 0.4)' : 'none'
                                }}>
                              {member.nickname}
                          </span>
                      </div>

                       <div className="space-y-3 md:space-y-4">
                          <div className="flex justify-between items-center px-1">
                              <div className="flex flex-col">
                                  <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-black/30">Member Cheki</span>
                                  <span className="text-[7px] md:text-[8px] font-bold text-black/20 uppercase tracking-widest leading-none mt-0.5 md:mt-1">{member.nickname}</span>
                              </div>
                                <span className="text-base md:text-xl font-black text-vibrant-pink leading-none">{Math.floor((globalSettings.prices.regular_cheki_solo || 30000)/1000)}K</span>
                            </div>
                        
                            <button 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    addToCart({ name: `${member.nickname} Member Cheki`, price: globalSettings.prices.regular_cheki_solo || 30000, type: 'solo', member });
                              }}
                              className="w-full py-3.5 md:py-5 text-[8px] md:text-[10px] font-black uppercase tracking-[0.3em] rounded-xl md:rounded-2xl shadow-lg active:scale-95 transition-all hover:brightness-95"
                              style={{ 
                                backgroundColor: member.themeColor,
                                color: member.themeColor.toUpperCase() === '#F8F9FA' ? '#1A1A1D' : 'white',
                                border: member.themeColor.toUpperCase() === '#F8F9FA' ? '1px solid rgba(0,0,0,0.1)' : 'none'
                              }}
                          >
                              ADD TO SLIP
                          </button>
                      </div>
                  </div>

                  {/* Aesthetic Details (Small 'Authentic' marker) */}
                  <div className="absolute top-4 right-4 text-[8px] font-black opacity-10 uppercase tracking-tighter select-none">
                    VIEOS-PRNT
                  </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Downsized Floating Cart Button */}
      <AnimatePresence>
        {cart.length > 0 && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-6 right-6 md:bottom-10 md:right-10 z-[100]"
          >
             <button 
               onClick={() => navigate('/checkout')}
               className="bg-[#1E2132] text-white pl-5 md:pl-8 pr-3 md:pr-6 py-3.5 md:py-5 rounded-full shadow-[0_20px_50px_-10px_rgba(0,0,0,0.5)] flex items-center gap-3 md:gap-6 hover:scale-105 transition-all group overflow-hidden border border-white/10"
             >
                <div className="flex flex-col items-start border-r border-white/10 pr-3 md:pr-6">
                   <span className="text-[6px] md:text-[8px] font-black uppercase tracking-widest opacity-40 leading-none mb-1">Checkout</span>
                   <span className="text-base md:text-xl font-black tracking-tighter">IDR {(total/1000)}K</span>
                </div>
                <div className="bg-vibrant-pink w-7 h-7 md:w-10 md:h-10 rounded-full flex items-center justify-center group-hover:translate-x-1 transition-transform shadow-lg shadow-vibrant-pink/30">
                   <ChevronRight size={14} md:size={18} strokeWidth={4} />
                </div>
                {/* Count Badge - Smaller */}
                <div className="absolute top-0.5 right-0.5 md:top-2 md:right-2 w-4 h-4 md:w-6 md:h-6 bg-vibrant-yellow text-vibrant-pink rounded-full flex items-center justify-center font-black shadow-xl text-[7px] md:text-[10px] animate-pulse">
                   {cart.length}
                </div>
             </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toastConfig && (
          <Toast 
            message={toastConfig.message} 
            type={toastConfig.type}
            onClose={() => showToastMsg(null)} 
          />
        )}
      </AnimatePresence>

      {/* Old Checkout Modal Removed - Now Dedicated Page */}
    </div>
  );
};

export default Cheki;
