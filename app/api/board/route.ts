import { NextResponse } from "next/server"
import type { Board, Column } from "@/types"

// Mock database
const board: Board = {
  id: "board-1",
  title: "Project Tasks",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  users: [
    { id: "user-1", name: "You", avatar: "/placeholder.svg?height=32&width=32" },
    { id: "user-2", name: "John Doe", avatar: "/placeholder.svg?height=32&width=32" },
  ],
}

let columns: Column[] = [
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

export async function GET() {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 800))

  return NextResponse.json({ board, columns })
}

export async function POST(request: Request) {
  const data = await request.json()

  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 500))

  // Simulate random network errors (10% chance)
  if (Math.random() < 0.1) {
    return new NextResponse("Server error", { status: 500 })
  }

  // Process the update based on the type
  switch (data.type) {
    case "addColumn":
      columns.push(data.column)
      break

    case "deleteColumn":
      columns = columns.filter((col) => col.id !== data.columnId)
      break

    case "addCard":
      columns = columns.map((col) => {
        if (col.id === data.columnId) {
          return {
            ...col,
            cards: [...col.cards, data.card],
          }
        }
        return col
      })
      break

    case "updateCard":
      columns = columns.map((col) => {
        if (col.id === data.columnId) {
          return {
            ...col,
            cards: col.cards.map((card) => {
              if (card.id === data.cardId) {
                return {
                  ...card,
                  ...data.updates,
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
      columns = columns.map((col) => {
        if (col.id === data.columnId) {
          return {
            ...col,
            cards: col.cards.filter((card) => card.id !== data.cardId),
          }
        }
        return col
      })
      break

    case "moveCard":
      const { cardId, sourceColumnId, destinationColumnId, sourceIndex, destinationIndex } = data

      // Find the card to move
      const sourceColumn = columns.find((col) => col.id === sourceColumnId)
      if (!sourceColumn) {
        return new NextResponse("Source column not found", { status: 400 })
      }

      const card = sourceColumn.cards.find((c) => c.id === cardId)
      if (!card) {
        return new NextResponse("Card not found", { status: 400 })
      }

      // Remove from source column
      columns = columns.map((col) => {
        if (col.id === sourceColumnId) {
          const newCards = [...col.cards]
          newCards.splice(sourceIndex, 1)
          return { ...col, cards: newCards }
        }
        return col
      })

      // Add to destination column
      columns = columns.map((col) => {
        if (col.id === destinationColumnId) {
          const newCards = [...col.cards]
          newCards.splice(destinationIndex, 0, card)
          return { ...col, cards: newCards }
        }
        return col
      })
      break

    default:
      return new NextResponse("Invalid update type", { status: 400 })
  }

  return NextResponse.json({ success: true })
}
