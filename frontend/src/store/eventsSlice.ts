import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { eventsService } from '../services/events';
import { Event } from '../types';

interface EventsState {
  events: Event[];
  currentEvent: Event | null;
  loading: boolean;
  error: string | null;
}

const initialState: EventsState = {
  events: [],
  currentEvent: null,
  loading: false,
  error: null,
};

export const fetchEvents = createAsyncThunk(
  'events/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const events = await eventsService.getAll();
      return events;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || 'Failed to fetch events');
    }
  }
);

export const fetchEventById = createAsyncThunk(
  'events/fetchById',
  async (id: number, { rejectWithValue }) => {
    try {
      const event = await eventsService.getById(id);
      return event;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || 'Failed to fetch event');
    }
  }
);

const eventsSlice = createSlice({
  name: 'events',
  initialState,
  reducers: {
    clearCurrentEvent: (state) => {
      state.currentEvent = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchEvents.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEvents.fulfilled, (state, action: PayloadAction<Event[]>) => {
        state.loading = false;
        state.events = action.payload;
      })
      .addCase(fetchEvents.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchEventById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEventById.fulfilled, (state, action: PayloadAction<Event>) => {
        state.loading = false;
        state.currentEvent = action.payload;
      })
      .addCase(fetchEventById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearCurrentEvent } = eventsSlice.actions;
export default eventsSlice.reducer;