import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Star, Save, Globe2 } from "lucide-react";
import { api, Prompt, PromptVersion, Evaluation } from "../lib/api";
import { VariablesPanel } from "../components/VariablesPanel";
import { VersionControlPanel } from "../components/VersionControlPanel";
import { ModelComparePanel } from "../components/ModelComparePanel";
import { ABTestPanel } from "../components/ABTestPanel";
import { EvaluationCard } from "../components/EvaluationCard";
import { ExportMenu } from "../components/ExportMenu";

type Tab = "compare" | "abtest" | "history";

function extractVariables(content: string): string[] {
  const matches = [...content.matchAll(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g)];
  return [...new Set(matches.map((m) => m[1]))];
}

export default function PromptEditor() {
  const { id } = useParams();
  const queryClient = useQueryClient();

  const [content, setContent] = useState("");
  const [notes, setNotes] = useState("");
  const [jsonMode, setJsonMode] = useState(false);
  const [functionCalling, setFunctionCalling] = useState(false);
  const [variableValues, setVariableValues] = useState<Record<string, string>>({});
  const [activeVersionId, setActiveVersionId] = useState<string | undefined>(undefined);
  const [tab, setTab] = useState<Tab>("compare");

  const { data: prompt } = useQuery({
    queryKey: ["prompt", id],
    queryFn: async () => (await api.get<{ prompt: Prompt }>(`/prompts/${id}`)).data.prompt,
    enabled: !!id,
  });

  useEffect(() => {
    if (prompt?.currentVersion) {
      setContent(prompt.currentVersion.content);
      setJsonMode(prompt.currentVersion.jsonMode);
      setFunctionCalling(prompt.currentVersion.functionCallingEnabled);
      setActiveVersionId(prompt.currentVersion._id);
    }
  }, [prompt?._id]);

  const { data: history = [] } = useQuery({
    queryKey: ["evaluations", id],
    queryFn: async () => (await api.get<{ evaluations: Evaluation[] }>("/evaluate", { params: { promptId: id } })).data.evaluations,
    enabled: tab === "history",
  });

  const variables = useMemo(() => extractVariables(content), [content]);

  const saveVersionMutation = useMutation({
    mutationFn: async () =>
      (await api.post(`/prompts/${id}/versions`, { content, notes, jsonMode, functionCallingEnabled: functionCalling })).data,
    onSuccess: (data) => {
      setActiveVersionId(data.version._id);
      setNotes("");
      queryClient.invalidateQueries({ queryKey: ["versions", id] });
      queryClient.invalidateQueries({ queryKey: ["prompt", id] });
    },
  });

  const favoriteMutation = useMutation({
    mutationFn: async () => (await api.post(`/prompts/${id}/favorite`)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["prompt", id] }),
  });

  const publishMutation = useMutation({
    mutationFn: async () => (await api.patch(`/prompts/${id}`, { isPublicTemplate: !prompt?.isPublicTemplate })).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["prompt", id] }),
  });

  if (!prompt) return <p className="text-ink-500">Loading prompt...</p>;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{prompt.title}</h1>
          <p className="text-sm text-ink-500 mt-1">{prompt.description}</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => favoriteMutation.mutate()} className="text-ink-500 hover:text-amber" title="Favorite">
            <Star size={18} />
          </button>
          <button
            onClick={() => publishMutation.mutate()}
            className={`flex items-center gap-1 text-xs ${prompt.isPublicTemplate ? "text-signal-soft" : "text-ink-500 hover:text-signal-soft"}`}
            title="Publish to public gallery"
          >
            <Globe2 size={14} /> {prompt.isPublicTemplate ? "Public" : "Publish"}
          </button>
          <ExportMenu promptId={prompt._id} title={prompt.title} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Editor */}
        <div className="lg:col-span-2 space-y-3">
          <div className="card p-0 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 border-b border-base-600 bg-base-900/60">
              <span className="text-xs text-ink-500 font-mono">prompt.txt</span>
              <div className="flex items-center gap-4 text-xs">
                <label className="flex items-center gap-1 text-ink-300">
                  <input type="checkbox" checked={jsonMode} onChange={(e) => setJsonMode(e.target.checked)} /> JSON mode
                </label>
                <label className="flex items-center gap-1 text-ink-300">
                  <input type="checkbox" checked={functionCalling} onChange={(e) => setFunctionCalling(e.target.checked)} /> Function calling
                </label>
              </div>
            </div>
            <textarea
              className="w-full h-72 bg-base-900 font-mono text-sm p-4 outline-none resize-none placeholder:text-ink-500"
              placeholder="Write a cold email to {{company}}..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              spellCheck={false}
            />
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            {variables.map((v) => (
              <span key={v} className="var-pill">{`{{${v}}}`}</span>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <input
              className="input"
              placeholder="What changed in this version? (commit message)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
            <button className="btn-primary flex items-center gap-1 shrink-0" onClick={() => saveVersionMutation.mutate()}>
              <Save size={14} /> Save version
            </button>
          </div>

          {/* Tabs: compare models / a-b test / run history */}
          <div className="card p-4">
            <div className="flex gap-4 border-b border-base-600 mb-4 text-sm">
              {(["compare", "abtest", "history"] as Tab[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`pb-2 -mb-px border-b-2 ${tab === t ? "border-signal text-signal-soft" : "border-transparent text-ink-500"}`}
                >
                  {t === "compare" ? "Compare Models" : t === "abtest" ? "A/B Testing" : "Run History"}
                </button>
              ))}
            </div>

            {tab === "compare" && activeVersionId && (
              <ModelComparePanel promptId={prompt._id} versionId={activeVersionId} variableValues={variableValues} />
            )}
            {tab === "abtest" && <ABTestPanel promptId={prompt._id} variableValues={variableValues} />}
            {tab === "history" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {history.length === 0 && <p className="text-ink-500 text-sm">No runs yet — try Compare Models or A/B Testing.</p>}
                {history.map((e) => (
                  <EvaluationCard key={e._id} evaluation={e} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right rail: variables + version control */}
        <div className="space-y-6">
          <div className="card p-4">
            <p className="text-xs uppercase tracking-wider text-ink-500 mb-3">Variables</p>
            <VariablesPanel variables={variables} values={variableValues} onChange={setVariableValues} />
          </div>
          <div className="card p-4">
            <VersionControlPanel
              promptId={prompt._id}
              currentVersionId={activeVersionId}
              onSelectVersion={(v: PromptVersion) => {
                setContent(v.content);
                setJsonMode(v.jsonMode);
                setFunctionCalling(v.functionCallingEnabled);
                setActiveVersionId(v._id);
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
