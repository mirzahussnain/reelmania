import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type {
  CollectionsListResponse,
  CollectionDetailResponse,
  CollectionResponse,
  CollectionItemResponse,
  CuratedIdsResponse,
  GenerateUploadUrlResponse,
  MessageResponse,
} from "../../../../shared/contracts/api";

const BASE_URL = import.meta.env.VITE_CURATION_SERVICE_URL as string;

/** Bearer header for authenticated calls (curation-service uses Clerk). */
const auth = (token: string | null) => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
});

/**
 * Frontend ↔ curation-service client. Replaces the old session-only collections
 * mock with the real REST endpoints. Tag invalidation keeps the feed's "saved"
 * state (CuratedIds), the Vault grid (Collections), and an open collection
 * (Collection) in sync after every mutation.
 */
export const curationApi = createApi({
  reducerPath: "curationApi",
  baseQuery: fetchBaseQuery({ baseUrl: `${BASE_URL}/api/curation` }),
  tagTypes: ["Collections", "Collection", "CuratedIds"],
  endpoints: (builder) => ({
    // List the caller's own collections (with mosaic previews). When `videoId`
    // is passed, each collection also reports `containsVideo` for the modal.
    getMyCollections: builder.query<
      CollectionsListResponse,
      { token: string | null; videoId?: string }
    >({
      query: ({ token, videoId }) => ({
        url: `/collections${videoId ? `?containsVideoId=${videoId}` : ""}`,
        method: "GET",
        headers: auth(token),
      }),
      providesTags: ["Collections"],
    }),

    // Another user's PUBLIC collections (no token needed; server returns
    // public-only for a non-owner). Powers the public profile's Scopes section.
    getPublicCollections: builder.query<CollectionsListResponse, { ownerId: string }>({
      query: ({ ownerId }) => ({ url: `/collections?ownerId=${ownerId}`, method: "GET" }),
      providesTags: ["Collections"],
    }),

    // Public shareable read: a collection by owner + slug, items hydrated.
    getCollectionBySlug: builder.query<
      CollectionDetailResponse,
      { ownerId: string; slug: string; token?: string | null }
    >({
      query: ({ ownerId, slug, token }) => ({
        url: `/collections/owner/${ownerId}/slug/${slug}`,
        method: "GET",
        ...(token ? { headers: auth(token) } : {}),
      }),
      providesTags: (_r, _e, arg) => [{ type: "Collection", id: `${arg.ownerId}/${arg.slug}` }],
    }),

    // Flat distinct set of curated videoIds — drives the feed's saved state.
    getCuratedIds: builder.query<CuratedIdsResponse, { token: string | null }>({
      query: ({ token }) => ({ url: "/collections/curated-ids", method: "GET", headers: auth(token) }),
      providesTags: ["CuratedIds"],
    }),

    // Presign a cover-image upload to curation-service's own bucket.
    getCoverUploadUrl: builder.mutation<
      GenerateUploadUrlResponse,
      { fileName: string; contentType: string; token: string | null }
    >({
      query: ({ token, ...body }) => ({
        url: "/collections/cover-upload-url",
        method: "POST",
        headers: auth(token),
        body,
      }),
    }),

    createCollection: builder.mutation<
      CollectionResponse,
      { title: string; description?: string; coverImageUrl?: string; isPrivate?: boolean; token: string | null }
    >({
      query: ({ token, ...body }) => ({
        url: "/collections",
        method: "POST",
        headers: auth(token),
        body,
      }),
      invalidatesTags: ["Collections"],
    }),

    updateCollection: builder.mutation<
      CollectionResponse,
      { id: string; title?: string; description?: string; coverImageUrl?: string; isPrivate?: boolean; token: string | null }
    >({
      query: ({ id, token, ...body }) => ({
        url: `/collections/${id}`,
        method: "PUT",
        headers: auth(token),
        body,
      }),
      invalidatesTags: ["Collections", "Collection"],
    }),

    deleteCollection: builder.mutation<MessageResponse, { id: string; token: string | null }>({
      query: ({ id, token }) => ({ url: `/collections/${id}`, method: "DELETE", headers: auth(token) }),
      invalidatesTags: ["Collections"],
    }),

    addItem: builder.mutation<
      CollectionItemResponse,
      { collectionId: string; videoId: string; note?: string; token: string | null }
    >({
      query: ({ collectionId, token, ...body }) => ({
        url: `/collections/${collectionId}/items`,
        method: "POST",
        headers: auth(token),
        body,
      }),
      invalidatesTags: ["Collections", "Collection", "CuratedIds"],
    }),

    removeItem: builder.mutation<
      MessageResponse,
      { collectionId: string; videoId: string; token: string | null }
    >({
      query: ({ collectionId, videoId, token }) => ({
        url: `/collections/${collectionId}/items/${videoId}`,
        method: "DELETE",
        headers: auth(token),
      }),
      invalidatesTags: ["Collections", "Collection", "CuratedIds"],
    }),

    updateItem: builder.mutation<
      CollectionItemResponse,
      { collectionId: string; videoId: string; note?: string; position?: number; token: string | null }
    >({
      query: ({ collectionId, videoId, token, ...body }) => ({
        url: `/collections/${collectionId}/items/${videoId}`,
        method: "PUT",
        headers: auth(token),
        body,
      }),
      invalidatesTags: ["Collection"],
    }),
  }),
});

export const {
  useGetMyCollectionsQuery,
  useGetPublicCollectionsQuery,
  useGetCollectionBySlugQuery,
  useGetCuratedIdsQuery,
  useGetCoverUploadUrlMutation,
  useCreateCollectionMutation,
  useUpdateCollectionMutation,
  useDeleteCollectionMutation,
  useAddItemMutation,
  useRemoveItemMutation,
  useUpdateItemMutation,
} = curationApi;
