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
    if (!cardId || !sourceColumnId || !destinationColumnId) {
      return NextResponse.json(
        {
          error:
            "Card ID, source column ID, and destination column ID are required",
        },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseClient();

    // Update the card's column and position
    const { error } = await supabase
      .from("cards")
      .update({
        column_id: destinationColumnId,
        position: destinationIndex,
        updated_at: new Date().toISOString(),
      })
      .eq("id", cardId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Update positions of other cards in the destination column
    const { data: destCards, error: destError } = await supabase
      .from("cards")
      .select("id, position")
      .eq("column_id", destinationColumnId)
      .order("position");

    if (destError) {
      return NextResponse.json({ error: destError.message }, { status: 500 });
    }

    // Reorder cards in destination column
    const cardsToUpdate = destCards
      .filter((card) => card.id !== cardId)
      .map((card, index) => {
        const newPosition = index >= destinationIndex ? index + 1 : index;
        return {
          id: card.id,
          position: newPosition,
        };
      });

    for (const card of cardsToUpdate) {
      await supabase
        .from("cards")
        .update({ position: card.position })
        .eq("id", card.id);
    }

    // If moving between columns, update positions in source column
    if (sourceColumnId !== destinationColumnId) {
      const { data: sourceCards, error: sourceError } = await supabase
        .from("cards")
        .select("id, position")
        .eq("column_id", sourceColumnId)
        .order("position");

      if (sourceError) {
        return NextResponse.json(
          { error: sourceError.message },
          { status: 500 }
        );
      }

      // Reorder cards in source column
      const sourceCardsToUpdate = sourceCards.map((card, index) => ({
        id: card.id,
        position: index,
      }));

      for (const card of sourceCardsToUpdate) {
        await supabase
          .from("cards")
          .update({ position: card.position })
          .eq("id", card.id);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error moving card:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
