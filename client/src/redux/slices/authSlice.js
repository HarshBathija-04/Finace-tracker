import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { login, signup } from "../../api/auth";

const storedUser = localStorage.getItem("user")
  ? JSON.parse(localStorage.getItem("user")) : null;
const storedToken = localStorage.getItem("token") || null;

const initialState = {
  user: storedUser,
  token: storedToken,
  loading: false,
  error: null,
};

export const loginUser = createAsyncThunk("auth/login", async (credentials, { rejectWithValue }) => {
  try {
    const { data } = await login(credentials);
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));

    return { user: data.user, token: data.token };
  } catch (error) {
    return rejectWithValue(error.response.data.message);
  }
});

export const signupUser = createAsyncThunk("auth/register", async (userData, { rejectWithValue }) => {
  try {
    const { data } = await signup(userData);
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));

    return { user: data.user, token: data.token };
  } catch (error) {
    return rejectWithValue(error.response.data.message);
  }
});


const authSlices = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;

      localStorage.removeItem("user");
      localStorage.removeItem("token");
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(signupUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(signupUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
      })
      .addCase(signupUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
  },
});

export const { logout } = authSlices.actions;
export default authSlices.reducer;