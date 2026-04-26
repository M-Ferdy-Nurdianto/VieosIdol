import React from 'react';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Users, 
  FileSpreadsheet, 
  Settings, 
  History, 
  LogOut 
} from 'lucide-react';
import SidebarItem from './SidebarItem';

const Sidebar = ({ activeTab, setActiveTab, setMobileMenuOpen, handleLogout }) => {
  const menuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'orders', icon: ShoppingBag, label: 'Pesanan' },
    { id: 'cms', icon: Users, label: 'Manajemen Talent' },
    { id: 'export', icon: FileSpreadsheet, label: 'Ekspor Data' },
    { id: 'settings', icon: Settings, label: 'EVENT' },
    { id: 'handbook', icon: History, label: 'Panduan Staff' },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-64 border-r border-white/10 bg-[#0A0A0B] h-screen fixed top-0 left-0 p-6 z-50">
      <div className="mb-8">
        <h1 className="text-xl font-black tracking-tight italic">
          VIEOS<span className="text-vibrant-pink">.ADMIN</span>
        </h1>
      </div>
      
      <div className="flex flex-col gap-1 flex-1">
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
      </div>

      <button 
        onClick={handleLogout}
        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-white/40 hover:bg-white/5 hover:text-white transition-colors text-left"
      >
        <LogOut size={18} />
        <span className="text-xs uppercase tracking-wider">Logout</span>
      </button>
    </aside>
  );
};

export default Sidebar;
