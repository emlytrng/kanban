"use client";

import { useState } from "react";

import { Plus, Edit2, Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useTags,
  useIsTagsLoading,
  useTagError,
  useTagActions,
} from "@/lib/stores/tag-store";

interface TagManagerProps {
  boardId: string;
}

const TAG_COLORS = [
  "#EF4444", // Red
  "#F97316", // Orange
  "#EAB308", // Yellow
  "#22C55E", // Green
  "#06B6D4", // Cyan
  "#3B82F6", // Blue
  "#8B5CF6", // Purple
  "#EC4899", // Pink
  "#64748B", // Slate
  "#DC2626", // Dark Red
  "#EA580C", // Dark Orange
  "#CA8A04", // Dark Yellow
];

export default function TagManager({ boardId }: TagManagerProps) {
  const tags = useTags();
  const isLoading = useIsTagsLoading();
  const error = useTagError();
  const { createTag, updateTag, deleteTag, clearError } = useTagActions();

  const [isCreating, setIsCreating] = useState(false);
  const [editingTagId, setEditingTagId] = useState<string | null>(null);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState(TAG_COLORS[0]);
  const [editTagName, setEditTagName] = useState("");
  const [editTagColor, setEditTagColor] = useState("");
  const [isCreatingTag, setIsCreatingTag] = useState(false);

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;

    setIsCreatingTag(true);
    clearError();

    const success = await createTag(boardId, newTagName.trim(), newTagColor);

    setIsCreatingTag(false);

    if (success) {
      setNewTagName("");
      setNewTagColor(TAG_COLORS[0]);
      setIsCreating(false);
    }
  };

  const handleUpdateTag = async (tagId: string) => {
    if (!editTagName.trim()) return;

    clearError();

    const success = await updateTag(tagId, {
      name: editTagName.trim(),
      color: editTagColor,
    });

    if (success) {
      setEditingTagId(null);
      setEditTagName("");
      setEditTagColor("");
    }
  };

  const handleDeleteTag = async (tagId: string) => {
    if (
      confirm(
        "Are you sure you want to delete this tag? It will be removed from all cards."
      )
    ) {
      clearError();
      await deleteTag(tagId);
    }
  };

  const startEditing = (tag: { id: string; name: string; color: string }) => {
    setEditingTagId(tag.id);
    setEditTagName(tag.name);
    setEditTagColor(tag.color);
    clearError();
  };

  const cancelEditing = () => {
    setEditingTagId(null);
    setEditTagName("");
    setEditTagColor("");
    clearError();
  };

  const cancelCreating = () => {
    setIsCreating(false);
    setNewTagName("");
    setNewTagColor(TAG_COLORS[0]);
    clearError();
  };

  const handleStartCreating = () => {
    setIsCreating(true);
    clearError();
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex justify-end">
        <Button onClick={handleStartCreating} size="sm" disabled={isCreating}>
          <Plus className="h-4 w-4 mr-2" />
          Add Tag
        </Button>
      </div>

      {error && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md flex items-start justify-between">
          <p className="text-sm text-destructive flex-1">{error}</p>
          <Button
            onClick={clearError}
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-destructive hover:text-destructive/80 hover:bg-destructive/10 flex-shrink-0 ml-2"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {isCreating && (
        <div className="p-4 border border-border rounded-lg bg-card space-y-3">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Tag Name
            </label>
            <Input
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              placeholder="Enter tag name"
              autoFocus
              disabled={isCreatingTag}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Color</label>
            <div className="flex flex-wrap gap-2">
              {TAG_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => setNewTagColor(color)}
                  disabled={isCreatingTag}
                  className={`w-8 h-8 rounded-full border-2 transition-all disabled:opacity-50 ${
                    newTagColor === color
                      ? "border-foreground scale-110"
                      : "border-border hover:scale-105"
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleCreateTag}
              size="sm"
              disabled={isCreatingTag || !newTagName.trim()}
            >
              {isCreatingTag ? "Creating..." : "Create"}
            </Button>
            <Button
              onClick={cancelCreating}
              variant="ghost"
              size="sm"
              disabled={isCreatingTag}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {tags.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No tags created yet.</p>
            <p className="text-sm">
              Create your first tag to organize your cards.
            </p>
          </div>
        ) : (
          tags.map((tag) => (
            <div
              key={tag.id}
              className="flex items-center gap-3 p-3 border border-border rounded-lg bg-card"
            >
              {editingTagId === tag.id ? (
                // Edit mode
                <div className="flex-1 space-y-3">
                  <div className="space-y-2">
                    <Input
                      value={editTagName}
                      onChange={(e) => setEditTagName(e.target.value)}
                      autoFocus
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2">
                      {TAG_COLORS.map((color) => (
                        <button
                          key={color}
                          onClick={() => setEditTagColor(color)}
                          className={`w-6 h-6 rounded-full border-2 transition-all ${
                            editTagColor === color
                              ? "border-foreground scale-110"
                              : "border-border hover:scale-105"
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleUpdateTag(tag.id)}
                      size="sm"
                      disabled={!editTagName.trim()}
                    >
                      Save
                    </Button>
                    <Button onClick={cancelEditing} variant="ghost" size="sm">
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                // View mode
                <>
                  <div
                    className="w-4 h-4 rounded-full flex-shrink-0"
                    style={{ backgroundColor: tag.color }}
                  />
                  <span className="flex-1 min-w-0 text-foreground font-medium break-words">
                    {tag.name}
                  </span>
                  <div className="flex gap-1">
                    <Button
                      onClick={() => startEditing(tag)}
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted"
                      disabled={isLoading}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={() => handleDeleteTag(tag.id)}
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-muted"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
