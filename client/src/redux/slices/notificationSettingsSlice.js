import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import API from "../../api/axios";

export const fetchNotificationSettings = createAsyncThunk(
  "notificationSettings/fetchNotificationSettings",
  async (userId, { rejectWithValue }) => {
    try {
      const { data } = await API.get(`/notification-settings/${userId}`);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Error fetching settings");
    }
  }
);

export const updateNotificationSettings = createAsyncThunk(
  "notificationSettings/updateNotificationSettings",
  async ({ userId, settings }, { rejectWithValue }) => {
    try {
      const { data } = await API.put(`/notification-settings/${userId}`, settings);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Error updating settings");
    }
  }
);

const notificationSettingsSlice = createSlice({
  name: "notificationSettings",
  initialState: {
    settings: null,
    loading: false,
    error: null,
    success: false,
  },
  reducers: {
    resetNotificationStatus: (state) => {
      state.success = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotificationSettings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNotificationSettings.fulfilled, (state, action) => {
        state.loading = false;
        state.settings = action.payload;
      })
      .addCase(fetchNotificationSettings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateNotificationSettings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateNotificationSettings.fulfilled, (state, action) => {
        state.loading = false;
        state.settings = action.payload;
        state.success = true;
      })
      .addCase(updateNotificationSettings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { resetNotificationStatus } = notificationSettingsSlice.actions;
export default notificationSettingsSlice.reducer;
