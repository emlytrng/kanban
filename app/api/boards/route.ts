import { type NextRequest, NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";
import { supabase } from "@/lib/supabase";

// GET /api/boards - Get all boards for the authenticated user
export async function GET(request: NextRequest) {
  try {
    // Check if user is authenticated
    const session = await auth0.getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user ID from Auth0 ID
    const userId = session.user["user_id"];
    if (!userId) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get all boards the user is a member of
    const { data: boardMembers, error: membersError } = await supabase
      .from("board_members")
      .select("board_id")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false });

    if (membersError) {
      return NextResponse.json(
        { error: membersError.message },
        { status: 500 }
      );
    }

    if (!boardMembers || boardMembers.length === 0) {
      return NextResponse.json({ boards: [] });
    }

    const boardIds = boardMembers.map((member) => member.board_id);

    // Fetch the actual board data
    const { data: boardsData, error: boardsError } = await supabase
      .from("boards")
      .select("*")
      .in("id", boardIds)
      .order("updated_at", { ascending: false });

    if (boardsError) {
      return NextResponse.json({ error: boardsError.message }, { status: 500 });
    }

    const boards = boardsData.map((board) => ({
      id: board.id,
      title: board.title,
      createdAt: board.created_at,
      updatedAt: board.updated_at,
    }));

    return NextResponse.json({ boards });
  } catch (error: any) {
    console.error("Error fetching boards:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/boards - Create a new board
export async function POST(request: NextRequest) {
  try {
    // Check if user is authenticated
    const session = await auth0.getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user ID from Auth0 ID
    const userId = session.user["user_id"];
    if (!userId) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get request body
    const { title } = await request.json();
    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    // Create a new board
    const { data: newBoard, error: boardError } = await supabase
      .from("boards")
      .insert({
        title,
      })
      .select()
      .single();

    if (boardError) {
      return NextResponse.json({ error: boardError.message }, { status: 500 });
    }

    // Add the current user as a board member
    const { error: memberError } = await supabase.from("board_members").insert({
      board_id: newBoard.id,
      user_id: userId,
    });

    if (memberError) {
      return NextResponse.json({ error: memberError.message }, { status: 500 });
    }

    // Create default columns
    const defaultColumns = [
      { title: "To Do", position: 0 },
      { title: "In Progress", position: 1 },
      { title: "Done", position: 2 },
    ];

    for (const col of defaultColumns) {
      await supabase.from("columns").insert({
        board_id: newBoard.id,
        title: col.title,
        position: col.position,
      });
    }

    return NextResponse.json({ boardId: newBoard.id });
  } catch (error: any) {
    console.error("Error creating board:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
