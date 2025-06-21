import KanbanBoard from "@/components/kanban-board";
import AddBoardForm from "@/components/add-board-form";
import { auth0 } from "@/lib/auth0";
import { createSupabaseClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";

export default async function Home() {
  const session = await auth0.getSession();

  if (!session?.user) {
    return (
      <main className="min-h-screen bg-background p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl md:text-3xl font-bold">kanban</h1>
          </div>

          <div className="flex flex-col items-center justify-center mt-20 text-center">
            <p className="text-lg text-muted-foreground max-w-2xl mb-8">
              Organize your tasks, collaborate with your team, and boost your
              productivity with our Kanban board.
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

  return (
    <main className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl md:text-3xl font-bold">kanban</h1>
          <Button asChild variant="outline">
            <a href="/auth/logout">Log out</a>
          </Button>
        </div>

        {hasBoards ? (
          <KanbanBoard userId={userId} />
        ) : (
          <div className="mt-10">
            <AddBoardForm userId={userId} />
          </div>
        )}
      </div>
    </main>
  );
}
