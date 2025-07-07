"use client";

import { useState, memo } from "react";

import { Draggable } from "@hello-pangea/dnd";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";

import CardTagSelector from "@/components/card-tag-selector";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { useKanbanActions } from "@/lib/store";
import type { Card } from "@/types";

interface KanbanCardProps {
  card: Card;
  index: number;
  columnId: string;
}

function KanbanCard({ card, index, columnId }: KanbanCardProps) {
  const { updateCard, deleteCard } = useKanbanActions();
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(card.title);
  const [editedDescription, setEditedDescription] = useState(
    card.description || ""
  );

  const handleSaveEdit = () => {
    if (editedTitle.trim()) {
      updateCard(
        card.id,
        {
          title: editedTitle.trim(),
          description: editedDescription.trim(),
        },
        columnId
      );
      setIsEditing(false);
    }
  };

  const handleDeleteCard = () => {
    deleteCard(columnId, card.id);
  };

  return (
    <Draggable draggableId={card.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`p-3 mb-3 bg-card border border-border rounded-lg transition-shadow duration-200 ${
            snapshot.isDragging
              ? "shadow-lg ring-2 ring-ring rotate-2 z-50 scale-105"
              : "hover:shadow-md hover:border-muted-foreground/30"
          }`}
          style={{
            ...provided.draggableProps.style,
            transform: snapshot.isDragging
              ? `${provided.draggableProps.style?.transform} rotate(2deg)`
              : provided.draggableProps.style?.transform,
          }}
        >
          {isEditing ? (
            <div className="space-y-3">
              <Textarea
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                placeholder="Card title"
                className="resize-none bg-input border-border text-card-foreground placeholder:text-muted-foreground focus-visible:ring-ring"
                autoFocus
              />
              <Textarea
                value={editedDescription}
                onChange={(e) => setEditedDescription(e.target.value)}
                placeholder="Description (optional)"
                className="resize-none text-sm bg-input border-border text-card-foreground placeholder:text-muted-foreground focus-visible:ring-ring"
                rows={3}
              />
              <CardTagSelector
                cardId={card.id}
                selectedTags={card.tags || []}
              />
              <div className="flex gap-2">
                <Button
                  onClick={handleSaveEdit}
                  size="sm"
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
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
                  className="text-muted-foreground hover:text-card-foreground hover:bg-accent"
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="p-1">
              <div className="flex justify-between items-start mb-2 gap-2">
                <h4 className="font-medium text-card-foreground leading-tight">
                  {card.title}
                </h4>
                {!snapshot.isDragging && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-card-foreground hover:bg-accent flex-shrink-0"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="bg-popover border-border"
                    >
                      <DropdownMenuItem
                        onClick={() => setIsEditing(true)}
                        className="hover:bg-accent focus:bg-accent text-popover-foreground"
                      >
                        <Pencil className="h-4 w-4 mr-2" />
                        Edit Card
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={handleDeleteCard}
                        className="text-destructive focus:text-destructive hover:bg-accent focus:bg-accent"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Card
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>

              {card.description && (
                <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
                  {card.description}
                </p>
              )}

              {card.tags && card.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {card.tags.map((tag) => (
                    <span
                      key={tag.id}
                      className="px-2 py-1 text-xs font-medium rounded-full text-white"
                      style={{ backgroundColor: tag.color }}
                    >
                      {tag.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </Draggable>
  );
}

export default memo(KanbanCard);
