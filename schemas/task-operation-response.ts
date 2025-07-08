import { z } from "zod";

export const TaskOperationDetailsSchema = z
  .object({
    title: z.string().optional().describe("Task title for creation"),
    description: z.string().optional().describe("Task description"),

    columnId: z
      .string()
      .optional()
      .describe("Column ID to place or delete the task"),
    columnTitle: z
      .string()
      .optional()
      .describe("Title of the column to place or delete the task"),
    taskId: z.string().optional().describe("ID of the task to modify"),
    sourceColumnId: z
      .string()
      .optional()
      .describe("Source column ID for moves"),
    sourceColumnTitle: z
      .string()
      .optional()
      .describe("Source column title for moves"),
    targetColumnId: z
      .string()
      .optional()
      .describe("Target column ID for moves"),
    targetColumnTitle: z
      .string()
      .optional()
      .describe("Target column title for moves"),
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
  .optional();

export const TaskOperationResponseSchema = z.object({
  operation: z
    .object({
      type: z
        .enum(["create", "read", "update", "delete", "move", "query"])
        .describe("Type of operation to perform"),
      details: TaskOperationDetailsSchema,
      query: z.string().optional().describe("Search query for finding tasks"),
      filters: z
        .object({
          column: z.string().optional(),
        })
        .optional()
        .describe("Filters to apply when searching"),
    })
    .optional(),
  response: z.string().describe("Response message to the user"),
  suggestions: z.array(z.string()).optional().describe("Follow-up suggestions"),
});

export type TaskOperationResponse = z.infer<typeof TaskOperationResponseSchema>;
export type TaskOperationDetails = z.infer<typeof TaskOperationDetailsSchema>;
