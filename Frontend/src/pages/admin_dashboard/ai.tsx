import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
  LinearProgress,
  Switch,
  FormControlLabel,
  Button,
  Stack,
  Alert,
  Snackbar,
} from '@mui/material';
import {
  Psychology,
  TrendingUp,
  TrendingDown,
  Speed,
  DataUsage,
  Settings,
  Refresh,
  PlayArrow,
  Stop,
  Visibility,
  Assessment,
  Timeline,
  BarChart,
  PieChart,
  ShowChart,
  Work,
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import AdminLayout from '../../components/admin_dashboard/AdminLayout';

interface AIMetrics {
  modelPerformance: {
    userEmbedding: {
      accuracy: number;
      f1Score: number;
      inferenceTime: number;
      predictionsCount: number;
    };
    jobEmbedding: {
      accuracy: number;
      f1Score: number;
      inferenceTime: number;
      predictionsCount: number;
    };
    jobMatching: {
      accuracy: number;
      f1Score: number;
      inferenceTime: number;
      predictionsCount: number;
    };
    summaryGeneration: {
      accuracy: number;
      f1Score: number;
      inferenceTime: number;
      predictionsCount: number;
    };
  };
  recommendationPerformance: {
    clickThroughRate: number;
    topRecommendationTypes: Array<{
      type: string;
      count: number;
      successRate: number;
    }>;
    userEngagement: number;
    conversionRate: number;
  };
  userInteractions: Array<{
    id: string;
    user: string;
    interactionType: string;
    jobTitle?: string;
    timestamp: string;
    success: boolean;
  }>;
  systemHealth: {
    activeModels: number;
    totalPredictions: number;
    avgResponseTime: number;
    errorRate: number;
    lastTrainingDate: string;
    nextScheduledTraining: string;
  };
}

const AdminAIPage: React.FC = () => {
  const { user } = useAuth();
  const [aiMetrics, setAiMetrics] = useState<AIMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('24h');
  const [autoRecommendations, setAutoRecommendations] = useState(true);
  const [realTimeProcessing, setRealTimeProcessing] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  useEffect(() => {
    fetchAIMetrics();
  }, [timeRange]);

  const fetchAIMetrics = async () => {
    setLoading(true);
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/v1/ai/admin-metrics/?time_range=${timeRange}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAiMetrics(data);
      } else {
        throw new Error('Failed to fetch AI metrics');
      }
    } catch (error) {
      console.error('Error fetching AI metrics:', error);
      setSnackbar({ open: true, message: 'Failed to fetch AI metrics', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAutoRecommendations = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/api/v1/ai/admin-settings/auto-recommendations/', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ enabled: !autoRecommendations }),
      });

      if (response.ok) {
        setAutoRecommendations(!autoRecommendations);
        setSnackbar({ 
          open: true, 
          message: `Auto recommendations ${!autoRecommendations ? 'enabled' : 'disabled'}`, 
          severity: 'success' 
        });
      } else {
        throw new Error('Failed to update auto recommendations setting');
      }
    } catch (error) {
      console.error('Error updating auto recommendations setting:', error);
      setSnackbar({ open: true, message: 'Failed to update setting', severity: 'error' });
    }
  };

  const handleToggleRealTimeProcessing = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/api/v1/ai/admin-settings/real-time-processing/', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ enabled: !realTimeProcessing }),
      });

      if (response.ok) {
        setRealTimeProcessing(!realTimeProcessing);
        setSnackbar({ 
          open: true, 
          message: `Real-time processing ${!realTimeProcessing ? 'enabled' : 'disabled'}`, 
          severity: 'success' 
        });
      } else {
        throw new Error('Failed to update real-time processing setting');
      }
    } catch (error) {
      console.error('Error updating real-time processing setting:', error);
      setSnackbar({ open: true, message: 'Failed to update setting', severity: 'error' });
    }
  };

  const handleRetrainModels = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/api/v1/ai/admin-actions/retrain-models/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      });

      if (response.ok) {
        setSnackbar({ open: true, message: 'Model retraining initiated', severity: 'success' });
      } else {
        throw new Error('Failed to initiate model retraining');
      }
    } catch (error) {
      console.error('Error initiating model retraining:', error);
      setSnackbar({ open: true, message: 'Failed to initiate retraining', severity: 'error' });
    }
  };

  const MetricCard: React.FC<{
    title: string;
    value: number;
    unit?: string;
    icon: React.ReactNode;
    color: string;
    trend?: number;
    subtitle?: string;
  }> = ({ title, value, unit, icon, color, trend, subtitle }) => (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography color="textSecondary" gutterBottom variant="body2">
              {title}
            </Typography>
            <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
              {value.toFixed(2)}{unit}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                {subtitle}
              </Typography>
            )}
            {trend !== undefined && (
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                {trend > 0 ? (
                  <TrendingUp color="success" fontSize="small" />
                ) : (
                  <TrendingDown color="error" fontSize="small" />
                )}
                <Typography
                  variant="body2"
                  color={trend > 0 ? 'success.main' : 'error.main'}
                  sx={{ ml: 0.5 }}
                >
                  {Math.abs(trend)}% from last period
                </Typography>
              </Box>
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

  if (loading) {
    return (
      <AdminLayout>
        <Box sx={{ p: 3 }}>
          <LinearProgress />
        </Box>
      </AdminLayout>
    );
  }

  if (!aiMetrics) {
    return (
      <AdminLayout>
        <Box sx={{ p: 3 }}>
          <Typography>No AI metrics available</Typography>
        </Box>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
              AI & Machine Learning
            </Typography>
            <Typography variant="body1" color="textSecondary">
              Monitor and manage AI systems and recommendations
            </Typography>
          </Box>
          <Stack direction="row" spacing={2}>
            <FormControl sx={{ minWidth: 120 }}>
              <InputLabel>Time Range</InputLabel>
              <Select
                value={timeRange}
                label="Time Range"
                onChange={(e) => setTimeRange(e.target.value)}
              >
                <MenuItem value="1h">Last hour</MenuItem>
                <MenuItem value="24h">Last 24 hours</MenuItem>
                <MenuItem value="7d">Last 7 days</MenuItem>
                <MenuItem value="30d">Last 30 days</MenuItem>
              </Select>
            </FormControl>
            <Button
              startIcon={<Refresh />}
              onClick={fetchAIMetrics}
              variant="outlined"
            >
              Refresh
            </Button>
          </Stack>
        </Box>

        {/* System Health Overview */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <MetricCard
              title="Active Models"
              value={aiMetrics.systemHealth.activeModels}
              icon={<Psychology />}
              color="primary"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <MetricCard
              title="Total Predictions"
              value={aiMetrics.systemHealth.totalPredictions}
              icon={<DataUsage />}
              color="secondary"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <MetricCard
              title="Avg Response Time"
              value={aiMetrics.systemHealth.avgResponseTime}
              unit="ms"
              icon={<Speed />}
              color="success"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <MetricCard
              title="Error Rate"
              value={aiMetrics.systemHealth.errorRate}
              unit="%"
              icon={<Assessment />}
              color="error"
            />
          </Grid>
        </Grid>

        {/* Model Performance */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Model Performance Metrics
                </Typography>
                <List>
                  <ListItem divider>
                    <ListItemIcon>
                      <Avatar sx={{ bgcolor: 'primary.main' }}>
                        <Psychology />
                      </Avatar>
                    </ListItemIcon>
                    <ListItemText
                      primary="User Embedding Model"
                      secondary={`Accuracy: ${aiMetrics.modelPerformance.userEmbedding.accuracy.toFixed(2)}% | F1: ${aiMetrics.modelPerformance.userEmbedding.f1Score.toFixed(2)}`}
                    />
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="body2" color="textSecondary">
                        {aiMetrics.modelPerformance.userEmbedding.inferenceTime.toFixed(2)}ms
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {aiMetrics.modelPerformance.userEmbedding.predictionsCount} predictions
                      </Typography>
                    </Box>
                  </ListItem>
                  <ListItem divider>
                    <ListItemIcon>
                      <Avatar sx={{ bgcolor: 'secondary.main' }}>
                        <Work />
                      </Avatar>
                    </ListItemIcon>
                    <ListItemText
                      primary="Job Embedding Model"
                      secondary={`Accuracy: ${aiMetrics.modelPerformance.jobEmbedding.accuracy.toFixed(2)}% | F1: ${aiMetrics.modelPerformance.jobEmbedding.f1Score.toFixed(2)}`}
                    />
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="body2" color="textSecondary">
                        {aiMetrics.modelPerformance.jobEmbedding.inferenceTime.toFixed(2)}ms
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {aiMetrics.modelPerformance.jobEmbedding.predictionsCount} predictions
                      </Typography>
                    </Box>
                  </ListItem>
                  <ListItem divider>
                    <ListItemIcon>
                      <Avatar sx={{ bgcolor: 'success.main' }}>
                        <TrendingUp />
                      </Avatar>
                    </ListItemIcon>
                    <ListItemText
                      primary="Job Matching Model"
                      secondary={`Accuracy: ${aiMetrics.modelPerformance.jobMatching.accuracy.toFixed(2)}% | F1: ${aiMetrics.modelPerformance.jobMatching.f1Score.toFixed(2)}`}
                    />
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="body2" color="textSecondary">
                        {aiMetrics.modelPerformance.jobMatching.inferenceTime.toFixed(2)}ms
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {aiMetrics.modelPerformance.jobMatching.predictionsCount} predictions
                      </Typography>
                    </Box>
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <Avatar sx={{ bgcolor: 'warning.main' }}>
                        <Assessment />
                      </Avatar>
                    </ListItemIcon>
                    <ListItemText
                      primary="Summary Generation"
                      secondary={`Accuracy: ${aiMetrics.modelPerformance.summaryGeneration.accuracy.toFixed(2)}% | F1: ${aiMetrics.modelPerformance.summaryGeneration.f1Score.toFixed(2)}`}
                    />
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="body2" color="textSecondary">
                        {aiMetrics.modelPerformance.summaryGeneration.inferenceTime.toFixed(2)}ms
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {aiMetrics.modelPerformance.summaryGeneration.predictionsCount} predictions
                      </Typography>
                    </Box>
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>

          {/* Recommendation Performance */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Recommendation Performance
                </Typography>
                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Click Through Rate</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      {aiMetrics.recommendationPerformance.clickThroughRate.toFixed(2)}%
                    </Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={aiMetrics.recommendationPerformance.clickThroughRate} 
                    color="primary"
                  />
                </Box>
                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">User Engagement</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      {aiMetrics.recommendationPerformance.userEngagement.toFixed(2)}%
                    </Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={aiMetrics.recommendationPerformance.userEngagement} 
                    color="success"
                  />
                </Box>
                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Conversion Rate</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      {aiMetrics.recommendationPerformance.conversionRate.toFixed(2)}%
                    </Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={aiMetrics.recommendationPerformance.conversionRate} 
                    color="warning"
                  />
                </Box>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle2" gutterBottom>
                  Top Recommendation Types
                </Typography>
                <List dense>
                  {aiMetrics.recommendationPerformance.topRecommendationTypes.map((type, index) => (
                    <ListItem key={index}>
                      <ListItemText
                        primary={type.type}
                        secondary={`${type.count} recommendations`}
                      />
                      <Chip 
                        label={`${type.successRate.toFixed(1)}%`} 
                        size="small" 
                        color={type.successRate > 70 ? 'success' : type.successRate > 50 ? 'warning' : 'error'}
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* AI System Settings */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  AI System Settings
                </Typography>
                <Box sx={{ mb: 3 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={autoRecommendations}
                        onChange={handleToggleAutoRecommendations}
                        color="primary"
                      />
                    }
                    label="Auto Recommendations"
                  />
                  <Typography variant="body2" color="textSecondary" sx={{ ml: 4 }}>
                    Automatically generate job recommendations for users
                  </Typography>
                </Box>
                <Box sx={{ mb: 3 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={realTimeProcessing}
                        onChange={handleToggleRealTimeProcessing}
                        color="primary"
                      />
                    }
                    label="Real-time Processing"
                  />
                  <Typography variant="body2" color="textSecondary" sx={{ ml: 4 }}>
                    Process user interactions in real-time
                  </Typography>
                </Box>
                <Box sx={{ mt: 3 }}>
                  <Button
                    startIcon={<PlayArrow />}
                    variant="contained"
                    onClick={handleRetrainModels}
                    fullWidth
                  >
                    Retrain Models
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* System Health */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  System Health
                </Typography>
                <List>
                  <ListItem>
                    <ListItemIcon>
                      <Timeline color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Last Training Date"
                      secondary={new Date(aiMetrics.systemHealth.lastTrainingDate).toLocaleString()}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <Settings color="secondary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Next Scheduled Training"
                      secondary={new Date(aiMetrics.systemHealth.nextScheduledTraining).toLocaleString()}
                    />
                  </ListItem>
                </List>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle2" gutterBottom>
                  System Status
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Chip label="Models Active" color="success" size="small" />
                  <Chip label="Processing Normal" color="success" size="small" />
                  <Chip label="Memory OK" color="success" size="small" />
                  <Chip label="GPU Available" color="success" size="small" />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Recent User Interactions */}
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Recent User Interactions
                </Typography>
                <List>
                  {aiMetrics.userInteractions.slice(0, 10).map((interaction) => (
                    <ListItem key={interaction.id} divider>
                      <ListItemIcon>
                        <Avatar sx={{ bgcolor: interaction.success ? 'success.main' : 'error.main' }}>
                          {interaction.success ? <TrendingUp /> : <TrendingDown />}
                        </Avatar>
                      </ListItemIcon>
                      <ListItemText
                        primary={`${interaction.user} - ${interaction.interactionType}`}
                        secondary={
                          <Box>
                            {interaction.jobTitle && (
                              <Typography variant="body2" color="textSecondary">
                                Job: {interaction.jobTitle}
                              </Typography>
                            )}
                            <Typography variant="caption" color="textSecondary">
                              {new Date(interaction.timestamp).toLocaleString()}
                            </Typography>
                          </Box>
                        }
                      />
                      <Chip 
                        label={interaction.success ? 'Success' : 'Failed'} 
                        size="small" 
                        color={interaction.success ? 'success' : 'error'}
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

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

export default AdminAIPage; 