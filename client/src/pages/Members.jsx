import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { fetchMembers } from '../api';
import { Star } from 'lucide-react';
import SkeletonImage from '../components/SkeletonImage';
import MemberCardSkeleton from '../components/MemberCardSkeleton';
import { getMemberImageSrc, getMemberFallbackImage } from '../utils/memberImages';

const Members = () => {
  const [members, setMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchMembers();
        // Map database naming (theme_color) back to camelCase just in case
        setMembers(data.map(m => ({
            ...m,
            themeColor: m.theme_color || m.themeColor
        })));
      } catch (error) {
        console.error('Failed to load members:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  return (
    <div className="min-h-screen relative py-48 px-6 md:px-12 overflow-hidden transition-colors duration-500">
      {/* Background Effects */}
      <div className="playful-bg" />
      <div className="grain-overlay" />
      
      {/* Global Glows for consistency */}
      <div className="absolute top-[10%] left-[-20%] md:left-[-10%] w-[300px] md:w-[800px] h-[300px] md:h-[800px] bg-vibrant-pink/10 rounded-full blur-[80px] md:blur-[160px] -z-0 pointer-events-none" />
      <div className="absolute bottom-[20%] right-[-20%] md:right-[-10%] w-[300px] md:w-[600px] h-[300px] md:h-[600px] bg-vibrant-blue/10 rounded-full blur-[80px] md:blur-[140px] -z-0 pointer-events-none" />

      {/* Hero Header */}
      <div className="max-w-7xl mx-auto relative z-10 mb-32">
        <div className="text-center max-w-3xl mx-auto">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex items-center justify-center gap-4 mb-6"
          >
             <Star className="text-vibrant-pink animate-pulse" size={16} />
             <span className="text-[10px] font-black tracking-[0.6em] uppercase text-vibrant-pink/60">The VIEOS Stars</span>
             <Star className="text-vibrant-pink animate-pulse" size={16} />
          </motion.div>
          <motion.h1 
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-6xl md:text-8xl font-black tracking-tighter uppercase mb-6"
            style={{ color: 'var(--text-main)' }}
          >
            Profil<br/>
            <span className="text-gradient font-brand italic text-5xl md:text-7xl lowercase block">Member.</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-lg md:text-xl font-medium leading-relaxed opacity-80"
            style={{ color: 'var(--text-muted)' }}
          >
            Kenali lebih dekat 10 bintang yang siap mengguncang panggung. Tiap member punya semangat unik yang bikin VIEOS makin bersinar!
          </motion.p>
        </div>
      </div>

      {/* Structured Profile Gallery - 5 Column Grid on Desktop */}
      <div className="max-w-7xl mx-auto relative z-10 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-y-12 md:gap-y-16 gap-x-4 md:gap-x-8 px-4 justify-items-center">
        {isLoading ? (
          <MemberCardSkeleton count={10} />
        ) : (
          members.map((member, idx) => (
            <motion.div
              key={member.id}
              initial={{ y: 20, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.05, type: 'spring', stiffness: 100 }}
              whileHover={{ y: -10, scale: 1.02 }}
              onClick={() => navigate(`/members/${member.id}`)}
              className="cursor-pointer relative group w-full"
            >
              {/* The Frame - Professional & Simple */}
              <div 
                className="relative aspect-[4/5] rounded-xl overflow-hidden border-[6px] shadow-2xl transition-all duration-500 bg-black/5 dark:bg-white/5"
                style={{ borderColor: member.themeColor }}
              >
                <SkeletonImage
                  src={getMemberImageSrc(member)}
                  fallbackSrc={getMemberFallbackImage(member)}
                  alt={member.nickname}
                  width={400}
                  height={500}
                  wrapperClassName="w-full h-full"
                  className="w-full h-full object-cover grayscale-[10%] group-hover:grayscale-0 transition-all duration-700"
                />
                
                {/* Corner Bracket Accents (Custom Look) */}
                <div className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 mix-blend-difference opacity-50" style={{ borderColor: 'white' }} />
                <div className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 mix-blend-difference opacity-50" style={{ borderColor: 'white' }} />



                {/* Theme Color Glow on Hover */}
                <div 
                  className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-500"
                  style={{ backgroundColor: member.themeColor }}
                />
              </div>

              {/* Name Tag Below - Modern & Clean */}
              <div className="mt-5 text-center">
                <h3 className="text-base md:text-lg font-black uppercase tracking-tighter leading-none mb-1 transition-colors group-hover:text-vibrant-pink" style={{ color: 'var(--text-main)' }}>
                  {member.nickname}
                </h3>
                <p className="text-[8px] font-bold uppercase tracking-[0.3em] opacity-40 italic" style={{ color: 'var(--text-muted)' }}>
                  {member.vibe}
                </p>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default Members;
