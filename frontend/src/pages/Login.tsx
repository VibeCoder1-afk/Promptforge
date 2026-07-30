import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login, loginDemo } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await login(email, password);
      navigate("/workspace/My Prompts");
    } catch (err: any) {
      setError(err.response?.data?.error || "Could not log in");
    } finally {
      setBusy(false);
    }
  }

  async function onTryDemo() {
    setError("");
    setBusy(true);
    try {
      await loginDemo();
      navigate("/workspace/My Prompts");
    } catch (err: any) {
      setError(err.response?.data?.error || "Demo login is unavailable right now.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 justify-center mb-8">
          <Sparkles className="text-signal" />
          <span className="text-xl font-semibold">PromptForge</span>
        </div>
        <form onSubmit={onSubmit} className="card p-6 space-y-4">
          <h1 className="text-lg font-semibold">Log in</h1>
          {error && <p className="text-sm text-coral">{error}</p>}
          <div>
            <label className="text-xs text-ink-500">Email</label>
            <input className="input mt-1" value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
          </div>
          <div>
            <label className="text-xs text-ink-500">Password</label>
            <input className="input mt-1" value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />
          </div>
          <button disabled={busy} className="btn-primary w-full">
            {busy ? "Logging in..." : "Log in"}
          </button>
          <p className="text-xs text-ink-500 text-center">
            No account? <Link to="/register" className="text-signal-soft">Register</Link>
          </p>
          <div className="border-t border-base-600 pt-3">
            <button
              type="button"
              disabled={busy}
              onClick={onTryDemo}
              className="btn-ghost w-full text-xs flex items-center justify-center gap-1.5"
            >
              <Sparkles size={13} /> Try the demo account
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
