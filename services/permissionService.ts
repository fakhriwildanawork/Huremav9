import { supabase } from '../lib/supabase';
import { PermissionRequest, PermissionRequestInput } from '../types';
import { authService } from './authService';

export const permissionService = {
  /**
   * Mendapatkan semua pengajuan izin untuk satu akun
   */
  async getByAccountId(accountId: string): Promise<PermissionRequest[]> {
    const { data, error } = await supabase
      .from('account_permission_requests')
      .select('*')
      .eq('account_id', accountId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching permission requests:', error);
      throw error;
    }
    return data || [];
  },

  /**
   * Mendapatkan semua pengajuan izin (Admin)
   */
  async getAll(): Promise<PermissionRequest[]> {
    let query = supabase
      .from('account_permission_requests')
      .select('*, account:accounts!account_id!inner(full_name, internal_nik, location_id, photo_google_id)')
      .order('created_at', { ascending: false });
    
    // Apply Admin Location Scope
    const user = authService.getCurrentUser();
    if (user && user.role !== 'admin') {
      const scopes = [user.hr_scope, user.performance_scope, user.finance_scope].filter(Boolean);
      const limitedScopes = scopes.filter(s => s?.mode === 'limited');
      
      if (limitedScopes.length > 0) {
        const allAllowedIds = Array.from(new Set(limitedScopes.flatMap(s => s?.location_ids || [])));
        if (allAllowedIds.length > 0) {
          query = query.in('account.location_id', allAllowedIds);
        }
      }
    }

    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching all permission requests:', error);
      throw error;
    }
    return data || [];
  },

  /**
   * Membuat pengajuan izin baru
   */
  async create(input: PermissionRequestInput, forceStatus?: 'approved' | 'pending', verifierId?: string): Promise<PermissionRequest> {
    // Validasi sesi kustom sebelum kirim
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      console.error('No active custom session found during create permission');
      throw new Error('Sesi Anda telah berakhir. Silakan login kembali.');
    }

    const status = forceStatus || 'pending';

    const { file_id, ...insertData } = input;
    const { data, error } = await supabase
      .from('account_permission_requests')
      .insert({
        ...insertData,
        status,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) {
      console.error('Supabase error in create permission:', error);
      throw error;
    }

    // Sinkronisasi ke tabel submissions agar muncul di daftar verifikasi pusat
    try {
      const submissionStatus = status === 'approved' ? 'Disetujui' : 'Pending';
      await supabase.from('account_submissions').insert([{
        account_id: input.account_id,
        type: 'Izin',
        status: submissionStatus,
        description: `${input.permission_type}: ${input.description}`,
        file_id: input.file_id,
        verifier_id: status === 'approved' ? verifierId : null,
        verified_at: status === 'approved' ? new Date().toISOString() : null,
        submission_data: {
          permission_type: input.permission_type,
          start_date: input.start_date,
          end_date: input.end_date,
          permission_request_id: data.id
        }
      }]);
    } catch (subError) {
      console.warn('Failed to sync to submissions table:', subError);
    }

    return data;
  },

  /**
   * Memperbarui status pengajuan izin
   */
  async updateStatus(
    id: string, 
    status: 'approved' | 'rejected' | 'cancelled',
    reason?: string
  ): Promise<void> {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      throw new Error('Sesi Anda telah berakhir. Silakan login kembali.');
    }

    const { data: current, error: fetchError } = await supabase
      .from('account_permission_requests')
      .select('account_id, permission_type')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    const { error } = await supabase
      .from('account_permission_requests')
      .update({
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);
    
    if (error) throw error;

    // Update status di tabel submissions pusat
    try {
      const submissionStatus = status === 'approved' ? 'Disetujui' : status === 'rejected' ? 'Ditolak' : status === 'cancelled' ? 'Dibatalkan' : 'Pending';
      
      const { data: sub } = await supabase
        .from('account_submissions')
        .select('id')
        .eq('account_id', current.account_id)
        .eq('type', 'Izin')
        .contains('submission_data', { permission_request_id: id })
        .maybeSingle();

      if (sub) {
        await supabase.from('account_submissions')
          .update({ 
            status: submissionStatus,
            verifier_id: (status === 'approved' || status === 'rejected') ? currentUser.id : null,
            verified_at: (status === 'approved' || status === 'rejected') ? new Date().toISOString() : null,
            verification_notes: reason,
            description: reason || (status === 'approved' ? 'Disetujui' : status === 'rejected' ? 'Ditolak' : 'Dibatalkan'),
            updated_at: new Date().toISOString()
          })
          .eq('id', sub.id);
      }
    } catch (subError) {
      console.warn('Failed to update central submission status:', subError);
    }
  },

  /**
   * Alias untuk maintain kompatibilitas jika perlu, tapi disarankan pakai updateStatus
   */
  async negotiate(id: string, role: any, startDate: any, endDate: any, reason: string, status: any): Promise<void> {
    return this.updateStatus(id, status, reason);
  },

  /**
   * Menghapus pengajuan izin
   */
  async delete(id: string): Promise<void> {
    // 1. Hapus di tabel submissions pusat dulu (berdasarkan permission_request_id)
    try {
      await supabase.from('account_submissions')
        .delete()
        .contains('submission_data', { permission_request_id: id });
    } catch (subError) {
      console.warn('Failed to cleanup central submission record:', subError);
    }

    // 2. Hapus record asli
    const { error } = await supabase
      .from('account_permission_requests')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  /**
   * Mendapatkan pengajuan izin dalam rentang tanggal
   */
  async getByRange(accountId: string, startDate: string, endDate: string): Promise<PermissionRequest[]> {
    const { data, error } = await supabase
      .from('account_permission_requests')
      .select('*')
      .eq('account_id', accountId)
      .neq('status', 'rejected')
      .neq('status', 'cancelled')
      .or(`start_date.lte.${endDate},end_date.gte.${startDate}`);
    
    if (error) throw error;
    return data || [];
  },

  /**
   * Mendapatkan info verifikator dari tabel submissions
   */
  async getVerifierInfo(requestId: string): Promise<any> {
    const { data, error } = await supabase
      .from('account_submissions')
      .select('verified_at, verification_notes, verifier:accounts!verifier_id(full_name, photo_google_id)')
      .eq('type', 'Izin')
      .contains('submission_data', { permission_request_id: requestId })
      .maybeSingle();
    
    if (error) {
      console.error('Error fetching verifier info:', error);
      return null;
    }
    return data;
  }
};
