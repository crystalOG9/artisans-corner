import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { extractErrorMessage, http } from '../api/http';
import { StoreProfile, User } from '../types/marketplace';

interface AuthState {
  user: User | null;
  store: StoreProfile | null;
  initialized: boolean;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  store: null,
  initialized: false,
  loading: false,
  error: null,
};

export const fetchCurrentUser = createAsyncThunk(
  'auth/me',
  async (_, { rejectWithValue }) => {
    try {
      const res = await http.get<{ data: { user: User; store: StoreProfile | null } }>(
        '/auth/me'
      );
      return res.data.data;
    } catch {
      return rejectWithValue(null);
    }
  }
);

export const registerAccount = createAsyncThunk(
  'auth/register',
  async (
    payload: { name: string; email: string; password: string },
    { rejectWithValue }
  ) => {
    try {
      const res = await http.post<{ data: { user: User; store: StoreProfile | null } }>(
        '/auth/register',
        payload
      );
      return res.data.data;
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err));
    }
  }
);

export const loginAccount = createAsyncThunk(
  'auth/login',
  async (
    payload: { email: string; password: string },
    { rejectWithValue }
  ) => {
    try {
      const res = await http.post<{ data: { user: User; store: StoreProfile | null } }>(
        '/auth/login',
        payload
      );
      return res.data.data;
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err));
    }
  }
);

export const logoutAccount = createAsyncThunk('auth/logout', async () => {
  await http.post('/auth/logout');
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearAuthError(state) {
      state.error = null;
    },
    setVendorSession(
      state,
      action: PayloadAction<{ user: User; store: StoreProfile }>
    ) {
      state.user = action.payload.user;
      state.store = action.payload.store;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.store = action.payload.store;
        state.initialized = true;
      })
      .addCase(fetchCurrentUser.rejected, (state) => {
        state.user = null;
        state.store = null;
        state.initialized = true;
      })
      .addCase(registerAccount.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerAccount.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.store = action.payload.store;
        state.initialized = true;
      })
      .addCase(registerAccount.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || 'Registration failed.';
      })
      .addCase(loginAccount.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginAccount.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.store = action.payload.store;
        state.initialized = true;
      })
      .addCase(loginAccount.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || 'Sign in failed.';
      })
      .addCase(logoutAccount.fulfilled, (state) => {
        state.user = null;
        state.store = null;
      });
  },
});

export const { clearAuthError, setVendorSession } = authSlice.actions;
export default authSlice.reducer;

