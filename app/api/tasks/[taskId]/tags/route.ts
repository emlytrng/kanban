import { NextResponse } from "next/server";

import { withAuth } from "@/lib/auth-utils";
import { createSupabaseClient } from "@/lib/supabase";
import type { UpdateTaskTagsResponse, ApiError } from "@/types/api";

// PUT /api/tasks/[taskId]/tags - Update task tags (replace all tags)
export const PUT = withAuth(
  async ({
    request,
    context,
  }): Promise<NextResponse<UpdateTaskTagsResponse | ApiError>> => {
    try {
      const params = await context?.params;
      const taskId = params?.taskId;
      if (!taskId) {
        return NextResponse.json<ApiError>(
          { error: "Task ID is required" },
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
        .from("task_tags")
        .delete()
        .eq("task_id", taskId);

      if (deleteError) {
        return NextResponse.json<ApiError>(
          { error: deleteError.message },
          { status: 500 }
        );
      }

      // Insert new tag relationships if any tags are provided
      if (tagIds.length > 0) {
        const taskTagInserts = tagIds.map((tagId: string) => ({
          task_id: taskId,
          tag_id: tagId,
        }));

        const { error: insertError } = await supabase
          .from("task_tags")
          .insert(taskTagInserts);

        if (insertError) {
          return NextResponse.json<ApiError>(
            { error: insertError.message },
            { status: 500 }
          );
        }
      }

      return NextResponse.json<UpdateTaskTagsResponse>({ success: true });
    } catch (error: unknown) {
      console.error("Error updating task tags:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      return NextResponse.json<ApiError>(
        { error: errorMessage },
        { status: 500 }
      );
    }
  }
);
