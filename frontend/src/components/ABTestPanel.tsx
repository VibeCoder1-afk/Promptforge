import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Play } from "lucide-react";
import { api, Evaluation, PromptVersion } from "../lib/api";
import { EvaluationCard } from "./EvaluationCard";

export function ABTestPanel({
  promptId,
  variableValues,
}: {
  promptId: string;
  variableValues: Record<string, string>;
}) {
  const [versionAId, setVersionAId] = useState("");
  const [versionBId, setVersionBId] = useState("");
  const [provider, setProvider] = useState("groq");
  const [result, setResult] = useState<{ evaluationA: Evaluation; evaluationB: Evaluation } | null>(null);

  const { data: versions = [] } = useQuery({
    queryKey: ["versions", promptId],
    queryFn: async () => (await api.get<{ versions: PromptVersion[] }>(`/prompts/${promptId}/versions`)).data.versions,
  });

  const abMutation = useMutation({
    mutationFn: async () =>
      (
        await api.post("/evaluate/ab-test", {
          promptId,
          versionAId,
          versionBId,
          provider,
          variableValues,
        })
      ).data,
    onSuccess: (data) => setResult(data),
  });

  return (
    <div className="space-y-3">
      <p className="text-xs text-ink-500">Run Prompt A vs Prompt B on the same input.</p>
      <div className="flex flex-wrap gap-2 items-center">
        <select className="input !w-auto text-xs" value={versionAId} onChange={(e) => setVersionAId(e.target.value)}>
          <option value="">Prompt A (version)</option>
          {versions.map((v) => (
            <option key={v._id} value={v._id}>
              v{v.versionNumber}
            </option>
          ))}
        </select>
        <span className="text-ink-500 text-xs">vs</span>
        <select className="input !w-auto text-xs" value={versionBId} onChange={(e) => setVersionBId(e.target.value)}>
          <option value="">Prompt B (version)</option>
          {versions.map((v) => (
            <option key={v._id} value={v._id}>
              v{v.versionNumber}
            </option>
          ))}
        </select>
        <select className="input !w-auto text-xs" value={provider} onChange={(e) => setProvider(e.target.value)}>
          <option value="groq">Groq (Llama 3.3)</option>
          <option value="gemini">Gemini</option>
          <option value="mistral">Mistral</option>
        </select>
        <button
          disabled={!versionAId || !versionBId || abMutation.isPending}
          onClick={() => abMutation.mutate()}
          className="btn-primary flex items-center gap-1 text-xs"
        >
          <Play size={14} /> {abMutation.isPending ? "Running..." : "Run A/B test"}
        </button>
      </div>

      {result && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <EvaluationCard evaluation={result.evaluationA} />
          <EvaluationCard evaluation={result.evaluationB} />
        </div>
      )}
    </div>
  );
}
