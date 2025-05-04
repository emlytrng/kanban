import { type NextRequest, NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";
import { createSupabaseClient } from "@/lib/supabase";

// GET /api/boards/[boardId] - Get a specific board with its columns and cards
export async function GET(
  request: NextRequest,
  { params }: { params: { boardId: string } }
) {
  try {
    // Check if user is authenticated
    const session = await auth0.getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createSupabaseClient();

    // Get user ID from Auth0 ID
    const userId = session.user["user_id"];
    if (!userId) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const boardId = params.boardId;

    // Fetch the board
    const { data: boardData, error: boardError } = await supabase
      .from("boards")
      .select("*")
      .eq("id", boardId)
      .single();

    if (boardError) {
      return NextResponse.json({ error: boardError.message }, { status: 500 });
    }

    // Fetch columns for this board
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
      .order("position");

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
        .sort((a: any, b: any) => a.position - b.position)
        .map((card: any) => ({
          id: card.id,
          title: card.title,
          description: card.description || "",
          assignee: "You", // Default assignee
          createdAt: card.created_at,
          updatedAt: card.updated_at,
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

    return NextResponse.json({ board, columns });
  } catch (error: any) {
    console.error("Error fetching board:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
