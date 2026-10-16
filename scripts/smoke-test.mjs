#!/usr/bin/env node
/**
 * Verify package discovery, panel regressions, and a non-interactive Pi session.
 *
 * Usage: npm run smoke
 *
 * JSON mode exposes authoritative final messages. The regression extension
 * checks the real tool loadout and runs panel checks before the model request.
 * A configured Pi model is required; the prompt never requests a tool call.
 */

import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const piArgs = ["--no-extensions", "-e", "./index.ts", "-e", "./scripts/regression-checks.ts", "--no-session", "--mode", "json", "-p", "Reply with exactly: smoke-ok"];
const windows = process.platform === "win32";
const result = spawnSync(
  windows ? process.env.ComSpec ?? "cmd.exe" : "pi",
  windows ? ["/d", "/s", "/c", `pi ${piArgs.map((arg) => `\"${arg}\"`).join(" ")}`] : piArgs,
  {
    cwd: fileURLToPath(new URL("..", import.meta.url)),
    encoding: "utf8",
    // cmd.exe must receive shell quotes, not Node's escaped argv quotes.
    windowsVerbatimArguments: windows,
    timeout: 120_000,
    env: { ...process.env, PI_SKIP_VERSION_CHECK: "1" },
  },
);

if (result.error) throw result.error;
if (result.status !== 0) {
  throw new Error(`Pi smoke check failed (${result.status}).\n${result.stderr}`);
}
const marker = "Ask Better regression checks passed.";
if (!result.stderr.includes(marker)) {
  throw new Error(`Regression checks did not complete.\n${result.stderr}`);
}
const diagnostics = result.stderr.replace(marker, "").trim();
if (diagnostics) throw new Error(`Pi reported diagnostics.\n${diagnostics}`);
const events = result.stdout.split("\n").filter((line) => line.trim()).map((line) => JSON.parse(line));
if (events.some((event) => event.type === "extension_error")) {
  throw new Error("Pi reported an extension error.");
}
const final = events.filter((event) => event.type === "message_end" && event.message?.role === "assistant").at(-1)?.message;
const text = final?.content.filter((item) => item.type === "text").map((item) => item.text).join("").trim();
if (final?.stopReason !== "stop" || text !== "smoke-ok" || final.content.some((item) => item.type === "toolCall")) {
  throw new Error(`Expected final assistant response smoke-ok; received ${JSON.stringify(final)}.`);
}
if (!events.some((event) => event.type === "agent_settled" && event.aborted === false)) {
  throw new Error("Pi did not settle successfully.");
}

console.log("Smoke check passed: package discovery, panel regressions, hidden non-TUI tool, and exact model response.");
