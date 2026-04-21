import React, { useState } from 'react';
import { X, Calendar, MessageSquare, CheckCircle2, XCircle, Clock, ArrowRight, FileText, Send, History, User, ShieldCheck, ClipboardList } from 'lucide-react';
import Swal from 'sweetalert2';
import { permissionService } from '../../services/permissionService';
import { googleDriveService } from '../../services/googleDriveService';
import { PermissionRequest, AuthUser } from '../../types';

interface PermissionDetailProps {
  request: PermissionRequest;
  user: AuthUser;
  onClose: () => void;
  onUpdate: () => void;
}

const PermissionDetail: React.FC<PermissionDetailProps> = ({ request, user, onClose, onUpdate }) => {
  const [isSaving, setIsSaving] = useState(false);

  const isAdmin = user?.role === 'admin' || user?.is_hr_admin || user?.is_performance_admin || user?.is_finance_admin;
  const isPending = request.status === 'pending';
  const isClosed = ['approved', 'rejected', 'cancelled'].includes(request.status);

  const handleAction = async (status: 'approved' | 'rejected' | 'cancelled') => {
    try {
      setIsSaving(true);
      await permissionService.updateStatus(
        request.id,
        status
      );
      Swal.fire({
        title: 'Berhasil!',
        text: `Status pengajuan telah diperbarui menjadi ${status === 'approved' ? 'Disetujui' : status === 'rejected' ? 'Ditolak' : 'Dibatalkan'}.`,
        icon: 'success',
        timer: 1500,
        showConfirmButton: false
      });
      onUpdate();
      onClose();
    } catch (error) {
      Swal.fire('Gagal', 'Terjadi kesalahan saat memproses aksi.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in slide-in-from-bottom duration-300">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#006E62]/10 rounded-xl flex items-center justify-center text-[#006E62]">
              <ClipboardList size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-800 uppercase tracking-tight">Detail Izin: {request.permission_type}</h3>
              <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">ID: {request.id.split('-')[0]}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-thin">
          {/* Status & Info Utama */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-2">Jadwal Izin Saat Ini</div>
                <div className="flex items-center gap-3 text-gray-800 font-bold">
                  <span className="text-lg">{new Date(request.start_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                  <ArrowRight size={16} className="text-gray-300" />
                  <span className="text-lg">{new Date(request.end_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex-1 p-3 bg-emerald-50/50 rounded-xl border border-emerald-100 flex items-center gap-3">
                  <ShieldCheck size={18} className="text-[#006E62]" />
                  <div>
                    <div className="text-[8px] font-bold text-gray-400 uppercase">Status</div>
                    <div className="text-[10px] font-bold text-[#006E62] uppercase tracking-wider">{request.status}</div>
                  </div>
                </div>
                {request.file_id && (
                  <a 
                    href={googleDriveService.getFileUrl(request.file_id)} 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex-1 p-3 bg-blue-50/50 rounded-xl border border-blue-100 flex items-center gap-3 hover:bg-blue-50 transition-colors"
                  >
                    <FileText size={18} className="text-blue-500" />
                    <div>
                      <div className="text-[8px] font-bold text-gray-400 uppercase">Dokumen</div>
                      <div className="text-[10px] font-bold text-blue-500 uppercase tracking-wider">Lihat Lampiran</div>
                    </div>
                  </a>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-white border border-gray-100 rounded-2xl shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <User size={14} className="text-[#006E62]" />
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Informasi Karyawan</span>
                </div>
                <div className="font-bold text-gray-800 text-sm">{request.account?.full_name}</div>
                <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{request.account?.internal_nik}</div>
              </div>
              
              <div className="p-4 bg-amber-50/50 border border-amber-100 rounded-2xl">
                <div className="flex items-center gap-2 mb-2 text-amber-600">
                  <Clock size={14} />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Status Pengajuan</span>
                </div>
                <div className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">
                  {request.status === 'pending' ? 'MENUNGGU PERSETUJUAN' : request.status.toUpperCase()}
                </div>
              </div>
            </div>
          </div>

          {/* Detail Alasan */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 px-1">
              <FileText size={16} className="text-gray-400" />
              <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Keterangan / Alasan</h4>
            </div>
            <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100">
              <p className="text-sm text-gray-700 leading-relaxed italic">
                "{request.description}"
              </p>
            </div>
          </div>

          {/* Panel Aksi */}
          {!isClosed && (
            <div className="pt-6 border-t border-gray-100 animate-in fade-in slide-in-from-top duration-500">
              <div className="flex flex-wrap gap-3">
                {isAdmin ? (
                  <>
                    <button 
                      onClick={() => handleAction('approved')}
                      disabled={isSaving}
                      className="flex-1 flex items-center justify-center gap-2 bg-[#006E62] text-white py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-[#005a50] shadow-lg shadow-[#006E62]/20 transition-all disabled:opacity-50"
                    >
                      <CheckCircle2 size={16} /> Setujui Izin
                    </button>
                    <button 
                      onClick={() => handleAction('rejected')}
                      disabled={isSaving}
                      className="flex-1 flex items-center justify-center gap-2 bg-rose-500 text-white py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-rose-600 shadow-lg shadow-rose-500/20 transition-all disabled:opacity-50"
                    >
                      <XCircle size={16} /> Tolak Izin
                    </button>
                  </>
                ) : isPending && (
                  <>
                    <button 
                      onClick={() => handleAction('cancelled')}
                      disabled={isSaving}
                      className="w-full flex items-center justify-center gap-2 bg-gray-400 text-white py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-gray-500 shadow-lg shadow-gray-400/20 transition-all disabled:opacity-50"
                    >
                      <XCircle size={16} /> Batalkan Pengajuan
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PermissionDetail;
