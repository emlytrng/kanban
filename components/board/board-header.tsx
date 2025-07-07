"use client";

import { useState, useEffect } from "react";

import { Bot } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useBoard, useTagActions } from "@/lib/store";

import AddColumnModal from "./add-column-modal";
import BoardSelector from "./board-selector";
import DeleteBoardModal from "./delete-board-modal";
import TagManagerModal from "./tag-manager-modal";

interface BoardHeaderProps {
  onOpenChatAction: () => void;
  userId: string;
}

export default function BoardHeader({ onOpenChatAction }: BoardHeaderProps) {
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isTagManagerOpen, setIsTagManagerOpen] = useState(false);

  const { fetchTags } = useTagActions();
  const currentBoard = useBoard();

  useEffect(() => {
    if (currentBoard) {
      fetchTags(currentBoard.id);
    }
  }, [currentBoard, fetchTags]);

  const handleDeleteClick = () => {
    setIsDeleteConfirmOpen(true);
  };

  const handleDeleteClose = () => {
    setIsDeleteConfirmOpen(false);
  };

  const handleTagManagerOpen = () => {
    setIsTagManagerOpen(true);
  };

  const handleTagManagerClose = () => {
    setIsTagManagerOpen(false);
  };

  return (
    <div className="flex items-center justify-between p-6">
      <div className="flex items-center gap-3">
        <BoardSelector onDeleteBoard={handleDeleteClick} />

        <AddColumnModal disabled={!currentBoard} />

        <Button
          onClick={handleTagManagerOpen}
          variant="outline"
          size="sm"
          className="flex items-center gap-2 bg-transparent"
          disabled={!currentBoard}
        >
          <Bot className="h-4 w-4" />
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

      <DeleteBoardModal
        isOpen={isDeleteConfirmOpen}
        onClose={handleDeleteClose}
      />

      {currentBoard && (
        <TagManagerModal
          isOpen={isTagManagerOpen}
          onClose={handleTagManagerClose}
          boardId={currentBoard.id}
          disabled={!currentBoard}
        />
      )}
    </div>
  );
}
