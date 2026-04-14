import React from 'react';

const SidebarItem = ({ id, icon: Icon, label, activeTab, setActiveTab, setMobileMenuOpen }) => (
  <button
    onClick={() => {
      setActiveTab(id);
      setMobileMenuOpen(false);
    }}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all relative overflow-hidden ${
      activeTab === id
        ? 'bg-vibrant-pink text-white font-bold shadow-lg shadow-vibrant-pink/20'
        : 'text-white/60 hover:bg-white/5 hover:text-white'
    }`}
  >
    <Icon size={18} />
    <span className="text-xs uppercase tracking-wider">{label}</span>
    {activeTab === id && <div className="absolute inset-0 bg-white/10 animate-pulse" />}
  </button>
);

export default SidebarItem;
