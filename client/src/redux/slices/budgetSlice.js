import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import API from "../../api/axios";

export const setBudget = createAsyncThunk(
  "budget/setBudget",
  async (data, { rejectWithValue }) => {
    try {
      const res = await API.post("/budgets/set", data);
      return res.data.budget;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Error setting budget");
    }
  }
);

export const getBudget = createAsyncThunk(
  "budget/getBudget",
  async ({ userId, month, year }, { rejectWithValue }) => {
    try {
      const res = await API.get(`/budgets/${userId}/${month}/${year}`);
      return res.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "No budget found");
    }
  }
);

export const updateBudget = createAsyncThunk(
  "budget/updateBudget",
  async ({ id, budget }, { rejectWithValue }) => {
    try {
      const res = await API.put(`/budgets/update/${id}`, budget);
      return res.data.budget;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Error updating budget");
    }
  }
);

export const deleteBudget = createAsyncThunk(
  "budget/deleteBudget",
  async (id, { rejectWithValue }) => {
    try {
      const res = await API.delete(`/budgets/${id}`);
      return res.data.budget;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Error deleting budget");
    }
  }
);

const budgetSlice = createSlice({
  name: "budget",
  initialState: {
    budget: null, loading: false, error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(setBudget.pending, (state) => {
        state.loading = true;
      })
      .addCase(setBudget.fulfilled, (state, action) => {
        state.loading = false;
        state.budget = action.payload;
      })
      .addCase(setBudget.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(getBudget.pending, (state) => {
        state.loading = true;
      })
      .addCase(getBudget.fulfilled, (state, action) => {
        state.loading = false;
        state.budget = action.payload;
      })
      .addCase(getBudget.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateBudget.fulfilled, (state, action) => {
        state.budget = action.payload;
      })
      .addCase(deleteBudget.fulfilled, (state) => {
        state.budget = null;
      })
  },
});

export default budgetSlice.reducer;