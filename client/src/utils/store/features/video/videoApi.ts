import {createApi, fetchBaseQuery} from "@reduxjs/toolkit/query/react";

import {CommentType} from "../../../../types";
import { connectSocket } from "../../../functions/socket";
import { SOCKET_EVENTS } from "../../../../shared/constants/socketEvents";
import type {
    FeedQueryArgs,
    VideoListResponse,
    VideoByIdResponse,
    CommentListResponse,
    LikeListResponse,
    AddCommentResponse,
    UpdateLikesResponse,
    GenerateUploadUrlResponse,
    CreateVideoResponse,
    MessageResponse,
    UploadVideoMetadata,
} from "../../../../shared/contracts/api";

const BASE_URL=import.meta.env.VITE_VIDEO_SERVICE_URL as string;
export const videoApi = createApi({
    reducerPath: "videos",
    baseQuery: fetchBaseQuery({
        baseUrl: `${BASE_URL}/api/videos`,
        credentials: 'include',
    }),
    tagTypes: ["Videos", "SAS","Comments","Likes"],
    endpoints: (builder) => ({
        fetchAllVideos: builder.query<VideoListResponse, FeedQueryArgs>({
            query: (args = {}) => {
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
        fetchForYouVideos: builder.query<VideoListResponse, { token: string | null }>({
            query: ({ token }) => ({
                url: "/foryou",
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }),
            providesTags: ["Videos"]
        }),
        fetchVideoById:builder.query<VideoByIdResponse, string>({
            query:(videoId)=>`/${videoId}`,
        }),
        fetchUserVideos: builder.query<VideoListResponse, string | undefined>({
            query: (id) => ({
                url: `/user/${id}`,
                method: "GET"
            }),
            providesTags:["Videos"]
        }),
        deleteUserVideo:builder.mutation<MessageResponse, { id: string; token: string | null }>({
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

        generateUploadUrl: builder.mutation<GenerateUploadUrlResponse, { fileName: string, contentType: string, token: string | null }>({
            query: ({ fileName, contentType, token }) => ({
                url: "/generate-upload-url",
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`
                },
                body: { fileName, contentType }
            })
        }),
        uploadVideo: builder.mutation<CreateVideoResponse, { metadata: UploadVideoMetadata, fileName: string, token: string | null }>({
            query: ({ metadata, fileName, token }) => ({
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
        getCommentsByVideoId: builder.query<CommentListResponse, string | { videoId: string; cursor?: string; limit?: number }>({
            query: (args) => {
                let videoId: string;
                const params = new URLSearchParams();
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
        getLikesByVideoId: builder.query<LikeListResponse, string>({
            query: (videoId) => `/${videoId}/likes`,
            providesTags: ["Likes"]
        }),
       
        addNewComment: builder.mutation<AddCommentResponse, { comment: CommentType, videoId: string, token: string | null }>({
            query: ({comment, videoId, token}) => ({
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
                   
                    socket.emit(SOCKET_EVENTS.NEW_COMMENT, { videoId: data?.data?.videoId, newComment: data?.data?.comment, commentCount: data?.data?.commentCount });
                  }
                } catch(err) {
                    console.error(err)
                }
              },
              invalidatesTags: ['Comments']
            }),
        updateLikes: builder.mutation<UpdateLikesResponse, { videoId: string, userData: {userId:string,userName:string}, token: string }>({
            query: ({videoId, userData, token}) => ({
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
                  if (socket) {
                    socket.emit(SOCKET_EVENTS.LIKE_UPDATED, { videoId: data?.data?.videoId, updatedLikes: data?.data?.updatedLikes });
                  }
                } catch(err) {
                    console.error(err)
                }
              },
              invalidatesTags: ['Likes']
            }),
        fetchSasToken: builder.query<MessageResponse, string | null>({
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
   useLazyFetchForYouVideosQuery,
   useLazyGetCommentsByVideoIdQuery,
   useLazyGetLikesByVideoIdQuery
} = videoApi

export default videoApi.reducer;
