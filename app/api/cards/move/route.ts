import { type NextRequest, NextResponse } from "next/server";

import { withAuth } from "@/lib/auth-utils";
import { createSupabaseClient } from "@/lib/supabase";
import type { MoveCardResponse, ApiError } from "@/types/api";

// POST /api/cards/move - Move a card between columns
export const POST = withAuth(
  async (
    auth,
    request: NextRequest
  ): Promise<NextResponse<MoveCardResponse | ApiError>> => {
    try {
      // Get request body
      const { cardId, sourceColumnId, destinationColumnId, destinationIndex } =
        await request.json();

      if (
        !cardId ||
        !sourceColumnId ||
        !destinationColumnId ||
        destinationIndex === undefined
      ) {
        return NextResponse.json<ApiError>(
          {
            error:
              "Card ID, source column ID, destination column ID, and destination index are required",
          },
          { status: 400 }
        );
      }

      const supabase = await createSupabaseClient();

      // Moving within the same column
      if (sourceColumnId === destinationColumnId) {
        const { data: cards, error: cardsError } = await supabase
          .from("cards")
          .select("id, position")
          .eq("column_id", sourceColumnId)
          .order("position");

        if (cardsError) {
          return NextResponse.json<ApiError>(
            { error: cardsError.message },
            { status: 500 }
          );
        }

        if (!cards) {
          return NextResponse.json<ApiError>(
            { error: "Cards not found" },
            { status: 404 }
          );
        }

        // Find current position of the card
        const currentIndex = cards.findIndex((card) => card.id === cardId);
        if (currentIndex === -1) {
          return NextResponse.json<ApiError>(
            { error: "Card not found" },
            { status: 404 }
          );
        }

        // Reorder the cards array
        const reorderedCards = [...cards];
        const [movedCard] = reorderedCards.splice(currentIndex, 1);
        reorderedCards.splice(destinationIndex, 0, movedCard);

        // Update positions for all cards
        const updates = reorderedCards.map((card, index) =>
          supabase
            .from("cards")
            .update({
              position: index,
              updated_at: new Date().toISOString(),
            })
            .eq("id", card.id)
        );

        await Promise.all(updates);
      } else {
        // Moving between different columns

        // Get all cards in destination column BEFORE moving the card
        const { data: destCardsBefore, error: destCardsError } = await supabase
          .from("cards")
          .select("id, position")
          .eq("column_id", destinationColumnId)
          .order("position");

        if (destCardsError) {
          return NextResponse.json<ApiError>(
            { error: destCardsError.message },
            { status: 500 }
          );
        }

        // Move the card to destination column with a temporary high position
        const { error: moveError } = await supabase
          .from("cards")
          .update({
            column_id: destinationColumnId,
            position: 9999,
            updated_at: new Date().toISOString(),
          })
          .eq("id", cardId);

        if (moveError) {
          return NextResponse.json<ApiError>(
            { error: moveError.message },
            { status: 500 }
          );
        }

        // Create the new order for destination column
        const destCards = destCardsBefore || [];

        // Insert the moved card at the correct position
        const cardToInsert = { id: cardId, position: 9999 };
        destCards.splice(destinationIndex, 0, cardToInsert);

        const destCardsUpdates = destCards.map((card, index) =>
          supabase
            .from("cards")
            .update({
              position: index,
              updated_at: new Date().toISOString(),
            })
            .eq("id", card.id)
        );

        await Promise.all(destCardsUpdates);

        // Reorder source column cards
        const { data: sourceCards, error: sourceCardsError } = await supabase
          .from("cards")
          .select("id, position")
          .eq("column_id", sourceColumnId)
          .order("position");

        if (!sourceCardsError && sourceCards) {
          const sourceUpdates = sourceCards.map((card, index) =>
            supabase
              .from("cards")
              .update({
                position: index,
                updated_at: new Date().toISOString(),
              })
              .eq("id", card.id)
          );

          await Promise.all(sourceUpdates);
        }
      }

      return NextResponse.json<MoveCardResponse>({ success: true });
    } catch (error: unknown) {
      console.error("Error moving card:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      return NextResponse.json<ApiError>(
        { error: errorMessage },
        { status: 500 }
      );
    }
  }
);
