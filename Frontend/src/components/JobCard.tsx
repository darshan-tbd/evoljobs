import React, { memo } from 'react';
import { useRouter } from 'next/router';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Chip,
  Box,
  Avatar,
  IconButton,
  Tooltip,
  Stack,
  useTheme,
  alpha,
} from '@mui/material';
import {
  LocationOn as LocationIcon,
  AccessTime as TimeIcon,
  AttachMoney as SalaryIcon,
  Business as BusinessIcon,
  Work as WorkIcon,
  Star as StarIcon,
  Bookmark as BookmarkIcon,
  BookmarkBorder as BookmarkBorderIcon,
  Schedule as ScheduleIcon,
  Trending as TrendingIcon,
  NewReleases as NewIcon,
  Warning as UrgentIcon,
  Launch as LaunchIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';

interface JobCardProps {
  job: {
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
    external_url?: string;
  };
  isSaved?: boolean;
  onSave?: (jobId: string) => void;
  onApply?: (jobId: string) => void;
  showCompanyLogo?: boolean;
  compact?: boolean;
}

const JobCard: React.FC<JobCardProps> = memo(({
  job,
  isSaved = false,
  onSave,
  onApply,
  showCompanyLogo = true,
  compact = false,
}) => {
  const router = useRouter();
  const theme = useTheme();

  // Validate job data at the start
  if (!job) {
    console.error('JobCard: No job data provided');
    return null;
  }

  if (!job.id) {
    console.error('JobCard: Job missing ID', job);
    return null;
  }

  if (!job.title) {
    console.error('JobCard: Job missing title', job);
    return null;
  }

  if (!job.company) {
    console.error('JobCard: Job missing company data', job);
    return null;
  }

  const formatJobType = (type: string) => {
    return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const formatSalary = (min?: number, max?: number) => {
    if (!min && !max) return null;
    if (min && max && min !== max) {
      return `$${(min / 1000).toFixed(0)}K - $${(max / 1000).toFixed(0)}K`;
    }
    return `$${((min || max)! / 1000).toFixed(0)}K`;
  };

  const getStatusChips = () => {
    const chips = [];
    
    if (job.is_featured) {
      chips.push(
        <Chip
          key="featured"
          icon={<StarIcon sx={{ fontSize: 14 }} />}
          label="Featured"
          color="primary"
          size="small"
          sx={{ fontWeight: 600 }}
        />
      );
    }
    
    if (job.is_recent) {
      chips.push(
        <Chip
          key="new"
          icon={<NewIcon sx={{ fontSize: 14 }} />}
          label="New"
          color="success"
          size="small"
          sx={{ fontWeight: 600 }}
        />
      );
    }
    
    if (job.is_trending) {
      chips.push(
        <Chip
          key="trending"
          icon={<TrendingIcon sx={{ fontSize: 14 }} />}
          label="Trending"
          color="secondary"
          size="small"
          sx={{ fontWeight: 600 }}
        />
      );
    }
    
    if (job.is_urgent) {
      chips.push(
        <Chip
          key="urgent"
          icon={<UrgentIcon sx={{ fontSize: 14 }} />}
          label="Urgent"
          color="warning"
          size="small"
          sx={{ fontWeight: 600 }}
        />
      );
    }
    
    return chips;
  };

  const handleViewDetails = () => {
    router.push(`/jobs/${job.slug}`);
  };

  const handleApply = () => {
    if (onApply) {
      onApply(job.id);
    } else {
      // Check for external application URLs first
      const applicationUrl = job.application_url || job.external_url;
      
      if (applicationUrl && applicationUrl.trim() !== '') {
        try {
          // Ensure URL has proper protocol
          const url = applicationUrl.startsWith('http') 
            ? applicationUrl 
            : `https://${applicationUrl}`;
          window.open(url, '_blank', 'noopener,noreferrer');
        } catch (error) {
          console.error('Invalid application URL:', applicationUrl);
          // Fallback to internal apply page
          router.push(`/jobs/${job.slug}/apply`);
        }
      } else {
        // Fallback to internal apply page
        router.push(`/jobs/${job.slug}/apply`);
      }
    }
  };

  const handleSave = () => {
    if (onSave) {
      onSave(job.id);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      // Remove whileHover to prevent cursor conflicts
    >
      <Card
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          borderRadius: 3,
          border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
          transition: 'all 0.3s ease-in-out',
          '&:hover': {
            boxShadow: theme.shadows[8],
            borderColor: theme.palette.primary.main,
          },
        }}
      >
        {/* Status indicators */}
        <Box sx={{ position: 'absolute', top: 12, right: 12, zIndex: 1 }}>
          <Stack direction="row" spacing={0.5}>
            {getStatusChips()}
          </Stack>
        </Box>

        <CardContent sx={{ flex: 1, p: 3 }}>
          {/* Company and Job Title */}
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
            {showCompanyLogo && (
              <Avatar
                src={job.company.logo}
                alt={job.company.name}
                sx={{
                  width: 48,
                  height: 48,
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                }}
              >
                {job.company.name.charAt(0)}
              </Avatar>
            )}
            
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="h6"
                component="h3"
                sx={{
                  fontWeight: 600,
                  mb: 0.5,
                  cursor: 'pointer',
                  '&:hover': {
                    color: theme.palette.primary.main,
                  },
                }}
                onClick={handleViewDetails}
              >
                {job.title}
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <BusinessIcon fontSize="small" color="primary" />
                <Typography
                  variant="body2"
                  color="primary"
                  sx={{
                    fontWeight: 500,
                    cursor: 'pointer',
                    '&:hover': {
                      textDecoration: 'underline',
                    },
                  }}
                >
                  {job.company.name}
                </Typography>
                {job.company.website && (
                  <Tooltip title="Visit company website">
                    <IconButton
                      size="small"
                      onClick={() => window.open(job.company.website, '_blank')}
                    >
                      <LaunchIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
            </Box>
            
            {onSave && (
              <Tooltip title={isSaved ? 'Remove from saved' : 'Save job'}>
                <IconButton
                  onClick={handleSave}
                  color={isSaved ? 'primary' : 'default'}
                  sx={{
                    '&:hover': {
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                    },
                  }}
                >
                  {isSaved ? <BookmarkIcon /> : <BookmarkBorderIcon />}
                </IconButton>
              </Tooltip>
            )}
          </Box>

          {/* Job Details */}
          <Box sx={{ mb: 2 }}>
            <Stack direction="row" spacing={2} sx={{ mb: 1, flexWrap: 'wrap', gap: 1 }}>
              {job.location && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <LocationIcon fontSize="small" color="secondary" />
                  <Typography variant="body2" color="text.secondary">
                    {job.location.city ? `${job.location.city}, ${job.location.state}` : job.location.name}
                  </Typography>
                </Box>
              )}
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <TimeIcon fontSize="small" color="secondary" />
                <Typography variant="body2" color="text.secondary">
                  {job.time_since_posted || new Date(job.created_at).toLocaleDateString()}
                </Typography>
              </Box>
              
              {job.application_deadline && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <ScheduleIcon fontSize="small" color="warning" />
                  <Typography variant="body2" color="warning.main">
                    Deadline: {new Date(job.application_deadline).toLocaleDateString()}
                  </Typography>
                </Box>
              )}
            </Stack>
          </Box>

          {/* Description */}
          {!compact && job.description && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                mb: 2,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                lineHeight: 1.5,
              }}
            >
              {job.description.replace(/<[^>]*>/g, '').substring(0, 150)}...
            </Typography>
          )}

          {/* Tags and Chips */}
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
            <Chip
              label={formatJobType(job.job_type)}
              size="small"
              variant="outlined"
              color="primary"
            />
            <Chip
              label={formatJobType(job.experience_level)}
              size="small"
              variant="outlined"
            />
            <Chip
              label={formatJobType(job.remote_option)}
              size="small"
              variant="outlined"
              color="secondary"
            />
            
            {job.salary_display && (
              <Chip
                icon={<SalaryIcon sx={{ fontSize: 14 }} />}
                label={job.salary_display}
                size="small"
                variant="outlined"
                color="success"
              />
            )}
            
            {job.industry && (
              <Chip
                label={job.industry.name}
                size="small"
                variant="outlined"
                color="info"
              />
            )}
          </Box>

          {/* Skills */}
          {job.required_skills && job.required_skills.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                Required Skills:
              </Typography>
              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                {job.required_skills.slice(0, 5).map((skill) => (
                  <Chip
                    key={skill.id}
                    label={skill.name}
                    size="small"
                    variant="outlined"
                    sx={{
                      fontSize: '0.75rem',
                      height: 24,
                      borderRadius: 1,
                      bgcolor: alpha(theme.palette.primary.main, 0.05),
                      borderColor: alpha(theme.palette.primary.main, 0.3),
                    }}
                  />
                ))}
                {job.required_skills.length > 5 && (
                  <Chip
                    label={`+${job.required_skills.length - 5} more`}
                    size="small"
                    variant="outlined"
                    sx={{
                      fontSize: '0.75rem',
                      height: 24,
                      borderRadius: 1,
                    }}
                  />
                )}
              </Box>
            </Box>
          )}

          {/* Job Stats */}
          {(job.views_count || job.applications_count) && (
            <Box sx={{ display: 'flex', gap: 2, mt: 'auto' }}>
              {job.views_count && (
                <Typography variant="caption" color="text.secondary">
                  {job.views_count} views
                </Typography>
              )}
              {job.applications_count && (
                <Typography variant="caption" color="text.secondary">
                  {job.applications_count} applications
                </Typography>
              )}
            </Box>
          )}
        </CardContent>

        <CardActions sx={{ p: 3, pt: 0 }}>
          <Button
            variant="outlined"
            onClick={handleViewDetails}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 500,
              flex: 1,
            }}
          >
            View Details
          </Button>
          <Button
            variant="contained"
            onClick={handleApply}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              flex: 1,
            }}
          >
            Apply Now
          </Button>
        </CardActions>
      </Card>
    </motion.div>
  );
});

JobCard.displayName = 'JobCard';

export default JobCard; 