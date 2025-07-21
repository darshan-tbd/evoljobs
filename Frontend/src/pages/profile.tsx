import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  TextField,
  Button,
  Avatar,
  Alert,
  Paper,
  Divider,
  Chip,
  CircularProgress,
} from '@mui/material';
import {
  Person as PersonIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Email as EmailIcon,
  Business as BusinessIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
} from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';
import Layout from '../components/Layout';
import ProtectedRoute from '../components/ProtectedRoute';

const ProfilePage: React.FC = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    location: '',
    bio: '',
    skills: '',
    experience: '',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        phone: user.phone || '',
        location: user.location || '',
        bio: user.bio || '',
        skills: user.skills || '',
        experience: user.experience || '',
      });
    }
  }, [user]);

  // Check for token validity on page load
  useEffect(() => {
    const checkTokenValidity = async () => {
      const token = localStorage.getItem('access_token');
      if (token) {
        try {
          const response = await fetch('http://127.0.0.1:8000/api/v1/auth/profile/', {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
          if (response.status === 401) {
            // Token is invalid, clear it
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            setError('Your session has expired. Redirecting to login...');
            setTimeout(() => {
              router.push('/login?redirect=' + encodeURIComponent(router.asPath));
            }, 2000);
          }
        } catch (err) {
          console.error('Token validation error:', err);
        }
      }
    };

    checkTokenValidity();
  }, [router]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('http://127.0.0.1:8000/api/v1/auth/profile/', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSuccess('Profile updated successfully!');
        setEditing(false);
        // You might want to refresh user data here
      } else {
        if (response.status === 401) {
          // Token is invalid or expired, clear it and redirect to login
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          setError('Your session has expired. Please log in again.');
          setTimeout(() => {
            router.push('/login?redirect=' + encodeURIComponent(router.asPath));
          }, 2000);
          return;
        }
        const errorData = await response.json();
        setError(errorData.detail || 'Failed to update profile');
      }
    } catch (err) {
      setError('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        phone: user.phone || '',
        location: user.location || '',
        bio: user.bio || '',
        skills: user.skills || '',
        experience: user.experience || '',
      });
    }
    setEditing(false);
    setError('');
    setSuccess('');
  };

  const handleResumeUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', `Resume - ${file.name}`);

      const response = await fetch('http://localhost:8000/api/v1/resumes/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: formData,
      });

      const data = await response.json();
      
      if (data.success) {
        setSuccess('Resume uploaded and parsed successfully! You can now use the CV Builder.');
      } else {
        setError(data.message || 'Failed to upload resume');
      }
    } catch (error) {
      console.error('Resume upload error:', error);
      setError('Failed to upload resume. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <Layout>
        <ProtectedRoute>
          <Container maxWidth="md" sx={{ py: 4 }}>
            <CircularProgress />
          </Container>
        </ProtectedRoute>
      </Layout>
    );
  }

  return (
    <Layout>
      <ProtectedRoute>
        <Container maxWidth="md" sx={{ py: 4 }}>
          {/* Header */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom>
              My Profile
            </Typography>
            <Typography variant="h6" color="textSecondary">
              Manage your personal information and preferences
            </Typography>
          </Box>

          {/* Success/Error Messages */}
          {success && (
            <Alert severity="success" sx={{ mb: 3 }}>
              {success}
            </Alert>
          )}
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {/* Profile Header Card */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <Avatar sx={{ width: 80, height: 80, fontSize: '2rem' }}>
                {user.first_name?.[0] || user.email?.[0] || 'U'}
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h5" gutterBottom>
                  {user.first_name} {user.last_name}
                </Typography>
                <Typography variant="body1" color="textSecondary" gutterBottom>
                  {user.email}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Chip
                    label={(user.user_type || 'job_seeker').replace('_', ' ').toUpperCase()}
                    color="primary"
                    size="small"
                  />
                                      <Chip
                      label={user.is_active !== false ? 'Active' : 'Inactive'}
                      color={user.is_active !== false ? 'success' : 'error'}
                      size="small"
                    />
                </Box>
              </Box>
              <Button
                variant={editing ? "outlined" : "contained"}
                startIcon={editing ? <CancelIcon /> : <EditIcon />}
                onClick={editing ? handleCancel : () => setEditing(true)}
                disabled={loading}
              >
                {editing ? 'Cancel' : 'Edit Profile'}
              </Button>
            </Box>
          </Paper>

          {/* Profile Form */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Personal Information
              </Typography>
              <Divider sx={{ mb: 3 }} />

              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="First Name"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleInputChange}
                    disabled={!editing}
                    InputProps={{
                      startAdornment: <PersonIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Last Name"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleInputChange}
                    disabled={!editing}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    disabled={!editing}
                    InputProps={{
                      startAdornment: <EmailIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    disabled={!editing}
                    InputProps={{
                      startAdornment: <PhoneIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Location"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    disabled={!editing}
                    InputProps={{
                      startAdornment: <LocationIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Bio"
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    disabled={!editing}
                    placeholder="Tell us about yourself..."
                  />
                </Grid>
                
                {(user.user_type === 'job_seeker' || !user.user_type) && (
                  <>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Skills"
                        name="skills"
                        value={formData.skills}
                        onChange={handleInputChange}
                        disabled={!editing}
                        placeholder="List your skills (e.g., JavaScript, React, Node.js)"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        multiline
                        rows={3}
                        label="Experience"
                        name="experience"
                        value={formData.experience}
                        onChange={handleInputChange}
                        disabled={!editing}
                        placeholder="Describe your work experience..."
                      />
                    </Grid>
                  </>
                )}
              </Grid>

              {editing && (
                <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                  <Button
                    variant="contained"
                    startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
                    onClick={handleSave}
                    disabled={loading}
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<CancelIcon />}
                    onClick={handleCancel}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Account Info */}
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Account Information
              </Typography>
              <Divider sx={{ mb: 3 }} />
              
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="textSecondary">
                    Member Since
                  </Typography>
                  <Typography variant="body1">
                    {user.date_joined ? new Date(user.date_joined).toLocaleDateString() : 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="textSecondary">
                    Last Login
                  </Typography>
                  <Typography variant="body1">
                    {user.last_login 
                      ? new Date(user.last_login).toLocaleDateString()
                      : 'Never'
                    }
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="textSecondary">
                    Email Verified
                  </Typography>
                  <Chip
                    label={user.is_verified === true ? 'Verified' : 'Not Verified'}
                    color={user.is_verified === true ? 'success' : 'warning'}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="textSecondary">
                    Account Type
                  </Typography>
                                      <Chip
                      label={(user.user_type || 'job_seeker').replace('_', ' ').toUpperCase()}
                      color="primary"
                      size="small"
                    />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Resume & CV Builder Section */}
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PersonIcon />
                Resume & CV Builder
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h6" gutterBottom>
                      Upload Resume
                    </Typography>
                    <Typography variant="body2" color="textSecondary" paragraph>
                      Upload your existing resume to extract and structure your information automatically.
                    </Typography>
                    <Button
                      variant="outlined"
                      component="label"
                      sx={{ mb: 2 }}
                    >
                      Choose Resume File
                      <input
                        type="file"
                        hidden
                        accept=".pdf,.doc,.docx,.txt"
                        onChange={handleResumeUpload}
                      />
                    </Button>
                    <Typography variant="caption" display="block" color="textSecondary">
                      Supported formats: PDF, DOC, DOCX, TXT
                    </Typography>
                  </Paper>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h6" gutterBottom>
                      Build Professional CV
                    </Typography>
                    <Typography variant="body2" color="textSecondary" paragraph>
                      Create a professional CV using our template builder with your structured data.
                    </Typography>
                    <Button
                      variant="contained"
                      onClick={() => router.push('/cv-builder')}
                      sx={{ mb: 2 }}
                    >
                      Open CV Builder
                    </Button>
                    <Typography variant="caption" display="block" color="textSecondary">
                      Multiple templates available
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Container>
      </ProtectedRoute>
    </Layout>
  );
};

export default ProfilePage; 