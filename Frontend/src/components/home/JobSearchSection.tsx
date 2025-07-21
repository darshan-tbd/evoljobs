import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Grid,
  Paper,
  Chip,
  InputAdornment,
  useTheme,
  alpha
} from '@mui/material';
import { motion } from 'framer-motion';
import {
  Search as SearchIcon,
  LocationOn as LocationIcon,
  Work as WorkIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';
import { useRouter } from 'next/router';

const JobSearchSection: React.FC = () => {
  const theme = useTheme();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [location, setLocation] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const popularCategories = [
    'Frontend Development',
    'Backend Development',
    'Full Stack',
    'Data Science',
    'DevOps',
    'Mobile Development',
    'UI/UX Design',
    'Product Management',
    'Marketing',
    'Sales',
  ];

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchTerm) params.set('q', searchTerm);
    if (location) params.set('location', location);
    if (selectedCategories.length > 0) params.set('categories', selectedCategories.join(','));
    
    router.push(`/jobs?${params.toString()}`);
  };

  const handleCategoryToggle = (category: string) => {
    setSelectedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

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

  return (
    <Box
      sx={{
        py: 8,
        background: `linear-gradient(135deg, ${alpha(theme.palette.background.default, 0.5)} 0%, ${alpha(theme.palette.background.paper, 0.8)} 100%)`,
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'url(/images/search-pattern.svg) center/cover',
          opacity: 0.05,
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
            <Typography
              variant="h3"
              component="h2"
              align="center"
              gutterBottom
              sx={{
                fontWeight: 600,
                mb: 2,
                color: 'text.primary',
              }}
            >
              Find Your Perfect Job
            </Typography>
            <Typography
              variant="body1"
              align="center"
              color="text.secondary"
              sx={{ mb: 6, maxWidth: 600, mx: 'auto' }}
            >
              Search thousands of job opportunities with all the information you need. 
              Filter by location, salary, job type, and more to find your ideal position.
            </Typography>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Paper
              elevation={8}
              sx={{
                p: 4,
                borderRadius: 3,
                mb: 6,
                background: theme.palette.background.paper,
                border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
              }}
            >
              <Grid container spacing={3} alignItems="center">
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    placeholder="Job title, keywords, or company"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon color="primary" />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                      },
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    placeholder="Location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LocationIcon color="primary" />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                      },
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <Button
                    fullWidth
                    variant="contained"
                    size="large"
                    onClick={handleSearch}
                    sx={{
                      borderRadius: 2,
                      py: 1.5,
                      fontSize: '1.1rem',
                      textTransform: 'none',
                      boxShadow: theme.shadows[4],
                      '&:hover': {
                        boxShadow: theme.shadows[8],
                      },
                    }}
                  >
                    Search Jobs
                  </Button>
                </Grid>
              </Grid>
            </Paper>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Box sx={{ mb: 4 }}>
              <Typography
                variant="h6"
                component="h3"
                align="center"
                gutterBottom
                sx={{ mb: 3, color: 'text.primary' }}
              >
                Popular Categories
              </Typography>
              <Box
                sx={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 1,
                  justifyContent: 'center',
                  maxWidth: 800,
                  mx: 'auto',
                }}
              >
                {popularCategories.map((category) => (
                  <Chip
                    key={category}
                    label={category}
                    onClick={() => handleCategoryToggle(category)}
                    variant={selectedCategories.includes(category) ? 'filled' : 'outlined'}
                    color={selectedCategories.includes(category) ? 'primary' : 'default'}
                    sx={{
                      borderRadius: 2,
                      px: 1,
                      py: 0.5,
                      fontSize: '0.9rem',
                      fontWeight: 500,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease-in-out',
                      '&:hover': {
                        boxShadow: theme.shadows[4],
                      },
                    }}
                  />
                ))}
              </Box>
            </Box>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mb: 2 }}
              >
                Need help finding the right job? Our AI-powered recommendations can help.
              </Typography>
              <Button
                variant="text"
                startIcon={<FilterIcon />}
                onClick={() => router.push('/jobs/advanced-search')}
                sx={{
                  textTransform: 'none',
                  borderRadius: 2,
                  px: 3,
                  py: 1,
                }}
              >
                Advanced Search
              </Button>
            </Box>
          </motion.div>
        </motion.div>
      </Container>
    </Box>
  );
};

export default JobSearchSection; 