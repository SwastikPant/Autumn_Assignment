import api from './api';
import { Event } from '../types';

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export const eventsService = {
  getAll: async (): Promise<Event[]> => {
    const response = await api.get<PaginatedResponse<Event>>('/events/');
    return Array.isArray(response.data) ? response.data : response.data.results;
  },


  getById: async (id: number): Promise<Event> => {
    const response = await api.get<Event>(`/events/${id}/`);
    return response.data;
  },


  create: async (formData: FormData): Promise<Event> => {
    const response = await api.post<Event>('/events/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },


  update: async (id: number, formData: FormData): Promise<Event> => {
    const response = await api.patch<Event>(`/events/${id}/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },


  delete: async (id: number): Promise<void> => {
    await api.delete(`/events/${id}/`);
  },
};