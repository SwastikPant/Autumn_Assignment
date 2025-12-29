import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Button,
  CircularProgress,
  Alert,
  Grid,
  Card,
  CardMedia,
  Chip,
} from '@mui/material';
import { ArrowBack, CalendarToday, CameraAlt, CloudUpload } from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchEventById, clearCurrentEvent } from '../store/eventsSlice';

const EventDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { currentEvent, loading, error } = useAppSelector((state) => state.events);

  useEffect(() => {
    if (id) {
      dispatch(fetchEventById(parseInt(id)));
    }
    return () => {
      dispatch(clearCurrentEvent());
    };
  }, [id, dispatch]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
        <Button onClick={() => navigate('/events')} sx={{ mt: 2 }}>
          Back to Events
        </Button>
      </Container>
    );
  }

  if (!currentEvent) {
    return null;
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Button
        startIcon={<ArrowBack />}
        onClick={() => navigate('/events')}
        sx={{ mb: 2 }}
      >
        Back to Events
      </Button>
      <Button
        variant="contained"
        startIcon={<CloudUpload />}
        onClick={() => navigate(`/events/${id}/upload`)}
      >
        Upload Photos
      </Button>

      {/* Event Info */}
      <Box mb={4}>
        <Typography variant="h3" component="h1" gutterBottom>
          {currentEvent.name}
        </Typography>
        <Box display="flex" gap={2} alignItems="center" mb={2}>
          <Chip
            icon={<CalendarToday />}
            label={`${new Date(currentEvent.start_date).toLocaleDateString()} - ${new Date(currentEvent.end_date).toLocaleDateString()}`}
          />
          <Chip
            icon={<CameraAlt />}
            label={`${currentEvent.images?.length || 0} photos`}
          />
        </Box>
        {currentEvent.description && (
          <Typography variant="body1" color="text.secondary">
            {currentEvent.description}
          </Typography>
        )}
      </Box>

      {/* Photo Gallery */}
      {currentEvent.images && currentEvent.images.length > 0 ? (
        <Grid container spacing={2}>
          {currentEvent.images.map((image) => (
            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={image.id}>
              <Card
                sx={{
                  cursor: 'pointer',
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'scale(1.05)',
                  },
                }}
                onClick={() => navigate(`/images/${image.id}`)}
              >
                <CardMedia
                  component="img"
                  height="250"
                  image={image.thumbnail || image.original_image}
                  alt={`Photo ${image.id}`}
                  sx={{ objectFit: 'cover' }}
                />
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Alert severity="info">No photos in this event yet.</Alert>
      )}
    </Container>
  );
};

export default EventDetailPage;