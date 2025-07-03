"use client";

import { useState } from "react";
import { Plus, Bot, ChevronDown, Trash2, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useActions, useBoard, useBoards } from "@/lib/store";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface BoardHeaderProps {
  onOpenChat: () => void;
  userId: string;
}

export default function BoardHeader({ onOpenChat, userId }: BoardHeaderProps) {
  const [newColumnTitle, setNewColumnTitle] = useState("");
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [newBoardTitle, setNewBoardTitle] = useState("");
  const [isAddingBoard, setIsAddingBoard] = useState(false);

  const { addColumn, addBoard } = useActions();
  const currentBoard = useBoard();
  const boards = useBoards();
  const router = useRouter();

  const handleAddColumn = () => {
    if (newColumnTitle.trim()) {
      addColumn(newColumnTitle.trim());
      setNewColumnTitle("");
      setIsAddingColumn(false);
    }
  };

  const handleAddBoard = async () => {
    if (newBoardTitle.trim()) {
      const boardId = await addBoard(newBoardTitle.trim(), userId);
      if (boardId) {
        router.push(`/board/${boardId}`);
      }
      setNewBoardTitle("");
      setIsAddingBoard(false);
    }
  };

  const handleBoardSelect = (boardId: string) => {
    router.push(`/board/${boardId}`);
  };

  return (
    <div className="flex items-center justify-between p-6">
      <div className="flex items-center gap-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2 min-w-[200px] justify-between bg-transparent"
            >
              <span className="truncate">
                {currentBoard?.title || "Select Board"}
              </span>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-[200px]">
            {boards.map((board) => (
              <DropdownMenuItem
                key={board.id}
                onClick={() => handleBoardSelect(board.id)}
                className={
                  currentBoard?.id === board.id
                    ? "bg-accent text-accent-foreground"
                    : ""
                }
              >
                <span className="truncate">{board.title}</span>
              </DropdownMenuItem>
            ))}
            {boards.length > 0 && <DropdownMenuSeparator />}
            <DropdownMenuItem onClick={() => setIsAddingBoard(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Board
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
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
      {isAddingBoard && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-md p-4 w-96">
            <h3 className="text-lg font-semibold mb-3 text-card-foreground">
              Create New Board
            </h3>
            <Input
              value={newBoardTitle}
              onChange={(e) => setNewBoardTitle(e.target.value)}
              placeholder="Enter board title..."
              className="mb-3 bg-input border-border text-foreground placeholder:text-muted-foreground"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddBoard();
                if (e.key === "Escape") setIsAddingBoard(false);
              }}
            />
            <div className="flex gap-2 justify-end">
              <Button
                onClick={() => setIsAddingBoard(false)}
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddBoard}
                size="sm"
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Create Board
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
