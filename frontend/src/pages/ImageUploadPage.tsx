import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Button,
  Alert,
  Paper,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { CloudUpload, Delete, ArrowBack } from '@mui/icons-material';
import { imagesService } from '../services/images';

const ImageUploadPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [privacy, setPrivacy] = useState<'PUBLIC' | 'PRIVATE'>('PUBLIC');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isDragging, setIsDragging] = useState(false);


  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setSelectedFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const newFiles = Array.from(e.dataTransfer.files).filter(
      (file) => file.type.startsWith('image/')
    );
    setSelectedFiles((prev) => [...prev, ...newFiles]);
  };

  // Remove file from list
  const handleRemoveFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Upload images
  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      setError('Please select at least one image');
      return;
    }

    if (!id) {
      setError('Event ID is missing');
      return;
    }

    setUploading(true);
    setError(null);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      
      selectedFiles.forEach((file) => {
        formData.append('images', file);
      });
      
      formData.append('event', id);
      formData.append('privacy', privacy);

      const response = await imagesService.upload(formData);
      
      setSuccess(true);
      setUploadProgress(100);
      
      setTimeout(() => {
        navigate(`/events/${id}`);
      }, 2000);
      
    } catch (err: any) {
      setError(err.response?.data?.error || 'Upload failed');
      setUploading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Button
        startIcon={<ArrowBack />}
        onClick={() => navigate(`/events/${id}`)}
        sx={{ mb: 2 }}
      >
        Back to Event
      </Button>

      <Typography variant="h4" gutterBottom>
        Upload Photos
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Upload successful! Redirecting...
        </Alert>
      )}

      <Paper
        sx={{
          p: 4,
          textAlign: 'center',
          border: '2px dashed',
          borderColor: isDragging ? 'primary.main' : 'grey.300',
          bgcolor: isDragging ? 'action.hover' : 'background.paper',
          cursor: 'pointer',
          transition: 'all 0.3s',
          mb: 3,
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <CloudUpload sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
        <Typography variant="h6" gutterBottom>
          Drag & Drop Images Here
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          or
        </Typography>
        <Button
          variant="contained"
          component="label"
          startIcon={<CloudUpload />}
        >
          Browse Files
          <input
            type="file"
            hidden
            multiple
            accept="image/*"
            onChange={handleFileChange}
          />
        </Button>
      </Paper>

      {selectedFiles.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Selected Files ({selectedFiles.length})
          </Typography>
          <Paper variant="outlined">
            <List>
              {selectedFiles.map((file, index) => (
                <ListItem
                  key={index}
                  secondaryAction={
                    <IconButton
                      edge="end"
                      onClick={() => handleRemoveFile(index)}
                      disabled={uploading}
                    >
                      <Delete />
                    </IconButton>
                  }
                >
                  <ListItemText
                    primary={file.name}
                    secondary={`${(file.size / 1024 / 1024).toFixed(2)} MB`}
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Box>
      )}


      <FormControl fullWidth sx={{ mb: 3 }}>
        <InputLabel>Privacy</InputLabel>
        <Select
          value={privacy}
          label="Privacy"
          onChange={(e) => setPrivacy(e.target.value as 'PUBLIC' | 'PRIVATE')}
          disabled={uploading}
        >
          <MenuItem value="PUBLIC">Public</MenuItem>
          <MenuItem value="PRIVATE">Private</MenuItem>
        </Select>
      </FormControl>


      {uploading && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Uploading... {uploadProgress}%
          </Typography>
          <LinearProgress variant="determinate" value={uploadProgress} />
        </Box>
      )}


      <Button
        variant="contained"
        size="large"
        fullWidth
        onClick={handleUpload}
        disabled={uploading || selectedFiles.length === 0}
        startIcon={<CloudUpload />}
      >
        {uploading ? 'Uploading...' : `Upload ${selectedFiles.length} Image(s)`}
      </Button>
    </Container>
  );
};

export default ImageUploadPage;