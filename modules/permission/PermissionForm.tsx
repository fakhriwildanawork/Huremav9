import React, { useState, useEffect } from 'react';
import { X, Save, Calendar, FileText, Upload, Info, ClipboardList, Loader2, Search, ChevronDown } from 'lucide-react';
import { PermissionRequestInput, Account, AuthUser } from '../../types';
import { googleDriveService } from '../../services/googleDriveService';
import { authService } from '../../services/authService';
import { accountFilterHelper } from '../../utils/accountFilterHelper';
import AccountListItem from '../../components/Common/AccountListItem';
import Swal from 'sweetalert2';
import { MainButtonStyle } from '../../utils/mainButtonStyle';
import { CancelButtonStyle } from '../../utils/cancelButtonStyle';

interface PermissionFormProps {
  accountId: string;
  isAdmin?: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  onSubmit?: (data: PermissionRequestInput) => void;
}

const PERMISSION_TYPES = [
  'Izin Sakit',
  'Izin Keperluan Mendesak',
  'Izin Dukacita',
  'Lain-lain'
];

const PermissionForm: React.FC<PermissionFormProps> = ({ 
  accountId, 
  isAdmin = false,
  onClose, 
  onSuccess,
  onSubmit 
}) => {
  const [formData, setFormData] = useState<PermissionRequestInput>({
    account_id: accountId,
    permission_type: PERMISSION_TYPES[0],
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    description: '',
    file_id: null
  });

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showEmployeeList, setShowEmployeeList] = useState(false);

  const displayAccounts = accountFilterHelper.filter(accounts, currentUser, 'isolasi');
  const selectedEmployee = accounts.find(acc => acc.id === formData.account_id);
  const filteredAccounts = displayAccounts.filter(acc => 
    acc.full_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    acc.internal_nik.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    setCurrentUser(authService.getCurrentUser());
  }, []);

  useEffect(() => {
    if (isAdmin) {
      setLoadingAccounts(true);
      import('../../services/accountService').then(({ accountService }) => {
        accountService.getAll().then(data => {
          setAccounts(data as Account[]);
          setLoadingAccounts(false);
        });
      });
    }
  }, [isAdmin]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const fileId = await googleDriveService.uploadFile(file);
      setFormData(prev => ({ ...prev, file_id: fileId }));
    } catch (error) {
      Swal.fire('Gagal', 'Gagal mengunggah file.', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (new Date(formData.start_date) > new Date(formData.end_date)) {
      Swal.fire('Peringatan', 'Tanggal awal tidak boleh lebih besar dari tanggal akhir.', 'warning');
      return;
    }

    if (isAdmin && !formData.account_id) {
      Swal.fire('Peringatan', 'Pilih karyawan terlebih dahulu.', 'warning');
      return;
    }

    if (onSuccess) {
      try {
        setSubmitting(true);
        const { permissionService } = await import('../../services/permissionService');
        await permissionService.create(formData, isAdmin ? 'approved' : 'pending', accountId);
        onSuccess();
        Swal.fire({
          title: 'Berhasil',
          text: isAdmin ? 'Data berhasil ditambahkan.' : 'Pengajuan Anda telah dikirim.',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
      } catch (error) {
        Swal.fire('Gagal', 'Terjadi kesalahan saat menyimpan data.', 'error');
      } finally {
        setSubmitting(false);
      }
    } else if (onSubmit) {
      onSubmit(formData);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-300">
      <div className="bg-white w-full max-h-[95vh] sm:max-w-lg rounded-t-[32px] sm:rounded-[32px] shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom-10 duration-500">
        <div className="px-8 py-5 border-b border-gray-50 flex items-center justify-between bg-gray-50/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#006E62]/10 rounded-xl flex items-center justify-center text-[#006E62]">
              <ClipboardList size={20} />
            </div>
            <div>
              <h3 className="text-sm font-black text-gray-800 tracking-tight">Form Pengajuan Izin</h3>
              <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest leading-tight">
                {isAdmin ? 'Manual Input oleh Admin' : 'Pengajuan Mandiri'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center active:scale-90 transition-all">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
            {isAdmin && (
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Pilih Karyawan (*)</label>
                
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowEmployeeList(!showEmployeeList)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-[#006E62] transition-all"
                  >
                    <span>{selectedEmployee ? selectedEmployee.full_name : '-- Pilih Karyawan --'}</span>
                    <ChevronDown size={16} className={`transition-transform duration-200 ${showEmployeeList ? 'rotate-180' : ''}`} />
                  </button>

                  {showEmployeeList && (
                    <div className="absolute top-full left-0 right-0 z-[110] mt-2 bg-white border border-gray-100 rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[300px] animate-in slide-in-from-top-2 duration-200">
                      <div className="p-3 border-b border-gray-50 bg-gray-50/50">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                          <input
                            type="text"
                            placeholder="Cari nama atau NIK..."
                            className="w-full pl-9 pr-4 py-2 bg-white border border-gray-100 rounded-xl text-xs font-medium outline-none focus:ring-1 focus:ring-[#006E62]"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      </div>
                      <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                        {loadingAccounts ? (
                          <div className="py-8 flex justify-center"><Loader2 size={16} className="animate-spin text-[#006E62]" /></div>
                        ) : filteredAccounts.length === 0 ? (
                          <div className="py-8 text-center text-[10px] font-bold text-gray-400 uppercase">Karyawan tidak ditemukan</div>
                        ) : (
                          filteredAccounts.map(acc => (
                            <AccountListItem
                              key={acc.id}
                              account={acc}
                              isSelected={formData.account_id === acc.id}
                              onClick={() => {
                                setFormData(prev => ({ ...prev, account_id: acc.id }));
                                setShowEmployeeList(false);
                              }}
                            />
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Jenis Izin (*)</label>
              <select
                required
                name="permission_type"
                value={formData.permission_type}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-[#006E62] transition-all"
              >
                {PERMISSION_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Tanggal Awal</label>
                <input 
                  required
                  type="date" 
                  name="start_date" 
                  value={formData.start_date} 
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold text-gray-800 outline-none focus:ring-2 focus:ring-[#006E62] transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Tanggal Akhir</label>
                <input 
                  required
                  type="date" 
                  name="end_date" 
                  value={formData.end_date} 
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold text-gray-800 outline-none focus:ring-2 focus:ring-[#006E62] transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Keterangan / Alasan (*)</label>
              <textarea 
                required
                name="description" 
                value={formData.description} 
                onChange={handleChange}
                rows={3}
                placeholder="Jelaskan detail keperluan izin..."
                className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-medium text-gray-700 outline-none focus:ring-2 focus:ring-[#006E62] transition-all resize-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Lampiran (Opsional)</label>
              <div className="flex items-center gap-3">
                <label className="flex-1 flex items-center justify-center gap-2 px-5 py-3.5 bg-gray-50 border border-dashed border-gray-200 rounded-2xl cursor-pointer hover:bg-gray-100 transition-all group overflow-hidden">
                  <Upload size={16} className="text-gray-400 group-hover:text-[#006E62]" />
                  <span className="text-[10px] font-bold text-gray-500 uppercase truncate">
                    {formData.file_id ? 'File Terunggah' : 'Pilih Gambar/PDF'}
                  </span>
                  <input type="file" className="hidden" accept="image/*,application/pdf" onChange={handleFileUpload} />
                </label>
                {uploading && <Loader2 size={16} className="text-[#006E62] animate-spin" />}
              </div>
            </div>

            </div>

          <div className="p-8 border-t border-gray-50 bg-white space-y-2 shrink-0">
            <button 
              type="submit"
              disabled={uploading || submitting}
              className={MainButtonStyle}
            >
              {submitting ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
              {submitting ? 'Memproses...' : isAdmin ? 'Tambahkan Data' : 'Kirim Pengajuan'}
            </button>
            <button 
              type="button" 
              onClick={onClose}
              className={CancelButtonStyle}
            >
              Batal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PermissionForm;
