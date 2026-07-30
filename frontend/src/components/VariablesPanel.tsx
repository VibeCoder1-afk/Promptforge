export function VariablesPanel({
  variables,
  values,
  onChange,
}: {
  variables: string[];
  values: Record<string, string>;
  onChange: (values: Record<string, string>) => void;
}) {
  if (variables.length === 0) {
    return <p className="text-xs text-ink-500">No <code className="font-mono">{"{{variables}}"}</code> detected yet. Add them in the prompt text.</p>;
  }

  return (
    <div className="space-y-3">
      {variables.map((v) => (
        <div key={v}>
          <label className="text-xs text-ink-500 flex items-center gap-1">
            <span className="var-pill">{`{{${v}}}`}</span>
          </label>
          <input
            className="input mt-1"
            placeholder={`Value for ${v}`}
            value={values[v] || ""}
            onChange={(e) => onChange({ ...values, [v]: e.target.value })}
          />
        </div>
      ))}
    </div>
  );
}
