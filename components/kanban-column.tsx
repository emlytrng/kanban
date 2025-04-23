"use client"

import { useState } from "react"
import { Draggable, Droppable } from "@hello-pangea/dnd"
import { MoreHorizontal, Plus, Trash2 } from "lucide-react"
import { useKanbanStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { Card, Column } from "@/types"
import KanbanCard from "./kanban-card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface KanbanColumnProps {
  column: Column
  index: number
}

export default function KanbanColumn({ column, index }: KanbanColumnProps) {
  const { addCard, deleteColumn } = useKanbanStore()
  const [newCardTitle, setNewCardTitle] = useState("")
  const [isAddingCard, setIsAddingCard] = useState(false)

  const handleAddCard = () => {
    if (newCardTitle.trim()) {
      addCard(column.id, newCardTitle.trim())
      setNewCardTitle("")
      setIsAddingCard(false)
    }
  }

  const handleDeleteColumn = () => {
    if (confirm("Are you sure you want to delete this column and all its cards?")) {
      deleteColumn(column.id)
    }
  }

  return (
    <Draggable draggableId={column.id} index={index}>
      {(provided) => (
        <div {...provided.draggableProps} ref={provided.innerRef} className="shrink-0 w-72 bg-slate-700 rounded-lg">
          <div {...provided.dragHandleProps} className="p-3 font-medium text-white flex items-center justify-between">
            <h3>{column.title}</h3>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">{column.cards.length}</span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleDeleteColumn} className="text-red-500">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Column
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <Droppable droppableId={column.id} type="card">
            {(provided, snapshot) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className={`p-2 min-h-[200px] ${snapshot.isDraggingOver ? "bg-slate-600/50" : ""}`}
              >
                {column.cards.map((card: Card, index: number) => (
                  <KanbanCard key={card.id} card={card} index={index} columnId={column.id} />
                ))}
                {provided.placeholder}

                {isAddingCard ? (
                  <div className="p-2 bg-slate-800 rounded mt-2">
                    <Input
                      value={newCardTitle}
                      onChange={(e) => setNewCardTitle(e.target.value)}
                      placeholder="Enter card title..."
                      className="mb-2"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleAddCard()
                        if (e.key === "Escape") setIsAddingCard(false)
                      }}
                    />
                    <div className="flex gap-2">
                      <Button onClick={handleAddCard} size="sm">
                        Add Card
                      </Button>
                      <Button onClick={() => setIsAddingCard(false)} variant="ghost" size="sm">
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    onClick={() => setIsAddingCard(true)}
                    variant="ghost"
                    className="w-full justify-start text-slate-400 hover:text-white mt-2"
                    size="sm"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Card
                  </Button>
                )}
              </div>
            )}
          </Droppable>
        </div>
      )}
    </Draggable>
  )
}
