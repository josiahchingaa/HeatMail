import { Box, Button, Container, Typography, Paper, Grid } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp as TrendingUpIcon,
  Security as SecurityIcon,
  Speed as SpeedIcon,
  AutoGraph as AutoGraphIcon,
} from '@mui/icons-material';

const LandingPage = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <TrendingUpIcon sx={{ fontSize: 48, color: '#1976d2' }} />,
      title: 'Improve Deliverability',
      description: 'Gradually warm up your email accounts to improve inbox placement and avoid spam folders.',
    },
    {
      icon: <AutoGraphIcon sx={{ fontSize: 48, color: '#2e7d32' }} />,
      title: 'Automated Warmup',
      description: 'Set it and forget it. Our system automatically sends and replies to warmup emails.',
    },
    {
      icon: <SecurityIcon sx={{ fontSize: 48, color: '#ed6c02' }} />,
      title: 'Safe & Secure',
      description: 'Bank-level encryption for your email credentials. Your data is always protected.',
    },
    {
      icon: <SpeedIcon sx={{ fontSize: 48, color: '#9c27b0' }} />,
      title: 'Fast Setup',
      description: 'Connect your Gmail or any SMTP account in minutes and start warming immediately.',
    },
  ];

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      {/* Hero Section */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #1976d2 0%, #2e7d32 100%)',
          color: 'white',
          pt: 8,
          pb: 10,
        }}
      >
        <Container maxWidth="lg">
          <Box textAlign="center" mb={4}>
            <Typography variant="h2" component="h1" fontWeight="bold" gutterBottom sx={{ fontSize: { xs: '2.5rem', md: '3.5rem' } }}>
              HeatMail
            </Typography>
            <Typography variant="h5" component="h2" sx={{ mb: 4, opacity: 0.95, fontSize: { xs: '1.25rem', md: '1.5rem' } }}>
              Warm Up Your Email Accounts for Maximum Deliverability
            </Typography>
            <Typography variant="body1" sx={{ mb: 5, maxWidth: '800px', mx: 'auto', fontSize: { xs: '1rem', md: '1.125rem' } }}>
              Improve your email reputation, avoid spam filters, and ensure your important messages reach the inbox.
              Start warming your email accounts today.
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                color="secondary"
                size="large"
                onClick={() => navigate('/register')}
                sx={{ px: 5, py: 1.5, fontSize: '1.1rem', fontWeight: 'bold' }}
              >
                Get Started Free
              </Button>
              <Button
                variant="outlined"
                size="large"
                onClick={() => navigate('/login')}
                sx={{
                  px: 5,
                  py: 1.5,
                  fontSize: '1.1rem',
                  color: 'white',
                  borderColor: 'white',
                  '&:hover': { borderColor: 'white', backgroundColor: 'rgba(255,255,255,0.1)' },
                }}
              >
                Login
              </Button>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Typography variant="h3" textAlign="center" fontWeight="bold" gutterBottom sx={{ mb: 6 }}>
          Why Choose HeatMail?
        </Typography>

        <Grid container spacing={4}>
          {features.map((feature, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Paper
                elevation={2}
                sx={{
                  p: 4,
                  height: '100%',
                  textAlign: 'center',
                  transition: 'transform 0.3s, box-shadow 0.3s',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: 6,
                  },
                }}
              >
                <Box mb={2}>{feature.icon}</Box>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  {feature.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {feature.description}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* How It Works Section */}
      <Box sx={{ backgroundColor: 'white', py: 8 }}>
        <Container maxWidth="lg">
          <Typography variant="h3" textAlign="center" fontWeight="bold" gutterBottom sx={{ mb: 6 }}>
            How It Works
          </Typography>

          <Grid container spacing={4}>
            <Grid item xs={12} md={4}>
              <Box textAlign="center">
                <Box
                  sx={{
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    backgroundColor: '#1976d2',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '2rem',
                    fontWeight: 'bold',
                    mx: 'auto',
                    mb: 2,
                  }}
                >
                  1
                </Box>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Create Account
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Sign up for free and get access to your dashboard in seconds.
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12} md={4}>
              <Box textAlign="center">
                <Box
                  sx={{
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    backgroundColor: '#2e7d32',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '2rem',
                    fontWeight: 'bold',
                    mx: 'auto',
                    mb: 2,
                  }}
                >
                  2
                </Box>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Connect Email
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Connect your Gmail or any email account via SMTP/IMAP in minutes.
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12} md={4}>
              <Box textAlign="center">
                <Box
                  sx={{
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    backgroundColor: '#ed6c02',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '2rem',
                    fontWeight: 'bold',
                    mx: 'auto',
                    mb: 2,
                  }}
                >
                  3
                </Box>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Start Warming
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Watch your email health improve as we automatically warm your accounts.
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* CTA Section */}
      <Box sx={{ background: 'linear-gradient(135deg, #1976d2 0%, #2e7d32 100%)', color: 'white', py: 8 }}>
        <Container maxWidth="md">
          <Box textAlign="center">
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              Ready to Improve Your Email Deliverability?
            </Typography>
            <Typography variant="body1" sx={{ mb: 4, opacity: 0.95 }}>
              Join thousands of users who are warming their email accounts with HeatMail.
            </Typography>
            <Button
              variant="contained"
              color="secondary"
              size="large"
              onClick={() => navigate('/register')}
              sx={{ px: 6, py: 2, fontSize: '1.2rem', fontWeight: 'bold' }}
            >
              Get Started Now
            </Button>
          </Box>
        </Container>
      </Box>

      {/* Footer */}
      <Box sx={{ backgroundColor: '#263238', color: 'white', py: 4 }}>
        <Container maxWidth="lg">
          <Typography variant="body2" textAlign="center">
            © 2025 HeatMail. All rights reserved.
          </Typography>
        </Container>
      </Box>
    </Box>
  );
};

export default LandingPage;
