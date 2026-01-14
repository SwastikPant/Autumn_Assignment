import api from './api';

export const notificationsService = {
  list: async () => {
    const response = await api.get('/notifications/');
    return Array.isArray(response.data) ? response.data : response.data.results || [];
  },

  delete: async (id: number) => {
    const response = await api.delete(`/notifications/${id}/`);
    return response.data;
  },
};

export default notificationsService;
