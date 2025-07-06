import { type NextRequest, NextResponse } from "next/server";

import { auth0 } from "@/lib/auth0";
import { createSupabaseClient } from "@/lib/supabase";

// GET /api/boards - Get all boards for the authenticated user
export async function GET(request: NextRequest) {
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
    const session = await auth0.getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createSupabaseClient();

    const userId = session.user["user_id"];
    if (!userId) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { title } = await request.json();
    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const { data: newBoardId, error: rpcError } = await supabase.rpc(
      "create_board_with_defaults",
      { board_title: title.trim() }
    );

    if (rpcError) {
      return NextResponse.json({ error: rpcError.message }, { status: 500 });
    }

    return NextResponse.json({ boardId: newBoardId });
  } catch (error: any) {
    console.error("Error creating board:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
