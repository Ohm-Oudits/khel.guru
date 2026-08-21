import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { BACKEND_API_URL } from "../../config/backendUrls";
import { initializeSocket, disconnectSocket } from "../../socket/socket";
import {
  currentUser,
  googleAuthEndpoint,
  loginEndpoint,
  registerEndpoint,
  telegramAuthEndpoint,
  xAuthEndpoint,
  instantRegisterEndpoint,
} from "../server";

const API_URL = BACKEND_API_URL;

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export const fetchUserData = createAsyncThunk(
  "auth/fetchUserData",
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        return rejectWithValue({ message: "No token found" });
      }

      const response = await api.get(currentUser, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.data.user) {
        localStorage.removeItem("token");
        return rejectWithValue({ message: "Invalid user data" });
      }

      return response.data;
    } catch (error) {
      localStorage.removeItem("token");
      return rejectWithValue(
        error.response?.data || { message: "Failed to fetch user data" }
      );
    }
  }
);

export const login = createAsyncThunk(
  "auth/login",
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await api.post(loginEndpoint, credentials);
      localStorage.setItem("token", response.data.token);
      initializeSocket(response.data.token);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: "Login failed" }
      );
    }
  }
);

export const register = createAsyncThunk(
  "auth/register",
  async (userData, { rejectWithValue }) => {
    try {
      const response = await api.post(registerEndpoint, userData);
      localStorage.setItem("token", response.data.token);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: "Registration failed" }
      );
    }
  }
);

export const googleAuth = createAsyncThunk(
  "auth/googleAuth",
  async (data, { rejectWithValue }) => {
    try {
      const response = await api.post(googleAuthEndpoint, data);
      localStorage.setItem("token", response.data.token);
      initializeSocket(response.data.token);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: "Google authentication failed" }
      );
    }
  }
);

export const telegramAuth = createAsyncThunk(
  "auth/telegramAuth",
  async (data, { rejectWithValue }) => {
    try {
      const response = await api.post(telegramAuthEndpoint, data);
      localStorage.setItem("token", response.data.token);
      initializeSocket(response.data.token);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: "Telegram authentication failed" }
      );
    }
  }
);

export const xAuth = createAsyncThunk(
  "auth/xAuth",
  async (data, { rejectWithValue }) => {
    try {
      const response = await api.post(xAuthEndpoint, data);
      localStorage.setItem("token", response.data.token);
      initializeSocket(response.data.token);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: "X authentication failed" }
      );
    }
  }
);

export const instantRegister = createAsyncThunk(
  "auth/instantRegister",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.post(instantRegisterEndpoint);
      localStorage.setItem("token", response.data.token);
      initializeSocket(response.data.token);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: "Instant registration failed" }
      );
    }
  }
);

const initialState = {
  user: null,
  token: localStorage.getItem("token"),
  isAuthenticated: false,
  loading: false,
  error: null,
  credentials: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    updateBalance: (state, action) => {
      if (state.user) {
        state.user.balance = action.payload;
      }
    },
    logout: (state) => {
      localStorage.removeItem("token");
      disconnectSocket();
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch User Data
      .addCase(fetchUserData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserData.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
      })
      .addCase(fetchUserData.rejected, (state, action) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.error = action.payload?.message || "Failed to fetch user data";
      })
      // Login
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Login failed";
      })
      // Register
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Registration failed";
      })
      // Google Auth
      .addCase(googleAuth.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(googleAuth.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
      })
      .addCase(googleAuth.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Google authentication failed";
      })
      // Telegram Auth
      .addCase(telegramAuth.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(telegramAuth.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
      })
      .addCase(telegramAuth.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.payload?.message || "Telegram authentication failed";
      })
      // X Auth
      .addCase(xAuth.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(xAuth.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
      })
      .addCase(xAuth.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "X authentication failed";
      })
      // Instant Register
      .addCase(instantRegister.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(instantRegister.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.credentials = action.payload.credentials;
      })
      .addCase(instantRegister.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Instant registration failed";
      });
  },
});

export const { logout, clearError, updateBalance } = authSlice.actions;
export default authSlice.reducer;
