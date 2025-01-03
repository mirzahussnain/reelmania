import { createSlice, PayloadAction } from '@reduxjs/toolkit';

type AuthState = {
  token: string | null;
};

const initialAuthState: AuthState = {
  token: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState: initialAuthState,
  reducers: {
    setToken: (state: AuthState, action: PayloadAction<string | null>) => {
      return {...state,token:action.payload}
    },
    clearToken: (state: AuthState) => {
      return {...state,token:null}
    },

  },
});

export const { setToken, clearToken } = authSlice.actions;
export default authSlice.reducer;
