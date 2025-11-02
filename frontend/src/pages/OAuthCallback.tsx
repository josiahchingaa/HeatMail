import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Box, CircularProgress, Typography, Alert } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

const OAuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setToken } = useAuth();

  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('error');

    if (error) {
      // Redirect to login with error message
      setTimeout(() => {
        navigate(`/login?error=${error}`);
      }, 2000);
      return;
    }

    if (token) {
      // Store token and fetch user data
      localStorage.setItem('token', token);
      if (setToken) {
        setToken(token);
      }

      // Redirect to dashboard
      setTimeout(() => {
        navigate('/dashboard');
      }, 1000);
    } else {
      // No token received
      setTimeout(() => {
        navigate('/login?error=oauth_failed');
      }, 2000);
    }
  }, [searchParams, navigate, setToken]);

  const error = searchParams.get('error');

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f5f5f5',
      }}
    >
      {error ? (
        <Alert severity="error" sx={{ mb: 3, maxWidth: '500px' }}>
          Authentication failed: {error}
          <Typography variant="body2" sx={{ mt: 1 }}>
            Redirecting to login page...
          </Typography>
        </Alert>
      ) : (
        <>
          <CircularProgress size={60} />
          <Typography variant="h6" sx={{ mt: 3 }}>
            Completing authentication...
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Please wait while we sign you in.
          </Typography>
        </>
      )}
    </Box>
  );
};

export default OAuthCallback;
