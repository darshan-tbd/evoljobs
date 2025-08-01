import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/hooks/useAuth';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MagnifyingGlassIcon,
  MapPinIcon,
  BuildingOfficeIcon,
  CurrencyDollarIcon,
  BriefcaseIcon,
  ClockIcon,
  FunnelIcon,
  XMarkIcon,
  BookmarkIcon,
  BookmarkSlashIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  AdjustmentsHorizontalIcon,
  SparklesIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { BookmarkIcon as BookmarkSolidIcon } from '@heroicons/react/24/solid';
import Layout from '@/components/layout/Layout';
import { apiClient } from '@/services/authAPI';

interface Job {
  id: string;
  title: string;
  slug?: string;
  company: {
    name: string;
  };
  location: {
    name: string;
  };
  description: string;
  job_type: string;
  salary_min?: number;
  salary_max?: number;
  salary_currency?: string;
  salary_type?: string;
  salary_display?: string;
  remote_option?: string;
  external_url?: string;
  required_skills?: Array<{ id: number; name: string }>;
  created_at: string;
  is_featured?: boolean;
  views_count?: number;
  applications_count?: number;
}


interface JobsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Job[];
}

// Debounce hook for search
const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

const JobsPage: React.FC = () => {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [jobTypeFilter, setJobTypeFilter] = useState('');
  const [experienceFilter, setExperienceFilter] = useState('');
  const [remoteFilter, setRemoteFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalJobs, setTotalJobs] = useState(0);
  const [pageSize] = useState(9); // 9 jobs per page (3 jobs per row)

  // Saved jobs state
  const [savedJobs, setSavedJobs] = useState<Set<string>>(new Set());
  const [savingJobs, setSavingJobs] = useState<Set<string>>(new Set());

  // Debounce search query
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  const jobTypes = [
    { value: 'full_time', label: 'Full Time', icon: '🕒' },
    { value: 'part_time', label: 'Part Time', icon: '⏰' },
    { value: 'contract', label: 'Contract', icon: '📋' },
    { value: 'internship', label: 'Internship', icon: '🎓' },
  ];

  const experienceLevels = [
    { value: 'entry', label: 'Entry Level', icon: '🌱' },
    { value: 'junior', label: 'Junior', icon: '👶' },
    { value: 'mid', label: 'Mid Level', icon: '👨‍💼' },
    { value: 'senior', label: 'Senior', icon: '👴' },
    { value: 'lead', label: 'Lead', icon: '👑' },
    { value: 'executive', label: 'Executive', icon: '🏆' },
  ];

  const remoteOptions = [
    { value: 'onsite', label: 'On-site', icon: '🏠' },
    { value: 'remote', label: 'Remote', icon: '🏠' },
    { value: 'hybrid', label: 'Hybrid', icon: '🔄' },
  ];

  const sortOptions = [
    { value: 'created_at', label: 'Latest', icon: '🕒' },
    { value: 'title', label: 'Title A-Z', icon: '📝' },
    { value: 'salary_min', label: 'Salary High-Low', icon: '💰' },
    { value: 'views_count', label: 'Most Viewed', icon: '👁️' },
  ];

  // Fetch saved jobs when component mounts
  const fetchSavedJobs = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      const response = await fetch('http://127.0.0.1:8000/api/v1/jobs/saved-jobs/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const savedJobIds = new Set<string>(
          (data.results || [])
            .map((savedJob: any) => savedJob.job?.id || savedJob.id)
            .filter((id: any) => id && typeof id === 'string')
        );
        setSavedJobs(savedJobIds);
      } else {
        console.error('Failed to fetch saved jobs:', response.status);
      }
    } catch (error) {
      console.error('Error fetching saved jobs:', error);
    }
  }, [isAuthenticated]);

  // Save/Unsave job function
  const handleSaveJob = async (jobId: string) => {
    if (!isAuthenticated) {
      toast.error('Please log in to save jobs');
      router.push('/login');
      return;
    }

    const isSaved = savedJobs.has(jobId);
    setSavingJobs(prev => new Set(prev).add(jobId));

    try {
      // Use the toggle endpoint which handles both save/unsave
      const response = await fetch('http://127.0.0.1:8000/api/v1/jobs/saved-jobs/toggle/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ job: jobId }),
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.saved) {
          // Job was saved
          setSavedJobs(prev => {
            const newSet = new Set(prev);
            newSet.add(jobId);
            return newSet;
          });
          toast.success('Job saved successfully');
        } else {
          // Job was unsaved
          setSavedJobs(prev => {
            const newSet = new Set(prev);
            newSet.delete(jobId);
            return newSet;
          });
          toast.success('Job removed from saved jobs');
        }
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to update saved job');
      }
    } catch (error) {
      console.error('Error saving/unsaving job:', error);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setSavingJobs(prev => {
        const newSet = new Set(prev);
        newSet.delete(jobId);
        return newSet;
      });
    }
  };

  const fetchJobs = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      setError('');
      
      const params = new URLSearchParams();
      if (debouncedSearchQuery) params.append('search', debouncedSearchQuery);
      if (locationFilter) params.append('location', locationFilter);
      if (jobTypeFilter) params.append('job_type', jobTypeFilter);
      if (experienceFilter) params.append('experience_level', experienceFilter);
      if (remoteFilter) params.append('remote_option', remoteFilter);
      params.append('page', page.toString());
      params.append('page_size', pageSize.toString());
      params.append('ordering', sortOrder === 'desc' ? `-${sortBy}` : sortBy);

      console.log('Fetching jobs with params:', params.toString());
      console.log('Search query:', debouncedSearchQuery);
      console.log('API URL:', `/jobs/jobs/?${params.toString()}`);
      const response = await apiClient.get(`/jobs/jobs/?${params.toString()}`);
      console.log('Jobs response:', response.data);
      const data: JobsResponse = response.data;
      
      setJobs(data.results || []);
      setTotalJobs(data.count);
      setTotalPages(Math.ceil(data.count / pageSize));
      setCurrentPage(page);
    } catch (err: any) {
      console.error('Error fetching jobs:', err);
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to fetch jobs';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearchQuery, locationFilter, jobTypeFilter, experienceFilter, remoteFilter, sortBy, sortOrder, pageSize]);

  useEffect(() => {
    fetchJobs(1);
  }, [fetchJobs]);

  useEffect(() => {
    fetchSavedJobs();
  }, [fetchSavedJobs]);

  const handleApply = (job: Job) => {
    if (!isAuthenticated) {
      toast.error('Please log in to apply for jobs');
      router.push('/login');
      return;
    }

    if (job.external_url) {
      window.open(job.external_url, '_blank');
    } else {
      router.push(`/jobs/${job.slug || job.id}/apply`);
    }
  };

  const handleSortChange = (newSortBy: string) => {
    if (newSortBy === sortBy) {
      // Toggle sort order if same field
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      // Set new sort field with default desc order
      setSortBy(newSortBy);
      setSortOrder('desc');
    }
  };

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    fetchJobs(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setLocationFilter('');
    setJobTypeFilter('');
    setExperienceFilter('');
    setRemoteFilter('');
    setSortBy('created_at');
    setSortOrder('desc');
  };

  const hasActiveFilters = debouncedSearchQuery || locationFilter || jobTypeFilter || experienceFilter || remoteFilter;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const formatSalary = (job: Job) => {
    // Use the backend's formatted salary_display if available
    if (job.salary_display) {
      return job.salary_display;
    }
    
    // Fallback to manual formatting if salary_display is not available
    if (!job.salary_min && !job.salary_max) return 'Salary not specified';
    
    const currency = job.salary_currency || '$';
    const type = job.salary_type || 'year';
    
    if (job.salary_min && job.salary_max) {
      return `${currency}${job.salary_min.toLocaleString()} - ${currency}${job.salary_max.toLocaleString()} per ${type}`;
    }
    if (job.salary_min) {
      return `${currency}${job.salary_min.toLocaleString()}+ per ${type}`;
    }
    if (job.salary_max) {
      return `Up to ${currency}${job.salary_max.toLocaleString()} per ${type}`;
    }
    
    return 'Salary not specified';
  };

  // Check if component is mounted
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
        {/* Hero Header */}
        <div className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Find Your Dream Job
              </h1>
              <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
                Discover thousands of opportunities from top companies worldwide
              </p>
              
              {/* Search Bar */}
              <div className="max-w-2xl mx-auto">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <MagnifyingGlassIcon className="h-6 w-6 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search jobs, companies, or keywords..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="block w-full pl-12 pr-4 py-4 text-lg border-0 rounded-xl shadow-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-300 text-gray-900"
                  />
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center"
                  >
                    <AdjustmentsHorizontalIcon className="h-6 w-6 text-gray-400 hover:text-blue-600 transition-colors" />
                  </button>
                </div>
                {(searchQuery || debouncedSearchQuery) && (
                  <div className="mt-2 text-sm text-blue-100">
                    {loading ? 'Searching...' : `${jobs.length} jobs found${debouncedSearchQuery ? ` for "${debouncedSearchQuery}"` : ''}`}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Filters Section */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-white border-b border-gray-200 shadow-sm"
            >
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                  {/* Location Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Location
                    </label>
                    <input
                      type="text"
                      placeholder="Any location..."
                      value={locationFilter}
                      onChange={(e) => setLocationFilter(e.target.value)}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  {/* Job Type Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Job Type
                    </label>
                    <select
                      value={jobTypeFilter}
                      onChange={(e) => setJobTypeFilter(e.target.value)}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">All Types</option>
                      {jobTypes.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.icon} {type.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Experience Level Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Experience
                    </label>
                    <select
                      value={experienceFilter}
                      onChange={(e) => setExperienceFilter(e.target.value)}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">All Levels</option>
                      {experienceLevels.map((level) => (
                        <option key={level.value} value={level.value}>
                          {level.icon} {level.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Remote Option Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Work Type
                    </label>
                    <select
                      value={remoteFilter}
                      onChange={(e) => setRemoteFilter(e.target.value)}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">All Types</option>
                      {remoteOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.icon} {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Sort By Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sort By
                    </label>
                    <select
                      value={sortBy}
                      onChange={(e) => handleSortChange(e.target.value)}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {sortOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.icon} {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Clear Filters */}
                  <div className="flex items-end">
                    <button
                      onClick={clearAllFilters}
                      className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                    >
                      Clear All
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="bg-white border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
              <div className="flex items-center space-x-2 text-sm">
                <span className="text-gray-500">Active filters:</span>
                {debouncedSearchQuery && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Search: {debouncedSearchQuery}
                    <button
                      onClick={() => setSearchQuery('')}
                      className="ml-1 text-blue-600 hover:text-blue-800"
                    >
                      <XMarkIcon className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {locationFilter && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-cyan-100 text-cyan-800">
                    Location: {locationFilter}
                    <button
                      onClick={() => setLocationFilter('')}
                      className="ml-1 text-cyan-600 hover:text-cyan-800"
                    >
                      <XMarkIcon className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {jobTypeFilter && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Type: {jobTypes.find(t => t.value === jobTypeFilter)?.label}
                    <button
                      onClick={() => setJobTypeFilter('')}
                      className="ml-1 text-blue-600 hover:text-blue-800"
                    >
                      <XMarkIcon className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {experienceFilter && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-cyan-100 text-cyan-800">
                    Experience: {experienceLevels.find(e => e.value === experienceFilter)?.label}
                    <button
                      onClick={() => setExperienceFilter('')}
                      className="ml-1 text-cyan-600 hover:text-cyan-800"
                    >
                      <XMarkIcon className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {remoteFilter && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Work: {remoteOptions.find(r => r.value === remoteFilter)?.label}
                    <button
                      onClick={() => setRemoteFilter('')}
                      className="ml-1 text-blue-600 hover:text-blue-800"
                    >
                      <XMarkIcon className="h-3 w-3" />
                    </button>
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Jobs List */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Results Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {loading ? 'Loading jobs...' : `${totalJobs} jobs found`}
              </h2>
              {!loading && (
                <div className="flex items-center space-x-4 mt-1">
                  <p className="text-gray-600">
                    Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalJobs)} of {totalJobs} results (3 per row)
                  </p>
                  <span className="text-sm text-gray-500">
                    Sorted by: {sortOptions.find(s => s.value === sortBy)?.label} ({sortOrder === 'desc' ? 'Desc' : 'Asc'}) • 9 per page
                  </span>
                </div>
              )}
            </div>
            
            {!loading && totalJobs > 0 && (
              <div className="mt-4 sm:mt-0 flex space-x-2">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="inline-flex items-center px-4 py-2 border border-blue-600 rounded-lg shadow-sm text-sm font-medium text-blue-600 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                >
                  <FunnelIcon className="h-4 w-4 mr-2" />
                  {showFilters ? 'Hide' : 'Show'} Filters
                </button>
              </div>
            )}
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(9)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse">
                  <div className="h-6 bg-gray-200 rounded w-3/4 mb-3"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3 mb-4"></div>
                  <div className="h-8 bg-gray-200 rounded w-full"></div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="text-red-600 mb-4">{error}</div>
              <button
                onClick={() => fetchJobs(1)}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all duration-200"
              >
                Try Again
              </button>
            </div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-12">
              <BriefcaseIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">No jobs found</h3>
              <p className="text-gray-600 mb-6">
                {hasActiveFilters 
                  ? "Try adjusting your search criteria or clear some filters."
                  : "Check back later for new opportunities."
                }
              </p>
              {hasActiveFilters && (
                <button
                  onClick={clearAllFilters}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all duration-200"
                >
                  Clear All Filters
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence>
                  {jobs.map((job, index) => {
                    const isSaved = savedJobs.has(job.id);
                    const isSaving = savingJobs.has(job.id);
                    
                    return (
                      <motion.div
                        key={job.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        className={`bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-200 overflow-hidden ${
                          job.is_featured ? 'ring-2 ring-yellow-400' : ''
                        }`}
                      >
                        {job.is_featured && (
                          <div className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white text-xs font-medium px-3 py-1 text-center">
                            <SparklesIcon className="h-3 w-3 inline mr-1" />
                            Featured Job
                          </div>
                        )}
                        
                        <div className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <h3 
                                className="text-lg font-semibold text-gray-900 hover:text-blue-600 cursor-pointer line-clamp-2 transition-colors"
                                onClick={() => router.push(`/jobs/${job.slug || job.id}`)}
                              >
                                {job.title}
                              </h3>
                            </div>
                            <button 
                              onClick={() => handleSaveJob(job.id)}
                              disabled={isSaving}
                              className={`p-2 transition-colors ml-2 ${
                                isSaving 
                                  ? 'text-gray-300 cursor-not-allowed' 
                                  : isSaved 
                                    ? 'text-blue-600 hover:text-blue-700' 
                                    : 'text-gray-400 hover:text-blue-600'
                              }`}
                            >
                              {isSaving ? (
                                <div className="w-5 h-5 border-2 border-gray-300 border-t-transparent rounded-full animate-spin"></div>
                              ) : isSaved ? (
                                <BookmarkSolidIcon className="h-5 w-5" />
                              ) : (
                                <BookmarkIcon className="h-5 w-5" />
                              )}
                            </button>
                          </div>
                          
                          <div className="space-y-3 mb-4">
                            <div className="flex items-center text-gray-600">
                              <BuildingOfficeIcon className="h-4 w-4 mr-2 flex-shrink-0" />
                              <span className="truncate">{job.company.name}</span>
                            </div>
                            
                            {job.location && (
                              <div className="flex items-center text-gray-600">
                                <MapPinIcon className="h-4 w-4 mr-2 flex-shrink-0" />
                                <span className="truncate">{job.location.name}</span>
                              </div>
                            )}
                            
                            <div className="flex items-center text-gray-600">
                              <ClockIcon className="h-4 w-4 mr-2 flex-shrink-0" />
                              <span>{formatDate(job.created_at)}</span>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2 mb-4">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {jobTypes.find(t => t.value === job.job_type)?.label || job.job_type}
                            </span>
                            {job.remote_option && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                {job.remote_option}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center mb-4">
                            <CurrencyDollarIcon className="h-4 w-4 text-gray-400 mr-2" />
                            <span className="text-sm text-gray-600">{formatSalary(job)}</span>
                          </div>

                          <div className="mb-4 min-h-[60px]">
                            {job.description && (
                              <p className="text-gray-600 text-sm line-clamp-3">
                                {job.description}
                              </p>
                            )}
                          </div>

                          <div className="mb-4 min-h-[32px]">
                            {job.required_skills && job.required_skills.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {job.required_skills.slice(0, 3).map((skill) => (
                                  <span
                                    key={skill.id}
                                    className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700"
                                  >
                                    {skill.name}
                                  </span>
                                ))}
                                {job.required_skills.length > 3 && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                                    +{job.required_skills.length - 3} more
                                  </span>
                                )}
                              </div>
                            )}
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex space-x-2 flex-1">
                              <button
                                onClick={() => router.push(`/jobs/${job.slug || job.id}`)}
                                className="px-4 py-2 border border-blue-600 text-blue-600 text-sm font-medium rounded-lg hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                              >
                                View Details
                              </button>
                              <button
                                onClick={() => handleApply(job)}
                                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white text-sm font-medium rounded-lg hover:from-blue-700 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200"
                              >
                                Apply Now
                              </button>
                            </div>
                            
                            {job.views_count !== undefined && (
                              <div className="flex items-center text-xs text-gray-500 ml-3">
                                <EyeIcon className="h-3 w-3 mr-1" />
                                {job.views_count}
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>

              {/* Pagination */}
              {totalJobs > 9 && (
                <div className="mt-12 flex items-center justify-center">
                  <nav className="flex items-center space-x-2">
                    {/* Previous Button */}
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeftIcon className="h-4 w-4" />
                    </button>

                    {/* Page Numbers */}
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }

                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                            currentPage === pageNum
                              ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white'
                              : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}

                    {/* Next Button */}
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronRightIcon className="h-4 w-4" />
                    </button>
                  </nav>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default JobsPage; 