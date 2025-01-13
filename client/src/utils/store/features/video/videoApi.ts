import {createApi, fetchBaseQuery} from "@reduxjs/toolkit/query/react";

import {CommentType} from "../../../../types";
import { connectSocket } from "../../../functions/socket";

const BASE_URL=import.meta.env.VITE_VIDEO_SERVICE_URL as string;
export const videoApi = createApi({
    reducerPath: "videos",
    baseQuery: fetchBaseQuery({
        baseUrl: `${BASE_URL}/api/videos`,
        credentials: 'include',
    }),
    tagTypes: ["Videos", "SAS","Comments","Likes"],
    endpoints: (builder) => ({
        fetchAllVideos: builder.query({
            query: () => "/",
            providesTags: ["Videos"]
        }),
        fetchVideoById:builder.query({
            query:(videoId)=>`/${videoId}`,
        }),
        fetchUserVideos: builder.query({
            query: (id) => ({
                url: `/user/${id}`,
                method: "GET"
            }),
            providesTags:["Videos"]
        }),
        deleteUserVideo:builder.mutation({
            query:({id,token})=>({
                url:`/${id}`,
                method:"DELETE",
                headers:{
                    "Content-Type":"application/json",
                    Authorization:`Bearer ${token}`
                }
            }),
            invalidatesTags:["Videos"]
        }),

        uploadVideo: builder.mutation({
            query: ({formData, token}: { formData: FormData, token: string | null }) => ({
                url: "/video",
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`
                },
                body: formData

            }),
            invalidatesTags: ["Videos"]
        }),
        getCommentsByVideoId: builder.query({
            query: (videoId) => `/${videoId}/comments`,
            providesTags: ["Comments"]
        }),
        getLikesByVideoId: builder.query({
            query: (videoId) => `/${videoId}/likes`,
            providesTags: ["Likes"]
        }),
       
        addNewComment: builder.mutation({
            query: ({comment, videoId, token}: { comment: CommentType, videoId: string, token: string | null }) => ({
                url: `/${videoId}/comments`,
                method: "POST",
                body: comment,
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }),
            async onQueryStarted(_, { queryFulfilled }) {
                try {
                  const { data } = await queryFulfilled;
                 
                  const socket = connectSocket("");
                  socket.connect();
                  if (socket) {
                   
                    socket.emit("newComment", { videoId: data?.videoId,newComment:data?.newComments,newVideo:data?.newVideos,commentCount:data?.commentsCount });
                  }
                } catch(err) {
                    console.log(err)
                }
              },
              invalidatesTags: ['Comments']
            }),
        updateLikes: builder.mutation({
            query: ({videoId, userData, token}: { videoId: string, userData: {userId:string,userName:string}, token: string }) => ({
                url: `/${videoId}/likes`,
                method: "PUT",
                body: {userData},
                headers: {
                    "content-type": "application/json",
                    Authorization: `Bearer ${token}`
                }
            }),
            async onQueryStarted(_, { queryFulfilled }) {
                try {
                  const { data } = await queryFulfilled;
                  const socket = connectSocket("");
                  console.log(socket)
                  if (socket) {
                   
                    socket.emit("likeUpdated", { videoId:data?.videoId,updatedLikes:data?.updatedLikes });
                  }
                } catch {}
              },
              invalidatesTags: ['Likes']
            }),
        fetchSasToken: builder.query({
            query: (token) => ({
                url: "/generate/sas",
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            }),
            providesTags: ["SAS"]
        })
    }),
});


export const {
    useFetchAllVideosQuery,
    useUploadVideoMutation,
    useFetchUserVideosQuery,
    useFetchSasTokenQuery,
    useAddNewCommentMutation,
    useUpdateLikesMutation,
   useFetchVideoByIdQuery,
   useLazyFetchVideoByIdQuery,
   useDeleteUserVideoMutation,
   useLazyFetchAllVideosQuery,
   useLazyGetCommentsByVideoIdQuery,
   useLazyGetLikesByVideoIdQuery
} = videoApi

export default videoApi.reducer;
