import { type NextRequest, NextResponse } from "next/server";

import { withAuth } from "@/lib/auth-utils";
import { createSupabaseClient } from "@/lib/supabase";
import type { DeleteColumnResponse, ApiError } from "@/types/api";

// DELETE /api/columns/[columnId] - Delete a column
export const DELETE = withAuth(
  async (
    _auth,
    _request: NextRequest,
    context?: { params: { columnId: string } }
  ): Promise<NextResponse<DeleteColumnResponse | ApiError>> => {
    try {
      const columnId = context?.params?.columnId;
      if (!columnId) {
        return NextResponse.json<ApiError>(
          { error: "Column ID is required" },
          { status: 400 }
        );
      }

      const supabase = await createSupabaseClient();

      // Delete the column
      const { error: deleteError } = await supabase
        .from("columns")
        .delete()
        .eq("id", columnId);

      if (deleteError) {
        return NextResponse.json<ApiError>(
          { error: deleteError.message },
          { status: 500 }
        );
      }

      return NextResponse.json<DeleteColumnResponse>({ success: true });
    } catch (error: unknown) {
      console.error("Error deleting column:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      return NextResponse.json<ApiError>(
        { error: errorMessage },
        { status: 500 }
      );
    }
  }
);
