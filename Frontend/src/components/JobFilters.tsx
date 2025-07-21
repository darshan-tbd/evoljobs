import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Slider,
  Grid,
  InputAdornment,
  Divider,
  IconButton,
  Tooltip,
  Badge,
  useTheme,
  alpha,
  SelectChangeEvent,
} from '@mui/material';
import {
  Search as SearchIcon,
  LocationOn as LocationIcon,
  ExpandMore as ExpandMoreIcon,
  Clear as ClearIcon,
  FilterList as FilterListIcon,
  Work as WorkIcon,
  Business as BusinessIcon,
  Category as CategoryIcon,
  Schedule as ScheduleIcon,
  AttachMoney as SalaryIcon,
  Star as StarIcon,
  AccessTime as TimeIcon,
} from '@mui/icons-material';

interface JobFiltersProps {
  onFiltersChange: (filters: FilterState) => void;
  facets?: FacetData;
  loading?: boolean;
  initialFilters?: Partial<FilterState>;
}

interface FilterState {
  searchTerm: string;
  location: string;
  jobTypes: string[];
  experienceLevels: string[];
  remoteOptions: string[];
  companies: string[];
  industries: string[];
  skills: string[];
  salaryRange: [number, number];
  datePosted: string;
  featuredOnly: boolean;
  excludeExpired: boolean;
  hasDeadline: boolean;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

interface FacetData {
  job_types: Array<{ job_type: string; count: number }>;
  experience_levels: Array<{ experience_level: string; count: number }>;
  remote_options: Array<{ remote_option: string; count: number }>;
  companies: Array<{ company__name: string; count: number }>;
  industries: Array<{ industry__name: string; count: number }>;
  skills: Array<{ required_skills__name: string; count: number }>;
  salary_stats: {
    min_salary: number;
    max_salary: number;
    avg_salary: number;
  };
}

const JobFilters: React.FC<JobFiltersProps> = ({ onFiltersChange, facets, loading, initialFilters }) => {
  const theme = useTheme();
  
  const [filters, setFilters] = useState<FilterState>({
    searchTerm: initialFilters?.searchTerm || '',
    location: initialFilters?.location || '',
    jobTypes: initialFilters?.jobTypes || [],
    experienceLevels: initialFilters?.experienceLevels || [],
    remoteOptions: initialFilters?.remoteOptions || [],
    companies: initialFilters?.companies || [],
    industries: initialFilters?.industries || [],
    skills: initialFilters?.skills || [],
    salaryRange: initialFilters?.salaryRange || [0, 200000],
    datePosted: initialFilters?.datePosted || '',
    featuredOnly: initialFilters?.featuredOnly || false,
    excludeExpired: initialFilters?.excludeExpired !== undefined ? initialFilters.excludeExpired : true,
    hasDeadline: initialFilters?.hasDeadline || false,
    sortBy: initialFilters?.sortBy || 'created_at',
    sortOrder: initialFilters?.sortOrder || 'desc',
  });

  const [expandedPanels, setExpandedPanels] = useState<string[]>([
    'basic-search',
    'job-type',
    'location-remote',
  ]);

  const datePostedOptions = [
    { value: '', label: 'Any time' },
    { value: 'today', label: 'Last 24 hours' },
    { value: 'week', label: 'Last week' },
    { value: 'month', label: 'Last month' },
    { value: 'quarter', label: 'Last 3 months' },
  ];

  const sortOptions = [
    { value: 'created_at', label: 'Most Recent' },
    { value: 'title', label: 'Job Title' },
    { value: 'salary_min', label: 'Salary (Low to High)' },
    { value: 'salary_max', label: 'Salary (High to Low)' },
    { value: 'views_count', label: 'Most Popular' },
    { value: 'applications_count', label: 'Most Applied' },
    { value: 'application_deadline', label: 'Deadline' },
  ];

  useEffect(() => {
    if (facets?.salary_stats) {
      setFilters(prev => ({
        ...prev,
        salaryRange: [
          facets.salary_stats.min_salary || 0,
          facets.salary_stats.max_salary || 200000,
        ],
      }));
    }
  }, [facets]);

  useEffect(() => {
    onFiltersChange(filters);
  }, [filters, onFiltersChange]);

  const handleFilterChange = (key: keyof FilterState, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleMultiSelectChange = (key: keyof FilterState, value: string) => {
    setFilters(prev => {
      const currentArray = prev[key] as string[];
      const newArray = currentArray.includes(value)
        ? currentArray.filter(item => item !== value)
        : [...currentArray, value];
      return {
        ...prev,
        [key]: newArray,
      };
    });
  };

  const handlePanelToggle = (panel: string) => {
    setExpandedPanels(prev =>
      prev.includes(panel)
        ? prev.filter(p => p !== panel)
        : [...prev, panel]
    );
  };

  const clearAllFilters = () => {
    setFilters({
      searchTerm: '',
      location: '',
      jobTypes: [],
      experienceLevels: [],
      remoteOptions: [],
      companies: [],
      industries: [],
      skills: [],
      salaryRange: [0, 200000],
      datePosted: '',
      featuredOnly: false,
      excludeExpired: true,
      hasDeadline: false,
      sortBy: 'created_at',
      sortOrder: 'desc',
    });
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.searchTerm) count++;
    if (filters.location) count++;
    if (filters.jobTypes.length) count += filters.jobTypes.length;
    if (filters.experienceLevels.length) count += filters.experienceLevels.length;
    if (filters.remoteOptions.length) count += filters.remoteOptions.length;
    if (filters.companies.length) count += filters.companies.length;
    if (filters.industries.length) count += filters.industries.length;
    if (filters.skills.length) count += filters.skills.length;
    if (filters.datePosted) count++;
    if (filters.featuredOnly) count++;
    if (filters.hasDeadline) count++;
    return count;
  };

  const formatJobType = (type: string) => {
    return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const formatSalary = (amount: number) => {
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
    return `$${amount.toLocaleString()}`;
  };

  return (
    <Card sx={{ height: 'fit-content', position: 'sticky', top: 24 }}>
      <CardContent sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Badge badgeContent={getActiveFiltersCount()} color="primary">
              <FilterListIcon color="primary" />
            </Badge>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Filters
            </Typography>
          </Box>
          <Tooltip title="Clear all filters">
            <IconButton onClick={clearAllFilters} size="small">
              <ClearIcon />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Sort Options */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
            Sort by
          </Typography>
          <Grid container spacing={1}>
            <Grid item xs={8}>
              <FormControl fullWidth size="small">
                <Select
                  value={filters.sortBy}
                  onChange={(e: SelectChangeEvent) => handleFilterChange('sortBy', e.target.value)}
                >
                  {sortOptions.map(option => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={4}>
              <FormControl fullWidth size="small">
                <Select
                  value={filters.sortOrder}
                  onChange={(e: SelectChangeEvent) => handleFilterChange('sortOrder', e.target.value)}
                >
                  <MenuItem value="desc">Desc</MenuItem>
                  <MenuItem value="asc">Asc</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Basic Search */}
        <Accordion
          expanded={expandedPanels.includes('basic-search')}
          onChange={() => handlePanelToggle('basic-search')}
          sx={{ boxShadow: 'none', '&:before': { display: 'none' } }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <SearchIcon color="primary" />
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                Search & Location
              </Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Job title, keywords, or company"
                value={filters.searchTerm}
                onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
                key="search-term-input"
              />
              <TextField
                fullWidth
                size="small"
                placeholder="Location"
                value={filters.location}
                onChange={(e) => handleFilterChange('location', e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LocationIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
                key="location-input"
              />
            </Box>
          </AccordionDetails>
        </Accordion>

        {/* Job Type & Experience */}
        <Accordion
          expanded={expandedPanels.includes('job-type')}
          onChange={() => handlePanelToggle('job-type')}
          sx={{ boxShadow: 'none', '&:before': { display: 'none' } }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <WorkIcon color="primary" />
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                Job Type & Experience
              </Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* Job Types */}
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
                  Job Type
                </Typography>
                <FormGroup>
                  {facets?.job_types?.map(item => (
                    <FormControlLabel
                      key={item.job_type}
                      control={
                        <Checkbox
                          checked={filters.jobTypes.includes(item.job_type)}
                          onChange={() => handleMultiSelectChange('jobTypes', item.job_type)}
                          size="small"
                        />
                      }
                      label={
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                          <span>{formatJobType(item.job_type)}</span>
                          <Chip label={item.count} size="small" variant="outlined" />
                        </Box>
                      }
                    />
                  ))}
                </FormGroup>
              </Box>

              {/* Experience Levels */}
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
                  Experience Level
                </Typography>
                <FormGroup>
                  {facets?.experience_levels?.map(item => (
                    <FormControlLabel
                      key={item.experience_level}
                      control={
                        <Checkbox
                          checked={filters.experienceLevels.includes(item.experience_level)}
                          onChange={() => handleMultiSelectChange('experienceLevels', item.experience_level)}
                          size="small"
                        />
                      }
                      label={
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                          <span>{formatJobType(item.experience_level)}</span>
                          <Chip label={item.count} size="small" variant="outlined" />
                        </Box>
                      }
                    />
                  ))}
                </FormGroup>
              </Box>
            </Box>
          </AccordionDetails>
        </Accordion>

        {/* Location & Remote */}
        <Accordion
          expanded={expandedPanels.includes('location-remote')}
          onChange={() => handlePanelToggle('location-remote')}
          sx={{ boxShadow: 'none', '&:before': { display: 'none' } }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <LocationIcon color="primary" />
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                Work Location
              </Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
                Remote Options
              </Typography>
              <FormGroup>
                {facets?.remote_options?.map(item => (
                  <FormControlLabel
                    key={item.remote_option}
                    control={
                      <Checkbox
                        checked={filters.remoteOptions.includes(item.remote_option)}
                        onChange={() => handleMultiSelectChange('remoteOptions', item.remote_option)}
                        size="small"
                      />
                    }
                    label={
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                        <span>{formatJobType(item.remote_option)}</span>
                        <Chip label={item.count} size="small" variant="outlined" />
                      </Box>
                    }
                  />
                ))}
              </FormGroup>
            </Box>
          </AccordionDetails>
        </Accordion>

        {/* Salary Range */}
        <Accordion
          expanded={expandedPanels.includes('salary')}
          onChange={() => handlePanelToggle('salary')}
          sx={{ boxShadow: 'none', '&:before': { display: 'none' } }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <SalaryIcon color="primary" />
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                Salary Range
              </Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 500, mb: 2 }}>
                {formatSalary(filters.salaryRange[0])} - {formatSalary(filters.salaryRange[1])}
              </Typography>
              <Slider
                value={filters.salaryRange}
                onChange={(_, value) => handleFilterChange('salaryRange', value)}
                valueLabelDisplay="auto"
                min={facets?.salary_stats?.min_salary || 0}
                max={facets?.salary_stats?.max_salary || 200000}
                step={5000}
                valueLabelFormat={formatSalary}
                sx={{ mb: 2 }}
              />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="caption" color="text.secondary">
                  {formatSalary(facets?.salary_stats?.min_salary || 0)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {formatSalary(facets?.salary_stats?.max_salary || 200000)}
                </Typography>
              </Box>
            </Box>
          </AccordionDetails>
        </Accordion>

        {/* Date Posted */}
        <Accordion
          expanded={expandedPanels.includes('date-posted')}
          onChange={() => handlePanelToggle('date-posted')}
          sx={{ boxShadow: 'none', '&:before': { display: 'none' } }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TimeIcon color="primary" />
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                Date Posted
              </Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <FormControl fullWidth size="small">
              <Select
                value={filters.datePosted}
                onChange={(e: SelectChangeEvent) => handleFilterChange('datePosted', e.target.value)}
              >
                {datePostedOptions.map(option => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </AccordionDetails>
        </Accordion>

        {/* Companies */}
        <Accordion
          expanded={expandedPanels.includes('companies')}
          onChange={() => handlePanelToggle('companies')}
          sx={{ boxShadow: 'none', '&:before': { display: 'none' } }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <BusinessIcon color="primary" />
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                Companies
              </Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ maxHeight: 200, overflowY: 'auto' }}>
              <FormGroup>
                {facets?.companies?.slice(0, 10).map(item => (
                  <FormControlLabel
                    key={item.company__name}
                    control={
                      <Checkbox
                        checked={filters.companies.includes(item.company__name)}
                        onChange={() => handleMultiSelectChange('companies', item.company__name)}
                        size="small"
                      />
                    }
                    label={
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                        <span>{item.company__name}</span>
                        <Chip label={item.count} size="small" variant="outlined" />
                      </Box>
                    }
                  />
                ))}
              </FormGroup>
            </Box>
          </AccordionDetails>
        </Accordion>

        {/* Industries */}
        <Accordion
          expanded={expandedPanels.includes('industries')}
          onChange={() => handlePanelToggle('industries')}
          sx={{ boxShadow: 'none', '&:before': { display: 'none' } }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CategoryIcon color="primary" />
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                Industries
              </Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ maxHeight: 200, overflowY: 'auto' }}>
              <FormGroup>
                {facets?.industries?.map(item => (
                  <FormControlLabel
                    key={item.industry__name}
                    control={
                      <Checkbox
                        checked={filters.industries.includes(item.industry__name)}
                        onChange={() => handleMultiSelectChange('industries', item.industry__name)}
                        size="small"
                      />
                    }
                    label={
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                        <span>{item.industry__name}</span>
                        <Chip label={item.count} size="small" variant="outlined" />
                      </Box>
                    }
                  />
                ))}
              </FormGroup>
            </Box>
          </AccordionDetails>
        </Accordion>

        {/* Quick Options */}
        <Accordion
          expanded={expandedPanels.includes('quick-options')}
          onChange={() => handlePanelToggle('quick-options')}
          sx={{ boxShadow: 'none', '&:before': { display: 'none' } }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <StarIcon color="primary" />
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                Quick Options
              </Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <FormGroup>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={filters.featuredOnly}
                    onChange={(e) => handleFilterChange('featuredOnly', e.target.checked)}
                    size="small"
                  />
                }
                label="Featured jobs only"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={filters.excludeExpired}
                    onChange={(e) => handleFilterChange('excludeExpired', e.target.checked)}
                    size="small"
                  />
                }
                label="Exclude expired jobs"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={filters.hasDeadline}
                    onChange={(e) => handleFilterChange('hasDeadline', e.target.checked)}
                    size="small"
                  />
                }
                label="Has application deadline"
              />
            </FormGroup>
          </AccordionDetails>
        </Accordion>

        {/* Apply Button */}
        <Box sx={{ mt: 3 }}>
          <Button
            fullWidth
            variant="contained"
            startIcon={<SearchIcon />}
            sx={{
              borderRadius: 2,
              py: 1.5,
              textTransform: 'none',
              fontWeight: 600,
            }}
          >
            Apply Filters
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default JobFilters; 