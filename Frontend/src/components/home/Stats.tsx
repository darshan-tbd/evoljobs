import React from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  useTheme,
  alpha,
  Paper
} from '@mui/material';
import { motion } from 'framer-motion';
import {
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  Business as BusinessIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';

interface Stat {
  value: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

const Stats: React.FC = () => {
  const theme = useTheme();

  const stats: Stat[] = [
    {
      value: '50,000+',
      label: 'Active Job Seekers',
      description: 'Talented professionals using our platform',
      icon: <PeopleIcon sx={{ fontSize: 40 }} />,
      color: theme.palette.primary.main
    },
    {
      value: '2,500+',
      label: 'Partner Companies',
      description: 'Leading employers trust our platform',
      icon: <BusinessIcon sx={{ fontSize: 40 }} />,
      color: theme.palette.secondary.main
    },
    {
      value: '15,000+',
      label: 'Job Opportunities',
      description: 'New positions posted every week',
      icon: <TrendingUpIcon sx={{ fontSize: 40 }} />,
      color: theme.palette.success.main
    },
    {
      value: '95%',
      label: 'Success Rate',
      description: 'Of users find jobs within 3 months',
      icon: <CheckCircleIcon sx={{ fontSize: 40 }} />,
      color: theme.palette.warning.main
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.6,
      },
    },
  };

  const counterVariants = {
    hidden: { scale: 0.8, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 100,
        damping: 15,
      },
    },
  };

  return (
    <Box
      sx={{
        py: 8,
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'url(/images/stats-pattern.svg) center/cover',
          opacity: 0.03,
          zIndex: 0,
        },
      }}
    >
      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={containerVariants}
        >
          <motion.div variants={itemVariants}>
            <Box sx={{ textAlign: 'center', mb: 8 }}>
              <Typography
                variant="h3"
                component="h2"
                gutterBottom
                sx={{
                  fontWeight: 600,
                  mb: 2,
                  color: 'text.primary',
                }}
              >
                Trusted by Thousands
              </Typography>
              <Typography
                variant="body1"
                color="text.secondary"
                sx={{ maxWidth: 600, mx: 'auto' }}
              >
                Join a growing community of professionals who have found their dream jobs 
                through our AI-powered platform. Here's what we've achieved together.
              </Typography>
            </Box>
          </motion.div>

          <Grid container spacing={4}>
            {stats.map((stat, index) => (
              <Grid item xs={12} sm={6} md={3} key={stat.label}>
                <motion.div
                  variants={itemVariants}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <Paper
                    elevation={4}
                    sx={{
                      p: 4,
                      textAlign: 'center',
                      height: '100%',
                      borderRadius: 3,
                      background: theme.palette.background.paper,
                      border: `1px solid ${alpha(stat.color, 0.2)}`,
                      position: 'relative',
                      overflow: 'hidden',
                      transition: 'all 0.3s ease-in-out',
                      '&:hover': {
                        boxShadow: theme.shadows[12],
                        borderColor: stat.color,
                      },
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: 4,
                        background: `linear-gradient(90deg, ${stat.color} 0%, ${alpha(stat.color, 0.7)} 100%)`,
                      },
                    }}
                  >
                    <Box
                      sx={{
                        width: 80,
                        height: 80,
                        borderRadius: '50%',
                        background: `linear-gradient(135deg, ${alpha(stat.color, 0.1)} 0%, ${alpha(stat.color, 0.2)} 100%)`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: stat.color,
                        mx: 'auto',
                        mb: 3,
                        border: `2px solid ${alpha(stat.color, 0.2)}`,
                      }}
                    >
                      {stat.icon}
                    </Box>

                    <motion.div
                      variants={counterVariants}
                      whileInView="visible"
                      viewport={{ once: true }}
                    >
                      <Typography
                        variant="h3"
                        component="div"
                        sx={{
                          fontWeight: 700,
                          color: stat.color,
                          mb: 1,
                          fontSize: { xs: '2rem', md: '2.5rem' },
                        }}
                      >
                        {stat.value}
                      </Typography>
                    </motion.div>

                    <Typography
                      variant="h6"
                      component="h3"
                      sx={{
                        fontWeight: 600,
                        color: 'text.primary',
                        mb: 1,
                      }}
                    >
                      {stat.label}
                    </Typography>

                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ lineHeight: 1.5 }}
                    >
                      {stat.description}
                    </Typography>
                  </Paper>
                </motion.div>
              </Grid>
            ))}
          </Grid>

          <motion.div variants={itemVariants}>
            <Box sx={{ textAlign: 'center', mt: 8 }}>
              <Typography
                variant="h5"
                component="h3"
                gutterBottom
                sx={{
                  fontWeight: 600,
                  color: 'text.primary',
                  mb: 2,
                }}
              >
                Why Choose JobPilot?
              </Typography>
              <Grid container spacing={2} justifyContent="center">
                <Grid item xs={12} md={4}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                    <CheckCircleIcon sx={{ color: 'success.main', fontSize: 20 }} />
                    <Typography variant="body1" color="text.secondary">
                      AI-Powered Matching
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                    <CheckCircleIcon sx={{ color: 'success.main', fontSize: 20 }} />
                    <Typography variant="body1" color="text.secondary">
                      Verified Companies
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                    <CheckCircleIcon sx={{ color: 'success.main', fontSize: 20 }} />
                    <Typography variant="body1" color="text.secondary">
                      24/7 Support
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </motion.div>
        </motion.div>
      </Container>
    </Box>
  );
};

export default Stats; 