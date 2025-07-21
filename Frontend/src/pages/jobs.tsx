import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/router';
import {
  Box,
  Container,
  Typography,
  Grid,
  Pagination,
  Paper,
  Skeleton,
  Alert,
  useMediaQuery,
  useTheme,
  Drawer,
  IconButton,
  Fab,
  Badge,
} from '@mui/material';
import {
  FilterList as FilterListIcon,
  Close as CloseIcon,
  Work as WorkIcon,
} from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';
import ProtectedRoute from '../components/ProtectedRoute';
import JobFilters from '../components/JobFilters';
import JobCard from '../components/JobCard';
import { apiClient } from '../services/authAPI';

interface Job {
  id: string;
  title: string;
  slug: string;
  description?: string;
  company: {
    id: string;
    name: string;
    logo?: string;
    website?: string;
  };
  location?: {
    id: string;
    name: string;
    city?: string;
    state?: string;
    country?: string;
  };
  industry?: {
    id: string;
    name: string;
  };
  job_type: string;
  experience_level: string;
  remote_option: string;
  salary_min?: number;
  salary_max?: number;
  salary_display?: string;
  required_skills?: Array<{
    id: string;
    name: string;
    category?: string;
  }>;
  is_featured?: boolean;
  is_recent?: boolean;
  is_trending?: boolean;
  is_urgent?: boolean;
  views_count?: number;
  applications_count?: number;
  time_since_posted?: string;
  application_deadline?: string;
  created_at: string;
  application_url?: string;
}

const JobsPage: React.FC = () => {
  const router = useRouter();
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('lg'));
  


  // Results state
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  
  // Facets state
  const [facets, setFacets] = useState(null);
  const [facetsLoading, setFacetsLoading] = useState(false);
  
  // Saved jobs state
  const [savedJobs, setSavedJobs] = useState<Set<string>>(new Set());
  const [loadingSavedJobs, setLoadingSavedJobs] = useState(false);
  
  // Add refs to track loading states to prevent concurrent calls
  const loadingSavedJobsRef = useRef(false);
  const fetchingJobsRef = useRef(false);
  
  // Mobile filter drawer state
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Memoize filters from URL params to prevent infinite re-renders
  const filters = useMemo(() => {
    // Only recalculate if router.query actually changed
    if (!router.isReady) {
      return {
        searchTerm: '',
        location: '',
        jobTypes: [],
        experienceLevels: [],
        remoteOptions: [],
        companies: [],
        industries: [],
        skills: [],
        salaryRange: [0, 200000],
        datePosted: '',
        featuredOnly: false,
        excludeExpired: true,
        hasDeadline: false,
        sortBy: 'created_at',
        sortOrder: 'desc' as 'asc' | 'desc',
      };
    }
    
    const {
      q,
      location: loc,
      job_types,
      experience_levels,
      remote_options,
      companies,
      industries,
      skills,
      salary_min,
      salary_max,
      date_posted,
      featured_only,
      exclude_expired,
      has_deadline,
      sort_by,
      sort_order,
    } = router.query;
    
    return {
      searchTerm: (q as string) || '',
      location: (loc as string) || '',
      jobTypes: job_types ? (job_types as string).split(',') : [],
      experienceLevels: experience_levels ? (experience_levels as string).split(',') : [],
      remoteOptions: remote_options ? (remote_options as string).split(',') : [],
      companies: companies ? (companies as string).split(',') : [],
      industries: industries ? (industries as string).split(',') : [],
      skills: skills ? (skills as string).split(',') : [],
      salaryRange: [
        parseInt(salary_min as string) || 0,
        parseInt(salary_max as string) || 200000,
      ],
      datePosted: (date_posted as string) || '',
      featuredOnly: featured_only === 'true',
      excludeExpired: exclude_expired !== 'false',
      hasDeadline: has_deadline === 'true',
      sortBy: (sort_by as string) || 'created_at',
      sortOrder: (sort_order as 'asc' | 'desc') || 'desc',
    };
  }, [
    router.isReady,
    router.query.q,
    router.query.location,
    router.query.job_types,
    router.query.experience_levels,
    router.query.remote_options,
    router.query.companies,
    router.query.industries,
    router.query.skills,
    router.query.salary_min,
    router.query.salary_max,
    router.query.date_posted,
    router.query.featured_only,
    router.query.exclude_expired,
    router.query.has_deadline,
    router.query.sort_by,
    router.query.sort_order,
  ]);

  const fetchJobs = useCallback(async () => {
    if (fetchingJobsRef.current) return; // Prevent concurrent requests
    
    fetchingJobsRef.current = true;
    setLoading(true);
    setError('');
    
    // Minimum loading time to prevent blinking
    const startTime = Date.now();
    const minLoadingTime = 200;
    
    try {
      const params = new URLSearchParams();
      
      // Basic search
      if (filters.searchTerm) params.set('q', filters.searchTerm);
      if (filters.location) params.set('location', filters.location);
      
      // Multiple selections
      if (filters.jobTypes.length) params.set('job_types', filters.jobTypes.join(','));
      if (filters.experienceLevels.length) params.set('experience_levels', filters.experienceLevels.join(','));
      if (filters.remoteOptions.length) params.set('remote_options', filters.remoteOptions.join(','));
      if (filters.companies.length) params.set('companies', filters.companies.join(','));
      if (filters.industries.length) params.set('industries', filters.industries.join(','));
      if (filters.skills.length) params.set('skills', filters.skills.join(','));
      
      // Salary range
      if (filters.salaryRange[0] > 0) params.set('salary_min', filters.salaryRange[0].toString());
      if (filters.salaryRange[1] < 200000) params.set('salary_max', filters.salaryRange[1].toString());
      
      // Date and special filters
      if (filters.datePosted) params.set('date_posted', filters.datePosted);
      if (filters.featuredOnly) params.set('featured_only', 'true');
      if (filters.excludeExpired) params.set('exclude_expired', 'true');
      if (filters.hasDeadline) params.set('has_deadline', 'true');
      
      // Sorting
      params.set('ordering', filters.sortOrder === 'asc' ? filters.sortBy : `-${filters.sortBy}`);
      
      // Pagination
      params.set('page', page.toString());
      
      const finalUrl = `/jobs/jobs/?${params.toString()}`;
      
      const response = await apiClient.get(finalUrl);
      
      if (response.status === 200) {
        const data = response.data;
        setJobs(data.results || []);
        setTotalCount(data.count || 0);
        setTotalPages(Math.ceil((data.count || 0) / 12)); // Assuming 12 per page
        setFacets(data.facets || null);
        
        // Clear any previous error messages on successful load
        if (data.results?.length > 0) {
          setError('');
        }
      } else {
        throw new Error('Failed to fetch jobs');
      }
    } catch (error: any) {
      console.error('Error fetching jobs:', error);
      setError(error.message || 'Failed to load jobs. Please try again.');
    } finally {
      // Ensure minimum loading time to prevent blinking
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, minLoadingTime - elapsedTime);
      
      setTimeout(() => {
        setLoading(false);
        fetchingJobsRef.current = false;
      }, remainingTime);
    }
  }, [filters, page]); // Only depend on actual filter/page changes

  // Load saved jobs status
  const loadSavedJobs = useCallback(async (jobIds: string[]) => {
    if (!user || jobIds.length === 0) return;
    
    // Use a flag to prevent duplicate calls
    if (loadingSavedJobsRef.current) return;
    
    loadingSavedJobsRef.current = true;
    
    try {
      const response = await apiClient.get(`/jobs/saved-jobs/check/?jobs=${jobIds.join(',')}`);
      
      if (response.status === 200) {
        const data = response.data;
        setSavedJobs(new Set(data.saved_jobs));
      }
    } catch (error) {
      // Silently handle auth errors and other errors for saved jobs
      // This is an optional feature that shouldn't block the jobs page
      if (error.response?.status === 401) {
        // User not authenticated for saved jobs, set empty saved jobs silently
        setSavedJobs(new Set());
      } else {
        // Other errors - log but don't show to user
        console.error('Error loading saved jobs:', error);
        setSavedJobs(new Set());
      }
    } finally {
      loadingSavedJobsRef.current = false;
    }
  }, [user]);

  // Add a ref to track if saved jobs have been loaded for current jobs
  const savedJobsLoadedRef = useRef<string>('');

  // Separate effect for loading saved jobs after jobs are loaded
  useEffect(() => {
    if (user && jobs.length > 0) {
      const jobIdString = jobs.map(job => job.id).sort().join(',');
      if (savedJobsLoadedRef.current !== jobIdString) {
        savedJobsLoadedRef.current = jobIdString;
        loadSavedJobs(jobs.map(job => job.id));
      }
    }
  }, [jobs, user]); // Removed loadSavedJobs from dependencies to fix infinite loop

  // Fetch jobs when filters or page change - debounced to prevent rapid re-renders
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchJobs();
    }, 300); // Debounce rapid filter changes

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, page]); // Only trigger when filters or page actually change

  // Fetch facets on component mount
  useEffect(() => {
    fetchFacets();
  }, []);

  const fetchFacets = async () => {
    setFacetsLoading(true);
    
    try {
      const response = await apiClient.get('/jobs/jobs/facets/');
      
      if (response.status === 200) {
        const data = response.data;
        setFacets(data);
      }
    } catch (err) {
      console.error('Error fetching facets:', err);
    } finally {
      setFacetsLoading(false);
    }
  };

  const handleFiltersChange = useCallback((newFilters: any) => {
    setPage(1);
    
    // Update URL with search params
    const params = new URLSearchParams();
    
    // Basic search
    if (newFilters.searchTerm) params.set('q', newFilters.searchTerm);
    if (newFilters.location) params.set('location', newFilters.location);
    
    // Multiple selections
    if (newFilters.jobTypes.length) params.set('job_types', newFilters.jobTypes.join(','));
    if (newFilters.experienceLevels.length) params.set('experience_levels', newFilters.experienceLevels.join(','));
    if (newFilters.remoteOptions.length) params.set('remote_options', newFilters.remoteOptions.join(','));
    if (newFilters.companies.length) params.set('companies', newFilters.companies.join(','));
    if (newFilters.industries.length) params.set('industries', newFilters.industries.join(','));
    if (newFilters.skills.length) params.set('skills', newFilters.skills.join(','));
    
    // Salary range
    if (newFilters.salaryRange[0] > 0) params.set('salary_min', newFilters.salaryRange[0].toString());
    if (newFilters.salaryRange[1] < 200000) params.set('salary_max', newFilters.salaryRange[1].toString());
    
    // Other filters
    if (newFilters.datePosted) params.set('date_posted', newFilters.datePosted);
    if (newFilters.featuredOnly) params.set('featured_only', 'true');
    if (!newFilters.excludeExpired) params.set('exclude_expired', 'false');
    if (newFilters.hasDeadline) params.set('has_deadline', 'true');
    if (newFilters.sortBy !== 'created_at') params.set('sort_by', newFilters.sortBy);
    if (newFilters.sortOrder !== 'desc') params.set('sort_order', newFilters.sortOrder);
    
    router.push(`/jobs?${params.toString()}`, undefined, { shallow: true });
  }, [router]);

  const toggleSaveJob = async (jobId: string) => {
    if (!user) return;
    
    try {
      const response = await apiClient.post('/jobs/saved-jobs/toggle/', { job: jobId });

      if (response.status === 200) {
        const data = response.data;
        setSavedJobs(prevSet => {
          const newSet = new Set(prevSet);
          if (data.saved) {
            newSet.add(jobId);
          } else {
            newSet.delete(jobId);
          }
          return newSet;
        });
        // Successfully toggled saved job status
      } else {
        console.error('Failed to toggle saved job');
      }
    } catch (error) {
      console.error('Error toggling saved job:', error);
    }
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.searchTerm) count++;
    if (filters.location) count++;
    if (filters.jobTypes.length) count += filters.jobTypes.length;
    if (filters.experienceLevels.length) count += filters.experienceLevels.length;
    if (filters.remoteOptions.length) count += filters.remoteOptions.length;
    if (filters.companies.length) count += filters.companies.length;
    if (filters.industries.length) count += filters.industries.length;
    if (filters.skills.length) count += filters.skills.length;
    if (filters.datePosted) count++;
    if (filters.featuredOnly) count++;
    if (filters.hasDeadline) count++;
    return count;
  };

  return (
    <ProtectedRoute requireAuth={false}>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h3" component="h1" gutterBottom>
            Find Your Dream Job
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Discover opportunities that match your skills and interests
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {/* Desktop Filters */}
          {!isMobile && (
            <Grid item xs={12} lg={3}>
              <JobFilters
                onFiltersChange={handleFiltersChange}
                facets={facets}
                loading={facetsLoading}
                initialFilters={filters}
              />
            </Grid>
          )}

          {/* Main Content */}
          <Grid item xs={12} lg={isMobile ? 12 : 9}>
            {/* Results Header */}
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" key={`results-${totalCount}-${loading}`}>
                {loading ? 'Loading...' : `${totalCount} jobs found`}
              </Typography>
              
              {/* Mobile Filter Button */}
              {isMobile && (
                <Badge badgeContent={getActiveFiltersCount()} color="primary">
                  <Fab
                    color="primary"
                    size="small"
                    onClick={() => setMobileFiltersOpen(true)}
                    sx={{ mr: 1 }}
                  >
                    <FilterListIcon />
                  </Fab>
                </Badge>
              )}
            </Box>



            {/* Error Message */}
            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            {/* Job Listings */}
            <Grid container spacing={3}>
              {loading ? (
                // Loading skeletons - Fixed keys to prevent re-rendering
                Array.from({ length: 6 }).map((_, index) => (
                  <Grid item xs={12} key={`skeleton-${index}`}>
                    <Paper sx={{ p: 3, borderRadius: 3 }}>
                      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                        <Skeleton variant="circular" width={48} height={48} />
                        <Box sx={{ flex: 1 }}>
                          <Skeleton variant="text" width="60%" height={32} />
                          <Skeleton variant="text" width="40%" height={24} />
                        </Box>
                      </Box>
                      <Skeleton variant="text" width="80%" height={20} />
                      <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                        <Skeleton variant="rectangular" width={80} height={24} />
                        <Skeleton variant="rectangular" width={100} height={24} />
                        <Skeleton variant="rectangular" width={70} height={24} />
                      </Box>
                    </Paper>
                  </Grid>
                ))
              ) : jobs.length === 0 ? (
                <Grid item xs={12}>
                  <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 3 }}>
                    <WorkIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" gutterBottom>
                      No jobs found
                    </Typography>
                    <Typography color="text.secondary">
                      Try adjusting your search criteria or clear filters to see more results.
                    </Typography>
                  </Paper>
                </Grid>
              ) : (
                <>
                  {jobs.map((job, index) => {
                    // Add individual job validation and error handling
                    if (!job || !job.id || !job.title) {
                      console.error(`❌ Invalid job data at index ${index}:`, job);
                      return null;
                    }
                    
                    try {
                      return (
                        <Grid item xs={12} md={6} xl={4} key={job.id}>
                          <JobCard
                            job={job}
                            isSaved={savedJobs.has(job.id)}
                            onSave={user ? toggleSaveJob : undefined}
                            showCompanyLogo={true}
                          />
                        </Grid>
                      );
                    } catch (error) {
                      console.error(`❌ Error rendering JobCard for ${job.title}:`, error);
                      // Fallback to simple card if JobCard fails
                      return (
                        <Grid item xs={12} md={6} xl={4} key={`fallback-${job.id}`}>
                          <Paper sx={{ p: 2, bgcolor: 'error.light', color: 'error.contrastText' }}>
                            <Typography variant="h6">{job.title}</Typography>
                            <Typography variant="body2">{job.company?.name || 'Unknown Company'}</Typography>
                            <Typography variant="caption">Error rendering full job card</Typography>
                          </Paper>
                        </Grid>
                      );
                    }
                  })}
                </>
              )}
            </Grid>

            {/* Pagination */}
            {totalPages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <Pagination
                  count={totalPages}
                  page={page}
                  onChange={(_, newPage) => setPage(newPage)}
                  color="primary"
                  size="large"
                />
              </Box>
            )}
          </Grid>
        </Grid>

        {/* Mobile Filter Drawer */}
        {isMobile && (
          <Drawer
            anchor="bottom"
            open={mobileFiltersOpen}
            onClose={() => setMobileFiltersOpen(false)}
            PaperProps={{
              sx: {
                borderTopLeftRadius: 16,
                borderTopRightRadius: 16,
                maxHeight: '90vh',
              },
            }}
          >
            <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">Filters</Typography>
              <IconButton onClick={() => setMobileFiltersOpen(false)}>
                <CloseIcon />
              </IconButton>
            </Box>
            <Box sx={{ px: 2, pb: 2 }}>
              <JobFilters
                onFiltersChange={(newFilters) => {
                  handleFiltersChange(newFilters);
                  setMobileFiltersOpen(false);
                }}
                facets={facets}
                loading={facetsLoading}
                initialFilters={filters}
              />
            </Box>
          </Drawer>
        )}
      </Container>
    </ProtectedRoute>
  );
};

export default JobsPage; 