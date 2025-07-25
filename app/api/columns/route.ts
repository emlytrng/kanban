import { NextResponse } from "next/server";

import { withAuth } from "@/lib/auth-utils";
import { createSupabaseClient } from "@/lib/supabase";
import type {
  CreateColumnResponse,
  ReorderColumnsResponse,
  ApiError,
} from "@/types/api";

// POST /api/columns - Create a new column
export const POST = withAuth(
  async ({
    auth,
    request,
  }): Promise<NextResponse<CreateColumnResponse | ApiError>> => {
    try {
      // Get request body
      const { boardId, title, position } = await request.json();
      if (!boardId || !title) {
        return NextResponse.json<ApiError>(
          { error: "Board ID and title are required" },
          { status: 400 }
        );
      }

      const supabase = await createSupabaseClient();

      // Check if user is a member of this board
      const { data: boardMember, error: memberError } = await supabase
        .from("board_members")
        .select("*")
        .eq("board_id", boardId)
        .eq("user_id", auth.userId)
        .single();

      if (memberError || !boardMember) {
        return NextResponse.json<ApiError>(
          { error: "Board not found or access denied" },
          { status: 403 }
        );
      }

      // Create a new column
      const { data: newColumn, error: columnError } = await supabase
        .from("columns")
        .insert({
          board_id: boardId,
          title,
          position,
        })
        .select()
        .single();

      if (columnError) {
        return NextResponse.json<ApiError>(
          { error: columnError.message },
          { status: 500 }
        );
      }

      return NextResponse.json<CreateColumnResponse>({
        column: {
          id: newColumn.id,
          title: newColumn.title,
          tasks: [],
          createdAt: newColumn.created_at,
          updatedAt: newColumn.updated_at,
        },
      });
    } catch (error: unknown) {
      console.error("Error creating column:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      return NextResponse.json<ApiError>(
        { error: errorMessage },
        { status: 500 }
      );
    }
  }
);

// PUT /api/columns/reorder - Update column positions
export const PUT = withAuth(
  async ({
    request,
  }): Promise<NextResponse<ReorderColumnsResponse | ApiError>> => {
    try {
      const { columns } = await request.json();
      if (!columns || !Array.isArray(columns)) {
        return NextResponse.json<ApiError>(
          { error: "Invalid columns data" },
          { status: 400 }
        );
      }

      const supabase = await createSupabaseClient();

      const updates = columns.map((column, index) =>
        supabase.from("columns").update({ position: index }).eq("id", column.id)
      );

      const results = await Promise.all(updates);

      const errors = results.filter((result) => result.error);
      if (errors.length > 0) {
        return NextResponse.json<ApiError>(
          { error: "Failed to update column positions" },
          { status: 500 }
        );
      }

      return NextResponse.json<ReorderColumnsResponse>({ success: true });
    } catch (error: unknown) {
      console.error("Error reordering columns:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      return NextResponse.json<ApiError>(
        { error: errorMessage },
        { status: 500 }
      );
    }
  }
);
