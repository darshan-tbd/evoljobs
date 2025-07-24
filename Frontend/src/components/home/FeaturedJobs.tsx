import React from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Avatar,
  useTheme,
  alpha
} from '@mui/material';
import { motion } from 'framer-motion';
import {
  LocationOn as LocationIcon,
  AccessTime as TimeIcon,
  AttachMoney as SalaryIcon,
  Work as WorkIcon,
  Star as StarIcon
} from '@mui/icons-material';
import { useRouter } from 'next/router';

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  salary: string;
  type: string;
  description: string;
  logo: string;
  featured: boolean;
  postedAt: string;
  tags: string[];
}

const FeaturedJobs: React.FC = () => {
  const theme = useTheme();
  const router = useRouter();

  // Mock data - in real app, this would come from API
  const featuredJobs: Job[] = [
    {
      id: '1',
      title: 'Senior Frontend Developer',
      company: 'TechCorp Inc.',
      location: 'San Francisco, CA',
      salary: '$120K - $150K',
      type: 'Full-time',
      description: 'We are looking for a Senior Frontend Developer to join our team and help build amazing user experiences.',
      logo: '/images/companies/techcorp.jpg',
      featured: true,
      postedAt: '2 days ago',
      tags: ['React', 'TypeScript', 'Next.js', 'GraphQL']
    },
    {
      id: '2',
      title: 'Product Manager',
      company: 'InnovateLabs',
      location: 'New York, NY',
      salary: '$130K - $160K',
      type: 'Full-time',
      description: 'Join our product team to drive innovation and deliver exceptional products to millions of users.',
      logo: '/images/companies/innovatelabs.jpg',
      featured: true,
      postedAt: '1 day ago',
      tags: ['Product Strategy', 'Analytics', 'Agile', 'Leadership']
    },
    {
      id: '3',
      title: 'DevOps Engineer',
      company: 'CloudWorks',
      location: 'Remote',
      salary: '$110K - $140K',
      type: 'Full-time',
      description: 'Help us scale our infrastructure and improve developer experience with cutting-edge tools.',
      logo: '/images/companies/cloudworks.jpg',
      featured: true,
      postedAt: '3 days ago',
      tags: ['AWS', 'Kubernetes', 'Docker', 'Terraform']
    },
    {
      id: '4',
      title: 'UX Designer',
      company: 'DesignStudio',
      location: 'Los Angeles, CA',
      salary: '$90K - $120K',
      type: 'Full-time',
      description: 'Create beautiful and intuitive user experiences for our digital products.',
      logo: '/images/companies/designstudio.jpg',
      featured: true,
      postedAt: '4 days ago',
      tags: ['Figma', 'User Research', 'Prototyping', 'Design Systems']
    },
    {
      id: '5',
      title: 'Data Scientist',
      company: 'DataCorp',
      location: 'Boston, MA',
      salary: '$125K - $155K',
      type: 'Full-time',
      description: 'Analyze complex data sets to drive business insights and machine learning initiatives.',
      logo: '/images/companies/datacorp.jpg',
      featured: true,
      postedAt: '5 days ago',
      tags: ['Python', 'Machine Learning', 'SQL', 'TensorFlow']
    },
    {
      id: '6',
      title: 'Mobile Developer',
      company: 'AppWorks',
      location: 'Austin, TX',
      salary: '$100K - $130K',
      type: 'Full-time',
      description: 'Build native mobile applications for iOS and Android platforms.',
      logo: '/images/companies/appworks.jpg',
      featured: true,
      postedAt: '1 week ago',
      tags: ['React Native', 'Swift', 'Kotlin', 'Firebase']
    }
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

  const handleApplyJob = (jobId: string) => {
    // For featured jobs (mock data), redirect to job details page
    // In a real implementation, this would check for external application URLs
    // and redirect to the appropriate application form
    router.push(`/jobs/${jobId}/apply`);
  };

  const handleViewAllJobs = () => {
    router.push('/jobs');
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
            <Box sx={{ textAlign: 'center', mb: 6 }}>
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
                Featured Jobs
              </Typography>
              <Typography
                variant="body1"
                color="text.secondary"
                sx={{ maxWidth: 600, mx: 'auto' }}
              >
                Discover hand-picked opportunities from top companies. 
                These featured positions offer exceptional career growth and competitive compensation.
              </Typography>
            </Box>
          </motion.div>

          <Grid container spacing={4}>
            {featuredJobs.map((job, index) => (
              <Grid item xs={12} md={6} lg={4} key={job.id}>
                <motion.div
                  variants={itemVariants}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <Card
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      position: 'relative',
                      borderRadius: 3,
                      overflow: 'hidden',
                      transition: 'all 0.3s ease-in-out',
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                      '&:hover': {
                        boxShadow: theme.shadows[12],
                        borderColor: theme.palette.primary.main,
                      },
                    }}
                  >
                    {job.featured && (
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 16,
                          right: 16,
                          zIndex: 1,
                        }}
                      >
                        <Chip
                          icon={<StarIcon sx={{ fontSize: 16 }} />}
                          label="Featured"
                          color="primary"
                          size="small"
                          sx={{
                            fontWeight: 600,
                            borderRadius: 2,
                          }}
                        />
                      </Box>
                    )}

                    <CardContent sx={{ flex: 1, p: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Avatar
                          src={job.logo}
                          alt={job.company}
                          sx={{
                            width: 48,
                            height: 48,
                            mr: 2,
                            bgcolor: alpha(theme.palette.primary.main, 0.1),
                          }}
                        >
                          {job.company.charAt(0)}
                        </Avatar>
                        <Box>
                          <Typography variant="h6" component="h3" sx={{ fontWeight: 600 }}>
                            {job.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {job.company}
                          </Typography>
                        </Box>
                      </Box>

                      <Box sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <LocationIcon sx={{ fontSize: 16, color: 'text.secondary', mr: 1 }} />
                          <Typography variant="body2" color="text.secondary">
                            {job.location}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <SalaryIcon sx={{ fontSize: 16, color: 'text.secondary', mr: 1 }} />
                          <Typography variant="body2" color="text.secondary">
                            {job.salary}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <WorkIcon sx={{ fontSize: 16, color: 'text.secondary', mr: 1 }} />
                          <Typography variant="body2" color="text.secondary">
                            {job.type}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <TimeIcon sx={{ fontSize: 16, color: 'text.secondary', mr: 1 }} />
                          <Typography variant="body2" color="text.secondary">
                            {job.postedAt}
                          </Typography>
                        </Box>
                      </Box>

                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 2, lineHeight: 1.5 }}
                      >
                        {job.description}
                      </Typography>

                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                        {job.tags.map((tag) => (
                          <Chip
                            key={tag}
                            label={tag}
                            size="small"
                            variant="outlined"
                            sx={{
                              borderRadius: 1,
                              fontSize: '0.75rem',
                              height: 24,
                            }}
                          />
                        ))}
                      </Box>
                    </CardContent>

                    <CardActions sx={{ p: 3, pt: 0 }}>
                      <Button
                        fullWidth
                        variant="contained"
                        onClick={() => handleApplyJob(job.id)}
                        sx={{
                          borderRadius: 2,
                          py: 1,
                          textTransform: 'none',
                          fontWeight: 600,
                        }}
                      >
                        Apply Now
                      </Button>
                    </CardActions>
                  </Card>
                </motion.div>
              </Grid>
            ))}
          </Grid>

          <motion.div variants={itemVariants}>
            <Box sx={{ textAlign: 'center', mt: 6 }}>
              <Button
                variant="outlined"
                size="large"
                onClick={handleViewAllJobs}
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
                View All Jobs
              </Button>
            </Box>
          </motion.div>
        </motion.div>
      </Container>
    </Box>
  );
};

export default FeaturedJobs; 