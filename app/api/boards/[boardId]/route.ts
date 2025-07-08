import { NextResponse } from "next/server";

import { withAuth } from "@/lib/auth-utils";
import { createSupabaseClient } from "@/lib/supabase";
import type { GetBoardResponse, ApiError } from "@/types/api";

// Types for joined query result
interface TaskTagJoin {
  tags: {
    id: string;
    name: string;
    color: string;
    created_at: string;
    updated_at: string;
  };
}

interface TaskWithTags {
  id: string;
  title: string;
  description?: string;
  position: number;
  created_at: string;
  updated_at: string;
  task_tags: TaskTagJoin[];
}

interface ColumnWithTasksAndTags {
  id: string;
  title: string;
  position: number;
  created_at: string;
  updated_at: string;
  tasks: TaskWithTags[];
}

// GET /api/boards/[boardId] - Get a specific board with its columns and tasks
export const GET = withAuth(async ({ context }) => {
  try {
    const params = await context?.params;
    const boardId = params?.boardId;
    if (!boardId) {
      return NextResponse.json<ApiError>(
        { error: "Board ID is required" },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseClient();

    // Fetch the board
    const { data: boardData, error: boardError } = await supabase
      .from("boards")
      .select("*")
      .eq("id", boardId)
      .single();

    if (boardError) {
      return NextResponse.json<ApiError>(
        { error: boardError.message },
        { status: 500 }
      );
    }

    // Fetch columns for this board, ordered by position
    const { data: columnsData, error: columnsError } = await supabase
      .from("columns")
      .select(
        `
        id,
        title,
        position,
        created_at,
        updated_at,
        tasks (
          id,
          title,
          description,
          position,
          created_at,
          updated_at,
          task_tags (
            tags (
              id,
              name,
              color,
              created_at,
              updated_at
            )
          )
        )
      `
      )
      .eq("board_id", boardId)
      .order("position", { ascending: true });

    if (columnsError) {
      return NextResponse.json<ApiError>(
        { error: columnsError.message },
        { status: 500 }
      );
    }

    const typedColumnsData = columnsData as unknown as ColumnWithTasksAndTags[];

    // Transform data to match our app's structure
    const columns = typedColumnsData.map((col) => ({
      id: col.id,
      title: col.title,
      tasks: (col.tasks || [])
        .sort((a, b) => a.position - b.position)
        .map((task) => ({
          id: task.id,
          title: task.title,
          description: task.description || "",
          assignee: "You", // Default assignee
          createdAt: task.created_at,
          updatedAt: task.updated_at,
          tags: (task.task_tags || []).map((ct) => ({
            id: ct.tags.id,
            boardId: boardId,
            name: ct.tags.name,
            color: ct.tags.color,
            createdAt: ct.tags.created_at,
            updatedAt: ct.tags.updated_at,
          })),
        })),
      createdAt: col.created_at,
      updatedAt: col.updated_at,
    }));

    const board = {
      id: boardData.id,
      title: boardData.title,
      createdAt: boardData.created_at,
      updatedAt: boardData.updated_at,
    };

    return NextResponse.json<GetBoardResponse>({ board, columns });
  } catch (error: unknown) {
    console.error("Error fetching board:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    return NextResponse.json<ApiError>(
      { error: errorMessage },
      { status: 500 }
    );
  }
});

// DELETE /api/boards/[boardId] - Delete a specific board
export const DELETE = withAuth(
  async ({ context }): Promise<NextResponse<{ success: true } | ApiError>> => {
    try {
      const params = await context?.params;
      const boardId = params?.boardId;
      if (!boardId) {
        return NextResponse.json<ApiError>(
          { error: "Board ID is required" },
          { status: 400 }
        );
      }

      const supabase = await createSupabaseClient();

      // Delete the board (this will cascade delete columns and tasks due to foreign key constraints)
      const { error: deleteError } = await supabase
        .from("boards")
        .delete()
        .eq("id", boardId);

      if (deleteError) {
        return NextResponse.json<ApiError>(
          { error: deleteError.message },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true });
    } catch (error: unknown) {
      console.error("Error deleting board:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      return NextResponse.json<ApiError>(
        { error: errorMessage },
        { status: 500 }
      );
    }
  }
);
