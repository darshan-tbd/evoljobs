import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Grid,
  Alert,
  Snackbar,
  Tooltip,
  Stack,
  Card,
  CardContent,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Download as ExportIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import ProtectedRoute from '../../components/ProtectedRoute';
import JobFormDialog from '../../components/admin/JobFormDialog';
import JobDetailsDialog from '../../components/admin/JobDetailsDialog';

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
}

const AdminJobsPage: React.FC = () => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [jobTypeFilter, setJobTypeFilter] = useState('');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: (page + 1).toString(),
        limit: rowsPerPage.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter && { status: statusFilter }),
        ...(jobTypeFilter && { job_type: jobTypeFilter }),
        admin: 'true', // Admin view to get all jobs regardless of status
      });

      const response = await fetch(`http://127.0.0.1:8000/api/v1/jobs/jobs/?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setJobs(data.results || []);
        setTotalCount(data.count || 0);
      } else {
        throw new Error('Failed to fetch jobs');
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
      setSnackbar({ open: true, message: 'Failed to fetch jobs', severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, searchTerm, statusFilter, jobTypeFilter]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const handleSearch = () => {
    setPage(0);
    fetchJobs();
  };

  const handleCreateJob = () => {
    setEditingJob(null);
    setFormDialogOpen(true);
  };

  const handleEditJob = (job: Job) => {
    setEditingJob(job);
    setFormDialogOpen(true);
  };

  const handleViewJob = (job: Job) => {
    setSelectedJob(job);
    setDetailsDialogOpen(true);
  };

  const handleDeleteJob = (job: Job) => {
    setSelectedJob(job);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedJob) return;

    try {
      const response = await fetch(`http://127.0.0.1:8000/api/v1/jobs/jobs/${selectedJob.slug}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      });

      if (response.ok) {
        setSnackbar({ open: true, message: 'Job deleted successfully', severity: 'success' });
        fetchJobs();
      } else {
        throw new Error('Failed to delete job');
      }
    } catch (error) {
      console.error('Error deleting job:', error);
      setSnackbar({ open: true, message: 'Failed to delete job', severity: 'error' });
    }

    setDeleteDialogOpen(false);
    setSelectedJob(null);
  };

  const handleJobSaved = () => {
    setFormDialogOpen(false);
    setEditingJob(null);
    fetchJobs();
    setSnackbar({ 
      open: true, 
      message: editingJob ? 'Job updated successfully' : 'Job created successfully', 
      severity: 'success' 
    });
  };

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

  return (
    <ProtectedRoute requireStaff>
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1">
            Job Management
          </Typography>
          <Stack direction="row" spacing={2}>
            <Button
              startIcon={<RefreshIcon />}
              onClick={fetchJobs}
              disabled={loading}
            >
              Refresh
            </Button>
            <Button
              startIcon={<ExportIcon />}
              variant="outlined"
              onClick={() => {/* TODO: Implement export */}}
            >
              Export
            </Button>
            <Button
              startIcon={<AddIcon />}
              variant="contained"
              onClick={handleCreateJob}
            >
              Create Job
            </Button>
          </Stack>
        </Box>

        {/* Statistics Cards */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Jobs
                </Typography>
                <Typography variant="h4">
                  {totalCount}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Active Jobs
                </Typography>
                <Typography variant="h4">
                  {jobs.filter(job => job.status === 'active').length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Draft Jobs
                </Typography>
                <Typography variant="h4">
                  {jobs.filter(job => job.status === 'draft').length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Applications
                </Typography>
                <Typography variant="h4">
                  {jobs.reduce((sum, job) => sum + job.applications_count, 0)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Filters */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Search jobs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  label="Status"
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="draft">Draft</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="paused">Paused</MenuItem>
                  <MenuItem value="closed">Closed</MenuItem>
                  <MenuItem value="filled">Filled</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Job Type</InputLabel>
                <Select
                  value={jobTypeFilter}
                  label="Job Type"
                  onChange={(e) => setJobTypeFilter(e.target.value)}
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="full_time">Full Time</MenuItem>
                  <MenuItem value="part_time">Part Time</MenuItem>
                  <MenuItem value="contract">Contract</MenuItem>
                  <MenuItem value="internship">Internship</MenuItem>
                  <MenuItem value="temporary">Temporary</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <Button
                fullWidth
                variant="contained"
                onClick={handleSearch}
                startIcon={<FilterIcon />}
              >
                Filter
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {/* Jobs Table */}
        <Paper>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Job Title</TableCell>
                  <TableCell>Company</TableCell>
                  <TableCell>Location</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Salary</TableCell>
                  <TableCell>Applications</TableCell>
                  <TableCell>Views</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {jobs.map((job) => (
                  <TableRow key={job.id} hover>
                    <TableCell>
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 500 }}>
                          {job.title}
                        </Typography>
                        {job.is_featured && (
                          <Chip label="Featured" size="small" color="primary" sx={{ mt: 0.5 }} />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>{job.company.name}</TableCell>
                    <TableCell>
                      {job.location.city}, {job.location.state}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={job.job_type.replace('_', ' ')} 
                        size="small" 
                        variant="outlined" 
                      />
                    </TableCell>
                    <TableCell>{getStatusChip(job.status)}</TableCell>
                    <TableCell>{formatSalary(job.salary_min, job.salary_max)}</TableCell>
                    <TableCell>{job.applications_count}</TableCell>
                    <TableCell>{job.views_count}</TableCell>
                    <TableCell>
                      {new Date(job.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={1}>
                        <Tooltip title="View Details">
                          <IconButton
                            size="small"
                            onClick={() => handleViewJob(job)}
                          >
                            <ViewIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit Job">
                          <IconButton
                            size="small"
                            onClick={() => handleEditJob(job)}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Job">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteJob(job)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50]}
            component="div"
            count={totalCount}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
          />
        </Paper>

        {/* Job Form Dialog */}
        <JobFormDialog
          open={formDialogOpen}
          onClose={() => {
            setFormDialogOpen(false);
            setEditingJob(null);
          }}
          onSave={handleJobSaved}
          job={editingJob}
        />

        {/* Job Details Dialog */}
        <JobDetailsDialog
          open={detailsDialogOpen}
          onClose={() => {
            setDetailsDialogOpen(false);
            setSelectedJob(null);
          }}
          job={selectedJob}
        />

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
          <DialogTitle>Confirm Delete</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete the job "{selectedJob?.title}"? 
              This action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button onClick={confirmDelete} color="error" variant="contained">
              Delete
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar for notifications */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          <Alert 
            onClose={() => setSnackbar({ ...snackbar, open: false })} 
            severity={snackbar.severity}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </ProtectedRoute>
  );
};

export default AdminJobsPage; 