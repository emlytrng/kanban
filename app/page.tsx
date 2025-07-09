import { redirect } from "next/navigation";

import AddBoardModal from "@/components/board/add-board-modal";
import { Button } from "@/components/ui/button";
import { auth0 } from "@/lib/auth0";
import { createSupabaseClient } from "@/lib/supabase";

export default async function Home() {
  const session = await auth0.getSession();

  if (!session?.user) {
    return (
      <main className="h-screen bg-background text-foreground flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-foreground">kanban</h1>
            <div />
          </div>
        </div>

        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col items-center justify-center mt-20 text-center">
            <p className="text-lg text-muted-foreground max-w-2xl mb-8">
              Organize your tasks and boost your productivity with our kanban
              board.
            </p>
            <div className="flex gap-4">
              <Button asChild size="lg">
                <a href="/auth/login?screen_hint=signup">Sign up</a>
              </Button>
              <Button asChild variant="outline" size="lg">
                <a href="/auth/login">Log in</a>
              </Button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const supabase = await createSupabaseClient();
  const userId = session.user["user_id"];

  const { data: boardMembers } = await supabase
    .from("board_members")
    .select("board_id")
    .eq("user_id", userId)
    .limit(1);

  const hasBoards = boardMembers && boardMembers.length > 0;

  if (hasBoards) {
    // Redirect to the first board
    redirect(`/board/${boardMembers[0].board_id}`);
  }

  return (
    <main className="h-screen bg-background text-foreground flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">kanban</h1>
          <Button asChild variant="outline">
            <a href="/auth/logout">Log out</a>
          </Button>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-md mx-auto text-center">
          <div className="w-24 h-24 mx-auto mb-6 bg-muted rounded-full flex items-center justify-center">
            <svg
              className="w-12 h-12 text-muted-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2h2a2 2 0 002-2z"
              />
            </svg>
          </div>
          <p className="text-muted-foreground mb-8">
            Get started by creating your first board to organize your tasks and
            boost your productivity.
          </p>
          <AddBoardModal />
        </div>
      </div>
    </main>
  );
}
