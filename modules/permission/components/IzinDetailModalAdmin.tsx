
import React from 'react';
import { PermissionRequest } from '../../../types';
import DetailModulLayoutAdmin from '../../../components/ui/DetailModulLayoutAdmin';
import { formatDateID } from '../../../utils/dateFormatter';
import { googleDriveService } from '../../../services/googleDriveService';
import { FileUp, Calendar, CheckCircle, XCircle, Clock, CheckCircle2, Eye, History, ArrowRight } from 'lucide-react';

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
              'bg-amber-500/10 text-amber-500'
            }`}>
              {request.status === 'approved' ? <CheckCircle2 size={20} /> : request.status === 'rejected' ? <XCircle size={20} /> : <Clock size={20} />}
            </div>
            <div>
              <p className="text-[10px] font-black text-center text-gray-400 uppercase tracking-widest">Status Saat Ini</p>
              <p className={`text-sm font-black text-center uppercase tracking-wide ${
                request.status === 'approved' ? 'text-emerald-600' :
                request.status === 'rejected' ? 'text-rose-600' :
                'text-amber-600'
              }`}>
                {request.status === 'approved' ? 'Disetujui' : request.status === 'rejected' ? 'Ditolak' : request.status === 'negotiating' ? 'Negosiasi' : 'Pending'}
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

        {/* Riwayat Negosiasi - Added for Izin specifically since it has negotiation */}
        {request.negotiation_data && request.negotiation_data.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-1 h-4 bg-[#006E62] rounded-full"></div>
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Riwayat Perubahan / Negosiasi</h4>
            </div>
            <div className="space-y-3 relative before:absolute before:left-6 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-100">
              {request.negotiation_data.map((nego, idx) => (
                <div key={idx} className="relative pl-12">
                  <div className={`absolute left-4 top-1.5 w-4 h-4 rounded-full border-2 border-white shadow-sm ${nego.role === 'admin' ? 'bg-[#006E62]' : 'bg-blue-500'}`}></div>
                  <div className="bg-white border border-gray-100 p-4 rounded-2xl shadow-sm">
                    <div className="flex justify-between items-center mb-1">
                      <span className={`text-[8px] font-black uppercase tracking-wider ${nego.role === 'admin' ? 'text-[#006E62]' : 'text-blue-500'}`}>
                        {nego.role === 'admin' ? 'ADMINISTRATOR' : 'KARYAWAN'}
                      </span>
                      <span className="text-[8px] text-gray-300 font-bold">{new Date(nego.timestamp).toLocaleString('id-ID')}</span>
                    </div>
                    <p className="text-[10px] text-gray-600 leading-relaxed line-clamp-2 italic">"{nego.reason}"</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

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
      </div>
    </DetailModulLayoutAdmin>
  );
};

export default IzinDetailModalAdmin;
