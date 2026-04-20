
/**
 * Navigation Helper for Hurema App
 * Standardizes routing between tabs and modules
 */

export const navigationHelper = {
  /**
   * Safely navigates back to the main mobile dashboard tab
   * @param setActiveTab Function to set the active tab in MobileDashboard
   * @param targetTab The tab to navigate to (default: 'dashboard')
   */
  backToDashboard: (setActiveTab?: (tab: string) => void, targetTab: string = 'dashboard') => {
    if (setActiveTab) {
      setActiveTab(targetTab);
    } else {
      // Fallback if setActiveTab is not available (e.g. direct URL access)
      window.location.href = '/';
    }
  }
};
