import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { addTransactionAPI, uploadReceiptAPI, getTransactionsAPI, deleteTransactionAPI, updateTransactionAPI } from "../../api/transaction";

export const addTransaction = createAsyncThunk(
  "transaction/add",
  async (transactionData, { rejectWithValue }) => {
    try {
      const { data } = await addTransactionAPI(transactionData);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const uploadReceipt = createAsyncThunk(
  "transaction/uploadReceipt",
  async (file, { rejectWithValue }) => {
    try {
      const { data } = await uploadReceiptAPI(file);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const fetchTransactions = createAsyncThunk(
  "transaction/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await getTransactionsAPI();
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const deleteTransaction = createAsyncThunk(
  "transaction/delete",
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await deleteTransactionAPI(id);
      return data.id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const editTransaction = createAsyncThunk(
  "transaction/edit",
  async({ id, updatedData }, { rejectWithValue }) => {
    try {
      const { data } = await updateTransactionAPI(id, updatedData);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const transactionSlice = createSlice({
  name: "transaction",
  initialState: {
    transactions: [], extracted: null, loading: false, uploading: false, error: null,
  },
  reducers: {
    clearExtracted: (state) => {
      state.extracted = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(addTransaction.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addTransaction.fulfilled, (state, action) => {
        state.loading = false;
        state.transactions.push(action.payload);
      })
      .addCase(addTransaction.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(uploadReceipt.pending, (state) => {
        state.uploading = true;
        state.error = null;
      })
      .addCase(uploadReceipt.fulfilled, (state, action) => {
        state.uploading = false;
        state.extracted = action.payload.extracted;
      })
      .addCase(uploadReceipt.rejected, (state, action) => {
        state.uploading = false;
        state.error = action.payload;
      })
      .addCase(fetchTransactions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTransactions.fulfilled, (state, action) => {
        state.loading = false;
        state.transactions = action.payload;
      })
      .addCase(fetchTransactions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(deleteTransaction.fulfilled, (state, action) => {
        state.transactions = state.transactions.filter(
          (tx) => tx._id !== action.payload
        );
      })
      .addCase(editTransaction.fulfilled, (state, action) => {
        const idx = state.transactions.findIndex(
          (tx) => tx._id === action.payload._id
        );
        if (idx !== -1) {
          state.transactions[idx] = action.payload;
        }
      });
  },
});

export const { clearExtracted } = transactionSlice.actions;

export default transactionSlice.reducer;