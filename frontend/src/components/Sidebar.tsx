import { NavLink } from "react-router-dom";
import { LayoutGrid, BarChart3, Globe2, Users, Star, LogOut, Sparkles } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const workspaces = ["My Prompts", "Marketing", "Coding", "Interview", "Research", "Email Generator"];

export function Sidebar() {
  const { user, logout } = useAuth();

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
      isActive ? "bg-signal/15 text-signal-soft" : "text-ink-300 hover:bg-base-700 hover:text-ink-100"
    }`;

  return (
    <aside className="w-64 shrink-0 h-screen border-r border-base-600 bg-base-900 flex flex-col">
      <div className="px-5 py-5 flex items-center gap-2 border-b border-base-600">
        <Sparkles size={20} className="text-signal" />
        <span className="font-semibold tracking-tight text-lg">PromptForge</span>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        <div>
          <p className="px-3 text-xs uppercase tracking-wider text-ink-500 mb-1">Workspace</p>
          {workspaces.map((w) => (
            <NavLink key={w} to={`/workspace/${encodeURIComponent(w)}`} className={linkClass}>
              <LayoutGrid size={16} />
              {w}
            </NavLink>
          ))}
        </div>

        <div>
          <p className="px-3 text-xs uppercase tracking-wider text-ink-500 mb-1">Discover</p>
          <NavLink to="/favorites" className={linkClass}>
            <Star size={16} /> Favorites
          </NavLink>
          <NavLink to="/gallery" className={linkClass}>
            <Globe2 size={16} /> Public Gallery
          </NavLink>
        </div>

        <div>
          <p className="px-3 text-xs uppercase tracking-wider text-ink-500 mb-1">Insights</p>
          <NavLink to="/analytics" className={linkClass}>
            <BarChart3 size={16} /> Analytics
          </NavLink>
          <NavLink to="/team" className={linkClass}>
            <Users size={16} /> Team Workspace
          </NavLink>
        </div>
      </nav>

      <div className="px-4 py-4 border-t border-base-600 flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold text-white shrink-0"
            style={{ backgroundColor: user?.avatarColor || "#7C5CFF" }}
          >
            {user?.name?.[0]?.toUpperCase() || "?"}
          </div>
          <span className="text-sm text-ink-300 truncate">{user?.name}</span>
        </div>
        <button onClick={logout} className="text-ink-500 hover:text-coral" title="Log out">
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  );
}
