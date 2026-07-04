import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type {
  UserProfileResponse,
  UsersListResponse,
  FollowersResponse,
  CheckFollowerResponse,
  FollowMutationResponse,
  UpdateRoleResponse,
} from "../../../../shared/contracts/api";

const BASE_URL=import.meta.env.VITE_USER_SERVICE_URL as string;
export const userApi = createApi({
  reducerPath: "userAPi",
  baseQuery: fetchBaseQuery({ baseUrl: `${BASE_URL}/api/users` }),
  tagTypes: ["Users", "Profile"],
  endpoints: (builder) => ({
    getMyProfile: builder.query<UserProfileResponse, { id: string | undefined; token: string | null }>({
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
    getUserProfile: builder.query<UserProfileResponse, string | undefined>({
      query: (id) => ({
        url: `/profile/${id}`,
        method: "GET",
      }),
      providesTags:["Profile","Users"]
    }),
    getUserByUsername: builder.query<UserProfileResponse, string>({
      query: (username) => ({
        url: `/by-username/${username}`,
        method: "GET",
      }),
      providesTags:["Profile","Users"]
    }),
    getUsers: builder.query<UsersListResponse, void>({
      query: () => ({
        url: `/`,
        method: "GET",
      }),
      providesTags: ["Users"],
    }),
    getUserFollowers: builder.query<FollowersResponse, string>({
      query: (userId) => ({
        url: `/${userId}/followers`,
        method: "GET",
      }),
      providesTags: ["Users"],
    }),
    getUserMutuals: builder.query<FollowersResponse, string>({
      query: (userId) => ({
        url: `/${userId}/mutuals`,
        method: "GET",
      }),
      providesTags: ["Users"],
    }),
    getUserFollowing: builder.query<FollowersResponse, string>({
      query: (userId) => ({
        url: `/${userId}/following`,
        method: "GET",
      }),
      providesTags: ["Users"],
    }),
    checkUserFollower: builder.query<CheckFollowerResponse, { followingId: string, followerId: string }>({
      query: ({ followingId, followerId }) => ({
        url: `/${followingId}/check-follower?followerId=${followerId}`,
        method: "GET",
      }),
      providesTags: ["Users"],
    }),
    updateUserRole:builder.query<UpdateRoleResponse, {username:string,newRole:string,token:string}>({
      query:({username,newRole,token})=>({
        url:`/${username}/role`,
        method:"PUT",
        body:{newRole},
        headers:{
          "Content-Type":"application/json",
          Authorization:`Bearer ${token}`
        }
      })
    }),
    updateUserFollower: builder.mutation<FollowMutationResponse, { followingId: string; followerId: string; token: string }>({
      query: ({
        followerId,
        followingId,
        token,
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
  useGetUserByUsernameQuery,
  useGetUsersQuery,
  useLazyGetUserProfileQuery,
  useUpdateUserFollowerMutation,
  useGetUserFollowersQuery,
  useLazyGetUserFollowersQuery,
  useGetUserMutualsQuery,
  useGetUserFollowingQuery,
  useCheckUserFollowerQuery,
  useLazyGetUsersQuery,
  useLazyUpdateUserRoleQuery
} = userApi;
