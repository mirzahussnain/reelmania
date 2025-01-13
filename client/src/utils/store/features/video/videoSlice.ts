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
      state.videos = [...action.payload];
    },
  },
});


export const { setAllVideos } = videoSlice.actions;
export default videoSlice.reducer;