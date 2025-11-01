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
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [stats, setStats] = useState({
    totalMailboxes: 0,
    activeMailboxes: 0,
    emailsSentToday: 0,
    averageHealthScore: 0,
  });

  useEffect(() => {
    fetchDashboardData();
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

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
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
        <Typography variant="h4" gutterBottom>
          Welcome back, {user?.firstName}!
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Here's an overview of your email warmup activities
        </Typography>

        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 3, mb: 3 }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <EmailIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6" component="div">
                  Mailboxes
                </Typography>
              </Box>
              <Typography variant="h4" component="div">
                {stats.totalMailboxes}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total connected
              </Typography>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <CheckCircleIcon color="success" sx={{ mr: 1 }} />
                <Typography variant="h6" component="div">
                  Active
                </Typography>
              </Box>
              <Typography variant="h4" component="div">
                {stats.activeMailboxes}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Currently warming
              </Typography>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <TrendingUpIcon color="info" sx={{ mr: 1 }} />
                <Typography variant="h6" component="div">
                  Sent Today
                </Typography>
              </Box>
              <Typography variant="h4" component="div">
                {stats.emailsSentToday}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Warmup emails
              </Typography>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <TrendingUpIcon color="warning" sx={{ mr: 1 }} />
                <Typography variant="h6" component="div">
                  Health Score
                </Typography>
              </Box>
              <Typography variant="h4" component="div">
                {stats.averageHealthScore}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Average score
              </Typography>
            </CardContent>
          </Card>
        </Box>

        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Quick Actions
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button variant="contained" onClick={() => navigate('/mailboxes/add')}>
              Connect New Mailbox
            </Button>
            <Button variant="outlined" onClick={() => navigate('/mailboxes')}>
              View All Mailboxes
            </Button>
            <Button variant="outlined" onClick={() => navigate('/activity')}>
              View Activity
            </Button>
          </Box>
        </Paper>

        {stats.totalMailboxes === 0 && (
          <Paper sx={{ p: 3, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
            <Typography variant="h6" gutterBottom>
              Get Started with HeatMail
            </Typography>
            <Typography variant="body1" paragraph>
              Welcome to HeatMail! To start warming up your email accounts:
            </Typography>
            <ol>
              <li>Connect your first email account</li>
              <li>We'll automatically pair you with other users for warmup</li>
              <li>Monitor your email health scores and deliverability</li>
            </ol>
            <Button
              variant="contained"
              color="secondary"
              sx={{ mt: 2 }}
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

export default Dashboard;
