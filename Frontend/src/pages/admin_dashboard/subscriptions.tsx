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
  Divider,
} from '@mui/material';
import {
  Subscriptions as SubscriptionsIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Download as ExportIcon,
  Refresh as RefreshIcon,
  CheckCircle as ActiveIcon,
  Warning as ExpiredIcon,
  Error as CancelledIcon,
  Payment as PaymentIcon,
  Business as BusinessIcon,
  Person as PersonIcon,
  AttachMoney as MoneyIcon,
  CalendarToday as CalendarIcon,
} from '@mui/icons-material';
import AdminLayout from '../../components/admin_dashboard/AdminLayout';

interface Subscription {
  id: string;
  user: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  plan: {
    id: string;
    name: string;
    price: number;
    currency: string;
    interval: string;
  };
  status: 'active' | 'expired' | 'cancelled' | 'pending';
  start_date: string;
  end_date: string;
  next_billing_date: string;
  amount_paid: number;
  payment_method: string;
  auto_renew: boolean;
  created_at: string;
}

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  interval: string;
  features: string[];
  is_active: boolean;
  max_users?: number;
  max_jobs?: number;
}

interface SubscriptionStats {
  totalSubscriptions: number;
  activeSubscriptions: number;
  monthlyRevenue: number;
  annualRevenue: number;
  averageSubscriptionValue: number;
  topPlans: Array<{
    name: string;
    count: number;
    revenue: number;
  }>;
}

const AdminSubscriptionsPage: React.FC = () => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [subscriptionStats, setSubscriptionStats] = useState<SubscriptionStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [planFilter, setPlanFilter] = useState('');
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [planDialogOpen, setPlanDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const fetchSubscriptions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: (page + 1).toString(),
        limit: rowsPerPage.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter && { status: statusFilter }),
        ...(planFilter && { plan: planFilter }),
      });

      const response = await fetch(`http://127.0.0.1:8000/api/v1/subscriptions/admin-subscriptions/?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSubscriptions(data.results || []);
        setTotalCount(data.count || 0);
      } else {
        throw new Error('Failed to fetch subscriptions');
      }
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      setSnackbar({ open: true, message: 'Failed to fetch subscriptions', severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, searchTerm, statusFilter, planFilter]);

  const fetchPlans = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/api/v1/subscriptions/admin-plans/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPlans(data.results || []);
      }
    } catch (error) {
      console.error('Error fetching plans:', error);
    }
  };

  const fetchSubscriptionStats = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/api/v1/subscriptions/admin-stats/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSubscriptionStats(data);
      }
    } catch (error) {
      console.error('Error fetching subscription stats:', error);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
    fetchPlans();
    fetchSubscriptionStats();
  }, [fetchSubscriptions]);

  const handleSearch = () => {
    setPage(0);
    fetchSubscriptions();
  };

  const handleCreatePlan = () => {
    setEditingPlan(null);
    setPlanDialogOpen(true);
  };

  const handleEditPlan = (plan: SubscriptionPlan) => {
    setEditingPlan(plan);
    setPlanDialogOpen(true);
  };

  const handleViewSubscription = (subscription: Subscription) => {
    setSelectedSubscription(subscription);
    setDetailsDialogOpen(true);
  };

  const handlePlanSaved = () => {
    setPlanDialogOpen(false);
    setEditingPlan(null);
    fetchPlans();
    setSnackbar({ 
      open: true, 
      message: editingPlan ? 'Plan updated successfully' : 'Plan created successfully', 
      severity: 'success' 
    });
  };

  const getStatusChip = (status: string) => {
    const statusColors = {
      'active': 'success',
      'expired': 'warning',
      'cancelled': 'error',
      'pending': 'info',
    } as const;

    const statusIcons = {
      'active': <ActiveIcon />,
      'expired': <ExpiredIcon />,
      'cancelled': <CancelledIcon />,
      'pending': <PaymentIcon />,
    };

    return (
      <Chip
        icon={statusIcons[status as keyof typeof statusIcons]}
        label={status.charAt(0).toUpperCase() + status.slice(1)}
        color={statusColors[status as keyof typeof statusColors] || 'default'}
        size="small"
      />
    );
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const StatCard: React.FC<{
    title: string;
    value: number | string;
    icon: React.ReactNode;
    color: string;
    subtitle?: string;
  }> = ({ title, value, icon, color, subtitle }) => (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography color="textSecondary" gutterBottom variant="body2">
              {title}
            </Typography>
            <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
              {value}
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
              Subscription Management
            </Typography>
            <Typography variant="body1" color="textSecondary">
              Manage subscription plans and customer subscriptions
            </Typography>
          </Box>
          <Stack direction="row" spacing={2}>
            <Button
              startIcon={<RefreshIcon />}
              onClick={() => { fetchSubscriptions(); fetchPlans(); fetchSubscriptionStats(); }}
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
              onClick={handleCreatePlan}
            >
              Create Plan
            </Button>
          </Stack>
        </Box>

        {/* Subscription Statistics */}
        {subscriptionStats && (
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Total Subscriptions"
                value={subscriptionStats.totalSubscriptions.toLocaleString()}
                icon={<SubscriptionsIcon />}
                color="primary"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Active Subscriptions"
                value={subscriptionStats.activeSubscriptions.toLocaleString()}
                icon={<ActiveIcon />}
                color="success"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Monthly Revenue"
                value={formatCurrency(subscriptionStats.monthlyRevenue)}
                icon={<MoneyIcon />}
                color="info"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Annual Revenue"
                value={formatCurrency(subscriptionStats.annualRevenue)}
                icon={<BusinessIcon />}
                color="secondary"
              />
            </Grid>
          </Grid>
        )}

        {/* Filters */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                placeholder="Search subscriptions..."
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
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="expired">Expired</MenuItem>
                  <MenuItem value="cancelled">Cancelled</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Plan</InputLabel>
                <Select
                  value={planFilter}
                  label="Plan"
                  onChange={(e) => setPlanFilter(e.target.value)}
                >
                  <MenuItem value="">All Plans</MenuItem>
                  {plans.map((plan) => (
                    <MenuItem key={plan.id} value={plan.id}>
                      {plan.name}
                    </MenuItem>
                  ))}
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

        {/* Subscriptions Table */}
        <Paper>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Customer</TableCell>
                  <TableCell>Plan</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Start Date</TableCell>
                  <TableCell>End Date</TableCell>
                  <TableCell>Next Billing</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {subscriptions.map((subscription) => (
                  <TableRow key={subscription.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar>
                          <PersonIcon />
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 500 }}>
                            {subscription.user.first_name} {subscription.user.last_name}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            {subscription.user.email}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 500 }}>
                          {subscription.plan.name}
                        </Typography>
                        <Chip 
                          label={subscription.plan.interval} 
                          size="small" 
                          variant="outlined" 
                          sx={{ mt: 0.5 }} 
                        />
                      </Box>
                    </TableCell>
                    <TableCell>{getStatusChip(subscription.status)}</TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {formatCurrency(subscription.amount_paid, subscription.plan.currency)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {new Date(subscription.start_date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {new Date(subscription.end_date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {subscription.next_billing_date ? new Date(subscription.next_billing_date).toLocaleDateString() : 'N/A'}
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={1}>
                        <Tooltip title="View Details">
                          <IconButton
                            size="small"
                            onClick={() => handleViewSubscription(subscription)}
                          >
                            <ViewIcon />
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

        {/* Subscription Plans */}
        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" gutterBottom>
            Subscription Plans
          </Typography>
          <Grid container spacing={3}>
            {plans.map((plan) => (
              <Grid item xs={12} md={6} lg={4} key={plan.id}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Typography variant="h6">
                        {plan.name}
                      </Typography>
                      <Chip 
                        label={plan.is_active ? 'Active' : 'Inactive'} 
                        color={plan.is_active ? 'success' : 'default'} 
                        size="small" 
                      />
                    </Box>
                    <Typography variant="h4" color="primary" sx={{ mb: 1 }}>
                      {formatCurrency(plan.price, plan.currency)}
                    </Typography>
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                      per {plan.interval}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                      {plan.description}
                    </Typography>
                    <List dense>
                      {plan.features.slice(0, 3).map((feature, index) => (
                        <ListItem key={index} sx={{ py: 0 }}>
                          <ListItemIcon sx={{ minWidth: 30 }}>
                            <ActiveIcon fontSize="small" color="success" />
                          </ListItemIcon>
                          <ListItemText primary={feature} />
                        </ListItem>
                      ))}
                    </List>
                    <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                      <Button
                        size="small"
                        startIcon={<EditIcon />}
                        onClick={() => handleEditPlan(plan)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="small"
                        startIcon={<ViewIcon />}
                        variant="outlined"
                      >
                        View
                      </Button>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Top Plans */}
        {subscriptionStats && (
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Top Performing Plans
              </Typography>
              <List>
                {subscriptionStats.topPlans.map((plan, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <Typography variant="h6" color="primary">
                        #{index + 1}
                      </Typography>
                    </ListItemIcon>
                    <ListItemText
                      primary={plan.name}
                      secondary={`${plan.count} subscriptions • ${formatCurrency(plan.revenue)} revenue`}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        )}

        {/* Subscription Details Dialog */}
        <Dialog open={detailsDialogOpen} onClose={() => setDetailsDialogOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>Subscription Details</DialogTitle>
          <DialogContent>
            {selectedSubscription && (
              <Box>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" gutterBottom>Customer Information</Typography>
                    <List dense>
                      <ListItem>
                        <ListItemText
                          primary="Name"
                          secondary={`${selectedSubscription.user.first_name} ${selectedSubscription.user.last_name}`}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText
                          primary="Email"
                          secondary={selectedSubscription.user.email}
                        />
                      </ListItem>
                    </List>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" gutterBottom>Subscription Details</Typography>
                    <List dense>
                      <ListItem>
                        <ListItemText
                          primary="Plan"
                          secondary={selectedSubscription.plan.name}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText
                          primary="Status"
                          secondary={selectedSubscription.status}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText
                          primary="Amount Paid"
                          secondary={formatCurrency(selectedSubscription.amount_paid, selectedSubscription.plan.currency)}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText
                          primary="Auto Renew"
                          secondary={selectedSubscription.auto_renew ? 'Yes' : 'No'}
                        />
                      </ListItem>
                    </List>
                  </Grid>
                </Grid>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDetailsDialogOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>

        {/* Plan Form Dialog */}
        <Dialog open={planDialogOpen} onClose={() => setPlanDialogOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>{editingPlan ? 'Edit Plan' : 'Create Plan'}</DialogTitle>
          <DialogContent>
            <Typography>Plan form will be implemented here</Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setPlanDialogOpen(false)}>Cancel</Button>
            <Button onClick={handlePlanSaved} variant="contained">Save</Button>
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

export default AdminSubscriptionsPage; 