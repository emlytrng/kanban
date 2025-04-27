import KanbanBoard from "@/components/kanban-board";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-6">
          Collaborative Kanban Board
        </h1>
        <KanbanBoard />
      </div>
    </main>
  );
}
