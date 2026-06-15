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
            query: (args: any = {}) => {
                const params = new URLSearchParams();
                if (args.cursor) params.append("cursor", args.cursor);
                if (args.q) params.append("q", args.q);
                if (args.type) params.append("type", args.type);
                if (args.limit) params.append("limit", args.limit.toString());
                const queryString = params.toString();
                return `/${queryString ? '?' + queryString : ''}`;
            },
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

        generateUploadUrl: builder.mutation({
            query: ({ fileName, contentType, token }: { fileName: string, contentType: string, token: string | null }) => ({
                url: "/generate-upload-url",
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`
                },
                body: { fileName, contentType }
            })
        }),
        uploadVideo: builder.mutation({
            query: ({ metadata, fileName, token }: { metadata: any, fileName: string, token: string | null }) => ({
                url: "/video",
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: { metadata, fileName }
            }),
            invalidatesTags: ["Videos"]
        }),
        getCommentsByVideoId: builder.query({
            query: (args: any) => {
                let videoId, params = new URLSearchParams();
                if (typeof args === 'string') {
                    videoId = args;
                } else {
                    videoId = args.videoId;
                    if (args.cursor) params.append("cursor", args.cursor);
                    if (args.limit) params.append("limit", args.limit.toString());
                }
                const queryString = params.toString();
                return `/${videoId}/comments${queryString ? '?' + queryString : ''}`;
            },
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
                  socket.connect();
                  console.log(socket)
                  if (socket) {
                    socket.emit("likeUpdated", { videoId: data?.videoId, updatedLikes: data?.updatedLikes });
                  }
                } catch(err) {
                    console.log(err)
                }
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
    useFetchUserVideosQuery,
    useGenerateUploadUrlMutation,
    useUploadVideoMutation,
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
