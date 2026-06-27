#!/usr/bin/env node
/**
 * Design-token guard (Phase 6.5).
 *
 * Fails if any `.tsx` under src/ uses a raw colour instead of a semantic token:
 * hex colours, rgba(), Tailwind palette classes (zinc/gray/red/blue/slate),
 * or bare white/black utilities. index.css is the single source of truth and is
 * intentionally NOT scanned.
 *
 * Run: npm run lint:tokens
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "src");

// Each rule: a regex and a human description. Kept conservative to avoid
// false positives (e.g. `href="#"` has no hex digits so it won't match).
const RULES = [
  { re: /#[0-9a-fA-F]{3,8}\b/, label: "hex colour (#rrggbb)" },
  { re: /\brgba?\(/, label: "rgb()/rgba() literal" },
  // Any colour-bearing Tailwind prefix paired with black/white — covers
  // gradient stops (from-/via-/to-) and ring/fill/stroke/etc., not just bg/text.
  {
    re: /\b(bg|text|border|from|via|to|ring|fill|stroke|outline|divide|shadow|decoration|placeholder|caret|accent)-(black|white)\b/,
    label: "bare black/white utility (use scrim/on-media/hairline token)",
  },
  { re: /-(zinc|gray|grey|slate|red|blue|green|yellow|amber|emerald)-\d/, label: "raw Tailwind palette colour (use semantic token)" },
];

/** @param {string} dir */
function walk(dir) {
  /** @type {string[]} */
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (full.endsWith(".tsx")) out.push(full);
  }
  return out;
}

let violations = 0;
for (const file of walk(ROOT)) {
  const lines = readFileSync(file, "utf8").split("\n");
  lines.forEach((line, i) => {
    for (const { re, label } of RULES) {
      if (re.test(line)) {
        violations++;
        const rel = file.slice(file.indexOf("src"));
        console.error(`${rel}:${i + 1}  ${label}\n    ${line.trim()}`);
      }
    }
  });
}

if (violations > 0) {
  console.error(`\n✖ ${violations} design-token violation(s). Use semantic tokens from index.css.`);
  process.exit(1);
}
console.log("✓ No hardcoded colours — all styling routes through design tokens.");
