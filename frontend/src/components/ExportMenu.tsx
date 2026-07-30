import { Download } from "lucide-react";
import { api } from "../lib/api";

async function downloadFile(url: string, filename: string) {
  const res = await api.get(url, { responseType: "blob" });
  const blobUrl = window.URL.createObjectURL(new Blob([res.data]));
  const a = document.createElement("a");
  a.href = blobUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(blobUrl);
}

export function ExportMenu({ promptId, title }: { promptId: string; title: string }) {
  const safeName = title.replace(/\s+/g, "_");
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-ink-500 flex items-center gap-1">
        <Download size={14} /> Export
      </span>
      <button className="btn-ghost !px-2 !py-1 text-xs" onClick={() => downloadFile(`/export/${promptId}/pdf`, `${safeName}.pdf`)}>
        PDF
      </button>
      <button className="btn-ghost !px-2 !py-1 text-xs" onClick={() => downloadFile(`/export/${promptId}/markdown`, `${safeName}.md`)}>
        Markdown
      </button>
      <button className="btn-ghost !px-2 !py-1 text-xs" onClick={() => downloadFile(`/export/${promptId}/json`, `${safeName}.json`)}>
        JSON
      </button>
    </div>
  );
}
