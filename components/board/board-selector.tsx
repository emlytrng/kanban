"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { ChevronDown, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useBoard, useBoards, useKanbanActions } from "@/lib/store";

interface BoardSelectorProps {
  onDeleteBoard: () => void;
}

export default function BoardSelector({ onDeleteBoard }: BoardSelectorProps) {
  const [newBoardTitle, setNewBoardTitle] = useState("");
  const [isAddingBoard, setIsAddingBoard] = useState(false);
  const [isCreatingBoard, setIsCreatingBoard] = useState(false);

  const { addBoard } = useKanbanActions();
  const currentBoard = useBoard();
  const boards = useBoards();
  const router = useRouter();

  const handleAddBoard = async () => {
    if (newBoardTitle.trim()) {
      setIsCreatingBoard(true);
      const boardId = await addBoard(newBoardTitle.trim());
      if (boardId) {
        router.push(`/board/${boardId}`);
        setNewBoardTitle("");
        setIsAddingBoard(false);
      }
      setIsCreatingBoard(false);
    }
  };

  const handleBoardSelect = (boardId: string) => {
    router.push(`/board/${boardId}`);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2 min-w-[200px] justify-between bg-background border-input hover:bg-muted"
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
          {currentBoard && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={onDeleteBoard}
                className="text-destructive focus:text-destructive focus:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Board
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {isAddingBoard && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background border border-border rounded-lg p-6 w-96 shadow-lg">
            <h3 className="text-lg font-semibold mb-4 text-foreground">
              Create New Board
            </h3>
            <Input
              value={newBoardTitle}
              onChange={(e) => setNewBoardTitle(e.target.value)}
              placeholder="Enter board title..."
              className="mb-4 bg-background border-input text-foreground placeholder:text-muted-foreground"
              autoFocus
              disabled={isCreatingBoard}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !isCreatingBoard) handleAddBoard();
                if (e.key === "Escape" && !isCreatingBoard)
                  setIsAddingBoard(false);
              }}
            />
            <div className="flex gap-2 justify-end">
              <Button
                onClick={() => setIsAddingBoard(false)}
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground hover:bg-muted"
                disabled={isCreatingBoard}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddBoard}
                size="sm"
                className="bg-primary text-primary-foreground hover:bg-primary/90"
                disabled={!newBoardTitle.trim() || isCreatingBoard}
              >
                {isCreatingBoard ? (
                  <>
                    <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-2" />
                    Creating...
                  </>
                ) : (
                  "Create Board"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
