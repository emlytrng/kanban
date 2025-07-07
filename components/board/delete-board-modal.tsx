"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { Trash2, AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useBoard, useBoards, useKanbanActions } from "@/lib/store";

interface DeleteBoardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DeleteBoardModal({
  isOpen,
  onClose,
}: DeleteBoardModalProps) {
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const { deleteBoard } = useKanbanActions();
  const currentBoard = useBoard();
  const boards = useBoards();
  const router = useRouter();

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
    onClose();
    setDeleteConfirmText("");
  };

  const handleClose = () => {
    onClose();
    setDeleteConfirmText("");
  };

  const isDeleteEnabled = deleteConfirmText === currentBoard?.title;

  if (!isOpen || !currentBoard) return null;

  return (
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
            onClick={handleClose}
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
  );
}
