import React from 'react';
import { Link } from 'react-router-dom';
import { Instagram, Youtube, MapPin, Phone, Mail } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="pt-16 pb-8 px-6 border-t" style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-main)' }}>
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 mb-12">
          
          {/* Column 1: Brand & About */}
          <div className="space-y-4">
            <div>
              <Link to="/" className="text-2xl font-black tracking-tighter text-vibrant-pink block mb-3 hover:scale-105 origin-left transition-transform">VIEOS IDOL.</Link>
              <p className="text-[10px] text-gray-400 leading-relaxed max-w-[220px] font-bold uppercase tracking-widest">
                Idol group kebanggaan Surabaya. Melampaui batas, menyebarkan kebahagiaan melalui setiap karya.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <a href="https://instagram.com/vieos.idol" target="_blank" rel="noreferrer" 
                 className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-vibrant-pink hover:text-white transition-all shadow-sm">
                 <Instagram size={16} />
              </a>
              <a href="https://www.youtube.com/@VIEOS.official/videos" target="_blank" rel="noreferrer"
                 className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-vibrant-pink hover:text-white transition-all shadow-sm">
                 <Youtube size={16} />
              </a>
            </div>
          </div>

          {/* Column 2: Contact */}
          <div className="flex flex-col gap-6">
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-300">Hubungi Kami</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-3 text-gray-600">
                <Phone size={12} className="text-vibrant-pink" />
                <span className="text-xs font-bold">0812-3692-2067</span>
              </li>
              <li className="flex items-center gap-3 text-gray-600">
                <MapPin size={12} className="text-vibrant-pink" />
                <span className="text-xs font-bold">Surabaya, Jawa Timur</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-500">
            © 2026 VIEOS IDOL — SURABAYA PRIDE
          </p>
          <Link to="/login" className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-300 hover:text-vibrant-pink transition-colors">
            Staff Access
          </Link>
        </div>
      </div>

    </footer>
  );
};

export default Footer;
