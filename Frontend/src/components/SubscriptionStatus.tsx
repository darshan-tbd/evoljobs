import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  LinearProgress,
  Button,
  Alert,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Upgrade as UpgradeIcon,
  Business as BusinessIcon,
  TrendingUp as TrendingIcon,
  AccessTime as TimeIcon,
} from '@mui/icons-material';

interface SubscriptionStatus {
  has_active_subscription: boolean;
  plan_name: string;
  plan_type: string;
  daily_limit: number;
  used_today: number;
  remaining_today: number;
  companies_applied_today: string[];
  subscription_end_date: string | null;
  days_remaining: number;
  is_expired: boolean;
  features: string[];
  price: number;
}

interface SubscriptionPlans {
  id: string;
  name: string;
  description: string;
  price: number;
  plan_type: string;
  daily_application_limit: number;
  features: string[];
}

const SubscriptionStatus: React.FC = () => {
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [availablePlans, setAvailablePlans] = useState<SubscriptionPlans[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);

  useEffect(() => {
    fetchSubscriptionStatus();
    fetchAvailablePlans();
  }, []);

  const fetchSubscriptionStatus = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        setError('Authentication required');
        return;
      }

      const response = await fetch('http://127.0.0.1:8000/api/v1/subscriptions/subscriptions/status/', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSubscriptionStatus(data);
      } else {
        setError('Failed to fetch subscription status');
      }
    } catch (err) {
      setError('Error fetching subscription status');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailablePlans = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/api/v1/subscriptions/plans/');
      if (response.ok) {
        const data = await response.json();
        setAvailablePlans(data.results || data);
      }
    } catch (err) {
      console.error('Error fetching available plans:', err);
    }
  };

  const handleUpgrade = async (planId: string) => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        setError('Authentication required');
        return;
      }

      const response = await fetch('http://127.0.0.1:8000/api/v1/subscriptions/subscriptions/subscribe/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ plan_id: planId }),
      });

      if (response.ok) {
        setUpgradeDialogOpen(false);
        fetchSubscriptionStatus(); // Refresh status
        alert('Subscription upgraded successfully!');
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to upgrade subscription');
      }
    } catch (err) {
      setError('Error upgrading subscription');
    }
  };

  if (loading) {
    return (
      <Box sx={{ width: '100%' }}>
        <LinearProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  if (!subscriptionStatus) {
    return (
      <Alert severity="info" sx={{ mb: 2 }}>
        Unable to load subscription status
      </Alert>
    );
  }

  const progressPercentage = (subscriptionStatus.used_today / subscriptionStatus.daily_limit) * 100;
  const isNearLimit = subscriptionStatus.remaining_today <= 2;
  const isAtLimit = subscriptionStatus.remaining_today === 0;

  return (
    <Box>
      {/* Current Plan Status */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Box>
              <Typography variant="h6" gutterBottom>
                {subscriptionStatus.plan_name}
              </Typography>
              <Chip
                label={subscriptionStatus.plan_type.toUpperCase()}
                color={subscriptionStatus.plan_type === 'free' ? 'default' : 'primary'}
                size="small"
                sx={{ mb: 1 }}
              />
              {subscriptionStatus.has_active_subscription && (
                <Typography variant="body2" color="textSecondary">
                  ${subscriptionStatus.price}/month
                </Typography>
              )}
            </Box>
            <Button
              variant="outlined"
              startIcon={<UpgradeIcon />}
              onClick={() => setUpgradeDialogOpen(true)}
              size="small"
            >
              Upgrade
            </Button>
          </Box>

          {/* Daily Usage Progress */}
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2">
                Daily Applications: {subscriptionStatus.used_today}/{subscriptionStatus.daily_limit}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {subscriptionStatus.remaining_today} remaining
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={progressPercentage}
              color={isAtLimit ? 'error' : isNearLimit ? 'warning' : 'primary'}
              sx={{ height: 8, borderRadius: 4 }}
            />
          </Box>

          {/* Status Alerts */}
          {isAtLimit && (
            <Alert severity="error" sx={{ mb: 2 }}>
              You've reached your daily application limit. Upgrade your plan to apply to more companies.
            </Alert>
          )}
          {isNearLimit && !isAtLimit && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              You're approaching your daily limit. Only {subscriptionStatus.remaining_today} applications remaining.
            </Alert>
          )}

          {/* Subscription Expiry */}
          {subscriptionStatus.has_active_subscription && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="textSecondary">
                <TimeIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                {subscriptionStatus.days_remaining > 0
                  ? `${subscriptionStatus.days_remaining} days remaining`
                  : 'Subscription expired'}
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Features List */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Plan Features
          </Typography>
          <List dense>
            {subscriptionStatus.features.map((feature, index) => (
              <ListItem key={index} sx={{ py: 0.5 }}>
                <ListItemIcon sx={{ minWidth: 30 }}>
                  <CheckIcon color="success" fontSize="small" />
                </ListItemIcon>
                <ListItemText primary={feature} />
              </ListItem>
            ))}
          </List>
        </CardContent>
      </Card>

      {/* Today's Activity */}
      {subscriptionStatus.companies_applied_today.length > 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Companies Applied Today
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {subscriptionStatus.companies_applied_today.length} companies
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* Upgrade Dialog */}
      <Dialog open={upgradeDialogOpen} onClose={() => setUpgradeDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Upgrade Your Subscription</DialogTitle>
        <DialogContent>
          <Grid container spacing={3}>
            {availablePlans
              .filter(plan => plan.plan_type !== subscriptionStatus.plan_type)
              .map((plan) => (
                <Grid item xs={12} md={6} key={plan.id}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        {plan.name}
                      </Typography>
                      <Typography variant="h4" color="primary" gutterBottom>
                        ${plan.price}/month
                      </Typography>
                      <Typography variant="body2" color="textSecondary" gutterBottom>
                        {plan.daily_application_limit} companies per day
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 2 }}>
                        {plan.description}
                      </Typography>
                      <List dense>
                        {plan.features.slice(0, 5).map((feature, index) => (
                          <ListItem key={index} sx={{ py: 0 }}>
                            <ListItemIcon sx={{ minWidth: 30 }}>
                              <CheckIcon color="success" fontSize="small" />
                            </ListItemIcon>
                            <ListItemText primary={feature} />
                          </ListItem>
                        ))}
                      </List>
                      <Button
                        variant="contained"
                        fullWidth
                        onClick={() => handleUpgrade(plan.id)}
                        sx={{ mt: 2 }}
                      >
                        Upgrade to {plan.name}
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUpgradeDialogOpen(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SubscriptionStatus; 