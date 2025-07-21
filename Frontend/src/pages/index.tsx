import React from 'react';
import { NextPage } from 'next';
import { 
  Box, 
  Container, 
  Typography, 
  Button, 
  Grid, 
  Card, 
  CardContent,
  useTheme,
  useMediaQuery 
} from '@mui/material';
import { motion } from 'framer-motion';
import { 
  Search as SearchIcon, 
  TrendingUp as TrendingUpIcon, 
  Security as SecurityIcon,
  Speed as SpeedIcon,
  Psychology as IntelligenceIcon,
  Group as GroupIcon 
} from '@mui/icons-material';

// Components
import SEO from '@/components/SEO';
import Hero from '@/components/home/Hero';
import JobSearchSection from '@/components/home/JobSearchSection';
import FeaturedJobs from '@/components/home/FeaturedJobs';
import HowItWorks from '@/components/home/HowItWorks';
import Stats from '@/components/home/Stats';
import Testimonials from '@/components/home/Testimonials';
import CallToAction from '@/components/home/CallToAction';

// Hooks
import { useAuth } from '@/hooks/useAuth';

const features = [
  {
    icon: <IntelligenceIcon color="primary" sx={{ fontSize: 48 }} />,
    title: 'AI-Powered Matching',
    description: 'Our advanced AI analyzes your skills and experience to match you with the perfect job opportunities.',
  },
  {
    icon: <SearchIcon color="primary" sx={{ fontSize: 48 }} />,
    title: 'Smart Job Search',
    description: 'Intelligent search filters help you find jobs that match your preferences and career goals.',
  },
  {
    icon: <SpeedIcon color="primary" sx={{ fontSize: 48 }} />,
    title: 'Real-time Updates',
    description: 'Get instant notifications about new job openings and application status updates.',
  },
  {
    icon: <SecurityIcon color="primary" sx={{ fontSize: 48 }} />,
    title: 'Secure Platform',
    description: 'Your data is protected with enterprise-grade security and privacy measures.',
  },
  {
    icon: <TrendingUpIcon color="primary" sx={{ fontSize: 48 }} />,
    title: 'Career Growth',
    description: 'Track your career progress and get personalized recommendations for skill development.',
  },
  {
    icon: <GroupIcon color="primary" sx={{ fontSize: 48 }} />,
    title: 'Community Network',
    description: 'Connect with other professionals and expand your professional network.',
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.5,
    },
  },
};

const HomePage: NextPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user } = useAuth();

  return (
    <>
      <SEO
        title="JobPilot - AI-Powered Job Search Platform"
        description="Find your dream job with JobPilot's AI-powered job search platform. Connect with top employers and advance your career today."
        keywords="job search, career, employment, AI jobs, job matching, professional network"
      />

      {/* Hero Section */}
      <Hero />

      {/* Job Search Section */}
      <JobSearchSection />

      {/* Featured Jobs */}
      <FeaturedJobs />

      {/* Features Section */}
      <Box sx={{ py: 8, bgcolor: 'background.default' }}>
        <Container maxWidth="lg">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={containerVariants}
          >
            <Typography 
              variant="h2" 
              component="h2" 
              align="center" 
              gutterBottom
              sx={{ mb: 6 }}
            >
              Why Choose JobPilot?
            </Typography>
            
            <Grid container spacing={4}>
              {features.map((feature, index) => (
                <Grid item xs={12} md={6} lg={4} key={index}>
                  <motion.div variants={itemVariants}>
                    <Card
                      sx={{
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        transition: 'all 0.3s ease-in-out',
                        '&:hover': {
                          boxShadow: theme.shadows[8],
                        },
                      }}
                    >
                      <CardContent sx={{ flex: 1, textAlign: 'center', p: 3 }}>
                        <Box sx={{ mb: 2 }}>
                          {feature.icon}
                        </Box>
                        <Typography variant="h5" component="h3" gutterBottom>
                          {feature.title}
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                          {feature.description}
                        </Typography>
                      </CardContent>
                    </Card>
                  </motion.div>
                </Grid>
              ))}
            </Grid>
          </motion.div>
        </Container>
      </Box>

      {/* How It Works */}
      <HowItWorks />

      {/* Stats Section */}
      <Stats />

      {/* Testimonials */}
      <Testimonials />

      {/* Call to Action */}
      <CallToAction />
    </>
  );
};

export default HomePage; 