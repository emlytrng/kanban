import { type NextRequest, NextResponse } from "next/server";

import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";

import { AI_TASK_MANAGER_PROMPT } from "@/lib/ai-task-manager-prompt";
import { TaskOperationResponseSchema } from "@/schemas/task-operation-response";
import type { Column } from "@/types";
import type { ChatTaskManagementResponse, ApiError } from "@/types/api";
import type { Task } from "@/types/chat";

export async function POST(
  request: NextRequest
): Promise<NextResponse<ChatTaskManagementResponse | ApiError>> {
  try {
    const { message, columns, tasks } = await request.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json<ApiError>(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    const columnsInfo =
      columns
        ?.map((col: Pick<Column, "id" | "title">) => `${col.id}: ${col.title}`)
        .join(", ") || "";

    const tasksInfo =
      tasks
        ?.slice(0, 20)
        ?.map(
          (task: Task) =>
            `${task.id}: "${task.title}" (in ${task.columnTitle}, assigned to ${task.assignee || "unassigned"})`
        )
        ?.join(", ") || "";

    // Using .replace for a simple template for now, but could be improved
    // with a more robust templating solution like mustache or handlebars.
    const prompt = AI_TASK_MANAGER_PROMPT.replace("{columnsInfo}", columnsInfo)
      .replace("{tasksInfo}", tasksInfo)
      .replace("{message}", message);

    const { object } = await generateObject({
      model: openai("gpt-4o"),
      schema: TaskOperationResponseSchema,
      prompt,
    });

    return NextResponse.json<ChatTaskManagementResponse>(object);
  } catch (error) {
    console.error("Error in chat task management:", error);
    return NextResponse.json<ApiError>(
      { error: "Failed to process message" },
      { status: 500 }
    );
  }
}
