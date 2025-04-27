import { NextResponse } from "next/server";

// This would be a WebSocket endpoint in a real application
// For our mock implementation, we'll use polling

export async function GET() {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 300));

  // Most of the time, return no updates
  if (Math.random() < 0.7) {
    return NextResponse.json({ updates: [] });
  }

  // Occasionally return a mock update
  const mockUpdates = [
    {
      type: "cardMoved",
      cardId: "card-2",
      sourceColumnId: "column-1",
      destinationColumnId: "column-2",
      sourceIndex: 1,
      destinationIndex: 1,
    },
    {
      type: "cardMoved",
      cardId: "card-3",
      sourceColumnId: "column-2",
      destinationColumnId: "column-3",
      sourceIndex: 0,
      destinationIndex: 1,
    },
    {
      type: "cardMoved",
      cardId: "card-4",
      sourceColumnId: "column-3",
      destinationColumnId: "column-1",
      sourceIndex: 0,
      destinationIndex: 0,
    },
  ];

  const randomUpdate =
    mockUpdates[Math.floor(Math.random() * mockUpdates.length)];

  return NextResponse.json({ updates: [randomUpdate] });
}
