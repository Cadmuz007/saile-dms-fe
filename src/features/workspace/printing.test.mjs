import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import ts from "typescript";

function printing() {
  const frames = [];
  const exports = {};
  const source = readFileSync(new URL("./printing.ts", import.meta.url), "utf8");
  const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  runInNewContext(output, { exports, document: {
    createElement: () => ({ style: {} }), body: { appendChild: (frame) => frames.push(frame) },
  } });
  return { ...exports, frames };
}

test("numeric Code 128 C has the expected symbols, checksum and quiet zones", () => {
  const { code128Svg } = printing();
  const svg = code128Svg("3209430948");
  const bars = [...svg.matchAll(/<rect x="(\d+)" y="8" width="(\d+)"/g)].map((match) => ({ x: Number(match[1]), width: Number(match[2]) }));
  // Start C, 32, 09, 43, 09, 48, checksum 45, stop.
  const patterns = ["211232", "232121", "221213", "112331", "221213", "313121", "113123", "2331112"].join("");
  const widths = bars.flatMap((bar, index) => index < bars.length - 1
    ? [bar.width / 2, (bars[index + 1].x - bar.x - bar.width) / 2] : [bar.width / 2]).join("");
  assert.equal(widths, patterns);
  assert.equal(bars[0].x, 20);
  assert.match(svg, /viewBox="0 0 220 92"/);
  assert.equal(bars.at(-1).x + bars.at(-1).width, 200);
});

test("barcode SVG rejects non-numeric values and markup", () => {
  const { code128Svg } = printing();
  for (const value of ["123", "12345678901", "<script />", "SDL-123456", "123456789a"]) {
    assert.throws(() => code128Svg(value), /exactly ten digits/);
  }
});

test("initial sheet repeats one value three times and escapes document titles", () => {
  const { printBarcodeLabels, frames } = printing();
  printBarcodeLabels('<img src=x onerror="alert(1)">', "3209430948", 3);
  assert.equal(frames.length, 1);
  assert.equal((frames[0].srcdoc.match(/class="label"/g) ?? []).length, 3);
  assert.equal((frames[0].srcdoc.match(/aria-label="Barcode 3209430948"/g) ?? []).length, 3);
  assert.ok(!frames[0].srcdoc.includes("<img"));
  assert.match(frames[0].srcdoc, /&lt;img/);
  assert.equal(typeof frames[0].onload, "function");
});

test("sheet rejects fractional, zero and excessive copies before creating frames", () => {
  const { printBarcodeLabels, frames } = printing();
  for (const copies of [0, -1, 1.5, 101, Infinity]) {
    assert.throws(() => printBarcodeLabels("Report", "3209430948", copies), /whole copies/);
  }
  assert.equal(frames.length, 0);
});
