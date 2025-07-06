import { TaskOperationDetails } from "@/schemas/task-operation-response";

type ChatType = "user" | "assistant";
type OperationType = "create" | "update" | "delete" | "query" | "move";

export type Task = {
  id: string;
  title: string;
  description?: string;
  assignee?: string;
  columnId: string;
  columnTitle: string;
  createdAt: string;
  updatedAt: string;
};

export interface ChatMessage {
  id: string;
  type: ChatType;
  content: string;
  timestamp: Date;
  operation?: {
    type: OperationType;
    details?: TaskOperationDetails;
    taskResults?: Task[];
  };
}
