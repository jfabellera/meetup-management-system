import {
  createSlice,
  createAsyncThunk,
  type PayloadAction,
} from '@reduxjs/toolkit';
import axios from 'axios';

export interface LoginPayload {
  email: string;
  password: string;
}

export const loginRequest = createAsyncThunk(
  'user/loginRequest',
  async (payload: LoginPayload, { rejectWithValue }) => {
    try {
      const response = await axios.post<{ token: string }>(
        'http://localhost:3001/login',
        payload,
      );
      const { data } = response;

      localStorage.setItem('token', data.token);

      return data;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  },
);

interface UserState {
  loading: boolean;
  data: any | null;
  error: string | null;
}

const initialState: UserState = {
  loading: false,
  data: null,
  error: null,
};

const userSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {},
  extraReducers(builder) {
    builder
      .addCase(loginRequest.pending, (state, action) => {
        state.loading = true;
      })
      .addCase(
        loginRequest.fulfilled,
        (state, action: PayloadAction<{ token: string }>) => {
          state.loading = false;
          state.data = action.payload;
        },
      )
      .addCase(loginRequest.rejected, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.data = action.payload;
      });
  },
});

// export const { login, logout, register } = userSlice.actions;
export default userSlice.reducer;
