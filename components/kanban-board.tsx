"use client";

import { useEffect } from "react";
import { DragDropContext, Droppable, type DropResult } from "@hello-pangea/dnd";
import { Plus } from "lucide-react";
import { useActions, useBoard, useColumns, useIsLoading } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Column } from "@/types";
import KanbanColumn from "./kanban-column";
import { setupRealtimeSubscription } from "@/lib/realtime";
import { useState } from "react";

type KanbanBoardProps = {
  userId: string;
};

export default function KanbanBoard({ userId }: KanbanBoardProps) {
  const board = useBoard();
  const columns = useColumns();
  const isLoading = useIsLoading();
  const { fetchBoard, fetchUserBoards, addColumn, moveCard } = useActions();

  const [newColumnTitle, setNewColumnTitle] = useState("");
  const [isAddingColumn, setIsAddingColumn] = useState(false);

  useEffect(() => {
    fetchUserBoards(userId).then(() => fetchBoard());

    const unsubscribe = setupRealtimeSubscription();

    return () => {
      unsubscribe();
    };
  }, [fetchBoard, fetchUserBoards]);

  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    // Dropped outside the list
    if (!destination) return;

    // Dropped in the same position
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    )
      return;

    moveCard(
      draggableId,
      source.droppableId,
      destination.droppableId,
      source.index,
      destination.index
    );
  };

  const handleAddColumn = () => {
    if (newColumnTitle.trim()) {
      addColumn(newColumnTitle.trim());
      setNewColumnTitle("");
      setIsAddingColumn(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!board) {
    return null;
  }

  return (
    <div className="mb-10">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-300">
            {board.users?.length || 1} collaborator
            {(board.users?.length || 1) > 1 ? "s" : ""}
          </span>
        </div>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable
          droppableId="all-columns"
          direction="horizontal"
          type="column"
        >
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="flex gap-4 overflow-x-auto pb-4"
            >
              {columns.map((column: Column, index: number) => (
                <KanbanColumn key={column.id} column={column} index={index} />
              ))}
              {provided.placeholder}

              {isAddingColumn ? (
                <div className="shrink-0 w-72 bg-slate-700 rounded-lg p-3">
                  <Input
                    value={newColumnTitle}
                    onChange={(e) => setNewColumnTitle(e.target.value)}
                    placeholder="Enter column title..."
                    className="mb-2"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddColumn();
                      if (e.key === "Escape") setIsAddingColumn(false);
                    }}
                  />
                  <div className="flex gap-2">
                    <Button onClick={handleAddColumn} size="sm">
                      Add Column
                    </Button>
                    <Button
                      onClick={() => setIsAddingColumn(false)}
                      variant="ghost"
                      size="sm"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  onClick={() => setIsAddingColumn(true)}
                  variant="outline"
                  className="shrink-0 h-12 border-dashed border-slate-600 text-slate-400 hover:text-white hover:border-white"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Add Column
                </Button>
              )}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
}
