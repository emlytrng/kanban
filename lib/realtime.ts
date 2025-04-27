import { supabase } from "./supabase";
import { useKanbanStore } from "./store";

export function setupRealtimeSubscription() {
  const channel = supabase
    .channel("schema-db-changes")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "cards",
      },
      (payload) => {
        handleCardChange(payload);
      }
    )
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "columns",
      },
      (payload) => {
        handleColumnChange(payload);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

function handleCardChange(payload: any) {
  const { eventType, new: newRecord, old: oldRecord } = payload;
  const store = useKanbanStore.getState();

  // Handle card updates
  if (eventType === "UPDATE" && oldRecord.column_id !== newRecord.column_id) {
    // Card moved between columns
    const sourceColumn = store.columns.find(
      (col) => col.id === oldRecord.column_id
    );
    const destColumn = store.columns.find(
      (col) => col.id === newRecord.column_id
    );

    if (sourceColumn && destColumn) {
      const sourceIndex = sourceColumn.cards.findIndex(
        (card) => card.id === newRecord.id
      );
      if (sourceIndex !== -1) {
        store.actions.moveCard(
          newRecord.id,
          oldRecord.column_id,
          newRecord.column_id,
          sourceIndex,
          newRecord.position,
          true // Skip optimistic update
        );
      }
    }
  } else if (eventType === "INSERT") {
    // Refresh board to get the new card
    store.actions.fetchBoard();
  } else if (eventType === "DELETE") {
    // Refresh board to update after card deletion
    store.actions.fetchBoard();
  }
}

function handleColumnChange(payload: any) {
  const { eventType } = payload;
  const store = useKanbanStore.getState();

  // For simplicity, just refresh the board on column changes
  if (["INSERT", "UPDATE", "DELETE"].includes(eventType)) {
    store.actions.fetchBoard();
  }
}
