"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useActions } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2 } from "lucide-react";

type AddBoardFormProps = {
  userId: string;
};

export default function AddBoardForm({ userId }: AddBoardFormProps) {
  const [title, setTitle] = useState("kanban");
  const [isCreating, setIsCreating] = useState(false);
  const { addBoard } = useActions();
  const router = useRouter();

  const handleAddBoard = async () => {
    if (!title.trim()) return;

    setIsCreating(true);
    const boardId = await addBoard(title.trim(), userId);
    setIsCreating(false);

    if (boardId) {
      router.push(`/board/${boardId}`);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl">Create a new board</CardTitle>
        <CardDescription>
          Get started by creating your first kanban board
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="board-title" className="text-sm font-medium">
              Board Title
            </label>
            <Input
              id="board-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter board title"
              disabled={isCreating}
            />
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button
          onClick={handleAddBoard}
          disabled={isCreating || !title.trim()}
          className="w-full"
        >
          {isCreating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : (
            "Create Board"
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
