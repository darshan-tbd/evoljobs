import React from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  useTheme,
  alpha,
  Paper
} from '@mui/material';
import { motion } from 'framer-motion';
import {
  ArrowForward as ArrowForwardIcon,
  TrendingUp as TrendingUpIcon,
  Security as SecurityIcon,
  Speed as SpeedIcon
} from '@mui/icons-material';
import { useRouter } from 'next/router';

const CallToAction: React.FC = () => {
  const theme = useTheme();
  const router = useRouter();

  const benefits = [
    {
      icon: <TrendingUpIcon sx={{ fontSize: 32, color: 'primary.main' }} />,
      title: 'AI-Powered Matching',
      description: 'Get personalized job recommendations'
    },
    {
      icon: <SecurityIcon sx={{ fontSize: 32, color: 'primary.main' }} />,
      title: 'Secure & Private',
      description: 'Your data is protected and confidential'
    },
    {
      icon: <SpeedIcon sx={{ fontSize: 32, color: 'primary.main' }} />,
      title: 'Fast & Efficient',
      description: 'Find jobs 10x faster than traditional methods'
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

  const handleGetStarted = () => {
    router.push('/register');
  };

  const handleLearnMore = () => {
    router.push('/about');
  };

  return (
    <Box
      sx={{
        py: 10,
        position: 'relative',
        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'url(/images/cta-pattern.svg) center/cover',
          opacity: 0.1,
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
          <Grid container spacing={6} alignItems="center">
            <Grid item xs={12} lg={6}>
              <motion.div variants={itemVariants}>
                <Typography
                  variant="h2"
                  component="h2"
                  gutterBottom
                  sx={{
                    fontWeight: 700,
                    color: 'white',
                    mb: 3,
                    fontSize: { xs: '2rem', md: '2.5rem', lg: '3rem' },
                    lineHeight: 1.2,
                  }}
                >
                  Ready to Find Your Dream Job?
                </Typography>
              </motion.div>

              <motion.div variants={itemVariants}>
                <Typography
                  variant="h5"
                  component="p"
                  sx={{
                    color: alpha('#ffffff', 0.9),
                    mb: 4,
                    fontSize: { xs: '1.1rem', md: '1.3rem' },
                    lineHeight: 1.5,
                    fontWeight: 400,
                  }}
                >
                  Join thousands of professionals who have already found their perfect job match. 
                  Get started today and let our AI find opportunities that match your skills and aspirations.
                </Typography>
              </motion.div>

              <motion.div variants={itemVariants}>
                <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', mb: 4 }}>
                  <Button
                    variant="contained"
                    size="large"
                    endIcon={<ArrowForwardIcon />}
                    onClick={handleGetStarted}
                    sx={{
                      bgcolor: 'white',
                      color: 'primary.main',
                      borderRadius: 2,
                      px: 4,
                      py: 1.5,
                      fontSize: '1.1rem',
                      fontWeight: 600,
                      textTransform: 'none',
                      boxShadow: theme.shadows[8],
                      '&:hover': {
                        bgcolor: alpha('#ffffff', 0.95),
                        boxShadow: theme.shadows[12],
                      },
                      transition: 'all 0.3s ease-in-out',
                    }}
                  >
                    Get Started Free
                  </Button>
                  <Button
                    variant="outlined"
                    size="large"
                    onClick={handleLearnMore}
                    sx={{
                      borderColor: 'white',
                      color: 'white',
                      borderRadius: 2,
                      px: 4,
                      py: 1.5,
                      fontSize: '1.1rem',
                      fontWeight: 600,
                      textTransform: 'none',
                      borderWidth: 2,
                      '&:hover': {
                        borderColor: 'white',
                        bgcolor: alpha('#ffffff', 0.1),
                        borderWidth: 2,
                      },
                    }}
                  >
                    Learn More
                  </Button>
                </Box>
              </motion.div>

              <motion.div variants={itemVariants}>
                <Typography
                  variant="body2"
                  sx={{
                    color: alpha('#ffffff', 0.8),
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    flexWrap: 'wrap',
                  }}
                >
                  ✨ <strong>Free to use</strong> • No hidden fees • Cancel anytime
                </Typography>
              </motion.div>
            </Grid>

            <Grid item xs={12} lg={6}>
              <motion.div variants={itemVariants}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {benefits.map((benefit, index) => (
                    <motion.div
                      key={benefit.title}
                      variants={itemVariants}
      
                      transition={{ type: 'spring', stiffness: 300 }}
                    >
                      <Paper
                        elevation={8}
                        sx={{
                          p: 3,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 3,
                          bgcolor: alpha('#ffffff', 0.95),
                          borderRadius: 2,
                          transition: 'all 0.3s ease-in-out',
                          '&:hover': {
                            bgcolor: 'white',
                            boxShadow: theme.shadows[12],
                          },
                        }}
                      >
                        <Box
                          sx={{
                            width: 60,
                            height: 60,
                            borderRadius: '50%',
                            bgcolor: alpha(theme.palette.primary.main, 0.1),
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          {benefit.icon}
                        </Box>
                        <Box>
                          <Typography
                            variant="h6"
                            component="h3"
                            sx={{
                              fontWeight: 600,
                              color: 'text.primary',
                              mb: 0.5,
                            }}
                          >
                            {benefit.title}
                          </Typography>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ lineHeight: 1.5 }}
                          >
                            {benefit.description}
                          </Typography>
                        </Box>
                      </Paper>
                    </motion.div>
                  ))}
                </Box>
              </motion.div>
            </Grid>
          </Grid>

          <motion.div variants={itemVariants}>
            <Box sx={{ textAlign: 'center', mt: 8 }}>
              <Paper
                elevation={8}
                sx={{
                  p: 4,
                  borderRadius: 3,
                  bgcolor: alpha('#ffffff', 0.95),
                  maxWidth: 600,
                  mx: 'auto',
                }}
              >
                <Typography
                  variant="h6"
                  component="h3"
                  gutterBottom
                  sx={{
                    fontWeight: 600,
                    color: 'text.primary',
                    mb: 2,
                  }}
                >
                  Join 50,000+ Professionals Today
                </Typography>
                <Typography
                  variant="body1"
                  color="text.secondary"
                  sx={{ mb: 3 }}
                >
                  Don't miss out on your perfect job opportunity. 
                  Start your journey with JobPilot today.
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
                  <Typography variant="body2" color="text.secondary">
                    🚀 <strong>3 minutes</strong> to set up
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    🎯 <strong>AI-powered</strong> matching
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    📱 <strong>Mobile-friendly</strong> platform
                  </Typography>
                </Box>
              </Paper>
            </Box>
          </motion.div>
        </motion.div>
      </Container>
    </Box>
  );
};

export default CallToAction; 