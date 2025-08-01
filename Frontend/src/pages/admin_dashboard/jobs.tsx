import React, { useState, useEffect } from 'react';
import {
  BriefcaseIcon,
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
} from '@heroicons/react/24/outline';
import { useAuth } from '../../hooks/useAuth';
import AdminLayout from '../../components/admin_dashboard/AdminLayout';

interface Job {
  id: string;
  slug: string;
  title: string;
  description: string;
  requirements: string;
  qualifications: string;
  benefits: string;
  salary_min?: number;
  salary_max?: number;
  salary_currency?: string;
  salary_type: string;
  location?: {
    id: string;
    name: string;
    city: string;
    state: string;
    country: string;
  };
  job_type: 'full_time' | 'part_time' | 'contract' | 'internship' | 'temporary' | 'volunteer';
  experience_level: 'entry' | 'mid' | 'senior' | 'executive';
  remote_option: 'onsite' | 'remote' | 'hybrid';
  status: 'draft' | 'active' | 'paused' | 'closed' | 'filled';
  is_featured: boolean;
  application_deadline?: string;
  created_at: string;
  updated_at: string;
  company: {
    id: string;
    name: string;
    logo?: string;
  };
  industry?: {
    id: string;
    name: string;
  };
  required_skills: string[];
  preferred_skills: string[];
  views_count: number;
  applications_count: number;
  external_source?: string;
  external_url?: string;
}

interface JobStats {
  total: number;
  active: number;
  featured: number;
  remote: number;
  new_today: number;
  new_week: number;
  by_type: {
    [key: string]: number;
  };
  by_experience: {
    [key: string]: number;
  };
  by_location: {
    [key: string]: number;
  };
}

const AdminJobsPage: React.FC = () => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [stats, setStats] = useState<JobStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterExperience, setFilterExperience] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [showJobModal, setShowJobModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalJobs, setTotalJobs] = useState(0);
  const [pageSize] = useState(20);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
  }>({ open: false, message: '', type: 'success' });

  const fetchJobs = async (page: number = 1) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`http://127.0.0.1:8000/api/v1/jobs/admin-jobs/?page=${page}&page_size=${pageSize}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch jobs');
      }

      const data = await response.json();
      setJobs(data.results || []);
      setTotalJobs(data.count || 0);
      setTotalPages(Math.ceil((data.count || 0) / pageSize));
      setCurrentPage(page);
    } catch (err: any) {
      setError(err.message || 'Failed to load jobs');
      setSnackbar({
        open: true,
        message: err.message || 'Failed to load jobs',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/api/v1/jobs/admin-jobs/stats/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Map backend data to frontend expected format
        const mappedStats: JobStats = {
          total: data.total_jobs || 0,
          active: data.active_jobs || 0,
          featured: data.featured_jobs || 0,
          remote: 0, // Calculate from jobs data
          new_today: data.recent_activity?.new_jobs_today || 0,
          new_week: data.recent_activity?.new_jobs_this_week || 0,
          by_type: data.job_types || {},
          by_experience: data.experience_levels || {},
          by_location: {}
        };
        setStats(mappedStats);
      }
    } catch (error) {
      console.error('Failed to fetch job stats:', error);
    }
  };

  useEffect(() => {
    fetchJobs();
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

  const handleRefresh = async () => {
    await fetchJobs(currentPage);
    await fetchStats();
    setSnackbar({
      open: true,
      message: 'Jobs refreshed successfully!',
      type: 'success'
    });
  };

  const handlePageChange = (page: number) => {
    fetchJobs(page);
  };

  const handleViewJob = (job: Job) => {
    setSelectedJob(job);
    setShowJobModal(true);
  };

  const handleToggleActive = async (job: Job) => {
    try {
      const newStatus = job.status === 'active' ? 'paused' : 'active';
      const response = await fetch(`http://127.0.0.1:8000/api/v1/jobs/admin-jobs/${job.slug}/update_status/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        setJobs(jobs.map(j => 
          j.id === job.id ? { ...j, status: newStatus } : j
        ));
        setSnackbar({
          open: true,
          message: `Job ${job.status === 'active' ? 'paused' : 'activated'} successfully!`,
          type: 'success'
        });
      } else {
        throw new Error('Failed to update job status');
      }
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error.message || 'Failed to update job status',
        type: 'error'
      });
    }
  };

  const handleToggleFeatured = async (job: Job) => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/v1/jobs/${job.id}/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_featured: !job.is_featured }),
      });

      if (response.ok) {
        setJobs(jobs.map(j => 
          j.id === job.id ? { ...j, is_featured: !j.is_featured } : j
        ));
        setSnackbar({
          open: true,
          message: `Job ${job.is_featured ? 'unfeatured' : 'featured'} successfully!`,
          type: 'success'
        });
      } else {
        throw new Error('Failed to update job featured status');
      }
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error.message || 'Failed to update job featured status',
        type: 'error'
      });
    }
  };

  const handleDeleteJob = async (job: Job) => {
    if (!confirm('Are you sure you want to delete this job?')) return;

    try {
      const response = await fetch(`http://127.0.0.1:8000/api/v1/jobs/${job.id}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      });

      if (response.ok) {
        setJobs(jobs.filter(j => j.id !== job.id));
        setSnackbar({
          open: true,
          message: 'Job deleted successfully!',
          type: 'success'
        });
      } else {
        throw new Error('Failed to delete job');
      }
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error.message || 'Failed to delete job',
        type: 'error'
      });
    }
  };

  const getStatusColor = (status: string | undefined, isFeatured: boolean) => {
    if (!status || status !== 'active') return 'bg-red-100 text-red-800 border-red-200';
    if (isFeatured) return 'bg-purple-100 text-purple-800 border-purple-200';
    return 'bg-green-100 text-green-800 border-green-200';
  };

  const getStatusText = (status: string | undefined, isFeatured: boolean) => {
    if (!status || status !== 'active') return status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Unknown';
    if (isFeatured) return 'Featured';
    return 'Active';
  };

  const getStatusIcon = (status: string | undefined, isFeatured: boolean) => {
    if (!status || status !== 'active') return <XCircleIcon className="w-4 h-4" />;
    if (isFeatured) return <StarIcon className="w-4 h-4" />;
    return <CheckCircleIcon className="w-4 h-4" />;
  };

  const getJobTypeColor = (type: string) => {
    switch (type) {
      case 'full_time':
        return 'bg-blue-100 text-blue-800';
      case 'part_time':
        return 'bg-green-100 text-green-800';
      case 'contract':
        return 'bg-orange-100 text-orange-800';
      case 'internship':
        return 'bg-purple-100 text-purple-800';
      case 'freelance':
        return 'bg-pink-100 text-pink-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getExperienceColor = (level: string) => {
    switch (level) {
      case 'entry':
        return 'bg-green-100 text-green-800';
      case 'junior':
        return 'bg-blue-100 text-blue-800';
      case 'mid':
        return 'bg-yellow-100 text-yellow-800';
      case 'senior':
        return 'bg-orange-100 text-orange-800';
      case 'lead':
        return 'bg-purple-100 text-purple-800';
      case 'executive':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatSalary = (min?: number, max?: number, currency?: string) => {
    if (!min && !max) return 'Not specified';
    const curr = currency || 'USD';
    if (min && max) {
      return `${curr} ${min.toLocaleString()} - ${max.toLocaleString()}`;
    }
    if (min) {
      return `${curr} ${min.toLocaleString()}+`;
    }
    if (max) {
      return `${curr} Up to ${max.toLocaleString()}`;
    }
    return 'Not specified';
  };

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job?.company?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (job?.location?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
                         [...job?.required_skills, ...job?.preferred_skills].some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && job?.status === 'active') ||
                         (filterStatus === 'inactive' && job?.status !== 'active') ||
                         (filterStatus === 'featured' && job?.is_featured);
    
    const matchesType = filterType === 'all' || job.job_type === filterType;
    const matchesExperience = filterExperience === 'all' || job.experience_level === filterExperience;

    return matchesSearch && matchesStatus && matchesType && matchesExperience;
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
            <p className="text-gray-600 text-lg">Loading jobs...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-2 sm:space-y-3 lg:space-y-4 xl:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold text-gray-900 truncate">Job Management</h1>
            <p className="text-gray-600 mt-1 text-xs sm:text-sm lg:text-base xl:text-lg line-clamp-2">Manage and monitor all job postings.</p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 flex-shrink-0">
            <button
              onClick={handleRefresh}
              className="flex items-center justify-center px-3 py-1.5 sm:px-4 sm:py-2 bg-gray-100 text-gray-700 rounded-lg sm:rounded-xl hover:bg-gray-200 transition-all duration-200 text-xs sm:text-sm lg:text-base"
            >
              <ArrowPathIcon className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Refresh</span>
              <span className="sm:hidden">Refresh</span>
            </button>
            <button className="flex items-center justify-center px-3 py-1.5 sm:px-4 sm:py-2 lg:px-6 lg:py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg sm:rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl text-xs sm:text-sm lg:text-base">
              <PlusIcon className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Post Job</span>
              <span className="sm:hidden">Post</span>
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-1.5 sm:gap-2 lg:gap-3 xl:gap-4">
            <div className="bg-white rounded-lg sm:rounded-xl lg:rounded-2xl shadow-lg border border-gray-100 p-2 sm:p-3 lg:p-4 xl:p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-semibold text-gray-600 uppercase tracking-wide truncate">Total Jobs</p>
                  <p className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-gray-900 mt-0.5 sm:mt-1 lg:mt-2">{formatNumber(stats.total)}</p>
                </div>
                <div className="p-1 sm:p-2 lg:p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg sm:rounded-xl shadow-lg ml-1 sm:ml-2 flex-shrink-0">
                  <BriefcaseIcon className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 xl:w-8 xl:h-8 text-white" />
                </div>
              </div>
              <div className="mt-1 sm:mt-2 lg:mt-3 xl:mt-4 flex items-center text-xs sm:text-sm">
                <span className="text-green-600 font-semibold">+{stats.new_today}</span>
                <span className="text-gray-500 ml-1 sm:ml-2 truncate">new today</span>
              </div>
            </div>

            <div className="bg-white rounded-lg sm:rounded-xl lg:rounded-2xl shadow-lg border border-gray-100 p-2 sm:p-3 lg:p-4 xl:p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-semibold text-gray-600 uppercase tracking-wide truncate">Active Jobs</p>
                  <p className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-gray-900 mt-0.5 sm:mt-1 lg:mt-2">{formatNumber(stats.active)}</p>
                </div>
                <div className="p-1 sm:p-2 lg:p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-lg sm:rounded-xl shadow-lg ml-1 sm:ml-2 flex-shrink-0">
                  <CheckCircleIcon className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 xl:w-8 xl:h-8 text-white" />
                </div>
              </div>
              <div className="mt-1 sm:mt-2 lg:mt-3 xl:mt-4 flex items-center text-xs sm:text-sm">
                <span className="text-green-600 font-semibold">{((stats.active / stats.total) * 100).toFixed(1)}%</span>
                <span className="text-gray-500 ml-1 sm:ml-2 truncate">active rate</span>
              </div>
            </div>

            <div className="bg-white rounded-lg sm:rounded-xl lg:rounded-2xl shadow-lg border border-gray-100 p-2 sm:p-3 lg:p-4 xl:p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-semibold text-gray-600 uppercase tracking-wide truncate">Featured Jobs</p>
                  <p className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-gray-900 mt-0.5 sm:mt-1 lg:mt-2">{formatNumber(stats.featured)}</p>
                </div>
                <div className="p-1 sm:p-2 lg:p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg sm:rounded-xl shadow-lg ml-1 sm:ml-2 flex-shrink-0">
                  <StarIcon className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 xl:w-8 xl:h-8 text-white" />
                </div>
              </div>
              <div className="mt-1 sm:mt-2 lg:mt-3 xl:mt-4 flex items-center text-xs sm:text-sm">
                <span className="text-purple-600 font-semibold">{((stats.featured / stats.total) * 100).toFixed(1)}%</span>
                <span className="text-gray-500 ml-1 sm:ml-2 truncate">featured rate</span>
              </div>
            </div>

            <div className="bg-white rounded-lg sm:rounded-xl lg:rounded-2xl shadow-lg border border-gray-100 p-2 sm:p-3 lg:p-4 xl:p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-semibold text-gray-600 uppercase tracking-wide truncate">Remote Jobs</p>
                  <p className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-gray-900 mt-0.5 sm:mt-1 lg:mt-2">{formatNumber(stats.remote)}</p>
                </div>
                <div className="p-1 sm:p-2 lg:p-3 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg sm:rounded-xl shadow-lg ml-1 sm:ml-2 flex-shrink-0">
                  <GlobeAltIcon className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 xl:w-8 xl:h-8 text-white" />
                </div>
              </div>
              <div className="mt-1 sm:mt-2 lg:mt-3 xl:mt-4 flex items-center text-xs sm:text-sm">
                <span className="text-orange-600 font-semibold">{((stats.remote / stats.total) * 100).toFixed(1)}%</span>
                <span className="text-gray-500 ml-1 sm:ml-2 truncate">remote rate</span>
              </div>
            </div>
          </div>
        )}

        {/* Filters and Search */}
        <div className="bg-white rounded-lg sm:rounded-xl lg:rounded-2xl shadow-lg border border-gray-100 p-3 sm:p-4 lg:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search jobs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 sm:pl-9 lg:pl-10 pr-2 sm:pr-3 lg:pr-4 py-1.5 sm:py-2 lg:py-3 border border-gray-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-xs sm:text-sm lg:text-base"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-2 sm:space-x-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center justify-center px-3 py-1.5 sm:px-4 sm:py-2 bg-gray-100 text-gray-700 rounded-lg sm:rounded-xl hover:bg-gray-200 transition-all duration-200 text-xs sm:text-sm lg:text-base"
              >
                <FunnelIcon className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Filters</span>
                <span className="sm:hidden">Filter</span>
                {showFilters ? (
                  <ChevronUpIcon className="w-3 h-3 sm:w-4 sm:h-4 ml-1 sm:ml-2" />
                ) : (
                  <ChevronDownIcon className="w-3 h-3 sm:w-4 sm:h-4 ml-1 sm:ml-2" />
                )}
              </button>
            </div>
          </div>

          {/* Filter Options */}
          {showFilters && (
            <div className="mt-3 sm:mt-4 lg:mt-6 pt-3 sm:pt-4 lg:pt-6 border-t border-gray-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 lg:gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Status</label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 border border-gray-200 rounded-md sm:rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs sm:text-sm lg:text-base"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="featured">Featured</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Job Type</label>
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="w-full px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 border border-gray-200 rounded-md sm:rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs sm:text-sm lg:text-base"
                  >
                    <option value="all">All Types</option>
                    <option value="full_time">Full Time</option>
                    <option value="part_time">Part Time</option>
                    <option value="contract">Contract</option>
                    <option value="internship">Internship</option>
                    <option value="freelance">Freelance</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Experience Level</label>
                  <select
                    value={filterExperience}
                    onChange={(e) => setFilterExperience(e.target.value)}
                    className="w-full px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 border border-gray-200 rounded-md sm:rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs sm:text-sm lg:text-base"
                  >
                    <option value="all">All Levels</option>
                    <option value="entry">Entry</option>
                    <option value="junior">Junior</option>
                    <option value="mid">Mid</option>
                    <option value="senior">Senior</option>
                    <option value="lead">Lead</option>
                    <option value="executive">Executive</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Jobs Table - Desktop */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Jobs ({totalJobs} total, showing {jobs.length})
            </h3>
          </div>
          
          <div className="hidden lg:block">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Job</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Applications</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Posted</th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredJobs.map((job) => (
                    <tr key={job.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{job.title}</div>
                          <div className="text-sm text-gray-500 line-clamp-2">{job.description.substring(0, 100)}...</div>
                          <div className="flex items-center mt-2 space-x-2">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getExperienceColor(job.experience_level)}`}>
                              {job.experience_level.replace('_', ' ')}
                            </span>
                            {job.remote_option === 'remote' && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                Remote
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                            {job.company.logo ? (
                              <img src={job.company.logo} alt={job.company.name} className="w-6 h-6 rounded" />
                            ) : (
                              <BuildingOfficeIcon className="w-4 h-4 text-white" />
                            )}
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">{job.company.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <MapPinIcon className="w-4 h-4 text-gray-400 mr-1" />
                          <span className="text-sm text-gray-900">{job.location?.name || 'No location'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getJobTypeColor(job.job_type)}`}>
                          {job.job_type.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(job.status, job.is_featured)}`}>
                          {getStatusIcon(job.status, job.is_featured)}
                          <span className="ml-1">{getStatusText(job.status, job.is_featured)}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{job.applications_count} applications</div>
                        <div className="text-sm text-gray-500">{job.views_count} views</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(job.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleViewJob(job)}
                            className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                          >
                            <EyeIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleToggleFeatured(job)}
                            className={`p-2 rounded-lg transition-colors ${
                              job.is_featured 
                                ? 'text-yellow-600 hover:bg-yellow-100' 
                                : 'text-purple-600 hover:bg-purple-100'
                            }`}
                            title={job.is_featured ? 'Unfeature' : 'Feature'}
                          >
                            <StarIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleToggleActive(job)}
                            className={`p-2 rounded-lg transition-colors ${
                              job.status === 'active' 
                                ? 'text-red-600 hover:bg-red-100' 
                                : 'text-green-600 hover:bg-green-100'
                            }`}
                            title={job.status === 'active' ? 'Deactivate' : 'Activate'}
                          >
                            {job.status === 'active' ? (
                              <XCircleIcon className="w-4 h-4" />
                            ) : (
                              <CheckCircleIcon className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => handleDeleteJob(job)}
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
          </div>

          {/* Jobs Cards - Mobile & Tablet */}
          <div className="lg:hidden">
            <div className="divide-y divide-gray-200 space-y-3">
              {filteredJobs.map((job) => (
                <div key={job.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between mb-2 sm:mb-3">
                    <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                        {job.company.logo ? (
                          <img src={job.company.logo} alt={job.company.name} className="w-4 h-4 sm:w-6 sm:h-6 rounded" />
                        ) : (
                          <BuildingOfficeIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xs sm:text-sm font-medium text-gray-900 line-clamp-1">{job.title}</h3>
                        <p className="text-xs sm:text-sm text-gray-600 truncate">{job.company.name}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-0.5 sm:space-x-1 ml-1 sm:ml-2 flex-shrink-0">
                      <button
                        onClick={() => handleViewJob(job)}
                        className="p-1 sm:p-1.5 text-blue-600 hover:bg-blue-50 rounded-md sm:rounded-lg transition-colors"
                        title="View Details"
                      >
                        <EyeIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                      </button>
                      <button
                        onClick={() => handleToggleFeatured(job)}
                        className={`p-1 sm:p-1.5 rounded-md sm:rounded-lg transition-colors ${
                          job.is_featured 
                            ? 'text-yellow-600 hover:bg-yellow-50' 
                            : 'text-purple-600 hover:bg-purple-50'
                        }`}
                        title={job.is_featured ? 'Unfeature' : 'Feature'}
                      >
                        <StarIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                      </button>
                      <button
                         onClick={() => handleToggleActive(job)}
                         className={`p-1 sm:p-1.5 rounded-md sm:rounded-lg transition-colors ${
                           job.status === 'active' 
                             ? 'text-red-600 hover:bg-red-50' 
                             : 'text-green-600 hover:bg-green-50'
                         }`}
                         title={job.status === 'active' ? 'Deactivate' : 'Activate'}
                       >
                         {job.status === 'active' ? (
                           <XCircleIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                         ) : (
                           <CheckCircleIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                         )}
                       </button>
                    </div>
                  </div>

                  <div className="space-y-1.5 sm:space-y-2">
                    <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">{job.description}</p>
                    
                    <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                      <span className={`inline-flex items-center px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs font-medium ${getJobTypeColor(job.job_type)}`}>
                        {job.job_type.replace('_', ' ')}
                      </span>
                      <span className={`inline-flex items-center px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs font-medium ${getExperienceColor(job.experience_level)}`}>
                        {job.experience_level.replace('_', ' ')}
                      </span>
                      {job.remote_option === 'remote' && (
                        <span className="inline-flex items-center px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Remote
                        </span>
                      )}
                      <span className={`inline-flex items-center px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs font-medium border ${getStatusColor(job.status, job.is_featured)}`}>
                        {getStatusIcon(job.status, job.is_featured)}
                        <span className="ml-1 hidden sm:inline">{getStatusText(job.status, job.is_featured)}</span>
                      </span>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-1.5 sm:pt-2 text-xs text-gray-500 space-y-1 sm:space-y-0">
                      <div className="flex items-center space-x-2 sm:space-x-4">
                        <span className="flex items-center">
                          <MapPinIcon className="w-3 h-3 mr-1 flex-shrink-0" />
                          <span className="truncate">{job.location?.name || 'No location'}</span>
                        </span>
                        <span className="whitespace-nowrap">{job.applications_count} applications</span>
                        <span className="whitespace-nowrap hidden sm:inline">{job.views_count} views</span>
                      </div>
                      <span className="text-right">{new Date(job.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
          
        {filteredJobs.length === 0 && (
          <div className="text-center py-12">
            <BriefcaseIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs found</h3>
            <p className="text-gray-500">Try adjusting your search or filter criteria.</p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white rounded-lg sm:rounded-xl lg:rounded-2xl shadow-lg border border-gray-100 p-3 sm:p-4 lg:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
              <div className="text-xs sm:text-sm text-gray-700 text-center sm:text-left">
                Showing <span className="font-medium">{(currentPage - 1) * pageSize + 1}</span> to{' '}
                <span className="font-medium">
                  {Math.min(currentPage * pageSize, totalJobs)}
                </span>{' '}
                of <span className="font-medium">{totalJobs}</span> jobs
              </div>
              
              <div className="flex items-center justify-center sm:justify-end space-x-1 sm:space-x-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md sm:rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="hidden sm:inline">Previous</span>
                  <span className="sm:hidden">Prev</span>
                </button>
                
                <div className="flex items-center space-x-0.5 sm:space-x-1">
                  {Array.from({ length: Math.min(3, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage <= 2) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 1) {
                      pageNum = totalPages - 2 + i;
                    } else {
                      pageNum = currentPage - 1 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-md sm:rounded-lg ${
                          currentPage === pageNum
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md sm:rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="hidden sm:inline">Next</span>
                  <span className="sm:hidden">Next</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Job Statistics */}
        {stats && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Job Types Distribution</h3>
              <div className="space-y-4">
                {stats.by_type && Object.keys(stats.by_type).length > 0 ? (
                  Object.entries(stats.by_type)
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 5)
                    .map(([type, count]) => (
                      <div key={type} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                        <div className="flex items-center">
                          <div className="w-4 h-4 bg-blue-500 rounded-full mr-4"></div>
                          <span className="text-gray-700 font-medium">{type.replace('_', ' ')}</span>
                        </div>
                        <span className="font-bold text-lg text-gray-900">{count}</span>
                      </div>
                    ))
                ) : (
                  <div className="text-center py-8">
                    <BriefcaseIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No job type data available</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Experience Levels</h3>
              <div className="space-y-4">
                {stats.by_experience && Object.keys(stats.by_experience).length > 0 ? (
                  Object.entries(stats.by_experience)
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 6)
                    .map(([level, count]) => (
                      <div key={level} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                        <div className="flex items-center">
                          <div className="w-4 h-4 bg-purple-500 rounded-full mr-4"></div>
                          <span className="text-gray-700 font-medium">{level.replace('_', ' ')}</span>
                        </div>
                        <span className="font-bold text-lg text-gray-900">{count}</span>
                      </div>
                    ))
                ) : (
                  <div className="text-center py-8">
                    <UserIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No experience level data available</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Job Detail Modal */}
      {showJobModal && selectedJob && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={() => setShowJobModal(false)}></div>
            </div>
            
            <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
              <div className="bg-white px-6 pt-6 pb-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Job Details</h3>
                  <button
                    onClick={() => setShowJobModal(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="text-xl font-bold text-gray-900">{selectedJob.title}</h4>
                    <div className="flex items-center mt-2 space-x-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(selectedJob.status, selectedJob.is_featured)}`}>
                        {getStatusIcon(selectedJob.status, selectedJob.is_featured)}
                        <span className="ml-1">{getStatusText(selectedJob.status, selectedJob.is_featured)}</span>
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getJobTypeColor(selectedJob.job_type)}`}>
                        {selectedJob.job_type.replace('_', ' ')}
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getExperienceColor(selectedJob.experience_level)}`}>
                        {selectedJob.experience_level.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                      {selectedJob.company.logo ? (
                        <img src={selectedJob.company.logo} alt={selectedJob.company.name} className="w-8 h-8 rounded" />
                      ) : (
                        <BuildingOfficeIcon className="w-6 h-6 text-white" />
                      )}
                    </div>
                    <div className="ml-4">
                      <div className="text-lg font-semibold text-gray-900">{selectedJob.company.name}</div>
                      <div className="flex items-center text-sm text-gray-500">
                        <MapPinIcon className="w-4 h-4 mr-1" />
                        {selectedJob.location?.name}
                        {selectedJob.remote_option === 'remote' && (
                          <span className="ml-2 text-blue-600">(Remote)</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Salary</label>
                    <p className="text-sm text-gray-900">
                      {formatSalary(selectedJob.salary_min, selectedJob.salary_max, selectedJob.salary_currency)}
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <p className="text-sm text-gray-900">{selectedJob.description}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Requirements</label>
                    <p className="text-sm text-gray-900">{selectedJob.requirements}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Skills</label>
                    <div className="flex flex-wrap gap-2">
                      {selectedJob.required_skills.map((skill: string, index: number) => (
                        <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Applications</label>
                      <p className="text-sm text-gray-900">{selectedJob.applications_count}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Views</label>
                      <p className="text-sm text-gray-900">{selectedJob.views_count}</p>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Posted</label>
                    <p className="text-sm text-gray-900">
                      {new Date(selectedJob.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 px-6 py-4 flex justify-between">
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleToggleFeatured(selectedJob)}
                    className={`px-4 py-2 rounded-xl transition-colors ${
                      selectedJob.is_featured 
                        ? 'bg-yellow-600 text-white hover:bg-yellow-700' 
                        : 'bg-purple-600 text-white hover:bg-purple-700'
                    }`}
                  >
                    {selectedJob.is_featured ? 'Unfeature' : 'Feature'}
                  </button>
                  <button
                    onClick={() => handleToggleActive(selectedJob)}
                    className={`px-4 py-2 rounded-xl transition-colors ${
                      selectedJob.status === 'active' 
                        ? 'bg-red-600 text-white hover:bg-red-700' 
                        : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                  >
                    {selectedJob.status === 'active' ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
                <button
                  onClick={() => setShowJobModal(false)}
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
        <div className={`fixed top-4 left-4 right-4 sm:left-auto sm:right-4 z-50 max-w-sm bg-white rounded-lg sm:rounded-xl shadow-2xl border-l-4 transform transition-all duration-300 ease-in-out ${
          snackbar.type === 'success' ? 'border-green-500' : 
          snackbar.type === 'error' ? 'border-red-500' : 
          snackbar.type === 'warning' ? 'border-yellow-500' : 'border-blue-500'
        }`}>
          <div className="p-3 sm:p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                {snackbar.type === 'success' && (
                  <CheckCircleIcon className="w-5 h-5 sm:w-6 sm:h-6 text-green-500" />
                )}
                {snackbar.type === 'error' && (
                  <XCircleIcon className="w-5 h-5 sm:w-6 sm:h-6 text-red-500" />
                )}
                {snackbar.type === 'warning' && (
                  <ExclamationTriangleIcon className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-500" />
                )}
                {snackbar.type === 'info' && (
                  <InformationCircleIcon className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500" />
                )}
              </div>
              <div className="ml-2 sm:ml-3 flex-1 min-w-0">
                <p className={`text-xs sm:text-sm font-medium ${
                  snackbar.type === 'success' ? 'text-green-800' : 
                  snackbar.type === 'error' ? 'text-red-800' : 
                  snackbar.type === 'warning' ? 'text-yellow-800' : 'text-blue-800'
                }`}>
                  {snackbar.message}
                </p>
              </div>
              <div className="ml-2 sm:ml-4 flex-shrink-0">
                <button
                  onClick={() => setSnackbar({ ...snackbar, open: false })}
                  className={`inline-flex rounded-md sm:rounded-lg p-1 sm:p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                    snackbar.type === 'success' ? 'text-green-500 hover:bg-green-100 focus:ring-green-500' : 
                    snackbar.type === 'error' ? 'text-red-500 hover:bg-red-100 focus:ring-red-500' : 
                    snackbar.type === 'warning' ? 'text-yellow-500 hover:bg-yellow-100 focus:ring-yellow-500' : 
                    'text-blue-500 hover:bg-blue-100 focus:ring-blue-500'
                  }`}
                >
                  <XMarkIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminJobsPage; 