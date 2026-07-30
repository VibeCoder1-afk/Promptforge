import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { History, RotateCcw, Copy, GitCompare } from "lucide-react";
import { api, PromptVersion } from "../lib/api";

export function VersionControlPanel({
  promptId,
  currentVersionId,
  onSelectVersion,
}: {
  promptId: string;
  currentVersionId?: string;
  onSelectVersion: (v: PromptVersion) => void;
}) {
  const queryClient = useQueryClient();
  const [compareFrom, setCompareFrom] = useState<number | null>(null);
  const [compareTo, setCompareTo] = useState<number | null>(null);
  const [diff, setDiff] = useState<any[] | null>(null);

  const { data: versions = [] } = useQuery({
    queryKey: ["versions", promptId],
    queryFn: async () => (await api.get<{ versions: PromptVersion[] }>(`/prompts/${promptId}/versions`)).data.versions,
  });

  const rollbackMutation = useMutation({
    mutationFn: async (versionNumber: number) => (await api.post(`/prompts/${promptId}/versions/${versionNumber}/rollback`)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["versions", promptId] }),
  });

  const duplicateMutation = useMutation({
    mutationFn: async () => (await api.post(`/prompts/${promptId}/duplicate`)).data,
  });

  async function viewDiff() {
    if (compareFrom == null || compareTo == null) return;
    const res = await api.get(`/prompts/${promptId}/versions/diff`, { params: { from: compareFrom, to: compareTo } });
    setDiff(res.data.diff);
  }

  const latestNumber = versions[0]?.versionNumber;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-xs text-ink-500 mb-1">
        <History size={14} /> Version history
      </div>

      <div className="space-y-1 max-h-56 overflow-y-auto pr-1">
        {versions.map((v) => (
          <div
            key={v._id}
            className={`flex items-center justify-between px-2 py-1.5 rounded-lg cursor-pointer text-sm ${
              v._id === currentVersionId ? "bg-signal/15 text-signal-soft" : "hover:bg-base-700 text-ink-300"
            }`}
            onClick={() => onSelectVersion(v)}
          >
            <span className="font-mono">
              v{v.versionNumber} {v.versionNumber === latestNumber && <span className="text-ink-500">(latest)</span>}
            </span>
            <div className="flex items-center gap-2">
              <button
                title="Rollback to this version"
                className="text-ink-500 hover:text-signal-soft"
                onClick={(e) => {
                  e.stopPropagation();
                  rollbackMutation.mutate(v.versionNumber);
                }}
              >
                <RotateCcw size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <button className="btn-ghost text-xs flex items-center gap-1" onClick={() => duplicateMutation.mutate()}>
        <Copy size={13} /> Duplicate prompt
      </button>

      <div className="border-t border-base-600 pt-3">
        <p className="text-xs text-ink-500 mb-2 flex items-center gap-1">
          <GitCompare size={13} /> View differences
        </p>
        <div className="flex gap-2 items-center">
          <select className="input !w-auto text-xs" value={compareFrom ?? ""} onChange={(e) => setCompareFrom(Number(e.target.value))}>
            <option value="">from</option>
            {versions.map((v) => (
              <option key={v._id} value={v.versionNumber}>
                v{v.versionNumber}
              </option>
            ))}
          </select>
          <select className="input !w-auto text-xs" value={compareTo ?? ""} onChange={(e) => setCompareTo(Number(e.target.value))}>
            <option value="">to</option>
            {versions.map((v) => (
              <option key={v._id} value={v.versionNumber}>
                v{v.versionNumber}
              </option>
            ))}
          </select>
          <button className="btn-ghost text-xs" onClick={viewDiff}>
            Compare
          </button>
        </div>
        {diff && (
          <div className="mt-2 font-mono text-xs bg-base-900 rounded-lg p-2 max-h-40 overflow-y-auto">
            {diff.map((line, i) => (
              <div
                key={i}
                className={line.type === "changed" ? "bg-coral/10 text-coral" : "text-ink-500"}
              >
                {line.type === "changed" ? `- ${line.left ?? ""}\n+ ${line.right ?? ""}` : line.left}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
