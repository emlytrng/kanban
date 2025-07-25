import type { TaskOperationResponse } from "@/schemas/task-operation-response";

import type { Board, Task, Column, Tag } from "./index";

// Base API response types
export type ApiResponse<T = unknown> = {
  data?: T;
  error?: string;
  success?: boolean;
};

export type ApiError = {
  error: string;
};

// Board API responses
export type GetBoardsResponse = {
  boards: Board[];
};

export type CreateBoardResponse = {
  boardId: string;
};

export type DeleteBoardResponse = {
  success: true;
};

export type GetBoardResponse = {
  board: Board;
  columns: Column[];
};

// Task API responses
export type CreateTaskResponse = {
  task: Task;
};

export type UpdateTaskResponse = {
  task: Task;
};

export type DeleteTaskResponse = {
  success: true;
};

export type MoveTaskResponse = {
  success: true;
};

// Column API responses
export type CreateColumnResponse = {
  column: Column;
};

export type DeleteColumnResponse = {
  success: true;
};

export type ReorderColumnsResponse = {
  success: true;
};

// AI API responses
export type ChatTaskManagementResponse = TaskOperationResponse;

// Tag API responses
export interface GetTagsResponse {
  tags: Tag[];
}

export interface CreateTagResponse {
  tag: Tag;
}

export interface UpdateTagResponse {
  tag: Tag;
}

export interface DeleteTagResponse {
  success: boolean;
}

export interface UpdateTaskTagsResponse {
  success: boolean;
}
