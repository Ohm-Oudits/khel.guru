import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { BACKEND_API_URL } from "../../config/backendUrls";

const API_URL = BACKEND_API_URL;

const api = axios.create({
  baseURL: API_URL,
});

export const getGame = async (name, { rejectWithValue }) => {
  try {
    const response = await api.get(`/game`, { params: { name } });
    return response.data;
  } catch (error) {
    return rejectWithValue(
      error.response?.data || { message: "Failed to find game" }
    );
  }
};

export const getGames = createAsyncThunk(
  "game/getGames",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get(`/game/all`);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: "Failed to fetch games" }
      );
    }
  }
);

export const getPopularGames = createAsyncThunk(
  "game/getPopularGames",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get(`/game/popular`);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: "Failed to fetch popular games" }
      );
    }
  }
);

export const fetchContinueGames = createAsyncThunk(
  "game/getContinueGames",
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem(token);
      if (!token) {
        return rejectWithValue({ message: "User Not Authenticated" });
      }
      const response = await api.get(`/game/continue`);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: "Failed to fetch continue games" }
      );
    }
  }
);

const initialState = {
  games: [],
  popularGames: [],
  continueGames: [],
  loading: false,
  popularLoading: false,
  continueLoading: false,
  error: null,
  popularError: null,
  continueError: null,
};

const gameSlice = createSlice({
  name: "game",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getGames.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getGames.fulfilled, (state, action) => {
        state.loading = false;
        state.games = action.payload.games;
      })
      .addCase(getGames.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Failed to fetch games";
      })
      .addCase(getPopularGames.pending, (state) => {
        state.popularLoading = true;
        state.popularError = null;
      })
      .addCase(getPopularGames.fulfilled, (state, action) => {
        state.popularLoading = false;
        state.popularGames = action.payload.games;
      })
      .addCase(getPopularGames.rejected, (state, action) => {
        state.popularLoading = false;
        state.popularError =
          action.payload?.message || "Failed to fetch popular games";
      })
      .addCase(fetchContinueGames.pending, (state) => {
        state.continueLoading = true;
        state.continueError = null;
      })
      .addCase(fetchContinueGames.fulfilled, (state, action) => {
        state.continueLoading = false;
        state.continueGames = action.payload.games;
      })
      .addCase(fetchContinueGames.rejected, (state, action) => {
        state.continueLoading = false;
        state.continueError =
          action.payload?.message || "Failed to fetch continue games";
      });
  },
});

export const { clearError } = gameSlice.actions;
export default gameSlice.reducer;
