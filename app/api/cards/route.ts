import { NextResponse } from "next/server";

import { withAuth } from "@/lib/auth-utils";
import { createSupabaseClient } from "@/lib/supabase";
import type { CreateCardResponse, ApiError } from "@/types/api";

// POST /api/cards - Create a new card
export const POST = withAuth(
  async ({ request }): Promise<NextResponse<CreateCardResponse | ApiError>> => {
    try {
      // Get request body
      const {
        columnId,
        title,
        description = "",
        position,
      } = await request.json();
      if (!columnId || !title) {
        return NextResponse.json<ApiError>(
          { error: "Column ID and title are required" },
          { status: 400 }
        );
      }

      const supabase = await createSupabaseClient();

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
        return NextResponse.json<ApiError>(
          { error: cardError.message },
          { status: 500 }
        );
      }

      return NextResponse.json<CreateCardResponse>({
        card: {
          id: newCard.id,
          title: newCard.title,
          description: newCard.description || "",
          assignee: "You", // Default assignee
          createdAt: newCard.created_at,
          updatedAt: newCard.updated_at,
        },
      });
    } catch (error: unknown) {
      console.error("Error creating card:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      return NextResponse.json<ApiError>(
        { error: errorMessage },
        { status: 500 }
      );
    }
  }
);
