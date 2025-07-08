"use client";

import { useState } from "react";

import { Droppable, Draggable } from "@hello-pangea/dnd";
import { Plus, MoreHorizontal, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useKanbanActions } from "@/lib/store";
import type { Column } from "@/types";

import TaskCard from "./task-card";

interface ColumnProps {
  column: Column;
  index: number;
}

function Column({ column, index }: ColumnProps) {
  const { addCard, deleteColumn } = useKanbanActions();
  const [newCardTitle, setNewCardTitle] = useState("");
  const [isAddingCard, setIsAddingCard] = useState(false);

  const handleAddCard = async () => {
    if (newCardTitle.trim()) {
      await addCard(column.id, newCardTitle.trim());
      setNewCardTitle("");
      setIsAddingCard(false);
    }
  };

  const handleDeleteColumn = () => {
    deleteColumn(column.id);
  };

  return (
    <Draggable draggableId={column.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={`shrink-0 w-80 bg-muted/30 border border-border rounded-lg p-4 transition-colors duration-200 flex flex-col ${
            snapshot.isDragging
              ? "shadow-lg ring-2 ring-ring rotate-1"
              : "shadow-sm"
          }`}
        >
          <div
            {...provided.dragHandleProps}
            className="flex items-center justify-between mb-4 cursor-grab active:cursor-grabbing"
          >
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-sm text-foreground">
                {column.title}
              </h3>
              <span className="text-xs text-muted-foreground bg-background px-2 py-1 rounded-full border border-border">
                {column.cards.length}
              </span>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="bg-popover border-border"
              >
                <DropdownMenuItem
                  onClick={handleDeleteColumn}
                  className="text-destructive focus:text-destructive hover:bg-accent focus:bg-accent"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Column
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex flex-col flex-1">
            <Droppable droppableId={column.id} type="card">
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`flex-1 min-h-[200px] transition-colors duration-200 rounded-md ${
                    snapshot.isDraggingOver
                      ? "bg-muted/50 border border-dashed border-border"
                      : ""
                  }`}
                >
                  {column.cards.map((card, cardIndex) => (
                    <TaskCard
                      key={card.id}
                      card={card}
                      index={cardIndex}
                      columnId={column.id}
                    />
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>

            {isAddingCard ? (
              <div className="mt-3">
                <Input
                  value={newCardTitle}
                  onChange={(e) => setNewCardTitle(e.target.value)}
                  placeholder="Enter task title..."
                  className="mb-2 bg-background border-input text-foreground placeholder:text-muted-foreground focus-visible:ring-ring"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAddCard();
                    if (e.key === "Escape") setIsAddingCard(false);
                  }}
                />
                <div className="flex gap-2">
                  <Button
                    onClick={handleAddCard}
                    size="sm"
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    Add Card
                  </Button>
                  <Button
                    onClick={() => setIsAddingCard(false)}
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-card-foreground hover:bg-accent"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                onClick={() => setIsAddingCard(true)}
                variant="ghost"
                size="sm"
                className="w-full mt-3 justify-start text-muted-foreground hover:text-foreground hover:bg-muted border border-dashed border-border hover:border-muted-foreground/50 transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Task
              </Button>
            )}
          </div>
        </div>
      )}
    </Draggable>
  );
}

export default Column;
