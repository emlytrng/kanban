"use client";

import { useState } from "react";

import { Bot } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useActions, useColumns } from "@/lib/store";
import { TaskOperationResponse } from "@/schemas/task-operation-response";
import type { ChatMessage, Task } from "@/types/chat";

import ChatInput from "./chat/chat-input";
import ChatMessages from "./chat/chat-messages";

interface ChatTaskManagerProps {
  isOpen: boolean;
  onCloseAction: () => void;
}

export default function ChatTaskManager({
  isOpen,
  onCloseAction,
}: ChatTaskManagerProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      type: "assistant",
      content:
        'Hi! I can help you manage your tasks using natural language. Here are some things you can try:\n\n**Create Tasks:**\n• "Create a task to fix the login bug"\n• "Add a high-priority feature for dark mode"\n\n**Find Tasks:**\n• "Show me all high-priority tasks"\n• "Find tasks assigned to John"\n• "What tasks are overdue?"\n\n**Update Tasks:**\n• "Move the login task to Done"\n• "Change the API task priority to urgent"\n• "Assign the bug fix to Sarah"\n\n**Delete Tasks:**\n• "Delete the duplicate authentication task"\n• "Remove completed tasks from last week"',
      timestamp: new Date(),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const { addCard, updateCard, deleteCard, moveCard, chatWithAITaskManager } =
    useActions();
  const columns = useColumns();

  const getAllTasks = (): Task[] => {
    return columns.flatMap((column) =>
      column.cards.map((card) => ({
        ...card,
        columnId: column.id,
        columnTitle: column.title,
      }))
    );
  };

  const findTasksByQuery = (query: string) => {
    const allTasks = getAllTasks();
    const lowerQuery = query.toLowerCase();

    return allTasks.filter(
      (task) =>
        task.title.toLowerCase().includes(lowerQuery) ||
        task.description?.toLowerCase().includes(lowerQuery) ||
        task.assignee?.toLowerCase().includes(lowerQuery)
    );
  };

  const handleSubmit = async (input: string) => {
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Use the store action instead of direct fetch
      const data = (await chatWithAITaskManager(
        input,
        columns,
        getAllTasks
      )) as TaskOperationResponse;

      let operationResult;

      try {
        switch (data.operation?.type) {
          case "create":
            if (data.operation.details) {
              const { title, columnId, columnTitle } = data.operation.details;

              if (!title || !columnId) {
                throw new Error("Missing required fields for task creation");
              }

              addCard(columnId, title || "");
              operationResult = {
                type: "create" as const,
                details: { title, columnTitle },
              };
            }
            break;

          case "query":
            if (data.operation.query) {
              const taskResults = findTasksByQuery(data.operation.query);
              operationResult = {
                type: "query" as const,
                taskResults,
              };
            }
            break;

          case "update":
            if (data.operation.details) {
              const { taskId, columnId, updates } = data.operation.details;

              if (!taskId || !updates) {
                throw new Error("Missing required fields for task update");
              }

              await updateCard(taskId, updates, columnId);
              operationResult = {
                type: "update" as const,
                details: { taskId },
              };
            }
            break;

          case "move":
            if (data.operation.details) {
              const {
                taskId,
                title,
                sourceColumnId,
                targetColumnId,
                sourceColumnTitle,
                targetColumnTitle,
              } = data.operation.details;

              const sourceColumn = columns.find(
                (col) => col.id === sourceColumnId
              );
              const targetColumn = columns.find(
                (col) => col.id === targetColumnId
              );

              if (
                !taskId ||
                !sourceColumnId ||
                !targetColumnId ||
                !sourceColumn ||
                !targetColumn
              ) {
                throw new Error("Missing required fields for task move");
              }

              const sourceIndex = sourceColumn.cards.findIndex(
                (card) => card.id === taskId
              );
              if (sourceIndex !== -1) {
                moveCard(
                  taskId,
                  sourceColumnId,
                  targetColumnId,
                  sourceIndex,
                  targetColumn.cards.length
                );
                operationResult = {
                  type: "move" as const,
                  details: {
                    title,
                    sourceColumnTitle,
                    targetColumnTitle,
                  },
                };
              }
            }
            break;

          case "delete":
            if (data.operation.details) {
              const { taskId, columnId, title } = data.operation.details;

              if (!taskId || !columnId) {
                throw new Error("Missing required fields for task deletion");
              }

              deleteCard(columnId, taskId);
              operationResult = {
                type: "delete" as const,
                details: { title },
              };
            }
            break;
        }
      } catch (error) {
        console.error("Error processing operation:", error);
      }

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content: data.response,
        timestamp: new Date(),
        operation: operationResult,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error processing chat message:", error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content:
          "Sorry, I encountered an error processing your request. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-3xl h-[80vh] max-h-[700px] bg-background border border-border rounded-lg shadow-lg flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-border bg-card">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-card-foreground">
              AI Task Manager
            </h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onCloseAction}
            className="text-muted-foreground hover:text-card-foreground hover:bg-accent"
          >
            ×
          </Button>
        </div>

        {/* Messages Area */}
        <ChatMessages messages={messages} isLoading={isLoading} />

        {/* Input Area */}
        <ChatInput onSubmit={handleSubmit} isLoading={isLoading} />
      </div>
    </div>
  );
}
