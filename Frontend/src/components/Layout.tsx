import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Container,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  ListItemIcon,
  ListItemText,
  Chip,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  useTheme,
  useMediaQuery,
  Badge,
} from '@mui/material';
import {
  AccountCircle,
  Settings,
  ExitToApp,
  Dashboard,
  Work,
  BusinessCenter,
  SupervisorAccount,
  Assessment,
  Notifications,
  Menu as MenuIcon,
  Close as CloseIcon,
  Home,
} from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';
import { useNotification } from '../contexts/NotificationContext';
import { useRouter } from 'next/router';
import Link from 'next/link';
import NotificationCenter from './NotificationCenter';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, isAuthenticated, logout, isSuperuser, isStaff } = useAuth();
  const { showSuccess } = useNotification();
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleMobileMenuToggle = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleMobileMenuClose = () => {
    setMobileMenuOpen(false);
  };

  const handleLogout = async () => {
    try {
      handleMenuClose();
      await logout();
      showSuccess('Logged out successfully! Redirecting...');
      // Small delay to ensure state is updated and user sees the message
      setTimeout(() => {
        router.push('/login').then(() => {
          // Force reload if redirect doesn't work
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
        });
      }, 1000);
    } catch (error) {
      console.error('Logout failed:', error);
      handleMenuClose();
      showSuccess('Logged out successfully! Redirecting...');
              setTimeout(() => {
          router.push('/login').then(() => {
            // Force reload if redirect doesn't work
            if (window.location.pathname !== '/login') {
              window.location.href = '/login';
            }
          });
        }, 1000);
    }
  };

  const handleNavigation = (path: string) => {
    // Ensure we're not already on the target path
    if (router.pathname === path) {
      handleMenuClose();
      handleMobileMenuClose();
      return;
    }
    
    // Close menus first
    handleMenuClose();
    handleMobileMenuClose();
    
    // For jobs page, use window.location.href for more reliable navigation
    if (path === '/jobs') {
      window.location.href = path;
      return;
    }
    
    // Use router.push for other routes with fallback
    router.push(path).catch((error) => {
      console.error('Navigation failed, trying window.location.href:', error);
      window.location.href = path;
    });
  };

  const getUserTypeColor = (userType: string) => {
    switch (userType) {
      case 'admin':
        return 'error';
      case 'employer':
        return 'warning';
      case 'job_seeker':
        return 'info';
      default:
        return 'default';
    }
  };

  const getUserTypeLabel = (userType: string) => {
    switch (userType) {
      case 'admin':
        return 'Administrator';
      case 'employer':
        return 'Employer';
      case 'job_seeker':
        return 'Job Seeker';
      default:
        return 'User';
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static" elevation={1}>
        <Toolbar>
          {/* Mobile menu button */}
          {isMobile && isAuthenticated && (
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleMobileMenuToggle}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          )}

          <Typography
            variant="h6"
            component="div"
            sx={{ 
              flexGrow: 1, 
              cursor: 'pointer',
              fontSize: isMobile ? '1.1rem' : '1.25rem'
            }}
            onClick={() => router.push('/')}
          >
            JobPilot
          </Typography>

          {/* Desktop Navigation */}
          {!isMobile && isAuthenticated && user && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {(isSuperuser || isStaff) && (
                <Chip
                  icon={<SupervisorAccount />}
                  label={isSuperuser ? 'Superuser' : 'Staff'}
                  color="secondary"
                  variant="outlined"
                  size="small"
                />
              )}
              
              <Chip
                label={getUserTypeLabel(user.user_type)}
                color={getUserTypeColor(user.user_type)}
                size="small"
              />

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {/* Real-time Notifications */}
                <NotificationCenter userId={user.id?.toString()} />
                
                <Typography variant="body2" color="inherit">
                  {user.first_name} {user.last_name}
                </Typography>
                <Avatar
                  sx={{ width: 32, height: 32, cursor: 'pointer' }}
                  onClick={handleMenuOpen}
                >
                  {user.first_name[0]}
                </Avatar>
              </Box>
            </Box>
          )}

          {/* Mobile user info */}
          {isMobile && isAuthenticated && user && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {/* Real-time Notifications */}
              <NotificationCenter userId={user.id?.toString()} />
              
              <Avatar
                sx={{ width: 32, height: 32, cursor: 'pointer' }}
                onClick={handleMenuOpen}
              >
                {user.first_name[0]}
              </Avatar>
            </Box>
          )}

          {/* Auth buttons for non-authenticated users */}
          {!isAuthenticated && (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button 
                color="inherit" 
                onClick={() => router.push('/login')}
                size={isMobile ? 'small' : 'medium'}
              >
                Login
              </Button>
              <Button 
                color="inherit" 
                onClick={() => router.push('/register')}
                size={isMobile ? 'small' : 'medium'}
              >
                Register
              </Button>
            </Box>
          )}

          {/* Desktop menu */}
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            onClick={handleMenuClose}
            PaperProps={{
              elevation: 0,
              sx: {
                overflow: 'visible',
                filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
                mt: 1.5,
                '& .MuiAvatar-root': {
                  width: 32,
                  height: 32,
                  ml: -0.5,
                  mr: 1,
                },
                '&:before': {
                  content: '""',
                  display: 'block',
                  position: 'absolute',
                  top: 0,
                  right: 14,
                  width: 10,
                  height: 10,
                  bgcolor: 'background.paper',
                  transform: 'translateY(-50%) rotate(45deg)',
                  zIndex: 0,
                },
              },
            }}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
                <MenuItem onClick={() => handleNavigation('/dashboard')}>
                  <ListItemIcon>
                    <Dashboard fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Dashboard</ListItemText>
                </MenuItem>

                <MenuItem onClick={() => handleNavigation('/profile')}>
                  <ListItemIcon>
                    <AccountCircle fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Profile</ListItemText>
                </MenuItem>

                {user && (
                  <>
                    <MenuItem onClick={() => handleNavigation('/jobs')}>
                      <ListItemIcon>
                        <Work fontSize="small" />
                      </ListItemIcon>
                      <ListItemText>Find Jobs</ListItemText>
                    </MenuItem>
                    
                    {user.user_type === 'job_seeker' && (
                      <>
                        <MenuItem onClick={() => handleNavigation('/applications')}>
                          <ListItemIcon>
                            <Assessment fontSize="small" />
                          </ListItemIcon>
                          <ListItemText>My Applications</ListItemText>
                        </MenuItem>
                        <MenuItem onClick={() => handleNavigation('/profile')}>
                          <ListItemIcon>
                            <AccountCircle fontSize="small" />
                          </ListItemIcon>
                          <ListItemText>Profile</ListItemText>
                        </MenuItem>
                      </>
                    )}
                  </>
                )}

                {user && user.user_type === 'employer' && (
                  <MenuItem onClick={() => handleNavigation('/employer/jobs')}>
                    <ListItemIcon>
                      <BusinessCenter fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Manage Jobs</ListItemText>
                  </MenuItem>
                )}

                {(isSuperuser || isStaff) && (
                  <>
                    <Divider />
                    <MenuItem onClick={() => handleNavigation('/admin')}>
                      <ListItemIcon>
                        <SupervisorAccount fontSize="small" />
                      </ListItemIcon>
                      <ListItemText>Admin Panel</ListItemText>
                    </MenuItem>
                  </>
                )}

                <MenuItem onClick={() => handleNavigation('/notifications')}>
                  <ListItemIcon>
                    <Notifications fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Notifications</ListItemText>
                </MenuItem>

                <MenuItem onClick={() => handleNavigation('/settings')}>
                  <ListItemIcon>
                    <Settings fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Settings</ListItemText>
                </MenuItem>

                <Divider />

            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <ExitToApp fontSize="small" />
              </ListItemIcon>
              <ListItemText>Logout</ListItemText>
            </MenuItem>
          </Menu>

          {/* Mobile Drawer */}
          <Drawer
            anchor="left"
            open={mobileMenuOpen}
            onClose={handleMobileMenuClose}
            ModalProps={{
              keepMounted: true, // Better mobile performance
            }}
            PaperProps={{
              sx: {
                width: 280,
                backgroundImage: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
              },
            }}
          >
            <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="h6">JobPilot</Typography>
              <IconButton color="inherit" onClick={handleMobileMenuClose}>
                <CloseIcon />
              </IconButton>
            </Box>
            
            {user && (
              <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <Avatar sx={{ width: 40, height: 40 }}>
                  {user.first_name[0]}
                </Avatar>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    {user.first_name} {user.last_name}
                  </Typography>
                  <Chip
                    label={getUserTypeLabel(user.user_type)}
                    size="small"
                    sx={{ 
                      bgcolor: 'rgba(255,255,255,0.2)', 
                      color: 'white',
                      '& .MuiChip-label': { fontSize: '0.75rem' }
                    }}
                  />
                </Box>
              </Box>
            )}

            <List sx={{ py: 1 }}>
              <ListItem disablePadding>
                <ListItemButton onClick={() => handleNavigation('/')}>
                  <ListItemIcon sx={{ color: 'white' }}>
                    <Home />
                  </ListItemIcon>
                  <ListItemText primary="Home" />
                </ListItemButton>
              </ListItem>

              <ListItem disablePadding>
                <ListItemButton onClick={() => handleNavigation('/dashboard')}>
                  <ListItemIcon sx={{ color: 'white' }}>
                    <Dashboard />
                  </ListItemIcon>
                  <ListItemText primary="Dashboard" />
                </ListItemButton>
              </ListItem>

              <ListItem disablePadding>
                <ListItemButton onClick={() => handleNavigation('/profile')}>
                  <ListItemIcon sx={{ color: 'white' }}>
                    <AccountCircle />
                  </ListItemIcon>
                  <ListItemText primary="Profile" />
                </ListItemButton>
              </ListItem>

              {user && (
                <>
                  <ListItem disablePadding>
                    <ListItemButton onClick={() => handleNavigation('/jobs')}>
                      <ListItemIcon sx={{ color: 'white' }}>
                        <Work />
                      </ListItemIcon>
                      <ListItemText primary="Find Jobs" />
                    </ListItemButton>
                  </ListItem>

                  {user.user_type === 'job_seeker' && (
                    <ListItem disablePadding>
                      <ListItemButton onClick={() => handleNavigation('/applications')}>
                        <ListItemIcon sx={{ color: 'white' }}>
                          <Assessment />
                        </ListItemIcon>
                        <ListItemText primary="My Applications" />
                      </ListItemButton>
                    </ListItem>
                  )}
                </>
              )}

              {user && user.user_type === 'employer' && (
                <ListItem disablePadding>
                  <ListItemButton onClick={() => handleNavigation('/employer/jobs')}>
                    <ListItemIcon sx={{ color: 'white' }}>
                      <BusinessCenter />
                    </ListItemIcon>
                    <ListItemText primary="Manage Jobs" />
                  </ListItemButton>
                </ListItem>
              )}

              {(isSuperuser || isStaff) && (
                <ListItem disablePadding>
                  <ListItemButton onClick={() => handleNavigation('/admin')}>
                    <ListItemIcon sx={{ color: 'white' }}>
                      <SupervisorAccount />
                    </ListItemIcon>
                    <ListItemText primary="Admin Panel" />
                  </ListItemButton>
                </ListItem>
              )}

              <ListItem disablePadding>
                <ListItemButton onClick={() => handleNavigation('/notifications')}>
                  <ListItemIcon sx={{ color: 'white' }}>
                    <Badge badgeContent={0} color="error">
                      <Notifications />
                    </Badge>
                  </ListItemIcon>
                  <ListItemText primary="Notifications" />
                </ListItemButton>
              </ListItem>

              <ListItem disablePadding>
                <ListItemButton onClick={() => handleNavigation('/settings')}>
                  <ListItemIcon sx={{ color: 'white' }}>
                    <Settings />
                  </ListItemIcon>
                  <ListItemText primary="Settings" />
                </ListItemButton>
              </ListItem>

              <Divider sx={{ my: 1, borderColor: 'rgba(255,255,255,0.1)' }} />

              <ListItem disablePadding>
                <ListItemButton onClick={handleLogout}>
                  <ListItemIcon sx={{ color: 'white' }}>
                    <ExitToApp />
                  </ListItemIcon>
                  <ListItemText primary="Logout" />
                </ListItemButton>
              </ListItem>
            </List>
          </Drawer>
        </Toolbar>
      </AppBar>

      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1, 
          py: isMobile ? 2 : 3,
          px: isMobile ? 1 : 0,
        }}
      >
        <Container 
          maxWidth="xl" 
          sx={{
            px: isMobile ? 1 : 3,
          }}
        >
          {children}
        </Container>
      </Box>
    </Box>
  );
};

export default Layout; 