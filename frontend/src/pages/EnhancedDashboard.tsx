import { useEffect, useState } from 'react';
import {
  Container,
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
  Button,
  AppBar,
  Toolbar,
  IconButton,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  Email as EmailIcon,
  TrendingUp as TrendingUpIcon,
  CheckCircle as CheckCircleIcon,
  AccountCircle as AccountCircleIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { format, subDays } from 'date-fns';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const EnhancedDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [stats, setStats] = useState({
    totalMailboxes: 0,
    activeMailboxes: 0,
    emailsSentToday: 0,
    averageHealthScore: 0,
  });
  const [emailVolumeData, setEmailVolumeData] = useState<any[]>([]);
  const [healthScoreData, setHealthScoreData] = useState<any[]>([]);
  const [deliveryData, setDeliveryData] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboardData();
    generateMockChartData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await api.get('/user/dashboard');
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    }
  };

  const generateMockChartData = () => {
    // Email volume over last 30 days
    const volumeData = [];
    for (let i = 29; i >= 0; i--) {
      const date = subDays(new Date(), i);
      volumeData.push({
        date: format(date, 'MMM dd'),
        sent: Math.floor(Math.random() * 50) + 20,
        received: Math.floor(Math.random() * 45) + 15,
        replied: Math.floor(Math.random() * 20) + 5,
      });
    }
    setEmailVolumeData(volumeData);

    // Health score trend
    const healthData = [];
    for (let i = 29; i >= 0; i--) {
      const date = subDays(new Date(), i);
      healthData.push({
        date: format(date, 'MMM dd'),
        score: Math.floor(Math.random() * 30) + 65,
      });
    }
    setHealthScoreData(healthData);

    // Delivery statistics
    setDeliveryData([
      { name: 'Delivered', value: 892, color: '#00C49F' },
      { name: 'Bounced', value: 23, color: '#FF8042' },
      { name: 'Spam', value: 15, color: '#FFBB28' },
      { name: 'Pending', value: 45, color: '#0088FE' },
    ]);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const StatCard = ({ title, value, subtitle, icon, color }: any) => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Typography variant="h6" component="div" color="text.secondary">
            {title}
          </Typography>
          <Box
            sx={{
              backgroundColor: `${color}15`,
              borderRadius: '8px',
              p: 1,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {icon}
          </Box>
        </Box>
        <Typography variant="h3" component="div" fontWeight="bold" mb={0.5}>
          {value}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {subtitle}
        </Typography>
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ flexGrow: 1, backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      <AppBar position="static" elevation={0}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
            HeatMail
          </Typography>
          <Typography variant="body1" sx={{ mr: 2 }}>
            {user?.firstName} {user?.lastName}
          </Typography>
          <IconButton
            size="large"
            aria-label="account of current user"
            aria-controls="menu-appbar"
            aria-haspopup="true"
            onClick={handleMenuOpen}
            color="inherit"
          >
            <AccountCircleIcon />
          </IconButton>
          <Menu
            id="menu-appbar"
            anchorEl={anchorEl}
            anchorOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            keepMounted
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
          >
            <MenuItem onClick={() => { handleMenuClose(); navigate('/profile'); }}>
              Profile
            </MenuItem>
            {user?.role === 'admin' && (
              <MenuItem onClick={() => { handleMenuClose(); navigate('/admin'); }}>
                Admin Panel
              </MenuItem>
            )}
            <MenuItem onClick={handleLogout}>Logout</MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box mb={4}>
          <Typography variant="h4" gutterBottom fontWeight="bold">
            Welcome back, {user?.firstName}!
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Here's an overview of your email warmup activities
          </Typography>
        </Box>

        {/* Stats Cards */}
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 3, mb: 4 }}>
          <StatCard
            title="Total Mailboxes"
            value={stats.totalMailboxes}
            subtitle="Connected accounts"
            icon={<EmailIcon sx={{ color: '#1976d2' }} />}
            color="#1976d2"
          />
          <StatCard
            title="Active Warming"
            value={stats.activeMailboxes}
            subtitle="Currently active"
            icon={<CheckCircleIcon sx={{ color: '#2e7d32' }} />}
            color="#2e7d32"
          />
          <StatCard
            title="Sent Today"
            value={stats.emailsSentToday}
            subtitle="Warmup emails"
            icon={<TrendingUpIcon sx={{ color: '#ed6c02' }} />}
            color="#ed6c02"
          />
          <StatCard
            title="Health Score"
            value={`${stats.averageHealthScore}%`}
            subtitle="Average score"
            icon={<WarningIcon sx={{ color: '#9c27b0' }} />}
            color="#9c27b0"
          />
        </Box>

        {/* Charts Row 1 */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' }, gap: 3, mb: 3 }}>
          {/* Email Volume Chart */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom fontWeight="bold">
              Email Activity (Last 30 Days)
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={emailVolumeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="sent"
                  stackId="1"
                  stroke="#1976d2"
                  fill="#1976d2"
                  fillOpacity={0.6}
                />
                <Area
                  type="monotone"
                  dataKey="received"
                  stackId="1"
                  stroke="#2e7d32"
                  fill="#2e7d32"
                  fillOpacity={0.6}
                />
                <Area
                  type="monotone"
                  dataKey="replied"
                  stackId="1"
                  stroke="#ed6c02"
                  fill="#ed6c02"
                  fillOpacity={0.6}
                />
              </AreaChart>
            </ResponsiveContainer>
          </Paper>

          {/* Delivery Statistics */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom fontWeight="bold">
              Delivery Stats
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={deliveryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {deliveryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Box>

        {/* Health Score Trend */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom fontWeight="bold">
            Health Score Trend
          </Typography>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={healthScoreData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="score"
                stroke="#9c27b0"
                strokeWidth={3}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Paper>

        {/* Quick Actions */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom fontWeight="bold">
            Quick Actions
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button variant="contained" size="large" onClick={() => navigate('/mailboxes/add')}>
              Connect New Mailbox
            </Button>
            <Button variant="outlined" size="large" onClick={() => navigate('/mailboxes')}>
              View All Mailboxes
            </Button>
            <Button variant="outlined" size="large" onClick={() => navigate('/activity')}>
              View Activity
            </Button>
            <Button variant="outlined" size="large" onClick={() => navigate('/settings')}>
              Settings
            </Button>
          </Box>
        </Paper>

        {/* Getting Started */}
        {stats.totalMailboxes === 0 && (
          <Paper sx={{ p: 4, bgcolor: 'primary.main', color: 'white', textAlign: 'center' }}>
            <Typography variant="h5" gutterBottom fontWeight="bold">
              Get Started with HeatMail
            </Typography>
            <Typography variant="body1" paragraph sx={{ maxWidth: '600px', mx: 'auto', mt: 2 }}>
              Welcome to HeatMail! Connect your first email account to start warming up and improving your email deliverability.
            </Typography>
            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" gutterBottom>
                How it works:
              </Typography>
              <Box sx={{ textAlign: 'left', maxWidth: '500px', mx: 'auto', mt: 2 }}>
                <Typography variant="body1" paragraph>
                  • Connect your email account (Gmail, Outlook, or custom SMTP)
                </Typography>
                <Typography variant="body1" paragraph>
                  • We'll automatically pair you with other users for warmup
                </Typography>
                <Typography variant="body1" paragraph>
                  • Monitor your email health scores and deliverability in real-time
                </Typography>
              </Box>
            </Box>
            <Button
              variant="contained"
              color="secondary"
              size="large"
              sx={{ mt: 3 }}
              onClick={() => navigate('/mailboxes/add')}
            >
              Connect Your First Mailbox
            </Button>
          </Paper>
        )}
      </Container>
    </Box>
  );
};

export default EnhancedDashboard;
