import { Outlet, useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { useState } from "react";
import { Sidebar } from "./Sidebar";

export function Layout() {
  const [q, setQ] = useState("");
  const navigate = useNavigate();

  function onSearch(e: React.FormEvent) {
    e.preventDefault();
    if (q.trim()) navigate(`/search?q=${encodeURIComponent(q.trim())}`);
  }

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 min-h-screen flex flex-col">
        <header className="h-16 border-b border-base-600 bg-base-900/60 backdrop-blur flex items-center px-6 gap-4">
          <form onSubmit={onSearch} className="max-w-md w-full relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search prompts instantly..."
              className="input pl-9"
            />
          </form>
        </header>
        <main className="flex-1 p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
