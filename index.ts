import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import {
  Editor,
  type EditorTheme,
  fuzzyFilter,
  Key,
  matchesKey,
  truncateToWidth,
  type Component,
  type Focusable,
  visibleWidth,
  wrapTextWithAnsi,
} from "@earendil-works/pi-tui";
import { Type } from "typebox";

interface Option {
  label: string;
  description?: string;
  preview?: string;
}

interface PanelTheme extends EditorTheme {
  accent: (text: string) => string;
  bold: (text: string) => string;
  muted: (text: string) => string;
}

interface AskUserParams {
  question?: string;
  header?: string;
  tab?: string;
  options?: Option[];
  multiSelect?: boolean;
}

type Answer =
  | { tab: string; answer: string }
  | { tab: string; custom: string }
  | { tab: string; answers: string[] };

interface AskUserPayload {
  cancelled: boolean;
  answers: Answer[];
}

interface AskUserDetails extends AskUserPayload {
  question: string;
  options: string[];
}

const OptionSchema = Type.Object(
  {
    label: Type.Optional(Type.String({ description: "Short option label." })),
    description: Type.Optional(Type.String({ description: "Optional explanation below the label." })),
    preview: Type.Optional(Type.String({ description: "Optional focused-option preview." })),
  },
  { additionalProperties: true },
);

const AskUserSchema = Type.Object(
  {
    question: Type.Optional(Type.String({ description: "The focused question for the user." })),
    header: Type.Optional(Type.String({ description: "Optional short panel heading." })),
    tab: Type.Optional(Type.String({ description: "Stable answer key; defaults to Answer." })),
    options: Type.Optional(Type.Array(OptionSchema, { description: "Selectable options; omit for free-text only." })),
    multiSelect: Type.Optional(Type.Boolean({ description: "Allow multiple checked options." })),
  },
  { additionalProperties: true },
);

function cleanText(value: unknown): string {
  return typeof value === "string" ? value.replace(/[\u0000-\u0008\u000B-\u001F\u007F]/g, " ").trim() : "";
}

function cleanMultiline(value: unknown): string {
  return typeof value === "string"
    ? value.replace(/[\u0000-\u0008\u000B-\u001F\u007F]/g, " ").replace(/\r\n?/g, "\n").trim()
    : "";
}

function normalizeOption(value: unknown): Option | undefined {
  if (typeof value === "string") {
    const label = cleanText(value);
    return label ? { label } : undefined;
  }
  if (!value || typeof value !== "object") return undefined;
  const input = value as Record<string, unknown>;
  const label = cleanText(input.label ?? input.title ?? input.text ?? input.value ?? input.name ?? input.option);
  if (!label) return undefined;
  const description = cleanMultiline(input.description ?? input.detail ?? input.details);
  const preview = cleanMultiline(input.preview);
  return {
    label,
    ...(description ? { description } : {}),
    ...(preview ? { preview } : {}),
  };
}

function normalizeArguments(raw: unknown): AskUserParams {
  const input = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const optionInput = input.options ?? input.choices ?? input.answers;
  const rawOptions = Array.isArray(optionInput) ? optionInput : optionInput === undefined ? [] : [optionInput];
  const options = rawOptions.map(normalizeOption).filter((option): option is Option => !!option);
  const question = cleanMultiline(input.question ?? input.prompt ?? input.title);
  const header = cleanText(input.header ?? input.title);
  const tab = cleanText(input.tab ?? input.id ?? input.key);
  return {
    ...(question ? { question } : {}),
    ...(header ? { header } : {}),
    ...(tab ? { tab } : {}),
    ...(options.length ? { options } : {}),
    multiSelect: input.multiSelect === true || input.allowMultiple === true || input.multi === true,
  };
}

function wrap(lines: string[], text: string, width: number, prefix = ""): void {
  const prefixWidth = visibleWidth(prefix);
  const usableWidth = Math.max(1, width - prefixWidth);
  for (const line of wrapTextWithAnsi(text, usableWidth)) lines.push(`${prefix}${line}`);
}

class AskUserPanel implements Component, Focusable {
  private readonly editor: Editor;
  private readonly selected = new Set<string>();
  private optionIndex = 0;
  private editing = true;
  private cachedWidth?: number;
  private cachedLines?: string[];
  private _focused = false;

  get focused(): boolean {
    return this._focused;
  }

  set focused(value: boolean) {
    this._focused = value;
    this.editor.focused = value && this.editing;
  }

  constructor(
    private readonly params: Required<Pick<AskUserParams, "question" | "tab" | "multiSelect">> & Pick<AskUserParams, "header"> & { options: Option[] },
    private readonly onDone: (payload: AskUserPayload) => void,
    private readonly tui: ConstructorParameters<typeof Editor>[0],
    private readonly theme: PanelTheme,
  ) {
    const editorTheme: EditorTheme = {
      borderColor: (text) => theme.borderColor(text),
      selectList: theme.selectList,
    };
    this.editor = new Editor(this.tui, editorTheme);
    this.editor.onChange = () => {
      if (this.editor.getText().trim()) this.selected.clear();
      this.optionIndex = 0;
      this.refresh(this.tui);
    };
    this.editor.onSubmit = (value) => {
      const custom = cleanMultiline(value);
      if (custom) this.onDone({ cancelled: false, answers: [{ tab: this.params.tab, custom }] });
    };
  }

  private visibleOptions(): Option[] {
    return fuzzyFilter(this.params.options, this.editor.getText(), (option) => `${option.label} ${option.description ?? ""}`);
  }

  private refresh(tui: { requestRender(): void }): void {
    this.cachedWidth = undefined;
    this.cachedLines = undefined;
    tui.requestRender();
  }

  private finishOption(option: Option): void {
    const answers = [...this.selected];
    this.editor.setText("");
    if (this.params.multiSelect) {
      if (answers.length) this.onDone({ cancelled: false, answers: [{ tab: this.params.tab, answers }] });
      return;
    }
    this.onDone({ cancelled: false, answers: [{ tab: this.params.tab, answer: option.label }] });
  }

  handleInput(data: string): void {
    const options = this.visibleOptions();
    if (this.editing) {
      if (matchesKey(data, Key.down) && options.length) {
        this.editing = false;
        this.editor.focused = false;
        this.optionIndex = 0;
        this.refresh(this.tui);
        return;
      }
      if (matchesKey(data, Key.escape)) {
        this.onDone({ cancelled: true, answers: [] });
        return;
      }
      if (!this.params.multiSelect && options.length === 1 && matchesKey(data, Key.enter)) {
        this.finishOption(options[0]);
        return;
      }
      this.editor.handleInput(data);
      return;
    }

    if (matchesKey(data, Key.up)) {
      if (this.optionIndex === 0) {
        this.editing = true;
        this.editor.focused = this.focused;
      } else {
        this.optionIndex--;
      }
      this.refresh(this.tui);
      return;
    }
    if (matchesKey(data, Key.down)) {
      this.optionIndex = Math.min(this.optionIndex + 1, Math.max(0, options.length - 1));
      this.refresh(this.tui);
      return;
    }
    if (matchesKey(data, Key.escape)) {
      this.onDone({ cancelled: true, answers: [] });
      return;
    }
    const option = options[this.optionIndex];
    if (option && this.params.multiSelect && matchesKey(data, Key.space)) {
      if (this.selected.has(option.label)) this.selected.delete(option.label);
      else this.selected.add(option.label);
      this.refresh(this.tui);
      return;
    }
    if (option && matchesKey(data, Key.enter)) {
      this.finishOption(option);
      return;
    }
    this.editor.handleInput(data);
  }

  render(width: number): string[] {
    if (this.cachedWidth === width && this.cachedLines) return this.cachedLines;
    const renderWidth = Math.max(1, width);
    const contentWidth = renderWidth >= 5 ? renderWidth - 4 : renderWidth;
    const options = this.visibleOptions();
    const lines: string[] = [];
    const add = (text: string) => lines.push(truncateToWidth(text, contentWidth));

    if (this.params.header) wrap(lines, this.theme.bold(this.params.header), contentWidth);
    wrap(lines, this.theme.accent(this.theme.bold(this.params.question || "What would you like to do?")), contentWidth);
    add("");
    add(this.theme.bold("Your answer"));
    for (const line of this.editor.render(contentWidth)) add(line);

    add("");
    add(this.theme.bold("Choices"));
    if (options.length) {
      const preview = options[this.optionIndex]?.preview;
      const split = !!preview && contentWidth >= 88;
      if (split) {
        const leftWidth = Math.floor((contentWidth - 3) / 2);
        const rightWidth = contentWidth - leftWidth - 3;
        const optionLines = this.renderOptions(options, leftWidth);
        const previewLines = wrapTextWithAnsi(preview, rightWidth);
        const rowCount = Math.max(optionLines.length, previewLines.length);
        for (let index = 0; index < rowCount; index++) {
          const left = optionLines[index] ?? "";
          const right = previewLines[index] ?? "";
          add(`${left}${" ".repeat(Math.max(0, leftWidth - visibleWidth(left)))} │ ${right}`);
        }
      } else {
        for (const line of this.renderOptions(options, contentWidth)) add(line);
        if (preview) {
          add("");
          wrap(lines, preview, contentWidth, "  ");
        }
      }
    } else {
      add(this.theme.muted("No matching options — press Enter to submit free text."));
    }

    add("");
    const hint = this.params.multiSelect
      ? "Type to filter · ↓ choices · ↑ answer · Space toggle · Enter submit · Esc cancel"
      : "Type to answer · ↓ choices · ↑ answer · Enter selects sole match · Esc cancel";
    add(this.theme.muted(hint));
    this.cachedWidth = width;
    this.cachedLines = this.frame(lines, renderWidth, contentWidth);
    return this.cachedLines;
  }

  private frame(lines: string[], width: number, contentWidth: number): string[] {
    if (width < 5) return lines.map((line) => truncateToWidth(line, width));
    const border = this.theme.accent;
    const frameLine = (line: string) => {
      const truncated = truncateToWidth(line, contentWidth);
      return `${border("│")} ${truncated}${" ".repeat(Math.max(0, contentWidth - visibleWidth(truncated)))} ${border("│")}`;
    };
    return [
      border(`┌${"─".repeat(width - 2)}┐`),
      frameLine(this.theme.accent(this.theme.bold("Your decision"))),
      ...lines.map(frameLine),
      border(`└${"─".repeat(width - 2)}┘`),
    ];
  }

  private renderOptions(options: Option[], width: number): string[] {
    const lines: string[] = [];
    for (const [index, option] of options.entries()) {
      const focused = this.editing
        ? !this.params.multiSelect && options.length === 1
        : index === this.optionIndex;
      const selected = this.selected.has(option.label);
      const marker = focused ? ">" : " ";
      const checkbox = this.params.multiSelect ? (selected ? "[x] " : "[ ] ") : "";
      wrap(lines, `${marker} ${checkbox}${this.theme.bold(option.label)}`, width);
      if (option.description) wrap(lines, this.theme.muted(option.description), width, "    ");
    }
    return lines;
  }

  invalidate(): void {
    this.cachedWidth = undefined;
    this.cachedLines = undefined;
    this.editor.invalidate();
  }
}

function detailsFor(params: AskUserParams, payload: AskUserPayload): AskUserDetails {
  return {
    ...payload,
    question: params.question ?? "",
    options: (params.options ?? []).map((option) => option.label),
  };
}

export default function askBetter(pi: ExtensionAPI): void {
  pi.on("session_start", (_event, ctx) => {
    const active = pi.getActiveTools().filter((name) => name !== "ask_user");
    pi.setActiveTools(ctx.mode === "tui" ? [...active, "ask_user"] : active);
  });

  pi.registerTool({
    name: "ask_user",
    label: "Ask User",
    description:
      "Ask one focused question with selectable options or free text. Use for a decision, preference, or clarification; do not queue dependent questions. Result JSON: { cancelled, answers: [{ tab, answer|custom|answers }] }.",
    promptSnippet: "Ask one focused structured question when a user decision is needed",
    promptGuidelines: [
      "Use ask_user for one focused decision at a time when requirements are ambiguous; do not ask dependent questions in the same call.",
    ],
    parameters: AskUserSchema,
    prepareArguments: (raw) => normalizeArguments(raw) as never,
    executionMode: "sequential",
    async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
      const normalized = normalizeArguments(params);
      if (ctx.mode !== "tui") {
        const payload: AskUserPayload = { cancelled: true, answers: [] };
        return {
          content: [{ type: "text", text: JSON.stringify(payload) }],
          details: detailsFor(normalized, payload),
        };
      }
      const panelParams = {
        question: normalized.question ?? "",
        header: normalized.header,
        tab: normalized.tab || "Answer",
        options: normalized.options ?? [],
        multiSelect: normalized.multiSelect === true,
      };
      const payload = await ctx.ui.custom<AskUserPayload>(
        (tui, theme, _keybindings, done) =>
          new AskUserPanel(panelParams, done, tui, {
            accent: (text) => theme.fg("accent", text),
            bold: (text) => theme.bold(text),
            muted: (text) => theme.fg("muted", text),
            borderColor: (text) => theme.fg("accent", text),
            selectList: {
              selectedPrefix: (text) => theme.fg("accent", text),
              selectedText: (text) => theme.fg("accent", text),
              description: (text) => theme.fg("muted", text),
              scrollInfo: (text) => theme.fg("dim", text),
              noMatch: (text) => theme.fg("warning", text),
            },
          }),
        { overlay: false },
      );
      return {
        content: [{ type: "text", text: JSON.stringify(payload) }],
        details: detailsFor(panelParams, payload),
      };
    },
  });
}
