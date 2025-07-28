import React, { useState, useEffect } from 'react';
import {
  LinkIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowPathIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  EnvelopeIcon,
  UserIcon,
  CogIcon,
  ChartBarIcon,
  ShieldCheckIcon,
  XMarkIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CalendarIcon,
  InformationCircleIcon,
  DocumentTextIcon,
  PlayIcon,
  StopIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../../hooks/useAuth';
import AdminLayout from '../../components/admin_dashboard/AdminLayout';

interface GoogleIntegration {
  id: string;
  user?: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
  };
  google_email: string;
  status: 'connected' | 'disconnected' | 'expired' | 'revoked' | 'error';
  auto_apply_enabled: boolean;
  auto_apply_filters: any;
  last_sync: string | null;
  error_count: number;
  last_error: string;
  created_at: string;
  updated_at: string;
}

interface EmailSentRecord {
  id: string;
  google_integration: {
    user: {
      email: string;
    };
  };
  job: {
    title: string;
    company: {
      name: string;
    };
  };
  to_email: string;
  subject: string;
  status: 'sent' | 'delivered' | 'failed' | 'bounced' | 'replied';
  sent_at: string;
  response_count: number;
  last_response_at: string | null;
}

interface EmailResponse {
  id: string;
  sent_email: {
    job: {
      title: string;
      company: {
        name: string;
      };
    };
  };
  from_email: string;
  subject: string;
  response_type: 'reply' | 'auto_reply' | 'interview_invitation' | 'rejection' | 'request_info' | 'other';
  received_at: string;
  requires_action: boolean;
  is_processed: boolean;
}

interface AutoApplySession {
  id: string;
  google_integration: {
    user: {
      email: string;
    };
  };
  session_id: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  max_applications: number;
  applications_sent: number;
  applications_failed: number;
  started_at: string;
  completed_at: string | null;
  error_message: string;
}

interface GoogleIntegrationStats {
  total_integrations: number;
  connected: number;
  active_auto_apply: number;
  emails_sent_today: number;
  emails_sent_week: number;
  responses_received_today: number;
  active_sessions: number;
  by_status: {
    connected: number;
    disconnected: number;
    expired: number;
    revoked: number;
    error: number;
  };
}

const AdminGoogleIntegrationsPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'integrations' | 'emails' | 'responses' | 'sessions'>('integrations');
  const [integrations, setIntegrations] = useState<GoogleIntegration[]>([]);
  const [emails, setEmails] = useState<EmailSentRecord[]>([]);
  const [responses, setResponses] = useState<EmailResponse[]>([]);
  const [sessions, setSessions] = useState<AutoApplySession[]>([]);
  const [stats, setStats] = useState<GoogleIntegrationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
  }>({ open: false, message: '', type: 'success' });

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const headers = {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
      };

      // Fetch all data in parallel
      const [integrationsRes, emailsRes, responsesRes, sessionsRes, statsRes] = await Promise.all([
        fetch('http://127.0.0.1:8000/api/v1/google/admin/integrations/', { headers }),
        fetch('http://127.0.0.1:8000/api/v1/google/admin/emails/', { headers }),
        fetch('http://127.0.0.1:8000/api/v1/google/admin/emails/responses/', { headers }),
        fetch('http://127.0.0.1:8000/api/v1/google/admin/sessions/', { headers }),
        fetch('http://127.0.0.1:8000/api/v1/google/admin/stats/', { headers })
      ]);

      if (integrationsRes.ok) {
        const data = await integrationsRes.json();
        setIntegrations(Array.isArray(data) ? data : data.results || []);
      }

      if (emailsRes.ok) {
        const data = await emailsRes.json();
        setEmails(Array.isArray(data) ? data : data.emails || []);
      }

      if (responsesRes.ok) {
        const data = await responsesRes.json();
        setResponses(Array.isArray(data) ? data : data.responses || []);
      }

      if (sessionsRes.ok) {
        const data = await sessionsRes.json();
        setSessions(Array.isArray(data) ? data : data.sessions || []);
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      } else {
        // Calculate stats from local data if API fails
        calculateStats();
      }

    } catch (err) {
      console.error('Error fetching Google integration data:', err);
      setError('Failed to fetch Google integration data');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    const stats: GoogleIntegrationStats = {
      total_integrations: integrations.length,
      connected: integrations.filter(i => i.status === 'connected').length,
      active_auto_apply: integrations.filter(i => i.auto_apply_enabled).length,
      emails_sent_today: emails.filter(e => new Date(e.sent_at).toDateString() === new Date().toDateString()).length,
      emails_sent_week: emails.filter(e => {
        const sentDate = new Date(e.sent_at);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return sentDate >= weekAgo;
      }).length,
      responses_received_today: responses.filter(r => new Date(r.received_at).toDateString() === new Date().toDateString()).length,
      active_sessions: sessions.filter(s => s.status === 'running').length,
      by_status: {
        connected: integrations.filter(i => i.status === 'connected').length,
        disconnected: integrations.filter(i => i.status === 'disconnected').length,
        expired: integrations.filter(i => i.status === 'expired').length,
        revoked: integrations.filter(i => i.status === 'revoked').length,
        error: integrations.filter(i => i.status === 'error').length,
      }
    };
    setStats(stats);
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (integrations.length || emails.length || responses.length || sessions.length) {
      calculateStats();
    }
  }, [integrations, emails, responses, sessions]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'disconnected':
        return <XCircleIcon className="h-5 w-5 text-gray-500" />;
      case 'expired':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      case 'error':
      case 'failed':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />;
      case 'running':
        return <PlayIcon className="h-5 w-5 text-blue-500" />;
      case 'completed':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      default:
        return <InformationCircleIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
      case 'completed':
      case 'sent':
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'running':
      case 'reply':
        return 'bg-blue-100 text-blue-800';
      case 'expired':
      case 'auto_reply':
        return 'bg-yellow-100 text-yellow-800';
      case 'error':
      case 'failed':
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'interview_invitation':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const showSnackbar = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'success') => {
    setSnackbar({ open: true, message, type });
    setTimeout(() => setSnackbar({ open: false, message: '', type: 'success' }), 5000);
  };

  const handleDisconnectIntegration = async (integration: GoogleIntegration) => {
    try {
      setActionLoading(true);
      const response = await fetch(`http://127.0.0.1:8000/api/v1/google/admin/integrations/disconnect/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ integration_id: integration.id }),
      });

      if (response.ok) {
        showSnackbar('Integration disconnected successfully');
        fetchData();
      } else {
        throw new Error('Failed to disconnect integration');
      }
    } catch (err) {
      showSnackbar('Failed to disconnect integration', 'error');
    } finally {
      setActionLoading(false);
      setShowDeleteModal(false);
    }
  };

  const renderStats = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <LinkIcon className="h-6 w-6 text-gray-400" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Total Integrations</dt>
                <dd className="text-lg font-medium text-gray-900">{stats?.total_integrations || 0}</dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckCircleIcon className="h-6 w-6 text-green-500" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Connected</dt>
                <dd className="text-lg font-medium text-gray-900">{stats?.connected || 0}</dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <EnvelopeIcon className="h-6 w-6 text-blue-500" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Emails Today</dt>
                <dd className="text-lg font-medium text-gray-900">{stats?.emails_sent_today || 0}</dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CogIcon className="h-6 w-6 text-purple-500" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Auto-Apply Active</dt>
                <dd className="text-lg font-medium text-gray-900">{stats?.active_auto_apply || 0}</dd>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderIntegrationsTable = () => (
    <div className="bg-white shadow overflow-hidden sm:rounded-md">
      <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900">Google Integrations</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Manage user Google OAuth integrations and auto-apply settings
            </p>
          </div>
          <button
            onClick={() => fetchData()}
            disabled={loading}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            <ArrowPathIcon className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      <ul className="divide-y divide-gray-200">
        {integrations.map((integration) => (
          <li key={integration.id}>
            <div className="px-4 py-4 flex items-center justify-between">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  {getStatusIcon(integration.status)}
                </div>
                <div className="ml-4">
                  <div className="flex items-center">
                    <div className="text-sm font-medium text-gray-900">
                      {integration.user?.first_name || 'Unknown'} {integration.user?.last_name || 'User'}
                    </div>
                    <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(integration.status)}`}>
                      {integration.status}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500">
                    {integration.user?.email || 'No user email'} → {integration.google_email}
                  </div>
                  {integration.auto_apply_enabled && (
                    <div className="text-xs text-blue-600 font-medium">Auto-Apply Enabled</div>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    setSelectedItem(integration);
                    setShowDetailModal(true);
                  }}
                  className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                >
                  View Details
                </button>
                {integration.status === 'connected' && (
                  <button
                    onClick={() => {
                      setSelectedItem(integration);
                      setShowDeleteModal(true);
                    }}
                    className="text-red-600 hover:text-red-900 text-sm font-medium"
                  >
                    Disconnect
                  </button>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>

      {integrations.length === 0 && !loading && (
        <div className="text-center py-12">
          <LinkIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No integrations</h3>
          <p className="mt-1 text-sm text-gray-500">No Google integrations found.</p>
        </div>
      )}
    </div>
  );

  const renderEmailsTable = () => (
    <div className="bg-white shadow overflow-hidden sm:rounded-md">
      <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
        <h3 className="text-lg leading-6 font-medium text-gray-900">Email Records</h3>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">
          Track emails sent through Google integration
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User / Job
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                To Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Subject
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Responses
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Sent At
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {emails.map((email) => (
              <tr key={email.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {email.google_integration?.user?.email || 'Unknown user'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {email.job?.title || 'Unknown job'} at {email.job?.company?.name || 'Unknown company'}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {email.to_email}
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900 max-w-xs truncate" title={email.subject}>
                    {email.subject}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(email.status)}`}>
                    {email.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {email.response_count}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(email.sent_at)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {emails.length === 0 && !loading && (
        <div className="text-center py-12">
          <EnvelopeIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No emails</h3>
          <p className="mt-1 text-sm text-gray-500">No emails sent through Google integration.</p>
        </div>
      )}
    </div>
  );

  const renderResponsesTable = () => (
    <div className="bg-white shadow overflow-hidden sm:rounded-md">
      <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
        <h3 className="text-lg leading-6 font-medium text-gray-900">Email Responses</h3>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">
          Track responses received for sent emails
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Job / From
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Subject
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Received At
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {responses.map((response) => (
              <tr key={response.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {response.sent_email?.job?.title || 'Unknown job'}
                    </div>
                    <div className="text-sm text-gray-500">
                      From: {response.from_email || 'Unknown sender'}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900 max-w-xs truncate" title={response.subject}>
                    {response.subject}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(response.response_type)}`}>
                    {response.response_type.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {response.requires_action && (
                      <ExclamationTriangleIcon className="h-4 w-4 text-red-500 mr-1" />
                    )}
                    <span className={`text-xs ${response.is_processed ? 'text-green-600' : 'text-gray-600'}`}>
                      {response.is_processed ? 'Processed' : 'Pending'}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(response.received_at)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {responses.length === 0 && !loading && (
        <div className="text-center py-12">
          <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No responses</h3>
          <p className="mt-1 text-sm text-gray-500">No email responses received yet.</p>
        </div>
      )}
    </div>
  );

  const renderSessionsTable = () => (
    <div className="bg-white shadow overflow-hidden sm:rounded-md">
      <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
        <h3 className="text-lg leading-6 font-medium text-gray-900">Auto-Apply Sessions</h3>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">
          Track automated job application sessions
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User / Session
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Applications
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Success Rate
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Started At
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sessions.map((session) => (
              <tr key={session.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {session.google_integration?.user?.email || 'Unknown user'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {session.session_id}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {getStatusIcon(session.status)}
                    <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(session.status)}`}>
                      {session.status}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div>
                    <div>Sent: {session.applications_sent}</div>
                    <div>Failed: {session.applications_failed}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {session.applications_sent + session.applications_failed > 0 
                    ? Math.round((session.applications_sent / (session.applications_sent + session.applications_failed)) * 100)
                    : 0}%
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(session.started_at)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {sessions.length === 0 && !loading && (
        <div className="text-center py-12">
          <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No sessions</h3>
          <p className="mt-1 text-sm text-gray-500">No auto-apply sessions found.</p>
        </div>
      )}
    </div>
  );

  const renderDetailModal = () => {
    if (!selectedItem || !showDetailModal) return null;

    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Integration Details</h3>
            <button
              onClick={() => setShowDetailModal(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500">User</label>
              <p className="text-sm text-gray-900">
                {selectedItem.user ? 
                  `${selectedItem.user.first_name || ''} ${selectedItem.user.last_name || ''}`.trim() || 'Unknown User'
                  : 'Unknown User'
                }
              </p>
              <p className="text-sm text-gray-500">{selectedItem.user?.email || 'No email'}</p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-500">Google Email</label>
              <p className="text-sm text-gray-900">{selectedItem.google_email}</p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-500">Status</label>
              <div className="flex items-center">
                {getStatusIcon(selectedItem.status)}
                <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedItem.status)}`}>
                  {selectedItem.status}
                </span>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500">Auto-Apply</label>
              <p className="text-sm text-gray-900">{selectedItem.auto_apply_enabled ? 'Enabled' : 'Disabled'}</p>
            </div>

            {selectedItem.last_sync && (
              <div>
                <label className="text-sm font-medium text-gray-500">Last Sync</label>
                <p className="text-sm text-gray-900">{formatDate(selectedItem.last_sync)}</p>
              </div>
            )}

            {selectedItem.last_error && (
              <div>
                <label className="text-sm font-medium text-gray-500">Last Error</label>
                <p className="text-sm text-red-600">{selectedItem.last_error}</p>
              </div>
            )}
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <button
              onClick={() => setShowDetailModal(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderDeleteModal = () => {
    if (!selectedItem || !showDeleteModal) return null;

    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
          <div className="mt-3 text-center">
            <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-500" />
            <h3 className="text-lg font-medium text-gray-900 mt-2">Disconnect Integration</h3>
            <div className="mt-2 px-7 py-3">
              <p className="text-sm text-gray-500">
                Are you sure you want to disconnect this Google integration? This will revoke access and disable auto-apply.
              </p>
            </div>
            <div className="flex justify-center space-x-3 mt-4">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={actionLoading}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDisconnectIntegration(selectedItem)}
                disabled={actionLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                {actionLoading ? 'Disconnecting...' : 'Disconnect'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 text-lg">Loading Google integrations...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="md:flex md:items-center md:justify-between">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              Google Integrations
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Manage Google OAuth integrations and auto-apply functionality
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Stats */}
        {renderStats()}

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { key: 'integrations', name: 'Integrations', icon: LinkIcon },
              { key: 'emails', name: 'Emails', icon: EnvelopeIcon },
              { key: 'responses', name: 'Responses', icon: DocumentTextIcon },
              { key: 'sessions', name: 'Sessions', icon: ChartBarIcon },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`${
                  activeTab === tab.key
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center`}
              >
                <tab.icon className="h-5 w-5 mr-2" />
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === 'integrations' && renderIntegrationsTable()}
          {activeTab === 'emails' && renderEmailsTable()}
          {activeTab === 'responses' && renderResponsesTable()}
          {activeTab === 'sessions' && renderSessionsTable()}
        </div>

        {/* Modals */}
        {renderDetailModal()}
        {renderDeleteModal()}

        {/* Snackbar */}
        {snackbar.open && (
          <div className="fixed top-4 right-4 z-50">
            <div className={`bg-white border-l-4 p-4 shadow-md rounded ${
              snackbar.type === 'success' ? 'border-green-400' :
              snackbar.type === 'error' ? 'border-red-400' :
              snackbar.type === 'warning' ? 'border-yellow-400' :
              'border-blue-400'
            }`}>
              <div className="flex">
                <div className="flex-shrink-0">
                  {snackbar.type === 'success' && <CheckCircleIcon className="h-5 w-5 text-green-400" />}
                  {snackbar.type === 'error' && <XCircleIcon className="h-5 w-5 text-red-400" />}
                  {snackbar.type === 'warning' && <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />}
                  {snackbar.type === 'info' && <InformationCircleIcon className="h-5 w-5 text-blue-400" />}
                </div>
                <div className="ml-3">
                  <p className="text-sm text-gray-700">{snackbar.message}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminGoogleIntegrationsPage; 