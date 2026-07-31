// @ts-nocheck
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("./route.ts", import.meta.url), "utf8");

assert.match(
  source,
  /\.\.\.\(binding\.model \? \{ model: binding\.model \} : \{\}\)/,
  "direct daemon session launches omit an absent runtime-owned model",
);

assert.match(
  source,
  /harness:\s*requestedHarness\s*\?\?\s*"codex",\s*model:\s*runtimeOwnsModelDefault\(requestedHarness\s*\?\?\s*"codex"\)\s*\?\s*""\s*:\s*config\.defaults\.model/,
  "unbound sessions omit runtime-owned defaults while Cave-owned harnesses retain the global model",
);

console.log("sessions route.test.ts: ok");
