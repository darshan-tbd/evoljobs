import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  Alert,
  Box,
  Typography,
  Button,
  LinearProgress,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
} from '@mui/material';
import {
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  Upgrade as UpgradeIcon,
  Business as BusinessIcon,
} from '@mui/icons-material';

interface SubscriptionLimitWarningProps {
  jobId?: string;
  onCheckLimit?: (canApply: boolean) => void;
}

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

interface LimitCheck {
  can_apply: boolean;
  remaining_applications: number;
  daily_limit: number;
  used_today: number;
  job_company_id: string;
}

const SubscriptionLimitWarning: React.FC<SubscriptionLimitWarningProps> = ({ 
  jobId, 
  onCheckLimit 
}) => {
  const router = useRouter();
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [limitCheck, setLimitCheck] = useState<LimitCheck | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);

  useEffect(() => {
    fetchSubscriptionStatus();
    if (jobId) {
      checkLimit();
    }
  }, [jobId]);

  const fetchSubscriptionStatus = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;

      const response = await fetch('http://127.0.0.1:8000/api/v1/subscriptions/subscriptions/status/', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSubscriptionStatus(data);
      }
    } catch (err) {
      console.error('Error fetching subscription status:', err);
    } finally {
      setLoading(false);
    }
  };

  const checkLimit = async () => {
    if (!jobId) return;

    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;

      const response = await fetch(`http://127.0.0.1:8000/api/v1/subscriptions/limits/check_limit/?job_id=${jobId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setLimitCheck(data);
        onCheckLimit?.(data.can_apply);
      }
    } catch (err) {
      console.error('Error checking limit:', err);
    }
  };

  if (loading) {
    return (
      <Box sx={{ mb: 2 }}>
        <LinearProgress />
        <Typography variant="body2" sx={{ mt: 1 }}>
          Checking subscription limits...
        </Typography>
      </Box>
    );
  }

  if (!subscriptionStatus) {
    return null;
  }

  const progressPercentage = (subscriptionStatus.used_today / subscriptionStatus.daily_limit) * 100;
  const isNearLimit = subscriptionStatus.remaining_today <= 2;
  const isAtLimit = subscriptionStatus.remaining_today === 0;
  const cannotApply = limitCheck && !limitCheck.can_apply;

  // Don't show warning if user can apply and is not near limit
  if (!isNearLimit && !isAtLimit && !cannotApply) {
    return null;
  }

  return (
    <Box sx={{ mb: 3 }}>
      {/* Limit Warning */}
      {isAtLimit && (
        <Alert 
          severity="error" 
          icon={<WarningIcon />}
          action={
            <Button 
              color="inherit" 
              size="small" 
              onClick={() => setUpgradeDialogOpen(true)}
              startIcon={<UpgradeIcon />}
            >
              Upgrade
            </Button>
          }
        >
          <Typography variant="body2" sx={{ mb: 1 }}>
            You've reached your daily application limit of {subscriptionStatus.daily_limit} companies.
          </Typography>
          <Typography variant="body2">
            Upgrade your subscription to apply to more companies per day.
          </Typography>
        </Alert>
      )}

      {/* Near Limit Warning */}
      {isNearLimit && !isAtLimit && (
        <Alert 
          severity="warning" 
          icon={<WarningIcon />}
          action={
            <Button 
              color="inherit" 
              size="small" 
              onClick={() => setUpgradeDialogOpen(true)}
              startIcon={<UpgradeIcon />}
            >
              Upgrade
            </Button>
          }
        >
          <Typography variant="body2" sx={{ mb: 1 }}>
            You're approaching your daily limit. Only {subscriptionStatus.remaining_today} applications remaining.
          </Typography>
          <Box sx={{ mt: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="caption">
                Daily Usage: {subscriptionStatus.used_today}/{subscriptionStatus.daily_limit}
              </Typography>
              <Typography variant="caption">
                {subscriptionStatus.remaining_today} remaining
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={progressPercentage}
              color="warning"
              sx={{ height: 6, borderRadius: 3 }}
            />
          </Box>
        </Alert>
      )}

      {/* Cannot Apply to This Company */}
      {cannotApply && (
        <Alert 
          severity="info" 
          icon={<BusinessIcon />}
          action={
            <Button 
              color="inherit" 
              size="small" 
              onClick={() => setUpgradeDialogOpen(true)}
              startIcon={<UpgradeIcon />}
            >
              Upgrade
            </Button>
          }
        >
          <Typography variant="body2">
            You have already applied to this company today. You can apply to {limitCheck?.remaining_applications} more companies today.
          </Typography>
        </Alert>
      )}

      {/* Current Plan Info */}
      <Paper elevation={1} sx={{ mt: 2, p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="body2" fontWeight="medium">
            Current Plan: {subscriptionStatus.plan_name}
          </Typography>
          <Chip 
            label={subscriptionStatus.plan_type.toUpperCase()} 
            size="small" 
            color={subscriptionStatus.plan_type === 'free' ? 'default' : 'primary'}
          />
        </Box>
        <Typography variant="body2" color="textSecondary">
          {subscriptionStatus.daily_limit} companies per day • {subscriptionStatus.used_today} used today
        </Typography>
      </Paper>

      {/* Upgrade Dialog */}
      <Dialog open={upgradeDialogOpen} onClose={() => setUpgradeDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Upgrade Your Subscription</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Upgrade your subscription to unlock more daily applications and premium features.
          </Typography>
          
          <List>
            <ListItem>
              <ListItemIcon>
                <CheckIcon color="success" />
              </ListItemIcon>
              <ListItemText 
                primary="More Daily Applications" 
                secondary="Apply to more companies per day"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <CheckIcon color="success" />
              </ListItemIcon>
              <ListItemText 
                primary="Premium Features" 
                secondary="Advanced job search and AI recommendations"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <CheckIcon color="success" />
              </ListItemIcon>
              <ListItemText 
                primary="Priority Support" 
                secondary="Get help when you need it"
              />
            </ListItem>
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUpgradeDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={() => {
              setUpgradeDialogOpen(false);
              router.push('/subscription');
            }} 
            variant="contained"
          >
            View Plans
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SubscriptionLimitWarning; 