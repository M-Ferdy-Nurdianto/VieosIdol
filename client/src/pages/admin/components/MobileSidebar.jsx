import React from 'react';
import { 
  X,
  LayoutDashboard, 
  ShoppingBag, 
  Users, 
  FileSpreadsheet, 
  Settings, 
  FileText,
  LogOut 
} from 'lucide-react';
import SidebarItem from './SidebarItem';

const MobileSidebar = ({ 
  mobileMenuOpen, 
  setMobileMenuOpen, 
  activeTab, 
  setActiveTab, 
  handleLogout 
}) => {
  if (!mobileMenuOpen) return null;

  const menuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'orders', icon: ShoppingBag, label: 'Pesanan' },
    { id: 'cms', icon: Users, label: 'Manajemen Talent' },
    { id: 'export', icon: FileSpreadsheet, label: 'Ekspor Data' },
    { id: 'settings', icon: Settings, label: 'EVENT' },
    { id: 'handbook', icon: FileText, label: 'Panduan Staff' },
  ];

  return (
    <>
      <div 
        onClick={() => setMobileMenuOpen(false)}
        className="lg:hidden fixed inset-0 bg-black/80 backdrop-blur-sm z-[250]"
      />
      <div
        className="lg:hidden fixed top-0 right-0 bottom-0 w-[280px] bg-[#0A0A0B] border-l border-white/10 z-[300] p-6 overflow-y-auto shadow-2xl"
      >
        <div className="flex justify-between items-center mb-10">
          <span className="text-xl font-bold tracking-tight">
            VIEOS<span className="text-vibrant-pink">.ADMIN</span>
          </span>
          <button onClick={() => setMobileMenuOpen(false)}>
            <X size={24} className="text-white/40 hover:text-white" />
          </button>
        </div>
        
        <nav className="space-y-2">
          {menuItems.map((item) => (
            <SidebarItem
              key={item.id}
              id={item.id}
              icon={item.icon}
              label={item.label}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              setMobileMenuOpen={setMobileMenuOpen}
            />
          ))}
          
          <div className="my-6 border-t border-white/5" />
          
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-white/30 hover:bg-white/[0.03] hover:text-white transition-all text-left group"
          >
            <div className="p-2 rounded-xl bg-white/5 group-hover:bg-white/10">
              <LogOut size={18} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Logout</span>
          </button>
        </nav>
      </div>
    </>
  );
};

export default MobileSidebar;
