import React, { useState } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';
import { Menu, X, ChevronRight, Home, Music, Users, CreditCard } from 'lucide-react';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { scrollY } = useScroll();
  const location = useLocation();
  
  const navBackground = useTransform(
    scrollY,
    [0, 100],
    ['rgba(255, 255, 255, 0)', 'rgba(255, 255, 255, 0.95)']
  );
  
  const navLinks = [
    { name: 'Home', path: '/', icon: <Home size={18} /> },
    { name: 'Music', path: '/music', icon: <Music size={18} /> },
    { name: 'Talents', path: '/members', icon: <Users size={18} /> },
    { name: 'Cheki', path: '/cheki', icon: <CreditCard size={18} /> },
  ];

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  return (
    <>
      <motion.nav
        className="fixed top-0 w-full z-[100] transition-all duration-300"
        style={{
          backgroundColor: navBackground,
        }}
      >
        <div className="absolute inset-0 backdrop-blur-md -z-10" 
             style={{ 
               background: 'var(--bg-main)',
               opacity: 0.9 
             }} 
        />
        
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-center h-20">
            
            {/* Left Side: Logo + Nav Links */}
            <div className="flex items-center gap-12">
              {/* Logo */}
              <Link to="/" className="flex items-center gap-2">
                <img src="/logos/vieos.webp" alt="VIEOS IDOL" className="h-8 w-auto object-contain" />
                <span className="text-xl font-brand italic text-vibrant-pink md:hidden">VIEOS</span>
              </Link>

              {/* Desktop Navigation */}
              <div className="hidden md:flex items-center gap-8">
                {navLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`text-xs font-bold tracking-widest uppercase transition-colors duration-300 ${
                      location.pathname === link.path 
                        ? 'text-vibrant-pink' 
                        : 'hover:text-vibrant-pink'
                    }`}
                    style={{ color: location.pathname === link.path ? 'var(--vibrant-pink)' : 'var(--text-muted)' }}
                  >
                    {link.name}
                  </Link>
                ))}
              </div>
            </div>

            {/* Right Side: Actions */}
            <div className="flex items-center gap-4">
              <ThemeToggle />
              
              <button 
                onClick={toggleMenu}
                className="md:hidden p-2 hover:bg-black/5 rounded-xl transition-colors" 
                style={{ color: 'var(--text-main)' }}
              >
                 {isMenuOpen ? <X /> : <Menu />}
              </button>

              <Link 
                to="/cheki" 
                className="hidden md:flex vibrant-button px-6 py-3 text-[10px] whitespace-nowrap"
              >
                PESAN CHEKI
              </Link>
            </div>
          </div>
        </div>
        
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-800 to-transparent opacity-50" />
      </motion.nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={toggleMenu}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[150] md:hidden"
            />
            
            {/* Menu Content */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-[85%] max-w-sm bg-white z-[200] shadow-2xl md:hidden overflow-hidden flex flex-col"
              style={{ background: 'var(--bg-main)' }}
            >
              <div className="playful-bg opacity-30" />
              
              <div className="p-8 flex justify-between items-center relative z-10">
                <div className="flex items-center gap-2">
                  <img src="/logos/vieos.webp" alt="VIEOS" className="h-6 w-auto" />
                  <span className="text-lg font-brand italic text-vibrant-pink">VIEOS</span>
                </div>
                <button onClick={toggleMenu} className="p-2 bg-black/5 rounded-xl">
                  <X size={20} />
                </button>
              </div>

              <div className="flex-grow px-4 py-6 space-y-2">
                {navLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={toggleMenu}
                    className="flex items-center justify-between p-5 rounded-2xl group transition-all"
                    style={{ 
                      background: location.pathname === link.path ? 'var(--vibrant-pink)' : 'transparent',
                      color: location.pathname === link.path ? 'white' : 'var(--text-main)'
                    }}
                  >
                    <div className="flex items-center gap-4">
                      {link.icon}
                      <span className="text-sm font-black uppercase tracking-widest">{link.name}</span>
                    </div>
                    <ChevronRight size={16} className={location.pathname === link.path ? 'opacity-100' : 'opacity-20'} />
                  </Link>
                ))}
              </div>

              <div className="p-8 border-t border-black/5">
                <Link
                  to="/cheki"
                  onClick={toggleMenu}
                  className="vibrant-button w-full py-5 text-sm"
                >
                  PESAN CHEKI SEKARANG
                </Link>
                <p className="text-[9px] font-black uppercase tracking-widest text-center mt-6 opacity-20">
                  VIEOS IDOL OFFICIAL v1.0
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
