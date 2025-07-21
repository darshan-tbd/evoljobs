import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Grid,
  Box,
  Chip,
  Divider,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Stack,
} from '@mui/material';
import {
  Business as BusinessIcon,
  LocationOn as LocationIcon,
  Work as WorkIcon,
  Schedule as ScheduleIcon,
  AttachMoney as MoneyIcon,
  CalendarToday as CalendarIcon,
  Visibility as ViewsIcon,
  Person as ApplicationsIcon,
  Star as FeaturedIcon,
} from '@mui/icons-material';

interface Job {
  id: string;
  title: string;
  slug: string;
  company: {
    id: string;
    name: string;
  };
  location: {
    name: string;
    city: string;
    state: string;
    country: string;
  };
  job_type: string;
  experience_level: string;
  remote_option: string;
  salary_min?: number;
  salary_max?: number;
  status: string;
  is_featured: boolean;
  applications_count: number;
  views_count: number;
  created_at: string;
  updated_at: string;
  application_deadline?: string;
  description?: string;
  requirements?: string;
  benefits?: string;
  required_skills?: Array<{ id: string; name: string }>;
  preferred_skills?: Array<{ id: string; name: string }>;
}

interface JobDetailsDialogProps {
  open: boolean;
  onClose: () => void;
  job: Job | null;
}

const JobDetailsDialog: React.FC<JobDetailsDialogProps> = ({ open, onClose, job }) => {
  if (!job) return null;

  const getStatusChip = (status: string) => {
    const statusColors = {
      'draft': 'default',
      'active': 'success',
      'paused': 'warning',
      'closed': 'error',
      'filled': 'info',
    } as const;

    return (
      <Chip
        label={status.charAt(0).toUpperCase() + status.slice(1)}
        color={statusColors[status as keyof typeof statusColors] || 'default'}
        size="small"
      />
    );
  };

  const formatSalary = (min?: number, max?: number) => {
    if (!min && !max) return 'Not specified';
    if (min && max) return `$${min.toLocaleString()} - $${max.toLocaleString()}`;
    return `$${(min || max)!.toLocaleString()}`;
  };

  const formatJobType = (type: string) => {
    return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const formatExperienceLevel = (level: string) => {
    return level.charAt(0).toUpperCase() + level.slice(1) + ' Level';
  };

  const formatRemoteOption = (option: string) => {
    return option.charAt(0).toUpperCase() + option.slice(1);
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="lg" 
      fullWidth
      PaperProps={{ sx: { height: '80vh' } }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5" component="h2">
            Job Details
          </Typography>
          <Stack direction="row" spacing={1}>
            {job.is_featured && (
              <Chip 
                icon={<FeaturedIcon />} 
                label="Featured" 
                color="primary" 
                variant="outlined" 
              />
            )}
            {getStatusChip(job.status)}
          </Stack>
        </Box>
      </DialogTitle>
      
      <DialogContent dividers>
        <Grid container spacing={3}>
          {/* Basic Information */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3, mb: 2 }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <WorkIcon color="primary" />
                Basic Information
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="h4" gutterBottom>
                    {job.title}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <BusinessIcon fontSize="small" />
                    <Typography variant="body1">
                      <strong>Company:</strong> {job.company.name}
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <LocationIcon fontSize="small" />
                    <Typography variant="body1">
                      <strong>Location:</strong> {job.location.city}, {job.location.state}, {job.location.country}
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <WorkIcon fontSize="small" />
                    <Typography variant="body1">
                      <strong>Type:</strong> {formatJobType(job.job_type)}
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <ScheduleIcon fontSize="small" />
                    <Typography variant="body1">
                      <strong>Experience:</strong> {formatExperienceLevel(job.experience_level)}
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <LocationIcon fontSize="small" />
                    <Typography variant="body1">
                      <strong>Remote:</strong> {formatRemoteOption(job.remote_option)}
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <MoneyIcon fontSize="small" />
                    <Typography variant="body1">
                      <strong>Salary:</strong> {formatSalary(job.salary_min, job.salary_max)}
                    </Typography>
                  </Box>
                </Grid>
                
                {job.application_deadline && (
                  <Grid item xs={12} md={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <CalendarIcon fontSize="small" />
                      <Typography variant="body1">
                        <strong>Deadline:</strong> {new Date(job.application_deadline).toLocaleDateString()}
                      </Typography>
                    </Box>
                  </Grid>
                )}
              </Grid>
            </Paper>
          </Grid>

          {/* Statistics */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3, mb: 2 }}>
              <Typography variant="h6" gutterBottom>
                Statistics
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Grid container spacing={3}>
                <Grid item xs={6} md={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <ApplicationsIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                    <Typography variant="h4">{job.applications_count}</Typography>
                    <Typography variant="body2" color="textSecondary">Applications</Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={6} md={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <ViewsIcon sx={{ fontSize: 40, color: 'secondary.main', mb: 1 }} />
                    <Typography variant="h4">{job.views_count}</Typography>
                    <Typography variant="body2" color="textSecondary">Views</Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={6} md={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <CalendarIcon sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
                    <Typography variant="h6">{new Date(job.created_at).toLocaleDateString()}</Typography>
                    <Typography variant="body2" color="textSecondary">Created</Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={6} md={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <CalendarIcon sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
                    <Typography variant="h6">{new Date(job.updated_at).toLocaleDateString()}</Typography>
                    <Typography variant="body2" color="textSecondary">Updated</Typography>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* Job Description */}
          {job.description && (
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Job Description
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                  {job.description}
                </Typography>
              </Paper>
            </Grid>
          )}

          {/* Requirements */}
          {job.requirements && (
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Requirements
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                  {job.requirements}
                </Typography>
              </Paper>
            </Grid>
          )}

          {/* Benefits */}
          {job.benefits && (
            <Grid item xs={12}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Benefits
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                  {job.benefits}
                </Typography>
              </Paper>
            </Grid>
          )}

          {/* Skills */}
          {(job.required_skills?.length || job.preferred_skills?.length) && (
            <Grid item xs={12}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Skills
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                {job.required_skills && job.required_skills.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
                      Required Skills:
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {job.required_skills.map((skill) => (
                        <Chip 
                          key={skill.id} 
                          label={skill.name} 
                          color="primary" 
                          variant="outlined" 
                        />
                      ))}
                    </Box>
                  </Box>
                )}
                
                {job.preferred_skills && job.preferred_skills.length > 0 && (
                  <Box>
                    <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
                      Preferred Skills:
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {job.preferred_skills.map((skill) => (
                        <Chip 
                          key={skill.id} 
                          label={skill.name} 
                          color="secondary" 
                          variant="outlined" 
                        />
                      ))}
                    </Box>
                  </Box>
                )}
              </Paper>
            </Grid>
          )}
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} variant="contained">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default JobDetailsDialog; 