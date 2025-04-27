import KanbanBoard from "@/components/kanban-board";
import AddBoardForm from "@/components/add-board-form";
import { auth0 } from "@/lib/auth0";
import { syncUserToDb } from "@/lib/actions";
import { supabase } from "@/lib/supabase";

export default async function Home() {
  const session = await auth0.getSession();

  let userId;
  if (session?.user) {
    const result = await syncUserToDb();
    userId = result.userId;
  }

  if (!session?.user) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-white">
              Collaborative Kanban Board
            </h1>
          </div>

          <div className="flex flex-col items-center justify-center mt-20 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Welcome to Kanban Board
            </h2>
            <p className="text-lg text-slate-300 max-w-2xl mb-8">
              Organize your tasks, collaborate with your team, and boost your
              productivity with our Kanban board.
            </p>
            <div className="flex gap-4">
              <a
                href="/auth/login?screen_hint=signup"
                className="bg-white text-slate-900 px-6 py-2 rounded-md font-medium hover:bg-slate-100 transition-colors"
              >
                Sign up
              </a>
              <a
                href="/auth/login"
                className="bg-transparent border border-white text-white px-6 py-2 rounded-md font-medium hover:bg-white/10 transition-colors"
              >
                Log in
              </a>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const { data: boardMembers } = await supabase
    .from("board_members")
    .select("board_id")
    .eq("user_id", userId)
    .limit(1);

  const hasBoards = boardMembers && boardMembers.length > 0;

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-white">
            Collaborative Kanban Board
          </h1>
          <a
            href="/auth/logout"
            className="bg-transparent border border-white text-white px-4 py-1 rounded-md text-sm font-medium hover:bg-white/10 transition-colors"
          >
            Log out
          </a>
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
