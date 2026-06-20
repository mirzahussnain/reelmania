import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { VideoType } from '../../../../types'

interface VideoState {
  forYouVideos: VideoType[];
  exploreVideos: VideoType[];
}

const initialState: VideoState = {
  forYouVideos: [],
  exploreVideos: [],
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
    setExploreVideos: (state, action: PayloadAction<VideoType[]>) => {
      state.exploreVideos = Array.isArray(action.payload) ? [...action.payload] : [];
    },
    appendExploreVideos: (state, action: PayloadAction<VideoType[]>) => {
      if (Array.isArray(action.payload)) {
        state.exploreVideos = [...state.exploreVideos, ...action.payload];
      }
    },
  },
});

export const { setForYouVideos, appendForYouVideos, setExploreVideos, appendExploreVideos } = videoSlice.actions;
export default videoSlice.reducer;