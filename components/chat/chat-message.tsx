"use client";

import { Bot, User } from "lucide-react";

import { cn } from "@/lib/utils";
import type { ChatMessage as ChatMessageType } from "@/types/chat";

import OperationResult from "./operation-result";

interface ChatMessageProps {
  message: ChatMessageType;
}

export default function ChatMessage({ message }: ChatMessageProps) {
  return (
    <div
      className={cn(
        "flex gap-3",
        message.type === "user" ? "justify-end" : "justify-start"
      )}
    >
      {message.type === "assistant" && (
        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0 mt-1">
          <Bot className="h-4 w-4 text-primary" />
        </div>
      )}

      <div
        className={cn(
          "max-w-[80%] rounded-lg px-4 py-2",
          message.type === "user"
            ? "bg-primary text-primary-foreground ml-auto"
            : "bg-muted/50 text-foreground"
        )}
      >
        <div className="whitespace-pre-wrap text-sm">{message.content}</div>

        <OperationResult operation={message.operation} />

        <div className="text-xs opacity-70 mt-2">
          {message.timestamp.toLocaleTimeString()}
        </div>
      </div>

      {message.type === "user" && (
        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0 mt-1">
          <User className="h-4 w-4 text-secondary-foreground" />
        </div>
      )}
    </div>
  );
}
