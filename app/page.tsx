import AddBoardForm from "@/components/add-board-form";
import { auth0 } from "@/lib/auth0";
import { createSupabaseClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { redirect } from "next/navigation";

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
              Organize your tasks, collaborate with your team, and boost your
              productivity with our kanban board.
            </p>
            <div className="flex gap-4">
              <Button
                asChild
                size="lg"
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <a href="/auth/login?screen_hint=signup">Sign up</a>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="border-border text-foreground hover:bg-muted bg-transparent"
              >
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
          <Button
            asChild
            variant="outline"
            className="border-border text-foreground hover:bg-muted bg-transparent"
          >
            <a href="/auth/logout">Log out</a>
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        <AddBoardForm userId={userId} />
      </div>
    </main>
  );
}
