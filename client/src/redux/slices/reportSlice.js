import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import API from "../../api/axios";

export const fetchReportsSummary = createAsyncThunk(
  "reports/fetchSummary",
  async ({ userId, month, year }, { rejectWithValue }) => {
    try {
      const res = await API.get(`/report/summary/${userId}/${month}/${year}`);
      return res.data.reports;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Error loading reports");
    }
  }
);

export const fetchIncomeVsExpenseTrend = createAsyncThunk(
  "reports/fetchIncomeVsExpenseTrend",
  async (userId, { rejectWithValue }) => {
    try {
      const res = await API.get(`/report/income-vs-expense/${userId}`);
      return res.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Error loading graph");
    }
  }
);

const reportSlice = createSlice({
  name: "reports",
  initialState: {
    summary: null, trend: [], loading: false, error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchReportsSummary.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchReportsSummary.fulfilled, (state, action) => {
        state.loading = false;
        state.summary = action.payload;
      })
      .addCase(fetchReportsSummary.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchIncomeVsExpenseTrend.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchIncomeVsExpenseTrend.fulfilled, (state, action) => {
        state.loading = false;
        state.trend = action.payload;
      })
      .addCase(fetchIncomeVsExpenseTrend.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default reportSlice.reducer;