import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const slides = [
  {
    id: 1,
    title: "SATU CERITA",
    subtitle: "KENANGAN YANG TAK TERLUPAKAN",
    description: "Teriakan kalian selalu jadi semangat kami di atas panggung. Makanya, yuk terus tulis cerita ini bareng — karena tanpa kalian, VIEOS bukan apa-apa. 🤍",
    image: "/photo/hero/hero.webp",
    fallback: "/photo/hero/hero.webp",
    type: "INTRO",
    accent: "text-vibrant-pink"
  },
  {
    id: 2,
    title: "MEMOIRE",
    subtitle: "RILIS TERBARU • OUT NOW",
    description: "\"Memoire\" akhirnya hadir! Lagu ini benar-benar spesial buat kami — penuh kenangan, penuh perasaan. Udah dengerin belum? 🎵",
    image: "/photo/hero/hero.webp",
    fallback: "/photo/hero/hero.webp",
    type: "RELEASE",
    accent: "text-vibrant-blue"
  },
  {
    id: 3,
    title: "HADIR & BERSINAR",
    subtitle: "JANGAN LEWATKAN MOMENNYA",
    description: "Ketemu langsung sama VIEOS itu selalu beda rasanya. Kalau ada event kami di kotamu, jangan sampai kelewatan ya — kami tunggu kalian di sana! 💗",
    image: "/photo/hero/hero.webp",
    fallback: "/photo/hero/hero.webp",
    type: "EVENT",
    accent: "text-purple-400"
  }
];

const HeroCarousel = () => {
  const [current, setCurrent] = useState(0);
  const [isLowPowerMode, setIsLowPowerMode] = useState(false);
  const [isSlideLoaded, setIsSlideLoaded] = useState(false);
  const imgRef = useRef(null);
  const hasMultipleSlides = slides.length > 1;
  const backgroundTransition = {
    duration: isLowPowerMode ? 0.8 : 1.6,
    ease: [0.22, 1, 0.36, 1]
  };
  const textTransition = isLowPowerMode
    ? { duration: 0.45, ease: 'easeOut' }
    : { duration: 0.8, ease: [0.22, 1, 0.36, 1] };

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 768px), (prefers-reduced-motion: reduce), (hover: none) and (pointer: coarse)');
    const applyMode = () => setIsLowPowerMode(mediaQuery.matches);
    applyMode();
    mediaQuery.addEventListener('change', applyMode);
    return () => mediaQuery.removeEventListener('change', applyMode);
  }, []);

  useEffect(() => {
    if (!hasMultipleSlides) {
      return undefined;
    }

    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, isLowPowerMode ? 8000 : 6000);
    return () => clearInterval(timer);
  }, [isLowPowerMode, hasMultipleSlides]);

  useEffect(() => {
    setIsSlideLoaded(false);
  }, [current]);

  useEffect(() => {
    if (!imgRef.current) {
      return;
    }

    if (imgRef.current.complete && imgRef.current.naturalWidth > 0) {
      setIsSlideLoaded(true);
    }
  }, [current]);

  return (
    <div className="relative h-screen w-full overflow-hidden flex items-center justify-center">
      {/* Background Slides */}
      <AnimatePresence mode="sync">
        <motion.div
          key={current}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={backgroundTransition}
          className="absolute inset-0 z-0"
        >
          {/* Fade-only Image */}
            {!isSlideLoaded && (
              <div className="absolute inset-0 animate-pulse bg-black/40" aria-hidden="true" />
            )}
            <motion.img 
              ref={imgRef}
              src={slides[current].image} 
              alt={slides[current].title}
              width={1920}
              height={1080}
               initial={{ opacity: 0 }}
               animate={{ opacity: isSlideLoaded ? 1 : 0 }}
               transition={{ opacity: { duration: isLowPowerMode ? 0.6 : 1, ease: [0.22, 1, 0.36, 1] } }}
              loading="eager"
              fetchpriority="high"
              decoding="async"
              className="absolute inset-0 w-full h-full object-cover"
              onLoad={() => setIsSlideLoaded(true)}
               onError={(e) => {
                if (e.currentTarget.dataset.fallbackApplied === 'true') {
                  setIsSlideLoaded(true);
                  return;
                }
                e.currentTarget.dataset.fallbackApplied = 'true';
                e.currentTarget.src = slides[current].fallback;
               }}
            />
          
          {/* Overlays */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/40 to-black/80" />
          <div className={`absolute inset-0 bg-black/20 ${isLowPowerMode ? '' : 'backdrop-blur-[1px]'}`} />
          
          {/* Colored Tint Overlay */}
          <div className={`absolute inset-0 opacity-20 mix-blend-overlay ${
            slides[current].accent.includes('blue') ? 'bg-blue-600' : 
            slides[current].accent.includes('pink') ? 'bg-pink-600' : 'bg-purple-600'
          }`} />
        </motion.div>
      </AnimatePresence>

      {/* Content */}
      <div className="relative z-10 text-center max-w-5xl px-6 pt-20">
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -10, opacity: 0 }}
            transition={textTransition}
            className="flex flex-col items-center"
          >
            {/* Badge */}
            <motion.div 
               initial={{ letterSpacing: "0.2em", opacity: 0 }}
               animate={{ letterSpacing: "0.4em", opacity: 1 }}
               className="mb-4 border-b border-white/30 pb-2"
            >
              <span className="text-[10px] md:text-xs font-black uppercase text-white tracking-[0.4em]">
                {slides[current].subtitle}
              </span>
            </motion.div>

            {/* 3D Logo with AOS */}
            <div 
              className="mb-4 relative group"
              data-aos="zoom-in"
              data-aos-delay="200"
              style={{ willChange: 'transform, opacity' }}
            >
              {/* Explicit w/h prevents CLS (logo size reserved before load) */}
              <div className="w-32 h-32 md:w-56 md:h-56 relative z-10 transition-transform duration-700 group-hover:scale-110 group-hover:rotate-6" style={{ aspectRatio: '1 / 1' }}>
                <img 
                  src="/logos/vieos.webp" 
                  alt="VIEOS IDOL Logo" 
                  width={224}
                  height={224}
                  loading="eager"
                  fetchpriority="low"
                  decoding="async"
                  className="w-full h-full object-contain drop-shadow-[0_20px_50px_rgba(255,105,180,0.5)]"
                  onError={(e) => {
                    e.target.src = "https://cdn-icons-png.flaticon.com/512/10534/10534237.png"; 
                  }}
                />
              </div>
              {/* Glow Effect */}
              {!isLowPowerMode && <div className="absolute inset-0 bg-vibrant-pink/20 blur-[60px] rounded-full animate-pulse -z-0" />}
            </div>

            <h1 className="text-4xl md:text-7xl font-brand italic font-black mb-4 tracking-tighter text-white leading-[0.95] drop-shadow-2xl">
              {slides[current].title}
            </h1>

            {/* Description */}
            <p className="text-base md:text-xl text-white/80 max-w-2xl mb-8 font-medium leading-relaxed drop-shadow-lg">
              {slides[current].description}
            </p>

            {/* CTA Removed as requested */}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Progress Indicators */}
      {hasMultipleSlides && (
        <div className="absolute bottom-12 flex items-center gap-6 z-20">
          <div className="flex gap-3">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrent(index)}
                className="relative h-1 w-12 bg-white/20 rounded-full overflow-hidden"
              >
                {index === current && (
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: "100%" }}
                    transition={{ duration: isLowPowerMode ? 8 : 6, ease: "linear" }}
                    className="absolute inset-0 bg-vibrant-pink"
                  />
                )}
              </button>
            ))}
          </div>
          <div className="text-[10px] font-bold text-white/50 tracking-widest">
            0{current + 1} / 0{slides.length}
          </div>
        </div>
      )}

      {/* Decorative corner elements */}
      <div className="absolute top-12 left-12 w-24 h-24 border-l border-t border-white/20 -z-10" />
      <div className="absolute bottom-12 right-12 w-24 h-24 border-r border-b border-white/20 -z-10" />
    </div>
  );
};

export default HeroCarousel;
