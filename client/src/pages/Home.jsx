import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { fetchEvents } from '../api';
import { ArrowRight, MapPin, Clock, Instagram, Youtube, Cherry, Star } from 'lucide-react';
import HeroCarousel from '../components/HeroCarousel';
import Footer from '../components/Footer';

const Home = () => {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      const data = await fetchEvents();
      // Only show upcoming events
      setEvents(data.filter(e => e.status !== 'done'));
    };
    loadData();
  }, []);

  return (
    <div className="relative min-h-screen">
      {/* Background Effects */}
      <div className="playful-bg" />
      <div className="grain-overlay" />

      {/* Hero Carousel Section */}
      <section className="relative h-screen bg-black">
         <HeroCarousel />
      </section>

      {/* About Section - Scrapbook / Fanzine Style */}
      <section className="py-16 md:py-48 relative paper-texture transition-colors duration-500 bg-transparent">
        {/* Organic Doodles & Background Elements */}
        <div className="absolute top-20 right-4 md:right-20 text-[6rem] md:text-[15rem] font-brand select-none rotate-12 pointer-events-none opacity-[0.03]" style={{ color: 'var(--text-main)' }}>VIEOS</div>
        <div className="absolute top-1/2 left-[-20%] md:left-[-10%] w-[300px] md:w-[800px] h-[300px] md:h-[800px] bg-vibrant-pink/15 rounded-full blur-[80px] md:blur-[160px] -z-0 pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="flex flex-col lg:flex-row gap-12 lg:gap-32 items-center">
            
            {/* Visual Composition - High Impact Scrapbook */}
            <div className="w-full lg:w-1/2 relative min-h-[500px] md:min-h-[650px] flex items-center justify-center">
               {/* Main Polaroid - The "Show" */}
               <motion.div 
                 initial={{ rotate: -8, scale: 0.9, opacity: 0 }}
                 whileInView={{ rotate: -4, scale: 1, opacity: 1 }}
                 viewport={{ once: true }}
                 className="polaroid-frame w-72 md:w-96 relative z-20"
               >
                  <div className="washi-tape -top-6 left-1/2 -translate-x-1/2 rotate-3 w-32 bg-vibrant-pink/40" />
                  <img 
                    src="/photo/about/about-hero.webp" 
                    alt="VIEOS Live performance" 
                              loading="lazy"
                              decoding="async"
                    className="w-full aspect-[4/5] object-cover"
                  />
                  <div className="mt-6 handwritten text-vibrant-pink text-2xl md:text-4xl text-center">VIEOS</div>
               </motion.div>

               {/* Secondary Photo - Backstage/Vibe */}
               <motion.div 
                 initial={{ x: 60, y: -40, rotate: 12, opacity: 0 }}
                 whileInView={{ x: 120, y: -80, rotate: 10, opacity: 1 }}
                 viewport={{ once: true }}
                 className="absolute top-10 right-0 md:right-4 polaroid-frame w-48 md:w-64 z-10 hidden md:block"
               >
                  <div className="washi-tape -top-2 -right-10 rotate-45 w-24 bg-vibrant-blue/30" />
                  <img 
                    src="/photo/hero/hero 2.png" 
                    alt="Stage lights" 
                              loading="lazy"
                              decoding="async"
                    className="w-full aspect-square object-cover"
                  />
               </motion.div>

               {/* Sticky Note - The Numbers */}
               <motion.div 
                 initial={{ y: 50, rotate: 15, opacity: 0 }}
                 whileInView={{ 
                    y: window.innerWidth < 768 ? 200 : 260, 
                    x: window.innerWidth < 768 ? -100 : -160, 
                    rotate: -8, 
                    opacity: 1 
                 }}
                 viewport={{ once: true }}
                 className="absolute bg-[#FFE96B] p-3 md:p-8 shadow-[10px_10px_20px_rgba(0,0,0,0.2)] z-30 transform hover:rotate-0 transition-all cursor-pointer group scale-[0.45] md:scale-100 origin-bottom-left"
               >
                  <div className="absolute top-0 left-0 w-full h-2 bg-black/5" />
                  <div className="text-vibrant-pink font-black text-4xl md:text-5xl leading-none mb-1 group-hover:scale-110 transition-transform">10</div>
                  <div className="text-[9px] md:text-[11px] font-black uppercase tracking-[0.2em] text-black/40">Registered Members</div>
                  <div className="mt-4 w-8 h-1 bg-vibrant-pink/20" />
                  {/* Tape on top of post-it */}
                  <div className="absolute top-[-8px] left-1/2 -translate-x-1/2 w-12 h-4 bg-white/60 backdrop-blur-sm -rotate-2" />
               </motion.div>
            </div>

            {/* Content Area - Clean & Bold */}
            <motion.div
              initial={{ x: 50, opacity: 0 }}
              whileInView={{ x: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="w-full lg:w-1/2 space-y-10"
            >
              <div className="relative inline-block">
                 <span className="relative z-10 px-4 py-1.5 bg-vibrant-pink text-white text-[11px] font-black tracking-[0.4em] uppercase transform inline-block -rotate-2">
                    ABOUT US
                 </span>
                 <div className="absolute inset-0 bg-vibrant-pink blur-md opacity-30 -rotate-2" />
              </div>
              
              <h2 className="text-5xl md:text-7xl font-black tracking-tighter leading-[0.85] uppercase" style={{ color: 'var(--text-main)' }}>
                Vieos Idol<br/>
                <span className="text-vibrant-pink italic handwritten lowercase text-6xl md:text-8xl block mt-4">From Surabaya</span>
              </h2>
              
              <div className="space-y-6 max-w-xl">
                  <p className="text-xl md:text-2xl font-medium leading-relaxed" style={{ color: 'var(--text-main)', opacity: 0.9 }}>
                     <span className="text-vibrant-pink font-black">LOREM IPSUM</span> — Dolor sit amet consectetur adipiscing elit.
                  </p>
                  
                  <p className="text-base md:text-lg leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                     Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
                  </p>

                 <div className="flex flex-wrap gap-6 items-center pt-8">
                    <a href="/members" className="vibrant-button group px-12 py-6 text-xs relative overflow-hidden">
                       <span className="relative z-10">Cek Profil Member</span>
                       <Star className="w-5 h-5 ml-2 group-hover:rotate-[360deg] transition-transform duration-700" />
                       <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                    </a>
                    <a href="https://instagram.com/vieos.idol" target="_blank" className="flex items-center gap-4 group">
                       <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white group-hover:bg-white group-hover:text-black transition-all" style={{ backgroundColor: 'var(--accent-soft)', borderColor: 'var(--border-main)', color: 'var(--text-main)' }}>
                          <Instagram size={24} />
                       </div>
                       <div>
                          <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--text-muted)', opacity: 0.5 }}>Follow us</p>
                          <p className="text-sm font-black group-hover:text-vibrant-pink transition-colors" style={{ color: 'var(--text-main)' }}>@vieos.idol</p>
                       </div>
                    </a>
                 </div>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* Events Section - More Grunge/Raw Details */}
       <section id="schedule" className="py-20 md:py-40 relative bg-transparent">
        <div className="max-w-6xl mx-auto px-6 md:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center md:items-end mb-16 md:mb-24 gap-6 text-center md:text-left">
            <div className="relative w-full md:w-auto">
              {/* Center the star on mobile */}
              <Star className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 md:-top-12 md:-left-12 w-20 h-20 text-vibrant-yellow/10 pointer-events-none" />
              
              <span className="text-xs font-black tracking-[0.5em] uppercase mb-4 block text-vibrant-blue">
                THE RITUALS
              </span>
              <h2 className="text-4xl md:text-5xl font-black tracking-tighter leading-tight">
                Jangan Sampe<br className="hidden md:block" /> Ketinggalan.
              </h2>
            </div>
          </div>

          <div className="space-y-6">
            {events.map((event, i) => (
              <motion.div
                key={i}
                initial={{ y: 20, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group cursor-pointer relative"
              >
                <div className="p-10 rounded-[2.5rem] shadow-sm border border-main group-hover:shadow-xl group-hover:-translate-y-1 transition-all" style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-main)' }}>
                  <div className="flex flex-col md:flex-row items-center gap-12">
                    <div className="text-center md:text-left min-w-full md:min-w-[120px]">
                      <div className="text-3xl md:text-4xl font-black text-vibrant-pink tracking-tighter">
                        {event.event_date}
                      </div>
                      <div className="text-[9px] md:text-[10px] font-black uppercase tracking-widest mt-1" style={{ color: 'var(--text-muted)' }}>
                        SAVE THE DATE
                      </div>
                    </div>

                    <div className="flex-grow">
                      <h3 className="text-3xl font-black mb-4 group-hover:text-vibrant-pink transition-colors" style={{ color: 'var(--text-main)' }}>
                        {event.name}
                      </h3>
                      <div className="flex flex-wrap justify-center md:justify-start gap-8 text-sm font-bold" style={{ color: 'var(--text-muted)' }}>
                        <div className="flex items-center gap-2">
                           <MapPin size={16} /> <span>{event.location}</span>
                        </div>
                        <div className="flex items-center gap-2">
                           <Clock size={16} /> <span>{event.event_time}</span>
                        </div>
                      </div>
                    </div>

                    <a href="/cheki" className="vibrant-button py-4 px-10 text-[10px] whitespace-nowrap">
                      AMANKAN TIKETMU!
                    </a>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-40 relative overflow-hidden bg-transparent">
         <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30" />
         <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
            <h2 className="text-4xl md:text-5xl font-black mb-8 tracking-tighter" style={{ color: 'var(--text-main)' }}>
               Ready to Join the<br/>
               <span className="text-gradient font-brand italic text-5xl md:text-6xl">Universe?</span>
            </h2>
            <div className="flex justify-center gap-6">
               <a href="https://instagram.com/vieos.idol" className="vibrant-button px-12 py-6">
                  <span className="relative z-10">Follow Our Journey</span>
               </a>
            </div>
         </div>
      </section>
       {/* COLLABORATION & PARTNERSHIP SECTION - Theme Responsive & Refined */}
      <section className="py-32 bg-transparent overflow-hidden">
         <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="glass-effect p-8 sm:p-12 md:p-20 rounded-[2.5rem] md:rounded-[4rem] relative overflow-hidden group border-main shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)]" style={{ backgroundColor: 'var(--bg-subtle)' }}>
               {/* Advanced Decorative Background Orbs */}
               <div className="absolute -top-24 -right-24 w-96 h-96 bg-vibrant-pink/15 rounded-full blur-[120px] -z-10 group-hover:scale-125 transition-all duration-1000 pointer-events-none" />
               <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-vibrant-blue/15 rounded-full blur-[120px] -z-10 group-hover:scale-125 transition-all duration-1000 pointer-events-none" />
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/ashen-paper.png')] opacity-[0.03] pointer-events-none" />
               
               <div className="flex flex-col lg:grid lg:grid-cols-2 gap-12 md:gap-20 items-center relative z-10">
                  <div data-aos="fade-up" className="text-center lg:text-left space-y-4">
                     <div className="inline-flex items-center gap-2 px-4 py-2 bg-vibrant-pink/10 text-vibrant-pink text-[10px] font-black tracking-[0.3em] uppercase mb-4 rounded-full border border-vibrant-pink/20 backdrop-blur-sm">
                        <Star className="w-3 h-3 fill-current" />
                        BOOKING INFO
                     </div>
                     <h2 className="text-4xl sm:text-5xl md:text-7xl font-black tracking-tighter leading-[0.9] uppercase" style={{ color: 'var(--text-main)' }}>
                        Undang Kami<br/>
                        <span className="text-gradient font-brand italic text-5xl sm:text-6xl md:text-8xl lowercase block mt-2 md:-mt-2 pb-4">ke panggungmu.</span>
                     </h2>
                     
                     {/* Mobile Only: Quick Status Pill */}
                     <div className="lg:hidden flex justify-center mt-6">
                        <div className="flex items-center gap-3 px-6 py-3 rounded-full border border-white/10 glass-effect shadow-lg" style={{ backgroundColor: 'var(--bg-main)' }}>
                           <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_12px_rgba(34,197,94,0.6)]" />
                           <span className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: 'var(--text-muted)' }}>Online & Ready</span>
                        </div>
                     </div>
                  </div>
                  
                  <div className="space-y-10 lg:space-y-12 text-center lg:text-left" data-aos="fade-up" data-aos-delay="100">
                     <p className="text-lg md:text-2xl font-medium leading-relaxed opacity-90 max-w-2xl mx-auto lg:mx-0" style={{ color: 'var(--text-muted)' }}>
                        Untuk para <span className="text-vibrant-pink font-extrabold italic">Event Organizer</span> dan Promotor yang ingin menghadirkan kemeriahan <span className="text-vibrant-blue font-extrabold">VIEOS</span>, silakan hubungi tim kami untuk detail teknis dan jadwal.
                     </p>
                     
                     <div className="flex flex-col sm:flex-row flex-wrap gap-6 items-center justify-center lg:justify-start">
                        <a href="https://wa.me/6281234567890" target="_blank" className="w-full sm:w-auto vibrant-button py-6 px-12 text-sm relative group/btn shadow-[0_20px_40px_-10px_rgba(255,27,141,0.4)] overflow-hidden">
                           <div className="absolute inset-0 bg-white/10 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300" />
                           <span className="relative z-10 flex items-center gap-3">
                              HUBUNGI ADMIN (CP)
                              <Instagram size={18} className="opacity-50" />
                           </span>
                        </a>
                        
                        {/* Desktop Only: Status Pill */}
                        <div className="hidden lg:flex items-center gap-4 px-8 py-5 rounded-2xl border border-white/5 glass-effect shadow-xl" style={{ backgroundColor: 'var(--bg-main)' }}>
                           <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-[0_0_15px_rgba(34,197,94,0.7)]" />
                           <div className="flex flex-col">
                              <span className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: 'var(--text-muted)' }}>Status</span>
                              <span className="text-xs font-bold text-green-500 uppercase tracking-widest">Online & Ready</span>
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
               
               {/* Aesthetic Side Label */}
               <div className="absolute right-[-2rem] bottom-[5rem] rotate-[-90deg] origin-bottom-right hidden xl:block opacity-20 select-none">
                  <span className="text-7xl font-black tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>COLLABORATION</span>
               </div>
            </div>
         </div>
      </section>


      <Footer />
    </div>
  );
};

export default Home;
