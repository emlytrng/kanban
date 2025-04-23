"use client"

import { useState } from "react"
import { Draggable } from "@hello-pangea/dnd"
import { Clock, MoreHorizontal, Pencil, Trash2, User } from "lucide-react"
import { useKanbanStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import type { Card } from "@/types"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Textarea } from "@/components/ui/textarea"
import { formatDistanceToNow } from "date-fns"

interface KanbanCardProps {
  card: Card
  index: number
  columnId: string
}

export default function KanbanCard({ card, index, columnId }: KanbanCardProps) {
  const { updateCard, deleteCard } = useKanbanStore()
  const [isEditing, setIsEditing] = useState(false)
  const [editedTitle, setEditedTitle] = useState(card.title)
  const [editedDescription, setEditedDescription] = useState(card.description || "")

  const handleSaveEdit = () => {
    if (editedTitle.trim()) {
      updateCard(columnId, card.id, {
        title: editedTitle.trim(),
        description: editedDescription.trim(),
      })
      setIsEditing(false)
    }
  }

  const handleDeleteCard = () => {
    deleteCard(columnId, card.id)
  }

  const updatedAt = card.updatedAt ? new Date(card.updatedAt) : new Date()
  const timeAgo = formatDistanceToNow(updatedAt, { addSuffix: true })

  return (
    <Draggable draggableId={card.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`p-3 mb-2 bg-slate-800 rounded shadow-sm ${snapshot.isDragging ? "shadow-lg opacity-90" : ""}`}
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
                    setIsEditing(false)
                    setEditedTitle(card.title)
                    setEditedDescription(card.description || "")
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
                <h4 className="text-white font-medium">{card.title}</h4>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setIsEditing(true)}>
                      <Pencil className="h-4 w-4 mr-2" />
                      Edit Card
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleDeleteCard} className="text-red-500">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Card
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {card.description && <p className="text-sm text-slate-300 mt-2 mb-3">{card.description}</p>}

              <div className="flex items-center justify-between mt-2 text-xs text-slate-400">
                <div className="flex items-center">
                  <User className="h-3 w-3 mr-1" />
                  <span>{card.assignee || "Unassigned"}</span>
                </div>
                <div className="flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  <span>{timeAgo}</span>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </Draggable>
  )
}
