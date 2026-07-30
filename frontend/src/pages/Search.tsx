import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api, Prompt } from "../lib/api";
import { PromptCard } from "../components/PromptCard";

export default function Search() {
  const [params] = useSearchParams();
  const q = params.get("q") || "";

  const { data = [], isLoading } = useQuery({
    queryKey: ["search", q],
    queryFn: async () => (await api.get<{ prompts: Prompt[] }>("/prompts", { params: { q } })).data.prompts,
    enabled: !!q,
  });

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-2xl font-semibold mb-6">Results for "{q}"</h1>
      {isLoading ? (
        <p className="text-ink-500">Searching...</p>
      ) : data.length === 0 ? (
        <div className="card p-10 text-center text-ink-500">No prompts matched your search.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.map((p) => (
            <PromptCard key={p._id} prompt={p} />
          ))}
        </div>
      )}
    </div>
  );
}
