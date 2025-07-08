"use client";

import { useEffect, useState } from "react";

import { AlertCircle, Loader2 } from "lucide-react";

import {
  useBoard,
  useIsKanbanLoading,
  useError,
  useKanbanActions,
  useTagActions,
} from "@/lib/store";

import ChatTaskManager from "../chat/chat-task-manager";

import BoardContent from "./board-content";
import BoardHeader from "./board-header";

type BoardProps = {
  boardId: string;
};

export default function Board({ boardId }: BoardProps) {
  const board = useBoard();
  const isLoading = useIsKanbanLoading();
  const error = useError();
  const { fetchBoard, fetchUserBoards } = useKanbanActions();
  const { fetchTags } = useTagActions();

  const [isChatOpen, setIsChatOpen] = useState(false);

  useEffect(() => {
    async function fetchBoardData() {
      await fetchUserBoards();
      await fetchBoard(boardId);
    }

    fetchBoardData();
  }, [fetchBoard, fetchUserBoards, boardId]);

  useEffect(() => {
    if (board) {
      fetchTags(board.id);
    }
  }, [board, fetchTags]);

  const handleToggleChat = () => {
    setIsChatOpen(!isChatOpen);
  };

  const handleCloseChat = () => {
    setIsChatOpen(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <AlertCircle className="text-destructive" />
        <h2>Oops! Something went wrong.</h2>
        <p className="text-sm text-muted-foreground">{error}</p>
      </div>
    );
  }

  if (!board) {
    return null;
  }

  return (
    <div className="h-screen bg-background text-foreground">
      <BoardHeader onToggleChatAction={handleToggleChat} />
      <BoardContent />
      <ChatTaskManager isOpen={isChatOpen} onCloseAction={handleCloseChat} />
    </div>
  );
}
