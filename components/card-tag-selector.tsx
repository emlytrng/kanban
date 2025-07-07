"use client";

import { useState } from "react";

import { Check, ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTags, useActions } from "@/lib/store";
import type { Tag } from "@/types";

interface CardTagSelectorProps {
  cardId: string;
  selectedTags: Tag[];
  disabled?: boolean;
}

export default function CardTagSelector({
  cardId,
  selectedTags,
  disabled = false,
}: CardTagSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const availableTags = useTags();
  const { updateCardTags } = useActions();
  const selectedTagIds = selectedTags.map((tag) => tag.id);

  const toggleTag = async (tagId: string) => {
    const isSelected = selectedTagIds.includes(tagId);
    let newTagIds: string[];

    if (isSelected) {
      newTagIds = selectedTagIds.filter((id) => id !== tagId);
    } else {
      newTagIds = [...selectedTagIds, tagId];
    }

    await updateCardTags(cardId, newTagIds);
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-foreground">Tags</label>

      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-between bg-input border-border text-foreground hover:bg-accent"
            disabled={disabled || availableTags.length === 0}
          >
            <div className="flex flex-wrap gap-1 flex-1 min-h-[20px]">
              {selectedTags.length > 0 ? (
                selectedTags.map((tag) => (
                  <span
                    key={tag.id}
                    className="px-2 py-0.5 text-xs font-medium rounded-full text-white"
                    style={{ backgroundColor: tag.color }}
                  >
                    {tag.name}
                  </span>
                ))
              ) : (
                <span className="text-muted-foreground">
                  {availableTags.length === 0
                    ? "No tags available"
                    : "Select tags..."}
                </span>
              )}
            </div>
            <ChevronDown className="h-4 w-4 opacity-50 flex-shrink-0 ml-2" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent className="w-full min-w-[200px] bg-popover border-border">
          <div className="p-2 space-y-1">
            {availableTags.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-2">
                No tags available for this board
              </div>
            ) : (
              availableTags.map((tag) => (
                <div
                  key={tag.id}
                  className="flex items-center gap-2 p-2 rounded-md hover:bg-accent cursor-pointer"
                  onClick={() => toggleTag(tag.id)}
                >
                  <div className="flex items-center gap-2 flex-1">
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: tag.color }}
                    />
                    <span className="text-sm text-popover-foreground">
                      {tag.name}
                    </span>
                  </div>
                  {selectedTagIds.includes(tag.id) && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </div>
              ))
            )}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
