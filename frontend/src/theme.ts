import { createTheme, alpha } from '@mui/material/styles';

export const cvsColors = {
  red: '#CC0000',
  darkBlue: '#17447C',
  lightBlue: '#44B4E7',
  accentRed: '#E11E3B',
  white: '#FFFFFF',
  black: '#000000',
  gray: {
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#EEEEEE',
    300: '#E0E0E0',
    400: '#BDBDBD',
    500: '#9E9E9E',
    600: '#757575',
    700: '#616161',
    800: '#424242',
    900: '#212121',
  },
};

export const theme = createTheme({
  palette: {
    primary: {
      main: cvsColors.darkBlue,
      light: cvsColors.lightBlue,
      dark: '#0F2D52',
      contrastText: cvsColors.white,
    },
    secondary: {
      main: cvsColors.red,
      light: '#FF3333',
      dark: '#990000',
      contrastText: cvsColors.white,
    },
    background: {
      default: '#F8FAFC',
      paper: cvsColors.white,
    },
    text: {
      primary: cvsColors.gray[900],
      secondary: cvsColors.gray[600],
    },
    error: {
      main: cvsColors.red,
    },
    success: {
      main: '#10B981',
    },
    info: {
      main: cvsColors.lightBlue,
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
      letterSpacing: '-0.02em',
    },
    h2: {
      fontWeight: 700,
      letterSpacing: '-0.01em',
    },
    h3: {
      fontWeight: 600,
    },
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
    button: {
      fontWeight: 600,
      textTransform: 'none',
    },
  },
  shape: {
    borderRadius: 12,
  },
  shadows: [
    'none',
    '0px 1px 2px rgba(0, 0, 0, 0.05)',
    '0px 1px 3px rgba(0, 0, 0, 0.1), 0px 1px 2px rgba(0, 0, 0, 0.06)',
    '0px 4px 6px -1px rgba(0, 0, 0, 0.1), 0px 2px 4px -1px rgba(0, 0, 0, 0.06)',
    '0px 10px 15px -3px rgba(0, 0, 0, 0.1), 0px 4px 6px -2px rgba(0, 0, 0, 0.05)',
    '0px 20px 25px -5px rgba(0, 0, 0, 0.1), 0px 10px 10px -5px rgba(0, 0, 0, 0.04)',
    '0px 25px 50px -12px rgba(0, 0, 0, 0.25)',
    ...Array(18).fill('0px 25px 50px -12px rgba(0, 0, 0, 0.25)'),
  ] as any,
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          scrollbarWidth: 'thin',
          '&::-webkit-scrollbar': {
            width: '8px',
            height: '8px',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: cvsColors.gray[400],
            borderRadius: '4px',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          padding: '10px 24px',
          fontSize: '0.95rem',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.15)',
          },
        },
        containedPrimary: {
          background: `linear-gradient(135deg, ${cvsColors.darkBlue} 0%, ${alpha(cvsColors.darkBlue, 0.85)} 100%)`,
          '&:hover': {
            background: `linear-gradient(135deg, ${cvsColors.darkBlue} 0%, ${alpha(cvsColors.darkBlue, 0.95)} 100%)`,
          },
        },
        containedSecondary: {
          background: `linear-gradient(135deg, ${cvsColors.red} 0%, ${cvsColors.accentRed} 100%)`,
          '&:hover': {
            background: `linear-gradient(135deg, ${cvsColors.red} 0%, ${alpha(cvsColors.red, 0.9)} 100%)`,
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.08)',
        },
        elevation1: {
          boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.06)',
        },
        elevation2: {
          boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.08)',
        },
        elevation3: {
          boxShadow: '0px 8px 30px rgba(0, 0, 0, 0.12)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          border: `1px solid ${alpha(cvsColors.gray[300], 0.5)}`,
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0px 12px 40px rgba(0, 0, 0, 0.12)',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 500,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
            transition: 'all 0.2s ease',
            '&:hover': {
              boxShadow: `0 0 0 3px ${alpha(cvsColors.lightBlue, 0.1)}`,
            },
            '&.Mui-focused': {
              boxShadow: `0 0 0 3px ${alpha(cvsColors.lightBlue, 0.2)}`,
            },
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.08)',
        },
      },
    },
    MuiStepper: {
      styleOverrides: {
        root: {
          padding: '24px 0',
        },
      },
    },
    MuiStepLabel: {
      styleOverrides: {
        label: {
          fontWeight: 500,
          '&.Mui-active': {
            fontWeight: 600,
          },
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
        standardError: {
          backgroundColor: alpha(cvsColors.red, 0.1),
          color: cvsColors.red,
        },
        standardSuccess: {
          backgroundColor: alpha('#10B981', 0.1),
          color: '#059669',
        },
        standardInfo: {
          backgroundColor: alpha(cvsColors.lightBlue, 0.1),
          color: cvsColors.darkBlue,
        },
        standardWarning: {
          backgroundColor: alpha('#F59E0B', 0.1),
          color: '#D97706',
        },
      },
    },
  },
});
