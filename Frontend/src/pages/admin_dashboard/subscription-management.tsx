import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/hooks/useAuth';
import AdminLayout from '@/components/admin_dashboard/AdminLayout';
import {
  CreditCardIcon,
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
  UserIcon,
  BuildingOfficeIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  XMarkIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  StarIcon,
  InformationCircleIcon,
  GlobeAltIcon,
  ArrowTrendingUpIcon,
  UsersIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  duration_days: number;
  plan_type: string;
  daily_application_limit: number;
  features: string[];
  is_active: boolean;
  priority_support: boolean;
  advanced_analytics: boolean;
  custom_branding: boolean;
  api_access: boolean;
}

interface UserSubscription {
  id: string;
  user: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  plan: {
    id: string;
    name: string;
    plan_type: string;
  };
  status: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  auto_renew: boolean;
  days_remaining: number;
}

interface SubscriptionStats {
  total_subscriptions: number;
  active_subscriptions: number;
  expired_subscriptions: number;
  plan_distribution: Record<string, number>;
  monthly_revenue: number;
  total_users: number;
}

interface SnackbarState {
  open: boolean;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

const AdminSubscriptionManagement: React.FC = () => {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [userSubscriptions, setUserSubscriptions] = useState<UserSubscription[]>([]);
  const [stats, setStats] = useState<SubscriptionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<SnackbarState>({ open: false, message: '', type: 'success' });
  
  // Plan management
  const [planDialogOpen, setPlanDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [planForm, setPlanForm] = useState({
    name: '',
    description: '',
    price: 0,
    duration_days: 30,
    plan_type: 'free',
    daily_application_limit: 5,
    features: [] as string[],
    is_active: true,
    priority_support: false,
    advanced_analytics: false,
    custom_branding: false,
    api_access: false,
  });

  // Search and filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    if (isAuthenticated && user?.user_type === 'admin') {
      fetchData();
    }
  }, [isAuthenticated, user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      
      if (!token) {
        setError('Authentication required');
        return;
      }

      // Fetch plans
      const plansResponse = await fetch('http://127.0.0.1:8000/api/v1/subscriptions/admin/admin-plans/', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (plansResponse.ok) {
        const plansData = await plansResponse.json();
        setPlans(plansData.results || plansData);
      }

      // Fetch user subscriptions
      const subscriptionsResponse = await fetch('http://127.0.0.1:8000/api/v1/subscriptions/admin/admin-subscriptions/', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (subscriptionsResponse.ok) {
        const subscriptionsData = await subscriptionsResponse.json();
        setUserSubscriptions(subscriptionsData.results || subscriptionsData);
      }

      // Fetch stats
      const statsResponse = await fetch('http://127.0.0.1:8000/api/v1/subscriptions/admin/admin-subscriptions/stats/', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }
    } catch (err) {
      setError('Error fetching data');
    } finally {
      setLoading(false);
    }
  };

  const handlePlanEdit = (plan: SubscriptionPlan) => {
    setEditingPlan(plan);
    setPlanForm({
      name: plan.name,
      description: plan.description,
      price: plan.price,
      duration_days: plan.duration_days || 30,
      plan_type: plan.plan_type,
      daily_application_limit: plan.daily_application_limit,
      features: plan.features,
      is_active: plan.is_active,
      priority_support: plan.priority_support,
      advanced_analytics: plan.advanced_analytics,
      custom_branding: plan.custom_branding,
      api_access: plan.api_access,
    });
    setPlanDialogOpen(true);
  };

  const handlePlanCreate = () => {
    setEditingPlan(null);
    setPlanForm({
      name: '',
      description: '',
      price: 0,
      duration_days: 30,
      plan_type: 'free',
      daily_application_limit: 5,
      features: [] as string[],
      is_active: true,
      priority_support: false,
      advanced_analytics: false,
      custom_branding: false,
      api_access: false,
    });
    setPlanDialogOpen(true);
  };

  const handlePlanSave = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;

      const url = editingPlan 
        ? `http://127.0.0.1:8000/api/v1/subscriptions/admin/admin-plans/${editingPlan.id}/`
        : 'http://127.0.0.1:8000/api/v1/subscriptions/admin/admin-plans/';

      const response = await fetch(url, {
        method: editingPlan ? 'PUT' : 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(planForm),
      });

      if (response.ok) {
        setSnackbar({
          open: true,
          message: `Plan ${editingPlan ? 'updated' : 'created'} successfully`,
          type: 'success'
        });
        setPlanDialogOpen(false);
        fetchData();
      } else {
        const errorData = await response.json();
        console.error('Plan save error:', errorData);
        let errorMessage = 'Failed to save plan';
        
        if (errorData.message) {
          errorMessage = errorData.message;
        } else if (typeof errorData === 'object') {
          // Handle validation errors
          const errorMessages: string[] = [];
          Object.keys(errorData).forEach(field => {
            if (Array.isArray(errorData[field])) {
              errorMessages.push(`${field}: ${errorData[field].join(', ')}`);
            } else {
              errorMessages.push(`${field}: ${errorData[field]}`);
            }
          });
          errorMessage = errorMessages.join('; ');
        }
        
        setSnackbar({
          open: true,
          message: errorMessage,
          type: 'error'
        });
      }
    } catch (err) {
      setSnackbar({
        open: true,
        message: 'Error saving plan',
        type: 'error'
      });
    }
  };

  const handlePlanDelete = async (planId: string, hardDelete: boolean = false) => {
    const deleteType = hardDelete ? 'permanently delete' : 'delete';
    const confirmMessage = hardDelete 
      ? 'Are you sure you want to PERMANENTLY delete this plan? This cannot be undone and will fail if there are active subscriptions.'
      : 'Are you sure you want to delete this plan? It will be marked as deleted but can be restored.';
    
    if (!confirm(confirmMessage)) return;

    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        setSnackbar({
          open: true,
          message: 'Authentication required',
          type: 'error'
        });
        return;
      }

      const url = hardDelete 
        ? `http://127.0.0.1:8000/api/v1/subscriptions/admin/admin-plans/${planId}/?hard=true`
        : `http://127.0.0.1:8000/api/v1/subscriptions/admin/admin-plans/${planId}/`;

      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setSnackbar({
          open: true,
          message: `Plan ${deleteType}d successfully`,
          type: 'success'
        });
        fetchData();
      } else {
        // Handle error responses
        const errorData = await response.json().catch(() => ({}));
        console.error('Delete error:', response.status, errorData);
        
        let errorMessage = `Failed to ${deleteType} plan`;
        if (response.status === 404) {
          errorMessage = 'Plan not found';
        } else if (response.status === 403) {
          errorMessage = 'Permission denied';
        } else if (response.status === 400) {
          errorMessage = errorData.error || 'Cannot delete plan with active subscriptions';
        } else if (errorData.detail) {
          errorMessage = errorData.detail;
        } else if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.error) {
          errorMessage = errorData.error;
        }
        
        setSnackbar({
          open: true,
          message: errorMessage,
          type: 'error'
        });
      }
    } catch (err) {
      console.error('Delete exception:', err);
      setSnackbar({
        open: true,
        message: 'Network error while deleting plan',
        type: 'error'
      });
    }
  };

  const handleCheckExpired = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;

      const response = await fetch('http://127.0.0.1:8000/api/v1/subscriptions/admin/admin-subscriptions/check_expired/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSnackbar({
          open: true,
          message: `${data.updated_count} expired subscriptions updated`,
          type: 'success'
        });
        fetchData();
      }
    } catch (err) {
      setSnackbar({
        open: true,
        message: 'Error checking expired subscriptions',
        type: 'error'
      });
    }
  };

  const handleRefresh = async () => {
    await fetchData();
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'expired': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircleIcon className="w-4 h-4" />;
      case 'expired': return <XCircleIcon className="w-4 h-4" />;
      case 'cancelled': return <ClockIcon className="w-4 h-4" />;
      default: return <InformationCircleIcon className="w-4 h-4" />;
    }
  };

  const getPlanTypeColor = (type: string) => {
    switch (type) {
      case 'free': return 'bg-gray-100 text-gray-800';
      case 'standard': return 'bg-blue-100 text-blue-800';
      case 'premium': return 'bg-purple-100 text-purple-800';
      case 'enterprise': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Auto-hide snackbar after 5 seconds
  useEffect(() => {
    if (snackbar.open) {
      const timer = setTimeout(() => {
        setSnackbar({ ...snackbar, open: false });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [snackbar.open]);

  if (!isAuthenticated || user?.user_type !== 'admin') {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircleIcon className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h3>
            <p className="text-gray-600">Admin privileges required.</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 text-lg">Loading subscription data...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircleIcon className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Error Loading Data</h3>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={handleRefresh}
              className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Try Again
            </button>
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
            <h1 className="text-4xl font-bold text-gray-900">Subscription Management</h1>
            <p className="text-gray-600 mt-2 text-lg">Manage subscription plans and monitor user subscriptions.</p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={handleRefresh}
              className="flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <ArrowPathIcon className="w-5 h-5 mr-2" />
              Refresh Data
            </button>
            <button
              onClick={handlePlanCreate}
              className="flex items-center px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              Create Plan
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Total Subscriptions</p>
                  <p className="text-4xl font-bold text-gray-900 mt-2">{formatNumber(stats.total_subscriptions)}</p>
                </div>
                <div className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg">
                  <CreditCardIcon className="w-8 h-8 text-white" />
                </div>
              </div>
              <div className="mt-6 flex items-center text-sm">
                <span className="text-green-600 font-semibold">{stats.active_subscriptions}</span>
                <span className="text-gray-500 ml-2">active</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Active Subscriptions</p>
                  <p className="text-4xl font-bold text-gray-900 mt-2">{formatNumber(stats.active_subscriptions)}</p>
                </div>
                <div className="p-4 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-lg">
                  <CheckCircleIcon className="w-8 h-8 text-white" />
                </div>
              </div>
              <div className="mt-6 flex items-center text-sm">
                <span className="text-green-600 font-semibold">+{stats.total_subscriptions - stats.active_subscriptions}</span>
                <span className="text-gray-500 ml-2">inactive</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Monthly Revenue</p>
                  <p className="text-4xl font-bold text-gray-900 mt-2">${formatNumber(stats.monthly_revenue)}</p>
                </div>
                <div className="p-4 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-2xl shadow-lg">
                  <CurrencyDollarIcon className="w-8 h-8 text-white" />
                </div>
              </div>
              <div className="mt-6 flex items-center text-sm">
                <span className="text-green-600 font-semibold">+{stats.active_subscriptions}</span>
                <span className="text-gray-500 ml-2">paying users</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Total Users</p>
                  <p className="text-4xl font-bold text-gray-900 mt-2">{formatNumber(stats.total_users)}</p>
                </div>
                <div className="p-4 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-lg">
                  <UsersIcon className="w-8 h-8 text-white" />
                </div>
              </div>
              <div className="mt-6 flex items-center text-sm">
                <span className="text-green-600 font-semibold">{Math.round((stats.active_subscriptions / stats.total_users) * 100)}%</span>
                <span className="text-gray-500 ml-2">conversion rate</span>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-8" aria-label="Tabs">
              <button
                onClick={() => setActiveTab(0)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 0
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Subscription Plans
              </button>
              <button
                onClick={() => setActiveTab(1)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 1
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                User Subscriptions
              </button>
              <button
                onClick={() => setActiveTab(2)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 2
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Analytics
              </button>
            </nav>
          </div>

          <div className="p-8">
            {/* Plans Tab */}
            {activeTab === 0 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Subscription Plans</h3>
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search plans..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <select
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="all">All Types</option>
                      <option value="free">Free</option>
                      <option value="standard">Standard</option>
                      <option value="premium">Premium</option>
                      <option value="enterprise">Enterprise</option>
                    </select>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plan Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Daily Limit</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {plans
                        .filter(plan => 
                          plan.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
                          (filterType === 'all' || plan.plan_type === filterType)
                        )
                        .map((plan) => (
                        <tr key={plan.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{plan.name}</div>
                              <div className="text-sm text-gray-500">{plan.description}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPlanTypeColor(plan.plan_type)}`}>
                              {plan.plan_type.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            ${plan.price}/month
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {plan.duration_days} days
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {plan.daily_application_limit} companies
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${plan.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                              {plan.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handlePlanEdit(plan)}
                                className="text-blue-600 hover:text-blue-900 p-1 rounded"
                                title="Edit Plan"
                              >
                                <PencilIcon className="w-4 h-4" />
                              </button>
                              <div className="relative group">
                                <button
                                  onClick={() => handlePlanDelete(plan.id, false)}
                                  className="text-red-600 hover:text-red-900 p-1 rounded"
                                  title="Soft Delete (can be restored)"
                                >
                                  <TrashIcon className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handlePlanDelete(plan.id, true);
                                  }}
                                  className="text-red-800 hover:text-red-900 p-1 rounded ml-1 opacity-70 hover:opacity-100"
                                  title="Permanent Delete (cannot be undone)"
                                >
                                  <XMarkIcon className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* User Subscriptions Tab */}
            {activeTab === 1 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">User Subscriptions</h3>
                  <button
                    onClick={handleCheckExpired}
                    className="flex items-center px-4 py-2 bg-gradient-to-r from-orange-600 to-orange-700 text-white rounded-lg hover:from-orange-700 hover:to-orange-800 transition-all duration-200"
                  >
                    <ClockIcon className="w-4 h-4 mr-2" />
                    Check Expired
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plan</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">End Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Days Remaining</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Auto Renew</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {userSubscriptions.map((subscription) => (
                        <tr key={subscription.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {subscription.user.first_name} {subscription.user.last_name}
                              </div>
                              <div className="text-sm text-gray-500">{subscription.user.email}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPlanTypeColor(subscription.plan.plan_type)}`}>
                              {subscription.plan.name}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(subscription.status)}`}>
                              {getStatusIcon(subscription.status)}
                              <span className="ml-1">{subscription.status}</span>
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDate(subscription.start_date)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDate(subscription.end_date)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              subscription.days_remaining > 30 ? 'bg-green-100 text-green-800' : 
                              subscription.days_remaining > 7 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {subscription.days_remaining} days
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${subscription.auto_renew ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                              {subscription.auto_renew ? 'Yes' : 'No'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Analytics Tab */}
            {activeTab === 2 && stats && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Plan Distribution</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {Object.entries(stats.plan_distribution).map(([planName, count]) => (
                    <div key={planName} className="bg-gray-50 rounded-xl p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">{planName}</p>
                          <p className="text-2xl font-bold text-gray-900">{count}</p>
                        </div>
                        <div className="p-3 bg-white rounded-lg shadow-sm">
                          <CreditCardIcon className="w-6 h-6 text-gray-600" />
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">subscribers</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Plan Dialog */}
        {planDialogOpen && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {editingPlan ? 'Edit Plan' : 'Create Plan'}
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Plan Name</label>
                    <input
                      type="text"
                      value={planForm.name}
                      onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Plan Type</label>
                    <select
                      value={planForm.plan_type}
                      onChange={(e) => setPlanForm({ ...planForm, plan_type: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="free">Free</option>
                      <option value="standard">Standard</option>
                      <option value="premium">Premium</option>
                      <option value="enterprise">Enterprise</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Price</label>
                    <input
                      type="number"
                      step="0.01"
                      value={planForm.price}
                      onChange={(e) => setPlanForm({ ...planForm, price: parseFloat(e.target.value) || 0 })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Duration (Days)</label>
                    <input
                      type="number"
                      value={planForm.duration_days}
                      onChange={(e) => setPlanForm({ ...planForm, duration_days: parseInt(e.target.value) || 30 })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Daily Application Limit</label>
                    <input
                      type="number"
                      value={planForm.daily_application_limit}
                      onChange={(e) => setPlanForm({ ...planForm, daily_application_limit: parseInt(e.target.value) || 5 })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <textarea
                      value={planForm.description}
                      onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })}
                      rows={3}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={planForm.is_active}
                      onChange={(e) => setPlanForm({ ...planForm, is_active: e.target.checked })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-gray-900">Active</label>
                  </div>
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => setPlanDialogOpen(false)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handlePlanSave}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    {editingPlan ? 'Update' : 'Create'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Snackbar */}
        {snackbar.open && (
          <div className={`fixed bottom-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
            snackbar.type === 'success' ? 'bg-green-500 text-white' :
            snackbar.type === 'error' ? 'bg-red-500 text-white' :
            snackbar.type === 'warning' ? 'bg-yellow-500 text-white' :
            'bg-blue-500 text-white'
          }`}>
            <div className="flex items-center">
              {snackbar.type === 'success' && <CheckCircleIcon className="w-5 h-5 mr-2" />}
              {snackbar.type === 'error' && <XCircleIcon className="w-5 h-5 mr-2" />}
              {snackbar.type === 'warning' && <ExclamationTriangleIcon className="w-5 h-5 mr-2" />}
              {snackbar.type === 'info' && <InformationCircleIcon className="w-5 h-5 mr-2" />}
              <span>{snackbar.message}</span>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminSubscriptionManagement; 