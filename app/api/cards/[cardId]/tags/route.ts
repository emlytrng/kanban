import { NextResponse } from "next/server";

import { withAuth } from "@/lib/auth-utils";
import { createSupabaseClient } from "@/lib/supabase";
import type { UpdateCardTagsResponse, ApiError } from "@/types/api";

// PUT /api/cards/[cardId]/tags - Update card tags (replace all tags)
export const PUT = withAuth(
  async ({
    request,
    context,
  }): Promise<NextResponse<UpdateCardTagsResponse | ApiError>> => {
    try {
      const params = await context?.params;
      const cardId = params?.cardId;
      if (!cardId) {
        return NextResponse.json<ApiError>(
          { error: "Card ID is required" },
          { status: 400 }
        );
      }

      const { tagIds } = await request.json();

      if (!Array.isArray(tagIds)) {
        return NextResponse.json<ApiError>(
          { error: "tagIds must be an array" },
          { status: 400 }
        );
      }

      const supabase = await createSupabaseClient();

      // Start a transaction by deleting existing tags and inserting new ones
      const { error: deleteError } = await supabase
        .from("card_tags")
        .delete()
        .eq("card_id", cardId);

      if (deleteError) {
        return NextResponse.json<ApiError>(
          { error: deleteError.message },
          { status: 500 }
        );
      }

      // Insert new tag relationships if any tags are provided
      if (tagIds.length > 0) {
        const cardTagInserts = tagIds.map((tagId: string) => ({
          card_id: cardId,
          tag_id: tagId,
        }));

        const { error: insertError } = await supabase
          .from("card_tags")
          .insert(cardTagInserts);

        if (insertError) {
          return NextResponse.json<ApiError>(
            { error: insertError.message },
            { status: 500 }
          );
        }
      }

      return NextResponse.json<UpdateCardTagsResponse>({ success: true });
    } catch (error: unknown) {
      console.error("Error updating card tags:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      return NextResponse.json<ApiError>(
        { error: errorMessage },
        { status: 500 }
      );
    }
  }
);
