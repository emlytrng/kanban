import { type NextRequest, NextResponse } from "next/server";

import { withAuth } from "@/lib/auth-utils";
import { createSupabaseClient } from "@/lib/supabase";
import type {
  GetBoardsResponse,
  CreateBoardResponse,
  ApiError,
} from "@/types/api";

// GET /api/boards - Get all boards for the authenticated user
export const GET = withAuth(
  async (
    auth,
    _request: NextRequest
  ): Promise<NextResponse<GetBoardsResponse | ApiError>> => {
    try {
      const supabase = await createSupabaseClient();

      const { data: boardMembers, error: membersError } = await supabase
        .from("board_members")
        .select("board_id")
        .eq("user_id", auth.userId)
        .order("updated_at", { ascending: false });

      if (membersError) {
        return NextResponse.json<ApiError>(
          { error: membersError.message },
          { status: 500 }
        );
      }

      if (!boardMembers || boardMembers.length === 0) {
        return NextResponse.json<GetBoardsResponse>({ boards: [] });
      }

      const boardIds = boardMembers.map((member) => member.board_id);

      const { data: boardsData, error: boardsError } = await supabase
        .from("boards")
        .select("*")
        .in("id", boardIds)
        .order("updated_at", { ascending: false });

      if (boardsError) {
        return NextResponse.json<ApiError>(
          { error: boardsError.message },
          { status: 500 }
        );
      }

      const boards = boardsData.map((board) => ({
        id: board.id,
        title: board.title,
        createdAt: board.created_at,
        updatedAt: board.updated_at,
      }));

      return NextResponse.json<GetBoardsResponse>({ boards });
    } catch (error: unknown) {
      console.error("Error fetching boards:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      return NextResponse.json<ApiError>(
        { error: errorMessage },
        { status: 500 }
      );
    }
  }
);

// POST /api/boards - Create a new board
export const POST = withAuth(
  async (
    _auth,
    request: NextRequest
  ): Promise<NextResponse<CreateBoardResponse | ApiError>> => {
    try {
      const { title } = await request.json();
      if (!title) {
        return NextResponse.json<ApiError>(
          { error: "Title is required" },
          { status: 400 }
        );
      }

      const supabase = await createSupabaseClient();

      const { data: newBoardId, error: rpcError } = await supabase.rpc(
        "create_board_with_defaults",
        {
          board_title: title.trim(),
        }
      );

      if (rpcError) {
        return NextResponse.json<ApiError>(
          { error: rpcError.message },
          { status: 500 }
        );
      }

      return NextResponse.json<CreateBoardResponse>({ boardId: newBoardId });
    } catch (error: unknown) {
      console.error("Error creating board:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      return NextResponse.json<ApiError>(
        { error: errorMessage },
        { status: 500 }
      );
    }
  }
);
