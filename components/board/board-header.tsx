"use client";

import { useState, useEffect } from "react";

import { useRouter } from "next/navigation";

import {
  Plus,
  Bot,
  ChevronDown,
  Trash2,
  AlertTriangle,
  Palette,
  X,
} from "lucide-react";

import TagManager from "@/components/tag-manager";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useActions, useBoard, useBoards } from "@/lib/store";

interface BoardHeaderProps {
  onOpenChatAction: () => void;
  userId: string;
}

export default function BoardHeader({ onOpenChatAction }: BoardHeaderProps) {
  const [newColumnTitle, setNewColumnTitle] = useState("");
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [newBoardTitle, setNewBoardTitle] = useState("");
  const [isAddingBoard, setIsAddingBoard] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isTagManagerOpen, setIsTagManagerOpen] = useState(false);

  const { addColumn, addBoard, deleteBoard, fetchTags } = useActions();
  const currentBoard = useBoard();
  const boards = useBoards();
  const router = useRouter();

  useEffect(() => {
    if (currentBoard) {
      fetchTags(currentBoard.id);
    }
  }, [currentBoard, fetchTags]);

  const handleAddColumn = () => {
    if (newColumnTitle.trim()) {
      addColumn(newColumnTitle.trim());
      setNewColumnTitle("");
      setIsAddingColumn(false);
    }
  };

  const handleAddBoard = async () => {
    if (newBoardTitle.trim()) {
      const boardId = await addBoard(newBoardTitle.trim());
      if (boardId) {
        router.push(`/board/${boardId}`);
      }
      setNewBoardTitle("");
      setIsAddingBoard(false);
    }
  };

  const handleDeleteBoard = async () => {
    if (!currentBoard || deleteConfirmText !== currentBoard.title) return;

    setIsDeleting(true);
    const success = await deleteBoard(currentBoard.id);

    if (success) {
      // Navigate to home page or first available board
      const remainingBoards = boards.filter(
        (board) => board.id !== currentBoard.id
      );
      if (remainingBoards.length > 0) {
        router.push(`/board/${remainingBoards[0].id}`);
      } else {
        router.push("/");
      }
    }

    setIsDeleting(false);
    setIsDeleteConfirmOpen(false);
    setDeleteConfirmText("");
  };

  const handleBoardSelect = (boardId: string) => {
    router.push(`/board/${boardId}`);
  };

  const handleDeleteClick = () => {
    setIsDeleteConfirmOpen(true);
    setDeleteConfirmText("");
  };

  const handleDeleteCancel = () => {
    setIsDeleteConfirmOpen(false);
    setDeleteConfirmText("");
  };

  const isDeleteEnabled = deleteConfirmText === currentBoard?.title;

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
            {currentBoard && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleDeleteClick}
                  className="text-destructive focus:text-destructive focus:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Board
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          onClick={() => setIsAddingColumn(true)}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
          disabled={!currentBoard}
        >
          <Plus className="h-4 w-4" />
          Add Column
        </Button>

        <Button
          onClick={() => setIsTagManagerOpen(true)}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
          disabled={!currentBoard}
        >
          <Palette className="h-4 w-4" />
          Tags
        </Button>

        <Button
          onClick={onOpenChatAction}
          className="bg-primary text-primary-foreground hover:bg-primary/90 border-0"
        >
          <Bot className="h-4 w-4 mr-2" />
          AI Assistant
        </Button>
      </div>

      {/* Add Column Modal */}
      {isAddingColumn && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-lg p-6 w-96 shadow-lg">
            <h3 className="text-lg font-semibold mb-4 text-card-foreground">
              Add New Column
            </h3>
            <Input
              value={newColumnTitle}
              onChange={(e) => setNewColumnTitle(e.target.value)}
              placeholder="Enter column title..."
              className="mb-4 bg-input border-border text-foreground placeholder:text-muted-foreground"
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

      {/* Add Board Modal */}
      {isAddingBoard && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-lg p-6 w-96 shadow-lg">
            <h3 className="text-lg font-semibold mb-4 text-card-foreground">
              Create New Board
            </h3>
            <Input
              value={newBoardTitle}
              onChange={(e) => setNewBoardTitle(e.target.value)}
              placeholder="Enter board title..."
              className="mb-4 bg-input border-border text-foreground placeholder:text-muted-foreground"
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
                disabled={!newBoardTitle.trim()}
              >
                Create Board
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Board Confirmation Modal */}
      {isDeleteConfirmOpen && currentBoard && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-card border border-destructive/20 rounded-lg p-6 w-[480px] shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-shrink-0 w-10 h-10 bg-destructive/10 rounded-full flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-card-foreground">
                  Delete Board
                </h3>
                <p className="text-sm text-muted-foreground">
                  This action cannot be undone
                </p>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-sm text-muted-foreground mb-4">
                You are about to permanently delete the board{" "}
                <strong className="text-foreground">
                  &quot;{currentBoard.title}&quot;
                </strong>{" "}
                and all of its columns and cards.
              </p>

              <div className="bg-destructive/5 border border-destructive/20 rounded-md p-3 mb-4">
                <p className="text-sm text-destructive font-medium mb-2">
                  This will permanently delete:
                </p>
                <ul className="text-sm text-destructive/80 space-y-1">
                  <li>• The board and all its settings</li>
                  <li>• All columns in this board</li>
                  <li>• All cards and their content</li>
                  <li>• All associated data</li>
                </ul>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Type the board name{" "}
                  <strong>&quot;{currentBoard.title}&quot;</strong> to confirm:
                </label>
                <Input
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder={currentBoard.title}
                  className="bg-input border-border text-foreground placeholder:text-muted-foreground"
                  autoFocus
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <Button
                onClick={handleDeleteCancel}
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground hover:bg-muted"
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeleteBoard}
                size="sm"
                variant="destructive"
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={!isDeleteEnabled || isDeleting}
              >
                {isDeleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-destructive-foreground/30 border-t-destructive-foreground rounded-full animate-spin mr-2" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Board
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Tag Manager Modal */}
      {isTagManagerOpen && currentBoard && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-lg p-6 w-[600px] max-h-[80vh] overflow-y-auto shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-card-foreground">
                Manage Tags
              </h3>
              <Button
                onClick={() => setIsTagManagerOpen(false)}
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <TagManager boardId={currentBoard.id} />
          </div>
        </div>
      )}
    </div>
  );
}
