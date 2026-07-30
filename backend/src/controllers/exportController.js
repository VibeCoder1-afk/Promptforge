const PDFDocument = require("pdfkit");
const Prompt = require("../models/Prompt");
const PromptVersion = require("../models/PromptVersion");

async function loadPromptWithVersions(promptId, ownerId) {
  const prompt = await Prompt.findOne({ _id: promptId, owner: ownerId });
  if (!prompt) return null;
  const versions = await PromptVersion.find({ prompt: promptId }).sort({ versionNumber: 1 });
  return { prompt, versions };
}

async function exportJson(req, res) {
  const data = await loadPromptWithVersions(req.params.id, req.user._id);
  if (!data) return res.status(404).json({ error: "Prompt not found" });

  res.setHeader("Content-Disposition", `attachment; filename="${data.prompt.title.replace(/\s+/g, "_")}.json"`);
  res.json(data);
}

async function exportMarkdown(req, res) {
  const data = await loadPromptWithVersions(req.params.id, req.user._id);
  if (!data) return res.status(404).json({ error: "Prompt not found" });

  const { prompt, versions } = data;
  let md = `# ${prompt.title}\n\n${prompt.description || ""}\n\n`;
  for (const v of versions) {
    md += `## v${v.versionNumber}${v.versionNumber === versions.length ? " (latest)" : ""}\n`;
    if (v.notes) md += `_${v.notes}_\n\n`;
    md += "```\n" + v.content + "\n```\n\n";
    if (v.variables.length) md += `**Variables:** ${v.variables.map((x) => `\`{{${x}}}\``).join(", ")}\n\n`;
  }

  res.setHeader("Content-Type", "text/markdown");
  res.setHeader("Content-Disposition", `attachment; filename="${prompt.title.replace(/\s+/g, "_")}.md"`);
  res.send(md);
}

async function exportPdf(req, res) {
  const data = await loadPromptWithVersions(req.params.id, req.user._id);
  if (!data) return res.status(404).json({ error: "Prompt not found" });

  const { prompt, versions } = data;
  const doc = new PDFDocument({ margin: 50 });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${prompt.title.replace(/\s+/g, "_")}.pdf"`);
  doc.pipe(res);

  doc.fontSize(20).text(prompt.title, { underline: true });
  if (prompt.description) doc.moveDown(0.5).fontSize(11).fillColor("gray").text(prompt.description);
  doc.moveDown();

  versions.forEach((v) => {
    doc.fillColor("black").fontSize(14).text(`Version ${v.versionNumber}${v.notes ? ` — ${v.notes}` : ""}`);
    doc.moveDown(0.3).fontSize(10).font("Courier").text(v.content);
    doc.font("Helvetica").moveDown();
  });

  doc.end();
}

module.exports = { exportJson, exportMarkdown, exportPdf };
