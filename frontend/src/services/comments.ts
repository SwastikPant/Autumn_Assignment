import api from './api';
import { Comment } from '../types';

export const commentsService = {
  // Get comments for an image
  getImageComments: async (imageId: number): Promise<Comment[]> => {
    const response = await api.get(`/images/${imageId}/comments/`);
    return response.data;
  },

  // Post a comment
  postComment: async (imageId: number, text: string, parentId?: number) => {
    const response = await api.post(
      `/images/${imageId}/comments/`,
      {
        text: text,
        parent: parentId || null,
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data;
  },

  // Edit a comment
  editComment: async (commentId: number, text: string) => {
    const response = await api.patch(
      `/comments/${commentId}/`,
      { text: text },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data;
  },

  // Delete a comment
  deleteComment: async (commentId: number) => {
    await api.delete(`/comments/${commentId}/`);
  },
};