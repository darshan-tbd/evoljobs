import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  Alert,
  Paper,
  CircularProgress,
} from '@mui/material';
import { useAuth } from '../../../hooks/useAuth';
import Layout from '@/components/layout/Layout';

interface Job {
  id: number;
  title: string;
  company: {
    name: string;
  };
  slug: string;
}

const JobApplicationPage: React.FC = () => {
  const router = useRouter();
  const { slug } = router.query;
  const { user, isAuthenticated } = useAuth();
  const [submitted, setSubmitted] = useState(false);
  
  // Debug authentication state
  console.log('=== AUTH DEBUG ===');
  console.log('User:', user);
  console.log('Is authenticated:', isAuthenticated);
  console.log('Token in localStorage:', localStorage.getItem('access_token') ? 'Present' : 'Missing');
  console.log('==================');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [job, setJob] = useState<Job | null>(null);
  const [jobLoading, setJobLoading] = useState(true);
  const [formData, setFormData] = useState({
    cover_letter: '',
    expected_salary: '',
    availability_date: '',
  });

  // This will be handled in the render logic below

  // Fetch job details
  useEffect(() => {
    if (slug && typeof slug === 'string') {
      const fetchJob = async () => {
        try {
          setJobLoading(true);
          console.log('Fetching job with slug:', slug);
          
          const response = await fetch(`http://127.0.0.1:8000/api/v1/jobs/jobs/?slug=${slug}`, {
            headers: {
              'Content-Type': 'application/json',
            },
          });
          
          console.log('Job fetch response status:', response.status);
          
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          const data = await response.json();
          console.log('Job fetch response data:', data);
          
          if (data.results && data.results.length > 0) {
            setJob(data.results[0]);
            console.log('Job data loaded:', data.results[0]);
          } else {
            console.log('No job found with slug:', slug);
            setError('Job not found. Please check the URL and try again.');
          }
        } catch (err) {
          console.error('Error fetching job:', err);
          setError('Failed to load job details. Please try again.');
        } finally {
          setJobLoading(false);
        }
      };
      
      fetchJob();
    }
  }, [slug]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!job || !user) {
      setError('Missing job or user information. Please try again.');
      return;
    }

    // Check if user is authenticated
    if (!isAuthenticated) {
      setError('You must be logged in to apply for jobs.');
      router.push('/login?redirect=' + encodeURIComponent(router.asPath));
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const applicationPayload = {
        job: job.id,
        cover_letter: formData.cover_letter,
        expected_salary: formData.expected_salary ? parseFloat(formData.expected_salary) : null,
        availability_date: formData.availability_date || null,
      };

      console.log('=== JOB APPLICATION DEBUG ===');
      console.log('Job slug from URL:', slug);
      console.log('Job data:', job);
      console.log('Job ID being sent:', job.id);
      console.log('Application payload:', applicationPayload);
      console.log('User:', user?.email);
      console.log('Is authenticated:', isAuthenticated);
      console.log('=============================');
      
      const token = localStorage.getItem('access_token');
      if (!token) {
        setError('No authentication token found. Please log in again.');
        router.push('/login?redirect=' + encodeURIComponent(router.asPath));
        return;
      }
      
      const response = await fetch('http://127.0.0.1:8000/api/v1/applications/applications/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(applicationPayload),
      });
      
      console.log('Application submission response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        // Handle authentication errors specifically
        if (response.status === 401) {
          setError('Your session has expired. Please log in again.');
          // Clear invalid tokens
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          router.push('/login?redirect=' + encodeURIComponent(router.asPath));
          return;
        }
        
        throw new Error(errorData.detail || errorData.message || `HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Application submitted successfully:', data);
      
      setSubmitted(true);
    } catch (err: any) {
      console.error('Error submitting application:', err);
      setError(err.message || 'Failed to submit application. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Redirect to login if not authenticated
  if (!isAuthenticated || !user) {
    router.push('/login?redirect=' + encodeURIComponent(router.asPath));
    return null;
  }

  // Success page
  if (submitted) {
    return (
      <Layout>
        <Container maxWidth="md" sx={{ py: 4 }}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 6 }}>
              <Typography variant="h4" gutterBottom color="primary">
                Application Submitted Successfully!
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                Thank you for your interest in this position. We will review your application and get back to you soon.
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                <Button
                  variant="contained"
                  onClick={() => router.push('/jobs')}
                >
                  Back to Jobs
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => router.push('/dashboard')}
                >
                  Go to Dashboard
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Container>
      </Layout>
    );
  }

  return (
    <Layout>
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h4" gutterBottom>
            Apply for Position
          </Typography>
          
          {jobLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : job ? (
            <Card sx={{ mb: 3, backgroundColor: '#f5f5f5' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {job.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {job.company?.name} • Job ID: {job.id}
                </Typography>
              </CardContent>
            </Card>
          ) : (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error || 'Job not found'}
            </Alert>
          )}
          
          {!jobLoading && job && (
            <>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                Please fill out the form below to apply for this position.
              </Typography>

              <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
                {error && (
                  <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                  </Alert>
                )}
                
                {!isAuthenticated && (
                  <Alert severity="warning" sx={{ mb: 3 }}>
                    You must be logged in to apply for jobs. Please{' '}
                    <Button
                      size="small"
                      onClick={() => router.push('/login?redirect=' + encodeURIComponent(router.asPath))}
                    >
                      log in
                    </Button>
                    {' '}to continue.
                  </Alert>
                )}
                
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  name="cover_letter"
                  label="Cover Letter"
                  value={formData.cover_letter}
                  onChange={handleChange}
                  required
                  sx={{ mb: 3 }}
                  placeholder="Tell us why you're interested in this position and what makes you a great fit..."
                />
                
                <TextField
                  fullWidth
                  name="expected_salary"
                  label="Expected Salary"
                  type="number"
                  value={formData.expected_salary}
                  onChange={handleChange}
                  sx={{ mb: 3 }}
                  placeholder="Enter your expected annual salary"
                />
                
                <TextField
                  fullWidth
                  name="availability_date"
                  label="Availability Date"
                  type="date"
                  value={formData.availability_date}
                  onChange={handleChange}
                  InputLabelProps={{ shrink: true }}
                  sx={{ mb: 3 }}
                />

                <Box sx={{ display: 'flex', gap: 2, mt: 4 }}>
                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    disabled={loading}
                    sx={{ minWidth: 120 }}
                  >
                    {loading ? <CircularProgress size={24} /> : 'Submit Application'}
                  </Button>
                  <Button
                    variant="outlined"
                    size="large"
                    onClick={() => router.back()}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                </Box>
              </Box>
            </>
          )}
        </Paper>
      </Container>
    </Layout>
  );
};

export default JobApplicationPage; 