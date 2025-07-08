import { NextResponse } from "next/server";

import { withAuth } from "@/lib/auth-utils";
import { createSupabaseClient } from "@/lib/supabase";
import type { MoveTaskResponse, ApiError } from "@/types/api";

// POST /api/tasks/move - Move a task between columns
export const POST = withAuth(
  async ({ request }): Promise<NextResponse<MoveTaskResponse | ApiError>> => {
    try {
      // Get request body
      const { taskId, sourceColumnId, destinationColumnId, destinationIndex } =
        await request.json();

      if (
        !taskId ||
        !sourceColumnId ||
        !destinationColumnId ||
        destinationIndex === undefined
      ) {
        return NextResponse.json<ApiError>(
          {
            error:
              "Task ID, source column ID, destination column ID, and destination index are required",
          },
          { status: 400 }
        );
      }

      const supabase = await createSupabaseClient();

      // Moving within the same column
      if (sourceColumnId === destinationColumnId) {
        const { data: tasks, error: tasksError } = await supabase
          .from("tasks")
          .select("id, position")
          .eq("column_id", sourceColumnId)
          .order("position");

        if (tasksError) {
          return NextResponse.json<ApiError>(
            { error: tasksError.message },
            { status: 500 }
          );
        }

        if (!tasks) {
          return NextResponse.json<ApiError>(
            { error: "Tasks not found" },
            { status: 404 }
          );
        }

        // Find current position of the task
        const currentIndex = tasks.findIndex((task) => task.id === taskId);
        if (currentIndex === -1) {
          return NextResponse.json<ApiError>(
            { error: "Task not found" },
            { status: 404 }
          );
        }

        // Reorder the tasks array
        const reorderedTasks = [...tasks];
        const [movedTask] = reorderedTasks.splice(currentIndex, 1);
        reorderedTasks.splice(destinationIndex, 0, movedTask);

        // Update positions for all tasks
        const updates = reorderedTasks.map((task, index) =>
          supabase
            .from("tasks")
            .update({
              position: index,
              updated_at: new Date().toISOString(),
            })
            .eq("id", task.id)
        );

        await Promise.all(updates);
      } else {
        // Moving between different columns

        // Get all tasks in destination column BEFORE moving the task
        const { data: destTasksBefore, error: destTasksError } = await supabase
          .from("tasks")
          .select("id, position")
          .eq("column_id", destinationColumnId)
          .order("position");

        if (destTasksError) {
          return NextResponse.json<ApiError>(
            { error: destTasksError.message },
            { status: 500 }
          );
        }

        // Move the task to destination column with a temporary high position
        const { error: moveError } = await supabase
          .from("tasks")
          .update({
            column_id: destinationColumnId,
            position: 9999,
            updated_at: new Date().toISOString(),
          })
          .eq("id", taskId);

        if (moveError) {
          return NextResponse.json<ApiError>(
            { error: moveError.message },
            { status: 500 }
          );
        }

        // Create the new order for destination column
        const destTasks = destTasksBefore || [];

        // Insert the moved task at the correct position
        const taskToInsert = { id: taskId, position: 9999 };
        destTasks.splice(destinationIndex, 0, taskToInsert);

        const destTasksUpdates = destTasks.map((task, index) =>
          supabase
            .from("tasks")
            .update({
              position: index,
              updated_at: new Date().toISOString(),
            })
            .eq("id", task.id)
        );

        await Promise.all(destTasksUpdates);

        // Reorder source column tasks
        const { data: sourceTasks, error: sourceTasksError } = await supabase
          .from("tasks")
          .select("id, position")
          .eq("column_id", sourceColumnId)
          .order("position");

        if (!sourceTasksError && sourceTasks) {
          const sourceUpdates = sourceTasks.map((task, index) =>
            supabase
              .from("tasks")
              .update({
                position: index,
                updated_at: new Date().toISOString(),
              })
              .eq("id", task.id)
          );

          await Promise.all(sourceUpdates);
        }
      }

      return NextResponse.json<MoveTaskResponse>({ success: true });
    } catch (error: unknown) {
      console.error("Error moving task:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      return NextResponse.json<ApiError>(
        { error: errorMessage },
        { status: 500 }
      );
    }
  }
);
