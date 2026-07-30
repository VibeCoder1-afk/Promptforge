import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Play } from "lucide-react";
import { api, Evaluation } from "../lib/api";
import { EvaluationCard } from "./EvaluationCard";

const PROVIDERS = [
  { provider: "groq", label: "Groq (Llama 3.3)" },
  { provider: "gemini", label: "Gemini" },
  { provider: "mistral", label: "Mistral" },
];

export function ModelComparePanel({
  promptId,
  versionId,
  variableValues,
}: {
  promptId: string;
  versionId: string;
  variableValues: Record<string, string>;
}) {
  const [selected, setSelected] = useState<string[]>(["groq", "gemini", "mistral"]);
  const [results, setResults] = useState<Evaluation[] | null>(null);

  const compareMutation = useMutation({
    mutationFn: async () =>
      (
        await api.post("/evaluate/compare", {
          promptId,
          versionId,
          providers: selected.map((p) => ({ provider: p })),
          variableValues,
        })
      ).data,
    onSuccess: (data) => setResults(data.evaluations),
  });

  function toggle(p: string) {
    setSelected((s) => (s.includes(p) ? s.filter((x) => x !== p) : [...s, p]));
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {PROVIDERS.map((p) => (
            <button
              key={p.provider}
              onClick={() => toggle(p.provider)}
              className={`pill border ${
                selected.includes(p.provider) ? "bg-signal/20 border-signal text-signal-soft" : "border-base-600 text-ink-500"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        <button
          disabled={selected.length === 0 || compareMutation.isPending}
          onClick={() => compareMutation.mutate()}
          className="btn-primary flex items-center gap-1 text-xs"
        >
          <Play size={14} /> {compareMutation.isPending ? "Running..." : "Compare models"}
        </button>
      </div>

      {results && (
        <div
          className={`grid gap-3 grid-cols-1 ${
            results.length === 1 ? "md:grid-cols-1" : results.length === 2 ? "md:grid-cols-2" : "md:grid-cols-3"
          }`}
        >
          {results.map((r) => (
            <EvaluationCard key={r._id} evaluation={r} />
          ))}
        </div>
      )}
    </div>
  );
}
