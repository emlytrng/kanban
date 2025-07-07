"use client";

import { X } from "lucide-react";

import TagManager from "@/components/tag-manager";
import { Button } from "@/components/ui/button";

interface TagManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  boardId: string;
}

export default function TagManagerModal({
  isOpen,
  onClose,
  boardId,
}: TagManagerModalProps) {
  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background border border-border rounded-lg p-6 w-[600px] max-h-[80vh] overflow-y-auto shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">
                Manage Tags
              </h3>
              <Button
                onClick={onClose}
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <TagManager boardId={boardId} />
          </div>
        </div>
      )}
    </>
  );
}
