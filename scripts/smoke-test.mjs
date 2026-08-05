#!/usr/bin/env node
/**
 * Verify the package can load in a non-interactive Pi session.
 *
 * Usage: npm run smoke
 *
 * This intentionally uses print mode: ask_user must be hidden outside Pi's
 * interactive terminal UI. A configured Pi model is required for the one-shot
 * session, but the prompt never requests a tool call.
 */

import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const piArgs = ["--no-extensions", "-e", "./index.ts", "--no-session", "-p", "Reply with exactly: smoke-ok"];
const windows = process.platform === "win32";
const result = spawnSync(
  windows ? process.env.ComSpec ?? "cmd.exe" : "pi",
  windows ? ["/d", "/s", "/c", `pi ${piArgs.map((arg) => `\"${arg}\"`).join(" ")}`] : piArgs,
  {
    cwd: fileURLToPath(new URL("..", import.meta.url)),
    encoding: "utf8",
    timeout: 120_000,
    env: { ...process.env, PI_SKIP_VERSION_CHECK: "1" },
  },
);

if (result.error) throw result.error;
if (result.status !== 0) {
  throw new Error(`Pi smoke check failed (${result.status}).\n${result.stderr}`);
}
if (!result.stdout.trim()) {
  throw new Error("Pi smoke check produced no response.");
}

console.log("Smoke check passed: extension loads in a non-interactive Pi session.");
