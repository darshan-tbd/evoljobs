import React from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/layout/Layout';
import ProtectedRoute from '../components/ProtectedRoute';
import CVBuilder from '../components/CVBuilder';

const CVBuilderPage: React.FC = () => {
  const router = useRouter();

  const handleClose = () => {
    router.push('/profile');
  };

  return (
    <Layout>
      <ProtectedRoute>
        <CVBuilder onClose={handleClose} />
      </ProtectedRoute>
    </Layout>
  );
};

export default CVBuilderPage; 