import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/hooks/useAuth';
import { motion } from 'framer-motion';
import { 
  DocumentTextIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  BuildingOfficeIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  FunnelIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import Layout from '@/components/layout/Layout';

interface Application {
  id: string;
  job: {
    id: string;
    title: string;
    company: {
      name: string;
      logo?: string;
    };
    location: {
      name: string;
    };
    salary_min?: number;
    salary_max?: number;
    job_type: string;
  };
  status: 'pending' | 'reviewing' | 'accepted' | 'rejected' | 'withdrawn';
  applied_at: string;
  updated_at: string;
  cover_letter?: string;
  resume_url?: string;
}

const ApplicationsPage: React.FC = () => {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('applied_at');

  useEffect(() => {
    if (isAuthenticated) {
      fetchApplications();
    }
  }, [isAuthenticated]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch('http://127.0.0.1:8000/api/v1/applications/applications/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const applications = data.results || [];
        
        // Transform the data to match our interface
        const transformedApplications = applications.map((app: any) => ({
          id: app.id,
          job: {
            id: app.job?.id || 'unknown',
            title: app.job?.title || 'Unknown Job',
            company: { 
              name: app.job?.company?.name || 'Unknown Company',
              logo: app.job?.company?.logo || '/api/placeholder/40/40'
            },
            location: { 
              name: app.job?.location?.name || 'Unknown Location'
            },
            salary_min: app.job?.salary_min,
            salary_max: app.job?.salary_max,
            job_type: app.job?.job_type || 'full_time'
          },
          status: app.status || 'pending',
          applied_at: app.applied_at,
          updated_at: app.updated_at || app.applied_at,
          cover_letter: app.cover_letter,
          resume_url: app.resume_url
        }));
        
        setApplications(transformedApplications);
      } else {
        setError('Failed to load applications');
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
      setError('Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'reviewing':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'withdrawn':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted':
        return <CheckCircleIcon className="h-4 w-4" />;
      case 'rejected':
        return <XCircleIcon className="h-4 w-4" />;
      case 'reviewing':
        return <EyeIcon className="h-4 w-4" />;
      case 'pending':
        return <ClockIcon className="h-4 w-4" />;
      default:
        return <ClockIcon className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatSalary = (min?: number, max?: number) => {
    if (!min && !max) return 'Salary not specified';
    if (min && max) return `$${min.toLocaleString()} - $${max.toLocaleString()}`;
    if (min) return `$${min.toLocaleString()}+`;
    if (max) return `Up to $${max.toLocaleString()}`;
    return 'Salary not specified';
  };

  const filteredApplications = applications.filter(app => {
    const matchesSearch = app.job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         app.job.company.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = !statusFilter || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const sortedApplications = [...filteredApplications].sort((a, b) => {
    switch (sortBy) {
      case 'applied_at':
        return new Date(b.applied_at).getTime() - new Date(a.applied_at).getTime();
      case 'updated_at':
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      case 'status':
        return a.status.localeCompare(b.status);
      default:
        return 0;
    }
  });

  if (!isAuthenticated) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
            <p className="text-gray-600 mb-6">Please log in to view your applications.</p>
            <button
              onClick={() => router.push('/login')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
            >
              Sign In
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading applications...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">My Applications</h1>
                <p className="text-gray-600 mt-2">Track your job applications and their status</p>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => router.push('/jobs')}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
                >
                  Browse Jobs
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search applications..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Status Filter */}
              <div className="flex space-x-3">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="reviewing">Reviewing</option>
                  <option value="accepted">Accepted</option>
                  <option value="rejected">Rejected</option>
                  <option value="withdrawn">Withdrawn</option>
                </select>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="applied_at">Applied Date</option>
                  <option value="updated_at">Updated Date</option>
                  <option value="status">Status</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Applications List */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {error ? (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
              {error}
            </div>
          ) : sortedApplications.length === 0 ? (
            <div className="text-center py-12">
              <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No applications found</h3>
              <p className="text-gray-600 mb-6">
                {searchQuery || statusFilter 
                  ? 'Try adjusting your search criteria.'
                  : 'You haven\'t applied to any jobs yet.'
                }
              </p>
              <button
                onClick={() => router.push('/jobs')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
              >
                Browse Jobs
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {sortedApplications.map((application) => (
                <motion.div
                  key={application.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <h3 className="text-lg font-semibold text-gray-900 hover:text-blue-600 cursor-pointer">
                            {application.job.title}
                          </h3>
                        </div>
                        
                        <div className="flex items-center text-gray-600 mb-3 space-x-4">
                          <div className="flex items-center">
                            <BuildingOfficeIcon className="h-4 w-4 mr-1" />
                            <span>{application.job.company.name}</span>
                          </div>
                          <div className="flex items-center">
                            <MapPinIcon className="h-4 w-4 mr-1" />
                            <span>{application.job.location.name}</span>
                          </div>
                          <div className="flex items-center">
                            <CurrencyDollarIcon className="h-4 w-4 mr-1" />
                            <span>{formatSalary(application.job.salary_min, application.job.salary_max)}</span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-4 mb-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {application.job.job_type.replace('_', ' ')}
                          </span>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(application.status)}`}>
                            {getStatusIcon(application.status)}
                            <span className="ml-1 capitalize">{application.status}</span>
                          </span>
                        </div>

                        <div className="flex items-center text-sm text-gray-500 space-x-4">
                          <div className="flex items-center">
                            <CalendarIcon className="h-4 w-4 mr-1" />
                            <span>Applied: {formatDate(application.applied_at)}</span>
                          </div>
                          {application.updated_at !== application.applied_at && (
                            <div className="flex items-center">
                              <ClockIcon className="h-4 w-4 mr-1" />
                              <span>Updated: {formatDate(application.updated_at)}</span>
                            </div>
                          )}
                        </div>

                        {application.cover_letter && (
                          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-700 line-clamp-2">
                              {application.cover_letter}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="ml-4 flex flex-col items-end space-y-2">
                        <button
                          onClick={() => router.push(`/jobs/${application.job.id}`)}
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                        >
                          View Job
                        </button>
                        {application.resume_url && (
                          <a
                            href={application.resume_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-600 hover:text-gray-700 text-sm"
                          >
                            View Resume
                          </a>
                        )}
                      </div>
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

export default ApplicationsPage; 