"use client";

import TagManager from "@/components/tags/tag-manager";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage tags</DialogTitle>
        </DialogHeader>
        <TagManager boardId={boardId} />
      </DialogContent>
    </Dialog>
  );
}
