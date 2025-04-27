import KanbanBoard from "@/components/kanban-board";
import { auth0 } from "@/lib/auth0";

export default async function Home() {
  const session = await auth0.getSession();

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
            <a href="/auth/login?screen_hint=signup">Sign up</a>
            <a href="/auth/login">Log in</a>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-white">
            Collaborative Kanban Board
          </h1>
          <a href="/auth/logout">Log out</a>
        </div>
        <KanbanBoard />
      </div>
    </main>
  );
}
