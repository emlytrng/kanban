import { v4 as uuidv4 } from "uuid";
import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

import type { Board, Column, Task } from "@/types";
import type {
  GetBoardsResponse,
  CreateBoardResponse,
  GetBoardResponse,
  CreateColumnResponse,
  CreateTaskResponse,
  UpdateTaskResponse,
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

interface KanbanState {
  // Board state
  board: Board | null;
  boards: Board[];

  // Column state
  columns: Column[];

  // Loading and error states
  isLoading: boolean;
  error: string | null;

  actions: {
    // General actions
    clearError: () => void;

    // Board actions
    fetchUserBoards: () => Promise<Board[]>;
    fetchBoard: (boardId?: string) => Promise<void>;
    addBoard: (title: string) => Promise<string | null>;
    deleteBoard: (boardId: string) => Promise<boolean>;

    // Column actions
    setColumns: (columns: Column[]) => void;
    addColumn: (title: string) => Promise<void>;
    deleteColumn: (columnId: string) => Promise<void>;
    moveColumn: (
      sourceIndex: number,
      destinationIndex: number
    ) => Promise<void>;

    // Task actions
    addTask: (columnId: string, title: string) => Promise<void>;
    updateTask: (
      taskId: string,
      updates: Partial<Task>,
      columnId?: string
    ) => Promise<void>;
    deleteTask: (columnId: string, taskId: string) => Promise<void>;
    moveTask: (
      taskId: string,
      sourceColumnId: string,
      destinationColumnId: string,
      sourceIndex: number,
      destinationIndex: number,
      skipOptimistic?: boolean
    ) => Promise<void>;
    findTaskById: (taskId: string) => { task: Task; columnId: string } | null;
    updateTaskTags: (taskId: string, tagIds: string[]) => Promise<boolean>;
  };
}

export const useKanbanStore = create(
  subscribeWithSelector<KanbanState>((set, get) => ({
    // Initial state
    board: null,
    boards: [],
    columns: [],
    isLoading: true,
    error: null,

    actions: {
      clearError: () => {
        set({ error: null });
      },

      // Board actions
      fetchUserBoards: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch("/api/boards");

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Failed to fetch boards");
          }

          const data: GetBoardsResponse = await response.json();

          set({
            boards: data.boards || [],
            isLoading: false,
          });

          return data.boards;
        } catch (error) {
          const errorMessage = getErrorMessage(error);
          console.error("Error fetching user boards:", error);
          set({
            error: "Failed to fetch boards: " + errorMessage,
            isLoading: false,
          });
          return [];
        }
      },

      fetchBoard: async (boardId?: string) => {
        set({ isLoading: true, error: null });
        try {
          let url = "/api/boards";

          if (boardId) {
            url += `/${boardId}`;
          }

          const response = await fetch(url);

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Failed to fetch board");
          }

          const data: GetBoardResponse = await response.json();

          set({
            board: data.board,
            columns: data.columns,
            isLoading: false,
          });
        } catch (error) {
          const errorMessage = getErrorMessage(error);
          console.error("Error fetching board:", error);
          set({
            error: "Failed to fetch board data: " + errorMessage,
            isLoading: false,
          });
        }
      },

      addBoard: async (title: string) => {
        const tempId = uuidv4();
        const newBoard: Board = {
          id: tempId,
          title: title.trim(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        // Optimistic update
        set((state) => ({
          boards: [newBoard, ...state.boards],
          error: null,
        }));

        try {
          const response = await fetch("/api/boards", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ title: title.trim() }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Failed to create board");
          }

          const data: CreateBoardResponse = await response.json();

          // Update with actual board ID from server
          set((state) => ({
            boards: state.boards.map((board) =>
              board.id === tempId ? { ...board, id: data.boardId } : board
            ),
          }));

          return data.boardId;
        } catch (error) {
          const errorMessage = getErrorMessage(error);
          console.error("Error creating board:", error);

          // Rollback optimistic update
          set((state) => ({
            boards: state.boards.filter((board) => board.id !== tempId),
            error: "Failed to create board: " + errorMessage,
          }));

          return null;
        }
      },

      deleteBoard: async (boardId: string) => {
        const boardToDelete = get().boards.find(
          (board) => board.id === boardId
        );

        if (!boardToDelete) {
          set({ error: "Board not found" });
          return false;
        }

        // Optimistic update
        set((state) => ({
          boards: state.boards.filter((board) => board.id !== boardId),
          error: null,
        }));

        const currentBoard = get().board;
        if (currentBoard?.id === boardId) {
          set({ board: null, columns: [] });
        }

        try {
          const response = await fetch(`/api/boards/${boardId}`, {
            method: "DELETE",
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Failed to delete board");
          }

          return true;
        } catch (error) {
          const errorMessage = getErrorMessage(error);
          console.error("Error deleting board:", error);

          // Rollback optimistic update
          set((state) => ({
            boards: [...state.boards, boardToDelete].sort(
              (a, b) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime()
            ),
            error: "Failed to delete board: " + errorMessage,
          }));

          return false;
        }
      },

      // Column actions
      setColumns: (columns: Column[]) => {
        set({ columns });
      },

      addColumn: async (title: string) => {
        const board = get().board;
        if (!board) {
          set({ error: "No board selected" });
          return;
        }

        const columns = get().columns;
        const position = columns.length;
        const tempId = uuidv4();

        const newColumn: Column = {
          id: tempId,
          title: title.trim(),
          tasks: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        // Optimistic update
        set((state) => ({
          columns: [...state.columns, newColumn],
          error: null,
        }));

        try {
          const response = await fetch("/api/columns", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              boardId: board.id,
              title: title.trim(),
              position,
            }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Failed to add column");
          }

          const data: CreateColumnResponse = await response.json();

          // Update with the actual column ID from the server
          set((state) => ({
            columns: state.columns.map((col) =>
              col.id === tempId ? { ...col, id: data.column.id } : col
            ),
          }));
        } catch (error) {
          const errorMessage = getErrorMessage(error);
          console.error("Error adding column:", error);

          // Rollback on error
          set((state) => ({
            columns: state.columns.filter((col) => col.id !== tempId),
            error: "Failed to add column: " + errorMessage,
          }));
        }
      },

      deleteColumn: async (columnId: string) => {
        const columnToDelete = get().columns.find((col) => col.id === columnId);

        if (!columnToDelete) {
          set({ error: "Column not found" });
          return;
        }

        // Optimistic update
        set((state) => ({
          columns: state.columns.filter((col) => col.id !== columnId),
          error: null,
        }));

        try {
          const response = await fetch(`/api/columns/${columnId}`, {
            method: "DELETE",
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Failed to delete column");
          }
        } catch (error) {
          const errorMessage = getErrorMessage(error);
          console.error("Error deleting column:", error);

          // Rollback on error - restore column at its original position
          set((state) => {
            const newColumns = [...state.columns];
            const originalColumns = get().columns;
            const originalIndex = originalColumns.findIndex(
              (col) => col.id === columnId
            );
            const insertIndex =
              originalIndex >= 0 ? originalIndex : newColumns.length;
            newColumns.splice(insertIndex, 0, columnToDelete);

            return {
              columns: newColumns,
              error: "Failed to delete column: " + errorMessage,
            };
          });
        }
      },

      moveColumn: async (sourceIndex: number, destinationIndex: number) => {
        const { columns } = get();

        if (
          sourceIndex < 0 ||
          sourceIndex >= columns.length ||
          destinationIndex < 0 ||
          destinationIndex >= columns.length
        ) {
          set({ error: "Invalid column positions" });
          return;
        }

        const originalColumns = [...columns]; // Store original state

        const newColumns = [...columns];
        const [movedColumn] = newColumns.splice(sourceIndex, 1);
        newColumns.splice(destinationIndex, 0, movedColumn);

        // Optimistic update
        set({ columns: newColumns, error: null });

        try {
          const response = await fetch("/api/columns", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ columns: newColumns }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Failed to reorder columns");
          }
        } catch (error) {
          const errorMessage = getErrorMessage(error);
          console.error("Error reordering columns:", error);

          // Rollback to original state
          set({
            columns: originalColumns,
            error: "Failed to reorder columns: " + errorMessage,
          });
        }
      },

      // Task actions
      addTask: async (columnId: string, title: string) => {
        const column = get().columns.find((col) => col.id === columnId);
        if (!column) {
          set({ error: "Column not found" });
          return;
        }

        const position = column.tasks.length;
        const tempId = uuidv4();

        const newTask: Task = {
          id: tempId,
          title: title.trim(),
          description: "",
          assignee: "You",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          tags: [],
        };

        // Optimistic update
        set((state) => ({
          columns: state.columns.map((col) => {
            if (col.id === columnId) {
              return {
                ...col,
                tasks: [...col.tasks, newTask],
              };
            }
            return col;
          }),
          error: null,
        }));

        try {
          const response = await fetch("/api/tasks", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              columnId,
              title: title.trim(),
              position,
            }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Failed to add task");
          }

          const data: CreateTaskResponse = await response.json();

          // Update with the actual task ID from the server
          set((state) => ({
            columns: state.columns.map((col) => {
              if (col.id === columnId) {
                return {
                  ...col,
                  tasks: col.tasks.map((c) =>
                    c.id === tempId ? { ...c, id: data.task.id } : c
                  ),
                };
              }
              return col;
            }),
          }));
        } catch (error) {
          const errorMessage = getErrorMessage(error);
          console.error("Error adding task:", error);

          // Rollback on error
          set((state) => ({
            columns: state.columns.map((col) => {
              if (col.id === columnId) {
                return {
                  ...col,
                  tasks: col.tasks.filter((c) => c.id !== tempId),
                };
              }
              return col;
            }),
            error: "Failed to add task: " + errorMessage,
          }));
        }
      },

      updateTask: async (
        taskId: string,
        updates: Partial<Task>,
        columnId?: string
      ) => {
        const columns = get().columns;

        // Find the column and task
        let targetColumnId = columnId;
        let originalTask: Task | undefined;

        if (!targetColumnId) {
          // If columnId is not provided, find it by searching all columns
          for (const col of columns) {
            const task = col.tasks.find((c) => c.id === taskId);
            if (task) {
              targetColumnId = col.id;
              originalTask = task;
              break;
            }
          }
        } else {
          // If columnId is provided, find the task in that column
          const column = columns.find((col) => col.id === targetColumnId);
          originalTask = column?.tasks.find((task) => task.id === taskId);
        }

        if (!targetColumnId || !originalTask) {
          set({ error: "Task or column not found" });
          return;
        }

        // Optimistic update
        set((state) => ({
          columns: state.columns.map((col) => {
            if (col.id === targetColumnId) {
              return {
                ...col,
                tasks: col.tasks.map((task) => {
                  if (task.id === taskId) {
                    return {
                      ...task,
                      ...updates,
                      updatedAt: new Date().toISOString(),
                    };
                  }
                  return task;
                }),
              };
            }
            return col;
          }),
          error: null,
        }));

        try {
          const response = await fetch(`/api/tasks/${taskId}`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              title: updates.title,
              description: updates.description,
            }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Failed to update task");
          }

          const data: UpdateTaskResponse = await response.json();

          // Update with server response timestamp
          set((state) => ({
            columns: state.columns.map((col) => {
              if (col.id === targetColumnId) {
                return {
                  ...col,
                  tasks: col.tasks.map((task) => {
                    if (task.id === taskId) {
                      return {
                        ...task,
                        updatedAt: data.task.updatedAt,
                      };
                    }
                    return task;
                  }),
                };
              }
              return col;
            }),
          }));
        } catch (error) {
          const errorMessage = getErrorMessage(error);
          console.error("Error updating task:", error);

          // Rollback on error
          set((state) => ({
            columns: state.columns.map((col) => {
              if (col.id === targetColumnId) {
                return {
                  ...col,
                  tasks: col.tasks.map((task) => {
                    if (task.id === taskId) {
                      return originalTask!;
                    }
                    return task;
                  }),
                };
              }
              return col;
            }),
            error: "Failed to update task: " + errorMessage,
          }));
        }
      },

      deleteTask: async (columnId: string, taskId: string) => {
        const column = get().columns.find((col) => col.id === columnId);
        if (!column) {
          set({ error: "Column not found" });
          return;
        }

        const taskIndex = column.tasks.findIndex((task) => task.id === taskId);
        if (taskIndex === -1) {
          set({ error: "Task not found" });
          return;
        }

        const deletedTask = column.tasks[taskIndex];

        // Optimistic update
        set((state) => ({
          columns: state.columns.map((col) => {
            if (col.id === columnId) {
              return {
                ...col,
                tasks: col.tasks.filter((task) => task.id !== taskId),
              };
            }
            return col;
          }),
          error: null,
        }));

        try {
          const response = await fetch(`/api/tasks/${taskId}`, {
            method: "DELETE",
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Failed to delete task");
          }
        } catch (error) {
          const errorMessage = getErrorMessage(error);
          console.error("Error deleting task:", error);

          // Rollback on error - restore task at its original position
          set((state) => ({
            columns: state.columns.map((col) => {
              if (col.id === columnId) {
                const newTasks = [...col.tasks];
                newTasks.splice(taskIndex, 0, deletedTask);
                return {
                  ...col,
                  tasks: newTasks,
                };
              }
              return col;
            }),
            error: "Failed to delete task: " + errorMessage,
          }));
        }
      },

      moveTask: async (
        taskId: string,
        sourceColumnId: string,
        destinationColumnId: string,
        sourceIndex: number,
        destinationIndex: number,
        skipOptimistic = false
      ) => {
        // Skip API call if this is from a real-time update
        if (skipOptimistic) {
          set((state) => {
            const newColumns = [...state.columns];
            const sourceColumnIndex = newColumns.findIndex(
              (col) => col.id === sourceColumnId
            );
            const destColumnIndex = newColumns.findIndex(
              (col) => col.id === destinationColumnId
            );

            if (sourceColumnIndex === -1 || destColumnIndex === -1)
              return state;

            const sourceColumn = newColumns[sourceColumnIndex];
            const task = sourceColumn.tasks.find((c) => c.id === taskId);

            if (!task) return state;

            // Remove from source
            newColumns[sourceColumnIndex] = {
              ...sourceColumn,
              tasks: sourceColumn.tasks.filter((c) => c.id !== taskId),
            };

            // Add to destination
            const destColumn = newColumns[destColumnIndex];
            const newDestTasks = [...destColumn.tasks];
            newDestTasks.splice(destinationIndex, 0, task);

            newColumns[destColumnIndex] = {
              ...destColumn,
              tasks: newDestTasks,
            };

            return { columns: newColumns };
          });
          return;
        }

        const state = get();
        const sourceColumn = state.columns.find(
          (col) => col.id === sourceColumnId
        );
        if (!sourceColumn) {
          set({ error: "Source column not found" });
          return;
        }

        const task = sourceColumn.tasks.find((c) => c.id === taskId);
        if (!task) {
          set({ error: "Task not found" });
          return;
        }

        // Store original state for rollback
        const originalColumns = [...state.columns];

        // Apply optimistic update immediately
        set((state) => {
          const newColumns = [...state.columns];
          const sourceColumnIndex = newColumns.findIndex(
            (col) => col.id === sourceColumnId
          );
          const destColumnIndex = newColumns.findIndex(
            (col) => col.id === destinationColumnId
          );

          if (sourceColumnIndex === -1 || destColumnIndex === -1) return state;

          // Remove from source column
          const sourceColumn = newColumns[sourceColumnIndex];
          const updatedSourceTasks = sourceColumn.tasks.filter(
            (c) => c.id !== taskId
          );

          newColumns[sourceColumnIndex] = {
            ...sourceColumn,
            tasks: updatedSourceTasks,
          };

          // Add to destination column
          const destColumn = newColumns[destColumnIndex];
          const updatedDestTasks = [...destColumn.tasks];
          updatedDestTasks.splice(destinationIndex, 0, task);

          newColumns[destColumnIndex] = {
            ...destColumn,
            tasks: updatedDestTasks,
          };

          return { columns: newColumns, error: null };
        });

        try {
          const response = await fetch("/api/tasks/move", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              taskId,
              sourceColumnId,
              destinationColumnId,
              destinationIndex,
            }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Failed to move task");
          }
        } catch (error) {
          const errorMessage = getErrorMessage(error);
          console.error("Error moving task:", error);

          // Rollback to original state on error
          set({
            columns: originalColumns,
            error: "Failed to move task: " + errorMessage,
          });
        }
      },

      findTaskById: (taskId: string) => {
        const state = get();
        for (const column of state.columns) {
          const task = column.tasks.find((task) => task.id === taskId);
          if (task) {
            return { task, columnId: column.id };
          }
        }
        return null;
      },

      updateTaskTags: async (taskId: string, tagIds: string[]) => {
        const { useTagStore } = await import("./tag-store");
        const columns = get().columns;
        const tags = useTagStore.getState().tags;

        // Find the task and its column
        let targetColumnId: string | null = null;
        let originalTask: Task | null = null;

        for (const col of columns) {
          const task = col.tasks.find((c) => c.id === taskId);
          if (task) {
            targetColumnId = col.id;
            originalTask = task;
            break;
          }
        }

        if (!targetColumnId || !originalTask) {
          set({ error: "Task not found" });
          return false;
        }

        const selectedTags = tags.filter((tag) => tagIds.includes(tag.id));

        // Optimistic update
        set((state) => ({
          columns: state.columns.map((col) => {
            if (col.id === targetColumnId) {
              return {
                ...col,
                tasks: col.tasks.map((task) => {
                  if (task.id === taskId) {
                    return {
                      ...task,
                      tags: selectedTags,
                      updatedAt: new Date().toISOString(),
                    };
                  }
                  return task;
                }),
              };
            }
            return col;
          }),
          error: null,
        }));

        try {
          const response = await fetch(`/api/tasks/${taskId}/tags`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ tagIds }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Failed to update task tags");
          }

          const data = await response.json();
          if (data.success && data.task && data.task.tags) {
            set((state) => ({
              columns: state.columns.map((col) => {
                if (col.id === targetColumnId) {
                  return {
                    ...col,
                    tasks: col.tasks.map((task) => {
                      if (task.id === taskId) {
                        return {
                          ...task,
                          tags: data.task.tags,
                          updatedAt: data.task.updatedAt,
                        };
                      }
                      return task;
                    }),
                  };
                }
                return col;
              }),
            }));
          }

          return true;
        } catch (error) {
          const errorMessage = getErrorMessage(error);
          console.error("Error updating task tags:", error);

          // Rollback on error
          set((state) => ({
            columns: state.columns.map((col) => {
              if (col.id === targetColumnId) {
                return {
                  ...col,
                  tasks: col.tasks.map((task) => {
                    if (task.id === taskId) {
                      return originalTask!;
                    }
                    return task;
                  }),
                };
              }
              return col;
            }),
            error: "Failed to update task tags: " + errorMessage,
          }));

          return false;
        }
      },
    },
  }))
);

// Selectors
export const useBoard = () => useKanbanStore((state) => state.board);
export const useBoards = () => useKanbanStore((state) => state.boards);
export const useColumns = () => useKanbanStore((state) => state.columns);
export const useIsKanbanLoading = () =>
  useKanbanStore((state) => state.isLoading);
export const useError = () => useKanbanStore((state) => state.error);

// Actions
export const useKanbanActions = () => useKanbanStore((state) => state.actions);
