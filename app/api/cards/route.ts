import { type NextRequest, NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";
import { supabase } from "@/lib/supabase";

// POST /api/cards - Create a new card
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
    const {
      columnId,
      title,
      description = "",
      position,
    } = await request.json();
    if (!columnId || !title) {
      return NextResponse.json(
        { error: "Column ID and title are required" },
        { status: 400 }
      );
    }

    // Create a new card
    const { data: newCard, error: cardError } = await supabase
      .from("cards")
      .insert({
        column_id: columnId,
        title,
        description,
        position,
      })
      .select()
      .single();

    if (cardError) {
      return NextResponse.json({ error: cardError.message }, { status: 500 });
    }

    return NextResponse.json({
      card: {
        id: newCard.id,
        title: newCard.title,
        description: newCard.description || "",
        assignee: "You", // Default assignee
        createdAt: newCard.created_at,
        updatedAt: newCard.updated_at,
      },
    });
  } catch (error: any) {
    console.error("Error creating card:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
