import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { v4 as uuidv4 } from "uuid";
import type { Board, Card, Column } from "@/types";
import { supabase } from "./supabase";

interface KanbanState {
  board: Board | null;
  boards: Board[];
  columns: Column[];
  isLoading: boolean;
  error: string | null;

  actions: {
    fetchUserBoards: (userId: string) => Promise<void>;
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
          const { data: boardMembers, error: membersError } = await supabase
            .from("board_members")
            .select("board_id")
            .eq("user_id", userId)
            .order("updated_at", { ascending: false });

          if (membersError) throw membersError;

          if (!boardMembers || boardMembers.length === 0) {
            set({ boards: [], isLoading: false });
            return;
          }

          const boardIds = boardMembers.map((member) => member.board_id);

          // Fetch the actual board data
          const { data: boardsData, error: boardsError } = await supabase
            .from("boards")
            .select("*")
            .in("id", boardIds)
            .order("updated_at", { ascending: false });

          if (boardsError) throw boardsError;

          set({
            boards: boardsData.map((board) => ({
              id: board.id,
              title: board.title,
              createdAt: board.created_at,
              updatedAt: board.updated_at,
            })),
            isLoading: false,
          });
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
          if (!boardId) {
            // If no boardId is provided, try to get the latest board
            const { data: boardMembers, error: membersError } = await supabase
              .from("board_members")
              .select("board_id")
              .eq("user_id", userId)
              .order("updated_at", { ascending: false })
              .limit(1);

            if (membersError) throw membersError;

            if (!boardMembers || boardMembers.length === 0) {
              // No boards found for this user
              set({ board: null, columns: [], isLoading: false });
              return;
            }

            boardId = boardMembers[0].board_id;
          }

          // Fetch the board
          const { data: boardData, error: boardError } = await supabase
            .from("boards")
            .select("*")
            .eq("id", boardId)
            .single();

          if (boardError) throw boardError;

          // Fetch columns for this board
          const { data: columnsData, error: columnsError } = await supabase
            .from("columns")
            .select(
              `
              id,
              title,
              position,
              created_at,
              updated_at,
              cards (
                id,
                title,
                description,
                position,
                created_at,
                updated_at
              )
            `
            )
            .eq("board_id", boardId)
            .order("position");

          if (columnsError) throw columnsError;

          // Transform data to match our app's structure
          const columns: Column[] = columnsData.map((col) => ({
            id: col.id,
            title: col.title,
            cards: (col.cards || [])
              .sort((a, b) => a.position - b.position)
              .map((card) => ({
                id: card.id,
                title: card.title,
                description: card.description || "",
                assignee: "You", // Default assignee
                createdAt: card.created_at,
                updatedAt: card.updated_at,
              })),
            createdAt: col.created_at,
            updatedAt: col.updated_at,
          }));

          set({
            board: {
              id: boardData.id,
              title: boardData.title,
              createdAt: boardData.created_at,
              updatedAt: boardData.updated_at,
            },
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
          // Create a new board
          const { data: newBoard, error: boardError } = await supabase
            .from("boards")
            .insert({
              title,
            })
            .select()
            .single();

          if (boardError) throw boardError;

          // Add the current user as a board member
          const { error: memberError } = await supabase
            .from("board_members")
            .insert({
              board_id: newBoard.id,
              user_id: userId,
            });

          if (memberError) throw memberError;

          // Create default columns
          const defaultColumns = [
            { title: "To Do", position: 0 },
            { title: "In Progress", position: 1 },
            { title: "Done", position: 2 },
          ];

          for (const col of defaultColumns) {
            await supabase.from("columns").insert({
              board_id: newBoard.id,
              title: col.title,
              position: col.position,
            });
          }

          // Update the boards list
          await get().actions.fetchUserBoards(userId);

          // Return the new board ID
          return newBoard.id;
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
          const { data, error } = await supabase
            .from("columns")
            .insert({
              id: newColumn.id,
              board_id: board.id,
              title,
              position,
            })
            .select()
            .single();

          if (error) throw error;
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
          const { error } = await supabase
            .from("columns")
            .delete()
            .eq("id", columnId);

          if (error) throw error;
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
          const { data, error } = await supabase
            .from("cards")
            .insert({
              id: newCard.id,
              column_id: columnId,
              title,
              description: "",
              position,
            })
            .select()
            .single();

          if (error) throw error;
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
          const { error } = await supabase
            .from("cards")
            .update({
              title: updates.title,
              description: updates.description,
              updated_at: new Date().toISOString(),
            })
            .eq("id", cardId);

          if (error) throw error;
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
          const { error } = await supabase
            .from("cards")
            .delete()
            .eq("id", cardId);

          if (error) throw error;
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

        // Skip API call if this is from a real-time update
        if (skipOptimistic) return;

        try {
          // Update the card's column and position
          const { error } = await supabase
            .from("cards")
            .update({
              column_id: destinationColumnId,
              position: destinationIndex,
              updated_at: new Date().toISOString(),
            })
            .eq("id", cardId);

          if (error) throw error;

          // Update positions of other cards in the destination column
          const destinationColumn = get().columns.find(
            (col) => col.id === destinationColumnId
          );
          if (destinationColumn) {
            const updates = destinationColumn.cards.map((card, index) => ({
              id: card.id,
              position: index,
            }));

            for (const update of updates) {
              if (update.id !== cardId) {
                await supabase
                  .from("cards")
                  .update({ position: update.position })
                  .eq("id", update.id);
              }
            }
          }

          // Update positions of cards in the source column if different
          if (sourceColumnId !== destinationColumnId) {
            const sourceColumn = get().columns.find(
              (col) => col.id === sourceColumnId
            );
            if (sourceColumn) {
              const updates = sourceColumn.cards.map((card, index) => ({
                id: card.id,
                position: index,
              }));

              for (const update of updates) {
                await supabase
                  .from("cards")
                  .update({ position: update.position })
                  .eq("id", update.id);
              }
            }
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
