import React, { useState, useEffect } from 'react';
import {
  UsersIcon,
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
  AcademicCapIcon,
  BriefcaseIcon,
  EnvelopeIcon,
  PhoneIcon,
  GlobeAltIcon,
  DocumentTextIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../../hooks/useAuth';
import AdminLayout from '../../components/admin_dashboard/AdminLayout';

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  user_type: 'job_seeker' | 'employer' | 'admin';
  is_active: boolean;
  is_verified: boolean;
  date_joined: string;
  last_login?: string;
  profile?: UserProfile;
  experiences?: UserExperience[];
  educations?: UserEducation[];
}

interface UserProfile {
  id: string;
  bio: string;
    phone: string;
  website: string;
  linkedin_url: string;
  github_url: string;
  avatar?: string;
    location_text: string;
    current_job_title: string;
  experience_level: 'entry' | 'mid' | 'senior' | 'executive';
  expected_salary_min?: number;
  expected_salary_max?: number;
  resume?: string;
  skills_text: string;
  experience: string;
  is_open_to_work: boolean;
  is_public_profile: boolean;
  email_notifications: boolean;
  sms_notifications: boolean;
}

interface UserExperience {
  id: string;
  job_title: string;
  company_name: string;
  location: string;
  start_date: string;
  end_date?: string;
  is_current: boolean;
  description: string;
}

interface UserEducation {
  id: string;
  degree: string;
  field_of_study: string;
  school_name: string;
  start_date: string;
  end_date?: string;
  is_current: boolean;
  description: string;
}

interface UserStats {
  total: number;
  active: number;
  verified: number;
  new_today: number;
  new_week: number;
  by_type: {
    job_seekers: number;
    employers: number;
    admins: number;
  };
  with_profiles: number;
  with_experience: number;
  with_education: number;
}

const AdminUsersPage: React.FC = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterVerified, setFilterVerified] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'profile' | 'experience' | 'education'>('overview');
  const [actionLoading, setActionLoading] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
  }>({ open: false, message: '', type: 'success' });

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('http://127.0.0.1:8000/api/v1/users/admin-users/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      setUsers(data.results || data);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to load users';
      setError(errorMessage);
      setSnackbar({
        open: true,
        message: errorMessage,
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/api/v1/users/admin-users/stats/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Failed to fetch user stats:', err);
    }
  };

  const handleRefresh = async () => {
    await Promise.all([fetchUsers(), fetchStats()]);
    setSnackbar({
      open: true,
      message: 'User data refreshed successfully!',
      type: 'success'
    });
  };

  const handleViewUser = (user: User) => {
    setSelectedUser(user);
    setShowUserModal(true);
    setActiveTab('overview');
  };

  const handleToggleActive = async (user: User) => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/v1/users/admin-users/${user.id}/toggle-active/`, {
        method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
            'Content-Type': 'application/json',
          },
        body: JSON.stringify({ is_active: !user.is_active }),
      });

      if (response.ok) {
        setUsers(users.map(u => 
          u.id === user.id ? { ...u, is_active: !u.is_active } : u
        ));
        setSnackbar({
          open: true,
          message: `User ${user.is_active ? 'deactivated' : 'activated'} successfully!`,
          type: 'success'
        });
      } else {
        throw new Error('Failed to update user status');
      }
    } catch (err: any) {
      setSnackbar({
        open: true,
        message: err.message || 'Failed to update user status',
        type: 'error'
      });
    }
  };

  const handleToggleVerified = async (user: User) => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/v1/users/admin-users/${user.id}/toggle-verified/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_verified: !user.is_verified }),
      });

      if (response.ok) {
        setUsers(users.map(u => 
          u.id === user.id ? { ...u, is_verified: !u.is_verified } : u
        ));
        setSnackbar({ 
          open: true, 
          message: `User ${user.is_verified ? 'unverified' : 'verified'} successfully!`,
          type: 'success'
        });
      } else {
        throw new Error('Failed to update user verification');
      }
    } catch (err: any) {
        setSnackbar({ 
          open: true, 
        message: err.message || 'Failed to update user verification',
        type: 'error'
      });
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setShowEditModal(true);
  };

  const handleDeleteUser = (user: User) => {
    setDeletingUser(user);
    setShowDeleteModal(true);
  };

  const handleUpdateUser = async (updatedUser: Partial<User>) => {
    if (!editingUser) return;

    try {
      setActionLoading(true);
      
      // Determine if this is a create or update operation
      const isCreate = !editingUser.id;
      const url = isCreate 
        ? 'http://127.0.0.1:8000/api/v1/users/admin-users/'
        : `http://127.0.0.1:8000/api/v1/users/admin-users/${editingUser.id}/`;
      
      const method = isCreate ? 'POST' : 'PATCH';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedUser),
      });

      if (response.ok) {
        const resultData = await response.json();
        
        if (isCreate) {
          // Add new user to the list
          setUsers([resultData, ...users]);
          setSnackbar({
            open: true,
            message: 'User created successfully!',
            type: 'success'
          });
      } else {
          // Update existing user
          setUsers(users.map(u => 
            u.id === editingUser.id ? { ...u, ...resultData } : u
          ));
          setSnackbar({
            open: true,
            message: 'User updated successfully!',
            type: 'success'
          });
        }
        
        setShowEditModal(false);
        setEditingUser(null);
      } else {
        throw new Error(`Failed to ${isCreate ? 'create' : 'update'} user`);
      }
    } catch (err: any) {
      setSnackbar({
        open: true,
        message: err.message || `Failed to ${editingUser.id ? 'update' : 'create'} user`,
        type: 'error'
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingUser) return;

    try {
      setActionLoading(true);
      const response = await fetch(`http://127.0.0.1:8000/api/v1/users/admin-users/${deletingUser.id}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      });

      if (response.ok) {
        setUsers(users.filter(u => u.id !== deletingUser.id));
        setSnackbar({
          open: true,
          message: 'User permanently deleted successfully!',
          type: 'success'
        });
        setShowDeleteModal(false);
        setDeletingUser(null);
      } else {
        throw new Error('Failed to delete user');
      }
    } catch (err: any) {
      setSnackbar({
        open: true,
        message: err.message || 'Failed to delete user',
        type: 'error'
      });
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusColor = (isActive: boolean, isVerified: boolean) => {
    if (!isActive) return 'text-red-600 bg-red-100';
    if (!isVerified) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  };

  const getStatusText = (isActive: boolean, isVerified: boolean) => {
    if (!isActive) return 'Inactive';
    if (!isVerified) return 'Unverified';
    return 'Active';
  };

  const getStatusIcon = (isActive: boolean, isVerified: boolean) => {
    if (!isActive) return <XCircleIcon className="w-4 h-4" />;
    if (!isVerified) return <ExclamationTriangleIcon className="w-4 h-4" />;
    return <CheckCircleIcon className="w-4 h-4" />;
  };

  const getUserTypeColor = (type: string) => {
    switch (type) {
      case 'job_seeker':
        return 'text-blue-600 bg-blue-100';
      case 'employer':
        return 'text-purple-600 bg-purple-100';
      case 'admin':
        return 'text-green-600 bg-green-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.last_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'all' || user.user_type === filterType;
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && user.is_active) ||
                         (filterStatus === 'inactive' && !user.is_active);
    const matchesVerified = filterVerified === 'all' ||
                           (filterVerified === 'verified' && user.is_verified) ||
                           (filterVerified === 'unverified' && !user.is_verified);
    
    return matchesSearch && matchesType && matchesStatus && matchesVerified;
  });

  useEffect(() => {
    fetchUsers();
    fetchStats();
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

  if (loading) {
      return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 text-lg">Loading users...</p>
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
            <h3 className="text-xl font-bold text-gray-900 mb-2">Error Loading Users</h3>
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
            <h1 className="text-4xl font-bold text-gray-900">User Management</h1>
            <p className="text-gray-600 mt-2 text-lg">Manage all users, profiles, experiences, and education records.</p>
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
              onClick={() => {
                setEditingUser({
                  id: '',
                  email: '',
                  first_name: '',
                  last_name: '',
                  user_type: 'job_seeker',
                  is_active: true,
                  is_verified: false,
                  date_joined: new Date().toISOString(),
                });
                setShowEditModal(true);
              }}
              className="flex items-center px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              Create User
            </button>
          </div>
          </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Total Users */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Total Users</p>
                <p className="text-4xl font-bold text-gray-900 mt-2">{formatNumber(stats?.total || 0)}</p>
              </div>
              <div className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg">
                <UsersIcon className="w-8 h-8 text-white" />
              </div>
            </div>
            <div className="mt-6 flex items-center text-sm">
              <span className="text-green-600 font-semibold">+{stats?.new_today || 0}</span>
              <span className="text-gray-500 ml-2">new today</span>
            </div>
          </div>

          {/* Active Users */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Active Users</p>
                <p className="text-4xl font-bold text-gray-900 mt-2">{formatNumber(stats?.active || 0)}</p>
              </div>
              <div className="p-4 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-lg">
                <CheckCircleIcon className="w-8 h-8 text-white" />
              </div>
            </div>
            <div className="mt-6 flex items-center text-sm">
              <span className="text-green-600 font-semibold">{stats?.verified || 0}</span>
              <span className="text-gray-500 ml-2">verified</span>
            </div>
          </div>

          {/* Job Seekers */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Job Seekers</p>
                <p className="text-4xl font-bold text-gray-900 mt-2">{formatNumber(stats?.by_type?.job_seekers || 0)}</p>
              </div>
              <div className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg">
                <UserIcon className="w-8 h-8 text-white" />
              </div>
            </div>
            <div className="mt-6 flex items-center text-sm">
              <span className="text-blue-600 font-semibold">{stats?.with_profiles || 0}</span>
              <span className="text-gray-500 ml-2">with profiles</span>
            </div>
          </div>

          {/* Employers */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Employers</p>
                <p className="text-4xl font-bold text-gray-900 mt-2">{formatNumber(stats?.by_type?.employers || 0)}</p>
              </div>
              <div className="p-4 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-lg">
                <BuildingOfficeIcon className="w-8 h-8 text-white" />
              </div>
            </div>
            <div className="mt-6 flex items-center text-sm">
              <span className="text-purple-600 font-semibold">{stats?.by_type?.admins || 0}</span>
              <span className="text-gray-500 ml-2">admins</span>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">Users ({filteredUsers.length})</h3>
            <div className="flex items-center space-x-4">
                <div className="relative">
                <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                  placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FunnelIcon className="w-5 h-5 mr-2" />
                Filters
                {showFilters ? <ChevronUpIcon className="w-4 h-4 ml-1" /> : <ChevronDownIcon className="w-4 h-4 ml-1" />}
              </button>
                </div>
              </div>
              
          {/* Filters */}
          {showFilters && (
            <div className="mb-6 p-4 bg-gray-50 rounded-xl">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">User Type</label>
                <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Types</option>
                    <option value="job_seeker">Job Seekers</option>
                    <option value="employer">Employers</option>
                    <option value="admin">Admins</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Verification</label>
                  <select
                    value={filterVerified}
                    onChange={(e) => setFilterVerified(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All</option>
                  <option value="verified">Verified</option>
                  <option value="unverified">Unverified</option>
                </select>
              </div>
              </div>
                    </div>
                  )}

          {/* Users Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                          <UserIcon className="w-6 h-6 text-white" />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {user.first_name} {user.last_name}
                              </div>
                              <div className="text-sm text-gray-500">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getUserTypeColor(user.user_type)}`}>
                        {user.user_type.replace('_', ' ').toUpperCase()}
                      </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(user.is_active, user.is_verified)}`}>
                        {getStatusIcon(user.is_active, user.is_verified)}
                        <span className="ml-1">{getStatusText(user.is_active, user.is_verified)}</span>
                      </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(user.date_joined)}
                        </td>
                                         <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                       <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleViewUser(user)}
                              className="text-blue-600 hover:text-blue-900"
                           title="View Details"
                            >
                              <EyeIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleEditUser(user)}
                              className="text-green-600 hover:text-green-900"
                           title="Edit User"
                            >
                              <PencilIcon className="w-4 h-4" />
                            </button>
                            <button
                           onClick={() => handleToggleActive(user)}
                           className={`${user.is_active ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}`}
                           title={user.is_active ? 'Deactivate' : 'Activate'}
                            >
                           {user.is_active ? <XCircleIcon className="w-4 h-4" /> : <CheckCircleIcon className="w-4 h-4" />}
                            </button>
                            <button
                           onClick={() => handleToggleVerified(user)}
                           className={`${user.is_verified ? 'text-yellow-600 hover:text-yellow-900' : 'text-green-600 hover:text-green-900'}`}
                           title={user.is_verified ? 'Unverify' : 'Verify'}
                            >
                           <ShieldCheckIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user)}
                              className="text-red-600 hover:text-red-900"
                           title="Delete User"
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
                </div>

        {/* User Details Modal */}
        {showUserModal && selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-8 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">User Details</h3>
                  <button
                  onClick={() => setShowUserModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                  >
                  <XMarkIcon className="w-6 h-6" />
                  </button>
              </div>

              {/* Tabs */}
              <div className="border-b border-gray-200 mb-6">
                <nav className="-mb-px flex space-x-8">
                  {[
                    { id: 'overview', name: 'Overview', icon: UserIcon },
                    { id: 'profile', name: 'Profile', icon: DocumentTextIcon },
                    { id: 'experience', name: 'Experience', icon: BriefcaseIcon },
                    { id: 'education', name: 'Education', icon: AcademicCapIcon },
                  ].map((tab) => {
                    const IconComponent = tab.icon;
                    return (
                  <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                          activeTab === tab.id
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        <IconComponent className="w-4 h-4 mr-2" />
                        {tab.name}
                  </button>
                    );
                  })}
                </nav>
                </div>

              {/* Tab Content */}
              <div className="space-y-6">
                {activeTab === 'overview' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h4>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Name</label>
                          <p className="text-gray-900">{selectedUser.first_name} {selectedUser.last_name}</p>
              </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Email</label>
                          <p className="text-gray-900">{selectedUser.email}</p>
            </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">User Type</label>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getUserTypeColor(selectedUser.user_type)}`}>
                            {selectedUser.user_type.replace('_', ' ').toUpperCase()}
                          </span>
          </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Status</label>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedUser.is_active, selectedUser.is_verified)}`}>
                            {getStatusIcon(selectedUser.is_active, selectedUser.is_verified)}
                            <span className="ml-1">{getStatusText(selectedUser.is_active, selectedUser.is_verified)}</span>
                          </span>
        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Date Joined</label>
                          <p className="text-gray-900">{formatDate(selectedUser.date_joined)}</p>
                        </div>
                        {selectedUser.last_login && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Last Login</label>
                            <p className="text-gray-900">{formatDate(selectedUser.last_login)}</p>
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <span className="text-gray-700">Profile Complete</span>
                          <span className={`font-semibold ${selectedUser.profile ? 'text-green-600' : 'text-red-600'}`}>
                            {selectedUser.profile ? 'Yes' : 'No'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <span className="text-gray-700">Experience Records</span>
                          <span className="font-semibold text-blue-600">
                            {selectedUser.experiences?.length || 0}
                          </span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <span className="text-gray-700">Education Records</span>
                          <span className="font-semibold text-purple-600">
                            {selectedUser.educations?.length || 0}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'profile' && selectedUser.profile && (
                  <div className="space-y-6">
                    <h4 className="text-lg font-semibold text-gray-900">Profile Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Current Job Title</label>
                        <p className="text-gray-900">{selectedUser.profile.current_job_title || 'Not specified'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Experience Level</label>
                        <p className="text-gray-900">{selectedUser.profile.experience_level || 'Not specified'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Location</label>
                        <p className="text-gray-900">{selectedUser.profile.location_text || 'Not specified'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Phone</label>
                        <p className="text-gray-900">{selectedUser.profile.phone || 'Not specified'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Website</label>
                        <p className="text-gray-900">{selectedUser.profile.website || 'Not specified'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">LinkedIn</label>
                        <p className="text-gray-900">{selectedUser.profile.linkedin_url || 'Not specified'}</p>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Bio</label>
                      <p className="text-gray-900 mt-1">{selectedUser.profile.bio || 'No bio provided'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Skills</label>
                      <p className="text-gray-900 mt-1">{selectedUser.profile.skills_text || 'No skills listed'}</p>
                    </div>
                  </div>
                )}

                {activeTab === 'experience' && (
                  <div className="space-y-6">
                    <h4 className="text-lg font-semibold text-gray-900">Work Experience</h4>
                    {selectedUser.experiences && selectedUser.experiences.length > 0 ? (
                      <div className="space-y-4">
                        {selectedUser.experiences.map((exp) => (
                          <div key={exp.id} className="p-4 border border-gray-200 rounded-lg">
                            <div className="flex items-start justify-between">
                              <div>
                                <h5 className="font-semibold text-gray-900">{exp.job_title}</h5>
                                <p className="text-gray-600">{exp.company_name}</p>
                                <p className="text-sm text-gray-500">{exp.location}</p>
                                <p className="text-sm text-gray-500">
                                  {formatDate(exp.start_date)} - {exp.is_current ? 'Present' : formatDate(exp.end_date || '')}
                                </p>
                              </div>
                              {exp.is_current && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  Current
                                </span>
                              )}
                            </div>
                            {exp.description && (
                              <p className="text-gray-700 mt-2">{exp.description}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500">No experience records found.</p>
                    )}
                  </div>
                )}

                {activeTab === 'education' && (
                  <div className="space-y-6">
                    <h4 className="text-lg font-semibold text-gray-900">Education</h4>
                    {selectedUser.educations && selectedUser.educations.length > 0 ? (
                      <div className="space-y-4">
                        {selectedUser.educations.map((edu) => (
                          <div key={edu.id} className="p-4 border border-gray-200 rounded-lg">
                            <div className="flex items-start justify-between">
                              <div>
                                <h5 className="font-semibold text-gray-900">{edu.degree}</h5>
                                <p className="text-gray-600">{edu.school_name}</p>
                                <p className="text-sm text-gray-500">{edu.field_of_study}</p>
                                <p className="text-sm text-gray-500">
                                  {formatDate(edu.start_date)} - {edu.is_current ? 'Present' : formatDate(edu.end_date || '')}
                                </p>
                              </div>
                              {edu.is_current && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  Current
                                </span>
                              )}
                            </div>
                            {edu.description && (
                              <p className="text-gray-700 mt-2">{edu.description}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500">No education records found.</p>
                    )}
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowUserModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit User Modal */}
        {showEditModal && editingUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">
                  {editingUser.id ? 'Edit User' : 'Create User'}
                </h3>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                handleUpdateUser({
                  first_name: formData.get('first_name') as string,
                  last_name: formData.get('last_name') as string,
                  email: formData.get('email') as string,
                  user_type: formData.get('user_type') as 'job_seeker' | 'employer' | 'admin',
                  is_active: formData.get('is_active') === 'true',
                  is_verified: formData.get('is_verified') === 'true',
                });
              }}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                    <input
                      type="text"
                      name="first_name"
                      defaultValue={editingUser.first_name}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                    <input
                      type="text"
                      name="last_name"
                      defaultValue={editingUser.last_name}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      name="email"
                      defaultValue={editingUser.email}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">User Type</label>
                    <select
                      name="user_type"
                      defaultValue={editingUser.user_type}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="job_seeker">Job Seeker</option>
                      <option value="employer">Employer</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                    <select
                      name="is_active"
                      defaultValue={editingUser.is_active.toString()}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="true">Active</option>
                      <option value="false">Inactive</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Verification</label>
                    <select
                      name="is_verified"
                      defaultValue={editingUser.is_verified.toString()}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="true">Verified</option>
                      <option value="false">Unverified</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {actionLoading 
                      ? (editingUser.id ? 'Updating...' : 'Creating...') 
                      : (editingUser.id ? 'Update User' : 'Create User')
                    }
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete User Modal */}
        {showDeleteModal && deletingUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">Delete User</h3>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
                </div>

                <div className="text-center mb-6">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ExclamationTriangleIcon className="w-8 h-8 text-red-600" />
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">
                  Permanently Delete {deletingUser.first_name} {deletingUser.last_name}?
                </h4>
                <p className="text-gray-600">
                  Are you sure you want to <strong>permanently delete</strong> this user? This action cannot be undone and will permanently remove all associated data including profile, experiences, and education records from the database.
                </p>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  disabled={actionLoading}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {actionLoading ? 'Deleting...' : 'Delete User'}
                </button>
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
      </div>
      </AdminLayout>
  );
};

export default AdminUsersPage; 