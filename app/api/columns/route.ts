import { type NextRequest, NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";
import { createSupabaseClient } from "@/lib/supabase";

// POST /api/columns - Create a new column
export async function POST(request: NextRequest) {
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

    // Get request body
    const { boardId, title, position } = await request.json();
    if (!boardId || !title) {
      return NextResponse.json(
        { error: "Board ID and title are required" },
        { status: 400 }
      );
    }

    // Check if user is a member of this board
    const { data: boardMember, error: memberError } = await supabase
      .from("board_members")
      .select("*")
      .eq("board_id", boardId)
      .eq("user_id", userId)
      .single();

    if (memberError || !boardMember) {
      return NextResponse.json(
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
      return NextResponse.json({ error: columnError.message }, { status: 500 });
    }

    return NextResponse.json({
      column: {
        id: newColumn.id,
        title: newColumn.title,
        cards: [],
        createdAt: newColumn.created_at,
        updatedAt: newColumn.updated_at,
      },
    });
  } catch (error: any) {
    console.error("Error creating column:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/columns/reorder - Update column positions
export async function PUT(request: NextRequest) {
  try {
    const session = await auth0.getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createSupabaseClient();

    const userId = session.user["user_id"];
    if (!userId) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { columns } = await request.json();
    if (!columns || !Array.isArray(columns)) {
      return NextResponse.json(
        { error: "Invalid columns data" },
        { status: 400 }
      );
    }

    const updates = columns.map((column, index) =>
      supabase.from("columns").update({ position: index }).eq("id", column.id)
    );

    const results = await Promise.all(updates);

    const errors = results.filter((result) => result.error);
    if (errors.length > 0) {
      return NextResponse.json(
        { error: "Failed to update column positions" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error reordering columns:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
