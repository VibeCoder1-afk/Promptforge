import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await register(name, email, password);
      navigate("/workspace/My Prompts");
    } catch (err: any) {
      setError(err.response?.data?.error || "Could not register");
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
          <h1 className="text-lg font-semibold">Create your account</h1>
          {error && <p className="text-sm text-coral">{error}</p>}
          <div>
            <label className="text-xs text-ink-500">Name</label>
            <input className="input mt-1" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <label className="text-xs text-ink-500">Email</label>
            <input className="input mt-1" value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
          </div>
          <div>
            <label className="text-xs text-ink-500">Password</label>
            <input className="input mt-1" value={password} onChange={(e) => setPassword(e.target.value)} type="password" required minLength={6} />
          </div>
          <button disabled={busy} className="btn-primary w-full">
            {busy ? "Creating..." : "Create account"}
          </button>
          <p className="text-xs text-ink-500 text-center">
            Already have an account? <Link to="/login" className="text-signal-soft">Log in</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
