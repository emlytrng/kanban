"use client";

import { useEffect, useState } from "react";
import { DragDropContext, Droppable, type DropResult } from "@hello-pangea/dnd";
import { Plus, Loader2, Bot } from "lucide-react";
import {
  useActions,
  useBoard,
  useColumns,
  useIsLoading,
  useError,
} from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Column } from "@/types";
import KanbanColumn from "./kanban-column";
import ChatTaskManager from "./chat-task-manager";

type KanbanBoardProps = {
  userId: string;
};

export default function KanbanBoard({ userId }: KanbanBoardProps) {
  const board = useBoard();
  const columns = useColumns();
  const isLoading = useIsLoading();
  const error = useError();
  const { fetchBoard, fetchUserBoards, addColumn, moveCard } = useActions();

  const [newColumnTitle, setNewColumnTitle] = useState("");
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  useEffect(() => {
    async function fetchBoardData() {
      try {
        const boards = await fetchUserBoards(userId);
        await fetchBoard(userId, boards[0]?.id);
      } catch (err) {
        console.error("Error loading data:", err);
      }
    }

    fetchBoardData();
  }, [fetchBoard, fetchUserBoards, userId]);

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
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-md text-destructive mb-6">
        <h3 className="font-bold">Error loading board</h3>
        <p>{error}</p>
      </div>
    );
  }

  if (!board) {
    return null;
  }

  return (
    <div className="h-screen bg-background text-foreground">
      {/* Header */}
      <div className="flex items-center justify-between p-6">
        <div className="flex items-center gap-3">
          <Button
            onClick={() => setIsAddingColumn(true)}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Column
          </Button>
          <Button
            onClick={() => setIsChatOpen(true)}
            className="bg-primary text-primary-foreground hover:bg-primary/90 border-0"
          >
            <Bot className="h-4 w-4 mr-2" />
            AI Assistant
          </Button>
        </div>
      </div>

      {/* Board */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden bg-background">
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="board" type="column" direction="horizontal">
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="flex gap-6 p-6 h-full kanban-scrollbar"
                style={{ minWidth: "max-content" }}
              >
                {columns.map((column, index) => (
                  <KanbanColumn key={column.id} column={column} index={index} />
                ))}

                {/* Add Column */}
                <div className="shrink-0 w-80">
                  {isAddingColumn ? (
                    <div className="bg-card border border-border rounded-md p-3">
                      <Input
                        value={newColumnTitle}
                        onChange={(e) => setNewColumnTitle(e.target.value)}
                        placeholder="Enter column title..."
                        className="mb-2 bg-input border-border text-foreground placeholder:text-muted-foreground"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleAddColumn();
                          if (e.key === "Escape") setIsAddingColumn(false);
                        }}
                      />
                      <div className="flex gap-2">
                        <Button
                          onClick={handleAddColumn}
                          size="sm"
                          className="bg-primary text-primary-foreground hover:bg-primary/90"
                        >
                          Add Column
                        </Button>
                        <Button
                          onClick={() => setIsAddingColumn(false)}
                          variant="ghost"
                          size="sm"
                          className="text-muted-foreground hover:text-foreground hover:bg-muted"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : null}
                </div>

                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>

      <ChatTaskManager
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
      />
    </div>
  );
}
