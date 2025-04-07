import React, { useState, useEffect, useRef } from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Box, 
  Container, 
  Grid, 
  Paper, 
  Button, 
  ThemeProvider, 
  createTheme, 
  LinearProgress,
  Card,
  CardContent,
  CardHeader,
  Avatar,
  IconButton,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Tab,
  Tabs
} from '@mui/material';
import { 
  AccountBalance, 
  Savings, 
  TrendingUp, 
  Tune, 
  Search, 
  Notifications, 
  Person,
  ArrowUpward,
  ArrowDownward,
  More,
  AccountCircle
} from '@mui/icons-material';
import * as THREE from 'three';
import { Line } from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  Title, 
  Tooltip, 
  Legend 
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// Create a theme with purple as primary color
const theme = createTheme({
  palette: {
    primary: {
      main: '#7e57c2',
    },
    secondary: {
      main: '#4caf50',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
});

// Mock data for charts
const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'];

const growthData = {
  labels: months,
  datasets: [
    {
      label: 'Savings Growth',
      data: [4000, 5200, 6100, 7300, 8200, 9400, 10500, 11700, 12600, 13800],
      borderColor: '#7e57c2',
      backgroundColor: 'rgba(126, 87, 194, 0.1)',
      fill: true,
      tension: 0.4,
    },
  ],
};

const fundData = (color) => ({
  labels: months.slice(0, 5),
  datasets: [
    {
      label: 'Performance',
      data: Array(5).fill().map(() => Math.random() * 10 + 30),
      borderColor: color,
      backgroundColor: 'transparent',
      tension: 0.4,
    },
  ],
});

const chartOptions = {
  responsive: true,
  plugins: {
    legend: {
      display: false,
    },
    tooltip: {
      mode: 'index',
      intersect: false,
    },
  },
  scales: {
    x: {
      grid: {
        display: false,
      },
    },
    y: {
      grid: {
        display: true,
        color: 'rgba(0, 0, 0, 0.05)',
      },
    },
  },
  maintainAspectRatio: false
};

// Three.js component for 3D visualization
const ThreeScene = () => {
  const mountRef = useRef(null);

  useEffect(() => {
    // Create scene
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, 300 / 200, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(300, 200);
    mountRef.current.appendChild(renderer.domElement);

    // Create a glowing sphere to represent savings
    const geometry = new THREE.SphereGeometry(1, 32, 32);
    const material = new THREE.MeshBasicMaterial({ 
      color: 0x7e57c2,
      transparent: true,
      opacity: 0.8
    });
    const sphere = new THREE.Mesh(geometry, material);
    scene.add(sphere);

    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    // Add point light
    const pointLight = new THREE.PointLight(0x7e57c2, 1, 100);
    pointLight.position.set(5, 5, 5);
    scene.add(pointLight);

    camera.position.z = 5;

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      sphere.rotation.x += 0.01;
      sphere.rotation.y += 0.01;
      renderer.render(scene, camera);
    };
    animate();

    // Cleanup
    return () => {
      mountRef.current.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <Box ref={mountRef} sx={{ width: 300, height: 200 }} />
  );
};

// Main App component
const Dashboard = () => {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ flexGrow: 1 }}>
        <AppBar position="static" color="default" elevation={0}>
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Welcome To Your Home Saving Plan
            </Typography>
            <IconButton>
              <Search />
            </IconButton>
            <IconButton>
              <Notifications />
            </IconButton>
            <IconButton>
              <AccountCircle />
            </IconButton>
            <Button variant="contained" color="primary" size="small">
              + Personalize Plan
            </Button>
          </Toolbar>
        </AppBar>

        <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
          <Grid container spacing={3}>
            {/* Saving Profile */}
            <Grid item xs={12} md={6}>
              <Paper elevation={0} sx={{ p: 2, display: 'flex', flexDirection: 'column', borderRadius: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" color="text.secondary">
                    Saving Profile
                  </Typography>
                  <IconButton>
                    <More />
                  </IconButton>
                </Box>
                <Typography variant="h3" component="div" sx={{ mb: 1 }}>
                  $12,975
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <ArrowUpward color="success" fontSize="small" />
                  <Typography variant="body2" color="success.main" sx={{ ml: 0.5 }}>
                    +$5,642
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                    This month
                  </Typography>
                </Box>
                <Button variant="contained" color="primary" fullWidth sx={{ mb: 1 }}>
                  TOP UP SAVINGS
                </Button>
                <Button variant="outlined" fullWidth>
                  WITHDRAW
                </Button>
              </Paper>
            </Grid>

            {/* Saving Growth Statistics */}
            <Grid item xs={12} md={6}>
              <Paper elevation={0} sx={{ p: 2, display: 'flex', flexDirection: 'column', borderRadius: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" color="text.secondary">
                    Saving Growth Statistics
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Button size="small" sx={{ mr: 1 }}>
                      CUSTOM CHART
                    </Button>
                    <Button size="small">
                      EXPORT
                    </Button>
                  </Box>
                </Box>
                <Box sx={{ height: 240 }}>
                  <Line options={chartOptions} data={growthData} />
                </Box>
              </Paper>
            </Grid>

            {/* Savings Allocation */}
            <Grid item xs={12} md={6}>
              <Paper elevation={0} sx={{ p: 2, display: 'flex', flexDirection: 'column', borderRadius: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" color="text.secondary">
                    Savings Allocation
                  </Typography>
                  <IconButton>
                    <More />
                  </IconButton>
                </Box>
                <Typography variant="h3" component="div" sx={{ mb: 1 }}>
                  $178,975
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <ArrowUpward color="success" fontSize="small" />
                  <Typography variant="body2" color="success.main" sx={{ ml: 0.5 }}>
                    +$12,400
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                    This month
                  </Typography>
                </Box>
                
                <LinearProgress variant="determinate" value={70} sx={{ height: 10, borderRadius: 5, mb: 2 }} />
                
                <List>
                  <ListItem sx={{ py: 1 }}>
                    <ListItemText primary="Saving Plans" secondary="60%" />
                    <Typography variant="body1">$107,385</Typography>
                  </ListItem>
                  <ListItem sx={{ py: 1 }}>
                    <ListItemText primary="Stocks" secondary="25%" />
                    <Typography variant="body1">$44,744</Typography>
                  </ListItem>
                  <ListItem sx={{ py: 1 }}>
                    <ListItemText primary="Bonds" secondary="15%" />
                    <Typography variant="body1">$26,846</Typography>
                  </ListItem>
                </List>
              </Paper>
            </Grid>

            {/* Popular Funds */}
            <Grid item xs={12} md={6}>
              <Paper elevation={0} sx={{ p: 2, display: 'flex', flexDirection: 'column', borderRadius: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" color="text.secondary">
                    Popular Funds
                  </Typography>
                  <Button size="small" color="primary">
                    See All Funds
                  </Button>
                </Box>
                
                <Grid container spacing={2}>
                  <Grid item xs={4}>
                    <Card elevation={0} sx={{ bgcolor: 'rgba(244, 67, 54, 0.1)', borderRadius: 2 }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Avatar sx={{ bgcolor: '#f44336', width: 24, height: 24, mr: 1 }}>R</Avatar>
                          <Typography variant="subtitle2">Rainbow Fund</Typography>
                        </Box>
                        <Typography variant="h6" sx={{ mb: 1 }}>36.4%</Typography>
                        <Box sx={{ height: 80 }}>
                          <Line options={{...chartOptions, scales: { x: { display: false }, y: { display: false }}}} 
                                data={fundData('#f44336')} />
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                  
                  <Grid item xs={4}>
                    <Card elevation={0} sx={{ bgcolor: 'rgba(33, 150, 243, 0.1)', borderRadius: 2 }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Avatar sx={{ bgcolor: '#2196f3', width: 24, height: 24, mr: 1 }}>B</Avatar>
                          <Typography variant="subtitle2">Blueride Index</Typography>
                        </Box>
                        <Typography variant="h6" sx={{ mb: 1 }}>38.2%</Typography>
                        <Box sx={{ height: 80 }}>
                          <Line options={{...chartOptions, scales: { x: { display: false }, y: { display: false }}}} 
                                data={fundData('#2196f3')} />
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                  
                  <Grid item xs={4}>
                    <Card elevation={0} sx={{ bgcolor: 'rgba(76, 175, 80, 0.1)', borderRadius: 2 }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Avatar sx={{ bgcolor: '#4caf50', width: 24, height: 24, mr: 1 }}>G</Avatar>
                          <Typography variant="subtitle2">Galaxy Trust</Typography>
                        </Box>
                        <Typography variant="h6" sx={{ mb: 1 }}>35.5%</Typography>
                        <Box sx={{ height: 80 }}>
                          <Line options={{...chartOptions, scales: { x: { display: false }, y: { display: false }}}} 
                                data={fundData('#4caf50')} />
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>

            {/* Collections */}
            <Grid item xs={12}>
              <Paper elevation={0} sx={{ p: 2, display: 'flex', flexDirection: 'column', borderRadius: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" color="text.secondary">
                    Collections
                  </Typography>
                  <Button size="small" color="primary">
                    See All
                  </Button>
                </Box>
                
                <Grid container spacing={2}>
                  {['High Return', 'High Growth', 'Tax Saving', 'Low Risk', 'New Offer', 'Green Flag'].map((item, index) => (
                    <Grid item xs={12} sm={6} md={4} lg={2} key={index}>
                      <Card elevation={0} sx={{ p: 2, borderRadius: 2, bgcolor: 'background.default', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                        <ThreeScene />
                        <Typography variant="body1" sx={{ mt: 1 }}>{item}</Typography>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Paper>
            </Grid>

            {/* Funds by Credit */}
            <Grid item xs={12}>
              <Paper elevation={0} sx={{ p: 2, display: 'flex', flexDirection: 'column', borderRadius: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" color="text.secondary">
                    Funds by Credit
                  </Typography>
                  <Button size="small" color="primary">
                    See All
                  </Button>
                </Box>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <Card elevation={0} sx={{ p: 2, borderRadius: 2, bgcolor: 'background.default' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Avatar sx={{ bgcolor: '#f44336', width: 24, height: 24, mr: 1 }}>C</Avatar>
                        <Typography variant="subtitle2">Credit Trust Harbor Index Fund</Typography>
                      </Box>
                      <Typography variant="h6" sx={{ mb: 1 }}>14.82%</Typography>
                      <Box sx={{ height: 80 }}>
                        <Line options={{...chartOptions, scales: { x: { display: false }, y: { display: false }}}} 
                              data={fundData('#f44336')} />
                      </Box>
                    </Card>
                  </Grid>
                  
                  <Grid item xs={12} md={4}>
                    <Card elevation={0} sx={{ p: 2, borderRadius: 2, bgcolor: 'background.default' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Avatar sx={{ bgcolor: '#2196f3', width: 24, height: 24, mr: 1 }}>C</Avatar>
                        <Typography variant="subtitle2">Credit Value Fund</Typography>
                      </Box>
                      <Typography variant="h6" sx={{ mb: 1 }}>17.63%</Typography>
                      <Box sx={{ height: 80 }}>
                        <Line options={{...chartOptions, scales: { x: { display: false }, y: { display: false }}}} 
                              data={fundData('#2196f3')} />
                      </Box>
                    </Card>
                  </Grid>
                  
                  <Grid item xs={12} md={4}>
                    <Card elevation={0} sx={{ p: 2, borderRadius: 2, bgcolor: 'background.default' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Avatar sx={{ bgcolor: '#4caf50', width: 24, height: 24, mr: 1 }}>C</Avatar>
                        <Typography variant="subtitle2">Credit FT 5-Year High Yield Fund</Typography>
                      </Box>
                      <Typography variant="h6" sx={{ mb: 1 }}>14.38%</Typography>
                      <Box sx={{ height: 80 }}>
                        <Line options={{...chartOptions, scales: { x: { display: false }, y: { display: false }}}} 
                              data={fundData('#4caf50')} />
                      </Box>
                    </Card>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>

            {/* Other Recommended Savers */}
            <Grid item xs={12}>
              <Paper elevation={0} sx={{ p: 2, display: 'flex', flexDirection: 'column', borderRadius: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" color="text.secondary">
                    Other Recommended Savers
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Button size="small" sx={{ mr: 1 }}>
                      CUSTOM CHART
                    </Button>
                    <Button size="small">
                      EXPORT
                    </Button>
                  </Box>
                </Box>
                
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Amount</TableCell>
                      <TableCell>Yield Date</TableCell>
                      <TableCell>Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar sx={{ width: 24, height: 24, mr: 1 }}>C</Avatar>
                          <Typography variant="body2">U.S. Risk-Free Treasury</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>$15,000</TableCell>
                      <TableCell>15 Jan 2026</TableCell>
                      <TableCell>
                        <Button variant="contained" size="small" color="primary">
                          Invest
                        </Button>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar sx={{ width: 24, height: 24, mr: 1 }}>B</Avatar>
                          <Typography variant="body2">Berlin Safe Bank Security</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>$7,500</TableCell>
                      <TableCell>14 Feb 2025</TableCell>
                      <TableCell>
                        <Button variant="contained" size="small" color="primary">
                          Invest
                        </Button>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </ThemeProvider>
  );
};

// Table components
const Table = ({ children }) => (
  <Box sx={{ width: '100%', overflow: 'auto' }}>
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      {children}
    </table>
  </Box>
);

const TableHead = ({ children }) => (
  <thead>
    {children}
  </thead>
);

const TableBody = ({ children }) => (
  <tbody>
    {children}
  </tbody>
);

const TableRow = ({ children }) => (
  <tr>
    {children}
  </tr>
);

const TableCell = ({ children }) => (
  <td style={{ padding: '12px 16px', borderBottom: '1px solid rgba(0, 0, 0, 0.12)' }}>
    {children}
  </td>
);

export default Dashboard;
