import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { GitFork } from "lucide-react";
import { api, Prompt } from "../lib/api";

export default function Gallery() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: prompts = [], isLoading } = useQuery({
    queryKey: ["gallery"],
    queryFn: async () => (await api.get<{ prompts: Prompt[] }>("/gallery")).data.prompts,
  });

  const forkMutation = useMutation({
    mutationFn: async (id: string) => (await api.post(`/gallery/${id}/fork`)).data,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["prompts"] });
      navigate(`/prompt/${data.prompt._id}`);
    },
  });

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-2xl font-semibold mb-6">Public Gallery</h1>
      {isLoading ? (
        <p className="text-ink-500">Loading...</p>
      ) : prompts.length === 0 ? (
        <div className="card p-10 text-center text-ink-500">
          Nothing published yet. Publish a prompt from its editor to share it here.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {prompts.map((p: any) => (
            <div key={p._id} className="card p-4 space-y-3">
              <div>
                <p className="font-medium">{p.title}</p>
                <p className="text-xs text-ink-500">by {p.owner?.name || "someone"}</p>
              </div>
              <p className="text-sm text-ink-500 line-clamp-2">{p.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-ink-500 flex items-center gap-1">
                  <GitFork size={12} /> {p.forkCount} forks
                </span>
                <button className="btn-ghost text-xs" onClick={() => forkMutation.mutate(p._id)}>
                  Fork
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
