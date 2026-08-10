import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import {
  Editor,
  Markdown,
  type DefaultTextStyle,
  type EditorTheme,
  type MarkdownTheme,
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
  recommended?: boolean;
}

interface PanelTheme extends EditorTheme {
  accent: (text: string) => string;
  bold: (text: string) => string;
  muted: (text: string) => string;
  markdown: MarkdownTheme;
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
    recommended: Type.Optional(Type.Boolean({ description: "Mark this option as recommended/default." })),
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
    ...(input.recommended === true ? { recommended: true } : {}),
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

function isPipeTableDivider(line: string): boolean {
  return /^\s*\|?\s*:?-{3,}:?\s*(?:\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(line);
}

function splitPipeTableRow(line: string): string[] {
  const trimmed = line.trim().replace(/^\||\|$/g, "");
  return trimmed.split("|").map((cell) => cell.trim());
}

class AskUserPanel implements Component, Focusable {
  private readonly editor: Editor;
  private readonly selected = new Set<string>();
  private optionIndex = 0;
  private editing = true;
  private pristine = true;
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

  private effectiveDefaults(): Option[] {
    const recommended = this.params.options.filter((option) => option.recommended);
    if (this.params.multiSelect ? recommended.length : recommended.length === 1) return recommended;
    return this.params.options[0] ? [this.params.options[0]] : [];
  }

  private displayOptions(): Option[] {
    const defaults = this.effectiveDefaults();
    return [...defaults, ...this.params.options.filter((option) => !defaults.includes(option))];
  }

  private visibleOptions(): Option[] {
    return fuzzyFilter(this.displayOptions(), this.editor.getText(), (option) => `${option.label} ${option.description ?? ""}`);
  }

  private refresh(tui: { requestRender(): void }): void {
    this.cachedWidth = undefined;
    this.cachedLines = undefined;
    tui.requestRender();
  }

  private finishDefaults(): void {
    const defaults = this.effectiveDefaults();
    if (!defaults.length) return;
    this.editor.setText("");
    if (this.params.multiSelect) {
      this.onDone({ cancelled: false, answers: [{ tab: this.params.tab, answers: defaults.map((option) => option.label) }] });
      return;
    }
    this.onDone({ cancelled: false, answers: [{ tab: this.params.tab, answer: defaults[0].label }] });
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
    if (matchesKey(data, Key.escape)) {
      this.onDone({ cancelled: true, answers: [] });
      return;
    }
    if (this.pristine && matchesKey(data, Key.enter) && this.params.options.length) {
      this.finishDefaults();
      return;
    }
    if (!matchesKey(data, Key.enter)) this.pristine = false;
    if (this.editing) {
      if (matchesKey(data, Key.down) && options.length) {
        this.editing = false;
        this.editor.focused = false;
        this.optionIndex = 0;
        this.refresh(this.tui);
        return;
      }
      if (!this.params.multiSelect && options.length === 1 && matchesKey(data, Key.enter)) {
        this.finishOption(options[0]);
        return;
      }
      this.editor.handleInput(data);
      this.refresh(this.tui);
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
    lines.push(
      ...this.renderMarkdown(this.params.question || "What would you like to do?", contentWidth, {
        color: this.theme.accent,
        bold: true,
      }),
    );
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
        const previewLines = this.renderMarkdown(preview, rightWidth);
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
          for (const line of this.renderMarkdown(preview, contentWidth - 2)) add(`  ${line}`);
        }
      }
    } else {
      add(this.theme.muted("No matching options — press Enter to submit free text."));
    }

    add("");
    const hint = this.params.multiSelect
      ? "Type to filter · ↓ choices · ↑ answer · Space toggle · Enter default/submit · Esc cancel"
      : "Type to answer · ↓ choices · ↑ answer · Enter default/sole match · Esc cancel";
    add(this.theme.muted(hint));
    this.cachedWidth = width;
    this.cachedLines = this.frame(lines, renderWidth, contentWidth);
    return this.cachedLines;
  }

  private renderMarkdown(text: string, width: number, defaultTextStyle?: DefaultTextStyle): string[] {
    const renderWidth = Math.max(1, width);
    const sourceLines = text.split("\n");
    const lines: string[] = [];
    const markdownLines: string[] = [];
    let inFence = false;
    const flushMarkdown = () => {
      if (!markdownLines.length) return;
      lines.push(...new Markdown(markdownLines.join("\n"), 0, 0, this.theme.markdown, defaultTextStyle).render(renderWidth));
      markdownLines.length = 0;
    };

    for (let index = 0; index < sourceLines.length; index++) {
      const line = sourceLines[index];
      if (/^\s*(```|~~~)/.test(line)) inFence = !inFence;
      if (!inFence && index + 1 < sourceLines.length && line.includes("|") && isPipeTableDivider(sourceLines[index + 1])) {
        flushMarkdown();
        const rows = [splitPipeTableRow(line)];
        index += 2;
        while (index < sourceLines.length && sourceLines[index].includes("|")) {
          rows.push(splitPipeTableRow(sourceLines[index]));
          index++;
        }
        index--;
        lines.push(...this.renderPipeTable(rows, renderWidth, defaultTextStyle));
        if (sourceLines[index + 1]?.trim()) lines.push("");
        continue;
      }
      markdownLines.push(line);
    }
    flushMarkdown();
    return lines;
  }

  private renderPipeTable(rows: string[][], width: number, defaultTextStyle?: DefaultTextStyle): string[] {
    const columnCount = Math.max(...rows.map((row) => row.length));
    if (!columnCount || width < columnCount * 2 + 1) return new Markdown(rows.map((row) => row.join(" | ")).join("\n"), 0, 0, this.theme.markdown, defaultTextStyle).render(Math.max(1, width));
    const boxed = width >= columnCount * 4 + 1;
    const cellWidth = boxed ? width - (columnCount * 3 + 1) : width - (columnCount + 1);
    const columnWidths = Array.from({ length: columnCount }, (_, index) => Math.floor(cellWidth / columnCount) + (index < cellWidth % columnCount ? 1 : 0));
    const cell = (text: string, column: number, header = false) => {
      const sourceWidth = Math.max(1, visibleWidth(text));
      const rendered = new Markdown(text, 0, 0, this.theme.markdown, defaultTextStyle).render(sourceWidth).join(" ").trimEnd();
      const truncated = truncateToWidth(rendered, columnWidths[column], "...", true);
      return header ? this.theme.bold(truncated) : truncated;
    };
    const row = (cells: string[], header = false) => {
      const rendered = columnWidths.map((_, index) => cell(cells[index] ?? "", index, header));
      return boxed ? `│ ${rendered.join(" │ ")} │` : `|${rendered.join("|")}|`;
    };
    if (!boxed) {
      const divider = `|${columnWidths.map((columnWidth) => "-".repeat(columnWidth)).join("|")}|`;
      return [row(rows[0], true), divider, ...rows.slice(1).map((cells) => row(cells))];
    }
    const dividerCells = columnWidths.map((columnWidth) => "─".repeat(columnWidth));
    const divider = `├─${dividerCells.join("─┼─")}─┤`;
    return [
      `┌─${dividerCells.join("─┬─")}─┐`,
      row(rows[0], true),
      divider,
      ...rows.slice(1).flatMap((cells, index) => (index ? [divider, row(cells)] : [row(cells)])),
      `└─${dividerCells.join("─┴─")}─┘`,
    ];
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
    const defaults = this.effectiveDefaults();
    const hasExplicitRecommendation = this.params.options.some((option) => option.recommended);
    for (const [index, option] of options.entries()) {
      const focused = this.editing
        ? !this.params.multiSelect && options.length === 1
        : index === this.optionIndex;
      const selected = this.selected.has(option.label);
      const marker = focused ? ">" : " ";
      const checkbox = this.params.multiSelect ? (selected ? "[x] " : "[ ] ") : "";
      const recommendation = option.recommended
        ? this.theme.accent(" - recommended")
        : !hasExplicitRecommendation && defaults.includes(option)
          ? this.theme.accent(" - default")
          : "";
      const optionPrefix = `${marker} ${checkbox}`;
      const labelWidth = Math.max(1, width - visibleWidth(optionPrefix) - visibleWidth(recommendation));
      for (const [lineIndex, line] of this.renderMarkdown(option.label, labelWidth, { bold: true }).entries()) {
        lines.push(`${lineIndex === 0 ? optionPrefix : " ".repeat(visibleWidth(optionPrefix))}${line.trimEnd()}${lineIndex === 0 ? recommendation : ""}`);
      }
      if (option.description) {
        for (const line of this.renderMarkdown(option.description, width - 4, { color: this.theme.muted })) lines.push(`    ${line}`);
      }
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
      "Use ask_user when a brief user choice, recommendation approval, preference, or clarification is needed before continuing, including selecting presented alternatives; do not replace it with a prose question. Ask dependent questions one at a time.",
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
            markdown: {
              heading: (text) => theme.fg("accent", theme.bold(text)),
              link: (text) => theme.fg("accent", text),
              linkUrl: (text) => theme.fg("muted", text),
              code: (text) => theme.fg("warning", text),
              codeBlock: (text) => theme.fg("warning", text),
              codeBlockBorder: (text) => theme.fg("muted", text),
              quote: (text) => theme.fg("muted", text),
              quoteBorder: (text) => theme.fg("muted", text),
              hr: (text) => theme.fg("muted", text),
              listBullet: (text) => theme.fg("accent", text),
              bold: (text) => theme.bold(text),
              italic: (text) => theme.fg("accent", text),
              strikethrough: (text) => theme.fg("muted", text),
              underline: (text) => theme.fg("accent", text),
            },
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
