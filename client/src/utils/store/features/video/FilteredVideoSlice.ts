// store/filteredVideosSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { VideoType } from "../../../../types.ts";

const initialState:VideoType[]=[]

const filteredVideosSlice = createSlice({
    name: "filteredVideos",
    initialState,
    reducers: {
        setFilteredVideos(_state:VideoType[], action: PayloadAction<VideoType[]>) {

            return [...action.payload];
        },
        clearFilteredVideos(_state:VideoType[],action: PayloadAction<VideoType[]>) {

            return action.payload;
        },
    },
});

export const { setFilteredVideos, clearFilteredVideos } = filteredVideosSlice.actions;

export default filteredVideosSlice.reducer;
