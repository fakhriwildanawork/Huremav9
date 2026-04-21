
import React, { useState, useEffect, useRef } from 'react';
import { X, Save, Calendar, AlertCircle, Upload, Trash2, Loader2, FileUp, ArrowLeft } from 'lucide-react';
import { PermissionRequestInput, PermissionRequest, AuthUser } from '../../types';
import { permissionService } from '../../services/permissionService';
import { googleDriveService } from '../../services/googleDriveService';
import { formatDateID } from '../../utils/dateFormatter';
import { MainButtonStyle } from '../../utils/mainButtonStyle';
import { CancelButtonStyle } from '../../utils/cancelButtonStyle';
import { validateMaxUploadSize } from '../../utils/maxUploadSize';
import Swal from 'sweetalert2';

interface IzinUserFormPageProps {
  user: AuthUser;
  onBack: () => void;
  onSuccess: () => void;
  editData?: PermissionRequest | null;
  existingRequests?: PermissionRequest[];
}

const IzinUserFormPage: React.FC<IzinUserFormPageProps> = ({ 
  user, 
  onBack, 
  onSuccess,
  editData,
  existingRequests = []
}) => {
  const accountId = user.id;
  const [formData, setFormData] = useState<PermissionRequestInput>({
    account_id: accountId,
    permission_type: 'Izin Sakit',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    description: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // File upload state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (editData) {
      setFormData({
        account_id: editData.account_id,
        permission_type: editData.permission_type || 'Izin Sakit',
        start_date: editData.start_date,
        end_date: editData.end_date,
        description: editData.description || ''
      });
    }
  }, [editData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateConflict = () => {
    const conflict = existingRequests.find(req => 
      req.start_date === formData.start_date && 
      (req.status === 'pending' || req.status === 'approved' || req.status === 'negotiating') &&
      req.id !== editData?.id
    );

    if (conflict) {
      Swal.fire({
        title: 'Tanggal Berkonflik',
        text: `Anda sudah memiliki pengajuan pada tanggal ${formatDateID(formData.start_date)} dengan status ${conflict.status === 'approved' ? 'Disetujui' : conflict.status === 'negotiating' ? 'Negosiasi' : 'Pending'}.`,
        icon: 'warning',
        confirmButtonColor: '#006E62'
      });
      return true;
    }
    return false;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // MANDATORY Attachment Check
    if (!selectedFile && !editData?.file_id) {
       Swal.fire({
         title: 'Lampiran Wajib',
         text: 'Mohon unggah bukti lampiran terlebih dahulu.',
         icon: 'error',
         confirmButtonColor: '#006E62'
       });
       return;
    }

    if (validateConflict()) return;

    setIsSubmitting(true);
    try {
      let finalFileId = editData?.file_id || null;

      if (selectedFile) {
        setIsUploading(true);
        try {
          finalFileId = await googleDriveService.uploadFile(selectedFile);
        } catch (uploadError) {
          console.error('File Upload Error:', uploadError);
          Swal.fire('Gagal Upload', 'Gagal mengunggah lampiran. Silakan coba lagi.', 'error');
          setIsSubmitting(false);
          setIsUploading(false);
          return;
        }
        setIsUploading(false);
      }

      const submissionData = {
        ...formData,
        file_id: finalFileId
      };

      await permissionService.create(submissionData);
      
      // Cleanup logic if it's a re-submission of a rejected request
      if (editData && editData.status === 'rejected') {
        try {
          // Delete old record and associated submissions
          await permissionService.delete(editData.id);
          // Delete old file from Google Drive if it exists
          if (editData.file_id) {
            await googleDriveService.deleteFile(editData.file_id);
          }
        } catch (cleanupError) {
          console.warn('Silent cleanup error:', cleanupError);
        }
      }

      onSuccess();
      Swal.fire({
        title: 'Berhasil',
        text: editData ? 'Pengajuan ulang telah dikirim.' : 'Pengajuan izin telah dikirim.',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      });
    } catch (error) {
      console.error(error);
      Swal.fire('Gagal', 'Terjadi kesalahan saat memproses data.', 'error');
    } finally {
      setIsSubmitting(false);
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!validateMaxUploadSize(file)) {
        return;
      }
      setSelectedFile(file);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="px-6 pt-8 pb-5 border-b border-gray-50 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-md z-30 shrink-0">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack}
            className="w-10 h-10 bg-gray-50 text-gray-400 rounded-xl flex items-center justify-center active:scale-90 transition-all font-bold"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-lg font-bold text-gray-800 tracking-tight">Form Izin</h2>
            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest leading-tight">
              Pengajuan Izin Karyawan
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          <div className="space-y-5">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Jenis Izin (*)</label>
              <select 
                required 
                name="permission_type" 
                value={formData.permission_type} 
                onChange={handleChange} 
                className="w-full px-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-[#006E62] transition-all"
              >
                <option value="Izin Sakit">Izin Sakit</option>
                <option value="Izin Keperluan Mendesak">Izin Keperluan Mendesak</option>
                <option value="Izin Dukacita">Izin Dukacita</option>
                <option value="Lain-lain">Lain-lain</option>
              </select>
            </div>

            <div className="grid grid-cols-1 gap-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Mulai Tgl</label>
                <input 
                  type="date"
                  required 
                  name="start_date" 
                  value={formData.start_date} 
                  onChange={handleChange} 
                  className="w-full px-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl text-[13px] font-black text-gray-800 outline-none focus:ring-2 focus:ring-[#006E62] transition-all text-center [&::-webkit-calendar-picker-indicator]:hidden"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Hingga Tgl</label>
                <input 
                  type="date"
                  required 
                  name="end_date" 
                  value={formData.end_date} 
                  onChange={handleChange} 
                  className="w-full px-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl text-[13px] font-black text-gray-800 outline-none focus:ring-2 focus:ring-[#006E62] transition-all text-center [&::-webkit-calendar-picker-indicator]:hidden"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Keterangan / Alasan</label>
              <textarea 
                required
                name="description" 
                value={formData.description} 
                onChange={handleChange} 
                rows={4} 
                placeholder="Berikan alasan yang jelas..."
                className="w-full px-5 py-5 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-medium text-gray-700 outline-none focus:ring-2 focus:ring-[#006E62] transition-all resize-none" 
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Lampiran (Wajib *)</label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 flex items-center justify-center gap-3 px-5 py-4 bg-gray-50 border border-gray-100 border-dashed rounded-2xl text-xs font-bold text-gray-400 hover:bg-gray-100 transition-all group"
                >
                  {selectedFile ? (
                    <>
                      <FileUp size={18} className="text-[#006E62]" />
                      <span className="text-gray-700 truncate max-w-[200px]">{selectedFile.name}</span>
                    </>
                  ) : (
                    <>
                      <Upload size={18} className="group-hover:text-[#006E62] transition-colors" />
                      <span>Unggah Bukti</span>
                    </>
                  )}
                </button>
                {selectedFile && (
                  <button
                    type="button"
                    onClick={() => setSelectedFile(null)}
                    className="w-12 h-12 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center active:scale-95 transition-all outline-none"
                  >
                    <Trash2 size={20} />
                  </button>
                )}
              </div>
              <input 
                type="file"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".pdf,.jpg,.jpeg,.png"
              />
              <p className="text-[9px] text-gray-400 italic ml-1">* Unggah surat keterangan atau bukti pendukung lainnya.</p>
            </div>
          </div>
        </div>

        <div className="p-8 border-t border-gray-50 bg-white space-y-4 shrink-0">
          <button 
            type="submit" 
            disabled={isSubmitting || isUploading}
            className={MainButtonStyle}
          >
            {isUploading ? <Loader2 className="animate-spin" size={20} /> : isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
            {isUploading ? 'Mengunggah...' : isSubmitting ? 'Memproses...' : editData ? 'Kirim Ulang' : 'Kirim Pengajuan'}
          </button>
          <button 
            type="button" 
            onClick={onBack}
            className={CancelButtonStyle}
          >
            Batal
          </button>
        </div>
      </form>
    </div>
  );
};

export default IzinUserFormPage;
