import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
  Box, 
  Typography, 
  TextField, 
  Button, 
  List, 
  ListItem, 
  ListItemText,
  Paper, 
  Drawer, 
  AppBar, 
  Toolbar, 
  IconButton, 
  Divider,
  CircularProgress,
  Avatar,
  useMediaQuery,
  ThemeProvider,
  CssBaseline,
  createTheme,
  FormControl,
  Select,
  MenuItem
} from '@mui/material';
import { styled } from '@mui/material/styles';
import SendIcon from '@mui/icons-material/Send';
import MenuIcon from '@mui/icons-material/Menu';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import PersonIcon from '@mui/icons-material/Person';
import CloseIcon from '@mui/icons-material/Close';
import TranslateIcon from '@mui/icons-material/Translate';
import AnimatedSidebar from './AnimatedSidebar';
import { useNavigate } from 'react-router-dom';

// Define the theme
const chatbotTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#7E57C2', // A nice purple shade
      light: '#9575CD',
      dark: '#673AB7',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#4DD0E1', // Teal accent
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
          '&::-webkit-scrollbar-thumb:focus, & *::-webkit-scrollbar-thumb:focus': {
            backgroundColor: '#959595',
          },
          '&::-webkit-scrollbar-thumb:active, & *::-webkit-scrollbar-thumb:active': {
            backgroundColor: '#959595',
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
        },
      },
    },
    MuiInputBase: {
      styleOverrides: {
        input: {
          '&::placeholder': {
            opacity: 0.7,
          },
        },
      },
    },
  },
});

// List of supported languages
// List of supported languages
const languages = [
  { code: 'en', name: 'English' },
  { code: 'hi', name: 'Hindi' },
  { code: 'gu', name: 'Gujarati' }
];

// Language placeholder text translations
// Language placeholder text translations
const placeholderText = {
  en: "Type your question...",
  hi: "अपना प्रश्न लिखें...",
  gu: "તમારો પ્રશ્ન લખો..."
};

// Constant for drawer width
const drawerWidth = 250;

// Styled components
const ChatContainer = styled(Box)(({ theme }) => ({
  flexGrow: 1,
  padding: theme.spacing(3),
  transition: theme.transitions.create('margin', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  height: '100vh',
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  backgroundColor: theme.palette.background.default,
}));

const MessageBubble = styled(Paper)(({ theme, isUser }) => ({
  padding: theme.spacing(2),
  maxWidth: '85%',
  marginBottom: theme.spacing(2),
  borderRadius: isUser ? '20px 20px 0 20px' : '20px 20px 20px 0',
  alignSelf: isUser ? 'flex-end' : 'flex-start',
  backgroundColor: isUser ? theme.palette.primary.main : theme.palette.background.paper,
  color: isUser ? theme.palette.primary.contrastText : theme.palette.text.primary,
  boxShadow: theme.shadows[2],
  wordBreak: 'break-word',
}));

const SuggestionItem = styled(ListItem)(({ theme }) => ({
  borderRadius: theme.spacing(1),
  marginBottom: theme.spacing(1),
  backgroundColor: theme.palette.background.paper,
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
    cursor: 'pointer',
  },
}));

const MessageListContainer = styled(Box)({
  flexGrow: 1,
  overflow: 'auto',
  display: 'flex',
  flexDirection: 'column',
  padding: '16px',
  height: 'calc(100vh - 140px)',
});

const InputContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  padding: theme.spacing(2),
  backgroundColor: theme.palette.background.paper,
  borderTop: `1px solid ${theme.palette.divider}`,
}));

// Main Component
const Chatbot = () => {
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [funds, setFunds] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [language, setLanguage] = useState('en'); // Default language is English
  const messagesEndRef = useRef(null);
  const isMobile = useMediaQuery(chatbotTheme.breakpoints.down('md'));
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Example calculations that will be typed out one by one
  const calculations = [
    "// Calculating factorial of 5\nlet result = 1;\nfor (let i = 1; i <= 5; i++) {\n  result *= i;\n}\n// 5! = 120",
    "// Computing Fibonacci sequence\nlet a = 0, b = 1;\nfor (let i = 0; i < 10; i++) {\n  let temp = a + b;\n  a = b;\n  b = temp;\n  console.log(b);\n}",
    "// Solving quadratic equation\nconst a = 1, b = -3, c = 2;\nconst discriminant = b*b - 4*a*c;\nconst x1 = (-b + Math.sqrt(discriminant)) / (2*a);\nconst x2 = (-b - Math.sqrt(discriminant)) / (2*a);\n// x1 = 2, x2 = 1"
  ];

  // Scroll to bottom whenever chat history changes
  useEffect(() => {
    scrollToBottom();
  }, [chatHistory]);

  useEffect(() => {
    const lastWord = message.split(' ').pop();
    if (lastWord.startsWith('@')) {
      fetchFunds();
    } else {
      setShowSuggestions(false);
    }
  }, [message]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchFunds = async () => {
    try {
      const res = await axios.get('http://127.0.0.1:5001/schemes');
      setFunds(res.data);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Error fetching funds:', error);
    }
  };
  const navigate=useNavigate();

  const handledash=()=>{
    navigate('/dash')
  }
  
  const selectFund = async (fund) => {
    setShowSuggestions(false);
    setLoading(true);
    
    try {
      // Extract any question from the message about the fund
      const fundQuestion = message.includes('@') 
        ? message.replace(`@${fund}`, '').trim() 
        : "Give me an overview of the fund's performance";
      
      // Add user message to chat history
      setChatHistory((prev) => [
        ...prev,
        { message: message || `@${fund}`, isUser: true }
      ]);
      
      // Fetch the fund data
      const res = await axios.get(`http://127.0.0.1:5001/${fund}`);
      
      if (res.data && res.data.data && res.data.data.length > 0) {
        // Send the fund data and question to the backend for analysis
        const analysisRes = await axios.post('http://127.0.0.1:5001/analyze-fund', {
          fundData: {
            fundName: fund,
            navData: res.data.data
          },
          question: fundQuestion,
          language: language
        });
        
        // Add the analysis response to chat history
        setChatHistory((prev) => [
          ...prev,
          { message: analysisRes.data.response, isUser: false }
        ]);
      } else {
        setChatHistory((prev) => [
          ...prev,
          { message: 'No data available for this fund.', isUser: false }
        ]);
      }
    } catch (error) {
      console.error('Error analyzing fund:', error);
      setChatHistory((prev) => [
        ...prev,
        { message: 'Error analyzing fund details. Please try again later.', isUser: false }
      ]);
    }
    
    setMessage('');
    setLoading(false);
  };
  
  // Enhanced sendMessage function to handle fund-related queries
  const sendMessage = async () => {
    if (!message.trim()) return;
    setLoading(true);
    
    // Add user message to chat history
    setChatHistory((prev) => [...prev, { message, isUser: true }]);
    
    // Check if message contains a fund reference with @ symbol
    const fundPattern = /@([a-zA-Z0-9\s]+)/;
    const fundMatch = message.match(fundPattern);
    
    if (fundMatch) {
      // If a fund is mentioned, process it with selectFund
      const fundName = fundMatch[1].trim();
      
      // Check if the fund exists in our list of funds
      if (funds.includes(fundName)) {
        await selectFund(fundName);
      } else {
        // If we need to fetch funds first
        try {
          const res = await axios.get('http://127.0.0.1:5001/schemes');
          setFunds(res.data);
          
          if (res.data.includes(fundName)) {
            await selectFund(fundName);
          } else {
            setChatHistory((prev) => [
              ...prev,
              { message: `Could not find a fund named "${fundName}". Please check the fund name.`, isUser: false }
            ]);
            setLoading(false);
          }
        } catch (error) {
          console.error('Error fetching funds:', error);
          setChatHistory((prev) => [
            ...prev,
            { message: 'Error fetching fund information. Please try again later.', isUser: false }
          ]);
          setLoading(false);
        }
      }
    } else {
      // Regular message processing (non-fund related)
      try {
        const res = await axios.post('http://127.0.0.1:5001/chat', { 
          query: message, 
          language: language // Send the selected language to the backend
        });
        
        // Add response to chat history
        setChatHistory((prev) => [...prev, { message: res.data.response, isUser: false }]);
        setLoading(false);
      } catch (error) {
        console.error('Error:', error);
        setChatHistory((prev) => [...prev, { message: 'Error getting response', isUser: false }]);
        setLoading(false);
      }
    }
    
    setMessage('');
  };
  
  // Handle fund suggestion click
  const handleFundSelection = (fund) => {
    // If the user has typed a question about a fund
    if (message.includes('@')) {
      // Replace the partial fund name with the complete one
      const updatedMessage = message.replace(/@[a-zA-Z0-9\s]*$/, `@${fund}`);
      setMessage(updatedMessage);
    } else {
      // Just set the fund name as the message
      setMessage(`@${fund}`);
    }
    
    setShowSuggestions(false);
  };
  
  // Enhanced message input handling for fund suggestions
  const handleMessageChange = (e) => {
    setMessage(e.target.value);
    
    // Check if the last word starts with @ to show fund suggestions
    const lastWord = e.target.value.split(' ').pop();
    if (lastWord.startsWith('@')) {
      if (funds.length === 0) {
        fetchFunds(); // Fetch funds if we haven't already
      } else {
        setShowSuggestions(true);
      }
    } else {
      setShowSuggestions(false);
    }
  };
  
  // Filter fund suggestions based on what the user has typed after @
  const filteredFunds = () => {
    if (!message.includes('@')) return funds;
    
    const searchTerm = message.split('@').pop().toLowerCase();
    return funds.filter(fund => 
      fund.toLowerCase().includes(searchTerm)
    ).slice(0, 10); // Limit to 10 suggestions for better performance
  };
  

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const toggleDrawer = () => {
    setDrawerOpen(!drawerOpen);
  };

  const handleLanguageChange = (event) => {
    setLanguage(event.target.value);
  };

  return (
    <ThemeProvider theme={chatbotTheme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', bgcolor: 'background.default', height: '100vh' }}>
        {/* App Bar */}
        <AppBar 
          position="fixed" 
          sx={{
            zIndex: (theme) => theme.zIndex.drawer + 1,
            backgroundColor: chatbotTheme.palette.background.paper,
            boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
            color: chatbotTheme.palette.text.primary,
          }}
        >
          <Toolbar>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={toggleDrawer}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
            <SmartToyIcon sx={{ mr: 2 }} />
            <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
              Finance Chatbot
            </Typography>
            
            {/* Language Selection */}
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <TranslateIcon sx={{ mr: 1 }} />
              <FormControl size="small" variant="outlined" sx={{ minWidth: 120 }}>
                <Select
                  value={language}
                  onChange={handleLanguageChange}
                  sx={{ 
                    color: 'text.primary',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(255, 255, 255, 0.23)',
                    },
                  }}
                >
                  {languages.map((lang) => (
                    <MenuItem key={lang.code} value={lang.code}>
                      {lang.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            <Button onClick={handledash}>Dashboard</Button>
            <Button onClick={() => setSidebarOpen(true)}>
        Show Calculations
      </Button>
          </Toolbar>
        </AppBar>

        {/* Sidebar Drawer */}
        <Drawer
          variant={isMobile ? 'temporary' : 'persistent'}
          open={drawerOpen}
          onClose={toggleDrawer}
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: drawerWidth,
              boxSizing: 'border-box',
              backgroundColor: chatbotTheme.palette.background.default,
              borderRight: `1px solid ${chatbotTheme.palette.divider}`,
            },
          }}
        >
          <Toolbar />
          {isMobile && (
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 1 }}>
              <IconButton onClick={toggleDrawer}>
                <CloseIcon />
              </IconButton>
            </Box>
          )}
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Recent Chats
            </Typography>
          </Box>
          <Divider />
          <List>
            <ListItem>
              <ListItemText primary="No recent chats" secondary="Start a new conversation" />
            </ListItem>
          </List>
          <Divider />
          <Box sx={{ p: 2, mt: 'auto' }}>
            <Typography variant="body2" color="text.secondary">
              Type '@' to access fund information
            </Typography>
          </Box>
        </Drawer>

        {/* Main Content */}
        <ChatContainer sx={{ marginLeft: { sm: drawerOpen ? `${drawerWidth}px` : 0 } }}>
          <Toolbar /> {/* Spacer for AppBar */}
          
          {/* Messages Container */}
          <MessageListContainer>
            {chatHistory.map((chat, index) => (
              <Box 
                key={index} 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'flex-start', 
                  flexDirection: chat.isUser ? 'row-reverse' : 'row',
                  mb: 2
                }}
              >
                <Avatar 
                  sx={{ 
                    bgcolor: chat.isUser ? 'primary.main' : 'grey.700',
                    mr: chat.isUser ? 0 : 1,
                    ml: chat.isUser ? 1 : 0,
                    width: 32,
                    height: 32
                  }}
                >
                  {chat.isUser ? <PersonIcon fontSize="small" /> : <SmartToyIcon fontSize="small" />}
                </Avatar>
                <MessageBubble isUser={chat.isUser}>
                <Typography>{chat.message}</Typography>
                </MessageBubble>
              </Box>
            ))}
            {loading && (
              <Box 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'flex-start', 
                  flexDirection: 'row',
                  mb: 2
                }}
              >
                <Avatar 
                  sx={{ 
                    bgcolor: 'grey.700',
                    mr: 1,
                    width: 32,
                    height: 32
                  }}
                >
                  <SmartToyIcon fontSize="small" />
                </Avatar>
                <MessageBubble isUser={false}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <CircularProgress size={20} sx={{ mr: 1 }} color="inherit" />
                    <Typography>Thinking...</Typography>
                  </Box>
                </MessageBubble>
              </Box>
            )}
            <div ref={messagesEndRef} />
          </MessageListContainer>

          {/* Suggestions */}
          {showSuggestions && (
            <Paper 
              elevation={3}
              sx={{ 
                maxHeight: '200px', 
                overflow: 'auto',
                mb: 2,
                mx: 2,
                borderRadius: 2
              }}
            >
              <List dense>
                {funds.map((fund) => (
                  <SuggestionItem key={fund} onClick={() => selectFund(fund)} button>
                    <ListItemText primary={fund} />
                  </SuggestionItem>
                ))}
              </List>
            </Paper>
          )}

          {/* Input Area */}
          <InputContainer>
          <TextField
  fullWidth
  variant="outlined"
  placeholder={placeholderText[language] || placeholderText['en']}
  value={message}
  onChange={handleMessageChange} // Changed to the new handler
  onKeyPress={handleKeyPress}
  sx={{
    mr: 1,
    '& .MuiOutlinedInput-root': {
      borderRadius: '24px',
      backgroundColor: chatbotTheme.palette.background.default,
    }
  }}
/>

// 2. Update the suggestions list:
{showSuggestions && (
  <Paper 
    elevation={3}
    sx={{ 
      maxHeight: '200px', 
      overflow: 'auto',
      mb: 2,
      mx: 2,
      borderRadius: 2
    }}
  >
    <List dense>
      {filteredFunds().map((fund) => (
        <SuggestionItem 
          key={fund} 
          onClick={() => handleFundSelection(fund)} // Changed to the new handler
          button
        >
          <ListItemText primary={fund} />
        </SuggestionItem>
      ))}
    </List>
  </Paper>
)}
            <Button 
              variant="contained" 
              color="primary" 
              onClick={sendMessage}
              disabled={!message.trim() || loading}
              sx={{ 
                borderRadius: '24px',
                minWidth: '50px',
                height: '56px',
                width: '56px'
              }}
            >
              <SendIcon />
            </Button>
          </InputContainer>
        </ChatContainer>
      </Box>
      <div>
      
      
      <AnimatedSidebar 
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        calculations={calculations}
      />
      
      {/* Rest of your chat page content */}
    </div>
    </ThemeProvider>
  );
};

export default Chatbot;