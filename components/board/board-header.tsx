"use client";

import { useState } from "react";
import { Plus, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useActions } from "@/lib/store";

interface BoardHeaderProps {
  onOpenChat: () => void;
}

export default function BoardHeader({ onOpenChat }: BoardHeaderProps) {
  const [newColumnTitle, setNewColumnTitle] = useState("");
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const { addColumn } = useActions();

  const handleAddColumn = () => {
    if (newColumnTitle.trim()) {
      addColumn(newColumnTitle.trim());
      setNewColumnTitle("");
      setIsAddingColumn(false);
    }
  };

  return (
    <div className="flex items-center justify-between p-6">
      <div className="flex items-center gap-3">
        <Button
          onClick={() => setIsAddingColumn(true)}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Column
        </Button>
        <Button
          onClick={onOpenChat}
          className="bg-primary text-primary-foreground hover:bg-primary/90 border-0"
        >
          <Bot className="h-4 w-4 mr-2" />
          AI Assistant
        </Button>
      </div>

      {isAddingColumn && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-md p-4 w-96">
            <h3 className="text-lg font-semibold mb-3 text-card-foreground">
              Add New Column
            </h3>
            <Input
              value={newColumnTitle}
              onChange={(e) => setNewColumnTitle(e.target.value)}
              placeholder="Enter column title..."
              className="mb-3 bg-input border-border text-foreground placeholder:text-muted-foreground"
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
              >
                Add Column
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
