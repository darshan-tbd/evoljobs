import React from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Avatar,
  Rating,
  useTheme,
  alpha,
  Paper
} from '@mui/material';
import { motion } from 'framer-motion';
import {
  FormatQuote as QuoteIcon,
  Star as StarIcon
} from '@mui/icons-material';

interface Testimonial {
  id: string;
  name: string;
  role: string;
  company: string;
  avatar: string;
  rating: number;
  content: string;
  location: string;
}

const Testimonials: React.FC = () => {
  const theme = useTheme();

  const testimonials: Testimonial[] = [
    {
      id: '1',
      name: 'Sarah Johnson',
      role: 'Senior Developer',
      company: 'TechCorp',
      avatar: '/images/avatars/sarah.jpg',
      rating: 5,
      content: 'JobPilot completely transformed my job search. The AI matching was incredibly accurate, and I landed my dream job within 3 weeks. The platform is intuitive and the support team is fantastic.',
      location: 'San Francisco, CA'
    },
    {
      id: '2',
      name: 'Michael Chen',
      role: 'Product Manager',
      company: 'InnovateLabs',
      avatar: '/images/avatars/michael.jpg',
      rating: 5,
      content: 'I was skeptical about AI-powered job matching, but JobPilot proved me wrong. The quality of job recommendations was outstanding, and I received multiple offers from top companies.',
      location: 'New York, NY'
    },
    {
      id: '3',
      name: 'Emily Rodriguez',
      role: 'UX Designer',
      company: 'DesignStudio',
      avatar: '/images/avatars/emily.jpg',
      rating: 5,
      content: 'The user experience on JobPilot is exceptional. As a designer, I appreciate the clean interface and thoughtful features. It made my job search stress-free and efficient.',
      location: 'Los Angeles, CA'
    },
    {
      id: '4',
      name: 'David Kim',
      role: 'Data Scientist',
      company: 'DataCorp',
      avatar: '/images/avatars/david.jpg',
      rating: 5,
      content: 'JobPilot\'s analytics and insights helped me understand my market value better. The platform connected me with opportunities I never would have found otherwise.',
      location: 'Boston, MA'
    },
    {
      id: '5',
      name: 'Jessica Thompson',
      role: 'Marketing Manager',
      company: 'GrowthCo',
      avatar: '/images/avatars/jessica.jpg',
      rating: 5,
      content: 'I love how JobPilot learns from your preferences and gets better over time. The personalized job recommendations saved me hours of searching and helped me find the perfect role.',
      location: 'Austin, TX'
    },
    {
      id: '6',
      name: 'Alex Morgan',
      role: 'DevOps Engineer',
      company: 'CloudWorks',
      avatar: '/images/avatars/alex.jpg',
      rating: 5,
      content: 'The remote job filtering feature is amazing. As someone looking for fully remote positions, JobPilot made it easy to find legitimate remote opportunities with great companies.',
      location: 'Seattle, WA'
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
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
    <Box sx={{ py: 8, bgcolor: 'background.default' }}>
      <Container maxWidth="lg">
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
                What Our Users Say
              </Typography>
              <Typography
                variant="body1"
                color="text.secondary"
                sx={{ maxWidth: 600, mx: 'auto' }}
              >
                Don't just take our word for it. Here's what real professionals 
                have to say about their experience with JobPilot.
              </Typography>
            </Box>
          </motion.div>

          <Grid container spacing={4}>
            {testimonials.map((testimonial, index) => (
              <Grid item xs={12} md={6} lg={4} key={testimonial.id}>
                <motion.div
                  variants={itemVariants}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <Card
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      borderRadius: 3,
                      position: 'relative',
                      overflow: 'hidden',
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                      transition: 'all 0.3s ease-in-out',
                      '&:hover': {
                        boxShadow: theme.shadows[12],
                        borderColor: theme.palette.primary.main,
                      },
                    }}
                  >
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 16,
                        right: 16,
                        opacity: 0.1,
                        zIndex: 1,
                      }}
                    >
                      <QuoteIcon sx={{ fontSize: 48, color: 'primary.main' }} />
                    </Box>

                    <CardContent sx={{ flex: 1, p: 4, position: 'relative', zIndex: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                        <Avatar
                          src={testimonial.avatar}
                          alt={testimonial.name}
                          sx={{
                            width: 56,
                            height: 56,
                            mr: 2,
                            border: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                          }}
                        >
                          {testimonial.name.split(' ').map(n => n[0]).join('')}
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Typography
                            variant="h6"
                            component="h3"
                            sx={{ fontWeight: 600, mb: 0.5 }}
                          >
                            {testimonial.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                            {testimonial.role} at {testimonial.company}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {testimonial.location}
                          </Typography>
                        </Box>
                      </Box>

                      <Rating
                        value={testimonial.rating}
                        readOnly
                        size="small"
                        sx={{ mb: 2 }}
                      />

                      <Typography
                        variant="body1"
                        color="text.secondary"
                        sx={{
                          lineHeight: 1.6,
                          fontStyle: 'italic',
                          position: 'relative',
                        }}
                      >
                        "{testimonial.content}"
                      </Typography>
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>
            ))}
          </Grid>

          <motion.div variants={itemVariants}>
            <Box sx={{ textAlign: 'center', mt: 8 }}>
              <Paper
                elevation={4}
                sx={{
                  p: 4,
                  borderRadius: 3,
                  background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)`,
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                  maxWidth: 600,
                  mx: 'auto',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                  <StarIcon sx={{ color: 'warning.main', mr: 1 }} />
                  <Typography
                    variant="h5"
                    component="h3"
                    sx={{ fontWeight: 600, color: 'text.primary' }}
                  >
                    4.9/5 Average Rating
                  </Typography>
                </Box>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                  Based on 12,000+ reviews from verified users
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                  <Rating value={5} readOnly size="small" />
                  <Typography variant="body2" color="text.secondary">
                    (12,847 reviews)
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

export default Testimonials; 