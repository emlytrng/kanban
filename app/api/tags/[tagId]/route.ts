import { NextResponse } from "next/server";

import { withAuth } from "@/lib/auth-utils";
import { createSupabaseClient } from "@/lib/supabase";
import type {
  UpdateTagResponse,
  DeleteTagResponse,
  ApiError,
} from "@/types/api";

// PATCH /api/tags/[tagId] - Update a tag
export const PATCH = withAuth(
  async ({
    request,
    context,
  }): Promise<NextResponse<UpdateTagResponse | ApiError>> => {
    try {
      const params = await context?.params;
      const tagId = params?.tagId;
      if (!tagId) {
        return NextResponse.json<ApiError>(
          { error: "Tag ID is required" },
          { status: 400 }
        );
      }

      const updates = await request.json();
      const { name, color } = updates;

      if (!name && !color) {
        return NextResponse.json<ApiError>(
          { error: "At least one field (name or color) is required" },
          { status: 400 }
        );
      }

      // Validate color format if provided
      if (color) {
        const hexColorRegex = /^#[0-9A-F]{6}$/i;
        if (!hexColorRegex.test(color)) {
          return NextResponse.json<ApiError>(
            { error: "Color must be a valid hex color code (e.g., #FF5733)" },
            { status: 400 }
          );
        }
      }

      const supabase = await createSupabaseClient();

      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };

      if (name !== undefined) updateData.name = name.trim();
      if (color !== undefined) updateData.color = color.toUpperCase();

      const { data: updatedTag, error: updateError } = await supabase
        .from("tags")
        .update(updateData)
        .eq("id", tagId)
        .select()
        .single();

      if (updateError) {
        // Handle unique constraint violations
        if (updateError.code === "23505") {
          if (updateError.message.includes("tags_board_id_name_key")) {
            return NextResponse.json<ApiError>(
              { error: "A tag with this name already exists on this board" },
              { status: 409 }
            );
          }
          if (updateError.message.includes("tags_board_id_color_key")) {
            return NextResponse.json<ApiError>(
              { error: "A tag with this color already exists on this board" },
              { status: 409 }
            );
          }
        }
        return NextResponse.json<ApiError>(
          { error: updateError.message },
          { status: 500 }
        );
      }

      const tag = {
        id: updatedTag.id,
        boardId: updatedTag.board_id,
        name: updatedTag.name,
        color: updatedTag.color,
        createdAt: updatedTag.created_at,
        updatedAt: updatedTag.updated_at,
      };

      return NextResponse.json<UpdateTagResponse>({ tag });
    } catch (error: unknown) {
      console.error("Error updating tag:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      return NextResponse.json<ApiError>(
        { error: errorMessage },
        { status: 500 }
      );
    }
  }
);

// DELETE /api/tags/[tagId] - Delete a tag
export const DELETE = withAuth(
  async ({ context }): Promise<NextResponse<DeleteTagResponse | ApiError>> => {
    try {
      const params = await context?.params;
      const tagId = params?.tagId;
      if (!tagId) {
        return NextResponse.json<ApiError>(
          { error: "Tag ID is required" },
          { status: 400 }
        );
      }

      const supabase = await createSupabaseClient();

      // Delete the tag (this will also delete all card_tags relationships due to CASCADE)
      const { error: deleteError } = await supabase
        .from("tags")
        .delete()
        .eq("id", tagId);

      if (deleteError) {
        return NextResponse.json<ApiError>(
          { error: deleteError.message },
          { status: 500 }
        );
      }

      return NextResponse.json<DeleteTagResponse>({ success: true });
    } catch (error: unknown) {
      console.error("Error deleting tag:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      return NextResponse.json<ApiError>(
        { error: errorMessage },
        { status: 500 }
      );
    }
  }
);
