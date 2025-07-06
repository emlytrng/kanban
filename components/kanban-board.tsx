"use client";

import { useEffect, useState } from "react";

import { Loader2 } from "lucide-react";

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
      await fetchUserBoards(userId);
      await fetchBoard(userId, boardId);
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
      <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-md text-destructive mb-6">
        <h3 className="font-bold">Error loading board</h3>
        <p>{error}</p>
      </div>
    );
  }

  if (!board) {
    return null;
  }

  return (
    <div className="h-screen bg-background text-foreground">
      <BoardHeader onOpenChat={() => setIsChatOpen(true)} userId={userId} />
      <BoardContent />
      <ChatTaskManager
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
      />
    </div>
  );
}
