"use client";

import { useRouter } from "next/navigation";

import { ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useBoard, useBoards } from "@/lib/store";

export default function BoardSelector() {
  const currentBoard = useBoard();
  const boards = useBoards();
  const router = useRouter();

  const handleBoardSelect = (boardId: string) => {
    router.push(`/board/${boardId}`);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="flex items-center gap-2 min-w-[200px] justify-between bg-background border-input hover:bg-muted"
          >
            <span className="truncate">
              {currentBoard?.title || "Select board"}
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
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
