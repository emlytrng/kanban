import { NextResponse } from "next/server";

import { withAuth } from "@/lib/auth-utils";
import { createSupabaseClient } from "@/lib/supabase";
import type { GetTagsResponse, CreateTagResponse, ApiError } from "@/types/api";

// GET /api/tags?boardId=xxx - Get all tags for a board
export const GET = withAuth(
  async ({ request }): Promise<NextResponse<GetTagsResponse | ApiError>> => {
    try {
      const { searchParams } = new URL(request.url);
      const boardId = searchParams.get("boardId");

      if (!boardId) {
        return NextResponse.json<ApiError>(
          { error: "Board ID is required" },
          { status: 400 }
        );
      }

      const supabase = await createSupabaseClient();

      const { data: tagsData, error: tagsError } = await supabase
        .from("tags")
        .select("*")
        .eq("board_id", boardId)
        .order("name", { ascending: true });

      if (tagsError) {
        return NextResponse.json<ApiError>(
          { error: tagsError.message },
          { status: 500 }
        );
      }

      const tags = tagsData.map((tag) => ({
        id: tag.id,
        boardId: tag.board_id,
        name: tag.name,
        color: tag.color,
        createdAt: tag.created_at,
        updatedAt: tag.updated_at,
      }));

      return NextResponse.json<GetTagsResponse>({ tags });
    } catch (error: unknown) {
      console.error("Error fetching tags:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      return NextResponse.json<ApiError>(
        { error: errorMessage },
        { status: 500 }
      );
    }
  }
);

// POST /api/tags - Create a new tag
export const POST = withAuth(
  async ({ request }): Promise<NextResponse<CreateTagResponse | ApiError>> => {
    try {
      const { boardId, name, color } = await request.json();

      if (!boardId || !name || !color) {
        return NextResponse.json<ApiError>(
          { error: "Board ID, name, and color are required" },
          { status: 400 }
        );
      }

      // Validate color format (hex color)
      const hexColorRegex = /^#[0-9A-F]{6}$/i;
      if (!hexColorRegex.test(color)) {
        return NextResponse.json<ApiError>(
          { error: "Color must be a valid hex color code (e.g., #FF5733)" },
          { status: 400 }
        );
      }

      const supabase = await createSupabaseClient();

      const { data: newTag, error: createError } = await supabase
        .from("tags")
        .insert({
          board_id: boardId,
          name: name.trim(),
          color: color.toUpperCase(),
        })
        .select()
        .single();

      if (createError) {
        // Handle unique constraint violations - only check for name uniqueness
        if (
          createError.code === "23505" &&
          createError.message.includes("tags_board_id_name_key")
        ) {
          return NextResponse.json<ApiError>(
            { error: "A tag with this name already exists on this board" },
            { status: 409 }
          );
        }
        return NextResponse.json<ApiError>(
          { error: createError.message },
          { status: 500 }
        );
      }

      const tag = {
        id: newTag.id,
        boardId: newTag.board_id,
        name: newTag.name,
        color: newTag.color,
        createdAt: newTag.created_at,
        updatedAt: newTag.updated_at,
      };

      return NextResponse.json<CreateTagResponse>({ tag });
    } catch (error: unknown) {
      console.error("Error creating tag:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      return NextResponse.json<ApiError>(
        { error: errorMessage },
        { status: 500 }
      );
    }
  }
);
