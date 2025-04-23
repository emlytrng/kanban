// Mock real-time updates
// In a real app, this would be WebSockets or Server-Sent Events

type RealtimeUpdate = {
  type: string
  [key: string]: any
}

type UpdateCallback = (update: RealtimeUpdate) => void

// Mock data for simulating other users' actions
const mockUpdates: RealtimeUpdate[] = [
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
]

// Simulate real-time updates
export function simulateRealtimeUpdate(callback: UpdateCallback) {
  // Only simulate updates occasionally (10% chance)
  if (Math.random() < 0.1) {
    const randomUpdate = mockUpdates[Math.floor(Math.random() * mockUpdates.length)]
    callback(randomUpdate)
  }
}

// In a real app, you would have a WebSocket connection here
// Example:
/*
const socket = new WebSocket('wss://your-api.com/ws')

socket.onmessage = (event) => {
  const update = JSON.parse(event.data)
  callback(update)
}
*/
