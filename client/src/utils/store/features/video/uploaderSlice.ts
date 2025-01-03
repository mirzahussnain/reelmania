import { createSlice } from '@reduxjs/toolkit'

    const initialState = {
      uploadProgress: 0
    }

    const uploaderSlice = createSlice({
      name: 'uploader',
      initialState,
      reducers: {
        setUploadProgress: (state, action) => {
          return {
            ...state,
            uploadProgress: action.payload
          }
        }
      },
    })

    export const { 
      setUploadProgress
    } = uploaderSlice.actions;

    export default uploaderSlice.reducer;