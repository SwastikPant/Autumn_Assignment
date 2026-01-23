import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardMedia,
  CardContent,
  Box,
  CircularProgress,
  Alert,
  Chip,
  Pagination,
} from '@mui/material';
import { CameraAlt, Visibility, ThumbUp } from '@mui/icons-material';
import { imagesService } from '../services/images';
import { Image } from '../types';
import SearchFilter, { SearchFilters } from '../components/SearchFilter';

const BrowseImagesPage: React.FC = () => {
  const navigate = useNavigate();
  const [images, setImages] = useState<Image[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [filters, setFilters] = useState<SearchFilters>({});

  useEffect(() => {
    loadImages({}, 1);
  }, []);

  const loadImages = async (filterParams: SearchFilters, page: number = 1) => {
    try {
      setLoading(true);
      const response = await imagesService.getAll({ ...filterParams, page });
      
      if (response && response.results && Array.isArray(response.results)) {
        setImages(response.results);
        setTotalCount(response.count || 0);
        setTotalPages(Math.ceil((response.count || 0) / 20));
        setCurrentPage(page);
      } else if (Array.isArray(response)) {
        setImages(response);
        setTotalCount(response.length);
        setTotalPages(1);
        setCurrentPage(1);
      } else {
        setImages([]);
        setTotalCount(0);
        setTotalPages(0);
      }
    } catch (err: any) {
      setError('Failed to load images');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (newFilters: SearchFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
    loadImages(newFilters, 1);
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, page: number) => {
    loadImages(filters, page);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Browse All Photos
      </Typography>

      <SearchFilter onSearch={handleSearch} showEventFilter={true} />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
          <CircularProgress />
        </Box>
      ) : images.length === 0 ? (
        <Alert severity="info">No images found. Try adjusting your filters.</Alert>
      ) : (
        <>
          <Typography variant="body1" color="text.secondary" gutterBottom>
            {totalCount} {totalCount === 1 ? 'photo' : 'photos'} found
          </Typography>

          <Grid container spacing={2} sx={{ mt: 2 }}>
            {images.map((image) => (
              <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={image.id}>
                <Card
                  sx={{
                    cursor: 'pointer',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      transform: 'scale(1.03)',
                      boxShadow: 6,
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
                  <CardContent>
                    <Typography variant="caption" color="text.secondary">
                      By {image.uploaded_by}
                    </Typography>
                    <Box display="flex" gap={1} mt={1} mb={1}>
                      <Chip
                        icon={<ThumbUp />}
                        label={image.like_count}
                        size="small"
                        color="primary"
                      />
                      <Chip
                        icon={<Visibility />}
                        label={image.view_count}
                        size="small"
                      />
                    </Box>
                    {image.camera_model && (
                      <Chip
                        icon={<CameraAlt />}
                        label={image.camera_model}
                        size="small"
                        variant="outlined"
                      />
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {totalPages > 1 && (
            <Box display="flex" justifyContent="center" mt={4} mb={2}>
              <Pagination
                count={totalPages}
                page={currentPage}
                onChange={handlePageChange}
                color="primary"
              />
            </Box>
          )}
        </>
      )}
    </Container>
  );
};

export default BrowseImagesPage;