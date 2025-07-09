"use client";

import { useState } from "react";

import { Draggable } from "@hello-pangea/dnd";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";

import TaskTagSelector from "@/components/board/task-tag-selector";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { useKanbanActions } from "@/lib/store";
import type { Task } from "@/types";

interface TaskCardProps {
  task: Task;
  index: number;
  columnId: string;
}

export default function TaskCard({ task, index, columnId }: TaskCardProps) {
  const { updateTask, deleteTask } = useKanbanActions();
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(task.title);
  const [editedDescription, setEditedDescription] = useState(
    task.description || ""
  );

  const handleSaveEdit = () => {
    if (editedTitle.trim()) {
      updateTask(
        task.id,
        {
          title: editedTitle.trim(),
          description: editedDescription.trim(),
        },
        columnId
      );

      setIsEditing(false);
    }
  };

  const handleDeleteTask = () => {
    deleteTask(columnId, task.id);
  };

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className="p-3 mb-3 bg-card border border-border rounded-lg transition-shadow duration-200"
        >
          {isEditing ? (
            <div className="space-y-3">
              <Textarea
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                placeholder="Enter task title"
                className="resize-none bg-input border-border text-card-foreground placeholder:text-muted-foreground focus-visible:ring-ring"
                autoFocus
              />
              <Textarea
                value={editedDescription}
                onChange={(e) => setEditedDescription(e.target.value)}
                placeholder="Enter task description (optional)"
                className="resize-none text-sm bg-input border-border text-card-foreground placeholder:text-muted-foreground focus-visible:ring-ring"
                rows={3}
              />
              <TaskTagSelector
                taskId={task.id}
                selectedTags={task.tags || []}
              />
              <div className="flex gap-2">
                <Button onClick={handleSaveEdit} size="sm">
                  Save
                </Button>
                <Button
                  onClick={() => {
                    setIsEditing(false);
                    setEditedTitle(task.title);
                    setEditedDescription(task.description || "");
                  }}
                  variant="outline"
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="p-1">
              <div className="flex justify-between items-start mb-2 gap-2">
                <h4 className="font-medium text-card-foreground leading-tight">
                  {task.title}
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
                        <Pencil className="h-4 w-4" />
                        Edit task
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={handleDeleteTask}
                        className="text-destructive focus:text-destructive hover:bg-accent focus:bg-accent"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete task
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>

              {task.description && (
                <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
                  {task.description}
                </p>
              )}

              {task.tags && task.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {task.tags.map((tag) => (
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
