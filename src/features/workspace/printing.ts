const code128Patterns = ["212222","222122","222221","121223","121322","131222","122213","122312","132212","221213","221312","231212","112232","122132","122231","113222","123122","123221","223211","221132","221231","213212","223112","312131","311222","321122","321221","312212","322112","322211","212123","212321","232121","111323","131123","131321","112313","132113","132311","211313","231113","231311","112133","112331","132131","113123","113321","133121","313121","211331","231131","213113","213311","213131","311123","311321","331121","312113","312311","332111","314111","221411","431111","111224","111422","121124","121421","141122","141221","112214","112412","122114","122411","142112","142211","241211","221114","413111","241112","134111","111242","121142","121241","114212","124112","124211","411212","421112","421211","212141","214121","412121","111143","111341","131141","114113","114311","411113","411311","113141","114131","311141","411131","211412","211214","211232","2331112"];

export function code128Svg(value: string): string {
  if (!/^\d{10}$/.test(value)) throw new Error("A barcode must contain exactly ten digits.");
  const codes = value.match(/\d{2}/g)!.map(Number);
  const checksum = (105 + codes.reduce((sum, code, index) => sum + code * (index + 1), 0)) % 103;
  const modules = [105, ...codes, checksum, 106].map((code) => code128Patterns[code]).join("");
  let x = 20; const bars: string[] = [];
  [...modules].forEach((width, index) => { const size = Number(width) * 2; if (index % 2 === 0) bars.push(`<rect x="${x}" y="8" width="${size}" height="64" fill="#111827"/>`); x += size; });
  return `<svg xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Barcode ${value}" viewBox="0 0 ${x + 20} 92" width="100%" height="92">${bars.join("")}<text x="${(x + 20) / 2}" y="88" text-anchor="middle" font-family="Arial,sans-serif" font-size="11">${value}</text></svg>`;
}

export function printBarcodeLabels(title: string, value: string, copies: number): void {
  if (!Number.isInteger(copies) || copies < 1 || copies > 100) throw new Error("Request between 1 and 100 whole copies.");
  const labels = Array.from({ length: copies }, () => `<article class="label"><strong>${escapeHtml(title)}</strong>${code128Svg(value)}</article>`).join("");
  const frame = document.createElement("iframe");
  frame.title = "Barcode print sheet";
  frame.style.cssText = "position:fixed;right:0;bottom:0;width:1px;height:1px;border:0;opacity:0";
  frame.srcdoc = `<!doctype html><html><head><title>Barcode labels</title><style>@page{size:A4;margin:10mm}body{font-family:Arial,sans-serif;display:grid;grid-template-columns:repeat(3,50mm);grid-auto-rows:25mm;gap:5mm;align-content:start}.label{width:50mm;height:25mm;box-sizing:border-box;break-inside:avoid;border:1px dashed #94a3b8;padding:2mm;text-align:center;overflow:hidden}.label strong{display:block;height:4mm;font-size:9px;line-height:4mm;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.label svg{display:block;width:46mm;height:17mm}</style></head><body>${labels}</body></html>`;
  frame.onload = () => { frame.contentWindow?.print(); window.setTimeout(() => frame.remove(), 60_000); };
  document.body.appendChild(frame);
}

export function printBlob(blob: Blob): void {
  const url = URL.createObjectURL(blob); const frame = document.createElement("iframe");
  frame.title = "Document print view";
  frame.style.cssText = "position:fixed;right:0;bottom:0;width:1px;height:1px;border:0;opacity:0";
  frame.src = url;
  frame.onload = () => { frame.contentWindow?.print(); window.setTimeout(() => { URL.revokeObjectURL(url); frame.remove(); }, 60_000); };
  document.body.appendChild(frame);
}

function escapeHtml(value: string): string { return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]!); }
