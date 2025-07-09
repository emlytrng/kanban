"use client";

import type React from "react";
import { useState } from "react";

import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useKanbanActions } from "@/lib/store";

interface AddColumnModalProps {
  disabled?: boolean;
}

export default function AddColumnModal({ disabled }: AddColumnModalProps) {
  const [newColumnTitle, setNewColumnTitle] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { addColumn } = useKanbanActions();

  const handleAddColumn = async () => {
    if (!newColumnTitle.trim()) return;

    setIsLoading(true);
    try {
      await addColumn(newColumnTitle.trim());
      setNewColumnTitle("");
      setIsOpen(false);
    } catch (error) {
      console.error("Failed to add column:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!isLoading) {
      setIsOpen(open);
      if (!open) {
        setNewColumnTitle("");
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isLoading) {
      e.preventDefault();
      handleAddColumn();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" disabled={disabled}>
          <Plus className="h-4 w-4" />
          New column
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add a new column</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Input
              id="column-title"
              value={newColumnTitle}
              onChange={(e) => setNewColumnTitle(e.target.value)}
              placeholder="Enter column title..."
              className="bg-background border-input text-foreground placeholder:text-muted-foreground"
              autoFocus
              onKeyDown={handleKeyDown}
              disabled={isLoading}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleAddColumn}
            disabled={!newColumnTitle.trim() || isLoading}
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                Adding...
              </>
            ) : (
              <>New column</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
