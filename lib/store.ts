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
    fetchUserBoards: (userId: string) => Promise<KanbanState["boards"]>;
    fetchBoard: (userId: string, boardId?: string) => Promise<void>;
    addBoard: (title: string, userId: string) => Promise<string | null>;
    addColumn: (title: string) => void;
    deleteColumn: (columnId: string) => void;
    moveColumn: (sourceIndex: number, destinationIndex: number) => void;
    addCard: (columnId: string, title: string) => void;
    updateCard: (
      cardId: string,
      updates: Partial<Card>,
      columnId?: string
    ) => void;
    deleteCard: (columnId: string, cardId: string) => void;
    moveCard: (
      cardId: string,
      sourceColumnId: string,
      destinationColumnId: string,
      sourceIndex: number,
      destinationIndex: number,
      skipOptimistic?: boolean
    ) => void;
    findTaskById: (taskId: string) => { task: Card; columnId: string } | null;
    chatWithAITaskManager: (
      input: string,
      columns: Column[],
      getAllTasks: () => Card[]
    ) => Promise<TaskOperationResponse>;
  };
}

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
        } catch (error: any) {
          console.error("Error fetching user boards:", error);
          set({
            error: "Failed to fetch boards: " + error.message,
            isLoading: false,
          });
          return [];
        }
      },

      fetchBoard: async (userId, boardId) => {
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
        } catch (error: any) {
          console.error("Error fetching board:", error);
          set({
            error: "Failed to fetch board data: " + error.message,
            isLoading: false,
          });
        }
      },

      addBoard: async (title: string, userId: string) => {
        try {
          const response = await fetch("/api/boards", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ title }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Failed to create board");
          }

          const data: CreateBoardResponse = await response.json();

          // Update the boards list
          await get().actions.fetchUserBoards(userId);

          // Return the new board ID
          return data.boardId;
        } catch (error: any) {
          console.error("Error creating board:", error);
          return null;
        }
      },

      addColumn: async (title: string) => {
        const board = get().board;
        if (!board) return;

        const columns = get().columns;
        const position = columns.length;

        const newColumn: Column = {
          id: uuidv4(),
          title,
          cards: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        // Optimistic update
        set((state) => ({
          columns: [...state.columns, newColumn],
        }));

        try {
          const response = await fetch("/api/columns", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              boardId: board.id,
              title,
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
              col.id === newColumn.id ? { ...col, id: data.column.id } : col
            ),
          }));
        } catch (error) {
          // Rollback on error
          set((state) => ({
            columns: state.columns.filter((col) => col.id !== newColumn.id),
          }));
          console.error("Error adding column:", error);
        }
      },

      deleteColumn: async (columnId: string) => {
        const columnToDelete = get().columns.find((col) => col.id === columnId);

        // Optimistic update
        set((state) => ({
          columns: state.columns.filter((col) => col.id !== columnId),
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
          // Rollback on error
          if (columnToDelete) {
            set((state) => ({
              columns: [...state.columns, columnToDelete],
            }));
          }
          console.error("Error deleting column:", error);
        }
      },

      moveColumn: async (sourceIndex: number, destinationIndex: number) => {
        const { columns } = get();
        const originalColumns = [...columns]; // Store original state

        const newColumns = [...columns];
        const [movedColumn] = newColumns.splice(sourceIndex, 1);
        newColumns.splice(destinationIndex, 0, movedColumn);

        set({ columns: newColumns });

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
          console.error("Error reordering columns:", error);
          // Rollback to original state
          set({ columns: originalColumns, error: "Failed to reorder columns" });
        }
      },

      addCard: async (columnId: string, title: string) => {
        const column = get().columns.find((col) => col.id === columnId);
        if (!column) return;

        const position = column.cards.length;

        const newCard: Card = {
          id: uuidv4(),
          title,
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
        }));

        try {
          const response = await fetch("/api/cards", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              columnId,
              title,
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
                    c.id === newCard.id ? { ...c, id: data.card.id } : c
                  ),
                };
              }
              return col;
            }),
          }));
        } catch (error) {
          // Rollback on error
          set((state) => ({
            columns: state.columns.map((col) => {
              if (col.id === columnId) {
                return {
                  ...col,
                  cards: col.cards.filter((c) => c.id !== newCard.id),
                };
              }
              return col;
            }),
          }));
          console.error("Error adding card:", error);
        }
      },

      updateCard: async (
        cardId: string,
        updates: Partial<Card>,
        columnId?: string
      ) => {
        const originalCard = get()
          .columns.find((col) => col.id === columnId)
          ?.cards.find((card) => card.id === cardId);

        // Optimistic update
        set((state) => ({
          columns: state.columns.map((col) => {
            if (col.id === columnId) {
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
        } catch (error) {
          // Rollback on error
          if (originalCard) {
            set((state) => ({
              columns: state.columns.map((col) => {
                if (col.id === columnId) {
                  return {
                    ...col,
                    cards: col.cards.map((card) => {
                      if (card.id === cardId) {
                        return originalCard;
                      }
                      return card;
                    }),
                  };
                }
                return col;
              }),
            }));
          }
          console.error("Error updating card:", error);
        }
      },

      deleteCard: async (columnId: string, cardId: string) => {
        const columnIndex = get().columns.findIndex(
          (col) => col.id === columnId
        );
        if (columnIndex === -1) return;

        const cardIndex = get().columns[columnIndex].cards.findIndex(
          (card) => card.id === cardId
        );
        if (cardIndex === -1) return;

        const deletedCard = get().columns[columnIndex].cards[cardIndex];

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
          // Rollback on error
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
          }));
          console.error("Error deleting card:", error);
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
        if (!sourceColumn) return;

        const card = sourceColumn.cards.find((c) => c.id === cardId);
        if (!card) return;

        // Store original state for rollback
        const originalColumns = state.columns;

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

          return { columns: newColumns };
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
          console.error("Error moving card:", error);
          // Rollback to original state on error
          set({ columns: originalColumns });
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
          throw new Error("Failed to process message");
        }
        const data: ChatTaskManagementResponse = await response.json();
        return data;
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
