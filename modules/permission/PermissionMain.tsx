import React, { useState, useEffect } from 'react';
import { authService } from '../../services/authService';
import IzinDashboard from './IzinDashboard';
import IzinUserFormPage from './IzinUserFormPage';
import AdminPermissionMain from './AdminPermissionMain';
import { PermissionRequest } from '../../types';

interface PermissionMainProps {
  setActiveTab?: (tab: string) => void;
}

const PermissionMain: React.FC<PermissionMainProps> = ({ setActiveTab }) => {
  const user = authService.getCurrentUser();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [view, setView] = useState<'list' | 'form'>('list');
  const [editingRequest, setEditingRequest] = useState<PermissionRequest | null>(null);
  const [requests, setRequests] = useState<PermissionRequest[]>([]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isAdmin = user?.role === 'admin' || user?.is_hr_admin || user?.is_performance_admin || user?.is_finance_admin;

  if (!user) return null;

  // Always show mobile dashboard on small screens OR for non-admin users
  if (isMobile || !isAdmin) {
    if (view === 'form') {
      return (
        <IzinUserFormPage 
          user={user}
          onBack={() => setView('list')}
          onSuccess={() => setView('list')}
          editData={editingRequest}
          existingRequests={requests}
        />
      );
    }

    return (
      <IzinDashboard 
        user={user} 
        setActiveTab={setActiveTab}
        onAjukan={(request) => {
          setEditingRequest(request || null);
          setView('form');
        }}
        onRequestsLoaded={(data) => setRequests(data)}
      />
    );
  }

  // Show Admin Management View only on Desktop for Admins
  return <AdminPermissionMain user={user} />;
};

export default PermissionMain;
