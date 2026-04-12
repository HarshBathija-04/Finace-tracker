import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import API from "../../api/axios";

export const fetchDashboardSummary = createAsyncThunk(
  "dashboard/fetchSummary",
  async ({ userId, month, year }, { rejectWithValue }) => {
    try {
      const res = await API.get(`/report/summary/${userId}/${month}/${year}`);
      return res.data.dashboard;
    } catch (error) {
      return rejectWithValue(err.response?.data?.message || "Error loading summary");
    }
  }
);

const dashboardSlice = createSlice({
  name: "dashboard",
  initialState: {
    summary: null,
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardSummary.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDashboardSummary.fulfilled, (state, action) => {
        state.loading = false;
        state.summary = action.payload;
      })
      .addCase(fetchDashboardSummary.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default dashboardSlice.reducer;