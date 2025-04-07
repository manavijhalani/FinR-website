import { useState, useEffect } from "react";
import { 
  ThemeProvider, 
  createTheme, 
  CssBaseline, 
  Button, 
  Typography, 
  Box, 
  Container 
} from "@mui/material";
import { useNavigate } from "react-router-dom";

const words = ["Fin Republic"];
const typingSpeed = 150;
const deletingSpeed = 75;
const delayBetweenWords = 1500;

// Create a custom dark theme
const chatbotTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#7E57C2',
      light: '#9575CD',
      dark: '#673AB7',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#4DD0E1',
      light: '#80DEEA',
      dark: '#26C6DA',
      contrastText: '#000000',
    },
    background: {
      default: '#121212',
      paper: '#1E1E1E',
    },
    text: {
      primary: '#E0E0E0',
      secondary: '#AAAAAA',
    },
    divider: 'rgba(255, 255, 255, 0.05)',
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          scrollbarColor: '#6b6b6b #2b2b2b',
          '&::-webkit-scrollbar, & *::-webkit-scrollbar': {
            backgroundColor: '#2b2b2b',
            width: 8,
          },
          '&::-webkit-scrollbar-thumb, & *::-webkit-scrollbar-thumb': {
            borderRadius: 8,
            backgroundColor: '#6b6b6b',
            minHeight: 24,
          },
          '&::-webkit-scrollbar-thumb:hover, & *::-webkit-scrollbar-thumb:hover': {
            backgroundColor: '#959595',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontSize: '1.2rem',
          padding: '12px 24px',
        },
      },
    },
  },
});

export default function Front() {
  const [text, setText] = useState("");
  const [index, setIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const word = words[index];
    if (!isDeleting && text.length < word.length) {
      setTimeout(() => setText(word.substring(0, text.length + 1)), typingSpeed);
    } else if (isDeleting && text.length > 0) {
      setTimeout(() => setText(word.substring(0, text.length - 1)), deletingSpeed);
    } else {
      setTimeout(() => setIsDeleting(!isDeleting), delayBetweenWords);
    }
  }, [text, isDeleting]);

  return (
    <ThemeProvider theme={chatbotTheme}>
      <CssBaseline />
      <Container>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            textAlign: 'center',
            px: 2,
          }}
        >
          <Typography
            variant="h1"
            component="h1"
            sx={{
              fontWeight: 'bold',
              mb: 3,
              textAlign: 'center',
              fontSize: { xs: '3rem', sm: '4rem', md: '5rem' },
              '@keyframes fadeIn': {
                '0%': {
                  opacity: 0,
                  transform: 'translateY(-20px)'
                },
                '100%': {
                  opacity: 1,
                  transform: 'translateY(0)'
                }
              },
              animation: 'fadeIn 0.8s ease-in-out'
            }}
          >
            {text}
            <Box component="span" sx={{ color: 'primary.main' }}>|</Box>
          </Typography>
          
          <Typography 
            variant="h4" 
            sx={{ 
              color: 'text.secondary', 
              maxWidth: 'sm',
              mb: 4,
              fontSize: { xs: '1.5rem', sm: '2rem' }
            }}
          >
            Empower your finances with AI-driven insights. Make smarter decisions effortlessly.
          </Typography>
          
          <Button
            variant="contained"
            color="primary"
            size="large"
            sx={{ fontSize: '1.5rem', padding: '16px 32px' }}
            onClick={() => navigate('/chat')}
          >
            Get Started
          </Button>
        </Box>
      </Container>
    </ThemeProvider>
  );
}
