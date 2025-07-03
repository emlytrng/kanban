import type { Card as TaskCard } from "./index";

export interface ChatMessage {
  id: string;
  type: "user" | "assistant";
  content: string;
  timestamp: Date;
  operation?: {
    type: "create" | "update" | "delete" | "query" | "move";
    details: any;
    results?: TaskCard[];
  };
}
