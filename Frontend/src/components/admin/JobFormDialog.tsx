import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Typography,
  Chip,
  Box,
  Autocomplete,
  FormControlLabel,
  Switch,
  Alert,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  InputAdornment,
} from '@mui/material';

import { AttachMoney as MoneyIcon } from '@mui/icons-material';

interface Job {
  id: string;
  title: string;
  slug: string;
  company: {
    id: string;
    name: string;
  };
  location: {
    id?: string;
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

interface JobFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  job?: Job | null;
}

interface Company {
  id: string;
  name: string;
}

interface Location {
  id: string;
  name: string;
  city: string;
  state: string;
  country: string;
}

interface Skill {
  id: string;
  name: string;
}

const JobFormDialog: React.FC<JobFormDialogProps> = ({ open, onClose, onSave, job }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({
    title: '',
    company_id: '',
    location_id: '',
    job_type: 'full_time',
    experience_level: 'mid',
    remote_option: 'onsite',
    salary_min: '',
    salary_max: '',
    status: 'draft',
    is_featured: false,
    application_deadline: null as Date | null,
    description: '',
    requirements: '',
    benefits: '',
    required_skills: [] as Skill[],
    preferred_skills: [] as Skill[],
  });

  const [companies, setCompanies] = useState<Company[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [allSkills, setAllSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const steps = [
    'Basic Information',
    'Job Details',
    'Requirements & Skills',
    'Additional Information'
  ];

  useEffect(() => {
    if (open) {
      fetchFormData();
      if (job) {
        setFormData({
          title: job.title,
          company_id: job.company.id,
          location_id: job.location?.id || '',
          job_type: job.job_type,
          experience_level: job.experience_level,
          remote_option: job.remote_option,
          salary_min: job.salary_min?.toString() || '',
          salary_max: job.salary_max?.toString() || '',
          status: job.status,
          is_featured: job.is_featured,
          application_deadline: job.application_deadline ? new Date(job.application_deadline) : null,
          description: job.description || '',
          requirements: job.requirements || '',
          benefits: job.benefits || '',
          required_skills: job.required_skills || [],
          preferred_skills: job.preferred_skills || [],
        });
      } else {
        // Reset form for new job
        setFormData({
          title: '',
          company_id: '',
          location_id: '',
          job_type: 'full_time',
          experience_level: 'mid',
          remote_option: 'onsite',
          salary_min: '',
          salary_max: '',
          status: 'draft',
          is_featured: false,
          application_deadline: null,
          description: '',
          requirements: '',
          benefits: '',
          required_skills: [],
          preferred_skills: [],
        });
      }
      setActiveStep(0);
      setError('');
    }
  }, [open, job]);

  const fetchFormData = async () => {
    try {
      const [companiesRes, locationsRes, skillsRes] = await Promise.all([
        fetch('http://127.0.0.1:8000/api/v1/companies/companies/', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` },
        }),
        fetch('http://127.0.0.1:8000/api/v1/core/locations/', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` },
        }),
        fetch('http://127.0.0.1:8000/api/v1/core/skills/', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` },
        }),
      ]);

      if (companiesRes.ok) {
        const companiesData = await companiesRes.json();
        setCompanies(companiesData.results || []);
      }

      if (locationsRes.ok) {
        const locationsData = await locationsRes.json();
        setLocations(locationsData.results || []);
      }

      if (skillsRes.ok) {
        const skillsData = await skillsRes.json();
        setAllSkills(skillsData.results || []);
      }
    } catch (error) {
      console.error('Error fetching form data:', error);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      const submitData = {
        title: formData.title,
        company: formData.company_id,
        location: formData.location_id,
        job_type: formData.job_type,
        experience_level: formData.experience_level,
        remote_option: formData.remote_option,
        salary_min: formData.salary_min ? parseInt(formData.salary_min) : null,
        salary_max: formData.salary_max ? parseInt(formData.salary_max) : null,
        status: formData.status,
        is_featured: formData.is_featured,
        application_deadline: formData.application_deadline?.toISOString(),
        description: formData.description,
        requirements: formData.requirements,
        benefits: formData.benefits,
        required_skills: formData.required_skills.map(skill => skill.id),
        preferred_skills: formData.preferred_skills.map(skill => skill.id),
      };

      const url = job 
        ? `http://127.0.0.1:8000/api/v1/jobs/jobs/${job.slug}/`
        : 'http://127.0.0.1:8000/api/v1/jobs/jobs/';
      
      const method = job ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      if (response.ok) {
        onSave();
      } else {
        const errorData = await response.json();
        setError(Object.values(errorData).flat().join(', ') as string);
      }
    } catch (error) {
      console.error('Error saving job:', error);
      setError('Failed to save job. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleFieldChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const isStepValid = (step: number) => {
    switch (step) {
      case 0:
        return formData.title && formData.company_id && formData.location_id;
      case 1:
        return formData.job_type && formData.experience_level && formData.remote_option;
      case 2:
        return formData.description;
      case 3:
        return true;
      default:
        return false;
    }
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Job Title"
                required
                value={formData.title}
                onChange={(e) => handleFieldChange('title', e.target.value)}
                placeholder="e.g., Senior Software Engineer"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Company</InputLabel>
                <Select
                  value={formData.company_id}
                  label="Company"
                  onChange={(e) => handleFieldChange('company_id', e.target.value)}
                >
                  {companies.map((company) => (
                    <MenuItem key={company.id} value={company.id}>
                      {company.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Location</InputLabel>
                <Select
                  value={formData.location_id}
                  label="Location"
                  onChange={(e) => handleFieldChange('location_id', e.target.value)}
                >
                  {locations.map((location) => (
                    <MenuItem key={location.id} value={location.id}>
                      {location.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        );

      case 1:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth required>
                <InputLabel>Job Type</InputLabel>
                <Select
                  value={formData.job_type}
                  label="Job Type"
                  onChange={(e) => handleFieldChange('job_type', e.target.value)}
                >
                  <MenuItem value="full_time">Full Time</MenuItem>
                  <MenuItem value="part_time">Part Time</MenuItem>
                  <MenuItem value="contract">Contract</MenuItem>
                  <MenuItem value="internship">Internship</MenuItem>
                  <MenuItem value="temporary">Temporary</MenuItem>
                  <MenuItem value="volunteer">Volunteer</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth required>
                <InputLabel>Experience Level</InputLabel>
                <Select
                  value={formData.experience_level}
                  label="Experience Level"
                  onChange={(e) => handleFieldChange('experience_level', e.target.value)}
                >
                  <MenuItem value="entry">Entry Level</MenuItem>
                  <MenuItem value="mid">Mid Level</MenuItem>
                  <MenuItem value="senior">Senior Level</MenuItem>
                  <MenuItem value="executive">Executive</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth required>
                <InputLabel>Remote Option</InputLabel>
                <Select
                  value={formData.remote_option}
                  label="Remote Option"
                  onChange={(e) => handleFieldChange('remote_option', e.target.value)}
                >
                  <MenuItem value="onsite">On-site</MenuItem>
                  <MenuItem value="remote">Remote</MenuItem>
                  <MenuItem value="hybrid">Hybrid</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Minimum Salary"
                type="number"
                value={formData.salary_min}
                onChange={(e) => handleFieldChange('salary_min', e.target.value)}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><MoneyIcon /></InputAdornment>,
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Maximum Salary"
                type="number"
                value={formData.salary_max}
                onChange={(e) => handleFieldChange('salary_max', e.target.value)}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><MoneyIcon /></InputAdornment>,
                }}
              />
            </Grid>
          </Grid>
        );

      case 2:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Job Description"
                required
                multiline
                rows={6}
                value={formData.description}
                onChange={(e) => handleFieldChange('description', e.target.value)}
                placeholder="Describe the role, responsibilities, and what the candidate will be doing..."
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Requirements"
                multiline
                rows={4}
                value={formData.requirements}
                onChange={(e) => handleFieldChange('requirements', e.target.value)}
                placeholder="List the required qualifications, experience, and skills..."
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Autocomplete
                multiple
                options={allSkills}
                getOptionLabel={(option) => option.name}
                value={formData.required_skills}
                onChange={(_, newValue) => handleFieldChange('required_skills', newValue)}
                renderInput={(params) => (
                  <TextField {...params} label="Required Skills" placeholder="Select skills" />
                )}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip variant="outlined" label={option.name} {...getTagProps({ index })} />
                  ))
                }
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Autocomplete
                multiple
                options={allSkills}
                getOptionLabel={(option) => option.name}
                value={formData.preferred_skills}
                onChange={(_, newValue) => handleFieldChange('preferred_skills', newValue)}
                renderInput={(params) => (
                  <TextField {...params} label="Preferred Skills" placeholder="Select skills" />
                )}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip variant="outlined" label={option.name} {...getTagProps({ index })} />
                  ))
                }
              />
            </Grid>
          </Grid>
        );

      case 3:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Benefits"
                multiline
                rows={4}
                value={formData.benefits}
                onChange={(e) => handleFieldChange('benefits', e.target.value)}
                placeholder="Describe the benefits, perks, and compensation package..."
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={formData.status}
                  label="Status"
                  onChange={(e) => handleFieldChange('status', e.target.value)}
                >
                  <MenuItem value="draft">Draft</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="paused">Paused</MenuItem>
                  <MenuItem value="closed">Closed</MenuItem>
                  <MenuItem value="filled">Filled</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Application Deadline"
                type="date"
                value={formData.application_deadline ? formData.application_deadline.toISOString().split('T')[0] : ''}
                onChange={(e) => handleFieldChange('application_deadline', e.target.value ? new Date(e.target.value) : null)}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.is_featured}
                    onChange={(e) => handleFieldChange('is_featured', e.target.checked)}
                  />
                }
                label="Featured Job"
              />
            </Grid>
          </Grid>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{ sx: { height: '80vh' } }}
    >
      <DialogTitle>
        {job ? 'Edit Job' : 'Create New Job'}
      </DialogTitle>
      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <Stepper activeStep={activeStep} orientation="vertical">
          {steps.map((label, index) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
              <StepContent>
                <Box sx={{ mt: 2, mb: 2 }}>
                  {renderStepContent(index)}
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Button
                    variant="contained"
                    onClick={index === steps.length - 1 ? handleSubmit : handleNext}
                    disabled={!isStepValid(index) || loading}
                    sx={{ mt: 1, mr: 1 }}
                  >
                    {index === steps.length - 1 ? (loading ? 'Saving...' : 'Save Job') : 'Continue'}
                  </Button>
                  <Button
                    disabled={index === 0}
                    onClick={handleBack}
                    sx={{ mt: 1, mr: 1 }}
                  >
                    Back
                  </Button>
                </Box>
              </StepContent>
            </Step>
          ))}
        </Stepper>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default JobFormDialog; 