import { type NextRequest, NextResponse } from "next/server";

import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";

import { TaskOperationResponseSchema } from "@/schemas/task-operation-response";
import { Column } from "@/types";
import { Task } from "@/types/chat";

export async function POST(request: NextRequest) {
  try {
    const { message, columns, tasks } = await request.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json(
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

    const { object } = await generateObject({
      model: openai("gpt-4o"),
      schema: TaskOperationResponseSchema,
      prompt: `You are an AI assistant that helps users manage tasks in their kanban board through natural language.

Available columns: ${columnsInfo}
Current tasks: ${tasksInfo}

User message: "${message}"

Analyze the user's message and determine what operation they want to perform:

**CREATE OPERATIONS:**
- Keywords: "create", "add", "new task", "make a task"
- Extract: title, priority, column placement (columnId and columnTitle), assignee
- Example: "Create a high-priority bug task for login issues" → CREATE with title="Fix login issues", priority="high", type="bug"

**READ/QUERY OPERATIONS:**
- Keywords: "show", "find", "list", "what", "which", "search"
- Extract: search criteria, filters
- Examples: 
  - "Show me all high-priority tasks" → QUERY with filters
  - "Find tasks assigned to John" → QUERY with assignee filter
  - "What tasks are in the Done column?" → QUERY with column filter

**UPDATE OPERATIONS:**
- Keywords: "update", "change", "modify", "edit", "set"
- Extract: task identifier, what to update
- Examples:
  - "Change the priority of the login task to urgent" → UPDATE with priority change
  - "Assign the API task to Sarah" → UPDATE with assignee change

**MOVE OPERATIONS:**
- Keywords: "move", "put", "transfer", "shift"
- Extract: task identifier, source column (sourceColumnId and sourceColumnTitle), target column (targetColumnId and targetColumnTitle)
- Examples:
  - "Move the login task to Done" → MOVE to Done column
  - "Put the bug fix in testing" → MOVE to testing column

**DELETE OPERATIONS:**
- Keywords: "delete", "remove", "cancel", "drop"
- Extract: task identifier (title, partial match, or taskId), column to delete from (columnId and columnTitle)
- Examples:
  - "Delete the duplicate task" → DELETE specific task by title match
  - "Remove completed tasks" → DELETE with criteria
  - "Delete the login bug task" → DELETE by title match

**Task Identification for DELETE:**
- Match by exact title when possible
- Use partial title matching for ambiguous requests
- If multiple matches found, ask for clarification
- Provide the best matching task details including taskId and columnId

**Task Identification:**
- Use task titles, partial matches, or context clues
- If multiple matches, ask for clarification
- Consider recent context from conversation

**Smart Inference:**
- Infer task types from keywords (bug, feature, research, etc.)
- Determine priority from urgency words (urgent, critical, low priority)
- Suggest appropriate columns based on task type and current workflow
- Extract assignee names from context

**Response Guidelines:**
- Be conversational and confirm what you understood
- Ask for clarification when ambiguous
- Provide helpful suggestions

If the message is unclear or could match multiple tasks, ask for clarification rather than guessing.`,
    });

    return NextResponse.json(object);
  } catch (error) {
    console.error("Error in chat task management:", error);
    return NextResponse.json(
      { error: "Failed to process message" },
      { status: 500 }
    );
  }
}
