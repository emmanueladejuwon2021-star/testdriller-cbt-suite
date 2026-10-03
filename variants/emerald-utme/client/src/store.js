import { configureStore, createSlice } from "@reduxjs/toolkit";
import { cachedUser } from "./services/api";

const authSlice = createSlice({
  name: "auth",
  initialState: { user: cachedUser(), token: localStorage.getItem("td_token") },
  reducers: {
    setAuth(state, action) {
      state.user = action.payload.user;
      state.token = action.payload.token;
    },
    logout(state) {
      state.user = null;
      state.token = null;
    },
  },
});

const examSlice = createSlice({
  name: "exam",
  initialState: {
    session: null,
    questions: [],
    index: 0,
    answers: {},
    flags: {},
    remaining: 0,
    subjectFilter: "ALL",
  },
  reducers: {
    loadExam(state, action) {
      state.session = action.payload.session;
      state.questions = action.payload.questions;
      state.index = 0;
      state.answers = {};
      state.flags = {};
      state.remaining = action.payload.session.durationSec;
      state.subjectFilter = "ALL";
    },
    setIndex(state, action) { state.index = action.payload; },
    answer(state, action) { state.answers[action.payload.id] = action.payload.label; },
    toggleFlag(state, action) { state.flags[action.payload] = !state.flags[action.payload]; },
    tick(state) { if (state.remaining > 0) state.remaining -= 1; },
    setFilter(state, action) { state.subjectFilter = action.payload; },
    clearCurrent(state) {
      const q = state.questions[state.index];
      if (q) delete state.answers[q.id];
    },
  },
});

export const { setAuth, logout } = authSlice.actions;
export const { loadExam, setIndex, answer, toggleFlag, tick, setFilter, clearCurrent } = examSlice.actions;
export const store = configureStore({ reducer: { auth: authSlice.reducer, exam: examSlice.reducer } });
