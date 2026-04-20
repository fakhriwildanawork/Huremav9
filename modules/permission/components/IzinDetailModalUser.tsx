
import React, { useState, useEffect } from 'react';
import { PermissionRequest, AuthUser } from '../../../types';
import { formatDateID } from '../../../utils/dateFormatter';
import { googleDriveService } from '../../../services/googleDriveService';
import { permissionService } from '../../../services/permissionService';
import { mobilePopUpSizeGuide } from '../../../utils/mobilePopUpSizeGuide';
import { 
  X, 
  Calendar, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  FileUp, 
  Eye,
  Info,
  ArrowRight,
  History,
  User,
  MessageSquare,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';

interface IzinDetailModalUserProps {
  request: PermissionRequest;
  onClose: () => void;
  user: AuthUser;
}

const IzinDetailModalUser: React.FC<IzinDetailModalUserProps> = ({
  request,
  onClose,
  user
}) => {
  const [verifierInfo, setVerifierInfo] = useState<any>(null);
  const [isLoadingVerifier, setIsLoadingVerifier] = useState(false);
  const [selectedNegoItem, setSelectedNegoItem] = useState<any>(null);

  useEffect(() => {
    if (request.id) {
      loadVerifierInfo();
    }
  }, [request.id, request.status]);

  const loadVerifierInfo = async () => {
    try {
      setIsLoadingVerifier(true);
      const info = await permissionService.getVerifierInfo(request.id);
      setVerifierInfo(info);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoadingVerifier(false);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-emerald-500/10 text-emerald-500';
      case 'rejected': return 'bg-rose-500/10 text-rose-500';
      case 'negotiating': return 'bg-amber-500/10 text-amber-500';
      case 'cancelled': return 'bg-gray-500/10 text-gray-500';
      default: return 'bg-blue-500/10 text-blue-500';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'approved': return 'Disetujui';
      case 'rejected': return 'Ditolak';
      case 'negotiating': return 'Negosiasi';
      case 'cancelled': return 'Dibatalkan';
      default: return 'Pending';
    }
  };

  const getNegoStatusLabel = (nego: any, isLast: boolean) => {
    if (isLast) {
      if (request.status === 'approved') return 'Setuju';
      if (request.status === 'rejected') return 'Tolak';
      if (request.status === 'cancelled') return 'Batal';
    }
    return 'Nego';
  };

  const getPhotoUrl = (photoId: string | null) => {
    if (!photoId) return null;
    if (photoId.startsWith('http')) return photoId;
    return googleDriveService.getFileUrl(photoId);
  };

  return (
    <div className={mobilePopUpSizeGuide.overlay}>
      <div className={mobilePopUpSizeGuide.container}>
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-50 flex items-center justify-between bg-white sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#006E62]/10 text-[#006E62] rounded-xl flex items-center justify-center">
              <Info size={20} />
            </div>
            <div>
              <h2 className="text-base font-black text-gray-800 tracking-tight leading-tight">Detail Izin</h2>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Informasi Izin Kerja</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 bg-gray-50 text-gray-400 rounded-xl flex items-center justify-center active:scale-90 transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar max-h-[70vh]">
          {/* Status Capsule */}
          <div className="flex items-center justify-between bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
             <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${getStatusBadgeColor(request.status)}`}>
                  {request.status === 'approved' ? <CheckCircle2 size={20} /> : request.status === 'rejected' ? <XCircle size={20} /> : request.status === 'negotiating' ? <MessageSquare size={20} /> : <Clock size={20} />}
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</p>
                  <p className={`text-sm font-black uppercase tracking-wide ${
                    request.status === 'approved' ? 'text-emerald-600' :
                    request.status === 'rejected' ? 'text-rose-600' :
                    request.status === 'negotiating' ? 'text-amber-600' :
                    'text-blue-600'
                  }`}>
                    {getStatusLabel(request.status)}
                  </p>
                </div>
             </div>
             <div className="text-right">
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Diajukan Pada</p>
                <p className="text-xs font-bold text-gray-700">{formatDateID(request.created_at)}</p>
             </div>
          </div>

          {/* Type & Date Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-1 h-4 bg-[#006E62] rounded-full"></div>
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Jenis & Waktu Izin</h4>
            </div>
            
            <div className="p-4 bg-white border border-gray-100 rounded-2xl shadow-sm space-y-3">
              <div className="flex items-center gap-2">
                <ShieldCheck size={14} className="text-[#006E62]" />
                <span className="text-sm font-black text-gray-800">{request.permission_type}</span>
              </div>
              <div className="flex items-center justify-between bg-gray-50 p-4 rounded-xl">
                <div className="text-center flex-1">
                  <p className="text-[8px] font-bold text-gray-400 uppercase mb-1">Mulai</p>
                  <p className="text-[11px] font-black text-gray-700">{formatDateID(request.start_date)}</p>
                </div>
                <ArrowRight size={14} className="text-gray-300 mx-2" />
                <div className="text-center flex-1">
                  <p className="text-[8px] font-bold text-gray-400 uppercase mb-1">Sampai</p>
                  <p className="text-[11px] font-black text-gray-700">{formatDateID(request.end_date)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Reason */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-1 h-4 bg-[#006E62] rounded-full"></div>
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Keterangan / Alasan</h4>
            </div>
            <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100 italic">
              <p className="text-sm text-gray-600 leading-relaxed">
                "{request.description || 'Tidak ada keterangan tambahan.'}"
              </p>
            </div>
          </div>

          {/* Attachment */}
          {request.file_id && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-1 h-4 bg-[#006E62] rounded-full"></div>
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Lampiran Pendukung</h4>
              </div>
              <div className="space-y-3">
                {googleDriveService.parseFileIds(request.file_id).map((file, idx) => (
                  <a 
                    key={idx}
                    href={googleDriveService.getFileUrl(`${file.id}|${file.name}`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl active:bg-gray-100 transition-all group"
                  >
                    <div className="w-10 h-10 bg-white shadow-sm border border-gray-100 rounded-xl flex items-center justify-center text-[#006E62] shrink-0">
                      <FileUp size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-black text-gray-800 tracking-tight truncate">{file.name || 'Lihat Lampiran'}</p>
                      <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest truncate">Google Drive</p>
                    </div>
                    <div className="p-2 text-emerald-600">
                      <Eye size={18} />
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Negotiation History / Tektokan Timeline */}
          {request.negotiation_data && request.negotiation_data.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                 <div className="w-1 h-4 bg-[#006E62] rounded-full"></div>
                 <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Histori Tektokan</h4>
              </div>
              <div className="space-y-4 relative before:absolute before:left-5 before:top-2 before:bottom-2 before:w-px before:bg-gray-100 px-1">
                {request.negotiation_data.map((nego, idx) => {
                  const isLast = idx === request.negotiation_data!.length - 1;
                  const displayName = nego.role === 'admin' 
                    ? (verifierInfo?.verifier?.full_name || 'Administrator') 
                    : user.full_name;
                  const statusLabel = getNegoStatusLabel(nego, isLast);

                  return (
                    <div key={idx} className="relative pl-10">
                      <div className={`absolute left-3 top-1 w-4 h-4 rounded-full border-2 border-white shadow-sm flex items-center justify-center ${nego.role === 'admin' ? 'bg-[#006E62]' : 'bg-blue-500'}`}>
                        {nego.role === 'admin' ? <ShieldCheck size={8} className="text-white" /> : <User size={8} className="text-white" />}
                      </div>
                      <button 
                        onClick={() => setSelectedNegoItem({ ...nego, displayName, statusLabel })}
                        className="w-full text-left bg-white border border-gray-100 p-4 rounded-2xl shadow-sm space-y-1 active:scale-[0.98] transition-all group"
                      >
                         {/* Line 1: Username (Left) */}
                         <div className="flex justify-between items-center">
                            <span className={`text-[10px] font-black uppercase tracking-widest ${nego.role === 'admin' ? 'text-[#006E62]' : 'text-blue-500'} truncate mr-2`}>
                              {displayName}
                            </span>
                            <ChevronRight size={14} className="text-gray-300 group-hover:text-gray-500 transition-colors" />
                         </div>

                         {/* Line 2: Start - End Date (Left) */}
                         <div className="text-[10px] font-bold text-gray-700">
                            {formatDateID(nego.start_date)} - {formatDateID(nego.end_date)}
                         </div>

                         {/* Line 3: DateTime (Left) | Label Status (Right) */}
                         <div className="flex justify-between items-end mt-1">
                            <span className="text-[9px] text-gray-400 font-bold uppercase tracking-tight">
                              {new Date(nego.timestamp).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest ${
                              statusLabel === 'Setuju' ? 'bg-emerald-50 text-emerald-600' :
                              statusLabel === 'Tolak' ? 'bg-rose-50 text-rose-600' :
                              statusLabel === 'Batal' ? 'bg-gray-50 text-gray-500' :
                              'bg-amber-50 text-amber-600'
                            }`}>
                              {statusLabel}
                            </span>
                         </div>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Verifier Info (Bottom) */}
          {verifierInfo && (
            <div className="space-y-4 pt-4">
               <div className="flex items-center gap-2 mb-2">
                  <div className="w-1 h-4 bg-emerald-500 rounded-full"></div>
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Diverifikasi Oleh</h4>
               </div>
               <div className="bg-emerald-50/30 border border-emerald-100/50 p-4 rounded-2xl flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white bg-emerald-100 flex items-center justify-center shrink-0">
                    {verifierInfo.verifier?.photo_google_id ? (
                      <img 
                        src={getPhotoUrl(verifierInfo.verifier.photo_google_id) || ''} 
                        className="w-full h-full object-cover" 
                        alt="" 
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <User size={24} className="text-emerald-600" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-black text-gray-800 leading-tight">{verifierInfo.verifier?.full_name || 'Administrator'}</p>
                    <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mt-0.5">
                      {new Date(verifierInfo.verified_at).toLocaleString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
               </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-50 bg-gray-50/50">
          <button
            onClick={onClose}
            className="w-full py-4 bg-[#006E62] text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-[#006E62]/20 active:scale-95 transition-all"
          >
            Tutup
          </button>
        </div>
      </div>

      {/* Sub-modal: Tektokan Detail Popup */}
      {selectedNegoItem && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-6 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-white w-full max-w-sm rounded-[32px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="p-6 space-y-6">
                 <div className="flex justify-between items-start">
                    <div className="space-y-1">
                       <h3 className="text-base font-black text-gray-800 leading-tight truncate max-w-[200px]">{selectedNegoItem.displayName}</h3>
                       <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest ${
                            selectedNegoItem.statusLabel === 'Setuju' ? 'bg-emerald-50 text-emerald-600' :
                            selectedNegoItem.statusLabel === 'Tolak' ? 'bg-rose-50 text-rose-600' :
                            'bg-amber-50 text-amber-600'
                          }`}>
                            {selectedNegoItem.statusLabel}
                          </span>
                          <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">
                            {new Date(selectedNegoItem.timestamp).toLocaleString('id-ID', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}
                          </span>
                       </div>
                    </div>
                    <button 
                      onClick={() => setSelectedNegoItem(null)}
                      className="w-8 h-8 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center active:scale-90 transition-all"
                    >
                      <X size={16} />
                    </button>
                 </div>

                 <div className="space-y-4">
                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-2">
                       <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Tanggal Diajukan</p>
                       <div className="flex items-center gap-2 text-xs font-black text-gray-700">
                          <span>{formatDateID(selectedNegoItem.start_date)}</span>
                          <ArrowRight size={12} className="text-gray-300" />
                          <span>{formatDateID(selectedNegoItem.end_date)}</span>
                       </div>
                    </div>

                    <div className="space-y-2 px-1">
                       <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Keterangan / Alasan</p>
                       <p className="text-sm text-gray-600 leading-relaxed italic">
                          "{selectedNegoItem.reason || 'Tidak ada keterangan.'}"
                       </p>
                    </div>
                 </div>

                 <button 
                  onClick={() => setSelectedNegoItem(null)}
                  className="w-full py-4 bg-gray-800 text-white rounded-2xl text-xs font-black uppercase tracking-widest active:scale-95 transition-all"
                 >
                    Kembali
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default IzinDetailModalUser;
