import React, { useState, useEffect } from 'react';
import {
  BellIcon,
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
  InformationCircleIcon,
  ClockIcon,
  EnvelopeIcon,
  ChatBubbleLeftRightIcon,
  XMarkIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../../hooks/useAuth';
import AdminLayout from '../../components/admin_dashboard/AdminLayout';

interface Notification {
  id: string;
  user: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  notification_type: string;
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  is_read: boolean;
  is_dismissed: boolean;
  is_sent: boolean;
  sent_at?: string;
  created_at: string;
  delivery_method: string;
  action_url?: string;
  action_label?: string;
}

interface NotificationTemplate {
  id: string;
  name: string;
  notification_type: string;
  title_template: string;
  message_template: string;
  action_label_template?: string;
  action_url_template?: string;
  default_priority: string;
  default_delivery_method: string;
  expires_in_hours?: number;
}

interface NotificationStats {
  total: number;
  unread: number;
  sent_today: number;
  sent_week: number;
  by_priority: {
    low: number;
    medium: number;
    high: number;
    urgent: number;
  };
  by_type: {
    email: number;
    push: number;
    sms: number;
    in_app: number;
  };
}

const AdminNotificationsPage: React.FC = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
  }>({ open: false, message: '', type: 'success' });

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('http://127.0.0.1:8000/api/v1/notifications/admin-notifications/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }

      const data = await response.json();
      setNotifications(data.results || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load notifications');
      setSnackbar({
        open: true,
        message: err.message || 'Failed to load notifications',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/api/v1/notifications/admin-notifications/stats/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch notification stats:', error);
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/api/v1/notifications/templates/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTemplates(data.results || []);
      }
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    fetchStats();
    fetchTemplates();
  }, []);

  // Auto-hide snackbar after 5 seconds
  useEffect(() => {
    if (snackbar.open) {
      const timer = setTimeout(() => {
        setSnackbar({ ...snackbar, open: false });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [snackbar.open]);

  const handleRefresh = async () => {
    await fetchNotifications();
    await fetchStats();
    setSnackbar({
      open: true,
      message: 'Notifications refreshed successfully!',
      type: 'success'
    });
  };

  const handleViewNotification = (notification: Notification) => {
    setSelectedNotification(notification);
    setShowNotificationModal(true);
  };

  const handleDeleteNotification = async (notification: Notification) => {
    if (!confirm('Are you sure you want to delete this notification?')) return;

    try {
      const response = await fetch(`http://127.0.0.1:8000/api/v1/notifications/${notification.id}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      });

      if (response.ok) {
        setNotifications(notifications.filter(n => n.id !== notification.id));
        setSnackbar({
          open: true,
          message: 'Notification deleted successfully!',
          type: 'success'
        });
      } else {
        throw new Error('Failed to delete notification');
      }
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error.message || 'Failed to delete notification',
        type: 'error'
      });
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <ExclamationTriangleIcon className="w-4 h-4" />;
      case 'high':
        return <ExclamationTriangleIcon className="w-4 h-4" />;
      case 'medium':
        return <InformationCircleIcon className="w-4 h-4" />;
      case 'low':
        return <CheckCircleIcon className="w-4 h-4" />;
      default:
        return <InformationCircleIcon className="w-4 h-4" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'email':
        return <EnvelopeIcon className="w-5 h-5" />;
      case 'push':
        return <BellIcon className="w-5 h-5" />;
      case 'sms':
        return <ChatBubbleLeftRightIcon className="w-5 h-5" />;
      case 'in_app':
        return <InformationCircleIcon className="w-5 h-5" />;
      default:
        return <BellIcon className="w-5 h-5" />;
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         notification.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         `${notification.user?.first_name || ''} ${notification.user?.last_name || ''}`.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesPriority = filterPriority === 'all' || notification.priority === filterPriority;
    const matchesType = filterType === 'all' || notification.notification_type === filterType;
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'read' && notification.is_read) ||
                         (filterStatus === 'unread' && !notification.is_read) ||
                         (filterStatus === 'sent' && notification.is_sent);

    return matchesSearch && matchesPriority && matchesType && matchesStatus;
  });

  const formatNumber = (num: number | undefined | null) => {
    if (num === undefined || num === null) {
      return '0';
    }
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 text-lg">Loading notifications...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Notification Management</h1>
            <p className="text-gray-600 mt-2 text-lg">Manage and monitor all platform notifications.</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleRefresh}
              className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-200"
            >
              <ArrowPathIcon className="w-5 h-5 mr-2" />
              Refresh
            </button>
            <button className="flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl">
              <PlusIcon className="w-5 h-5 mr-2" />
              New Notification
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Total Notifications</p>
                  <p className="text-4xl font-bold text-gray-900 mt-2">{formatNumber(stats?.total || 0)}</p>
                </div>
                <div className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg">
                  <BellIcon className="w-8 h-8 text-white" />
                </div>
              </div>
              <div className="mt-6 flex items-center text-sm">
                <span className="text-red-600 font-semibold">{stats?.unread || 0}</span>
                <span className="text-gray-500 ml-2">unread</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Sent Today</p>
                  <p className="text-4xl font-bold text-gray-900 mt-2">{formatNumber(stats?.sent_today || 0)}</p>
                </div>
                <div className="p-4 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-lg">
                  <EnvelopeIcon className="w-8 h-8 text-white" />
                </div>
              </div>
              <div className="mt-6 flex items-center text-sm">
                <span className="text-green-600 font-semibold">+{stats?.sent_week || 0}</span>
                <span className="text-gray-500 ml-2">this week</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">High Priority</p>
                  <p className="text-4xl font-bold text-gray-900 mt-2">{formatNumber((stats.by_priority?.high || 0) + (stats.by_priority?.urgent || 0))}</p>
                </div>
                <div className="p-4 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl shadow-lg">
                  <ExclamationTriangleIcon className="w-8 h-8 text-white" />
                </div>
              </div>
              <div className="mt-6 flex items-center text-sm">
                <span className="text-red-600 font-semibold">{stats.by_priority?.urgent || 0}</span>
                <span className="text-gray-500 ml-2">urgent</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Email Notifications</p>
                  <p className="text-4xl font-bold text-gray-900 mt-2">{formatNumber(stats.by_type?.email || 0)}</p>
                </div>
                <div className="p-4 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-lg">
                  <EnvelopeIcon className="w-8 h-8 text-white" />
                </div>
              </div>
              <div className="mt-6 flex items-center text-sm">
                <span className="text-purple-600 font-semibold">{stats.by_type?.push || 0}</span>
                <span className="text-gray-500 ml-2">push notifications</span>
              </div>
            </div>
          </div>
        )}

        {/* Filters and Search */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search notifications..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-200"
              >
                <FunnelIcon className="w-5 h-5 mr-2" />
                Filters
                {showFilters ? (
                  <ChevronUpIcon className="w-4 h-4 ml-2" />
                ) : (
                  <ChevronDownIcon className="w-4 h-4 ml-2" />
                )}
              </button>
            </div>
          </div>

          {/* Filter Options */}
          {showFilters && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                  <select
                    value={filterPriority}
                    onChange={(e) => setFilterPriority(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Priorities</option>
                    <option value="urgent">Urgent</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Types</option>
                    <option value="email">Email</option>
                    <option value="push">Push</option>
                    <option value="sms">SMS</option>
                    <option value="in_app">In-App</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Status</option>
                    <option value="read">Read</option>
                    <option value="unread">Unread</option>
                    <option value="sent">Sent</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Notifications Table */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Notifications ({filteredNotifications.length})
            </h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredNotifications.map((notification) => (
                  <tr key={notification.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-semibold text-sm">
                            {notification.user?.first_name?.[0] || 'U'}{notification.user?.last_name?.[0] || 'S'}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {notification.user?.first_name || 'N/A'} {notification.user?.last_name || 'N/A'}
                          </div>
                          <div className="text-sm text-gray-500">{notification.user?.email || 'N/A'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{notification.title}</div>
                      <div className="text-sm text-gray-500 truncate max-w-xs">{notification.message}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getTypeIcon(notification.notification_type)}
                        <span className="ml-2 text-sm text-gray-900 capitalize">{notification.notification_type.replace('_', ' ')}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getPriorityColor(notification.priority)}`}>
                        {getPriorityIcon(notification.priority)}
                        <span className="ml-1 capitalize">{notification.priority}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col space-y-1">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          notification.is_read 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {notification.is_read ? 'Read' : 'Unread'}
                        </span>
                        {notification.is_sent && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Sent
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(notification.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleViewNotification(notification)}
                          className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                        >
                          <EyeIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteNotification(notification)}
                          className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredNotifications.length === 0 && (
            <div className="text-center py-12">
              <BellIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications found</h3>
              <p className="text-gray-500">Try adjusting your search or filter criteria.</p>
            </div>
          )}
        </div>

        {/* Templates Section */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">Notification Templates</h3>
            <button className="flex items-center px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-200">
              <PlusIcon className="w-5 h-5 mr-2" />
              New Template
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template) => (
              <div key={template.id} className="bg-gray-50 rounded-xl p-6 hover:bg-gray-100 transition-colors">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-gray-900">{template.name}</h4>
                  <span className="text-xs text-gray-500 capitalize">{template.notification_type}</span>
                </div>
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">{template.message_template}</p>
                <div className="flex items-center justify-between">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getPriorityColor(template.default_priority)}`}>
                    {template.default_priority}
                  </span>
                  <div className="flex space-x-2">
                    <button className="p-1 text-blue-600 hover:bg-blue-100 rounded transition-colors">
                      <PencilIcon className="w-4 h-4" />
                    </button>
                    <button className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors">
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Notification Detail Modal */}
      {showNotificationModal && selectedNotification && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={() => setShowNotificationModal(false)}></div>
            </div>
            
            <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-6 pt-6 pb-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Notification Details</h3>
                  <button
                    onClick={() => setShowNotificationModal(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                    <p className="text-sm text-gray-900">{selectedNotification.title}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                    <p className="text-sm text-gray-900">{selectedNotification.message}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getPriorityColor(selectedNotification.priority)}`}>
                        {getPriorityIcon(selectedNotification.priority)}
                        <span className="ml-1 capitalize">{selectedNotification.priority}</span>
                      </span>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                      <div className="flex items-center">
                        {getTypeIcon(selectedNotification.notification_type)}
                        <span className="ml-2 text-sm text-gray-900 capitalize">{selectedNotification.notification_type.replace('_', ' ')}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Recipient</label>
                    <p className="text-sm text-gray-900">
                      {selectedNotification.user.first_name} {selectedNotification.user.last_name}
                    </p>
                    <p className="text-sm text-gray-500">{selectedNotification.user.email}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Created</label>
                      <p className="text-sm text-gray-900">
                        {new Date(selectedNotification.created_at).toLocaleString()}
                      </p>
                    </div>
                    
                    {selectedNotification.sent_at && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Sent</label>
                        <p className="text-sm text-gray-900">
                          {new Date(selectedNotification.sent_at).toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3">
                <button
                  onClick={() => setShowNotificationModal(false)}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Snackbar */}
      {snackbar.open && (
        <div className={`fixed top-4 right-4 z-50 max-w-sm w-full bg-white rounded-xl shadow-2xl border-l-4 transform transition-all duration-300 ease-in-out ${
          snackbar.type === 'success' ? 'border-green-500' : 
          snackbar.type === 'error' ? 'border-red-500' : 
          snackbar.type === 'warning' ? 'border-yellow-500' : 'border-blue-500'
        }`}>
          <div className="p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                {snackbar.type === 'success' && (
                  <CheckCircleIcon className="w-6 h-6 text-green-500" />
                )}
                {snackbar.type === 'error' && (
                  <XCircleIcon className="w-6 h-6 text-red-500" />
                )}
                {snackbar.type === 'warning' && (
                  <ExclamationTriangleIcon className="w-6 h-6 text-yellow-500" />
                )}
                {snackbar.type === 'info' && (
                  <InformationCircleIcon className="w-6 h-6 text-blue-500" />
                )}
              </div>
              <div className="ml-3 flex-1">
                <p className={`text-sm font-medium ${
                  snackbar.type === 'success' ? 'text-green-800' : 
                  snackbar.type === 'error' ? 'text-red-800' : 
                  snackbar.type === 'warning' ? 'text-yellow-800' : 'text-blue-800'
                }`}>
                  {snackbar.message}
                </p>
              </div>
              <div className="ml-4 flex-shrink-0">
                <button
                  onClick={() => setSnackbar({ ...snackbar, open: false })}
                  className={`inline-flex rounded-lg p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                    snackbar.type === 'success' ? 'text-green-500 hover:bg-green-100 focus:ring-green-500' : 
                    snackbar.type === 'error' ? 'text-red-500 hover:bg-red-100 focus:ring-red-500' : 
                    snackbar.type === 'warning' ? 'text-yellow-500 hover:bg-yellow-100 focus:ring-yellow-500' : 
                    'text-blue-500 hover:bg-blue-100 focus:ring-blue-500'
                  }`}
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminNotificationsPage; 