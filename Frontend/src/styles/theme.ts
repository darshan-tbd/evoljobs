import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  breakpoints: {
    values: {
      xs: 0,
      sm: 640,
      md: 768,
      lg: 1024,
      xl: 1280,
    },
  },
  palette: {
    primary: {
      main: '#667eea',
      light: '#8fa4f3',
      dark: '#4c63d2',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#764ba2',
      light: '#9575cd',
      dark: '#5e35b1',
      contrastText: '#ffffff',
    },
    background: {
      default: '#fafafa',
      paper: '#ffffff',
    },
    text: {
      primary: '#1a1a1a',
      secondary: '#666666',
    },
    error: {
      main: '#f44336',
      light: '#e57373',
      dark: '#d32f2f',
    },
    warning: {
      main: '#ff9800',
      light: '#ffb74d',
      dark: '#f57c00',
    },
    info: {
      main: '#2196f3',
      light: '#64b5f6',
      dark: '#1976d2',
    },
    success: {
      main: '#4caf50',
      light: '#81c784',
      dark: '#388e3c',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    // Mobile-first responsive typography
    h1: {
      fontSize: '1.875rem', // 30px on mobile
      fontWeight: 700,
      lineHeight: 1.2,
      letterSpacing: '-0.02em',
      '@media (min-width:640px)': {
        fontSize: '2.25rem', // 36px on sm+
      },
      '@media (min-width:768px)': {
        fontSize: '2.5rem', // 40px on md+
      },
      '@media (min-width:1024px)': {
        fontSize: '3rem', // 48px on lg+
      },
    },
    h2: {
      fontSize: '1.5rem', // 24px on mobile
      fontWeight: 600,
      lineHeight: 1.3,
      letterSpacing: '-0.01em',
      '@media (min-width:640px)': {
        fontSize: '1.75rem', // 28px on sm+
      },
      '@media (min-width:768px)': {
        fontSize: '2rem', // 32px on md+
      },
      '@media (min-width:1024px)': {
        fontSize: '2.25rem', // 36px on lg+
      },
    },
    h3: {
      fontSize: '1.25rem', // 20px on mobile
      fontWeight: 600,
      lineHeight: 1.3,
      '@media (min-width:640px)': {
        fontSize: '1.5rem', // 24px on sm+
      },
      '@media (min-width:768px)': {
        fontSize: '1.75rem', // 28px on md+
      },
    },
    h4: {
      fontSize: '1.125rem', // 18px on mobile
      fontWeight: 600,
      lineHeight: 1.4,
      '@media (min-width:640px)': {
        fontSize: '1.25rem', // 20px on sm+
      },
      '@media (min-width:768px)': {
        fontSize: '1.5rem', // 24px on md+
      },
    },
    h5: {
      fontSize: '1rem', // 16px on mobile
      fontWeight: 500,
      lineHeight: 1.4,
      '@media (min-width:640px)': {
        fontSize: '1.125rem', // 18px on sm+
      },
      '@media (min-width:768px)': {
        fontSize: '1.25rem', // 20px on md+
      },
    },
    h6: {
      fontSize: '0.9375rem', // 15px on mobile
      fontWeight: 500,
      lineHeight: 1.4,
      '@media (min-width:640px)': {
        fontSize: '1rem', // 16px on sm+
      },
      '@media (min-width:768px)': {
        fontSize: '1.125rem', // 18px on md+
      },
    },
    body1: {
      fontSize: '0.9375rem', // 15px on mobile
      lineHeight: 1.6,
      '@media (min-width:640px)': {
        fontSize: '1rem', // 16px on sm+
      },
    },
    body2: {
      fontSize: '0.8125rem', // 13px on mobile
      lineHeight: 1.5,
      '@media (min-width:640px)': {
        fontSize: '0.875rem', // 14px on sm+
      },
    },
    button: {
      textTransform: 'none',
      fontWeight: 500,
      fontSize: '0.875rem', // 14px on mobile
      '@media (min-width:640px)': {
        fontSize: '1rem', // 16px on sm+
      },
    },
  },
  shape: {
    borderRadius: 8,
  },
  spacing: (factor: number) => `${0.5 * factor}rem`, // Mobile-optimized spacing
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          borderRadius: 8,
          padding: '10px 16px', // Larger padding for mobile
          minHeight: 44, // iOS minimum touch target
          transition: 'all 0.2s ease-in-out',
          '@media (hover: hover) and (pointer: fine)': {
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            },
          },
          // Mobile-specific styles
          '@media (max-width:767px)': {
            padding: '12px 20px',
            fontSize: '0.9375rem',
            fontWeight: 600,
          },
        },
        containedPrimary: {
          background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
          boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)',
          '@media (hover: hover) and (pointer: fine)': {
            '&:hover': {
              background: 'linear-gradient(45deg, #5a67d8 30%, #6b46c1 90%)',
              boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
            },
          },
        },
        sizeLarge: {
          padding: '14px 24px',
          fontSize: '1rem',
          '@media (min-width:640px)': {
            padding: '16px 32px',
            fontSize: '1.1rem',
          },
        },
        sizeSmall: {
          padding: '6px 12px',
          fontSize: '0.75rem',
          minHeight: 32,
          '@media (min-width:640px)': {
            padding: '8px 16px',
            fontSize: '0.875rem',
            minHeight: 36,
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
          borderRadius: 12,
          transition: 'all 0.3s ease-in-out',
          // Only apply hover effects on non-touch devices
          '@media (hover: hover) and (pointer: fine)': {
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.1)',
            },
          },
          // Mobile-specific styles
          '@media (max-width:767px)': {
            borderRadius: 8,
            margin: '0 -4px',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
            fontSize: '1rem', // Prevent zoom on iOS
            minHeight: 44, // Touch-friendly height
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: '#667eea',
              },
            },
            '&.Mui-focused': {
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: '#667eea',
                borderWidth: 2,
              },
            },
          },
          // Mobile-specific input styles
          '@media (max-width:767px)': {
            '& .MuiOutlinedInput-root': {
              fontSize: '1rem', // Prevent zoom
              '& .MuiOutlinedInput-input': {
                padding: '12px 14px',
              },
            },
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 500,
          borderRadius: 16,
          height: 'auto',
          padding: '4px 0',
          // Mobile-optimized chip sizing
          '@media (max-width:767px)': {
            fontSize: '0.75rem',
            height: 28,
          },
        },
        colorPrimary: {
          background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
          color: 'white',
        },
        colorSecondary: {
          background: 'linear-gradient(45deg, #764ba2 30%, #667eea 90%)',
          color: 'white',
        },
        sizeSmall: {
          fontSize: '0.6875rem',
          height: 24,
          '@media (max-width:767px)': {
            fontSize: '0.625rem',
            height: 22,
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
          boxShadow: '0 2px 12px rgba(102, 126, 234, 0.15)',
          // Mobile-safe AppBar
          '@media (max-width:767px)': {
            minHeight: 56,
          },
        },
      },
    },
    MuiToolbar: {
      styleOverrides: {
        root: {
          minHeight: 64,
          '@media (max-width:767px)': {
            minHeight: 56,
            paddingLeft: 16,
            paddingRight: 16,
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          '@media (max-width:767px)': {
            borderRadius: 8,
          },
        },
        elevation1: {
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
        },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
          fontWeight: 600,
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          '@media (max-width:767px)': {
            borderRadius: 6,
            margin: '0 -8px',
          },
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          borderRadius: 12,
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
          '@media (max-width:767px)': {
            borderRadius: 8,
            maxHeight: '70vh',
            width: '90vw',
            maxWidth: 320,
          },
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          margin: '4px 8px',
          minHeight: 44, // Touch-friendly
          '@media (hover: hover) and (pointer: fine)': {
            '&:hover': {
              backgroundColor: 'rgba(102, 126, 234, 0.08)',
            },
          },
          '@media (max-width:767px)': {
            minHeight: 48,
            padding: '12px 16px',
          },
        },
      },
    },
    MuiListItemIcon: {
      styleOverrides: {
        root: {
          minWidth: 36,
          '@media (max-width:767px)': {
            minWidth: 40,
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 12,
          '@media (max-width:767px)': {
            borderRadius: '16px 16px 0 0',
            margin: 8,
            width: 'calc(100% - 16px)',
            maxWidth: 'none',
          },
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          padding: '20px 24px 16px',
          '@media (max-width:767px)': {
            padding: '16px 20px 12px',
          },
        },
      },
    },
    MuiDialogContent: {
      styleOverrides: {
        root: {
          padding: '0 24px 8px',
          '@media (max-width:767px)': {
            padding: '0 20px 8px',
          },
        },
      },
    },
    MuiDialogActions: {
      styleOverrides: {
        root: {
          padding: '16px 24px 20px',
          '@media (max-width:767px)': {
            padding: '12px 20px 16px',
            flexDirection: 'column-reverse',
            '& > :not(:first-of-type)': {
              marginLeft: 0,
              marginBottom: 8,
            },
          },
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          '@media (max-width:767px)': {
            maxWidth: '85vw',
          },
        },
      },
    },
    MuiFab: {
      styleOverrides: {
        root: {
          '@media (max-width:767px)': {
            position: 'fixed',
            bottom: 16,
            right: 16,
            zIndex: 1000,
          },
        },
      },
    },
    MuiFormControl: {
      styleOverrides: {
        root: {
          marginBottom: 16,
          '@media (max-width:767px)': {
            marginBottom: 12,
          },
        },
      },
    },
    MuiInputBase: {
      styleOverrides: {
        root: {
          fontSize: '1rem', // Prevent zoom on iOS
        },
      },
    },
    MuiAccordion: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          marginBottom: 8,
          '&:before': {
            display: 'none',
          },
          '@media (max-width:767px)': {
            borderRadius: 6,
            marginBottom: 6,
          },
        },
      },
    },
    MuiAccordionSummary: {
      styleOverrides: {
        root: {
          minHeight: 56,
          '@media (max-width:767px)': {
            minHeight: 48,
            padding: '0 12px',
          },
        },
      },
    },
    MuiPagination: {
      styleOverrides: {
        root: {
          display: 'flex',
          justifyContent: 'center',
          '@media (max-width:767px)': {
            '& .MuiPaginationItem-root': {
              minWidth: 32,
              height: 32,
              fontSize: '0.875rem',
            },
          },
        },
      },
    },
  },
}); 