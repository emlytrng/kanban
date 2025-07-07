"use client";

import type React from "react";
import { useState } from "react";

import { Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ChatInputProps {
  onSubmit: (message: string) => void;
  isLoading: boolean;
}

export default function ChatInput({ onSubmit, isLoading }: ChatInputProps) {
  const [input, setInput] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    onSubmit(input.trim());
    setInput("");
  };

  return (
    <div className="border-t border-border p-4 bg-muted/30">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask me to create, find, update, or delete tasks..."
          disabled={isLoading}
          className="flex-1 bg-background border-input text-foreground placeholder:text-muted-foreground focus-visible:ring-ring"
          autoFocus
        />
        <Button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
