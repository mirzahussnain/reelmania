import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { VideoType } from '../../../../types'

interface VideoState {
  videos: VideoType[];
}

const initialState: VideoState = {
  videos: [],
};

const videoSlice = createSlice({
  name: 'video',
  initialState,
  reducers: {
    setAllVideos: (state, action: PayloadAction<VideoType[]>) => {
      state.videos = Array.isArray(action.payload) ? [...action.payload] : [];
    },
    appendVideos: (state, action: PayloadAction<VideoType[]>) => {
      if (Array.isArray(action.payload)) {
        state.videos = [...state.videos, ...action.payload];
      }
    },
  },
});


export const { setAllVideos, appendVideos } = videoSlice.actions;
export default videoSlice.reducer;