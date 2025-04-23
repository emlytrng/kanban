import type { Board, Column } from "@/types"

// Mock initial data
const initialBoard: Board = {
  id: "board-1",
  title: "Project Tasks",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  users: [
    { id: "user-1", name: "You", avatar: "/placeholder.svg?height=32&width=32" },
    { id: "user-2", name: "John Doe", avatar: "/placeholder.svg?height=32&width=32" },
  ],
}

const initialColumns: Column[] = [
  {
    id: "column-1",
    title: "To Do",
    cards: [
      {
        id: "card-1",
        title: "Research competitors",
        description: "Look at similar products and identify strengths and weaknesses",
        assignee: "You",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "card-2",
        title: "Create wireframes",
        description: "Design initial wireframes for the main screens",
        assignee: "John Doe",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "column-2",
    title: "In Progress",
    cards: [
      {
        id: "card-3",
        title: "Implement authentication",
        description: "Set up user login and registration",
        assignee: "You",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "column-3",
    title: "Done",
    cards: [
      {
        id: "card-4",
        title: "Project setup",
        description: "Initialize repository and set up development environment",
        assignee: "You",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

// Mock data storage
const boardData = {
  board: initialBoard,
  columns: initialColumns,
}

// Mock API functions
export async function fetchBoardData() {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 800))

  return { ...boardData }
}

export async function updateBoardData(update: any) {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 500))

  // Simulate random network errors (10% chance)
  if (Math.random() < 0.1) {
    throw new Error("Network error")
  }

  // In a real app, this would be an API call
  // For now, we'll just update our mock data
  switch (update.type) {
    case "addColumn":
      boardData.columns.push(update.column)
      break

    case "deleteColumn":
      boardData.columns = boardData.columns.filter((col) => col.id !== update.columnId)
      break

    case "addCard":
      boardData.columns = boardData.columns.map((col) => {
        if (col.id === update.columnId) {
          return {
            ...col,
            cards: [...col.cards, update.card],
          }
        }
        return col
      })
      break

    case "updateCard":
      boardData.columns = boardData.columns.map((col) => {
        if (col.id === update.columnId) {
          return {
            ...col,
            cards: col.cards.map((card) => {
              if (card.id === update.cardId) {
                return {
                  ...card,
                  ...update.updates,
                }
              }
              return card
            }),
          }
        }
        return col
      })
      break

    case "deleteCard":
      boardData.columns = boardData.columns.map((col) => {
        if (col.id === update.columnId) {
          return {
            ...col,
            cards: col.cards.filter((card) => card.id !== update.cardId),
          }
        }
        return col
      })
      break

    case "moveCard":
      const { cardId, sourceColumnId, destinationColumnId, sourceIndex, destinationIndex } = update

      // Find the card to move
      const sourceColumn = boardData.columns.find((col) => col.id === sourceColumnId)
      if (!sourceColumn) return

      const card = sourceColumn.cards.find((c) => c.id === cardId)
      if (!card) return

      // Remove from source column
      boardData.columns = boardData.columns.map((col) => {
        if (col.id === sourceColumnId) {
          const newCards = [...col.cards]
          newCards.splice(sourceIndex, 1)
          return { ...col, cards: newCards }
        }
        return col
      })

      // Add to destination column
      boardData.columns = boardData.columns.map((col) => {
        if (col.id === destinationColumnId) {
          const newCards = [...col.cards]
          newCards.splice(destinationIndex, 0, card)
          return { ...col, cards: newCards }
        }
        return col
      })
      break
  }

  return true
}
