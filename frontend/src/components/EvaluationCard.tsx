import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Star } from "lucide-react";
import { api, Evaluation } from "../lib/api";

const providerLabel: Record<string, string> = { groq: "Groq", gemini: "Gemini", mistral: "Mistral" };

export function EvaluationCard({ evaluation }: { evaluation: Evaluation }) {
  const [starRating, setStarRating] = useState(evaluation.starRating || 0);
  const [showCriteria, setShowCriteria] = useState(false);
  const [criteria, setCriteria] = useState(evaluation.criteria);

  const rateMutation = useMutation({
    mutationFn: async (payload: any) => (await api.post(`/evaluate/${evaluation._id}/rate`, payload)).data,
  });

  return (
    <div className="card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="pill bg-base-700 text-ink-100 font-mono">{providerLabel[evaluation.provider]}</span>
          <span className="text-xs text-ink-500 font-mono">{evaluation.model}</span>
          {evaluation.abLabel && <span className="pill bg-signal/20 text-signal-soft">Group {evaluation.abLabel}</span>}
        </div>
        {evaluation.status === "error" ? (
          <span className="text-xs text-coral">error</span>
        ) : (
          evaluation.isJsonValid !== null && (
            <span className={`text-xs ${evaluation.isJsonValid ? "text-mint" : "text-coral"}`}>
              {evaluation.isJsonValid ? "valid JSON" : "invalid JSON"}
            </span>
          )
        )}
      </div>

      <pre className="font-mono text-xs whitespace-pre-wrap bg-base-900 rounded-lg p-3 max-h-48 overflow-y-auto">
        {evaluation.status === "error" ? evaluation.errorMessage : evaluation.output}
      </pre>

      <div className="grid grid-cols-4 gap-2 text-center text-xs text-ink-500">
        <div>
          <div className="text-ink-100 font-semibold">{evaluation.latencyMs}ms</div>
          latency
        </div>
        <div>
          <div className="text-ink-100 font-semibold">{evaluation.tokensInput + evaluation.tokensOutput}</div>
          tokens
        </div>
        <div>
          <div className="text-ink-100 font-semibold">${evaluation.costUsd.toFixed(4)}</div>
          cost
        </div>
        <div>
          <div className="text-ink-100 font-semibold">{evaluation.promptScore.hallucinationRisk}</div>
          risk score
        </div>
      </div>

      <div className="border-t border-base-600 pt-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                onClick={() => {
                  setStarRating(n);
                  rateMutation.mutate({ starRating: n });
                }}
              >
                <Star size={16} className={n <= starRating ? "text-amber" : "text-ink-500"} fill={n <= starRating ? "currentColor" : "none"} />
              </button>
            ))}
          </div>
          <button className="text-xs text-ink-500 hover:text-signal-soft" onClick={() => setShowCriteria((s) => !s)}>
            {showCriteria ? "Hide criteria" : "Rate by criteria"}
          </button>
        </div>

        {showCriteria && (
          <div className="grid grid-cols-2 gap-2 mt-2">
            {(["accuracy", "creativity", "relevance", "jsonValidity"] as const).map((c) => (
              <div key={c} className="flex items-center justify-between text-xs">
                <span className="text-ink-500 capitalize">{c}</span>
                <select
                  className="input !w-16 !py-1 text-xs"
                  value={criteria[c] ?? ""}
                  onChange={(e) => {
                    const next = { ...criteria, [c]: Number(e.target.value) };
                    setCriteria(next);
                    rateMutation.mutate({ criteria: next });
                  }}
                >
                  <option value="">-</option>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
