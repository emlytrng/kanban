"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { Loader2, Plus } from "lucide-react";

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

export default function AddBoardModal() {
  const [title, setTitle] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [open, setOpen] = useState(false);
  const { addBoard } = useKanbanActions();
  const router = useRouter();

  const handleAddBoard = async () => {
    if (!title.trim()) return;

    setIsCreating(true);
    const boardId = await addBoard(title.trim());
    setIsCreating(false);

    if (boardId) {
      setOpen(false);
      router.push(`/board/${boardId}`);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!isCreating) {
      setOpen(newOpen);
      if (!newOpen) {
        setTitle("New Board");
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="h-5 w-5" />
          New board
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create a new board</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Input
            id="board-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter board title..."
            disabled={isCreating}
            className="col-span-3"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !isCreating) {
                handleAddBoard();
              }
            }}
            autoFocus
          />
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isCreating}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleAddBoard}
            disabled={isCreating || !title.trim()}
          >
            {isCreating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Create board"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
