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
      <div className="space-y-2 sm:space-y-3 lg:space-y-4 xl:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold text-gray-900 truncate">Job Scrapers</h1>
            <p className="text-gray-600 mt-1 text-xs sm:text-sm lg:text-base xl:text-lg line-clamp-2">Manage automated job data collection from external sources.</p>
          </div>
          <button
            onClick={handleRefresh}
            className="flex items-center px-3 py-1.5 sm:px-4 sm:py-2 lg:px-6 lg:py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg sm:rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl text-xs sm:text-sm lg:text-base flex-shrink-0"
          >
            <ArrowPathIcon className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Refresh Data</span>
            <span className="sm:hidden">Refresh</span>
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-1.5 sm:gap-2 lg:gap-3 xl:gap-4">
          {/* Total Jobs */}
          <div className="bg-white rounded-lg sm:rounded-xl lg:rounded-2xl shadow-lg border border-gray-100 p-2 sm:p-3 lg:p-4 xl:p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-semibold text-gray-600 uppercase tracking-wide truncate">Total Scraped Jobs</p>
                <p className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-gray-900 mt-0.5 sm:mt-1 lg:mt-2">{formatNumber(scraperStats?.total_jobs || 0)}</p>
              </div>
              <div className="p-1 sm:p-2 lg:p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg sm:rounded-xl shadow-lg ml-1 sm:ml-2 flex-shrink-0">
                <GlobeAltIcon className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 xl:w-8 xl:h-8 text-white" />
              </div>
            </div>
            <div className="mt-1 sm:mt-2 lg:mt-3 xl:mt-4 flex items-center text-xs sm:text-sm">
              <span className="text-green-600 font-semibold">+{scraperStats?.jobs_today || 0}</span>
              <span className="text-gray-500 ml-1 sm:ml-2 hidden sm:inline">new today</span>
            </div>
          </div>

          {/* Michael Page */}
          <div className="bg-white rounded-lg sm:rounded-xl lg:rounded-2xl shadow-lg border border-gray-100 p-2 sm:p-3 lg:p-4 xl:p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-semibold text-gray-600 uppercase tracking-wide truncate">Michael Page</p>
                <p className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-gray-900 mt-0.5 sm:mt-1 lg:mt-2">{formatNumber(scraperStats?.michael_page_jobs || 0)}</p>
              </div>
              <div className="p-1 sm:p-2 lg:p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg sm:rounded-xl shadow-lg ml-1 sm:ml-2 flex-shrink-0">
                <BuildingOfficeIcon className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 xl:w-8 xl:h-8 text-white" />
              </div>
            </div>
            <div className="mt-1 sm:mt-2 lg:mt-3 xl:mt-4 flex items-center text-xs sm:text-sm">
              <span className="text-blue-600 font-semibold">95%</span>
              <span className="text-gray-500 ml-1 sm:ml-2 hidden sm:inline">success rate</span>
            </div>
          </div>

          {/* Pro Bono */}
          <div className="bg-white rounded-lg sm:rounded-xl lg:rounded-2xl shadow-lg border border-gray-100 p-2 sm:p-3 lg:p-4 xl:p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-semibold text-gray-600 uppercase tracking-wide truncate">Pro Bono Australia</p>
                <p className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-gray-900 mt-0.5 sm:mt-1 lg:mt-2">{formatNumber(scraperStats?.pro_bono_jobs || 0)}</p>
              </div>
              <div className="p-1 sm:p-2 lg:p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-lg sm:rounded-xl shadow-lg ml-1 sm:ml-2 flex-shrink-0">
                <DocumentTextIcon className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 xl:w-8 xl:h-8 text-white" />
              </div>
            </div>
            <div className="mt-1 sm:mt-2 lg:mt-3 xl:mt-4 flex items-center text-xs sm:text-sm">
              <span className="text-green-600 font-semibold">88%</span>
              <span className="text-gray-500 ml-1 sm:ml-2 hidden sm:inline">success rate</span>
            </div>
          </div>

          {/* ServiceSeeking */}
          <div className="bg-white rounded-lg sm:rounded-xl lg:rounded-2xl shadow-lg border border-gray-100 p-2 sm:p-3 lg:p-4 xl:p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-semibold text-gray-600 uppercase tracking-wide truncate">ServiceSeeking</p>
                <p className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-gray-900 mt-0.5 sm:mt-1 lg:mt-2">{formatNumber(scraperStats?.service_seeking_jobs || 0)}</p>
              </div>
              <div className="p-1 sm:p-2 lg:p-3 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg sm:rounded-xl shadow-lg ml-1 sm:ml-2 flex-shrink-0">
                <BriefcaseIcon className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 xl:w-8 xl:h-8 text-white" />
              </div>
            </div>
            <div className="mt-1 sm:mt-2 lg:mt-3 xl:mt-4 flex items-center text-xs sm:text-sm">
              <span className="text-orange-600 font-semibold">92%</span>
              <span className="text-gray-500 ml-1 sm:ml-2 hidden sm:inline">success rate</span>
            </div>
          </div>
        </div>

        {/* Scrapers Management */}
        <div className="bg-white rounded-lg sm:rounded-xl lg:rounded-2xl shadow-lg border border-gray-100 p-3 sm:p-4 lg:p-6 xl:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 sm:mb-4 lg:mb-6 space-y-2 sm:space-y-0">
            <h3 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 truncate">Active Scrapers</h3>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center px-3 py-1.5 sm:px-4 sm:py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors text-xs sm:text-sm lg:text-base"
              >
                <FunnelIcon className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Filters</span>
                <span className="sm:hidden">Filter</span>
                {showFilters ? <ChevronUpIcon className="w-3 h-3 sm:w-4 sm:h-4 ml-1" /> : <ChevronDownIcon className="w-3 h-3 sm:w-4 sm:h-4 ml-1" />}
              </button>
            </div>
          </div>

        {/* Filters */}
          {showFilters && (
            <div className="mb-3 sm:mb-4 lg:mb-6 p-2 sm:p-3 lg:p-4 bg-gray-50 rounded-lg sm:rounded-xl">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 lg:gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Search</label>
                  <input
                    type="text"
                placeholder="Search scrapers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs sm:text-sm lg:text-base"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Source</label>
                  <select
                    value={filterSource}
                    onChange={(e) => setFilterSource(e.target.value)}
                    className="w-full px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs sm:text-sm lg:text-base"
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
          <div className="space-y-2 sm:space-y-3 lg:space-y-4">
            {scrapers.map((scraper) => {
              const IconComponent = scraper.icon;
              const isRunning = runningScrapers.includes(scraper.id);
              
              return (
                <div key={scraper.id} className="bg-white rounded-lg sm:rounded-xl border border-gray-200 p-3 sm:p-4 lg:p-6 hover:bg-gray-50 transition-colors">
                  {/* Mobile Layout */}
                  <div className="flex flex-col space-y-3 sm:hidden">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className={`p-1.5 bg-gradient-to-br from-${scraper.color}-500 to-${scraper.color}-600 rounded-lg`}>
                          <IconComponent className="w-4 h-4 text-white" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-sm font-semibold text-gray-900 truncate">{scraper.name}</h4>
                          <div className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(scraper.status)}`}>
                            {getStatusIcon(scraper.status)}
                            <span className="ml-1">{scraper.status}</span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => runScraper(scraper.id)}
                        disabled={isRunning}
                        className={`flex items-center px-2 py-1 rounded-md text-white text-xs font-medium transition-all duration-200 flex-shrink-0 ${
                          isRunning
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800'
                        }`}
                      >
                        {isRunning ? (
                          <>
                            <div className="animate-spin rounded-full h-3 w-3 border border-white border-t-transparent mr-1"></div>
                            Run
                          </>
                        ) : (
                          <>
                            <PlayIcon className="w-3 h-3 mr-1" />
                            Run
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-gray-600 line-clamp-2">{scraper.description}</p>
                    <div className="grid grid-cols-1 gap-1 text-xs text-gray-500">
                      <span className="truncate">Last: {formatDate(scraper.last_run)}</span>
                      <span>Jobs: {formatNumber(scraper.jobs_scraped)} | Rate: {scraper.success_rate}%</span>
                    </div>
                  </div>

                  {/* Desktop Layout */}
                  <div className="hidden sm:flex items-center justify-between">
                    <div className="flex items-center space-x-3 lg:space-x-4">
                      <div className={`p-2 lg:p-3 bg-gradient-to-br from-${scraper.color}-500 to-${scraper.color}-600 rounded-lg lg:rounded-xl`}>
                        <IconComponent className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-base lg:text-lg font-semibold text-gray-900 truncate">{scraper.name}</h4>
                        <p className="text-sm lg:text-base text-gray-600 truncate">{scraper.description}</p>
                        <div className="flex items-center space-x-2 lg:space-x-4 mt-1 lg:mt-2 text-xs lg:text-sm text-gray-500">
                          <span className="truncate">Last run: {formatDate(scraper.last_run)}</span>
                          <span className="hidden md:inline">Jobs scraped: {formatNumber(scraper.jobs_scraped)}</span>
                          <span>Success rate: {scraper.success_rate}%</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 lg:space-x-3 flex-shrink-0">
                      <div className={`px-2 lg:px-3 py-1 rounded-full text-xs lg:text-sm font-medium ${getStatusColor(scraper.status)}`}>
                        {getStatusIcon(scraper.status)}
                        <span className="ml-1">{scraper.status}</span>
                      </div>
                      <button
                        onClick={() => runScraper(scraper.id)}
                        disabled={isRunning}
                        className={`flex items-center px-3 lg:px-4 py-1.5 lg:py-2 rounded-lg text-white text-sm lg:text-base font-medium transition-all duration-200 ${
                          isRunning
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-lg hover:shadow-xl'
                        }`}
                      >
                        {isRunning ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                            <span className="hidden lg:inline">Running...</span>
                            <span className="lg:hidden">Run...</span>
                          </>
                        ) : (
                          <>
                            <PlayIcon className="w-4 h-4 mr-2" />
                            <span className="hidden lg:inline">Run Now</span>
                            <span className="lg:hidden">Run</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Scraped Jobs */}
        <div className="bg-white rounded-lg sm:rounded-xl lg:rounded-2xl shadow-lg border border-gray-100 p-3 sm:p-4 lg:p-6 xl:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 sm:mb-4 lg:mb-6 space-y-2 sm:space-y-0">
            <h3 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 truncate">Recent Scraped Jobs</h3>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="relative flex-1 sm:flex-none">
                <MagnifyingGlassIcon className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search jobs..."
                  className="w-full sm:w-auto pl-8 sm:pl-9 lg:pl-10 pr-2 sm:pr-3 lg:pr-4 py-1.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs sm:text-sm lg:text-base"
                />
              </div>
            </div>
          </div>

          {/* Desktop Table */}
          <div className="hidden lg:block overflow-x-auto">
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

          {/* Mobile Cards */}
          <div className="lg:hidden space-y-3">
            {recentJobs.map((job) => (
              <div key={job.id} className="bg-white border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-gray-900 line-clamp-2">{job.title}</h4>
                    <p className="text-xs text-gray-600 truncate mt-1">{job.company}</p>
                  </div>
                  <button
                    onClick={() => handleViewJob(job)}
                    className="text-blue-600 hover:text-blue-900 p-1 flex-shrink-0"
                  >
                    <EyeIcon className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                  <span className="truncate flex-1 mr-2">{job.location}</span>
                  <span className="flex-shrink-0">{formatDate(job.created_at)}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    job.external_source === 'Michael Page' ? 'bg-blue-100 text-blue-800' :
                    job.external_source === 'Pro Bono Australia' ? 'bg-green-100 text-green-800' :
                    'bg-orange-100 text-orange-800'
                  }`}>
                    {job.external_source}
                  </span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    job.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {job.status}
                  </span>
                </div>
              </div>
            ))}
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
      </div>
    </AdminLayout>
  );
};

export default AdminScrapersPage; 