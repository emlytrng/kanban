import { type NextRequest, NextResponse } from "next/server";

import { auth0 } from "@/lib/auth0";
import { createSupabaseClient } from "@/lib/supabase";

// PATCH /api/cards/[cardId] - Update a card
export async function PATCH(
  request: NextRequest,
  { params }: { params: { cardId: string } }
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

    const cardId = params.cardId;

    // Get request body
    const updates = await request.json();
    const { title, description, column_id, position } = updates;

    // Update the card
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (column_id !== undefined) updateData.column_id = column_id;
    if (position !== undefined) updateData.position = position;

    const { data: updatedCard, error } = await supabase
      .from("cards")
      .update(updateData)
      .eq("id", cardId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      card: {
        id: updatedCard.id,
        title: updatedCard.title,
        description: updatedCard.description || "",
        assignee: "You", // Default assignee
        createdAt: updatedCard.created_at,
        updatedAt: updatedCard.updated_at,
      },
    });
  } catch (error: any) {
    console.error("Error updating card:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/cards/[cardId] - Delete a card
export async function DELETE(
  request: NextRequest,
  { params }: { params: { cardId: string } }
) {
  try {
    // Check if user is authenticated
    const session = await auth0.getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createSupabaseClient();

    const cardId = params.cardId;

    // Delete the card
    const { error } = await supabase.from("cards").delete().eq("id", cardId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting card:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
