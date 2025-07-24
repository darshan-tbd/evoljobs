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
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import {
  Search as SearchIcon,
  TrendingUp,
  TrendingDown,
  Refresh as RefreshIcon,
  Settings as SettingsIcon,
  Analytics as AnalyticsIcon,
  Visibility as ViewIcon,
  Download as ExportIcon,
  FilterList as FilterIcon,
  QueryStats as QueryStatsIcon,
  Speed as SpeedIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import AdminLayout from '../../components/admin_dashboard/AdminLayout';

interface SearchQuery {
  id: string;
  query: string;
  user: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  results_count: number;
  response_time: number;
  filters: any;
  timestamp: string;
  success: boolean;
  error_message?: string;
}

interface SearchStats {
  totalQueries: number;
  averageResponseTime: number;
  successRate: number;
  popularQueries: Array<{
    query: string;
    count: number;
    avgResponseTime: number;
  }>;
  queryTrends: Array<{
    date: string;
    count: number;
    avgResponseTime: number;
  }>;
}

const AdminSearchPage: React.FC = () => {
  const [searchQueries, setSearchQueries] = useState<SearchQuery[]>([]);
  const [searchStats, setSearchStats] = useState<SearchStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedQuery, setSelectedQuery] = useState<SearchQuery | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const fetchSearchQueries = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: (page + 1).toString(),
        limit: rowsPerPage.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter && { success: statusFilter }),
      });

      const response = await fetch(`http://127.0.0.1:8000/api/v1/search/admin-queries/?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSearchQueries(data.results || []);
        setTotalCount(data.count || 0);
      } else {
        throw new Error('Failed to fetch search queries');
      }
    } catch (error) {
      console.error('Error fetching search queries:', error);
      setSnackbar({ open: true, message: 'Failed to fetch search queries', severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, searchTerm, statusFilter]);

  const fetchSearchStats = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/api/v1/search/admin-stats/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSearchStats(data);
      }
    } catch (error) {
      console.error('Error fetching search stats:', error);
    }
  };

  useEffect(() => {
    fetchSearchQueries();
    fetchSearchStats();
  }, [fetchSearchQueries]);

  const handleSearch = () => {
    setPage(0);
    fetchSearchQueries();
  };

  const handleViewQuery = (query: SearchQuery) => {
    setSelectedQuery(query);
    setDetailsDialogOpen(true);
  };

  const StatCard: React.FC<{
    title: string;
    value: number | string;
    icon: React.ReactNode;
    color: string;
    subtitle?: string;
    unit?: string;
  }> = ({ title, value, icon, color, subtitle, unit }) => (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography color="textSecondary" gutterBottom variant="body2">
              {title}
            </Typography>
            <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
              {typeof value === 'number' ? value.toFixed(2) : value}{unit && ` ${unit}`}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                {subtitle}
              </Typography>
            )}
          </Box>
          <Box 
            sx={{ 
              p: 1, 
              borderRadius: 1, 
              bgcolor: `${color}.light`, 
              color: `${color}.main`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <AdminLayout>
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
              Search Analytics
            </Typography>
            <Typography variant="body1" color="textSecondary">
              Monitor search performance, queries, and user behavior
            </Typography>
          </Box>
          <Stack direction="row" spacing={2}>
            <Button
              startIcon={<RefreshIcon />}
              onClick={() => { fetchSearchQueries(); fetchSearchStats(); }}
              disabled={loading}
            >
              Refresh
            </Button>
            <Button
              startIcon={<ExportIcon />}
              variant="outlined"
              onClick={() => {/* TODO: Implement export */}}
            >
              Export Data
            </Button>
          </Stack>
        </Box>

        {/* Search Statistics */}
        {searchStats && (
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Total Queries"
                value={searchStats.totalQueries.toLocaleString()}
                icon={<QueryStatsIcon />}
                color="primary"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Avg Response Time"
                value={searchStats.averageResponseTime}
                icon={<SpeedIcon />}
                color="info"
                unit="ms"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Success Rate"
                value={searchStats.successRate}
                icon={<SuccessIcon />}
                color="success"
                unit="%"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Popular Queries"
                value={searchStats.popularQueries.length}
                icon={<TrendingUp />}
                color="secondary"
              />
            </Grid>
          </Grid>
        )}

        {/* Filters */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Search queries..."
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
                  <MenuItem value="true">Successful</MenuItem>
                  <MenuItem value="false">Failed</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
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

        {/* Search Queries Table */}
        <Paper>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>User</TableCell>
                  <TableCell>Query</TableCell>
                  <TableCell>Results</TableCell>
                  <TableCell>Response Time</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Timestamp</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {searchQueries.map((query) => (
                  <TableRow key={query.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar>
                          {query.user.first_name.charAt(0)}{query.user.last_name.charAt(0)}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 500 }}>
                            {query.user.first_name} {query.user.last_name}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            {query.user.email}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {query.query}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {query.results_count}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <SpeedIcon fontSize="small" color="action" />
                        <Typography variant="body2">
                          {query.response_time}ms
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      {query.success ? (
                        <Chip label="Success" color="success" size="small" icon={<SuccessIcon />} />
                      ) : (
                        <Chip label="Failed" color="error" size="small" icon={<ErrorIcon />} />
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(query.timestamp).toLocaleString()}
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="View Details">
                        <IconButton
                          size="small"
                          onClick={() => handleViewQuery(query)}
                        >
                          <ViewIcon />
                        </IconButton>
                      </Tooltip>
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

        {/* Popular Queries */}
        {searchStats && (
          <Grid container spacing={3} sx={{ mt: 3 }}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Popular Search Queries
                  </Typography>
                  <List>
                    {searchStats.popularQueries.slice(0, 10).map((popularQuery, index) => (
                      <ListItem key={index}>
                        <ListItemIcon>
                          <Typography variant="h6" color="primary">
                            #{index + 1}
                          </Typography>
                        </ListItemIcon>
                        <ListItemText
                          primary={popularQuery.query}
                          secondary={`${popularQuery.count} searches • ${popularQuery.avgResponseTime.toFixed(0)}ms avg`}
                        />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Search Performance Trends
                  </Typography>
                  <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Box sx={{ textAlign: 'center' }}>
                      <AnalyticsIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                      <Typography variant="body2" color="textSecondary">
                        Performance trends chart will be implemented here
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Search Query Details Dialog */}
        <Dialog open={detailsDialogOpen} onClose={() => setDetailsDialogOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>Search Query Details</DialogTitle>
          <DialogContent>
            {selectedQuery && (
              <Box>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" gutterBottom>Query Information</Typography>
                    <List dense>
                      <ListItem>
                        <ListItemText
                          primary="Search Query"
                          secondary={selectedQuery.query}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText
                          primary="Results Count"
                          secondary={selectedQuery.results_count}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText
                          primary="Response Time"
                          secondary={`${selectedQuery.response_time}ms`}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText
                          primary="Status"
                          secondary={selectedQuery.success ? 'Success' : 'Failed'}
                        />
                      </ListItem>
                    </List>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" gutterBottom>User Information</Typography>
                    <List dense>
                      <ListItem>
                        <ListItemText
                          primary="Name"
                          secondary={`${selectedQuery.user.first_name} ${selectedQuery.user.last_name}`}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText
                          primary="Email"
                          secondary={selectedQuery.user.email}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText
                          primary="Timestamp"
                          secondary={new Date(selectedQuery.timestamp).toLocaleString()}
                        />
                      </ListItem>
                    </List>
                  </Grid>
                  {selectedQuery.error_message && (
                    <Grid item xs={12}>
                      <Typography variant="h6" gutterBottom>Error Details</Typography>
                      <Alert severity="error">
                        {selectedQuery.error_message}
                      </Alert>
                    </Grid>
                  )}
                </Grid>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDetailsDialogOpen(false)}>Close</Button>
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
    </AdminLayout>
  );
};

export default AdminSearchPage; 