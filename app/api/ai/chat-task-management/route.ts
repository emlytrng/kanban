import { type NextRequest, NextResponse } from "next/server";
import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";

const TaskOperationSchema = z.object({
  operation: z
    .object({
      type: z
        .enum(["create", "read", "update", "delete", "move", "query"])
        .describe("Type of operation to perform"),
      details: z
        .object({
          // For create operations
          title: z.string().optional().describe("Task title for creation"),
          description: z.string().optional().describe("Task description"),
          priority: z
            .enum(["low", "medium", "high", "urgent"])
            .optional()
            .describe("Task priority"),
          columnId: z
            .string()
            .optional()
            .describe("Column ID to place the task"),
          assignee: z
            .string()
            .optional()
            .describe("Person to assign the task to"),

          // For update/move/delete operations
          taskId: z.string().optional().describe("ID of the task to modify"),
          sourceColumnId: z
            .string()
            .optional()
            .describe("Source column ID for moves"),
          targetColumnId: z
            .string()
            .optional()
            .describe("Target column ID for moves"),
          taskTitle: z
            .string()
            .optional()
            .describe("Title of the task being modified"),

          // For delete operations - add better task matching
          taskTitle: z
            .string()
            .optional()
            .describe("Title or partial title of task to delete"),
          matchedTaskId: z
            .string()
            .optional()
            .describe("Exact task ID if found"),
          matchedColumnId: z
            .string()
            .optional()
            .describe("Column ID where task was found"),

          // For update operations
          updates: z
            .object({
              title: z.string().optional(),
              description: z.string().optional(),
              assignee: z.string().optional(),
              priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
            })
            .optional()
            .describe("Updates to apply to the task"),
        })
        .optional(),

      // For query operations
      query: z.string().optional().describe("Search query for finding tasks"),
      filters: z
        .object({
          priority: z.string().optional(),
          assignee: z.string().optional(),
          column: z.string().optional(),
          status: z.string().optional(),
        })
        .optional()
        .describe("Filters to apply when searching"),
    })
    .optional(),

  response: z.string().describe("Response message to the user"),
  needsConfirmation: z
    .boolean()
    .optional()
    .describe("Whether the operation needs user confirmation"),
  suggestions: z.array(z.string()).optional().describe("Follow-up suggestions"),
});

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
      columns?.map((col: any) => `${col.id}: ${col.title}`).join(", ") || "";
    const tasksInfo =
      tasks
        ?.slice(0, 20) // Limit to prevent token overflow
        ?.map(
          (task: any) =>
            `${task.id}: "${task.title}" (in ${task.columnTitle}, assigned to ${task.assignee || "unassigned"})`
        )
        ?.join(", ") || "";

    const { object } = await generateObject({
      model: openai("gpt-4o"),
      schema: TaskOperationSchema,
      prompt: `You are an AI assistant that helps users manage tasks in their Kanban board through natural language.

Available columns: ${columnsInfo}
Current tasks: ${tasksInfo}

User message: "${message}"

Analyze the user's message and determine what operation they want to perform:

**CREATE OPERATIONS:**
- Keywords: "create", "add", "new task", "make a task"
- Extract: title, priority, column placement, assignee
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
- Extract: task identifier, target column
- Examples:
  - "Move the login task to Done" → MOVE to Done column
  - "Put the bug fix in testing" → MOVE to testing column

**DELETE OPERATIONS:**
- Keywords: "delete", "remove", "cancel", "drop"
- Extract: task identifier (title, partial match, or ID)
- Examples:
  - "Delete the duplicate task" → DELETE specific task by title match
  - "Remove completed tasks" → DELETE with criteria
  - "Delete the login bug task" → DELETE by title match

**Task Identification for DELETE:**
- Match by exact title when possible
- Use partial title matching for ambiguous requests
- If multiple matches found, ask for clarification
- Always confirm destructive operations
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
- Confirm destructive operations (deletes)

If the message is unclear or could match multiple tasks, ask for clarification rather than guessing.`,
    });

    return NextResponse.json(object);
  } catch (error: any) {
    console.error("Error in chat task management:", error);
    return NextResponse.json(
      { error: "Failed to process message" },
      { status: 500 }
    );
  }
}
