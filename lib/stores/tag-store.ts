import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

import type { Tag } from "@/types";
import type {
  GetTagsResponse,
  CreateTagResponse,
  UpdateTagResponse,
} from "@/types/api";

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  return "An unknown error occurred";
};

interface TagState {
  tags: Tag[];
  isTagsLoading: boolean;
  error: string | null;

  actions: {
    setTags: (tags: Tag[]) => void;
    fetchTags: (boardId: string) => Promise<void>;
    createTag: (
      boardId: string,
      name: string,
      color: string
    ) => Promise<Tag | null>;
    updateTag: (
      tagId: string,
      updates: { name?: string; color?: string }
    ) => Promise<boolean>;
    deleteTag: (tagId: string) => Promise<boolean>;
    clearError: () => void;
  };
}

export const useTagStore = create(
  subscribeWithSelector<TagState>((set, get) => ({
    tags: [],
    isTagsLoading: false,
    error: null,

    actions: {
      setTags: (tags: Tag[]) => {
        set({ tags });
      },

      fetchTags: async (boardId: string) => {
        set({ isTagsLoading: true, error: null });
        try {
          const response = await fetch(`/api/tags?boardId=${boardId}`);

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Failed to fetch tags");
          }

          const data: GetTagsResponse = await response.json();

          set({
            tags: data.tags || [],
            isTagsLoading: false,
          });
        } catch (error) {
          const errorMessage = getErrorMessage(error);
          console.error("Error fetching tags:", error);
          set({
            error: "Failed to fetch tags: " + errorMessage,
            isTagsLoading: false,
          });
        }
      },

      createTag: async (boardId: string, name: string, color: string) => {
        set({ error: null });

        try {
          const response = await fetch("/api/tags", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              boardId,
              name: name.trim(),
              color: color.toUpperCase(),
            }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Failed to create tag");
          }

          const data: CreateTagResponse = await response.json();

          set((state) => ({
            tags: [...state.tags, data.tag],
          }));

          return data.tag;
        } catch (error) {
          const errorMessage = getErrorMessage(error);
          console.error("Error creating tag:", error);

          set({ error: errorMessage });

          return null;
        }
      },

      updateTag: async (
        tagId: string,
        updates: { name?: string; color?: string }
      ) => {
        const originalTag = get().tags.find((tag) => tag.id === tagId);
        if (!originalTag) {
          set({ error: "Tag not found" });
          return false;
        }

        // Optimistic update
        set((state) => ({
          tags: state.tags.map((tag) => {
            if (tag.id === tagId) {
              return {
                ...tag,
                ...updates,
                updatedAt: new Date().toISOString(),
              };
            }
            return tag;
          }),
          error: null,
        }));

        try {
          const response = await fetch(`/api/tags/${tagId}`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(updates),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Failed to update tag");
          }

          const data: UpdateTagResponse = await response.json();

          // Update with server response
          set((state) => ({
            tags: state.tags.map((tag) => (tag.id === tagId ? data.tag : tag)),
          }));

          return true;
        } catch (error) {
          const errorMessage = getErrorMessage(error);
          console.error("Error updating tag:", error);

          // Rollback on error
          set((state) => ({
            tags: state.tags.map((tag) =>
              tag.id === tagId ? originalTag : tag
            ),
            error: errorMessage,
          }));

          return false;
        }
      },

      deleteTag: async (tagId: string) => {
        const tagToDelete = get().tags.find((tag) => tag.id === tagId);
        if (!tagToDelete) {
          set({ error: "Tag not found" });
          return false;
        }

        // Optimistic update - remove tag from state
        set((state) => ({
          tags: state.tags.filter((tag) => tag.id !== tagId),
          error: null,
        }));

        try {
          const response = await fetch(`/api/tags/${tagId}`, {
            method: "DELETE",
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Failed to delete tag");
          }

          return true;
        } catch (error) {
          const errorMessage = getErrorMessage(error);
          console.error("Error deleting tag:", error);

          // Rollback on error - restore tag
          set((state) => ({
            tags: [...state.tags, tagToDelete].sort((a, b) =>
              a.name.localeCompare(b.name)
            ),
            error: errorMessage,
          }));

          return false;
        }
      },

      clearError: () => {
        set({ error: null });
      },
    },
  }))
);

// Selectors
export const useTags = () => useTagStore((state) => state.tags);
export const useIsTagsLoading = () =>
  useTagStore((state) => state.isTagsLoading);
export const useTagError = () => useTagStore((state) => state.error);

// Actions
export const useTagActions = () => useTagStore((state) => state.actions);
