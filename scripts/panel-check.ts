/**
 * Manual panel checks without a model request or saved answers.
 * Usage: pi --no-extensions -e ./scripts/panel-check.ts --tui-mode fullscreen
 * Repeat with --tui-mode regular, then run /ask-better-check [short|long|multi].
 */
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import askBetter from "../index.ts";

export default function panelCheck(pi: ExtensionAPI) {
  let tool: any;
  // Capture the production tool without activating it or changing the real loadout.
  askBetter({ on() {}, registerTool: (definition: any) => { tool = definition; } } as unknown as ExtensionAPI);
  pi.registerCommand("ask-better-check", {
    description: "Open a short, long, or multi-select test panel; no answers saved",
    handler: async (args, ctx) => {
      if (ctx.mode !== "tui") throw new Error("Panel checks require the interactive terminal.");
      const scenario = args.trim() || "long";
      if (!["short", "long", "multi"].includes(scenario)) {
        ctx.ui.notify("Usage: /ask-better-check [short|long|multi]", "error");
        return;
      }
      const long = scenario !== "short";
      await tool.execute("manual-panel-check", {
        header: `Panel check: ${scenario}`,
        question: "## Choose a test answer\n\nCheck navigation, custom text, cancellation, resize, and scrolling. 界🙂\n\n"
          + (long ? "Question detail.\n\n".repeat(10) : ""),
        options: Array.from({ length: long ? 20 : 2 }, (_, index) => ({
          label: `Choice ${index + 1}`,
          recommended: index === 0,
          description: long ? "A longer option description to test wrapping in narrow terminals." : undefined,
          preview: long ? "## Preview\n\n| Check | Value |\n| --- | --- |\n| Width | 界🙂 |\n\n" + "Preview detail.\n\n".repeat(20) : undefined,
        })),
        multiSelect: scenario === "multi",
      }, ctx.signal, undefined, ctx);
      ctx.ui.notify("Panel check closed. No answer recorded.", "info");
    },
  });
}
