import { type NextRequest, NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";
import { createSupabaseClient } from "@/lib/supabase";

// POST /api/cards/move - Move a card between columns
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
    const { cardId, sourceColumnId, destinationColumnId, destinationIndex } =
      await request.json();
    if (
      !cardId ||
      !sourceColumnId ||
      !destinationColumnId ||
      destinationIndex === undefined
    ) {
      return NextResponse.json(
        {
          error:
            "Card ID, source column ID, destination column ID, and destination index are required",
        },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseClient();

    // Start a transaction-like operation
    // First, update the card's column
    const { error: updateError } = await supabase
      .from("cards")
      .update({
        column_id: destinationColumnId,
        position: destinationIndex,
        updated_at: new Date().toISOString(),
      })
      .eq("id", cardId);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // If moving between different columns, we need to update positions
    if (sourceColumnId !== destinationColumnId) {
      // Get all cards in destination column and reorder them
      const { data: destCards, error: destError } = await supabase
        .from("cards")
        .select("id")
        .eq("column_id", destinationColumnId)
        .order("position");

      if (destError) {
        return NextResponse.json({ error: destError.message }, { status: 500 });
      }

      // Update positions for cards that come after the inserted position
      const updates = destCards
        .filter((card) => card.id !== cardId)
        .map((card, index) => {
          const newPosition = index >= destinationIndex ? index + 1 : index;
          return supabase
            .from("cards")
            .update({ position: newPosition })
            .eq("id", card.id);
        });

      // Execute all updates
      await Promise.all(updates);

      // Reorder source column cards
      const { data: sourceCards, error: sourceError } = await supabase
        .from("cards")
        .select("id")
        .eq("column_id", sourceColumnId)
        .order("position");

      if (!sourceError && sourceCards) {
        const sourceUpdates = sourceCards.map((card, index) =>
          supabase.from("cards").update({ position: index }).eq("id", card.id)
        );

        await Promise.all(sourceUpdates);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error moving card:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
