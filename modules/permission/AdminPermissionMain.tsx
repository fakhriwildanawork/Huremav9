
import React, { useState } from 'react';
import { 
  Search, 
  Plus, 
  Filter, 
  Trash2, 
  Clock, 
  CheckCircle2, 
  Calendar, 
  XCircle, 
  User,
  ShieldCheck,
  MessageSquare
} from 'lucide-react';
import { submissionService } from '../../services/submissionService';
import { permissionService } from '../../services/permissionService';
import { googleDriveService } from '../../services/googleDriveService';
import { Submission, AuthUser, PermissionRequest } from '../../types';
import { AdminMadeDeletion } from '../../lib/adminAuthHelper';
import { MainButtonStyle } from '../../utils/mainButtonStyle';
import Swal from 'sweetalert2';
import PermissionForm from './PermissionForm';
import Pagination from '../../components/Common/Pagination';
import IzinDetailModalAdmin from './components/IzinDetailModalAdmin';

import { useHRAdminSubmissionScheme } from '../../utils/hrAdminSubmissionScheme';

interface AdminPermissionMainProps {
  user: AuthUser;
}

const AdminPermissionMain: React.FC<AdminPermissionMainProps> = ({ user }) => {
  const {
    data: requests,
    totalCount,
    isLoading,
    page,
    setPage,
    searchTerm,
    setSearchTerm,
    statusFilter,
    handleSearch,
    handleStatusChange: handleStatusFilterChange,
    refresh,
    pageSize: limit
  } = useHRAdminSubmissionScheme('Izin', user);

  const [selectedRequest, setSelectedRequest] = useState<Submission | null>(null);
  const [showForm, setShowForm] = useState(false);

  const handleVerify = async (id: string, status: 'approved' | 'rejected') => {
    const dbStatus = status === 'approved' ? 'Disetujui' : 'Ditolak';
    try {
      await submissionService.verify(id, dbStatus, user.id);
      refresh();
      setSelectedRequest(null);
      Swal.fire('Berhasil', `Pengajuan telah ${dbStatus.toLowerCase()}.`, 'success');
    } catch (error) {
      Swal.fire('Gagal', 'Gagal memproses verifikasi.', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: 'Hapus data?',
      text: "Aksi ini tidak dapat dibatalkan.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Ya, Hapus!'
    });

    if (result.isConfirmed) {
      try {
        await submissionService.delete(id);
        refresh();
        Swal.fire('Berhasil', 'Data telah dihapus.', 'success');
      } catch (error) {
        Swal.fire('Gagal', 'Gagal menghapus data.', 'error');
      }
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Disetujui':
        return <span className="px-2 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 w-fit"><CheckCircle2 size={10} /> Disetujui</span>;
      case 'Ditolak':
        return <span className="px-2 py-1 bg-rose-50 text-rose-600 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 w-fit"><XCircle size={10} /> Ditolak</span>;
      case 'Negosiasi':
        return <span className="px-2 py-1 bg-amber-50 text-amber-600 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 w-fit"><MessageSquare size={10} /> Negosiasi</span>;
      default:
        return <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 w-fit"><Clock size={10} /> Pending</span>;
    }
  };

  // Helper to map submission to permission request structure for detail modal
  const mapToPermissionRequest = (sub: Submission): PermissionRequest => {
    return {
      id: sub.submission_data?.permission_request_id || sub.id,
      account_id: sub.account_id,
      permission_type: sub.submission_data?.permission_type || 'Izin',
      start_date: sub.submission_data?.start_date || '',
      end_date: sub.submission_data?.end_date || sub.submission_data?.start_date || '',
      description: sub.description || '',
      status: sub.status === 'Disetujui' ? 'approved' : 
              sub.status === 'Ditolak' ? 'rejected' : 
              sub.status === 'Negosiasi' ? 'negotiating' : 
              sub.status === 'Dibatalkan' ? 'cancelled' : 'pending',
      file_id: sub.file_id || sub.submission_data?.file_id || null,
      current_negotiator_role: (sub as any).submission_data?.current_negotiator_role || (sub.status === 'Negosiasi' ? 'admin' : 'user'),
      negotiation_data: (sub as any).submission_data?.negotiation_data || [],
      created_at: sub.created_at,
      account: sub.account
    };
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Search & Filter Header Section */}
      <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div>
            <h2 className="text-xl font-black text-gray-800 tracking-tight">Manajemen Izin Karyawan</h2>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 cursor-pointer" size={18} onClick={handleSearch} />
            <input 
              type="text"
              placeholder="Cari nama atau NIK..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-[#006E62] w-full sm:w-64 transition-all"
            />
          </form>
          <select 
            value={statusFilter}
            onChange={(e) => handleStatusFilterChange(e.target.value)}
            className="px-6 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-black text-gray-600 outline-none focus:ring-2 focus:ring-[#006E62] transition-all uppercase tracking-widest"
          >
            <option value="SEMUA STATUS">Semua Status</option>
            <option value="Pending">Pending</option>
            <option value="Negosiasi">Negosiasi</option>
            <option value="Disetujui">Disetujui</option>
            <option value="Ditolak">Ditolak</option>
          </select>
          <button 
            onClick={() => setShowForm(true)}
            className={`${MainButtonStyle} !w-fit !px-6 !py-3 !text-xs !shadow-none`}
          >
             TAMBAH
          </button>
        </div>
      </div>

      {/* Table - Optimized Standard */}
      <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Karyawan</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Tanggal Pengajuan</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Keterangan</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Status</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-10 h-10 border-4 border-[#006E62]/20 border-t-[#006E62] rounded-full animate-spin"></div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Memuat Data...</span>
                    </div>
                  </td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center text-gray-400 italic text-xs font-medium">Tidak ada data yang ditemukan.</td>
                </tr>
              ) : (
                requests.map((req) => (
                  <tr 
                    key={req.id} 
                    onClick={() => setSelectedRequest(req)}
                    className="hover:bg-gray-50/80 transition-all cursor-pointer group"
                  >
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-white shadow-sm border border-gray-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                          {req.account?.photo_google_id ? (
                            <img 
                              src={googleDriveService.getFileUrl(req.account.photo_google_id)} 
                              alt={req.account.full_name}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <User size={20} className="text-gray-300" />
                          )}
                        </div>
                        <div>
                          <p className="text-xs font-black text-gray-800 leading-tight">{req.account?.full_name}</p>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">{req.account?.internal_nik}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400">
                          <Calendar size={14} />
                        </div>
                        <span className="text-xs font-bold text-gray-700">
                          {req.submission_data?.start_date ? new Date(req.submission_data.start_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <p className="text-xs text-gray-600 line-clamp-1 italic max-w-xs leading-relaxed">
                        {req.description || '-'}
                      </p>
                    </td>
                    <td className="px-8 py-5 text-center">
                      <div className="flex justify-center">
                        {getStatusBadge(req.status)}
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex justify-end items-center gap-3">
                        {AdminMadeDeletion(req) && (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(req.id);
                            }}
                            className="p-2 text-rose-500 hover:bg-rose-50 hover:text-rose-600 transition-colors active:scale-90"
                            title="Hapus Data Admin"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Section */}
      <div className="mt-8 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden mb-8">
        <Pagination
          currentPage={page}
          totalCount={totalCount}
          pageSize={limit}
          onPageChange={(p) => setPage(p)}
          itemName="DATA PENGAJUAN"
        />
      </div>

      {/* Modal Detail */}
      {selectedRequest && (
        <IzinDetailModalAdmin 
          request={mapToPermissionRequest(selectedRequest)}
          onClose={() => setSelectedRequest(null)}
          onVerify={handleVerify}
          onDelete={handleDelete}
          canDelete={AdminMadeDeletion(selectedRequest)}
        />
      )}

      {/* Modal Form Tambah (Admin) */}
      {showForm && (
        <PermissionForm 
          accountId={user.id}
          isAdmin={true}
          onClose={() => setShowForm(false)}
          onSuccess={() => {
            setShowForm(false);
            refresh();
          }}
        />
      )}
    </div>
  );
};

export default AdminPermissionMain;
