import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Sparkles, RefreshCcw } from "lucide-react";
import { useState } from "react";
import { api, Prompt } from "../lib/api";
import { PromptCard, PromptCardSkeleton } from "../components/PromptCard";
import { useToast, errorMessage } from "../components/Toast";

export default function Workspace() {
  const { workspaceName = "My Prompts" } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { push } = useToast();
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["prompts", workspaceName],
    queryFn: async () => (await api.get<{ prompts: Prompt[] }>("/prompts", { params: { workspace: workspaceName } })).data.prompts,
  });

  const createMutation = useMutation({
    mutationFn: async () =>
      (await api.post("/prompts", { title: title || "Untitled prompt", workspace: workspaceName, content: "" })).data,
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["prompts", workspaceName] });
      navigate(`/prompt/${res.prompt._id}`);
    },
    onError: (err) => push("error", errorMessage(err, "Couldn't create your prompt.")),
  });

  const favoriteMutation = useMutation({
    mutationFn: async (id: string) => (await api.post(`/prompts/${id}/favorite`)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["prompts", workspaceName] }),
    onError: (err) => push("error", errorMessage(err, "Couldn't update favorite.")),
  });

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">{workspaceName}</h1>
        <button className="btn-primary flex items-center gap-1" onClick={() => setCreating(true)}>
          <Plus size={16} /> New prompt
        </button>
      </div>

      {creating && (
        <div className="card p-4 mb-6 flex items-center gap-3">
          <input
            autoFocus
            className="input"
            placeholder="Prompt title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && createMutation.mutate()}
          />
          <button className="btn-primary" onClick={() => createMutation.mutate()}>
            Create
          </button>
          <button className="btn-ghost" onClick={() => setCreating(false)}>
            Cancel
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <PromptCardSkeleton key={i} />
          ))}
        </div>
      ) : isError ? (
        <div className="card p-10 text-center text-ink-500 space-y-3">
          <p>Couldn't load your prompts.</p>
          <button className="btn-ghost text-xs inline-flex items-center gap-1" onClick={() => refetch()}>
            <RefreshCcw size={13} /> Retry
          </button>
        </div>
      ) : data && data.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.map((p) => (
            <PromptCard
              key={p._id}
              prompt={p}
              isFavorited={false}
              onToggleFavorite={() => favoriteMutation.mutate(p._id)}
            />
          ))}
        </div>
      ) : (
        <div className="card p-10 text-center text-ink-500 space-y-2">
          <Sparkles className="mx-auto text-signal" size={28} />
          <p>
            You haven't created any prompts yet in <span className="text-ink-100">{workspaceName}</span>.
          </p>
          <button className="btn-primary text-sm" onClick={() => setCreating(true)}>
            Create your first prompt
          </button>
        </div>
      )}
    </div>
  );
}
