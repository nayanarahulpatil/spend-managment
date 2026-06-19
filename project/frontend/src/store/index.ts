import { configureStore, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { api } from '../services/api';

interface AuthState {
  token: string | null;
  role: string | null;
  isAuthenticated: boolean;
  name: string | null;
  email: string | null;
  department: string | null;
  costCenter: string | null;
}

const initialState: AuthState = {
  token: localStorage.getItem('access_token'),
  role: localStorage.getItem('user_role'),
  isAuthenticated: !!localStorage.getItem('access_token'),
  name: localStorage.getItem('user_name'),
  email: localStorage.getItem('user_email'),
  department: localStorage.getItem('user_department'),
  costCenter: localStorage.getItem('user_cost_center'),
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{
        access_token: string;
        refresh_token: string;
        role: string;
        user?: {
          name: string;
          email: string;
          department: string;
          costCenter: string;
        };
      }>
    ) => {
      state.token = action.payload.access_token;
      state.role = action.payload.role;
      state.isAuthenticated = true;
      localStorage.setItem('access_token', action.payload.access_token);
      localStorage.setItem('refresh_token', action.payload.refresh_token);
      localStorage.setItem('user_role', action.payload.role);

      if (action.payload.user) {
        state.name = action.payload.user.name;
        state.email = action.payload.user.email;
        state.department = action.payload.user.department;
        state.costCenter = action.payload.user.costCenter;
        localStorage.setItem('user_name', action.payload.user.name);
        localStorage.setItem('user_email', action.payload.user.email);
        localStorage.setItem('user_department', action.payload.user.department);
        localStorage.setItem('user_cost_center', action.payload.user.costCenter);
      }
    },
    clearCredentials: (state) => {
      state.token = null;
      state.role = null;
      state.isAuthenticated = false;
      state.name = null;
      state.email = null;
      state.department = null;
      state.costCenter = null;
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user_role');
      localStorage.removeItem('user_name');
      localStorage.removeItem('user_email');
      localStorage.removeItem('user_department');
      localStorage.removeItem('user_cost_center');
    },
  },
});

export const { setCredentials, clearCredentials } = authSlice.actions;

export const store = configureStore({
  reducer: {
    auth: authSlice.reducer,
    [api.reducerPath]: api.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(api.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export default authSlice.reducer;
