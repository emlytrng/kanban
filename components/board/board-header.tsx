"use client";

import { useState, useEffect } from "react";

import { Bot, Palette, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useBoard, useTagActions } from "@/lib/store";

import TagManagerModal from "../tags/tag-manager-modal";

import AddBoardModal from "./add-board-modal";
import AddColumnModal from "./add-column-modal";
import BoardSelector from "./board-selector";
import DeleteBoardModal from "./delete-board-modal";

interface BoardHeaderProps {
  onToggleChatAction: () => void;
}

export default function BoardHeader({ onToggleChatAction }: BoardHeaderProps) {
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
        <BoardSelector />

        <AddBoardModal />

        <AddColumnModal disabled={!currentBoard} />

        <Button
          onClick={handleTagManagerOpen}
          variant="outline"
          disabled={!currentBoard}
        >
          <Palette className="h-4 w-4" />
          Tags
        </Button>

        <div className="flex items-center gap-2">
          <Button
            onClick={handleDeleteClick}
            variant="outline"
            disabled={!currentBoard}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        <Button onClick={onToggleChatAction}>
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
        />
      )}
    </div>
  );
}
