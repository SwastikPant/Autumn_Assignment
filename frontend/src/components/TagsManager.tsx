import React, { useState } from 'react';
import {
  Box,
  Chip,
  TextField,
  Button,
  Alert,
} from '@mui/material';
import { Add, Close } from '@mui/icons-material';
import { tagsService } from '../services/tags';
import { Tag } from '../types';

interface TagsManagerProps {
  imageId: number;
  tags: Tag[];
  canEdit: boolean;
  onTagsChange: () => void;
}

const TagsManager: React.FC<TagsManagerProps> = ({ imageId, tags, canEdit, onTagsChange }) => {
  const [newTag, setNewTag] = useState('');
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddTag = async () => {
    if (!newTag.trim()) return;

    setAdding(true);
    setError(null);

    try {
      await tagsService.addToImage(imageId, newTag.trim());
      setNewTag('');
      onTagsChange();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to add tag');
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveTag = async (tagId: number) => {
    try {
      await tagsService.removeFromImage(imageId, tagId);
      onTagsChange();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to remove tag');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddTag();
    }
  };

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Box display="flex" flexWrap="wrap" gap={1} mb={2}>
        {tags.length === 0 ? (
          <Chip label="No tags yet" variant="outlined" size="small" />
        ) : (
          tags.map((tag) => (
            <Chip
              key={tag.id}
              label={tag.name}
              color="primary"
              size="small"
              onDelete={canEdit ? () => handleRemoveTag(tag.id) : undefined}
              deleteIcon={<Close />}
            />
          ))
        )}
      </Box>

      {canEdit && (
        <Box display="flex" gap={1}>
          <TextField
            size="small"
            placeholder="Add a tag..."
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={adding}
            fullWidth
          />
          <Button
            variant="contained"
            size="small"
            startIcon={<Add />}
            onClick={handleAddTag}
            disabled={adding || !newTag.trim()}
          >
            Add
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default TagsManager;