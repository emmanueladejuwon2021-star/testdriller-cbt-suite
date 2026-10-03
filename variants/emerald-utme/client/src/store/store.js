import { configureStore, createSlice } from "@reduxjs/toolkit";

const saved = JSON.parse(localStorage.getItem("td-auth") || "null");

const authSlice = createSlice({
  name: "auth",
  initialState: saved || { token: null, user: null },
  reducers: {
    setAuth(state, action) {
      state.token = action.payload.token;
      state.user = action.payload.user;
      localStorage.setItem("td-auth", JSON.stringify(state));
    },
    logout(state) {
      state.token = null;
      state.user = null;
      localStorage.removeItem("td-auth");
    },
  },
});

const examSlice = createSlice({
  name: "exam",
  initialState: { session: null, index: 0, calcOpen: false, remaining: 0 },
  reducers: {
    setSession(state, action) {
      state.session = action.payload;
      state.index = 0;
      state.remaining = action.payload?.durationSec || 0;
    },
    setIndex(state, action) {
      state.index = action.payload;
    },
    answer(state, action) {
      const item = state.session.items[state.index];
      item.selected = action.payload;
    },
    toggleFlag(state) {
      const item = state.session.items[state.index];
      item.flagged = !item.flagged;
    },
    tick(state) {
      if (state.remaining > 0) state.remaining -= 1;
    },
    setCalc(state, action) {
      state.calcOpen = action.payload;
    },
    patchSession(state, action) {
      state.session = action.payload;
    },
  },
});

export const { setAuth, logout } = authSlice.actions;
export const { setSession, setIndex, answer, toggleFlag, tick, setCalc, patchSession } = examSlice.actions;

export const store = configureStore({
  reducer: { auth: authSlice.reducer, exam: examSlice.reducer },
});
