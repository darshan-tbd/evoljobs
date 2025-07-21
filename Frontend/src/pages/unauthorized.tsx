import React from 'react';
import { useRouter } from 'next/router';
import {
  Box,
  Typography,
  Button,
  Container,
  Card,
  CardContent,
} from '@mui/material';
import { Block, Home, ArrowBack } from '@mui/icons-material';

const UnauthorizedPage: React.FC = () => {
  const router = useRouter();

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          textAlign: 'center',
        }}
      >
        <Card sx={{ p: 4, width: '100%' }}>
          <CardContent>
            <Block color="error" sx={{ fontSize: 64, mb: 2 }} />
            <Typography variant="h4" component="h1" gutterBottom color="error">
              Access Denied
            </Typography>
            <Typography variant="body1" color="textSecondary" sx={{ mb: 4 }}>
              You don't have permission to access this page. Please contact an administrator if you believe this is an error.
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                startIcon={<ArrowBack />}
                onClick={() => router.back()}
              >
                Go Back
              </Button>
              <Button
                variant="outlined"
                startIcon={<Home />}
                onClick={() => router.push('/dashboard')}
              >
                Go to Dashboard
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
};

export default UnauthorizedPage; 