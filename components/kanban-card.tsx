"use client";

import { useState, memo } from "react";
import { Draggable } from "@hello-pangea/dnd";
import { MoreHorizontal, Pencil, Trash2, Calendar } from "lucide-react";
import { useActions } from "@/lib/store";
import { Button } from "@/components/ui/button";
import type { Card } from "@/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";

interface KanbanCardProps {
  card: Card;
  index: number;
  columnId: string;
}

function KanbanCard({ card, index, columnId }: KanbanCardProps) {
  const { updateCard, deleteCard } = useActions();
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(card.title);
  const [editedDescription, setEditedDescription] = useState(
    card.description || ""
  );

  const handleSaveEdit = () => {
    if (editedTitle.trim()) {
      updateCard(columnId, card.id, {
        title: editedTitle.trim(),
        description: editedDescription.trim(),
      });
      setIsEditing(false);
    }
  };

  const handleDeleteCard = () => {
    deleteCard(columnId, card.id);
  };

  // Generate random labels for demo purposes
  const getRandomLabels = () => {
    const labels = [
      "bug",
      "feature",
      "enhancement",
      "documentation",
      "priority",
    ];
    const randomIndex = Math.floor(Math.random() * labels.length);
    return [labels[randomIndex]];
  };

  const cardLabels = card.labels || getRandomLabels();

  // Generate random due date for demo purposes
  const getDueDate = () => {
    const today = new Date();
    const randomDays = Math.floor(Math.random() * 30) - 10; // -10 to +20 days from today
    const dueDate = new Date(today);
    dueDate.setDate(today.getDate() + randomDays);
    return dueDate;
  };

  const dueDate = getDueDate();
  const formattedDate = `May ${Math.floor(Math.random() * 30) + 1}`;
  const isPastDue = dueDate < new Date();

  return (
    <Draggable draggableId={card.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`p-3 mb-2 bg-card rounded-md border shadow-sm transition-shadow duration-200 ${
            snapshot.isDragging
              ? "shadow-lg ring-2 ring-primary/20 rotate-2 z-50"
              : "hover:shadow-md"
          }`}
          style={{
            ...provided.draggableProps.style,
            transform: snapshot.isDragging
              ? `${provided.draggableProps.style?.transform} rotate(2deg)`
              : provided.draggableProps.style?.transform,
          }}
        >
          {isEditing ? (
            <div className="space-y-2">
              <Textarea
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                placeholder="Card title"
                className="resize-none"
                autoFocus
              />
              <Textarea
                value={editedDescription}
                onChange={(e) => setEditedDescription(e.target.value)}
                placeholder="Description (optional)"
                className="resize-none text-sm"
                rows={3}
              />
              <div className="flex gap-2">
                <Button onClick={handleSaveEdit} size="sm">
                  Save
                </Button>
                <Button
                  onClick={() => {
                    setIsEditing(false);
                    setEditedTitle(card.title);
                    setEditedDescription(card.description || "");
                  }}
                  variant="ghost"
                  size="sm"
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-start">
                <h4 className="font-medium">{card.title}</h4>
                {!snapshot.isDragging && (
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
                      <DropdownMenuItem onClick={() => setIsEditing(true)}>
                        <Pencil className="h-4 w-4 mr-2" />
                        Edit Card
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={handleDeleteCard}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Card
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>

              {card.description && (
                <p className="text-sm text-muted-foreground mt-2 mb-3">
                  {card.description}
                </p>
              )}

              <div className="flex flex-wrap gap-1 mt-2 mb-2">
                {cardLabels.map((label, i) => (
                  <span key={i} className={`label label-${label}`}>
                    {label.charAt(0).toUpperCase() + label.slice(1)}
                  </span>
                ))}
              </div>

              <div className="flex items-center justify-end mt-2 text-xs text-muted-foreground">
                <div className="flex items-center">
                  <Calendar className="h-3 w-3 mr-1" />
                  <span className={isPastDue ? "text-destructive" : ""}>
                    {formattedDate}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </Draggable>
  );
}

export default memo(KanbanCard);
