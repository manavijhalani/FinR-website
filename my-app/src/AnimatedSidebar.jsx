import React, { useState, useEffect } from 'react';
import { 
  Drawer, 
  Typography, 
  IconButton, 
  Box, 
  useMediaQuery,
  useTheme
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

export default function AnimatedSidebar({ isOpen, onClose, calculations = [] }) {
  const [displayText, setDisplayText] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  
  // Get theme and check if the device is mobile
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Start typing effect when drawer opens
  useEffect(() => {
    if (!isOpen) {
      return;
    }
    
    // Reset state when opened
    setDisplayText('');
    setIsComplete(false);
    
    // Combine all calculations with line breaks
    const fullText = calculations.join('\n\n');
    let charIndex = 0;
    let typingTimer = null;
    
    // Function to type one character at a time
    const typeNextChar = () => {
      if (charIndex < fullText.length) {
        setDisplayText(prev => prev + fullText.charAt(charIndex));
        charIndex++;
        typingTimer = setTimeout(typeNextChar, 30); // 30ms per character
      } else {
        setIsComplete(true);
      }
    };
    
    // Start the typing animation
    typingTimer = setTimeout(typeNextChar, 500); // Small initial delay
    
    // Clean up function to clear the timer when component unmounts or drawer closes
    return () => {
      if (typingTimer) {
        clearTimeout(typingTimer);
      }
    };
  }, [isOpen, calculations]);
  
  // Reset state when drawer closes
  const handleClose = () => {
    onClose();
  };
  
  return (
    <Drawer
      anchor="right"
      open={isOpen}
      onClose={handleClose}
      variant="temporary"
      PaperProps={{
        sx: {
          width: isMobile ? '100%' : '400px',
          backgroundColor: '#1a1a2e',
          color: '#4ade80',
        }
      }}
    >
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        height: '100%' 
      }}>
        {/* Header */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          p: 2, 
          borderBottom: '1px solid #333344' 
        }}>
          <Typography variant="h6" fontFamily="monospace">
            Calculations
          </Typography>
          <IconButton 
            onClick={handleClose}
            sx={{ color: 'grey.500', '&:hover': { color: 'white' } }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
        
        {/* Content */}
        <Box sx={{ 
          flexGrow: 1, 
          p: 2, 
          overflow: 'auto',  
          fontFamily: 'monospace',
          fontSize: {
            xs: '0.875rem', // smaller font on mobile
            sm: '1rem'      // normal font on tablets/desktops
          }
        }}>
          <Box 
            component="pre" 
            sx={{ 
              whiteSpace: 'pre-wrap',
              m: 0,
              fontFamily: 'inherit'
            }}
          >
            {displayText}
            {!isComplete && (
              <Box 
                component="span" 
                sx={{ 
                  display: 'inline-block',
                  width: '0.5em',
                  height: '1em',
                  backgroundColor: '#4ade80',
                  animation: 'blink 1s step-end infinite',
                  '@keyframes blink': {
                    '0%, 100%': {
                      opacity: 1,
                    },
                    '50%': {
                      opacity: 0,
                    },
                  },
                }}
              >
              </Box>
            )}
          </Box>
        </Box>
        
        {/* Footer */}
        <Box sx={{ 
          p: 2, 
          borderTop: '1px solid #333344',
          display: 'flex',
          justifyContent: 'flex-end'
        }}>
          <Typography variant="body2" color="text.secondary">
            {isComplete ? 'Complete' : 'Calculating...'}
          </Typography>
        </Box>
      </Box>
    </Drawer>
  );
}