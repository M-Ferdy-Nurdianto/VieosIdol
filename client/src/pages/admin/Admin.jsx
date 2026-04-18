import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
   LayoutDashboard, ShoppingBag, Send, History,
   Settings, LogOut, Search, Filter,
   Plus, Minus, CheckCircle2, Clock,
   AlertCircle, FileSpreadsheet, FileText,
   RefreshCcw, Eye, ChevronRight, User, Users,
   Calendar, CreditCard, ExternalLink, Save, Pencil,
   Image, Menu, X, Trash2,
   AlertTriangle
} from 'lucide-react';
import { fetchMembers, API_URL } from '../../api';
import DatePicker from '../../components/DatePicker';
import VIEOSSelect from './components/VIEOSSelect';
import PriceInput from './components/PriceInput';
import SidebarItem from './components/SidebarItem';
import LoadingSpinner from './components/LoadingSpinner';
import { eventOptionBadge } from './utils';
import { getMemberImageSrc, getMemberFallbackImage } from '../../utils/memberImages';
import { supabase } from '../../supabase';

const ADMIN_API = API_URL;

const Admin = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [modalTab, setModalTab] = useState('info'); // 'info' or 'lineup'
  const [orders, setOrders] = useState([]);
  const [events, setEvents] = useState([]);
  const [membersList, setMembersList] = useState([]);
  const [toasts, setToasts] = useState([]);

  const [editingOTS, setEditingOTS] = useState(null); // Order object being edited
  const [showEditOTSModal, setShowEditOTSModal] = useState(false);

  const handleLogout = () => {
    showToast("Sampai jumpa, Admin!");
    setTimeout(() => {
      localStorage.removeItem('isAdminAuthenticated');
      window.location.href = '/';
    }, 1000);
  };
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      .custom-scrollbar::-webkit-scrollbar {
        width: 4px;
        height: 0px;
      }
      .custom-scrollbar::-webkit-scrollbar-track {
        background: transparent;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.1);
        border-radius: 10px;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background: rgba(255, 255, 255, 0.2);
      }
      
      @keyframes toast-in {
        from { transform: translateX(100%) scale(0.9); opacity: 0; }
        to { transform: translateX(0) scale(1); opacity: 1; }
      }
      
      @keyframes toast-out {
        from { transform: translateX(0) scale(1); opacity: 1; }
        to { transform: translateX(100%) scale(0.9); opacity: 0; }
      }

      .animate-toast-in {
        animation: toast-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      }

      .animate-toast-out {
        animation: toast-out 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      }

      .toast-glass {
        background: rgba(18, 18, 20, 0.85);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSavingOTS, setIsSavingOTS] = useState(false);
  const [isSavingEvent, setIsSavingEvent] = useState(false);
  const [statusUpdatingId, setStatusUpdatingId] = useState(null);
  const [isExporting, setIsExporting] = useState(null);
  const [isSavingGlobalSettings, setIsSavingGlobalSettings] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [isUpdatingOTS, setIsUpdatingOTS] = useState(false);
  
  // ... (state definitions remain the same) ...
  const [otsForm, setOTSForm] = useState({
    nickname: '',
    contact: '',
    selectedMembers: {},
    payment_method: 'cash',
    cheki_type: 'member', // 'member' or 'group'
    event_id: null
  });

  const [eventForm, setEventForm] = useState({
    name: '',
    date: '',
    po_deadline: '',
    status: 'ongoing',
    type: 'standard', // 'standard' or 'special'
    location: '',
    time: '',
    lineup: ['GROUP'],
    theme: '',
    available_members: ['GROUP'],
    special_solo_price: 30000,
    special_group_price: 35000,
    group_enabled: true
  });

  const [filter, setFilter] = useState({
    status: 'all',
    event: 'all', 
    search: ''
  });

  const [eventModal, setEventModal] = useState({
    show: false,
    mode: 'add', // 'add' or 'edit'
    data: null
  });

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showProofOnly, setShowProofOnly] = useState(false);
  
  const [confirmModal, setConfirmModal] = useState({
    show: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  const [globalSettings, setGlobalSettings] = useState({
    prices: {
      regular_cheki_solo: 30000,
      regular_cheki_group: 35000
    }
  });

  const formRef = useRef(null);
  const orderIdsRef = useRef(new Set());
  const initialSyncDoneRef = useRef(false);

  const showToast = useCallback((message, type = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type, isExiting: false }]);
    
    // Set exit animation
    setTimeout(() => {
      setToasts((prev) => prev.map(t => t.id === id ? { ...t, isExiting: true } : t));
    }, 2600);
    
    // Remove from state
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  const LoadingSpinner = ({ size = 16, className = "" }) => (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      <div className="absolute inset-0 border-2 border-white/10 rounded-full"></div>
      <div className="absolute inset-0 border-2 border-t-vibrant-pink rounded-full animate-spin"></div>
    </div>
  );

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ordRes, evRes, setRes, memData] = await Promise.all([
            fetch(`${ADMIN_API}/orders`),
            fetch(`${ADMIN_API}/orders/events`),
            fetch(`${ADMIN_API}/orders/settings`),
        fetchMembers()
      ]);
      
      const ordData = await ordRes.json();
      const evData = await evRes.json();
      const setData = await setRes.json();
      
      setOrders(ordData);
      setEvents(evData);
      setGlobalSettings(setData);
      setMembersList(memData);
      
      if (evData.length > 0) {
        // Default to the latest ongoing event
        const ongoingEvents = evData.filter(ev => ev.status === 'ongoing');
        const defaultEventId = ongoingEvents.length > 0 
          ? ongoingEvents[ongoingEvents.length - 1].id 
          : evData[evData.length - 1].id;

        if (!otsForm.event_id) {
          setOTSForm(prev => ({ ...prev, event_id: defaultEventId }));
        }
        // Set filter to the default event instead of 'all'
        setFilter(prev => ({ ...prev, event: defaultEventId }));
      }
    } catch (err) {
      console.error("Fetch data failed:", err);
      // Try to get more info from the response if possible
      if (err instanceof Response) {
        try {
          const body = await err.text();
          console.error("Error response body:", body);
          showToast(`Server Error: ${body.substring(0, 50)}...`, "error");
        } catch (e) {}
      } else {
        showToast("Koneksi gagal atau data tidak valid", "error");
      }
    } finally {
      setLoading(false);
      initialSyncDoneRef.current = true;
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    orderIdsRef.current = new Set(orders.map((o) => o.id));
  }, [orders]);

  useEffect(() => {
    // Real-time listener for orders table
    const channel = supabase
      .channel('admin-orders-live')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'orders' 
      }, async (payload) => {
        console.log('Real-time order change detected:', payload.eventType);
        
        // Always refresh data to ensure consistency
        const res = await fetch(`${ADMIN_API}/orders`);
        if (!res.ok) return;
        const data = await res.json();
        
        const prevIds = orderIdsRef.current;
        const newOrders = data.filter((o) => !prevIds.has(o.id));
        
        if (initialSyncDoneRef.current && newOrders.length > 0) {
          showToast(`${newOrders.length} pesanan baru`, 'success');
        }
        
        setOrders(data);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [showToast]);

  const updateStatus = async (orderId, newStatus) => {
    setStatusUpdatingId(orderId);
    try {
         await fetch(`${ADMIN_API}/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      const statusLabel = newStatus === 'pending' ? 'Belum dicek' : newStatus === 'paid' ? 'Sudah bayar' : 'Selesai';
      const ref = orders.find((o) => o.id === orderId)?.public_code || orderId;
      showToast(`Pesanan ${ref} berhasil diubah ke ${statusLabel}`);
    } catch (err) {
      showToast("Gagal memperbarui status", "error");
    } finally {
      setStatusUpdatingId(null);
    }
  };

  const createOTSOrder = async () => {
    if (!otsForm.nickname || Object.keys(otsForm.selectedMembers).length === 0) {
      showToast("Harap isi nama panggilan & pilih member!", "error");
      return;
    }

    const items = Object.entries(otsForm.selectedMembers).map(([name, qty]) => ({
      member_id: name,
      qty: qty
    }));

    const newOrder = {
      ...otsForm,
      items,
      mode: 'ots',
      status: 'paid' // OTS is always paid immediately
    };

    setIsSavingOTS(true);
    try {
         const res = await fetch(`${ADMIN_API}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newOrder)
      });
      
      if (res.ok) {
        showToast("Pesanan Booth Berhasil Dibuat!");
        setOTSForm(prev => ({
          ...prev,
          nickname: '',
          contact: '',
          selectedMembers: {}, 
          payment_method: 'cash'
        }));
        fetchData();
      }
    } catch (err) {
      showToast("Gagal membuat pesanan booth", "error");
    } finally {
      setIsSavingOTS(false);
    }
  };

  const toggleMember = (name) => {
    setOTSForm(prev => ({
      ...prev,
      selectedMembers: {
        ...prev.selectedMembers,
        [name]: (prev.selectedMembers[name] || 0) + 1
      }
    }));
  };

  const decrementMember = (e, name) => {
    e.preventDefault();
    setOTSForm(prev => {
      const newSelected = { ...prev.selectedMembers };
      if (newSelected[name] > 1) {
        newSelected[name] -= 1;
      } else {
        delete newSelected[name];
      }
      return { ...prev, selectedMembers: newSelected };
    });
  };

  const resetSelection = () => {
    setOTSForm(prev => ({ ...prev, selectedMembers: {} }));
  };

  const updateGlobalSettings = async () => {
    setIsSavingGlobalSettings(true);
    try {
      const response = await fetch(`${ADMIN_API}/orders/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prices: globalSettings.prices })
      });
      // Simulasi delay sedikit untuk memunculkan animasi loading
      await new Promise(resolve => setTimeout(resolve, 600));
      if (response.ok) {
        showToast("Harga standar berhasil diperbarui.", "success");
      } else {
        showToast("Gagal memperbarui harga (Respons Server).", "error");
      }
    } catch (err) {
      showToast("Gagal memperbarui harga (Koneksi Error).", "error");
    } finally {
      setIsSavingGlobalSettings(false);
    }
  };

  const handleEventSubmit = async () => {
    if (!eventForm.name || !eventForm.date) return;
    setIsSavingEvent(true);
    try {
      const url = eventModal.mode === 'add' 
            ? `${ADMIN_API}/orders/events` 
            : `${ADMIN_API}/orders/events/${eventModal.data.id}`;
      
      const method = eventModal.mode === 'add' ? 'POST' : 'PUT';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventForm)
      });

      if (response.ok) {
        showToast(`Event berhasil ${eventModal.mode === 'add' ? 'dibuat' : 'diperbarui'}!`);
        fetchData();
        setEventModal({ show: false, mode: 'add', data: null });
        setEventForm({ 
          name: '', date: '', po_deadline: '', status: 'ongoing', 
          type: 'standard', location: '', time: '', lineup: ['GROUP'],
          theme: '', available_members: ['GROUP'], 
          special_solo_price: 30000, special_group_price: 35000, group_enabled: true
        });
      }
    } catch (err) {
      showToast("Gagal memproses data event", "error");
    } finally {
      setIsSavingEvent(false);
    }
  };

  const openEventModal = (mode = 'add', data = null) => {
    setEventModal({ show: true, mode, data });
    setModalTab('info');
    if (data) {
      setEventForm({
        name: data.name,
        date: data.event_date || '',
        po_deadline: data.po_deadline || '',
        status: data.status,
        type: data.type === 'regular' ? 'standard' : 'special',
        location: data.location || '',
        time: data.event_time || '',
        lineup: data.lineup || ['GROUP'],
        theme: data.theme || '',
        available_members: data.available_members || ['GROUP'],
        special_solo_price: data.special_prices?.solo || 30000,
        special_group_price: data.special_prices?.group || 35000,
        group_enabled: true
      });
      // Scroll to form
      formRef.current?.scrollIntoView({ behavior: 'smooth' });
    } else {
       setEventForm({ 
          name: '', date: '', po_deadline: '', status: 'ongoing', 
          type: 'standard', location: '', time: '', lineup: ['GROUP'],
          theme: '', available_members: ['GROUP'], 
          special_solo_price: 30000, special_group_price: 35000, group_enabled: true
       });
    }
  };

  const deleteEvent = async (id) => {
    setConfirmModal({
      show: true,
      title: 'Hapus Event',
      message: 'PERINGATAN: Apakah Anda yakin ingin menghapus event ini? Sebelum menghapus, pastikan Anda sudah melakukan Export ke PDF/Spreadsheet. Event yang sudah selesai otomatis dihapus setelah 67 hari oleh sistem.',
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, show: false }));
        setDeletingId(id);
        try {
          const res = await fetch(`${ADMIN_API}/orders/events/${id}`, {
            method: 'DELETE'
          });
          if (res.ok) {
            showToast("Event berhasil dihapus");
            fetchData();
          } else {
            showToast("Gagal menghapus event", "error");
          }
        } catch (err) {
          showToast("Terjadi kesalahan sistem", "error");
        } finally {
          setDeletingId(null);
        }
      }
    });
  };

  const handleEditOTSSubmit = async (e) => {
    e.preventDefault();
    if (!editingOTS) return;
    
    setIsUpdatingOTS(true);
    try {
      const res = await fetch(`${ADMIN_API}/orders/${editingOTS.id}/details`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nickname: editingOTS.nickname,
          contact: editingOTS.contact,
          items: editingOTS.items,
          payment_method: editingOTS.payment_method,
          note: editingOTS.note,
          event_id: editingOTS.event_id
        })
      });

      if (res.ok) {
        showToast("Data pesanan berhasil diperbarui!");
        setShowEditOTSModal(false);
        setEditingOTS(null);
        fetchData();
      } else {
        showToast("Gagal memperbarui pesanan", "error");
      }
    } catch (err) {
      showToast("Terjadi kesalahan sistem", "error");
    } finally {
      setIsUpdatingOTS(false);
    }
  };

  const exportData = async (type, eventId) => {
    setIsExporting(type);
    try {
      window.open(`${ADMIN_API}/orders/export/${type}/${eventId}`, '_blank');
       await new Promise(r => setTimeout(r, 1000));
    } finally {
       setIsExporting(null);
    }
  };

  // Merge all orders into one unified list for the archive
  const allMergedOrders = [...orders].sort(
    (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)
  );
  const otsOrders = orders.filter(o => o.mode === 'ots').reverse();
  const onlineOrders = orders.filter(o => o.mode !== 'ots').reverse();

  const filterList = (list) => list.filter(order => {
    const matchesStatus = filter.status === 'all' || order.status === filter.status;
    const matchesEvent = filter.event === 'all' || (order.event_id && order.event_id == filter.event);

    const matchesSearch = !filter.search ||
      order.nickname?.toLowerCase().includes(filter.search.toLowerCase()) ||
      order.id.toString().includes(filter.search) ||
      (order.public_code && order.public_code.toLowerCase().includes(filter.search.toLowerCase()));
    return matchesStatus && matchesEvent && matchesSearch;
  });

  if (loading) {
     return (
       <div className="min-h-screen bg-[#0A0A0B] flex flex-col items-center justify-center font-inter">
          <div className="relative">
             <div className="w-16 h-16 border-4 border-white/5 border-t-vibrant-pink rounded-full animate-spin"></div>
             <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 bg-vibrant-pink/10 rounded-full blur-xl animate-pulse"></div>
             </div>
          </div>
          <h1 className="mt-8 text-xl font-black tracking-tight italic animate-pulse">
             VIEOS<span className="text-vibrant-pink">.ADMIN</span>
          </h1>
          <div className="mt-4 flex flex-col items-center gap-2">
             <div className="h-1 w-48 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-vibrant-pink animate-progress-loading"></div>
             </div>
             <p className="text-[10px] uppercase font-bold tracking-[0.4em] text-white/30">
                Synchronizing Database
             </p>
          </div>
          <style>{`
             @keyframes progress-loading {
                0% { width: 0%; transform: translateX(-100%); }
                50% { width: 50%; transform: translateX(0%); }
                100% { width: 0%; transform: translateX(200%); }
             }
             .animate-progress-loading {
                animation: progress-loading 2s infinite ease-in-out;
             }
          `}</style>
       </div>
     );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white flex relative overflow-x-hidden font-inter">
      
      {/* Mobile Menu Button - Responsive */}
      <button 
        onClick={() => setMobileMenuOpen(true)}
        className="lg:hidden fixed bottom-6 right-6 z-[200] w-14 h-14 bg-vibrant-pink rounded-full flex items-center justify-center shadow-lg shadow-vibrant-pink/40 border border-white/20 active:scale-90 transition-all"
      >
        <Menu size={24} />
      </button>

      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <>
          <div 
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden fixed inset-0 bg-black/80 backdrop-blur-sm z-[250]"
          />
          <div
            className="lg:hidden fixed top-0 right-0 bottom-0 w-[280px] bg-[#0A0A0B] border-l border-white/10 z-[300] p-6 overflow-y-auto shadow-2xl"
          >
            <div className="flex justify-between items-center mb-10">
              <span className="text-xl font-bold tracking-tight">VIEOS<span className="text-vibrant-pink">.ADMIN</span></span>
              <button onClick={() => setMobileMenuOpen(false)}>
                <X size={24} className="text-white/40 hover:text-white" />
              </button>
            </div>
              <nav className="space-y-2">
                 {[
                   { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
                   { id: 'orders', icon: ShoppingBag, label: 'Pesanan' },
                   { id: 'cms', icon: Users, label: 'Manajemen Talent' },
                   { id: 'export', icon: FileSpreadsheet, label: 'Ekspor Data' },
                   { id: 'settings', icon: Settings, label: 'EVENT' },
                   { id: 'handbook', icon: FileText, label: 'Panduan Staff' },
                 ].map(item => (
                   <SidebarItem 
                     key={item.id} 
                     {...item} 
                     activeTab={activeTab} 
                     setActiveTab={setActiveTab}
                     setMobileMenuOpen={setMobileMenuOpen}
                   />
                 ))}
                  <div className="my-6 border-t border-white/5" />
                  <button 
                    onClick={handleLogout}
                    className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-white/30 hover:bg-white/[0.03] hover:text-white transition-all text-left"
                  >
                    <div className="p-2 rounded-xl bg-white/5 group-hover:bg-white/10"><LogOut size={18} /></div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Logout</span>
                  </button>
              </nav>
          </div>
        </>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-white/10 bg-[#0A0A0B] h-screen fixed top-0 left-0 p-6 z-50">
         <div className="mb-8">
            <h1 className="text-xl font-black tracking-tight italic">VIEOS<span className="text-vibrant-pink">.ADMIN</span></h1>
         </div>
            <div className="flex flex-col gap-1">
               <SidebarItem id="dashboard" icon={LayoutDashboard} label="Dashboard" activeTab={activeTab} setActiveTab={setActiveTab} setMobileMenuOpen={setMobileMenuOpen} />
               <SidebarItem id="orders" icon={ShoppingBag} label="Pesanan" activeTab={activeTab} setActiveTab={setActiveTab} setMobileMenuOpen={setMobileMenuOpen} />
               <SidebarItem id="cms" icon={Users} label="Manajemen Talent" activeTab={activeTab} setActiveTab={setActiveTab} setMobileMenuOpen={setMobileMenuOpen} />
               <SidebarItem id="export" icon={FileSpreadsheet} label="Ekspor Data" activeTab={activeTab} setActiveTab={setActiveTab} setMobileMenuOpen={setMobileMenuOpen} />
               <SidebarItem id="settings" icon={Settings} label="EVENT" activeTab={activeTab} setActiveTab={setActiveTab} setMobileMenuOpen={setMobileMenuOpen} />
               <SidebarItem id="handbook" icon={History} label="Panduan Staff" activeTab={activeTab} setActiveTab={setActiveTab} setMobileMenuOpen={setMobileMenuOpen} />
            </div>     
            <button 
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-white/40 hover:bg-white/5 hover:text-white transition-colors text-left"
            >
              <LogOut size={18} />
              <span className="text-xs uppercase tracking-wider">Logout</span>
            </button>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 lg:ml-64 min-w-0 p-4 md:p-8 lg:p-12 relative z-10">
            {activeTab === 'dashboard' && (
              <div className="space-y-8">
                 <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8">
                   <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>

                   <div className="flex items-center gap-4">
                      <VIEOSSelect 
                         value={filter.event}
                         onChange={val => setFilter(prev => ({...prev, event: val}))}
                         placeholder="Select Event"
                         className="min-w-[200px]"
                         options={[
                           { value: 'all', label: 'All Events' },
                           ...events.map((ev) => {
                             const { badge, badgeKind } = eventOptionBadge(ev);
                             return { value: ev.id, label: ev.name, badge, badgeKind };
                           })
                         ]}
                      />
                   </div>
                </div>

                {/* Scrapped Paper Stats Grid */}
                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { 
                      label: 'Total Penjualan', 
                      val: `Rp ${orders.filter(o => filter.event === 'all' || o.event_id == filter.event).reduce((acc, o) => acc + o.total_price, 0) / 1000}k`, 
                      icon: CreditCard
                    },
                    { 
                      label: 'Total Pesanan', 
                      val: orders.filter(o => filter.event === 'all' || o.event_id == filter.event).length, 
                      icon: ShoppingBag
                    },
                    { 
                      label: 'Pesanan OTS', 
                      val: otsOrders.filter(o => filter.event === 'all' || o.event_id == filter.event).length, 
                      icon: Send
                    },
                    { 
                      label: 'Pending PO', 
                      val: onlineOrders.filter(o => (filter.event === 'all' || o.event_id == filter.event) && o.status === 'pending').length, 
                      icon: Clock
                    }
                  ].map((stat, i) => (
                    <div key={i} className="bg-[#121214] border border-white/10 p-6 rounded-xl hover:border-vibrant-pink/30 hover:bg-white/[0.02] transition-all group">
                       <div className="flex items-center gap-4 mb-2">
                          <div className={`p-2 rounded-lg ${i === 0 ? 'bg-vibrant-pink/20 text-vibrant-pink' : i === 1 ? 'bg-purple-500/20 text-purple-400' : 'bg-white/5 text-white/60'} group-hover:scale-110 transition-transform`}>
                             <stat.icon size={20} />
                          </div>
                          <span className="text-xs uppercase text-white/40 font-semibold">{stat.label}</span>
                       </div>
                       <h3 className="text-2xl font-black italic tracking-tight">{stat.val}</h3>
                    </div>
                  ))}
                </div>

                {/* OTS Section */}
                <section className="bg-[#121214] border border-white/10 rounded-xl p-6 lg:p-8">
                  <div className="flex flex-col lg:flex-row gap-8">
                      {/* Left Quick Input */}
                      <div className="w-full lg:w-[350px] space-y-6">
                        <div>
                          <h3 className="text-lg font-bold uppercase tracking-tight">Input Pesanan Booth</h3>
                          <p className="text-xs text-white/30">Input data pesanan langsung di lokasi (OTS).</p>
                        </div>
  
                        <div className="space-y-4">
                          <div className="space-y-2">
                             <label className="text-xs uppercase text-white/40 font-semibold tracking-wider">Informasi Pelanggan</label>
                             <div className="flex gap-2">
                               <input 
                                 placeholder="Nama Panggilan" 
                                 value={otsForm.nickname}
                                 onChange={e => setOTSForm(prev => ({...prev, nickname: e.target.value}))}
                                 className="flex-1 bg-[#0A0A0B] border border-white/20 rounded-lg px-3 py-2 text-sm outline-none focus:border-white/50"
                               />
                               <input 
                                 placeholder="Kontak (Opsional)" 
                                 value={otsForm.contact}
                                 onChange={e => setOTSForm(prev => ({...prev, contact: e.target.value}))}
                                 className="w-1/3 bg-[#0A0A0B] border border-white/20 rounded-lg px-3 py-2 text-sm outline-none focus:border-white/50"
                               />
                             </div>
                          </div>
  
                          <div className="space-y-2">
                             <div className="flex justify-between items-end">
                                <label className="text-xs uppercase text-white/40 font-semibold tracking-wider">Pilih Member</label>
                                {Object.keys(otsForm.selectedMembers).length > 0 && (
                                  <button onClick={resetSelection} className="text-xs text-white/60 hover:text-white underline">Reset</button>
                                )}
                             </div>
                           <div className="grid grid-cols-4 gap-2">
                              {membersList.map(m => (
                                <button
                                  key={m.id}
                                  onClick={() => toggleMember(m.nickname)}
                                  onContextMenu={(e) => decrementMember(e, m.nickname)}
                                  className={`py-2 rounded-lg text-xs font-semibold transition-colors relative ${
                                    otsForm.selectedMembers[m.nickname] 
                                       ? "bg-white text-black" 
                                       : "bg-[#0A0A0B] border border-white/10 text-white/60 hover:bg-white/5 hover:text-white"
                                  }`}
                                  title="Klik kanan untuk mengurangi"
                                >
                                  {m.nickname}
                                  {otsForm.selectedMembers[m.nickname] && (
                                    <div className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center text-[9px] font-bold">
                                      {otsForm.selectedMembers[m.nickname]}
                                    </div>
                                  )}
                                </button>
                              ))}
                              <button
                                onClick={() => toggleMember('GROUP')}
                                onContextMenu={(e) => decrementMember(e, 'GROUP')}
                                className={`col-span-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors relative ${
                                  otsForm.selectedMembers['GROUP']
                                     ? 'bg-white text-black'
                                     : 'bg-[#0A0A0B] border border-white/10 text-white/60 hover:bg-white/5'
                                }`}
                              >
                                {otsForm.selectedMembers['GROUP'] && (
                                  <div className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center text-[9px] font-bold">
                                    {otsForm.selectedMembers['GROUP']}
                                  </div>
                                )}
                                GROUP
                              </button>
                           </div>
                        </div>

                         <div className="space-y-2">
                           <label className="text-xs uppercase text-white/40 font-semibold">Payment Method</label>
                           <div className="flex gap-2">
                              <button 
                                onClick={() => setOTSForm(prev => ({...prev, payment_method: 'qr'}))}
                                className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-wider border transition-colors ${otsForm.payment_method === 'qr' ? 'bg-white text-black border-white' : 'bg-transparent border-white/20 text-white/40 hover:text-white hover:border-white/40'}`}
                              >
                                 QR
                              </button>
                              <button 
                                onClick={() => setOTSForm(prev => ({...prev, payment_method: 'cash'}))}
                                className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-wider border transition-colors ${otsForm.payment_method === 'cash' ? 'bg-white text-black border-white' : 'bg-transparent border-white/20 text-white/40 hover:text-white hover:border-white/40'}`}
                              >
                                 CASH
                              </button>
                           </div>
                        </div>

                        {Object.keys(otsForm.selectedMembers).length > 0 && (
                          <div className="bg-[#0A0A0B] border border-white/10 rounded-lg p-3">
                            <p className="text-xs font-semibold text-white/40 mb-2 uppercase">Order Summary</p>
                            <div className="flex flex-wrap gap-2">
                               {Object.entries(otsForm.selectedMembers).map(([name, qty]) => (
                                 <div key={name} className="bg-white/10 px-2 py-1 rounded text-xs flex items-center gap-2">
                                    <span>{name}</span>
                                    <span className="font-bold text-white/60">x{qty}</span>
                                 </div>
                               ))}
                            </div>
                          </div>
                        )}

                        <button 
                          onClick={createOTSOrder}
                          disabled={isSavingOTS}
                          className={`w-full py-3 bg-gradient-to-r from-vibrant-pink to-purple-600 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-all shadow-lg shadow-vibrant-pink/20 flex items-center justify-center gap-2 ${isSavingOTS ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90 hover:scale-[1.02] active:scale-[0.98]'}`}
                        >
                          {isSavingOTS ? <LoadingSpinner size={16} /> : null}
                          {isSavingOTS ? 'Menyimpan...' : 'Simpan Pesanan'}
                        </button>
                      </div>
                    </div>

                    {/* Right: OTS Table */}
                    <div className="flex-1">
                      <div className="mb-4 flex items-center justify-between">
                         <h3 className="text-xs font-bold uppercase tracking-wider text-white/40">Penjualan Booth Terbaru</h3>
                         <div className="bg-[#0A0A0B] border border-white/10 rounded px-2 py-1 text-xs font-bold">
                            {otsOrders.length}
                         </div>
                      </div>

                       <div className="bg-[#0A0A0B] rounded-xl overflow-hidden border border-white/10">
                         <table className="w-full text-left">
                           <thead>
                             <tr className="bg-white/5 border-b border-white/5">
                               <th className="p-3 text-xs font-bold uppercase text-white/40">Nama</th>
                               <th className="p-3 text-xs font-bold uppercase text-white/40">Item</th>
                               <th className="p-3 text-xs font-bold uppercase text-white/40">Kontak</th>
                               <th className="p-3 text-xs font-bold uppercase text-white/40">Bayar</th>
                               <th className="p-3 text-xs font-bold uppercase text-white/40">Status</th>
                             </tr>
                           </thead>
                           <tbody className="divide-y divide-white/5">
                             {filterList(otsOrders).slice(0, 5).map((order) => (
                               <tr key={order.id} className="group hover:bg-white/5 transition-colors">
                                 <td className="p-3 text-xs font-semibold text-white/80">{order.nickname}</td>
                                 <td className="p-3 text-[10px] text-vibrant-pink font-bold uppercase tracking-tight">
                                    {order.items && order.items.length > 0 
                                       ? order.items.map(it => `${it.member_id} x${it.qty}`).join(', ') 
                                       : order.member_id || '-'}
                                 </td>
                                 <td className="p-3 text-xs text-white/40">{order.contact || '-'}</td>
                                 <td className="p-3">
                                   <span className="px-1.5 py-0.5 rounded border border-white/10 text-[10px] font-bold uppercase text-white/60">
                                     {order.payment_method || 'CASH'}
                                   </span>
                                 </td>
                                 <td className="p-3">
                                    <div className="flex items-center gap-2">
                                       <VIEOSSelect 
                                          value={order.status}
                                          onChange={val => updateStatus(order.id, val)}
                                          className="text-xs min-w-[7rem]"
                                          options={[
                                            { value: 'paid', label: 'Sudah bayar' },
                                            { value: 'done', label: 'Selesai' }
                                          ]}
                                       />
                                       <button 
                                          onClick={() => {
                                             setEditingOTS({...order});
                                             setShowEditOTSModal(true);
                                          }}
                                          className="p-1.5 bg-white/5 rounded-lg text-white/40 hover:bg-vibrant-pink/20 hover:text-vibrant-pink transition-all"
                                          title="Edit Order"
                                       >
                                          <Pencil size={14} />
                                       </button>
                                    </div>
                                 </td>
                               </tr>
                             ))}
                           </tbody>
                         </table>
                         {filterList(otsOrders).length === 0 && (
                          <div className="py-8 text-center">
                            <p className="text-xs text-white/20 uppercase tracking-wider">No Sales.</p>
                          </div>
                        )}
                       </div>
                    </div>
                  </div>
                </section>

                {/* Recent Online Orders (PO) Section */}
                <section className="bg-[#121214] border border-white/10 rounded-xl p-6 lg:p-8 relative overflow-hidden group hover:border-vibrant-pink/30 transition-all">
                   <div className="flex items-center justify-between mb-6">
                      <div>
                         <h3 className="text-lg font-black italic tracking-tight">Pesanan <span className="text-vibrant-pink">Online Terbaru</span></h3>
                         <p className="text-xs text-white/40 uppercase tracking-widest">Pre-Order & Penjualan Online</p>
                      </div>
                      <button 
                        onClick={() => setActiveTab('orders')}
                        className="px-4 py-2 rounded-lg bg-white/5 text-xs font-bold uppercase tracking-wider hover:bg-white/10 hover:text-white transition-colors"
                      >
                        Lihat Semua
                      </button>
                   </div>

                    <div className="overflow-x-auto">
                       <table className="w-full text-left border-collapse">
                          <thead>
                             <tr className="border-b border-white/10">
                                <th className="p-4 text-xs font-bold uppercase text-white/40">ID</th>
                                <th className="p-4 text-xs font-bold uppercase text-white/40">Pelanggan</th>
                                <th className="p-4 text-xs font-bold uppercase text-white/40">Item</th>
                                <th className="p-4 text-xs font-bold uppercase text-white/40">Catatan PO</th>
                                <th className="p-4 text-xs font-bold uppercase text-white/40">Total</th>
                                <th className="p-4 text-xs font-bold uppercase text-white/40">Bukti</th>
                                <th className="p-4 text-xs font-bold uppercase text-white/40">Status</th>
                             </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5">
                             {filterList(onlineOrders).slice(0, 5).map((order) => (
                                <tr key={order.id} className="group hover:bg-white/[0.02] transition-colors">
                                   <td className="p-4 text-[10px] font-mono text-white/40">{order.public_code || `#${order.id}`}</td>
                                   <td className="p-4 text-sm font-bold text-white/90">{order.nickname}</td>
                                   <td className="p-4 text-xs text-white/60">
                                      {order.items && order.items.length > 0 
                                         ? order.items.map(it => `${it.member_id} x${it.qty}`).join(', ')
                                         : `${order.qty}x ${order.cheki_type}`}
                                   </td>
                                   <td className="p-4 text-xs text-white/60 italic">
                                      {order.note || '-'}
                                   </td>
                                   <td className="p-4 text-xs font-bold text-vibrant-pink">Rp {order.total_price.toLocaleString()}</td>
                                    <td className="p-4">
                                       {order.payment_proof_url ? (
                                          <button 
                                            onClick={() => {
                                              setSelectedOrder(order);
                                              setShowProofOnly(true);
                                            }}
                                            className="flex items-center gap-2 text-green-500 hover:text-green-400 text-[10px] font-bold uppercase tracking-wider transition-colors"
                                          >
                                             <Image size={14} /> Lihat
                                          </button>
                                       ) : (
                                          <div className="text-white/20 text-[10px] font-bold uppercase tracking-wider">-</div>
                                       )}
                                    </td>
                                     <td className="p-4">
                                        <VIEOSSelect 
                                           value={order.status}
                                           onChange={val => updateStatus(order.id, val)}
                                           className="min-w-[10rem]"
                                           options={[
                                             { value: 'pending', label: 'Belum dicek' },
                                             { value: 'paid', label: 'Sudah bayar' },
                                             { value: 'done', label: 'Selesai' }
                                           ]}
                                        />
                                     </td>
                                </tr>
                             ))}
                          </tbody>
                       </table>
                       {filterList(onlineOrders).length === 0 && (
                          <div className="py-12 text-center border-t border-white/5">
                             <p className="text-xs text-white/20 uppercase tracking-widest font-bold">Tidak ada pesanan online.</p>
                          </div>
                       )}
                    </div>
                </section>
              </div>
            )}
            
            {activeTab === 'orders' && (
              <div className="space-y-6">
                  <div className="flex flex-col md:flex-row items-end justify-between mb-6 gap-4">
                     <h2 className="text-2xl font-bold uppercase tracking-tight">Arsip Pesanan</h2>

                    <div className="flex gap-4 w-full md:w-auto items-center">
                       <VIEOSSelect 
                         value={filter.event}
                         onChange={val => setFilter(prev => ({...prev, event: val}))}
                         placeholder="Semua Event"
                         className="w-full md:w-48"
                         options={[
                           { value: 'all', label: 'Semua Event' },
                           ...events.map(ev => ({
                             value: ev.id.toString(),
                             label: ev.name
                           }))
                         ]}
                       />
                       <div className="bg-[#121214] border border-white/10 rounded-lg px-2 py-1 flex items-center justify-center gap-2">
                          <span className="text-xs text-white/40 hidden md:inline">Active:</span>
                          <span className="text-xs font-bold bg-white text-black px-1.5 py-0.5 rounded">
                            {onlineOrders.length}
                          </span>
                       </div>
                       
                        <div className="relative w-full md:w-64">
                           <Search className="absolute left-3 top-1/2 -translate-y-1/2 opacity-30" size={14} />
                           <input 
                             placeholder="Cari pesanan..." 
                             value={filter.search}
                             onChange={e => setFilter(prev => ({...prev, search: e.target.value}))}
                             className="w-full bg-[#121214] border border-white/10 rounded-lg py-2 pl-9 pr-4 text-sm outline-none focus:border-vibrant-pink/50 transition-colors"
                           />
                        </div>
                       
                       {(filter.status !== 'all' || filter.event !== 'all' || filter.search) && (
                         <button 
                           onClick={() => setFilter({ status: 'all', event: 'all', search: '' })}
                           className="p-2 bg-white/5 rounded-lg text-white/40 hover:bg-red-500/20 hover:text-red-500 transition-colors"
                           title="Clear Filters"
                         >
                           <X size={16} />
                         </button>
                       )}
                    </div>
                 </div>

                   {/* SECTION: OTS */}
                   <div className="mb-4 flex items-center justify-between">
                     <h3 className="text-lg font-bold uppercase tracking-tight text-white/80 border-b-2 border-purple-500/50 pb-1">On The Spot (OTS)</h3>
                     <span className="text-xs font-bold bg-purple-600/20 text-purple-400 px-2 py-1 rounded">
                       {filterList(allMergedOrders).filter(o => o.mode === 'ots').length} Pesanan
                     </span>
                   </div>
                   <div className="bg-[#121214] border border-white/10 rounded-xl overflow-hidden mb-8">
                      <div className="overflow-x-auto">
                         <table className="w-full text-left border-collapse">
                            <thead>
                               <tr className="bg-white/5 border-b border-white/10 text-white/40 uppercase text-[10px] font-bold tracking-widest">
                                  <th className="p-4 w-20">ID</th>
                                  <th className="p-4">Nama</th>
                                  <th className="p-4">Item</th>
                                  <th className="p-4">Total</th>
                                  <th className="p-4">Status</th>
                               </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                               {filterList(allMergedOrders).filter(order => order.mode === 'ots').map((order) => (
                                  <tr key={order.id} className="group hover:bg-white/5 transition-colors">
                                     <td className="p-4 text-[10px] font-mono text-white/30">{order.public_code || `#${order.id}`}</td>
                                     <td className="p-4 text-sm font-bold text-white/90">{order.nickname}</td>
                                     <td className="p-4 text-[10px] text-white/60 font-medium">
                                        {order.items && order.items.length > 0 
                                           ? order.items.map(it => `${it.member_id} x${it.qty}`).join(', ') 
                                           : order.member_id || '-'}
                                     </td>
                                     <td className="p-4 text-[10px] font-black text-vibrant-pink">Rp {order.total_price.toLocaleString()}</td>
                                      <td className="p-4">
                                        <VIEOSSelect 
                                           value={order.status}
                                           onChange={val => updateStatus(order.id, val)}
                                           className="min-w-[10rem]"
                                           options={[
                                             { value: 'pending', label: 'Belum dicek' },
                                             { value: 'paid', label: 'Sudah bayar' },
                                             { value: 'done', label: 'Selesai' }
                                           ]}
                                        />
                                      </td>
                                  </tr>
                               ))}
                            </tbody>
                         </table>
                         {filterList(allMergedOrders).filter(o => o.mode === 'ots').length === 0 && (
                            <div className="py-12 text-center">
                               <p className="text-xs text-white/20 uppercase tracking-widest font-black">Data OTS tidak ditemukan.</p>
                            </div>
                         )}
                      </div>
                   </div>

                   {/* SECTION: PRE-ORDER */}
                   <div className="mb-4 flex items-center justify-between">
                     <h3 className="text-lg font-bold uppercase tracking-tight text-white/80 border-b-2 border-vibrant-pink/50 pb-1">Pre-Order (PO)</h3>
                     <span className="text-xs font-bold bg-vibrant-pink/20 text-vibrant-pink px-2 py-1 rounded">
                       {filterList(allMergedOrders).filter(o => o.mode !== 'ots').length} Pesanan
                     </span>
                   </div>
                   <div className="bg-[#121214] border border-white/10 rounded-xl overflow-hidden">
                      <div className="overflow-x-auto">
                         <table className="w-full text-left border-collapse">
                            <thead>
                               <tr className="bg-white/5 border-b border-white/10 text-white/40 uppercase text-[10px] font-bold tracking-widest">
                                  <th className="p-4 w-20">ID</th>
                                  <th className="p-4">Nama</th>
                                  <th className="p-4 w-1/3">Item</th>
                                  <th className="p-4">Catatan PO</th>
                                  <th className="p-4">Total</th>
                                  <th className="p-4">Status</th>
                               </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                               {filterList(allMergedOrders).filter(order => order.mode !== 'ots').map((order) => (
                                  <tr key={order.id} className="group hover:bg-white/5 transition-colors">
                                     <td className="p-4 text-[10px] font-mono text-white/30">{order.public_code || `#${order.id}`}</td>
                                     <td className="p-4 text-sm font-bold text-white/90">{order.nickname}</td>
                                     <td className="p-4 text-[10px] text-white/60 font-medium">
                                        {order.items && order.items.length > 0 
                                           ? order.items.map(it => `${it.member_id} x${it.qty}`).join(', ') 
                                           : order.member_id || '-'}
                                     </td>
                                     <td className="p-4 text-[10px] text-white/60 italic">
                                        {order.note ? order.note : '-'}
                                     </td>
                                     <td className="p-4 text-[10px] font-black text-vibrant-pink">Rp {order.total_price.toLocaleString()}</td>
                                      <td className="p-4">
                                        <VIEOSSelect 
                                           value={order.status}
                                           onChange={val => updateStatus(order.id, val)}
                                           className="min-w-[10rem]"
                                           options={[
                                             { value: 'pending', label: 'Belum dicek' },
                                             { value: 'paid', label: 'Sudah bayar' },
                                             { value: 'done', label: 'Selesai' }
                                           ]}
                                        />
                                      </td>
                                  </tr>
                               ))}
                            </tbody>
                         </table>
                         {filterList(allMergedOrders).filter(o => o.mode !== 'ots').length === 0 && (
                            <div className="py-12 text-center">
                               <p className="text-xs text-white/20 uppercase tracking-widest font-black">Data PO tidak ditemukan.</p>
                            </div>
                         )}
                      </div>
                   </div>
               </div>
             )}

            {activeTab === 'cms' && (
              <div className="space-y-6">
                 <div>
                    <h2 className="text-2xl font-bold uppercase tracking-tight">Manajemen Talent</h2>
                    <p className="text-xs text-white/40 uppercase tracking-widest mt-1">Data member (read only)</p>
                 </div>

                 <div className="bg-[#121214] border border-white/10 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                       <AlertCircle size={16} className="text-yellow-400 mt-0.5" />
                       <div>
                          <p className="text-xs font-bold uppercase tracking-wider text-white">Edit Member Dinonaktifkan</p>
                          <p className="text-[11px] text-white/50 mt-1 leading-relaxed">
                             Tambah, ubah, hapus member dan pengaturan foto dilakukan langsung dari database.
                          </p>
                       </div>
                    </div>
                 </div>

                 <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {membersList.map(member => (
                       <div key={member.id} className="bg-[#121214] border border-white/10 rounded-xl overflow-hidden transition-colors hover:border-white/20 flex flex-col animate-in fade-in zoom-in-95 duration-300">
                          <div className="aspect-square bg-black/20 relative">
                                           <img
                                              src={getMemberImageSrc(member)}
                                              alt={member.nickname}
                                              onError={(event) => {
                                                 event.currentTarget.onerror = null;
                                                 event.currentTarget.src = getMemberFallbackImage(member);
                                              }}
                                              className="w-full h-full object-cover grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all duration-500"
                                           />
                             <div className="absolute inset-0 bg-gradient-to-t from-[#121214] via-transparent to-transparent" />
                          </div>
                          <div className="p-4 border-t-2" style={{ borderColor: member.theme_color || member.themeColor }}>
                             <h4 className="text-lg font-black uppercase tracking-tight">{member.nickname}</h4>
                             <p className="text-[9px] font-bold uppercase tracking-widest text-white/40">
                                {member.role && member.role !== "Member"
                                   ? member.role
                                   : (member.fullname || member.name || "").includes(',')
                                      ? (member.fullname || member.name).split(',')[1].trim()
                                      : (member.role || "Member")}
                             </p>
                          </div>
                       </div>
                    ))}

                    {membersList.length === 0 && (
                       <div className="col-span-full text-center py-12 bg-[#121214] border border-white/10 rounded-xl">
                          <p className="text-xs text-white/30 uppercase tracking-widest">Belum ada data member di database.</p>
                       </div>
                    )}
                 </div>
              </div>
            )}

            {activeTab === 'export' && (
              <div className="max-w-4xl space-y-8">
                <div className="border-l-4 border-white pb-2 pl-4">
                  <h2 className="text-2xl font-bold uppercase mb-1">Ekspor Laporan</h2>
                  <p className="text-xs text-white/40 uppercase tracking-widest">Buat laporan resmi</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Excel Card */}
                  <div className="bg-[#121214] border border-white/10 p-6 rounded-xl hover:bg-white/5 transition-colors">
                     <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center text-green-500 mb-4">
                        <FileSpreadsheet size={20} />
                     </div>
                     <h3 className="text-lg font-bold mb-1 uppercase tracking-tight">Laporan Excel</h3>
                     <p className="text-xs text-white/30 mb-6">Ekspor data lengkap ke format Excel (.xlsx)</p>
                     
                     <div className="space-y-4">
                       <VIEOSSelect 
                          value={filter.event}
                          onChange={val => setFilter(prev => ({...prev, event: val}))}
                          placeholder="Pilih Event"
                          className="w-full"
                          options={[
                            { value: 'all', label: 'Semua Event' },
                            ...events.map((ev) => {
                              const { badge, badgeKind } = eventOptionBadge(ev);
                              return { value: ev.id, label: ev.name, badge, badgeKind };
                            })
                          ]}
                       />
                        <button 
                            disabled={isExporting === 'excel'}
                            onClick={() => exportData('excel', filter.event)}
                            className={`w-full py-3 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-colors shadow-lg ${isExporting === 'excel' ? 'bg-green-800 cursor-not-allowed opacity-50' : 'bg-green-600 hover:bg-green-500 shadow-green-900/20'}`}
                         >
                            {isExporting === 'excel' ? 'Mengunduh...' : 'Unduh Excel'}
                         </button>
                     </div>
                  </div>

                  {/* PDF Card */}
                  <div className="bg-[#121214] border border-white/10 p-6 rounded-xl hover:bg-white/5 transition-colors">
                     <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center text-red-500 mb-4">
                        <FileText size={20} />
                     </div>
                     <h3 className="text-lg font-bold mb-1 uppercase tracking-tight">Dokumen PDF</h3>
                     <p className="text-xs text-white/30 mb-6">Ringkasan pesanan siap cetak (.pdf)</p>
                     
                     <div className="space-y-4">
                       <VIEOSSelect 
                          value={filter.event}
                          onChange={val => setFilter(prev => ({...prev, event: val}))}
                          placeholder="Pilih Event"
                          className="w-full"
                          options={[
                            { value: 'all', label: 'Semua Event' },
                            ...events.map((ev) => {
                              const { badge, badgeKind } = eventOptionBadge(ev);
                              return { value: ev.id, label: ev.name, badge, badgeKind };
                            })
                          ]}
                       />
                        <button 
                            disabled={isExporting === 'pdf'}
                            onClick={() => exportData('pdf', filter.event)}
                            className={`w-full py-3 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${isExporting === 'pdf' ? 'bg-red-800 cursor-not-allowed opacity-50' : 'bg-red-600 hover:bg-red-500'}`}
                         >
                           {isExporting === 'pdf' ? 'Mengunduh...' : 'Unduh PDF'}
                         </button>
                     </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="space-y-8">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                     {/* Left: Event Form (Main Config) */}
                     <div ref={formRef}>
                        <div className="bg-[#121214] border border-white/10 rounded-xl overflow-hidden shadow-2xl relative h-full">
                           <div className="p-6 border-b border-white/10 bg-white/[0.02]">
                              <h3 className="text-lg font-bold uppercase tracking-tight">Konfigurasi Event</h3>
                              <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Buat atau perbarui detail event</p>
                           </div>

                           <div className="p-6 space-y-4">
                              <div className="space-y-4">
                                 <div className="space-y-2">
                                    <label className="text-xs font-bold text-vibrant-pink uppercase ml-1">Jenis Event</label>
                                    <div className="flex bg-[#0A0A0B] rounded-lg p-1 border border-white/20">
                                       <button 
                                          onClick={() => setEventForm(prev => ({...prev, type: 'standard'}))}
                                          className={`flex-1 py-2.5 rounded text-xs font-bold uppercase tracking-wider transition-all ${eventForm.type === 'standard' ? 'bg-vibrant-pink text-white shadow-lg shadow-vibrant-pink/20' : 'text-white/40 hover:text-white'}`}
                                       >
                                          Standar
                                       </button>
                                       <button 
                                          onClick={() => setEventForm(prev => ({...prev, type: 'special'}))}
                                          className={`flex-1 py-2.5 rounded text-xs font-bold uppercase tracking-wider transition-all ${eventForm.type === 'special' ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20' : 'text-white/40 hover:text-white'}`}
                                       >
                                          Spesial
                                       </button>
                                    </div>
                                 </div>

                                 <div className="space-y-2">
                                    <label className="text-xs font-bold text-vibrant-pink uppercase ml-1">Nama Event</label>
                                    <input 
                                      value={eventForm.name}
                                      onChange={e => setEventForm(prev => ({...prev, name: e.target.value}))}
                                      placeholder="e.g. Memoire Release Party"
                                      className="w-full bg-[#0A0A0B] border border-white/20 rounded-lg px-3 py-3 text-sm outline-none focus:border-vibrant-pink/50 transition-colors"
                                    />
                                 </div>

                                 {/* Date & PO Deadline - Aligned */}
                                 <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                       <label className="text-xs font-bold text-vibrant-pink uppercase ml-1">Tanggal</label>
                                       <DatePicker 
                                          value={eventForm.date}
                                          onChange={val => setEventForm(prev => ({...prev, date: val}))}
                                       />
                                    </div>
                                    <div className="space-y-2">
                                       <label className="text-xs font-bold text-vibrant-pink uppercase ml-1">Batas PO</label>
                                       <DatePicker 
                                          value={eventForm.po_deadline}
                                          onChange={val => setEventForm(prev => ({...prev, po_deadline: val}))}
                                          align="right"
                                       />
                                    </div>
                                 </div>

                                 <div className="space-y-2">
                                    <label className="text-xs font-bold text-vibrant-pink uppercase ml-1">Status</label>
                                    <div className="flex bg-[#0A0A0B] rounded-lg p-1 border border-white/20">
                                       <button 
                                          onClick={() => setEventForm(prev => ({...prev, status: 'ongoing'}))}
                                          className={`flex-1 py-2 rounded text-xs font-bold uppercase tracking-wider transition-all ${eventForm.status === 'ongoing' ? 'bg-green-600 text-white shadow-lg' : 'text-white/40 hover:text-white'}`}
                                       >
                                          Berjalan
                                       </button>
                                       <button 
                                          onClick={() => setEventForm(prev => ({...prev, status: 'done'}))}
                                          className={`flex-1 py-2 rounded text-xs font-bold uppercase tracking-wider transition-all ${eventForm.status === 'done' ? 'bg-white/20 text-white' : 'text-white/40 hover:text-white'}`}
                                       >
                                          Selesai
                                       </button>
                                    </div>
                                 </div>

                              </div>

                              {/* Theme (Special Only) */}
                              {eventForm.type === 'special' && (
                                 <div className="space-y-2 pt-2">
                                    <label className="text-xs font-bold text-purple-400 uppercase ml-1">Tema / Konsep</label>
                                    <input 
                                       value={eventForm.theme}
                                       onChange={e => setEventForm(prev => ({...prev, theme: e.target.value}))}
                                       placeholder="Contoh: Valentine Special Edition"
                                       className="w-full bg-[#0A0A0B] border border-purple-500/20 rounded-lg px-3 py-3 text-sm outline-none focus:border-purple-500/50 transition-colors text-purple-300 placeholder:text-purple-400/20"
                                    />
                                 </div>
                              )}

                              {/* Special Event Pricing (Left Column) */}
                              {eventForm.type === 'special' && (
                                 <div className="space-y-4 pt-2 border-t border-white/5 mt-2">
                                    <div className="p-3 bg-[#121214] border border-white/10 rounded-xl relative overflow-hidden">
                                       <div className="absolute top-0 right-0 p-2 opacity-10">
                                          <CreditCard className="text-vibrant-pink" size={48} />
                                       </div>
                                       <h3 className="text-xs font-bold uppercase tracking-wider text-vibrant-pink mb-3 relative z-10">Harga Khusus</h3>
                                       <div className="grid grid-cols-2 gap-4 relative z-10">
                                          <div className="space-y-2">
                                             <label className="text-[10px] font-bold text-white/40 uppercase ml-1">Solo</label>
                                             <div className="relative">
                                                <PriceInput 
                                                   value={eventForm.special_solo_price}
                                                   onChange={val => setEventForm(prev => ({...prev, special_solo_price: val}))}
                                                   className="text-right pr-2 bg-[#0A0A0B] border border-white/20 rounded-lg px-3 py-2 text-sm"
                                                   colorClass="text-vibrant-pink font-bold"
                                                />
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-white/20 pointer-events-none">Rp</span>
                                             </div>
                                          </div>
                                          <div className="space-y-2">
                                             <label className="text-[10px] font-bold text-white/40 uppercase ml-1">Group</label>
                                             <div className="relative">
                                                <PriceInput 
                                                   value={eventForm.special_group_price}
                                                   onChange={val => setEventForm(prev => ({...prev, special_group_price: val}))}
                                                   className="text-right pr-2 bg-[#0A0A0B] border border-white/20 rounded-lg px-3 py-2 text-sm"
                                                   colorClass="text-vibrant-pink font-bold"
                                                />
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-white/20 pointer-events-none">Rp</span>
                                             </div>
                                          </div>
                                       </div>
                                    </div>
                                 </div>
                              )}

                              {/* Member Lineup (For ALL Event Types) */}
                              <div className="space-y-2 pt-2">
                                 <div className="flex justify-between items-end">
                                    <label className="text-xs font-bold text-vibrant-pink uppercase ml-1">Daftar Member</label>
                                    <button 
                                       onClick={() => setEventForm(prev => ({...prev, available_members: ['GROUP', ...membersList.map(m => m.nickname)]}))}
                                       className="text-[10px] uppercase font-bold text-white/40 hover:text-white transition-colors"
                                    >
                                       Pilih Semua
                                    </button>
                                 </div>
                                 <div className="grid grid-cols-4 gap-2 bg-[#0A0A0B] p-2 rounded-lg border border-white/10">
                                    {membersList.map(m => (
                                       <button
                                          key={m.id}
                                          onClick={() => {
                                             const isSelected = eventForm.available_members.includes(m.nickname);
                                             setEventForm(prev => ({
                                                ...prev,
                                                available_members: isSelected 
                                                   ? prev.available_members.filter(nm => nm !== m.nickname)
                                                   : [...prev.available_members, m.nickname]
                                             }));
                                          }}
                                          className={`py-1.5 rounded text-[10px] font-bold uppercase transition-all ${
                                             eventForm.available_members.includes(m.nickname)
                                                ? 'bg-vibrant-pink text-white shadow-lg shadow-vibrant-pink/20'
                                                : 'bg-white/5 text-white/40 hover:bg-white/10'
                                          }`}
                                       >
                                          {m.nickname}
                                       </button>
                                    ))}
                                    <button
                                       onClick={() => {
                                          const isSelected = eventForm.available_members.includes('GROUP');
                                          setEventForm(prev => ({
                                             ...prev,
                                             available_members: isSelected 
                                                ? prev.available_members.filter(nm => nm !== 'GROUP')
                                                : [...prev.available_members, 'GROUP']
                                          }));
                                       }}
                                       className={`col-span-4 py-1.5 rounded text-[10px] font-bold uppercase transition-all ${
                                          eventForm.available_members.includes('GROUP')
                                             ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20'
                                             : 'bg-white/5 text-white/40 hover:bg-white/10'
                                       }`}
                                    >
                                       GROUP
                                    </button>
                                 </div>
                              </div>

                              <div className="flex gap-2 pt-4">
                                 {eventModal.mode === 'edit' && (
                                   <button 
                                     onClick={() => {
                                       setEventModal({ show: false, mode: 'add', data: null });
                                       setEventForm({ 
                                          name: '', date: '', po_deadline: '', status: 'ongoing', 
                                          type: 'standard', location: '', time: '', lineup: ['GROUP'],
                                          theme: '', available_members: ['GROUP'], 
                                          special_solo_price: 30000, special_group_price: 35000, group_enabled: true
                                       });
                                     }}
                                     className="px-4 py-3 bg-[#0A0A0B] border border-white/20 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-white/5 transition-colors"
                                   >
                                     Batal
                                   </button>
                                 )}
                                 <button
                                    onClick={handleEventSubmit}
                                    disabled={isSavingEvent}
                                    className={`flex-1 py-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all shadow-lg flex items-center justify-center gap-2 ${
                                      isSavingEvent 
                                        ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
                                        : eventModal.mode === 'add' 
                                          ? 'bg-gradient-to-r from-vibrant-pink to-purple-600 text-white hover:scale-[1.02] active:scale-[0.98] shadow-vibrant-pink/20'
                                          : 'bg-white text-black hover:bg-gray-200'
                                    }`}
                                  >
                                    {isSavingEvent ? <LoadingSpinner size={16} /> : null}
                                    {isSavingEvent ? 'Memproses...' : (eventModal.mode === 'add' ? 'Buat Event Baru' : 'Simpan Perubahan')}
                                  </button>
                              </div>
                           </div>
                        </div>
                     </div>

                     {/* Right Column: Pricing & History */}
                     <div className="flex flex-col gap-6">
                        {/* Pricing Configuration (Always Visible - Comparison Mode) */}
                        <div className={`bg-[#121214] border border-white/10 rounded-xl overflow-hidden animate-in fade-in slide-in-from-top-4 duration-500 ${eventForm.type === 'special' ? 'opacity-60 grayscale' : ''}`}>
                              <div className="p-4 border-b border-white/10 bg-white/[0.02] flex justify-between items-center">
                                 <h3 className="text-sm font-bold uppercase tracking-wider text-vibrant-pink">
                                    {eventForm.type === 'special' ? 'Tarif Standar (Perbandingan)' : 'Konfigurasi Harga'}
                                 </h3>
                                 {eventForm.type === 'special' && (
                                    <div className="px-2 py-0.5 rounded bg-white/10 border border-white/10 text-[10px] font-bold text-white/40 uppercase">
                                       Default
                                    </div>
                                 )}
                              </div>
                              <div className="p-4 grid grid-cols-2 gap-4">
                                 <div className="space-y-2">
                                    <label className="text-xs font-semibold text-white/40 ml-1">Solo Price</label>
                                     <div className="relative">
                                        <PriceInput 
                                           disabled={eventForm.type === 'special'}
                                           value={eventForm.type === 'special' ? globalSettings.prices.regular_cheki_solo : eventForm.special_solo_price}
                                           onChange={val => {
                                             if (eventForm.type !== 'special') {
                                               setEventForm(prev => ({...prev, special_solo_price: val}));
                                             }
                                             setGlobalSettings(prev => ({
                                               ...prev,
                                               prices: { ...prev.prices, regular_cheki_solo: val }
                                             }));
                                           }}
                                           className="text-right pr-2 bg-[#0A0A0B] border border-white/20 rounded-lg px-3 py-2 text-sm"
                                           colorClass="text-vibrant-pink font-bold"
                                        />
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-white/20 pointer-events-none">Rp</span>
                                     </div>
                                    <p className="text-[10px] text-white/20 text-right">
                                       {eventForm.type === 'special' 
                                          ? `Rp ${(globalSettings.prices.regular_cheki_solo || 0).toLocaleString('id-ID')}` 
                                          : (eventForm.special_solo_price ? `Rp ${(parseInt(eventForm.special_solo_price) || 0).toLocaleString('id-ID')}` : '-')
                                       }
                                    </p>
                                 </div>
                                 <div className="space-y-2">
                                    <label className="text-xs font-semibold text-white/40 ml-1">Group Price</label>
                                     <div className="relative">
                                        <PriceInput 
                                           disabled={eventForm.type === 'special'}
                                           value={eventForm.type === 'special' ? globalSettings.prices.regular_cheki_group : eventForm.special_group_price}
                                           onChange={val => {
                                             if (eventForm.type !== 'special') {
                                               setEventForm(prev => ({...prev, special_group_price: val}));
                                             }
                                             setGlobalSettings(prev => ({
                                               ...prev,
                                               prices: { ...prev.prices, regular_cheki_group: val }
                                             }));
                                           }}
                                           className="text-right pr-2 bg-[#0A0A0B] border border-white/20 rounded-lg px-3 py-2 text-sm"
                                           colorClass="text-vibrant-pink font-bold"
                                        />
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-white/20 pointer-events-none">Rp</span>
                                     </div>
                                    <p className="text-[10px] text-white/20 text-right">
                                       {eventForm.type === 'special' 
                                          ? `Rp ${(globalSettings.prices.regular_cheki_group || 0).toLocaleString('id-ID')}` 
                                          : (eventForm.special_group_price ? `Rp ${(parseInt(eventForm.special_group_price) || 0).toLocaleString('id-ID')}` : '-')
                                       }
                                    </p>
                                 </div>
                              </div>
                              <div className="px-4 pb-4">
                                 <button 
                                    onClick={updateGlobalSettings}
                                    disabled={isSavingGlobalSettings}
                                    className={`w-full py-3 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-all shadow-lg flex items-center justify-center gap-2 ${isSavingGlobalSettings ? 'bg-indigo-900/50 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-900/20'}`}
                                 >
                                    {isSavingGlobalSettings ? <LoadingSpinner size={16} /> : null}
                                    {isSavingGlobalSettings ? 'Menyimpan...' : 'Perbarui Harga Standar'}
                                 </button>
                              </div>
                           </div>

                        {/* Event History */}
                        <div className="flex-1 space-y-4">
                           <h3 className="text-xs font-bold uppercase tracking-wider text-white/40 ml-1">Riwayat Event</h3>
                           <div className="space-y-3">
                             {events.map((ev, i) => (
                               <div 
                                  key={ev.id} 
                                  className="bg-[#121214] border border-white/10 p-4 rounded-xl flex items-center justify-between hover:border-vibrant-pink/30 hover:bg-white/[0.02] transition-colors gap-4 group"
                               >
                                 <div className="flex items-center gap-4">
                                    <div>
                                       <h4 className="font-bold text-sm group-hover:text-vibrant-pink transition-colors">{ev.name}</h4>
                                       <div className="flex gap-2 text-xs font-mono text-white/40 mt-1 uppercase">
                                          <span>{ev.event_date || '-'}</span>
                                          <span>â€¢</span>
                                          <span className={ev.status === 'ongoing' ? 'text-vibrant-pink font-bold' : ''}>{ev.status}</span>
                                          {ev.type === 'special' && <span className="text-purple-400 font-bold">â€¢ SPECIAL</span>}
                                       </div>
                                    </div>
                                 </div>
                                 <div className="flex gap-2">
                                   <button 
                                     onClick={() => openEventModal('edit', ev)}
                                 className={`p-2 rounded-lg transition-colors ${eventModal.data?.id === ev.id ? 'bg-white text-black' : 'bg-white/5 text-white/40 hover:text-white'}`}
                               >
                                 <Settings size={16} />
                               </button>
                               <button 
                                 disabled={deletingId === ev.id}
                                 onClick={() => deleteEvent(ev.id)}
                                 className={`p-2 rounded-lg transition-colors ${deletingId === ev.id ? 'bg-white/5 text-white/20' : 'bg-white/5 text-white/40 hover:bg-red-500/10 hover:text-red-500'}`}
                               >
                                 {deletingId === ev.id ? <RefreshCcw size={14} className="animate-spin" /> : <Trash2 size={16} />}
                               </button>
                             </div>
                           </div>
                         ))}
                            {events.length === 0 && (
                              <div className="text-center py-12 bg-[#121214] border border-white/10 rounded-xl">
                                <p className="text-white/20 text-xs uppercase tracking-widest">Event tidak ditemukan</p>
                              </div>
                            )}
                           </div>
                           </div>
                        </div>
                     </div>
                  </div>
            )}

            {activeTab === "handbook" && (
               <div className="max-w-6xl mx-auto space-y-12 py-8">
                  <div className="text-center space-y-3 mb-12">
                     <h2 className="text-4xl font-black uppercase tracking-tighter">Panduan Operasional Staff</h2>
                     <p className="text-[10px] text-vibrant-pink font-bold uppercase tracking-[0.3em] inline-block border border-vibrant-pink/20 bg-vibrant-pink/5 px-4 py-1.5 rounded-full">Prosedur Standar VIEOS Admin</p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                     <div className="space-y-6">
                        <div className="bg-[#121214] border border-white/10 p-8 rounded-2xl">
                           <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
                              <span className="w-8 h-8 rounded-lg bg-vibrant-pink/20 text-vibrant-pink flex items-center justify-center text-sm">01</span>
                              CARA INPUT ORDER OTS
                           </h3>
                           <div className="space-y-6 relative z-10 text-xs text-white/60 leading-relaxed">
                              <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                                 <p className="font-bold text-white mb-2 uppercase text-[10px]">Langkah-langkah:</p>
                                 <ul className="list-disc ml-4 space-y-2">
                                    <li>Masuk ke Tab <b>Dashboard</b>.</li>
                                    <li>Isi <b>Nama Panggilan</b> dan <b>Kontak</b> fans (opsional).</li>
                                    <li>Klik pada tombol <b>Member</b> untuk menambah jumlah (Klik kanan untuk mengurangi).</li>
                                    <li>Pilih <b>Payment Method</b> (Cash / QR).</li>
                                    <li>Klik <b>Simpan Pesanan</b> setelah pembayaran diterima.</li>
                                    <li className="text-vibrant-pink font-bold">Jika salah input, gunakan tombol âœ ï¸  (Pensil) di tabel riwayat untuk merubah data.</li>
                                 </ul>
                              </div>
                           </div>
                        </div>

                        <div className="bg-[#121214] border border-white/10 p-8 rounded-2xl">
                           <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
                              <span className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center text-sm">02</span>
                              FUNGSI STATUS PESANAN
                           </h3>
                           <div className="space-y-4">
                              {[                                  { status: 'UNCEK (Pending)', desc: 'Pesanan online baru masuk, bukti bayar perlu diverifikasi di menu Pesanan.' },                                  { status: 'CHEKE (Paid)', desc: 'Pembayaran sudah dikonfirmasi. Staff bisa mulai memproses pesanan / antrian.' },                                  { status: 'DONE (Selesai)', desc: 'Barang/Polaroid sudah diserahkan ke fans. Data akan masuk ke rekap final.' }                               ].map((item, i) => (
                                 <div key={i} className="p-4 bg-white/5 rounded-xl border border-white/5">
                                    <h4 className="font-bold text-white mb-1 uppercase text-[10px]">{item.status}</h4>
                                    <p className="text-[10px] text-white/40 leading-relaxed">{item.desc}</p>
                                 </div>
                              ))}
                           </div>
                        </div>
                     </div>

                     <div className="space-y-6">
                        <div className="bg-[#121214] border border-white/10 p-8 rounded-2xl">
                           <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
                              <span className="w-8 h-8 rounded-lg bg-green-500/20 text-green-400 flex items-center justify-center text-sm">03</span>
                              EKSPORT DATA & LAPORAN
                           </h3>
                           <div className="space-y-4">
                              <p className="text-xs text-white/40 leading-relaxed">Menu <b>Ekspor Data</b> digunakan untuk mengunduh laporan penjualan dalam format <b>Excel</b> atau <b>PDF</b>.</p>
                              <div className="p-4 bg-white/5 rounded-xl border border-white/5 space-y-2">
                                 <p className="text-[10px] text-white/40 leading-relaxed"><span className="text-white font-bold">PDF:</span> Cocok untuk laporan cetak / bukti rekap harian ke manager.</p>
                                 <p className="text-[10px] text-white/40 leading-relaxed"><span className="text-white font-bold">EXCEL:</span> Digunakan jika ingin mengolah data angka atau pivot table.</p>
                              </div>
                           </div>
                        </div>

                        <div className="bg-[#121214] border border-white/10 p-8 rounded-2xl">
                           <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
                              <span className="w-8 h-8 rounded-lg bg-yellow-500/20 text-yellow-400 flex items-center justify-center text-sm">04</span>
                              EVENT & MANAJEMEN PESANAN
                           </h3>
                           <div className="space-y-4 relative z-10 text-xs text-white/60 leading-relaxed">
                              <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                                 <ul className="list-disc ml-4 space-y-2">
                                    <li><b>Filter Event:</b> Daftar pesanan bisa difilter berdasarkan event tertentu. Pilih event di dropdown sebelah fitur pencarian pada tab Pesanan.</li>
                                    <li><b>PO & OTS Terpisah:</b> Tabel pesanan telah dibagi dua bagian: OTS (pesanan langsung di booth) dan PO (pre-order) untuk mempermudah pengecekan.</li>
                                    <li><b>Catatan PO:</b> Kolom Catatan PO ditambahkan di tabel PO untuk melihat pesan khusus dari pembeli.</li>
                                    <li className="text-vibrant-pink font-bold"><b>Auto-Delete:</b> Event yang sudah berlalu akan terhapus otomatis setelah 67 hari oleh sistem.</li>
                                    <li className="text-vibrant-pink font-bold"><b>Export Sebelum Delete:</b> Selalu lakukan Export Excel/PDF sebelum menghapus event agar data penting tidak hilang.</li>
                                 </ul>
                              </div>
                           </div>
                        </div>

                        <div className="bg-gradient-to-br from-[#1A1A1D] to-[#121214] border border-white/10 p-8 rounded-2xl shadow-xl">
                           <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
                              <span className="w-8 h-8 rounded-lg bg-white/10 text-white flex items-center justify-center text-sm">05</span>
                              KONTAK DEVELOPER
                           </h3>
                           <div className="space-y-4">
                              <div className="group">
                                 <p className="text-[10px] text-white/40 uppercase mb-1 flex items-center justify-between">
                                    Web Developer / IT Support
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                 </p>
                                 <p className="text-sm font-bold text-white group-hover:text-vibrant-pink transition-colors">085765907580 (@ikifer)</p>
                              </div>
                              <div className="p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                                 <p className="text-[9px] text-red-500 italic leading-relaxed">Hubungi jika terjadi kendala sistem serius (Web lambat, eror simpan, atau database corrupt).</p>
                              </div>
                              <div className="pt-2 border-t border-white/5">
                                 <p className="text-[10px] text-white/40 italic">Pastikan device staff terkoneksi internet stabil sebelum memproses pesanan.</p>
                              </div>
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
            )}
      </main>

      {/* Modals */}

      {/* Edit OTS Modal */}
      {showEditOTSModal && editingOTS && (
          <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
               <div 
                  onClick={() => {
                    setShowEditOTSModal(false);
                    setEditingOTS(null);
                  }}
                  className="absolute inset-0 bg-black/80 backdrop-blur-sm"
               />
               <div className="relative bg-[#121214] border border-white/10 rounded-xl w-full max-w-md shadow-2xl z-10 flex flex-col max-h-[90vh] overflow-hidden">
                  <div className="p-5 border-b border-white/10 flex justify-between items-center bg-white/5">
                     <div>
                        <h3 className="text-lg font-bold">Edit Pesanan Booth</h3>
                        <p className="text-[10px] text-vibrant-pink font-bold uppercase tracking-widest">{editingOTS.public_code || `#${editingOTS.id}`}</p>
                     </div>
                     <button onClick={() => { setShowEditOTSModal(false); setEditingOTS(null); }} className="p-1.5 bg-white/5 rounded-full hover:bg-white/10 transition-colors">
                        <X size={14} />
                     </button>
                  </div>
                  
                  <form onSubmit={handleEditOTSSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
                     <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-white/40 ml-1">Informasi Pelanggan</label>
                        <div className="flex gap-2">
                           <input 
                              placeholder="Nama Panggilan" 
                              value={editingOTS.nickname || ''}
                              onChange={e => setEditingOTS(prev => ({...prev, nickname: e.target.value}))}
                              className="flex-1 bg-[#0A0A0B] border border-white/20 rounded-lg px-3 py-2 text-sm outline-none focus:border-white/50"
                              required
                           />
                           <input 
                              placeholder="Kontak" 
                              value={editingOTS.contact || ''}
                              onChange={e => setEditingOTS(prev => ({...prev, contact: e.target.value}))}
                              className="w-1/3 bg-[#0A0A0B] border border-white/20 rounded-lg px-3 py-2 text-sm outline-none focus:border-white/50"
                           />
                        </div>
                     </div>

                     <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-white/40 ml-1">Item Pesanan</label>
                        <div className="grid grid-cols-4 gap-2 bg-[#0A0A0B] p-2 rounded-lg border border-white/10">
                           {membersList.map(m => {
                              const qty = editingOTS.items?.find(it => it.member_id === m.nickname)?.qty || 0;
                              return (
                                 <button
                                    key={m.id}
                                    type="button"
                                    onClick={() => {
                                       const newItems = [...(editingOTS.items || [])];
                                       const idx = newItems.findIndex(it => it.member_id === m.nickname);
                                       if (idx >= 0) {
                                          newItems[idx].qty += 1;
                                       } else {
                                          newItems.push({ member_id: m.nickname, qty: 1, cheki_type: 'solo' });
                                       }
                                       setEditingOTS(prev => ({ ...prev, items: newItems }));
                                    }}
                                    onContextMenu={(e) => {
                                       e.preventDefault();
                                       const newItems = [...(editingOTS.items || [])];
                                       const idx = newItems.findIndex(it => it.member_id === m.nickname);
                                       if (idx >= 0) {
                                          if (newItems[idx].qty > 1) {
                                             newItems[idx].qty -= 1;
                                          } else {
                                             newItems.splice(idx, 1);
                                          }
                                          setEditingOTS(prev => ({ ...prev, items: newItems }));
                                       }
                                    }}
                                    className={`py-2 rounded-md text-[10px] font-bold uppercase transition-all relative ${qty > 0 ? 'bg-white text-black' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}
                                 >
                                    {m.nickname}
                                    {qty > 0 && (
                                       <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[8px] rounded-full flex items-center justify-center font-black">{qty}</span>
                                    )}
                                 </button>
                              );
                           })}
                           <button
                              type="button"
                              onClick={() => {
                                 const newItems = [...(editingOTS.items || [])];
                                 const idx = newItems.findIndex(it => it.member_id === 'GROUP');
                                 if (idx >= 0) {
                                    newItems[idx].qty += 1;
                                 } else {
                                    newItems.push({ member_id: 'GROUP', qty: 1, cheki_type: 'group' });
                                 }
                                 setEditingOTS(prev => ({ ...prev, items: newItems }));
                              }}
                              onContextMenu={(e) => {
                                 e.preventDefault();
                                 const newItems = [...(editingOTS.items || [])];
                                 const idx = newItems.findIndex(it => it.member_id === 'GROUP');
                                 if (idx >= 0) {
                                    if (newItems[idx].qty > 1) {
                                       newItems[idx].qty -= 1;
                                    } else {
                                       newItems.splice(idx, 1);
                                    }
                                    setEditingOTS(prev => ({ ...prev, items: newItems }));
                                 }
                              }}
                              className={`col-span-4 py-2 rounded-md text-[10px] font-bold uppercase transition-all relative ${editingOTS.items?.find(it => it.member_id === 'GROUP')?.qty > 0 ? 'bg-purple-600 text-white' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}
                           >
                              GROUP
                              {editingOTS.items?.find(it => it.member_id === 'GROUP')?.qty > 0 && (
                                 <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[8px] rounded-full flex items-center justify-center font-black">{editingOTS.items.find(it => it.member_id === 'GROUP').qty}</span>
                              )}
                           </button>
                        </div>
                     </div>

                     <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-white/40 ml-1">Metode Pembayaran</label>
                        <div className="flex gap-2">
                           {['cash', 'qr'].map(m => (
                              <button
                                 key={m}
                                 type="button"
                                 onClick={() => setEditingOTS(prev => ({...prev, payment_method: m}))}
                                 className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-widest border transition-all ${editingOTS.payment_method === m ? 'bg-white text-black border-white' : 'bg-transparent border-white/10 text-white/40 hover:border-white/30'}`}
                              >
                                 {m}
                              </button>
                           ))}
                        </div>
                     </div>

                     <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-white/40 ml-1">Catatan</label>
                        <textarea 
                           value={editingOTS.note || ''}
                           onChange={e => setEditingOTS(prev => ({...prev, note: e.target.value}))}
                           className="w-full bg-[#0A0A0B] border border-white/20 rounded-lg px-3 py-2 text-sm outline-none focus:border-white/50 min-h-[80px]"
                           placeholder="Tambahkan catatan khusus jika ada..."
                        />
                     </div>

                     <div className="pt-4 border-t border-white/5">
                        <button
                            type="submit"
                            disabled={isUpdatingOTS}
                            className={`w-full py-3 rounded-lg text-xs font-bold uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 ${isUpdatingOTS ? 'bg-gray-400 text-gray-700 cursor-not-allowed' : 'bg-white text-black hover:bg-gray-200'}`}
                         >
                            {isUpdatingOTS ? <LoadingSpinner size={16} /> : <Save size={16} />} 
                            {isUpdatingOTS ? 'Menyimpan...' : 'Simpan Perubahan'}
                         </button>
                     </div>
                  </form>
               </div>
          </div>
      )}

      {/* Event Modal */}
      {eventModal.show && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <div 
               onClick={() => setEventModal({ show: false, mode: 'add', data: null })}
               className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <div className="relative bg-[#121214] border border-white/10 rounded-xl w-full max-w-md shadow-2xl z-10 flex flex-col max-h-[90vh] overflow-hidden">
               {/* Modal Header */}
               <div className="p-5 pb-0">
                  <h3 className="text-lg font-bold mb-0.5">{eventModal.mode === 'add' ? 'Event Baru' : 'Edit Event'}</h3>
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-4">Konfigurasi detail event di bawah ini.</p>
                  
                  {/* Tab Switcher */}
                  <div className="flex gap-1 bg-[#0A0A0B] p-1 rounded-lg border border-white/10 mb-5">
                     <button 
                        onClick={() => setModalTab('info')}
                        className={`flex-1 py-1.5 rounded-md text-[10px] font-bold uppercase transition-all ${modalTab === 'info' ? 'bg-white/10 text-white shadow-sm' : 'text-white/30 hover:text-white/50'}`}
                     >
                        Info Event
                     </button>
                     <button 
                        onClick={() => setModalTab('lineup')}
                        className={`flex-1 py-1.5 rounded-md text-[10px] font-bold uppercase transition-all ${modalTab === 'lineup' ? 'bg-white/10 text-white shadow-sm' : 'text-white/30 hover:text-white/50'}`}
                     >
                        Lineup & Harga
                     </button>
                  </div>
               </div>
               
               <div className="flex-1 overflow-y-auto px-5 custom-scrollbar pb-5">
                  <div className="space-y-4">
                     {modalTab === 'info' ? (
                        <div className="space-y-4 animate-in fade-in duration-300">
                           <div className="space-y-1.5">
                              <label className="text-xs font-semibold text-white/40 ml-1">Nama Event</label>
                              <input 
                                 value={eventForm.name}
                                 onChange={e => setEventForm(prev => ({...prev, name: e.target.value}))}
                                 placeholder="Contoh: Memoire Release Party"
                                 className="w-full bg-[#0A0A0B] border border-white/20 rounded-lg px-3 py-2 text-sm outline-none focus:border-white/50"
                              />
                           </div>

                           <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1.5">
                                 <label className="text-xs font-semibold text-white/40 ml-1">Tanggal</label>
                                 <DatePicker 
                                    value={eventForm.date}
                                    onChange={val => setEventForm(prev => ({...prev, date: val}))}
                                 />
                              </div>
                              <div className="space-y-1.5">
                                 <label className="text-xs font-semibold text-white/40 ml-1">Batas PO</label>
                                 <DatePicker 
                                    value={eventForm.po_deadline}
                                    onChange={val => setEventForm(prev => ({...prev, po_deadline: val}))}
                                    align="right"
                                 />
                              </div>
                           </div>

                           <div className="space-y-1.5">
                              <label className="text-xs font-semibold text-white/40 ml-1">Status</label>
                              <div className="flex bg-[#0A0A0B] rounded-lg p-1 border border-white/20">
                                 <button 
                                    onClick={() => setEventForm(prev => ({...prev, status: 'ongoing'}))}
                                    className={`flex-1 py-2 rounded text-xs font-bold uppercase tracking-wider transition-colors ${eventForm.status === 'ongoing' ? 'bg-green-600 text-white' : 'text-white/40 hover:text-white'}`}
                                 >
                                    Berjalan
                                 </button>
                                 <button 
                                    onClick={() => setEventForm(prev => ({...prev, status: 'done'}))}
                                    className={`flex-1 py-2 rounded text-xs font-bold uppercase tracking-wider transition-colors ${eventForm.status === 'done' ? 'bg-white/20 text-white' : 'text-white/40 hover:text-white'}`}
                                 >
                                    Selesai
                                 </button>
                              </div>
                           </div>
                        </div>
                     ) : (
                        <div className="space-y-5 animate-in fade-in duration-300">
                           {/* Member Lineup Group */}
                           <div className="space-y-3">
                              <div className="flex justify-between items-end">
                                 <label className="text-xs font-bold text-vibrant-pink uppercase ml-1">Daftar Member</label>
                                 <button 
                                       onClick={() => setEventForm(prev => ({...prev, available_members: ['GROUP', ...membersList.map(m => m.nickname)]}))}
                                    className="text-[10px] uppercase font-bold text-white/40 hover:text-white transition-colors"
                                 >
                                    Pilih Semua
                                 </button>
                              </div>
                              <div className="grid grid-cols-4 gap-2 bg-[#0A0A0B] p-2 rounded-lg border border-white/10">
                                 {membersList.map(m => (
                                    <button
                                       key={m.id}
                                       type="button"
                                       onClick={() => {
                                          const isSelected = eventForm.available_members.includes(m.nickname);
                                          setEventForm(prev => ({
                                             ...prev,
                                             available_members: isSelected 
                                                ? prev.available_members.filter(nm => nm !== m.nickname)
                                                : [...prev.available_members, m.nickname]
                                          }));
                                       }}
                                       className={`py-1 rounded text-[10px] font-bold uppercase transition-all ${
                                          eventForm.available_members.includes(m.nickname)
                                             ? 'bg-vibrant-pink text-white shadow-lg shadow-vibrant-pink/20'
                                             : 'bg-white/5 text-white/40 hover:bg-white/10'
                                       }`}
                                    >
                                       {m.nickname}
                                    </button>
                                 ))}
                                 <button
                                    type="button"
                                    onClick={() => {
                                       const isSelected = eventForm.available_members.includes('GROUP');
                                       setEventForm(prev => ({
                                          ...prev,
                                          available_members: isSelected 
                                             ? prev.available_members.filter(nm => nm !== 'GROUP')
                                             : [...prev.available_members, 'GROUP']
                                       }));
                                    }}
                                    className={`col-span-4 py-1 rounded text-[10px] font-bold uppercase transition-all ${
                                       eventForm.available_members.includes('GROUP')
                                          ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20'
                                          : 'bg-white/5 text-white/40 hover:bg-white/10'
                                    }`}
                                 >
                                    GROUP
                                 </button>
                              </div>
                           </div>

                           <div className="pt-3 border-t border-white/10 space-y-3">
                              <p className="text-[10px] font-bold uppercase text-white/30 text-center">Pricing Config</p>
                              <div className="grid grid-cols-2 gap-4">
                                 <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-white/40 ml-1">Harga Solo</label>
                                    <PriceInput 
                                       value={eventForm.special_solo_price}
                                       onChange={val => setEventForm(prev => ({...prev, special_solo_price: val}))}
                                       className="text-right pr-2 bg-[#0A0A0B] border border-white/20 rounded-lg px-3 py-2 text-sm outline-none focus:border-white/50"
                                       colorClass="text-white"
                                    />
                                 </div>
                                 <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-white/40 ml-1">Harga Group</label>
                                    <PriceInput 
                                       value={eventForm.special_group_price}
                                       onChange={val => setEventForm(prev => ({...prev, special_group_price: val}))}
                                       className="text-right pr-2 bg-[#0A0A0B] border border-white/20 rounded-lg px-3 py-2 text-sm outline-none focus:border-white/50"
                                       colorClass="text-white"
                                    />
                                 </div>
                              </div>
                           </div>
                        </div>
                     )}
                  </div>
               </div>

               <div className="flex gap-2 p-5 pt-4 border-t border-white/10 bg-[#121214]">
                     <button
                        onClick={() => setEventModal({ show: false, mode: 'add', data: null })}
                        className="px-4 py-2.5 bg-[#0A0A0B] border border-white/20 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-white/5 transition-colors"
                     >
                        Batal
                     </button>
                     <button
                        onClick={handleEventSubmit}
                        disabled={isSavingEvent}
                        className={`flex-1 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${isSavingEvent ? 'bg-gray-400 text-gray-700 cursor-not-allowed' : 'bg-white text-black hover:bg-gray-200'}`}
                     >
                        {isSavingEvent ? 'Memproses...' : (eventModal.mode === 'add' ? 'Simpan Event' : 'Update Event')}
                     </button>
               </div>
            </div>
          </div>
      )}

      {/* Confirm Modal */}
      {confirmModal.show && (
          <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
               <div 
                  onClick={() => setConfirmModal(prev => ({...prev, show: false}))}
                  className="absolute inset-0 bg-black/80 backdrop-blur-sm"
               />
               <div className="relative bg-[#121214] border border-white/10 rounded-xl p-6 w-full max-w-sm text-center shadow-2xl z-10">
                  <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 mx-auto mb-4">
                     <AlertCircle size={24} />
                  </div>
                  <h3 className="text-lg font-bold mb-2">{confirmModal.title}</h3>
                  <p className="text-xs text-white/50 mb-6 leading-relaxed">{confirmModal.message}</p>
                  <div className="flex gap-2">
                     <button
                        onClick={() => setConfirmModal(prev => ({...prev, show: false}))}
                        className="flex-1 py-2 bg-white/5 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-white/10 transition-colors"
                     >
                        Batal
                     </button>
                     <button
                        onClick={confirmModal.onConfirm}
                        className="flex-1 py-2 bg-red-600 text-white rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-red-500 transition-colors"
                     >
                        Konfirmasi
                     </button>
                  </div>
               </div>
          </div>
      )}

      {/* Order Detail / Proof Modal */}
      {selectedOrder && (
          <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4">
               <div
                  onClick={() => setSelectedOrder(null)}
                  className="absolute inset-0 bg-black/90 backdrop-blur-md"
               />
               <div className="relative bg-[#121214] border border-white/10 rounded-xl w-full max-w-md shadow-2xl flex flex-col max-h-[90vh] z-10">
                  <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
                     <div>
                        <h3 className="text-base font-bold">{showProofOnly ? 'Bukti Pembayaran' : 'Detail Pesanan'}</h3>
                        <p className="text-xs text-white/40 uppercase">{selectedOrder.public_code || `#${selectedOrder.id}`} • {selectedOrder.nickname}</p>
                     </div>
                      <button onClick={() => setSelectedOrder(null)} className="p-1.5 bg-white/5 rounded-full hover:bg-white/10 transition-colors">
                         <X size={14} />
                      </button>
                   </div>
                   
                   <div className="overflow-y-auto p-4 space-y-4 custom-scrollbar">
                     {showProofOnly ? (
                        <div className="rounded-lg overflow-hidden border border-white/10 bg-black relative aspect-[3/4]">
                           {selectedOrder.payment_proof_url ? (
                              <img
                                src={selectedOrder.payment_proof_url}
                                alt="Proof"
                                className="w-full h-full object-contain"
                              />
                           ) : (
                              <div className="absolute inset-0 flex items-center justify-center text-white/20 text-xs font-bold uppercase tracking-widest text-center px-4">
                                 Belum ada bukti pembayaran.
                              </div>
                           )}
                        </div>
                     ) : (
                        <div className="space-y-4">
                           <div className="grid grid-cols-2 gap-3">
                              <div className="p-3 rounded-lg bg-white/5 border border-white/5">
                                 <p className="text-xs text-white/40 mb-1">Total</p>
                                 <p className="text-lg font-bold text-white">Rp {selectedOrder.total_price?.toLocaleString()}</p>
                              </div>
                              <div className="p-3 rounded-lg bg-white/5 border border-white/5">
                                 <p className="text-xs text-white/40 mb-1">Tanggal</p>
                                 <p className="text-sm font-bold">{new Date(selectedOrder.created_at).toLocaleDateString('id-ID')}</p>
                              </div>
                           </div>

                            <div className="space-y-2">
                               <p className="text-xs font-bold uppercase text-white/40 ml-1">Item Pesanan</p>
                               {selectedOrder.items && Array.isArray(selectedOrder.items) && selectedOrder.items.map((item, i) => (
                                  <div key={i} className="flex justify-between items-center p-2 rounded-lg bg-white/5 border border-white/5">
                                     <span className="text-xs font-semibold">{item.member_id}</span>
                                     <div className="flex items-center gap-3">
                                        <span className="text-xs text-white/40">x{item.qty}</span>
                                     </div>
                                  </div>
                               ))}
                            </div>

                           <div className="space-y-1">
                              <label className="text-xs font-bold uppercase text-white/40 ml-1">Catatan</label>
                              <div className="p-3 rounded-lg bg-white/5 border border-white/5 text-xs text-white/60 italic">
                                 "{selectedOrder.note || 'Tidak ada catatan.'}"
                              </div>
                           </div>
                           
                           <div className="pt-2">
                             {selectedOrder.payment_proof_url && (
                               <button
                                 onClick={() => setShowProofOnly(true)}
                                 className="w-full py-2 bg-white/5 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
                               >
                                 <Image size={14} /> Lihat Bukti
                               </button>
                             )}
                           </div>
                        </div>
                     )}
                  </div>

                  <div className="p-4 border-t border-white/10 bg-white/5">
                     <div className="flex gap-2">
                        <button
                           disabled={statusUpdatingId === selectedOrder.id}
                           onClick={() => {
                              updateStatus(selectedOrder.id, 'paid');
                              setSelectedOrder(null);
                           }}
                           className={`flex-1 py-2 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${statusUpdatingId === selectedOrder.id ? 'bg-green-800 opacity-50 cursor-not-allowed' : 'bg-green-600 hover:bg-green-500'}`}
                         >
                            {statusUpdatingId === selectedOrder.id ? 'Memproses...' : 'Ubah: DIBAYAR'}
                         </button>
                         <button
                           disabled={statusUpdatingId === selectedOrder.id}
                           onClick={() => {
                              updateStatus(selectedOrder.id, 'done');
                              setSelectedOrder(null);
                           }}
                           className={`flex-1 py-2 text-black rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${statusUpdatingId === selectedOrder.id ? 'bg-gray-400 opacity-50 cursor-not-allowed' : 'bg-white hover:bg-gray-200'}`}
                         >
                            {statusUpdatingId === selectedOrder.id ? 'Memproses...' : 'Ubah: SELESAI'}
                         </button>
                     </div>
                  </div>
               </div>
          </div>
      )}
      
      {/* Privacy Modal */}
      {showPrivacyModal && (
          <div className="fixed inset-0 z-[1300] flex items-center justify-center p-4">
              <div 
                  onClick={() => setShowPrivacyModal(false)}
                  className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              />
              <div className="relative bg-[#121214] border border-white/10 rounded-xl w-full max-w-md shadow-2xl z-10 flex flex-col max-h-[90vh]">
                  <div className="p-5 border-b border-white/10 flex justify-between items-center bg-white/5">
                      <div>
                          <h3 className="text-lg font-bold">Aturan Privasi Data</h3>
                          <p className="text-[10px] text-red-500 font-bold uppercase tracking-widest">STRICTLY CONFIDENTIAL</p>
                      </div>
                      <button onClick={() => setShowPrivacyModal(false)} className="p-1.5 bg-white/5 rounded-full hover:bg-white/10 transition-colors">
                          <X size={14} />
                      </button>
                  </div>
                  <div className="p-5 overflow-y-auto space-y-4 text-sm text-white/70 custom-scrollbar">
                      <div className="space-y-2">
                          <h4 className="font-bold text-white uppercase text-xs">1. Kerahasiaan Data Pelanggan</h4>
                          <p className="text-xs leading-relaxed">Seluruh data pelanggan (nama panggilan, kontak, riwayat pesanan, bukti transfer) bersifat sangat rahasia. Dilarang keras menyebarkan atau mendokumentasikan data pelanggan tanpa izin.</p>
                      </div>
                      <div className="space-y-2">
                          <h4 className="font-bold text-white uppercase text-xs">2. Penggunaan Sistem</h4>
                          <p className="text-xs leading-relaxed">Sistem ini hanya boleh diakses oleh staff resmi VIEOS yang bertugas. Dilarang meminjamkan akun atau membiarkan layar Admin terbuka tanpa pengawasan.</p>
                      </div>
                      <div className="space-y-2">
                          <h4 className="font-bold text-white uppercase text-xs">3. Log Aktivitas</h4>
                          <p className="text-xs leading-relaxed">Segala bentuk perubahan status (Belum dicek, Sudah bayar, Selesai) akan dicatat oleh sistem. Tindakan pemalsuan verifikasi akan ditelusuri.</p>
                      </div>
                      <div className="space-y-2">
                          <h4 className="font-bold text-white uppercase text-xs">4. Pasca Bertugas</h4>
                          <p className="text-xs leading-relaxed">Pastikan Anda melakukan <b>Logout</b> dan menutup browser setelah selesai bertugas. Keamanan data pelanggan adalah tanggung jawab bersama.</p>
                      </div>
                  </div>
                  <div className="p-4 border-t border-white/10 bg-white/5 text-center">
                      <button onClick={() => setShowPrivacyModal(false)} className="w-full py-2 bg-red-600 text-white rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-red-500 transition-colors">
                          SAYA MENGERTI
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* Toast System */}
      <div className="fixed bottom-8 right-8 z-[2000] flex flex-col gap-3 pointer-events-none items-end">
          {toasts.map(t => (
            <div
              key={t.id}
              className={`toast-glass px-5 py-4 rounded-2xl border flex items-center gap-4 pointer-events-auto min-w-[280px] group ${
                t.isExiting ? 'animate-toast-out' : 'animate-toast-in'
              } ${
                t.type === 'error' 
                  ? 'border-red-500/30 shadow-red-900/10' 
                  : t.type === 'info' 
                    ? 'border-blue-500/30 shadow-blue-900/10' 
                    : 'border-vibrant-pink/30 shadow-vibrant-pink/10'
              }`}
            >
              <div className={`p-2 rounded-xl ${
                t.type === 'error' 
                  ? 'bg-red-500/20 text-red-500' 
                  : t.type === 'info' 
                    ? 'bg-blue-500/20 text-blue-400' 
                    : 'bg-vibrant-pink/20 text-vibrant-pink'
              }`}>
                {t.type === 'error' ? (
                  <AlertCircle size={20} />
                ) : t.type === 'info' ? (
                  <Clock size={20} />
                ) : (
                  <CheckCircle2 size={20} />
                )}
              </div>
              
              <div className="flex-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-0.5">Notification</p>
                <p className="text-sm font-bold text-white/90">{t.message}</p>
              </div>
              
              <div className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-transparent via-white/10 to-transparent w-full opacity-50" />
            </div>
          ))}
      </div>
    </div>
  );
};

export default Admin;
