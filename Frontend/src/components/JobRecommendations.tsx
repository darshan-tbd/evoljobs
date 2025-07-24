import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  CircularProgress,
  Alert,
  Button,
  Stack,
  LinearProgress,
  Tooltip,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Psychology as AIIcon,
  TrendingUp as TrendingIcon,
  Star as StarIcon,
  Lightbulb as TipIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';
import JobCard from './JobCard';

interface JobRecommendation {
  id: string;
  title: string;
  slug: string;
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
  job_type: string;
  experience_level: string;
  remote_option: string;
  salary_display?: string;
  external_url?: string;
  required_skills?: Array<{
    id: string;
    name: string;
    category?: string;
  }>;
  match_score: number;
  match_breakdown: {
    skills: number;
    experience: number;
    location: number;
    job_type: number;
    industry: number;
  };
  match_explanation: string;
  is_featured?: boolean;
  is_recent?: boolean;
  is_trending?: boolean;
  is_urgent?: boolean;
  created_at: string;
}

interface ProfileCompleteness {
  completeness: number;
  missing_fields: string[];
  recommendations: string[];
  can_get_recommendations: boolean;
}

const JobRecommendations: React.FC = () => {
  const { user } = useAuth();
  const theme = useTheme();
  
  const [recommendations, setRecommendations] = useState<JobRecommendation[]>([]);
  const [profileCompleteness, setProfileCompleteness] = useState<ProfileCompleteness | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user) {
      loadRecommendations();
      loadProfileCompleteness();
    }
  }, [user]);

  const loadRecommendations = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch('http://127.0.0.1:8000/api/v1/ai/recommended_jobs/?limit=10', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setRecommendations(data.results || []);
      } else {
        setError('Failed to load job recommendations');
      }
    } catch (err) {
      setError('Error loading recommendations');
      console.error('Error loading recommendations:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadProfileCompleteness = async () => {
    if (!user) return;
    
    try {
      const response = await fetch('http://127.0.0.1:8000/api/v1/ai/profile_completeness/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setProfileCompleteness(data);
      }
    } catch (err) {
      console.error('Error loading profile completeness:', err);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadRecommendations();
  };

  const getMatchScoreColor = (score: number) => {
    if (score >= 80) return theme.palette.success.main;
    if (score >= 60) return theme.palette.info.main;
    if (score >= 40) return theme.palette.warning.main;
    return theme.palette.error.main;
  };

  const getMatchScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent Match';
    if (score >= 60) return 'Good Match';
    if (score >= 40) return 'Fair Match';
    return 'Basic Match';
  };

  if (!user) {
    return null;
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AIIcon color="primary" />
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            AI Job Recommendations
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={handleRefresh}
          disabled={refreshing}
          size="small"
        >
          Refresh
        </Button>
      </Box>

      {/* Profile Completeness Card */}
      {profileCompleteness && profileCompleteness.completeness < 100 && (
        <Card sx={{ mb: 3, background: alpha(theme.palette.info.main, 0.05) }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <TipIcon color="info" />
              <Typography variant="h6" color="info.main">
                Improve Your Matches
              </Typography>
            </Box>
            
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Profile Completeness: {profileCompleteness.completeness}%
            </Typography>
            
            <LinearProgress
              variant="determinate"
              value={profileCompleteness.completeness}
              sx={{ mb: 2, height: 8, borderRadius: 4 }}
            />
            
            {profileCompleteness.missing_fields.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
                  Missing Information:
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  {profileCompleteness.missing_fields.map((field) => (
                    <Chip key={field} label={field} size="small" variant="outlined" />
                  ))}
                </Stack>
              </Box>
            )}
            
            {profileCompleteness.recommendations.length > 0 && (
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
                  Recommendations:
                </Typography>
                {profileCompleteness.recommendations.map((rec, index) => (
                  <Typography key={index} variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                    • {rec}
                  </Typography>
                ))}
              </Box>
            )}
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Error State */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* No Recommendations */}
      {!loading && !error && recommendations.length === 0 && (
        <Card sx={{ textAlign: 'center', py: 4 }}>
          <CardContent>
            <AIIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              No Recommendations Yet
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 2 }}>
              Complete your profile to get personalized job recommendations
            </Typography>
            <Button variant="contained" onClick={() => window.location.href = '/profile'}>
              Complete Profile
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Recommendations Grid */}
      {!loading && recommendations.length > 0 && (
        <>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Found {recommendations.length} jobs that match your profile
          </Typography>
          
          <Grid container spacing={3}>
            {recommendations.map((job) => (
              <Grid item xs={12} md={6} lg={4} key={job.id}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                    borderRadius: 3,
                    border: `1px solid ${alpha(getMatchScoreColor(job.match_score), 0.3)}`,
                    '&:hover': {
                      boxShadow: theme.shadows[8],
                    },
                    transition: 'all 0.3s ease-in-out',
                  }}
                >
                  {/* Match Score Badge */}
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 12,
                      right: 12,
                      zIndex: 1,
                    }}
                  >
                    <Tooltip title={job.match_explanation}>
                      <Chip
                        icon={<StarIcon sx={{ fontSize: 16 }} />}
                        label={`${job.match_score}%`}
                        size="small"
                        sx={{
                          bgcolor: getMatchScoreColor(job.match_score),
                          color: 'white',
                          fontWeight: 600,
                        }}
                      />
                    </Tooltip>
                  </Box>

                  <CardContent sx={{ flex: 1, pt: 5 }}>
                    {/* Job Title and Company */}
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                      {job.title}
                    </Typography>
                    <Typography variant="body2" color="primary" sx={{ fontWeight: 500, mb: 2 }}>
                      {job.company.name}
                    </Typography>

                    {/* Match Breakdown */}
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                        {getMatchScoreLabel(job.match_score)}
                      </Typography>
                      
                      <Grid container spacing={1}>
                        <Grid item xs={6}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="caption">Skills</Typography>
                            <Typography variant="caption" sx={{ fontWeight: 500 }}>
                              {job.match_breakdown.skills.toFixed(0)}%
                            </Typography>
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={job.match_breakdown.skills}
                            sx={{ height: 4, borderRadius: 2 }}
                          />
                        </Grid>
                        <Grid item xs={6}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="caption">Experience</Typography>
                            <Typography variant="caption" sx={{ fontWeight: 500 }}>
                              {job.match_breakdown.experience.toFixed(0)}%
                            </Typography>
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={job.match_breakdown.experience}
                            sx={{ height: 4, borderRadius: 2 }}
                          />
                        </Grid>
                      </Grid>
                    </Box>

                    {/* Job Details */}
                    <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap', gap: 1 }}>
                      <Chip label={job.job_type.replace('_', ' ')} size="small" variant="outlined" />
                      <Chip label={job.remote_option} size="small" variant="outlined" color="secondary" />
                      {job.salary_display && (
                        <Chip label={job.salary_display} size="small" variant="outlined" color="success" />
                      )}
                    </Stack>

                    {/* Skills */}
                    {job.required_skills && job.required_skills.length > 0 && (
                      <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                          Required Skills:
                        </Typography>
                        <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                          {job.required_skills.slice(0, 3).map((skill) => (
                            <Chip
                              key={skill.id}
                              label={skill.name}
                              size="small"
                              sx={{
                                fontSize: '0.7rem',
                                height: 20,
                                bgcolor: alpha(theme.palette.primary.main, 0.1),
                                color: 'primary.main',
                              }}
                            />
                          ))}
                          {job.required_skills.length > 3 && (
                            <Chip
                              label={`+${job.required_skills.length - 3}`}
                              size="small"
                              sx={{
                                fontSize: '0.7rem',
                                height: 20,
                              }}
                            />
                          )}
                        </Stack>
                      </Box>
                    )}
                  </CardContent>

                  {/* Actions */}
                  <Box sx={{ p: 2, pt: 0 }}>
                    <Button
                      fullWidth
                      variant="contained"
                      onClick={() => {
                        // Check if external URL exists and is valid
                        if (job.external_url && job.external_url.trim() !== '') {
                          try {
                            // Validate URL format
                            const url = job.external_url.startsWith('http') 
                              ? job.external_url 
                              : `https://${job.external_url}`;
                            window.open(url, '_blank', 'noopener,noreferrer');
                          } catch (error) {
                            console.error('Invalid external URL:', job.external_url);
                            window.location.href = `/jobs/${job.slug}`;
                          }
                        } else {
                          // Fallback to internal job page
                          window.location.href = `/jobs/${job.slug}`;
                        }
                      }}
                      sx={{
                        borderRadius: 2,
                        textTransform: 'none',
                        fontWeight: 600,
                      }}
                    >
                      View Details
                    </Button>
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>
        </>
      )}
    </Box>
  );
};

export default JobRecommendations; 