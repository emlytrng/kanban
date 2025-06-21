"use client";

import type React from "react";

import { useState, useRef, useEffect } from "react";
import {
  Send,
  Bot,
  User,
  Loader2,
  Plus,
  Edit,
  Trash2,
  Search,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useActions, useColumns } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { Card as TaskCard } from "@/types";

interface ChatMessage {
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
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { addCard, updateCard, deleteCard, moveCard } = useActions();
  const columns = useColumns();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const allTasks = getAllTasks();

      const response = await fetch("/api/ai/chat-task-management", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: input.trim(),
          columns: columns.map((col) => ({ id: col.id, title: col.title })),
          tasks: allTasks,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to process message");
      }

      const data = await response.json();

      // Execute the operation based on AI response
      let operationResult = null;

      switch (data.operation?.type) {
        case "create":
          if (data.operation.details) {
            const { title, columnId } = data.operation.details;
            const targetColumn =
              columns.find((col) => col.id === columnId) || columns[0];
            if (targetColumn) {
              await addCard(targetColumn.id, title);
              operationResult = {
                type: "create",
                details: { title, columnTitle: targetColumn.title },
              };
            }
          }
          break;

        case "query":
          if (data.operation.query) {
            const results = findTasksByQuery(data.operation.query);
            operationResult = {
              type: "query",
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
                type: "update",
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
                await moveCard(
                  taskId,
                  sourceColumnId,
                  targetColumnId,
                  sourceIndex,
                  targetColumn.cards.length
                );
                operationResult = {
                  type: "move",
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
                await deleteCard(foundTask.columnId, foundTask.id);
                operationResult = {
                  type: "delete",
                  details: { taskTitle: foundTask.title },
                };
              }
            } else if (taskId && columnId) {
              await deleteCard(columnId, taskId);
              operationResult = {
                type: "delete",
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

  const renderOperationResult = (operation: ChatMessage["operation"]) => {
    if (!operation) return null;

    const getIcon = () => {
      switch (operation.type) {
        case "create":
          return <Plus className="h-4 w-4 text-green-600" />;
        case "update":
        case "move":
          return <Edit className="h-4 w-4 text-blue-600" />;
        case "delete":
          return <Trash2 className="h-4 w-4 text-red-600" />;
        case "query":
          return <Search className="h-4 w-4 text-purple-600" />;
        default:
          return <CheckCircle className="h-4 w-4 text-green-600" />;
      }
    };

    const getColor = () => {
      switch (operation.type) {
        case "create":
          return "text-green-600";
        case "update":
        case "move":
          return "text-blue-600";
        case "delete":
          return "text-red-600";
        case "query":
          return "text-purple-600";
        default:
          return "text-green-600";
      }
    };

    const getTitle = () => {
      switch (operation.type) {
        case "create":
          return "Task Created";
        case "update":
          return "Task Updated";
        case "move":
          return "Task Moved";
        case "delete":
          return "Task Deleted";
        case "query":
          return "Search Results";
        default:
          return "Operation Complete";
      }
    };

    return (
      <div className="mt-3 p-3 bg-background rounded border">
        <div className="flex items-center gap-2 mb-2">
          {getIcon()}
          <span className={cn("text-sm font-medium", getColor())}>
            {getTitle()}
          </span>
        </div>

        {operation.type === "create" && (
          <div className="text-sm">
            <div className="font-medium">{operation.details.title}</div>
            <div className="text-muted-foreground mt-1">
              Added to{" "}
              <Badge variant="outline">{operation.details.columnTitle}</Badge>
            </div>
          </div>
        )}

        {operation.type === "move" && (
          <div className="text-sm">
            <div className="font-medium">{operation.details.taskTitle}</div>
            <div className="text-muted-foreground mt-1">
              Moved from{" "}
              <Badge variant="outline">{operation.details.sourceColumn}</Badge>{" "}
              to{" "}
              <Badge variant="outline">{operation.details.targetColumn}</Badge>
            </div>
          </div>
        )}

        {operation.type === "delete" && (
          <div className="text-sm">
            <div className="font-medium">{operation.details.taskTitle}</div>
            <div className="text-muted-foreground mt-1">
              Task has been deleted
            </div>
          </div>
        )}

        {operation.type === "update" && (
          <div className="text-sm">
            <div className="font-medium">Task updated successfully</div>
            <div className="text-muted-foreground mt-1">
              Changes have been applied
            </div>
          </div>
        )}

        {operation.type === "query" && operation.results && (
          <div className="text-sm space-y-2">
            <div className="font-medium">
              Found {operation.results.length} task(s)
            </div>
            {operation.results.slice(0, 5).map((task: any) => (
              <div key={task.id} className="p-2 bg-muted rounded text-xs">
                <div className="font-medium">{task.title}</div>
                <div className="text-muted-foreground mt-1">
                  In{" "}
                  <Badge variant="outline" className="text-xs">
                    {task.columnTitle}
                  </Badge>
                  {task.assignee && (
                    <>
                      {" • "}
                      Assigned to {task.assignee}
                    </>
                  )}
                </div>
              </div>
            ))}
            {operation.results.length > 5 && (
              <div className="text-muted-foreground text-xs">
                And {operation.results.length - 5} more task(s)...
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-3xl h-[80vh] max-h-[700px] bg-background rounded-lg shadow-lg flex flex-col overflow-hidden">
        {/* Fixed Header */}
        <div className="flex items-center justify-between p-6 border-b bg-background">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">AI Assistant</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            ×
          </Button>
        </div>

        {/* Scrollable Messages Area */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex gap-3",
                  message.type === "user" ? "justify-end" : "justify-start"
                )}
              >
                {message.type === "assistant" && (
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                )}

                <div
                  className={cn(
                    "max-w-[80%] rounded-lg px-4 py-2",
                    message.type === "user"
                      ? "bg-primary text-primary-foreground ml-auto"
                      : "bg-muted"
                  )}
                >
                  <div className="whitespace-pre-wrap text-sm">
                    {message.content}
                  </div>

                  {renderOperationResult(message.operation)}

                  <div className="text-xs text-muted-foreground mt-2">
                    {message.timestamp.toLocaleTimeString()}
                  </div>
                </div>

                {message.type === "user" && (
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0 mt-1">
                    <User className="h-4 w-4" />
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
                <div className="bg-muted rounded-lg px-4 py-2">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">
                      Processing...
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div ref={messagesEndRef} />
        </div>

        {/* Fixed Input Area */}
        <div className="border-t p-4 bg-background">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me to create, find, update, or delete tasks..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button type="submit" disabled={isLoading || !input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>

          <div className="mt-2 text-xs text-muted-foreground">
            Try: "Show me all high-priority tasks" • "Move the login task to
            Done" • "Delete completed tasks"
          </div>
        </div>
      </div>
    </div>
  );
}
