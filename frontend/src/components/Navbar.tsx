import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
} from '@mui/material';
import { Logout, Home, Favorite, CloudUpload, PhotoLibrary, Person, Label } from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { logout } from '../store/authSlice';
import NotificationBell from './NotificationBell';
import '../styles/navbar.css';

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const [isVisible, setIsVisible] = useState(true);
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleMouseMove = () => {
      setIsVisible(true);
      
      // Clear existing timer
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
      
      // Set new timer for 3 seconds of inactivity
      inactivityTimerRef.current = setTimeout(() => {
        setIsVisible(false);
      }, 3000);
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
    };
  }, []);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const canUpload = user?.role === 'PHOTOGRAPHER' || user?.role === 'COORDINATOR' || user?.role === 'ADMIN';

  return (
    <AppBar
      position="fixed"
      className={`navbar-container ${isVisible ? 'navbar-visible' : 'navbar-hidden'}`}
    >
      <Toolbar className="navbar-toolbar">
        <Typography
          variant="h6"
          component="div"
          sx={{
            flexGrow: 1,
            cursor: 'pointer',
            fontWeight: 800,
            letterSpacing: '0.6px',
            background: 'linear-gradient(90deg, var(--accent), var(--accent-2))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}
          onClick={() => navigate('/events')}
        >
          Clixary
        </Typography>

        <Box display="flex" alignItems="center" gap={2.5} className="navbar-content">
          <NotificationBell />
          
          <Box className="user-info">
            <Typography variant="subtitle2" className="username">
              {user?.username || 'User'}
            </Typography>
            <Typography variant="caption" className="user-role">
              {user?.role || 'Guest'}
            </Typography>
          </Box>

          <Box className="navbar-divider"></Box>

          <Box display="flex" alignItems="center" gap={1} className="nav-buttons">
            <Button
              color="inherit"
              size="small"
              startIcon={<Home />}
              onClick={() => navigate('/events')}
              className="nav-btn"
            >
              Events
            </Button>
            <Button
              color="inherit"
              size="small"
              startIcon={<Favorite />}
              onClick={() => navigate('/favorites')}
              className="nav-btn"
            >
              Favorites
            </Button>
            <Button
              color="inherit"
              size="small"
              startIcon={<Label />}
              onClick={() => navigate('/tagged')}
              className="nav-btn"
            >
              Tagged
            </Button>
            {canUpload && (
              <Button
                color="inherit"
                size="small"
                startIcon={<CloudUpload />}
                onClick={() => navigate('/my-uploads')}
                className="nav-btn"
              >
                My Uploads
              </Button>
            )}
            <Button
              color="inherit"
              size="small"
              startIcon={<PhotoLibrary />}
              onClick={() => navigate('/browse')}
              className="nav-btn"
            >
              Browse
            </Button>
            <Button
              color="inherit"
              size="small"
              startIcon={<Person />}
              onClick={() => navigate('/profile')}
              className="nav-btn"
            >
              Profile
            </Button>
            <Button
              color="inherit"
              size="small"
              startIcon={<Logout />}
              onClick={handleLogout}
              className="nav-btn logout-btn"
            >
              Logout
            </Button>
          </Box>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;