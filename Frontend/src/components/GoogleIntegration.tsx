/**
 * Google Integration Component for JobPilot (EvolJobs.com)
 * Handles Google OAuth connection, auto-apply settings, and email monitoring
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  LinkIcon,
  EnvelopeIcon,
  CogIcon,
  PlayIcon,
  StopIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ChartBarIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  ClockIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

interface GoogleIntegration {
  id: string;
  user_email: string;
  google_email: string;
  status: 'connected' | 'disconnected' | 'expired' | 'revoked' | 'error';
  token_status: 'valid' | 'expired';
  last_sync: string;
  auto_apply_enabled: boolean;
  auto_apply_filters: Record<string, any>;
  error_count: number;
  last_error: string;
  created_at: string;
  updated_at: string;
}

interface EmailRecord {
  id: string;
  job_title: string;
  job_company: string;
  to_email: string;
  subject: string;
  status: 'sent' | 'delivered' | 'failed' | 'bounced' | 'replied';
  sent_at: string;
  response_count: number;
  last_response_at?: string;
}

interface EmailResponse {
  id: string;
  sent_email_subject: string;
  job_title: string;
  job_company: string;
  from_email: string;
  subject: string;
  received_at: string;
  response_type: 'reply' | 'auto_reply' | 'interview_invitation' | 'rejection' | 'request_info' | 'other';
  is_processed: boolean;
  requires_action: boolean;
}

interface DashboardStats {
  integration_status: string;
  auto_apply_enabled: boolean;
  google_email: string;
  last_sync: string;
  emails_sent_today: number;
  emails_sent_this_week: number;
  emails_sent_this_month: number;
  responses_received: number;
  unprocessed_responses: number;
  active_sessions: number;
  quota_usage: {
    emails_sent: number;
    max_emails: number;
    email_percentage: number;
    api_calls: number;
    max_api_calls: number;
    api_percentage: number;
  };
}

const GoogleIntegrationComponent: React.FC = () => {
  const [integration, setIntegration] = useState<GoogleIntegration | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [emails, setEmails] = useState<EmailRecord[]>([]);
  const [responses, setResponses] = useState<EmailResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [openFiltersDialog, setOpenFiltersDialog] = useState(false);
  const [autoApplyFilters, setAutoApplyFilters] = useState({
    keywords: '',
    location: '',
    job_type: '',
    experience_level: '',
    salary_min: '',
  });

  // Load integration data on component mount
  useEffect(() => {
    loadIntegrationData();
    loadDashboardStats();
    loadEmails();
    loadResponses();
  }, []);

  const loadIntegrationData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/v1/google/integration/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      });
      const data = await response.json();
      
      if (data.integration) {
        setIntegration(data.integration);
        setAutoApplyFilters(data.integration.auto_apply_filters || {});
      }
    } catch (err) {
      toast.error('Failed to load Google integration data');
    } finally {
      setLoading(false);
    }
  };

  const loadDashboardStats = async () => {
    try {
      const response = await fetch('/api/v1/google/dashboard/stats/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      });
      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error('Failed to load dashboard stats:', err);
    }
  };

  const loadEmails = async () => {
    try {
      const response = await fetch('/api/v1/google/emails/?limit=10', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      });
      const data = await response.json();
      setEmails(data.emails || []);
    } catch (err) {
      console.error('Failed to load emails:', err);
    }
  };

  const loadResponses = async () => {
    try {
      const response = await fetch('/api/v1/google/emails/responses/?limit=10&unprocessed_only=true', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      });
      const data = await response.json();
      setResponses(data.responses || []);
    } catch (err) {
      console.error('Failed to load responses:', err);
    }
  };

  const handleConnectGoogle = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/v1/google/oauth/authorize/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      });
      const data = await response.json();
      
      if (data.authorization_url) {
        // Redirect to Google OAuth
        window.location.href = data.authorization_url;
      }
    } catch (err) {
      toast.error('Failed to initiate Google OAuth');
      setLoading(false);
    }
  };

  const handleDisconnectGoogle = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/v1/google/integration/disconnect/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      });
      
      if (response.ok) {
        toast.success('Google account disconnected successfully');
        loadIntegrationData();
      } else {
        toast.error('Failed to disconnect Google account');
      }
    } catch (err) {
      toast.error('Failed to disconnect Google account');
    } finally {
      setLoading(false);
    }
  };

  const handleAutoApplyToggle = async (enabled: boolean) => {
    try {
      const response = await fetch('/api/v1/google/integration/update_auto_apply_settings/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify({
          auto_apply_enabled: enabled,
          auto_apply_filters: autoApplyFilters,
        }),
      });
      
      if (response.ok) {
        toast.success(`Auto-apply ${enabled ? 'enabled' : 'disabled'}`);
        loadIntegrationData();
      } else {
        toast.error('Failed to update auto-apply settings');
      }
    } catch (err) {
      toast.error('Failed to update auto-apply settings');
    }
  };

  const handleUpdateFilters = async () => {
    try {
      const response = await fetch('/api/v1/google/integration/update_auto_apply_settings/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify({
          auto_apply_enabled: integration?.auto_apply_enabled,
          auto_apply_filters: autoApplyFilters,
        }),
      });
      
      if (response.ok) {
        toast.success('Auto-apply filters updated');
        setOpenFiltersDialog(false);
        loadIntegrationData();
      } else {
        toast.error('Failed to update filters');
      }
    } catch (err) {
      toast.error('Failed to update filters');
    }
  };

  const handleTriggerAutoApply = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/v1/google/integration/trigger_auto_apply/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify({
          max_applications: 10,
        }),
      });
      
      if (response.ok) {
        toast.success('Auto-apply process started');
      } else {
        toast.error('Failed to start auto-apply process');
      }
    } catch (err) {
      toast.error('Failed to start auto-apply process');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckResponses = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/v1/google/integration/check_responses/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      });
      
      if (response.ok) {
        toast.success('Response check started');
        setTimeout(loadResponses, 2000); // Refresh responses after 2 seconds
      } else {
        toast.error('Failed to check responses');
      }
    } catch (err) {
      toast.error('Failed to check responses');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'bg-green-100 text-green-800';
      case 'expired': return 'bg-yellow-100 text-yellow-800';
      case 'error': case 'revoked': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getResponseTypeColor = (type: string) => {
    switch (type) {
      case 'interview_invitation': return 'bg-green-100 text-green-800';
      case 'rejection': return 'bg-red-100 text-red-800';
      case 'request_info': return 'bg-yellow-100 text-yellow-800';
      case 'auto_reply': return 'bg-gray-100 text-gray-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const getEmailStatusColor = (status: string) => {
    switch (status) {
      case 'replied': return 'bg-green-100 text-green-800';
      case 'delivered': return 'bg-blue-100 text-blue-800';
      case 'failed': case 'bounced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Connection Status Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <LinkIcon className="h-5 w-5 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Connection Status</h3>
            </div>
          </div>
          <div className="p-6">
            {integration ? (
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(integration.status)}`}>
                    {integration.status}
                  </span>
                  <span className="text-sm text-gray-600">{integration.google_email}</span>
                </div>
                
                <div className="text-sm text-gray-600">
                  Last sync: {integration.last_sync ? format(new Date(integration.last_sync), 'PPpp') : 'Never'}
                </div>
                
                {integration.status === 'connected' && (
                  <button
                    onClick={handleDisconnectGoogle}
                    disabled={loading}
                    className="bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    {loading ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Disconnecting...
                      </div>
                    ) : (
                      'Disconnect Google Account'
                    )}
                  </button>
                )}
                
                {integration.last_error && (
                  <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center">
                    <ExclamationCircleIcon className="h-5 w-5 mr-2" />
                    {integration.last_error}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-gray-700">
                  Connect your Google account to enable automated job applications via Gmail.
                </p>
                <button
                  onClick={handleConnectGoogle}
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center transition-colors"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Connecting...
                    </>
                  ) : (
                    <>
                      <LinkIcon className="h-4 w-4 mr-2" />
                      Connect Google Account
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </motion.div>

        {/* Auto-Apply Settings Card */}
        {integration?.status === 'connected' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CogIcon className="h-5 w-5 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Auto-Apply Settings</h3>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={integration.auto_apply_enabled}
                    onChange={(e) => handleAutoApplyToggle(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  <span className="ml-3 text-sm font-medium text-gray-700">Enable Auto-Apply</span>
                </label>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => setOpenFiltersDialog(true)}
                  className="border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-lg text-sm font-medium flex items-center transition-colors"
                >
                  <CogIcon className="h-4 w-4 mr-2" />
                  Configure Filters
                </button>
                
                <button
                  onClick={handleTriggerAutoApply}
                  disabled={!integration.auto_apply_enabled || loading}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center transition-colors"
                >
                  <PlayIcon className="h-4 w-4 mr-2" />
                  Trigger Now
                </button>
              </div>
              
              {Object.keys(autoApplyFilters).length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Active Filters:</h4>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(autoApplyFilters).map(([key, value]) => (
                      value && (
                        <span
                          key={key}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          {key}: {value}
                        </span>
                      )
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>

      {/* Dashboard Stats */}
      {stats && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <ChartBarIcon className="h-5 w-5 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Dashboard Statistics</h3>
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">{stats.emails_sent_today}</div>
                <div className="text-sm text-gray-600">Emails Today</div>
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">{stats.emails_sent_this_week}</div>
                <div className="text-sm text-gray-600">Emails This Week</div>
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">{stats.responses_received}</div>
                <div className="text-sm text-gray-600">Total Responses</div>
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-600">{stats.unprocessed_responses}</div>
                <div className="text-sm text-gray-600">Unprocessed</div>
              </div>
            </div>
            
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Daily Quota Usage</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Emails: {stats.quota_usage.emails_sent} / {stats.quota_usage.max_emails}</span>
                  <span>{stats.quota_usage.email_percentage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      stats.quota_usage.email_percentage > 80 ? 'bg-yellow-600' : 'bg-blue-600'
                    }`}
                    style={{ width: `${stats.quota_usage.email_percentage}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Emails */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <EnvelopeIcon className="h-5 w-5 text-orange-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Recent Emails</h3>
              </div>
              <button
                onClick={loadEmails}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <ArrowPathIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
          <div className="divide-y divide-gray-200">
            {emails.length > 0 ? (
              emails.map((email) => (
                <div key={email.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 truncate">{email.job_title}</h4>
                      <p className="text-sm text-gray-600">{email.job_company}</p>
                      <p className="text-xs text-gray-500">{format(new Date(email.sent_at), 'MMM d')}</p>
                    </div>
                    <div className="flex flex-col items-end space-y-1">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEmailStatusColor(email.status)}`}>
                        {email.status}
                      </span>
                      {email.response_count > 0 ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {email.response_count} replies
                        </span>
                      ) : (
                        <span className="text-xs text-gray-500">No replies</span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-12 text-center text-gray-500">
                <EnvelopeIcon className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-lg font-medium text-gray-900 mb-2">No emails found</p>
                <p className="text-sm">Your sent job applications will appear here.</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Recent Responses */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <ChatBubbleLeftRightIcon className="h-5 w-5 text-indigo-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Recent Responses</h3>
              </div>
              <button
                onClick={handleCheckResponses}
                disabled={loading}
                className="text-gray-500 hover:text-gray-700 disabled:text-gray-400 transition-colors"
              >
                <ArrowPathIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
          <div className="divide-y divide-gray-200">
            {responses.length > 0 ? (
              responses.map((response) => (
                <div key={response.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 truncate">{response.job_title}</h4>
                      <p className="text-sm text-gray-600">{response.job_company}</p>
                      <p className="text-xs text-gray-500">From: {response.from_email.split('@')[0]}</p>
                      <p className="text-xs text-gray-500">{format(new Date(response.received_at), 'MMM d')}</p>
                    </div>
                    <div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getResponseTypeColor(response.response_type)}`}>
                        {response.response_type.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-12 text-center text-gray-500">
                <ChatBubbleLeftRightIcon className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-lg font-medium text-gray-900 mb-2">No responses found</p>
                <p className="text-sm">Employer responses will appear here.</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Filters Dialog */}
      {openFiltersDialog && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-lg border border-gray-200 w-full max-w-md mx-4"
          >
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Configure Auto-Apply Filters</h3>
                <button
                  onClick={() => setOpenFiltersDialog(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Keywords</label>
                <input
                  type="text"
                  value={autoApplyFilters.keywords || ''}
                  onChange={(e) => setAutoApplyFilters(prev => ({ ...prev, keywords: e.target.value }))}
                  placeholder="e.g., software engineer, developer"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                <input
                  type="text"
                  value={autoApplyFilters.location || ''}
                  onChange={(e) => setAutoApplyFilters(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="e.g., San Francisco, Remote"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Job Type</label>
                  <select
                    value={autoApplyFilters.job_type || ''}
                    onChange={(e) => setAutoApplyFilters(prev => ({ ...prev, job_type: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Any</option>
                    <option value="full_time">Full Time</option>
                    <option value="part_time">Part Time</option>
                    <option value="contract">Contract</option>
                    <option value="remote">Remote</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Experience Level</label>
                  <select
                    value={autoApplyFilters.experience_level || ''}
                    onChange={(e) => setAutoApplyFilters(prev => ({ ...prev, experience_level: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Any</option>
                    <option value="entry">Entry Level</option>
                    <option value="mid">Mid Level</option>
                    <option value="senior">Senior Level</option>
                    <option value="executive">Executive</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Salary</label>
                <input
                  type="number"
                  value={autoApplyFilters.salary_min || ''}
                  onChange={(e) => setAutoApplyFilters(prev => ({ ...prev, salary_min: e.target.value }))}
                  placeholder="e.g., 80000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setOpenFiltersDialog(false)}
                className="border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateFilters}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Save Filters
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default GoogleIntegrationComponent; 