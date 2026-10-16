/**
 * Regression checks loaded by scripts/smoke-test.mjs through Pi's real loader.
 * No answer logging, local dependencies, sessions, or settings writes.
 */
import assert from "node:assert/strict";
import { getEventListeners } from "node:events";
import { fileURLToPath } from "node:url";
import { DefaultPackageManager, SettingsManager, type ExtensionAPI } from "@earendil-works/pi-coding-agent";
import {
  CURSOR_MARKER, getKeybindings, KeybindingsManager, setKeybindings, TUI_KEYBINDINGS,
  TuiAltScreen, TuiMainScreen, visibleWidth,
} from "@earendil-works/pi-tui";
import askBetter from "../index.ts";

const cancelled = { cancelled: true, answers: [] };
const root = fileURLToPath(new URL("..", import.meta.url));
const theme = { fg: (_color: string, text: string) => text, bold: (text: string) => text };
const keys = new KeybindingsManager(TUI_KEYBINDINGS);
const tick = () => new Promise((resolve) => setTimeout(resolve, 10));

async function deadline<T>(promise: Promise<T>): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_resolve, reject) => { timer = setTimeout(() => reject(new Error("Panel did not settle")), 2000); }),
    ]);
  } finally {
    clearTimeout(timer!);
  }
}

export default async function regressionChecks(pi: ExtensionAPI) {
  let tool: any;
  let start: any;
  let active = ["read", "ask_user"];
  askBetter({
    registerTool: (definition: any) => { tool = definition; },
    on: (event: string, handler: any) => { assert.equal(event, "session_start"); start = handler; },
    getActiveTools: () => active,
    setActiveTools: (names: string[]) => { active = names; },
  } as unknown as ExtensionAPI);
  assert.equal(tool.exposure, "model-only");
  assert.equal(tool.executionMode, "sequential");
  for (const mode of ["print", "json", "rpc", "tui", "tui", "rpc"]) {
    start({}, { mode });
    assert.deepEqual(active, mode === "tui" ? ["read", "ask_user"] : ["read"]);
  }
  assert.throws(() => tool.prepareArguments({ question: "No choices" }), /provide options/);
  assert.throws(() => tool.prepareArguments({ yesNo: true, multiSelect: true }), /cannot be combined/);

  const resources = await new DefaultPackageManager({
    cwd: root, agentDir: root, settingsManager: SettingsManager.inMemory(),
  }).resolveExtensionSources([root], { temporary: true });
  assert(resources.extensions.some((entry) => entry.enabled && entry.path.endsWith("index.ts")));
  assert(resources.skills.some((entry) => entry.enabled && /skills[\\/]ask-user(?:[\\/]SKILL.md)?$/.test(entry.path)),
    "Package must discover its bundled skill");

  function open(params: object, options: { signal?: AbortSignal; mode?: string; bindings?: KeybindingsManager; failure?: "sync" | "async"; tui?: any; beforeFactory?: () => void } = {}) {
    let panel: any;
    const working: boolean[] = [];
    const terminal = options.tui?.terminal ?? { rows: 30, columns: 100 };
    const tui = options.tui ?? { terminal, mode: "regular", requestRender() {} };
    const promise = tool.execute("test", params, options.signal, undefined, {
      mode: options.mode ?? "tui",
      ui: {
        setWorkingVisible: (value: boolean) => working.push(value),
        custom: (factory: any) => {
          if (options.failure === "sync") throw new Error("UI failure");
          return new Promise((resolve, reject) => {
            options.beforeFactory?.();
            panel = factory(tui, theme, options.bindings ?? keys, resolve);
            panel.focused = true;
            if (options.failure === "async") reject(new Error("UI failure"));
          });
        },
      },
    });
    return { get panel() { return panel; }, terminal, working, promise: deadline(promise) };
  }
  async function answer(question: ReturnType<typeof open>, input: string[], expected: object) {
    for (const data of input) question.panel.handleInput(data);
    const result: any = await question.promise;
    assert.deepEqual(JSON.parse(result.content[0].text), expected);
    assert.deepEqual(question.working, [false, true]);
    return result;
  }
  const previousKeys = getKeybindings();
  setKeybindings(keys);
  try {
    const base = { question: "Choose", options: [{ label: "First" }, { label: "Second", recommended: true }] };
    await answer(open(base), ["\r"], { cancelled: false, answers: [{ tab: "Answer", answer: "Second" }] });
    await answer(open({ yesNo: true }), ["\x1b[B", "\x1b[B", "\r"], { cancelled: false, answers: [{ tab: "Answer", answer: "No" }] });
    await answer(open(base), ["\x1b"], cancelled);
    await answer(open(base), ["\x03"], cancelled);
    await answer(open(base), ["unmatched", "\r"], { cancelled: false, answers: [{ tab: "Answer", custom: "unmatched" }] });
    await answer(open(base), ["\x1b[B", "\x1b[B", "\x1b[B", "\r", "First", "\r"],
      { cancelled: false, answers: [{ tab: "Answer", custom: "First" }] });
    await answer(open({ ...base, multiSelect: true }), ["\x1b[B", " ", "\x1b[B", " ", "\r"],
      { cancelled: false, answers: [{ tab: "Answer", answers: ["Second", "First"] }] });
    await answer(open({ ...base, multiSelect: true }), ["\r"],
      { cancelled: false, answers: [{ tab: "Answer", answers: ["Second"] }] });

    for (const mode of ["print", "json", "rpc"]) {
      const question = open(base, { mode });
      assert.deepEqual(JSON.parse((await question.promise).content[0].text), cancelled);
      assert.equal(question.panel, undefined);
      assert.deepEqual(question.working, []);
    }
    const alreadyAborted = new AbortController();
    alreadyAborted.abort();
    assert.deepEqual(JSON.parse((await open(base, { signal: alreadyAborted.signal }).promise).content[0].text), cancelled);
    for (const failure of [undefined, "sync", "async"] as const) {
      const controller = new AbortController();
      const question = open(base, { signal: controller.signal, failure });
      if (failure) await assert.rejects(question.promise, /UI failure/);
      else {
        assert.equal(getEventListeners(controller.signal, "abort").length, 1);
        controller.abort();
        assert.deepEqual(JSON.parse((await question.promise).content[0].text), cancelled);
      }
      assert.deepEqual(question.working, [false, true]);
      assert.equal(getEventListeners(controller.signal, "abort").length, 0);
    }
    const mounting = new AbortController();
    const interrupted = open(base, { signal: mounting.signal, beforeFactory: () => mounting.abort() });
    assert.deepEqual(JSON.parse((await interrupted.promise).content[0].text), cancelled);
    assert.deepEqual(interrupted.working, [false, true]);
    assert.equal(getEventListeners(mounting.signal, "abort").length, 0);
    const completed = new AbortController();
    await answer(open(base, { signal: completed.signal }), ["\r"],
      { cancelled: false, answers: [{ tab: "Answer", answer: "Second" }] });
    assert.equal(getEventListeners(completed.signal, "abort").length, 0);
    completed.abort();

    const bindings = new KeybindingsManager(TUI_KEYBINDINGS, {
      "tui.select.down": "ctrl+n", "tui.select.up": "ctrl+p",
      "tui.select.confirm": "ctrl+y", "tui.select.cancel": "ctrl+x",
      "tui.input.submit": "ctrl+s", "tui.select.pageDown": "ctrl+d",
    });
    setKeybindings(bindings);
    await answer(open(base, { bindings }), ["\x0e", "\x0e", "\x19"],
      { cancelled: false, answers: [{ tab: "Answer", answer: "First" }] });
    await answer(open(base, { bindings }), ["\x18"], cancelled);
    await answer(open(base, { bindings }), ["custom", "\x13"],
      { cancelled: false, answers: [{ tab: "Answer", custom: "custom" }] });
    setKeybindings(keys);

    const longParams = {
      question: Array.from({ length: 30 }, (_, i) => `Question line ${i}`).join("\n\n"),
      options: Array.from({ length: 20 }, (_, i) => ({
        label: `Choice ${i} 界🙂`, description: "Description ".repeat(8),
        preview: "## Preview\n\n" + "Preview detail\n\n".repeat(30),
      })),
    };
    const long = open(longParams);
    function render(width: number, rows: number) {
      long.terminal.rows = rows;
      long.terminal.columns = width;
      const lines = long.panel.render(width);
      assert(lines.length <= Math.max(1, Math.floor(rows * 0.6)), `Height at ${width}x${rows}`);
      assert(lines.every((line: string) => visibleWidth(line) <= width), `Width at ${width}x${rows}`);
      return lines;
    }
    for (const [width, rows] of [[100, 30], [40, 20], [5, 12], [1, 4], [120, 50]]) {
      render(width, rows);
      long.panel.handleInput("\x1b[B");
      assert(render(width, rows).some((line: string) => line.includes(">")), `Focused option stays visible at ${width}x${rows}: ${JSON.stringify(render(width, rows))}`);
    }
    render(100, 30);
    const before = render(100, 30).join("\n");
    long.panel.handleInput("\x1b[6~");
    assert.notEqual(render(100, 30).join("\n"), before, "PageDown scrolls detail");
    long.panel.handleInput("\x1b[5~");
    for (let i = 0; i < 25; i++) { long.panel.handleInput("\x1b[A"); render(100, 30); }
    assert(render(100, 30).some((line: string) => line.includes(CURSOR_MARKER)), "Editor cursor remains visible");
    long.panel.invalidate();
    render(40, 20);

    // Exercise Pi's real screen renderers with an in-memory terminal; no real terminal input.
    for (const Screen of [TuiMainScreen, TuiAltScreen]) {
      let writes = "";
      let input: (data: string) => void;
      const terminal: any = {
        columns: 100, rows: 30, kittyProtocolActive: false,
        start: (handler: (data: string) => void) => { input = handler; },
        stop() {}, async drainInput() {}, write: (data: string) => { writes += data; },
        moveBy() {}, hideCursor() {}, showCursor() {}, clearLine() {}, clearFromCursor() {},
        clearScreen() {}, setTitle() {}, setProgress() {}, setProgramStatus() {},
      };
      const screen = new Screen(terminal);
      const question = open(longParams, { tui: screen });
      screen.addChild(question.panel);
      screen.setFocus(question.panel);
      try {
        screen.start();
        screen.requestRender();
        await tick();
        input!("\x1b[B");
        const before = question.panel.render(100).join("\n");
        input!(screen.mode === "fullscreen" ? "\x1b[6;5~" : "\x1b[6~");
        assert.notEqual(question.panel.render(100).join("\n"), before, `${screen.mode} routes panel scrolling`);
        terminal.columns = 40;
        terminal.rows = 20;
        question.panel.invalidate();
        screen.requestRender(true);
        await tick();
        assert(writes.length > 0, `${screen.mode} writes output`);
        input!("\x1b");
        assert.deepEqual(JSON.parse((await question.promise).content[0].text), cancelled);
      } finally {
        screen.stop();
      }
    }
    await answer(long, ["\x1b"], cancelled);
  } finally {
    setKeybindings(previousKeys);
  }

  // Check the real session, not only the mock session_start above.
  pi.on("session_start", (_event, ctx) => {
    assert.notEqual(ctx.mode, "tui", "Run checks through npm run smoke, not the interactive terminal");
    assert(!pi.getActiveTools().includes("ask_user"), "ask_user must be inactive outside TUI");
    assert.equal(pi.getAllTools().find((entry) => entry.name === "ask_user")?.exposure, "model-only");
    console.error("Ask Better regression checks passed.");
  });
}
