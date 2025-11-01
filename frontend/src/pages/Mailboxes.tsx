import { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  AppBar,
  Toolbar,
  TextField,
  InputAdornment,
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  Search as SearchIcon,
  Add as AddIcon,
  PlayArrow as PlayArrowIcon,
  Pause as PauseIcon,
  Delete as DeleteIcon,
  Settings as SettingsIcon,
  TrendingUp as TrendingUpIcon,
  AccountCircle as AccountCircleIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

interface Mailbox {
  id: number;
  email: string;
  provider: string;
  status: string;
  healthScore: number;
  emailsSentToday: number;
  warmupProgress: number;
  lastActive: string;
}

const Mailboxes = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [mailboxes, setMailboxes] = useState<Mailbox[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedMailbox, setSelectedMailbox] = useState<Mailbox | null>(null);
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);

  useEffect(() => {
    fetchMailboxes();
  }, []);

  const fetchMailboxes = async () => {
    try {
      const response = await api.get('/user/mailboxes');
      if (response.data.success) {
        setMailboxes(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch mailboxes:', error);
      // Mock data for demo
      setMailboxes([
        {
          id: 1,
          email: 'john@company.com',
          provider: 'Gmail',
          status: 'active',
          healthScore: 87,
          emailsSentToday: 45,
          warmupProgress: 65,
          lastActive: '2 minutes ago',
        },
        {
          id: 2,
          email: 'sales@company.com',
          provider: 'Outlook',
          status: 'paused',
          healthScore: 72,
          emailsSentToday: 0,
          warmupProgress: 42,
          lastActive: '1 hour ago',
        },
        {
          id: 3,
          email: 'support@company.com',
          provider: 'Gmail',
          status: 'active',
          healthScore: 94,
          emailsSentToday: 52,
          warmupProgress: 88,
          lastActive: '5 minutes ago',
        },
      ]);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'paused':
        return 'warning';
      case 'error':
        return 'error';
      default:
        return 'default';
    }
  };

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return '#2e7d32'; // green
    if (score >= 60) return '#ed6c02'; // orange
    return '#d32f2f'; // red
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };

  const handleMailboxMenuOpen = (event: React.MouseEvent<HTMLElement>, mailbox: Mailbox) => {
    setAnchorEl(event.currentTarget);
    setSelectedMailbox(mailbox);
  };

  const handleMailboxMenuClose = () => {
    setAnchorEl(null);
    setSelectedMailbox(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const filteredMailboxes = mailboxes.filter((mailbox) =>
    mailbox.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Box sx={{ flexGrow: 1, backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      <AppBar position="static" elevation={0}>
        <Toolbar>
          <Typography
            variant="h6"
            component="div"
            sx={{ flexGrow: 1, fontWeight: 'bold', cursor: 'pointer' }}
            onClick={() => navigate('/dashboard')}
          >
            HeatMail
          </Typography>
          <Typography variant="body1" sx={{ mr: 2 }}>
            {user?.firstName} {user?.lastName}
          </Typography>
          <IconButton
            size="large"
            aria-label="account menu"
            onClick={handleMenuOpen}
            color="inherit"
          >
            <AccountCircleIcon />
          </IconButton>
          <Menu
            anchorEl={menuAnchorEl}
            open={Boolean(menuAnchorEl)}
            onClose={handleMenuClose}
          >
            <MenuItem onClick={() => { handleMenuClose(); navigate('/dashboard'); }}>
              Dashboard
            </MenuItem>
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
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Box>
            <Typography variant="h4" gutterBottom fontWeight="bold">
              Email Mailboxes
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage your connected email accounts
            </Typography>
          </Box>
          <Button
            variant="contained"
            size="large"
            startIcon={<AddIcon />}
            onClick={() => navigate('/mailboxes/add')}
          >
            Connect Mailbox
          </Button>
        </Box>

        <Paper sx={{ p: 3, mb: 3 }}>
          <Box display="flex" gap={2} alignItems="center" mb={3}>
            <TextField
              fullWidth
              placeholder="Search mailboxes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Box>

          {filteredMailboxes.length === 0 ? (
            <Box textAlign="center" py={8}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No mailboxes found
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                {searchQuery
                  ? 'Try adjusting your search'
                  : 'Connect your first email account to get started'}
              </Typography>
              {!searchQuery && (
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => navigate('/mailboxes/add')}
                  sx={{ mt: 2 }}
                >
                  Connect Mailbox
                </Button>
              )}
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Email Address</strong></TableCell>
                    <TableCell><strong>Provider</strong></TableCell>
                    <TableCell><strong>Status</strong></TableCell>
                    <TableCell><strong>Health Score</strong></TableCell>
                    <TableCell><strong>Sent Today</strong></TableCell>
                    <TableCell><strong>Progress</strong></TableCell>
                    <TableCell><strong>Last Active</strong></TableCell>
                    <TableCell align="right"><strong>Actions</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredMailboxes.map((mailbox) => (
                    <TableRow
                      key={mailbox.id}
                      hover
                      sx={{ cursor: 'pointer' }}
                      onClick={() => navigate(`/mailboxes/${mailbox.id}`)}
                    >
                      <TableCell>
                        <Typography variant="body1" fontWeight="medium">
                          {mailbox.email}
                        </Typography>
                      </TableCell>
                      <TableCell>{mailbox.provider}</TableCell>
                      <TableCell>
                        <Chip
                          label={mailbox.status.toUpperCase()}
                          color={getStatusColor(mailbox.status) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <TrendingUpIcon
                            sx={{ color: getHealthScoreColor(mailbox.healthScore), fontSize: 20 }}
                          />
                          <Typography
                            fontWeight="bold"
                            sx={{ color: getHealthScoreColor(mailbox.healthScore) }}
                          >
                            {mailbox.healthScore}%
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>{mailbox.emailsSentToday}</TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Box
                            sx={{
                              width: 100,
                              height: 8,
                              backgroundColor: '#e0e0e0',
                              borderRadius: 4,
                              overflow: 'hidden',
                            }}
                          >
                            <Box
                              sx={{
                                width: `${mailbox.warmupProgress}%`,
                                height: '100%',
                                backgroundColor: '#1976d2',
                              }}
                            />
                          </Box>
                          <Typography variant="body2">{mailbox.warmupProgress}%</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {mailbox.lastActive}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMailboxMenuOpen(e, mailbox);
                          }}
                        >
                          <MoreVertIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      </Container>

      {/* Mailbox Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMailboxMenuClose}
      >
        <MenuItem onClick={() => { handleMailboxMenuClose(); navigate(`/mailboxes/${selectedMailbox?.id}`); }}>
          <SettingsIcon fontSize="small" sx={{ mr: 1 }} />
          View Details
        </MenuItem>
        <MenuItem onClick={handleMailboxMenuClose}>
          {selectedMailbox?.status === 'active' ? (
            <>
              <PauseIcon fontSize="small" sx={{ mr: 1 }} />
              Pause Warmup
            </>
          ) : (
            <>
              <PlayArrowIcon fontSize="small" sx={{ mr: 1 }} />
              Resume Warmup
            </>
          )}
        </MenuItem>
        <MenuItem onClick={handleMailboxMenuClose} sx={{ color: 'error.main' }}>
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          Delete Mailbox
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default Mailboxes;
