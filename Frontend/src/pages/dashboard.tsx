import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/hooks/useAuth';
import { motion } from 'framer-motion';
import { 
  BriefcaseIcon,
  DocumentTextIcon,
  BellIcon,
  UserIcon,
  CogIcon,
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  HeartIcon,
  BuildingOfficeIcon,
  MapPinIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';
import Layout from '@/components/layout/Layout';

interface DashboardStats {
  totalApplications: number;
  pendingApplications: number;
  acceptedApplications: number;
  rejectedApplications: number;
  profileViews: number;
  savedJobs: number;
}

interface RecentApplication {
  id: string;
  job: {
    title: string;
    company: {
      name: string;
    };
  };
  status: 'pending' | 'accepted' | 'rejected';
  applied_at: string;
}

interface SavedJob {
  id: string;
  title: string;
  company: {
    name: string;
  };
  location: {
    name: string;
  };
  salary_min?: number;
  salary_max?: number;
  job_type: string;
  created_at: string;
}

const DashboardPage: React.FC = () => {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalApplications: 0,
    pendingApplications: 0,
    acceptedApplications: 0,
    rejectedApplications: 0,
    profileViews: 0,
    savedJobs: 0
  });
  const [recentApplications, setRecentApplications] = useState<RecentApplication[]>([]);
  const [allApplications, setAllApplications] = useState<RecentApplication[]>([]);
  const [savedJobs, setSavedJobs] = useState<SavedJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (isAuthenticated) {
      fetchDashboardData();
    }
  }, [isAuthenticated]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      const accessToken = localStorage.getItem('access_token');
      console.log('Access token available:', !!accessToken);
      
      if (!accessToken) {
        console.error('No access token found');
        return;
      }
      
      // Fetch applications
      const applicationsResponse = await fetch('http://127.0.0.1:8000/api/v1/applications/applications/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
      });

      // Fetch saved jobs
      const savedJobsResponse = await fetch('http://127.0.0.1:8000/api/v1/jobs/saved-jobs/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
      });

      // Fetch AI matching stats for profile views
      const aiStatsResponse = await fetch('http://127.0.0.1:8000/api/v1/ai/matching_stats/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
      });

      let applications = [];
      let savedJobs = [];
      let aiStats = { total_matches: 0 };

      if (applicationsResponse.ok) {
        const applicationsData = await applicationsResponse.json();
        console.log('Raw applications API response:', applicationsData);
        applications = applicationsData.results || [];
        console.log('Applications data:', applications);
      } else {
        console.error('Applications API error:', applicationsResponse.status, applicationsResponse.statusText);
        const errorText = await applicationsResponse.text();
        console.error('Error response:', errorText);
      }

      if (savedJobsResponse.ok) {
        const savedJobsData = await savedJobsResponse.json();
        console.log('Raw saved jobs API response:', savedJobsData);
        savedJobs = savedJobsData.results || [];
        console.log('Saved jobs data:', savedJobs);
      } else {
        console.error('Saved jobs API error:', savedJobsResponse.status, savedJobsResponse.statusText);
        const errorText = await savedJobsResponse.text();
        console.error('Error response:', errorText);
      }

      if (aiStatsResponse.ok) {
        aiStats = await aiStatsResponse.json();
        console.log('AI stats data:', aiStats);
      } else {
        console.error('AI stats API error:', aiStatsResponse.status, aiStatsResponse.statusText);
      }

      // Calculate stats from real data
      const totalApplications = applications.length;
      const pendingApplications = applications.filter((app: any) => 
        ['pending', 'reviewing'].includes(app.status)
      ).length;
      const acceptedApplications = applications.filter((app: any) => 
        ['hired', 'offered', 'accepted', 'shortlisted', 'interviewed'].includes(app.status)
      ).length;
      const rejectedApplications = applications.filter((app: any) => 
        ['rejected', 'withdrawn'].includes(app.status)
      ).length;
      const profileViews = aiStats.total_matches || 0; // Using total matches as profile views
      const savedJobsCount = savedJobs.length;

      const finalStats = {
        totalApplications,
        pendingApplications,
        acceptedApplications,
        rejectedApplications,
        profileViews,
        savedJobs: savedJobsCount
      };
      
      console.log('Final stats:', finalStats);
      setStats(finalStats);

      // Set all applications
      const allApps = applications
        .sort((a: any, b: any) => new Date(b.applied_at).getTime() - new Date(a.applied_at).getTime())
        .map((app: any) => {
          console.log('Processing application:', app);
          return {
            id: app.id,
            job: { 
              title: app.job_title || app.job?.title || 'Unknown Job',
              company: { name: app.job_company_name || app.job?.company?.name || 'Unknown Company' }
            },
            status: app.status,
            applied_at: app.applied_at
          };
        });

      console.log('All applications:', allApps);
      setAllApplications(allApps);

      // Set recent applications (last 3)
      const recentApps = allApps.slice(0, 3);
      console.log('Recent applications:', recentApps);
      setRecentApplications(recentApps);

      // Set saved jobs
      const formattedSavedJobs = savedJobs.map((savedJob: any) => {
        console.log('Processing saved job:', savedJob);
        return {
          id: savedJob.job?.id || savedJob.id,
          title: savedJob.job?.title || 'Unknown Job',
          company: { name: savedJob.job?.company?.name || 'Unknown Company' },
          location: { name: savedJob.job?.location?.name || 'Unknown Location' },
          salary_min: savedJob.job?.salary_min,
          salary_max: savedJob.job?.salary_max,
          job_type: savedJob.job?.job_type || 'full_time',
          created_at: savedJob.job?.created_at || savedJob.created_at
        };
      });

      setSavedJobs(formattedSavedJobs);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'hired':
        return 'bg-green-100 text-green-800';
      case 'offered':
        return 'bg-green-100 text-green-800';
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'shortlisted':
        return 'bg-blue-100 text-blue-800';
      case 'interviewed':
        return 'bg-purple-100 text-purple-800';
      case 'reviewing':
        return 'bg-orange-100 text-orange-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'withdrawn':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'hired':
        return <CheckCircleIcon className="h-4 w-4" />;
      case 'offered':
        return <CheckCircleIcon className="h-4 w-4" />;
      case 'accepted':
        return <CheckCircleIcon className="h-4 w-4" />;
      case 'shortlisted':
        return <CheckCircleIcon className="h-4 w-4" />;
      case 'interviewed':
        return <CheckCircleIcon className="h-4 w-4" />;
      case 'reviewing':
        return <ClockIcon className="h-4 w-4" />;
      case 'pending':
        return <ClockIcon className="h-4 w-4" />;
      case 'rejected':
        return <XCircleIcon className="h-4 w-4" />;
      case 'withdrawn':
        return <XCircleIcon className="h-4 w-4" />;
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

  if (!isAuthenticated) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
            <p className="text-gray-600 mb-6">Please log in to access your dashboard.</p>
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
            <p className="text-gray-600">Loading dashboard...</p>
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
                <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-gray-600 mt-2">Welcome back, {user?.first_name || user?.email}</p>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => router.push('/jobs')}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
                >
                  Browse Jobs
                </button>
                <button
                  onClick={() => router.push('/profile')}
                  className="border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-lg text-sm font-medium"
                >
                  Edit Profile
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex space-x-8">
              {[
                { id: 'overview', name: 'Overview', icon: ChartBarIcon },
                { id: 'applications', name: 'Applications', icon: DocumentTextIcon },
                { id: 'saved', name: 'Saved Jobs', icon: HeartIcon },
                { id: 'profile', name: 'Profile', icon: UserIcon },
                { id: 'settings', name: 'Settings', icon: CogIcon }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="h-5 w-5" />
                  <span>{tab.name}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
                >
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <DocumentTextIcon className="h-8 w-8 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Applications</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.totalApplications}</p>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
                >
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <ClockIcon className="h-8 w-8 text-yellow-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Pending</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.pendingApplications}</p>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.2 }}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
                >
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <CheckCircleIcon className="h-8 w-8 text-green-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Accepted</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.acceptedApplications}</p>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.3 }}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
                >
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <EyeIcon className="h-8 w-8 text-purple-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Profile Views</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.profileViews}</p>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Recent Applications */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="bg-white rounded-lg shadow-sm border border-gray-200"
              >
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Recent Applications</h3>
                </div>
                <div className="divide-y divide-gray-200">
                  {recentApplications.map((application) => (
                    <div key={application.id} className="px-6 py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-gray-900">{application.job.title}</h4>
                          <p className="text-sm text-gray-600">{application.job.company.name}</p>
                          <p className="text-xs text-gray-500">{formatDate(application.applied_at)}</p>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(application.status)}`}>
                            {getStatusIcon(application.status)}
                            <span className="ml-1 capitalize">{application.status}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="px-6 py-4 border-t border-gray-200">
                  <button
                    onClick={() => setActiveTab('applications')}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    View all applications →
                  </button>
                </div>
              </motion.div>

              {/* Saved Jobs */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-white rounded-lg shadow-sm border border-gray-200"
              >
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Saved Jobs</h3>
                </div>
                <div className="divide-y divide-gray-200">
                  {savedJobs.map((job) => (
                    <div key={job.id} className="px-6 py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-gray-900">{job.title}</h4>
                          <div className="flex items-center space-x-4 mt-1">
                            <div className="flex items-center text-sm text-gray-600">
                              <BuildingOfficeIcon className="h-4 w-4 mr-1" />
                              {job.company.name}
                            </div>
                            <div className="flex items-center text-sm text-gray-600">
                              <MapPinIcon className="h-4 w-4 mr-1" />
                              {job.location.name}
                            </div>
                            <div className="flex items-center text-sm text-gray-600">
                              <CurrencyDollarIcon className="h-4 w-4 mr-1" />
                              {formatSalary(job.salary_min, job.salary_max)}
                            </div>
                          </div>
                        </div>
                        <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                          Apply
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="px-6 py-4 border-t border-gray-200">
                  <button
                    onClick={() => setActiveTab('saved')}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    View all saved jobs →
                  </button>
                </div>
              </motion.div>
            </div>
          )}

          {activeTab === 'applications' && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">All Applications</h3>
                  <span className="text-sm text-gray-500">{allApplications.length} application{allApplications.length !== 1 ? 's' : ''}</span>
                </div>
              </div>
              <div className="divide-y divide-gray-200">
                {allApplications.length > 0 ? (
                  allApplications.map((application) => (
                    <div key={application.id} className="px-6 py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-gray-900">{application.job.title}</h4>
                          <p className="text-sm text-gray-600">{application.job.company.name}</p>
                          <p className="text-xs text-gray-500">{formatDate(application.applied_at)}</p>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(application.status)}`}>
                            {getStatusIcon(application.status)}
                            <span className="ml-1 capitalize">{application.status}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center text-gray-500">
                    <DocumentTextIcon className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p>No applications found.</p>
                    <p className="text-sm mt-2">Start applying to jobs to see your applications here.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'saved' && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Saved Jobs</h3>
                  <span className="text-sm text-gray-500">{savedJobs.length} job{savedJobs.length !== 1 ? 's' : ''}</span>
                </div>
              </div>
              <div className="divide-y divide-gray-200">
                {savedJobs.length > 0 ? (
                  savedJobs.map((job) => (
                    <div key={job.id} className="px-6 py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-gray-900">{job.title}</h4>
                          <div className="flex items-center space-x-4 mt-1">
                            <div className="flex items-center text-sm text-gray-600">
                              <BuildingOfficeIcon className="h-4 w-4 mr-1" />
                              {job.company.name}
                            </div>
                            <div className="flex items-center text-sm text-gray-600">
                              <MapPinIcon className="h-4 w-4 mr-1" />
                              {job.location.name}
                            </div>
                            <div className="flex items-center text-sm text-gray-600">
                              <CurrencyDollarIcon className="h-4 w-4 mr-1" />
                              {formatSalary(job.salary_min, job.salary_max)}
                            </div>
                          </div>
                        </div>
                        <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                          Apply
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center text-gray-500">
                    <HeartIcon className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p>No saved jobs found.</p>
                    <p className="text-sm mt-2">Save jobs you're interested in to see them here.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Profile</h3>
              </div>
              <div className="p-6 text-center text-gray-500">
                <UserIcon className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>Profile management coming soon...</p>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Settings</h3>
              </div>
              <div className="p-6 text-center text-gray-500">
                <CogIcon className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>Settings feature coming soon...</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default DashboardPage; 