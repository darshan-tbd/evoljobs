import React from 'react';
import AdminProtectedRoute from '../../components/AdminProtectedRoute';
import AdminLayout from '../../components/admin_dashboard/AdminLayout';
import DashboardOverview from '../../components/admin_dashboard/DashboardOverview';

const AdminDashboard: React.FC = () => {
  return (
    <AdminProtectedRoute>
      <AdminLayout>
        <DashboardOverview />
      </AdminLayout>
    </AdminProtectedRoute>
  );
};

export default AdminDashboard; 