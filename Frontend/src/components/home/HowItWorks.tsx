import React from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  useTheme,
  alpha,
  Step,
  StepLabel,
  Stepper,
  useMediaQuery
} from '@mui/material';
import { motion } from 'framer-motion';
import {
  PersonAdd as PersonAddIcon,
  Search as SearchIcon,
  Send as SendIcon,
  Work as WorkIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';

interface ProcessStep {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

const HowItWorks: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const steps: ProcessStep[] = [
    {
      title: 'Create Profile',
      description: 'Sign up and create your professional profile with your skills, experience, and career preferences.',
      icon: <PersonAddIcon sx={{ fontSize: 40 }} />,
      color: theme.palette.primary.main
    },
    {
      title: 'AI Matching',
      description: 'Our AI analyzes your profile and matches you with relevant job opportunities that fit your criteria.',
      icon: <SearchIcon sx={{ fontSize: 40 }} />,
      color: theme.palette.secondary.main
    },
    {
      title: 'Apply to Jobs',
      description: 'Browse and apply to jobs with one click. Our system optimizes your application for each position.',
      icon: <SendIcon sx={{ fontSize: 40 }} />,
      color: theme.palette.success.main
    },
    {
      title: 'Get Hired',
      description: 'Track your applications, schedule interviews, and land your dream job with our comprehensive support.',
      icon: <WorkIcon sx={{ fontSize: 40 }} />,
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

  return (
    <Box 
      sx={{ 
        py: 8, 
        bgcolor: 'background.paper',
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
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
                How It Works
              </Typography>
              <Typography
                variant="body1"
                color="text.secondary"
                sx={{ maxWidth: 600, mx: 'auto' }}
              >
                Getting started with JobPilot is simple. Follow these four easy steps 
                to find your perfect job match powered by AI.
              </Typography>
            </Box>
          </motion.div>

          {/* Desktop View - Horizontal Stepper */}
          {!isMobile && (
            <motion.div variants={itemVariants}>
              <Box sx={{ mb: 6 }}>
                <Stepper
                  activeStep={-1}
                  alternativeLabel
                  sx={{
                    '& .MuiStepConnector-line': {
                      borderColor: alpha(theme.palette.primary.main, 0.3),
                      borderWidth: 2,
                    },
                    '& .MuiStepLabel-label': {
                      color: 'text.primary',
                      fontWeight: 600,
                    },
                  }}
                >
                  {steps.map((step, index) => (
                    <Step key={step.title}>
                      <StepLabel
                        StepIconComponent={() => (
                          <Box
                            sx={{
                              width: 60,
                              height: 60,
                              borderRadius: '50%',
                              background: `linear-gradient(135deg, ${step.color} 0%, ${alpha(step.color, 0.7)} 100%)`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'white',
                              boxShadow: theme.shadows[4],
                              mb: 2,
                            }}
                          >
                            {step.icon}
                          </Box>
                        )}
                      >
                        <Typography variant="h6" sx={{ fontWeight: 600, mt: 1 }}>
                          {step.title}
                        </Typography>
                      </StepLabel>
                    </Step>
                  ))}
                </Stepper>
              </Box>
            </motion.div>
          )}

          {/* Mobile/Tablet View - Cards */}
          <Grid container spacing={4}>
            {steps.map((step, index) => (
              <Grid item xs={12} md={isMobile ? 12 : 6} key={step.title}>
                <motion.div
                  variants={itemVariants}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <Card
                    sx={{
                      height: '100%',
                      borderRadius: 3,
                      overflow: 'hidden',
                      border: `1px solid ${alpha(step.color, 0.2)}`,
                      transition: 'all 0.3s ease-in-out',
                      '&:hover': {
                        boxShadow: theme.shadows[8],
                        borderColor: step.color,
                      },
                    }}
                  >
                    <CardContent sx={{ p: 4, textAlign: 'center' }}>
                      <Box
                        sx={{
                          width: 80,
                          height: 80,
                          borderRadius: '50%',
                          background: `linear-gradient(135deg, ${step.color} 0%, ${alpha(step.color, 0.7)} 100%)`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          mx: 'auto',
                          mb: 3,
                          boxShadow: theme.shadows[4],
                        }}
                      >
                        {step.icon}
                      </Box>

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
                        {index + 1}. {step.title}
                      </Typography>

                      <Typography
                        variant="body1"
                        color="text.secondary"
                        sx={{ lineHeight: 1.6 }}
                      >
                        {step.description}
                      </Typography>
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>
            ))}
          </Grid>

          <motion.div variants={itemVariants}>
            <Box sx={{ textAlign: 'center', mt: 6 }}>
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 1,
                  px: 3,
                  py: 1.5,
                  borderRadius: 2,
                  bgcolor: alpha(theme.palette.success.main, 0.1),
                  border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
                }}
              >
                <CheckCircleIcon sx={{ color: 'success.main', fontSize: 20 }} />
                <Typography
                  variant="body2"
                  sx={{ color: 'success.main', fontWeight: 600 }}
                >
                  Average time to get hired: 2-3 weeks
                </Typography>
              </Box>
            </Box>
          </motion.div>
        </motion.div>
      </Container>
    </Box>
  );
};

export default HowItWorks; 