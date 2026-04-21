
import React, { useState, useEffect } from 'react';
import { PermissionRequest } from '../../../types';
import DetailModulLayoutAdmin from '../../../components/ui/DetailModulLayoutAdmin';
import { formatDateID } from '../../../utils/dateFormatter';
import { googleDriveService } from '../../../services/googleDriveService';
import { permissionService } from '../../../services/permissionService';
import { FileUp, Calendar, CheckCircle, XCircle, Clock, CheckCircle2, Eye, ArrowRight, User, ShieldCheck } from 'lucide-react';

interface IzinDetailModalAdminProps {
  request: PermissionRequest;
  onClose: () => void;
  onVerify: (id: string, status: 'approved' | 'rejected', notes?: string) => void;
  onDelete?: (id: string) => void;
  canDelete?: boolean;
}

const IzinDetailModalAdmin: React.FC<IzinDetailModalAdminProps> = ({
  request,
  onClose,
  onVerify,
  onDelete,
  canDelete = false
}) => {
  const [verifierInfo, setVerifierInfo] = useState<any>(null);
  const [isLoadingVerifier, setIsLoadingVerifier] = useState(false);

  useEffect(() => {
    if (request.status === 'approved' || request.status === 'rejected') {
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

  const accountData = request.account ? {
    id: request.account_id,
    full_name: request.account.full_name,
    internal_nik: request.account.internal_nik,
    photo_google_id: request.account.photo_google_id,
    grade: (request.account as any).grade,
    position: (request.account as any).position,
    location: (request.account as any).location
  } : null;

  return (
    <DetailModulLayoutAdmin
      title="Detail Pengajuan Izin"
      accountData={accountData}
      onClose={onClose}
      footerActions={
        <div className="flex gap-3">
          {request.status === 'pending' && (
            <>
              <button
                onClick={() => onVerify(request.id, 'rejected')}
                className="px-6 py-3 bg-rose-50 text-rose-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-rose-100 transition-all flex items-center gap-2"
              >
                <XCircle size={16} /> Tolak
              </button>
              <button
                onClick={() => onVerify(request.id, 'approved')}
                className="px-6 py-3 bg-[#006E62] text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-[#004D45] transition-all flex items-center gap-2 shadow-lg shadow-[#006E62]/20"
              >
                <CheckCircle size={16} /> Setujui
              </button>
            </>
          )}
          {canDelete && (
            <button
              onClick={() => onDelete?.(request.id)}
              className="px-6 py-3 bg-gray-100 text-gray-400 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-rose-50 hover:text-rose-600 transition-all flex items-center gap-2"
            >
              <XCircle size={16} className="rotate-45" /> Hapus
            </button>
          )}
        </div>
      }
    >
      <div className="space-y-8">
        {/* Info Cards Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100 flex items-center justify-center gap-4">
            <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500">
              <Calendar size={20} />
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-400 text-center uppercase tracking-widest">Waktu Pengajuan</p>
              <p className="text-sm font-bold text-center text-gray-700">{formatDateID(request.created_at)}</p>
            </div>
          </div>
          <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100 flex items-center justify-center gap-4">
            <div className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center ${
              request.status === 'approved' ? 'bg-emerald-500/10 text-emerald-500' :
              request.status === 'rejected' ? 'bg-rose-500/10 text-rose-500' :
              'bg-blue-500/10 text-blue-500'
            }`}>
              {request.status === 'approved' ? <CheckCircle2 size={20} /> : request.status === 'rejected' ? <XCircle size={20} /> : <Clock size={20} />}
            </div>
            <div>
              <p className="text-[10px] font-black text-center text-gray-400 uppercase tracking-widest">Status Saat Ini</p>
              <p className={`text-sm font-black text-center uppercase tracking-wide ${
                request.status === 'approved' ? 'text-emerald-600' :
                request.status === 'rejected' ? 'text-rose-600' :
                'text-blue-600'
              }`}>
                {request.status === 'approved' ? 'Disetujui' : request.status === 'rejected' ? 'Ditolak' : 'Pending'}
              </p>
            </div>
          </div>
        </div>

        {/* Specific Data Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1 h-4 bg-[#006E62] rounded-full"></div>
            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Informasi Izin</h4>
          </div>
          
          <div className="bg-[#006E62]/5 border border-[#006E62]/10 p-4 rounded-2xl grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div>
              <p className="text-[9px] font-bold text-center text-gray-400 uppercase mb-1">Jenis Izin</p>
              <p className="text-sm font-black text-center text-[#006E62]">{request.permission_type}</p>
            </div>
            <div className="sm:col-span-2 flex items-center justify-center gap-4">
              <div className="text-center">
                <p className="text-[9px] font-bold text-gray-400 uppercase mb-1">Mulai</p>
                <p className="text-sm font-black text-[#006E62]">{formatDateID(request.start_date)}</p>
              </div>
              <ArrowRight size={14} className="text-[#006E62]/30 mt-3" />
              <div className="text-center">
                <p className="text-[9px] font-bold text-gray-400 uppercase mb-1">Berakhir</p>
                <p className="text-sm font-black text-[#006E62]">{formatDateID(request.end_date)}</p>
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
          <div className="bg-gray-50 p-6 rounded-[32px] border border-gray-100">
            <p className="text-sm text-gray-600 leading-relaxed italic">
              "{request.description || 'Tidak ada keterangan tambahan.'}"
            </p>
          </div>
        </div>

        {/* Attachment Section */}
        {request.file_id && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-1 h-4 bg-[#006E62] rounded-full"></div>
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Lampiran Pendukung</h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {googleDriveService.parseFileIds(request.file_id).map((file, idx) => (
                <a 
                  key={idx}
                  href={googleDriveService.getFileUrl(`${file.id}|${file.name}`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl hover:bg-gray-100 transition-all group overflow-hidden"
                >
                  <div className="w-10 h-10 bg-white shadow-sm border border-gray-100 rounded-xl flex items-center justify-center text-[#006E62] shrink-0">
                    <FileUp size={20} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-black text-gray-800 tracking-tight truncate">{file.name || 'Lihat Lampiran'}</p>
                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Google Drive</p>
                  </div>
                  <div className="p-2 text-gray-300 group-hover:text-[#006E62] transition-colors">
                    <Eye size={16} />
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
                          src={googleDriveService.getFileUrl(verifierInfo.verifier.photo_google_id)} 
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
                        {formatDateID(verifierInfo.verified_at)} • {new Date(verifierInfo.verified_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 border-t md:border-t-0 md:border-l border-[#006E62]/10 pt-4 md:pt-0 md:pl-6 min-h-[50px] flex flex-col justify-center">
                    <p className="text-[10px] font-black text-[#006E62]/50 uppercase tracking-[0.2em]">Catatan / Alasan Verifikasi</p>
                    <p className="text-xs text-gray-600 italic leading-relaxed font-medium">
                      "{verifierInfo.verification_notes || (request.status === 'approved' ? 'Disetujui tanpa catatan tambahan.' : 'Ditolak tanpa catatan tambahan.')}"
                    </p>
                  </div>
                </div>
             </div>
          </div>
        )}
      </div>
    </DetailModulLayoutAdmin>
  );
};

export default IzinDetailModalAdmin;
