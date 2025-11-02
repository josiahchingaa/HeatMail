import { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  AppBar,
  Toolbar,
  IconButton,
  Stepper,
  Step,
  StepLabel,
  Alert,
  CircularProgress,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';

const AddMailbox = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeStep, setActiveStep] = useState(0);
  const [provider, setProvider] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    email: '',
    provider: '',
    smtpHost: '',
    smtpPort: '587',
    smtpUser: '',
    smtpPassword: '',
    imapHost: '',
    imapPort: '993',
    imapUser: '',
    imapPassword: '',
    useTLS: true,
  });

  const steps = ['Select Provider', 'Enter Credentials', 'Test & Save'];

  const providers = [
    { value: 'gmail', label: 'Gmail (Google Workspace)', smtp: 'smtp.gmail.com', imap: 'imap.gmail.com' },
    { value: 'outlook', label: 'Outlook / Office 365', smtp: 'smtp.office365.com', imap: 'outlook.office365.com' },
    { value: 'yahoo', label: 'Yahoo Mail', smtp: 'smtp.mail.yahoo.com', imap: 'imap.mail.yahoo.com' },
    { value: 'custom', label: 'Custom SMTP/IMAP', smtp: '', imap: '' },
  ];

  const handleProviderSelect = (selectedProvider: string) => {
    setProvider(selectedProvider);
    const providerConfig = providers.find(p => p.value === selectedProvider);

    if (providerConfig && selectedProvider !== 'custom') {
      setFormData({
        ...formData,
        provider: selectedProvider,
        smtpHost: providerConfig.smtp,
        imapHost: providerConfig.imap,
        smtpPort: '587',
        imapPort: '993',
      });
    } else {
      setFormData({
        ...formData,
        provider: selectedProvider,
      });
    }

    setActiveStep(1);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleTestConnection = async () => {
    setError('');
    setLoading(true);

    try {
      // First create the mailbox
      const response = await api.post('/email-accounts', {
        email: formData.email,
        provider: formData.provider,
        smtpHost: formData.smtpHost,
        smtpPort: parseInt(formData.smtpPort),
        smtpUser: formData.smtpUser || formData.email,
        smtpPassword: formData.smtpPassword,
        imapHost: formData.imapHost,
        imapPort: parseInt(formData.imapPort),
        imapUser: formData.imapUser || formData.email,
        imapPassword: formData.imapPassword,
        useTLS: formData.useTLS,
      });

      if (response.data.success) {
        const mailboxId = response.data.data.id;

        // Test the connection
        try {
          const testResponse = await api.post(`/email-accounts/${mailboxId}/test`);

          if (testResponse.data.success) {
            toast.success('Mailbox connected successfully!');
            setTimeout(() => {
              navigate('/mailboxes');
            }, 1500);
          } else {
            setError('Connection test failed. Please check your credentials.');
          }
        } catch (testError: any) {
          setError(testError.response?.data?.message || 'Connection test failed');
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to connect mailbox');
    } finally {
      setLoading(false);
    }
  };

  const handleSkipTest = async () => {
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/email-accounts', {
        email: formData.email,
        provider: formData.provider,
        smtpHost: formData.smtpHost,
        smtpPort: parseInt(formData.smtpPort),
        smtpUser: formData.smtpUser || formData.email,
        smtpPassword: formData.smtpPassword,
        imapHost: formData.imapHost,
        imapPort: parseInt(formData.imapPort),
        imapUser: formData.imapUser || formData.email,
        imapPassword: formData.imapPassword,
        useTLS: formData.useTLS,
      });

      if (response.data.success) {
        toast.success('Mailbox added successfully!');
        setTimeout(() => {
          navigate('/mailboxes');
        }, 1500);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to add mailbox');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      <AppBar position="static" elevation={0}>
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={() => navigate('/dashboard')}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, ml: 2 }}>
            Connect Email Account
          </Typography>
          <Typography variant="body2">
            {user?.firstName} {user?.lastName}
          </Typography>
        </Toolbar>
      </AppBar>

      <Box sx={{ maxWidth: '900px', mx: 'auto', mt: 4, mb: 4, px: { xs: 2, sm: 3 } }}>
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {activeStep === 0 && (
          <Paper sx={{ p: 4 }}>
            <Typography variant="h5" gutterBottom fontWeight="bold">
              Select Your Email Provider
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
              Choose your email provider to get started. We support Gmail, Outlook, and custom SMTP/IMAP.
            </Typography>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
              {providers.map((p) => (
                <Paper
                  key={p.value}
                  elevation={2}
                  sx={{
                    p: 3,
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'all 0.3s',
                    border: '2px solid',
                    borderColor: 'transparent',
                    '&:hover': {
                      borderColor: 'primary.main',
                      transform: 'translateY(-4px)',
                      boxShadow: 4,
                    },
                  }}
                  onClick={() => handleProviderSelect(p.value)}
                >
                  <Typography variant="h6" fontWeight="bold">
                    {p.label}
                  </Typography>
                  {p.value === 'gmail' && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Recommended for Gmail & Google Workspace
                    </Typography>
                  )}
                  {p.value === 'custom' && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      For other email providers
                    </Typography>
                  )}
                </Paper>
              ))}
            </Box>
          </Paper>
        )}

        {activeStep === 1 && (
          <Paper sx={{ p: 4 }}>
            <Typography variant="h5" gutterBottom fontWeight="bold">
              Enter Your Email Credentials
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {provider === 'gmail'
                ? 'For Gmail, you need to use an App Password. Go to your Google Account > Security > 2-Step Verification > App passwords to generate one.'
                : 'Enter your email credentials below. Your information is encrypted and secure.'}
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                fullWidth
                label="Email Address"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                helperText="The email address you want to warm up"
              />

              <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
                SMTP Settings (Sending)
              </Typography>

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '2fr 1fr' }, gap: 2 }}>
                <TextField
                  fullWidth
                  label="SMTP Host"
                  name="smtpHost"
                  value={formData.smtpHost}
                  onChange={handleChange}
                  required
                  disabled={provider !== 'custom'}
                />
                <TextField
                  fullWidth
                  label="SMTP Port"
                  name="smtpPort"
                  type="number"
                  value={formData.smtpPort}
                  onChange={handleChange}
                  required
                />
              </Box>

              <TextField
                fullWidth
                label="SMTP Username"
                name="smtpUser"
                value={formData.smtpUser}
                onChange={handleChange}
                helperText="Usually same as email address (leave blank to use email)"
              />

              <TextField
                fullWidth
                label="SMTP Password"
                name="smtpPassword"
                type="password"
                value={formData.smtpPassword}
                onChange={handleChange}
                required
                helperText={provider === 'gmail' ? 'Use App Password, not your regular password' : 'Your email password'}
              />

              <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
                IMAP Settings (Receiving)
              </Typography>

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '2fr 1fr' }, gap: 2 }}>
                <TextField
                  fullWidth
                  label="IMAP Host"
                  name="imapHost"
                  value={formData.imapHost}
                  onChange={handleChange}
                  required
                  disabled={provider !== 'custom'}
                />
                <TextField
                  fullWidth
                  label="IMAP Port"
                  name="imapPort"
                  type="number"
                  value={formData.imapPort}
                  onChange={handleChange}
                  required
                />
              </Box>

              <TextField
                fullWidth
                label="IMAP Username"
                name="imapUser"
                value={formData.imapUser}
                onChange={handleChange}
                helperText="Usually same as email address (leave blank to use email)"
              />

              <TextField
                fullWidth
                label="IMAP Password"
                name="imapPassword"
                type="password"
                value={formData.imapPassword}
                onChange={handleChange}
                required
                helperText="Usually same as SMTP password"
              />

              <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
                <Button
                  variant="outlined"
                  onClick={() => setActiveStep(0)}
                >
                  Back
                </Button>
                <Button
                  variant="contained"
                  onClick={() => setActiveStep(2)}
                  disabled={!formData.email || !formData.smtpPassword || !formData.imapPassword}
                >
                  Continue
                </Button>
              </Box>
            </Box>
          </Paper>
        )}

        {activeStep === 2 && (
          <Paper sx={{ p: 4 }}>
            <Typography variant="h5" gutterBottom fontWeight="bold">
              Test Connection & Save
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              We'll test the connection to make sure everything is configured correctly.
            </Typography>

            <Box sx={{ backgroundColor: '#f5f5f5', p: 3, borderRadius: 2, mb: 3 }}>
              <Typography variant="body2" fontWeight="bold" gutterBottom>
                Email: {formData.email}
              </Typography>
              <Typography variant="body2" gutterBottom>
                Provider: {providers.find(p => p.value === provider)?.label}
              </Typography>
              <Typography variant="body2" gutterBottom>
                SMTP: {formData.smtpHost}:{formData.smtpPort}
              </Typography>
              <Typography variant="body2">
                IMAP: {formData.imapHost}:{formData.imapPort}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="outlined"
                onClick={() => setActiveStep(1)}
                disabled={loading}
              >
                Back
              </Button>
              <Button
                variant="contained"
                onClick={handleTestConnection}
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : null}
              >
                {loading ? 'Testing...' : 'Test & Save'}
              </Button>
              <Button
                variant="text"
                onClick={handleSkipTest}
                disabled={loading}
              >
                Skip Test & Save
              </Button>
            </Box>
          </Paper>
        )}
      </Box>
    </Box>
  );
};

export default AddMailbox;
