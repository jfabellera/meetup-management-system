import {
  createAsyncThunk,
  createSlice,
  type PayloadAction,
} from '@reduxjs/toolkit';
import axios from 'axios';
import jwt from 'jsonwebtoken';

export interface LoginPayload {
  email: string;
  password: string;
}

interface AuthState {
  isLoggedIn: boolean;
  user: any | null;
  loading: boolean;
}

/**
 * Thunk for logging in.
 *
 * This will set the authentication token in local storage if successfully
 * authenticated.
 */
export const login = createAsyncThunk(
  'auth/login',
  async (payload: LoginPayload, { rejectWithValue }) => {
    try {
      const response = await axios.post('http://localhost:3001/login', payload);
      const { data } = response;

      localStorage.setItem('token', data.token);

      return jwt.decode(data.token);
    } catch (err) {
      return rejectWithValue(err);
    }
  },
);

/**
 * Gets user object from local storage token. If there is no token in local
 * storage, this function will return null.
 *
 * @returns User object if valid token
 */
const getUserFromLocalStorage = (): any => {
  const token = localStorage.getItem('token');
  if (token == null) return false;
  try {
    return jwt.decode(token);
  } catch (err) {
    return null;
  }
};

const initialState: AuthState = {
  isLoggedIn: getUserFromLocalStorage(),
  user: getUserFromLocalStorage(),
  loading: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.isLoggedIn = false;
      state.user = null;
      localStorage.removeItem('token');
    },
  },
  extraReducers(builder) {
    builder
      .addCase(login.pending, (state) => {
        state.loading = true;
      })
      .addCase(login.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.user = action.payload;
        state.isLoggedIn = true;
      })
      .addCase(login.rejected, (state) => {
        state.loading = false;
        state.user = null;
        state.isLoggedIn = false;
      });
  },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;
