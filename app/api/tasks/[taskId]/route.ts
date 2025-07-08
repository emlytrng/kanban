import { NextResponse } from "next/server";

import { withAuth } from "@/lib/auth-utils";
import { createSupabaseClient } from "@/lib/supabase";
import type {
  UpdateTaskResponse,
  DeleteTaskResponse,
  ApiError,
} from "@/types/api";

// PATCH /api/tasks/[taskId] - Update a task
export const PATCH = withAuth(
  async ({
    request,
    context,
  }): Promise<NextResponse<UpdateTaskResponse | ApiError>> => {
    try {
      const params = await context?.params;
      const taskId = params?.taskId;
      if (!taskId) {
        return NextResponse.json<ApiError>(
          { error: "Task ID is required" },
          { status: 400 }
        );
      }

      const updates = await request.json();
      const { title, description, column_id, position } = updates;

      // Update the task
      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };

      if (title !== undefined) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      if (column_id !== undefined) updateData.column_id = column_id;
      if (position !== undefined) updateData.position = position;

      const supabase = await createSupabaseClient();

      const { data: updatedTask, error: updateError } = await supabase
        .from("tasks")
        .update(updateData)
        .eq("id", taskId)
        .select()
        .single();

      if (updateError) {
        return NextResponse.json<ApiError>(
          { error: updateError.message },
          { status: 500 }
        );
      }

      return NextResponse.json<UpdateTaskResponse>({
        task: {
          id: updatedTask.id,
          title: updatedTask.title,
          description: updatedTask.description || "",
          createdAt: updatedTask.created_at,
          updatedAt: updatedTask.updated_at,
        },
      });
    } catch (error: unknown) {
      console.error("Error updating task:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      return NextResponse.json<ApiError>(
        { error: errorMessage },
        { status: 500 }
      );
    }
  }
);

// DELETE /api/tasks/[taskId] - Delete a task
export const DELETE = withAuth(
  async ({ context }): Promise<NextResponse<DeleteTaskResponse | ApiError>> => {
    try {
      const params = await context?.params;
      const taskId = params?.taskId;
      if (!taskId) {
        return NextResponse.json<ApiError>(
          { error: "Task ID is required" },
          { status: 400 }
        );
      }

      const supabase = await createSupabaseClient();

      // Delete the task
      const { error: deleteError } = await supabase
        .from("tasks")
        .delete()
        .eq("id", taskId);

      if (deleteError) {
        return NextResponse.json<ApiError>(
          { error: deleteError.message },
          { status: 500 }
        );
      }

      return NextResponse.json<DeleteTaskResponse>({ success: true });
    } catch (error: unknown) {
      console.error("Error deleting task:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      return NextResponse.json<ApiError>(
        { error: errorMessage },
        { status: 500 }
      );
    }
  }
);
