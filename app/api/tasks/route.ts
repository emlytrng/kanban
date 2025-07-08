import { NextResponse } from "next/server";

import { withAuth } from "@/lib/auth-utils";
import { createSupabaseClient } from "@/lib/supabase";
import type { CreateTaskResponse, ApiError } from "@/types/api";

// POST /api/tasks - Create a new task
export const POST = withAuth(
  async ({ request }): Promise<NextResponse<CreateTaskResponse | ApiError>> => {
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

      // Create a new task
      const { data: newTask, error: taskError } = await supabase
        .from("tasks")
        .insert({
          column_id: columnId,
          title,
          description,
          position,
        })
        .select()
        .single();

      if (taskError) {
        return NextResponse.json<ApiError>(
          { error: taskError.message },
          { status: 500 }
        );
      }

      return NextResponse.json<CreateTaskResponse>({
        task: {
          id: newTask.id,
          title: newTask.title,
          description: newTask.description || "",
          assignee: "You", // Default assignee
          createdAt: newTask.created_at,
          updatedAt: newTask.updated_at,
        },
      });
    } catch (error: unknown) {
      console.error("Error creating task:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      return NextResponse.json<ApiError>(
        { error: errorMessage },
        { status: 500 }
      );
    }
  }
);
