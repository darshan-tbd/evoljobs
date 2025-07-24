import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/hooks/useAuth';
import { motion } from 'framer-motion';
import { 
  MapPinIcon,
  BuildingOfficeIcon,
  CurrencyDollarIcon,
  BriefcaseIcon,
  ClockIcon,
  CalendarIcon,
  UserIcon,
  GlobeAltIcon,
  BookmarkIcon,
  ShareIcon,
  ArrowLeftIcon,
  EyeIcon,
  CheckCircleIcon,
  AcademicCapIcon,
  CogIcon,
  HeartIcon
} from '@heroicons/react/24/outline';
import { 
  BookmarkIcon as BookmarkSolidIcon,
  HeartIcon as HeartSolidIcon
} from '@heroicons/react/24/solid';
import Layout from '@/components/layout/Layout';
import { apiClient } from '@/services/authAPI';

interface Job {
  id: string;
  title: string;
  slug: string;
  company: {
    id: string;
    name: string;
    description?: string;
    website?: string;
    logo?: string;
    industry?: {
      name: string;
    };
  };
  location: {
    name: string;
    city?: string;
    state?: string;
    country?: string;
  };
  description: string;
  job_type: string;
  experience_level: string;
  remote_option: string;
  salary_min?: number;
  salary_max?: number;
  salary_currency?: string;
  salary_type?: string;
  external_url?: string;
  required_skills?: Array<{ id: number; name: string }>;
  preferred_skills?: Array<{ id: number; name: string }>;
  created_at: string;
  updated_at: string;
  application_deadline?: string;
  is_featured?: boolean;
  views_count?: number;
  applications_count?: number;
  requirements?: string;
  benefits?: string;
  responsibilities?: string;
}

const JobDetailsPage: React.FC = () => {
  const router = useRouter();
  const { slug } = router.query;
  const { isAuthenticated, user } = useAuth();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);

  const jobTypes = {
    'full_time': 'Full Time',
    'part_time': 'Part Time',
    'contract': 'Contract',
    'internship': 'Internship',
    'freelance': 'Freelance'
  };

  const experienceLevels = {
    'entry': 'Entry Level',
    'junior': 'Junior',
    'mid': 'Mid Level',
    'senior': 'Senior',
    'lead': 'Lead',
    'executive': 'Executive'
  };

  const remoteOptions = {
    'onsite': 'On-site',
    'remote': 'Remote',
    'hybrid': 'Hybrid'
  };

  useEffect(() => {
    if (slug) {
      fetchJobDetails();
    }
  }, [slug]);

  const fetchJobDetails = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await apiClient.get(`/jobs/jobs/${slug}/`);
      console.log('Job details response:', response.data);
      setJob(response.data);
    } catch (err: any) {
      console.error('Error fetching job details:', err);
      setError(err.message || 'Failed to fetch job details');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    // Check if user is authenticated first
    if (!isAuthenticated) {
      // Redirect to login page with current page as redirect parameter
      router.push(`/login?redirect=${encodeURIComponent(router.asPath)}`);
      return;
    }

    if (job?.external_url) {
      window.open(job.external_url, '_blank');
    } else {
      router.push(`/jobs/${job?.slug}/apply`);
    }
  };

  const handleSaveJob = () => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    setIsSaved(!isSaved);
    // TODO: Implement save job API call
  };

  const handleLikeJob = () => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    setIsLiked(!isLiked);
    // TODO: Implement like job API call
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: job?.title,
        text: `Check out this job: ${job?.title} at ${job?.company.name}`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      // TODO: Show toast notification
    }
  };

  const formatSalary = (job: Job) => {
    if (!job.salary_min && !job.salary_max) return 'Salary not specified';
    
    const currency = job.salary_currency || 'USD';
    const type = job.salary_type || 'yearly';
    
    if (job.salary_min && job.salary_max) {
      return `${currency} ${job.salary_min.toLocaleString()} - ${job.salary_max.toLocaleString()} / ${type}`;
    } else if (job.salary_min) {
      return `${currency} ${job.salary_min.toLocaleString()}+ / ${type}`;
    } else if (job.salary_max) {
      return `${currency} Up to ${job.salary_max.toLocaleString()} / ${type}`;
    }
    
    return 'Salary not specified';
  };
  

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays - 1} days ago`;
    return date.toLocaleDateString();
  };

  const formatDeadline = (dateString: string) => {
    const deadline = new Date(dateString);
    const now = new Date();
    const diffTime = deadline.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'Application closed';
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays <= 7) return `${diffDays} days left`;
    return deadline.toLocaleDateString();
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-6 bg-gray-200 rounded w-1/2 mb-8"></div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                </div>
                <div className="space-y-4">
                  <div className="h-32 bg-gray-200 rounded"></div>
                  <div className="h-16 bg-gray-200 rounded"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !job) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="text-red-600 mb-4">{error || 'Job not found'}</div>
            <button
              onClick={() => router.back()}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go Back
            </button>
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
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <button
                onClick={() => router.back()}
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeftIcon className="h-5 w-5 mr-2" />
                Back to Jobs
              </button>
              
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleShare}
                  className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                  title="Share job"
                >
                  <ShareIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={handleLikeJob}
                  className={`p-2 transition-colors ${
                    isLiked ? 'text-red-500' : 'text-gray-400 hover:text-red-500'
                  }`}
                  title={isLiked ? 'Unlike job' : 'Like job'}
                >
                  {isLiked ? <HeartSolidIcon className="h-5 w-5" /> : <HeartIcon className="h-5 w-5" />}
                </button>
                <button
                  onClick={handleSaveJob}
                  className={`p-2 transition-colors ${
                    isSaved ? 'text-blue-600' : 'text-gray-400 hover:text-blue-600'
                  }`}
                  title={isSaved ? 'Remove from saved' : 'Save job'}
                >
                  {isSaved ? <BookmarkSolidIcon className="h-5 w-5" /> : <BookmarkIcon className="h-5 w-5" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="grid grid-cols-1 lg:grid-cols-4 gap-8"
          >
            {/* Main Content */}
            <div className="lg:col-span-3">
              {/* Job Header */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                {job.is_featured && (
                  <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mb-4">
                    ⭐ Featured Job
                  </div>
                )}
                
                <h1 className="text-4xl font-bold text-gray-900 mb-4">{job.title}</h1>
                
                <div className="flex items-center text-gray-600 mb-4">
                  <BuildingOfficeIcon className="h-6 w-6 mr-2" />
                  <span className="font-medium text-lg">{job.company.name}</span>
                  {job.company.industry && (
                    <>
                      <span className="mx-2">•</span>
                      <span className="text-lg">{job.company.industry.name}</span>
                    </>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-6 text-base text-gray-600 mb-6">
                  <div className="flex items-center">
                    <MapPinIcon className="h-4 w-4 mr-1" />
                    <span>{job.location.name}</span>
                  </div>
                  <div className="flex items-center">
                    <BriefcaseIcon className="h-4 w-4 mr-1" />
                    <span>{jobTypes[job.job_type as keyof typeof jobTypes]}</span>
                  </div>
                  <div className="flex items-center">
                    <UserIcon className="h-4 w-4 mr-1" />
                    <span>{experienceLevels[job.experience_level as keyof typeof experienceLevels]}</span>
                  </div>
                  <div className="flex items-center">
                    <GlobeAltIcon className="h-4 w-4 mr-1" />
                    <span>{remoteOptions[job.remote_option as keyof typeof remoteOptions]}</span>
                  </div>
                  <div className="flex items-center">
                    <ClockIcon className="h-4 w-4 mr-1" />
                    <span>Posted {formatDate(job.created_at)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center text-gray-600">
                    <CurrencyDollarIcon className="h-6 w-6 mr-2" />
                    <span className="font-medium text-lg">{formatSalary(job)}</span>
                  </div>
                  
                  {job.views_count !== undefined && (
                    <div className="flex items-center text-base text-gray-500">
                      <EyeIcon className="h-5 w-5 mr-1" />
                      {job.views_count} views
                    </div>
                  )}
                </div>
              </div>

              {/* Job Description */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-6">
                <h2 className="text-2xl font-semibold text-gray-900 mb-6">Job Description</h2>
                <div className="prose prose-gray max-w-none">
                  <div className={`text-gray-700 leading-relaxed text-lg ${!showFullDescription && 'line-clamp-6'}`}>
                    {job.description}
                  </div>
                  {job.description.length > 300 && (
                    <button
                      onClick={() => setShowFullDescription(!showFullDescription)}
                      className="text-blue-600 hover:text-blue-700 font-medium mt-2"
                    >
                      {showFullDescription ? 'Show less' : 'Read more'}
                    </button>
                  )}
                </div>
              </div>

              {/* Requirements */}
              {job.requirements && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-6">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center">
                    <CheckCircleIcon className="h-6 w-6 mr-3 text-blue-600" />
                    Requirements
                  </h2>
                  <div className="prose prose-gray max-w-none">
                    <div className="text-gray-700 leading-relaxed text-lg whitespace-pre-wrap">
                      {job.requirements}
                    </div>
                  </div>
                </div>
              )}

              {/* Responsibilities */}
              {job.responsibilities && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-6">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center">
                    <CogIcon className="h-6 w-6 mr-3 text-blue-600" />
                    Responsibilities
                  </h2>
                  <div className="prose prose-gray max-w-none">
                    <div className="text-gray-700 leading-relaxed text-lg whitespace-pre-wrap">
                      {job.responsibilities}
                    </div>
                  </div>
                </div>
              )}

              {/* Benefits */}
              {job.benefits && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-6">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center">
                    <HeartIcon className="h-6 w-6 mr-3 text-blue-600" />
                    Benefits
                  </h2>
                  <div className="prose prose-gray max-w-none">
                    <div className="text-gray-700 leading-relaxed text-lg whitespace-pre-wrap">
                      {job.benefits}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Apply Card */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 sticky top-6">
                <button
                  onClick={handleApply}
                  className="w-full bg-blue-600 text-white py-4 px-6 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors mb-6 text-lg"
                >
                  Apply Now
                </button>
                
                {job.application_deadline && (
                  <div className="flex items-center text-base text-gray-600 mb-4">
                    <CalendarIcon className="h-5 w-5 mr-2" />
                    <span>Deadline: {formatDeadline(job.application_deadline)}</span>
                  </div>
                )}

                {job.applications_count !== undefined && (
                  <div className="text-base text-gray-600 mb-4">
                    {job.applications_count} applications received
                  </div>
                )}

                <div className="border-t border-gray-200 pt-6">
                  <h3 className="font-medium text-gray-900 mb-4 text-lg">Job Overview</h3>
                  <div className="space-y-3 text-base">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Job Type:</span>
                      <span className="font-medium">{jobTypes[job.job_type as keyof typeof jobTypes]}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Experience:</span>
                      <span className="font-medium">{experienceLevels[job.experience_level as keyof typeof experienceLevels]}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Work Type:</span>
                      <span className="font-medium">{remoteOptions[job.remote_option as keyof typeof remoteOptions]}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Posted:</span>
                      <span className="font-medium">{formatDate(job.created_at)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Company Info */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                <h3 className="font-medium text-gray-900 mb-4 text-lg">About {job.company.name}</h3>
                {job.company.description ? (
                  <p className="text-gray-600 text-base mb-4">{job.company.description}</p>
                ) : (
                  <p className="text-gray-600 text-base mb-4">No company description available.</p>
                )}
                
                {job.company.website && (
                                  <a
                  href={job.company.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700 text-base font-medium"
                >
                  Visit Company Website →
                </a>
                )}
              </div>

              {/* Skills */}
              {(job.required_skills?.length || job.preferred_skills?.length) && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                  <h3 className="font-medium text-gray-900 mb-4 flex items-center text-lg">
                    <AcademicCapIcon className="h-5 w-5 mr-2" />
                    Skills
                  </h3>
                  
                  {job.required_skills && job.required_skills.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-base font-medium text-gray-700 mb-3">Required Skills</h4>
                      <div className="flex flex-wrap gap-2">
                        {job.required_skills.map((skill) => (
                          <span
                            key={skill.id}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                          >
                            {skill.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {job.preferred_skills && job.preferred_skills.length > 0 && (
                    <div>
                      <h4 className="text-base font-medium text-gray-700 mb-3">Preferred Skills</h4>
                      <div className="flex flex-wrap gap-2">
                        {job.preferred_skills.map((skill) => (
                          <span
                            key={skill.id}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                          >
                            {skill.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
};

export default JobDetailsPage; 