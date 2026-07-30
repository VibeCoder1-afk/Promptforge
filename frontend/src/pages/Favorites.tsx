import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, Prompt } from "../lib/api";
import { PromptCard } from "../components/PromptCard";

export default function Favorites() {
  const queryClient = useQueryClient();

  const { data = [], isLoading } = useQuery({
    queryKey: ["prompts", "favorites"],
    queryFn: async () => (await api.get<{ prompts: Prompt[] }>("/prompts", { params: { favorites: "true" } })).data.prompts,
  });

  const favoriteMutation = useMutation({
    mutationFn: async (id: string) => (await api.post(`/prompts/${id}/favorite`)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["prompts", "favorites"] }),
  });

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-2xl font-semibold mb-6">Favorites</h1>
      {isLoading ? (
        <p className="text-ink-500">Loading...</p>
      ) : data.length === 0 ? (
        <div className="card p-10 text-center text-ink-500">No favorites yet — star a prompt to bookmark it here.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.map((p) => (
            <PromptCard key={p._id} prompt={p} isFavorited onToggleFavorite={() => favoriteMutation.mutate(p._id)} />
          ))}
        </div>
      )}
    </div>
  );
}
