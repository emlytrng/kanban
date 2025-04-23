import { create } from "zustand"
import { v4 as uuidv4 } from "uuid"
import type { Board, Card, Column } from "@/types"
import { fetchBoardData, updateBoardData } from "./api"

interface KanbanState {
  board: Board | null
  columns: Column[]
  isLoading: boolean
  error: string | null

  // Actions
  fetchBoard: () => Promise<void>
  addColumn: (title: string) => void
  deleteColumn: (columnId: string) => void
  addCard: (columnId: string, title: string) => void
  updateCard: (columnId: string, cardId: string, updates: Partial<Card>) => void
  deleteCard: (columnId: string, cardId: string) => void
  moveCard: (
    cardId: string,
    sourceColumnId: string,
    destinationColumnId: string,
    sourceIndex: number,
    destinationIndex: number,
    skipOptimistic?: boolean,
  ) => void
}

export const useKanbanStore = create<KanbanState>((set, get) => ({
  board: null,
  columns: [],
  isLoading: true,
  error: null,

  fetchBoard: async () => {
    set({ isLoading: true, error: null })
    try {
      const data = await fetchBoardData()
      set({ board: data.board, columns: data.columns, isLoading: false })
    } catch (error) {
      set({
        error: "Failed to fetch board data",
        isLoading: false,
      })
    }
  },

  addColumn: (title: string) => {
    const newColumn: Column = {
      id: uuidv4(),
      title,
      cards: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    set((state) => ({
      columns: [...state.columns, newColumn],
    }))

    // Optimistic update
    updateBoardData({
      type: "addColumn",
      column: newColumn,
    }).catch(() => {
      // Rollback on error
      set((state) => ({
        columns: state.columns.filter((col) => col.id !== newColumn.id),
      }))
    })
  },

  deleteColumn: (columnId: string) => {
    const columnToDelete = get().columns.find((col) => col.id === columnId)

    set((state) => ({
      columns: state.columns.filter((col) => col.id !== columnId),
    }))

    // Optimistic update
    updateBoardData({
      type: "deleteColumn",
      columnId,
    }).catch(() => {
      // Rollback on error
      if (columnToDelete) {
        set((state) => ({
          columns: [...state.columns, columnToDelete],
        }))
      }
    })
  },

  addCard: (columnId: string, title: string) => {
    const newCard: Card = {
      id: uuidv4(),
      title,
      description: "",
      assignee: "You",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    set((state) => ({
      columns: state.columns.map((col) => {
        if (col.id === columnId) {
          return {
            ...col,
            cards: [...col.cards, newCard],
          }
        }
        return col
      }),
    }))

    // Optimistic update
    updateBoardData({
      type: "addCard",
      columnId,
      card: newCard,
    }).catch(() => {
      // Rollback on error
      set((state) => ({
        columns: state.columns.map((col) => {
          if (col.id === columnId) {
            return {
              ...col,
              cards: col.cards.filter((c) => c.id !== newCard.id),
            }
          }
          return col
        }),
      }))
    })
  },

  updateCard: (columnId: string, cardId: string, updates: Partial<Card>) => {
    const originalCard = get()
      .columns.find((col) => col.id === columnId)
      ?.cards.find((card) => card.id === cardId)

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
                }
              }
              return card
            }),
          }
        }
        return col
      }),
    }))

    // Optimistic update
    updateBoardData({
      type: "updateCard",
      columnId,
      cardId,
      updates: {
        ...updates,
        updatedAt: new Date().toISOString(),
      },
    }).catch(() => {
      // Rollback on error
      if (originalCard) {
        set((state) => ({
          columns: state.columns.map((col) => {
            if (col.id === columnId) {
              return {
                ...col,
                cards: col.cards.map((card) => {
                  if (card.id === cardId) {
                    return originalCard
                  }
                  return card
                }),
              }
            }
            return col
          }),
        }))
      }
    })
  },

  deleteCard: (columnId: string, cardId: string) => {
    const columnIndex = get().columns.findIndex((col) => col.id === columnId)
    if (columnIndex === -1) return

    const cardIndex = get().columns[columnIndex].cards.findIndex((card) => card.id === cardId)
    if (cardIndex === -1) return

    const deletedCard = get().columns[columnIndex].cards[cardIndex]

    set((state) => ({
      columns: state.columns.map((col) => {
        if (col.id === columnId) {
          return {
            ...col,
            cards: col.cards.filter((card) => card.id !== cardId),
          }
        }
        return col
      }),
    }))

    // Optimistic update
    updateBoardData({
      type: "deleteCard",
      columnId,
      cardId,
    }).catch(() => {
      // Rollback on error
      set((state) => ({
        columns: state.columns.map((col) => {
          if (col.id === columnId) {
            const newCards = [...col.cards]
            newCards.splice(cardIndex, 0, deletedCard)
            return {
              ...col,
              cards: newCards,
            }
          }
          return col
        }),
      }))
    })
  },

  moveCard: (
    cardId: string,
    sourceColumnId: string,
    destinationColumnId: string,
    sourceIndex: number,
    destinationIndex: number,
    skipOptimistic = false,
  ) => {
    const sourceColumn = get().columns.find((col) => col.id === sourceColumnId)
    if (!sourceColumn) return

    const card = sourceColumn.cards.find((c) => c.id === cardId)
    if (!card) return

    // Apply the move in our local state
    set((state) => {
      const newColumns = state.columns.map((col) => {
        // Remove from source column
        if (col.id === sourceColumnId) {
          const newCards = [...col.cards]
          newCards.splice(sourceIndex, 1)
          return { ...col, cards: newCards }
        }

        // Add to destination column
        if (col.id === destinationColumnId) {
          const newCards = [...col.cards]
          newCards.splice(destinationIndex, 0, card)
          return { ...col, cards: newCards }
        }

        return col
      })

      return { columns: newColumns }
    })

    // Skip API call if this is from a real-time update
    if (skipOptimistic) return

    // Optimistic update
    updateBoardData({
      type: "moveCard",
      cardId,
      sourceColumnId,
      destinationColumnId,
      sourceIndex,
      destinationIndex,
    }).catch(() => {
      // Rollback on error - move the card back
      get().moveCard(cardId, destinationColumnId, sourceColumnId, destinationIndex, sourceIndex, true)
    })
  },
}))
