import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const SpotifyEmbed = ({ url, height = "152" }) => {
  const embedUrl = url.includes("/embed/") ? url : url.replace("https://open.spotify.com/", "https://open.spotify.com/embed/");
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [showFallback, setShowFallback] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(hover: none) and (pointer: coarse)');
    const updateDeviceType = () => setIsTouchDevice(mediaQuery.matches);

    updateDeviceType();
    mediaQuery.addEventListener('change', updateDeviceType);

    return () => mediaQuery.removeEventListener('change', updateDeviceType);
  }, []);

  useEffect(() => {
    setIsLoaded(false);
    setShowFallback(false);

    const timeoutId = setTimeout(() => {
      setShowFallback(true);
    }, 9000);

    return () => clearTimeout(timeoutId);
  }, [embedUrl]);

  const directSpotifyUrl = embedUrl.replace('/embed/', '/');

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      whileHover={isTouchDevice ? undefined : { scale: 1.01 }}
      className="relative rounded-3xl shadow-2xl overflow-hidden border transition-colors duration-500"
      style={{ 
        backgroundColor: 'var(--bg-main)', 
        borderColor: 'var(--border-main)',
        boxShadow: 'var(--shadow-lg)'
      }}
    >
      {!isLoaded && (
        <div
          className="absolute inset-0 animate-pulse bg-white/5 dark:bg-white/10"
          style={{ minHeight: `${height}px` }}
          aria-hidden="true"
        />
      )}

      <iframe
        style={{ borderRadius: '12px' }}
        src={embedUrl}
        title="Spotify Player"
        width="100%"
        height={height}
        frameBorder="0"
        allowFullScreen=""
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        loading="lazy"
        onLoad={() => {
          setIsLoaded(true);
          setShowFallback(false);
        }}
        className={`transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
      ></iframe>

      {showFallback && !isLoaded && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center bg-black/40 backdrop-blur-sm">
          <p className="text-xs font-bold tracking-wide text-white/90">
            Player Spotify lambat dimuat di perangkat ini.
          </p>
          <a
            href={directSpotifyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="vibrant-button px-6 py-3 text-[10px]"
          >
            Buka di Spotify
          </a>
        </div>
      )}
    </motion.div>
  );
};

export default SpotifyEmbed;
