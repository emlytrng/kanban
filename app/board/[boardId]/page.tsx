import { redirect } from "next/navigation";

import KanbanBoard from "@/components/kanban-board";
import { Button } from "@/components/ui/button";
import { auth0 } from "@/lib/auth0";

interface BoardPageProps {
  params: Promise<{
    boardId: string;
  }>;
}

export default async function BoardPage({ params }: BoardPageProps) {
  const { boardId } = await params;
  const session = await auth0.getSession();

  if (!session?.user) {
    redirect("/");
  }

  return (
    <main className="h-screen bg-background text-foreground flex flex-col">
      <div className="px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">kanban</h1>
          <Button
            asChild
            variant="outline"
            className="border-border text-foreground hover:bg-muted bg-transparent"
          >
            <a href="/auth/logout">Log out</a>
          </Button>
        </div>
      </div>
      <KanbanBoard boardId={boardId} />
    </main>
  );
}
