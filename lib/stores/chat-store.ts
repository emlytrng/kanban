import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

import type { TaskOperationResponse } from "@/schemas/task-operation-response";
import type { Column, Task } from "@/types";
import type { ChatTaskManagementResponse } from "@/types/api";

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  return "An unknown error occurred";
};

interface ChatState {
  error: string | null;

  actions: {
    chatWithAITaskManager: (
      input: string,
      columns: Column[],
      getAllTasks: () => Task[]
    ) => Promise<TaskOperationResponse>;
  };
}

export const useChatStore = create(
  subscribeWithSelector<ChatState>((set) => ({
    error: null,

    actions: {
      chatWithAITaskManager: async (
        input: string,
        columns: Column[],
        getAllTasks: () => Task[]
      ) => {
        try {
          const allTasks = getAllTasks();
          const response = await fetch("/api/ai/chat-task-management", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              message: input,
              columns: columns.map((col) => ({ id: col.id, title: col.title })),
              tasks: allTasks,
            }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Failed to process message");
          }

          const data: ChatTaskManagementResponse = await response.json();
          return data;
        } catch (error) {
          const errorMessage = getErrorMessage(error);
          console.error("Error in AI task manager:", error);
          set({ error: "Failed to process AI request: " + errorMessage });
          throw error;
        }
      },
    },
  }))
);

// Selectors
export const useChatError = () => useChatStore((state) => state.error);

// Actions
export const useChatActions = () => useChatStore((state) => state.actions);
