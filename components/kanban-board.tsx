"use client";

import { useEffect, useState } from "react";

import { AlertCircle, Loader2 } from "lucide-react";

import { useActions, useBoard, useIsLoading, useError } from "@/lib/store";

import BoardContent from "./board/board-content";
import BoardHeader from "./board/board-header";
import ChatTaskManager from "./chat-task-manager";

type KanbanBoardProps = {
  userId: string;
  boardId: string;
};

export default function KanbanBoard({ userId, boardId }: KanbanBoardProps) {
  const board = useBoard();
  const isLoading = useIsLoading();
  const error = useError();
  const { fetchBoard, fetchUserBoards } = useActions();

  const [isChatOpen, setIsChatOpen] = useState(false);

  useEffect(() => {
    async function fetchBoardData() {
      await fetchUserBoards();
      await fetchBoard(boardId);
    }

    fetchBoardData();
  }, [fetchBoard, fetchUserBoards, userId, boardId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <AlertCircle className="text-destructive" />
        <h3 className="font-bold">Oops! Something went wrong.</h3>
      </div>
    );
  }

  if (!board) {
    return null;
  }

  return (
    <div className="h-screen bg-background text-foreground">
      <BoardHeader
        onOpenChatAction={() => setIsChatOpen(true)}
        userId={userId}
      />
      <BoardContent />
      <ChatTaskManager
        isOpen={isChatOpen}
        onCloseAction={() => setIsChatOpen(false)}
      />
    </div>
  );
}
