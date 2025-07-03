"use client";

import { Plus, Edit, Trash2, Search, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/types/chat";

interface OperationResultProps {
  operation: ChatMessage["operation"];
}

export default function OperationResult({ operation }: OperationResultProps) {
  if (!operation) return null;

  const getIcon = () => {
    switch (operation.type) {
      case "create":
        return <Plus className="h-4 w-4 text-green-400" />;
      case "update":
      case "move":
        return <Edit className="h-4 w-4 text-blue-400" />;
      case "delete":
        return <Trash2 className="h-4 w-4 text-red-400" />;
      case "query":
        return <Search className="h-4 w-4 text-purple-400" />;
      default:
        return <CheckCircle className="h-4 w-4 text-green-400" />;
    }
  };

  const getColor = () => {
    switch (operation.type) {
      case "create":
        return "text-green-400";
      case "update":
      case "move":
        return "text-blue-400";
      case "delete":
        return "text-red-400";
      case "query":
        return "text-purple-400";
      default:
        return "text-green-400";
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
    <div className="mt-3 p-3 bg-card border border-border rounded-lg">
      <div className="flex items-center gap-2 mb-2">
        {getIcon()}
        <span className={cn("text-sm font-medium", getColor())}>
          {getTitle()}
        </span>
      </div>

      {operation.type === "create" && (
        <CreateOperationDetails details={operation.details} />
      )}

      {operation.type === "move" && (
        <MoveOperationDetails details={operation.details} />
      )}

      {operation.type === "delete" && (
        <DeleteOperationDetails details={operation.details} />
      )}

      {operation.type === "update" && <UpdateOperationDetails />}

      {operation.type === "query" && operation.results && (
        <QueryOperationDetails
          details={operation.details}
          results={operation.results}
        />
      )}
    </div>
  );
}

function CreateOperationDetails({ details }: { details: any }) {
  return (
    <div className="text-sm">
      <div className="font-medium text-card-foreground">{details.title}</div>
      <div className="text-muted-foreground mt-1">
        Added to{" "}
        <Badge variant="outline" className="border-border">
          {details.columnTitle}
        </Badge>
      </div>
    </div>
  );
}

function MoveOperationDetails({ details }: { details: any }) {
  return (
    <div className="text-sm">
      <div className="font-medium text-card-foreground">
        {details.taskTitle}
      </div>
      <div className="text-muted-foreground mt-1">
        Moved from{" "}
        <Badge variant="outline" className="border-border">
          {details.sourceColumn}
        </Badge>{" "}
        to{" "}
        <Badge variant="outline" className="border-border">
          {details.targetColumn}
        </Badge>
      </div>
    </div>
  );
}

function DeleteOperationDetails({ details }: { details: any }) {
  return (
    <div className="text-sm">
      <div className="font-medium text-card-foreground">
        {details.taskTitle}
      </div>
      <div className="text-muted-foreground mt-1">Task has been deleted</div>
    </div>
  );
}

function UpdateOperationDetails() {
  return (
    <div className="text-sm">
      <div className="font-medium text-card-foreground">
        Task updated successfully
      </div>
      <div className="text-muted-foreground mt-1">
        Changes have been applied
      </div>
    </div>
  );
}

function QueryOperationDetails({
  details,
  results,
}: {
  details: any;
  results: any[];
}) {
  return (
    <div className="text-sm space-y-2">
      <div className="font-medium text-card-foreground">
        Found {results.length} task(s)
      </div>
      {results.slice(0, 5).map((task: any) => (
        <div
          key={task.id}
          className="p-2 bg-muted rounded-md text-xs border border-border"
        >
          <div className="font-medium text-foreground">{task.title}</div>
          <div className="text-muted-foreground mt-1">
            In{" "}
            <Badge variant="outline" className="text-xs border-border">
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
      {results.length > 5 && (
        <div className="text-muted-foreground text-xs">
          And {results.length - 5} more task(s)...
        </div>
      )}
    </div>
  );
}
