import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  ShoppingBag, ChevronLeft, CreditCard, Send, Sparkles, 
  CheckCircle2, QrCode, Trash2, Camera, Upload, Image as ImageIcon,
  User, Instagram, MessageCircle, FileText, Calendar
} from 'lucide-react';
import { fetchEvents, fetchSettings, API_URL } from '../api';
import Toast from '../components/Toast';
import { convertFileToWebp } from '../utils/imageUpload';

const Checkout = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const receiptRef = useRef(null);
  
  const [cart, setCart] = useState([]);
  const [liveEvents, setLiveEvents] = useState([]);
  const [liveSettings, setLiveSettings] = useState(null);

  // Helper to get price from live data
  const getItemPrice = (item, eventId) => {
    // 1. Check if it's a special event first
    if (eventId) {
      const event = liveEvents.find(e => e.id.toString() === eventId.toString());
      if (event && event.type === 'special') {
        const memberName = item.member?.nickname || item.name.split(' ')[0];
        if (item.type === 'solo' && event.special_prices && event.special_prices[memberName]) {
            return event.special_prices[memberName];
        }
        if (item.type === 'group' && event.special_prices?.['GROUP']) {
            return event.special_prices['GROUP'];
        }
      }
    }
    
    // 2. Otherwise use the latest live settings (fallback to item.price if settings not yet loaded)
    if (liveSettings?.prices) {
        if (item.type === 'solo') return liveSettings.prices.regular_cheki_solo;
        if (item.type === 'group') return liveSettings.prices.regular_cheki_group;
    }

    return item.price;
  };
  const [isOrdered, setIsOrdered] = useState(false);
  const [toastConfig, setToastConfig] = useState(null);
  const showToastMsg = (msg, type = 'error') => { setToastConfig(msg ? { message: msg, type } : null); };
  
  const [formData, setFormData] = useState({
    nickname: '',
    contact: '',
    note: '',
    eventId: '',
    isDropdownOpen: false
  });
  
  const [proof, setProof] = useState({
    preview: null,
    compressed: null,
    isCompressing: false
  });
  const [orderId, setOrderId] = useState(null);
  /** Snapshot saat order sukses — nota tidak bergantung form/autocomplete setelahnya */
  const [receiptInfo, setReceiptInfo] = useState(null);
  const [showQRModal, setShowQRModal] = useState(false);

  useEffect(() => {
    const savedCart = localStorage.getItem('vieos_cart');
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }

    const loadData = async () => {
      try {
        const [eventsData, settingsData] = await Promise.all([
            fetchEvents(),
            fetchSettings()
        ]);
        setLiveEvents(eventsData);
        setLiveSettings(settingsData);
        
        // Show warning if no active events
        const hasActiveEvents = (eventsData || []).some(ev => ev.status !== 'done');
        if (!eventsData || eventsData.length === 0 || !hasActiveEvents) {
          showToastMsg("Maaf, saat ini pre-order sedang ditutup karena belum ada event mendatang.");
        }
      } catch (err) {
        console.error("Failed to load checkout data:", err);
      }
    };
    loadData();
  }, []);

  const removeFromCart = (index) => {
    const newCart = [...cart];
    newCart.splice(index, 1);
    setCart(newCart);
    localStorage.setItem('vieos_cart', JSON.stringify(newCart));
  };

  const total = cart.reduce((sum, item) => sum + getItemPrice(item, formData.eventId), 0);

  const handleSaveReceipt = async () => {
    if (!receiptRef.current) return;
    
    try {
      const { default: html2canvas } = await import('html2canvas');
      const canvas = await html2canvas(receiptRef.current, {
        backgroundColor: '#FFE96B',
        scale: 2, // Higher quality
        logging: false,
        useCORS: true
      });
      
      const image = canvas.toDataURL("image/png");
      const link = document.createElement('a');
      link.href = image;
      link.download = `VIEOS-RECEIPT-${orderId.replace('#', '')}.png`;
      link.click();
      showToastMsg("Nota berhasil disimpan ke Galeri!");
    } catch (err) {
      console.error("Save error:", err);
      showToastMsg("Duh, gagal simpan nota. Boleh bantu screenshot manual ya, Kak!");
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToastMsg('File harus berupa gambar.');
      return;
    }

    setProof(prev => ({ ...prev, isCompressing: true, compressed: null }));

    // Show preview immediately while conversion runs in parallel.
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setProof(prev => ({ ...prev, preview: event.target.result }));
      }
    };
    reader.readAsDataURL(file);

    try {
      const webpBlob = await convertFileToWebp(file, {
        maxWidth: 1200,
        maxHeight: 1200,
        quality: 0.78
      });

      setProof(prev => ({
        ...prev,
        compressed: webpBlob,
        isCompressing: false
      }));
    } catch (error) {
      console.error('Proof conversion error:', error);
      setProof(prev => ({
        ...prev,
        compressed: null,
        isCompressing: false
      }));
      showToastMsg('Gagal memproses gambar. Coba file lain ya!');
    }
  };

  const isFormValid = formData.nickname && formData.contact && formData.eventId && proof.compressed && cart.length > 0;

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirmOrder = async () => {
    if (cart.length === 0) {
      showToastMsg("Keranjang masih kosong, Kak!");
      return;
    }
    if (!formData.nickname) {
      showToastMsg("Nama Panggilan harus diisi!");
      return;
    }
    if (!formData.contact) {
      showToastMsg("Username IG / WA harus diisi!");
      return;
    }
    if (!formData.eventId) {
      const hasActiveEvents = liveEvents.some(ev => ev.status !== 'done');
      if (liveEvents.length === 0 || !hasActiveEvents) {
        showToastMsg("Maaf, saat ini pre-order sedang ditutup karena belum ada event mendatang.");
      } else {
        showToastMsg("Pilih event dulu ya!");
      }
      return;
    }

    const selectedEvent = liveEvents.find(e => e.id.toString() === formData.eventId.toString());
    if (selectedEvent && selectedEvent.status === 'done') {
      showToastMsg("Event sudah selesai, Kak!");
      return;
    }

    if (!proof.compressed) {
      showToastMsg("Boleh bantu upload bukti bayarnya dulu ya, Kak!");
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Upload proof image to Supabase Storage
      let proofUrl = null;
      if (proof.compressed) {
        const uploadData = new FormData();
        uploadData.append('proof', proof.compressed, 'proof.webp');
        const uploadRes = await fetch(`${API_URL}/orders/upload-proof`, {
          method: 'POST',
          body: uploadData
        });
        if (!uploadRes.ok) throw new Error('Gagal upload bukti bayar');
        const uploadResult = await uploadRes.json();
        proofUrl = uploadResult.url;
      }

      // 2. Build order items
      const groupedItems = Object.values(cart.reduce((acc, item) => {
        const key = `${item.name}-${item.type}`;
        if (!acc[key]) acc[key] = { member_id: item.member?.nickname || item.name, cheki_type: item.type, qty: 0 };
        acc[key].qty += 1;
        return acc;
      }, {}));

      // 3. Create order
      const orderRes = await fetch(`${API_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nickname: formData.nickname,
          contact: formData.contact,
          event_id: parseInt(formData.eventId),
          items: groupedItems,
          cheki_type: groupedItems[0]?.cheki_type || 'member',
          qty: cart.length,
          mode: 'online',
          payment_method: 'transfer',
          payment_proof_url: proofUrl,
          note: formData.note
        })
      });

      if (!orderRes.ok) {
        let detail = 'Gagal membuat pesanan';
        try {
          const errJson = await orderRes.json();
          if (errJson?.error) detail = `${detail}: ${errJson.error}`;
        } catch (_) { /* body bukan JSON */ }
        throw new Error(detail);
      }
      const orderData = await orderRes.json();
      const eventForReceipt = liveEvents.find(
        (e) => e.id.toString() === String(formData.eventId)
      );

      setReceiptInfo({
        nickname: (orderData.nickname || formData.nickname || '').trim(),
        contact: (formData.contact || '').trim(),
        note: (formData.note || '').trim(),
        eventName: (orderData.event_name || eventForReceipt?.name || '').trim(),
        eventType: eventForReceipt?.type || 'standard',
        eventId: formData.eventId
      });
      setOrderId(orderData.public_code ? `#${orderData.public_code}` : `#V-${orderData.id}`);
      setIsOrdered(true);
      localStorage.removeItem('vieos_cart');
    } catch (error) {
      console.error('Order error:', error);
      showToastMsg(error.message || "Terjadi kesalahan, coba lagi!");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen relative pt-32 pb-12 px-4 md:px-12 overflow-hidden">
      <div className="playful-bg" />
      <div className="grain-overlay" />
      
      {/* Global Glows for consistency */}
      <div className="absolute top-[10%] left-[-20%] md:left-[-10%] w-[300px] md:w-[600px] h-[300px] md:h-[600px] bg-vibrant-pink/10 rounded-full blur-[80px] md:blur-[160px] -z-0 pointer-events-none" />
      <div className="absolute bottom-[20%] right-[-20%] md:right-[-10%] w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-vibrant-blue/10 rounded-full blur-[80px] md:blur-[140px] -z-0 pointer-events-none" />

      <div className="max-w-2xl mx-auto relative z-10">
        <button 
          onClick={() => navigate('/cheki')}
          className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest opacity-30 hover:opacity-100 transition-opacity mb-4"
        >
          <ChevronLeft size={12} /> Kembali
        </button>

        <AnimatePresence mode="wait">
          {!isOrdered ? (
            <motion.div
              key="order-slip"
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -30, opacity: 0 }}
              className="bg-[#FFE96B] p-5 md:p-8 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] relative rotate-[-0.3deg] rounded-sm"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-black/5" />
              
              <div className="flex justify-between items-start gap-4 mb-4 border-b-2 border-dashed border-black/10 pb-4">
                <div>
                   <h1 className="handwritten text-3xl text-black mb-0.5">Order Slip.</h1>
                   <p className="text-[8px] font-black uppercase tracking-[0.3em] text-black/30">VIEOS / 2026</p>
                </div>
                <div className="text-right">
                   <p className="text-[7px] font-black uppercase text-black/40 mb-0.5 leading-none">ID</p>
                   <p className="text-[9px] font-mono font-bold text-black opacity-60 uppercase">SRB-{Math.random().toString(36).substr(2, 6).toUpperCase()}</p>
                </div>
              </div>


              {/* Main Content Split */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 mb-4">
                {/* Left: Data Form */}
                <div className="space-y-4">
                   <div className="grid grid-cols-2 md:grid-cols-1 gap-3">
                      <div className="space-y-1">
                         <label className="text-[7px] md:text-[8px] font-black uppercase tracking-widest text-black/40 mb-1 block leading-none">
                            <User size={9} /> Name
                         </label>
                         <input 
                           type="text" name="nickname" autoComplete="off" value={formData.nickname} onChange={handleInputChange}
                           placeholder="Nickname"
                           className="w-full bg-white/40 border-b border-black/10 focus:border-vibrant-pink p-1.5 text-xs font-bold text-black placeholder:text-black/20 outline-none transition-colors"
                         />
                      </div>

                      <div className="space-y-1">
                         <label className="text-[7px] md:text-[8px] font-black uppercase tracking-widest text-black/40 mb-1 block leading-none">
                            <Instagram size={9} /> IG/WA
                         </label>
                         <input 
                           type="text" name="contact" autoComplete="off" value={formData.contact} onChange={handleInputChange}
                           placeholder="@user / WA"
                           className="w-full bg-white/40 border-b border-black/10 focus:border-vibrant-pink p-1.5 text-xs font-bold text-black placeholder:text-black/20 outline-none transition-colors"
                         />
                      </div>
                   </div>

                   <div className="space-y-1 relative group/select">
                      <label className="text-[7px] md:text-[8px] font-black uppercase tracking-widest text-black/40 mb-1 block leading-none">
                         <Calendar size={9} /> Pilih Event
                      </label>
                      <div className="relative">
                         <div 
                           onClick={() => setFormData(prev => ({ ...prev, isDropdownOpen: !prev.isDropdownOpen }))}
                           className="w-full bg-white/40 border-b border-black/10 p-1.5 text-[11px] font-bold text-black cursor-pointer flex justify-between items-center transition-colors hover:border-vibrant-pink"
                         >
                            <span className={!formData.eventId ? "text-black/20" : "flex items-center gap-2"}>
                               {formData.eventId ? (
                                 <>
                                   {liveEvents.find((e) => e.id.toString() === String(formData.eventId))?.name}
                                   {(() => {
                                     const selEv = liveEvents.find((e) => e.id.toString() === String(formData.eventId));
                                     if (!selEv) return null;
                                     const isSp = selEv.type === 'special';
                                     return (
                                       <span className={`text-[7px] px-1.5 py-0.5 rounded-full font-black ${
                                         isSp 
                                           ? 'bg-purple-500/15 text-purple-600 border border-purple-500/20' 
                                           : 'bg-green-500/15 text-green-600 border border-green-500/20'
                                       }`}>
                                         {isSp ? '★ SPESIAL' : '● BIASA'}
                                       </span>
                                     );
                                   })()}
                                 </>
                               ) : "-- Pilih Event --"}
                            </span>
                            <motion.div
                              animate={{ rotate: formData.isDropdownOpen ? 180 : 0 }}
                              transition={{ duration: 0.2 }}
                            >
                               <ChevronLeft size={10} className="-rotate-90" />
                            </motion.div>
                         </div>

                         <AnimatePresence>
                            {formData.isDropdownOpen && (
                               <motion.div
                                 initial={{ opacity: 0, y: 10 }}
                                 animate={{ opacity: 1, y: 0 }}
                                 exit={{ opacity: 0, y: 10 }}
                                 className="absolute top-full left-0 w-full mt-1 bg-white shadow-2xl rounded-xl overflow-hidden z-[100] border-2 border-black/5"
                               >
                                   {liveEvents.map(ev => {
                                      const isCompleted = ev.status === 'done';
                                      const isSpecial = ev.type === 'special';
                                      return (
                                        <div 
                                          key={ev.id}
                                          onClick={() => {
                                          if (isCompleted) {
                                              showToastMsg("Event sudah selesai, Kak!");
                                              return;
                                            }
                                            setFormData(prev => ({ ...prev, eventId: ev.id, isDropdownOpen: false }));
                                          }}
                                          className={`p-3 text-[10px] font-black uppercase tracking-widest transition-colors border-b border-black/5 last:border-0 flex items-center justify-between ${
                                            isCompleted 
                                              ? 'bg-black/5 text-black/20 cursor-not-allowed' 
                                              : isSpecial
                                                ? 'text-purple-700 hover:bg-purple-600 hover:text-white cursor-pointer'
                                                : 'text-black hover:bg-vibrant-pink hover:text-white cursor-pointer'
                                          }`}
                                        >
                                           <span className="flex items-center gap-2">
                                             {isSpecial && <Sparkles size={10} className="flex-shrink-0" />}
                                             {ev.name}
                                           </span>
                                           <div className="flex items-center gap-1.5">
                                             {isSpecial ? (
                                               <span className="text-[7px] px-1.5 py-0.5 rounded-full bg-purple-500/15 text-purple-600 border border-purple-500/20">
                                                 ★ SPESIAL
                                               </span>
                                             ) : (
                                               <span className="text-[7px] px-1.5 py-0.5 rounded-full bg-green-500/15 text-green-600 border border-green-500/20">
                                                 ● BIASA
                                               </span>
                                             )}
                                             <span className={`text-[8px] px-1.5 py-0.5 rounded-full ${
                                               isCompleted 
                                                 ? 'bg-black/10 text-black/30' 
                                                 : isSpecial
                                                   ? 'bg-purple-500/10 text-purple-500'
                                                   : 'bg-vibrant-pink/10 text-vibrant-pink'
                                             }`}>
                                               {isCompleted ? 'SELESAI' : (ev.event_date || '-')}
                                             </span>
                                           </div>
                                        </div>
                                      );
                                   })}
                               </motion.div>
                            )}
                         </AnimatePresence>
                      </div>
                   </div>

                   <div className="space-y-1">
                      <label className="text-[7px] md:text-[8px] font-black uppercase tracking-widest text-black/40 mb-1 block leading-none">
                         <FileText size={9} /> Catatan (Tulis 'Titip' atau '1S' kalau kamu nggak dateng)
                      </label>
                      <textarea 
                        name="note" value={formData.note} onChange={handleInputChange}
                        placeholder="Contoh: Vivi Titip (1S). Kosongkan jika hadir (2S)."
                        className="w-full bg-white/40 border-b border-black/10 focus:border-vibrant-pink p-1.5 text-xs font-bold text-black placeholder:text-black/20 outline-none transition-colors resize-none h-12"
                      />
                   </div>
                </div>

                {/* Right: Payment & Verification */}
                <div className="space-y-4">
                   <div>
                      <label className="text-[7px] font-black uppercase tracking-widest text-black/40 mb-1.5 block leading-none">
                         Metode Bayar (QRIS)
                      </label>
                      <div 
                        onClick={() => setShowQRModal(true)}
                        className="bg-white/60 p-2.5 rounded-xl border border-black/5 hover:border-vibrant-pink transition-all cursor-pointer group relative overflow-hidden"
                      >
                         <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white rounded-lg p-1 shadow-sm group-hover:scale-110 transition-transform flex-shrink-0">
                               <img src="/assets/qris.webp" alt="QRIS" className="w-full h-full object-contain" />
                            </div>
                            <div>
                               <p className="text-[9px] font-black text-black uppercase tracking-widest leading-none">QRIS VIEOS</p>
                               <p className="text-[7px] font-bold text-black/40 uppercase tracking-widest mt-1 italic leading-none">Klik perbesar</p>
                            </div>
                            <div className="ml-auto bg-black text-white p-1.5 rounded-full opacity-20 group-hover:opacity-100 transition-opacity">
                               <QrCode size={12} />
                            </div>
                         </div>
                      </div>
                   </div>

                   {/* Item Summary - Moved Here */}
                   <div>
                      <label className="text-[7px] font-black uppercase tracking-widest text-black/40 mb-1.5 block leading-none">
                         Item
                      </label>
                      <div className="bg-white/40 border border-black/5 p-2.5 rounded-xl space-y-1">
                         {Object.values(cart.reduce((acc, item) => {
                           const key = `${item.name}-${item.type}`;
                           if (!acc[key]) acc[key] = { ...item, qty: 0 };
                           acc[key].qty += 1;
                           return acc;
                         }, {})).map((item, idx) => (
                           <div key={idx} className="flex justify-between text-[10px] font-black uppercase text-black group">
                              <div className="flex items-center gap-2">
                                 <span>{item.name}</span>
                                 <span className="text-vibrant-pink text-[8px]">x{item.qty}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                 <span>{(item.price * item.qty)/1000}K</span>
                                 <button 
                                   onClick={() => {
                                      const newCart = cart.filter(i => `${i.name}-${i.type}` !== `${item.name}-${item.type}`);
                                      setCart(newCart);
                                      localStorage.setItem('vieos_cart', JSON.stringify(newCart));
                                   }} 
                                   className="opacity-0 group-hover:opacity-100 text-red-500"
                                 >
                                    <Trash2 size={8} />
                                 </button>
                              </div>
                           </div>
                         ))}
                         <div className="mt-2 pt-2 border-t border-black/10 flex justify-between items-center">
                            <span className="text-[9px] font-black uppercase text-black/40">Total</span>
                            <span className="text-xs font-black text-black">IDR {total/1000}K</span>
                         </div>
                      </div>
                   </div>

                   <div>
                      <label className="text-[7px] font-black uppercase tracking-widest text-black/40 mb-1.5 block leading-none">
                         Bukti Bayar (Screenshot)
                      </label>
                      
                      <div 
                        onClick={() => fileInputRef.current.click()}
                        className="relative aspect-video bg-white/60 border border-dashed border-black/10 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-vibrant-pink hover:bg-white/80 transition-all group overflow-hidden shadow-inner"
                      >
                         <input 
                           type="file" ref={fileInputRef} onChange={handleImageUpload}
                           accept="image/*" className="hidden"
                         />
                         
                         {proof.preview ? (
                           <>
                              <img src={proof.preview} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" alt="Proof" />
                              <div className="absolute inset-0 bg-black/20 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                                 <Camera size={20} className="text-white mb-2" />
                                 <span className="text-[7px] font-black text-white uppercase tracking-widest">Ganti</span>
                              </div>
                              {proof.isCompressing && (
                                 <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                                    <span className="text-[8px] font-black text-vibrant-pink animate-pulse">OPTIMIZING...</span>
                                 </div>
                              )}
                           </>
                         ) : (
                           <div className="text-center p-4">
                              <Upload size={18} className="text-black/20 group-hover:text-vibrant-pink transition-colors mx-auto mb-2" />
                              <p className="text-[8px] font-black text-black/30 uppercase tracking-[0.2em] leading-none">Upload Bukti</p>
                           </div>
                         )}
                      </div>
                   </div>
                </div>
              </div>

              {/* Action */}
              <div className="mt-4">
                 <button 
                    onClick={handleConfirmOrder}
                    disabled={isSubmitting || proof.isCompressing || liveEvents.length === 0 || !liveEvents.some(ev => ev.status !== 'done')}
                    className={`w-full bg-black text-white py-4 rounded-xl font-black text-[10px] tracking-[0.4em] uppercase shadow-2xl hover:translate-y-[-1px] active:translate-y-0 transition-all relative group overflow-hidden ${isSubmitting || proof.isCompressing || liveEvents.length === 0 || !liveEvents.some(ev => ev.status !== 'done') ? 'opacity-40 cursor-not-allowed filter grayscale' : ''}`}
                  >
                     <span className="relative z-10 flex items-center justify-center gap-3">
                       {isSubmitting ? 'PROSES...' : proof.isCompressing ? 'KOMPRESI GAMBAR...' : 'SELESAIKAN ORDER'} <Send size={12} className="group-hover:translate-x-1 transition-transform" />
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-vibrant-pink to-vibrant-blue translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                 </button>
              </div>

              {/* Minimalist Note */}
              <p className="text-[7px] font-bold text-black/20 text-center mt-4 uppercase tracking-widest">
                 Gambar bakal otomatis dikompres biar upload-nya ngebut dan hemat kuota ⚡
              </p>
            </motion.div>
          ) : (
            <div className="space-y-8">
               <motion.div
                 ref={receiptRef}
                 initial={{ y: 30, opacity: 0 }}
                 animate={{ y: 0, opacity: 1 }}
                 className="bg-[#FFE96B] p-6 md:p-8 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.4)] relative rotate-[0.5deg] rounded-sm print-only overflow-hidden"
               >
                  <div className="absolute top-0 left-0 w-full h-3 bg-black/5" />
                  
                  {/* Success Stamp Overlay */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-50">
                     <motion.div 
                       initial={{ scale: 2, opacity: 0, rotate: -30 }}
                       animate={{ scale: 1, opacity: 1, rotate: -15 }}
                       transition={{ type: 'spring', damping: 10, delay: 0.5 }}
                       className="stamp-effect"
                     >
                        CONFIRMED
                     </motion.div>
                  </div>

                  {/* ===== HEADER: Logo + Order ID ===== */}
                  <div className="flex justify-between items-center mb-4 pb-4 border-b-2 border-dashed border-black/10">
                    <div className="flex items-center gap-3">
                       <img src="/logos/vieos.webp" alt="VIEOS" className="h-10 md:h-12 w-auto object-contain" />
                       <div>
                          <h1 className="text-lg md:text-xl font-black text-black uppercase tracking-tight leading-none">VIEOS</h1>
                          <p className="text-[7px] font-black uppercase tracking-[0.3em] text-black/30">Receipt / 2026</p>
                       </div>
                    </div>
                    <div className="text-right">
                       <p className="text-[7px] font-black uppercase text-black/40 mb-0.5 leading-none">Order ID</p>
                       <p className="text-base md:text-lg font-black text-black tracking-tight">{orderId}</p>
                    </div>
                  </div>

                  {/* ===== CUSTOMER INFO: Name, IG, Event (TOP) ===== */}
                  <div className="mb-5 space-y-3">
                     <div className="grid grid-cols-2 gap-3">
                        <div className="bg-black/5 p-3 rounded-xl">
                           <p className="text-[7px] font-black uppercase text-black/40 mb-1 flex items-center gap-1"><User size={8} /> Pemesan</p>
                           <p className="text-sm font-black uppercase text-black leading-snug break-words">
                              {receiptInfo?.nickname || formData.nickname || '—'}
                           </p>
                        </div>
                        <div className="bg-black/5 p-3 rounded-xl">
                           <p className="text-[7px] font-black uppercase text-black/40 mb-1 flex items-center gap-1"><Instagram size={8} /> Kontak</p>
                           <p className="text-[11px] font-black text-black leading-snug break-words">
                              {receiptInfo?.contact || formData.contact || '—'}
                           </p>
                        </div>
                     </div>
                     <div className="bg-black/5 p-3 rounded-xl">
                        <p className="text-[7px] font-black uppercase text-black/40 mb-1 flex items-center gap-1"><Calendar size={8} /> Event</p>
                        <div className="flex items-center gap-2">
                           <p className="text-sm font-black uppercase text-black leading-snug break-words">
                              {receiptInfo?.eventName
                                || liveEvents.find((e) => e.id.toString() === String(formData.eventId))?.name
                                || (receiptInfo?.eventId != null && receiptInfo.eventId !== ''
                                  ? `Event #${receiptInfo.eventId}`
                                  : '—')}
                           </p>
                           {(() => {
                             const evType = receiptInfo?.eventType || liveEvents.find((e) => e.id.toString() === String(receiptInfo?.eventId || formData.eventId))?.type;
                             const isSp = evType === 'special';
                             return (
                               <span className={`text-[7px] px-2 py-0.5 rounded-full font-black whitespace-nowrap ${
                                 isSp
                                   ? 'bg-purple-500/15 text-purple-600 border border-purple-500/20'
                                   : 'bg-green-500/15 text-green-600 border border-green-500/20'
                               }`}>
                                 {isSp ? '★ EVENT SPESIAL' : '● EVENT BIASA'}
                               </span>
                             );
                           })()}
                        </div>
                     </div>
                  </div>

                  {/* ===== ITEMS + TOTAL ===== */}
                  <div className="mb-5">
                     <div className="bg-black/5 p-4 rounded-xl">
                        <div className="flex justify-between items-center mb-2">
                           <span className="text-[9px] font-black uppercase tracking-widest text-black/40">Item Pesanan</span>
                        </div>
                        <div className="space-y-1.5">
                           {Object.values(cart.reduce((acc, item) => {
                             const key = `${item.name}-${item.type}`;
                             if (!acc[key]) acc[key] = { ...item, qty: 0 };
                             acc[key].qty += 1;
                             return acc;
                           }, {})).map((item, idx) => (
                             <div key={idx} className="flex justify-between text-[11px] font-black uppercase text-black">
                                <span>{item.name} x{item.qty}</span>
                                <span>{(getItemPrice(item, receiptInfo?.eventId || formData.eventId) * item.qty)/1000}K</span>
                             </div>
                           ))}
                        </div>
                        <div className="mt-3 pt-3 border-t-2 border-dashed border-black/10 flex justify-between items-center">
                           <span className="text-xs font-black uppercase text-black">Total</span>
                           <span className="text-xl font-black text-black">IDR {total.toLocaleString('id-ID')}</span>
                        </div>
                     </div>
                  </div>

                  {/* ===== VERIFICATION NOTICE ===== */}
                  <div className="bg-black/8 border border-black/10 p-4 rounded-xl mb-5">
                     <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-vibrant-pink/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                           <CheckCircle2 size={14} className="text-vibrant-pink" />
                        </div>
                        <div>
                           <p className="text-[10px] font-black uppercase text-black tracking-wide mb-1">
                              ⏳ Pesanan Kamu Bakal Segera Kami Cek!
                           </p>
                           <p className="text-[8px] font-bold text-black/50 leading-relaxed">
                              Bukti transfer aman! Tim VIEOS bakal segera cek dan konfirmasi pesananmu. Ditunggu ya, Kak!
                           </p>
                        </div>
                     </div>
                  </div>

                  {/* ===== IG HANDLE (if user provided Instagram) ===== */}
                  {(receiptInfo?.contact || formData.contact || '').startsWith('@') && (
                    <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/15 p-3 rounded-xl mb-5">
                       <div className="flex items-center gap-2">
                          <Instagram size={14} className="text-purple-600" />
                          <div>
                             <p className="text-[9px] font-black text-purple-700 uppercase">
                                {receiptInfo?.contact || formData.contact}
                             </p>
                             <p className="text-[7px] font-bold text-purple-500/60">Instagram Handle</p>
                          </div>
                       </div>
                    </div>
                  )}

                  {/* ===== OPTIONAL: IG Stories + Cheki Partner ===== */}
                  <div className="bg-black/5 p-4 rounded-xl mb-5 space-y-2">
                     <p className="text-[8px] font-black uppercase text-black/50 tracking-widest text-center">📸 Tips Momen Seru</p>
                     <p className="text-[9px] font-bold text-black/60 text-center leading-relaxed">
                        Jangan lupa post <span className="font-black text-black">IG Stories</span> momen cheki-mu dan tag <span className="font-black text-vibrant-pink">@vieos.idol</span>!
                     </p>
                     {/* Cheki partner names from cart items */}
                     {cart.some(item => item.type === 'solo') && (
                       <p className="text-[8px] font-bold text-black/40 text-center italic">
                          Cheki bareng: {[...new Set(cart.filter(i => i.type === 'solo').map(i => i.member?.nickname || i.name.split(' ')[0]))].join(', ')}
                       </p>
                     )}
                  </div>

                  {/* ===== BOOTH INSTRUCTION ===== */}
                  <div className="text-center py-4 border-y-2 border-dashed border-black/10 mb-4">
                     <p className="text-[10px] font-black uppercase tracking-[0.2em] text-black">
                        Tunjukkan nota ini di Booth VIEOS
                     </p>
                     <p className="text-[8px] font-bold text-black/40 italic mt-1 uppercase">
                        Booth Collection Only - Event Day
                     </p>
                  </div>

                  {/* ===== THANK YOU ===== */}
                  <div className="text-center pt-2">
                     <p className="handwritten text-2xl md:text-3xl text-black mb-1">Terima Kasih!</p>
                     <p className="text-[8px] font-bold text-black/40 uppercase tracking-widest">
                        Sampai jumpa di event, {receiptInfo?.nickname || formData.nickname || 'Wots'}! 💛
                     </p>
                     <div className="flex items-center justify-center gap-2 mt-3 opacity-30">
                        <img src="/logos/vieos.webp" alt="VIEOS" className="h-4 w-auto object-contain" />
                        <span className="text-[6px] font-black uppercase tracking-[0.3em] text-black">VIEOS IDOL 2026</span>
                     </div>
                  </div>
               </motion.div>

               <div className="flex flex-col gap-4 no-print">
                  <button 
                    onClick={handleSaveReceipt}
                    className="w-full bg-vibrant-pink text-white py-5 rounded-2xl font-black text-xs tracking-widest uppercase shadow-2xl hover:scale-[1.02] transition-all flex items-center justify-center gap-3"
                  >
                     <ImageIcon size={16} /> SIMPAN NOTA (PNG)
                  </button>
                  <button 
                    onClick={() => navigate('/')}
                    className="w-full bg-white/10 text-white py-5 rounded-2xl font-black text-[10px] tracking-widest uppercase border border-white/10 hover:bg-white/20 transition-all"
                  >
                     KEMBALI KE HOME
                  </button>
               </div>
            </div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {toastConfig && (
            <Toast 
              message={toastConfig.message} 
              type={toastConfig.type}
              onClose={() => showToastMsg(null)} 
            />
          )}
        </AnimatePresence>

        {/* QR Modal */}
        <AnimatePresence>
          {showQRModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[200] flex items-center justify-center p-6 backdrop-blur-xl bg-black/80"
              onClick={() => setShowQRModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="bg-white p-8 rounded-[2.5rem] max-w-sm w-full shadow-[0_40px_100px_-20px_rgba(255,27,141,0.5)] relative"
                onClick={e => e.stopPropagation()}
              >
                <div className="text-center mb-6">
                   <h2 className="text-xl font-black text-black uppercase tracking-tighter">Scan & Pay</h2>
                   <p className="text-[8px] font-bold text-black/40 uppercase tracking-widest mt-1">Gopay, OVO, ShopeePay, Dana, M-Banking</p>
                </div>
                
                <div className="aspect-square bg-white rounded-3xl p-4 shadow-inner border-4 border-black/5 mb-6 relative group">
                   <img src="/assets/qris.webp" alt="QRIS Large" className="w-full h-full object-contain" />
                   <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none rounded-2xl" />
                </div>

                <div className="bg-vibrant-pink/10 p-4 rounded-2xl mb-8 border border-vibrant-pink/5">
                   <p className="text-[9px] font-black text-vibrant-pink uppercase tracking-widest leading-relaxed text-center">
                     Pastikan nominal transfer sesuai dengan total pesanan Anda ya Kak!
                   </p>
                </div>

                <button 
                  onClick={() => setShowQRModal(false)}
                  className="w-full py-4 bg-black text-white rounded-xl font-black text-[10px] uppercase tracking-[0.3em] hover:bg-vibrant-pink transition-colors"
                >
                  TUTUP
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Checkout;
