import { type NextRequest, NextResponse } from "next/server";

import { withAuth } from "@/lib/auth-utils";
import { createSupabaseClient } from "@/lib/supabase";

// GET /api/boards/[boardId] - Get a specific board with its columns and cards
export const GET = withAuth(
  async (
    _auth,
    _request: NextRequest,
    context?: { params: { boardId: string } }
  ) => {
    try {
      const boardId = context?.params?.boardId;
      if (!boardId) {
        return NextResponse.json(
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
        return NextResponse.json(
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
        cards (
          id,
          title,
          description,
          position,
          created_at,
          updated_at
        )
      `
        )
        .eq("board_id", boardId)
        .order("position", { ascending: true });

      if (columnsError) {
        return NextResponse.json(
          { error: columnsError.message },
          { status: 500 }
        );
      }

      // Transform data to match our app's structure
      const columns = columnsData.map((col) => ({
        id: col.id,
        title: col.title,
        cards: (col.cards || [])
          .sort(
            (a: { position: number }, b: { position: number }) =>
              a.position - b.position
          )
          .map(
            (card: {
              id: string;
              title: string;
              description: string | null;
              created_at: string;
              updated_at: string;
            }) => ({
              id: card.id,
              title: card.title,
              description: card.description || "",
              assignee: "You", // Default assignee
              createdAt: card.created_at,
              updatedAt: card.updated_at,
            })
          ),
        createdAt: col.created_at,
        updatedAt: col.updated_at,
      }));

      const board = {
        id: boardData.id,
        title: boardData.title,
        createdAt: boardData.created_at,
        updatedAt: boardData.updated_at,
      };

      return NextResponse.json({ board, columns });
    } catch (error: unknown) {
      console.error("Error fetching board:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
  }
);
