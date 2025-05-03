import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { v4 as uuidv4 } from "uuid";
import type { Board, Card, Column } from "@/types";

interface KanbanState {
  board: Board | null;
  boards: Board[];
  columns: Column[];
  isLoading: boolean;
  error: string | null;

  actions: {
    fetchUserBoards: (userId: string) => Promise<KanbanState["boards"]>;
    fetchBoard: (userId: string, boardId?: string) => Promise<void>;
    addBoard: (title: string, userId: string) => Promise<string | null>;
    addColumn: (title: string) => void;
    deleteColumn: (columnId: string) => void;
    addCard: (columnId: string, title: string) => void;
    updateCard: (
      columnId: string,
      cardId: string,
      updates: Partial<Card>
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
  };
}

export const useKanbanStore = create(
  subscribeWithSelector<KanbanState>((set, get) => ({
    userId: null,
    board: null,
    boards: [],
    columns: [],
    isLoading: true,
    error: null,

    actions: {
      fetchUserBoards: async (userId: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch("/api/boards");

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Failed to fetch boards");
          }

          const { boards } = await response.json();

          set({
            boards: boards || [],
            isLoading: false,
          });

          return boards;
        } catch (error: any) {
          console.error("Error fetching user boards:", error);
          set({
            error: "Failed to fetch boards: " + error.message,
            isLoading: false,
          });
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

          const { board, columns } = await response.json();

          set({
            board,
            columns,
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

          const { boardId } = await response.json();

          // Update the boards list
          await get().actions.fetchUserBoards(userId);

          // Return the new board ID
          return boardId;
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

          const { column } = await response.json();

          // Update with the actual column ID from the server
          set((state) => ({
            columns: state.columns.map((col) =>
              col.id === newColumn.id ? { ...col, id: column.id } : col
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

          const { card } = await response.json();

          // Update with the actual card ID from the server
          set((state) => ({
            columns: state.columns.map((col) => {
              if (col.id === columnId) {
                return {
                  ...col,
                  cards: col.cards.map((c) =>
                    c.id === newCard.id ? { ...c, id: card.id } : c
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
        columnId: string,
        cardId: string,
        updates: Partial<Card>
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
        const sourceColumn = get().columns.find(
          (col) => col.id === sourceColumnId
        );
        if (!sourceColumn) return;

        const card = sourceColumn.cards.find((c) => c.id === cardId);
        if (!card) return;

        // Apply the move in our local state
        if (!skipOptimistic) {
          set((state) => {
            const newColumns = state.columns.map((col) => {
              // Remove from source column
              if (col.id === sourceColumnId) {
                const newCards = [...col.cards];
                newCards.splice(sourceIndex, 1);
                return { ...col, cards: newCards };
              }

              // Add to destination column
              if (col.id === destinationColumnId) {
                const newCards = [...col.cards];
                newCards.splice(destinationIndex, 0, card);
                return { ...col, cards: newCards };
              }

              return col;
            });

            return { columns: newColumns };
          });
        }

        // Skip API call if this is from a real-time update
        if (skipOptimistic) return;

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
              sourceIndex,
              destinationIndex,
            }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Failed to move card");
          }
        } catch (error) {
          // Rollback on error - move the card back
          console.error("Error moving card:", error);
          get().actions.moveCard(
            cardId,
            destinationColumnId,
            sourceColumnId,
            destinationIndex,
            sourceIndex,
            true
          );
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

export const useActions = () => useKanbanStore((state) => state.actions);
