import React, { useState, useEffect, useCallback } from 'react';
import {
  PlayIcon,
  StopIcon,
  ArrowPathIcon,
  Cog6ToothIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  GlobeAltIcon,
  ChartBarIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  XMarkIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  InformationCircleIcon,
  DocumentTextIcon,
  BuildingOfficeIcon,
  BriefcaseIcon,
} from '@heroicons/react/24/outline';
import AdminLayout from '../../components/admin_dashboard/AdminLayout';

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

interface ScraperStats {
  total_jobs: number;
  michael_page_jobs: number;
  pro_bono_jobs: number;
  service_seeking_jobs: number;
  recent_jobs: number;
  jobs_today: number;
  jobs_this_week: number;
}

interface ScraperRun {
  id: string;
  scraper_name: string;
  status: 'running' | 'completed' | 'failed';
  jobs_scraped: number;
  start_time: string;
  end_time?: string;
  error_message?: string;
}

const AdminScrapersPage: React.FC = () => {
  const [scraperStats, setScraperStats] = useState<ScraperStats | null>(null);
  const [recentJobs, setRecentJobs] = useState<ScraperJob[]>([]);
  const [scraperRuns, setScraperRuns] = useState<ScraperRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [runningScrapers, setRunningScrapers] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSource, setFilterSource] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedJob, setSelectedJob] = useState<ScraperJob | null>(null);
  const [showJobModal, setShowJobModal] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
  }>({ open: false, message: '', type: 'success' });

  const scrapers = [
    {
      id: 'michael-page',
      name: 'Michael Page Australia',
      description: 'Professional recruitment agency jobs',
      source_url: 'https://www.michaelpage.com.au/jobs',
      status: 'active',
      last_run: '2024-01-15T10:30:00Z',
      jobs_scraped: 0,
      success_rate: 95,
      avg_response_time: 2.5,
      is_enabled: true,
      schedule: 'Daily at 2:00 AM',
      icon: BuildingOfficeIcon,
      color: 'blue',
    },
    {
      id: 'pro-bono',
      name: 'Pro Bono Australia',
      description: 'Non-profit and community sector jobs',
      source_url: 'https://www.probonoaustralia.com.au/jobs/',
      status: 'active',
      last_run: '2024-01-15T09:15:00Z',
      jobs_scraped: 0,
      success_rate: 88,
      avg_response_time: 3.2,
      is_enabled: true,
      schedule: 'Daily at 3:00 AM',
      icon: DocumentTextIcon,
      color: 'green',
    },
    {
      id: 'service-seeking',
      name: 'ServiceSeeking',
      description: 'Freelance and service-based jobs',
      source_url: 'https://www.serviceseeking.com.au/job-requests/',
      status: 'active',
      last_run: '2024-01-15T08:45:00Z',
      jobs_scraped: 0,
      success_rate: 92,
      avg_response_time: 2.8,
      is_enabled: true,
      schedule: 'Daily at 4:00 AM',
      icon: BriefcaseIcon,
      color: 'orange',
    },
  ];

  const fetchScraperStats = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch scraper statistics from the new API endpoint
      const statsResponse = await fetch('http://127.0.0.1:8000/api/v1/scrapers/stats/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      });

      if (!statsResponse.ok) {
        throw new Error('Failed to fetch scraper statistics');
      }

      const statsData = await statsResponse.json();
      
      // Fetch recent scraped jobs from the new API endpoint
      const jobsResponse = await fetch('http://127.0.0.1:8000/api/v1/scrapers/recent-jobs/?limit=20', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      });

      if (!jobsResponse.ok) {
        throw new Error('Failed to fetch recent jobs');
      }

      const jobsData = await jobsResponse.json();

      // Process stats
      const processedStats: ScraperStats = {
        total_jobs: statsData.total_jobs || 0,
        michael_page_jobs: statsData.jobs_by_source?.michael_page || 0,
        pro_bono_jobs: statsData.jobs_by_source?.pro_bono_australia || 0,
        service_seeking_jobs: statsData.jobs_by_source?.serviceseeking || 0,
        recent_jobs: statsData.recent_activity?.new_jobs_today || 0,
        jobs_today: statsData.recent_activity?.new_jobs_today || 0,
        jobs_this_week: statsData.recent_activity?.new_jobs_this_week || 0,
      };

      setScraperStats(processedStats);
      setRecentJobs(jobsData.jobs || []);

      // Update scraper job counts
      scrapers.forEach(scraper => {
        if (scraper.id === 'michael-page') {
          scraper.jobs_scraped = processedStats.michael_page_jobs;
        } else if (scraper.id === 'pro-bono') {
          scraper.jobs_scraped = processedStats.pro_bono_jobs;
        } else if (scraper.id === 'service-seeking') {
          scraper.jobs_scraped = processedStats.service_seeking_jobs;
        }
      });

    } catch (err: any) {
      const errorMessage = err.message || 'Failed to load scraper data';
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

  const runScraper = async (scraperId: string) => {
    try {
      setRunningScrapers(prev => [...prev, scraperId]);
      
      // Call the backend to run the scraper
      const response = await fetch(`http://127.0.0.1:8000/api/v1/scrapers/run/${scraperId}/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to start scraper');
      }

      const result = await response.json();
      
      setSnackbar({
        open: true,
        message: result.message || `Started ${scraperId} scraper successfully!`,
        type: 'success'
      });

      // Refresh stats after a delay
      setTimeout(() => {
        fetchScraperStats();
      }, 5000);

    } catch (err: any) {
      setSnackbar({
        open: true,
        message: err.message || 'Failed to start scraper',
        type: 'error'
      });
    } finally {
      setRunningScrapers(prev => prev.filter(id => id !== scraperId));
    }
  };

  const handleRefresh = async () => {
    await fetchScraperStats();
        setSnackbar({ 
          open: true, 
      message: 'Scraper data refreshed successfully!',
      type: 'success'
    });
  };

  const handleViewJob = (job: ScraperJob) => {
    setSelectedJob(job);
    setShowJobModal(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-600 bg-green-100';
      case 'inactive':
        return 'text-gray-600 bg-gray-100';
      case 'error':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'inactive':
        return <XCircleIcon className="w-5 h-5 text-gray-500" />;
      case 'error':
        return <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />;
      default:
        return <ClockIcon className="w-5 h-5 text-gray-500" />;
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

  useEffect(() => {
    fetchScraperStats();
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
            <p className="text-gray-600 text-lg">Loading scraper data...</p>
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
            <h3 className="text-xl font-bold text-gray-900 mb-2">Error Loading Scrapers</h3>
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
            <h1 className="text-4xl font-bold text-gray-900">Job Scrapers</h1>
            <p className="text-gray-600 mt-2 text-lg">Manage automated job data collection from external sources.</p>
          </div>
          <button
            onClick={handleRefresh}
            className="flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <ArrowPathIcon className="w-5 h-5 mr-2" />
            Refresh Data
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Total Jobs */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Total Scraped Jobs</p>
                <p className="text-4xl font-bold text-gray-900 mt-2">{formatNumber(scraperStats?.total_jobs || 0)}</p>
              </div>
              <div className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg">
                <GlobeAltIcon className="w-8 h-8 text-white" />
              </div>
            </div>
            <div className="mt-6 flex items-center text-sm">
              <span className="text-green-600 font-semibold">+{scraperStats?.jobs_today || 0}</span>
              <span className="text-gray-500 ml-2">new today</span>
            </div>
          </div>

          {/* Michael Page */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Michael Page</p>
                <p className="text-4xl font-bold text-gray-900 mt-2">{formatNumber(scraperStats?.michael_page_jobs || 0)}</p>
              </div>
              <div className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg">
                <BuildingOfficeIcon className="w-8 h-8 text-white" />
              </div>
            </div>
            <div className="mt-6 flex items-center text-sm">
              <span className="text-blue-600 font-semibold">95%</span>
              <span className="text-gray-500 ml-2">success rate</span>
            </div>
          </div>

          {/* Pro Bono */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Pro Bono Australia</p>
                <p className="text-4xl font-bold text-gray-900 mt-2">{formatNumber(scraperStats?.pro_bono_jobs || 0)}</p>
              </div>
              <div className="p-4 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-lg">
                <DocumentTextIcon className="w-8 h-8 text-white" />
              </div>
            </div>
            <div className="mt-6 flex items-center text-sm">
              <span className="text-green-600 font-semibold">88%</span>
              <span className="text-gray-500 ml-2">success rate</span>
            </div>
          </div>

          {/* ServiceSeeking */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">ServiceSeeking</p>
                <p className="text-4xl font-bold text-gray-900 mt-2">{formatNumber(scraperStats?.service_seeking_jobs || 0)}</p>
              </div>
              <div className="p-4 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl shadow-lg">
                <BriefcaseIcon className="w-8 h-8 text-white" />
              </div>
            </div>
            <div className="mt-6 flex items-center text-sm">
              <span className="text-orange-600 font-semibold">92%</span>
              <span className="text-gray-500 ml-2">success rate</span>
            </div>
          </div>
        </div>

        {/* Scrapers Management */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">Active Scrapers</h3>
            <div className="flex items-center space-x-4">
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                  <input
                    type="text"
                placeholder="Search scrapers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Source</label>
                  <select
                    value={filterSource}
                    onChange={(e) => setFilterSource(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Sources</option>
                    <option value="michael-page">Michael Page</option>
                    <option value="pro-bono">Pro Bono Australia</option>
                    <option value="service-seeking">ServiceSeeking</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Scrapers List */}
          <div className="space-y-4">
            {scrapers.map((scraper) => {
              const IconComponent = scraper.icon;
              const isRunning = runningScrapers.includes(scraper.id);
              
              return (
                <div key={scraper.id} className="flex items-center justify-between p-6 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className={`p-3 bg-gradient-to-br from-${scraper.color}-500 to-${scraper.color}-600 rounded-xl`}>
                      <IconComponent className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900">{scraper.name}</h4>
                      <p className="text-gray-600">{scraper.description}</p>
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                        <span>Last run: {formatDate(scraper.last_run)}</span>
                        <span>Jobs scraped: {formatNumber(scraper.jobs_scraped)}</span>
                        <span>Success rate: {scraper.success_rate}%</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(scraper.status)}`}>
                      {getStatusIcon(scraper.status)}
                      <span className="ml-1">{scraper.status}</span>
                    </div>
                    <button
                      onClick={() => runScraper(scraper.id)}
                      disabled={isRunning}
                      className={`flex items-center px-4 py-2 rounded-lg text-white font-medium transition-all duration-200 ${
                        isRunning
                          ? 'bg-gray-400 cursor-not-allowed'
                          : 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-lg hover:shadow-xl'
                      }`}
                    >
                      {isRunning ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                          Running...
                        </>
                      ) : (
                        <>
                          <PlayIcon className="w-4 h-4 mr-2" />
                          Run Now
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Scraped Jobs */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">Recent Scraped Jobs</h3>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search jobs..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Job</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Scraped</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentJobs.map((job) => (
                  <tr key={job.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{job.title}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{job.company}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{job.location}</div>
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
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        job.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {job.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleViewJob(job)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        <EyeIcon className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Job Details Modal */}
        {showJobModal && selectedJob && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">Job Details</h3>
                <button
                  onClick={() => setShowJobModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Title</label>
                  <p className="text-lg font-semibold text-gray-900">{selectedJob.title}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Company</label>
                  <p className="text-gray-900">{selectedJob.company}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Location</label>
                  <p className="text-gray-900">{selectedJob.location}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Source</label>
                  <p className="text-gray-900">{selectedJob.external_source}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">External URL</label>
                  <a 
                    href={selectedJob.external_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 underline"
                  >
                    {selectedJob.external_url}
                  </a>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Scraped At</label>
                  <p className="text-gray-900">{formatDate(selectedJob.created_at)}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    selectedJob.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {selectedJob.status}
                  </span>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowJobModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Close
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

export default AdminScrapersPage; 