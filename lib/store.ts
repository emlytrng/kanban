import { v4 as uuidv4 } from "uuid";
import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

import type { TaskOperationResponse } from "@/schemas/task-operation-response";
import type { Board, Card, Column } from "@/types";
import type {
  GetBoardsResponse,
  CreateBoardResponse,
  GetBoardResponse,
  CreateCardResponse,
  UpdateCardResponse,
  CreateColumnResponse,
  ChatTaskManagementResponse,
} from "@/types/api";

interface KanbanState {
  board: Board | null;
  boards: Board[];
  columns: Column[];
  isLoading: boolean;
  error: string | null;
  isDragging: boolean;

  actions: {
    setDragging: (isDragging: boolean) => void;
    clearError: () => void;
    fetchUserBoards: () => Promise<KanbanState["boards"]>;
    fetchBoard: (boardId?: string) => Promise<void>;
    addBoard: (title: string) => Promise<string | null>;
    deleteBoard: (boardId: string) => Promise<boolean>;
    addColumn: (title: string) => Promise<void>;
    deleteColumn: (columnId: string) => Promise<void>;
    moveColumn: (
      sourceIndex: number,
      destinationIndex: number
    ) => Promise<void>;
    addCard: (columnId: string, title: string) => Promise<void>;
    updateCard: (
      cardId: string,
      updates: Partial<Card>,
      columnId?: string
    ) => Promise<void>;
    deleteCard: (columnId: string, cardId: string) => Promise<void>;
    moveCard: (
      cardId: string,
      sourceColumnId: string,
      destinationColumnId: string,
      sourceIndex: number,
      destinationIndex: number,
      skipOptimistic?: boolean
    ) => Promise<void>;
    findTaskById: (taskId: string) => { task: Card; columnId: string } | null;
    chatWithAITaskManager: (
      input: string,
      columns: Column[],
      getAllTasks: () => Card[]
    ) => Promise<TaskOperationResponse>;
  };
}

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  return "An unknown error occurred";
};

export const useKanbanStore = create(
  subscribeWithSelector<KanbanState>((set, get) => ({
    board: null,
    boards: [],
    columns: [],
    isLoading: true,
    error: null,
    isDragging: false,

    actions: {
      setDragging: (isDragging: boolean) => {
        set({ isDragging });
      },

      clearError: () => {
        set({ error: null });
      },

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
          cards: [],
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

      addCard: async (columnId: string, title: string) => {
        const column = get().columns.find((col) => col.id === columnId);
        if (!column) {
          set({ error: "Column not found" });
          return;
        }

        const position = column.cards.length;
        const tempId = uuidv4();

        const newCard: Card = {
          id: tempId,
          title: title.trim(),
          description: "",
          assignee: "You",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        // Optimistic update
        set((state) => ({
          columns: state.columns.map((col) => {
            if (col.id === columnId) {
              return {
                ...col,
                cards: [...col.cards, newCard],
              };
            }
            return col;
          }),
          error: null,
        }));

        try {
          const response = await fetch("/api/cards", {
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
            throw new Error(errorData.error || "Failed to add card");
          }

          const data: CreateCardResponse = await response.json();

          // Update with the actual card ID from the server
          set((state) => ({
            columns: state.columns.map((col) => {
              if (col.id === columnId) {
                return {
                  ...col,
                  cards: col.cards.map((c) =>
                    c.id === tempId ? { ...c, id: data.card.id } : c
                  ),
                };
              }
              return col;
            }),
          }));
        } catch (error) {
          const errorMessage = getErrorMessage(error);
          console.error("Error adding card:", error);

          // Rollback on error
          set((state) => ({
            columns: state.columns.map((col) => {
              if (col.id === columnId) {
                return {
                  ...col,
                  cards: col.cards.filter((c) => c.id !== tempId),
                };
              }
              return col;
            }),
            error: "Failed to add card: " + errorMessage,
          }));
        }
      },

      updateCard: async (
        cardId: string,
        updates: Partial<Card>,
        columnId?: string
      ) => {
        // Find the column and card
        let targetColumnId = columnId;
        let originalCard: Card | undefined;

        if (!targetColumnId) {
          // If columnId is not provided, find it by searching all columns
          for (const col of get().columns) {
            const card = col.cards.find((c) => c.id === cardId);
            if (card) {
              targetColumnId = col.id;
              originalCard = card;
              break;
            }
          }
        } else {
          // If columnId is provided, find the card in that column
          const column = get().columns.find((col) => col.id === targetColumnId);
          originalCard = column?.cards.find((card) => card.id === cardId);
        }

        if (!targetColumnId || !originalCard) {
          set({ error: "Card or column not found" });
          return;
        }

        // Optimistic update
        set((state) => ({
          columns: state.columns.map((col) => {
            if (col.id === targetColumnId) {
              return {
                ...col,
                cards: col.cards.map((card) => {
                  if (card.id === cardId) {
                    return {
                      ...card,
                      ...updates,
                      updatedAt: new Date().toISOString(),
                    };
                  }
                  return card;
                }),
              };
            }
            return col;
          }),
          error: null,
        }));

        try {
          const response = await fetch(`/api/cards/${cardId}`, {
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
            throw new Error(errorData.error || "Failed to update card");
          }

          const data: UpdateCardResponse = await response.json();

          // Update with server response timestamp
          set((state) => ({
            columns: state.columns.map((col) => {
              if (col.id === targetColumnId) {
                return {
                  ...col,
                  cards: col.cards.map((card) => {
                    if (card.id === cardId) {
                      return {
                        ...card,
                        updatedAt: data.card.updatedAt,
                      };
                    }
                    return card;
                  }),
                };
              }
              return col;
            }),
          }));
        } catch (error) {
          const errorMessage = getErrorMessage(error);
          console.error("Error updating card:", error);

          // Rollback on error
          set((state) => ({
            columns: state.columns.map((col) => {
              if (col.id === targetColumnId) {
                return {
                  ...col,
                  cards: col.cards.map((card) => {
                    if (card.id === cardId) {
                      return originalCard!;
                    }
                    return card;
                  }),
                };
              }
              return col;
            }),
            error: "Failed to update card: " + errorMessage,
          }));
        }
      },

      deleteCard: async (columnId: string, cardId: string) => {
        const column = get().columns.find((col) => col.id === columnId);
        if (!column) {
          set({ error: "Column not found" });
          return;
        }

        const cardIndex = column.cards.findIndex((card) => card.id === cardId);
        if (cardIndex === -1) {
          set({ error: "Card not found" });
          return;
        }

        const deletedCard = column.cards[cardIndex];

        // Optimistic update
        set((state) => ({
          columns: state.columns.map((col) => {
            if (col.id === columnId) {
              return {
                ...col,
                cards: col.cards.filter((card) => card.id !== cardId),
              };
            }
            return col;
          }),
          error: null,
        }));

        try {
          const response = await fetch(`/api/cards/${cardId}`, {
            method: "DELETE",
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Failed to delete card");
          }
        } catch (error) {
          const errorMessage = getErrorMessage(error);
          console.error("Error deleting card:", error);

          // Rollback on error - restore card at its original position
          set((state) => ({
            columns: state.columns.map((col) => {
              if (col.id === columnId) {
                const newCards = [...col.cards];
                newCards.splice(cardIndex, 0, deletedCard);
                return {
                  ...col,
                  cards: newCards,
                };
              }
              return col;
            }),
            error: "Failed to delete card: " + errorMessage,
          }));
        }
      },

      moveCard: async (
        cardId: string,
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
            const card = sourceColumn.cards.find((c) => c.id === cardId);

            if (!card) return state;

            // Remove from source
            newColumns[sourceColumnIndex] = {
              ...sourceColumn,
              cards: sourceColumn.cards.filter((c) => c.id !== cardId),
            };

            // Add to destination
            const destColumn = newColumns[destColumnIndex];
            const newDestCards = [...destColumn.cards];
            newDestCards.splice(destinationIndex, 0, card);

            newColumns[destColumnIndex] = {
              ...destColumn,
              cards: newDestCards,
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

        const card = sourceColumn.cards.find((c) => c.id === cardId);
        if (!card) {
          set({ error: "Card not found" });
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
          const updatedSourceCards = sourceColumn.cards.filter(
            (c) => c.id !== cardId
          );

          newColumns[sourceColumnIndex] = {
            ...sourceColumn,
            cards: updatedSourceCards,
          };

          // Add to destination column
          const destColumn = newColumns[destColumnIndex];
          const updatedDestCards = [...destColumn.cards];
          updatedDestCards.splice(destinationIndex, 0, card);

          newColumns[destColumnIndex] = {
            ...destColumn,
            cards: updatedDestCards,
          };

          return { columns: newColumns, error: null };
        });

        try {
          const response = await fetch("/api/cards/move", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              cardId,
              sourceColumnId,
              destinationColumnId,
              destinationIndex,
            }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Failed to move card");
          }
        } catch (error) {
          const errorMessage = getErrorMessage(error);
          console.error("Error moving card:", error);

          // Rollback to original state on error
          set({
            columns: originalColumns,
            error: "Failed to move card: " + errorMessage,
          });
        }
      },

      findTaskById: (taskId: string) => {
        const state = get();
        for (const column of state.columns) {
          const task = column.cards.find((card) => card.id === taskId);
          if (task) {
            return { task, columnId: column.id };
          }
        }
        return null;
      },

      chatWithAITaskManager: async (
        input: string,
        columns: Column[],
        getAllTasks: () => Card[]
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

export const useBoard = () => useKanbanStore((state) => state.board);
export const useBoards = () => useKanbanStore((state) => state.boards);
export const useColumns = () => useKanbanStore((state) => state.columns);
export const useIsLoading = () => useKanbanStore((state) => state.isLoading);
export const useError = () => useKanbanStore((state) => state.error);
export const useIsDragging = () => useKanbanStore((state) => state.isDragging);

export const useActions = () => useKanbanStore((state) => state.actions);
