import React from 'react';
import { AlertCircle } from 'lucide-react';

const CmsSection = ({ membersList, getMemberImageSrc, getMemberFallbackImage }) => (
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
);

export default CmsSection;
