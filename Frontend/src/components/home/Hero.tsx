import React from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  Button, 
  Grid,
  useTheme,
  useMediaQuery,
  alpha
} from '@mui/material';
import { motion } from 'framer-motion';
import { 
  Search as SearchIcon, 
  TrendingUp as TrendingUpIcon,
  ArrowForward as ArrowForwardIcon
} from '@mui/icons-material';
import { useRouter } from 'next/router';

const Hero: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const router = useRouter();

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
        ease: 'easeOut',
      },
    },
  };

  const handleGetStarted = () => {
    router.push('/register');
  };

  const handleBrowseJobs = () => {
    router.push('/jobs');
  };

  return (
    <Box
      sx={{
        position: 'relative',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)`,
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'url(/images/hero-pattern.svg) center/cover',
          opacity: 0.1,
          zIndex: 0,
        },
      }}
    >
      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Box>
                <motion.div variants={itemVariants}>
                  <Typography
                    variant="h1"
                    component="h1"
                    sx={{
                      fontWeight: 700,
                      fontSize: { xs: '2.5rem', md: '3.5rem', lg: '4rem' },
                      lineHeight: 1.1,
                      mb: 2,
                      background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                    }}
                  >
                    Find Your Dream Job with AI
                  </Typography>
                </motion.div>

                <motion.div variants={itemVariants}>
                  <Typography
                    variant="h5"
                    component="h2"
                    sx={{
                      fontWeight: 400,
                      color: 'text.secondary',
                      mb: 4,
                      fontSize: { xs: '1.1rem', md: '1.3rem' },
                      lineHeight: 1.5,
                    }}
                  >
                    Discover opportunities that match your skills and aspirations. 
                    Our AI-powered platform connects you with the perfect job in seconds.
                  </Typography>
                </motion.div>

                <motion.div variants={itemVariants}>
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 4 }}>
                    <Button
                      variant="contained"
                      size="large"
                      startIcon={<SearchIcon />}
                      onClick={handleGetStarted}
                      sx={{
                        borderRadius: 2,
                        px: 4,
                        py: 1.5,
                        fontSize: '1.1rem',
                        textTransform: 'none',
                        boxShadow: theme.shadows[4],
                        '&:hover': {
                          boxShadow: theme.shadows[8],
                        },
                      }}
                    >
                      Get Started
                    </Button>
                    <Button
                      variant="outlined"
                      size="large"
                      endIcon={<ArrowForwardIcon />}
                      onClick={handleBrowseJobs}
                      sx={{
                        borderRadius: 2,
                        px: 4,
                        py: 1.5,
                        fontSize: '1.1rem',
                        textTransform: 'none',
                        borderWidth: 2,
                        '&:hover': {
                          borderWidth: 2,
                        },
                      }}
                    >
                      Browse Jobs
                    </Button>
                  </Box>
                </motion.div>

                <motion.div variants={itemVariants}>
                  <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <TrendingUpIcon color="primary" />
                      <Typography variant="body1" color="text.secondary">
                        <strong>10,000+</strong> Active Jobs
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <TrendingUpIcon color="primary" />
                      <Typography variant="body1" color="text.secondary">
                        <strong>5,000+</strong> Companies
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <TrendingUpIcon color="primary" />
                      <Typography variant="body1" color="text.secondary">
                        <strong>95%</strong> Success Rate
                      </Typography>
                    </Box>
                  </Box>
                </motion.div>
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <motion.div
                variants={itemVariants}

                transition={{ type: 'spring', stiffness: 300 }}
              >
                <Box
                  sx={{
                    position: 'relative',
                    textAlign: 'center',
                    display: { xs: 'none', md: 'block' },
                  }}
                >
                  {/* Placeholder for hero image/animation */}
                  <Box
                    sx={{
                      width: '100%',
                      height: 400,
                      borderRadius: 3,
                      background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.2)} 0%, ${alpha(theme.palette.secondary.main, 0.2)} 100%)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: `2px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                      boxShadow: theme.shadows[8],
                    }}
                  >
                    <Typography
                      variant="h6"
                      color="primary"
                      sx={{ textAlign: 'center', opacity: 0.7 }}
                    >
                      🚀 Hero Image/Animation
                      <br />
                      Placeholder
                    </Typography>
                  </Box>
                  
                  {/* Floating cards animation */}
                  <motion.div
                    animate={{
                      y: [0, -10, 0],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                    style={{
                      position: 'absolute',
                      top: 20,
                      right: 20,
                    }}
                  >
                    <Box
                      sx={{
                        bgcolor: 'background.paper',
                        borderRadius: 2,
                        p: 2,
                        boxShadow: theme.shadows[4],
                        minWidth: 120,
                      }}
                    >
                      <Typography variant="body2" color="primary" fontWeight="bold">
                        New Job Alert!
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        React Developer
                      </Typography>
                    </Box>
                  </motion.div>

                  <motion.div
                    animate={{
                      y: [0, 10, 0],
                    }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                    style={{
                      position: 'absolute',
                      bottom: 20,
                      left: 20,
                    }}
                  >
                    <Box
                      sx={{
                        bgcolor: 'background.paper',
                        borderRadius: 2,
                        p: 2,
                        boxShadow: theme.shadows[4],
                        minWidth: 120,
                      }}
                    >
                      <Typography variant="body2" color="secondary" fontWeight="bold">
                        Match Found!
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        98% Compatible
                      </Typography>
                    </Box>
                  </motion.div>
                </Box>
              </motion.div>
            </Grid>
          </Grid>
        </motion.div>
      </Container>
    </Box>
  );
};

export default Hero; 