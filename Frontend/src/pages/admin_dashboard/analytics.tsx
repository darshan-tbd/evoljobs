import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Bar, Pie } from 'react-chartjs-2';
import {
  UsersIcon,
  BuildingOfficeIcon,
  BriefcaseIcon,
  DocumentTextIcon,
  ChartBarIcon,
  ArrowPathIcon,
  CalendarIcon,
  MapPinIcon,
  StarIcon,
  EyeIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  CheckCircleIcon,
  ClockIcon,
  GlobeAltIcon,
  CurrencyDollarIcon,
  AcademicCapIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../../hooks/useAuth';
import AdminLayout from '../../components/admin_dashboard/AdminLayout';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface AnalyticsData {
  overview: {
    totalUsers: number;
    totalCompanies: number;
    totalJobs: number;
    totalApplications: number;
    activeJobs: number;
    pendingApplications: number;
  };
  userGrowth: {
    labels: string[];
    data: number[];
    growthRate: number;
  };
  userTypes: {
    job_seekers: number;
    employers: number;
    admins: number;
  };
  jobCategories: {
    category: string;
    count: number;
    percentage: number;
  }[];
  topCompanies: {
    name: string;
    jobCount: number;
    applicationCount: number;
    avgRating: number;
  }[];
  mostViewedJobs: {
    title: string;
    company: string;
    views: number;
    applications: number;
  }[];
  applicationTrends: {
    labels: string[];
    data: number[];
  };
  locationStats: {
    location: string;
    jobCount: number;
    userCount: number;
  }[];
}

const AdminAnalyticsPage: React.FC = () => {
  const { user } = useAuth();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState('30d');

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange]);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    setError(null);
    
    const accessToken = localStorage.getItem('access_token');
    console.log('Access token available:', !!accessToken);
    
    if (!accessToken) {
      console.error('No access token found');
      setError('No access token found');
      setLoading(false);
      return;
    }
    
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/v1/analytics/admin-analytics/dashboard_stats/?time_range=${timeRange}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Analytics API response:', data);
        setAnalyticsData(data);
      } else {
        const errorText = await response.text();
        console.error('Analytics API error:', response.status, errorText);
        throw new Error('Failed to fetch analytics data');
      }
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch analytics data');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAnalyticsData();
    setRefreshing(false);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num);
  };

  const getGrowthIcon = (rate: number) => {
    if (rate > 0) {
      return <ArrowTrendingUpIcon className="w-4 h-4 text-green-600" />;
    } else if (rate < 0) {
      return <ArrowTrendingDownIcon className="w-4 h-4 text-red-600" />;
    }
    return <ChartBarIcon className="w-4 h-4 text-gray-400" />;
  };

  const getGrowthColor = (rate: number) => {
    if (rate > 0) return 'text-green-600';
    if (rate < 0) return 'text-red-600';
    return 'text-gray-500';
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 text-lg">Loading analytics data...</p>
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
            <h3 className="text-xl font-bold text-gray-900 mb-2">Error Loading Analytics</h3>
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

  if (!analyticsData) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <ExclamationTriangleIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">No analytics data available</p>
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
            <h1 className="text-4xl font-bold text-gray-900">Analytics Dashboard</h1>
            <p className="text-gray-600 mt-2 text-lg">Platform insights and performance metrics</p>
          </div>
          <div className="flex items-center space-x-4">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-xl bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 shadow-lg hover:shadow-xl"
            >
              <ArrowPathIcon className={`w-5 h-5 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Total Users */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Total Users</p>
                <p className="text-4xl font-bold text-gray-900 mt-2">{formatNumber(analyticsData.overview.totalUsers)}</p>
              </div>
              <div className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg">
                <UsersIcon className="w-8 h-8 text-white" />
              </div>
            </div>
            <div className="mt-6 flex items-center text-sm">
              {getGrowthIcon(analyticsData.userGrowth.growthRate)}
              <span className={`font-semibold ml-2 ${getGrowthColor(analyticsData.userGrowth.growthRate)}`}>
                {analyticsData.userGrowth.growthRate > 0 ? '+' : ''}{analyticsData.userGrowth.growthRate.toFixed(1)}%
              </span>
              <span className="text-gray-500 ml-2">from last period</span>
            </div>
          </div>

          {/* Total Companies */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Companies</p>
                <p className="text-4xl font-bold text-gray-900 mt-2">{formatNumber(analyticsData.overview.totalCompanies)}</p>
              </div>
              <div className="p-4 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-lg">
                <BuildingOfficeIcon className="w-8 h-8 text-white" />
              </div>
            </div>
            <div className="mt-6 flex items-center text-sm">
              <span className="text-gray-500">Active companies</span>
            </div>
          </div>

          {/* Active Jobs */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Active Jobs</p>
                <p className="text-4xl font-bold text-gray-900 mt-2">{formatNumber(analyticsData.overview.activeJobs)}</p>
              </div>
              <div className="p-4 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-lg">
                <BriefcaseIcon className="w-8 h-8 text-white" />
              </div>
            </div>
            <div className="mt-6 flex items-center text-sm">
              <span className="text-gray-500">Total: {formatNumber(analyticsData.overview.totalJobs)}</span>
            </div>
          </div>

          {/* Pending Applications */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Pending Applications</p>
                <p className="text-4xl font-bold text-gray-900 mt-2">{formatNumber(analyticsData.overview.pendingApplications)}</p>
              </div>
              <div className="p-4 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl shadow-lg">
                <DocumentTextIcon className="w-8 h-8 text-white" />
              </div>
            </div>
            <div className="mt-6 flex items-center text-sm">
              <span className="text-gray-500">Total: {formatNumber(analyticsData.overview.totalApplications)}</span>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* User Growth Chart */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">User Growth Trend</h3>
              <div className="flex items-center text-sm text-gray-500">
                <CalendarIcon className="w-4 h-4 mr-1" />
                Last 30 days
              </div>
            </div>
            <div className="h-80">
              <Line
                data={{
                  labels: analyticsData.userGrowth.labels,
                  datasets: [
                    {
                      label: 'New Users',
                      data: analyticsData.userGrowth.data,
                      borderColor: 'rgb(59, 130, 246)',
                      backgroundColor: 'rgba(59, 130, 246, 0.1)',
                      tension: 0.4,
                      fill: true,
                      pointBackgroundColor: 'rgb(59, 130, 246)',
                      pointBorderColor: '#fff',
                      pointBorderWidth: 2,
                      pointRadius: 4,
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: false,
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: {
                        stepSize: 1,
                      },
                      grid: {
                        color: 'rgba(0, 0, 0, 0.05)',
                      },
                    },
                    x: {
                      grid: {
                        display: false,
                      },
                    },
                  },
                }}
              />
            </div>
          </div>

          {/* User Type Distribution */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
            <h3 className="text-xl font-bold text-gray-900 mb-6">User Type Distribution</h3>
            <div className="h-80">
              <Pie
                data={{
                  labels: ['Job Seekers', 'Employers', 'Admins'],
                  datasets: [
                    {
                      data: [
                        analyticsData.userTypes.job_seekers,
                        analyticsData.userTypes.employers,
                        analyticsData.userTypes.admins,
                      ],
                      backgroundColor: [
                        'rgba(59, 130, 246, 0.8)',
                        'rgba(147, 51, 234, 0.8)',
                        'rgba(16, 185, 129, 0.8)',
                      ],
                      borderColor: [
                        'rgba(59, 130, 246, 1)',
                        'rgba(147, 51, 234, 1)',
                        'rgba(16, 185, 129, 1)',
                      ],
                      borderWidth: 2,
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom',
                      labels: {
                        padding: 20,
                        usePointStyle: true,
                      },
                    },
                  },
                }}
              />
            </div>
          </div>
        </div>

        {/* Detailed Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Job Categories */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Job Categories</h3>
            <div className="space-y-4">
              {analyticsData.jobCategories.map((category, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 rounded-lg mr-4">
                      <AcademicCapIcon className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{category.category}</p>
                      <p className="text-sm text-gray-500">{category.count} jobs</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-blue-600">{category.percentage}%</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Companies */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Top Companies</h3>
            <div className="space-y-4">
              {analyticsData.topCompanies.map((company, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center">
                    <div className="p-2 bg-purple-100 rounded-lg mr-4">
                      <BuildingOfficeIcon className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{company.name}</p>
                      <p className="text-sm text-gray-500">{company.jobCount} jobs • {company.applicationCount} applications</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <StarIcon className="w-4 h-4 text-yellow-500 mr-1" />
                    <span className="font-semibold text-gray-900">{company.avgRating.toFixed(1)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Most Viewed Jobs */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Most Viewed Jobs</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {analyticsData.mostViewedJobs.map((job, index) => (
              <div key={index} className="p-6 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <EyeIcon className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">{job.views} views</p>
                    <p className="text-xs text-gray-500">{job.applications} applications</p>
                  </div>
                </div>
                <h4 className="font-semibold text-gray-900 mb-2 line-clamp-2">{job.title}</h4>
                <p className="text-sm text-gray-600">{job.company || 'Unknown Company'}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Application Trends */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">Application Trends</h3>
            <div className="flex items-center text-sm text-gray-500">
              <CalendarIcon className="w-4 h-4 mr-1" />
              Last 30 days
            </div>
          </div>
          <div className="h-80">
            <Bar
              data={{
                labels: analyticsData.applicationTrends.labels,
                datasets: [
                  {
                    label: 'Applications',
                    data: analyticsData.applicationTrends.data,
                    backgroundColor: 'rgba(147, 51, 234, 0.8)',
                    borderColor: 'rgba(147, 51, 234, 1)',
                    borderWidth: 1,
                    borderRadius: 8,
                  },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: false,
                  },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      stepSize: 1,
                    },
                    grid: {
                      color: 'rgba(0, 0, 0, 0.05)',
                    },
                  },
                  x: {
                    grid: {
                      display: false,
                    },
                  },
                },
              }}
            />
          </div>
        </div>

        {/* Location Statistics */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Top Locations</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {analyticsData.locationStats.map((location, index) => (
              <div key={index} className="p-6 bg-gray-50 rounded-xl">
                <div className="flex items-center mb-4">
                  <div className="p-2 bg-blue-100 rounded-lg mr-4">
                    <MapPinIcon className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{location.location}</h4>
                    <p className="text-sm text-gray-500">{location.jobCount} jobs</p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Users</span>
                  <span className="font-semibold text-gray-900">{location.userCount}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminAnalyticsPage; 