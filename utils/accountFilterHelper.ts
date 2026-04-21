import { Account, AuthUser } from '../types';

export const accountFilterHelper = {
  /**
   * Mengembalikan true jika akun sedang aktif (end_date null atau di masa depan)
   */
  isActive(account: Account): boolean {
    if (!account.end_date) return true;
    const today = new Date().toISOString().split('T')[0];
    return account.end_date > today;
  },

  /**
   * Standart filter akun untuk dropdown / selection list
   * @param accounts List account mentah
   * @param adminUser User yang sedang melakukan aksi (untuk cek scope)
   * @param mode 'isolasi' (filter lokasi) atau 'global' (hanya filter aktif)
   */
  filter(accounts: Account[], adminUser: AuthUser | null, mode: 'isolasi' | 'global' = 'isolasi'): Account[] {
    // 1. Selalu filter yang aktif saja
    const activeAccounts = accounts.filter(acc => this.isActive(acc));

    if (mode === 'global' || !adminUser) {
      return activeAccounts;
    }

    // 2. Jika mode isolasi, cek scope admin
    const hrScope = adminUser.hr_scope;
    const perfScope = adminUser.performance_scope;
    const finScope = adminUser.finance_scope;

    // Kumpulkan semua lokasi yang diizinkan dari berbagai scope
    const allowedLocations = new Set<string>();
    let hasGlobalAccess = false;

    [hrScope, perfScope, finScope].forEach(scope => {
      if (!scope) return;
      if (scope.mode === 'all') {
        hasGlobalAccess = true;
      } else if (scope.mode === 'limited' && scope.location_ids) {
        scope.location_ids.forEach(id => allowedLocations.add(id));
      }
    });

    // Jika admin murni (SPADMIN) atau punya scope 'all', kembalikan semua yang aktif
    if (hasGlobalAccess || adminUser.access_code?.includes('SPADMIN')) {
      return activeAccounts;
    }

    // Jika tidak punya akses global, filter berdasarkan lokasi yang diizinkan
    return activeAccounts.filter(acc => 
      acc.location_id && allowedLocations.has(acc.location_id)
    );
  }
};
