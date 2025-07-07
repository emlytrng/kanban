import { NextResponse } from "next/server";

import { withAuth } from "@/lib/auth-utils";
import { createSupabaseClient } from "@/lib/supabase";
import type {
  UpdateCardResponse,
  DeleteCardResponse,
  ApiError,
} from "@/types/api";

// PATCH /api/cards/[cardId] - Update a card
export const PATCH = withAuth(
  async ({
    request,
    context,
  }): Promise<NextResponse<UpdateCardResponse | ApiError>> => {
    try {
      const params = await context?.params;
      const cardId = params?.cardId;
      if (!cardId) {
        return NextResponse.json<ApiError>(
          { error: "Card ID is required" },
          { status: 400 }
        );
      }

      const updates = await request.json();
      const { title, description, column_id, position } = updates;

      // Update the card
      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };

      if (title !== undefined) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      if (column_id !== undefined) updateData.column_id = column_id;
      if (position !== undefined) updateData.position = position;

      const supabase = await createSupabaseClient();

      const { data: updatedCard, error: updateError } = await supabase
        .from("cards")
        .update(updateData)
        .eq("id", cardId)
        .select()
        .single();

      if (updateError) {
        return NextResponse.json<ApiError>(
          { error: updateError.message },
          { status: 500 }
        );
      }

      return NextResponse.json<UpdateCardResponse>({
        card: {
          id: updatedCard.id,
          title: updatedCard.title,
          description: updatedCard.description || "",
          createdAt: updatedCard.created_at,
          updatedAt: updatedCard.updated_at,
        },
      });
    } catch (error: unknown) {
      console.error("Error updating card:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      return NextResponse.json<ApiError>(
        { error: errorMessage },
        { status: 500 }
      );
    }
  }
);

// DELETE /api/cards/[cardId] - Delete a card
export const DELETE = withAuth(
  async ({ context }): Promise<NextResponse<DeleteCardResponse | ApiError>> => {
    try {
      const params = await context?.params;
      const cardId = params?.cardId;
      if (!cardId) {
        return NextResponse.json<ApiError>(
          { error: "Card ID is required" },
          { status: 400 }
        );
      }

      const supabase = await createSupabaseClient();

      // Delete the card
      const { error: deleteError } = await supabase
        .from("cards")
        .delete()
        .eq("id", cardId);

      if (deleteError) {
        return NextResponse.json<ApiError>(
          { error: deleteError.message },
          { status: 500 }
        );
      }

      return NextResponse.json<DeleteCardResponse>({ success: true });
    } catch (error: unknown) {
      console.error("Error deleting card:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      return NextResponse.json<ApiError>(
        { error: errorMessage },
        { status: 500 }
      );
    }
  }
);
