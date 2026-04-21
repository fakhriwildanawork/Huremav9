
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
  User,
  ShieldCheck
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
      case 'cancelled': return 'bg-gray-500/10 text-gray-500';
      default: return 'bg-blue-500/10 text-blue-500';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'approved': return 'Disetujui';
      case 'rejected': return 'Ditolak';
      case 'cancelled': return 'Dibatalkan';
      default: return 'Pending';
    }
  };

  const formatDateCustom = (dateStr: string) => {
    if (!dateStr) return '-';
    try {
      const date = new Date(dateStr);
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
      const day = date.getDate().toString().padStart(2, '0');
      const month = months[date.getMonth()];
      const year = date.getFullYear();
      return `${day} ${month} ${year}`;
    } catch (e) {
      return dateStr;
    }
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
        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
          {/* Status Capsule */}
          <div className="flex items-center justify-between bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
             <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${getStatusBadgeColor(request.status)}`}>
                  {request.status === 'approved' ? <CheckCircle2 size={20} /> : request.status === 'rejected' ? <XCircle size={20} /> : <Clock size={20} />}
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</p>
                  <p className={`text-sm font-black uppercase tracking-wide ${
                    request.status === 'approved' ? 'text-emerald-600' :
                    request.status === 'rejected' ? 'text-rose-600' :
                    'text-blue-600'
                  }`}>
                    {getStatusLabel(request.status)}
                  </p>
                </div>
             </div>
             <div className="text-right">
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Diajukan Pada</p>
                <p className="text-xs font-bold text-gray-700">{formatDateCustom(request.created_at)}</p>
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
                  <p className="text-[11px] font-black text-gray-700">{formatDateCustom(request.start_date)}</p>
                </div>
                <ArrowRight size={14} className="text-gray-300 mx-2" />
                <div className="text-center flex-1">
                  <p className="text-[8px] font-bold text-gray-400 uppercase mb-1">Sampai</p>
                  <p className="text-[11px] font-black text-gray-700">{formatDateCustom(request.end_date)}</p>
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
              <p className="text-sm text-gray-600 leading-relaxed break-words whitespace-pre-wrap">
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

          {/* Verifier Info (Bottom) */}
          {verifierInfo && (
            <div className="space-y-4 pt-4 animate-in fade-in slide-in-from-bottom duration-500">
               <div className="flex items-center gap-2 mb-2 px-1">
                  <ShieldCheck size={16} className="text-[#006E62]" />
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Informasi Verifikasi</h4>
               </div>
               
               <div className="bg-[#006E62]/5 border border-[#006E62]/10 rounded-2xl overflow-hidden">
                  <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-full overflow-hidden border-4 border-white bg-[#006E62]/10 flex items-center justify-center shrink-0 shadow-sm">
                        {verifierInfo.verifier?.photo_google_id ? (
                          <img 
                            src={getPhotoUrl(verifierInfo.verifier.photo_google_id) || ''} 
                            className="w-full h-full object-cover" 
                            alt="" 
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <User size={28} className="text-[#006E62]" />
                        )}
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-[#006E62]/50 uppercase tracking-[0.2em] mb-0.5">Verifikator</p>
                        <p className="text-sm font-black text-gray-800 leading-tight">{verifierInfo.verifier?.full_name || 'Administrator'}</p>
                        <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-tight">
                          {formatDateCustom(verifierInfo.verified_at)} • {new Date(verifierInfo.verified_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2 border-t md:border-t-0 md:border-l border-[#006E62]/10 pt-4 md:pt-0 md:pl-6 min-h-[50px] flex flex-col justify-center">
                      <p className="text-[10px] font-black text-[#006E62]/50 uppercase tracking-[0.2em]">Catatan / Alasan Verifikasi</p>
                      <p className="text-xs text-gray-600 italic leading-relaxed font-medium break-words whitespace-pre-wrap">
                        "{verifierInfo.verification_notes || (request.status === 'approved' ? 'Disetujui tanpa catatan tambahan.' : 'Ditolak tanpa catatan tambahan.')}"
                      </p>
                    </div>
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
    </div>
  );
};

export default IzinDetailModalUser;
