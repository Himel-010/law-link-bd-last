import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  currentLanguage: "bn", // Bangla as initial language
};

const languageSlice = createSlice({
  name: "language",
  initialState,
  reducers: {
    setLanguage: (state, action) => {
      state.currentLanguage = action.payload; // 'bn' | 'en'
    },
    toggleLanguage: (state) => {
      state.currentLanguage = state.currentLanguage === "bn" ? "en" : "bn";
    },
  },
});

export const { setLanguage, toggleLanguage } = languageSlice.actions;
export default languageSlice.reducer;
