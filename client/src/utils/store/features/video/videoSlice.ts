import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { VideoType } from '../../../../types'

interface VideoState {
  forYouVideos: VideoType[];
}

const initialState: VideoState = {
  forYouVideos: [],
};

const videoSlice = createSlice({
  name: 'video',
  initialState,
  reducers: {
    setForYouVideos: (state, action: PayloadAction<VideoType[]>) => {
      state.forYouVideos = Array.isArray(action.payload) ? [...action.payload] : [];
    },
    appendForYouVideos: (state, action: PayloadAction<VideoType[]>) => {
      if (Array.isArray(action.payload)) {
        state.forYouVideos = [...state.forYouVideos, ...action.payload];
      }
    },
  },
});

export const { setForYouVideos, appendForYouVideos } = videoSlice.actions;
export default videoSlice.reducer;