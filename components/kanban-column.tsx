"use client";

import { useState } from "react";
import { Draggable, Droppable } from "@hello-pangea/dnd";
import { MoreHorizontal, Plus } from "lucide-react";
import { useActions } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Card, Column } from "@/types";
import KanbanCard from "./kanban-card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface KanbanColumnProps {
  column: Column;
  index: number;
}

export default function KanbanColumn({ column, index }: KanbanColumnProps) {
  const { addCard, deleteColumn } = useActions();
  const [newCardTitle, setNewCardTitle] = useState("");
  const [isAddingCard, setIsAddingCard] = useState(false);

  const handleAddCard = () => {
    if (newCardTitle.trim()) {
      addCard(column.id, newCardTitle.trim());
      setNewCardTitle("");
      setIsAddingCard(false);
    }
  };

  const handleDeleteColumn = () => {
    if (
      confirm("Are you sure you want to delete this column and all its cards?")
    ) {
      deleteColumn(column.id);
    }
  };

  return (
    <Draggable draggableId={column.id} index={index}>
      {(provided) => (
        <div
          {...provided.draggableProps}
          ref={provided.innerRef}
          className="shrink-0 w-80 bg-card rounded-md border shadow-sm kanban-column-transition"
        >
          <div
            {...provided.dragHandleProps}
            className="p-3 font-medium flex items-center justify-between rounded-t-md border-b"
          >
            <h3 className="font-medium">{column.title}</h3>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={handleDeleteColumn}
                  className="text-destructive focus:text-destructive"
                >
                  Delete Column
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <Droppable droppableId={column.id} type="card">
            {(provided, snapshot) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className={`p-2 min-h-[200px] max-h-[calc(100vh-220px)] overflow-y-auto kanban-scrollbar ${
                  snapshot.isDraggingOver ? "bg-muted/50" : ""
                }`}
                style={{ transition: "background-color 0.2s ease" }}
              >
                {column.cards.map((card: Card, index: number) => (
                  <KanbanCard
                    key={card.id}
                    card={card}
                    index={index}
                    columnId={column.id}
                  />
                ))}
                {provided.placeholder}

                {isAddingCard ? (
                  <div className="p-2 bg-card rounded-md mt-2 border">
                    <Input
                      value={newCardTitle}
                      onChange={(e) => setNewCardTitle(e.target.value)}
                      placeholder="Enter card title..."
                      className="mb-2"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleAddCard();
                        if (e.key === "Escape") setIsAddingCard(false);
                      }}
                    />
                    <div className="flex gap-2">
                      <Button onClick={handleAddCard} size="sm">
                        Add Card
                      </Button>
                      <Button
                        onClick={() => setIsAddingCard(false)}
                        variant="ghost"
                        size="sm"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    onClick={() => setIsAddingCard(true)}
                    variant="ghost"
                    className="w-full justify-center text-muted-foreground hover:text-foreground mt-2"
                    size="sm"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Task
                  </Button>
                )}
              </div>
            )}
          </Droppable>
        </div>
      )}
    </Draggable>
  );
}
