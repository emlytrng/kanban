"use client";

import { useState } from "react";

import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useKanbanActions } from "@/lib/store";

interface AddColumnModalProps {
  disabled?: boolean;
}

export default function AddColumnModal({ disabled }: AddColumnModalProps) {
  const [newColumnTitle, setNewColumnTitle] = useState("");
  const [isAddingColumn, setIsAddingColumn] = useState(false);

  const { addColumn } = useKanbanActions();

  const handleAddColumn = async () => {
    if (newColumnTitle.trim()) {
      await addColumn(newColumnTitle.trim());
      setNewColumnTitle("");
      setIsAddingColumn(false);
    }
  };

  return (
    <>
      <Button
        onClick={() => setIsAddingColumn(true)}
        variant="outline"
        size="sm"
        className="flex items-center gap-2"
        disabled={disabled}
      >
        <Plus className="h-4 w-4" />
        Add Column
      </Button>

      {isAddingColumn && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background border border-border rounded-lg p-6 w-96 shadow-lg">
            <h3 className="text-lg font-semibold mb-4 text-foreground">
              Add New Column
            </h3>
            <Input
              value={newColumnTitle}
              onChange={(e) => setNewColumnTitle(e.target.value)}
              placeholder="Enter column title..."
              className="mb-4 bg-background border-input text-foreground placeholder:text-muted-foreground"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddColumn();
                if (e.key === "Escape") setIsAddingColumn(false);
              }}
            />
            <div className="flex gap-2 justify-end">
              <Button
                onClick={() => setIsAddingColumn(false)}
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddColumn}
                size="sm"
                className="bg-primary text-primary-foreground hover:bg-primary/90"
                disabled={!newColumnTitle.trim()}
              >
                Add Column
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
