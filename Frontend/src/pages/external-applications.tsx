import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { motion } from 'framer-motion';
import { 
  DocumentTextIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  BuildingOfficeIcon,
  ExternalLinkIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import Layout from '@/components/layout/Layout';

interface ExternalApplication {
  id: string;
  job_title: string;
  job_company: string;
  external_url: string;
  status: 'clicked' | 'visited' | 'applied' | 'not_applied';
  clicked_at: string;
  visited_at?: string;
  applied_at?: string;
  user_notes?: string;
}

const ExternalApplicationsPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [applications, setApplications] = useState<ExternalApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNotes, setEditNotes] = useState('');
  const [editStatus, setEditStatus] = useState<string>('');

  useEffect(() => {
    if (isAuthenticated) {
      fetchExternalApplications();
    }
  }, [isAuthenticated]);

  const fetchExternalApplications = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch('http://127.0.0.1:8000/api/v1/applications/external-tracking/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setApplications(data.results || []);
      } else {
        throw new Error('Failed to fetch external applications');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load external applications');
    } finally {
      setLoading(false);
    }
  };

  const updateApplicationStatus = async (applicationId: string, status: string, notes?: string) => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/v1/applications/external-tracking/${applicationId}/update_status/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status,
          notes: notes || ''
        }),
      });

      if (response.ok) {
        await fetchExternalApplications();
        setEditingId(null);
        setEditNotes('');
        setEditStatus('');
      } else {
        throw new Error('Failed to update application status');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update application status');
    }
  };

  const startEditing = (application: ExternalApplication) => {
    setEditingId(application.id);
    setEditNotes(application.user_notes || '');
    setEditStatus(application.status);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditNotes('');
    setEditStatus('');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'applied':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'visited':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'clicked':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'not_applied':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'applied':
        return <CheckCircleIcon className="w-4 h-4" />;
      case 'visited':
        return <EyeIcon className="w-4 h-4" />;
      case 'clicked':
        return <ClockIcon className="w-4 h-4" />;
      case 'not_applied':
        return <XCircleIcon className="w-4 h-4" />;
      default:
        return <ClockIcon className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isAuthenticated) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Please log in to view your external applications</h2>
            <p className="text-gray-600">You need to be logged in to track your external job applications.</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">External Job Applications</h1>
            <p className="text-gray-600">Track your applications to jobs on external websites</p>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600"></div>
            </div>
          ) : applications.length === 0 ? (
            <div className="text-center py-12">
              <DocumentTextIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No external applications yet</h3>
              <p className="text-gray-600">When you click "Apply Now" on external job postings, they'll appear here for tracking.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {applications.map((application) => (
                <motion.div
                  key={application.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <BuildingOfficeIcon className="w-5 h-5 text-gray-400" />
                        <h3 className="text-lg font-semibold text-gray-900">{application.job_title}</h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(application.status)}`}>
                          {getStatusIcon(application.status)}
                          <span className="ml-1 capitalize">{application.status.replace('_', ' ')}</span>
                        </span>
                      </div>
                      
                      <p className="text-gray-600 mb-3">{application.job_company}</p>
                      
                      <div className="flex items-center space-x-6 text-sm text-gray-500 mb-4">
                        <div className="flex items-center">
                          <ClockIcon className="w-4 h-4 mr-1" />
                          Clicked: {formatDate(application.clicked_at)}
                        </div>
                        {application.visited_at && (
                          <div className="flex items-center">
                            <EyeIcon className="w-4 h-4 mr-1" />
                            Visited: {formatDate(application.visited_at)}
                          </div>
                        )}
                        {application.applied_at && (
                          <div className="flex items-center">
                            <CheckCircleIcon className="w-4 h-4 mr-1" />
                            Applied: {formatDate(application.applied_at)}
                          </div>
                        )}
                      </div>

                      {application.user_notes && (
                        <div className="bg-gray-50 rounded-lg p-3 mb-4">
                          <p className="text-sm text-gray-700">{application.user_notes}</p>
                        </div>
                      )}

                      {editingId === application.id ? (
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                            <select
                              value={editStatus}
                              onChange={(e) => setEditStatus(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                              <option value="clicked">Clicked Apply</option>
                              <option value="visited">Visited External Site</option>
                              <option value="applied">Applied Successfully</option>
                              <option value="not_applied">Did Not Apply</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                            <textarea
                              value={editNotes}
                              onChange={(e) => setEditNotes(e.target.value)}
                              rows={3}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="Add notes about your application process..."
                            />
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => updateApplicationStatus(application.id, editStatus, editNotes)}
                              className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                              <CheckIcon className="w-4 h-4 mr-1" />
                              Save
                            </button>
                            <button
                              onClick={cancelEditing}
                              className="flex items-center px-3 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                            >
                              <XMarkIcon className="w-4 h-4 mr-1" />
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-3">
                          <a
                            href={application.external_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            <ExternalLinkIcon className="w-4 h-4 mr-2" />
                            Visit Job Site
                          </a>
                          <button
                            onClick={() => startEditing(application)}
                            className="flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            <PencilIcon className="w-4 h-4 mr-2" />
                            Update Status
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default ExternalApplicationsPage; 