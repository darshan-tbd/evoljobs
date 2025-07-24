import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  UsersIcon,
  BuildingOfficeIcon,
  BriefcaseIcon,
  DocumentTextIcon,
  BellIcon,
  ChartBarIcon,
  EyeIcon,
  BookmarkIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ArrowPathIcon,
  CalendarIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  InformationCircleIcon,
  XMarkIcon,
  GlobeAltIcon,
  PlayIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

interface DashboardStats {
  users: {
    total: number;
    active: number;
    new_today: number;
    new_week: number;
    types: {
      job_seekers: number;
      employers: number;
      admins: number;
    };
  };
  companies: {
    total: number;
    verified: number;
    new_today: number;
    new_week: number;
  };
  jobs: {
    total: number;
    active: number;
    new_today: number;
    new_week: number;
    featured: number;
  };
  applications: {
    total: number;
    new_today: number;
    new_week: number;
    pending: number;
    approved: number;
    rejected: number;
  };
  engagement: {
    total_views: number;
    total_saves: number;
    views_today: number;
    saves_today: number;
  };
  notifications: {
    total: number;
    unread: number;
    sent_today: number;
  };
  scrapers: {
    total_jobs: number;
    michael_page_jobs: number;
    pro_bono_jobs: number;
    service_seeking_jobs: number;
    jobs_today: number;
    jobs_this_week: number;
    active_scrapers: number;
    total_scrapers: number;
  };
}

interface RecentActivity {
  id: string;
  type: string;
  title: string;
  description: string;
  timestamp: string;
  status: 'success' | 'warning' | 'error' | 'info';
  user?: string;
}

interface ScraperJob {
  id: string;
  title: string;
  company: string;
  location: string;
  external_source: string;
  external_url: string;
  created_at: string;
  status: 'active' | 'inactive';
}

interface SnackbarState {
  open: boolean;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

const DashboardOverview: React.FC = () => {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [recentScrapedJobs, setRecentScrapedJobs] = useState<ScraperJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    type: 'success'
  });

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch stats from multiple endpoints
      const [usersResponse, companiesResponse, jobsResponse, applicationsResponse, scrapersResponse] = await Promise.all([
        fetch('http://127.0.0.1:8000/api/v1/users/admin-users/stats/', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          },
        }),
        fetch('http://127.0.0.1:8000/api/v1/companies/admin-companies/stats/', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          },
        }),
        fetch('http://127.0.0.1:8000/api/v1/jobs/admin-jobs/stats/', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          },
        }),
        fetch('http://127.0.0.1:8000/api/v1/applications/admin-applications/stats/', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          },
        }),
        fetch('http://127.0.0.1:8000/api/v1/scrapers/stats/', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          },
        }),
      ]);

      // Check each response individually and handle errors gracefully
      const responses = [
        { name: 'users', response: usersResponse },
        { name: 'companies', response: companiesResponse },
        { name: 'jobs', response: jobsResponse },
        { name: 'applications', response: applicationsResponse },
        { name: 'scrapers', response: scrapersResponse },
      ];

      const failedResponses = responses.filter(r => !r.response.ok);
      if (failedResponses.length > 0) {
        console.warn('Some API endpoints failed:', failedResponses.map(r => `${r.name}: ${r.response.status}`));
      }

      // Parse responses safely, using empty objects for failed responses
      const [usersData, companiesData, jobsData, applicationsData, scrapersData] = await Promise.all([
        usersResponse.ok ? usersResponse.json() : { total: 0, active: 0, new_today: 0, new_week: 0, by_type: { job_seekers: 0, employers: 0, admins: 0 } },
        companiesResponse.ok ? companiesResponse.json() : { total_companies: 0, verified_companies: 0, recent_activity: { new_companies_today: 0, new_companies_this_week: 0 } },
        jobsResponse.ok ? jobsResponse.json() : { total_jobs: 0, active_jobs: 0, recent_activity: { new_jobs_today: 0, new_jobs_this_week: 0 }, featured_jobs: 0 },
        applicationsResponse.ok ? applicationsResponse.json() : { total_applications: 0, recent_activity: { new_applications_today: 0, new_applications_this_week: 0 }, pending_applications: 0, shortlisted_applications: 0, rejected_applications: 0 },
        scrapersResponse.ok ? scrapersResponse.json() : { total_jobs: 0, jobs_by_source: { michael_page: 0, pro_bono_australia: 0, serviceseeking: 0 }, recent_activity: { new_jobs_today: 0, new_jobs_this_week: 0 }, recent_jobs: [] },
      ]);

      // Combine the data into a single stats object
      const combinedStats: DashboardStats = {
        users: {
          total: usersData.total || 0,
          active: usersData.active || 0,
          new_today: usersData.new_today || 0,
          new_week: usersData.new_week || 0,
          types: {
            job_seekers: usersData.by_type?.job_seekers || 0,
            employers: usersData.by_type?.employers || 0,
            admins: usersData.by_type?.admins || 0,
          },
        },
        companies: {
          total: companiesData.total_companies || 0,
          verified: companiesData.verified_companies || 0,
          new_today: companiesData.recent_activity?.new_companies_today || 0,
          new_week: companiesData.recent_activity?.new_companies_this_week || 0,
        },
        jobs: {
          total: jobsData.total_jobs || 0,
          active: jobsData.active_jobs || 0,
          new_today: jobsData.recent_activity?.new_jobs_today || 0,
          new_week: jobsData.recent_activity?.new_jobs_this_week || 0,
          featured: jobsData.featured_jobs || 0,
        },
        applications: {
          total: applicationsData.total_applications || 0,
          new_today: applicationsData.recent_activity?.new_applications_today || 0,
          new_week: applicationsData.recent_activity?.new_applications_this_week || 0,
          pending: applicationsData.pending_applications || 0,
          approved: applicationsData.shortlisted_applications || 0,
          rejected: applicationsData.rejected_applications || 0,
        },
        engagement: {
          total_views: 0, // Will be fetched separately if needed
          total_saves: 0,
          views_today: 0,
          saves_today: 0,
        },
        notifications: {
          total: 0,
          unread: 0,
          sent_today: 0,
        },
        scrapers: {
          total_jobs: scrapersData.total_jobs || 0,
          michael_page_jobs: scrapersData.jobs_by_source?.michael_page || 0,
          pro_bono_jobs: scrapersData.jobs_by_source?.pro_bono_australia || 0,
          service_seeking_jobs: scrapersData.jobs_by_source?.serviceseeking || 0,
          jobs_today: scrapersData.recent_activity?.new_jobs_today || 0,
          jobs_this_week: scrapersData.recent_activity?.new_jobs_this_week || 0,
          active_scrapers: 3, // We have 3 active scrapers
          total_scrapers: 3,
        },
      };

      setStats(combinedStats);
      setRecentScrapedJobs(scrapersData.recent_jobs || []);

      // Mock recent activity for now
      const mockActivity: RecentActivity[] = [
        {
          id: '1',
          type: 'scraper_completed',
          title: 'Michael Page Scraper Completed',
          description: 'Successfully scraped 45 new job postings',
          timestamp: new Date().toISOString(),
          status: 'success',
          user: 'System',
        },
        {
          id: '2',
          type: 'user_registration',
          title: 'New User Registration',
          description: 'John Doe registered as a job seeker',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          status: 'info',
          user: 'John Doe',
        },
        {
          id: '3',
          type: 'job_posted',
          title: 'New Job Posted',
          description: 'Senior Developer position at Tech Corp',
          timestamp: new Date(Date.now() - 7200000).toISOString(),
          status: 'info',
          user: 'Tech Corp',
        },
        {
          id: '4',
          type: 'application_submitted',
          title: 'Application Submitted',
          description: 'Application for Senior Developer position',
          timestamp: new Date(Date.now() - 10800000).toISOString(),
          status: 'warning',
          user: 'Jane Smith',
        },
        {
          id: '5',
          type: 'scraper_completed',
          title: 'Pro Bono Australia Scraper Completed',
          description: 'Successfully scraped 23 new job postings',
          timestamp: new Date(Date.now() - 14400000).toISOString(),
          status: 'success',
          user: 'System',
        },
      ];

      setRecentActivity(mockActivity);
    } catch (err: any) {
      console.error('Dashboard data fetch error:', err);
      
      // Don't show error if we have some data, just show a warning
      if (stats) {
        setSnackbar({
          open: true,
          message: 'Some dashboard data could not be loaded. Showing available information.',
          type: 'warning'
        });
      } else {
        const errorMessage = err.message || 'Failed to load dashboard data';
        setError(errorMessage);
        setSnackbar({
          open: true,
          message: errorMessage,
          type: 'error'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchDashboardData();
      setSnackbar({
        open: true,
        message: 'Dashboard data refreshed successfully!',
        type: 'success'
      });
    } catch (error) {
      // Error is already handled in fetchDashboardData
    } finally {
      setRefreshing(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'warning':
        return <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500" />;
      case 'error':
        return <XCircleIcon className="w-5 h-5 text-red-500" />;
      case 'info':
        return <InformationCircleIcon className="w-5 h-5 text-blue-500" />;
      default:
        return <InformationCircleIcon className="w-5 h-5 text-gray-500" />;
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
    return new Date(dateString).toLocaleString();
  };

  const getPercentageChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  useEffect(() => {
    fetchDashboardData();
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
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircleIcon className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Error Loading Dashboard</h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={handleRefresh}
            className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Dashboard Overview</h1>
          <p className="text-gray-600 mt-2 text-lg">Welcome back! Here's what's happening with your platform.</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 shadow-lg hover:shadow-xl"
        >
          <ArrowPathIcon className={`w-5 h-5 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh Data
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {/* Users Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Total Users</p>
              <p className="text-4xl font-bold text-gray-900 mt-2">{formatNumber(stats?.users.total || 0)}</p>
            </div>
            <div className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg">
              <UsersIcon className="w-8 h-8 text-white" />
            </div>
          </div>
          <div className="mt-6 flex items-center text-sm">
            <span className="text-green-600 font-semibold">+{stats?.users.new_today || 0}</span>
            <span className="text-gray-500 ml-2">new today</span>
          </div>
        </div>

        {/* Companies Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Companies</p>
              <p className="text-4xl font-bold text-gray-900 mt-2">{formatNumber(stats?.companies.total || 0)}</p>
            </div>
            <div className="p-4 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-lg">
              <BuildingOfficeIcon className="w-8 h-8 text-white" />
            </div>
          </div>
          <div className="mt-6 flex items-center text-sm">
            <span className="text-green-600 font-semibold">{stats?.companies.verified || 0}</span>
            <span className="text-gray-500 ml-2">verified</span>
          </div>
        </div>

        {/* Jobs Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Active Jobs</p>
              <p className="text-4xl font-bold text-gray-900 mt-2">{formatNumber(stats?.jobs.active || 0)}</p>
            </div>
            <div className="p-4 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl shadow-lg">
              <BriefcaseIcon className="w-8 h-8 text-white" />
            </div>
          </div>
          <div className="mt-6 flex items-center text-sm">
            <span className="text-green-600 font-semibold">+{stats?.jobs.new_today || 0}</span>
            <span className="text-gray-500 ml-2">new today</span>
          </div>
        </div>

        {/* Applications Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Applications</p>
              <p className="text-4xl font-bold text-gray-900 mt-2">{formatNumber(stats?.applications.total || 0)}</p>
            </div>
            <div className="p-4 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-lg">
              <DocumentTextIcon className="w-8 h-8 text-white" />
            </div>
          </div>
          <div className="mt-6 flex items-center text-sm">
            <span className="text-yellow-600 font-semibold">{stats?.applications.pending || 0}</span>
            <span className="text-gray-500 ml-2">pending</span>
          </div>
        </div>
      </div>

      {/* Scraper Stats */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900">Job Scrapers Performance</h3>
          <button
            onClick={() => router.push('/admin_dashboard/scrapers')}
            className="flex items-center px-4 py-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <GlobeAltIcon className="w-5 h-5 mr-2" />
            Manage Scrapers
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Michael Page */}
          <div className="flex items-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
            <div className="p-3 bg-blue-500 rounded-lg mr-4">
              <BuildingOfficeIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h4 className="font-semibold text-blue-900">Michael Page</h4>
              <p className="text-blue-700 text-sm">{formatNumber(stats?.scrapers.michael_page_jobs || 0)} jobs</p>
            </div>
          </div>

          {/* Pro Bono */}
          <div className="flex items-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl">
            <div className="p-3 bg-green-500 rounded-lg mr-4">
              <DocumentTextIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h4 className="font-semibold text-green-900">Pro Bono Australia</h4>
              <p className="text-green-700 text-sm">{formatNumber(stats?.scrapers.pro_bono_jobs || 0)} jobs</p>
            </div>
          </div>

          {/* ServiceSeeking */}
          <div className="flex items-center p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl">
            <div className="p-3 bg-orange-500 rounded-lg mr-4">
              <BriefcaseIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h4 className="font-semibold text-orange-900">ServiceSeeking</h4>
              <p className="text-orange-700 text-sm">{formatNumber(stats?.scrapers.service_seeking_jobs || 0)} jobs</p>
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between text-sm text-gray-600">
          <span>Total scraped jobs: {formatNumber(stats?.scrapers.total_jobs || 0)}</span>
          <span>Active scrapers: {stats?.scrapers.active_scrapers || 0}/{stats?.scrapers.total_scrapers || 0}</span>
        </div>
      </div>

      {/* Detailed Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* User Types Breakdown */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
          <h3 className="text-xl font-bold text-gray-900 mb-6">User Distribution</h3>
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-blue-500 rounded-full mr-4"></div>
                <span className="text-gray-700 font-medium">Job Seekers</span>
              </div>
              <span className="font-bold text-lg text-gray-900">{stats?.users.types.job_seekers || 0}</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-purple-500 rounded-full mr-4"></div>
                <span className="text-gray-700 font-medium">Employers</span>
              </div>
              <span className="font-bold text-lg text-gray-900">{stats?.users.types.employers || 0}</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-green-500 rounded-full mr-4"></div>
                <span className="text-gray-700 font-medium">Admins</span>
              </div>
              <span className="font-bold text-lg text-gray-900">{stats?.users.types.admins || 0}</span>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Recent Activity</h3>
          <div className="space-y-4">
            {recentActivity.slice(0, 5).map((activity) => (
              <div key={activity.id} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                {getStatusIcon(activity.status)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">{activity.title}</p>
                  <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                  <p className="text-xs text-gray-400 mt-2">
                    {formatDate(activity.timestamp)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Scraped Jobs */}
      {recentScrapedJobs.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">Recent Scraped Jobs</h3>
            <button
              onClick={() => router.push('/admin_dashboard/scrapers')}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              View All →
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Job</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Scraped</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentScrapedJobs.slice(0, 5).map((job) => (
                  <tr key={job.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{job.title}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{job.company}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        job.external_source === 'Michael Page' ? 'bg-blue-100 text-blue-800' :
                        job.external_source === 'Pro Bono Australia' ? 'bg-green-100 text-green-800' :
                        'bg-orange-100 text-orange-800'
                      }`}>
                        {job.external_source}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(job.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
        <h3 className="text-xl font-bold text-gray-900 mb-6">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <button
            onClick={() => router.push('/admin_dashboard/users')}
            className="flex items-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl hover:from-blue-100 hover:to-blue-200 transition-all duration-200 transform hover:-translate-y-1 shadow-lg hover:shadow-xl"
          >
            <UsersIcon className="w-6 h-6 text-blue-600 mr-4" />
            <span className="text-blue-900 font-semibold">Manage Users</span>
          </button>
          <button
            onClick={() => router.push('/admin_dashboard/companies')}
            className="flex items-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl hover:from-purple-100 hover:to-purple-200 transition-all duration-200 transform hover:-translate-y-1 shadow-lg hover:shadow-xl"
          >
            <BuildingOfficeIcon className="w-6 h-6 text-purple-600 mr-4" />
            <span className="text-purple-900 font-semibold">Manage Companies</span>
          </button>
          <button
            onClick={() => router.push('/admin_dashboard/jobs')}
            className="flex items-center p-6 bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl hover:from-orange-100 hover:to-orange-200 transition-all duration-200 transform hover:-translate-y-1 shadow-lg hover:shadow-xl"
          >
            <BriefcaseIcon className="w-6 h-6 text-orange-600 mr-4" />
            <span className="text-orange-900 font-semibold">Manage Jobs</span>
          </button>
          <button
            onClick={() => router.push('/admin_dashboard/scrapers')}
            className="flex items-center p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-2xl hover:from-green-100 hover:to-green-200 transition-all duration-200 transform hover:-translate-y-1 shadow-lg hover:shadow-xl"
          >
            <GlobeAltIcon className="w-6 h-6 text-green-600 mr-4" />
            <span className="text-green-900 font-semibold">Manage Scrapers</span>
          </button>
        </div>
      </div>

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
  );
};

export default DashboardOverview; 