import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Grid,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  Paper,
  Tabs,
  Tab,
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Download as DownloadIcon,
  Preview as PreviewIcon,
  ArrowBack,
  ArrowForward,
  Work as WorkIcon,
  School as EducationIcon,
  Star as SkillIcon,
  Assignment as CertificationIcon
} from '@mui/icons-material';
// Using standard date inputs instead of MUI X date pickers for compatibility

interface ResumeTemplate {
  id: string;
  name: string;
  template_type: string;
  description: string;
  preview_image_url?: string;
  is_premium: boolean;
}

interface WorkExperience {
  id?: string;
  company: string;
  position: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  description: string;
  location: string;
}

interface Education {
  id?: string;
  institution: string;
  degree: string;
  field_of_study: string;
  graduation_year: string;
  gpa?: string;
}

interface CVBuilderProps {
  onClose?: () => void;
}

const CVBuilder: React.FC<CVBuilderProps> = ({ onClose }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [templates, setTemplates] = useState<ResumeTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<ResumeTemplate | null>(null);
  const [loading, setLoading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [generatedResumeId, setGeneratedResumeId] = useState<string | null>(null);
  
  // Form data
  const [personalInfo, setPersonalInfo] = useState({
    full_name: '',
    email: '',
    phone: '',
    location: '',
    website: '',
    linkedin_url: '',
    github_url: ''
  });
  
  const [summary, setSummary] = useState('');
  const [workExperience, setWorkExperience] = useState<WorkExperience[]>([]);
  const [education, setEducation] = useState<Education[]>([]);
  const [skills, setSkills] = useState<string[]>([]);
  const [certifications, setCertifications] = useState<string[]>([]);
  
  // Form state
  const [newSkill, setNewSkill] = useState('');
  const [newCertification, setNewCertification] = useState('');
  const [workDialogOpen, setWorkDialogOpen] = useState(false);
  const [educationDialogOpen, setEducationDialogOpen] = useState(false);
  const [editingWork, setEditingWork] = useState<WorkExperience | null>(null);
  const [editingEducation, setEditingEducation] = useState<Education | null>(null);

  const steps = [
    'Choose Template',
    'Personal Information',
    'Professional Summary',
    'Work Experience',
    'Education',
    'Skills & Certifications',
    'Review & Generate'
  ];

  useEffect(() => {
    fetchTemplates();
    loadUserData();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/v1/resumes/templates/');
      const data = await response.json();
      setTemplates(data.results || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  const loadUserData = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      };
      
      // Try to load data from primary resume
      const response = await fetch('http://localhost:8000/api/v1/resumes/primary/', { headers });
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.resume) {
          // Load parsed data
          const parsedResponse = await fetch(`http://localhost:8000/api/v1/resumes/${data.resume.id}/parsed_data/`, { headers });
          if (parsedResponse.ok) {
            const parsedData = await parsedResponse.json();
            if (parsedData.success) {
              const parsed = parsedData.data;
              setPersonalInfo({
                full_name: parsed.full_name || '',
                email: parsed.email || '',
                phone: parsed.phone || '',
                location: parsed.location || '',
                website: parsed.website || '',
                linkedin_url: parsed.linkedin_url || '',
                github_url: parsed.github_url || ''
              });
              setSummary(parsed.summary || '');
              setWorkExperience(parsed.work_experience || []);
              setEducation(parsed.education || []);
              setSkills(parsed.skills_list || []);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const addSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill('');
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setSkills(skills.filter(skill => skill !== skillToRemove));
  };

  const addCertification = () => {
    if (newCertification.trim() && !certifications.includes(newCertification.trim())) {
      setCertifications([...certifications, newCertification.trim()]);
      setNewCertification('');
    }
  };

  const removeCertification = (certToRemove: string) => {
    setCertifications(certifications.filter(cert => cert !== certToRemove));
  };

  const handleWorkSave = (work: WorkExperience) => {
    if (editingWork) {
      setWorkExperience(workExperience.map(w => 
        w.id === editingWork.id ? { ...work, id: editingWork.id } : w
      ));
    } else {
      setWorkExperience([...workExperience, { ...work, id: Date.now().toString() }]);
    }
    setWorkDialogOpen(false);
    setEditingWork(null);
  };

  const handleEducationSave = (edu: Education) => {
    if (editingEducation) {
      setEducation(education.map(e => 
        e.id === editingEducation.id ? { ...edu, id: editingEducation.id } : e
      ));
    } else {
      setEducation([...education, { ...edu, id: Date.now().toString() }]);
    }
    setEducationDialogOpen(false);
    setEditingEducation(null);
  };

  const generateResume = async () => {
    if (!selectedTemplate) return;
    
    setLoading(true);
    try {
      const customData = {
        personal_info: personalInfo,
        summary,
        work_experience: workExperience,
        education,
        skills,
        certifications
      };

      const token = localStorage.getItem('access_token');
      const response = await fetch('http://localhost:8000/api/v1/resumes/generated/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          template_id: selectedTemplate.id,
          output_format: 'pdf',
          custom_data: customData
        })
      });

      const data = await response.json();
      if (data.success) {
        setGeneratedResumeId(data.generated_resume.id);
        setActiveStep(steps.length); // Go to completion step
      } else {
        console.error('Resume generation failed:', data);
      }
    } catch (error) {
      console.error('Error generating resume:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadResume = async () => {
    if (!generatedResumeId) return;
    
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`http://localhost:8000/api/v1/resumes/generated/${generatedResumeId}/download/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `resume_${selectedTemplate?.name || 'custom'}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error downloading resume:', error);
    }
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            {templates.map((template) => (
              <Grid item xs={12} sm={6} md={4} key={template.id}>
                <Card 
                  sx={{ 
                    cursor: 'pointer',
                    border: selectedTemplate?.id === template.id ? 2 : 1,
                    borderColor: selectedTemplate?.id === template.id ? 'primary.main' : 'divider'
                  }}
                  onClick={() => setSelectedTemplate(template)}
                >
                  {template.preview_image_url && (
                    <Box
                      component="img"
                      src={template.preview_image_url}
                      alt={template.name}
                      sx={{ width: '100%', height: 200, objectFit: 'cover' }}
                    />
                  )}
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {template.name}
                      {template.is_premium && (
                        <Chip label="Premium" size="small" color="primary" sx={{ ml: 1 }} />
                      )}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {template.description}
                    </Typography>
                    <Chip label={template.template_type} size="small" sx={{ mt: 1 }} />
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        );

      case 1:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Full Name"
                value={personalInfo.full_name}
                onChange={(e) => setPersonalInfo({ ...personalInfo, full_name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={personalInfo.email}
                onChange={(e) => setPersonalInfo({ ...personalInfo, email: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Phone"
                value={personalInfo.phone}
                onChange={(e) => setPersonalInfo({ ...personalInfo, phone: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Location"
                value={personalInfo.location}
                onChange={(e) => setPersonalInfo({ ...personalInfo, location: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Website"
                value={personalInfo.website}
                onChange={(e) => setPersonalInfo({ ...personalInfo, website: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="LinkedIn URL"
                value={personalInfo.linkedin_url}
                onChange={(e) => setPersonalInfo({ ...personalInfo, linkedin_url: e.target.value })}
              />
            </Grid>
          </Grid>
        );

      case 2:
        return (
          <TextField
            fullWidth
            multiline
            rows={6}
            label="Professional Summary"
            placeholder="Write a compelling summary that highlights your key achievements and career goals..."
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            helperText="2-3 sentences that showcase your expertise and value proposition"
          />
        );

      case 3:
        return (
          <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">Work Experience</Typography>
              <Button
                startIcon={<AddIcon />}
                onClick={() => {
                  setEditingWork(null);
                  setWorkDialogOpen(true);
                }}
              >
                Add Experience
              </Button>
            </Box>
            <List>
              {workExperience.map((work) => (
                <ListItem key={work.id}>
                  <Box display="flex" alignItems="center" mr={2}>
                    <WorkIcon color="primary" />
                  </Box>
                  <ListItemText
                    primary={`${work.position} at ${work.company}`}
                    secondary={`${work.start_date} - ${work.is_current ? 'Present' : work.end_date} | ${work.location}`}
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      onClick={() => {
                        setEditingWork(work);
                        setWorkDialogOpen(true);
                      }}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      edge="end"
                      onClick={() => setWorkExperience(workExperience.filter(w => w.id !== work.id))}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          </Box>
        );

      case 4:
        return (
          <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">Education</Typography>
              <Button
                startIcon={<AddIcon />}
                onClick={() => {
                  setEditingEducation(null);
                  setEducationDialogOpen(true);
                }}
              >
                Add Education
              </Button>
            </Box>
            <List>
              {education.map((edu) => (
                <ListItem key={edu.id}>
                  <Box display="flex" alignItems="center" mr={2}>
                    <EducationIcon color="primary" />
                  </Box>
                  <ListItemText
                    primary={`${edu.degree} in ${edu.field_of_study}`}
                    secondary={`${edu.institution} | ${edu.graduation_year}`}
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      onClick={() => {
                        setEditingEducation(edu);
                        setEducationDialogOpen(true);
                      }}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      edge="end"
                      onClick={() => setEducation(education.filter(e => e.id !== edu.id))}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          </Box>
        );

      case 5:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>Skills</Typography>
              <Box display="flex" gap={1} mb={2}>
                <TextField
                  fullWidth
                  size="small"
                  label="Add Skill"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addSkill()}
                />
                <Button onClick={addSkill}>Add</Button>
              </Box>
              <Box display="flex" flexWrap="wrap" gap={1}>
                {skills.map((skill) => (
                  <Chip
                    key={skill}
                    label={skill}
                    onDelete={() => removeSkill(skill)}
                    color="primary"
                    variant="outlined"
                  />
                ))}
              </Box>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>Certifications</Typography>
              <Box display="flex" gap={1} mb={2}>
                <TextField
                  fullWidth
                  size="small"
                  label="Add Certification"
                  value={newCertification}
                  onChange={(e) => setNewCertification(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addCertification()}
                />
                <Button onClick={addCertification}>Add</Button>
              </Box>
              <Box display="flex" flexWrap="wrap" gap={1}>
                {certifications.map((cert) => (
                  <Chip
                    key={cert}
                    label={cert}
                    onDelete={() => removeCertification(cert)}
                    color="secondary"
                    variant="outlined"
                  />
                ))}
              </Box>
            </Grid>
          </Grid>
        );

      case 6:
        return (
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Review Your CV</Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Template: {selectedTemplate?.name}
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2">Personal Information</Typography>
                <Typography variant="body2">{personalInfo.full_name}</Typography>
                <Typography variant="body2">{personalInfo.email}</Typography>
                <Typography variant="body2">{personalInfo.phone}</Typography>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2">Experience & Education</Typography>
                <Typography variant="body2">{workExperience.length} work experiences</Typography>
                <Typography variant="body2">{education.length} education entries</Typography>
                <Typography variant="body2">{skills.length} skills</Typography>
              </Grid>
            </Grid>

            <Box mt={3}>
              <Button
                variant="contained"
                size="large"
                onClick={generateResume}
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : <DownloadIcon />}
              >
                {loading ? 'Generating...' : 'Generate CV'}
              </Button>
            </Box>
          </Paper>
        );

      default:
        return (
          <Box textAlign="center" py={4}>
            <Typography variant="h5" gutterBottom color="primary">
              🎉 CV Generated Successfully!
            </Typography>
            <Typography variant="body1" paragraph>
              Your professional CV has been created and is ready for download.
            </Typography>
            <Box mt={3} display="flex" gap={2} justifyContent="center">
              <Button
                variant="contained"
                onClick={downloadResume}
                startIcon={<DownloadIcon />}
              >
                Download CV
              </Button>
              <Button
                variant="outlined"
                onClick={() => setActiveStep(0)}
              >
                Create Another
              </Button>
            </Box>
          </Box>
        );
    }
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" gutterBottom>
          CV Builder
        </Typography>
        {onClose && (
          <Button onClick={onClose} startIcon={<ArrowBack />}>
            Back
          </Button>
        )}
      </Box>

      <Paper sx={{ p: 3 }}>
        <Stepper activeStep={activeStep} orientation="vertical">
          {steps.map((label, index) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
              <StepContent>
                <Box sx={{ mb: 2 }}>
                  {renderStepContent(index)}
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Button
                    variant="contained"
                    onClick={handleNext}
                    sx={{ mt: 1, mr: 1 }}
                    disabled={index === 0 && !selectedTemplate}
                  >
                    {index === steps.length - 1 ? 'Generate' : 'Continue'}
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

        {activeStep === steps.length && renderStepContent(activeStep)}
      </Paper>

      {/* Work Experience Dialog */}
      <WorkExperienceDialog
        open={workDialogOpen}
        onClose={() => {
          setWorkDialogOpen(false);
          setEditingWork(null);
        }}
        onSave={handleWorkSave}
        initialData={editingWork}
      />

      {/* Education Dialog */}
      <EducationDialog
        open={educationDialogOpen}
        onClose={() => {
          setEducationDialogOpen(false);
          setEditingEducation(null);
        }}
        onSave={handleEducationSave}
        initialData={editingEducation}
      />
    </Box>
  );
};

// Work Experience Dialog Component
const WorkExperienceDialog: React.FC<{
  open: boolean;
  onClose: () => void;
  onSave: (work: WorkExperience) => void;
  initialData?: WorkExperience | null;
}> = ({ open, onClose, onSave, initialData }) => {
  const [formData, setFormData] = useState<WorkExperience>({
    company: '',
    position: '',
    start_date: '',
    end_date: '',
    is_current: false,
    description: '',
    location: ''
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({
        company: '',
        position: '',
        start_date: '',
        end_date: '',
        is_current: false,
        description: '',
        location: ''
      });
    }
  }, [initialData, open]);

  const handleSave = () => {
    onSave(formData);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {initialData ? 'Edit Work Experience' : 'Add Work Experience'}
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Company"
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Position"
              value={formData.position}
              onChange={(e) => setFormData({ ...formData, position: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Start Date"
              type="month"
              value={formData.start_date}
              onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="End Date"
              type="month"
              value={formData.end_date}
              onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
              disabled={formData.is_current}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Location"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained">
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Education Dialog Component
const EducationDialog: React.FC<{
  open: boolean;
  onClose: () => void;
  onSave: (education: Education) => void;
  initialData?: Education | null;
}> = ({ open, onClose, onSave, initialData }) => {
  const [formData, setFormData] = useState<Education>({
    institution: '',
    degree: '',
    field_of_study: '',
    graduation_year: '',
    gpa: ''
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({
        institution: '',
        degree: '',
        field_of_study: '',
        graduation_year: '',
        gpa: ''
      });
    }
  }, [initialData, open]);

  const handleSave = () => {
    onSave(formData);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {initialData ? 'Edit Education' : 'Add Education'}
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Institution"
              value={formData.institution}
              onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Degree"
              value={formData.degree}
              onChange={(e) => setFormData({ ...formData, degree: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Field of Study"
              value={formData.field_of_study}
              onChange={(e) => setFormData({ ...formData, field_of_study: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Graduation Year"
              value={formData.graduation_year}
              onChange={(e) => setFormData({ ...formData, graduation_year: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="GPA (Optional)"
              value={formData.gpa}
              onChange={(e) => setFormData({ ...formData, gpa: e.target.value })}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained">
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CVBuilder; 