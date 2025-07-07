import type { TaskOperationResponse } from "@/schemas/task-operation-response";

import type { Board, Card, Column } from "./index";

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

// Card API responses
export type CreateCardResponse = {
  card: Card;
};

export type UpdateCardResponse = {
  card: Card;
};

export type DeleteCardResponse = {
  success: true;
};

export type MoveCardResponse = {
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
