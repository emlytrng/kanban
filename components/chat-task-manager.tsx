"use client";

import { useState } from "react";

import { Bot } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useActions, useColumns } from "@/lib/store";
import type { ChatMessage } from "@/types/chat";

import ChatInput from "./chat/chat-input";
import ChatMessages from "./chat/chat-messages";

interface ChatTaskManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ChatTaskManager({
  isOpen,
  onClose,
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

  const { addCard, updateCard, deleteCard, moveCard } = useActions();
  const columns = useColumns();

  const getAllTasks = () => {
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
      const allTasks = getAllTasks();

      const response = await fetch("/api/ai/chat-task-management", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: input,
          columns: columns.map((col) => ({ id: col.id, title: col.title })),
          tasks: allTasks,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to process message");
      }

      const data = await response.json();

      // Execute the operation based on AI response
      let operationResult;

      switch (data.operation?.type) {
        case "create":
          if (data.operation.details) {
            const { title, columnId } = data.operation.details;
            const targetColumn =
              columns.find((col) => col.id === columnId) || columns[0];
            if (targetColumn) {
              addCard(targetColumn.id, title);
              operationResult = {
                type: "create" as const,
                details: { title, columnTitle: targetColumn.title },
              };
            }
          }
          break;

        case "query":
          if (data.operation.query) {
            const results = findTasksByQuery(data.operation.query);
            operationResult = {
              type: "query" as const,
              details: { query: data.operation.query },
              results,
            };
          }
          break;

        case "update":
          if (data.operation.details) {
            const { taskId, updates, columnId } = data.operation.details;
            if (updates) {
              await updateCard(columnId, taskId, updates);
              operationResult = {
                type: "update" as const,
                details: { taskId, updates },
              };
            }
          }
          break;

        case "move":
          if (data.operation.details) {
            const { taskId, sourceColumnId, targetColumnId, taskTitle } =
              data.operation.details;
            const sourceColumn = columns.find(
              (col) => col.id === sourceColumnId
            );
            const targetColumn = columns.find(
              (col) => col.id === targetColumnId
            );

            if (sourceColumn && targetColumn) {
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
                    taskTitle,
                    sourceColumn: sourceColumn.title,
                    targetColumn: targetColumn.title,
                  },
                };
              }
            }
          }
          break;

        case "delete":
          if (data.operation.details) {
            const { taskId, columnId, taskTitle } = data.operation.details;
            // Find the task if taskId is not provided
            if (!taskId && taskTitle) {
              const allTasks = getAllTasks();
              const foundTask = allTasks.find((task) =>
                task.title.toLowerCase().includes(taskTitle.toLowerCase())
              );
              if (foundTask) {
                deleteCard(foundTask.columnId, foundTask.id);
                operationResult = {
                  type: "delete" as const,
                  details: { taskTitle: foundTask.title },
                };
              }
            } else if (taskId && columnId) {
              deleteCard(columnId, taskId);
              operationResult = {
                type: "delete" as const,
                details: { taskTitle },
              };
            }
          }
          break;
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
        {/* Fixed Header */}
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
            onClick={onClose}
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
