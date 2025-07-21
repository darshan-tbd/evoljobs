import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Button,
  Alert,
  LinearProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Paper,
  Tabs,
  Tab,
  Avatar,
  Skeleton,
} from '@mui/material';
import {
  Work as WorkIcon,
  Business as BusinessIcon,
  LocationOn as LocationIcon,
  AccessTime as TimeIcon,
  AttachMoney as SalaryIcon,
  Assessment as AssessmentIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Cancel as CancelIcon,
  Visibility as VisibilityIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';
import Layout from '../components/Layout';
import ProtectedRoute from '../components/ProtectedRoute';

interface Application {
  id: number;
  job: {
    id: number;
    title: string;
    slug: string;
    company: {
      name: string;
    };
    location?: {
      name: string;
    };
    salary_min?: number;
    salary_max?: number;
    salary_currency: string;
  };
  status: string;
  cover_letter: string;
  expected_salary?: number;
  availability_date?: string;
  applied_at: string;
  reviewed_at?: string;
  employer_notes?: string;
}

const ApplicationsPage: React.FC = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTab, setSelectedTab] = useState(0);

  const statusColors = {
    pending: 'warning',
    reviewing: 'info',
    shortlisted: 'primary',
    interviewed: 'secondary',
    offered: 'success',
    hired: 'success',
    rejected: 'error',
    withdrawn: 'default',
  } as const;

  const statusIcons = {
    pending: <ScheduleIcon />,
    reviewing: <AssessmentIcon />,
    shortlisted: <CheckCircleIcon />,
    interviewed: <CheckCircleIcon />,
    offered: <CheckCircleIcon />,
    hired: <CheckCircleIcon />,
    rejected: <CancelIcon />,
    withdrawn: <CancelIcon />,
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      setError('');
      
      const token = localStorage.getItem('access_token');
      if (!token) {
        setError('Please log in to view your applications');
        return;
      }

      const response = await fetch('http://127.0.0.1:8000/api/v1/applications/applications/', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          setError('Your session has expired. Please log in again.');
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          router.push('/login');
          return;
        }
        throw new Error('Failed to fetch applications');
      }

      const data = await response.json();
      setApplications(data.results || data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load applications');
      console.error('Error fetching applications:', err);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredApplications = () => {
    switch (selectedTab) {
      case 0: // All
        return applications;
      case 1: // Active
        return applications.filter(app => 
          ['pending', 'reviewing', 'shortlisted', 'interviewed'].includes(app.status)
        );
      case 2: // Completed
        return applications.filter(app => 
          ['hired', 'rejected', 'withdrawn'].includes(app.status)
        );
      default:
        return applications;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatSalary = (min?: number, max?: number, currency = 'USD') => {
    if (!min && !max) return 'Not specified';
    
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
    
    if (min && max) {
      return `${formatter.format(min)} - ${formatter.format(max)}`;
    } else if (min) {
      return `From ${formatter.format(min)}`;
    } else {
      return `Up to ${formatter.format(max!)}`;
    }
  };

  const getStatusProgress = (status: string) => {
    const statusOrder = ['pending', 'reviewing', 'shortlisted', 'interviewed', 'offered', 'hired'];
    const currentIndex = statusOrder.indexOf(status);
    return currentIndex >= 0 ? ((currentIndex + 1) / statusOrder.length) * 100 : 0;
  };

  const withdrawApplication = async (applicationId: number) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`http://127.0.0.1:8000/api/v1/applications/applications/${applicationId}/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'withdrawn' }),
      });

      if (response.ok) {
        fetchApplications(); // Refresh the list
      }
    } catch (error) {
      console.error('Error withdrawing application:', error);
    }
  };

  if (loading) {
    return (
      <Layout>
        <ProtectedRoute>
          <Container maxWidth="lg" sx={{ py: 4 }}>
            <Box sx={{ mb: 4 }}>
              <Skeleton variant="text" width={300} height={40} />
              <Skeleton variant="text" width={500} height={25} />
            </Box>
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} variant="rectangular" height={200} sx={{ mb: 2 }} />
            ))}
          </Container>
        </ProtectedRoute>
      </Layout>
    );
  }

  return (
    <Layout>
      <ProtectedRoute>
        <Container maxWidth="lg" sx={{ py: 4 }}>
          {/* Header */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom>
              My Applications
            </Typography>
            <Typography variant="h6" color="textSecondary">
              Track your job applications and their status
            </Typography>
          </Box>

          {/* Error Display */}
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {/* Filter Tabs */}
          <Paper sx={{ mb: 3 }}>
            <Tabs 
              value={selectedTab} 
              onChange={(_, newValue) => setSelectedTab(newValue)}
              sx={{ px: 2 }}
            >
              <Tab label={`All (${applications.length})`} />
              <Tab label={`Active (${applications.filter(app => 
                ['pending', 'reviewing', 'shortlisted', 'interviewed'].includes(app.status)
              ).length})`} />
              <Tab label={`Completed (${applications.filter(app => 
                ['hired', 'rejected', 'withdrawn'].includes(app.status)
              ).length})`} />
            </Tabs>
          </Paper>

          {/* Applications List */}
          {getFilteredApplications().length === 0 ? (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <WorkIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                No applications found
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                {selectedTab === 0 
                  ? "You haven't applied to any jobs yet." 
                  : "No applications match the selected filter."}
              </Typography>
              <Button
                variant="contained"
                onClick={() => router.push('/jobs')}
                startIcon={<WorkIcon />}
              >
                Browse Jobs
              </Button>
            </Paper>
          ) : (
            <Grid container spacing={3}>
              {getFilteredApplications().map((application) => (
                <Grid item xs={12} key={application.id}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="h6" gutterBottom>
                            {application.job.title}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <BusinessIcon fontSize="small" color="primary" />
                              <Typography variant="body2">{application.job.company.name}</Typography>
                            </Box>
                            {application.job.location && (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <LocationIcon fontSize="small" color="primary" />
                                <Typography variant="body2">{application.job.location.name}</Typography>
                              </Box>
                            )}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <TimeIcon fontSize="small" color="primary" />
                              <Typography variant="body2">Applied {formatDate(application.applied_at)}</Typography>
                            </Box>
                          </Box>
                        </Box>
                        
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Chip
                            icon={statusIcons[application.status as keyof typeof statusIcons]}
                            label={application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                            color={statusColors[application.status as keyof typeof statusColors]}
                            variant="outlined"
                          />
                          <IconButton
                            onClick={() => router.push(`/jobs/${application.job.slug}`)}
                            title="View Job"
                          >
                            <VisibilityIcon />
                          </IconButton>
                          {['pending', 'reviewing'].includes(application.status) && (
                            <IconButton
                              onClick={() => withdrawApplication(application.id)}
                              title="Withdraw Application"
                              color="error"
                            >
                              <DeleteIcon />
                            </IconButton>
                          )}
                        </Box>
                      </Box>

                      {/* Progress Bar */}
                      <Box sx={{ mb: 2 }}>
                        <LinearProgress
                          variant="determinate"
                          value={getStatusProgress(application.status)}
                          color={statusColors[application.status as keyof typeof statusColors]}
                          sx={{ height: 8, borderRadius: 4 }}
                        />
                      </Box>

                      {/* Application Details */}
                      <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                          <Typography variant="body2" color="textSecondary" gutterBottom>
                            Expected Salary
                          </Typography>
                          <Typography variant="body1">
                            {application.expected_salary 
                              ? `$${application.expected_salary.toLocaleString()}`
                              : 'Not specified'}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <Typography variant="body2" color="textSecondary" gutterBottom>
                            Availability Date
                          </Typography>
                          <Typography variant="body1">
                            {application.availability_date 
                              ? formatDate(application.availability_date)
                              : 'Not specified'}
                          </Typography>
                        </Grid>
                        {application.job.salary_min || application.job.salary_max ? (
                          <Grid item xs={12} md={6}>
                            <Typography variant="body2" color="textSecondary" gutterBottom>
                              Job Salary Range
                            </Typography>
                            <Typography variant="body1">
                              {formatSalary(
                                application.job.salary_min,
                                application.job.salary_max,
                                application.job.salary_currency
                              )}
                            </Typography>
                          </Grid>
                        ) : null}
                        {application.reviewed_at && (
                          <Grid item xs={12} md={6}>
                            <Typography variant="body2" color="textSecondary" gutterBottom>
                              Last Reviewed
                            </Typography>
                            <Typography variant="body1">
                              {formatDate(application.reviewed_at)}
                            </Typography>
                          </Grid>
                        )}
                      </Grid>

                      {/* Cover Letter Preview */}
                      {application.cover_letter && (
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="body2" color="textSecondary" gutterBottom>
                            Cover Letter Preview
                          </Typography>
                          <Typography variant="body2" sx={{ 
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical'
                          }}>
                            {application.cover_letter}
                          </Typography>
                        </Box>
                      )}

                      {/* Employer Notes */}
                      {application.employer_notes && (
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="body2" color="textSecondary" gutterBottom>
                            Employer Notes
                          </Typography>
                          <Alert severity="info">
                            {application.employer_notes}
                          </Alert>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Container>
      </ProtectedRoute>
    </Layout>
  );
};

export default ApplicationsPage; 