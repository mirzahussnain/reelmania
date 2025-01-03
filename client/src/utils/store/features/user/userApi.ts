import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const BASE_URL=import.meta.env.VITE_USER_SERVICE_URL as string;
export const userApi = createApi({
  reducerPath: "userAPi",
  baseQuery: fetchBaseQuery({ baseUrl: `${BASE_URL}/users` }),
  tagTypes: ["Users", "Profile"],
  endpoints: (builder) => ({
    getMyProfile: builder.query({
      query: ({ id, token }) => ({
        url: `/${id}/myprofile`,
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }),
      providesTags:["Profile"]
    }),
    getUserProfile: builder.query({
      query: (id) => ({
        url: `/profile/${id}`,
        method: "GET",
      }),
      providesTags:["Profile","Users"]
    }),
    getUsers: builder.query({
      query: () => ({
        url: `/`,
        method: "GET",
      }),
      providesTags: ["Users"],
    }),
    getUserFollowers: builder.query({
      query: (userId: string) => ({
        url: `/${userId}/followers`,
        method: "GET",
      }),
      providesTags: ["Users"],
    }),
    updateUserRole:builder.query({
      query:({username,newRole,token}:{username:string,newRole:string,token:string})=>({
        url:`/${username}/role`,
        method:"PUT",
        body:{newRole},
        headers:{
          "Content-Type":"application/json",
          Authorization:`Bearer ${token}`
        }
      })
    }),
    updateUserFollower: builder.mutation({
      query: ({
        followerId,
        followingId,
        token,
      }: {
        followingId: string;
        followerId: string;
        token: string;
      }) => ({
        url: `/${followingId}/follow`,
        method: "PUT",
        body: { followerId },
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }),
      invalidatesTags: ["Profile","Users"],
    }),
  }),
});

export const {
  useGetMyProfileQuery,
  useGetUserProfileQuery,
  useGetUsersQuery,
  useLazyGetUserProfileQuery,
  useUpdateUserFollowerMutation,
  useGetUserFollowersQuery,
  useLazyGetUserFollowersQuery,
  useLazyGetUsersQuery,
  useLazyUpdateUserRoleQuery
} = userApi;
